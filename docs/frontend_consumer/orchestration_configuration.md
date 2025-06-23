# Configuração de Orquestração - Frontend

Este documento detalha como gerenciar configurações de orquestração para tenants.

## Obter Configuração

### Endpoint
```
GET /api/tenants/{tenant_id}/orchestration
```

### Exemplo JavaScript/TypeScript

```typescript
interface OrchestrationConfig {
  tenant_id: string;
  mode: "shared" | "dedicated";
  dedicated_namespace?: string;
  autoscaling_enabled: boolean;
  min_replicas: number;
  max_replicas: number;
  target_cpu_utilization: number;
  resource_limits: {
    cpu_request: string;
    cpu_limit: string;
    memory_request: string;
    memory_limit: string;
  };
}

async function getOrchestrationConfig(tenantId: string): Promise<OrchestrationConfig> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration`, {
    method: 'GET',
    credentials: 'include', // Para incluir cookies
    headers: {
      'Content-Type': 'application/json',
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to get orchestration config: ${response.statusText}`);
  }

  return response.json();
}
```

### Exemplo de Resposta

```json
{
  "tenant_id": "tenant-123",
  "mode": "dedicated",
  "dedicated_namespace": "veloflux-tenant-123",
  "autoscaling_enabled": true,
  "min_replicas": 2,
  "max_replicas": 10,
  "target_cpu_utilization": 70,
  "resource_limits": {
    "cpu_request": "100m",
    "cpu_limit": "500m",
    "memory_request": "256Mi",
    "memory_limit": "512Mi"
  }
}
```

## Definir/Atualizar Configuração

### Endpoint
```
PUT /api/tenants/{tenant_id}/orchestration
```

### Exemplo JavaScript/TypeScript

```typescript
interface SetOrchestrationConfigRequest {
  mode: "shared" | "dedicated";
  autoscaling_enabled: boolean;
  min_replicas?: number;
  max_replicas?: number;
  target_cpu_utilization?: number;
  resource_limits?: {
    cpu_request?: string;
    cpu_limit?: string;
    memory_request?: string;
    memory_limit?: string;
  };
}

async function setOrchestrationConfig(
  tenantId: string, 
  config: SetOrchestrationConfigRequest
): Promise<void> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(config)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to set orchestration config: ${error}`);
  }
}
```

### Exemplo de Requisição

```json
{
  "mode": "dedicated",
  "autoscaling_enabled": true,
  "min_replicas": 2,
  "max_replicas": 8,
  "target_cpu_utilization": 75,
  "resource_limits": {
    "cpu_request": "200m",
    "cpu_limit": "800m",
    "memory_request": "512Mi",
    "memory_limit": "1Gi"
  }
}
```

## Componente React para Configuração

```tsx
import React, { useState, useEffect } from 'react';

interface OrchestrationConfigProps {
  tenantId: string;
}

