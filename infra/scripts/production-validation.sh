#!/bin/bash

# Script de Validação Completa do VeloFlux SaaS em Produção
# Testa todos os aspectos críticos para garantir robustez

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; }
success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }

# Variáveis globais
PUBLIC_IP=$(curl -s ifconfig.me)
CODESPACE_NAME=$CODESPACE_NAME
CODESPACE_BASE="${CODESPACE_NAME}.github.dev"
TEST_RESULTS=()
FAILED_TESTS=0

# Função para registrar resultado de teste
record_test() {
    local test_name="$1"
    local result="$2"
    local details="$3"
    
    if [ "$result" = "PASS" ]; then
        TEST_RESULTS+=("✓ $test_name: PASSOU")
        success "$test_name: PASSOU"
    else
        TEST_RESULTS+=("✗ $test_name: FALHOU - $details")
        error "$test_name: FALHOU - $details"
        ((FAILED_TESTS++))
    fi
}

# Teste 1: Verificação de Portas Disponíveis
test_ports_availability() {
    log "Teste 1: Verificando disponibilidade de portas..."
    
    local ports=(80 443 8080 9090 8880 9900)
    local blocked_ports=()
    
    for port in "${ports[@]}"; do
        if lsof -i :$port >/dev/null 2>&1; then
            blocked_ports+=($port)
        fi
    done
    
    if [ ${#blocked_ports[@]} -eq 0 ]; then
        record_test "Portas Disponíveis" "PASS"
    else
        record_test "Portas Disponíveis" "FAIL" "Portas bloqueadas: ${blocked_ports[*]}"
    fi
}

# Teste 2: Build e Configuração
test_build_config() {
    log "Teste 2: Verificando build e configuração..."
    
    # Verificar se o build funciona
    if docker build -t veloflux-test . >/dev/null 2>&1; then
        record_test "Docker Build" "PASS"
    else
        record_test "Docker Build" "FAIL" "Erro no build da imagem"
        return
    fi
    
    # Verificar configuração
    if [ -f "/workspaces/VeloFlux/config/config-production.yaml" ]; then
        record_test "Configuração Produção" "PASS"
    else
        record_test "Configuração Produção" "FAIL" "Arquivo config-production.yaml não encontrado"
    fi
}

# Teste 3: Inicialização dos Containers
test_container_startup() {
    log "Teste 3: Testando inicialização dos containers..."
    
    # Parar qualquer container anterior
    docker-compose -f docker-compose.production.yml down >/dev/null 2>&1 || true
    
    # Iniciar containers
    if docker-compose -f docker-compose.production.yml up -d >/dev/null 2>&1; then
        record_test "Startup Containers" "PASS"
    else
        record_test "Startup Containers" "FAIL" "Erro ao iniciar containers"
        return
    fi
    
    # Aguardar inicialização
    sleep 30
    
    # Verificar se containers estão rodando
    local running_containers=$(docker-compose -f docker-compose.production.yml ps --services --filter "status=running" | wc -l)
    local total_containers=$(docker-compose -f docker-compose.production.yml ps --services | wc -l)
    
    if [ "$running_containers" -eq "$total_containers" ]; then
        record_test "Containers Running" "PASS"
    else
        record_test "Containers Running" "FAIL" "$running_containers/$total_containers containers rodando"
    fi
}

# Teste 4: Health Checks
test_health_checks() {
    log "Teste 4: Verificando health checks..."
    
    local endpoints=(
        "http://localhost/public/health:Landing Page Health"
        "http://localhost:9090/admin/health:Admin Panel Health" 
        "http://localhost:8880/api/health:API Health"
        "http://localhost/tenant1/health:Tenant1 Health"
        "http://localhost/tenant2/health:Tenant2 Health"
    )
    
    for endpoint_info in "${endpoints[@]}"; do
        local endpoint=$(echo $endpoint_info | cut -d':' -f1)
        local name=$(echo $endpoint_info | cut -d':' -f2)
        
        if curl -s -f -m 5 "$endpoint" >/dev/null 2>&1; then
            record_test "$name" "PASS"
        else
            record_test "$name" "FAIL" "Endpoint não responde: $endpoint"
        fi
    done
}

# Teste 5: Conectividade Externa (Codespace URLs)
test_external_connectivity() {
    log "Teste 5: Testando conectividade externa via Codespace..."
    
    local external_urls=(
        "https://${CODESPACE_BASE}/public/:Landing Page Externa"
        "https://${CODESPACE_BASE}:9090/admin/:Admin Panel Externo"
        "https://${CODESPACE_BASE}:8880/api/:API Externa"
    )
    
    for url_info in "${external_urls[@]}"; do
        local url=$(echo $url_info | cut -d':' -f1-2)
        local name=$(echo $url_info | cut -d':' -f3)
        
        if curl -s -f -m 10 "$url" >/dev/null 2>&1; then
            record_test "$name" "PASS"
        else
            record_test "$name" "FAIL" "URL não acessível: $url"
        fi
    done
}

# Teste 6: Load Balancing
test_load_balancing() {
    log "Teste 6: Testando balanceamento de carga..."
    
    local responses=()
    for i in {1..10}; do
        local response=$(curl -s "http://localhost/tenant1/" | grep -o "Tenant 1" || echo "ERRO")
        responses+=("$response")
    done
    
    local unique_responses=$(printf '%s\n' "${responses[@]}" | sort -u | wc -l)
    
    if [ "$unique_responses" -eq 1 ] && [ "${responses[0]}" = "Tenant 1" ]; then
        record_test "Load Balancing" "PASS"
    else
        record_test "Load Balancing" "FAIL" "Respostas inconsistentes"
    fi
}

# Teste 7: Rate Limiting
test_rate_limiting() {
    log "Teste 7: Testando rate limiting..."
    
    local success_count=0
    local rate_limited_count=0
    
    for i in {1..150}; do
        local status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost/public/" 2>/dev/null)
        
        if [ "$status" = "200" ]; then
            ((success_count++))
        elif [ "$status" = "429" ]; then
            ((rate_limited_count++))
        fi
    done
    
    if [ "$rate_limited_count" -gt 0 ]; then
        record_test "Rate Limiting" "PASS"
    else
        record_test "Rate Limiting" "FAIL" "Rate limiting não ativou ($success_count requests processados)"
    fi
}

# Teste 8: Persistência de Dados (Redis)
test_data_persistence() {
    log "Teste 8: Testando persistência de dados..."
    
    # Verificar se Redis está respondendo
    if docker exec veloflux-redis-prod redis-cli ping >/dev/null 2>&1; then
        record_test "Redis Connectivity" "PASS"
    else
        record_test "Redis Connectivity" "FAIL" "Redis não está respondendo"
        return
    fi
    
    # Teste de escrita/leitura
    local test_key="veloflux_test_$(date +%s)"
    local test_value="production_test_value"
    
    if docker exec veloflux-redis-prod redis-cli set "$test_key" "$test_value" >/dev/null 2>&1; then
        local retrieved_value=$(docker exec veloflux-redis-prod redis-cli get "$test_key" 2>/dev/null)
        
        if [ "$retrieved_value" = "$test_value" ]; then
            record_test "Redis Persistence" "PASS"
            # Limpar chave de teste
            docker exec veloflux-redis-prod redis-cli del "$test_key" >/dev/null 2>&1
        else
            record_test "Redis Persistence" "FAIL" "Valor recuperado não confere"
        fi
    else
        record_test "Redis Persistence" "FAIL" "Erro ao escrever no Redis"
    fi
}

# Teste 9: Segurança Básica
test_basic_security() {
    log "Teste 9: Testando segurança básica..."
    
    # Teste de injeção SQL básica
    local sql_injection_url="http://localhost/api/?id=1';DROP TABLE users;--"
    local response=$(curl -s -w "%{http_code}" "$sql_injection_url" -o /dev/null 2>/dev/null)
    
    if [ "$response" = "403" ] || [ "$response" = "400" ]; then
        record_test "SQL Injection Protection" "PASS"
    else
        record_test "SQL Injection Protection" "FAIL" "Possível vulnerabilidade (HTTP $response)"
    fi
    
    # Teste de XSS básico
    local xss_url="http://localhost/api/?name=<script>alert('xss')</script>"
    local xss_response=$(curl -s "$xss_url" 2>/dev/null | grep -o "<script>" | wc -l)
    
    if [ "$xss_response" -eq 0 ]; then
        record_test "XSS Protection" "PASS"
    else
        record_test "XSS Protection" "FAIL" "Script tags não filtrados"
    fi
}

# Teste 10: Performance Básica
test_basic_performance() {
    log "Teste 10: Testando performance básica..."
    
    local total_time=0
    local successful_requests=0
    
    for i in {1..10}; do
        local start_time=$(date +%s.%N)
        if curl -s -f "http://localhost/public/" >/dev/null 2>&1; then
            local end_time=$(date +%s.%N)
            local request_time=$(echo "$end_time - $start_time" | bc -l)
            total_time=$(echo "$total_time + $request_time" | bc -l)
            ((successful_requests++))
        fi
    done
    
    if [ "$successful_requests" -gt 0 ]; then
        local avg_time=$(echo "scale=3; $total_time / $successful_requests" | bc -l)
        
        if (( $(echo "$avg_time < 1.0" | bc -l) )); then
            record_test "Performance Response Time" "PASS"
        else
            record_test "Performance Response Time" "FAIL" "Tempo médio muito alto: ${avg_time}s"
        fi
    else
        record_test "Performance Response Time" "FAIL" "Nenhuma requisição bem-sucedida"
    fi
}

# Função principal
main() {
    log "=== Iniciando Validação Completa do VeloFlux SaaS ==="
    log "IP Público: $PUBLIC_IP"
    log "Codespace: $CODESPACE_NAME"
    log "Base URL: https://$CODESPACE_BASE"
    echo ""
    
    # Executar todos os testes
    test_ports_availability
    test_build_config
    test_container_startup
    test_health_checks
    test_external_connectivity
    test_load_balancing
    test_rate_limiting
    test_data_persistence
    test_basic_security
    test_basic_performance
    
    # Relatório final
    echo ""
    log "=== RELATÓRIO FINAL ==="
    
    for result in "${TEST_RESULTS[@]}"; do
        echo "$result"
    done
    
    echo ""
    if [ "$FAILED_TESTS" -eq 0 ]; then
        success "🎉 TODOS OS TESTES PASSARAM! VeloFlux está pronto para produção!"
    else
        error "❌ $FAILED_TESTS testes falharam. Revisar antes de ir para produção."
        exit 1
    fi
    
    echo ""
    log "URLs para acesso externo:"
    echo "🌐 Landing Page: https://${CODESPACE_BASE}/public/"
    echo "⚙️  Admin Panel: https://${CODESPACE_BASE}:9090/admin/"
    echo "📊 Métricas: https://${CODESPACE_BASE}:8880/api/"
    echo "🏢 Tenant 1: https://${CODESPACE_BASE}/tenant1/"
    echo "🏢 Tenant 2: https://${CODESPACE_BASE}/tenant2/"
}

# Executar se for chamado diretamente
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main "$@"
fi
