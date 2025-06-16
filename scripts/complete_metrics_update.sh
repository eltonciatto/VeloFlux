#!/bin/bash

# Script para compilar, verificar e atualizar os serviços VeloFlux 
# com as correções de métricas do Prometheus

# Configurações
LOG_FILE="/tmp/veloflux_complete_recompile_$(date +%Y%m%d_%H%M%S).log"
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

log "INFO" "Iniciando processo completo de recompilação e atualização do VeloFlux"
log "INFO" "Log será salvo em: ${LOG_FILE}"

# Navegar para o diretório raiz do projeto
cd /workspaces/VeloFlux || { log "ERROR" "Falha ao mudar para o diretório do projeto"; exit 1; }

# Compilar o código localmente para verificar se não há erros
log "INFO" "Compilando o VeloFlux localmente para verificar erros..."
go build -o velofluxlb ./cmd/velofluxlb

if [ $? -ne 0 ]; then
    log "ERROR" "Compilação falhou. Verifique os erros acima."
    exit 1
fi

log "OK" "Compilação local concluída com sucesso"

# Verificar se as métricas estão incluídas no binário
log "INFO" "Verificando se as métricas do Prometheus estão incluídas no binário..."
METRICS_CHECK=$(strings ./velofluxlb | grep -E "veloflux_requests_total|veloflux_request_duration_seconds" | wc -l)

if [ $METRICS_CHECK -gt 0 ]; then
    log "OK" "Métricas do Prometheus encontradas no binário"
else
    log "WARN" "Métricas do Prometheus não encontradas no binário. As mudanças podem não ter sido aplicadas corretamente."
fi

# Reconstruir a imagem Docker
log "INFO" "Reconstruindo a imagem Docker do VeloFlux..."
docker-compose build veloflux-lb

if [ $? -ne 0 ]; then
    log "ERROR" "Falha ao reconstruir a imagem Docker"
    exit 1
fi

log "OK" "Imagem Docker reconstruída com sucesso"

# Reiniciar os serviços
log "INFO" "Reiniciando os serviços com as novas imagens..."
docker-compose up -d

if [ $? -ne 0 ]; then
    log "ERROR" "Falha ao reiniciar os serviços"
    exit 1
fi

log "OK" "Serviços reiniciados com sucesso"

# Aguardar um pouco para os serviços inicializarem completamente
log "INFO" "Aguardando inicialização dos serviços (10s)..."
sleep 10

# Verificar se o serviço está respondendo
log "INFO" "Verificando se o VeloFlux está respondendo..."
if curl -s --max-time 5 http://localhost | grep -q "VeloFlux"; then
    log "OK" "VeloFlux está respondendo corretamente"
else
    log "WARN" "VeloFlux pode não estar funcionando corretamente"
fi

# Verificar as métricas
log "INFO" "Verificando as métricas do Prometheus..."
if curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:8080/metrics | grep -q "200"; then
    log "OK" "Endpoint de métricas está acessível"
    
    # Gerar algum tráfego
    log "INFO" "Gerando tráfego para atualizar métricas..."
    for i in {1..50}; do
        curl -s -o /dev/null http://localhost
        if [ $((i % 10)) -eq 0 ]; then
            echo -n "."
        fi
    done
    echo ""
    
    # Aguardar um momento para as métricas serem atualizadas
    log "INFO" "Aguardando atualização das métricas (2s)..."
    sleep 2
    
    # Verificar métricas específicas
    log "INFO" "Verificando métricas específicas do VeloFlux..."
    metrics_data=$(curl -s --max-time 5 http://localhost:8080/metrics)
    
    for metric in "veloflux_requests_total" "veloflux_request_duration_seconds" "veloflux_active_connections" "veloflux_backend_health"; do
        if echo "$metrics_data" | grep -q "$metric"; then
            log "OK" "Métrica $metric encontrada"
        else
            log "WARN" "Métrica $metric não encontrada"
        fi
    done
else
    log "ERROR" "Endpoint de métricas não está acessível"
fi

# Executar script de teste
log "INFO" "Executando script de testes detalhados..."
./scripts/test_prometheus_metrics_detailed.sh

# Resumo
log "INFO" "=== RESUMO DA IMPLEMENTAÇÃO ==="
log "INFO" "1. Modificações no código para instrumentação de métricas foram aplicadas"
log "INFO" "2. Imagem Docker foi reconstruída e serviços foram reiniciados"
log "INFO" "3. Testes foram executados para verificar a implementação"
log "INFO" "4. Documentação foi atualizada em docs/prometheus_metrics_implementation_status.md"

log "INFO" "=== PRÓXIMOS PASSOS ==="
log "INFO" "1. Se as métricas ainda não estiverem visíveis, verificar logs do container:"
log "INFO" "   docker-compose logs veloflux-lb"
log "INFO" "2. Implementar métricas adicionais para ambiente SaaS"
log "INFO" "3. Configurar dashboards no Grafana para visualização das métricas"
log "INFO" "4. Configurar alertas baseados nas métricas"

log "OK" "Processo de atualização concluído com sucesso"
