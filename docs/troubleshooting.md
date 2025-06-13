# Troubleshooting e Testes de Integração

Este documento fornece um guia completo para diagnóstico e resolução de problemas nas funcionalidades SaaS avançadas do VeloFlux, bem como estratégias para testes e validação das integrações.

## Validação das integrações SaaS

### Testes automatizados

Recomendamos a implementação de testes automatizados para todos os pontos de integração:

#### Testes de billing e quotas

```go
// Exemplo de teste Go para integração de billing
func TestStripeIntegration(t *testing.T) {
    // Configure mock do Stripe para testes
    client := stripe.GetTestClient()
    
    // Testar criação de checkout
    checkout, err := billing.CreateCheckout(client, &billing.CheckoutParams{
        TenantID: "test-tenant",
        Plan: "enterprise",
        CustomerEmail: "test@example.com",
        ReturnURL: "https://example.com/return"
    })
    
    require.NoError(t, err)
    assert.NotEmpty(t, checkout.ID)
    
    // Testar processamento de webhook
    event := createMockStripeEvent("invoice.paid", map[string]interface{}{
        "id": "in_test123",
        "customer": "cus_test123",
        "status": "paid",
        "amount_paid": 19900
    })
    
    result, err := billing.HandleStripeWebhook(event)
    require.NoError(t, err)
    assert.Equal(t, "paid", result.Status)
    
    // Verificar se o status do tenant foi atualizado
    tenant, err := tenant.GetTenant("test-tenant")
    require.NoError(t, err)
    assert.Equal(t, "active", tenant.BillingStatus)
}
```

#### Testes de OIDC

```go
// Exemplo de teste para integração OIDC
func TestKeycloakOIDCIntegration(t *testing.T) {
    // Configurar mock do provedor OIDC
    provider := setupMockOIDCProvider(t)
    
    // Testar fluxo de autenticação
    token := createMockIDToken(map[string]interface{}{
        "sub": "user-123",
        "email": "user@example.com",
        "resource_access": map[string]interface{}{
            "veloflux": map[string]interface{}{
                "roles": []string{"admin"},
                "tenant_id": "test-tenant"
            },
        },
    })
    
    claims, err := auth.ValidateOIDCToken(provider, token)
    require.NoError(t, err)
    
    // Verificar extração de claims
    tenantID, err := auth.ExtractTenantFromClaims(claims)
    require.NoError(t, err)
    assert.Equal(t, "test-tenant", tenantID)
    
    roles, err := auth.ExtractRolesFromClaims(claims)
    require.NoError(t, err)
    assert.Contains(t, roles, "admin")
}
```

#### Testes de orquestração Kubernetes

```go
// Exemplo de teste para orquestração
func TestKubernetesDeployment(t *testing.T) {
    // Configurar um cliente fake para Kubernetes
    client := fake.NewSimpleClientset()
    orchestrator := orchestration.NewKubernetesOrchestrator(client)
    
    // Testar deploy de instância
    deployment, err := orchestrator.DeployTenantInstance(&orchestration.DeploymentConfig{
        TenantID: "test-tenant",
        Namespace: "test-tenant-ns",
        Resources: orchestration.Resources{
            CPURequest: "200m",
            CPULimit: "500m",
            MemoryRequest: "256Mi",
            MemoryLimit: "512Mi",
        },
        Autoscaling: orchestration.Autoscaling{
            Enabled: true,
            MinReplicas: 1,
            MaxReplicas: 3,
        },
    })
    
    require.NoError(t, err)
    assert.NotNil(t, deployment)
    
    // Verificar se os recursos foram criados
    ns, err := client.CoreV1().Namespaces().Get(context.Background(), "test-tenant-ns", metav1.GetOptions{})
    require.NoError(t, err)
    assert.NotNil(t, ns)
    
    deploy, err := client.AppsV1().Deployments("test-tenant-ns").Get(context.Background(), "veloflux", metav1.GetOptions{})
    require.NoError(t, err)
    assert.Equal(t, int32(1), *deploy.Spec.Replicas)
}
```

