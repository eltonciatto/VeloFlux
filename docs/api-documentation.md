# 📚 Documentação das APIs VeloFlux

## 🚀 Visão Geral

O VeloFlux oferece APIs robustas para autenticação JWT, gerenciamento de tenants e billing, com integração completa ao Redis para armazenamento eficiente.

## 🔑 Autenticação

Todas as APIs protegidas requerem autenticação JWT via header `Authorization: Bearer <token>`.

### Base URL
```
http://localhost:9090
```

## 📍 Endpoints

### 🔐 Autenticação

#### POST /auth/register
Registra um novo usuário e tenant.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword",
  "first_name": "Admin",
  "last_name": "User",
  "tenant_name": "My Company",
  "plan": "free"
}
```

**Response (201):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user_1750121744069924249",
    "email": "admin@company.com",
    "tenant_id": "tenant_1750121744069922346",
    "role": "owner",
    "first_name": "Admin",
    "last_name": "User"
  },
  "expires_at": "2025-06-18T00:55:44.07060012Z"
}
```

#### POST /auth/login
Autentica usuário existente.

**Request:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user_1750121744069924249",
    "email": "admin@company.com",
    "tenant_id": "tenant_1750121744069922346",
    "role": "owner",
    "first_name": "Admin",
    "last_name": "User"
  },
  "expires_at": "2025-06-18T00:55:44.07060012Z"
}
```

#### POST /auth/refresh
Renova token JWT existente.

**Headers:**
```
Authorization: Bearer <current_token>
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "user_id": "user_1750121744069924249",
    "email": "admin@company.com",
    "tenant_id": "tenant_1750121744069922346",
    "role": "owner",
    "first_name": "Admin",
    "last_name": "User"
  },
  "expires_at": "2025-06-18T01:00:44.07060012Z"
}
```

### 🏢 Gestão de Tenants

#### GET /api/tenants
Lista todos os tenants acessíveis ao usuário.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "tenant_1750121744069922346",
      "name": "My Company",
      "plan": "premium",
      "active": true,
      "created_at": "2025-06-17T00:55:44.069207335Z",
      "limits": {
        "max_requests_per_second": 100,
        "max_burst_size": 200,
        "max_bandwidth_mb_per_day": 10000,
        "max_routes": 50,
        "max_backends": 100,
        "waf_level": "advanced"
      },
      "contact_email": "admin@company.com"
    }
  ],
  "total_count": 1,
  "page": 1,
  "page_size": 10,
  "has_more": false
}
```

#### GET /api/tenants/{id}
Obtém informações de um tenant específico.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "id": "tenant_1750121744069922346",
  "name": "My Company",
  "plan": "premium",
  "active": true,
  "created_at": "2025-06-17T00:55:44.069207335Z",
  "limits": {
    "max_requests_per_second": 100,
    "max_burst_size": 200,
    "max_bandwidth_mb_per_day": 10000,
    "max_routes": 50,
    "max_backends": 100,
    "waf_level": "advanced"
  },
  "contact_email": "admin@company.com"
}
```

#### POST /api/tenants
Cria um novo tenant (apenas para owners).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "New Company",
  "plan": "premium",
  "owner_email": "owner@newcompany.com",
  "owner_name": "Owner Name"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Tenant created successfully",
  "data": {
    "id": "tenant_1750121800000000000",
    "name": "New Company",
    "plan": "premium",
    "active": true,
    "created_at": "2025-06-17T01:00:00.000000000Z",
    "limits": {
      "max_requests_per_second": 100,
      "max_burst_size": 200,
      "max_bandwidth_mb_per_day": 10000,
      "max_routes": 50,
      "max_backends": 100,
      "waf_level": "advanced"
    },
    "contact_email": ""
  }
}
```

#### PUT /api/tenants/{id}
Atualiza informações de um tenant (owners/admins).

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Updated Company Name",
  "plan": "enterprise"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tenant updated successfully",
  "data": {
    "id": "tenant_1750121744069922346",
    "name": "Updated Company Name",
    "plan": "enterprise",
    "active": true,
    "created_at": "2025-06-17T00:55:44.069207335Z",
    "limits": {
      "max_requests_per_second": 1000,
      "max_burst_size": 2000,
      "max_bandwidth_mb_per_day": 100000,
      "max_routes": 500,
      "max_backends": 1000,
      "waf_level": "enterprise"
    },
    "contact_email": "admin@company.com"
  }
}
```

#### DELETE /api/tenants/{id}
Remove um tenant (apenas owners).

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Tenant deleted successfully"
}
```

