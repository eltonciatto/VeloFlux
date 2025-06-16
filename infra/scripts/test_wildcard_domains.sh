#!/bin/bash

# Script para testar domínios wildcard do VeloFlux

echo "Testando domínios wildcard configurados no Cloudflare"
echo "=============================================="
echo

# Porta padrão para testes
HTTP_PORT=80
if nc -z localhost 8082 2>/dev/null; then
    HTTP_PORT=8082
    echo "Usando porta alternativa: 8082"
fi

# Domínios privados (localhost)
echo "Testando domínios privados (*.private.dev.veloflux.io):"
for subdomain in "test" "random" "app" "api" "admin" "tenant1" "tenant2" "www"; do
    domain="${subdomain}.private.dev.veloflux.io"
    status=$(curl -s -H "Host: $domain" -o /dev/null -w "%{http_code}" http://localhost:${HTTP_PORT}/)
    if [[ $status =~ ^[23].. ]]; then
        echo -e "✅ $domain: Status $status (OK)"
    elif [[ $status == "404" ]]; then
        echo -e "⚠️ $domain: Status $status (Not Found - domínio resolvido mas caminho não existe)"
    else
        echo -e "❌ $domain: Status $status (Falhou)"
    fi
done

echo
echo "Testando domínios públicos (*.public.dev.veloflux.io):"
for subdomain in "test" "random" "app" "api" "admin" "tenant1" "tenant2" "www"; do
    domain="${subdomain}.public.dev.veloflux.io"
    status=$(curl -s -H "Host: $domain" -o /dev/null -w "%{http_code}" http://localhost:${HTTP_PORT}/)
    if [[ $status =~ ^[23].. ]]; then
        echo -e "✅ $domain: Status $status (OK)"
    elif [[ $status == "404" ]]; then
        echo -e "⚠️ $domain: Status $status (Not Found - domínio resolvido mas caminho não existe)"
    else
        echo -e "❌ $domain: Status $status (Falhou)"
    fi
done

echo
echo "Testando acesso direto aos domínios configurados (pode falhar se DNS não estiver configurado localmente):"
for domain in "api.public.dev.veloflux.io" "tenant1.public.dev.veloflux.io"; do
    status=$(curl -s -m 2 -o /dev/null -w "%{http_code}" http://${domain}/ || echo "timeout")
    if [[ $status =~ ^[23].. ]]; then
        echo -e "✅ $domain: Status $status (OK)"
    elif [[ $status == "404" ]]; then
        echo -e "⚠️ $domain: Status $status (Not Found - domínio resolvido mas caminho não existe)"
    elif [[ $status == "timeout" ]]; then
        echo -e "❓ $domain: Timeout - DNS pode não estar resolvendo para o IP público"
    else
        echo -e "❌ $domain: Status $status (Falhou)"
    fi
done

echo
echo "Teste de wildcards concluído."
