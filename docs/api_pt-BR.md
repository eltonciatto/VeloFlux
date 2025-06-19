# 📡 Documentação da API VeloFlux (PT-BR)

## 🎯 **Visão Geral**

> **Documentação oficial das APIs do VeloFlux Load Balancer em Português Brasileiro**  
> **URL Base:** `http://localhost:8080` (desenvolvimento) | `https://api.veloflux.io` (produção)  
> **Versão:** v1.0  
> **Autenticação:** JWT Bearer Token  

O VeloFlux fornece uma API RESTful completa para gerenciar load balancers, pools de servidores, autenticação, multi-tenancy, recursos de IA/ML e muito mais.

---

## 🔐 **Autenticação**

### 🔑 **Fazer Login**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "usuario@exemplo.com",
  "password": "sua_senha",
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
    "email": "usuario@exemplo.com",
    "tenant_id": "tenant_123",
    "role": "admin",
    "first_name": "João",
    "last_name": "Silva"
  },
  "expires_in": 3600
}
```

### 📝 **Registrar Novo Usuário**
```http
POST /auth/register
Content-Type: application/json

{
  "email": "novousuario@exemplo.com",
  "password": "senha_segura",
  "first_name": "Maria",
  "last_name": "Santos",
  "tenant_id": "tenant_123"
}
```

### 🔄 **Renovar Token**
```http
POST /auth/refresh
Authorization: Bearer <refresh_token>
```

### 👤 **Obter Perfil do Usuário**
```http
GET /api/profile
Authorization: Bearer <token>
```

**Resposta:**
```json
{
  "user_id": "user_123",
  "email": "usuario@exemplo.com",
  "tenant_id": "tenant_123",
  "role": "admin",
  "first_name": "João",
  "last_name": "Silva",
  "created_at": "2025-06-19T10:00:00Z",
  "last_login": "2025-06-19T15:30:00Z"
}
```

---

## 🏊 **Gerenciamento de Pools**

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
      "name": "servidores_web",
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
  "name": "servidores_api",
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
GET /api/pools/{nome}
Authorization: Bearer <token>
```

### **Atualizar Pool**
```http
PUT /api/pools/{nome}
Authorization: Bearer <token>
Content-Type: application/json

{
  "algorithm": "adaptive_ai",
  "sticky_sessions": true
}
```

### **Deletar Pool**
```http
DELETE /api/pools/{nome}
Authorization: Bearer <token>
```

---

## 🖥️ **Gerenciamento de Backends**

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
  "pool": "servidores_web",
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

## 🛣️ **Gerenciamento de Rotas**

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
      "host": "api.exemplo.com",
      "path_prefix": "/v1",
      "pool": "servidores_api",
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
  "host": "app.exemplo.com",
  "path_prefix": "/api",
  "pool": "servidores_api",
  "ssl_enabled": true
}
```

### **Atualizar Rota**
```http
PUT /api/routes/{id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "pool": "novos_servidores_api",
  "ssl_enabled": true
}
```

### **Deletar Rota**
```http
DELETE /api/routes/{id}
Authorization: Bearer <token>
```

---

## 🏢 **Gerenciamento Multi-Tenant**

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
      "name": "Empresa XYZ",
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
  "name": "Nova Empresa",
  "plan": "professional",
  "admin_email": "admin@novaempresa.com",
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
  "name": "Nome da Empresa Atualizado",
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

## 👥 **Gerenciamento de Usuários (Por Tenant)**

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
  "email": "novousuario@empresa.com",
  "first_name": "João",
  "last_name": "Silva",
  "role": "viewer",
  "password": "senha_segura"
}
```

### **Atualizar Usuário**
```http
PUT /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
Content-Type: application/json

{
  "role": "admin",
  "first_name": "Nome Atualizado"
}
```

### **Remover Usuário**
```http
DELETE /api/tenants/{tenant_id}/users/{user_id}
Authorization: Bearer <token>
```

---

## 🤖 **APIs de IA/ML**

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
POST /api/ai/models/{tipoModelo}/retrain
Authorization: Bearer <token>
```

---

## 💳 **APIs de Cobrança/Billing**

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

### **Webhook de Cobrança**
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

## 📊 **Monitoramento e Métricas**

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

### **Uso do Tenant**
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

## 🔧 **Configuração OIDC**

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
  "provider_url": "https://auth0.exemplo.com",
  "client_id": "seu_client_id",
  "client_secret": "seu_client_secret",
  "redirect_uri": "https://app.exemplo.com/callback",
  "scopes": ["openid", "profile", "email"]
}
```

### **Testar Configuração OIDC**
```http
POST /api/tenants/{tenant_id}/oidc/test
Authorization: Bearer <token>
```

---

## 🏥 **Saúde e Status**

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

## 💻 **Exemplos de Uso no Frontend**

