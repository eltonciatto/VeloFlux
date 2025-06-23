# Tratamento de Erros - API de Orquestração

Este documento detalha como tratar adequadamente erros ao consumir a API de orquestração no frontend.

## Tipos de Erros Comuns

### Erros HTTP

| Código | Descrição | Causa Comum | Ação Recomendada |
|--------|-----------|-------------|-------------------|
| 400 | Bad Request | Dados inválidos na requisição | Validar dados antes do envio |
| 401 | Unauthorized | Token expirado ou inválido | Fazer novo login |
| 403 | Forbidden | Sem permissão para o recurso | Verificar permissões do usuário |
| 404 | Not Found | Tenant ou recurso não encontrado | Verificar se tenant existe |
| 409 | Conflict | Operação conflitante em andamento | Aguardar operação atual terminar |
| 500 | Internal Server Error | Erro interno do servidor | Tentar novamente mais tarde |
| 503 | Service Unavailable | Serviço temporariamente indisponível | Implementar retry com backoff |

### Erros de Negócio

| Erro | Descrição | Solução |
|------|-----------|---------|
| `configuration_not_found` | Configuração de orquestração não existe | Criar configuração primeiro |
| `already_deploying` | Deploy já em andamento | Aguardar conclusão |
| `insufficient_resources` | Recursos insuficientes no cluster | Reduzir recursos solicitados |
| `invalid_mode` | Modo de orquestração inválido | Usar 'shared' ou 'dedicated' |
| `scaling_not_available` | Escalonamento não disponível | Verificar modo e status |
| `autoscaling_conflict` | Autoescalonamento habilitado | Desabilitar para escalonamento manual |

## Classe de Tratamento de Erros

```typescript
export class OrchestrationError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number,
    public details?: any
  ) {
    super(message);
    this.name = 'OrchestrationError';
  }

  static fromResponse(response: Response, body?: any): OrchestrationError {
    const message = body?.message || body?.error || response.statusText || 'Erro desconhecido';
    const code = body?.code || `HTTP_${response.status}`;
    
    return new OrchestrationError(message, code, response.status, body);
  }

  getUserFriendlyMessage(): string {
    switch (this.code) {
      case 'configuration_not_found':
        return 'Configuração de orquestração não encontrada. Configure primeiro antes de prosseguir.';
      
      case 'already_deploying':
        return 'Uma implantação já está em andamento. Aguarde a conclusão antes de iniciar outra.';
      
      case 'insufficient_resources':
        return 'Recursos insuficientes no cluster. Tente reduzir os limites de recursos solicitados.';
      
      case 'invalid_mode':
        return 'Modo de orquestração inválido. Use "compartilhado" ou "dedicado".';
      
      case 'scaling_not_available':
        return 'Escalonamento não está disponível. Verifique se a instância está em modo dedicado e funcionando.';
      
      case 'autoscaling_conflict':
        return 'Não é possível escalonar manualmente com autoescalonamento habilitado. Desabilite o autoescalonamento primeiro.';
      
      case 'HTTP_401':
        return 'Sua sessão expirou. Faça login novamente.';
      
      case 'HTTP_403':
        return 'Você não tem permissão para executar esta operação.';
      
      case 'HTTP_404':
        return 'Recurso não encontrado. Verifique se o tenant existe.';
      
      case 'HTTP_409':
        return 'Operação conflitante em andamento. Tente novamente em alguns momentos.';
      
      case 'HTTP_500':
        return 'Erro interno do servidor. Tente novamente mais tarde.';
      
      case 'HTTP_503':
        return 'Serviço temporariamente indisponível. Tente novamente em alguns minutos.';
      
      default:
        return this.message || 'Erro inesperado. Tente novamente.';
    }
  }

  isRetryable(): boolean {
    const retryableCodes = ['HTTP_500', 'HTTP_502', 'HTTP_503', 'HTTP_504'];
    return retryableCodes.includes(this.code || '');
  }

  isAuthError(): boolean {
    return this.statusCode === 401;
  }

  isPermissionError(): boolean {
    return this.statusCode === 403;
  }

  isValidationError(): boolean {
    return this.statusCode === 400;
  }
}
```

