#!/bin/bash

# VeloFlux - Script de Validação Completa de Portas e Rotas
# Versão: 1.0 - Teste Definitivo

echo "🚀 VeloFlux - Validação Completa de Portas e Rotas"
echo "================================================="
echo ""

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para testar endpoint
test_endpoint() {
    local url=$1
    local expected_pattern=$2
    local description=$3
    
    echo -n "Testing $description: "
    
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" "$url" 2>/dev/null)
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    body=$(echo "$response" | sed 's/HTTPSTATUS:[0-9]*$//')
    
    if [[ "$http_code" -eq 200 ]]; then
        if [[ -n "$expected_pattern" ]] && echo "$body" | grep -q "$expected_pattern"; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        elif [[ -z "$expected_pattern" ]]; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${YELLOW}⚠️  Response OK but pattern not found${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ FAIL (HTTP $http_code)${NC}"
        return 1
    fi
}

# Função para testar containers
test_containers() {
    echo "🔍 Verificando status dos containers..."
    
    containers=("veloflux-backend" "veloflux-frontend" "veloflux-redis" "veloflux-lb" "veloflux-prometheus" "veloflux-grafana" "veloflux-alertmanager")
    
    for container in "${containers[@]}"; do
        status=$(docker inspect "$container" --format '{{.State.Status}}' 2>/dev/null)
        if [[ "$status" == "running" ]]; then
            echo -e "   $container: ${GREEN}✅ Running${NC}"
        else
            echo -e "   $container: ${RED}❌ $status${NC}"
        fi
    done
    echo ""
}

# Função para testar rotas principais
test_main_routes() {
    echo "🌐 Testando rotas principais (via nginx:80)..."
    
    # Aplicação principal
    test_endpoint "http://localhost/" "VeloFlux\|<!DOCTYPE html>" "Aplicação principal"
    
    # Interface admin
    test_endpoint "http://localhost/admin" "<!DOCTYPE html" "Interface admin"
    
    # API principal
    test_endpoint "http://localhost/api/health" "healthy\|status" "API principal"
    
    echo ""
}

# Função para testar rotas diretas (desenvolvimento)
test_direct_routes() {
    echo "🔧 Testando rotas diretas (desenvolvimento)..."
    
    # Frontend direto
    test_endpoint "http://localhost:3000/" "<!DOCTYPE html" "Frontend direto"
    
    # Backend health
    test_endpoint "http://localhost:8080/health" "" "Backend health"
    
    # Backend API direto
    test_endpoint "http://localhost:9090/health" "healthy\|status" "Backend API direto"
    
    # Grafana
    test_endpoint "http://localhost:3001/" "Grafana" "Grafana"
    
    # Prometheus
    test_endpoint "http://localhost:9091/-/healthy" "Prometheus" "Prometheus"
    
    echo ""
}

# Função para testar autenticação
test_authentication() {
    echo "🔐 Testando autenticação..."
    
    # Teste de login (deve falhar com credenciais inválidas)
    echo -n "Testing login endpoint: "
    response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X POST "http://localhost/api/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@test.com","password":"invalid"}' 2>/dev/null)
    
    http_code=$(echo "$response" | grep -o "HTTPSTATUS:[0-9]*" | cut -d: -f2)
    
    if [[ "$http_code" -eq 401 ]] || [[ "$http_code" -eq 400 ]]; then
        echo -e "${GREEN}✅ OK (rejeitou credenciais inválidas)${NC}"
    else
        echo -e "${YELLOW}⚠️  HTTP $http_code (esperado 401/400)${NC}"
    fi
    
    echo ""
}

# Função para testar comunicação interna
test_internal_communication() {
    echo "🔄 Testando comunicação interna..."
    
    # Redis deve estar acessível apenas internamente
    echo -n "Testing Redis (deve estar interno): "
    if timeout 2 bash -c '</dev/tcp/localhost/6379' 2>/dev/null; then
        echo -e "${RED}❌ ERRO: Redis exposto externamente!${NC}"
    else
        echo -e "${GREEN}✅ OK (Redis interno apenas)${NC}"
    fi
    
    echo ""
}

# Função para mostrar resumo
show_summary() {
    echo ""
    echo "📊 RESUMO DA VALIDAÇÃO"
    echo "====================="
    echo ""
    echo -e "${BLUE}Portas principais em uso:${NC}"
    echo "  - 80: nginx (entrada principal)"
    echo "  - 3000: frontend (dev)"
    echo "  - 3001: grafana"
    echo "  - 8080: backend health"
    echo "  - 9000: backend admin"
    echo "  - 9090: backend api"
    echo "  - 9091: prometheus"
    echo "  - 9092: alertmanager"
    echo ""
    echo -e "${BLUE}Rotas para usuários finais:${NC}"
    echo "  - http://localhost/          → Aplicação principal"
    echo "  - http://localhost/admin     → Interface admin"
    echo "  - http://localhost/api/      → API principal"
    echo ""
    echo -e "${BLUE}Rotas para desenvolvimento:${NC}"
    echo "  - http://localhost:3000/     → Frontend direto"
    echo "  - http://localhost:9090/     → Backend API direto"
    echo "  - http://localhost:3001/     → Grafana (admin/veloflux123)"
    echo ""
    echo -e "${YELLOW}📝 Documentação detalhada:${NC}"
    echo "  - PADRAO_PORTAS_DEFINITIVO.md"
    echo "  - PORTS.md"
    echo ""
}

# Executar todos os testes
main() {
    test_containers
    test_main_routes
    test_direct_routes
    test_authentication
    test_internal_communication
    show_summary
    
    echo -e "${GREEN}✅ Validação completa!${NC}"
    echo ""
    echo "🎯 Para novos desenvolvedores:"
    echo "   1. Sempre usar http://localhost/ como entrada principal"
    echo "   2. Portas diretas são apenas para debug"
    echo "   3. Nunca alterar mapeamento de portas sem documentar"
    echo ""
}

# Executar se chamado diretamente
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi
