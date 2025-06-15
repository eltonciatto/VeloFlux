#!/bin/bash

# 🐳 VeloFlux SaaS - Docker Simple Install Script
# Quick Docker deployment for any environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🐳 VeloFlux SaaS - Docker Simple Install${NC}"
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

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check Docker
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

if ! command_exists docker; then
    echo -e "${RED}[ERROR]${NC} Docker is not installed. Please install Docker first."
    echo "Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if we're in the right directory
if [ ! -f "docker-compose.yml" ]; then
    echo -e "${RED}[ERROR]${NC} Please run this script from the VeloFlux project root directory"
    exit 1
fi

print_step "Setting up environment..."

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    cp .env.example .env
    print_success "Created .env file"
fi

# Create config if it doesn't exist
if [ ! -f config/config.yaml ]; then
    cp config/config.example.yaml config/config.yaml
    print_success "Created config.yaml file"
fi

# Create certs directory
mkdir -p certs

# Setup SSL certificates
print_step "Setting up SSL certificates..."
if [ ! -f certs/server.crt ]; then
    # Generate self-signed certificate
    openssl req -x509 -newkey rsa:2048 -keyout certs/server.key -out certs/server.crt -days 365 -nodes \
        -subj "/C=US/ST=State/L=City/O=VeloFlux/CN=localhost" >/dev/null 2>&1
    print_success "Generated self-signed SSL certificates"
fi

# Build and start services
print_step "Building and starting VeloFlux services..."

# Pull latest images first
docker-compose pull

# Build the application
docker-compose build

# Start all services
docker-compose up -d

print_success "Services started successfully"

# Wait for services to be ready
print_step "Waiting for services to initialize..."
sleep 15

# Health check
print_step "Performing health check..."

health_check() {
    local url=$1
    local service=$2
    
    if curl -s -f "$url" > /dev/null 2>&1; then
        print_success "$service is healthy"
        return 0
    else
        print_warning "$service is not responding (may still be starting)"
        return 1
    fi
}

# Check services
health_check "http://localhost:8080/health" "VeloFlux Load Balancer"
health_check "http://localhost:8001" "Backend 1"
health_check "http://localhost:8002" "Backend 2"

# Test Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_warning "Redis is not responding"
fi

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 VeloFlux SaaS is now running!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}🌐 Access Points:${NC}"
echo -e "  🔗 Load Balancer:    http://localhost"
echo -e "  📊 Metrics:          http://localhost:8080"
echo -e "  ⚙️  Admin API:        http://localhost:9000"
echo -e "  🎯 Backend 1:        http://localhost:8001"
echo -e "  🎯 Backend 2:        http://localhost:8002"
echo ""
echo -e "${BLUE}🐳 Docker Management:${NC}"
echo -e "  📋 View logs:        docker-compose logs -f"
echo -e "  📋 View status:      docker-compose ps"
echo -e "  🔄 Restart:          docker-compose restart"
echo -e "  ⏹️  Stop:             docker-compose down"
echo -e "  🗑️  Clean restart:    docker-compose down && docker-compose up -d"
echo ""
echo -e "${BLUE}📝 Configuration:${NC}"
echo -e "  🔧 Load Balancer:    config/config.yaml"
echo -e "  🌍 Environment:      .env"
echo -e "  🔐 SSL Certs:        certs/"
echo ""
echo -e "${BLUE}📊 Monitoring:${NC}"
echo -e "  🏥 Health Check:     curl http://localhost:8080/health"
echo -e "  📈 Metrics:          curl http://localhost:8080/metrics"
echo -e "  📋 Service Status:   docker-compose ps"
echo ""
echo -e "${YELLOW}🔧 Next Steps:${NC}"
echo -e "  1. Configure your backend servers in config/config.yaml"
echo -e "  2. Update environment variables in .env"
echo -e "  3. Replace self-signed certificates with production ones"
echo -e "  4. Set up monitoring and alerting"
echo ""
echo -e "${GREEN}Happy Load Balancing! 🚀${NC}"
