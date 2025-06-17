// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package ai

import (
	"net"
	"testing"
	"time"

	"go.uber.org/zap/zaptest"
)

// TestAIService_NewAIService testa a criação de um novo serviço de IA
func TestAIService_NewAIService(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 10 * time.Second,
		FailoverTimeout:     5 * time.Second,
		MonitoringInterval:  5 * time.Second,
		AlertThreshold:      10.0,
		AutoRestart:         true,
		MaxRetries:          3,
		RetryBackoff:        time.Second,
	}

	aiConfig := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       10,
		ConfidenceThreshold: 0.8,
		AdaptiveAlgorithms:  true,
		ApplicationAware:    true,
	}

	service := NewAIService(config, aiConfig, logger)

	if service == nil {
		t.Fatal("NewAIService returned nil")
	}

	if service.config != config {
		t.Error("Config not properly set")
	}

	if service.predictor == nil {
		t.Error("Predictor not initialized")
	}

	if service.healthChecker == nil {
		t.Error("HealthChecker not initialized")
	}

	if service.failoverManager == nil {
		t.Error("FailoverManager not initialized")
	}

	if service.monitor == nil {
		t.Error("Monitor not initialized")
	}

	if service.running {
		t.Error("Service should not be running initially")
	}
}

// TestAIService_StartStop testa o start e stop do serviço
func TestAIService_StartStop(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		FailoverTimeout:     time.Second,
		MonitoringInterval:  100 * time.Millisecond,
		AlertThreshold:      10.0,
		AutoRestart:         false, // Desabilitar auto-restart para testes
		MaxRetries:          3,
		RetryBackoff:        100 * time.Millisecond,
	}

	aiConfig := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
		AdaptiveAlgorithms:  true,
	}

	service := NewAIService(config, aiConfig, logger)

	// Testar start
	err := service.Start()
	if err != nil {
		t.Fatalf("Failed to start service: %v", err)
	}

	if !service.running {
		t.Error("Service should be running after start")
	}

	// Aguardar um pouco para os componentes iniciarem
	time.Sleep(200 * time.Millisecond)

	// Verificar se está saudável
	if !service.IsHealthy() {
		t.Error("Service should be healthy after start")
	}

	// Testar stop
	err = service.Stop()
	if err != nil {
		t.Fatalf("Failed to stop service: %v", err)
	}

	if service.running {
		t.Error("Service should not be running after stop")
	}

	// Testar duplo start (deve retornar erro)
	service.Start()
	err = service.Start()
	if err == nil {
		t.Error("Expected error when starting already running service")
	}

	service.Stop()
}

// TestAIService_DisabledService testa comportamento quando desabilitado
func TestAIService_DisabledService(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled: false, // Desabilitado
	}

	aiConfig := &AIConfig{
		Enabled: false,
	}

	service := NewAIService(config, aiConfig, logger)

	// Start deve passar mas não fazer nada
	err := service.Start()
	if err != nil {
		t.Fatalf("Start should succeed even when disabled: %v", err)
	}

	// Não deve estar saudável se desabilitado
	if service.IsHealthy() {
		t.Error("Disabled service should not be healthy")
	}

	// Stop deve funcionar
	err = service.Stop()
	if err != nil {
		t.Fatalf("Stop should succeed: %v", err)
	}
}

// TestAIService_GetStatus testa o status do serviço
func TestAIService_GetStatus(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		MaxRetries:          3,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 5,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(200 * time.Millisecond)

	status := service.GetStatus()

	if !status.Running {
		t.Error("Status should show service as running")
	}

	if !status.Enabled {
		t.Error("Status should show service as enabled")
	}

	if status.Health.Message == "" {
		t.Error("Health status should have a message")
	}

	if status.CurrentModel == "" {
		t.Error("Current model should be set")
	}
}

// TestAIService_Prediction testa predições básicas
func TestAIService_Prediction(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		MaxRetries:          3,
		RetryBackoff:        50 * time.Millisecond,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2, // Reduzir para teste
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(200 * time.Millisecond)

	// Criar padrão de tráfego para teste
	pattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         100.0,
		ResponseTime:        50.0,
		ErrorRate:           2.0,
		AverageResponseTime: 45.0,
	}

	// Adicionar alguns dados históricos para treinar
	for i := 0; i < 5; i++ {
		testPattern := pattern
		testPattern.RequestRate = float64(80 + i*10)
		service.predictor.RecordMetrics(testPattern.RequestRate, testPattern.ResponseTime, testPattern.ErrorRate, nil)
	}

	// Fazer predição
	result, err := service.Predict(pattern)
	if err != nil {
		t.Fatalf("Prediction failed: %v", err)
	}

	if result == nil {
		t.Fatal("Prediction result is nil")
	}

	if result.Algorithm == "" {
		t.Error("Algorithm should be set in prediction result")
	}

	if result.Confidence < 0 || result.Confidence > 1 {
		t.Errorf("Confidence should be between 0 and 1, got: %f", result.Confidence)
	}

	if result.Timestamp.IsZero() {
		t.Error("Timestamp should be set in prediction result")
	}
}

