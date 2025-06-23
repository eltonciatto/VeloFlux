# Testes da API de Billing - Frontend

## Visão Geral

Este guia demonstra como criar testes abrangentes para consumidores frontend da API de Billing, incluindo testes unitários, testes de integração e testes end-to-end.

## Configuração de Testes

### Dependências de Teste

```json
{
  "devDependencies": {
    "@testing-library/react": "^13.4.0",
    "@testing-library/jest-dom": "^5.16.5",
    "@testing-library/user-event": "^14.4.3",
    "jest": "^29.5.0",
    "jest-environment-jsdom": "^29.5.0",
    "msw": "^1.2.1",
    "vitest": "^0.32.0",
    "@vitest/ui": "^0.32.0",
    "happy-dom": "^10.0.0",
    "cypress": "^12.17.0"
  }
}
```

### Configuração do Jest

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1'
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/main.tsx',
    '!src/vite-env.d.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Setup de Testes

```typescript
// src/setupTests.ts
import '@testing-library/jest-dom'
import { server } from './mocks/server'

// Configurar MSW
beforeAll(() => server.listen())
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

// Mock global objects
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: jest.fn(() => 'mocked-url'),
    revokeObjectURL: jest.fn()
  }
})

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn()
}
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})
```

## Mocks com MSW (Mock Service Worker)

### Configuração do MSW

