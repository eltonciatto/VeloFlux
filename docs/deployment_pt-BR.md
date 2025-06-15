# Guia de Implantação

Este documento descreve cenários comuns de implantação para o VeloFlux em contextos de single-tenant e multi-tenant SaaS, incluindo recursos de IA/ML.

## Opções de Implantação

O VeloFlux oferece múltiplos métodos de implantação para atender diferentes necessidades:
- **Docker Compose**: Desenvolvimento local simples e testes
- **Kubernetes/Helm**: Implantações escaláveis prontas para produção
- **Coolify**: Implantação PaaS auto-hospedada simplificada (veja [Guia de Implantação Coolify](coolify_deployment.md))

## Docker Compose

Para desenvolvimento local ou implantações single-tenant, o `docker-compose.yml` fornecido inicia o VeloFlux, Redis e serviços auxiliares.

```bash
# Implantação padrão
docker-compose up -d

# Implantar com dashboard de IA
docker-compose up -d
npm install && npm run dev  # Em um terminal separado para frontend
```

## Implantação do Dashboard de IA/ML

O dashboard de IA requer Node.js e pode ser implantado junto com o serviço principal do VeloFlux:

### Implantação de Desenvolvimento
```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Acessar dashboard em http://localhost:3000
```

### Implantação de Produção
```bash
# Build para produção
npm run build

# Servir com um servidor web (nginx, apache, etc.)
# Ou usar um gerenciador de processo Node.js como PM2
npm install -g pm2
pm2 start npm --name "veloflux-dashboard" -- run preview
```

## Kubernetes / Helm

Um chart Helm pronto para produção está disponível no diretório `charts/`. Exemplo de uso:

```bash
# Para instalação single-tenant
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=senha-segura \
  --set ingress.enabled=true

# Para implantação SaaS multi-tenant
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=senha-segura \
  --set ingress.enabled=true \
  --set multiTenant.enabled=true \
  --set oidc.provider=auth0 \
  --set oidc.domain=seudominio.auth0.com
  
# Habilitando todos os recursos incluindo IA/ML
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=senha-segura \
  --set ingress.enabled=true \
  --set multiTenant.enabled=true \
  --set billing.enabled=true \
  --set billing.provider=gerencianet \
  --set billing.apiKey=sua-api-key \
  --set oidc.enabled=true \
  --set oidc.provider=keycloak \
  --set oidc.domain=auth.seudominio.com \
  --set orchestration.enabled=true \
  --set orchestration.inCluster=true \
  --set ai.enabled=true \
  --set ai.intelligentRouting=true \
  --set ai.predictiveScaling=true \
  --set ai.anomalyDetection=true
```

Ajuste o arquivo `values.yaml` ou flags da linha de comando para configurar:
- Número de réplicas para alta disponibilidade
- Informações de conexão e topologia do Redis
- Configuração TLS e opções de renovação automática
- Configurações de isolamento multi-tenant
- Limites de recursos e parâmetros de autoscaling
- Integrações com provedores de faturamento e OIDC
- Configurações de orquestração Kubernetes

## Implantações Multi-região

Ao executar o VeloFlux em múltiplas regiões para disponibilidade global, habilite clustering e aponte todas as instâncias para o mesmo deployment Redis/Sentinel ou Redis Cluster. Requisições serão roteadas para o backend saudável mais próximo usando roteamento baseado em GeoIP.

```yaml
cluster:
  enabled: true
  redis_address: "redis-sentinel:26379"
  redis_cluster_mode: true
  geo_routing: true
```

Para cenários SaaS multi-tenant, você pode configurar roteamento de tenant específico por região:

```yaml
tenants:
  region_routing:
    enabled: true
    default_region: "us-east"
    tenant_region_mapping: 
      tenant-1: "eu-west"
      tenant-2: "ap-southeast"
```

## Configurações Avançadas

### Integração com Provedores de Faturamento e Pagamento

