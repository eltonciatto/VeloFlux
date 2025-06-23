# TypeScript Types e Interfaces - Billing API

## Visão Geral

Este arquivo define todos os tipos TypeScript para consumir a API de Billing do VeloFlux, garantindo type safety e melhor experiência de desenvolvimento.

## Instalação

```bash
npm install --save-dev typescript @types/node
```

## Types Principais

### Enums

```typescript
// Tipos de planos disponíveis
export enum PlanType {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise'
}

// Status de assinatura
export enum SubscriptionStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  TRIALING = 'trialing'
}

// Status de fatura
export enum InvoiceStatus {
  DRAFT = 'draft',
  OPEN = 'open',
  PAID = 'paid',
  UNCOLLECTIBLE = 'uncollectible',
  VOID = 'void'
}

// Formatos de exportação
export enum ExportFormat {
  JSON = 'json',
  CSV = 'csv',
  PDF = 'pdf',
  XLSX = 'xlsx'
}

// Tipos de notificação
export enum NotificationType {
  PAYMENT_SUCCESS = 'payment_success',
  PAYMENT_FAILED = 'payment_failed',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  USAGE_ALERT = 'usage_alert',
  INVOICE_CREATED = 'invoice_created'
}

// Prioridades de notificação
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Ciclos de cobrança
export enum BillingCycle {
  MONTHLY = 'monthly',
  YEARLY = 'yearly'
}

// Tipos de transação
export enum TransactionType {
  CHARGE = 'charge',
  REFUND = 'refund',
  ADJUSTMENT = 'adjustment'
}
```

### Interfaces Base

```typescript
// Interface base para recursos com timestamp
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at?: string;
}

// Interface para metadados de paginação
export interface PaginationMeta {
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Interface para respostas paginadas
export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// Interface para filtros de data
export interface DateFilter {
  start_date?: string;
  end_date?: string;
}

// Interface para respostas de erro
export interface APIError {
  error: string;
  code?: string;
  details?: Record<string, any>;
}
```

### Interfaces de Assinatura

```typescript
// Dados de uma assinatura
export interface Subscription extends BaseEntity {
  tenant_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  billing_cycle: BillingCycle;
  current_period_start: string;
  current_period_end: string;
  trial_start?: string;
  trial_end?: string;
  canceled_at?: string;
  metadata?: Record<string, any>;
}

// Dados para criar uma nova assinatura
export interface CreateSubscriptionRequest {
  tenant_id: string;
  plan_type: PlanType;
  billing_cycle: BillingCycle;
  trial_days?: number;
  metadata?: Record<string, any>;
}

// Dados para atualizar uma assinatura
export interface UpdateSubscriptionRequest {
  plan_type?: PlanType;
  billing_cycle?: BillingCycle;
  metadata?: Record<string, any>;
}

// Resposta ao criar assinatura
export interface CreateSubscriptionResponse {
  subscription: Subscription;
  checkout_url?: string;
}
```

### Interfaces de Fatura

```typescript
// Dados de uma fatura
export interface Invoice extends BaseEntity {
  subscription_id: string;
  tenant_id: string;
  invoice_number: string;
  status: InvoiceStatus;
  amount_due: number;
  amount_paid: number;
  currency: string;
  due_date: string;
  paid_at?: string;
  description?: string;
  line_items: InvoiceLineItem[];
  metadata?: Record<string, any>;
}

// Item de linha da fatura
export interface InvoiceLineItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  total: number;
  metadata?: Record<string, any>;
}

// Filtros para buscar faturas
export interface InvoiceFilters extends DateFilter {
  status?: InvoiceStatus;
  tenant_id?: string;
  subscription_id?: string;
  limit?: number;
  offset?: number;
}
```

### Interfaces de Plano

```typescript
// Dados de um plano
export interface Plan {
  id: string;
  name: string;
  type: PlanType;
  description: string;
  features: string[];
  limits: PlanLimits;
  pricing: PlanPricing;
  is_active: boolean;
  metadata?: Record<string, any>;
}

// Limites do plano
export interface PlanLimits {
  requests: number;
  bandwidth_gb: number;
  storage_gb: number;
  compute_hours: number;
  api_calls: number;
  users?: number;
  projects?: number;
}

// Preços do plano
export interface PlanPricing {
  monthly: PlanPrice;
  yearly: PlanPrice;
}

// Preço específico
export interface PlanPrice {
  amount: number;
  currency: string;
  setup_fee?: number;
}

// Resposta da API de planos
export interface GetPlansResponse {
  plans: Plan[];
}
```

