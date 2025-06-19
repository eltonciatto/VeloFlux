#!/bin/bash

# 🧹 Script de Limpeza do VeloFlux
# Remove arquivos temporários e desnecessários do projeto

echo "🧹 Iniciando limpeza do projeto VeloFlux..."
echo

# Contadores
removed_count=0

# Função para remover arquivo se existir
remove_if_exists() {
    if [ -f "$1" ]; then
        rm -f "$1"
        echo "  ✅ Removido: $1"
        ((removed_count++))
    fi
}

# Função para remover diretório se existir
remove_dir_if_exists() {
    if [ -d "$1" ]; then
        rm -rf "$1"
        echo "  ✅ Removido diretório: $1"
        ((removed_count++))
    fi
}

echo "📁 Removendo arquivos de teste..."
remove_if_exists "frontend/src/data/test-output.json"
remove_if_exists "frontend/public/test-lang.js"
remove_if_exists "frontend/public/test-ptbr.js"
remove_if_exists "scripts/test-generator.js"
remove_if_exists "scripts/test-cities-simple.js"
remove_if_exists "scripts/test-world-cities.js"

echo
echo "📁 Removendo arquivos temporários de build..."
remove_if_exists "scripts/output/generation-report.json"
remove_if_exists "scripts/output/generation-stats.json"
remove_if_exists "scripts/output/world-cities.json"

echo
echo "📁 Removendo logs e cache..."
remove_if_exists ".npm/_logs/*.log"
remove_dir_if_exists "node_modules/.cache"
remove_dir_if_exists ".vite"

echo
echo "📁 Removendo arquivos de backup antigos..."
find . -name "*.bak" -type f -exec rm -f {} \; 2>/dev/null
find . -name "*.tmp" -type f -exec rm -f {} \; 2>/dev/null
find . -name "*.old" -type f -exec rm -f {} \; 2>/dev/null

echo
echo "✅ Limpeza concluída!"
echo "📊 $removed_count arquivos/diretórios removidos"
echo
echo "📁 Arquivos essenciais mantidos:"
echo "  📄 frontend/src/data/world-cities.json (243 cidades, 69 países)"
echo "  📄 scripts/output/world-cities-real.json (arquivo fonte)"
echo "  📄 scripts/output/real-generation-stats.json (estatísticas)"
echo "  📄 scripts/test-complete-generation.js (teste do pipeline)"
echo
echo "🎉 Projeto limpo e otimizado!"
