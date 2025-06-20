#!/bin/bash

# Script de verificação completa do status dos serviços VeloFlux
# Data: $(date)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[✓]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[⚠]${NC} $1"
}

log_error() {
    echo -e "${RED}[✗]${NC} $1"
}

test_endpoint() {
    local url="$1"
    local name="$2"
    local expected_code="${3:-200}"
    
    echo -n "Testing $name... "
    if response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null); then
        if [ "$response" = "$expected_code" ]; then
            log_success "$name: HTTP $response"
            return 0
        else
            log_warning "$name: HTTP $response (expected $expected_code)"
            return 1
        fi
    else
        log_error "$name: Connection failed"
        return 1
    fi
}

echo "=================================================================="
echo "🚀 VeloFlux Production Services Status Check"
echo "=================================================================="
echo "Data: $(date)"
echo

# 1. Verificação de Containers
log_info "1. Verificando status dos containers Docker..."
echo
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|veloflux|redis)"
echo

# 2. Health Checks dos Containers
log_info "2. Verificando health checks dos containers..."
echo
for container in veloflux-lb-prod veloflux-tenant1-prod veloflux-tenant2-prod veloflux-redis-prod; do
    if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        health=$(docker inspect "$container" --format='{{.State.Health.Status}}' 2>/dev/null || echo "no-healthcheck")
        if [ "$health" = "healthy" ]; then
            log_success "$container: $health"
        elif [ "$health" = "no-healthcheck" ]; then
            log_info "$container: no health check configured"
        else
            log_warning "$container: $health"
        fi
    else
        log_error "$container: not running"
    fi
done
echo

# 3. Testes de Conectividade dos Serviços Web
log_info "3. Testando serviços web..."
echo

# Landing Page (funcionando)
test_endpoint "http://localhost/public/" "Landing Page"
test_endpoint "http://localhost/public/health" "Landing Page Health"

# Admin Panel 
test_endpoint "http://localhost/admin/" "Admin Panel"
test_endpoint "http://localhost/admin/health" "Admin Panel Health"

# API
test_endpoint "http://localhost/api/" "API"
test_endpoint "http://localhost/api/health" "API Health"

# Tenants
test_endpoint "http://localhost/tenant1/" "Tenant 1"
test_endpoint "http://localhost/tenant2/" "Tenant 2"

echo

# 4. Métricas e Monitoramento
log_info "4. Verificando serviços de monitoramento..."
echo

# VeloFlux Metrics
test_endpoint "http://localhost:8880/metrics" "VeloFlux Metrics"

# Admin API
test_endpoint "http://localhost:9090/api/health" "Admin API" 

echo

# 5. Testes de Backend
log_info "5. Verificando backends internos..."
echo

# Test direct backend access
if docker exec veloflux-tenant1-prod wget -qO- http://localhost/admin/health >/dev/null 2>&1; then
    log_success "Backend Tenant1: Admin health accessible"
else
    log_error "Backend Tenant1: Admin health not accessible"
fi

if docker exec veloflux-tenant1-prod wget -qO- http://localhost/api/health >/dev/null 2>&1; then
    log_success "Backend Tenant1: API health accessible"
else
    log_error "Backend Tenant1: API health not accessible"
fi

echo

# 6. Logs Recentes
log_info "6. Últimos logs do VeloFlux (últimas 5 linhas)..."
echo
docker logs veloflux-lb-prod --tail 5
echo

# 7. Configuração Redis
log_info "7. Verificando conectividade Redis..."
echo
if docker exec veloflux-redis-prod redis-cli ping >/dev/null 2>&1; then
    log_success "Redis: Respondendo a ping"
else
    log_error "Redis: Não respondendo"
fi

# 8. Resumo de Portas
log_info "8. Resumo de portas expostas..."
echo "🌐 Web Services:"
echo "  - Landing Page: http://localhost/public/"
echo "  - Admin Panel:  http://localhost/admin/"
echo "  - API:          http://localhost/api/"
echo
echo "📊 Monitoring:"
echo "  - Metrics:      http://localhost:8880/metrics"
echo "  - Admin API:    http://localhost:9090/"
echo
echo "🏠 Tenants:"
echo "  - Tenant 1:     http://localhost/tenant1/"
echo "  - Tenant 2:     http://localhost/tenant2/"
echo

echo "=================================================================="
log_info "Status check completed!"
echo "=================================================================="
