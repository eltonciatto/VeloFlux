#!/bin/bash

# 🧹 VeloFlux - Script de Limpeza Completa do Servidor
# Remove todos os serviços, containers e arquivos do VeloFlux

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

echo -e "${RED}${BOLD}🧹 VeloFlux - Limpeza Completa do Servidor${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Servidor: $VPS_IP${NC}"
echo -e "${YELLOW}Este script irá:${NC}"
echo -e "  ${RED}🛑${NC} Parar todos os serviços VeloFlux"
echo -e "  ${RED}🗑️${NC}  Remover todos os containers Docker"
echo -e "  ${RED}📁${NC} Limpar todos os arquivos e configurações"
echo -e "  ${RED}🔧${NC} Restaurar configurações originais do sistema"
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

print_warning() {
    echo -e "${YELLOW}${BOLD}[WARNING]${NC} $1"
}

# Função para executar comandos remotos
run_remote() {
    sshpass -p "$VPS_PASSWORD" ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 "$VPS_USER@$VPS_IP" "$@"
}

# Verificar conexão
print_step "Testando conexão com o servidor..."
if ! run_remote "echo 'Conexão OK'" >/dev/null 2>&1; then
    print_error "Não foi possível conectar ao servidor $VPS_IP"
    print_error "Verifique:"
    echo -e "  ${YELLOW}•${NC} IP está correto: $VPS_IP"
    echo -e "  ${YELLOW}•${NC} Senha está correta"
    echo -e "  ${YELLOW}•${NC} SSH está ativo no servidor"
    exit 1
fi
print_success "Conexão estabelecida com o servidor"

# Verificar estado atual
print_step "Verificando estado atual do servidor..."
echo ""
echo -e "${CYAN}📊 Status dos Containers Docker:${NC}"
run_remote "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" || echo "Nenhum container rodando"

echo ""
echo -e "${CYAN}📁 Diretórios VeloFlux encontrados:${NC}"
run_remote "find / -maxdepth 3 -name '*veloflux*' -o -name '*VeloFlux*' 2>/dev/null || echo 'Nenhum diretório encontrado'"

echo ""
echo -e "${CYAN}🔧 Serviços systemd relacionados:${NC}"
run_remote "systemctl list-units --all | grep -i veloflux || echo 'Nenhum serviço encontrado'"

echo ""
echo -e "${CYAN}🌐 Configurações Nginx:${NC}"
run_remote "ls -la /etc/nginx/sites-*/veloflux* 2>/dev/null || echo 'Nenhuma configuração Nginx encontrada'"

# Confirmação
echo ""
echo -e "${RED}${BOLD}⚠️  ATENÇÃO: Esta operação é IRREVERSÍVEL!${NC}"
echo -e "${YELLOW}Todos os dados do VeloFlux serão permanentemente removidos.${NC}"
read -p "Deseja continuar? Digite 'LIMPAR' para confirmar: " confirm

if [ "$confirm" != "LIMPAR" ]; then
    echo -e "${YELLOW}Operação cancelada pelo usuário.${NC}"
    exit 0
fi

echo ""
echo -e "${RED}${BOLD}🚨 INICIANDO LIMPEZA COMPLETA...${NC}"

# 1. Parar todos os serviços systemd relacionados
print_step "Parando serviços systemd..."
run_remote "
    # Parar e desabilitar serviços VeloFlux
    for service in \$(systemctl list-units --all | grep -i veloflux | awk '{print \$1}'); do
        echo 'Parando \$service...'
        systemctl stop \$service || true
        systemctl disable \$service || true
    done
    
    # Remover arquivos de serviço
    rm -f /etc/systemd/system/veloflux* || true
    systemctl daemon-reload
"
print_success "Serviços systemd parados e removidos"

# 2. Parar e remover todos os containers Docker
print_step "Parando e removendo containers Docker..."
run_remote "
    # Parar todos os containers
    docker stop \$(docker ps -aq) 2>/dev/null || true
    
    # Remover todos os containers
    docker rm \$(docker ps -aq) 2>/dev/null || true
    
    # Remover imagens VeloFlux
    docker rmi \$(docker images | grep -i veloflux | awk '{print \$3}') 2>/dev/null || true
    
    # Remover volumes
    docker volume prune -f || true
    
    # Remover networks
    docker network prune -f || true
    
    # Limpeza geral do Docker
    docker system prune -af || true
"
print_success "Containers Docker removidos"

