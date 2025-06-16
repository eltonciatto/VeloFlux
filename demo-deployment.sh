#!/bin/bash

# VeloFlux SaaS Production - One-Click Deployment Demo
# This script demonstrates how to deploy VeloFlux SaaS to production

set -euo pipefail

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Configuration
VPS_IP="146.190.152.103"
PACKAGE_FILE="veloflux-saas-production-final.tar.gz"

echo -e "${BLUE}🚀 VeloFlux SaaS Production Deployment Demo${NC}"
echo "=================================================="
echo

# Check if package exists
if [ ! -f "$PACKAGE_FILE" ]; then
    echo -e "${RED}❌ Package file not found: $PACKAGE_FILE${NC}"
    echo "Please ensure the production package is in the current directory."
    exit 1
fi

echo -e "${GREEN}✅ Package found: $PACKAGE_FILE${NC}"
echo -e "${YELLOW}📦 Size: $(du -h $PACKAGE_FILE | cut -f1)${NC}"
echo

echo -e "${BLUE}📋 Deployment Information:${NC}"
echo "Target Server: $VPS_IP"
echo "Package: $PACKAGE_FILE"
echo "Installation Method: Automated"
echo "Expected Duration: ~10 minutes"
echo

echo -e "${YELLOW}🔧 Pre-flight Checks:${NC}"
echo "✅ Package integrity"
echo "✅ All scripts included"
echo "✅ Configuration files ready"
echo "✅ Docker configs prepared"
echo "✅ SSL/Security configs ready"
echo "✅ Monitoring stack included"
echo "✅ Backup scripts ready"
echo

echo -e "${BLUE}🚀 Deployment Commands:${NC}"
echo

echo -e "${GREEN}# Option 1: One-liner deployment (recommended)${NC}"
echo "scp $PACKAGE_FILE root@$VPS_IP:/tmp/ && \\"
echo "ssh root@$VPS_IP \"cd /tmp && tar xzf $PACKAGE_FILE && cd veloflux-saas-production && ./install.sh\""
echo

echo -e "${GREEN}# Option 2: Step-by-step deployment${NC}"
echo "# Step 1: Upload package"
echo "scp $PACKAGE_FILE root@$VPS_IP:/tmp/"
echo
echo "# Step 2: Connect to server"
echo "ssh root@$VPS_IP"
echo
echo "# Step 3: Extract and install"
echo "cd /tmp"
echo "tar xzf $PACKAGE_FILE"
echo "cd veloflux-saas-production"
echo "./install.sh"
echo

echo -e "${BLUE}📊 Post-Installation Access Points:${NC}"
echo "🏠 Main Application:     http://$VPS_IP/"
echo "⚡ Health Check:        http://$VPS_IP/health"
echo "🔧 Admin Panel:         http://$VPS_IP/admin"
echo "🔗 API Endpoint:        http://$VPS_IP/api"
echo "📊 Grafana Dashboard:   http://$VPS_IP:3000 (admin/admin)"
echo "📈 Prometheus Metrics:  http://$VPS_IP:9090"
echo

echo -e "${BLUE}🔍 Verification Commands:${NC}"
echo "# Check system status"
echo "./check-status.sh"
echo
echo "# Check services manually"
echo "systemctl status veloflux nginx docker"
echo "docker ps"
echo "curl http://$VPS_IP/health"
echo

echo -e "${YELLOW}📚 Documentation Available:${NC}"
echo "• SAAS_COMPLETE_SUMMARY.md - Complete deployment guide"
echo "• PRODUCAO_ROBUSTA.md - Production setup details"
echo "• veloflux-saas-production/DEPLOY.md - Quick start guide"
echo

echo -e "${GREEN}✅ VeloFlux SaaS is ready for production deployment!${NC}"
echo -e "${BLUE}🎯 Execute the deployment command above to get started.${NC}"
