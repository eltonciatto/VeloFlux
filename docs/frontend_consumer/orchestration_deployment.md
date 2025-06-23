# Deploy e Ciclo de Vida - Frontend

Este documento detalha como gerenciar o ciclo de vida das implantações, incluindo deploy e drain de instâncias.

## Deploy de Instância

### Endpoint
```
POST /api/tenants/{tenant_id}/orchestration/deploy
```

### Exemplo JavaScript/TypeScript

```typescript
interface DeployResponse {
  status: string;
  message: string;
}

async function deployTenantInstance(tenantId: string): Promise<DeployResponse> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/deploy`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to deploy instance: ${error}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "status": "deploying",
  "message": "Deployment initiated"
}
```

## Drain de Instância

### Endpoint
```
POST /api/tenants/{tenant_id}/orchestration/drain
```

### Exemplo JavaScript/TypeScript

```typescript
interface DrainResponse {
  status: string;
  message: string;
}

async function drainTenantInstance(tenantId: string): Promise<DrainResponse> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/drain`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to drain instance: ${error}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "status": "draining",
  "message": "Drain initiated for tenant instance"
}
```

## Componente React para Gerenciamento de Ciclo de Vida

```tsx
import React, { useState } from 'react';
import { useOrchestrationStatus } from './hooks/useOrchestrationStatus';

interface LifecycleManagerProps {
  tenantId: string;
  onStatusChange?: (status: string) => void;
}

export const LifecycleManager: React.FC<LifecycleManagerProps> = ({ 
  tenantId, 
  onStatusChange 
}) => {
  const { status, loading, error, refresh } = useOrchestrationStatus(tenantId);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleDeploy = async () => {
    try {
      setActionLoading('deploy');
      setActionError(null);
      setActionSuccess(null);

      const result = await deployTenantInstance(tenantId);
      setActionSuccess(`Deploy iniciado: ${result.message}`);
      
      // Aguardar um pouco e atualizar status
      setTimeout(() => {
        refresh();
        onStatusChange?.(result.status);
      }, 1000);
      
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao fazer deploy');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDrain = async () => {
    if (!window.confirm('Tem certeza que deseja drenar esta instância? Isso irá parar gradualmente todos os pods.')) {
      return;
    }

    try {
      setActionLoading('drain');
      setActionError(null);
      setActionSuccess(null);

      const result = await drainTenantInstance(tenantId);
      setActionSuccess(`Drain iniciado: ${result.message}`);
      
      // Aguardar um pouco e atualizar status
      setTimeout(() => {
        refresh();
        onStatusChange?.(result.status);
      }, 1000);
      
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Erro ao drenar instância');
    } finally {
      setActionLoading(null);
    }
  };

  const canDeploy = () => {
    if (!status) return false;
    return ['stopped', 'failed', 'ready'].includes(status.status.toLowerCase());
  };

  const canDrain = () => {
    if (!status) return false;
    return ['ready', 'running', 'deploying'].includes(status.status.toLowerCase()) && 
           status.mode === 'dedicated';
  };

  const isActionInProgress = () => {
    if (!status) return false;
    return ['deploying', 'draining', 'updating'].includes(status.status.toLowerCase());
  };

  // Limpar mensagens após 5 segundos
  React.useEffect(() => {
    if (actionSuccess || actionError) {
      const timer = setTimeout(() => {
        setActionSuccess(null);
        setActionError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [actionSuccess, actionError]);

  if (loading && !status) {
    return <div className="lifecycle-loading">Carregando...</div>;
  }

  return (
    <div className="lifecycle-manager">
      <div className="lifecycle-header">
        <h3>Gerenciamento de Ciclo de Vida</h3>
        {status && (
          <div className="current-status">
            Status atual: <span className={`status-${status.status.toLowerCase()}`}>
              {status.status}
            </span>
          </div>
        )}
      </div>

      {(actionSuccess || actionError) && (
        <div className={`action-message ${actionError ? 'error' : 'success'}`}>
          {actionSuccess || actionError}
        </div>
      )}

      {error && (
        <div className="lifecycle-error">
          Erro ao carregar status: {error}
        </div>
      )}

      <div className="lifecycle-actions">
        <div className="action-group">
          <button
            className="deploy-button"
            onClick={handleDeploy}
            disabled={!canDeploy() || actionLoading !== null || isActionInProgress()}
            title={!canDeploy() ? 'Deploy não disponível no status atual' : 'Iniciar nova implantação'}
          >
            {actionLoading === 'deploy' ? (
              <>
                <span className="spinner"></span>
                Fazendo Deploy...
              </>
            ) : (
              <>
                🚀 Deploy
              </>
            )}
          </button>

          <div className="action-description">
            <small>
              {status?.mode === 'dedicated' 
                ? 'Cria ou atualiza uma instância dedicada para este tenant'
                : 'Configura o tenant para modo compartilhado'
              }
            </small>
          </div>
        </div>

        {status?.mode === 'dedicated' && (
          <div className="action-group">
            <button
              className="drain-button"
              onClick={handleDrain}
              disabled={!canDrain() || actionLoading !== null}
              title={!canDrain() ? 'Drain não disponível no status atual' : 'Drenar instância gradualmente'}
            >
              {actionLoading === 'drain' ? (
                <>
                  <span className="spinner"></span>
                  Drenando...
                </>
              ) : (
                <>
                  ⏹️ Drain
                </>
              )}
            </button>

            <div className="action-description">
              <small>
                Para gradualmente a instância, permitindo que requests em andamento terminem
              </small>
            </div>
          </div>
        )}
      </div>

      {isActionInProgress() && (
        <div className="progress-indicator">
          <div className="progress-message">
            <span className="spinner"></span>
            {status?.status === 'deploying' && 'Implantação em progresso...'}
            {status?.status === 'draining' && 'Drenagem em progresso...'}
            {status?.status === 'updating' && 'Atualização em progresso...'}
          </div>
          <div className="progress-tip">
            <small>Acompanhe o progresso na seção de status acima</small>
          </div>
        </div>
      )}

      <div className="lifecycle-info">
        <h4>Informações sobre Modos</h4>
        <div className="mode-info">
          <div className="mode-item">
            <strong>Modo Compartilhado:</strong>
            <p>A instância roda em um namespace compartilhado com outros tenants. Mais eficiente em recursos.</p>
          </div>
          <div className="mode-item">
            <strong>Modo Dedicado:</strong>
            <p>Cada tenant tem sua própria instância em namespace dedicado. Maior isolamento e controle.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Hook para Operações de Ciclo de Vida

```typescript
import { useState, useCallback } from 'react';

