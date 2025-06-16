#!/bin/bash

# VeloFlux SaaS Status Checker for Production Package

set -euo pipefail

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

check_service() {
    local service="$1"
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        echo -e "${GREEN}✅ $service is running${NC}"
    else
        echo -e "${RED}❌ $service is not running${NC}"
    fi
}

check_port() {
    local port="$1"
    local service="$2"
    if ss -tlnp | grep -q ":$port " 2>/dev/null; then
        echo -e "${GREEN}✅ Port $port ($service) is listening${NC}"
    else
        echo -e "${RED}❌ Port $port ($service) is not listening${NC}"
    fi
}

check_endpoint() {
    local url="$1"
    local name="$2"
    if curl -f -s "$url" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $name endpoint is responding${NC}"
    else
        echo -e "${RED}❌ $name endpoint is not responding${NC}"
    fi
}

echo "=== VeloFlux SaaS Production Status Report ==="
echo "Generated at: $(date)"
echo

echo "=== System Services ==="
check_service "veloflux"
check_service "veloflux-lb"
check_service "nginx"
check_service "docker"
echo

echo "=== Network Ports ==="
check_port "80" "HTTP"
check_port "443" "HTTPS"
check_port "3000" "Grafana"
check_port "9090" "Prometheus"
check_port "6379" "Redis"
check_port "5432" "PostgreSQL"
echo

echo "=== Docker Containers ==="
if command -v docker >/dev/null 2>&1; then
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker not available"
else
    echo "Docker not installed"
fi
echo

echo "=== HTTP Endpoints ==="
SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || echo "localhost")
check_endpoint "http://$SERVER_IP/" "Main Application"
check_endpoint "http://$SERVER_IP/health" "Health Check"
check_endpoint "http://$SERVER_IP:3000/" "Grafana"
check_endpoint "http://$SERVER_IP:9090/" "Prometheus"
echo

echo "=== System Resources ==="
echo "Memory Usage:"
free -h 2>/dev/null || echo "Memory info not available"
echo
echo "Disk Usage:"
df -h / 2>/dev/null || echo "Disk info not available"
echo
echo "Load Average:"
uptime 2>/dev/null || echo "Load info not available"
echo

echo "=== Recent Logs ==="
echo "VeloFlux Logs (last 10 lines):"
tail -10 /var/log/veloflux/veloflux.log 2>/dev/null || echo "No VeloFlux logs found"
echo

echo "Installation Logs (last 10 lines):"
tail -10 /tmp/veloflux-install.log 2>/dev/null || echo "No installation logs found"
echo

echo "=== Access Information ==="
echo "Main Application: http://$SERVER_IP/"
echo "Grafana Dashboard: http://$SERVER_IP:3000 (admin/admin)"
echo "Prometheus Metrics: http://$SERVER_IP:9090"
echo "Health Check: http://$SERVER_IP/health"
echo

echo "=== Next Steps ==="
echo "1. Configure DNS to point your domains to: $SERVER_IP"
echo "2. SSL certificates will be auto-generated once DNS is ready"
echo "3. Customize Grafana dashboards and alerts"
echo "4. Review backup and monitoring configurations"
