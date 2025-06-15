#!/bin/bash
# Script para verificar e resolver problemas comuns de deploy do VeloFlux no Coolify

set -e

echo "🔍 Verificando problemas comuns de deploy no VeloFlux..."

# Verificar e corrigir dependências Go
echo "📦 Verificando dependências Go..."
go mod tidy
go mod verify
echo "✅ Dependências Go verificadas"

# Verificar se o frontend constrói corretamente
echo "🖥️ Verificando build do frontend..."
npm ci
npm run build
echo "✅ Frontend constrói corretamente"

# Verificar se o backend compila
echo "🔧 Verificando compilação do backend..."
CGO_ENABLED=0 go build -o /dev/null ./cmd/velofluxlb
echo "✅ Backend compila corretamente"

# Verificar se os diretórios necessários existem
echo "📁 Verificando diretórios necessários..."
mkdir -p .coolify
mkdir -p config
echo "✅ Diretórios verificados"

echo "✨ Verificação concluída! Seu projeto parece estar pronto para deploy no Coolify."
echo ""
echo "🚀 Para fazer deploy no Coolify, siga estas etapas:"
echo "1. Execute o script setup_coolify.sh para gerar os arquivos necessários"
echo "2. No Coolify, configure o Dockerfile para .coolify/Dockerfile"
echo "3. Adicione as variáveis de ambiente necessárias"
echo "4. Configure o volume para o arquivo de configuração"
echo ""
echo "Se o deploy ainda falhar, verifique os logs do Coolify para mais detalhes."
