# Deployment Guide

This document outlines common deployment scenarios for VeloFlux in both single-tenant and multi-tenant SaaS contexts.

## Deployment Options

VeloFlux provides multiple deployment methods to suit different needs:
- **Docker Compose**: Simple local development and testing
- **Kubernetes/Helm**: Production-ready scalable deployments
- **Coolify**: Simplified self-hosted PaaS deployment (see [Coolify Deployment Guide](coolify_deployment.md))

## Docker Compose

For local development or single-tenant deployments, the provided `docker-compose.yml` starts VeloFlux, Redis and auxiliary services.

```bash
docker-compose up -d
```

## Kubernetes / Helm

A production-ready Helm chart is available under the `charts/` directory. Example usage:

```bash
# For single-tenant installation
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secure-password \
  --set ingress.enabled=true

# For multi-tenant SaaS deployment
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secure-password \
  --set ingress.enabled=true \
  --set multiTenant.enabled=true \
  --set oidc.provider=auth0 \
  --set oidc.domain=yourdomain.auth0.com
  
# Enabling all new features
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secure-password \
  --set ingress.enabled=true \
  --set multiTenant.enabled=true \
  --set billing.enabled=true \
  --set billing.provider=gerencianet \
  --set billing.apiKey=your-api-key \
  --set oidc.enabled=true \
  --set oidc.provider=keycloak \
  --set oidc.domain=auth.yourdomain.com \
  --set orchestration.enabled=true \
  --set orchestration.inCluster=true
```

Adjust the `values.yaml` file or command line flags to set:
- Number of replicas for high availability
- Redis connection information and topology
- TLS configuration and auto-renewal options
- Multi-tenant isolation settings
- Resource limits and autoscaling parameters
- Integrations with billing and OIDC providers
- Kubernetes orchestration settings

## Multi‑region Deployments

When running VeloFlux in multiple regions for global availability, enable clustering and point all instances to the same Redis/Sentinel or Redis Cluster deployment. Requests will be routed to the closest healthy backend using GeoIP-based routing.

```yaml
cluster:
  enabled: true
  redis_address: "redis-sentinel:26379"
  redis_cluster_mode: true
  geo_routing: true
```

For multi-tenant SaaS scenarios, you can configure region-specific tenant routing:

```yaml
tenants:
  region_routing:
    enabled: true
    default_region: "us-east"
    tenant_region_mapping: 
      tenant-1: "eu-west"
      tenant-2: "ap-southeast"
```

## Advanced Configurations

### Billing and Payment Provider Integration

```yaml
billing:
  enabled: true
  # Choose between "stripe" or "gerencianet"
  provider: "stripe"
  apiKey: "sk_test_your_stripe_api_key"
  webhookSecret: "whsec_your_webhook_secret"
  # For automatic data export
  exportSchedule: "0 1 * * *"  # Cron format (daily at 01:00)
  exportFormat: "json"         # "json" or "csv"
```

### OIDC Provider Integration

```yaml
oidc:
  enabled: true
  # Supported providers: "keycloak", "auth0", "generic"
  provider: "keycloak"
  domain: "auth.example.com"
  clientId: "veloflux-client"
  clientSecret: "your-client-secret"
  # Claim mappings for tenant_id and roles
  claimMappings:
    tenantId: "tenant_id"
    roles: "roles"
```

### Kubernetes Orchestration for Dedicated Instances

```yaml
orchestration:
  enabled: true
  # Use in-cluster for deployments
  inCluster: true
  # Or specify a kubeconfig for external cluster
  # kubeConfigPath: "/path/to/kubeconfig"
  namespace: "veloflux-tenants"
  # Helm chart information for deployments
  helmReleaseName: "veloflux"
  chartPath: "./charts/veloflux"
  chartVersion: "1.0.0"
  # Defaults for tenant instances
  defaults:
    resourceLimits:
      cpuRequest: "100m"
      cpuLimit: "500m"
      memoryRequest: "128Mi"
      memoryLimit: "512Mi"
    autoscaling:
      enabled: true
      minReplicas: 1
      maxReplicas: 5
      targetCPUUtilization: 70
```