### **Autenticação JavaScript/TypeScript**
```javascript
// Login
const login = async (email, password, tenantId) => {
  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        tenant_id: tenantId
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('refreshToken', data.refresh_token);
      return data;
    }
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
};

// Fazer requisição autenticada
const makeAuthenticatedRequest = async (url, options = {}) => {
  const token = localStorage.getItem('authToken');
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...options.headers
    }
  });
  
  if (response.status === 401) {
    // Token expirado, renovar
    await refreshToken();
    return makeAuthenticatedRequest(url, options);
  }
  
  return response;
};

// Listar pools
const getPools = async () => {
  const response = await makeAuthenticatedRequest('/api/pools');
  return response.json();
};

// Criar pool
const createPool = async (poolData) => {
  const response = await makeAuthenticatedRequest('/api/pools', {
    method: 'POST',
    body: JSON.stringify(poolData)
  });
  return response.json();
};
```

### **Usando React Hooks**
```typescript
// Hook customizado para API
import { useState, useEffect } from 'react';

interface Pool {
  name: string;
  algorithm: string;
  backends: Backend[];
}

export const usePools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true);
        const response = await makeAuthenticatedRequest('/api/pools');
        const data = await response.json();
        setPools(data.pools);
      } catch (err) {
        setError('Erro ao carregar pools');
      } finally {
        setLoading(false);
      }
    };

    fetchPools();
  }, []);

  const createPool = async (poolData: Partial<Pool>) => {
    try {
      const response = await makeAuthenticatedRequest('/api/pools', {
        method: 'POST',
        body: JSON.stringify(poolData)
      });
      
      if (response.ok) {
        const newPool = await response.json();
        setPools(prev => [...prev, newPool]);
        return newPool;
      }
    } catch (err) {
      setError('Erro ao criar pool');
      throw err;
    }
  };

  return { pools, loading, error, createPool };
};
```

---

## 🚫 **Códigos de Erro**

| Código | Significado | Exemplo de Uso |
|--------|-------------|----------------|
| `200` | Sucesso | Operação bem-sucedida |
| `201` | Criado | Recurso criado com sucesso |
| `400` | Requisição Inválida | Dados inválidos ou malformados |
| `401` | Não Autorizado | Token inválido ou expirado |
| `403` | Acesso Negado | Sem permissão para o recurso |
| `404` | Não Encontrado | Recurso não existe |
| `409` | Conflito | Recurso já existe (ex: email duplicado) |
| `422` | Erro de Validação | Dados não passaram na validação |
| `500` | Erro Interno | Erro interno do servidor |

### **Formato de Erro Padrão**
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Email é obrigatório",
  "details": {
    "field": "email",
    "constraint": "required"
  },
  "timestamp": "2025-06-19T15:30:00Z"
}
```

---

## � **Exemplos de Uso no Frontend**

### **Cliente JavaScript/TypeScript Avançado**
```javascript
// Cliente API VeloFlux com recursos profissionais
class VeloFluxAPI {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  // Login
  async login(email, password, tenantId) {
    try {
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          tenant_id: tenantId
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.token = data.token;
        this.refreshToken = data.refresh_token;
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('refreshToken', data.refresh_token);
        return data;
      } else {
        throw new Error(data.message || 'Falha no login');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      throw error;
    }
  }

  // Renovar token
  async renovarToken() {
    try {
      const response = await fetch(`${this.baseURL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.refreshToken}`,
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        this.token = data.token;
        localStorage.setItem('authToken', data.token);
        return data;
      }
    } catch (error) {
      console.error('Erro ao renovar token:', error);
      this.logout();
      throw error;
    }
  }

