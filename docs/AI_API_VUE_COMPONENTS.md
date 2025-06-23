# 🎯 Componentes Vue.js para API de IA do VeloFlux

Este documento fornece exemplos específicos de componentes Vue.js 3 (Composition API) para integração com a API de IA do VeloFlux.

## 📦 Instalação de Dependências

```bash
npm install vue@^3.0.0 axios pinia vue-router @vueuse/core chart.js vue-chartjs
```

## 🔧 Configuração Base

### Store Pinia para Estado Global

```typescript
// stores/aiStore.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8080';

interface AIStatus {
  enabled: boolean;
  adaptive_balancer: boolean;
  current_algorithm: string;
  health: string;
  timestamp: string;
}

interface AIMetrics {
  enabled: boolean;
  current_algorithm: string;
  prediction_data?: any;
  model_performance: Record<string, any>;
  recent_requests: any[];
  algorithm_stats: Record<string, any>;
  last_update: string;
}

interface AIConfig {
  enabled: boolean;
  model_type: string;
  confidence_threshold: number;
  application_aware: boolean;
  predictive_scaling: boolean;
  learning_rate: number;
  exploration_rate: number;
}

export const useAIStore = defineStore('ai', () => {
  // Estado
  const status = ref<AIStatus | null>(null);
  const metrics = ref<AIMetrics | null>(null);
  const config = ref<AIConfig | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  // Token de autenticação
  const token = ref<string | null>(localStorage.getItem('jwt_token'));

  // Cliente HTTP configurado
  const apiClient = axios.create({
    baseURL: `${API_BASE}/api/ai`,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // Interceptor para adicionar token
  apiClient.interceptors.request.use((config) => {
    if (token.value) {
      config.headers.Authorization = `Bearer ${token.value}`;
    }
    return config;
  });

  // Getters computados
  const isAIEnabled = computed(() => status.value?.enabled || false);
  const currentAlgorithm = computed(() => status.value?.current_algorithm || 'unknown');
  const isHealthy = computed(() => status.value?.health === 'healthy');

  // Ações
  const setToken = (newToken: string) => {
    token.value = newToken;
    localStorage.setItem('jwt_token', newToken);
  };

  const fetchStatus = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.get('/status');
      status.value = response.data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Erro ao buscar status:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchMetrics = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.get('/metrics');
      metrics.value = response.data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Erro ao buscar métricas:', err);
    } finally {
      loading.value = false;
    }
  };

  const fetchConfig = async () => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.get('/config');
      config.value = response.data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Erro ao buscar configuração:', err);
    } finally {
      loading.value = false;
    }
  };

  const updateConfig = async (newConfig: Partial<AIConfig>) => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.put('/config', newConfig);
      config.value = { ...config.value, ...newConfig };
      return response.data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Erro ao atualizar configuração:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const retrainModels = async (modelType: string = 'all') => {
    try {
      loading.value = true;
      error.value = null;
      const response = await apiClient.post('/retrain', { model_type: modelType });
      return response.data;
    } catch (err: any) {
      error.value = err.message;
      console.error('Erro ao retreinar modelos:', err);
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const getAlgorithmComparison = async () => {
    try {
      const response = await apiClient.get('/algorithm-comparison');
      return response.data;
    } catch (err: any) {
      console.error('Erro ao buscar comparação de algoritmos:', err);
      throw err;
    }
  };

  const getPredictionHistory = async (range: string = '1h') => {
    try {
      const response = await apiClient.get('/prediction-history', { params: { range } });
      return response.data;
    } catch (err: any) {
      console.error('Erro ao buscar histórico de predições:', err);
      throw err;
    }
  };

  return {
    // Estado
    status,
    metrics,
    config,
    loading,
    error,
    token,
    
    // Getters
    isAIEnabled,
    currentAlgorithm,
    isHealthy,
    
    // Ações
    setToken,
    fetchStatus,
    fetchMetrics,
    fetchConfig,
    updateConfig,
    retrainModels,
    getAlgorithmComparison,
    getPredictionHistory,
  };
});
```

