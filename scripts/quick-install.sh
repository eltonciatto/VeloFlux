#!/bin/bash

# 🚀 VeloFlux SaaS - Quick Install Script
# Complete setup for production-ready SaaS deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Script info
SCRIPT_VERSION="1.0.0"
PROJECT_NAME="VeloFlux SaaS"

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🚀 $PROJECT_NAME - Quick Install Script v$SCRIPT_VERSION${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Function to print status
print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to install Docker if not present
install_docker() {
    if command_exists docker; then
        print_success "Docker is already installed"
        docker --version
    else
        print_step "Installing Docker..."
        
        # Detect OS
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker $USER
            rm get-docker.sh
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            print_error "Please install Docker Desktop for macOS from https://docker.com/products/docker-desktop"
            exit 1
        else
            print_error "Unsupported OS. Please install Docker manually."
            exit 1
        fi
        
        print_success "Docker installed successfully"
    fi
}

# Function to install Docker Compose if not present
install_docker_compose() {
    if command_exists docker-compose || docker compose version >/dev/null 2>&1; then
        print_success "Docker Compose is available"
    else
        print_step "Installing Docker Compose..."
        
        # Install via pip if available
        if command_exists pip3; then
            pip3 install docker-compose
        elif command_exists pip; then
            pip install docker-compose
        else
            # Download binary
            sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
        
        print_success "Docker Compose installed successfully"
    fi
}

# Function to install Node.js if not present
install_nodejs() {
    if command_exists node; then
        print_success "Node.js is already installed"
        node --version
    else
        print_step "Installing Node.js..."
        
        # Install Node.js via NodeSource
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - recommend using Homebrew
            if command_exists brew; then
                brew install node
            else
                print_error "Please install Node.js from https://nodejs.org or install Homebrew first"
                exit 1
            fi
        fi
        
        print_success "Node.js installed successfully"
    fi
}

# Function to setup environment variables
setup_environment() {
    print_step "Setting up environment variables..."
    
    if [ ! -f .env ]; then
        cp .env.example .env
        print_success "Created .env file from template"
    else
        print_warning ".env file already exists, skipping..."
    fi
    
    # Prompt for production settings
    echo ""
    echo -e "${YELLOW}Please configure your production environment:${NC}"
    
    read -p "Enter your domain (e.g., yourdomain.com): " DOMAIN
    read -p "Enter your API subdomain (e.g., api): " API_SUBDOMAIN
    read -p "Enter your admin subdomain (e.g., admin): " ADMIN_SUBDOMAIN
    read -s -p "Enter admin password: " ADMIN_PASSWORD
    echo ""
    
    # Update .env file
    sed -i.bak "s|VITE_PROD_API_URL=.*|VITE_PROD_API_URL=https://${API_SUBDOMAIN}.${DOMAIN}|g" .env
    sed -i.bak "s|VITE_PROD_ADMIN_URL=.*|VITE_PROD_ADMIN_URL=https://${ADMIN_SUBDOMAIN}.${DOMAIN}|g" .env
    sed -i.bak "s|VF_ADMIN_PASS=.*|VF_ADMIN_PASS=${ADMIN_PASSWORD}|g" .env
    sed -i.bak "s|VITE_MODE=.*|VITE_MODE=production|g" .env
    
    print_success "Environment variables configured"
}

# Function to install dependencies
install_dependencies() {
    print_step "Installing Node.js dependencies..."
    
    if [ -f package-lock.json ]; then
        npm ci
    else
        npm install
    fi
    
    print_success "Dependencies installed successfully"
}

# Function to build the project
build_project() {
    print_step "Building the project..."
    
    npm run build
    
    print_success "Project built successfully"
}

# Function to setup SSL certificates
setup_ssl() {
    print_step "Setting up SSL certificates..."
    
    mkdir -p certs
    
    echo ""
    echo -e "${YELLOW}SSL Certificate Setup:${NC}"
    echo "1. Use existing certificates"
    echo "2. Generate self-signed certificates (for testing)"
    echo "3. Skip SSL setup (configure later)"
    
    read -p "Choose option (1-3): " SSL_OPTION
    
    case $SSL_OPTION in
        1)
            echo "Please place your certificate files in the ./certs directory:"
            echo "  - server.crt (certificate file)"
            echo "  - server.key (private key file)"
            read -p "Press Enter when files are ready..."
            ;;
        2)
            print_step "Generating self-signed certificates..."
            openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt -days 365 -nodes \
                -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
            print_success "Self-signed certificates generated"
            ;;
        3)
            print_warning "SSL setup skipped. Remember to configure certificates before production use."
            ;;
        *)
            print_error "Invalid option"
            exit 1
            ;;
    esac
}

