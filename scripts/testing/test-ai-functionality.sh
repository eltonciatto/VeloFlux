#!/bin/bash

# 🚫 Not for Commercial Use Without License
# 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
# 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

# Script para executar testes gerais de funcionamento da IA

set -e

echo "🤖 Iniciando Testes Gerais de Funcionamento da IA VeloFlux"
echo "=========================================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para mostrar resultado
show_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        return 1
    fi
}

# Função para mostrar info
show_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Função para mostrar warning
show_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Navegar para diretório do backend
cd "$(dirname "$0")/backend"

echo ""
show_info "1. Verificando dependências..."

# Verificar se Go está instalado
if ! command -v go &> /dev/null; then
    echo -e "${RED}❌ Go não está instalado${NC}"
    exit 1
fi

# Verificar versão do Go
GO_VERSION=$(go version | cut -d' ' -f3)
show_info "Versão do Go: $GO_VERSION"

# Baixar dependências
show_info "Baixando dependências..."
go mod download
show_result $? "Dependências baixadas"

echo ""
show_info "2. Compilando módulos..."

# Compilar módulo AI
go build ./internal/ai/...
show_result $? "Módulo AI compilado"

# Compilar projeto principal
go build ./cmd/velofluxlb
show_result $? "Projeto principal compilado"

echo ""
show_info "3. Executando testes unitários..."

# Executar testes do AI Service
echo ""
show_info "3.1. Testando AIService..."
go test -v ./internal/ai/... -run "TestAIService_*" -timeout 30s
show_result $? "Testes do AIService"

# Executar testes do AI Predictor
echo ""
show_info "3.2. Testando AIPredictor..."
go test -v ./internal/ai/... -run "TestAIPredictor_*" -timeout 30s
show_result $? "Testes do AIPredictor"

# Executar testes de GeoIP
echo ""
show_info "3.3. Testando funcionalidades GeoIP..."
go test -v ./internal/ai/... -run "*Geo*" -timeout 30s
show_result $? "Testes GeoIP"

echo ""
show_info "4. Testes de performance e concorrência..."

# Testes de concorrência
go test -v ./internal/ai/... -run "*Concurrent*" -timeout 60s
show_result $? "Testes de concorrência"

echo ""
show_info "5. Testes de integração..."

# Executar todos os testes do módulo AI
go test -v ./internal/ai/... -timeout 120s
AI_TEST_RESULT=$?

if [ $AI_TEST_RESULT -eq 0 ]; then
    show_result 0 "Todos os testes do módulo AI passaram"
else
    show_result 1 "Alguns testes do módulo AI falharam"
fi

echo ""
show_info "6. Análise de cobertura..."

# Executar testes com cobertura
go test -coverprofile=ai_coverage.out ./internal/ai/...
COVERAGE_RESULT=$?

if [ $COVERAGE_RESULT -eq 0 ]; then
    # Mostrar cobertura
    COVERAGE=$(go tool cover -func=ai_coverage.out | grep "total:" | awk '{print $3}')
    show_info "Cobertura de testes: $COVERAGE"
    
    # Gerar relatório HTML (opcional)
    go tool cover -html=ai_coverage.out -o ai_coverage.html
    show_info "Relatório de cobertura salvo em: ai_coverage.html"
fi

echo ""
show_info "7. Verificações de qualidade..."

# Verificar com go vet
go vet ./internal/ai/...
show_result $? "Verificação go vet"

# Verificar formatação
UNFORMATTED=$(gofmt -l ./internal/ai/)
if [ -z "$UNFORMATTED" ]; then
    show_result 0 "Código formatado corretamente"
else
    show_warning "Arquivos não formatados encontrados:"
    echo "$UNFORMATTED"
fi

echo ""
show_info "8. Testes de funcionalidade específica..."

# Teste específico de criação de serviço
echo ""
show_info "8.1. Teste de criação de AIService..."
go test -v ./internal/ai/ -run "TestAIService_NewAIService" -timeout 10s
show_result $? "Criação de AIService"