```yaml
billing:
  enabled: true
  # Escolha entre "stripe" ou "gerencianet"
  provider: "stripe"
  apiKey: "sk_test_sua_chave_api_stripe"
  webhookSecret: "whsec_seu_webhook_secret"
  # Para exportação automática de dados
  exportSchedule: "0 1 * * *"  # Formato cron (diariamente às 01:00)
  exportFormat: "json"         # "json" ou "csv"
```

### Integração com Provedor OIDC

```yaml
oidc:
  enabled: true
  # Provedores suportados: "keycloak", "auth0", "generic"
  provider: "keycloak"
  domain: "auth.example.com"
  clientId: "veloflux-client"
  clientSecret: "seu-client-secret"
  # Mapeamentos de claims para tenant_id e roles
  claimMappings:
    tenantId: "tenant_id"
    roles: "roles"
```

### Orquestração Kubernetes para Instâncias Dedicadas

```yaml
orchestration:
  enabled: true
  # Use in-cluster para implantações
  inCluster: true
  # Ou especifique um kubeconfig para cluster externo
  # kubeConfigPath: "/path/to/kubeconfig"
  namespace: "veloflux-tenants"
  # Informações do chart Helm para implantações
  helmReleaseName: "veloflux"
  chartPath: "./charts/veloflux"
  chartVersion: "1.0.0"
  # Padrões para instâncias de tenant
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

## Implantação SaaS de Produção

Para implantações SaaS de produção, siga estes passos adicionais:

1. **Planejamento de Banco de Dados**: Configure um Redis Cluster de alta disponibilidade com configurações apropriadas de memória e persistência
2. **Autenticação de Usuário**: Configure integração OIDC com seu provedor de identidade
3. **Isolamento de Tenant**: Revise as configurações de isolamento de tenant em `multitenant.md`
4. **Monitoramento**: Configure Prometheus e Grafana para métricas por tenant
5. **Estratégia de Backup**: Implemente procedimentos de backup de snapshot Redis ou AOF
6. **Integração CDN**: Veja `cdn_integration.md` para configuração de CDN

## Atualizações Contínuas

Para atualizações sem tempo de inatividade, use o recurso de drain antes de atualizar:

```bash
# Para drain geral do admin
curl -X POST http://<admin-endpoint>/admin/drain -H "Authorization: Bearer <token>"

# Para drain específico de tenant (modo multi-tenant)
curl -X POST http://<admin-endpoint>/api/tenants/<tenant-id>/drain -H "Authorization: Bearer <token>"
```

Então use sua plataforma de orquestração para realizar uma atualização contínua com verificações de saúde apropriadas:

```bash
# Usando kubectl
kubectl rollout restart deployment/veloflux

# Usando Helm
helm upgrade veloflux ./charts/veloflux --reuse-values
```

## Modelos de Implantação

### Instância SaaS Compartilhada

Uma única instância do VeloFlux gerencia múltiplos tenants com isolamento lógico:

```bash
helm install veloflux ./charts/veloflux \
  --set multiTenant.enabled=true \
  --set billing.enabled=true \
  --set oidc.enabled=true \
  --set orchestration.enabled=true
```

Este modelo é eficiente em recursos e ideal para a maioria dos casos de uso SaaS.

### Hub de Controle com Instâncias Dedicadas

Um modelo híbrido onde uma instância de controle central provisiona instâncias dedicadas para tenants premium:

```bash
# Instalar o hub de controle primeiro
helm install veloflux-hub ./charts/veloflux \
  --set multiTenant.enabled=true \
  --set orchestration.enabled=true \
  --set orchestration.inCluster=true

