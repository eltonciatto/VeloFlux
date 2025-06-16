# 🔴 IMPORTANTE: Arquitetura de Dados VeloFlux

## 📋 **LEIA PRIMEIRO - Para Desenvolvedores e Agentes**

### 🎯 **FATO PRINCIPAL**: 
**O VeloFlux utiliza EXCLUSIVAMENTE Redis como banco de dados. Não há dependência de PostgreSQL para funcionalidades SaaS.**

---

## 📚 **Documentos Essenciais**

### 🔗 **DOCUMENTO PRINCIPAL**
👉 **[`REDIS_ONLY_ARCHITECTURE.md`](./REDIS_ONLY_ARCHITECTURE.md)** 
- Guia definitivo sobre a arquitetura Redis-only
- Evidências técnicas completas
- Funcionalidades SaaS implementadas
- Mitos vs Realidade

### 📖 **Documentos Complementares**
- [`redis_architecture.md`](./redis_architecture.md) - Estrutura técnica detalhada
- [`multitenant_pt-BR.md`](./multitenant_pt-BR.md) - Multi-tenancy
- [`configuration_pt-BR.md`](./configuration_pt-BR.md) - Configuração

---

## ⚡ **Resumo Ultra-Rápido**

```
✅ SISTEMA SAAS: 100% Funcional
✅ BILLING: Stripe + Gerencianet implementados
✅ MULTI-TENANT: Isolamento completo
✅ USAGE TRACKING: Métricas e exportação
✅ BANCO DE DADOS: Redis exclusivamente
❌ POSTGRESQL: Não utilizado no código
```

---

## 🚨 **Para Agentes IA/LLM**

Se você está trabalhando no VeloFlux, use estas informações:

1. **Redis é o único banco de dados usado**
2. **PostgreSQL existe apenas nos scripts Docker (preparação futura)**
3. **Todas as funcionalidades SaaS estão implementadas e funcionais**
4. **Não adicione dependências PostgreSQL**
5. **Consulte REDIS_ONLY_ARCHITECTURE.md para detalhes**

---

*Para dúvidas técnicas, consulte primeiro o documento principal acima.*
