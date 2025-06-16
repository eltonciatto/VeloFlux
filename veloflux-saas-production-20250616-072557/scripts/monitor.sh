#!/bin/bash

# VeloFlux SaaS System Monitor
# Comprehensive monitoring script for production environment

set -euo pipefail

# Configuration
CONFIG_DIR="/etc/veloflux"
LOG_DIR="/var/log/veloflux"
MONITOR_LOG="$LOG_DIR/monitor.log"
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_LOAD=5.0

# Load environment
source "$CONFIG_DIR/.env" 2>/dev/null || true

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[MONITOR]${NC} $1" | tee -a "$MONITOR_LOG"
}

log_success() {
    echo -e "${GREEN}[MONITOR]${NC} $1" | tee -a "$MONITOR_LOG"
}

log_warning() {
    echo -e "${YELLOW}[MONITOR]${NC} $1" | tee -a "$MONITOR_LOG"
}

log_error() {
    echo -e "${RED}[MONITOR]${NC} $1" | tee -a "$MONITOR_LOG"
}

log_header() {
    echo -e "${CYAN}============================================${NC}"
    echo -e "${CYAN} $1 ${NC}"
    echo -e "${CYAN}============================================${NC}"
}

# Check system resources
check_system_resources() {
    log_header "SYSTEM RESOURCES"
    
    # CPU Usage
    CPU_USAGE=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')
    if (( $(echo "$CPU_USAGE > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        log_error "🔥 HIGH CPU USAGE: ${CPU_USAGE}%"
    else
        log_success "✅ CPU Usage: ${CPU_USAGE}%"
    fi
    
    # Memory Usage
    MEMORY_INFO=$(free | grep Mem)
    MEMORY_TOTAL=$(echo $MEMORY_INFO | awk '{print $2}')
    MEMORY_USED=$(echo $MEMORY_INFO | awk '{print $3}')
    MEMORY_USAGE=$(echo "scale=1; $MEMORY_USED/$MEMORY_TOTAL*100" | bc)
    
    if (( $(echo "$MEMORY_USAGE > $ALERT_THRESHOLD_MEMORY" | bc -l) )); then
        log_error "🔥 HIGH MEMORY USAGE: ${MEMORY_USAGE}%"
    else
        log_success "✅ Memory Usage: ${MEMORY_USAGE}%"
    fi
    
    # Disk Usage
    DISK_USAGE=$(df / | awk 'NR==2{print $5}' | sed 's/%//')
    if [[ $DISK_USAGE -gt $ALERT_THRESHOLD_DISK ]]; then
        log_error "🔥 HIGH DISK USAGE: ${DISK_USAGE}%"
    else
        log_success "✅ Disk Usage: ${DISK_USAGE}%"
    fi
    
    # Load Average
    LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    if (( $(echo "$LOAD_AVG > $ALERT_THRESHOLD_LOAD" | bc -l) )); then
        log_error "🔥 HIGH LOAD AVERAGE: $LOAD_AVG"
    else
        log_success "✅ Load Average: $LOAD_AVG"
    fi
    
    # Swap Usage
    SWAP_USAGE=$(free | grep Swap | awk '{if($2>0) print ($3/$2)*100; else print 0}')
    if (( $(echo "$SWAP_USAGE > 50" | bc -l) )); then
        log_warning "⚠️  Swap Usage: ${SWAP_USAGE}%"
    else
        log_success "✅ Swap Usage: ${SWAP_USAGE}%"
    fi
}

# Check Docker containers
check_docker_containers() {
    log_header "DOCKER CONTAINERS"
    
    # Check if Docker is running
    if ! docker info >/dev/null 2>&1; then
        log_error "❌ Docker service is not running"
        return 1
    fi
    
    # List all VeloFlux containers
    CONTAINERS=(
        "veloflux-lb-1"
        "veloflux-lb-2"
        "veloflux-redis-master"
        "veloflux-postgres"
        "veloflux-prometheus"
        "veloflux-grafana"
        "veloflux-alertmanager"
        "veloflux-node-exporter"
        "veloflux-cadvisor"
    )
    
    for container in "${CONTAINERS[@]}"; do
        if docker ps --format "table {{.Names}}" | grep -q "^$container$"; then
            STATUS=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null || echo "not found")
            HEALTH=$(docker inspect --format='{{.State.Health.Status}}' "$container" 2>/dev/null || echo "no health check")
            
            if [[ "$STATUS" == "running" ]]; then
                if [[ "$HEALTH" == "healthy" || "$HEALTH" == "no health check" ]]; then
                    log_success "✅ $container: $STATUS ($HEALTH)"
                else
                    log_warning "⚠️  $container: $STATUS ($HEALTH)"
                fi
            else
                log_error "❌ $container: $STATUS"
            fi
        else
            log_error "❌ $container: Not found"
        fi
    done
}

# Check service endpoints
check_service_endpoints() {
    log_header "SERVICE ENDPOINTS"
    
    # VeloFlux Load Balancer
    if curl -sf --max-time 10 http://localhost:8080/health >/dev/null; then
        log_success "✅ VeloFlux LB (8080): Healthy"
    else
        log_error "❌ VeloFlux LB (8080): Unhealthy"
    fi
    
    # VeloFlux Admin API
    if curl -sf --max-time 10 http://localhost:9000/health >/dev/null; then
        log_success "✅ VeloFlux Admin (9000): Healthy"
    else
        log_warning "⚠️  VeloFlux Admin (9000): Unhealthy"
    fi
    
    # Prometheus
    if curl -sf --max-time 10 http://localhost:9090/-/healthy >/dev/null; then
        log_success "✅ Prometheus (9090): Healthy"
    else
        log_error "❌ Prometheus (9090): Unhealthy"
    fi
    
    # Grafana
    if curl -sf --max-time 10 http://localhost:3001/api/health >/dev/null; then
        log_success "✅ Grafana (3001): Healthy"
    else
        log_error "❌ Grafana (3001): Unhealthy"
    fi
    
    # Redis
    if docker exec veloflux-redis-master redis-cli -a "${VF_REDIS_PASS:-}" ping 2>/dev/null | grep -q PONG; then
        log_success "✅ Redis: Healthy"
    else
        log_error "❌ Redis: Unhealthy"
    fi
    
    # PostgreSQL
    if docker exec veloflux-postgres pg_isready -U veloflux >/dev/null 2>&1; then
        log_success "✅ PostgreSQL: Healthy"
    else
        log_error "❌ PostgreSQL: Unhealthy"
    fi
}

# Check SSL certificates
check_ssl_certificates() {
    log_header "SSL CERTIFICATES"
    
    if [[ "${VF_SSL_ENABLED:-false}" == "true" ]]; then
        DOMAINS=(
            "${VF_MAIN_DOMAIN:-veloflux.io}"
            "${VF_ADMIN_DOMAIN:-admin.veloflux.io}"
            "${VF_API_DOMAIN:-api.veloflux.io}"
        )
        
        for domain in "${DOMAINS[@]}"; do
            CERT_FILE="/etc/letsencrypt/live/$domain/fullchain.pem"
            if [[ -f "$CERT_FILE" ]]; then
                EXPIRY_DATE=$(openssl x509 -enddate -noout -in "$CERT_FILE" | cut -d= -f2)
                EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
                CURRENT_TIMESTAMP=$(date +%s)
                DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))
                
                if [[ $DAYS_UNTIL_EXPIRY -lt 7 ]]; then
                    log_error "🔥 SSL cert for $domain expires in $DAYS_UNTIL_EXPIRY days"
                elif [[ $DAYS_UNTIL_EXPIRY -lt 30 ]]; then
                    log_warning "⚠️  SSL cert for $domain expires in $DAYS_UNTIL_EXPIRY days"
                else
                    log_success "✅ SSL cert for $domain: $DAYS_UNTIL_EXPIRY days remaining"
                fi
            else
                log_error "❌ SSL cert for $domain: Not found"
            fi
        done
    else
        log_info "ℹ️  SSL certificates check skipped (SSL not enabled)"
    fi
}

