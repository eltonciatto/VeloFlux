#!/bin/bash

# Script para validar todos os serviços VeloFlux em produção
# Usando domínios wildcard corretos

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar IP público atual
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "UNKNOWN")

echo "=== Validação de Serviços VeloFlux em Produção ==="
echo "Data: $(date)"
echo "IP Público: $PUBLIC_IP"
echo

# Domínios de teste corretos
ADMIN_DOMAIN="admin.public.dev.veloflux.io"
LANDING_DOMAIN="landing.public.dev.veloflux.io"
API_DOMAIN="api.public.dev.veloflux.io"

# Contadores
TESTS_TOTAL=0
TESTS_PASSED=0
TESTS_FAILED=0

# Função para executar teste
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    log_info "Teste: $test_name"
    
    if eval "$test_command"; then
        log_success "✓ $test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        log_error "✗ $test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# 1. Verificar containers Docker
log_info "=== VERIFICANDO CONTAINERS DOCKER ==="

run_test "VeloFlux Load Balancer rodando" \
    "docker ps | grep -q veloflux-lb"

run_test "Admin Panel rodando" \
    "docker ps | grep -q veloflux-admin"

run_test "Landing Page rodando" \
    "docker ps | grep -q veloflux-landing"

run_test "Nginx rodando" \
    "docker ps | grep -q veloflux-nginx"

run_test "Prometheus rodando" \
    "docker ps | grep -q prometheus"

echo

# 2. Verificar portas locais
log_info "=== VERIFICANDO PORTAS LOCAIS ==="

run_test "Porta 80 (HTTP) ativa" \
    "netstat -tulpn | grep -q ':80 '"

run_test "Porta 443 (HTTPS) ativa" \
    "netstat -tulpn | grep -q ':443 '"

run_test "Porta 8080 (Admin) ativa" \
    "netstat -tulpn | grep -q ':8080 '"

run_test "Porta 3000 (Landing) ativa" \
    "netstat -tulpn | grep -q ':3000 '"

echo

# 3. Verificar conectividade HTTP local
log_info "=== VERIFICANDO CONECTIVIDADE HTTP LOCAL ==="

run_test "Load Balancer responde localmente" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:80 | grep -q '200\|302\|404'"

run_test "Admin Panel responde localmente" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:8080 | grep -q '200\|302\|404'"

run_test "Landing Page responde localmente" \
    "curl -s -o /dev/null -w '%{http_code}' http://localhost:3000 | grep -q '200\|302\|404'"

echo

# 4. Verificar resolução DNS
log_info "=== VERIFICANDO RESOLUÇÃO DNS ==="

test_dns_resolution() {
    local domain=$1
    nslookup "$domain" >/dev/null 2>&1
}

run_test "DNS resolve $ADMIN_DOMAIN" \
    "test_dns_resolution $ADMIN_DOMAIN"

run_test "DNS resolve $LANDING_DOMAIN" \
    "test_dns_resolution $LANDING_DOMAIN"

run_test "DNS resolve $API_DOMAIN" \
    "test_dns_resolution $API_DOMAIN"

echo

# 5. Verificar conectividade externa (com timeout)
log_info "=== VERIFICANDO CONECTIVIDADE EXTERNA ==="

test_external_http() {
    local domain=$1
    local timeout=10
    
    curl -s --connect-timeout $timeout -o /dev/null -w '%{http_code}' "http://$domain" | grep -q '200\|302\|404\|503'
}

run_test "Admin Panel acessível externamente" \
    "test_external_http $ADMIN_DOMAIN"

run_test "Landing Page acessível externamente" \
    "test_external_http $LANDING_DOMAIN"

run_test "API acessível externamente" \
    "test_external_http $API_DOMAIN"

echo

# 6. Verificar logs de containers (últimas 10 linhas, sem erros críticos)
log_info "=== VERIFICANDO LOGS DE CONTAINERS ==="

