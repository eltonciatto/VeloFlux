#!/bin/bash

# VeloFlux - Simple Production Installation Script
# Clean and functional installation for production environments

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
INSTALL_DIR="/opt/veloflux"
CONFIG_DIR="/etc/veloflux"
LOG_DIR="/var/log/veloflux"
SERVICE_USER="veloflux"

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root"
    fi
}

# Check system requirements
check_requirements() {
    log "Checking system requirements..."
    
    # Check OS
    if ! command -v apt-get &> /dev/null; then
        error "This script requires Ubuntu/Debian with apt-get"
    fi
    
    # Check memory (minimum 1GB)
    MEMORY_GB=$(free -g | awk 'NR==2{print $2}')
    if [ "$MEMORY_GB" -lt 1 ]; then
        warn "Low memory detected (${MEMORY_GB}GB). Minimum 2GB recommended."
    fi
    
    # Check disk space (minimum 5GB)
    DISK_GB=$(df / | awk 'NR==2{print int($4/1024/1024)}')
    if [ "$DISK_GB" -lt 5 ]; then
        error "Insufficient disk space. Minimum 5GB required."
    fi
    
    log "✅ System requirements check passed"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies..."
    
    apt-get update
    apt-get install -y \
        curl \
        wget \
        git \
        nginx \
        ufw \
        htop \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release
    
    # Install Docker
    if ! command -v docker &> /dev/null; then
        log "Installing Docker..."
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
        echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
        apt-get update
        apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
        systemctl enable docker
        systemctl start docker
    fi
    
    # Install Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        log "Installing Docker Compose..."
        curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
        chmod +x /usr/local/bin/docker-compose
    fi
    
    # Install Go
    if ! command -v go &> /dev/null; then
        log "Installing Go..."
        GO_VERSION="1.21.0"
        wget "https://golang.org/dl/go${GO_VERSION}.linux-amd64.tar.gz"
        tar -C /usr/local -xzf "go${GO_VERSION}.linux-amd64.tar.gz"
        echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile
        export PATH=$PATH:/usr/local/go/bin
        rm "go${GO_VERSION}.linux-amd64.tar.gz"
    fi
    
    log "✅ Dependencies installed successfully"
}

# Create system user
create_user() {
    log "Creating system user..."
    
    if ! id "$SERVICE_USER" &>/dev/null; then
        useradd --system --shell /bin/false --home-dir "$INSTALL_DIR" --create-home "$SERVICE_USER"
        log "✅ User $SERVICE_USER created"
    else
        log "✅ User $SERVICE_USER already exists"
    fi
}

# Create directories
create_directories() {
    log "Creating directories..."
    
    mkdir -p "$INSTALL_DIR"/{bin,config,data,logs}
    mkdir -p "$CONFIG_DIR"
    mkdir -p "$LOG_DIR"
    
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR" "$LOG_DIR"
    chmod 755 "$INSTALL_DIR" "$CONFIG_DIR"
    
    log "✅ Directories created"
}