```typescript
// src/mocks/handlers.ts
import { rest } from 'msw'
import type { 
  TenantBillingInfo, 
  Subscription, 
  Invoice, 
  Plan,
  UsageData,
  Notification 
} from '@/types/billing'

const API_BASE_URL = 'https://api.veloflux.io/billing'

// Mock data
const mockBillingInfo: TenantBillingInfo = {
  tenant_id: 'tenant_123',
  status: 'active',
  subscription: {
    id: 'sub_123',
    tenant_id: 'tenant_123',
    plan_type: 'pro',
    status: 'active',
    billing_cycle: 'monthly',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-02-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  plan: {
    id: 'plan_pro',
    name: 'Pro',
    type: 'pro',
    description: 'Plano profissional',
    features: ['Feature 1', 'Feature 2'],
    limits: {
      requests: 100000,
      bandwidth_gb: 100,
      storage_gb: 50,
      compute_hours: 100,
      api_calls: 50000
    },
    pricing: {
      monthly: { amount: 2999, currency: 'USD' },
      yearly: { amount: 29999, currency: 'USD' }
    },
    is_active: true
  },
  current_usage: {
    tenant_id: 'tenant_123',
    resource: 'requests',
    total_usage: 45000,
    plan_limit: 100000,
    usage_percentage: 45,
    start_date: '2024-01-01',
    end_date: '2024-01-31',
    usage: {}
  },
  next_billing_date: '2024-02-01T00:00:00Z'
}

const mockInvoices: Invoice[] = [
  {
    id: 'inv_123',
    subscription_id: 'sub_123',
    tenant_id: 'tenant_123',
    invoice_number: 'INV-2024-001',
    status: 'paid',
    amount_due: 2999,
    amount_paid: 2999,
    currency: 'USD',
    due_date: '2024-02-01T00:00:00Z',
    paid_at: '2024-01-30T00:00:00Z',
    line_items: [],
    created_at: '2024-01-01T00:00:00Z'
  }
]

const mockPlans: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    type: 'free',
    description: 'Plano gratuito',
    features: ['Basic features'],
    limits: {
      requests: 1000,
      bandwidth_gb: 1,
      storage_gb: 1,
      compute_hours: 10,
      api_calls: 1000
    },
    pricing: {
      monthly: { amount: 0, currency: 'USD' },
      yearly: { amount: 0, currency: 'USD' }
    },
    is_active: true
  },
  {
    id: 'plan_pro',
    name: 'Pro',
    type: 'pro',
    description: 'Plano profissional',
    features: ['Advanced features'],
    limits: {
      requests: 100000,
      bandwidth_gb: 100,
      storage_gb: 50,
      compute_hours: 100,
      api_calls: 50000
    },
    pricing: {
      monthly: { amount: 2999, currency: 'USD' },
      yearly: { amount: 29999, currency: 'USD' }
    },
    is_active: true
  }
]

export const handlers = [
  // Get tenant billing info
  rest.get(`${API_BASE_URL}/tenant/:tenantId/billing`, (req, res, ctx) => {
    const { tenantId } = req.params
    
    if (tenantId === 'error_tenant') {
      return res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
    }
    
    if (tenantId === 'not_found_tenant') {
      return res(ctx.status(404), ctx.json({ error: 'Tenant not found' }))
    }
    
    return res(ctx.json(mockBillingInfo))
  }),

  // Get tenant usage
  rest.get(`${API_BASE_URL}/tenant/:tenantId/usage`, (req, res, ctx) => {
    const resource = req.url.searchParams.get('resource') || 'requests'
    
    const usageData: UsageData = {
      tenant_id: 'tenant_123',
      resource,
      total_usage: 45000,
      plan_limit: 100000,
      usage_percentage: 45,
      start_date: '2024-01-01',
      end_date: '2024-01-31',
      usage: {
        '2024-01-01': 1500,
        '2024-01-02': 1600,
        '2024-01-03': 1400
      }
    }
    
    return res(ctx.json(usageData))
  }),

  // Create checkout session
  rest.post(`${API_BASE_URL}/tenant/:tenantId/checkout`, (req, res, ctx) => {
    return res(ctx.json({
      checkout_url: 'https://checkout.stripe.com/session_123',
      session_id: 'session_123',
      expires_at: '2024-01-01T01:00:00Z'
    }))
  }),

  // Get invoices
  rest.get(`${API_BASE_URL}/invoices`, (req, res, ctx) => {
    const tenantId = req.url.searchParams.get('tenant_id')
    const limit = req.url.searchParams.get('limit')
    
    let filteredInvoices = mockInvoices
    
    if (tenantId) {
      filteredInvoices = mockInvoices.filter(inv => inv.tenant_id === tenantId)
    }
    
    if (limit) {
      filteredInvoices = filteredInvoices.slice(0, parseInt(limit))
    }
    
    return res(ctx.json(filteredInvoices))
  }),

  // Download invoice
  rest.get(`${API_BASE_URL}/invoices/:invoiceId/download`, (req, res, ctx) => {
    const { invoiceId } = req.params
    
    const pdfContent = new Blob(['Mock PDF content'], { type: 'application/pdf' })
    
    return res(
      ctx.set('Content-Type', 'application/pdf'),
      ctx.set('Content-Disposition', `attachment; filename=invoice_${invoiceId}.pdf`),
      ctx.body(pdfContent)
    )
  }),

  // Get plans
  rest.get(`${API_BASE_URL}/plans`, (req, res, ctx) => {
    return res(ctx.json({ plans: mockPlans }))
  }),

  // Update subscription
  rest.put(`${API_BASE_URL}/subscriptions/:subscriptionId`, (req, res, ctx) => {
    const { subscriptionId } = req.params
    
    return res(ctx.json({
      ...mockBillingInfo.subscription,
      id: subscriptionId,
      updated_at: new Date().toISOString()
    }))
  }),

  // Get notifications
  rest.get(`${API_BASE_URL}/notifications`, (req, res, ctx) => {
    const notifications: Notification[] = [
      {
        id: 'notif_1',
        type: 'payment_success',
        title: 'Pagamento processado',
        message: 'Seu pagamento foi processado com sucesso',
        read: false,
        timestamp: '2024-01-01T00:00:00Z',
        priority: 'normal',
        created_at: '2024-01-01T00:00:00Z'
      }
    ]
    
    return res(ctx.json(notifications))
  }),

  // Mark notification as read
  rest.post(`${API_BASE_URL}/notifications/:notificationId/read`, (req, res, ctx) => {
    return res(ctx.json({ success: true }))
  }),

  // Error handlers
  rest.get(`${API_BASE_URL}/error`, (req, res, ctx) => {
    return res(ctx.status(500), ctx.json({ error: 'Internal server error' }))
  })
]
```

```typescript
// src/mocks/server.ts
import { setupServer } from 'msw/node'
import { handlers } from './handlers'

export const server = setupServer(...handlers)
```

## Testes Unitários

### Testes do Cliente API

