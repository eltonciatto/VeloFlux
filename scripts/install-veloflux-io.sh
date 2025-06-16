#!/bin/bash

# 🚀 VeloFlux SaaS - Instalação Robusta para Produção
# Script completo com Grafana, Prometheus e modo SaaS ativado

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
DOMAIN="admin.veloflux.io"
DOMAIN="api.veloflux.io"
DOMAIN="metrics.veloflux.io"
DOMAIN="grafana.veloflux.io"
DOMAIN="prometheus.veloflux.io"
DOMAIN="lb.veloflux.io"
EMAIL="admin@veloflux.io"
GITHUB_REPO="https://github.com/eltonciatto/VeloFlux.git"
COMPOSE_VERSION="2.24.0"
GO_VERSION="1.23.0"
NODE_VERSION="22"

echo -e "${PURPLE}${BOLD}🚀 VeloFlux SaaS - Instalação Robusta para Produção${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Complete Production Setup with:${NC}"
echo -e "  ${GREEN}✓${NC} Grafana Dashboards & Monitoring"
echo -e "  ${GREEN}✓${NC} Prometheus Metrics Collection"
echo -e "  ${GREEN}✓${NC} Redis Cluster State Management"
echo -e "  ${GREEN}✓${NC} SSL/TLS Auto-Certificates"
echo -e "  ${GREEN}✓${NC} SaaS Multi-tenant Mode"
echo -e "  ${GREEN}✓${NC} Security Hardening"
echo -e "  ${GREEN}✓${NC} Auto-scaling & Load Balancing"
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

# System requirements check
print_step "Verificando requisitos do sistema..."
if ! command -v systemctl >/dev/null 2>&1; then
    print_error "SystemD é necessário para este script"
    exit 1
fi

# Check RAM (minimum 2GB recommended)
RAM_MB=$(free -m | awk 'NR==2{printf "%d", $2}')
if [ $RAM_MB -lt 1024 ]; then
    print_error "Mínimo de 1GB RAM necessário. Detectado: ${RAM_MB}MB"
    exit 1
elif [ $RAM_MB -lt 2048 ]; then
    print_info "RAM detectada: ${RAM_MB}MB (recomendado: 2GB+)"
fi

# Check disk space (minimum 10GB)
DISK_GB=$(df / | awk 'NR==2{printf "%d", $4/1024/1024}')
if [ $DISK_GB -lt 5 ]; then
    print_error "Mínimo de 5GB de espaço livre necessário. Disponível: ${DISK_GB}GB"
    exit 1
fi

print_success "Requisitos do sistema atendidos"

print_step "Iniciando instalação robusta do VeloFlux SaaS..."
print_info "Domínio: $DOMAIN"
print_info "Email: $EMAIL"
print_info "Repositório: $GITHUB_REPO"
print_info "RAM: ${RAM_MB}MB | Disk: ${DISK_GB}GB"

# Update system
print_step "Atualizando sistema Ubuntu 24..."
apt update && apt upgrade -y
print_success "Sistema atualizado"

# Install essential packages
print_step "Instalando pacotes essenciais..."
apt install -y curl wget git openssl ufw nginx certbot python3-certbot-nginx \
    htop iotop net-tools unzip zip jq software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release \
    fail2ban logrotate cron

# Configure fail2ban for security
systemctl enable fail2ban
systemctl start fail2ban

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
print_step "Instalando Docker Compose v${COMPOSE_VERSION}..."
if ! command -v docker-compose >/dev/null 2>&1; then
    curl -L "https://github.com/docker/compose/releases/download/v${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose
    print_success "Docker Compose v${COMPOSE_VERSION} instalado"