### Composable para Auto-refresh

```typescript
// composables/useAutoRefresh.ts
import { ref, onMounted, onUnmounted } from 'vue';

export function useAutoRefresh(callback: () => Promise<void>, interval: number = 5000) {
  const isRefreshing = ref(false);
  let refreshTimer: NodeJS.Timeout | null = null;

  const startRefresh = () => {
    if (refreshTimer) return;
    
    refreshTimer = setInterval(async () => {
      if (!isRefreshing.value) {
        isRefreshing.value = true;
        try {
          await callback();
        } finally {
          isRefreshing.value = false;
        }
      }
    }, interval);
  };

  const stopRefresh = () => {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  };

  onMounted(() => {
    callback(); // Execução inicial
    startRefresh();
  });

  onUnmounted(stopRefresh);

  return {
    isRefreshing,
    startRefresh,
    stopRefresh,
  };
}
```

## 🏠 Componentes Dashboard

### Status Card

```vue
<!-- components/AIStatusCard.vue -->
<template>
  <div class="ai-status-card">
    <div class="card-header">
      <h3 class="card-title">
        <BrainIcon class="icon" />
        Status da IA
      </h3>
    </div>
    
    <div class="card-content">
      <div v-if="aiStore.loading" class="loading">
        <div class="skeleton"></div>
        <div class="skeleton"></div>
        <div class="skeleton"></div>
      </div>
      
      <div v-else-if="aiStore.error" class="error">
        Erro ao carregar status: {{ aiStore.error }}
      </div>
      
      <div v-else class="status-content">
        <div class="status-item">
          <span class="label">Status:</span>
          <span :class="['badge', { 'badge-success': aiStore.isAIEnabled, 'badge-secondary': !aiStore.isAIEnabled }]">
            {{ aiStore.isAIEnabled ? 'Ativo' : 'Inativo' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="label">Algoritmo:</span>
          <span class="value">{{ aiStore.currentAlgorithm }}</span>
        </div>
        
        <div class="status-item">
          <span class="label">Saúde:</span>
          <div class="health-indicator">
            <ActivityIcon :class="['health-icon', { 'healthy': aiStore.isHealthy }]" />
            <span>{{ aiStore.status?.health }}</span>
          </div>
        </div>
        
        <div class="timestamp">
          Atualizado: {{ formatTimestamp(aiStore.status?.timestamp) }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAIStore } from '../stores/aiStore';
import { useAutoRefresh } from '../composables/useAutoRefresh';
import BrainIcon from './icons/BrainIcon.vue';
import ActivityIcon from './icons/ActivityIcon.vue';

const aiStore = useAIStore();

// Auto-refresh a cada 5 segundos
useAutoRefresh(() => aiStore.fetchStatus(), 5000);

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '';
  return new Date(timestamp).toLocaleTimeString();
};
</script>

<style scoped>
.ai-status-card {
  @apply bg-white rounded-lg shadow-md p-6;
}

.card-header {
  @apply flex items-center justify-between mb-4;
}

.card-title {
  @apply text-lg font-semibold flex items-center;
}

.icon {
  @apply w-5 h-5 mr-2;
}

.loading {
  @apply space-y-2;
}

.skeleton {
  @apply h-4 bg-gray-200 rounded animate-pulse;
}

.error {
  @apply text-red-500 text-sm;
}

.status-content {
  @apply space-y-3;
}

.status-item {
  @apply flex items-center justify-between;
}

.label {
  @apply text-sm text-gray-600;
}

.value {
  @apply text-sm font-medium;
}

.badge {
  @apply px-2 py-1 text-xs rounded-full;
}

.badge-success {
  @apply bg-green-100 text-green-800;
}

.badge-secondary {
  @apply bg-gray-100 text-gray-800;
}

.health-indicator {
  @apply flex items-center;
}

.health-icon {
  @apply w-3 h-3 mr-1;
}

.health-icon.healthy {
  @apply text-green-500;
}

.timestamp {
  @apply text-xs text-gray-500 mt-3;
}
</style>
```

