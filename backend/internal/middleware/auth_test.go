package middleware

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
)

func TestAdminAuth(t *testing.T) {
	// Setup test environment variables
	testUser := "admin_user"
	testPass := "admin_pass"
	
	// Save existing environment values to restore later
	originalUser := os.Getenv("VF_ADMIN_USER")
	originalPass := os.Getenv("VF_ADMIN_PASS")
	
	// Set test environment values
	os.Setenv("VF_ADMIN_USER", testUser)
	os.Setenv("VF_ADMIN_PASS", testPass)
	
	// Defer restoration of original environment values
	defer func() {
		os.Setenv("VF_ADMIN_USER", originalUser)
		os.Setenv("VF_ADMIN_PASS", originalPass)
	}()

	// Create a test handler
	testHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("Admin Access Granted"))
	})

	// Wrap the test handler with AdminAuth middleware
	handler := AdminAuth(testHandler)

	// Test cases
	testCases := []struct {
		name       string
		user       string
		pass       string
		wantStatus int
		wantBody   string
	}{
		{
			name:       "Valid credentials",
			user:       testUser,
			pass:       testPass,
			wantStatus: http.StatusOK,
			wantBody:   "Admin Access Granted",
		},
		{
			name:       "Invalid username",
			user:       "wrong_user",
			pass:       testPass,
			wantStatus: http.StatusUnauthorized,
			wantBody:   "",
		},
		{
			name:       "Invalid password",
			user:       testUser,
			pass:       "wrong_pass",
			wantStatus: http.StatusUnauthorized,
			wantBody:   "",
		},
		{
			name:       "No credentials",
			user:       "",
			pass:       "",
			wantStatus: http.StatusUnauthorized,
			wantBody:   "",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			// Create a request with or without basic auth
			req := httptest.NewRequest("GET", "/admin", nil)
			if tc.user != "" || tc.pass != "" {
				req.SetBasicAuth(tc.user, tc.pass)
			}

			// Create a response recorder
			w := httptest.NewRecorder()

			// Serve the request
			handler.ServeHTTP(w, req)

			// Check the response
			assert.Equal(t, tc.wantStatus, w.Code)
			
			if tc.wantStatus == http.StatusOK {
				assert.Equal(t, tc.wantBody, w.Body.String())
			} else {
				assert.Contains(t, w.Header().Get("WWW-Authenticate"), "Basic realm=\"VeloFlux\"")
			}
		})
	}

	// Test with empty environment variables
	t.Run("Empty environment variables", func(t *testing.T) {
		// Temporarily clear the env vars
		os.Setenv("VF_ADMIN_USER", "")
		os.Setenv("VF_ADMIN_PASS", "")

		req := httptest.NewRequest("GET", "/admin", nil)
		req.SetBasicAuth("any_user", "any_pass")
		w := httptest.NewRecorder()

		handler.ServeHTTP(w, req)

		// With empty env vars, no valid credentials exist
		assert.Equal(t, http.StatusUnauthorized, w.Code)
		assert.Contains(t, w.Header().Get("WWW-Authenticate"), "Basic realm=\"VeloFlux\"")

		// Restore test values
		os.Setenv("VF_ADMIN_USER", testUser)
		os.Setenv("VF_ADMIN_PASS", testPass)
	})
}
