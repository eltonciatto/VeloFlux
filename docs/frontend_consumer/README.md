# Fronte### 📧 SMTP API - Sistema de Email
- **[Guia Principal da API SMTP](smtp_api_guide.md)** - Documentação completa com todos os endpoints, exemplos e validações
- **[Exemplos de Integração](smtp_api_examples.md)** - Client HTTP, hooks React, contexto global e validações
- **[Tratamento de Erros](smtp_error_handling.md)** - Todos os tipos de erros, retry, notificações e logging
- **[Guia de Testes](smtp_testing_guide.md)** - Testes unitários, integração, E2E e performance
- **[Configurações Avançadas](smtp_advanced_features.md)** - Múltiplos ambientes, temas, analytics, segurança e otimizaçõesnsumer - Documentação Completa

## Visão Geral

Esta pasta contém toda a documentação necessária para consumir as APIs do VeloFlux no frontend, incluindo guias específicos por framework, tipos TypeScript e exemplos práticos.

## 📋 Índice de Documentação

### � SMTP API - Sistema de Email
- **[Guia Principal da API SMTP](smtp_api_guide.md)** - Documentação completa com todos os endpoints, exemplos e validações
- **[Exemplos de Integração](smtp_api_examples.md)** - Client HTTP, hooks React, contexto global e validações
- **[Tratamento de Erros](smtp_error_handling.md)** - Todos os tipos de erros, retry, notificações e logging
- **[Guia de Testes](smtp_testing_guide.md)** - Testes unitários, integração, E2E e performance

### �🔄 Billing API - Sistema de Cobrança
- **[Guia Completo da Billing API](billing_api_complete_guide.md)** - Documentação completa com todos os endpoints, autenticação e exemplos
- **[Tipos TypeScript](billing_api_types.ts)** - Interfaces e tipos para desenvolvimento type-safe
- **[Componentes React](react_components_guide.md)** - Hooks, componentes e padrões para React
- **[Componentes Vue.js](vue_components_guide.md)** - Stores Pinia, composables e componentes para Vue 3
- **[Componentes Angular](angular_components_guide.md)** - Serviços RxJS, componentes Material e módulos
- **[Integração WebSocket](websocket_integration_guide.md)** - Conexões em tempo real, notificações e atualizações live
- **[Gerenciamento de Estado](state_management_guide.md)** - Redux, Zustand, Jotai e outras bibliotecas de estado
- **[Padrões Avançados](advanced_patterns_guide.md)** - Clean Architecture, performance, segurança e otimizações
- **[Guia de Testes](testing_guide.md)** - Estratégias de teste para APIs de billing

### 🔧 Orchestration API - Sistema de Orquestração
- **[Guia Principal](orchestration_api_guide.md)** - Visão geral da API e estruturas de dados
- **[Configuração](orchestration_configuration.md)** - Gerenciar configurações de orquestração
- **[Status e Monitoramento](orchestration_status.md)** - Monitorar status de implantação
- **[Deploy e Ciclo de Vida](orchestration_deployment.md)** - Gerenciar ciclo de vida de implantações
- **[Escalonamento](orchestration_scaling.md)** - Escalonamento manual e automático
- **[Recursos](orchestration_resources.md)** - Gerenciamento de recursos
- **[Exemplos Práticos](orchestration_examples.md)** - Componentes React completos
- **[Tratamento de Erros](orchestration_error_handling.md)** - Como tratar erros

### 🔐 OIDC API - Sistema de Autenticação OpenID Connect
- **[Guia de Integração Completo](oidc_api_integration.md)** - Documentação completa da API OIDC com endpoints, configuração e implementação
- **[Exemplos Práticos](oidc_api_examples.md)** - Implementações para Vanilla JS, Vue.js, Angular e casos de uso avançados
- **[Guia de Testes](oidc_api_testing.md)** - Estratégias de teste, mocks, testes E2E e automação CI/CD

