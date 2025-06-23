# Escalonamento - Frontend

Este documento detalha como gerenciar escalonamento manual e automático de instâncias de tenants.

## Escalonamento Manual

### Endpoint
```
POST /api/tenants/{tenant_id}/orchestration/scale
```

### Exemplo JavaScript/TypeScript

```typescript
interface ScaleRequest {
  replicas: number;
}

interface ScaleResponse {
  status: string;
  message: string;
}

async function scaleTenantInstance(tenantId: string, replicas: number): Promise<ScaleResponse> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/scale`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ replicas })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to scale instance: ${error}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "status": "scaling",
  "message": "Scaling to 5 replicas"
}
```

## Configuração de Autoescalonamento

### Endpoint
```
PUT /api/tenants/{tenant_id}/orchestration/autoscale
```

### Exemplo JavaScript/TypeScript

```typescript
interface AutoscalingRequest {
  enabled: boolean;
  min_replicas: number;
  max_replicas: number;
  target_cpu_utilization: number;
}

interface AutoscalingResponse {
  status: string;
  autoscaling: {
    enabled: boolean;
    min_replicas: number;
    max_replicas: number;
    target_cpu_utilization: number;
  };
}

async function setAutoscaling(
  tenantId: string, 
  config: AutoscalingRequest
): Promise<AutoscalingResponse> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/autoscale`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update autoscaling: ${error}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "status": "updated",
  "autoscaling": {
    "enabled": true,
    "min_replicas": 2,
    "max_replicas": 10,
    "target_cpu_utilization": 70
  }
}
```

## Componente React para Escalonamento

