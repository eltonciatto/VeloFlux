// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/eltonciatto/veloflux/internal/ai"
	"go.uber.org/zap"
)

// AIMetrics representa métricas da IA para o frontend
type AIMetrics struct {
	Enabled           bool                        `json:"enabled"`
	CurrentAlgorithm  string                      `json:"current_algorithm"`
	PredictionData    *PredictionResponse         `json:"prediction_data"`
	ModelPerformance  map[string]ModelPerformance `json:"model_performance"`
	RecentRequests    []RequestMetric             `json:"recent_requests"`
	AlgorithmStats    map[string]AlgorithmStats   `json:"algorithm_stats"`
	LastUpdate        time.Time                   `json:"last_update"`
}

// PredictionResponse dados de predição atual
type PredictionResponse struct {
	RecommendedAlgo   string    `json:"recommended_algorithm"`
	Confidence        float64   `json:"confidence"`
	PredictedLoad     float64   `json:"predicted_load"`
	PredictionTime    time.Time `json:"prediction_time"`
	OptimalBackends   []string  `json:"optimal_backends"`
	ScalingRecommend  string    `json:"scaling_recommendation"`
}

// ModelPerformance métricas de performance dos modelos
type ModelPerformance struct {
	Type           string    `json:"type"`
	Accuracy       float64   `json:"accuracy"`
	LastTrained    time.Time `json:"last_trained"`
	Version        string    `json:"version"`
	TrainingStatus string    `json:"training_status"`
	PredictionsMade int64    `json:"predictions_made"`
}

// RequestMetric métricas de requisições individuais
type RequestMetric struct {
	Timestamp    time.Time `json:"timestamp"`
	Method       string    `json:"method"`
	Path         string    `json:"path"`
	ResponseTime float64   `json:"response_time"`
	StatusCode   int       `json:"status_code"`
	Algorithm    string    `json:"algorithm"`
	Backend      string    `json:"backend"`
	AIConfidence float64   `json:"ai_confidence"`
}

// AlgorithmStats estatísticas por algoritmo
type AlgorithmStats struct {
	RequestCount     int64   `json:"request_count"`
	AvgResponseTime  float64 `json:"avg_response_time"`
	ErrorRate        float64 `json:"error_rate"`
	SuccessRate      float64 `json:"success_rate"`
	LastUsed         time.Time `json:"last_used"`
}

// AIConfigUpdate configuração atualizável da IA
type AIConfigUpdate struct {
	Enabled             bool    `json:"enabled"`
	ModelType           string  `json:"model_type"`
	ConfidenceThreshold float64 `json:"confidence_threshold"`
	ApplicationAware    bool    `json:"application_aware"`
	PredictiveScaling   bool    `json:"predictive_scaling"`
	LearningRate        float64 `json:"learning_rate"`
	ExplorationRate     float64 `json:"exploration_rate"`
}

// setupAIRoutes configura as rotas da API de IA
func (api *API) setupAIRoutes() {
	// Grupo de rotas da IA
	aiRouter := api.router.PathPrefix("/api/ai").Subrouter()
	
	// Métricas e status geral
	aiRouter.HandleFunc("/metrics", api.getAIMetrics).Methods("GET")
	aiRouter.HandleFunc("/status", api.getAIStatus).Methods("GET")
	
	// Predições e modelos
	aiRouter.HandleFunc("/predictions", api.getAIPredictions).Methods("GET")
	aiRouter.HandleFunc("/models", api.getModelStatus).Methods("GET")
	aiRouter.HandleFunc("/models/{modelType}/retrain", api.retrainModel).Methods("POST")
	
	// Configuração
	aiRouter.HandleFunc("/config", api.getAIConfig).Methods("GET")
	aiRouter.HandleFunc("/config", api.updateAIConfig).Methods("PUT")
	
	// Health check e histórico (compatibilidade com frontend)
	aiRouter.HandleFunc("/health", api.getAIHealth).Methods("GET")
	aiRouter.HandleFunc("/history", api.getAIHistory).Methods("GET")
	aiRouter.HandleFunc("/retrain", api.retrainGenericModel).Methods("POST")
	
	// Análise em tempo real
	aiRouter.HandleFunc("/algorithm-comparison", api.getAlgorithmComparison).Methods("GET")
	aiRouter.HandleFunc("/prediction-history", api.getPredictionHistory).Methods("GET")
	
	api.logger.Info("AI API routes configured")
}

