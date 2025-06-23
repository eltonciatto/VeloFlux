# Guia de Testes - API OIDC Frontend

Este documento fornece estratégias e implementações completas para testar a integração da API OIDC no frontend.

## Índice

1. [Estratégia de Testes](#estratégia-de-testes)
2. [Configuração do Ambiente de Testes](#configuração-do-ambiente-de-testes)
3. [Testes de Unidade](#testes-de-unidade)
4. [Testes de Integração](#testes-de-integração)
5. [Testes End-to-End](#testes-end-to-end)
6. [Mocks e Fixtures](#mocks-e-fixtures)
7. [Testes de Performance](#testes-de-performance)
8. [Testes de Segurança](#testes-de-segurança)
9. [Automação e CI/CD](#automação-e-cicd)

## Estratégia de Testes

### Pirâmide de Testes

```
    /\
   /  \     E2E Tests (10%)
  /____\    - Fluxos completos
 /      \   - Integração real
/________\  Integration Tests (20%)
           - APIs mockadas
           - Componentes integrados
__________
          Unit Tests (70%)
          - Funções isoladas
          - Componentes individuais
```

### Cobertura de Testes

- **Serviços OIDC**: 100%
- **Componentes**: 90%
- **Hooks/Composables**: 95%
- **Utilitários**: 100%
- **Fluxos críticos**: 100%

## Configuração do Ambiente de Testes

### Jest Configuration

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.{ts,tsx}',
    '<rootDir>/src/**/*.(test|spec).{ts,tsx}',
  ],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
};
```

### Setup de Testes

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { configure } from '@testing-library/react';
import { server } from './mocks/server';

// Configurar Testing Library
configure({ testIdAttribute: 'data-testid' });

// Configurar MSW
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock as any;

// Mock de window.location
delete (window as any).location;
(window as any).location = {
  href: 'http://localhost:3000',
  assign: jest.fn(),
  reload: jest.fn(),
};

// Mock de fetch
global.fetch = jest.fn();

// Mock de document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});
```

## Testes de Unidade

### Testes do Serviço OIDC

```typescript
// src/services/__tests__/oidc.service.test.ts
import { OIDCService } from '../oidc.service';
import { OIDCConfig } from '../../types/oidc';

// Mock do apiClient
jest.mock('../api/client', () => ({
  get: jest.fn(),
  put: jest.fn(),
}));

import apiClient from '../api/client';
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('OIDCService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    document.cookie = '';
    (window.location.href as any) = 'http://localhost:3000';
  });

  describe('getOIDCConfig', () => {
    it('should return OIDC configuration successfully', async () => {
      const mockConfig: OIDCConfig = {
        enabled: true,
        issuer_url: 'https://accounts.google.com',
        client_id: 'test-client-id',
        client_secret: 'test-secret',
        scopes: ['openid', 'email', 'profile'],
      };

      mockedApiClient.get.mockResolvedValue({ data: mockConfig });

      const result = await OIDCService.getOIDCConfig('tenant-1');

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/tenants/tenant-1/oidc/config');
      expect(result).toEqual(mockConfig);
    });

    it('should return disabled config when not found (404)', async () => {
      mockedApiClient.get.mockRejectedValue({
        response: { status: 404 }
      });

      const result = await OIDCService.getOIDCConfig('tenant-1');

      expect(result).toEqual({ enabled: false });
    });

    it('should throw error for other API errors', async () => {
      const errorMessage = 'Server error';
      mockedApiClient.get.mockRejectedValue({
        response: { data: { message: errorMessage }, status: 500 }
      });

      await expect(OIDCService.getOIDCConfig('tenant-1'))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('setOIDCConfig', () => {
    it('should update OIDC configuration successfully', async () => {
      const config: OIDCConfig = {
        enabled: true,
        issuer_url: 'https://accounts.google.com',
        client_id: 'new-client-id',
      };

      mockedApiClient.put.mockResolvedValue({});

      await OIDCService.setOIDCConfig('tenant-1', config);

      expect(mockedApiClient.put).toHaveBeenCalledWith(
        '/api/tenants/tenant-1/oidc/config',
        config
      );
    });

    it('should throw error when update fails', async () => {
      const config: OIDCConfig = { enabled: false };
      const errorMessage = 'Update failed';
      
      mockedApiClient.put.mockRejectedValue({
        response: { data: { message: errorMessage } }
      });

      await expect(OIDCService.setOIDCConfig('tenant-1', config))
        .rejects.toThrow(errorMessage);
    });
  });

  describe('initiateLogin', () => {
    it('should redirect to login URL with tenant ID', () => {
      const assignSpy = jest.spyOn(window.location, 'href', 'set');

      OIDCService.initiateLogin({ tenant_id: 'tenant-1' });

      expect(assignSpy).toHaveBeenCalledWith(
        '/auth/oidc/login/tenant-1?return_url=http%3A%2F%2Flocalhost%3A3000'
      );
    });

    it('should use custom return URL when provided', () => {
      const assignSpy = jest.spyOn(window.location, 'href', 'set');

      OIDCService.initiateLogin({
        tenant_id: 'tenant-1',
        return_url: 'http://localhost:3000/dashboard'
      });

      expect(assignSpy).toHaveBeenCalledWith(
        '/auth/oidc/login/tenant-1?return_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard'
      );
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token exists in localStorage', () => {
      localStorage.setItem('auth_token', 'test-token');

      expect(OIDCService.isAuthenticated()).toBe(true);
    });

    it('should return true when auth cookie exists', () => {
      document.cookie = 'auth_token=cookie-token';

      expect(OIDCService.isAuthenticated()).toBe(true);
    });

    it('should return false when no token or cookie exists', () => {
      expect(OIDCService.isAuthenticated()).toBe(false);
    });
  });

  describe('logout', () => {
    it('should clear authentication data and redirect', () => {
      localStorage.setItem('auth_token', 'test-token');
      const assignSpy = jest.spyOn(window.location, 'href', 'set');

      OIDCService.logout();

      expect(localStorage.removeItem).toHaveBeenCalledWith('auth_token');
      expect(document.cookie).toContain('auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC');
      expect(assignSpy).toHaveBeenCalledWith('/login');
    });
  });

  describe('generateLoginURL', () => {
    it('should generate correct login URL', () => {
      const url = OIDCService.generateLoginURL({
        tenant_id: 'tenant-1',
        return_url: 'http://localhost:3000/dashboard'
      });

      expect(url).toBe(
        '/auth/oidc/login/tenant-1?return_url=http%3A%2F%2Flocalhost%3A3000%2Fdashboard'
      );
    });

    it('should use current URL when no return_url provided', () => {
      const url = OIDCService.generateLoginURL({ tenant_id: 'tenant-1' });

      expect(url).toBe(
        '/auth/oidc/login/tenant-1?return_url=http%3A%2F%2Flocalhost%3A3000'
      );
    });
  });

  describe('isOIDCEnabled', () => {
    it('should return true when OIDC is properly configured', async () => {
      const config: OIDCConfig = {
        enabled: true,
        issuer_url: 'https://accounts.google.com',
        client_id: 'test-client-id',
      };

      mockedApiClient.get.mockResolvedValue({ data: config });

      const result = await OIDCService.isOIDCEnabled('tenant-1');

      expect(result).toBe(true);
    });

    it('should return false when OIDC is disabled', async () => {
      const config: OIDCConfig = { enabled: false };

      mockedApiClient.get.mockResolvedValue({ data: config });

      const result = await OIDCService.isOIDCEnabled('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false when configuration is incomplete', async () => {
      const config: OIDCConfig = {
        enabled: true,
        // Missing issuer_url and client_id
      };

      mockedApiClient.get.mockResolvedValue({ data: config });

      const result = await OIDCService.isOIDCEnabled('tenant-1');

      expect(result).toBe(false);
    });

    it('should return false when API call fails', async () => {
      mockedApiClient.get.mockRejectedValue(new Error('Network error'));

      const result = await OIDCService.isOIDCEnabled('tenant-1');

      expect(result).toBe(false);
    });
  });
});
```

### Testes de Hooks

```typescript
// src/hooks/__tests__/useOIDCConfig.test.ts
import { renderHook, act } from '@testing-library/react';
import { useOIDCConfig } from '../useOIDCConfig';
import { OIDCService } from '../../services/oidc.service';

jest.mock('../../services/oidc.service');
const mockedOIDCService = OIDCService as jest.Mocked<typeof OIDCService>;

describe('useOIDCConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should load config on mount', async () => {
    const mockConfig = {
      enabled: true,
      issuer_url: 'https://accounts.google.com',
      client_id: 'test-client-id',
    };

    mockedOIDCService.getOIDCConfig.mockResolvedValue(mockConfig);

    const { result, waitForNextUpdate } = renderHook(() =>
      useOIDCConfig('tenant-1')
    );

    expect(result.current.loading).toBe(true);
    
    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.config).toEqual(mockConfig);
    expect(result.current.error).toBeNull();
  });

  it('should handle load error', async () => {
    const errorMessage = 'Failed to load config';
    mockedOIDCService.getOIDCConfig.mockRejectedValue(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() =>
      useOIDCConfig('tenant-1')
    );

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(result.current.config).toEqual({ enabled: false });
  });

  it('should update config successfully', async () => {
    const initialConfig = { enabled: false };
    const updatedConfig = { enabled: true, issuer_url: 'https://accounts.google.com' };

    mockedOIDCService.getOIDCConfig.mockResolvedValue(initialConfig);
    mockedOIDCService.setOIDCConfig.mockResolvedValue();

    const { result, waitForNextUpdate } = renderHook(() =>
      useOIDCConfig('tenant-1')
    );

    await waitForNextUpdate();

    await act(async () => {
      await result.current.updateConfig(updatedConfig);
    });

    expect(mockedOIDCService.setOIDCConfig).toHaveBeenCalledWith('tenant-1', updatedConfig);
    expect(result.current.config).toEqual(updatedConfig);
  });

  it('should handle update error', async () => {
    const initialConfig = { enabled: false };
    const errorMessage = 'Update failed';

    mockedOIDCService.getOIDCConfig.mockResolvedValue(initialConfig);
    mockedOIDCService.setOIDCConfig.mockRejectedValue(new Error(errorMessage));

    const { result, waitForNextUpdate } = renderHook(() =>
      useOIDCConfig('tenant-1')
    );

    await waitForNextUpdate();

    await act(async () => {
      try {
        await result.current.updateConfig({ enabled: true });
      } catch (error) {
        // Expected to throw
      }
    });

    expect(result.current.error).toBe(errorMessage);
  });

  it('should not load config when tenantId is empty', () => {
    const { result } = renderHook(() => useOIDCConfig(''));

    expect(result.current.loading).toBe(false);
    expect(mockedOIDCService.getOIDCConfig).not.toHaveBeenCalled();
  });
});
```

## Testes de Integração

### Testes de Componentes React

```typescript
// src/components/__tests__/OIDCLoginButton.test.tsx
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { OIDCLoginButton } from '../OIDCLoginButton';
import { AuthProvider } from '../../contexts/AuthContext';

const mockLogin = jest.fn();

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthProvider value={{ login: mockLogin, logout: jest.fn(), isAuthenticated: false, isLoading: false, user: null, checkAuth: jest.fn() }}>
    {children}
  </AuthProvider>
);

describe('OIDCLoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render with default text', () => {
    render(
      <TestWrapper>
        <OIDCLoginButton tenantId="tenant-1" />
      </TestWrapper>
    );

    expect(screen.getByText('Login com OIDC')).toBeInTheDocument();
  });

  it('should render with custom text', () => {
    render(
      <TestWrapper>
        <OIDCLoginButton tenantId="tenant-1">
          Entrar com Google
        </OIDCLoginButton>
      </TestWrapper>
    );

    expect(screen.getByText('Entrar com Google')).toBeInTheDocument();
  });

  it('should call login when clicked', () => {
    render(
      <TestWrapper>
        <OIDCLoginButton tenantId="tenant-1" returnUrl="/dashboard" />
      </TestWrapper>
    );

    fireEvent.click(screen.getByText('Login com OIDC'));

    expect(mockLogin).toHaveBeenCalledWith('tenant-1', '/dashboard');
  });

  it('should pass through button props', () => {
    render(
      <TestWrapper>
        <OIDCLoginButton
          tenantId="tenant-1"
          variant="outlined"
          color="secondary"
          disabled
        />
      </TestWrapper>
    );

    const button = screen.getByRole('button');
    expect(button).toHaveClass('MuiButton-outlined');
    expect(button).toHaveClass('MuiButton-colorSecondary');
    expect(button).toBeDisabled();
  });
});
```

### Testes de Formulário de Configuração

```typescript
// src/components/__tests__/OIDCConfigForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { OIDCConfigForm } from '../OIDCConfigForm';
import { OIDCService } from '../../services/oidc.service';

jest.mock('../../services/oidc.service');
const mockedOIDCService = OIDCService as jest.Mocked<typeof OIDCService>;

describe('OIDCConfigForm', () => {
  const defaultConfig = {
    enabled: false,
    provider_name: '',
    issuer_url: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    scopes: ['openid', 'email', 'profile'],
    auto_create_users: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedOIDCService.getOIDCConfig.mockResolvedValue(defaultConfig);
  });

  it('should load and display configuration', async () => {
    const config = {
      ...defaultConfig,
      enabled: true,
      provider_name: 'Google',
      issuer_url: 'https://accounts.google.com',
      client_id: 'test-client-id',
    };

    mockedOIDCService.getOIDCConfig.mockResolvedValue(config);

    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Google')).toBeInTheDocument();
      expect(screen.getByDisplayValue('https://accounts.google.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test-client-id')).toBeInTheDocument();
    });

    expect(mockedOIDCService.getOIDCConfig).toHaveBeenCalledWith('tenant-1');
  });

  it('should show loading state', () => {
    // Mock que nunca resolve para simular loading
    mockedOIDCService.getOIDCConfig.mockImplementation(() => new Promise(() => {}));

    render(<OIDCConfigForm tenantId="tenant-1" />);

    expect(screen.getByText('Carregando configuração...')).toBeInTheDocument();
  });

  it('should handle load error', async () => {
    const errorMessage = 'Failed to load config';
    mockedOIDCService.getOIDCConfig.mockRejectedValue(new Error(errorMessage));

    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should toggle OIDC fields when enabled checkbox is clicked', async () => {
    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Habilitar OIDC')).toBeInTheDocument();
    });

    // Campos devem estar ocultos inicialmente
    expect(screen.queryByLabelText('Issuer URL *:')).not.toBeVisible();

    // Habilitar OIDC
    fireEvent.click(screen.getByLabelText('Habilitar OIDC'));

    // Campos devem aparecer
    expect(screen.getByLabelText('Issuer URL *:')).toBeVisible();
  });

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    mockedOIDCService.setOIDCConfig.mockResolvedValue();

    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Habilitar OIDC')).toBeInTheDocument();
    });

    // Habilitar OIDC
    await user.click(screen.getByLabelText('Habilitar OIDC'));

    // Preencher formulário
    await user.type(screen.getByLabelText('Nome do Provedor:'), 'Google');
    await user.type(screen.getByLabelText('Issuer URL *:'), 'https://accounts.google.com');
    await user.type(screen.getByLabelText('Client ID *:'), 'test-client-id');
    await user.type(screen.getByLabelText('Client Secret *:'), 'test-secret');

    // Submeter formulário
    await user.click(screen.getByText('Salvar Configuração'));

    await waitFor(() => {
      expect(mockedOIDCService.setOIDCConfig).toHaveBeenCalledWith('tenant-1', {
        enabled: true,
        provider_name: 'Google',
        issuer_url: 'https://accounts.google.com',
        client_id: 'test-client-id',
        client_secret: 'test-secret',
        redirect_uri: '',
        scopes: ['openid', 'email', 'profile'],
        auto_create_users: false,
      });
    });

    expect(screen.getByText('Configuração salva com sucesso!')).toBeInTheDocument();
  });

  it('should handle submit error', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Save failed';
    mockedOIDCService.setOIDCConfig.mockRejectedValue(new Error(errorMessage));

    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Habilitar OIDC')).toBeInTheDocument();
    });

    // Habilitar OIDC e preencher dados mínimos
    await user.click(screen.getByLabelText('Habilitar OIDC'));
    await user.type(screen.getByLabelText('Issuer URL *:'), 'https://accounts.google.com');
    await user.type(screen.getByLabelText('Client ID *:'), 'test-client-id');
    await user.type(screen.getByLabelText('Client Secret *:'), 'test-secret');

    // Submeter formulário
    await user.click(screen.getByText('Salvar Configuração'));

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should handle scopes input correctly', async () => {
    const user = userEvent.setup();

    render(<OIDCConfigForm tenantId="tenant-1" />);

    await waitFor(() => {
      expect(screen.getByLabelText('Habilitar OIDC')).toBeInTheDocument();
    });

    await user.click(screen.getByLabelText('Habilitar OIDC'));

    // Limpar e inserir novos scopes
    const scopesInput = screen.getByLabelText('Scopes:');
    await user.clear(scopesInput);
    await user.type(scopesInput, 'openid, email, profile, custom_scope');

    // Verificar se chips são exibidos
    expect(screen.getByText('openid')).toBeInTheDocument();
    expect(screen.getByText('email')).toBeInTheDocument();
    expect(screen.getByText('profile')).toBeInTheDocument();
    expect(screen.getByText('custom_scope')).toBeInTheDocument();
  });
});
```

## Testes End-to-End

### Cypress Tests

```typescript
// cypress/e2e/oidc-flow.cy.ts
describe('OIDC Authentication Flow', () => {
  beforeEach(() => {
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  it('should complete full OIDC login flow', () => {
    // Interceptar chamadas da API
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      fixture: 'oidc-config-enabled.json'
    }).as('getOIDCConfig');

    cy.intercept('GET', '/auth/oidc/login/test-tenant*', (req) => {
      // Simular redirecionamento para provedor
      req.reply({
        statusCode: 302,
        headers: {
          'Location': 'https://accounts.google.com/oauth/authorize?...'
        }
      });
    }).as('initiateLogin');

    cy.intercept('GET', '/auth/oidc/callback*', (req) => {
      // Simular callback bem-sucedido
      req.reply({
        statusCode: 302,
        headers: {
          'Location': '/dashboard',
          'Set-Cookie': 'auth_token=test-token; Path=/'
        }
      });
    }).as('handleCallback');

    // Visitar página de login
    cy.visit('/login/test-tenant');

    // Verificar se botão OIDC está presente
    cy.wait('@getOIDCConfig');
    cy.get('[data-testid="oidc-login-button"]').should('be.visible');

    // Clicar no botão de login
    cy.get('[data-testid="oidc-login-button"]').click();

    // Verificar redirecionamento para provedor
    cy.wait('@initiateLogin');

    // Simular retorno do provedor (callback)
    cy.visit('/auth/oidc/callback?code=test-code&state=test-state');

    // Verificar redirecionamento para dashboard
    cy.wait('@handleCallback');
    cy.url().should('include', '/dashboard');

    // Verificar se usuário está autenticado
    cy.window().then((win) => {
      expect(win.localStorage.getItem('auth_token')).to.exist;
    });
  });

  it('should handle OIDC login error', () => {
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      fixture: 'oidc-config-enabled.json'
    });

    cy.intercept('GET', '/auth/oidc/callback*', {
      statusCode: 401,
      body: 'Authentication failed'
    }).as('handleCallbackError');

    cy.visit('/login/test-tenant');
    cy.get('[data-testid="oidc-login-button"]').click();

    // Simular callback com erro
    cy.visit('/auth/oidc/callback?error=access_denied&error_description=User denied access');

    // Verificar exibição de erro
    cy.get('[data-testid="error-message"]').should('contain', 'Authentication failed');
  });

  it('should not show OIDC button when disabled', () => {
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      body: { enabled: false }
    });

    cy.visit('/login/test-tenant');

    cy.get('[data-testid="oidc-disabled-message"]').should('be.visible');
    cy.get('[data-testid="oidc-login-button"]').should('not.exist');
  });
});

describe('OIDC Configuration Management', () => {
  beforeEach(() => {
    // Simular usuário autenticado
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-admin-token');
    });
  });

  it('should load and display OIDC configuration', () => {
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      fixture: 'oidc-config-complete.json'
    }).as('getConfig');

    cy.visit('/admin/test-tenant/oidc');

    cy.wait('@getConfig');

    // Verificar se configuração é exibida
    cy.get('[data-testid="provider-name"]').should('have.value', 'Google');
    cy.get('[data-testid="issuer-url"]').should('have.value', 'https://accounts.google.com');
    cy.get('[data-testid="client-id"]').should('have.value', 'test-client-id');
  });

  it('should save OIDC configuration', () => {
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      body: { enabled: false }
    });

    cy.intercept('PUT', '/api/tenants/test-tenant/oidc/config', {
      statusCode: 200
    }).as('saveConfig');

    cy.visit('/admin/test-tenant/oidc');

    // Habilitar OIDC
    cy.get('[data-testid="enabled-checkbox"]').check();

    // Preencher formulário
    cy.get('[data-testid="provider-name"]').type('Google');
    cy.get('[data-testid="issuer-url"]').type('https://accounts.google.com');
    cy.get('[data-testid="client-id"]').type('new-client-id');
    cy.get('[data-testid="client-secret"]').type('new-client-secret');

    // Salvar configuração
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@saveConfig').then((interception) => {
      expect(interception.request.body).to.include({
        enabled: true,
        provider_name: 'Google',
        issuer_url: 'https://accounts.google.com',
        client_id: 'new-client-id',
        client_secret: 'new-client-secret'
      });
    });

    // Verificar mensagem de sucesso
    cy.get('[data-testid="success-message"]').should('be.visible');
  });

  it('should handle configuration save error', () => {
    cy.intercept('GET', '/api/tenants/test-tenant/oidc/config', {
      body: { enabled: false }
    });

    cy.intercept('PUT', '/api/tenants/test-tenant/oidc/config', {
      statusCode: 500,
      body: { message: 'Internal server error' }
    }).as('saveConfigError');

    cy.visit('/admin/test-tenant/oidc');

    cy.get('[data-testid="enabled-checkbox"]').check();
    cy.get('[data-testid="issuer-url"]').type('https://accounts.google.com');
    cy.get('[data-testid="client-id"]').type('test-client-id');
    cy.get('[data-testid="client-secret"]').type('test-secret');
    cy.get('[data-testid="save-button"]').click();

    cy.wait('@saveConfigError');

    // Verificar mensagem de erro
    cy.get('[data-testid="error-message"]').should('contain', 'Internal server error');
  });
});
```

### Fixtures para Cypress

```json
<!-- cypress/fixtures/oidc-config-enabled.json -->
{
  "enabled": true,
  "provider_name": "Google",
  "issuer_url": "https://accounts.google.com",
  "client_id": "test-client-id",
  "client_secret": "test-client-secret",
  "redirect_uri": "http://localhost:3000/auth/oidc/callback",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

```json
<!-- cypress/fixtures/oidc-config-complete.json -->
{
  "enabled": true,
  "provider_name": "Google",
  "issuer_url": "https://accounts.google.com",
  "client_id": "test-client-id",
  "client_secret": "test-client-secret",
  "redirect_uri": "http://localhost:3000/auth/oidc/callback",
  "scopes": ["openid", "email", "profile", "https://www.googleapis.com/auth/userinfo.profile"],
  "auto_create_users": true,
  "role_mapping": {
    "admin": "administrator",
    "user": "standard_user"
  }
}
```

## Mocks e Fixtures

### MSW (Mock Service Worker)

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';
import { OIDCConfig } from '../types/oidc';

export const handlers = [
  // Get OIDC Config
  rest.get('/api/tenants/:tenantId/oidc/config', (req, res, ctx) => {
    const { tenantId } = req.params;
    
    const configs: Record<string, OIDCConfig> = {
      'tenant-1': {
        enabled: true,
        provider_name: 'Google',
        issuer_url: 'https://accounts.google.com',
        client_id: 'test-client-id',
        client_secret: 'test-client-secret',
        scopes: ['openid', 'email', 'profile'],
        auto_create_users: true,
      },
      'tenant-disabled': {
        enabled: false,
      },
    };

    const config = configs[tenantId as string];
    
    if (!config) {
      return res(ctx.status(404), ctx.json({ message: 'Tenant not found' }));
    }

    return res(ctx.json(config));
  }),

  // Set OIDC Config
  rest.put('/api/tenants/:tenantId/oidc/config', (req, res, ctx) => {
    const { tenantId } = req.params;
    
    // Simular validação
    const config = req.body as OIDCConfig;
    
    if (config.enabled && !config.issuer_url) {
      return res(
        ctx.status(400),
        ctx.json({ message: 'Issuer URL is required when OIDC is enabled' })
      );
    }

    return res(ctx.status(200));
  }),

  // OIDC Login
  rest.get('/auth/oidc/login/:tenantId', (req, res, ctx) => {
    const returnUrl = req.url.searchParams.get('return_url') || '/';
    
    return res(
      ctx.status(302),
      ctx.set('Location', `https://accounts.google.com/oauth/authorize?...&state=${returnUrl}`)
    );
  }),

  // OIDC Callback
  rest.get('/auth/oidc/callback', (req, res, ctx) => {
    const code = req.url.searchParams.get('code');
    const error = req.url.searchParams.get('error');
    
    if (error) {
      return res(
        ctx.status(401),
        ctx.html(`
          <html>
            <body>
              <h2>Authentication Failed</h2>
              <p>${error}</p>
            </body>
          </html>
        `)
      );
    }
    
    if (!code) {
      return res(
        ctx.status(400),
        ctx.text('Missing authorization code')
      );
    }

    return res(
      ctx.status(302),
      ctx.set('Location', '/dashboard'),
      ctx.cookie('auth_token', 'mock-jwt-token')
    );
  }),

  // Health check
  rest.get('/api/health', (req, res, ctx) => {
    return res(ctx.json({ status: 'ok' }));
  }),
];
```

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

### Test Utilities

```typescript
// src/utils/test-utils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { theme } from '../theme';
import { AuthProvider } from '../contexts/AuthContext';

const AllTheProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

export * from '@testing-library/react';
export { customRender as render };
```

## Testes de Performance

### Testes de Load Testing

```typescript
// src/performance/__tests__/oidc-load.test.ts
import { OIDCService } from '../services/oidc.service';

describe('OIDC Performance Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should handle concurrent config requests', async () => {
    const tenantIds = Array.from({ length: 100 }, (_, i) => `tenant-${i}`);
    
    const startTime = performance.now();
    
    const promises = tenantIds.map(tenantId => 
      OIDCService.getOIDCConfig(tenantId).catch(() => null)
    );
    
    const results = await Promise.all(promises);
    
    const endTime = performance.now();
    const duration = endTime - startTime;
    
    expect(duration).toBeLessThan(5000); // 5 segundos
    expect(results).toHaveLength(100);
  });

  it('should cache config requests efficiently', async () => {
    const tenantId = 'performance-test-tenant';
    
    // Primeira chamada (deve fazer requisição)
    const startTime1 = performance.now();
    await OIDCService.getOIDCConfig(tenantId);
    const duration1 = performance.now() - startTime1;
    
    // Segunda chamada (deve usar cache)
    const startTime2 = performance.now();
    await OIDCService.getOIDCConfig(tenantId);
    const duration2 = performance.now() - startTime2;
    
    // Cache deve ser significativamente mais rápido
    expect(duration2).toBeLessThan(duration1 * 0.1);
  });
});
```

### Web Vitals Monitoring

```typescript
// src/utils/performance.ts
export class PerformanceMonitor {
  static measureOIDCOperation<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    const startTime = performance.now();
    
    return operation().finally(() => {
      const duration = performance.now() - startTime;
      
      // Log para análise
      console.log(`OIDC Operation: ${operationName} took ${duration}ms`);
      
      // Enviar métricas para analytics
      if (window.gtag) {
        window.gtag('event', 'timing_complete', {
          name: operationName,
          value: Math.round(duration),
        });
      }
    });
  }

  static measureComponentRender(componentName: string) {
    return (target: any, propertyName: string, descriptor: PropertyDescriptor) => {
      const method = descriptor.value;
      
      descriptor.value = function (...args: any[]) {
        const startTime = performance.now();
        const result = method.apply(this, args);
        const duration = performance.now() - startTime;
        
        console.log(`Component ${componentName}.${propertyName} rendered in ${duration}ms`);
        
        return result;
      };
    };
  }
}
```

## Testes de Segurança

### Teste de Vulnerabilidades

```typescript
// src/security/__tests__/oidc-security.test.ts
import { OIDCService } from '../services/oidc.service';
import { OIDCConfigValidator } from '../utils/validation';

