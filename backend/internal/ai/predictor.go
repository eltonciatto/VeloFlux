// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package ai

import (
	"fmt"
	"math"
	"net"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/geo"
	"go.uber.org/zap"
)

// TrafficPattern representa padrões de tráfego identificados
type TrafficPattern struct {
	Timestamp           time.Time `json:"timestamp"`
	RequestRate         float64   `json:"request_rate"`
	ResponseTime        float64   `json:"response_time"`
	ErrorRate           float64   `json:"error_rate"`
	AverageResponseTime float64   `json:"average_response_time"`

	// Dados Geográficos
	ClientRegion    string  `json:"client_region,omitempty"`
	ClientCountry   string  `json:"client_country,omitempty"`
	ClientLatitude  float64 `json:"client_latitude,omitempty"`
	ClientLongitude float64 `json:"client_longitude,omitempty"`
	GeoDistanceKm   float64 `json:"geo_distance_km,omitempty"`

	// Dados de Backend
	BackendRegion string  `json:"backend_region,omitempty"`
	BackendLoad   float64 `json:"backend_load,omitempty"`

	Features map[string]interface{} `json:"features"`
}

// PredictionResult contém resultados de predições do sistema
type PredictionResult struct {
	Algorithm         string        `json:"algorithm"`
	PredictedLoad     float64       `json:"predicted_load"`
	Confidence        float64       `json:"confidence"`
	ExpectedLoadTime  time.Duration `json:"expected_load_time"`
	RecommendedAction string        `json:"recommended_action"`
	Timestamp         time.Time     `json:"timestamp"`

	// Recomendações Geográficas
	OptimalBackends      []string `json:"optimal_backends"`
	GeoOptimizedBackends []string `json:"geo_optimized_backends,omitempty"`
	ScalingRecommend     string   `json:"scaling_recommendation"`
	GeoAffinityScore     float64  `json:"geo_affinity_score,omitempty"`
	RegionRecommendation string   `json:"region_recommendation,omitempty"`
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
	lastPrediction  time.Time
	geoManager      *geo.Manager
	mu              sync.RWMutex
	logger          *zap.Logger
	config          *AIConfig
	learningEnabled bool
}

// AIConfig configurações para o sistema de IA
type AIConfig struct {
	Enabled             bool          `yaml:"enabled"`
	ModelType           string        `yaml:"model_type"` // "neural_network", "linear_regression", "reinforcement_learning"
	TrainingInterval    time.Duration `yaml:"training_interval"`
	PredictionWindow    time.Duration `yaml:"prediction_window"`
	HistoryRetention    time.Duration `yaml:"history_retention"`
	MinDataPoints       int           `yaml:"min_data_points"`
	ConfidenceThreshold float64       `yaml:"confidence_threshold"`
	AdaptiveAlgorithms  bool          `yaml:"adaptive_algorithms"`
	ApplicationAware    bool          `yaml:"application_aware"`
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
		zap.String("algorithm", result.Algorithm),
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

// Predict executa uma predição usando o padrão de tráfego fornecido
func (p *AIPredictor) Predict(pattern TrafficPattern) (*PredictionResult, error) {
	if !p.learningEnabled {
		return nil, fmt.Errorf("AI predictor is disabled")
	}

	p.mu.Lock()
	defer p.mu.Unlock()

	// Atualizar métricas atuais
	p.currentMetrics = pattern

	// Atualizar timestamp da última predição
	p.lastPrediction = time.Now()

	// Adicionar ao histórico
	p.trafficHistory = append(p.trafficHistory, pattern)

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
	} else if model, exists := p.models["simple_predictor"]; exists {
		result, err = model.Predict(p.currentMetrics)
	} else {
		// Fallback para predição simples
		result = &PredictionResult{
			Algorithm:         "round_robin",
			Confidence:        0.5,
			ExpectedLoadTime:  time.Duration(pattern.AverageResponseTime) * time.Millisecond,
			RecommendedAction: "use_default_algorithm",
			Timestamp:         time.Now(),
		}
	}

	if err != nil {
		p.logger.Error("Prediction failed", zap.Error(err))
		return nil, err
	}

	// Log da predição
	p.logger.Debug("AI Prediction completed",
		zap.String("algorithm", result.Algorithm),
		zap.Float64("confidence", result.Confidence),
		zap.Duration("expected_load_time", result.ExpectedLoadTime))

	return result, nil
}