  // Fazer requisição autenticada com retry automático
  async fazerRequisicaoAutenticada(url, options = {}) {
    const requestOptions = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json',
        ...options.headers
      }
    };

    let response = await fetch(`${this.baseURL}${url}`, requestOptions);
    
    // Retry automático com renovação de token em caso de 401
    if (response.status === 401 && this.refreshToken) {
      await this.renovarToken();
      requestOptions.headers.Authorization = `Bearer ${this.token}`;
      response = await fetch(`${this.baseURL}${url}`, requestOptions);
    }
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}`);
    }
    
    return response;
  }

  // Logout
  logout() {
    this.token = null;
    this.refreshToken = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('refreshToken');
  }

  // Operações de Pool
  async obterPools() {
    const response = await this.fazerRequisicaoAutenticada('/api/pools');
    return response.json();
  }

  async criarPool(dadosPool) {
    const response = await this.fazerRequisicaoAutenticada('/api/pools', {
      method: 'POST',
      body: JSON.stringify(dadosPool)
    });
    return response.json();
  }

  async atualizarPool(nomePool, dadosAtualizacao) {
    const response = await this.fazerRequisicaoAutenticada(`/api/pools/${nomePool}`, {
      method: 'PUT',
      body: JSON.stringify(dadosAtualizacao)
    });
    return response.json();
  }

  async excluirPool(nomePool) {
    const response = await this.fazerRequisicaoAutenticada(`/api/pools/${nomePool}`, {
      method: 'DELETE'
    });
    return response.ok;
  }

  // Operações de Backend
  async adicionarBackend(dadosBackend) {
    const response = await this.fazerRequisicaoAutenticada('/api/backends', {
      method: 'POST',
      body: JSON.stringify(dadosBackend)
    });
    return response.json();
  }

  // Operações de IA/ML
  async obterMetricasIA() {
    const response = await this.fazerRequisicaoAutenticada('/api/ai/metrics');
    return response.json();
  }

  async atualizarConfigIA(dadosConfig) {
    const response = await this.fazerRequisicaoAutenticada('/api/ai/config', {
      method: 'PUT',
      body: JSON.stringify(dadosConfig)
    });
    return response.json();
  }

  // Operações de Tenant
  async obterMetricasTenant(tenantId) {
    const response = await this.fazerRequisicaoAutenticada(`/api/tenants/${tenantId}/metrics`);
    return response.json();
  }

  async obterUsoTenant(tenantId) {
    const response = await this.fazerRequisicaoAutenticada(`/api/tenants/${tenantId}/usage`);
    return response.json();
  }
}

// Exemplo de uso
const api = new VeloFluxAPI();

// Login e buscar pools
async function inicializarApp() {
  try {
    await api.login('usuario@exemplo.com', 'senha', 'tenant_123');
    const pools = await api.obterPools();
    console.log('Pools disponíveis:', pools);
  } catch (error) {
    console.error('Falha na inicialização:', error);
  }
}
```

### **Usando React Hooks Otimizados**
```typescript
// Hook personalizado com recursos avançados
import { useState, useEffect, useCallback, useRef } from 'react';

interface Pool {
  name: string;
  algorithm: string;
  backends: Backend[];
  sticky_sessions: boolean;
  health_check: HealthCheck;
}

interface Backend {
  address: string;
  weight: number;
  status: 'healthy' | 'unhealthy' | 'unknown';
  region?: string;
}

interface HealthCheck {
  enabled: boolean;
  path: string;
  interval: string;
  timeout: string;
  expected_status?: number;
}

// Hook avançado com tratamento de erros e cache
export const usePools = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const apiRef = useRef(new VeloFluxAPI());

  const buscarPools = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);
      
      // Cancelar requisição anterior
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      abortControllerRef.current = new AbortController();
      
      const data = await apiRef.current.obterPools();
      setPools(data.pools || []);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        setErro(err.message || 'Erro ao carregar pools');
      }
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    buscarPools();
    
    // Limpeza ao desmontar
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [buscarPools]);

  const criarPool = useCallback(async (dadosPool: Partial<Pool>) => {
    try {
      setErro(null);
      const novoPool = await apiRef.current.criarPool(dadosPool);
      setPools(prev => [...prev, novoPool]);
      return novoPool;
    } catch (err: any) {
      setErro(err.message || 'Erro ao criar pool');
      throw err;
    }
  }, []);

  const atualizarPool = useCallback(async (nomePool: string, dadosAtualizacao: Partial<Pool>) => {
    try {
      setErro(null);
      const poolAtualizado = await apiRef.current.atualizarPool(nomePool, dadosAtualizacao);
      setPools(prev => prev.map(pool => 
        pool.name === nomePool ? { ...pool, ...poolAtualizado } : pool
      ));
      return poolAtualizado;
    } catch (err: any) {
      setErro(err.message || 'Erro ao atualizar pool');
      throw err;
    }
  }, []);

  const excluirPool = useCallback(async (nomePool: string) => {
    try {
      setErro(null);
      await apiRef.current.excluirPool(nomePool);
      setPools(prev => prev.filter(pool => pool.name !== nomePool));
    } catch (err: any) {
      setErro(err.message || 'Erro ao excluir pool');
      throw err;
    }
  }, []);

  const atualizar = useCallback(() => {
    buscarPools();
  }, [buscarPools]);

  return { 
    pools, 
    carregando, 
    erro, 
    criarPool, 
    atualizarPool, 
    excluirPool, 
    atualizar 
  };
};

// Hook para métricas de IA
export const useMetricasIA = (intervaloMs: number = 30000) => {
  const [metricas, setMetricas] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const apiRef = useRef(new VeloFluxAPI());

  useEffect(() => {
    const buscarMetricas = async () => {
      try {
        setErro(null);
        const data = await apiRef.current.obterMetricasIA();
        setMetricas(data);
      } catch (err: any) {
        setErro(err.message || 'Erro ao carregar métricas de IA');
      } finally {
        setCarregando(false);
      }
    };

    buscarMetricas();
    const interval = setInterval(buscarMetricas, intervaloMs);

    return () => clearInterval(interval);
  }, [intervaloMs]);

  return { metricas, carregando, erro };
};

// Exemplo de uso em componente React
function GerenciamentoPools() {
  const { pools, carregando, erro, criarPool, excluirPool, atualizar } = usePools();
  const { metricas: metricasIA } = useMetricasIA();

  const handleCriarPool = async () => {
    try {
      await criarPool({
        name: 'novo-pool',
        algorithm: 'round_robin',
        sticky_sessions: false,
        health_check: {
          enabled: true,
          path: '/health',
          interval: '30s',
          timeout: '5s'
        }
      });
      alert('Pool criado com sucesso!');
    } catch (error) {
      alert('Falha ao criar pool');
    }
  };

  if (carregando) return <div>Carregando pools...</div>;
  if (erro) return <div>Erro: {erro}</div>;

  return (
    <div>
      <h2>Gerenciamento de Pools</h2>
      <button onClick={handleCriarPool}>Criar Novo Pool</button>
      <button onClick={atualizar}>Atualizar</button>
      
      {metricasIA && (
        <div>
          <h3>Recomendações de IA</h3>
          <p>Algoritmo Recomendado: {metricasIA.prediction_data?.recommended_algorithm}</p>
          <p>Confiança: {(metricasIA.prediction_data?.confidence * 100).toFixed(1)}%</p>
        </div>
      )}
      
      <ul>
        {pools.map(pool => (
          <li key={pool.name}>
            <strong>{pool.name}</strong> - {pool.algorithm}
            <button onClick={() => excluirPool(pool.name)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

---

## 🤖 **Automação e Scripts**

### **Scripts Bash/Shell**
```bash
#!/bin/bash
# Script de Gerenciamento VeloFlux

