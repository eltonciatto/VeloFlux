# WAF e Rate Limiting - Tenant API

Este documento detalha como gerenciar configurações de WAF (Web Application Firewall) e Rate Limiting para tenants.

## 🛡️ Endpoints de WAF

### 1. Obter Configuração WAF do Tenant
Retorna as configurações atuais do WAF para um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/waf/config`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function getTenantWAFConfig(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/waf/config`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter configuração WAF: ${response.status}`);
    }

    const wafConfig = await response.json();
    return wafConfig;
  } catch (error) {
    console.error('Erro ao obter configuração WAF:', error);
    throw error;
  }
}

// Resposta esperada
{
  "enabled": true,
  "level": "medium",
  "rules": {
    "sql_injection": true,
    "xss_protection": true,
    "rate_limiting": true,
    "ip_filtering": false,
    "geo_blocking": false
  },
  "custom_rules": [
    {
      "id": "custom_1",
      "name": "Block specific user agents",
      "pattern": "BadBot|MaliciousCrawler",
      "action": "block",
      "enabled": true
    }
  ],
  "whitelist_ips": [
    "192.168.1.0/24",
    "10.0.0.0/8"
  ],
  "blacklist_ips": [
    "1.2.3.4",
    "5.6.7.0/24"
  ]
}
```

### 2. Atualizar Configuração WAF
Atualiza as configurações do WAF para um tenant específico.

**Endpoint:** `PUT /api/tenants/{tenant_id}/waf/config`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function updateTenantWAFConfig(tenantId, wafConfig) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/waf/config`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(wafConfig)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar configuração WAF: ${response.status}`);
    }

    const updatedConfig = await response.json();
    return updatedConfig;
  } catch (error) {
    console.error('Erro ao atualizar configuração WAF:', error);
    throw error;
  }
}

// Payload de requisição
{
  "enabled": true,
  "level": "strict",
  "rules": {
    "sql_injection": true,
    "xss_protection": true,
    "rate_limiting": true,
    "ip_filtering": true,
    "geo_blocking": true
  },
  "whitelist_ips": [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "172.16.0.0/16"
  ],
  "blocked_countries": ["CN", "RU"],
  "allowed_countries": ["BR", "US", "CA"]
}

// Resposta esperada
{
  "enabled": true,
  "level": "strict",
  "rules": {
    "sql_injection": true,
    "xss_protection": true,
    "rate_limiting": true,
    "ip_filtering": true,
    "geo_blocking": true
  },
  "whitelist_ips": [
    "192.168.1.0/24",
    "10.0.0.0/8",
    "172.16.0.0/16"
  ],
  "blocked_countries": ["CN", "RU"],
  "allowed_countries": ["BR", "US", "CA"],
  "updated_at": "2024-06-23T16:30:00Z"
}
```

## ⏱️ Endpoints de Rate Limiting

### 3. Obter Configuração Rate Limit do Tenant
Retorna as configurações atuais de rate limiting para um tenant específico.

**Endpoint:** `GET /api/tenants/{tenant_id}/rate-limit`  
**Autenticação:** Token requerido (Membro do tenant)

```javascript
// Exemplo de implementação
async function getTenantRateLimit(tenantId) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/rate-limit`, {
      method: 'GET',
      headers: auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter configuração rate limit: ${response.status}`);
    }

    const rateLimitConfig = await response.json();
    return rateLimitConfig;
  } catch (error) {
    console.error('Erro ao obter configuração rate limit:', error);
    throw error;
  }
}