### Interfaces de Billing Info

```typescript
// Informações de billing de um tenant
export interface TenantBillingInfo {
  tenant_id: string;
  subscription?: Subscription;
  plan?: Plan;
  status: string;
  current_usage: UsageData;
  next_billing_date?: string;
  payment_method?: PaymentMethod;
  billing_address?: BillingAddress;
  metadata?: Record<string, any>;
}

// Método de pagamento
export interface PaymentMethod {
  id: string;
  type: string;
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  is_default: boolean;
}

// Endereço de cobrança
export interface BillingAddress {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
}
```

### Interfaces de Uso

```typescript
// Dados de uso
export interface UsageData {
  tenant_id: string;
  resource: string;
  total_usage: number;
  plan_limit: number;
  usage_percentage: number;
  start_date: string;
  end_date: string;
  usage: Record<string, number>;
  metadata?: Record<string, any>;
}

// Filtros para dados de uso
export interface UsageFilters extends DateFilter {
  resource?: string;
  tenant_id?: string;
}

// Resposta de dados de uso
export interface GetUsageResponse extends UsageData {}

// Sumário de uso por período
export interface UsageSummary {
  period: string;
  usage_by_resource: Record<string, number>;
  total_cost: number;
  currency: string;
}
```

### Interfaces de Checkout

```typescript
// Dados para criar sessão de checkout
export interface CreateCheckoutRequest {
  plan_type: PlanType;
  is_yearly: boolean;
  success_url?: string;
  cancel_url?: string;
  metadata?: Record<string, any>;
}

// Resposta da sessão de checkout
export interface CreateCheckoutResponse {
  checkout_url: string;
  session_id: string;
  expires_at: string;
}
```

### Interfaces de Webhook

```typescript
// Configuração de webhook
export interface WebhookConfig extends BaseEntity {
  name: string;
  url: string;
  events: string[];
  enabled: boolean;
  status: string;
  last_triggered?: string;
  retry_config: WebhookRetryConfig;
  metadata?: Record<string, any>;
}

// Configuração de retry do webhook
export interface WebhookRetryConfig {
  max_retries: number;
  retry_delay: number;
  exponential_backoff: boolean;
}

// Dados para criar webhook
export interface CreateWebhookRequest {
  name: string;
  url: string;
  events: string[];
  enabled?: boolean;
  retry_config?: Partial<WebhookRetryConfig>;
  metadata?: Record<string, any>;
}

// Dados para atualizar webhook
export interface UpdateWebhookRequest {
  name?: string;
  url?: string;
  events?: string[];
  enabled?: boolean;
  retry_config?: Partial<WebhookRetryConfig>;
  metadata?: Record<string, any>;
}
```

### Interfaces de Transação

```typescript
// Dados de uma transação
export interface Transaction extends BaseEntity {
  tenant_id: string;
  tenant_name: string;
  transaction_type: TransactionType;
  amount: number;
  currency: string;
  description: string;
  service_type: string;
  usage_details: UsageDetails;
  timestamp: string;
  invoice_id?: string;
  status: string;
  metadata?: Record<string, any>;
}

// Detalhes de uso na transação
export interface UsageDetails {
  bandwidth_gb: number;
  compute_hours: number;
  storage_gb: number;
  api_calls: number;
  [key: string]: number;
}

// Filtros para transações
export interface TransactionFilters extends DateFilter {
  tenant_id?: string;
  transaction_type?: TransactionType;
  service_type?: string;
  limit?: number;
  offset?: number;
}
```

### Interfaces de Alerta de Uso

```typescript
// Alerta de uso
export interface UsageAlert extends BaseEntity {
  name: string;
  metric: string;
  limit: number;
  current_usage: number;
  threshold: number;
  triggered: boolean;
  tenant_id?: string;
  last_checked: string;
  metadata?: Record<string, any>;
}

// Dados para criar alerta
export interface CreateUsageAlertRequest {
  name: string;
  metric: string;
  threshold: number;
  limit: number;
  tenant_id?: string;
  metadata?: Record<string, any>;
}

// Dados para atualizar alerta
export interface UpdateUsageAlertRequest {
  name?: string;
  threshold?: number;
  limit?: number;
  enabled?: boolean;
  metadata?: Record<string, any>;
}
```

