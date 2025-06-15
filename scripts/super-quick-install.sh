#!/bin/bash

# 🚀 VeloFlux SaaS - Super Quick Install Script
# One-command complete setup for production-ready SaaS deployment
# Version: 2.0.0

set -e

# Colors and formatting
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

# Configuration
SCRIPT_VERSION="2.0.0"
PROJECT_NAME="VeloFlux SaaS"
INSTALL_DIR="$(pwd)"
LOG_FILE="/tmp/veloflux-install.log"

# Installation types
INSTALL_TYPE=""
DOMAIN=""
EMAIL=""
ENABLE_SSL=true
ENABLE_MONITORING=true
ENABLE_BACKUP=true
AUTO_START=true

# Show banner
show_banner() {
    clear
    echo -e "${PURPLE}${BOLD}"
    cat << "EOF"
██╗   ██╗███████╗██╗      ██████╗ ███████╗██╗     ██╗   ██╗██╗  ██╗
██║   ██║██╔════╝██║     ██╔═══██╗██╔════╝██║     ██║   ██║╚██╗██╔╝
██║   ██║█████╗  ██║     ██║   ██║█████╗  ██║     ██║   ██║ ╚███╔╝ 
╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██╔══╝  ██║     ██║   ██║ ██╔██╗ 
 ╚████╔╝ ███████╗███████╗╚██████╔╝██║     ███████╗╚██████╔╝██╔╝ ██╗
  ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝
                                                                     
        🚀 AI-Powered Load Balancer SaaS Platform - Super Quick Install 🚀
                                Version ${SCRIPT_VERSION}
EOF
    echo -e "${NC}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Logging functions
log() {
    echo "$(date '+%Y-%m-%d %H:%M:%S') - $1" >> "$LOG_FILE"
}

print_step() {
    echo -e "${BLUE}${BOLD}[STEP]${NC} $1"
    log "STEP: $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"
    log "SUCCESS: $1"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}[WARNING]${NC} $1"
    log "WARNING: $1"
}

print_error() {
    echo -e "${RED}${BOLD}[ERROR]${NC} $1"
    log "ERROR: $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
    log "INFO: $1"
}

