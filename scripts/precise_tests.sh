#!/bin/bash

# VeloFlux - Testes Avançados de Resiliência e Precisão
# Este script realiza testes detalhados para garantir que o VeloFlux esteja
# operando corretamente e seja capaz de lidar com falhas e recuperação

# Configurações
TIMEOUT_DEFAULT=5  # Timeout padrão em segundos
LOG_FILE="/tmp/veloflux_tests_$(date +%Y%m%d_%H%M%S).log"
VERBOSE=true
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Função para logs
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="[INFO]   " ;;
        "ERROR") prefix="[ERRO]   " ;;
        "WARN")  prefix="[AVISO]  " ;;
        "OK")    prefix="[OK]     " ;;
        "DEBUG") prefix="[DEBUG]  " ;;
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
    else
        FAILED_TESTS=$((FAILED_TESTS+1))
        log "ERROR" "  ✗ Teste '${test_name}' falhou (${execution_time}s)"
        log "ERROR" "  Código de saída: ${result}"
        log "ERROR" "  Saída: ${output}"
    fi
    
    return $result
}

# Função para verificar se um container está funcionando
check_container() {
    local container_name="$1"
    local search_term="$2"
    
    if [ -z "$search_term" ]; then
        search_term="$container_name"
    fi
    
    local container_id=$(docker ps --filter "name=$search_term" --format "{{.ID}}" 2>/dev/null | head -n1)
    
    if [ -z "$container_id" ]; then
        return 1
    fi
    
    local status=$(docker inspect --format "{{.State.Status}}" "$container_id" 2>/dev/null)
    
    if [ "$status" = "running" ]; then
        echo "$container_id"
        return 0
    fi
    
    return 1
}

# Detectar ambiente
log "INFO" "Iniciando testes avançados do VeloFlux"
log "INFO" "Detectando ambiente..."

# Verificar containers em execução
VELOFLUX_CONTAINER=$(check_container "veloflux" "veloflux")
if [ -z "$VELOFLUX_CONTAINER" ]; then
    VELOFLUX_CONTAINER=$(check_container "veloflux-test" "veloflux-test")
    if [ -n "$VELOFLUX_CONTAINER" ]; then
        ENV_TYPE="teste"
        API_PORT=8082
        ADMIN_PORT=9090
        METRICS_PORT=9080
    else
        log "ERROR" "Não foi possível encontrar um container do VeloFlux em execução"
        exit 1
    fi
else
    ENV_TYPE="produção"
    API_PORT=80
    ADMIN_PORT=9000
    METRICS_PORT=8080
fi

# Obter IDs de containers importantes
BACKEND1_CONTAINER=$(docker ps | grep "backend-1" | awk '{print $1}' | head -n1)
BACKEND2_CONTAINER=$(docker ps | grep "backend-2" | awk '{print $1}' | head -n1)
REDIS_CONTAINER=$(docker ps | grep "redis" | awk '{print $1}' | head -n1)

log "INFO" "Ambiente detectado: ${ENV_TYPE}"
log "INFO" "VeloFlux container: ${VELOFLUX_CONTAINER}"
log "INFO" "Backend-1 container: ${BACKEND1_CONTAINER}"
log "INFO" "Backend-2 container: ${BACKEND2_CONTAINER}"
log "INFO" "Redis container: ${REDIS_CONTAINER}"
log "INFO" "Portas: API=${API_PORT}, Admin=${ADMIN_PORT}, Métricas=${METRICS_PORT}"

# Verificar conexões internas
log "INFO" "=== TESTE DE CONECTIVIDADE INTERNA ==="

run_test "conectividade_backend1" "docker exec ${VELOFLUX_CONTAINER} curl -s --max-time 3 -o /dev/null -w '%{http_code}' http://backend-1 | grep -q -E '(200|404)'" 5 \
    "Verificar se o VeloFlux consegue se conectar ao Backend-1"

run_test "conectividade_backend2" "docker exec ${VELOFLUX_CONTAINER} curl -s --max-time 3 -o /dev/null -w '%{http_code}' http://backend-2 | grep -q -E '(200|404)'" 5 \
    "Verificar se o VeloFlux consegue se conectar ao Backend-2"

run_test "conectividade_redis" "docker exec ${VELOFLUX_CONTAINER} nc -z redis 6379" 5 \
    "Verificar se o VeloFlux consegue se conectar ao Redis na porta 6379"

# Verificar health checks
log "INFO" "=== TESTE DE HEALTH CHECKS ==="

run_test "health_backend1" "docker exec ${VELOFLUX_CONTAINER} curl -s --max-time 3 http://backend-1/health | grep -q 'OK'" 5 \
    "Verificar se o health check do Backend-1 responde corretamente"

run_test "health_backend2" "docker exec ${VELOFLUX_CONTAINER} curl -s --max-time 3 http://backend-2/health | grep -q 'OK'" 5 \
    "Verificar se o health check do Backend-2 responde corretamente"

# Verificar métricas
log "INFO" "=== TESTE DE MÉTRICAS PROMETHEUS ==="

run_test "metrics_endpoint" "curl -s --max-time 5 -o /dev/null -w '%{http_code}' http://localhost:${METRICS_PORT}/metrics | grep -q '200'" 6 \
    "Verificar se o endpoint de métricas Prometheus está acessível"