```tsx
import React, { useState, useEffect } from 'react';
import { useOrchestrationStatus } from './hooks/useOrchestrationStatus';

interface ScalingManagerProps {
  tenantId: string;
  onScalingChange?: (replicas: number) => void;
}

export const ScalingManager: React.FC<ScalingManagerProps> = ({ 
  tenantId, 
  onScalingChange 
}) => {
  const { status, loading, refresh } = useOrchestrationStatus(tenantId);
  const [config, setConfig] = useState<OrchestrationConfig | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Estados para escalonamento manual
  const [manualReplicas, setManualReplicas] = useState<number>(1);
  
  // Estados para autoescalonamento
  const [autoscalingConfig, setAutoscalingConfig] = useState({
    enabled: false,
    min_replicas: 1,
    max_replicas: 5,
    target_cpu_utilization: 70
  });

  useEffect(() => {
    loadConfiguration();
  }, [tenantId]);

  useEffect(() => {
    if (config) {
      setAutoscalingConfig({
        enabled: config.autoscaling_enabled,
        min_replicas: config.min_replicas,
        max_replicas: config.max_replicas,
        target_cpu_utilization: config.target_cpu_utilization
      });
      
      if (status?.replicas) {
        setManualReplicas(status.replicas);
      }
    }
  }, [config, status]);

  const loadConfiguration = async () => {
    try {
      const configData = await getOrchestrationConfig(tenantId);
      setConfig(configData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    }
  };

  const handleManualScale = async () => {
    if (manualReplicas < 1) {
      setError('O número de réplicas deve ser pelo menos 1');
      return;
    }

    try {
      setActionLoading('scale');
      setError(null);
      setSuccess(null);

      const result = await scaleTenantInstance(tenantId, manualReplicas);
      setSuccess(`Escalonamento iniciado: ${result.message}`);
      
      setTimeout(() => {
        refresh();
        onScalingChange?.(manualReplicas);
      }, 1000);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao escalonar instância');
    } finally {
      setActionLoading(null);
    }
  };

  const handleAutoscalingUpdate = async () => {
    if (autoscalingConfig.enabled) {
      if (autoscalingConfig.min_replicas < 1) {
        setError('Réplicas mínimas deve ser pelo menos 1');
        return;
      }
      if (autoscalingConfig.max_replicas < autoscalingConfig.min_replicas) {
        setError('Réplicas máximas deve ser maior ou igual às mínimas');
        return;
      }
      if (autoscalingConfig.target_cpu_utilization < 10 || autoscalingConfig.target_cpu_utilization > 100) {
        setError('Utilização de CPU deve estar entre 10% e 100%');
        return;
      }
    }

    try {
      setActionLoading('autoscale');
      setError(null);
      setSuccess(null);

      const result = await setAutoscaling(tenantId, autoscalingConfig);
      setSuccess('Configuração de autoescalonamento atualizada');
      
      await loadConfiguration();
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar autoescalonamento');
    } finally {
      setActionLoading(null);
    }
  };

  const canScale = () => {
    return status?.mode === 'dedicated' && 
           ['ready', 'running'].includes(status.status.toLowerCase()) &&
           !config?.autoscaling_enabled;
  };

  const isScaling = () => {
    return status?.status === 'scaling';
  };

  // Limpar mensagens após 5 segundos
  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (loading && !status) {
    return <div className="scaling-loading">Carregando...</div>;
  }

  return (
    <div className="scaling-manager">
      <div className="scaling-header">
        <h3>Gerenciamento de Escalonamento</h3>
        {status && (
          <div className="current-replicas">
            Réplicas atuais: {status.ready_replicas || 0} / {status.replicas || 0}
            {isScaling() && <span className="scaling-indicator">🔄</span>}
          </div>
        )}
      </div>

      {(success || error) && (
        <div className={`scaling-message ${error ? 'error' : 'success'}`}>
          {success || error}
        </div>
      )}

      {status?.mode !== 'dedicated' && (
        <div className="scaling-warning">
          ⚠️ Escalonamento só está disponível para instâncias em modo dedicado
        </div>
      )}

      {status?.mode === 'dedicated' && (
        <>
          {/* Autoescalonamento */}
          <div className="autoscaling-section">
            <h4>Autoescalonamento</h4>
            
            <div className="autoscaling-toggle">
              <label>
                <input
                  type="checkbox"
                  checked={autoscalingConfig.enabled}
                  onChange={(e) => setAutoscalingConfig({
                    ...autoscalingConfig,
                    enabled: e.target.checked
                  })}
                  disabled={actionLoading !== null}
                />
                Habilitar Autoescalonamento
              </label>
            </div>

            {autoscalingConfig.enabled && (
              <div className="autoscaling-config">
                <div className="config-row">
                  <div className="config-item">
                    <label>Réplicas Mínimas:</label>
                    <input
                      type="number"
                      min="1"
                      value={autoscalingConfig.min_replicas}
                      onChange={(e) => setAutoscalingConfig({
                        ...autoscalingConfig,
                        min_replicas: parseInt(e.target.value) || 1
                      })}
                      disabled={actionLoading !== null}
                    />
                  </div>

                  <div className="config-item">
                    <label>Réplicas Máximas:</label>
                    <input
                      type="number"
                      min={autoscalingConfig.min_replicas}
                      value={autoscalingConfig.max_replicas}
                      onChange={(e) => setAutoscalingConfig({
                        ...autoscalingConfig,
                        max_replicas: parseInt(e.target.value) || autoscalingConfig.min_replicas
                      })}
                      disabled={actionLoading !== null}
                    />
                  </div>

                  <div className="config-item">
                    <label>CPU Alvo (%):</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
                      value={autoscalingConfig.target_cpu_utilization}
                      onChange={(e) => setAutoscalingConfig({
                        ...autoscalingConfig,
                        target_cpu_utilization: parseInt(e.target.value) || 70
                      })}
                      disabled={actionLoading !== null}
                    />
                  </div>
                </div>

                <div className="autoscaling-description">
                  <small>
                    O autoescalonamento ajustará automaticamente o número de réplicas 
                    baseado na utilização de CPU média.
                  </small>
                </div>
              </div>
            )}

            <button
              className="autoscaling-save-button"
              onClick={handleAutoscalingUpdate}
              disabled={actionLoading !== null}
            >
              {actionLoading === 'autoscale' ? (
                <>
                  <span className="spinner"></span>
                  Salvando...
                </>
              ) : (
                'Salvar Configuração'
              )}
            </button>
          </div>

          {/* Escalonamento Manual */}
          {!config?.autoscaling_enabled && (
            <div className="manual-scaling-section">
              <h4>Escalonamento Manual</h4>
              
              <div className="manual-scaling-controls">
                <div className="replica-input">
                  <label>Número de Réplicas:</label>
                  <div className="replica-controls">
                    <button
                      className="replica-button"
                      onClick={() => setManualReplicas(Math.max(1, manualReplicas - 1))}
                      disabled={manualReplicas <= 1 || actionLoading !== null}
                    >
                      -
                    </button>
                    
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={manualReplicas}
                      onChange={(e) => setManualReplicas(parseInt(e.target.value) || 1)}
                      disabled={actionLoading !== null}
                    />
                    
                    <button
                      className="replica-button"
                      onClick={() => setManualReplicas(Math.min(50, manualReplicas + 1))}
                      disabled={manualReplicas >= 50 || actionLoading !== null}
                    >
                      +
                    </button>
                  </div>
                </div>

                <button
                  className="scale-button"
                  onClick={handleManualScale}
                  disabled={!canScale() || actionLoading !== null || manualReplicas === status?.replicas}
                  title={!canScale() ? 'Escalonamento não disponível no status atual' : undefined}
                >
                  {actionLoading === 'scale' ? (
                    <>
                      <span className="spinner"></span>
                      Escalonando...
                    </>
                  ) : (
                    `Escalonar para ${manualReplicas} réplica${manualReplicas !== 1 ? 's' : ''}`
                  )}
                </button>
              </div>

              <div className="scaling-presets">
                <span>Presets rápidos:</span>
                {[1, 2, 3, 5, 10].map(preset => (
                  <button
                    key={preset}
                    className={`preset-button ${manualReplicas === preset ? 'active' : ''}`}
                    onClick={() => setManualReplicas(preset)}
                    disabled={actionLoading !== null}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {config?.autoscaling_enabled && (
            <div className="autoscaling-status">
              <div className="status-item">
                <span className="status-label">Autoescalonamento:</span>
                <span className="status-value enabled">✅ Habilitado</span>
              </div>
              <div className="status-item">
                <span className="status-label">Faixa de réplicas:</span>
                <span className="status-value">{config.min_replicas} - {config.max_replicas}</span>
              </div>
              <div className="status-item">
                <span className="status-label">CPU alvo:</span>
                <span className="status-value">{config.target_cpu_utilization}%</span>
              </div>
            </div>
          )}
        </>
      )}

      <div className="scaling-info">
        <h4>Informações sobre Escalonamento</h4>
        <div className="info-items">
          <div className="info-item">
            <strong>Escalonamento Manual:</strong>
            <p>Permite definir exatamente quantas réplicas devem estar rodando.</p>
          </div>
          <div className="info-item">
            <strong>Autoescalonamento:</strong>
            <p>Ajusta automaticamente o número de réplicas baseado na utilização de CPU.</p>
          </div>
          <div className="info-item">
            <strong>Limitações:</strong>
            <p>Disponível apenas para instâncias em modo dedicado.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Hook para Escalonamento

```typescript
import { useState, useCallback } from 'react';

