# Pools e Backends - Tenant API

Este documento detalha como gerenciar pools de load balancing e backends dentro de um tenant específico.

## 🏊 Endpoints de Gerenciamento de Pools

### 1. Listar Pools do Tenant
Lista todos os pools configurados para um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/pools`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function listTenantPools(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar pools: ${response.status}`);
    }

    const pools = await response.json();
    return pools;
  } catch (error) {
    console.error('Erro ao listar pools:', error);
    throw error;
  }
}

// Resposta esperada
[
  {
    "name": "tenant1:pool:backend-pool",
    "algorithm": "round_robin",
    "sticky_sessions": false,
    "backends": [
      {
        "address": "192.168.1.10:8080",
        "weight": 1,
        "max_connections": 100,
        "timeout": "30s",
        "health_check": {
          "enabled": true,
          "path": "/health",
          "interval": "30s"
        },
        "status": "active"
      }
    ],
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-06-23T15:00:00Z"
  }
]
```

### 2. Criar Novo Pool
Cria um novo pool de load balancing para o tenant.

**Endpoint:** `POST /api/tenants/{tenant_id}/pools`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function createTenantPool(tenantId, poolData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(poolData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar pool: ${response.status}`);
    }

    const newPool = await response.json();
    return newPool;
  } catch (error) {
    console.error('Erro ao criar pool:', error);
    throw error;
  }
}

// Payload de requisição
{
  "name": "api-backend",
  "algorithm": "least_connections",
  "sticky_sessions": true
}

// Resposta esperada (Status: 201)
{
  "name": "tenant1:pool:api-backend",
  "algorithm": "least_connections",
  "sticky_sessions": true,
  "backends": [],
  "created_at": "2024-06-23T16:04:05Z"
}
```

### 3. Obter Pool Específico
Retorna informações detalhadas de um pool específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/pools/{pool_name}`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function getTenantPool(tenantId, poolName) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter pool: ${response.status}`);
    }

    const pool = await response.json();
    return pool;
  } catch (error) {
    console.error('Erro ao obter pool:', error);
    throw error;
  }
}

// Resposta esperada
{
  "name": "tenant1:pool:api-backend",
  "algorithm": "least_connections",
  "sticky_sessions": true,
  "backends": [
    {
      "address": "192.168.1.10:8080",
      "weight": 1,
      "max_connections": 100,
      "timeout": "30s",
      "health_check": {
        "enabled": true,
        "path": "/health",
        "interval": "30s"
      },
      "status": "active",
      "last_check": "2024-06-23T16:30:00Z"
    }
  ]
}
```

### 4. Atualizar Pool
Atualiza configurações de um pool existente.

**Endpoint:** `PUT /api/tenants/{tenant_id}/pools/{pool_name}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function updateTenantPool(tenantId, poolName, updateData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar pool: ${response.status}`);
    }

    const updatedPool = await response.json();
    return updatedPool;
  } catch (error) {
    console.error('Erro ao atualizar pool:', error);
    throw error;
  }
}

// Payload de requisição
{
  "algorithm": "weighted_round_robin",
  "sticky_sessions": false
}

// Resposta esperada
{
  "name": "tenant1:pool:api-backend",
  "algorithm": "weighted_round_robin",
  "sticky_sessions": false,
  "backends": [...],
  "updated_at": "2024-06-23T16:45:00Z"
}
```

### 5. Deletar Pool
Remove um pool específico do tenant.

**Endpoint:** `DELETE /api/tenants/{tenant_id}/pools/{pool_name}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function deleteTenantPool(tenantId, poolName) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar pool: ${response.status}`);
    }

    // Resposta vazia com status 204
    return true;
  } catch (error) {
    console.error('Erro ao deletar pool:', error);
    throw error;
  }
}
```

## 🖥️ Endpoints de Gerenciamento de Backends

### 6. Adicionar Backend ao Pool
Adiciona um novo backend a um pool específico.

