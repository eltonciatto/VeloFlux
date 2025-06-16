#!/bin/bash

# VeloFlux Health Endpoints Checker
# This script checks the health endpoints of the VeloFlux services

set -e

# Configuration
BACKEND1_PORT=8001
BACKEND2_PORT=8002
VELOFLUX_PORT=8080
ADMIN_PORT=9000
METRICS_PORT=8080
REDIS_PORT=6379

# Helper function for logs
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Wait for services to be ready
log "Waiting for services to initialize (5s)..."
sleep 5

# Check backend-1 health endpoint
log "Checking backend-1 health endpoint..."
if curl -s http://localhost:$BACKEND1_PORT/health | grep -q "OK"; then
    log "✓ backend-1 health check: OK"
else
    log "✗ backend-1 health check: FAILED"
    curl -v http://localhost:$BACKEND1_PORT/health
fi

# Check backend-2 health endpoint
log "Checking backend-2 health endpoint..."
if curl -s http://localhost:$BACKEND2_PORT/health | grep -q "OK"; then
    log "✓ backend-2 health check: OK"
else
    log "✗ backend-2 health check: FAILED"
    curl -v http://localhost:$BACKEND2_PORT/health
fi

# Check Redis connectivity
log "Checking Redis connectivity..."
if nc -z localhost $REDIS_PORT; then
    log "✓ Redis is reachable on port $REDIS_PORT"
else
    log "✗ Redis is not reachable on port $REDIS_PORT"
fi

# Check VeloFlux metrics endpoint
log "Checking VeloFlux metrics endpoint..."
if curl -s http://localhost:$METRICS_PORT/metrics >/dev/null; then
    log "✓ VeloFlux metrics endpoint is accessible"
    # Check for health metrics
    if curl -s http://localhost:$METRICS_PORT/metrics | grep -q "veloflux_backend_health"; then
        log "✓ Backend health metrics are available"
    else
        log "! Backend health metrics not found, but endpoint is accessible"
    fi
else
    log "✗ VeloFlux metrics endpoint is not accessible"
    curl -v http://localhost:$METRICS_PORT/metrics
fi

# Check VeloFlux admin API endpoint
log "Checking VeloFlux admin API..."
if curl -s http://localhost:$ADMIN_PORT/health >/dev/null; then
    log "✓ VeloFlux admin API health endpoint is accessible"
else
    log "! VeloFlux admin API health endpoint is not accessible (this might be normal if not configured)"
fi

# Check if VeloFlux is routing requests
log "Checking if VeloFlux is routing requests..."
if curl -s -I http://localhost:80 | grep -q "HTTP"; then
    log "✓ VeloFlux is responding on port 80"
else
    log "! VeloFlux is not responding on port 80 (checking if running on another port...)"
    
    # Try alternative ports
    for port in 8080 8082 9090; do
        if curl -s -I http://localhost:$port | grep -q "HTTP"; then
            log "✓ Found VeloFlux responding on port $port instead"
            break
        fi
    done
fi

log "Health check completed. If all services are up, the VeloFlux load balancer should be working properly."
