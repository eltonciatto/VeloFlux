#!/bin/bash

# 🐳 VeloFlux SaaS - Docker Quick Install
# Optimized Docker installation with health checks and monitoring

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

echo -e "${PURPLE}${BOLD}🐳 VeloFlux SaaS - Docker Quick Install${NC}"
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

# Check if Docker is installed
check_docker() {
    print_step "Checking Docker installation..."
    
    if ! command -v docker >/dev/null 2>&1; then
        print_error "Docker is not installed. Installing Docker..."
        
        # Install Docker
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            curl -fsSL https://get.docker.com -o get-docker.sh
            sudo sh get-docker.sh
            sudo usermod -aG docker "$USER"
            rm get-docker.sh
            print_success "Docker installed successfully"
        else
            print_error "Please install Docker manually from https://docker.com"
            exit 1
        fi
    else
        print_success "Docker is already installed"
    fi
    
    if ! command -v docker-compose >/dev/null 2>&1; then
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
        print_success "Docker Compose is already installed"
    fi
}

# Check if ports are available
check_ports() {
    print_step "Checking required ports..."
    
    local required_ports=(80 443 8080 9000 6379)
    local busy_ports=()
    
    for port in "${required_ports[@]}"; do
        if ss -tuln | grep -q ":$port "; then
            busy_ports+=($port)
        fi
    done
    
    if [ ${#busy_ports[@]} -ne 0 ]; then
        echo -e "${YELLOW}Warning: The following ports are in use: ${busy_ports[*]}${NC}"
        echo "This might cause conflicts. Do you want to continue? (y/N)"
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_error "Installation cancelled"
            exit 1
        fi
    else
        print_success "All required ports are available"
    fi
}

# Create optimized docker-compose file
create_docker_compose() {
    print_step "Creating optimized Docker Compose configuration..."
    
    cat > docker-compose.prod.yml << 'EOF'
version: '3.8'

networks:
  veloflux-network:
    driver: bridge

volumes:
  redis-data:
    driver: local
  postgres-data:
    driver: local
  grafana-data:
    driver: local
  prometheus-data:
    driver: local

services:
  # VeloFlux Load Balancer
  veloflux-lb:
    build: .
    container_name: veloflux-lb
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"   # metrics
      - "9000:9000"   # admin API
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=info
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=${VF_ADMIN_PASS:-admin123}
      - VF_JWT_SECRET=${VF_JWT_SECRET:-your-secret-key}
      - REDIS_URL=redis://redis:6379
      - POSTGRES_URL=postgresql://veloflux:veloflux123@postgres:5432/veloflux
    volumes:
      - ./config:/etc/veloflux:ro
      - ./certs:/etc/ssl/certs/veloflux:ro
      - ./logs:/var/log/veloflux
    depends_on:
      - redis
      - postgres
      - backend-1
      - backend-2
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # Redis for caching and session storage
  redis:
    image: redis:7-alpine
    container_name: veloflux-redis
    restart: unless-stopped
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes --requirepass ${REDIS_PASSWORD:-redis123}
    volumes:
      - redis-data:/data
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  # PostgreSQL for persistent data
  postgres:
    image: postgres:15-alpine
    container_name: veloflux-postgres
    restart: unless-stopped
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_DB=veloflux
      - POSTGRES_USER=veloflux
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-veloflux123}
    volumes:
      - postgres-data:/var/lib/postgresql/data
      - ./scripts/init-db.sql:/docker-entrypoint-initdb.d/init.sql:ro
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U veloflux"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Backend services for testing
  backend-1:
    image: nginx:alpine
    container_name: veloflux-backend-1
    restart: unless-stopped
    ports:
      - "8001:80"
    volumes:
      - ./test/backend1.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend-2:
    image: nginx:alpine
    container_name: veloflux-backend-2
    restart: unless-stopped
    ports:
      - "8002:80"
    volumes:
      - ./test/backend2.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Prometheus for metrics
  prometheus:
    image: prom/prometheus:latest
    container_name: veloflux-prometheus
    restart: unless-stopped
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml:ro
      - prometheus-data:/prometheus
    networks:
      - veloflux-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:9090/-/healthy"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Grafana for visualization
  grafana:
    image: grafana/grafana:latest
    container_name: veloflux-grafana
    restart: unless-stopped
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD:-admin}
      - GF_USERS_ALLOW_SIGN_UP=false
    volumes:
      - grafana-data:/var/lib/grafana
      - ./monitoring/grafana/dashboards:/etc/grafana/provisioning/dashboards:ro
      - ./monitoring/grafana/datasources:/etc/grafana/provisioning/datasources:ro
    networks:
      - veloflux-network
    depends_on:
      - prometheus
    healthcheck:
      test: ["CMD-SHELL", "wget --quiet --tries=1 --spider http://localhost:3000/api/health || exit 1"]
      interval: 30s
      timeout: 10s
      retries: 3
EOF

    print_success "Docker Compose configuration created"
}

