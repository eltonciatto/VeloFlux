
package router

import (
	"context"
	"fmt"
	"net"
	"net/http"
	"net/http/httputil"
	"net/url"
	"strings"
	"time"

	"github.com/gorilla/mux"
	"github.com/skypilot/lb/internal/balancer"
	"github.com/skypilot/lb/internal/config"
	"github.com/skypilot/lb/internal/ratelimit"
	"go.uber.org/zap"
)

type Router struct {
	config      *config.Config
	balancer    *balancer.Balancer
	rateLimiter *ratelimit.Limiter
	logger      *zap.Logger
	router      *mux.Router
}

func New(cfg *config.Config, bal *balancer.Balancer, logger *zap.Logger) *Router {
	r := &Router{
		config:      cfg,
		balancer:    bal,
		rateLimiter: ratelimit.New(cfg.Global.RateLimit),
		logger:      logger,
		router:      mux.NewRouter(),
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

		// Call next handler
		next.ServeHTTP(wrapped, req)

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
	return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
		clientIP := r.getClientIP(req)
		sessionID := r.getSessionID(req)

		backend, err := r.balancer.GetBackend(poolName, clientIP, sessionID)
		if err != nil {
			r.logger.Error("Failed to get backend", zap.Error(err))
			http.Error(w, "Service unavailable", http.StatusServiceUnavailable)
			return
		}

		// Increment connection count
		r.balancer.IncrementConnections(poolName, backend.Address)
		defer r.balancer.DecrementConnections(poolName, backend.Address)

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
			// Set sticky session cookie if enabled
			if r.isStickySessions(poolName) {
				cookie := &http.Cookie{
					Name:     "skypilot",
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

		proxy.ServeHTTP(w, req)
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
	if cookie, err := req.Cookie("skypilot"); err == nil {
		return cookie.Value
	}
	return ""
}

func (r *Router) getScheme(req *http.Request) string {
	if req.TLS != nil {
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