### Métricas Card

```vue
<!-- components/AIMetricsCard.vue -->
<template>
  <div class="ai-metrics-card">
    <div class="card-header">
      <h3 class="card-title">
        <TrendingUpIcon class="icon" />
        Métricas de Performance
      </h3>
    </div>
    
    <div class="card-content">
      <div v-if="aiStore.loading" class="loading">
        <div v-for="i in 3" :key="i" class="skeleton-block"></div>
      </div>
      
      <div v-else class="metrics-content">
        <!-- Predição Atual -->
        <div v-if="prediction" class="prediction-section">
          <h4 class="section-title">
            <TargetIcon class="section-icon" />
            Predição Atual
          </h4>
          <div class="prediction-card">
            <div class="prediction-item">
              <span class="label">Algoritmo:</span>
              <span class="value">{{ prediction.recommended_algorithm }}</span>
            </div>
            <div class="prediction-item">
              <span class="label">Confiança:</span>
              <span class="value">{{ (prediction.confidence * 100).toFixed(1) }}%</span>
            </div>
            <div class="progress-bar">
              <div 
                class="progress-fill" 
                :style="{ width: `${prediction.confidence * 100}%` }"
              ></div>
            </div>
            <div class="prediction-item">
              <span class="label">Carga Prevista:</span>
              <span class="value">{{ prediction.predicted_load.toFixed(1) }}</span>
            </div>
          </div>
        </div>

        <!-- Performance dos Modelos -->
        <div class="models-section">
          <h4 class="section-title">Modelos Ativos</h4>
          <div class="models-grid">
            <div 
              v-for="[name, model] in Object.entries(models)" 
              :key="name"
              class="model-card"
            >
              <div class="model-header">
                <span class="model-name">{{ name }}</span>
                <span class="model-version">{{ model.version }}</span>
              </div>
              <div class="model-accuracy">
                <span class="label">Precisão:</span>
                <span class="value">{{ (model.accuracy * 100).toFixed(1) }}%</span>
              </div>
              <div class="progress-bar small">
                <div 
                  class="progress-fill" 
                  :style="{ width: `${model.accuracy * 100}%` }"
                ></div>
              </div>
              <div class="model-date">
                <ClockIcon class="date-icon" />
                Treino: {{ formatDate(model.last_trained) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useAIStore } from '../stores/aiStore';
import { useAutoRefresh } from '../composables/useAutoRefresh';
import TrendingUpIcon from './icons/TrendingUpIcon.vue';
import TargetIcon from './icons/TargetIcon.vue';
import ClockIcon from './icons/ClockIcon.vue';

const aiStore = useAIStore();

// Auto-refresh a cada 10 segundos
useAutoRefresh(() => aiStore.fetchMetrics(), 10000);

const prediction = computed(() => aiStore.metrics?.prediction_data);
const models = computed(() => aiStore.metrics?.model_performance || {});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString();
};
</script>

<style scoped>
.ai-metrics-card {
  @apply bg-white rounded-lg shadow-md p-6;
}

.card-header {
  @apply mb-4;
}

.card-title {
  @apply text-lg font-semibold flex items-center;
}

.icon {
  @apply w-5 h-5 mr-2;
}

.loading {
  @apply space-y-4;
}

.skeleton-block {
  @apply h-20 bg-gray-200 rounded animate-pulse;
}

.metrics-content {
  @apply space-y-6;
}

.section-title {
  @apply font-medium text-sm flex items-center mb-3;
}

.section-icon {
  @apply w-4 h-4 mr-2;
}

.prediction-card {
  @apply bg-blue-50 p-4 rounded-lg space-y-2;
}

.prediction-item {
  @apply flex justify-between items-center;
}

.label {
  @apply text-sm text-gray-600;
}

.value {
  @apply text-sm font-medium;
}

.progress-bar {
  @apply w-full bg-gray-200 rounded-full h-2;
}

.progress-bar.small {
  @apply h-1;
}

.progress-fill {
  @apply bg-blue-500 h-full rounded-full transition-all duration-300;
}

.models-grid {
  @apply space-y-3;
}

.model-card {
  @apply border rounded-lg p-3 space-y-2;
}

.model-header {
  @apply flex justify-between items-center;
}

.model-name {
  @apply font-medium text-sm;
}

.model-version {
  @apply text-xs bg-gray-100 px-2 py-1 rounded;
}

.model-accuracy {
  @apply flex justify-between;
}

.model-date {
  @apply text-xs text-gray-500 flex items-center;
}

.date-icon {
  @apply w-3 h-3 mr-1;
}
</style>
```