interface LifecycleOperations {
  deploy: (tenantId: string) => Promise<void>;
  drain: (tenantId: string) => Promise<void>;
  loading: string | null;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export function useLifecycleOperations(): LifecycleOperations {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const deploy = useCallback(async (tenantId: string) => {
    try {
      setLoading('deploy');
      setError(null);
      setSuccess(null);

      const result = await deployTenantInstance(tenantId);
      setSuccess(`Deploy iniciado: ${result.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer deploy');
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  const drain = useCallback(async (tenantId: string) => {
    try {
      setLoading('drain');
      setError(null);
      setSuccess(null);

      const result = await drainTenantInstance(tenantId);
      setSuccess(`Drain iniciado: ${result.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao drenar instância');
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    deploy,
    drain,
    loading,
    error,
    success,
    clearMessages
  };
}
```

## Monitoramento de Progresso

```tsx
import React, { useEffect, useState } from 'react';

interface ProgressMonitorProps {
  tenantId: string;
  expectedStatus: string; // Status que esperamos alcançar
  onComplete?: () => void;
  onTimeout?: () => void;
  timeoutMs?: number; // Timeout em milliseconds
}

export const ProgressMonitor: React.FC<ProgressMonitorProps> = ({
  tenantId,
  expectedStatus,
  onComplete,
  onTimeout,
  timeoutMs = 300000 // 5 minutos
}) => {
  const { status, refresh } = useOrchestrationStatus(tenantId, { refreshInterval: 5 });
  const [startTime] = useState(Date.now());
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (status?.status === expectedStatus && !hasCompleted) {
      setHasCompleted(true);
      onComplete?.();
    }
  }, [status?.status, expectedStatus, onComplete, hasCompleted]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!hasCompleted) {
        onTimeout?.();
      }
    }, timeoutMs);

    return () => clearTimeout(timer);
  }, [hasCompleted, onTimeout, timeoutMs]);

  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
  const progress = Math.min((elapsedTime / (timeoutMs / 1000)) * 100, 100);

  return (
    <div className="progress-monitor">
      <div className="progress-bar">
        <div 
          className="progress-fill"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      
      <div className="progress-details">
        <span>Aguardando status: {expectedStatus}</span>
        <span>Tempo decorrido: {elapsedTime}s</span>
        {status && <span>Status atual: {status.status}</span>}
      </div>
    </div>
  );
};
```

## Tratamento de Erros Específicos

```typescript
export class DeploymentError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any
  ) {
    super(message);
    this.name = 'DeploymentError';
  }
}

