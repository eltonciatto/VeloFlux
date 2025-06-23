# Monitoramento e Observabilidade - Tenant API

## Visão Geral

Este guia documenta como consumir os endpoints de monitoramento e observabilidade da Tenant API, incluindo métricas, uso e logs. Essas funcionalidades permitem que o frontend monitore a performance, utilize recursos e visualize logs de tenants em tempo real.

## Endpoints Disponíveis

### 1. Métricas do Tenant
- **GET** `/tenants/{id}/metrics` - Obter métricas do tenant

### 2. Uso do Tenant
- **GET** `/tenants/{id}/usage` - Obter dados de uso do tenant

### 3. Logs do Tenant
- **GET** `/tenants/{id}/logs` - Obter logs do tenant

---

## 1. Métricas do Tenant

### Endpoint
```
GET /tenants/{id}/metrics
```

### Headers Necessários
```
Authorization: Bearer {token}
```

### Parâmetros de Query (Opcionais)
- `start` - Data/hora de início (formato ISO 8601)
- `end` - Data/hora de fim (formato ISO 8601)
- `metric_type` - Tipo específico de métrica
- `interval` - Intervalo de agregação (1m, 5m, 1h, 1d)

### Resposta de Sucesso
```json
{
  "tenant_id": "tenant-123",
  "period": {
    "start": "2024-01-15T10:00:00Z",
    "end": "2024-01-15T11:00:00Z"
  },
  "metrics": {
    "requests": {
      "total": 15420,
      "per_minute": 257,
      "success_rate": 99.2
    },
    "response_time": {
      "avg": 125.5,
      "p50": 98.2,
      "p95": 245.8,
      "p99": 412.1
    },
    "bandwidth": {
      "inbound_mb": 245.8,
      "outbound_mb": 1204.3,
      "total_mb": 1450.1
    },
    "errors": {
      "4xx": 45,
      "5xx": 12,
      "rate": 0.37
    },
    "pools": {
      "active": 3,
      "healthy_backends": 8,
      "total_backends": 9
    }
  },
  "timestamps": [
    "2024-01-15T10:00:00Z",
    "2024-01-15T10:05:00Z",
    "2024-01-15T10:10:00Z"
  ]
}
```

### Consumo em JavaScript/TypeScript

```javascript
// Função para obter métricas do tenant
async function getTenantMetrics(tenantId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.start) params.append('start', options.start);
  if (options.end) params.append('end', options.end);
  if (options.metricType) params.append('metric_type', options.metricType);
  if (options.interval) params.append('interval', options.interval);
  
  const queryString = params.toString();
  const url = `/api/tenants/${tenantId}/metrics${queryString ? '?' + queryString : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter métricas: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter métricas do tenant:', error);
    throw error;
  }
}

// Exemplo de uso
const metrics = await getTenantMetrics('tenant-123', {
  start: '2024-01-15T10:00:00Z',
  end: '2024-01-15T11:00:00Z',
  interval: '5m'
});
```

### Componente React para Métricas

```tsx
import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';

interface TenantMetricsProps {
  tenantId: string;
  refreshInterval?: number;
}

interface MetricsData {
  tenant_id: string;
  period: {
    start: string;
    end: string;
  };
  metrics: {
    requests: {
      total: number;
      per_minute: number;
      success_rate: number;
    };
    response_time: {
      avg: number;
      p50: number;
      p95: number;
      p99: number;
    };
    bandwidth: {
      inbound_mb: number;
      outbound_mb: number;
      total_mb: number;
    };
    errors: {
      '4xx': number;
      '5xx': number;
      rate: number;
    };
    pools: {
      active: number;
      healthy_backends: number;
      total_backends: number;
    };
  };
  timestamps: string[];
}