export const OrchestrationConfigManager: React.FC<OrchestrationConfigProps> = ({ tenantId }) => {
  const [config, setConfig] = useState<OrchestrationConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar configuração atual
  useEffect(() => {
    loadConfig();
  }, [tenantId]);

  const loadConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const currentConfig = await getOrchestrationConfig(tenantId);
      setConfig(currentConfig);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async (newConfig: SetOrchestrationConfigRequest) => {
    try {
      setSaving(true);
      setError(null);
      await setOrchestrationConfig(tenantId, newConfig);
      await loadConfig(); // Recarregar para obter dados atualizados
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar configuração');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div>Carregando configuração...</div>;
  }

  if (error) {
    return (
      <div className="error">
        <p>Erro: {error}</p>
        <button onClick={loadConfig}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="orchestration-config">
      <h3>Configuração de Orquestração</h3>
      
      {config && (
        <OrchestrationConfigForm
          config={config}
          onSave={handleSaveConfig}
          saving={saving}
        />
      )}
    </div>
  );
};

interface OrchestrationConfigFormProps {
  config: OrchestrationConfig;
  onSave: (config: SetOrchestrationConfigRequest) => Promise<void>;
  saving: boolean;
}

const OrchestrationConfigForm: React.FC<OrchestrationConfigFormProps> = ({
  config,
  onSave,
  saving
}) => {
  const [formData, setFormData] = useState({
    mode: config.mode,
    autoscaling_enabled: config.autoscaling_enabled,
    min_replicas: config.min_replicas,
    max_replicas: config.max_replicas,
    target_cpu_utilization: config.target_cpu_utilization,
    resource_limits: { ...config.resource_limits }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSave(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label>Modo de Execução:</label>
        <select
          value={formData.mode}
          onChange={(e) => setFormData({ ...formData, mode: e.target.value as "shared" | "dedicated" })}
          disabled={saving}
        >
          <option value="shared">Compartilhado</option>
          <option value="dedicated">Dedicado</option>
        </select>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={formData.autoscaling_enabled}
            onChange={(e) => setFormData({ ...formData, autoscaling_enabled: e.target.checked })}
            disabled={saving}
          />
          Autoescalonamento Habilitado
        </label>
      </div>

      {formData.autoscaling_enabled && (
        <>
          <div className="form-group">
            <label>Réplicas Mínimas:</label>
            <input
              type="number"
              min="1"
              value={formData.min_replicas}
              onChange={(e) => setFormData({ ...formData, min_replicas: parseInt(e.target.value) })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Réplicas Máximas:</label>
            <input
              type="number"
              min={formData.min_replicas}
              value={formData.max_replicas}
              onChange={(e) => setFormData({ ...formData, max_replicas: parseInt(e.target.value) })}
              disabled={saving}
            />
          </div>

          <div className="form-group">
            <label>Utilização de CPU Alvo (%):</label>
            <input
              type="number"
              min="10"
              max="100"
              value={formData.target_cpu_utilization}
              onChange={(e) => setFormData({ ...formData, target_cpu_utilization: parseInt(e.target.value) })}
              disabled={saving}
            />
          </div>
        </>
      )}

      <fieldset>
        <legend>Limites de Recursos</legend>
        
        <div className="form-group">
          <label>CPU Request:</label>
          <input
            type="text"
            placeholder="ex: 100m"
            value={formData.resource_limits.cpu_request}
            onChange={(e) => setFormData({
              ...formData,
              resource_limits: { ...formData.resource_limits, cpu_request: e.target.value }
            })}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>CPU Limit:</label>
          <input
            type="text"
            placeholder="ex: 500m"
            value={formData.resource_limits.cpu_limit}
            onChange={(e) => setFormData({
              ...formData,
              resource_limits: { ...formData.resource_limits, cpu_limit: e.target.value }
            })}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Memory Request:</label>
          <input
            type="text"
            placeholder="ex: 256Mi"
            value={formData.resource_limits.memory_request}
            onChange={(e) => setFormData({
              ...formData,
              resource_limits: { ...formData.resource_limits, memory_request: e.target.value }
            })}
            disabled={saving}
          />
        </div>

        <div className="form-group">
          <label>Memory Limit:</label>
          <input
            type="text"
            placeholder="ex: 512Mi"
            value={formData.resource_limits.memory_limit}
            onChange={(e) => setFormData({
              ...formData,
              resource_limits: { ...formData.resource_limits, memory_limit: e.target.value }
            })}
            disabled={saving}
          />
        </div>
      </fieldset>

      <button type="submit" disabled={saving}>
        {saving ? 'Salvando...' : 'Salvar Configuração'}
      </button>
    </form>
  );
};
```

## Validações

### Frontend
- Modo deve ser "shared" ou "dedicated"
- Se autoescalonamento estiver habilitado:
  - `min_replicas` deve ser >= 1
  - `max_replicas` deve ser >= `min_replicas`
  - `target_cpu_utilization` deve ser entre 10 e 100
- Recursos devem seguir formato Kubernetes (ex: "100m", "256Mi")

### Backend
O backend aplica valores padrão se não fornecidos:
- `cpu_request`: "100m"
- `cpu_limit`: "200m"
- `memory_request`: "128Mi"
- `memory_limit`: "256Mi"
- `min_replicas`: 1 (se autoescalonamento habilitado)
- `max_replicas`: `min_replicas * 2` (se autoescalonamento habilitado)
- `target_cpu_utilization`: 70 (se autoescalonamento habilitado)

## Estilos CSS Sugeridos

```css
.orchestration-config {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

.form-group {
  margin-bottom: 15px;
}

.form-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.form-group input:disabled,
.form-group select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

fieldset {
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 15px;
  margin: 15px 0;
}

legend {
  font-weight: bold;
  padding: 0 10px;
}

button[type="submit"] {
  background-color: #007bff;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button[type="submit"]:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 15px;
  border-radius: 4px;
  margin: 15px 0;
}
```
