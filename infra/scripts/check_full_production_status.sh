#!/bin/bash

# Script de verificação completa VeloFlux Production + Monitoring
# Data: $(date)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
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

log_section() {
    echo -e "${CYAN}$1${NC}"
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
echo "🚀 VeloFlux Production + Monitoring Stack Status"
echo "=================================================================="
echo "Data: $(date)"
echo "IP Público: 74.249.85.198"
echo

# 1. Verificação de Containers
log_section "📦 1. CONTAINERS STATUS"
echo

echo "VeloFlux Core Services:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|veloflux|redis)" || true
echo

echo "Monitoring Stack:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|prometheus|grafana|alertmanager)" || true
echo

# 2. Health Checks dos Containers
log_section "🏥 2. HEALTH CHECKS"
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

for container in veloflux-prometheus veloflux-grafana veloflux-alertmanager; do
    if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
        log_success "$container: running"
    else
        log_error "$container: not running"
    fi
done
echo

# 3. Serviços Web Core
log_section "🌐 3. CORE WEB SERVICES"
echo

# Landing Page (deve funcionar)
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

# 4. Métricas e APIs do VeloFlux
log_section "📊 4. VELOFLUX METRICS & APIS"
echo

# VeloFlux Metrics
test_endpoint "http://localhost:8880/metrics" "VeloFlux Metrics"

# Admin API
test_endpoint "http://localhost:9090/health" "VeloFlux Admin API"

echo

# 5. Stack de Monitoramento
log_section "🔍 5. MONITORING STACK"
echo

# Prometheus
test_endpoint "http://localhost:9091/" "Prometheus UI"
test_endpoint "http://localhost:9091/-/healthy" "Prometheus Health"

# Grafana
test_endpoint "http://localhost:3000/" "Grafana UI"

# AlertManager
test_endpoint "http://localhost:9093/" "AlertManager UI"

echo

# 6. Conectividade Interna
log_section "🔗 6. INTERNAL CONNECTIVITY"
echo

# Test Redis connectivity
if docker exec veloflux-redis-prod redis-cli ping >/dev/null 2>&1; then
    log_success "Redis: Responding to ping"
else
    log_error "Redis: Not responding"
fi

# Test backend connectivity
if docker exec veloflux-tenant1-prod curl -f http://localhost/admin/health >/dev/null 2>&1; then
    log_success "Backend Tenant1: Admin endpoint accessible"
else
    log_error "Backend Tenant1: Admin endpoint not accessible"
fi

if docker exec veloflux-tenant1-prod curl -f http://localhost/api/health >/dev/null 2>&1; then
    log_success "Backend Tenant1: API endpoint accessible"
else
    log_error "Backend Tenant1: API endpoint not accessible"
fi

echo

# 7. Resumo de URLs
log_section "🔗 7. SERVICE URLS"
echo
echo "🌐 Core Services:"
echo "  Landing Page:   http://localhost/public/"
echo "  Admin Panel:    http://localhost/admin/"
echo "  API:            http://localhost/api/"
echo
echo "📊 Monitoring:"
echo "  VeloFlux Metrics: http://localhost:8880/metrics"
echo "  Admin API:        http://localhost:9090/"
echo "  Prometheus:       http://localhost:9091/"
echo "  Grafana:          http://localhost:3000/ (admin/veloflux123)"
echo "  AlertManager:     http://localhost:9093/"
echo
echo "🏠 Multi-tenant:"
echo "  Tenant 1:       http://localhost/tenant1/"
echo "  Tenant 2:       http://localhost/tenant2/"
echo

# 8. Logs recentes
log_section "📝 8. RECENT LOGS (VeloFlux)"
echo
docker logs veloflux-lb-prod --tail 3
echo

echo "=================================================================="
log_info "Verificação completa finalizada!"
echo "=================================================================="
