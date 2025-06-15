#!/bin/bash

# Script de verificação completa do VeloFlux VPS
# Este script verifica o status de todos os serviços e endpoints

set -e

VPS_IP="107.172.207.63"
SSH_KEY="/root/.ssh/vps_veloflux"

echo "🔍 Verificação Completa do VeloFlux VPS"
echo "========================================"

# Função para executar comandos na VPS
run_remote() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$VPS_IP" "$@"
}

# Função para testar URL
test_url() {
    local url=$1
    local description=$2
    echo -n "📡 $description ($url): "
    
    local status_code=$(run_remote "curl -s -o /dev/null -w '%{http_code}' --max-time 10 '$url'" 2>/dev/null || echo "000")
    
    if [[ "$status_code" =~ ^[23] ]]; then
        echo "✅ OK ($status_code)"
        return 0
    else
        echo "❌ ERRO ($status_code)"
        return 1
    fi
}

# Verificar conexão SSH
echo "📡 Testando conexão SSH..."
if ! run_remote "echo 'SSH OK'" >/dev/null 2>&1; then
    echo "❌ Erro: Não foi possível conectar na VPS via SSH"
    echo "💡 Certifique-se de que:"
    echo "   - A chave SSH está correta"
    echo "   - O serviço SSH está rodando na VPS"
    echo "   - A porta 22 está aberta"
    exit 1
fi
echo "✅ Conexão SSH OK"

echo ""
echo "🐳 VERIFICAÇÃO DOS CONTAINERS"
echo "=============================="

# Status dos containers
echo "📋 Status dos containers VeloFlux:"
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml ps"

echo ""
echo "📋 Status dos containers Nginx:"
run_remote "cd /root/nginx-proxy && docker-compose ps"

echo ""
echo "🌐 VERIFICAÇÃO DOS ENDPOINTS"
echo "============================"

# Testes de conectividade
TOTAL_TESTS=0
PASSED_TESTS=0

urls=(
    "https://veloflux.io|Landing Page"
    "https://api.veloflux.io|API"
    "https://admin.veloflux.io|Admin Panel"
    "https://lb.veloflux.io|Load Balancer"
    "https://metrics.veloflux.io|Métricas"
    "https://grafana.veloflux.io|Grafana"
    "https://prometheus.veloflux.io|Prometheus"
)

for url_desc in "${urls[@]}"; do
    IFS='|' read -r url desc <<< "$url_desc"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    if test_url "$url" "$desc"; then
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
done

echo ""
echo "📊 VERIFICAÇÃO DETALHADA"
echo "========================"

# Verificar se a landing page está servindo o conteúdo correto
echo "🎨 Verificando conteúdo da landing page..."
if run_remote "curl -s https://veloflux.io | grep -q 'VeloFlux'" >/dev/null 2>&1; then
    echo "✅ Landing page contém 'VeloFlux'"
else
    echo "⚠️  Landing page pode não estar servindo o conteúdo correto"
fi

# Verificar API health
echo "🔍 Verificando saúde da API..."
if run_remote "curl -s https://api.veloflux.io/health" >/dev/null 2>&1; then
    echo "✅ API health endpoint respondendo"
else
    echo "⚠️  API health endpoint não encontrado"
fi

# Verificar métricas do Prometheus
echo "📊 Verificando métricas do Prometheus..."
if run_remote "curl -s https://metrics.veloflux.io/metrics | grep -q 'veloflux'" >/dev/null 2>&1; then
    echo "✅ Métricas do VeloFlux disponíveis"
else
    echo "⚠️  Métricas do VeloFlux não encontradas"
fi

echo ""
echo "📱 VERIFICAÇÃO DE RECURSOS"
echo "=========================="

# Uso de recursos
echo "💾 Uso de memória:"
run_remote "free -h"

echo ""
echo "💽 Uso de disco:"
run_remote "df -h /"

echo ""
echo "🔄 Uso de CPU:"
run_remote "top -bn1 | grep 'Cpu(s)'"

echo ""
echo "🐳 Recursos dos containers:"
run_remote "docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'"

echo ""
echo "📜 LOGS RECENTES"
echo "================"

echo "🔍 Últimas linhas do log do VeloFlux:"
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml logs --tail=5 veloflux-lb"

echo ""
echo "🔍 Últimas linhas do log do Nginx:"
run_remote "cd /root/nginx-proxy && docker-compose logs --tail=5 nginx"

echo ""
echo "📊 RESUMO FINAL"
echo "==============="

echo "✅ Testes passou: $PASSED_TESTS/$TOTAL_TESTS"

if [ "$PASSED_TESTS" -eq "$TOTAL_TESTS" ]; then
    echo "🎉 Todos os testes passaram! VeloFlux está funcionando corretamente."
    echo ""
    echo "🌐 Acesse seus serviços em:"
    echo "   • Landing Page: https://veloflux.io"
    echo "   • Admin Panel:  https://admin.veloflux.io"
    echo "   • API:          https://api.veloflux.io"
    echo "   • Grafana:      https://grafana.veloflux.io"
    echo "   • Prometheus:   https://prometheus.veloflux.io"
else
    echo "⚠️  Alguns testes falharam. Verifique os logs acima."
    echo ""
    echo "💡 Possíveis soluções:"
    echo "   1. Execute: ./scripts/fix-nginx-routing.sh"
    echo "   2. Reinicie os containers: cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml restart"
    echo "   3. Verifique os logs: docker-compose logs -f"
fi

echo ""
echo "🔧 Scripts úteis:"
echo "   • Corrigir roteamento: ./scripts/fix-nginx-routing.sh"
echo "   • Regenerar SSL:       cd /root/nginx-proxy && ./setup-ssl-webroot.sh"
echo "   • Reiniciar tudo:      cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml restart"
