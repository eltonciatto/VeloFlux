# Backend APIs - Documentação Completa para Desenvolvedores

## Visão Geral

O VeloFlux possui um backend robusto em Go que fornece APIs RESTful para autenticação, gerenciamento de usuários, tenants, monitoramento, OIDC e billing. Este documento detalha como funciona o sistema e como integrar com o frontend.

## Arquitetura do Backend

### Estrutura Principal
```
backend/
├── cmd/velofluxlb/main.go          # Inicialização principal
├── internal/
│   ├── api/api.go                  # Roteamento principal de APIs
│   ├── server/server.go            # Servidor HTTP e métricas
│   ├── tenant/tenant.go            # Gerenciamento de tenants
│   ├── auth/auth.go                # Autenticação JWT
│   └── config/config.go            # Configurações
└── Dockerfile                      # Container
```

### Componentes Principais

1. **Servidor de API** (porta 8080): APIs REST para aplicação
2. **Servidor de Métricas** (porta 2112): Prometheus metrics
3. **Redis**: Cache, sessões e persistência de dados
4. **JWT**: Autenticação stateless

## APIs Disponíveis

### 1. Autenticação

#### Registro de Usuário
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "admin",
  "password": "senha123",
  "email": "admin@exemplo.com"
}
```

**Resposta:**
```json
{
  "message": "Usuario registrado com sucesso",
  "user_id": "12345"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "senha123"
}
```

**Resposta:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "12345",
    "username": "admin",
    "email": "admin@exemplo.com"
  }
}
```

### 2. Gerenciamento de Usuários (Tenant-específico)

**Headers obrigatórios:**
```http
Authorization: Bearer <JWT_TOKEN>
X-Tenant-ID: tenant1
```

#### Listar Usuários
```http
GET /api/tenant/users
```

**Resposta:**
```json
{
  "users": [
    {
      "id": "user1",
      "username": "admin",
      "email": "admin@exemplo.com",
      "role": "admin",
      "created_at": "2024-01-01T00:00:00Z",
      "last_login": "2024-01-01T12:00:00Z"
    }
  ],
  "total": 1
}
```

#### Criar Usuário
```http
POST /api/tenant/users
Content-Type: application/json

{
  "username": "novo_usuario",
  "email": "novo@exemplo.com",
  "password": "senha123",
  "role": "user"
}
```

#### Atualizar Usuário
```http
PUT /api/tenant/users/{user_id}
Content-Type: application/json

{
  "email": "novo_email@exemplo.com",
  "role": "admin"
}
```

#### Deletar Usuário
```http
DELETE /api/tenant/users/{user_id}
```

### 3. Monitoramento de Tenant

#### Métricas do Tenant
```http
GET /api/tenant/monitoring/metrics
```

**Resposta:**
```json
{
  "cpu_usage": 45.2,
  "memory_usage": 67.8,
  "disk_usage": 23.1,
  "network_in": 1024000,
  "network_out": 512000,
  "active_connections": 150,
  "requests_per_minute": 300,
  "error_rate": 0.5,
  "uptime": 86400,
  "timestamp": "2024-01-01T12:00:00Z"
}
```

#### Logs do Tenant
```http
GET /api/tenant/monitoring/logs?level=error&limit=100
```

**Resposta:**
```json
{
  "logs": [
    {
      "timestamp": "2024-01-01T12:00:00Z",
      "level": "error",
      "message": "Falha na conexão",
      "service": "api",
      "details": {...}
    }
  ],
  "total": 5,
  "pagination": {
    "page": 1,
    "limit": 100,
    "total_pages": 1
  }
}
```

#### Alertas
```http
GET /api/tenant/monitoring/alerts
```

**Resposta:**
```json
{
  "alerts": [
    {
      "id": "alert1",
      "type": "cpu_high",
      "severity": "warning",
      "message": "CPU usage above 80%",
      "timestamp": "2024-01-01T12:00:00Z",
      "resolved": false
    }
  ]
}
```

### 4. Configuração OIDC

#### Obter Configuração OIDC
```http
GET /api/tenant/oidc/config
```

**Resposta:**
```json
{
  "enabled": true,
  "provider_url": "https://auth.exemplo.com",
  "client_id": "veloflux-client",
  "client_secret": "***",
  "redirect_uri": "https://app.exemplo.com/callback",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

#### Atualizar Configuração OIDC
```http
PUT /api/tenant/oidc/config
Content-Type: application/json

