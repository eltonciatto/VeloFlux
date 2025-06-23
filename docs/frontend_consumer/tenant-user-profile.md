# Perfil do Usuário - Tenant API

Este documento detalha como gerenciar o perfil do usuário autenticado.

## 👤 Endpoints de Perfil

### 1. Obter Perfil do Usuário
Retorna as informações do perfil do usuário autenticado.

**Endpoint:** `GET /api/profile`  
**Autenticação:** Token requerido

```javascript
// Exemplo de implementação
async function getUserProfile() {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter perfil: ${response.status}`);
    }

    const profile = await response.json();
    return profile;
  } catch (error) {
    console.error('Erro ao obter perfil:', error);
    throw error;
  }
}

// Resposta esperada
{
  "user_id": "user123",
  "email": "user@example.com",
  "tenant_id": "tenant1",
  "role": "owner",
  "first_name": "João",
  "last_name": "Silva"
}
```

### 2. Atualizar Perfil do Usuário
Atualiza as informações do perfil do usuário autenticado.

**Endpoint:** `PUT /api/profile`  
**Autenticação:** Token requerido

```javascript
// Exemplo de implementação
async function updateUserProfile(profileData) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/profile`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar perfil: ${response.status}`);
    }

    const updatedProfile = await response.json();
    return updatedProfile;
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    throw error;
  }
}

// Payload de requisição
{
  "first_name": "João Carlos",
  "last_name": "Silva Santos"
}

// Resposta esperada
{
  "user_id": "user123",
  "email": "user@example.com",
  "tenant_id": "tenant1",
  "role": "owner",
  "first_name": "João Carlos",
  "last_name": "Silva Santos"
}
```

## 🔧 Classe UserProfile

```javascript
class UserProfile {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
    this.profile = null;
  }

  // Obter perfil e armazenar em cache
  async getProfile(forceRefresh = false) {
    if (this.profile && !forceRefresh) {
      return this.profile;
    }

    try {
      const response = await fetch(`${this.baseUrl}/api/profile`, {
        method: 'GET',
        headers: this.auth.getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`Erro ao obter perfil: ${response.status}`);
      }

      this.profile = await response.json();
      return this.profile;
    } catch (error) {
      console.error('Erro ao obter perfil:', error);
      throw error;
    }
  }

  // Atualizar perfil
  async updateProfile(profileData) {
    try {
      const response = await fetch(`${this.baseUrl}/api/profile`, {
        method: 'PUT',
        headers: this.auth.getAuthHeaders(),
        body: JSON.stringify(profileData)
      });

      if (!response.ok) {
        throw new Error(`Erro ao atualizar perfil: ${response.status}`);
      }

      this.profile = await response.json();
      return this.profile;
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      throw error;
    }
  }

  // Obter nome completo
  getFullName() {
    if (!this.profile) {
      return 'Usuário';
    }
    return `${this.profile.first_name} ${this.profile.last_name}`.trim();
  }

  // Obter iniciais do nome
  getInitials() {
    if (!this.profile) {
      return 'U';
    }
    const firstInitial = this.profile.first_name?.charAt(0)?.toUpperCase() || '';
    const lastInitial = this.profile.last_name?.charAt(0)?.toUpperCase() || '';
    return firstInitial + lastInitial || 'U';
  }

  // Verificar role do usuário
  hasRole(role) {
    return this.profile?.role === role;
  }

  // Verificar se é owner
  isOwner() {
    return this.hasRole('owner');
  }

  // Verificar se é admin
  isAdmin() {
    return this.hasRole('admin');
  }

  // Verificar se é member
  isMember() {
    return this.hasRole('member');
  }

  // Obter tenant ID
  getTenantId() {
    return this.profile?.tenant_id;
  }

  // Obter user ID
  getUserId() {
    return this.profile?.user_id;
  }

  // Obter email
  getEmail() {
    return this.profile?.email;
  }

  // Limpar cache do perfil
  clearCache() {
    this.profile = null;
  }
}

// Uso da classe
const auth = new AuthManager();
const userProfile = new UserProfile(auth);
```

## 🎨 Componentes de Interface

### Componente de Exibição de Perfil (React)
```jsx
import React, { useState, useEffect } from 'react';

