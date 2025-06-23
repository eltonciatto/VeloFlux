# Testes para API SMTP - Frontend

Este documento fornece exemplos completos de como testar a integração com a API SMTP no frontend.

## Configuração de Testes

### Dependências

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.0.0",
    "@testing-library/jest-dom": "^5.16.0",
    "@testing-library/user-event": "^14.0.0",
    "jest": "^29.0.0",
    "jest-environment-jsdom": "^29.0.0",
    "msw": "^1.0.0",
    "typescript": "^4.8.0"
  }
}
```

### Setup do Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '\\.(css|less|scss)$': 'identity-obj-proxy',
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
};
```

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom';
import { server } from './mocks/server';

// Habilitar API mocking antes de todos os testes
beforeAll(() => server.listen());

// Resetar handlers após cada teste
afterEach(() => server.resetHandlers());

// Limpar após todos os testes
afterAll(() => server.close());
```

## Mock Server (MSW)

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw';

const baseUrl = 'https://api.veloflux.io';

export const handlers = [
  // GET SMTP Settings
  rest.get(`${baseUrl}/api/tenant/:tenantId/smtp-settings`, (req, res, ctx) => {
    const { tenantId } = req.params;
    
    // Simular diferentes cenários baseado no tenantId
    if (tenantId === 'unauthorized') {
      return res(ctx.status(401), ctx.json({ error: 'Unauthorized' }));
    }
    
    if (tenantId === 'forbidden') {
      return res(ctx.status(403), ctx.json({ error: 'Forbidden' }));
    }
    
    if (tenantId === 'empty') {
      return res(ctx.status(200), ctx.json({
        enabled: false,
        host: '',
        port: 587,
        username: '',
        password: '',
        from_email: '',
        from_name: '',
        use_tls: true,
        app_domain: '',
      }));
    }
    
    // Resposta padrão
    return res(ctx.status(200), ctx.json({
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'test@example.com',
      password: '********',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux',
      use_tls: true,
      app_domain: 'https://app.example.com',
    }));
  }),

  // PUT SMTP Settings
  rest.put(`${baseUrl}/api/tenant/:tenantId/smtp-settings`, async (req, res, ctx) => {
    const { tenantId } = req.params;
    const body = await req.json();
    
    if (tenantId === 'validation-error') {
      return res(ctx.status(400), ctx.json({ error: 'SMTP settings are incomplete' }));
    }
    
    if (!body.enabled) {
      return res(ctx.status(200), ctx.json({
        status: 'success',
        message: 'SMTP settings updated successfully',
      }));
    }
    
    // Validar campos obrigatórios
    if (!body.host || !body.port || !body.username || !body.from_email) {
      return res(ctx.status(400), ctx.json({ error: 'SMTP settings are incomplete' }));
    }
    
    return res(ctx.status(200), ctx.json({
      status: 'success',
      message: 'SMTP settings updated successfully',
    }));
  }),

  // POST SMTP Test
  rest.post(`${baseUrl}/api/tenant/:tenantId/smtp-test`, async (req, res, ctx) => {
    const { tenantId } = req.params;
    const body = await req.json();
    
    if (!body.email) {
      return res(ctx.status(400), ctx.json({ error: 'Email is required' }));
    }
    
    if (tenantId === 'smtp-auth-error') {
      return res(ctx.status(500), ctx.json({ 
        error: 'Failed to send test email: smtp: authentication failed' 
      }));
    }
    
    if (tenantId === 'smtp-host-error') {
      return res(ctx.status(500), ctx.json({ 
        error: 'Failed to send test email: dial tcp: lookup smtp.invalid-host.com: no such host' 
      }));
    }
    
    return res(ctx.status(200), ctx.json({
      status: 'success',
      message: 'Test email sent successfully',
    }));
  }),
];
```

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

## Testes Unitários

### Teste do Client HTTP

