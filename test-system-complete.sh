#!/bin/bash

echo "🔥 TESTE COMPLETO DO SISTEMA VELOFLUX 🔥"
echo "========================================="

# Cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local method=${2:-GET}
    local description=$3
    local auth_header=$4
    
    echo -e "${BLUE}🧪 Testando: $description${NC}"
    
    if [ -n "$auth_header" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url" -H "$auth_header")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$url")
    fi
    
    if [ $response -eq 200 ] || [ $response -eq 401 ]; then
        echo -e "${GREEN}✅ $description: HTTP $response${NC}"
    else
        echo -e "${RED}❌ $description: HTTP $response${NC}"
    fi
    echo ""
}

# 1. Teste dos containers
echo -e "${YELLOW}📦 1. VERIFICANDO CONTAINERS${NC}"
echo "================================"
docker-compose ps | grep -E "(frontend|backend|loadbalancer)" | while read line; do
    if echo "$line" | grep -q "Up"; then
        echo -e "${GREEN}✅ $(echo $line | awk '{print $1}')${NC}"
    else
        echo -e "${RED}❌ $(echo $line | awk '{print $1}')${NC}"
    fi
done
echo ""

# 2. Teste de conectividade básica
echo -e "${YELLOW}🌐 2. TESTE DE CONECTIVIDADE${NC}"
echo "=============================="
test_endpoint "http://localhost" "GET" "Load Balancer Principal"
test_endpoint "http://localhost:3000" "GET" "Frontend Direto"
test_endpoint "http://localhost:9090/health" "GET" "Backend Health Direto"
test_endpoint "http://localhost/health" "GET" "Backend via Load Balancer"

# 3. Teste das APIs principais
echo -e "${YELLOW}🚀 3. TESTE DAS APIS PRINCIPAIS${NC}"
echo "==============================="
test_endpoint "http://localhost/api/health" "GET" "API Health via Load Balancer"
test_endpoint "http://localhost/api/auth/register" "POST" "API Auth Register (sem autenticação)"
test_endpoint "http://localhost/api/billing/subscriptions" "GET" "API Billing (requer auth)" "Authorization: Bearer test-token"

# 4. Teste do roteamento nginx
echo -e "${YELLOW}⚙️ 4. TESTE DO ROTEAMENTO NGINX${NC}"
echo "==============================="
test_endpoint "http://localhost/api/auth/health" "GET" "Roteamento /api/auth/"
test_endpoint "http://localhost/api/billing/plans" "GET" "Roteamento /api/billing/" "Authorization: Bearer test-token"
test_endpoint "http://localhost/metrics" "GET" "Roteamento /metrics"

# 5. Verificação dos logs
echo -e "${YELLOW}📊 5. VERIFICAÇÃO DOS LOGS${NC}"
echo "=========================="
echo -e "${BLUE}Backend logs (últimas 5 linhas):${NC}"
docker-compose logs backend --tail=5 | grep -E "(ERROR|WARN|INFO)" | tail -3

echo -e "${BLUE}Nginx logs (últimas 3 linhas):${NC}"
docker-compose logs loadbalancer --tail=3 | tail -3

echo ""
echo -e "${GREEN}🎉 TESTE COMPLETADO!${NC}"
echo "===================="
echo -e "${YELLOW}🔍 Para acessar:${NC}"
echo "• Frontend: http://localhost:3000"
echo "• Load Balancer: http://localhost"
echo "• Backend API: http://localhost:9090"
echo "• Grafana: http://localhost:3001"
echo ""
echo -e "${BLUE}💡 Para testar billing completo, execute:${NC}"
echo "python3 test_billing_complete.py"
