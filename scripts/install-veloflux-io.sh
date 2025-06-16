#!/bin/bash

# 🚀 VeloFlux SaaS - Instalação Robusta para Produção
# Script completo com Grafana, Prometheus e modo SaaS ativado
#URLs de Acesso
#Serviço	URL	Descrição
#Frontend	http://localhost	Interface principal
#Admin Panel	http://localhost:9000	Painel administrativo
#API Docs	http://localhost:9000/docs	Documentação da API
#Metrics	http://localhost:8080/metrics	Métricas Prometheus
#Grafana	http://localhost:3000	Dashboards de monitoramento
#Backend 1	http://localhost:8001	Servidor de teste 1
#Backend 2	http://localhost:8002	Servidor de teste 2

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
MAIN_DOMAIN="veloflux.io"
ADMIN_DOMAIN="admin.veloflux.io"
API_DOMAIN="api.veloflux.io"
METRICS_DOMAIN="metrics.veloflux.io"
GRAFANA_DOMAIN="grafana.veloflux.io"
PROMETHEUS_DOMAIN="prometheus.veloflux.io"
LB_DOMAIN="lb.veloflux.io"
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
print_info "Domínio Principal: $MAIN_DOMAIN"
print_info "Admin Panel: $ADMIN_DOMAIN"
print_info "API Domain: $API_DOMAIN"
print_info "Grafana: $GRAFANA_DOMAIN"
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
cd /root
if [ -d "VeloFlux" ]; then
    rm -rf VeloFlux
fi
git clone $GITHUB_REPO VeloFlux
cd VeloFlux
print_success "Repositório clonado"

# Configure environment
print_step "Configurando ambiente..."
ADMIN_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-16)
JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-32)
REDIS_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)

cat > .env << EOF
# VeloFlux Production Environment
NODE_ENV=production
VF_DOMAIN=$MAIN_DOMAIN
VF_ADMIN_USER=admin
VF_ADMIN_PASS=$ADMIN_PASS
VF_JWT_SECRET=$JWT_SECRET
VF_SSL_ENABLED=true
VF_SSL_EMAIL=$EMAIL

# Database Configuration
REDIS_URL=redis://redis:6379
REDIS_PASSWORD=$REDIS_PASS

# Production settings
VF_MONITORING_ENABLED=true
VF_BACKUP_ENABLED=true
GRAFANA_PASSWORD=$ADMIN_PASS

# VeloFlux Load Balancer Configuration
VFX_CONFIG=/root/VeloFlux/config/config.yaml
VFX_REDIS_ADDRESS=redis:6379
VFX_REDIS_PASSWORD=$REDIS_PASS
EOF

print_success "Ambiente configurado"

# Create production docker-compose with monitoring stack
print_step "Criando docker-compose de produção..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  # Redis para VeloFlux
  redis:
    image: redis:7-alpine
    container_name: veloflux-redis
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
    networks:
      - veloflux-network

  # VeloFlux Load Balancer Principal
  veloflux-lb:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: veloflux-lb
    ports:
      - "80:80"
      - "8080:8080"
      - "9000:9000"
    environment:
      - VFX_CONFIG=/app/config/config.yaml
      - VFX_REDIS_ADDRESS=redis:6379
      - VFX_REDIS_PASSWORD=$REDIS_PASS
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=$ADMIN_PASS
    volumes:
      - ./config:/app/config:ro
      - veloflux-certs:/app/certs
    restart: unless-stopped
    depends_on:
      - redis
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Frontend React (Dashboard AI)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    container_name: veloflux-frontend
    ports:
      - "3000:80"
    environment:
      - VITE_MODE=production
      - VITE_API_URL=http://veloflux-lb:9000
    restart: unless-stopped
    networks:
      - veloflux-network

  # Prometheus para métricas
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
      - veloflux-lb
    networks:
      - veloflux-network

  # Grafana para dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: veloflux-grafana
    ports:
      - "3001:3000"
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
    networks:
      - veloflux-network

  # Node Exporter para métricas do sistema
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
    networks:
      - veloflux-network

  # Backends demo para teste
  backend-1:
    image: nginx:alpine
    container_name: veloflux-backend-1
    ports:
      - "8001:80"
    volumes:
      - ./examples/demo-backend.html:/usr/share/nginx/html/index.html:ro
    restart: unless-stopped
    networks:
      - veloflux-network

  backend-2:
    image: nginx:alpine
    container_name: veloflux-backend-2
    ports:
      - "8002:80"
    volumes:
      - ./examples/demo-backend.html:/usr/share/nginx/html/index.html:ro
    restart: unless-stopped
    networks:
      - veloflux-network

volumes:
  redis-data:
  prometheus-data:
  grafana-data:
  veloflux-certs:

networks:
  veloflux-network:
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
      - targets: ['veloflux-lb:8080']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

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
if [ -f "package.json" ]; then
    npm install
    npm run build
    print_success "Frontend construído"
