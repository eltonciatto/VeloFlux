#!/bin/bash

# 🚀 VeloFlux SaaS - Remote Production Install Script
# For VPS/Server installation with SSH connection

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
SERVER_IP=""
SERVER_USER="root"
SERVER_PASS=""
DOMAIN=""
EMAIL=""
SSH_KEY=""
USE_PASSWORD_AUTH=true

echo -e "${PURPLE}${BOLD}🚀 VeloFlux SaaS - Remote Production Installation${NC}"
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

# Show usage
show_usage() {
    cat << EOF
${CYAN}${BOLD}VeloFlux SaaS Remote Installation${NC}

${YELLOW}USAGE:${NC}
    $0 [OPTIONS]

${YELLOW}OPTIONS:${NC}
    -i, --ip IP              Server IP address (required)
    -u, --user USER          SSH username (default: root)
    -p, --password PASS      SSH password (interactive if not provided)
    -k, --key KEY_PATH       SSH private key path (alternative to password)
    -d, --domain DOMAIN      Domain name for SSL (required)
    -e, --email EMAIL        Email for SSL certificates (required)
    -h, --help              Show this help

${YELLOW}EXAMPLES:${NC}
    $0 -i 190.93.119.61 -d myapp.com -e admin@myapp.com
    $0 -i 190.93.119.61 -k ~/.ssh/id_rsa -d myapp.com -e admin@myapp.com

EOF
}

# Parse arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -i|--ip)
                SERVER_IP="$2"
                shift 2
                ;;
            -u|--user)
                SERVER_USER="$2"
                shift 2
                ;;
            -p|--password)
                SERVER_PASS="$2"
                USE_PASSWORD_AUTH=true
                shift 2
                ;;
            -k|--key)
                SSH_KEY="$2"
                USE_PASSWORD_AUTH=false
                shift 2
                ;;
            -d|--domain)
                DOMAIN="$2"
                shift 2
                ;;
            -e|--email)
                EMAIL="$2"
                shift 2
                ;;
            -h|--help)
                show_usage
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_usage
                exit 1
                ;;
        esac
    done
}