## Wrapper de API com Tratamento de Erros

```typescript
class OrchestrationAPI {
  private baseURL: string;
  private onAuthError?: () => void;

  constructor(baseURL: string = '', onAuthError?: () => void) {
    this.baseURL = baseURL;
    this.onAuthError = onAuthError;
  }

  private async makeRequest<T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> {
    const response = await fetch(`${this.baseURL}${url}`, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    let body: any;
    try {
      body = await response.json();
    } catch {
      body = await response.text();
    }

    if (!response.ok) {
      const error = OrchestrationError.fromResponse(response, body);
      
      // Tratar erro de autenticação
      if (error.isAuthError() && this.onAuthError) {
        this.onAuthError();
      }
      
      throw error;
    }

    return body as T;
  }

  async getConfig(tenantId: string): Promise<OrchestrationConfig> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration`);
  }

  async setConfig(tenantId: string, config: SetOrchestrationConfigRequest): Promise<void> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async getStatus(tenantId: string): Promise<DeploymentStatus> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/status`);
  }

  async getDetailedStatus(tenantId: string): Promise<DetailedDeploymentStatus> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/detailed_status`);
  }

  async deploy(tenantId: string): Promise<DeployResponse> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/deploy`, {
      method: 'POST',
    });
  }

  async drain(tenantId: string): Promise<DrainResponse> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/drain`, {
      method: 'POST',
    });
  }

  async scale(tenantId: string, replicas: number): Promise<ScaleResponse> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/scale`, {
      method: 'POST',
      body: JSON.stringify({ replicas }),
    });
  }

  async setAutoscaling(tenantId: string, config: AutoscalingRequest): Promise<AutoscalingResponse> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/autoscale`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  async updateResources(tenantId: string, resources: ResourceRequest): Promise<ResourceResponse> {
    return this.makeRequest(`/api/tenants/${tenantId}/orchestration/resources`, {
      method: 'PUT',
      body: JSON.stringify(resources),
    });
  }
}

// Instância global
export const orchestrationAPI = new OrchestrationAPI('', () => {
  // Callback para erro de autenticação
  window.location.href = '/login';
});
```

## Hook para Retry com Backoff

```typescript
import { useState, useCallback } from 'react';

interface RetryOptions {
  maxAttempts?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
}

