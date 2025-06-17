#!/bin/bash

echo "🔍 Testando endpoints da API..."

# Token obtido anteriormente
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImVsdG9uQGNpYXR0by5jb20uYnIiLCJleHAiOjE3MzQ0Mzk2NzEsInRlbmFudF9pZCI6ImRlZmF1bHQifQ.hYGZKe6KFE5-UZ5xLcEQLpqCkZWs8HSr6aSdtF7kSYI"

echo "1. Testando /api/profile via localhost..."
timeout 5 curl -s -X GET "http://localhost/api/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" || echo "TIMEOUT ou ERRO"

echo -e "\n2. Testando /profile via localhost..."
timeout 5 curl -s -X GET "http://localhost/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" || echo "TIMEOUT ou ERRO"

echo -e "\n3. Testando diretamente no backend 9090..."
timeout 5 curl -s -X GET "http://localhost:9090/api/profile" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -w "\nStatus: %{http_code}\n" || echo "TIMEOUT ou ERRO"

echo -e "\n4. Testando health check..."
timeout 5 curl -s "http://localhost/health" -w "\nStatus: %{http_code}\n" || echo "TIMEOUT ou ERRO"

echo -e "\n✅ Teste concluído!"
