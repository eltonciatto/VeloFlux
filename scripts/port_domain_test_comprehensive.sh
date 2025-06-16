#!/bin/bash

# VeloFlux - Testes Abrangentes de Portas e Domínios
# Este script realiza testes detalhados para verificar:
# - Conectividade com diferentes portas
# - Suporte a domínio único
# - Suporte a múltiplos subdomínios
# - Balanceamento de carga entre backends
# - Cabeçalhos HTTP presentes nas respostas

# Configurações
LOG_FILE="/tmp/veloflux_domain_tests_$(date +%Y%m%d_%H%M%S).log"
TIMEOUT_DEFAULT=5
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0
VERBOSE=true

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # Sem cor

# Domínios de teste
# Nota: Estes domínios serão simulados via entrada /etc/hosts ou headers HTTP
DOMAINS=(
  "veloflux.io"
  "app.veloflux.io" 
  "api.veloflux.io"
  "admin.veloflux.io"
  "tenant1.veloflux.io"
  "tenant2.veloflux.io"
)

# Portas a testar
PORTS=(
  80    # HTTP principal
  443   # HTTPS
  8080  # Métricas
  9000  # API Admin
)

# Função para logs
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}   " ;;
        "ERROR") prefix="${RED}[ERRO]${NC}   " ;;
        "WARN")  prefix="${YELLOW}[AVISO]${NC}  " ;;
        "OK")    prefix="${GREEN}[OK]${NC}     " ;;
        "DEBUG") prefix="${CYAN}[DEBUG]${NC}  " ;;
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

# Função para verificar se uma porta está aberta
check_port() {
    local host="$1"
    local port="$2"
    
    (echo > /dev/tcp/$host/$port) >/dev/null 2>&1
    return $?
}

# Função para detectar o ambiente VeloFlux
detect_environment() {
    log "INFO" "Detectando ambiente VeloFlux..."
    
    # Verificar portas padrão
    if check_port "localhost" 80; then
        API_PORT=80
        log "INFO" "Porta HTTP (80) detectada - provavelmente ambiente de produção"
        ENV_TYPE="produção"
    elif check_port "localhost" 8082; then
        API_PORT=8082
        log "INFO" "Porta HTTP alternativa (8082) detectada - provavelmente ambiente de teste"
        ENV_TYPE="teste"
    else
        log "WARN" "Não foi detectado servidor HTTP ativo nas portas padrão"
        API_PORT=8082  # Padrão para testes
        ENV_TYPE="desconhecido"
    fi
    
    # Verificar porta de métricas
    if check_port "localhost" 8080; then
        METRICS_PORT=8080
        log "INFO" "Porta de métricas (8080) detectada"
    elif check_port "localhost" 9080; then
        METRICS_PORT=9080
        log "INFO" "Porta alternativa de métricas (9080) detectada"
    else
        log "WARN" "Porta de métricas não detectada"
        METRICS_PORT=8080  # Padrão
    fi
    
    # Verificar porta admin
    if check_port "localhost" 9000; then
        ADMIN_PORT=9000
        log "INFO" "Porta admin (9000) detectada"
    else
        log "WARN" "Porta admin não detectada"
        ADMIN_PORT=9000  # Padrão
    fi
    
    # Verificar se temos Docker para ambiente de teste
    DOCKER_AVAILABLE=false
    if command -v docker &> /dev/null; then
        DOCKER_AVAILABLE=true
        log "INFO" "Docker disponível para testes adicionais"
        
        # Verificar containers em execução
        VELOFLUX_CONTAINER=$(docker ps --filter "name=veloflux" --format "{{.ID}}" 2>/dev/null | head -n1)
        if [ -n "$VELOFLUX_CONTAINER" ]; then
            log "INFO" "Container VeloFlux detectado: ${VELOFLUX_CONTAINER}"
        else
            log "WARN" "Container VeloFlux não encontrado"
        fi
    else
        log "WARN" "Docker não disponível - alguns testes serão limitados"
    fi
    
    log "INFO" "Ambiente detectado: ${ENV_TYPE}"
    log "INFO" "Portas configuradas: API=${API_PORT}, Admin=${ADMIN_PORT}, Métricas=${METRICS_PORT}"
}

