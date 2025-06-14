#!/bin/bash

# Script para adicionar cabeçalhos de licença a arquivos de código-fonte
# Este script adiciona cabeçalhos de licença a arquivos Go, TypeScript, JavaScript e outros

LICENSE_TEXT="// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io
"

HTML_LICENSE_TEXT="<!-- 
🚫 Not for Commercial Use Without License
📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io
-->"

CSS_LICENSE_TEXT="/* 
🚫 Not for Commercial Use Without License
📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io
*/"

# Função para adicionar cabeçalho a um arquivo
add_header() {
    local file=$1
    local header=$2
    local temp_file=$(mktemp)
    
    # Verificar se o arquivo já tem o cabeçalho de licença
    if grep -q "Not for Commercial Use Without License" "$file"; then
        echo "Cabeçalho já existe em $file"
        return
    fi
    
    echo "$header" > "$temp_file"
    echo "" >> "$temp_file"
    cat "$file" >> "$temp_file"
    mv "$temp_file" "$file"
    echo "Adicionado cabeçalho a $file"
}

# Adicionar a arquivos Go
find . -name "*.go" -type f | while read file; do
    # Ignorar diretórios vendor e node_modules
    if [[ $file != *"/vendor/"* ]] && [[ $file != *"/node_modules/"* ]]; then
        add_header "$file" "$LICENSE_TEXT"
    fi
done

# Adicionar a arquivos TypeScript/JavaScript
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx" -type f | while read file; do
    if [[ $file != *"/vendor/"* ]] && [[ $file != *"/node_modules/"* ]]; then
        add_header "$file" "$LICENSE_TEXT"
    fi
done

# Adicionar a arquivos HTML
find . -name "*.html" -type f | while read file; do
    if [[ $file != *"/vendor/"* ]] && [[ $file != *"/node_modules/"* ]]; then
        add_header "$file" "$HTML_LICENSE_TEXT"
    fi
done

# Adicionar a arquivos CSS
find . -name "*.css" -o -name "*.scss" -o -name "*.sass" -type f | while read file; do
    if [[ $file != *"/vendor/"* ]] && [[ $file != *"/node_modules/"* ]]; then
        add_header "$file" "$CSS_LICENSE_TEXT"
    fi
done

echo "Concluído! Cabeçalhos de licença adicionados aos arquivos."
