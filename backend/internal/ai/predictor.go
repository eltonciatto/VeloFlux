// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package ai

import (
	"fmt"
	"math"
	"sync"
	"time"

	"go.uber.org/zap"
)

// TrafficPattern representa padrões de tráfego identificados
type TrafficPattern struct {
	Timestamp    time.Time              `json:"timestamp"`
	RequestRate  float64                `json:"request_rate"`
	ResponseTime float64                `json:"response_time"`
	ErrorRate    float64                `json:"error_rate"`
	Features     map[string]interface{} `json:"features"`
}

// PredictionResult contém resultados de predições do sistema
type PredictionResult struct {
	PredictedLoad     float64   `json:"predicted_load"`
	RecommendedAlgo   string    `json:"recommended_algorithm"`
	Confidence        float64   `json:"confidence"`
	PredictionTime    time.Time `json:"prediction_time"`
	OptimalBackends   []string  `json:"optimal_backends"`
	ScalingRecommend  string    `json:"scaling_recommendation"`
}

// MLModel interface para diferentes tipos de modelos de ML
type MLModel interface {
	Train(patterns []TrafficPattern) error
	Predict(current TrafficPattern) (*PredictionResult, error)
	GetModelInfo() ModelInfo
}

// ModelInfo contém informações sobre o modelo
type ModelInfo struct {
	Type        string    `json:"type"`
	Accuracy    float64   `json:"accuracy"`
	LastTrained time.Time `json:"last_trained"`
	Version     string    `json:"version"`
}

// AIPredictor é o mecanismo principal de IA/ML do VeloFlux
type AIPredictor struct {
	models          map[string]MLModel
	trafficHistory  []TrafficPattern
	currentMetrics  TrafficPattern
	mu              sync.RWMutex
	logger          *zap.Logger
	config          *AIConfig
	learningEnabled bool
}

// AIConfig configurações para o sistema de IA
type AIConfig struct {
	Enabled              bool          `yaml:"enabled"`
	ModelType            string        `yaml:"model_type"` // "neural_network", "linear_regression", "reinforcement_learning"
	TrainingInterval     time.Duration `yaml:"training_interval"`
	PredictionWindow     time.Duration `yaml:"prediction_window"`
	HistoryRetention     time.Duration `yaml:"history_retention"`
	MinDataPoints        int           `yaml:"min_data_points"`
	ConfidenceThreshold  float64       `yaml:"confidence_threshold"`
	AdaptiveAlgorithms   bool          `yaml:"adaptive_algorithms"`
	ApplicationAware     bool          `yaml:"application_aware"`
}

// NewAIPredictor cria uma nova instância do preditor de IA
func NewAIPredictor(config *AIConfig, logger *zap.Logger) *AIPredictor {
	predictor := &AIPredictor{
		models:          make(map[string]MLModel),
		trafficHistory:  make([]TrafficPattern, 0),
		logger:          logger,
		config:          config,
		learningEnabled: config.Enabled,
	}

	if config.Enabled {
		// Inicializar modelos baseados na configuração
		predictor.initializeModels()
		logger.Info("AI Predictor initialized", 
			zap.String("model_type", config.ModelType),
			zap.Bool("adaptive_algorithms", config.AdaptiveAlgorithms))
	}

	return predictor
}

// initializeModels inicializa os modelos de ML baseados na configuração
func (p *AIPredictor) initializeModels() {
	switch p.config.ModelType {
	case "neural_network":
		p.models["traffic_predictor"] = NewNeuralNetworkModel(p.logger)
		p.models["algorithm_selector"] = NewLinearRegressionModel(p.logger) // Placeholder for now
	case "reinforcement_learning":
		p.models["adaptive_balancer"] = NewReinforcementLearningModel(p.logger)
	default:
		p.models["simple_predictor"] = NewLinearRegressionModel(p.logger)
	}
}

