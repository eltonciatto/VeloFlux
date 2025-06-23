# Exemplos de Integração SMTP - JavaScript/TypeScript

Este documento contém exemplos práticos de como integrar com a API SMTP do VeloFlux usando JavaScript e TypeScript.

## Client HTTP Baseado em Fetch

### Classe Base para API

```typescript
interface AuthToken {
  token: string;
  expiresAt: Date;
}

interface SMTPSettings {
  enabled: boolean;
  host: string;
  port: number;
  username: string;
  password: string;
  from_email: string;
  from_name: string;
  use_tls: boolean;
  app_domain: string;
}

interface SMTPTestRequest {
  email: string;
  config: SMTPSettings;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status: number;
}

class VeloFluxSMTPClient {
  private baseUrl: string;
  private authToken: string;

  constructor(baseUrl: string, authToken: string) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.authToken = authToken;
  }

  private async makeRequest<T>(
    endpoint: string, 
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.authToken}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const isJson = response.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    return {
      data: response.ok ? data : undefined,
      error: response.ok ? undefined : (typeof data === 'string' ? data : data.error || 'Erro desconhecido'),
      status: response.status,
    };
  }

  async getSMTPSettings(tenantId: string): Promise<ApiResponse<SMTPSettings>> {
    return this.makeRequest<SMTPSettings>(`/api/tenant/${tenantId}/smtp-settings`, {
      method: 'GET',
    });
  }

  async updateSMTPSettings(tenantId: string, settings: SMTPSettings): Promise<ApiResponse<{status: string, message: string}>> {
    return this.makeRequest(`/api/tenant/${tenantId}/smtp-settings`, {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  async testSMTPSettings(tenantId: string, email: string, config: SMTPSettings): Promise<ApiResponse<{status: string, message: string}>> {
    return this.makeRequest(`/api/tenant/${tenantId}/smtp-test`, {
      method: 'POST',
      body: JSON.stringify({
        email,
        config,
      }),
    });
  }
}
```

### Uso da Classe Client

```typescript
// Inicializar o client
const smtpClient = new VeloFluxSMTPClient('https://api.veloflux.io', 'your-auth-token');

// Exemplo de uso completo
async function manageSMTPSettings() {
  const tenantId = 'tenant-123';

  try {
    // 1. Buscar configurações atuais
    console.log('Buscando configurações SMTP...');
    const currentSettings = await smtpClient.getSMTPSettings(tenantId);
    
    if (currentSettings.error) {
      console.error('Erro ao buscar configurações:', currentSettings.error);
      return;
    }

    console.log('Configurações atuais:', currentSettings.data);

    // 2. Atualizar configurações
    const newSettings: SMTPSettings = {
      enabled: true,
      host: 'smtp.gmail.com',
      port: 587,
      username: 'noreply@example.com',
      password: 'your-app-password',
      from_email: 'noreply@example.com',
      from_name: 'VeloFlux App',
      use_tls: true,
      app_domain: 'https://app.example.com'
    };

    console.log('Atualizando configurações SMTP...');
    const updateResult = await smtpClient.updateSMTPSettings(tenantId, newSettings);
    
    if (updateResult.error) {
      console.error('Erro ao atualizar configurações:', updateResult.error);
      return;
    }

    console.log('Configurações atualizadas:', updateResult.data);

    // 3. Testar configurações
    console.log('Testando configurações SMTP...');
    const testResult = await smtpClient.testSMTPSettings(
      tenantId, 
      'test@example.com', 
      newSettings
    );
    
    if (testResult.error) {
      console.error('Erro no teste SMTP:', testResult.error);
      return;
    }

    console.log('Teste realizado com sucesso:', testResult.data);

  } catch (error) {
    console.error('Erro inesperado:', error);
  }
}

// Executar exemplo
manageSMTPSettings();
```

## Hooks React para Gerenciamento de Estado

### Hook personalizado para SMTP

