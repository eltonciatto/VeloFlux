#!/bin/bash

# 🚀 VeloFlux SaaS - Installation Menu
# Choose your installation method

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# ASCII Art Banner
show_banner() {
    echo -e "${PURPLE}"
    cat << "EOF"
██╗   ██╗███████╗██╗      ███████╗███████╗██╗     ██╗   ██╗██╗  ██╗
██║   ██║██╔════╝██║      ██╔════╝██╔════╝██║     ██║   ██║╚██╗██╔╝
██║   ██║█████╗  ██║      ██║     █████╗  ██║     ██║   ██║ ╚███╔╝ 
╚██╗ ██╔╝██╔══╝  ██║      ██║     ██╔══╝  ██║     ██║   ██║ ██╔██╗ 
 ╚████╔╝ ███████╗███████╗ ██║     ██║     ███████╗╚██████╔╝██╔╝ ██╗
  ╚═══╝  ╚══════╝╚══════╝ ╚═╝     ╚═╝     ╚══════╝ ╚═════╝ ╚═╝  ╚═╝
                                                                    
            🚀 AI-Powered Load Balancer SaaS Platform 🚀
EOF
    echo -e "${NC}"
}

print_step() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to check system requirements
check_requirements() {
    print_step "Checking system requirements..."
    
    local missing_deps=()
    
    # Check for required commands
    if ! command -v curl >/dev/null 2>&1; then
        missing_deps+=("curl")
    fi
    
    if ! command -v git >/dev/null 2>&1; then
        missing_deps+=("git")
    fi
    
    if ! command -v openssl >/dev/null 2>&1; then
        missing_deps+=("openssl")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        print_error "Missing required dependencies: ${missing_deps[*]}"
        echo "Please install them first."
        exit 1
    fi
    
    print_success "System requirements check passed"
}

# Function to show installation menu
show_menu() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}                           🎯 Choose Installation Method                           ${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}1.${NC} 🛠️  ${BLUE}Development Setup${NC}"
    echo -e "   Perfect for: Local development, testing, debugging"
    echo -e "   Includes: Hot reload, development tools, local backends"
    echo -e "   Time: ~5 minutes"
    echo ""
    echo -e "${YELLOW}2.${NC} 🐳 ${BLUE}Docker Simple Install${NC}"
    echo -e "   Perfect for: Quick testing, demos, local production"
    echo -e "   Includes: Full stack with Docker, ready to use"
    echo -e "   Time: ~10 minutes"
    echo ""
    echo -e "${YELLOW}3.${NC} 🚀 ${BLUE}Production Install (Complete)${NC}"
    echo -e "   Perfect for: Production deployment with custom config"
    echo -e "   Includes: SSL setup, monitoring, security hardening"
    echo -e "   Time: ~20 minutes"
    echo ""
    echo -e "${YELLOW}4.${NC} ☁️  ${BLUE}Coolify Deploy Preparation${NC}"
    echo -e "   Perfect for: Coolify platform deployment"
    echo -e "   Includes: Coolify configs, deployment guide"
    echo -e "   Time: ~10 minutes"
    echo ""
    echo -e "${YELLOW}5.${NC} 📚 ${BLUE}Documentation & Help${NC}"
    echo -e "   View: Installation guides, troubleshooting, examples"
    echo ""
    echo -e "${YELLOW}6.${NC} ❌ ${BLUE}Exit${NC}"
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Function to show documentation
show_documentation() {
    echo ""
    echo -e "${BLUE}📚 VeloFlux SaaS Documentation${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${YELLOW}📁 Available Documentation:${NC}"
    echo ""
    
    if [ -d "docs" ]; then
        echo -e "${GREEN}Local Documentation:${NC}"
        find docs -name "*.md" -type f | sed 's/^/  📄 /' | head -10
        if [ $(find docs -name "*.md" -type f | wc -l) -gt 10 ]; then
            echo "  ... and more"
        fi
        echo ""
    fi
    
    echo -e "${GREEN}Online Resources:${NC}"
    echo -e "  🌐 GitHub Repository: https://github.com/eltonciatto/VeloFlux"
    echo -e "  📖 Wiki: https://github.com/eltonciatto/VeloFlux/wiki"
    echo -e "  🐛 Issues: https://github.com/eltonciatto/VeloFlux/issues"
    echo -e "  💬 Discord: https://discord.gg/veloflux"
    echo ""
    
    echo -e "${GREEN}Quick Commands:${NC}"
    echo -e "  📄 View README:          cat README.md"
    echo -e "  🐳 Docker help:          docker-compose --help"
    echo -e "  ⚙️  Configuration help:   cat config/config.example.yaml"
    echo -e "  🔍 Environment help:     cat .env.example"
    echo ""
    
    read -p "Press Enter to continue..."
}

