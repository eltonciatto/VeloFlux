# Guia de Integração da API OIDC - Frontend

Este documento fornece um guia completo para integrar todas as funcionalidades da API OIDC no frontend do VeloFlux.

## Índice

1. [Visão Geral](#visão-geral)
2. [Endpoints Disponíveis](#endpoints-disponíveis)
3. [Configuração do Cliente HTTP](#configuração-do-cliente-http)
4. [Implementação dos Métodos](#implementação-dos-métodos)
5. [Gerenciamento de Estado](#gerenciamento-de-estado)
6. [Componentes React](#componentes-react)
7. [Tratamento de Erros](#tratamento-de-erros)
8. [Exemplos Práticos](#exemplos-práticos)
9. [Testes](#testes)

## Visão Geral

A API OIDC do VeloFlux oferece autenticação OpenID Connect multi-tenant com as seguintes funcionalidades:

- **Login OIDC**: Inicia o fluxo de autenticação OIDC
- **Callback**: Processa o retorno da autenticação
- **Configuração OIDC**: Gerencia configurações por tenant
- **Autenticação por Cookie**: Gerenciamento automático de tokens

## Endpoints Disponíveis

### 1. Login OIDC
- **URL**: `GET /auth/oidc/login/{tenant_id}`
- **Descrição**: Inicia o fluxo de autenticação OIDC
- **Parâmetros**: 
  - `tenant_id` (path): ID do tenant
  - `return_url` (query, opcional): URL de retorno após login

### 2. Callback OIDC
- **URL**: `GET /auth/oidc/callback`
- **Descrição**: Processa callback de autenticação (redirecionamento automático)
- **Parâmetros**:
  - `state` (query): Estado da sessão
  - `code` (query): Código de autorização

### 3. Obter Configuração OIDC
- **URL**: `GET /api/tenants/{tenant_id}/oidc/config`
- **Descrição**: Obtém configuração OIDC do tenant
- **Headers**: `Authorization: Bearer <token>`

### 4. Definir Configuração OIDC
- **URL**: `PUT /api/tenants/{tenant_id}/oidc/config`
- **Descrição**: Define/atualiza configuração OIDC
- **Headers**: `Authorization: Bearer <token>`
- **Body**: Configuração OIDC

## Configuração do Cliente HTTP

### Cliente Base

```typescript
// src/services/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8080',
  timeout: 10000,
  withCredentials: true, // Para cookies de autenticação
});

// Interceptor para adicionar token de autenticação
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor para tratamento de respostas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

### Tipos TypeScript

```typescript
// src/types/oidc.ts
export interface OIDCConfig {
  enabled: boolean;
  issuer_url?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  scopes?: string[];
  provider_name?: string;
  auto_create_users?: boolean;
  role_mapping?: Record<string, string>;
}

export interface OIDCLoginParams {
  tenant_id: string;
  return_url?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  tenant_id: string;
  roles: string[];
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}
```

## Implementação dos Métodos

### Serviço OIDC

```typescript
// src/services/oidc.service.ts
import apiClient from './api/client';
import { OIDCConfig, OIDCLoginParams, ApiResponse } from '../types/oidc';

export class OIDCService {
  /**
   * Inicia o fluxo de login OIDC
   */
  static initiateLogin(params: OIDCLoginParams): void {
    const { tenant_id, return_url } = params;
    const currentUrl = window.location.href;
    const returnUrl = return_url || currentUrl;
    
    // Redireciona para o endpoint de login
    window.location.href = `/auth/oidc/login/${tenant_id}?return_url=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * Obtém configuração OIDC do tenant
   */
  static async getOIDCConfig(tenantId: string): Promise<OIDCConfig> {
    try {
      const response = await apiClient.get<OIDCConfig>(
        `/api/tenants/${tenantId}/oidc/config`
      );
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        // Retorna configuração vazia se não encontrada
        return { enabled: false };
      }
      throw new Error(
        error.response?.data?.message || 'Erro ao obter configuração OIDC'
      );
    }
  }

  /**
   * Define/atualiza configuração OIDC
   */
  static async setOIDCConfig(
    tenantId: string, 
    config: OIDCConfig
  ): Promise<void> {
    try {
      await apiClient.put(
        `/api/tenants/${tenantId}/oidc/config`,
        config
      );
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message || 'Erro ao salvar configuração OIDC'
      );
    }
  }

  /**
   * Valida se o OIDC está configurado para o tenant
   */
  static async isOIDCEnabled(tenantId: string): Promise<boolean> {
    try {
      const config = await this.getOIDCConfig(tenantId);
      return config.enabled && !!config.issuer_url && !!config.client_id;
    } catch {
      return false;
    }
  }

  /**
   * Gera URL de login OIDC sem redirecionamento
   */
  static generateLoginURL(params: OIDCLoginParams): string {
    const { tenant_id, return_url } = params;
    const returnUrl = return_url || window.location.href;
    return `/auth/oidc/login/${tenant_id}?return_url=${encodeURIComponent(returnUrl)}`;
  }

  /**
   * Logout (remove cookies e tokens)
   */
  static logout(): void {
    // Remove token do localStorage
    localStorage.removeItem('auth_token');
    
    // Remove cookie de autenticação
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Redireciona para página de login
    window.location.href = '/login';
  }

  /**
   * Verifica se o usuário está autenticado
   */
  static isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    
    return !!(token || cookie);
  }
}
```

## Gerenciamento de Estado

### Context Provider

```typescript
// src/contexts/AuthContext.tsx
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { AuthUser } from '../types/oidc';
import { OIDCService } from '../services/oidc.service';

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (tenantId: string, returnUrl?: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = OIDCService.isAuthenticated();

  const login = (tenantId: string, returnUrl?: string) => {
    OIDCService.initiateLogin({ tenant_id: tenantId, return_url: returnUrl });
  };

  const logout = () => {
    OIDCService.logout();
    setUser(null);
  };

  const checkAuth = async () => {
    setIsLoading(true);
    try {
      if (isAuthenticated) {
        // Aqui você pode fazer uma chamada para obter dados do usuário
        // const userData = await getUserInfo();
        // setUser(userData);
      }
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        login,
        logout,
        checkAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
```

## Componentes React

### Hook para Configuração OIDC

```typescript
// src/hooks/useOIDCConfig.ts
import { useState, useEffect } from 'react';
import { OIDCConfig } from '../types/oidc';
import { OIDCService } from '../services/oidc.service';

export const useOIDCConfig = (tenantId: string) => {
  const [config, setConfig] = useState<OIDCConfig>({ enabled: false });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = async () => {
    if (!tenantId) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const oidcConfig = await OIDCService.getOIDCConfig(tenantId);
      setConfig(oidcConfig);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const updateConfig = async (newConfig: OIDCConfig) => {
    setLoading(true);
    setError(null);
    
    try {
      await OIDCService.setOIDCConfig(tenantId, newConfig);
      setConfig(newConfig);
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConfig();
  }, [tenantId]);

  return {
    config,
    loading,
    error,
    refetch: fetchConfig,
    updateConfig,
  };
};
```

### Componente de Login OIDC

```tsx
// src/components/auth/OIDCLoginButton.tsx
import React from 'react';
import { Button, ButtonProps } from '@mui/material';
import { useAuth } from '../../contexts/AuthContext';

interface OIDCLoginButtonProps extends Omit<ButtonProps, 'onClick'> {
  tenantId: string;
  returnUrl?: string;
  children?: React.ReactNode;
}

export const OIDCLoginButton: React.FC<OIDCLoginButtonProps> = ({
  tenantId,
  returnUrl,
  children = 'Login com OIDC',
  ...buttonProps
}) => {
  const { login } = useAuth();

  const handleLogin = () => {
    login(tenantId, returnUrl);
  };

  return (
    <Button onClick={handleLogin} {...buttonProps}>
      {children}
    </Button>
  );
};
```

### Componente de Configuração OIDC

```tsx
// src/components/admin/OIDCConfigForm.tsx
import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  TextField,
  Switch,
  FormControlLabel,
  Button,
  Alert,
  Chip,
  Grid,
} from '@mui/material';
import { useOIDCConfig } from '../../hooks/useOIDCConfig';
import { OIDCConfig } from '../../types/oidc';

interface OIDCConfigFormProps {
  tenantId: string;
}

export const OIDCConfigForm: React.FC<OIDCConfigFormProps> = ({ tenantId }) => {
  const { config, loading, error, updateConfig } = useOIDCConfig(tenantId);
  const [formData, setFormData] = useState<OIDCConfig>(config);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  React.useEffect(() => {
    setFormData(config);
  }, [config]);

  const handleChange = (field: keyof OIDCConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = event.target.type === 'checkbox' 
      ? event.target.checked 
      : event.target.value;
    
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleScopesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const scopes = event.target.value.split(',').map(s => s.trim()).filter(Boolean);
    setFormData(prev => ({ ...prev, scopes }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaveLoading(true);
    setSaveSuccess(false);

    try {
      await updateConfig(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      // Erro já tratado no hook
    } finally {
      setSaveLoading(false);
    }
  };

  if (loading) {
    return <div>Carregando configuração...</div>;
  }

  return (
    <Card>
      <CardHeader title="Configuração OIDC" />
      <CardContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        {saveSuccess && (
          <Alert severity="success" sx={{ mb: 2 }}>
            Configuração salva com sucesso!
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.enabled}
                    onChange={handleChange('enabled')}
                  />
                }
                label="Habilitar OIDC"
              />
            </Grid>

            {formData.enabled && (
              <>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Nome do Provedor"
                    value={formData.provider_name || ''}
                    onChange={handleChange('provider_name')}
                    placeholder="Ex: Google, Azure AD, Keycloak"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Issuer URL"
                    value={formData.issuer_url || ''}
                    onChange={handleChange('issuer_url')}
                    placeholder="https://accounts.google.com"
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Client ID"
                    value={formData.client_id || ''}
                    onChange={handleChange('client_id')}
                  />
                </Grid>

                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    required
                    label="Client Secret"
                    type="password"
                    value={formData.client_secret || ''}
                    onChange={handleChange('client_secret')}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Redirect URI"
                    value={formData.redirect_uri || ''}
                    onChange={handleChange('redirect_uri')}
                    placeholder="https://seu-dominio.com/auth/oidc/callback"
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Scopes"
                    value={formData.scopes?.join(', ') || 'openid, email, profile'}
                    onChange={handleScopesChange}
                    helperText="Separados por vírgula. Ex: openid, email, profile"
                  />
                  <Box sx={{ mt: 1 }}>
                    {formData.scopes?.map(scope => (
                      <Chip key={scope} label={scope} size="small" sx={{ mr: 1, mb: 1 }} />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.auto_create_users || false}
                        onChange={handleChange('auto_create_users')}
                      />
                    }
                    label="Criar usuários automaticamente"
                  />
                </Grid>
              </>
            )}

            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={saveLoading}
                sx={{ mr: 2 }}
              >
                {saveLoading ? 'Salvando...' : 'Salvar Configuração'}
              </Button>
              
              <Button
                variant="outlined"
                onClick={() => setFormData(config)}
                disabled={saveLoading}
              >
                Cancelar
              </Button>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
};
```

### Guarda de Rota para Autenticação

```tsx
// src/components/auth/ProtectedRoute.tsx
import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { CircularProgress, Box } from '@mui/material';

interface ProtectedRouteProps {
  children: React.ReactNode;
  tenantId?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  tenantId 
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    // Salva a localização atual para redirecionar após login
    const redirectPath = tenantId 
      ? `/login/${tenantId}?return_url=${encodeURIComponent(location.pathname)}`
      : '/login';
    
    return <Navigate to={redirectPath} state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
```

## Tratamento de Erros

### Utilitário para Tratamento de Erros

```typescript
// src/utils/errorHandler.ts
export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}

export class ErrorHandler {
  static parseApiError(error: any): ApiError {
    if (error.response) {
      return {
        message: error.response.data?.message || 'Erro do servidor',
        code: error.response.data?.code,
        status: error.response.status,
      };
    }
    
    if (error.request) {
      return {
        message: 'Erro de conexão com o servidor',
        status: 0,
      };
    }
    
    return {
      message: error.message || 'Erro desconhecido',
    };
  }

  static getErrorMessage(error: any): string {
    const apiError = this.parseApiError(error);
    
    switch (apiError.status) {
      case 401:
        return 'Não autorizado. Faça login novamente.';
      case 403:
        return 'Acesso negado. Você não tem permissão para esta ação.';
      case 404:
        return 'Recurso não encontrado.';
      case 500:
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      default:
        return apiError.message;
    }
  }
}
```

### Hook para Tratamento de Erros

```typescript
// src/hooks/useErrorHandler.ts
import { useState, useCallback } from 'react';
import { ErrorHandler } from '../utils/errorHandler';

export const useErrorHandler = () => {
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any) => {
    const errorMessage = ErrorHandler.getErrorMessage(error);
    setError(errorMessage);
    console.error('API Error:', error);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
  };
};
```

## Exemplos Práticos

### Página de Login com OIDC

```tsx
// src/pages/LoginPage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import {
  Container,
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { OIDCLoginButton } from '../components/auth/OIDCLoginButton';
import { OIDCService } from '../services/oidc.service';

export const LoginPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('return_url');
  
  const [oidcEnabled, setOidcEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkOIDC = async () => {
      if (!tenantId) {
        setError('Tenant ID não fornecido');
        setLoading(false);
        return;
      }

      try {
        const enabled = await OIDCService.isOIDCEnabled(tenantId);
        setOidcEnabled(enabled);
      } catch (err: any) {
        setError('Erro ao verificar configuração OIDC');
      } finally {
        setLoading(false);
      }
    };

    checkOIDC();
  }, [tenantId]);

  if (loading) {
    return (
      <Container maxWidth="sm">
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Box mt={4}>
        <Paper sx={{ p: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Login
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {!oidcEnabled && (
            <Alert severity="info" sx={{ mb: 2 }}>
              OIDC não está configurado para este tenant.
            </Alert>
          )}

          {oidcEnabled && tenantId && (
            <Box textAlign="center">
              <OIDCLoginButton
                tenantId={tenantId}
                returnUrl={returnUrl || undefined}
                variant="contained"
                color="primary"
                size="large"
                fullWidth
              >
                Entrar com OIDC
              </OIDCLoginButton>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
};
```

### Dashboard de Administração

```tsx
// src/pages/admin/OIDCSettingsPage.tsx
import React from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Alert,
} from '@mui/material';
import { OIDCConfigForm } from '../../components/admin/OIDCConfigForm';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export const OIDCSettingsPage: React.FC = () => {
  const { tenantId } = useParams<{ tenantId: string }>();

  if (!tenantId) {
    return (
      <Container>
        <Alert severity="error">
          Tenant ID não fornecido
        </Alert>
      </Container>
    );
  }

  return (
    <ProtectedRoute tenantId={tenantId}>
      <Container maxWidth="lg">
        <Box py={4}>
          <Typography variant="h4" gutterBottom>
            Configurações OIDC
          </Typography>
          
          <Typography variant="body1" color="text.secondary" paragraph>
            Configure a autenticação OpenID Connect para seu tenant.
          </Typography>

          <OIDCConfigForm tenantId={tenantId} />
        </Box>
      </Container>
    </ProtectedRoute>
  );
};
```

## Testes

### Testes de Unidade para Serviços

```typescript
// src/services/__tests__/oidc.service.test.ts
import { OIDCService } from '../oidc.service';
import apiClient from '../api/client';

jest.mock('../api/client');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('OIDCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: {
        href: 'http://localhost:3000',
        assign: jest.fn(),
      },
      writable: true,
    });
  });

  describe('getOIDCConfig', () => {
    it('should return OIDC config', async () => {
      const mockConfig = {
        enabled: true,
        issuer_url: 'https://accounts.google.com',
        client_id: 'test-client-id',
      };

      mockedApiClient.get.mockResolvedValue({ data: mockConfig });

      const result = await OIDCService.getOIDCConfig('tenant-1');

      expect(mockedApiClient.get).toHaveBeenCalledWith(
        '/api/tenants/tenant-1/oidc/config'
      );
      expect(result).toEqual(mockConfig);
    });

    it('should return disabled config on 404', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: { status: 404 }
      });

      const result = await OIDCService.getOIDCConfig('tenant-1');

      expect(result).toEqual({ enabled: false });
    });
  });

  describe('generateLoginURL', () => {
    it('should generate correct login URL', () => {
      const url = OIDCService.generateLoginURL({
        tenant_id: 'tenant-1',
        return_url: 'http://localhost:3000/dashboard',
      });

      expect(url).toBe(
        '/auth/oidc/login/tenant-1?return_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard'
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists in localStorage', () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => 'test-token'),
        },
        writable: true,
      });

      expect(OIDCService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token exists', () => {
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: jest.fn(() => null),
        },
        writable: true,
      });

      Object.defineProperty(document, 'cookie', {
        value: '',
        writable: true,
      });

      expect(OIDCService.isAuthenticated()).toBe(false);
    });
  });
});
```

### Testes de Componentes

```tsx
// src/components/auth/__tests__/OIDCLoginButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OIDCLoginButton } from '../OIDCLoginButton';
import { AuthProvider } from '../../../contexts/AuthContext';

const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const mockLogin = jest.fn();
  
  return (
    <AuthProvider value={{ login: mockLogin }}>
      {children}
    </AuthProvider>
  );
};

describe('OIDCLoginButton', () => {
  it('should render login button', () => {
    render(
      <MockAuthProvider>
        <OIDCLoginButton tenantId="tenant-1" />
      </MockAuthProvider>
    );

    expect(screen.getByText('Login com OIDC')).toBeInTheDocument();
  });

  it('should call login when clicked', () => {
    const mockLogin = jest.fn();
    
    render(
      <AuthProvider value={{ login: mockLogin }}>
        <OIDCLoginButton tenantId="tenant-1" returnUrl="/dashboard" />
      </AuthProvider>
    );

    fireEvent.click(screen.getByText('Login com OIDC'));

    expect(mockLogin).toHaveBeenCalledWith('tenant-1', '/dashboard');
  });
});
```

## Configuração de Roteamento

### Configuração no React Router

```tsx
// src/App.tsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { OIDCSettingsPage } from './pages/admin/OIDCSettingsPage';
import { Dashboard } from './pages/Dashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login/:tenantId" element={<LoginPage />} />
          <Route path="/admin/:tenantId/oidc" element={<OIDCSettingsPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          {/* Outras rotas */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
```

Este guia fornece uma implementação completa e robusta para integrar todas as funcionalidades da API OIDC no frontend do VeloFlux, incluindo autenticação, configuração, gerenciamento de estado e tratamento de erros.
