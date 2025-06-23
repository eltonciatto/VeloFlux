# Implementação Prática - Tenant API Frontend

## Visão Geral

Este guia demonstra como implementar um cliente frontend completo para a Tenant API, integrando todas as funcionalidades documentadas nos guias específicos.

## Estrutura de Implementação

### 1. Configuração Base

#### Configuração da API Client

```typescript
// src/api/config.ts
export interface ApiConfig {
  baseUrl: string;
  timeout: number;
  retries: number;
}

export const apiConfig: ApiConfig = {
  baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:8080/api',
  timeout: 30000,
  retries: 3
};

// src/api/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiConfig } from './config';

class ApiClient {
  private client: AxiosInstance;
  private authToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: apiConfig.baseUrl,
      timeout: apiConfig.timeout,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor para adicionar token
    this.client.interceptors.request.use(
      (config) => {
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor para tratamento de erros
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expirado, tentar refresh
          await this.handleTokenRefresh();
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  private async handleTokenRefresh() {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const response = await this.client.post('/auth/refresh', {
          refresh_token: refreshToken
        });
        
        const { access_token, refresh_token } = response.data;
        this.setAuthToken(access_token);
        localStorage.setItem('accessToken', access_token);
        localStorage.setItem('refreshToken', refresh_token);
      } catch (error) {
        // Redirect para login
        this.clearAuthToken();
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  }
}

export const apiClient = new ApiClient();
```

#### Context Provider para Autenticação

```typescript
// src/context/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { apiClient } from '../api/client';

interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  tenant_id?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
}

interface RegisterData {
  username: string;
  email: string;
  password: string;
  full_name?: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      apiClient.setAuthToken(token);
      try {
        const userData = await apiClient.get<User>('/auth/profile');
        setUser(userData);
      } catch (error) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      }
    }
    setLoading(false);
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post<{
        access_token: string;
        refresh_token: string;
        user: User;
      }>('/auth/login', { username, password });

      const { access_token, refresh_token, user: userData } = response;
      
      localStorage.setItem('accessToken', access_token);
      localStorage.setItem('refreshToken', refresh_token);
      apiClient.setAuthToken(access_token);
      setUser(userData);
    } catch (error) {
      throw new Error('Falha na autenticação');
    }
  };

  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    apiClient.clearAuthToken();
    setUser(null);
  };

  const register = async (userData: RegisterData) => {
    try {
      await apiClient.post('/auth/register', userData);
    } catch (error) {
      throw new Error('Falha no registro');
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    register
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 2. Services Específicos

#### Tenant Service

```typescript
// src/services/tenantService.ts
import { apiClient } from '../api/client';

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended';
  settings: {
    max_routes: number;
    max_pools: number;
    max_backends_per_pool: number;
    features: string[];
  };
  created_at: string;
  updated_at: string;
}

export interface CreateTenantData {
  name: string;
  domain: string;
  settings?: Partial<Tenant['settings']>;
}

export interface UpdateTenantData {
  name?: string;
  domain?: string;
  status?: Tenant['status'];
  settings?: Partial<Tenant['settings']>;
}

class TenantService {
  async listTenants(): Promise<Tenant[]> {
    return apiClient.get<Tenant[]>('/tenants');
  }

  async getTenant(id: string): Promise<Tenant> {
    return apiClient.get<Tenant>(`/tenants/${id}`);
  }

  async createTenant(data: CreateTenantData): Promise<Tenant> {
    return apiClient.post<Tenant>('/tenants', data);
  }

  async updateTenant(id: string, data: UpdateTenantData): Promise<Tenant> {
    return apiClient.put<Tenant>(`/tenants/${id}`, data);
  }

  async deleteTenant(id: string): Promise<void> {
    return apiClient.delete(`/tenants/${id}`);
  }

  // Usuários do tenant
  async listTenantUsers(tenantId: string) {
    return apiClient.get(`/tenants/${tenantId}/users`);
  }

  async addTenantUser(tenantId: string, userData: any) {
    return apiClient.post(`/tenants/${tenantId}/users`, userData);
  }

  async updateTenantUser(tenantId: string, userId: string, userData: any) {
    return apiClient.put(`/tenants/${tenantId}/users/${userId}`, userData);
  }

  async removeTenantUser(tenantId: string, userId: string) {
    return apiClient.delete(`/tenants/${tenantId}/users/${userId}`);
  }

  // Rotas do tenant
  async listTenantRoutes(tenantId: string) {
    return apiClient.get(`/tenants/${tenantId}/routes`);
  }

