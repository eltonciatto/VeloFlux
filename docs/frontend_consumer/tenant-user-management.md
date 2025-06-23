# Gerenciamento de Usuários - Tenant API

Este documento detalha como gerenciar usuários dentro de um tenant específico.

## 👥 Endpoints de Gerenciamento de Usuários

### 1. Listar Usuários do Tenant
Lista todos os usuários de um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/users`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function listTenantUsers(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/users`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar usuários: ${response.status}`);
    }

    const users = await response.json();
    return users;
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    throw error;
  }
}

// Resposta esperada
[
  {
    "user_id": "user123",
    "email": "usuario@exemplo.com",
    "tenant_id": "tenant1",
    "role": "admin",
    "first_name": "João",
    "last_name": "Silva",
    "created_at": "2024-01-15T10:30:00Z",
    "last_login": "2024-06-23T09:15:00Z"
  }
]
```

### 2. Adicionar Usuário ao Tenant
Adiciona um novo usuário ao tenant.

**Endpoint:** `POST /api/tenants/{tenant_id}/users`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function addTenantUser(tenantId, userData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/users`, {
      method: 'POST',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar usuário: ${response.status}`);
    }

    const newUser = await response.json();
    return newUser;
  } catch (error) {
    console.error('Erro ao adicionar usuário:', error);
    throw error;
  }
}

// Payload de requisição
{
  "email": "novousuario@exemplo.com",
  "role": "member",
  "first_name": "Maria",
  "last_name": "Santos"
}

// Resposta esperada (Status: 201)
{
  "user_id": "user-20240623160405",
  "email": "novousuario@exemplo.com",
  "tenant_id": "tenant1",
  "role": "member",
  "first_name": "Maria",
  "last_name": "Santos"
}
```

### 3. Atualizar Usuário do Tenant
Atualiza informações de um usuário específico do tenant.

**Endpoint:** `PUT /api/tenants/{tenant_id}/users/{user_id}`  
**Autenticação:** Token requerido (Admin/Owner ou próprio usuário)

```javascript
// Exemplo de implementação
async function updateTenantUser(tenantId, userId, updateData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar usuário: ${response.status}`);
    }

    const updatedUser = await response.json();
    return updatedUser;
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    throw error;
  }
}

// Payload de requisição
{
  "role": "admin",
  "first_name": "Maria Clara",
  "last_name": "Santos Silva"
}

// Resposta esperada
{
  "user_id": "user-20240623160405",
  "email": "novousuario@exemplo.com",
  "tenant_id": "tenant1",
  "role": "admin",
  "first_name": "Maria Clara",
  "last_name": "Santos Silva"
}
```

### 4. Remover Usuário do Tenant
Remove um usuário específico do tenant.

**Endpoint:** `DELETE /api/tenants/{tenant_id}/users/{user_id}`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function removeTenantUser(tenantId, userId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/users/${userId}`, {
      method: 'DELETE',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao remover usuário: ${response.status}`);
    }

    // Resposta vazia com status 204
    return true;
  } catch (error) {
    console.error('Erro ao remover usuário:', error);
    throw error;
  }
}
```

## 🔧 Classe TenantUserManager

```javascript
class TenantUserManager {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // Listar usuários do tenant
  async listUsers(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/users`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao listar usuários: ${response.status}`);
    }

    return await response.json();
  }

  // Adicionar usuário ao tenant
  async addUser(tenantId, userData) {
    this.validateUserData(userData);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/users`, {
      method: 'POST',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao adicionar usuário: ${response.status}`);
    }

    return await response.json();
  }

  // Atualizar usuário
  async updateUser(tenantId, userId, updateData) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/users/${userId}`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(updateData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar usuário: ${response.status}`);
    }

    return await response.json();
  }

  // Remover usuário
  async removeUser(tenantId, userId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/users/${userId}`, {
      method: 'DELETE',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao remover usuário: ${response.status}`);
    }

    return true;
  }

  // Validar dados do usuário
  validateUserData(data) {
    const errors = [];

    if (!data.email || !this.isValidEmail(data.email)) {
      errors.push('Email inválido');
    }

    if (!data.role || !['owner', 'admin', 'member'].includes(data.role)) {
      errors.push('Role deve ser: owner, admin ou member');
    }

    if (data.first_name && data.first_name.length < 2) {
      errors.push('Primeiro nome deve ter pelo menos 2 caracteres');
    }

    if (data.last_name && data.last_name.length < 2) {
      errors.push('Sobrenome deve ter pelo menos 2 caracteres');
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

  // Obter usuário atual do tenant
  async getCurrentUser(tenantId) {
    const users = await this.listUsers(tenantId);
    const currentUserId = this.auth.getUserId();
    return users.find(user => user.user_id === currentUserId);
  }

  // Verificar permissões
  canManageUsers(userRole) {
    return ['owner', 'admin'].includes(userRole);
  }

  canEditUser(currentUserRole, targetUserRole) {
    const roleHierarchy = {
      'owner': 3,
      'admin': 2,
      'member': 1
    };

    return roleHierarchy[currentUserRole] > roleHierarchy[targetUserRole];
  }
}

// Uso da classe
const auth = new AuthManager();
const tenantUserManager = new TenantUserManager(auth);
```

## 🏷️ Sistema de Roles

```javascript
// Constantes para roles
const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member'
};