### Gráfico de Comparação

```vue
<!-- components/AlgorithmComparisonChart.vue -->
<template>
  <div class="algorithm-chart">
    <div class="card-header">
      <h3 class="card-title">Comparação de Algoritmos</h3>
    </div>
    
    <div class="card-content">
      <div v-if="loading" class="loading">
        <div class="chart-skeleton"></div>
      </div>
      
      <div v-else-if="error" class="error">
        Erro ao carregar dados: {{ error }}
      </div>
      
      <div v-else>
        <Bar 
          :data="chartData" 
          :options="chartOptions"
          style="height: 300px;"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { Bar } from 'vue-chartjs';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { useAIStore } from '../stores/aiStore';

// Registrar componentes do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const aiStore = useAIStore();
const loading = ref(false);
const error = ref<string | null>(null);
const comparisonData = ref<any>(null);

const chartData = computed(() => {
  if (!comparisonData.value) return { labels: [], datasets: [] };

  const labels = Object.keys(comparisonData.value).map(name => 
    name.replace('_', ' ').toUpperCase()
  );

  const responseTimeData = Object.values(comparisonData.value).map((stats: any) => 
    stats.avg_response_time
  );

  const successRateData = Object.values(comparisonData.value).map((stats: any) => 
    stats.success_rate * 100
  );

  return {
    labels,
    datasets: [
      {
        label: 'Tempo Médio (ms)',
        data: responseTimeData,
        backgroundColor: 'rgba(136, 132, 216, 0.8)',
        borderColor: 'rgba(136, 132, 216, 1)',
        borderWidth: 1,
      },
      {
        label: 'Taxa de Sucesso (%)',
        data: successRateData,
        backgroundColor: 'rgba(130, 202, 157, 0.8)',
        borderColor: 'rgba(130, 202, 157, 1)',
        borderWidth: 1,
      },
    ],
  };
});

const chartOptions = computed(() => ({
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    y: {
      beginAtZero: true,
    },
  },
  plugins: {
    legend: {
      position: 'top' as const,
    },
    title: {
      display: false,
    },
  },
}));

const fetchComparison = async () => {
  try {
    loading.value = true;
    error.value = null;
    comparisonData.value = await aiStore.getAlgorithmComparison();
  } catch (err: any) {
    error.value = err.message;
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchComparison();
  
  // Atualizar a cada 30 segundos
  setInterval(fetchComparison, 30000);
});
</script>

<style scoped>
.algorithm-chart {
  @apply bg-white rounded-lg shadow-md p-6;
}

.card-header {
  @apply mb-4;
}

.card-title {
  @apply text-lg font-semibold;
}

.loading {
  @apply flex justify-center items-center;
}

.chart-skeleton {
  @apply w-full h-64 bg-gray-200 rounded animate-pulse;
}

.error {
  @apply text-red-500 text-center py-8;
}
</style>
```

### Formulário de Configuração

