// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package ai

import (
	"context"
	"fmt"
	"net"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/geo"
	"go.uber.org/zap"
)

// AIService é o serviço principal de IA que garante robustez e alta disponibilidade
type AIService struct {
	predictor       *AIPredictor
	healthChecker   *AIHealthChecker
	failoverManager *AIFailoverManager
	monitor         *AIMonitor
	config          *AIServiceConfig
	logger          *zap.Logger
	mu              sync.RWMutex
	running         bool
	ctx             context.Context
	cancel          context.CancelFunc
}

// AIServiceConfig configurações para o serviço de IA robusto
type AIServiceConfig struct {
	Enabled             bool          `yaml:"enabled"`
	HealthCheckInterval time.Duration `yaml:"health_check_interval"`
	FailoverTimeout     time.Duration `yaml:"failover_timeout"`
	MonitoringInterval  time.Duration `yaml:"monitoring_interval"`
	AlertThreshold      float64       `yaml:"alert_threshold"`
	AutoRestart         bool          `yaml:"auto_restart"`
	BackupModelsEnabled bool          `yaml:"backup_models_enabled"`
	PersistentStorage   bool          `yaml:"persistent_storage"`
	MaxRetries          int           `yaml:"max_retries"`
	RetryBackoff        time.Duration `yaml:"retry_backoff"`
}

// AIHealthChecker monitora a saúde do sistema de IA
type AIHealthChecker struct {
	service      *AIService
	lastCheck    time.Time
	healthStatus AIHealthStatus
	logger       *zap.Logger
	mu           sync.RWMutex
}

// AIHealthStatus representa o status de saúde da IA
type AIHealthStatus struct {
	Healthy           bool      `json:"healthy"`
	LastHealthyCheck  time.Time `json:"last_healthy_check"`
	ErrorCount        int       `json:"error_count"`
	ResponseTime      float64   `json:"response_time_ms"`
	ModelAccuracy     float64   `json:"model_accuracy"`
	PredictionSuccess float64   `json:"prediction_success_rate"`
	SystemLoad        float64   `json:"system_load"`
	Message           string    `json:"message"`
}

// AIFailoverManager gerencia o failover do sistema de IA
type AIFailoverManager struct {
	service       *AIService
	backupModels  map[string]MLModel
	currentModel  string
	failoverCount int
	logger        *zap.Logger
	mu            sync.RWMutex
}

// AIMonitor monitora métricas e performance da IA
type AIMonitor struct {
	service            *AIService
	metrics            *AIMetrics
	alerts             []AIAlert
	performanceHistory []AIPerformancePoint
	logger             *zap.Logger
	mu                 sync.RWMutex
}

// AIAlert representa um alerta do sistema de IA
type AIAlert struct {
	Type       string    `json:"type"`
	Level      string    `json:"level"` // "info", "warning", "critical"
	Message    string    `json:"message"`
	Timestamp  time.Time `json:"timestamp"`
	Resolved   bool      `json:"resolved"`
	ResolvedAt time.Time `json:"resolved_at,omitempty"`
}

// AIPerformancePoint representa um ponto de performance no tempo
type AIPerformancePoint struct {
	Timestamp        time.Time `json:"timestamp"`
	Accuracy         float64   `json:"accuracy"`
	ResponseTime     float64   `json:"response_time_ms"`
	ThroughputQPS    float64   `json:"throughput_qps"`
	ErrorRate        float64   `json:"error_rate"`
	ModelLoad        float64   `json:"model_load"`
	PredictionsCount int64     `json:"predictions_count"`
}

// AIMetrics representa as métricas coletadas do sistema de IA
type AIMetrics struct {
	TotalPredictions      int64         `json:"total_predictions"`
	SuccessfulPredictions int64         `json:"successful_predictions"`
	FailedPredictions     int64         `json:"failed_predictions"`
	AverageResponseTime   float64       `json:"average_response_time_ms"`
	CurrentAccuracy       float64       `json:"current_accuracy"`
	ThroughputQPS         float64       `json:"throughput_qps"`
	ErrorRate             float64       `json:"error_rate"`
	SystemLoad            float64       `json:"system_load"`
	UpTime                time.Duration `json:"uptime"`
	LastUpdated           time.Time     `json:"last_updated"`

	// Métricas Geográficas
	GeoPredictions      int64   `json:"geo_predictions"`
	AverageGeoAffinity  float64 `json:"average_geo_affinity"`
	CrossRegionRequests int64   `json:"cross_region_requests"`
	GeoOptimizations    int64   `json:"geo_optimizations"`
}

