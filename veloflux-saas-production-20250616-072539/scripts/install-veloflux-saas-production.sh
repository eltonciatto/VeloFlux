#!/bin/bash

# VeloFlux SaaS Production Installation Script
# Enterprise-grade installation with full monitoring, SSL, clustering, and backup
# Version: 2.0.0 - Production Ready

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration Variables
VELOFLUX_VERSION="2.0.0"
INSTALL_DIR="/opt/veloflux"
CONFIG_DIR="/etc/veloflux"
LOG_DIR="/var/log/veloflux"
DATA_DIR="/var/lib/veloflux"
BACKUP_DIR="/var/backups/veloflux"
SYSTEMD_DIR="/etc/systemd/system"

# Network Configuration
MAIN_DOMAIN="${MAIN_DOMAIN:-veloflux.io}"
ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.veloflux.io}"
API_DOMAIN="${API_DOMAIN:-api.veloflux.io}"
METRICS_DOMAIN="${METRICS_DOMAIN:-metrics.veloflux.io}"
GRAFANA_DOMAIN="${GRAFANA_DOMAIN:-grafana.veloflux.io}"
PROMETHEUS_DOMAIN="${PROMETHEUS_DOMAIN:-prometheus.veloflux.io}"
EMAIL="${EMAIL:-admin@veloflux.io}"

# Service Configuration
ENABLE_SSL="${ENABLE_SSL:-true}"
ENABLE_CLUSTERING="${ENABLE_CLUSTERING:-true}"
ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
ENABLE_BACKUP="${ENABLE_BACKUP:-true}"
ENABLE_WAF="${ENABLE_WAF:-true}"
ENABLE_RATE_LIMITING="${ENABLE_RATE_LIMITING:-true}"

# Performance Configuration
MAX_CONNECTIONS="${MAX_CONNECTIONS:-10000}"
WORKER_PROCESSES="${WORKER_PROCESSES:-auto}"
REDIS_MAX_MEMORY="${REDIS_MAX_MEMORY:-2gb}"
POSTGRES_MAX_CONNECTIONS="${POSTGRES_MAX_CONNECTIONS:-200}"

# Logging functions
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

log_step() {
    echo -e "${PURPLE}[STEP]${NC} $1"
}

log_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN} $1 ${NC}"
    echo -e "${CYAN}============================================${NC}"
}

# Error handling
handle_error() {
    log_error "Installation failed at line $1"
    log_error "Command: $2"
    log_error "Check logs at: $LOG_DIR/install.log"
    exit 1
}

trap 'handle_error $LINENO "$BASH_COMMAND"' ERR

# Pre-flight checks
preflight_checks() {
    log_header "PRE-FLIGHT CHECKS"
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Check system requirements
    log_step "Checking system requirements..."
    
    # Memory check (minimum 4GB)
    MEMORY_GB=$(free -g | awk 'NR==2{printf "%.0f", $2}')
    if [ "$MEMORY_GB" -lt 4 ]; then
        log_error "Minimum 4GB RAM required. Found: ${MEMORY_GB}GB"
        exit 1
    fi
    
    # Disk space check (minimum 20GB)
    DISK_GB=$(df / | awk 'NR==2{printf "%.0f", $4/1024/1024}')
    if [ "$DISK_GB" -lt 20 ]; then
        log_error "Minimum 20GB disk space required. Available: ${DISK_GB}GB"
        exit 1
    fi
    
    # Check OS compatibility
    if ! grep -q "Ubuntu\|Debian" /etc/os-release; then
        log_error "This script supports Ubuntu/Debian only"
        exit 1
    fi
    
    log_success "System requirements check passed"
    log_info "Memory: ${MEMORY_GB}GB, Disk: ${DISK_GB}GB available"
}

# Create directory structure
create_directories() {
    log_step "Creating directory structure..."
    
    mkdir -p "$INSTALL_DIR"/{bin,config,ssl,plugins,scripts}
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$DATA_DIR"/{redis,postgres,grafana,prometheus}
    mkdir -p "$BACKUP_DIR"/{daily,weekly,monthly}
    mkdir -p /etc/nginx/sites-{available,enabled}
    mkdir -p /etc/ssl/veloflux
    
    # Set proper permissions
    chown -R root:root "$INSTALL_DIR"
    chown -R root:root "$CONFIG_DIR"
    chmod 755 "$INSTALL_DIR" "$CONFIG_DIR"
    chmod 700 "$DATA_DIR" "$BACKUP_DIR"
    
    log_success "Directory structure created"
}