```vue
<!-- components/AIConfigForm.vue -->
<template>
  <div class="ai-config-form">
    <div class="card-header">
      <h3 class="card-title">
        <SettingsIcon class="icon" />
        Configuração da IA
      </h3>
    </div>
    
    <div class="card-content">
      <form @submit.prevent="handleSubmit" class="config-form">
        <!-- Habilitar IA -->
        <div class="form-group">
          <label class="switch-label">
            Habilitar IA
            <input 
              v-model="formData.enabled" 
              type="checkbox" 
              class="switch"
            >
            <span class="slider"></span>
          </label>
        </div>

        <!-- Tipo de Modelo -->
        <div class="form-group">
          <label class="label">Tipo de Modelo</label>
          <select v-model="formData.model_type" class="select">
            <option value="neural_network">Rede Neural</option>
            <option value="decision_tree">Árvore de Decisão</option>
            <option value="random_forest">Random Forest</option>
          </select>
        </div>

        <!-- Limite de Confiança -->
        <div class="form-group">
          <label class="label">
            Limite de Confiança: {{ (formData.confidence_threshold * 100).toFixed(0) }}%
          </label>
          <input 
            v-model.number="formData.confidence_threshold"
            type="range" 
            min="0.5" 
            max="1" 
            step="0.01"
            class="range"
          >
        </div>

        <!-- Taxa de Aprendizado -->
        <div class="form-group">
          <label class="label">
            Taxa de Aprendizado: {{ formData.learning_rate.toFixed(4) }}
          </label>
          <input 
            v-model.number="formData.learning_rate"
            type="range" 
            min="0.0001" 
            max="0.01" 
            step="0.0001"
            class="range"
          >
        </div>

        <!-- Consciente da Aplicação -->
        <div class="form-group">
          <label class="switch-label">
            Consciente da Aplicação
            <input 
              v-model="formData.application_aware" 
              type="checkbox" 
              class="switch"
            >
            <span class="slider"></span>
          </label>
        </div>

        <!-- Escalonamento Preditivo -->
        <div class="form-group">
          <label class="switch-label">
            Escalonamento Preditivo
            <input 
              v-model="formData.predictive_scaling" 
              type="checkbox" 
              class="switch"
            >
            <span class="slider"></span>
          </label>
        </div>

        <!-- Botões -->
        <div class="form-actions">
          <button 
            type="submit" 
            :disabled="isUpdating"
            class="btn btn-primary"
          >
            <SaveIcon v-if="!isUpdating" class="btn-icon" />
            <RefreshIcon v-else class="btn-icon animate-spin" />
            {{ isUpdating ? 'Salvando...' : 'Salvar' }}
          </button>
          
          <button 
            type="button" 
            @click="resetForm"
            class="btn btn-secondary"
          >
            Resetar
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { useAIStore } from '../stores/aiStore';
import SettingsIcon from './icons/SettingsIcon.vue';
import SaveIcon from './icons/SaveIcon.vue';
import RefreshIcon from './icons/RefreshIcon.vue';

const aiStore = useAIStore();
const isUpdating = ref(false);

const formData = reactive({
  enabled: false,
  model_type: 'neural_network',
  confidence_threshold: 0.8,
  application_aware: false,
  predictive_scaling: false,
  learning_rate: 0.001,
  exploration_rate: 0.1,
});

// Sincronizar com o store
watch(
  () => aiStore.config,
  (newConfig) => {
    if (newConfig) {
      Object.assign(formData, newConfig);
    }
  },
  { immediate: true }
);

const handleSubmit = async () => {
  try {
    isUpdating.value = true;
    await aiStore.updateConfig(formData);
    
    // Mostrar notificação de sucesso
    showNotification('Configuração salva com sucesso!', 'success');
  } catch (error) {
    showNotification('Erro ao salvar configuração', 'error');
  } finally {
    isUpdating.value = false;
  }
};

const resetForm = () => {
  if (aiStore.config) {
    Object.assign(formData, aiStore.config);
    showNotification('Configuração resetada', 'info');
  }
};

const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
  // Implementar sistema de notificação
  console.log(`[${type.toUpperCase()}] ${message}`);
};

onMounted(() => {
  aiStore.fetchConfig();
});
</script>

<style scoped>
.ai-config-form {
  @apply bg-white rounded-lg shadow-md p-6;
}

.card-header {
  @apply mb-6;
}

.card-title {
  @apply text-lg font-semibold flex items-center;
}

.icon {
  @apply w-5 h-5 mr-2;
}

.config-form {
  @apply space-y-6;
}

.form-group {
  @apply space-y-2;
}

.label {
  @apply block text-sm font-medium text-gray-700;
}

.select {
  @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500;
}

.range {
  @apply w-full;
}

.switch-label {
  @apply flex items-center justify-between cursor-pointer;
}

.switch {
  @apply sr-only;
}

.slider {
  @apply relative inline-block w-10 h-6 bg-gray-300 rounded-full transition-colors;
}

.switch:checked + .slider {
  @apply bg-blue-600;
}

.slider::before {
  @apply absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform;
  content: '';
}

.switch:checked + .slider::before {
  @apply transform translate-x-4;
}

.form-actions {
  @apply flex space-x-3 pt-4;
}

.btn {
  @apply px-4 py-2 rounded-md font-medium transition-colors flex items-center;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50;
}

.btn-secondary {
  @apply bg-gray-600 text-white hover:bg-gray-700;
}

.btn-icon {
  @apply w-4 h-4 mr-2;
}
</style>
```

