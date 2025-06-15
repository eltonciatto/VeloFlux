#!/bin/bash

# 🛠️ VeloFlux SaaS - Development Quick Install
# Fast setup for local development environment with hot reload

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

echo -e "${PURPLE}${BOLD}🛠️ VeloFlux SaaS - Development Quick Install${NC}"
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

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Check if we're in the right directory
check_project_directory() {
    if [ ! -f "package.json" ]; then
        print_error "Please run this script from the VeloFlux project root directory"
        exit 1
    fi
    print_success "Project directory verified"
}

# Check Node.js installation
check_nodejs() {
    print_step "Checking Node.js installation..."
    
    if ! command -v node >/dev/null 2>&1; then
        print_error "Node.js is not installed"
        print_info "Installing Node.js..."
        
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Install Node.js via NodeSource
            curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
            sudo apt-get install -y nodejs
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS - suggest manual installation
            print_error "Please install Node.js manually from https://nodejs.org or use Homebrew: brew install node"
            exit 1
        else
            print_error "Please install Node.js manually from https://nodejs.org"
            exit 1
        fi
    fi
    
    NODE_VERSION=$(node --version)
    print_success "Node.js $NODE_VERSION is installed"
    
    # Check if version is suitable (Node 16+)
    NODE_MAJOR=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR" -lt 16 ]; then
        print_warning "Node.js version $NODE_VERSION detected. Recommend Node.js 16+ for best compatibility"
    fi
}

# Check package manager
check_package_manager() {
    print_step "Checking package manager..."
    
    if command -v bun >/dev/null 2>&1; then
        PACKAGE_MANAGER="bun"
        print_success "Bun detected - using for faster installation"
    elif command -v yarn >/dev/null 2>&1; then
        PACKAGE_MANAGER="yarn"
        print_success "Yarn detected"
    elif command -v npm >/dev/null 2>&1; then
        PACKAGE_MANAGER="npm"
        print_success "npm detected"
    else
        print_error "No package manager found"
        exit 1
    fi
}

# Install dependencies
install_dependencies() {
    print_step "Installing development dependencies..."
    
    case $PACKAGE_MANAGER in
        "bun")
            bun install
            ;;
        "yarn")
            yarn install
            ;;
        "npm")
            npm install
            ;;
    esac
    
    print_success "Dependencies installed successfully"
}

# Setup environment
setup_environment() {
    print_step "Setting up development environment..."
    
    # Copy environment file
    if [ ! -f .env ]; then
        if [ -f .env.example ]; then
            cp .env.example .env
        else
            # Create a basic .env file
            cat > .env << 'EOF'
# VeloFlux Development Environment
NODE_ENV=development
VITE_API_URL=http://localhost:9000
VITE_WS_URL=ws://localhost:9001

# Development settings
VF_DEV_MODE=true
VF_LOG_LEVEL=debug
VF_HOT_RELOAD=true

# Backend settings
VF_ADMIN_USER=admin
VF_ADMIN_PASS=admin123
VF_JWT_SECRET=dev-secret-key-change-in-production

# Database URLs
REDIS_URL=redis://localhost:6379
POSTGRES_URL=postgresql://veloflux:veloflux@localhost:5432/veloflux

# Feature flags
VF_ENABLE_METRICS=true
VF_ENABLE_AUTH=true
VF_ENABLE_SSL=false
EOF
        fi
        print_success "Environment file created"
    else
        print_info "Environment file already exists"
    fi
    
    # Setup configuration
    if [ ! -f config/config.yaml ]; then
        if [ -f config/config.example.yaml ]; then
            cp config/config.example.yaml config/config.yaml
            print_success "Configuration file created"
        else
            print_warning "Configuration example not found"
        fi
    else
        print_info "Configuration file already exists"
    fi
}

# Setup development certificates
setup_dev_certificates() {
    print_step "Setting up development SSL certificates..."
    
    mkdir -p certs
    
    if [ ! -f certs/server.crt ]; then
        openssl req -x509 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt \
            -days 365 -nodes -subj "/C=US/ST=Dev/L=Local/O=VeloFlux/CN=localhost" \
            -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1" 2>/dev/null
        print_success "Development SSL certificates generated"
    else
        print_info "SSL certificates already exist"
    fi
}