interface ScalingOperations {
  scale: (tenantId: string, replicas: number) => Promise<void>;
  setAutoscaling: (tenantId: string, config: AutoscalingRequest) => Promise<void>;
  loading: string | null;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export function useScalingOperations(): ScalingOperations {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const scale = useCallback(async (tenantId: string, replicas: number) => {
    try {
      setLoading('scale');
      setError(null);
      setSuccess(null);

      const result = await scaleTenantInstance(tenantId, replicas);
      setSuccess(`Escalonamento iniciado: ${result.message}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao escalonar');
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  const setAutoscaling = useCallback(async (tenantId: string, config: AutoscalingRequest) => {
    try {
      setLoading('autoscale');
      setError(null);
      setSuccess(null);

      const result = await setAutoscaling(tenantId, config);
      setSuccess('Autoescalonamento configurado com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao configurar autoescalonamento');
      throw err;
    } finally {
      setLoading(null);
    }
  }, []);

  return {
    scale,
    setAutoscaling,
    loading,
    error,
    success,
    clearMessages
  };
}
```

## Validações e Regras de Negócio

### Validações Frontend

```typescript
export const validateScalingParams = {
  replicas: (replicas: number) => {
    if (replicas < 1) return 'Número de réplicas deve ser pelo menos 1';
    if (replicas > 50) return 'Número máximo de réplicas é 50';
    return null;
  },

  autoscaling: (config: AutoscalingRequest) => {
    const errors: string[] = [];
    
    if (config.enabled) {
      if (config.min_replicas < 1) {
        errors.push('Réplicas mínimas deve ser pelo menos 1');
      }
      
      if (config.max_replicas < config.min_replicas) {
        errors.push('Réplicas máximas deve ser maior ou igual às mínimas');
      }
      
      if (config.target_cpu_utilization < 10 || config.target_cpu_utilization > 100) {
        errors.push('Utilização de CPU deve estar entre 10% e 100%');
      }
    }
    
    return errors.length > 0 ? errors : null;
  }
};
```

## Estilos CSS

```css
.scaling-manager {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.scaling-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.current-replicas {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  color: #666;
}

.scaling-indicator {
  animation: spin 1s linear infinite;
}

.scaling-message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.scaling-message.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.scaling-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.scaling-warning {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.autoscaling-section,
.manual-scaling-section {
  margin-bottom: 30px;
  padding: 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.autoscaling-section h4,
.manual-scaling-section h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.autoscaling-toggle {
  margin-bottom: 15px;
}

.autoscaling-toggle label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: bold;
  cursor: pointer;
}

.autoscaling-config {
  margin: 15px 0;
}

.config-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 15px;
  margin-bottom: 10px;
}

.config-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.config-item label {
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

.config-item input {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.autoscaling-description {
  color: #666;
  font-style: italic;
  margin-bottom: 15px;
}

.autoscaling-save-button,
.scale-button {
  background-color: #2196f3;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.autoscaling-save-button:hover:not(:disabled),
.scale-button:hover:not(:disabled) {
  background-color: #1976d2;
}

.autoscaling-save-button:disabled,
.scale-button:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}

.manual-scaling-controls {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.replica-input {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.replica-input label {
  font-weight: bold;
  color: #555;
}

.replica-controls {
  display: flex;
  align-items: center;
  gap: 10px;
}

.replica-button {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-size: 18px;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
}

.replica-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.replica-button:disabled {
  background-color: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.replica-controls input {
  width: 80px;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
  text-align: center;
  font-size: 16px;
}

.scaling-presets {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.scaling-presets span {
  font-weight: bold;
  color: #555;
}

.preset-button {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.preset-button:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.preset-button.active {
  background-color: #2196f3;
  color: white;
  border-color: #1976d2;
}

.preset-button:disabled {
  background-color: #f5f5f5;
  color: #ccc;
  cursor: not-allowed;
}

.autoscaling-status {
  background-color: #e8f5e8;
  border: 1px solid #c8e6c9;
  border-radius: 4px;
  padding: 15px;
  margin-top: 15px;
}

.status-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.status-item:last-child {
  margin-bottom: 0;
}

.status-label {
  font-weight: bold;
  color: #555;
}

.status-value {
  color: #333;
}

.status-value.enabled {
  color: #4caf50;
  font-weight: bold;
}

.scaling-info {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.scaling-info h4 {
  margin-bottom: 15px;
  color: #333;
}

.info-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.info-item {
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #2196f3;
}

.info-item strong {
  display: block;
  margin-bottom: 5px;
  color: #1976d2;
}

.info-item p {
  margin: 0;
  color: #666;
  font-size: 0.9em;
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

@media (max-width: 768px) {
  .scaling-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .config-row {
    grid-template-columns: 1fr;
  }

  .manual-scaling-controls {
    align-items: flex-start;
  }

  .replica-controls {
    flex-wrap: wrap;
  }

  .scaling-presets {
    flex-direction: column;
    align-items: flex-start;
  }
}
```