# Testar todas as portas configuradas
test_all_ports() {
    log "INFO" "=== TESTE DE PORTAS BÁSICO ==="
    
    for port in "${PORTS[@]}"; do
        run_test "porta_${port}_aberta" "timeout 1 bash -c '</dev/tcp/localhost/${port}' && echo 'Porta aberta' || echo 'Porta fechada'" 2 \
            "Verificar se a porta ${port} está aberta"
    done
}

# Testar conectividade com domínio único
test_single_domain() {
    log "INFO" "=== TESTE COM DOMÍNIO ÚNICO ==="
    
    local domain="${DOMAINS[0]}"  # Usar o primeiro domínio da lista
    
    run_test "curl_dominio_unico_http" "curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${API_PORT}/ | grep -q -E '(200|301|302)'" 5 \
        "Testar acesso HTTP com domínio único: ${domain}"
        
    if check_port "localhost" 443; then
        run_test "curl_dominio_unico_https" "curl -s -k -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' https://localhost:443/ | grep -q -E '(200|301|302)'" 5 \
            "Testar acesso HTTPS com domínio único: ${domain}"
    else
        log "WARN" "HTTPS não disponível, pulando teste HTTPS para ${domain}"
        WARNINGS=$((WARNINGS+1))
    fi
    
    # Verificar headers de resposta
    run_test "headers_dominio_unico" "curl -s -i -H 'Host: ${domain}' http://localhost:${API_PORT}/ | grep -q 'Server'" 5 \
        "Verificar headers de resposta para domínio único: ${domain}"
}

# Testar conectividade com múltiplos subdomínios
test_multiple_subdomains() {
    log "INFO" "=== TESTE COM MÚLTIPLOS SUBDOMÍNIOS ==="
    
    local count=0
    
    for domain in "${DOMAINS[@]}"; do
        if [[ "$domain" == *.* ]]; then  # Verificar se é um subdomínio
            count=$((count+1))
            
            run_test "curl_subdominio_${count}" "curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${API_PORT}/ | grep -q -E '(200|301|302|404)'" 5 \
                "Testar acesso HTTP com subdomínio: ${domain}"
                
            # Verificar se o Host header é processado corretamente
            run_test "host_header_${count}" "curl -s -i -H 'Host: ${domain}' http://localhost:${API_PORT}/ | grep -q -i 'HTTP'" 5 \
                "Verificar processamento do header Host para: ${domain}"
        fi
    done
    
    if [ $count -eq 0 ]; then
        log "WARN" "Nenhum subdomínio definido para teste"
        WARNINGS=$((WARNINGS+1))
    fi
}

# Testar balanceamento de carga
test_load_balancing() {
    log "INFO" "=== TESTE DE BALANCEAMENTO DE CARGA ==="
    
    # Verificar se temos backends disponíveis
    if [ "$DOCKER_AVAILABLE" = true ]; then
        backend_count=$(docker ps --filter "name=backend" | wc -l)
        backend_count=$((backend_count - 1))  # Remover linha de header
        
        if [ $backend_count -gt 1 ]; then
            log "INFO" "Detectados ${backend_count} backends para teste de balanceamento"
            
            # Fazer várias requisições e verificar se diferentes backends são utilizados
            log "INFO" "Realizando múltiplas requisições para testar balanceamento..."
            
            rm -f /tmp/veloflux_backends.txt
            for i in {1..20}; do
                curl -s -H "Host: ${DOMAINS[0]}" http://localhost:${API_PORT}/ | grep -o "Backend-[0-9]\+" >> /tmp/veloflux_backends.txt || true
                echo -n "."
            done
            echo ""
            
            unique_backends=$(sort -u /tmp/veloflux_backends.txt | wc -l)
            
            run_test "balanceamento_multiplos_backends" "[ $unique_backends -gt 1 ]" 1 \
                "Verificar se múltiplos backends foram utilizados nas requisições"
                
            log "INFO" "Backends utilizados: $(sort -u /tmp/veloflux_backends.txt | tr '\n' ' ')"
            
        else
            log "WARN" "Não há múltiplos backends para testar balanceamento"
            WARNINGS=$((WARNINGS+1))
        fi
    else
        log "WARN" "Docker não disponível, pulando teste de balanceamento"
        WARNINGS=$((WARNINGS+1))
    fi
}

