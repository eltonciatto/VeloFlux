#!/bin/bash

echo "🔌 VALIDAÇÃO COMPLETA DE WEBSOCKETS E APIS - VELOFLUX"
echo "=================================================="
echo

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para teste de HTTP
test_http() {
    local url=$1
    local description=$2
    local status=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null)
    
    if [ "$status" == "200" ]; then
        echo -e "  ✅ ${GREEN}$description${NC}: HTTP $status"
        return 0
    else
        echo -e "  ❌ ${RED}$description${NC}: HTTP $status"
        return 1
    fi
}

# Função para teste de WebSocket
test_websocket() {
    local url=$1
    local description=$2
    
    echo -n "  🔌 Testing $description..."
    
    result=$(python3 - << EOF 2>/dev/null
import asyncio
import websockets
import sys

async def test():
    try:
        async with websockets.connect('$url') as websocket:
            message = await asyncio.wait_for(websocket.recv(), timeout=3.0)
            print("SUCCESS")
            return True
    except Exception as e:
        print(f"ERROR: {str(e)[:50]}")
        return False

asyncio.run(test())
EOF
)
    
    if [[ $result == *"SUCCESS"* ]]; then
        echo -e " ${GREEN}✅ CONECTADO${NC}"
        return 0
    else
        echo -e " ${RED}❌ FALHOU${NC} ($result)"
        return 1
    fi
}

# Contador de sucessos
http_success=0
ws_success=0
total_http=0
total_ws=0

echo -e "${BLUE}📊 1. VERIFICANDO STATUS DOS CONTAINERS${NC}"
echo "============================================"
docker-compose ps
echo

echo -e "${BLUE}🌐 2. TESTANDO APIs REST${NC}"
echo "========================"

# APIs REST
declare -a http_tests=(
    "http://localhost:9090/health|Backend Health API"
    "http://localhost:8080/metrics|Prometheus Metrics"
    "http://localhost:9000/admin/health|Admin API Health"
    "http://localhost/|Landing Page"
    "http://localhost/dashboard|Dashboard"
    "http://localhost:9091/|Prometheus Interface"
    "http://localhost:9092/|AlertManager Interface"
)

for test in "${http_tests[@]}"; do
    IFS='|' read -r url description <<< "$test"
    test_http "$url" "$description"
    if [ $? -eq 0 ]; then
        ((http_success++))
    fi
    ((total_http++))
done

echo

echo -e "${BLUE}🔌 3. TESTANDO WEBSOCKETS (PORTA 9090)${NC}"
echo "========================================="

# WebSocket endpoints
declare -a ws_tests=(
    "ws://localhost:9090/api/ws/backends|Backend Status"
    "ws://localhost:9090/api/ws/metrics|Real-time Metrics" 
    "ws://localhost:9090/api/ws/status|System Status"
    "ws://localhost:9090/api/ws/ai|AI/ML Data"
    "ws://localhost:9090/api/ws/security|Security Events"
    "ws://localhost:9090/api/ws/billing|Billing Info"
    "ws://localhost:9090/api/ws/health|Health Monitoring"
)

for test in "${ws_tests[@]}"; do
    IFS='|' read -r url description <<< "$test"
    test_websocket "$url" "$description"
    if [ $? -eq 0 ]; then
        ((ws_success++))
    fi
    ((total_ws++))
done

echo

echo -e "${BLUE}🔍 4. DIAGNÓSTICO DETALHADO${NC}"
echo "=============================="

echo "📡 Portas em uso:"
netstat -tlnp 2>/dev/null | grep -E "(80|443|3000|8080|9000|9090|9091|9092|6379)" | while read line; do
    echo "  $line"
done

echo

echo "🐳 Status detalhado dos containers:"
docker-compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"

echo

echo -e "${BLUE}💾 5. SAMPLE DE DADOS WEBSOCKET${NC}"
echo "================================="

echo "📊 Testando dados reais do WebSocket metrics:"
python3 - << 'EOF'
import asyncio
import websockets
import json

async def sample_data():
    try:
        async with websockets.connect('ws://localhost:9090/api/ws/metrics') as websocket:
            print("🔗 Conectado ao WebSocket de métricas...")
            
            # Receber algumas mensagens
            for i in range(3):
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                data = json.loads(message)
                print(f"📨 Mensagem {i+1}:")
                print(f"   Tipo: {data.get('type', 'N/A')}")
                print(f"   Timestamp: {data.get('timestamp', 'N/A')}")
                if 'data' in data and isinstance(data['data'], dict):
                    print(f"   Dados: {list(data['data'].keys())}")
                print()
                
    except Exception as e:
        print(f"❌ Erro ao testar dados: {e}")

asyncio.run(sample_data())
EOF

echo

echo -e "${BLUE}📋 6. RESUMO FINAL${NC}"
echo "=================="

echo -e "🌐 APIs REST: ${GREEN}$http_success${NC}/$total_http funcionando"
echo -e "🔌 WebSockets: ${GREEN}$ws_success${NC}/$total_ws funcionando"

total_success=$((http_success + ws_success))
total_tests=$((total_http + total_ws))
percentage=$((total_success * 100 / total_tests))

echo
if [ $percentage -eq 100 ]; then
    echo -e "🎉 ${GREEN}SISTEMA 100% OPERACIONAL!${NC}"
    echo -e "   ✅ Todas as APIs funcionando"
    echo -e "   ✅ Todos os WebSockets conectando"
    echo -e "   ✅ VeloFlux pronto para produção!"
elif [ $percentage -ge 80 ]; then
    echo -e "⚠️  ${YELLOW}SISTEMA MAJORITARIAMENTE OPERACIONAL${NC} ($percentage%)"
    echo -e "   ✅ Maioria dos serviços funcionando"
    echo -e "   ⚠️  Alguns endpoints precisam de atenção"
else
    echo -e "🚨 ${RED}SISTEMA COM PROBLEMAS${NC} ($percentage%)"
    echo -e "   ❌ Múltiplos serviços falhando"
    echo -e "   🔧 Verificar logs e configuração"
fi

echo
echo -e "${BLUE}🔗 ENDPOINTS PRINCIPAIS:${NC}"
echo "========================="
echo "🏠 Landing Page:    http://localhost"
echo "📊 Dashboard:       http://localhost/dashboard"  
echo "🔌 Backend API:     http://localhost:9090"
echo "📈 Metrics:         http://localhost:8080/metrics"
echo "🧠 WebSocket Base:  ws://localhost:9090/api/ws/"
echo "👥 Admin Panel:     http://localhost:9000"
echo "📊 Prometheus:      http://localhost:9091"
echo "🚨 AlertManager:    http://localhost:9092"

echo
echo -e "${BLUE}📚 DOCUMENTAÇÃO:${NC}"
echo "================="
echo "📖 WebSocket API:   docs/WEBSOCKET_API_COMPLETE_DOCUMENTATION.md"
echo "🗺️  Mapa de APIs:   docs/API_PORTS_MAPPING_COMPLETE.md"
echo "🧪 Script de teste: test_websockets_validation.sh"

echo
echo "📅 $(date)"
echo "🏷️  VeloFlux v1.1.0"
echo