# Create monitoring configuration
create_monitoring_config() {
    print_step "Creating monitoring configuration..."
    
    mkdir -p monitoring/grafana/{dashboards,datasources}
    
    # Prometheus configuration
    cat > monitoring/prometheus.yml << 'EOF'
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

  - job_name: 'veloflux'
    static_configs:
      - targets: ['veloflux-lb:8080']
    metrics_path: /metrics
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:5432']
EOF

    # Grafana datasource
    cat > monitoring/grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

    # Grafana dashboard
    cat > monitoring/grafana/dashboards/dashboard.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'VeloFlux'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

    print_success "Monitoring configuration created"
}

# Create database initialization script
create_db_init() {
    print_step "Creating database initialization script..."
    
    mkdir -p scripts
    
    cat > scripts/init-db.sql << 'EOF'
-- VeloFlux Database Initialization

-- Create extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE NOT NULL,
    config JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create backend_servers table
CREATE TABLE IF NOT EXISTS backend_servers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    weight INTEGER DEFAULT 1,
    health_check_url VARCHAR(255),
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create metrics table
CREATE TABLE IF NOT EXISTS metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metric_name VARCHAR(255) NOT NULL,
    metric_value DOUBLE PRECISION NOT NULL,
    labels JSONB
);

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(255),
    resource_id UUID,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tenants_domain ON tenants(domain);
CREATE INDEX IF NOT EXISTS idx_backend_servers_tenant ON backend_servers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_metrics_tenant_timestamp ON metrics(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_timestamp ON audit_logs(user_id, created_at);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, role) 
VALUES ('admin', 'admin@veloflux.local', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON CONFLICT (username) DO NOTHING;

-- Insert default tenant
INSERT INTO tenants (name, domain, config) 
VALUES ('Default', 'localhost', '{"ssl_enabled": false, "monitoring_enabled": true}')
ON CONFLICT (domain) DO NOTHING;
EOF

    print_success "Database initialization script created"
}

# Create environment file
create_env_file() {
    print_step "Creating environment configuration..."
    
    # Generate random passwords
    ADMIN_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    JWT_SECRET=$(openssl rand -base64 32 | tr -d "=+/")
    REDIS_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    POSTGRES_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    GRAFANA_PASS=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-16)
    
    cat > .env.docker << EOF
# VeloFlux Docker Environment Configuration
COMPOSE_PROJECT_NAME=veloflux

# VeloFlux Configuration
VF_ADMIN_PASS=$ADMIN_PASS
VF_JWT_SECRET=$JWT_SECRET

# Database Passwords
REDIS_PASSWORD=$REDIS_PASS
POSTGRES_PASSWORD=$POSTGRES_PASS

# Monitoring
GRAFANA_PASSWORD=$GRAFANA_PASS

# Networking
VF_DOMAIN=localhost
VF_SSL_ENABLED=false
VF_MONITORING_ENABLED=true
EOF

    print_success "Environment configuration created"
    print_info "Admin password: $ADMIN_PASS"
    print_info "Grafana password: $GRAFANA_PASS"
}