### 🤖 AI API - Sistema de Inteligência Artificial
- **[Guia de Consumo da AI API](AI_API_FRONTEND_CONSUMPTION_GUIDE.md)** - Como integrar funcionalidades de IA
- **[Índice de Integração AI](AI_API_INTEGRATION_INDEX.md)** - Visão geral das integrações disponíveis
- **[Componentes React para AI](AI_API_REACT_COMPONENTS.md)** - Componentes específicos para funcionalidades de IA
- **[Componentes Vue para AI](AI_API_VUE_COMPONENTS.md)** - Componentes Vue para integração com IA

### ⚡ Quick Reference
- **[Quick Reference & Checklist](quick_reference.md)** - Checklist de implementação, snippets de código e referência rápida

## 🚀 Início Rápido

### 1. Configuração Base
```javascript
// Configuração do cliente base
const API_BASE_URL = 'https://api.veloflux.io';

const apiClient = {
  billing: `${API_BASE_URL}/billing`,
  ai: `${API_BASE_URL}/ai`,
  oidc: `${API_BASE_URL}/auth/oidc`,
  websocket: `ws://api.veloflux.io/ws`
};
```

### 2. Autenticação
```javascript
// Headers de autenticação padrão
const authHeaders = {
  'Authorization': `Bearer ${token}`,
  'X-Tenant-ID': tenantId,
  'Content-Type': 'application/json'
};

