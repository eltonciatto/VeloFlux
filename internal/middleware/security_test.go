package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
)

func TestSecurityHeaders(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "OK")
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Test security headers
	assert.Equal(t, "max-age=31536000; includeSubDomains; preload", w.Header().Get("Strict-Transport-Security"))
	assert.Equal(t, "DENY", w.Header().Get("X-Frame-Options"))
	assert.Equal(t, "nosniff", w.Header().Get("X-Content-Type-Options"))
	assert.Equal(t, "1; mode=block", w.Header().Get("X-XSS-Protection"))
	assert.Equal(t, "strict-origin-when-cross-origin", w.Header().Get("Referrer-Policy"))
	assert.Equal(t, "geolocation=(), microphone=(), camera=()", w.Header().Get("Permissions-Policy"))
	assert.NotEmpty(t, w.Header().Get("Content-Security-Policy"))
}

func TestSecurityHeadersForSensitivePath(t *testing.T) {
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(SecurityHeaders())
	router.GET("/auth/login", func(c *gin.Context) {
		c.String(200, "OK")
	})

	req := httptest.NewRequest("GET", "/auth/login", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Test cache control headers for sensitive paths
	assert.Equal(t, "no-cache, no-store, must-revalidate, private", w.Header().Get("Cache-Control"))
	assert.Equal(t, "no-cache", w.Header().Get("Pragma"))
	assert.Equal(t, "0", w.Header().Get("Expires"))
}

func TestSecureCORS(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecureCORS())
	router.GET("/api/data", func(c *gin.Context) {
		c.String(200, "OK")
	})

	// Test with allowed origin
	req := httptest.NewRequest("GET", "/api/data", nil)
	req.Header.Set("Origin", "https://veloflux.io")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, "https://veloflux.io", w.Header().Get("Access-Control-Allow-Origin"))
	assert.Equal(t, "GET, POST, PUT, DELETE, OPTIONS", w.Header().Get("Access-Control-Allow-Methods"))
	assert.Equal(t, "Content-Type, Authorization, X-CSRF-Token", w.Header().Get("Access-Control-Allow-Headers"))
	assert.Equal(t, "true", w.Header().Get("Access-Control-Allow-Credentials"))
}

func TestSecureCORSWithDisallowedOrigin(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecureCORS())
	router.GET("/api/data", func(c *gin.Context) {
		c.String(200, "OK")
	})

	// Test with disallowed origin
	req := httptest.NewRequest("GET", "/api/data", nil)
	req.Header.Set("Origin", "https://malicious.com")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Should not set CORS headers for disallowed origins
	assert.Empty(t, w.Header().Get("Access-Control-Allow-Origin"))
}

func TestSecureCORSPreflight(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(SecureCORS())
	router.OPTIONS("/api/data", func(c *gin.Context) {
		// This should be handled by the middleware
	})

	// Test OPTIONS preflight request
	req := httptest.NewRequest("OPTIONS", "/api/data", nil)
	req.Header.Set("Origin", "https://veloflux.io")
	req.Header.Set("Access-Control-Request-Method", "POST")
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusNoContent, w.Code)
	assert.Equal(t, "https://veloflux.io", w.Header().Get("Access-Control-Allow-Origin"))
}

func TestRateLimiter(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RateLimiter())
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "OK")
	})

	// Test normal request
	req := httptest.NewRequest("GET", "/test", nil)
	req.RemoteAddr = "192.168.1.1:12345"
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Rate limiter should allow the request (placeholder implementation returns true)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "OK", w.Body.String())
}

func TestRateLimiterLoginPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(RateLimiter())
	router.POST("/auth/login", func(c *gin.Context) {
		c.String(200, "Login OK")
	})

	// Test login endpoint
	req := httptest.NewRequest("POST", "/auth/login", nil)
	req.RemoteAddr = "192.168.1.1:12345"
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	// Rate limiter should allow the request (placeholder implementation returns true)
	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "Login OK", w.Body.String())
}

func TestInputSanitizer(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(InputSanitizer())
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "OK")
	})

	// Test normal request
	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
	assert.Equal(t, "OK", w.Body.String())
}

func TestInputSanitizerSuspiciousPath(t *testing.T) {
	gin.SetMode(gin.TestMode)

	router := gin.New()
	router.Use(InputSanitizer())
	router.GET("/test", func(c *gin.Context) {
		c.String(200, "OK")
	})

	// Test with suspicious path
	req := httptest.NewRequest("GET", "/test/../admin", nil)
	w := httptest.NewRecorder()

	router.ServeHTTP(w, req)

	assert.Equal(t, http.StatusBadRequest, w.Code)
}

func TestBuildCSP(t *testing.T) {
	csp := buildCSP()

	assert.Contains(t, csp, "default-src 'self'")
	assert.Contains(t, csp, "object-src 'none'")
	assert.Contains(t, csp, "frame-ancestors 'none'")
	assert.Contains(t, csp, "upgrade-insecure-requests")
}

func TestIsSensitivePath(t *testing.T) {
	testCases := []struct {
		path      string
		sensitive bool
	}{
		{"/auth/login", true},
		{"/admin/users", true},
		{"/api/profile", true},
		{"/api/billing", true},
		{"/api/tenants", true},
		{"/public/info", false},
		{"/health", false},
	}

	for _, tc := range testCases {
		result := isSensitivePath(tc.path)
		assert.Equal(t, tc.sensitive, result, "Path: %s", tc.path)
	}
}

func TestIsAllowedOrigin(t *testing.T) {
	allowedOrigins := []string{
		"https://veloflux.io",
		"https://admin.veloflux.io",
		"https://app.veloflux.io",
	}

	testCases := []struct {
		origin  string
		allowed bool
	}{
		{"https://veloflux.io", true},
		{"https://admin.veloflux.io", true},
		{"https://app.veloflux.io", true},
		{"https://malicious.com", false},
		{"", false},
		{"http://veloflux.io", false}, // HTTP not allowed
	}

	for _, tc := range testCases {
		result := isAllowedOrigin(tc.origin, allowedOrigins)
		assert.Equal(t, tc.allowed, result, "Origin: %s", tc.origin)
	}
}

func TestContainsSuspiciousPatterns(t *testing.T) {
	testCases := []struct {
		path       string
		suspicious bool
	}{
		{"/normal/path", false},
		{"/api/data", false},
		{"/../etc/passwd", true},
		{"/path/with/<script>", true},
		{"/path/with/javascript:", true},
		{"/SQL/union select", true}, // Space instead of %20
		{"/path/drop table", true},  // Space instead of %20
		{"/normal/Path", false},
	}

	for _, tc := range testCases {
		result := containsSuspiciousPatterns(tc.path)
		assert.Equal(t, tc.suspicious, result, "Path: %s", tc.path)
	}
}

func TestCheckRateLimit(t *testing.T) {
	// Test the placeholder implementation
	result := checkRateLimit("192.168.1.1", "/test", 10, 60)
	assert.True(t, result) // Placeholder always returns true
}
