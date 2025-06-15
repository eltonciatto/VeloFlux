package health

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"go.uber.org/zap"
)

// MockBackendHealthUpdater is a mock implementation of BackendHealthUpdater
type MockBackendHealthUpdater struct {
	mock.Mock
}

func (m *MockBackendHealthUpdater) UpdateBackendHealth(poolName, backendAddress string, healthy bool) {
	m.Called(poolName, backendAddress, healthy)
}

func TestNew(t *testing.T) {
	cfg := &config.Config{}
	logger := zap.NewNop()
	updater := &MockBackendHealthUpdater{}

	checker := New(cfg, logger, updater)

	assert.NotNil(t, checker)
	assert.Equal(t, cfg, checker.config)
	assert.Equal(t, logger, checker.logger)
	assert.Equal(t, updater, checker.updater)
	assert.NotNil(t, checker.stopChan)
}

func TestBackendStatus(t *testing.T) {
	status := &BackendStatus{
		Address:      "192.168.1.10:8080",
		Pool:         "web-pool",
		Healthy:      true,
		LastCheck:    time.Now(),
		FailureCount: 0,
		ResponseTime: 50 * time.Millisecond,
	}

	assert.Equal(t, "192.168.1.10:8080", status.Address)
	assert.Equal(t, "web-pool", status.Pool)
	assert.True(t, status.Healthy)
	assert.Equal(t, 0, status.FailureCount)
	assert.Equal(t, 50*time.Millisecond, status.ResponseTime)
	assert.WithinDuration(t, time.Now(), status.LastCheck, time.Second)
}

func TestPerformHealthCheck_Healthy(t *testing.T) {
	// Create a test server that returns 200 OK
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))
	defer testServer.Close()

	cfg := &config.Config{}
	logger := zap.NewNop()
	updater := &MockBackendHealthUpdater{}

	checker := New(cfg, logger, updater)

	// Extract address from test server URL (remove http://)
	address := testServer.URL[7:]

	// Test health check
	healthy := checker.performHealthCheck(address, "/", 5*time.Second, http.StatusOK)

	assert.True(t, healthy)
}

func TestPerformHealthCheck_Unhealthy(t *testing.T) {
	// Create a test server that returns 500 error
	testServer := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("Internal Server Error"))
	}))
	defer testServer.Close()

	cfg := &config.Config{}
	logger := zap.NewNop()
	updater := &MockBackendHealthUpdater{}

	checker := New(cfg, logger, updater)

	// Extract address from test server URL (remove http://)
	address := testServer.URL[7:]

	// Test health check expecting 200 but getting 500
	healthy := checker.performHealthCheck(address, "/", 5*time.Second, http.StatusOK)

	assert.False(t, healthy)
}

func TestPassiveCheck(t *testing.T) {
	cfg := &config.Config{}
	logger := zap.NewNop()
	updater := &MockBackendHealthUpdater{}

	checker := New(cfg, logger, updater)

	// Test passive check for successful response
	checker.PassiveCheck("web-pool", "backend1", 200, 100*time.Millisecond)

	// Test passive check for error response
	checker.PassiveCheck("web-pool", "backend1", 500, 100*time.Millisecond)

	// Test passive check with slow response
	checker.PassiveCheck("web-pool", "backend1", 200, 15*time.Second)
}

func TestStartAndStop(t *testing.T) {
	cfg := &config.Config{
		Pools: []config.Pool{
			{
				Name: "test-pool",
				Backends: []config.Backend{
					{
						Address: "localhost:8080",
						HealthCheck: config.HealthCheck{
							Path:     "/health",
							Timeout:  1 * time.Second,
							Interval: 100 * time.Millisecond,
						},
					},
				},
			},
		},
	}

	logger := zap.NewNop()
	updater := &MockBackendHealthUpdater{}
	
	// Set up expectations for the mock
	updater.On("UpdateBackendHealth", "test-pool", "localhost:8080", false).Return()
	updater.On("UpdateBackendHealth", "test-pool", "localhost:8080", true).Return()
	
	// Create a simplified test that avoids race conditions
	checker := New(cfg, logger, updater)
	
	// Cancel the context immediately to avoid long-running goroutines
	ctx, cancel := context.WithCancel(context.Background())
	
	// Create a channel to synchronize the test
	done := make(chan struct{})
	
	go func() {
		// Start the checker
		checker.Start(ctx)
		close(done)
	}()
	
	// Give it a moment to initialize
	time.Sleep(100 * time.Millisecond)
	
	// Cancel the context and stop the checker
	cancel()
	checker.Stop()
	
	// Wait for the goroutine to finish with timeout
	select {
	case <-done:
		// Test completed successfully
	case <-time.After(2 * time.Second):
		t.Fatal("Test timed out")
	}
}
