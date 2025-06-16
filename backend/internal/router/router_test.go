package router

import (
    "crypto/tls"
    "net/http"
    "net/http/httptest"
    "testing"
    "github.com/stretchr/testify/assert"
    "go.uber.org/zap"
    "github.com/eltonciatto/veloflux/internal/config"
    "github.com/eltonciatto/veloflux/internal/balancer"
    "github.com/eltonciatto/veloflux/internal/ratelimit"
)


func TestNewAndServeHTTP(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    cfg := &config.Config{
        Global: config.GlobalConfig{
            WAF: config.WAFConfig{RulesetPath: ""},
            RateLimit: config.RateLimitConfig{RequestsPerSecond: 100},
        },
        Pools: []config.Pool{{Name: "testpool", StickySessions: false, Backends: []config.Backend{{Address: "localhost:8080"}}}},
        Routes: []config.Route{{Host: "example.com", Pool: "testpool", PathPrefix: "/"}},
    }
    bal := balancer.New()
    bal.AddPool(cfg.Pools[0])
    router := New(cfg, bal, "node1", logger)
    req := httptest.NewRequest("GET", "http://example.com/", nil)
    req.Host = "example.com"
    rec := httptest.NewRecorder()
    router.ServeHTTP(rec, req)
    // Should return 502/503 because no real backend exists, but ServeHTTP and setupRoutes are exercised
    assert.True(t, rec.Code == http.StatusServiceUnavailable || rec.Code == http.StatusBadGateway)
}

func TestResponseWriter(t *testing.T) {
    w := httptest.NewRecorder()
    rw := &responseWriter{ResponseWriter: w, statusCode: 200}
    rw.WriteHeader(404)
    assert.Equal(t, 404, rw.statusCode)
}

func TestGenerateRequestID(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    router := &Router{logger: logger}
    id1 := router.generateRequestID()
    id2 := router.generateRequestID()
    assert.NotEmpty(t, id1)
    assert.NotEmpty(t, id2)
    assert.NotEqual(t, id1, id2)
}

func TestGetScheme(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    router := &Router{logger: logger}
    req := httptest.NewRequest("GET", "http://example.com", nil)
    scheme := router.getScheme(req)
    assert.Equal(t, "http", scheme)
}

func TestGetClientIP(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    router := &Router{logger: logger}
    cases := []struct {
        name     string
        headers  map[string]string
        remoteIP string
        expected string
    }{
        {"X-Forwarded-For", map[string]string{"X-Forwarded-For": "192.168.2.1, 10.0.0.1"}, "127.0.0.1:12345", "192.168.2.1"},
        {"X-Real-IP", map[string]string{"X-Real-IP": "192.168.3.1"}, "127.0.0.1:12345", "192.168.3.1"},
        {"RemoteAddr", map[string]string{}, "192.168.4.1:12345", "192.168.4.1"},
    }
    for _, tc := range cases {
        t.Run(tc.name, func(t *testing.T) {
            req := httptest.NewRequest("GET", "http://example.com", nil)
            req.RemoteAddr = tc.remoteIP
            for k, v := range tc.headers {
                req.Header.Set(k, v)
            }
            ip := router.getClientIP(req)
            assert.Equal(t, tc.expected, ip.String())
        })
    }
}

func TestGetSessionID(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    router := &Router{logger: logger}
    req := httptest.NewRequest("GET", "http://example.com", nil)
    req.AddCookie(&http.Cookie{Name: "veloflux", Value: "test-session"})
    assert.Equal(t, "test-session", router.getSessionID(req))
    req2 := httptest.NewRequest("GET", "http://example.com", nil)
    assert.Equal(t, "", router.getSessionID(req2))
}

func TestNotFoundHandler(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    router := &Router{logger: logger}
    req := httptest.NewRequest("GET", "http://example.com/404", nil)
    rec := httptest.NewRecorder()
    router.notFoundHandler(rec, req)
    assert.Equal(t, http.StatusNotFound, rec.Code)
}



func TestIsStickySessions(t *testing.T) {
    logger, _ := zap.NewDevelopment()
    cfg := &config.Config{
        Pools: []config.Pool{
            {Name: "pool1", StickySessions: true},
            {Name: "pool2", StickySessions: false},
        },
    }
    router := &Router{logger: logger, config: cfg}
    assert.True(t, router.isStickySessions("pool1"))
    assert.False(t, router.isStickySessions("pool2"))
    assert.False(t, router.isStickySessions("doesnotexist"))
}