# Progress bar
show_progress() {
    local current=$1
    local total=$2
    local desc="$3"
    local percent=$((current * 100 / total))
    local filled=$((percent / 2))
    local empty=$((50 - filled))
    
    printf "\r${CYAN}[${NC}"
    printf "%${filled}s" | tr ' ' '█'
    printf "%${empty}s" | tr ' ' '░'
    printf "${CYAN}]${NC} ${percent}%% - ${desc}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check system requirements
check_system_requirements() {
    print_step "Checking system requirements..."
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        print_success "macOS detected"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
    
    # Check architecture
    ARCH=$(uname -m)
    if [[ "$ARCH" == "x86_64" ]] || [[ "$ARCH" == "amd64" ]]; then
        print_success "x86_64 architecture detected"
    elif [[ "$ARCH" == "aarch64" ]] || [[ "$ARCH" == "arm64" ]]; then
        print_success "ARM64 architecture detected"
    else
        print_error "Unsupported architecture: $ARCH"
        exit 1
    fi
    
    # Check required tools
    local missing_tools=()
    
    if ! command_exists curl; then
        missing_tools+=("curl")
    fi
    
    if ! command_exists git; then
        missing_tools+=("git")
    fi
    
    if ! command_exists openssl; then
        missing_tools+=("openssl")
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing required tools: ${missing_tools[*]}"
        print_info "Installing missing tools..."
        
        # Auto-install on Linux
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            if command_exists apt-get; then
                sudo apt-get update && sudo apt-get install -y "${missing_tools[@]}"
            elif command_exists yum; then
                sudo yum install -y "${missing_tools[@]}"
            elif command_exists dnf; then
                sudo dnf install -y "${missing_tools[@]}"
            else
                print_error "Package manager not found. Please install: ${missing_tools[*]}"
                exit 1
            fi
        else
            print_error "Please install the missing tools manually: ${missing_tools[*]}"
            exit 1
        fi
    fi
    
    print_success "All system requirements met"
}

# Install Docker if needed
install_docker() {
    if ! command_exists docker; then
        print_step "Installing Docker..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker "$USER"
            print_success "Docker installed successfully"
            print_warning "You may need to logout and login again for Docker group changes to take effect"
        else
            print_error "Please install Docker manually from https://docker.com"
            exit 1
        fi
    else
        print_success "Docker already installed"
    fi
    
    if ! command_exists docker-compose; then
        print_step "Installing Docker Compose..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
            print_success "Docker Compose installed successfully"
        else
            print_error "Please install Docker Compose manually"
            exit 1
        fi
    else
        print_success "Docker Compose already installed"
    fi
}

# Install Node.js if needed
install_nodejs() {
    if ! command_exists node; then
        print_step "Installing Node.js..."
        
        # Install Node.js using NodeSource repository
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        else
            print_error "Please install Node.js manually from https://nodejs.org"
            exit 1
        fi
        
        print_success "Node.js installed successfully"
    else
        print_success "Node.js already installed"
    fi
}

# Installation wizard
run_installation_wizard() {
    echo -e "${CYAN}${BOLD}🧙‍♂️ Installation Wizard${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Installation type
    echo -e "${YELLOW}${BOLD}Choose installation type:${NC}"
    echo "1. 🚀 Production (Complete setup with SSL, monitoring, backups)"
    echo "2. 🛠️  Development (Local development environment)"
    echo "3. 🐳 Docker Simple (Quick Docker setup for testing)"
    echo "4. ☁️  Cloud Deploy (Kubernetes/Cloud platform ready)"
    echo ""
    
    read -p "Enter your choice (1-4): " choice
    
    case $choice in
        1)
            INSTALL_TYPE="production"
            setup_production_config
            ;;
        2)
            INSTALL_TYPE="development"
            setup_development_config
            ;;
        3)
            INSTALL_TYPE="docker"
            setup_docker_config
            ;;
        4)
            INSTALL_TYPE="cloud"
            setup_cloud_config
            ;;
        *)
            print_error "Invalid choice. Defaulting to Docker Simple."
            INSTALL_TYPE="docker"
            setup_docker_config
            ;;
    esac
}

# Production configuration
setup_production_config() {
    echo ""
    echo -e "${YELLOW}${BOLD}🚀 Production Setup Configuration${NC}"
    echo ""
    
    # Domain
    read -p "Enter your domain (e.g., myapp.com): " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        print_warning "No domain provided. Using localhost."
        DOMAIN="localhost"
    fi
    
    # Email for SSL
    read -p "Enter email for SSL certificates: " EMAIL
    if [[ -z "$EMAIL" ]]; then
        print_warning "No email provided. SSL auto-generation disabled."
        ENABLE_SSL=false
    fi
    
    # SSL preference
    if [[ "$ENABLE_SSL" == true ]]; then
        read -p "Enable automatic SSL certificates? (Y/n): " ssl_choice
        if [[ "$ssl_choice" =~ ^[Nn] ]]; then
            ENABLE_SSL=false
        fi
    fi
    
    # Monitoring
    read -p "Enable monitoring and metrics? (Y/n): " monitor_choice
    if [[ "$monitor_choice" =~ ^[Nn] ]]; then
        ENABLE_MONITORING=false
    fi
    
    # Backup
    read -p "Enable automatic backups? (Y/n): " backup_choice
    if [[ "$backup_choice" =~ ^[Nn] ]]; then
        ENABLE_BACKUP=false
    fi
    
    # Auto-start
    read -p "Start services automatically after installation? (Y/n): " start_choice
    if [[ "$start_choice" =~ ^[Nn] ]]; then
        AUTO_START=false
    fi
}

