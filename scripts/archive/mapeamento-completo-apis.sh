#!/bin/bash

# Script para mapear todas as APIs do VeloFlux (backend + frontend)
# Este script analisa TODAS as APIs implementadas no backend e consumidas no frontend

REPORT_FILE="MAPEAMENTO_COMPLETO_APIS.md"

echo "🔍 Mapeando todas as APIs do VeloFlux (Backend + Frontend)..."
echo "================================================="

# Criar relatório
cat > $REPORT_FILE << 'EOF'
# 📊 Mapeamento Completo das APIs VeloFlux

## Resumo Executivo

Esta análise mapeia **TODAS** as APIs implementadas no backend Go e sua integração com o frontend React/TypeScript, incluindo:

- ✅ APIs de IA (já validadas anteriormente)
- 🔍 APIs de Autenticação e Login
- 🔍 APIs de Billing e Cobrança
- 🔍 APIs de Gerenciamento de Tenants
- 🔍 APIs de Pools e Backends
- 🔍 APIs de Rotas
- 🔍 APIs de OIDC
- 🔍 APIs de Orquestração
- 🔍 APIs de Métricas e Monitoramento

## 🎯 APIs Implementadas no Backend

### 1. APIs de Autenticação
EOF

echo "📝 Analisando APIs de Autenticação..."

# Buscar endpoints de autenticação no backend
echo "#### Endpoints de Login/Auth:" >> $REPORT_FILE
grep -r "HandleFunc.*auth\|login\|register\|refresh" backend/internal/api/ | \
    grep -E "\.(go):" | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# APIs de Billing
echo "### 2. APIs de Billing/Cobrança" >> $REPORT_FILE
echo "#### Endpoints de Billing:" >> $REPORT_FILE
grep -r "billing\|checkout\|plans\|usage\|webhook" backend/internal/api/billing_api.go | \
    grep "HandleFunc" | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# APIs de Tenants
echo "### 3. APIs de Gerenciamento de Tenants" >> $REPORT_FILE
echo "#### Endpoints de Tenants:" >> $REPORT_FILE
grep -r "HandleFunc.*tenants\|users\|pools\|routes" backend/internal/api/tenant_api.go | \
    grep "HandleFunc" | head -20 | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# APIs de OIDC
echo "### 4. APIs de OIDC/SSO" >> $REPORT_FILE
echo "#### Endpoints de OIDC:" >> $REPORT_FILE
grep -r "HandleFunc.*oidc\|callback\|config" backend/internal/api/oidc_api.go | \
    grep "HandleFunc" | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# APIs de Orquestração
echo "### 5. APIs de Orquestração Kubernetes" >> $REPORT_FILE
echo "#### Endpoints de Orquestração:" >> $REPORT_FILE
grep -r "HandleFunc.*orchestration\|deploy\|scale\|autoscale" backend/internal/api/orchestration_api.go | \
    grep "HandleFunc" | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

# APIs Core (pools, backends, routes)
echo "### 6. APIs Core (Pools, Backends, Routes)" >> $REPORT_FILE
echo "#### Endpoints Core:" >> $REPORT_FILE
grep -r "HandleFunc.*\(pools\|backends\|routes\|cluster\|status\)" backend/internal/api/api.go | \
    grep "HandleFunc" | head -15 | \
    sed 's/.*HandleFunc("/- `/; s/",.*/).Methods("/` - /; s/").*//; s/$/ method/' >> $REPORT_FILE || echo "- Nenhum endpoint encontrado" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "## 🎯 Consumo de APIs no Frontend" >> $REPORT_FILE

echo "📝 Analisando consumo de APIs no frontend..."

# APIs consumidas no frontend
echo "### 1. APIs de Autenticação (Frontend)" >> $REPORT_FILE
echo "#### Hooks e Clientes de Auth:" >> $REPORT_FILE
grep -r "safeApiFetch.*auth\|login\|register\|refresh" frontend/src/ | \
    grep -E "\.(ts|tsx):" | head -10 | \
    sed 's/.*safeApiFetch/- /; s/,.*//; s/`//g' >> $REPORT_FILE || echo "- Nenhuma chamada encontrada" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "### 2. APIs de Billing (Frontend)" >> $REPORT_FILE
echo "#### Hooks e Clientes de Billing:" >> $REPORT_FILE
grep -r "safeApiFetch.*billing\|checkout\|plans\|usage" frontend/src/ | \
    grep -E "\.(ts|tsx):" | \
    sed 's/.*safeApiFetch/- /; s/,.*//; s/`//g' >> $REPORT_FILE || echo "- Nenhuma chamada encontrada" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "### 3. APIs de Tenants (Frontend)" >> $REPORT_FILE
echo "#### Hooks e Clientes de Tenants:" >> $REPORT_FILE
grep -r "safeApiFetch.*tenants\|apiFetch.*tenants" frontend/src/ | \
    grep -E "\.(ts|tsx):" | head -10 | \
    sed 's/.*safeApiFetch/- /; s/.*apiFetch/- /; s/,.*//; s/`//g' >> $REPORT_FILE || echo "- Nenhuma chamada encontrada" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "### 4. APIs de Orquestração (Frontend)" >> $REPORT_FILE
echo "#### Hooks e Clientes de Orquestração:" >> $REPORT_FILE
grep -r "safeApiFetch.*orchestration\|deploy\|scale" frontend/src/ | \
    grep -E "\.(ts|tsx):" | \
    sed 's/.*safeApiFetch/- /; s/,.*//; s/`//g' >> $REPORT_FILE || echo "- Nenhuma chamada encontrada" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "### 5. APIs Core (Frontend)" >> $REPORT_FILE
