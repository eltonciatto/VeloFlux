# 🚀 VeloFlux - PADRÃO DEFINITIVO DE PORTAS E ROTAS

## 📋 REGRA DE OURO: NUNCA ALTERAR ESTAS PORTAS!

### 🔐 PORTAS OFICIAIS (PRODUÇÃO)
```
80    - nginx (Entrada principal HTTP)
443   - nginx (Entrada principal HTTPS)
3000  - Frontend (Acesso direto dev)
3001  - Grafana (Monitoramento)
6379  - Redis (INTERNO - nunca expor)
8080  - Backend Health/Metrics
9000  - Backend Admin API
9090  - Backend Main API
9091  - Prometheus
9092  - AlertManager
```

## 🌐 FLUXO DE ROTEAMENTO OFICIAL

### 1. USUÁRIO FINAL (Sempre usar porta 80)
```
http://localhost/          → Frontend (aplicação web)
http://localhost/api/      → Backend Main API (9090)
http://localhost/admin/    → Frontend Admin (interface)
```

### 2. DESENVOLVEDOR (Acesso direto para debug)
```
http://localhost:3000/     → Frontend direto
http://localhost:8080/     → Backend Health
http://localhost:9090/     → Backend API direto
http://localhost:9000/     → Backend Admin direto
http://localhost:3001/     → Grafana direto
http://localhost:9091/     → Prometheus direto
http://localhost:9092/     → AlertManager direto
```

## 🔄 COMPORTAMENTO CORRETO POR ROTA

### ✅ COMPORTAMENTO ESPERADO:

#### `http://localhost/` 
- **Resultado**: Página inicial da aplicação
- **Se não logado**: Mostra landing page
- **Se logado**: Redireciona para dashboard

#### `http://localhost/admin`
- **Resultado**: Interface administrativa
- **Se não logado**: Mostra página de login
- **Se logado**: Mostra painel admin
- **🚨 IMPORTANTE**: Não confundir com `/admin/api/`

#### `http://localhost/api/`
- **Resultado**: Endpoints da API principal
- **Exemplos**:
  - `GET /api/health` → Status da API
  - `POST /api/auth/login` → Login
  - `GET /api/profile` → Perfil do usuário

#### `http://localhost/admin/api/`
- **Resultado**: Endpoints da API administrativa
- **Requer**: Autenticação de admin
- **Exemplos**:
  - `GET /admin/api/users` → Lista usuários
  - `POST /admin/api/tenants` → Criar tenant

## 🎯 COMANDOS DE TESTE PARA DEVS

### 1. Verificar se tudo está funcionando:
```bash
# Status dos containers
docker-compose ps

# Testar aplicação principal
curl http://localhost/

# Testar API principal
curl http://localhost/api/health

# Testar interface admin (deve mostrar HTML)
curl -I http://localhost/admin

# Testar API admin (deve dar 401 sem auth)
curl http://localhost/admin/api/health
```

### 2. Testar autenticação:
```bash
# Login
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@veloflux.io","password":"VeloFlux2025!"}'

# Com o token obtido, testar API protegida
curl -H "Authorization: Bearer SEU_TOKEN" \
  http://localhost/api/profile
```

### 3. Verificar rotas diretas (para debug):
```bash
# Frontend direto
curl http://localhost:3000/

# Backend API direto
curl http://localhost:9090/health

# Backend Admin direto
curl http://localhost:9000/health

# Grafana direto
curl http://localhost:3001/
```

## 🚨 AVISOS IMPORTANTES

### ❌ NUNCA FAZER:
- Alterar mapeamento de portas sem atualizar esta documentação
- Usar portas diretas em produção (sempre usar porta 80)
- Expor Redis externamente (manter apenas interno)
- Misturar `/admin` (interface) com `/admin/api` (API)

### ✅ SEMPRE FAZER:
- Usar `http://localhost/` como entrada principal
- Documentar mudanças neste arquivo
- Testar todas as rotas após mudanças
- Manter logs do nginx para debug

## 📊 MONITORAMENTO

### Verificar logs:
```bash
# Logs do nginx (roteamento)
docker-compose logs nginx

# Logs do backend
docker-compose logs backend

# Logs do frontend
docker-compose logs frontend
```

### Métricas:
```bash
# Métricas do sistema
curl http://localhost:9091/metrics

# Health checks
curl http://localhost:8080/health
curl http://localhost:9090/health
```

## 🔧 CONFIGURAÇÃO PARA NOVOS DEVS

### Setup inicial:
```bash
# 1. Clonar repositório
git clone <repo>
cd VeloFlux

# 2. Subir todos os serviços
docker-compose up -d

# 3. Verificar status
docker-compose ps

# 4. Testar aplicação
curl http://localhost/

# 5. Acessar via browser
# http://localhost/ (aplicação principal)
# http://localhost/admin (interface admin)
# http://localhost:3001/ (Grafana - admin/veloflux123)
```

### Credenciais de teste:
```
Admin:
- Email: admin@veloflux.io
- Senha: VeloFlux2025!

Grafana:
- Usuário: admin
- Senha: veloflux123
```

---

## 🎯 RESUMO PARA NOVOS DEVS

**PORTA 80 = TUDO**
- Aplicação: `http://localhost/`
- Admin: `http://localhost/admin`
- API: `http://localhost/api/`

**PORTAS DIRETAS = APENAS DEBUG**
- Frontend: `http://localhost:3000/`
- Backend: `http://localhost:9090/`
- Grafana: `http://localhost:3001/`

**REDIS = INTERNO**
- Nunca expor a porta 6379 externamente
- Sempre usar `redis:6379` nos containers

---

*📝 Última atualização: 17/06/2025*
*🔄 Versão: 1.0 - Padrão Definitivo*