# Clone and build VeloFlux
build_veloflux() {
    log "Building VeloFlux..."
    
    cd /tmp
    if [ -d "VeloFlux" ]; then
        rm -rf VeloFlux
    fi
    
    git clone https://github.com/eltonciatto/VeloFlux.git
    cd VeloFlux
    
    # Build the load balancer
    export PATH=$PATH:/usr/local/go/bin
    go mod download
    CGO_ENABLED=0 go build -o "$INSTALL_DIR/bin/veloflux-lb" ./cmd/velofluxlb
    
    # Copy configuration files
    cp -r config/* "$CONFIG_DIR/" 2>/dev/null || true
    
    # Set permissions
    chmod +x "$INSTALL_DIR/bin/veloflux-lb"
    chown -R "$SERVICE_USER:$SERVICE_USER" "$INSTALL_DIR"
    
    log "✅ VeloFlux built successfully"
}

# Create configuration
create_config() {
    log "Creating configuration..."
    
    cat > "$CONFIG_DIR/config.yaml" << 'EOF'
# VeloFlux Configuration
server:
  bind_address: "0.0.0.0:8080"
  admin_address: "0.0.0.0:9000"
  
logging:
  level: "info"
  file: "/var/log/veloflux/veloflux.log"

backends:
  - name: "demo"
    url: "http://127.0.0.1:3001"
    weight: 100
    health_check:
      path: "/api/health"
      interval: "30s"

load_balancing:
  algorithm: "round_robin"
  
security:
  rate_limit:
    requests_per_minute: 100
    burst: 10
EOF

    chown "$SERVICE_USER:$SERVICE_USER" "$CONFIG_DIR/config.yaml"
    log "✅ Configuration created"
}

# Create systemd service
create_service() {
    log "Creating systemd service..."
    
    cat > /etc/systemd/system/veloflux.service << EOF
[Unit]
Description=VeloFlux Load Balancer
After=network.target
Wants=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_USER
ExecStart=$INSTALL_DIR/bin/veloflux-lb -config $CONFIG_DIR/config.yaml
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable veloflux
    
    log "✅ Systemd service created"
}

# Configure nginx
configure_nginx() {
    log "Configuring Nginx..."
    
    cat > /etc/nginx/sites-available/veloflux << 'EOF'
server {
    listen 80;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /admin {
        proxy_pass http://127.0.0.1:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /health {
        proxy_pass http://127.0.0.1:8080/api/health;
        access_log off;
    }
}
EOF

    # Remove default site
    rm -f /etc/nginx/sites-enabled/default
    
    # Enable VeloFlux site
    ln -sf /etc/nginx/sites-available/veloflux /etc/nginx/sites-enabled/
    
    # Test and reload nginx
    nginx -t && systemctl reload nginx
    
    log "✅ Nginx configured"
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall..."
    
    ufw --force reset
    ufw default deny incoming
    ufw default allow outgoing
    ufw allow ssh
    ufw allow 80/tcp
    ufw allow 443/tcp
    ufw --force enable
    
    log "✅ Firewall configured"
}

# Create demo backend
create_demo_backend() {
    log "Creating demo backend..."
    
    cat > "$INSTALL_DIR/demo-backend.py" << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
from datetime import datetime

class DemoHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/api/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'service': 'demo-backend'
            }
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(200)
            self.send_header('Content-type', 'text/html')
            self.end_headers()
            html = f"""
            <!DOCTYPE html>
            <html>
            <head><title>VeloFlux Demo</title></head>
            <body>
                <h1>🚀 VeloFlux Load Balancer</h1>
                <p>Demo backend is running!</p>
                <p>Time: {datetime.now()}</p>
                <p>Path: {self.path}</p>
            </body>
            </html>
            """
            self.wfile.write(html.encode())

if __name__ == "__main__":
    PORT = 3001
    with socketserver.TCPServer(("", PORT), DemoHandler) as httpd:
        print(f"Demo backend serving at port {PORT}")
        httpd.serve_forever()
EOF

    chmod +x "$INSTALL_DIR/demo-backend.py"
    
    # Create systemd service for demo backend
    cat > /etc/systemd/system/veloflux-demo.service << EOF
[Unit]
Description=VeloFlux Demo Backend
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
ExecStart=/usr/bin/python3 $INSTALL_DIR/demo-backend.py
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable veloflux-demo
    
    log "✅ Demo backend created"
}

# Start services
start_services() {
    log "Starting services..."
    
    systemctl start veloflux-demo
    systemctl start veloflux
    systemctl restart nginx
    
    # Wait a moment for services to start
    sleep 3
    
    log "✅ Services started"
}

# Verify installation
verify_installation() {
    log "Verifying installation..."
    
    # Check services
    if systemctl is-active --quiet veloflux; then
        log "✅ VeloFlux service is running"
    else
        error "❌ VeloFlux service failed to start"
    fi
    
    if systemctl is-active --quiet veloflux-demo; then
        log "✅ Demo backend is running"
    else
        error "❌ Demo backend failed to start"
    fi
    
    if systemctl is-active --quiet nginx; then
        log "✅ Nginx is running"
    else
        error "❌ Nginx failed to start"
    fi
    
    # Test endpoints
    sleep 5
    if curl -f -s http://localhost/health > /dev/null; then
        log "✅ Health endpoint is responding"
    else
        warn "⚠️ Health endpoint not responding yet"
    fi
    
    log "✅ Installation verification completed"
}

# Display final information
show_info() {
    local server_ip=$(curl -s ifconfig.me 2>/dev/null || echo "YOUR_SERVER_IP")
    
    echo
    echo -e "${GREEN}🎉 VeloFlux Installation Completed Successfully!${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    echo -e "${YELLOW}🌐 Access Points:${NC}"
    echo -e "   Main Application: ${GREEN}http://$server_ip/${NC}"
    echo -e "   Admin Panel:      ${GREEN}http://$server_ip/admin${NC}"
    echo -e "   Health Check:     ${GREEN}http://$server_ip/api/health${NC}"
    echo
    echo -e "${YELLOW}🔧 Management Commands:${NC}"
    echo -e "   Check status:     ${GREEN}systemctl status veloflux${NC}"
    echo -e "   View logs:        ${GREEN}journalctl -fu veloflux${NC}"
    echo -e "   Restart service:  ${GREEN}systemctl restart veloflux${NC}"
    echo
    echo -e "${YELLOW}📁 Important Directories:${NC}"
    echo -e "   Installation:     ${GREEN}$INSTALL_DIR${NC}"
    echo -e "   Configuration:    ${GREEN}$CONFIG_DIR${NC}"
    echo -e "   Logs:            ${GREEN}$LOG_DIR${NC}"
    echo
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Main installation flow
main() {
    echo -e "${BLUE}🚀 VeloFlux Production Installation${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    
    check_root
    check_requirements
    install_dependencies
    create_user
    create_directories
    build_veloflux
    create_config
    create_service
    configure_nginx
    setup_firewall
    create_demo_backend
    start_services
    verify_installation
    show_info
    
    log "🎉 Installation completed successfully!"
}

# Run main function
main "$@"
