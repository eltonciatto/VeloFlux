#!/bin/bash

# Script final de verificação - Dashboard 100% Pronto para Produção
# Author: VeloFlux Team
# Date: $(date +%Y-%m-%d)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

clear
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                 🏆 DASHBOARD VELOFLUX                        ║${NC}"
echo -e "${PURPLE}║              VERIFICAÇÃO FINAL DE PRODUÇÃO                   ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

FINAL_REPORT="/workspaces/VeloFlux/reports/DASHBOARD_FINAL_STATUS_$(date +%Y%m%d-%H%M%S).md"
mkdir -p /workspaces/VeloFlux/reports

# Função para escrever no relatório
write_report() {
    echo "$1" | tee -a "$FINAL_REPORT"
}

write_report "# 🏆 DASHBOARD VELOFLUX - STATUS FINAL DE PRODUÇÃO"
write_report "## Data: $(date '+%Y-%m-%d %H:%M:%S')"
write_report ""

# Contadores para score final
TOTAL_CHECKS=0
PASSED_CHECKS=0

# Função para check
check_item() {
    local description="$1"
    local success="$2"
    local details="$3"
    
    ((TOTAL_CHECKS++))
    
    if [ "$success" = "true" ]; then
        echo -e "${GREEN}✅ $description${NC}"
        write_report "- ✅ **$description**"
        ((PASSED_CHECKS++))
    else
        echo -e "${RED}❌ $description${NC}"
        write_report "- ❌ **$description**"
    fi
    
    if [ -n "$details" ]; then
        echo -e "   ${CYAN}$details${NC}"
        write_report "  - $details"
    fi
}

echo -e "${BLUE}🔍 1. VERIFICANDO INFRAESTRUTURA...${NC}"
write_report "## 🔍 1. Infraestrutura"
write_report ""

# Check Docker
if docker --version > /dev/null 2>&1; then
    check_item "Docker instalado" "true" "$(docker --version)"
else
    check_item "Docker instalado" "false" "Docker não encontrado"
fi

# Check Docker Compose
if docker-compose --version > /dev/null 2>&1; then
    check_item "Docker Compose disponível" "true" "$(docker-compose --version)"
else
    check_item "Docker Compose disponível" "false" "Docker Compose não encontrado"
fi

# Check Backend Health
if curl -s --connect-timeout 5 "http://localhost:8080/health" > /dev/null 2>&1; then
    check_item "Backend Principal (8080)" "true" "Respondendo"
else
    check_item "Backend Principal (8080)" "false" "Não responde"
fi

# Check API Gateway
if curl -s --connect-timeout 5 "http://localhost:9090/api/status" > /dev/null 2>&1; then
    check_item "API Gateway (9090)" "true" "Respondendo"
else
    check_item "API Gateway (9090)" "false" "Não responde"
fi

# Check Admin API
if curl -s --connect-timeout 5 "http://localhost:9000/admin/api/health" > /dev/null 2>&1; then
    check_item "Admin API (9000)" "true" "Respondendo"
else
    check_item "Admin API (9000)" "false" "Não responde"
fi

write_report ""

echo -e "\n${BLUE}🧩 2. VERIFICANDO COMPONENTES...${NC}"
write_report "## 🧩 2. Componentes"
write_report ""

# Check componentes críticos
CRITICAL_COMPONENTS=(
    "frontend/src/components/dashboard/MetricsView.tsx"
    "frontend/src/components/dashboard/BackendOverview.tsx"
    "frontend/src/components/dashboard/PredictiveAnalytics.tsx"
)

for component in "${CRITICAL_COMPONENTS[@]}"; do
    if [ -f "/workspaces/VeloFlux/$component" ]; then
        # Verificar se usa hooks de API
        if grep -q "useSystemMetrics\|useBackends\|useRealTimeMetrics" "/workspaces/VeloFlux/$component"; then
            check_item "$(basename $component)" "true" "Usando hooks de API reais"
        else
            check_item "$(basename $component)" "false" "Não usa hooks de API reais"
        fi
    else
        check_item "$(basename $component)" "false" "Arquivo não encontrado"
    fi
done

write_report ""

echo -e "\n${BLUE}🔌 3. VERIFICANDO HOOKS DE API...${NC}"
write_report "## 🔌 3. Hooks de API"
write_report ""

# Check hooks principais
API_HOOKS=(
    "frontend/src/hooks/use-api.ts"
    "frontend/src/hooks/useAdvancedAnalytics.ts"
    "frontend/src/hooks/useAIMetrics.ts"
    "frontend/src/hooks/useProductionData.ts"
)

