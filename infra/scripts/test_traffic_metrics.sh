#!/bin/bash

# VeloFlux - Teste de Geração de Tráfego para Métricas SaaS
# Este script gera tráfego para o VeloFlux e verifica se as métricas estão sendo registradas corretamente

# Utilitário para logs
log_info() {
    echo "[INFO] $1"
}

log_success() {
    echo "[SUCESSO] $1"
}

log_error() {
    echo "[ERRO] $1"
}

# Detectar ambiente
log_info "Detectando ambiente VeloFlux..."
if docker ps | grep -q "veloflux-test-"; then
    log_info "Ambiente de teste VeloFlux detectado"
    API_PORT=8082
    METRICS_PORT=9080
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-test-veloflux-lb" | awk '{print $1}')
else
    log_info "Ambiente regular VeloFlux detectado"
    API_PORT=80
    METRICS_PORT=8080
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-veloflux-lb" | awk '{print $1}')
fi

# Verificar métricas iniciais
log_info "Verificando métricas iniciais..."
curl -s http://localhost:${METRICS_PORT}/metrics > /tmp/metrics_before.txt

# Gerar tráfego intenso para o VeloFlux
log_info "Gerando tráfego para o VeloFlux (20 segundos)..."
log_info "Executando 100 requisições em paralelo..."

# Executar ab (ApacheBench) se disponível
if command -v ab &> /dev/null; then
    ab -n 1000 -c 10 -t 20 http://localhost:${API_PORT}/ > /tmp/benchmark.txt
    log_info "Resultado do benchmark:"
    cat /tmp/benchmark.txt | grep "Requests per second"
else
    # Fallback para curl se ab não estiver disponível
    log_info "ApacheBench (ab) não encontrado, usando curl como alternativa"
    for i in {1..100}; do
        curl -s -o /dev/null "http://localhost:${API_PORT}/" &
        if [ $((i % 10)) -eq 0 ]; then
            echo -n "."
        fi
    done
    echo ""
fi

# Aguardar um momento para as métricas atualizarem
log_info "Aguardando atualização de métricas (5s)..."
sleep 5

# Verificar métricas após tráfego
log_info "Verificando métricas após o tráfego..."
curl -s http://localhost:${METRICS_PORT}/metrics > /tmp/metrics_after.txt

# Verificar se houve mudanças nas métricas
if diff -q /tmp/metrics_before.txt /tmp/metrics_after.txt > /dev/null; then
    log_error "As métricas não foram atualizadas após o tráfego gerado"
    log_info "Isso indica que o VeloFlux não está instrumentado corretamente ou o tráfego não está sendo processado pelo VeloFlux"
else
    log_success "As métricas foram atualizadas após o tráfego gerado"
    
    # Verificar métricas específicas do VeloFlux
    if grep -q "veloflux_" /tmp/metrics_after.txt; then
        log_success "Métricas específicas do VeloFlux encontradas:"
        grep -E "veloflux_[a-z_]+" /tmp/metrics_after.txt
    else
        log_error "Nenhuma métrica específica do VeloFlux foi encontrada"
        log_info "As métricas do VeloFlux não estão sendo registradas corretamente. Verifique a instrumentação do código."
    fi
fi

log_info "Limpando arquivos temporários..."
rm -f /tmp/metrics_before.txt /tmp/metrics_after.txt /tmp/benchmark.txt

log_info "Teste de geração de tráfego concluído"