# Install system dependencies
install_dependencies() {
    log_header "INSTALLING SYSTEM DEPENDENCIES"
    
    log_step "Updating package repositories..."
    apt-get update -y
    
    log_step "Installing essential packages..."
    apt-get install -y \
        curl \
        wget \
        git \
        build-essential \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        unzip \
        jq \
        htop \
        iotop \
        iftop \
        netstat-nat \
        tcpdump \
        rsync \
        logrotate \
        cron \
        fail2ban \
        ufw \
        certbot \
        python3-certbot-nginx
    
    # Install Docker
    log_step "Installing Docker..."
    if ! command -v docker &> /dev/null; then
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update -y
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose
    log_step "Installing Docker Compose..."
    if ! command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
        curl -L "https://github.com/docker/compose/releases/download/${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Install Nginx
    log_step "Installing Nginx..."
    if ! command -v nginx &> /dev/null; then
        apt-get install -y nginx
        systemctl enable nginx
    fi
    
    # Install Node.js (for frontend builds)
    log_step "Installing Node.js..."
    if ! command -v node &> /dev/null; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install Go (for backend compilation)
    log_step "Installing Go..."
    if ! command -v go &> /dev/null; then
        GO_VERSION="1.21.0"
        wget "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz"
        tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
        export PATH=$PATH:/usr/local/go/bin
        rm "go${GO_VERSION}.linux-amd64.tar.gz"
    fi
    
    log_success "System dependencies installed"
}

# Generate secure secrets
generate_secrets() {
    log_step "Generating secure secrets..."
    
    # Generate secure passwords
    ADMIN_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    JWT_SECRET=$(openssl rand -base64 64 | tr -d "=+/" | cut -c1-64)
    REDIS_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    POSTGRES_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    GRAFANA_PASS=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-20)
    API_KEY=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    CLUSTER_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
    
    # Generate SSL certificates for internal communication
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CONFIG_DIR/internal.key" \
        -out "$CONFIG_DIR/internal.crt" \
        -subj "/C=US/ST=CA/L=SF/O=VeloFlux/CN=internal.veloflux.local"
    
    log_success "Secure secrets generated"
}

