# 🎯 PLANO SISTEMÁTICO DE VALIDAÇÃO VELOFLUX

## 📋 OBJETIVO
Validar completamente o sistema VeloFlux - Backend + Frontend + APIs + Nginx
Garantir que registro, login e profile funcionem 100% antes de qualquer alteração

## 🔬 ETAPA 1: VALIDAÇÃO BACKEND (ISOLADO)
### ✅ Teste 1.1: Health Check
- Endpoint: `http://localhost:9090/health`
- Esperado: 200 OK

### ✅ Teste 1.2: Registro Backend Direto
- Endpoint: `POST http://localhost:9090/auth/register`
- Payload: email, password, first_name, last_name, tenant_name, plan
- Esperado: 201 Created + token

### ✅ Teste 1.3: Login Backend Direto  
- Endpoint: `POST http://localhost:9090/auth/login`
- Payload: email, password
- Esperado: 200 OK + token

### ❓ Teste 1.4: Profile Backend Direto
- Endpoint: `GET http://localhost:9090/api/profile`
- Headers: Authorization Bearer token
- Esperado: 200 OK + dados do usuário

## 🌐 ETAPA 2: VALIDAÇÃO NGINX (PROXY)
### ✅ Teste 2.1: Health via Nginx
- Endpoint: `http://localhost/health`
- Esperado: 200 OK

### ❓ Teste 2.2: Registro via Nginx
- Endpoint: `POST http://localhost/auth/register`
- Esperado: 201 Created + token

### ❓ Teste 2.3: Login via Nginx  
- Endpoint: `POST http://localhost/auth/login`
- Esperado: 200 OK + token

### ❓ Teste 2.4: Profile via Nginx
- Endpoint: `GET http://localhost/api/profile`
- Esperado: 200 OK + dados do usuário

## 🎨 ETAPA 3: VALIDAÇÃO FRONTEND
### ✅ Teste 3.1: Interface Carregando
- URL: `http://localhost`
- Esperado: Página inicial do VeloFlux

### ❓ Teste 3.2: Registro via Interface
- Ação: Preencher formulário de registro
- Esperado: Sucesso + redirecionamento

### ❓ Teste 3.3: Login via Interface
- Ação: Preencher formulário de login  
- Esperado: Sucesso + dashboard

### ❓ Teste 3.4: Profile via Interface
- Ação: Acessar página de perfil
- Esperado: Dados do usuário exibidos

## 🔧 ETAPA 4: DIAGNÓSTICO DE PROBLEMAS
### Se Backend falhar:
- Verificar logs: `docker-compose logs backend`
- Verificar Redis: `docker-compose logs redis`
- Verificar rotas no código Go

### Se Nginx falhar:
- Verificar configuração: `infra/nginx/conf.d/default.conf`
- Verificar logs: `docker-compose logs loadbalancer`
- Testar diretamente backend vs nginx

### Se Frontend falhar:
- Verificar console do navegador
- Verificar environment.ts
- Verificar auth-provider.tsx

## 📝 SCRIPTS DE TESTE

### Script Backend Direto:
```bash
/workspaces/VeloFlux/scripts/testing/test-apis-simple.sh
```

### Script Manual Nginx:
```bash
# Health
curl -s "http://localhost/health"

# Registro  
curl -X POST "http://localhost/auth/register" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com","password":"123456","first_name":"Test","last_name":"User","tenant_name":"Test Tenant","plan":"free"}'

# Login
curl -X POST "http://localhost/auth/login" \\
  -H "Content-Type: application/json" \\
  -d '{"email":"test@test.com","password":"123456"}'

# Profile (com token do login)
curl -X GET "http://localhost/api/profile" \\
  -H "Authorization: Bearer TOKEN_AQUI"
```

## 🎯 CRITÉRIOS DE SUCESSO
- ✅ Backend: Registro + Login + Profile funcionando
- ✅ Nginx: Todos os endpoints proxy funcionando
- ✅ Frontend: Interface + Registro + Login + Profile funcionando
- ✅ Sem duplicidade /api/api/profile
- ✅ Documentação completa dos endpoints

## 📊 STATUS ATUAL
- ✅ Backend testado com script - FUNCIONANDO 100%
- ❓ Nginx proxy - PRECISA VALIDAÇÃO
- ❓ Frontend interface - PRECISA VALIDAÇÃO  
- ❓ Profile endpoint - PROBLEMA IDENTIFICADO

## 🚀 PRÓXIMOS PASSOS
1. Aguardar containers terminarem inicialização (2 min)
2. Executar Etapa 1 (Backend direto)
3. Executar Etapa 2 (Nginx proxy)  
4. Identificar exatamente onde está o problema
5. Corrigir especificamente o problema
6. Validar solução completa
