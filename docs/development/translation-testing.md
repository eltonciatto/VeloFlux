# 🔍 Translation Testing (Development Only)

## Overview

O componente `TranslationTest` é uma ferramenta de desenvolvimento que valida se todas as chaves de tradução estão funcionando corretamente no sistema.

## Features

- ✅ **Comprehensive Testing**: Testa todas as chaves de tradução usadas na aplicação
- 📊 **Coverage Report**: Mostra porcentagem de cobertura das traduções
- 🗂️ **Categorized Results**: Lista traduções faltantes organizadas por categoria
- 🚫 **Dev-Only**: Só aparece em modo de desenvolvimento

## Como Funciona

### 1. Detecção de Ambiente

O componente usa duas verificações para garantir que só rode em desenvolvimento:

```tsx
// Na página Index.tsx
{import.meta.env.DEV && <TranslationTest />}

// No próprio componente
if (import.meta.env.PROD) {
  return null;
}
```

### 2. Validação das Traduções

O componente:
1. Tenta traduzir todas as chaves conhecidas
2. Identifica quais retornam valores não traduzidos
3. Organiza os resultados por categoria
4. Calcula a porcentagem de cobertura

### 3. Relatório Visual

Exibe um painel fixo no canto da tela com:
- 📈 Porcentagem de cobertura total
- 📋 Lista de chaves faltantes por categoria
- ⚠️ Avisos se há traduções incompletas

## Localização

- **Componente**: `src/components/TranslationTest.tsx`
- **Uso**: `src/pages/Index.tsx`
- **Modo**: Desenvolvimento apenas (`NODE_ENV=development`)

## Build de Produção

Em builds de produção:
1. O Vite remove automaticamente código morto
2. As verificações `import.meta.env.PROD` garantem que o componente não renderiza
3. O componente é completamente excluído do bundle final

## Como Adicionar Novas Chaves

Quando adicionar novas chaves de tradução:

1. Adicione a chave em `src/locales/en/translation.json`
2. Adicione a chave em `src/locales/pt-BR/translation.json`
3. Adicione a chave no array `allTranslationKeys` em `TranslationTest.tsx`

Exemplo:
```tsx
const allTranslationKeys = [
  // ... outras chaves
  'novaSecao.novaChave.titulo',
  'novaSecao.novaChave.descricao',
];
```

## Comandos

```bash
# Executar em modo desenvolvimento (mostra TranslationTest)
npm run dev

# Build de produção (remove TranslationTest)
npm run build
```

## Troubleshooting

### O TranslationTest não aparece
- Verifique se está em modo dev: `import.meta.env.DEV` deve ser `true`
- Verifique se não há erros no console

### Relatório mostra chaves faltantes que existem
- Verifique se a chave está na lista `allTranslationKeys`
- Verifique se a estrutura JSON está correta
- Verifique se não há erros de sintaxe nos arquivos de tradução

### TranslationTest aparece em produção
- Isso nunca deveria acontecer
- Verifique se as verificações de ambiente estão corretas
- Reporte como bug se acontecer
