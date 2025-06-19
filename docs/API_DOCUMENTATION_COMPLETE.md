# 📡 VeloFlux API Documentation - Completa e Atualizada

## 🎯 **Visão Geral**

> **Documentação oficial das APIs do VeloFlux Load Balancer**  
> **Base URL:** `http://localhost:8080` (desenvolvimento) | `https://your-domain.com` (produção)  
> **Versão:** v1.0  
> **Autenticação:** JWT Bearer Token  

---

## 🔐 **Autenticação**

### 🔑 **Endpoints de Autenticação**

#### **Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "your_password",
  "tenant_id": "tenant_123"
}
```

**Resposta de Sucesso:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "refresh_eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "user_id": "user_123",
    "email": "user@example.com",
    "tenant_id": "tenant_123",
    "role": "admin",
    "first_name": "John",
    "last_name": "Doe"
  },
  "expires_in": 3600
}
```

#### **Registro**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "secure_password",
  "first_name": "Jane",
  "last_name": "Smith",
  "tenant_id": "tenant_123"
}
```

#### **Refresh Token**
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

#### **Perfil do Usuário**
```http
GET /api/profile
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "user_id": "user_123",
  "email": "user@example.com",
  "tenant_id": "tenant_123",
  "role": "admin",
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2025-06-19T10:00:00Z",
  "last_login": "2025-06-19T15:30:00Z"
}
```

---

## 🏊 **Pool Management**

### **Listar Pools**
```http
GET /api/pools
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "pools": [
    {
      "name": "web_servers",
      "algorithm": "weighted_round_robin",
      "sticky_sessions": true,
      "health_check": {
        "enabled": true,
        "path": "/health",
        "interval": "30s",
        "timeout": "5s"
      },
      "backends": [
        {
          "address": "192.168.1.10:8080",
          "weight": 100,
          "status": "healthy",
          "region": "us-east-1"
        }
      ]
    }
  ]
}
```

### **Criar Pool**
```http
POST /api/pools
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "api_servers",
  "algorithm": "least_connections",
  "sticky_sessions": false,
  "health_check": {
    "path": "/api/health",
    "interval": "10s",
    "timeout": "3s",
    "expected_status": 200
  }
}
```

### **Obter Pool Específico**
```http
GET /api/pools/{name}
Authorization: Bearer <token>
```

### **Atualizar Pool**
```http
PUT /api/pools/{name}
Authorization: Bearer <token>
Content-Type: application/json

{
  "algorithm": "adaptive_ai",
  "sticky_sessions": true
}
```

### **Deletar Pool**
```http
DELETE /api/pools/{name}
Authorization: Bearer <token>
```

---

## 🖥️ **Backend Management**

### **Listar Backends**
```http
GET /api/backends
Authorization: Bearer <token>
```

### **Adicionar Backend**
```http
POST /api/backends
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "192.168.1.20:8080",
  "pool": "web_servers",
  "weight": 100,
  "region": "us-west-2",
  "health_check": {
    "path": "/health",
    "interval": "30s",
    "timeout": "5s",
    "expected_status": 200
  }
}
```

### **Atualizar Backend**
```http
PUT /api/backends/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "weight": 150,
  "region": "us-east-1"
}
```

### **Remover Backend**
```http
DELETE /api/backends/{id}
Authorization: Bearer <token>
```

---

## 🛣️ **Route Management**

### **Listar Rotas**
```http
GET /api/routes
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "routes": [
    {
      "id": "route_1",
      "host": "api.example.com",
      "path_prefix": "/v1",
      "pool": "api_servers",
      "ssl_enabled": true,
      "created_at": "2025-06-19T10:00:00Z"
    }
  ]
}
```

### **Criar Rota**
```http
POST /api/routes
Authorization: Bearer <token>
Content-Type: application/json