VELOFLUX_API="http://localhost:8080"
TOKEN=""

# Função de login
login() {
    local email="$1"
    local password="$2"
    local tenant_id="$3"
    
    response=$(curl -s -X POST "${VELOFLUX_API}/auth/login" \
        -H "Content-Type: application/json" \
        -d "{\"email\":\"$email\",\"password\":\"$password\",\"tenant_id\":\"$tenant_id\"}")
    
    TOKEN=$(echo "$response" | jq -r '.token')
    
    if [ "$TOKEN" = "null" ]; then
        echo "Falha no login!"
        exit 1
    fi
    
    echo "Login realizado com sucesso!"
}

# Função para criar pool
criar_pool() {
    local nome_pool="$1"
    local algoritmo="$2"
    
    curl -s -X POST "${VELOFLUX_API}/api/pools" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"name\":\"$nome_pool\",
            \"algorithm\":\"$algoritmo\",
            \"sticky_sessions\":false,
            \"health_check\":{
                \"enabled\":true,
                \"path\":\"/health\",
                \"interval\":\"30s\",
                \"timeout\":\"5s\"
            }
        }" | jq '.'
}

# Função para adicionar backend
adicionar_backend() {
    local endereco="$1"
    local pool="$2"
    local peso="$3"
    
    curl -s -X POST "${VELOFLUX_API}/api/backends" \
        -H "Authorization: Bearer $TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"address\":\"$endereco\",
            \"pool\":\"$pool\",
            \"weight\":$peso
        }" | jq '.'
}

# Função para listar pools
listar_pools() {
    curl -s -X GET "${VELOFLUX_API}/api/pools" \
        -H "Authorization: Bearer $TOKEN" | jq '.pools[]'
}

# Obter métricas de IA
obter_metricas_ia() {
    curl -s -X GET "${VELOFLUX_API}/api/ai/metrics" \
        -H "Authorization: Bearer $TOKEN" | jq '.'
}

# Verificação de saúde
verificar_saude() {
    curl -s -X GET "${VELOFLUX_API}/health" | jq '.'
}

# Execução principal
if [ "$#" -eq 0 ]; then
    echo "Uso: $0 <comando> [argumentos...]"
    echo "Comandos:"
    echo "  login <email> <senha> <tenant_id>"
    echo "  criar-pool <nome> <algoritmo>"
    echo "  adicionar-backend <endereco> <pool> <peso>"
    echo "  listar-pools"
    echo "  metricas-ia"
    echo "  saude"
    exit 1
fi

case "$1" in
    "login")
        login "$2" "$3" "$4"
        ;;
    "criar-pool")
        criar_pool "$2" "$3"
        ;;
    "adicionar-backend")
        adicionar_backend "$2" "$3" "$4"
        ;;
    "listar-pools")
        listar_pools
        ;;
    "metricas-ia")
        obter_metricas_ia
        ;;
    "saude")
        verificar_saude
        ;;
    *)
        echo "Comando desconhecido: $1"
        exit 1
        ;;
esac
```

### **Scripts Python**
```python
#!/usr/bin/env python3
"""
Cliente API VeloFlux para Python
"""
import requests
import json
import time
from typing import Dict, List, Optional

