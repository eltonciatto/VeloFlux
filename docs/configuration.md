# Configuration Reference

VeloFlux supports configuration via a YAML file and dynamically through its API. This reference covers both static configuration and API-configurable settings.

## Global Settings

```yaml
global:
  bind_address: "0.0.0.0:80"        # HTTP listen address
  tls_bind_address: "0.0.0.0:443"   # HTTPS listen address
  metrics_address: "0.0.0.0:8080"   # Prometheus metrics
  admin_address: "0.0.0.0:9000"     # Admin API address

  tls:
    auto_cert: true                 # Obtain certificates via Let's Encrypt
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs/veloflux"
    client_auth:                    # Mutual TLS settings
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
    blocking_mode: true             # false for detection only
    logging: true                   # log details of blocked requests

  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"
    update_interval: "168h"         # auto-update interval
```

## Authentication and Multi-tenant

```yaml
auth:
  enabled: true
  jwt_secret: "change-me-in-production"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  refresh_token_validity: "7d"
  cookie_secure: true
  cookie_http_only: true
  
  # OIDC Provider Configuration
  oidc:
    enabled: true
    provider: "keycloak"    # keycloak, auth0, generic
    issuer_url: "https://keycloak.example.com/auth/realms/veloflux"
    client_id: "veloflux-admin"
    client_secret: "your-client-secret-here"
    redirect_uri: "https://admin.example.com/auth/callback"
    scopes: ["openid", "profile", "email"]
    
    # Claim mappings (how to extract tenant_id and roles)
    claim_mappings:
      tenant_id: "tenant_id"
      roles: "roles"
      email: "email"
    
    # Provider-specific settings
    keycloak:
      admin_url: "https://keycloak.example.com/auth/admin"
      realm: "veloflux"
      default_roles: ["viewer"]
    
    auth0:
      domain: "veloflux.auth0.com"
      audience: "https://api.veloflux.io"
      management_api_token: "your-management-token"

# Multi-tenant configuration
tenants:
  # Default tenant configuration
  default_plan: "basic"           # Default plan for new tenants
  
  # Plan definitions
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
      
  # Example tenant definitions (typically managed via API)
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

## Billing and Monetization

```yaml
billing:
  enabled: true
  provider: "stripe"            # stripe, gerencianet
  
  # Stripe configuration
  stripe:
    api_key: "sk_test_your_stripe_api_key"
    webhook_secret: "whsec_your_webhook_secret"
    product_id: "prod_your_product_id"
    prices:
      free: "price_free_plan_id"
      pro: "price_pro_plan_id"
      enterprise: "price_enterprise_plan_id"
  
  # Gerencianet configuration
  gerencianet:
    client_id: "your_client_id"
    client_secret: "your_client_secret"
    sandbox: false
    webhook_token: "your_webhook_token"
  
  # Export configuration
  export:
    enabled: true
    formats: ["json", "csv"]
    schedule: "0 1 * * *"       # Daily at 1 AM (cron format)
    retention_days: 90
    storage_path: "/var/lib/veloflux/billing_exports"
    
  # Usage metrics for billing
  metrics:
    collect_interval: "5m"
    bandwidth_cost_per_gb: 0.10
    request_cost_per_million: 0.50
```

## Kubernetes Orchestration

```yaml
orchestration:
  enabled: true
  
  # Kubernetes configuration
  kube_config_path: ""           # Leave empty for in-cluster config
  in_cluster: true               # Use in-cluster config
  namespace: "veloflux-tenants"  # Default namespace for tenant instances
  
  # Helm deployment configuration
  helm_release_name: "veloflux"
  chart_path: "./charts/veloflux"
  chart_version: "1.0.0"
  values_path: "./charts/values.yaml"
  
  # Service account for Kubernetes operations
  service_account_name: "veloflux-orchestrator"
  
  # Default resource settings for tenant instances
  default_resources:
    cpu_request: "100m"
    cpu_limit: "500m"
    memory_request: "128Mi"
    memory_limit: "512Mi"
  
  # Default autoscaling settings
  default_autoscaling:
    enabled: true
    min_replicas: 1
    max_replicas: 5
    target_cpu_utilization: 70
    
  # Monitoring settings
  monitoring:
    status_check_interval: "30s"
    events_retention: 48h
    logs_enabled: true
```

## Clustering and Persistence

```yaml
# Redis configuration
redis:
  address: "redis:6379"
  password: ""
  db: 0
  key_prefix: "vf:"
  pool_size: 10
  
  # Optional Redis Sentinel support
  sentinel:
    enabled: false
    master_name: "veloflux-master"
    addresses:
      - "sentinel-1:26379"
      - "sentinel-2:26379"

# Clustering configuration
cluster:
  enabled: true
  node_id: ""                      # auto-generated if empty
  heartbeat_interval: "5s"
  leader_timeout: "15s"
  sync_interval: "1m"              # Configuration sync interval
```

## Pools and Routes

Pools define backend servers. Routes map hostnames to pools. In multi-tenant mode, these are typically managed via API.

```yaml
pools:
  - name: "web-servers"
    tenant_id: "tenant1"           # Tenant ownership
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
    tenant_id: "tenant1"           # Tenant ownership
    pool: "web-servers"
    path_prefix: "/"
    strip_path_prefix: false
    tls_required: true
    cors_enabled: true
    cors_allow_origins:
      - "https://app.example.com"
    rate_limit:
      requests_per_second: 50      # Override global setting
    waf:
      level: "strict"              # Override global setting
    headers:
      set:
        X-Frame-Options: "DENY"
      add:
        Cache-Control: "no-store"
      remove:
        - Server
