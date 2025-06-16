# Guia de Início Rápido

Este guia ajuda você a começar rapidamente com o VeloFlux em cenários de single-tenant e multi-tenant SaaS, incluindo o dashboard alimentado por IA.

## Pré-requisitos
- Docker e Docker Compose instalados
- Node.js 18+ e npm (para o dashboard de IA)
- Opcional: Go 1.22+ se você quiser compilar do código fonte
- Opcional: Redis CLI para operações avançadas

## Executando como um Load Balancer Single-Tenant

```bash
# Clonar o repositório
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Iniciar serviços com configuração padrão
docker-compose up -d

# Instalar dependências do frontend e iniciar o dashboard de IA
npm install
npm run dev
```

Acesse a API de administração em `http://localhost:9000`. As credenciais padrão são controladas pelas variáveis de ambiente `VF_ADMIN_USER` e `VF_ADMIN_PASS` (padrão: admin/admin).

Acesse o Dashboard de IA em `http://localhost:3000` para insights inteligentes de balanceamento de carga e configuração.

### 🤖 Recursos do Dashboard de IA

O Dashboard de IA do VeloFlux fornece:

- **Insights de IA em Tempo Real** - Visualize decisões de balanceamento de carga alimentadas por ML
- **Análises Preditivas** - Previsão de tráfego e planejamento de capacidade
- **Desempenho do Modelo** - Monitore a precisão do modelo ML e status de treinamento
- **Detecção de Anomalias** - Alertas em tempo real para padrões incomuns
- **Configuração Inteligente** - Configurações de otimização recomendadas por IA

### Configure Seu Primeiro Pool de Backend

```bash
# Criar um pool com dois servidores backend
curl -X POST http://localhost:9000/api/pools \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-servers",
    "algorithm": "round_robin",
    "backends": [
      {"address": "backend1.example.com:80", "weight": 1},
      {"address": "backend2.example.com:80", "weight": 1}
    ]
  }'

# Criar uma rota que usa este pool
curl -X POST http://localhost:9000/api/routes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "seudominio.com",
    "pool": "web-servers",
    "path_prefix": "/"
  }'
```

## Executando como uma Plataforma SaaS Multi-Tenant

Para operação multi-tenant, use a configuração multi-tenant:

```bash
# Iniciar com modo multi-tenant habilitado
docker-compose -f docker-compose.yml -f docker-compose.multitenant.yml up -d
```

### Configure Seu Primeiro Tenant

```bash
# Criar um tenant
curl -X POST http://localhost:9000/api/tenants \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tenant1",
    "name": "Primeiro Tenant",
    "plan": "standard",
    "domains": ["tenant1.example.com"]
  }'

# Criar um pool para este tenant
curl -X POST http://localhost:9000/api/tenants/tenant1/pools \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-servers",
    "algorithm": "round_robin",
    "backends": [
      {"address": "tenant1-backend1.example.com:80", "weight": 1}
    ]
  }'
```

## Implantações Multi-região

O VeloFlux pode ser implantado em múltiplas regiões enquanto compartilha um cluster Redis para sincronização de estado:

```bash
# Iniciar Redis Sentinel para alta disponibilidade
redis-sentinel /etc/sentinel.conf --sentinel monitor veloflux <YOUR_IP_ADDRESS> 26379 2

# Configurar instâncias VeloFlux em cada região para usar o mesmo cluster Redis
export VFX_REDIS_ADDRESS=redis-sentinel:26379
export VFX_CLUSTER_ENABLED=true
export VFX_GEO_ROUTING=true

# Iniciar VeloFlux na região 1
docker-compose -f docker-compose.region1.yml up -d

# Iniciar VeloFlux na região 2
docker-compose -f docker-compose.region2.yml up -d
```

## Testes e Monitoramento

```bash
# Requisição básica
curl -H "Host: seudominio.com" http://localhost:80

# Verificar métricas globais
curl http://localhost:8080/metrics

# Verificar métricas específicas por tenant (modo multi-tenant)
curl http://localhost:8080/metrics/tenants/tenant1

# Acompanhar logs
docker-compose logs -f veloflux

# Logs específicos por tenant (modo multi-tenant)
docker-compose logs -f veloflux | grep 'tenant1'
```

## Compilando do Código Fonte

```bash
# Compilar o binário
go build -o veloflux ./cmd/velofluxlb

# Executar com configuração single-tenant
VFX_CONFIG=./config/config.example.yaml ./veloflux

# Executar com configuração multi-tenant
VFX_CONFIG=./config/multitenant.yaml ./veloflux
```

## Dashboard da Interface Web

Para uma experiência completa de gerenciamento, acesse a Interface Web em `http://localhost:9000` após iniciar os serviços. O dashboard fornece:

- Interface de gerenciamento de tenant
- Configuração de pool de backend e rota
- Monitoramento de métricas e saúde em tempo real
- Configuração de WAF e rate limit
- Gerenciamento de usuários e permissões

## Opções de Implantação

O VeloFlux oferece várias opções de implantação para atender às suas necessidades:

- [Docker Compose](deployment.md#docker-compose) - para desenvolvimento local e configurações simples
- [Kubernetes/Helm](deployment.md#kubernetes--helm) - para implantações escaláveis de produção
- [Coolify](coolify_deployment.md) - para implantação simplificada em infraestrutura auto-hospedada
