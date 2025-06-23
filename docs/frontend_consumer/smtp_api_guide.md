# Guia de Consumo da API SMTP - Frontend

Este documento fornece instruções completas sobre como consumir a API SMTP do VeloFlux no frontend.

## Visão Geral

A API SMTP permite que tenants configurem e gerenciem suas configurações de email SMTP, incluindo:
- Obter configurações SMTP atuais
- Atualizar configurações SMTP
- Testar configurações SMTP enviando um email de teste

## Endpoints Disponíveis

### 1. Obter Configurações SMTP

**Endpoint:** `GET /api/tenant/{tenant_id}/smtp-settings`

**Autenticação:** Requerida (Bearer Token)

**Autorização:** O usuário deve pertencer ao tenant ou ser admin

#### Exemplo de Request

```javascript
const getSMTPSettings = async (tenantId) => {
  try {
    const response = await fetch(`/api/tenant/${tenantId}/smtp-settings`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao obter configurações SMTP:', error);
    throw error;
  }
};
```

#### Exemplo de Response

```json
{
  "enabled": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "noreply@example.com",
  "password": "********",
  "from_email": "noreply@example.com",
  "from_name": "VeloFlux",
  "use_tls": true,
  "app_domain": "https://app.example.com"
}
```

### 2. Atualizar Configurações SMTP

**Endpoint:** `PUT /api/tenant/{tenant_id}/smtp-settings`

**Autenticação:** Requerida (Bearer Token)

**Autorização:** O usuário deve pertencer ao tenant ou ser admin

#### Exemplo de Request

```javascript
const updateSMTPSettings = async (tenantId, settings) => {
  try {
    const response = await fetch(`/api/tenant/${tenantId}/smtp-settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao atualizar configurações SMTP:', error);
    throw error;
  }
};
```

#### Payload de Exemplo

```json
{
  "enabled": true,
  "host": "smtp.gmail.com",
  "port": 587,
  "username": "noreply@example.com",
  "password": "your-app-password",
  "from_email": "noreply@example.com",
  "from_name": "VeloFlux",
  "use_tls": true,
  "app_domain": "https://app.example.com"
}
```

#### Response de Sucesso

```json
{
  "status": "success",
  "message": "SMTP settings updated successfully"
}
```

### 3. Testar Configurações SMTP

**Endpoint:** `POST /api/tenant/{tenant_id}/smtp-test`

**Autenticação:** Requerida (Bearer Token)

**Autorização:** O usuário deve pertencer ao tenant ou ser admin

#### Exemplo de Request

```javascript
const testSMTPSettings = async (tenantId, email, config) => {
  try {
    const response = await fetch(`/api/tenant/${tenantId}/smtp-test`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: email,
        config: config
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Erro ao testar configurações SMTP:', error);
    throw error;
  }
};
```

#### Payload de Exemplo

```json
{
  "email": "test@example.com",
  "config": {
    "enabled": true,
    "host": "smtp.gmail.com",
    "port": 587,
    "username": "noreply@example.com",
    "password": "your-app-password",
    "from_email": "noreply@example.com",
    "from_name": "VeloFlux",
    "use_tls": true,
    "app_domain": "https://app.example.com"
  }
}
```

#### Response de Sucesso

```json
{
  "status": "success",
  "message": "Test email sent successfully"
}
```

## Tratamento de Erros

### Códigos de Status HTTP

- `200 OK`: Operação realizada com sucesso
- `400 Bad Request`: Dados inválidos ou incompletos
- `401 Unauthorized`: Token de autenticação inválido ou ausente
- `403 Forbidden`: Usuário não tem permissão para acessar o tenant
- `500 Internal Server Error`: Erro interno do servidor

### Exemplos de Erros

#### Configurações SMTP Incompletas

```json
{
  "error": "SMTP settings are incomplete"
}
```

#### Email Obrigatório para Teste

```json
{
  "error": "Email is required"
}
```

#### Falha ao Enviar Email de Teste

```json
{
  "error": "Failed to send test email: smtp: authentication failed"
}
```

## Componente React de Exemplo

```jsx
import React, { useState, useEffect } from 'react';

const SMTPSettings = ({ tenantId, authToken }) => {
  const [settings, setSettings] = useState({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: '',
    use_tls: true,
    app_domain: ''
  });
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [message, setMessage] = useState('');

  // Carregar configurações ao montar o componente
  useEffect(() => {
    loadSettings();
  }, [tenantId]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenant/${tenantId}/smtp-settings`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      setMessage('Erro ao carregar configurações SMTP');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/tenant/${tenantId}/smtp-settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (response.ok) {
        setMessage('Configurações SMTP atualizadas com sucesso!');
      } else {
        throw new Error('Falha ao atualizar configurações');
      }
    } catch (error) {
      setMessage('Erro ao atualizar configurações SMTP');
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    if (!testEmail) {
      setMessage('Por favor, insira um email para teste');
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(`/api/tenant/${tenantId}/smtp-test`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: testEmail,
          config: settings
        })
      });

      if (response.ok) {
        setMessage('Email de teste enviado com sucesso!');
      } else {
        const errorData = await response.text();
        throw new Error(errorData);
      }
    } catch (error) {
      setMessage(`Erro ao enviar email de teste: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="smtp-settings">
      <h2>Configurações SMTP</h2>
      
      {message && (
        <div className={`alert ${message.includes('sucesso') ? 'success' : 'error'}`}>
          {message}
        </div>
      )}

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => handleInputChange('enabled', e.target.checked)}
            />
            Habilitar SMTP
          </label>
        </div>

        {settings.enabled && (
          <>
            <div className="form-group">
              <label>Host SMTP:</label>
              <input
                type="text"
                value={settings.host}
                onChange={(e) => handleInputChange('host', e.target.value)}
                placeholder="smtp.gmail.com"
              />
            </div>

            <div className="form-group">
              <label>Porta:</label>
              <input
                type="number"
                value={settings.port}
                onChange={(e) => handleInputChange('port', parseInt(e.target.value))}
                placeholder="587"
              />
            </div>

            <div className="form-group">
              <label>Usuário:</label>
              <input
                type="text"
                value={settings.username}
                onChange={(e) => handleInputChange('username', e.target.value)}
                placeholder="seu-email@gmail.com"
              />
            </div>

            <div className="form-group">
              <label>Senha:</label>
              <input
                type="password"
                value={settings.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
                placeholder="sua-senha-ou-app-password"
              />
            </div>

            <div className="form-group">
              <label>Email Remetente:</label>
              <input
                type="email"
                value={settings.from_email}
                onChange={(e) => handleInputChange('from_email', e.target.value)}
                placeholder="noreply@example.com"
              />
            </div>

            <div className="form-group">
              <label>Nome Remetente:</label>
              <input
                type="text"
                value={settings.from_name}
                onChange={(e) => handleInputChange('from_name', e.target.value)}
                placeholder="VeloFlux"
              />
            </div>

            <div className="form-group">
              <label>Domínio da Aplicação:</label>
              <input
                type="url"
                value={settings.app_domain}
                onChange={(e) => handleInputChange('app_domain', e.target.value)}
                placeholder="https://app.example.com"
              />
            </div>

            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.use_tls}
                  onChange={(e) => handleInputChange('use_tls', e.target.checked)}
                />
                Usar TLS
              </label>
            </div>
          </>
        )}

        <div className="form-actions">
          <button 
            type="button" 
            onClick={handleSave}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </div>
      </form>

      {settings.enabled && (
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
          >
            {loading ? 'Enviando...' : 'Enviar Email de Teste'}
          </button>
        </div>
      )}
    </div>
  );
};