**Endpoint:** `POST /api/tenants/{tenant_id}/pools/{pool_name}/backends`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function addTenantBackend(tenantId, poolName, backendData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools/${poolName}/backends`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(backendData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar backend: ${response.status}`);
    }

    const newBackend = await response.json();
    return newBackend;
  } catch (error) {
    console.error('Erro ao adicionar backend:', error);
    throw error;
  }
}

// Payload de requisição
{
  "address": "192.168.1.11:8080",
  "weight": 2,
  "max_connections": 150,
  "timeout": "45s",
  "health_check": {
    "enabled": true,
    "path": "/api/health",
    "interval": "30s",
    "timeout": "10s",
    "healthy_threshold": 2,
    "unhealthy_threshold": 3
  }
}

// Resposta esperada (Status: 201)
{
  "address": "192.168.1.11:8080",
  "weight": 2,
  "max_connections": 150,
  "timeout": "45s",
  "health_check": {
    "enabled": true,
    "path": "/api/health",
    "interval": "30s",
    "timeout": "10s",
    "healthy_threshold": 2,
    "unhealthy_threshold": 3
  },
  "status": "active",
  "added_at": "2024-06-23T16:50:00Z"
}
```

### 7. Remover Backend do Pool
Remove um backend específico de um pool.

**Endpoint:** `DELETE /api/tenants/{tenant_id}/pools/{pool_name}/backends/{backend_address}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function removeTenantBackend(tenantId, poolName, backendAddress) {
  const auth = new AuthManager();
  
  // Codificar o endereço do backend para URL
  const encodedAddress = encodeURIComponent(backendAddress);
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/pools/${poolName}/backends/${encodedAddress}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao remover backend: ${response.status}`);
    }

    // Resposta vazia com status 204
    return true;
  } catch (error) {
    console.error('Erro ao remover backend:', error);
    throw error;
  }
}
```

## 🔧 Classe TenantPoolManager

```javascript
class TenantPoolManager {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // Listar pools do tenant
  async listPools(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar pools: ${response.status}`);
    }

    return await response.json();
  }

  // Criar novo pool
  async createPool(tenantId, poolData) {
    this.validatePoolData(poolData);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools`, {
      method: 'POST',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(poolData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar pool: ${response.status}`);
    }

    return await response.json();
  }

  // Obter pool específico
  async getPool(tenantId, poolName) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter pool: ${response.status}`);
    }

    return await response.json();
  }

  // Atualizar pool
  async updatePool(tenantId, poolName, updateData) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar pool: ${response.status}`);
    }

    return await response.json();
  }

  // Deletar pool
  async deletePool(tenantId, poolName) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools/${poolName}`, {
      method: 'DELETE',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar pool: ${response.status}`);
    }

    return true;
  }

  // Adicionar backend ao pool
  async addBackend(tenantId, poolName, backendData) {
    this.validateBackendData(backendData);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools/${poolName}/backends`, {
      method: 'POST',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(backendData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar backend: ${response.status}`);
    }

    return await response.json();
  }

  // Remover backend do pool
  async removeBackend(tenantId, poolName, backendAddress) {
    const encodedAddress = encodeURIComponent(backendAddress);
    
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/pools/${poolName}/backends/${encodedAddress}`, {
      method: 'DELETE',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao remover backend: ${response.status}`);
    }

    return true;
  }

  // Validar dados do pool
  validatePoolData(data) {
    const errors = [];

    if (!data.name || data.name.trim().length < 1) {
      errors.push('Nome do pool é obrigatório');
    }

    if (!data.algorithm || !this.isValidAlgorithm(data.algorithm)) {
      errors.push('Algoritmo inválido');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  // Validar dados do backend
  validateBackendData(data) {
    const errors = [];

    if (!data.address || !this.isValidAddress(data.address)) {
      errors.push('Endereço do backend inválido');
    }

    if (data.weight && (data.weight < 1 || data.weight > 100)) {
      errors.push('Peso deve estar entre 1 e 100');
    }

    if (data.max_connections && data.max_connections < 1) {
      errors.push('Máximo de conexões deve ser maior que 0');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  // Validar algoritmo de load balancing
  isValidAlgorithm(algorithm) {
    const validAlgorithms = [
      'round_robin',
      'least_connections',
      'weighted_round_robin',
      'ip_hash',
      'least_time'
    ];
    return validAlgorithms.includes(algorithm);
  }

  // Validar endereço do backend
  isValidAddress(address) {
    // Regex básica para IP:port ou hostname:port
    const addressRegex = /^[a-zA-Z0-9.-]+:\d+$/;
    return addressRegex.test(address);
  }

  // Obter estatísticas dos pools
  async getPoolStats(tenantId) {
    const pools = await this.listPools(tenantId);
    
    return {
      totalPools: pools.length,
      totalBackends: pools.reduce((sum, pool) => sum + pool.backends.length, 0),
      activeBackends: pools.reduce((sum, pool) => 
        sum + pool.backends.filter(b => b.status === 'active').length, 0
      ),
      algorithmsUsed: [...new Set(pools.map(p => p.algorithm))],
      poolsWithStickySessions: pools.filter(p => p.sticky_sessions).length
    };
  }
}

// Uso da classe
const auth = new AuthManager();
const tenantPoolManager = new TenantPoolManager(auth);
```

## 🎨 Componentes de Interface (React)

### Lista de Pools
```jsx
import React, { useState, useEffect } from 'react';

const TenantPoolsList = ({ tenantId, tenantPoolManager, userRole }) => {
  const [pools, setPools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPools();
  }, [tenantId]);

  const loadPools = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantPoolManager.listPools(tenantId);
      setPools(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePool = async (poolName) => {
    if (!PermissionManager.canManagePools(userRole)) {
      alert('Você não tem permissão para deletar pools');
      return;
    }

    if (!confirm('Tem certeza que deseja deletar este pool? Todas as rotas associadas serão afetadas.')) {
      return;
    }

    try {
      const shortName = poolName.replace(`${tenantId}:pool:`, '');
      await tenantPoolManager.deletePool(tenantId, shortName);
      setPools(pools.filter(p => p.name !== poolName));
    } catch (err) {
      alert('Erro ao deletar pool: ' + err.message);
    }
  };

  const formatAlgorithm = (algorithm) => {
    const algorithmNames = {
      'round_robin': 'Round Robin',
      'least_connections': 'Menor Conexões',
      'weighted_round_robin': 'Round Robin Ponderado',
      'ip_hash': 'Hash por IP',
      'least_time': 'Menor Tempo'
    };
    return algorithmNames[algorithm] || algorithm;
  };

  const getPoolHealth = (pool) => {
    if (!pool.backends.length) return 'empty';
    
    const activeBackends = pool.backends.filter(b => b.status === 'active').length;
    const totalBackends = pool.backends.length;
    
    if (activeBackends === 0) return 'unhealthy';
    if (activeBackends === totalBackends) return 'healthy';
    return 'degraded';
  };

  const getHealthColor = (health) => {
    const colors = {
      'healthy': '#10b981',
      'degraded': '#f59e0b',
      'unhealthy': '#ef4444',
      'empty': '#6b7280'
    };
    return colors[health];
  };

  if (loading) return <div>Carregando pools...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="tenant-pools">
      <div className="pools-header">
        <h2>Pools de Load Balancing</h2>
        {PermissionManager.canManagePools(userRole) && (
          <button onClick={() => window.location.href = `/tenants/${tenantId}/pools/add`}>
            Criar Novo Pool
          </button>
        )}
      </div>

      <div className="pools-grid">
        {pools.map(pool => {
          const health = getPoolHealth(pool);
          const shortName = pool.name.replace(`${tenantId}:pool:`, '');
          
          return (
            <div key={pool.name} className="pool-card">
              <div className="pool-header">
                <h3>{shortName}</h3>
                <div className="pool-status">
                  <span 
                    className="status-indicator"
                    style={{ backgroundColor: getHealthColor(health) }}
                  ></span>
                  <span className="status-text">
                    {health === 'healthy' && 'Saudável'}
                    {health === 'degraded' && 'Degradado'}
                    {health === 'unhealthy' && 'Não Saudável'}
                    {health === 'empty' && 'Sem Backends'}
                  </span>
                </div>
              </div>
              
              <div className="pool-details">
                <p><strong>Algoritmo:</strong> {formatAlgorithm(pool.algorithm)}</p>
                <p><strong>Sessões Persistentes:</strong> {pool.sticky_sessions ? 'Sim' : 'Não'}</p>
                <p><strong>Backends:</strong> {pool.backends.length}</p>
                <p><strong>Ativos:</strong> {pool.backends.filter(b => b.status === 'active').length}</p>
              </div>

              <div className="pool-backends">
                <h4>Backends:</h4>
                {pool.backends.length > 0 ? (
                  <ul>
                    {pool.backends.slice(0, 3).map(backend => (
                      <li key={backend.address} className={`backend-item ${backend.status}`}>
                        {backend.address} 
                        <span className="backend-weight">(peso: {backend.weight || 1})</span>
                      </li>
                    ))}
                    {pool.backends.length > 3 && (
                      <li className="more-backends">
                        +{pool.backends.length - 3} mais
                      </li>
                    )}
                  </ul>
                ) : (
                  <p className="no-backends">Nenhum backend configurado</p>
                )}
              </div>

              {PermissionManager.canManagePools(userRole) && (
                <div className="pool-actions">
                  <button 
                    onClick={() => window.location.href = `/tenants/${tenantId}/pools/${shortName}`}
                  >
                    Gerenciar
                  </button>
                  <button 
                    onClick={() => handleDeletePool(pool.name)}
                    className="delete-btn"
                  >
                    Deletar
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {pools.length === 0 && (
        <div className="empty-state">
          <p>Nenhum pool configurado</p>
          {PermissionManager.canManagePools(userRole) && (
            <button onClick={() => window.location.href = `/tenants/${tenantId}/pools/add`}>
              Criar Primeiro Pool
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default TenantPoolsList;
```

### Formulário de Criação/Edição de Pool
```jsx
import React, { useState, useEffect } from 'react';

const PoolForm = ({ tenantId, poolName = null, tenantPoolManager, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    algorithm: 'round_robin',
    sticky_sessions: false
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(!!poolName);

  useEffect(() => {
    if (poolName) {
      loadPool();
    }
  }, [poolName]);

  const loadPool = async () => {
    try {
      setLoading(true);
      const pool = await tenantPoolManager.getPool(tenantId, poolName);
      setFormData({
        name: pool.name.replace(`${tenantId}:pool:`, ''),
        algorithm: pool.algorithm,
        sticky_sessions: pool.sticky_sessions
      });
    } catch (error) {
      alert('Erro ao carregar pool: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEdit) {
        const updated = await tenantPoolManager.updatePool(tenantId, poolName, {
          algorithm: formData.algorithm,
          sticky_sessions: formData.sticky_sessions
        });
        onSave?.(updated);
        alert('Pool atualizado com sucesso!');
      } else {
        const created = await tenantPoolManager.createPool(tenantId, formData);
        onSave?.(created);
        alert('Pool criado com sucesso!');
        
        // Resetar formulário
        setFormData({
          name: '',
          algorithm: 'round_robin',
          sticky_sessions: false
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
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const algorithmOptions = [
    { value: 'round_robin', label: 'Round Robin' },
    { value: 'least_connections', label: 'Menor Conexões' },
    { value: 'weighted_round_robin', label: 'Round Robin Ponderado' },
    { value: 'ip_hash', label: 'Hash por IP' },
    { value: 'least_time', label: 'Menor Tempo' }
  ];

  return (
    <form onSubmit={handleSubmit} className="pool-form">
      <h2>{isEdit ? 'Editar Pool' : 'Criar Novo Pool'}</h2>
      
      <div className="form-group">
        <label htmlFor="name">Nome do Pool</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={isEdit}
          placeholder="api-backend"
          required
        />
        {isEdit && (
          <small>O nome do pool não pode ser alterado após a criação</small>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="algorithm">Algoritmo de Load Balancing</label>
        <select
          id="algorithm"
          name="algorithm"
          value={formData.algorithm}
          onChange={handleChange}
          required
        >
          {algorithmOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <small>
          {formData.algorithm === 'round_robin' && 'Distribui requisições igualmente entre backends'}
          {formData.algorithm === 'least_connections' && 'Direciona para o backend com menos conexões ativas'}
          {formData.algorithm === 'weighted_round_robin' && 'Round robin baseado no peso dos backends'}
          {formData.algorithm === 'ip_hash' && 'Usa hash do IP do cliente para determinismo'}
          {formData.algorithm === 'least_time' && 'Direciona para o backend com menor tempo de resposta'}
        </small>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            name="sticky_sessions"
            checked={formData.sticky_sessions}
            onChange={handleChange}
          />
          Habilitar Sessões Persistentes (Sticky Sessions)
        </label>
        <small>
          Mantém o usuário sempre no mesmo backend durante a sessão
        </small>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')} Pool
      </button>
    </form>
  );
};

export default PoolForm;
```

### Gerenciador de Backends
```jsx
import React, { useState, useEffect } from 'react';

const BackendManager = ({ tenantId, poolName, tenantPoolManager }) => {
  const [pool, setPool] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newBackend, setNewBackend] = useState({
    address: '',
    weight: 1,
    max_connections: 100,
    timeout: '30s',
    health_check: {
      enabled: true,
      path: '/health',
      interval: '30s',
      timeout: '10s',
      healthy_threshold: 2,
      unhealthy_threshold: 3
    }
  });

  useEffect(() => {
    loadPool();
  }, [poolName]);

  const loadPool = async () => {
    try {
      setLoading(true);
      const poolData = await tenantPoolManager.getPool(tenantId, poolName);
      setPool(poolData);
    } catch (error) {
      alert('Erro ao carregar pool: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddBackend = async (e) => {
    e.preventDefault();
    
    try {
      await tenantPoolManager.addBackend(tenantId, poolName, newBackend);
      await loadPool(); // Recarregar dados do pool
      setShowAddForm(false);
      setNewBackend({
        address: '',
        weight: 1,
        max_connections: 100,
        timeout: '30s',
        health_check: {
          enabled: true,
          path: '/health',
          interval: '30s',
          timeout: '10s',
          healthy_threshold: 2,
          unhealthy_threshold: 3
        }
      });
      alert('Backend adicionado com sucesso!');
    } catch (error) {
      alert('Erro ao adicionar backend: ' + error.message);
    }
  };

  const handleRemoveBackend = async (backendAddress) => {
    if (!confirm(`Tem certeza que deseja remover o backend ${backendAddress}?`)) {
      return;
    }

    try {
      await tenantPoolManager.removeBackend(tenantId, poolName, backendAddress);
      await loadPool(); // Recarregar dados do pool
      alert('Backend removido com sucesso!');
    } catch (error) {
      alert('Erro ao remover backend: ' + error.message);
    }
  };

  const handleBackendChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [section, field] = name.split('.');
      setNewBackend(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setNewBackend(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'active': '#10b981',
      'inactive': '#ef4444',
      'maintenance': '#f59e0b'
    };
    return colors[status] || '#6b7280';
  };

  const formatStatus = (status) => {
    const statusNames = {
      'active': 'Ativo',
      'inactive': 'Inativo',
      'maintenance': 'Manutenção'
    };
    return statusNames[status] || status;
  };

  if (loading) return <div>Carregando pool...</div>;
  if (!pool) return <div>Pool não encontrado</div>;

  return (
    <div className="backend-manager">
      <div className="pool-info">
        <h2>Pool: {pool.name.replace(`${tenantId}:pool:`, '')}</h2>
        <div className="pool-stats">
          <span>Algoritmo: {pool.algorithm}</span>
          <span>Sticky Sessions: {pool.sticky_sessions ? 'Sim' : 'Não'}</span>
          <span>Total de Backends: {pool.backends.length}</span>
          <span>Ativos: {pool.backends.filter(b => b.status === 'active').length}</span>
        </div>
      </div>

      <div className="backends-section">
        <div className="section-header">
          <h3>Backends</h3>
          <button onClick={() => setShowAddForm(!showAddForm)}>
            {showAddForm ? 'Cancelar' : 'Adicionar Backend'}
          </button>
        </div>

        {showAddForm && (
          <form onSubmit={handleAddBackend} className="add-backend-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="address">Endereço (IP:Porta)</label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={newBackend.address}
                  onChange={handleBackendChange}
                  placeholder="192.168.1.10:8080"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="weight">Peso</label>
                <input
                  type="number"
                  id="weight"
                  name="weight"
                  value={newBackend.weight}
                  onChange={handleBackendChange}
                  min="1"
                  max="100"
                />
              </div>

              <div className="form-group">
                <label htmlFor="max_connections">Máx. Conexões</label>
                <input
                  type="number"
                  id="max_connections"
                  name="max_connections"
                  value={newBackend.max_connections}
                  onChange={handleBackendChange}
                  min="1"
                />
              </div>

              <div className="form-group">
                <label htmlFor="timeout">Timeout</label>
                <select
                  id="timeout"
                  name="timeout"
                  value={newBackend.timeout}
                  onChange={handleBackendChange}
                >
                  <option value="10s">10s</option>
                  <option value="30s">30s</option>
                  <option value="60s">60s</option>
                  <option value="120s">2min</option>
                </select>
              </div>
            </div>

            <div className="health-check-section">
              <h4>Health Check</h4>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="health_check.enabled"
                    checked={newBackend.health_check.enabled}
                    onChange={handleBackendChange}
                  />
                  Habilitar Health Check
                </label>
              </div>

              {newBackend.health_check.enabled && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="health_path">Path</label>
                    <input
                      type="text"
                      id="health_path"
                      name="health_check.path"
                      value={newBackend.health_check.path}
                      onChange={handleBackendChange}
                      placeholder="/health"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="health_interval">Intervalo</label>
                    <select
                      id="health_interval"
                      name="health_check.interval"
                      value={newBackend.health_check.interval}
                      onChange={handleBackendChange}
                    >
                      <option value="10s">10s</option>
                      <option value="30s">30s</option>
                      <option value="60s">60s</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="health_timeout">Timeout</label>
                    <select
                      id="health_timeout"
                      name="health_check.timeout"
                      value={newBackend.health_check.timeout}
                      onChange={handleBackendChange}
                    >
                      <option value="5s">5s</option>
                      <option value="10s">10s</option>
                      <option value="15s">15s</option>
                    </select>
                  </div>
                </div>
              )}
            </div>

            <button type="submit">Adicionar Backend</button>
          </form>
        )}

        <div className="backends-list">
          {pool.backends.length > 0 ? (
            <table className="backends-table">
              <thead>
                <tr>
                  <th>Endereço</th>
                  <th>Status</th>
                  <th>Peso</th>
                  <th>Máx. Conexões</th>
                  <th>Health Check</th>
                  <th>Último Check</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {pool.backends.map(backend => (
                  <tr key={backend.address}>
                    <td>{backend.address}</td>
                    <td>
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(backend.status) }}
                      >
                        {formatStatus(backend.status)}
                      </span>
                    </td>
                    <td>{backend.weight || 1}</td>
                    <td>{backend.max_connections || 'N/A'}</td>
                    <td>
                      {backend.health_check?.enabled ? (
                        <span className="health-enabled">
                          {backend.health_check.path} ({backend.health_check.interval})
                        </span>
                      ) : (
                        <span className="health-disabled">Desabilitado</span>
                      )}
                    </td>
                    <td>
                      {backend.last_check 
                        ? new Date(backend.last_check).toLocaleString()
                        : 'N/A'
                      }
                    </td>
                    <td>
                      <button 
                        onClick={() => handleRemoveBackend(backend.address)}
                        className="remove-btn"
                      >
                        Remover
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-backends">
              <p>Nenhum backend configurado neste pool</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BackendManager;
```

## 📊 Algoritmos de Load Balancing

```javascript
// Constantes para algoritmos
const LOAD_BALANCING_ALGORITHMS = {
  ROUND_ROBIN: 'round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  IP_HASH: 'ip_hash',
  LEAST_TIME: 'least_time'
};

// Descrições dos algoritmos
const ALGORITHM_DESCRIPTIONS = {
  [LOAD_BALANCING_ALGORITHMS.ROUND_ROBIN]: {
    name: 'Round Robin',
    description: 'Distribui requisições sequencialmente entre todos os backends ativos',
    useCase: 'Ideal quando todos os backends têm capacidade similar',
    pros: ['Simples', 'Distribuição uniforme'],
    cons: ['Não considera carga atual dos servidores']
  },
  [LOAD_BALANCING_ALGORITHMS.LEAST_CONNECTIONS]: {
    name: 'Menor Conexões',
    description: 'Direciona para o backend com menos conexões ativas',
    useCase: 'Bom para sessões de longa duração',
    pros: ['Considera carga atual', 'Adapta-se automaticamente'],
    cons: ['Mais complexo', 'Overhead de monitoramento']
  },
  [LOAD_BALANCING_ALGORITHMS.WEIGHTED_ROUND_ROBIN]: {
    name: 'Round Robin Ponderado',
    description: 'Round robin baseado no peso configurado de cada backend',
    useCase: 'Quando backends têm capacidades diferentes',
    pros: ['Flexível', 'Permite balanceamento proporcional'],
    cons: ['Requer configuração manual de pesos']
  },
  [LOAD_BALANCING_ALGORITHMS.IP_HASH]: {
    name: 'Hash por IP',
    description: 'Usa hash do IP do cliente para determinismo',
    useCase: 'Quando precisa de consistência de servidor por cliente',
    pros: ['Determinístico', 'Mantém afinidade'],
    cons: ['Distribuição pode ser desigual']
  },
  [LOAD_BALANCING_ALGORITHMS.LEAST_TIME]: {
    name: 'Menor Tempo',
    description: 'Direciona para o backend com menor tempo de resposta',
    useCase: 'Para otimizar performance e latência',
    pros: ['Performance otimizada', 'Adapta-se dinamicamente'],
    cons: ['Mais complexo', 'Requer métricas em tempo real']
  }
};

// Função para obter informações do algoritmo
function getAlgorithmInfo(algorithm) {
  return ALGORITHM_DESCRIPTIONS[algorithm] || {
    name: algorithm,
    description: 'Algoritmo personalizado',
    useCase: 'Conforme configuração específica',
    pros: [],
    cons: []
  };
}
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro específicos de pools e backends
const POOL_ERRORS = {
  POOL_NOT_FOUND: 'Pool não encontrado',
  POOL_NAME_EXISTS: 'Nome do pool já existe',
  BACKEND_NOT_FOUND: 'Backend não encontrado',
  BACKEND_ADDRESS_EXISTS: 'Endereço do backend já existe no pool',
  INVALID_ALGORITHM: 'Algoritmo de load balancing inválido',
  INVALID_ADDRESS: 'Endereço do backend inválido',
  POOL_IN_USE: 'Pool está sendo usado por rotas'
};

// Função para tratar erros de pools
function handlePoolError(error, response) {
  switch (response?.status) {
    case 400:
      if (error.message.includes('algorithm')) {
        return 'Algoritmo de load balancing inválido.';
      }
      if (error.message.includes('address')) {
        return 'Endereço do backend inválido. Use o formato IP:porta.';
      }
      if (error.message.includes('name')) {
        return 'Nome do pool inválido ou já existe.';
      }
      return 'Dados do pool inválidos.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para gerenciar pools.';
    case 404:
      return 'Pool ou backend não encontrado.';
    case 409:
      return 'Conflito: Pool já existe ou backend já está no pool.';
    case 422:
      return 'Não é possível deletar: Pool está sendo usado por rotas.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return 'Erro desconhecido. Entre em contato com o suporte.';
  }
}
```

## 🔍 Monitoramento e Health Checks

```javascript
// Classe para monitorar saúde dos pools
class PoolHealthMonitor {
  constructor(tenantPoolManager, tenantId) {
    this.poolManager = tenantPoolManager;
    this.tenantId = tenantId;
  }

  // Verificar saúde de todos os pools
  async checkAllPools() {
    const pools = await this.poolManager.listPools(this.tenantId);
    const healthResults = [];

    for (const pool of pools) {
      const poolHealth = await this.checkPoolHealth(pool);
      healthResults.push(poolHealth);
    }

    return healthResults;
  }

  // Verificar saúde de um pool específico
  async checkPoolHealth(pool) {
    const backends = pool.backends || [];
    const activeBackends = backends.filter(b => b.status === 'active');
    
    return {
      poolName: pool.name,
      totalBackends: backends.length,
      activeBackends: activeBackends.length,
      healthyBackends: backends.filter(b => b.status === 'active' && b.health_check?.enabled).length,
      status: this.calculatePoolStatus(backends),
      lastCheck: new Date().toISOString()
    };
  }

  // Calcular status geral do pool
  calculatePoolStatus(backends) {
    if (backends.length === 0) return 'empty';
    
    const activeCount = backends.filter(b => b.status === 'active').length;
    const totalCount = backends.length;
    
    if (activeCount === 0) return 'down';
    if (activeCount === totalCount) return 'healthy';
    if (activeCount >= totalCount * 0.5) return 'degraded';
    return 'critical';
  }

  // Testar conectividade de um backend
  async testBackend(backend) {
    const [host, port] = backend.address.split(':');
    
    try {
      // Simular teste de conectividade
      const testUrl = `http://${host}:${port}${backend.health_check?.path || '/'}`;
      const startTime = Date.now();
      
      const response = await fetch(testUrl, {
        method: 'GET',
        timeout: parseInt(backend.health_check?.timeout || '10s') * 1000
      });

      return {
        address: backend.address,
        status: response.ok ? 'healthy' : 'unhealthy',
        responseTime: Date.now() - startTime,
        statusCode: response.status,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        address: backend.address,
        status: 'error',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // Obter estatísticas detalhadas
  async getDetailedStats() {
    const pools = await this.poolManager.listPools(this.tenantId);
    
    return {
      summary: {
        totalPools: pools.length,
        totalBackends: pools.reduce((sum, p) => sum + p.backends.length, 0),
        activeBackends: pools.reduce((sum, p) => 
          sum + p.backends.filter(b => b.status === 'active').length, 0
        ),
        healthyPools: pools.filter(p => 
          p.backends.length > 0 && p.backends.every(b => b.status === 'active')
        ).length
      },
      pools: pools.map(pool => ({
        name: pool.name.replace(`${this.tenantId}:pool:`, ''),
        algorithm: pool.algorithm,
        backends: pool.backends.length,
        active: pool.backends.filter(b => b.status === 'active').length,
        status: this.calculatePoolStatus(pool.backends)
      })),
      algorithms: this.getAlgorithmDistribution(pools),
      backendDistribution: this.getBackendDistribution(pools)
    };
  }

  // Distribuição de algoritmos
  getAlgorithmDistribution(pools) {
    const distribution = {};
    pools.forEach(pool => {
      distribution[pool.algorithm] = (distribution[pool.algorithm] || 0) + 1;
    });
    return distribution;
  }

  // Distribuição de backends por pool
  getBackendDistribution(pools) {
    const distribution = { '0': 0, '1-5': 0, '6-10': 0, '10+': 0 };
    
    pools.forEach(pool => {
      const count = pool.backends.length;
      if (count === 0) distribution['0']++;
      else if (count <= 5) distribution['1-5']++;
      else if (count <= 10) distribution['6-10']++;
      else distribution['10+']++;
    });
    
    return distribution;
  }
}
```