## Production SaaS Deployment

For production SaaS deployments, follow these additional steps:

1. **Database Planning**: Configure a highly-available Redis Cluster with appropriate memory and persistence settings
2. **User Authentication**: Set up OIDC integration with your identity provider
3. **Tenant Isolation**: Review the tenant isolation settings in `multitenant.md`
4. **Monitoring**: Configure Prometheus and Grafana for per-tenant metrics
5. **Backup Strategy**: Implement Redis snapshot or AOF backup procedures
6. **CDN Integration**: See `cdn_integration.md` for CDN configuration

## Rolling Updates

For zero-downtime updates, use the drain feature before upgrading:

```bash
# For admin-wide drain
curl -X POST http://<admin-endpoint>/admin/drain -H "Authorization: Bearer <token>"

# For tenant-specific drain (multi-tenant mode)
curl -X POST http://<admin-endpoint>/api/tenants/<tenant-id>/drain -H "Authorization: Bearer <token>"
```

Then use your orchestration platform to perform a rolling update with appropriate health checks:

```bash
# Using kubectl
kubectl rollout restart deployment/veloflux

# Using Helm
helm upgrade veloflux ./charts/veloflux --reuse-values
```

## Deployment Models

### Shared SaaS Instance

A single instance of VeloFlux manages multiple tenants with logical isolation:

```bash
helm install veloflux ./charts/veloflux \
  --set multiTenant.enabled=true \
  --set billing.enabled=true \
  --set oidc.enabled=true \
  --set orchestration.enabled=true
```

This model is resource-efficient and ideal for most SaaS use cases.

### Control Hub with Dedicated Instances

A hybrid model where a central control instance provisions dedicated instances for premium tenants:

```bash
# Install the control hub first
helm install veloflux-hub ./charts/veloflux \
  --set multiTenant.enabled=true \
  --set orchestration.enabled=true \
  --set orchestration.inCluster=true

# Dedicated instances are automatically provisioned
# by the orchestration system as needed
```

This model offers:
- Centralized management interface for all instances
- Complete isolation for premium clients
- Automatic traffic routing to the correct instance
- Independent scaling per client

### Performance and Resource Considerations

| Feature                        | Resource Impact      | Recommendations                                     |
|-------------------------------|---------------------|---------------------------------------------------|
| External OIDC                  | Low                 | Does not require significant additional resources  |
| Billing / Export               | Low-Medium          | Consider +256Mi memory for large report exports   |
| Kubernetes Orchestration      | Medium               | Add +500Mi memory and +200m CPU                   |

For production environments with all features enabled, we recommend at least:

```yaml
resources:
  requests:
    cpu: "500m"
    memory: "1Gi"
  limits:
    cpu: "2"
    memory: "2Gi"
```

## Monitoramento e Observabilidade

### Monitoramento dos recursos avançados

Para um monitoramento eficiente de todas as funcionalidades SaaS avançadas, configure dashboards dedicados:

#### Dashboard para Billing e Quotas

```yaml
# prometheus-billing-rules.yaml
groups:
- name: VeloFluxBilling
  rules:
  - record: veloflux:billing:daily_revenue
    expr: sum by (tenant_id) (veloflux_tenant_billing_amount_total{period="daily"})
  - record: veloflux:billing:quota_usage_percent
    expr: (veloflux_tenant_resource_usage / on(tenant_id, resource) veloflux_tenant_resource_limit) * 100
  - alert: QuotaLimitApproaching
    expr: veloflux:billing:quota_usage_percent > 80
    for: 10m
    labels:
      severity: warning
    annotations:
      summary: "Tenant {{ $labels.tenant_id }} approaching quota limit for {{ $labels.resource }}"
      description: "Current usage is {{ $value }}% of allowed limit"
```

#### Dashboard para Instâncias Kubernetes

