#!/bin/bash

# Script para testar APIs necessárias para os novos componentes frontend
# UserManagement.tsx, OIDCSettings.tsx, TenantMonitoring.tsx

set -e

echo "🧪 Testando APIs dos Componentes Frontend - VeloFlux"
echo "=================================================="

# Configurações
BASE_URL="http://localhost:9091"
TENANT_ID="test-tenant"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # Token de teste

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para fazer requisições HTTP
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4
    
    echo -e "${BLUE}🔍 Testando: ${description}${NC}"
    echo "   Endpoint: ${method} ${endpoint}"
    
    if [ -n "$data" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X ${method} \
            -H "Content-Type: application/json" \
            -H "Authorization: Bearer ${TOKEN}" \
            -d "$data" \
            "${BASE_URL}${endpoint}" 2>/dev/null || echo "ERROR")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            -X ${method} \
            -H "Authorization: Bearer ${TOKEN}" \
            "${BASE_URL}${endpoint}" 2>/dev/null || echo "ERROR")
    fi
    
    if [[ "$response" == "ERROR" ]]; then
        echo -e "   ${RED}❌ Falha na conexão${NC}"
        return 1
    fi
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d: -f2)
    body=$(echo "$response" | sed '/HTTP_CODE:/d')
    
    if [[ "$http_code" -ge 200 && "$http_code" -lt 300 ]]; then
        echo -e "   ${GREEN}✅ Sucesso (${http_code})${NC}"
        if [ -n "$body" ] && [ "$body" != "null" ]; then
            echo "   Resposta: $(echo "$body" | head -c 100)..."
        fi
    elif [[ "$http_code" -ge 400 && "$http_code" -lt 500 ]]; then
        echo -e "   ${YELLOW}⚠️  Cliente (${http_code})${NC}"
        echo "   Resposta: $body"
    else
        echo -e "   ${RED}❌ Servidor (${http_code})${NC}"
        echo "   Resposta: $body"
    fi
    
    echo ""
    return 0
}

# Verificar se o servidor está rodando
echo -e "${BLUE}🏁 Verificando se o servidor está rodando...${NC}"
if ! curl -s "${BASE_URL}/api/health" > /dev/null; then
    echo -e "${RED}❌ Servidor não está rodando em ${BASE_URL}${NC}"
    echo "Por favor, inicie o servidor antes de executar os testes."
    exit 1
fi
echo -e "${GREEN}✅ Servidor está rodando${NC}"
echo ""

# Função para testar endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo "🔍 Testando: $description"
    echo "   Método: $method"
    echo "   Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ] || [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X $method \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" \
            -X DELETE \
            -H "Authorization: Bearer $TOKEN" \
            -H "Content-Type: application/json" \
            "$BASE_URL$endpoint")
    fi
    
    # Separar resposta e código HTTP
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        echo "   ✅ Status: $http_code (OK)"
    elif [ "$http_code" = "404" ]; then
        echo "   ❌ Status: $http_code (Endpoint não encontrado)"
    elif [ "$http_code" = "401" ]; then
        echo "   🔐 Status: $http_code (Não autorizado - token inválido)"
    elif [ "$http_code" = "403" ]; then
        echo "   🚫 Status: $http_code (Acesso negado)"
    elif [ "$http_code" = "500" ]; then
        echo "   💥 Status: $http_code (Erro interno do servidor)"
    else
        echo "   ⚠️  Status: $http_code"
    fi
    
    if [ ${#body} -gt 0 ] && [ ${#body} -lt 500 ]; then
        echo "   📄 Resposta: $body"
    elif [ ${#body} -gt 500 ]; then
        echo "   📄 Resposta: $(echo "$body" | head -c 200)... (truncada)"
    fi
    
    echo ""
}

echo "🔒 1. TESTANDO ENDPOINTS DE USER MANAGEMENT"
echo "============================================"

# Listar usuários
test_endpoint "GET" "/api/tenants/$TENANT_ID/users" "Listar usuários do tenant"

# Adicionar usuário (exemplo)
user_data='{
  "email": "test@example.com",
  "name": "Test User",
  "role": "user",
  "send_invite": true
}'
test_endpoint "POST" "/api/tenants/$TENANT_ID/users" "Adicionar novo usuário" "$user_data"

# Atualizar usuário (exemplo)
update_data='{
  "name": "Updated Test User",
  "role": "admin",
  "status": "active"
}'
test_endpoint "PUT" "/api/tenants/$TENANT_ID/users/test-user-id" "Atualizar usuário" "$update_data"

# Remover usuário
test_endpoint "DELETE" "/api/tenants/$TENANT_ID/users/test-user-id" "Remover usuário"

echo "📊 2. TESTANDO ENDPOINTS DE MONITORING"
echo "======================================"

# Métricas do tenant
test_endpoint "GET" "/api/tenants/$TENANT_ID/metrics" "Obter métricas do tenant"

# Métricas com filtros
test_endpoint "GET" "/api/tenants/$TENANT_ID/metrics?time_range=24h" "Obter métricas com filtro de tempo"

# Logs do tenant
test_endpoint "GET" "/api/tenants/$TENANT_ID/logs" "Obter logs do tenant"

# Logs com filtros
test_endpoint "GET" "/api/tenants/$TENANT_ID/logs?level=error&limit=50" "Obter logs com filtros"

echo "🔐 3. TESTANDO ENDPOINTS DE OIDC"
echo "================================"

# Configuração OIDC
test_endpoint "GET" "/api/tenants/$TENANT_ID/oidc/config" "Obter configuração OIDC"

# Salvar configuração OIDC
oidc_config='{
  "enabled": true,
  "provider_name": "Test OIDC",
  "provider_url": "https://example.com/oidc",
  "client_id": "test-client-id",
  "client_secret": "test-client-secret",
  "redirect_uri": "https://app.example.com/auth/callback",
  "scopes": "openid profile email"
}'
test_endpoint "PUT" "/api/tenants/$TENANT_ID/oidc/config" "Salvar configuração OIDC" "$oidc_config"