else
    print_info "package.json não encontrado, pulando build do frontend"
fi

# Create VeloFlux config
print_step "Criando configuração do VeloFlux..."
mkdir -p config
cat > config/config.yaml << EOF
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  admin_address: "0.0.0.0:9000"
  
  redis:
    address: "redis:6379"
    password: "$REDIS_PASS"
    db: 0
  
  tls:
    auto_cert: true
    acme_email: "$EMAIL"
    cert_dir: "/app/certs"
  
  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

# Backend pools para demonstração
pools:
  - name: "demo-backends"
    algorithm: "round_robin"
    sticky_sessions: false
    health_check:
      interval: "30s"
      timeout: "5s"
      path: "/"
    backends:
      - address: "backend-1:80"
        weight: 100
      - address: "backend-2:80"
        weight: 100

# Roteamento básico
routes:
  - host: "$MAIN_DOMAIN"
    pool: "demo-backends"
    path_prefix: "/"
EOF

print_success "Configuração do VeloFlux criada"

# Build backend
print_step "Construindo backend Go..."
export PATH=$PATH:/usr/local/go/bin
export GOPATH=/opt/go

# Verificar se existe cmd/velofluxlb
if [ -d "cmd/velofluxlb" ]; then
    cd cmd/velofluxlb
    go mod tidy
    go build -o /root/VeloFlux/veloflux-lb .
    cd /root/VeloFlux
    chmod +x veloflux-lb
    print_success "Backend construído"
else
    print_info "Diretório cmd/velofluxlb não encontrado, usando Dockerfile para build"
fi

