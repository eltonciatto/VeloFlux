#!/bin/bash

# Script simples para testar conteúdo por domínio
echo "Verificando conteúdo por domínio"
echo "================================"

# Array de domínios para testar
DOMAINS=(
    "example.com" 
    "www.example.com"
    "api.example.com"
    "app.private.dev.veloflux.io"
    "www.private.dev.veloflux.io"
    "api.private.dev.veloflux.io"
    "admin.private.dev.veloflux.io"
    "tenant1.private.dev.veloflux.io"
    "tenant2.private.dev.veloflux.io"
    "tenant1.public.dev.veloflux.io"
    "api.public.dev.veloflux.io"
    "test.private.dev.veloflux.io"
    "test.public.dev.veloflux.io"
)

# Verificar backends diretamente
echo
echo "### Backends diretos ###"
for port in 8001 8002; do
    echo -n "Backend $port: "
    title=$(curl -s http://localhost:$port/ | grep -o '<title>[^<]*</title>' | sed 's/<title>\(.*\)<\/title>/\1/')
    echo "$title"
done

# Verificar domínios
echo
echo "### Domínios via VeloFlux ###"
for domain in "${DOMAINS[@]}"; do
    echo -n "$domain: "
    status=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: $domain" "http://localhost:80/")
    title=$(curl -s -H "Host: $domain" "http://localhost:80/" | grep -o '<title>[^<]*</title>' | sed 's/<title>\(.*\)<\/title>/\1/')
    echo "Status $status, Title: ${title:-N/A}"
done

# Testar balanceamento
echo
echo "### Teste de balanceamento ###"
echo "Fazendo 10 requisições para app.private.dev.veloflux.io:"
for i in {1..10}; do
    curl -s -H "Host: app.private.dev.veloflux.io" "http://localhost:80/" | grep -o '<title>[^<]*</title>\|Server [0-9]\+'
    echo "---"
done

echo
echo "Verificação concluída"
