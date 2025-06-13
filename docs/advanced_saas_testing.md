# Guia de Testes para Funcionalidades SaaS Avançadas

Este documento fornece um guia completo para testar e validar todas as funcionalidades SaaS avançadas implementadas no VeloFlux, incluindo billing/quotas, autenticação OIDC externa e orquestração Kubernetes.

## 1. Preparação do ambiente de testes

### 1.1. Pré-requisitos

- Cluster Kubernetes funcional (pode ser minikube ou k3s para testes locais)
- Instância Redis (standalone ou cluster)
- Contas de teste nos provedores de pagamento (Stripe/Gerencianet)
- Servidor Keycloak ou Auth0 para testes de OIDC
- Ferramenta de monitoramento (Prometheus/Grafana)

### 1.2. Configuração do ambiente

```bash
# Configurar namespace de teste
kubectl create namespace veloflux-test

# Instalar VeloFlux via Helm chart com todas as funcionalidades ativadas
helm install veloflux-test ./charts/veloflux \
  --namespace veloflux-test \
  --set multiTenant.enabled=true \
  --set billing.enabled=true \
  --set billing.provider=stripe \
  --set billing.apiKey=sk_test_yourstripetestkey \
  --set oidc.enabled=true \
  --set oidc.provider=keycloak \
  --set oidc.issuerUrl=https://keycloak.example.com/auth/realms/test \
  --set orchestration.enabled=true \
  --set orchestration.inCluster=true
```

## 2. Testes de Billing e Quotas

### 2.1. Fluxo de checkout e upgrade de plano

| Etapa | Comando | Resultado esperado |
|-------|---------|-------------------|
| Criar tenant | `curl -X POST ".../api/tenants" -d '{"id":"test-tenant","name":"Test Tenant","plan":"free"}'` | Tenant criado com plano gratuito |
| Gerar checkout | `curl -X POST ".../api/tenants/test-tenant/billing/checkout" -d '{"plan":"pro"}'` | URL de checkout retornado |
| Simular pagamento | Usar dashboard de teste do Stripe/Gerencianet | Pagamento processado |
| Verificar webhook | Inspecionar logs do webhook | Webhook recebido e processado |
| Verificar upgrade | `curl -X GET ".../api/tenants/test-tenant"` | Plan atualizado para "pro" |

### 2.2. Teste de limites e quotas

```bash
# Configurar tenant com limites específicos
curl -X PUT "http://localhost:8080/api/tenants/test-tenant/plan" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"plan":"pro","custom_limits":{"max_requests_per_second":20}}'

# Testar limite de taxa com ApacheBench
ab -n 1000 -c 50 http://test-tenant.local/api/test

# Verificar logs para mensagens de limite atingido
grep "rate_limit_exceeded" /var/log/veloflux/server.log | grep "test-tenant"

# Verificar métricas de quota
curl -X GET "http://localhost:8080/api/tenants/test-tenant/billing/usage" \
  -H "Authorization: Bearer $TOKEN"
```

### 2.3. Teste de exportação de dados

```bash
# Gerar dados de uso
for i in {1..100}; do
  curl -s "http://test-tenant.local/api/test" > /dev/null
done

# Exportar relatório de billing
curl -X GET "http://localhost:8080/api/billing/export?format=json" \
  -H "Authorization: Bearer $TOKEN" > billing_export.json

# Verificar conteúdo
jq '.tenants[] | select(.tenant_id=="test-tenant")' billing_export.json
```

## 3. Testes de autenticação OIDC externa

### 3.1. Configuração do provedor

```bash
# Configurar integração OIDC para um tenant
curl -X PUT "http://localhost:8080/api/tenants/test-tenant/oidc" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "keycloak",
    "issuer_url": "https://keycloak.example.com/auth/realms/test",
    "client_id": "veloflux-test",
    "client_secret": "test-secret",
    "claim_mappings": {
      "tenant_id": "resource_access.veloflux.tenant_id",
      "roles": "resource_access.veloflux.roles"
    }
  }'
```

### 3.2. Fluxo de autenticação

| Etapa | Ação | Resultado esperado |
|-------|------|-------------------|
| Iniciar login | Acessar `http://localhost:8080/auth/login?provider=keycloak` | Redirecionamento para Keycloak |
| Autenticar | Logar com usuário de teste | Redirecionamento de volta com código |
| Processar callback | Sistema processa callback | Token JWT gerado |
| Verificar claims | Inspecionar token decodificado | tenant_id e roles extraídos corretamente |
| Acessar API | `curl -H "Authorization: Bearer $TOKEN" ".../api/tenants/test-tenant"` | Acesso permitido baseado em role |

### 3.3. Teste de mapeamento de claims personalizados

