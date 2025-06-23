# Gerenciamento de Rotas - Tenant API

Este documento detalha como gerenciar rotas dentro de um tenant específico.

## 🛣️ Endpoints de Gerenciamento de Rotas

### 1. Listar Rotas do Tenant
Lista todas as rotas configuradas para um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/routes`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function listTenantRoutes(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/routes`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar rotas: ${response.status}`);
    }

    const routes = await response.json();
    return routes;
  } catch (error) {
    console.error('Erro ao listar rotas:', error);
    throw error;
  }
}

// Resposta esperada
[
  {
    "id": "route1",
    "host": "api.exemplo.com",
    "path": "/v1/*",
    "pool": "tenant1:pool:backend-pool",
    "ssl_redirect": true,
    "rate_limit": {
      "requests_per_second": 100,
      "burst_size": 200
    },
    "health_check": {
      "enabled": true,
      "path": "/health",
      "interval": "30s"
    },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-06-23T15:00:00Z"
  }
]
```

### 2. Criar Nova Rota
Cria uma nova rota para o tenant.

**Endpoint:** `POST /api/tenants/{tenant_id}/routes`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function createTenantRoute(tenantId, routeData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/routes`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(routeData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar rota: ${response.status}`);
    }

    const newRoute = await response.json();
    return newRoute;
  } catch (error) {
    console.error('Erro ao criar rota:', error);
    throw error;
  }
}

// Payload de requisição
{
  "host": "api.novosite.com",
  "path": "/api/*",
  "pool": "backend-pool",
  "ssl_redirect": true,
  "rate_limit": {
    "requests_per_second": 50,
    "burst_size": 100
  },
  "health_check": {
    "enabled": true,
    "path": "/health",
    "interval": "30s",
    "timeout": "5s"
  },
  "headers": {
    "X-Forwarded-For": "$remote_addr",
    "X-Tenant-ID": "tenant1"
  }
}

// Resposta esperada (Status: 201)
{
  "id": "route-20240623160405",
  "host": "api.novosite.com",
  "path": "/api/*",
  "pool": "tenant1:pool:backend-pool",
  "ssl_redirect": true,
  "rate_limit": {
    "requests_per_second": 50,
    "burst_size": 100
  },
  "health_check": {
    "enabled": true,
    "path": "/health",
    "interval": "30s",
    "timeout": "5s"
  },
  "headers": {
    "X-Forwarded-For": "$remote_addr",
    "X-Tenant-ID": "tenant1"
  },
  "created_at": "2024-06-23T16:04:05Z"
}
```

### 3. Atualizar Rota
Atualiza uma rota existente do tenant.

**Endpoint:** `PUT /api/tenants/{tenant_id}/routes/{route_id}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function updateTenantRoute(tenantId, routeId, updateData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/routes/${routeId}`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar rota: ${response.status}`);
    }

    const updatedRoute = await response.json();
    return updatedRoute;
  } catch (error) {
    console.error('Erro ao atualizar rota:', error);
    throw error;
  }
}

// Payload de requisição
{
  "path": "/api/v2/*",
  "pool": "new-backend-pool",
  "rate_limit": {
    "requests_per_second": 100,
    "burst_size": 200
  },
  "health_check": {
    "enabled": true,
    "path": "/health/v2",
    "interval": "60s"
  }
}

