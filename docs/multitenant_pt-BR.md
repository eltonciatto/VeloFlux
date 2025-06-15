# SaaS Multi-tenant - Status Completo

### O projeto **VeloFlux** funciona como uma plataforma **SaaS multi-tenant** completa e robusta com todas as camadas necessárias de governança (autenticação, isolamento lógico, RBAC, observabilidade), além de funcionalidades avançadas de faturamento, integração com provedores OIDC externos e orquestração Kubernetes. A arquitetura baseada em Redis como armazenamento principal permite alta performance e escalabilidade.

---

## Recursos SaaS Implementados

| Recurso                           | Status       | Implementação Atual                                             |
| --------------------------------- | ------------ | --------------------------------------------------------------- |
| **Autenticação & RBAC**           | ✅ Completo  | JWT com `tenant_id` e `role`, middleware de autorização         |
| **Isolamento de configuração**    | ✅ Completo  | Prefixos `vf:config:<tenant_id>` no Redis                       |
| **Rate-limit/WAF por tenant**     | ✅ Completo  | Configurações por tenant e níveis baseados em planos            |
| **Painel multi-tenant**           | ✅ Completo  | Seletor de tenant e controle de acesso baseado em roles         |
| **Observabilidade por tenant**    | ✅ Completo  | Métricas, logs e dashboards com `tenant_id` como label          |
| **On-boarding self-service**      | ✅ Completo  | Interface de registro e gerenciamento de tenants                |
| **Gerenciamento de usuários**     | ✅ Completo  | Adição/remoção de usuários com diferentes níveis de acesso      |
| **Faturamento / Cotas**           | ✅ Completo  | Gerenciamento de planos, cotas e integração com Stripe/Gerencianet |
| **API OIDC externa**              | ✅ Completo  | Integração com provedores externos (Keycloak/Auth0)             |
| **Orquestração Kubernetes**       | ✅ Completo  | Implantação, escalonamento e monitoramento de instâncias dedicadas |

## Recursos Técnicos Multi-cliente

| Recurso                        | Implementação                                 | Exemplo                                                    |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| **Vhosts / domínios**          | Cada tenant recebe um `route.host` distinto   | `cliente1.meuapp.com`, `cliente2.meuapp.com`               |
| **Algoritmos e peso**          | Configuráveis por tenant e rota               | Cliente A usa `least_conn`, Cliente B usa `round_robin`    |
| **Health-check**               | Configurável por backend                      | Tenant A `/api/health`; Tenant B `/healthz`                |
| **Rate-limit cluster-safe**    | Limite RPM configurável por tenant            | Configurações baseadas em planos (Free, Pro, Enterprise)   |
| **WAF (Coraza)**               | Proteção adaptável por tenant                 | Níveis basic/standard/strict baseados no plano contratado  |
| **Hot drain / rolling update** | Zero-downtime para todos os tenants           | Manutenção sem interrupção                                 |
| **Faturamento integrado**       | Exportação para sistemas de pagamento         | CSV/JSON para Stripe/Gerencianet com métricas por tenant    |
| **Autenticação federada**      | Integração com provedores OIDC externos       | Single Sign-On via Keycloak, Auth0, ou provedores genéricos |
| **Orquestração Kubernetes**    | Deploy/scale/monitor de instâncias dedicadas  | Instâncias isoladas por namespace com autoscaling          |

---

## Novos Recursos Detalhados

### 1. Faturamento e Cotas

O VeloFlux agora inclui um sistema completo de faturamento e cotas:

- **Exportação de dados de faturamento**: Geração de relatórios em CSV/JSON para integração com sistemas externos
- **Integração com provedores de pagamento**:
  - Stripe: Webhooks para eventos de pagamento e criação de assinatura
  - Gerencianet: Geração de boletos, PIX e notificações de pagamento
- **Planos e limitações por tier**:
  - Diferentes limites de recursos (requests/min, backends, domínios) por plano
  - Upgrade/downgrade de planos com ajuste automático de configurações
- **Monitoramento de uso**: Coleta e visualização de métricas de consumo por tenant

### 2. Autenticação OIDC Externa

Integração completa com provedores OIDC externos:

- **Provedores específicos**:
  - Keycloak: Mapeamento de grupos para roles no VeloFlux
  - Auth0: Integração de roles e metadata de tenant
- **Provedor OIDC genérico**: Suporte para qualquer serviço compatível com OpenID Connect
- **Fluxos de autenticação**:
  - Authorization Code Flow
  - PKCE para aplicações SPA
