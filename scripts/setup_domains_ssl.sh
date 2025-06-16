#!/bin/bash

# Script para configurar SSL e testar os domínios no VeloFlux
# Este script configura certificados SSL para os domínios e testa a conectividade

LOG_FILE="/tmp/veloflux_domain_setup_$(date +%Y%m%d_%H%M%S).log"

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}   " ;;
        "ERROR") prefix="${RED}[ERROR]${NC}  " ;;
        "WARN")  prefix="${YELLOW}[WARN]${NC}   " ;;
        "OK")    prefix="${GREEN}[OK]${NC}     " ;;
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

# Domínios a serem testados
declare -A DOMAINS=(
    ["public.dev.veloflux.io"]="/public"
    ["tenant1.public.dev.veloflux.io"]="/"
    ["tenant2.public.dev.veloflux.io"]="/"
    ["api.public.dev.veloflux.io"]="/api"
    ["admin.public.dev.veloflux.io"]="/admin"
)

# IP do servidor
SERVER_IP="74.249.85.193"

log "INFO" "Iniciando configuração e teste de domínios do VeloFlux"
log "INFO" "Log salvo em: ${LOG_FILE}"

# Verificar se o docker-compose está rodando
log "INFO" "Verificando se o VeloFlux está rodando..."
if docker ps | grep -q "veloflux-lb"; then
    log "OK" "VeloFlux está rodando"
else
    log "WARN" "VeloFlux não parece estar rodando, tentando iniciar..."
    docker-compose down
    docker-compose up -d
    sleep 5
    
    if docker ps | grep -q "veloflux-lb"; then
        log "OK" "VeloFlux iniciado com sucesso"
    else
        log "ERROR" "Falha ao iniciar o VeloFlux"
        exit 1
    fi
fi

# Reinstalar os backends com as páginas personalizadas
log "INFO" "Reiniciando backends para aplicar configurações..."
docker-compose restart backend-1 backend-2
sleep 5

# Testar domínios
log "INFO" "Testando resolução DNS e conectividade..."
for domain in "${!DOMAINS[@]}"; do
    path=${DOMAINS[$domain]}
    
    # Testar resolução DNS
    log "INFO" "Testando DNS para ${domain}..."
    dns_result=$(dig +short ${domain} 2>/dev/null || echo "Falha")
    
    if [[ "$dns_result" == "$SERVER_IP" ]]; then
        log "OK" "DNS para ${domain} resolve para ${SERVER_IP}"
    else
        log "WARN" "DNS para ${domain} não resolve para ${SERVER_IP} (resultado: ${dns_result})"
    fi
    
    # Testar conexão HTTP
    log "INFO" "Testando acesso HTTP para ${domain}..."
    http_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 -H "Host: ${domain}" http://localhost:80${path} || echo "Falha")
    
    if [[ "$http_status" == "200" ]]; then
        log "OK" "Conexão HTTP para ${domain} retornou status 200 OK"
    elif [[ "$http_status" =~ ^[23].. ]]; then
        log "OK" "Conexão HTTP para ${domain} retornou status ${http_status}"
    else
        log "WARN" "Conexão HTTP para ${domain} falhou ou retornou status inesperado: ${http_status}"
    fi
    
    # Se pudermos acessar diretamente pelo domínio
    log "INFO" "Testando acesso direto para ${domain}..."
    direct_status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 http://${domain}${path} || echo "Falha")
    
    if [[ "$direct_status" == "200" ]]; then
        log "OK" "Acesso direto para ${domain} retornou status 200 OK"
    elif [[ "$direct_status" =~ ^[23].. ]]; then
        log "OK" "Acesso direto para ${domain} retornou status ${direct_status}"
    else
        log "WARN" "Acesso direto para ${domain} falhou ou retornou status inesperado: ${direct_status}"
    fi
done

# Configurar SSL
log "INFO" "Configurando SSL para os domínios..."
log "INFO" "Criando diretório para certificados..."
mkdir -p /workspaces/VeloFlux/certs

# Em um ambiente real, aqui seria onde você geraria certificados reais
# com Let's Encrypt ou outro provedor. Para ambiente de teste, vamos
# apenas informar os passos necessários.
log "INFO" "Em um ambiente de produção, você usaria:"
log "INFO" "1. Certbot: certbot certonly --webroot -w /var/www/html -d ${domain}"
log "INFO" "2. Ou a funcionalidade auto_cert do VeloFlux (já configurada no config.yaml)"

# Verificar se a configuração TLS está correta
log "INFO" "Verificando configuração TLS no config.yaml..."
if grep -q "auto_cert: true" /workspaces/VeloFlux/config/config.yaml; then
    log "OK" "auto_cert está habilitado no config.yaml"
else
    log "WARN" "auto_cert não está habilitado no config.yaml"
fi

# Reiniciar VeloFlux para aplicar alterações
log "INFO" "Reiniciando VeloFlux para aplicar alterações..."
docker-compose restart veloflux-lb
sleep 5

log "INFO" "Configuração e testes concluídos"
log "INFO" "Para testar manualmente:"

for domain in "${!DOMAINS[@]}"; do
    path=${DOMAINS[$domain]}
    log "INFO" "curl -H 'Host: ${domain}' http://localhost:80${path}"
    log "INFO" "curl http://${domain}${path}"
done

log "INFO" "Para verificar logs: docker-compose logs -f veloflux-lb"