```typescript
// src/services/__tests__/billingService.test.ts
import { billingService } from '../billingService'
import { BillingAPIError } from '../types'
import { server } from '../../mocks/server'
import { rest } from 'msw'

describe('BillingService', () => {
  beforeEach(() => {
    billingService.setAuthToken('test-token')
  })

  describe('getTenantBilling', () => {
    it('should fetch tenant billing info successfully', async () => {
      const billingInfo = await billingService.getTenantBilling('tenant_123')
      
      expect(billingInfo).toMatchObject({
        tenant_id: 'tenant_123',
        status: 'active',
        subscription: expect.objectContaining({
          id: 'sub_123',
          plan_type: 'pro'
        })
      })
    })

    it('should handle 404 errors', async () => {
      await expect(
        billingService.getTenantBilling('not_found_tenant')
      ).rejects.toThrow(BillingAPIError)
    })

    it('should handle 500 errors', async () => {
      await expect(
        billingService.getTenantBilling('error_tenant')
      ).rejects.toThrow(BillingAPIError)
    })

    it('should handle network errors', async () => {
      server.use(
        rest.get('*/tenant/tenant_123/billing', (req, res, ctx) => {
          return res.networkError('Failed to connect')
        })
      )

      await expect(
        billingService.getTenantBilling('tenant_123')
      ).rejects.toThrow(BillingAPIError)
    })
  })

  describe('getTenantUsage', () => {
    it('should fetch usage data with filters', async () => {
      const usage = await billingService.getTenantUsage('tenant_123', {
        resource: 'bandwidth_gb',
        start_date: '2024-01-01',
        end_date: '2024-01-31'
      })

      expect(usage).toMatchObject({
        tenant_id: 'tenant_123',
        resource: 'bandwidth_gb',
        total_usage: 45000,
        plan_limit: 100000
      })
    })
  })

  describe('createCheckoutSession', () => {
    it('should create checkout session successfully', async () => {
      const response = await billingService.createCheckoutSession('tenant_123', {
        plan_type: 'pro',
        is_yearly: false
      })

      expect(response).toMatchObject({
        checkout_url: expect.stringContaining('checkout.stripe.com'),
        session_id: 'session_123'
      })
    })
  })

  describe('downloadInvoice', () => {
    it('should download invoice as blob', async () => {
      const blob = await billingService.downloadInvoice('inv_123')
      
      expect(blob).toBeInstanceOf(Blob)
      expect(blob.type).toBe('application/pdf')
    })
  })
})
```

### Testes de Hooks React

```typescript
// src/hooks/__tests__/useBilling.test.ts
import { renderHook, waitFor } from '@testing-library/react'
import { useBilling } from '../useBilling'

describe('useBilling', () => {
  it('should fetch billing info on mount', async () => {
    const { result } = renderHook(() => useBilling('tenant_123'))

    expect(result.current.loading).toBe(true)
    expect(result.current.billingInfo).toBe(null)

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.billingInfo).toMatchObject({
      tenant_id: 'tenant_123',
      status: 'active'
    })
    expect(result.current.error).toBe(null)
  })

  it('should handle errors correctly', async () => {
    const { result } = renderHook(() => useBilling('error_tenant'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.error).toBeTruthy()
    expect(result.current.billingInfo).toBe(null)
  })

  it('should refresh billing info', async () => {
    const { result } = renderHook(() => useBilling('tenant_123'))

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Trigger refresh
    await result.current.refreshBilling()

    expect(result.current.billingInfo).toMatchObject({
      tenant_id: 'tenant_123'
    })
  })

  it('should clear errors', async () => {
    const { result } = renderHook(() => useBilling('error_tenant'))

    await waitFor(() => {
      expect(result.current.error).toBeTruthy()
    })

    result.current.clearError()

    expect(result.current.error).toBe(null)
  })
})
```

### Testes de Stores Vue (Pinia)

```typescript
// src/stores/__tests__/billing.test.ts
import { setActivePinia, createPinia } from 'pinia'
import { useBillingStore } from '../billing'

describe('Billing Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should fetch billing info', async () => {
    const store = useBillingStore()
    
    expect(store.loading).toBe(false)
    expect(store.billingInfo).toBe(null)

    await store.fetchBillingInfo('tenant_123')

    expect(store.loading).toBe(false)
    expect(store.billingInfo).toMatchObject({
      tenant_id: 'tenant_123',
      status: 'active'
    })
  })

  it('should handle errors', async () => {
    const store = useBillingStore()

    await expect(
      store.fetchBillingInfo('error_tenant')
    ).rejects.toThrow()

    expect(store.error).toBeTruthy()
  })

  it('should calculate usage percentage correctly', async () => {
    const store = useBillingStore()
    
    await store.fetchBillingInfo('tenant_123')
    await store.fetchUsage('tenant_123')

    expect(store.usagePercentage).toBe(45)
    expect(store.isNearLimit).toBe(false)
  })

  it('should mark notifications as read', async () => {
    const store = useBillingStore()
    
    await store.fetchNotifications()
    
    const unreadBefore = store.unreadCount
    expect(unreadBefore).toBeGreaterThan(0)

    await store.markNotificationAsRead('notif_1')

    expect(store.unreadCount).toBe(unreadBefore - 1)
  })
})
```