# Function to setup configuration
setup_config() {
    print_step "Setting up VeloFlux configuration..."
    
    if [ ! -f config/config.yaml ]; then
        cp config/config.example.yaml config/config.yaml
        print_success "Created config.yaml from template"
    else
        print_warning "config.yaml already exists, skipping..."
    fi
    
    print_status "Configuration file ready for customization at config/config.yaml"
}

# Function to start services
start_services() {
    print_step "Starting VeloFlux services..."
    
    # Build and start services
    docker-compose build
    docker-compose up -d
    
    print_success "Services started successfully"
    
    # Wait a moment for services to initialize
    print_status "Waiting for services to initialize..."
    sleep 10
    
    # Check service health
    print_step "Checking service health..."
    
    if curl -f http://localhost:8080/health >/dev/null 2>&1; then
        print_success "VeloFlux is running and healthy!"
    else
        print_warning "VeloFlux may still be starting up. Check logs with: docker-compose logs"
    fi
}

# Function to display final information
show_final_info() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 VeloFlux SaaS Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📊 Access Points:${NC}"
    echo -e "  🌐 Load Balancer:    http://localhost"
    echo -e "  📈 Metrics:          http://localhost:8080"
    echo -e "  ⚙️  Admin API:        http://localhost:9000"
    echo -e "  🎯 Frontend:         http://localhost:3000 (if using dev server)"
    echo ""
    echo -e "${BLUE}🐳 Docker Commands:${NC}"
    echo -e "  📋 View logs:        docker-compose logs -f"
    echo -e "  🔄 Restart:          docker-compose restart"
    echo -e "  ⏹️  Stop:             docker-compose down"
    echo -e "  🗑️  Clean install:    docker-compose down -v && docker-compose up -d"
    echo ""
    echo -e "${BLUE}📁 Important Files:${NC}"
    echo -e "  🔧 Configuration:    config/config.yaml"
    echo -e "  🌍 Environment:      .env"
    echo -e "  🔐 SSL Certs:        certs/"
    echo -e "  📖 Documentation:    docs/"
    echo ""
    echo -e "${BLUE}🆘 Need Help?${NC}"
    echo -e "  📚 Documentation:    https://github.com/eltonciatto/VeloFlux/docs"
    echo -e "  🐛 Issues:           https://github.com/eltonciatto/VeloFlux/issues"
    echo -e "  💬 Discord:          https://discord.gg/veloflux"
    echo ""
    echo -e "${YELLOW}⚠️  Next Steps:${NC}"
    echo -e "  1. Customize config/config.yaml for your backends"
    echo -e "  2. Configure DNS to point to your server"
    echo -e "  3. Setup proper SSL certificates for production"
    echo -e "  4. Configure monitoring and backups"
    echo ""
    echo -e "${GREEN}Happy Load Balancing! 🚀${NC}"
}

# Main installation process
main() {
    print_status "Starting VeloFlux SaaS installation..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the VeloFlux project root directory"
        exit 1
    fi
    
    # System requirements check
    print_step "Checking system requirements..."
    
    # Install required tools
    install_docker
    install_docker_compose
    install_nodejs
    
    # Setup environment
    setup_environment
    
    # Install dependencies and build
    install_dependencies
    build_project
    
    # Setup SSL and configuration
    setup_ssl
    setup_config
    
    # Start services
    start_services
    
    # Show final information
    show_final_info
    
    print_success "Installation completed successfully!"
}

# Run main function
main "$@"