// RecordMetrics registra métricas atuais para análise e aprendizado
func (p *AIPredictor) RecordMetrics(requestRate, responseTime, errorRate float64, features map[string]interface{}) {
	if !p.learningEnabled {
		return
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	pattern := TrafficPattern{
		Timestamp:    time.Now(),
		RequestRate:  requestRate,
		ResponseTime: responseTime,
		ErrorRate:    errorRate,
		Features:     features,
	}

	p.trafficHistory = append(p.trafficHistory, pattern)
	p.currentMetrics = pattern

	// Manter apenas o histórico necessário
	p.cleanupHistory()

	// Treinar modelos periodicamente
	if p.shouldRetrain() {
		go p.trainModels()
	}
}

// PredictOptimalStrategy prediz a melhor estratégia de balanceamento
func (p *AIPredictor) PredictOptimalStrategy() (*PredictionResult, error) {
	if !p.learningEnabled {
		return nil, fmt.Errorf("AI predictor is disabled")
	}

	p.mu.RLock()
	defer p.mu.RUnlock()

	if len(p.trafficHistory) < p.config.MinDataPoints {
		return nil, fmt.Errorf("insufficient data points for prediction")
	}

	// Usar o modelo principal para predição
	var result *PredictionResult
	var err error

	if model, exists := p.models["traffic_predictor"]; exists {
		result, err = model.Predict(p.currentMetrics)
	} else if model, exists := p.models["adaptive_balancer"]; exists {
		result, err = model.Predict(p.currentMetrics)
	} else {
		result, err = p.models["simple_predictor"].Predict(p.currentMetrics)
	}

	if err != nil {
		return nil, fmt.Errorf("prediction failed: %w", err)
	}

	p.logger.Debug("AI prediction generated",
		zap.String("algorithm", result.RecommendedAlgo),
		zap.Float64("confidence", result.Confidence),
		zap.Float64("predicted_load", result.PredictedLoad))

	return result, nil
}

// AnalyzeApplicationContext analisa o contexto da aplicação para roteamento inteligente
func (p *AIPredictor) AnalyzeApplicationContext(requestType, contentType, userAgent string, 
	requestSize int64) map[string]interface{} {
	
	if !p.config.ApplicationAware {
		return nil
	}

	context := make(map[string]interface{})
	
	// Análise do tipo de conteúdo
	context["is_static"] = isStaticContent(contentType)
	context["is_api"] = isAPIRequest(requestType)
	context["is_heavy"] = isHeavyRequest(requestSize)
	context["client_type"] = categorizeClient(userAgent)
	
	// Análise de padrões
	context["request_complexity"] = calculateComplexity(requestType, contentType, requestSize)
	
	return context
}

// GetModelPerformance retorna métricas de performance dos modelos
func (p *AIPredictor) GetModelPerformance() map[string]ModelInfo {
	p.mu.RLock()
	defer p.mu.RUnlock()

	performance := make(map[string]ModelInfo)
	for name, model := range p.models {
		performance[name] = model.GetModelInfo()
	}

	return performance
}

// trainModels treina os modelos com os dados históricos
func (p *AIPredictor) trainModels() {
	p.mu.Lock()
	trainingData := make([]TrafficPattern, len(p.trafficHistory))
	copy(trainingData, p.trafficHistory)
	p.mu.Unlock()

	for name, model := range p.models {
		if err := model.Train(trainingData); err != nil {
			p.logger.Error("Failed to train model", 
				zap.String("model", name), 
				zap.Error(err))
		} else {
			p.logger.Info("Model trained successfully", 
				zap.String("model", name),
				zap.Int("data_points", len(trainingData)))
		}
	}
}

// shouldRetrain determina se os modelos devem ser retreinados
func (p *AIPredictor) shouldRetrain() bool {
	return len(p.trafficHistory)%100 == 0 && len(p.trafficHistory) >= p.config.MinDataPoints
}

// cleanupHistory remove dados antigos do histórico
func (p *AIPredictor) cleanupHistory() {
	cutoff := time.Now().Add(-p.config.HistoryRetention)
	
	// Encontrar o índice onde começar a manter os dados
	keepFrom := 0
	for i, pattern := range p.trafficHistory {
		if pattern.Timestamp.After(cutoff) {
			keepFrom = i
			break
		}
	}
	
	// Manter apenas os dados recentes
	if keepFrom > 0 {
		p.trafficHistory = p.trafficHistory[keepFrom:]
	}
}

// Funções auxiliares para análise de contexto de aplicação
func isStaticContent(contentType string) bool {
	staticTypes := []string{"image/", "text/css", "application/javascript", "font/"}
	for _, t := range staticTypes {
		if len(contentType) >= len(t) && contentType[:len(t)] == t {
			return true
		}
	}
	return false
}

func isAPIRequest(requestType string) bool {
	return requestType == "api" || requestType == "graphql" || requestType == "grpc"
}

func isHeavyRequest(size int64) bool {
	return size > 1024*1024 // > 1MB
}

func categorizeClient(userAgent string) string {
	if len(userAgent) == 0 {
		return "unknown"
	}
	
	// Simplificado - pode ser expandido com regex mais sofisticado
	if len(userAgent) > 7 && userAgent[:7] == "Mozilla" {
		return "browser"
	}
	return "client"
}

func calculateComplexity(requestType, contentType string, size int64) float64 {
	complexity := 1.0
	
	if isAPIRequest(requestType) {
		complexity += 0.5
	}
	if isHeavyRequest(size) {
		complexity += 1.0
	}
	if !isStaticContent(contentType) {
		complexity += 0.3
	}
	
	return math.Min(complexity, 5.0) // Cap at 5.0
}