// Resposta esperada
{
  "requests_per_second": 100,
  "burst_size": 200,
  "window_size": "1m",
  "per_ip_limit": {
    "enabled": true,
    "requests_per_second": 10,
    "burst_size": 20
  },
  "per_user_limit": {
    "enabled": false,
    "requests_per_second": 50,
    "burst_size": 100
  },
  "exclusions": {
    "paths": ["/health", "/metrics"],
    "ips": ["192.168.1.100"],
    "user_agents": ["Monitor/1.0"]
  }
}
```

### 4. Atualizar Configuração Rate Limit
Atualiza as configurações de rate limiting para um tenant específico.

**Endpoint:** `PUT /api/tenants/{tenant_id}/rate-limit`  
**Autenticação:** Token requerido (Admin ou Owner do tenant)

```javascript
// Exemplo de implementação
async function updateTenantRateLimit(tenantId, rateLimitConfig) {
  const auth = new AuthManager();
  
  try {
    const response = await fetch(`${API_BASE_URL}/api/tenants/${tenantId}/rate-limit`, {
      method: 'PUT',
      headers: auth.getAuthHeaders(),
      body: JSON.stringify(rateLimitConfig)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar configuração rate limit: ${response.status}`);
    }

    const updatedConfig = await response.json();
    return updatedConfig;
  } catch (error) {
    console.error('Erro ao atualizar configuração rate limit:', error);
    throw error;
  }
}

// Payload de requisição
{
  "requests_per_second": 150,
  "burst_size": 300,
  "per_ip_limit": {
    "enabled": true,
    "requests_per_second": 15,
    "burst_size": 30
  },
  "per_user_limit": {
    "enabled": true,
    "requests_per_second": 75,
    "burst_size": 150
  }
}

// Resposta esperada
{
  "requests_per_second": 150,
  "burst_size": 300,
  "window_size": "1m",
  "per_ip_limit": {
    "enabled": true,
    "requests_per_second": 15,
    "burst_size": 30
  },
  "per_user_limit": {
    "enabled": true,
    "requests_per_second": 75,
    "burst_size": 150
  },
  "updated_at": "2024-06-23T16:35:00Z"
}
```

## 🔧 Classe TenantSecurityManager

```javascript
class TenantSecurityManager {
  constructor(authManager) {
    this.auth = authManager;
    this.baseUrl = authManager.baseUrl;
  }

  // WAF Configuration
  async getWAFConfig(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/waf/config`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter configuração WAF: ${response.status}`);
    }

    return await response.json();
  }

  async updateWAFConfig(tenantId, config) {
    this.validateWAFConfig(config);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/waf/config`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar configuração WAF: ${response.status}`);
    }

    return await response.json();
  }

  // Rate Limiting Configuration
  async getRateLimitConfig(tenantId) {
    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/rate-limit`, {
      method: 'GET',
      headers: this.auth.getAuthHeaders()
    });

    if (!response.ok) {
      throw new Error(`Erro ao obter configuração rate limit: ${response.status}`);
    }

    return await response.json();
  }

  async updateRateLimitConfig(tenantId, config) {
    this.validateRateLimitConfig(config);

    const response = await fetch(`${this.baseUrl}/api/tenants/${tenantId}/rate-limit`, {
      method: 'PUT',
      headers: this.auth.getAuthHeaders(),
      body: JSON.stringify(config)
    });

    if (!response.ok) {
      throw new Error(`Erro ao atualizar configuração rate limit: ${response.status}`);
    }

    return await response.json();
  }

  // Validations
  validateWAFConfig(config) {
    const errors = [];

    if (config.level && !['basic', 'medium', 'strict'].includes(config.level)) {
      errors.push('Nível WAF deve ser: basic, medium ou strict');
    }

    if (config.whitelist_ips) {
      config.whitelist_ips.forEach(ip => {
        if (!this.isValidIPOrCIDR(ip)) {
          errors.push(`IP ou CIDR inválido: ${ip}`);
        }
      });
    }

    if (config.blacklist_ips) {
      config.blacklist_ips.forEach(ip => {
        if (!this.isValidIPOrCIDR(ip)) {
          errors.push(`IP ou CIDR inválido: ${ip}`);
        }
      });
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  validateRateLimitConfig(config) {
    const errors = [];

    if (config.requests_per_second && config.requests_per_second < 1) {
      errors.push('Requests per second deve ser maior que 0');
    }

    if (config.burst_size && config.burst_size < config.requests_per_second) {
      errors.push('Burst size deve ser maior ou igual a requests per second');
    }

    if (config.per_ip_limit?.enabled) {
      if (!config.per_ip_limit.requests_per_second || config.per_ip_limit.requests_per_second < 1) {
        errors.push('Rate limit por IP deve ser maior que 0');
      }
    }

    if (errors.length > 0) {
      throw new Error(errors.join(', '));
    }

    return true;
  }

  // Helper methods
  isValidIPOrCIDR(ip) {
    // Regex básica para validar IP ou CIDR
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/;
    return ipRegex.test(ip);
  }

  // Get security recommendations
  getSecurityRecommendations(tenant, wafConfig, rateLimitConfig) {
    const recommendations = [];

    // WAF recommendations
    if (!wafConfig.enabled) {
      recommendations.push({
        type: 'warning',
        category: 'WAF',
        message: 'WAF está desabilitado. Considere habilitá-lo para maior segurança.',
        priority: 'high'
      });
    }

    if (wafConfig.level === 'basic') {
      recommendations.push({
        type: 'info',
        category: 'WAF',
        message: 'WAF está no nível básico. Considere upgradar para medium ou strict.',
        priority: 'medium'
      });
    }

    if (!wafConfig.rules?.sql_injection) {
      recommendations.push({
        type: 'warning',
        category: 'WAF',
        message: 'Proteção contra SQL Injection está desabilitada.',
        priority: 'high'
      });
    }

    // Rate limiting recommendations
    if (rateLimitConfig.requests_per_second > 1000 && tenant.plan === 'free') {
      recommendations.push({
        type: 'warning',
        category: 'Rate Limit',
        message: 'Rate limit muito alto para plano gratuito. Considere ajustar.',
        priority: 'medium'
      });
    }

    if (!rateLimitConfig.per_ip_limit?.enabled) {
      recommendations.push({
        type: 'info',
        category: 'Rate Limit',
        message: 'Rate limit por IP não está habilitado. Considere habilitar para evitar abuso.',
        priority: 'low'
      });
    }

    return recommendations;
  }

  // Security metrics
  async getSecurityMetrics(tenantId, timeRange = '24h') {
    // Esta seria uma implementação futura para obter métricas de segurança
    // Por enquanto, retornamos dados simulados
    return {
      waf: {
        blocked_requests: 150,
        sql_injection_attempts: 23,
        xss_attempts: 45,
        top_blocked_ips: [
          { ip: '1.2.3.4', count: 50 },
          { ip: '5.6.7.8', count: 30 }
        ]
      },
      rate_limit: {
        rate_limited_requests: 75,
        top_rate_limited_ips: [
          { ip: '9.10.11.12', count: 25 },
          { ip: '13.14.15.16', count: 20 }
        ]
      },
      timeRange
    };
  }
}

// Uso da classe
const auth = new AuthManager();
const tenantSecurityManager = new TenantSecurityManager(auth);
```

## 🎨 Componentes de Interface (React)

### Configuração WAF
```jsx
import React, { useState, useEffect } from 'react';

const WAFConfiguration = ({ tenantId, tenantSecurityManager, userRole }) => {
  const [wafConfig, setWafConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadWAFConfig();
  }, [tenantId]);

  const loadWAFConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await tenantSecurityManager.getWAFConfig(tenantId);
      setWafConfig(config);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!PermissionManager.canManageRoutes(userRole)) {
      alert('Você não tem permissão para alterar configurações WAF');
      return;
    }

    try {
      setSaving(true);
      const updated = await tenantSecurityManager.updateWAFConfig(tenantId, wafConfig);
      setWafConfig(updated);
      alert('Configuração WAF atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleRule = (ruleName) => {
    setWafConfig(prev => ({
      ...prev,
      rules: {
        ...prev.rules,
        [ruleName]: !prev.rules[ruleName]
      }
    }));
  };

  const handleLevelChange = (level) => {
    setWafConfig(prev => ({
      ...prev,
      level
    }));
  };

  const handleIPListChange = (listType, ips) => {
    const ipArray = ips.split('\n').filter(ip => ip.trim()).map(ip => ip.trim());
    setWafConfig(prev => ({
      ...prev,
      [listType]: ipArray
    }));
  };

  if (loading) return <div>Carregando configuração WAF...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!wafConfig) return <div>Configuração não encontrada</div>;

  const canEdit = PermissionManager.canManageRoutes(userRole);

  return (
    <div className="waf-configuration">
      <div className="config-header">
        <h2>Configuração WAF (Web Application Firewall)</h2>
        {canEdit && (
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        )}
      </div>

      <div className="config-section">
        <h3>Status Geral</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={wafConfig.enabled}
              onChange={(e) => setWafConfig(prev => ({ ...prev, enabled: e.target.checked }))}
              disabled={!canEdit}
            />
            Habilitar WAF
          </label>
        </div>
      </div>

      {wafConfig.enabled && (
        <>
          <div className="config-section">
            <h3>Nível de Proteção</h3>
            <div className="level-options">
              {['basic', 'medium', 'strict'].map(level => (
                <label key={level} className="level-option">
                  <input
                    type="radio"
                    name="waf-level"
                    value={level}
                    checked={wafConfig.level === level}
                    onChange={() => handleLevelChange(level)}
                    disabled={!canEdit}
                  />
                  <span className={`level-label level-${level}`}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </span>
                  <small>
                    {level === 'basic' && 'Proteção básica contra ataques comuns'}
                    {level === 'medium' && 'Proteção moderada com regras adicionais'}
                    {level === 'strict' && 'Proteção máxima (pode causar falsos positivos)'}
                  </small>
                </label>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h3>Regras de Proteção</h3>
            <div className="rules-grid">
              {Object.entries(wafConfig.rules || {}).map(([ruleName, enabled]) => (
                <div key={ruleName} className="rule-item">
                  <label>
                    <input
                      type="checkbox"
                      checked={enabled}
                      onChange={() => handleToggleRule(ruleName)}
                      disabled={!canEdit}
                    />
                    <span className="rule-name">
                      {ruleName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </span>
                  </label>
                  <small>
                    {ruleName === 'sql_injection' && 'Bloqueia tentativas de SQL Injection'}
                    {ruleName === 'xss_protection' && 'Protege contra ataques XSS'}
                    {ruleName === 'rate_limiting' && 'Aplica rate limiting automático'}
                    {ruleName === 'ip_filtering' && 'Filtra IPs baseado em listas'}
                    {ruleName === 'geo_blocking' && 'Bloqueia países específicos'}
                  </small>
                </div>
              ))}
            </div>
          </div>

          <div className="config-section">
            <h3>Listas de IPs</h3>
            <div className="ip-lists">
              <div className="ip-list-group">
                <label htmlFor="whitelist">IPs Permitidos (whitelist)</label>
                <textarea
                  id="whitelist"
                  rows="5"
                  value={(wafConfig.whitelist_ips || []).join('\n')}
                  onChange={(e) => handleIPListChange('whitelist_ips', e.target.value)}
                  placeholder="192.168.1.0/24&#10;10.0.0.0/8"
                  disabled={!canEdit}
                />
                <small>Um IP ou CIDR por linha</small>
              </div>

              <div className="ip-list-group">
                <label htmlFor="blacklist">IPs Bloqueados (blacklist)</label>
                <textarea
                  id="blacklist"
                  rows="5"
                  value={(wafConfig.blacklist_ips || []).join('\n')}
                  onChange={(e) => handleIPListChange('blacklist_ips', e.target.value)}
                  placeholder="1.2.3.4&#10;5.6.7.0/24"
                  disabled={!canEdit}
                />
                <small>Um IP ou CIDR por linha</small>
              </div>
            </div>
          </div>

          {wafConfig.rules?.geo_blocking && (
            <div className="config-section">
              <h3>Bloqueio Geográfico</h3>
              <div className="geo-blocking">
                <div className="country-list">
                  <label>Países Bloqueados</label>
                  <input
                    type="text"
                    value={(wafConfig.blocked_countries || []).join(', ')}
                    onChange={(e) => setWafConfig(prev => ({
                      ...prev,
                      blocked_countries: e.target.value.split(',').map(c => c.trim().toUpperCase())
                    }))}
                    placeholder="CN, RU, KP"
                    disabled={!canEdit}
                  />
                  <small>Códigos de país separados por vírgula (ISO 3166-1 alpha-2)</small>
                </div>

                <div className="country-list">
                  <label>Países Permitidos (opcional)</label>
                  <input
                    type="text"
                    value={(wafConfig.allowed_countries || []).join(', ')}
                    onChange={(e) => setWafConfig(prev => ({
                      ...prev,
                      allowed_countries: e.target.value.split(',').map(c => c.trim().toUpperCase())
                    }))}
                    placeholder="BR, US, CA"
                    disabled={!canEdit}
                  />
                  <small>Se especificado, apenas estes países serão permitidos</small>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default WAFConfiguration;
```

### Configuração Rate Limiting
```jsx
import React, { useState, useEffect } from 'react';

const RateLimitConfiguration = ({ tenantId, tenantSecurityManager, userRole, tenantPlan }) => {
  const [rateLimitConfig, setRateLimitConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadRateLimitConfig();
  }, [tenantId]);

  const loadRateLimitConfig = async () => {
    try {
      setLoading(true);
      setError(null);
      const config = await tenantSecurityManager.getRateLimitConfig(tenantId);
      setRateLimitConfig(config);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!PermissionManager.canManageRoutes(userRole)) {
      alert('Você não tem permissão para alterar configurações de rate limiting');
      return;
    }

    try {
      setSaving(true);
      const updated = await tenantSecurityManager.updateRateLimitConfig(tenantId, rateLimitConfig);
      setRateLimitConfig(updated);
      alert('Configuração de rate limiting atualizada com sucesso!');
    } catch (err) {
      alert('Erro ao salvar: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleMainConfigChange = (field, value) => {
    setRateLimitConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubConfigChange = (section, field, value) => {
    setRateLimitConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const getMaxAllowedRPS = () => {
    const planLimits = {
      'free': 100,
      'pro': 500,
      'enterprise': 2000
    };
    return planLimits[tenantPlan] || 100;
  };

  if (loading) return <div>Carregando configuração de rate limiting...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!rateLimitConfig) return <div>Configuração não encontrada</div>;

  const canEdit = PermissionManager.canManageRoutes(userRole);
  const maxRPS = getMaxAllowedRPS();

  return (
    <div className="rate-limit-configuration">
      <div className="config-header">
        <h2>Configuração de Rate Limiting</h2>
        {canEdit && (
          <button onClick={handleSave} disabled={saving}>
            {saving ? 'Salvando...' : 'Salvar Configuração'}
          </button>
        )}
      </div>

      <div className="plan-info">
        <p>Plano atual: <strong>{tenantPlan}</strong></p>
        <p>Limite máximo: <strong>{maxRPS} requisições/segundo</strong></p>
      </div>

      <div className="config-section">
        <h3>Configuração Global</h3>
        <div className="config-grid">
          <div className="form-group">
            <label htmlFor="global-rps">Requisições por Segundo</label>
            <input
              type="number"
              id="global-rps"
              value={rateLimitConfig.requests_per_second}
              onChange={(e) => handleMainConfigChange('requests_per_second', parseInt(e.target.value))}
              min="1"
              max={maxRPS}
              disabled={!canEdit}
            />
            <small>Máximo permitido para seu plano: {maxRPS}</small>
          </div>

          <div className="form-group">
            <label htmlFor="global-burst">Tamanho do Burst</label>
            <input
              type="number"
              id="global-burst"
              value={rateLimitConfig.burst_size}
              onChange={(e) => handleMainConfigChange('burst_size', parseInt(e.target.value))}
              min={rateLimitConfig.requests_per_second}
              disabled={!canEdit}
            />
            <small>Deve ser maior ou igual ao limite por segundo</small>
          </div>

          <div className="form-group">
            <label htmlFor="window-size">Janela de Tempo</label>
            <select
              id="window-size"
              value={rateLimitConfig.window_size}
              onChange={(e) => handleMainConfigChange('window_size', e.target.value)}
              disabled={!canEdit}
            >
              <option value="1s">1 segundo</option>
              <option value="1m">1 minuto</option>
              <option value="1h">1 hora</option>
            </select>
          </div>
        </div>
      </div>

      <div className="config-section">
        <h3>Rate Limiting por IP</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={rateLimitConfig.per_ip_limit?.enabled || false}
              onChange={(e) => handleSubConfigChange('per_ip_limit', 'enabled', e.target.checked)}
              disabled={!canEdit}
            />
            Habilitar rate limiting por IP
          </label>
        </div>

        {rateLimitConfig.per_ip_limit?.enabled && (
          <div className="config-grid">
            <div className="form-group">
              <label htmlFor="ip-rps">Requisições por Segundo (por IP)</label>
              <input
                type="number"
                id="ip-rps"
                value={rateLimitConfig.per_ip_limit.requests_per_second}
                onChange={(e) => handleSubConfigChange('per_ip_limit', 'requests_per_second', parseInt(e.target.value))}
                min="1"
                max={rateLimitConfig.requests_per_second}
                disabled={!canEdit}
              />
            </div>

            <div className="form-group">
              <label htmlFor="ip-burst">Burst por IP</label>
              <input
                type="number"
                id="ip-burst"
                value={rateLimitConfig.per_ip_limit.burst_size}
                onChange={(e) => handleSubConfigChange('per_ip_limit', 'burst_size', parseInt(e.target.value))}
                min={rateLimitConfig.per_ip_limit.requests_per_second}
                disabled={!canEdit}
              />
            </div>
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>Rate Limiting por Usuário</h3>
        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={rateLimitConfig.per_user_limit?.enabled || false}
              onChange={(e) => handleSubConfigChange('per_user_limit', 'enabled', e.target.checked)}
              disabled={!canEdit}
            />
            Habilitar rate limiting por usuário autenticado
          </label>
        </div>

        {rateLimitConfig.per_user_limit?.enabled && (
          <div className="config-grid">
            <div className="form-group">
              <label htmlFor="user-rps">Requisições por Segundo (por usuário)</label>
              <input
                type="number"
                id="user-rps"
                value={rateLimitConfig.per_user_limit.requests_per_second}
                onChange={(e) => handleSubConfigChange('per_user_limit', 'requests_per_second', parseInt(e.target.value))}
                min="1"
                max={rateLimitConfig.requests_per_second}
                disabled={!canEdit}
              />
            </div>

            <div className="form-group">
              <label htmlFor="user-burst">Burst por usuário</label>
              <input
                type="number"
                id="user-burst"
                value={rateLimitConfig.per_user_limit.burst_size}
                onChange={(e) => handleSubConfigChange('per_user_limit', 'burst_size', parseInt(e.target.value))}
                min={rateLimitConfig.per_user_limit.requests_per_second}
                disabled={!canEdit}
              />
            </div>
          </div>
        )}
      </div>

      <div className="config-section">
        <h3>Exclusões</h3>
        <div className="exclusions-grid">
          <div className="form-group">
            <label htmlFor="excluded-paths">Paths Excluídos</label>
            <textarea
              id="excluded-paths"
              rows="3"
              value={(rateLimitConfig.exclusions?.paths || []).join('\n')}
              onChange={(e) => handleSubConfigChange('exclusions', 'paths', e.target.value.split('\n').filter(p => p.trim()))}
              placeholder="/health&#10;/metrics&#10;/status"
              disabled={!canEdit}
            />
            <small>Um path por linha</small>
          </div>

          <div className="form-group">
            <label htmlFor="excluded-ips">IPs Excluídos</label>
            <textarea
              id="excluded-ips"
              rows="3"
              value={(rateLimitConfig.exclusions?.ips || []).join('\n')}
              onChange={(e) => handleSubConfigChange('exclusions', 'ips', e.target.value.split('\n').filter(ip => ip.trim()))}
              placeholder="192.168.1.100&#10;10.0.0.50"
              disabled={!canEdit}
            />
            <small>Um IP por linha</small>
          </div>

          <div className="form-group">
            <label htmlFor="excluded-user-agents">User Agents Excluídos</label>
            <textarea
              id="excluded-user-agents"
              rows="3"
              value={(rateLimitConfig.exclusions?.user_agents || []).join('\n')}
              onChange={(e) => handleSubConfigChange('exclusions', 'user_agents', e.target.value.split('\n').filter(ua => ua.trim()))}
              placeholder="Monitor/1.0&#10;HealthCheck/2.0"
              disabled={!canEdit}
            />
            <small>Um User Agent por linha</small>
          </div>
        </div>
      </div>

      <div className="config-preview">
        <h3>Resumo da Configuração</h3>
        <div className="preview-grid">
          <div className="preview-item">
            <span>Limite Global:</span>
            <strong>{rateLimitConfig.requests_per_second} req/s (burst: {rateLimitConfig.burst_size})</strong>
          </div>
          {rateLimitConfig.per_ip_limit?.enabled && (
            <div className="preview-item">
              <span>Limite por IP:</span>
              <strong>{rateLimitConfig.per_ip_limit.requests_per_second} req/s (burst: {rateLimitConfig.per_ip_limit.burst_size})</strong>
            </div>
          )}
          {rateLimitConfig.per_user_limit?.enabled && (
            <div className="preview-item">
              <span>Limite por Usuário:</span>
              <strong>{rateLimitConfig.per_user_limit.requests_per_second} req/s (burst: {rateLimitConfig.per_user_limit.burst_size})</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RateLimitConfiguration;
```

## 📊 Níveis de Segurança

```javascript
// Constantes para níveis WAF
const WAF_LEVELS = {
  BASIC: 'basic',
  MEDIUM: 'medium',
  STRICT: 'strict'
};

// Configurações por nível
const WAF_LEVEL_CONFIGS = {
  [WAF_LEVELS.BASIC]: {
    name: 'Básico',
    description: 'Proteção básica contra ataques comuns',
    rules: {
      sql_injection: true,
      xss_protection: true,
      rate_limiting: false,
      ip_filtering: false,
      geo_blocking: false
    },
    sensitivity: 'low',
    false_positive_risk: 'very_low'
  },
  [WAF_LEVELS.MEDIUM]: {
    name: 'Médio',
    description: 'Proteção moderada com regras adicionais',
    rules: {
      sql_injection: true,
      xss_protection: true,
      rate_limiting: true,
      ip_filtering: true,
      geo_blocking: false
    },
    sensitivity: 'medium',
    false_positive_risk: 'low'
  },
  [WAF_LEVELS.STRICT]: {
    name: 'Rigoroso',
    description: 'Proteção máxima (pode causar falsos positivos)',
    rules: {
      sql_injection: true,
      xss_protection: true,
      rate_limiting: true,
      ip_filtering: true,
      geo_blocking: true
    },
    sensitivity: 'high',
    false_positive_risk: 'medium'
  }
};

// Função para obter configuração do nível
function getWAFLevelConfig(level) {
  return WAF_LEVEL_CONFIGS[level] || WAF_LEVEL_CONFIGS[WAF_LEVELS.BASIC];
}

// Tipos de ataques detectados
const ATTACK_TYPES = {
  SQL_INJECTION: 'sql_injection',
  XSS: 'xss',
  CSRF: 'csrf',
  DIRECTORY_TRAVERSAL: 'directory_traversal',
  COMMAND_INJECTION: 'command_injection',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_USER_AGENT: 'suspicious_user_agent',
  BLOCKED_IP: 'blocked_ip',
  GEO_BLOCKED: 'geo_blocked'
};

// Descrições dos tipos de ataque
const ATTACK_DESCRIPTIONS = {
  [ATTACK_TYPES.SQL_INJECTION]: 'Tentativa de SQL Injection',
  [ATTACK_TYPES.XSS]: 'Tentativa de Cross-Site Scripting',
  [ATTACK_TYPES.CSRF]: 'Tentativa de Cross-Site Request Forgery',
  [ATTACK_TYPES.DIRECTORY_TRAVERSAL]: 'Tentativa de Directory Traversal',
  [ATTACK_TYPES.COMMAND_INJECTION]: 'Tentativa de Command Injection',
  [ATTACK_TYPES.RATE_LIMIT_EXCEEDED]: 'Limite de requisições excedido',
  [ATTACK_TYPES.SUSPICIOUS_USER_AGENT]: 'User Agent suspeito',
  [ATTACK_TYPES.BLOCKED_IP]: 'IP bloqueado',
  [ATTACK_TYPES.GEO_BLOCKED]: 'País bloqueado'
};
```

## ⚠️ Tratamento de Erros

```javascript
// Códigos de erro específicos de segurança
const SECURITY_ERRORS = {
  WAF_CONFIG_INVALID: 'Configuração WAF inválida',
  RATE_LIMIT_CONFIG_INVALID: 'Configuração de rate limit inválida',
  INVALID_IP_FORMAT: 'Formato de IP inválido',
  PLAN_LIMIT_EXCEEDED: 'Limite do plano excedido',
  INVALID_COUNTRY_CODE: 'Código de país inválido'
};

// Função para tratar erros de segurança
function handleSecurityError(error, response) {
  switch (response?.status) {
    case 400:
      if (error.message.includes('IP')) {
        return 'Formato de IP inválido. Use IP ou CIDR (ex: 192.168.1.0/24).';
      }
      if (error.message.includes('rate limit')) {
        return 'Configuração de rate limit inválida. Verifique os valores.';
      }
      if (error.message.includes('country')) {
        return 'Código de país inválido. Use códigos ISO 3166-1 alpha-2.';
      }
      return 'Configuração de segurança inválida.';
    case 401:
      return 'Sessão expirada. Faça login novamente.';
    case 403:
      return 'Você não tem permissão para alterar configurações de segurança.';
    case 422:
      return 'Configuração excede os limites do seu plano atual.';
    case 500:
      return 'Erro interno do servidor. Tente novamente.';
    default:
      return 'Erro desconhecido. Entre em contato com o suporte.';
  }
}
```

## 🔍 Monitoramento de Segurança

```javascript
// Classe para monitorar segurança
class SecurityMonitor {
  constructor(tenantSecurityManager, tenantId) {
    this.securityManager = tenantSecurityManager;
    this.tenantId = tenantId;
  }

  // Obter métricas de segurança
  async getSecurityMetrics(timeRange = '24h') {
    return await this.securityManager.getSecurityMetrics(this.tenantId, timeRange);
  }

  // Gerar relatório de segurança
  async generateSecurityReport() {
    const [wafConfig, rateLimitConfig, metrics] = await Promise.all([
      this.securityManager.getWAFConfig(this.tenantId),
      this.securityManager.getRateLimitConfig(this.tenantId),
      this.getSecurityMetrics('7d')
    ]);

    return {
      summary: {
        waf_enabled: wafConfig.enabled,
        waf_level: wafConfig.level,
        rate_limit_enabled: rateLimitConfig.requests_per_second > 0,
        total_blocked_requests: metrics.waf.blocked_requests + metrics.rate_limit.rate_limited_requests
      },
      waf: {
        config: wafConfig,
        blocked_requests: metrics.waf.blocked_requests,
        attack_types: metrics.waf.attack_types || {},
        top_blocked_ips: metrics.waf.top_blocked_ips
      },
      rate_limit: {
        config: rateLimitConfig,
        limited_requests: metrics.rate_limit.rate_limited_requests,
        top_limited_ips: metrics.rate_limit.top_rate_limited_ips
      },
      recommendations: this.securityManager.getSecurityRecommendations(
        { plan: 'pro' }, // tenant info
        wafConfig,
        rateLimitConfig
      ),
      generated_at: new Date().toISOString()
    };
  }

  // Verificar configuração de segurança
  async checkSecurityConfig() {
    const [wafConfig, rateLimitConfig] = await Promise.all([
      this.securityManager.getWAFConfig(this.tenantId),
      this.securityManager.getRateLimitConfig(this.tenantId)
    ]);

    const issues = [];

    // Verificar WAF
    if (!wafConfig.enabled) {
      issues.push({
        type: 'warning',
        category: 'WAF',
        message: 'WAF está desabilitado',
        severity: 'high'
      });
    }

    if (wafConfig.enabled && wafConfig.level === 'basic') {
      issues.push({
        type: 'info',
        category: 'WAF',
        message: 'WAF está em nível básico',
        severity: 'medium'
      });
    }

    // Verificar rate limiting
    if (rateLimitConfig.requests_per_second > 1000) {
      issues.push({
        type: 'warning',
        category: 'Rate Limit',
        message: 'Rate limit muito alto',
        severity: 'medium'
      });
    }

    if (!rateLimitConfig.per_ip_limit?.enabled) {
      issues.push({
        type: 'info',
        category: 'Rate Limit',
        message: 'Rate limit por IP não habilitado',
        severity: 'low'
      });
    }

    return {
      status: issues.length === 0 ? 'good' : 'issues_found',
      issues,
      score: this.calculateSecurityScore(wafConfig, rateLimitConfig),
      checked_at: new Date().toISOString()
    };
  }

  // Calcular pontuação de segurança
  calculateSecurityScore(wafConfig, rateLimitConfig) {
    let score = 0;

    // WAF (40 pontos)
    if (wafConfig.enabled) {
      score += 20;
      if (wafConfig.level === 'medium') score += 10;
      if (wafConfig.level === 'strict') score += 20;
      if (wafConfig.rules?.sql_injection) score += 5;
      if (wafConfig.rules?.xss_protection) score += 5;
    }

    // Rate Limiting (30 pontos)
    if (rateLimitConfig.requests_per_second > 0) {
      score += 15;
      if (rateLimitConfig.per_ip_limit?.enabled) score += 10;
      if (rateLimitConfig.per_user_limit?.enabled) score += 5;
    }

    // IP Filtering (20 pontos)
    if (wafConfig.whitelist_ips?.length > 0) score += 10;
    if (wafConfig.blacklist_ips?.length > 0) score += 5;
    if (wafConfig.rules?.geo_blocking) score += 5;

    // Exclusions configured (10 pontos)
    if (rateLimitConfig.exclusions?.paths?.length > 0) score += 5;
    if (rateLimitConfig.exclusions?.ips?.length > 0) score += 5;

    return Math.min(score, 100);
  }
}
```
