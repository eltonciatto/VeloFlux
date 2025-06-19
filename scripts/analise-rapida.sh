#!/bin/bash

# 🎯 ANÁLISE RÁPIDA: Componentes Dashboard VeloFlux
set -e

# Cores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear
echo -e "${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║          🎯 ANÁLISE RÁPIDA - Componentes Dashboard                ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

DASHBOARD_DIR="/workspaces/VeloFlux/frontend/src/components/dashboard"
REPORT_FILE="/workspaces/VeloFlux/reports/ANALISE_COMPONENTES_$(date +%Y%m%d-%H%M%S).md"

mkdir -p /workspaces/VeloFlux/reports

echo "# 🎯 Análise Componentes Dashboard VeloFlux" > "$REPORT_FILE"
echo "## Data: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Recursos alvo identificados
declare -A RECURSOS_MAPA=(
    ["Visão Geral"]="BackendOverview.tsx|ProductionDashboard.tsx|AdvancedAnalytics.tsx"
    ["Insights de IA"]="AIInsights.tsx|AIMetricsDashboard.tsx|AdvancedAnalytics.tsx"
    ["Métricas de IA"]="AIMetricsDashboard.tsx|ModelPerformance.tsx|PredictiveAnalytics.tsx"
    ["Predições"]="PredictiveAnalytics.tsx|ForecastingDashboard.tsx"
    ["Modelos"]="ModelPerformance.tsx|AIConfiguration.tsx"
    ["Monitor de Saúde"]="HealthMonitor.tsx|ClusterStatus.tsx|SystemStatus.tsx"
    ["Métricas"]="MetricsView.tsx|MetricWidget.tsx|AdvancedAnalytics.tsx"
    ["Cluster"]="ClusterStatus.tsx|InfrastructureView.tsx"
    ["Backends"]="BackendManager.tsx|BackendOverview.tsx"
    ["Segurança"]="SecuritySettings.tsx|WAFConfig.tsx|OIDCSettings.tsx"
    ["Billing"]="BillingPanel.tsx|UsageMetrics.tsx"
    ["Limitação de Taxa"]="RateLimitConfig.tsx"
    ["Configuração de IA"]="AIConfiguration.tsx|OrchestrationSettings.tsx"
    ["Configuração"]="ConfigManager.tsx|SMTPSettings.tsx|GlobalSettings.tsx"
)

echo -e "${BLUE}🔍 Analisando componentes existentes...${NC}"

