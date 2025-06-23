# Tratamento de Erros - API SMTP

Este documento detalha como tratar adequadamente todos os tipos de erros que podem ocorrer ao consumir a API SMTP do VeloFlux.

## Tipos de Erros

### 1. Erros HTTP de Status

#### 400 - Bad Request
**Possíveis Causas:**
- Dados JSON inválidos no corpo da requisição
- Campos obrigatórios ausentes quando SMTP está habilitado
- Formato inválido de dados (ex: porta negativa, email inválido)

**Exemplos de Response:**
```json
{
  "error": "SMTP settings are incomplete"
}
```

```json
{
  "error": "Email is required"
}
```

**Tratamento no Frontend:**
```typescript
const handleBadRequest = (error: string) => {
  if (error.includes('SMTP settings are incomplete')) {
    return 'Por favor, preencha todos os campos obrigatórios: Host, Porta, Usuário e Email Remetente.';
  }
  
  if (error.includes('Email is required')) {
    return 'Email é obrigatório para realizar o teste SMTP.';
  }
  
  if (error.includes('Invalid request')) {
    return 'Dados enviados são inválidos. Verifique o formato dos campos.';
  }
  
  return error || 'Dados da requisição são inválidos.';
};
```

#### 401 - Unauthorized
**Possíveis Causas:**
- Token de autenticação ausente
- Token de autenticação inválido ou expirado
- Formato incorreto do header Authorization

**Tratamento no Frontend:**
```typescript
const handleUnauthorized = () => {
  // Limpar token local
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
  
  // Redirecionar para login
  window.location.href = '/login';
  
  return 'Sessão expirada. Redirecionando para login...';
};
```

#### 403 - Forbidden
**Possíveis Causas:**
- Usuário não pertence ao tenant especificado
- Usuário não tem permissão de admin quando necessário
- Tentativa de acesso a recurso não autorizado

**Tratamento no Frontend:**
```typescript
const handleForbidden = () => {
  return 'Você não tem permissão para realizar esta ação. Entre em contato com o administrador.';
};
```

#### 500 - Internal Server Error
**Possíveis Causas:**
- Erro interno do servidor
- Falha na conexão com Redis/banco de dados
- Erro não tratado no backend

**Tratamento no Frontend:**
```typescript
const handleServerError = () => {
  return 'Erro interno do servidor. Tente novamente em alguns minutos ou entre em contato com o suporte.';
};
```

### 2. Erros de Rede

#### Timeout de Conexão
```typescript
const makeRequestWithTimeout = async (url: string, options: RequestInit, timeoutMs = 30000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    
    if (error.name === 'AbortError') {
      throw new Error('Timeout: A requisição demorou muito para responder.');
    }
    
    throw error;
  }
};
```

#### Erro de Conectividade
```typescript
const handleNetworkError = (error: Error) => {
  if (!navigator.onLine) {
    return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
  }
  
  if (error.message.includes('Failed to fetch')) {
    return 'Falha na conexão com o servidor. Verifique sua conexão de rede.';
  }
  
  return 'Erro de rede. Tente novamente.';
};
```

### 3. Erros Específicos de SMTP

#### Falhas de Autenticação SMTP
```json
{
  "error": "Failed to send test email: smtp: authentication failed"
}
```

#### Configurações SMTP Inválidas
```json
{
  "error": "Failed to send test email: dial tcp: lookup smtp.invalid-host.com: no such host"
}
```

#### Problemas de Conectividade SMTP
```json
{
  "error": "Failed to send test email: dial tcp 127.0.0.1:587: connect: connection refused"
}
```

