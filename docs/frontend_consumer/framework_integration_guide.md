# ⚛️ Guia de Integração Frontend - VeloFlux API

Este guia mostra como integrar a API VeloFlux com os principais frameworks frontend.

## 📋 Índice

1. [React Integration](#react-integration)
2. [Vue.js Integration](#vuejs-integration)
3. [Angular Integration](#angular-integration)
4. [Vanilla JavaScript](#vanilla-javascript)
5. [WebSocket Hooks/Composables](#websocket-hookscomposables)
6. [Estado Global](#estado-global)

---

## React Integration

### Configuração Inicial

```bash
npm install axios @tanstack/react-query
```

### API Service (React)

```typescript
// src/services/veloflux-api.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080';

class VeloFluxAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('veloflux_token');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return axios.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: { email: string; password: string }) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, credentials);
    this.token = response.data.token;
    localStorage.setItem('veloflux_token', this.token);
    return response.data;
  }

  async refreshToken() {
    try {
      const response = await axios.post(`${this.baseURL}/api/auth/refresh`);
      this.token = response.data.token;
      localStorage.setItem('veloflux_token', this.token);
      return response.data;
    } catch (error) {
      this.logout();
      throw error;
    }
  }

  logout() {
    this.token = null;
    localStorage.removeItem('veloflux_token');
  }

  // Core APIs
  async getPools() {
    const response = await axios.get(`${this.baseURL}/api/pools`);
    return response.data;
  }

  async getBackends(filters = {}) {
    const response = await axios.get(`${this.baseURL}/api/backends`, { params: filters });
    return response.data;
  }

  async addBackend(backendData: any) {
    const response = await axios.post(`${this.baseURL}/api/backends`, backendData);
    return response.data;
  }

  async deleteBackend(backendId: string) {
    await axios.delete(`${this.baseURL}/api/backends/${backendId}`);
  }

  // AI APIs
  async getAIMetrics(options = {}) {
    const response = await axios.get(`${this.baseURL}/api/ai/metrics`, { params: options });
    return response.data;
  }

  async startAITraining(options = {}) {
    const response = await axios.post(`${this.baseURL}/api/ai/training/start`, null, { params: options });
    return response.data;
  }

  // WebSocket connections
  createWebSocket(endpoint: string) {
    const wsUrl = this.baseURL.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/api/ws/${endpoint}`);
  }
}

export const api = new VeloFluxAPI();
```

### React Hooks

```typescript
// src/hooks/useVeloFlux.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/veloflux-api';

// Pools
export const usePools = () => {
  return useQuery({
    queryKey: ['pools'],
    queryFn: api.getPools,
    staleTime: 30000,
  });
};

// Backends
export const useBackends = (filters = {}) => {
  return useQuery({
    queryKey: ['backends', filters],
    queryFn: () => api.getBackends(filters),
    staleTime: 15000,
  });
};

export const useAddBackend = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.addBackend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backends'] });
      queryClient.invalidateQueries({ queryKey: ['pools'] });
    },
  });
};

export const useDeleteBackend = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteBackend,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backends'] });
    },
  });
};

// AI Metrics
export const useAIMetrics = (options = {}) => {
  return useQuery({
    queryKey: ['ai-metrics', options],
    queryFn: () => api.getAIMetrics(options),
    refetchInterval: 10000, // Atualizar a cada 10 segundos
  });
};

export const useStartAITraining = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.startAITraining,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-metrics'] });
    },
  });
};
```

### WebSocket Hook

```typescript
// src/hooks/useWebSocket.ts
import { useEffect, useRef, useState } from 'react';
import { api } from '../services/veloflux-api';

export const useWebSocket = (endpoint: string) => {
  const [data, setData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const connectWebSocket = () => {
      try {
        wsRef.current = api.createWebSocket(endpoint);
        
        wsRef.current.onopen = () => {
          setIsConnected(true);
          setError(null);
        };
        
        wsRef.current.onmessage = (event) => {
          const parsedData = JSON.parse(event.data);
          setData(parsedData);
        };
        
        wsRef.current.onerror = (error) => {
          setError(error);
          setIsConnected(false);
        };
        
        wsRef.current.onclose = () => {
          setIsConnected(false);
          // Reconnect after 3 seconds
          setTimeout(connectWebSocket, 3000);
        };
      } catch (error) {
        setError(error);
      }
    };

    connectWebSocket();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [endpoint]);

  return { data, isConnected, error };
};