  async createTenantRoute(tenantId: string, routeData: any) {
    return apiClient.post(`/tenants/${tenantId}/routes`, routeData);
  }

  async updateTenantRoute(tenantId: string, routeId: string, routeData: any) {
    return apiClient.put(`/tenants/${tenantId}/routes/${routeId}`, routeData);
  }

  async deleteTenantRoute(tenantId: string, routeId: string) {
    return apiClient.delete(`/tenants/${tenantId}/routes/${routeId}`);
  }

  // Pools e backends
  async listTenantPools(tenantId: string) {
    return apiClient.get(`/tenants/${tenantId}/pools`);
  }

  async createTenantPool(tenantId: string, poolData: any) {
    return apiClient.post(`/tenants/${tenantId}/pools`, poolData);
  }

  async getTenantPool(tenantId: string, poolId: string) {
    return apiClient.get(`/tenants/${tenantId}/pools/${poolId}`);
  }

  async updateTenantPool(tenantId: string, poolId: string, poolData: any) {
    return apiClient.put(`/tenants/${tenantId}/pools/${poolId}`, poolData);
  }

  async deleteTenantPool(tenantId: string, poolId: string) {
    return apiClient.delete(`/tenants/${tenantId}/pools/${poolId}`);
  }

  async addTenantBackend(tenantId: string, poolId: string, backendData: any) {
    return apiClient.post(`/tenants/${tenantId}/pools/${poolId}/backends`, backendData);
  }

  async removeTenantBackend(tenantId: string, poolId: string, backendId: string) {
    return apiClient.delete(`/tenants/${tenantId}/pools/${poolId}/backends/${backendId}`);
  }

  // WAF e Rate Limiting
  async getTenantWAFConfig(tenantId: string) {
    return apiClient.get(`/tenants/${tenantId}/waf`);
  }

  async updateTenantWAFConfig(tenantId: string, wafConfig: any) {
    return apiClient.put(`/tenants/${tenantId}/waf`, wafConfig);
  }

  async getTenantRateLimit(tenantId: string) {
    return apiClient.get(`/tenants/${tenantId}/rate-limit`);
  }

  async updateTenantRateLimit(tenantId: string, rateLimitConfig: any) {
    return apiClient.put(`/tenants/${tenantId}/rate-limit`, rateLimitConfig);
  }

  // Monitoramento
  async getTenantMetrics(tenantId: string, options: any = {}) {
    const params = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key]) params.append(key, options[key]);
    });
    
    const queryString = params.toString();
    return apiClient.get(`/tenants/${tenantId}/metrics${queryString ? '?' + queryString : ''}`);
  }

  async getTenantUsage(tenantId: string, options: any = {}) {
    const params = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key]) params.append(key, options[key]);
    });
    
    const queryString = params.toString();
    return apiClient.get(`/tenants/${tenantId}/usage${queryString ? '?' + queryString : ''}`);
  }

  async getTenantLogs(tenantId: string, options: any = {}) {
    const params = new URLSearchParams();
    Object.keys(options).forEach(key => {
      if (options[key]) params.append(key, options[key].toString());
    });
    
    const queryString = params.toString();
    return apiClient.get(`/tenants/${tenantId}/logs${queryString ? '?' + queryString : ''}`);
  }
}

export const tenantService = new TenantService();
```

### 3. Hooks Customizados

#### useTenant Hook

```typescript
// src/hooks/useTenant.ts
import { useState, useEffect, useCallback } from 'react';
import { tenantService, Tenant, CreateTenantData, UpdateTenantData } from '../services/tenantService';