```bash
# Criar um usuário de teste no Keycloak com estrutura específica de claims
# Neste exemplo, assumimos que o usuário foi criado via UI do Keycloak

# Atualizar mapeamento de claims para usar uma estrutura não padrão
curl -X PUT "http://localhost:8080/api/tenants/test-tenant/oidc/claim-mappings" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "tenant_id": "custom_data.tenant",
    "roles": "custom_data.permissions"
  }'

# Testar login e verificar se o mapeamento funciona
# (Verificar manualmente via UI ou API)
```

## 4. Testes de orquestração Kubernetes

### 4.1. Deploy de instância dedicada

```bash
# Configurar instância dedicada para um tenant
curl -X PUT "http://localhost:8080/api/tenants/test-tenant/orchestration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dedicated",
    "namespace": "tenant-test-tenant",
    "resource_limits": {
      "cpu_request": "100m",
      "cpu_limit": "500m",
      "memory_request": "128Mi",
      "memory_limit": "512Mi"
    },
    "autoscaling": {
      "enabled": true,
      "min_replicas": 1,
      "max_replicas": 3,
      "target_cpu_utilization": 70
    },
    "custom_domains": ["test-tenant.example.com"]
  }'

# Iniciar deployment
curl -X POST "http://localhost:8080/api/tenants/test-tenant/orchestration/deploy" \
  -H "Authorization: Bearer $TOKEN"

# Verificar status do deployment
curl -X GET "http://localhost:8080/api/tenants/test-tenant/orchestration/status" \
  -H "Authorization: Bearer $TOKEN"

# Verificar recursos criados no Kubernetes
kubectl get all -n tenant-test-tenant
```

### 4.2. Teste de escalonamento manual e automático

```bash
# Escalonar manualmente
curl -X POST "http://localhost:8080/api/tenants/test-tenant/orchestration/scale" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"replicas": 2}'

# Verificar número de réplicas
kubectl get deployment -n tenant-test-tenant

# Gerar carga para testar autoscaling
kubectl run -n tenant-test-tenant load-generator --image=busybox -- /bin/sh -c "while true; do wget -q -O- http://veloflux.tenant-test-tenant.svc.cluster.local; done"

# Monitorar autoscaling
kubectl get hpa -n tenant-test-tenant -w

# Após alguns minutos, verificar se escalou
kubectl get deployment -n tenant-test-tenant
```

### 4.3. Teste de drenagem e atualização

```bash
# Iniciar drenagem para manutenção
curl -X POST "http://localhost:8080/api/tenants/test-tenant/orchestration/drain" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"reason": "maintenance", "duration": "10m"}'

# Verificar status de drenagem
curl -X GET "http://localhost:8080/api/tenants/test-tenant/orchestration/drain/status" \
  -H "Authorization: Bearer $TOKEN"

# Atualizar configuração durante a drenagem
curl -X PUT "http://localhost:8080/api/tenants/test-tenant/orchestration/resources" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "cpu_request": "200m",
    "memory_request": "256Mi"
  }'

# Finalizar drenagem
curl -X POST "http://localhost:8080/api/tenants/test-tenant/orchestration/drain/complete" \
  -H "Authorization: Bearer $TOKEN"

# Verificar recursos atualizados
kubectl describe deployment -n tenant-test-tenant
```

## 5. Testes integrados e cenários de uso

### 5.1. Cenário: Ciclo de vida completo do tenant

Este teste integra todas as funcionalidades em um fluxo completo:

1. **Criar tenant e usuário:**
   ```bash
   # Criar tenant
   tenant_id=$(curl -s -X POST "http://localhost:8080/api/tenants" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "id": "full-lifecycle",
       "name": "Full Lifecycle Test",
       "plan": "free",
       "owner_email": "admin@example.com"
     }' | jq -r '.id')
   
   # Criar usuário no provedor OIDC (via UI ou API do provedor)
   # ...
   ```

2. **Configurar billing e fazer upgrade:**
   ```bash
   # Configurar billing
   curl -X PUT "http://localhost:8080/api/tenants/$tenant_id/billing" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "billing_email": "finance@example.com",
       "company_name": "Test Company"
     }'
   
   # Gerar checkout para upgrade
   checkout_url=$(curl -s -X POST "http://localhost:8080/api/tenants/$tenant_id/billing/checkout" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"plan": "enterprise"}' | jq -r '.checkout_url')
   
   echo "Checkout URL: $checkout_url"
   # Simulação de pagamento via UI do provedor
   # ...
   ```

3. **Configurar OIDC para o tenant:**
   ```bash
   curl -X PUT "http://localhost:8080/api/tenants/$tenant_id/oidc" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "provider": "keycloak",
       "client_id": "test-client",
       "client_secret": "test-secret",
       "redirect_uri": "https://admin.example.com/callback"
     }'
   ```

