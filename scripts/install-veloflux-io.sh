#!/bin/bash

# 🚀 VeloFlux SaaS - Instalação Direta para veloflux.io
# Script corrigido com repositório GitHub correto

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

# Configuration
DOMAIN="veloflux.io"
EMAIL="admin@veloflux.io"
GITHUB_REPO="https://github.com/eltonciatto/VeloFlux.git"

echo -e "${PURPLE}${BOLD}🚀 VeloFlux SaaS - Production Installation for veloflux.io${NC}"
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

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "Este script deve ser executado como root"
   print_info "Execute: sudo su - e depois rode o script"
   exit 1
fi

print_step "Iniciando instalação de produção do VeloFlux SaaS..."
print_info "Domínio: $DOMAIN"
print_info "Email: $EMAIL"
print_info "Repositório: $GITHUB_REPO"

# Update system
print_step "Atualizando sistema Ubuntu 24..."
apt update && apt upgrade -y
print_success "Sistema atualizado"

# Install essential packages
print_step "Instalando pacotes essenciais..."
apt install -y curl wget git openssl ufw nginx certbot python3-certbot-nginx
print_success "Pacotes essenciais instalados"

# Install Docker
print_step "Instalando Docker..."
if ! command -v docker >/dev/null 2>&1; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    usermod -aG docker root
    systemctl enable docker
    systemctl start docker
    rm get-docker.sh
    print_success "Docker instalado"
else
    print_info "Docker já está instalado"
fi

# Install Docker Compose
print_step "Instalando Docker Compose..."
if ! command -v docker-compose >/dev/null 2>&1; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose instalado"
else
    print_info "Docker Compose já está instalado"
fi

# Install Node.js
print_step "Instalando Node.js..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
    print_success "Node.js instalado"
else
    print_info "Node.js já está instalado"
fi

# Install Go
print_step "Instalando Go..."
if ! command -v go >/dev/null 2>&1; then
    wget https://golang.org/dl/go1.21.0.linux-amd64.tar.gz
    rm -rf /usr/local/go && tar -C /usr/local -xzf go1.21.0.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /root/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    rm go1.21.0.linux-amd64.tar.gz
    print_success "Go instalado"
else
    print_info "Go já está instalado"
fi

# Clone VeloFlux repository
print_step "Clonando repositório VeloFlux..."
cd /opt
if [ -d "veloflux" ]; then
    rm -rf veloflux
fi
git clone $GITHUB_REPO veloflux
cd veloflux
print_success "Repositório clonado"

# Configure environment
print_step "Configurando ambiente..."
ADMIN_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
JWT_SECRET=$(openssl rand -base64 64)
REDIS_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
POSTGRES_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

cat > .env << EOF
# VeloFlux Production Environment
NODE_ENV=production
VF_DOMAIN=$DOMAIN
VF_ADMIN_USER=admin
VF_ADMIN_PASS=$ADMIN_PASS
VF_JWT_SECRET=$JWT_SECRET
VF_SSL_ENABLED=true
VF_SSL_EMAIL=$EMAIL

# Database Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$REDIS_PASS
POSTGRES_URL=postgresql://veloflux:$POSTGRES_PASS@localhost:5432/veloflux
POSTGRES_PASSWORD=$POSTGRES_PASS

# Production settings
VF_MONITORING_ENABLED=true
VF_BACKUP_ENABLED=true
GRAFANA_PASSWORD=$ADMIN_PASS
EOF

print_success "Ambiente configurado"

# Build frontend
print_step "Construindo frontend..."
npm install
npm run build
print_success "Frontend construído"

# Build backend
print_step "Construindo backend Go..."
export PATH=$PATH:/usr/local/go/bin
cd cmd/velofluxlb
go mod tidy
go build -o /opt/veloflux/veloflux-lb .
cd /opt/veloflux
chmod +x veloflux-lb
print_success "Backend construído"

# Configure systemd service
print_step "Configurando serviço systemd..."
cat > /etc/systemd/system/veloflux.service << EOF
[Unit]
Description=VeloFlux Load Balancer SaaS
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/veloflux
ExecStartPre=/usr/bin/docker-compose up -d redis postgres
ExecStart=/opt/veloflux/veloflux-lb
Restart=always
RestartSec=5
Environment=VFX_CONFIG=/opt/veloflux/config/config.yaml

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable veloflux
print_success "Serviço systemd configurado"

