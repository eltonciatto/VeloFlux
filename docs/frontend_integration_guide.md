# Frontend Integration Guide - VeloFlux

## Visão Geral

Este guia explica como integrar o frontend React/TypeScript com as APIs do backend VeloFlux, incluindo hooks customizados, componentes, autenticação e exemplos práticos.

## Estrutura Frontend

```
frontend/src/
├── components/
│   └── dashboard/
│       ├── UserManagement.tsx      # Gerenciamento de usuários
│       ├── OIDCSettings.tsx        # Configuração OIDC
│       └── TenantMonitoring.tsx    # Monitoramento
├── hooks/
│   ├── useAuth.ts                  # Autenticação
│   ├── useUserManagement.ts        # Usuários
│   ├── useOIDCConfig.ts           # OIDC
│   └── useTenantMetrics.ts        # Métricas
├── services/
│   └── api.ts                     # Cliente HTTP
└── types/
    └── api.ts                     # Tipos TypeScript
```

## Configuração Base

### 1. Cliente HTTP (services/api.ts)

```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;
  private tenantId: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
      timeout: 10000,
    });

    // Interceptor para adicionar headers
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      if (this.tenantId) {
        config.headers['X-Tenant-ID'] = this.tenantId;
      }
      return config;
    });

    // Interceptor para tratar erros
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          this.clearAuth();
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  setAuth(token: string, tenantId: string) {
    this.token = token;
    this.tenantId = tenantId;
    localStorage.setItem('auth_token', token);
    localStorage.setItem('tenant_id', tenantId);
  }

  clearAuth() {
    this.token = null;
    this.tenantId = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('tenant_id');
  }

  // Métodos HTTP
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

export const apiClient = new ApiClient();
```

### 2. Tipos TypeScript (types/api.ts)

```typescript
// Autenticação
export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
}

// Usuário
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  created_at: string;
  last_login?: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
}

export interface UpdateUserRequest {
  email?: string;
  role?: 'admin' | 'user';
}

export interface UsersResponse {
  users: User[];
  total: number;
}

// OIDC
export interface OIDCConfig {
  enabled: boolean;
  provider_url: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string[];
  auto_create_users: boolean;
}

export interface OIDCTestResponse {
  success: boolean;
  message: string;
  provider_info?: {
    issuer: string;
    authorization_endpoint: string;
    token_endpoint: string;
  };
}

// Monitoramento
export interface TenantMetrics {
  cpu_usage: number;
  memory_usage: number;
  disk_usage: number;
  network_in: number;
  network_out: number;
  active_connections: number;
  requests_per_minute: number;
  error_rate: number;
  uptime: number;
  timestamp: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  message: string;
  service: string;
  details?: any;
}

export interface LogsResponse {
  logs: LogEntry[];
  total: number;
  pagination: {
    page: number;
    limit: number;
    total_pages: number;
  };
}

export interface Alert {
  id: string;
  type: string;
  severity: 'critical' | 'warning' | 'info';
  message: string;
  timestamp: string;
  resolved: boolean;
}

export interface AlertsResponse {
  alerts: Alert[];
}

// Billing
export interface BillingUsage {
  current_period: {
    start: string;
    end: string;
    requests: number;
    storage_gb: number;
    bandwidth_gb: number;
  };
  limits: {
    requests: number;
    storage_gb: number;
    bandwidth_gb: number;
  };
  plan: string;
}
```

## Hooks Customizados

### 1. Hook de Autenticação (hooks/useAuth.ts)

```typescript
import { useState, useCallback } from 'react';
import { apiClient } from '../services/api';
import { LoginRequest, LoginResponse, RegisterRequest, User } from '../types/api';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (credentials: LoginRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post<LoginResponse>('/api/auth/login', credentials);
      
      setUser(response.user);
      apiClient.setAuth(response.token, 'tenant1'); // ou extrair do contexto
      
      return response;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao fazer login';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (userData: RegisterRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.post('/api/auth/register', userData);
      
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Erro ao registrar';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    apiClient.clearAuth();
  }, []);

  return {
    user,
    loading,
    error,
    login,
    register,
    logout,
  };
}
```

### 2. Hook de Gerenciamento de Usuários (hooks/useUserManagement.ts)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { User, UsersResponse, CreateUserRequest, UpdateUserRequest } from '../types/api';

