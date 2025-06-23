# Guia Completo - API de Billing para Frontend

## Visão Geral

Este guia documenta todas as funcionalidades da API de Billing do VeloFlux, fornecendo exemplos práticos de como consumir cada endpoint no frontend.

## Índice

1. [Configuração Inicial](#configuração-inicial)
2. [Autenticação](#autenticação)
3. [Endpoints de Assinaturas](#endpoints-de-assinaturas)
4. [Endpoints de Faturas](#endpoints-de-faturas)
5. [Endpoints Específicos por Tenant](#endpoints-específicos-por-tenant)
6. [Endpoints de Planos](#endpoints-de-planos)
7. [Webhooks](#webhooks)
8. [Funcionalidades Avançadas](#funcionalidades-avançadas)
9. [Tratamento de Erros](#tratamento-de-erros)
10. [Exemplos Práticos](#exemplos-práticos)

## Configuração Inicial

### Base URL
```javascript
const BILLING_API_BASE_URL = 'https://api.veloflux.io/billing';
```

### Cliente HTTP Configurado
```javascript
class BillingAPIClient {
  constructor(baseURL = BILLING_API_BASE_URL) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  }
}

const billingAPI = new BillingAPIClient();
```

## Autenticação

Todas as requisições devem incluir o token de autenticação:

```javascript
// Configurar token globalmente
billingAPI.headers['Authorization'] = `Bearer ${userToken}`;

// Ou por requisição
await billingAPI.request('/subscriptions', {
  headers: {
    'Authorization': `Bearer ${userToken}`
  }
});
```

## Endpoints de Assinaturas

### 1. Listar Todas as Assinaturas

```javascript
/**
 * GET /subscriptions
 * Lista todas as assinaturas
 */
async function getSubscriptions() {
  try {
    const subscriptions = await billingAPI.request('/subscriptions');
    return subscriptions;
  } catch (error) {
    console.error('Erro ao buscar assinaturas:', error);
    throw error;
  }
}

// Exemplo de uso
const subscriptions = await getSubscriptions();
console.log('Assinaturas:', subscriptions);
```

### 2. Criar Nova Assinatura

```javascript
/**
 * POST /subscriptions
 * Cria uma nova assinatura
 */
async function createSubscription(subscriptionData) {
  try {
    const newSubscription = await billingAPI.request('/subscriptions', {
      method: 'POST',
      body: JSON.stringify(subscriptionData)
    });
    return newSubscription;
  } catch (error) {
    console.error('Erro ao criar assinatura:', error);
    throw error;
  }
}

// Exemplo de uso
const newSubscription = await createSubscription({
  plan: 'pro',
  tenant_id: 'tenant_123',
  billing_cycle: 'monthly'
});
```

### 3. Obter Assinatura Específica

```javascript
/**
 * GET /subscriptions/{id}
 * Obtém detalhes de uma assinatura específica
 */
async function getSubscription(subscriptionId) {
  try {
    const subscription = await billingAPI.request(`/subscriptions/${subscriptionId}`);
    return subscription;
  } catch (error) {
    console.error('Erro ao buscar assinatura:', error);
    throw error;
  }
}

// Exemplo de uso
const subscription = await getSubscription('sub_123');
```

### 4. Atualizar Assinatura

```javascript
/**
 * PUT /subscriptions/{id}
 * Atualiza uma assinatura existente
 */
async function updateSubscription(subscriptionId, updateData) {
  try {
    const updatedSubscription = await billingAPI.request(`/subscriptions/${subscriptionId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return updatedSubscription;
  } catch (error) {
    console.error('Erro ao atualizar assinatura:', error);
    throw error;
  }
}

// Exemplo de uso
const updated = await updateSubscription('sub_123', {
  plan: 'enterprise',
  billing_cycle: 'yearly'
});
```

### 5. Cancelar Assinatura

```javascript
/**
 * DELETE /subscriptions/{id}
 * Cancela uma assinatura
 */
async function cancelSubscription(subscriptionId) {
  try {
    await billingAPI.request(`/subscriptions/${subscriptionId}`, {
      method: 'DELETE'
    });
    return { success: true };
  } catch (error) {
    console.error('Erro ao cancelar assinatura:', error);
    throw error;
  }
}

// Exemplo de uso
await cancelSubscription('sub_123');
```

## Endpoints de Faturas

### 1. Listar Todas as Faturas

```javascript
/**
 * GET /invoices
 * Lista todas as faturas
 */
async function getInvoices(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/invoices?${queryParams}` : '/invoices';
    const invoices = await billingAPI.request(endpoint);
    return invoices;
  } catch (error) {
    console.error('Erro ao buscar faturas:', error);
    throw error;
  }
}

// Exemplo de uso
const invoices = await getInvoices({
  status: 'paid',
  limit: 10,
  offset: 0
});
```

### 2. Obter Fatura Específica

```javascript
/**
 * GET /invoices/{id}
 * Obtém detalhes de uma fatura específica
 */
async function getInvoice(invoiceId) {
  try {
    const invoice = await billingAPI.request(`/invoices/${invoiceId}`);
    return invoice;
  } catch (error) {
    console.error('Erro ao buscar fatura:', error);
    throw error;
  }
}

// Exemplo de uso
const invoice = await getInvoice('inv_123');
```

### 3. Download de Fatura PDF

```javascript
/**
 * GET /invoices/{id}/download
 * Faz download do PDF da fatura
 */
async function downloadInvoice(invoiceId) {
  try {
    const response = await fetch(`${BILLING_API_BASE_URL}/invoices/${invoiceId}/download`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro no download: ${response.status}`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `invoice_${invoiceId}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true };
  } catch (error) {
    console.error('Erro ao fazer download da fatura:', error);
    throw error;
  }
}

// Exemplo de uso
await downloadInvoice('inv_123');
```

## Endpoints Específicos por Tenant

### 1. Obter Informações de Billing do Tenant

```javascript
/**
 * GET /tenant/{tenant_id}/billing
 * Obtém informações de billing de um tenant específico
 */
async function getTenantBilling(tenantId) {
  try {
    const billingInfo = await billingAPI.request(`/tenant/${tenantId}/billing`);
    return billingInfo;
  } catch (error) {
    console.error('Erro ao buscar billing do tenant:', error);
    throw error;
  }
}

// Exemplo de uso
const billingInfo = await getTenantBilling('tenant_123');
console.log('Status da assinatura:', billingInfo.status);
```

### 2. Criar Sessão de Checkout

```javascript
/**
 * POST /tenant/{tenant_id}/checkout
 * Cria uma sessão de checkout para upgrade/downgrade de plano
 */
async function createCheckoutSession(tenantId, checkoutData) {
  try {
    const checkoutSession = await billingAPI.request(`/tenant/${tenantId}/checkout`, {
      method: 'POST',
      body: JSON.stringify(checkoutData)
    });
    return checkoutSession;
  } catch (error) {
    console.error('Erro ao criar sessão de checkout:', error);
    throw error;
  }
}

// Exemplo de uso
const checkout = await createCheckoutSession('tenant_123', {
  plan_type: 'pro',
  is_yearly: true
});

// Redirecionar para checkout
window.location.href = checkout.checkout_url;
```

### 3. Obter Dados de Uso

```javascript
/**
 * GET /tenant/{tenant_id}/usage
 * Obtém dados de uso de um tenant
 */
async function getTenantUsage(tenantId, options = {}) {
  try {
    const queryParams = new URLSearchParams(options).toString();
    const endpoint = queryParams ? 
      `/tenant/${tenantId}/usage?${queryParams}` : 
      `/tenant/${tenantId}/usage`;
    
    const usageData = await billingAPI.request(endpoint);
    return usageData;
  } catch (error) {
    console.error('Erro ao buscar dados de uso:', error);
    throw error;
  }
}

// Exemplo de uso
const usage = await getTenantUsage('tenant_123', {
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  resource: 'requests'
});

console.log(`Uso total: ${usage.total_usage}/${usage.plan_limit}`);
```

### 4. Exportar Dados de Billing

```javascript
/**
 * GET /tenant/{tenant_id}/export
 * Exporta dados de billing em diferentes formatos
 */
async function exportTenantBilling(tenantId, exportOptions = {}) {
  try {
    const queryParams = new URLSearchParams(exportOptions).toString();
    const endpoint = queryParams ? 
      `/tenant/${tenantId}/export?${queryParams}` : 
      `/tenant/${tenantId}/export`;

    const response = await fetch(`${BILLING_API_BASE_URL}${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${userToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Erro na exportação: ${response.status}`);
    }

    const blob = await response.blob();
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition ? 
      contentDisposition.split('filename=')[1] : 
      `billing_export_${tenantId}.json`;

    // Fazer download do arquivo
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, filename };
  } catch (error) {
    console.error('Erro ao exportar dados de billing:', error);
    throw error;
  }
}

// Exemplo de uso
await exportTenantBilling('tenant_123', {
  format: 'csv',
  start_date: '2024-01-01',
  end_date: '2024-01-31',
  include_raw: 'true'
});
```

## Endpoints de Planos

### 1. Listar Planos Disponíveis

```javascript
/**
 * GET /plans
 * Lista todos os planos disponíveis com preços
 */
async function getAvailablePlans() {
  try {
    const plans = await billingAPI.request('/plans');
    return plans;
  } catch (error) {
    console.error('Erro ao buscar planos:', error);
    throw error;
  }
}

// Exemplo de uso
const plans = await getAvailablePlans();
plans.forEach(plan => {
  console.log(`Plano: ${plan.name}, Preço: ${plan.price}/${plan.billing_cycle}`);
});
```

## Webhooks

### 1. Listar Configurações de Webhook

```javascript
/**
 * GET /webhooks
 * Lista todas as configurações de webhook
 */
async function getWebhookConfigs() {
  try {
    const webhooks = await billingAPI.request('/webhooks');
    return webhooks;
  } catch (error) {
    console.error('Erro ao buscar webhooks:', error);
    throw error;
  }
}

// Exemplo de uso
const webhooks = await getWebhookConfigs();
```

### 2. Criar Configuração de Webhook

```javascript
/**
 * POST /webhooks
 * Cria uma nova configuração de webhook
 */
async function createWebhookConfig(webhookData) {
  try {
    const webhook = await billingAPI.request('/webhooks', {
      method: 'POST',
      body: JSON.stringify(webhookData)
    });
    return webhook;
  } catch (error) {
    console.error('Erro ao criar webhook:', error);
    throw error;
  }
}

// Exemplo de uso
const webhook = await createWebhookConfig({
  name: 'Payment Notifications',
  url: 'https://myapp.com/webhooks/billing',
  events: ['payment.completed', 'subscription.updated'],
  enabled: true,
  retry_config: {
    max_retries: 3,
    retry_delay: 1000,
    exponential_backoff: true
  }
});
```

### 3. Atualizar Configuração de Webhook

```javascript
/**
 * PUT /webhooks/{id}
 * Atualiza uma configuração de webhook existente
 */
async function updateWebhookConfig(webhookId, updateData) {
  try {
    const webhook = await billingAPI.request(`/webhooks/${webhookId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return webhook;
  } catch (error) {
    console.error('Erro ao atualizar webhook:', error);
    throw error;
  }
}

// Exemplo de uso
const updated = await updateWebhookConfig('wh_123', {
  enabled: false,
  events: ['payment.completed']
});
```

### 4. Deletar Configuração de Webhook

```javascript
/**
 * DELETE /webhooks/{id}
 * Remove uma configuração de webhook
 */
async function deleteWebhookConfig(webhookId) {
  try {
    const result = await billingAPI.request(`/webhooks/${webhookId}`, {
      method: 'DELETE'
    });
    return result;
  } catch (error) {
    console.error('Erro ao deletar webhook:', error);
    throw error;
  }
}

// Exemplo de uso
await deleteWebhookConfig('wh_123');
```

## Funcionalidades Avançadas

### 1. Obter Transações

```javascript
/**
 * GET /transactions
 * Lista todas as transações de billing
 */
async function getTransactions(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/transactions?${queryParams}` : '/transactions';
    const transactions = await billingAPI.request(endpoint);
    return transactions;
  } catch (error) {
    console.error('Erro ao buscar transações:', error);
    throw error;
  }
}

// Exemplo de uso
const transactions = await getTransactions({
  tenant_id: 'tenant_123',
  start_date: '2024-01-01',
  end_date: '2024-01-31'
});
```

### 2. Gerenciar Alertas de Uso

#### Listar Alertas
```javascript
/**
 * GET /usage-alerts
 * Lista todos os alertas de uso configurados
 */
async function getUsageAlerts() {
  try {
    const alerts = await billingAPI.request('/usage-alerts');
    return alerts;
  } catch (error) {
    console.error('Erro ao buscar alertas:', error);
    throw error;
  }
}
```

#### Criar Alerta
```javascript
/**
 * POST /usage-alerts
 * Cria um novo alerta de uso
 */
async function createUsageAlert(alertData) {
  try {
    const alert = await billingAPI.request('/usage-alerts', {
      method: 'POST',
      body: JSON.stringify(alertData)
    });
    return alert;
  } catch (error) {
    console.error('Erro ao criar alerta:', error);
    throw error;
  }
}

// Exemplo de uso
const alert = await createUsageAlert({
  name: 'Bandwidth Alert',
  metric: 'bandwidth_gb',
  threshold: 80,
  limit: 1000,
  tenant_id: 'tenant_123'
});
```

#### Atualizar Alerta
```javascript
/**
 * PUT /usage-alerts/{id}
 * Atualiza um alerta de uso existente
 */
async function updateUsageAlert(alertId, updateData) {
  try {
    const alert = await billingAPI.request(`/usage-alerts/${alertId}`, {
      method: 'PUT',
      body: JSON.stringify(updateData)
    });
    return alert;
  } catch (error) {
    console.error('Erro ao atualizar alerta:', error);
    throw error;
  }
}
```

### 3. Gerenciar Notificações

#### Listar Notificações
```javascript
/**
 * GET /notifications
 * Lista todas as notificações de billing
 */
async function getNotifications(filters = {}) {
  try {
    const queryParams = new URLSearchParams(filters).toString();
    const endpoint = queryParams ? `/notifications?${queryParams}` : '/notifications';
    const notifications = await billingAPI.request(endpoint);
    return notifications;
  } catch (error) {
    console.error('Erro ao buscar notificações:', error);
    throw error;
  }
}
```

#### Marcar Notificação como Lida
```javascript
/**
 * POST /notifications/{id}/read
 * Marca uma notificação como lida
 */
async function markNotificationAsRead(notificationId) {
  try {
    const result = await billingAPI.request(`/notifications/${notificationId}/read`, {
      method: 'POST'
    });
    return result;
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    throw error;
  }
}
```

## Tratamento de Erros

### Classe de Erro Personalizada

```javascript
class BillingAPIError extends Error {
  constructor(message, status, response) {
    super(message);
    this.name = 'BillingAPIError';
    this.status = status;
    this.response = response;
  }
}

// Cliente aprimorado com tratamento de erros
class EnhancedBillingAPIClient {
  constructor(baseURL = BILLING_API_BASE_URL) {
    this.baseURL = baseURL;
    this.headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers
      }
    };

    try {
      const response = await fetch(url, config);
      
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
      if (error instanceof BillingAPIError) {
        throw error;
      }
      throw new BillingAPIError('Network error', 0, { originalError: error });
    }
  }
}
```

### Tratamento Global de Erros

```javascript
function handleBillingError(error) {
  if (error instanceof BillingAPIError) {
    switch (error.status) {
      case 401:
        // Token expirado - redirecionar para login
        console.error('Token expirado, redirecionando para login');
        window.location.href = '/login';
        break;
      case 403:
        // Acesso negado
        console.error('Acesso negado:', error.message);
        showNotification('Você não tem permissão para esta ação', 'error');
        break;
      case 404:
        // Recurso não encontrado
        console.error('Recurso não encontrado:', error.message);
        showNotification('Recurso não encontrado', 'error');
        break;
      case 429:
        // Rate limit excedido
        console.error('Rate limit excedido:', error.message);
        showNotification('Muitas requisições. Tente novamente em alguns minutos.', 'warning');
        break;
      case 500:
        // Erro interno do servidor
        console.error('Erro interno do servidor:', error.message);
        showNotification('Erro interno. Nossa equipe foi notificada.', 'error');
        break;
      default:
        console.error('Erro da API de Billing:', error.message);
        showNotification(`Erro: ${error.message}`, 'error');
    }
  } else {
    console.error('Erro de rede:', error);
    showNotification('Erro de conexão. Verifique sua internet.', 'error');
  }
}
```

## Exemplos Práticos

### 1. Dashboard de Billing Completo

```javascript
class BillingDashboard {
  constructor() {
    this.api = new EnhancedBillingAPIClient();
    this.tenantId = getCurrentTenantId();
  }

  async loadDashboard() {
    try {
      // Carregar dados em paralelo
      const [
        billingInfo,
        usage,
        invoices,
        notifications
      ] = await Promise.all([
        this.api.request(`/tenant/${this.tenantId}/billing`),
        this.api.request(`/tenant/${this.tenantId}/usage`),
        this.api.request('/invoices'),
        this.api.request('/notifications')
      ]);

      // Atualizar UI
      this.updateBillingInfo(billingInfo);
      this.updateUsageChart(usage);
      this.updateInvoicesList(invoices);
      this.updateNotifications(notifications);

    } catch (error) {
      handleBillingError(error);
    }
  }

  updateBillingInfo(billingInfo) {
    document.getElementById('current-plan').textContent = billingInfo.plan || 'Nenhum plano';
    document.getElementById('billing-status').textContent = billingInfo.status || 'Inativo';
    
    if (billingInfo.next_billing_date) {
      document.getElementById('next-billing').textContent = 
        new Date(billingInfo.next_billing_date).toLocaleDateString('pt-BR');
    }
  }

  updateUsageChart(usage) {
    const usagePercentage = (usage.total_usage / usage.plan_limit) * 100;
    
    // Atualizar barra de progresso
    const progressBar = document.getElementById('usage-progress');
    progressBar.style.width = `${usagePercentage}%`;
    
    // Atualizar texto
    document.getElementById('usage-text').textContent = 
      `${usage.total_usage.toLocaleString()} / ${usage.plan_limit.toLocaleString()} ${usage.resource}`;
    
    // Mostrar alerta se próximo do limite
    if (usagePercentage > 80) {
      this.showUsageAlert(usagePercentage);
    }
  }

  showUsageAlert(percentage) {
    const alertDiv = document.getElementById('usage-alert');
    alertDiv.innerHTML = `
      <div class="alert alert-warning">
        <strong>Atenção!</strong> Você está usando ${percentage.toFixed(1)}% do seu limite mensal.
        <a href="#upgrade" onclick="this.showUpgradeModal()">Considere fazer upgrade</a>
      </div>
    `;
    alertDiv.style.display = 'block';
  }

  async showUpgradeModal() {
    try {
      // Buscar planos disponíveis
      const plans = await this.api.request('/plans');
      
      // Criar modal com opções de upgrade
      const modal = this.createUpgradeModal(plans);
      document.body.appendChild(modal);
      
    } catch (error) {
      handleBillingError(error);
    }
  }

  createUpgradeModal(plans) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>Escolha seu novo plano</h2>
        <div class="plans-grid">
          ${plans.map(plan => `
            <div class="plan-card" data-plan="${plan.type}">
              <h3>${plan.name}</h3>
              <div class="price">$${plan.price}/${plan.billing_cycle}</div>
              <ul class="features">
                ${plan.features.map(feature => `<li>${feature}</li>`).join('')}
              </ul>
              <button onclick="this.upgradeToPlan('${plan.type}')">
                Escolher Plano
              </button>
            </div>
          `).join('')}
        </div>
      </div>
    `;
    return modal;
  }

  async upgradeToPlan(planType) {
    try {
      // Criar sessão de checkout
      const checkout = await this.api.request(`/tenant/${this.tenantId}/checkout`, {
        method: 'POST',
        body: JSON.stringify({
          plan_type: planType,
          is_yearly: false
        })
      });

      // Redirecionar para checkout
      window.location.href = checkout.checkout_url;

    } catch (error) {
      handleBillingError(error);
    }
  }
}

// Inicializar dashboard
const dashboard = new BillingDashboard();
dashboard.loadDashboard();
```

### 2. Sistema de Notificações em Tempo Real

```javascript
class BillingNotificationSystem {
  constructor() {
    this.api = new EnhancedBillingAPIClient();
    this.notifications = [];
    this.unreadCount = 0;
  }

  async initialize() {
    await this.loadNotifications();
    this.setupWebSocket();
    this.renderNotifications();
  }

  async loadNotifications() {
    try {
      this.notifications = await this.api.request('/notifications');
      this.unreadCount = this.notifications.filter(n => !n.read).length;
      this.updateNotificationBadge();
    } catch (error) {
      handleBillingError(error);
    }
  }

  setupWebSocket() {
    // Configurar WebSocket para notificações em tempo real
    const ws = new WebSocket('wss://api.veloflux.io/ws/billing');
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'billing_notification') {
        this.addNewNotification(data.notification);
      }
    };
  }

  addNewNotification(notification) {
    this.notifications.unshift(notification);
    this.unreadCount++;
    this.updateNotificationBadge();
    this.showToastNotification(notification);
    this.renderNotifications();
  }

  updateNotificationBadge() {
    const badge = document.getElementById('notification-badge');
    if (this.unreadCount > 0) {
      badge.textContent = this.unreadCount;
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  showToastNotification(notification) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${notification.priority}`;
    toast.innerHTML = `
      <div class="toast-content">
        <h4>${notification.title}</h4>
        <p>${notification.message}</p>
      </div>
      <button onclick="this.dismissToast(this.parentElement)">×</button>
    `;

    document.getElementById('toast-container').appendChild(toast);

    // Auto dismiss após 5 segundos
    setTimeout(() => {
      if (toast.parentElement) {
        toast.parentElement.removeChild(toast);
      }
    }, 5000);
  }

  async markAsRead(notificationId) {
    try {
      await this.api.request(`/notifications/${notificationId}/read`, {
        method: 'POST'
      });

      // Atualizar localmente
      const notification = this.notifications.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        notification.read = true;
        this.unreadCount--;
        this.updateNotificationBadge();
        this.renderNotifications();
      }

    } catch (error) {
      handleBillingError(error);
    }
  }

  renderNotifications() {
    const container = document.getElementById('notifications-list');
    container.innerHTML = this.notifications.map(notification => `
      <div class="notification ${notification.read ? 'read' : 'unread'}" 
           data-id="${notification.id}">
        <div class="notification-content">
          <h4>${notification.title}</h4>
          <p>${notification.message}</p>
          <small>${new Date(notification.timestamp).toLocaleString('pt-BR')}</small>
        </div>
        ${!notification.read ? `
          <button onclick="notificationSystem.markAsRead('${notification.id}')" 
                  class="mark-read-btn">
            Marcar como lida
          </button>
        ` : ''}
      </div>
    `).join('');
  }
}

// Inicializar sistema de notificações
const notificationSystem = new BillingNotificationSystem();
notificationSystem.initialize();
```

### 3. Relatório de Uso Avançado

```javascript
class UsageReportGenerator {
  constructor() {
    this.api = new EnhancedBillingAPIClient();
  }

  async generateReport(tenantId, options = {}) {
    const {
      startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate = new Date(),
      resources = ['requests', 'bandwidth_gb', 'storage_gb'],
      format = 'json'
    } = options;

    try {
      // Buscar dados de uso para cada recurso
      const usagePromises = resources.map(resource => 
        this.api.request(`/tenant/${tenantId}/usage`, {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          resource: resource
        })
      );

      const usageResults = await Promise.all(usagePromises);
      
      // Organizar dados
      const reportData = {
        tenant_id: tenantId,
        period: {
          start: startDate.toISOString(),
          end: endDate.toISOString()
        },
        usage_by_resource: {}
      };

      usageResults.forEach((usage, index) => {
        reportData.usage_by_resource[resources[index]] = usage;
      });

      // Gerar relatório no formato solicitado
      return this.formatReport(reportData, format);

    } catch (error) {
      handleBillingError(error);
      throw error;
    }
  }

  formatReport(data, format) {
    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      
      case 'csv':
        return this.convertToCSV(data);
      
      case 'html':
        return this.convertToHTML(data);
      
      default:
        return data;
    }
  }

  convertToCSV(data) {
    const headers = ['Resource', 'Total Usage', 'Plan Limit', 'Usage Percentage'];
    const rows = Object.entries(data.usage_by_resource).map(([resource, usage]) => [
      resource,
      usage.total_usage,
      usage.plan_limit,
      ((usage.total_usage / usage.plan_limit) * 100).toFixed(2) + '%'
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  convertToHTML(data) {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Relatório de Uso - ${data.tenant_id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #f2f2f2; }
          .usage-bar { width: 100px; height: 20px; background: #f0f0f0; border-radius: 10px; }
          .usage-fill { height: 100%; background: #4CAF50; border-radius: 10px; }
        </style>
      </head>
      <body>
        <h1>Relatório de Uso</h1>
        <p><strong>Tenant:</strong> ${data.tenant_id}</p>
        <p><strong>Período:</strong> ${new Date(data.period.start).toLocaleDateString('pt-BR')} - ${new Date(data.period.end).toLocaleDateString('pt-BR')}</p>
        
        <table>
          <thead>
            <tr>
              <th>Recurso</th>
              <th>Uso Total</th>
              <th>Limite do Plano</th>
              <th>Porcentagem</th>
              <th>Progresso</th>
            </tr>
          </thead>
          <tbody>
            ${Object.entries(data.usage_by_resource).map(([resource, usage]) => {
              const percentage = (usage.total_usage / usage.plan_limit) * 100;
              return `
                <tr>
                  <td>${resource}</td>
                  <td>${usage.total_usage.toLocaleString()}</td>
                  <td>${usage.plan_limit.toLocaleString()}</td>
                  <td>${percentage.toFixed(2)}%</td>
                  <td>
                    <div class="usage-bar">
                      <div class="usage-fill" style="width: ${Math.min(percentage, 100)}%"></div>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </body>
      </html>
    `;
  }

  async downloadReport(tenantId, format, filename) {
    try {
      const reportContent = await this.generateReport(tenantId, { format });
      
      const blob = new Blob([reportContent], {
        type: format === 'html' ? 'text/html' : 'text/plain'
      });

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `usage_report_${tenantId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

    } catch (error) {
      handleBillingError(error);
    }
  }
}

// Exemplo de uso
const reportGenerator = new UsageReportGenerator();

// Gerar e baixar relatório em CSV
await reportGenerator.downloadReport('tenant_123', 'csv', 'relatorio_uso_janeiro.csv');

// Gerar relatório HTML para visualização
const htmlReport = await reportGenerator.generateReport('tenant_123', {
  format: 'html',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-01-31')
});
```

Este guia fornece uma cobertura completa de todas as funcionalidades da API de billing, com exemplos práticos e código pronto para uso no frontend.
