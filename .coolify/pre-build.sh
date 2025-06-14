#!/bin/bash
# Script de pré-build para Coolify
# Este script será executado antes da compilação do projeto
# É útil para resolver problemas comuns de build

set -e

echo "🔧 Executando pré-build para VeloFlux no Coolify..."

# Verificar e corrigir dependências Go
echo "📦 Verificando dependências Go..."
go mod tidy
go mod verify

echo "✅ Pré-build concluído com sucesso!"