export function useUserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<UsersResponse>('/api/tenant/users');
      
      setUsers(response.users);
      setTotal(response.total);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, []);

  const createUser = useCallback(async (userData: CreateUserRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.post('/api/tenant/users', userData);
      await fetchUsers(); // Recarrega a lista
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar usuário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const updateUser = useCallback(async (userId: string, updates: UpdateUserRequest) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.put(`/api/tenant/users/${userId}`, updates);
      await fetchUsers(); // Recarrega a lista
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar usuário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.delete(`/api/tenant/users/${userId}`);
      await fetchUsers(); // Recarrega a lista
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao deletar usuário');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    total,
    loading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
}
```

### 3. Hook de Configuração OIDC (hooks/useOIDCConfig.ts)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { OIDCConfig, OIDCTestResponse } from '../types/api';

export function useOIDCConfig() {
  const [config, setConfig] = useState<OIDCConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<OIDCTestResponse | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<OIDCConfig>('/api/tenant/oidc/config');
      setConfig(response);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar configuração OIDC');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateConfig = useCallback(async (newConfig: OIDCConfig) => {
    try {
      setLoading(true);
      setError(null);
      
      await apiClient.put('/api/tenant/oidc/config', newConfig);
      setConfig(newConfig);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao atualizar configuração OIDC');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const testConfig = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.post<OIDCTestResponse>('/api/tenant/oidc/test');
      setTestResult(response);
      
      return response;
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Erro ao testar configuração OIDC';
      setError(errorMsg);
      setTestResult({ success: false, message: errorMsg });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  return {
    config,
    loading,
    error,
    testResult,
    fetchConfig,
    updateConfig,
    testConfig,
  };
}
```

### 4. Hook de Métricas (hooks/useTenantMetrics.ts)

```typescript
import { useState, useCallback, useEffect } from 'react';
import { apiClient } from '../services/api';
import { TenantMetrics, LogsResponse, AlertsResponse } from '../types/api';

export function useTenantMetrics() {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [alerts, setAlerts] = useState<AlertsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<TenantMetrics>('/api/tenant/monitoring/metrics');
      setMetrics(response);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchLogs = useCallback(async (level?: string, limit: number = 100) => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      params.append('limit', limit.toString());
      
      const response = await apiClient.get<LogsResponse>(
        `/api/tenant/monitoring/logs?${params.toString()}`
      );
      setLogs(response);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar logs');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAlerts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiClient.get<AlertsResponse>('/api/tenant/monitoring/alerts');
      setAlerts(response);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar alertas');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-refresh das métricas
  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // 30 segundos
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  return {
    metrics,
    logs,
    alerts,
    loading,
    error,
    fetchMetrics,
    fetchLogs,
    fetchAlerts,
  };
}
```

## Componentes Implementados

### 1. UserManagement.tsx

Componente completo para gerenciamento de usuários com:
- Lista de usuários
- Criação de novos usuários
- Edição de usuários existentes
- Exclusão de usuários
- Validação de formulários

### 2. OIDCSettings.tsx

Componente para configuração OIDC com:
- Formulário de configuração
- Teste de conectividade
- Validação de campos
- Feedback visual

### 3. TenantMonitoring.tsx

Dashboard de monitoramento com:
- Métricas em tempo real
- Gráficos de performance
- Lista de alertas
- Logs filtráveis

## Exemplos de Uso

### Login Component

```typescript
import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

export function LoginForm() {
  const { login, loading, error } = useAuth();
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await login(credentials);
      // Redirecionar para dashboard
    } catch (err) {
      // Erro já está no state
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={credentials.username}
        onChange={(e) => setCredentials({
          ...credentials,
          username: e.target.value
        })}
      />
      <input
        type="password"
        placeholder="Password"
        value={credentials.password}
        onChange={(e) => setCredentials({
          ...credentials,
          password: e.target.value
        })}
      />
      <button type="submit" disabled={loading}>
        {loading ? 'Fazendo login...' : 'Login'}
      </button>
      {error && <div className="error">{error}</div>}
    </form>
  );
}
```

### Dashboard Integration

```typescript
import React from 'react';
import { UserManagement } from './dashboard/UserManagement';
import { OIDCSettings } from './dashboard/OIDCSettings';
import { TenantMonitoring } from './dashboard/TenantMonitoring';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState('monitoring');

  return (
    <div className="dashboard">
      <nav>
        <button onClick={() => setActiveTab('monitoring')}>
          Monitoramento
        </button>
        <button onClick={() => setActiveTab('users')}>
          Usuários
        </button>
        <button onClick={() => setActiveTab('oidc')}>
          OIDC
        </button>
      </nav>

      <div className="content">
        {activeTab === 'monitoring' && <TenantMonitoring />}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'oidc' && <OIDCSettings />}
      </div>
    </div>
  );
}
```

## Configuração de Ambiente

### Variáveis de Ambiente (.env)

```bash
REACT_APP_API_URL=http://localhost:8080
REACT_APP_TENANT_ID=tenant1
REACT_APP_ENVIRONMENT=development
```

### package.json Dependencies

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "typescript": "^4.9.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0"
  }
}
```

## Boas Práticas

### 1. Tratamento de Erros

```typescript
// Sempre trate erros de forma consistente
try {
  await apiCall();
} catch (error) {
  if (error.response?.status === 401) {
    // Redirecionar para login
  } else if (error.response?.status === 403) {
    // Mostrar mensagem de acesso negado
  } else {
    // Erro genérico
  }
}
```

### 2. Loading States

```typescript
// Sempre mostre loading states
function Component() {
  const { data, loading, error } = useCustomHook();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!data) return <div>Sem dados</div>;

  return <div>{/* Renderizar data */}</div>;
}
```

### 3. Validação de Formulários

```typescript
// Valide dados antes de enviar
const validateUser = (user: CreateUserRequest) => {
  const errors: string[] = [];
  
  if (!user.username.trim()) errors.push('Username é obrigatório');
  if (!user.email.includes('@')) errors.push('Email inválido');
  if (user.password.length < 6) errors.push('Senha deve ter pelo menos 6 caracteres');
  
  return errors;
};
```

### 4. TypeScript

```typescript
// Use tipos específicos em vez de any
interface ApiResponse<T> {
  data: T;
  message: string;
  success: boolean;
}

