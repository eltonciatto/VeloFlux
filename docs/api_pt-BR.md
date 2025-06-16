# Documentação da API

O VeloFlux expõe uma API HTTP JSON abrangente para gerenciar inquilinos, pools, rotas e outros elementos de configuração. Todos os endpoints da API requerem autenticação JWT.

## Endpoints de Autenticação

| Método | Endpoint                  | Descrição                               |
| ------ | ------------------------- | --------------------------------------- |
| POST   | `/auth/login`             | Login com email e senha                 |
| POST   | `/auth/register`          | Registrar uma nova conta                |
| POST   | `/auth/refresh`           | Renovar o token de autenticação         |

## Gerenciamento de Usuários

| Método | Endpoint                  | Descrição                               |
| ------ | ------------------------- | --------------------------------------- |
| GET    | `/api/profile`            | Obter o perfil do usuário atual         |
| PUT    | `/api/profile`            | Atualizar o perfil do usuário atual     |

## Gerenciamento de Inquilinos

| Método | Endpoint                              | Descrição                               |
| ------ | ------------------------------------- | --------------------------------------- |
| GET    | `/api/tenants`                        | Listar todos os inquilinos              |
| POST   | `/api/tenants`                        | Criar um novo inquilino                 |
| GET    | `/api/tenants/{tenant_id}`            | Obter detalhes de um inquilino específico |
| PUT    | `/api/tenants/{tenant_id}`            | Atualizar um inquilino                  |
| DELETE | `/api/tenants/{tenant_id}`            | Excluir um inquilino                    |
| GET    | `/api/tenants/{tenant_id}/users`      | Listar usuários em um inquilino         |
| POST   | `/api/tenants/{tenant_id}/users`      | Adicionar um usuário a um inquilino     |

## Gerenciamento de Pools de Backend

| Método | Endpoint                                    | Descrição                               |
| ------ | ------------------------------------------- | --------------------------------------- |
| GET    | `/api/tenants/{tenant_id}/pools`            | Listar pools de backend                 |
| POST   | `/api/tenants/{tenant_id}/pools`            | Criar um novo pool                      |
| GET    | `/api/tenants/{tenant_id}/pools/{pool_id}`  | Obter detalhes de um pool específico    |
| PUT    | `/api/tenants/{tenant_id}/pools/{pool_id}`  | Atualizar um pool                       |
| DELETE | `/api/tenants/{tenant_id}/pools/{pool_id}`  | Excluir um pool                         |

## Gerenciamento de Rotas

| Método | Endpoint                                     | Descrição                               |
| ------ | -------------------------------------------- | --------------------------------------- |
| GET    | `/api/tenants/{tenant_id}/routes`            | Listar rotas                            |
| POST   | `/api/tenants/{tenant_id}/routes`            | Criar uma nova rota                     |
| GET    | `/api/tenants/{tenant_id}/routes/{route_id}` | Obter detalhes de uma rota específica   |
| PUT    | `/api/tenants/{tenant_id}/routes/{route_id}` | Atualizar uma rota                      |
| DELETE | `/api/tenants/{tenant_id}/routes/{route_id}` | Excluir uma rota                        |

## Endpoints de IA/ML

| Método | Endpoint                           | Descrição                               |
| ------ | ---------------------------------- | --------------------------------------- |
| GET    | `/api/ai/metrics`                  | Obter métricas de IA em tempo real      |
| GET    | `/api/ai/predictions`              | Obter predições de tráfego              |
| GET    | `/api/ai/models`                   | Listar modelos de IA disponíveis       |
| POST   | `/api/ai/models/{model_id}/train`  | Iniciar treinamento de modelo           |
| GET    | `/api/ai/anomalies`                | Obter anomalias detectadas              |
| GET    | `/api/ai/recommendations`          | Obter recomendações de otimização       |

## Métricas e Monitoramento

| Método | Endpoint                           | Descrição                               |
| ------ | ---------------------------------- | --------------------------------------- |
| GET    | `/metrics`                         | Métricas Prometheus                     |
| GET    | `/health`                          | Verificação de saúde do sistema         |
| GET    | `/api/tenants/{tenant_id}/metrics` | Métricas específicas do inquilino       |

## Formatos de Resposta

### Resposta de Sucesso
```json
{
  "success": true,
  "data": {
    // dados da resposta
  },
  "timestamp": "2025-06-15T10:30:00Z"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Campos obrigatórios ausentes",
    "details": {
      "missing_fields": ["name", "email"]
    }
  },
  "timestamp": "2025-06-15T10:30:00Z"
}
```

## Códigos de Status HTTP

| Código | Descrição                               |
| ------ | --------------------------------------- |
| 200    | Sucesso                                 |
| 201    | Criado com sucesso                      |
| 400    | Solicitação inválida                    |
| 401    | Não autenticado                         |
| 403    | Acesso negado                           |
| 404    | Recurso não encontrado                  |
| 429    | Muitas solicitações (rate limiting)     |
| 500    | Erro interno do servidor                |

## Autenticação JWT

### Obtendo um Token
```bash
curl -X POST http://localhost/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "usuario@exemplo.com",
    "password": "senha123"
  }'
```

### Usando o Token
```bash
curl -X GET http://localhost/api/profile \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### Renovando o Token
```bash
curl -X POST http://localhost/auth/refresh \
  -H "Authorization: Bearer SEU_REFRESH_TOKEN"
```

## Exemplos de Uso

### Criar um Novo Inquilino
```bash
curl -X POST http://localhost/api/tenants \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Minha Empresa",
    "plan": "enterprise",
    "contact_email": "admin@minhaempresa.com"
  }'
```

### Adicionar um Pool de Backend
```bash
curl -X POST http://localhost/api/tenants/tenant-id/pools \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-servers",
    "algorithm": "round_robin",
    "backends": [
      {
        "url": "http://<YOUR_IP_ADDRESS>:8080",
        "weight": 100,
        "max_fails": 3
      },
      {
        "url": "http://<YOUR_IP_ADDRESS>:8080",
        "weight": 100,
        "max_fails": 3
      }
    ]
  }'
```

### Configurar uma Rota
```bash
curl -X POST http://localhost/api/tenants/tenant-id/routes \
  -H "Authorization: Bearer SEU_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "api.exemplo.com",
    "path": "/api",
    "pool": "api-servers",
    "tls": true,
    "rate_limit": {
      "requests_per_second": 100,
      "burst": 200
    }
  }'
```

## Rate Limiting

O VeloFlux implementa rate limiting em múltiplos níveis:

- **Global**: Limites globais por IP
- **Por Inquilino**: Limites baseados no plano
- **Por Rota**: Limites específicos de endpoint
- **Por Usuário**: Limites baseados em autenticação

### Cabeçalhos de Rate Limiting
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1642492800
```

## Paginação

Endpoints que retornam listas suportam paginação:

```bash
curl "http://localhost/api/tenants?page=2&limit=10" \
  -H "Authorization: Bearer SEU_JWT_TOKEN"
```

### Resposta com Paginação
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 45,
    "total_pages": 5,
    "has_next": true,
    "has_prev": true
  }
}
```
