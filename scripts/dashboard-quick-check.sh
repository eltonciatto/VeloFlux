#!/bin/bash

# ✅ QUICK CHECK: Dashboard VeloFlux - Verificação Rápida de Produção
# Author: VeloFlux Team

echo "🚀 VELOFLUX DASHBOARD - QUICK CHECK"
echo "================================="

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

CHECKS_PASSED=0
TOTAL_CHECKS=8

check() {
    local description="$1"
    local command="$2"
    
    if eval "$command" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ $description${NC}"
        ((CHECKS_PASSED++))
    else
        echo -e "${RED}❌ $description${NC}"
    fi
}

echo ""
echo "📋 Verificando componentes críticos..."

# 1. Componentes principais existem
check "MetricsView.tsx existe" "[ -f '/workspaces/VeloFlux/frontend/src/components/dashboard/MetricsView.tsx' ]"

# 2. BackendOverview existe  
check "BackendOverview.tsx existe" "[ -f '/workspaces/VeloFlux/frontend/src/components/dashboard/BackendOverview.tsx' ]"

# 3. Hooks de API existem
check "use-api.ts existe" "[ -f '/workspaces/VeloFlux/frontend/src/hooks/use-api.ts' ]"

# 4. Hook de produção existe
check "useProductionData.ts existe" "[ -f '/workspaces/VeloFlux/frontend/src/hooks/useProductionData.ts' ]"

# 5. WebSocket implementado
check "WebSocket Manager implementado" "[ -f '/workspaces/VeloFlux/frontend/src/lib/websocket.ts' ]"

# 6. Configuração de ambiente
check "Configuração de ambiente" "[ -f '/workspaces/VeloFlux/frontend/src/config/environment.ts' ]"

# 7. Scripts de teste
check "Scripts de validação" "[ -f '/workspaces/VeloFlux/scripts/validate-apis.sh' ]"

# 8. Documentação
check "Documentação completa" "[ -f '/workspaces/VeloFlux/docs/PLANO_TESTE_DASHBOARD_PRODUCAO_COMPLETO.md' ]"

echo ""
echo "📊 RESULTADO:"
echo "   Checks passaram: $CHECKS_PASSED de $TOTAL_CHECKS"

SCORE=$((CHECKS_PASSED * 100 / TOTAL_CHECKS))
echo "   Score: $SCORE%"

if [ "$SCORE" -ge 85 ]; then
    echo -e "${GREEN}🎉 DASHBOARD PRONTO PARA PRODUÇÃO!${NC}"
    echo ""
    echo "🚀 Para deploy:"
    echo "   cd frontend && npm run build"
    echo "   docker-compose up -d"
elif [ "$SCORE" -ge 70 ]; then
    echo -e "${YELLOW}⚠️ Dashboard quase pronto - pequenos ajustes necessários${NC}"
else
    echo -e "${RED}❌ Dashboard precisa de correções${NC}"
fi

echo ""
echo "📄 Relatório completo: /workspaces/VeloFlux/docs/RELATORIO_FINAL_DASHBOARD_PRODUCAO.md"

exit $((SCORE < 85 ? 1 : 0))
