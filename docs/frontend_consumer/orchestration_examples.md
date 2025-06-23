# Exemplos Práticos - Componentes React Completos

Este documento apresenta exemplos práticos de componentes React que integram todas as funcionalidades da API de orquestração.

## Dashboard Completo de Orquestração

```tsx
import React, { useState, useEffect } from 'react';
import { OrchestrationConfigManager } from './OrchestrationConfigManager';
import { OrchestrationStatusMonitor } from './OrchestrationStatusMonitor';
import { LifecycleManager } from './LifecycleManager';
import { ScalingManager } from './ScalingManager';
import { ResourceManager } from './ResourceManager';

interface OrchestrationDashboardProps {
  tenantId: string;
}

export const OrchestrationDashboard: React.FC<OrchestrationDashboardProps> = ({ tenantId }) => {
  const [activeTab, setActiveTab] = useState<'status' | 'config' | 'lifecycle' | 'scaling' | 'resources'>('status');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const handleDataChange = () => {
    setLastUpdated(new Date());
  };

  const tabs = [
    { id: 'status', label: 'Status', icon: '📊' },
    { id: 'config', label: 'Configuração', icon: '⚙️' },
    { id: 'lifecycle', label: 'Ciclo de Vida', icon: '🔄' },
    { id: 'scaling', label: 'Escalonamento', icon: '📈' },
    { id: 'resources', label: 'Recursos', icon: '💾' }
  ] as const;

  return (
    <div className="orchestration-dashboard">
      <div className="dashboard-header">
        <h2>Orquestração - Tenant {tenantId}</h2>
        <div className="last-updated">
          Última atualização: {lastUpdated.toLocaleTimeString()}
        </div>
      </div>

      <div className="dashboard-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="dashboard-content">
        {activeTab === 'status' && (
          <OrchestrationStatusMonitor 
            tenantId={tenantId}
            key={lastUpdated.getTime()}
          />
        )}

        {activeTab === 'config' && (
          <OrchestrationConfigManager 
            tenantId={tenantId}
            onConfigChange={handleDataChange}
          />
        )}

        {activeTab === 'lifecycle' && (
          <LifecycleManager 
            tenantId={tenantId}
            onStatusChange={handleDataChange}
          />
        )}

        {activeTab === 'scaling' && (
          <ScalingManager 
            tenantId={tenantId}
            onScalingChange={handleDataChange}
          />
        )}

        {activeTab === 'resources' && (
          <ResourceManager 
            tenantId={tenantId}
            onResourcesChange={handleDataChange}
          />
        )}
      </div>
    </div>
  );
};
```

## Componente de Overview Compacto