// NewAIHealthChecker cria um novo health checker para IA
func NewAIHealthChecker(service *AIService, logger *zap.Logger) *AIHealthChecker {
	return &AIHealthChecker{
		service:      service,
		lastCheck:    time.Now(),
		healthStatus: AIHealthStatus{Healthy: true, LastHealthyCheck: time.Now()},
		logger:       logger,
	}
}

// NewAIFailoverManager cria um novo gerenciador de failover
func NewAIFailoverManager(service *AIService, logger *zap.Logger) *AIFailoverManager {
	return &AIFailoverManager{
		service:      service,
		backupModels: make(map[string]MLModel),
		currentModel: "default",
		logger:       logger,
	}
}

// NewAIMonitor cria um novo monitor de IA
func NewAIMonitor(service *AIService, logger *zap.Logger) *AIMonitor {
	return &AIMonitor{
		service: service,
		metrics: &AIMetrics{
			LastUpdated: time.Now(),
		},
		alerts:             make([]AIAlert, 0),
		performanceHistory: make([]AIPerformancePoint, 0),
		logger:             logger,
	}
}

// NewAIService cria um novo serviço de IA robusto
func NewAIService(config *AIServiceConfig, aiConfig *AIConfig, logger *zap.Logger) *AIService {
	ctx, cancel := context.WithCancel(context.Background())

	service := &AIService{
		config:  config,
		logger:  logger,
		running: false,
		ctx:     ctx,
		cancel:  cancel,
	}

	// Inicializar componentes
	service.predictor = NewAIPredictor(aiConfig, logger)
	service.healthChecker = NewAIHealthChecker(service, logger)
	service.failoverManager = NewAIFailoverManager(service, logger)
	service.monitor = NewAIMonitor(service, logger)

	if config.Enabled {
		logger.Info("AI Service initialized",
			zap.Bool("health_monitoring", true),
			zap.Bool("failover_enabled", true),
			zap.Bool("auto_restart", config.AutoRestart))
	}

	return service
}

// Start inicia o serviço de IA com todos os componentes
func (s *AIService) Start() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.running {
		return fmt.Errorf("AI service is already running")
	}

	if !s.config.Enabled {
		s.logger.Info("AI Service is disabled in configuration")
		return nil
	}

	s.logger.Info("Starting AI Service...")

	// Inicializar failover manager
	if err := s.failoverManager.Initialize(); err != nil {
		return fmt.Errorf("failed to initialize failover manager: %w", err)
	}

	// Iniciar health checker
	go s.healthChecker.Start(s.ctx)

	// Iniciar monitor
	go s.monitor.Start(s.ctx)

	// Iniciar auto-restart se habilitado
	if s.config.AutoRestart {
		go s.autoRestartLoop(s.ctx)
	}

	s.running = true
	s.logger.Info("AI Service started successfully")

	return nil
}

// Stop para o serviço de IA gracefully
func (s *AIService) Stop() error {
	s.mu.Lock()
	defer s.mu.Unlock()

	if !s.running {
		return nil
	}

	s.logger.Info("Stopping AI Service...")

	// Cancelar contexto para parar todas as goroutines
	s.cancel()

	// Salvar estado se persistência estiver habilitada
	if s.config.PersistentStorage {
		if err := s.saveState(); err != nil {
			s.logger.Error("Failed to save AI state", zap.Error(err))
		}
	}

	s.running = false
	s.logger.Info("AI Service stopped")

	return nil
}

// IsHealthy verifica se o serviço de IA está saudável
func (s *AIService) IsHealthy() bool {
	s.mu.RLock()
	defer s.mu.RUnlock()

	if !s.running || !s.config.Enabled {
		return false
	}

	return s.healthChecker.GetStatus().Healthy
}

// GetStatus retorna o status completo do serviço de IA
func (s *AIService) GetStatus() AIServiceStatus {
	s.mu.RLock()
	defer s.mu.RUnlock()

	return AIServiceStatus{
		Running:        s.running,
		Enabled:        s.config.Enabled,
		Health:         s.healthChecker.GetStatus(),
		FailoverCount:  s.failoverManager.GetFailoverCount(),
		CurrentModel:   s.failoverManager.GetCurrentModel(),
		LastPrediction: s.predictor.GetLastPredictionTime(),
		ActiveAlerts:   s.monitor.GetActiveAlerts(),
		Performance:    s.monitor.GetCurrentPerformance(),
	}
}

