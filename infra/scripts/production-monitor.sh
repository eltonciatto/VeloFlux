#!/bin/bash

# Script de Monitoramento Contínuo - VeloFlux SaaS
# Monitora continuamente a saúde dos serviços em produção

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

# Configurações
CODESPACE_NAME=$CODESPACE_NAME
CODESPACE_BASE="${CODESPACE_NAME}.github.dev"
MONITOR_INTERVAL=30  # segundos
LOG_FILE="/workspaces/VeloFlux/logs/production-monitor.log"
ALERT_COUNT=0
MAX_ALERTS=5

# Criar diretório de logs se não existir
mkdir -p /workspaces/VeloFlux/logs

# Função para verificar um endpoint
check_endpoint() {
    local url="$1"
    local name="$2"
    local timeout="${3:-5}"
    
    local start_time=$(date +%s.%N)
    local http_code=$(curl -s -o /dev/null -w "%{http_code}" -m $timeout "$url" 2>/dev/null || echo "000")
    local end_time=$(date +%s.%N)
    local response_time=$(echo "scale=3; $end_time - $start_time" | bc -l 2>/dev/null || echo "0.000")
    
    if [ "$http_code" = "200" ]; then
        success "$name: OK (${response_time}s)"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - $name: OK - ${response_time}s - HTTP $http_code" >> "$LOG_FILE"
        return 0
    else
        error "$name: FALHOU (HTTP $http_code, ${response_time}s)"
        echo "$(date '+%Y-%m-%d %H:%M:%S') - $name: FALHOU - ${response_time}s - HTTP $http_code" >> "$LOG_FILE"
        ((ALERT_COUNT++))
        return 1
    fi
}

# Função para verificar containers Docker
check_containers() {
    log "Verificando status dos containers..."
    
    local containers=(
        "veloflux-lb-prod"
        "veloflux-tenant1-prod"
        "veloflux-tenant2-prod"
        "veloflux-redis-prod"
    )
    
    for container in "${containers[@]}"; do
        if docker ps --filter "name=$container" --filter "status=running" | grep -q "$container"; then
            success "Container $container: RODANDO"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Container $container: RODANDO" >> "$LOG_FILE"
        else
            error "Container $container: PARADO/PROBLEMA"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Container $container: PARADO/PROBLEMA" >> "$LOG_FILE"
            ((ALERT_COUNT++))
        fi
    done
}

# Função para verificar uso de recursos
check_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    log "Recursos: CPU ${cpu_usage}%, Memória ${memory_usage}%, Disco ${disk_usage}%"
    echo "$(date '+%Y-%m-%d %H:%M:%S') - Recursos: CPU ${cpu_usage}%, Memória ${memory_usage}%, Disco ${disk_usage}%" >> "$LOG_FILE"
    
    # Alertas para uso excessivo
    if (( $(echo "$cpu_usage > 80" | bc -l 2>/dev/null || echo 0) )); then
        warning "CPU usage alto: ${cpu_usage}%"
        ((ALERT_COUNT++))
    fi
    
    if (( $(echo "$memory_usage > 80" | bc -l 2>/dev/null || echo 0) )); then
        warning "Memória usage alta: ${memory_usage}%"
        ((ALERT_COUNT++))
    fi
    
    if [ "$disk_usage" -gt 80 ]; then
        warning "Disco usage alto: ${disk_usage}%"
        ((ALERT_COUNT++))
    fi
}