export function useRetryableOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>,
  options: RetryOptions = {}
) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2
  } = options;

  const [attempt, setAttempt] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const executeWithRetry = useCallback(async (...args: T): Promise<R> => {
    let lastError: OrchestrationError;
    
    for (let i = 0; i < maxAttempts; i++) {
      setAttempt(i + 1);
      
      try {
        const result = await operation(...args);
        setAttempt(0);
        setIsRetrying(false);
        return result;
      } catch (error) {
        lastError = error instanceof OrchestrationError 
          ? error 
          : new OrchestrationError(error instanceof Error ? error.message : 'Erro desconhecido');

        // Não tentar novamente se não for um erro que pode ser recuperado
        if (!lastError.isRetryable() || i === maxAttempts - 1) {
          setAttempt(0);
          setIsRetrying(false);
          throw lastError;
        }

        // Calcular delay com backoff exponencial
        const delay = Math.min(initialDelay * Math.pow(backoffFactor, i), maxDelay);
        
        setIsRetrying(true);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    setAttempt(0);
    setIsRetrying(false);
    throw lastError!;
  }, [operation, maxAttempts, initialDelay, maxDelay, backoffFactor]);

  return {
    execute: executeWithRetry,
    attempt,
    isRetrying
  };
}
```

## Componente de Notificação de Erros

```tsx
import React, { useState, useEffect } from 'react';

interface ErrorNotificationProps {
  error: OrchestrationError | null;
  onDismiss?: () => void;
  onRetry?: () => void;
  autoHide?: boolean;
  autoHideDelay?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  onRetry,
  autoHide = true,
  autoHideDelay = 8000
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      
      if (autoHide && !error.isRetryable()) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }, autoHideDelay);
        
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [error, autoHide, autoHideDelay, onDismiss]);

  if (!error) return null;

  const getErrorClass = () => {
    if (error.isAuthError() || error.isPermissionError()) {
      return 'error-auth';
    }
    if (error.isValidationError()) {
      return 'error-validation';
    }
    if (error.isRetryable()) {
      return 'error-retryable';
    }
    return 'error-general';
  };

  const getErrorIcon = () => {
    if (error.isAuthError() || error.isPermissionError()) {
      return '🔒';
    }
    if (error.isValidationError()) {
      return '⚠️';
    }
    if (error.isRetryable()) {
      return '🔄';
    }
    return '❌';
  };

  return (
    <div className={`error-notification ${getErrorClass()} ${isVisible ? 'visible' : 'hidden'}`}>
      <div className="error-content">
        <div className="error-header">
          <span className="error-icon">{getErrorIcon()}</span>
          <span className="error-title">
            {error.isAuthError() && 'Erro de Autenticação'}
            {error.isPermissionError() && 'Erro de Permissão'}
            {error.isValidationError() && 'Erro de Validação'}
            {error.isRetryable() && 'Erro Temporário'}
            {!error.isAuthError() && !error.isPermissionError() && 
             !error.isValidationError() && !error.isRetryable() && 'Erro'}
          </span>
        </div>
        
        <div className="error-message">
          {error.getUserFriendlyMessage()}
        </div>

        {error.details && (
          <details className="error-details">
            <summary>Detalhes técnicos</summary>
            <pre>{JSON.stringify(error.details, null, 2)}</pre>
          </details>
        )}
      </div>

      <div className="error-actions">
        {error.isRetryable() && onRetry && (
          <button className="error-button retry" onClick={onRetry}>
            Tentar Novamente
          </button>
        )}
        
        <button className="error-button dismiss" onClick={() => {
          setIsVisible(false);
          setTimeout(() => onDismiss?.(), 300);
        }}>
          {error.isAuthError() ? 'Fazer Login' : 'Fechar'}
        </button>
      </div>
    </div>
  );
};
```

## Context Provider para Gerenciamento Global de Erros

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ErrorContextType {
  showError: (error: OrchestrationError) => void;
  clearError: () => void;
  currentError: OrchestrationError | null;
}

const ErrorContext = createContext<ErrorContextType | undefined>(undefined);

export const useErrorHandler = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within ErrorProvider');
  }
  return context;
};

interface ErrorProviderProps {
  children: React.ReactNode;
}

export const ErrorProvider: React.FC<ErrorProviderProps> = ({ children }) => {
  const [currentError, setCurrentError] = useState<OrchestrationError | null>(null);

  const showError = useCallback((error: OrchestrationError) => {
    setCurrentError(error);
  }, []);

  const clearError = useCallback(() => {
    setCurrentError(null);
  }, []);

  const handleRetry = useCallback(() => {
    // A lógica de retry seria implementada pelos componentes específicos
    clearError();
  }, [clearError]);

  return (
    <ErrorContext.Provider value={{ showError, clearError, currentError }}>
      {children}
      <ErrorNotification
        error={currentError}
        onDismiss={clearError}
        onRetry={currentError?.isRetryable() ? handleRetry : undefined}
      />
    </ErrorContext.Provider>
  );
};
```

## Hook para Operações com Tratamento de Erro

```tsx
import { useState, useCallback } from 'react';
import { useErrorHandler } from './ErrorProvider';

export function useOrchestrationOperation<T extends any[], R>(
  operation: (...args: T) => Promise<R>
) {
  const [loading, setLoading] = useState(false);
  const { showError } = useErrorHandler();

  const execute = useCallback(async (...args: T): Promise<R | null> => {
    try {
      setLoading(true);
      const result = await operation(...args);
      return result;
    } catch (error) {
      if (error instanceof OrchestrationError) {
        showError(error);
      } else {
        showError(new OrchestrationError(
          error instanceof Error ? error.message : 'Erro inesperado'
        ));
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, [operation, showError]);

  return { execute, loading };
}
```

## Exemplos de Uso

### Componente com Tratamento de Erro

