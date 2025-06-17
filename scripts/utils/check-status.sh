#!/bin/bash

# VeloFlux Status Check - Nova Estrutura Organizada
# Verifica todos os componentes da nova arquitetura

clear
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                 🚀 VELOFLUX - STATUS DA NOVA ESTRUTURA               ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Função para status
check_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ OK${NC}"
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

# Função para testar URL
test_url() {
    local url=$1
    local expected_status=$2
    local timeout=5
    
    if command -v curl >/dev/null; then
        status=$(curl -s -o /dev/null -w "%{http_code}" --max-time $timeout "$url" 2>/dev/null)
        if [[ "$status" == "$expected_status" ]]; then
            echo -e "${GREEN}✅ $status${NC}"
            return 0
        else
            echo -e "${RED}❌ $status${NC}"
            return 1
        fi
    else
        echo -e "${YELLOW}⚠️ SKIP${NC}"
        return 1
    fi
}

echo "📁 ESTRUTURA DO PROJETO:"
echo "─────────────────────────"
echo -n "• Frontend directory: "
if [ -d "frontend/" ]; then echo -e "${GREEN}✅ Exists${NC}"; else echo -e "${RED}❌ Missing${NC}"; fi

echo -n "• Backend directory: "
if [ -d "backend/" ]; then echo -e "${GREEN}✅ Exists${NC}"; else echo -e "${RED}❌ Missing${NC}"; fi

echo -n "• Infra directory: "
if [ -d "infra/" ]; then echo -e "${GREEN}✅ Exists${NC}"; else echo -e "${RED}❌ Missing${NC}"; fi

echo -n "• Frontend build exists: "
if [ -d "frontend/dist/" ]; then echo -e "${GREEN}✅ Built${NC}"; else echo -e "${YELLOW}⚠️ Not built${NC}"; fi

echo ""
echo "🐳 DOCKER CONTAINERS:"
echo "────────────────────"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Docker compose não está rodando"

echo ""
echo "🌐 SERVIÇOS WEB:"
echo "───────────────"
echo -n "• Load Balancer (:80): "
test_url "http://localhost" "200"

echo -n "• Frontend (:3000): "
test_url "http://localhost:3000" "200"

echo -n "• Backend API (:9090): "
test_url "http://localhost:9090/health" "200"

echo -n "• Backend Metrics (:8080): "
test_url "http://localhost:8080/metrics" "200"

echo -n "• Grafana (:3001): "
test_url "http://localhost:3001" "200"

echo -n "• Prometheus (:9091): "
test_url "http://localhost:9091" "200"

echo ""
echo "🔧 HEALTH CHECKS:"
echo "────────────────"

# Check container health
if command -v docker >/dev/null; then
    echo "• Container Health Status:"
    for container in $(docker-compose ps -q 2>/dev/null); do
        if [ ! -z "$container" ]; then
            name=$(docker inspect --format='{{.Name}}' $container | sed 's|/||')
            health=$(docker inspect --format='{{.State.Health.Status}}' $container 2>/dev/null || echo "no-healthcheck")
            if [ "$health" = "healthy" ]; then
                echo -e "  - $name: ${GREEN}✅ Healthy${NC}"
            elif [ "$health" = "unhealthy" ]; then
                echo -e "  - $name: ${RED}❌ Unhealthy${NC}"
            elif [ "$health" = "starting" ]; then
                echo -e "  - $name: ${YELLOW}⚠️ Starting${NC}"
            else
                echo -e "  - $name: ${BLUE}ℹ️ No health check${NC}"
            fi
        fi
    done
else
    echo -e "${YELLOW}⚠️ Docker not available${NC}"
fi

echo ""
echo "📊 RECURSOS UTILIZADOS:"
echo "─────────────────────"
if command -v docker >/dev/null; then
    echo "• Docker Stats:"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null | head -10
fi

echo ""
echo "🔍 LOGS RECENTES:"
echo "────────────────"
echo "• Últimas mensagens dos containers:"
for service in backend frontend loadbalancer; do
    if docker-compose ps $service >/dev/null 2>&1; then
        echo "  [$service]:"
        docker-compose logs --tail=2 $service 2>/dev/null | grep -v "^$" | head -2 | sed 's/^/    /'
    fi
done

echo ""
echo "💡 RESUMO:"
echo "─────────"

# Count running services
running_containers=$(docker-compose ps -q 2>/dev/null | wc -l)
total_expected=6  # backend, frontend, loadbalancer, redis, prometheus, grafana

if [ $running_containers -eq $total_expected ]; then
    echo -e "${GREEN}🎉 Todos os serviços estão rodando! ($running_containers/$total_expected)${NC}"
elif [ $running_containers -gt 0 ]; then
    echo -e "${YELLOW}⚠️ Alguns serviços rodando ($running_containers/$total_expected)${NC}"
else
    echo -e "${RED}❌ Nenhum serviço rodando${NC}"
fi

# URLs de acesso
echo ""
echo "🌐 ACESSO AOS SERVIÇOS:"
echo "─────────────────────"
echo -e "${CYAN}• Principal:${NC}      http://localhost"
echo -e "${CYAN}• Frontend:${NC}       http://localhost:3000"
echo -e "${CYAN}• API Backend:${NC}    http://localhost:9090"
echo -e "${CYAN}• Métricas:${NC}       http://localhost:8080/metrics"
echo -e "${CYAN}• Grafana:${NC}        http://localhost:3001 (admin/veloflux123)"
echo -e "${CYAN}• Prometheus:${NC}     http://localhost:9091"

echo ""
echo "╔═══════════════════════════════════════════════════════════════════════╗"
echo "║                         ✨ STATUS COMPLETO ✨                        ║"
echo "╚═══════════════════════════════════════════════════════════════════════╝"