```yaml
# prometheus-orchestration-rules.yaml
groups:
- name: VeloFluxOrchestration
  rules:
  - record: veloflux:orchestration:pod_health_ratio
    expr: sum by (tenant_id) (veloflux_orchestration_pods_ready) / sum by (tenant_id) (veloflux_orchestration_pods_total)
  - alert: TenantInstanceUnhealthy
    expr: veloflux:orchestration:pod_health_ratio < 0.5
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "Tenant {{ $labels.tenant_id }} instance health below 50%"
      description: "Check Kubernetes events and logs for details"
```

Configure grafana para visualizar estas métricas por tenant, período e recurso.

### Troubleshooting das funcionalidades SaaS

#### Debugging da integração de Billing

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na geração de checkout | Logs com `billing_checkout_error` | Verificar configuração da API do provedor de pagamento |
| Webhook não recebido | Status do webhook no painel do provedor | Checar firewall e configurações de SSL/TLS |
| Erro no relatório de uso | Logs com `billing_export_error` | Garantir permissões de escrita no diretório de export |

#### Diagnóstico de problemas OIDC

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na autenticação | Logs com `oidc_auth_error` | Verificar issuer URL e configurações de client |
| Mapeamento incorreto de claims | Logs com `oidc_claim_not_found` | Ajustar mapeamento no arquivo de configuração |
| Token rejeitado | Logs com `oidc_token_validation_error` | Checar configuração de JWKs e sincronização de horário |

#### Resolução de falhas na orquestração

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na criação de instância | Logs com `orchestration_deployment_error` | Verificar permissões no cluster e quotas de recursos |
| Autoscaling não funciona | `kubectl describe hpa -n tenant-namespace` | Checar configuração de metrics-server e valores de threshold |
| Falha no DNS | `kubectl get ingress -n tenant-namespace` | Verificar configuração de domínio e TLS |

### Logs estruturados

Configure seus sistemas de log (como ELK ou Loki) para utilizar estes campos específicos:

```json
{
  "level": "info",
  "timestamp": "2025-06-12T15:04:05Z",
  "tenant_id": "tenant123",
  "component": "billing_service",
  "event": "invoice_generated",
  "plan": "enterprise",
  "amount": 299.00,
  "currency": "USD",
  "metadata": {
    "invoice_id": "inv_123456",
    "period": "2025-05"
  }
}
```

## Segurança e Isolamento Avançado

Para garantir isolamento robusto entre tenants com instâncias dedicadas:

### Rede

Utilize Network Policies para restringir comunicação entre namespaces:

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: deny-tenant-cross-traffic
  namespace: tenant-1-namespace
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  ingress:
  - from:
    - podSelector: {}
```

### RBAC Kubernetes

Para equipes que gerenciam múltiplos tenants:

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: tenant-operator
  namespace: tenant-1-namespace
rules:
- apiGroups: ["", "apps", "autoscaling"]
  resources: ["deployments", "services", "pods", "horizontalpodautoscalers"]
  verbs: ["get", "list", "watch"]
```

### Auditoria de segurança

Execute verificações periódicas de segurança:

```bash
# Verificar exposição de segredos em instâncias tenant
kubectl get secrets -A -o json | jq '.items[] | select(.metadata.namespace | startswith("tenant-"))'

# Verificar configurações de rede
kubectl get networkpolicy -A

# Auditar permissões de service accounts
kubectl get rolebindings -A -o json | jq '.items[] | select(.subjects[].kind=="ServiceAccount")'
```

## Migração entre modelos de deployment

Para migrar um tenant de uma instância compartilhada para dedicada:

1. **Backup das configurações**
   ```bash
   kubectl exec -it veloflux-redis-0 -- redis-cli --raw DUMP "vf:config:tenant1" > tenant1_config.dump
   ```

2. **Deploy da instância dedicada**
   ```bash
   curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/deploy" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mode": "dedicated", "migrate": true}'
   ```

3. **Verificação da migração**
   ```bash
   curl -X GET "https://admin.example.com/api/tenants/tenant1/status" \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. **Atualização de DNS**
   ```bash
   curl -X PUT "https://admin.example.com/api/tenants/tenant1/domains" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"domains": ["api.tenant1.com"], "mode": "dedicated"}'
   ```

