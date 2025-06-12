
package server

import (
	"context"
	"crypto/tls"
	"net/http"
	"time"

	"github.com/skypilot/lb/internal/balancer"
	"github.com/skypilot/lb/internal/config"
	"github.com/skypilot/lb/internal/health"
	"github.com/skypilot/lb/internal/metrics"
	"github.com/skypilot/lb/internal/router"
	"go.uber.org/zap"
	"golang.org/x/crypto/acme/autocert"
)

type Server struct {
	config      *config.Config
	logger      *zap.Logger
	balancer    *balancer.Balancer
	router      *router.Router
	healthCheck *health.Checker
	httpServer  *http.Server
	httpsServer *http.Server
	metricsServer *http.Server
}

func New(cfg *config.Config, logger *zap.Logger) (*Server, error) {
	// Create balancer and add pools
	bal := balancer.New()
	for _, pool := range cfg.Pools {
		bal.AddPool(pool)
	}

	// Create router
	rtr := router.New(cfg, bal, logger)

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
			Prompt:     autocert.AcceptTOS,
			Email:      cfg.Global.TLS.ACMEEmail,
			Cache:      autocert.DirCache(cfg.Global.TLS.CertDir),
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

	return &Server{
		config:        cfg,
		logger:        logger,
		balancer:      bal,
		router:        rtr,
		healthCheck:   healthChecker,
		httpServer:    httpServer,
		httpsServer:   httpsServer,
		metricsServer: metricsServer,
	}, nil
}

func (s *Server) Start(ctx context.Context) error {
	// Start health checker
	s.healthCheck.Start(ctx)

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
