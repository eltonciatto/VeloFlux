# VeloFlux SaaS: Guia Rápido

Este guia oferece uma visão geral das funcionalidades SaaS avançadas implementadas no VeloFlux e instruções para ativação e uso.

## Recursos SaaS Implementados

O VeloFlux evoluiu para uma plataforma SaaS completa, incluindo:

### Billing e Quotas

- **Integrações de pagamento**
  - Stripe: Assinaturas, cobranças e webhooks
  - Gerencianet: PIX, boletos e notificações
- **Exportação de dados**
  - Formatos: CSV e JSON
  - Programável via cron ou sob demanda
  - Métricas granulares por tenant
- **Gestão de planos**
  - Free, Pro e Enterprise com limites diferenciados
  - Upgrades/downgrades com ajuste automático de recursos

### Autenticação OIDC Externa

- **Provedores suportados**
  - Keycloak: Mapeamento de grupos para roles
  - Auth0: Integração com metadata e roles 
  - Provedor genérico: Configurável para qualquer serviço compatível
- **Fluxos de autenticação**
  - Authorization Code Flow
  - PKCE para aplicações SPA
- **Mapeamento flexível de claims**
  - Extração de tenant_id e roles de qualquer estrutura de token
  - Suporte a múltiplos provedores simultaneamente

### Orquestração Kubernetes

- **Provisionamento de instâncias**
  - Instâncias dedicadas por tenant em namespaces isolados
  - Deploy via Helm ou APIs nativas do Kubernetes
  - Domains customizados com TLS
- **Gerenciamento de recursos**
  - CPU/memória configuráveis por tenant
  - Autoscaling via HPA
  - Monitoramento de pods e eventos
- **Operações avançadas**
  - Drenagem para manutenção
  - Rolling updates sem downtime
  - Monitoramento em tempo real

## Guia Rápido de Implantação

### 1. Preparação do ambiente

```bash
# Criar namespace dedicado
kubectl create namespace veloflux

# Criar secrets para as credenciais externas
kubectl create secret generic veloflux-oidc \
  --from-literal=client-id=your-client-id \
  --from-literal=client-secret=your-client-secret \
  -n veloflux

kubectl create secret generic veloflux-billing \
  --from-literal=stripe-api-key=your-stripe-key \
  --from-literal=gerencianet-client-id=your-gerencianet-id \
  --from-literal=gerencianet-client-secret=your-gerencianet-secret \
  -n veloflux
```

### 2. Instalação via Helm com todas as funcionalidades

```bash
helm install veloflux ./charts/veloflux \
  --namespace veloflux \
  --values values.yaml
```

**Exemplo de values.yaml:**

```yaml
multiTenant:
  enabled: true

redis:
  auth:
    password: "your-redis-password"

billing:
  enabled: true
  provider: "stripe"  # ou "gerencianet"
  existingSecret: "veloflux-billing"
  export:
    enabled: true
    formats: ["json", "csv"]
    schedule: "0 1 * * *"  # Diariamente às 01:00

oidc:
  enabled: true
  provider: "keycloak"  # ou "auth0", "generic"
  issuerUrl: "https://auth.example.com/realms/veloflux"
  existingSecret: "veloflux-oidc"
  claimMappings:
    tenantId: "resource_access.veloflux.tenant_id"
    roles: "resource_access.veloflux.roles"

orchestration:
  enabled: true
  inCluster: true
  namespace: "veloflux-tenants"
  defaults:
    resourceLimits:
      cpuRequest: "100m"
      memoryRequest: "128Mi"
    autoscaling:
      enabled: true
      minReplicas: 1
      maxReplicas: 5
```

### 3. Acessar o painel de administração

```bash
# Expor o painel localmente
kubectl port-forward svc/veloflux-admin 9000:9000 -n veloflux

# Obter senha inicial de administrador
kubectl get secret veloflux-admin-credentials -n veloflux -o jsonpath="{.data.password}" | base64 -d
```

Acesse http://localhost:9000 no navegador e faça login com:
- Usuário: `admin`
- Senha: (obtida no comando anterior)

### 4. Criar e configurar um tenant

#### Via API:

```bash
# Obter token de administrador
TOKEN=$(curl -s -X POST "http://localhost:9000/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"sua-senha-aqui"}' | jq -r '.token')

# Criar tenant
curl -X POST "http://localhost:9000/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tenant1",
    "name": "Meu Primeiro Tenant",
    "plan": "enterprise",
    "owner_email": "admin@tenant.com"
  }'
```

#### Via Interface Web:

1. Acesse o menu **Tenants > Add Tenant**
2. Preencha os dados do tenant e selecione o plano
3. Acesse as configurações avançadas do tenant para:
   - Configurar billing e informações de pagamento
   - Integrar com provedor OIDC externo
   - Configurar e implantar instância dedicada