// Permissões por role
const ROLE_PERMISSIONS = {
  [USER_ROLES.OWNER]: {
    can_manage_tenant: true,
    can_manage_users: true,
    can_manage_routes: true,
    can_manage_pools: true,
    can_view_metrics: true,
    can_manage_billing: true,
    can_delete_tenant: true
  },
  [USER_ROLES.ADMIN]: {
    can_manage_tenant: false,
    can_manage_users: true,
    can_manage_routes: true,
    can_manage_pools: true,
    can_view_metrics: true,
    can_manage_billing: false,
    can_delete_tenant: false
  },
  [USER_ROLES.MEMBER]: {
    can_manage_tenant: false,
    can_manage_users: false,
    can_manage_routes: false,
    can_manage_pools: false,
    can_view_metrics: true,
    can_manage_billing: false,
    can_delete_tenant: false
  }
};

// Classe para gerenciar permissões
class PermissionManager {
  static hasPermission(userRole, permission) {
    const permissions = ROLE_PERMISSIONS[userRole];
    return permissions ? permissions[permission] || false : false;
  }

  static canManageUsers(userRole) {
    return this.hasPermission(userRole, 'can_manage_users');
  }

  static canManageRoutes(userRole) {
    return this.hasPermission(userRole, 'can_manage_routes');
  }

  static canViewMetrics(userRole) {
    return this.hasPermission(userRole, 'can_view_metrics');
  }

  static formatRole(role) {
    const roleNames = {
      'owner': 'Proprietário',
      'admin': 'Administrador',
      'member': 'Membro'
    };
    return roleNames[role] || role;
  }

  static getRoleColor(role) {
    const roleColors = {
      'owner': '#ff6b6b',
      'admin': '#4ecdc4',
      'member': '#45b7d1'
    };
    return roleColors[role] || '#95a5a6';
  }
}
```

## 🎨 Componentes de Interface (React)

### Lista de Usuários
```jsx
import React, { useState, useEffect } from 'react';