// GetLastPredictionTime retorna o timestamp da última predição
func (p *AIPredictor) GetLastPredictionTime() time.Time {
	p.mu.RLock()
	defer p.mu.RUnlock()
	return p.lastPrediction
}

// SetGeoManager configura o gerenciador de dados geográficos
func (p *AIPredictor) SetGeoManager(gm *geo.Manager) {
	p.mu.Lock()
	defer p.mu.Unlock()
	p.geoManager = gm
	p.logger.Info("GeoManager configured for AI predictions")
}

// EnrichTrafficPatternWithGeo enriquece o padrão de tráfego com dados geográficos
func (p *AIPredictor) EnrichTrafficPatternWithGeo(pattern *TrafficPattern, clientIP net.IP, backendRegion string) {
	// Sempre definir a região do backend se fornecida
	if backendRegion != "" {
		pattern.BackendRegion = backendRegion
	}

	// Se não temos geoManager ou IP, não podemos fazer mais enriquecimento
	if p.geoManager == nil || clientIP == nil {
		return
	}

	// Obter informações geográficas do cliente
	clientInfo, err := p.geoManager.GetLocationByIP(clientIP)
	if err != nil {
		p.logger.Debug("Failed to get client geo info", zap.Error(err))
		return
	}

	// Enriquecer o padrão com dados geográficos
	pattern.ClientRegion = clientInfo.Region
	pattern.ClientCountry = clientInfo.Country
	pattern.ClientLatitude = clientInfo.Latitude
	pattern.ClientLongitude = clientInfo.Longitude

	// Calcular distância geográfica se temos coordenadas do backend
	if backendRegion != "" {
		pattern.GeoDistanceKm = p.calculateGeoDistance(pattern)
	}

	// Adicionar aos features
	if pattern.Features == nil {
		pattern.Features = make(map[string]interface{})
	}
	pattern.Features["geo_enabled"] = true
	pattern.Features["cross_region"] = pattern.ClientRegion != pattern.BackendRegion
	pattern.Features["geo_distance_km"] = pattern.GeoDistanceKm
}

// calculateGeoDistance calcula a distância geográfica aproximada
func (p *AIPredictor) calculateGeoDistance(pattern *TrafficPattern) float64 {
	// Coordenadas aproximadas de regiões comuns (em produção, usar dados reais)
	regionCoords := map[string][2]float64{
		"us-east-1":      {39.0458, -76.6413},  // Virginia
		"us-west-2":      {45.5152, -122.6784}, // Oregon
		"eu-west-1":      {53.3498, -6.2603},   // Ireland
		"ap-southeast-1": {1.3521, 103.8198},   // Singapore
		"sa-east-1":      {-23.5505, -46.6333}, // São Paulo
	}

	backendCoords, exists := regionCoords[pattern.BackendRegion]
	if !exists {
		return 0
	}

	// Fórmula de Haversine simplificada para distância
	lat1, lon1 := pattern.ClientLatitude, pattern.ClientLongitude
	lat2, lon2 := backendCoords[0], backendCoords[1]

	if lat1 == 0 && lon1 == 0 {
		return 0
	}

	const R = 6371 // Raio da Terra em km

	dLat := (lat2 - lat1) * math.Pi / 180
	dLon := (lon2 - lon1) * math.Pi / 180

	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1*math.Pi/180)*math.Cos(lat2*math.Pi/180)*
			math.Sin(dLon/2)*math.Sin(dLon/2)

	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))

	return R * c
}

// PredictWithGeoContext faz predição considerando contexto geográfico
func (p *AIPredictor) PredictWithGeoContext(pattern TrafficPattern, clientIP net.IP, backendOptions []string) (*PredictionResult, error) {
	if !p.learningEnabled {
		return nil, fmt.Errorf("AI predictor is disabled")
	}

	// Enriquecer com dados geográficos
	enrichedPattern := pattern
	if len(backendOptions) > 0 {
		p.EnrichTrafficPatternWithGeo(&enrichedPattern, clientIP, backendOptions[0])
	}

	// Fazer predição base
	result, err := p.Predict(enrichedPattern)
	if err != nil {
		return nil, err
	}

	// Enriquecer resultado com recomendações geográficas
	if p.geoManager != nil && clientIP != nil {
		result.GeoOptimizedBackends = p.getGeoOptimizedBackends(clientIP, backendOptions)
		result.GeoAffinityScore = p.calculateGeoAffinityScore(enrichedPattern)
		result.RegionRecommendation = p.getRegionRecommendation(enrichedPattern)

		// Ajustar algoritmo baseado na distância geográfica
		if enrichedPattern.GeoDistanceKm > 0 {
			if enrichedPattern.GeoDistanceKm > 5000 { // > 5000km
				result.Algorithm = "geo_proximity"
				result.RecommendedAction = "use_geo_routing"
			} else if enrichedPattern.GeoDistanceKm > 1000 { // 1000-5000km
				result.Algorithm = "weighted_geo"
				result.RecommendedAction = "prefer_regional_backends"
			}
		}
	}

	return result, nil
}

