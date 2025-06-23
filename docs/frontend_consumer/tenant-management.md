# Gerenciamento de Tenants - Tenant API

Este documento detalha como gerenciar tenants. **Nota:** Estes endpoints são exclusivos para usuários com role `owner`.

## 🏢 Endpoints de Gerenciamento de Tenants

### 1. Listar Todos os Tenants
Lista todos os tenants do sistema.

**Endpoint:** `GET /api/tenants`  
**Autenticação:** Token requerido (Role: Owner)

```javascript
// Exemplo de implementação
async function listTenants() {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar tenants: ${response.status}`);
    }

    const tenants = await response.json();
    return tenants;
  } catch (error) {
    console.error('Erro ao listar tenants:', error);
    throw error;
  }
}

// Resposta esperada
[
  {
    "id": "tenant1",
    "name": "Empresa A",
    "active": true,
    "created_at": "2024-01-15T10:30:00Z",
    "plan": "enterprise",
    "contact_email": "admin@empresaa.com",
    "custom_domain": "api.empresaa.com",
    "limits": {
      "max_requests_per_second": 1000,
      "max_burst_size": 2000,
      "waf_level": "strict"
    }
  }
]
```

### 2. Criar Novo Tenant
Cria um novo tenant no sistema.

**Endpoint:** `POST /api/tenants`  
**Autenticação:** Token requerido (Role: Owner)

```javascript
// Exemplo de implementação
async function createTenant(tenantData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(tenantData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar tenant: ${response.status}`);
    }

    const newTenant = await response.json();
    return newTenant;
  } catch (error) {
    console.error('Erro ao criar tenant:', error);
    throw error;
  }
}

// Payload de requisição
{
  "id": "empresa-nova",
  "name": "Empresa Nova Ltda",
  "plan": "pro",
  "contact_email": "contato@empresanova.com",
  "custom_domain": "api.empresanova.com"
}

// Resposta esperada (Status: 201)
{
  "id": "empresa-nova",
  "name": "Empresa Nova Ltda",
  "active": true,
  "created_at": "2024-06-23T15:30:00Z",
  "plan": "pro",
  "contact_email": "contato@empresanova.com",
  "custom_domain": "api.empresanova.com"
}
```

### 3. Obter Tenant Específico
Retorna informações detalhadas de um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}`  
**Autenticação:** Token requerido (Role: Owner)

```javascript
// Exemplo de implementação
async function getTenant(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter tenant: ${response.status}`);
    }

    const tenant = await response.json();
    return tenant;
  } catch (error) {
    console.error('Erro ao obter tenant:', error);
    throw error;
  }
}

// Resposta esperada
{
  "id": "empresa-nova",
  "name": "Empresa Nova Ltda",
  "active": true,
  "created_at": "2024-06-23T15:30:00Z",
  "plan": "pro",
  "contact_email": "contato@empresanova.com",
  "custom_domain": "api.empresanova.com",
  "limits": {
    "max_requests_per_second": 500,
    "max_burst_size": 1000,
    "waf_level": "medium"
  }
}
```

### 4. Atualizar Tenant
Atualiza informações de um tenant existente.

**Endpoint:** `PUT /api/tenants/{tenant_id}`  
**Autenticação:** Token requerido (Role: Owner)

```javascript
// Exemplo de implementação
async function updateTenant(tenantId, updateData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar tenant: ${response.status}`);
    }

    const updatedTenant = await response.json();
    return updatedTenant;
  } catch (error) {
    console.error('Erro ao atualizar tenant:', error);
    throw error;
  }
}

// Payload de requisição
{
  "name": "Empresa Nova S.A.",
  "plan": "enterprise",
  "active": true,
  "contact_email": "novoemail@empresanova.com",
  "custom_domain": "newapi.empresanova.com",
  "limits": {
    "max_requests_per_second": 1000,
    "max_burst_size": 2000,
    "waf_level": "strict"
  }
}

