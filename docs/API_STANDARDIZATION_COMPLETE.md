# 🎯 Padronização Completa das APIs com Prefixo `/api/`

## ✅ Problema Resolvido

**ANTES:** Inconsistência total entre frontend e backend
- ❌ `/auth/login` (sem `/api/`)
- ❌ `/metrics` (via getEndpoint, sem `/api/` em dev)  
- ❌ `/api/backends` (com `/api/`)
- ❌ `safeApiFetch(/tenants/...)` (sem `/api/`)

**DEPOIS:** Padronização total com `/api/`
- ✅ `/api/auth/login`
- ✅ `/api/metrics` 
- ✅ `/api/backends`
- ✅ `/api/tenants/...`

---

## 🛠️ Mudanças Realizadas

### 1. **Frontend - Configuração Environment**

**📁 `frontend/src/config/environment.ts`**

```typescript
// ANTES - Inconsistente
ENDPOINTS: {
  LOGIN: '/auth/login',          // ❌ Sem /api/
  METRICS: '/metrics',           // ❌ Sem /api/
  BACKENDS: '/backends',         // ❌ Sem /api/
}

// DEPOIS - Padronizado  
ENDPOINTS: {
  LOGIN: '/api/auth/login',      // ✅ Com /api/
  METRICS: '/api/metrics',       // ✅ Com /api/
  BACKENDS: '/api/backends',     // ✅ Com /api/
}
```

### 2. **Frontend - Hooks de API**

**📁 `frontend/src/hooks/use-api.ts`**

```typescript
// ANTES - Inconsistente
apiFetch('/api/backends')              // ✅ Já tinha /api/
apiFetch(getEndpoint('METRICS'))       // ❌ Retornava /metrics

// DEPOIS - Padronizado
apiFetch(getEndpoint('BACKENDS'))      // ✅ Retorna /api/backends
apiFetch(getEndpoint('METRICS'))       // ✅ Retorna /api/metrics
```

**📁 `frontend/src/hooks/useTenantMetrics.ts`**
```typescript
// ANTES
safeApiFetch(`/tenants/${tenantId}/metrics`)        // ❌

// DEPOIS  
safeApiFetch(`/api/tenants/${tenantId}/metrics`)    // ✅
```

**📁 `frontend/src/hooks/useUserManagement.ts`**
**📁 `frontend/src/hooks/useOIDCConfig.ts`**
```typescript
// Todas as chamadas convertidas de /tenants/ para /api/tenants/
```

### 3. **Backend - Rotas Padronizadas**

**📁 `backend/internal/api/api.go`**

```go
// ANTES - Inconsistente
a.router.HandleFunc("/auth/login", ...)         // ❌ Sem /api/
a.router.HandleFunc("/auth/register", ...)      // ❌ Sem /api/
apiRouter.HandleFunc("/backends", ...)          // ✅ Com /api/

// DEPOIS - Padronizado
a.router.HandleFunc("/api/auth/login", ...)     // ✅ Com /api/  
a.router.HandleFunc("/api/auth/register", ...)  // ✅ Com /api/
apiRouter.HandleFunc("/backends", ...)          // ✅ Com /api/
```

---

## 🗺️ Mapa Completo das APIs

### **Autenticação (Público - JWT)**
```
POST /api/auth/login       → handleTenantLogin
POST /api/auth/register    → handleTenantRegister  
POST /api/auth/refresh     → handleTenantRefresh
```

### **Profile (JWT Auth)**
```
GET  /api/profile          → handleGetProfile
PUT  /api/profile          → handleUpdateProfile
```

### **Core APIs (Basic Auth)**
```
GET  /api/backends         → handleListBackends
POST /api/backends         → handleAddBackend
GET  /api/pools            → handleListPools
GET  /api/cluster          → handleClusterInfo
GET  /api/config           → handleGetConfig
POST /api/reload           → handleReload
GET  /api/metrics          → (via getEndpoint)
GET  /api/health           → (via getEndpoint)
```