# Teste específico de predições
echo ""
show_info "8.2. Teste de predições básicas..."
go test -v ./internal/ai/ -run "TestAIService_Prediction" -timeout 20s
show_result $? "Predições básicas"

# Teste específico de contexto geográfico
echo ""
show_info "8.3. Teste de contexto geográfico..."
go test -v ./internal/ai/ -run "TestAIService_GeoContext" -timeout 20s
show_result $? "Contexto geográfico"

# Teste específico de métricas
echo ""
show_info "8.4. Teste de métricas..."
go test -v ./internal/ai/ -run "TestAIService_Metrics" -timeout 20s
show_result $? "Sistema de métricas"

# Teste específico de alertas
echo ""
show_info "8.5. Teste de alertas..."
go test -v ./internal/ai/ -run "TestAIService_Alerts" -timeout 20s
show_result $? "Sistema de alertas"

# Teste específico de health checker
echo ""
show_info "8.6. Teste de health checker..."
go test -v ./internal/ai/ -run "TestAIService_HealthChecker" -timeout 20s
show_result $? "Health checker"

echo ""
show_info "9. Teste de funcionalidade completa..."

# Criar um teste de integração completo
cat > ai_integration_test.go << 'EOF'
package main

import (
	"fmt"
	"net"
	"time"
	
	"github.com/eltonciatto/veloflux/internal/ai"
	"go.uber.org/zap"
)

func main() {
	// Configurar logger
	logger, _ := zap.NewDevelopment()
	defer logger.Sync()
	
	// Configurar AI Service
	config := &ai.AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 100 * time.Millisecond,
		MonitoringInterval:  100 * time.Millisecond,
		AlertThreshold:      10.0,
		MaxRetries:          3,
		RetryBackoff:        50 * time.Millisecond,
	}
	
	aiConfig := &ai.AIConfig{
		Enabled:       true,
		ModelType:    "neural_network",
		MinDataPoints: 2,
	}
	
	// Criar e iniciar serviço
	service := ai.NewAIService(config, aiConfig, logger)
	if err := service.Start(); err != nil {
		logger.Fatal("Failed to start AI service", zap.Error(err))
	}
	defer service.Stop()
	
	// Aguardar inicialização
	time.Sleep(200 * time.Millisecond)
	
	// Verificar se está saudável
	if !service.IsHealthy() {
		logger.Fatal("AI service is not healthy")
	}
	
	// Adicionar dados de treinamento
	patterns := []ai.TrafficPattern{
		{
			Timestamp:           time.Now().Add(-5 * time.Minute),
			RequestRate:         80.0,
			ResponseTime:        40.0,
			ErrorRate:          1.0,
			AverageResponseTime: 38.0,
			ClientRegion:        "us-east-1",
			BackendRegion:       "us-east-1",
			GeoDistanceKm:       50.0,
		},
		{
			Timestamp:           time.Now().Add(-3 * time.Minute),
			RequestRate:         120.0,
			ResponseTime:        60.0,
			ErrorRate:          2.5,
			AverageResponseTime: 58.0,
			ClientRegion:        "us-west-2",
			BackendRegion:       "us-east-1",
			GeoDistanceKm:       4000.0,
		},
		{
			Timestamp:           time.Now().Add(-1 * time.Minute),
			RequestRate:         100.0,
			ResponseTime:        50.0,
			ErrorRate:          2.0,
			AverageResponseTime: 48.0,
			ClientRegion:        "eu-west-1",
			BackendRegion:       "us-east-1",
			GeoDistanceKm:       6000.0,
		},
	}
	
	for _, pattern := range patterns {
		service.GetPredictor().AddTrafficData(pattern)
	}
	
	// Fazer predições básicas
	testPattern := ai.TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         110.0,
		ResponseTime:        55.0,
		ErrorRate:          2.2,
		AverageResponseTime: 52.0,
		ClientRegion:        "us-east-1",
	}
	
	// Predição básica
	result, err := service.Predict(testPattern)
	if err != nil {
		logger.Fatal("Basic prediction failed", zap.Error(err))
	}
	
	fmt.Printf("✅ Predição Básica Bem-sucedida:\n")
	fmt.Printf("   Algoritmo: %s\n", result.Algorithm)
	fmt.Printf("   Confiança: %.2f\n", result.Confidence)
	fmt.Printf("   Ação Recomendada: %s\n", result.RecommendedAction)
	
	// Predição com contexto geográfico
	clientIP := net.ParseIP("8.8.8.8")
	backendOptions := []string{"backend-us-east", "backend-us-west", "backend-eu-west"}
	
	geoResult, err := service.PredictWithGeoContext(testPattern, clientIP, backendOptions)
	if err != nil {
		logger.Fatal("Geo prediction failed", zap.Error(err))
	}
	
	fmt.Printf("\n✅ Predição Geográfica Bem-sucedida:\n")
	fmt.Printf("   Algoritmo: %s\n", geoResult.Algorithm)
	fmt.Printf("   Confiança: %.2f\n", geoResult.Confidence)
	fmt.Printf("   Score Geo Afinidade: %.2f\n", geoResult.GeoAffinityScore)
	fmt.Printf("   Recomendação Regional: %s\n", geoResult.RegionRecommendation)
	
	// Verificar métricas
	metrics := service.GetMetrics()
	fmt.Printf("\n✅ Métricas Coletadas:\n")
	fmt.Printf("   Total de Predições: %d\n", metrics.TotalPredictions)
	fmt.Printf("   Predições Bem-sucedidas: %d\n", metrics.SuccessfulPredictions)
	fmt.Printf("   Taxa de Erro: %.2f%%\n", metrics.ErrorRate)
	fmt.Printf("   Predições Geográficas: %d\n", metrics.GeoPredictions)
	
	// Verificar status
	status := service.GetStatus()
	fmt.Printf("\n✅ Status do Serviço:\n")
	fmt.Printf("   Executando: %t\n", status.Running)
	fmt.Printf("   Habilitado: %t\n", status.Enabled)
	fmt.Printf("   Saudável: %t\n", status.Health.Healthy)
	fmt.Printf("   Modelo Atual: %s\n", status.CurrentModel)
	fmt.Printf("   Alertas Ativos: %d\n", len(status.ActiveAlerts))
	
	fmt.Println("\n🎉 Teste de Integração Completo - SUCESSO!")
}
EOF

