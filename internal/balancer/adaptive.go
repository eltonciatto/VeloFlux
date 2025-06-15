// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package balancer

import (
	"fmt"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/ai"
	"github.com/eltonciatto/veloflux/internal/config"
	"go.uber.org/zap"
)

// AdaptiveBalancer representa um balanceador com capacidades de IA
type AdaptiveBalancer struct {
	*Balancer  // Herda do balanceador básico
	aiPredictor *ai.AIPredictor
	metricsCollector *MetricsCollector
	adaptiveConfig   *AdaptiveConfig
	logger           *zap.Logger
	mu               sync.RWMutex
	lastDecision     time.Time
	currentStrategy  string
}

// AdaptiveConfig configurações para o balanceador adaptativo
type AdaptiveConfig struct {
	AIEnabled           bool          `yaml:"ai_enabled"`
	AdaptationInterval  time.Duration `yaml:"adaptation_interval"`
	MinConfidenceLevel  float64       `yaml:"min_confidence_level"`
	FallbackAlgorithm   string        `yaml:"fallback_algorithm"`
	ApplicationAware    bool          `yaml:"application_aware"`
	PredictiveScaling   bool          `yaml:"predictive_scaling"`
	LearningRate        float64       `yaml:"learning_rate"`
	ExplorationRate     float64       `yaml:"exploration_rate"`
}

// MetricsCollector coleta e agrega métricas do sistema
type MetricsCollector struct {
	requestCount    map[string]int64
	responseTime    map[string]float64
	errorCount      map[string]int64
	throughput      float64
	lastCollection  time.Time
	mu              sync.RWMutex
}

// RequestContext contém contexto detalhado da requisição
type RequestContext struct {
	Method        string
	Path          string
	ContentType   string
	UserAgent     string
	RequestSize   int64
	ClientType    string
	IsAPI         bool
	IsStatic      bool
	Priority      int
	Complexity    float64
}

// NewAdaptiveBalancer cria um novo balanceador adaptativo
func NewAdaptiveBalancer(cfg *config.Config, adaptiveConfig *AdaptiveConfig, 
	logger *zap.Logger) (*AdaptiveBalancer, error) {
	
	// Criar balanceador base
	baseBalancer := New()
	
	// Configuração padrão para IA
	aiConfig := &ai.AIConfig{
		Enabled:              adaptiveConfig.AIEnabled,
		ModelType:            "neural_network",
		TrainingInterval:     30 * time.Minute,
		PredictionWindow:     5 * time.Minute,
		HistoryRetention:     24 * time.Hour,
		MinDataPoints:        50,
		ConfidenceThreshold:  adaptiveConfig.MinConfidenceLevel,
		AdaptiveAlgorithms:   true,
		ApplicationAware:     adaptiveConfig.ApplicationAware,
	}
	
	// Inicializar IA predictor
	aiPredictor := ai.NewAIPredictor(aiConfig, logger)
	
	// Inicializar coletor de métricas
	metricsCollector := &MetricsCollector{
		requestCount:   make(map[string]int64),
		responseTime:   make(map[string]float64),
		errorCount:     make(map[string]int64),
		lastCollection: time.Now(),
	}
	
	adaptiveBalancer := &AdaptiveBalancer{
		Balancer:         baseBalancer,
		aiPredictor:      aiPredictor,
		metricsCollector: metricsCollector,
		adaptiveConfig:   adaptiveConfig,
		logger:           logger,
		lastDecision:     time.Now(),
		currentStrategy:  adaptiveConfig.FallbackAlgorithm,
	}
	
	// Iniciar goroutines para adaptação contínua
	if adaptiveConfig.AIEnabled {
		go adaptiveBalancer.continuousAdaptation()
		go adaptiveBalancer.metricsAggregator()
	}
	
	logger.Info("Adaptive balancer initialized", 
		zap.Bool("ai_enabled", adaptiveConfig.AIEnabled),
		zap.String("fallback_algorithm", adaptiveConfig.FallbackAlgorithm))
	
	return adaptiveBalancer, nil
}

