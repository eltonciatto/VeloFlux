# VeloFlux - Quickstart para Desenvolvedores

## Setup Rápido (5 minutos)

### Pré-requisitos
- Docker & Docker Compose
- Git
- VS Code (recomendado)

### 1. Clone e Inicialize

```bash
# Clone do repositório
git clone https://github.com/seu-usuario/VeloFlux.git
cd VeloFlux

# Iniciar todos os serviços
docker-compose up -d

# Aguardar serviços iniciarem (30 segundos)
sleep 30
```

### 2. Teste Rápido

```bash
# Executar script de teste automático
./test-complete-apis.sh
```

**Saída esperada:**
```
✅ Health check: OK
✅ User registration: OK  
✅ User login: OK
✅ JWT authentication: OK
✅ User management: OK
✅ OIDC configuration: OK
✅ Tenant monitoring: OK
✅ All tests passed!
```

### 3. Acesso

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Métricas**: http://localhost:2112/metrics
- **Redis**: localhost:6379

### 4. Credenciais Padrão

```
Username: admin
Password: senha123
Tenant ID: tenant1
```

## Setup Desenvolvimento Local

### Backend (Go)

```bash
cd backend

# Instalar dependências
go mod tidy

# Executar testes
go test ./...

# Executar em modo desenvolvimento
go run cmd/velofluxlb/main.go
```

### Frontend (React)

```bash
cd frontend

# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm start

# Executar testes
npm test
```

### Redis (local)

```bash
# Instalar Redis (Ubuntu/Debian)
sudo apt install redis-server

# Iniciar Redis
redis-server

# Testar conexão
redis-cli ping
```

## Estrutura de Arquivos Importantes

```
VeloFlux/
├── backend/
│   ├── cmd/velofluxlb/main.go          # Ponto de entrada
│   ├── internal/api/api.go             # Rotas principais
│   ├── internal/auth/auth.go           # Autenticação JWT
│   └── internal/tenant/tenant.go       # Multi-tenancy
├── frontend/
│   ├── src/components/dashboard/       # Componentes principais
│   ├── src/hooks/                      # Hooks customizados
│   └── src/services/api.ts             # Cliente HTTP
├── infra/config/                       # Configurações
├── scripts/                            # Scripts úteis
└── docs/                               # Documentação
```

## Comandos Essenciais

### Docker

```bash
# Iniciar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Parar tudo
docker-compose down

# Rebuild imagens
docker-compose build --no-cache
```

### Backend

```bash
# Build da aplicação
go build -o bin/velofluxlb cmd/velofluxlb/main.go

# Executar binário
./bin/velofluxlb

# Testes específicos
go test ./internal/api/...
go test -v ./internal/auth/...

# Cobertura de testes
go test -cover ./...
```

### Frontend

```bash
# Desenvolvimento
npm start

# Build para produção
npm run build

# Linter
npm install  # instale dependências
npm run lint

# Formatação
npm run format
```

## APIs Principais

### Autenticação

```bash
# Registrar usuário
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123","email":"admin@teste.com"}'

# Login
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}'
```

### APIs Protegidas

```bash
# Salvar token do login
TOKEN="seu_jwt_token_aqui"

# Listar usuários
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: tenant1" \
     http://localhost:8080/api/tenant/users

# Métricas do tenant
curl -H "Authorization: Bearer $TOKEN" \
     -H "X-Tenant-ID: tenant1" \
     http://localhost:8080/api/tenant/monitoring/metrics
```

## Desenvolvimento Frontend

### Estrutura de Componente

```typescript
// src/components/MyComponent.tsx
import React, { useState, useEffect } from 'react';
import { useCustomHook } from '../hooks/useCustomHook';

interface Props {
  title: string;
  onAction: () => void;
}

export function MyComponent({ title, onAction }: Props) {
  const { data, loading, error } = useCustomHook();

  if (loading) return <div>Carregando...</div>;
  if (error) return <div>Erro: {error}</div>;

  return (
    <div>
      <h2>{title}</h2>
      {/* Seu JSX aqui */}
    </div>
  );
}
```

### Hook Customizado

```typescript
// src/hooks/useCustomHook.ts
import { useState, useEffect } from 'react';
import { apiClient } from '../services/api';

export function useCustomHook() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const result = await apiClient.get('/api/endpoint');
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  return { data, loading, error };
}
```

## Desenvolvimento Backend

### Estrutura de Handler