// Resposta esperada
{
  "id": "route-20240623160405",
  "host": "api.novosite.com",
  "path": "/api/v2/*",
  "pool": "tenant1:pool:new-backend-pool",
  "ssl_redirect": true,
  "rate_limit": {
    "requests_per_second": 100,
    "burst_size": 200
  },
  "health_check": {
    "enabled": true,
    "path": "/health/v2",
    "interval": "60s",
    "timeout": "5s"
  },
  "updated_at": "2024-06-23T16:30:00Z"
}
```

### 4. Deletar Rota
Remove uma rota específica do tenant.

**Endpoint:** `DELETE /api/tenants/{tenant_id}/routes/{route_id}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function deleteTenantRoute(tenantId, routeId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/routes/${routeId}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar rota: ${response.status}`);
    }

    // Resposta vazia com status 204
    return true;
  } catch (error) {
    console.error('Erro ao deletar rota:', error);
    throw error;
  }
}
```

## 🔧 Classe TenantRouteManager

```javascript
class TenantRouteManager {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // Listar rotas do tenant
  async listRoutes(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/routes`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar rotas: ${response.status}`);
    }

    return await response.json();
  }

  // Criar nova rota
  async createRoute(tenantId, routeData) {
    this.validateRouteData(routeData);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/routes`, {
      method: 'POST',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(routeData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar rota: ${response.status}`);
    }

    return await response.json();
  }

  // Atualizar rota
  async updateRoute(tenantId, routeId, updateData) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/routes/${routeId}`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar rota: ${response.status}`);
    }

    return await response.json();
  }

  // Deletar rota
  async deleteRoute(tenantId, routeId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/routes/${routeId}`, {
      method: 'DELETE',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar rota: ${response.status}`);
    }

    return true;
  }

  // Validar dados da rota
  validateRouteData(data) {
    const errors = [];

    if (!data.host || !this.isValidHost(data.host)) {
      errors.push('Host inválido');
    }

    if (!data.path || !this.isValidPath(data.path)) {
      errors.push('Path inválido');
    }

    if (!data.pool || data.pool.trim().length < 1) {
      errors.push('Pool é obrigatório');
    }

    if (data.rate_limit) {
      if (!data.rate_limit.requests_per_second || data.rate_limit.requests_per_second < 1) {
        errors.push('Rate limit deve ser maior que 0');
      }
    }

    if (data.health_check && data.health_check.enabled) {
      if (!data.health_check.path) {
        errors.push('Path do health check é obrigatório quando habilitado');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  // Validar host
  isValidHost(host) {
    // Regex simples para validar host
    const hostRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    return hostRegex.test(host);
  }

  // Validar path
  isValidPath(path) {
    // Path deve começar com /
    return path.startsWith('/');
  }

  // Obter rota por host
  async getRouteByHost(tenantId, host) {
    const routes = await this.listRoutes(tenantId);
    return routes.find(route => route.host === host);
  }

  // Verificar se host já existe
  async hostExists(tenantId, host, excludeRouteId = null) {
    const routes = await this.listRoutes(tenantId);
    return routes.some(route => 
      route.host === host && route.id !== excludeRouteId
    );
  }

  // Obter estatísticas das rotas
  async getRouteStats(tenantId) {
    const routes = await this.listRoutes(tenantId);
    
    return {
      total: routes.length,
      withSSL: routes.filter(r => r.ssl_redirect).length,
      withRateLimit: routes.filter(r => r.rate_limit).length,
      withHealthCheck: routes.filter(r => r.health_check?.enabled).length,
      hosts: routes.map(r => r.host)
    };
  }
}

// Uso da classe
const auth = new AuthManager();
const tenantRouteManager = new TenantRouteManager(auth);
```

## 🎨 Componentes de Interface (React)

### Lista de Rotas
```jsx
import React, { useState, useEffect } from 'react';

const TenantRoutesList = ({ tenantId, tenantRouteManager, userRole }) => {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRoutes();
  }, [tenantId]);

  const loadRoutes = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantRouteManager.listRoutes(tenantId);
      setRoutes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoute = async (routeId) => {
    if (!PermissionManager.canManageRoutes(userRole)) {
      alert('Você não tem permissão para deletar rotas');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar esta rota?')) {
      return;
    }

    try {
      await tenantRouteManager.deleteRoute(tenantId, routeId);
      setRoutes(routes.filter(r => r.id !== routeId));
    } catch (err) {
      alert('Erro ao deletar rota: ' + err.message);
    }
  };

  const formatRateLimit = (rateLimit) => {
    if (!rateLimit) return 'Não configurado';
    return `${rateLimit.requests_per_second} req/s (burst: ${rateLimit.burst_size})`;
  };

  const formatHealthCheck = (healthCheck) => {
    if (!healthCheck?.enabled) return 'Desabilitado';
    return `${healthCheck.path} (${healthCheck.interval})`;
  };

  if (loading) return <div>Carregando rotas...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="tenant-routes">
      <div className="routes-header">
        <h2>Rotas do Tenant</h2>
        {PermissionManager.canManageRoutes(userRole) && (
          <button onClick={() => window.location.href = `/tenants/${tenantId}/routes/add`}>
            Criar Nova Rota
          </button>
        )}
      </div>

      <div className="routes-grid">
        {routes.map(route => (
          <div key={route.id} className="route-card">
            <div className="route-header">
              <h3>{route.host}</h3>
              <div className="route-badges">
                {route.ssl_redirect && <span className="badge ssl">SSL</span>}
                {route.rate_limit && <span className="badge rate-limit">Rate Limited</span>}
                {route.health_check?.enabled && <span className="badge health">Health Check</span>}
              </div>
            </div>
            
            <div className="route-details">
              <p><strong>Path:</strong> {route.path}</p>
              <p><strong>Pool:</strong> {route.pool.replace(`${tenantId}:pool:`, '')}</p>
              <p><strong>Rate Limit:</strong> {formatRateLimit(route.rate_limit)}</p>
              <p><strong>Health Check:</strong> {formatHealthCheck(route.health_check)}</p>
              <p><strong>Criada:</strong> {new Date(route.created_at).toLocaleDateString()}</p>
            </div>

            {PermissionManager.canManageRoutes(userRole) && (
              <div className="route-actions">
                <button 
                  onClick={() => window.location.href = `/tenants/${tenantId}/routes/${route.id}/edit`}
                >
                  Editar
                </button>
                <button 
                  onClick={() => handleDeleteRoute(route.id)}
                  className="delete-btn"
                >
                  Deletar
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {routes.length === 0 && (
        <div className="empty-state">
          <p>Nenhuma rota configurada</p>
          {PermissionManager.canManageRoutes(userRole) && (
            <button onClick={() => window.location.href = `/tenants/${tenantId}/routes/add`}>
              Criar Primeira Rota
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantRoutesList;
```

### Formulário de Criação/Edição de Rota
```jsx
import React, { useState, useEffect } from 'react';

const RouteForm = ({ tenantId, routeId = null, tenantRouteManager, onSave }) => {
  const [formData, setFormData] = useState({
    host: '',
    path: '/',
    pool: '',
    ssl_redirect: true,
    rate_limit: {
      enabled: false,
      requests_per_second: 100,
      burst_size: 200
    },
    health_check: {
      enabled: false,
      path: '/health',
      interval: '30s',
      timeout: '5s'
    },
    headers: {}
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(!!routeId);
  const [pools, setPools] = useState([]);

  useEffect(() => {
    if (routeId) {
      loadRoute();
    }
    loadPools();
  }, [routeId]);

  const loadRoute = async () => {
    try {
      setLoading(true);
      const routes = await tenantRouteManager.listRoutes(tenantId);
      const route = routes.find(r => r.id === routeId);
      if (route) {
        setFormData({
          ...route,
          rate_limit: {
            enabled: !!route.rate_limit,
            ...route.rate_limit
          },
          health_check: {
            enabled: route.health_check?.enabled || false,
            ...route.health_check
          }
        });
      }
    } catch (error) {
      alert('Erro ao carregar rota: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPools = async () => {
    // Implementar carregamento de pools disponíveis
    // setPools(await poolManager.listPools(tenantId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const submitData = {
      ...formData,
      rate_limit: formData.rate_limit.enabled ? {
        requests_per_second: formData.rate_limit.requests_per_second,
        burst_size: formData.rate_limit.burst_size
      } : undefined,
      health_check: formData.health_check.enabled ? formData.health_check : undefined
    };

    try {
      setLoading(true);
      
      if (isEdit) {
        const updated = await tenantRouteManager.updateRoute(tenantId, routeId, submitData);
        onSave?.(updated);
        alert('Rota atualizada com sucesso!');
      } else {
        // Verificar se host já existe
        if (await tenantRouteManager.hostExists(tenantId, formData.host)) {
          throw new Error('Host já existe para este tenant');
        }

        const created = await tenantRouteManager.createRoute(tenantId, submitData);
        onSave?.(created);
        alert('Rota criada com sucesso!');
        
        // Resetar formulário
        setFormData({
          host: '',
          path: '/',
          pool: '',
          ssl_redirect: true,
          rate_limit: { enabled: false, requests_per_second: 100, burst_size: 200 },
          health_check: { enabled: false, path: '/health', interval: '30s', timeout: '5s' },
          headers: {}
        });
      }
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="route-form">
      <h2>{isEdit ? 'Editar Rota' : 'Criar Nova Rota'}</h2>
      
      <div className="form-section">
        <h3>Configurações Básicas</h3>
        
        <div className="form-group">
          <label htmlFor="host">Host</label>
          <input
            type="text"
            id="host"
            name="host"
            value={formData.host}
            onChange={handleChange}
            placeholder="api.exemplo.com"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="path">Path</label>
          <input
            type="text"
            id="path"
            name="path"
            value={formData.path}
            onChange={handleChange}
            placeholder="/api/*"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="pool">Pool de Backend</label>
          <select
            id="pool"
            name="pool"
            value={formData.pool}
            onChange={handleChange}
            required
          >
            <option value="">Selecione um pool</option>
            {pools.map(pool => (
              <option key={pool.name} value={pool.name}>
                {pool.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="ssl_redirect"
              checked={formData.ssl_redirect}
              onChange={handleChange}
            />
            Redirecionar HTTP para HTTPS
          </label>
        </div>
      </div>

      <div className="form-section">
        <h3>Rate Limiting</h3>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="rate_limit.enabled"
              checked={formData.rate_limit.enabled}
              onChange={handleChange}
            />
            Habilitar Rate Limiting
          </label>
        </div>

        {formData.rate_limit.enabled && (
          <>
            <div className="form-group">
              <label htmlFor="rate_limit_rps">Requisições por Segundo</label>
              <input
                type="number"
                id="rate_limit_rps"
                name="rate_limit.requests_per_second"
                value={formData.rate_limit.requests_per_second}
                onChange={handleChange}
                min="1"
              />
            </div>

            <div className="form-group">
              <label htmlFor="rate_limit_burst">Tamanho do Burst</label>
              <input
                type="number"
                id="rate_limit_burst"
                name="rate_limit.burst_size"
                value={formData.rate_limit.burst_size}
                onChange={handleChange}
                min="1"
              />
            </div>
          </>
        )}
      </div>

      <div className="form-section">
        <h3>Health Check</h3>
        
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="health_check.enabled"
              checked={formData.health_check.enabled}
              onChange={handleChange}
            />
            Habilitar Health Check
          </label>
        </div>

        {formData.health_check.enabled && (
          <>
            <div className="form-group">
              <label htmlFor="health_check_path">Path do Health Check</label>
              <input
                type="text"
                id="health_check_path"
                name="health_check.path"
                value={formData.health_check.path}
                onChange={handleChange}
                placeholder="/health"
              />
            </div>

            <div className="form-group">
              <label htmlFor="health_check_interval">Intervalo</label>
              <select
                id="health_check_interval"
                name="health_check.interval"
                value={formData.health_check.interval}
                onChange={handleChange}
              >
                <option value="10s">10 segundos</option>
                <option value="30s">30 segundos</option>
                <option value="60s">1 minuto</option>
                <option value="300s">5 minutos</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="health_check_timeout">Timeout</label>
              <select
                id="health_check_timeout"
                name="health_check.timeout"
                value={formData.health_check.timeout}
                onChange={handleChange}
              >
                <option value="3s">3 segundos</option>
                <option value="5s">5 segundos</option>
                <option value="10s">10 segundos</option>
                <option value="30s">30 segundos</option>
              </select>
            </div>
          </>
        )}
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')} Rota
      </button>
    </form>
  );
};

export default RouteForm;
```

## 🔍 Utilitários e Helpers

```javascript
// Utilitários para rotas
class RouteUtils {
  // Validar formato de host
  static isValidHostname(hostname) {
    const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-_.]*[a-zA-Z0-9])?$/;
    return hostnameRegex.test(hostname) && hostname.length <= 253;
  }

  // Validar path
  static isValidPath(path) {
    return path.startsWith('/') && path.length <= 2048;
  }

  // Extrair domínio de um host
  static extractDomain(host) {
    const parts = host.split('.');
    return parts.length > 2 ? parts.slice(-2).join('.') : host;
  }

  // Formatar intervalo de tempo
  static formatInterval(interval) {
    const intervalMap = {
      '10s': '10 segundos',
      '30s': '30 segundos',
      '60s': '1 minuto',
      '300s': '5 minutos',
      '600s': '10 minutos'
    };
    return intervalMap[interval] || interval;
  }

  // Gerar sugestão de path
  static suggestPath(host) {
    if (host.startsWith('api.')) {
      return '/api/*';
    }
    if (host.startsWith('www.')) {
      return '/*';
    }
    return '/';
  }

  // Verificar conflito de rotas
  static hasRouteConflict(routes, newRoute) {
    return routes.some(route => 
      route.host === newRoute.host && route.path === newRoute.path
    );
  }

  // Ordernar rotas por prioridade
  static sortByPriority(routes) {
    return [...routes].sort((a, b) => {
      // Rotas mais específicas primeiro
      const aSpecificity = (a.path.match(/\*/g) || []).length;
      const bSpecificity = (b.path.match(/\*/g) || []).length;
      
      if (aSpecificity !== bSpecificity) {
        return aSpecificity - bSpecificity;
      }
      
      // Se mesma especificidade, ordenar por tamanho do path
      return b.path.length - a.path.length;
    });
  }
}

// Classe para estatísticas de rotas
class RouteAnalytics {
  constructor(routes) {
    this.routes = routes;
  }

  // Estatísticas gerais
  getStats() {
    return {
      total: this.routes.length,
      withSSL: this.routes.filter(r => r.ssl_redirect).length,
      withRateLimit: this.routes.filter(r => r.rate_limit).length,
      withHealthCheck: this.routes.filter(r => r.health_check?.enabled).length,
      uniqueHosts: new Set(this.routes.map(r => r.host)).size,
      uniqueDomains: new Set(this.routes.map(r => RouteUtils.extractDomain(r.host))).size
    };
  }

  // Distribuição de rate limits
  getRateLimitDistribution() {
    const distribution = {};
    
    this.routes.forEach(route => {
      if (route.rate_limit) {
        const key = `${route.rate_limit.requests_per_second} req/s`;
        distribution[key] = (distribution[key] || 0) + 1;
      }
    });
    
    return distribution;
  }

  // Pools mais utilizados
  getPoolUsage() {
    const usage = {};
    
    this.routes.forEach(route => {
      const pool = route.pool.replace(/^.*:pool:/, '');
      usage[pool] = (usage[pool] || 0) + 1;
    });
    
    return Object.entries(usage)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10);
  }

  // Rotas por domínio
  getRoutesByDomain() {
    const domains = {};
    
    this.routes.forEach(route => {
      const domain = RouteUtils.extractDomain(route.host);
      if (!domains[domain]) {
        domains[domain] = [];
      }
      domains[domain].push(route);
    });
    
    return domains;
  }
}
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro específicos de rotas
const ROUTE_ERRORS = {
  ROUTE_NOT_FOUND: 'Rota não encontrada',
  HOST_ALREADY_EXISTS: 'Host já existe',
  INVALID_PATH: 'Path inválido',
  POOL_NOT_FOUND: 'Pool não encontrado',
  RATE_LIMIT_EXCEEDED: 'Limite de rotas excedido'
};

// Função para tratar erros de rota
function handleRouteError(error, response) {
  switch (response?.status) {
    case 400:
      if (error.message.includes('host')) {
        return 'Host inválido ou já existe.';
      }
      if (error.message.includes('path')) {
        return 'Path inválido. Deve começar com /.';
      }
      if (error.message.includes('pool')) {
        return 'Pool selecionado não existe.';
      }
      return 'Dados da rota inválidos.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para gerenciar rotas.';
    case 404:
      return 'Rota não encontrada.';
    case 409:
      return 'Conflito: Esta combinação de host e path já existe.';
    case 429:
      return 'Limite de rotas atingido para seu plano.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return 'Erro desconhecido. Entre em contato com o suporte.';
  }
}
```

## 📊 Monitoramento de Rotas

```javascript
// Classe para monitorar rotas
class RouteMonitor {
  constructor(tenantRouteManager, tenantId) {
    this.routeManager = tenantRouteManager;
    this.tenantId = tenantId;
  }

  // Verificar status das rotas
  async checkRoutesHealth() {
    const routes = await this.routeManager.listRoutes(this.tenantId);
    const healthResults = [];

    for (const route of routes) {
      if (route.health_check?.enabled) {
        try {
          const healthUrl = `https://${route.host}${route.health_check.path}`;
          const response = await fetch(healthUrl, {
            method: 'GET',
            timeout: parseInt(route.health_check.timeout) * 1000
          });

          healthResults.push({
            routeId: route.id,
            host: route.host,
            status: response.ok ? 'healthy' : 'unhealthy',
            responseTime: Date.now() - startTime,
            statusCode: response.status
          });
        } catch (error) {
          healthResults.push({
            routeId: route.id,
            host: route.host,
            status: 'error',
            error: error.message
          });
        }
      }
    }

    return healthResults;
  }

  // Testar conectividade de uma rota
  async testRoute(routeId) {
    const routes = await this.routeManager.listRoutes(this.tenantId);
    const route = routes.find(r => r.id === routeId);
    
    if (!route) {
      throw new Error('Rota não encontrada');
    }

    const testUrl = `https://${route.host}${route.path.replace('*', 'test')}`;
    const startTime = Date.now();

    try {
      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: 10000
      });

      return {
        success: true,
        statusCode: response.status,
        responseTime: Date.now() - startTime,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        responseTime: Date.now() - startTime
      };
    }
  }
}
```
