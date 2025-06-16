package metrics

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestMetricsHandler(t *testing.T) {
	// First, use the metrics to ensure they appear in the output
	RequestsTotal.WithLabelValues("GET", "200", "test-pool").Inc()
	RequestDuration.WithLabelValues("GET", "test-pool").Observe(0.1)
	ActiveConnections.WithLabelValues("test-backend").Set(5)
	BackendHealth.WithLabelValues("test-pool", "test-backend").Set(1)

	handler := Handler()
	assert.NotNil(t, handler)

	// Create a test HTTP request
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()

	// Execute the handler
	handler.ServeHTTP(w, req)

	// Check response
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Contains(t, w.Header().Get("Content-Type"), "text/plain")

	body := w.Body.String()

	// Verify that our custom metrics are present in the output
	assert.Contains(t, body, "veloflux_requests_total")
	assert.Contains(t, body, "veloflux_request_duration_seconds")
	assert.Contains(t, body, "veloflux_active_connections")
	assert.Contains(t, body, "veloflux_backend_health")
}

func TestRequestsTotal(t *testing.T) {
	// Reset the metric before testing
	RequestsTotal.Reset()

	// Test incrementing the counter
	RequestsTotal.WithLabelValues("GET", "200", "web-pool").Inc()
	RequestsTotal.WithLabelValues("POST", "201", "api-pool").Inc()
	RequestsTotal.WithLabelValues("GET", "404", "web-pool").Inc()

	// Create a test server to get metrics
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	Handler().ServeHTTP(w, req)

	body := w.Body.String()

	// Check that metrics are recorded
	assert.Contains(t, body, `veloflux_requests_total{method="GET",pool="web-pool",status_code="200"} 1`)
	assert.Contains(t, body, `veloflux_requests_total{method="POST",pool="api-pool",status_code="201"} 1`)
	assert.Contains(t, body, `veloflux_requests_total{method="GET",pool="web-pool",status_code="404"} 1`)
}

func TestRequestDuration(t *testing.T) {
	// Reset the metric before testing
	RequestDuration.Reset()

	// Test recording request durations
	RequestDuration.WithLabelValues("GET", "web-pool").Observe(0.1)
	RequestDuration.WithLabelValues("POST", "api-pool").Observe(0.2)
	RequestDuration.WithLabelValues("GET", "web-pool").Observe(0.15)

	// Create a test server to get metrics
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	Handler().ServeHTTP(w, req)

	body := w.Body.String()

	// Check that histogram metrics are recorded
	assert.Contains(t, body, "veloflux_request_duration_seconds")
	assert.Contains(t, body, `method="GET"`)
	assert.Contains(t, body, `method="POST"`)
	assert.Contains(t, body, `pool="web-pool"`)
	assert.Contains(t, body, `pool="api-pool"`)
}

func TestActiveConnections(t *testing.T) {
	// Reset the metric before testing
	ActiveConnections.Reset()

	// Test setting active connections
	ActiveConnections.WithLabelValues("backend1").Set(5)
	ActiveConnections.WithLabelValues("backend2").Set(10)
	ActiveConnections.WithLabelValues("backend1").Inc() // Should be 6 now

	// Create a test server to get metrics
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	Handler().ServeHTTP(w, req)

	body := w.Body.String()

	// Check that gauge metrics are recorded
	assert.Contains(t, body, `veloflux_active_connections{backend="backend1"} 6`)
	assert.Contains(t, body, `veloflux_active_connections{backend="backend2"} 10`)
}

func TestBackendHealth(t *testing.T) {
	// Reset the metric before testing
	BackendHealth.Reset()

	// Test setting backend health status
	BackendHealth.WithLabelValues("web-pool", "backend1").Set(1) // Healthy
	BackendHealth.WithLabelValues("web-pool", "backend2").Set(0) // Unhealthy
	BackendHealth.WithLabelValues("api-pool", "backend3").Set(1) // Healthy

	// Create a test server to get metrics
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	Handler().ServeHTTP(w, req)

	body := w.Body.String()

	// Check that health metrics are recorded
	assert.Contains(t, body, `veloflux_backend_health{backend="backend1",pool="web-pool"} 1`)
	assert.Contains(t, body, `veloflux_backend_health{backend="backend2",pool="web-pool"} 0`)
	assert.Contains(t, body, `veloflux_backend_health{backend="backend3",pool="api-pool"} 1`)
}

func TestMetricsInit(t *testing.T) {
	// Test that all metrics are properly registered
	// We can't easily test the init() function directly, but we can verify
	// that the metrics work as expected, which implies they were registered

	// This test verifies that all metrics can be used without panicking
	assert.NotPanics(t, func() {
		RequestsTotal.WithLabelValues("GET", "200", "test").Inc()
		RequestDuration.WithLabelValues("GET", "test").Observe(0.1)
		ActiveConnections.WithLabelValues("test").Set(1)
		BackendHealth.WithLabelValues("test", "test").Set(1)
	})
}

func TestMetricsLabels(t *testing.T) {
	// Test that metrics have the expected labels

	// Test RequestsTotal labels
	assert.NotPanics(t, func() {
		RequestsTotal.WithLabelValues("GET", "200", "pool1").Inc()
	})

	// Test RequestDuration labels
	assert.NotPanics(t, func() {
		RequestDuration.WithLabelValues("POST", "pool2").Observe(0.5)
	})

	// Test ActiveConnections labels
	assert.NotPanics(t, func() {
		ActiveConnections.WithLabelValues("backend1").Set(5)
	})

	// Test BackendHealth labels
	assert.NotPanics(t, func() {
		BackendHealth.WithLabelValues("pool1", "backend1").Set(1)
	})
}

func TestMetricsReset(t *testing.T) {
	// Test that metrics can be reset
	RequestsTotal.WithLabelValues("GET", "200", "test").Inc()
	RequestsTotal.Reset()

	// After reset, metrics should start from zero again
	req := httptest.NewRequest("GET", "/metrics", nil)
	w := httptest.NewRecorder()
	Handler().ServeHTTP(w, req)

	body := w.Body.String()

	// After reset, we shouldn't see the previous value
	// (Note: In a real scenario, you might want more sophisticated testing)
	assert.NotContains(t, body, `veloflux_requests_total{method="GET",pool="test",status_code="200"} 1`)
}