## 🏗️ Layout Principal

### Dashboard Principal

```vue
<!-- views/AIDashboard.vue -->
<template>
  <div class="ai-dashboard">
    <div class="dashboard-header">
      <h1 class="page-title">
        <BrainIcon class="title-icon" />
        Dashboard de IA
      </h1>
    </div>

    <div class="dashboard-tabs">
      <nav class="tab-nav">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          :class="['tab-button', { active: activeTab === tab.id }]"
        >
          <component :is="tab.icon" class="tab-icon" />
          {{ tab.label }}
        </button>
      </nav>

      <div class="tab-content">
        <!-- Visão Geral -->
        <div v-if="activeTab === 'overview'" class="tab-panel">
          <div class="dashboard-grid">
            <AIStatusCard />
            <AIMetricsCard />
          </div>
          <div class="chart-section">
            <AlgorithmComparisonChart />
          </div>
        </div>

        <!-- Análises -->
        <div v-if="activeTab === 'analytics'" class="tab-panel">
          <AIHistoryChart />
        </div>

        <!-- Configuração -->
        <div v-if="activeTab === 'config'" class="tab-panel">
          <div class="config-section">
            <AIConfigForm />
          </div>
        </div>

        <!-- Modelos -->
        <div v-if="activeTab === 'models'" class="tab-panel">
          <div class="models-section">
            <p class="placeholder">Gestão de modelos em desenvolvimento...</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import AIStatusCard from '../components/AIStatusCard.vue';
import AIMetricsCard from '../components/AIMetricsCard.vue';
import AlgorithmComparisonChart from '../components/AlgorithmComparisonChart.vue';
import AIHistoryChart from '../components/AIHistoryChart.vue';
import AIConfigForm from '../components/AIConfigForm.vue';
import BrainIcon from '../components/icons/BrainIcon.vue';
import BarChartIcon from '../components/icons/BarChartIcon.vue';
import HistoryIcon from '../components/icons/HistoryIcon.vue';
import SettingsIcon from '../components/icons/SettingsIcon.vue';

const activeTab = ref('overview');

const tabs = [
  { id: 'overview', label: 'Visão Geral', icon: BarChartIcon },
  { id: 'analytics', label: 'Análises', icon: HistoryIcon },
  { id: 'config', label: 'Configuração', icon: SettingsIcon },
  { id: 'models', label: 'Modelos', icon: BrainIcon },
];
</script>

<style scoped>
.ai-dashboard {
  @apply p-6 space-y-6;
}

.dashboard-header {
  @apply flex items-center justify-between;
}

.page-title {
  @apply text-3xl font-bold flex items-center;
}

.title-icon {
  @apply w-8 h-8 mr-3;
}

.dashboard-tabs {
  @apply w-full;
}

.tab-nav {
  @apply flex border-b border-gray-200;
}

.tab-button {
  @apply px-6 py-3 font-medium text-gray-500 hover:text-gray-700 flex items-center border-b-2 border-transparent;
}

.tab-button.active {
  @apply text-blue-600 border-blue-600;
}

.tab-icon {
  @apply w-4 h-4 mr-2;
}

.tab-content {
  @apply mt-6;
}

.tab-panel {
  @apply space-y-6;
}

.dashboard-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}

.chart-section {
  @apply grid grid-cols-1 lg:grid-cols-2 gap-6;
}

.config-section {
  @apply max-w-2xl;
}

.models-section {
  @apply text-center text-gray-500 py-8;
}

.placeholder {
  @apply text-lg;
}
</style>
```

