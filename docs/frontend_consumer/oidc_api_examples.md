# Exemplos Práticos - API OIDC Frontend

Este documento complementa o guia principal com exemplos práticos e casos de uso avançados para integração da API OIDC.

## Índice

1. [Implementação Vanilla JavaScript](#implementação-vanilla-javascript)
2. [Integração com Vue.js](#integração-com-vuejs)
3. [Integração com Angular](#integração-com-angular)
4. [Webhooks e Eventos](#webhooks-e-eventos)
5. [Cache e Performance](#cache-e-performance)
6. [Configuração Avançada](#configuração-avançada)
7. [Troubleshooting](#troubleshooting)

## Implementação Vanilla JavaScript

### Cliente HTTP Básico

```javascript
// js/oidc-client.js
class OIDCClient {
  constructor(baseURL = 'http://localhost:8080') {
    this.baseURL = baseURL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.text();
        throw new Error(`HTTP ${response.status}: ${error}`);
      }

      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        return await response.json();
      }
      
      return await response.text();
    } catch (error) {
      console.error('API Request failed:', error);
      
      if (response?.status === 401) {
        this.logout();
      }
      
      throw error;
    }
  }

  // Métodos OIDC
  async getOIDCConfig(tenantId) {
    return await this.request(`/api/tenants/${tenantId}/oidc/config`);
  }

  async setOIDCConfig(tenantId, config) {
    return await this.request(`/api/tenants/${tenantId}/oidc/config`, {
      method: 'PUT',
      body: JSON.stringify(config),
    });
  }

  initiateLogin(tenantId, returnUrl = window.location.href) {
    const url = `/auth/oidc/login/${tenantId}?return_url=${encodeURIComponent(returnUrl)}`;
    window.location.href = url;
  }

  logout() {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  }

  isAuthenticated() {
    const token = localStorage.getItem('auth_token');
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    return !!(token || cookie);
  }
}

// Instância global
const oidcClient = new OIDCClient();
```

### Formulário de Configuração HTML

```html
<!-- config-form.html -->
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Configuração OIDC</title>
    <style>
        .form-container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: Arial, sans-serif;
        }
        .form-group {
            margin-bottom: 15px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-weight: bold;
        }
        input[type="text"], input[type="url"], input[type="password"], textarea {
            width: 100%;
            padding: 8px 12px;
            border: 1px solid #ddd;
            border-radius: 4px;
            box-sizing: border-box;
        }
        .checkbox-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        button {
            background-color: #007bff;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            margin-right: 10px;
        }
        button:hover {
            background-color: #0056b3;
        }
        .alert {
            padding: 12px;
            margin-bottom: 20px;
            border-radius: 4px;
        }
        .alert-success {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        .alert-error {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
    </style>
</head>
<body>
    <div class="form-container">
        <h2>Configuração OIDC</h2>
        
        <div id="alert-container"></div>

        <form id="oidc-config-form">
            <div class="form-group">
                <div class="checkbox-group">
                    <input type="checkbox" id="enabled" name="enabled">
                    <label for="enabled">Habilitar OIDC</label>
                </div>
            </div>

            <div id="oidc-fields" style="display: none;">
                <div class="form-group">
                    <label for="provider_name">Nome do Provedor:</label>
                    <input type="text" id="provider_name" name="provider_name" 
                           placeholder="Ex: Google, Azure AD, Keycloak">
                </div>

                <div class="form-group">
                    <label for="issuer_url">Issuer URL *:</label>
                    <input type="url" id="issuer_url" name="issuer_url" required
                           placeholder="https://accounts.google.com">
                </div>

                <div class="form-group">
                    <label for="client_id">Client ID *:</label>
                    <input type="text" id="client_id" name="client_id" required>
                </div>

                <div class="form-group">
                    <label for="client_secret">Client Secret *:</label>
                    <input type="password" id="client_secret" name="client_secret" required>
                </div>

                <div class="form-group">
                    <label for="redirect_uri">Redirect URI:</label>
                    <input type="url" id="redirect_uri" name="redirect_uri"
                           placeholder="https://seu-dominio.com/auth/oidc/callback">
                </div>

                <div class="form-group">
                    <label for="scopes">Scopes:</label>
                    <input type="text" id="scopes" name="scopes" 
                           placeholder="openid, email, profile"
                           value="openid, email, profile">
                    <small>Separados por vírgula</small>
                </div>

                <div class="form-group">
                    <div class="checkbox-group">
                        <input type="checkbox" id="auto_create_users" name="auto_create_users">
                        <label for="auto_create_users">Criar usuários automaticamente</label>
                    </div>
                </div>
            </div>

            <button type="submit" id="save-btn">Salvar Configuração</button>
            <button type="button" id="cancel-btn">Cancelar</button>
        </form>
    </div>

    <script src="js/oidc-client.js"></script>
    <script>
        class OIDCConfigForm {
            constructor() {
                this.form = document.getElementById('oidc-config-form');
                this.enabledCheckbox = document.getElementById('enabled');
                this.fieldsContainer = document.getElementById('oidc-fields');
                this.saveBtn = document.getElementById('save-btn');
                this.alertContainer = document.getElementById('alert-container');
                
                this.tenantId = new URLSearchParams(window.location.search).get('tenant_id');
                
                if (!this.tenantId) {
                    this.showAlert('Tenant ID não fornecido', 'error');
                    return;
                }

                this.init();
            }

            init() {
                this.enabledCheckbox.addEventListener('change', () => {
                    this.fieldsContainer.style.display = 
                        this.enabledCheckbox.checked ? 'block' : 'none';
                });

                this.form.addEventListener('submit', (e) => this.handleSubmit(e));
                document.getElementById('cancel-btn').addEventListener('click', () => this.loadConfig());

                this.loadConfig();
            }

            async loadConfig() {
                try {
                    const config = await oidcClient.getOIDCConfig(this.tenantId);
                    this.populateForm(config);
                } catch (error) {
                    this.showAlert('Erro ao carregar configuração: ' + error.message, 'error');
                }
            }

            populateForm(config) {
                // Enabled
                this.enabledCheckbox.checked = config.enabled || false;
                this.fieldsContainer.style.display = config.enabled ? 'block' : 'none';

                // Campos
                document.getElementById('provider_name').value = config.provider_name || '';
                document.getElementById('issuer_url').value = config.issuer_url || '';
                document.getElementById('client_id').value = config.client_id || '';
                document.getElementById('client_secret').value = config.client_secret || '';
                document.getElementById('redirect_uri').value = config.redirect_uri || '';
                document.getElementById('scopes').value = config.scopes?.join(', ') || 'openid, email, profile';
                document.getElementById('auto_create_users').checked = config.auto_create_users || false;
            }

            async handleSubmit(e) {
                e.preventDefault();
                
                this.saveBtn.disabled = true;
                this.saveBtn.textContent = 'Salvando...';

                try {
                    const formData = new FormData(this.form);
                    const config = {
                        enabled: formData.get('enabled') === 'on',
                        provider_name: formData.get('provider_name'),
                        issuer_url: formData.get('issuer_url'),
                        client_id: formData.get('client_id'),
                        client_secret: formData.get('client_secret'),
                        redirect_uri: formData.get('redirect_uri'),
                        scopes: formData.get('scopes').split(',').map(s => s.trim()).filter(Boolean),
                        auto_create_users: formData.get('auto_create_users') === 'on',
                    };

                    await oidcClient.setOIDCConfig(this.tenantId, config);
                    this.showAlert('Configuração salva com sucesso!', 'success');
                } catch (error) {
                    this.showAlert('Erro ao salvar: ' + error.message, 'error');
                } finally {
                    this.saveBtn.disabled = false;
                    this.saveBtn.textContent = 'Salvar Configuração';
                }
            }

            showAlert(message, type) {
                this.alertContainer.innerHTML = `
                    <div class="alert alert-${type}">
                        ${message}
                    </div>
                `;
                
                if (type === 'success') {
                    setTimeout(() => {
                        this.alertContainer.innerHTML = '';
                    }, 3000);
                }
            }
        }

        // Inicializar quando a página carregar
        document.addEventListener('DOMContentLoaded', () => {
            new OIDCConfigForm();
        });
    </script>
</body>
</html>
```

## Integração com Vue.js

### Composable para OIDC

```javascript
// composables/useOIDC.js
import { ref, reactive } from 'vue';

export function useOIDC() {
  const loading = ref(false);
  const error = ref(null);
  const config = reactive({
    enabled: false,
    provider_name: '',
    issuer_url: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    scopes: ['openid', 'email', 'profile'],
    auto_create_users: false,
  });

  const apiCall = async (url, options = {}) => {
    const token = localStorage.getItem('auth_token');
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
      credentials: 'include',
      ...options,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${await response.text()}`);
    }

    return response.json();
  };

  const getOIDCConfig = async (tenantId) => {
    loading.value = true;
    error.value = null;

    try {
      const data = await apiCall(`/api/tenants/${tenantId}/oidc/config`);
      Object.assign(config, data);
      return data;
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const setOIDCConfig = async (tenantId) => {
    loading.value = true;
    error.value = null;

    try {
      await apiCall(`/api/tenants/${tenantId}/oidc/config`, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
    } catch (err) {
      error.value = err.message;
      throw err;
    } finally {
      loading.value = false;
    }
  };

  const initiateLogin = (tenantId, returnUrl = window.location.href) => {
    const url = `/auth/oidc/login/${tenantId}?return_url=${encodeURIComponent(returnUrl)}`;
    window.location.href = url;
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    window.location.href = '/login';
  };

  const isAuthenticated = () => {
    const token = localStorage.getItem('auth_token');
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    return !!(token || cookie);
  };

  return {
    loading,
    error,
    config,
    getOIDCConfig,
    setOIDCConfig,
    initiateLogin,
    logout,
    isAuthenticated,
  };
}
```

### Componente Vue de Configuração

```vue
<!-- components/OIDCConfig.vue -->
<template>
  <div class="oidc-config">
    <h2>Configuração OIDC</h2>
    
    <div v-if="error" class="alert alert-error">
      {{ error }}
    </div>
    
    <div v-if="successMessage" class="alert alert-success">
      {{ successMessage }}
    </div>

    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label>
          <input 
            type="checkbox" 
            v-model="config.enabled"
            @change="toggleFields"
          >
          Habilitar OIDC
        </label>
      </div>

      <div v-show="config.enabled" class="oidc-fields">
        <div class="form-group">
          <label>Nome do Provedor:</label>
          <input 
            type="text" 
            v-model="config.provider_name"
            placeholder="Ex: Google, Azure AD, Keycloak"
          >
        </div>

        <div class="form-group">
          <label>Issuer URL *:</label>
          <input 
            type="url" 
            v-model="config.issuer_url"
            required
            placeholder="https://accounts.google.com"
          >
        </div>

        <div class="form-group">
          <label>Client ID *:</label>
          <input 
            type="text" 
            v-model="config.client_id"
            required
          >
        </div>

        <div class="form-group">
          <label>Client Secret *:</label>
          <input 
            type="password" 
            v-model="config.client_secret"
            required
          >
        </div>

        <div class="form-group">
          <label>Redirect URI:</label>
          <input 
            type="url" 
            v-model="config.redirect_uri"
            placeholder="https://seu-dominio.com/auth/oidc/callback"
          >
        </div>

        <div class="form-group">
          <label>Scopes:</label>
          <input 
            type="text" 
            :value="config.scopes.join(', ')"
            @input="updateScopes"
            placeholder="openid, email, profile"
          >
          <small>Separados por vírgula</small>
        </div>

        <div class="form-group">
          <label>
            <input 
              type="checkbox" 
              v-model="config.auto_create_users"
            >
            Criar usuários automaticamente
          </label>
        </div>
      </div>

      <div class="form-actions">
        <button type="submit" :disabled="loading">
          {{ loading ? 'Salvando...' : 'Salvar Configuração' }}
        </button>
        <button type="button" @click="loadConfig">
          Cancelar
        </button>
      </div>
    </form>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useOIDC } from '../composables/useOIDC';

export default {
  name: 'OIDCConfig',
  props: {
    tenantId: {
      type: String,
      required: true,
    },
  },
  setup(props) {
    const { loading, error, config, getOIDCConfig, setOIDCConfig } = useOIDC();
    const successMessage = ref('');

    const loadConfig = async () => {
      try {
        await getOIDCConfig(props.tenantId);
      } catch (err) {
        console.error('Erro ao carregar configuração:', err);
      }
    };

    const handleSubmit = async () => {
      successMessage.value = '';
      
      try {
        await setOIDCConfig(props.tenantId);
        successMessage.value = 'Configuração salva com sucesso!';
        
        setTimeout(() => {
          successMessage.value = '';
        }, 3000);
      } catch (err) {
        console.error('Erro ao salvar configuração:', err);
      }
    };

    const updateScopes = (event) => {
      config.scopes = event.target.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
    };

    const toggleFields = () => {
      // Campo habilitado via v-model
    };

    onMounted(loadConfig);

    return {
      loading,
      error,
      config,
      successMessage,
      loadConfig,
      handleSubmit,
      updateScopes,
      toggleFields,
    };
  },
};
</script>

<style scoped>
.oidc-config {
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

.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  box-sizing: border-box;
}

.form-actions {
  margin-top: 20px;
}

.form-actions button {
  margin-right: 10px;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.form-actions button[type="submit"] {
  background-color: #007bff;
  color: white;
}

.form-actions button[type="button"] {
  background-color: #6c757d;
  color: white;
}

.alert {
  padding: 12px;
  margin-bottom: 20px;
  border-radius: 4px;
}

.alert-success {
  background-color: #d4edda;
  color: #155724;
  border: 1px solid #c3e6cb;
}

.alert-error {
  background-color: #f8d7da;
  color: #721c24;
  border: 1px solid #f5c6cb;
}

.oidc-fields {
  border-left: 3px solid #007bff;
  padding-left: 15px;
  margin-left: 10px;
}
</style>
```

## Integração com Angular

### Serviço Angular

```typescript
// services/oidc.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

export interface OIDCConfig {
  enabled: boolean;
  provider_name?: string;
  issuer_url?: string;
  client_id?: string;
  client_secret?: string;
  redirect_uri?: string;
  scopes?: string[];
  auto_create_users?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class OIDCService {
  private baseURL = 'http://localhost:8080';
  private authSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  public isAuthenticated$ = this.authSubject.asObservable();

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    let headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }

    return headers;
  }

  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    if (error.status === 401) {
      this.logout();
    }
    
    return throwError(error);
  }

  getOIDCConfig(tenantId: string): Observable<OIDCConfig> {
    return this.http.get<OIDCConfig>(
      `${this.baseURL}/api/tenants/${tenantId}/oidc/config`,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => {
        if (error.status === 404) {
          return [{ enabled: false }];
        }
        return this.handleError(error);
      })
    );
  }

  setOIDCConfig(tenantId: string, config: OIDCConfig): Observable<void> {
    return this.http.put<void>(
      `${this.baseURL}/api/tenants/${tenantId}/oidc/config`,
      config,
      { headers: this.getHeaders() }
    ).pipe(
      catchError(error => this.handleError(error))
    );
  }

  initiateLogin(tenantId: string, returnUrl?: string): void {
    const url = returnUrl || window.location.href;
    window.location.href = `/auth/oidc/login/${tenantId}?return_url=${encodeURIComponent(url)}`;
  }

  logout(): void {
    localStorage.removeItem('auth_token');
    document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    this.authSubject.next(false);
    window.location.href = '/login';
  }

  isAuthenticated(): boolean {
    const token = localStorage.getItem('auth_token');
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('auth_token='));
    return !!(token || cookie);
  }

  checkAuthStatus(): void {
    this.authSubject.next(this.isAuthenticated());
  }
}
```

### Componente Angular

```typescript
// components/oidc-config/oidc-config.component.ts
import { Component, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { OIDCService, OIDCConfig } from '../../services/oidc.service';

@Component({
  selector: 'app-oidc-config',
  templateUrl: './oidc-config.component.html',
  styleUrls: ['./oidc-config.component.css']
})
export class OIDCConfigComponent implements OnInit {
  @Input() tenantId!: string;
  
  configForm: FormGroup;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor(
    private fb: FormBuilder,
    private oidcService: OIDCService
  ) {
    this.configForm = this.createForm();
  }

  ngOnInit(): void {
    if (this.tenantId) {
      this.loadConfig();
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      enabled: [false],
      provider_name: [''],
      issuer_url: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      client_id: [''],
      client_secret: [''],
      redirect_uri: ['', [Validators.pattern(/^https?:\/\/.+/)]],
      scopes: ['openid, email, profile'],
      auto_create_users: [false]
    });
  }

  get isEnabled(): boolean {
    return this.configForm.get('enabled')?.value || false;
  }

  private loadConfig(): void {
    this.loading = true;
    this.error = null;

    this.oidcService.getOIDCConfig(this.tenantId).subscribe({
      next: (config: OIDCConfig) => {
        this.configForm.patchValue({
          ...config,
          scopes: config.scopes?.join(', ') || 'openid, email, profile'
        });
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Erro ao carregar configuração: ' + error.message;
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.configForm.valid) {
      this.loading = true;
      this.error = null;
      this.successMessage = null;

      const formValue = this.configForm.value;
      const config: OIDCConfig = {
        ...formValue,
        scopes: formValue.scopes
          .split(',')
          .map((s: string) => s.trim())
          .filter((s: string) => s)
      };

      this.oidcService.setOIDCConfig(this.tenantId, config).subscribe({
        next: () => {
          this.successMessage = 'Configuração salva com sucesso!';
          this.loading = false;
          
          setTimeout(() => {
            this.successMessage = null;
          }, 3000);
        },
        error: (error) => {
          this.error = 'Erro ao salvar configuração: ' + error.message;
          this.loading = false;
        }
      });
    }
  }

  onCancel(): void {
    this.loadConfig();
  }
}
```

```html
<!-- components/oidc-config/oidc-config.component.html -->
<div class="oidc-config">
  <h2>Configuração OIDC</h2>
  
  <div *ngIf="error" class="alert alert-error">
    {{ error }}
  </div>
  
  <div *ngIf="successMessage" class="alert alert-success">
    {{ successMessage }}
  </div>

  <form [formGroup]="configForm" (ngSubmit)="onSubmit()">
    <div class="form-group">
      <label>
        <input type="checkbox" formControlName="enabled">
        Habilitar OIDC
      </label>
    </div>

    <div *ngIf="isEnabled" class="oidc-fields">
      <div class="form-group">
        <label for="provider_name">Nome do Provedor:</label>
        <input 
          type="text" 
          id="provider_name"
          formControlName="provider_name"
          placeholder="Ex: Google, Azure AD, Keycloak"
        >
      </div>

      <div class="form-group">
        <label for="issuer_url">Issuer URL *:</label>
        <input 
          type="url" 
          id="issuer_url"
          formControlName="issuer_url"
          placeholder="https://accounts.google.com"
        >
        <div *ngIf="configForm.get('issuer_url')?.invalid && configForm.get('issuer_url')?.touched" 
             class="error-message">
          URL deve começar com http:// ou https://
        </div>
      </div>

      <div class="form-group">
        <label for="client_id">Client ID *:</label>
        <input 
          type="text" 
          id="client_id"
          formControlName="client_id"
        >
      </div>

      <div class="form-group">
        <label for="client_secret">Client Secret *:</label>
        <input 
          type="password" 
          id="client_secret"
          formControlName="client_secret"
        >
      </div>

      <div class="form-group">
        <label for="redirect_uri">Redirect URI:</label>
        <input 
          type="url" 
          id="redirect_uri"
          formControlName="redirect_uri"
          placeholder="https://seu-dominio.com/auth/oidc/callback"
        >
      </div>

      <div class="form-group">
        <label for="scopes">Scopes:</label>
        <input 
          type="text" 
          id="scopes"
          formControlName="scopes"
          placeholder="openid, email, profile"
        >
        <small>Separados por vírgula</small>
      </div>

      <div class="form-group">
        <label>
          <input type="checkbox" formControlName="auto_create_users">
          Criar usuários automaticamente
        </label>
      </div>
    </div>

    <div class="form-actions">
      <button type="submit" [disabled]="loading || configForm.invalid">
        {{ loading ? 'Salvando...' : 'Salvar Configuração' }}
      </button>
      <button type="button" (click)="onCancel()">
        Cancelar
      </button>
    </div>
  </form>
</div>
```

## Cache e Performance

### Sistema de Cache para Configurações

```typescript
// utils/cache.ts
class ConfigCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutos

  set(key: string, data: any, ttl = this.defaultTTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get(key: string): any | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    const isExpired = Date.now() - item.timestamp > item.ttl;
    
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  invalidate(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Invalidação por padrão
  invalidatePattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }
}

export const configCache = new ConfigCache();
```

### Serviço com Cache

```typescript
// services/cached-oidc.service.ts
import { OIDCService } from './oidc.service';
import { configCache } from '../utils/cache';

export class CachedOIDCService extends OIDCService {
  static async getOIDCConfig(tenantId: string, useCache = true): Promise<OIDCConfig> {
    const cacheKey = `oidc_config_${tenantId}`;
    
    if (useCache) {
      const cached = configCache.get(cacheKey);
      if (cached) {
        return cached;
      }
    }

    try {
      const config = await super.getOIDCConfig(tenantId);
      configCache.set(cacheKey, config);
      return config;
    } catch (error) {
      throw error;
    }
  }

  static async setOIDCConfig(tenantId: string, config: OIDCConfig): Promise<void> {
    await super.setOIDCConfig(tenantId, config);
    
    // Invalidar cache após atualização
    const cacheKey = `oidc_config_${tenantId}`;
    configCache.invalidate(cacheKey);
  }

  static clearCache(tenantId?: string): void {
    if (tenantId) {
      configCache.invalidate(`oidc_config_${tenantId}`);
    } else {
      configCache.invalidatePattern('oidc_config_.*');
    }
  }
}
```

## Webhooks e Eventos

### Sistema de Eventos para OIDC

```typescript
// utils/events.ts
type EventCallback = (...args: any[]) => void;

class EventEmitter {
  private events = new Map<string, EventCallback[]>();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    this.events.get(event)!.push(callback);
  }

  off(event: string, callback: EventCallback): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  emit(event: string, ...args: any[]): void {
    const callbacks = this.events.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(...args));
    }
  }
}

export const oidcEvents = new EventEmitter();

// Eventos disponíveis
export const OIDC_EVENTS = {
  LOGIN_INITIATED: 'oidc:login:initiated',
  LOGIN_SUCCESS: 'oidc:login:success',
  LOGIN_ERROR: 'oidc:login:error',
  LOGOUT: 'oidc:logout',
  CONFIG_UPDATED: 'oidc:config:updated',
  CONFIG_ERROR: 'oidc:config:error',
} as const;
```

### Serviço com Eventos

```typescript
// services/event-oidc.service.ts
import { OIDCService } from './oidc.service';
import { oidcEvents, OIDC_EVENTS } from '../utils/events';

export class EventOIDCService extends OIDCService {
  static initiateLogin(params: OIDCLoginParams): void {
    oidcEvents.emit(OIDC_EVENTS.LOGIN_INITIATED, params);
    super.initiateLogin(params);
  }

  static async setOIDCConfig(tenantId: string, config: OIDCConfig): Promise<void> {
    try {
      await super.setOIDCConfig(tenantId, config);
      oidcEvents.emit(OIDC_EVENTS.CONFIG_UPDATED, { tenantId, config });
    } catch (error) {
      oidcEvents.emit(OIDC_EVENTS.CONFIG_ERROR, { tenantId, error });
      throw error;
    }
  }

  static logout(): void {
    oidcEvents.emit(OIDC_EVENTS.LOGOUT);
    super.logout();
  }
}

// Exemplo de uso dos eventos
oidcEvents.on(OIDC_EVENTS.LOGIN_INITIATED, (params) => {
  console.log('Login iniciado para tenant:', params.tenant_id);
  // Analytics, logs, etc.
});

oidcEvents.on(OIDC_EVENTS.CONFIG_UPDATED, ({ tenantId, config }) => {
  console.log('Configuração atualizada para tenant:', tenantId);
  // Notificações, sincronização, etc.
});
```

## Configuração Avançada

### Validação de Configuração

```typescript
// utils/validation.ts
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export class OIDCConfigValidator {
  static validate(config: OIDCConfig): ValidationResult {
    const errors: string[] = [];

    if (config.enabled) {
      // Validações obrigatórias quando habilitado
      if (!config.issuer_url) {
        errors.push('Issuer URL é obrigatório quando OIDC está habilitado');
      } else if (!this.isValidURL(config.issuer_url)) {
        errors.push('Issuer URL deve ser uma URL válida');
      }

      if (!config.client_id) {
        errors.push('Client ID é obrigatório quando OIDC está habilitado');
      }

      if (!config.client_secret) {
        errors.push('Client Secret é obrigatório quando OIDC está habilitado');
      }

      // Validar redirect URI se fornecida
      if (config.redirect_uri && !this.isValidURL(config.redirect_uri)) {
        errors.push('Redirect URI deve ser uma URL válida');
      }

      // Validar scopes
      if (!config.scopes || config.scopes.length === 0) {
        errors.push('Pelo menos um scope deve ser definido');
      } else if (!config.scopes.includes('openid')) {
        errors.push('O scope "openid" é obrigatório para OIDC');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  private static isValidURL(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  static async validateIssuer(issuerUrl: string): Promise<ValidationResult> {
    const errors: string[] = [];

    try {
      const response = await fetch(`${issuerUrl}/.well-known/openid-configuration`);
      
      if (!response.ok) {
        errors.push('Não foi possível acessar a configuração do provedor OIDC');
      } else {
        const config = await response.json();
        
        if (!config.issuer) {
          errors.push('Configuração do provedor inválida: issuer não encontrado');
        }
        
        if (!config.authorization_endpoint) {
          errors.push('Configuração do provedor inválida: authorization_endpoint não encontrado');
        }
        
        if (!config.token_endpoint) {
          errors.push('Configuração do provedor inválida: token_endpoint não encontrado');
        }
      }
    } catch (error) {
      errors.push('Erro ao validar provedor OIDC: ' + error.message);
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}
```

### Configuração de Ambiente

```typescript
// config/environment.ts
interface Environment {
  apiUrl: string;
  debug: boolean;
  cacheEnabled: boolean;
  cacheTTL: number;
  retryAttempts: number;
  timeout: number;
}

const environments: Record<string, Environment> = {
  development: {
    apiUrl: 'http://localhost:8080',
    debug: true,
    cacheEnabled: false,
    cacheTTL: 60000, // 1 minuto
    retryAttempts: 3,
    timeout: 10000,
  },
  staging: {
    apiUrl: 'https://api-staging.veloflux.io',
    debug: true,
    cacheEnabled: true,
    cacheTTL: 300000, // 5 minutos
    retryAttempts: 3,
    timeout: 15000,
  },
  production: {
    apiUrl: 'https://api.veloflux.io',
    debug: false,
    cacheEnabled: true,
    cacheTTL: 900000, // 15 minutos
    retryAttempts: 5,
    timeout: 20000,
  },
};

export const environment = environments[process.env.NODE_ENV || 'development'];
```

## Troubleshooting

### Debug e Logging

```typescript
// utils/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

class Logger {
  private level: LogLevel;

  constructor(level: LogLevel = LogLevel.INFO) {
    this.level = level;
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    if (level >= this.level) {
      const timestamp = new Date().toISOString();
      const levelName = LogLevel[level];
      console.log(`[${timestamp}] ${levelName}: ${message}`, ...args);
    }
  }

  debug(message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const logger = new Logger(
  process.env.NODE_ENV === 'production' ? LogLevel.ERROR : LogLevel.DEBUG
);
```

### Diagnóstico de Problemas

```typescript
// utils/diagnostics.ts
export class OIDCDiagnostics {
  static async runDiagnostics(tenantId: string): Promise<DiagnosticReport> {
    const report: DiagnosticReport = {
      tenantId,
      timestamp: new Date().toISOString(),
      checks: [],
    };

    // Verificar se está autenticado
    report.checks.push({
      name: 'Authentication Status',
      status: OIDCService.isAuthenticated() ? 'PASS' : 'FAIL',
      message: OIDCService.isAuthenticated() ? 'Usuário autenticado' : 'Usuário não autenticado',
    });

    // Verificar configuração OIDC
    try {
      const config = await OIDCService.getOIDCConfig(tenantId);
      report.checks.push({
        name: 'OIDC Configuration',
        status: config.enabled ? 'PASS' : 'WARN',
        message: config.enabled ? 'OIDC está habilitado' : 'OIDC está desabilitado',
        details: config,
      });

      if (config.enabled) {
        // Validar configuração
        const validation = OIDCConfigValidator.validate(config);
        report.checks.push({
          name: 'Configuration Validation',
          status: validation.isValid ? 'PASS' : 'FAIL',
          message: validation.isValid ? 'Configuração válida' : 'Configuração inválida',
          details: validation.errors,
        });

        // Validar provedor
        if (config.issuer_url) {
          try {
            const providerValidation = await OIDCConfigValidator.validateIssuer(config.issuer_url);
            report.checks.push({
              name: 'Provider Validation',
              status: providerValidation.isValid ? 'PASS' : 'FAIL',
              message: providerValidation.isValid ? 'Provedor acessível' : 'Provedor inacessível',
              details: providerValidation.errors,
            });
          } catch (error) {
            report.checks.push({
              name: 'Provider Validation',
              status: 'ERROR',
              message: 'Erro ao validar provedor: ' + error.message,
            });
          }
        }
      }
    } catch (error) {
      report.checks.push({
        name: 'OIDC Configuration',
        status: 'ERROR',
        message: 'Erro ao obter configuração: ' + error.message,
      });
    }

    // Verificar conectividade com API
    try {
      const response = await fetch('/api/health');
      report.checks.push({
        name: 'API Connectivity',
        status: response.ok ? 'PASS' : 'FAIL',
        message: response.ok ? 'API acessível' : `API retornou status ${response.status}`,
      });
    } catch (error) {
      report.checks.push({
        name: 'API Connectivity',
        status: 'ERROR',
        message: 'Erro de conectividade: ' + error.message,
      });
    }

    return report;
  }
}

interface DiagnosticReport {
  tenantId: string;
  timestamp: string;
  checks: DiagnosticCheck[];
}

interface DiagnosticCheck {
  name: string;
  status: 'PASS' | 'FAIL' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
}
```

Este documento fornece exemplos práticos e avançados para integração da API OIDC em diferentes frameworks e cenários, oferecendo soluções robustas para autenticação e configuração multi-tenant.
