# Integração com CDN

O VeloFlux pode ser integrado com CDNs (Content Delivery Networks) como Cloudflare, Fastly, Akamai e outros para melhorar a performance, segurança e disponibilidade global da sua aplicação SaaS multi-tenant.

## Benefícios da integração com CDN

1. **Distribuição global de conteúdo** - Redução de latência para usuários em diferentes regiões
2. **Proteção DDoS adicional** - Camada extra de defesa contra ataques de negação de serviço
3. **Caching de conteúdo** - Redução de carga nos backends e melhoria de performance
4. **TLS simplificado** - Gerenciamento de certificados feito pelo CDN

## Arquitetura recomendada

```
Usuário → CDN (Cloudflare) → VeloFlux → Backends
```

Nesta arquitetura, o CDN fica na borda da rede, recebendo as requisições iniciais dos usuários. O VeloFlux fica posicionado como "origem" para o CDN, fazendo o balanceamento de carga entre seus backends.

## Configuração com Cloudflare

### 1. Configuração básica (Proxy DNS)

1. Adicione seu domínio ao Cloudflare
2. Configure os registros DNS apontando para o IP do VeloFlux
3. Certifique-se de que o ícone de nuvem esteja laranja (proxy ativado)

### 2. Configuração de cache

Para conteúdo estático (imagens, CSS, JS), use regras de cache no Cloudflare:

```
Page Rules:
URL pattern: *example.com/static/*
Cache Level: Cache Everything
Edge Cache TTL: 2 hours
```

### 3. Cabeçalhos para preservar IP de origem

Configure o VeloFlux para confiar nos cabeçalhos `X-Forwarded-For` enviados pelo Cloudflare:

```yaml
global:
  proxy_protocol:
    enabled: true
    trusted_ips:
      - 173.245.48.0/20
      - 103.21.244.0/22
      # Adicione todos os IPs do Cloudflare
```

### 4. Autenticação de origem

Para maior segurança, configure a autenticação entre Cloudflare e VeloFlux:

1. Ative o Authenticated Origin Pulls no Cloudflare
2. Configure TLS mútuo no VeloFlux:

```yaml
global:
  tls:
    client_auth:
      enabled: true
      ca_cert: "/etc/ssl/cloudflare-ca.pem"
```

## Integração com Fastly

Fastly oferece controle mais granular sobre o cache e transformações de conteúdo via VCL:

1. Configure o VeloFlux como origem no Fastly
2. Use o seguinte VCL para preservar cabeçalhos de tenant:

```vcl
if (req.http.x-tenant-id) {
  set bereq.http.x-tenant-id = req.http.x-tenant-id;
}
```

## Uso com planos gratuitos de CDN

Mesmo os planos gratuitos de CDNs como Cloudflare oferecem benefícios significativos:

1. **Proteção DDoS básica** - Filtragem de ataques comuns
2. **CDN global** - Distribuição de conteúdo estático
3. **Certificados SSL gratuitos** - HTTPS sem custo
4. **Regras de cache básicas** - Configuração por URL

Para tenants com necessidades específicas, você pode configurar diferentes políticas de CDN por domínio.

## Considerações Multi-tenant

### Mapeamento de domínios personalizados

Para tenants com domínios personalizados, você precisa:

1. Adicionar cada domínio ao CDN
2. Configurar corretamente o redirecionamento para a mesma origem (VeloFlux)
3. Usar o cabeçalho `Host` ou `X-Tenant-ID` para identificação do tenant

### Isolamento de cache

Para evitar vazamento de dados entre tenants:

1. Inclua identificadores de tenant nas chaves de cache
2. Configure o VeloFlux para adicionar cabeçalhos `Vary: X-Tenant-ID`
3. Defina TTLs diferentes por tenant baseados em seus planos

## Monitoramento

Quando um CDN está na frente do VeloFlux, considere:

1. Distinguir entre métricas de edge (CDN) e origem (VeloFlux)
2. Configurar corretamente os logs para incluir os IPs reais dos clientes
3. Monitorar o hit ratio do cache para otimizar a performance

## Próximos passos

1. Configure Workers/Functions no CDN para personalização por tenant
2. Implemente regras de segurança específicas por tenant
3. Otimize as políticas de cache baseado em análise de tráfego
4. Considere CDNs regionais para tenants com requisitos específicos de localização