# Função principal de monitoramento
monitor_cycle() {
    local cycle_count=1
    
    while true; do
        log "=== Ciclo de Monitoramento #$cycle_count ==="
        ALERT_COUNT=0
        
        # Verificar endpoints principais
        check_endpoint "http://localhost/public/health" "Landing Page"
        check_endpoint "http://localhost:9090/admin/health" "Admin Panel"
        check_endpoint "http://localhost:8880" "Métricas"
        check_endpoint "http://localhost/tenant1/health" "Tenant 1"
        check_endpoint "http://localhost/tenant2/health" "Tenant 2"
        
        # Verificar endpoints externos (Codespace)
        check_endpoint "https://${CODESPACE_BASE}/public/" "Landing Page Externa" 10
        check_endpoint "https://${CODESPACE_BASE}:9090/admin/" "Admin Panel Externo" 10
        
        # Verificar containers
        check_containers
        
        # Verificar recursos
        check_resources
        
        # Verificar conectividade Redis
        if docker exec veloflux-redis-prod redis-cli ping >/dev/null 2>&1; then
            success "Redis: CONECTADO"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Redis: CONECTADO" >> "$LOG_FILE"
        else
            error "Redis: DESCONECTADO"
            echo "$(date '+%Y-%m-%d %H:%M:%S') - Redis: DESCONECTADO" >> "$LOG_FILE"
            ((ALERT_COUNT++))
        fi
        
        # Resumo do ciclo
        if [ "$ALERT_COUNT" -eq 0 ]; then
            success "Ciclo #$cycle_count: TODOS OS SERVIÇOS OK"
        else
            warning "Ciclo #$cycle_count: $ALERT_COUNT problemas detectados"
        fi
        
        echo "$(date '+%Y-%m-%d %H:%M:%S') - Ciclo #$cycle_count concluído - $ALERT_COUNT alertas" >> "$LOG_FILE"
        
        # Verificar se há muitos problemas consecutivos
        if [ "$ALERT_COUNT" -ge "$MAX_ALERTS" ]; then
            error "ALERTA CRÍTICO: $ALERT_COUNT problemas detectados! Verificar sistema urgentemente."
            echo "$(date '+%Y-%m-%d %H:%M:%S') - ALERTA CRÍTICO: $ALERT_COUNT problemas" >> "$LOG_FILE"
        fi
        
        ((cycle_count++))
        
        log "Próximo check em ${MONITOR_INTERVAL}s..."
        sleep $MONITOR_INTERVAL
    done
}

# Função para exibir estatísticas
show_stats() {
    if [ -f "$LOG_FILE" ]; then
        log "=== ESTATÍSTICAS DE MONITORAMENTO ==="
        
        local total_checks=$(wc -l < "$LOG_FILE")
        local ok_checks=$(grep -c ": OK" "$LOG_FILE" || echo "0")
        local failed_checks=$(grep -c ": FALHOU" "$LOG_FILE" || echo "0")
        local uptime_percentage=$(echo "scale=2; $ok_checks * 100 / $total_checks" | bc -l 2>/dev/null || echo "0")
        
        echo "Total de verificações: $total_checks"
        echo "Sucessos: $ok_checks"
        echo "Falhas: $failed_checks"
        echo "Uptime: ${uptime_percentage}%"
        
        log "Últimas 10 entradas do log:"
        tail -10 "$LOG_FILE"
    else
        warning "Arquivo de log não encontrado: $LOG_FILE"
    fi
}

# Função para limpar logs antigos
cleanup_logs() {
    if [ -f "$LOG_FILE" ]; then
        local lines=$(wc -l < "$LOG_FILE")
        if [ "$lines" -gt 1000 ]; then
            log "Limpando log antigo (${lines} linhas)..."
            tail -500 "$LOG_FILE" > "${LOG_FILE}.tmp"
            mv "${LOG_FILE}.tmp" "$LOG_FILE"
            success "Log reduzido para 500 linhas mais recentes"
        fi
    fi
}

# Tratamento de sinais para parada limpa
cleanup() {
    log "Parando monitoramento..."
    show_stats
    exit 0
}

trap cleanup SIGINT SIGTERM

# Menu principal
case "${1:-monitor}" in
    "monitor")
        log "Iniciando monitoramento contínuo do VeloFlux SaaS..."
        log "Codespace: $CODESPACE_NAME"
        log "Base URL: https://$CODESPACE_BASE"
        log "Intervalo: ${MONITOR_INTERVAL}s"
        log "Log: $LOG_FILE"
        log "Pressione Ctrl+C para parar"
        echo ""
        
        cleanup_logs
        monitor_cycle
        ;;
    "stats")
        show_stats
        ;;
    "cleanup")
        cleanup_logs
        ;;
    "test")
        log "Executando um ciclo de teste..."
        ALERT_COUNT=0
        
        check_endpoint "http://localhost/public/health" "Landing Page"
        check_endpoint "http://localhost:9090/admin/health" "Admin Panel"
        check_containers
        check_resources
        
        if [ "$ALERT_COUNT" -eq 0 ]; then
            success "Teste: TODOS OS SERVIÇOS OK"
        else
            warning "Teste: $ALERT_COUNT problemas detectados"
        fi
        ;;
    *)
        echo "Uso: $0 [monitor|stats|cleanup|test]"
        echo ""
        echo "Comandos:"
        echo "  monitor  - Iniciar monitoramento contínuo (padrão)"
        echo "  stats    - Exibir estatísticas do log"
        echo "  cleanup  - Limpar logs antigos"
        echo "  test     - Executar um ciclo de teste"
        exit 1
        ;;
esac