# Clone and build VeloFlux
build_veloflux() {
    log_header "BUILDING VELOFLUX"
    
    log_step "Cloning VeloFlux repository..."
    if [ -d "$INSTALL_DIR/src" ]; then
        rm -rf "$INSTALL_DIR/src"
    fi
    
    cd "$INSTALL_DIR"
    git clone https://github.com/VeloFlux/VeloFlux.git src
    cd src
    
    log_step "Building backend..."
    export PATH=$PATH:/usr/local/go/bin
    go mod download
    CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
        -ldflags="-w -s -X main.version=$VELOFLUX_VERSION -X main.buildDate=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        -o "$INSTALL_DIR/bin/veloflux-lb" \
        ./cmd/velofluxlb
    
    log_step "Building frontend..."
    npm ci
    npm run build:production
    cp -r dist/* "$INSTALL_DIR/config/static/"
    
    log_step "Setting permissions..."
    chmod +x "$INSTALL_DIR/bin/veloflux-lb"
    chown -R root:root "$INSTALL_DIR"
    
    log_success "VeloFlux built successfully"
}

# Create production configuration
create_production_config() {
    log_header "CREATING PRODUCTION CONFIGURATION"
    
    log_step "Creating main configuration..."
    cat > "$CONFIG_DIR/config.yaml" << EOF
# VeloFlux SaaS Production Configuration
global:
  # Server Configuration
  bind_address: "0.0.0.0:8080"
  tls_bind_address: "0.0.0.0:8443"
  admin_address: "0.0.0.0:9000"
  metrics_address: "0.0.0.0:8090"
  
  # Environment
  environment: "production"
  log_level: "info"
  log_format: "json"
  
  # Security
  enable_cors: true
  cors_origins: ["https://$MAIN_DOMAIN", "https://$ADMIN_DOMAIN"]
  enable_rate_limiting: $ENABLE_RATE_LIMITING
  rate_limit_requests: 1000
  rate_limit_window: "1h"
  
  # Performance
  max_connections: $MAX_CONNECTIONS
  read_timeout: "30s"
  write_timeout: "30s"
  idle_timeout: "120s"
  
  # Database Configuration
  redis:
    address: "localhost:6379"
    password: "$REDIS_PASS"
    db: 0
    max_retries: 3
    pool_size: 100
    
  postgres:
    host: "localhost"
    port: 5432
    database: "veloflux"
    username: "veloflux"
    password: "$POSTGRES_PASS"
    max_connections: $POSTGRES_MAX_CONNECTIONS
    ssl_mode: "require"
  
  # TLS/SSL Configuration
  tls:
    auto_cert: $ENABLE_SSL
    acme_email: "$EMAIL"
    cert_dir: "$CONFIG_DIR/ssl"
    min_version: "1.2"
    ciphers: ["ECDHE-ECDSA-AES256-GCM-SHA384", "ECDHE-RSA-AES256-GCM-SHA384"]
  
  # Clustering (for multi-node setup)
  clustering:
    enabled: $ENABLE_CLUSTERING
    node_id: "node-1"
    cluster_secret: "$CLUSTER_SECRET"
    discovery_method: "static"
    peers: []
  
  # Monitoring
  monitoring:
    enabled: $ENABLE_MONITORING
    prometheus_endpoint: "/metrics"
    health_endpoint: "/health"
    ready_endpoint: "/ready"
  
  # Backup Configuration
  backup:
    enabled: $ENABLE_BACKUP
    schedule: "0 2 * * *"  # Daily at 2 AM
    retention_days: 30
    storage_backend: "local"
    local_path: "$BACKUP_DIR"
  
  # WAF Configuration
  waf:
    enabled: $ENABLE_WAF
    rules_dir: "$CONFIG_DIR/waf"
    block_mode: true
    log_blocked: true

# Load Balancing Pools
pools:
  - name: "web-frontend"
    algorithm: "least_connections"
    sticky_sessions: true
    session_cookie: "VELOFLUX_SESSION"
    health_check:
      interval: "10s"
      timeout: "5s"
      path: "/health"
      retries: 3
    backends:
      - address: "127.0.0.1:3000"
        weight: 100
        max_connections: 1000
  
  - name: "api-backend"
    algorithm: "round_robin"
    sticky_sessions: false
    health_check:
      interval: "10s"
      timeout: "5s"
      path: "/api/health"
      retries: 3
    backends:
      - address: "127.0.0.1:3001"
        weight: 100
        max_connections: 500
      - address: "127.0.0.1:3002"
        weight: 100
        max_connections: 500

# Routing Configuration
routes:
  - host: "$MAIN_DOMAIN"
    pool: "web-frontend"
    path_prefix: "/"
    middleware: ["rate_limiter", "waf", "gzip"]
    
  - host: "$API_DOMAIN"
    pool: "api-backend"
    path_prefix: "/api"
    middleware: ["auth", "rate_limiter", "cors"]
    
  - host: "$ADMIN_DOMAIN"
    pool: "web-frontend"
    path_prefix: "/admin"
    middleware: ["admin_auth", "rate_limiter", "waf"]

# Middleware Configuration
middleware:
  rate_limiter:
    requests: 100
    window: "1m"
    burst: 20
  
  auth:
    jwt_secret: "$JWT_SECRET"
    token_expiry: "24h"
    refresh_expiry: "7d"
  
  admin_auth:
    jwt_secret: "$JWT_SECRET"
    required_role: "admin"
  
  cors:
    allowed_origins: ["https://$MAIN_DOMAIN", "https://$API_DOMAIN"]
    allowed_methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allowed_headers: ["Authorization", "Content-Type"]
  
  gzip:
    level: 6
    min_length: 1024
  
  waf:
    rules_file: "$CONFIG_DIR/waf/rules.yaml"
    block_mode: true

# SSL/TLS Settings
ssl:
  protocols: ["TLSv1.2", "TLSv1.3"]
  ciphers: [
    "ECDHE-ECDSA-AES256-GCM-SHA384",
    "ECDHE-RSA-AES256-GCM-SHA384",
    "ECDHE-ECDSA-CHACHA20-POLY1305",
    "ECDHE-RSA-CHACHA20-POLY1305"
  ]
  prefer_server_ciphers: true
  session_timeout: "1d"
  session_cache: "shared:SSL:50m"
EOF

    log_step "Creating environment file..."
    cat > "$CONFIG_DIR/.env" << EOF
# VeloFlux Production Environment Variables
NODE_ENV=production
VF_ENVIRONMENT=production
VF_VERSION=$VELOFLUX_VERSION

# Network Configuration
VF_MAIN_DOMAIN=$MAIN_DOMAIN
VF_ADMIN_DOMAIN=$ADMIN_DOMAIN
VF_API_DOMAIN=$API_DOMAIN

# Security
VF_ADMIN_USER=admin
VF_ADMIN_PASS=$ADMIN_PASS
VF_JWT_SECRET=$JWT_SECRET
VF_API_KEY=$API_KEY

# Database
VF_REDIS_PASS=$REDIS_PASS
VF_POSTGRES_PASS=$POSTGRES_PASS

# Services
VF_GRAFANA_PASS=$GRAFANA_PASS

# Features
VF_SSL_ENABLED=$ENABLE_SSL
VF_SSL_EMAIL=$EMAIL
VF_MONITORING_ENABLED=$ENABLE_MONITORING
VF_BACKUP_ENABLED=$ENABLE_BACKUP
VF_CLUSTERING_ENABLED=$ENABLE_CLUSTERING
VF_WAF_ENABLED=$ENABLE_WAF
EOF

    chmod 600 "$CONFIG_DIR/.env"
    log_success "Production configuration created"
}

# Create production Docker Compose
create_docker_compose() {
    log_header "CREATING PRODUCTION DOCKER COMPOSE"
    
    cat > "$INSTALL_DIR/docker-compose.production.yml" << EOF
version: '3.8'

services:
  # Redis Cluster (3 nodes for HA)
  redis-master:
    image: redis:7-alpine
    container_name: veloflux-redis-master
    command: >
      redis-server
      --requirepass $REDIS_PASS
      --appendonly yes
      --appendfsync everysec
      --maxmemory $REDIS_MAX_MEMORY
      --maxmemory-policy allkeys-lru
      --tcp-keepalive 60
      --timeout 0
    volumes:
      - redis-master-data:/data
      - $CONFIG_DIR/redis-master.conf:/usr/local/etc/redis/redis.conf:ro
    ports:
      - "6379:6379"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "$REDIS_PASS", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - veloflux-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  redis-sentinel-1:
    image: redis:7-alpine
    container_name: veloflux-redis-sentinel-1
    command: redis-sentinel /etc/redis/sentinel.conf
    volumes:
      - $CONFIG_DIR/sentinel.conf:/etc/redis/sentinel.conf:ro
    depends_on:
      - redis-master
    restart: unless-stopped
    networks:
      - veloflux-network

  # PostgreSQL for persistent data
  postgres:
    image: postgres:15-alpine
    container_name: veloflux-postgres
    environment:
      POSTGRES_DB: veloflux
      POSTGRES_USER: veloflux
      POSTGRES_PASSWORD: $POSTGRES_PASS
      PGDATA: /var/lib/postgresql/data/pgdata
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - $CONFIG_DIR/postgres.conf:/etc/postgresql/postgresql.conf:ro
      - $BACKUP_DIR:/backup
    ports:
      - "5432:5432"
    restart: unless-stopped
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U veloflux -d veloflux"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - veloflux-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2.0'

  # VeloFlux Load Balancer (Multiple instances for HA)
  veloflux-lb-1:
    build:
      context: $INSTALL_DIR/src
      dockerfile: Dockerfile.production
    container_name: veloflux-lb-1
    ports:
      - "8080:8080"
      - "8443:8443"
      - "9000:9000"
      - "8090:8090"
    environment:
      - VF_CONFIG_PATH=/etc/veloflux/config.yaml
      - VF_NODE_ID=lb-1
      - VF_CLUSTER_ENABLED=true
    volumes:
      - $CONFIG_DIR:/etc/veloflux:ro
      - $LOG_DIR:/var/log/veloflux
      - ssl-certs:/etc/ssl/veloflux
    restart: unless-stopped
    depends_on:
      - redis-master
      - postgres
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2.0'

  veloflux-lb-2:
    build:
      context: $INSTALL_DIR/src
      dockerfile: Dockerfile.production
    container_name: veloflux-lb-2
    ports:
      - "8081:8080"
      - "8444:8443"
      - "9001:9000"
      - "8091:8090"
    environment:
      - VF_CONFIG_PATH=/etc/veloflux/config.yaml
      - VF_NODE_ID=lb-2
      - VF_CLUSTER_ENABLED=true
    volumes:
      - $CONFIG_DIR:/etc/veloflux:ro
      - $LOG_DIR:/var/log/veloflux
      - ssl-certs:/etc/ssl/veloflux
    restart: unless-stopped
    depends_on:
      - redis-master
      - postgres
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '2.0'

  # Prometheus for metrics collection
  prometheus:
    image: prom/prometheus:latest
    container_name: veloflux-prometheus
    ports:
      - "9090:9090"
    volumes:
      - $CONFIG_DIR/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - $CONFIG_DIR/prometheus/rules:/etc/prometheus/rules:ro
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--storage.tsdb.retention.size=10GB'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
      - '--web.enable-lifecycle'
      - '--web.enable-admin-api'
      - '--alertmanager.notification-queue-capacity=10000'
    restart: unless-stopped
    networks:
      - veloflux-network
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '1.0'

  # Grafana for monitoring dashboards
  grafana:
    image: grafana/grafana:latest
    container_name: veloflux-grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=$GRAFANA_PASS
      - GF_SECURITY_ADMIN_USER=admin
      - GF_USERS_ALLOW_SIGN_UP=false
      - GF_USERS_ALLOW_ORG_CREATE=false
      - GF_AUTH_DISABLE_LOGIN_FORM=false
      - GF_INSTALL_PLUGINS=grafana-piechart-panel,grafana-worldmap-panel,grafana-clock-panel
      - GF_DASHBOARDS_DEFAULT_HOME_DASHBOARD_PATH=/var/lib/grafana/dashboards/veloflux-overview.json
    volumes:
      - grafana-data:/var/lib/grafana
      - $CONFIG_DIR/grafana/provisioning:/etc/grafana/provisioning:ro
      - $CONFIG_DIR/grafana/dashboards:/var/lib/grafana/dashboards:ro
    restart: unless-stopped
    depends_on:
      - prometheus
    networks:
      - veloflux-network
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '1.0'

  # AlertManager for alerts
  alertmanager:
    image: prom/alertmanager:latest
    container_name: veloflux-alertmanager
    ports:
      - "9093:9093"
    volumes:
      - $CONFIG_DIR/alertmanager.yml:/etc/alertmanager/alertmanager.yml:ro
      - alertmanager-data:/alertmanager
    command:
      - '--config.file=/etc/alertmanager/alertmanager.yml'
      - '--storage.path=/alertmanager'
      - '--web.external-url=http://localhost:9093'
    restart: unless-stopped
    networks:
      - veloflux-network

  # Node Exporter for system metrics
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
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc|var/lib/docker)($|/)'
      - '--web.listen-address=:9100'
    restart: unless-stopped
    networks:
      - veloflux-network

  # cAdvisor for container metrics
  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: veloflux-cadvisor
    ports:
      - "8080:8080"
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:rw
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
    restart: unless-stopped
    networks:
      - veloflux-network

  # Jaeger for distributed tracing
  jaeger:
    image: jaegertracing/all-in-one:latest
    container_name: veloflux-jaeger
    ports:
      - "16686:16686"
      - "14268:14268"
    environment:
      - COLLECTOR_ZIPKIN_HTTP_PORT=9411
    restart: unless-stopped
    networks:
      - veloflux-network

volumes:
  redis-master-data:
    driver: local
  postgres-data:
    driver: local
  prometheus-data:
    driver: local
  grafana-data:
    driver: local
  alertmanager-data:
    driver: local
  ssl-certs:
    driver: local

networks:
  veloflux-network:
    driver: bridge
    ipam:
      config:
        - subnet: 172.20.0.0/16
EOF

    log_success "Production Docker Compose created"
}

# Main installation function
main() {
    log_header "VELOFLUX SAAS PRODUCTION INSTALLATION"
    log_info "Version: $VELOFLUX_VERSION"
    log_info "Target: Enterprise Production Environment"
    
    # Run installation steps
    preflight_checks
    create_directories
    install_dependencies
    generate_secrets
    build_veloflux
    create_production_config
    create_docker_compose
    
    log_header "INSTALLATION COMPLETED SUCCESSFULLY"
    log_success "VeloFlux SaaS Production environment is ready!"
    log_info "Next steps:"
    log_info "1. Configure your DNS records"
    log_info "2. Run: cd $INSTALL_DIR && docker-compose -f docker-compose.production.yml up -d"
    log_info "3. Configure SSL certificates"
    log_info "4. Set up monitoring alerts"
    
    log_info "Configuration files:"
    log_info "- Main config: $CONFIG_DIR/config.yaml"
    log_info "- Environment: $CONFIG_DIR/.env"
    log_info "- Docker Compose: $INSTALL_DIR/docker-compose.production.yml"
}

# Run main function
main "$@"
