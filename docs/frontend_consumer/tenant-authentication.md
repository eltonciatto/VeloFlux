# Autenticação - Tenant API

Este documento detalha como implementar a autenticação com a API de Tenants do VeloFlux.

## 🔐 Endpoints de Autenticação

### 1. Health Check
Verifica se a API está funcionando.

**Endpoint:** `GET /api/health`  
**Autenticação:** Não requerida

```javascript
// Exemplo de implementação
async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/health`);
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao verificar saúde da API:', error);
    throw error;
  }
}

// Resposta esperada
{
  "status": "ok",
  "version": "1.1.0"
}
```

### 2. Login
Autentica um usuário existente.

**Endpoint:** `POST /auth/login`  
**Autenticação:** Não requerida

```javascript
// Exemplo de implementação
async function login(email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify({
        email,
        password
      })
    });

    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.status}`);
    }

    const data = await response.json();
    
    // Armazenar token no localStorage ou sessionStorage
    localStorage.setItem('veloflux_token', data.token);
    localStorage.setItem('veloflux_user_id', data.user_id);
    localStorage.setItem('veloflux_tenant_id', data.tenant_id);
    
    return data;
  } catch (error) {
    console.error('Erro no login:', error);
    throw error;
  }
}

// Payload de requisição
{
  "email": "user@example.com",
  "password": "senha123"
}

// Resposta esperada
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h0m0s",
  "user_id": "user123",
  "tenant_id": "tenant1"
}
```

### 3. Registro
Registra um novo usuário e tenant.

**Endpoint:** `POST /auth/register`  
**Autenticação:** Não requerida

```javascript
// Exemplo de implementação
async function register(userData) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: DEFAULT_HEADERS,
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erro no registro: ${response.status}`);
    }

    const data = await response.json();
    
    // Armazenar token automaticamente após registro
    localStorage.setItem('veloflux_token', data.token);
    localStorage.setItem('veloflux_user_id', data.user_id);
    localStorage.setItem('veloflux_tenant_id', data.tenant_id);
    
    return data;
  } catch (error) {
    console.error('Erro no registro:', error);
    throw error;
  }
}

// Payload de requisição
{
  "email": "newuser@example.com",
  "password": "senha123",
  "first_name": "João",
  "last_name": "Silva",
  "company": "Minha Empresa Ltda"
}

// Resposta esperada
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h0m0s",
  "user_id": "user-20240623150405",
  "tenant_id": "tenant-20240623150405",
  "tenant": {
    "id": "tenant-20240623150405",
    "name": "Minha Empresa Ltda",
    "active": true,
    "created_at": "2024-06-23T15:04:05Z",
    "plan": "free",
    "contact_email": "newuser@example.com"
  }
}
```

### 4. Refresh Token
Renova um token de autenticação.

**Endpoint:** `POST /auth/refresh`  
**Autenticação:** Token atual requerido

```javascript
// Exemplo de implementação
async function refreshToken() {
  const currentToken = localStorage.getItem('veloflux_token');
  
  if (!currentToken) {
    throw new Error('Token não encontrado');
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        ...DEFAULT_HEADERS,
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!response.ok) {
      // Token inválido, fazer logout
      localStorage.removeItem('veloflux_token');
      localStorage.removeItem('veloflux_user_id');
      localStorage.removeItem('veloflux_tenant_id');
      throw new Error(`Erro ao renovar token: ${response.status}`);
    }

    const data = await response.json();
    
    // Atualizar token
    localStorage.setItem('veloflux_token', data.token);
    
    return data;
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    throw error;
  }
}

// Resposta esperada
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expires_in": "24h0m0s"
}
```

## 🔧 Utilitários de Autenticação

### Classe AuthManager
```javascript
class AuthManager {
  constructor(baseUrl = 'https://api.veloflux.io') {
    this.baseUrl = baseUrl;
    this.tokenKey = 'veloflux_token';
    this.userIdKey = 'veloflux_user_id';
    this.tenantIdKey = 'veloflux_tenant_id';
  }

  // Verificar se usuário está autenticado
  isAuthenticated() {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Obter token atual
  getToken() {
    return localStorage.getItem(this.tokenKey);
  }

  // Obter ID do usuário
  getUserId() {
    return localStorage.getItem(this.userIdKey);
  }

  // Obter ID do tenant
  getTenantId() {
    return localStorage.getItem(this.tenantIdKey);
  }

  // Headers para requisições autenticadas
  getAuthHeaders() {
    const token = this.getToken();
    if (!token) {
      throw new Error('Token não encontrado');
    }
    
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Fazer logout
  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userIdKey);
    localStorage.removeItem(this.tenantIdKey);
  }