check_container_logs() {
    local container_name=$1
    local error_pattern="ERROR|FATAL|panic|failed"
    
    if docker ps | grep -q "$container_name"; then
        error_count=$(docker logs --tail=10 "$container_name" 2>&1 | grep -i -c "$error_pattern" || echo "0")
        [ "$error_count" -eq 0 ]
    else
        return 1
    fi
}

run_test "Load Balancer sem erros críticos" \
    "check_container_logs veloflux-lb"

run_test "Admin Panel sem erros críticos" \
    "check_container_logs veloflux-admin"

run_test "Landing Page sem erros críticos" \
    "check_container_logs veloflux-landing"

echo

# 7. Verificar métricas do Prometheus (se disponível)
log_info "=== VERIFICANDO MÉTRICAS ==="

run_test "Prometheus coletando métricas" \
    "curl -s http://localhost:9090/api/v1/targets | grep -q 'up'"

echo

# 8. Teste de carga básico
log_info "=== TESTE DE CARGA BÁSICO ==="

basic_load_test() {
    local url=$1
    local requests=5
    
    for i in $(seq 1 $requests); do
        if ! curl -s -o /dev/null -w '%{http_code}' "$url" | grep -q '200\|302\|404'; then
            return 1
        fi
    done
    return 0
}

run_test "Load Balancer suporta múltiplas requisições" \
    "basic_load_test http://localhost:80"

echo

# 9. Verificar certificados SSL (se configurados)
log_info "=== VERIFICANDO CERTIFICADOS SSL ==="

check_ssl_cert() {
    local domain=$1
    local timeout=10
    
    echo | timeout $timeout openssl s_client -connect "$domain:443" -servername "$domain" 2>/dev/null | grep -q "Verify return code: 0"
}

if netstat -tulpn | grep -q ':443 '; then
    run_test "Certificado SSL válido para $ADMIN_DOMAIN" \
        "check_ssl_cert $ADMIN_DOMAIN"
    
    run_test "Certificado SSL válido para $LANDING_DOMAIN" \
        "check_ssl_cert $LANDING_DOMAIN"
    
    run_test "Certificado SSL válido para $API_DOMAIN" \
        "check_ssl_cert $API_DOMAIN"
else
    log_warning "HTTPS não está configurado (porta 443 não está ativa)"
fi

echo

# 10. Verificar configuração de produção
log_info "=== VERIFICANDO CONFIGURAÇÃO DE PRODUÇÃO ==="

run_test "Arquivo de configuração de produção existe" \
    "[ -f 'config/config-production.yaml' ]"

run_test "Docker Compose de produção existe" \
    "[ -f 'docker-compose.production.yml' ]"

if [ -f ".env.production" ]; then
    run_test "Variáveis de ambiente de produção carregadas" \
        "grep -q 'PRODUCTION=true' .env.production || grep -q 'ENV=production' .env.production"
fi

echo

# Resumo final
log_info "=== RESUMO DOS TESTES ==="
echo "Total de testes: $TESTS_TOTAL"
echo "Testes aprovados: $TESTS_PASSED"
echo "Testes falharam: $TESTS_FAILED"

if [ $TESTS_FAILED -eq 0 ]; then
    log_success "🎉 Todos os testes passaram! VeloFlux está funcionando corretamente em produção."
    
    echo
    log_info "URLs de acesso:"
    echo "  • Admin Panel: https://$ADMIN_DOMAIN"
    echo "  • Landing Page: https://$LANDING_DOMAIN"
    echo "  • API: https://$API_DOMAIN"
    echo "  • Prometheus: http://$PUBLIC_IP:9090"
    
    exit 0
else
    log_error "❌ $TESTS_FAILED teste(s) falharam. Verifique os problemas acima."
    
    echo
    log_info "Para debugar problemas:"
    echo "  • Verificar logs: docker-compose -f docker-compose.production.yml logs"
    echo "  • Verificar status: docker-compose -f docker-compose.production.yml ps"
    echo "  • Reiniciar serviços: docker-compose -f docker-compose.production.yml restart"
    
    exit 1
fi
