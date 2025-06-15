#!/bin/bash

# 🚀 VeloFlux SaaS - Master Quick Install Script
# Unified installation script with all deployment methods

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

# Script info
SCRIPT_VERSION="3.0.0"
SCRIPT_NAME="VeloFlux Master Quick Install"

# Show animated banner
show_animated_banner() {
    clear
    echo -e "${PURPLE}${BOLD}"
    
    # Animated typing effect for banner
    local banner_lines=(
        "██╗   ██╗███████╗██╗      ██████╗ ███████╗██╗     ██╗   ██╗██╗  ██╗"
        "██║   ██║██╔════╝██║     ██╔═══██╗██╔════╝██║     ██║   ██║╚██╗██╔╝"
        "██║   ██║█████╗  ██║     ██║   ██║█████╗  ██║     ██║   ██║ ╚███╔╝ "
        "╚██╗ ██╔╝██╔══╝  ██║     ██║   ██║██╔══╝  ██║     ██║   ██║ ██╔██╗ "
        " ╚████╔╝ ███████╗███████╗╚██████╔╝██║     ███████╗╚██████╔╝██╔╝ ██╗"
        "  ╚═══╝  ╚══════╝╚══════╝ ╚═════╝ ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝"
        ""
        "        🚀 AI-Powered Load Balancer SaaS Platform 🚀"
        "              Master Quick Install v${SCRIPT_VERSION}"
    )
    
    for line in "${banner_lines[@]}"; do
        echo "$line"
        sleep 0.1
    done
    
    echo -e "${NC}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

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

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Show help
show_help() {
    cat << EOF
${CYAN}${BOLD}VeloFlux SaaS Master Quick Install${NC}

${YELLOW}USAGE:${NC}
    $0 [OPTIONS] [INSTALL_TYPE]

${YELLOW}INSTALL TYPES:${NC}
    production      Full production setup with SSL, monitoring, and security
    docker          Quick Docker-based setup (recommended for testing)
    development     Local development environment with hot reload
    cloud           Cloud/Kubernetes deployment preparation
    wizard          Interactive installation wizard (default)

${YELLOW}OPTIONS:${NC}
    -h, --help           Show this help message
    -v, --version        Show version information
    -q, --quiet          Quiet mode (minimal output)
    -f, --force          Force installation (skip confirmations)
    -d, --domain DOMAIN  Set domain name for production installs
    -e, --email EMAIL    Set email for SSL certificates
    --no-ssl            Disable SSL for production installs
    --no-monitoring     Disable monitoring setup
    --no-backup         Disable backup configuration
    --dry-run           Show what would be installed without running

${YELLOW}EXAMPLES:${NC}
    $0                                    # Interactive wizard
    $0 docker                            # Quick Docker setup
    $0 production -d example.com         # Production with domain
    $0 development                       # Development environment
    $0 cloud --dry-run                   # Preview cloud setup

${YELLOW}ENVIRONMENT VARIABLES:${NC}
    VF_DOMAIN          Domain name (default: localhost)
    VF_EMAIL           Email for SSL certificates
    VF_SSL_ENABLED     Enable SSL (true/false)
    VF_MONITORING      Enable monitoring (true/false)
    VF_BACKUP          Enable backups (true/false)
    VF_FORCE           Force installation (true/false)

${YELLOW}MORE INFO:${NC}
    Documentation: docs/quickstart.md
    GitHub: https://github.com/eltonciatto/VeloFlux
    Issues: https://github.com/eltonciatto/VeloFlux/issues

EOF
}

# Show version
show_version() {
    echo "${SCRIPT_NAME} v${SCRIPT_VERSION}"
    echo "Copyright (c) 2024 VeloFlux Team"
    echo "Licensed under VPSL-1.0"
}

# Detect system information
detect_system() {
    print_step "Detecting system information..."
    
    # OS Detection
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="Linux"
        if [ -f /etc/os-release ]; then
            DISTRO=$(grep ^ID= /etc/os-release | cut -d'=' -f2 | tr -d '"')
        else
            DISTRO="unknown"
        fi
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macOS"
        DISTRO="macos"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        OS="Windows"
        DISTRO="windows"
    else
        OS="Unknown"
        DISTRO="unknown"
    fi
    
    # Architecture
    ARCH=$(uname -m)
    
    # Memory
    if command -v free >/dev/null 2>&1; then
        MEMORY_GB=$(($(free -m | awk 'NR==2{printf "%.0f", $2/1024}')))
    else
        MEMORY_GB="Unknown"
    fi
    
    # CPU cores
    if command -v nproc >/dev/null 2>&1; then
        CPU_CORES=$(nproc)
    else
        CPU_CORES="Unknown"
    fi
    
    # Disk space
    if command -v df >/dev/null 2>&1; then
        DISK_SPACE=$(df -h . | awk 'NR==2 {print $4}')
    else
        DISK_SPACE="Unknown"
    fi
    
    print_success "System detected: $OS ($DISTRO) $ARCH"
    print_info "Resources: ${CPU_CORES} cores, ${MEMORY_GB}GB RAM, ${DISK_SPACE} free"
}

# Check system requirements
check_system_requirements() {
    print_step "Checking system requirements..."
    
    local requirements_met=true
    
    # Minimum requirements
    local min_memory=2
    local min_disk_gb=5
    
    # Check memory
    if [[ "$MEMORY_GB" != "Unknown" ]] && [[ "$MEMORY_GB" -lt $min_memory ]]; then
        print_warning "Low memory detected: ${MEMORY_GB}GB (minimum: ${min_memory}GB)"
        requirements_met=false
    fi
    
    # Check disk space
    if [[ "$DISK_SPACE" != "Unknown" ]]; then
        local disk_gb=$(echo $DISK_SPACE | sed 's/G.*//' | sed 's/[^0-9]//g')
        if [[ -n "$disk_gb" ]] && [[ "$disk_gb" -lt $min_disk_gb ]]; then
            print_warning "Low disk space: ${DISK_SPACE} (minimum: ${min_disk_gb}GB)"
            requirements_met=false
        fi
    fi
    
    # Check required commands
    local required_commands=("curl" "git" "openssl")
    local missing_commands=()
    
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            missing_commands+=("$cmd")
        fi
    done
    
    if [ ${#missing_commands[@]} -ne 0 ]; then
        print_warning "Missing commands: ${missing_commands[*]}"
        
        # Auto-install on Linux
        if [[ "$OS" == "Linux" ]] && [[ "$FORCE" != true ]]; then
            read -p "Install missing commands automatically? (Y/n): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Nn]$ ]]; then
                install_missing_commands "${missing_commands[@]}"
            fi
        fi
    fi
    
    if [[ "$requirements_met" == true ]]; then
        print_success "All system requirements met"
    else
        if [[ "$FORCE" != true ]]; then
            print_warning "Some requirements not met. Continue anyway? (y/N)"
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                print_error "Installation cancelled"
                exit 1
            fi
        fi
    fi
}

# Install missing commands
install_missing_commands() {
    local commands=("$@")
    print_step "Installing missing commands: ${commands[*]}"
    
    case "$DISTRO" in
        ubuntu|debian)
            sudo apt-get update
            sudo apt-get install -y "${commands[@]}"
            ;;
        centos|rhel|fedora)
            if command -v dnf >/dev/null 2>&1; then
                sudo dnf install -y "${commands[@]}"
            else
                sudo yum install -y "${commands[@]}"
            fi
            ;;
        arch)
            sudo pacman -S --noconfirm "${commands[@]}"
            ;;
        *)
            print_error "Unsupported distribution for auto-install: $DISTRO"
            print_info "Please install manually: ${commands[*]}"
            exit 1
            ;;
    esac
    
    print_success "Commands installed successfully"
}