```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseSMTPSettingsReturn {
  settings: SMTPSettings | null;
  loading: boolean;
  error: string | null;
  loadSettings: () => Promise<void>;
  updateSettings: (settings: SMTPSettings) => Promise<boolean>;
  testSettings: (email: string, config?: SMTPSettings) => Promise<boolean>;
}

export const useSMTPSettings = (
  tenantId: string, 
  authToken: string
): UseSMTPSettingsReturn => {
  const [settings, setSettings] = useState<SMTPSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const smtpClient = new VeloFluxSMTPClient('https://api.veloflux.io', authToken);

  const loadSettings = useCallback(async () => {
    if (!tenantId || !authToken) return;

    setLoading(true);
    setError(null);

    try {
      const result = await smtpClient.getSMTPSettings(tenantId);
      
      if (result.error) {
        setError(result.error);
      } else {
        setSettings(result.data || null);
      }
    } catch (err) {
      setError('Erro ao carregar configurações SMTP');
    } finally {
      setLoading(false);
    }
  }, [tenantId, authToken]);

  const updateSettings = useCallback(async (newSettings: SMTPSettings): Promise<boolean> => {
    setLoading(true);
    setError(null);

    try {
      const result = await smtpClient.updateSMTPSettings(tenantId, newSettings);
      
      if (result.error) {
        setError(result.error);
        return false;
      } else {
        setSettings(newSettings);
        return true;
      }
    } catch (err) {
      setError('Erro ao atualizar configurações SMTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, authToken]);

  const testSettings = useCallback(async (
    email: string, 
    config?: SMTPSettings
  ): Promise<boolean> => {
    const configToTest = config || settings;
    
    if (!configToTest) {
      setError('Nenhuma configuração disponível para teste');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await smtpClient.testSMTPSettings(tenantId, email, configToTest);
      
      if (result.error) {
        setError(result.error);
        return false;
      } else {
        return true;
      }
    } catch (err) {
      setError('Erro ao testar configurações SMTP');
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, authToken, settings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return {
    settings,
    loading,
    error,
    loadSettings,
    updateSettings,
    testSettings,
  };
};
```

### Componente React usando o Hook

```typescript
import React, { useState } from 'react';
import { useSMTPSettings } from './hooks/useSMTPSettings';

interface SMTPSettingsFormProps {
  tenantId: string;
  authToken: string;
}

export const SMTPSettingsForm: React.FC<SMTPSettingsFormProps> = ({ 
  tenantId, 
  authToken 
}) => {
  const {
    settings,
    loading,
    error,
    updateSettings,
    testSettings,
  } = useSMTPSettings(tenantId, authToken);

  const [formData, setFormData] = useState<SMTPSettings>({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    app_domain: '',
  });

  const [testEmail, setTestEmail] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Sincronizar form com settings carregados
  React.useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const handleInputChange = (field: keyof SMTPSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');

    const success = await updateSettings(formData);
    if (success) {
      setSuccessMessage('Configurações SMTP atualizadas com sucesso!');
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      alert('Por favor, insira um email para teste');
      return;
    }

    setSuccessMessage('');
    const success = await testSettings(testEmail, formData);
    if (success) {
      setSuccessMessage('Email de teste enviado com sucesso!');
    }
  };

  if (loading && !settings) {
    return <div>Carregando configurações SMTP...</div>;
  }

  return (
    <div className="smtp-settings-form">
      <h2>Configurações SMTP</h2>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="alert alert-success">
          {successMessage}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
            />
            Habilitar SMTP
          </label>
        </div>

        {formData.enabled && (
          <>
            <div className="form-grid">
              <div className="form-group">
                <label>Host SMTP *</label>
                <input
                  type="text"
                  value={formData.host}
                  onChange={(e) => handleInputChange('host', e.target.value)}
                  placeholder="smtp.gmail.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Porta *</label>
                <input
                  type="number"
                  value={formData.port}
                  onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                  placeholder="587"
                  min="1"
                  max="65535"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Usuário *</label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="seu-email@gmail.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Senha</label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="Deixe em branco para manter a senha atual"
              />
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>Email Remetente *</label>
                <input
                  type="email"
                  value={formData.from_email}
                  onChange={(e) => handleInputChange('from_email', e.target.value)}
                  placeholder="noreply@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Nome Remetente</label>
                <input
                  type="text"
                  value={formData.from_name}
                  onChange={(e) => handleInputChange('from_name', e.target.value)}
                  placeholder="VeloFlux"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Domínio da Aplicação</label>
              <input
                type="url"
                value={formData.app_domain}
                onChange={(e) => handleInputChange('app_domain', e.target.value)}
                placeholder="https://app.example.com"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.use_tls}
                  onChange={(e) => handleInputChange('use_tls', e.target.checked)}
                />
                Usar TLS (Recomendado)
              </label>
            </div>
          </>
        )}

        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      {formData.enabled && (
        <div className="test-section">
          <h3>Testar Configurações</h3>
          <div className="form-group">
            <label>Email para teste:</label>
            <input
              type="email"
              value={testEmail}
              onChange={(e) => setTestEmail(e.target.value)}
              placeholder="test@example.com"
            />
          </div>
          <button 
            type="button" 
            onClick={handleTest}
            disabled={loading || !testEmail}
            className="btn btn-secondary"
          >
            {loading ? 'Enviando...' : 'Enviar Email de Teste'}
          </button>
        </div>
      )}
    </div>
  );
};
```