# Instâncias dedicadas são automaticamente provisionadas
# pelo sistema de orquestração conforme necessário
```

Este modelo oferece:
- Interface de gerenciamento centralizada para todas as instâncias
- Isolamento completo para clientes premium
- Roteamento automático de tráfego para a instância correta
- Escalamento independente por cliente

### Considerações de Desempenho e Recursos

| Recurso                        | Impacto nos Recursos | Recomendações                                        |
|--------------------------------|---------------------|-----------------------------------------------------|
| OIDC Externo                   | Baixo               | Não requer recursos adicionais significativos      |
| Faturamento / Exportação       | Baixo-Médio         | Considere +256Mi memória para exportações grandes  |
| Orquestração Kubernetes        | Médio               | Adicione +500Mi memória e +200m CPU               |

Para ambientes de produção com todos os recursos habilitados, recomendamos pelo menos:

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

### Monitoramento dos Recursos Avançados

Para monitoramento eficiente de todas as funcionalidades SaaS avançadas, configure dashboards dedicados:

#### Dashboard para Faturamento e Cotas

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
      summary: "Tenant {{ $labels.tenant_id }} se aproximando do limite de cota para {{ $labels.resource }}"
      description: "Uso atual é {{ $value }}% do limite permitido"
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
      summary: "Instância do tenant {{ $labels.tenant_id }} com saúde abaixo de 50%"
      description: "Verifique eventos e logs do Kubernetes para detalhes"
```

Configure o Grafana para visualizar essas métricas por tenant, período e recurso.

### Troubleshooting das Funcionalidades SaaS

#### Debugging da Integração de Faturamento

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na geração de checkout | Logs com `billing_checkout_error` | Verificar configuração da API do provedor de pagamento |
| Webhook não recebido | Status do webhook no painel do provedor | Checar firewall e configurações de SSL/TLS |
| Erro no relatório de uso | Logs com `billing_export_error` | Garantir permissões de escrita no diretório de export |

#### Diagnóstico de Problemas OIDC

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na autenticação | Logs com `oidc_auth_error` | Verificar issuer URL e configurações de client |
| Mapeamento incorreto de claims | Logs com `oidc_claim_not_found` | Ajustar mapeamento no arquivo de configuração |
| Token rejeitado | Logs com `oidc_token_validation_error` | Checar configuração de JWKs e sincronização de horário |

#### Resolução de Falhas na Orquestração

| Problema | Verificações | Solução |
|----------|-------------|----------|
| Falha na criação de instância | Logs com `orchestration_deployment_error` | Verificar permissões no cluster e cotas de recursos |
| Autoscaling não funciona | `kubectl describe hpa -n tenant-namespace` | Checar configuração de metrics-server e valores de threshold |
| Falha no DNS | `kubectl get ingress -n tenant-namespace` | Verificar configuração de domínio e TLS |

### Logs Estruturados

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
  "currency": "BRL",
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

### Auditoria de Segurança

Execute verificações periódicas de segurança:

```bash
# Verificar exposição de segredos em instâncias tenant
kubectl get secrets -A -o json | jq '.items[] | select(.metadata.namespace | startswith("tenant-"))'

# Verificar configurações de rede
kubectl get networkpolicy -A

# Auditar permissões de service accounts
kubectl get rolebindings -A -o json | jq '.items[] | select(.subjects[].kind=="ServiceAccount")'
```

## Migração Entre Modelos de Deployment

Para migrar um tenant de uma instância compartilhada para dedicada:

1. **Backup das Configurações**
   ```bash
   kubectl exec -it veloflux-redis-0 -- redis-cli --raw DUMP "vf:config:tenant1" > tenant1_config.dump
   ```

2. **Deploy da Instância Dedicada**
   ```bash
   curl -X POST "https://admin.example.com/api/tenants/tenant1/orchestration/deploy" \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"mode": "dedicated", "migrate": true}'
   ```

3. **Verificação da Migração**
   ```bash
   curl -X GET "https://admin.example.com/api/tenants/tenant1/status" \
     -H "Authorization: Bearer SEU_TOKEN"
   ```

4. **Atualização de DNS**
   ```bash
   curl -X PUT "https://admin.example.com/api/tenants/tenant1/domains" \
     -H "Authorization: Bearer SEU_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"domains": ["api.tenant1.com"], "mode": "dedicated"}'
   ```
