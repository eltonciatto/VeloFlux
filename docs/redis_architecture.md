# Arquitetura de Dados VeloFlux: Redis como Banco Principal

## Visão Geral

O VeloFlux utiliza **Redis** como seu banco de dados principal para armazenamento de estado, configurações, autenticação e dados de tenant, eliminando a necessidade de um banco de dados relacional tradicional como PostgreSQL ou MySQL. Esta arquitetura proporciona alta performance, escalabilidade e resiliência ideais para um load balancer de alto desempenho.

## Por que Redis e não um RDBMS?

### 1. Performance e Latência

- **Operações em memória**: O Redis opera primariamente em memória, oferecendo latências abaixo de 1ms críticas para decisões de roteamento
- **Arquitetura livre de bloqueio**: Suporta alto throughput sem contention locks que poderiam afetar bancos relacionais
- **Operações atômicas**: Suporta counters e rate limiting atômicos sem overhead de transação

### 2. Simplicidade e Resiliência

- **Estrutura de dados simples**: Maioria dos dados do VeloFlux são chave-valor ou hash maps, perfeitamente adequados para Redis
- **Persistência híbrida**: Usando AOF (Append-Only File), temos persistência com velocidade
- **Recuperação rápida**: Em caso de falha, a inicialização é muito mais rápida do que com bancos relacionais

### 3. Distribuição e Coordenação

- **Pub/Sub nativo**: Usado para sincronização de estado entre nós do cluster
- **Sentinel/Cluster**: Suporte nativo a alta disponibilidade sem middleware adicional
- **Estado compartilhado**: Permite sincronização entre múltiplas regiões geográficas

## Estrutura de Dados no Redis

### Autenticação e Usuários

```
# Usuário por ID
vf:user:<user_id> -> {
  "user_id": "u123",
  "email": "user@example.com",
  "password_hash": "$2a$...", // bcrypt hash
  "first_name": "John",
  "last_name": "Doe",
  "created_at": "2025-01-15T..."
}

# Índice de email para busca
vf:user:email:<email> -> <user_id>

# Tentativas de login (proteção contra brute force)
vf:login:attempts:<ip_or_email> -> integer (contador)
vf:login:blocked:<ip_or_email> -> TTL key (expiração automática do bloqueio)
```

### Tenants e Multi-tenant

```
# Tenant por ID
vf:tenant:<tenant_id> -> {
  "id": "tenant1",
  "name": "Empresa A",
  "plan": "pro",
  "active": true,
  "created_at": "2025-01-10T...",
  "limits": {
    "max_requests_per_second": 1000,
    "max_burst_size": 2000,
    "max_bandwidth_mb_per_day": 100000,
    "max_routes": 50,
    "max_backends": 200,
    "waf_level": "strict"
  }
}

# Lista de usuários por tenant (conjunto)
vf:tenant:<tenant_id>:users -> Set[user_id1, user_id2, ...]

# Associação usuário-tenant (para multi-tenant)
vf:user:<user_id>:tenants -> Set[tenant_id1, tenant_id2, ...]

# Configuração específica de tenant
vf:config:<tenant_id>:routes -> [ "route1", "route2", ... ]
vf:config:<tenant_id>:route:<route_id> -> { host, pool, path_prefix, ... }
vf:config:<tenant_id>:pools -> [ "pool1", "pool2", ... ]
vf:config:<tenant_id>:pool:<pool_id> -> { name, algorithm, ... }
```

### Balanceamento e Estado Dinâmico

```
# Health checks
vf:health:<backend_addr> -> { "healthy": true, "last_check": timestamp, "failures": 0 }

# Rate limiting
vf:ratelimit:<tenant_id>:<ip> -> { count, last_reset }

# Sticky sessions
vf:sticky:<session_id> -> <backend_addr>

# Estatísticas 
vf:stats:requests:<tenant_id> -> contador
vf:stats:bandwidth:<tenant_id> -> contador
```

### Cluster e Coordenação

```
# Registro de nós
veloflux:nodes -> Hash[node_id -> node_info_json]

# Liderança (coordenação de cluster)
veloflux:leader -> node_id
veloflux:leader_lock -> TTL key com heartbeat

# Canal de eventos para sincronização
veloflux:events -> PubSub channel

# Draining (graceful shutdown)
vf:drain:<node_id> -> TTL key
vf:active:<node_id> -> contador de conexões ativas
```

## Fluxos Principais (Como Funciona)

### Login e Autenticação

1. Cliente tenta fazer login com email/senha
2. O sistema verifica o Redis `vf:user:email:<email>` para obter o user_id
3. Busca os dados completos em `vf:user:<user_id>`
4. Verifica o hash da senha usando bcrypt
5. Se correto, gera um JWT com os claims necessários (user_id, tenant_id, role)
6. Registra o refresh token no Redis com TTL
7. O cliente usa o JWT para fazer chamadas autenticadas subsequentes

### Gerenciamento Multi-tenant

1. Cada usuário pode pertencer a múltiplos tenants (organizações)
2. As associações são mantidas usando conjuntos Redis
3. A configuração específica de cada tenant (routes, pools) fica armazenada com o prefixo do tenant
4. O middleware de autenticação verifica o JWT para garantir que o usuário só acesse recursos do seu tenant
5. Métricas, estatísticas e limites são controlados por tenant

### Balanceamento e Monitoramento

1. Health checks periódicos atualizam o estado dos backends no Redis
2. Rate limiting é implementado com contadores Redis com TTL
3. Sticky sessions usam mapeamento de ID de sessão para backend
4. Métricas são coletadas e podem ser exportadas para sistemas de billing

## Vantagens Sobre um RDBMS Tradicional

1. **Desempenho superior**: Essencial para um load balancer de alta performance
2. **Escalabilidade horizontal**: Redis Cluster escala mais facilmente que RDBMSs
3. **Modelo de dados flexível**: Adapta-se melhor às necessidades específicas do VeloFlux
4. **Menos complexidade operacional**: Não precisa gerenciar schema, migrations, índices complexos
5. **Melhor suporte para dados temporários**: TTLs nativos para cache e dados que expiram
6. **Arquitetura stateless**: Os nós VeloFlux são stateless, toda persistência fica no Redis

## Considerações para Produção

1. **Alta Disponibilidade**: Configure Redis Sentinel ou Redis Cluster para redundância
2. **Persistência**: Habilite AOF e snapshots regulares
3. **Monitoramento**: Adicione alertas para utilização de memória e latência
4. **Backup**: Implemente backups automatizados e validados
5. **Segurança**: Use autenticação, TLS e configure corretamente a rede

## Extendendo para Necessidades Futuras

Se eventualmente surgir necessidade de recursos mais avançados de banco relacional, recomenda-se:

1. Manter o Redis como fonte primária para dados operacionais críticos
2. Adicionar PostgreSQL apenas para:
   - Billing e histórico detalhado
   - Relatórios complexos e analytics
   - Audit logs de longa duração
   - Recursos avançados específicos que necessitem de SQL

Isso permite manter todas as vantagens de performance enquanto adiciona capacidades complementares quando realmente necessárias.