## 🚀 App Principal

### App.vue

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
    <NotificationContainer />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useAIStore } from './stores/aiStore';
import NotificationContainer from './components/NotificationContainer.vue';

const aiStore = useAIStore();

onMounted(() => {
  // Verificar token no localStorage
  const token = localStorage.getItem('jwt_token');
  if (token) {
    aiStore.setToken(token);
  }
});
</script>

<style>
@import 'tailwindcss/base';
@import 'tailwindcss/components';
@import 'tailwindcss/utilities';

#app {
  @apply min-h-screen bg-gray-50;
}
</style>
```

### main.ts

```typescript
// main.ts
import { createApp } from 'vue';
import { createPinia } from 'pinia';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import AIDashboard from './views/AIDashboard.vue';

const routes = [
  { path: '/', redirect: '/ai' },
  { path: '/ai', component: AIDashboard },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

const pinia = createPinia();

const app = createApp(App);

app.use(pinia);
app.use(router);

app.mount('#app');
```

## 📦 Package.json

```json
{
  "name": "veloflux-ai-dashboard",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vue-tsc --noEmit && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "vue": "^3.3.0",
    "vue-router": "^4.2.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0",
    "@vueuse/core": "^10.1.0",
    "chart.js": "^4.3.0",
    "vue-chartjs": "^5.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-vue": "^4.2.0",
    "typescript": "^5.0.0",
    "vue-tsc": "^1.6.0",
    "vite": "^4.3.0",
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## 🎯 Uso Completo

```bash
# Instalar dependências
npm install

# Configurar variável de ambiente
echo "VITE_API_BASE=http://localhost:8080" > .env.local

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

Estes componentes Vue.js fornecem uma interface completa e moderna para a API de IA do VeloFlux, incluindo:

- ✅ **Store Pinia** para gerenciamento de estado global
- ✅ **Composables** reutilizáveis para lógica comum
- ✅ **Auto-refresh** inteligente com intervalos configuráveis
- ✅ **Componentes reativos** com TypeScript
- ✅ **Design responsivo** com Tailwind CSS
- ✅ **Gráficos interativos** com Chart.js
- ✅ **Sistema de notificações** integrado

### Recursos Principais:
1. **Estado global** com Pinia para sincronização entre componentes
2. **Auto-refresh** configurável para dados em tempo real  
3. **Tratamento de erros** robusto e consistente
4. **Interface moderna** e responsiva
5. **TypeScript** para type safety
6. **Composables** para reutilização de lógica

Esta implementação Vue.js complementa perfeitamente os exemplos React fornecidos anteriormente, oferecendo aos desenvolvedores flexibilidade na escolha do framework frontend.