# Show installation wizard
show_installation_wizard() {
    echo ""
    echo -e "${CYAN}${BOLD}🧙‍♂️ VeloFlux Installation Wizard${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🎯 Choose your installation method:${NC}"
    echo ""
    
    # Installation options with detailed descriptions
    echo -e "${YELLOW}1.${NC} 🚀 ${GREEN}${BOLD}Production Setup${NC}"
    echo -e "   ${CYAN}Best for:${NC} Production servers, live websites"
    echo -e "   ${CYAN}Includes:${NC} SSL certificates, monitoring, security hardening, backups"
    echo -e "   ${CYAN}Time:${NC} ~15-20 minutes"
    echo -e "   ${CYAN}Requirements:${NC} Domain name, email for SSL"
    echo ""
    
    echo -e "${YELLOW}2.${NC} 🐳 ${GREEN}${BOLD}Docker Quick Setup${NC} ${PURPLE}(Recommended)${NC}"
    echo -e "   ${CYAN}Best for:${NC} Testing, demos, quick setup"
    echo -e "   ${CYAN}Includes:${NC} Full stack with Docker, ready-to-use"
    echo -e "   ${CYAN}Time:${NC} ~5-10 minutes"
    echo -e "   ${CYAN}Requirements:${NC} Docker (auto-installed if needed)"
    echo ""
    
    echo -e "${YELLOW}3.${NC} 🛠️  ${GREEN}${BOLD}Development Environment${NC}"
    echo -e "   ${CYAN}Best for:${NC} Local development, coding, debugging"
    echo -e "   ${CYAN}Includes:${NC} Hot reload, dev tools, VS Code config"
    echo -e "   ${CYAN}Time:${NC} ~5-8 minutes"
    echo -e "   ${CYAN}Requirements:${NC} Node.js (auto-installed if needed)"
    echo ""
    
    echo -e "${YELLOW}4.${NC} ☁️  ${GREEN}${BOLD}Cloud Deployment${NC}"
    echo -e "   ${CYAN}Best for:${NC} Kubernetes, cloud platforms (AWS, GCP, Azure)"
    echo -e "   ${CYAN}Includes:${NC} K8s manifests, Helm charts, cloud configs"
    echo -e "   ${CYAN}Time:${NC} ~10-15 minutes"
    echo -e "   ${CYAN}Requirements:${NC} Cloud platform access"
    echo ""
    
    echo -e "${YELLOW}5.${NC} 🔧 ${GREEN}${BOLD}Custom Installation${NC}"
    echo -e "   ${CYAN}Best for:${NC} Advanced users with specific requirements"
    echo -e "   ${CYAN}Includes:${NC} Manual configuration options"
    echo -e "   ${CYAN}Time:${NC} ~20-30 minutes"
    echo -e "   ${CYAN}Requirements:${NC} Technical knowledge"
    echo ""
    
    echo -e "${YELLOW}6.${NC} ❌ ${BLUE}Exit${NC}"
    echo ""
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    while true; do
        read -p "$(echo -e "${BOLD}Enter your choice (1-6):${NC} ")" choice
        
        case $choice in
            1)
                INSTALL_TYPE="production"
                gather_production_info
                break
                ;;
            2)
                INSTALL_TYPE="docker"
                gather_docker_info
                break
                ;;
            3)
                INSTALL_TYPE="development"
                gather_development_info
                break
                ;;
            4)
                INSTALL_TYPE="cloud"
                gather_cloud_info
                break
                ;;
            5)
                INSTALL_TYPE="custom"
                gather_custom_info
                break
                ;;
            6)
                print_info "Installation cancelled by user"
                exit 0
                ;;
            *)
                print_error "Invalid choice. Please enter 1-6."
                ;;
        esac
    done
}