```tsx
import React from 'react';
import { useOrchestrationStatus } from './hooks/useOrchestrationStatus';

interface OrchestrationOverviewProps {
  tenantId: string;
  onManageClick?: () => void;
}

export const OrchestrationOverview: React.FC<OrchestrationOverviewProps> = ({ 
  tenantId, 
  onManageClick 
}) => {
  const { status, loading, error } = useOrchestrationStatus(tenantId, { refreshInterval: 60 });

  if (loading && !status) {
    return (
      <div className="orchestration-overview loading">
        <div className="overview-skeleton">
          <div className="skeleton-header"></div>
          <div className="skeleton-content"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="orchestration-overview error">
        <div className="error-content">
          <span className="error-icon">⚠️</span>
          <span className="error-message">Erro ao carregar status</span>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="orchestration-overview not-configured">
        <div className="not-configured-content">
          <span className="config-icon">⚙️</span>
          <span className="config-message">Não configurado</span>
          {onManageClick && (
            <button className="configure-button" onClick={onManageClick}>
              Configurar
            </button>
          )}
        </div>
      </div>
    );
  }

  const getStatusInfo = () => {
    switch (status.status.toLowerCase()) {
      case 'ready':
        return { icon: '✅', color: '#28a745', text: 'Funcionando' };
      case 'deploying':
        return { icon: '🔄', color: '#ffc107', text: 'Implantando' };
      case 'scaling':
        return { icon: '📈', color: '#17a2b8', text: 'Escalonando' };
      case 'draining':
        return { icon: '⏹️', color: '#6c757d', text: 'Drenando' };
      case 'failed':
        return { icon: '❌', color: '#dc3545', text: 'Falha' };
      default:
        return { icon: '🔵', color: '#007bff', text: status.status };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="orchestration-overview">
      <div className="overview-header">
        <div className="status-indicator">
          <span className="status-icon" style={{ color: statusInfo.color }}>
            {statusInfo.icon}
          </span>
          <span className="status-text">{statusInfo.text}</span>
        </div>
        
        <div className="mode-indicator">
          <span className={`mode-badge ${status.mode}`}>
            {status.mode === 'dedicated' ? 'Dedicado' : 'Compartilhado'}
          </span>
        </div>
      </div>

      <div className="overview-details">
        {status.mode === 'dedicated' && status.replicas !== undefined && (
          <div className="detail-item">
            <span className="detail-label">Réplicas:</span>
            <span className="detail-value">
              {status.ready_replicas || 0}/{status.replicas}
            </span>
          </div>
        )}

        <div className="detail-item">
          <span className="detail-label">Namespace:</span>
          <span className="detail-value">{status.namespace}</span>
        </div>

        <div className="detail-item">
          <span className="detail-label">Versão:</span>
          <span className="detail-value">{status.version}</span>
        </div>
      </div>

      {onManageClick && (
        <div className="overview-actions">
          <button className="manage-button" onClick={onManageClick}>
            Gerenciar
          </button>
        </div>
      )}
    </div>
  );
};
```

## Lista de Tenants com Orquestração

```tsx
import React, { useState, useEffect } from 'react';

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
}

interface TenantsOrchestrationListProps {
  onTenantSelect?: (tenantId: string) => void;
}

export const TenantsOrchestrationList: React.FC<TenantsOrchestrationListProps> = ({ 
  onTenantSelect 
}) => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenant, setSelectedTenant] = useState<string | null>(null);

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simular carregamento de tenants
      // Em um caso real, isso viria de uma API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockTenants: Tenant[] = [
        { id: 'tenant-1', name: 'Acme Corp', domain: 'acme.example.com', status: 'ready' },
        { id: 'tenant-2', name: 'Beta Inc', domain: 'beta.example.com', status: 'deploying' },
        { id: 'tenant-3', name: 'Gamma Ltd', domain: 'gamma.example.com', status: 'failed' }
      ];
      
      setTenants(mockTenants);
    } catch (err) {
      setError('Erro ao carregar tenants');
    } finally {
      setLoading(false);
    }
  };

  const handleTenantClick = (tenantId: string) => {
    setSelectedTenant(tenantId);
    onTenantSelect?.(tenantId);
  };

  if (loading) {
    return (
      <div className="tenants-list loading">
        <div className="loading-message">Carregando tenants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tenants-list error">
        <div className="error-message">{error}</div>
        <button onClick={loadTenants}>Tentar novamente</button>
      </div>
    );
  }

  return (
    <div className="tenants-list">
      <div className="list-header">
        <h3>Tenants</h3>
        <button className="refresh-button" onClick={loadTenants}>
          🔄 Atualizar
        </button>
      </div>

      <div className="tenants-grid">
        {tenants.map(tenant => (
          <TenantCard
            key={tenant.id}
            tenant={tenant}
            isSelected={selectedTenant === tenant.id}
            onClick={() => handleTenantClick(tenant.id)}
          />
        ))}
      </div>
    </div>
  );
};

interface TenantCardProps {
  tenant: Tenant;
  isSelected: boolean;
  onClick: () => void;
}

const TenantCard: React.FC<TenantCardProps> = ({ tenant, isSelected, onClick }) => {
  return (
    <div 
      className={`tenant-card ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="tenant-header">
        <h4 className="tenant-name">{tenant.name}</h4>
        <span className="tenant-id">{tenant.id}</span>
      </div>
      
      <div className="tenant-domain">{tenant.domain}</div>
      
      <div className="tenant-footer">
        <OrchestrationOverview 
          tenantId={tenant.id}
          onManageClick={() => onClick()}
        />
      </div>
    </div>
  );
};
```

## Modal de Configuração Rápida

```tsx
import React, { useState } from 'react';

