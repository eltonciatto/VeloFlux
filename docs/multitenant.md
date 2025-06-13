# SaaS Multitenant - Status Atual

### O projeto **VeloFlux** agora funciona como uma verdadeira plataforma **SaaS multitenant** com todas as camadas necessárias de governança (autenticação, isolamento lógico, RBAC e observabilidade). A arquitetura baseada em Redis como armazenamento principal permite alta performance e escalabilidade.

---

## Recursos SaaS já implementados

| Recurso                           | Status       | Implementação atual                                             |
| --------------------------------- | ------------ | --------------------------------------------------------------- |
| **Autenticação & RBAC**           | ✅ Completo  | JWT com `tenant_id` e `role`, middleware de autorização         |
| **Isolamento de config**          | ✅ Completo  | Prefixos `vf:config:<tenant_id>` no Redis                       |
| **Rate-limit/WAF por tenant**     | ✅ Completo  | Configurações por tenant e níveis baseados em planos            |
| **Painel multi-tenant**           | ✅ Completo  | Selector de tenant e controle de acesso baseado em roles        |
| **Observabilidade por tenant**    | ✅ Completo  | Métricas, logs e dashboards com `tenant_id` como label          |
| **On-boarding self-service**      | ✅ Completo  | Interface de registro e gerenciamento de tenants                |
| **Gerenciamento de usuários**     | ✅ Completo  | Adição/remoção de usuários com diferentes níveis de acesso      |

## Recursos técnicos multi-cliente

| Recurso                        | Implementação                                 | Exemplo                                                    |
| ------------------------------ | --------------------------------------------- | ---------------------------------------------------------- |
| **Vhosts / domínios**          | Cada tenant recebe um `route.host` distinto   | `cliente1.myapp.com`, `cliente2.myapp.com`                 |
| **Algoritmos e peso**          | Configuráveis por tenant e rota               | Cliente A usa `least_conn`, Cliente B usa `round_robin`    |
| **Health-check**               | Configurável por back-end                     | Tenant A `/api/health`; Tenant B `/healthz`                |
| **Rate-limit cluster-safe**    | Limite RPM configurável por tenant            | Configurações baseadas em planos (Free, Pro, Enterprise)   |
| **WAF (Coraza)**               | Proteção adaptável por tenant                 | Níveis basic/standard/strict baseados no plano contratado  |
| **Hot drain / rolling update** | Zero-downtime para todos os tenants           | Manutenção sem interrupção                                 |

---

## Funcionalidades pendentes

| Tema                       | Status           | O que falta                                                  |
| -------------------------- | ---------------- | ------------------------------------------------------------ |
| **Billing / quotas**       | 🔶 Parcial      | Exportação para sistemas de billing (Stripe/Gerencianet)     |
| **API OIDC externa**       | 🔶 Parcial      | Integração com provedores externos (Keycloak/Auth0)          |
| **Orquestração avançada**  | 🔶 Parcial      | Integração completa com Kubernetes para instâncias dedicadas |

---

## Arquitetura Multi-tenant

### Componentes Principais

1. **Sistema de autenticação**
   * Autenticação baseada em JWT com `tenant_id` e `role`
   * Roles configuradas: `owner`, `member`, `viewer`
   * Middleware de autorização por tenant e role

2. **Isolamento de dados e configuração**

   ```
   Redis Keys:
   vf:tenant:{tenant_id} → Dados do tenant
   vf:tenant:{tenant_id}:users → Conjunto de usuários do tenant
   vf:user:{user_id} → Dados do usuário
   vf:config:{tenant_id} → Configurações específicas do tenant
   ```

3. **Interface multi-tenant**

   * Selector de tenant na barra lateral
   * Visualização de dados filtrada por tenant
   * Controle de acesso baseado em role

4. **Observabilidade**

   * Métricas isoladas por `tenant_id`
   * Logs com contexto de tenant
   * Dashboards com filtros por tenant

---

## Implantação flexível

### Modo compartilhado (vários tenants, uma instância)

O modo padrão atual do VeloFlux, onde tenants compartilham a mesma instância com isolamento lógico.

### Modo dedicado (um tenant, uma instância)

Para clientes que precisam de isolamento total:

```bash
helm install velo-cliente1 veloflux/veloflux --set tenantId=cliente1 --set redis.auth.password=****
helm install velo-cliente2 veloflux/veloflux --set tenantId=cliente2
```

*Prós*: isolamento total; clientes podem escolher a própria versão.
*Contras*: consome mais CPU/RAM e requer mais nós.

---

### Conclusão

O VeloFlux evoluiu de um simples balanceador multi-domínio para uma plataforma SaaS completa com:

1. **Autenticação robusta e RBAC por tenant**
2. **Isolamento completo via prefixos Redis**
3. **Rate-limit/WAF/metrics configurados por tenant**
4. **Interface de administração multi-tenant**

A implementação atual mantém o core de balanceamento e hot-drain original enquanto adiciona as capacidades SaaS necessárias para operação em produção.
