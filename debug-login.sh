#!/bin/bash

# Script para debugar o problema de login do frontend
echo "🔍 DEBUGANDO PROBLEMA DE LOGIN FRONTEND"
echo "======================================================"

# 1. Verificar se o frontend está acessível
echo "1. Testando acesso ao frontend via nginx..."
curl -s -o /dev/null -w "Frontend via nginx (http://localhost): %{http_code}\n" http://localhost

# 2. Verificar se o endpoint de API está acessível
echo -e "\n2. Testando endpoints de API..."
curl -s -o /dev/null -w "API Health (http://localhost/api/health): %{http_code}\n" http://localhost/api/health
curl -s -o /dev/null -w "Auth endpoint (http://localhost/api/auth/login) GET: %{http_code}\n" http://localhost/api/auth/login

# 3. Testar login via API
echo -e "\n3. Testando login via API..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"logintest@example.com","password":"StrongPass123!"}' \
  -w "HTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$LOGIN_RESPONSE" | grep -o "HTTP_CODE:[0-9]*" | cut -d: -f2)
RESPONSE_BODY=$(echo "$LOGIN_RESPONSE" | sed 's/HTTP_CODE:[0-9]*$//')

echo "HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
  echo "✅ Login via API funcionando!"
  echo "Token obtido: $(echo "$RESPONSE_BODY" | jq -r .token | cut -c1-50)..."
else
  echo "❌ Erro no login via API"
  echo "Response: $RESPONSE_BODY"
fi

# 4. Verificar configuração do frontend
echo -e "\n4. Verificando configuração do frontend..."
docker-compose exec frontend printenv | grep -E "(VITE_|NODE_)" | sort

# 5. Verificar logs recentes
echo -e "\n5. Logs recentes do frontend (últimas 5 linhas)..."
docker-compose logs frontend --tail=5

echo -e "\n6. Logs recentes do backend (últimas 5 linhas)..."
docker-compose logs backend --tail=5

echo -e "\n======================================================"
echo "🔍 Para debugar no navegador:"
echo "1. Acesse: http://localhost/login"
echo "2. Abra o DevTools (F12)"
echo "3. Vá para a aba Network"
echo "4. Tente fazer login com:"
echo "   Email: logintest@example.com"
echo "   Senha: StrongPass123!"
echo "5. Verifique se aparece alguma requisição na aba Network"
echo "6. Se aparecer erro na aba Console, anote o erro"
