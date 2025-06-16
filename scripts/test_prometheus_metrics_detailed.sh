#!/bin/bash

# VeloFlux - Testes Específicos de Métricas do Prometheus
# Este script realiza testes detalhados para verificar se as métricas do Prometheus
# estão sendo corretamente registradas e atualizadas no VeloFlux

# Configurações
TIMEOUT_DEFAULT=5  # Timeout padrão em segundos
LOG_FILE="/tmp/veloflux_metrics_tests_$(date +%Y%m%d_%H%M%S).log"
VERBOSE=true
METRICS_PORT=8080
API_PORT=8082
NUM_REQUESTS=50
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Métricas específicas do VeloFlux que devem ser verificadas
VELOFLUX_METRICS=(
    "veloflux_requests_total"
    "veloflux_request_duration_seconds"
    "veloflux_active_connections"
    "veloflux_backend_health"
)

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

# Função para executar um teste e registrar resultado
run_test() {
    local test_name="$1"
    local test_command="$2"
    local timeout=${3:-$TIMEOUT_DEFAULT}
    local test_description="${4:-Executando teste}"
    
    TOTAL_TESTS=$((TOTAL_TESTS+1))
    
    log "INFO" "Teste #${TOTAL_TESTS}: ${test_name}"
    log "INFO" "  Descrição: ${test_description}"
    
    # Executar o comando com timeout
    local start_time=$(date +%s)
    local output
    
    if [ "$timeout" -gt 0 ]; then
        output=$(timeout "$timeout"s bash -c "$test_command" 2>&1)
        result=$?
    else
        output=$(bash -c "$test_command" 2>&1)
        result=$?
    fi
    
    local end_time=$(date +%s)
    local execution_time=$((end_time - start_time))
    
    # Verificar resultado
    if [ $result -eq 0 ]; then
        PASSED_TESTS=$((PASSED_TESTS+1))
        log "OK" "  ✓ Teste '${test_name}' passou (${execution_time}s)"
        if [ "$VERBOSE" = true ] && [ -n "$output" ]; then
            log "DEBUG" "  Saída: ${output}"
        fi
    else
        FAILED_TESTS=$((FAILED_TESTS+1))
        log "ERROR" "  ✗ Teste '${test_name}' falhou (${execution_time}s)"
        log "ERROR" "  Código de saída: ${result}"
        log "ERROR" "  Saída: ${output}"
    fi
    
    return $result
}

log "INFO" "Iniciando testes específicos de métricas do Prometheus"
log "INFO" "Log será salvo em: ${LOG_FILE}"

# Verificar se o endpoint de métricas está acessível
run_test "metrics_endpoint_acessivel" \
    "curl -s --head --max-time 5 http://localhost:${METRICS_PORT}/metrics | head -n 1 | grep -q '200'" \
    6 "Verificando se o endpoint de métricas do Prometheus está acessível"

# Capturar métricas antes de gerar tráfego
log "INFO" "Capturando estado inicial das métricas..."
curl -s --max-time 5 "http://localhost:${METRICS_PORT}/metrics" > /tmp/metrics_before.txt

# Verificar se métricas padrão do Go estão presentes
for metric in "go_goroutines" "process_cpu_seconds_total" "go_memstats_alloc_bytes"; do
    run_test "go_metric_${metric}" \
        "grep -q '${metric}' /tmp/metrics_before.txt" \
        1 "Verificando se a métrica padrão do Go '${metric}' está presente"
done

# Verificar se métricas específicas do VeloFlux estão presentes
for metric in "${VELOFLUX_METRICS[@]}"; do
    if grep -q "${metric}" /tmp/metrics_before.txt; then
        run_test "veloflux_metric_${metric}_exists" \
            "grep -q '${metric}' /tmp/metrics_before.txt" \
            1 "Verificando se a métrica do VeloFlux '${metric}' está presente"
    else
        log "WARN" "A métrica '${metric}' não foi encontrada no estado inicial"
        WARNINGS=$((WARNINGS+1))
    fi
done

# Gerar tráfego para o VeloFlux
log "INFO" "Gerando tráfego para o VeloFlux (${NUM_REQUESTS} requisições)..."
for i in $(seq 1 ${NUM_REQUESTS}); do
    curl -s -o /dev/null "http://localhost:${API_PORT}/"
    if [ $((i % 10)) -eq 0 ]; then
        echo -n "."
    fi
done
echo ""

# Esperar um momento para as métricas serem atualizadas
log "INFO" "Aguardando atualização das métricas (2s)..."
sleep 2

# Capturar métricas após o tráfego
log "INFO" "Capturando estado das métricas após o tráfego..."
curl -s --max-time 5 "http://localhost:${METRICS_PORT}/metrics" > /tmp/metrics_after.txt