// GetBackendIntelligent seleciona backend usando IA e contexto da aplicação
func (ab *AdaptiveBalancer) GetBackendIntelligent(poolName string, clientIP net.IP, 
	sessionID string, r *http.Request, context *RequestContext) (*Backend, error) {
	
	// Coletar métricas da requisição
	ab.recordRequestMetrics(poolName, context)
	
	if !ab.adaptiveConfig.AIEnabled {
		// Fallback para balanceador básico
		return ab.Balancer.GetBackend(poolName, clientIP, sessionID, r)
	}
	
	// Analisar contexto da aplicação (se necessário)
	_ = ab.analyzeApplicationContext(context)
	
	// Obter predição da IA
	prediction, err := ab.aiPredictor.PredictOptimalStrategy()
	if err != nil || prediction.Confidence < ab.adaptiveConfig.MinConfidenceLevel {
		ab.logger.Debug("AI prediction failed or low confidence, using fallback", 
			zap.Error(err), 
			zap.Float64("confidence", prediction.Confidence))
		return ab.getBackendWithAlgorithm(poolName, clientIP, sessionID, r, 
			ab.adaptiveConfig.FallbackAlgorithm)
	}
	
	// Usar estratégia recomendada pela IA
	ab.updateCurrentStrategy(prediction.RecommendedAlgo)
	
	ab.logger.Debug("Using AI-recommended strategy", 
		zap.String("algorithm", prediction.RecommendedAlgo),
		zap.Float64("confidence", prediction.Confidence),
		zap.Float64("predicted_load", prediction.PredictedLoad))
	
	return ab.getBackendWithAlgorithm(poolName, clientIP, sessionID, r, 
		prediction.RecommendedAlgo)
}

// getBackendWithAlgorithm seleciona backend usando algoritmo específico
func (ab *AdaptiveBalancer) getBackendWithAlgorithm(poolName string, clientIP net.IP, 
	sessionID string, r *http.Request, algorithm string) (*Backend, error) {
	
	ab.mu.RLock()
	pool, exists := ab.pools[poolName]
	ab.mu.RUnlock()
	
	if !exists {
		return nil, fmt.Errorf("pool not found: %s", poolName)
	}
	
	// Implementar algoritmos adaptativos
	switch algorithm {
	case "ai_optimized":
		return ab.getAIOptimizedBackend(pool, clientIP, r)
	case "predictive_least_conn":
		return ab.getPredictiveLeastConnBackend(pool, clientIP)
	case "application_aware":
		return ab.getApplicationAwareBackend(pool, clientIP, r)
	case "hybrid_intelligent":
		return ab.getHybridIntelligentBackend(pool, clientIP, sessionID, r)
	default:
		// Usar algoritmos tradicionais do balanceador base
		return ab.getTraditionalBackend(pool, algorithm, clientIP, sessionID, r)
	}
}

// getAIOptimizedBackend seleciona backend otimizado por IA
func (ab *AdaptiveBalancer) getAIOptimizedBackend(pool *Pool, clientIP net.IP, 
	r *http.Request) (*Backend, error) {
	
	healthyBackends := ab.getHealthyBackends(pool)
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	// Usar IA para scoring de backends
	bestBackend := healthyBackends[0]
	bestScore := ab.calculateAIScore(bestBackend, r)
	
	for _, backend := range healthyBackends[1:] {
		score := ab.calculateAIScore(backend, r)
		if score > bestScore {
			bestScore = score
			bestBackend = backend
		}
	}
	
	ab.logger.Debug("AI-optimized backend selected", 
		zap.String("backend", bestBackend.Address),
		zap.Float64("ai_score", bestScore))
	
	return bestBackend, nil
}

// getPredictiveLeastConnBackend usa predições para selecionar backend
func (ab *AdaptiveBalancer) getPredictiveLeastConnBackend(pool *Pool, 
	clientIP net.IP) (*Backend, error) {
	
	healthyBackends := ab.getHealthyBackends(pool)
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	// Calcular conexões futuras previstas
	bestBackend := healthyBackends[0]
	bestPredictedLoad := ab.predictFutureLoad(bestBackend)
	
	for _, backend := range healthyBackends[1:] {
		predictedLoad := ab.predictFutureLoad(backend)
		if predictedLoad < bestPredictedLoad {
			bestPredictedLoad = predictedLoad
			bestBackend = backend
		}
	}
	
	ab.logger.Debug("Predictive least connection backend selected", 
		zap.String("backend", bestBackend.Address),
		zap.Float64("predicted_load", bestPredictedLoad))
	
	return bestBackend, nil
}