- **Mapeamento de claims**: Configuração flexível para extrair tenant_id e roles de tokens OIDC

### 3. Orquestração Kubernetes Avançada

Sistema completo para gerenciamento de instâncias dedicadas via Kubernetes:

- **Deployment dedicado por tenant**: Isolamento completo em namespaces separados
- **Integração Helm/Kubernetes**: Deploy via charts Helm ou APIs nativas do Kubernetes
- **Recursos configuráveis**:
  - CPU/memória ajustáveis por tenant
  - Configuração de Horizontal Pod Autoscaler (HPA)
  - Monitoramento detalhado de pods e deployments
- **Operações avançadas**:
  - Escalonamento manual/automático
  - Drenagem de instâncias para manutenção
  - Atualização sem downtime
- **Monitoramento detalhado**:
  - Métricas de utilização de recursos
  - Status detalhado de pods e eventos Kubernetes
  - Visualização de logs por tenant

---

## Arquitetura Multi-tenant

### Componentes Principais

1. **Sistema de autenticação**
   * Autenticação baseada em JWT com `tenant_id` e `role`
   * Roles configuradas: `owner`, `member`, `viewer`
   * Middleware de autorização por tenant e role
   * Integração com provedores OIDC externos

2. **Isolamento de dados e configuração**

   ```
   Redis Keys:
   vf:tenant:{tenant_id} → Dados do tenant
   vf:tenant:{tenant_id}:users → Conjunto de usuários do tenant
   vf:user:{user_id} → Dados do usuário
   vf:config:{tenant_id} → Configurações específicas do tenant
   vf:tenant:{tenant_id}:billing → Dados de faturamento do tenant
   vf:tenant:{tenant_id}:deployment → Status de deployment Kubernetes
   ```

3. **Interface multi-tenant**

   * Seletor de tenant na barra lateral
   * Visualização de dados filtrada por tenant
   * Painéis de controle específicos:
     * Faturamento e uso de recursos
     * Configurações de OIDC
     * Gerenciamento de orquestração Kubernetes

4. **Observabilidade**

   * Métricas isoladas por `tenant_id`
   * Logs com contexto de tenant
   * Dashboards com filtros por tenant
   * Monitoramento de recursos Kubernetes por tenant

5. **Faturamento e Monetização**

   * Tracking de uso por tenant
   * Exportação para sistemas externos (Stripe/Gerencianet)
   * Gerenciamento de planos e limites

6. **Orquestração Multi-tenant**

   * Gerenciamento de ciclo de vida de deployments
   * Configuração de recursos por tenant
   * Monitoramento de instâncias dedicadas

---

## Modelos de Implantação

### Modo Compartilhado (vários tenants, uma instância)

O modo padrão do VeloFlux, onde tenants compartilham a mesma instância com isolamento lógico. Ideal para a maioria dos casos de uso com baixo custo operacional.

### Modo Dedicado (um tenant, uma instância)

Para clientes que precisam de isolamento total, recursos dedicados ou alta customização:

```bash
# Via interface de administração - recomendado
# A orquestração automatizada gerencia todo o ciclo de vida do deployment

# Via Helm manual - se necessário
helm install velo-cliente1 veloflux/veloflux \
  --set tenantId=cliente1 \
  --set redis.auth.password=**** \
  --namespace cliente1-namespace \
  --set resources.requests.cpu=200m \
  --set autoscaling.enabled=true
```

**Características do modo dedicado:**
* Isolamento completo em namespaces separados
* Recursos dedicados e configuráveis (CPU/RAM)
* Escalonamento automático independente
* Atualização de versões sob demanda
* Domínios personalizados com TLS

---

## Exemplos de API e Uso Avançado

### Faturamento e Cotas

#### API de integração com Gerencianet

```bash
# Criar checkout para um tenant específico
curl -X POST "https://admin.example.com/api/tenants/tenant1/billing/checkout" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "plan": "enterprise",
    "payment_method": "credit_card",
    "billing_email": "financeiro@tenant1.com",
    "callback_url": "https://tenant1.com/payment/callback"
  }'

# Obter histórico de faturas
curl -X GET "https://admin.example.com/api/tenants/tenant1/billing/invoices" \
  -H "Authorization: Bearer SEU_TOKEN"

# Gerar relatório de uso
curl -X GET "https://admin.example.com/api/tenants/tenant1/billing/usage/report?format=csv&period=last-month" \
  -H "Authorization: Bearer SEU_TOKEN"
```