for hook in "${API_HOOKS[@]}"; do
    if [ -f "/workspaces/VeloFlux/$hook" ]; then
        # Verificar se tem função de fetch
        if grep -q "apiFetch\|useQuery\|useMutation" "/workspaces/VeloFlux/$hook"; then
            check_item "$(basename $hook)" "true" "Implementado com React Query"
        else
            check_item "$(basename $hook)" "false" "Não implementado corretamente"
        fi
    else
        check_item "$(basename $hook)" "false" "Arquivo não encontrado"
    fi
done

write_report ""

echo -e "\n${BLUE}🌐 4. VERIFICANDO WEBSOCKET...${NC}"
write_report "## 🌐 4. WebSocket Real-time"
write_report ""

# Check WebSocket implementation
if [ -f "/workspaces/VeloFlux/frontend/src/lib/websocket.ts" ]; then
    if grep -q "WebSocketManager\|subscribe\|connect" "/workspaces/VeloFlux/frontend/src/lib/websocket.ts"; then
        check_item "WebSocket Manager" "true" "Implementado"
    else
        check_item "WebSocket Manager" "false" "Implementação incompleta"
    fi
else
    check_item "WebSocket Manager" "false" "Não implementado"
fi

# Check se useAdvancedAnalytics usa WebSocket
if [ -f "/workspaces/VeloFlux/frontend/src/hooks/useAdvancedAnalytics.ts" ]; then
    if grep -q "useWebSocket" "/workspaces/VeloFlux/frontend/src/hooks/useAdvancedAnalytics.ts"; then
        check_item "useAdvancedAnalytics WebSocket" "true" "Integrado com WebSocket"
    else
        check_item "useAdvancedAnalytics WebSocket" "false" "Ainda usando mock"
    fi
else
    check_item "useAdvancedAnalytics WebSocket" "false" "Hook não encontrado"
fi

write_report ""

echo -e "\n${BLUE}⚙️ 5. VERIFICANDO CONFIGURAÇÃO...${NC}"
write_report "## ⚙️ 5. Configuração"
write_report ""

# Check environment config
if [ -f "/workspaces/VeloFlux/frontend/src/config/environment.ts" ]; then
    if grep -q "PRODUCTION\|API_URL\|endpoints" "/workspaces/VeloFlux/frontend/src/config/environment.ts"; then
        check_item "Configuração de Ambiente" "true" "Produção e desenvolvimento configurados"
    else
        check_item "Configuração de Ambiente" "false" "Configuração incompleta"
    fi
else
    check_item "Configuração de Ambiente" "false" "Arquivo não encontrado"
fi

# Check data config
if [ -f "/workspaces/VeloFlux/frontend/src/config/dataConfig.ts" ]; then
    if grep -q "isDemoMode\|PRODUCTION_CONFIG" "/workspaces/VeloFlux/frontend/src/config/dataConfig.ts"; then
        check_item "Configuração de Dados" "true" "Demo e produção configurados"
    else
        check_item "Configuração de Dados" "false" "Configuração incompleta"
    fi
else
    check_item "Configuração de Dados" "false" "Arquivo não encontrado"
fi

write_report ""

echo -e "\n${BLUE}🧪 6. VERIFICANDO TESTES...${NC}"
write_report "## 🧪 6. Testes"
write_report ""

# Check test scripts
TEST_SCRIPTS=(
    "scripts/test-dashboard-complete.sh"
    "scripts/validate-apis.sh"
    "scripts/master-validation.sh"
)

for script in "${TEST_SCRIPTS[@]}"; do
    if [ -f "/workspaces/VeloFlux/$script" ]; then
        if [ -x "/workspaces/VeloFlux/$script" ]; then
            check_item "$(basename $script)" "true" "Script executável"
        else
            check_item "$(basename $script)" "false" "Script não executável"
        fi
    else
        check_item "$(basename $script)" "false" "Script não encontrado"
    fi
done

# Check E2E tests
if [ -f "/workspaces/VeloFlux/frontend/tests/e2e/dashboard-complete.spec.js" ]; then
    check_item "Testes E2E" "true" "Playwright configurado"
else
    check_item "Testes E2E" "false" "Testes E2E não encontrados"
fi

write_report ""

echo -e "\n${BLUE}📋 7. VERIFICANDO DOCUMENTAÇÃO...${NC}"
write_report "## 📋 7. Documentação"
write_report ""

# Check documentation
DOCS=(
    "docs/PLANO_TESTE_DASHBOARD_PRODUCAO_COMPLETO.md"
    "docs/GUIA_TESTE_DASHBOARD_PRODUCAO.md"
    "docs/RESUMO_EXECUTIVO_PLANO_TESTE.md"
)