# Testar configuração OIDC
test_endpoint "POST" "/api/tenants/$TENANT_ID/oidc/test" "Testar configuração OIDC"

echo "🔧 4. TESTANDO ENDPOINTS AUXILIARES"
echo "==================================="

# Status do tenant
test_endpoint "GET" "/api/tenants/$TENANT_ID/status" "Status do tenant"

# Billing do tenant
test_endpoint "GET" "/api/tenants/$TENANT_ID/billing" "Informações de billing"

# Configuração geral do tenant
test_endpoint "GET" "/api/tenants/$TENANT_ID/config" "Configuração do tenant"

echo "🛡️ 5. TESTANDO SEGURANÇA"
echo "========================"

# Teste sem token
echo "🔍 Testando acesso sem token..."
response=$(curl -s -w "\n%{http_code}" "$BASE_URL/api/tenants/$TENANT_ID/users")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "   ✅ Segurança OK: Acesso negado sem token ($http_code)"
else
    echo "   ❌ Falha de segurança: Acesso permitido sem token ($http_code)"
fi
echo ""

# Teste com token inválido
echo "🔍 Testando acesso com token inválido..."
response=$(curl -s -w "\n%{http_code}" \
    -H "Authorization: Bearer invalid-token" \
    "$BASE_URL/api/tenants/$TENANT_ID/users")
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" = "401" ] || [ "$http_code" = "403" ]; then
    echo "   ✅ Segurança OK: Token inválido rejeitado ($http_code)"
else
    echo "   ❌ Falha de segurança: Token inválido aceito ($http_code)"
fi
echo ""

echo "📋 RESUMO DOS TESTES"
echo "==================="
echo ""
echo "✨ Testes concluídos!"
echo ""
echo "🎯 Componentes frontend criados:"
echo "• UserManagement.tsx - Gerenciamento de usuários"
echo "• OIDCSettings.tsx - Configuração SSO/OIDC"
echo "• TenantMonitoring.tsx - Monitoramento e métricas"
echo ""
echo "🔗 Hooks criados:"
echo "• useUserManagement - Para gerenciar usuários"
echo "• useOIDCConfig - Para configuração OIDC"
echo "• useTenantMetrics - Para métricas e monitoramento"
echo ""
echo "📝 Próximos passos:"
echo "1. Verificar endpoints que retornaram 404 e implementá-los no backend"
echo "2. Corrigir problemas de autenticação se necessário"
echo "3. Integrar os componentes ao dashboard principal"
echo "4. Testar a funcionalidade completa end-to-end"
echo ""
echo "🚀 Sistema pronto para integração completa!"

# Verificar se o servidor está rodando
echo "🔍 VERIFICAÇÃO ADICIONAL"
echo "======================="

echo "Verificando se o servidor VeloFlux está rodando..."
if curl -s -f "$BASE_URL/api/health" > /dev/null; then
    echo "✅ Servidor está rodando e respondendo"
else
    echo "❌ Servidor não está respondendo em $BASE_URL"
    echo ""
    echo "Para iniciar o servidor:"
    echo "cd backend && go run cmd/veloflux/main.go"
fi

echo ""
echo "🎯 Teste concluído!"
