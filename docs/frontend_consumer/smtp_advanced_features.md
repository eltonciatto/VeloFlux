# Configurações Avançadas - API SMTP

Este documento cobre configurações avançadas e funcionalidades extras para a API SMTP do VeloFlux.

## 🔧 Configuração de Ambientes

### Múltiplos Ambientes

```typescript
interface EnvironmentConfig {
  name: string;
  apiUrl: string;
  defaultProvider: string;
  features: {
    testEmails: boolean;
    analytics: boolean;
    templates: boolean;
  };
}

const environments: Record<string, EnvironmentConfig> = {
  development: {
    name: 'Desenvolvimento',
    apiUrl: 'http://localhost:8080',
    defaultProvider: 'custom',
    features: {
      testEmails: true,
      analytics: false,
      templates: true,
    },
  },
  staging: {
    name: 'Homologação',
    apiUrl: 'https://staging-api.veloflux.io',
    defaultProvider: 'sendgrid',
    features: {
      testEmails: true,
      analytics: true,
      templates: true,
    },
  },
  production: {
    name: 'Produção',
    apiUrl: 'https://api.veloflux.io',
    defaultProvider: 'sendgrid',
    features: {
      testEmails: false,
      analytics: true,
      templates: true,
    },
  },
};

// Hook para configuração de ambiente
export const useEnvironment = () => {
  const env = process.env.NODE_ENV || 'development';
  return environments[env] || environments.development;
};
```

### Configuração Dinâmica

```typescript
class SMTPConfigManager {
  private config: EnvironmentConfig;
  private tenantSettings: Map<string, Partial<SMTPSettings>> = new Map();

  constructor() {
    this.config = environments[process.env.NODE_ENV || 'development'];
  }

  // Configurações específicas por tenant
  setTenantDefaults(tenantId: string, defaults: Partial<SMTPSettings>) {
    this.tenantSettings.set(tenantId, defaults);
  }

  getTenantDefaults(tenantId: string): Partial<SMTPSettings> {
    return this.tenantSettings.get(tenantId) || {};
  }

  // Configurações baseadas no domínio do tenant
  getProviderByDomain(email: string): keyof typeof SMTP_PROVIDERS {
    const domain = email.split('@')[1];
    
    switch (domain) {
      case 'gmail.com':
      case 'googlemail.com':
        return 'gmail';
      case 'outlook.com':
      case 'hotmail.com':
      case 'live.com':
        return 'outlook';
      default:
        return this.config.defaultProvider as keyof typeof SMTP_PROVIDERS;
    }
  }

  // Configuração automática baseada no provedor
  autoConfigureProvider(provider: keyof typeof SMTP_PROVIDERS, email: string): Partial<SMTPSettings> {
    const providerConfig = SMTP_PROVIDERS[provider];
    
    return {
      ...providerConfig,
      username: email,
      from_email: email,
      from_name: email.split('@')[0],
    };
  }
}
```

## 🎨 Temas e Personalização

### Sistema de Temas

```typescript
interface SMTPTheme {
  name: string;
  colors: {
    primary: string;
    secondary: string;
    success: string;
    warning: string;
    error: string;
    background: string;
    surface: string;
    text: string;
  };
  fonts: {
    body: string;
    heading: string;
    mono: string;
  };
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
}

const themes: Record<string, SMTPTheme> = {
  light: {
    name: 'Claro',
    colors: {
      primary: '#1976d2',
      secondary: '#424242',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336',
      background: '#ffffff',
      surface: '#f5f5f5',
      text: '#212121',
    },
    fonts: {
      body: '"Roboto", "Helvetica", "Arial", sans-serif',
      heading: '"Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"Roboto Mono", "Courier New", monospace',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
  },
  dark: {
    name: 'Escuro',
    colors: {
      primary: '#90caf9',
      secondary: '#bdbdbd',
      success: '#81c784',
      warning: '#ffb74d',
      error: '#e57373',
      background: '#121212',
      surface: '#1e1e1e',
      text: '#ffffff',
    },
    fonts: {
      body: '"Roboto", "Helvetica", "Arial", sans-serif',
      heading: '"Roboto", "Helvetica", "Arial", sans-serif',
      mono: '"Roboto Mono", "Courier New", monospace',
    },
    spacing: {
      xs: '0.25rem',
      sm: '0.5rem',
      md: '1rem',
      lg: '1.5rem',
      xl: '2rem',
    },
  },
};

// Context para temas
const ThemeContext = React.createContext<{
  theme: SMTPTheme;
  setTheme: (themeName: string) => void;
}>({
  theme: themes.light,
  setTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentTheme, setCurrentTheme] = useState('light');
  
  const setTheme = (themeName: string) => {
    if (themes[themeName]) {
      setCurrentTheme(themeName);
      localStorage.setItem('smtp-theme', themeName);
    }
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('smtp-theme');
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme: themes[currentTheme], setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
```

