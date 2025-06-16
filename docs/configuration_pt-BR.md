# Referência de Configuração

O VeloFlux suporta configuração via arquivo YAML e dinamicamente através de sua API. Esta referência cobre tanto a configuração estática quanto as configurações gerenciáveis via API.

## Configurações Globais

```yaml
global:
  bind_address: "<YOUR_IP_ADDRESS>:80"        # Endereço de escuta HTTP
  tls_bind_address: "<YOUR_IP_ADDRESS>:443"   # Endereço de escuta HTTPS
  metrics_address: "<YOUR_IP_ADDRESS>:8080"   # Métricas Prometheus
  admin_address: "<YOUR_IP_ADDRESS>:9000"     # Endereço da API de administração

  tls:
    auto_cert: true                 # Obter certificados via Let's Encrypt
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs/veloflux"
    client_auth:                    # Configurações de TLS mútuo
      enabled: false
      ca_cert: "/etc/ssl/ca.pem"

  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3
    healthy_threshold: 2
    unhealthy_threshold: 3

  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"
    response_code: 429
    exclude_paths:
      - "/health"
      - "/metrics"

  waf:
    enabled: true
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"               # basic, standard, strict
    blocking_mode: true             # false para modo detecção apenas
    logging: true                   # registrar detalhes de solicitações bloqueadas

  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"
    update_interval: "168h"         # intervalo de atualização automática

  # Configuração de IA/ML
  ai:
    enabled: true                   # Habilitar recursos de IA/ML
    intelligent_routing: true       # Seleção de backend alimentada por ML
    predictive_scaling: true        # Previsões de capacidade orientadas por IA
    anomaly_detection: true         # Detecção de anomalias em tempo real
    model_retrain_interval: "24h"   # Com que frequência retreinar modelos
    metrics_retention: "30d"        # Por quanto tempo manter métricas de IA
    
    # Limites de desempenho do modelo
    thresholds:
      min_accuracy: 0.85            # Precisão mínima do modelo antes do retreinamento
      anomaly_sensitivity: 0.7      # Sensibilidade da detecção de anomalias (0-1)
      prediction_confidence: 0.8    # Confiança mínima para previsões
    
    # Configuração de recursos
    features:
      backend_scoring: true         # Pontuação de desempenho de backend baseada em IA
      traffic_prediction: true      # Previsão de tráfego
      health_prediction: true       # Monitoramento de saúde preditivo
      optimization_suggestions: true # Recomendações de otimização geradas por IA
```

## Autenticação e Multi-tenant

```yaml
auth:
  enabled: true
  jwt_secret: "altere-em-producao"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  refresh_token_validity: "7d"
  cookie_secure: true
  cookie_http_only: true
  
  # Configuração do Provedor OIDC
  oidc:
    enabled: true
    provider: "keycloak"    # keycloak, auth0, generic
    issuer_url: "https://keycloak.example.com/auth/realms/veloflux"
    client_id: "veloflux-admin"
    client_secret: "seu-client-secret-aqui"
    redirect_uri: "https://admin.example.com/auth/callback"
    scopes: ["openid", "profile", "email"]
    
    # Mapeamentos de claims (como extrair tenant_id e roles)
    claim_mappings:
      tenant_id: "tenant_id"
      roles: "roles"
      email: "email"
    
    # Configurações específicas do provedor
    keycloak:
      admin_url: "https://keycloak.example.com/auth/admin"
      realm: "veloflux"
      default_roles: ["viewer"]
    
    auth0:
      domain: "veloflux.auth0.com"
      audience: "https://api.veloflux.io"
      management_api_token: "seu-management-token"

# Configuração multi-tenant
tenants:
  # Configuração de tenant padrão
  default_plan: "basic"           # Plano padrão para novos tenants
  
  # Definições de planos
  plans:
    free:
      max_requests_per_second: 10
      max_burst_size: 20
      max_bandwidth_mb_per_day: 1000
      max_routes: 3
      max_backends: 6
      waf_level: "basic"
      orchestration_mode: "shared"
    
    pro:
      max_requests_per_second: 1000
      max_burst_size: 2000
      max_bandwidth_mb_per_day: 100000
      max_routes: 50
      max_backends: 200
      waf_level: "strict"
      orchestration_mode: "shared"
      
    enterprise:
      max_requests_per_second: 5000
      max_burst_size: 10000
      max_bandwidth_mb_per_day: 500000
      max_routes: 250
      max_backends: 1000
      waf_level: "strict"
      orchestration_mode: "dedicated"
      dedicated_resources:
        cpu_request: "200m"
        cpu_limit: "1000m"
        memory_request: "256Mi"
        memory_limit: "1Gi"
      
  # Definições de tenants de exemplo (tipicamente gerenciadas via API)
  tenant_configs:
    - id: "tenant1"
      name: "Example Corp"
      plan: "enterprise"
      routes:
        - host: "api.example.com"
          pool: "tenant1:pool:api-servers"
      custom_domain: "api.example.com"
      oidc_provider: "keycloak"
```

