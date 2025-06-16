#!/bin/bash

# VeloFlux Health Endpoints Checker
# This script checks the health endpoints of the VeloFlux services (test environment)

# Helper function for logs
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Check which environment is running
log "Checking VeloFlux environments..."

# Check if test environment containers are running
if docker ps | grep -q "veloflux-test-backend-1"; then
    log "VeloFlux test environment detected, checking services..."
    
    # Define ports for the test environment
    API_PORT=8082
    ADMIN_PORT=9090
    METRICS_PORT=9080
    
    ENV_TYPE="test"
    
    # Get container IDs
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-test-veloflux-lb" | awk '{print $1}')
    BACKEND1_CONTAINER=$(docker ps | grep "veloflux-test-backend-1" | awk '{print $1}')
    BACKEND2_CONTAINER=$(docker ps | grep "veloflux-test-backend-2" | awk '{print $1}')
    REDIS_CONTAINER=$(docker ps | grep "veloflux-test-redis" | awk '{print $1}')
else
    # Regular environment
    log "Regular VeloFlux environment detected, checking services..."
    
    # Define ports for the regular environment
    API_PORT=80
    ADMIN_PORT=9000
    METRICS_PORT=8080
    
    ENV_TYPE="regular"
    
    # Get container IDs
    VELOFLUX_CONTAINER=$(docker ps | grep "veloflux-veloflux-lb-1" | awk '{print $1}')
    BACKEND1_CONTAINER=$(docker ps | grep "backend-1$" | awk '{print $1}')
    BACKEND2_CONTAINER=$(docker ps | grep "backend-2$" | awk '{print $1}')
    REDIS_CONTAINER=$(docker ps | grep "veloflux-redis-1$" | awk '{print $1}')
fi

log "Using ${ENV_TYPE} environment with VeloFlux on port ${API_PORT}"

# Wait for services to be ready
log "Waiting for services to initialize (5s)..."
sleep 5

# Check internal connectivity to backend-1
log "Checking internal connectivity to backend-1..."
if [ -n "$VELOFLUX_CONTAINER" ] && [ -n "$BACKEND1_CONTAINER" ]; then
    if docker exec $VELOFLUX_CONTAINER curl -s http://backend-1 >/dev/null; then
        log "✓ Internal connectivity to backend-1: OK"
    else
        log "✗ Internal connectivity to backend-1: FAILED"
    fi
else
    log "! Cannot check connectivity to backend-1: Missing container"
fi

# Check internal connectivity to backend-2
log "Checking internal connectivity to backend-2..."
if [ -n "$VELOFLUX_CONTAINER" ] && [ -n "$BACKEND2_CONTAINER" ]; then
    if docker exec $VELOFLUX_CONTAINER curl -s http://backend-2 >/dev/null; then
        log "✓ Internal connectivity to backend-2: OK"
    else
        log "✗ Internal connectivity to backend-2: FAILED"
    fi
else
    log "! Cannot check connectivity to backend-2: Missing container"
fi

# Check internal connectivity to Redis
log "Checking internal connectivity to Redis..."
if [ -n "$VELOFLUX_CONTAINER" ] && [ -n "$REDIS_CONTAINER" ]; then
    if docker exec $VELOFLUX_CONTAINER nc -z redis 6379; then
        log "✓ Internal connectivity to Redis: OK"
    else
        log "✗ Internal connectivity to Redis: FAILED"
    fi
else
    log "! Cannot check connectivity to Redis: Missing container"
fi

# Check backend health endpoints
log "Checking backend-1 health endpoint..."
if [ -n "$VELOFLUX_CONTAINER" ]; then
    if docker exec $VELOFLUX_CONTAINER curl -s http://backend-1/health | grep -q "OK"; then
        log "✓ backend-1 health check: OK"
    else
        log "✗ backend-1 health check: FAILED"
        docker exec $VELOFLUX_CONTAINER curl -v http://backend-1/health
    fi
else
    log "! Cannot check backend-1 health: Missing VeloFlux container"
fi

log "Checking backend-2 health endpoint..."
if [ -n "$VELOFLUX_CONTAINER" ]; then
    if docker exec $VELOFLUX_CONTAINER curl -s http://backend-2/health | grep -q "OK"; then
        log "✓ backend-2 health check: OK"
    else
        log "✗ backend-2 health check: FAILED"
        docker exec $VELOFLUX_CONTAINER curl -v http://backend-2/health
    fi
else
    log "! Cannot check backend-2 health: Missing VeloFlux container"
fi

# Check VeloFlux external port
log "Checking VeloFlux on port ${API_PORT}..."
if curl -s -I http://localhost:${API_PORT} >/dev/null; then
    log "✓ VeloFlux is responding on port ${API_PORT}"
    
    # Show response code
    RESPONSE_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${API_PORT})
    log "  Response code: ${RESPONSE_CODE}"
    
    if [ "$RESPONSE_CODE" -eq "200" ]; then
        log "  VeloFlux is returning a 200 OK response"
    elif [ "$RESPONSE_CODE" -eq "404" ]; then
        log "  VeloFlux is returning a 404 Not Found (this is normal for the root path)"
    else
        log "  VeloFlux is returning status code ${RESPONSE_CODE}"
    fi
else
    log "✗ VeloFlux is not responding on port ${API_PORT}"
fi

log "Health check completed. VeloFlux can be accessed at: http://localhost:${API_PORT}"