# Executar teste de integração
echo ""
show_info "Executando teste de integração completo..."
go run ai_integration_test.go
INTEGRATION_RESULT=$?

# Limpar arquivo temporário
rm -f ai_integration_test.go

show_result $INTEGRATION_RESULT "Teste de integração completo"

echo ""
echo "=========================================================="

# Resultado final
if [ $AI_TEST_RESULT -eq 0 ] && [ $INTEGRATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS TESTES PASSARAM COM SUCESSO!${NC}"
    echo -e "${GREEN}✅ Sistema de IA VeloFlux está funcionando corretamente${NC}"
    echo -e "${GREEN}✅ Integração GeoIP funcionando${NC}"
    echo -e "${GREEN}✅ Predições inteligentes operacionais${NC}"
    echo -e "${GREEN}✅ Sistema de métricas e alertas funcionando${NC}"
    echo -e "${GREEN}✅ PRONTO PARA DEPLOY EM PRODUÇÃO!${NC}"
    
    echo ""
    show_info "Resumo das Funcionalidades Testadas:"
    echo "  • ✅ Criação e inicialização do AIService"
    echo "  • ✅ Predições básicas de IA"
    echo "  • ✅ Predições com contexto geográfico"
    echo "  • ✅ Sistema de métricas e monitoramento"
    echo "  • ✅ Sistema de alertas"
    echo "  • ✅ Health checking automático"
    echo "  • ✅ Failover e restart automático"
    echo "  • ✅ Operações concorrentes"
    echo "  • ✅ Integração com GeoIP"
    echo "  • ✅ Seleção automática de algoritmos"
    
    exit 0
else
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM${NC}"
    echo -e "${RED}🚨 Verificar problemas antes do deploy${NC}"
    exit 1
fi