// Use tipos genéricos para reutilização
function useApiCall<T>(url: string) {
  // implementação
}
```

## Testes

### Unit Tests

```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import { useUserManagement } from '../hooks/useUserManagement';

test('should fetch users on mount', async () => {
  const { result, waitForNextUpdate } = renderHook(() => useUserManagement());
  
  await waitForNextUpdate();
  
  expect(result.current.users).toHaveLength(1);
  expect(result.current.loading).toBe(false);
});
```

### Integration Tests

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UserManagement } from '../components/UserManagement';

test('should create user successfully', async () => {
  render(<UserManagement />);
  
  fireEvent.click(screen.getByText('Criar Usuário'));
  fireEvent.change(screen.getByLabelText('Username'), {
    target: { value: 'novousuario' }
  });
  
  fireEvent.click(screen.getByText('Salvar'));
  
  await waitFor(() => {
    expect(screen.getByText('Usuário criado com sucesso')).toBeInTheDocument();
  });
});
```

## Troubleshooting

### Problemas Comuns

1. **CORS Error**: Verificar `CORS_ORIGINS` no backend
2. **401 Unauthorized**: Token expirado ou inválido
3. **Network Error**: Backend não está rodando
4. **Loading Infinito**: Verificar dependency array em useEffect

### Debug Tools

```typescript
// Adicionar logs para debug
console.log('API Request:', { url, method, data });
console.log('API Response:', response);

// Usar React DevTools
// Usar Redux DevTools (se usando Redux)
```

## Performance

### Otimizações

1. **React.memo**: Para componentes que não mudam frequentemente
2. **useMemo**: Para cálculos pesados
3. **useCallback**: Para funções passadas como props
4. **Code Splitting**: Para reduzir bundle size
5. **Debounce**: Para inputs de busca

```typescript
// Exemplo de debounce
import { useMemo } from 'react';
import { debounce } from 'lodash';

function SearchComponent() {
  const debouncedSearch = useMemo(
    () => debounce((query: string) => {
      // fazer busca
    }, 300),
    []
  );

  return (
    <input onChange={(e) => debouncedSearch(e.target.value)} />
  );
}
```

Este guia fornece uma base sólida para integração frontend com as APIs do VeloFlux. Para dúvidas específicas, consulte a documentação da API ou os exemplos de código nos componentes implementados.