// TestAIService_GeoContext testa predições com contexto geográfico
func TestAIService_GeoContext(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		MaxRetries:          3,
		RetryBackoff:        50 * time.Millisecond,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(200 * time.Millisecond)

	// Criar padrão de tráfego
	pattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         100.0,
		ResponseTime:        50.0,
		ErrorRate:           2.0,
		AverageResponseTime: 45.0,
		ClientRegion:        "us-east-1",
		BackendRegion:       "us-west-2",
		GeoDistanceKm:       4000.0,
	}

	// Adicionar dados históricos
	for i := 0; i < 5; i++ {
		testPattern := pattern
		testPattern.RequestRate = float64(80 + i*10)
		service.predictor.RecordMetrics(testPattern.RequestRate, testPattern.ResponseTime, testPattern.ErrorRate, nil)
	}

	// Fazer predição com contexto geográfico
	clientIP := net.ParseIP("192.168.1.1")
	backendOptions := []string{"backend1", "backend2", "backend3"}

	result, err := service.PredictWithGeoContext(pattern, clientIP, backendOptions)
	if err != nil {
		t.Fatalf("Geo prediction failed: %v", err)
	}

	if result == nil {
		t.Fatal("Geo prediction result is nil")
	}

	if result.Algorithm == "" {
		t.Error("Algorithm should be set in geo prediction result")
	}
}

// TestAIService_Metrics testa coleta de métricas
func TestAIService_Metrics(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 50 * time.Millisecond,
		MonitoringInterval:  50 * time.Millisecond,
		MaxRetries:          3,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(200 * time.Millisecond)

	// Obter métricas iniciais
	metrics := service.monitor.GetMetrics()
	if metrics == nil {
		t.Fatal("Metrics should not be nil")
	}

	initialPredictions := metrics.TotalPredictions

	// Fazer algumas predições para gerar métricas
	pattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         100.0,
		ResponseTime:        50.0,
		ErrorRate:           2.0,
		AverageResponseTime: 45.0,
	}

	// Adicionar dados históricos
	for i := 0; i < 5; i++ {
		testPattern := pattern
		testPattern.RequestRate = float64(80 + i*10)
		service.predictor.RecordMetrics(testPattern.RequestRate, testPattern.ResponseTime, testPattern.ErrorRate, nil)
	}

	// Fazer várias predições
	for i := 0; i < 3; i++ {
		service.Predict(pattern)
		time.Sleep(10 * time.Millisecond)
	}

	// Aguardar coleta de métricas
	time.Sleep(150 * time.Millisecond)

	// Verificar métricas atualizadas
	updatedMetrics := service.monitor.GetMetrics()

	if updatedMetrics.TotalPredictions <= initialPredictions {
		t.Error("Total predictions should have increased")
	}

	if updatedMetrics.LastUpdated.IsZero() {
		t.Error("LastUpdated should be set")
	}
}

// TestAIService_Alerts testa o sistema de alertas
func TestAIService_Alerts(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 50 * time.Millisecond,
		MonitoringInterval:  50 * time.Millisecond,
		AlertThreshold:      5.0, // Limite baixo para gerar alerta
		MaxRetries:          3,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(100 * time.Millisecond)

	// Simular falhas para gerar alertas
	service.monitor.RecordPrediction(false, time.Millisecond)
	service.monitor.RecordPrediction(false, time.Millisecond)
	service.monitor.RecordPrediction(true, time.Millisecond)
	service.monitor.RecordPrediction(false, time.Millisecond)

	// Aguardar processamento
	time.Sleep(100 * time.Millisecond)

	alerts := service.monitor.GetActiveAlerts()

	// Verificar se há pelo menos um alerta
	if len(alerts) == 0 {
		t.Error("Expected at least one alert due to high error rate")
	}

	// Verificar propriedades do alerta
	for _, alert := range alerts {
		if alert.Type == "" {
			t.Error("Alert type should be set")
		}
		if alert.Level == "" {
			t.Error("Alert level should be set")
		}
		if alert.Message == "" {
			t.Error("Alert message should be set")
		}
		if alert.Timestamp.IsZero() {
			t.Error("Alert timestamp should be set")
		}
	}
}

// TestAIService_HealthChecker testa o health checker
func TestAIService_HealthChecker(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 50 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		MaxRetries:          3,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	// Aguardar alguns health checks
	time.Sleep(200 * time.Millisecond)

	health := service.healthChecker.GetStatus()

	if !health.Healthy {
		t.Error("Service should be healthy")
	}

	if health.ResponseTime <= 0 {
		t.Error("Response time should be positive")
	}

	if health.LastHealthyCheck.IsZero() {
		t.Error("LastHealthyCheck should be set")
	}

	if health.Message == "" {
		t.Error("Health message should be set")
	}
}

// TestAIService_Concurrency testa operações concorrentes
func TestAIService_Concurrency(t *testing.T) {
	logger := zaptest.NewLogger(t)

	config := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		MaxRetries:          3,
		RetryBackoff:        10 * time.Millisecond,
	}

	aiConfig := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	service := NewAIService(config, aiConfig, logger)
	service.Start()
	defer service.Stop()

	time.Sleep(200 * time.Millisecond)

	// Adicionar dados históricos
	pattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         100.0,
		ResponseTime:        50.0,
		ErrorRate:           2.0,
		AverageResponseTime: 45.0,
	}

	for i := 0; i < 5; i++ {
		testPattern := pattern
		testPattern.RequestRate = float64(80 + i*10)
		service.predictor.RecordMetrics(testPattern.RequestRate, testPattern.ResponseTime, testPattern.ErrorRate, nil)
	}

	// Executar predições concorrentes
	done := make(chan bool, 10)
	errors := make(chan error, 10)

	for i := 0; i < 10; i++ {
		go func(id int) {
			defer func() { done <- true }()

			testPattern := pattern
			testPattern.RequestRate = float64(90 + id*5)

			_, err := service.Predict(testPattern)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	// Aguardar conclusão
	for i := 0; i < 10; i++ {
		select {
		case <-done:
			// OK
		case err := <-errors:
			t.Errorf("Concurrent prediction failed: %v", err)
		case <-time.After(5 * time.Second):
			t.Fatal("Timeout waiting for concurrent predictions")
		}
	}

	// Verificar se o serviço ainda está funcionando
	if !service.IsHealthy() {
		t.Error("Service should remain healthy after concurrent operations")
	}
}