// Resposta esperada
{
  "id": "empresa-nova",
  "name": "Empresa Nova S.A.",
  "active": true,
  "created_at": "2024-06-23T15:30:00Z",
  "plan": "enterprise",
  "contact_email": "novoemail@empresanova.com",
  "custom_domain": "newapi.empresanova.com",
  "limits": {
    "max_requests_per_second": 1000,
    "max_burst_size": 2000,
    "waf_level": "strict"
  }
}
```

### 5. Deletar Tenant
Remove um tenant do sistema.

**Endpoint:** `DELETE /api/tenants/{tenant_id}`  
**Autenticação:** Token requerido (Role: Owner)

```javascript
// Exemplo de implementação
async function deleteTenant(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar tenant: ${response.status}`);
    }

    // Resposta vazia com status 204
    return true;
  } catch (error) {
    console.error('Erro ao deletar tenant:', error);
    throw error;
  }
}
```

## 🔧 Classe TenantManager

```javascript
class TenantManager {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // Listar todos os tenants
  async listTenants() {
    const response = await fetch(`${this.baseUrl}/api/tenants`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar tenants: ${response.status}`);
    }

    return await response.json();
  }

  // Criar novo tenant
  async createTenant(tenantData) {
    const response = await fetch(`${this.baseUrl}/api/tenants`, {
      method: 'POST',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(tenantData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao criar tenant: ${response.status}`);
    }

    return await response.json();
  }

  // Obter tenant específico
  async getTenant(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter tenant: ${response.status}`);
    }

    return await response.json();
  }

  // Atualizar tenant
  async updateTenant(tenantId, updateData) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar tenant: ${response.status}`);
    }

    return await response.json();
  }

  // Deletar tenant
  async deleteTenant(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}`, {
      method: 'DELETE',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao deletar tenant: ${response.status}`);
    }

    return true;
  }

  // Validar dados do tenant
  validateTenantData(data) {
    const errors = [];

    if (!data.id || data.id.trim().length < 3) {
      errors.push('ID do tenant deve ter pelo menos 3 caracteres');
    }

    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome do tenant deve ter pelo menos 2 caracteres');
    }

    if (!data.contact_email || !this.isValidEmail(data.contact_email)) {
      errors.push('Email de contato inválido');
    }

    if (!['free', 'pro', 'enterprise'].includes(data.plan)) {
      errors.push('Plano deve ser: free, pro ou enterprise');
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  // Validar email
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// Uso da classe
const auth = new AuthManager();
const tenantManager = new TenantManager(auth);
```

## 🎨 Componentes de Interface (React)

### Lista de Tenants
```jsx
import React, { useState, useEffect } from 'react';

const TenantsList = ({ tenantManager }) => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantManager.listTenants();
      setTenants(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tenantId) => {
    if (!confirm('Tem certeza que deseja deletar este tenant?')) {
      return;
    }

    try {
      await tenantManager.deleteTenant(tenantId);
      setTenants(tenants.filter(t => t.id !== tenantId));
    } catch (err) {
      alert('Erro ao deletar tenant: ' + err.message);
    }
  };

  if (loading) return <div>Carregando tenants...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="tenants-list">
      <h2>Tenants</h2>
      <div className="tenants-grid">
        {tenants.map(tenant => (
          <div key={tenant.id} className="tenant-card">
            <div className="tenant-header">
              <h3>{tenant.name}</h3>
              <span className={`status ${tenant.active ? 'active' : 'inactive'}`}>
                {tenant.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>
            <div className="tenant-info">
              <p><strong>ID:</strong> {tenant.id}</p>
              <p><strong>Plano:</strong> {tenant.plan}</p>
              <p><strong>Email:</strong> {tenant.contact_email}</p>
              <p><strong>Criado:</strong> {new Date(tenant.created_at).toLocaleDateString()}</p>
            </div>
            <div className="tenant-actions">
              <button onClick={() => window.location.href = `/tenants/${tenant.id}/edit`}>
                Editar
              </button>
              <button 
                onClick={() => handleDelete(tenant.id)}
                className="delete-btn"
              >
                Deletar
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TenantsList;
```

### Formulário de Criação/Edição de Tenant
```jsx
import React, { useState, useEffect } from 'react';

const TenantForm = ({ tenantManager, tenantId = null, onSave }) => {
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    plan: 'free',
    contact_email: '',
    custom_domain: '',
    active: true
  });
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(!!tenantId);

  useEffect(() => {
    if (tenantId) {
      loadTenant();
    }
  }, [tenantId]);

  const loadTenant = async () => {
    try {
      setLoading(true);
      const tenant = await tenantManager.getTenant(tenantId);
      setFormData(tenant);
    } catch (error) {
      alert('Erro ao carregar tenant: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      if (isEdit) {
        const updated = await tenantManager.updateTenant(tenantId, formData);
        onSave?.(updated);
        alert('Tenant atualizado com sucesso!');
      } else {
        tenantManager.validateTenantData(formData);
        const created = await tenantManager.createTenant(formData);
        onSave?.(created);
        alert('Tenant criado com sucesso!');
        
        // Limpar formulário após criação
        setFormData({
          id: '',
          name: '',
          plan: 'free',
          contact_email: '',
          custom_domain: '',
          active: true
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

  return (
    <form onSubmit={handleSubmit} className="tenant-form">
      <h2>{isEdit ? 'Editar Tenant' : 'Criar Novo Tenant'}</h2>
      
      <div className="form-group">
        <label htmlFor="id">ID do Tenant</label>
        <input
          type="text"
          id="id"
          name="id"
          value={formData.id}
          onChange={handleChange}
          disabled={isEdit}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="name">Nome</label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="plan">Plano</label>
        <select
          id="plan"
          name="plan"
          value={formData.plan}
          onChange={handleChange}
          required
        >
          <option value="free">Free</option>
          <option value="pro">Pro</option>
          <option value="enterprise">Enterprise</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="contact_email">Email de Contato</label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          value={formData.contact_email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="custom_domain">Domínio Customizado (opcional)</label>
        <input
          type="text"
          id="custom_domain"
          name="custom_domain"
          value={formData.custom_domain}
          onChange={handleChange}
          placeholder="api.exemplo.com"
        />
      </div>

      {isEdit && (
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              name="active"
              checked={formData.active}
              onChange={handleChange}
            />
            Tenant Ativo
          </label>
        </div>
      )}

      <button type="submit" disabled={loading}>
        {loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar')} Tenant
      </button>
    </form>
  );
};

export default TenantForm;
```

## 📊 Tipos de Planos e Limites

```javascript
// Constantes para planos
const TENANT_PLANS = {
  FREE: 'free',
  PRO: 'pro',
  ENTERPRISE: 'enterprise'
};

// Limites por plano
const PLAN_LIMITS = {
  [TENANT_PLANS.FREE]: {
    max_requests_per_second: 100,
    max_burst_size: 200,
    max_users: 5,
    waf_level: 'basic'
  },
  [TENANT_PLANS.PRO]: {
    max_requests_per_second: 500,
    max_burst_size: 1000,
    max_users: 50,
    waf_level: 'medium'
  },
  [TENANT_PLANS.ENTERPRISE]: {
    max_requests_per_second: 1000,
    max_burst_size: 2000,
    max_users: -1, // ilimitado
    waf_level: 'strict'
  }
};

// Função para obter limites do plano
function getPlanLimits(plan) {
  return PLAN_LIMITS[plan] || PLAN_LIMITS[TENANT_PLANS.FREE];
}

// Função para formatar plano
function formatPlan(plan) {
  const planNames = {
    'free': 'Gratuito',
    'pro': 'Profissional',
    'enterprise': 'Empresarial'
  };
  return planNames[plan] || plan;
}
```

## ⚠️ Tratamento de Erros Específicos

```javascript
// Códigos de erro específicos de tenants
const TENANT_ERRORS = {
  TENANT_EXISTS: 'Tenant já existe',
  TENANT_NOT_FOUND: 'Tenant não encontrado',
  INVALID_PLAN: 'Plano inválido',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
  TENANT_INACTIVE: 'Tenant inativo'
};

// Função para tratar erros de tenant
function handleTenantError(error, response) {
  switch (response?.status) {
    case 400:
      if (error.message.includes('already exists')) {
        return 'Este ID de tenant já existe. Escolha outro ID.';
      }
      return 'Dados inválidos. Verifique os campos obrigatórios.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para gerenciar tenants.';
    case 404:
      return 'Tenant não encontrado.';
    case 409:
      return 'Conflito: Este tenant já existe ou possui dependências.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return 'Erro desconhecido. Entre em contato com o suporte.';
  }
}
```

## 🔍 Filtros e Busca

```javascript
// Classe para filtrar tenants
class TenantFilter {
  constructor(tenants) {
    this.tenants = tenants;
  }

  // Filtrar por status
  byStatus(active = true) {
    return this.tenants.filter(tenant => tenant.active === active);
  }

  // Filtrar por plano
  byPlan(plan) {
    return this.tenants.filter(tenant => tenant.plan === plan);
  }

  // Buscar por nome ou email
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(lowerQuery) ||
      tenant.contact_email.toLowerCase().includes(lowerQuery) ||
      tenant.id.toLowerCase().includes(lowerQuery)
    );
  }

  // Ordenar por data de criação
  sortByCreatedAt(ascending = false) {
    return [...this.tenants].sort((a, b) => {
      const dateA = new Date(a.created_at);
      const dateB = new Date(b.created_at);
      return ascending ? dateA - dateB : dateB - dateA;
    });
  }

  // Aplicar múltiplos filtros
  applyFilters({ status, plan, search, sortBy }) {
    let filtered = [...this.tenants];

    if (status !== undefined) {
      filtered = filtered.filter(tenant => tenant.active === status);
    }

    if (plan) {
      filtered = filtered.filter(tenant => tenant.plan === plan);
    }

    if (search) {
      const lowerQuery = search.toLowerCase();
      filtered = filtered.filter(tenant => 
        tenant.name.toLowerCase().includes(lowerQuery) ||
        tenant.contact_email.toLowerCase().includes(lowerQuery) ||
        tenant.id.toLowerCase().includes(lowerQuery)
      );
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'created_at') {
      filtered.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    return filtered;
  }
}
```