const TenantMetrics: React.FC<TenantMetricsProps> = ({ 
  tenantId, 
  refreshInterval = 30000 
}) => {
  const [metrics, setMetrics] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await getTenantMetrics(tenantId, {
        interval: '5m'
      });
      setMetrics(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [tenantId, refreshInterval]);

  if (loading && !metrics) {
    return <div className="loading">Carregando métricas...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  if (!metrics) {
    return <div>Nenhuma métrica disponível</div>;
  }

  const chartData = {
    labels: metrics.timestamps.map(ts => new Date(ts).toLocaleTimeString()),
    datasets: [
      {
        label: 'Requests por Minuto',
        data: [metrics.metrics.requests.per_minute],
        borderColor: 'rgb(75, 192, 192)',
        tension: 0.1
      }
    ]
  };

  return (
    <div className="tenant-metrics">
      <h3>Métricas do Tenant</h3>
      
      <div className="metrics-grid">
        <div className="metric-card">
          <h4>Requests</h4>
          <div className="metric-value">
            {metrics.metrics.requests.total.toLocaleString()}
          </div>
          <div className="metric-subtitle">
            Taxa de Sucesso: {metrics.metrics.requests.success_rate.toFixed(1)}%
          </div>
        </div>

        <div className="metric-card">
          <h4>Tempo de Resposta</h4>
          <div className="metric-value">
            {metrics.metrics.response_time.avg.toFixed(1)}ms
          </div>
          <div className="metric-subtitle">
            P95: {metrics.metrics.response_time.p95.toFixed(1)}ms
          </div>
        </div>

        <div className="metric-card">
          <h4>Bandwidth</h4>
          <div className="metric-value">
            {metrics.metrics.bandwidth.total_mb.toFixed(1)} MB
          </div>
          <div className="metric-subtitle">
            In: {metrics.metrics.bandwidth.inbound_mb.toFixed(1)} MB | 
            Out: {metrics.metrics.bandwidth.outbound_mb.toFixed(1)} MB
          </div>
        </div>

        <div className="metric-card">
          <h4>Backends</h4>
          <div className="metric-value">
            {metrics.metrics.pools.healthy_backends}/{metrics.metrics.pools.total_backends}
          </div>
          <div className="metric-subtitle">
            Pools Ativos: {metrics.metrics.pools.active}
          </div>
        </div>
      </div>

      <div className="metrics-chart">
        <Line data={chartData} />
      </div>
    </div>
  );
};

export default TenantMetrics;
```

---

## 2. Uso do Tenant

### Endpoint
```
GET /tenants/{id}/usage
```

### Headers Necessários
```
Authorization: Bearer {token}
```

### Parâmetros de Query (Opcionais)
- `start` - Data/hora de início (formato ISO 8601)
- `end` - Data/hora de fim (formato ISO 8601)
- `granularity` - Granularidade dos dados (hour, day, week, month)

### Resposta de Sucesso
```json
{
  "tenant_id": "tenant-123",
  "period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z"
  },
  "usage": {
    "requests": {
      "total": 1245680,
      "daily_average": 40183,
      "peak_day": {
        "date": "2024-01-15",
        "count": 67890
      }
    },
    "bandwidth": {
      "total_gb": 124.5,
      "inbound_gb": 23.8,
      "outbound_gb": 100.7,
      "daily_average_gb": 4.02
    },
    "storage": {
      "cache_usage_gb": 12.4,
      "log_storage_gb": 3.2,
      "config_storage_mb": 45.8
    },
    "compute": {
      "cpu_hours": 156.7,
      "memory_gb_hours": 2340.5,
      "average_cpu_utilization": 65.2
    },
    "features": {
      "waf_requests": 856430,
      "rate_limit_hits": 2340,
      "ssl_certificates": 5,
      "custom_routes": 23
    }
  },
  "billing": {
    "current_tier": "professional",
    "usage_percentage": 67.8,
    "estimated_cost": 156.78,
    "next_billing_date": "2024-02-01T00:00:00Z"
  },
  "daily_breakdown": [
    {
      "date": "2024-01-01",
      "requests": 38450,
      "bandwidth_gb": 3.8,
      "cpu_hours": 5.2
    }
  ]
}
```

### Consumo em JavaScript/TypeScript

```javascript
// Função para obter dados de uso do tenant
async function getTenantUsage(tenantId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.start) params.append('start', options.start);
  if (options.end) params.append('end', options.end);
  if (options.granularity) params.append('granularity', options.granularity);
  
  const queryString = params.toString();
  const url = `/api/tenants/${tenantId}/usage${queryString ? '?' + queryString : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter dados de uso: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter dados de uso do tenant:', error);
    throw error;
  }
}

// Exemplo de uso
const usage = await getTenantUsage('tenant-123', {
  start: '2024-01-01T00:00:00Z',
  end: '2024-01-31T23:59:59Z',
  granularity: 'day'
});
```

