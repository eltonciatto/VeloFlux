# Tenant API - Documentação para Frontend

Esta documentação fornece um guia completo para consumir a API de Tenants do VeloFlux no frontend.

## 📁 Estrutura da Documentação

- **[Autenticação](./tenant-authentication.md)** - Sistema de login, registro e gerenciamento de tokens
- **[Perfil do Usuário](./tenant-user-profile.md)** - Gerenciamento do perfil do usuário
- **[Gerenciamento de Tenants](./tenant-management.md)** - CRUD de tenants (apenas administradores)
- **[Gerenciamento de Usuários](./tenant-user-management.md)** - Gerenciamento de usuários por tenant
- **[Rotas](./tenant-routes.md)** - Configuração e gerenciamento de rotas
- **[Pools e Backends](./tenant-pools-backends.md)** - Gerenciamento de pools e backends
- **[WAF e Rate Limiting](./tenant-waf-rate-limiting.md)** - Configurações de segurança
- **[Monitoramento e Observabilidade](./tenant-monitoring-observability.md)** - Métricas, uso e logs em tempo real
- **[Guia de Implementação Prática](./tenant-implementation-guide.md)** - Implementação completa com hooks, services e componentes

## 🚀 Início Rápido

### Base URL
```
https://api.veloflux.io
```

### Autenticação
Todas as requisições autenticadas devem incluir o header:
```
Authorization: Bearer <token>
```

### Estrutura de Resposta Padrão
```json
{
  "data": {},
  "error": null,
  "status": "success"
}
```

### Códigos de Status HTTP
- `200` - Sucesso
- `201` - Criado com sucesso
- `204` - Sucesso sem conteúdo
- `400` - Erro de validação
- `401` - Não autorizado
- `403` - Proibido
- `404` - Não encontrado
- `500` - Erro interno do servidor

## 🏗️ Arquitetura de Tenants

O VeloFlux utiliza uma arquitetura multi-tenant onde:

- **Tenant**: Representa uma organização/empresa
- **Usuários**: Pertencem a um tenant específico
- **Recursos**: São isolados por tenant (rotas, pools, métricas, etc.)
- **Permissões**: Baseadas em roles (Owner, Admin, Member)

## 📋 Pré-requisitos

- Node.js 16+ ou navegador moderno
- Conhecimento básico de APIs REST
- Token de autenticação válido

## 🔧 Configuração Inicial

```javascript
// Configuração base
const API_BASE_URL = 'https://api.veloflux.io';
const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

// Função auxiliar para requisições autenticadas
function getAuthHeaders(token) {
  return {
    ...DEFAULT_HEADERS,
    'Authorization': `Bearer ${token}`,
  };
}
```

## 📚 Próximos Passos

1. Leia a documentação de [Autenticação](./tenant-authentication.md) para começar
2. Explore os [Exemplos de Implementação](./tenant-implementation-examples.md) para ver casos práticos
3. Use o [SDK JavaScript](./tenant-sdk.md) para acelerar o desenvolvimento
4. Consulte o [Tratamento de Erros](./tenant-error-handling.md) para uma implementação robusta
