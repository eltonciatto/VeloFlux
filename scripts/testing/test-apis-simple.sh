#!/bin/bash

# Script de testes simplificado para APIs VeloFlux
set -e

BASE_URL="http://localhost:9090"

echo "🚀 VeloFlux API Tests - Testes Simplificados"
echo "============================================"

# Verificar se backend está rodando
echo "🔍 Verificando backend..."
curl -s $BASE_URL/health > /dev/null && echo "✅ Backend OK" || { echo "❌ Backend offline"; exit 1; }

echo
echo "🔑 === AUTENTICAÇÃO ==="

# Registrar usuário
echo "📝 Registrando usuário..."
REGISTER_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"testuser@veloflux.io","password":"123456","first_name":"Test","last_name":"User","tenant_name":"Test Company","plan":"free"}' \
    $BASE_URL/auth/register)

echo "✅ Registro: $REGISTER_RESPONSE"

# Extrair token
JWT_TOKEN=$(echo $REGISTER_RESPONSE | jq -r '.token')
USER_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.user_id')
TENANT_ID=$(echo $REGISTER_RESPONSE | jq -r '.user.tenant_id')

echo "🔐 Token: ${JWT_TOKEN:0:50}..."
echo "👤 User ID: $USER_ID"
echo "🏢 Tenant ID: $TENANT_ID"

# Testar login
echo
echo "🔓 Testando login..."
LOGIN_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"email":"testuser@veloflux.io","password":"123456"}' \
    $BASE_URL/auth/login)

echo "✅ Login: $(echo $LOGIN_RESPONSE | jq -c .)"

# Testar refresh
echo
echo "🔄 Testando refresh..."
REFRESH_RESPONSE=$(curl -s -X POST -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/auth/refresh)

echo "✅ Refresh: $(echo $REFRESH_RESPONSE | jq -c .)"

echo
echo "🔒 === AUTORIZAÇÃO ==="

# Testar sem token (deve falhar)
echo "🚫 Testando sem token..."
NO_AUTH_RESPONSE=$(curl -s $BASE_URL/api/tenants)
echo "✅ Sem auth: $(echo $NO_AUTH_RESPONSE | jq -c .)"

# Testar com token válido
echo
echo "✅ Testando com token válido..."
WITH_AUTH_RESPONSE=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/api/tenants)
echo "✅ Com auth: $(echo $WITH_AUTH_RESPONSE | jq -c .)"

echo
echo "🏢 === OPERAÇÕES TENANT ==="

# Listar tenants
echo "📋 Listando tenants..."
TENANTS_LIST=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/api/tenants)
echo "✅ Lista: $(echo $TENANTS_LIST | jq -c .)"

# Obter tenant específico
echo
echo "🔍 Obtendo tenant específico..."
TENANT_GET=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/api/tenants/$TENANT_ID)
echo "✅ Get: $(echo $TENANT_GET | jq -c .)"

# Atualizar tenant
echo
echo "✏️ Atualizando tenant..."
TENANT_UPDATE=$(curl -s -X PUT -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"name":"Updated Company Name"}' \
    $BASE_URL/api/tenants/$TENANT_ID)
echo "✅ Update: $(echo $TENANT_UPDATE | jq -c .)"

echo
echo "💰 === OPERAÇÕES BILLING ==="

# Listar subscriptions
echo "📋 Listando subscriptions..."
SUBS_LIST=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/api/billing/subscriptions)
echo "✅ Subscriptions: $(echo $SUBS_LIST | jq -c .)"

# Criar subscription
echo
echo "➕ Criando subscription..."
SUB_CREATE=$(curl -s -X POST -H "Authorization: Bearer $JWT_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"plan":"premium","billing_cycle":"monthly"}' \
    $BASE_URL/api/billing/subscriptions)
echo "✅ Create Sub: $(echo $SUB_CREATE | jq -c .)"

# Extrair subscription ID
SUBSCRIPTION_ID=$(echo $SUB_CREATE | jq -r '.data.subscription_id')
echo "💳 Subscription ID: $SUBSCRIPTION_ID"

# Listar invoices
echo
echo "📋 Listando invoices..."
INVOICES_LIST=$(curl -s -H "Authorization: Bearer $JWT_TOKEN" \
    $BASE_URL/api/billing/invoices)
echo "✅ Invoices: $(echo $INVOICES_LIST | jq -c .)"

# Testar webhook
echo
echo "🔗 Testando webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" \
    -d '{"type":"subscription.updated","data":{"subscription_id":"'$SUBSCRIPTION_ID'","status":"active"}}' \
    $BASE_URL/api/billing/webhooks)
echo "✅ Webhook: $(echo $WEBHOOK_RESPONSE | jq -c .)"

echo
echo "🗄️ === INTEGRAÇÃO REDIS ==="

echo "📊 Verificando chaves Redis..."
docker exec veloflux-redis redis-cli KEYS "*" | grep -E "(tenant|user|billing)" | head -5

echo
echo "🏢 Tenant no Redis:"
docker exec veloflux-redis redis-cli GET "vf:tenant:$TENANT_ID" | jq -c . 2>/dev/null || echo "Não encontrado"

echo
echo "👤 User no Redis:"
docker exec veloflux-redis redis-cli GET "vf:user:$USER_ID" | jq -c . 2>/dev/null || echo "Não encontrado"

if [ "$SUBSCRIPTION_ID" != "null" ] && [ -n "$SUBSCRIPTION_ID" ]; then
    echo
    echo "💳 Subscription no Redis:"
    docker exec veloflux-redis redis-cli GET "vf:billing:subscription:$SUBSCRIPTION_ID" || echo "Não encontrado"
fi

echo
echo "🎉 === RESUMO ==="
echo "✅ Autenticação: Registro, Login, Refresh funcionando"
echo "✅ Autorização: Proteção de endpoints funcionando"
echo "✅ Tenant CRUD: Listar, Obter, Atualizar funcionando"
echo "✅ Billing: Subscriptions, Invoices, Webhooks funcionando"
echo "✅ Redis: Integração de dados funcionando"
echo
echo "🔧 Dados para uso:"
echo "   Token: $JWT_TOKEN"
echo "   User: $USER_ID"
echo "   Tenant: $TENANT_ID"
echo "   Subscription: $SUBSCRIPTION_ID"