# Check log files for errors
check_logs() {
    log_header "LOG ANALYSIS"
    
    # Check VeloFlux logs for errors
    if [[ -f "$LOG_DIR/veloflux.log" ]]; then
        ERROR_COUNT=$(tail -n 1000 "$LOG_DIR/veloflux.log" | grep -i "error\|fatal\|panic" | wc -l)
        if [[ $ERROR_COUNT -gt 10 ]]; then
            log_warning "⚠️  VeloFlux logs: $ERROR_COUNT errors in last 1000 lines"
        else
            log_success "✅ VeloFlux logs: $ERROR_COUNT errors in last 1000 lines"
        fi
    fi
    
    # Check Nginx error logs
    if [[ -f "/var/log/nginx/error.log" ]]; then
        NGINX_ERRORS=$(tail -n 100 /var/log/nginx/error.log | grep "$(date +%Y/%m/%d)" | wc -l)
        if [[ $NGINX_ERRORS -gt 20 ]]; then
            log_warning "⚠️  Nginx errors today: $NGINX_ERRORS"
        else
            log_success "✅ Nginx errors today: $NGINX_ERRORS"
        fi
    fi
    
    # Check system logs for critical errors
    CRITICAL_ERRORS=$(journalctl --since "1 hour ago" --priority=crit | wc -l)
    if [[ $CRITICAL_ERRORS -gt 0 ]]; then
        log_error "🔥 Critical system errors in last hour: $CRITICAL_ERRORS"
    else
        log_success "✅ No critical system errors in last hour"
    fi
}