### Simulação de cenários e carga

Para validar a robustez das integrações em condições diversas:

#### Script de simulação de fluxo completo

```bash
#!/bin/bash
# Simular ciclo de vida completo de um tenant

# 1. Criar tenant
tenant_id="stress-test-$(date +%s)"
echo "Criando tenant $tenant_id..."
curl -X POST "https://admin.example.com/api/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"id\": \"$tenant_id\",
    \"name\": \"Stress Test Tenant\",
    \"plan\": \"enterprise\"
  }"

# 2. Configurar e deploy de instância dedicada
echo "Configurando instância dedicada..."
curl -X PUT "https://admin.example.com/api/tenants/$tenant_id/orchestration" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "dedicated",
    "resource_limits": {
      "cpu_request": "100m",
      "memory_request": "128Mi"
    },
    "autoscaling": {
      "enabled": true,
      "min_replicas": 1,
      "max_replicas": 3
    }
  }'

curl -X POST "https://admin.example.com/api/tenants/$tenant_id/orchestration/deploy" \
  -H "Authorization: Bearer $TOKEN"

# 3. Gerar tráfego intenso
echo "Gerando tráfego para testar autoscaling..."
for i in {1..1000}; do
  curl -s "https://$tenant_id.example.com/api/test" &
  if [ $((i % 100)) -eq 0 ]; then
    echo "Enviados $i requests..."
  fi
done

# 4. Verificar autoscaling
echo "Verificando autoscaling..."
sleep 60
curl -X GET "https://admin.example.com/api/tenants/$tenant_id/orchestration/status" \
  -H "Authorization: Bearer $TOKEN"

# 5. Testar geração de relatório de billing
echo "Gerando relatório de billing..."
curl -X GET "https://admin.example.com/api/tenants/$tenant_id/billing/usage" \
  -H "Authorization: Bearer $TOKEN"

# 6. Limpar recursos
echo "Removendo tenant de teste..."
curl -X DELETE "https://admin.example.com/api/tenants/$tenant_id/orchestration" \
  -H "Authorization: Bearer $TOKEN"
```

## Diagnóstico e resolução de problemas

### Billing e exportação

#### Problemas com webhooks

Se os webhooks de pagamento não estão sendo recebidos:

1. **Verificações:**
   - Confirme se o URL do webhook está correto no painel do provedor de pagamento
   - Verifique os logs do servidor para ver se as requisições estão chegando
   - Confirme se o firewall está permitindo conexões do IP do provedor

2. **Solução:**
   ```bash
   # Verificar logs específicos de webhook
   grep "webhook" /var/log/veloflux/server.log | tail -n 50
   
   # Testar webhook manualmente
   curl -X POST "https://admin.example.com/webhook/stripe" \
     -H "Content-Type: application/json" \
     -H "Stripe-Signature: t=1234,v1=mock" \
     -d '{"type":"invoice.paid","data":{"object":{"id":"in_test"}}}'
   ```

#### Falhas na geração de relatórios

Para problemas na exportação de dados de billing:

1. **Verificações:**
   - Garanta que o diretório de exportação tenha permissões adequadas
   - Verifique se há espaço em disco suficiente
   - Confirme se o cron job está configurado corretamente

2. **Solução:**
   ```bash
   # Verificar status das tarefas de exportação
   curl -X GET "https://admin.example.com/api/admin/billing/export/status" \
     -H "Authorization: Bearer $TOKEN"
   
   # Forçar uma exportação manual
   curl -X POST "https://admin.example.com/api/admin/billing/export" \
     -H "Authorization: Bearer $TOKEN" \
     -d '{"format":"json","tenant_id":"all"}'
   ```

### Autenticação OIDC

#### Erros de validação de token

Se tokens OIDC não estão sendo validados:

1. **Verificações:**
   - Confirme se o issuer URL está correto e acessível
   - Verifique se o cliente ID e secret estão configurados corretamente
   - Confirme se os JWKs estão disponíveis e válidos