## Faturamento e Monetização

```yaml
billing:
  enabled: true
  provider: "stripe"            # stripe, gerencianet
  
  # Configuração Stripe
  stripe:
    api_key: "sk_test_sua_chave_api_stripe"
    webhook_secret: "whsec_seu_webhook_secret"
    product_id: "prod_seu_product_id"
    prices:
      free: "price_plano_free_id"
      pro: "price_plano_pro_id"
      enterprise: "price_plano_enterprise_id"
  
  # Configuração Gerencianet
  gerencianet:
    client_id: "seu_client_id"
    client_secret: "seu_client_secret"
    sandbox: false
    webhook_token: "seu_webhook_token"
  
  # Configuração de exportação
  export:
    enabled: true
    formats: ["json", "csv"]
    schedule: "0 1 * * *"       # Diariamente às 1h (formato cron)
    retention_days: 90
    storage_path: "/var/lib/veloflux/billing_exports"
    
  # Métricas de uso para faturamento
  metrics:
    collect_interval: "5m"
    bandwidth_cost_per_gb: 0.10
    request_cost_per_million: 0.50
```

## Orquestração Kubernetes

```yaml
orchestration:
  enabled: true
  
  # Configuração Kubernetes
  kube_config_path: ""           # Deixe vazio para config in-cluster
  in_cluster: true               # Usar config in-cluster
  namespace: "veloflux-tenants"  # Namespace padrão para instâncias de tenant
  
  # Configuração de deployment Helm
  helm_release_name: "veloflux"
  chart_path: "./charts/veloflux"
  chart_version: "1.0.0"
  values_path: "./charts/values.yaml"
  
  # Conta de serviço para operações Kubernetes
  service_account_name: "veloflux-orchestrator"
  
  # Configurações de recursos padrão para instâncias de tenant
  default_resources:
    cpu_request: "100m"
    cpu_limit: "500m"
    memory_request: "128Mi"
    memory_limit: "512Mi"
  
  # Configurações de auto-scaling padrão
  default_autoscaling:
    enabled: true
    min_replicas: 1
    max_replicas: 5
    target_cpu_utilization: 70
    
  # Configurações de monitoramento
  monitoring:
    status_check_interval: "30s"
    events_retention: 48h
    logs_enabled: true
```

## Clustering e Persistência

```yaml
# Configuração Redis
redis:
  address: "redis:6379"
  password: ""
  db: 0
  key_prefix: "vf:"
  pool_size: 10
  
  # Suporte opcional Redis Sentinel
  sentinel:
    enabled: false
    master_name: "veloflux-master"
    addresses:
      - "sentinel-1:26379"
      - "sentinel-2:26379"

# Configuração de clustering
cluster:
  enabled: true
  node_id: ""                      # auto-gerado se vazio
  heartbeat_interval: "5s"
  leader_timeout: "15s"
  sync_interval: "1m"              # Intervalo de sincronização de configuração
```

