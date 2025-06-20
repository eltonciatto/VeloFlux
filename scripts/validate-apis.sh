#!/bin/bash

# 🔧 SCRIPT DE VALIDAÇÃO DE APIS - Dashboard VeloFlux
# Testa todas as APIs do backend de forma sistemática

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
API_BASE="http://localhost:8080"
REPORTS_DIR="reports/api-tests"
JWT_TOKEN=""

# Create reports directory
mkdir -p $REPORTS_DIR

echo -e "${BLUE}🔧 VALIDAÇÃO COMPLETA DE APIS - VeloFlux${NC}"
echo "================================================="

# Functions
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local expected_status=$3
    local data=$4
    local description=$5
    
    print_status "Testando: $method $endpoint"
    
    local curl_cmd="curl -s -o /tmp/api_response.json -w '%{http_code}' -X $method '$API_BASE$endpoint' -H 'Content-Type: application/json'"
    
    if [ ! -z "$JWT_TOKEN" ]; then
        curl_cmd="$curl_cmd -H 'Authorization: Bearer $JWT_TOKEN'"
    fi
    
    if [ ! -z "$data" ]; then
        curl_cmd="$curl_cmd -d '$data'"
    fi
    
    local response_code=$(eval $curl_cmd 2>/dev/null)
    local response_body=$(cat /tmp/api_response.json 2>/dev/null || echo "{}")
    
    # Save response to report
    echo "## $method $endpoint" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo "**Descrição:** $description" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo "**Status Code:** $response_code" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo "**Response:**" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo '```json' >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo "$response_body" | jq . 2>/dev/null || echo "$response_body" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo '```' >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    echo "" >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md"
    
    if [ "$response_code" = "$expected_status" ]; then
        print_success "$method $endpoint - OK ($response_code)"
        return 0
    else
        print_error "$method $endpoint - FAILED (Expected: $expected_status, Got: $response_code)"
        return 1
    fi
}

# Initialize report
cat > "$REPORTS_DIR/api-test-$(date +%Y%m%d).md" << EOF
# Relatório de Teste de APIs - VeloFlux
**Data:** $(date)
**Base URL:** $API_BASE

EOF

# Check if backend is running
print_status "Verificando se backend está rodando..."
if ! curl -s "$API_BASE/health" > /dev/null 2>&1; then
    print_error "Backend não está respondendo em $API_BASE"
    echo "Por favor, inicie o backend com: cd backend && go run cmd/main.go"
    exit 1
fi

print_success "Backend está respondendo"

# Test public endpoints (no authentication required)
echo ""
echo -e "${YELLOW}📋 TESTANDO ENDPOINTS PÚBLICOS${NC}"
echo "================================================="

test_endpoint "GET" "/api/health" "200" "" "Health check do sistema"
test_endpoint "GET" "/api/version" "200" "" "Versão da API"

# Try to get JWT token (if authentication is implemented)
echo ""
echo -e "${YELLOW}📋 TESTANDO AUTENTICAÇÃO${NC}"
echo "================================================="

print_status "Tentando obter token JWT..."

# Try default admin credentials
LOGIN_DATA='{"email":"admin@veloflux.com","password":"admin123"}'
login_response=$(curl -s -o /tmp/login_response.json -w '%{http_code}' \
    -X POST "$API_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$LOGIN_DATA" 2>/dev/null)

