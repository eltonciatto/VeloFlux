package router

import (
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/drain"
	"github.com/eltonciatto/veloflux/internal/ratelimit"
	"github.com/eltonciatto/veloflux/internal/waf"
	"github.com/go-redis/redis/v8"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
	"github.com/eltonciatto/veloflux/internal/metrics"
)

type Router struct {
	config           *config.Config
	balancer         *balancer.Balancer
	adaptiveBalancer *balancer.AdaptiveBalancer
	rateLimiter      *ratelimit.Limiter
	waf              *waf.WAF
	drain            *drain.Manager
	redis            *redis.Client
	nodeID           string
	logger           *zap.Logger
	router           *mux.Router
}

func New(cfg *config.Config, bal *balancer.Balancer, nodeID string, logger *zap.Logger) *Router {
	wf, err := waf.New(cfg.Global.WAF.RulesetPath)
	if err != nil {
		logger.Error("failed to load WAF rules", zap.Error(err))
	}

	var rc *redis.Client
	if cfg.Cluster.RedisAddress != "" {
		rc = redis.NewClient(&redis.Options{
			Addr:     cfg.Cluster.RedisAddress,
			Password: cfg.Cluster.RedisPassword,
			DB:       cfg.Cluster.RedisDB,
		})
	}

	// Initialize adaptive balancer if AI is enabled
	var adaptiveBal *balancer.AdaptiveBalancer
	if cfg.Global.AI.Enabled {
		adaptiveConfig := &balancer.AdaptiveConfig{
			AIEnabled:           cfg.Global.AI.Enabled,
			AdaptationInterval:  30 * time.Second,
			MinConfidenceLevel:  0.7,
			FallbackAlgorithm:   "round_robin",
			ApplicationAware:    cfg.Global.AI.ApplicationAware,
			PredictiveScaling:   true,
			LearningRate:        0.01,
			ExplorationRate:     0.1,
		}
		
		var err error
		adaptiveBal, err = balancer.NewAdaptiveBalancer(cfg, adaptiveConfig, logger)
		if err != nil {
			logger.Error("failed to create adaptive balancer", zap.Error(err))
			adaptiveBal = nil
		} else {
			logger.Info("Adaptive AI balancer initialized successfully")
		}
	}

	r := &Router{
		config:           cfg,
		balancer:         bal,
		adaptiveBalancer: adaptiveBal,
		rateLimiter:      ratelimit.New(cfg.Global.RateLimit),
		waf:              wf,
		redis:            rc,
		nodeID:           nodeID,
		logger:           logger,
		router:           mux.NewRouter(),
	}

	if rc != nil {
		r.drain = drain.New(rc, nodeID)
	}

	r.setupRoutes()
	return r
}

func (r *Router) setupRoutes() {
	// Setup routes based on configuration
	for _, route := range r.config.Routes {
		handler := r.createProxyHandler(route.Pool)

		routeBuilder := r.router.Host(route.Host)
		if route.PathPrefix != "" {
			routeBuilder = routeBuilder.PathPrefix(route.PathPrefix)
		}

		routeBuilder.Handler(r.middleware(handler))
	}

	// Default handler for unmatched routes
	r.router.NotFoundHandler = http.HandlerFunc(r.notFoundHandler)
}

func (r *Router) middleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		start := time.Now()

		// Extract client IP
		clientIP := r.getClientIP(req)

		// Rate limiting
		if r.rateLimiter != nil && !r.rateLimiter.Allow(clientIP) {
			r.logger.Warn("Rate limit exceeded", zap.String("client_ip", clientIP.String()))
			http.Error(w, "Rate limit exceeded", http.StatusTooManyRequests)
			return
		}

		// Add request ID and logging
		requestID := r.generateRequestID()
		req.Header.Set("X-Request-ID", requestID)

		// Wrap response writer to capture status code
		wrapped := &responseWriter{ResponseWriter: w, statusCode: 200}

		handler := next
		if r.waf != nil {
			handler = r.waf.Middleware(handler)
		}
		if r.drain != nil {
			handler = r.drain.RefuseIfDraining(handler)
			handler = r.drain.Track(handler)
		}

		handler.ServeHTTP(wrapped, req)

		// Log request
		duration := time.Since(start)
		r.logger.Info("Request processed",
			zap.String("method", req.Method),
			zap.String("url", req.URL.String()),
			zap.String("client_ip", clientIP.String()),
			zap.Int("status_code", wrapped.statusCode),
			zap.Duration("duration", duration),
			zap.String("request_id", requestID))
	})
}

