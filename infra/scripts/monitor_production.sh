#!/bin/bash

# Script de monitoramento contínuo para VeloFlux em produção
# Usando domínios wildcard corretos

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date '+%H:%M:%S')]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date '+%H:%M:%S')]${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date '+%H:%M:%S')]${NC} $1"
}

# Detectar IP público
PUBLIC_IP=$(curl -s ifconfig.me || echo "UNKNOWN")

# Domínios de teste corretos
ADMIN_DOMAIN="admin.public.dev.veloflux.io"
LANDING_DOMAIN="landing.public.dev.veloflux.io"
API_DOMAIN="api.public.dev.veloflux.io"

# Configurações
INTERVAL=${1:-30}  # Intervalo em segundos (padrão: 30s)
LOG_FILE="./logs/production_monitor.log"

# Criar diretório de logs se não existir
mkdir -p ./logs

log_info "=== Monitor de Produção VeloFlux Iniciado ==="
log_info "IP Público: $PUBLIC_IP"
log_info "Intervalo de verificação: ${INTERVAL}s"
log_info "Log file: $LOG_FILE"
echo

# Função para verificar status de um serviço
check_service() {
    local service_name="$1"
    local url="$2"
    local timeout=10
    
    response=$(curl -s --connect-timeout $timeout -o /dev/null -w '%{http_code}:%{time_total}' "$url" 2>/dev/null)
    http_code=$(echo $response | cut -d: -f1)
    response_time=$(echo $response | cut -d: -f2)
    
    if [[ "$http_code" =~ ^(200|302|404)$ ]]; then
        log_success "$service_name OK ($http_code) - ${response_time}s"
        echo "$(date): $service_name OK ($http_code) - ${response_time}s" >> "$LOG_FILE"
        return 0
    else
        log_error "$service_name FALHA ($http_code) - ${response_time}s"
        echo "$(date): $service_name FALHA ($http_code) - ${response_time}s" >> "$LOG_FILE"
        return 1
    fi
}

# Função para verificar containers Docker
check_containers() {
    local containers=("veloflux-lb" "veloflux-admin" "veloflux-landing" "veloflux-nginx")
    local all_running=true
    
    for container in "${containers[@]}"; do
        if docker ps | grep -q "$container"; then
            log_success "Container $container rodando"
        else
            log_error "Container $container NÃO está rodando"
            all_running=false
        fi
    done
    
    echo "$(date): Containers check - $([ "$all_running" = true ] && echo "OK" || echo "FALHA")" >> "$LOG_FILE"
    return $([ "$all_running" = true ] && echo 0 || echo 1)
}

# Função para verificar uso de recursos
check_resources() {
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1)
    local memory_usage=$(free | grep Mem | awk '{printf "%.1f", $3/$2 * 100.0}')
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | cut -d'%' -f1)
    
    log_info "Recursos - CPU: ${cpu_usage}% | RAM: ${memory_usage}% | Disco: ${disk_usage}%"
    echo "$(date): Recursos - CPU: ${cpu_usage}% | RAM: ${memory_usage}% | Disco: ${disk_usage}%" >> "$LOG_FILE"
    
    # Alertas para uso alto de recursos
    if (( $(echo "$cpu_usage > 80" | bc -l) )); then
        log_warning "ALERTA: Uso de CPU alto (${cpu_usage}%)"
    fi
    
    if (( $(echo "$memory_usage > 85" | bc -l) )); then
        log_warning "ALERTA: Uso de RAM alto (${memory_usage}%)"
    fi
    
    if [ "$disk_usage" -gt 90 ]; then
        log_warning "ALERTA: Uso de disco alto (${disk_usage}%)"
    fi
}

# Função principal de monitoramento
monitor_loop() {
    local cycle=0
    
    while true; do
        cycle=$((cycle + 1))
        
        echo "=== Ciclo de Monitoramento #$cycle - $(date) ==="
        
        # Verificar containers
        check_containers
        
        # Verificar serviços web
        check_service "Admin Panel" "http://$ADMIN_DOMAIN"
        check_service "Landing Page" "http://$LANDING_DOMAIN"
        check_service "API" "http://$API_DOMAIN"
        check_service "Load Balancer Local" "http://localhost:80"
        
        # Verificar recursos do sistema
        check_resources
        
        # Verificar se há erros recentes nos logs
        if docker ps | grep -q veloflux; then
            error_count=$(docker-compose -f docker-compose.production.yml logs --tail=20 2>&1 | grep -i -c "error\|fatal\|panic" || echo "0")
            if [ "$error_count" -gt 0 ]; then
                log_warning "Detectados $error_count erros recentes nos logs"
            fi
        fi
        
        echo "$(date): Ciclo #$cycle completo" >> "$LOG_FILE"
        echo "---"
        
        # Aguardar próximo ciclo
        sleep $INTERVAL
    done
}

# Função para cleanup ao sair
cleanup() {
    log_info "Parando monitor..."
    echo "$(date): Monitor parado" >> "$LOG_FILE"
    exit 0
}

# Capturar sinais para cleanup
trap cleanup SIGINT SIGTERM

# Verificação inicial
log_info "Executando verificação inicial..."
if ! check_containers; then
    log_error "Alguns containers não estão rodando. Inicie os serviços primeiro:"
    echo "  docker-compose -f docker-compose.production.yml up -d"
    exit 1
fi

# Iniciar loop de monitoramento
log_info "Iniciando monitoramento contínuo (pressione Ctrl+C para parar)..."
monitor_loop