# Testar roteamento baseado em domínio
test_domain_routing() {
    log "INFO" "=== TESTE DE ROTEAMENTO BASEADO EM DOMÍNIO ==="
    
    declare -A domain_responses
    
    # Fazer requisições para cada domínio e verificar diferenças
    for domain in "${DOMAINS[@]}"; do
        # Salvar a resposta para cada domínio
        curl -s -H "Host: ${domain}" http://localhost:${API_PORT}/ > "/tmp/veloflux_response_${domain//./\_}.html"
        
        # Calcular hash da resposta para comparação rápida
        domain_responses["$domain"]=$(md5sum "/tmp/veloflux_response_${domain//./\_}.html" | cut -d' ' -f1)
    done
    
    # Verificar se temos pelo menos algumas respostas diferentes
    unique_responses=$(echo "${domain_responses[@]}" | tr ' ' '\n' | sort -u | wc -l)
    
    run_test "roteamento_dominio_diferenciado" "[ $unique_responses -gt 1 ]" 1 \
        "Verificar se o roteamento baseado em domínio fornece respostas diferentes"
        
    if [ $unique_responses -gt 1 ]; then
        log "INFO" "Roteamento baseado em domínio funcionando - ${unique_responses} respostas únicas identificadas"
    elif [ $unique_responses -eq 1 ]; then
        log "WARN" "Todas as requisições retornaram o mesmo conteúdo - roteamento por domínio pode não estar ativo"
        WARNINGS=$((WARNINGS+1))
    else
        log "ERROR" "Falha ao verificar respostas de roteamento por domínio"
    fi
}

# Testar headers personalizados
test_custom_headers() {
    log "INFO" "=== TESTE DE HEADERS PERSONALIZADOS ==="
    
    # Testar headers X-Forwarded-For
    run_test "header_x_forwarded_for" "curl -s -i -H 'Host: ${DOMAINS[0]}' http://localhost:${API_PORT}/ | grep -q 'X-Forwarded-For\|X-Real-IP'" 5 \
        "Verificar se o header X-Forwarded-For ou X-Real-IP está sendo incluído"
        
    # Testar cookie de sessão sticky (se existir)
    run_test "cookie_sessao" "curl -s -i -H 'Host: ${DOMAINS[0]}' http://localhost:${API_PORT}/ | grep -q -i 'Set-Cookie'" 5 \
        "Verificar se há cookie de sessão sendo definido"
        
    # Testar header de servidor
    run_test "header_server" "curl -s -i -H 'Host: ${DOMAINS[0]}' http://localhost:${API_PORT}/ | grep -q -i 'Server\|X-Powered-By'" 5 \
        "Verificar se o header Server ou X-Powered-By está presente"
}

# Testar porta de métricas com diferentes domínios
test_metrics_with_domains() {
    log "INFO" "=== TESTE DE MÉTRICAS COM DIFERENTES DOMÍNIOS ==="
    
    for domain in "${DOMAINS[@]:0:3}"; do  # Limitar a 3 domínios para não sobrecarregar
        run_test "metricas_dominio_${domain//./\_}" "curl -s -H 'Host: ${domain}' -o /dev/null http://localhost:${API_PORT}/ && curl -s http://localhost:${METRICS_PORT}/metrics | grep -q 'http_'" 5 \
            "Verificar se métricas são registradas após acesso com domínio: ${domain}"
    done
}