# Setup Nginx reverse proxy
print_step "Configurando Nginx..."
cat > /etc/nginx/sites-available/veloflux << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api {
        proxy_pass http://localhost:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /metrics {
        proxy_pass http://localhost:8080/metrics;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
EOF

ln -sf /etc/nginx/sites-available/veloflux /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl reload nginx
print_success "Nginx configurado"

# Configure firewall
print_step "Configurando firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw allow 3000  # Grafana
print_success "Firewall configurado"

# Setup SSL with Let's Encrypt
print_step "Configurando SSL com Let's Encrypt..."
certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email $EMAIL
print_success "SSL configurado"

# Start Docker services
print_step "Iniciando serviços Docker..."
docker-compose up -d redis postgres grafana prometheus
print_success "Serviços Docker iniciados"

# Start VeloFlux service
print_step "Iniciando VeloFlux..."
systemctl start veloflux
sleep 5
print_success "VeloFlux iniciado"

# Health check
print_step "Verificando saúde dos serviços..."
sleep 10

# Test services
if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    print_success "✓ VeloFlux Load Balancer está funcionando"
else
    print_error "✗ VeloFlux Load Balancer não está respondendo"
fi

if systemctl is-active --quiet veloflux; then
    print_success "✓ Serviço VeloFlux está ativo"
else
    print_error "✗ Serviço VeloFlux não está ativo"
fi

if curl -f https://$DOMAIN >/dev/null 2>&1; then
    print_success "✓ HTTPS está funcionando"
else
    print_error "✗ HTTPS não está funcionando"
fi

# Show final information
echo ""
echo -e "${GREEN}${BOLD}🎉 VeloFlux SaaS Instalado com Sucesso! 🎉${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

echo -e "${YELLOW}${BOLD}🌐 URLs de Acesso:${NC}"
echo -e "  ${GREEN}🚀 Site Principal:${NC}     https://$DOMAIN"
echo -e "  ${GREEN}📊 Admin Panel:${NC}       https://$DOMAIN/api"
echo -e "  ${GREEN}📈 Metrics:${NC}           https://$DOMAIN/metrics"
echo -e "  ${GREEN}📉 Grafana:${NC}           http://$(curl -s ipinfo.io/ip):3000"
echo ""

echo -e "${YELLOW}${BOLD}🔐 Credenciais:${NC}"
echo -e "  ${GREEN}👤 Admin User:${NC}        admin"
echo -e "  ${GREEN}🔑 Admin Password:${NC}    $ADMIN_PASS"
echo -e "  ${GREEN}📉 Grafana Password:${NC}  $ADMIN_PASS"
echo ""

echo -e "${YELLOW}${BOLD}🔧 Comandos de Gerenciamento:${NC}"
echo -e "  ${CYAN}📊 Ver logs:${NC}              journalctl -u veloflux -f"
echo -e "  ${CYAN}🔄 Reiniciar:${NC}             systemctl restart veloflux"
echo -e "  ${CYAN}⏹️  Parar:${NC}                 systemctl stop veloflux"
echo -e "  ${CYAN}📈 Status:${NC}                systemctl status veloflux"
echo -e "  ${CYAN}🐳 Docker Status:${NC}         docker-compose ps"
echo ""

echo -e "${YELLOW}${BOLD}📁 Arquivos Importantes:${NC}"
echo -e "  ${CYAN}📂 Projeto:${NC}              /opt/veloflux"
echo -e "  ${CYAN}⚙️  Configuração:${NC}         /opt/veloflux/.env"
echo -e "  ${CYAN}🌐 Nginx:${NC}                /etc/nginx/sites-available/veloflux"
echo -e "  ${CYAN}🔧 Serviço:${NC}              /etc/systemd/system/veloflux.service"
echo ""

echo -e "${GREEN}${BOLD}✨ Próximos Passos:${NC}"
echo -e "  ${YELLOW}1.${NC} Acesse https://$DOMAIN para ver o site"
echo -e "  ${YELLOW}2.${NC} Faça login no admin panel com as credenciais acima"
echo -e "  ${YELLOW}3.${NC} Configure seus servidores backend"
echo -e "  ${YELLOW}4.${NC} Monitore via Grafana"
echo -e "  ${YELLOW}5.${NC} Configure alertas e backups"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}VeloFlux SaaS está agora rodando em produção! 🚀${NC}"

# Save credentials to file
cat > /root/veloflux-credentials.txt << EOF
VeloFlux SaaS - Credenciais de Acesso
=====================================
Site Principal: https://$DOMAIN
Admin Panel: https://$DOMAIN/api
Grafana: http://$(curl -s ipinfo.io/ip):3000

Admin User: admin
Admin Password: $ADMIN_PASS
Grafana Password: $ADMIN_PASS

Instalado em: $(date)
=====================================
EOF

print_info "Credenciais salvas em: /root/veloflux-credentials.txt"