// AIServiceStatus representa o status completo do serviço
type AIServiceStatus struct {
	Running        bool               `json:"running"`
	Enabled        bool               `json:"enabled"`
	Health         AIHealthStatus     `json:"health"`
	FailoverCount  int                `json:"failover_count"`
	CurrentModel   string             `json:"current_model"`
	LastPrediction time.Time          `json:"last_prediction"`
	ActiveAlerts   []AIAlert          `json:"active_alerts"`
	Performance    AIPerformancePoint `json:"performance"`
}

// Predict faz uma predição usando o sistema de IA com failover
func (s *AIService) Predict(pattern TrafficPattern) (*PredictionResult, error) {
	if !s.IsHealthy() {
		return nil, fmt.Errorf("AI service is not healthy")
	}

	// Tentar predição com retry e failover
	var result *PredictionResult
	var err error

	for retry := 0; retry < s.config.MaxRetries; retry++ {
		result, err = s.predictor.Predict(pattern)
		if err == nil {
			// Sucesso - atualizar métricas
			s.monitor.RecordPrediction(true, time.Since(time.Now()))
			return result, nil
		}

		s.logger.Warn("Prediction failed, retrying",
			zap.Int("retry", retry+1),
			zap.Error(err))

		// Tentar failover se necessário
		if retry == 0 {
			if failoverErr := s.failoverManager.TriggerFailover(); failoverErr != nil {
				s.logger.Error("Failover failed", zap.Error(failoverErr))
			}
		}

		// Backoff antes da próxima tentativa
		time.Sleep(s.config.RetryBackoff * time.Duration(retry+1))
	}

	// Todas as tentativas falharam
	s.monitor.RecordPrediction(false, 0)
	return nil, fmt.Errorf("AI prediction failed after %d retries: %w", s.config.MaxRetries, err)
}

// SetGeoManager configura o gerenciador geográfico no serviço de IA
func (s *AIService) SetGeoManager(gm *geo.Manager) {
	s.mu.Lock()
	defer s.mu.Unlock()

	if s.predictor != nil {
		s.predictor.SetGeoManager(gm)
		s.logger.Info("GeoManager configured for AI Service")
	}
}

// PredictWithGeoContext faz predição considerando contexto geográfico
func (s *AIService) PredictWithGeoContext(pattern TrafficPattern, clientIP net.IP, backendOptions []string) (*PredictionResult, error) {
	if !s.IsHealthy() {
		return nil, fmt.Errorf("AI service is not healthy")
	}

	// Tentar predição com contexto geográfico
	var result *PredictionResult
	var err error

	for retry := 0; retry < s.config.MaxRetries; retry++ {
		result, err = s.predictor.PredictWithGeoContext(pattern, clientIP, backendOptions)
		if err == nil {
			// Sucesso - atualizar métricas
			s.monitor.RecordPrediction(true, time.Since(time.Now()))

			// Log informações geográficas se disponíveis
			if result.GeoAffinityScore > 0 {
				s.logger.Debug("Geo-enhanced AI prediction completed",
					zap.String("algorithm", result.Algorithm),
					zap.Float64("geo_affinity", result.GeoAffinityScore),
					zap.String("region_recommendation", result.RegionRecommendation))
			}

			return result, nil
		}

		s.logger.Warn("Geo-enhanced prediction failed, retrying",
			zap.Int("retry", retry+1),
			zap.Error(err))

		// Tentar failover se necessário
		if retry == 0 {
			if failoverErr := s.failoverManager.TriggerFailover(); failoverErr != nil {
				s.logger.Error("Failover failed", zap.Error(failoverErr))
			}
		}

		// Backoff antes da próxima tentativa
		time.Sleep(s.config.RetryBackoff * time.Duration(retry+1))
	}

	// Todas as tentativas falharam
	s.monitor.RecordPrediction(false, 0)
	return nil, fmt.Errorf("AI geo-enhanced prediction failed after %d retries: %w", s.config.MaxRetries, err)
}

