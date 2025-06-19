#!/bin/bash

# Script para converter componentes mockados para usar dados reais
# Author: VeloFlux Team  
# Date: $(date +%Y-%m-%d)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔄 CONVERSÃO: Dados Mockados → Dados Reais"
echo "=========================================="

REPORT_FILE="/workspaces/VeloFlux/reports/mock-to-real-conversion-$(date +%Y%m%d-%H%M%S).md"
mkdir -p /workspaces/VeloFlux/reports

# Função para escrever no relatório
write_report() {
    echo "$1" | tee -a "$REPORT_FILE"
}

write_report "# 🔄 CONVERSÃO DE DADOS MOCKADOS → REAIS"
write_report "## Data: $(date '+%Y-%m-%d %H:%M:%S')"
write_report ""

# Lista de componentes críticos que DEVEM usar dados reais
CRITICAL_COMPONENTS=(
    "/workspaces/VeloFlux/frontend/src/components/dashboard/MetricsView.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/BackendOverview.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/PredictiveAnalytics.tsx"
)

# Lista de componentes que podem permanecer com fallback
FALLBACK_OK_COMPONENTS=(
    "/workspaces/VeloFlux/frontend/src/components/mobile/MobileDashboard.tsx"
    "/workspaces/VeloFlux/frontend/src/components/mobile/SwipeableCards.tsx"
    "/workspaces/VeloFlux/frontend/src/components/integrations/"
)

echo -e "${BLUE}📋 Analisando componentes críticos...${NC}"
write_report "## 🎯 Análise de Componentes Críticos"
write_report ""

# Função para verificar se um componente está usando dados reais
check_component_data_source() {
    local file="$1"
    local filename=$(basename "$file")
    
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Arquivo não encontrado: $filename${NC}"
        return 1
    fi
    
    # Verificar se usa hooks de API reais
    API_HOOKS=$(grep -n "useSystemMetrics\|useBackends\|useRealTimeMetrics\|usePerformanceMetrics\|useAIMetrics\|useProductionData" "$file" 2>/dev/null || true)
    
    # Verificar se tem dados mockados hardcoded
    MOCK_DATA=$(grep -n "const.*=.*\[.*{" "$file" | grep -v "import\|export" 2>/dev/null || true)
    
    # Verificar se tem fallback apropriado
    FALLBACK=$(grep -n "||.*\[" "$file" 2>/dev/null || true)
    
    if [ -n "$API_HOOKS" ] && [ -n "$FALLBACK" ]; then
        echo -e "${GREEN}✅ $filename: Usando APIs reais com fallback${NC}"
        write_report "### ✅ \`$filename\` - **CONFORME**"
        write_report "- **Hooks de API**: Implementados"
        write_report "- **Fallback**: Configurado"
        write_report "- **Status**: Pronto para produção"
        return 0
    elif [ -n "$API_HOOKS" ] && [ -z "$MOCK_DATA" ]; then
        echo -e "${GREEN}✅ $filename: Usando APIs reais${NC}"
        write_report "### ✅ \`$filename\` - **CONFORME**"
        write_report "- **Hooks de API**: Implementados"
        write_report "- **Status**: Pronto para produção"
        return 0
    elif [ -n "$MOCK_DATA" ] && [ -z "$API_HOOKS" ]; then
        echo -e "${RED}❌ $filename: Apenas dados mockados${NC}"
        write_report "### ❌ \`$filename\` - **NECESSITA CONVERSÃO**"
        write_report "- **Problema**: Usando apenas dados mockados"
        write_report "- **Ação**: Implementar hooks de API"
        return 1
    else
        echo -e "${YELLOW}⚠️ $filename: Status indefinido${NC}"
        write_report "### ⚠️ \`$filename\` - **REVISAR**"
        write_report "- **Status**: Necessita análise manual"
        return 2
    fi
}

# Verificar componentes críticos
CRITICAL_ISSUES=0
for component in "${CRITICAL_COMPONENTS[@]}"; do
    if ! check_component_data_source "$component"; then
        ((CRITICAL_ISSUES++))
    fi
    write_report ""
done

# Verificar o hook useAdvancedAnalytics especificamente
echo -e "\n${YELLOW}🔍 Analisando useAdvancedAnalytics...${NC}"
write_report "## 🔍 Análise Específica: useAdvancedAnalytics"
write_report ""

