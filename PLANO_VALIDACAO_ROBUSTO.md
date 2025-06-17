# 🚀 PLANO DE VALIDAÇÃO ROBUSTA - VeloFlux

## 📋 Status Atual do Sistema

- ✅ **Backend**: Rodando na porta 9090 (status: unhealthy devido a backends auxiliares inexistentes, mas API funcional)
- ✅ **Frontend**: Rodando na porta 3000
- ✅ **LoadBalancer (Nginx)**: Rodando na porta 80/443 com proxy funcional
- ✅ **Redis**: Rodando e conectado
- ✅ **Prometheus/Grafana**: Monitoramento ativo

## 🎯 FASE 1: VALIDAÇÃO BÁSICA DOS SERVIÇOS

### 1.1 Health Checks
```bash
# Backend direto
curl -s http://localhost:9090/health

# Via Nginx
curl -s http://localhost/api/health

# Frontend
curl -s http://localhost:3000
```

### 1.2 Conectividade Redis
```bash
# Teste Redis via backend
curl -s http://localhost:9090/api/health/redis
```

## 🔐 FASE 2: VALIDAÇÃO DE AUTENTICAÇÃO

### 2.1 Registro de Usuário

#### Via Backend Direto (Porta 9090)
```bash
curl -X POST http://localhost:9090/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@veloflux.com",
    "password": "123456",
    "tenant_id": "default"
  }'
```

#### Via Nginx (Porta 80)
```bash
curl -X POST http://localhost/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@veloflux.com",
    "password": "123456",
    "tenant_id": "default"
  }'
```

### 2.2 Login de Usuário

#### Via Backend Direto
```bash
curl -X POST http://localhost:9090/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@veloflux.com",
    "password": "123456"
  }'
```

#### Via Nginx
```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@veloflux.com",
    "password": "123456"
  }'
```

### 2.3 Acesso ao Profile

#### Via Backend Direto
```bash
TOKEN="[TOKEN_OBTIDO_NO_LOGIN]"
curl -H "Authorization: Bearer $TOKEN" http://localhost:9090/api/profile
```

#### Via Nginx
```bash
TOKEN="[TOKEN_OBTIDO_NO_LOGIN]"
curl -H "Authorization: Bearer $TOKEN" http://localhost/api/profile
```

## 🌐 FASE 3: VALIDAÇÃO DO FRONTEND

### 3.1 Acesso à Interface
- Abrir http://localhost:3000
- Verificar carregamento da página inicial
- Verificar se não há erros no console do navegador

### 3.2 Fluxo de Registro via Interface
1. Navegar para página de registro
2. Preencher formulário com dados válidos
3. Submeter formulário
4. Verificar resposta e redirecionamento

### 3.3 Fluxo de Login via Interface
1. Navegar para página de login
2. Fazer login com usuário criado
3. Verificar se é redirecionado para dashboard
4. Verificar se token está sendo armazenado

### 3.4 Acesso ao Profile via Interface
1. Após login, acessar página de profile
2. Verificar se dados do usuário são exibidos
3. Verificar chamadas de API no Network tab

## 🔍 FASE 4: DIAGNÓSTICO DE PROBLEMAS

### 4.1 Verificação de Rotas Nginx
```bash
# Verificar configuração nginx
docker exec veloflux-lb cat /etc/nginx/conf.d/default.conf

# Verificar logs nginx
docker-compose logs loadbalancer --tail=50
```

### 4.2 Verificação de Logs Backend
```bash
# Logs completos
docker-compose logs backend --tail=100

# Logs apenas de API calls
docker-compose logs backend | grep "API CALL"
```

### 4.3 Verificação de Conectividade
```bash
# Teste de conectividade interna entre containers
docker exec veloflux-lb ping backend
docker exec veloflux-backend ping redis
```

## 🛠️ FASE 5: TESTES AUTOMATIZADOS

### 5.1 Script de Teste Completo
```bash
# Executar teste automatizado
./scripts/testing/test-apis-complete.sh
```

### 5.2 Script de Teste Simplificado
```bash
# Executar teste básico
./scripts/testing/test-apis-simple.sh
```

## 📊 FASE 6: MONITORAMENTO E MÉTRICAS

### 6.1 Verificação Prometheus
- Acessar http://localhost:9091
- Verificar métricas do VeloFlux
- Validar targets ativos

### 6.2 Verificação Grafana
- Acessar http://localhost:3001
- Verificar dashboards
- Validar alertas

## 🚨 FASE 7: CENÁRIOS DE ERRO

### 7.1 Teste de Autenticação Inválida
```bash
# Login com credenciais inválidas
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "invalido@teste.com",
    "password": "senhaerrada"
  }'
```

### 7.2 Teste de Token Inválido
```bash
# Acesso com token inválido
curl -H "Authorization: Bearer token_invalido" http://localhost/api/profile
```

### 7.3 Teste de Endpoints Inexistentes
```bash
# Endpoint que não existe
curl http://localhost/api/endpoint_inexistente
```

## 📝 CHECKLIST DE VALIDAÇÃO

### ✅ Infraestrutura
- [ ] Todos os containers estão rodando
- [ ] Health checks passando
- [ ] Redis conectado e funcional
- [ ] Nginx fazendo proxy corretamente

### ✅ Backend
- [ ] API responde na porta 9090
- [ ] Registro de usuário funcional
- [ ] Login retorna token válido
- [ ] Profile acessível com token
- [ ] Endpoints protegidos funcionando

### ✅ Frontend
- [ ] Interface carrega sem erros
- [ ] Registro via interface funcional
- [ ] Login via interface funcional
- [ ] Profile acessível via interface
- [ ] Navegação funcional

### ✅ Integração
- [ ] Backend + Nginx funcionando
- [ ] Frontend + Backend integrados
- [ ] Autenticação end-to-end
- [ ] Persistência de sessão

### ✅ Monitoramento
- [ ] Métricas sendo coletadas
- [ ] Logs sendo gerados
- [ ] Alertas configurados
- [ ] Dashboards funcionais

## 🔧 CORREÇÕES COMUNS

### Problema: Backend "unhealthy"
**Causa**: Tentativa de conectar com backends inexistentes
**Solução**: Ignorar warnings de health check de backends auxiliares

### Problema: 404 em /api/profile
**Causa**: Configuração nginx ou roteamento backend
**Solução**: Verificar proxy_pass e rotas registradas

### Problema: CORS no frontend
**Causa**: Configuração de CORS no backend
**Solução**: Verificar headers CORS e origins permitidas

### Problema: Token não persistindo
**Causa**: Configuração de cookies/localStorage
**Solução**: Verificar auth provider e storage

## 📋 PRÓXIMOS PASSOS

1. **Executar cada fase sequencialmente**
2. **Documentar resultados de cada teste**
3. **Corrigir problemas identificados**
4. **Re-executar testes após correções**
5. **Documentar configuração final**

---

**Última atualização**: $(date)
**Status**: Em execução
**Responsável**: AI Assistant