**Tratamento de Erros SMTP:**
```typescript
const handleSMTPError = (error: string): string => {
  if (error.includes('authentication failed')) {
    return 'Falha na autenticação SMTP. Verifique seu usuário e senha. Para Gmail, use uma senha de aplicativo.';
  }
  
  if (error.includes('no such host')) {
    return 'Host SMTP inválido. Verifique se o endereço do servidor está correto.';
  }
  
  if (error.includes('connection refused')) {
    return 'Conexão recusada pelo servidor SMTP. Verifique a porta e se o servidor está acessível.';
  }
  
  if (error.includes('timeout')) {
    return 'Timeout na conexão SMTP. O servidor pode estar indisponível ou a porta pode estar bloqueada.';
  }
  
  if (error.includes('certificate')) {
    return 'Erro de certificado SSL/TLS. Verifique as configurações de segurança do servidor.';
  }
  
  if (error.includes('550')) {
    return 'Email rejeitado pelo servidor. Verifique se o email remetente é válido e autorizado.';
  }
  
  return `Erro SMTP: ${error}`;
};
```

## Handler Unificado de Erros

```typescript
interface ErrorContext {
  endpoint: string;
  tenantId: string;
  action: 'get' | 'update' | 'test';
}

class SMTPErrorHandler {
  static handle(error: any, context: ErrorContext): string {
    // Log para debugging
    console.error('SMTP Error:', {
      error,
      context,
      timestamp: new Date().toISOString(),
    });

    // Erro de rede
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      return this.handleNetworkError(error);
    }

    // Erro com status HTTP
    if (error.status) {
      return this.handleHTTPError(error.status, error.message || error.error);
    }

    // Erro de SMTP específico
    if (error.message && error.message.includes('Failed to send test email')) {
      return handleSMTPError(error.message);
    }

    // Erro genérico
    return this.handleGenericError(error);
  }

  private static handleNetworkError(error: Error): string {
    if (!navigator.onLine) {
      return 'Sem conexão com a internet. Verifique sua conexão e tente novamente.';
    }
    
    return 'Falha na conexão com o servidor. Verifique sua conexão de rede.';
  }

  private static handleHTTPError(status: number, message: string): string {
    switch (status) {
      case 400:
        return handleBadRequest(message);
      case 401:
        return handleUnauthorized();
      case 403:
        return handleForbidden();
      case 500:
        return handleServerError();
      default:
        return `Erro HTTP ${status}: ${message || 'Erro desconhecido'}`;
    }
  }

  private static handleGenericError(error: any): string {
    return error.message || 'Erro inesperado. Tente novamente.';
  }
}
```

## Hook para Tratamento de Erros

```typescript
import { useState, useCallback } from 'react';

interface UseErrorHandlerReturn {
  error: string | null;
  showError: (error: any, context?: ErrorContext) => void;
  clearError: () => void;
  isError: boolean;
}

export const useErrorHandler = (): UseErrorHandlerReturn => {
  const [error, setError] = useState<string | null>(null);

  const showError = useCallback((error: any, context?: ErrorContext) => {
    const errorMessage = context 
      ? SMTPErrorHandler.handle(error, context)
      : (error.message || error.toString());
    
    setError(errorMessage);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    showError,
    clearError,
    isError: error !== null,
  };
};
```

## Retry com Backoff Exponencial

```typescript
interface RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  retryCondition?: (error: any) => boolean;
}

const defaultRetryOptions: RetryOptions = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  retryCondition: (error) => {
    // Retry apenas para erros de rede ou 5xx
    return error.status >= 500 || error.name === 'TypeError';
  },
};

export const withRetry = async <T>(
  operation: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> => {
  const config = { ...defaultRetryOptions, ...options };
  let lastError: any;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;

      // Não fazer retry se não atender a condição
      if (!config.retryCondition!(error)) {
        throw error;
      }

      // Não fazer retry na última tentativa
      if (attempt === config.maxRetries) {
        break;
      }

      // Calcular delay com backoff exponencial
      const delay = Math.min(
        config.baseDelay * Math.pow(2, attempt),
        config.maxDelay
      );

      console.log(`Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError;
};

// Uso do retry
const getSMTPSettingsWithRetry = async (tenantId: string, authToken: string) => {
  return withRetry(async () => {
    const client = new VeloFluxSMTPClient('https://api.veloflux.io', authToken);
    return await client.getSMTPSettings(tenantId);
  });
};
```

## Componente de Notificação de Erro

```typescript
import React from 'react';

interface ErrorNotificationProps {
  error: string | null;
  onClose: () => void;
  type?: 'error' | 'warning' | 'info';
  autoClose?: boolean;
  duration?: number;
}

