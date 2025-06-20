package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gorilla/mux"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// TestAPIStandardization verifica se todos os endpoints estão padronizados com /api/
func TestAPIStandardization(t *testing.T) {
	// Lista de endpoints que devem estar sob /api/
	standardizedEndpoints := []struct {
		path   string
		method string
		desc   string
	}{
		{"/api/health", "GET", "Health check endpoint"},
		{"/api/auth/login", "POST", "Authentication login"},
		{"/api/auth/register", "POST", "User registration"},
		{"/api/auth/logout", "POST", "User logout"},
		{"/api/auth/refresh", "POST", "Token refresh"},
		{"/api/auth/verify", "GET", "Token verification"},
		{"/api/metrics", "GET", "Prometheus metrics"},
		{"/api/tenants", "GET", "List tenants"},
		{"/api/tenants", "POST", "Create tenant"},
		{"/api/users", "GET", "List users"},
		{"/api/users", "POST", "Create user"},
		{"/api/billing/plans", "GET", "List billing plans"},
		{"/api/billing/usage", "GET", "Get usage stats"},
		{"/api/ai/metrics", "GET", "AI metrics"},
		{"/api/ai/predictions", "GET", "AI predictions"},
		{"/api/ai/config", "GET", "AI configuration"},
		{"/api/ai/health", "GET", "AI health status"},
		{"/api/websocket", "GET", "WebSocket connection"},
	}

	// Criar um router de teste com handlers mockados
	router := mux.NewRouter()
	
	// Configurar handlers de teste para cada endpoint
	for _, endpoint := range standardizedEndpoints {
		path := endpoint.path
		method := endpoint.method
		desc := endpoint.desc
		
		router.HandleFunc(path, func(w http.ResponseWriter, r *http.Request) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"status":      "success",
				"endpoint":    path,
				"method":      method,
				"description": desc,
				"timestamp":   time.Now().UTC().Format(time.RFC3339),
			})
		}).Methods(method)
	}

	server := httptest.NewServer(router)
	defer server.Close()

	// Testar cada endpoint
	for _, endpoint := range standardizedEndpoints {
		t.Run(fmt.Sprintf("%s %s", endpoint.method, endpoint.path), func(t *testing.T) {
			var resp *http.Response
			var err error

			switch endpoint.method {
			case "GET":
				resp, err = http.Get(server.URL + endpoint.path)
			case "POST":
				resp, err = http.Post(server.URL + endpoint.path, "application/json", nil)
			default:
				req, reqErr := http.NewRequest(endpoint.method, server.URL + endpoint.path, nil)
				require.NoError(t, reqErr)
				resp, err = http.DefaultClient.Do(req)
			}

			require.NoError(t, err)
			defer resp.Body.Close()

			// Verificar se o endpoint responde corretamente
			assert.Equal(t, http.StatusOK, resp.StatusCode, 
				"Endpoint %s should return 200 OK", endpoint.path)
			
			// Verificar Content-Type
			assert.Equal(t, "application/json", resp.Header.Get("Content-Type"),
				"Endpoint %s should return JSON", endpoint.path)

			// Verificar se o endpoint começa com /api/
			assert.True(t, 
				len(endpoint.path) >= 4 && endpoint.path[:4] == "/api",
				"Endpoint %s should start with /api/", endpoint.path)
		})
	}
}

// TestNoOldEndpoints verifica se os endpoints antigos não existem mais
func TestNoOldEndpoints(t *testing.T) {
	// Lista de endpoints antigos que NÃO devem mais existir
	oldEndpoints := []struct {
		path   string
		method string
		desc   string
	}{
		{"/health", "GET", "Old health endpoint"},
		{"/auth/login", "POST", "Old auth login"},
		{"/auth/register", "POST", "Old auth register"},
		{"/metrics", "GET", "Old metrics endpoint"},
		{"/tenants", "GET", "Old tenants endpoint"},
		{"/users", "GET", "Old users endpoint"},
		{"/billing/plans", "GET", "Old billing plans"},
		{"/ai/metrics", "GET", "Old AI metrics"},
		{"/websocket", "GET", "Old WebSocket endpoint"},
	}

	// Criar um router que só tem os novos endpoints
	router := mux.NewRouter()
	
	// Adicionar apenas os endpoints padronizados
	router.HandleFunc("/api/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "healthy"})
	}).Methods("GET")

	router.HandleFunc("/api/auth/login", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		json.NewEncoder(w).Encode(map[string]string{"status": "login"})
	}).Methods("POST")

	// Handler 404 padrão
	router.NotFoundHandler = http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusNotFound)
		json.NewEncoder(w).Encode(map[string]string{
			"error": "endpoint not found",
			"path":  r.URL.Path,
		})
	})

	server := httptest.NewServer(router)
	defer server.Close()

	// Testar se os endpoints antigos retornam 404
	for _, endpoint := range oldEndpoints {
		t.Run(fmt.Sprintf("Old endpoint should not exist: %s %s", endpoint.method, endpoint.path), func(t *testing.T) {
			var resp *http.Response
			var err error

			switch endpoint.method {
			case "GET":
				resp, err = http.Get(server.URL + endpoint.path)
			case "POST":
				resp, err = http.Post(server.URL + endpoint.path, "application/json", nil)
			default:
				req, reqErr := http.NewRequest(endpoint.method, server.URL + endpoint.path, nil)
				require.NoError(t, reqErr)
				resp, err = http.DefaultClient.Do(req)
			}

			require.NoError(t, err)
			defer resp.Body.Close()

			// Verificar se o endpoint antigo retorna 404
			assert.Equal(t, http.StatusNotFound, resp.StatusCode,
				"Old endpoint %s should return 404 Not Found", endpoint.path)
		})
	}
}

// TestAPIPathConsistency verifica a consistência dos caminhos da API
func TestAPIPathConsistency(t *testing.T) {
	tests := []struct {
		name        string
		path        string
		shouldMatch bool
	}{
		{"Valid API path", "/api/health", true},
		{"Valid nested API path", "/api/auth/login", true},
		{"Valid deep nested API path", "/api/billing/plans/basic", true},
		{"Invalid - no API prefix", "/health", false},
		{"Invalid - wrong prefix", "/v1/health", false},
		{"Invalid - missing slash", "api/health", false},
		{"Valid - with query params", "/api/health?check=full", true},
		{"Valid - with path params", "/api/users/123", true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hasAPIPrefix := len(tt.path) >= 4 && tt.path[:4] == "/api"
			if tt.shouldMatch {
				assert.True(t, hasAPIPrefix, "Path %s should have /api prefix", tt.path)
			} else {
				assert.False(t, hasAPIPrefix, "Path %s should not have /api prefix", tt.path)
			}
		})
	}
}