```typescript
// src/api/__tests__/SMTPClient.test.ts
import { VeloFluxSMTPClient } from '../SMTPClient';

describe('VeloFluxSMTPClient', () => {
  const client = new VeloFluxSMTPClient('https://api.veloflux.io', 'test-token');

  describe('getSMTPSettings', () => {
    it('should get SMTP settings successfully', async () => {
      const result = await client.getSMTPSettings('test-tenant');
      
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        enabled: true,
        host: 'smtp.gmail.com',
        port: 587,
        username: 'test@example.com',
        password: '********',
        from_email: 'noreply@example.com',
        from_name: 'VeloFlux',
        use_tls: true,
        app_domain: 'https://app.example.com',
      });
    });

    it('should handle unauthorized error', async () => {
      const result = await client.getSMTPSettings('unauthorized');
      
      expect(result.status).toBe(401);
      expect(result.error).toBe('Unauthorized');
    });

    it('should handle forbidden error', async () => {
      const result = await client.getSMTPSettings('forbidden');
      
      expect(result.status).toBe(403);
      expect(result.error).toBe('Forbidden');
    });

    it('should handle empty settings', async () => {
      const result = await client.getSMTPSettings('empty');
      
      expect(result.status).toBe(200);
      expect(result.data?.enabled).toBe(false);
    });
  });

  describe('updateSMTPSettings', () => {
    const validSettings = {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'test@example.com',
      password: 'password',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux',
      use_tls: true,
      app_domain: 'https://app.example.com',
    };

    it('should update SMTP settings successfully', async () => {
      const result = await client.updateSMTPSettings('test-tenant', validSettings);
      
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        status: 'success',
        message: 'SMTP settings updated successfully',
      });
    });

    it('should handle validation errors', async () => {
      const invalidSettings = { ...validSettings, host: '' };
      const result = await client.updateSMTPSettings('validation-error', invalidSettings);
      
      expect(result.status).toBe(400);
      expect(result.error).toBe('SMTP settings are incomplete');
    });

    it('should allow disabling SMTP', async () => {
      const disabledSettings = { ...validSettings, enabled: false };
      const result = await client.updateSMTPSettings('test-tenant', disabledSettings);
      
      expect(result.status).toBe(200);
      expect(result.data?.status).toBe('success');
    });
  });

  describe('testSMTPSettings', () => {
    const testConfig = {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'test@example.com',
      password: 'password',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux',
      use_tls: true,
      app_domain: 'https://app.example.com',
    };

    it('should send test email successfully', async () => {
      const result = await client.testSMTPSettings('test-tenant', 'test@example.com', testConfig);
      
      expect(result.status).toBe(200);
      expect(result.data).toEqual({
        status: 'success',
        message: 'Test email sent successfully',
      });
    });

    it('should handle missing email', async () => {
      const result = await client.testSMTPSettings('test-tenant', '', testConfig);
      
      expect(result.status).toBe(400);
      expect(result.error).toBe('Email is required');
    });

    it('should handle SMTP authentication errors', async () => {
      const result = await client.testSMTPSettings('smtp-auth-error', 'test@example.com', testConfig);
      
      expect(result.status).toBe(500);
      expect(result.error).toContain('authentication failed');
    });

    it('should handle SMTP host errors', async () => {
      const result = await client.testSMTPSettings('smtp-host-error', 'test@example.com', testConfig);
      
      expect(result.status).toBe(500);
      expect(result.error).toContain('no such host');
    });
  });
});
```

### Teste do Hook Custom

```typescript
// src/hooks/__tests__/useSMTPSettings.test.ts
import { renderHook, act, waitFor } from '@testing-library/react';
import { useSMTPSettings } from '../useSMTPSettings';

describe('useSMTPSettings', () => {
  const tenantId = 'test-tenant';
  const authToken = 'test-token';

  it('should load settings on mount', async () => {
    const { result } = renderHook(() => useSMTPSettings(tenantId, authToken));

    expect(result.current.loading).toBe(true);
    expect(result.current.settings).toBe(null);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.settings).toEqual({
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'test@example.com',
      password: '********',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux',
      use_tls: true,
      app_domain: 'https://app.example.com',
    });
  });

  it('should handle loading errors', async () => {
    const { result } = renderHook(() => useSMTPSettings('unauthorized', authToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('Unauthorized');
    expect(result.current.settings).toBe(null);
  });

  it('should update settings successfully', async () => {
    const { result } = renderHook(() => useSMTPSettings(tenantId, authToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const newSettings = {
      enabled: true,
      host: 'smtp.sendgrid.net',
      port: 587,
      username: 'apikey',
      password: 'secret',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux',
      use_tls: true,
      app_domain: 'https://app.example.com',
    };

    let updateResult: boolean;
    await act(async () => {
      updateResult = await result.current.updateSettings(newSettings);
    });

    expect(updateResult!).toBe(true);
    expect(result.current.settings).toEqual(newSettings);
  });

  it('should handle update errors', async () => {
    const { result } = renderHook(() => useSMTPSettings('validation-error', authToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    const invalidSettings = {
      enabled: true,
      host: '',
      port: 587,
      username: '',
      password: '',
      from_email: '',
      from_name: '',
      use_tls: true,
      app_domain: '',
    };

    let updateResult: boolean;
    await act(async () => {
      updateResult = await result.current.updateSettings(invalidSettings);
    });

    expect(updateResult!).toBe(false);
    expect(result.current.error).toBe('SMTP settings are incomplete');
  });

  it('should test settings successfully', async () => {
    const { result } = renderHook(() => useSMTPSettings(tenantId, authToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let testResult: boolean;
    await act(async () => {
      testResult = await result.current.testSettings('test@example.com');
    });

    expect(testResult!).toBe(true);
  });

  it('should handle test errors', async () => {
    const { result } = renderHook(() => useSMTPSettings('smtp-auth-error', authToken));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    let testResult: boolean;
    await act(async () => {
      testResult = await result.current.testSettings('test@example.com');
    });

    expect(testResult!).toBe(false);
    expect(result.current.error).toContain('authentication failed');
  });
});
```