### 5. Configurar orquestração para um tenant

```bash
# Configurar instância dedicada
curl -X PUT "http://localhost:9000/api/tenants/tenant1/orchestration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dedicated",
    "resource_limits": {
      "cpu_request": "500m",
      "cpu_limit": "1000m",
      "memory_request": "512Mi",
      "memory_limit": "1Gi"
    },
    "autoscaling": {
      "enabled": true,
      "min_replicas": 2,
      "max_replicas": 5,
      "target_cpu_utilization": 70
    },
    "custom_domains": ["api.tenant1.example.com"]
  }'

# Implantar instância
curl -X POST "http://localhost:9000/api/tenants/tenant1/orchestration/deploy" \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Monitoramento e observabilidade

```bash
# Verificar status da instância
curl -X GET "http://localhost:9000/api/tenants/tenant1/orchestration/status" \
  -H "Authorization: Bearer $TOKEN"

# Obter métricas de uso para billing
curl -X GET "http://localhost:9000/api/tenants/tenant1/billing/usage" \
  -H "Authorization: Bearer $TOKEN"
```

Para monitoramento avançado, configure o Prometheus e Grafana:

```yaml
# prometheus-values.yaml
serviceMonitors:
  - name: veloflux
    selector:
      matchLabels:
        app: veloflux
    endpoints:
      - port: metrics
        interval: 15s
    namespaceSelector:
      matchNames:
        - veloflux
        - veloflux-tenants
```

## Personalização por Caso de Uso

### Caso 1: SaaS Multi-tenant Compartilhado

Ideal para:
- Startups com múltiplos clientes pequenos
- Custos operacionais reduzidos
- Necessidades básicas de isolamento

Configuração:
```yaml
multiTenant:
  enabled: true
  defaultMode: "shared"

billing:
  enabled: true
  provider: "stripe"

oidc:
  enabled: true
  provider: "auth0"

orchestration:
  enabled: false  # Desativado, todos os tenants compartilham a mesma instância
```

### Caso 2: Hybrid SaaS (compartilhado + dedicado)

Ideal para:
- Empresas com clientes de diferentes tamanhos
- Modelo freemium com upgrade para instância dedicada
- Necessidade de isolamento para clientes enterprise

Configuração:
```yaml
multiTenant:
  enabled: true
  defaultMode: "shared"
  premiumMode: "dedicated"

billing:
  enabled: true
  provider: "stripe"
  plans:
    enterprise:
      orchestrationMode: "dedicated"

orchestration:
  enabled: true
  inCluster: true
  namespace: "veloflux-tenants"
```

### Caso 3: Instituições Financeiras / Altamente Reguladas

Ideal para:
- Empresas que precisam de máximo isolamento
- Ambientes com compliance rigoroso
- Requisitos específicos de região/país

Configuração:
```yaml
multiTenant:
  enabled: true
  defaultMode: "dedicated"

billing:
  enabled: true
  provider: "gerencianet"  # Para suporte a métodos locais como PIX

orchestration:
  enabled: true
  inCluster: true
  networkPolicies:
    enabled: true
    strictIsolation: true
  podSecurityContext:
    enabled: true
  resources:
    guaranteedQuality: true
```

## Checklist de Produção

Antes de ir para produção, verifique:

- [ ] Redis configurado com alta disponibilidade e backups
- [ ] Certificados TLS configurados para todos os endpoints
- [ ] Secrets gerenciados de forma segura (rotação automática)
- [ ] Monitoramento e alertas configurados
- [ ] Testes de carga e escalabilidade realizados
- [ ] Processo de backup e restore testado
- [ ] Rate limiting configurado para proteção da API
- [ ] Webhooks de billing testados em ambiente de homologação
- [ ] Plan de DR (Disaster Recovery) documentado

## Recursos Adicionais

- [Documentação Completa](docs/)
- [Guia de Troubleshooting](docs/troubleshooting.md)
- [Referência de API](docs/api.md)
- [Guia de Configuração](docs/configuration.md)
- [Guia de Testes Avançados](docs/advanced_saas_testing.md)

## Suporte

Para suporte, consulte os canais disponíveis no repositório principal ou entre em contato com a equipe de manutenção.

## Opções de Deployment SaaS

Para implantar o VeloFlux SaaS em ambiente de produção, temos várias opções:

- **Kubernetes/Helm**: Ideal para implantações escaláveis em clusters Kubernetes ([detalhes](deployment.md#kubernetes--helm))
- **Coolify**: Plataforma simples para configurar e gerenciar o VeloFlux SaaS ([guia detalhado](saas_coolify_deployment.md))
