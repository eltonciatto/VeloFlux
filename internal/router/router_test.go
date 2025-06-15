package router

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// Mock balancer.New to avoid dependency issues
func createMockBalancer(cfg *config.Config, logger *zap.Logger) *balancer.Balancer {
	return &balancer.Balancer{}
}

func setupTestRouter(t *testing.T) (*Router, *config.Config) {
	logger, _ := zap.NewDevelopment()
	
	cfg := &config.Config{
		Global: config.GlobalConfig{
			RateLimit: config.RateLimitConfig{
				RequestsPerSecond: 10,
				BurstSize:        20,
			},
		},
		Routes: []config.Route{
			{
				Host:       "example.com",
				PathPrefix: "/api",
				Pool:       "default",
			},
		},
		Pools: []config.Pool{
			{
				Name: "default",
				Backends: []config.Backend{
					{
						Address: "127.0.0.1:8080",
						Weight:  100,
					},
				},
			},
		},
	}
	
	bal := createMockBalancer(cfg, logger)
	
	router := New(cfg, bal, "test-node", logger)
	return router, cfg
}

func TestNew(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("BasicConfiguration", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{},
			Routes: []config.Route{},
			Pools:  []config.Pool{},
		}
		
		bal := createMockBalancer(cfg, logger)
		router := New(cfg, bal, "test-node", logger)
		
		assert.NotNil(t, router)
		assert.NotNil(t, router.router)
		assert.NotNil(t, router.rateLimiter)
		assert.Nil(t, router.drain) // No Redis in config
	})
}

func TestResponseWriter(t *testing.T) {
	rw := &responseWriter{
		ResponseWriter: httptest.NewRecorder(),
		statusCode:     http.StatusOK,
	}
	
	// Test WriteHeader
	rw.WriteHeader(http.StatusNotFound)
	assert.Equal(t, http.StatusNotFound, rw.statusCode)
	
	// Test Header
	header := rw.Header()
	assert.NotNil(t, header)
}

func TestGetSessionID(t *testing.T) {
	router, _ := setupTestRouter(t)
	
	// Test without cookie
	req1 := httptest.NewRequest("GET", "/", nil)
	id1 := router.getSessionID(req1)
	assert.Empty(t, id1) // No cookie = empty session ID
	
	// Test with cookie
	req2 := httptest.NewRequest("GET", "/", nil)
	req2.AddCookie(&http.Cookie{
		Name:  "veloflux",
		Value: "backend1.example.com",
	})
	id2 := router.getSessionID(req2)
	assert.Equal(t, "backend1.example.com", id2)
}

func TestGetScheme(t *testing.T) {
	router, _ := setupTestRouter(t)
	
	// Test HTTP
	req1 := httptest.NewRequest("GET", "http://example.com/", nil)
	scheme1 := router.getScheme(req1)
	assert.Equal(t, "http", scheme1)
	
	// The current implementation doesn't check X-Forwarded-Proto, 
	// so we only test the HTTP and HTTPS cases based on req.TLS
	
	// Note: Can't easily test the HTTPS case with httptest.NewRequest()
	// as it doesn't set up TLS
}

func TestGenerateRequestID(t *testing.T) {
	router, _ := setupTestRouter(t)
	
	id1 := router.generateRequestID()
	id2 := router.generateRequestID()
	
	assert.NotEmpty(t, id1)
	assert.NotEmpty(t, id2)
	assert.NotEqual(t, id1, id2) // IDs should be unique
}

func TestGetClientIP(t *testing.T) {
	router, _ := setupTestRouter(t)
	
	testCases := []struct {
		name     string
		headers  map[string]string
		expected string
	}{
		{
			name: "X-Forwarded-For",
			headers: map[string]string{
				"X-Forwarded-For": "192.168.1.1, 10.0.0.1",
			},
			expected: "192.168.1.1",
		},
		{
			name: "X-Real-IP",
			headers: map[string]string{
				"X-Real-IP": "192.168.1.2",
			},
			expected: "192.168.1.2",
		},
		{
			name:     "RemoteAddr",
			headers:  map[string]string{},
			expected: "192.0.2.1", // Placeholder, will be replaced by remote addr
		},
	}
	
	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := httptest.NewRequest("GET", "http://example.com/", nil)
			req.RemoteAddr = "192.0.2.1:12345" // Set a fake remote address
			
			for k, v := range tc.headers {
				req.Header.Set(k, v)
			}
			
			ip := router.getClientIP(req)
			assert.Equal(t, tc.expected, ip.String())
		})
	}
}

// The following tests require more complex setup and would typically mock
// dependencies like the balancer, redis etc.