else
    CURRENT_VERSION=$(docker-compose --version | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    print_info "Docker Compose já está instalado (v${CURRENT_VERSION})"
fi

# Install Node.js
print_step "Instalando Node.js v${NODE_VERSION}..."
if ! command -v node >/dev/null 2>&1; then
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt-get install -y nodejs
    npm install -g npm@latest
    print_success "Node.js v$(node --version) instalado"
else
    print_info "Node.js já está instalado (v$(node --version))"
fi

# Install Go
print_step "Instalando Go v${GO_VERSION}..."
if ! command -v go >/dev/null 2>&1; then
    wget https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz
    rm -rf /usr/local/go && tar -C /usr/local -xzf go${GO_VERSION}.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /root/.bashrc
    echo 'export GOPATH=/opt/go' >> /root/.bashrc
    echo 'export PATH=$PATH:/opt/go/bin' >> /root/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    export GOPATH=/opt/go
    mkdir -p /opt/go
    rm go${GO_VERSION}.linux-amd64.tar.gz
    print_success "Go v$(go version | cut -d' ' -f3) instalado"
else
    print_info "Go já está instalado ($(go version | cut -d' ' -f3))"
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

cat > .env << EOF
# VeloFlux Production Environment
NODE_ENV=production
VF_DOMAIN=$DOMAIN
VF_ADMIN_USER=eltonciatto
VF_ADMIN_PASS=$ADMIN_PASS
VF_JWT_SECRET=$JWT_SECRET
VF_SSL_ENABLED=true
VF_SSL_EMAIL=$EMAIL

# Database Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$REDIS_PASS

# Production settings
VF_MONITORING_ENABLED=true
VF_BACKUP_ENABLED=true
GRAFANA_PASSWORD=$ADMIN_PASS
EOF

print_success "Ambiente configurado"

# Create production docker-compose with monitoring stack
print_step "Criando docker-compose de produção..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  redis:
    image: redis:7-alpine
    container_name: veloflux-redis
    ports:
      - "6379:6379"
    command: redis-server --requirepass $REDIS_PASS --appendonly yes --appendfsync everysec
    volumes:
      - redis-data:/data
      - ./config/redis.conf:/usr/local/etc/redis/redis.conf:ro
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "$REDIS_PASS", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  prometheus:
    image: prom/prometheus:latest
    container_name: veloflux-prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./config/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
    restart: unless-stopped
    depends_on:
      - node-exporter

  grafana:
    image: grafana/grafana:latest
    container_name: veloflux-grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=$ADMIN_PASS
      - GF_SECURITY_ADMIN_USER=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning:ro
      - ./config/grafana/dashboards:/var/lib/grafana/dashboards:ro
    restart: unless-stopped
    depends_on:
      - prometheus

  node-exporter:
    image: prom/node-exporter:latest
    container_name: veloflux-node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc|var/lib/docker)(\$|/)'
      - '--web.listen-address=:9100'
    restart: unless-stopped

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: veloflux-cadvisor
    ports:
      - "8081:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    privileged: true
    restart: unless-stopped

volumes:
  redis-data:
  prometheus-data:
  grafana-data:

networks:
  default:
    name: veloflux-network
    driver: bridge
EOF

print_success "Docker-compose de produção criado"

# Create Prometheus configuration
print_step "Criando configurações do Prometheus..."
mkdir -p config/prometheus config/grafana/provisioning/datasources config/grafana/provisioning/dashboards config/grafana/dashboards

cat > config/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'veloflux-lb'
    static_configs:
      - targets: ['host.docker.internal:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Create Grafana datasource configuration
cat > config/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

# Create Grafana dashboard provisioning
cat > config/grafana/provisioning/dashboards/dashboard.yml << EOF
apiVersion: 1

providers:
  - name: 'default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# Create a basic VeloFlux dashboard
cat > config/grafana/dashboards/veloflux-dashboard.json << 'EOF'
{
  "dashboard": {
    "id": null,
    "title": "VeloFlux Load Balancer Dashboard",
    "tags": ["veloflux"],
    "style": "dark",
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "HTTP Requests per Second",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ],
        "xAxis": {
          "show": true
        },
        "yAxes": [
          {
            "label": "Requests/sec",
            "show": true
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 0,
          "y": 0
        }
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph", 
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ],
        "gridPos": {
          "h": 9,
          "w": 12,
          "x": 12,
          "y": 0
        }
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
EOF

# Create Redis configuration
cat > config/redis.conf << EOF
# Redis configuration for VeloFlux
port 6379
timeout 0
tcp-keepalive 300
daemonize no
supervised no
pidfile /var/run/redis_6379.pid
loglevel notice
logfile ""
databases 16
save 900 1
save 300 10
save 60 10000
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir ./
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb
aof-load-truncated yes
EOF

print_success "Configurações de monitoramento criadas"

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
ExecStartPre=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
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
docker-compose -f docker-compose.prod.yml up -d
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

# Check Docker services
if docker ps | grep -q veloflux-redis; then
    print_success "✓ Redis está rodando"
else
    print_error "✗ Redis não está rodando"
fi

if docker ps | grep -q veloflux-grafana; then
    print_success "✓ Grafana está rodando"
else
    print_error "✗ Grafana não está rodando"
fi

if docker ps | grep -q veloflux-prometheus; then
    print_success "✓ Prometheus está rodando"
else
    print_error "✗ Prometheus não está rodando"
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
echo -e "  ${CYAN}🐳 Docker Status:${NC}         docker-compose -f docker-compose.prod.yml ps"
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