### Interfaces de Notificação

```typescript
// Notificação
export interface Notification extends BaseEntity {
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  timestamp: string;
  priority: NotificationPriority;
  tenant_id?: string;
  related_id?: string;
  metadata?: Record<string, any>;
}

// Filtros para notificações
export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  priority?: NotificationPriority;
  tenant_id?: string;
  limit?: number;
  offset?: number;
}

// Resposta para marcar como lida
export interface MarkAsReadResponse {
  success: boolean;
}
```

### Interfaces de Exportação

```typescript
// Opções de exportação
export interface ExportOptions extends DateFilter {
  format: ExportFormat;
  include_raw?: boolean;
  filters?: Record<string, any>;
}

// Dados para exportação
export interface ExportRequest extends ExportOptions {
  tenant_id: string;
}

// Resposta de exportação
export interface ExportResponse {
  download_url?: string;
  data?: any;
  filename: string;
  content_type: string;
}
```

## Client TypeScript

```typescript
import { APIError } from './types';

// Configuração do cliente
export interface BillingClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

// Classe de erro customizada
export class BillingAPIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'BillingAPIError';
  }
}

// Cliente principal
export class BillingAPIClient {
  private baseURL: string;
  private headers: Record<string, string>;
  private timeout: number;

  constructor(config: BillingClientConfig) {
    this.baseURL = config.baseURL;
    this.timeout = config.timeout || 30000;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers
    };
  }

  // Método genérico para requisições
  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.headers,
          ...options.headers
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new BillingAPIError(
          errorData.error || `HTTP error! status: ${response.status}`,
          response.status,
          errorData
        );
      }

      return response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof BillingAPIError) {
        throw error;
      }
      
      if (error.name === 'AbortError') {
        throw new BillingAPIError('Request timeout', 408);
      }
      
      throw new BillingAPIError('Network error', 0, { originalError: error });
    }
  }

  // Métodos específicos
  
  // Assinaturas
  async getSubscriptions(): Promise<Subscription[]> {
    return this.request<Subscription[]>('/subscriptions');
  }

  async createSubscription(data: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse> {
    return this.request<CreateSubscriptionResponse>('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getSubscription(id: string): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`);
  }

  async updateSubscription(id: string, data: UpdateSubscriptionRequest): Promise<Subscription> {
    return this.request<Subscription>(`/subscriptions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async cancelSubscription(id: string): Promise<void> {
    await this.request<void>(`/subscriptions/${id}`, {
      method: 'DELETE'
    });
  }

  // Faturas
  async getInvoices(filters?: InvoiceFilters): Promise<Invoice[]> {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : '';
    const endpoint = queryParams ? `/invoices?${queryParams}` : '/invoices';
    return this.request<Invoice[]>(endpoint);
  }

  async getInvoice(id: string): Promise<Invoice> {
    return this.request<Invoice>(`/invoices/${id}`);
  }

  async downloadInvoice(id: string): Promise<Blob> {
    const response = await fetch(`${this.baseURL}/invoices/${id}/download`, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new BillingAPIError(`Download failed: ${response.status}`, response.status);
    }

    return response.blob();
  }

  // Tenant específico
  async getTenantBilling(tenantId: string): Promise<TenantBillingInfo> {
    return this.request<TenantBillingInfo>(`/tenant/${tenantId}/billing`);
  }

  async createCheckoutSession(tenantId: string, data: CreateCheckoutRequest): Promise<CreateCheckoutResponse> {
    return this.request<CreateCheckoutResponse>(`/tenant/${tenantId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getTenantUsage(tenantId: string, filters?: UsageFilters): Promise<UsageData> {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : '';
    const endpoint = queryParams ? `/tenant/${tenantId}/usage?${queryParams}` : `/tenant/${tenantId}/usage`;
    return this.request<UsageData>(endpoint);
  }

  async exportTenantBilling(tenantId: string, options: ExportOptions): Promise<Blob> {
    const queryParams = new URLSearchParams(options as any).toString();
    const response = await fetch(`${this.baseURL}/tenant/${tenantId}/export?${queryParams}`, {
      headers: this.headers
    });

    if (!response.ok) {
      throw new BillingAPIError(`Export failed: ${response.status}`, response.status);
    }

    return response.blob();
  }

  // Planos
  async getPlans(): Promise<GetPlansResponse> {
    return this.request<GetPlansResponse>('/plans');
  }

  // Webhooks
  async getWebhooks(): Promise<WebhookConfig[]> {
    return this.request<WebhookConfig[]>('/webhooks');
  }

  async createWebhook(data: CreateWebhookRequest): Promise<WebhookConfig> {
    return this.request<WebhookConfig>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateWebhook(id: string, data: UpdateWebhookRequest): Promise<WebhookConfig> {
    return this.request<WebhookConfig>(`/webhooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  async deleteWebhook(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/webhooks/${id}`, {
      method: 'DELETE'
    });
  }

  // Transações
  async getTransactions(filters?: TransactionFilters): Promise<Transaction[]> {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : '';
    const endpoint = queryParams ? `/transactions?${queryParams}` : '/transactions';
    return this.request<Transaction[]>(endpoint);
  }

  // Alertas de uso
  async getUsageAlerts(): Promise<UsageAlert[]> {
    return this.request<UsageAlert[]>('/usage-alerts');
  }

  async createUsageAlert(data: CreateUsageAlertRequest): Promise<UsageAlert> {
    return this.request<UsageAlert>('/usage-alerts', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateUsageAlert(id: string, data: UpdateUsageAlertRequest): Promise<UsageAlert> {
    return this.request<UsageAlert>(`/usage-alerts/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Notificações
  async getNotifications(filters?: NotificationFilters): Promise<Notification[]> {
    const queryParams = filters ? new URLSearchParams(filters as any).toString() : '';
    const endpoint = queryParams ? `/notifications?${queryParams}` : '/notifications';
    return this.request<Notification[]>(endpoint);
  }

  async markNotificationAsRead(id: string): Promise<MarkAsReadResponse> {
    return this.request<MarkAsReadResponse>(`/notifications/${id}/read`, {
      method: 'POST'
    });
  }

  // Configurar autenticação
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remover autenticação
  clearAuth(): void {
    delete this.headers['Authorization'];
  }
}
```

## Exemplos de Uso

```typescript
// Configurar cliente
const billingClient = new BillingAPIClient({
  baseURL: 'https://api.veloflux.io/billing',
  timeout: 30000
});

// Configurar autenticação
billingClient.setAuthToken(userToken);

// Usar com async/await
async function loadBillingData(tenantId: string) {
  try {
    const [billingInfo, usage, invoices] = await Promise.all([
      billingClient.getTenantBilling(tenantId),
      billingClient.getTenantUsage(tenantId),
      billingClient.getInvoices({ tenant_id: tenantId })
    ]);

    return { billingInfo, usage, invoices };
  } catch (error) {
    if (error instanceof BillingAPIError) {
      console.error(`API Error ${error.status}: ${error.message}`);
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

// Usar com tipos específicos
async function upgradeSubscription(subscriptionId: string): Promise<Subscription> {
  const updateData: UpdateSubscriptionRequest = {
    plan_type: PlanType.PRO,
    billing_cycle: BillingCycle.YEARLY
  };

  return billingClient.updateSubscription(subscriptionId, updateData);
}

// Type guards para verificação de tipos
export function isValidPlanType(plan: string): plan is PlanType {
  return Object.values(PlanType).includes(plan as PlanType);
}

export function isValidExportFormat(format: string): format is ExportFormat {
  return Object.values(ExportFormat).includes(format as ExportFormat);
}
```

## Utilitários TypeScript

```typescript
// Helper para formatação de preços
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100);
}

// Helper para formatação de datas
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR');
}

// Helper para cálculo de porcentagem de uso
export function calculateUsagePercentage(usage: number, limit: number): number {
  return Math.round((usage / limit) * 100);
}

// Helper para validação de dados
export function validateSubscriptionData(data: CreateSubscriptionRequest): string[] {
  const errors: string[] = [];

  if (!data.tenant_id) {
    errors.push('tenant_id é obrigatório');
  }

  if (!isValidPlanType(data.plan_type)) {
    errors.push('plan_type deve ser um tipo de plano válido');
  }

  if (data.trial_days && (data.trial_days < 0 || data.trial_days > 365)) {
    errors.push('trial_days deve estar entre 0 e 365');
  }

  return errors;
}
```

Este arquivo fornece uma base sólida de tipos TypeScript para toda a API de billing, garantindo type safety e melhor experiência de desenvolvimento.
