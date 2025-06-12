
package main

import (
	"context"
	"fmt"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/skypilot/lb/internal/config"
	"github.com/skypilot/lb/internal/server"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
)

func main() {
	// Setup logger
	logConfig := zap.NewProductionConfig()
	logConfig.Level = zap.NewAtomicLevelAt(zapcore.InfoLevel)
	logger, err := logConfig.Build()
	if err != nil {
		fmt.Printf("Failed to initialize logger: %v\n", err)
		os.Exit(1)
	}
	defer logger.Sync()

	// Load configuration
	configPath := os.Getenv("SKY_CONFIG")
	if configPath == "" {
		configPath = "/etc/skypilot/config.yaml"
	}

	cfg, err := config.Load(configPath)
	if err != nil {
		logger.Fatal("Failed to load configuration", zap.Error(err))
	}

	// Create and start server
	srv, err := server.New(cfg, logger)
	if err != nil {
		logger.Fatal("Failed to create server", zap.Error(err))
	}

	// Start server in background
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	go func() {
		if err := srv.Start(ctx); err != nil {
			logger.Fatal("Failed to start server", zap.Error(err))
		}
	}()

	logger.Info("SkyPilot LB started successfully",
		zap.String("version", "1.0.0"),
		zap.String("bind_address", cfg.Global.BindAddress),
		zap.String("tls_bind_address", cfg.Global.TLSBindAddress))

	// Wait for shutdown signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	logger.Info("Received shutdown signal, gracefully shutting down...")

	// Graceful shutdown with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("Error during shutdown", zap.Error(err))
		os.Exit(1)
	}

	logger.Info("Server shut down successfully")
}
