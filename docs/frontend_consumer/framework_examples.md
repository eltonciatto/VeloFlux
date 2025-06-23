# 🎯 Exemplos Práticos por Framework - API VeloFlux

Este guia contém exemplos práticos e específicos para diferentes frameworks frontend consumindo a API VeloFlux.

## 📋 Índice

1. [React.js Examples](#reactjs-examples)
2. [Vue.js Examples](#vuejs-examples)
3. [Angular Examples](#angular-examples)
4. [Vanilla JavaScript Examples](#vanilla-javascript-examples)
5. [Next.js Examples](#nextjs-examples)
6. [Svelte Examples](#svelte-examples)

## ⚛️ React.js Examples

### Custom Hook para API VeloFlux

```jsx
// hooks/useVeloFluxAPI.js
import { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080';

export const useVeloFluxAPI = () => {
  const [token, setToken] = useState(localStorage.getItem('authToken'));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const getAuthHeaders = useCallback(() => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  }), [token]);

  const apiCall = useCallback(async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  const login = useCallback(async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      setToken(data.token);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setToken(null);
  }, []);

  // Pool APIs
  const pools = {
    list: () => apiCall('/api/pools'),
    get: (name) => apiCall(`/api/pools/${name}`),
    create: (data) => apiCall('/api/pools', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (name, data) => apiCall(`/api/pools/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (name) => apiCall(`/api/pools/${name}`, { method: 'DELETE' })
  };

  // Backend APIs
  const backends = {
    list: (filters = {}) => {
      const params = new URLSearchParams(filters);
      return apiCall(`/api/backends?${params}`);
    },
    add: (data) => apiCall('/api/backends', {
      method: 'POST',
      body: JSON.stringify(data)
    }),
    update: (id, data) => apiCall(`/api/backends/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),
    delete: (id) => apiCall(`/api/backends/${id}`, { method: 'DELETE' })
  };

  // AI APIs
  const ai = {
    metrics: (options = {}) => {
      const params = new URLSearchParams(options);
      return apiCall(`/api/ai/metrics?${params}`);
    },
    health: (detailed = false) => {
      const params = detailed ? '?detailed=true' : '';
      return apiCall(`/api/ai/health${params}`);
    },
    pipelines: {
      list: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiCall(`/api/ai/pipelines?${params}`);
      },
      create: (config) => apiCall('/api/ai/pipelines', {
        method: 'POST',
        body: JSON.stringify(config)
      }),
      run: (id, async = false) => {
        const params = async ? '?async=true' : '';
        return apiCall(`/api/ai/pipelines/${id}/run${params}`, { method: 'POST' });
      }
    },
    training: {
      start: (options = {}) => {
        const params = new URLSearchParams(options);
        return apiCall(`/api/ai/training/start?${params}`, { method: 'POST' });
      },
      stop: (options = {}) => {
        const params = new URLSearchParams(options);
        return apiCall(`/api/ai/training/stop?${params}`, { method: 'POST' });
      },
      list: (filters = {}) => {
        const params = new URLSearchParams(filters);
        return apiCall(`/api/ai/training?${params}`);
      }
    }
  };

  return {
    token,
    loading,
    error,
    login,
    logout,
    pools,
    backends,
    ai,
    apiCall
  };
};
```

### React Components

#### Dashboard Component
```jsx
// components/Dashboard.jsx
import React, { useState, useEffect } from 'react';
import { useVeloFluxAPI } from '../hooks/useVeloFluxAPI';

const Dashboard = () => {
  const { pools, backends, ai, loading, error } = useVeloFluxAPI();
  const [poolsList, setPoolsList] = useState([]);
  const [backendsList, setBackendsList] = useState([]);
  const [aiMetrics, setAiMetrics] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        const [poolsData, backendsData, aiData] = await Promise.all([
          pools.list(),
          backends.list(),
          ai.metrics({ detailed: true })
        ]);
        
        setPoolsList(poolsData);
        setBackendsList(backendsData);
        setAiMetrics(aiData);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      }
    };

    loadData();
  }, [pools, backends, ai]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="dashboard">
      <h1>VeloFlux Dashboard</h1>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Pools</h3>
          <p>{poolsList.length}</p>
        </div>
        
        <div className="metric-card">
          <h3>Backends</h3>
          <p>{backendsList.length}</p>
        </div>
        
        <div className="metric-card">
          <h3>AI Status</h3>
          <p>{aiMetrics.ai_health || 'N/A'}</p>
        </div>
      </div>

      <div className="pools-section">
        <h2>Pools</h2>
        <div className="pools-list">
          {poolsList.map(pool => (
            <div key={pool.name} className="pool-card">
              <h4>{pool.name}</h4>
              <p>Algorithm: {pool.algorithm}</p>
              <p>Sticky Sessions: {pool.sticky_sessions ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

#### Real-time Metrics Component
```jsx
// components/RealTimeMetrics.jsx
import React, { useState, useEffect, useRef } from 'react';

const RealTimeMetrics = () => {
  const [metrics, setMetrics] = useState({});
  const [status, setStatus] = useState({});
  const wsMetrics = useRef(null);
  const wsStatus = useRef(null);

  useEffect(() => {
    // Connect to WebSockets
    wsMetrics.current = new WebSocket('ws://localhost:8080/api/ws/metrics');
    wsStatus.current = new WebSocket('ws://localhost:8080/api/ws/status');

    wsMetrics.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics') {
        setMetrics(data.data);
      }
    };

    wsStatus.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        setStatus(data.data);
      }
    };

    // Cleanup
    return () => {
      if (wsMetrics.current) wsMetrics.current.close();
      if (wsStatus.current) wsStatus.current.close();
    };
  }, []);

  return (
    <div className="real-time-metrics">
      <h2>Real-time Metrics</h2>
      
      <div className="metrics-display">
        <div className="metric">
          <h4>CPU Usage</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${metrics.cpu || 0}%` }}
            />
          </div>
          <span>{(metrics.cpu || 0).toFixed(1)}%</span>
        </div>

        <div className="metric">
          <h4>Memory Usage</h4>
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${metrics.memory || 0}%` }}
            />
          </div>
          <span>{(metrics.memory || 0).toFixed(1)}%</span>
        </div>

        <div className="metric">
          <h4>Requests</h4>
          <span>{metrics.requests || 0}</span>
        </div>
      </div>

      <div className="status-display">
        <h3>System Status</h3>
        <p>Status: <span className={`status ${status.status}`}>{status.status || 'Unknown'}</span></p>
        <p>Uptime: {status.uptime || 'Unknown'}</p>
        <p>Last Update: {status.timestamp || 'Never'}</p>
      </div>
    </div>
  );
};

export default RealTimeMetrics;
```

#### AI Pipeline Manager
```jsx
// components/AIPipelineManager.jsx
import React, { useState, useEffect } from 'react';
import { useVeloFluxAPI } from '../hooks/useVeloFluxAPI';

const AIPipelineManager = () => {
  const { ai } = useVeloFluxAPI();
  const [pipelines, setPipelines] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPipeline, setNewPipeline] = useState({
    name: '',
    type: 'text_processing',
    steps: []
  });

  useEffect(() => {
    loadPipelines();
  }, []);

  const loadPipelines = async () => {
    try {
      const data = await ai.pipelines.list();
      setPipelines(data);
    } catch (err) {
      console.error('Failed to load pipelines:', err);
    }
  };

  const createPipeline = async () => {
    try {
      await ai.pipelines.create(newPipeline);
      setShowCreateForm(false);
      setNewPipeline({ name: '', type: 'text_processing', steps: [] });
      loadPipelines();
    } catch (err) {
      console.error('Failed to create pipeline:', err);
    }
  };

  const runPipeline = async (id) => {
    try {
      await ai.pipelines.run(id, true); // async = true
      alert('Pipeline started successfully!');
    } catch (err) {
      console.error('Failed to run pipeline:', err);
    }
  };

  return (
    <div className="ai-pipeline-manager">
      <div className="header">
        <h2>AI Pipelines</h2>
        <button onClick={() => setShowCreateForm(true)}>
          Create Pipeline
        </button>
      </div>

      {showCreateForm && (
        <div className="create-form">
          <h3>Create New Pipeline</h3>
          <div className="form-group">
            <label>Name:</label>
            <input
              type="text"
              value={newPipeline.name}
              onChange={(e) => setNewPipeline({
                ...newPipeline,
                name: e.target.value
              })}
            />
          </div>

          <div className="form-group">
            <label>Type:</label>
            <select
              value={newPipeline.type}
              onChange={(e) => setNewPipeline({
                ...newPipeline,
                type: e.target.value
              })}
            >
              <option value="text_processing">Text Processing</option>
              <option value="image_processing">Image Processing</option>
              <option value="data_analysis">Data Analysis</option>
            </select>
          </div>

          <div className="form-actions">
            <button onClick={createPipeline}>Create</button>
            <button onClick={() => setShowCreateForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="pipelines-list">
        {pipelines.map(pipeline => (
          <div key={pipeline.id} className="pipeline-card">
            <h4>{pipeline.name}</h4>
            <p>Type: {pipeline.type}</p>
            <p>Steps: {pipeline.steps?.length || 0}</p>
            <div className="pipeline-actions">
              <button onClick={() => runPipeline(pipeline.id)}>
                Run Pipeline
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AIPipelineManager;
```

## 🟢 Vue.js Examples

### Composable para API VeloFlux

```javascript
// composables/useVeloFluxAPI.js
import { ref, computed } from 'vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export const useVeloFluxAPI = () => {
  const token = ref(localStorage.getItem('authToken'));
  const loading = ref(false);
  const error = ref(null);

  const isAuthenticated = computed(() => !!token.value);

  const getAuthHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token.value}`
  });

  const apiCall = async (endpoint, options = {}) => {
    loading.value = true;
    error.value = null;
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const login = async (credentials) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (data.token) {
      localStorage.setItem('authToken', data.token);
      token.value = data.token;
    }
    return data;
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    token.value = null;
  };

  // API methods
  const pools = {
    list: () => apiCall('/api/pools'),
    create: (data) => apiCall('/api/pools', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  };

  const ai = {
    metrics: (options = {}) => {
      const params = new URLSearchParams(options);
      return apiCall(`/api/ai/metrics?${params}`);
    },
    pipelines: {
      list: () => apiCall('/api/ai/pipelines'),
      create: (config) => apiCall('/api/ai/pipelines', {
        method: 'POST',
        body: JSON.stringify(config)
      })
    }
  };

  return {
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    pools,
    ai,
    apiCall
  };
};
```

### Vue Components

#### Dashboard Component
```vue
<!-- components/Dashboard.vue -->
<template>
  <div class="dashboard">
    <h1>VeloFlux Dashboard</h1>
    
    <div v-if="loading" class="loading">Loading...</div>
    <div v-else-if="error" class="error">Error: {{ error }}</div>
    
    <div v-else class="dashboard-content">
      <div class="metrics-grid">
        <MetricCard 
          title="Pools" 
          :value="pools.length"
          icon="🏊"
        />
        <MetricCard 
          title="Backends" 
          :value="backends.length"
          icon="🖥️"
        />
        <MetricCard 
          title="AI Health" 
          :value="aiMetrics.ai_health || 'N/A'"
          icon="🤖"
        />
      </div>

      <div class="pools-section">
        <h2>Pools</h2>
        <div class="pools-list">
          <div 
            v-for="pool in pools" 
            :key="pool.name"
            class="pool-card"
          >
            <h4>{{ pool.name }}</h4>
            <p>Algorithm: {{ pool.algorithm }}</p>
            <p>Sticky Sessions: {{ pool.sticky_sessions ? 'Yes' : 'No' }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useVeloFluxAPI } from '../composables/useVeloFluxAPI';
import MetricCard from './MetricCard.vue';

const { pools: poolsAPI, backends: backendsAPI, ai, loading, error } = useVeloFluxAPI();

const pools = ref([]);
const backends = ref([]);
const aiMetrics = ref({});

const loadData = async () => {
  try {
    const [poolsData, backendsData, aiData] = await Promise.all([
      poolsAPI.list(),
      backendsAPI.list(),
      ai.metrics({ detailed: true })
    ]);
    
    pools.value = poolsData;
    backends.value = backendsData;
    aiMetrics.value = aiData;
  } catch (err) {
    console.error('Failed to load dashboard data:', err);
  }
};

onMounted(loadData);
</script>
```

#### Real-time Metrics Component
```vue
<!-- components/RealTimeMetrics.vue -->
<template>
  <div class="real-time-metrics">
    <h2>Real-time Metrics</h2>
    
    <div class="metrics-display">
      <div class="metric">
        <h4>CPU Usage</h4>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${metrics.cpu || 0}%` }"
          />
        </div>
        <span>{{ (metrics.cpu || 0).toFixed(1) }}%</span>
      </div>

      <div class="metric">
        <h4>Memory Usage</h4>
        <div class="progress-bar">
          <div 
            class="progress-fill" 
            :style="{ width: `${metrics.memory || 0}%` }"
          />
        </div>
        <span>{{ (metrics.memory || 0).toFixed(1) }}%</span>
      </div>

      <div class="metric">
        <h4>Requests</h4>
        <span>{{ metrics.requests || 0 }}</span>
      </div>
    </div>

    <div class="status-display">
      <h3>System Status</h3>
      <p>Status: <span :class="`status ${status.status}`">{{ status.status || 'Unknown' }}</span></p>
      <p>Uptime: {{ status.uptime || 'Unknown' }}</p>
      <p>Last Update: {{ status.timestamp || 'Never' }}</p>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const metrics = ref({});
const status = ref({});
let wsMetrics = null;
let wsStatus = null;

onMounted(() => {
  // Connect to WebSockets
  wsMetrics = new WebSocket('ws://localhost:8080/api/ws/metrics');
  wsStatus = new WebSocket('ws://localhost:8080/api/ws/status');

  wsMetrics.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'metrics') {
      metrics.value = data.data;
    }
  };

  wsStatus.onmessage = (event) => {
    const data = JSON.parse(event.data);
    if (data.type === 'status') {
      status.value = data.data;
    }
  };
});

onUnmounted(() => {
  if (wsMetrics) wsMetrics.close();
  if (wsStatus) wsStatus.close();
});
</script>
```

## 🅰️ Angular Examples

### Service para API VeloFlux

```typescript
// services/veloflux-api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Pool {
  name: string;
  algorithm: string;
  sticky_sessions: boolean;
}

export interface Backend {
  address: string;
  pool: string;
  weight: number;
  region?: string;
}

export interface AIPipeline {
  id: string;
  name: string;
  type: string;
  steps: any[];
}

@Injectable({
  providedIn: 'root'
})
export class VeloFluxAPIService {
  private readonly API_BASE_URL = 'http://localhost:8080';
  private tokenSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('authToken')
  );
  
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHttpOptions(): { headers: HttpHeaders } {
    const token = this.tokenSubject.value;
    return {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    return throwError(error);
  }

  // Authentication
  login(credentials: { email: string; password: string }): Observable<{ token: string }> {
    return this.http.post<{ token: string }>(`${this.API_BASE_URL}/api/auth/login`, credentials)
      .pipe(
        tap(response => {
          if (response.token) {
            localStorage.setItem('authToken', response.token);
            this.tokenSubject.next(response.token);
          }
        }),
        catchError(this.handleError)
      );
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.tokenSubject.next(null);
  }

  // Pool APIs
  listPools(): Observable<Pool[]> {
    return this.http.get<Pool[]>(`${this.API_BASE_URL}/api/pools`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createPool(pool: Partial<Pool>): Observable<Pool> {
    return this.http.post<Pool>(`${this.API_BASE_URL}/api/pools`, pool, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  deletePool(name: string): Observable<void> {
    return this.http.delete<void>(`${this.API_BASE_URL}/api/pools/${name}`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // Backend APIs
  listBackends(filters?: any): Observable<Backend[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<Backend[]>(`${this.API_BASE_URL}/api/backends`, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }

  addBackend(backend: Partial<Backend>): Observable<Backend> {
    return this.http.post<Backend>(`${this.API_BASE_URL}/api/backends`, backend, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  // AI APIs
  getAIMetrics(options?: any): Observable<any> {
    let params = new HttpParams();
    if (options) {
      Object.keys(options).forEach(key => {
        if (options[key]) {
          params = params.set(key, options[key]);
        }
      });
    }

    return this.http.get<any>(`${this.API_BASE_URL}/api/ai/metrics`, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }

  listAIPipelines(): Observable<AIPipeline[]> {
    return this.http.get<AIPipeline[]>(`${this.API_BASE_URL}/api/ai/pipelines`, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  createAIPipeline(pipeline: Partial<AIPipeline>): Observable<AIPipeline> {
    return this.http.post<AIPipeline>(`${this.API_BASE_URL}/api/ai/pipelines`, pipeline, this.getHttpOptions())
      .pipe(catchError(this.handleError));
  }

  runAIPipeline(id: string, async: boolean = false): Observable<any> {
    const params = new HttpParams().set('async', async.toString());
    return this.http.post<any>(`${this.API_BASE_URL}/api/ai/pipelines/${id}/run`, {}, {
      ...this.getHttpOptions(),
      params
    }).pipe(catchError(this.handleError));
  }
}
```

### Angular Components

#### Dashboard Component
```typescript
// components/dashboard/dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { VeloFluxAPIService, Pool, Backend } from '../../services/veloflux-api.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  pools: Pool[] = [];
  backends: Backend[] = [];
  aiMetrics: any = {};
  loading = false;
  error: string | null = null;

  constructor(private veloFluxAPI: VeloFluxAPIService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      pools: this.veloFluxAPI.listPools(),
      backends: this.veloFluxAPI.listBackends(),
      aiMetrics: this.veloFluxAPI.getAIMetrics({ detailed: true })
    }).subscribe({
      next: (data) => {
        this.pools = data.pools;
        this.backends = data.backends;
        this.aiMetrics = data.aiMetrics;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message;
        this.loading = false;
      }
    });
  }
}
```

```html
<!-- components/dashboard/dashboard.component.html -->
<div class="dashboard">
  <h1>VeloFlux Dashboard</h1>
  
  <div *ngIf="loading" class="loading">Loading...</div>
  <div *ngIf="error" class="error">Error: {{ error }}</div>
  
  <div *ngIf="!loading && !error" class="dashboard-content">
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Pools</h3>
        <p>{{ pools.length }}</p>
      </div>
      
      <div class="metric-card">
        <h3>Backends</h3>
        <p>{{ backends.length }}</p>
      </div>
      
      <div class="metric-card">
        <h3>AI Health</h3>
        <p>{{ aiMetrics.ai_health || 'N/A' }}</p>
      </div>
    </div>

    <div class="pools-section">
      <h2>Pools</h2>
      <div class="pools-list">
        <div *ngFor="let pool of pools" class="pool-card">
          <h4>{{ pool.name }}</h4>
          <p>Algorithm: {{ pool.algorithm }}</p>
          <p>Sticky Sessions: {{ pool.sticky_sessions ? 'Yes' : 'No' }}</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Real-time Metrics Component
```typescript
// components/real-time-metrics/real-time-metrics.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';

@Component({
  selector: 'app-real-time-metrics',
  templateUrl: './real-time-metrics.component.html',
  styleUrls: ['./real-time-metrics.component.scss']
})
export class RealTimeMetricsComponent implements OnInit, OnDestroy {
  metrics: any = {};
  status: any = {};
  private wsMetrics: WebSocket | null = null;
  private wsStatus: WebSocket | null = null;

  ngOnInit(): void {
    this.connectWebSockets();
  }

  ngOnDestroy(): void {
    this.disconnectWebSockets();
  }

  private connectWebSockets(): void {
    // Connect to metrics WebSocket
    this.wsMetrics = new WebSocket('ws://localhost:8080/api/ws/metrics');
    this.wsMetrics.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'metrics') {
        this.metrics = data.data;
      }
    };

    // Connect to status WebSocket
    this.wsStatus = new WebSocket('ws://localhost:8080/api/ws/status');
    this.wsStatus.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'status') {
        this.status = data.data;
      }
    };
  }

  private disconnectWebSockets(): void {
    if (this.wsMetrics) {
      this.wsMetrics.close();
      this.wsMetrics = null;
    }
    if (this.wsStatus) {
      this.wsStatus.close();
      this.wsStatus = null;
    }
  }
}
```

## 🟡 Vanilla JavaScript Examples

### API Client Class
```javascript
// js/veloflux-api.js
class VeloFluxAPI {
  constructor(baseUrl = 'http://localhost:8080') {
    this.baseUrl = baseUrl;
    this.token = localStorage.getItem('authToken');
    this.eventTarget = new EventTarget();
  }

  getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.token}`
    };
  }

  async apiCall(endpoint, options = {}) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        headers: this.getAuthHeaders(),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      this.emit('error', { message: error.message });
      throw error;
    }
  }

  async login(credentials) {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    
    const data = await response.json();
    if (data.token) {
      this.token = data.token;
      localStorage.setItem('authToken', data.token);
      this.emit('login', { token: data.token });
    }
    return data;
  }

  logout() {
    this.token = null;
    localStorage.removeItem('authToken');
    this.emit('logout');
  }

  // Pool APIs
  async listPools() {
    return this.apiCall('/api/pools');
  }

  async createPool(poolData) {
    return this.apiCall('/api/pools', {
      method: 'POST',
      body: JSON.stringify(poolData)
    });
  }

  // WebSocket connections
  connectMetricsWebSocket() {
    const ws = new WebSocket(`ws://${this.baseUrl.replace('http://', '')}/api/ws/metrics`);
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit('metrics', data);
    };
    
    return ws;
  }

  // Event system
  on(event, callback) {
    this.eventTarget.addEventListener(event, callback);
  }

  off(event, callback) {
    this.eventTarget.removeEventListener(event, callback);
  }

  emit(event, data) {
    this.eventTarget.dispatchEvent(new CustomEvent(event, { detail: data }));
  }
}

// Usage
const api = new VeloFluxAPI();

// Listen to events
api.on('metrics', (event) => {
  const data = event.detail;
  updateMetricsUI(data);
});

api.on('error', (event) => {
  console.error('API Error:', event.detail.message);
});
```

### Dashboard Implementation
```html
<!-- dashboard.html -->
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VeloFlux Dashboard</title>
    <style>
        .dashboard { padding: 20px; }
        .metrics-grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
            gap: 20px; 
            margin: 20px 0;
        }
        .metric-card { 
            padding: 20px; 
            border: 1px solid #ddd; 
            border-radius: 8px; 
            text-align: center;
        }
        .progress-bar {
            width: 100%;
            height: 20px;
            background: #f0f0f0;
            border-radius: 10px;
            overflow: hidden;
        }
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #45a049);
            transition: width 0.3s ease;
        }
        .pools-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 15px;
        }
        .pool-card {
            padding: 15px;
            border: 1px solid #ccc;
            border-radius: 5px;
            background: #f9f9f9;
        }
    </style>
</head>
<body>
    <div class="dashboard">
        <h1>VeloFlux Dashboard</h1>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <h3>CPU Usage</h3>
                <div class="progress-bar">
                    <div id="cpu-fill" class="progress-fill" style="width: 0%"></div>
                </div>
                <span id="cpu-text">0%</span>
            </div>
            
            <div class="metric-card">
                <h3>Memory Usage</h3>
                <div class="progress-bar">
                    <div id="memory-fill" class="progress-fill" style="width: 0%"></div>
                </div>
                <span id="memory-text">0%</span>
            </div>
            
            <div class="metric-card">
                <h3>Requests</h3>
                <span id="requests-text">0</span>
            </div>
        </div>

        <div class="pools-section">
            <h2>Pools</h2>
            <div id="pools-list" class="pools-list">
                <!-- Pools will be populated here -->
            </div>
        </div>
    </div>

    <script src="js/veloflux-api.js"></script>
    <script>
        const api = new VeloFluxAPI();
        
        // Update metrics UI
        function updateMetricsUI(data) {
            if (data.type === 'metrics') {
                const metrics = data.data;
                
                // Update CPU
                document.getElementById('cpu-fill').style.width = `${metrics.cpu || 0}%`;
                document.getElementById('cpu-text').textContent = `${(metrics.cpu || 0).toFixed(1)}%`;
                
                // Update Memory
                document.getElementById('memory-fill').style.width = `${metrics.memory || 0}%`;
                document.getElementById('memory-text').textContent = `${(metrics.memory || 0).toFixed(1)}%`;
                
                // Update Requests
                document.getElementById('requests-text').textContent = metrics.requests || 0;
            }
        }

        // Load pools
        async function loadPools() {
            try {
                const pools = await api.listPools();
                const poolsList = document.getElementById('pools-list');
                
                poolsList.innerHTML = pools.map(pool => `
                    <div class="pool-card">
                        <h4>${pool.name}</h4>
                        <p>Algorithm: ${pool.algorithm}</p>
                        <p>Sticky Sessions: ${pool.sticky_sessions ? 'Yes' : 'No'}</p>
                    </div>
                `).join('');
            } catch (error) {
                console.error('Failed to load pools:', error);
            }
        }

        // Initialize
        async function init() {
            // Connect to metrics WebSocket
            api.connectMetricsWebSocket();
            
            // Listen to metrics updates
            api.on('metrics', (event) => {
                updateMetricsUI(event.detail);
            });
            
            // Load initial data
            await loadPools();
        }

        // Start the application
        init();
    </script>
</body>
</html>
```

## ⚡ Next.js Examples

### API Route Handler
```typescript
// pages/api/veloflux/[...slug].ts
import { NextApiRequest, NextApiResponse } from 'next';

const API_BASE_URL = process.env.VELOFLUX_API_BASE_URL || 'http://localhost:8080';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { slug } = req.query;
  const endpoint = Array.isArray(slug) ? slug.join('/') : slug;
  
  const authHeader = req.headers.authorization;
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/${endpoint}`, {
      method: req.method,
      headers: {
        'Content-Type': 'application/json',
        ...(authHeader && { 'Authorization': authHeader })
      },
      ...(req.body && { body: JSON.stringify(req.body) })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'API call failed' });
  }
}
```

### React Hook with SWR
```typescript
// hooks/useVeloFluxAPI.ts
import useSWR from 'swr';
import { useAuth } from './useAuth';

const fetcher = (url: string, token: string) => 
  fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }).then(res => res.json());

export const useVeloFluxAPI = () => {
  const { token } = useAuth();
  
  const { data: pools, error: poolsError } = useSWR(
    token ? ['/api/veloflux/pools', token] : null,
    fetcher
  );
  
  const { data: backends, error: backendsError } = useSWR(
    token ? ['/api/veloflux/backends', token] : null,
    fetcher
  );
  
  const { data: aiMetrics, error: aiError } = useSWR(
    token ? ['/api/veloflux/ai/metrics', token] : null,
    fetcher,
    { refreshInterval: 5000 } // Refresh every 5 seconds
  );

  return {
    pools,
    backends,
    aiMetrics,
    isLoading: !pools && !poolsError,
    error: poolsError || backendsError || aiError
  };
};
```

### Dashboard Page
```tsx
// pages/dashboard.tsx
import { useState, useEffect } from 'react';
import { useVeloFluxAPI } from '../hooks/useVeloFluxAPI';
import dynamic from 'next/dynamic';

// Dynamically import WebSocket component to avoid SSR issues
const RealTimeMetrics = dynamic(() => import('../components/RealTimeMetrics'), {
  ssr: false
});

const Dashboard = () => {
  const { pools, backends, aiMetrics, isLoading, error } = useVeloFluxAPI();

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="dashboard">
      <h1>VeloFlux Dashboard</h1>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>Pools</h3>
          <p>{pools?.length || 0}</p>
        </div>
        
        <div className="metric-card">
          <h3>Backends</h3>
          <p>{backends?.length || 0}</p>
        </div>
        
        <div className="metric-card">
          <h3>AI Health</h3>
          <p>{aiMetrics?.ai_health || 'N/A'}</p>
        </div>
      </div>

      <RealTimeMetrics />
      
      <div className="pools-section">
        <h2>Pools</h2>
        <div className="pools-list">
          {pools?.map(pool => (
            <div key={pool.name} className="pool-card">
              <h4>{pool.name}</h4>
              <p>Algorithm: {pool.algorithm}</p>
              <p>Sticky Sessions: {pool.sticky_sessions ? 'Yes' : 'No'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

## 🔥 Svelte Examples

### Svelte Store
```javascript
// stores/velofluxAPI.js
import { writable } from 'svelte/store';

const API_BASE_URL = 'http://localhost:8080';

export const token = writable(localStorage.getItem('authToken'));
export const loading = writable(false);
export const error = writable(null);

const getAuthHeaders = (tokenValue) => ({
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${tokenValue}`
});

export const velofluxAPI = {
  async login(credentials) {
    loading.set(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      if (data.token) {
        localStorage.setItem('authToken', data.token);
        token.set(data.token);
      }
      return data;
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      loading.set(false);
    }
  },

  async apiCall(endpoint, options = {}, tokenValue) {
    loading.set(true);
    error.set(null);
    
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: getAuthHeaders(tokenValue),
        ...options
      });
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      return await response.json();
    } catch (err) {
      error.set(err.message);
      throw err;
    } finally {
      loading.set(false);
    }
  },

  async listPools(tokenValue) {
    return this.apiCall('/api/pools', {}, tokenValue);
  },

  async createPool(poolData, tokenValue) {
    return this.apiCall('/api/pools', {
      method: 'POST',
      body: JSON.stringify(poolData)
    }, tokenValue);
  }
};
```

### Svelte Dashboard Component
```svelte
<!-- Dashboard.svelte -->
<script>
  import { onMount } from 'svelte';
  import { token, loading, error, velofluxAPI } from '../stores/velofluxAPI.js';
  import RealTimeMetrics from './RealTimeMetrics.svelte';
  
  let pools = [];
  let backends = [];
  let aiMetrics = {};

  $: if ($token) {
    loadData();
  }

  async function loadData() {
    try {
      const [poolsData, backendsData, aiData] = await Promise.all([
        velofluxAPI.listPools($token),
        velofluxAPI.apiCall('/api/backends', {}, $token),
        velofluxAPI.apiCall('/api/ai/metrics?detailed=true', {}, $token)
      ]);
      
      pools = poolsData;
      backends = backendsData;
      aiMetrics = aiData;
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }

  onMount(loadData);
</script>

<div class="dashboard">
  <h1>VeloFlux Dashboard</h1>
  
  {#if $loading}
    <div class="loading">Loading...</div>
  {:else if $error}
    <div class="error">Error: {$error}</div>
  {:else}
    <div class="metrics-grid">
      <div class="metric-card">
        <h3>Pools</h3>
        <p>{pools.length}</p>
      </div>
      
      <div class="metric-card">
        <h3>Backends</h3>
        <p>{backends.length}</p>
      </div>
      
      <div class="metric-card">
        <h3>AI Health</h3>
        <p>{aiMetrics.ai_health || 'N/A'}</p>
      </div>
    </div>

    <RealTimeMetrics />
    
    <div class="pools-section">
      <h2>Pools</h2>
      <div class="pools-list">
        {#each pools as pool}
          <div class="pool-card">
            <h4>{pool.name}</h4>
            <p>Algorithm: {pool.algorithm}</p>
            <p>Sticky Sessions: {pool.sticky_sessions ? 'Yes' : 'No'}</p>
          </div>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .dashboard { padding: 20px; }
  .metrics-grid { 
    display: grid; 
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); 
    gap: 20px; 
    margin: 20px 0;
  }
  .metric-card { 
    padding: 20px; 
    border: 1px solid #ddd; 
    border-radius: 8px; 
    text-align: center;
  }
  .pools-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 15px;
  }
  .pool-card {
    padding: 15px;
    border: 1px solid #ccc;
    border-radius: 5px;
    background: #f9f9f9;
  }
</style>
```

## 🎯 Resumo e Melhores Práticas

### ✅ Padrões Implementados:

1. **Autenticação JWT** consistente em todos os frameworks
2. **Gerenciamento de Estado** apropriado para cada framework
3. **WebSockets** para atualizações em tempo real
4. **Error Handling** robusto
5. **Loading States** para melhor UX
6. **Reutilização de Código** através de hooks/composables/services

### 🚀 Funcionalidades Cobertas:

- ✅ **Core APIs** (Pools, Backends, Routes)
- ✅ **Authentication** (Login, Register, Refresh)
- ✅ **AI/ML APIs** (Pipelines, Training, Metrics)
- ✅ **Real-time Updates** (WebSockets)
- ✅ **Tenant Management**
- ✅ **Billing Integration**

### 📚 Próximos Passos:

1. Implementar **TypeScript** em todos os exemplos
2. Adicionar **testes unitários** para os services/hooks
3. Implementar **caching strategies** (SWR, React Query, etc.)
4. Adicionar **offline support** 
5. Implementar **error boundaries** para produção

Este guia fornece exemplos completos e práticos para consumir todas as funcionalidades da API VeloFlux em qualquer framework frontend moderno.