// Hooks específicos
export const useMetricsWebSocket = () => useWebSocket('metrics');
export const useBackendsWebSocket = () => useWebSocket('backends');
export const useStatusWebSocket = () => useWebSocket('status');
```

### Componentes React

```tsx
// src/components/Dashboard.tsx
import React from 'react';
import { usePools, useBackends, useAIMetrics } from '../hooks/useVeloFlux';
import { useMetricsWebSocket } from '../hooks/useWebSocket';
import { MetricsChart } from './MetricsChart';
import { BackendsList } from './BackendsList';
import { AIStatus } from './AIStatus';

export const Dashboard: React.FC = () => {
  const { data: pools, isLoading: poolsLoading } = usePools();
  const { data: backends, isLoading: backendsLoading } = useBackends();
  const { data: aiMetrics, isLoading: aiLoading } = useAIMetrics();
  const { data: realtimeMetrics, isConnected } = useMetricsWebSocket();

  if (poolsLoading || backendsLoading || aiLoading) {
    return <div className="loading">Carregando dashboard...</div>;
  }

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>VeloFlux Dashboard</h1>
        <div className="connection-status">
          WebSocket: {isConnected ? '🟢 Conectado' : '🔴 Desconectado'}
        </div>
      </header>
      
      <div className="dashboard-grid">
        <section className="metrics-section">
          <h2>Métricas em Tempo Real</h2>
          <MetricsChart data={realtimeMetrics?.data} />
        </section>
        
        <section className="backends-section">
          <h2>Backends ({backends?.length || 0})</h2>
          <BackendsList backends={backends} />
        </section>
        
        <section className="ai-section">
          <h2>Status da IA</h2>
          <AIStatus metrics={aiMetrics} />
        </section>
        
        <section className="pools-section">
          <h2>Pools ({pools?.length || 0})</h2>
          <div className="pools-grid">
            {pools?.map((pool: any) => (
              <div key={pool.name} className="pool-card">
                <h3>{pool.name}</h3>
                <p>Algoritmo: {pool.algorithm}</p>
                <p>Backends: {pool.backends?.length || 0}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};
```

```tsx
// src/components/BackendsList.tsx
import React from 'react';
import { useAddBackend, useDeleteBackend } from '../hooks/useVeloFlux';

interface Backend {
  id: string;
  address: string;
  pool: string;
  weight: number;
  healthy?: boolean;
}

interface Props {
  backends: Backend[];
}

export const BackendsList: React.FC<Props> = ({ backends }) => {
  const addBackend = useAddBackend();
  const deleteBackend = useDeleteBackend();

  const handleAddBackend = async () => {
    try {
      await addBackend.mutateAsync({
        address: '127.0.0.1:8081',
        pool: 'default',
        weight: 1,
        health_check: {
          path: '/health',
          interval: '30s',
          timeout: '5s',
          expected_status: 200
        }
      });
    } catch (error) {
      console.error('Erro ao adicionar backend:', error);
    }
  };

  const handleDeleteBackend = async (backendId: string) => {
    try {
      await deleteBackend.mutateAsync(backendId);
    } catch (error) {
      console.error('Erro ao deletar backend:', error);
    }
  };

  return (
    <div className="backends-list">
      <div className="backends-header">
        <button 
          onClick={handleAddBackend}
          disabled={addBackend.isPending}
          className="add-backend-btn"
        >
          {addBackend.isPending ? 'Adicionando...' : 'Adicionar Backend'}
        </button>
      </div>
      
      <div className="backends-grid">
        {backends?.map((backend) => (
          <div 
            key={backend.id} 
            className={`backend-card ${backend.healthy ? 'healthy' : 'unhealthy'}`}
          >
            <div className="backend-info">
              <h4>{backend.address}</h4>
              <p>Pool: {backend.pool}</p>
              <p>Weight: {backend.weight}</p>
              <p>Status: {backend.healthy ? 'Healthy' : 'Unhealthy'}</p>
            </div>
            
            <button
              onClick={() => handleDeleteBackend(backend.id)}
              disabled={deleteBackend.isPending}
              className="delete-btn"
            >
              🗑️
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
```

---

## Vue.js Integration

### Configuração Inicial

```bash
npm install axios pinia @vueuse/core
```

### API Service (Vue)

```typescript
// src/services/veloflux-api.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export class VeloFluxAPI {
  private baseURL: string;
  private token: string | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.token = localStorage.getItem('veloflux_token');
    this.setupInterceptors();
  }

  private setupInterceptors() {
    axios.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          await this.refreshToken();
          return axios.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  async login(credentials: { email: string; password: string }) {
    const response = await axios.post(`${this.baseURL}/api/auth/login`, credentials);
    this.token = response.data.token;
    localStorage.setItem('veloflux_token', this.token);
    return response.data;
  }

  async getPools() {
    const response = await axios.get(`${this.baseURL}/api/pools`);
    return response.data;
  }

  async getAIMetrics(options = {}) {
    const response = await axios.get(`${this.baseURL}/api/ai/metrics`, { params: options });
    return response.data;
  }

  createWebSocket(endpoint: string) {
    const wsUrl = this.baseURL.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/api/ws/${endpoint}`);
  }
}

export const api = new VeloFluxAPI();
```

### Pinia Store (Vue)

```typescript
// src/stores/veloflux.ts
import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { api } from '../services/veloflux-api';

export const useVeloFluxStore = defineStore('veloflux', () => {
  // State
  const pools = ref([]);
  const backends = ref([]);
  const aiMetrics = ref(null);
  const realtimeMetrics = ref(null);
  const isLoading = ref(false);
  const error = ref(null);

  // Getters
  const totalBackends = computed(() => backends.value.length);
  const healthyBackends = computed(() => 
    backends.value.filter(b => b.healthy).length
  );
  const aiEnabled = computed(() => aiMetrics.value?.enabled || false);

  // Actions
  async function fetchPools() {
    try {
      isLoading.value = true;
      pools.value = await api.getPools();
    } catch (err) {
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchBackends(filters = {}) {
    try {
      isLoading.value = true;
      backends.value = await api.getBackends(filters);
    } catch (err) {
      error.value = err;
    } finally {
      isLoading.value = false;
    }
  }

  async function fetchAIMetrics(options = {}) {
    try {
      aiMetrics.value = await api.getAIMetrics(options);
    } catch (err) {
      error.value = err;
    }
  }

  async function addBackend(backendData) {
    try {
      await api.addBackend(backendData);
      await fetchBackends(); // Refresh list
    } catch (err) {
      error.value = err;
      throw err;
    }
  }

  function updateRealtimeMetrics(data) {
    realtimeMetrics.value = data;
  }

  return {
    // State
    pools,
    backends,
    aiMetrics,
    realtimeMetrics,
    isLoading,
    error,
    
    // Getters
    totalBackends,
    healthyBackends,
    aiEnabled,
    
    // Actions
    fetchPools,
    fetchBackends,
    fetchAIMetrics,
    addBackend,
    updateRealtimeMetrics
  };
});
```

### Composables (Vue)

```typescript
// src/composables/useWebSocket.ts
import { ref, onMounted, onUnmounted } from 'vue';
import { api } from '../services/veloflux-api';

export function useWebSocket(endpoint: string) {
  const data = ref(null);
  const isConnected = ref(false);
  const error = ref(null);
  let ws: WebSocket | null = null;

  const connect = () => {
    try {
      ws = api.createWebSocket(endpoint);
      
      ws.onopen = () => {
        isConnected.value = true;
        error.value = null;
      };
      
      ws.onmessage = (event) => {
        data.value = JSON.parse(event.data);
      };
      
      ws.onerror = (err) => {
        error.value = err;
        isConnected.value = false;
      };
      
      ws.onclose = () => {
        isConnected.value = false;
        // Reconnect after 3 seconds
        setTimeout(connect, 3000);
      };
    } catch (err) {
      error.value = err;
    }
  };

  const disconnect = () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  };

  onMounted(connect);
  onUnmounted(disconnect);

  return { data, isConnected, error, connect, disconnect };
}

// Composables específicos
export const useMetricsWebSocket = () => useWebSocket('metrics');
export const useBackendsWebSocket = () => useWebSocket('backends');
```

### Componentes Vue

```vue
<!-- src/components/Dashboard.vue -->
<template>
  <div class="dashboard">
    <header class="dashboard-header">
      <h1>VeloFlux Dashboard</h1>
      <div class="connection-status">
        WebSocket: 
        <span :class="{ connected: isConnected, disconnected: !isConnected }">
          {{ isConnected ? '🟢 Conectado' : '🔴 Desconectado' }}
        </span>
      </div>
    </header>
    
    <div class="dashboard-grid">
      <section class="metrics-section">
        <h2>Métricas em Tempo Real</h2>
        <MetricsChart :data="realtimeMetrics?.data" />
      </section>
      
      <section class="backends-section">
        <h2>Backends ({{ totalBackends }})</h2>
        <BackendsList />
      </section>
      
      <section class="ai-section">
        <h2>Status da IA</h2>
        <AIStatus :metrics="aiMetrics" />
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, computed } from 'vue';
import { useVeloFluxStore } from '../stores/veloflux';
import { useMetricsWebSocket } from '../composables/useWebSocket';
import MetricsChart from './MetricsChart.vue';
import BackendsList from './BackendsList.vue';
import AIStatus from './AIStatus.vue';

const store = useVeloFluxStore();
const { data: metricsData, isConnected } = useMetricsWebSocket();

// Computed
const totalBackends = computed(() => store.totalBackends);
const aiMetrics = computed(() => store.aiMetrics);
const realtimeMetrics = computed(() => metricsData.value);

// Watch for realtime metrics updates
watch(metricsData, (newData) => {
  if (newData) {
    store.updateRealtimeMetrics(newData);
  }
});

onMounted(async () => {
  await Promise.all([
    store.fetchPools(),
    store.fetchBackends(),
    store.fetchAIMetrics()
  ]);
});
</script>

<style scoped>
.dashboard {
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.connection-status .connected {
  color: green;
}

.connection-status .disconnected {
  color: red;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
}
</style>
```

---

## Angular Integration

### Configuração Inicial

```bash
ng add @ngrx/store @ngrx/effects
npm install rxjs
```

### API Service (Angular)

```typescript
// src/app/services/veloflux-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VeloFluxApiService {
  private baseUrl = environment.apiUrl || 'http://localhost:8080';
  private tokenSubject = new BehaviorSubject<string | null>(null);

  constructor(private http: HttpClient) {
    const token = localStorage.getItem('veloflux_token');
    if (token) {
      this.tokenSubject.next(token);
    }
  }

  private getHeaders(): HttpHeaders {
    const token = this.tokenSubject.value;
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  login(credentials: { email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/auth/login`, credentials);
  }

  setToken(token: string): void {
    localStorage.setItem('veloflux_token', token);
    this.tokenSubject.next(token);
  }

  getPools(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/pools`, {
      headers: this.getHeaders()
    });
  }

  getBackends(filters: any = {}): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/backends`, {
      headers: this.getHeaders(),
      params: filters
    });
  }

  addBackend(backendData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/api/backends`, backendData, {
      headers: this.getHeaders()
    });
  }

  getAIMetrics(options: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/api/ai/metrics`, {
      headers: this.getHeaders(),
      params: options
    });
  }

  createWebSocket(endpoint: string): WebSocket {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/api/ws/${endpoint}`);
  }
}
```

### WebSocket Service (Angular)

```typescript
// src/app/services/websocket.service.ts
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { VeloFluxApiService } from './veloflux-api.service';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private connections = new Map<string, WebSocket>();
  private subjects = new Map<string, Subject<any>>();

  constructor(private apiService: VeloFluxApiService) {}

  connect(endpoint: string): Observable<any> {
    if (this.subjects.has(endpoint)) {
      return this.subjects.get(endpoint)!.asObservable();
    }

    const subject = new Subject<any>();
    this.subjects.set(endpoint, subject);

    const ws = this.apiService.createWebSocket(endpoint);
    this.connections.set(endpoint, ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      subject.next(data);
    };

    ws.onerror = (error) => {
      subject.error(error);
    };

    ws.onclose = () => {
      subject.complete();
      this.cleanup(endpoint);
      
      // Reconnect after 3 seconds
      setTimeout(() => this.connect(endpoint), 3000);
    };

    return subject.asObservable();
  }

  disconnect(endpoint: string): void {
    const ws = this.connections.get(endpoint);
    if (ws) {
      ws.close();
    }
    this.cleanup(endpoint);
  }

  private cleanup(endpoint: string): void {
    this.connections.delete(endpoint);
    this.subjects.delete(endpoint);
  }
}
```

### NgRx Store (Angular)

```typescript
// src/app/store/veloflux.actions.ts
import { createAction, props } from '@ngrx/store';

export const loadPools = createAction('[VeloFlux] Load Pools');
export const loadPoolsSuccess = createAction('[VeloFlux] Load Pools Success', props<{ pools: any[] }>());
export const loadPoolsFailure = createAction('[VeloFlux] Load Pools Failure', props<{ error: any }>());

export const loadBackends = createAction('[VeloFlux] Load Backends');
export const loadBackendsSuccess = createAction('[VeloFlux] Load Backends Success', props<{ backends: any[] }>());

export const updateRealtimeMetrics = createAction('[VeloFlux] Update Realtime Metrics', props<{ metrics: any }>());

// src/app/store/veloflux.reducer.ts
import { createReducer, on } from '@ngrx/store';
import * as VeloFluxActions from './veloflux.actions';

export interface VeloFluxState {
  pools: any[];
  backends: any[];
  realtimeMetrics: any;
  loading: boolean;
  error: any;
}

const initialState: VeloFluxState = {
  pools: [],
  backends: [],
  realtimeMetrics: null,
  loading: false,
  error: null
};

export const veloFluxReducer = createReducer(
  initialState,
  on(VeloFluxActions.loadPools, state => ({ ...state, loading: true })),
  on(VeloFluxActions.loadPoolsSuccess, (state, { pools }) => ({ 
    ...state, 
    pools, 
    loading: false 
  })),
  on(VeloFluxActions.loadPoolsFailure, (state, { error }) => ({ 
    ...state, 
    error, 
    loading: false 
  })),
  on(VeloFluxActions.updateRealtimeMetrics, (state, { metrics }) => ({
    ...state,
    realtimeMetrics: metrics
  }))
);

// src/app/store/veloflux.effects.ts
import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { VeloFluxApiService } from '../services/veloflux-api.service';
import * as VeloFluxActions from './veloflux.actions';

@Injectable()
export class VeloFluxEffects {
  loadPools$ = createEffect(() =>
    this.actions$.pipe(
      ofType(VeloFluxActions.loadPools),
      mergeMap(() =>
        this.apiService.getPools().pipe(
          map(pools => VeloFluxActions.loadPoolsSuccess({ pools })),
          catchError(error => of(VeloFluxActions.loadPoolsFailure({ error })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private apiService: VeloFluxApiService
  ) {}
}
```

### Componente Angular

```typescript
// src/app/components/dashboard/dashboard.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscription } from 'rxjs';
import { WebSocketService } from '../../services/websocket.service';
import * as VeloFluxActions from '../../store/veloflux.actions';
import { VeloFluxState } from '../../store/veloflux.reducer';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  pools$: Observable<any[]>;
  backends$: Observable<any[]>;
  realtimeMetrics$: Observable<any>;
  loading$: Observable<boolean>;
  
  private wsSubscription?: Subscription;

  constructor(
    private store: Store<{ veloflux: VeloFluxState }>,
    private wsService: WebSocketService
  ) {
    this.pools$ = this.store.select(state => state.veloflux.pools);
    this.backends$ = this.store.select(state => state.veloflux.backends);
    this.realtimeMetrics$ = this.store.select(state => state.veloflux.realtimeMetrics);
    this.loading$ = this.store.select(state => state.veloflux.loading);
  }

  ngOnInit(): void {
    // Load initial data
    this.store.dispatch(VeloFluxActions.loadPools());
    this.store.dispatch(VeloFluxActions.loadBackends());

    // Connect to WebSocket
    this.wsSubscription = this.wsService.connect('metrics').subscribe(
      data => {
        this.store.dispatch(VeloFluxActions.updateRealtimeMetrics({ metrics: data }));
      }
    );
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    this.wsService.disconnect('metrics');
  }
}
```

```html
<!-- src/app/components/dashboard/dashboard.component.html -->
<div class="dashboard">
  <header class="dashboard-header">
    <h1>VeloFlux Dashboard</h1>
  </header>
  
  <div class="dashboard-content" *ngIf="!(loading$ | async)">
    <section class="metrics-section">
      <h2>Métricas em Tempo Real</h2>
      <app-metrics-chart [data]="(realtimeMetrics$ | async)?.data"></app-metrics-chart>
    </section>
    
    <section class="pools-section">
      <h2>Pools</h2>
      <div class="pools-grid">
        <div 
          *ngFor="let pool of pools$ | async" 
          class="pool-card"
        >
          <h3>{{ pool.name }}</h3>
          <p>Algoritmo: {{ pool.algorithm }}</p>
          <p>Backends: {{ pool.backends?.length || 0 }}</p>
        </div>
      </div>
    </section>
    
    <section class="backends-section">
      <h2>Backends</h2>
      <app-backends-list [backends]="backends$ | async"></app-backends-list>
    </section>
  </div>
  
  <div *ngIf="loading$ | async" class="loading">
    Carregando dashboard...
  </div>
</div>
```

---

## Vanilla JavaScript

### Implementação Vanilla

```javascript
// js/veloflux-api.js
class VeloFluxAPI {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('veloflux_token');
  }

  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }
    
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const config = {
      headers: this.getHeaders(),
      ...options
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async login(credentials) {
    const data = await this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
    
    this.token = data.token;
    localStorage.setItem('veloflux_token', this.token);
    return data;
  }

  async getPools() {
    return await this.request('/api/pools');
  }

  async getBackends(filters = {}) {
    const params = new URLSearchParams(filters);
    return await this.request(`/api/backends?${params}`);
  }

  createWebSocket(endpoint) {
    const wsUrl = this.baseUrl.replace('http', 'ws');
    return new WebSocket(`${wsUrl}/api/ws/${endpoint}`);
  }
}

// js/dashboard.js
class Dashboard {
  constructor() {
    this.api = new VeloFluxAPI();
    this.websockets = {};
    this.initialize();
  }

  async initialize() {
    await this.loadInitialData();
    this.setupWebSockets();
    this.setupEventListeners();
  }

  async loadInitialData() {
    try {
      const [pools, backends] = await Promise.all([
        this.api.getPools(),
        this.api.getBackends()
      ]);

      this.renderPools(pools);
      this.renderBackends(backends);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  }

  setupWebSockets() {
    // Metrics WebSocket
    this.websockets.metrics = this.api.createWebSocket('metrics');
    this.websockets.metrics.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.updateMetrics(data.data);
    };

    // Backends WebSocket
    this.websockets.backends = this.api.createWebSocket('backends');
    this.websockets.backends.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.renderBackends(data.data);
    };
  }

  renderPools(pools) {
    const container = document.getElementById('pools-container');
    container.innerHTML = pools.map(pool => `
      <div class="pool-card">
        <h3>${pool.name}</h3>
        <p>Algoritmo: ${pool.algorithm}</p>
        <p>Backends: ${pool.backends?.length || 0}</p>
      </div>
    `).join('');
  }

  renderBackends(backends) {
    const container = document.getElementById('backends-container');
    container.innerHTML = backends.map(backend => `
      <div class="backend-card ${backend.healthy ? 'healthy' : 'unhealthy'}">
        <h4>${backend.address}</h4>
        <p>Pool: ${backend.pool}</p>
        <p>Weight: ${backend.weight}</p>
        <p>Status: ${backend.healthy ? 'Healthy' : 'Unhealthy'}</p>
        <button onclick="dashboard.deleteBackend('${backend.id}')">Delete</button>
      </div>
    `).join('');
  }

  updateMetrics(metrics) {
    document.getElementById('cpu-usage').textContent = `${metrics.cpu?.toFixed(1)}%`;
    document.getElementById('memory-usage').textContent = `${metrics.memory?.toFixed(1)}%`;
    document.getElementById('request-count').textContent = metrics.requests || 0;
  }

  async deleteBackend(backendId) {
    try {
      await this.api.request(`/api/backends/${backendId}`, {
        method: 'DELETE'
      });
      // A UI será atualizada via WebSocket
    } catch (error) {
      console.error('Erro ao deletar backend:', error);
    }
  }

  setupEventListeners() {
    // Event listeners para interações da UI
  }
}

// Inicializar dashboard
const dashboard = new Dashboard();
```

```html
<!-- index.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VeloFlux Dashboard</title>
    <link rel="stylesheet" href="css/styles.css">
</head>
<body>
    <div class="dashboard">
        <header class="dashboard-header">
            <h1>VeloFlux Dashboard</h1>
        </header>
        
        <div class="dashboard-grid">
            <section class="metrics-section">
                <h2>Métricas</h2>
                <div class="metrics-grid">
                    <div class="metric-card">
                        <h3>CPU</h3>
                        <span id="cpu-usage">0%</span>
                    </div>
                    <div class="metric-card">
                        <h3>Memória</h3>
                        <span id="memory-usage">0%</span>
                    </div>
                    <div class="metric-card">
                        <h3>Requests</h3>
                        <span id="request-count">0</span>
                    </div>
                </div>
            </section>
            
            <section class="pools-section">
                <h2>Pools</h2>
                <div id="pools-container" class="pools-grid"></div>
            </section>
            
            <section class="backends-section">
                <h2>Backends</h2>
                <div id="backends-container" class="backends-grid"></div>
            </section>
        </div>
    </div>

    <script src="js/veloflux-api.js"></script>
    <script src="js/dashboard.js"></script>
</body>
</html>
```

---

## Estado Global

### Implementação com Zustand (React)

```typescript
// src/stores/veloflux-store.ts
import { create } from 'zustand';
import { api } from '../services/veloflux-api';

interface VeloFluxState {
  // State
  pools: any[];
  backends: any[];
  aiMetrics: any;
  realtimeMetrics: any;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchPools: () => Promise<void>;
  fetchBackends: (filters?: any) => Promise<void>;
  fetchAIMetrics: (options?: any) => Promise<void>;
  addBackend: (backendData: any) => Promise<void>;
  deleteBackend: (backendId: string) => Promise<void>;
  updateRealtimeMetrics: (metrics: any) => void;
  clearError: () => void;
}

export const useVeloFluxStore = create<VeloFluxState>((set, get) => ({
  // Initial state
  pools: [],
  backends: [],
  aiMetrics: null,
  realtimeMetrics: null,
  isLoading: false,
  error: null,

  // Actions
  fetchPools: async () => {
    set({ isLoading: true, error: null });
    try {
      const pools = await api.getPools();
      set({ pools, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchBackends: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const backends = await api.getBackends(filters);
      set({ backends, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAIMetrics: async (options = {}) => {
    try {
      const aiMetrics = await api.getAIMetrics(options);
      set({ aiMetrics });
    } catch (error) {
      set({ error: error.message });
    }
  },

  addBackend: async (backendData) => {
    try {
      await api.addBackend(backendData);
      // Refresh backends list
      await get().fetchBackends();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteBackend: async (backendId) => {
    try {
      await api.deleteBackend(backendId);
      // Refresh backends list
      await get().fetchBackends();
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  updateRealtimeMetrics: (metrics) => {
    set({ realtimeMetrics: metrics });
  },

  clearError: () => {
    set({ error: null });
  }
}));
```

---

## 🎯 Resumo das Integrações

Estes exemplos mostram como integrar a API VeloFlux com diferentes frameworks:

1. **React**: Hooks customizados + React Query + TypeScript
2. **Vue.js**: Composables + Pinia + TypeScript 
3. **Angular**: Services + NgRx + RxJS + TypeScript
4. **Vanilla**: Classes ES6 + WebSockets + DOM manipulation

### Características Comuns:

- **Autenticação JWT** com interceptors
- **WebSockets** para dados em tempo real
- **Estado global** para gerenciar dados
- **TypeScript** para type safety
- **Error handling** robusto
- **Reconexão automática** de WebSockets

### Próximos Passos:

1. Implementar **caching inteligente**
2. Adicionar **offline support**
3. Implementar **progressive loading**
4. Adicionar **testes automatizados**
5. Configurar **CI/CD pipelines**

Cada implementação é production-ready e pode ser adaptada conforme suas necessidades específicas.