export async function deployWithErrorHandling(tenantId: string): Promise<DeployResponse> {
  try {
    return await deployTenantInstance(tenantId);
  } catch (error) {
    if (error instanceof Error) {
      // Tratar erros específicos
      if (error.message.includes('configuration not found')) {
        throw new DeploymentError(
          'Configuração de orquestração não encontrada. Configure primeiro.',
          'CONFIG_NOT_FOUND'
        );
      }
      
      if (error.message.includes('insufficient resources')) {
        throw new DeploymentError(
          'Recursos insuficientes para implantação.',
          'INSUFFICIENT_RESOURCES'
        );
      }
      
      if (error.message.includes('already deploying')) {
        throw new DeploymentError(
          'Uma implantação já está em andamento.',
          'ALREADY_DEPLOYING'
        );
      }
    }
    
    throw error;
  }
}
```

## Estilos CSS

```css
.lifecycle-manager {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.lifecycle-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.current-status {
  font-weight: bold;
}

.status-ready { color: #4caf50; }
.status-deploying { color: #ff9800; }
.status-draining { color: #f44336; }
.status-failed { color: #d32f2f; }
.status-stopped { color: #757575; }

.action-message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.action-message.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.action-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.lifecycle-error {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.lifecycle-actions {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 20px;
}

.action-group {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.deploy-button,
.drain-button {
  padding: 12px 24px;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s;
}

.deploy-button {
  background-color: #4caf50;
  color: white;
}

.deploy-button:hover:not(:disabled) {
  background-color: #45a049;
}

.drain-button {
  background-color: #f44336;
  color: white;
}

.drain-button:hover:not(:disabled) {
  background-color: #da190b;
}

.deploy-button:disabled,
.drain-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
  opacity: 0.6;
}

.action-description {
  color: #666;
  font-style: italic;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-indicator {
  background-color: #e3f2fd;
  border: 1px solid #bbdefb;
  border-radius: 4px;
  padding: 15px;
  text-align: center;
}

.progress-message {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  font-weight: bold;
  color: #1976d2;
  margin-bottom: 5px;
}

.progress-tip {
  color: #666;
}

.lifecycle-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.lifecycle-info h4 {
  margin-bottom: 10px;
  color: #333;
}

.mode-info {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mode-item {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
}

.mode-item strong {
  display: block;
  margin-bottom: 5px;
  color: #1976d2;
}

.mode-item p {
  margin: 0;
  color: #666;
  font-size: 0.9em;
}

.progress-monitor {
  margin: 15px 0;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background-color: #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 10px;
}

.progress-fill {
  height: 100%;
  background-color: #2196f3;
  transition: width 0.3s ease;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  font-size: 0.9em;
  color: #666;
}

@media (max-width: 768px) {
  .lifecycle-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .progress-details {
    flex-direction: column;
    gap: 5px;
  }
}
```
