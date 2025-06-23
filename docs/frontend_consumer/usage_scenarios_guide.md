# 🎯 Guia de Cenários de Uso - VeloFlux API

Este guia demonstra como usar a API VeloFlux em cenários específicos do mundo real.

## 📋 Índice

1. [Cenário 1: Dashboard de Monitoramento em Tempo Real](#cenário-1-dashboard-de-monitoramento-em-tempo-real)
2. [Cenário 2: Sistema de Multi-Tenancy](#cenário-2-sistema-de-multi-tenancy)
3. [Cenário 3: IA para Balanceamento Inteligente](#cenário-3-ia-para-balanceamento-inteligente)
4. [Cenário 4: Sistema de Billing e Subscriptions](#cenário-4-sistema-de-billing-e-subscriptions)
5. [Cenário 5: Gestão de Clusters](#cenário-5-gestão-de-clusters)

---

## Cenário 1: Dashboard de Monitoramento em Tempo Real

### Objetivo
Criar um dashboard que exibe métricas em tempo real, status de backends e alertas.

### Implementação Completa

```javascript
class VeloFluxDashboard {
  constructor() {
    this.api = new VeloFluxAPI('http://localhost:8080');
    this.websockets = {};
    this.isAuthenticated = false;
  }

  // 1. Autenticação inicial
  async initialize(credentials) {
    try {
      // Login
      const authResult = await this.api.login(credentials);
      this.isAuthenticated = true;
      
      // Carregar dados iniciais
      await this.loadInitialData();
      
      // Conectar WebSockets
      this.connectWebSockets();
      
      console.log('Dashboard inicializado com sucesso');
    } catch (error) {
      console.error('Erro na inicialização:', error);
      throw error;
    }
  }

  // 2. Carregar dados iniciais
  async loadInitialData() {
    try {
      // Buscar todas as informações necessárias em paralelo
      const [pools, backends, routes, metrics, status, aiMetrics] = await Promise.all([
        this.api.listPools(),
        this.api.listBackends(),
        this.api.listRoutes(),
        this.api.getAdvancedMetrics(),
        this.api.getAdvancedStatus(),
        this.api.getAIMetrics()
      ]);

      // Atualizar UI com dados iniciais
      this.updatePoolsUI(pools);
      this.updateBackendsUI(backends);
      this.updateRoutesUI(routes);
      this.updateMetricsUI(metrics);
      this.updateStatusUI(status);
      this.updateAIMetricsUI(aiMetrics);

    } catch (error) {
      console.error('Erro ao carregar dados iniciais:', error);
    }
  }

  // 3. Conectar WebSockets para atualizações em tempo real
  connectWebSockets() {
    // WebSocket de métricas (atualiza a cada 2 segundos)
    this.websockets.metrics = this.api.connectMetricsWebSocket();
    this.websockets.metrics.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateMetricsUI(data.data);
    };

    // WebSocket de status (atualiza a cada 10 segundos)
    this.websockets.status = this.api.connectStatusWebSocket();
    this.websockets.status.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateStatusUI(data.data);
    };

    // WebSocket de backends (atualiza a cada 5 segundos)
    this.websockets.backends = this.api.connectBackendsWebSocket();
    this.websockets.backends.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateBackendsUI(data.data);
    };

    // WebSocket de billing (atualiza a cada 30 segundos)
    this.websockets.billing = this.api.connectBillingWebSocket();
    this.websockets.billing.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateBillingUI(data.data);
    };

    // WebSocket de health (atualiza a cada 15 segundos)
    this.websockets.health = this.api.connectHealthWebSocket();
    this.websockets.health.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateHealthUI(data.data);
    };
  }

  // 4. Funções de atualização da UI
  updateMetricsUI(metrics) {
    // Atualizar gráficos de CPU, memória, requests
    document.getElementById('cpu-usage').textContent = `${metrics.cpu?.toFixed(1)}%`;
    document.getElementById('memory-usage').textContent = `${metrics.memory?.toFixed(1)}%`;
    document.getElementById('request-count').textContent = metrics.requests || 0;
    
    // Atualizar gráficos em tempo real
    this.updateCharts(metrics);
  }

  updateBackendsUI(backends) {
    const container = document.getElementById('backends-list');
    container.innerHTML = '';
    
    backends.forEach(backend => {
      const backendEl = document.createElement('div');
      backendEl.className = `backend-item ${backend.healthy ? 'healthy' : 'unhealthy'}`;
      backendEl.innerHTML = `
        <div class="backend-address">${backend.address}</div>
        <div class="backend-pool">Pool: ${backend.pool}</div>
        <div class="backend-status">${backend.healthy ? 'Healthy' : 'Unhealthy'}</div>
        <div class="backend-weight">Weight: ${backend.weight}</div>
      `;
      container.appendChild(backendEl);
    });
  }

  updateStatusUI(status) {
    const statusEl = document.getElementById('system-status');
    statusEl.className = `status ${status.status}`;
    statusEl.textContent = status.status.toUpperCase();
    
    document.getElementById('uptime').textContent = status.uptime || 'Unknown';
  }

  updateAIMetricsUI(aiMetrics) {
    if (aiMetrics.enabled) {
      document.getElementById('ai-status').textContent = 'Enabled';
      document.getElementById('current-algorithm').textContent = aiMetrics.current_algorithm;
      
      if (aiMetrics.prediction_data) {
        document.getElementById('ai-confidence').textContent = 
          `${(aiMetrics.prediction_data.confidence * 100).toFixed(1)}%`;
        document.getElementById('predicted-load').textContent = 
          aiMetrics.prediction_data.predicted_load.toFixed(2);
      }
    } else {
      document.getElementById('ai-status').textContent = 'Disabled';
    }
  }

  // 5. Gestão de pools/backends em tempo real
  async addBackend(poolName, backendData) {
    try {
      const result = await this.api.addBackend({
        ...backendData,
        pool: poolName
      });
      
      // A UI será atualizada automaticamente via WebSocket
      this.showNotification('Backend adicionado com sucesso', 'success');
      return result;
    } catch (error) {
      this.showNotification('Erro ao adicionar backend', 'error');
      throw error;
    }
  }

  async removeBackend(backendId) {
    try {
      await this.api.deleteBackend(backendId);
      this.showNotification('Backend removido com sucesso', 'success');
    } catch (error) {
      this.showNotification('Erro ao remover backend', 'error');
      throw error;
    }
  }

  // 6. Cleanup ao sair
  disconnect() {
    Object.values(this.websockets).forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.api.logout();
  }

  // Helpers
  updateCharts(metrics) {
    // Implementar com Chart.js, D3.js, etc.
  }

  showNotification(message, type) {
    // Implementar sistema de notificações
  }
}

// Uso
const dashboard = new VeloFluxDashboard();

// Inicializar com credenciais
dashboard.initialize({
  email: 'admin@example.com',
  password: 'password123'
}).then(() => {
  console.log('Dashboard funcionando!');
});
```

---

## Cenário 2: Sistema de Multi-Tenancy

### Objetivo
Implementar um sistema onde diferentes tenants podem gerenciar seus próprios pools e backends.

### Implementação Completa

```javascript
class TenantManager {
  constructor() {
    this.api = new VeloFluxAPI('http://localhost:8080');
    this.currentTenant = null;
  }

  // 1. Autenticação como administrador global
  async authenticateAsAdmin(credentials) {
    await this.api.login(credentials);
  }

  // 2. Criar novo tenant
  async createTenant(tenantData) {
    try {
      const tenant = await this.api.createTenant({
        name: tenantData.name,
        plan: tenantData.plan || 'basic',
        owner_email: tenantData.ownerEmail,
        owner_name: tenantData.ownerName
      });

      // Configurar usuário inicial
      await this.addTenantUser(tenant.id, {
        email: tenantData.ownerEmail,
        name: tenantData.ownerName,
        role: 'owner'
      });

      return tenant;
    } catch (error) {
      console.error('Erro ao criar tenant:', error);
      throw error;
    }
  }

  // 3. Gestão de usuários do tenant
  async addTenantUser(tenantId, userData) {
    return await this.api.addTenantUser(tenantId, userData);
  }

  async listTenantUsers(tenantId) {
    return await this.api.listTenantUsers(tenantId);
  }

  async updateTenantUser(tenantId, userId, updateData) {
    return await this.api.updateTenantUser(tenantId, userId, updateData);
  }

  async deleteTenantUser(tenantId, userId) {
    return await this.api.deleteTenantUser(tenantId, userId);
  }

  // 4. Configuração OIDC por tenant
  async configureTenantOIDC(tenantId, oidcConfig) {
    try {
      await this.api.updateTenantOIDCConfig(tenantId, {
        provider_url: oidcConfig.providerUrl,
        client_id: oidcConfig.clientId,
        client_secret: oidcConfig.clientSecret,
        scopes: oidcConfig.scopes || ['openid', 'profile', 'email']
      });

      // Testar configuração
      const testResult = await this.api.testTenantOIDCConfig(tenantId);
      return testResult;
    } catch (error) {
      console.error('Erro na configuração OIDC:', error);
      throw error;
    }
  }

  // 5. Monitoramento por tenant
  async getTenantDashboard(tenantId) {
    try {
      const [metrics, logs, usage, alerts, status] = await Promise.all([
        this.api.getTenantMetrics(tenantId),
        this.api.getTenantLogs(tenantId),
        this.api.getTenantUsage(tenantId),
        this.api.getTenantAlerts(tenantId),
        this.api.getTenantStatus(tenantId)
      ]);

      return {
        metrics,
        logs,
        usage,
        alerts,
        status,
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Erro ao obter dashboard do tenant:', error);
      throw error;
    }
  }

  // 6. Billing por tenant
  async getTenantBilling(tenantId) {
    return await this.api.getTenantBilling(tenantId);
  }

  async createTenantSubscription(tenantId, subscriptionData) {
    return await this.api.createSubscription({
      tenant_id: tenantId,
      plan_id: subscriptionData.plan,
      billing_cycle: subscriptionData.billingCycle || 'monthly'
    });
  }

  // 7. Isolamento de recursos por tenant
  async getTenantResources(tenantId) {
    // Implementar lógica para filtrar recursos por tenant
    // Pools, backends e routes específicos do tenant
    const tenantConfig = await this.api.getTenantConfig(tenantId);
    return tenantConfig;
  }
}

// Uso prático
const tenantManager = new TenantManager();

// Fluxo completo de criação de tenant
async function setupNewTenant() {
  // 1. Autenticação como admin
  await tenantManager.authenticateAsAdmin({
    email: 'admin@veloflux.com',
    password: 'admin_password'
  });

  // 2. Criar tenant
  const tenant = await tenantManager.createTenant({
    name: 'Empresa ABC',
    plan: 'premium',
    ownerEmail: 'admin@empresaabc.com',
    ownerName: 'João Silva'
  });

  // 3. Configurar OIDC
  await tenantManager.configureTenantOIDC(tenant.id, {
    providerUrl: 'https://auth.empresaabc.com',
    clientId: 'abc-client-id',
    clientSecret: 'abc-client-secret'
  });

  // 4. Criar subscription
  await tenantManager.createTenantSubscription(tenant.id, {
    plan: 'premium',
    billingCycle: 'monthly'
  });

  console.log('Tenant configurado com sucesso:', tenant);
}
```

---

## Cenário 3: IA para Balanceamento Inteligente

### Objetivo
Implementar um sistema que usa IA para otimizar automaticamente o balanceamento de carga.

### Implementação Completa

```javascript
class AILoadBalancer {
  constructor() {
    this.api = new VeloFluxAPI('http://localhost:8080');
    this.aiMetrics = null;
    this.predictionHistory = [];
    this.modelPerformance = {};
  }

  // 1. Inicialização e configuração da IA
  async initialize() {
    try {
      // Verificar se IA está habilitada
      const aiStatus = await this.api.getAIStatus();
      if (!aiStatus.enabled) {
        throw new Error('IA não está habilitada no sistema');
      }

      // Configurar parâmetros da IA
      await this.configureAI({
        enabled: true,
        model_type: 'neural_network',
        confidence_threshold: 0.8,
        application_aware: true,
        predictive_scaling: true,
        learning_rate: 0.01,
        exploration_rate: 0.1
      });

      // Iniciar monitoramento
      this.startAIMonitoring();

      console.log('Sistema de IA inicializado');
    } catch (error) {
      console.error('Erro na inicialização da IA:', error);
      throw error;
    }
  }

  // 2. Configuração da IA
  async configureAI(config) {
    return await this.api.updateAIConfig(config);
  }

  // 3. Monitoramento contínuo da IA
  startAIMonitoring() {
    // Atualizar métricas a cada 30 segundos
    setInterval(async () => {
      try {
        await this.updateAIMetrics();
        await this.analyzePerformance();
        await this.makeIntelligentDecisions();
      } catch (error) {
        console.error('Erro no monitoramento da IA:', error);
      }
    }, 30000);
  }

  // 4. Atualizar métricas da IA
  async updateAIMetrics() {
    try {
      const [metrics, predictions, models, comparison] = await Promise.all([
        this.api.getDetailedAIMetrics({ detailed: true, history: true }),
        this.api.getAIPredictions(),
        this.api.getModelStatus(),
        this.api.getAlgorithmComparison()
      ]);

      this.aiMetrics = metrics;
      this.currentPrediction = predictions;
      this.modelPerformance = models;
      this.algorithmComparison = comparison;

      // Armazenar histórico
      this.predictionHistory.push({
        timestamp: new Date(),
        prediction: predictions,
        metrics: metrics
      });

      // Manter apenas últimas 100 predições
      if (this.predictionHistory.length > 100) {
        this.predictionHistory.shift();
      }

    } catch (error) {
      console.error('Erro ao atualizar métricas da IA:', error);
    }
  }

  // 5. Análise de performance
  async analyzePerformance() {
    if (!this.aiMetrics) return;

    // Verificar se modelos precisam de retreinamento
    for (const [modelName, performance] of Object.entries(this.modelPerformance)) {
      if (performance.accuracy < 0.85) {
        console.log(`Modelo ${modelName} com baixa performance, iniciando retreinamento`);
        await this.retrainModel(modelName);
      }
    }

    // Verificar se algoritmo atual é o melhor
    const bestAlgorithm = this.findBestAlgorithm();
    if (bestAlgorithm !== this.aiMetrics.current_algorithm) {
      console.log(`Recomendando mudança para algoritmo: ${bestAlgorithm}`);
      await this.suggestAlgorithmChange(bestAlgorithm);
    }
  }

  // 6. Tomada de decisões inteligentes
  async makeIntelligentDecisions() {
    if (!this.currentPrediction) return;

    const prediction = this.currentPrediction;

    // Se confiança alta, implementar recomendações
    if (prediction.confidence > 0.9) {
      // Scaling automático
      if (prediction.scaling_recommendation === 'scale_up') {
        await this.autoScale('up', prediction.optimal_backends);
      } else if (prediction.scaling_recommendation === 'scale_down') {
        await this.autoScale('down', prediction.optimal_backends);
      }

      // Mudança de algoritmo
      if (prediction.recommended_algorithm !== this.aiMetrics.current_algorithm) {
        await this.changeAlgorithm(prediction.recommended_algorithm);
      }
    }
  }

  // 7. Retreinamento de modelos
  async retrainModel(modelName = 'all') {
    try {
      const result = await this.api.retrainSpecificModel(modelName, {
        epochs: 100,
        learning_rate: 0.01,
        validation_split: 0.2
      });

      console.log(`Retreinamento iniciado para modelo: ${modelName}`, result);
      return result;
    } catch (error) {
      console.error('Erro no retreinamento:', error);
      throw error;
    }
  }

  // 8. Auto-scaling baseado em IA
  async autoScale(direction, optimalBackends) {
    try {
      if (direction === 'up') {
        // Adicionar novos backends
        for (const backend of optimalBackends) {
          await this.api.addBackend({
            address: backend.address,
            pool: backend.pool,
            weight: backend.weight,
            health_check: {
              path: '/health',
              interval: '30s',
              timeout: '5s',
              expected_status: 200
            }
          });
        }
        console.log('Scaling up realizado');
      } else if (direction === 'down') {
        // Remover backends menos eficientes
        const backends = await this.api.listBackends();
        const inefficientBackends = this.identifyInefficientBackends(backends);
        
        for (const backend of inefficientBackends.slice(0, 2)) { // Remover até 2 por vez
          await this.api.deleteBackend(backend.id);
        }
        console.log('Scaling down realizado');
      }
    } catch (error) {
      console.error('Erro no auto-scaling:', error);
    }
  }

  // 9. Mudança inteligente de algoritmo
  async changeAlgorithm(newAlgorithm) {
    try {
      // Implementar lógica de mudança de algoritmo
      // (dependeria da implementação específica do backend)
      console.log(`Mudando algoritmo para: ${newAlgorithm}`);
      
      // Registrar mudança
      this.logAlgorithmChange(newAlgorithm);
    } catch (error) {
      console.error('Erro na mudança de algoritmo:', error);
    }
  }

  // 10. Análise e relatórios
  async generateAIReport() {
    try {
      const [history, comparison, predictionHistory] = await Promise.all([
        this.api.getAIAnalyticsHistory('7d'),
        this.api.getAlgorithmComparison(),
        this.api.getPredictionHistory()
      ]);

      const report = {
        summary: {
          total_predictions: this.predictionHistory.length,
          average_confidence: this.calculateAverageConfidence(),
          best_algorithm: this.findBestAlgorithm(),
          model_performance: this.modelPerformance
        },
        history,
        comparison,
        predictionHistory,
        recommendations: this.generateRecommendations()
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  // Helpers
  findBestAlgorithm() {
    if (!this.algorithmComparison) return 'round_robin';
    
    let bestAlgo = 'round_robin';
    let bestScore = 0;
    
    for (const [algo, stats] of Object.entries(this.algorithmComparison)) {
      // Score baseado em success rate e tempo de resposta
      const score = stats.success_rate * 100 - stats.avg_response_time * 0.1;
      if (score > bestScore) {
        bestScore = score;
        bestAlgo = algo;
      }
    }
    
    return bestAlgo;
  }

  identifyInefficientBackends(backends) {
    // Lógica para identificar backends ineficientes
    return backends.filter(backend => backend.response_time > 200);
  }

  calculateAverageConfidence() {
    if (this.predictionHistory.length === 0) return 0;
    
    const sum = this.predictionHistory.reduce((acc, entry) => 
      acc + (entry.prediction.confidence || 0), 0);
    return sum / this.predictionHistory.length;
  }

  generateRecommendations() {
    const recommendations = [];
    
    if (this.calculateAverageConfidence() < 0.8) {
      recommendations.push('Considerar retreinamento dos modelos para melhorar confiança');
    }
    
    const bestAlgo = this.findBestAlgorithm();
    if (bestAlgo !== this.aiMetrics?.current_algorithm) {
      recommendations.push(`Considerar mudança para algoritmo: ${bestAlgo}`);
    }
    
    return recommendations;
  }

  logAlgorithmChange(newAlgorithm) {
    console.log(`[${new Date().toISOString()}] Algoritmo alterado para: ${newAlgorithm}`);
  }
}

// Uso
const aiBalancer = new AILoadBalancer();

// Inicializar sistema de IA
aiBalancer.initialize().then(() => {
  console.log('Sistema de IA para balanceamento iniciado');
  
  // Gerar relatório a cada hora
  setInterval(async () => {
    try {
      const report = await aiBalancer.generateAIReport();
      console.log('Relatório de IA gerado:', report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  }, 3600000); // 1 hora
});
```

---

## Cenário 4: Sistema de Billing e Subscriptions

### Objetivo
Implementar um sistema completo de cobrança com planos, subscriptions e webhooks.

### Implementação Completa

```javascript
class BillingSystem {
  constructor() {
    this.api = new VeloFluxAPI('http://localhost:8080');
    this.webhookHandlers = new Map();
  }

  // 1. Gestão de planos e subscriptions
  async createSubscriptionPlan(planData) {
    try {
      // Criar subscription para um tenant
      const subscription = await this.api.createSubscription({
        plan_id: planData.planId,
        billing_cycle: planData.billingCycle, // 'monthly' ou 'yearly'
        payment_method: planData.paymentMethod // 'stripe', 'paypal', etc.
      });

      console.log('Subscription criada:', subscription);
      return subscription;
    } catch (error) {
      console.error('Erro ao criar subscription:', error);
      throw error;
    }
  }

  // 2. Listar e gerenciar subscriptions
  async listSubscriptions(filters = {}) {
    try {
      const subscriptions = await this.api.listSubscriptions();
      
      // Aplicar filtros se necessário
      if (filters.status) {
        return subscriptions.filter(sub => sub.status === filters.status);
      }
      
      if (filters.plan) {
        return subscriptions.filter(sub => sub.plan_id === filters.plan);
      }
      
      return subscriptions;
    } catch (error) {
      console.error('Erro ao listar subscriptions:', error);
      throw error;
    }
  }

  // 3. Atualizar subscription (upgrade/downgrade)
  async updateSubscription(subscriptionId, updateData) {
    try {
      const result = await this.api.updateSubscription(subscriptionId, {
        plan_id: updateData.newPlanId,
        billing_cycle: updateData.billingCycle,
        proration: updateData.proration !== false // Default true
      });

      console.log('Subscription atualizada:', result);
      return result;
    } catch (error) {
      console.error('Erro ao atualizar subscription:', error);
      throw error;
    }
  }

  // 4. Cancelar subscription
  async cancelSubscription(subscriptionId, options = {}) {
    try {
      const result = await this.api.cancelSubscription(subscriptionId);
      
      // Log do cancelamento
      console.log('Subscription cancelada:', {
        id: subscriptionId,
        reason: options.reason || 'Not specified',
        immediate: options.immediate || false,
        timestamp: new Date()
      });
      
      return result;
    } catch (error) {
      console.error('Erro ao cancelar subscription:', error);
      throw error;
    }
  }

  // 5. Gestão de invoices
  async listInvoices(filters = {}) {
    try {
      const invoices = await this.api.listInvoices(filters);
      return invoices;
    } catch (error) {
      console.error('Erro ao listar invoices:', error);
      throw error;
    }
  }

  async getInvoiceDetails(invoiceId) {
    try {
      // Implementar endpoint específico se disponível
      const invoices = await this.api.listInvoices({ invoice_id: invoiceId });
      return invoices.find(inv => inv.id === invoiceId);
    } catch (error) {
      console.error('Erro ao obter detalhes da invoice:', error);
      throw error;
    }
  }

  // 6. Sistema de webhooks para eventos de pagamento
  setupWebhookHandlers() {
    // Handler para pagamento bem-sucedido
    this.webhookHandlers.set('payment_succeeded', async (data) => {
      console.log('Pagamento processado com sucesso:', data);
      
      // Ativar/renovar serviços
      await this.activateServices(data.subscription_id);
      
      // Enviar confirmação por email
      await this.sendPaymentConfirmation(data);
      
      // Atualizar métricas
      await this.updateBillingMetrics(data);
    });

    // Handler para falha no pagamento
    this.webhookHandlers.set('payment_failed', async (data) => {
      console.log('Falha no pagamento:', data);
      
      // Suspender serviços se necessário
      await this.handlePaymentFailure(data);
      
      // Enviar notificação
      await this.sendPaymentFailureNotification(data);
    });

    // Handler para subscription cancelada
    this.webhookHandlers.set('subscription_cancelled', async (data) => {
      console.log('Subscription cancelada:', data);
      
      // Desativar serviços
      await this.deactivateServices(data.subscription_id);
      
      // Cleanup de recursos
      await this.cleanupResources(data);
    });
  }

  // 7. Processamento de webhooks
  async processWebhook(webhookData) {
    try {
      const eventType = webhookData.type;
      const handler = this.webhookHandlers.get(eventType);
      
      if (handler) {
        await handler(webhookData.data);
        return { processed: true, event_type: eventType };
      } else {
        console.warn('Webhook não tratado:', eventType);
        return { processed: false, event_type: eventType };
      }
    } catch (error) {
      console.error('Erro ao processar webhook:', error);
      throw error;
    }
  }

  // 8. Monitoramento de uso e billing
  async getTenantUsageMetrics(tenantId, period = '30d') {
    try {
      const usage = await this.api.getTenantUsage(tenantId);
      
      // Calcular métricas de usage
      const metrics = {
        requests: usage.total_requests || 0,
        bandwidth: usage.total_bandwidth || 0,
        storage: usage.storage_used || 0,
        period: period,
        cost_estimate: this.calculateCostEstimate(usage),
        billing_cycle: usage.billing_cycle || 'monthly'
      };
      
      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas de uso:', error);
      throw error;
    }
  }

  // 9. WebSocket para atualizações de billing
  startBillingMonitoring() {
    const billingWS = this.api.connectBillingWebSocket();
    
    billingWS.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'billing_update') {
        this.updateBillingDashboard(data.data);
      }
    };
    
    billingWS.onerror = (error) => {
      console.error('Erro no WebSocket de billing:', error);
    };
    
    return billingWS;
  }

  // 10. Relatórios de billing
  async generateBillingReport(tenantId, period = 'month') {
    try {
      const [billing, usage, invoices, subscriptions] = await Promise.all([
        this.api.getTenantBilling(tenantId),
        this.api.getTenantUsage(tenantId),
        this.api.listInvoices({ tenant_id: tenantId }),
        this.api.listSubscriptions().then(subs => 
          subs.filter(sub => sub.tenant_id === tenantId))
      ]);

      const report = {
        tenant_id: tenantId,
        period: period,
        summary: {
          total_cost: billing.total_cost || 0,
          current_plan: subscriptions[0]?.plan_id || 'none',
          usage_percentage: this.calculateUsagePercentage(usage),
          next_billing_date: subscriptions[0]?.next_billing_date
        },
        usage_details: usage,
        invoice_history: invoices,
        subscription_details: subscriptions[0],
        cost_breakdown: this.generateCostBreakdown(billing, usage),
        recommendations: this.generateBillingRecommendations(usage, billing)
      };

      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório de billing:', error);
      throw error;
    }
  }

  // Helpers
  async activateServices(subscriptionId) {
    console.log('Ativando serviços para subscription:', subscriptionId);
    // Implementar ativação de serviços
  }

  async deactivateServices(subscriptionId) {
    console.log('Desativando serviços para subscription:', subscriptionId);
    // Implementar desativação de serviços
  }

  async handlePaymentFailure(data) {
    console.log('Tratando falha de pagamento:', data);
    // Implementar lógica de retry, suspensão gradual, etc.
  }

  async sendPaymentConfirmation(data) {
    console.log('Enviando confirmação de pagamento:', data);
    // Implementar envio de email/notificação
  }

  async sendPaymentFailureNotification(data) {
    console.log('Enviando notificação de falha:', data);
    // Implementar notificação de falha
  }

  async updateBillingMetrics(data) {
    console.log('Atualizando métricas de billing:', data);
    // Implementar atualização de métricas
  }

  async cleanupResources(data) {
    console.log('Limpando recursos:', data);
    // Implementar cleanup de recursos
  }

  calculateCostEstimate(usage) {
    // Implementar cálculo de custo baseado no uso
    const baseRate = 0.001; // $0.001 por request
    return (usage.total_requests || 0) * baseRate;
  }

  calculateUsagePercentage(usage) {
    // Implementar cálculo de percentual de uso
    const limit = usage.plan_limits?.requests || 100000;
    return ((usage.total_requests || 0) / limit) * 100;
  }

  generateCostBreakdown(billing, usage) {
    return {
      base_fee: billing.base_fee || 0,
      usage_fee: billing.usage_fee || 0,
      overage_fee: billing.overage_fee || 0,
      total: billing.total_cost || 0
    };
  }

  generateBillingRecommendations(usage, billing) {
    const recommendations = [];
    
    const usagePercentage = this.calculateUsagePercentage(usage);
    
    if (usagePercentage > 80) {
      recommendations.push('Considerar upgrade do plano - uso próximo ao limite');
    }
    
    if (usagePercentage < 20) {
      recommendations.push('Considerar downgrade do plano - baixo uso dos recursos');
    }
    
    if (billing.overage_fee > billing.base_fee) {
      recommendations.push('Alto custo de overage - upgrade recomendado');
    }
    
    return recommendations;
  }

  updateBillingDashboard(data) {
    // Implementar atualização da UI do dashboard
    console.log('Atualizando dashboard de billing:', data);
  }
}

// Uso
const billingSystem = new BillingSystem();

// Configurar sistema de billing
async function setupBillingSystem() {
  // Configurar handlers de webhook
  billingSystem.setupWebhookHandlers();
  
  // Iniciar monitoramento
  billingSystem.startBillingMonitoring();
  
  // Exemplo de criação de subscription
  const subscription = await billingSystem.createSubscriptionPlan({
    planId: 'premium',
    billingCycle: 'monthly',
    paymentMethod: 'stripe'
  });
  
  console.log('Sistema de billing configurado:', subscription);
}

setupBillingSystem();
```

---

## Cenário 5: Gestão de Clusters

### Objetivo
Implementar um sistema para gerenciar clusters de load balancers com alta disponibilidade.

### Implementação Completa

```javascript
class ClusterManager {
  constructor() {
    this.api = new VeloFluxAPI('http://localhost:8080');
    this.clusterInfo = null;
    this.isLeader = false;
    this.nodes = [];
  }

  // 1. Inicialização e descoberta do cluster
  async initialize() {
    try {
      await this.discoverCluster();
      await this.setupClusterMonitoring();
      console.log('Cluster manager inicializado');
    } catch (error) {
      console.error('Erro na inicialização do cluster:', error);
      throw error;
    }
  }

  // 2. Descoberta do cluster
  async discoverCluster() {
    try {
      this.clusterInfo = await this.api.getClusterInfo();
      this.isLeader = this.clusterInfo.is_leader;
      this.nodes = this.clusterInfo.nodes || [];
      
      console.log('Cluster descoberto:', {
        enabled: this.clusterInfo.enabled,
        isLeader: this.isLeader,
        localNode: this.clusterInfo.local_node,
        totalNodes: this.nodes.length
      });
      
      return this.clusterInfo;
    } catch (error) {
      console.error('Erro ao descobrir cluster:', error);
      throw error;
    }
  }

  // 3. Monitoramento do cluster
  async setupClusterMonitoring() {
    // Verificar status do cluster a cada 30 segundos
    setInterval(async () => {
      try {
        await this.checkClusterHealth();
        await this.syncClusterState();
      } catch (error) {
        console.error('Erro no monitoramento do cluster:', error);
      }
    }, 30000);
  }

  // 4. Verificação de saúde do cluster
  async checkClusterHealth() {
    try {
      const previousInfo = this.clusterInfo;
      await this.discoverCluster();
      
      // Verificar mudanças de liderança
      if (previousInfo && previousInfo.is_leader !== this.isLeader) {
        console.log('Mudança de liderança detectada:', {
          previous: previousInfo.is_leader,
          current: this.isLeader
        });
        
        if (this.isLeader) {
          await this.onBecomeLeader();
        } else {
          await this.onLoseLeadership();
        }
      }
      
      // Verificar nodes que saíram ou entraram
      const nodeChanges = this.detectNodeChanges(previousInfo?.nodes || [], this.nodes);
      if (nodeChanges.added.length > 0 || nodeChanges.removed.length > 0) {
        console.log('Mudanças nos nodes detectadas:', nodeChanges);
        await this.onNodeChanges(nodeChanges);
      }
      
    } catch (error) {
      console.error('Erro na verificação de saúde:', error);
    }
  }

  // 5. Sincronização de estado do cluster
  async syncClusterState() {
    if (!this.isLeader) return; // Apenas o líder sincroniza
    
    try {
      // Obter configuração atual
      const config = await this.api.getConfig();
      
      // Sincronizar pools, backends e routes com todos os nodes
      await this.syncPools(config.pools);
      await this.syncBackends();
      await this.syncRoutes(config.routes);
      
    } catch (error) {
      console.error('Erro na sincronização do estado:', error);
    }
  }

  // 6. Sincronização de pools
  async syncPools(pools) {
    for (const pool of pools) {
      try {
        // Verificar se pool existe em todos os nodes
        const poolStatus = await this.checkPoolOnAllNodes(pool.name);
        
        if (!poolStatus.allNodesHave) {
          console.log(`Sincronizando pool ${pool.name} nos nodes`, poolStatus.missingNodes);
          await this.propagatePoolToNodes(pool, poolStatus.missingNodes);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar pool ${pool.name}:`, error);
      }
    }
  }

  // 7. Sincronização de backends
  async syncBackends() {
    try {
      const backends = await this.api.listBackends();
      
      for (const backend of backends) {
        const backendStatus = await this.checkBackendOnAllNodes(backend);
        
        if (!backendStatus.allNodesHave) {
          console.log(`Sincronizando backend ${backend.address}`, backendStatus.missingNodes);
          await this.propagateBackendToNodes(backend, backendStatus.missingNodes);
        }
      }
    } catch (error) {
      console.error('Erro ao sincronizar backends:', error);
    }
  }

  // 8. Sincronização de routes
  async syncRoutes(routes) {
    for (const route of routes) {
      try {
        const routeStatus = await this.checkRouteOnAllNodes(route);
        
        if (!routeStatus.allNodesHave) {
          console.log(`Sincronizando route ${route.host}`, routeStatus.missingNodes);
          await this.propagateRouteToNodes(route, routeStatus.missingNodes);
        }
      } catch (error) {
        console.error(`Erro ao sincronizar route ${route.host}:`, error);
      }
    }
  }

  // 9. Eventos de liderança
  async onBecomeLeader() {
    console.log('Tornando-se líder do cluster');
    
    // Assumir responsabilidades de líder
    await this.assumeLeadershipResponsibilities();
    
    // Forçar sincronização completa
    await this.performFullSync();
  }

  async onLoseLeadership() {
    console.log('Perdendo liderança do cluster');
    
    // Parar operações de líder
    this.stopLeadershipOperations();
  }

  // 10. Eventos de mudança de nodes
  async onNodeChanges(changes) {
    // Nodes adicionados
    for (const node of changes.added) {
      console.log('Novo node adicionado ao cluster:', node);
      await this.onNodeAdded(node);
    }
    
    // Nodes removidos
    for (const node of changes.removed) {
      console.log('Node removido do cluster:', node);
      await this.onNodeRemoved(node);
    }
  }

  async onNodeAdded(node) {
    if (this.isLeader) {
      // Sincronizar novo node com estado atual
      await this.syncNewNode(node);
    }
  }

  async onNodeRemoved(node) {
    if (this.isLeader) {
      // Redistribuir cargas se necessário
      await this.redistributeLoads(node);
    }
  }

  // 11. Operações de configuração distribuída
  async createPoolDistributed(poolData) {
    if (!this.isLeader) {
      throw new Error('Apenas o líder pode criar pools');
    }
    
    try {
      // Criar pool localmente
      const pool = await this.api.createPool(poolData);
      
      // Propagar para todos os nodes
      await this.propagatePoolToNodes(pool, this.nodes.map(n => n.id));
      
      return pool;
    } catch (error) {
      console.error('Erro ao criar pool distribuído:', error);
      throw error;
    }
  }

  async addBackendDistributed(backendData) {
    if (!this.isLeader) {
      throw new Error('Apenas o líder pode adicionar backends');
    }
    
    try {
      // Adicionar backend localmente
      const backend = await this.api.addBackend(backendData);
      
      // Propagar para todos os nodes
      await this.propagateBackendToNodes(backend, this.nodes.map(n => n.id));
      
      return backend;
    } catch (error) {
      console.error('Erro ao adicionar backend distribuído:', error);
      throw error;
    }
  }

  // 12. Relatórios e métricas do cluster
  async getClusterMetrics() {
    try {
      const metrics = {
        cluster_info: this.clusterInfo,
        node_metrics: {},
        overall_health: 'healthy',
        sync_status: 'in_sync',
        last_sync: new Date()
      };
      
      // Coletar métricas de cada node
      for (const node of this.nodes) {
        try {
          const nodeMetrics = await this.getNodeMetrics(node);
          metrics.node_metrics[node.id] = nodeMetrics;
        } catch (error) {
          console.error(`Erro ao obter métricas do node ${node.id}:`, error);
          metrics.node_metrics[node.id] = { error: error.message };
          metrics.overall_health = 'degraded';
        }
      }
      
      return metrics;
    } catch (error) {
      console.error('Erro ao obter métricas do cluster:', error);
      throw error;
    }
  }

  async generateClusterReport() {
    try {
      const [metrics, config] = await Promise.all([
        this.getClusterMetrics(),
        this.api.getConfig()
      ]);
      
      const report = {
        timestamp: new Date(),
        cluster_summary: {
          total_nodes: this.nodes.length,
          healthy_nodes: Object.values(metrics.node_metrics).filter(m => !m.error).length,
          leader_node: this.clusterInfo.local_node,
          cluster_enabled: this.clusterInfo.enabled
        },
        configuration: {
          total_pools: config.pools?.length || 0,
          total_backends: (await this.api.listBackends()).length,
          total_routes: config.routes?.length || 0
        },
        node_details: metrics.node_metrics,
        sync_status: metrics.sync_status,
        recommendations: this.generateClusterRecommendations(metrics)
      };
      
      return report;
    } catch (error) {
      console.error('Erro ao gerar relatório do cluster:', error);
      throw error;
    }
  }

  // Helpers
  detectNodeChanges(previousNodes, currentNodes) {
    const previousIds = new Set(previousNodes.map(n => n.id));
    const currentIds = new Set(currentNodes.map(n => n.id));
    
    const added = currentNodes.filter(n => !previousIds.has(n.id));
    const removed = previousNodes.filter(n => !currentIds.has(n.id));
    
    return { added, removed };
  }

  async checkPoolOnAllNodes(poolName) {
    // Implementar verificação em todos os nodes
    return { allNodesHave: true, missingNodes: [] };
  }

  async checkBackendOnAllNodes(backend) {
    // Implementar verificação em todos os nodes
    return { allNodesHave: true, missingNodes: [] };
  }

  async checkRouteOnAllNodes(route) {
    // Implementar verificação em todos os nodes
    return { allNodesHave: true, missingNodes: [] };
  }

  async propagatePoolToNodes(pool, nodeIds) {
    console.log(`Propagando pool ${pool.name} para nodes:`, nodeIds);
  }

  async propagateBackendToNodes(backend, nodeIds) {
    console.log(`Propagando backend ${backend.address} para nodes:`, nodeIds);
  }

  async propagateRouteToNodes(route, nodeIds) {
    console.log(`Propagando route ${route.host} para nodes:`, nodeIds);
  }

  async assumeLeadershipResponsibilities() {
    console.log('Assumindo responsabilidades de liderança');
  }

  async performFullSync() {
    console.log('Executando sincronização completa');
  }

  stopLeadershipOperations() {
    console.log('Parando operações de liderança');
  }

  async syncNewNode(node) {
    console.log('Sincronizando novo node:', node.id);
  }

  async redistributeLoads(removedNode) {
    console.log('Redistribuindo cargas do node removido:', removedNode.id);
  }

  async getNodeMetrics(node) {
    // Implementar coleta de métricas do node
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100,
      healthy: true
    };
  }

  generateClusterRecommendations(metrics) {
    const recommendations = [];
    
    const healthyNodes = Object.values(metrics.node_metrics).filter(m => !m.error).length;
    const totalNodes = this.nodes.length;
    
    if (healthyNodes < totalNodes * 0.8) {
      recommendations.push('Cluster degradado - verificar nodes com falha');
    }
    
    if (totalNodes < 3) {
      recommendations.push('Considerar adicionar mais nodes para alta disponibilidade');
    }
    
    return recommendations;
  }
}

// Uso
const clusterManager = new ClusterManager();

// Inicializar gerenciamento de cluster
clusterManager.initialize().then(() => {
  console.log('Gerenciamento de cluster ativo');
  
  // Gerar relatório a cada 5 minutos
  setInterval(async () => {
    try {
      const report = await clusterManager.generateClusterReport();
      console.log('Relatório do cluster:', report);
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
    }
  }, 300000); // 5 minutos
});
```

---

## 🎯 Resumo dos Cenários

Estes cinco cenários cobrem os principais casos de uso da API VeloFlux:

1. **Dashboard em Tempo Real**: WebSockets, métricas, monitoramento
2. **Multi-Tenancy**: Isolamento, OIDC, gestão de usuários
3. **IA para Balanceamento**: Machine learning, predições, auto-scaling
4. **Sistema de Billing**: Subscriptions, webhooks, relatórios financeiros
5. **Gestão de Clusters**: Alta disponibilidade, sincronização, failover

Cada implementação demonstra como usar as APIs de forma integrada e eficiente, com tratamento de erros, monitoramento e best practices para produção.
