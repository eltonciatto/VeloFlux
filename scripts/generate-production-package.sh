#!/bin/bash

# VeloFlux SaaS Production Package Generator
# Generates a complete installation package for manual deployment

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

# Create deployment package
create_deployment_package() {
    log "Criando pacote de deployment VeloFlux SaaS Production..."
    
    PACKAGE_DIR="veloflux-saas-production-$(date +%Y%m%d-%H%M%S)"
    mkdir -p "$PACKAGE_DIR"
    
    # Copy core files
    cp -r scripts/ "$PACKAGE_DIR/"
    cp -r config/ "$PACKAGE_DIR/"
    cp -r cmd/ "$PACKAGE_DIR/"
    cp -r internal/ "$PACKAGE_DIR/"
    cp -r public/ "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Copy configuration files
    cp Dockerfile.production "$PACKAGE_DIR/"
    cp docker-compose.yml "$PACKAGE_DIR/"
    cp go.mod go.sum "$PACKAGE_DIR/"
    cp package.json "$PACKAGE_DIR/" 2>/dev/null || true
    
    # Make all scripts executable
    chmod +x "$PACKAGE_DIR/scripts/"*.sh
    
    # Create deployment instructions
    cat > "$PACKAGE_DIR/DEPLOY.md" << 'EOF'
# VeloFlux SaaS Production Deployment Guide

## Prerequisites
- Ubuntu 20.04+ or CentOS 7+
- Root access to the server
- Internet connectivity
- At least 4GB RAM and 20GB disk space

## Quick Installation

1. Upload this entire directory to your server:
   ```bash
   scp -r veloflux-saas-production-* root@YOUR_SERVER_IP:/tmp/
   ```

2. SSH into your server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. Navigate to the uploaded directory:
   ```bash
   cd /tmp/veloflux-saas-production-*
   ```

4. Run the production installation:
   ```bash
   ./scripts/install-veloflux-saas-production.sh
   ```

## Configuration

Before running the installation, you can customize the following environment variables:

```bash
export MAIN_DOMAIN="your-domain.com"
export ADMIN_DOMAIN="admin.your-domain.com"
export API_DOMAIN="api.your-domain.com"
export EMAIL="admin@your-domain.com"
export ENABLE_SSL="true"
export ENABLE_MONITORING="true"
```

## Post-Installation

1. Configure DNS records to point to your server IP
2. Access Grafana at http://YOUR_SERVER_IP:3000 (admin/admin)
3. Access your application at http://YOUR_SERVER_IP/
4. Check system status: `systemctl status veloflux`

## Monitoring & Maintenance

- **Logs**: `/var/log/veloflux/`
- **Backup**: Run `/opt/veloflux/scripts/backup.sh`
- **Health Check**: `/opt/veloflux/scripts/healthcheck.sh`
- **Monitoring**: `/opt/veloflux/scripts/monitor.sh`

## Support

For issues, check the installation logs in `/tmp/veloflux-install.log`
EOF

    # Create a one-liner installation script
    cat > "$PACKAGE_DIR/install.sh" << 'EOF'
#!/bin/bash
# VeloFlux SaaS One-liner Installation

set -euo pipefail

echo "🚀 Starting VeloFlux SaaS Production Installation..."

# Set default configuration
export MAIN_DOMAIN="${MAIN_DOMAIN:-veloflux.io}"
export ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.veloflux.io}"
export API_DOMAIN="${API_DOMAIN:-api.veloflux.io}"
export EMAIL="${EMAIL:-admin@veloflux.io}"
export ENABLE_SSL="${ENABLE_SSL:-true}"
export ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
export ENABLE_BACKUP="${ENABLE_BACKUP:-true}"

# Run the main installation
./scripts/install-veloflux-saas-production.sh 2>&1 | tee /tmp/veloflux-install.log

echo "✅ Installation completed!"
echo "📊 Access Grafana at: http://$(curl -s ifconfig.me):3000"
echo "🌐 Access application at: http://$(curl -s ifconfig.me)/"
echo "📋 Check logs at: /tmp/veloflux-install.log"
EOF

    chmod +x "$PACKAGE_DIR/install.sh"
    
    # Create package archive
    tar czf "${PACKAGE_DIR}.tar.gz" "$PACKAGE_DIR"
    
    log "✅ Pacote criado: ${PACKAGE_DIR}.tar.gz"
    
    return "$PACKAGE_DIR"
}

