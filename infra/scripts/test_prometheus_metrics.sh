#!/bin/bash

# VeloFlux - Teste Completo de Métricas e Health Checks para SaaS
# Este script verifica o status do VeloFlux com foco em métricas Prometheus para ambiente SaaS
# Versão simplificada sem cores para maior compatibilidade

# Contador para testes passando e falhando
PASSED=0
FAILED=0
TOTAL=0

# Helper function para logs
log_info() {
    echo "[INFO] $1"
}

log_success() {
    echo "[OK] $1"
    PASSED=$((PASSED+1))
}

log_warning() {
    echo "[AVISO] $1"
}

log_error() {
    echo "[ERRO] $1"
    FAILED=$((FAILED+1))
}

increment_total() {
    TOTAL=$((TOTAL+1))
}

# Detectar ambiente (teste ou produção)
log_info "Detectando ambiente VeloFlux..."

# Check if test environment containers are running
if docker ps | grep -q "veloflux-test-"; then
    log_info "Ambiente de teste VeloFlux detectado"
    
    # Define ports for the test environment
    API_PORT=8082
    ADMIN_PORT=9090
    METRICS_PORT=9080
    
    ENV_TYPE="teste"
    
    # Get container IDs
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-test-veloflux-lb" | awk '{print $1}')
    BACKEND1_CONTAINER=$(docker ps | grep "veloflux-test-backend-1" | awk '{print $1}')
    BACKEND2_CONTAINER=$(docker ps | grep "veloflux-test-backend-2" | awk '{print $1}')
    REDIS_CONTAINER=$(docker ps | grep "veloflux-test-redis" | awk '{print $1}')
else
    # Regular environment
    log_info "Ambiente regular VeloFlux detectado"
    
    # Define ports for the regular environment
    API_PORT=80
    ADMIN_PORT=9000
    METRICS_PORT=8080
    
    ENV_TYPE="produção"
    
    # Get container IDs
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-veloflux-lb" | awk '{print $1}')
    BACKEND1_CONTAINER=$(docker ps | grep "backend-1" | awk '{print $1}')
    BACKEND2_CONTAINER=$(docker ps | grep "backend-2" | awk '{print $1}')
    REDIS_CONTAINER=$(docker ps | grep "veloflux-redis" | awk '{print $1}')
fi

log_info "Usando ambiente de ${ENV_TYPE} com VeloFlux na porta ${API_PORT}"
log_info "Métricas Prometheus disponíveis na porta ${METRICS_PORT}"

# Esperar inicialização completa
log_info "Aguardando inicialização completa (5s)..."
sleep 5

# === Verificação de conectividade interna ===
log_info "=== TESTE DE CONECTIVIDADE INTERNA ==="

# Backend 1
log_info "Verificando conectividade interna para backend-1..."
increment_total
if [ -n "$VELOFLUX_CONTAINER" ] && docker exec $VELOFLUX_CONTAINER curl -s http://backend-1 >/dev/null; then
    log_success "Conectividade com backend-1: OK"
else
    log_error "Conectividade com backend-1: FALHA"
fi

# Backend 2
log_info "Verificando conectividade interna para backend-2..."
increment_total
if [ -n "$VELOFLUX_CONTAINER" ] && docker exec $VELOFLUX_CONTAINER curl -s http://backend-2 >/dev/null; then
    log_success "Conectividade com backend-2: OK"
else
    log_error "Conectividade com backend-2: FALHA"
fi

# Redis
log_info "Verificando conectividade interna para Redis..."
increment_total
if [ -n "$VELOFLUX_CONTAINER" ] && docker exec $VELOFLUX_CONTAINER nc -z redis 6379; then
    log_success "Conectividade com Redis: OK"
else
    log_error "Conectividade com Redis: FALHA"
fi

# === Verificação de Health Checks ===
log_info "=== TESTE DE HEALTH CHECKS ==="

# Health check backend-1
log_info "Verificando health check de backend-1..."
increment_total
if [ -n "$VELOFLUX_CONTAINER" ] && docker exec $VELOFLUX_CONTAINER curl -s http://backend-1/health | grep -q "OK"; then
    log_success "Health check backend-1: OK"
else
    log_error "Health check backend-1: FALHA"
fi

# Health check backend-2
log_info "Verificando health check de backend-2..."
increment_total
if [ -n "$VELOFLUX_CONTAINER" ] && docker exec $VELOFLUX_CONTAINER curl -s http://backend-2/health | grep -q "OK"; then
    log_success "Health check backend-2: OK"
else
    log_error "Health check backend-2: FALHA"
fi

# === Verificação de Métricas Prometheus ===
log_info "=== TESTE DE MÉTRICAS PROMETHEUS ==="