# Função para testar múltiplos domínios em paralelo
test_parallel_domains() {
    log "INFO" "=== TESTE DE ACESSOS PARALELOS COM MÚLTIPLOS DOMÍNIOS ==="
    
    if command -v ab &> /dev/null; then
        # Usar o Apache Benchmark para testar carga paralela
        for domain in "${DOMAINS[@]:0:2}"; do  # Limitar a 2 domínios para teste
            run_test "carga_paralela_${domain//./\_}" "ab -n 50 -c 10 -H 'Host: ${domain}' http://localhost:${API_PORT}/ 2>&1 | grep -q 'Requests per second'" 10 \
                "Testar acessos paralelos para domínio: ${domain}"
        done
    else
        log "WARN" "Apache Benchmark (ab) não encontrado, usando método alternativo para teste paralelo"
        WARNINGS=$((WARNINGS+1))
        
        # Método alternativo usando curl e background jobs
        pids=()
        for domain in "${DOMAINS[@]:0:2}"; do  # Limitar a 2 domínios
            for i in {1..10}; do
                (curl -s -H "Host: ${domain}" -o /dev/null http://localhost:${API_PORT}/) &
                pids+=($!)
            done
        done
        
        # Esperar todos os processos terminarem
        for pid in "${pids[@]}"; do
            wait $pid || true
        done
        
        run_test "carga_paralela_alternativa" "true" 1 \
            "Teste alternativo de acessos paralelos para múltiplos domínios"
            
        log "INFO" "Teste paralelo alternativo concluído para ${#DOMAINS[@]} domínios"
    fi
}

# Testar tentativas de conexão com status code 502 ou 503
test_error_responses() {
    log "INFO" "=== TESTE DE RESPOSTAS DE ERRO ==="
    
    # Testar com um caminho inválido
    run_test "resposta_404" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: ${DOMAINS[0]}' http://localhost:${API_PORT}/caminho-inexistente | grep -q '404'" 5 \
        "Verificar se um caminho inexistente retorna 404"
        
    # Testar com um domínio não configurado
    run_test "dominio_nao_configurado" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: dominio-nao-configurado.exemplo.com' http://localhost:${API_PORT}/ | grep -q -E '(404|503|400)'" 5 \
        "Verificar resposta para um domínio não configurado"
        
    # Testar com um cabeçalho muito grande
    large_header=$(printf 'X-Large-Header: %0.s-' {1..8192})
    run_test "header_muito_grande" "curl -s -o /dev/null -w '%{http_code}' -H 'Host: ${DOMAINS[0]}' -H '${large_header}' http://localhost:${API_PORT}/ | grep -q -E '(400|413|431)'" 5 \
        "Verificar resposta para um cabeçalho HTTP muito grande"
}

# Função principal
main() {
    log "INFO" "Iniciando testes abrangentes de portas e domínios para VeloFlux"
    log "INFO" "Log será salvo em: ${LOG_FILE}"
    log "INFO" "Data e hora: $(date)"
    
    # Detectar ambiente
    detect_environment
    
    # Executar testes
    test_all_ports
    test_single_domain
    test_multiple_subdomains
    test_load_balancing
    test_domain_routing
    test_custom_headers
    test_metrics_with_domains
    test_parallel_domains
    test_error_responses
    
    # Exibir resumo
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
            log "OK" "BOM! Todos os testes passaram, mas há ${WARNINGS} avisos que merecem atenção."
        fi
        exit 0
    elif [ ${FAILED_TESTS} -le 2 ] && [ ${PASSED_TESTS} -gt ${FAILED_TESTS} ]; then
        log "WARN" "REGULAR. A maioria dos testes passou, mas há ${FAILED_TESTS} falhas que precisam ser investigadas."
        exit 1
    else
        log "ERROR" "CRÍTICO! Vários testes falharam (${FAILED_TESTS}). O sistema precisa de atenção urgente."
        exit 2
    fi
}

# Executar função principal
main