echo "#### Hooks e Clientes Core:" >> $REPORT_FILE
grep -r "apiFetch.*\(pools\|backends\|routes\|cluster\|config\)" frontend/src/ | \
    grep -E "\.(ts|tsx):" | head -10 | \
    sed 's/.*apiFetch/- /; s/,.*//; s/`//g' >> $REPORT_FILE || echo "- Nenhuma chamada encontrada" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "## 🔍 Análise de Gaps e Inconsistências" >> $REPORT_FILE

echo "📝 Identificando gaps..."

echo "### Possíveis Gaps Identificados:" >> $REPORT_FILE

# Verificar se há endpoints implementados no backend mas não consumidos no frontend
echo "#### 1. Endpoints Backend sem consumo Frontend:" >> $REPORT_FILE

# Listar alguns endpoints específicos para verificação manual
echo "- Verificação necessária para:" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/users` - Gerenciamento de usuários" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/pools/{pool}/backends` - Gerenciamento de backends" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/waf/config` - Configuração WAF" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/rate-limit` - Rate limiting" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/metrics` - Métricas por tenant" >> $REPORT_FILE
echo "  - `/api/tenants/{id}/logs` - Logs por tenant" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "#### 2. Endpoints Frontend sem implementação Backend:" >> $REPORT_FILE
echo "- Análise em andamento..." >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "## 📋 Estrutura de Arquivos de API" >> $REPORT_FILE

echo "### Backend (Go):" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE
find backend/internal/api/ -name "*.go" | sort >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "### Frontend (TypeScript):" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE
find frontend/src -name "*api*" -o -name "*hook*" | grep -E "\.(ts|tsx)$" | sort >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "## 📊 Estatísticas" >> $REPORT_FILE

# Contar arquivos de API
BACKEND_API_FILES=$(find backend/internal/api/ -name "*.go" | wc -l)
FRONTEND_API_FILES=$(find frontend/src -name "*api*" -o -name "*hook*" | grep -E "\.(ts|tsx)$" | wc -l)

echo "- **Arquivos de API Backend**: $BACKEND_API_FILES" >> $REPORT_FILE
echo "- **Arquivos de API/Hooks Frontend**: $FRONTEND_API_FILES" >> $REPORT_FILE

# Contar endpoints aproximadamente
BACKEND_ENDPOINTS=$(grep -r "HandleFunc" backend/internal/api/ | wc -l)
FRONTEND_CALLS=$(grep -r "safeApiFetch\|apiFetch" frontend/src/ | wc -l)

echo "- **Total de Endpoints Backend (aprox.)**: $BACKEND_ENDPOINTS" >> $REPORT_FILE
echo "- **Total de Chamadas Frontend (aprox.)**: $FRONTEND_CALLS" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "## 🎯 Próximas Ações Recomendadas" >> $REPORT_FILE

echo "1. **Validação Manual Detalhada**: Verificar cada endpoint identificado" >> $REPORT_FILE
echo "2. **Testes de Integração**: Criar testes automatizados para validar todos os endpoints" >> $REPORT_FILE
echo "3. **Documentação**: Atualizar documentação de API com todos os endpoints" >> $REPORT_FILE
echo "4. **Implementação de Gaps**: Implementar endpoints faltantes no frontend" >> $REPORT_FILE
echo "5. **Padronização**: Garantir consistência de estruturas JSON entre backend e frontend" >> $REPORT_FILE

echo "" >> $REPORT_FILE

echo "---" >> $REPORT_FILE
echo "*Relatório gerado automaticamente em $(date)*" >> $REPORT_FILE

echo "✅ Relatório base criado: $REPORT_FILE"

# Agora vamos fazer análises mais detalhadas dos endpoints específicos

echo ""
echo "🔍 Fazendo análise detalhada dos endpoints..."

# Analisar estruturas JSON do backend
echo ""
echo "## 🏗️ Análise Detalhada de Estruturas JSON" >> $REPORT_FILE

echo "### Backend Structs (Go):" >> $REPORT_FILE
echo "\`\`\`go" >> $REPORT_FILE
grep -A 5 -B 1 "type.*struct" backend/internal/api/*.go | head -50 >> $REPORT_FILE || echo "// Structs não encontradas" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE

echo ""
echo "### Frontend Interfaces (TypeScript):" >> $REPORT_FILE
echo "\`\`\`typescript" >> $REPORT_FILE
grep -A 5 -B 1 "interface\|type.*=" frontend/src/lib/api.ts frontend/src/hooks/use-api.ts 2>/dev/null | head -30 >> $REPORT_FILE || echo "// Interfaces não encontradas" >> $REPORT_FILE
echo "\`\`\`" >> $REPORT_FILE

echo ""
echo "✅ Análise completa finalizada!"
echo "📄 Relatório completo disponível em: $REPORT_FILE"
echo ""
echo "🎯 Resumo:"
echo "   - Arquivos de API Backend: $BACKEND_API_FILES"
echo "   - Arquivos de API/Hooks Frontend: $FRONTEND_API_FILES"
echo "   - Endpoints Backend (aprox.): $BACKEND_ENDPOINTS"
echo "   - Chamadas Frontend (aprox.): $FRONTEND_CALLS"
echo ""
echo "📋 Próximo passo: Revisar o relatório para identificar gaps específicos"
