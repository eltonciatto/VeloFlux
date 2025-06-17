#!/bin/bash

# 🧹 VeloFlux - Script de Limpeza e Organização
# Remove arquivos obsoletos e organiza a estrutura do projeto

set -e

echo "🧹 VeloFlux - Limpeza e Organização"
echo "===================================="

cd /workspaces/VeloFlux

echo "📋 Criando backup dos arquivos importantes..."
mkdir -p backup_temp
cp *.js backup_temp/ 2>/dev/null || true
cp *.patch backup_temp/ 2>/dev/null || true

echo "🗂️ Movendo arquivos para /docs/archive..."
mkdir -p docs/archive

# Mover arquivos de tradução
mv translation-coverage-test.* docs/archive/ 2>/dev/null || true
mv prometheus_metrics.patch docs/archive/ 2>/dev/null || true

# Mover READMEs antigos
mv README-*.md docs/archive/ 2>/dev/null || true

echo "🔧 Organizando configurações..."
mkdir -p config

# Mover arquivos de configuração
mv config-local.yaml config/ 2>/dev/null || true
mv test-config.yaml config/ 2>/dev/null || true

echo "📊 Movendo arquivos de cobertura..."
mkdir -p reports
mv coverage.* reports/ 2>/dev/null || true

echo "🗑️ Removendo arquivos desnecessários..."
# Remover backups desnecessários
rm -f docker-compose.yml.bak* 2>/dev/null || true
rm -f .env.bak* 2>/dev/null || true

echo "📁 Listando estrutura final organizada..."
echo ""
echo "📂 Estrutura de pastas:"
echo "├── 📋 /docs/           # Documentação centralizada"
echo "│   ├── INDEX.md        # Documentação principal"
echo "│   └── archive/        # Arquivos antigos"
echo "├── 🧪 /scripts/        # Scripts organizados"
echo "│   ├── setup/          # Scripts de instalação"
echo "│   ├── testing/        # Scripts de teste"
echo "│   ├── utils/          # Utilitários"
echo "│   └── archive/        # Scripts antigos"
echo "├── ⚙️ /config/         # Configurações"
echo "├── 📊 /reports/        # Relatórios e cobertura"
echo "├── 🎨 /frontend/       # Frontend React"
echo "├── 🔧 /backend/        # Backend Go"
echo "└── 🐳 docker-compose.yml"
echo ""

echo "✅ Limpeza concluída!"
echo ""
echo "📖 Documentação principal: docs/INDEX.md"
echo "🚀 Para começar: ./scripts/setup/install.sh"
echo "🔍 Status: ./scripts/utils/check-status.sh"
