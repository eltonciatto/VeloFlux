#!/bin/bash

# VeloFlux SaaS Production Installation Executor
# This script will prepare and execute the production installation

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
VPS_IP="${VPS_IP:-146.190.152.103}"
VPS_USER="${VPS_USER:-root}"
DOMAIN="${DOMAIN:-veloflux.io}"
EMAIL="${EMAIL:-admin@veloflux.io}"

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

# Check if we have SSH access
check_ssh_access() {
    log "Verificando acesso SSH ao VPS..."
    if ! ssh -o ConnectTimeout=10 -o BatchMode=yes "$VPS_USER@$VPS_IP" "echo 'SSH access confirmed'" 2>/dev/null; then
        error "Não foi possível conectar ao VPS. Verifique suas credenciais SSH."
    fi
    log "✅ Acesso SSH confirmado"
}

# Copy installation files to VPS
copy_files_to_vps() {
    log "Copiando arquivos de instalação para o VPS..."
    
    # Create remote directory
    ssh "$VPS_USER@$VPS_IP" "mkdir -p /tmp/veloflux-install"
    
    # Copy all necessary files
    scp -r scripts/ "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    scp -r config/ "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    scp Dockerfile.production "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    scp docker-compose.yml "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    scp go.mod go.sum "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    
    # Copy source code
    tar czf /tmp/veloflux-src.tar.gz cmd/ internal/ public/ --exclude="*.git*" --exclude="node_modules" 2>/dev/null || true
    scp /tmp/veloflux-src.tar.gz "$VPS_USER@$VPS_IP:/tmp/veloflux-install/"
    
    log "✅ Arquivos copiados com sucesso"
}

