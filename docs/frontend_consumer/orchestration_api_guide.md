# Guia de Consumo da API de Orquestração - Frontend

Este guia documenta como consumir todas as funcionalidades da API de orquestração do VeloFlux no frontend.

## Visão Geral

A API de orquestração permite gerenciar a implantação, escalonamento e configuração de recursos para tenants, incluindo suporte a:

- Configuração de orquestração
- Status de implantação
- Deploy/Drain de instâncias
- Escalonamento manual e automático
- Gerenciamento de recursos

## Endpoints Disponíveis

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/tenants/{tenant_id}/orchestration` | Obter configuração de orquestração |
| PUT | `/api/tenants/{tenant_id}/orchestration` | Definir configuração de orquestração |
| GET | `/api/tenants/{tenant_id}/orchestration/status` | Obter status de implantação |
| GET | `/api/tenants/{tenant_id}/orchestration/detailed_status` | Obter status detalhado |
| POST | `/api/tenants/{tenant_id}/orchestration/deploy` | Iniciar implantação |
| POST | `/api/tenants/{tenant_id}/orchestration/drain` | Drenar instância |
| POST | `/api/tenants/{tenant_id}/orchestration/scale` | Escalonar instância |
| PUT | `/api/tenants/{tenant_id}/orchestration/autoscale` | Configurar autoescalonamento |
| PUT | `/api/tenants/{tenant_id}/orchestration/resources` | Atualizar limites de recursos |

## Autenticação

Todos os endpoints requerem autenticação via token JWT no cookie `auth_token` ou header `Authorization: Bearer <token>`.

## Estruturas de Dados

### TenantOrchestratorConfig

```typescript
interface TenantOrchestratorConfig {
  tenant_id: string;
  mode: "shared" | "dedicated";
  dedicated_namespace?: string;
  autoscaling_enabled: boolean;
  min_replicas: number;
  max_replicas: number;
  target_cpu_utilization: number;
  resource_limits: ResourceLimits;
}

interface ResourceLimits {
  cpu_request: string;    // ex: "100m"
  cpu_limit: string;      // ex: "200m"
  memory_request: string; // ex: "128Mi"
  memory_limit: string;   // ex: "256Mi"
}
```

### DeploymentStatus

```typescript
interface DeploymentStatus {
  tenant_id: string;
  mode: "shared" | "dedicated";
  status: string;
  namespace: string;
  version: string;
}

interface DetailedDeploymentStatus extends DeploymentStatus {
  replicas?: number;
  ready_replicas?: number;
  conditions?: Condition[];
  last_updated?: string;
}

interface Condition {
  type: string;
  status: string;
  reason?: string;
  message?: string;
}
```

## Próximos Passos

Consulte os arquivos específicos para cada funcionalidade:

- [Configuração](./orchestration_configuration.md) - Gerenciar configurações de orquestração
- [Status e Monitoramento](./orchestration_status.md) - Monitorar status de implantação
- [Deploy e Lifecycle](./orchestration_deployment.md) - Gerenciar ciclo de vida de implantações
- [Escalonamento](./orchestration_scaling.md) - Escalonamento manual e automático
- [Recursos](./orchestration_resources.md) - Gerenciamento de recursos
- [Exemplos Práticos](./orchestration_examples.md) - Componentes React completos
- [Tratamento de Erros](./orchestration_error_handling.md) - Como tratar erros