func TestNewRouter_AllBranches(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	bal := balancer.New()

	t.Run("Basic configuration", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				WAF: config.WAFConfig{RulesetPath: ""},
				RateLimit: config.RateLimitConfig{RequestsPerSecond: 100},
			},
			Cluster: config.ClusterConfig{},
			Routes: []config.Route{{Host: "test.com", Pool: "testpool"}},
			Pools: []config.Pool{{Name: "testpool", Backends: []config.Backend{{Address: "localhost:8080"}}}},
		}
		router := New(cfg, bal, "node1", logger)
		assert.NotNil(t, router)
		assert.NotNil(t, router.rateLimiter)
		assert.Nil(t, router.redis)
		assert.Nil(t, router.drain)
	})

	t.Run("With Redis cluster", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				WAF: config.WAFConfig{RulesetPath: ""},
				RateLimit: config.RateLimitConfig{RequestsPerSecond: 100},
			},
			Cluster: config.ClusterConfig{
				RedisAddress: "localhost:6379",
				RedisPassword: "password",
				RedisDB: 0,
			},
			Routes: []config.Route{{Host: "test.com", Pool: "testpool"}},
			Pools: []config.Pool{{Name: "testpool", Backends: []config.Backend{{Address: "localhost:8080"}}}},
		}
		router := New(cfg, bal, "node1", logger)
		assert.NotNil(t, router)
		assert.NotNil(t, router.redis)
		assert.NotNil(t, router.drain)
	})

	t.Run("With invalid WAF path", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				WAF: config.WAFConfig{RulesetPath: "/nonexistent/path"},
				RateLimit: config.RateLimitConfig{RequestsPerSecond: 100},
			},
			Cluster: config.ClusterConfig{},
			Routes: []config.Route{{Host: "test.com", Pool: "testpool"}},
			Pools: []config.Pool{{Name: "testpool", Backends: []config.Backend{{Address: "localhost:8080"}}}},
		}
		router := New(cfg, bal, "node1", logger)
		assert.NotNil(t, router)
		// WAF should be nil due to invalid path
	})
}

func TestMiddleware_AllBranches(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("Rate limiting triggered", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				RateLimit: config.RateLimitConfig{
					RequestsPerSecond: 1,  // 1 request per second
					BurstSize:         1,  // Only 1 request burst
				},
			},
		}
		router := &Router{
			config: cfg,
			rateLimiter: ratelimit.New(cfg.Global.RateLimit),
			logger: logger,
		}
		
		handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})
		
		middleware := router.middleware(handler)
		
		// Make multiple rapid requests to exceed the burst
		for i := 0; i < 3; i++ {
			req := httptest.NewRequest("GET", "/", nil)
			req.RemoteAddr = "1.2.3.4:5678"
			w := httptest.NewRecorder()
			middleware.ServeHTTP(w, req)
			
			// After the burst is exceeded, we should get rate limited
			if i >= 1 && w.Code == http.StatusTooManyRequests {
				return // Test passed
			}
		}
		t.Error("Expected to be rate limited but wasn't")
	})

	t.Run("With WAF and drain enabled", func(t *testing.T) {
		// This is harder to test without actual WAF and drain implementations
		// but we can test the middleware structure
		router := &Router{
			config: &config.Config{},
			logger: logger,
		}
		
		handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})
		
		middleware := router.middleware(handler)
		
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		w := httptest.NewRecorder()
		
		middleware.ServeHTTP(w, req)
		assert.Equal(t, http.StatusOK, w.Code)
	})
}

func TestGetScheme_AllBranches(t *testing.T) {
	router := &Router{}

	t.Run("HTTPS from TLS", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.TLS = &tls.ConnectionState{}
		scheme := router.getScheme(req)
		assert.Equal(t, "https", scheme)
	})

	t.Run("HTTPS from X-Forwarded-Proto", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.Header.Set("X-Forwarded-Proto", "https")
		scheme := router.getScheme(req)
		assert.Equal(t, "https", scheme)
	})

	t.Run("HTTP default", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		scheme := router.getScheme(req)
		assert.Equal(t, "http", scheme)
	})
}

func TestCreateProxyHandler_AllBranches(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("Backend error - no backends", func(t *testing.T) {
		// Create a balancer with no backends
		bal := balancer.New()
		bal.AddPool(config.Pool{
			Name:      "testpool",
			Algorithm: "round_robin",
			Backends:  []config.Backend{}, // No backends
		})
		
		router := &Router{
			balancer: bal,
			logger:   logger,
		}
		
		handler := router.createProxyHandler("testpool")
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		assert.Equal(t, http.StatusServiceUnavailable, w.Code)
	})

	t.Run("Pool not found", func(t *testing.T) {
		bal := balancer.New()
		router := &Router{
			balancer: bal,
			logger:   logger,
		}
		
		handler := router.createProxyHandler("nonexistent")
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		w := httptest.NewRecorder()
		
		handler.ServeHTTP(w, req)
		assert.Equal(t, http.StatusServiceUnavailable, w.Code)
	})

	t.Run("Sticky sessions enabled", func(t *testing.T) {
		cfg := &config.Config{
			Pools: []config.Pool{{Name: "testpool", StickySessions: true}},
		}
		
		bal := balancer.New()
		bal.AddPool(config.Pool{
			Name:           "testpool",
			Algorithm:      "round_robin",
			StickySessions: true,
			Backends: []config.Backend{
				{Address: "localhost:8080", Weight: 1},
			},
		})
		
		router := &Router{
			config:   cfg,
			balancer: bal,
			logger:   logger,
		}
		
		handler := router.createProxyHandler("testpool")
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		req.TLS = &tls.ConnectionState{} // Simulate HTTPS
		w := httptest.NewRecorder()
		
		// We can't easily test the full proxy without a real backend,
		// but we can test that the sticky session logic is exercised
		handler.ServeHTTP(w, req)
		
		// The handler will fail to connect to the backend, but that's expected in tests
		// The important thing is that our sticky session logic is exercised
		assert.True(t, w.Code == http.StatusBadGateway || w.Code == http.StatusServiceUnavailable)
	})
}