export default SMTPSettings;
```

## Validações Importantes

### No Frontend

1. **Campos Obrigatórios quando SMTP está habilitado:**
   - Host
   - Port (deve ser > 0)
   - Username
   - From Email

2. **Validações de Formato:**
   - Email válido para `from_email`
   - URL válida para `app_domain`
   - Porta deve ser um número entre 1 e 65535

3. **Segurança:**
   - Sempre enviar o token de autenticação
   - Não exibir senhas em logs
   - Validar resposta do servidor antes de processar

### Exemplo de Validação

```javascript
const validateSMTPSettings = (settings) => {
  const errors = [];

  if (settings.enabled) {
    if (!settings.host) errors.push('Host é obrigatório');
    if (!settings.port || settings.port <= 0) errors.push('Porta deve ser maior que 0');
    if (!settings.username) errors.push('Usuário é obrigatório');
    if (!settings.from_email) errors.push('Email remetente é obrigatório');
    
    // Validar formato do email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (settings.from_email && !emailRegex.test(settings.from_email)) {
      errors.push('Email remetente deve ter formato válido');
    }
    
    // Validar URL do domínio
    if (settings.app_domain) {
      try {
        new URL(settings.app_domain);
      } catch {
        errors.push('Domínio da aplicação deve ser uma URL válida');
      }
    }
  }

  return errors;
};
```

## Considerações de Segurança

1. **Tokens de Autenticação:**
   - Sempre incluir o token Bearer nas requisições
   - Renovar tokens quando necessário
   - Tratar erros 401 redirecionando para login

2. **Senhas:**
   - Nunca logar senhas SMTP
   - Mascarar senhas na interface (mostrar *******)
   - Permitir que usuários deixem senha em branco para manter a existente

3. **Validação:**
   - Sempre validar dados no frontend antes de enviar
   - Tratar todas as respostas de erro do servidor
   - Não confiar apenas na validação do frontend

## Provedores SMTP Comuns

### Gmail
- Host: `smtp.gmail.com`
- Porta: `587` (TLS) ou `465` (SSL)
- Requer App Password se 2FA estiver habilitado

### Outlook/Hotmail
- Host: `smtp-mail.outlook.com`
- Porta: `587`

### SendGrid
- Host: `smtp.sendgrid.net`
- Porta: `587`

### Mailgun
- Host: `smtp.mailgun.org`
- Porta: `587`

## Próximos Passos

- Implementar histórico de emails enviados
- Adicionar templates de email customizáveis
- Implementar métricas de entrega
- Adicionar suporte a anexos