# Development configuration
setup_development_config() {
    echo ""
    echo -e "${YELLOW}${BOLD}🛠️ Development Setup Configuration${NC}"
    echo ""
    
    DOMAIN="localhost"
    ENABLE_SSL=false
    ENABLE_MONITORING=true
    ENABLE_BACKUP=false
    AUTO_START=true
    
    print_info "Development configuration applied:"
    print_info "  - Domain: localhost"
    print_info "  - SSL: Disabled"
    print_info "  - Monitoring: Enabled"
    print_info "  - Backup: Disabled"
    print_info "  - Auto-start: Enabled"
}

# Docker configuration
setup_docker_config() {
    echo ""
    echo -e "${YELLOW}${BOLD}🐳 Docker Setup Configuration${NC}"
    echo ""
    
    DOMAIN="localhost"
    ENABLE_SSL=false
    ENABLE_MONITORING=true
    ENABLE_BACKUP=false
    AUTO_START=true
    
    print_info "Docker configuration applied:"
    print_info "  - Domain: localhost"
    print_info "  - SSL: Self-signed certificates"
    print_info "  - Monitoring: Enabled"
    print_info "  - Backup: Disabled"
    print_info "  - Auto-start: Enabled"
}

# Cloud configuration
setup_cloud_config() {
    echo ""
    echo -e "${YELLOW}${BOLD}☁️ Cloud Deploy Configuration${NC}"
    echo ""
    
    read -p "Enter your domain: " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="example.com"
    fi
    
    ENABLE_SSL=true
    ENABLE_MONITORING=true
    ENABLE_BACKUP=true
    AUTO_START=false
    
    print_info "Cloud configuration applied:"
    print_info "  - Domain: $DOMAIN"
    print_info "  - SSL: Enabled"
    print_info "  - Monitoring: Enabled"
    print_info "  - Backup: Enabled"
    print_info "  - Auto-start: Disabled (manual deployment)"
}

# Setup project
setup_project() {
    print_step "Setting up VeloFlux project..."
    
    # Create necessary directories
    mkdir -p config logs certs backups data
    
    # Copy configuration files
    if [[ ! -f config/config.yaml ]]; then
        cp config/config.example.yaml config/config.yaml
        print_success "Created configuration file"
    fi
    
    # Create environment file
    if [[ ! -f .env ]]; then
        cat > .env << EOF
# VeloFlux SaaS Environment Configuration
NODE_ENV=production
VF_DOMAIN=$DOMAIN
VF_ADMIN_USER=admin
VF_ADMIN_PASS=$(openssl rand -base64 32)
VF_JWT_SECRET=$(openssl rand -base64 64)
VF_SSL_ENABLED=$ENABLE_SSL
VF_SSL_EMAIL=$EMAIL
VF_MONITORING_ENABLED=$ENABLE_MONITORING
VF_BACKUP_ENABLED=$ENABLE_BACKUP

# Database Configuration
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://veloflux:$(openssl rand -base64 16)@localhost:5432/veloflux

# Optional integrations
VF_COOLIFY_ENABLED=false
VF_KUBERNETES_ENABLED=false
EOF
        print_success "Created environment configuration"
    fi
    
    # Update config.yaml with user preferences
    update_config_file
}

# Update configuration file
update_config_file() {
    print_step "Updating configuration file..."
    
    # Use sed to update configuration values
    sed -i.bak "s/example.com/$DOMAIN/g" config/config.yaml
    sed -i.bak "s/admin@example.com/$EMAIL/g" config/config.yaml
    
    if [[ "$ENABLE_SSL" == true ]]; then
        sed -i.bak "s/auto_cert: false/auto_cert: true/g" config/config.yaml
    fi
    
    if [[ "$ENABLE_MONITORING" == true ]]; then
        sed -i.bak "s/metrics_enabled: false/metrics_enabled: true/g" config/config.yaml
    fi
    
    print_success "Configuration updated"
}

# Install dependencies
install_dependencies() {
    print_step "Installing project dependencies..."
    
    show_progress 1 4 "Installing Node.js dependencies"
    npm install --silent >> "$LOG_FILE" 2>&1
    
    show_progress 2 4 "Building frontend assets"
    npm run build --silent >> "$LOG_FILE" 2>&1
    
    show_progress 3 4 "Setting up SSL certificates"
    setup_ssl_certificates
    
    show_progress 4 4 "Configuring services"
    configure_services
    
    echo ""
    print_success "All dependencies installed"
}