class ClienteVeloFlux:
    def __init__(self, base_url: str = "http://localhost:8080"):
        self.base_url = base_url.rstrip('/')
        self.token = None
        self.refresh_token = None
        self.session = requests.Session()
    
    def login(self, email: str, password: str, tenant_id: str) -> Dict:
        """Autenticar com a API VeloFlux"""
        response = self.session.post(
            f"{self.base_url}/auth/login",
            json={
                "email": email,
                "password": password,
                "tenant_id": tenant_id
            }
        )
        response.raise_for_status()
        
        data = response.json()
        if data.get('success'):
            self.token = data['token']
            self.refresh_token = data['refresh_token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
        
        return data
    
    def renovar_token(self) -> bool:
        """Renovar token de autenticação"""
        if not self.refresh_token:
            return False
        
        try:
            response = self.session.post(
                f"{self.base_url}/auth/refresh",
                headers={'Authorization': f'Bearer {self.refresh_token}'}
            )
            response.raise_for_status()
            
            data = response.json()
            self.token = data['token']
            self.session.headers.update({
                'Authorization': f'Bearer {self.token}'
            })
            return True
        except:
            return False
    
    def _fazer_requisicao(self, method: str, endpoint: str, **kwargs) -> requests.Response:
        """Fazer requisição autenticada com retry automático"""
        url = f"{self.base_url}{endpoint}"
        response = self.session.request(method, url, **kwargs)
        
        # Retry automático em caso de 401
        if response.status_code == 401 and self.renovar_token():
            response = self.session.request(method, url, **kwargs)
        
        response.raise_for_status()
        return response
    
    # Gerenciamento de pools
    def obter_pools(self) -> List[Dict]:
        response = self._fazer_requisicao('GET', '/api/pools')
        return response.json().get('pools', [])
    
    def criar_pool(self, nome: str, algoritmo: str, **kwargs) -> Dict:
        dados_pool = {
            'name': nome,
            'algorithm': algoritmo,
            **kwargs
        }
        response = self._fazer_requisicao('POST', '/api/pools', json=dados_pool)
        return response.json()
    
    def atualizar_pool(self, nome: str, **kwargs) -> Dict:
        response = self._fazer_requisicao('PUT', f'/api/pools/{nome}', json=kwargs)
        return response.json()
    
    def excluir_pool(self, nome: str) -> bool:
        self._fazer_requisicao('DELETE', f'/api/pools/{nome}')
        return True
    
    # Gerenciamento de backends
    def adicionar_backend(self, endereco: str, pool: str, peso: int = 100, **kwargs) -> Dict:
        dados_backend = {
            'address': endereco,
            'pool': pool,
            'weight': peso,
            **kwargs
        }
        response = self._fazer_requisicao('POST', '/api/backends', json=dados_backend)
        return response.json()
    
    # Operações de IA/ML
    def obter_metricas_ia(self) -> Dict:
        response = self._fazer_requisicao('GET', '/api/ai/metrics')
        return response.json()
    
    def atualizar_config_ia(self, **kwargs) -> Dict:
        response = self._fazer_requisicao('PUT', '/api/ai/config', json=kwargs)
        return response.json()
    
    # Monitoramento
    def obter_metricas_tenant(self, tenant_id: str) -> Dict:
        response = self._fazer_requisicao('GET', f'/api/tenants/{tenant_id}/metrics')
        return response.json()
    
    def obter_saude(self) -> Dict:
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()

# Exemplos de uso e scripts de automação
def configurar_ambiente_producao(cliente: ClienteVeloFlux):
    """Configurar ambiente de produção completo"""
    
    # Criar pool principal da API
    cliente.criar_pool(
        nome="api_producao",
        algoritmo="adaptive_ai",
        sticky_sessions=False,
        health_check={
            "enabled": True,
            "path": "/api/health",
            "interval": "10s",
            "timeout": "3s",
            "expected_status": 200
        }
    )
    
    # Adicionar múltiplos backends
    backends = [
        {"endereco": "10.0.1.10:8080", "peso": 100, "regiao": "us-east-1"},
        {"endereco": "10.0.1.11:8080", "peso": 100, "regiao": "us-east-1"},
        {"endereco": "10.0.2.10:8080", "peso": 80, "regiao": "us-west-2"},
    ]
    
    for backend in backends:
        cliente.adicionar_backend(pool="api_producao", **backend)
    
    # Habilitar recursos de IA
    cliente.atualizar_config_ia(
        enabled=True,
        model_type="neural_network",
        confidence_threshold=0.8,
        predictive_scaling=True
    )
    
    print("Configuração do ambiente de produção concluída!")

def monitorar_saude_sistema(cliente: ClienteVeloFlux, tenant_id: str):
    """Monitorar saúde e métricas do sistema"""
    
    while True:
        try:
            # Verificar saúde geral
            saude = cliente.obter_saude()
            print(f"Status do sistema: {saude['status']}")
            
            # Verificar métricas de IA
            metricas_ia = cliente.obter_metricas_ia()
            if metricas_ia['enabled']:
                confianca = metricas_ia['prediction_data']['confidence']
                print(f"Confiança da IA: {confianca:.2%}")
            
            # Verificar métricas do tenant
            metricas_tenant = cliente.obter_metricas_tenant(tenant_id)
            rps = metricas_tenant['requests_per_second']
            taxa_erro = metricas_tenant['error_rate']
            print(f"RPS: {rps:.1f}, Taxa de Erro: {taxa_erro:.2%}")
            
            time.sleep(30)  # Verificar a cada 30 segundos
            
        except KeyboardInterrupt:
            print("Monitoramento interrompido")
            break
        except Exception as e:
            print(f"Erro no monitoramento: {e}")
            time.sleep(5)

# Execução principal
if __name__ == "__main__":
    cliente = ClienteVeloFlux()
    
    # Login
    cliente.login(
        email="admin@exemplo.com",
        password="sua_senha",
        tenant_id="tenant_123"
    )
    
    # Configurar ambiente
    configurar_ambiente_producao(cliente)
    
    # Iniciar monitoramento
    monitorar_saude_sistema(cliente, "tenant_123")
```
---

## 🔔 **Webhooks e Eventos**

### **Configuração de Webhook**
```http
POST /api/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://sua-app.com/webhooks/veloflux",
  "events": ["pool.created", "backend.health_changed", "ai.recommendation"],
  "secret": "seu_webhook_secret",
  "enabled": true
}
```

### **Eventos Disponíveis**
| Tipo de Evento | Descrição | Payload |
|----------------|-----------|---------|
| `pool.created` | Novo pool criado | Detalhes do pool |
| `pool.updated` | Configuração do pool alterada | Detalhes + alterações |
| `pool.deleted` | Pool removido | Nome do pool + timestamp |
| `backend.added` | Backend adicionado ao pool | Detalhes do backend |
| `backend.removed` | Backend removido do pool | Detalhes do backend |
| `backend.health_changed` | Status de saúde do backend alterado | Backend + status |
| `ai.recommendation` | Recomendação de algoritmo de IA | Detalhes da recomendação |
| `tenant.usage_threshold` | Limite de uso excedido | Detalhes do uso |
| `billing.invoice_created` | Nova fatura gerada | Detalhes da fatura |
| `billing.payment_failed` | Falha no processamento do pagamento | Detalhes do pagamento |

### **Exemplo de Payload do Webhook**
```json
{
  "event": "backend.health_changed",
  "timestamp": "2025-06-19T15:30:00Z",
  "tenant_id": "tenant_123",
  "data": {
    "backend": {
      "id": "backend_456",
      "address": "192.168.1.10:8080",
      "pool": "servidores_web",
      "previous_status": "healthy",
      "current_status": "unhealthy",
      "health_check_details": {
        "path": "/health",
        "response_time": 5000,
        "status_code": 503,
        "error": "Timeout de conexão"
      }
    }
  },
  "signature": "sha256=abc123..."
}
```

### **Verificação de Webhook**
```javascript
// Verificar assinatura do webhook
const crypto = require('crypto');

