#!/bin/bash

# 🛠️ VeloFlux SaaS - Development Quick Install Script
# Fast setup for local development environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🛠️ VeloFlux SaaS - Development Setup${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}[ERROR]${NC} Please run this script from the VeloFlux project root directory"
    exit 1
fi

# Setup development environment
print_step "Setting up development environment..."

# Copy environment file
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file for development"
else
    print_status ".env file already exists"
fi

# Install Node.js dependencies
print_step "Installing Node.js dependencies..."
if command -v npm >/dev/null 2>&1; then
    npm install
    print_success "Dependencies installed"
else
    echo -e "${RED}[ERROR]${NC} Node.js/npm not found. Please install Node.js first."
    exit 1
fi

# Setup development configuration
print_step "Setting up development configuration..."
if [ ! -f config/config.yaml ]; then
    cp config/config.example.yaml config/config.yaml
    print_success "Created config.yaml for development"
fi

# Create development certificates
print_step "Setting up development SSL certificates..."
mkdir -p certs
if [ ! -f certs/server.crt ]; then
    openssl req -x509 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt -days 365 -nodes \
        -subj "/C=US/ST=Dev/L=Local/O=VeloFlux/CN=localhost" >/dev/null 2>&1
    print_success "Generated self-signed certificates for development"
fi

# Start development environment
print_step "Starting development environment..."

echo ""
echo -e "${YELLOW}Choose development mode:${NC}"
echo "1. Frontend only (React dev server)"
echo "2. Full stack (Frontend + Load Balancer)"
echo "3. Load Balancer only (Docker)"

read -p "Enter choice (1-3): " DEV_MODE

case $DEV_MODE in
    1)
        print_step "Starting frontend development server..."
        echo -e "${CYAN}Frontend will be available at: http://localhost:5173${NC}"
        npm run dev
        ;;
    2)
        print_step "Starting full development environment..."
        
        # Start backend services with Docker
        docker-compose up -d redis backend-1 backend-2
        
        # Start frontend in background
        npm run dev &
        FRONTEND_PID=$!
        
        # Start load balancer
        echo -e "${CYAN}Starting VeloFlux load balancer...${NC}"
        go run cmd/velofluxlb/main.go &
        LB_PID=$!
        
        echo ""
        echo -e "${GREEN}Development environment started!${NC}"
        echo -e "${CYAN}Frontend:     http://localhost:5173${NC}"
        echo -e "${CYAN}Load Balancer: http://localhost:8080${NC}"
        echo -e "${CYAN}Admin API:    http://localhost:9000${NC}"
        echo ""
        echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"
        
        # Wait for interrupt
        trap 'kill $FRONTEND_PID $LB_PID; docker-compose down; exit' INT
        wait
        ;;
    3)
        print_step "Starting Load Balancer development environment..."
        docker-compose up
        ;;
    *)
        echo -e "${RED}[ERROR]${NC} Invalid choice"
        exit 1
        ;;
esac