const ProfileDisplay = ({ userProfile }) => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await userProfile.getProfile();
      setProfile(profileData);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="profile-loading">Carregando perfil...</div>;
  }

  if (!profile) {
    return <div className="profile-error">Erro ao carregar perfil</div>;
  }

  return (
    <div className="profile-display">
      <div className="profile-avatar">
        {userProfile.getInitials()}
      </div>
      <div className="profile-info">
        <h3>{userProfile.getFullName()}</h3>
        <p>{profile.email}</p>
        <span className="profile-role">{profile.role}</span>
      </div>
    </div>
  );
};

export default ProfileDisplay;
```

### Componente de Edição de Perfil (React)
```jsx
import React, { useState, useEffect } from 'react';

const ProfileEditor = ({ userProfile, onSave }) => {
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profile = await userProfile.getProfile();
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || ''
      });
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      const updatedProfile = await userProfile.updateProfile(formData);
      onSave?.(updatedProfile);
      alert('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar perfil:', error);
      alert('Erro ao atualizar perfil');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="profile-editor">
      <div className="form-group">
        <label htmlFor="first_name">Primeiro Nome</label>
        <input
          type="text"
          id="first_name"
          name="first_name"
          value={formData.first_name}
          onChange={handleChange}
          required
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
          required
        />
      </div>

      <button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Perfil'}
      </button>
    </form>
  );
};

export default ProfileEditor;
```

### Componente de Avatar
```jsx
import React from 'react';

const Avatar = ({ userProfile, size = 'medium' }) => {
  const sizeClasses = {
    small: 'avatar-small',
    medium: 'avatar-medium',
    large: 'avatar-large'
  };

  return (
    <div className={`avatar ${sizeClasses[size]}`}>
      <span className="avatar-initials">
        {userProfile.getInitials()}
      </span>
    </div>
  );
};

export default Avatar;
```

## 🎯 Implementação Vanilla JavaScript

### Formulário de Edição de Perfil
```html
<!-- HTML -->
<form id="profile-form">
  <div class="form-group">
    <label for="first-name">Primeiro Nome</label>
    <input type="text" id="first-name" name="first_name" required>
  </div>
  
  <div class="form-group">
    <label for="last-name">Sobrenome</label>
    <input type="text" id="last-name" name="last_name" required>
  </div>
  
  <button type="submit">Salvar Perfil</button>
</form>

<div id="profile-display">
  <div class="avatar" id="user-avatar"></div>
  <div class="profile-info">
    <h3 id="user-name"></h3>
    <p id="user-email"></p>
    <span id="user-role"></span>
  </div>
</div>
```

```javascript
// JavaScript
class ProfileManager {
  constructor() {
    this.auth = new AuthManager();
    this.userProfile = new UserProfile(this.auth);
    this.initializeEventListeners();
  }

  initializeEventListeners() {
    const form = document.getElementById('profile-form');
    if (form) {
      form.addEventListener('submit', this.handleFormSubmit.bind(this));
    }
  }

  async loadProfileData() {
    try {
      const profile = await this.userProfile.getProfile();
      this.populateForm(profile);
      this.updateProfileDisplay(profile);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      this.showError('Erro ao carregar perfil');
    }
  }

  populateForm(profile) {
    const firstNameInput = document.getElementById('first-name');
    const lastNameInput = document.getElementById('last-name');
    
    if (firstNameInput) firstNameInput.value = profile.first_name || '';
    if (lastNameInput) lastNameInput.value = profile.last_name || '';
  }

  updateProfileDisplay(profile) {
    const nameElement = document.getElementById('user-name');
    const emailElement = document.getElementById('user-email');
    const roleElement = document.getElementById('user-role');
    const avatarElement = document.getElementById('user-avatar');

    if (nameElement) nameElement.textContent = this.userProfile.getFullName();
    if (emailElement) emailElement.textContent = profile.email;
    if (roleElement) roleElement.textContent = profile.role;
    if (avatarElement) avatarElement.textContent = this.userProfile.getInitials();
  }

  async handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const profileData = {
      first_name: formData.get('first_name'),
      last_name: formData.get('last_name')
    };

