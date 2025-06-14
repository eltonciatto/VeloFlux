package middleware

import (
	"net/http"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

// SecurityHeaders middleware adds security headers to responses
func SecurityHeaders() gin.HandlerFunc {
	return func(c *gin.Context) {
		// HSTS (HTTP Strict Transport Security)
		c.Header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
		
		// Content Security Policy
		csp := buildCSP()
		c.Header("Content-Security-Policy", csp)
		
		// X-Frame-Options to prevent clickjacking
		c.Header("X-Frame-Options", "DENY")
		
		// X-Content-Type-Options to prevent MIME type sniffing
		c.Header("X-Content-Type-Options", "nosniff")
		
		// X-XSS-Protection
		c.Header("X-XSS-Protection", "1; mode=block")
		
		// Referrer Policy
		c.Header("Referrer-Policy", "strict-origin-when-cross-origin")
		
		// Permissions Policy (formerly Feature Policy)
		c.Header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
		
		// Remove server information
		c.Header("Server", "")
		c.Header("X-Powered-By", "")
		
		// Cache control for sensitive pages
		if isSensitivePath(c.Request.URL.Path) {
			c.Header("Cache-Control", "no-cache, no-store, must-revalidate, private")
			c.Header("Pragma", "no-cache")
			c.Header("Expires", "0")
		}
		
		c.Next()
	}
}

// CORS middleware with secure defaults
func SecureCORS() gin.HandlerFunc {
	return func(c *gin.Context) {
		origin := c.Request.Header.Get("Origin")
		
		// Allow only specific origins in production
		allowedOrigins := getAllowedOrigins()
		
		if isAllowedOrigin(origin, allowedOrigins) {
			c.Header("Access-Control-Allow-Origin", origin)
		}
		
		c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
		c.Header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-CSRF-Token")
		c.Header("Access-Control-Allow-Credentials", "true")
		c.Header("Access-Control-Max-Age", "86400") // 24 hours
		
		// Handle preflight requests
		if c.Request.Method == "OPTIONS" {
			c.AbortWithStatus(http.StatusNoContent)
			return
		}
		
		c.Next()
	}
}

// Rate limiting middleware with different limits for different endpoints
func RateLimiter() gin.HandlerFunc {
	return func(c *gin.Context) {
		clientIP := c.ClientIP()
		path := c.Request.URL.Path
		
		// Different rate limits for different endpoints
		var limit int
		var window time.Duration
		
		switch {
		case strings.HasPrefix(path, "/auth/login"):
			limit = 5 // 5 login attempts
			window = 15 * time.Minute
		case strings.HasPrefix(path, "/auth/"):
			limit = 20 // 20 auth requests
			window = time.Minute
		case strings.HasPrefix(path, "/api/"):
			limit = 100 // 100 API requests
			window = time.Minute
		default:
			limit = 200 // 200 general requests
			window = time.Minute
		}
		
		if !checkRateLimit(clientIP, path, limit, window) {
			c.JSON(http.StatusTooManyRequests, gin.H{
				"error": "Rate limit exceeded",
				"retry_after": window.Seconds(),
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// Input validation and sanitization middleware
func InputSanitizer() gin.HandlerFunc {
	return func(c *gin.Context) {
		// Validate Content-Length
		if c.Request.ContentLength > 10*1024*1024 { // 10MB limit
			c.JSON(http.StatusRequestEntityTooLarge, gin.H{
				"error": "Request body too large",
			})
			c.Abort()
			return
		}
		
		// Check for common attack patterns in URL
		if containsSuspiciousPatterns(c.Request.URL.Path) {
			c.JSON(http.StatusBadRequest, gin.H{
				"error": "Invalid request",
			})
			c.Abort()
			return
		}
		
		c.Next()
	}
}

// Helper functions
func buildCSP() string {
	return strings.Join([]string{
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"font-src 'self' https://fonts.gstatic.com",
		"img-src 'self' data: https:",
		"connect-src 'self' wss: ws:",
		"object-src 'none'",
		"base-uri 'self'",
		"form-action 'self'",
		"frame-ancestors 'none'",
		"upgrade-insecure-requests",
	}, "; ")
}

func isSensitivePath(path string) bool {
	sensitivePaths := []string{
		"/auth/",
		"/admin/",
		"/api/profile",
		"/api/billing",
		"/api/tenants",
	}
	
	for _, sensitive := range sensitivePaths {
		if strings.HasPrefix(path, sensitive) {
			return true
		}
	}
	return false
}

func getAllowedOrigins() []string {
	// In production, this should come from configuration
	return []string{
		"https://veloflux.io",
		"https://admin.veloflux.io",
		"https://app.veloflux.io",
		// Add other allowed origins
	}
}

func isAllowedOrigin(origin string, allowed []string) bool {
	if origin == "" {
		return false
	}
	
	for _, allowedOrigin := range allowed {
		if origin == allowedOrigin {
			return true
		}
	}
	return false
}

func checkRateLimit(clientIP, path string, limit int, window time.Duration) bool {
	// This is a simplified implementation
	// In production, use Redis or another distributed store
	// for rate limiting across multiple instances
	
	// Implementation would track requests per IP per endpoint
	// and return false if limit is exceeded
	
	return true // Placeholder
}

func containsSuspiciousPatterns(path string) bool {
	suspiciousPatterns := []string{
		"../",
		"..\\",
		"<script",
		"javascript:",
		"vbscript:",
		"onload=",
		"onerror=",
		"eval(",
		"union select",
		"drop table",
		"insert into",
		"delete from",
	}
	
	lowerPath := strings.ToLower(path)
	for _, pattern := range suspiciousPatterns {
		if strings.Contains(lowerPath, pattern) {
			return true
		}
	}
	return false
}