### 💰 Gestão de Billing

#### GET /api/billing/subscriptions
Lista subscriptions do tenant.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "items": [
    {
      "tenant_id": "tenant_1750121744069922346",
      "customer_id": "cus_stripe_customer_id",
      "subscription_id": "sub_1750121800000000000",
      "plan": "premium",
      "status": "active",
      "current_period_start": "2025-06-17T01:00:00.000000000Z",
      "current_period_end": "2025-07-17T01:00:00.000000000Z",
      "cancel_at_period_end": false,
      "trial_end": "0001-01-01T00:00:00Z",
      "created_at": "2025-06-17T01:00:00.000000000Z",
      "updated_at": "2025-06-17T01:00:00.000000000Z"
    }
  ],
  "total_count": 1,
  "page": 1,
  "page_size": 50,
  "has_more": false
}
```

#### POST /api/billing/subscriptions
Cria nova subscription.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "plan": "premium",
  "billing_cycle": "monthly"
}
```

**Response (201):**
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "data": {
    "tenant_id": "tenant_1750121744069922346",
    "customer_id": "",
    "subscription_id": "sub_1750121800000000000",
    "plan": "premium",
    "status": "active",
    "current_period_start": "2025-06-17T01:00:00.000000000Z",
    "current_period_end": "2025-07-17T01:00:00.000000000Z",
    "cancel_at_period_end": false,
    "trial_end": "0001-01-01T00:00:00Z",
    "created_at": "2025-06-17T01:00:00.000000000Z",
    "updated_at": "2025-06-17T01:00:00.000000000Z"
  }
}
```

#### GET /api/billing/subscriptions/{id}
Obtém subscription específica.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "tenant_id": "tenant_1750121744069922346",
  "customer_id": "cus_stripe_customer_id",
  "subscription_id": "sub_1750121800000000000",
  "plan": "premium",
  "status": "active",
  "current_period_start": "2025-06-17T01:00:00.000000000Z",
  "current_period_end": "2025-07-17T01:00:00.000000000Z",
  "cancel_at_period_end": false,
  "trial_end": "0001-01-01T00:00:00Z",
  "created_at": "2025-06-17T01:00:00.000000000Z",
  "updated_at": "2025-06-17T01:00:00.000000000Z"
}
```

#### PUT /api/billing/subscriptions/{id}
Atualiza subscription.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "plan": "enterprise"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription updated successfully",
  "data": {
    "tenant_id": "tenant_1750121744069922346",
    "subscription_id": "sub_1750121800000000000",
    "plan": "enterprise",
    "status": "active",
    "current_period_start": "2025-06-17T01:00:00.000000000Z",
    "current_period_end": "2025-07-17T01:00:00.000000000Z",
    "cancel_at_period_end": false,
    "created_at": "2025-06-17T01:00:00.000000000Z",
    "updated_at": "2025-06-17T01:00:00.000000000Z"
  }
}
```

#### DELETE /api/billing/subscriptions/{id}
Cancela subscription.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "success": true,
  "message": "Subscription cancelled successfully"
}
```

#### GET /api/billing/invoices
Lista invoices do tenant.

**Headers:**
```
Authorization: Bearer <token>
```

**Response (200):**
```json
{
  "items": [
    {
      "id": "inv_tenant_1750121744069922346_1750121800",
      "tenant_id": "tenant_1750121744069922346",
      "subscription_id": "sub_1750121800000000000",
      "amount_due": 2900,
      "currency": "USD",
      "status": "paid",
      "period_start": "2025-06-17T01:00:00.000000000Z",
      "period_end": "2025-07-17T01:00:00.000000000Z",
      "created_at": "2025-06-17T01:00:00.000000000Z",
      "paid_at": "2025-06-17T01:00:00.000000000Z"
    }
  ],
  "total_count": 1,
  "page": 1,
  "page_size": 20,
  "has_more": false
}
```

#### POST /api/billing/webhooks
Webhook público para eventos de billing.