# Setup Docker for backend services
setup_docker_services() {
    print_step "Setting up Docker services for development..."
    
    # Check if Docker is available
    if ! command -v docker >/dev/null 2>&1; then
        print_warning "Docker not found. Backend services will not be available."
        print_info "Install Docker to enable full development environment."
        return
    fi
    
    # Create development docker-compose override
    cat > docker-compose.dev.yml << 'EOF'
version: '3.8'

services:
  # Redis for development
  redis-dev:
    image: redis:alpine
    container_name: veloflux-redis-dev
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-dev-data:/data

  # PostgreSQL for development
  postgres-dev:
    image: postgres:13-alpine
    container_name: veloflux-postgres-dev
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=veloflux
      - POSTGRES_USER=veloflux
      - POSTGRES_PASSWORD=veloflux
    volumes:
      - postgres-dev-data:/var/lib/postgresql/data

  # Backend test servers
  backend-1:
    image: nginx:alpine
    container_name: veloflux-backend-1-dev
    ports:
      - "8001:80"
    volumes:
      - ./test/backend1.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro

  backend-2:
    image: nginx:alpine
    container_name: veloflux-backend-2-dev
    ports:
      - "8002:80"
    volumes:
      - ./test/backend2.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro

volumes:
  redis-dev-data:
  postgres-dev-data:
EOF

    print_success "Docker development configuration created"
}

# Create development scripts
create_dev_scripts() {
    print_step "Creating development scripts..."
    
    mkdir -p scripts/dev
    
    # Frontend development script
    cat > scripts/dev/frontend.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting VeloFlux Frontend Development Server..."
export NODE_ENV=development
export VITE_API_URL=http://localhost:9000
export VITE_WS_URL=ws://localhost:9001

# Start Vite dev server
if command -v bun >/dev/null 2>&1; then
    bun run dev
elif command -v yarn >/dev/null 2>&1; then
    yarn dev
else
    npm run dev
fi
EOF

    # Backend development script
    cat > scripts/dev/backend.sh << 'EOF'
#!/bin/bash
echo "🔧 Starting VeloFlux Backend Services..."

# Start Docker services
if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f docker-compose.dev.yml up -d
    echo "✅ Backend services started"
    echo "🔍 Redis: localhost:6379"
    echo "🗄️  PostgreSQL: localhost:5432"
    echo "🌐 Backend 1: http://localhost:8001"
    echo "🌐 Backend 2: http://localhost:8002"
else
    echo "❌ Docker Compose not found. Please install Docker."
    exit 1
fi
EOF

    # Full development environment script
    cat > scripts/dev/start-all.sh << 'EOF'
#!/bin/bash
echo "🚀 Starting Complete VeloFlux Development Environment..."

# Start backend services
echo "1. Starting backend services..."
./scripts/dev/backend.sh

# Wait a moment for services to start
sleep 3

# Start frontend in background
echo "2. Starting frontend..."
./scripts/dev/frontend.sh &
FRONTEND_PID=$!

# If Go backend exists, start it
if [ -f "cmd/velofluxlb/main.go" ]; then
    echo "3. Starting Go load balancer..."
    cd cmd/velofluxlb && go run main.go &
    GO_PID=$!
    cd ../..
fi

echo ""
echo "🎉 Development environment started!"
echo "🌐 Frontend: http://localhost:5173"
echo "📊 Admin API: http://localhost:9000"
echo "📈 Metrics: http://localhost:8080"
echo ""
echo "Press Ctrl+C to stop all services"

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Stopping development environment..."
    
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
    fi
    
    if [ ! -z "$GO_PID" ]; then
        kill $GO_PID 2>/dev/null
    fi
    
    docker-compose -f docker-compose.dev.yml down
    echo "✅ All services stopped"
    exit 0
}

trap cleanup INT TERM

# Wait for interrupt
wait
EOF

    # Stop development environment script
    cat > scripts/dev/stop-all.sh << 'EOF'
#!/bin/bash
echo "🛑 Stopping VeloFlux Development Environment..."

# Stop Docker services
docker-compose -f docker-compose.dev.yml down

# Kill any running dev servers
pkill -f "vite"
pkill -f "npm run dev"
pkill -f "yarn dev"
pkill -f "bun run dev"

# Kill Go processes
pkill -f "go run"