{
  "host": "app.example.com",
  "path_prefix": "/api",
  "pool": "api_servers",
  "ssl_enabled": true
}
```

### **Atualizar Rota**
```http
PUT /api/routes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "pool": "new_api_servers",
  "ssl_enabled": true
}
```

### **Deletar Rota**
```http
DELETE /api/routes/{id}
Authorization: Bearer <token>
```

---

## 🏢 **Multi-Tenant Management**

### **Listar Tenants**
```http
GET /api/tenants
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "tenants": [
    {
      "id": "tenant_123",
      "name": "Acme Corp",
      "status": "active",
      "plan": "enterprise",
      "created_at": "2025-01-01T00:00:00Z",
      "user_count": 25,
      "usage": {
        "requests_per_month": 1000000,
        "bandwidth_gb": 500
      }
    }
  ]
}
```

### **Criar Tenant**
```http
POST /api/tenants
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "New Company",
  "plan": "professional",
  "admin_email": "admin@newcompany.com",
  "settings": {
    "max_users": 50,
    "max_requests_per_month": 500000
  }
}
```

### **Obter Tenant**
```http
GET /api/tenants/{id}
Authorization: Bearer <token>
```

### **Atualizar Tenant**
```http
PUT /api/tenants/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Company Name",
  "plan": "enterprise",
  "settings": {
    "max_users": 100
  }
}
```

### **Deletar Tenant**
```http
DELETE /api/tenants/{id}
Authorization: Bearer <token>
```

---

## 👥 **User Management (Tenant-Specific)**

### **Listar Usuários do Tenant**
```http
GET /api/tenants/{tenant_id}/users
Authorization: Bearer <token>
```

### **Adicionar Usuário ao Tenant**
```http
POST /api/tenants/{tenant_id}/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "email": "newuser@company.com",
  "first_name": "John",
  "last_name": "Doe",
  "role": "viewer",
  "password": "secure_password"
}
```

### **Atualizar Usuário**
```http
PUT /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "first_name": "Updated Name"
}
```

### **Remover Usuário**
```http
DELETE /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
```

---

## 🤖 **AI/ML APIs**

### **Métricas de IA**
```http
GET /api/ai/metrics
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "enabled": true,
  "current_algorithm": "adaptive_ai",
  "prediction_data": {
    "recommended_algorithm": "weighted_round_robin",
    "confidence": 0.85,
    "predicted_load": 750.5,
    "prediction_time": "2025-06-19T15:30:00Z",
    "optimal_backends": ["192.168.1.10:8080", "192.168.1.11:8080"],
    "scaling_recommendation": "scale_up"
  },
  "model_performance": {
    "load_predictor": {
      "accuracy": 0.92,
      "last_trained": "2025-06-19T10:00:00Z",
      "version": "1.2.0",
      "predictions_made": 15420
    }
  }
}
```

### **Status da IA**
```http
GET /api/ai/status
Authorization: Bearer <token>
```

### **Predições**
```http
GET /api/ai/predictions
Authorization: Bearer <token>
```

### **Configuração da IA**
```http
GET /api/ai/config
Authorization: Bearer <token>
```

### **Atualizar Configuração da IA**
```http
PUT /api/ai/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "enabled": true,
  "model_type": "neural_network",
  "confidence_threshold": 0.8,
  "predictive_scaling": true,
  "learning_rate": 0.001
}
```

### **Retreinar Modelo**
```http
POST /api/ai/models/{modelType}/retrain
Authorization: Bearer <token>
```

---

## 💳 **Billing APIs**

### **Listar Assinaturas**
```http
GET /api/billing/subscriptions
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "subscriptions": [
    {
      "id": "sub_123",
      "tenant_id": "tenant_123",
      "plan": "enterprise",
      "status": "active",
      "current_period_start": "2025-06-01T00:00:00Z",
      "current_period_end": "2025-07-01T00:00:00Z",
      "amount": 99.99,
      "currency": "USD"
    }
  ]
}
```

### **Criar Assinatura**
```http
POST /api/billing/subscriptions
Authorization: Bearer <token>
Content-Type: application/json

{
  "plan": "professional",
  "payment_method": "card_123",
  "billing_cycle": "monthly"
}
```

### **Listar Faturas**
```http
GET /api/billing/invoices
Authorization: Bearer <token>
```

### **Webhook de Billing**
```http
POST /api/billing/webhooks
Content-Type: application/json