## Pools e Rotas

Pools definem servidores backend. Rotas mapeiam hostnames para pools. No modo multi-tenant, estes são tipicamente gerenciados via API.

```yaml
pools:
  - name: "web-servers"
    tenant_id: "tenant1"           # Propriedade do tenant
    algorithm: "round_robin"       # round_robin, least_conn, ip_hash
    sticky_sessions: true
    retries: 3
    timeout: "30s"
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          method: "GET"
          expected_status: 200
          expected_body: "ok"
```

```yaml
routes:
  - host: "example.com"
    tenant_id: "tenant1"           # Propriedade do tenant
    pool: "web-servers"
    path_prefix: "/"
    strip_path_prefix: false
    tls_required: true
    cors_enabled: true
    cors_allow_origins:
      - "https://app.example.com"
    rate_limit:
      requests_per_second: 50      # Sobrescrever configuração global
    waf:
      level: "strict"              # Sobrescrever configuração global
    headers:
      set:
        X-Frame-Options: "DENY"
      add:
        Cache-Control: "no-store"
      remove:
        - Server
```

## Métricas e Monitoramento

```yaml
metrics:
  prometheus:
    enabled: true
    path: "/metrics"
    tenant_label: true             # Adicionar label de tenant às métricas
  
  logging:
    level: "info"                  # debug, info, warn, error
    format: "json"                 # json, text
    tenant_field: true             # Adicionar campo de tenant aos logs
    
  kubernetes:
    enabled: true
    collect_pod_metrics: true
    collect_node_metrics: false
    collect_events: true
```

## Exemplos de API

### API de Orquestração

```bash
# Obter configuração para um tenant
curl -X GET "https://admin.example.com/api/tenants/tenant1/orchestration" \
  -H "Authorization: Bearer SEU_TOKEN"

# Atualizar configuração de orquestração
curl -X PUT "https://admin.example.com/api/tenants/tenant1/orchestration" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dedicated",
    "resource_limits": {
      "cpu_request": "200m",
      "cpu_limit": "1000m",
      "memory_request": "256Mi",
      "memory_limit": "1Gi"
    },
    "autoscaling_enabled": true,
    "min_replicas": 2,
    "max_replicas": 10,
    "target_cpu_utilization": 75,
    "custom_domains": ["api.cliente1.com", "app.cliente1.com"]
  }'

# Implantar instância de tenant
curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/deploy" \
  -H "Authorization: Bearer SEU_TOKEN"

# Escalar instância de tenant
curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/scale" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "replicas": 5 }'
```

### API de Faturamento

```bash
# Exportar dados de faturamento
curl -X GET "https://admin.example.com/api/billing/export?format=json&start=2025-05-01&end=2025-06-01" \
  -H "Authorization: Bearer SEU_TOKEN"

# Obter uso do tenant
curl -X GET "https://admin.example.com/api/tenants/tenant1/billing/usage" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### API OIDC

```bash
# Obter configuração OIDC para um tenant
curl -X GET "https://admin.example.com/api/tenants/tenant1/oidc/config" \
  -H "Authorization: Bearer SEU_TOKEN"

# Atualizar configuração OIDC
curl -X PUT "https://admin.example.com/api/tenants/tenant1/oidc/config" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "keycloak",
    "client_id": "tenant1-client",
    "client_secret": "client-secret",
    "claim_mappings": {
      "roles": "realm_access.roles"
    }
  }'
```

## Fluxos de Integração e Exemplos

### Fluxo de Criação e Configuração Completa de Tenant

Exemplo de fluxo para criar e configurar um tenant enterprise completo:

```bash
# 1. Criar tenant
curl -X POST "https://admin.example.com/api/tenants" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "enterprise-tenant",
    "name": "Cliente Enterprise",
    "description": "Nosso cliente empresarial Enterprise",
    "plan": "enterprise",
    "owner_email": "admin@cliente.com"
  }'