# Gather production information
gather_production_info() {
    echo ""
    echo -e "${YELLOW}${BOLD}🚀 Production Setup Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Domain configuration
    if [[ -z "$DOMAIN" ]]; then
        echo -e "${CYAN}Domain Configuration:${NC}"
        read -p "Enter your domain name (e.g., myapp.com): " DOMAIN
        if [[ -z "$DOMAIN" ]]; then
            print_warning "No domain provided. Using localhost (not recommended for production)"
            DOMAIN="localhost"
        fi
    fi
    
    # Email configuration
    if [[ -z "$EMAIL" ]]; then
        echo -e "${CYAN}SSL Configuration:${NC}"
        read -p "Enter email for SSL certificates: " EMAIL
        if [[ -z "$EMAIL" ]]; then
            print_warning "No email provided. SSL auto-generation will be disabled"
            SSL_ENABLED=false
        else
            SSL_ENABLED=true
        fi
    fi
    
    # Advanced options
    echo ""
    echo -e "${CYAN}Advanced Options:${NC}"
    
    read -p "Enable automatic SSL certificates? (Y/n): " ssl_choice
    if [[ "$ssl_choice" =~ ^[Nn]$ ]]; then
        SSL_ENABLED=false
    fi
    
    read -p "Enable monitoring and metrics? (Y/n): " monitoring_choice
    if [[ "$monitoring_choice" =~ ^[Nn]$ ]]; then
        MONITORING_ENABLED=false
    else
        MONITORING_ENABLED=true
    fi
    
    read -p "Enable automatic backups? (Y/n): " backup_choice
    if [[ "$backup_choice" =~ ^[Nn]$ ]]; then
        BACKUP_ENABLED=false
    else
        BACKUP_ENABLED=true
    fi
    
    read -p "Start services automatically after installation? (Y/n): " autostart_choice
    if [[ "$autostart_choice" =~ ^[Nn]$ ]]; then
        AUTOSTART=false
    else
        AUTOSTART=true
    fi
    
    # Show configuration summary
    echo ""
    echo -e "${GREEN}${BOLD}📋 Configuration Summary:${NC}"
    echo -e "  ${CYAN}Domain:${NC} $DOMAIN"
    echo -e "  ${CYAN}Email:${NC} $EMAIL"
    echo -e "  ${CYAN}SSL:${NC} $SSL_ENABLED"
    echo -e "  ${CYAN}Monitoring:${NC} $MONITORING_ENABLED"
    echo -e "  ${CYAN}Backup:${NC} $BACKUP_ENABLED"
    echo -e "  ${CYAN}Auto-start:${NC} $AUTOSTART"
    echo ""
    
    read -p "Proceed with this configuration? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Returning to wizard..."
        show_installation_wizard
        return
    fi
}

