#!/bin/bash

# VeloFlux SaaS Production Deployment Script
# Deploys and manages VeloFlux in production environment

set -euo pipefail

# Load configuration
source /etc/veloflux/.env

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[DEPLOY]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[DEPLOY]${NC} $1"
}

log_error() {
    echo -e "${RED}[DEPLOY]${NC} $1"
}

# Configuration
INSTALL_DIR="/opt/veloflux"
CONFIG_DIR="/etc/veloflux"
BACKUP_DIR="/var/backups/veloflux"
COMPOSE_FILE="$INSTALL_DIR/docker-compose.production.yml"

# Pre-deployment checks
pre_deployment_checks() {
    log_info "Running pre-deployment checks..."
    
    # Check if running as root
    if [[ $EUID -ne 0 ]]; then
        log_error "This script must be run as root"
        exit 1
    fi
    
    # Check if configuration exists
    if [[ ! -f "$CONFIG_DIR/config.yaml" ]]; then
        log_error "Configuration file not found: $CONFIG_DIR/config.yaml"
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    
    # Check disk space
    AVAILABLE_SPACE=$(df /var/lib/docker | awk 'NR==2 {print $4}')
    if [[ $AVAILABLE_SPACE -lt 5000000 ]]; then  # 5GB in KB
        log_error "Insufficient disk space. At least 5GB required."
        exit 1
    fi
    
    log_success "Pre-deployment checks passed"
}

# Create backup before deployment
create_backup() {
    log_info "Creating backup before deployment..."
    
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR/deployment_backup_$TIMESTAMP"
    
    mkdir -p "$BACKUP_PATH"
    
    # Backup configuration
    cp -r "$CONFIG_DIR" "$BACKUP_PATH/config"
    
    # Backup database
    if docker ps | grep -q veloflux-postgres; then
        docker exec veloflux-postgres pg_dump -U veloflux veloflux > "$BACKUP_PATH/database.sql"
    fi
    
    # Backup Redis data
    if docker ps | grep -q veloflux-redis; then
        docker exec veloflux-redis redis-cli -a "$VF_REDIS_PASS" --rdb "$BACKUP_PATH/redis.rdb"
    fi
    
    log_success "Backup created at: $BACKUP_PATH"
}

# Deploy services
deploy_services() {
    log_info "Deploying VeloFlux services..."
    
    cd "$INSTALL_DIR"
    
    # Pull latest images
    log_info "Pulling latest Docker images..."
    docker-compose -f "$COMPOSE_FILE" pull
    
    # Build custom images
    log_info "Building VeloFlux images..."
    docker-compose -f "$COMPOSE_FILE" build --no-cache
    
    # Deploy services with rolling update
    log_info "Starting services..."
    docker-compose -f "$COMPOSE_FILE" up -d --remove-orphans
    
    log_success "Services deployed"
}

# Configure SSL certificates
configure_ssl() {
    if [[ "$VF_SSL_ENABLED" == "true" ]]; then
        log_info "Configuring SSL certificates..."
        
        # Stop nginx temporarily
        systemctl stop nginx || true
        
        # Generate certificates for all domains
        DOMAINS=(
            "$VF_MAIN_DOMAIN"
            "$VF_ADMIN_DOMAIN"
            "$VF_API_DOMAIN"
            "grafana.$VF_MAIN_DOMAIN"
            "prometheus.$VF_MAIN_DOMAIN"
        )
        
        for domain in "${DOMAINS[@]}"; do
            log_info "Generating certificate for $domain..."
            certbot certonly --standalone \
                --non-interactive \
                --agree-tos \
                --email "$VF_SSL_EMAIL" \
                -d "$domain" || log_warning "Failed to generate certificate for $domain"
        done
        
        # Configure nginx with SSL
        cp "$INSTALL_DIR/config/nginx/veloflux-production.conf" "/etc/nginx/sites-available/veloflux"
        ln -sf "/etc/nginx/sites-available/veloflux" "/etc/nginx/sites-enabled/"
        rm -f "/etc/nginx/sites-enabled/default"
        
        # Test nginx configuration
        nginx -t && systemctl start nginx
        
        log_success "SSL certificates configured"
    fi
}