# Execute production installation
execute_production_install() {
    log "Executando instalação de produção no VPS..."
    
    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /tmp/veloflux-install
        
        # Extract source code
        if [ -f veloflux-src.tar.gz ]; then
            tar xzf veloflux-src.tar.gz
        fi
        
        # Make scripts executable
        chmod +x scripts/*.sh
        
        # Set environment variables for production install
        export MAIN_DOMAIN="veloflux.io"
        export ADMIN_DOMAIN="admin.veloflux.io"
        export API_DOMAIN="api.veloflux.io"
        export METRICS_DOMAIN="metrics.veloflux.io"
        export GRAFANA_DOMAIN="grafana.veloflux.io"
        export PROMETHEUS_DOMAIN="prometheus.veloflux.io"
        export EMAIL="admin@veloflux.io"
        export ENABLE_SSL="true"
        export ENABLE_CLUSTERING="true"
        export ENABLE_MONITORING="true"
        export ENABLE_BACKUP="true"
        export ENABLE_WAF="true"
        export ENABLE_RATE_LIMITING="true"
        
        # Execute the production installation
        echo "🚀 Iniciando instalação de produção VeloFlux SaaS..."
        ./scripts/install-veloflux-saas-production.sh 2>&1 | tee /tmp/veloflux-install.log
EOF
    
    if [ $? -eq 0 ]; then
        log "✅ Instalação de produção concluída com sucesso"
    else
        error "❌ Falha na instalação de produção"
    fi
}

# Get installation logs
get_installation_logs() {
    log "Recuperando logs de instalação..."
    scp "$VPS_USER@$VPS_IP:/tmp/veloflux-install.log" ./veloflux-production-install.log 2>/dev/null || true
    
    # Get system status
    ssh "$VPS_USER@$VPS_IP" << 'EOF' > ./veloflux-production-status.log 2>&1
        echo "=== VeloFlux Production Status Report ==="
        echo "Generated at: $(date)"
        echo
        
        echo "=== System Information ==="
        uname -a
        cat /etc/os-release | head -5
        echo
        
        echo "=== Docker Status ==="
        docker --version
        docker-compose --version
        docker ps
        echo
        
        echo "=== VeloFlux Services ==="
        systemctl status veloflux || true
        systemctl status veloflux-lb || true
        systemctl status veloflux-monitor || true
        echo
        
        echo "=== Network Status ==="
        ss -tlnp | grep -E ":(80|443|8080|9090|3000)"
        echo
        
        echo "=== Nginx Status ==="
        nginx -t 2>&1 || true
        systemctl status nginx || true
        echo
        
        echo "=== SSL Certificates ==="
        ls -la /etc/letsencrypt/live/ 2>/dev/null || echo "No SSL certificates found"
        echo
        
        echo "=== Disk Usage ==="
        df -h
        echo
        
        echo "=== Memory Usage ==="
        free -h
        echo
        
        echo "=== Load Average ==="
        uptime
        echo
        
        echo "=== Recent Logs ==="
        tail -20 /var/log/veloflux/veloflux.log 2>/dev/null || echo "No application logs found"
EOF
    
    log "✅ Logs salvos em veloflux-production-install.log e veloflux-production-status.log"
}

# Test installation
test_installation() {
    log "Testando instalação..."
    
    # Test main endpoints
    if curl -f -s "http://$VPS_IP/" > /dev/null; then
        log "✅ Endpoint principal respondendo"
    else
        warn "❌ Endpoint principal não respondeu"
    fi
    
    if curl -f -s "http://$VPS_IP/health" > /dev/null; then
        log "✅ Health check respondendo"
    else
        warn "❌ Health check não respondeu"
    fi
    
    if curl -f -s "http://$VPS_IP:9090/" > /dev/null; then
        log "✅ Prometheus respondendo"
    else
        warn "❌ Prometheus não respondeu"
    fi
    
    if curl -f -s "http://$VPS_IP:3000/" > /dev/null; then
        log "✅ Grafana respondendo"
    else
        warn "❌ Grafana não respondeu"
    fi
}

# Generate final credentials and report
generate_final_report() {
    log "Gerando relatório final..."
    
    cat > ./veloflux-production-credentials.txt << EOF
=== VeloFlux SaaS Production Deployment - Credentials & Access ===
Generated at: $(date)

=== Server Information ===
VPS IP: $VPS_IP
Main Domain: $DOMAIN
SSH Access: $VPS_USER@$VPS_IP

=== Web Interfaces ===
Main Application: http://$VPS_IP/ (https://$DOMAIN when SSL is ready)
Admin Panel: http://$VPS_IP/admin (https://admin.$DOMAIN when SSL is ready)
API Endpoint: http://$VPS_IP/api (https://api.$DOMAIN when SSL is ready)
Grafana Dashboard: http://$VPS_IP:3000 (admin/admin - change on first login)
Prometheus Metrics: http://$VPS_IP:9090
Health Check: http://$VPS_IP/health

=== System Services ===
- VeloFlux Load Balancer: systemctl status veloflux-lb
- VeloFlux Monitor: systemctl status veloflux-monitor  
- Nginx Proxy: systemctl status nginx
- Docker Services: docker ps
- Redis Cache: docker exec -it veloflux-redis redis-cli
- PostgreSQL: docker exec -it veloflux-postgres psql -U veloflux

=== Configuration Locations ===
- Installation Directory: /opt/veloflux
- Configuration Files: /etc/veloflux
- Log Files: /var/log/veloflux
- Data Directory: /var/lib/veloflux
- Backup Directory: /var/backups/veloflux

=== SSL Configuration ===
Once DNS is properly configured, SSL certificates will be automatically generated using Let's Encrypt.
Make sure your domains point to: $VPS_IP

=== Monitoring & Alerts ===
- Grafana: http://$VPS_IP:3000 (admin/admin)
- Prometheus: http://$VPS_IP:9090
- System monitoring via scripts in /opt/veloflux/scripts/

=== Backup & Maintenance ===
- Automated backup: /opt/veloflux/scripts/backup.sh
- Health monitoring: /opt/veloflux/scripts/monitor.sh
- Manual backup: /opt/veloflux/scripts/backup.sh --manual

=== Next Steps ===
1. Configure your DNS records to point to $VPS_IP
2. Update SSL certificate generation once DNS is ready
3. Configure Grafana dashboards and alerts
4. Review and customize monitoring thresholds
5. Test backup and recovery procedures
6. Set up automated updates and maintenance windows

=== Support ===
- Installation logs: ./veloflux-production-install.log
- System status: ./veloflux-production-status.log
- This credentials file: ./veloflux-production-credentials.txt

EOF

    log "✅ Relatório final gerado: veloflux-production-credentials.txt"
}

# Main execution
main() {
    log "🚀 Iniciando execução da instalação de produção VeloFlux SaaS"
    log "VPS: $VPS_IP | Domain: $DOMAIN | Email: $EMAIL"
    
    check_ssh_access
    copy_files_to_vps
    execute_production_install
    get_installation_logs
    test_installation
    generate_final_report
    
    log "🎉 Instalação de produção concluída!"
    log "📋 Verifique os arquivos gerados:"
    log "   - veloflux-production-install.log (logs de instalação)"
    log "   - veloflux-production-status.log (status do sistema)"
    log "   - veloflux-production-credentials.txt (credenciais e acessos)"
    
    echo
    echo -e "${CYAN}=== Próximos Passos ===${NC}"
    echo "1. Configure DNS para apontar domínios para $VPS_IP"
    echo "2. Acesse Grafana em http://$VPS_IP:3000 (admin/admin)"
    echo "3. Acesse aplicação em http://$VPS_IP/"
    echo "4. Verifique logs e monitoramento"
}

# Execute main function
main "$@"