// Configuração OIDC
const oidcConfig = {
  loginUrl: (tenantId) => `/auth/oidc/login/${tenantId}`,
  callbackUrl: '/auth/oidc/callback',
  configUrl: (tenantId) => `/api/tenants/${tenantId}/oidc/config`
};
```

### 3. Cliente HTTP Universal
```javascript
class VeloFluxClient {
  constructor(baseURL, token, tenantId) {
    this.baseURL = baseURL;
    this.token = token;
    this.tenantId = tenantId;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'X-Tenant-ID': this.tenantId,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
```

## 📦 Estrutura Recomendada de Projeto

### Para React
```
src/
├── services/
│   ├── billing/
│   ├── ai/
│   ├── oidc/
│   └── websocket/
├── hooks/
│   ├── useBilling.ts
│   ├── useAI.ts
│   ├── useOIDCConfig.ts
│   ├── useAuth.ts
│   └── useWebSocket.ts
├── components/
│   ├── billing/
│   ├── ai/
│   ├── auth/
│   │   ├── OIDCLoginButton.tsx
│   │   ├── OIDCConfigForm.tsx
│   │   └── ProtectedRoute.tsx
│   └── common/
├── contexts/
│   └── AuthContext.tsx
├── types/
│   ├── billing.ts
│   ├── ai.ts
│   ├── oidc.ts
│   └── common.ts
└── utils/
    ├── api.ts
    ├── formatters.ts
    └── constants.ts
```

### Para Vue.js
```
src/
├── stores/
│   ├── billing.ts
│   ├── ai.ts
│   ├── auth.ts
│   └── websocket.ts
├── composables/
│   ├── useBilling.ts
│   ├── useAI.ts
│   ├── useOIDC.ts
│   ├── useAuth.ts
│   └── useWebSocket.ts
├── components/
│   ├── billing/
│   ├── ai/
│   ├── auth/
│   │   ├── OIDCLoginButton.vue
│   │   ├── OIDCConfigForm.vue
│   │   └── AuthGuard.vue
│   └── shared/
├── services/
│   └── api/
├── types/
│   └── index.ts
└── utils/
    └── helpers.ts
```

### Para Angular
```
src/
├── services/
│   ├── billing/
│   ├── ai/
│   ├── oidc/
│   │   ├── oidc.service.ts
│   │   └── auth.guard.ts
│   └── websocket/
├── components/
│   ├── billing/
│   ├── ai/
│   ├── auth/
│   │   ├── oidc-login/
│   │   ├── oidc-config/
│   │   └── protected-route/
│   └── shared/
├── modules/
│   ├── billing/
│   ├── ai/
│   ├── auth/
│   └── shared/
├── models/
│   ├── billing.ts
│   ├── ai.ts
│   ├── oidc.ts
│   └── common.ts
└── interceptors/
    ├── auth.interceptor.ts
    └── error.interceptor.ts
```

## 🛠️ Ferramentas e Dependências

### TypeScript (Recomendado)
```bash
npm install --save-dev typescript @types/node
```

### React
```bash
npm install react react-dom
npm install --save-dev @types/react @types/react-dom
```

### Vue.js
```bash
npm install vue@next
npm install pinia
```

### Angular
```bash
npm install @angular/core @angular/common @angular/material
npm install rxjs
```

### Bibliotecas Úteis
```bash
# Para formatação de dados
npm install date-fns numeral

# Para gráficos
npm install chart.js react-chartjs-2

# Para formulários
npm install react-hook-form @hookform/resolvers zod

# Para notificações
npm install react-hot-toast
```

## 🎯 Funcionalidades Principais por API

### OIDC API
- ✅ Autenticação OpenID Connect multi-tenant
- ✅ Login federado com provedores externos
- ✅ Configuração dinâmica por tenant
- ✅ Gerenciamento de tokens JWT
- ✅ Callback automático e seguro
- ✅ Logout e limpeza de sessão
- ✅ Validação de configuração
- ✅ Proteção de rotas
- ✅ Context de autenticação
- ✅ Componentes reutilizáveis

### Billing API
- ✅ Gerenciamento de assinaturas
- ✅ Processamento de faturas
- ✅ Monitoramento de uso
- ✅ Alertas de cobrança
- ✅ Exportação de dados
- ✅ Webhooks para eventos
- ✅ Configuração de planos
- ✅ WebSocket para updates em tempo real
- ✅ Integração com múltiplas bibliotecas de estado

### AI API
- ✅ Análise preditiva
- ✅ Processamento de linguagem natural
- ✅ Recomendações inteligentes
- ✅ Análise de sentimentos
- ✅ Classificação de conteúdo
- ✅ Geração de insights

## 📈 Monitoramento e Analytics

### Métricas Importantes
- Taxa de sucesso das requisições
- Tempo de resposta das APIs
- Uso de recursos por tenant
- Eventos de cobrança
- Atividade de IA
- Sucessos e falhas de autenticação OIDC
- Configurações OIDC por tenant

### Implementação de Tracking
```javascript
// Exemplo de tracking de eventos
const trackEvent = (eventName, properties) => {
  // Analytics service
  analytics.track(eventName, {
    timestamp: new Date().toISOString(),
    tenant_id: currentTenant.id,
    user_id: currentUser.id,
    ...properties
  });
};

// Tracking de OIDC events
trackEvent('oidc:login_initiated', {
  tenant_id: 'tenant-1',
  provider: 'google'
});

trackEvent('oidc:login_success', {
  tenant_id: 'tenant-1',
  user_email: 'user@example.com'
});

trackEvent('oidc:config_updated', {
  tenant_id: 'tenant-1',
  enabled: true,
  provider: 'azure-ad'
});

// Tracking de billing events
trackEvent('billing:subscription_updated', {
  plan: newPlan,
  previous_plan: oldPlan
});

// Tracking de AI usage
trackEvent('ai:model_used', {
  model: 'gpt-4',
  tokens_used: 150,
  cost: 0.03
});
```

## 🔒 Segurança e Boas Práticas

### Autenticação
- Sempre usar HTTPS em produção
- Implementar refresh de tokens
- Validar tokens no frontend
- Implementar logout automático

### Validação de Dados
- Validar todas as entradas do usuário
- Sanitizar dados antes de enviar
- Implementar rate limiting
- Tratar erros graciosamente

### Performance
- Implementar cache inteligente
- Usar paginação para listas grandes
- Implementar lazy loading
- Otimizar bundle size

## 📞 Suporte e Contribuição

### Reportar Problemas
- Criar issues detalhadas no GitHub
- Incluir logs e screenshots
- Especificar versões e ambiente

### Contribuir
- Seguir convenções de código
- Adicionar testes para novas funcionalidades
- Atualizar documentação
- Solicitar review de código

---

**Última atualização:** Dezembro 2024  
**Versão da API:** v1.0  
**Compatibilidade:** React 18+, Vue 3+, Angular 15+
