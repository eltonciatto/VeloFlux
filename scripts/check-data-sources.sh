#!/bin/bash

# Script para verificar se o dashboard está usando dados reais ou mockados
# Author: VeloFlux Team
# Date: $(date +%Y-%m-%d)

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "🔍 VERIFICAÇÃO: Dashboard VeloFlux - Dados Reais vs Mock"
echo "============================================================"

REPORT_FILE="/workspaces/VeloFlux/reports/data-sources-analysis-$(date +%Y%m%d-%H%M%S).md"
mkdir -p /workspaces/VeloFlux/reports

# Função para escrever no relatório
write_report() {
    echo "$1" | tee -a "$REPORT_FILE"
}

write_report "# 📊 ANÁLISE DE FONTES DE DADOS - Dashboard VeloFlux"
write_report "## Data: $(date '+%Y-%m-%d %H:%M:%S')"
write_report ""

echo -e "${BLUE}📋 Analisando arquivos TypeScript/React...${NC}"

# 1. Verificar uso de dados mockados
echo -e "\n${YELLOW}1. VERIFICANDO DADOS MOCKADOS...${NC}"
write_report "## 🎭 Análise de Dados Mockados"
write_report ""

MOCK_FILES=$(find /workspaces/VeloFlux/frontend/src -name "*.ts" -o -name "*.tsx" | xargs grep -l "mock\|Mock\|MOCK" 2>/dev/null || true)

if [ -n "$MOCK_FILES" ]; then
    write_report "### ⚠️ Arquivos com Dados Mockados Detectados:"
    echo -e "${RED}❌ Encontrados arquivos com dados mockados:${NC}"
    
    for file in $MOCK_FILES; do
        echo "   - $file"
        write_report "- \`$file\`"
        
        # Verificar o conteúdo específico
        MOCK_LINES=$(grep -n "mock\|Mock\|MOCK" "$file" 2>/dev/null | head -3)
        if [ -n "$MOCK_LINES" ]; then
            write_report "  - Linhas com mock:"
            echo "$MOCK_LINES" | while IFS= read -r line; do
                write_report "    - \`$line\`"
            done
        fi
        write_report ""
    done
else
    echo -e "${GREEN}✅ Nenhum arquivo com dados mockados encontrado${NC}"
    write_report "### ✅ Nenhum arquivo com dados mockados encontrado"
fi

write_report ""

# 2. Verificar hooks de API reais
echo -e "\n${YELLOW}2. VERIFICANDO HOOKS DE API REAIS...${NC}"
write_report "## 🔗 Análise de Hooks de API"
write_report ""

API_HOOKS=$(find /workspaces/VeloFlux/frontend/src/hooks -name "*.ts" | xargs grep -l "apiFetch\|useQuery\|useMutation" 2>/dev/null || true)

if [ -n "$API_HOOKS" ]; then
    echo -e "${GREEN}✅ Hooks de API encontrados:${NC}"
    write_report "### ✅ Hooks de API Identificados:"
    
    for hook in $API_HOOKS; do
        echo "   - $hook"
        write_report "- \`$hook\`"
        
        # Verificar endpoints
        ENDPOINTS=$(grep -n "apiFetch\|queryFn.*=>" "$hook" 2>/dev/null | head -3)
        if [ -n "$ENDPOINTS" ]; then
            write_report "  - Endpoints:"
            echo "$ENDPOINTS" | while IFS= read -r line; do
                write_report "    - \`$line\`"
            done
        fi
        write_report ""
    done
else
    echo -e "${RED}❌ Nenhum hook de API encontrado${NC}"
    write_report "### ❌ Nenhum hook de API encontrado"
fi

write_report ""

# 3. Verificar configuração de ambiente
echo -e "\n${YELLOW}3. VERIFICANDO CONFIGURAÇÃO DE AMBIENTE...${NC}"
write_report "## ⚙️ Configuração de Ambiente"
write_report ""

ENV_FILE="/workspaces/VeloFlux/frontend/src/config/environment.ts"
if [ -f "$ENV_FILE" ]; then
    echo -e "${GREEN}✅ Arquivo de configuração encontrado${NC}"
    write_report "### ✅ Arquivo de Configuração: \`$ENV_FILE\`"
    
    # Verificar modo demo
    DEMO_MODE=$(grep -n "DEMO_MODE\|isDemoMode\|demo.*mode" "$ENV_FILE" 2>/dev/null)
    if [ -n "$DEMO_MODE" ]; then
        write_report "#### Configuração de Modo Demo:"
        echo "$DEMO_MODE" | while IFS= read -r line; do
            write_report "- \`$line\`"
        done
    fi
    
    # Verificar endpoints de produção
    PROD_ENDPOINTS=$(grep -n "PRODUCTION\|API_URL\|endpoints" "$ENV_FILE" 2>/dev/null)
    if [ -n "$PROD_ENDPOINTS" ]; then
        write_report "#### Endpoints de Produção:"
        echo "$PROD_ENDPOINTS" | while IFS= read -r line; do
            write_report "- \`$line\`"
        done
    fi
else
    echo -e "${RED}❌ Arquivo de configuração não encontrado${NC}"
    write_report "### ❌ Arquivo de configuração não encontrado"
fi

write_report ""

# 4. Verificar componentes principais
echo -e "\n${YELLOW}4. VERIFICANDO COMPONENTES PRINCIPAIS...${NC}"
write_report "## 🧩 Análise de Componentes Principais"
write_report ""

