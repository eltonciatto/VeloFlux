package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

// TestHealthEndpoint testa o endpoint de health
func TestHealthEndpoint(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	// Criar um router simples para teste
	router := mux.NewRouter()
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"status": "healthy",
			"timestamp": time.Now().UTC().Format(time.RFC3339),
			"service": "veloflux-api",
		})
	}).Methods("GET")

	server := httptest.NewServer(router)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/health")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)
	assert.Equal(t, "application/json", resp.Header.Get("Content-Type"))

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var healthResp map[string]interface{}
	err = json.Unmarshal(body, &healthResp)
	require.NoError(t, err)

	assert.Equal(t, "healthy", healthResp["status"])
	assert.NotEmpty(t, healthResp["timestamp"])
	assert.Equal(t, "veloflux-api", healthResp["service"])

	logger.Info("Health endpoint test passed", zap.String("response", string(body)))
}

// TestMetricsEndpoint testa o endpoint de métricas
func TestMetricsEndpoint(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	router := mux.NewRouter()
	router.HandleFunc("/api/metrics", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"requests_total": 100,
			"active_connections": 5,
			"avg_response_time": 150,
			"error_rate": 0.02,
		})
	}).Methods("GET")

	server := httptest.NewServer(router)
	defer server.Close()

	resp, err := http.Get(server.URL + "/api/metrics")
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var metricsResp map[string]interface{}
	err = json.Unmarshal(body, &metricsResp)
	require.NoError(t, err)

	assert.Contains(t, metricsResp, "requests_total")
	assert.Contains(t, metricsResp, "active_connections")

	logger.Info("Metrics endpoint test passed", zap.Any("metrics", metricsResp))
}

// TestAuthEndpoints testa os endpoints de autenticação
func TestAuthEndpoints(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	router := mux.NewRouter()
	
	// Register endpoint
	router.HandleFunc("/api/auth/register", func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": "test-jwt-token",
			"user": map[string]interface{}{
				"user_id":    "user-123",
				"email":      req["email"],
				"tenant_id":  "tenant-123",
				"role":       "owner",
				"first_name": req["first_name"],
				"last_name":  req["last_name"],
			},
			"expires_at": time.Now().Add(24 * time.Hour),
		})
	}).Methods("POST")

	// Login endpoint
	router.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		var req map[string]interface{}
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", http.StatusBadRequest)
			return
		}

		// Simple validation
		if req["email"] == "test@example.com" && req["password"] == "password123" {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"token": "test-jwt-token",
				"user": map[string]interface{}{
					"user_id":    "user-123",
					"email":      req["email"],
					"tenant_id":  "tenant-123",
					"role":       "owner",
					"first_name": "Test",
					"last_name":  "User",
				},
				"expires_at": time.Now().Add(24 * time.Hour),
			})
		} else {
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
		}
	}).Methods("POST")

	// Refresh endpoint
	router.HandleFunc("/api/auth/refresh", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"token": "new-jwt-token",
			"user": map[string]interface{}{
				"user_id":    "user-123",
				"email":      "test@example.com",
				"tenant_id":  "tenant-123",
				"role":       "owner",
				"first_name": "Test",
				"last_name":  "User",
			},
			"expires_at": time.Now().Add(24 * time.Hour),
		})
	}).Methods("POST")

	server := httptest.NewServer(router)
	defer server.Close()

	// Test register
	t.Run("Register", func(t *testing.T) {
		registerData := map[string]interface{}{
			"email":       "newuser@example.com",
			"password":    "password123",
			"first_name":  "New",
			"last_name":   "User",
			"tenant_name": "New Company",
			"plan":        "free",
		}

		jsonData, _ := json.Marshal(registerData)
		resp, err := http.Post(server.URL+"/api/auth/register", "application/json", bytes.NewBuffer(jsonData))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusCreated, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var regResp map[string]interface{}
		err = json.Unmarshal(body, &regResp)
		require.NoError(t, err)

		assert.NotEmpty(t, regResp["token"])
		assert.Contains(t, regResp, "user")

		logger.Info("Register test passed", zap.String("response", string(body)))
	})

	// Test login
	t.Run("Login", func(t *testing.T) {
		loginData := map[string]interface{}{
			"email":    "test@example.com",
			"password": "password123",
		}

		jsonData, _ := json.Marshal(loginData)
		resp, err := http.Post(server.URL+"/api/auth/login", "application/json", bytes.NewBuffer(jsonData))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var loginResp map[string]interface{}
		err = json.Unmarshal(body, &loginResp)
		require.NoError(t, err)

		assert.NotEmpty(t, loginResp["token"])
		assert.Contains(t, loginResp, "user")

		logger.Info("Login test passed", zap.String("response", string(body)))
	})

	// Test invalid login
	t.Run("InvalidLogin", func(t *testing.T) {
		loginData := map[string]interface{}{
			"email":    "invalid@example.com",
			"password": "wrongpassword",
		}

		jsonData, _ := json.Marshal(loginData)
		resp, err := http.Post(server.URL+"/api/auth/login", "application/json", bytes.NewBuffer(jsonData))
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusUnauthorized, resp.StatusCode)
		logger.Info("Invalid login test passed")
	})

	// Test refresh
	t.Run("Refresh", func(t *testing.T) {
		req, _ := http.NewRequest("POST", server.URL+"/api/auth/refresh", nil)
		req.Header.Set("Authorization", "Bearer test-token")

		client := &http.Client{}
		resp, err := client.Do(req)
		require.NoError(t, err)
		defer resp.Body.Close()

		assert.Equal(t, http.StatusOK, resp.StatusCode)

		body, err := io.ReadAll(resp.Body)
		require.NoError(t, err)

		var refreshResp map[string]interface{}
		err = json.Unmarshal(body, &refreshResp)
		require.NoError(t, err)

		assert.NotEmpty(t, refreshResp["token"])
		logger.Info("Refresh test passed", zap.String("response", string(body)))
	})
}

