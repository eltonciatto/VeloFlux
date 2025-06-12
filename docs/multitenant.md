# SaaS Multitenant Roadmap

### O projeto **VeloFlux 0.0.3** já consegue atender **vários clientes ao mesmo tempo** ─ mas, para operar como **SaaS multitenant** de verdade, você precisará adicionar algumas camadas de governança (auth, isolamento lógico, billing). A boa notícia: a arquitetura atual (roteamento declarativo + Redis compartilhado + API Admin) é um alicerce sólido; basta estender.

---

## O que *já* cobre vários clientes

| Recurso                        | Como usar hoje                               | Exemplo                                                    |
| ------------------------------ | -------------------------------------------- | ---------------------------------------------------------- |
| **Vhosts / domínios**          | cada cliente recebe um `route.host` distinto | `cliente1.myapp.com`, `cliente2.myapp.com`                 |
| **Algoritmos e peso**          | podem ser definidos por rota                 | Cliente A usa `least_conn`, Cliente B usa `round_robin`    |
| **Health-check**               | configurável por back-end                    | Viewer-A `/api/health`; Viewer-B `/healthz`                |
| **Rate-limit cluster-safe**    | limite RPM configurável globalmente          | basta duplicar bloco `ratelimit:` por rota (pequeno patch) |
| **WAF (Coraza)**               | regras CRS aplicadas a todas as rotas        | bloqueia ataques OWASP independentemente do cliente        |
| **Hot drain / rolling update** | zero-downtime afeta todos os tenants         | manutenção sem interrupção                                 |

Ou seja, se o seu SaaS for **“várias empresas, cada uma em subdomínio próprio”**, o VeloFlux já funciona: basta adicionar um bloco `route` por cliente no YAML (ou via API Admin) e apontar os back-ends deles.

---

## Lacunas para um SaaS completo

| Tema                           | Por que importa                                             | Como implementar                                                                                                                    |
| ------------------------------ | ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| **Autenticação & RBAC**        | Painel `/admin` precisa login multi-usuário / multi-cliente | ① Integrar OIDC (Keycloak / Auth0) <br>② Guardar `tenant_id`, `role` em JWT <br>③ Middleware verifica antes de exibir/alterar rotas |
| **Isolamento de config**       | Um cliente não pode editar rotas de outro                   | Armazenar YAML por **namespace**:<br>`vf:config:<tenant_id>` no Redis/etcd                                                          |
| **Rate-limit/WAF por tenant**  | planos diferentes (Free vs Pro)                             | No middleware, chavear counters/regras usando `tenant_id`                                                                           |
| **Observabilidade por tenant** | dashboards, SLA individuais                                 | Adicionar label `tenant="XYZ"` nas métricas Prometheus e logs JSON                                                                  |
| **Billing / quotas**           | cobrar por RPS, bandwidth                                   | Exportar métricas por tenant → Prometheus + metering (Cortex, Thanos) ou banco próprio                                              |
| **On-boarding self-service**   | criar LB sem intervenção manual                             | Já existe API Admin → basta UI que chama `POST /admin/tenants` + `POST /admin/routes`                                               |
| **Orquestração de back-ends**  | alguns clientes querem instância dedicada                   | usar Helm chart com `--name clienteX`, apontar DNS via API                                                                          |

---

## Roadmap mínimo para “lançar SaaS”

1. **Camada de identidade**
   *Integre Keycloak* (gratuito) → VeloFlux só aceita JWT com `aud=veloflux`
   Roles: `owner`, `member`, `viewer`.

2. **Namespace na Config**

   ```yaml
   tenants:
     - id: clienteA
       routes:
         - host: clienteA.app.com
           ...
   ```

   Serializar direto no Redis no prefixo do tenant.

3. **Painel multi-tenant**

   * Sidebar “select tenant”.
   * Apenas rotas daquele tenant no grid.
   * Chaves rate-limit por tenant.

4. **Metering & Billing**

   * Scrape métricas por label `tenant`.
   * Job diário grava em PostgreSQL (`tenant_id`, `sum(bytes)`).
   * Integra com Stripe ou Gerencianet.

---

## E se eu quiser **um LB por cliente**?

Basta usar o **Helm chart** já pronto:

```bash
helm install velo-cliente1 veloflux/veloflux   --set tenantId=cliente1 --set redis.auth.password=****
helm install velo-cliente2 veloflux/veloflux   --set tenantId=cliente2
```

*Prós*: isolamento total; clientes podem escolher a própria versão.
*Contras*: consome mais CPU/RAM e requer mais nós.

---

### Conclusão

* **Hoje** o VeloFlux atende múltiplos domínios (clientes) no mesmo cluster, com fail-over e WAF.
* Para virar **SaaS multitenant**, concentre-se em:
  1. **Auth + RBAC por tenant**,
  2. **Config isolada** (prefixos Redis),
  3. **Rate-limit/WAF/metrics por tenant**, 
  4. Painel self-service + faturamento.

Com essas peças, o projeto atual evolui sem reescrever nada fundamental, mantendo o core de balanceamento e hot-drain já sólido.