MAIN_COMPONENTS=(
    "/workspaces/VeloFlux/frontend/src/components/dashboard/BackendOverview.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/MetricsView.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/PredictiveAnalytics.tsx"
    "/workspaces/VeloFlux/frontend/src/components/ai/AnomalyDetection.tsx"
)

for component in "${MAIN_COMPONENTS[@]}"; do
    filename=$(basename "$component")
    if [ -f "$component" ]; then
        echo -e "${GREEN}✅ Analisando: $filename${NC}"
        write_report "### 📄 \`$filename\`"
        
        # Verificar se usa hooks de API reais
        API_USAGE=$(grep -n "useSystemMetrics\|useBackends\|useRealTimeMetrics\|usePerformanceMetrics" "$component" 2>/dev/null)
        if [ -n "$API_USAGE" ]; then
            write_report "#### ✅ Usando Hooks de API Reais:"
            echo "$API_USAGE" | while IFS= read -r line; do
                write_report "- \`$line\`"
            done
        fi
        
        # Verificar fallback para dados demo
        FALLBACK_DATA=$(grep -n "fallback\|demo.*data\|mock.*data\|\[\s*{.*time.*value" "$component" 2>/dev/null)
        if [ -n "$FALLBACK_DATA" ]; then
            write_report "#### ⚠️ Dados de Fallback/Demo:"
            echo "$FALLBACK_DATA" | while IFS= read -r line; do
                write_report "- \`$line\`"
            done
        fi
        
        write_report ""
    else
        echo -e "${RED}❌ Componente não encontrado: $filename${NC}"
        write_report "### ❌ Componente não encontrado: \`$filename\`"
        write_report ""
    fi
done

# 5. Verificar se o backend está rodando
echo -e "\n${YELLOW}5. VERIFICANDO CONECTIVIDADE COM BACKEND...${NC}"
write_report "## 🌐 Conectividade com Backend"
write_report ""

BACKEND_ENDPOINTS=(
    "http://localhost:8080/health"
    "http://localhost:9090/api/status"
    "http://localhost:9000/admin/api/health"
)

for endpoint in "${BACKEND_ENDPOINTS[@]}"; do
    echo "Testando: $endpoint"
    
    if curl -s --connect-timeout 3 "$endpoint" > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend acessível: $endpoint${NC}"
        write_report "- ✅ **Acessível**: \`$endpoint\`"
    else
        echo -e "${RED}❌ Backend inacessível: $endpoint${NC}"
        write_report "- ❌ **Inacessível**: \`$endpoint\`"
    fi
done

write_report ""

# 6. Gerar recomendações
echo -e "\n${YELLOW}6. GERANDO RECOMENDAÇÕES...${NC}"
write_report "## 🎯 Recomendações"
write_report ""

# Contar problemas encontrados
MOCK_COUNT=$(echo "$MOCK_FILES" | wc -w)
API_COUNT=$(echo "$API_HOOKS" | wc -w)

if [ "$MOCK_COUNT" -gt 0 ]; then
    echo -e "${RED}⚠️ AÇÃO NECESSÁRIA: Encontrados $MOCK_COUNT arquivo(s) com dados mockados${NC}"
    write_report "### ⚠️ ALTA PRIORIDADE"
    write_report "- **$MOCK_COUNT arquivo(s) com dados mockados** precisam ser convertidos para usar APIs reais"
    write_report "- Substituir \`generateMockData()\` por hooks de API reais"
    write_report "- Implementar fallbacks adequados para quando APIs não estão disponíveis"
    write_report ""
fi

if [ "$API_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✅ POSITIVO: Encontrados $API_COUNT hook(s) de API implementados${NC}"
    write_report "### ✅ PONTOS POSITIVOS"
    write_report "- **$API_COUNT hook(s) de API** já implementados corretamente"
    write_report "- Estrutura de hooks seguindo padrões React Query"
    write_report ""
fi

write_report "### 📋 PRÓXIMOS PASSOS"
write_report "1. **Converter dados mockados**: Substituir todos os \`mock\` por chamadas de API reais"
write_report "2. **Verificar endpoints**: Garantir que todos os endpoints do backend estão funcionando"
write_report "3. **Implementar error handling**: Adicionar tratamento robusto de erros"
write_report "4. **Configurar WebSockets**: Implementar atualizações em tempo real"
write_report "5. **Testes E2E**: Executar testes end-to-end com dados reais"

# 7. Resumo final
echo -e "\n${BLUE}📊 RESUMO DA ANÁLISE:${NC}"
echo -e "   Arquivos com mock: ${MOCK_COUNT}"
echo -e "   Hooks de API: ${API_COUNT}"

write_report ""
write_report "---"
write_report "**Análise gerada em**: $(date '+%Y-%m-%d %H:%M:%S')"
write_report "**Relatório salvo em**: \`$REPORT_FILE\`"

echo -e "\n${GREEN}📄 Relatório completo salvo em: $REPORT_FILE${NC}"

# 8. Verificar status do dashboard
if [ "$MOCK_COUNT" -eq 0 ] && [ "$API_COUNT" -gt 3 ]; then
    echo -e "\n${GREEN}🎉 DASHBOARD PRONTO PARA PRODUÇÃO!${NC}"
    write_report ""
    write_report "## 🎉 STATUS: PRONTO PARA PRODUÇÃO"
    write_report "O dashboard está usando dados reais e está pronto para produção."
    exit 0
else
    echo -e "\n${YELLOW}⚠️ DASHBOARD PRECISA DE AJUSTES${NC}"
    write_report ""
    write_report "## ⚠️ STATUS: NECESSITA AJUSTES"
    write_report "O dashboard ainda tem componentes usando dados mockados que precisam ser corrigidos."
    exit 1
fi
