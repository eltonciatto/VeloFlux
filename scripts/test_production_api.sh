#!/bin/bash

# VeloFlux API Production Test Suite
# Este script testa todas as APIs implementadas no VeloFlux

set -e

# Configurações
BASE_URL="http://localhost:8080"
API_URL="$BASE_URL/api"
AUTH_USER="admin"
AUTH_PASS="admin123"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
}

# Função para fazer requisições HTTP
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=${4:-true}
    
    if [ "$auth" = "true" ]; then
        if [ -n "$data" ]; then
            curl -s -X "$method" \
                -u "$AUTH_USER:$AUTH_PASS" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint"
        else
            curl -s -X "$method" \
                -u "$AUTH_USER:$AUTH_PASS" \
                "$API_URL$endpoint"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint"
        else
            curl -s -X "$method" \
                "$API_URL$endpoint"
        fi
    fi
}

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=${3:-200}
    local data=$4
    local auth=${5:-true}
    
    log "Testing $method $endpoint"
    
    local response
    local status_code
    
    if [ "$auth" = "true" ]; then
        if [ -n "$data" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -u "$AUTH_USER:$AUTH_PASS" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -u "$AUTH_USER:$AUTH_PASS" \
                "$API_URL$endpoint")
        fi
    else
        if [ -n "$data" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_URL$endpoint")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                "$API_URL$endpoint")
        fi
    fi
    
    status_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [ "$status_code" -eq "$expected_status" ]; then
        success "$method $endpoint - Status: $status_code"
        return 0
    else
        error "$method $endpoint - Expected: $expected_status, Got: $status_code"
        echo "Response: $body"
        return 1
    fi
}

# Função principal de execução
run_test() {
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if "$@"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
}

# Inicializar contadores
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

echo "🚀 VeloFlux Production API Test Suite"
echo "====================================="
echo "Testing against: $BASE_URL"
echo "Authentication: $AUTH_USER"
echo ""

# Teste básico de conectividade
log "Testing basic connectivity..."
if curl -s "$BASE_URL/" | grep -q "VeloFlux"; then
    success "VeloFlux API is running"
else
    error "Cannot connect to VeloFlux API at $BASE_URL"
    exit 1
fi

# Testes das APIs Core
echo ""
echo "📊 1. CORE LOAD BALANCER APIs"
echo "=============================="
run_test test_endpoint GET "/status"
run_test test_endpoint GET "/health"
run_test test_endpoint GET "/metrics"
run_test test_endpoint GET "/config"
run_test test_endpoint GET "/cluster"
run_test test_endpoint GET "/pools"
run_test test_endpoint GET "/backends"
run_test test_endpoint GET "/routes"

# Testes de Monitoring & Status
echo ""
echo "📈 2. MONITORING & STATUS"
echo "========================="
run_test test_endpoint GET "/status/health"
run_test test_endpoint GET "/analytics"
run_test test_endpoint POST "/system/drain" 200 '{"confirm":true}'

# Testes de APIs de Debug
echo ""
echo "🔍 3. DEBUG APIs"
echo "================"
run_test test_endpoint GET "/debug/pools"
run_test test_endpoint GET "/debug/backends"
run_test test_endpoint GET "/debug/routes"  
run_test test_endpoint GET "/debug/performance"

# Testes de Bulk Operations  
echo ""
echo "📦 4. BULK OPERATIONS"
echo "===================="
run_test test_endpoint POST "/bulk/backends" 200 '{"operations":[{"action":"test"}]}'
run_test test_endpoint POST "/bulk/routes" 200 '{"operations":[{"action":"test"}]}'
run_test test_endpoint POST "/bulk/pools" 200 '{"operations":[{"action":"test"}]}'

# Testes de Configuration Management
echo ""
echo "⚙️  5. CONFIGURATION MANAGEMENT"
echo "==============================="
run_test test_endpoint GET "/config/export"
run_test test_endpoint POST "/config/validate" 200 '{"test":"config"}'
run_test test_endpoint GET "/backup/create"

# Testes de WebSocket endpoints
echo ""
echo "🔄 6. WEBSOCKET APIs"
echo "==================="
run_test test_websocket_endpoints

# Testes de Billing Avançados
echo ""
echo "💰  7. ADVANCED BILLING APIs"
echo "============================="
run_test test_enhanced_billing

# Testes de AI/ML APIs (podem falhar se orquestrador não estiver configurado)
echo ""
echo "🤖 8. AI/ML APIs"
echo "================"
log "Testing AI/ML endpoints (may fail if orchestrator not configured)..."
if test_endpoint GET "/ai/models" 501 2>/dev/null; then
    warning "AI/ML endpoints not available (orchestrator not configured)"
else
    run_test test_endpoint GET "/ai/health"
    run_test test_endpoint GET "/ai/config"
    run_test test_endpoint GET "/ai/predictions"
    run_test test_endpoint GET "/ai/history"
fi

# Resultados finais
echo ""
echo "=================================="
echo "📊 TEST RESULTS SUMMARY"
echo "=================================="
echo "Total Tests:  $TOTAL_TESTS"
echo "Passed:       $PASSED_TESTS"
echo "Failed:       $FAILED_TESTS"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    success "🎉 ALL TESTS PASSED! VeloFlux API is production ready!"
    echo ""
    echo "✅ Core Load Balancer APIs: Functional"
    echo "✅ Monitoring & Status: Functional"
    echo "✅ Debug APIs: Functional"
    echo "✅ Configuration Management: Functional"
    echo "✅ Bulk Operations: Functional"
    echo "✅ WebSocket Controls: Functional"
    echo "✅ Production Features: Ready"
    echo ""
    echo "🚀 VeloFlux is ready for production deployment!"
    exit 0
else
    warning "⚠️  Some tests failed. Check the output above for details."
    echo ""
    echo "Success Rate: $((PASSED_TESTS * 100 / TOTAL_TESTS))%"
    echo ""
    echo "Note: Some failures are expected if certain features"
    echo "      (like tenant management or AI/ML) are not configured."
    exit 1
fi