### Componente React para Uso

```tsx
import React, { useState, useEffect } from 'react';
import { Bar, Doughnut } from 'react-chartjs-2';

interface TenantUsageProps {
  tenantId: string;
  period?: 'week' | 'month' | 'quarter';
}

interface UsageData {
  tenant_id: string;
  period: {
    start: string;
    end: string;
  };
  usage: {
    requests: {
      total: number;
      daily_average: number;
      peak_day: {
        date: string;
        count: number;
      };
    };
    bandwidth: {
      total_gb: number;
      inbound_gb: number;
      outbound_gb: number;
      daily_average_gb: number;
    };
    storage: {
      cache_usage_gb: number;
      log_storage_gb: number;
      config_storage_mb: number;
    };
    compute: {
      cpu_hours: number;
      memory_gb_hours: number;
      average_cpu_utilization: number;
    };
    features: {
      waf_requests: number;
      rate_limit_hits: number;
      ssl_certificates: number;
      custom_routes: number;
    };
  };
  billing: {
    current_tier: string;
    usage_percentage: number;
    estimated_cost: number;
    next_billing_date: string;
  };
  daily_breakdown: Array<{
    date: string;
    requests: number;
    bandwidth_gb: number;
    cpu_hours: number;
  }>;
}

const TenantUsage: React.FC<TenantUsageProps> = ({ 
  tenantId, 
  period = 'month' 
}) => {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsage = async () => {
    try {
      setLoading(true);
      
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'quarter':
          startDate.setMonth(endDate.getMonth() - 3);
          break;
        default: // month
          startDate.setMonth(endDate.getMonth() - 1);
      }
      
      const data = await getTenantUsage(tenantId, {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
        granularity: 'day'
      });
      
      setUsage(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsage();
  }, [tenantId, period]);

  if (loading) {
    return <div className="loading">Carregando dados de uso...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  if (!usage) {
    return <div>Nenhum dado de uso disponível</div>;
  }

  const requestsChartData = {
    labels: usage.daily_breakdown.map(day => 
      new Date(day.date).toLocaleDateString()
    ),
    datasets: [{
      label: 'Requests Diários',
      data: usage.daily_breakdown.map(day => day.requests),
      backgroundColor: 'rgba(54, 162, 235, 0.8)'
    }]
  };

  const storageChartData = {
    labels: ['Cache', 'Logs', 'Configuração'],
    datasets: [{
      data: [
        usage.usage.storage.cache_usage_gb,
        usage.usage.storage.log_storage_gb,
        usage.usage.storage.config_storage_mb / 1024 // Convert to GB
      ],
      backgroundColor: [
        'rgba(255, 99, 132, 0.8)',
        'rgba(54, 162, 235, 0.8)',
        'rgba(255, 205, 86, 0.8)'
      ]
    }]
  };

  return (
    <div className="tenant-usage">
      <h3>Uso do Tenant - {period}</h3>
      
      <div className="usage-summary">
        <div className="summary-card">
          <h4>Requests</h4>
          <div className="summary-value">
            {usage.usage.requests.total.toLocaleString()}
          </div>
          <div className="summary-detail">
            Média Diária: {usage.usage.requests.daily_average.toLocaleString()}
          </div>
        </div>

        <div className="summary-card">
          <h4>Bandwidth</h4>
          <div className="summary-value">
            {usage.usage.bandwidth.total_gb.toFixed(1)} GB
          </div>
          <div className="summary-detail">
            Média Diária: {usage.usage.bandwidth.daily_average_gb.toFixed(2)} GB
          </div>
        </div>

        <div className="summary-card">
          <h4>Compute</h4>
          <div className="summary-value">
            {usage.usage.compute.cpu_hours.toFixed(1)}h CPU
          </div>
          <div className="summary-detail">
            Utilização: {usage.usage.compute.average_cpu_utilization.toFixed(1)}%
          </div>
        </div>

        <div className="summary-card">
          <h4>Custo Estimado</h4>
          <div className="summary-value">
            ${usage.billing.estimated_cost.toFixed(2)}
          </div>
          <div className="summary-detail">
            Plano: {usage.billing.current_tier}
          </div>
        </div>
      </div>

      <div className="usage-charts">
        <div className="chart-container">
          <h4>Requests Diários</h4>
          <Bar data={requestsChartData} />
        </div>

        <div className="chart-container">
          <h4>Uso de Storage</h4>
          <Doughnut data={storageChartData} />
        </div>
      </div>

      <div className="billing-info">
        <h4>Informações de Cobrança</h4>
        <div className="billing-details">
          <div>Plano Atual: <strong>{usage.billing.current_tier}</strong></div>
          <div>Uso do Plano: <strong>{usage.billing.usage_percentage.toFixed(1)}%</strong></div>
          <div>Próxima Cobrança: <strong>
            {new Date(usage.billing.next_billing_date).toLocaleDateString()}
          </strong></div>
        </div>
      </div>
    </div>
  );
};

export default TenantUsage;
```

