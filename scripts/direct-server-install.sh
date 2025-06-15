#!/bin/bash

# 🚀 VeloFlux SaaS - Direct Installation Script for veloflux.io
# Para executar diretamente no servidor VPS

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

# Configuration
DOMAIN="veloflux.io"
EMAIL="admin@veloflux.io"
SERVER_IP="190.93.119.61"

echo -e "${PURPLE}${BOLD}🚀 VeloFlux SaaS - Production Installation for veloflux.io${NC}"
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

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

print_step "Starting VeloFlux SaaS production installation..."
print_info "Domain: $DOMAIN"
print_info "Email: $EMAIL"
print_info "Server IP: $SERVER_IP"

# Update system
print_step "Updating system packages..."
apt-get update -y
apt-get upgrade -y

# Install required packages
print_step "Installing required packages..."
apt-get install -y curl wget git openssl nginx certbot python3-certbot-nginx ufw fail2ban htop

# Install Docker
print_step "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    print_success "Docker installed"
else
    print_info "Docker already installed"
fi

# Install Docker Compose
print_step "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    print_success "Docker Compose installed"
else
    print_info "Docker Compose already installed"
fi

# Install Node.js
print_step "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_lts.x | bash -
    apt-get install -y nodejs
    print_success "Node.js installed"
else
    print_info "Node.js already installed"
fi

# Install Go
print_step "Installing Go..."
if ! command -v go &> /dev/null; then
    cd /tmp
    wget https://go.dev/dl/go1.21.6.linux-amd64.tar.gz
    tar -C /usr/local -xzf go1.21.6.linux-amd64.tar.gz
    echo 'export PATH=$PATH:/usr/local/go/bin' >> /root/.bashrc
    export PATH=$PATH:/usr/local/go/bin
    print_success "Go installed"
else
    print_info "Go already installed"
fi

# Create VeloFlux directory
print_step "Setting up VeloFlux application..."
cd /opt
if [ ! -d "veloflux" ]; then
    git clone https://github.com/eltonciatto/VeloFlux.git veloflux
else
    cd veloflux
    git pull origin main
    cd /opt
fi

cd /opt/veloflux

# Create environment file
print_step "Creating production environment configuration..."
cat > .env << EOF
# VeloFlux Production Environment
NODE_ENV=production
VF_DOMAIN=$DOMAIN
VF_ADMIN_USER=admin
VF_ADMIN_PASS=$(openssl rand -base64 32)
VF_JWT_SECRET=$(openssl rand -base64 64)
VF_SSL_ENABLED=true
VF_SSL_EMAIL=$EMAIL
VF_MONITORING_ENABLED=true
VF_BACKUP_ENABLED=true

# Database Configuration
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=$(openssl rand -base64 16)
POSTGRES_URL=postgresql://veloflux:$(openssl rand -base64 16)@localhost:5432/veloflux
POSTGRES_PASSWORD=$(openssl rand -base64 16)

# Monitoring
GRAFANA_PASSWORD=$(openssl rand -base64 16)
EOF

# Create production configuration
print_step "Creating production configuration..."
if [ ! -f config/config.yaml ]; then
    cp config/config.example.yaml config/config.yaml
fi

# Update configuration with domain
sed -i "s/example.com/$DOMAIN/g" config/config.yaml
sed -i "s/admin@example.com/$EMAIL/g" config/config.yaml
sed -i "s/auto_cert: false/auto_cert: true/g" config/config.yaml

# Install application dependencies
print_step "Installing application dependencies..."
npm install --production

# Build frontend
print_step "Building frontend application..."
npm run build

# Build Go backend
print_step "Building Go backend..."
export PATH=$PATH:/usr/local/go/bin
go mod tidy
go build -o veloflux-lb ./cmd/velofluxlb/

# Create systemd service
print_step "Creating systemd service..."
cat > /etc/systemd/system/veloflux.service << EOF
[Unit]
Description=VeloFlux Load Balancer SaaS
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/veloflux
ExecStartPre=/usr/bin/docker-compose -f /opt/veloflux/docker-compose.yml up -d
ExecStart=/opt/veloflux/veloflux-lb
ExecStop=/usr/bin/docker-compose -f /opt/veloflux/docker-compose.yml down
Restart=always
RestartSec=5
Environment=VFX_CONFIG=/opt/veloflux/config/config.yaml
Environment=PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/usr/local/go/bin

[Install]
WantedBy=multi-user.target
EOF

# Start Docker services
print_step "Starting Docker services..."
docker-compose up -d