// GetPredictor retorna o predictor do serviço de IA
func (s *AIService) GetPredictor() *AIPredictor {
	s.mu.RLock()
	defer s.mu.RUnlock()
	return s.predictor
}

// AIHealthChecker Methods

// Start inicia o health checker em uma goroutine
func (h *AIHealthChecker) Start(ctx context.Context) {
	ticker := time.NewTicker(h.service.config.HealthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			h.performHealthCheck()
		}
	}
}

// GetStatus retorna o status atual de saúde
func (h *AIHealthChecker) GetStatus() AIHealthStatus {
	h.mu.RLock()
	defer h.mu.RUnlock()
	return h.healthStatus
}

// performHealthCheck executa uma verificação de saúde
func (h *AIHealthChecker) performHealthCheck() {
	h.mu.Lock()
	defer h.mu.Unlock()

	start := time.Now()
	healthy := true
	message := "System healthy"

	// Verificar se o predictor está funcionando
	if h.service.predictor == nil {
		healthy = false
		message = "Predictor not initialized"
	}

	responseTime := float64(time.Since(start).Nanoseconds()) / 1000000 // ms

	h.healthStatus = AIHealthStatus{
		Healthy:          healthy,
		LastHealthyCheck: time.Now(),
		ResponseTime:     responseTime,
		Message:          message,
	}

	if healthy {
		h.healthStatus.LastHealthyCheck = time.Now()
	} else {
		h.healthStatus.ErrorCount++
	}

	h.lastCheck = time.Now()
}

// AIFailoverManager Methods

// Initialize inicializa o gerenciador de failover
func (f *AIFailoverManager) Initialize() error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.logger.Info("Initializing AI Failover Manager")
	// TODO: Carregar modelos de backup
	return nil
}

// TriggerFailover executa o failover para um modelo backup
func (f *AIFailoverManager) TriggerFailover() error {
	f.mu.Lock()
	defer f.mu.Unlock()

	f.failoverCount++
	f.logger.Warn("Triggering AI failover", zap.Int("count", f.failoverCount))

	// TODO: Implementar lógica de failover real
	return nil
}

// GetFailoverCount retorna o número de failovers
func (f *AIFailoverManager) GetFailoverCount() int {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.failoverCount
}

// GetCurrentModel retorna o modelo atual
func (f *AIFailoverManager) GetCurrentModel() string {
	f.mu.RLock()
	defer f.mu.RUnlock()
	return f.currentModel
}

// AIMonitor Methods

// Start inicia o monitor em uma goroutine
func (m *AIMonitor) Start(ctx context.Context) {
	ticker := time.NewTicker(m.service.config.MonitoringInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			m.collectMetrics()
		}
	}
}

// GetMetrics retorna as métricas atuais
func (m *AIMonitor) GetMetrics() *AIMetrics {
	m.mu.RLock()
	defer m.mu.RUnlock()
	return m.metrics
}

// GetActiveAlerts retorna alertas ativos
func (m *AIMonitor) GetActiveAlerts() []AIAlert {
	m.mu.RLock()
	defer m.mu.RUnlock()

	activeAlerts := make([]AIAlert, 0)
	for _, alert := range m.alerts {
		if !alert.Resolved {
			activeAlerts = append(activeAlerts, alert)
		}
	}
	return activeAlerts
}

// GetCurrentPerformance retorna o ponto de performance atual
func (m *AIMonitor) GetCurrentPerformance() AIPerformancePoint {
	m.mu.RLock()
	defer m.mu.RUnlock()

	if len(m.performanceHistory) > 0 {
		return m.performanceHistory[len(m.performanceHistory)-1]
	}

	return AIPerformancePoint{
		Timestamp: time.Now(),
	}
}

// RecordPrediction registra o resultado de uma predição
func (m *AIMonitor) RecordPrediction(success bool, responseTime time.Duration) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.metrics.TotalPredictions++
	if success {
		m.metrics.SuccessfulPredictions++
	} else {
		m.metrics.FailedPredictions++
	}

	// Atualizar tempo de resposta médio
	totalTime := m.metrics.AverageResponseTime * float64(m.metrics.TotalPredictions-1)
	m.metrics.AverageResponseTime = (totalTime + float64(responseTime.Nanoseconds())/1000000) / float64(m.metrics.TotalPredictions)

	// Calcular taxa de erro
	m.metrics.ErrorRate = float64(m.metrics.FailedPredictions) / float64(m.metrics.TotalPredictions) * 100

	m.metrics.LastUpdated = time.Now()
}