---

## 3. Logs do Tenant

### Endpoint
```
GET /tenants/{id}/logs
```

### Headers Necessários
```
Authorization: Bearer {token}
```

### Parâmetros de Query (Opcionais)
- `start` - Data/hora de início (formato ISO 8601)
- `end` - Data/hora de fim (formato ISO 8601)
- `level` - Nível do log (debug, info, warn, error)
- `source` - Fonte do log (api, waf, loadbalancer, etc.)
- `limit` - Número máximo de logs (padrão: 100, máximo: 1000)
- `offset` - Offset para paginação

### Resposta de Sucesso
```json
{
  "tenant_id": "tenant-123",
  "total_logs": 2456,
  "offset": 0,
  "limit": 100,
  "logs": [
    {
      "id": "log-456",
      "timestamp": "2024-01-15T14:30:25.123Z",
      "level": "info",
      "source": "api",
      "message": "Request processed successfully",
      "details": {
        "method": "GET",
        "path": "/api/users",
        "status_code": 200,
        "response_time_ms": 45,
        "client_ip": "192.168.1.100",
        "user_agent": "Mozilla/5.0...",
        "request_id": "req-789"
      }
    },
    {
      "id": "log-457",
      "timestamp": "2024-01-15T14:30:23.456Z",
      "level": "warn",
      "source": "waf",
      "message": "Suspicious request blocked",
      "details": {
        "rule_id": "sql_injection",
        "client_ip": "10.0.0.50",
        "blocked_path": "/api/admin",
        "risk_score": 85
      }
    },
    {
      "id": "log-458",
      "timestamp": "2024-01-15T14:30:20.789Z",
      "level": "error",
      "source": "loadbalancer",
      "message": "Backend server unreachable",
      "details": {
        "backend_id": "backend-123",
        "pool_id": "pool-456",
        "error": "connection timeout",
        "attempt": 3
      }
    }
  ],
  "filters_applied": {
    "start": "2024-01-15T14:00:00Z",
    "end": "2024-01-15T15:00:00Z",
    "level": null,
    "source": null
  }
}
```

### Consumo em JavaScript/TypeScript