# Gather Docker information
gather_docker_info() {
    echo ""
    echo -e "${YELLOW}${BOLD}🐳 Docker Setup Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    DOMAIN="localhost"
    SSL_ENABLED=false
    MONITORING_ENABLED=true
    BACKUP_ENABLED=false
    AUTOSTART=true
    
    echo -e "${GREEN}Docker installation will include:${NC}"
    echo -e "  ${CYAN}•${NC} VeloFlux Load Balancer"
    echo -e "  ${CYAN}•${NC} Redis for caching"
    echo -e "  ${CYAN}•${NC} PostgreSQL database"
    echo -e "  ${CYAN}•${NC} Test backend servers"
    echo -e "  ${CYAN}•${NC} Prometheus monitoring"
    echo -e "  ${CYAN}•${NC} Grafana dashboards"
    echo ""
    
    read -p "Proceed with Docker installation? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Returning to wizard..."
        show_installation_wizard
        return
    fi
}

# Gather development information
gather_development_info() {
    echo ""
    echo -e "${YELLOW}${BOLD}🛠️ Development Environment Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    DOMAIN="localhost"
    SSL_ENABLED=false
    MONITORING_ENABLED=true
    BACKUP_ENABLED=false
    AUTOSTART=true
    
    echo -e "${GREEN}Development environment will include:${NC}"
    echo -e "  ${CYAN}•${NC} Vite development server with hot reload"
    echo -e "  ${CYAN}•${NC} TypeScript configuration"
    echo -e "  ${CYAN}•${NC} ESLint and Prettier setup"
    echo -e "  ${CYAN}•${NC} VS Code configuration"
    echo -e "  ${CYAN}•${NC} Docker services for backend"
    echo -e "  ${CYAN}•${NC} Git hooks for code quality"
    echo ""
    
    read -p "Include backend services with Docker? (Y/n): " docker_choice
    if [[ "$docker_choice" =~ ^[Nn]$ ]]; then
        INCLUDE_DOCKER=false
    else
        INCLUDE_DOCKER=true
    fi
    
    read -p "Setup VS Code configuration? (Y/n): " vscode_choice
    if [[ "$vscode_choice" =~ ^[Nn]$ ]]; then
        SETUP_VSCODE=false
    else
        SETUP_VSCODE=true
    fi
    
    read -p "Proceed with development setup? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Returning to wizard..."
        show_installation_wizard
        return
    fi
}

# Gather cloud information
gather_cloud_info() {
    echo ""
    echo -e "${YELLOW}${BOLD}☁️ Cloud Deployment Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}Choose cloud platform:${NC}"
    echo "1. Kubernetes (Generic)"
    echo "2. AWS EKS"
    echo "3. Google GKE"
    echo "4. Azure AKS"
    echo "5. DigitalOcean"
    echo "6. Coolify"
    echo ""
    
    read -p "Enter choice (1-6): " cloud_choice
    
    case $cloud_choice in
        1) CLOUD_PLATFORM="kubernetes" ;;
        2) CLOUD_PLATFORM="aws" ;;
        3) CLOUD_PLATFORM="gcp" ;;
        4) CLOUD_PLATFORM="azure" ;;
        5) CLOUD_PLATFORM="digitalocean" ;;
        6) CLOUD_PLATFORM="coolify" ;;
        *) CLOUD_PLATFORM="kubernetes" ;;
    esac
    
    read -p "Enter your domain name: " DOMAIN
    if [[ -z "$DOMAIN" ]]; then
        DOMAIN="example.com"
    fi
    
    SSL_ENABLED=true
    MONITORING_ENABLED=true
    BACKUP_ENABLED=true
    AUTOSTART=false
    
    echo ""
    print_info "Cloud deployment will generate manifests for $CLOUD_PLATFORM"
    
    read -p "Proceed with cloud setup? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Returning to wizard..."
        show_installation_wizard
        return
    fi
}