## Contexto React para Gerenciamento Global

```typescript
import React, { createContext, useContext, useReducer, ReactNode } from 'react';

interface SMTPState {
  settings: { [tenantId: string]: SMTPSettings };
  loading: { [tenantId: string]: boolean };
  errors: { [tenantId: string]: string | null };
}

type SMTPAction =
  | { type: 'SET_LOADING'; tenantId: string; loading: boolean }
  | { type: 'SET_ERROR'; tenantId: string; error: string | null }
  | { type: 'SET_SETTINGS'; tenantId: string; settings: SMTPSettings }
  | { type: 'CLEAR_ERROR'; tenantId: string };

const initialState: SMTPState = {
  settings: {},
  loading: {},
  errors: {},
};

function smtpReducer(state: SMTPState, action: SMTPAction): SMTPState {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: { ...state.loading, [action.tenantId]: action.loading },
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.tenantId]: action.error },
      };
    case 'SET_SETTINGS':
      return {
        ...state,
        settings: { ...state.settings, [action.tenantId]: action.settings },
      };
    case 'CLEAR_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.tenantId]: null },
      };
    default:
      return state;
  }
}

interface SMTPContextType {
  state: SMTPState;
  loadSettings: (tenantId: string, authToken: string) => Promise<void>;
  updateSettings: (tenantId: string, authToken: string, settings: SMTPSettings) => Promise<boolean>;
  testSettings: (tenantId: string, authToken: string, email: string, config?: SMTPSettings) => Promise<boolean>;
  clearError: (tenantId: string) => void;
}

const SMTPContext = createContext<SMTPContextType | undefined>(undefined);

export const SMTPProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(smtpReducer, initialState);

  const loadSettings = async (tenantId: string, authToken: string) => {
    dispatch({ type: 'SET_LOADING', tenantId, loading: true });
    dispatch({ type: 'CLEAR_ERROR', tenantId });

    try {
      const client = new VeloFluxSMTPClient('https://api.veloflux.io', authToken);
      const result = await client.getSMTPSettings(tenantId);

      if (result.error) {
        dispatch({ type: 'SET_ERROR', tenantId, error: result.error });
      } else if (result.data) {
        dispatch({ type: 'SET_SETTINGS', tenantId, settings: result.data });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', tenantId, error: 'Erro ao carregar configurações SMTP' });
    } finally {
      dispatch({ type: 'SET_LOADING', tenantId, loading: false });
    }
  };

  const updateSettings = async (
    tenantId: string, 
    authToken: string, 
    settings: SMTPSettings
  ): Promise<boolean> => {
    dispatch({ type: 'SET_LOADING', tenantId, loading: true });
    dispatch({ type: 'CLEAR_ERROR', tenantId });

    try {
      const client = new VeloFluxSMTPClient('https://api.veloflux.io', authToken);
      const result = await client.updateSMTPSettings(tenantId, settings);

      if (result.error) {
        dispatch({ type: 'SET_ERROR', tenantId, error: result.error });
        return false;
      } else {
        dispatch({ type: 'SET_SETTINGS', tenantId, settings });
        return true;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', tenantId, error: 'Erro ao atualizar configurações SMTP' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', tenantId, loading: false });
    }
  };

  const testSettings = async (
    tenantId: string,
    authToken: string,
    email: string,
    config?: SMTPSettings
  ): Promise<boolean> => {
    const configToTest = config || state.settings[tenantId];
    
    if (!configToTest) {
      dispatch({ type: 'SET_ERROR', tenantId, error: 'Nenhuma configuração disponível para teste' });
      return false;
    }

    dispatch({ type: 'SET_LOADING', tenantId, loading: true });
    dispatch({ type: 'CLEAR_ERROR', tenantId });

    try {
      const client = new VeloFluxSMTPClient('https://api.veloflux.io', authToken);
      const result = await client.testSMTPSettings(tenantId, email, configToTest);

      if (result.error) {
        dispatch({ type: 'SET_ERROR', tenantId, error: result.error });
        return false;
      } else {
        return true;
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', tenantId, error: 'Erro ao testar configurações SMTP' });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', tenantId, loading: false });
    }
  };

  const clearError = (tenantId: string) => {
    dispatch({ type: 'CLEAR_ERROR', tenantId });
  };

  return (
    <SMTPContext.Provider value={{
      state,
      loadSettings,
      updateSettings,
      testSettings,
      clearError,
    }}>
      {children}
    </SMTPContext.Provider>
  );
};

export const useSMTPContext = () => {
  const context = useContext(SMTPContext);
  if (context === undefined) {
    throw new Error('useSMTPContext must be used within a SMTPProvider');
  }
  return context;
};
```