# Setup SSL certificates for development
setup_dev_ssl() {
    print_step "Setting up development SSL certificates..."
    
    mkdir -p certs
    
    if [[ ! -f certs/server.crt ]]; then
        openssl req -x509 -newkey rsa:4096 -keyout certs/server.key -out certs/server.crt \
            -days 365 -nodes -subj "/C=US/ST=Dev/L=Local/O=VeloFlux/CN=localhost" \
            -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1" 2>/dev/null
        
        print_success "Development SSL certificates generated"
    else
        print_info "SSL certificates already exist"
    fi
}

# Build and start services
start_services() {
    print_step "Building and starting VeloFlux services..."
    
    # Load environment variables
    if [[ -f .env.docker ]]; then
        export $(grep -v '^#' .env.docker | xargs)
    fi
    
    # Build images
    print_info "Building Docker images..."
    docker-compose -f docker-compose.prod.yml build --no-cache
    
    # Start services
    print_info "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "All services started"
}

# Wait for services to be ready
wait_for_services() {
    print_step "Waiting for services to be ready..."
    
    local services=("redis" "postgres" "veloflux-lb" "prometheus" "grafana")
    local max_wait=300  # 5 minutes
    local waited=0
    
    for service in "${services[@]}"; do
        print_info "Waiting for $service..."
        
        while ! docker-compose -f docker-compose.prod.yml ps | grep -q "$service.*healthy\|$service.*Up"; do
            if [ $waited -ge $max_wait ]; then
                print_error "Timeout waiting for $service"
                return 1
            fi
            
            sleep 5
            waited=$((waited + 5))
            echo -n "."
        done
        
        print_success "$service is ready"
    done
}

# Run health checks
run_health_checks() {
    print_step "Running comprehensive health checks..."
    
    local checks=0
    local passed=0
    
    # Check VeloFlux Load Balancer
    if curl -s http://localhost:8080/health >/dev/null 2>&1; then
        print_success "✓ VeloFlux Load Balancer health check passed"
        ((passed++))
    else
        print_error "✗ VeloFlux Load Balancer health check failed"
    fi
    ((checks++))
    
    # Check backend services
    if curl -s http://localhost:8001/health >/dev/null 2>&1; then
        print_success "✓ Backend 1 health check passed"
        ((passed++))
    else
        print_error "✗ Backend 1 health check failed"
    fi
    ((checks++))
    
    if curl -s http://localhost:8002/health >/dev/null 2>&1; then
        print_success "✓ Backend 2 health check passed"
        ((passed++))
    else
        print_error "✗ Backend 2 health check failed"
    fi
    ((checks++))
    
    # Check Prometheus
    if curl -s http://localhost:9090/-/healthy >/dev/null 2>&1; then
        print_success "✓ Prometheus health check passed"
        ((passed++))
    else
        print_error "✗ Prometheus health check failed"
    fi
    ((checks++))
    
    # Check Grafana
    if curl -s http://localhost:3000/api/health >/dev/null 2>&1; then
        print_success "✓ Grafana health check passed"
        ((passed++))
    else
        print_error "✗ Grafana health check failed"
    fi
    ((checks++))
    
    echo ""
    print_info "Health check results: $passed/$checks services healthy"
    
    if [ $passed -eq $checks ]; then
        print_success "All health checks passed!"
        return 0
    else
        print_error "Some health checks failed. Check the logs for details."
        return 1
    fi
}