4. **Configurar e implantar instância dedicada:**
   ```bash
   # Configurar orquestração
   curl -X PUT "http://localhost:8080/api/tenants/$tenant_id/orchestration" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "mode": "dedicated",
       "custom_domains": ["api.tenant.example.com"]
     }'
   
   # Implantar
   curl -X POST "http://localhost:8080/api/tenants/$tenant_id/orchestration/deploy" \
     -H "Authorization: Bearer $TOKEN"
   
   # Esperar deployment
   for i in {1..10}; do
     status=$(curl -s -X GET "http://localhost:8080/api/tenants/$tenant_id/orchestration/status" \
       -H "Authorization: Bearer $TOKEN" | jq -r '.status')
     
     if [ "$status" = "deployed" ]; then
       echo "Deployment completo!"
       break
     fi
     
     echo "Aguardando deployment... Status: $status"
     sleep 10
   done
   ```

5. **Testar operações em todas as camadas:**
   ```bash
   # Testar acesso via OIDC
   # ... (Login via UI)
   
   # Gerar uso para billing
   for i in {1..50}; do
     curl -s "https://api.tenant.example.com/test" > /dev/null
   done
   
   # Verificar métricas de uso
   curl -X GET "http://localhost:8080/api/tenants/$tenant_id/billing/usage" \
     -H "Authorization: Bearer $TOKEN"
   
   # Escalar instância
   curl -X POST "http://localhost:8080/api/tenants/$tenant_id/orchestration/scale" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"replicas": 3}'
   
   # Verificar escalonamento
   kubectl get pods -n tenant-$tenant_id
   ```

6. **Limpar depois do teste:**
   ```bash
   # Remover instância
   curl -X DELETE "http://localhost:8080/api/tenants/$tenant_id/orchestration" \
     -H "Authorization: Bearer $TOKEN"
   
   # Remover tenant
   curl -X DELETE "http://localhost:8080/api/tenants/$tenant_id" \
     -H "Authorization: Bearer $TOKEN"
   ```

### 5.2. Teste de resiliência e recuperação

Simule cenários de falha para testar a robustez:

```bash
# Teste 1: Falha de comunicação com provedor de pagamento
# (Pode ser simulada usando um proxy que interrompe a conexão)

# Teste 2: Queda do provedor OIDC
# Desligar temporariamente o servidor Keycloak/Auth0 e testar o comportamento

# Teste 3: Falha de nó Kubernetes
# Para clusters multi-nó, simule a falha de um nó:
kubectl drain node-1 --ignore-daemonsets --delete-emptydir-data

# Verificar se a instância foi re-agendada em outro nó
kubectl get pods -n tenant-test-tenant -o wide

# Teste 4: Recuperação após falha de Redis
# Simular falha no Redis e verificar recuperação
# (Dependendo da configuração, pode ser necessário reiniciar ou failover)

# Restaurar nó após teste
kubectl uncordon node-1
```

## 6. Verificação de segurança e isolamento

### 6.1. Teste de isolamento de tenant

Verificar se há isolamento adequado entre tenants:

```bash
# Criar dois tenants de teste
curl -X POST "http://localhost:8080/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"tenant-a","name":"Tenant A"}'

curl -X POST "http://localhost:8080/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"id":"tenant-b","name":"Tenant B"}'

# Configurar orquestração para ambos
# (omitido por brevidade)

# Verificar namespaces isolados
kubectl get ns | grep tenant

# Verificar isolamento de rede (precisa de NetworkPolicy configurada)
kubectl get networkpolicy -A

# Tentar acessar cruzado (deve falhar)
kubectl run -n tenant-tenant-a test-pod --image=busybox --rm -it -- wget -T 5 veloflux.tenant-tenant-b
```

### 6.2. Verificação de permissões

```bash
# Verificar permissões do orchestrator
kubectl auth can-i list pods --as=system:serviceaccount:veloflux-test:veloflux-orchestrator -n tenant-test-tenant

# Verificar limitação de permissões por namespace
kubectl auth can-i list secrets --as=system:serviceaccount:veloflux-test:veloflux-orchestrator -A
```

## 7. Preparação para produção

Antes de considerar os testes completos, verifique:

- [x] Logs estruturados para todas as operações
- [x] Monitoramento configurado para métricas específicas por tenant
- [x] Alertas para limites de quota e problemas operacionais
- [x] Backups configurados para dados críticos
- [x] Documentação atualizada para todas as novas funcionalidades
- [x] Plano de recuperação de desastres testado

## Conclusão

Este guia de testes abrange todos os aspectos das funcionalidades SaaS avançadas implementadas no VeloFlux. Ao executar estes testes, você garante que as implementações estão funcionando conforme esperado e prontas para uso em ambientes de produção.

Para testes contínuos e monitoramento, considere automatizar os cenários de teste usando ferramentas como GitHub Actions, GitLab CI ou Jenkins, e integrar com seu sistema de monitoramento para alertas proativos sobre problemas potenciais.