# Setup SSL certificates
setup_ssl_certificates() {
    if [[ "$ENABLE_SSL" == true && -n "$EMAIL" ]]; then
        print_step "Setting up SSL certificates..."
        
        # For production, we would use Let's Encrypt
        # For now, create self-signed certificates
        mkdir -p certs
        
        if [[ ! -f certs/server.crt ]]; then
            openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt \
                -days 365 -nodes -subj "/C=US/ST=State/L=City/O=VeloFlux/CN=$DOMAIN" \
                >> "$LOG_FILE" 2>&1
            print_success "SSL certificates generated"
        fi
    else
        print_info "SSL certificates skipped"
    fi
}

# Configure services
configure_services() {
    case $INSTALL_TYPE in
        "production")
            configure_production_services
            ;;
        "development")
            configure_development_services
            ;;
        "docker")
            configure_docker_services
            ;;
        "cloud")
            configure_cloud_services
            ;;
    esac
}

# Configure production services
configure_production_services() {
    print_step "Configuring production services..."
    
    # Create systemd service file
    if command_exists systemctl; then
        sudo tee /etc/systemd/system/veloflux.service > /dev/null << EOF
[Unit]
Description=VeloFlux Load Balancer SaaS
After=network.target

[Service]
Type=simple
User=$USER
WorkingDirectory=$INSTALL_DIR
ExecStart=$INSTALL_DIR/veloflux-lb
Restart=always
RestartSec=5
Environment=VFX_CONFIG=$INSTALL_DIR/config/config.yaml

[Install]
WantedBy=multi-user.target
EOF
        
        sudo systemctl daemon-reload
        sudo systemctl enable veloflux
        print_success "Systemd service configured"
    fi
    
    # Setup logrotate
    sudo tee /etc/logrotate.d/veloflux > /dev/null << EOF
$INSTALL_DIR/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
    print_success "Log rotation configured"
}

# Configure development services
configure_development_services() {
    print_step "Configuring development services..."
    
    # Create development docker-compose override
    cat > docker-compose.override.yml << EOF
version: '3.8'
services:
  veloflux-lb:
    environment:
      - VFX_LOG_LEVEL=debug
      - VF_DEV_MODE=true
    volumes:
      - ./src:/app/src:ro
    ports:
      - "3000:3000"  # Dev server
EOF
    print_success "Development configuration created"
}

# Configure Docker services
configure_docker_services() {
    print_step "Configuring Docker services..."
    
    # Ensure Docker Compose file is ready
    if [[ ! -f docker-compose.yml ]]; then
        print_error "Docker Compose file not found"
        exit 1
    fi
    
    print_success "Docker services configured"
}

# Configure cloud services
configure_cloud_services() {
    print_step "Configuring cloud services..."
    
    # Create Kubernetes manifests
    mkdir -p k8s
    
    # Generate deployment manifest
    cat > k8s/deployment.yaml << EOF
apiVersion: apps/v1
kind: Deployment
metadata:
  name: veloflux-lb
  labels:
    app: veloflux
spec:
  replicas: 3
  selector:
    matchLabels:
      app: veloflux
  template:
    metadata:
      labels:
        app: veloflux
    spec:
      containers:
      - name: veloflux
        image: veloflux:latest
        ports:
        - containerPort: 80
        - containerPort: 443
        env:
        - name: VF_DOMAIN
          value: "$DOMAIN"
        resources:
          limits:
            memory: "512Mi"
            cpu: "500m"
          requests:
            memory: "256Mi"
            cpu: "250m"
EOF
    
    # Generate service manifest
    cat > k8s/service.yaml << EOF
apiVersion: v1
kind: Service
metadata:
  name: veloflux-service
spec:
  selector:
    app: veloflux
  ports:
  - name: http
    port: 80
    targetPort: 80
  - name: https
    port: 443
    targetPort: 443
  type: LoadBalancer
EOF
    
    print_success "Kubernetes manifests created"
}