# Show connection info
show_connection_info() {
    echo ""
    echo -e "${GREEN}${BOLD}🎉 VeloFlux Docker Installation Complete! 🎉${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    # Load admin password
    if [[ -f .env.docker ]]; then
        ADMIN_PASS=$(grep VF_ADMIN_PASS .env.docker | cut -d'=' -f2)
        GRAFANA_PASS=$(grep GRAFANA_PASSWORD .env.docker | cut -d'=' -f2)
    fi
    
    echo -e "${YELLOW}${BOLD}🌐 Service URLs:${NC}"
    echo -e "  ${GREEN}🚀 VeloFlux Frontend:${NC}     http://localhost"
    echo -e "  ${GREEN}📊 Admin Panel:${NC}          http://localhost:9000"
    echo -e "  ${GREEN}📈 Metrics:${NC}              http://localhost:8080/metrics"
    echo -e "  ${GREEN}🔍 Prometheus:${NC}           http://localhost:9090"
    echo -e "  ${GREEN}📉 Grafana:${NC}              http://localhost:3000"
    echo -e "  ${GREEN}🔧 Backend 1:${NC}            http://localhost:8001"
    echo -e "  ${GREEN}🔧 Backend 2:${NC}            http://localhost:8002"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔐 Login Credentials:${NC}"
    echo -e "  ${GREEN}👤 VeloFlux Admin:${NC}"
    echo -e "     Username: admin"
    echo -e "     Password: $ADMIN_PASS"
    echo ""
    echo -e "  ${GREEN}📉 Grafana Admin:${NC}"
    echo -e "     Username: admin"
    echo -e "     Password: $GRAFANA_PASS"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🐳 Docker Commands:${NC}"
    echo -e "  ${CYAN}📊 View logs:${NC}            docker-compose -f docker-compose.prod.yml logs -f"
    echo -e "  ${CYAN}📊 View specific logs:${NC}   docker-compose -f docker-compose.prod.yml logs -f veloflux-lb"
    echo -e "  ${CYAN}🔄 Restart services:${NC}     docker-compose -f docker-compose.prod.yml restart"
    echo -e "  ${CYAN}⏹️  Stop services:${NC}        docker-compose -f docker-compose.prod.yml down"
    echo -e "  ${CYAN}🗑️  Clean up:${NC}             docker-compose -f docker-compose.prod.yml down -v"
    echo -e "  ${CYAN}📈 Service status:${NC}        docker-compose -f docker-compose.prod.yml ps"
    echo ""
    
    echo -e "${YELLOW}${BOLD}📁 Important Files:${NC}"
    echo -e "  ${CYAN}🐳 Docker Compose:${NC}       docker-compose.prod.yml"
    echo -e "  ${CYAN}⚙️  Environment:${NC}          .env.docker"
    echo -e "  ${CYAN}📊 Monitoring Config:${NC}    monitoring/"
    echo -e "  ${CYAN}🔐 SSL Certificates:${NC}     certs/"
    echo ""
    
    echo -e "${GREEN}${BOLD}✨ Next Steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Visit http://localhost to access VeloFlux"
    echo -e "  ${YELLOW}2.${NC} Login to admin panel at http://localhost:9000"
    echo -e "  ${YELLOW}3.${NC} Configure your backend servers"
    echo -e "  ${YELLOW}4.${NC} Check monitoring dashboards in Grafana"
    echo -e "  ${YELLOW}5.${NC} Review logs: docker-compose -f docker-compose.prod.yml logs -f"
    echo ""
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}Thank you for choosing VeloFlux SaaS! 🚀${NC}"
    echo ""
}

# Main function
main() {
    echo ""
    print_step "Starting VeloFlux Docker Quick Install..."
    echo ""
    
    # Check prerequisites
    check_docker
    check_ports
    
    # Setup project
    create_docker_compose
    create_monitoring_config
    create_db_init
    create_env_file
    setup_dev_ssl
    
    # Start services
    start_services
    
    # Wait and verify
    wait_for_services
    
    # Run health checks
    if run_health_checks; then
        show_connection_info
    else
        echo ""
        print_error "Installation completed with some issues."
        print_info "Check logs with: docker-compose -f docker-compose.prod.yml logs"
    fi
}

# Handle interruption
trap 'print_error "Installation interrupted"; docker-compose -f docker-compose.prod.yml down; exit 1' INT TERM

# Run main function
main "$@"