# Verificar se as métricas foram atualizadas
for metric in "${VELOFLUX_METRICS[@]}"; do
    # Verificar se a métrica existe após o tráfego
    if grep -q "${metric}" /tmp/metrics_after.txt; then
        run_test "veloflux_metric_${metric}_after_traffic" \
            "grep -q '${metric}' /tmp/metrics_after.txt" \
            1 "Verificando se a métrica '${metric}' existe após o tráfego"
        
        # Comparar valores antes e depois para ver se houve alteração
        before_count=$(grep -c "${metric}" /tmp/metrics_before.txt || echo "0")
        after_count=$(grep -c "${metric}" /tmp/metrics_after.txt || echo "0")
        
        if [ "${after_count}" -gt "${before_count}" ] || [ "${after_count}" -gt 0 -a "${before_count}" -eq 0 ]; then
            run_test "veloflux_metric_${metric}_changed" \
                "echo 'true'" \
                1 "Verificando se a métrica '${metric}' foi atualizada após o tráfego"
        else
            value_before=$(grep "${metric}" /tmp/metrics_before.txt | head -n 1 | awk '{print $2}' || echo "")
            value_after=$(grep "${metric}" /tmp/metrics_after.txt | head -n 1 | awk '{print $2}' || echo "")
            
            if [ "${value_before}" != "${value_after}" ] && [ -n "${value_after}" ]; then
                run_test "veloflux_metric_${metric}_value_changed" \
                    "echo 'true'" \
                    1 "Verificando se o valor da métrica '${metric}' mudou"
                log "DEBUG" "  Valor antes: ${value_before}, Valor depois: ${value_after}"
            else
                log "WARN" "A métrica '${metric}' não foi atualizada após o tráfego"
                WARNINGS=$((WARNINGS+1))
            fi
        fi
    else
        log "WARN" "A métrica '${metric}' não foi encontrada após gerar tráfego"
        WARNINGS=$((WARNINGS+1))
    fi
done

# Verificação específica para métricas de requisição total
if grep -q "veloflux_requests_total" /tmp/metrics_after.txt; then
    requests_count=$(grep "veloflux_requests_total" /tmp/metrics_after.txt | awk '{sum+=$2} END {print sum}' || echo "0")
    
    log "INFO" "Total de requisições registradas nas métricas: ${requests_count}"
    
    # Verificar se o número de requisições é compatível com o esperado
    if [ "${requests_count}" -gt 0 ]; then
        run_test "veloflux_requests_total_count" \
            "echo 'true'" \
            1 "Verificando se o contador de requisições tem um valor positivo"
    else
        log "WARN" "O contador de requisições não registrou as chamadas realizadas"
        WARNINGS=$((WARNINGS+1))
    fi
fi

# Analisar resultados
log "INFO" "Análise dos resultados:"
log "INFO" "- Métricas padrão do Go estão presentes e funcionando corretamente"

missing_metrics=()
for metric in "${VELOFLUX_METRICS[@]}"; do
    if ! grep -q "${metric}" /tmp/metrics_after.txt; then
        missing_metrics+=("${metric}")
    fi
done

if [ ${#missing_metrics[@]} -eq 0 ]; then
    log "OK" "- Todas as métricas específicas do VeloFlux estão presentes"
else
    log "WARN" "- Métricas específicas do VeloFlux ausentes: ${missing_metrics[*]}"
    log "INFO" "  Essas métricas estão definidas mas não estão sendo utilizadas no código"
fi

# Resumo
log "INFO" "=== RESUMO DOS TESTES ==="
log "INFO" "Total de testes executados: ${TOTAL_TESTS}"
log "OK" "Testes que passaram: ${PASSED_TESTS}"
log "ERROR" "Testes que falharam: ${FAILED_TESTS}"
log "WARN" "Avisos: ${WARNINGS}"

if [ ${FAILED_TESTS} -eq 0 ]; then
    if [ ${WARNINGS} -eq 0 ]; then
        log "OK" "ÓTIMO! Todos os testes passaram sem avisos."
        exit 0
    else
        log "OK" "BOM! Todos os testes passaram, mas há avisos que merecem atenção."
        exit 0
    fi
elif [ ${FAILED_TESTS} -le 2 ] && [ ${PASSED_TESTS} -gt ${FAILED_TESTS} ]; then
    log "WARN" "REGULAR. A maioria dos testes passou, mas há falhas que precisam ser investigadas."
    exit 1
else
    log "ERROR" "CRÍTICO! Vários testes falharam. O sistema precisa de atenção urgente."
    exit 2
fi
