package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

// TestAIAPICompatibility testa compatibilidade das APIs de IA com o frontend
func TestAIAPICompatibility(t *testing.T) {
	// Setup
	logger, _ := zap.NewDevelopment()
	cfg := &config.Config{
		Global: config.GlobalConfig{
			AI: config.AIConfig{
				Enabled:             true,
				ModelType:           "neural_network",
				ConfidenceThreshold: 0.7,
				ApplicationAware:    true,
				PredictiveScaling:   true,
				LearningRate:        0.01,
				ExplorationRate:     0.1,
			},
		},
	}

	api := &API{
		config: cfg,
		logger: logger,
	}

	tests := []struct {
		name           string
		endpoint       string
		method         string
		body           string
		expectedStatus int
		checkResponse  func(t *testing.T, body []byte)
	}{
		{
			name:           "GET /api/ai/metrics",
			endpoint:       "/api/ai/metrics",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var metrics AIMetrics
				err := json.Unmarshal(body, &metrics)
				assert.NoError(t, err)
				assert.True(t, metrics.Enabled)
				assert.NotEmpty(t, metrics.CurrentAlgorithm)
				assert.NotZero(t, metrics.LastUpdate)
			},
		},
		{
			name:           "GET /api/ai/predictions",
			endpoint:       "/api/ai/predictions",
			method:         "GET",
			expectedStatus: http.StatusServiceUnavailable, // No adaptive balancer in test
		},
		{
			name:           "GET /api/ai/models",
			endpoint:       "/api/ai/models",
			method:         "GET",
			expectedStatus: http.StatusServiceUnavailable, // No adaptive balancer in test
		},
		{
			name:           "GET /api/ai/config",
			endpoint:       "/api/ai/config",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var config AIConfigUpdate
				err := json.Unmarshal(body, &config)
				assert.NoError(t, err)
				assert.True(t, config.Enabled)
				assert.Equal(t, "neural_network", config.ModelType)
				assert.Equal(t, 0.7, config.ConfidenceThreshold)
			},
		},
		{
			name:           "GET /api/ai/health",
			endpoint:       "/api/ai/health",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var health map[string]interface{}
				err := json.Unmarshal(body, &health)
				assert.NoError(t, err)
				assert.Contains(t, health, "status")
				assert.Contains(t, health, "models")
				assert.Contains(t, health, "timestamp")
			},
		},
		{
			name:           "GET /api/ai/history",
			endpoint:       "/api/ai/history?range=1h",
			method:         "GET",
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var history map[string]interface{}
				err := json.Unmarshal(body, &history)
				assert.NoError(t, err)
				assert.Contains(t, history, "accuracy_history")
				assert.Contains(t, history, "confidence_history")
				assert.Contains(t, history, "algorithm_usage")
			},
		},
		{
			name:           "PUT /api/ai/config",
			endpoint:       "/api/ai/config",
			method:         "PUT",
			body:           `{"enabled": true, "model_type": "linear_regression"}`,
			expectedStatus: http.StatusOK,
			checkResponse: func(t *testing.T, body []byte) {
				var response map[string]string
				err := json.Unmarshal(body, &response)
				assert.NoError(t, err)
				assert.Equal(t, "updated", response["status"])
			},
		},
		{
			name:           "POST /api/ai/retrain",
			endpoint:       "/api/ai/retrain",
			method:         "POST",
			body:           `{}`,
			expectedStatus: http.StatusServiceUnavailable, // No adaptive balancer in test
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var req *http.Request
			var err error

			if tt.body != "" {
				req, err = http.NewRequest(tt.method, tt.endpoint, strings.NewReader(tt.body))
				req.Header.Set("Content-Type", "application/json")
			} else {
				req, err = http.NewRequest(tt.method, tt.endpoint, nil)
			}
			assert.NoError(t, err)

			rr := httptest.NewRecorder()

			// Route the request to the appropriate handler
			switch tt.endpoint {
			case "/api/ai/metrics":
				api.getAIMetrics(rr, req)
			case "/api/ai/predictions":
				api.getAIPredictions(rr, req)
			case "/api/ai/models":
				api.getModelStatus(rr, req)
			case "/api/ai/config":
				if tt.method == "GET" {
					api.getAIConfig(rr, req)
				} else {
					api.updateAIConfig(rr, req)
				}
			case "/api/ai/health":
				api.getAIHealth(rr, req)
			case "/api/ai/history?range=1h":
				api.getAIHistory(rr, req)
			case "/api/ai/retrain":
				api.retrainGenericModel(rr, req)
			default:
				t.Fatalf("Unknown endpoint: %s", tt.endpoint)
			}

			assert.Equal(t, tt.expectedStatus, rr.Code)

			if tt.checkResponse != nil && rr.Code == http.StatusOK {
				tt.checkResponse(t, rr.Body.Bytes())
			}
		})
	}
}