# Verificar endpoint de métricas
log_info "Verificando endpoint de métricas Prometheus..."
increment_total
if curl -s http://localhost:${METRICS_PORT}/metrics > /tmp/metrics_output.txt; then
    log_success "Endpoint de métricas Prometheus acessível"
    
    # Verificar métricas principais para SaaS
    metrics_found=0
    expected_metrics=5
    
    # Verificar métricas de health
    increment_total
    if grep -q "veloflux_backend_health" /tmp/metrics_output.txt; then
        log_success "Métrica 'veloflux_backend_health' encontrada (essencial para monitorar status de backends por cliente)"
        metrics_found=$((metrics_found+1))
    else
        log_error "Métrica 'veloflux_backend_health' não encontrada"
    fi
    
    # Verificar métricas de requests
    increment_total
    if grep -q "veloflux_requests_total" /tmp/metrics_output.txt; then
        log_success "Métrica 'veloflux_requests_total' encontrada (essencial para billing e SLAs)"
        metrics_found=$((metrics_found+1))
    else
        log_error "Métrica 'veloflux_requests_total' não encontrada"
    fi
    
    # Verificar métricas de latência
    increment_total
    if grep -q "veloflux_request_duration_seconds" /tmp/metrics_output.txt; then
        log_success "Métrica 'veloflux_request_duration_seconds' encontrada (essencial para SLAs de performance)"
        metrics_found=$((metrics_found+1))
    else
        log_error "Métrica 'veloflux_request_duration_seconds' não encontrada"
    fi
    
    # Verificar métricas de conexões
    increment_total
    if grep -q "veloflux_active_connections" /tmp/metrics_output.txt; then
        log_success "Métrica 'veloflux_active_connections' encontrada (essencial para análise de carga)"
        metrics_found=$((metrics_found+1))
    else
        log_error "Métrica 'veloflux_active_connections' não encontrada"
    fi
    
    # Verificar métricas Go (básicas)
    increment_total
    if grep -q "go_goroutines" /tmp/metrics_output.txt; then
        log_success "Métricas básicas Go encontradas (importante para diagnosticar problemas de runtime)"
        metrics_found=$((metrics_found+1))
    else
        log_error "Métricas básicas Go não encontradas"
    fi
    
    # Resumo das métricas
    log_info "Encontradas ${metrics_found} de ${expected_metrics} métricas principais esperadas"
    if [ $metrics_found -eq $expected_metrics ]; then
        log_success "Todas as métricas principais foram encontradas!"
    fi
else
    log_error "Endpoint de métricas Prometheus não acessível na porta ${METRICS_PORT}"
fi

# === Verificar Admin API (quando disponível) ===
log_info "=== TESTE DE ADMIN API ==="

# Verificar API de administração
log_info "Verificando API de administração na porta ${ADMIN_PORT}..."
increment_total
if curl -s http://localhost:${ADMIN_PORT}/health > /tmp/admin_output.txt; then
    log_success "API de administração acessível"
    cat /tmp/admin_output.txt
else
    log_warning "API de administração não acessível na porta ${ADMIN_PORT} (pode ser normal dependendo da configuração)"
fi

# === Simular carga e verificar registro de métricas ===
log_info "=== TESTE DE GERAÇÃO DE MÉTRICAS ==="

# Gerar algumas requisições para registrar métricas
log_info "Gerando requisições de teste para registrar métricas..."
for i in {1..10}; do
    curl -s -I "http://localhost:${API_PORT}/" >/dev/null
    sleep 0.5
done
log_info "Aguardando atualização de métricas (3s)..."
sleep 3

# Verificar se métricas foram registradas
increment_total
curl -s http://localhost:${METRICS_PORT}/metrics > /tmp/metrics_updated.txt
if diff -q /tmp/metrics_output.txt /tmp/metrics_updated.txt >/dev/null; then
    log_warning "As métricas não parecem ter sido atualizadas após requisições - é esperado se VeloFlux não está processando requisições"
else
    log_success "As métricas foram atualizadas após requisições de teste"
fi

# === Testar acesso ao VeloFlux pelo API_PORT ===
log_info "=== TESTE DE ACESSO AO VELOFLUX ==="

# Verificar respostas do VeloFlux
log_info "Verificando resposta do VeloFlux na porta ${API_PORT}..."
increment_total
status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${API_PORT})
if [[ $status_code == 2* || $status_code == 3* || $status_code == 404 ]]; then
    # 404 é aceitável se não houver rota configurada para "/"
    log_success "VeloFlux está respondendo na porta ${API_PORT} (código: ${status_code})"
else
    log_error "VeloFlux não está respondendo corretamente na porta ${API_PORT} (código: ${status_code})"
fi

# === Resumo dos testes ===
log_info "=== RESUMO DOS TESTES ==="
log_info "Total de testes: ${TOTAL}"
if [ $PASSED -eq $TOTAL ]; then
    log_success "Todos os testes passaram! O VeloFlux está 100% operacional"
else
    log_warning "Resultados: ${PASSED} testes passaram, ${FAILED} testes falharam"
    if [ $FAILED -gt 0 ]; then
        cobertura=$(echo "scale=2; $PASSED * 100 / $TOTAL" | bc)
        log_info "Cobertura de testes bem-sucedidos: ${cobertura}%"
    fi
fi

log_info "Testes concluídos. VeloFlux pode ser acessado em: http://localhost:${API_PORT}"
log_info "Métricas Prometheus disponíveis em: http://localhost:${METRICS_PORT}/metrics"

# Limpar arquivos temporários
rm -f /tmp/metrics_output.txt /tmp/metrics_updated.txt
