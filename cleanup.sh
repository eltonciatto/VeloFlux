#!/bin/bash

# VeloFlux - Server Cleanup Script
# Removes all VeloFlux components cleanly

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

echo -e "${RED}🧹 VeloFlux Server Cleanup${NC}"
echo "=========================="

# Stop services
log "Stopping VeloFlux services..."
systemctl stop veloflux veloflux-demo nginx 2>/dev/null || true
systemctl disable veloflux veloflux-demo 2>/dev/null || true

# Remove Docker containers
log "Cleaning Docker containers..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker system prune -af 2>/dev/null || true

# Remove files
log "Removing VeloFlux files..."
rm -rf /opt/veloflux
rm -rf /etc/veloflux
rm -rf /var/log/veloflux
rm -rf /tmp/VeloFlux

# Remove systemd services
log "Removing systemd services..."
rm -f /etc/systemd/system/veloflux*.service
systemctl daemon-reload

# Remove nginx config
log "Cleaning nginx configuration..."
rm -f /etc/nginx/sites-available/veloflux
rm -f /etc/nginx/sites-enabled/veloflux

# Remove user
log "Removing system user..."
userdel -r veloflux 2>/dev/null || true

# Restart nginx with default config
log "Restoring nginx..."
systemctl restart nginx 2>/dev/null || true

log "✅ Cleanup completed successfully!"
echo
echo "Server is now clean and ready for fresh installation."