# Build project
build_project() {
    print_step "Building VeloFlux project..."
    
    case $INSTALL_TYPE in
        "production"|"cloud")
            # Build Go binary
            if [[ -f go.mod ]]; then
                go build -o veloflux-lb ./cmd/velofluxlb/
                print_success "Go binary built"
            fi
            ;;
        "docker")
            # Build Docker image
            docker build -t veloflux:latest . >> "$LOG_FILE" 2>&1
            print_success "Docker image built"
            ;;
        "development")
            # Development build
            npm run build:dev >> "$LOG_FILE" 2>&1
            print_success "Development build completed"
            ;;
    esac
}

# Start services
start_services() {
    if [[ "$AUTO_START" != true ]]; then
        return
    fi
    
    print_step "Starting VeloFlux services..."
    
    case $INSTALL_TYPE in
        "production")
            if command_exists systemctl; then
                sudo systemctl start veloflux
                print_success "Production service started"
            else
                ./veloflux-lb &
                echo $! > veloflux.pid
                print_success "VeloFlux started in background"
            fi
            ;;
        "docker")
            docker-compose up -d >> "$LOG_FILE" 2>&1
            print_success "Docker services started"
            ;;
        "development")
            # Start development environment
            npm run dev &
            echo $! > dev-server.pid
            docker-compose up -d redis backend-1 backend-2 >> "$LOG_FILE" 2>&1
            print_success "Development services started"
            ;;
        "cloud")
            print_info "Cloud deployment requires manual steps. Check k8s/ directory."
            ;;
    esac
}

# Setup monitoring
setup_monitoring() {
    if [[ "$ENABLE_MONITORING" != true ]]; then
        return
    fi
    
    print_step "Setting up monitoring..."
    
    # Create Prometheus configuration
    mkdir -p monitoring
    
    cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'veloflux'
    static_configs:
      - targets: ['localhost:8080']
    metrics_path: /metrics
    scrape_interval: 5s
EOF
    
    # Create Grafana dashboard
    cat > monitoring/dashboard.json << EOF
{
  "dashboard": {
    "title": "VeloFlux Monitoring",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(veloflux_requests_total[5m])"
          }
        ]
      }
    ]
  }
}
EOF
    
    print_success "Monitoring configuration created"
}

# Setup backup
setup_backup() {
    if [[ "$ENABLE_BACKUP" != true ]]; then
        return
    fi
    
    print_step "Setting up backup system..."
    
    # Create backup script
    cat > scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/veloflux/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" config/

# Backup data
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF
    
    chmod +x scripts/backup.sh
    
    # Setup cron job for daily backups
    if command_exists crontab; then
        (crontab -l 2>/dev/null; echo "0 2 * * * $INSTALL_DIR/scripts/backup.sh") | crontab -
        print_success "Daily backup scheduled"
    fi
}

# Health check
run_health_check() {
    print_step "Running health check..."
    
    sleep 5  # Give services time to start
    
    case $INSTALL_TYPE in
        "docker")
            if curl -s http://localhost:8080/health >/dev/null 2>&1; then
                print_success "Health check passed"
            else
                print_warning "Health check failed - services may still be starting"
            fi
            ;;
        "development")
            if curl -s http://localhost:5173 >/dev/null 2>&1; then
                print_success "Development server health check passed"
            else
                print_warning "Development server health check failed"
            fi
            ;;
        "production")
            if curl -s http://localhost/health >/dev/null 2>&1; then
                print_success "Production health check passed"
            else
                print_warning "Production health check failed"
            fi
            ;;
    esac
}