## Validação de Formulário

```typescript
interface ValidationError {
  field: string;
  message: string;
}

export const validateSMTPSettings = (settings: SMTPSettings): ValidationError[] => {
  const errors: ValidationError[] = [];

  if (settings.enabled) {
    // Campos obrigatórios
    if (!settings.host.trim()) {
      errors.push({ field: 'host', message: 'Host é obrigatório' });
    }

    if (!settings.port || settings.port <= 0 || settings.port > 65535) {
      errors.push({ field: 'port', message: 'Porta deve estar entre 1 e 65535' });
    }

    if (!settings.username.trim()) {
      errors.push({ field: 'username', message: 'Usuário é obrigatório' });
    }

    if (!settings.from_email.trim()) {
      errors.push({ field: 'from_email', message: 'Email remetente é obrigatório' });
    }

    // Validação de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.from_email && !emailRegex.test(settings.from_email)) {
      errors.push({ field: 'from_email', message: 'Email remetente deve ter formato válido' });
    }

    // Validação de URL
    if (settings.app_domain) {
      try {
        new URL(settings.app_domain);
      } catch {
        errors.push({ field: 'app_domain', message: 'Domínio deve ser uma URL válida' });
      }
    }
  }

  return errors;
};

// Hook para validação
export const useFormValidation = (settings: SMTPSettings) => {
  const [errors, setErrors] = useState<ValidationError[]>([]);

  useEffect(() => {
    const validationErrors = validateSMTPSettings(settings);
    setErrors(validationErrors);
  }, [settings]);

  const isValid = errors.length === 0;
  const getFieldError = (field: string) => errors.find(err => err.field === field)?.message;

  return { errors, isValid, getFieldError };
};
```

## Configurações Predefinidas para Provedores

```typescript
export const SMTP_PROVIDERS = {
  gmail: {
    name: 'Gmail',
    host: 'smtp.gmail.com',
    port: 587,
    use_tls: true,
    instructions: 'Use uma senha de aplicativo se tiver 2FA habilitado',
  },
  outlook: {
    name: 'Outlook/Hotmail',
    host: 'smtp-mail.outlook.com',
    port: 587,
    use_tls: true,
    instructions: 'Use sua senha normal do Outlook',
  },
  sendgrid: {
    name: 'SendGrid',
    host: 'smtp.sendgrid.net',
    port: 587,
    use_tls: true,
    instructions: 'Use "apikey" como usuário e sua API key como senha',
  },
  mailgun: {
    name: 'Mailgun',
    host: 'smtp.mailgun.org',
    port: 587,
    use_tls: true,
    instructions: 'Use o usuário SMTP e senha fornecidos pelo Mailgun',
  },
  custom: {
    name: 'Personalizado',
    host: '',
    port: 587,
    use_tls: true,
    instructions: 'Configure manualmente as configurações do seu provedor SMTP',
  },
};

// Componente de seleção de provedor
export const SMTPProviderSelector: React.FC<{
  onSelect: (provider: typeof SMTP_PROVIDERS[keyof typeof SMTP_PROVIDERS]) => void;
}> = ({ onSelect }) => {
  return (
    <div className="smtp-provider-selector">
      <label>Selecione um provedor:</label>
      <select onChange={(e) => {
        const provider = SMTP_PROVIDERS[e.target.value as keyof typeof SMTP_PROVIDERS];
        onSelect(provider);
      }}>
        <option value="">Selecione um provedor</option>
        {Object.entries(SMTP_PROVIDERS).map(([key, provider]) => (
          <option key={key} value={key}>
            {provider.name}
          </option>
        ))}
      </select>
    </div>
  );
};
```