# Function to validate environment
validate_environment() {
    print_step "Validating installation environment..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Invalid directory. Please run this script from the VeloFlux project root."
        echo ""
        echo "Expected files:"
        echo "  - package.json"
        echo "  - docker-compose.yml"
        echo "  - scripts/"
        echo ""
        exit 1
    fi
    
    # Check disk space (at least 2GB recommended)
    local available_space=$(df . | awk 'NR==2 {print $4}')
    local required_space=2097152  # 2GB in KB
    
    if [ "$available_space" -lt "$required_space" ]; then
        print_warning "Low disk space detected. At least 2GB recommended."
        read -p "Continue anyway? (y/N): " confirm
        if [[ ! $confirm =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    print_success "Environment validation passed"
}

# Function to run selected installation
run_installation() {
    local choice=$1
    
    case $choice in
        1)
            print_step "Starting Development Setup..."
            if [ -f "scripts/dev-install.sh" ]; then
                chmod +x scripts/dev-install.sh
                ./scripts/dev-install.sh
            else
                print_error "Development install script not found"
            fi
            ;;
        2)
            print_step "Starting Docker Simple Install..."
            if [ -f "scripts/docker-install.sh" ]; then
                chmod +x scripts/docker-install.sh
                ./scripts/docker-install.sh
            else
                print_error "Docker install script not found"
            fi
            ;;
        3)
            print_step "Starting Production Install..."
            if [ -f "scripts/quick-install.sh" ]; then
                chmod +x scripts/quick-install.sh
                ./scripts/quick-install.sh
            else
                print_error "Production install script not found"
            fi
            ;;
        4)
            print_step "Preparing Coolify Deployment..."
            if [ -f "scripts/coolify-deploy.sh" ]; then
                chmod +x scripts/coolify-deploy.sh
                ./scripts/coolify-deploy.sh
            else
                print_error "Coolify deploy script not found"
            fi
            ;;
        5)
            show_documentation
            return 0
            ;;
        6)
            echo -e "${GREEN}Thank you for using VeloFlux! 👋${NC}"
            exit 0
            ;;
        *)
            print_error "Invalid choice. Please select 1-6."
            return 1
            ;;
    esac
}

# Function to show post-installation info
show_post_install() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 Installation Complete!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}🎯 What's Next?${NC}"
    echo ""
    echo -e "${YELLOW}Configuration:${NC}"
    echo -e "  📝 Edit config/config.yaml to add your backend servers"
    echo -e "  🌍 Update .env with your environment settings"
    echo -e "  🔐 Replace self-signed certificates with production ones"
    echo ""
    echo -e "${YELLOW}Monitoring:${NC}"
    echo -e "  📊 Access metrics at http://localhost:8080/metrics"
    echo -e "  🏥 Health check at http://localhost:8080/health"
    echo -e "  📋 View logs with: docker-compose logs -f"
    echo ""
    echo -e "${YELLOW}Support:${NC}"
    echo -e "  📚 Read documentation in docs/ folder"
    echo -e "  🐛 Report issues: https://github.com/eltonciatto/VeloFlux/issues"
    echo -e "  💬 Join Discord: https://discord.gg/veloflux"
    echo ""
    echo -e "${GREEN}Happy Load Balancing! 🚀${NC}"
}

# Main function
main() {
    # Show banner
    show_banner
    
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${PURPLE}            🎯 AI-Powered Load Balancer SaaS Installation Center            ${NC}"
    echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    # Check system requirements
    check_requirements
    
    # Validate environment
    validate_environment
    
    # Main menu loop
    while true; do
        show_menu
        
        echo -n -e "${CYAN}Enter your choice (1-6): ${NC}"
        read choice
        
        if run_installation "$choice"; then
            if [ "$choice" != "5" ] && [ "$choice" != "6" ]; then
                show_post_install
                break
            fi
        fi
        
        echo ""
    done
}

# Run main function
main "$@"