// getApplicationAwareBackend seleciona baseado no contexto da aplicação
func (ab *AdaptiveBalancer) getApplicationAwareBackend(pool *Pool, clientIP net.IP, 
	r *http.Request) (*Backend, error) {
	
	healthyBackends := ab.getHealthyBackends(pool)
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	// Analisar tipo de requisição
	context := ab.buildRequestContext(r)
	
	// Selecionar backend otimizado para o tipo de requisição
	for _, backend := range healthyBackends {
		if ab.isBackendOptimalForRequest(backend, context) {
			ab.logger.Debug("Application-aware backend selected", 
				zap.String("backend", backend.Address),
				zap.String("request_type", context.Method),
				zap.Bool("is_api", context.IsAPI))
			return backend, nil
		}
	}
	
	// Fallback para least connections
	return ab.getLeastConnBackend(healthyBackends), nil
}

// getHybridIntelligentBackend combina múltiplas estratégias
func (ab *AdaptiveBalancer) getHybridIntelligentBackend(pool *Pool, clientIP net.IP, 
	sessionID string, r *http.Request) (*Backend, error) {
	
	healthyBackends := ab.getHealthyBackends(pool)
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	// Combinar scores de múltiplos fatores
	bestBackend := healthyBackends[0]
	bestScore := ab.calculateHybridScore(bestBackend, clientIP, r)
	
	for _, backend := range healthyBackends[1:] {
		score := ab.calculateHybridScore(backend, clientIP, r)
		if score > bestScore {
			bestScore = score
			bestBackend = backend
		}
	}
	
	ab.logger.Debug("Hybrid intelligent backend selected", 
		zap.String("backend", bestBackend.Address),
		zap.Float64("hybrid_score", bestScore))
	
	return bestBackend, nil
}

// calculateAIScore calcula score usando IA
func (ab *AdaptiveBalancer) calculateAIScore(backend *Backend, r *http.Request) float64 {
	// Score baseado em múltiplos fatores
	score := 1.0
	
	// Fator de carga atual
	currentLoad := float64(backend.Connections.Load())
	score -= currentLoad * 0.1
	
	// Fator de latência histórica
	if lastUsed := backend.LastUsed.Load(); lastUsed > 0 {
		timeSinceLastUse := time.Since(time.Unix(lastUsed/1000000000, 0))
		if timeSinceLastUse < time.Minute {
			score += 0.2 // Bonus por uso recente (cache warm)
		}
	}
	
	// Fator de peso
	score += float64(backend.Weight) * 0.1
	
	// Fator de saúde
	if backend.Healthy.Load() {
		score += 0.5
	} else {
		score = 0 // Backend não saudável recebe score 0
	}
	
	return score
}

// predictFutureLoad prediz carga futura do backend
func (ab *AdaptiveBalancer) predictFutureLoad(backend *Backend) float64 {
	currentLoad := float64(backend.Connections.Load())
	
	// Usar tendência histórica (simplificado)
	// Em implementação real, usaria dados históricos mais sofisticados
	trend := ab.getLoadTrend(backend.Address)
	
	return currentLoad + trend
}

// getLoadTrend calcula tendência de carga
func (ab *AdaptiveBalancer) getLoadTrend(backendAddress string) float64 {
	// Implementação simplificada
	// Em produção, analisaria dados históricos
	ab.metricsCollector.mu.RLock()
	defer ab.metricsCollector.mu.RUnlock()
	
	if count, exists := ab.metricsCollector.requestCount[backendAddress]; exists {
		// Tendência baseada em requisições recentes
		return float64(count) * 0.01
	}
	
	return 0.0
}

// buildRequestContext constrói contexto da requisição
func (ab *AdaptiveBalancer) buildRequestContext(r *http.Request) *RequestContext {
	context := &RequestContext{
		Method:      r.Method,
		Path:        r.URL.Path,
		ContentType: r.Header.Get("Content-Type"),
		UserAgent:   r.Header.Get("User-Agent"),
		RequestSize: r.ContentLength,
	}
	
	// Determinar tipo de cliente e requisição
	context.ClientType = ab.categorizeClient(context.UserAgent)
	context.IsAPI = ab.isAPIRequest(context.Path, context.ContentType)
	context.IsStatic = ab.isStaticContent(context.Path, context.ContentType)
	context.Priority = ab.calculatePriority(context)
	context.Complexity = ab.calculateComplexity(context)
	
	return context
}