**Request:**
```json
{
  "type": "subscription.updated",
  "data": {
    "subscription_id": "sub_1750121800000000000",
    "status": "active"
  }
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## 🔐 Segurança

### Autorização

- **Public routes**: `/auth/login`, `/auth/register`, `/health`, `/api/billing/webhooks`
- **Authenticated routes**: Requerem token JWT válido
- **Role-based routes**: 
  - `owner`: Pode criar/deletar tenants, cancelar subscriptions
  - `admin`: Pode atualizar tenants e subscriptions
  - `user`: Acesso apenas de leitura

### Middleware de Autenticação

Todas as rotas protegidas passam pelo middleware JWT que:

1. Verifica presença do header `Authorization`
2. Valida formato `Bearer <token>`
3. Verifica assinatura e expiração do token
4. Extrai informações do usuário do token
5. Adiciona contexto de usuário à requisição

### Middleware de Autorização

Rotas que requerem roles específicos verificam:

1. Role do usuário no token JWT
2. Permissões necessárias para a operação
3. Acesso ao tenant específico

## 🗄️ Integração Redis

### Chaves Utilizadas

- `vf:user:{user_id}`: Informações do usuário
- `vf:user:email:{email}`: Mapeamento email → user_id
- `vf:user:pwd:{user_id}`: Hash da senha
- `vf:tenant:{tenant_id}`: Informações do tenant
- `vf:tenant:{tenant_id}:users`: Lista de usuários do tenant
- `vf:billing:subscription:{subscription_id}`: Dados da subscription
- `vf:billing:tenant:{tenant_id}`: Subscriptions do tenant

### Exemplo de Dados

**Usuário:**
```json
{
  "user_id": "user_1750121744069924249",
  "email": "admin@company.com",
  "tenant_id": "tenant_1750121744069922346",
  "role": "owner",
  "first_name": "Admin",
  "last_name": "User",
  "created_at": "2025-06-17T00:55:44.069207335Z"
}
```

**Tenant:**
```json
{
  "id": "tenant_1750121744069922346",
  "name": "My Company",
  "plan": "premium",
  "active": true,
  "created_at": "2025-06-17T00:55:44.069207335Z",
  "limits": {
    "max_requests_per_second": 100,
    "max_burst_size": 200,
    "max_bandwidth_mb_per_day": 10000,
    "max_routes": 50,
    "max_backends": 100,
    "waf_level": "advanced"
  },
  "contact_email": "admin@company.com"
}
```

## 🧪 Exemplos de Uso

### Fluxo Completo de Registro e Uso

```bash
# 1. Registrar usuário
curl -X POST http://localhost:9090/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@mycompany.com",
    "password": "securepass123",
    "first_name": "Admin",
    "last_name": "User",
    "tenant_name": "My Company",
    "plan": "premium"
  }'

# 2. Extrair token da resposta
export JWT_TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 3. Listar tenants
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:9090/api/tenants

# 4. Criar subscription
curl -X POST http://localhost:9090/api/billing/subscriptions \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "enterprise",
    "billing_cycle": "yearly"
  }'

# 5. Listar invoices
curl -H "Authorization: Bearer $JWT_TOKEN" \
  http://localhost:9090/api/billing/invoices
```

### Gestão de Tenants

```bash
# Criar tenant adicional
curl -X POST http://localhost:9090/api/tenants \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Second Company",
    "plan": "premium",
    "owner_email": "owner@secondcompany.com",
    "owner_name": "Second Owner"
  }'

# Atualizar tenant
curl -X PUT http://localhost:9090/api/tenants/tenant_id \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Updated Company Name",
    "plan": "enterprise"
  }'
```

## 📊 Códigos de Status

- `200 OK`: Operação realizada com sucesso
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Dados inválidos na requisição
- `401 Unauthorized`: Token ausente ou inválido
- `403 Forbidden`: Permissões insuficientes
- `404 Not Found`: Recurso não encontrado
- `409 Conflict`: Conflito (ex: email já existe)
- `500 Internal Server Error`: Erro interno do servidor

## 🔧 Configuração

### Variáveis de Ambiente

```bash
# JWT
JWT_SECRET=your-super-secure-secret
JWT_EXPIRY=12h

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Servidor
PORT=9090
ENVIRONMENT=production
```

### Desenvolvimento

```bash
# Iniciar ambiente completo
docker-compose up -d

# Apenas backend e Redis
docker-compose up -d backend redis

# Logs do backend
docker-compose logs -f backend
```
