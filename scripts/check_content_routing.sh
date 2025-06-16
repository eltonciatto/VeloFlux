#!/bin/bash

# Script para verificar o conteúdo servido por cada domínio e porta
# Este script testa o roteamento baseado em domínio do VeloFlux

LOG_FILE="/tmp/veloflux_content_check_$(date +%Y%m%d_%H%M%S).log"
echo "Log será salvo em $LOG_FILE"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

# Função de log
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}     " ;;
        "ERROR") prefix="${RED}[ERROR]${NC}    " ;;
        "WARN")  prefix="${YELLOW}[WARN]${NC}     " ;;
        "OK")    prefix="${GREEN}[OK]${NC}       " ;;
        "DEBUG") prefix="${CYAN}[DEBUG]${NC}    " ;;
        *)       prefix="[LOG]      " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

log "INFO" "VeloFlux Content Verification"
log "INFO" "==========================="
log "INFO" "Log: $LOG_FILE"

# Verificar ambiente
HTTP_PORT=80
if ! timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$HTTP_PORT" 2>/dev/null; then
    log "ERROR" "Porta $HTTP_PORT não está acessível. VeloFlux está rodando?"
    exit 1
else
    log "OK" "VeloFlux está rodando na porta $HTTP_PORT"
fi

# Função para extrair informação do conteúdo
extract_content_info() {
    local html="$1"
    local title=$(echo "$html" | grep -o '<title>[^<]*</title>' | sed 's/<title>\(.*\)<\/title>/\1/')
    local server=$(echo "$html" | grep -o 'Server [0-9]\+' | head -n1)
    
    echo "Title: ${title:-N/A}, Server: ${server:-N/A}"
}

# Verificar backends diretamente
log "INFO" "Verificando backends diretamente..."
for port in 8001 8002; do
    content=$(curl -s http://localhost:$port/ 2>/dev/null)
    if [ -n "$content" ]; then
        info=$(extract_content_info "$content")
        log "OK" "Backend na porta $port: $info"
    else
        log "ERROR" "Backend na porta $port não está respondendo"
    fi
done

# Array de domínios para testar
DOMAINS=(
    "example.com" 
    "www.example.com"
    "api.example.com"
    "app.private.dev.veloflux.io"
    "www.private.dev.veloflux.io"
    "api.private.dev.veloflux.io"
    "admin.private.dev.veloflux.io"
    "tenant1.private.dev.veloflux.io"
    "tenant2.private.dev.veloflux.io"
    "tenant1.public.dev.veloflux.io"
    "api.public.dev.veloflux.io"
    "test.private.dev.veloflux.io"
    "test.public.dev.veloflux.io"
)

# Paths para testar
PATHS=(
    "/"
    "/api/"
    "/admin/"
    "/health"
)

# Testar domínios e caminhos
log "INFO" "Testando domínios e paths..."
for domain in "${DOMAINS[@]}"; do
    log "INFO" "Domínio: $domain"
    
    for path in "${PATHS[@]}"; do
        log "DEBUG" "  Testando $path"
        
        # Buscar conteúdo
        content=$(curl -s -H "Host: $domain" "http://localhost:$HTTP_PORT$path" 2>/dev/null)
        status=$?
        
        if [ $status -eq 0 ]; then
            # Extrair código de status HTTP
            http_code=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $domain" "http://localhost:$HTTP_PORT$path")
            
            # Verificar se é uma resposta 2xx ou 3xx
            if [[ "$http_code" =~ ^[23][0-9][0-9]$ ]]; then
                info=$(extract_content_info "$content")
                log "OK" "  Path $path - Status $http_code - $info"
            else
                # Para respostas 4xx ou 5xx
                log "WARN" "  Path $path - Status $http_code - $(echo "$content" | head -n1 | tr -d '\n' | cut -c1-50)..."
            fi
        else
            log "ERROR" "  Path $path - Falha na conexão"
        fi
    done
done

# Testar balanceamento de carga
log "INFO" "Testando balanceamento de carga..."
domain="app.private.dev.veloflux.io"
declare -A server_counts

for i in {1..20}; do
    content=$(curl -s -H "Host: $domain" "http://localhost:$HTTP_PORT/" 2>/dev/null)
    server=$(echo "$content" | grep -o 'Server [0-9]\+' || echo "Unknown")
    ((server_counts["$server"]++))
    echo -n "."
done
echo ""

# Exibir resultados
for server in "${!server_counts[@]}"; do
    log "INFO" "  $server: ${server_counts["$server"]} ocorrências"
done

# Verificar se houve balanceamento
unique_servers=${#server_counts[@]}
if [ $unique_servers -gt 1 ]; then
    log "OK" "Balanceamento de carga funcionando ($unique_servers servidores distintos)"
elif [ $unique_servers -eq 1 ]; then
    log "WARN" "Apenas um servidor respondeu às requisições. Balanceamento pode não estar funcionando corretamente."
else
    log "ERROR" "Nenhum servidor identificado nas respostas"
fi

# Resumo
log "INFO" "======================"
log "INFO" "RESUMO DA VERIFICAÇÃO"
log "INFO" "======================"
log "INFO" "Backends verificados: 2"
log "INFO" "Domínios testados: ${#DOMAINS[@]}"
log "INFO" "Paths testados por domínio: ${#PATHS[@]}"

# Verificar status de DNS público
log "INFO" "Verificando resolução DNS pública..."
has_dns=false
for domain in "api.public.dev.veloflux.io" "tenant1.public.dev.veloflux.io"; do
    dns_result=$(host $domain 2>/dev/null || echo "Falha na resolução")
    if [ "$dns_result" != "Falha na resolução" ]; then
        has_dns=true
        log "OK" "DNS resolvido para $domain: $dns_result"
    else
        log "WARN" "Falha na resolução DNS para $domain"
    fi
done

if ! $has_dns; then
    log "WARN" "DNS público ainda não está configurado ou propagado. Domínios *.public.dev.veloflux.io não estão resolvendo."
    log "INFO" "Para acesso externo, o DNS precisa resolver para o IP público: 187.61.220.77"
fi

# Recomendações
log "INFO" "======================"
log "INFO" "RECOMENDAÇÕES"
log "INFO" "======================"
log "INFO" "1. Verificar configuração de roteamento no config.yaml se algumas rotas não estão funcionando"
log "INFO" "2. Confirmar que o DNS público está configurado corretamente para os domínios *.public.dev.veloflux.io"
log "INFO" "3. Implementar conteúdo específico por tenant nos backends para melhor identificação"
log "INFO" "4. Configure o firewall do servidor para permitir acesso externo às portas 80 e 443"
log "INFO" "Verificação concluída!"