## Testes de Componentes

### Testes de Componentes React

```typescript
// src/components/__tests__/BillingDashboard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BillingDashboard } from '../BillingDashboard'

describe('BillingDashboard', () => {
  it('should render dashboard with billing info', async () => {
    render(<BillingDashboard tenantId="tenant_123" />)

    expect(screen.getByText('Billing Dashboard')).toBeInTheDocument()
    expect(screen.getByText('Carregando...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Assinatura Atual')).toBeInTheDocument()
    })

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('should handle refresh button', async () => {
    const user = userEvent.setup()
    render(<BillingDashboard tenantId="tenant_123" />)

    await waitFor(() => {
      expect(screen.getByText('Atualizar')).toBeInTheDocument()
    })

    const refreshButton = screen.getByText('Atualizar')
    await user.click(refreshButton)

    expect(screen.getByText('Carregando...')).toBeInTheDocument()
  })

  it('should display error state', async () => {
    render(<BillingDashboard tenantId="error_tenant" />)

    await waitFor(() => {
      expect(screen.getByText(/erro/i)).toBeInTheDocument()
    })
  })
})
```

```typescript
// src/components/__tests__/SubscriptionCard.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SubscriptionCard } from '../SubscriptionCard'

const mockBillingInfo = {
  tenant_id: 'tenant_123',
  status: 'active',
  subscription: {
    id: 'sub_123',
    tenant_id: 'tenant_123',
    plan_type: 'pro',
    status: 'active',
    billing_cycle: 'monthly',
    current_period_start: '2024-01-01T00:00:00Z',
    current_period_end: '2024-02-01T00:00:00Z',
    created_at: '2024-01-01T00:00:00Z'
  },
  plan: {
    id: 'plan_pro',
    name: 'Pro',
    type: 'pro',
    description: 'Plano profissional',
    features: [],
    limits: {},
    pricing: {},
    is_active: true
  }
}

describe('SubscriptionCard', () => {
  it('should display subscription info', () => {
    render(
      <SubscriptionCard 
        billingInfo={mockBillingInfo} 
        tenantId="tenant_123" 
      />
    )

    expect(screen.getByText('Assinatura Atual')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Mensal')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
  })

  it('should open plan selector on upgrade click', async () => {
    const user = userEvent.setup()
    
    render(
      <SubscriptionCard 
        billingInfo={mockBillingInfo} 
        tenantId="tenant_123" 
      />
    )

    const upgradeButton = screen.getByText('Alterar Plano')
    await user.click(upgradeButton)

    await waitFor(() => {
      expect(screen.getByText('Escolher Plano')).toBeInTheDocument()
    })
  })

  it('should display no subscription state', () => {
    render(
      <SubscriptionCard 
        billingInfo={{ ...mockBillingInfo, subscription: null }} 
        tenantId="tenant_123" 
      />
    )

    expect(screen.getByText('Você não possui uma assinatura ativa')).toBeInTheDocument()
    expect(screen.getByText('Escolher Plano')).toBeInTheDocument()
  })
})
```

### Testes de Componentes Vue

```typescript
// src/components/__tests__/BillingDashboard.test.ts
import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import BillingDashboard from '../BillingDashboard.vue'

describe('BillingDashboard', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })

  it('should render dashboard', async () => {
    const wrapper = mount(BillingDashboard, {
      props: {
        tenantId: 'tenant_123'
      },
      global: {
        plugins: [createPinia()]
      }
    })

    expect(wrapper.text()).toContain('Billing Dashboard')
    
    await wrapper.vm.$nextTick()
    
    expect(wrapper.find('[data-testid="loading-spinner"]').exists()).toBe(true)
  })

  it('should handle refresh action', async () => {
    const wrapper = mount(BillingDashboard, {
      props: {
        tenantId: 'tenant_123'
      },
      global: {
        plugins: [createPinia()]
      }
    })

    const refreshButton = wrapper.find('button')
    await refreshButton.trigger('click')

    expect(wrapper.emitted()).toHaveProperty('refresh')
  })
})
```

## Testes de Integração

### Testes de Fluxo Completo

