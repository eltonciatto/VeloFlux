# 🤖 Guia Completo: Consumindo a API de IA do VeloFlux no Frontend

Este documento fornece um guia detalhado sobre como consumir todos os endpoints da API de IA do VeloFlux no frontend, incluindo exemplos práticos de integração e melhores práticas.

## 📋 Índice

1. [Visão Geral da API](#visão-geral-da-api)
2. [Configuração Base](#configuração-base)
3. [Endpoints Principais](#endpoints-principais)
4. [Endpoints Avançados](#endpoints-avançados)
5. [Exemplos de Integração](#exemplos-de-integração)
6. [Tratamento de Erros](#tratamento-de-erros)
7. [Melhores Práticas](#melhores-práticas)
8. [Dashboard de IA](#dashboard-de-ia)

---

## 🎯 Visão Geral da API

A API de IA do VeloFlux oferece funcionalidades completas de machine learning para balanceamento adaptativo, predições em tempo real e análise de performance. Todos os endpoints estão disponíveis sob o prefixo `/api/ai`.

### Base URL
```
http://localhost:8080/api/ai
```

### Autenticação
A API utiliza tokens JWT. Inclua o header de autorização em todas as requisições:
```javascript
headers: {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
}
```

---

## ⚙️ Configuração Base

### Cliente HTTP Base (JavaScript/TypeScript)

```javascript
class VeloFluxAIClient {
  constructor(baseURL = 'http://localhost:8080', token = null) {
    this.baseURL = baseURL;
    this.token = token;
    this.apiBase = `${baseURL}/api/ai`;
  }

  async request(endpoint, options = {}) {
    const url = `${this.apiBase}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error [${endpoint}]:`, error);
      throw error;
    }
  }

  // Métodos de conveniência
  get(endpoint, params = {}) {
    const query = new URLSearchParams(params).toString();
    const url = query ? `${endpoint}?${query}` : endpoint;
    return this.request(url, { method: 'GET' });
  }

  post(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  put(endpoint, data = {}) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}
```

---

## 🔥 Endpoints Principais

### 1. Status e Métricas Gerais

#### `GET /api/ai/status`
Retorna o status geral do sistema de IA.

```javascript
// Exemplo de uso
const client = new VeloFluxAIClient();

async function getAIStatus() {
  try {
    const status = await client.get('/status');
    console.log('AI Status:', status);
    return status;
  } catch (error) {
    console.error('Erro ao obter status:', error);
  }
}

// Exemplo de resposta
{
  "enabled": true,
  "adaptive_balancer": true,
  "current_algorithm": "adaptive_ai",
  "health": "healthy",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

#### `GET /api/ai/metrics`
Obtém métricas completas do sistema de IA.

```javascript
async function getAIMetrics() {
  const metrics = await client.get('/metrics');
  return metrics;
}

// Estrutura da resposta
{
  "enabled": true,
  "current_algorithm": "adaptive_ai",
  "prediction_data": {
    "recommended_algorithm": "adaptive_ai",
    "confidence": 0.92,
    "predicted_load": 145.2,
    "prediction_time": "2024-01-15T10:30:00Z",
    "optimal_backends": ["backend-1", "backend-3"],
    "scaling_recommendation": "scale_up"
  },
  "model_performance": {
    "neural_network": {
      "type": "neural_network",
      "accuracy": 0.94,
      "last_trained": "2024-01-15T08:00:00Z",
      "version": "1.2.0",
      "training_status": "active",
      "predictions_made": 15420
    }
  },
  "recent_requests": [
    {
      "timestamp": "2024-01-15T10:29:55Z",
      "method": "GET",
      "path": "/api/service",
      "response_time": 98.5,
      "status_code": 200,
      "algorithm": "adaptive_ai",
      "backend": "backend-1",
      "ai_confidence": 0.89
    }
  ],
  "algorithm_stats": {
    "adaptive_ai": {
      "request_count": 2100,
      "avg_response_time": 98.7,
      "error_rate": 0.008,
      "success_rate": 0.992,
      "last_used": "2024-01-15T10:30:00Z"
    }
  },
  "last_update": "2024-01-15T10:30:00Z"
}
```

### 2. Predições de IA

#### `GET /api/ai/predictions`
Obtém predições atuais do sistema.

```javascript
async function getCurrentPredictions() {
  const predictions = await client.get('/predictions');
  return predictions;
}

// Resposta esperada
{
  "recommended_algorithm": "adaptive_ai",
  "confidence": 0.92,
  "predicted_load": 145.2,
  "prediction_time": "2024-01-15T10:30:00Z",
  "optimal_backends": ["backend-1", "backend-3"],
  "scaling_recommendation": "scale_up"
}
```

#### `POST /api/ai/predict`
Solicita uma predição específica.

```javascript
async function requestPrediction(inputData) {
  const prediction = await client.post('/predict', inputData);
  return prediction;
}

// Exemplo de uso
const inputData = {
  current_load: 150,
  active_connections: 45,
  response_times: [98, 102, 95, 110],
  timestamp: new Date().toISOString()
};

requestPrediction(inputData);
```

#### `POST /api/ai/predict/batch`
Processa predições em lote.

```javascript
async function batchPredict(batchData) {
  const results = await client.post('/predict/batch', batchData);
  return results;
}

// Exemplo de dados em lote
const batchData = {
  predictions: [
    { load: 120, connections: 30 },
    { load: 180, connections: 50 },
    { load: 95, connections: 25 }
  ],
  model_type: "neural_network",
  include_confidence: true
};
```

### 3. Gestão de Modelos

#### `GET /api/ai/models`
Lista todos os modelos disponíveis.

```javascript
async function listModels() {
  const models = await client.get('/models');
  return models;
}

// Resposta
{
  "neural_network": {
    "type": "neural_network",
    "accuracy": 0.94,
    "last_trained": "2024-01-15T08:00:00Z",
    "version": "1.2.0",
    "training_status": "ready"
  },
  "decision_tree": {
    "type": "decision_tree",
    "accuracy": 0.87,
    "last_trained": "2024-01-14T20:00:00Z",
    "version": "1.1.0",
    "training_status": "ready"
  }
}
```

#### `GET /api/ai/models/{id}`
Obtém informações de um modelo específico.

```javascript
async function getModel(modelId) {
  const model = await client.get(`/models/${modelId}`);
  return model;
}

// Exemplo
const neuralNetworkModel = await getModel('neural_network');
```

#### `POST /api/ai/models`
Implanta um novo modelo.

```javascript
async function deployModel(modelConfig) {
  const result = await client.post('/models', modelConfig);
  return result;
}

// Configuração do modelo
const modelConfig = {
  type: "neural_network",
  version: "1.3.0",
  parameters: {
    layers: [64, 32, 16],
    activation: "relu",
    learning_rate: 0.001
  }
};
```

#### `PUT /api/ai/models/{id}`
Atualiza um modelo existente.

```javascript
async function updateModel(modelId, updateData) {
  const result = await client.put(`/models/${modelId}`, updateData);
  return result;
}
```

#### `DELETE /api/ai/models/{id}`
Remove um modelo.

```javascript
async function deleteModel(modelId) {
  const result = await client.delete(`/models/${modelId}`);
  return result;
}
```

### 4. Configuração da IA

#### `GET /api/ai/config`
Obtém a configuração atual da IA.

```javascript
async function getAIConfig() {
  const config = await client.get('/config');
  return config;
}

// Resposta
{
  "enabled": true,
  "model_type": "neural_network",
  "confidence_threshold": 0.8,
  "application_aware": true,
  "predictive_scaling": true,
  "learning_rate": 0.001,
  "exploration_rate": 0.1
}
```

#### `PUT /api/ai/config`
Atualiza a configuração da IA.

```javascript
async function updateAIConfig(newConfig) {
  const result = await client.put('/config', newConfig);
  return result;
}

// Exemplo de atualização
const newConfig = {
  enabled: true,
  model_type: "neural_network",
  confidence_threshold: 0.85,
  application_aware: true,
  predictive_scaling: true,
  learning_rate: 0.0015,
  exploration_rate: 0.08
};

updateAIConfig(newConfig);
```

---

## 🚀 Endpoints Avançados

### 1. Treinamento de Modelos

#### `POST /api/ai/training/start`
Inicia o treinamento de um modelo.

```javascript
async function startTraining(trainingConfig) {
  const result = await client.post('/training/start', trainingConfig);
  return result;
}

// Configuração de treinamento
const trainingConfig = {
  model_type: "neural_network",
  epochs: 100,
  batch_size: 32,
  validation_split: 0.2,
  early_stopping: true
};
```

#### `POST /api/ai/training/stop`
Para o treinamento em andamento.

```javascript
async function stopTraining(trainingId) {
  const result = await client.post('/training/stop', { training_id: trainingId });
  return result;
}
```

#### `GET /api/ai/training`
Lista todos os treinamentos.

```javascript
async function listTrainings() {
  const trainings = await client.get('/training');
  return trainings;
}
```

#### `GET /api/ai/training/{id}`
Obtém detalhes de um treinamento específico.

```javascript
async function getTraining(trainingId) {
  const training = await client.get(`/training/${trainingId}`);
  return training;
}
```

### 2. Pipelines de IA

#### `GET /api/ai/pipelines`
Lista todos os pipelines.

```javascript
async function listPipelines() {
  const pipelines = await client.get('/pipelines');
  return pipelines;
}
```

#### `POST /api/ai/pipeline`
Cria um novo pipeline.

```javascript
async function createPipeline(pipelineConfig) {
  const pipeline = await client.post('/pipeline', pipelineConfig);
  return pipeline;
}

// Configuração do pipeline
const pipelineConfig = {
  name: "load_prediction_pipeline",
  stages: [
    { type: "data_preprocessing", config: {} },
    { type: "feature_extraction", config: {} },
    { type: "prediction", model: "neural_network" },
    { type: "postprocessing", config: {} }
  ],
  schedule: "*/5 * * * *" // A cada 5 minutos
};
```

#### `GET /api/ai/pipeline/{id}`
Obtém detalhes de um pipeline.

```javascript
async function getPipeline(pipelineId) {
  const pipeline = await client.get(`/pipeline/${pipelineId}`);
  return pipeline;
}
```

#### `PUT /api/ai/pipeline/{id}`
Atualiza um pipeline.

```javascript
async function updatePipeline(pipelineId, updateData) {
  const result = await client.put(`/pipeline/${pipelineId}`, updateData);
  return result;
}
```

#### `DELETE /api/ai/pipeline/{id}`
Remove um pipeline.

```javascript
async function deletePipeline(pipelineId) {
  const result = await client.delete(`/pipeline/${pipelineId}`);
  return result;
}
```

#### `POST /api/ai/pipeline/{id}/run`
Executa um pipeline.

```javascript
async function runPipeline(pipelineId, runConfig = {}) {
  const result = await client.post(`/pipeline/${pipelineId}/run`, runConfig);
  return result;
}
```

### 3. Análise e Histórico

#### `GET /api/ai/algorithm-comparison`
Compara performance dos algoritmos.

```javascript
async function getAlgorithmComparison() {
  const comparison = await client.get('/algorithm-comparison');
  return comparison;
}

// Resposta
{
  "round_robin": {
    "request_count": 1250,
    "avg_response_time": 145.5,
    "error_rate": 0.02,
    "success_rate": 0.98,
    "last_used": "2024-01-15T10:20:00Z"
  },
  "least_conn": {
    "request_count": 890,
    "avg_response_time": 132.2,
    "error_rate": 0.015,
    "success_rate": 0.985,
    "last_used": "2024-01-15T10:25:00Z"
  },
  "adaptive_ai": {
    "request_count": 2100,
    "avg_response_time": 98.7,
    "error_rate": 0.008,
    "success_rate": 0.992,
    "last_used": "2024-01-15T10:30:00Z"
  }
}
```

#### `GET /api/ai/prediction-history`
Obtém histórico de predições.

```javascript
async function getPredictionHistory(timeRange = '1h') {
  const history = await client.get('/prediction-history', { range: timeRange });
  return history;
}
```

#### `GET /api/ai/history`
Obtém dados históricos completos.

```javascript
async function getAIHistory(range = '1h') {
  const history = await client.get('/history', { range });
  return history;
}

// Resposta
{
  "accuracy_history": [
    { "timestamp": "2024-01-15T10:00:00Z", "accuracy": 0.92 },
    { "timestamp": "2024-01-15T10:10:00Z", "accuracy": 0.94 },
    { "timestamp": "2024-01-15T10:20:00Z", "accuracy": 0.91 },
    { "timestamp": "2024-01-15T10:30:00Z", "accuracy": 0.95 }
  ],
  "confidence_history": [
    { "timestamp": "2024-01-15T10:00:00Z", "confidence": 0.87 },
    { "timestamp": "2024-01-15T10:10:00Z", "confidence": 0.89 },
    { "timestamp": "2024-01-15T10:20:00Z", "confidence": 0.85 },
    { "timestamp": "2024-01-15T10:30:00Z", "confidence": 0.92 }
  ],
  "algorithm_usage": [
    { "timestamp": "2024-01-15T10:00:00Z", "algorithm": "round_robin", "count": 45 },
    { "timestamp": "2024-01-15T10:10:00Z", "algorithm": "least_conn", "count": 32 },
    { "timestamp": "2024-01-15T10:20:00Z", "algorithm": "adaptive_ai", "count": 78 },
    { "timestamp": "2024-01-15T10:30:00Z", "algorithm": "adaptive_ai", "count": 92 }
  ]
}
```

### 4. Retreinamento e Manutenção

#### `POST /api/ai/retrain`
Força retreinamento genérico.

```javascript
async function retrainModels(modelType = 'all') {
  const result = await client.post('/retrain', { model_type: modelType });
  return result;
}
```

#### `POST /api/ai/retrain/all`
Retreina todos os modelos.

```javascript
async function retrainAllModels() {
  const result = await client.post('/retrain/all');
  return result;
}
```

#### `POST /api/ai/models/{modelType}/retrain`
Retreina um modelo específico.

```javascript
async function retrainSpecificModel(modelType) {
  const result = await client.post(`/models/${modelType}/retrain`);
  return result;
}

// Exemplo
retrainSpecificModel('neural_network');
```

---

## 🎨 Exemplos de Integração

### Dashboard de Métricas em Tempo Real

```javascript
class AIMetricsDashboard {
  constructor(containerId, client) {
    this.container = document.getElementById(containerId);
    this.client = client;
    this.refreshInterval = 5000; // 5 segundos
    this.intervalId = null;
  }

  async init() {
    await this.renderDashboard();
    this.startAutoRefresh();
  }

  async renderDashboard() {
    try {
      // Obter dados em paralelo
      const [status, metrics, comparison] = await Promise.all([
        this.client.get('/status'),
        this.client.get('/metrics'),
        this.client.get('/algorithm-comparison')
      ]);

      this.container.innerHTML = this.generateHTML(status, metrics, comparison);
      this.attachEventListeners();
    } catch (error) {
      this.container.innerHTML = `<div class="error">Erro ao carregar dashboard: ${error.message}</div>`;
    }
  }

  generateHTML(status, metrics, comparison) {
    return `
      <div class="ai-dashboard">
        <div class="status-panel">
          <h3>Status da IA</h3>
          <div class="status-item ${status.enabled ? 'enabled' : 'disabled'}">
            IA: ${status.enabled ? 'Ativada' : 'Desativada'}
          </div>
          <div class="status-item">
            Algoritmo: ${status.current_algorithm}
          </div>
          <div class="status-item">
            Saúde: ${status.health}
          </div>
        </div>

        <div class="metrics-panel">
          <h3>Métricas de Performance</h3>
          ${this.renderModelPerformance(metrics.model_performance)}
        </div>

        <div class="prediction-panel">
          <h3>Predição Atual</h3>
          ${this.renderPrediction(metrics.prediction_data)}
        </div>

        <div class="algorithm-panel">
          <h3>Comparação de Algoritmos</h3>
          ${this.renderAlgorithmComparison(comparison)}
        </div>

        <div class="controls-panel">
          <h3>Controles</h3>
          <button id="retrain-btn" class="btn-primary">Retreinar Modelos</button>
          <button id="refresh-btn" class="btn-secondary">Atualizar</button>
        </div>
      </div>
    `;
  }

  renderModelPerformance(models) {
    return Object.entries(models).map(([name, model]) => `
      <div class="model-card">
        <h4>${name}</h4>
        <div>Precisão: ${(model.accuracy * 100).toFixed(1)}%</div>
        <div>Versão: ${model.version}</div>
        <div>Status: ${model.training_status}</div>
      </div>
    `).join('');
  }

  renderPrediction(prediction) {
    if (!prediction) return '<div>Nenhuma predição disponível</div>';
    
    return `
      <div class="prediction-card">
        <div>Algoritmo Recomendado: <strong>${prediction.recommended_algorithm}</strong></div>
        <div>Confiança: <strong>${(prediction.confidence * 100).toFixed(1)}%</strong></div>
        <div>Carga Prevista: <strong>${prediction.predicted_load.toFixed(1)}</strong></div>
        <div>Recomendação: <strong>${prediction.scaling_recommendation}</strong></div>
      </div>
    `;
  }

  renderAlgorithmComparison(comparison) {
    return Object.entries(comparison).map(([algorithm, stats]) => `
      <div class="algorithm-card">
        <h4>${algorithm}</h4>
        <div>Requisições: ${stats.request_count}</div>
        <div>Tempo Médio: ${stats.avg_response_time.toFixed(1)}ms</div>
        <div>Taxa de Sucesso: ${(stats.success_rate * 100).toFixed(1)}%</div>
      </div>
    `).join('');
  }

  attachEventListeners() {
    const retrainBtn = document.getElementById('retrain-btn');
    const refreshBtn = document.getElementById('refresh-btn');

    retrainBtn?.addEventListener('click', async () => {
      try {
        retrainBtn.disabled = true;
        retrainBtn.textContent = 'Retreinando...';
        
        await this.client.post('/retrain/all');
        alert('Retreinamento iniciado com sucesso!');
      } catch (error) {
        alert(`Erro no retreinamento: ${error.message}`);
      } finally {
        retrainBtn.disabled = false;
        retrainBtn.textContent = 'Retreinar Modelos';
      }
    });

    refreshBtn?.addEventListener('click', () => {
      this.renderDashboard();
    });
  }

  startAutoRefresh() {
    this.intervalId = setInterval(() => {
      this.renderDashboard();
    }, this.refreshInterval);
  }

  stopAutoRefresh() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Uso do dashboard
const client = new VeloFluxAIClient('http://localhost:8080', 'your-jwt-token');
const dashboard = new AIMetricsDashboard('dashboard-container', client);
dashboard.init();
```

### Sistema de Notificações de IA

```javascript
class AINotificationSystem {
  constructor(client) {
    this.client = client;
    this.lastMetrics = null;
    this.thresholds = {
      accuracy: 0.85,
      confidence: 0.8,
      errorRate: 0.05
    };
  }

  async checkAndNotify() {
    try {
      const metrics = await this.client.get('/metrics');
      
      if (this.lastMetrics) {
        this.checkAccuracyDrop(metrics);
        this.checkHighErrorRate(metrics);
        this.checkLowConfidence(metrics);
      }
      
      this.lastMetrics = metrics;
    } catch (error) {
      this.showNotification('Erro ao verificar métricas de IA', 'error');
    }
  }

  checkAccuracyDrop(metrics) {
    Object.entries(metrics.model_performance).forEach(([modelName, model]) => {
      if (model.accuracy < this.thresholds.accuracy) {
        this.showNotification(
          `Precisão baixa detectada no modelo ${modelName}: ${(model.accuracy * 100).toFixed(1)}%`,
          'warning'
        );
      }
    });
  }

  checkHighErrorRate(metrics) {
    Object.entries(metrics.algorithm_stats).forEach(([algorithm, stats]) => {
      if (stats.error_rate > this.thresholds.errorRate) {
        this.showNotification(
          `Taxa de erro alta no algoritmo ${algorithm}: ${(stats.error_rate * 100).toFixed(1)}%`,
          'error'
        );
      }
    });
  }

  checkLowConfidence(metrics) {
    if (metrics.prediction_data && metrics.prediction_data.confidence < this.thresholds.confidence) {
      this.showNotification(
        `Confiança baixa na predição atual: ${(metrics.prediction_data.confidence * 100).toFixed(1)}%`,
        'warning'
      );
    }
  }

  showNotification(message, type = 'info') {
    // Implementar sistema de notificação (toast, modal, etc.)
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // Exemplo com toast notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 5000);
  }

  startMonitoring(interval = 30000) {
    setInterval(() => {
      this.checkAndNotify();
    }, interval);
  }
}
```

### Configurador Avançado de IA

```javascript
class AIConfigManager {
  constructor(client) {
    this.client = client;
    this.currentConfig = null;
  }

  async loadConfig() {
    try {
      this.currentConfig = await this.client.get('/config');
      return this.currentConfig;
    } catch (error) {
      console.error('Erro ao carregar configuração:', error);
      throw error;
    }
  }

  async updateConfig(newConfig) {
    try {
      const result = await this.client.put('/config', newConfig);
      this.currentConfig = { ...this.currentConfig, ...newConfig };
      return result;
    } catch (error) {
      console.error('Erro ao atualizar configuração:', error);
      throw error;
    }
  }

  renderConfigForm(containerId) {
    const container = document.getElementById(containerId);
    
    container.innerHTML = `
      <form id="ai-config-form" class="config-form">
        <div class="form-group">
          <label>
            <input type="checkbox" id="enabled" ${this.currentConfig?.enabled ? 'checked' : ''}>
            Habilitar IA
          </label>
        </div>

        <div class="form-group">
          <label for="model_type">Tipo de Modelo:</label>
          <select id="model_type">
            <option value="neural_network" ${this.currentConfig?.model_type === 'neural_network' ? 'selected' : ''}>
              Rede Neural
            </option>
            <option value="decision_tree" ${this.currentConfig?.model_type === 'decision_tree' ? 'selected' : ''}>
              Árvore de Decisão
            </option>
            <option value="random_forest" ${this.currentConfig?.model_type === 'random_forest' ? 'selected' : ''}>
              Random Forest
            </option>
          </select>
        </div>

        <div class="form-group">
          <label for="confidence_threshold">Limite de Confiança:</label>
          <input type="range" id="confidence_threshold" 
                 min="0.5" max="1.0" step="0.01" 
                 value="${this.currentConfig?.confidence_threshold || 0.8}">
          <span id="confidence_value">${this.currentConfig?.confidence_threshold || 0.8}</span>
        </div>

        <div class="form-group">
          <label for="learning_rate">Taxa de Aprendizado:</label>
          <input type="range" id="learning_rate" 
                 min="0.0001" max="0.01" step="0.0001" 
                 value="${this.currentConfig?.learning_rate || 0.001}">
          <span id="learning_rate_value">${this.currentConfig?.learning_rate || 0.001}</span>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="application_aware" ${this.currentConfig?.application_aware ? 'checked' : ''}>
            Consciente da Aplicação
          </label>
        </div>

        <div class="form-group">
          <label>
            <input type="checkbox" id="predictive_scaling" ${this.currentConfig?.predictive_scaling ? 'checked' : ''}>
            Escalonamento Preditivo
          </label>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn-primary">Salvar Configuração</button>
          <button type="button" id="reset-btn" class="btn-secondary">Resetar</button>
        </div>
      </form>
    `;

    this.attachConfigHandlers();
  }

  attachConfigHandlers() {
    const form = document.getElementById('ai-config-form');
    const confidenceSlider = document.getElementById('confidence_threshold');
    const learningRateSlider = document.getElementById('learning_rate');
    const resetBtn = document.getElementById('reset-btn');

    // Atualizar valores em tempo real
    confidenceSlider.addEventListener('input', (e) => {
      document.getElementById('confidence_value').textContent = e.target.value;
    });

    learningRateSlider.addEventListener('input', (e) => {
      document.getElementById('learning_rate_value').textContent = e.target.value;
    });

    // Submissão do formulário
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData(form);
      const config = {
        enabled: document.getElementById('enabled').checked,
        model_type: document.getElementById('model_type').value,
        confidence_threshold: parseFloat(document.getElementById('confidence_threshold').value),
        learning_rate: parseFloat(document.getElementById('learning_rate').value),
        application_aware: document.getElementById('application_aware').checked,
        predictive_scaling: document.getElementById('predictive_scaling').checked
      };

      try {
        await this.updateConfig(config);
        alert('Configuração salva com sucesso!');
      } catch (error) {
        alert(`Erro ao salvar configuração: ${error.message}`);
      }
    });

    // Reset
    resetBtn.addEventListener('click', async () => {
      if (confirm('Deseja resetar para as configurações padrão?')) {
        await this.loadConfig();
        this.renderConfigForm('config-container');
      }
    });
  }
}
```

---

## ⚠️ Tratamento de Erros

### Wrapper de Tratamento de Erro

```javascript
class AIErrorHandler {
  static handle(error, context = '') {
    console.error(`AI API Error ${context}:`, error);

    switch (error.status) {
      case 400:
        return { message: 'Requisição inválida', type: 'validation' };
      case 401:
        return { message: 'Token de autenticação inválido', type: 'auth' };
      case 403:
        return { message: 'Acesso negado', type: 'permission' };
      case 404:
        return { message: 'Endpoint não encontrado', type: 'not_found' };
      case 503:
        return { message: 'Sistema de IA indisponível', type: 'service_unavailable' };
      default:
        return { message: 'Erro interno do servidor', type: 'server_error' };
    }
  }

  static async withRetry(apiCall, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await apiCall();
      } catch (error) {
        if (attempt === maxRetries || error.status < 500) {
          throw error;
        }
        
        console.warn(`Tentativa ${attempt} falhou, tentando novamente em ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= 2; // Backoff exponencial
      }
    }
  }
}

// Exemplo de uso
async function safeGetMetrics(client) {
  try {
    return await AIErrorHandler.withRetry(() => client.get('/metrics'));
  } catch (error) {
    const handled = AIErrorHandler.handle(error, 'getMetrics');
    console.error('Erro ao obter métricas:', handled.message);
    return null;
  }
}
```

---

## 📊 Dashboard de IA

### HTML Structure

```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VeloFlux AI Dashboard</title>
    <style>
        .ai-dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            padding: 20px;
        }
        
        .panel {
            background: white;
            border-radius: 8px;
            padding: 20px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .status-enabled { color: #28a745; }
        .status-disabled { color: #dc3545; }
        .status-warning { color: #ffc107; }
        
        .model-card, .algorithm-card, .prediction-card {
            background: #f8f9fa;
            padding: 15px;
            margin: 10px 0;
            border-radius: 4px;
            border-left: 4px solid #007bff;
        }
        
        .btn-primary {
            background: #007bff;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .btn-secondary {
            background: #6c757d;
            color: white;
            border: none;
            padding: 10px 20px;
            border-radius: 4px;
            cursor: pointer;
        }
        
        .config-form .form-group {
            margin-bottom: 15px;
        }
        
        .config-form label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        
        .config-form input, .config-form select {
            width: 100%;
            padding: 8px;
            border: 1px solid #ddd;
            border-radius: 4px;
        }
        
        .notification {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px;
            border-radius: 4px;
            color: white;
            z-index: 1000;
        }
        
        .notification-info { background: #17a2b8; }
        .notification-warning { background: #ffc107; color: #212529; }
        .notification-error { background: #dc3545; }
    </style>
</head>
<body>
    <div id="dashboard-container"></div>
    
    <script src="veloflux-ai-client.js"></script>
    <script>
        // Inicialização do dashboard
        document.addEventListener('DOMContentLoaded', async () => {
            const client = new VeloFluxAIClient('http://localhost:8080', localStorage.getItem('jwt_token'));
            const dashboard = new AIMetricsDashboard('dashboard-container', client);
            
            try {
                await dashboard.init();
                
                // Iniciar sistema de notificações
                const notificationSystem = new AINotificationSystem(client);
                notificationSystem.startMonitoring();
                
            } catch (error) {
                console.error('Erro ao inicializar dashboard:', error);
                document.getElementById('dashboard-container').innerHTML = 
                    '<div class="error">Erro ao conectar com a API de IA</div>';
            }
        });
    </script>
</body>
</html>
```

---

## 📋 Melhores Práticas

### 1. **Performance e Cache**

```javascript
class AIClientWithCache extends VeloFluxAIClient {
  constructor(baseURL, token) {
    super(baseURL, token);
    this.cache = new Map();
    this.cacheTTL = 30000; // 30 segundos
  }

  async get(endpoint, params = {}) {
    const cacheKey = `${endpoint}-${JSON.stringify(params)}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < this.cacheTTL) {
      return cached.data;
    }

    const data = await super.get(endpoint, params);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });

    return data;
  }
}
```

### 2. **Polling Inteligente**

```javascript
class SmartPoller {
  constructor(client, endpoint, callback, options = {}) {
    this.client = client;
    this.endpoint = endpoint;
    this.callback = callback;
    this.baseInterval = options.baseInterval || 5000;
    this.maxInterval = options.maxInterval || 30000;
    this.currentInterval = this.baseInterval;
    this.errorCount = 0;
    this.isPolling = false;
  }

  start() {
    if (this.isPolling) return;
    this.isPolling = true;
    this.poll();
  }

  stop() {
    this.isPolling = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
  }

  async poll() {
    if (!this.isPolling) return;

    try {
      const data = await this.client.get(this.endpoint);
      this.callback(data, null);
      
      // Reset interval on success
      this.currentInterval = this.baseInterval;
      this.errorCount = 0;
      
    } catch (error) {
      this.errorCount++;
      this.callback(null, error);
      
      // Increase interval on errors (exponential backoff)
      this.currentInterval = Math.min(
        this.currentInterval * 1.5,
        this.maxInterval
      );
    }

    this.timeoutId = setTimeout(() => this.poll(), this.currentInterval);
  }
}

// Uso
const poller = new SmartPoller(
  client,
  '/metrics',
  (data, error) => {
    if (error) {
      console.error('Polling error:', error);
    } else {
      updateDashboard(data);
    }
  },
  { baseInterval: 5000, maxInterval: 30000 }
);

poller.start();
```

### 3. **Validação de Dados**

```javascript
class AIDataValidator {
  static validateConfig(config) {
    const errors = [];

    if (typeof config.enabled !== 'boolean') {
      errors.push('enabled deve ser boolean');
    }

    if (config.confidence_threshold < 0 || config.confidence_threshold > 1) {
      errors.push('confidence_threshold deve estar entre 0 e 1');
    }

    if (config.learning_rate <= 0 || config.learning_rate > 1) {
      errors.push('learning_rate deve estar entre 0 e 1');
    }

    const validModelTypes = ['neural_network', 'decision_tree', 'random_forest'];
    if (!validModelTypes.includes(config.model_type)) {
      errors.push(`model_type deve ser um de: ${validModelTypes.join(', ')}`);
    }

    return errors;
  }

  static validatePredictionInput(input) {
    const errors = [];

    if (typeof input.current_load !== 'number' || input.current_load < 0) {
      errors.push('current_load deve ser um número positivo');
    }

    if (typeof input.active_connections !== 'number' || input.active_connections < 0) {
      errors.push('active_connections deve ser um número positivo');
    }

    if (!Array.isArray(input.response_times)) {
      errors.push('response_times deve ser um array');
    }

    return errors;
  }
}
```

---

## 🎯 Conclusão

Esta documentação fornece um guia completo para consumir a API de IA do VeloFlux no frontend. As funcionalidades incluem:

- ✅ **Monitoramento em tempo real** de métricas e status
- ✅ **Gestão completa de modelos** ML
- ✅ **Configuração dinâmica** da IA
- ✅ **Predições e análises** avançadas
- ✅ **Pipelines de processamento** automatizados
- ✅ **Sistema de notificações** inteligente
- ✅ **Dashboard interativo** com atualizações em tempo real

### Próximos Passos:

1. **Implementar autenticação JWT** no frontend
2. **Criar componentes React/Vue** reutilizáveis
3. **Adicionar visualizações gráficas** (Chart.js, D3.js)
4. **Implementar WebSocket** para atualizações em tempo real
5. **Adicionar testes** automatizados para os clientes

### Recursos Adicionais:

- 📖 [Documentação da API REST](./API_DOCUMENTATION_COMPLETE.md)
- 🔧 [Guia de Configuração](./configuration.md)
- 🤖 [Recursos de IA/ML](./ai_ml_features_pt-BR.md)
- 🚀 [Deploy em Produção](./DEPLOY_PRODUCTION_COMPLETE.md)

---

> 💡 **Dica**: Para desenvolvimento, use o cliente com cache e polling inteligente para otimizar performance e reduzir carga no servidor.