# Configure firewall
configure_firewall() {
    log_info "Configuring firewall..."
    
    # Enable UFW
    ufw --force enable
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP/HTTPS
    ufw allow 'Nginx Full'
    
    # Allow monitoring ports (restricted)
    ufw allow from 10.0.0.0/8 to any port 9090 comment 'Prometheus'
    ufw allow from 172.16.0.0/12 to any port 9090
    ufw allow from 192.168.0.0/16 to any port 9090
    
    ufw allow from 10.0.0.0/8 to any port 3001 comment 'Grafana'
    ufw allow from 172.16.0.0/12 to any port 3001
    ufw allow from 192.168.0.0/16 to any port 3001
    
    # Deny all other incoming traffic
    ufw default deny incoming
    ufw default allow outgoing
    
    log_success "Firewall configured"
}

# Configure monitoring
configure_monitoring() {
    log_info "Configuring monitoring..."
    
    # Wait for services to be ready
    sleep 30
    
    # Import Grafana dashboards
    if curl -sf http://localhost:3001/api/health >/dev/null; then
        log_info "Importing Grafana dashboards..."
        
        # VeloFlux main dashboard
        curl -X POST \
            -H "Content-Type: application/json" \
            -d @"$INSTALL_DIR/config/grafana/dashboards/veloflux-overview.json" \
            "http://admin:$VF_GRAFANA_PASS@localhost:3001/api/dashboards/db" || true
    fi
    
    log_success "Monitoring configured"
}

# Health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to start
    sleep 30
    
    HEALTH_CHECK_FAILED=false
    
    # Check VeloFlux LB
    for i in {1..5}; do
        if curl -sf http://localhost:8080/health >/dev/null; then
            log_success "VeloFlux LB health check passed"
            break
        else
            if [[ $i -eq 5 ]]; then
                log_error "VeloFlux LB health check failed"
                HEALTH_CHECK_FAILED=true
            else
                log_warning "VeloFlux LB health check failed, retrying..."
                sleep 10
            fi
        fi
    done
    
    # Check Redis
    if docker exec veloflux-redis-master redis-cli -a "$VF_REDIS_PASS" ping | grep -q PONG; then
        log_success "Redis health check passed"
    else
        log_error "Redis health check failed"
        HEALTH_CHECK_FAILED=true
    fi
    
    # Check PostgreSQL
    if docker exec veloflux-postgres pg_isready -U veloflux >/dev/null; then
        log_success "PostgreSQL health check passed"
    else
        log_error "PostgreSQL health check failed"
        HEALTH_CHECK_FAILED=true
    fi
    
    # Check Prometheus
    if curl -sf http://localhost:9090/-/healthy >/dev/null; then
        log_success "Prometheus health check passed"
    else
        log_error "Prometheus health check failed"
        HEALTH_CHECK_FAILED=true
    fi
    
    # Check Grafana
    if curl -sf http://localhost:3001/api/health >/dev/null; then
        log_success "Grafana health check passed"
    else
        log_error "Grafana health check failed"
        HEALTH_CHECK_FAILED=true
    fi
    
    if [[ "$HEALTH_CHECK_FAILED" == "true" ]]; then
        log_error "Some health checks failed. Please check the logs."
        return 1
    else
        log_success "All health checks passed"
        return 0
    fi
}

# Create systemd service for auto-restart
create_systemd_service() {
    log_info "Creating systemd service..."
    
    cat > /etc/systemd/system/veloflux.service << EOF
[Unit]
Description=VeloFlux SaaS Load Balancer
Documentation=https://docs.veloflux.io
After=docker.service
Requires=docker.service

[Service]
Type=forking
Restart=always
RestartSec=5
TimeoutStartSec=0
WorkingDirectory=$INSTALL_DIR
ExecStart=/usr/local/bin/docker-compose -f $COMPOSE_FILE up -d
ExecStop=/usr/local/bin/docker-compose -f $COMPOSE_FILE down
ExecReload=/usr/local/bin/docker-compose -f $COMPOSE_FILE restart

# Security
User=root
Group=root

# Limits
LimitNOFILE=1048576
LimitNPROC=1048576

[Install]
WantedBy=multi-user.target
EOF

    systemctl daemon-reload
    systemctl enable veloflux
    
    log_success "Systemd service created"
}