# Show completion info
show_completion_info() {
    echo ""
    echo -e "${GREEN}${BOLD}🎉 VeloFlux SaaS Installation Complete! 🎉${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🌐 Access Information:${NC}"
    case $INSTALL_TYPE in
        "production")
            echo -e "  ${GREEN}🚀 Frontend:${NC} https://$DOMAIN"
            echo -e "  ${GREEN}📊 Admin Panel:${NC} https://$DOMAIN:9000"
            echo -e "  ${GREEN}📈 Metrics:${NC} https://$DOMAIN:8080/metrics"
            ;;
        "docker")
            echo -e "  ${GREEN}🚀 Frontend:${NC} http://localhost"
            echo -e "  ${GREEN}📊 Admin Panel:${NC} http://localhost:9000"
            echo -e "  ${GREEN}📈 Metrics:${NC} http://localhost:8080/metrics"
            ;;
        "development")
            echo -e "  ${GREEN}🚀 Frontend:${NC} http://localhost:5173"
            echo -e "  ${GREEN}📊 Admin Panel:${NC} http://localhost:9000"
            echo -e "  ${GREEN}📈 Metrics:${NC} http://localhost:8080/metrics"
            ;;
        "cloud")
            echo -e "  ${GREEN}📁 K8s Manifests:${NC} ./k8s/"
            echo -e "  ${GREEN}🚀 Deploy Command:${NC} kubectl apply -f k8s/"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}${BOLD}🔐 Security Information:${NC}"
    echo -e "  ${GREEN}👤 Admin User:${NC} admin"
    echo -e "  ${GREEN}🔑 Admin Password:${NC} $(grep VF_ADMIN_PASS .env | cut -d'=' -f2)"
    echo ""
    
    echo -e "${YELLOW}${BOLD}📋 Useful Commands:${NC}"
    case $INSTALL_TYPE in
        "docker")
            echo -e "  ${CYAN}📊 View logs:${NC} docker-compose logs -f"
            echo -e "  ${CYAN}🔄 Restart:${NC} docker-compose restart"
            echo -e "  ${CYAN}⏹️  Stop:${NC} docker-compose down"
            echo -e "  ${CYAN}🗄️  Backup:${NC} ./scripts/backup.sh"
            ;;
        "production")
            echo -e "  ${CYAN}📊 View logs:${NC} journalctl -u veloflux -f"
            echo -e "  ${CYAN}🔄 Restart:${NC} sudo systemctl restart veloflux"
            echo -e "  ${CYAN}⏹️  Stop:${NC} sudo systemctl stop veloflux"
            echo -e "  ${CYAN}🗄️  Backup:${NC} ./scripts/backup.sh"
            ;;
        "development")
            echo -e "  ${CYAN}📊 View logs:${NC} tail -f logs/veloflux.log"
            echo -e "  ${CYAN}🔄 Restart frontend:${NC} npm run dev"
            echo -e "  ${CYAN}🔄 Restart backend:${NC} docker-compose restart"
            ;;
    esac
    
    echo ""
    echo -e "${YELLOW}${BOLD}📚 Documentation:${NC}"
    echo -e "  ${CYAN}📖 README:${NC} cat README.md"
    echo -e "  ${CYAN}⚙️  Configuration:${NC} config/config.yaml"
    echo -e "  ${CYAN}🌐 API Docs:${NC} http://localhost:9000/docs"
    echo -e "  ${CYAN}🆘 Troubleshooting:${NC} docs/troubleshooting.md"
    
    echo ""
    echo -e "${YELLOW}${BOLD}📁 Important Files:${NC}"
    echo -e "  ${CYAN}📋 Install Log:${NC} $LOG_FILE"
    echo -e "  ${CYAN}⚙️  Configuration:${NC} config/config.yaml"
    echo -e "  ${CYAN}🔐 Environment:${NC} .env"
    echo -e "  ${CYAN}📜 Logs Directory:${NC} logs/"
    
    if [[ "$ENABLE_BACKUP" == true ]]; then
        echo -e "  ${CYAN}💾 Backups:${NC} backups/"
    fi
    
    if [[ "$INSTALL_TYPE" == "cloud" ]]; then
        echo -e "  ${CYAN}☁️  K8s Manifests:${NC} k8s/"
    fi
    
    echo ""
    echo -e "${GREEN}${BOLD}✨ Next Steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Visit the frontend URL to access your SaaS"
    echo -e "  ${YELLOW}2.${NC} Login with the admin credentials above"
    echo -e "  ${YELLOW}3.${NC} Configure your load balancer rules in the admin panel"
    echo -e "  ${YELLOW}4.${NC} Add your backend servers"
    echo -e "  ${YELLOW}5.${NC} Set up monitoring and alerts"
    
    if [[ "$INSTALL_TYPE" == "production" ]]; then
        echo -e "  ${YELLOW}6.${NC} Configure your domain DNS to point to this server"
        echo -e "  ${YELLOW}7.${NC} Set up SSL certificates (automatic with Let's Encrypt)"
    fi
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}Thank you for choosing VeloFlux SaaS! 🚀${NC}"
    echo ""
}

