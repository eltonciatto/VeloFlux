package server

import (
	"context"
	"crypto/tls"
	"net/http"
	"time"

	"github.com/eltonciatto/veloflux/internal/admin"
	"github.com/eltonciatto/veloflux/internal/api"
	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/clustering"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/geo"
	"github.com/eltonciatto/veloflux/internal/health"
	"github.com/eltonciatto/veloflux/internal/metrics"
	"github.com/eltonciatto/veloflux/internal/router"
	"go.uber.org/zap"
	"golang.org/x/crypto/acme/autocert"
)

type Server struct {
	config        *config.Config
	logger        *zap.Logger
	balancer      *balancer.Balancer
	router        *router.Router
	healthCheck   *health.Checker
	httpServer    *http.Server
	httpsServer   *http.Server
	metricsServer *http.Server
	apiServer     *api.API
	adminServer   *admin.Server
	cluster       *clustering.Cluster
	geoManager    *geo.Manager
}

func New(cfg *config.Config, logger *zap.Logger) (*Server, error) {
	// Initialize clustering if enabled
	var clusterManager *clustering.Cluster
	if cfg.Cluster.Enabled {
		var err error
		clusterCfg := (*clustering.ClusterConfig)(&cfg.Cluster)
		clusterManager, err = clustering.New(clusterCfg, logger)
		if err != nil {
			logger.Error("Failed to initialize clustering", zap.Error(err))
			// Don't return error, continue without clustering
		}
	}

	// Initialize geo manager
	geoManager, err := geo.New(cfg, logger)
	if err != nil {
		logger.Error("Failed to initialize geo manager", zap.Error(err))
		// Don't return error, continue without geo routing
	}

	// Create balancer and add pools
	bal := balancer.New()
	for _, pool := range cfg.Pools {
		bal.AddPool(pool)
	}

	// Set geo manager in balancer if available
	if geoManager != nil {
		bal.SetGeoManager(geoManager)
	}

	nodeID := "standalone"
	if clusterManager != nil {
		nodeID = clusterManager.NodeID()
	}
	// Create router
	rtr := router.New(cfg, bal, nodeID, logger)

	// Create health checker
	healthChecker := health.New(cfg, logger, bal)

	// Create HTTP servers
	httpServer := &http.Server{
		Addr:         cfg.Global.BindAddress,
		Handler:      rtr,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	httpsServer := &http.Server{
		Addr:         cfg.Global.TLSBindAddress,
		Handler:      rtr,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Setup TLS if enabled
	if cfg.Global.TLS.AutoCert {
		certManager := &autocert.Manager{
			Prompt: autocert.AcceptTOS,
			Email:  cfg.Global.TLS.ACMEEmail,
			Cache:  autocert.DirCache(cfg.Global.TLS.CertDir),
		}

		httpsServer.TLSConfig = &tls.Config{
			GetCertificate: certManager.GetCertificate,
			NextProtos:     []string{"h2", "http/1.1"},
		}
	}

	// Metrics server
	metricsServer := &http.Server{
		Addr:    cfg.Global.MetricsAddress,
		Handler: metrics.Handler(),
	}

	// Create API server
	apiServer := api.New(cfg, bal, clusterManager, logger)
	// Create Admin server
	adminServer := admin.New(cfg, bal, clusterManager, logger)

	return &Server{
		config:        cfg,
		logger:        logger,
		balancer:      bal,
		router:        rtr,
		healthCheck:   healthChecker,
		httpServer:    httpServer,
		httpsServer:   httpsServer,
		metricsServer: metricsServer,
		apiServer:     apiServer,
		adminServer:   adminServer,
		cluster:       clusterManager,
		geoManager:    geoManager,
	}, nil
}

func (s *Server) Start(ctx context.Context) error {
	// Start clustering if enabled
	if s.cluster != nil {
		if err := s.cluster.Start(ctx); err != nil {
			s.logger.Error("Failed to start cluster", zap.Error(err))
			// Continue without clustering
		}

		// Set node address for cluster discovery
		s.cluster.SetNodeAddress(s.config.Global.BindAddress)
	}

	// Start health checker
	s.healthCheck.Start(ctx)

	// Start API server
	if s.apiServer != nil {
		if err := s.apiServer.Start(); err != nil {
			s.logger.Error("Failed to start API server", zap.Error(err))
		}
	}

	// Start Admin server
	if s.adminServer != nil {
		if err := s.adminServer.Start(); err != nil {
			s.logger.Error("Failed to start admin API", zap.Error(err))
		}
	}

	// Start metrics server
	go func() {
		s.logger.Info("Starting metrics server", zap.String("address", s.config.Global.MetricsAddress))
		if err := s.metricsServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error("Metrics server error", zap.Error(err))
		}
	}()

	// Start HTTP server
	go func() {
		s.logger.Info("Starting HTTP server", zap.String("address", s.config.Global.BindAddress))
		if err := s.httpServer.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			s.logger.Error("HTTP server error", zap.Error(err))
		}
	}()

	// Start HTTPS server if TLS is configured
	if s.config.Global.TLS.AutoCert {
		go func() {
			s.logger.Info("Starting HTTPS server", zap.String("address", s.config.Global.TLSBindAddress))
			if err := s.httpsServer.ListenAndServeTLS("", ""); err != nil && err != http.ErrServerClosed {
				s.logger.Error("HTTPS server error", zap.Error(err))
			}
		}()
	}

	// Block until context is cancelled
	<-ctx.Done()
	return nil
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Info("Shutting down servers")

	// Stop health checker
	s.healthCheck.Stop()

	// Stop API server
	if s.apiServer != nil {
		if err := s.apiServer.Stop(ctx); err != nil {
			s.logger.Error("Error shutting down API server", zap.Error(err))
		}
	}
	if s.adminServer != nil {
		if err := s.adminServer.Stop(ctx); err != nil {
			s.logger.Error("Error shutting down admin API", zap.Error(err))
		}
	}

	// Stop cluster
	if s.cluster != nil {
		if err := s.cluster.Stop(); err != nil {
			s.logger.Error("Error shutting down cluster", zap.Error(err))
		}
	}

	// Close geo manager
	if s.geoManager != nil {
		s.geoManager.Close()
	}

	// Shutdown HTTP servers
	if err := s.httpServer.Shutdown(ctx); err != nil {
		s.logger.Error("Error shutting down HTTP server", zap.Error(err))
	}

	if err := s.httpsServer.Shutdown(ctx); err != nil {
		s.logger.Error("Error shutting down HTTPS server", zap.Error(err))
	}

	if err := s.metricsServer.Shutdown(ctx); err != nil {
		s.logger.Error("Error shutting down metrics server", zap.Error(err))
	}

	return nil
}