# Generate deployment report
generate_deployment_report() {
    log_info "Generating deployment report..."
    
    REPORT_FILE="/root/veloflux-deployment-report.txt"
    
    cat > "$REPORT_FILE" << EOF
============================================
🚀 VELOFLUX SAAS PRODUCTION DEPLOYMENT
============================================
✅ Deployment Date: $(date)
🏢 Environment: Production
🌐 Server: $(hostname -I | awk '{print $1}')
📦 Version: $VF_VERSION

🔗 SERVICE ENDPOINTS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🌍 Main Application:    https://$VF_MAIN_DOMAIN/
🔧 Admin Panel:         https://$VF_ADMIN_DOMAIN/
🔍 API:                 https://$VF_API_DOMAIN/
📊 Grafana:             https://grafana.$VF_MAIN_DOMAIN/
📈 Prometheus:          https://prometheus.$VF_MAIN_DOMAIN/
🚨 AlertManager:        http://$(hostname -I | awk '{print $1}'):9093/

🔑 CREDENTIALS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👤 Admin User:          admin
🔐 Admin Password:      $VF_ADMIN_PASS
🔒 API Key:             $VF_API_KEY
📊 Grafana Password:    $VF_GRAFANA_PASS

📊 DEPLOYED SERVICES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$(docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep veloflux)

📁 IMPORTANT PATHS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Configuration:      $CONFIG_DIR/
📊 Logs:               /var/log/veloflux/
💾 Data:               /var/lib/veloflux/
🔄 Backups:            $BACKUP_DIR/
🐳 Compose:            $COMPOSE_FILE

🛠️ MANAGEMENT COMMANDS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔍 Status:             systemctl status veloflux
🔄 Restart:            systemctl restart veloflux
📊 Logs:               docker-compose -f $COMPOSE_FILE logs -f
💾 Backup:             $INSTALL_DIR/scripts/backup.sh
🔄 Update:             $INSTALL_DIR/scripts/update.sh

🔒 SECURITY FEATURES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SSL/TLS Encryption
✅ WAF Protection
✅ Rate Limiting
✅ Firewall Configuration
✅ Fail2Ban Protection
✅ Security Headers

📊 MONITORING & ALERTING:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Prometheus Metrics
✅ Grafana Dashboards
✅ AlertManager Notifications
✅ Health Checks
✅ Log Aggregation

🎯 NEXT STEPS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Configure DNS records for all domains
2. Test all endpoints and functionality
3. Set up external monitoring (optional)
4. Configure backup schedule
5. Set up log rotation
6. Configure alert notifications (email/Slack)
7. Perform load testing
8. Create disaster recovery plan

🚀 VELOFLUX SAAS DEPLOYED SUCCESSFULLY!
============================================
EOF

    log_success "Deployment report saved to: $REPORT_FILE"
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            log_info "Starting VeloFlux SaaS production deployment..."
            pre_deployment_checks
            create_backup
            deploy_services
            configure_ssl
            configure_firewall
            configure_monitoring
            create_systemd_service
            
            if run_health_checks; then
                generate_deployment_report
                log_success "🎉 VeloFlux SaaS deployed successfully!"
                log_info "📋 Check the deployment report: /root/veloflux-deployment-report.txt"
            else
                log_error "❌ Deployment completed with health check failures"
                exit 1
            fi
            ;;
        "status")
            log_info "VeloFlux service status:"
            systemctl status veloflux
            docker-compose -f "$COMPOSE_FILE" ps
            ;;
        "logs")
            docker-compose -f "$COMPOSE_FILE" logs -f "${2:-}"
            ;;
        "restart")
            log_info "Restarting VeloFlux services..."
            systemctl restart veloflux
            ;;
        "stop")
            log_info "Stopping VeloFlux services..."
            systemctl stop veloflux
            ;;
        "update")
            log_info "Updating VeloFlux..."
            create_backup
            deploy_services
            run_health_checks
            ;;
        *)
            echo "Usage: $0 {deploy|status|logs|restart|stop|update}"
            echo ""
            echo "Commands:"
            echo "  deploy  - Deploy VeloFlux SaaS (full installation)"
            echo "  status  - Show service status"
            echo "  logs    - Show service logs"
            echo "  restart - Restart all services"
            echo "  stop    - Stop all services"
            echo "  update  - Update to latest version"
            exit 1
            ;;
    esac
}

main "$@"