// isBackendOptimalForRequest verifica se backend é otimal para requisição
func (ab *AdaptiveBalancer) isBackendOptimalForRequest(backend *Backend, 
	context *RequestContext) bool {
	
	// Lógica para matching backend-requisição
	// Exemplo: backends específicos para APIs, conteúdo estático, etc.
	
	if context.IsStatic {
		// Preferir backends com menor carga para conteúdo estático
		return backend.Connections.Load() < 10
	}
	
	if context.IsAPI {
		// Preferir backends com melhor performance para APIs
		return backend.Weight > 5
	}
	
	// Para requisições complexas, preferir backends menos carregados
	if context.Complexity > 3.0 {
		return backend.Connections.Load() < 5
	}
	
	return true
}

// calculateHybridScore calcula score híbrido
func (ab *AdaptiveBalancer) calculateHybridScore(backend *Backend, clientIP net.IP, 
	r *http.Request) float64 {
	
	// Combinar múltiplos scores
	aiScore := ab.calculateAIScore(backend, r) * 0.4
	loadScore := ab.calculateLoadScore(backend) * 0.3
	geoScore := ab.calculateGeoScore(backend, clientIP) * 0.2
	appScore := ab.calculateAppScore(backend, r) * 0.1
	
	return aiScore + loadScore + geoScore + appScore
}

// continuousAdaptation executa adaptação contínua
func (ab *AdaptiveBalancer) continuousAdaptation() {
	ticker := time.NewTicker(ab.adaptiveConfig.AdaptationInterval)
	defer ticker.Stop()
	
	for range ticker.C {
		ab.performAdaptation()
	}
}

// performAdaptation executa ciclo de adaptação
func (ab *AdaptiveBalancer) performAdaptation() {
	// Coletar métricas atuais
	metrics := ab.collectCurrentMetrics()
	
	// Registrar no AI predictor
	ab.aiPredictor.RecordMetrics(
		metrics.RequestRate,
		metrics.AvgResponseTime,
		metrics.ErrorRate,
		metrics.Features,
	)
	
	// Obter nova predição
	prediction, err := ab.aiPredictor.PredictOptimalStrategy()
	if err != nil {
		ab.logger.Error("Failed to get AI prediction", zap.Error(err))
		return
	}
	
	// Adaptar estratégia se necessário
	if prediction.Confidence >= ab.adaptiveConfig.MinConfidenceLevel {
		ab.updateCurrentStrategy(prediction.RecommendedAlgo)
		
		ab.logger.Info("Strategy adapted", 
			zap.String("new_strategy", prediction.RecommendedAlgo),
			zap.Float64("confidence", prediction.Confidence),
			zap.Float64("predicted_load", prediction.PredictedLoad))
	}
}

// metricsAggregator agrega métricas continuamente
func (ab *AdaptiveBalancer) metricsAggregator() {
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for range ticker.C {
		ab.aggregateMetrics()
	}
}

// Métodos auxiliares (implementações simplificadas)

func (ab *AdaptiveBalancer) recordRequestMetrics(poolName string, context *RequestContext) {
	ab.metricsCollector.mu.Lock()
	defer ab.metricsCollector.mu.Unlock()
	
	ab.metricsCollector.requestCount[poolName]++
	ab.metricsCollector.lastCollection = time.Now()
}

func (ab *AdaptiveBalancer) analyzeApplicationContext(context *RequestContext) map[string]interface{} {
	return ab.aiPredictor.AnalyzeApplicationContext(
		context.Method,
		context.ContentType,
		context.UserAgent,
		context.RequestSize,
	)
}

func (ab *AdaptiveBalancer) updateCurrentStrategy(strategy string) {
	ab.mu.Lock()
	defer ab.mu.Unlock()
	
	ab.currentStrategy = strategy
	ab.lastDecision = time.Now()
}

func (ab *AdaptiveBalancer) getHealthyBackends(pool *Pool) []*Backend {
	var healthy []*Backend
	for _, backend := range pool.Backends {
		if backend.Healthy.Load() {
			healthy = append(healthy, backend)
		}
	}
	return healthy
}

func (ab *AdaptiveBalancer) getLeastConnBackend(backends []*Backend) *Backend {
	if len(backends) == 0 {
		return nil
	}
	
	best := backends[0]
	for _, backend := range backends[1:] {
		if backend.Connections.Load() < best.Connections.Load() {
			best = backend
		}
	}
	return best
}