2. **Solução:**
   ```bash
   # Verificar configuração OIDC atual
   curl -X GET "https://admin.example.com/api/admin/auth/oidc/config" \
     -H "Authorization: Bearer $TOKEN"
   
   # Testar descoberta do endpoint
   curl -s "https://auth.example.com/.well-known/openid-configuration" | jq
   
   # Recarregar configuração OIDC
   curl -X POST "https://admin.example.com/api/admin/auth/oidc/refresh" \
     -H "Authorization: Bearer $TOKEN"
   ```

#### Problemas com mapeamento de claims

Quando a extração de tenant_id ou roles falha:

1. **Verificações:**
   - Inspecione um token JWT real para confirmar a estrutura de claims
   - Verifique se o mapeamento de claims está configurado corretamente
   - Confirme se os claims necessários estão sendo incluídos no token

2. **Solução:**
   ```bash
   # Atualizar mapeamento de claims
   curl -X PUT "https://admin.example.com/api/admin/auth/oidc/claim-mappings" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "tenant_id": "resource_access.veloflux.tenant_id",
       "roles": "resource_access.veloflux.roles"
     }'
   ```

### Orquestração Kubernetes

#### Falhas de deployment

Se a criação de instâncias dedicadas estiver falhando:

1. **Verificações:**
   - Verifique se há recursos suficientes no cluster
   - Confirme se as permissões de RBAC estão corretas
   - Verifique os eventos do Kubernetes para erros específicos

2. **Solução:**
   ```bash
   # Obter status detalhado do deployment
   curl -X GET "https://admin.example.com/api/tenants/$tenant_id/orchestration/status" \
     -H "Authorization: Bearer $TOKEN" | jq
   
   # Verificar logs do deployment
   curl -X GET "https://admin.example.com/api/tenants/$tenant_id/orchestration/logs" \
     -H "Authorization: Bearer $TOKEN"
   
   # Verificar eventos do Kubernetes
   kubectl get events -n $tenant_id-namespace --sort-by='.lastTimestamp'
   
   # Forçar reimplantação com parâmetros ajustados
   curl -X POST "https://admin.example.com/api/tenants/$tenant_id/orchestration/deploy" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "force": true,
       "resource_limits": {
         "cpu_request": "50m",
         "memory_request": "64Mi"
       }
     }'
   ```

#### Problemas de autoscaling

Se o autoscaling não está funcionando como esperado:

1. **Verificações:**
   - Verifique se o metrics-server está funcionando
   - Confirme se o HPA está configurado corretamente
   - Verifique se os pods estão relatando métricas de uso adequadamente

2. **Solução:**
   ```bash
   # Verificar status do autoscaler
   kubectl describe hpa -n $tenant_id-namespace
   
   # Verificar métricas de pods
   kubectl top pods -n $tenant_id-namespace
   
   # Atualizar configuração de autoscaling
   curl -X PUT "https://admin.example.com/api/tenants/$tenant_id/orchestration/autoscaling" \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "enabled": true,
       "min_replicas": 2,
       "max_replicas": 5,
       "target_cpu_utilization": 50
     }'
   ```

## Lista de verificação operacional

Use esta lista para validar que todas as funcionalidades SaaS estão operacionais:

### Verificação diária

- [ ] Sistema de billing gerando relatórios diários
- [ ] Webhooks de pagamento sendo processados
- [ ] Autenticação OIDC funcionando para todos os provedores
- [ ] Instâncias dedicadas com mais de 90% de uptime
- [ ] Autoscaling respondendo à carga

### Verificação semanal

- [ ] Exportação de dados de billing para sistemas externos
- [ ] Reconciliação de status de tenant com registros de pagamento
- [ ] Verificação de permissões e segurança de namespaces
- [ ] Rotação de logs e limpeza de recursos temporários
- [ ] Validação de redes e isolamento entre tenants

### Verificação mensal

- [ ] Auditoria completa de acessos e permissões
- [ ] Teste de recuperação de desastres para instâncias tenant
- [ ] Atualização de certificados e credenciais de segurança
- [ ] Revisão de custos e uso de recursos por tenant
- [ ] Verificação de vulnerabilidades em todas as integrações