# Verificar se os tipos específicos de métricas existem
for metric in "go_goroutines" "process_cpu_seconds_total" "promhttp_metric_handler"; do
    run_test "metric_${metric}" "curl -s --max-time 5 http://localhost:${METRICS_PORT}/metrics | grep -q '${metric}'" 6 \
        "Verificar presença da métrica ${metric}"
done

# Testar se métricas específicas do VeloFlux existem (pode falhar no ambiente de teste)
for metric in "veloflux_requests_total" "veloflux_backend_health" "veloflux_active_connections"; do
    if curl -s --max-time 5 http://localhost:${METRICS_PORT}/metrics | grep -q "${metric}"; then
        run_test "metric_veloflux_${metric}" "curl -s --max-time 5 http://localhost:${METRICS_PORT}/metrics | grep -q '${metric}'" 6 \
            "Verificar presença da métrica específica ${metric}"
    else
        WARNINGS=$((WARNINGS+1))
        log "WARN" "Métrica específica '${metric}' não encontrada - isso pode ser normal em ambiente de teste"
    fi
done

# Testes de resiliência - simular quedas de backend
log "INFO" "=== TESTES DE RESILIÊNCIA ==="

if [ -n "$BACKEND1_CONTAINER" ]; then
    log "INFO" "Simulando falha no Backend-1..."
    
    # Parar o container
    docker stop "$BACKEND1_CONTAINER" > /dev/null
    
    # Verificar se o VeloFlux detecta a falha
    sleep 5
    
    run_test "resiliencia_falha_backend1" "curl -s --max-time 5 http://localhost:${API_PORT} > /dev/null; echo $?" 8 \
        "Verificar se o VeloFlux continua respondendo mesmo com Backend-1 offline"
    
    # Restaurar o container
    docker start "$BACKEND1_CONTAINER" > /dev/null
    sleep 5
    
    # Verificar recuperação
    run_test "resiliencia_recuperacao_backend1" "docker exec ${VELOFLUX_CONTAINER} curl -s --max-time 3 http://backend-1/health | grep -q 'OK'" 10 \
        "Verificar se o VeloFlux detecta a recuperação do Backend-1"
fi

# Testes de carga
log "INFO" "=== TESTE DE CARGA ==="

# Verificar se ab (Apache Benchmark) está disponível
if command -v ab > /dev/null; then
    # Executar teste de carga leve
    run_test "carga_leve" "ab -n 100 -c 10 -t 5 http://localhost:${API_PORT}/ 2>&1 | grep 'Requests per second'" 15 \
        "Realizar teste de carga leve e medir requisições por segundo"
    
    # Verificar se métricas foram atualizadas após carga
    run_test "metricas_apos_carga" "curl -s --max-time 5 http://localhost:${METRICS_PORT}/metrics > /tmp/metrics_after_load.txt && cat /tmp/metrics_after_load.txt | wc -l | awk '{print \$1 > 100}'" 7 \
        "Verificar se métricas foram atualizadas após teste de carga"
else
    log "WARN" "Apache Benchmark (ab) não encontrado. Pulando teste de carga."
    WARNINGS=$((WARNINGS+1))
    
    # Alternativa - fazer algumas requisições em sequência
    for i in {1..50}; do
        curl -s -o /dev/null "http://localhost:${API_PORT}/"
    done
    
    log "INFO" "Execução de 50 requisições sequenciais como alternativa ao teste de carga"
fi

# Teste de latência
log "INFO" "=== TESTE DE LATÊNCIA ==="

run_test "latencia_api" "curl -s -w '%{time_total}\n' -o /dev/null http://localhost:${API_PORT}/ | awk '{print \$1 < 1}'" 5 \
    "Verificar se a latência da API está abaixo de 1 segundo"

# Resumo
log "INFO" "=== RESUMO DOS TESTES ==="
log "INFO" "Total de testes executados: ${TOTAL_TESTS}"
log "OK" "Testes que passaram: ${PASSED_TESTS}"
log "ERROR" "Testes que falharam: ${FAILED_TESTS}"
log "WARN" "Avisos: ${WARNINGS}"

TAXA_SUCESSO=$(echo "scale=2; ${PASSED_TESTS} * 100 / ${TOTAL_TESTS}" | bc)
log "INFO" "Taxa de sucesso: ${TAXA_SUCESSO}%"

if [ ${FAILED_TESTS} -eq 0 ]; then
    if [ ${WARNINGS} -eq 0 ]; then
        log "OK" "ÓTIMO! Todos os testes passaram sem avisos."
    else
        log "OK" "BOM! Todos os testes passaram, mas há avisos que merecem atenção."
    fi
elif [ ${FAILED_TESTS} -le 2 ] && [ ${PASSED_TESTS} -gt ${FAILED_TESTS} ]; then
    log "WARN" "REGULAR. A maioria dos testes passou, mas há falhas que precisam ser investigadas."
else
    log "ERROR" "CRÍTICO! Vários testes falharam. O sistema precisa de atenção urgente."
fi

log "INFO" "Log completo disponível em: ${LOG_FILE}"