# Configure firewall
print_step "Configuring firewall..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Configure Nginx reverse proxy
print_step "Configuring Nginx..."
cat > /etc/nginx/sites-available/veloflux << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /api {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
    
    location /metrics {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Enable Nginx site
ln -sf /etc/nginx/sites-available/veloflux /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx

# Get SSL certificate
print_step "Getting SSL certificate..."
certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive

# Start and enable VeloFlux service
print_step "Starting VeloFlux service..."
systemctl daemon-reload
systemctl enable veloflux
systemctl start veloflux

# Wait for services to start
print_step "Waiting for services to start..."
sleep 30

# Health check
print_step "Running health check..."
if curl -f http://localhost:8080/health &>/dev/null; then
    print_success "Health check passed"
else
    print_error "Health check failed, but continuing..."
fi

# Create backup script
print_step "Setting up backup system..."
mkdir -p /opt/veloflux/backups
cat > /opt/veloflux/scripts/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/veloflux/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Backup configuration
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" config/

# Backup data
docker exec veloflux_redis_1 redis-cli BGSAVE
tar -czf "$BACKUP_DIR/data_$DATE.tar.gz" data/

# Cleanup old backups (keep 30 days)
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: $DATE"
EOF

chmod +x /opt/veloflux/scripts/backup.sh

# Setup cron for daily backups
echo "0 2 * * * /opt/veloflux/scripts/backup.sh" | crontab -

# Get credentials from .env
ADMIN_PASS=$(grep VF_ADMIN_PASS /opt/veloflux/.env | cut -d'=' -f2)
GRAFANA_PASS=$(grep GRAFANA_PASSWORD /opt/veloflux/.env | cut -d'=' -f2)

# Show completion info
echo ""
echo -e "${GREEN}${BOLD}🎉 VeloFlux SaaS Installation Complete! 🎉${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}${BOLD}🌐 Access Information:${NC}"
echo -e "  ${GREEN}🚀 Main Site:${NC}          https://$DOMAIN"
echo -e "  ${GREEN}📊 Admin Panel:${NC}        https://$DOMAIN/api"
echo -e "  ${GREEN}📈 Metrics:${NC}            https://$DOMAIN/metrics"
echo -e "  ${GREEN}📉 Grafana:${NC}            http://$SERVER_IP:3000"
echo ""
echo -e "${YELLOW}${BOLD}🔐 Login Credentials:${NC}"
echo -e "  ${GREEN}👤 Admin User:${NC}         admin"
echo -e "  ${GREEN}🔑 Admin Password:${NC}     $ADMIN_PASS"
echo -e "  ${GREEN}📉 Grafana Password:${NC}   $GRAFANA_PASS"
echo ""
echo -e "${YELLOW}${BOLD}📋 System Commands:${NC}"
echo -e "  ${CYAN}📊 View logs:${NC}          journalctl -u veloflux -f"
echo -e "  ${CYAN}🔄 Restart:${NC}            systemctl restart veloflux"
echo -e "  ${CYAN}⏹️  Stop:${NC}               systemctl stop veloflux"
echo -e "  ${CYAN}📈 Status:${NC}             systemctl status veloflux"
echo -e "  ${CYAN}🗄️  Backup:${NC}             /opt/veloflux/scripts/backup.sh"
echo ""
echo -e "${YELLOW}${BOLD}📁 Important Files:${NC}"
echo -e "  ${CYAN}⚙️  Configuration:${NC}      /opt/veloflux/config/config.yaml"
echo -e "  ${CYAN}🔐 Environment:${NC}         /opt/veloflux/.env"
echo -e "  ${CYAN}📜 Logs:${NC}               journalctl -u veloflux"
echo -e "  ${CYAN}💾 Backups:${NC}             /opt/veloflux/backups/"
echo ""
echo -e "${GREEN}${BOLD}✨ Next Steps:${NC}"
echo -e "  ${YELLOW}1.${NC} Visit https://$DOMAIN to access your SaaS"
echo -e "  ${YELLOW}2.${NC} Login with the admin credentials above"
echo -e "  ${YELLOW}3.${NC} Configure your load balancer rules"
echo -e "  ${YELLOW}4.${NC} Add your backend servers"
echo -e "  ${YELLOW}5.${NC} Monitor via Grafana dashboards"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}${BOLD}🚀 VeloFlux SaaS is now running at https://$DOMAIN! 🚀${NC}"
echo ""

print_success "Installation completed successfully!"
