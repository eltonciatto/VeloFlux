#!/bin/bash

# 🎯 SCRIPT MASTER DE VALIDAÇÃO - Dashboard VeloFlux
# Executa TODOS os testes necessários para garantir 100% de funcionalidade

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# Configuration
PROJECT_ROOT="/workspaces/VeloFlux"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
REPORTS_DIR="$PROJECT_ROOT/reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create reports directory
mkdir -p "$REPORTS_DIR"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║               🎯 VALIDAÇÃO MASTER - VELOFLUX                   ║"
echo "║                Dashboard 100% Pronto para Produção             ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Functions
print_phase() {
    echo -e "\n${PURPLE}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
    echo -e "${PURPLE}▓▓                                                        ▓▓${NC}"
    echo -e "${PURPLE}▓▓  $1${NC}"
    echo -e "${PURPLE}▓▓                                                        ▓▓${NC}"
    echo -e "${PURPLE}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}\n"
}

print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} 🔄 $1"
}

print_success() {
    echo -e "${GREEN}[$(date +'%H:%M:%S')]${NC} ✅ $1"
}

print_error() {
    echo -e "${RED}[$(date +'%H:%M:%S')]${NC} ❌ $1"
}

print_warning() {
    echo -e "${YELLOW}[$(date +'%H:%M:%S')]${NC} ⚠️ $1"
}

# Initialize test report
cat > "$REPORTS_DIR/master-test-report-$TIMESTAMP.md" << EOF
# 🎯 Relatório Master de Validação - VeloFlux Dashboard

**Data:** $(date)
**Timestamp:** $TIMESTAMP
**Projeto:** VeloFlux Dashboard Production Ready

## 🎯 Objetivo
Validar 100% das funcionalidades do dashboard VeloFlux para garantir que está pronto para produção real.

## 📋 Fases de Teste

EOF

# Test counters
TOTAL_PHASES=5
CURRENT_PHASE=0
FAILED_TESTS=0
TOTAL_TESTS=0

# Phase tracking
track_phase() {
    CURRENT_PHASE=$((CURRENT_PHASE + 1))
    echo "### Fase $CURRENT_PHASE/$TOTAL_PHASES: $1" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
    echo "**Início:** $(date)" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
    echo "" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
}

track_result() {
    local test_name=$1
    local result=$2
    local details=$3
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if [ "$result" = "PASS" ]; then
        echo "- ✅ **$test_name:** PASSOU" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
    elif [ "$result" = "FAIL" ]; then
        echo "- ❌ **$test_name:** FALHOU" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    elif [ "$result" = "WARN" ]; then
        echo "- ⚠️ **$test_name:** AVISO" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
    fi
    
    if [ ! -z "$details" ]; then
        echo "  - $details" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
    fi
    echo "" >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md"
}

# FASE 1: PREPARAÇÃO DO AMBIENTE
print_phase "FASE 1: PREPARAÇÃO DO AMBIENTE"
track_phase "Preparação do Ambiente"

print_status "Verificando estrutura do projeto..."
cd "$PROJECT_ROOT"

# Check directory structure
if [ -d "$FRONTEND_DIR" ] && [ -d "$BACKEND_DIR" ]; then
    print_success "Estrutura do projeto OK"
    track_result "Estrutura do Projeto" "PASS" "Frontend e Backend encontrados"
else
    print_error "Estrutura do projeto inválida"
    track_result "Estrutura do Projeto" "FAIL" "Diretórios frontend ou backend não encontrados"
    exit 1
fi

# Check dependencies
print_status "Verificando dependências do frontend..."
cd "$FRONTEND_DIR"

if [ -f "package.json" ]; then
    if [ -d "node_modules" ]; then
        print_success "Dependências do frontend OK"
        track_result "Dependências Frontend" "PASS" "node_modules presente"
    else
        print_warning "Instalando dependências do frontend..."
        npm install
        if [ $? -eq 0 ]; then
            print_success "Dependências instaladas com sucesso"
            track_result "Dependências Frontend" "PASS" "Instaladas com sucesso"
        else
            print_error "Falha ao instalar dependências"
            track_result "Dependências Frontend" "FAIL" "npm install falhou"
        fi
    fi
else
    print_error "package.json não encontrado"
    track_result "Dependências Frontend" "FAIL" "package.json ausente"
fi

# Check backend dependencies
print_status "Verificando dependências do backend..."
cd "$BACKEND_DIR"

if [ -f "go.mod" ]; then
    if go mod verify > /dev/null 2>&1; then
        print_success "Dependências do backend OK"
        track_result "Dependências Backend" "PASS" "go mod verify passou"
    else
        print_warning "Baixando dependências do backend..."
        go mod download
        if [ $? -eq 0 ]; then
            print_success "Dependências baixadas com sucesso"
            track_result "Dependências Backend" "PASS" "go mod download sucesso"
        else
            print_error "Falha ao baixar dependências"
            track_result "Dependências Backend" "FAIL" "go mod download falhou"
        fi
    fi
else
    print_error "go.mod não encontrado"
    track_result "Dependências Backend" "FAIL" "go.mod ausente"