// RecordGeoPrediction registra o resultado de uma predição geográfica
func (m *AIMonitor) RecordGeoPrediction(success bool, responseTime time.Duration, geoAffinity float64, crossRegion bool) {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Registrar predição base
	m.metrics.TotalPredictions++
	m.metrics.GeoPredictions++

	if success {
		m.metrics.SuccessfulPredictions++
	} else {
		m.metrics.FailedPredictions++
	}

	// Atualizar métricas geográficas
	if geoAffinity > 0 {
		totalAffinity := m.metrics.AverageGeoAffinity * float64(m.metrics.GeoPredictions-1)
		m.metrics.AverageGeoAffinity = (totalAffinity + geoAffinity) / float64(m.metrics.GeoPredictions)
	}

	if crossRegion {
		m.metrics.CrossRegionRequests++
	}

	// Atualizar tempo de resposta médio
	totalTime := m.metrics.AverageResponseTime * float64(m.metrics.TotalPredictions-1)
	m.metrics.AverageResponseTime = (totalTime + float64(responseTime.Nanoseconds())/1000000) / float64(m.metrics.TotalPredictions)

	// Calcular taxa de erro
	m.metrics.ErrorRate = float64(m.metrics.FailedPredictions) / float64(m.metrics.TotalPredictions) * 100

	m.metrics.LastUpdated = time.Now()
}

// collectMetrics coleta métricas do sistema
func (m *AIMonitor) collectMetrics() {
	m.mu.Lock()
	defer m.mu.Unlock()

	// Adicionar ponto de performance
	point := AIPerformancePoint{
		Timestamp:        time.Now(),
		Accuracy:         m.metrics.CurrentAccuracy,
		ResponseTime:     m.metrics.AverageResponseTime,
		ThroughputQPS:    m.metrics.ThroughputQPS,
		ErrorRate:        m.metrics.ErrorRate,
		PredictionsCount: m.metrics.TotalPredictions,
	}

	m.performanceHistory = append(m.performanceHistory, point)

	// Manter apenas os últimos 100 pontos
	if len(m.performanceHistory) > 100 {
		m.performanceHistory = m.performanceHistory[1:]
	}

	// Verificar se precisa gerar alertas
	m.checkForAlerts()
}

// checkForAlerts verifica se precisa gerar novos alertas
func (m *AIMonitor) checkForAlerts() {
	if m.metrics.ErrorRate > m.service.config.AlertThreshold {
		alert := AIAlert{
			Type:      "high_error_rate",
			Level:     "warning",
			Message:   fmt.Sprintf("Error rate is %.2f%%, threshold is %.2f%%", m.metrics.ErrorRate, m.service.config.AlertThreshold),
			Timestamp: time.Now(),
			Resolved:  false,
		}
		m.alerts = append(m.alerts, alert)
	}
}

// autoRestartLoop monitora e reinicia automaticamente componentes com falha
func (s *AIService) autoRestartLoop(ctx context.Context) {
	ticker := time.NewTicker(s.config.HealthCheckInterval)
	defer ticker.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-ticker.C:
			if !s.IsHealthy() && s.config.AutoRestart {
				s.logger.Warn("AI Service unhealthy, attempting auto-restart")
				if err := s.attemptRestart(); err != nil {
					s.logger.Error("Auto-restart failed", zap.Error(err))
				}
			}
		}
	}
}

// attemptRestart tenta reiniciar o serviço de IA
func (s *AIService) attemptRestart() error {
	s.logger.Info("Attempting to restart AI Service...")

	// Parar componentes
	s.cancel()

	// Criar novo contexto
	s.ctx, s.cancel = context.WithCancel(context.Background())

	// Reinicializar predictor
	if s.predictor != nil && s.predictor.config != nil {
		s.predictor = NewAIPredictor(s.predictor.config, s.logger)
	}

	// Reiniciar componentes
	go s.healthChecker.Start(s.ctx)
	go s.monitor.Start(s.ctx)

	s.logger.Info("AI Service restarted successfully")
	return nil
}

// saveState salva o estado atual do sistema de IA
func (s *AIService) saveState() error {
	// Implementar persistência de estado
	s.logger.Info("Saving AI Service state...")
	// TODO: Implementar salvamento em Redis ou arquivo
	return nil
}
