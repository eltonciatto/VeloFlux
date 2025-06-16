#!/bin/bash

# VeloFlux - Testador de Domínios Múltiplos e Virtualhosts
# Este script testa a funcionalidade de VirtualHosts do VeloFlux
# com múltiplos domínios, subdomínios e configurações personalizadas

# Configurações
LOG_FILE="/tmp/veloflux_multidomains_test_$(date +%Y%m%d_%H%M%S).log"
TIMEOUT_DEFAULT=5
VERBOSE=true

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # Sem cor

# Domínios de teste
declare -A DOMAIN_CONFIGS=(
    ["veloflux.io"]="principal"
    ["api.veloflux.io"]="api"
    ["admin.veloflux.io"]="admin"
    ["app.veloflux.io"]="app"
    ["tenant1.veloflux.io"]="tenant1"
    ["tenant2.veloflux.io"]="tenant2"
    ["*.veloflux.io"]="wildcard"
    ["teste.example.com"]="alternativo"
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
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

# Função para detectar ambiente VeloFlux
detect_environment() {
    log "INFO" "Detectando ambiente VeloFlux..."
    
    # Verificar porta HTTP padrão
    if nc -z -w2 localhost 80 &>/dev/null; then
        API_PORT=80
        log "OK" "Porta HTTP (80) detectada"
        ENV_TYPE="produção"
    elif nc -z -w2 localhost 8082 &>/dev/null; then
        API_PORT=8082
        log "OK" "Porta HTTP alternativa (8082) detectada"
        ENV_TYPE="teste"
    else
        log "WARN" "Nenhuma porta HTTP padrão encontrada"
        # Tentar outras portas comuns
        for port in 8081 8080 8000 3000; do
            if nc -z -w2 localhost $port &>/dev/null; then
                API_PORT=$port
                log "OK" "Porta HTTP alternativa ($port) detectada"
                ENV_TYPE="personalizado"
                break
            fi
        done
        
        if [ -z "$API_PORT" ]; then
            log "ERROR" "Nenhuma porta HTTP acessível encontrada"
            API_PORT=8082  # Valor padrão
            ENV_TYPE="desconhecido"
        fi
    fi
    
    log "INFO" "Ambiente detectado: ${ENV_TYPE}"
    log "INFO" "Porta API principal: ${API_PORT}"
    
    # Verificar se VeloFlux está em execução
    if ! curl -s --max-time 3 -o /dev/null http://localhost:${API_PORT}/; then
        log "ERROR" "O VeloFlux parece não estar respondendo na porta ${API_PORT}"
        log "INFO" "Tentando iniciar o ambiente com docker-compose..."
        
        if [ -f "docker-compose.yml" ]; then
            docker-compose up -d
            sleep 5
            if ! curl -s --max-time 3 -o /dev/null http://localhost:${API_PORT}/; then
                log "ERROR" "Falha ao iniciar o ambiente. Os testes podem não funcionar corretamente."
            else
                log "OK" "Ambiente iniciado com sucesso"
            fi
        else
            log "ERROR" "docker-compose.yml não encontrado"
        fi
    else
        log "OK" "VeloFlux está respondendo na porta ${API_PORT}"
    fi
}

# Testar configurações de domínio único
test_single_domain() {
    local domain=$1
    local desc=$2
    local result=0
    
    log "INFO" "Testando domínio único: ${domain} (${desc})"
    
    # Testar acesso HTTP básico
    if curl -s --max-time 3 -H "Host: ${domain}" -o /dev/null -w "%{http_code}" http://localhost:${API_PORT}/ | grep -q -E "2[0-9][0-9]|3[0-9][0-9]"; then
        log "OK" "Acesso HTTP básico bem-sucedido para ${domain}"
    else
        log "ERROR" "Falha no acesso HTTP básico para ${domain}"
        result=1
    fi
    
    # Verificar headers personalizados
    local headers=$(curl -s --max-time 3 -i -H "Host: ${domain}" http://localhost:${API_PORT}/)
    
    if echo "$headers" | grep -q -i "Server"; then
        log "OK" "Header 'Server' presente para ${domain}"
    else
        log "WARN" "Header 'Server' ausente para ${domain}"
    fi
    
    if echo "$headers" | grep -q -i "X-Powered-By\|X-VeloFlux"; then
        log "OK" "Headers personalizados presentes para ${domain}"
    else
        log "WARN" "Headers personalizados ausentes para ${domain}"
    fi
    
    # Verificar cookie de sessão (opcional)
    if echo "$headers" | grep -q -i "Set-Cookie"; then
        log "OK" "Cookie de sessão detectado para ${domain}"
    else
        log "INFO" "Cookie de sessão não detectado para ${domain} (pode ser normal dependendo da configuração)"
    fi
    
    return $result
}

# Testar comportamento de wildcard para subdomínios
test_wildcard_subdomain() {
    log "INFO" "Testando comportamento de wildcard para subdomínios..."
    
    # Gerar um subdomínio aleatório
    local random_subdomain="test$(date +%s).veloflux.io"
    
    # Testar acesso
    if curl -s --max-time 3 -H "Host: ${random_subdomain}" -o /dev/null -w "%{http_code}" http://localhost:${API_PORT}/ | grep -q -E "2[0-9][0-9]|3[0-9][0-9]"; then
        log "OK" "Wildcard funcionando para ${random_subdomain}"
        return 0
    else
        log "WARN" "Wildcard pode não estar funcionando para ${random_subdomain}"
        return 1
    fi
}

# Testar integração múltiplos domínios no mesmo servidor
test_domain_separation() {
    log "INFO" "Testando separação de conteúdo entre domínios..."
    
    # Capturar conteúdo de diferentes domínios
    local content1=$(curl -s --max-time 3 -H "Host: veloflux.io" http://localhost:${API_PORT}/ | md5sum | cut -d' ' -f1)
    local content2=$(curl -s --max-time 3 -H "Host: api.veloflux.io" http://localhost:${API_PORT}/ | md5sum | cut -d' ' -f1)
    local content3=$(curl -s --max-time 3 -H "Host: admin.veloflux.io" http://localhost:${API_PORT}/ | md5sum | cut -d' ' -f1)
    
    # Verificar se os conteúdos são diferentes
    local unique_content_count=$(echo -e "${content1}\n${content2}\n${content3}" | sort -u | wc -l)
    
    if [ $unique_content_count -gt 1 ]; then
        log "OK" "Separação de conteúdo detectada entre diferentes domínios (${unique_content_count} variações)"
        return 0
    else
        log "WARN" "Todos os domínios retornam o mesmo conteúdo"
        return 1
    fi
}

# Testar regras de redirecionamento
test_redirects() {
    log "INFO" "Testando regras de redirecionamento..."
    
    # Testar HTTP para HTTPS (se HTTPS estiver disponível)
    if nc -z -w2 localhost 443 &>/dev/null; then
        local redirect=$(curl -s -I -H "Host: veloflux.io" http://localhost:${API_PORT}/ | grep -i "Location")
        
        if echo "$redirect" | grep -q -i "https"; then
            log "OK" "Redirecionamento HTTP->HTTPS detectado"
        else
            log "INFO" "Redirecionamento HTTP->HTTPS não detectado (pode ser normal dependendo da configuração)"
        fi
    fi
    
    # Testar redirecionamento de diretório sem barra final
    local with_slash=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: veloflux.io" http://localhost:${API_PORT}/diretorio/)
    local without_slash=$(curl -s -I -H "Host: veloflux.io" http://localhost:${API_PORT}/diretorio | grep -i "Location")
    
    if echo "$without_slash" | grep -q -i "diretorio/"; then
        log "OK" "Redirecionamento de diretório sem barra final detectado"
    else
        log "INFO" "Redirecionamento de diretório sem barra final não detectado (pode ser normal)"
    fi
}

# Testar múltiplas solicitações simultâneas para diferentes domínios
test_concurrent_domains() {
    log "INFO" "Testando solicitações simultâneas para múltiplos domínios..."
    
    # Array para armazenar os PIDs dos processos em background
    pids=()
    results=()
    
    # Fazer solicitações simultâneas para diferentes domínios
    for domain in "${!DOMAIN_CONFIGS[@]}"; do
        # Ignorar domínio wildcard
        if [ "$domain" != "*.veloflux.io" ]; then
            (curl -s --max-time 5 -H "Host: ${domain}" -o /dev/null -w "%{http_code}" http://localhost:${API_PORT}/ | grep -q -E "2[0-9][0-9]|3[0-9][0-9]"; echo $? > "/tmp/veloflux_concurrent_${domain//./\_}") &
            pids+=($!)
        fi
    done
    
    # Esperar que todas as solicitações terminem
    for pid in "${pids[@]}"; do
        wait $pid
    done
    
    # Verificar os resultados
    success=0
    failed=0
    for domain in "${!DOMAIN_CONFIGS[@]}"; do
        if [ "$domain" != "*.veloflux.io" ]; then
            result=$(cat "/tmp/veloflux_concurrent_${domain//./\_}" 2>/dev/null || echo "1")
            if [ "$result" -eq "0" ]; then
                success=$((success+1))
                log "OK" "Solicitação concorrente para ${domain} bem-sucedida"
            else
                failed=$((failed+1))
                log "ERROR" "Solicitação concorrente para ${domain} falhou"
            fi
        fi
    done
    
    log "INFO" "Solicitações concorrentes: ${success} bem-sucedidas, ${failed} falhas"
    
    if [ $failed -eq 0 ]; then
        return 0
    else
        return 1
    fi
}

# Testar header Host com codificação especial
test_special_host_headers() {
    log "INFO" "Testando header Host com codificações especiais..."
    
    # Testar com encoding no domínio
    if curl -s --max-time 3 -H "Host: xn--80aaxitdbjk.xn--p1ai" -o /dev/null -w "%{http_code}" http://localhost:${API_PORT}/ | grep -q -E "2[0-9][0-9]|3[0-9][0-9]|404"; then
        log "OK" "O servidor lida adequadamente com punycode/IDN em headers Host"
    else
        log "WARN" "Possível problema com suporte a punycode/IDN em headers Host"
    fi
    
    # Testar com caso misto (case sensitivity)
    if curl -s --max-time 3 -H "Host: VeLoFluX.Io" -o /dev/null -w "%{http_code}" http://localhost:${API_PORT}/ | grep -q -E "2[0-9][0-9]|3[0-9][0-9]"; then
        log "OK" "O servidor trata domínios case-insensitive corretamente"
    else
        log "WARN" "Possível problema com case sensitivity em domínios"
    fi
    
    # Testar com caracteres especiais na URL
    if curl -s --max-time 3 -H "Host: veloflux.io" -o /dev/null -w "%{http_code}" "http://localhost:${API_PORT}/%C3%A7%C3%A3o-teste" | grep -q -E "2[0-9][0-9]|3[0-9][0-9]|404"; then
        log "OK" "O servidor lida adequadamente com caracteres especiais em URLs"
    else
        log "WARN" "Possível problema com caracteres especiais em URLs"
    fi
}

# Função principal
main() {
    log "INFO" "Iniciando teste abrangente de múltiplos domínios para VeloFlux"
    log "INFO" "Log será salvo em: ${LOG_FILE}"
    log "INFO" "Data e hora: $(date)"
    
    # Detectar ambiente
    detect_environment
    
    # Contadores
    local tests_total=0
    local tests_passed=0
    local tests_failed=0
    
    # Testar cada domínio configurado
    log "INFO" "=== TESTANDO DOMÍNIOS INDIVIDUAIS ==="
    for domain in "${!DOMAIN_CONFIGS[@]}"; do
        # Ignorar domínio wildcard para testes individuais
        if [ "$domain" != "*.veloflux.io" ]; then
            tests_total=$((tests_total+1))
            if test_single_domain "$domain" "${DOMAIN_CONFIGS[$domain]}"; then
                tests_passed=$((tests_passed+1))
            else
                tests_failed=$((tests_failed+1))
            fi
        fi
    done
    
    # Testar wildcard
    log "INFO" "=== TESTANDO WILDCARDS ==="
    tests_total=$((tests_total+1))
    if test_wildcard_subdomain; then
        tests_passed=$((tests_passed+1))
    else
        tests_failed=$((tests_failed+1))
    fi
    
    # Testar separação entre domínios
    log "INFO" "=== TESTANDO SEPARAÇÃO ENTRE DOMÍNIOS ==="
    tests_total=$((tests_total+1))
    if test_domain_separation; then
        tests_passed=$((tests_passed+1))
    else
        tests_failed=$((tests_failed+1))
    fi
    
    # Testar regras de redirecionamento
    log "INFO" "=== TESTANDO REGRAS DE REDIRECIONAMENTO ==="
    tests_total=$((tests_total+1))
    if test_redirects; then
        tests_passed=$((tests_passed+1))
    else
        tests_failed=$((tests_failed+1))
    fi
    
    # Testar solicitações concorrentes para múltiplos domínios
    log "INFO" "=== TESTANDO SOLICITAÇÕES CONCORRENTES ==="
    tests_total=$((tests_total+1))
    if test_concurrent_domains; then
        tests_passed=$((tests_passed+1))
    else
        tests_failed=$((tests_failed+1))
    fi
    
    # Testar headers Host especiais
    log "INFO" "=== TESTANDO HEADERS HOST ESPECIAIS ==="
    tests_total=$((tests_total+1))
    if test_special_host_headers; then
        tests_passed=$((tests_passed+1))
    else
        tests_failed=$((tests_failed+1))
    fi
    
    # Exibir resumo
    log "INFO" "=== RESUMO DOS TESTES ==="
    log "INFO" "Total de testes executados: ${tests_total}"
    log "OK" "Testes que passaram: ${tests_passed}"
    log "ERROR" "Testes que falharam: ${tests_failed}"
    
    if [ ${tests_failed} -eq 0 ]; then
        log "OK" "SUCESSO! Todos os testes de múltiplos domínios passaram."
        exit 0
    else
        local success_rate=$((tests_passed * 100 / tests_total))
        log "WARN" "ATENÇÃO! ${tests_failed} teste(s) falhou(falharam). Taxa de sucesso: ${success_rate}%"
        exit 1
    fi
}

# Executar função principal
main