```javascript
// Função para obter logs do tenant
async function getTenantLogs(tenantId, options = {}) {
  const params = new URLSearchParams();
  
  if (options.start) params.append('start', options.start);
  if (options.end) params.append('end', options.end);
  if (options.level) params.append('level', options.level);
  if (options.source) params.append('source', options.source);
  if (options.limit) params.append('limit', options.limit.toString());
  if (options.offset) params.append('offset', options.offset.toString());
  
  const queryString = params.toString();
  const url = `/api/tenants/${tenantId}/logs${queryString ? '?' + queryString : ''}`;
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${getAuthToken()}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter logs: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro ao obter logs do tenant:', error);
    throw error;
  }
}

// Exemplo de uso
const logs = await getTenantLogs('tenant-123', {
  level: 'error',
  limit: 50,
  start: '2024-01-15T14:00:00Z'
});
```

### Componente React para Logs

```tsx
import React, { useState, useEffect, useCallback } from 'react';

interface TenantLogsProps {
  tenantId: string;
  autoRefresh?: boolean;
  refreshInterval?: number;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  source: string;
  message: string;
  details: Record<string, any>;
}

interface LogsData {
  tenant_id: string;
  total_logs: number;
  offset: number;
  limit: number;
  logs: LogEntry[];
  filters_applied: {
    start?: string;
    end?: string;
    level?: string;
    source?: string;
  };
}

const TenantLogs: React.FC<TenantLogsProps> = ({ 
  tenantId, 
  autoRefresh = false,
  refreshInterval = 10000 
}) => {
  const [logs, setLogs] = useState<LogsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState({
    level: '',
    source: '',
    limit: 100
  });

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      
      const options: any = {
        limit: filters.limit
      };
      
      if (filters.level) options.level = filters.level;
      if (filters.source) options.source = filters.source;
      
      const data = await getTenantLogs(tenantId, options);
      setLogs(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }, [tenantId, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchLogs, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, fetchLogs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return '#dc3545';
      case 'warn': return '#ffc107';
      case 'info': return '#17a2b8';
      case 'debug': return '#6c757d';
      default: return '#495057';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setFilters(prev => ({
      ...prev,
      [filterType]: value
    }));
  };

  if (loading && !logs) {
    return <div className="loading">Carregando logs...</div>;
  }

  if (error) {
    return <div className="error">Erro: {error}</div>;
  }

  if (!logs) {
    return <div>Nenhum log disponível</div>;
  }

  return (
    <div className="tenant-logs">
      <div className="logs-header">
        <h3>Logs do Tenant</h3>
        <div className="logs-filters">
          <select 
            value={filters.level} 
            onChange={(e) => handleFilterChange('level', e.target.value)}
          >
            <option value="">Todos os níveis</option>
            <option value="debug">Debug</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
          </select>
          
          <select 
            value={filters.source} 
            onChange={(e) => handleFilterChange('source', e.target.value)}
          >
            <option value="">Todas as fontes</option>
            <option value="api">API</option>
            <option value="waf">WAF</option>
            <option value="loadbalancer">Load Balancer</option>
            <option value="auth">Autenticação</option>
          </select>
          
          <select 
            value={filters.limit} 
            onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
          >
            <option value={50}>50 logs</option>
            <option value={100}>100 logs</option>
            <option value={200}>200 logs</option>
            <option value={500}>500 logs</option>
          </select>
          
          <button onClick={fetchLogs} disabled={loading}>
            {loading ? 'Carregando...' : 'Atualizar'}
          </button>
        </div>
      </div>

      <div className="logs-info">
        <span>Total: {logs.total_logs.toLocaleString()} logs</span>
        {autoRefresh && <span className="auto-refresh">🔄 Auto-refresh ativo</span>}
      </div>

      <div className="logs-container">
        {logs.logs.map((log) => (
          <div key={log.id} className="log-entry">
            <div className="log-header">
              <span 
                className="log-level" 
                style={{ color: getLevelColor(log.level) }}
              >
                {log.level.toUpperCase()}
              </span>
              <span className="log-source">{log.source}</span>
              <span className="log-timestamp">
                {formatTimestamp(log.timestamp)}
              </span>
            </div>
            
            <div className="log-message">{log.message}</div>
            
            {Object.keys(log.details).length > 0 && (
              <details className="log-details">
                <summary>Detalhes</summary>
                <pre>{JSON.stringify(log.details, null, 2)}</pre>
              </details>
            )}
          </div>
        ))}
      </div>

      {logs.logs.length === 0 && (
        <div className="no-logs">
          Nenhum log encontrado com os filtros aplicados.
        </div>
      )}
    </div>
  );
};

export default TenantLogs;
```