func (r *Router) createProxyHandler(poolName string) http.Handler {
    handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
        start := time.Now()
        clientIP := r.getClientIP(req)
        sessionID := r.getSessionID(req)

		start := time.Now()
		clientIP := r.getClientIP(req)
		sessionID := r.getSessionID(req)

		var backend *balancer.Backend
		var err error
		var algorithm string = "traditional"

		// Use adaptive balancer if AI is enabled and available
		if r.adaptiveBalancer != nil && r.config.Global.AI.Enabled {
			backend, err = r.adaptiveBalancer.SelectBackend(req)
			algorithm = r.adaptiveBalancer.GetCurrentStrategy()
			
			r.logger.Debug("Using AI-powered load balancing",
				zap.String("algorithm", algorithm),
				zap.String("pool", poolName))
		} else {
			// Fallback to traditional balancer
			backend, err = r.balancer.GetBackend(poolName, clientIP, sessionID, req)
			algorithm = r.balancer.GetAlgorithm(poolName)
		}

		if err != nil {
			r.logger.Error("Failed to get backend", 
				zap.Error(err),
				zap.String("algorithm", algorithm))
			http.Error(w, "Service unavailable", http.StatusServiceUnavailable)
			return
		}

		// Increment connection count
        // Incrementar contador de conexões
        r.balancer.IncrementConnections(poolName, backend.Address)
        defer r.balancer.DecrementConnections(poolName, backend.Address)
        
        // Atualizar métricas de conexões ativas
        metrics.UpdateActiveConnections(backend.Address, true)
        defer metrics.UpdateActiveConnections(backend.Address, false)
        
        // Atualizar métrica de saúde do backend
        metrics.UpdateBackendHealth(poolName, backend.Address, true)


		// Create reverse proxy
		target, err := url.Parse(fmt.Sprintf("http://%s", backend.Address))
		if err != nil {
			r.logger.Error("Invalid backend URL", zap.Error(err))
			http.Error(w, "Internal server error", http.StatusInternalServerError)
			return
		}

		proxy := httputil.NewSingleHostReverseProxy(target)

		// Customize proxy behavior
		proxy.ModifyResponse = func(resp *http.Response) error {
			// Record metrics for AI learning
			if r.adaptiveBalancer != nil {
				duration := time.Since(start)
				errorRate := 0.0
				if resp.StatusCode >= 400 {
					errorRate = 1.0
				}
				
				features := map[string]interface{}{
					"method":        req.Method,
					"path":          req.URL.Path,
					"content_type":  req.Header.Get("Content-Type"),
					"user_agent":    req.Header.Get("User-Agent"),
					"status_code":   resp.StatusCode,
					"pool":          poolName,
					"backend":       backend.Address,
					"algorithm":     algorithm,
				}
				
				r.adaptiveBalancer.RecordRequestMetrics(
					1.0, // request rate
					float64(duration.Milliseconds()), // response time
					errorRate,
					features,
				)
			}

			// Set sticky session cookie if enabled
			if r.isStickySessions(poolName) {
				cookie := &http.Cookie{
					Name:     "veloflux",
					Value:    backend.Address,
					Path:     "/",
					MaxAge:   3600, // 1 hour
					HttpOnly: true,
					Secure:   req.TLS != nil,
				}
				resp.Header.Add("Set-Cookie", cookie.String())
			}

			return nil
		}

		proxy.ErrorHandler = func(w http.ResponseWriter, req *http.Request, err error) {
			r.logger.Error("Proxy error", zap.Error(err))
			http.Error(w, "Bad gateway", http.StatusBadGateway)
		}

		// Set headers
		req.Header.Set("X-Forwarded-For", clientIP.String())
		req.Header.Set("X-Real-IP", clientIP.String())
		req.Header.Set("X-Forwarded-Proto", r.getScheme(req))

        // Wrapper para capturar métricas
        metricsHandler := metrics.MetricsMiddleware(proxy, poolName)
        metricsHandler.ServeHTTP(w, req)

	})
}

func (r *Router) getClientIP(req *http.Request) net.IP {
	// Check X-Forwarded-For header
	if xff := req.Header.Get("X-Forwarded-For"); xff != "" {
		parts := strings.Split(xff, ",")
		if len(parts) > 0 {
			if ip := net.ParseIP(strings.TrimSpace(parts[0])); ip != nil {
				return ip
			}
		}
	}

	// Check X-Real-IP header
	if xri := req.Header.Get("X-Real-IP"); xri != "" {
		if ip := net.ParseIP(xri); ip != nil {
			return ip
		}
	}

	// Fall back to remote address
	host, _, err := net.SplitHostPort(req.RemoteAddr)
	if err != nil {
		return net.ParseIP(req.RemoteAddr)
	}
	return net.ParseIP(host)
}

func (r *Router) getSessionID(req *http.Request) string {
	if cookie, err := req.Cookie("veloflux"); err == nil {
		return cookie.Value
	}
	return ""
}

func (r *Router) getScheme(req *http.Request) string {
	if req.TLS != nil {
		return "https"
	}
	if proto := req.Header.Get("X-Forwarded-Proto"); proto == "https" {
		return "https"
	}
	return "http"
}

func (r *Router) isStickySessions(poolName string) bool {
	for _, pool := range r.config.Pools {
		if pool.Name == poolName {
			return pool.StickySessions
		}
	}
	return false
}

func (r *Router) generateRequestID() string {
	return fmt.Sprintf("%d", time.Now().UnixNano())
}

func (r *Router) notFoundHandler(w http.ResponseWriter, req *http.Request) {
	http.Error(w, "Not found", http.StatusNotFound)
}

func (r *Router) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.router.ServeHTTP(w, req)
}

type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
