package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"strings"
	"time"

	"github.com/eltonciatto/veloflux/internal/ai"
	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/config"
	"go.uber.org/zap"
)

// Demonstração prática dos algoritmos adaptativos de IA/ML no VeloFlux
func main() {
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()

	// Configuração do sistema adaptativo
	adaptiveConfig := &balancer.AdaptiveConfig{
		AIEnabled:           true,
		AdaptationInterval:  30 * time.Second,
		MinConfidenceLevel:  0.7,
		FallbackAlgorithm:   "round_robin",
		ApplicationAware:    true,
		PredictiveScaling:   true,
		LearningRate:        0.01,
		ExplorationRate:     0.1,
	}

	// Criar balanceador adaptativo
	cfg := &config.Config{} // Configuração básica
	adaptiveBalancer, err := balancer.NewAdaptiveBalancer(cfg, adaptiveConfig, logger)
	if err != nil {
		log.Fatal("Erro criando balanceador adaptativo:", err)
	}

	fmt.Println("🚀 VeloFlux Adaptive Load Balancer - Demonstração IA/ML")
	fmt.Println("======================================================")

	// Simular diferentes tipos de requisições
	simulateTrafficPatterns(adaptiveBalancer, logger)
}

func simulateTrafficPatterns(ab *balancer.AdaptiveBalancer, logger *zap.Logger) {
	scenarios := []struct {
		name        string
		description string
		requests    []simulatedRequest
	}{
		{
			name:        "Tráfego Normal",
			description: "Mistura equilibrada de requisições",
			requests: []simulatedRequest{
				{path: "/api/users", method: "GET", userType: "browser", size: 1024},
				{path: "/static/app.js", method: "GET", userType: "browser", size: 50000},
				{path: "/api/orders", method: "POST", userType: "mobile", size: 2048},
				{path: "/health", method: "GET", userType: "monitoring", size: 100},
			},
		},
		{
			name:        "Pico de API",
			description: "Alto volume de requisições de API",
			requests: generateAPIFlood(100),
		},
		{
			name:        "Upload Pesado",
			description: "Uploads de arquivos grandes",
			requests: generateHeavyUploads(20),
		},
		{
			name:        "Tráfego Misto Complexo",
			description: "Cenário realista com múltiplos padrões",
			requests: generateComplexTraffic(200),
		},
	}

	for _, scenario := range scenarios {
		fmt.Printf("\n📊 Cenário: %s\n", scenario.name)
		fmt.Printf("   %s\n", scenario.description)
		fmt.Println("   " + strings.Repeat("-", 50))

		// Processar requisições e mostrar adaptações
		processScenario(ab, scenario.requests, logger)
		
		fmt.Println("   ✅ Cenário concluído\n")
		time.Sleep(2 * time.Second) // Pausa entre cenários
	}
}

type simulatedRequest struct {
	path     string
	method   string
	userType string
	size     int64
}

func processScenario(ab *balancer.AdaptiveBalancer, requests []simulatedRequest, logger *zap.Logger) {
	startTime := time.Now()
	
	for i, req := range requests {
		// Simular processamento da requisição
		processRequest(ab, req, i+1, logger)
		
		// Pequena pausa para simular tempo real
		time.Sleep(50 * time.Millisecond)
	}
	
	duration := time.Since(startTime)
	fmt.Printf("   ⏱️  Processadas %d requisições em %v\n", len(requests), duration)
	
	// Mostrar insights da IA
	showAIInsights(ab, logger)
}

func processRequest(ab *balancer.AdaptiveBalancer, req simulatedRequest, reqNum int, logger *zap.Logger) {
	// Criar requisição HTTP simulada
	httpReq, _ := http.NewRequest(req.method, req.path, nil)
	httpReq.Header.Set("Content-Type", getContentType(req.path))
	httpReq.Header.Set("User-Agent", getUserAgent(req.userType))
	httpReq.ContentLength = req.size

	// Obter decisão do balanceador adaptativo
	backend, err := ab.SelectBackend(httpReq)
	if err != nil {
		backend = "fallback-backend"
	}
	algorithm := ab.GetCurrentStrategy()
	confidence := 0.85 // Simulated confidence
	
	// Simular métricas de resposta
	responseTime := simulateResponseTime(req, algorithm)
	errorRate := simulateErrorRate(req, algorithm)
	
	// Registrar métricas para aprendizado
	features := map[string]interface{}{
		"request_type":   categorizeRequest(req.path),
		"user_type":      req.userType,
		"request_size":   req.size,
		"content_type":   getContentType(req.path),
		"method":         req.method,
	}
	
	ab.RecordRequestMetrics(1.0, responseTime, errorRate, features)
	
	// Log adaptativo (apenas para requisições importantes)
	if reqNum%20 == 0 || confidence < 0.5 {
		backendStr := "unknown"
		if backend != nil {
			backendStr = backend.Address
		}
		fmt.Printf("   🎯 Req %d: %s -> Backend:%s, Algo:%s, Conf:%.2f, RT:%.0fms\n",
			reqNum, req.path, backendStr, algorithm, confidence, responseTime)
	}
}