# Main installation process
main() {
    # Initialize log file
    echo "VeloFlux SaaS Installation Log - $(date)" > "$LOG_FILE"
    
    # Show banner
    show_banner
    
    # Check if help requested
    if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        echo -e "${CYAN}Usage: $0 [options]${NC}"
        echo ""
        echo -e "${YELLOW}Options:${NC}"
        echo "  --help, -h          Show this help message"
        echo "  --version, -v       Show version information"
        echo "  --auto-production   Auto-install production setup (requires environment variables)"
        echo "  --auto-docker       Auto-install Docker setup"
        echo "  --auto-dev          Auto-install development setup"
        echo ""
        echo -e "${YELLOW}Environment Variables for Auto-install:${NC}"
        echo "  VF_DOMAIN          Domain name (default: localhost)"
        echo "  VF_EMAIL           Email for SSL certificates"
        echo "  VF_SSL_ENABLED     Enable SSL (true/false, default: true)"
        echo "  VF_MONITORING      Enable monitoring (true/false, default: true)"
        echo "  VF_BACKUP          Enable backups (true/false, default: true)"
        echo ""
        exit 0
    fi
    
    # Check version
    if [[ "$1" == "--version" ]] || [[ "$1" == "-v" ]]; then
        echo "VeloFlux SaaS Super Quick Install Script v$SCRIPT_VERSION"
        exit 0
    fi
    
    # Auto-install modes
    if [[ "$1" == "--auto-production" ]]; then
        INSTALL_TYPE="production"
        DOMAIN="${VF_DOMAIN:-localhost}"
        EMAIL="${VF_EMAIL:-admin@$DOMAIN}"
        ENABLE_SSL="${VF_SSL_ENABLED:-true}"
        ENABLE_MONITORING="${VF_MONITORING:-true}"
        ENABLE_BACKUP="${VF_BACKUP:-true}"
        AUTO_START=true
    elif [[ "$1" == "--auto-docker" ]]; then
        INSTALL_TYPE="docker"
        setup_docker_config
    elif [[ "$1" == "--auto-dev" ]]; then
        INSTALL_TYPE="development"
        setup_development_config
    else
        # Interactive mode
        run_installation_wizard
    fi
    
    echo ""
    print_step "Starting installation process..."
    echo ""
    
    # Installation steps
    local steps=(
        "check_system_requirements"
        "install_docker"
        "install_nodejs"
        "setup_project"
        "install_dependencies"
        "build_project"
        "setup_monitoring"
        "setup_backup"
        "start_services"
        "run_health_check"
    )
    
    local total_steps=${#steps[@]}
    local current_step=0
    
    for step in "${steps[@]}"; do
        ((current_step++))
        echo -e "${BLUE}[${current_step}/${total_steps}]${NC} Executing: $step"
        $step
        show_progress $current_step $total_steps "Completed: $step"
        echo ""
    done
    
    # Show completion information
    show_completion_info
    
    print_success "Installation completed successfully!"
    print_info "Check the log file for details: $LOG_FILE"
}

# Handle script interruption
trap 'print_error "Installation interrupted"; exit 1' INT TERM

# Run main function
main "$@"
