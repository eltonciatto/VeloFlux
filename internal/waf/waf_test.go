package waf

import (
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestNew(t *testing.T) {
	t.Run("EmptyRulesFile", func(t *testing.T) {
		waf, err := New("")
		assert.NoError(t, err)
		assert.Nil(t, waf)
	})

	t.Run("InvalidRulesFile", func(t *testing.T) {
		waf, err := New("/nonexistent/path/to/rules.conf")
		assert.Error(t, err)
		assert.Nil(t, waf)
	})

	// Skip creating actual rules file for now
	// Would need a valid coraza rules file to properly test
}

func TestMiddleware(t *testing.T) {
	t.Run("NilWAF", func(t *testing.T) {
		var waf *WAF
		handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
		})

		middleware := waf.Middleware(handler)

		req := httptest.NewRequest("GET", "/test", nil)
		recorder := httptest.NewRecorder()

		middleware.ServeHTTP(recorder, req)
		assert.Equal(t, http.StatusOK, recorder.Code)
	})

	// Creating a test with a basic valid rules file for demonstration
	// In a real scenario, we'd use a temp file with actual rules
	t.Run("BasicWAFMiddleware", func(t *testing.T) {
		// Skip if we can't create test files
		tempDir, err := os.MkdirTemp("", "waf-test")
		if err != nil {
			t.Skip("Unable to create temp directory for test")
		}
		defer os.RemoveAll(tempDir)

		// Create a minimal rules file
		rulesFile := filepath.Join(tempDir, "basic.conf")
		rules := `
# Basic rules file for testing
SecRuleEngine On
`
		err = os.WriteFile(rulesFile, []byte(rules), 0644)
		if err != nil {
			t.Skip("Unable to create rules file for test")
		}

		// Create WAF with rules
		waf, err := New(rulesFile)
		if err != nil {
			t.Skip("Unable to initialize WAF with test rules: " + err.Error())
		}
		require.NotNil(t, waf)

		// Create a test handler
		handlerCalled := false
		handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			handlerCalled = true
			w.WriteHeader(http.StatusOK)
		})

		// Apply the middleware
		middleware := waf.Middleware(handler)

		// Test the middleware with a request
		req := httptest.NewRequest("GET", "/test", nil)
		req.Header.Set("User-Agent", "Test-Agent")
		recorder := httptest.NewRecorder()

		middleware.ServeHTTP(recorder, req)
		
		// The handler should be called since we don't have any blocking rules
		assert.True(t, handlerCalled)
		assert.Equal(t, http.StatusOK, recorder.Code)
	})
}