export const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onClose,
  type = 'error',
  autoClose = true,
  duration = 5000,
}) => {
  React.useEffect(() => {
    if (error && autoClose) {
      const timer = setTimeout(onClose, duration);
      return () => clearTimeout(timer);
    }
  }, [error, onClose, autoClose, duration]);

  if (!error) return null;

  const getIcon = () => {
    switch (type) {
      case 'error':
        return '❌';
      case 'warning':
        return '⚠️';
      case 'info':
        return 'ℹ️';
      default:
        return '❌';
    }
  };

  const getClassName = () => {
    return `notification notification--${type}`;
  };

  return (
    <div className={getClassName()}>
      <div className="notification__content">
        <span className="notification__icon">{getIcon()}</span>
        <span className="notification__message">{error}</span>
      </div>
      <button 
        className="notification__close"
        onClick={onClose}
        aria-label="Fechar notificação"
      >
        ✕
      </button>
    </div>
  );
};
```

## CSS para Notificações

```css
.notification {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 4px;
  border-left: 4px solid;
  background-color: #f8f9fa;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideIn 0.3s ease-out;
}

.notification--error {
  border-left-color: #dc3545;
  background-color: #f8d7da;
  color: #721c24;
}

.notification--warning {
  border-left-color: #ffc107;
  background-color: #fff3cd;
  color: #856404;
}

.notification--info {
  border-left-color: #17a2b8;
  background-color: #d1ecf1;
  color: #0c5460;
}

.notification__content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.notification__icon {
  font-size: 16px;
}

.notification__message {
  flex: 1;
  font-size: 14px;
  line-height: 1.4;
}

.notification__close {
  background: none;
  border: none;
  font-size: 16px;
  cursor: pointer;
  padding: 4px;
  opacity: 0.7;
  transition: opacity 0.2s;
}

.notification__close:hover {
  opacity: 1;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

## Logging e Monitoramento

```typescript
interface ErrorLog {
  timestamp: string;
  endpoint: string;
  tenantId: string;
  userId?: string;
  error: any;
  userAgent: string;
  context?: any;
}

class ErrorLogger {
  private static logs: ErrorLog[] = [];

  static log(error: any, context: ErrorContext & { userId?: string }) {
    const errorLog: ErrorLog = {
      timestamp: new Date().toISOString(),
      endpoint: context.endpoint,
      tenantId: context.tenantId,
      userId: context.userId,
      error: {
        message: error.message,
        status: error.status,
        stack: error.stack,
      },
      userAgent: navigator.userAgent,
      context,
    };

    this.logs.push(errorLog);

    // Enviar para serviço de monitoramento (ex: Sentry, LogRocket)
    if (window.Sentry) {
      window.Sentry.captureException(error, {
        extra: errorLog,
      });
    }

    // Manter apenas os últimos 100 logs localmente
    if (this.logs.length > 100) {
      this.logs = this.logs.slice(-100);
    }
  }

  static getLogs(): ErrorLog[] {
    return [...this.logs];
  }

  static clearLogs() {
    this.logs = [];
  }
}
```

## Exemplo de Uso Completo

```typescript
export const SMTPSettingsWithErrorHandling: React.FC<{
  tenantId: string;
  authToken: string;
}> = ({ tenantId, authToken }) => {
  const { error, showError, clearError } = useErrorHandler();
  const [settings, setSettings] = useState<SMTPSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    clearError();

    try {
      const result = await withRetry(() => 
        getSMTPSettingsWithRetry(tenantId, authToken)
      );

      if (result.error) {
        showError(result, {
          endpoint: 'smtp-settings',
          tenantId,
          action: 'get',
        });
      } else {
        setSettings(result.data);
      }
    } catch (err) {
      showError(err, {
        endpoint: 'smtp-settings',
        tenantId,
        action: 'get',
      });
      
      ErrorLogger.log(err, {
        endpoint: 'smtp-settings',
        tenantId,
        action: 'get',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <ErrorNotification 
        error={error} 
        onClose={clearError}
        type="error"
      />
      
      {/* Resto do componente */}
    </div>
  );
};
```