if [ "$login_response" = "200" ]; then
    JWT_TOKEN=$(jq -r '.token' /tmp/login_response.json 2>/dev/null || echo "")
    if [ ! -z "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        print_success "Token JWT obtido com sucesso"
        echo "Token: ${JWT_TOKEN:0:50}..." > "$REPORTS_DIR/jwt-token.txt"
    else
        print_warning "Login bem-sucedido mas token não encontrado"
    fi
else
    print_warning "Login falhou ($login_response) - continuando sem autenticação"
fi

# Test protected endpoints
echo ""
echo -e "${YELLOW}📋 TESTANDO ENDPOINTS PROTEGIDOS${NC}"
echo "================================================="

# System Metrics
test_endpoint "GET" "/api/metrics/system" "200" "" "Métricas do sistema"
test_endpoint "GET" "/api/metrics/performance" "200" "" "Métricas de performance"
test_endpoint "GET" "/api/metrics/real-time" "200" "" "Métricas em tempo real"

# Backend Management
test_endpoint "GET" "/api/backends" "200" "" "Lista de backends"
test_endpoint "GET" "/api/pools" "200" "" "Lista de pools"
test_endpoint "GET" "/api/cluster/info" "200" "" "Informações do cluster"

# AI/ML Endpoints
test_endpoint "GET" "/api/ai/metrics" "200" "" "Métricas de IA"
test_endpoint "GET" "/api/ai/models" "200" "" "Lista de modelos"
test_endpoint "GET" "/api/ai/predictions" "200" "" "Predições da IA"

# Configuration
test_endpoint "GET" "/api/config" "200" "" "Configuração atual"
test_endpoint "GET" "/api/config/reload" "200" "" "Recarregar configuração"

# Multi-tenant
test_endpoint "GET" "/api/tenants" "200" "" "Lista de tenants"
test_endpoint "GET" "/api/tenant/current" "200" "" "Tenant atual"

# Security
test_endpoint "GET" "/api/security/waf/config" "200" "" "Configuração WAF"
test_endpoint "GET" "/api/security/rate-limits" "200" "" "Rate limits"

# Billing
test_endpoint "GET" "/api/billing/usage" "200" "" "Uso atual"
test_endpoint "GET" "/api/billing/invoices" "200" "" "Faturas"

# Test POST endpoints (creation)
echo ""
echo -e "${YELLOW}📋 TESTANDO ENDPOINTS DE CRIAÇÃO${NC}"
echo "================================================="

# Test backend creation
BACKEND_DATA='{"address":"192.168.1.100:8080","pool":"test-pool","weight":100,"enabled":true}'
test_endpoint "POST" "/api/backends" "201" "$BACKEND_DATA" "Criar novo backend"

# Test pool creation
POOL_DATA='{"name":"test-pool","algorithm":"round_robin","health_check":{"enabled":true,"interval":"30s"}}'
test_endpoint "POST" "/api/pools" "201" "$POOL_DATA" "Criar novo pool"

# Test tenant creation
TENANT_DATA='{"name":"test-tenant","plan":"basic","limits":{"requests_per_minute":1000}}'
test_endpoint "POST" "/api/tenants" "201" "$TENANT_DATA" "Criar novo tenant"

# Test error handling
echo ""
echo -e "${YELLOW}📋 TESTANDO TRATAMENTO DE ERROS${NC}"
echo "================================================="

test_endpoint "GET" "/api/nonexistent" "404" "" "Endpoint inexistente"
test_endpoint "POST" "/api/backends" "400" '{"invalid":"data"}' "Dados inválidos"
test_endpoint "GET" "/api/backends/999999" "404" "" "Backend inexistente"

# Performance tests
echo ""
echo -e "${YELLOW}📋 TESTANDO PERFORMANCE${NC}"
echo "================================================="

print_status "Executando teste de carga básico..."

# Simple load test
for i in {1..10}; do
    response_time=$(curl -s -o /dev/null -w '%{time_total}' "$API_BASE/health" 2>/dev/null)
    echo "Request $i: ${response_time}s" >> "$REPORTS_DIR/performance.log"
done

avg_time=$(awk '{sum+=$3} END {print sum/NR}' "$REPORTS_DIR/performance.log")
print_status "Tempo médio de resposta: ${avg_time}s"

# Generate summary report
echo ""
echo -e "${YELLOW}📋 GERANDO RELATÓRIO FINAL${NC}"
echo "================================================="

# Count successful tests
total_tests=$(grep -c "## " "$REPORTS_DIR/api-test-$(date +%Y%m%d).md" 2>/dev/null || echo "0")
successful_tests=$(grep -c "✅" "$REPORTS_DIR/api-test-$(date +%Y%m%d).md" 2>/dev/null || echo "0")
failed_tests=$(grep -c "❌" "$REPORTS_DIR/api-test-$(date +%Y%m%d).md" 2>/dev/null || echo "0")

# Create summary
cat >> "$REPORTS_DIR/api-test-$(date +%Y%m%d).md" << EOF

## 📊 Resumo dos Testes

- **Total de Endpoints Testados:** $total_tests
- **Testes Bem-sucedidos:** $successful_tests
- **Testes Falharam:** $failed_tests
- **Taxa de Sucesso:** $(( successful_tests * 100 / total_tests ))%
- **Tempo Médio de Resposta:** ${avg_time}s

## 🔍 Recomendações

$(if [ $failed_tests -gt 0 ]; then
    echo "- ⚠️ Alguns endpoints falharam - verificar logs de erro"
    echo "- 🔧 Implementar ou corrigir endpoints com falha"
fi)

$(if [ -z "$JWT_TOKEN" ]; then
    echo "- 🔐 Implementar sistema de autenticação JWT"
    echo "- 🛡️ Proteger endpoints sensíveis"
fi)

- 📈 Monitorar performance dos endpoints mais lentos
- 🔄 Implementar testes automatizados contínuos
- 📝 Documentar APIs no formato OpenAPI/Swagger

EOF

print_success "Relatório completo salvo em $REPORTS_DIR/api-test-$(date +%Y%m%d).md"

# Final summary
echo ""
echo "================================================================="
echo -e "${GREEN}🎉 VALIDAÇÃO DE APIS CONCLUÍDA!${NC}"
echo ""
echo -e "${BLUE}📊 Resultados:${NC}"
echo "- Total de endpoints testados: $total_tests"
echo "- Sucessos: $successful_tests"
echo "- Falhas: $failed_tests"
echo "- Taxa de sucesso: $(( successful_tests * 100 / total_tests ))%"
echo ""
echo -e "${BLUE}📁 Relatórios salvos em:${NC} $REPORTS_DIR/"
echo ""

if [ $failed_tests -eq 0 ]; then
    echo -e "${GREEN}✅ Todas as APIs estão funcionando corretamente!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️ Algumas APIs precisam de atenção - verifique o relatório${NC}"
    exit 1
fi