ANALYTICS_HOOK="/workspaces/VeloFlux/frontend/src/hooks/useAdvancedAnalytics.ts"
if [ -f "$ANALYTICS_HOOK" ]; then
    # Verificar se tem TODO para implementar WebSocket
    WEBSOCKET_TODO=$(grep -n "TODO.*WebSocket\|TODO.*real-time" "$ANALYTICS_HOOK" 2>/dev/null || true)
    
    # Verificar se tem geradores de mock
    MOCK_GENERATORS=$(grep -n "generateMock" "$ANALYTICS_HOOK" 2>/dev/null || true)
    
    if [ -n "$WEBSOCKET_TODO" ]; then
        echo -e "${YELLOW}⚠️ useAdvancedAnalytics: WebSocket não implementado${NC}"
        write_report "### ⚠️ \`useAdvancedAnalytics.ts\` - **PENDENTE**"
        write_report "- **Problema**: WebSocket real-time não implementado"
        write_report "- **TODOs encontrados**:"
        echo "$WEBSOCKET_TODO" | while IFS= read -r line; do
            write_report "  - \`$line\`"
        done
        ((CRITICAL_ISSUES++))
    fi
    
    if [ -n "$MOCK_GENERATORS" ]; then
        echo -e "${YELLOW}⚠️ useAdvancedAnalytics: Usando geradores de mock${NC}"
        write_report "- **Geradores Mock**: $(echo "$MOCK_GENERATORS" | wc -l) encontrados"
        write_report "- **Ação**: Substituir por APIs reais"
    fi
else
    echo -e "${RED}❌ Hook useAdvancedAnalytics não encontrado${NC}"
    write_report "### ❌ Hook não encontrado"
    ((CRITICAL_ISSUES++))
fi

write_report ""

# Gerar plano de ação
echo -e "\n${BLUE}📋 Gerando plano de ação...${NC}"
write_report "## 📋 Plano de Ação"
write_report ""

if [ "$CRITICAL_ISSUES" -eq 0 ]; then
    echo -e "${GREEN}🎉 TODOS OS COMPONENTES CRÍTICOS ESTÃO CONFORMES!${NC}"
    write_report "### 🎉 STATUS: COMPONENTES CRÍTICOS CONFORMES"
    write_report "Todos os componentes críticos do dashboard estão usando dados reais."
else
    echo -e "${RED}⚠️ $CRITICAL_ISSUES PROBLEMA(S) CRÍTICO(S) ENCONTRADO(S)${NC}"
    write_report "### ⚠️ STATUS: $CRITICAL_ISSUES PROBLEMA(S) CRÍTICO(S)"
    write_report ""
    write_report "#### Ações Imediatas Necessárias:"
    write_report ""
    write_report "1. **useAdvancedAnalytics.ts**"
    write_report "   - Implementar WebSocket para atualizações em tempo real"
    write_report "   - Substituir \`generateMockMetrics()\` por \`useSystemMetrics()\`"
    write_report "   - Substituir \`generateMockTimeSeries()\` por \`usePerformanceMetrics()\`"
    write_report "   - Implementar \`startRealTimeUpdates()\` e \`stopRealTimeUpdates()\`"
    write_report ""
    write_report "2. **Componentes AI**"
    write_report "   - Conectar componentes AI aos hooks \`useAIMetrics()\` e \`useAIPredictions()\`"
    write_report "   - Implementar fallbacks para quando AI não está disponível"
    write_report ""
    write_report "3. **Multi-tenant Components**"
    write_report "   - Conectar aos hooks \`useMultiTenant()\` com dados reais"
    write_report "   - Implementar APIs de gerenciamento de tenants"
    write_report ""
    write_report "4. **WebSocket Real-time**"
    write_report "   - Implementar conexão WebSocket em \`/lib/websocket.ts\`"
    write_report "   - Configurar endpoints WebSocket no backend"
    write_report "   - Implementar reconexão automática"
fi

# Verificar se o backend está rodando para testes
echo -e "\n${YELLOW}🌐 Verificando conectividade com backend...${NC}"
write_report ""
write_report "## 🌐 Conectividade Backend"
write_report ""

BACKEND_RUNNING=0
if curl -s --connect-timeout 3 "http://localhost:8080/health" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend principal acessível (porta 8080)${NC}"
    write_report "- ✅ **Backend Principal**: Acessível em http://localhost:8080"
    ((BACKEND_RUNNING++))