func (ab *AdaptiveBalancer) categorizeClient(userAgent string) string {
	// Implementação simplificada
	if len(userAgent) > 7 && userAgent[:7] == "Mozilla" {
		return "browser"
	}
	return "api_client"
}

func (ab *AdaptiveBalancer) isAPIRequest(path, contentType string) bool {
	return len(path) > 4 && path[:4] == "/api" || contentType == "application/json"
}

func (ab *AdaptiveBalancer) isStaticContent(path, contentType string) bool {
	staticExtensions := []string{".css", ".js", ".png", ".jpg", ".gif", ".ico"}
	for _, ext := range staticExtensions {
		if len(path) >= len(ext) && path[len(path)-len(ext):] == ext {
			return true
		}
	}
	return false
}

func (ab *AdaptiveBalancer) calculatePriority(context *RequestContext) int {
	if context.IsAPI {
		return 3 // High priority
	}
	if context.IsStatic {
		return 1 // Low priority
	}
	return 2 // Medium priority
}

func (ab *AdaptiveBalancer) calculateComplexity(context *RequestContext) float64 {
	complexity := 1.0
	
	if context.IsAPI {
		complexity += 1.0
	}
	if context.RequestSize > 1024*1024 {
		complexity += 1.0
	}
	if context.Method == "POST" || context.Method == "PUT" {
		complexity += 0.5
	}
	
	return complexity
}

func (ab *AdaptiveBalancer) calculateLoadScore(backend *Backend) float64 {
	load := float64(backend.Connections.Load())
	maxLoad := 100.0 // Assume max 100 connections
	
	return 1.0 - (load / maxLoad)
}

func (ab *AdaptiveBalancer) calculateGeoScore(backend *Backend, clientIP net.IP) float64 {
	// Implementação simplificada - em produção usaria dados geográficos reais
	return 0.5
}

func (ab *AdaptiveBalancer) calculateAppScore(backend *Backend, r *http.Request) float64 {
	// Score baseado na compatibilidade da aplicação
	return 0.7
}

func (ab *AdaptiveBalancer) collectCurrentMetrics() *MetricsSnapshot {
	ab.metricsCollector.mu.RLock()
	defer ab.metricsCollector.mu.RUnlock()
	
	totalRequests := int64(0)
	totalResponseTime := 0.0
	totalErrors := int64(0)
	
	for _, count := range ab.metricsCollector.requestCount {
		totalRequests += count
	}
	
	for _, responseTime := range ab.metricsCollector.responseTime {
		totalResponseTime += responseTime
	}
	
	for _, errors := range ab.metricsCollector.errorCount {
		totalErrors += errors
	}
	
	avgResponseTime := 0.0
	if len(ab.metricsCollector.responseTime) > 0 {
		avgResponseTime = totalResponseTime / float64(len(ab.metricsCollector.responseTime))
	}
	
	errorRate := 0.0
	if totalRequests > 0 {
		errorRate = float64(totalErrors) / float64(totalRequests)
	}
	
	requestRate := float64(totalRequests) / time.Since(ab.metricsCollector.lastCollection).Seconds()
	
	return &MetricsSnapshot{
		RequestRate:     requestRate,
		AvgResponseTime: avgResponseTime,
		ErrorRate:       errorRate,
		Features: map[string]interface{}{
			"total_requests": totalRequests,
			"total_errors":   totalErrors,
			"backends_count": len(ab.metricsCollector.requestCount),
		},
	}
}

func (ab *AdaptiveBalancer) aggregateMetrics() {
	// Agregar e limpar métricas antigas
	ab.metricsCollector.mu.Lock()
	defer ab.metricsCollector.mu.Unlock()
	
	// Reset counters periodically
	if time.Since(ab.metricsCollector.lastCollection) > time.Hour {
		ab.metricsCollector.requestCount = make(map[string]int64)
		ab.metricsCollector.responseTime = make(map[string]float64)
		ab.metricsCollector.errorCount = make(map[string]int64)
		ab.metricsCollector.lastCollection = time.Now()
	}
}