# Check network connectivity
check_network() {
    log_header "NETWORK CONNECTIVITY"
    
    # Check DNS resolution
    if nslookup google.com >/dev/null 2>&1; then
        log_success "✅ DNS resolution: Working"
    else
        log_error "❌ DNS resolution: Failed"
    fi
    
    # Check internet connectivity
    if curl -sf --max-time 10 http://google.com >/dev/null; then
        log_success "✅ Internet connectivity: Working"
    else
        log_error "❌ Internet connectivity: Failed"
    fi
    
    # Check port availability
    PORTS=(80 443 22 9090 3001)
    for port in "${PORTS[@]}"; do
        if netstat -tuln | grep -q ":$port "; then
            log_success "✅ Port $port: Open"
        else
            log_warning "⚠️  Port $port: Not listening"
        fi
    done
}

# Performance metrics
check_performance() {
    log_header "PERFORMANCE METRICS"
    
    # Response time check
    RESPONSE_TIME=$(curl -o /dev/null -s -w '%{time_total}' --max-time 10 http://localhost:8080/health 2>/dev/null || echo "timeout")
    if [[ "$RESPONSE_TIME" != "timeout" ]]; then
        if (( $(echo "$RESPONSE_TIME > 2.0" | bc -l) )); then
            log_warning "⚠️  VeloFlux response time: ${RESPONSE_TIME}s"
        else
            log_success "✅ VeloFlux response time: ${RESPONSE_TIME}s"
        fi
    else
        log_error "❌ VeloFlux response time: Timeout"
    fi
    
    # Database connection count
    if docker exec veloflux-postgres psql -U veloflux -d veloflux -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | grep -q "count"; then
        DB_CONNECTIONS=$(docker exec veloflux-postgres psql -U veloflux -d veloflux -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null | tr -d ' ')
        if [[ $DB_CONNECTIONS -gt 150 ]]; then
            log_warning "⚠️  PostgreSQL connections: $DB_CONNECTIONS"
        else
            log_success "✅ PostgreSQL connections: $DB_CONNECTIONS"
        fi
    fi
    
    # Redis memory usage
    if docker exec veloflux-redis-master redis-cli -a "${VF_REDIS_PASS:-}" info memory 2>/dev/null | grep -q "used_memory_human"; then
        REDIS_MEMORY=$(docker exec veloflux-redis-master redis-cli -a "${VF_REDIS_PASS:-}" info memory 2>/dev/null | grep "used_memory_human" | cut -d: -f2 | tr -d '\r')
        log_success "✅ Redis memory usage: $REDIS_MEMORY"
    fi
}

# Generate monitoring report
generate_report() {
    local status="$1"
    local timestamp=$(date)
    
    cat > "$LOG_DIR/monitor-report.json" << EOF
{
    "timestamp": "$timestamp",
    "status": "$status",
    "server": "$(hostname)",
    "uptime": "$(uptime | awk -F'up ' '{print $2}' | awk -F',' '{print $1}')",
    "load_average": "$(uptime | awk -F'load average:' '{print $2}')",
    "cpu_usage": "$CPU_USAGE%",
    "memory_usage": "$MEMORY_USAGE%",
    "disk_usage": "$DISK_USAGE%",
    "services": {
        "veloflux_lb": "$(docker inspect --format='{{.State.Status}}' veloflux-lb-1 2>/dev/null || echo 'unknown')",
        "redis": "$(docker inspect --format='{{.State.Status}}' veloflux-redis-master 2>/dev/null || echo 'unknown')",
        "postgres": "$(docker inspect --format='{{.State.Status}}' veloflux-postgres 2>/dev/null || echo 'unknown')",
        "prometheus": "$(docker inspect --format='{{.State.Status}}' veloflux-prometheus 2>/dev/null || echo 'unknown')",
        "grafana": "$(docker inspect --format='{{.State.Status}}' veloflux-grafana 2>/dev/null || echo 'unknown')"
    }
}
EOF
}

# Send alerts
send_alert() {
    local message="$1"
    
    # Email alert
    if command -v mail >/dev/null 2>&1 && [[ -n "${ALERT_EMAIL:-}" ]]; then
        echo "$message" | mail -s "VeloFlux Alert: $(hostname)" "$ALERT_EMAIL"
    fi
    
    # Slack alert
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 VeloFlux Alert\\n$message\"}" \
            "$SLACK_WEBHOOK_URL" >/dev/null 2>&1 || true
    fi
}

# Main monitoring function
main() {
    local mode="${1:-full}"
    
    log_info "Starting VeloFlux monitoring ($mode)..."
    
    case "$mode" in
        "full")
            check_system_resources
            check_docker_containers
            check_service_endpoints
            check_ssl_certificates
            check_logs
            check_network
            check_performance
            ;;
        "quick")
            check_system_resources
            check_service_endpoints
            ;;
        "health")
            check_service_endpoints
            ;;
        "performance")
            check_performance
            ;;
        "security")
            check_ssl_certificates
            check_logs
            ;;
        *)
            echo "Usage: $0 {full|quick|health|performance|security}"
            echo ""
            echo "Monitoring modes:"
            echo "  full        - Complete system monitoring (default)"
            echo "  quick       - Essential checks only"
            echo "  health      - Service health checks"
            echo "  performance - Performance metrics"
            echo "  security    - Security-related checks"
            exit 1
            ;;
    esac
    
    # Determine overall status
    if grep -q "ERROR" "$MONITOR_LOG"; then
        OVERALL_STATUS="CRITICAL"
        send_alert "VeloFlux monitoring detected critical issues. Check $MONITOR_LOG for details."
    elif grep -q "WARNING" "$MONITOR_LOG"; then
        OVERALL_STATUS="WARNING"
    else
        OVERALL_STATUS="OK"
    fi
    
    generate_report "$OVERALL_STATUS"
    log_success "Monitoring completed with status: $OVERALL_STATUS"
}

# Ensure log directory exists
mkdir -p "$LOG_DIR"

# Run monitoring
main "$@"