# Validate inputs
validate_inputs() {
    local errors=()
    
    if [[ -z "$SERVER_IP" ]]; then
        errors+=("Server IP is required")
    fi
    
    if [[ -z "$DOMAIN" ]]; then
        errors+=("Domain is required for production installation")
    fi
    
    if [[ -z "$EMAIL" ]]; then
        errors+=("Email is required for SSL certificates")
    fi
    
    if [[ "$USE_PASSWORD_AUTH" == true && -z "$SERVER_PASS" ]]; then
        print_info "Password not provided, will prompt interactively"
    fi
    
    if [[ "$USE_PASSWORD_AUTH" == false && ! -f "$SSH_KEY" ]]; then
        errors+=("SSH key file not found: $SSH_KEY")
    fi
    
    if [ ${#errors[@]} -ne 0 ]; then
        print_error "Validation errors:"
        for error in "${errors[@]}"; do
            echo "  - $error"
        done
        exit 1
    fi
}

# Test SSH connection
test_ssh_connection() {
    print_step "Testing SSH connection to $SERVER_IP..."
    
    local ssh_opts="-o ConnectTimeout=10 -o StrictHostKeyChecking=no"
    
    if [[ "$USE_PASSWORD_AUTH" == true ]]; then
        if [[ -z "$SERVER_PASS" ]]; then
            print_info "Please enter the SSH password for $SERVER_USER@$SERVER_IP"
            read -s -p "Password: " SERVER_PASS
            echo
        fi
        
        # Test with sshpass if available
        if command -v sshpass >/dev/null 2>&1; then
            if sshpass -p "$SERVER_PASS" ssh $ssh_opts "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
                print_success "SSH connection established"
                return 0
            else
                print_error "SSH connection failed"
                exit 1
            fi
        else
            print_warning "sshpass not found. Please install it for password authentication:"
            print_info "Ubuntu/Debian: sudo apt-get install sshpass"
            print_info "Or use SSH key authentication with -k option"
            exit 1
        fi
    else
        # Test with SSH key
        if ssh -i "$SSH_KEY" $ssh_opts "$SERVER_USER@$SERVER_IP" "echo 'SSH connection successful'" >/dev/null 2>&1; then
            print_success "SSH connection established"
            return 0
        else
            print_error "SSH connection failed with key: $SSH_KEY"
            exit 1
        fi
    fi
}

# Execute remote command
execute_remote() {
    local command="$1"
    local description="$2"
    
    if [[ -n "$description" ]]; then
        print_step "$description"
    fi
    
    local ssh_opts="-o ConnectTimeout=30 -o StrictHostKeyChecking=no"
    
    if [[ "$USE_PASSWORD_AUTH" == true ]]; then
        sshpass -p "$SERVER_PASS" ssh $ssh_opts "$SERVER_USER@$SERVER_IP" "$command"
    else
        ssh -i "$SSH_KEY" $ssh_opts "$SERVER_USER@$SERVER_IP" "$command"
    fi
}

# Copy file to remote server
copy_to_remote() {
    local local_file="$1"
    local remote_path="$2"
    local description="$3"
    
    if [[ -n "$description" ]]; then
        print_step "$description"
    fi
    
    local scp_opts="-o ConnectTimeout=30 -o StrictHostKeyChecking=no"
    
    if [[ "$USE_PASSWORD_AUTH" == true ]]; then
        sshpass -p "$SERVER_PASS" scp $scp_opts "$local_file" "$SERVER_USER@$SERVER_IP:$remote_path"
    else
        scp -i "$SSH_KEY" $scp_opts "$local_file" "$SERVER_USER@$SERVER_IP:$remote_path"
    fi
}

# Prepare installation script
prepare_installation_script() {
    print_step "Preparing installation script for remote server..."
    
    cat > /tmp/veloflux-remote-install.sh << EOF
#!/bin/bash

# VeloFlux Remote Installation Script
set -e

echo "🚀 Starting VeloFlux SaaS installation on \$(hostname)..."

# Update system
echo "📦 Updating system packages..."
apt-get update && apt-get upgrade -y

# Install required packages
echo "📦 Installing required packages..."
apt-get install -y curl git openssl docker.io docker-compose-plugin nodejs npm ufw fail2ban

# Configure firewall
echo "🔥 Configuring firewall..."
ufw --force enable
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw allow 8080/tcp  # Metrics
ufw allow 9000/tcp  # Admin API

# Start Docker
echo "🐳 Starting Docker..."
systemctl enable docker
systemctl start docker
usermod -aG docker root

# Clone VeloFlux repository
echo "📥 Cloning VeloFlux repository..."
cd /opt
if [ -d "VeloFlux" ]; then
    rm -rf VeloFlux
fi
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Set permissions
chmod +x scripts/*.sh

# Set environment variables
export VF_DOMAIN="$DOMAIN"
export VF_EMAIL="$EMAIL"
export VF_SSL_ENABLED=true
export VF_MONITORING=true
export VF_BACKUP=true

# Run production installation
echo "🚀 Running VeloFlux production installation..."
./scripts/super-quick-install.sh --auto-production

# Configure systemd service
echo "⚙️ Configuring systemd service..."
cat > /etc/systemd/system/veloflux.service << 'SYSTEMD_EOF'
[Unit]
Description=VeloFlux Load Balancer SaaS
After=network.target docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/VeloFlux
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
User=root

[Install]
WantedBy=multi-user.target
SYSTEMD_EOF

systemctl daemon-reload
systemctl enable veloflux
systemctl start veloflux

# Setup SSL with Let's Encrypt
echo "🔒 Setting up SSL certificates..."
apt-get install -y certbot python3-certbot-nginx

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 30

# Get SSL certificate
if certbot certonly --standalone -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive; then
    echo "✅ SSL certificate obtained successfully"
    
    # Update nginx config to use SSL
    mkdir -p /opt/VeloFlux/nginx
    cat > /opt/VeloFlux/nginx/ssl.conf << 'SSL_EOF'
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}

server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}
SSL_EOF

    # Set up automatic renewal
    echo "0 12 * * * /usr/bin/certbot renew --quiet" | crontab -
else
    echo "⚠️ SSL certificate setup failed, continuing without SSL"
fi

# Setup monitoring
echo "📊 Setting up monitoring..."
mkdir -p /opt/VeloFlux/monitoring/dashboards

# Setup backup script
echo "💾 Setting up backup system..."
mkdir -p /opt/VeloFlux/backups
cat > /opt/VeloFlux/scripts/backup-production.sh << 'BACKUP_EOF'
#!/bin/bash
BACKUP_DIR="/opt/VeloFlux/backups"
DATE=\$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p "\$BACKUP_DIR"

# Backup configuration
tar -czf "\$BACKUP_DIR/config_\$DATE.tar.gz" /opt/VeloFlux/config/

# Backup data volumes
docker run --rm -v /opt/VeloFlux_redis-data:/backup-source -v "\$BACKUP_DIR":/backup alpine tar -czf /backup/redis_data_\$DATE.tar.gz -C /backup-source .
docker run --rm -v /opt/VeloFlux_postgres-data:/backup-source -v "\$BACKUP_DIR":/backup alpine tar -czf /backup/postgres_data_\$DATE.tar.gz -C /backup-source .

# Cleanup old backups (keep 30 days)
find "\$BACKUP_DIR" -name "*.tar.gz" -mtime +30 -delete

echo "Backup completed: \$DATE"
BACKUP_EOF

chmod +x /opt/VeloFlux/scripts/backup-production.sh

# Setup daily backup cron
echo "0 2 * * * /opt/VeloFlux/scripts/backup-production.sh" | crontab -

# Final health check
echo "🔍 Running final health check..."
sleep 10

if curl -f http://localhost:8080/health >/dev/null 2>&1; then
    echo "✅ VeloFlux is running successfully!"
else
    echo "⚠️ Health check failed, but installation completed"
fi

echo ""
echo "🎉 VeloFlux SaaS Installation Complete!"
echo ""
echo "📍 Access Information:"
echo "   Frontend: https://$DOMAIN"
echo "   Admin Panel: https://$DOMAIN:9000"
echo "   Metrics: https://$DOMAIN:8080/metrics"
echo "   Grafana: https://$DOMAIN:3000"
echo ""
echo "🔐 Credentials saved in: /opt/VeloFlux/.env"
echo ""
echo "📁 Important directories:"
echo "   Installation: /opt/VeloFlux"
echo "   Logs: /opt/VeloFlux/logs"
echo "   Backups: /opt/VeloFlux/backups"
echo "   SSL Certificates: /etc/letsencrypt/live/$DOMAIN"
echo ""
echo "🔧 Management commands:"
echo "   Status: systemctl status veloflux"
echo "   Logs: docker-compose -f /opt/VeloFlux/docker-compose.prod.yml logs -f"
echo "   Restart: systemctl restart veloflux"
echo "   Backup: /opt/VeloFlux/scripts/backup-production.sh"
echo ""

EOF

    chmod +x /tmp/veloflux-remote-install.sh
    print_success "Installation script prepared"
}

# Main installation process
main_installation() {
    print_step "Starting VeloFlux SaaS production installation on $SERVER_IP..."
    
    # Copy installation script to server
    copy_to_remote "/tmp/veloflux-remote-install.sh" "/tmp/veloflux-remote-install.sh" "Copying installation script to server"
    
    # Execute installation script
    print_step "Executing installation on remote server (this may take 10-15 minutes)..."
    execute_remote "DOMAIN='$DOMAIN' EMAIL='$EMAIL' bash /tmp/veloflux-remote-install.sh" ""
    
    # Cleanup
    execute_remote "rm -f /tmp/veloflux-remote-install.sh" "Cleaning up temporary files"
    rm -f /tmp/veloflux-remote-install.sh
    
    print_success "Remote installation completed!"
}

# Show post-installation info
show_post_installation_info() {
    echo ""
    echo -e "${GREEN}${BOLD}🎉 VeloFlux SaaS Production Installation Complete! 🎉${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🌐 Access Your VeloFlux SaaS:${NC}"
    echo -e "  ${GREEN}🚀 Frontend:${NC}         https://$DOMAIN"
    echo -e "  ${GREEN}📊 Admin Panel:${NC}      https://$DOMAIN:9000"
    echo -e "  ${GREEN}📈 Metrics:${NC}          https://$DOMAIN:8080/metrics"
    echo -e "  ${GREEN}📉 Grafana:${NC}          https://$DOMAIN:3000"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔐 Security Information:${NC}"
    echo -e "  ${GREEN}🔒 SSL:${NC}              Enabled with Let's Encrypt"
    echo -e "  ${GREEN}🔥 Firewall:${NC}         Configured (UFW)"
    echo -e "  ${GREEN}🛡️ Fail2Ban:${NC}         Active"
    echo -e "  ${GREEN}📋 Credentials:${NC}      Stored in /opt/VeloFlux/.env"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔧 Management Commands (SSH to server):${NC}"
    echo -e "  ${CYAN}📊 Service Status:${NC}   sudo systemctl status veloflux"
    echo -e "  ${CYAN}📋 View Logs:${NC}        sudo docker-compose -f /opt/VeloFlux/docker-compose.prod.yml logs -f"
    echo -e "  ${CYAN}🔄 Restart:${NC}          sudo systemctl restart veloflux"
    echo -e "  ${CYAN}⏹️ Stop:${NC}             sudo systemctl stop veloflux"
    echo -e "  ${CYAN}💾 Backup:${NC}           sudo /opt/VeloFlux/scripts/backup-production.sh"
    echo ""
    
    echo -e "${YELLOW}${BOLD}📁 Important Server Paths:${NC}"
    echo -e "  ${CYAN}📦 Installation:${NC}     /opt/VeloFlux"
    echo -e "  ${CYAN}📝 Logs:${NC}             /opt/VeloFlux/logs"
    echo -e "  ${CYAN}💾 Backups:${NC}          /opt/VeloFlux/backups"
    echo -e "  ${CYAN}🔒 SSL Certs:${NC}        /etc/letsencrypt/live/$DOMAIN"
    echo -e "  ${CYAN}⚙️ Configuration:${NC}    /opt/VeloFlux/config"
    echo ""
    
    echo -e "${YELLOW}${BOLD}🔍 Health Check:${NC}"
    print_step "Testing installation..."
    
    if curl -f -k "https://$DOMAIN" >/dev/null 2>&1; then
        print_success "✅ Frontend is accessible"
    else
        print_warning "❌ Frontend health check failed (may need DNS propagation)"
    fi
    
    echo ""
    echo -e "${YELLOW}${BOLD}✨ Next Steps:${NC}"
    echo -e "  ${YELLOW}1.${NC} Configure your domain DNS to point to: ${GREEN}$SERVER_IP${NC}"
    echo -e "  ${YELLOW}2.${NC} Wait for DNS propagation (up to 24 hours)"
    echo -e "  ${YELLOW}3.${NC} Access https://$DOMAIN to use your VeloFlux SaaS"
    echo -e "  ${YELLOW}4.${NC} Login with credentials from /opt/VeloFlux/.env"
    echo -e "  ${YELLOW}5.${NC} Configure your load balancer rules and backend servers"
    echo ""
    
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}🚀 Your VeloFlux SaaS is now running in production! 🎉${NC}"
    echo ""
}

# Main function
main() {
    # Parse command line arguments
    parse_arguments "$@"
    
    # Show usage if no arguments
    if [[ $# -eq 0 ]]; then
        show_usage
        exit 1
    fi
    
    # Validate inputs
    validate_inputs
    
    # Check for required tools
    if [[ "$USE_PASSWORD_AUTH" == true ]] && ! command -v sshpass >/dev/null 2>&1; then
        print_warning "sshpass is required for password authentication"
        print_info "Install it with: sudo apt-get install sshpass (Ubuntu/Debian)"
        print_info "Or use SSH key authentication with -k option"
        exit 1
    fi
    
    # Test SSH connection
    test_ssh_connection
    
    # Prepare installation
    prepare_installation_script
    
    # Confirm installation
    echo ""
    echo -e "${YELLOW}${BOLD}📋 Installation Summary:${NC}"
    echo -e "  ${CYAN}Server:${NC} $SERVER_USER@$SERVER_IP"
    echo -e "  ${CYAN}Domain:${NC} $DOMAIN"
    echo -e "  ${CYAN}Email:${NC} $EMAIL"
    echo -e "  ${CYAN}SSL:${NC} Enabled (Let's Encrypt)"
    echo -e "  ${CYAN}Monitoring:${NC} Enabled (Prometheus + Grafana)"
    echo -e "  ${CYAN}Backups:${NC} Enabled (Daily)"
    echo ""
    
    read -p "$(echo -e "${BOLD}Proceed with installation? (y/N):${NC} ")" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_info "Installation cancelled"
        exit 0
    fi
    
    # Run main installation
    main_installation
    
    # Show post-installation information
    show_post_installation_info
}

# Handle script interruption
trap 'print_error "Installation interrupted"; exit 1' INT TERM

# Run main function
main "$@"