```tsx
import React from 'react';
import { useOrchestrationOperation } from './hooks/useOrchestrationOperation';
import { orchestrationAPI } from './api/OrchestrationAPI';

interface DeployButtonProps {
  tenantId: string;
  onSuccess?: () => void;
}

export const DeployButton: React.FC<DeployButtonProps> = ({ tenantId, onSuccess }) => {
  const { execute: deploy, loading } = useOrchestrationOperation(
    (id: string) => orchestrationAPI.deploy(id)
  );

  const handleDeploy = async () => {
    const result = await deploy(tenantId);
    if (result) {
      onSuccess?.();
    }
  };

  return (
    <button 
      onClick={handleDeploy} 
      disabled={loading}
      className="deploy-button"
    >
      {loading ? 'Implantando...' : 'Deploy'}
    </button>
  );
};
```

### Validação Prévia

```tsx
const validateConfigBeforeSave = (config: SetOrchestrationConfigRequest): OrchestrationError | null => {
  if (!config.mode || !['shared', 'dedicated'].includes(config.mode)) {
    return new OrchestrationError(
      'Modo de orquestração deve ser "shared" ou "dedicated"',
      'invalid_mode'
    );
  }

  if (config.autoscaling_enabled) {
    if (!config.min_replicas || config.min_replicas < 1) {
      return new OrchestrationError(
        'Réplicas mínimas deve ser pelo menos 1',
        'invalid_min_replicas'
      );
    }

    if (!config.max_replicas || config.max_replicas < config.min_replicas) {
      return new OrchestrationError(
        'Réplicas máximas deve ser maior ou igual às mínimas',
        'invalid_max_replicas'
      );
    }

    if (!config.target_cpu_utilization || 
        config.target_cpu_utilization < 10 || 
        config.target_cpu_utilization > 100) {
      return new OrchestrationError(
        'Utilização de CPU deve estar entre 10% e 100%',
        'invalid_cpu_target'
      );
    }
  }

  return null;
};

// Uso no componente
const handleSaveConfig = async (config: SetOrchestrationConfigRequest) => {
  const validationError = validateConfigBeforeSave(config);
  if (validationError) {
    showError(validationError);
    return;
  }

  const result = await saveConfig(tenantId, config);
  if (result) {
    onSuccess?.();
  }
};
```

## Estilos CSS

```css
.error-notification {
  position: fixed;
  top: 20px;
  right: 20px;
  max-width: 400px;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  transition: all 0.3s ease;
}

.error-notification.visible {
  opacity: 1;
  transform: translateX(0);
}

.error-notification.hidden {
  opacity: 0;
  transform: translateX(100%);
}

.error-notification.error-auth {
  background-color: #fff3cd;
  border: 1px solid #ffeaa7;
  color: #856404;
}

.error-notification.error-validation {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.error-notification.error-retryable {
  background-color: #d1ecf1;
  border: 1px solid #bee5eb;
  color: #0c5460;
}

.error-notification.error-general {
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  color: #721c24;
}

.error-content {
  padding: 15px;
}

.error-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.error-icon {
  font-size: 1.2em;
}

.error-title {
  font-weight: bold;
}

.error-message {
  margin-bottom: 10px;
  line-height: 1.4;
}

.error-details {
  margin-top: 10px;
}

.error-details summary {
  cursor: pointer;
  font-weight: bold;
  margin-bottom: 5px;
}

.error-details pre {
  background-color: rgba(0, 0, 0, 0.05);
  padding: 8px;
  border-radius: 4px;
  font-size: 0.8em;
  overflow-x: auto;
}

.error-actions {
  display: flex;
  gap: 8px;
  padding: 0 15px 15px;
}

.error-button {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9em;
  font-weight: bold;
}

.error-button.retry {
  background-color: #007bff;
  color: white;
}

.error-button.retry:hover {
  background-color: #0056b3;
}

.error-button.dismiss {
  background-color: transparent;
  color: inherit;
  border: 1px solid currentColor;
}

.error-button.dismiss:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .error-notification {
    position: fixed;
    top: 10px;
    left: 10px;
    right: 10px;
    max-width: none;
  }

  .error-notification.visible {
    transform: translateY(0);
  }

  .error-notification.hidden {
    transform: translateY(-100%);
  }
}
```