# 2. Configurar domínios e rotas
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/routes" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routes": [
      {
        "host": "api.cliente.com",
        "pool": "enterprise-tenant-pool",
        "path_prefix": "/",
        "tls_required": true,
        "cors_enabled": true
      }
    ]
  }'

# 3. Configurar backends
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/pools" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pools": [
      {
        "name": "enterprise-tenant-pool",
        "algorithm": "least_conn",
        "sticky_sessions": true,
        "backends": [
          {
            "address": "backend1.internal:80",
            "weight": 100,
            "health_check": {
              "path": "/health",
              "interval": "5s"
            }
          },
          {
            "address": "backend2.internal:80",
            "weight": 100,
            "health_check": {
              "path": "/health",
              "interval": "5s"
            }
          }
        ]
      }
    ]
  }'

# 4. Configurar integração OIDC
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/oidc" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "keycloak",
    "client_id": "client-app",
    "client_secret": "client-secret",
    "issuer_url": "https://auth.cliente.com/realms/cliente-realm",
    "claim_mappings": {
      "roles": "realm_access.roles",
      "email": "email"
    }
  }'

# 5. Configurar faturamento
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/billing" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "enterprise",
    "billing_email": "financeiro@cliente.com",
    "company_name": "Cliente Enterprise Ltda",
    "tax_id": "12345678901",
    "payment_method": "invoice",
    "billing_address": {
      "street": "Rua dos Negócios, 123",
      "city": "São Paulo",
      "state": "SP",
      "country": "BR",
      "zip": "01234-567"
    }
  }'

# 6. Configurar e implantar instância dedicada
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/orchestration" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dedicated",
    "namespace": "enterprise-tenant",
    "resource_limits": {
      "cpu_request": "500m",
      "cpu_limit": "2000m",
      "memory_request": "512Mi",
      "memory_limit": "2Gi"
    },
    "autoscaling": {
      "enabled": true,
      "min_replicas": 3,
      "max_replicas": 10,
      "target_cpu_utilization": 65
    },
    "custom_domains": ["api.cliente.com"]
  }'

# 7. Implantar a instância
curl -X POST "https://admin.example.com/api/tenants/enterprise-tenant/orchestration/deploy" \
  -H "Authorization: Bearer SEU_TOKEN"
```

### Integração com Sistemas de Faturamento

#### Exemplo de Webhook para Stripe

Configure o Stripe para enviar webhooks para seu endpoint:

```javascript
// Exemplo de handler Express.js para webhook Stripe
const express = require('express');
const app = express();

app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_seu_webhook_secret';
  
  try {
    const event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    
    // Processar eventos específicos
    switch (event.type) {
      case 'invoice.paid':
        const invoice = event.data.object;
        const tenantId = invoice.metadata.tenant_id;
        
        // Chamar a API do VeloFlux para atualizar status de pagamento
        fetch(`https://admin.example.com/api/tenants/${tenantId}/billing/invoice-paid`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.VELOFLUX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            invoice_id: invoice.id,
            amount_paid: invoice.amount_paid / 100, // Stripe usa centavos
            status: 'paid',
            payment_date: new Date(invoice.status_transitions.paid_at * 1000).toISOString()
          })
        });
        break;
        
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const tenantId = subscription.metadata.tenant_id;
        const newPlan = subscription.items.data[0].price.metadata.plan_name;
        
        // Atualizar plano do tenant
        fetch(`https://admin.example.com/api/tenants/${tenantId}/plan`, {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${process.env.VELOFLUX_API_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan: newPlan
          })
        });
        break;
    }
    
    res.status(200).send({received: true});
  } catch (err) {
    console.log(`Erro de Webhook: ${err.message}`);
    res.status(400).send(`Erro de Webhook: ${err.message}`);
  }
});