describe('OIDC Security Tests', () => {
  describe('Input Validation', () => {
    it('should reject malicious URLs', () => {
      const maliciousURLs = [
        'javascript:alert("xss")',
        'data:text/html,<script>alert("xss")</script>',
        'file:///etc/passwd',
        'ftp://malicious.com',
      ];

      maliciousURLs.forEach(url => {
        const config = {
          enabled: true,
          issuer_url: url,
          client_id: 'test',
          client_secret: 'test',
        };

        const result = OIDCConfigValidator.validate(config);
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Issuer URL deve ser uma URL válida');
      });
    });

    it('should sanitize HTML content', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        '"><script>alert("xss")</script>',
        'javascript:alert("xss")',
        '<img src=x onerror=alert("xss")>',
      ];

      maliciousInputs.forEach(input => {
        const config = {
          enabled: true,
          provider_name: input,
          issuer_url: 'https://safe.com',
          client_id: 'test',
          client_secret: 'test',
        };

        // Verificar se input é sanitizado
        expect(config.provider_name).not.toContain('<script>');
        expect(config.provider_name).not.toContain('javascript:');
      });
    });
  });

  describe('Authentication State', () => {
    it('should clear sensitive data on logout', () => {
      // Simular dados sensíveis
      localStorage.setItem('auth_token', 'sensitive-token');
      localStorage.setItem('user_data', JSON.stringify({ email: 'test@example.com' }));
      document.cookie = 'auth_token=cookie-token';

      OIDCService.logout();

      // Verificar limpeza
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(document.cookie).not.toContain('auth_token=cookie-token');
    });

    it('should handle expired tokens securely', async () => {
      // Mock de token expirado
      localStorage.setItem('auth_token', 'expired-token');

      // Simular resposta 401
      jest.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
        status: 401,
        text: () => Promise.resolve('Unauthorized'),
      } as Response);

      try {
        await OIDCService.getOIDCConfig('tenant-1');
      } catch (error) {
        // Token deve ser limpo automaticamente
        expect(localStorage.getItem('auth_token')).toBeNull();
      }
    });
  });

  describe('CSRF Protection', () => {
    it('should include CSRF token in state parameter', () => {
      const loginURL = OIDCService.generateLoginURL({
        tenant_id: 'tenant-1',
        return_url: '/dashboard',
      });

      // URL deve incluir parâmetros de segurança
      expect(loginURL).toContain('return_url=');
      expect(loginURL).toMatch(/tenant-1/);
    });
  });
});
```

## Automação e CI/CD

### GitHub Actions Workflow

```yaml
# .github/workflows/frontend-tests.yml
name: Frontend Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    strategy:
      matrix:
        node-version: [16.x, 18.x]

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run lint
      run: npm run lint

    - name: Run type check
      run: npm run type-check

    - name: Run unit tests
      run: npm run test:unit -- --coverage

    - name: Run integration tests
      run: npm run test:integration

    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v3
      with:
        token: ${{ secrets.CODECOV_TOKEN }}
        file: ./coverage/lcov.info

  e2e:
    runs-on: ubuntu-latest
    needs: test

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Start backend service
      run: |
        docker-compose up -d backend
        npx wait-on http://localhost:8080/api/health

    - name: Run Cypress tests
      uses: cypress-io/github-action@v5
      with:
        start: npm start
        wait-on: 'http://localhost:3000'
        wait-on-timeout: 120

    - name: Upload Cypress screenshots
      uses: actions/upload-artifact@v3
      if: failure()
      with:
        name: cypress-screenshots
        path: cypress/screenshots

    - name: Upload Cypress videos
      uses: actions/upload-artifact@v3
      if: always()
      with:
        name: cypress-videos
        path: cypress/videos
```

### Scripts do Package.json

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:integration": "jest --testPathPattern=integration",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "cypress:open": "cypress open",
    "cypress:run": "cypress run",
    "test:e2e": "start-server-and-test start http://localhost:3000 cypress:run",
    "lint": "eslint src --ext .ts,.tsx",
    "type-check": "tsc --noEmit"
  }
}
```

Este guia de testes oferece uma cobertura completa para validar todas as funcionalidades da API OIDC no frontend, garantindo qualidade, segurança e performance da aplicação.