### Componente Temático

```typescript
const ThemedSMTPForm: React.FC<SMTPSettingsFormProps> = (props) => {
  const { theme } = useTheme();

  const styles = {
    container: {
      backgroundColor: theme.colors.background,
      color: theme.colors.text,
      fontFamily: theme.fonts.body,
      padding: theme.spacing.lg,
      borderRadius: '8px',
    },
    input: {
      backgroundColor: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.secondary}`,
      padding: theme.spacing.sm,
      fontFamily: theme.fonts.body,
    },
    button: {
      backgroundColor: theme.colors.primary,
      color: '#ffffff',
      border: 'none',
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      borderRadius: '4px',
      fontFamily: theme.fonts.body,
      cursor: 'pointer',
    },
    error: {
      color: theme.colors.error,
      backgroundColor: `${theme.colors.error}20`,
      padding: theme.spacing.sm,
      borderRadius: '4px',
      border: `1px solid ${theme.colors.error}`,
    },
    success: {
      color: theme.colors.success,
      backgroundColor: `${theme.colors.success}20`,
      padding: theme.spacing.sm,
      borderRadius: '4px',
      border: `1px solid ${theme.colors.success}`,
    },
  };

  return (
    <div style={styles.container}>
      <SMTPSettingsForm {...props} customStyles={styles} />
    </div>
  );
};
```

## 📊 Analytics e Métricas

### Sistema de Analytics

```typescript
interface SMTPAnalytics {
  settingsUpdated: (tenantId: string, provider: string) => void;
  testEmailSent: (tenantId: string, success: boolean, provider: string) => void;
  configurationError: (tenantId: string, error: string, provider: string) => void;
  formValidationError: (tenantId: string, field: string) => void;
}

class SMTPAnalyticsManager implements SMTPAnalytics {
  private enabled: boolean;
  private apiKey?: string;

  constructor(enabled: boolean = true, apiKey?: string) {
    this.enabled = enabled;
    this.apiKey = apiKey;
  }

  private track(event: string, properties: Record<string, any>) {
    if (!this.enabled) return;

    // Enviar para Google Analytics
    if (typeof gtag !== 'undefined') {
      gtag('event', event, {
        event_category: 'SMTP',
        ...properties,
      });
    }

    // Enviar para Analytics customizado
    if (this.apiKey) {
      fetch('/api/analytics/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event,
          properties,
          timestamp: new Date().toISOString(),
        }),
      }).catch(console.error);
    }

    // Log local para debugging
    console.log('SMTP Analytics:', event, properties);
  }

  settingsUpdated(tenantId: string, provider: string) {
    this.track('smtp_settings_updated', {
      tenant_id: tenantId,
      provider,
    });
  }

  testEmailSent(tenantId: string, success: boolean, provider: string) {
    this.track('smtp_test_email', {
      tenant_id: tenantId,
      success,
      provider,
    });
  }

  configurationError(tenantId: string, error: string, provider: string) {
    this.track('smtp_configuration_error', {
      tenant_id: tenantId,
      error_type: error,
      provider,
    });
  }

  formValidationError(tenantId: string, field: string) {
    this.track('smtp_validation_error', {
      tenant_id: tenantId,
      field,
    });
  }
}

// Hook para analytics
export const useAnalytics = () => {
  const analytics = useMemo(() => new SMTPAnalyticsManager(true), []);
  return analytics;
};
```

### Integração com Analytics

```typescript
export const SMTPSettingsWithAnalytics: React.FC<SMTPSettingsFormProps> = (props) => {
  const analytics = useAnalytics();
  const { updateSettings, testSettings } = useSMTPSettings(props.tenantId, props.authToken);

  const handleUpdateWithAnalytics = async (settings: SMTPSettings) => {
    const success = await updateSettings(settings);
    
    if (success) {
      analytics.settingsUpdated(props.tenantId, settings.host);
    } else {
      analytics.configurationError(props.tenantId, 'update_failed', settings.host);
    }
    
    return success;
  };

  const handleTestWithAnalytics = async (email: string, config?: SMTPSettings) => {
    const success = await testSettings(email, config);
    
    analytics.testEmailSent(
      props.tenantId, 
      success, 
      config?.host || 'unknown'
    );
    
    return success;
  };

  return (
    <SMTPSettingsForm
      {...props}
      onUpdate={handleUpdateWithAnalytics}
      onTest={handleTestWithAnalytics}
    />
  );
};
```

## 🔒 Segurança Avançada

### Criptografia Local

```typescript
class SecureStorage {
  private key: string;

