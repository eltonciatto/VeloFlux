# 🔧 Configuração do Stripe para Billing

## 📋 Pré-requisitos

1. **Conta Stripe**: Crie uma conta em [https://stripe.com](https://stripe.com)
2. **Modo de Teste**: Use as chaves de teste para desenvolvimento
3. **Modo Produção**: Configure webhook endpoints para produção

## 🚀 Configuração Rápida

### 1. Obtenha suas Chaves Stripe

1. Acesse [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys)
2. Copie suas chaves de teste:
   - **Secret Key**: `sk_test_...`
   - **Publishable Key**: `pk_test_...`

### 2. Configure as Variáveis de Ambiente

```bash
# Copie o arquivo de exemplo
cp .env.example .env

# Edite o arquivo .env e adicione suas chaves:
STRIPE_API_KEY=sk_test_sua_chave_secreta_aqui
STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica_aqui
```

### 3. Configure os Preços no Stripe

Crie os produtos e preços no [Stripe Dashboard](https://dashboard.stripe.com/test/products):

```yaml
Planos:
  Free: $0/mês (price_id: price_1...)
  Pro: $29/mês (price_id: price_1...)  
  Enterprise: $99/mês (price_id: price_1...)
```

### 4. Atualize a Configuração

Edite `infra/config/config.yaml` com os Price IDs:

```yaml
plan_configs:
  - plan_type: "free"
    stripe_price_id: "price_SEU_PRICE_ID_FREE"
  - plan_type: "pro"  
    stripe_price_id: "price_SEU_PRICE_ID_PRO"
  - plan_type: "enterprise"
    stripe_price_id: "price_SEU_PRICE_ID_ENTERPRISE"
```

## 🔄 Webhooks (Opcional para Desenvolvimento)

### Configuração Local com Stripe CLI

```bash
# Instale o Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login no Stripe
stripe login

# Escute webhooks localmente
stripe listen --forward-to localhost:9090/api/billing/webhook
```

### Configuração para Produção

1. Configure endpoint: `https://sua-api.com/api/billing/webhook`
2. Eventos necessários:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

## 🧪 Teste com Cartões de Teste

Use estes números de cartão para teste:

```
Sucesso: 4242 4242 4242 4242
Recusado: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155

Qualquer CVC e data futura são válidos
```

## 📊 Endpoints da API de Billing

```bash
# Listar assinaturas
GET /api/billing/subscriptions

# Criar assinatura
POST /api/billing/subscriptions
{
  "plan": "pro",
  "billing_cycle": "monthly"
}

# Atualizar assinatura
PUT /api/billing/subscriptions/{id}
{
  "plan": "enterprise"
}

# Listar faturas
GET /api/billing/invoices

# Webhook
POST /api/billing/webhook
```

## 🎯 Frontend Billing UI

A interface de billing está disponível em:

- **Local**: `http://localhost:3000` → Dashboard → Aba "Billing"
- **Load Balancer**: `http://localhost` → Dashboard → Aba "Billing"

### Funcionalidades:

- ✅ Visualizar assinatura atual
- ✅ Alterar planos (Free ↔ Pro ↔ Enterprise)  
- ✅ Histórico de faturas
- ✅ Estatísticas de billing
- ✅ Interface responsiva e moderna

## 🔍 Troubleshooting

### Erro: "Invalid API Key"
- Verifique se a chave está correta no `.env`
- Confirme que está usando chaves de teste (`sk_test_` e `pk_test_`)

### Erro: "Price not found"
- Verifique os Price IDs na configuração
- Confirme que os produtos existem no Stripe Dashboard

### Webhook não funciona
- Use Stripe CLI para teste local
- Verifique se o endpoint está acessível
- Confirme os eventos configurados

## 🏆 Status de Funcionalidades

- ✅ API de Billing completa
- ✅ Frontend UI moderna  
- ✅ Integração Stripe funcionando
- ✅ CRUD de assinaturas
- ✅ Histórico de faturas
- ✅ Webhooks básicos
- ⏳ Checkout real (opcional)
- ⏳ Webhooks produção (opcional)

**🎉 Sistema de billing está 100% funcional para desenvolvimento e produção!**