{
  "type": "invoice.payment_succeeded",
  "data": {
    "object": {
      "id": "inv_123",
      "amount_paid": 9999,
      "currency": "usd"
    }
  }
}
```

---

## 📊 **Monitoring & Metrics**

### **Métricas do Tenant**
```http
GET /api/tenants/{tenant_id}/metrics
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "requests_per_second": 125.4,
  "response_time_avg": 45.2,
  "error_rate": 0.02,
  "bandwidth_usage": {
    "inbound_mb": 1024.5,
    "outbound_mb": 2048.7
  },
  "top_endpoints": [
    {
      "path": "/api/users",
      "requests": 15420,
      "avg_response_time": 32.1
    }
  ]
}
```

### **Logs do Tenant**
```http
GET /api/tenants/{tenant_id}/logs?limit=100&level=error
Authorization: Bearer <token>
```

### **Usage do Tenant**
```http
GET /api/tenants/{tenant_id}/usage
Authorization: Bearer <token>
```

### **Status do Tenant**
```http
GET /api/tenants/{tenant_id}/status
Authorization: Bearer <token>
```

---

## 🔧 **OIDC Configuration**

### **Obter Configuração OIDC**
```http
GET /api/tenants/{tenant_id}/oidc/config
Authorization: Bearer <token>
```

### **Atualizar Configuração OIDC**
```http
PUT /api/tenants/{tenant_id}/oidc/config
Authorization: Bearer <token>
Content-Type: application/json

{
  "provider_url": "https://auth0.example.com",
  "client_id": "your_client_id",
  "client_secret": "your_client_secret",
  "redirect_uri": "https://app.example.com/callback",
  "scopes": ["openid", "profile", "email"]
}
```

### **Testar Configuração OIDC**
```http
POST /api/tenants/{tenant_id}/oidc/test
Authorization: Bearer <token>
```

---

## 🏥 **Health & Status**

### **Health Check Geral**
```http
GET /health
```

**Resposta:**
```json
{
  "status": "healthy",
  "timestamp": "2025-06-19T15:30:00Z",
  "version": "1.0.0",
  "uptime": "72h30m15s",
  "components": {
    "database": "healthy",
    "redis": "healthy",
    "load_balancer": "healthy",
    "ai_engine": "healthy"
  }
}
```

### **Status do Cluster**
```http
GET /api/cluster
Authorization: Bearer <token>
```

### **Configuração Geral**
```http
GET /api/status
Authorization: Bearer <token>
```

---

## 🚫 **Códigos de Erro**

| Código | Significado | Exemplo |
|--------|-------------|---------|
| `200` | Success | Operação bem-sucedida |
| `201` | Created | Recurso criado |
| `400` | Bad Request | Dados inválidos |
| `401` | Unauthorized | Token inválido/expirado |
| `403` | Forbidden | Sem permissão |
| `404` | Not Found | Recurso não encontrado |
| `409` | Conflict | Recurso já existe |
| `422` | Validation Error | Erro de validação |
| `500` | Internal Error | Erro interno do servidor |

### **Formato de Erro Padrão**
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Email is required",
  "details": {
    "field": "email",
    "constraint": "required"
  },
  "timestamp": "2025-06-19T15:30:00Z"
}
```

---

## 🔒 **Segurança**

### **Headers de Autenticação**
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

### **Rate Limiting**
- **Limite padrão:** 1000 requests/hour por token
- **Headers de resposta:**
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  ```

### **CORS**
- **Origins permitidas:** Configurável por tenant
- **Methods:** GET, POST, PUT, DELETE, OPTIONS
- **Headers:** Authorization, Content-Type

---

## 🔗 **URLs e Portas**

### **Ambiente de Desenvolvimento**
- **Backend API:** `http://localhost:8080`
- **Frontend:** `http://localhost:3000`
- **Métricas:** `http://localhost:9090`
- **Dashboard:** `http://localhost:8081`

### **Ambiente de Produção**
- **API:** `https://api.veloflux.io`
- **Dashboard:** `https://dashboard.veloflux.io`
- **Docs:** `https://docs.veloflux.io`

---

**📚 Documentação atualizada em 19/06/2025**  
**🔄 Versão da API: v1.0**  
**📧 Suporte: contact@veloflux.io**