## Testes de Integração

### Teste do Componente Completo

```typescript
// src/components/__tests__/SMTPSettingsForm.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SMTPSettingsForm } from '../SMTPSettingsForm';

describe('SMTPSettingsForm', () => {
  const defaultProps = {
    tenantId: 'test-tenant',
    authToken: 'test-token',
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render form with initial state', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    expect(screen.getByText('Configurações SMTP')).toBeInTheDocument();
    expect(screen.getByLabelText('Habilitar SMTP')).toBeInTheDocument();

    // Aguardar carregamento das configurações
    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    });
  });

  it('should load and display existing settings', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('587')).toBeInTheDocument();
      expect(screen.getByDisplayValue('test@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('noreply@example.com')).toBeInTheDocument();
      expect(screen.getByDisplayValue('VeloFlux')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Habilitar SMTP')).toBeChecked();
    expect(screen.getByLabelText('Usar TLS (Recomendado)')).toBeChecked();
  });

  it('should show/hide fields based on enabled state', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Host SMTP *')).toBeInTheDocument();
    });

    // Desabilitar SMTP
    const enableCheckbox = screen.getByLabelText('Habilitar SMTP');
    await userEvent.click(enableCheckbox);

    expect(screen.queryByLabelText('Host SMTP *')).not.toBeInTheDocument();
  });

  it('should update form fields', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    });

    const hostInput = screen.getByLabelText('Host SMTP *');
    await userEvent.clear(hostInput);
    await userEvent.type(hostInput, 'smtp.sendgrid.net');

    expect(screen.getByDisplayValue('smtp.sendgrid.net')).toBeInTheDocument();
  });

  it('should submit form successfully', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Salvar Configurações');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Configurações SMTP atualizadas com sucesso!')).toBeInTheDocument();
    });
  });

  it('should handle validation errors', async () => {
    render(<SMTPSettingsForm tenantId="validation-error" authToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Salvar Configurações')).toBeInTheDocument();
    });

    const submitButton = screen.getByText('Salvar Configurações');
    await userEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('SMTP settings are incomplete')).toBeInTheDocument();
    });
  });

  it('should test SMTP settings', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('smtp.gmail.com')).toBeInTheDocument();
    });

    const testEmailInput = screen.getByLabelText('Email para teste:');
    await userEvent.type(testEmailInput, 'test@example.com');

    const testButton = screen.getByText('Enviar Email de Teste');
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText('Email de teste enviado com sucesso!')).toBeInTheDocument();
    });
  });

  it('should handle SMTP test errors', async () => {
    render(<SMTPSettingsForm tenantId="smtp-auth-error" authToken="test-token" />);

    await waitFor(() => {
      expect(screen.getByText('Enviar Email de Teste')).toBeInTheDocument();
    });

    const testEmailInput = screen.getByLabelText('Email para teste:');
    await userEvent.type(testEmailInput, 'test@example.com');

    const testButton = screen.getByText('Enviar Email de Teste');
    await userEvent.click(testButton);

    await waitFor(() => {
      expect(screen.getByText(/authentication failed/)).toBeInTheDocument();
    });
  });

  it('should require email for testing', async () => {
    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText('Enviar Email de Teste')).toBeInTheDocument();
    });

    const testButton = screen.getByText('Enviar Email de Teste');
    expect(testButton).toBeDisabled();

    const testEmailInput = screen.getByLabelText('Email para teste:');
    await userEvent.type(testEmailInput, 'test@example.com');

    expect(testButton).toBeEnabled();
  });

  it('should handle unauthorized access', async () => {
    render(<SMTPSettingsForm tenantId="unauthorized" authToken="invalid-token" />);

    await waitFor(() => {
      expect(screen.getByText('Unauthorized')).toBeInTheDocument();
    });
  });

  it('should handle network errors', async () => {
    // Mock fetch para simular erro de rede
    const originalFetch = global.fetch;
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    render(<SMTPSettingsForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText(/Network error|Erro de rede/)).toBeInTheDocument();
    });

    global.fetch = originalFetch;
  });
});
```