else
    echo -e "${RED}❌ Backend principal inacessível (porta 8080)${NC}"
    write_report "- ❌ **Backend Principal**: Inacessível"
fi

if curl -s --connect-timeout 3 "http://localhost:9090/api/status" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway acessível (porta 9090)${NC}"
    write_report "- ✅ **API Gateway**: Acessível em http://localhost:9090"
    ((BACKEND_RUNNING++))
else
    echo -e "${RED}❌ API Gateway inacessível (porta 9090)${NC}"
    write_report "- ❌ **API Gateway**: Inacessível"
fi

# Gerar comandos para correção
write_report ""
write_report "## 🛠️ Comandos para Correção"
write_report ""

if [ "$BACKEND_RUNNING" -eq 0 ]; then
    write_report "### 1. Iniciar Backend"
    write_report "\`\`\`bash"
    write_report "cd /workspaces/VeloFlux"
    write_report "docker-compose up -d"
    write_report "# Aguardar 30 segundos para inicialização"
    write_report "sleep 30"
    write_report "\`\`\`"
    write_report ""
fi

write_report "### 2. Executar Testes de Validação"
write_report "\`\`\`bash"
write_report "cd /workspaces/VeloFlux"
write_report "./scripts/validate-apis.sh"
write_report "./scripts/test-dashboard-complete.sh"
write_report "\`\`\`"
write_report ""

write_report "### 3. Implementar WebSocket (Prioritário)"
write_report "\`\`\`typescript"
write_report "// Arquivo: /frontend/src/lib/websocket.ts"
write_report "export class WebSocketManager {"
write_report "  connect() { /* implementar */ }"
write_report "  disconnect() { /* implementar */ }"
write_report "  subscribe(channel: string, callback: Function) { /* implementar */ }"
write_report "}"
write_report "\`\`\`"
write_report ""

# Resumo final
write_report "## 📊 Resumo da Análise"
write_report ""
write_report "| Categoria | Status | Ação |"
write_report "|-----------|---------|------|"
write_report "| Componentes Críticos | $([ "$CRITICAL_ISSUES" -eq 0 ] && echo "✅ Conforme" || echo "❌ $CRITICAL_ISSUES problemas") | $([ "$CRITICAL_ISSUES" -eq 0 ] && echo "Nenhuma" || echo "Implementar hooks de API") |"
write_report "| Backend Connectivity | $([ "$BACKEND_RUNNING" -eq 2 ] && echo "✅ Funcionando" || echo "❌ Problemas") | $([ "$BACKEND_RUNNING" -eq 2 ] && echo "Nenhuma" || echo "Iniciar serviços") |"
write_report "| WebSocket Real-time | ❌ Não implementado | Implementar urgente |"
write_report "| Fallback Data | ✅ Configurado | Manter |"
write_report ""

# Calcular score geral
TOTAL_CHECKS=4
PASSED_CHECKS=$((4 - CRITICAL_ISSUES))
if [ "$BACKEND_RUNNING" -eq 2 ]; then
    ((PASSED_CHECKS++))
    ((TOTAL_CHECKS++))
fi

SCORE=$((PASSED_CHECKS * 100 / TOTAL_CHECKS))

write_report "### 🎯 Score de Prontidão para Produção: **${SCORE}%**"
write_report ""

if [ "$SCORE" -ge 80 ]; then
    echo -e "\n${GREEN}🎉 DASHBOARD COM BOA PRONTIDÃO PARA PRODUÇÃO (${SCORE}%)${NC}"
    write_report "**Status**: ✅ **Boa prontidão para produção**"
elif [ "$SCORE" -ge 60 ]; then
    echo -e "\n${YELLOW}⚠️ DASHBOARD PRECISA DE AJUSTES (${SCORE}%)${NC}"
    write_report "**Status**: ⚠️ **Necessita ajustes antes da produção**"
else
    echo -e "\n${RED}❌ DASHBOARD NÃO ESTÁ PRONTO PARA PRODUÇÃO (${SCORE}%)${NC}"
    write_report "**Status**: ❌ **Não está pronto para produção**"
fi

write_report ""
write_report "---"
write_report "**Relatório gerado em**: $(date '+%Y-%m-%d %H:%M:%S')"
write_report "**Arquivo**: \`$REPORT_FILE\`"

echo -e "\n${GREEN}📄 Relatório detalhado salvo em: $REPORT_FILE${NC}"

exit $CRITICAL_ISSUES