// getGeoOptimizedBackends retorna backends otimizados geograficamente
func (p *AIPredictor) getGeoOptimizedBackends(clientIP net.IP, backendOptions []string) []string {
	if p.geoManager == nil || len(backendOptions) == 0 {
		return backendOptions
	}

	clientInfo, err := p.geoManager.GetLocationByIP(clientIP)
	if err != nil {
		return backendOptions
	}

	// Ordenar backends por proximidade geográfica
	type backendDistance struct {
		backend  string
		distance float64
	}

	var distances []backendDistance

	// Mapeamento simples de backends para regiões (em produção, usar dados reais)
	for _, backend := range backendOptions {
		// Calcular distância baseada na região do cliente
		distance := p.estimateBackendDistance(clientInfo.Region, backend)
		distances = append(distances, backendDistance{backend, distance})
	}

	// Ordenar por distância (bubble sort simples)
	for i := 0; i < len(distances)-1; i++ {
		for j := 0; j < len(distances)-i-1; j++ {
			if distances[j].distance > distances[j+1].distance {
				distances[j], distances[j+1] = distances[j+1], distances[j]
			}
		}
	}

	// Retornar backends ordenados por proximidade
	optimized := make([]string, len(distances))
	for i, bd := range distances {
		optimized[i] = bd.backend
	}

	return optimized
}

// estimateBackendDistance estima a distância para um backend baseado na região
func (p *AIPredictor) estimateBackendDistance(clientRegion, backend string) float64 {
	// Mapeamento simplificado (em produção, usar dados reais)
	regionDistances := map[string]map[string]float64{
		"North America": {
			"us-backend":   100,
			"eu-backend":   6000,
			"asia-backend": 10000,
		},
		"Europe": {
			"us-backend":   6000,
			"eu-backend":   100,
			"asia-backend": 8000,
		},
		"Asia": {
			"us-backend":   10000,
			"eu-backend":   8000,
			"asia-backend": 100,
		},
	}

	if distances, exists := regionDistances[clientRegion]; exists {
		if distance, exists := distances[backend]; exists {
			return distance
		}
	}

	return 5000 // Distância padrão
}

// calculateGeoAffinityScore calcula pontuação de afinidade geográfica
func (p *AIPredictor) calculateGeoAffinityScore(pattern TrafficPattern) float64 {
	if pattern.GeoDistanceKm == 0 {
		return 1.0 // Perfeita afinidade local
	}

	// Pontuação inversamente proporcional à distância
	// 0-1000km: 0.9-1.0
	// 1000-5000km: 0.5-0.9
	// 5000+km: 0.1-0.5
	if pattern.GeoDistanceKm <= 1000 {
		return 0.9 + (1000-pattern.GeoDistanceKm)/1000*0.1
	} else if pattern.GeoDistanceKm <= 5000 {
		return 0.5 + (5000-pattern.GeoDistanceKm)/4000*0.4
	} else {
		return math.Max(0.1, 0.5-pattern.GeoDistanceKm/20000)
	}
}

// getRegionRecommendation retorna recomendação de região baseada no padrão
func (p *AIPredictor) getRegionRecommendation(pattern TrafficPattern) string {
	if pattern.GeoDistanceKm == 0 {
		return "current_region_optimal"
	}

	if pattern.GeoDistanceKm > 5000 {
		return fmt.Sprintf("consider_region_%s", pattern.ClientRegion)
	} else if pattern.GeoDistanceKm > 1000 {
		return "regional_optimization_available"
	}

	return "current_setup_acceptable"
}
