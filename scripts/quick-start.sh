#!/bin/bash

# 🎯 QUICK START - Dashboard VeloFlux 100% Funcional
# Execute este script para validar TUDO de forma rápida

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

clear

echo -e "${CYAN}"
echo "  ┌─────────────────────────────────────────────────────────────────┐"
echo "  │                                                                 │"
echo "  │               🎯 QUICK START - VELOFLUX DASHBOARD               │"
echo "  │                    Validação 100% Funcional                    │"
echo "  │                                                                 │"
echo "  └─────────────────────────────────────────────────────────────────┘"
echo -e "${NC}"

echo -e "${BLUE}Este script vai validar se o dashboard VeloFlux está 100% funcional${NC}"
echo -e "${BLUE}Duração estimada: 5-10 minutos${NC}"
echo ""

# Ask for confirmation
read -p "Deseja continuar? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Cancelado pelo usuário."
    exit 0
fi

# Check if we're in the right directory
if [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    echo -e "${RED}❌ Erro: Execute este script a partir do diretório raiz do projeto VeloFlux${NC}"
    echo -e "${YELLOW}Exemplo: cd /workspaces/VeloFlux && ./scripts/quick-start.sh${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Diretório correto encontrado${NC}"

# Step 1: Check prerequisites
echo ""
echo -e "${YELLOW}📋 Verificando pré-requisitos...${NC}"

# Check Node.js
if command -v node > /dev/null 2>&1; then
    node_version=$(node --version)
    echo -e "${GREEN}✅ Node.js: $node_version${NC}"
else
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
fi

# Check Go
if command -v go > /dev/null 2>&1; then
    go_version=$(go version | cut -d' ' -f3)
    echo -e "${GREEN}✅ Go: $go_version${NC}"
else
    echo -e "${RED}❌ Go não encontrado${NC}"
    exit 1
fi

# Check npm
if command -v npm > /dev/null 2>&1; then
    npm_version=$(npm --version)
    echo -e "${GREEN}✅ npm: v$npm_version${NC}"
else
    echo -e "${RED}❌ npm não encontrado${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo ""
echo -e "${YELLOW}📦 Instalando dependências...${NC}"

echo -e "${BLUE}Frontend...${NC}"
cd frontend
if [ ! -d "node_modules" ]; then
    npm install --silent
    echo -e "${GREEN}✅ Dependências do frontend instaladas${NC}"
else
    echo -e "${GREEN}✅ Dependências do frontend já instaladas${NC}"
fi
cd ..

echo -e "${BLUE}Backend...${NC}"
cd backend
go mod download > /dev/null 2>&1
echo -e "${GREEN}✅ Dependências do backend instaladas${NC}"
cd ..

# Step 3: Check if services are running
echo ""
echo -e "${YELLOW}🔍 Verificando serviços...${NC}"

frontend_running=false
backend_running=false

if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend rodando em http://localhost:3000${NC}"
    frontend_running=true
else
    echo -e "${YELLOW}⚠️ Frontend não está rodando${NC}"
fi

if curl -s http://localhost:8080/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend rodando em http://localhost:8080${NC}"
    backend_running=true
else
    echo -e "${YELLOW}⚠️ Backend não está rodando${NC}"
fi

# Prompt to start services if needed
if [ "$frontend_running" = false ] || [ "$backend_running" = false ]; then
    echo ""
    echo -e "${YELLOW}🚀 Alguns serviços não estão rodando. Você precisa iniciá-los:${NC}"
    echo ""
    
    if [ "$backend_running" = false ]; then
        echo -e "${BLUE}Terminal 1 - Backend:${NC}"
        echo "cd backend && go run cmd/main.go"
        echo ""
    fi
    
    if [ "$frontend_running" = false ]; then
        echo -e "${BLUE}Terminal 2 - Frontend:${NC}"
        echo "cd frontend && npm run dev"
        echo ""
    fi
    
    echo -e "${YELLOW}Após iniciar os serviços, pressione Enter para continuar...${NC}"
    read -r
    
    # Check again
    echo -e "${BLUE}Verificando novamente...${NC}"
    
    if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
        echo -e "${RED}❌ Frontend ainda não está respondendo${NC}"
        exit 1
    fi
    
    if ! curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "${RED}❌ Backend ainda não está respondendo${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Ambos os serviços estão rodando agora!${NC}"
fi

# Step 4: Run master validation
echo ""
echo -e "${YELLOW}🎯 Executando validação completa...${NC}"
echo ""

if [ -f "scripts/master-validation.sh" ]; then
    # Make sure it's executable
    chmod +x scripts/master-validation.sh
    
    # Run the master validation
    ./scripts/master-validation.sh
    
    validation_result=$?
    
    echo ""
    echo -e "${PURPLE}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
    echo -e "${PURPLE}▓▓                    RESULTADO FINAL                    ▓▓${NC}"
    echo -e "${PURPLE}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
    echo ""
    
    if [ $validation_result -eq 0 ]; then
        echo -e "${GREEN}🎉 SUCESSO TOTAL! 🎉${NC}"
        echo -e "${GREEN}Dashboard VeloFlux está 100% funcional!${NC}"
        echo ""
        echo -e "${GREEN}✅ Todos os testes passaram${NC}"
        echo -e "${GREEN}✅ Zero bugs críticos${NC}"
        echo -e "${GREEN}✅ APIs funcionando corretamente${NC}"
        echo -e "${GREEN}✅ Interface responsiva${NC}"
        echo -e "${GREEN}✅ Pronto para produção${NC}"
        echo ""
        echo -e "${BLUE}🚀 Próximos passos:${NC}"
        echo -e "${BLUE}   • Acesse http://localhost:3000${NC}"
        echo -e "${BLUE}   • Faça login e teste todas as funcionalidades${NC}"
        echo -e "${BLUE}   • Configure deploy para produção${NC}"
        echo -e "${BLUE}   • Documente procedimentos operacionais${NC}"
        
    elif [ $validation_result -eq 1 ]; then
        echo -e "${YELLOW}⚠️ SUCESSO PARCIAL ⚠️${NC}"
        echo -e "${YELLOW}Dashboard funcional com alguns pontos de atenção${NC}"
        echo ""
        echo -e "${BLUE}🔧 Recomendações:${NC}"
        echo -e "${BLUE}   • Revisar relatório em reports/master-test-report-*.md${NC}"
        echo -e "${BLUE}   • Corrigir pontos menores identificados${NC}"
        echo -e "${BLUE}   • Re-executar validação após correções${NC}"
        
    else
        echo -e "${RED}❌ REQUER ATENÇÃO ❌${NC}"
        echo -e "${RED}Algumas falhas críticas foram detectadas${NC}"
        echo ""
        echo -e "${BLUE}🛠️ Ações necessárias:${NC}"
        echo -e "${BLUE}   • Revisar logs de erro em reports/${NC}"
        echo -e "${BLUE}   • Corrigir falhas identificadas${NC}"
        echo -e "${BLUE}   • Verificar configuração do ambiente${NC}"
        echo -e "${BLUE}   • Re-executar este script após correções${NC}"
    fi
    
else
    echo -e "${RED}❌ Script de validação não encontrado${NC}"
    echo -e "${YELLOW}Executando validações básicas...${NC}"
    
    # Basic validation
    echo -e "${BLUE}Testando endpoints básicos...${NC}"
    
    if curl -s http://localhost:8080/health | grep -q "ok\|healthy\|success"; then
        echo -e "${GREEN}✅ Health check: OK${NC}"
    else
        echo -e "${RED}❌ Health check: FALHOU${NC}"
    fi
    
    if curl -s http://localhost:3000 | grep -q "html\|VeloFlux\|React"; then
        echo -e "${GREEN}✅ Frontend: OK${NC}"
    else
        echo -e "${RED}❌ Frontend: FALHOU${NC}"
    fi
fi

# Final instructions
echo ""
echo -e "${CYAN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
echo -e "${CYAN}▓▓                      LINKS ÚTEIS                       ▓▓${NC}"
echo -e "${CYAN}▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓${NC}"
echo ""
echo -e "${BLUE}🌐 Dashboard:${NC} http://localhost:3000"
echo -e "${BLUE}🔧 API Backend:${NC} http://localhost:8080"
echo -e "${BLUE}📊 Health Check:${NC} http://localhost:8080/health"
echo -e "${BLUE}📋 Métricas:${NC} http://localhost:8080/api/metrics/system"
echo ""
echo -e "${BLUE}📁 Relatórios:${NC} reports/master-test-report-*.md"
echo -e "${BLUE}📚 Documentação:${NC} docs/GUIA_TESTE_DASHBOARD_PRODUCAO.md"
echo -e "${BLUE}🎯 Plano Completo:${NC} docs/PLANO_TESTE_DASHBOARD_PRODUCAO_COMPLETO.md"
echo ""

# Final message
echo -e "${GREEN}🎯 Quick Start concluído!${NC}"
echo -e "${BLUE}Use os links acima para acessar e testar o dashboard.${NC}"
echo ""

exit $validation_result