# Generate installation commands
generate_installation_commands() {
    local package_dir="$1"
    
    cat > "INSTALLATION_COMMANDS.md" << EOF
# VeloFlux SaaS Production - Installation Commands

## Method 1: Direct Upload and Install

\`\`\`bash
# Upload the package to your server
scp ${package_dir}.tar.gz root@YOUR_SERVER_IP:/tmp/

# SSH into your server
ssh root@YOUR_SERVER_IP

# Extract and install
cd /tmp
tar xzf ${package_dir}.tar.gz
cd ${package_dir}
./install.sh
\`\`\`

## Method 2: Download and Install on Server

\`\`\`bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Download (if you have a download link)
# wget https://your-domain.com/${package_dir}.tar.gz
# Or upload manually and then:

cd /tmp
tar xzf ${package_dir}.tar.gz
cd ${package_dir}

# Optional: Customize configuration
export MAIN_DOMAIN="your-domain.com"
export EMAIL="admin@your-domain.com"

# Run installation
./install.sh
\`\`\`

## Method 3: Step by Step Installation

\`\`\`bash
cd /tmp/${package_dir}

# Run individual components
./scripts/install-veloflux-saas-production.sh    # Main installation
./scripts/deploy-production.sh                    # Production deployment
./scripts/healthcheck.sh                         # Health verification
\`\`\`

## Verification Commands

\`\`\`bash
# Check services
systemctl status veloflux
systemctl status nginx
docker ps

# Check endpoints
curl http://localhost/
curl http://localhost/health
curl http://localhost:3000/   # Grafana
curl http://localhost:9090/   # Prometheus

# Check logs
tail -f /var/log/veloflux/veloflux.log
tail -f /tmp/veloflux-install.log
\`\`\`

## Access Points

- **Main Application**: http://YOUR_SERVER_IP/
- **Admin Panel**: http://YOUR_SERVER_IP/admin
- **API**: http://YOUR_SERVER_IP/api
- **Grafana**: http://YOUR_SERVER_IP:3000 (admin/admin)
- **Prometheus**: http://YOUR_SERVER_IP:9090
- **Health Check**: http://YOUR_SERVER_IP/health

## Post-Installation

1. Configure DNS records to point your domains to the server IP
2. SSL certificates will be automatically generated once DNS is configured
3. Access Grafana and customize your dashboards
4. Set up monitoring alerts
5. Configure backup schedules

## Troubleshooting

- **Logs**: \`tail -f /var/log/veloflux/*\`
- **Service Status**: \`systemctl status veloflux\`
- **Docker Status**: \`docker ps\`
- **Network**: \`ss -tlnp | grep -E ":(80|443|3000|9090)"\`

EOF

    log "✅ Comandos de instalação gerados: INSTALLATION_COMMANDS.md"
}

# Create a comprehensive status script
create_status_script() {
    local package_dir="$1"
    
    cat > "$package_dir/check-status.sh" << 'EOF'
#!/bin/bash

# VeloFlux SaaS Status Checker

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

check_service() {
    local service="$1"
    if systemctl is-active --quiet "$service"; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
    fi
}

check_port() {
    local port="$1"
    local service="$2"
    if ss -tlnp | grep -q ":$port "; then
        echo -e "${GREEN}✅ Port $port ($service) is listening${NC}"
    else
        echo -e "${RED}❌ Port $port ($service) is not listening${NC}"
    fi
}

check_endpoint() {
    local url="$1"
    local name="$2"
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name endpoint is responding${NC}"
    else
        echo -e "${RED}❌ $name endpoint is not responding${NC}"
    fi
}

echo "=== VeloFlux SaaS Status Report ==="
echo "Generated at: $(date)"
echo

echo "=== System Services ==="
check_service "veloflux"
check_service "veloflux-lb"
check_service "nginx"
check_service "docker"
echo

echo "=== Network Ports ==="
check_port "80" "HTTP"
check_port "443" "HTTPS"
check_port "3000" "Grafana"
check_port "9090" "Prometheus"
check_port "6379" "Redis"
check_port "5432" "PostgreSQL"
echo

echo "=== Docker Containers ==="
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo

echo "=== HTTP Endpoints ==="
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
check_endpoint "http://$SERVER_IP/" "Main Application"
check_endpoint "http://$SERVER_IP/health" "Health Check"
check_endpoint "http://$SERVER_IP:3000/" "Grafana"
check_endpoint "http://$SERVER_IP:9090/" "Prometheus"
echo

echo "=== System Resources ==="
echo "Memory Usage:"
free -h
echo
echo "Disk Usage:"
df -h /
echo
echo "Load Average:"
uptime
echo

echo "=== Recent Logs ==="
echo "VeloFlux Logs (last 10 lines):"
tail -10 /var/log/veloflux/veloflux.log 2>/dev/null || echo "No logs found"
echo

echo "Installation Logs (last 10 lines):"
tail -10 /tmp/veloflux-install.log 2>/dev/null || echo "No installation logs found"
echo

echo "=== Access Information ==="
echo "Main Application: http://$SERVER_IP/"
echo "Grafana Dashboard: http://$SERVER_IP:3000 (admin/admin)"
echo "Prometheus Metrics: http://$SERVER_IP:9090"
echo "Health Check: http://$SERVER_IP/health"
echo

echo "=== Next Steps ==="
echo "1. Configure DNS to point your domains to: $SERVER_IP"
echo "2. SSL certificates will be auto-generated once DNS is ready"
echo "3. Customize Grafana dashboards and alerts"
echo "4. Review backup and monitoring configurations"
EOF

    chmod +x "$package_dir/check-status.sh"
    log "✅ Script de status criado: $package_dir/check-status.sh"
}

# Main function
main() {
    log "🚀 Gerando pacote de produção VeloFlux SaaS..."
    
    package_dir=$(create_deployment_package)
    generate_installation_commands "$package_dir"
    create_status_script "$package_dir"
    
    log "📦 Pacote de deployment criado com sucesso!"
    log "📁 Diretório: $package_dir/"
    log "📦 Arquivo: ${package_dir}.tar.gz"
    log "📋 Instruções: INSTALLATION_COMMANDS.md"
    
    echo
    echo -e "${BLUE}=== Como usar ===${NC}"
    echo "1. Envie o arquivo ${package_dir}.tar.gz para seu servidor"
    echo "2. Extraia e execute: tar xzf ${package_dir}.tar.gz && cd ${package_dir} && ./install.sh"
    echo "3. Siga as instruções em INSTALLATION_COMMANDS.md"
    echo
    echo -e "${YELLOW}=== Arquivos gerados ===${NC}"
    ls -la "${package_dir}.tar.gz" 2>/dev/null || true
    ls -la "INSTALLATION_COMMANDS.md" 2>/dev/null || true
    
    # Show package contents
    echo
    echo -e "${BLUE}=== Conteúdo do pacote ===${NC}"
    tar -tzf "${package_dir}.tar.gz" | head -20
    echo "... ($(tar -tzf "${package_dir}.tar.gz" | wc -l) arquivos no total)"
}

main "$@"
