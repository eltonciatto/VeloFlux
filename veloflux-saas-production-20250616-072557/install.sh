#!/bin/bash
# VeloFlux SaaS One-liner Installation

set -euo pipefail

echo "🚀 Starting VeloFlux SaaS Production Installation..."

# Set default configuration
export MAIN_DOMAIN="${MAIN_DOMAIN:-veloflux.io}"
export ADMIN_DOMAIN="${ADMIN_DOMAIN:-admin.veloflux.io}"
export API_DOMAIN="${API_DOMAIN:-api.veloflux.io}"
export EMAIL="${EMAIL:-admin@veloflux.io}"
export ENABLE_SSL="${ENABLE_SSL:-true}"
export ENABLE_MONITORING="${ENABLE_MONITORING:-true}"
export ENABLE_BACKUP="${ENABLE_BACKUP:-true}"

# Run the main installation
./scripts/install-veloflux-saas-production.sh 2>&1 | tee /tmp/veloflux-install.log

echo "✅ Installation completed!"
echo "📊 Access Grafana at: http://$(curl -s ifconfig.me):3000"
echo "🌐 Access application at: http://$(curl -s ifconfig.me)/"
echo "📋 Check logs at: /tmp/veloflux-install.log"
