# Gerenciamento de Recursos - Frontend

Este documento detalha como gerenciar limites de recursos (CPU e memória) para instâncias de tenants.

## Atualizar Limites de Recursos

### Endpoint
```
PUT /api/tenants/{tenant_id}/orchestration/resources
```

### Exemplo JavaScript/TypeScript

```typescript
interface ResourceLimits {
  cpu_request: string;    // ex: "100m", "0.5", "1"
  cpu_limit: string;      // ex: "500m", "1", "2"
  memory_request: string; // ex: "128Mi", "256Mi", "1Gi"
  memory_limit: string;   // ex: "512Mi", "1Gi", "2Gi"
}

interface ResourceRequest {
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
}

interface ResourceResponse {
  status: string;
  resource_limits: ResourceLimits;
}

async function updateResourceLimits(
  tenantId: string, 
  resources: ResourceRequest
): Promise<ResourceResponse> {
  const response = await fetch(`/api/tenants/${tenantId}/orchestration/resources`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(resources)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Failed to update resource limits: ${error}`);
  }

  return response.json();
}
```

### Exemplo de Requisição

```json
{
  "cpu_request": "200m",
  "cpu_limit": "1000m",
  "memory_request": "512Mi",
  "memory_limit": "1Gi"
}
```

### Exemplo de Resposta

```json
{
  "status": "updated",
  "resource_limits": {
    "cpu_request": "200m",
    "cpu_limit": "1000m",
    "memory_request": "512Mi",
    "memory_limit": "1Gi"
  }
}
```

## Componente React para Gerenciamento de Recursos

```tsx
import React, { useState, useEffect } from 'react';

interface ResourceManagerProps {
  tenantId: string;
  onResourcesChange?: (resources: ResourceLimits) => void;
}

interface ResourcePreset {
  name: string;
  description: string;
  resources: ResourceLimits;
  tier: 'basic' | 'standard' | 'premium' | 'enterprise';
}

const RESOURCE_PRESETS: ResourcePreset[] = [
  {
    name: 'Básico',
    description: 'Para aplicações simples com baixo tráfego',
    tier: 'basic',
    resources: {
      cpu_request: '100m',
      cpu_limit: '200m',
      memory_request: '128Mi',
      memory_limit: '256Mi'
    }
  },
  {
    name: 'Padrão',
    description: 'Para aplicações de médio porte',
    tier: 'standard',
    resources: {
      cpu_request: '200m',
      cpu_limit: '500m',
      memory_request: '256Mi',
      memory_limit: '512Mi'
    }
  },
  {
    name: 'Premium',
    description: 'Para aplicações com alto desempenho',
    tier: 'premium',
    resources: {
      cpu_request: '500m',
      cpu_limit: '1000m',
      memory_request: '512Mi',
      memory_limit: '1Gi'
    }
  },
  {
    name: 'Enterprise',
    description: 'Para aplicações críticas com máximo desempenho',
    tier: 'enterprise',
    resources: {
      cpu_request: '1000m',
      cpu_limit: '2000m',
      memory_request: '1Gi',
      memory_limit: '2Gi'
    }
  }
];

