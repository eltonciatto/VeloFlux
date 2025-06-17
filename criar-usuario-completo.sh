#!/bin/bash

echo "🚀 Criando usuário VeloFlux com tenant e plano..."

# Dados do usuário
EMAIL="admin@veloflux.com.br"
PASSWORD="senha123456"
FIRST_NAME="Admin"
LAST_NAME="VeloFlux"
TENANT_NAME="VeloFlux Corporation"
PLAN="pro"

echo "📧 Email: $EMAIL"
echo "👤 Nome: $FIRST_NAME $LAST_NAME"
echo "🏢 Tenant: $TENANT_NAME" 
echo "💳 Plano: $PLAN"
echo ""

# Registro do usuário
echo "1. Registrando usuário..."
REGISTER_RESPONSE=$(curl -s -X POST "http://localhost/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASSWORD\",
    \"first_name\": \"$FIRST_NAME\",
    \"last_name\": \"$LAST_NAME\",
    \"tenant_name\": \"$TENANT_NAME\",
    \"plan\": \"$PLAN\"
  }" \
  -w "\nHTTP Status: %{http_code}\n")

echo "Resposta do registro:"
echo "$REGISTER_RESPONSE"
echo ""

# Extrair token da resposta (se sucesso)
TOKEN=$(echo "$REGISTER_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo "✅ Usuário criado com sucesso!"
    echo "🔑 Token: ${TOKEN:0:50}..."
    echo ""
    
    # Testar login
    echo "2. Testando login..."
    LOGIN_RESPONSE=$(curl -s -X POST "http://localhost/auth/login" \
      -H "Content-Type: application/json" \
      -d "{
        \"email\": \"$EMAIL\",
        \"password\": \"$PASSWORD\"
      }" \
      -w "\nHTTP Status: %{http_code}\n")
    
    echo "Resposta do login:"
    echo "$LOGIN_RESPONSE"
    echo ""
    
    # Extrair novo token do login
    LOGIN_TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    
    if [ ! -z "$LOGIN_TOKEN" ]; then
        echo "✅ Login realizado com sucesso!"
        echo "🔑 Token de login: ${LOGIN_TOKEN:0:50}..."
        echo ""
        
        # Testar profile
        echo "3. Testando profile..."
        PROFILE_RESPONSE=$(curl -s -X GET "http://localhost/api/profile" \
          -H "Authorization: Bearer $LOGIN_TOKEN" \
          -H "Content-Type: application/json" \
          -w "\nHTTP Status: %{http_code}\n")
        
        echo "Resposta do profile:"
        echo "$PROFILE_RESPONSE"
        echo ""
        
        if echo "$PROFILE_RESPONSE" | grep -q "HTTP Status: 200"; then
            echo "✅ Profile acessado com sucesso!"
            echo "🎉 Todas as APIs estão funcionando corretamente!"
        else
            echo "❌ Erro ao acessar profile"
        fi
    else
        echo "❌ Erro no login"
    fi
else
    echo "❌ Erro no registro"
    echo "Verifique se todos os serviços estão rodando:"
    echo "docker-compose ps"
fi

echo ""
echo "📋 Dados para testes manuais:"
echo "Email: $EMAIL"
echo "Senha: $PASSWORD"
echo "URL: http://localhost"
