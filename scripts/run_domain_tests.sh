#!/bin/bash

# VeloFlux Service Check and Test Runner
# This script checks if VeloFlux is running and launches appropriate domain tests

# Set default paths
LOG_FILE="/tmp/veloflux_test_runner_$(date +%Y%m%d_%H%M%S).log"
SCRIPTS_DIR="$(dirname "$0")"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No color

# Logging function
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}   " ;;
        "ERROR") prefix="${RED}[ERROR]${NC}  " ;;
        "WARN")  prefix="${YELLOW}[WARN]${NC}   " ;;
        "OK")    prefix="${GREEN}[OK]${NC}     " ;;
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

# Check if a port is open
check_port() {
    local host="$1"
    local port="$2"
    timeout 1 bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null
    return $?
}

# Check if Docker is running
check_docker() {
    if command -v docker &>/dev/null; then
        if docker info &>/dev/null; then
            return 0
        fi
    fi
    return 1
}

# Check VeloFlux service status
check_veloflux_status() {
    log "INFO" "Checking VeloFlux service status..."
    
    # Try common ports
    local http_ports=(8082 80 8080 8001 3000)
    local https_ports=(443 8443)
    local metrics_ports=(8080 9090)
    
    # Check HTTP ports
    for port in "${http_ports[@]}"; do
        if check_port "localhost" "$port"; then
            HTTP_PORT="$port"
            log "OK" "VeloFlux HTTP detected on port $port"
            break
        fi
    done
    
    # Check HTTPS ports
    for port in "${https_ports[@]}"; do
        if check_port "localhost" "$port"; then
            HTTPS_PORT="$port"
            log "OK" "VeloFlux HTTPS detected on port $port"
            break
        fi
    done
    
    # Check metrics ports
    for port in "${metrics_ports[@]}"; do
        if check_port "localhost" "$port"; then
            # Check if it's a Prometheus metrics endpoint
            if curl -s "http://localhost:$port/metrics" | grep -q "go_" 2>/dev/null; then
                METRICS_PORT="$port"
                log "OK" "Prometheus metrics detected on port $port"
                break
            fi
        fi
    done
}

# Check if VeloFlux is running in Docker
check_veloflux_docker() {
    log "INFO" "Checking for VeloFlux Docker containers..."
    
    if ! check_docker; then
        log "WARN" "Docker not available or not running"
        return 1
    fi
    
    # Check for VeloFlux containers
    local veloflux_containers=$(docker ps --filter "name=veloflux" --format "{{.Names}}" 2>/dev/null)
    if [ -n "$veloflux_containers" ]; then
        log "OK" "Found VeloFlux containers:"
        echo "$veloflux_containers" | while read -r container; do
            log "INFO" "  - $container"
        done
        
        # Get exposed ports
        local container_id=$(echo "$veloflux_containers" | head -n1)
        local ports=$(docker port "$container_id" 2>/dev/null || echo "No port mappings found")
        log "INFO" "Port mappings:"
        echo "$ports" | while read -r port_mapping; do
            log "INFO" "  - $port_mapping"
        done
        
        return 0
    else
        log "WARN" "No running VeloFlux containers found"
        return 1
    fi
}

# Try to start VeloFlux
start_veloflux() {
    log "INFO" "Attempting to start VeloFlux services..."
    
    if [ -f "docker-compose.yml" ]; then
        log "INFO" "Found docker-compose.yml, starting services..."
        docker-compose up -d
        sleep 5
        return $?
    elif [ -f "../docker-compose.yml" ]; then
        log "INFO" "Found docker-compose.yml in parent directory, starting services..."
        (cd .. && docker-compose up -d)
        sleep 5
        return $?
    else
        log "ERROR" "Could not find docker-compose.yml to start services"
        return 1
    fi
}

# Run the tests
run_tests() {
    log "INFO" "Running domain and port tests..."
    
    # Update environment variables for tests
    if [ -n "$HTTP_PORT" ]; then
        export VELOFLUX_HTTP_PORT="$HTTP_PORT"
    fi
    
    if [ -n "$HTTPS_PORT" ]; then
        export VELOFLUX_HTTPS_PORT="$HTTPS_PORT"
    fi
    
    if [ -n "$METRICS_PORT" ]; then
        export VELOFLUX_METRICS_PORT="$METRICS_PORT"
    fi
    
    # Run enhanced domain test first (most comprehensive)
    if [ -f "${SCRIPTS_DIR}/enhanced_domain_test.sh" ]; then
        log "INFO" "Running enhanced domain tests..."
        bash "${SCRIPTS_DIR}/enhanced_domain_test.sh"
        log "INFO" "Enhanced domain tests completed"
    else
        log "WARN" "Enhanced domain test script not found"
    fi
    
    # Ask user if they want to run more tests
    read -p "Do you want to run additional tests? (y/n): " -r
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        # Run comprehensive port test
        if [ -f "${SCRIPTS_DIR}/port_domain_test_comprehensive.sh" ]; then
            log "INFO" "Running comprehensive port tests..."
            bash "${SCRIPTS_DIR}/port_domain_test_comprehensive.sh"
            log "INFO" "Comprehensive port tests completed"
        fi
        
        # Run multidomain test
        if [ -f "${SCRIPTS_DIR}/test_multidomains.sh" ]; then
            log "INFO" "Running multi-domain tests..."
            bash "${SCRIPTS_DIR}/test_multidomains.sh"
            log "INFO" "Multi-domain tests completed"
        fi
        
        # Run multitenant test if available
        if [ -f "${SCRIPTS_DIR}/test_multitenant_domains.sh" ]; then
            log "INFO" "Running multi-tenant domain tests..."
            bash "${SCRIPTS_DIR}/test_multitenant_domains.sh"
            log "INFO" "Multi-tenant domain tests completed"
        fi
    fi
}

# Main function
main() {
    log "INFO" "VeloFlux Test Runner"
    log "INFO" "===================="
    log "INFO" "Starting service checks and tests"
    
    # Check service status
    check_veloflux_status
    
    # If no HTTP port found, check Docker
    if [ -z "$HTTP_PORT" ]; then
        check_veloflux_docker
        
        # If still no HTTP port, try to start services
        if [ -z "$HTTP_PORT" ]; then
            log "WARN" "VeloFlux service not detected on standard ports"
            read -p "Do you want to try starting VeloFlux services? (y/n): " -r
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                if start_veloflux; then
                    log "OK" "VeloFlux services started"
                    # Check status again
                    check_veloflux_status
                else
                    log "ERROR" "Failed to start VeloFlux services"
                fi
            fi
        fi
    fi
    
    # Determine if we can run tests
    if [ -n "$HTTP_PORT" ]; then
        log "OK" "VeloFlux is running and accessible for testing"
        run_tests
    else
        log "ERROR" "VeloFlux service not accessible. Cannot run tests."
        log "INFO" "Please make sure VeloFlux is running and try again."
        exit 1
    fi
}

# Run main function
main