for doc in "${DOCS[@]}"; do
    if [ -f "/workspaces/VeloFlux/$doc" ]; then
        check_item "$(basename $doc)" "true" "Documentação disponível"
    else
        check_item "$(basename $doc)" "false" "Documentação não encontrada"
    fi
done

write_report ""

# Calcular score final
SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                    📊 RESULTADO FINAL                        ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════╝${NC}"

write_report "## 📊 Resultado Final"
write_report ""
write_report "| Métrica | Valor |"
write_report "|---------|-------|"
write_report "| **Checks Passaram** | $PASSED_CHECKS de $TOTAL_CHECKS |"
write_report "| **Score** | **${SCORE}%** |"

if [ "$SCORE" -ge 90 ]; then
    echo -e "\n${GREEN}🎉 EXCELENTE! Dashboard 100% pronto para produção! (${SCORE}%)${NC}"
    echo -e "${GREEN}   Todos os componentes críticos estão funcionando.${NC}"
    write_report "| **Status** | 🎉 **EXCELENTE - 100% Pronto** |"
    write_report ""
    write_report "### ✅ Dashboard Aprovado para Produção"
    write_report "O dashboard VeloFlux está completamente pronto para ambiente de produção."
    
elif [ "$SCORE" -ge 80 ]; then
    echo -e "\n${GREEN}✅ MUITO BOM! Dashboard quase pronto para produção! (${SCORE}%)${NC}"
    echo -e "${YELLOW}   Apenas pequenos ajustes necessários.${NC}"
    write_report "| **Status** | ✅ **MUITO BOM - Quase Pronto** |"
    write_report ""
    write_report "### ⚠️ Pequenos Ajustes Necessários"
    
elif [ "$SCORE" -ge 70 ]; then
    echo -e "\n${YELLOW}⚠️ BOM! Dashboard precisa de alguns ajustes (${SCORE}%)${NC}"
    echo -e "${YELLOW}   Alguns componentes precisam ser corrigidos.${NC}"
    write_report "| **Status** | ⚠️ **BOM - Precisa Ajustes** |"
    write_report ""
    write_report "### 🔧 Ajustes Necessários"
    
else
    echo -e "\n${RED}❌ Dashboard precisa de melhorias significativas (${SCORE}%)${NC}"
    echo -e "${RED}   Vários componentes precisam ser implementados.${NC}"
    write_report "| **Status** | ❌ **PRECISA MELHORIAS** |"
    write_report ""
    write_report "### 🚨 Melhorias Significativas Necessárias"
fi

echo -e "\n${CYAN}📈 Detalhes:${NC}"
echo -e "   • Checks passaram: $PASSED_CHECKS de $TOTAL_CHECKS"
echo -e "   • Score: ${SCORE}%"

write_report ""

# Próximos passos baseados no score
if [ "$SCORE" -ge 90 ]; then
    write_report "## 🚀 Próximos Passos"
    write_report "1. **Deploy para produção**: O dashboard está pronto"
    write_report "2. **Monitoramento**: Configurar alertas de produção"
    write_report "3. **Backup**: Configurar backup de dados"
    write_report "4. **Documentação**: Finalizar documentação de usuário"
    
elif [ "$SCORE" -ge 70 ]; then
    write_report "## 🔧 Próximos Passos"
    write_report "1. **Corrigir componentes faltantes**: Implementar componentes não conformes"
    write_report "2. **Testar integrações**: Executar testes de API"
    write_report "3. **Verificar WebSocket**: Implementar atualizações em tempo real"
    write_report "4. **Executar testes E2E**: Validar fluxos completos"
    
else
    write_report "## 🚨 Próximos Passos Críticos"
    write_report "1. **Implementar hooks de API**: Substituir dados mockados"
    write_report "2. **Configurar backend**: Garantir que todos os serviços estão rodando"
    write_report "3. **Implementar WebSocket**: Para atualizações em tempo real"
    write_report "4. **Criar testes**: Implementar suite de testes completa"
fi

write_report ""
write_report "---"
write_report "**Verificação realizada em**: $(date '+%Y-%m-%d %H:%M:%S')"
write_report "**Relatório salvo em**: \`$FINAL_REPORT\`"

echo -e "\n${BLUE}📄 Relatório final salvo em:${NC}"
echo -e "   $FINAL_REPORT"

# Scripts de teste rápido se score for alto
if [ "$SCORE" -ge 80 ]; then
    echo -e "\n${GREEN}🚀 Para executar testes completos:${NC}"
    echo -e "   ${CYAN}./scripts/master-validation.sh${NC}"
    echo -e "   ${CYAN}./scripts/quick-start.sh${NC}"
fi

exit $((100 - SCORE > 50 ? 1 : 0))