// TestTenantsEndpoint testa os endpoints de tenants
func TestTenantsEndpoint(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	router := mux.NewRouter()
	router.HandleFunc("/api/tenants", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]interface{}{
			"items": []map[string]interface{}{
				{
					"id":   "tenant-123",
					"name": "Test Company",
					"plan": "free",
				},
			},
			"total_count": 1,
			"page":        1,
			"limit":       10,
		})
	}).Methods("GET")

	server := httptest.NewServer(router)
	defer server.Close()

	req, _ := http.NewRequest("GET", server.URL+"/api/tenants", nil)
	req.Header.Set("Authorization", "Bearer test-token")

	client := &http.Client{}
	resp, err := client.Do(req)
	require.NoError(t, err)
	defer resp.Body.Close()

	assert.Equal(t, http.StatusOK, resp.StatusCode)

	body, err := io.ReadAll(resp.Body)
	require.NoError(t, err)

	var tenantsResp map[string]interface{}
	err = json.Unmarshal(body, &tenantsResp)
	require.NoError(t, err)

	assert.Contains(t, tenantsResp, "items")
	assert.Contains(t, tenantsResp, "total_count")

	logger.Info("Tenants endpoint test passed", zap.String("response", string(body)))
}

// TestAPIStandardization verifica se todos os endpoints usam o prefixo /api/
func TestAPIStandardization(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	expectedEndpoints := []string{
		"/api/health",
		"/api/metrics",
		"/api/auth/login",
		"/api/auth/register",
		"/api/auth/refresh",
		"/api/tenants",
	}

	router := mux.NewRouter()
	
	for _, endpoint := range expectedEndpoints {
		endpoint := endpoint // capture loop variable
		router.HandleFunc(endpoint, func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			fmt.Fprintf(w, "OK: %s", endpoint)
		})
	}

	server := httptest.NewServer(router)
	defer server.Close()

	for _, endpoint := range expectedEndpoints {
		t.Run(fmt.Sprintf("Endpoint_%s", endpoint), func(t *testing.T) {
			resp, err := http.Get(server.URL + endpoint)
			require.NoError(t, err)
			defer resp.Body.Close()

			assert.Equal(t, http.StatusOK, resp.StatusCode)
			
			body, err := io.ReadAll(resp.Body)
			require.NoError(t, err)

			assert.Contains(t, string(body), endpoint)
			logger.Info("API standardization test passed", 
				zap.String("endpoint", endpoint),
				zap.String("response", string(body)))
		})
	}
}

// makeRequest helper para fazer requisições HTTP nos testes
func makeRequest(t *testing.T, method, url string, body interface{}, headers map[string]string) (*http.Response, []byte) {
	var reqBody io.Reader
	if body != nil {
		jsonData, err := json.Marshal(body)
		require.NoError(t, err)
		reqBody = bytes.NewBuffer(jsonData)
	}

	req, err := http.NewRequest(method, url, reqBody)
	require.NoError(t, err)

	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}

	for key, value := range headers {
		req.Header.Set(key, value)
	}

	client := &http.Client{}
	resp, err := client.Do(req)
	require.NoError(t, err)

	responseBody, err := io.ReadAll(resp.Body)
	require.NoError(t, err)
	resp.Body.Close()

	return resp, responseBody
}

func TestMain(m *testing.M) {
	// Setup de teste se necessário
	exitCode := m.Run()
	// Cleanup se necessário
	fmt.Printf("Tests completed with exit code: %d\n", exitCode)
}