function verificarAssinaturaWebhook(payload, signature, secret) {
    const assinaturaEsperada = crypto
        .createHmac('sha256', secret)
        .update(payload)
        .digest('hex');
    
    const assinaturaFornecida = signature.replace('sha256=', '');
    
    return crypto.timingSafeEqual(
        Buffer.from(assinaturaEsperada, 'hex'),
        Buffer.from(assinaturaFornecida, 'hex')
    );
}

// Handler Express.js para webhook
app.post('/webhooks/veloflux', express.raw({type: 'application/json'}), (req, res) => {
    const signature = req.headers['x-veloflux-signature'];
    const isValid = verificarAssinaturaWebhook(req.body, signature, process.env.WEBHOOK_SECRET);
    
    if (!isValid) {
        return res.status(401).send('Assinatura inválida');
    }
    
    const event = JSON.parse(req.body);
    
    switch (event.event) {
        case 'backend.health_changed':
            handleMudancaSaudeBackend(event.data);
            break;
        case 'ai.recommendation':
            handleRecomendacaoIA(event.data);
            break;
        // ... tratar outros eventos
    }
    
    res.status(200).send('OK');
});
```

---

## 🚫 **Códigos de Erro e Solução de Problemas**

### **Códigos de Status HTTP**
| Código | Status | Significado | Causas Comuns |
|--------|--------|-------------|---------------|
| `200` | Sucesso | Operação bem-sucedida | - |
| `201` | Criado | Recurso criado com sucesso | - |
| `204` | Sem Conteúdo | Operação bem-sucedida, sem resposta | Operações de exclusão |
| `400` | Bad Request | Dados inválidos ou malformados | Campos obrigatórios faltando, JSON inválido |
| `401` | Não Autorizado | Token inválido/expirado | Token expirado, credenciais inválidas |
| `403` | Proibido | Sem permissão | Role insuficiente, restrições de tenant |
| `404` | Não Encontrado | Recurso não encontrado | Endpoint errado, recurso não existe |
| `409` | Conflito | Recurso já existe | Nomes de pool/backend duplicados |
| `422` | Erro de Validação | Validação de dados falhou | Algoritmo inválido, email malformado |
| `429` | Rate Limited | Muitas requisições | Limites de taxa excedidos |
| `500` | Erro Interno | Erro interno do servidor | Problemas de database, serviço indisponível |
| `503` | Serviço Indisponível | Serviço temporariamente indisponível | Modo manutenção, sobrecarga |

### **Formato de Resposta de Erro**
```json
{
  "error": true,
  "code": "VALIDATION_ERROR",
  "message": "Email é obrigatório",
  "details": {
    "field": "email",
    "constraint": "required",
    "provided_value": null
  },
  "timestamp": "2025-06-19T15:30:00Z",
  "request_id": "req_abc123xyz",
  "documentation_url": "https://docs.veloflux.io/errors#VALIDATION_ERROR"
}
```

### **Códigos de Erro Comuns**
| Código | Descrição | Solução |
|--------|-----------|---------|
| `AUTHENTICATION_FAILED` | Credenciais de login inválidas | Verificar email/senha, confirmar tenant_id |
| `TOKEN_EXPIRED` | Token JWT expirou | Usar refresh token ou fazer login novamente |
| `INVALID_TOKEN` | Token malformado ou inválido | Fazer login novamente para obter novo token |
| `INSUFFICIENT_PERMISSIONS` | Usuário não tem permissões necessárias | Contatar admin para atualizar role |
| `TENANT_NOT_FOUND` | ID do tenant não existe | Verificar parâmetro tenant_id |
| `POOL_NOT_FOUND` | Pool não existe | Verificar nome do pool |
| `POOL_ALREADY_EXISTS` | Nome do pool já está em uso | Usar nome diferente para o pool |
| `BACKEND_NOT_FOUND` | Backend não existe | Verificar ID do backend |
| `INVALID_ALGORITHM` | Algoritmo de load balancing não suportado | Usar: round_robin, weighted_round_robin, least_connections, adaptive_ai |
| `HEALTH_CHECK_FAILED` | Configuração de health check inválida | Verificar valores de path, interval, timeout |
| `RATE_LIMIT_EXCEEDED` | Muitas requisições da API | Aguardar e tentar novamente, implementar backoff |
| `BILLING_ERROR` | Problema de pagamento ou assinatura | Verificar configuração de billing |
| `AI_SERVICE_UNAVAILABLE` | Serviço de IA/ML temporariamente indisponível | Usar algoritmos tradicionais como fallback |
| `VALIDATION_ERROR` | Validação de dados da requisição falhou | Verificar campos obrigatórios e formatos |

### **Exemplos de Solução de Problemas**

#### **Problemas de Autenticação**
```javascript
// Tratar erros de autenticação
async function tratarErroAuth(error) {
    if (error.code === 'TOKEN_EXPIRED') {
        // Tentar renovar token
        try {
            await api.renovarToken();
            return true; // Pode tentar novamente a requisição
        } catch (refreshError) {
            // Renovação falhou, precisa fazer login
            window.location.href = '/login';
            return false;
        }
    }
    
    if (error.code === 'AUTHENTICATION_FAILED') {
        alert('Credenciais inválidas. Verifique seu email e senha.');
        return false;
    }
    
    if (error.code === 'INSUFFICIENT_PERMISSIONS') {
        alert('Você não tem permissão para realizar esta ação.');
        return false;
    }
    
    return false;
}
```

#### **Tratamento de Rate Limiting**
```javascript
// Backoff exponencial para rate limiting
async function fazerRequisicaoComBackoff(requestFn, maxTentativas = 3) {
    for (let i = 0; i < maxTentativas; i++) {
        try {
            return await requestFn();
        } catch (error) {
            if (error.code === 'RATE_LIMIT_EXCEEDED') {
                const delay = Math.pow(2, i) * 1000; // Backoff exponencial
                await new Promise(resolve => setTimeout(resolve, delay));
                continue;
            }
            throw error;
        }
    }
    throw new Error('Máximo de tentativas excedido');
}
```

---

## 🔒 **Segurança e Melhores Práticas**

### **Autenticação e Autorização**
```http
# Sempre usar HTTPS em produção
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
X-Request-ID: id-requisicao-unico-123
```

### **Headers de Segurança**
```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Content-Security-Policy: default-src 'self'
```

### **Rate Limiting**
- **Plano gratuito:** 100 requisições/hora por token
- **Profissional:** 1.000 requisições/hora por token  
- **Enterprise:** 10.000 requisições/hora por token
- **Headers de resposta:**
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1640995200
  X-RateLimit-Window: 3600
  ```

