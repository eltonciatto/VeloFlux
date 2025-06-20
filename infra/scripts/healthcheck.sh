#!/bin/bash

# VeloFlux Health Check Script
# Used by Docker and Kubernetes for health monitoring

set -e

# Configuration
HEALTH_ENDPOINT="http://localhost:8080/api/health"
ADMIN_ENDPOINT="http://localhost:9000/api/health"
METRICS_ENDPOINT="http://localhost:8090/metrics"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[HEALTH]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[HEALTH]${NC} $1"
}

log_error() {
    echo -e "${RED}[HEALTH]${NC} $1"
}

# Check main health endpoint
check_main_health() {
    if curl -sf "$HEALTH_ENDPOINT" > /dev/null 2>&1; then
        log_info "Main health endpoint: OK"
        return 0
    else
        log_error "Main health endpoint: FAILED"
        return 1
    fi
}

# Check admin endpoint
check_admin_health() {
    if curl -sf "$ADMIN_ENDPOINT" > /dev/null 2>&1; then
        log_info "Admin health endpoint: OK"
        return 0
    else
        log_warning "Admin health endpoint: FAILED"
        return 0  # Non-critical
    fi
}

# Check metrics endpoint
check_metrics_health() {
    if curl -sf "$METRICS_ENDPOINT" > /dev/null 2>&1; then
        log_info "Metrics endpoint: OK"
        return 0
    else
        log_warning "Metrics endpoint: FAILED"
        return 0  # Non-critical
    fi
}

# Check memory usage
check_memory_usage() {
    if command -v free >/dev/null 2>&1; then
        MEMORY_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$MEMORY_USAGE" -lt 90 ]; then
            log_info "Memory usage: ${MEMORY_USAGE}% OK"
            return 0
        else
            log_warning "Memory usage: ${MEMORY_USAGE}% HIGH"
            return 1
        fi
    fi
    return 0
}

# Check disk usage
check_disk_usage() {
    if command -v df >/dev/null 2>&1; then
        DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
        if [ "$DISK_USAGE" -lt 90 ]; then
            log_info "Disk usage: ${DISK_USAGE}% OK"
            return 0
        else
            log_warning "Disk usage: ${DISK_USAGE}% HIGH"
            return 1
        fi
    fi
    return 0
}

# Main health check
main() {
    log_info "Starting VeloFlux health check..."
    
    HEALTH_STATUS=0
    
    # Critical checks
    if ! check_main_health; then
        HEALTH_STATUS=1
    fi
    
    # Non-critical checks
    check_admin_health
    check_metrics_health
    check_memory_usage
    check_disk_usage
    
    if [ $HEALTH_STATUS -eq 0 ]; then
        log_info "Health check: PASSED"
        exit 0
    else
        log_error "Health check: FAILED"
        exit 1
    fi
}

main "$@"