app.listen(3000, () => console.log('Servidor de webhook rodando na porta 3000'));
```

#### Exemplo de Webhook para Gerencianet

```javascript
app.post('/webhook/gerencianet', express.json(), async (req, res) => {
  const token = req.headers['gerencianet-hook-token'];
  
  // Validar token do webhook
  if (token !== process.env.GERENCIANET_WEBHOOK_TOKEN) {
    return res.status(401).send('Não autorizado');
  }
  
  try {
    const notification = req.body;
    const chargeId = notification.data.charge_id;
    
    // Obter status da cobrança diretamente da API da Gerencianet
    const gn = new Gerencianet({
      client_id: process.env.GERENCIANET_CLIENT_ID,
      client_secret: process.env.GERENCIANET_CLIENT_SECRET,
      sandbox: process.env.NODE_ENV !== 'production'
    });
    
    const chargeData = await gn.getNotification({
      token: notification.notification_id
    });
    
    const charge = chargeData.data[0];
    const tenantId = charge.custom_id.split('-')[0]; // Formato: tenant_id-invoice_id
    
    if (charge.status === 'paid') {
      // Atualizar status de pagamento no VeloFlux
      await fetch(`https://admin.example.com/api/tenants/${tenantId}/billing/invoice-paid`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.VELOFLUX_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoice_id: charge.custom_id,
          amount_paid: charge.value / 100,
          status: 'paid',
          payment_date: charge.payment.payment_date,
          payment_method: charge.payment.method
        })
      });
    }
    
    res.status(200).send({received: true});
  } catch (err) {
    console.error(`Erro de Webhook: ${err.message}`);
    res.status(500).send(`Erro de Webhook: ${err.message}`);
  }
});
```

### Integração com CI/CD para Orquestração

Exemplo de workflow GitHub Actions para automatizar deployment de tenants:

```yaml
# .github/workflows/tenant-deployment.yml
name: Deployment de Tenant

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      tenant_id:
        description: 'ID do tenant para deployment'
        required: true
      environment:
        description: 'Ambiente (staging ou production)'
        required: true
        default: 'staging'

jobs:
  deploy-tenant:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout do código
        uses: actions/checkout@v3

      - name: Configurar credenciais
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" > kubeconfig.yaml
          echo "${{ secrets.VELOFLUX_CREDENTIALS }}" > veloflux-credentials.json

      - name: Implantar instância do tenant
        run: |
          tenant_id=${{ github.event.inputs.tenant_id || 'default-tenant' }}
          env=${{ github.event.inputs.environment || 'staging' }}
          
          # Obter token de acesso para a API
          token=$(curl -X POST "https://admin.example.com/api/auth/token" \
            -H "Content-Type: application/json" \
            -d @veloflux-credentials.json | jq -r '.token')
            
          # Implantar ou atualizar instância do tenant
          curl -X POST "https://admin.example.com/api/tenants/${tenant_id}/orchestration/deploy" \
            -H "Authorization: Bearer ${token}" \
            -H "Content-Type: application/json" \
            -d "{
              \"environment\": \"${env}\",
              \"version\": \"${GITHUB_SHA}\",
              \"autoscaling\": {
                \"enabled\": true,
                \"min_replicas\": 2,
                \"max_replicas\": 5
              }
            }"
            
      - name: Verificar deployment
        run: |
          tenant_id=${{ github.event.inputs.tenant_id || 'default-tenant' }}
          token=$(cat token.txt)
          
          # Verificar status do deployment
          for i in {1..12}; do
            status=$(curl -s -X GET "https://admin.example.com/api/tenants/${tenant_id}/orchestration/status" \
              -H "Authorization: Bearer ${token}" | jq -r '.status')
              
            if [ "$status" == "deployed" ]; then
              echo "Deployment bem-sucedido!"
              exit 0
            elif [ "$status" == "failed" ]; then
              echo "Deployment falhou!"
              curl -s -X GET "https://admin.example.com/api/tenants/${tenant_id}/orchestration/logs" \
                -H "Authorization: Bearer ${token}"
              exit 1
            fi
            
            echo "Deployment em progresso, aguardando..."
            sleep 10
          done
          
          echo "Timeout do deployment!"
          exit 1
```