    try {
      this.showLoading(true);
      const updatedProfile = await this.userProfile.updateProfile(profileData);
      this.updateProfileDisplay(updatedProfile);
      this.showSuccess('Perfil atualizado com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      this.showError('Erro ao atualizar perfil');
    } finally {
      this.showLoading(false);
    }
  }

  showLoading(show) {
    const button = document.querySelector('#profile-form button[type="submit"]');
    if (button) {
      button.disabled = show;
      button.textContent = show ? 'Salvando...' : 'Salvar Perfil';
    }
  }

  showSuccess(message) {
    // Implementar notificação de sucesso
    alert(message);
  }

  showError(message) {
    // Implementar notificação de erro
    alert(message);
  }
}

// Inicializar quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
  const profileManager = new ProfileManager();
  profileManager.loadProfileData();
});
```

## 📱 Validações e Formatações

```javascript
// Validações de perfil
class ProfileValidator {
  static validateFirstName(firstName) {
    if (!firstName || firstName.trim().length < 2) {
      throw new Error('Primeiro nome deve ter pelo menos 2 caracteres');
    }
    if (firstName.length > 50) {
      throw new Error('Primeiro nome deve ter no máximo 50 caracteres');
    }
    return firstName.trim();
  }

  static validateLastName(lastName) {
    if (!lastName || lastName.trim().length < 2) {
      throw new Error('Sobrenome deve ter pelo menos 2 caracteres');
    }
    if (lastName.length > 50) {
      throw new Error('Sobrenome deve ter no máximo 50 caracteres');
    }
    return lastName.trim();
  }

  static validateProfileData(data) {
    const validated = {};
    
    if (data.first_name !== undefined) {
      validated.first_name = this.validateFirstName(data.first_name);
    }
    
    if (data.last_name !== undefined) {
      validated.last_name = this.validateLastName(data.last_name);
    }
    
    return validated;
  }
}

// Formatadores
class ProfileFormatter {
  static formatName(name) {
    if (!name) return '';
    return name.split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  static formatRole(role) {
    const roleMap = {
      'owner': 'Proprietário',
      'admin': 'Administrador',
      'member': 'Membro'
    };
    return roleMap[role] || role;
  }
}
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro específicos do perfil
const PROFILE_ERRORS = {
  PROFILE_NOT_FOUND: 'Perfil não encontrado',
  INVALID_DATA: 'Dados do perfil inválidos',
  UPDATE_FAILED: 'Falha ao atualizar perfil',
  PERMISSION_DENIED: 'Permissão negada para atualizar perfil'
};

// Função para tratar erros de perfil
function handleProfileError(error, response) {
  switch (response?.status) {
    case 400:
      console.error('Dados inválidos:', error);
      return 'Por favor, verifique os dados inseridos';
    case 401:
      console.error('Não autorizado:', error);
      return 'Sessão expirada. Faça login novamente';
    case 403:
      console.error('Proibido:', error);
      return 'Você não tem permissão para esta ação';
    case 404:
      console.error('Perfil não encontrado:', error);
      return 'Perfil não encontrado';
    case 500:
      console.error('Erro do servidor:', error);
      return 'Erro interno do servidor. Tente novamente';
    default:
      console.error('Erro desconhecido:', error);
      return 'Erro desconhecido. Tente novamente';
  }
}
```

## 🔄 Cache e Sincronização

```javascript
// Sistema de cache para perfil
class ProfileCache {
  constructor(ttl = 300000) { // 5 minutos
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  get(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > this.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  clear() {
    this.cache.clear();
  }
}

// Implementação com cache
class CachedUserProfile extends UserProfile {
  constructor(authManager) {
    super(authManager);
    this.cache = new ProfileCache();
  }

  async getProfile(forceRefresh = false) {
    const cacheKey = 'user_profile';
    
    if (!forceRefresh) {
      const cached = this.cache.get(cacheKey);
      if (cached) {
        this.profile = cached;
        return cached;
      }
    }

    const profile = await super.getProfile(forceRefresh);
    this.cache.set(cacheKey, profile);
    return profile;
  }

  async updateProfile(profileData) {
    const updated = await super.updateProfile(profileData);
    this.cache.set('user_profile', updated);
    return updated;
  }
}
```