```typescript
// src/__tests__/integration/billing-flow.test.tsx
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BillingApp } from '../BillingApp'

describe('Billing Integration Flow', () => {
  it('should complete full upgrade flow', async () => {
    const user = userEvent.setup()
    
    render(<BillingApp tenantId="tenant_123" />)

    // Wait for dashboard to load
    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument()
    })

    // Click upgrade button
    const upgradeButton = screen.getByText('Alterar Plano')
    await user.click(upgradeButton)

    // Plan selector should open
    await waitFor(() => {
      expect(screen.getByText('Escolher Plano')).toBeInTheDocument()
    })

    // Select enterprise plan
    const enterpriseButton = screen.getByText('Escolher Plano')
    await user.click(enterpriseButton)

    // Should redirect to checkout (mocked)
    await waitFor(() => {
      expect(window.location.href).toContain('checkout.stripe.com')
    })
  })

  it('should download invoice successfully', async () => {
    const user = userEvent.setup()
    
    render(<BillingApp tenantId="tenant_123" />)

    // Wait for invoices to load
    await waitFor(() => {
      expect(screen.getByText('Faturas Recentes')).toBeInTheDocument()
    })

    // Click download button
    const downloadButton = screen.getByText('Baixar PDF')
    await user.click(downloadButton)

    // Should trigger download (mocked)
    expect(URL.createObjectURL).toHaveBeenCalled()
  })

  it('should handle usage export', async () => {
    const user = userEvent.setup()
    
    render(<BillingApp tenantId="tenant_123" />)

    // Wait for usage chart to load
    await waitFor(() => {
      expect(screen.getByText('Uso de Recursos')).toBeInTheDocument()
    })

    // Click export button
    const exportButton = screen.getByText('Exportar')
    await user.click(exportButton)

    // Should trigger export (mocked)
    expect(URL.createObjectURL).toHaveBeenCalled()
  })
})
```

## Testes End-to-End com Cypress

### Configuração do Cypress

```typescript
// cypress.config.ts
import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    setupNodeEvents(on, config) {
      // Setup tasks here
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
  },
})
```

### Testes E2E do Billing

```typescript
// cypress/e2e/billing.cy.ts
describe('Billing Dashboard E2E', () => {
  beforeEach(() => {
    // Mock authentication
    cy.window().then((win) => {
      win.localStorage.setItem('auth_token', 'test-token')
    })
    
    // Intercept API calls
    cy.intercept('GET', '**/tenant/*/billing', { fixture: 'billing-info.json' }).as('getBillingInfo')
    cy.intercept('GET', '**/tenant/*/usage', { fixture: 'usage-data.json' }).as('getUsage')
    cy.intercept('GET', '**/invoices*', { fixture: 'invoices.json' }).as('getInvoices')
    cy.intercept('GET', '**/plans', { fixture: 'plans.json' }).as('getPlans')
    
    cy.visit('/billing')
  })

  it('should display billing dashboard', () => {
    cy.wait('@getBillingInfo')
    
    cy.contains('Billing Dashboard').should('be.visible')
    cy.contains('Assinatura Atual').should('be.visible')
    cy.contains('Pro').should('be.visible')
    cy.contains('Ativo').should('be.visible')
  })

  it('should show usage chart', () => {
    cy.wait('@getUsage')
    
    cy.contains('Uso de Recursos').should('be.visible')
    cy.get('[data-testid="usage-progress-bar"]').should('be.visible')
    cy.get('select').should('contain.value', 'requests')
  })

  it('should display recent invoices', () => {
    cy.wait('@getInvoices')
    
    cy.contains('Faturas Recentes').should('be.visible')
    cy.get('[data-testid="invoice-item"]').should('have.length.at.least', 1)
    cy.contains('Baixar PDF').should('be.visible')
  })

  it('should open plan selector', () => {
    cy.wait('@getBillingInfo')
    
    cy.contains('Alterar Plano').click()
    
    cy.wait('@getPlans')
    cy.contains('Escolher Plano').should('be.visible')
    cy.get('[data-testid="plan-card"]').should('have.length.at.least', 2)
  })

  it('should create checkout session', () => {
    cy.intercept('POST', '**/tenant/*/checkout', {
      checkout_url: 'https://checkout.stripe.com/session_123'
    }).as('createCheckout')
    
    cy.contains('Alterar Plano').click()
    cy.wait('@getPlans')
    
    cy.get('[data-testid="plan-card"]').first().find('button').click()
    
    cy.wait('@createCheckout')
    cy.url().should('include', 'checkout.stripe.com')
  })

  it('should export usage data', () => {
    cy.wait('@getUsage')
    
    cy.contains('Exportar').click()
    
    // Verify download was triggered
    cy.readFile('cypress/downloads').should('exist')
  })

  it('should handle notifications', () => {
    cy.intercept('GET', '**/notifications*', { fixture: 'notifications.json' }).as('getNotifications')
    
    cy.wait('@getNotifications')
    
    cy.contains('Notificações').should('be.visible')
    cy.get('[data-testid="notification-badge"]').should('contain', '3')
    
    cy.contains('Marcar todas como lidas').click()
    
    cy.intercept('POST', '**/notifications/*/read', { success: true }).as('markAsRead')
    cy.wait('@markAsRead')
    
    cy.get('[data-testid="notification-badge"]').should('not.exist')
  })

  it('should handle errors gracefully', () => {
    cy.intercept('GET', '**/tenant/*/billing', { statusCode: 500 }).as('getBillingError')
    
    cy.visit('/billing')
    cy.wait('@getBillingError')
    
    cy.contains('Erro ao carregar').should('be.visible')
    cy.contains('Tentar novamente').click()
    
    cy.intercept('GET', '**/tenant/*/billing', { fixture: 'billing-info.json' }).as('getBillingRetry')
    cy.wait('@getBillingRetry')
    
    cy.contains('Pro').should('be.visible')
  })
})
```