### **Configuração CORS**
```javascript
// Headers CORS (configurável por tenant)
Access-Control-Allow-Origin: https://seu-dominio.com
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type, X-Request-ID
Access-Control-Max-Age: 86400
```

### **Melhores Práticas de Segurança da API**
1. **Usar apenas HTTPS** - Nunca enviar tokens via HTTP
2. **Rotacionar tokens regularmente** - Implementar renovação automática de token
3. **Validar todas as entradas** - Sanitizar e validar todas as entradas da API
4. **Monitorar anomalias** - Rastrear padrões de uso incomuns da API
5. **Implementar CORS adequado** - Configurar CORS apenas para seus domínios
6. **Usar assinatura de requisições** - Assinar requisições críticas com HMAC
7. **Registrar eventos de segurança** - Monitorar tentativas de autenticação falhadas
8. **Implementar whitelist de IP** - Restringir acesso à API por IP quando possível

---

## 📊 **Performance e Otimização**

### **Otimização de Requisições**
```javascript
// Operações em lote
const operacoesLote = async () => {
    const operacoes = [
        api.criarPool({name: 'pool1', algorithm: 'round_robin'}),
        api.criarPool({name: 'pool2', algorithm: 'least_connections'}),
        api.adicionarBackend({address: '10.0.1.1:80', pool: 'pool1', weight: 100})
    ];
    
    const resultados = await Promise.all(operacoes);
    return resultados;
};

// Usar compressão para payloads grandes
const fazerRequisicaoComprimida = async (url, data) => {
    const comprimido = gzip(JSON.stringify(data));
    
    return fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Encoding': 'gzip',
            'Authorization': `Bearer ${token}`
        },
        body: comprimido
    });
};
```