#### Cotas e Limites

O VeloFlux aplica limites configuráveis em dois níveis:

1. **Configuração estática nos planos**
   * Limites de taxa de requisições
   * Número máximo de rotas/backends
   * Nível de proteção WAF
   * Acesso a recursos premium (como orquestração dedicada)

2. **Limites dinâmicos monitorados**
   * Uso de largura de banda
   * Total de requisições
   * Tempo de CPU e uso de memória

Quando um tenant atinge seus limites, o comportamento pode ser:
* Log de alerta (padrão)
* Throttling automático
* Bloqueio de novas configurações
* Notificação para upgrade

### Autenticação OIDC Externa

#### Mapeamento de Claims e Roles

O VeloFlux suporta mapeamento flexível de claims de provedores OIDC:

```json
{
  "oidc": {
    "provider": "keycloak",
    "claim_mappings": {
      "tenant_id": "resource_access.veloflux.tenant_id",
      "roles": "resource_access.veloflux.roles",
      "email": "email"
    },
    "role_mappings": {
      "admin": "owner",
      "manager": "member",
      "user": "viewer"
    }
  }
}
```

#### Fluxo de Autenticação PKCE

Para aplicações SPA, o VeloFlux suporta o fluxo PKCE:

```javascript
// Exemplo de código frontend
async function loginWithPKCE() {
  const codeVerifier = generateRandomString(128);
  const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);
  
  // Armazenar code verifier no local storage
  localStorage.setItem('code_verifier', codeVerifier);
  
  // Redirecionar para endpoint de autorização
  const authUrl = new URL('https://auth.example.com/oauth2/authorize');
  authUrl.searchParams.append('client_id', 'veloflux-client');
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('redirect_uri', 'https://admin.example.com/callback');
  authUrl.searchParams.append('code_challenge', codeChallenge);
  authUrl.searchParams.append('code_challenge_method', 'S256');
  
  window.location.href = authUrl.toString();
}
```

### Orquestração Kubernetes Avançada

#### Ciclo de Vida de Instâncias Dedicadas

O ciclo de vida completo de uma instância dedicada inclui:

1. **Provisionamento**
   * Criação de namespace dedicado
   * Deploy de configuração específica do tenant
   * Configuração de rede e domínios

2. **Monitoramento e operação**
   * Coleta de métricas específicas
   * Escalonamento automático baseado em carga
   * Logs com contexto de tenant

3. **Manutenção**
   * Atualizações sem downtime (rolling updates)
   * Drenagem controlada para manutenção
   * Reconfiguração de recursos (CPU/RAM)

4. **Desativação**
   * Drenagem de tráfego
   * Backup de configurações
   * Remoção de recursos

#### Exemplo de Observação de Eventos em Tempo Real (WebSockets)

O VeloFlux fornece um endpoint WebSocket para monitorar eventos em tempo real:

```javascript
// Exemplo de cliente WebSocket frontend
const socket = new WebSocket('wss://admin.example.com/api/tenants/tenant1/orchestration/events');

socket.onopen = () => {
  console.log('Conectado aos eventos de orquestração');
  // Autenticar WebSocket
  socket.send(JSON.stringify({
    type: 'auth',
    token: 'SEU_JWT_TOKEN'
  }));
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  
  switch(data.type) {
    case 'pod.created':
    case 'pod.deleted':
    case 'deployment.updated':
    case 'autoscaling.triggered':
    case 'health.changed':
      // Atualizar UI baseado no tipo de evento
      updateOrchestrationDashboard(data);
      break;
  }
};
```

Esta integração em tempo real permite painéis de administração dinâmicos com atualizações imediatas sobre o estado da infraestrutura.

---

### Conclusão

O VeloFlux evoluiu para uma plataforma SaaS completa com:

1. **Autenticação robusta e RBAC por tenant**
2. **Isolamento completo via prefixos Redis**
3. **Rate-limit/WAF/métricas configurados por tenant** 
4. **Interface de administração multi-tenant**
5. **Sistema de faturamento com exportação para provedores de pagamento**
6. **Autenticação federada via provedores OIDC externos**
7. **Orquestração Kubernetes para instâncias dedicadas**

A implementação atual mantém o núcleo de balanceamento e hot-drain original enquanto adiciona todas as capacidades SaaS necessárias para operação em produção em diversos modelos de negócio.
