#!/bin/bash

# Script para configurar e testar portas de produção VeloFlux
# Usando domínios wildcard corretos

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para log colorido
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Detectar IP público atual
PUBLIC_IP=$(curl -s ifconfig.me || curl -s icanhazip.com || echo "UNKNOWN")

echo "=== Configuração de Produção VeloFlux ==="
echo "Data: $(date)"
echo "IP Público detectado: $PUBLIC_IP"
echo

# Domínios de teste corretos
ADMIN_DOMAIN="admin.public.dev.veloflux.io"
LANDING_DOMAIN="landing.public.dev.veloflux.io"
API_DOMAIN="api.public.dev.veloflux.io"

log_info "Domínios configurados:"
echo "  - Admin Panel: https://$ADMIN_DOMAIN"
echo "  - Landing Page: https://$LANDING_DOMAIN"
echo "  - API: https://$API_DOMAIN"
echo

# Verificar se IP público mudou
if [ "$PUBLIC_IP" != "74.249.85.198" ]; then
    log_warning "IP público mudou de 74.249.85.198 para $PUBLIC_IP"
    log_warning "Você precisa atualizar os registros DNS para *.public.dev.veloflux.io"
fi

# Verificar portas em uso
log_info "Verificando portas em uso..."

check_port() {
    local port=$1
    local service=$2
    
    if netstat -tulpn 2>/dev/null | grep ":$port " > /dev/null; then
        log_warning "Porta $port ($service) está em uso:"
        netstat -tulpn 2>/dev/null | grep ":$port " | head -3
    else
        log_success "Porta $port ($service) está livre"
    fi
}

check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 8080 "Admin Panel"
check_port 3000 "Landing Page"
check_port 9090 "Prometheus"
check_port 3001 "Grafana"

echo

# Verificar containers Docker em execução
log_info "Verificando containers Docker em execução..."
if docker ps | grep -q veloflux; then
    log_warning "Containers VeloFlux já estão em execução:"
    docker ps | grep veloflux
    echo
    log_info "Deseja parar os containers existentes? (y/n)"
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        log_info "Parando containers existentes..."
        docker-compose -f docker-compose.production.yml down
        log_success "Containers parados"
    fi
else
    log_success "Nenhum container VeloFlux em execução"
fi

echo

# Verificar configuração do docker-compose.production.yml
log_info "Verificando configuração do docker-compose.production.yml..."

if [ ! -f "docker-compose.production.yml" ]; then
    log_error "Arquivo docker-compose.production.yml não encontrado!"
    exit 1
fi

# Verificar se as variáveis de ambiente necessárias estão definidas
log_info "Verificando variáveis de ambiente..."

ENV_VARS=(
    "ADMIN_DOMAIN"
    "LANDING_DOMAIN" 
    "API_DOMAIN"
    "PUBLIC_IP"
)

for var in "${ENV_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        log_warning "Variável $var não está definida, definindo agora..."
        export $var="${!var}"
    fi
done

# Exportar variáveis para uso nos containers
export ADMIN_DOMAIN
export LANDING_DOMAIN
export API_DOMAIN
export PUBLIC_IP

log_success "Variáveis de ambiente configuradas"

# Testar conectividade DNS
log_info "Testando resolução DNS..."

test_dns() {
    local domain=$1
    local expected_ip=$2
    
    resolved_ip=$(nslookup $domain 2>/dev/null | grep "Address:" | tail -1 | awk '{print $2}' || echo "FAILED")
    
    if [ "$resolved_ip" = "$expected_ip" ]; then
        log_success "DNS OK: $domain -> $resolved_ip"
    else
        log_warning "DNS: $domain resolve para $resolved_ip (esperado: $expected_ip)"
    fi
}

test_dns "$ADMIN_DOMAIN" "$PUBLIC_IP"
test_dns "$LANDING_DOMAIN" "$PUBLIC_IP"
test_dns "$API_DOMAIN" "$PUBLIC_IP"

echo

# Verificar certificados SSL (se existirem)
log_info "Verificando certificados SSL..."

CERT_DIR="./config/ssl"
if [ -d "$CERT_DIR" ]; then
    for domain in "$ADMIN_DOMAIN" "$LANDING_DOMAIN" "$API_DOMAIN"; do
        cert_file="$CERT_DIR/${domain}.crt"
        if [ -f "$cert_file" ]; then
            expiry=$(openssl x509 -in "$cert_file" -noout -enddate 2>/dev/null | cut -d= -f2)
            log_info "Certificado para $domain expira em: $expiry"
        else
            log_warning "Certificado não encontrado para $domain"
        fi
    done
else
    log_warning "Diretório de certificados SSL não encontrado: $CERT_DIR"
fi

echo

# Resumo da configuração
log_info "=== RESUMO DA CONFIGURAÇÃO ==="
echo "IP Público: $PUBLIC_IP"
echo "Admin Panel: https://$ADMIN_DOMAIN (porta 8080)"
echo "Landing Page: https://$LANDING_DOMAIN (porta 3000)"
echo "API: https://$API_DOMAIN (porta 80/443)"
echo
echo "Para iniciar os serviços, execute:"
echo "  docker-compose -f docker-compose.production.yml up -d"
echo
echo "Para monitorar os logs:"
echo "  docker-compose -f docker-compose.production.yml logs -f"
echo

log_success "Configuração completa!"
