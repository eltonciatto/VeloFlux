#!/bin/bash

# 🚀 VeloFlux SaaS - One-Line Production Install
# curl -fsSL https://raw.githubusercontent.com/eciatto/VeloFlux/main/scripts/one-line-install.sh | bash

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 VeloFlux SaaS - One-Line Production Install${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if git is available
if ! command -v git >/dev/null 2>&1; then
    echo -e "${BLUE}Installing git...${NC}"
    if command -v apt-get >/dev/null 2>&1; then
        sudo apt-get update && sudo apt-get install -y git
    elif command -v yum >/dev/null 2>&1; then
        sudo yum install -y git
    elif command -v dnf >/dev/null 2>&1; then
        sudo dnf install -y git
    else
        echo "Please install git manually and run this script again"
        exit 1
    fi
fi

# Clone repository if not present
if [ ! -d "VeloFlux" ]; then
    echo -e "${BLUE}Cloning VeloFlux repository...${NC}"
    git clone https://github.com/eciatto/VeloFlux.git
    cd VeloFlux
else
    echo -e "${BLUE}Using existing VeloFlux directory...${NC}"
    cd VeloFlux
    git pull origin main
fi

# Make script executable
chmod +x scripts/super-quick-install.sh

# Run auto-production install
echo -e "${GREEN}Starting automatic production installation...${NC}"
./scripts/super-quick-install.sh --auto-production

echo -e "${GREEN}🎉 One-line installation complete!${NC}"
echo -e "${CYAN}Your VeloFlux SaaS is now running at: http://localhost${NC}"