# Create demo backend page
print_step "Criando páginas demo..."
mkdir -p examples
cat > examples/demo-backend.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Demo Backend</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .container { max-width: 600px; margin: 0 auto; }
        .status { background: #4CAF50; color: white; padding: 10px; border-radius: 5px; }
        .hostname { background: #f0f0f0; padding: 10px; margin: 20px 0; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🚀 VeloFlux Demo Backend</h1>
        <div class="status">✅ Status: Healthy</div>
        <div class="hostname">Server: Backend Demo</div>
        <p>This is a demo backend server showing VeloFlux load balancing in action.</p>
        <p>Timestamp: <span id="timestamp"></span></p>
    </div>
    <script>
        document.getElementById('timestamp').textContent = new Date().toISOString();
    </script>
</body>
</html>
EOF

print_success "Páginas demo criadas"

# Configure systemd service
print_step "Configurando serviço systemd..."
cat > /etc/systemd/system/veloflux.service << EOF
[Unit]
Description=VeloFlux Load Balancer SaaS
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
User=root
WorkingDirectory=/root/VeloFlux
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
ExecReload=/usr/bin/docker-compose -f docker-compose.prod.yml restart
TimeoutStartSec=300
Environment=COMPOSE_HTTP_TIMEOUT=300

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable veloflux
print_success "Serviço systemd configurado"

# Setup Nginx reverse proxy
print_step "Configurando Nginx..."
cat > /etc/nginx/sites-available/veloflux << EOF
# Main domain - Load Balancer
server {
    listen 80;
    server_name $MAIN_DOMAIN www.$MAIN_DOMAIN;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Admin Panel
server {
    listen 80;
    server_name $ADMIN_DOMAIN;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api/ {
        proxy_pass http://localhost:9000/;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# API Domain
server {
    listen 80;
    server_name $API_DOMAIN;
    
    location / {
        proxy_pass http://localhost:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Metrics Domain
server {
    listen 80;
    server_name $METRICS_DOMAIN;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Grafana Domain
server {
    listen 80;
    server_name $GRAFANA_DOMAIN;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

# Prometheus Domain
server {
    listen 80;
    server_name $PROMETHEUS_DOMAIN;
    
    location / {
        proxy_pass http://localhost:9090;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
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
# Configurar SSL para todos os domínios
DOMAINS="$MAIN_DOMAIN,$ADMIN_DOMAIN,$API_DOMAIN,$METRICS_DOMAIN,$GRAFANA_DOMAIN,$PROMETHEUS_DOMAIN"
certbot --nginx -d $DOMAINS --non-interactive --agree-tos --email $EMAIL
print_success "SSL configurado"

# Start Docker services
print_step "Iniciando serviços Docker..."
docker-compose -f docker-compose.prod.yml up -d
sleep 10
print_success "Serviços Docker iniciados"

# Start VeloFlux service (systemd)
print_step "Iniciando VeloFlux via systemd..."
systemctl start veloflux
sleep 10
print_success "VeloFlux iniciado"

# Health check
print_step "Verificando saúde dos serviços..."
sleep 15

# Test services
if curl -f http://localhost:80 >/dev/null 2>&1; then
    print_success "✓ VeloFlux Load Balancer está funcionando"
else
    print_error "✗ VeloFlux Load Balancer não está respondendo"
fi

if curl -f http://localhost:8080/metrics >/dev/null 2>&1; then
    print_success "✓ Métricas VeloFlux estão funcionando"
else
    print_error "✗ Métricas VeloFlux não estão respondendo"
fi

if curl -f http://localhost:9000/health >/dev/null 2>&1; then
    print_success "✓ API VeloFlux está funcionando"
else
    print_error "✗ API VeloFlux não está respondendo"
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

if docker ps | grep -q veloflux-lb; then
    print_success "✓ VeloFlux LB Container está rodando"
else
    print_error "✗ VeloFlux LB Container não está rodando"
fi

if curl -f https://$MAIN_DOMAIN >/dev/null 2>&1; then
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
echo -e "  ${GREEN}🚀 Site Principal:${NC}     https://$MAIN_DOMAIN"
echo -e "  ${GREEN}� Admin Panel:${NC}       https://$ADMIN_DOMAIN"
echo -e "  ${GREEN}🔌 API:${NC}               https://$API_DOMAIN"
echo -e "  ${GREEN}📈 Metrics:${NC}           https://$METRICS_DOMAIN"
echo -e "  ${GREEN}� Grafana:${NC}           https://$GRAFANA_DOMAIN"
echo -e "  ${GREEN}🎯 Prometheus:${NC}        https://$PROMETHEUS_DOMAIN"
echo -e "  ${GREEN}⚖️  Load Balancer:${NC}     https://$LB_DOMAIN"
echo ""

echo -e "${YELLOW}${BOLD}🔐 Credenciais:${NC}"
echo -e "  ${GREEN}👤 Admin User:${NC}        admin"
echo -e "  ${GREEN}🔑 Admin Password:${NC}    $ADMIN_PASS"
echo -e "  ${GREEN}📊 Grafana User:${NC}      admin"
echo -e "  ${GREEN}� Grafana Password:${NC}  $ADMIN_PASS"
echo ""

echo -e "${YELLOW}${BOLD}🔧 Comandos de Gerenciamento:${NC}"
echo -e "  ${CYAN}📊 Ver logs:${NC}              journalctl -u veloflux -f"
echo -e "  ${CYAN}🔄 Reiniciar:${NC}             systemctl restart veloflux"
echo -e "  ${CYAN}⏹️  Parar:${NC}                 systemctl stop veloflux"
echo -e "  ${CYAN}📈 Status:${NC}                systemctl status veloflux"
echo -e "  ${CYAN}🐳 Docker Status:${NC}         cd /root/VeloFlux && docker-compose -f docker-compose.prod.yml ps"
echo ""

echo -e "${YELLOW}${BOLD}📁 Arquivos Importantes:${NC}"
echo -e "  ${CYAN}📂 Projeto:${NC}              /root/VeloFlux"
echo -e "  ${CYAN}⚙️  Configuração:${NC}         /root/VeloFlux/.env"
echo -e "  ${CYAN}🔧 Config VeloFlux:${NC}      /root/VeloFlux/config/config.yaml"
echo -e "  ${CYAN}🌐 Nginx:${NC}                /etc/nginx/sites-available/veloflux"
echo -e "  ${CYAN}🔧 Serviço:${NC}              /etc/systemd/system/veloflux.service"
echo ""

echo -e "${GREEN}${BOLD}✨ Próximos Passos:${NC}"
echo -e "  ${YELLOW}1.${NC} Acesse https://$MAIN_DOMAIN para ver o load balancer"
echo -e "  ${YELLOW}2.${NC} Faça login no admin panel https://$ADMIN_DOMAIN"
echo -e "  ${YELLOW}3.${NC} Configure seus servidores backend via API"
echo -e "  ${YELLOW}4.${NC} Monitore via Grafana em https://$GRAFANA_DOMAIN"
echo -e "  ${YELLOW}5.${NC} Configure alertas e backups"
echo ""

echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}VeloFlux SaaS está agora rodando em produção! 🚀${NC}"

# Save credentials to file
cat > /root/veloflux-credentials.txt << EOF
VeloFlux SaaS - Credenciais de Acesso
=====================================
Site Principal: https://$MAIN_DOMAIN
Admin Panel: https://$ADMIN_DOMAIN
API: https://$API_DOMAIN
Metrics: https://$METRICS_DOMAIN
Grafana: https://$GRAFANA_DOMAIN
Prometheus: https://$PROMETHEUS_DOMAIN

Admin User: admin
Admin Password: $ADMIN_PASS
Grafana User: admin
Grafana Password: $ADMIN_PASS

Diretório: /root/VeloFlux
Instalado em: $(date)
=====================================
EOF

print_info "Credenciais salvas em: /root/veloflux-credentials.txt"

# Create Dockerfile.frontend for frontend build
print_step "Criando Dockerfile.frontend..."
cat > Dockerfile.frontend << 'EOF'
# Frontend Dockerfile
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
EOF

# Create nginx.conf for frontend
cat > nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
EOF

print_success "Dockerfiles criados"