interface QuickSetupModalProps {
  tenantId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const QuickSetupModal: React.FC<QuickSetupModalProps> = ({
  tenantId,
  isOpen,
  onClose,
  onComplete
}) => {
  const [step, setStep] = useState(1);
  const [config, setConfig] = useState({
    mode: 'dedicated' as 'shared' | 'dedicated',
    preset: 'standard',
    autoscaling: true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const presets = {
    basic: {
      name: 'Básico',
      description: 'Para aplicações simples',
      resources: { cpu_request: '100m', cpu_limit: '200m', memory_request: '128Mi', memory_limit: '256Mi' }
    },
    standard: {
      name: 'Padrão',
      description: 'Para aplicações comuns',
      resources: { cpu_request: '200m', cpu_limit: '500m', memory_request: '256Mi', memory_limit: '512Mi' }
    },
    premium: {
      name: 'Premium',
      description: 'Para aplicações de alto desempenho',
      resources: { cpu_request: '500m', cpu_limit: '1000m', memory_request: '512Mi', memory_limit: '1Gi' }
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);
      setError(null);

      const selectedPreset = presets[config.preset as keyof typeof presets];
      
      // Configurar orquestração
      await setOrchestrationConfig(tenantId, {
        mode: config.mode,
        autoscaling_enabled: config.autoscaling,
        min_replicas: config.autoscaling ? 2 : undefined,
        max_replicas: config.autoscaling ? 10 : undefined,
        target_cpu_utilization: config.autoscaling ? 70 : undefined,
        resource_limits: selectedPreset.resources
      });

      // Se modo dedicado, fazer deploy
      if (config.mode === 'dedicated') {
        await deployTenantInstance(tenantId);
      }

      onComplete();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na configuração');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Configuração Rápida de Orquestração</h3>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        <div className="modal-body">
          {step === 1 && (
            <div className="setup-step">
              <h4>Modo de Execução</h4>
              <p>Escolha como o tenant será executado:</p>
              
              <div className="mode-options">
                <div 
                  className={`mode-option ${config.mode === 'shared' ? 'selected' : ''}`}
                  onClick={() => setConfig({ ...config, mode: 'shared' })}
                >
                  <div className="option-header">
                    <h5>🏢 Compartilhado</h5>
                    <span className="option-badge">Econômico</span>
                  </div>
                  <p>Executa junto com outros tenants, compartilhando recursos.</p>
                  <ul>
                    <li>Menor custo</li>
                    <li>Compartilha infraestrutura</li>
                    <li>Ideal para desenvolvimento/teste</li>
                  </ul>
                </div>

                <div 
                  className={`mode-option ${config.mode === 'dedicated' ? 'selected' : ''}`}
                  onClick={() => setConfig({ ...config, mode: 'dedicated' })}
                >
                  <div className="option-header">
                    <h5>🏰 Dedicado</h5>
                    <span className="option-badge">Isolado</span>
                  </div>
                  <p>Instância própria com isolamento completo.</p>
                  <ul>
                    <li>Máximo isolamento</li>
                    <li>Recursos dedicados</li>
                    <li>Ideal para produção</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="setup-step">
              <h4>Configuração de Recursos</h4>
              <p>Selecione um preset de recursos:</p>
              
              <div className="preset-options">
                {Object.entries(presets).map(([key, preset]) => (
                  <div 
                    key={key}
                    className={`preset-option ${config.preset === key ? 'selected' : ''}`}
                    onClick={() => setConfig({ ...config, preset: key })}
                  >
                    <h5>{preset.name}</h5>
                    <p>{preset.description}</p>
                    <div className="preset-specs">
                      <span>CPU: {preset.resources.cpu_request} - {preset.resources.cpu_limit}</span>
                      <span>RAM: {preset.resources.memory_request} - {preset.resources.memory_limit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="setup-step">
              <h4>Configurações Avançadas</h4>
              
              {config.mode === 'dedicated' && (
                <div className="option-group">
                  <label>
                    <input
                      type="checkbox"
                      checked={config.autoscaling}
                      onChange={e => setConfig({ ...config, autoscaling: e.target.checked })}
                    />
                    Habilitar Autoescalonamento
                  </label>
                  <p className="option-description">
                    Ajusta automaticamente o número de réplicas baseado na utilização de CPU.
                  </p>
                </div>
              )}

              <div className="summary">
                <h5>Resumo da Configuração:</h5>
                <ul>
                  <li><strong>Modo:</strong> {config.mode === 'dedicated' ? 'Dedicado' : 'Compartilhado'}</li>
                  <li><strong>Preset:</strong> {presets[config.preset as keyof typeof presets].name}</li>
                  {config.mode === 'dedicated' && (
                    <li><strong>Autoescalonamento:</strong> {config.autoscaling ? 'Habilitado' : 'Desabilitado'}</li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <div className="setup-error">
              {error}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <div className="step-indicators">
            {[1, 2, 3].map(stepNum => (
              <span 
                key={stepNum}
                className={`step-indicator ${step >= stepNum ? 'active' : ''}`}
              >
                {stepNum}
              </span>
            ))}
          </div>

          <div className="footer-actions">
            {step > 1 && (
              <button 
                className="prev-button"
                onClick={() => setStep(step - 1)}
                disabled={loading}
              >
                Anterior
              </button>
            )}
            
            {step < 3 ? (
              <button 
                className="next-button"
                onClick={() => setStep(step + 1)}
              >
                Próximo
              </button>
            ) : (
              <button 
                className="complete-button"
                onClick={handleComplete}
                disabled={loading}
              >
                {loading ? 'Configurando...' : 'Concluir Configuração'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
```

## Hook Unificado para Orquestração

```tsx
import { useState, useEffect, useCallback } from 'react';

interface OrchestrationState {
  config: OrchestrationConfig | null;
  status: DetailedDeploymentStatus | null;
  loading: boolean;
  error: string | null;
}

interface OrchestrationActions {
  refreshAll: () => Promise<void>;
  updateConfig: (config: SetOrchestrationConfigRequest) => Promise<void>;
  deploy: () => Promise<void>;
  drain: () => Promise<void>;
  scale: (replicas: number) => Promise<void>;
  setAutoscaling: (config: AutoscalingRequest) => Promise<void>;
  updateResources: (resources: ResourceRequest) => Promise<void>;
}

export function useOrchestration(tenantId: string): OrchestrationState & OrchestrationActions {
  const [state, setState] = useState<OrchestrationState>({
    config: null,
    status: null,
    loading: true,
    error: null
  });

  const updateState = (updates: Partial<OrchestrationState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const refreshAll = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const [configData, statusData] = await Promise.all([
        getOrchestrationConfig(tenantId).catch(() => null),
        getDetailedDeploymentStatus(tenantId).catch(() => null)
      ]);

      updateState({
        config: configData,
        status: statusData,
        loading: false
      });
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao carregar dados',
        loading: false
      });
    }
  }, [tenantId]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const updateConfig = useCallback(async (config: SetOrchestrationConfigRequest) => {
    try {
      updateState({ loading: true, error: null });
      await setOrchestrationConfig(tenantId, config);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao atualizar configuração',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  const deploy = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      await deployTenantInstance(tenantId);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao fazer deploy',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  const drain = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      await drainTenantInstance(tenantId);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao drenar instância',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  const scale = useCallback(async (replicas: number) => {
    try {
      updateState({ loading: true, error: null });
      await scaleTenantInstance(tenantId, replicas);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao escalonar',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  const setAutoscaling = useCallback(async (config: AutoscalingRequest) => {
    try {
      updateState({ loading: true, error: null });
      await setAutoscaling(tenantId, config);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao configurar autoescalonamento',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  const updateResources = useCallback(async (resources: ResourceRequest) => {
    try {
      updateState({ loading: true, error: null });
      await updateResourceLimits(tenantId, resources);
      await refreshAll();
    } catch (err) {
      updateState({
        error: err instanceof Error ? err.message : 'Erro ao atualizar recursos',
        loading: false
      });
      throw err;
    }
  }, [tenantId, refreshAll]);

  return {
    ...state,
    refreshAll,
    updateConfig,
    deploy,
    drain,
    scale,
    setAutoscaling,
    updateResources
  };
}
```

## Estilos CSS para Exemplos

```css
/* Dashboard */
.orchestration-dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 15px;
  border-bottom: 2px solid #eee;
}

.dashboard-header h2 {
  margin: 0;
  color: #333;
}

.last-updated {
  color: #666;
  font-size: 0.9em;
}

.dashboard-tabs {
  display: flex;
  gap: 2px;
  margin-bottom: 30px;
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 4px;
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: none;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  font-weight: 500;
  transition: all 0.2s;
}

.tab-button:hover {
  background-color: #e9ecef;
}

.tab-button.active {
  background-color: white;
  color: #007bff;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.tab-icon {
  font-size: 1.2em;
}

/* Overview */
.orchestration-overview {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  background-color: white;
}

.overview-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-icon {
  font-size: 1.2em;
}

.status-text {
  font-weight: bold;
}

.mode-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.mode-badge.dedicated {
  background-color: #e3f2fd;
  color: #1976d2;
}

.mode-badge.shared {
  background-color: #f3e5f5;
  color: #7b1fa2;
}

.overview-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 15px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.detail-label {
  color: #666;
  font-size: 0.9em;
}

.detail-value {
  font-weight: bold;
  font-family: monospace;
}

.manage-button {
  width: 100%;
  padding: 8px 16px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.manage-button:hover {
  background-color: #0056b3;
}

/* Tenant List */
.tenants-list {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.refresh-button {
  padding: 8px 16px;
  background-color: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
}

.tenants-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.tenant-card {
  border: 1px solid #ddd;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
  background-color: white;
}

.tenant-card:hover {
  border-color: #007bff;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}

.tenant-card.selected {
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0,123,255,0.25);
}

.tenant-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.tenant-name {
  margin: 0;
  color: #333;
}

.tenant-id {
  font-size: 0.8em;
  color: #666;
  font-family: monospace;
}

.tenant-domain {
  color: #666;
  font-size: 0.9em;
  margin-bottom: 15px;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #eee;
}

.modal-header h3 {
  margin: 0;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
}

.modal-body {
  padding: 20px;
}

.setup-step h4 {
  margin-top: 0;
  margin-bottom: 15px;
  color: #333;
}

.mode-options,
.preset-options {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.mode-option,
.preset-option {
  border: 2px solid #e9ecef;
  border-radius: 8px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-option:hover,
.preset-option:hover {
  border-color: #007bff;
}

.mode-option.selected,
.preset-option.selected {
  border-color: #007bff;
  background-color: #f8f9ff;
}

.option-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.option-header h5 {
  margin: 0;
}

.option-badge {
  padding: 2px 8px;
  background-color: #e9ecef;
  border-radius: 12px;
  font-size: 0.8em;
  font-weight: bold;
}

.setup-error {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
  padding: 10px;
  border-radius: 4px;
  margin-top: 15px;
}

.modal-footer {
  padding: 20px;
  border-top: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-indicators {
  display: flex;
  gap: 10px;
}

.step-indicator {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background-color: #e9ecef;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #666;
}

.step-indicator.active {
  background-color: #007bff;
  color: white;
}

.footer-actions {
  display: flex;
  gap: 10px;
}

.prev-button,
.next-button,
.complete-button {
  padding: 10px 20px;
  border: 1px solid #ddd;
  border-radius: 4px;
  cursor: pointer;
  font-weight: bold;
}

.next-button,
.complete-button {
  background-color: #007bff;
  color: white;
  border-color: #007bff;
}

.next-button:hover,
.complete-button:hover {
  background-color: #0056b3;
}

@media (max-width: 768px) {
  .dashboard-tabs {
    flex-direction: column;
  }
  
  .tenants-grid {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 10px;
  }
  
  .overview-header,
  .detail-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 5px;
  }
}
```