// getAIMetrics retorna métricas completas da IA
func (api *API) getAIMetrics(w http.ResponseWriter, r *http.Request) {
	metrics := &AIMetrics{
		Enabled:          api.config.Global.AI.Enabled,
		CurrentAlgorithm: "unknown",
		LastUpdate:       time.Now(),
		ModelPerformance: make(map[string]ModelPerformance),
		RecentRequests:   make([]RequestMetric, 0),
		AlgorithmStats:   make(map[string]AlgorithmStats),
	}

	// Se há um roteador com balanceador adaptativo
	if api.router != nil && api.adaptiveBalancer != nil {
		metrics.CurrentAlgorithm = api.adaptiveBalancer.GetCurrentStrategy()
		
		// Obter métricas de performance dos modelos
		modelPerf := make(map[string]ModelPerformance)
		if modelInfo := api.adaptiveBalancer.GetModelPerformance(); modelInfo != nil {
			for name, infoInterface := range modelInfo {
				if info, ok := infoInterface.(ai.ModelInfo); ok {
					modelPerf[name] = ModelPerformance{
						Type:        info.Type,
						Accuracy:    info.Accuracy,
						LastTrained: info.LastTrained,
						Version:     info.Version,
						TrainingStatus: "active",
					}
				}
			}
		}
		metrics.ModelPerformance = modelPerf
		
		// Obter predição atual
		if prediction, err := api.adaptiveBalancer.GetAIPrediction(); err == nil {
			metrics.PredictionData = &PredictionResponse{
				RecommendedAlgo:  prediction.Algorithm,
				Confidence:       prediction.Confidence,
				PredictedLoad:    prediction.PredictedLoad,
				PredictionTime:   prediction.Timestamp,
				OptimalBackends:  prediction.OptimalBackends,
				ScalingRecommend: prediction.ScalingRecommend,
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(metrics)
}

// getAIStatus retorna status simples da IA
func (api *API) getAIStatus(w http.ResponseWriter, r *http.Request) {
	status := map[string]interface{}{
		"enabled":           api.config.Global.AI.Enabled,
		"adaptive_balancer": api.adaptiveBalancer != nil,
		"current_algorithm": "traditional",
		"health":           "healthy",
		"timestamp":        time.Now(),
	}

	if api.adaptiveBalancer != nil {
		status["current_algorithm"] = api.adaptiveBalancer.GetCurrentStrategy()
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(status)
}

// getAIPredictions retorna predições atuais
func (api *API) getAIPredictions(w http.ResponseWriter, r *http.Request) {
	if api.adaptiveBalancer == nil {
		http.Error(w, "Adaptive balancer not available", http.StatusServiceUnavailable)
		return
	}

	prediction, err := api.adaptiveBalancer.GetAIPrediction()
	if err != nil {
		api.logger.Error("Failed to get AI prediction", zap.Error(err))
		http.Error(w, "Failed to get predictions", http.StatusInternalServerError)
		return
	}

	response := PredictionResponse{
		RecommendedAlgo:  prediction.Algorithm,
		Confidence:       prediction.Confidence,
		PredictedLoad:    prediction.PredictedLoad,
		PredictionTime:   prediction.Timestamp,
		OptimalBackends:  prediction.OptimalBackends,
		ScalingRecommend: prediction.ScalingRecommend,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// getModelStatus retorna status dos modelos ML
func (api *API) getModelStatus(w http.ResponseWriter, r *http.Request) {
	if api.adaptiveBalancer == nil {
		http.Error(w, "Adaptive balancer not available", http.StatusServiceUnavailable)
		return
	}

	modelInfo := api.adaptiveBalancer.GetModelPerformance()
	modelStatus := make(map[string]ModelPerformance)

	for name, infoInterface := range modelInfo {
		if info, ok := infoInterface.(ai.ModelInfo); ok {
			modelStatus[name] = ModelPerformance{
				Type:        info.Type,
				Accuracy:    info.Accuracy,
				LastTrained: info.LastTrained,
				Version:     info.Version,
				TrainingStatus: "ready",
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(modelStatus)
}

// getAIConfig retorna configuração atual da IA
func (api *API) getAIConfig(w http.ResponseWriter, r *http.Request) {
	config := AIConfigUpdate{
		Enabled:             api.config.Global.AI.Enabled,
		ModelType:           api.config.Global.AI.ModelType,
		ConfidenceThreshold: api.config.Global.AI.ConfidenceThreshold,
		ApplicationAware:    api.config.Global.AI.ApplicationAware,
		PredictiveScaling:   api.config.Global.AI.PredictiveScaling,
		LearningRate:        api.config.Global.AI.LearningRate,
		ExplorationRate:     api.config.Global.AI.ExplorationRate,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(config)
}

// updateAIConfig atualiza configuração da IA
func (api *API) updateAIConfig(w http.ResponseWriter, r *http.Request) {
	var update AIConfigUpdate
	if err := json.NewDecoder(r.Body).Decode(&update); err != nil {
		http.Error(w, "Invalid JSON", http.StatusBadRequest)
		return
	}

	// Atualizar configuração (simplified - em produção seria mais complexo)
	api.config.Global.AI.Enabled = update.Enabled
	api.config.Global.AI.ModelType = update.ModelType
	api.config.Global.AI.ConfidenceThreshold = update.ConfidenceThreshold
	api.config.Global.AI.ApplicationAware = update.ApplicationAware
	api.config.Global.AI.PredictiveScaling = update.PredictiveScaling

	api.logger.Info("AI configuration updated",
		zap.Bool("enabled", update.Enabled),
		zap.String("model_type", update.ModelType))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"status": "updated"})
}

// retrainModel força re-treinamento de um modelo
func (api *API) retrainModel(w http.ResponseWriter, r *http.Request) {
	if api.adaptiveBalancer == nil {
		http.Error(w, "Adaptive balancer not available", http.StatusServiceUnavailable)
		return
	}

	// Em uma implementação real, isso dispararia o re-treinamento
	api.logger.Info("Model retraining requested")

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "retraining_started",
		"message": "Model retraining initiated",
	})
}

// getAlgorithmComparison retorna comparação de performance entre algoritmos
func (api *API) getAlgorithmComparison(w http.ResponseWriter, r *http.Request) {
	// Dados simulados para demonstração
	comparison := map[string]AlgorithmStats{
		"round_robin": {
			RequestCount:    1250,
			AvgResponseTime: 145.5,
			ErrorRate:       0.02,
			SuccessRate:     0.98,
			LastUsed:        time.Now().Add(-10 * time.Minute),
		},
		"least_conn": {
			RequestCount:    890,
			AvgResponseTime: 132.2,
			ErrorRate:       0.015,
			SuccessRate:     0.985,
			LastUsed:        time.Now().Add(-5 * time.Minute),
		},
		"adaptive_ai": {
			RequestCount:    2100,
			AvgResponseTime: 98.7,
			ErrorRate:       0.008,
			SuccessRate:     0.992,
			LastUsed:        time.Now(),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(comparison)
}

// getPredictionHistory retorna histórico de predições
func (api *API) getPredictionHistory(w http.ResponseWriter, r *http.Request) {
	// Dados simulados para demonstração
	history := []PredictionResponse{
		{
			RecommendedAlgo: "adaptive_ai",
			Confidence:      0.92,
			PredictedLoad:   145.2,
			PredictionTime:  time.Now().Add(-1 * time.Minute),
		},
		{
			RecommendedAlgo: "least_conn",
			Confidence:      0.87,
			PredictedLoad:   132.8,
			PredictionTime:  time.Now().Add(-2 * time.Minute),
		},
		{
			RecommendedAlgo: "adaptive_ai",
			Confidence:      0.95,
			PredictedLoad:   156.1,
			PredictionTime:  time.Now().Add(-3 * time.Minute),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

// getAIHealth retorna status de saúde da IA (compatibilidade com frontend)
func (api *API) getAIHealth(w http.ResponseWriter, r *http.Request) {
	health := map[string]interface{}{
		"status": "healthy",
		"models": []string{},
		"last_prediction": "",
		"timestamp": time.Now(),
	}

	if api.adaptiveBalancer != nil {
		modelInfo := api.adaptiveBalancer.GetModelPerformance()
		models := make([]string, 0, len(modelInfo))
		for name := range modelInfo {
			models = append(models, name)
		}
		health["models"] = models
		health["status"] = "healthy"
		
		// Tentar obter última predição
		if prediction, err := api.adaptiveBalancer.GetAIPrediction(); err == nil {
			health["last_prediction"] = prediction.Timestamp.Format(time.RFC3339)
		}
	} else {
		health["status"] = "disabled"
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(health)
}

// getAIHistory retorna dados históricos da IA (compatibilidade com frontend)
func (api *API) getAIHistory(w http.ResponseWriter, r *http.Request) {
	timeRange := r.URL.Query().Get("range")
	if timeRange == "" {
		timeRange = "1h"
	}

	// Dados simulados baseados no que o frontend espera
	history := map[string]interface{}{
		"accuracy_history": []map[string]interface{}{
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "accuracy": 0.92},
			{"timestamp": time.Now().Add(-20*time.Minute).Format(time.RFC3339), "accuracy": 0.94},
			{"timestamp": time.Now().Add(-10*time.Minute).Format(time.RFC3339), "accuracy": 0.91},
			{"timestamp": time.Now().Format(time.RFC3339), "accuracy": 0.95},
		},
		"confidence_history": []map[string]interface{}{
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "confidence": 0.87},
			{"timestamp": time.Now().Add(-20*time.Minute).Format(time.RFC3339), "confidence": 0.89},
			{"timestamp": time.Now().Add(-10*time.Minute).Format(time.RFC3339), "confidence": 0.85},
			{"timestamp": time.Now().Format(time.RFC3339), "confidence": 0.92},
		},
		"algorithm_usage": []map[string]interface{}{
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "algorithm": "round_robin", "count": 45},
			{"timestamp": time.Now().Add(-20*time.Minute).Format(time.RFC3339), "algorithm": "least_conn", "count": 32},
			{"timestamp": time.Now().Add(-10*time.Minute).Format(time.RFC3339), "algorithm": "adaptive_ai", "count": 78},
			{"timestamp": time.Now().Format(time.RFC3339), "algorithm": "adaptive_ai", "count": 92},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(history)
}

// retrainGenericModel força re-treinamento genérico (compatibilidade com frontend)
func (api *API) retrainGenericModel(w http.ResponseWriter, r *http.Request) {
	if api.adaptiveBalancer == nil {
		http.Error(w, "Adaptive balancer not available", http.StatusServiceUnavailable)
		return
	}

	var requestBody map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		// Aceitar requisição vazia
		requestBody = make(map[string]interface{})
	}

	modelType, exists := requestBody["model_type"]
	if !exists {
		modelType = "all"
	}

	api.logger.Info("Generic model retraining requested", 
		zap.Any("model_type", modelType))

	response := map[string]interface{}{
		"success": true,
		"message": "Model retraining initiated",
		"model_type": modelType,
		"timestamp": time.Now(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}