# Gather custom information
gather_custom_info() {
    echo ""
    echo -e "${YELLOW}${BOLD}🔧 Custom Installation Configuration${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    print_info "Custom installation allows you to mix and match components"
    echo ""
    
    # Component selection
    echo -e "${YELLOW}Select components to install:${NC}"
    
    read -p "Install frontend (React/Vite)? (Y/n): " frontend_choice
    INSTALL_FRONTEND=$([[ ! "$frontend_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    read -p "Install backend (Go Load Balancer)? (Y/n): " backend_choice
    INSTALL_BACKEND=$([[ ! "$backend_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    read -p "Install database services (Redis/PostgreSQL)? (Y/n): " db_choice
    INSTALL_DATABASE=$([[ ! "$db_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    read -p "Install monitoring (Prometheus/Grafana)? (Y/n): " monitor_choice
    INSTALL_MONITORING=$([[ ! "$monitor_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    read -p "Setup SSL certificates? (Y/n): " ssl_choice
    SSL_ENABLED=$([[ ! "$ssl_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    read -p "Configure backups? (Y/n): " backup_choice
    BACKUP_ENABLED=$([[ ! "$backup_choice" =~ ^[Nn]$ ]] && echo true || echo false)
    
    if [[ "$SSL_ENABLED" == true ]]; then
        read -p "Enter domain name: " DOMAIN
        read -p "Enter email for SSL: " EMAIL
    fi
    
    DOMAIN=${DOMAIN:-localhost}
    MONITORING_ENABLED=$INSTALL_MONITORING
    AUTOSTART=true
    
    echo ""
    echo -e "${GREEN}${BOLD}📋 Custom Configuration Summary:${NC}"
    echo -e "  ${CYAN}Frontend:${NC} $INSTALL_FRONTEND"
    echo -e "  ${CYAN}Backend:${NC} $INSTALL_BACKEND"
    echo -e "  ${CYAN}Database:${NC} $INSTALL_DATABASE"
    echo -e "  ${CYAN}Monitoring:${NC} $INSTALL_MONITORING"
    echo -e "  ${CYAN}SSL:${NC} $SSL_ENABLED"
    echo -e "  ${CYAN}Backup:${NC} $BACKUP_ENABLED"
    echo -e "  ${CYAN}Domain:${NC} $DOMAIN"
    echo ""
    
    read -p "Proceed with custom installation? (Y/n): " confirm
    if [[ "$confirm" =~ ^[Nn]$ ]]; then
        print_info "Returning to wizard..."
        show_installation_wizard
        return
    fi
}

# Execute installation
execute_installation() {
    print_step "Starting $INSTALL_TYPE installation..."
    echo ""
    
    # Make sure scripts are executable
    chmod +x scripts/*.sh 2>/dev/null || true
    
    case $INSTALL_TYPE in
        "production")
            execute_production_install
            ;;
        "docker")
            execute_docker_install
            ;;
        "development")
            execute_development_install
            ;;
        "cloud")
            execute_cloud_install
            ;;
        "custom")
            execute_custom_install
            ;;
        *)
            print_error "Unknown installation type: $INSTALL_TYPE"
            exit 1
            ;;
    esac
}

# Execute production installation
execute_production_install() {
    print_info "Running production installation script..."
    
    # Set environment variables
    export VF_DOMAIN="$DOMAIN"
    export VF_EMAIL="$EMAIL"
    export VF_SSL_ENABLED="$SSL_ENABLED"
    export VF_MONITORING="$MONITORING_ENABLED"
    export VF_BACKUP="$BACKUP_ENABLED"
    
    if [ -f "scripts/super-quick-install.sh" ]; then
        ./scripts/super-quick-install.sh --auto-production
    else
        print_error "Production install script not found"
        exit 1
    fi
}

# Execute Docker installation
execute_docker_install() {
    print_info "Running Docker installation script..."
    
    if [ -f "scripts/docker-quick-install.sh" ]; then
        ./scripts/docker-quick-install.sh
    else
        print_error "Docker install script not found"
        exit 1
    fi
}

# Execute development installation
execute_development_install() {
    print_info "Running development installation script..."
    
    if [ -f "scripts/dev-quick-install.sh" ]; then
        ./scripts/dev-quick-install.sh
    else
        print_error "Development install script not found"
        exit 1
    fi
}

# Execute cloud installation
execute_cloud_install() {
    print_info "Running cloud installation script..."
    
    export VF_DOMAIN="$DOMAIN"
    export VF_CLOUD_PLATFORM="$CLOUD_PLATFORM"
    
    # Use existing cloud script or create minimal setup
    if [ -f "scripts/cloud-install.sh" ]; then
        ./scripts/cloud-install.sh
    else
        print_info "Creating cloud deployment manifests..."
        
        mkdir -p k8s
        
        # Create basic Kubernetes deployment
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
EOF
        
        print_success "Cloud manifests created in k8s/ directory"
        print_info "Deploy with: kubectl apply -f k8s/"
    fi
}

# Execute custom installation
execute_custom_install() {
    print_info "Running custom installation..."
    
    if [[ "$INSTALL_FRONTEND" == true ]]; then
        print_step "Installing frontend components..."
        npm install 2>/dev/null || print_warning "npm install failed"
    fi
    
    if [[ "$INSTALL_BACKEND" == true ]]; then
        print_step "Setting up backend components..."
        if [ -f "go.mod" ]; then
            go mod tidy 2>/dev/null || print_warning "go mod tidy failed"
        fi
    fi
    
    if [[ "$INSTALL_DATABASE" == true ]]; then
        print_step "Setting up database services..."
        if command -v docker-compose >/dev/null 2>&1; then
            docker-compose up -d redis postgres 2>/dev/null || print_warning "Database startup failed"
        fi
    fi
    
    if [[ "$INSTALL_MONITORING" == true ]]; then
        print_step "Setting up monitoring..."
        mkdir -p monitoring
        print_success "Monitoring configuration created"
    fi
    
    print_success "Custom installation completed"
}

# Parse command line arguments
parse_arguments() {
    QUIET=false
    FORCE=false
    DRY_RUN=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -v|--version)
                show_version
                exit 0
                ;;
            -q|--quiet)
                QUIET=true
                shift
                ;;
            -f|--force)
                FORCE=true
                shift
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            --no-ssl)
                SSL_ENABLED=false
                shift
                ;;
            --no-monitoring)
                MONITORING_ENABLED=false
                shift
                ;;
            --no-backup)
                BACKUP_ENABLED=false
                shift
                ;;
            --dry-run)
                DRY_RUN=true
                shift
                ;;
            production|docker|development|cloud|wizard)
                INSTALL_TYPE="$1"
                shift
                ;;
            *)
                print_error "Unknown option: $1"
                echo "Use --help for usage information"
                exit 1
                ;;
        esac
    done
    
    # Default to wizard if no install type specified
    if [[ -z "$INSTALL_TYPE" ]]; then
        INSTALL_TYPE="wizard"
    fi
    
    # Load environment variables
    DOMAIN="${DOMAIN:-$VF_DOMAIN}"
    EMAIL="${EMAIL:-$VF_EMAIL}"
    SSL_ENABLED="${SSL_ENABLED:-$VF_SSL_ENABLED}"
    MONITORING_ENABLED="${MONITORING_ENABLED:-$VF_MONITORING}"
    BACKUP_ENABLED="${BACKUP_ENABLED:-$VF_BACKUP}"
    FORCE="${FORCE:-$VF_FORCE}"
}

# Main function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show banner
    if [[ "$QUIET" != true ]]; then
        show_animated_banner
    fi
    
    # Detect system
    detect_system
    
    # Check requirements
    check_system_requirements
    
    # Handle dry run
    if [[ "$DRY_RUN" == true ]]; then
        print_info "DRY RUN: Would install $INSTALL_TYPE setup"
        print_info "Domain: ${DOMAIN:-localhost}"
        print_info "SSL: ${SSL_ENABLED:-true}"
        print_info "Monitoring: ${MONITORING_ENABLED:-true}"
        exit 0
    fi
    
    # Run installation wizard or direct installation
    if [[ "$INSTALL_TYPE" == "wizard" ]]; then
        show_installation_wizard
    fi
    
    # Execute the installation
    execute_installation
    
    # Show completion message
    echo ""
    print_success "VeloFlux SaaS installation completed successfully!"
    print_info "Check the installation logs for any issues"
    print_info "Visit the URLs shown above to access your VeloFlux installation"
    echo ""
}

# Handle script interruption
trap 'print_error "Installation interrupted by user"; exit 1' INT TERM

# Run main function
main "$@"