### **Estratégias de Cache**
```javascript
// Cache client-side com TTL
class CacheAPI {
    constructor(ttlMs = 300000) { // 5 minutos por padrão
        this.cache = new Map();
        this.ttl = ttlMs;
    }
    
    get(chave) {
        const item = this.cache.get(chave);
        if (!item) return null;
        
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(chave);
            return null;
        }
        
        return item.data;
    }
    
    set(chave, data) {
        this.cache.set(chave, {
            data,
            timestamp: Date.now()
        });
    }
}

const cache = new CacheAPI();

// Chamadas de API com cache
const obterPoolsComCache = async () => {
    const chaveCache = 'pools';
    let pools = cache.get(chaveCache);
    
    if (!pools) {
        pools = await api.obterPools();
        cache.set(chaveCache, pools);
    }
    
    return pools;
};
```

---

## 🔗 **URLs e Ambientes**

### **Ambiente de Desenvolvimento**
- **Backend API:** `http://localhost:8080`
- **Dashboard Frontend:** `http://localhost:3000`
- **Métricas Prometheus:** `http://localhost:9090`
- **Dashboard Grafana:** `http://localhost:3001`
- **Console Admin:** `http://localhost:8081`

### **Ambiente de Staging**
- **API:** `https://api-staging.veloflux.io`
- **Dashboard:** `https://dashboard-staging.veloflux.io`
- **Documentação:** `https://docs-staging.veloflux.io`

### **Ambiente de Produção**
- **API:** `https://api.veloflux.io`
- **Dashboard:** `https://dashboard.veloflux.io`
- **Documentação:** `https://docs.veloflux.io`
- **Página de Status:** `https://status.veloflux.io`
- **Portal de Suporte:** `https://support.veloflux.io`

### **Endpoints Regionais**
- **US Leste:** `https://us-east-api.veloflux.io`
- **US Oeste:** `https://us-west-api.veloflux.io`
- **Europa:** `https://eu-api.veloflux.io`
- **Ásia Pacífico:** `https://ap-api.veloflux.io`

---

## 📚 **Recursos Adicionais**

### **SDKs e Bibliotecas**
- **JavaScript/TypeScript:** `npm install @veloflux/api-client`
- **Python:** `pip install veloflux-python`
- **Go:** `go get github.com/veloflux/go-client`
- **Java:** Dependência Maven/Gradle disponível
- **C#/.NET:** Pacote NuGet disponível

### **Ferramentas e Integrações**
- **Terraform Provider:** Infrastructure as Code
- **Kubernetes Operator:** Integração nativa com K8s
- **Helm Charts:** Deploy simplificado
- **Imagens Docker:** Deploy containerizado
- **Exportador Prometheus:** Integração de métricas
- **Dashboards Grafana:** Templates de visualização

### **Comunidade e Suporte**
- **GitHub:** [github.com/eltonciatto/veloflux](https://github.com/eltonciatto/veloflux)
- **Documentação:** [docs.veloflux.io](https://docs.veloflux.io)
- **Fórum da Comunidade:** [community.veloflux.io](https://community.veloflux.io)
- **Discord:** [discord.gg/veloflux](https://discord.gg/veloflux)
- **Stack Overflow:** Tag `veloflux`

---

**📚 Documentação atualizada em: 19 de junho de 2025**  
**🔄 Versão da API: v1.0**  
**📧 Suporte: contato@veloflux.io**  
**🌐 Website: [veloflux.io](https://veloflux.io)**  
**📖 Changelog: [docs.veloflux.io/changelog](https://docs.veloflux.io/changelog)**