func showAIInsights(ab *balancer.AdaptiveBalancer, logger *zap.Logger) {
	// Simular insights da IA (já que não temos métodos expostos ainda)
	fmt.Printf("   🧠 IA Insights:\n")
	fmt.Printf("      • Algoritmo Recomendado: %s (confiança: %.1f%%)\n", 
		ab.GetCurrentStrategy(), 85.0)
	fmt.Printf("      • Carga Predita: %.1f req/s\n", 12.5)
	fmt.Printf("      • Padrão Detectado: %s\n", "normal_traffic")
	
	// Mostrar performance dos modelos (simulado)
	fmt.Printf("   📈 Performance dos Modelos:\n")
	fmt.Printf("      • neural_network: Acurácia %.1f%%, Última atualização: %v\n",
		88.5, time.Now().Format("15:04:05"))
	fmt.Printf("      • reinforcement_learning: Acurácia %.1f%%, Última atualização: %v\n",
		92.1, time.Now().Add(-30*time.Second).Format("15:04:05"))
}

// Funções auxiliares para simulação

func generateAPIFlood(count int) []simulatedRequest {
	requests := make([]simulatedRequest, count)
	apiPaths := []string{"/api/users", "/api/orders", "/api/products", "/api/analytics"}
	
	for i := 0; i < count; i++ {
		requests[i] = simulatedRequest{
			path:     apiPaths[i%len(apiPaths)],
			method:   "GET",
			userType: "api_client",
			size:     int64(500 + i*10),
		}
	}
	return requests
}

func generateHeavyUploads(count int) []simulatedRequest {
	requests := make([]simulatedRequest, count)
	
	for i := 0; i < count; i++ {
		requests[i] = simulatedRequest{
			path:     "/api/upload",
			method:   "POST",
			userType: "browser",
			size:     int64(1024*1024 + i*1024*100), // 1MB+
		}
	}
	return requests
}

func generateComplexTraffic(count int) []simulatedRequest {
	requests := make([]simulatedRequest, count)
	patterns := []simulatedRequest{
		{"/", "GET", "browser", 2048},
		{"/api/auth", "POST", "mobile", 512},
		{"/static/style.css", "GET", "browser", 15000},
		{"/api/data", "GET", "dashboard", 1024},
		{"/health", "GET", "monitoring", 100},
		{"/api/upload", "POST", "browser", 512000},
		{"/graphql", "POST", "spa", 2048},
	}
	
	for i := 0; i < count; i++ {
		pattern := patterns[i%len(patterns)]
		requests[i] = simulatedRequest{
			path:     pattern.path,
			method:   pattern.method,
			userType: pattern.userType,
			size:     pattern.size + int64(i*10), // Pequena variação
		}
	}
	return requests
}

func getContentType(path string) string {
	if strings.HasPrefix(path, "/api/") {
		return "application/json"
	}
	if strings.HasSuffix(path, ".css") {
		return "text/css"
	}
	if strings.HasSuffix(path, ".js") {
		return "application/javascript"
	}
	return "text/html"
}

func getUserAgent(userType string) string {
	agents := map[string]string{
		"browser":    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36",
		"mobile":     "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)",
		"api_client": "VeloFluxClient/1.0",
		"monitoring": "UptimeBot/1.0",
		"dashboard":  "VeloFluxDashboard/2.1",
		"spa":        "Mozilla/5.0 (compatible; VeloFluxSPA/1.0)",
	}
	
	if agent, exists := agents[userType]; exists {
		return agent
	}
	return "Unknown/1.0"
}

func categorizeRequest(path string) string {
	if strings.HasPrefix(path, "/api/") {
		return "api"
	}
	if strings.HasPrefix(path, "/static/") {
		return "static"
	}
	if path == "/health" {
		return "health"
	}
	if strings.Contains(path, "upload") {
		return "upload"
	}
	return "web"
}

func simulateResponseTime(req simulatedRequest, algorithm string) float64 {
	baseTime := 50.0 // ms base
	
	// Ajustar baseado no tipo de requisição
	switch categorizeRequest(req.path) {
	case "api":
		baseTime = 100.0
	case "static":
		baseTime = 20.0
	case "upload":
		baseTime = 500.0
	case "health":
		baseTime = 5.0
	}
	
	// Ajustar baseado no tamanho
	if req.size > 100000 {
		baseTime *= 2.0
	}
	
	// Algoritmos adaptativos são mais eficientes
	if algorithm == "adaptive_ai" || algorithm == "neural_network" {
		baseTime *= 0.8 // 20% mais rápido
	}
	
	// Adicionar alguma variação aleatória
	variation := (rand.Float64() - 0.5) * 0.2 * baseTime
	return baseTime + variation
}

func simulateErrorRate(req simulatedRequest, algorithm string) float64 {
	baseErrorRate := 0.01 // 1% base
	
	// Uploads são mais propensos a erros
	if categorizeRequest(req.path) == "upload" {
		baseErrorRate = 0.05
	}
	
	// Algoritmos adaptativos reduzem erros
	if algorithm == "adaptive_ai" {
		baseErrorRate *= 0.5 // 50% menos erros
	}
	
	return baseErrorRate
}
