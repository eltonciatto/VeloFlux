// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package ai

import (
	"context"
	"fmt"
	"sync"
	"time"

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
	Enabled               bool          `yaml:"enabled"`
	HealthCheckInterval   time.Duration `yaml:"health_check_interval"`
	FailoverTimeout       time.Duration `yaml:"failover_timeout"`
	MonitoringInterval    time.Duration `yaml:"monitoring_interval"`
	AlertThreshold        float64       `yaml:"alert_threshold"`
	AutoRestart           bool          `yaml:"auto_restart"`
	BackupModelsEnabled   bool          `yaml:"backup_models_enabled"`
	PersistentStorage     bool          `yaml:"persistent_storage"`
	MaxRetries            int           `yaml:"max_retries"`
	RetryBackoff          time.Duration `yaml:"retry_backoff"`
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
	service           *AIService
	metrics           *AIMetrics
	alerts            []AIAlert
	performanceHistory []AIPerformancePoint
	logger            *zap.Logger
	mu                sync.RWMutex
}

// AIAlert representa um alerta do sistema de IA
type AIAlert struct {
	Type        string    `json:"type"`
	Level       string    `json:"level"` // "info", "warning", "critical"
	Message     string    `json:"message"`
	Timestamp   time.Time `json:"timestamp"`
	Resolved    bool      `json:"resolved"`
	ResolvedAt  time.Time `json:"resolved_at,omitempty"`
}

// AIPerformancePoint representa um ponto de performance no tempo
type AIPerformancePoint struct {
	Timestamp       time.Time `json:"timestamp"`
	Accuracy        float64   `json:"accuracy"`
	ResponseTime    float64   `json:"response_time_ms"`
	ThroughputQPS   float64   `json:"throughput_qps"`
	ErrorRate       float64   `json:"error_rate"`
	ModelLoad       float64   `json:"model_load"`
	PredictionsCount int64    `json:"predictions_count"`
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
		Running:         s.running,
		Enabled:         s.config.Enabled,
		Health:          s.healthChecker.GetStatus(),
		FailoverCount:   s.failoverManager.GetFailoverCount(),
		CurrentModel:    s.failoverManager.GetCurrentModel(),
		LastPrediction:  s.predictor.GetLastPredictionTime(),
		ActiveAlerts:    s.monitor.GetActiveAlerts(),
		Performance:     s.monitor.GetCurrentPerformance(),
	}
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

// GetMetrics retorna métricas detalhadas do sistema de IA
func (s *AIService) GetMetrics() *AIMetrics {
	return s.monitor.GetMetrics()
}

// GetAlerts retorna todos os alertas ativos
func (s *AIService) GetAlerts() []AIAlert {
	return s.monitor.GetActiveAlerts()
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
	if s.predictor != nil {
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

// AIServiceStatus representa o status completo do serviço
type AIServiceStatus struct {
	Running         bool                  `json:"running"`
	Enabled         bool                  `json:"enabled"`
	Health          AIHealthStatus        `json:"health"`
	FailoverCount   int                   `json:"failover_count"`
	CurrentModel    string                `json:"current_model"`
	LastPrediction  time.Time             `json:"last_prediction"`
	ActiveAlerts    []AIAlert             `json:"active_alerts"`
	Performance     AIPerformancePoint    `json:"performance"`
}
