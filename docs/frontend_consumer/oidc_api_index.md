# 🔐 OIDC API - Índice de Documentação

## Visão Geral

A API OIDC (OpenID Connect) do VeloFlux fornece autenticação federada multi-tenant, permitindo que cada tenant configure seu próprio provedor de identidade (Google, Azure AD, Keycloak, etc.).

## 📚 Documentação Disponível

### 1. [Guia de Integração Completo](./oidc_api_integration.md)
**Tudo que você precisa para integrar a API OIDC**
- ✅ Visão geral da API
- ✅ Endpoints disponíveis
- ✅ Configuração do cliente HTTP
- ✅ Implementação de serviços
- ✅ Componentes React
- ✅ Gerenciamento de estado
- ✅ Tratamento de erros
- ✅ Exemplos práticos

### 2. [Exemplos Práticos](./oidc_api_examples.md)
**Implementações específicas por framework**
- ✅ Vanilla JavaScript
- ✅ Vue.js 3 com Composition API
- ✅ Angular com RxJS
- ✅ Cache e performance
- ✅ Webhooks e eventos
- ✅ Configuração avançada
- ✅ Troubleshooting

### 3. [Guia de Testes](./oidc_api_testing.md)
**Estratégias completas de teste**
- ✅ Testes de unidade
- ✅ Testes de integração
- ✅ Testes end-to-end
- ✅ Mocks e fixtures
- ✅ Testes de performance
- ✅ Testes de segurança
- ✅ Automação CI/CD

## 🚀 Quick Start

### Instalação Rápida
```bash
# Clone os arquivos de exemplo
curl -O https://raw.githubusercontent.com/veloflux/docs/main/frontend_consumer/oidc_examples.zip

# Instalar dependências (React)
npm install axios @types/react
```

### Uso Básico
```typescript
import { OIDCService } from './services/oidc.service';

// 1. Verificar se OIDC está configurado
const isEnabled = await OIDCService.isOIDCEnabled('your-tenant');

// 2. Iniciar login se configurado
if (isEnabled) {
  OIDCService.initiateLogin({ 
    tenant_id: 'your-tenant',
    return_url: '/dashboard' 
  });
}

// 3. Verificar autenticação
const isAuthenticated = OIDCService.isAuthenticated();
```

## 🔧 Endpoints da API

| Método | Endpoint | Uso | Autenticação |
|--------|----------|-----|--------------|
| `GET` | `/auth/oidc/login/{tenant_id}` | Iniciar login | ❌ Público |
| `GET` | `/auth/oidc/callback` | Processar callback | ❌ Público |
| `GET` | `/api/tenants/{tenant_id}/oidc/config` | Obter configuração | ✅ Bearer Token |
| `PUT` | `/api/tenants/{tenant_id}/oidc/config` | Definir configuração | ✅ Bearer Token |

## 🎯 Funcionalidades por Framework

### React + TypeScript
```tsx
// Hook personalizado
const { config, loading, updateConfig } = useOIDCConfig('tenant-1');

// Componente de login
<OIDCLoginButton tenantId="tenant-1" returnUrl="/dashboard" />

// Formulário de configuração
<OIDCConfigForm tenantId="tenant-1" />

// Proteção de rotas
<ProtectedRoute tenantId="tenant-1">
  <Dashboard />
</ProtectedRoute>
```

### Vue.js 3
```vue
<template>
  <OIDCLoginButton :tenant-id="tenantId" />
</template>

<script setup>
import { useOIDC } from '@/composables/useOIDC';

const { config, initiateLogin } = useOIDC();
</script>
```

### Angular
```typescript
@Component({
  template: `<button (click)="login()">Login OIDC</button>`
})
export class LoginComponent {
  constructor(private oidcService: OIDCService) {}
  
  login() {
    this.oidcService.initiateLogin('tenant-1');
  }
}
```

## 🔒 Configuração de Segurança

### Validação de Provedores Suportados
- ✅ Google Workspace
- ✅ Microsoft Azure AD
- ✅ Keycloak
- ✅ Okta
- ✅ Auth0
- ✅ Amazon Cognito
- ✅ Qualquer provedor OIDC compatível