### **Tenant APIs (JWT Auth)**
```
GET  /api/tenants                    → handleListTenants
POST /api/tenants                    → handleCreateTenant
GET  /api/tenants/{id}               → handleGetTenant
PUT  /api/tenants/{id}               → handleUpdateTenant
DELETE /api/tenants/{id}             → handleDeleteTenant

GET  /api/tenants/{id}/users         → handleListTenantUsers  
POST /api/tenants/{id}/users         → handleAddTenantUser
GET  /api/tenants/{id}/metrics       → handleTenantMetrics
GET  /api/tenants/{id}/oidc/config   → handleGetTenantOIDCConfig
```

### **Billing APIs (JWT Auth)**
```
GET  /api/billing/subscriptions      → handleListSubscriptions
POST /api/billing/subscriptions      → handleCreateSubscription  
POST /api/billing/webhooks           → handleBillingWebhook
```

---

## 🔧 Tipos de Fetch por Tipo de API

### **`apiFetch`** - APIs Core com Basic Auth
```typescript
import { apiFetch } from '@/lib/api';

// Para APIs de infraestrutura (pools, backends, metrics, etc)
const backends = await apiFetch(getEndpoint('BACKENDS'));
const metrics = await apiFetch(getEndpoint('METRICS'));
```

### **`safeApiFetch`** - APIs Tenant com JWT + CSRF
```typescript
import { safeApiFetch } from '@/lib/csrfToken';

// Para APIs de tenant (usuários, billing, configurações, etc)
const users = await safeApiFetch(`/api/tenants/${tenantId}/users`);
const metrics = await safeApiFetch(`/api/tenants/${tenantId}/metrics`);
```

---

## 🎯 Benefícios da Padronização

### ✅ **Consistência Total**
- Todas as APIs começam com `/api/`
- Facilita configuração de proxy/load balancer
- Elimina confusão entre diferentes padrões

### ✅ **Futuro-proof**
- Preparado para migração para subdomínio (`api.veloflux.io`)
- Compatível com padrões do Next.js (`pages/api/`)
- Facilita configuração de CDN/caching

### ✅ **Segurança Clara**
- Rotas públicas: `/api/auth/*`
- Rotas básicas: `/api/*` (Basic Auth)
- Rotas tenant: `/api/tenants/*` (JWT Auth)

### ✅ **Debugging Simples**
- Logs mais claros
- Proxy rules mais simples
- Troubleshooting mais fácil

---

## 🚀 Próximos Passos

1. **Testar todas as APIs** para garantir que funcionam
2. **Atualizar documentação** das APIs no Swagger/OpenAPI
3. **Configurar proxy reverso** (Nginx/Caddy) para produção
4. **Implementar rate limiting** por prefixo (`/api/auth/*` vs `/api/tenants/*`)
5. **Adicionar monitoramento** específico por tipo de API

---

## 📋 Checklist de Verificação

- [x] ✅ Frontend: Todos os `getEndpoint()` retornam com `/api/`
- [x] ✅ Frontend: Todos os `safeApiFetch` usam `/api/tenants/`
- [x] ✅ Backend: Rotas de auth movidas para `/api/auth/`
- [x] ✅ Backend: Core APIs mantidas em `/api/`
- [x] ✅ Backend: Tenant APIs mantidas em `/api/tenants/`
- [ ] 🔄 Testar login/register nas novas rotas
- [ ] 🔄 Testar APIs de tenant
- [ ] 🔄 Testar APIs de core (backends, pools)
- [ ] 🔄 Verificar se proxy/load balancer funciona
- [ ] 🔄 Atualizar testes automatizados

---

## 🎊 Resultado Final

**Agora você tem uma arquitetura de APIs completamente padronizada e escalável!**

Todas as chamadas do frontend seguem o padrão `/api/*`, eliminando a inconsistência que estava causando problemas. O sistema está preparado para crescer e ser facilmente mantido.