export const ResourceManager: React.FC<ResourceManagerProps> = ({ 
  tenantId, 
  onResourcesChange 
}) => {
  const [config, setConfig] = useState<OrchestrationConfig | null>(null);
  const [resources, setResources] = useState<ResourceLimits>({
    cpu_request: '100m',
    cpu_limit: '200m',
    memory_request: '128Mi',
    memory_limit: '256Mi'
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    loadConfiguration();
  }, [tenantId]);

  useEffect(() => {
    if (config) {
      setResources(config.resource_limits);
      
      // Verificar se corresponde a algum preset
      const matchingPreset = RESOURCE_PRESETS.find(preset => 
        preset.resources.cpu_request === config.resource_limits.cpu_request &&
        preset.resources.cpu_limit === config.resource_limits.cpu_limit &&
        preset.resources.memory_request === config.resource_limits.memory_request &&
        preset.resources.memory_limit === config.resource_limits.memory_limit
      );
      setSelectedPreset(matchingPreset?.name || null);
    }
  }, [config]);

  const loadConfiguration = async () => {
    try {
      setLoading(true);
      setError(null);
      const configData = await getOrchestrationConfig(tenantId);
      setConfig(configData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar configuração');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResources = async () => {
    const validation = validateResourceLimits(resources);
    if (validation) {
      setError(validation);
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const result = await updateResourceLimits(tenantId, resources);
      setSuccess('Limites de recursos atualizados com sucesso');
      
      await loadConfiguration();
      onResourcesChange?.(result.resource_limits);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar recursos');
    } finally {
      setSaving(false);
    }
  };

  const handlePresetSelect = (preset: ResourcePreset) => {
    setResources(preset.resources);
    setSelectedPreset(preset.name);
    setShowAdvanced(false);
  };

  const handleCustomResource = (field: keyof ResourceLimits, value: string) => {
    setResources(prev => ({ ...prev, [field]: value }));
    setSelectedPreset(null);
  };

  const getCurrentUsage = () => {
    // Simular dados de uso atual - em um caso real, isso viria de uma API de métricas
    return {
      cpu_usage: '150m',
      memory_usage: '200Mi',
      cpu_percentage: 75,
      memory_percentage: 78
    };
  };

  const usage = getCurrentUsage();

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

  if (loading) {
    return <div className="resource-loading">Carregando configuração de recursos...</div>;
  }

  return (
    <div className="resource-manager">
      <div className="resource-header">
        <h3>Gerenciamento de Recursos</h3>
        <div className="resource-mode">
          <button
            className={`mode-button ${!showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(false)}
          >
            Presets
          </button>
          <button
            className={`mode-button ${showAdvanced ? 'active' : ''}`}
            onClick={() => setShowAdvanced(true)}
          >
            Avançado
          </button>
        </div>
      </div>

      {(success || error) && (
        <div className={`resource-message ${error ? 'error' : 'success'}`}>
          {success || error}
        </div>
      )}

      {/* Uso Atual */}
      <div className="current-usage">
        <h4>Uso Atual</h4>
        <div className="usage-metrics">
          <div className="usage-item">
            <div className="usage-label">CPU</div>
            <div className="usage-bar">
              <div 
                className="usage-fill cpu"
                style={{ width: `${usage.cpu_percentage}%` }}
              ></div>
            </div>
            <div className="usage-text">
              {usage.cpu_usage} / {resources.cpu_limit} ({usage.cpu_percentage}%)
            </div>
          </div>

          <div className="usage-item">
            <div className="usage-label">Memória</div>
            <div className="usage-bar">
              <div 
                className="usage-fill memory"
                style={{ width: `${usage.memory_percentage}%` }}
              ></div>
            </div>
            <div className="usage-text">
              {usage.memory_usage} / {resources.memory_limit} ({usage.memory_percentage}%)
            </div>
          </div>
        </div>
      </div>

      {/* Presets */}
      {!showAdvanced && (
        <div className="resource-presets">
          <h4>Configurações Predefinidas</h4>
          <div className="presets-grid">
            {RESOURCE_PRESETS.map(preset => (
              <ResourcePresetCard
                key={preset.name}
                preset={preset}
                isSelected={selectedPreset === preset.name}
                onSelect={() => handlePresetSelect(preset)}
                disabled={saving}
              />
            ))}
          </div>
        </div>
      )}

      {/* Configuração Avançada */}
      {showAdvanced && (
        <div className="advanced-config">
          <h4>Configuração Avançada</h4>
          
          <div className="resource-grid">
            <div className="resource-group">
              <h5>CPU</h5>
              
              <div className="resource-field">
                <label>Request (Mínimo garantido):</label>
                <div className="input-with-unit">
                  <input
                    type="text"
                    value={resources.cpu_request}
                    onChange={(e) => handleCustomResource('cpu_request', e.target.value)}
                    placeholder="ex: 100m, 0.5, 1"
                    disabled={saving}
                  />
                  <span className="unit">cores</span>
                </div>
                <small>Quantidade mínima de CPU garantida</small>
              </div>

              <div className="resource-field">
                <label>Limit (Máximo permitido):</label>
                <div className="input-with-unit">
                  <input
                    type="text"
                    value={resources.cpu_limit}
                    onChange={(e) => handleCustomResource('cpu_limit', e.target.value)}
                    placeholder="ex: 500m, 1, 2"
                    disabled={saving}
                  />
                  <span className="unit">cores</span>
                </div>
                <small>Quantidade máxima de CPU que pode ser usada</small>
              </div>
            </div>

            <div className="resource-group">
              <h5>Memória</h5>
              
              <div className="resource-field">
                <label>Request (Mínimo garantido):</label>
                <div className="input-with-unit">
                  <input
                    type="text"
                    value={resources.memory_request}
                    onChange={(e) => handleCustomResource('memory_request', e.target.value)}
                    placeholder="ex: 128Mi, 1Gi"
                    disabled={saving}
                  />
                  <span className="unit">bytes</span>
                </div>
                <small>Quantidade mínima de memória garantida</small>
              </div>

              <div className="resource-field">
                <label>Limit (Máximo permitido):</label>
                <div className="input-with-unit">
                  <input
                    type="text"
                    value={resources.memory_limit}
                    onChange={(e) => handleCustomResource('memory_limit', e.target.value)}
                    placeholder="ex: 512Mi, 2Gi"
                    disabled={saving}
                  />
                  <span className="unit">bytes</span>
                </div>
                <small>Quantidade máxima de memória que pode ser usada</small>
              </div>
            </div>
          </div>

          <div className="resource-help">
            <h5>Formatos Aceitos</h5>
            <div className="help-section">
              <div className="help-item">
                <strong>CPU:</strong>
                <ul>
                  <li><code>100m</code> = 0.1 core</li>
                  <li><code>500m</code> = 0.5 core</li>
                  <li><code>1</code> = 1 core</li>
                  <li><code>2</code> = 2 cores</li>
                </ul>
              </div>
              <div className="help-item">
                <strong>Memória:</strong>
                <ul>
                  <li><code>128Mi</code> = 128 MiB</li>
                  <li><code>512Mi</code> = 512 MiB</li>
                  <li><code>1Gi</code> = 1 GiB</li>
                  <li><code>2Gi</code> = 2 GiB</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="resource-actions">
        <button
          className="save-button"
          onClick={handleSaveResources}
          disabled={saving || !hasResourceChanges()}
        >
          {saving ? (
            <>
              <span className="spinner"></span>
              Salvando...
            </>
          ) : (
            'Salvar Configuração'
          )}
        </button>

        {hasResourceChanges() && (
          <button
            className="reset-button"
            onClick={() => {
              if (config) {
                setResources(config.resource_limits);
                setSelectedPreset(null);
              }
            }}
            disabled={saving}
          >
            Cancelar
          </button>
        )}
      </div>

      <div className="resource-impact">
        <h4>Impacto das Alterações</h4>
        <div className="impact-items">
          <div className="impact-item">
            <span className="impact-icon">💰</span>
            <div>
              <strong>Custo:</strong>
              <p>Recursos maiores resultam em maior custo de infraestrutura.</p>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">⚡</span>
            <div>
              <strong>Performance:</strong>
              <p>Mais recursos melhoram a capacidade de processamento.</p>
            </div>
          </div>
          <div className="impact-item">
            <span className="impact-icon">🔄</span>
            <div>
              <strong>Reinicialização:</strong>
              <p>Alterações podem requerer reinicialização dos pods.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  function hasResourceChanges(): boolean {
    if (!config) return false;
    
    return (
      resources.cpu_request !== config.resource_limits.cpu_request ||
      resources.cpu_limit !== config.resource_limits.cpu_limit ||
      resources.memory_request !== config.resource_limits.memory_request ||
      resources.memory_limit !== config.resource_limits.memory_limit
    );
  }
};

interface ResourcePresetCardProps {
  preset: ResourcePreset;
  isSelected: boolean;
  onSelect: () => void;
  disabled: boolean;
}

const ResourcePresetCard: React.FC<ResourcePresetCardProps> = ({
  preset,
  isSelected,
  onSelect,
  disabled
}) => {
  return (
    <div 
      className={`preset-card ${preset.tier} ${isSelected ? 'selected' : ''}`}
      onClick={!disabled ? onSelect : undefined}
    >
      <div className="preset-header">
        <h5>{preset.name}</h5>
        <span className={`tier-badge ${preset.tier}`}>{preset.tier}</span>
      </div>
      
      <p className="preset-description">{preset.description}</p>
      
      <div className="preset-specs">
        <div className="spec-item">
          <span className="spec-label">CPU:</span>
          <span className="spec-value">
            {preset.resources.cpu_request} - {preset.resources.cpu_limit}
          </span>
        </div>
        <div className="spec-item">
          <span className="spec-label">Memória:</span>
          <span className="spec-value">
            {preset.resources.memory_request} - {preset.resources.memory_limit}
          </span>
        </div>
      </div>
      
      {isSelected && <div className="selected-indicator">✓ Selecionado</div>}
    </div>
  );
};
```

## Validações de Recursos

```typescript
export function validateResourceLimits(resources: ResourceLimits): string | null {
  // Validar formato CPU
  const cpuRequestValid = validateCPUFormat(resources.cpu_request);
  if (!cpuRequestValid) return 'Formato de CPU Request inválido';
  
  const cpuLimitValid = validateCPUFormat(resources.cpu_limit);
  if (!cpuLimitValid) return 'Formato de CPU Limit inválido';
  
  // Validar formato Memória
  const memoryRequestValid = validateMemoryFormat(resources.memory_request);
  if (!memoryRequestValid) return 'Formato de Memory Request inválido';
  
  const memoryLimitValid = validateMemoryFormat(resources.memory_limit);
  if (!memoryLimitValid) return 'Formato de Memory Limit inválido';
  
  // Validar que limits são maiores que requests
  const cpuRequestValue = parseCPU(resources.cpu_request);
  const cpuLimitValue = parseCPU(resources.cpu_limit);
  if (cpuLimitValue < cpuRequestValue) {
    return 'CPU Limit deve ser maior ou igual ao CPU Request';
  }
  
  const memoryRequestValue = parseMemory(resources.memory_request);
  const memoryLimitValue = parseMemory(resources.memory_limit);
  if (memoryLimitValue < memoryRequestValue) {
    return 'Memory Limit deve ser maior ou igual ao Memory Request';
  }
  
  return null;
}

function validateCPUFormat(cpu: string): boolean {
  // Aceita formatos como: 100m, 0.5, 1, 2
  const cpuRegex = /^(\d+(\.\d+)?|\d+m)$/;
  return cpuRegex.test(cpu);
}

function validateMemoryFormat(memory: string): boolean {
  // Aceita formatos como: 128Mi, 1Gi, 512Ki
  const memoryRegex = /^\d+(Ki|Mi|Gi|Ti|K|M|G|T)?$/;
  return memoryRegex.test(memory);
}

function parseCPU(cpu: string): number {
  if (cpu.endsWith('m')) {
    return parseInt(cpu.slice(0, -1)) / 1000;
  }
  return parseFloat(cpu);
}

function parseMemory(memory: string): number {
  const units: { [key: string]: number } = {
    'Ki': 1024,
    'Mi': 1024 * 1024,
    'Gi': 1024 * 1024 * 1024,
    'Ti': 1024 * 1024 * 1024 * 1024,
    'K': 1000,
    'M': 1000 * 1000,
    'G': 1000 * 1000 * 1000,
    'T': 1000 * 1000 * 1000 * 1000
  };
  
  for (const [unit, multiplier] of Object.entries(units)) {
    if (memory.endsWith(unit)) {
      const value = parseInt(memory.slice(0, -unit.length));
      return value * multiplier;
    }
  }
  
  return parseInt(memory);
}
```

## Hook para Recursos

```typescript
import { useState, useCallback } from 'react';

interface ResourceOperations {
  updateResources: (tenantId: string, resources: ResourceRequest) => Promise<void>;
  loading: boolean;
  error: string | null;
  success: string | null;
  clearMessages: () => void;
}

export function useResourceOperations(): ResourceOperations {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const clearMessages = useCallback(() => {
    setError(null);
    setSuccess(null);
  }, []);

  const updateResources = useCallback(async (tenantId: string, resources: ResourceRequest) => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const validation = validateResourceLimits(resources);
      if (validation) {
        throw new Error(validation);
      }

      const result = await updateResourceLimits(tenantId, resources);
      setSuccess('Recursos atualizados com sucesso');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar recursos');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateResources,
    loading,
    error,
    success,
    clearMessages
  };
}
```

## Monitoramento de Recursos

```typescript
// Função para buscar métricas de uso atual (seria integrada com sistema de monitoramento)
export async function getCurrentResourceUsage(tenantId: string): Promise<ResourceUsage> {
  const response = await fetch(`/api/tenants/${tenantId}/metrics/resources`, {
    credentials: 'include'
  });
  
  if (!response.ok) {
    throw new Error('Failed to get resource usage');
  }
  
  return response.json();
}

interface ResourceUsage {
  cpu_usage: string;
  memory_usage: string;
  cpu_percentage: number;
  memory_percentage: number;
  timestamp: string;
}
```

## Estilos CSS

```css
.resource-manager {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.resource-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #eee;
}

.resource-mode {
  display: flex;
  border: 1px solid #ddd;
  border-radius: 4px;
  overflow: hidden;
}

.mode-button {
  padding: 8px 16px;
  border: none;
  background-color: #f8f9fa;
  cursor: pointer;
  font-weight: bold;
}

.mode-button.active {
  background-color: #007bff;
  color: white;
}

.resource-message {
  padding: 10px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.resource-message.success {
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  color: #155724;
}

.resource-message.error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.current-usage {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
  margin-bottom: 20px;
}

.current-usage h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.usage-metrics {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.usage-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.usage-label {
  font-weight: bold;
  color: #555;
  font-size: 0.9em;
}

.usage-bar {
  height: 20px;
  background-color: #e9ecef;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
}

.usage-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.usage-fill.cpu {
  background: linear-gradient(90deg, #28a745, #ffc107, #dc3545);
}

.usage-fill.memory {
  background: linear-gradient(90deg, #17a2b8, #6f42c1);
}

.usage-text {
  font-size: 0.9em;
  color: #666;
  text-align: center;
}

.presets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.preset-card {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.preset-card:hover {
  border-color: #007bff;
  box-shadow: 0 2px 8px rgba(0, 123, 255, 0.15);
}

.preset-card.selected {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.preset-card.basic { border-left: 4px solid #28a745; }
.preset-card.standard { border-left: 4px solid #007bff; }
.preset-card.premium { border-left: 4px solid #6f42c1; }
.preset-card.enterprise { border-left: 4px solid #fd7e14; }

.preset-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.preset-header h5 {
  margin: 0;
  color: #333;
}

.tier-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
  text-transform: uppercase;
}

.tier-badge.basic { background-color: #d4edda; color: #155724; }
.tier-badge.standard { background-color: #d1ecf1; color: #0c5460; }
.tier-badge.premium { background-color: #e2e3f3; color: #383d41; }
.tier-badge.enterprise { background-color: #fff3cd; color: #856404; }

.preset-description {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

.preset-specs {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.spec-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.spec-label {
  font-weight: bold;
  color: #555;
}

.spec-value {
  font-family: monospace;
  background-color: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-size: 0.9em;
}

.selected-indicator {
  margin-top: 10px;
  padding: 5px;
  background-color: #d4edda;
  color: #155724;
  text-align: center;
  border-radius: 4px;
  font-weight: bold;
  font-size: 0.9em;
}

.advanced-config {
  margin-bottom: 20px;
}

.resource-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.resource-group {
  background-color: #f8f9fa;
  border-radius: 6px;
  padding: 15px;
}

.resource-group h5 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
  padding-bottom: 8px;
  border-bottom: 1px solid #dee2e6;
}

.resource-field {
  margin-bottom: 15px;
}

.resource-field label {
  display: block;
  font-weight: bold;
  color: #555;
  margin-bottom: 5px;
}

.input-with-unit {
  display: flex;
  align-items: center;
}

.input-with-unit input {
  flex: 1;
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px 0 0 4px;
  font-family: monospace;
}

.input-with-unit .unit {
  background-color: #e9ecef;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-left: none;
  border-radius: 0 4px 4px 0;
  font-size: 0.9em;
  color: #6c757d;
}

.resource-field small {
  display: block;
  color: #666;
  font-style: italic;
  margin-top: 3px;
}

.resource-help {
  background-color: #e3f2fd;
  border-radius: 6px;
  padding: 15px;
  margin-top: 20px;
}

.resource-help h5 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #1976d2;
}

.help-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.help-item strong {
  display: block;
  margin-bottom: 8px;
  color: #333;
}

.help-item ul {
  margin: 0;
  padding-left: 20px;
}

.help-item li {
  margin-bottom: 3px;
  font-size: 0.9em;
  color: #666;
}

.help-item code {
  background-color: #f8f9fa;
  padding: 1px 4px;
  border-radius: 2px;
  font-family: monospace;
  color: #e83e8c;
}

.resource-actions {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.save-button {
  background-color: #28a745;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
  display: flex;
  align-items: center;
  gap: 8px;
}

.save-button:hover:not(:disabled) {
  background-color: #218838;
}

.save-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.reset-button {
  background-color: #6c757d;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.reset-button:hover:not(:disabled) {
  background-color: #5a6268;
}

.resource-impact {
  border-top: 1px solid #eee;
  padding-top: 20px;
}

.resource-impact h4 {
  margin-bottom: 15px;
  color: #333;
}

.impact-items {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.impact-item {
  display: flex;
  align-items: flex-start;
  gap: 15px;
  padding: 15px;
  background-color: #f8f9fa;
  border-radius: 6px;
}

.impact-icon {
  font-size: 1.5em;
  flex-shrink: 0;
}

.impact-item strong {
  display: block;
  margin-bottom: 5px;
  color: #333;
}

.impact-item p {
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
  .resource-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }

  .presets-grid {
    grid-template-columns: 1fr;
  }

  .resource-grid {
    grid-template-columns: 1fr;
  }

  .usage-metrics {
    gap: 20px;
  }

  .help-section {
    grid-template-columns: 1fr;
  }

  .resource-actions {
    flex-direction: column;
  }

  .impact-items {
    gap: 10px;
  }

  .impact-item {
    flex-direction: column;
    text-align: center;
  }
}
```