func (ab *AdaptiveBalancer) getTraditionalBackend(pool *Pool, algorithm string, 
	clientIP net.IP, sessionID string, r *http.Request) (*Backend, error) {
	
	// Delegar para métodos do balanceador tradicional
	// Esta é uma implementação simplificada - na prática, 
	// precisaria implementar todos os algoritmos tradicionais
	
	healthyBackends := ab.getHealthyBackends(pool)
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available")
	}
	
	switch algorithm {
	case "round_robin":
		return ab.getRoundRobinBackend(pool, healthyBackends)
	case "least_conn":
		return ab.getLeastConnBackend(healthyBackends), nil
	case "weighted_round_robin":
		return ab.getWeightedRoundRobinBackend(healthyBackends)
	default:
		return healthyBackends[0], nil
	}
}

func (ab *AdaptiveBalancer) getRoundRobinBackend(pool *Pool, backends []*Backend) (*Backend, error) {
	if len(backends) == 0 {
		return nil, fmt.Errorf("no backends available")
	}
	
	counter := pool.counter.Add(1)
	return backends[int(counter-1)%len(backends)], nil
}

func (ab *AdaptiveBalancer) getWeightedRoundRobinBackend(backends []*Backend) (*Backend, error) {
	if len(backends) == 0 {
		return nil, fmt.Errorf("no backends available")
	}
	
	// Implementação simplificada do weighted round robin
	totalWeight := 0
	for _, backend := range backends {
		totalWeight += backend.Weight
	}
	
	if totalWeight == 0 {
		return backends[0], nil
	}
	
	// Usar peso para seleção
	target := int(time.Now().UnixNano()) % totalWeight
	current := 0
	
	for _, backend := range backends {
		current += backend.Weight
		if current > target {
			return backend, nil
		}
	}
	
	return backends[0], nil
}

// MetricsSnapshot representa um snapshot das métricas
type MetricsSnapshot struct {
	RequestRate     float64
	AvgResponseTime float64
	ErrorRate       float64
	Features        map[string]interface{}
}

// SelectBackend implementa a interface principal do balanceador
func (ab *AdaptiveBalancer) SelectBackend(r *http.Request) (*Backend, error) {
	context := ab.buildRequestContext(r)
	clientIP := ab.extractClientIP(r)
	sessionID := ab.extractSessionID(r)
	
	// Usar pool padrão se não especificado
	poolName := "default"
	if pool := r.Header.Get("X-Pool-Name"); pool != "" {
		poolName = pool
	}
	
	return ab.GetBackendIntelligent(poolName, clientIP, sessionID, r, context)
}

// GetCurrentStrategy retorna a estratégia atual
func (ab *AdaptiveBalancer) GetCurrentStrategy() string {
	ab.mu.RLock()
	defer ab.mu.RUnlock()
	return ab.currentStrategy
}

// RecordRequestMetrics registra métricas de uma requisição
func (ab *AdaptiveBalancer) RecordRequestMetrics(requestRate, responseTime, errorRate float64, features map[string]interface{}) {
	if ab.aiPredictor != nil {
		ab.aiPredictor.RecordMetrics(requestRate, responseTime, errorRate, features)
	}
	
	// Atualizar métricas internas
	ab.metricsCollector.mu.Lock()
	ab.metricsCollector.throughput = requestRate
	ab.metricsCollector.lastCollection = time.Now()
	ab.metricsCollector.mu.Unlock()
}

// extractClientIP extrai IP do cliente da requisição
func (ab *AdaptiveBalancer) extractClientIP(r *http.Request) net.IP {
	// Tentar X-Forwarded-For primeiro
	if xff := r.Header.Get("X-Forwarded-For"); xff != "" {
		if ip := net.ParseIP(strings.Split(xff, ",")[0]); ip != nil {
			return ip
		}
	}
	
	// Tentar X-Real-IP
	if xri := r.Header.Get("X-Real-IP"); xri != "" {
		if ip := net.ParseIP(xri); ip != nil {
			return ip
		}
	}
	
	// Usar RemoteAddr como fallback
	host, _, _ := net.SplitHostPort(r.RemoteAddr)
	if ip := net.ParseIP(host); ip != nil {
		return ip
	}
	
	return net.ParseIP("127.0.0.1") // Fallback
}

// extractSessionID extrai ID da sessão
func (ab *AdaptiveBalancer) extractSessionID(r *http.Request) string {
	// Tentar cookie de sessão
	if cookie, err := r.Cookie("session_id"); err == nil {
		return cookie.Value
	}
	
	// Tentar header
	if sessionID := r.Header.Get("X-Session-ID"); sessionID != "" {
		return sessionID
	}
	
	return "" // Sem sessão
}

// ...existing code...