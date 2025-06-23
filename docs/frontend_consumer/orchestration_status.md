# Status e Monitoramento de Orquestração - Frontend

Este documento detalha como monitorar o status de implantação e obter informações detalhadas sobre o estado das instâncias.

## Status Básico de Implantação

### Endpoint
```
GET /api/tenants/{tenant_id}/orchestration/status
```

### Exemplo JavaScript/TypeScript

```typescript
interface DeploymentStatus {
  tenant_id: string;
  mode: "shared" | "dedicated";
  status: string;
  namespace: string;
  version: string;
}

async function getDeploymentStatus(tenantId: string): Promise<DeploymentStatus> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get deployment status: ${response.statusText}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "tenant_id": "tenant-123",
  "mode": "dedicated",
  "status": "ready",
  "namespace": "veloflux-tenant-123",
  "version": "v1.2.3"
}
```

## Status Detalhado de Implantação

### Endpoint
```
GET /api/tenants/{tenant_id}/orchestration/detailed_status
```

### Exemplo JavaScript/TypeScript

```typescript
interface DetailedDeploymentStatus extends DeploymentStatus {
  replicas?: number;
  ready_replicas?: number;
  conditions?: Condition[];
  last_updated?: string;
}

interface Condition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}

async function getDetailedDeploymentStatus(tenantId: string): Promise<DetailedDeploymentStatus> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/detailed_status`, {
    method: 'GET',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get detailed deployment status: ${response.statusText}`);
  }

  return response.json();
}
```

### Exemplo de Resposta Detalhada

```json
{
  "tenant_id": "tenant-123",
  "mode": "dedicated",
  "status": "ready",
  "namespace": "veloflux-tenant-123",
  "version": "v1.2.3",
  "replicas": 3,
  "ready_replicas": 3,
  "conditions": [
    {
      "type": "Available",
      "status": "True",
      "reason": "MinimumReplicasAvailable",
      "message": "Deployment has minimum availability."
    },
    {
      "type": "Progressing",
      "status": "True",
      "reason": "NewReplicaSetAvailable",
      "message": "ReplicaSet has successfully progressed."
    }
  ],
  "last_updated": "2024-01-15T10:30:00Z"
}
```

## Componente React para Monitoramento

```tsx
import React, { useState, useEffect } from 'react';

interface StatusMonitorProps {
  tenantId: string;
  refreshInterval?: number; // em segundos, padrão 30s
}

export const OrchestrationStatusMonitor: React.FC<StatusMonitorProps> = ({ 
  tenantId, 
  refreshInterval = 30 
}) => {
  const [status, setStatus] = useState<DetailedDeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  useEffect(() => {
    loadStatus();
    
    // Configurar refresh automático
    const interval = setInterval(loadStatus, refreshInterval * 1000);
    
    return () => clearInterval(interval);
  }, [tenantId, refreshInterval]);

  const loadStatus = async () => {
    try {
      setError(null);
      const detailedStatus = await getDetailedDeploymentStatus(tenantId);
      setStatus(detailedStatus);
      setLastRefresh(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'running':
        return 'green';
      case 'deploying':
      case 'scaling':
      case 'updating':
        return 'orange';
      case 'failed':
      case 'error':
        return 'red';
      case 'draining':
      case 'stopped':
        return 'gray';
      default:
        return 'blue';
    }
  };

  const getStatusIcon = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'ready':
      case 'running':
        return '✅';
      case 'deploying':
      case 'scaling':
      case 'updating':
        return '🔄';
      case 'failed':
      case 'error':
        return '❌';
      case 'draining':
      case 'stopped':
        return '⏹️';
      default:
        return '🔵';
    }
  };

  if (loading && !status) {
    return <div className="status-loading">Carregando status...</div>;
  }

  return (
    <div className="orchestration-status">
      <div className="status-header">
        <h3>Status da Instância</h3>
        <div className="status-controls">
          <button onClick={loadStatus} disabled={loading}>
            {loading ? 'Atualizando...' : 'Atualizar'}
          </button>
          <span className="last-refresh">
            Última atualização: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
      </div>

      {error && (
        <div className="status-error">
          <p>Erro: {error}</p>
        </div>
      )}

      {status && (
        <div className="status-content">
          <div className="status-overview">
            <div className="status-item">
              <label>Status:</label>
              <span 
                className="status-badge"
                style={{ color: getStatusColor(status.status) }}
              >
                {getStatusIcon(status.status)} {status.status}
              </span>
            </div>

            <div className="status-item">
              <label>Modo:</label>
              <span className={`mode-badge mode-${status.mode}`}>
                {status.mode === 'dedicated' ? 'Dedicado' : 'Compartilhado'}
              </span>
            </div>

            <div className="status-item">
              <label>Namespace:</label>
              <span>{status.namespace}</span>
            </div>

            <div className="status-item">
              <label>Versão:</label>
              <span>{status.version}</span>
            </div>

            {status.replicas !== undefined && (
              <div className="status-item">
                <label>Réplicas:</label>
                <span>
                  {status.ready_replicas || 0} / {status.replicas}
                  {status.ready_replicas === status.replicas ? ' ✅' : ' ⚠️'}
                </span>
              </div>
            )}
          </div>

          {status.conditions && status.conditions.length > 0 && (
            <div className="status-conditions">
              <h4>Condições</h4>
              <div className="conditions-list">
                {status.conditions.map((condition, index) => (
                  <ConditionItem key={index} condition={condition} />
                ))}
              </div>
            </div>
          )}

          {status.last_updated && (
            <div className="status-meta">
              <small>
                Última atualização do sistema: {new Date(status.last_updated).toLocaleString()}
              </small>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface ConditionItemProps {
  condition: Condition;
}

const ConditionItem: React.FC<ConditionItemProps> = ({ condition }) => {
  const getConditionColor = (status: string): string => {
    return status === 'True' ? 'green' : status === 'False' ? 'red' : 'orange';
  };

  const getConditionIcon = (status: string): string => {
    return status === 'True' ? '✅' : status === 'False' ? '❌' : '⚠️';
  };

  return (
    <div className="condition-item">
      <div className="condition-header">
        <span className="condition-type">{condition.type}</span>
        <span 
          className="condition-status"
          style={{ color: getConditionColor(condition.status) }}
        >
          {getConditionIcon(condition.status)} {condition.status}
        </span>
      </div>
      
      {condition.reason && (
        <div className="condition-reason">
          <strong>Motivo:</strong> {condition.reason}
        </div>
      )}
      
      {condition.message && (
        <div className="condition-message">
          <strong>Mensagem:</strong> {condition.message}
        </div>
      )}
    </div>
  );
};
```

## Hook Personalizado para Status

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseOrchestrationStatusOptions {
  refreshInterval?: number;
  autoRefresh?: boolean;
}

export function useOrchestrationStatus(
  tenantId: string,
  options: UseOrchestrationStatusOptions = {}
) {
  const { refreshInterval = 30, autoRefresh = true } = options;
  
  const [status, setStatus] = useState<DetailedDeploymentStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const refresh = useCallback(async () => {
    try {
      setError(null);
      const newStatus = await getDetailedDeploymentStatus(tenantId);
      setStatus(newStatus);
      setLastRefresh(new Date());
      return newStatus;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar status';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    refresh();
    
    if (autoRefresh) {
      const interval = setInterval(refresh, refreshInterval * 1000);
      return () => clearInterval(interval);
    }
  }, [refresh, autoRefresh, refreshInterval]);

  return {
    status,
    loading,
    error,
    lastRefresh,
    refresh
  };
}
```

## Interpretação de Status

### Status Comuns

| Status | Descrição | Ação Recomendada |
|--------|-----------|------------------|
| `ready` | Instância funcionando normalmente | Nenhuma |
| `deploying` | Implantação em andamento | Aguardar conclusão |
| `scaling` | Escalonamento em andamento | Aguardar conclusão |
| `updating` | Atualização em andamento | Aguardar conclusão |
| `failed` | Falha na implantação | Verificar logs e reimplantar |
| `draining` | Instância sendo drenada | Aguardar conclusão |
| `stopped` | Instância parada | Iniciar se necessário |

### Condições Kubernetes

| Tipo | Status True | Status False |
|------|-------------|--------------|
| `Available` | Réplicas mínimas disponíveis | Sem réplicas suficientes |
| `Progressing` | Implantação progredindo | Implantação travada |
| `ReplicaFailure` | - | Falha ao criar réplicas |

## Estilos CSS

```css
.orchestration-status {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.status-controls {
  display: flex;
  align-items: center;
  gap: 15px;
}

.last-refresh {
  font-size: 0.9em;
  color: #666;
}

.status-loading,
.status-error {
  text-align: center;
  padding: 20px;
}

.status-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  border-radius: 4px;
}

.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.status-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.status-item label {
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

.status-badge {
  font-weight: bold;
  font-size: 1.1em;
}

.mode-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.9em;
  font-weight: bold;
}

.mode-dedicated {
  background-color: #e3f2fd;
  color: #1976d2;
}

.mode-shared {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.status-conditions {
  margin-top: 20px;
}

.status-conditions h4 {
  margin-bottom: 10px;
  color: #333;
}

.conditions-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.condition-item {
  border: 1px solid #eee;
  border-radius: 4px;
  padding: 10px;
  background-color: #f9f9f9;
}

.condition-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.condition-type {
  font-weight: bold;
}

.condition-status {
  font-weight: bold;
}

.condition-reason,
.condition-message {
  font-size: 0.9em;
  color: #666;
  margin-top: 5px;
}

.status-meta {
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
  text-align: center;
}
```