{
  "enabled": true,
  "provider_url": "https://auth.exemplo.com",
  "client_id": "novo-client-id",
  "client_secret": "novo-secret",
  "redirect_uri": "https://app.exemplo.com/callback",
  "scopes": ["openid", "email", "profile"],
  "auto_create_users": true
}
```

#### Testar Configuração OIDC
```http
POST /api/tenant/oidc/test
```

**Resposta:**
```json
{
  "success": true,
  "message": "Configuração OIDC válida",
  "provider_info": {
    "issuer": "https://auth.exemplo.com",
    "authorization_endpoint": "https://auth.exemplo.com/auth",
    "token_endpoint": "https://auth.exemplo.com/token"
  }
}
```

### 5. Billing e Uso

#### Obter Uso Atual
```http
GET /api/tenant/billing/usage
```

**Resposta:**
```json
{
  "current_period": {
    "start": "2024-01-01T00:00:00Z",
    "end": "2024-01-31T23:59:59Z",
    "requests": 150000,
    "storage_gb": 5.2,
    "bandwidth_gb": 12.8
  },
  "limits": {
    "requests": 1000000,
    "storage_gb": 50,
    "bandwidth_gb": 100
  },
  "plan": "pro"
}
```

#### Histórico de Billing
```http
GET /api/tenant/billing/history?months=6
```

**Resposta:**
```json
{
  "history": [
    {
      "period": "2024-01",
      "amount": 99.99,
      "currency": "USD",
      "status": "paid",
      "invoice_url": "https://billing.exemplo.com/invoice/123"
    }
  ]
}
```

## Autenticação e Autorização

### Fluxo de Autenticação

1. **Login**: Cliente envia credenciais para `/api/auth/login`
2. **JWT Token**: Backend retorna token JWT válido
3. **Requests**: Cliente inclui token no header `Authorization: Bearer <token>`
4. **Validação**: Backend valida token em cada request
5. **Tenant**: Header `X-Tenant-ID` especifica contexto do tenant

### Middleware de Autenticação

O backend usa middleware JWT que:
- Verifica assinatura do token
- Valida expiração
- Extrai informações do usuário
- Permite acesso aos endpoints protegidos

### Estrutura do JWT

```json
{
  "sub": "user_id",
  "username": "admin",
  "tenant_id": "tenant1",
  "exp": 1640995200,
  "iat": 1640908800
}
```

## Tratamento de Erros

### Códigos de Status HTTP

- `200`: Sucesso
- `201`: Criado com sucesso
- `400`: Requisição inválida
- `401`: Não autenticado
- `403`: Não autorizado
- `404`: Recurso não encontrado
- `500`: Erro interno do servidor

### Formato de Erro

```json
{
  "error": "authentication_required",
  "message": "Token JWT necessário",
  "code": 401,
  "details": {
    "field": "authorization",
    "reason": "missing_header"
  }
}
```

## Configuração e Deploy

### Variáveis de Ambiente

```bash
# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""
REDIS_DB="0"

# JWT
JWT_SECRET="sua-chave-secreta-super-segura"
JWT_EXPIRATION="24h"

# Servidor
API_PORT="8080"
METRICS_PORT="2112"

# CORS
CORS_ORIGINS="http://localhost:3000,https://app.exemplo.com"
```

### Docker

```dockerfile
FROM golang:1.21-alpine AS builder
WORKDIR /app
COPY . .
RUN go mod download
RUN go build -o velofluxlb cmd/velofluxlb/main.go

FROM alpine:latest
RUN apk --no-cache add ca-certificates
WORKDIR /root/
COPY --from=builder /app/velofluxlb .
CMD ["./velofluxlb"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
      - "2112:2112"
    environment:
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
  
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
```

## Logs e Monitoramento

### Estrutura de Logs

```json
{
  "timestamp": "2024-01-01T12:00:00Z",
  "level": "info",
  "message": "Request processed",
  "method": "GET",
  "path": "/api/tenant/users",
  "status": 200,
  "duration": "45ms",
  "tenant_id": "tenant1",
  "user_id": "user123"
}
```

### Métricas Prometheus

Disponíveis em `http://localhost:2112/metrics`:

- `http_requests_total`: Total de requests HTTP
- `http_request_duration_seconds`: Duração de requests
- `active_connections`: Conexões ativas
- `tenant_users_total`: Total de usuários por tenant

## Próximos Passos

1. **Websockets**: Para notificações em tempo real
2. **Rate Limiting**: Controle de taxa por tenant
3. **Caching**: Cache inteligente de responses
4. **Backup**: Sistema de backup automático
5. **Audit Logs**: Logs de auditoria detalhados

## Troubleshooting

### Problemas Comuns

1. **Redis Connection**: Verificar se Redis está rodando
2. **JWT Invalid**: Verificar se token não expirou
3. **CORS**: Configurar origins corretos
4. **Port Conflict**: Verificar se portas estão livres

### Comandos Úteis

```bash
# Verificar status do backend
curl http://localhost:8080/health

# Testar autenticação
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"senha123"}'

# Verificar métricas
curl http://localhost:2112/metrics
```