---

## CSS Recomendado

```css
/* Estilos para componentes de monitoramento */
.tenant-metrics, .tenant-usage, .tenant-logs {
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
  margin: 20px 0;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin: 20px 0;
}

.metric-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #007bff;
}

.metric-subtitle {
  color: #6c757d;
  font-size: 0.9em;
  margin-top: 5px;
}

.usage-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin: 20px 0;
}

.summary-card {
  background: white;
  padding: 15px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
}

.summary-value {
  font-size: 1.5em;
  font-weight: bold;
  color: #28a745;
}

.usage-charts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin: 20px 0;
}

.chart-container {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.logs-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.logs-filters {
  display: flex;
  gap: 10px;
  align-items: center;
}

.logs-filters select {
  padding: 5px 10px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.logs-container {
  max-height: 600px;
  overflow-y: auto;
  background: white;
  border-radius: 8px;
  padding: 10px;
}

.log-entry {
  border-bottom: 1px solid #eee;
  padding: 10px 0;
}

.log-header {
  display: flex;
  gap: 15px;
  align-items: center;
  margin-bottom: 5px;
}

.log-level {
  font-weight: bold;
  text-transform: uppercase;
  font-size: 0.8em;
}

.log-source {
  background: #e9ecef;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 0.8em;
}

.log-timestamp {
  color: #6c757d;
  font-size: 0.8em;
}

.log-message {
  font-family: monospace;
  margin: 5px 0;
}

.log-details pre {
  background: #f8f9fa;
  padding: 10px;
  border-radius: 4px;
  overflow-x: auto;
  font-size: 0.8em;
}

.loading, .error {
  text-align: center;
  padding: 40px;
  color: #6c757d;
}

.error {
  color: #dc3545;
  background: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}

.auto-refresh {
  color: #28a745;
  font-size: 0.9em;
}

.no-logs {
  text-align: center;
  padding: 40px;
  color: #6c757d;
  font-style: italic;
}
```

---

## Integração Completa

### Componente Dashboard Completo

```tsx
import React, { useState } from 'react';
import TenantMetrics from './TenantMetrics';
import TenantUsage from './TenantUsage';
import TenantLogs from './TenantLogs';

interface TenantMonitoringDashboardProps {
  tenantId: string;
}

const TenantMonitoringDashboard: React.FC<TenantMonitoringDashboardProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<'metrics' | 'usage' | 'logs'>('metrics');

  return (
    <div className="monitoring-dashboard">
      <div className="dashboard-tabs">
        <button 
          className={activeTab === 'metrics' ? 'active' : ''} 
          onClick={() => setActiveTab('metrics')}
        >
          Métricas
        </button>
        <button 
          className={activeTab === 'usage' ? 'active' : ''} 
          onClick={() => setActiveTab('usage')}
        >
          Uso
        </button>
        <button 
          className={activeTab === 'logs' ? 'active' : ''} 
          onClick={() => setActiveTab('logs')}
        >
          Logs
        </button>
      </div>

      <div className="dashboard-content">
        {activeTab === 'metrics' && <TenantMetrics tenantId={tenantId} />}
        {activeTab === 'usage' && <TenantUsage tenantId={tenantId} />}
        {activeTab === 'logs' && <TenantLogs tenantId={tenantId} autoRefresh={true} />}
      </div>
    </div>
  );
};

export default TenantMonitoringDashboard;
```

Este guia fornece documentação completa para consumir os endpoints de monitoramento e observabilidade da Tenant API, incluindo métricas em tempo real, dados de uso detalhados e logs do sistema.