  constructor(masterKey: string = 'smtp-settings') {
    this.key = this.generateKey(masterKey);
  }

  private generateKey(input: string): string {
    // Simples hash para demonstração - use uma lib real em produção
    let hash = 0;
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
  }

  private encrypt(data: string): string {
    // Simples XOR para demonstração - use crypto real em produção
    return btoa(data.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
    ).join(''));
  }

  private decrypt(encryptedData: string): string {
    const data = atob(encryptedData);
    return data.split('').map((char, i) => 
      String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(i % this.key.length))
    ).join('');
  }

  store(key: string, data: any): void {
    const serialized = JSON.stringify(data);
    const encrypted = this.encrypt(serialized);
    localStorage.setItem(key, encrypted);
  }

  retrieve(key: string): any {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch {
      return null;
    }
  }

  remove(key: string): void {
    localStorage.removeItem(key);
  }
}

// Hook para armazenamento seguro
export const useSecureStorage = () => {
  const storage = useMemo(() => new SecureStorage(), []);
  return storage;
};
```

### Validação de Segurança

```typescript
interface SecurityValidation {
  isValid: boolean;
  warnings: string[];
  suggestions: string[];
}

class SMTPSecurityValidator {
  static validateSettings(settings: SMTPSettings): SecurityValidation {
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Verificar TLS
    if (!settings.use_tls) {
      warnings.push('Conexão não criptografada (TLS desabilitado)');
      suggestions.push('Habilite TLS para maior segurança');
    }

    // Verificar porta
    if (settings.port === 25) {
      warnings.push('Porta 25 não é recomendada para SMTP autenticado');
      suggestions.push('Use porta 587 (TLS) ou 465 (SSL)');
    }

    // Verificar senha
    if (settings.password && settings.password.length < 8) {
      warnings.push('Senha muito curta');
      suggestions.push('Use senhas com pelo menos 8 caracteres');
    }

    // Verificar domínio
    if (settings.app_domain && !settings.app_domain.startsWith('https://')) {
      warnings.push('Domínio da aplicação não usa HTTPS');
      suggestions.push('Configure HTTPS para maior segurança');
    }

    // Verificar email do remetente
    const emailDomain = settings.from_email.split('@')[1];
    const hostDomain = settings.host.toLowerCase();
    
    if (!hostDomain.includes(emailDomain)) {
      warnings.push('Domínio do email não corresponde ao servidor SMTP');
      suggestions.push('Verifique se o email é válido para este servidor');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
      suggestions,
    };
  }
}