### Configuração Necessária
```typescript
interface OIDCConfig {
  enabled: boolean;
  issuer_url: string;        // ex: https://accounts.google.com
  client_id: string;         // Client ID do provedor
  client_secret: string;     // Client Secret do provedor
  redirect_uri?: string;     // URI de callback (opcional)
  scopes?: string[];         // Scopes solicitados
  auto_create_users?: boolean; // Criar usuários automaticamente
}
```

## 📊 Exemplos de Configuração por Provedor

### Google
```json
{
  "enabled": true,
  "issuer_url": "https://accounts.google.com",
  "client_id": "your-google-client-id.apps.googleusercontent.com",
  "client_secret": "your-google-client-secret",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

### Azure AD
```json
{
  "enabled": true,
  "issuer_url": "https://login.microsoftonline.com/{tenant-id}/v2.0",
  "client_id": "your-azure-client-id",
  "client_secret": "your-azure-client-secret",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

### Keycloak
```json
{
  "enabled": true,
  "issuer_url": "https://your-keycloak.com/auth/realms/your-realm",
  "client_id": "your-keycloak-client",
  "client_secret": "your-keycloak-secret",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

## 🧪 Testes Rápidos

### Teste de Conectividade
```typescript
// Verificar se provedor está acessível
const isValid = await OIDCConfigValidator.validateIssuer(
  'https://accounts.google.com'
);
console.log('Provedor válido:', isValid.isValid);
```

### Teste de Configuração
```typescript
// Validar configuração completa
const config = {
  enabled: true,
  issuer_url: 'https://accounts.google.com',
  client_id: 'test-client-id',
  client_secret: 'test-secret',
};

const validation = OIDCConfigValidator.validate(config);
console.log('Configuração válida:', validation.isValid);
```

### Diagnóstico Completo
```typescript
// Executar diagnóstico completo
const report = await OIDCDiagnostics.runDiagnostics('tenant-1');
console.log('Relatório de diagnóstico:', report);
```

## 📈 Monitoramento e Métricas

### Eventos para Tracking
```typescript
// Login iniciado
oidcEvents.on('oidc:login:initiated', ({ tenant_id, provider }) => {
  analytics.track('OIDC Login Started', { tenant_id, provider });
});

// Login bem-sucedido
oidcEvents.on('oidc:login:success', ({ tenant_id, user_email }) => {
  analytics.track('OIDC Login Success', { tenant_id, user_email });
});

// Configuração atualizada
oidcEvents.on('oidc:config:updated', ({ tenant_id, config }) => {
  analytics.track('OIDC Config Updated', { tenant_id, enabled: config.enabled });
});
```

### Métricas Importantes
- Taxa de sucesso de autenticação
- Tempo médio de login
- Provedores mais utilizados
- Configurações por tenant
- Erros de callback

## 🆘 Troubleshooting Rápido

### Problemas Comuns

1. **"Authentication failed"**
   ```typescript
   // Verificar configuração
   const config = await OIDCService.getOIDCConfig('tenant-id');
   console.log('Config atual:', config);
   ```

2. **"Invalid redirect URI"**
   ```typescript
   // Verificar URL de callback configurada
   const expectedCallback = `${window.location.origin}/auth/oidc/callback`;
   console.log('Callback esperado:', expectedCallback);
   ```

3. **"Token expired"**
   ```typescript
   // Limpar tokens e forçar novo login
   OIDCService.logout();
   ```

### Debug Mode
```typescript
// Ativar logs detalhados
localStorage.setItem('oidc_debug', 'true');

// Ou via environment
process.env.REACT_APP_OIDC_DEBUG = 'true';
```

## 📞 Suporte

- **Documentação**: [README Principal](./README.md)
- **Issues**: GitHub Issues
- **Discussões**: GitHub Discussions
- **Email**: dev@veloflux.io

---

> **📝 Nota**: Esta documentação é atualizada regularmente. Para a versão mais recente, consulte o repositório GitHub.

**Última atualização**: Dezembro 2024  
**Versão da API**: 1.0  
**Compatibilidade**: Todos os provedores OIDC padrão