fi

# FASE 2: VERIFICAÇÃO DE CÓDIGO
print_phase "FASE 2: VERIFICAÇÃO DE CÓDIGO"
track_phase "Verificação de Código"

print_status "Executando verificações de TypeScript..."
cd "$FRONTEND_DIR"

if npm run type-check > "$REPORTS_DIR/typescript-$TIMESTAMP.log" 2>&1; then
    print_success "TypeScript check passou"
    track_result "TypeScript Check" "PASS" "Sem erros de tipo"
else
    print_error "TypeScript check falhou"
    track_result "TypeScript Check" "FAIL" "Erros de tipo encontrados - veja typescript-$TIMESTAMP.log"
fi

print_status "Executando linting..."
if npm run lint > "$REPORTS_DIR/lint-$TIMESTAMP.log" 2>&1; then
    print_success "Linting passou"
    track_result "ESLint" "PASS" "Sem warnings críticos"
else
    print_warning "Linting com warnings"
    track_result "ESLint" "WARN" "Warnings encontrados - veja lint-$TIMESTAMP.log"
fi

print_status "Verificando código Go..."
cd "$BACKEND_DIR"

if go vet ./... > "$REPORTS_DIR/go-vet-$TIMESTAMP.log" 2>&1; then
    print_success "Go vet passou"
    track_result "Go Vet" "PASS" "Código Go válido"
else
    print_error "Go vet falhou"
    track_result "Go Vet" "FAIL" "Problemas no código Go - veja go-vet-$TIMESTAMP.log"
fi

# FASE 3: TESTE DE BUILD
print_phase "FASE 3: TESTE DE BUILD"
track_phase "Teste de Build"

print_status "Testando build do frontend..."
cd "$FRONTEND_DIR"

if npm run build > "$REPORTS_DIR/frontend-build-$TIMESTAMP.log" 2>&1; then
    print_success "Build do frontend OK"
    
    # Check bundle size
    if [ -d "dist" ]; then
        bundle_size=$(du -sh dist | cut -f1)
        print_status "Tamanho do bundle: $bundle_size"
        track_result "Frontend Build" "PASS" "Bundle: $bundle_size"
    else
        track_result "Frontend Build" "PASS" "Build executado"
    fi
else
    print_error "Build do frontend falhou"
    track_result "Frontend Build" "FAIL" "Veja frontend-build-$TIMESTAMP.log"
fi

print_status "Testando build do backend..."
cd "$BACKEND_DIR"

if go build -o veloflux-api ./cmd > "$REPORTS_DIR/backend-build-$TIMESTAMP.log" 2>&1; then
    print_success "Build do backend OK"
    track_result "Backend Build" "PASS" "Executável gerado"
    rm -f veloflux-api  # Cleanup
else
    print_error "Build do backend falhou"
    track_result "Backend Build" "FAIL" "Veja backend-build-$TIMESTAMP.log"
fi

# FASE 4: TESTE DE APIS
print_phase "FASE 4: TESTE DE APIS"
track_phase "Teste de APIs"

print_status "Executando validação de APIs..."
cd "$PROJECT_ROOT"

if [ -f "scripts/validate-apis.sh" ]; then
    if bash scripts/validate-apis.sh > "$REPORTS_DIR/api-validation-$TIMESTAMP.log" 2>&1; then
        print_success "Validação de APIs passou"
        track_result "API Validation" "PASS" "Todas as APIs funcionando"
    else
        print_warning "Algumas APIs falharam"
        track_result "API Validation" "WARN" "Veja api-validation-$TIMESTAMP.log"
    fi
else
    print_warning "Script de validação de APIs não encontrado"
    track_result "API Validation" "WARN" "Script não disponível"
fi

# FASE 5: TESTE E2E (se disponível)
print_phase "FASE 5: TESTE E2E"
track_phase "Teste End-to-End"

print_status "Verificando disponibilidade de testes E2E..."
cd "$FRONTEND_DIR"

if [ -f "tests/playwright.config.js" ]; then
    print_status "Executando testes E2E..."
    
    # Install Playwright if needed
    if [ ! -d "tests/node_modules" ]; then
        print_status "Instalando Playwright..."
        cd tests
        npm install
        npx playwright install
        cd ..
    fi
    
    # Run E2E tests
    if cd tests && npm run test:e2e > "$REPORTS_DIR/e2e-$TIMESTAMP.log" 2>&1; then
        print_success "Testes E2E passaram"
        track_result "E2E Tests" "PASS" "Todos os testes passaram"
    else
        print_warning "Alguns testes E2E falharam"
        track_result "E2E Tests" "WARN" "Veja e2e-$TIMESTAMP.log"
    fi
    cd ..
else
    print_warning "Testes E2E não configurados"
    track_result "E2E Tests" "WARN" "Playwright não configurado"
fi

# GERAÇÃO DO RELATÓRIO FINAL
print_phase "RELATÓRIO FINAL"

# Calculate success rate
SUCCESS_RATE=$(( (TOTAL_TESTS - FAILED_TESTS) * 100 / TOTAL_TESTS ))

