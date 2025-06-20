#!/bin/bash

# 🚀 VeloFlux SaaS - Instalação Remota Completa
# Este script instala o VeloFlux no servidor remoto via SSH

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Server Configuration
VPS_IP="190.93.119.61"
VPS_USER="root"
VPS_PASSWORD="LMbbL1u8ii"

echo -e "${PURPLE}${BOLD}🚀 VeloFlux SaaS - Instalação Remota Completa${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Servidor: $VPS_IP${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo -e "  ${GREEN}📦${NC} Instalar todas as dependências necessárias"
echo -e "  ${GREEN}🚀${NC} Fazer deploy completo do VeloFlux SaaS"
echo -e "  ${GREEN}🔒${NC} Configurar SSL automático"
echo -e "  ${GREEN}📊${NC} Configurar monitoramento completo"
echo -e "  ${GREEN}🌐${NC} Configurar todos os subdomínios"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

print_step() {
    echo -e "${BLUE}${BOLD}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}[ERROR]${NC} $1"
}

# Função para executar comandos remotos
run_remote() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=30 "$VPS_USER@$VPS_IP" "$@"
}

# Função para copiar arquivos
copy_file() {
    sshpass -p "$VPS_PASSWORD" scp -o StrictHostKeyChecking=no "$1" "$VPS_USER@$VPS_IP:$2"
}

# Verificar conexão
print_step "Testando conexão com o servidor..."
if ! run_remote "echo 'Conexão OK'" >/dev/null 2>&1; then
    print_error "Não foi possível conectar ao servidor $VPS_IP"
    exit 1
fi
print_success "Conexão estabelecida com o servidor"

# Copiar script de instalação para o servidor
print_step "Enviando script de instalação para o servidor..."
copy_file "scripts/install-veloflux-io.sh" "/tmp/install-veloflux-io.sh"
run_remote "chmod +x /tmp/install-veloflux-io.sh"
print_success "Script enviado para o servidor"

# Executar instalação no servidor
print_step "Executando instalação no servidor..."
echo -e "${YELLOW}Aguarde... Este processo pode levar de 10-20 minutos${NC}"

run_remote "cd /tmp && ./install-veloflux-io.sh" || {
    print_error "Erro durante a instalação"
    print_step "Verificando logs de erro..."
    run_remote "tail -50 /tmp/veloflux-install.log 2>/dev/null || echo 'Log não encontrado'"
    exit 1
}

print_success "Instalação concluída com sucesso!"

# Verificar status dos serviços
print_step "Verificando status dos serviços instalados..."
echo ""
echo -e "${CYAN}📊 Status dos Containers:${NC}"
run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"

echo ""
echo -e "${CYAN}🔧 Status do Serviço VeloFlux:${NC}"
run_remote "systemctl status veloflux --no-pager -l | head -10"

echo ""
echo -e "${CYAN}🌐 Testando Endpoints:${NC}"
run_remote "curl -I http://localhost:80 2>/dev/null | head -3 || echo 'Load Balancer não respondeu'"
run_remote "curl -I http://localhost:8080/metrics 2>/dev/null | head -3 || echo 'Métricas não responderam'"
run_remote "curl -I http://localhost:9000/api/health 2>/dev/null | head -3 || echo 'API não respondeu'"

# Obter credenciais
print_step "Obtendo credenciais de acesso..."
echo ""
echo -e "${GREEN}${BOLD}📋 CREDENCIAIS DE ACESSO:${NC}"
run_remote "cat /root/veloflux-credentials.txt 2>/dev/null || echo 'Arquivo de credenciais não encontrado'"

# Resultado final
echo ""
echo -e "${GREEN}${BOLD}🎉 INSTALAÇÃO REMOTA CONCLUÍDA! 🎉${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}${BOLD}🌐 URLs de Acesso (após configurar DNS):${NC}"
echo -e "  ${GREEN}🚀 Load Balancer:${NC}      https://veloflux.io"
echo -e "  ${GREEN}👤 Admin Panel:${NC}        https://admin.veloflux.io"
echo -e "  ${GREEN}🔌 API:${NC}                https://api.veloflux.io"
echo -e "  ${GREEN}📈 Metrics:${NC}            https://metrics.veloflux.io"
echo -e "  ${GREEN}📊 Grafana:${NC}            https://grafana.veloflux.io"
echo -e "  ${GREEN}🎯 Prometheus:${NC}         https://prometheus.veloflux.io"
echo ""

echo -e "${YELLOW}${BOLD}📝 Próximos passos:${NC}"
echo -e "  ${YELLOW}1.${NC} Configure os DNS dos domínios para apontar para $VPS_IP"
echo -e "  ${YELLOW}2.${NC} Aguarde a propagação do DNS (pode levar até 24h)"
echo -e "  ${YELLOW}3.${NC} Acesse as URLs acima para verificar funcionamento"
echo -e "  ${YELLOW}4.${NC} Configure backends via API ou admin panel"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}VeloFlux SaaS instalado com sucesso em $VPS_IP! 🚀${NC}"