const TenantUsersList = ({ tenantId, tenantUserManager, currentUserRole }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadUsers();
  }, [tenantId]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await tenantUserManager.listUsers(tenantId);
      setUsers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveUser = async (userId, userRole) => {
    if (!PermissionManager.canManageUsers(currentUserRole)) {
      alert('Você não tem permissão para remover usuários');
      return;
    }

    if (!tenantUserManager.canEditUser(currentUserRole, userRole)) {
      alert('Você não pode remover um usuário com role superior');
      return;
    }

    if (!confirm('Tem certeza que deseja remover este usuário?')) {
      return;
    }

    try {
      await tenantUserManager.removeUser(tenantId, userId);
      setUsers(users.filter(u => u.user_id !== userId));
    } catch (err) {
      alert('Erro ao remover usuário: ' + err.message);
    }
  };

  const handleRoleChange = async (userId, newRole, currentRole) => {
    if (!PermissionManager.canManageUsers(currentUserRole)) {
      alert('Você não tem permissão para alterar roles');
      return;
    }

    if (!tenantUserManager.canEditUser(currentUserRole, currentRole)) {
      alert('Você não pode alterar um usuário com role superior');
      return;
    }

    try {
      const updatedUser = await tenantUserManager.updateUser(tenantId, userId, { role: newRole });
      setUsers(users.map(u => u.user_id === userId ? updatedUser : u));
    } catch (err) {
      alert('Erro ao alterar role: ' + err.message);
    }
  };

  if (loading) return <div>Carregando usuários...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div className="tenant-users">
      <div className="users-header">
        <h2>Usuários do Tenant</h2>
        {PermissionManager.canManageUsers(currentUserRole) && (
          <button onClick={() => window.location.href = `/tenants/${tenantId}/users/add`}>
            Adicionar Usuário
          </button>
        )}
      </div>

      <div className="users-table">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Role</th>
              <th>Último Login</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.user_id}>
                <td>{`${user.first_name} ${user.last_name}`}</td>
                <td>{user.email}</td>
                <td>
                  {PermissionManager.canManageUsers(currentUserRole) && 
                   tenantUserManager.canEditUser(currentUserRole, user.role) ? (
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.user_id, e.target.value, user.role)}
                    >
                      <option value="member">Membro</option>
                      <option value="admin">Admin</option>
                      {currentUserRole === 'owner' && (
                        <option value="owner">Owner</option>
                      )}
                    </select>
                  ) : (
                    <span className={`role-badge role-${user.role}`}>
                      {PermissionManager.formatRole(user.role)}
                    </span>
                  )}
                </td>
                <td>
                  {user.last_login 
                    ? new Date(user.last_login).toLocaleDateString() 
                    : 'Nunca'
                  }
                </td>
                <td>
                  {PermissionManager.canManageUsers(currentUserRole) && 
                   tenantUserManager.canEditUser(currentUserRole, user.role) && (
                    <button 
                      onClick={() => handleRemoveUser(user.user_id, user.role)}
                      className="remove-btn"
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TenantUsersList;
```

### Formulário de Adição de Usuário
```jsx
import React, { useState } from 'react';

const AddUserForm = ({ tenantId, tenantUserManager, currentUserRole, onSuccess }) => {
  const [formData, setFormData] = useState({
    email: '',
    role: 'member',
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      tenantUserManager.validateUserData(formData);
      const newUser = await tenantUserManager.addUser(tenantId, formData);
      onSuccess?.(newUser);
      
      // Limpar formulário
      setFormData({
        email: '',
        role: 'member',
        first_name: '',
        last_name: ''
      });
      
      alert('Usuário adicionado com sucesso!');
    } catch (error) {
      alert('Erro: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const availableRoles = () => {
    const roles = [
      { value: 'member', label: 'Membro' },
      { value: 'admin', label: 'Administrador' }
    ];
    
    if (currentUserRole === 'owner') {
      roles.push({ value: 'owner', label: 'Proprietário' });
    }
    
    return roles;
  };

  return (
    <form onSubmit={handleSubmit} className="add-user-form">
      <h3>Adicionar Novo Usuário</h3>
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="first_name">Primeiro Nome</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="last_name">Sobrenome</label>
        <input
          type="text"
          id="last_name"
          name="last_name"
          value={formData.last_name}
          onChange={handleChange}
        />
      </div>

      <div className="form-group">
        <label htmlFor="role">Role</label>
        <select
          id="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
          required
        >
          {availableRoles().map(role => (
            <option key={role.value} value={role.value}>
              {role.label}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" disabled={loading}>
        {loading ? 'Adicionando...' : 'Adicionar Usuário'}
      </button>
    </form>
  );
};

export default AddUserForm;
```

## 🔍 Filtros e Busca de Usuários

```javascript
// Classe para filtrar usuários
class UserFilter {
  constructor(users) {
    this.users = users;
  }

  // Filtrar por role
  byRole(role) {
    return this.users.filter(user => user.role === role);
  }

  // Buscar por nome ou email
  search(query) {
    const lowerQuery = query.toLowerCase();
    return this.users.filter(user => 
      `${user.first_name} ${user.last_name}`.toLowerCase().includes(lowerQuery) ||
      user.email.toLowerCase().includes(lowerQuery)
    );
  }

  // Filtrar por última atividade
  byLastLogin(daysAgo) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysAgo);
    
    return this.users.filter(user => {
      if (!user.last_login) return false;
      return new Date(user.last_login) >= cutoffDate;
    });
  }

  // Usuários ativos (logaram nos últimos 30 dias)
  getActiveUsers() {
    return this.byLastLogin(30);
  }

  // Usuários inativos
  getInactiveUsers() {
    const activeUsers = this.getActiveUsers();
    const activeUserIds = new Set(activeUsers.map(u => u.user_id));
    return this.users.filter(user => !activeUserIds.has(user.user_id));
  }

  // Ordenar por nome
  sortByName(ascending = true) {
    return [...this.users].sort((a, b) => {
      const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
      const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
      return ascending ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });
  }

  // Aplicar múltiplos filtros
  applyFilters({ role, search, activity, sortBy }) {
    let filtered = [...this.users];

    if (role) {
      filtered = filtered.filter(user => user.role === role);
    }

    if (search) {
      const lowerQuery = search.toLowerCase();
      filtered = filtered.filter(user => 
        `${user.first_name} ${user.last_name}`.toLowerCase().includes(lowerQuery) ||
        user.email.toLowerCase().includes(lowerQuery)
      );
    }

    if (activity === 'active') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      filtered = filtered.filter(user => 
        user.last_login && new Date(user.last_login) >= cutoffDate
      );
    } else if (activity === 'inactive') {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30);
      filtered = filtered.filter(user => 
        !user.last_login || new Date(user.last_login) < cutoffDate
      );
    }

    if (sortBy === 'name') {
      filtered.sort((a, b) => {
        const nameA = `${a.first_name} ${a.last_name}`.toLowerCase();
        const nameB = `${b.first_name} ${b.last_name}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });
    } else if (sortBy === 'role') {
      const roleOrder = { 'owner': 3, 'admin': 2, 'member': 1 };
      filtered.sort((a, b) => roleOrder[b.role] - roleOrder[a.role]);
    } else if (sortBy === 'last_login') {
      filtered.sort((a, b) => {
        const dateA = a.last_login ? new Date(a.last_login) : new Date(0);
        const dateB = b.last_login ? new Date(b.last_login) : new Date(0);
        return dateB - dateA;
      });
    }

    return filtered;
  }
}
```

## 📊 Estatísticas de Usuários

```javascript
// Classe para gerar estatísticas
class UserStats {
  constructor(users) {
    this.users = users;
  }

  // Total de usuários
  getTotalUsers() {
    return this.users.length;
  }

  // Contagem por role
  getRoleCounts() {
    const counts = { owner: 0, admin: 0, member: 0 };
    this.users.forEach(user => {
      counts[user.role] = (counts[user.role] || 0) + 1;
    });
    return counts;
  }

  // Usuários ativos nos últimos 30 dias
  getActiveUsersCount() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    return this.users.filter(user => 
      user.last_login && new Date(user.last_login) >= cutoffDate
    ).length;
  }

  // Taxa de atividade
  getActivityRate() {
    const activeUsers = this.getActiveUsersCount();
    const totalUsers = this.getTotalUsers();
    return totalUsers > 0 ? (activeUsers / totalUsers) * 100 : 0;
  }

  // Usuários criados nos últimos 7 dias
  getRecentUsers() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7);
    
    return this.users.filter(user => 
      user.created_at && new Date(user.created_at) >= cutoffDate
    );
  }

  // Relatório completo
  getReport() {
    return {
      total: this.getTotalUsers(),
      roles: this.getRoleCounts(),
      activeUsers: this.getActiveUsersCount(),
      activityRate: this.getActivityRate(),
      recentUsers: this.getRecentUsers().length
    };
  }
}
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro específicos de usuários
const USER_ERRORS = {
  USER_NOT_FOUND: 'Usuário não encontrado',
  EMAIL_ALREADY_EXISTS: 'Email já está em uso',
  INVALID_ROLE: 'Role inválido',
  INSUFFICIENT_PERMISSIONS: 'Permissões insuficientes',
  CANNOT_REMOVE_LAST_OWNER: 'Não é possível remover o último proprietário'
};

// Função para tratar erros de usuário
function handleUserError(error, response) {
  switch (response?.status) {
    case 400:
      if (error.message.includes('email')) {
        return 'Email inválido ou já está em uso.';
      }
      if (error.message.includes('role')) {
        return 'Role inválido selecionado.';
      }
      return 'Dados inválidos. Verifique os campos obrigatórios.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para esta ação.';
    case 404:
      return 'Usuário não encontrado.';
    case 409:
      return 'Este email já está sendo usado por outro usuário.';
    case 422:
      return 'Não é possível realizar esta ação. Verifique se não é o último proprietário.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return 'Erro desconhecido. Entre em contato com o suporte.';
  }
}
```