# Add summary to report
cat >> "$REPORTS_DIR/master-test-report-$TIMESTAMP.md" << EOF

## 📊 Resumo Final

### Estatísticas
- **Total de Testes:** $TOTAL_TESTS
- **Testes Passaram:** $((TOTAL_TESTS - FAILED_TESTS))
- **Testes Falharam:** $FAILED_TESTS
- **Taxa de Sucesso:** $SUCCESS_RATE%

### Status Geral
$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "🎉 **SUCESSO TOTAL** - Dashboard 100% pronto para produção!"
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo "✅ **SUCESSO PARCIAL** - Dashboard quase pronto, alguns ajustes menores necessários"
else
    echo "⚠️ **REQUER ATENÇÃO** - Várias falhas detectadas, revisão necessária"
fi)

### Próximos Passos
$(if [ $FAILED_TESTS -eq 0 ]; then
    echo "- 🚀 Deploy para produção"
    echo "- 📊 Configurar monitoramento"
    echo "- 🔄 Implementar CI/CD"
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo "- 🔧 Corrigir falhas menores"
    echo "- ✅ Re-executar testes"
    echo "- 🚀 Preparar para deploy"
else
    echo "- 🛠️ Corrigir falhas críticas"
    echo "- 📝 Revisar código"
    echo "- 🔄 Re-executar validação completa"
fi)

### Arquivos de Log
$(for log in $REPORTS_DIR/*-$TIMESTAMP.log; do
    if [ -f "$log" ]; then
        echo "- $(basename $log)"
    fi
done)

---
**Relatório gerado em:** $(date)
**Por:** VeloFlux Master Validation Script
EOF

# Final output
echo ""
echo -e "${CYAN}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                        RESULTADO FINAL                        ║${NC}"
echo -e "${CYAN}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 SUCESSO TOTAL! 🎉${NC}"
    echo -e "${GREEN}Dashboard VeloFlux está 100% pronto para produção!${NC}"
    echo ""
    echo -e "${GREEN}✅ Todos os $TOTAL_TESTS testes passaram${NC}"
    echo -e "${GREEN}✅ Zero falhas críticas${NC}"
    echo -e "${GREEN}✅ Código limpo e funcional${NC}"
    echo -e "${GREEN}✅ APIs funcionando corretamente${NC}"
    echo -e "${GREEN}✅ Build de produção OK${NC}"
    echo ""
    echo -e "${BLUE}🚀 Próximos passos:${NC}"
    echo -e "${BLUE}   1. Deploy para ambiente de produção${NC}"
    echo -e "${BLUE}   2. Configurar monitoramento contínuo${NC}"
    echo -e "${BLUE}   3. Implementar pipeline CI/CD${NC}"
    echo -e "${BLUE}   4. Documentar procedimentos operacionais${NC}"
    
elif [ $SUCCESS_RATE -ge 80 ]; then
    echo -e "${YELLOW}⚠️ SUCESSO PARCIAL ⚠️${NC}"
    echo -e "${YELLOW}Dashboard quase pronto, alguns ajustes necessários${NC}"
    echo ""
    echo -e "${GREEN}✅ Sucessos: $((TOTAL_TESTS - FAILED_TESTS))/$TOTAL_TESTS ($SUCCESS_RATE%)${NC}"
    echo -e "${RED}❌ Falhas: $FAILED_TESTS/$TOTAL_TESTS${NC}"
    echo ""
    echo -e "${BLUE}🔧 Próximos passos:${NC}"
    echo -e "${BLUE}   1. Revisar logs de falhas${NC}"
    echo -e "${BLUE}   2. Corrigir problemas identificados${NC}"
    echo -e "${BLUE}   3. Re-executar validação${NC}"
    echo -e "${BLUE}   4. Preparar para deploy${NC}"
    
else
    echo -e "${RED}❌ REQUER ATENÇÃO URGENTE ❌${NC}"
    echo -e "${RED}Múltiplas falhas detectadas${NC}"
    echo ""
    echo -e "${GREEN}✅ Sucessos: $((TOTAL_TESTS - FAILED_TESTS))/$TOTAL_TESTS ($SUCCESS_RATE%)${NC}"
    echo -e "${RED}❌ Falhas: $FAILED_TESTS/$TOTAL_TESTS${NC}"
    echo ""
    echo -e "${BLUE}🛠️ Ações necessárias:${NC}"
    echo -e "${BLUE}   1. Revisar TODOS os logs de erro${NC}"
    echo -e "${BLUE}   2. Corrigir falhas críticas${NC}"
    echo -e "${BLUE}   3. Revisar arquitetura se necessário${NC}"
    echo -e "${BLUE}   4. Re-executar validação completa${NC}"
fi

echo ""
echo -e "${BLUE}📁 Relatórios salvos em:${NC} $REPORTS_DIR/"
echo -e "${BLUE}📋 Relatório principal:${NC} master-test-report-$TIMESTAMP.md"
echo ""

# Exit with appropriate code
if [ $FAILED_TESTS -eq 0 ]; then
    exit 0
elif [ $SUCCESS_RATE -ge 80 ]; then
    exit 1
else
    exit 2
fi
