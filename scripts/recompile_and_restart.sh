#!/bin/bash

# Script para recompilar o VeloFlux após alterações no código
# Este script recompila o código e reinicia os serviços para aplicar
# as modificações de métricas do Prometheus

# Configurações
LOG_FILE="/tmp/veloflux_recompile_$(date +%Y%m%d_%H%M%S).log"
VERBOSE=true

# Função para logs coloridos
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="\033[0;34m[INFO]\033[0m   " ;;
        "ERROR") prefix="\033[0;31m[ERRO]\033[0m   " ;;
        "WARN")  prefix="\033[0;33m[AVISO]\033[0m  " ;;
        "OK")    prefix="\033[0;32m[OK]\033[0m     " ;;
        "DEBUG") prefix="\033[0;36m[DEBUG]\033[0m  " ;;
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

log "INFO" "Iniciando processo de recompilação e reinício do VeloFlux"
log "INFO" "Log será salvo em: ${LOG_FILE}"

# Navegar para o diretório raiz do projeto
cd /workspaces/VeloFlux

# Verificar quais containers estão em execução
log "INFO" "Verificando containers do VeloFlux em execução..."
VELOFLUX_CONTAINER=$(docker ps | grep -E "veloflux|veloflux-test" | awk '{print $1}')

if [ -z "$VELOFLUX_CONTAINER" ]; then
    log "WARN" "Nenhum container do VeloFlux encontrado em execução"
    NEEDS_START=true
else
    log "INFO" "Container do VeloFlux encontrado: ${VELOFLUX_CONTAINER}"
    log "INFO" "Parando o container para reconstrução..."
    docker stop $VELOFLUX_CONTAINER
    
    if [ $? -ne 0 ]; then
        log "ERROR" "Falha ao parar o container do VeloFlux"
        exit 1
    else
        log "OK" "Container parado com sucesso"
    fi
fi

# Recompilar o código
log "INFO" "Recompilando o código do VeloFlux..."
go build -o velofluxlb ./cmd/velofluxlb

if [ $? -ne 0 ]; then
    log "ERROR" "Falha na compilação do VeloFlux"
    exit 1
else
    log "OK" "Compilação concluída com sucesso"
fi

# Verificar se a versão compilada tem as métricas necessárias
log "INFO" "Verificando se as métricas do Prometheus estão corretamente incluídas..."
METRICS_CHECK=$(strings velofluxlb | grep -E "veloflux_requests_total|veloflux_request_duration_seconds" | wc -l)

if [ $METRICS_CHECK -gt 0 ]; then
    log "OK" "Métricas do Prometheus detectadas no binário"
else
    log "WARN" "Métricas específicas do VeloFlux não encontradas no binário"
fi

# Reconstruir e iniciar os containers
if docker-compose ps | grep -q "veloflux"; then
    log "INFO" "Reconstruindo e reiniciando os containers com docker-compose..."
    docker-compose up -d --build
    
    if [ $? -ne 0 ]; then
        log "ERROR" "Falha ao reiniciar os containers com docker-compose"
        exit 1
    else
        log "OK" "Containers reiniciados com sucesso"
    fi
else
    log "WARN" "Docker-compose não está sendo usado ou não foram encontrados serviços relacionados ao VeloFlux"
    
    if [ "$NEEDS_START" = true ]; then
        log "INFO" "Iniciando container do VeloFlux manualmente..."
        docker run -d --name veloflux-test -p 8082:8082 -p 9080:9080 veloflux:latest
        
        if [ $? -ne 0 ]; then
            log "ERROR" "Falha ao iniciar o container do VeloFlux manualmente"
            exit 1
        else
            log "OK" "Container iniciado manualmente com sucesso"
        fi
    else
        log "INFO" "Reiniciando container existente do VeloFlux..."
        docker start $VELOFLUX_CONTAINER
        
        if [ $? -ne 0 ]; then
            log "ERROR" "Falha ao reiniciar o container do VeloFlux"
            exit 1
        else
            log "OK" "Container reiniciado com sucesso"
        fi
    fi
fi

# Aguardar inicialização do serviço
log "INFO" "Aguardando inicialização do serviço (5s)..."
sleep 5

# Verificar se o serviço está respondendo
log "INFO" "Verificando se o serviço está respondendo..."
if curl -s --head --max-time 5 http://localhost:8082 | head -n 1 | grep -q "HTTP"; then
    log "OK" "Serviço VeloFlux está respondendo na porta 8082"
else
    log "WARN" "Serviço VeloFlux não está respondendo na porta 8082"
fi

# Verificar endpoint de métricas
log "INFO" "Verificando endpoint de métricas..."
if curl -s --head --max-time 5 http://localhost:9080/metrics | head -n 1 | grep -q "200"; then
    log "OK" "Endpoint de métricas está acessível na porta 9080"
    
    # Verificar se as métricas do VeloFlux estão presentes
    log "INFO" "Verificando presença de métricas específicas do VeloFlux..."
    METRICS=$(curl -s --max-time 5 http://localhost:9080/metrics)
    
    for metric in "veloflux_requests_total" "veloflux_request_duration_seconds" "veloflux_active_connections" "veloflux_backend_health"; do
        if echo "$METRICS" | grep -q "$metric"; then
            log "OK" "Métrica $metric encontrada"
        else
            log "WARN" "Métrica $metric não encontrada"
        fi
    done
else
    log "WARN" "Endpoint de métricas não está acessível na porta 9080"
fi

log "INFO" "Processo de recompilação e reinício concluído"
log "INFO" "Para testar as métricas, execute: ./scripts/test_prometheus_metrics_detailed.sh"