# Listar todos os componentes existentes
COMPONENTES_EXISTENTES=($(find "$DASHBOARD_DIR" -name "*.tsx" -exec basename {} \; | sort))
TOTAL_EXISTENTES=${#COMPONENTES_EXISTENTES[@]}

echo -e "\n${CYAN}📋 COMPONENTES ENCONTRADOS ($TOTAL_EXISTENTES):${NC}"
echo "## 📋 Componentes Encontrados ($TOTAL_EXISTENTES)" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

for comp in "${COMPONENTES_EXISTENTES[@]}"; do
    echo -e "   ✅ $comp"
    echo "- ✅ **$comp**" >> "$REPORT_FILE"
done

echo "" >> "$REPORT_FILE"

# Analisar cobertura por recurso
echo -e "\n${PURPLE}🎯 ANÁLISE DE COBERTURA POR RECURSO:${NC}"
echo "## 🎯 Análise de Cobertura por Recurso" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

RECURSOS_COBERTOS=0
TOTAL_RECURSOS=${#RECURSOS_MAPA[@]}

for recurso in "${!RECURSOS_MAPA[@]}"; do
    componentes_necessarios="${RECURSOS_MAPA[$recurso]}"
    IFS='|' read -ra COMPS <<< "$componentes_necessarios"
    
    encontrados=0
    componentes_encontrados=""
    
    for comp_necessario in "${COMPS[@]}"; do
        for comp_existente in "${COMPONENTES_EXISTENTES[@]}"; do
            if [[ "$comp_existente" == "$comp_necessario" ]]; then
                encontrados=$((encontrados + 1))
                if [[ -n "$componentes_encontrados" ]]; then
                    componentes_encontrados="$componentes_encontrados, $comp_necessario"
                else
                    componentes_encontrados="$comp_necessario"
                fi
                break
            fi
        done
    done
    
    if [[ $encontrados -gt 0 ]]; then
        echo -e "${GREEN}✅ $recurso${NC} ($encontrados componente(s))"
        echo "- ✅ **$recurso**: $componentes_encontrados" >> "$REPORT_FILE"
        RECURSOS_COBERTOS=$((RECURSOS_COBERTOS + 1))
    else
        echo -e "${YELLOW}⚠️ $recurso${NC} (nenhum componente encontrado)"
        echo "- ⚠️ **$recurso**: Nenhum componente encontrado" >> "$REPORT_FILE"
    fi
done

PERCENTUAL_COBERTURA=$((RECURSOS_COBERTOS * 100 / TOTAL_RECURSOS))

echo -e "\n${CYAN}📊 RESUMO DA ANÁLISE:${NC}"
echo -e "   Componentes totais: $TOTAL_EXISTENTES"
echo -e "   Recursos cobertos: $RECURSOS_COBERTOS de $TOTAL_RECURSOS"
echo -e "   Cobertura: $PERCENTUAL_COBERTURA%"

echo "" >> "$REPORT_FILE"
echo "## 📊 Resumo da Análise" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Métrica | Valor | Status |" >> "$REPORT_FILE"
echo "|---------|-------|---------|" >> "$REPORT_FILE"
echo "| **Componentes totais** | $TOTAL_EXISTENTES | ✅ Excelente |" >> "$REPORT_FILE"
echo "| **Recursos cobertos** | $RECURSOS_COBERTOS/$TOTAL_RECURSOS | $([ "$RECURSOS_COBERTOS" -ge 12 ] && echo "✅ Excelente" || [ "$RECURSOS_COBERTOS" -ge 10 ] && echo "✅ Bom" || echo "⚠️ Precisa melhorar") |" >> "$REPORT_FILE"
echo "| **Cobertura** | $PERCENTUAL_COBERTURA% | $([ "$PERCENTUAL_COBERTURA" -ge 85 ] && echo "🎉 **EXCELENTE**" || [ "$PERCENTUAL_COBERTURA" -ge 70 ] && echo "✅ **BOM**" || echo "⚠️ **PRECISA MELHORAR**") |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Verificar APIs rapidamente
echo -e "\n${BLUE}🌐 Verificando infraestrutura...${NC}"
APIS_OK=0

if docker-compose ps | grep -q "Up"; then
    echo -e "${GREEN}✅ Docker Compose ativo${NC}"
    APIS_OK=$((APIS_OK + 1))
fi

if curl -s --connect-timeout 2 http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend principal (8080)${NC}"
    APIS_OK=$((APIS_OK + 1))
fi

if curl -s --connect-timeout 2 http://localhost:9090/api/status > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway (9090)${NC}"
    APIS_OK=$((APIS_OK + 1))
fi

if [[ $APIS_OK -eq 0 ]]; then
    echo -e "${YELLOW}⚠️ Nenhuma API respondendo${NC}"
elif [[ $APIS_OK -le 2 ]]; then
    echo -e "${YELLOW}⚠️ Algumas APIs respondendo ($APIS_OK)${NC}"
else
    echo -e "${GREEN}✅ Infraestrutura OK ($APIS_OK APIs)${NC}"
fi

# Score final
SCORE_COMPONENTES=$PERCENTUAL_COBERTURA
SCORE_INFRAESTRUTURA=$((APIS_OK * 30))
SCORE_FINAL=$(((SCORE_COMPONENTES + SCORE_INFRAESTRUTURA) / 2))

echo -e "\n${PURPLE}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${PURPLE}║                        📊 SCORE FINAL                            ║${NC}"
echo -e "${PURPLE}╚══════════════════════════════════════════════════════════════════╝${NC}"

echo -e "\n${CYAN}📊 SCORE DETALHADO:${NC}"
echo -e "   Componentes: $SCORE_COMPONENTES/100"
echo -e "   Infraestrutura: $SCORE_INFRAESTRUTURA/100"
echo -e "   SCORE FINAL: $SCORE_FINAL/100"

echo "" >> "$REPORT_FILE"
echo "## 📊 Score Final" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "| Categoria | Score | Status |" >> "$REPORT_FILE"
echo "|-----------|-------|---------|" >> "$REPORT_FILE"
echo "| **Componentes** | $SCORE_COMPONENTES/100 | $([ "$SCORE_COMPONENTES" -ge 85 ] && echo "🎉 Excelente" || echo "✅ Bom") |" >> "$REPORT_FILE"
echo "| **Infraestrutura** | $SCORE_INFRAESTRUTURA/100 | $([ "$SCORE_INFRAESTRUTURA" -ge 75 ] && echo "✅ Boa" || echo "⚠️ Precisa melhorar") |" >> "$REPORT_FILE"
echo "| **FINAL** | **$SCORE_FINAL/100** | $([ "$SCORE_FINAL" -ge 85 ] && echo "🎉 **EXCELENTE**" || [ "$SCORE_FINAL" -ge 70 ] && echo "✅ **BOM**" || echo "⚠️ **PRECISA MELHORAR**") |" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Recomendações baseadas no score
if [[ $SCORE_FINAL -ge 85 ]]; then
    echo -e "\n${GREEN}🎉 DASHBOARD EXCELENTE - PRONTO PARA APRIMORAMENTOS AVANÇADOS!${NC}"
    echo "### 🎉 **STATUS: EXCELENTE**" >> "$REPORT_FILE"
    echo "Dashboard com cobertura excelente. Foque em:" >> "$REPORT_FILE"
    echo "- Integração de dados reais" >> "$REPORT_FILE"
    echo "- Funcionalidades avançadas" >> "$REPORT_FILE"
    echo "- Otimizações de performance" >> "$REPORT_FILE"
    echo "- Testes de produção" >> "$REPORT_FILE"
    
elif [[ $SCORE_FINAL -ge 70 ]]; then
    echo -e "\n${YELLOW}✅ DASHBOARD BOM - IMPLEMENTAR MELHORIAS PONTUAIS${NC}"
    echo "### ✅ **STATUS: BOM**" >> "$REPORT_FILE"
    echo "Dashboard funcional. Implemente melhorias em:" >> "$REPORT_FILE"
    echo "- Recursos com menor cobertura" >> "$REPORT_FILE"
    echo "- Infraestrutura backend" >> "$REPORT_FILE"
    echo "- Integração de APIs" >> "$REPORT_FILE"
    
else
    echo -e "\n${YELLOW}⚠️ DASHBOARD PRECISA DE MELHORIAS${NC}"
    echo "### ⚠️ **STATUS: PRECISA MELHORIAS**" >> "$REPORT_FILE"
    echo "Foque primeiro em:" >> "$REPORT_FILE"
    echo "- Configurar infraestrutura backend" >> "$REPORT_FILE"
    echo "- Implementar recursos faltantes" >> "$REPORT_FILE"
    echo "- Conectar APIs reais" >> "$REPORT_FILE"
fi

echo "" >> "$REPORT_FILE"
echo "---" >> "$REPORT_FILE"
echo "**Relatório gerado em**: $(date '+%Y-%m-%d %H:%M:%S')" >> "$REPORT_FILE"

echo -e "\n${GREEN}📄 Relatório salvo em:${NC}"
echo -e "   $REPORT_FILE"

echo -e "\n${BLUE}🚀 Próximos comandos sugeridos:${NC}"
if [[ $SCORE_INFRAESTRUTURA -lt 60 ]]; then
    echo -e "   ${YELLOW}1. docker-compose up -d    # Iniciar backend${NC}"
fi

echo -e "   ${GREEN}2. cd frontend && npm run dev    # Iniciar frontend${NC}"
echo -e "   ${GREEN}3. ./scripts/master-validation.sh    # Validação completa${NC}"

exit 0