## Testes de Performance

```typescript
// src/performance/__tests__/SMTPPerformance.test.ts
import { performance } from 'perf_hooks';
import { VeloFluxSMTPClient } from '../api/SMTPClient';

describe('SMTP Performance Tests', () => {
  const client = new VeloFluxSMTPClient('https://api.veloflux.io', 'test-token');

  it('should load settings within acceptable time', async () => {
    const start = performance.now();
    
    await client.getSMTPSettings('test-tenant');
    
    const end = performance.now();
    const duration = end - start;
    
    expect(duration).toBeLessThan(2000); // 2 segundos
  });

  it('should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, (_, i) => 
      client.getSMTPSettings(`tenant-${i}`)
    );

    const start = performance.now();
    const results = await Promise.all(promises);
    const end = performance.now();

    expect(results).toHaveLength(10);
    expect(end - start).toBeLessThan(5000); // 5 segundos para 10 requests
  });

  it('should not cause memory leaks with repeated calls', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Executar 100 chamadas
    for (let i = 0; i < 100; i++) {
      await client.getSMTPSettings('test-tenant');
    }

    // Forçar garbage collection se disponível
    if (global.gc) {
      global.gc();
    }

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    // Memória não deve aumentar significativamente
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## Testes E2E com Cypress

```typescript
// cypress/integration/smtp-settings.spec.ts
describe('SMTP Settings', () => {
  beforeEach(() => {
    cy.login('admin@example.com', 'password');
    cy.visit('/admin/smtp-settings');
  });

  it('should display current SMTP settings', () => {
    cy.get('[data-testid=smtp-enabled]').should('be.checked');
    cy.get('[data-testid=smtp-host]').should('have.value', 'smtp.gmail.com');
    cy.get('[data-testid=smtp-port]').should('have.value', '587');
  });

  it('should update SMTP settings', () => {
    cy.get('[data-testid=smtp-host]').clear().type('smtp.sendgrid.net');
    cy.get('[data-testid=smtp-username]').clear().type('apikey');
    cy.get('[data-testid=smtp-password]').clear().type('new-password');
    
    cy.get('[data-testid=save-button]').click();
    
    cy.get('[data-testid=success-message]')
      .should('contain', 'Configurações SMTP atualizadas com sucesso!');
  });

  it('should test SMTP configuration', () => {
    cy.get('[data-testid=test-email]').type('test@example.com');
    cy.get('[data-testid=test-button]').click();
    
    cy.get('[data-testid=success-message]')
      .should('contain', 'Email de teste enviado com sucesso!');
  });

  it('should show validation errors', () => {
    cy.get('[data-testid=smtp-host]').clear();
    cy.get('[data-testid=save-button]').click();
    
    cy.get('[data-testid=error-message]')
      .should('contain', 'SMTP settings are incomplete');
  });

  it('should disable/enable SMTP', () => {
    cy.get('[data-testid=smtp-enabled]').uncheck();
    
    cy.get('[data-testid=smtp-host]').should('not.exist');
    cy.get('[data-testid=smtp-port]').should('not.exist');
    
    cy.get('[data-testid=save-button]').click();
    
    cy.get('[data-testid=success-message]')
      .should('contain', 'Configurações SMTP atualizadas com sucesso!');
  });
});
```

## Scripts de Teste

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:integration": "jest --testPathPattern=integration",
    "test:unit": "jest --testPathPattern=__tests__",
    "test:performance": "jest --testPathPattern=performance"
  }
}
```

## Coverage Report

```javascript
// jest.config.js - configuração de coverage
module.exports = {
  // ... outras configurações
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/mocks/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
    './src/api/': {
      branches: 90,
      functions: 90,
      lines: 90,
      statements: 90,
    },
    './src/hooks/': {
      branches: 85,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
```

## Execução dos Testes

```bash
# Executar todos os testes
npm test

# Executar testes com coverage
npm run test:coverage

# Executar testes em modo watch
npm run test:watch

# Executar apenas testes unitários
npm run test:unit

# Executar testes E2E
npm run test:e2e

# Executar testes de performance
npm run test:performance
```

Os testes cobrem todos os aspectos da integração com a API SMTP, incluindo cenários de sucesso, erros, validações e performance. Isso garante que o frontend funcione corretamente em todas as situações possíveis.