### Fixtures para Testes

```json
// cypress/fixtures/billing-info.json
{
  "tenant_id": "tenant_123",
  "status": "active",
  "subscription": {
    "id": "sub_123",
    "tenant_id": "tenant_123",
    "plan_type": "pro",
    "status": "active",
    "billing_cycle": "monthly",
    "current_period_start": "2024-01-01T00:00:00Z",
    "current_period_end": "2024-02-01T00:00:00Z",
    "created_at": "2024-01-01T00:00:00Z"
  },
  "plan": {
    "id": "plan_pro",
    "name": "Pro",
    "type": "pro",
    "description": "Plano profissional",
    "features": ["Feature 1", "Feature 2"],
    "limits": {
      "requests": 100000,
      "bandwidth_gb": 100,
      "storage_gb": 50,
      "compute_hours": 100,
      "api_calls": 50000
    },
    "pricing": {
      "monthly": { "amount": 2999, "currency": "USD" },
      "yearly": { "amount": 29999, "currency": "USD" }
    },
    "is_active": true
  },
  "current_usage": {
    "tenant_id": "tenant_123",
    "resource": "requests",
    "total_usage": 45000,
    "plan_limit": 100000,
    "usage_percentage": 45,
    "start_date": "2024-01-01",
    "end_date": "2024-01-31",
    "usage": {}
  },
  "next_billing_date": "2024-02-01T00:00:00Z"
}
```

## Testes de Performance

### Testes de Carga com Artillery

```yaml
# artillery.yml
config:
  target: 'http://localhost:3000'
  phases:
    - duration: 60
      arrivalRate: 10
  defaults:
    headers:
      Authorization: 'Bearer test-token'

scenarios:
  - name: 'Billing Dashboard Load Test'
    flow:
      - get:
          url: '/billing'
      - think: 2
      - get:
          url: '/api/billing/tenant/tenant_123/billing'
      - think: 1
      - get:
          url: '/api/billing/tenant/tenant_123/usage'
      - think: 1
      - get:
          url: '/api/billing/invoices?tenant_id=tenant_123'
```

### Testes de Acessibilidade

```typescript
// src/__tests__/accessibility/billing.test.ts
import { render } from '@testing-library/react'
import { axe, toHaveNoViolations } from 'jest-axe'
import { BillingDashboard } from '../components/BillingDashboard'

expect.extend(toHaveNoViolations)

describe('Billing Accessibility', () => {
  it('should not have accessibility violations', async () => {
    const { container } = render(<BillingDashboard tenantId="tenant_123" />)
    
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })

  it('should have proper keyboard navigation', async () => {
    render(<BillingDashboard tenantId="tenant_123" />)
    
    // Test tab navigation
    const focusableElements = screen.getAllByRole('button')
    focusableElements.forEach(element => {
      expect(element).toHaveAttribute('tabindex')
    })
  })
})
```

## Relatórios de Cobertura

### Script de Cobertura

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "cypress run",
    "test:e2e:open": "cypress open",
    "test:all": "npm run test:coverage && npm run test:e2e"
  }
}
```

### Configuração de CI/CD

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run unit tests
        run: npm run test:coverage
      
      - name: Run E2E tests
        run: npm run test:e2e
        
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
```

Este guia abrangente de testes garante que toda a integração frontend com a API de Billing seja robusta, confiável e bem testada em todos os níveis.