echo "✅ Development environment stopped"
EOF

    # Make scripts executable
    chmod +x scripts/dev/*.sh
    
    print_success "Development scripts created"
}

# Create VS Code configuration
create_vscode_config() {
    print_step "Creating VS Code development configuration..."
    
    mkdir -p .vscode
    
    # VS Code settings
    cat > .vscode/settings.json << 'EOF'
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "typescript.suggest.autoImports": true,
  "typescript.updateImportsOnFileMove.enabled": "always",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true,
    "source.organizeImports": true
  },
  "eslint.workingDirectories": ["src"],
  "files.exclude": {
    "node_modules": true,
    "dist": true,
    ".next": true
  },
  "search.exclude": {
    "node_modules": true,
    "dist": true,
    ".next": true,
    "*.log": true
  },
  "emmet.includeLanguages": {
    "typescript": "html",
    "typescriptreact": "html"
  }
}
EOF

    # VS Code launch configuration
    cat > .vscode/launch.json << 'EOF'
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Launch Chrome",
      "request": "launch",
      "type": "node",
      "program": "${workspaceFolder}/node_modules/.bin/vite",
      "args": ["--mode", "development"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    },
    {
      "name": "Debug Frontend",
      "type": "node",
      "request": "attach",
      "port": 9229,
      "restart": true,
      "localRoot": "${workspaceFolder}",
      "remoteRoot": "."
    }
  ]
}
EOF

    # VS Code tasks
    cat > .vscode/tasks.json << 'EOF'
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Development",
      "type": "shell",
      "command": "./scripts/dev/start-all.sh",
      "group": {
        "kind": "build",
        "isDefault": true
      },
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      },
      "problemMatcher": []
    },
    {
      "label": "Stop Development",
      "type": "shell",
      "command": "./scripts/dev/stop-all.sh",
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Install Dependencies",
      "type": "shell",
      "command": "npm",
      "args": ["install"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    },
    {
      "label": "Build Project",
      "type": "shell",
      "command": "npm",
      "args": ["run", "build"],
      "group": "build",
      "presentation": {
        "echo": true,
        "reveal": "always",
        "focus": false,
        "panel": "shared"
      }
    }
  ]
}
EOF

    # VS Code extensions recommendations
    cat > .vscode/extensions.json << 'EOF'
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "ms-python.python",
    "golang.go",
    "ms-vscode-remote.remote-containers",
    "ms-vscode.vscode-docker",
    "redhat.vscode-yaml",
    "ms-vscode.vscode-markdown"
  ]
}
EOF

    print_success "VS Code configuration created"
}

# Setup Git hooks
setup_git_hooks() {
    print_step "Setting up Git hooks for development..."
    
    if [ -d ".git" ]; then
        mkdir -p .git/hooks
        
        # Pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
echo "🔍 Running pre-commit checks..."

# Run linting
if command -v npm >/dev/null 2>&1; then
    npm run lint
    if [ $? -ne 0 ]; then
        echo "❌ Linting failed. Please fix errors before committing."
        exit 1
    fi
fi

# Run type checking
if command -v npm >/dev/null 2>&1; then
    npm run type-check
    if [ $? -ne 0 ]; then
        echo "❌ Type checking failed. Please fix errors before committing."
        exit 1
    fi
fi

echo "✅ Pre-commit checks passed"
EOF

        chmod +x .git/hooks/pre-commit
        print_success "Git hooks configured"
    else
        print_info "Not a Git repository, skipping Git hooks"
    fi
}

# Run initial health check
run_initial_check() {
    print_step "Running initial development environment check..."
    
    # Check if basic commands work
    case $PACKAGE_MANAGER in
        "bun")
            if bun run --help >/dev/null 2>&1; then
                print_success "✓ Bun is working"
            fi
            ;;
        "yarn")
            if yarn --help >/dev/null 2>&1; then
                print_success "✓ Yarn is working"
            fi
            ;;
        "npm")
            if npm --help >/dev/null 2>&1; then
                print_success "✓ npm is working"
            fi
            ;;
    esac
    
    # Check TypeScript
    if command -v npx >/dev/null 2>&1; then
        if npx tsc --version >/dev/null 2>&1; then
            print_success "✓ TypeScript is available"
        fi
    fi
    
    # Check if development dependencies are installed
    if [ -d "node_modules" ]; then
        print_success "✓ Dependencies are installed"
    else
        print_warning "Dependencies not found. Run the install command again."
    fi
}

# Show development info
show_development_info() {
    echo ""
    echo -e "${GREEN}${BOLD}🎉 VeloFlux Development Environment Ready! 🎉${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🚀 Quick Start Commands:${NC}"
    echo -e "  ${GREEN}Complete Environment:${NC}  ./scripts/dev/start-all.sh"
    echo -e "  ${GREEN}Frontend Only:${NC}        ./scripts/dev/frontend.sh"
    echo -e "  ${GREEN}Backend Only:${NC}         ./scripts/dev/backend.sh"
    echo -e "  ${GREEN}Stop All:${NC}             ./scripts/dev/stop-all.sh"
    echo ""
    
    echo -e "${YELLOW}${BOLD}📦 Package Manager Commands:${NC}"
    case $PACKAGE_MANAGER in
        "bun")
            echo -e "  ${CYAN}Start Dev Server:${NC}     bun run dev"
            echo -e "  ${CYAN}Build Project:${NC}        bun run build"
            echo -e "  ${CYAN}Run Tests:${NC}            bun test"
            echo -e "  ${CYAN}Lint Code:${NC}            bun run lint"
            ;;
        "yarn")
            echo -e "  ${CYAN}Start Dev Server:${NC}     yarn dev"
            echo -e "  ${CYAN}Build Project:${NC}        yarn build"
            echo -e "  ${CYAN}Run Tests:${NC}            yarn test"
            echo -e "  ${CYAN}Lint Code:${NC}            yarn lint"
            ;;
        "npm")
            echo -e "  ${CYAN}Start Dev Server:${NC}     npm run dev"
            echo -e "  ${CYAN}Build Project:${NC}        npm run build"
            echo -e "  ${CYAN}Run Tests:${NC}            npm test"
            echo -e "  ${CYAN}Lint Code:${NC}            npm run lint"
            ;;
    esac
    echo ""
    
    echo -e "${YELLOW}${BOLD}🌐 Development URLs:${NC}"
    echo -e "  ${GREEN}Frontend:${NC}              http://localhost:5173"
    echo -e "  ${GREEN}Backend API:${NC}           http://localhost:9000"
    echo -e "  ${GREEN}Metrics:${NC}               http://localhost:8080"
    echo -e "  ${GREEN}Test Backend 1:${NC}        http://localhost:8001"
    echo -e "  ${GREEN}Test Backend 2:${NC}        http://localhost:8002"
    echo -e "  ${GREEN}Redis:${NC}                 localhost:6379"
    echo -e "  ${GREEN}PostgreSQL:${NC}            localhost:5432"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔧 Development Tools:${NC}"
    echo -e "  ${CYAN}Hot Reload:${NC}            Enabled (Vite)"
    echo -e "  ${CYAN}TypeScript:${NC}            Enabled"
    echo -e "  ${CYAN}ESLint:${NC}                Configured"
    echo -e "  ${CYAN}Prettier:${NC}              Format on save"
    echo -e "  ${CYAN}Tailwind CSS:${NC}          Available"
    echo -e "  ${CYAN}Git Hooks:${NC}             Pre-commit checks"
    echo ""
    
    echo -e "${YELLOW}${BOLD}📁 Important Files:${NC}"
    echo -e "  ${CYAN}Environment:${NC}           .env"
    echo -e "  ${CYAN}Configuration:${NC}         config/config.yaml"
    echo -e "  ${CYAN}Dev Scripts:${NC}           scripts/dev/"
    echo -e "  ${CYAN}VS Code Config:${NC}        .vscode/"
    echo -e "  ${CYAN}Docker Dev:${NC}            docker-compose.dev.yml"
    echo ""
    
    echo -e "${GREEN}${BOLD}✨ Development Workflow:${NC}"
    echo -e "  ${YELLOW}1.${NC} Run ${CYAN}./scripts/dev/start-all.sh${NC} to start everything"
    echo -e "  ${YELLOW}2.${NC} Open ${CYAN}http://localhost:5173${NC} in your browser"
    echo -e "  ${YELLOW}3.${NC} Make changes to files in ${CYAN}src/${NC}"
    echo -e "  ${YELLOW}4.${NC} See changes automatically reload"
    echo -e "  ${YELLOW}5.${NC} Use ${CYAN}Ctrl+C${NC} to stop when done"
    echo ""
    
    echo -e "${YELLOW}${BOLD}💡 Tips:${NC}"
    echo -e "  ${CYAN}•${NC} Use VS Code for the best development experience"
    echo -e "  ${CYAN}•${NC} Install recommended extensions for enhanced features"
    echo -e "  ${CYAN}•${NC} Check the console for any runtime errors"
    echo -e "  ${CYAN}•${NC} Backend services start automatically with Docker"
    echo -e "  ${CYAN}•${NC} All changes are watched and will trigger rebuilds"
    echo ""
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}Happy coding with VeloFlux! 🚀${NC}"
    echo ""
}

# Main function
main() {
    echo ""
    print_step "Setting up VeloFlux development environment..."
    echo ""
    
    # Setup steps
    check_project_directory
    check_nodejs
    check_package_manager
    install_dependencies
    setup_environment
    setup_dev_certificates
    setup_docker_services
    create_dev_scripts
    create_vscode_config
    setup_git_hooks
    run_initial_check
    
    # Show completion info
    show_development_info
}

# Handle interruption
trap 'print_error "Setup interrupted"; exit 1' INT TERM

# Run main function
main "$@"