// TestAIAPIJSONStructure testa estruturas JSON específicas esperadas pelo frontend
func TestAIAPIJSONStructure(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	cfg := &config.Config{
		Global: config.GlobalConfig{
			AI: config.AIConfig{
				Enabled:             true,
				ModelType:           "neural_network",
				ConfidenceThreshold: 0.7,
				ApplicationAware:    true,
			},
		},
	}

	api := &API{
		config: cfg,
		logger: logger,
	}

	t.Run("AIMetrics Structure", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/ai/metrics", nil)
		rr := httptest.NewRecorder()
		
		api.getAIMetrics(rr, req)
		
		assert.Equal(t, http.StatusOK, rr.Code)
		
		var metrics AIMetrics
		err := json.Unmarshal(rr.Body.Bytes(), &metrics)
		assert.NoError(t, err)
		
		// Verificar campos obrigatórios esperados pelo frontend
		assert.IsType(t, true, metrics.Enabled)
		assert.IsType(t, "", metrics.CurrentAlgorithm)
		assert.NotNil(t, metrics.ModelPerformance)
		assert.NotNil(t, metrics.RecentRequests)
		assert.NotNil(t, metrics.AlgorithmStats)
		
		// Verificar que são inicializados corretamente
		assert.IsType(t, map[string]ModelPerformance{}, metrics.ModelPerformance)
		assert.IsType(t, []RequestMetric{}, metrics.RecentRequests)
		assert.IsType(t, map[string]AlgorithmStats{}, metrics.AlgorithmStats)
	})

	t.Run("AIConfig Structure", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/ai/config", nil)
		rr := httptest.NewRecorder()
		
		api.getAIConfig(rr, req)
		
		assert.Equal(t, http.StatusOK, rr.Code)
		
		var config AIConfigUpdate
		err := json.Unmarshal(rr.Body.Bytes(), &config)
		assert.NoError(t, err)
		
		// Verificar campos obrigatórios esperados pelo frontend
		assert.IsType(t, true, config.Enabled)
		assert.IsType(t, "", config.ModelType)
		assert.IsType(t, 0.0, config.ConfidenceThreshold)
		assert.IsType(t, true, config.ApplicationAware)
	})

	t.Run("AIHealth Structure", func(t *testing.T) {
		req, _ := http.NewRequest("GET", "/api/ai/health", nil)
		rr := httptest.NewRecorder()
		
		api.getAIHealth(rr, req)
		
		assert.Equal(t, http.StatusOK, rr.Code)
		
		var health map[string]interface{}
		err := json.Unmarshal(rr.Body.Bytes(), &health)
		assert.NoError(t, err)
		
		// Verificar campos obrigatórios esperados pelo frontend
		assert.Contains(t, health, "status")
		assert.Contains(t, health, "models")
		assert.Contains(t, health, "last_prediction")
		assert.Contains(t, health, "timestamp")
		
		// Verificar tipos
		assert.IsType(t, "", health["status"])
		// models pode ser []interface{} quando vazio no JSON, aceitar ambos tipos
		models := health["models"]
		assert.True(t, models != nil, "models should not be nil")
	})
}
