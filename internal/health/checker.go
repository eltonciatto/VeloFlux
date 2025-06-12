
package health

import (
	"context"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/veloflux/lb/internal/config"
	"go.uber.org/zap"
)

type BackendHealthUpdater interface {
	UpdateBackendHealth(poolName, backendAddress string, healthy bool)
}

type Checker struct {
	config   *config.Config
	logger   *zap.Logger
	updater  BackendHealthUpdater
	stopChan chan struct{}
	wg       sync.WaitGroup
}

type BackendStatus struct {
	Address       string
	Pool          string
	Healthy       bool
	LastCheck     time.Time
	FailureCount  int
	ResponseTime  time.Duration
}

func New(cfg *config.Config, logger *zap.Logger, updater BackendHealthUpdater) *Checker {
	return &Checker{
		config:   cfg,
		logger:   logger,
		updater:  updater,
		stopChan: make(chan struct{}),
	}
}

func (c *Checker) Start(ctx context.Context) {
	c.logger.Info("Starting health checker")

	for _, pool := range c.config.Pools {
		for _, backend := range pool.Backends {
			c.wg.Add(1)
			go c.checkBackend(ctx, pool.Name, backend)
		}
	}
}

func (c *Checker) Stop() {
	c.logger.Info("Stopping health checker")
	close(c.stopChan)
	c.wg.Wait()
}

func (c *Checker) checkBackend(ctx context.Context, poolName string, backend config.Backend) {
	defer c.wg.Done()

	interval := backend.HealthCheck.Interval
	if interval == 0 {
		interval = c.config.Global.HealthCheck.Interval
	}

	timeout := backend.HealthCheck.Timeout
	if timeout == 0 {
		timeout = c.config.Global.HealthCheck.Timeout
	}

	path := backend.HealthCheck.Path
	if path == "" {
		path = "/health"
	}

	expectedStatus := backend.HealthCheck.ExpectedStatus
	if expectedStatus == 0 {
		expectedStatus = 200
	}

	ticker := time.NewTicker(interval)
	defer ticker.Stop()

	failureCount := 0
	maxFailures := c.config.Global.HealthCheck.Retries

	for {
		select {
		case <-ctx.Done():
			return
		case <-c.stopChan:
			return
		case <-ticker.C:
			healthy := c.performHealthCheck(backend.Address, path, timeout, expectedStatus)
			
			if healthy {
				if failureCount > 0 {
					c.logger.Info("Backend recovered",
						zap.String("pool", poolName),
						zap.String("backend", backend.Address))
				}
				failureCount = 0
			} else {
				failureCount++
				c.logger.Warn("Backend health check failed",
					zap.String("pool", poolName),
					zap.String("backend", backend.Address),
					zap.Int("failure_count", failureCount))
			}

			// Mark as unhealthy only after consecutive failures
			backendHealthy := failureCount < maxFailures
			c.updater.UpdateBackendHealth(poolName, backend.Address, backendHealthy)
		}
	}
}

func (c *Checker) performHealthCheck(address, path string, timeout time.Duration, expectedStatus int) bool {
	client := &http.Client{
		Timeout: timeout,
	}

	url := fmt.Sprintf("http://%s%s", address, path)
	
	start := time.Now()
	resp, err := client.Get(url)
	duration := time.Since(start)

	if err != nil {
		c.logger.Debug("Health check request failed",
			zap.String("url", url),
			zap.Error(err),
			zap.Duration("duration", duration))
		return false
	}
	defer resp.Body.Close()

	healthy := resp.StatusCode == expectedStatus
	
	c.logger.Debug("Health check completed",
		zap.String("url", url),
		zap.Int("status_code", resp.StatusCode),
		zap.Int("expected_status", expectedStatus),
		zap.Bool("healthy", healthy),
		zap.Duration("duration", duration))

	return healthy
}

func (c *Checker) PassiveCheck(poolName, backendAddress string, statusCode int, responseTime time.Duration) {
	// Passive health checking based on response codes and latency
	if statusCode >= 500 || responseTime > 10*time.Second {
		c.logger.Warn("Passive health check detected issue",
			zap.String("pool", poolName),
			zap.String("backend", backendAddress),
			zap.Int("status_code", statusCode),
			zap.Duration("response_time", responseTime))
		
		// Could implement more sophisticated passive checking logic here
		// For now, just log the issue
	}
}
