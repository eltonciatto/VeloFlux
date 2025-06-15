#!/bin/bash

# VeloFlux Adaptive Algorithms Demo Script
echo "🚀 VeloFlux - Demonstração dos Algoritmos Adaptativos de IA/ML"
echo "============================================================="
echo ""

# Verificar se Go está instalado
if ! command -v go &> /dev/null; then
    echo "❌ Go não está instalado. Por favor, instale Go primeiro."
    exit 1
fi

echo "📋 Verificando dependências..."

# Verificar se as dependências estão disponíveis
if [ ! -f "go.mod" ]; then
    echo "❌ Arquivo go.mod não encontrado. Execute este script no diretório raiz do VeloFlux."
    exit 1
fi

echo "✅ Dependências verificadas"
echo ""

# Compilar e executar a demonstração
echo "🔧 Compilando demonstração..."
cd examples/
if go build -o adaptive_demo adaptive_demo.go; then
    echo "✅ Compilação concluída com sucesso"
    echo ""
    
    echo "🎯 Executando demonstração dos algoritmos adaptativos..."
    echo "   Esta demonstração mostra como a IA/ML do VeloFlux:"
    echo "   • Analisa diferentes padrões de tráfego"
    echo "   • Adapta algoritmos em tempo real"
    echo "   • Aprende com feedback contínuo"
    echo "   • Otimiza performance automaticamente"
    echo ""
    
    ./adaptive_demo
    
    echo ""
    echo "📊 Demonstração concluída!"
    echo ""
    echo "📚 Para mais informações sobre os algoritmos adaptativos:"
    echo "   • Leia: docs/sso_ai_analysis.md"
    echo "   • Código: internal/ai/predictor.go"
    echo "   • Balancer: internal/balancer/adaptive.go"
    
    # Limpar arquivo executável
    rm -f adaptive_demo
else
    echo "❌ Erro na compilação. Verificando detalhes..."
    echo ""
    echo "Possíveis soluções:"
    echo "1. Instalar dependências: go mod tidy"
    echo "2. Verificar compatibilidade do Go: go version"
    echo "3. Verificar estrutura do projeto"
fi

echo ""
echo "🔗 Links úteis:"
echo "   • Documentação: https://github.com/eltonciatto/veloflux"
echo "   • Issues: https://github.com/eltonciatto/veloflux/issues"
echo "   • Contato: contact@veloflux.io"