// Componente de validação de segurança
export const SecurityValidation: React.FC<{ settings: SMTPSettings }> = ({ settings }) => {
  const validation = SMTPSecurityValidator.validateSettings(settings);

  if (validation.isValid) {
    return (
      <div className="security-status security-status--ok">
        <span className="security-icon">🔒</span>
        Configuração segura
      </div>
    );
  }

  return (
    <div className="security-status security-status--warning">
      <div className="security-warnings">
        <h4>⚠️ Avisos de Segurança:</h4>
        <ul>
          {validation.warnings.map((warning, index) => (
            <li key={index}>{warning}</li>
          ))}
        </ul>
      </div>
      
      <div className="security-suggestions">
        <h4>💡 Sugestões:</h4>
        <ul>
          {validation.suggestions.map((suggestion, index) => (
            <li key={index}>{suggestion}</li>
          ))}
        </ul>
      </div>
    </div>
  );
};
```

## 🚀 Performance e Otimizações

### Cache Inteligente

```typescript
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class SMTPCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set<T>(key: string, data: T, ttl: number = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  invalidate(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Hook para cache
export const useSMTPCache = () => {
  const cache = useMemo(() => {
    const instance = new SMTPCache();
    
    // Cleanup automático a cada 5 minutos
    const interval = setInterval(() => instance.cleanup(), 5 * 60 * 1000);
    
    return {
      ...instance,
      destroy: () => clearInterval(interval),
    };
  }, []);

  useEffect(() => {
    return () => cache.destroy();
  }, [cache]);

  return cache;
};
```

### Debouncing para Validação

```typescript
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Componente com validação debounced
export const OptimizedSMTPForm: React.FC<SMTPSettingsFormProps> = (props) => {
  const [formData, setFormData] = useState<SMTPSettings>(initialSettings);
  const debouncedFormData = useDebounce(formData, 500);
  const { errors, isValid } = useFormValidation(debouncedFormData);

  const handleInputChange = useCallback((field: keyof SMTPSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  return (
    <form>
      {/* Formulário com validação em tempo real */}
      <input
        type="text"
        value={formData.host}
        onChange={(e) => handleInputChange('host', e.target.value)}
        className={errors.find(e => e.field === 'host') ? 'error' : ''}
      />
      {/* Outros campos... */}
    </form>
  );
};
```

## 🔄 Integração com Sistemas Externos

### Webhooks para Notificações

```typescript
interface WebhookConfig {
  url: string;
  events: string[];
  headers?: Record<string, string>;
  retries: number;
}

class WebhookManager {
  private configs: Map<string, WebhookConfig> = new Map();

  addWebhook(tenantId: string, config: WebhookConfig) {
    this.configs.set(tenantId, config);
  }

  async sendWebhook(tenantId: string, event: string, data: any) {
    const config = this.configs.get(tenantId);
    if (!config || !config.events.includes(event)) return;

    const payload = {
      event,
      data,
      timestamp: new Date().toISOString(),
      tenant_id: tenantId,
    };

    for (let attempt = 0; attempt <= config.retries; attempt++) {
      try {
        await fetch(config.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...config.headers,
          },
          body: JSON.stringify(payload),
        });
        break;
      } catch (error) {
        if (attempt === config.retries) {
          console.error('Webhook failed after retries:', error);
        }
      }
    }
  }
}

// Integração com o formulário SMTP
export const SMTPWithWebhooks: React.FC<SMTPSettingsFormProps> = (props) => {
  const webhookManager = useMemo(() => new WebhookManager(), []);
  
  useEffect(() => {
    // Configurar webhook para o tenant
    webhookManager.addWebhook(props.tenantId, {
      url: `https://hooks.example.com/smtp/${props.tenantId}`,
      events: ['settings_updated', 'test_email_sent'],
      retries: 3,
    });
  }, [props.tenantId, webhookManager]);

  const handleUpdate = async (settings: SMTPSettings) => {
    const success = await updateSettings(settings);
    
    if (success) {
      await webhookManager.sendWebhook(props.tenantId, 'settings_updated', {
        settings: { ...settings, password: '***' }, // Não enviar senha
      });
    }
    
    return success;
  };

  return <SMTPSettingsForm {...props} onUpdate={handleUpdate} />;
};
```

### Importação/Exportação de Configurações

```typescript
interface ExportData {
  version: string;
  tenant_id: string;
  settings: Omit<SMTPSettings, 'password'>;
  metadata: {
    exported_at: string;
    exported_by: string;
  };
}

class ConfigurationManager {
  exportSettings(tenantId: string, settings: SMTPSettings, userId: string): string {
    const exportData: ExportData = {
      version: '1.0',
      tenant_id: tenantId,
      settings: { ...settings, password: '' }, // Não exportar senha
      metadata: {
        exported_at: new Date().toISOString(),
        exported_by: userId,
      },
    };

    return JSON.stringify(exportData, null, 2);
  }

  importSettings(jsonData: string): SMTPSettings {
    try {
      const data: ExportData = JSON.parse(jsonData);
      
      // Validar versão
      if (data.version !== '1.0') {
        throw new Error('Versão de configuração não suportada');
      }

      // Retornar configurações sem a senha
      return {
        ...data.settings,
        password: '', // Usuário precisará inserir a senha
      };
    } catch (error) {
      throw new Error('Arquivo de configuração inválido');
    }
  }
}

// Componente de importação/exportação
export const ConfigurationTools: React.FC<{
  tenantId: string;
  settings: SMTPSettings;
  onImport: (settings: SMTPSettings) => void;
}> = ({ tenantId, settings, onImport }) => {
  const configManager = useMemo(() => new ConfigurationManager(), []);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = () => {
    const data = configManager.exportSettings(tenantId, settings, 'current-user');
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `smtp-config-${tenantId}-${Date.now()}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSettings = configManager.importSettings(e.target?.result as string);
        onImport(importedSettings);
      } catch (error) {
        alert('Erro ao importar configuração: ' + error.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="configuration-tools">
      <button onClick={handleExport}>
        📤 Exportar Configuração
      </button>
      
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleImport}
        style={{ display: 'none' }}
      />
      
      <button onClick={() => fileInputRef.current?.click()}>
        📥 Importar Configuração
      </button>
    </div>
  );
};
```

Essa documentação avançada cobre funcionalidades extras que podem ser implementadas para tornar a integração com a API SMTP ainda mais robusta e profissional.