  // Login
  async login(email, password) {
    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      throw new Error(`Erro na autenticação: ${response.status}`);
    }

    const data = await response.json();
    
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userIdKey, data.user_id);
    localStorage.setItem(this.tenantIdKey, data.tenant_id);
    
    return data;
  }

  // Registro
  async register(userData) {
    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      throw new Error(`Erro no registro: ${response.status}`);
    }

    const data = await response.json();
    
    localStorage.setItem(this.tokenKey, data.token);
    localStorage.setItem(this.userIdKey, data.user_id);
    localStorage.setItem(this.tenantIdKey, data.tenant_id);
    
    return data;
  }

  // Renovar token
  async refreshToken() {
    const currentToken = this.getToken();
    
    if (!currentToken) {
      throw new Error('Token não encontrado');
    }

    const response = await fetch(`${this.baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${currentToken}`
      }
    });

    if (!response.ok) {
      this.logout();
      throw new Error(`Erro ao renovar token: ${response.status}`);
    }

    const data = await response.json();
    localStorage.setItem(this.tokenKey, data.token);
    
    return data;
  }
}

// Uso da classe
const auth = new AuthManager();
```

## 🔄 Interceptadores de Requisição

### Axios Interceptor
```javascript
import axios from 'axios';

// Configurar interceptador para adicionar token automaticamente
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('veloflux_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptador para renovar token em caso de expiração
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const auth = new AuthManager();
        await auth.refreshToken();
        
        // Reenviar requisição original com novo token
        originalRequest.headers.Authorization = `Bearer ${auth.getToken()}`;
        return axios(originalRequest);
      } catch (refreshError) {
        // Redirect para login
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);
```

## 🔒 Middleware de Autenticação

### Guard para Rotas Protegidas
```javascript
// Guard para verificar autenticação
function requireAuth() {
  const auth = new AuthManager();
  
  if (!auth.isAuthenticated()) {
    // Redirect para login
    window.location.href = '/login';
    return false;
  }
  
  return true;
}

// Guard para verificar role específico
function requireRole(requiredRole) {
  const auth = new AuthManager();
  
  if (!auth.isAuthenticated()) {
    window.location.href = '/login';
    return false;
  }
  
  // Verificar role do usuário (implementar conforme necessário)
  const userRole = getUserRole(); // Implementar esta função
  
  if (userRole !== requiredRole) {
    window.location.href = '/unauthorized';
    return false;
  }
  
  return true;
}
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro comuns
const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'Credenciais inválidas',
  TOKEN_EXPIRED: 'Token expirado',
  TOKEN_INVALID: 'Token inválido',
  UNAUTHORIZED: 'Acesso não autorizado',
  REGISTRATION_FAILED: 'Falha no registro'
};

// Função para tratar erros de autenticação
function handleAuthError(error, response) {
  switch (response?.status) {
    case 401:
      localStorage.removeItem('veloflux_token');
      window.location.href = '/login';
      break;
    case 403:
      window.location.href = '/unauthorized';
      break;
    case 400:
      console.error('Dados inválidos:', error);
      break;
    default:
      console.error('Erro desconhecido:', error);
  }
}
```

## 🎯 Exemplo Completo de Implementação

```javascript
// Exemplo de login completo com tratamento de erros
async function performLogin(email, password) {
  const auth = new AuthManager();
  
  try {
    // Mostrar loading
    showLoading(true);
    
    const result = await auth.login(email, password);
    
    // Login bem-sucedido
    console.log('Login realizado com sucesso:', result);
    
    // Redirect para dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    // Tratar erro
    showError('Erro no login: ' + error.message);
  } finally {
    showLoading(false);
  }
}

// Exemplo de registro completo
async function performRegister(userData) {
  const auth = new AuthManager();
  
  try {
    showLoading(true);
    
    const result = await auth.register(userData);
    
    console.log('Registro realizado com sucesso:', result);
    
    // Redirect para dashboard
    window.location.href = '/dashboard';
    
  } catch (error) {
    showError('Erro no registro: ' + error.message);
  } finally {
    showLoading(false);
  }
}
```

## 📱 Considerações para Mobile/PWA

```javascript
// Verificar se está em ambiente mobile
function isMobile() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

// Armazenamento seguro para mobile
function setSecureToken(token) {
  if (isMobile() && window.cordova) {
    // Usar secure storage em Cordova
    cordova.plugins.SecureStorage.setItem(
      'veloflux_token',
      token,
      () => console.log('Token salvo com segurança'),
      (error) => console.error('Erro ao salvar token:', error)
    );
  } else {
    localStorage.setItem('veloflux_token', token);
  }
}
```