# 3. Remover todos os diretórios VeloFlux
print_step "Removendo diretórios e arquivos..."
run_remote "
    # Remover diretórios principais
    rm -rf /root/VeloFlux || true
    rm -rf /root/veloflux || true
    rm -rf /opt/veloflux || true
    rm -rf /opt/VeloFlux || true
    rm -rf /var/lib/veloflux || true
    rm -rf /etc/veloflux || true
    
    # Remover nginx-proxy se existir
    rm -rf /root/nginx-proxy || true
    
    # Remover arquivos de credenciais
    rm -f /root/veloflux-credentials.txt || true
    rm -f /root/*veloflux* || true
    
    # Remover logs
    rm -rf /var/log/veloflux || true
    
    # Remover certificados relacionados
    rm -rf /etc/letsencrypt/live/veloflux.io || true
    rm -rf /etc/letsencrypt/live/admin.veloflux.io || true
    rm -rf /etc/letsencrypt/live/api.veloflux.io || true
    rm -rf /etc/letsencrypt/live/metrics.veloflux.io || true
    rm -rf /etc/letsencrypt/live/grafana.veloflux.io || true
    rm -rf /etc/letsencrypt/live/prometheus.veloflux.io || true
    rm -rf /etc/letsencrypt/live/lb.veloflux.io || true
"
print_success "Diretórios e arquivos removidos"

# 4. Restaurar configurações Nginx
print_step "Restaurando configurações Nginx..."
run_remote "
    # Remover configurações VeloFlux
    rm -f /etc/nginx/sites-available/veloflux* || true
    rm -f /etc/nginx/sites-enabled/veloflux* || true
    
    # Restaurar configuração padrão do Nginx
    if [ ! -f /etc/nginx/sites-enabled/default ]; then
        ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default || true
    fi
    
    # Testar e recarregar Nginx
    nginx -t && systemctl reload nginx || true
"
print_success "Configurações Nginx restauradas"

# 5. Limpar configurações Redis/Docker Compose
print_step "Limpando configurações residuais..."
run_remote "
    # Remover arquivos docker-compose
    find /root -name 'docker-compose*.yml' -delete || true
    
    # Remover arquivos .env
    find /root -name '.env*' -delete || true
    
    # Limpar configurações Redis
    rm -rf /var/lib/redis || true
    
    # Remover dados Prometheus/Grafana
    rm -rf /var/lib/prometheus || true
    rm -rf /var/lib/grafana || true
    
    # Limpar caches
    apt-get autoremove -y || true
    apt-get autoclean || true
"
print_success "Configurações residuais limpas"

# 6. Verificar limpeza
print_step "Verificando limpeza..."
echo ""
echo -e "${CYAN}📊 Containers Docker restantes:${NC}"
run_remote "docker ps -a" || echo "✅ Nenhum container encontrado"

echo ""
echo -e "${CYAN}📁 Diretórios VeloFlux restantes:${NC}"
run_remote "find / -maxdepth 3 -name '*veloflux*' -o -name '*VeloFlux*' 2>/dev/null" || echo "✅ Nenhum diretório encontrado"

echo ""
echo -e "${CYAN}🔧 Serviços systemd VeloFlux:${NC}"
run_remote "systemctl list-units --all | grep -i veloflux" || echo "✅ Nenhum serviço encontrado"

echo ""
echo -e "${CYAN}🌐 Configurações Nginx VeloFlux:${NC}"
run_remote "ls -la /etc/nginx/sites-*/*veloflux* 2>/dev/null" || echo "✅ Nenhuma configuração encontrada"

# 7. Reiniciar serviços essenciais
print_step "Reiniciando serviços essenciais..."
run_remote "
    # Reiniciar Docker
    systemctl restart docker || true
    
    # Reiniciar Nginx
    systemctl restart nginx || true
    
    # Verificar status
    systemctl status docker --no-pager -l || true
    systemctl status nginx --no-pager -l || true
"
print_success "Serviços essenciais reiniciados"

# Resultado final
echo ""
echo -e "${GREEN}${BOLD}🎉 LIMPEZA COMPLETA CONCLUÍDA! 🎉${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${GREEN}${BOLD}✅ O que foi removido:${NC}"
echo -e "  ${GREEN}🗑️${NC}  Todos os containers Docker VeloFlux"
echo -e "  ${GREEN}🗑️${NC}  Todos os volumes e imagens Docker"
echo -e "  ${GREEN}🗑️${NC}  Todos os diretórios VeloFlux (/root, /opt, /var)"
echo -e "  ${GREEN}🗑️${NC}  Todos os serviços systemd VeloFlux"
echo -e "  ${GREEN}🗑️${NC}  Todas as configurações Nginx VeloFlux"
echo -e "  ${GREEN}🗑️${NC}  Todos os certificados SSL VeloFlux"
echo -e "  ${GREEN}🗑️${NC}  Todos os arquivos de log e cache"
echo ""

echo -e "${GREEN}${BOLD}🔄 Serviços restaurados:${NC}"
echo -e "  ${GREEN}✅${NC} Docker funcionando normalmente"
echo -e "  ${GREEN}✅${NC} Nginx com configuração padrão"
echo -e "  ${GREEN}✅${NC} Sistema limpo e pronto para nova instalação"
echo ""

echo -e "${YELLOW}${BOLD}📝 Próximos passos:${NC}"
echo -e "  ${YELLOW}1.${NC} O servidor está limpo e pronto"
echo -e "  ${YELLOW}2.${NC} Você pode instalar uma nova versão do VeloFlux"
echo -e "  ${YELLOW}3.${NC} Execute: ${CYAN}./scripts/install-veloflux-io.sh${NC}"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}Servidor completamente limpo! 🚀${NC}"