```

## Metrics and Monitoring

```yaml
metrics:
  prometheus:
    enabled: true
    path: "/metrics"
    tenant_label: true             # Add tenant label to metrics
  
  logging:
    level: "info"                  # debug, info, warn, error
    format: "json"                 # json, text
    tenant_field: true             # Add tenant field to logs
    
  kubernetes:
    enabled: true
    collect_pod_metrics: true
    collect_node_metrics: false
    collect_events: true
```

## API Examples

### Orchestration API

```bash
# Get configuration for a tenant
curl -X GET "https://admin.example.com/api/tenants/tenant1/orchestration" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update orchestration configuration
curl -X PUT "https://admin.example.com/api/tenants/tenant1/orchestration" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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
    "custom_domains": ["api.customer1.com", "app.customer1.com"]
  }'

# Deploy tenant instance
curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/deploy" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Scale tenant instance
curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/scale" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{ "replicas": 5 }'
```

### Billing API

```bash
# Export billing data
curl -X GET "https://admin.example.com/api/billing/export?format=json&start=2025-05-01&end=2025-06-01" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get tenant usage
curl -X GET "https://admin.example.com/api/tenants/tenant1/billing/usage" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### OIDC API

```bash
# Get OIDC configuration for a tenant
curl -X GET "https://admin.example.com/api/tenants/tenant1/oidc/config" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Update OIDC configuration
curl -X PUT "https://admin.example.com/api/tenants/tenant1/oidc/config" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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

## Fluxos de integração e exemplos

### Fluxo de criação e configuração completa de tenant

Exemplo de fluxo para criar e configurar um tenant enterprise completo:

```bash
# 1. Criar tenant
curl -X POST "https://admin.example.com/api/tenants" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "enterprise-tenant",
    "name": "Enterprise Client",
    "description": "Nossa empresa cliente Enterprise",
    "plan": "enterprise",
    "owner_email": "admin@client.com"
  }'

# 2. Configurar domínios e rotas
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/routes" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "routes": [
      {
        "host": "api.client.com",
        "pool": "enterprise-tenant-pool",
        "path_prefix": "/",
        "tls_required": true,
        "cors_enabled": true
      }
    ]
  }'

# 3. Configurar backends
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/pools" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "keycloak",
    "client_id": "client-app",
    "client_secret": "client-secret",
    "issuer_url": "https://auth.client.com/realms/client-realm",
    "claim_mappings": {
      "roles": "realm_access.roles",
      "email": "email"
    }
  }'

# 5. Configurar billing
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/billing" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "enterprise",
    "billing_email": "finance@client.com",
    "company_name": "Enterprise Client Ltd",
    "tax_id": "12345678901",
    "payment_method": "invoice",
    "billing_address": {
      "street": "123 Business St",
      "city": "Enterprise City",
      "state": "EC",
      "country": "US",
      "zip": "12345"
    }
  }'

# 6. Configurar e implantar instância dedicada
curl -X PUT "https://admin.example.com/api/tenants/enterprise-tenant/orchestration" \
  -H "Authorization: Bearer YOUR_TOKEN" \
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
    "custom_domains": ["api.client.com"]
  }'

# 7. Implantar a instância
curl -X POST "https://admin.example.com/api/tenants/enterprise-tenant/orchestration/deploy" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Integração com sistemas de billing

#### Exemplo de webhook para Stripe

Configure Stripe para enviar webhooks para seu endpoint:

```javascript
// Exemplo de handler Express.js para webhook Stripe
const express = require('express');
const app = express();

app.post('/webhook/stripe', express.raw({type: 'application/json'}), (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = 'whsec_your_webhook_secret';
  
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
    console.log(`Webhook Error: ${err.message}`);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }
});

app.listen(3000, () => console.log('Webhook server running on port 3000'));
```

#### Exemplo de webhook para Gerencianet

```javascript
app.post('/webhook/gerencianet', express.json(), async (req, res) => {
  const token = req.headers['gerencianet-hook-token'];
  
  // Validar token do webhook
  if (token !== process.env.GERENCIANET_WEBHOOK_TOKEN) {
    return res.status(401).send('Unauthorized');
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
    console.error(`Webhook Error: ${err.message}`);
    res.status(500).send(`Webhook Error: ${err.message}`);
  }
});
```

### Integração com CI/CD para orquestração

Exemplo de workflow GitHub Actions para automatizar deployment de tenants:

```yaml
# .github/workflows/tenant-deployment.yml
name: Tenant Deployment

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
      - name: Checkout code
        uses: actions/checkout@v3

      - name: Setup credentials
        run: |
          echo "${{ secrets.KUBE_CONFIG }}" > kubeconfig.yaml
          echo "${{ secrets.VELOFLUX_CREDENTIALS }}" > veloflux-credentials.json

      - name: Deploy tenant instance
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
            
      - name: Verify deployment
        run: |
          tenant_id=${{ github.event.inputs.tenant_id || 'default-tenant' }}
          token=$(cat token.txt)
          
          # Verificar status do deployment
          for i in {1..12}; do
            status=$(curl -s -X GET "https://admin.example.com/api/tenants/${tenant_id}/orchestration/status" \
              -H "Authorization: Bearer ${token}" | jq -r '.status')
              
            if [ "$status" == "deployed" ]; then
              echo "Deployment successful!"
              exit 0
            elif [ "$status" == "failed" ]; then
              echo "Deployment failed!"
              curl -s -X GET "https://admin.example.com/api/tenants/${tenant_id}/orchestration/logs" \
                -H "Authorization: Bearer ${token}"
              exit 1
            fi
            
            echo "Deployment in progress, waiting..."
            sleep 10
          done
          
          echo "Deployment timed out!"
          exit 1
```