export const useTenant = (tenantId?: string) => {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenant = useCallback(async (id: string) => {
    if (!id) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const data = await tenantService.getTenant(id);
      setTenant(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateTenant = useCallback(async (id: string, data: UpdateTenantData) => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedTenant = await tenantService.updateTenant(id, data);
      setTenant(updatedTenant);
      return updatedTenant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tenantId) {
      fetchTenant(tenantId);
    }
  }, [tenantId, fetchTenant]);

  return {
    tenant,
    loading,
    error,
    fetchTenant,
    updateTenant,
    refetch: () => tenantId && fetchTenant(tenantId)
  };
};

export const useTenantList = () => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTenants = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await tenantService.listTenants();
      setTenants(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  }, []);

  const createTenant = useCallback(async (data: CreateTenantData) => {
    setLoading(true);
    setError(null);
    
    try {
      const newTenant = await tenantService.createTenant(data);
      setTenants(prev => [...prev, newTenant]);
      return newTenant;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteTenant = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);
    
    try {
      await tenantService.deleteTenant(id);
      setTenants(prev => prev.filter(tenant => tenant.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao deletar tenant');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  return {
    tenants,
    loading,
    error,
    fetchTenants,
    createTenant,
    deleteTenant,
    refetch: fetchTenants
  };
};
```

### 4. Componente Principal de Gerenciamento

```tsx
// src/components/TenantManagement.tsx
import React, { useState } from 'react';
import { useTenantList } from '../hooks/useTenant';
import { useAuth } from '../context/AuthContext';
import TenantList from './TenantList';
import TenantForm from './TenantForm';
import TenantDetails from './TenantDetails';
import { CreateTenantData } from '../services/tenantService';

const TenantManagement: React.FC = () => {
  const { user } = useAuth();
  const { tenants, loading, error, createTenant, deleteTenant } = useTenantList();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateTenant = async (data: CreateTenantData) => {
    try {
      await createTenant(data);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
    }
  };

  const handleSelectTenant = (tenantId: string) => {
    setSelectedTenantId(tenantId);
  };

  const handleDeleteTenant = async (tenantId: string) => {
    if (window.confirm('Tem certeza que deseja deletar este tenant?')) {
      try {
        await deleteTenant(tenantId);
        if (selectedTenantId === tenantId) {
          setSelectedTenantId(null);
        }
      } catch (error) {
        console.error('Erro ao deletar tenant:', error);
      }
    }
  };

  if (loading) {
    return <div className="loading">Carregando tenants...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  return (
    <div className="tenant-management">
      <div className="management-header">
        <h2>Gerenciamento de Tenants</h2>
        <button 
          className="btn btn-primary" 
          onClick={() => setShowCreateForm(true)}
        >
          Novo Tenant
        </button>
      </div>

      <div className="management-content">
        <div className="tenants-sidebar">
          <TenantList
            tenants={tenants}
            selectedTenantId={selectedTenantId}
            onSelectTenant={handleSelectTenant}
            onDeleteTenant={handleDeleteTenant}
          />
        </div>

        <div className="tenant-main">
          {showCreateForm && (
            <TenantForm
              onSubmit={handleCreateTenant}
              onCancel={() => setShowCreateForm(false)}
            />
          )}

          {selectedTenantId && !showCreateForm && (
            <TenantDetails tenantId={selectedTenantId} />
          )}

          {!selectedTenantId && !showCreateForm && (
            <div className="no-selection">
              Selecione um tenant para ver os detalhes
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantManagement;
```

### 5. Tratamento de Erros Global

```typescript
// src/utils/errorHandler.ts
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: any;
}

export class ErrorHandler {
  static handle(error: any): ApiError {
    if (error.response) {
      // Erro de resposta da API
      return {
        message: error.response.data?.message || 'Erro do servidor',
        code: error.response.data?.code,
        status: error.response.status,
        details: error.response.data
      };
    } else if (error.request) {
      // Erro de rede
      return {
        message: 'Erro de conexão com o servidor',
        code: 'NETWORK_ERROR'
      };
    } else {
      // Outro tipo de erro
      return {
        message: error.message || 'Erro desconhecido',
        code: 'UNKNOWN_ERROR'
      };
    }
  }

  static getErrorMessage(error: any): string {
    const apiError = this.handle(error);
    return apiError.message;
  }

  static isNetworkError(error: any): boolean {
    const apiError = this.handle(error);
    return apiError.code === 'NETWORK_ERROR';
  }

  static isAuthError(error: any): boolean {
    const apiError = this.handle(error);
    return apiError.status === 401 || apiError.status === 403;
  }
}
```

### 6. Integração com Router

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import TenantManagement from './components/TenantManagement';
import TenantDetails from './components/TenantDetails';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/tenants" element={
              <ProtectedRoute>
                <TenantManagement />
              </ProtectedRoute>
            } />
            <Route path="/tenants/:id" element={
              <ProtectedRoute>
                <TenantDetails />
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
};

export default App;
```

## Próximos Passos

1. **Testes**: Implementar testes unitários e de integração
2. **Otimização**: Adicionar cache e otimizações de performance
3. **WebSockets**: Integrar atualizações em tempo real
4. **PWA**: Configurar como Progressive Web App
5. **Monitoramento**: Adicionar logging e analytics

Este guia fornece uma base sólida para implementar um cliente frontend completo que consome toda a funcionalidade da Tenant API.
