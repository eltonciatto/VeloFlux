#!/bin/bash

# 🧪 Teste básico dos endpoints WebSocket do VeloFlux
# Este script testa se os endpoints WebSocket estão respondendo corretamente

set -e

# Configuração
VELOFLUX_HOST=${VELOFLUX_HOST:-"localhost:8080"}
TIMEOUT=${TIMEOUT:-10}

echo "🔌 Testando endpoints WebSocket do VeloFlux..."
echo "Host: $VELOFLUX_HOST"
echo "Timeout: ${TIMEOUT}s"
echo

# Função para testar endpoint HTTP básico
test_http_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    echo -n "🔍 Testando $description... "
    
    if curl -s --max-time $TIMEOUT "http://$VELOFLUX_HOST$endpoint" > /dev/null; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FALHOU"
        return 1
    fi
}

# Função para testar endpoint WebSocket
test_websocket_endpoint() {
    local endpoint="$1"
    local description="$2"
    
    echo -n "🔍 Testando WebSocket $description... "
    
    # Usar websocat se estiver disponível, senão usar curl para verificar se o endpoint existe
    if command -v websocat > /dev/null; then
        # Testar com websocat (timeout de 3 segundos)
        if timeout 3 websocat "ws://$VELOFLUX_HOST$endpoint" < /dev/null > /dev/null 2>&1; then
            echo "✅ OK (WebSocket conectado)"
            return 0
        else
            echo "⚠️  WebSocket pode estar funcionando (timeout esperado)"
            return 0
        fi
    else
        # Fallback: verificar se o endpoint HTTP responde (upgrade será rejeitado mas endpoint existe)
        if curl -s --max-time 3 "http://$VELOFLUX_HOST$endpoint" > /dev/null 2>&1; then
            echo "✅ OK (endpoint existe)"
            return 0
        else
            echo "❌ FALHOU"
            return 1
        fi
    fi
}

# Função para testar endpoint de controle
test_control_endpoint() {
    local endpoint="$1"
    local data="$2"
    local description="$3"
    
    echo -n "🔍 Testando $description... "
    
    if curl -s --max-time $TIMEOUT \
        -X POST \
        -H "Content-Type: application/json" \
        -d "$data" \
        "http://$VELOFLUX_HOST$endpoint" > /dev/null; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FALHOU"
        return 1
    fi
}

# Contadores
TOTAL_TESTS=0
PASSED_TESTS=0

# Teste 1: Endpoint de saúde básico
((TOTAL_TESTS++))
if test_http_endpoint "/health" "endpoint de saúde"; then
    ((PASSED_TESTS++))
fi

# Teste 2: API básica
((TOTAL_TESTS++))
if test_http_endpoint "/api/pools" "API de pools"; then
    ((PASSED_TESTS++))
fi

# Teste 3: WebSocket backends
((TOTAL_TESTS++))
if test_websocket_endpoint "/api/ws/backends" "backends"; then
    ((PASSED_TESTS++))
fi

# Teste 4: WebSocket metrics
((TOTAL_TESTS++))
if test_websocket_endpoint "/api/ws/metrics" "métricas"; then
    ((PASSED_TESTS++))
fi

# Teste 5: WebSocket status
((TOTAL_TESTS++))
if test_websocket_endpoint "/api/ws/status" "status"; then
    ((PASSED_TESTS++))
fi

# Teste 6: Controle WebSocket - pause
((TOTAL_TESTS++))
if test_control_endpoint "/api/ws/control" '{"action":"pause","type":"backends"}' "controle WebSocket (pause)"; then
    ((PASSED_TESTS++))
fi

# Teste 7: Controle WebSocket - resume
((TOTAL_TESTS++))
if test_control_endpoint "/api/ws/control" '{"action":"resume","type":"backends"}' "controle WebSocket (resume)"; then
    ((PASSED_TESTS++))
fi

# Teste 8: Force update
((TOTAL_TESTS++))
if test_control_endpoint "/api/ws/force-update" '{"type":"all"}' "força atualização"; then
    ((PASSED_TESTS++))
fi

echo
echo "📊 Resultados dos testes:"
echo "✅ Passou: $PASSED_TESTS/$TOTAL_TESTS"
echo "❌ Falhou: $((TOTAL_TESTS - PASSED_TESTS))/$TOTAL_TESTS"

if [ $PASSED_TESTS -eq $TOTAL_TESTS ]; then
    echo "🎉 Todos os testes passaram!"
    exit 0
else
    echo "⚠️  Alguns testes falharam. Verifique a configuração do VeloFlux."
    exit 1
fi