```go
// internal/api/handlers.go
package api

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

type Handler struct {
    service Service
}

func (h *Handler) CreateUser(c *gin.Context) {
    var req CreateUserRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
        return
    }

    user, err := h.service.CreateUser(req)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
        return
    }

    c.JSON(http.StatusCreated, user)
}
```

### Middleware Customizado

```go
// internal/middleware/tenant.go
package middleware

import (
    "net/http"
    "github.com/gin-gonic/gin"
)

func TenantMiddleware() gin.HandlerFunc {
    return func(c *gin.Context) {
        tenantID := c.GetHeader("X-Tenant-ID")
        if tenantID == "" {
            c.JSON(http.StatusBadRequest, gin.H{"error": "tenant ID required"})
            c.Abort()
            return
        }
        
        c.Set("tenant_id", tenantID)
        c.Next()
    }
}
```

## Configuração

### Variáveis de Ambiente

```bash
# Backend (.env)
REDIS_URL=redis://localhost:6379
JWT_SECRET=sua-chave-secreta-super-segura
API_PORT=8080
METRICS_PORT=2112

# Frontend (.env)
REACT_APP_API_URL=http://localhost:8080
REACT_APP_TENANT_ID=tenant1
```

### Configuração do Backend

```yaml
# infra/config/backend-config.yaml
server:
  api_port: 8080
  metrics_port: 2112

redis:
  url: "redis://localhost:6379"
  password: ""
  db: 0

jwt:
  secret: "sua-chave-secreta"
  expiration: "24h"

cors:
  origins:
    - "http://localhost:3000"
```

## Testes

### Executar Todos os Testes

```bash
# Backend
cd backend && go test ./...

# Frontend
cd frontend && npm test

# Integração (script automático)
./test-complete-apis.sh
```

### Teste Específico

```bash
# Backend - teste específico
go test -v ./internal/auth/ -run TestJWTValidation

# Frontend - componente específico
npm test -- UserManagement.test.tsx

# API específica
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}'
```

## Debug

### Logs

```bash
# Logs do backend
docker-compose logs -f backend

# Logs específicos
docker-compose exec backend tail -f /var/log/veloflux.log

# Logs estruturados
docker-compose logs backend | jq '.'
```

### Health Checks

```bash
# Backend health
curl http://localhost:8080/health

# Frontend (se rodando)
curl http://localhost:3000

# Redis
redis-cli ping

# Métricas
curl http://localhost:2112/metrics
```

## Problemas Comuns

### 1. Port já em uso

```bash
# Verificar porta em uso
lsof -i :8080
lsof -i :3000

# Matar processo
kill -9 <PID>

# Usar porta diferente
API_PORT=8081 go run cmd/velofluxlb/main.go
```

### 2. Redis não conecta

```bash
# Verificar se Redis está rodando
redis-cli ping

# Verificar configuração
cat infra/config/backend-config.yaml

# Reiniciar Redis
docker-compose restart redis
```

### 3. CORS errors

```bash
# Verificar configuração CORS no backend
grep -r "cors" infra/config/

# Adicionar origin se necessário
# No backend-config.yaml:
cors:
  origins:
    - "http://localhost:3000"
    - "http://127.0.0.1:3000"
```

### 4. JWT inválido

```bash
# Verificar se token não expirou
# Use jwt.io para decodificar

# Gerar novo token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}'
```

## Scripts Úteis

### Limpeza Completa

```bash
# Parar tudo e limpar
docker-compose down -v
docker system prune -f
```

### Reset Banco de Dados

```bash
# Limpar Redis
redis-cli flushall

# Ou reiniciar container
docker-compose restart redis
```

### Build Completo

```bash
# Build tudo do zero
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Próximos Passos

1. **Explorar Dashboard**: http://localhost:3000
2. **Ler Documentação**: `/docs` pasta
3. **Testar APIs**: Use Postman ou curl
4. **Modificar Código**: Comece com pequenas mudanças
5. **Executar Testes**: Sempre antes de commit

## Recursos Úteis

- **Documentação API**: `/docs/backend_apis_completo.md`
- **Guia Frontend**: `/docs/frontend_integration_guide.md`
- **Arquitetura**: `/docs/desenvolvimento_arquitetura_completo.md`
- **Scripts**: `/scripts/` pasta
- **Exemplos**: `/examples/` pasta

## Ajuda

Se encontrar problemas:

1. Verificar logs: `docker-compose logs -f`
2. Executar health checks
3. Consultar documentação em `/docs`
4. Executar scripts de teste
5. Verificar configurações

**Happy coding! 🚀**
