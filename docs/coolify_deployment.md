# Deploy do VeloFlux com Coolify

Este guia apresenta o passo a passo para implantar o VeloFlux utilizando a plataforma Coolify - uma alternativa de código aberto para Heroku e Netlify.

## Pré-requisitos

- [Coolify](https://coolify.io/) instalado e configurado em seu servidor
- Acesso ao repositório Git do VeloFlux
- Conhecimentos básicos sobre Docker e variáveis de ambiente

> **Nota:** Para implantação específica do VeloFlux como SaaS multi-tenant, consulte o [guia detalhado de deploy SaaS com Coolify](saas_coolify_deployment.md).

## Configuração do Coolify

### 1. Instalação do Coolify

Se você ainda não tem o Coolify instalado, siga os passos abaixo:

```bash
# Instale o Coolify em seu servidor
wget -q https://get.coolify.io -O install.sh
chmod +x install.sh
sudo ./install.sh
```

Após a instalação, acesse a interface web do Coolify (normalmente em `http://seu-servidor:3000`) e complete o processo de configuração inicial.

### 2. Conecte seu repositório Git

1. No painel do Coolify, vá em "Sources" e adicione uma nova fonte
2. Escolha o provedor Git onde seu projeto VeloFlux está hospedado (GitHub, GitLab, etc.)
3. Autorize o Coolify a acessar seus repositórios
4. Selecione o repositório do VeloFlux

## Deploy do VeloFlux

### 3. Criar novo serviço

1. No painel do Coolify, clique em "New Service"
2. Selecione "Application"
3. Escolha o repositório do VeloFlux que você acabou de conectar
4. Selecione "Docker" como tipo de aplicação

### 4. Configuração do serviço

Configure os seguintes parâmetros para o deploy:

- **Build Method**: Docker
- **Dockerfile Path**: `./Dockerfile` (use o Dockerfile já existente no projeto)
- **Docker Compose Path**: `./docker-compose.yml` (caso queira usar o docker-compose)
- **Porta pública**: 80
- **Porta privada**: 80 (a porta que o VeloFlux expõe internamente)

### 5. Variáveis de ambiente

Configure as seguintes variáveis de ambiente essenciais:

```
VFX_CONFIG=/etc/veloflux/config.yaml
VFX_LOG_LEVEL=info
VF_ADMIN_USER=seu-usuario-admin
VF_ADMIN_PASS=sua-senha-segura
```

### 6. Volume de configuração

Para utilizar um arquivo de configuração personalizado:

1. Vá em "Volumes" no seu serviço
2. Adicione um volume com:
   - **Type**: File
   - **Name**: config.yaml
   - **Destination Path**: /etc/veloflux/config.yaml
   - **Content**: Copie o conteúdo do seu arquivo `config/config.example.yaml` e faça as alterações necessárias

### 7. Serviços dependentes

Se você precisar de serviços adicionais como Redis:

1. Vá em "Resources"
2. Adicione um serviço de Redis
3. Anote as credenciais e atualize seu arquivo de configuração conforme necessário

## Deploy de Múltiplos Ambientes

### Ambiente de desenvolvimento

1. Crie um novo serviço conforme descrito acima
2. Use uma branch específica (por exemplo, `dev` ou `staging`)
3. Configure as variáveis de ambiente adequadas para desenvolvimento

### Ambiente de produção

1. Crie um novo serviço
2. Use a branch principal (geralmente `main` ou `master`)
3. Configure as variáveis de ambiente de produção
4. Considere ativar o SSL/TLS para produção

## Monitoramento e Logs

O Coolify oferece monitoramento básico e visualização de logs:

1. Acesse seu serviço VeloFlux no Coolify
2. Vá para a aba "Logs" para ver os logs em tempo real
3. Vá para a aba "Monitoring" para verificar o uso de recursos

## Auto-deploy

Para configurar o auto-deploy:

1. Vá para as configurações do serviço
2. Habilite "Auto-deploy on push"
3. Especifique as branches que devem acionar o deploy automático (ex: `main`)

## Rollbacks

Caso seja necessário reverter para uma versão anterior:

1. Vá para a aba "Deployments"
2. Encontre a versão para a qual deseja reverter
3. Clique em "Rollback to this version"

## Solução de Problemas

- **Falha no build**: Verifique os logs de build para identificar possíveis erros
- **Aplicação não inicia**: Verifique os logs da aplicação e certifique-se de que todas as variáveis de ambiente necessárias foram definidas
- **Problemas de conexão com Redis**: Verifique se as credenciais do Redis estão corretas no arquivo de configuração

## Conclusão

Seguindo este guia, você deve ser capaz de implantar o VeloFlux facilmente usando o Coolify. Esta abordagem oferece uma alternativa simples e econômica para hospedar sua aplicação VeloFlux em ambientes de desenvolvimento, teste ou produção.

## Deploy do VeloFlux SaaS

Para implantar o VeloFlux em modo SaaS multi-tenant usando o Coolify, siga estas instruções adicionais:

### Configuração do arquivo config.yaml para ambiente SaaS

Ao configurar o volume para o arquivo de configuração no Coolify, use o modelo abaixo como base para um ambiente SaaS:

```yaml
# VeloFlux LB Configuration - SaaS Mode
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  # TLS Configuration
  tls:
    auto_cert: true
    acme_email: "admin@veloflux.io"   # Altere para seu email
    cert_dir: "/etc/ssl/certs/veloflux"

  # Health Check Defaults
  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

  # Rate Limiting
  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"

  # Web Application Firewall
  waf:
    enabled: true
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"
    log_violations: true

  # GeoIP Configuration
  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"

# Authentication Configuration
auth:
  enabled: true
  jwt_secret: "${JWT_SECRET}"    # Use variável de ambiente do Coolify
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  # OIDC Configuration (Keycloak / Auth0)
  oidc_enabled: true            # Ativado para ambiente SaaS
  oidc_issuer_url: "${OIDC_ISSUER_URL}"
  oidc_client_id: "${OIDC_CLIENT_ID}"
  oidc_redirect_uri: "${OIDC_REDIRECT_URI}"

# Clustering Configuration
cluster:
  enabled: true
  redis_address: "${REDIS_ADDRESS}"  # Use a URL do Redis configurada no Coolify
  redis_password: "${REDIS_PASSWORD}"
  redis_db: 0
  node_id: ""  # Auto-generated if empty
  heartbeat_interval: "5s"
  leader_timeout: "15s"

# API Server Configuration
api:
  bind_address: "0.0.0.0:9090"
  auth_enabled: true
  username: "${ADMIN_USERNAME}"  # Use variável de ambiente do Coolify
  password: "${ADMIN_PASSWORD}"  # Use variável de ambiente do Coolify

# Tenant-specific configurations
tenants:
  - id: "tenant1"
    name: "Demo Company A"
    enabled: true
    routes:
      - host: "company-a.veloflux.io"
        pool: "tenant1-pool"
        path_prefix: "/"
    rate_limit:
      requests_per_second: 50
      burst_size: 100
    waf:
      enabled: true
      level: "standard"

  - id: "tenant2"
    name: "Demo Company B"
    enabled: true
    routes:
      - host: "company-b.veloflux.io"
        pool: "tenant2-pool"
        path_prefix: "/"
    rate_limit:
      requests_per_second: 200
      burst_size: 400
    waf:
      enabled: true
      level: "strict"

# Backend Pools para tenants
pools:
  - name: "tenant1-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "${TENANT1_BACKEND1}"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200
          
      - address: "${TENANT1_BACKEND2}"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "tenant2-pool"
    algorithm: "least_conn"
    sticky_sessions: false
    backends:
      - address: "${TENANT2_BACKEND1}"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200
          
      - address: "${TENANT2_BACKEND2}"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200
```

### Variáveis de ambiente necessárias para SaaS

No Coolify, configure as seguintes variáveis de ambiente para o modo SaaS:

```
JWT_SECRET=sua-chave-secreta-muito-segura
ADMIN_USERNAME=admin-username
ADMIN_PASSWORD=senha-super-segura

# OIDC
OIDC_ISSUER_URL=https://auth.veloflux.io/realms/veloflux
OIDC_CLIENT_ID=veloflux-admin
OIDC_REDIRECT_URI=https://admin.veloflux.io/auth/callback

# Redis
REDIS_ADDRESS=redis-host:6379
REDIS_PASSWORD=sua-senha-redis

# Backends para tenant1
TENANT1_BACKEND1=tenant1-backend1:80
TENANT1_BACKEND2=tenant1-backend2:80

# Backends para tenant2
TENANT2_BACKEND1=tenant2-backend1:80
TENANT2_BACKEND2=tenant2-backend2:80
```

### Recursos adicionais para ambiente SaaS

No Coolify, além do Redis mencionado anteriormente, você pode precisar:

2. **Proxy Reverso**: Para gerenciar domínios personalizados
   - Vá em "Services" > seu serviço VeloFlux
   - Configure os domínios personalizados em "Domains"
   - Ative SSL/TLS para todos os domínios

3. **Escalabilidade**: Para ambientes SaaS com maior tráfego
   - Vá em "Scaling" nas configurações do serviço
   - Ajuste os recursos de CPU/Memória conforme necessário
   - Configure regras de auto-scaling se disponível

### Monitoramento avançado para SaaS

Para monitoramento mais robusto do ambiente SaaS:

1. Configure integração com:
   - Prometheus para métricas
   - Grafana para dashboards
   - Loki para centralização de logs

2. No Coolify, vá em "Integrations" e configure as conexões necessárias

## Estratégia de múltiplas regiões

Para um serviço SaaS com disponibilidade global:

1. Configure instâncias do Coolify em diferentes regiões
2. Implante o VeloFlux em cada região
3. Use um serviço de DNS global como o Cloudflare para rotear usuários para a região mais próxima
4. Configure o Redis em cluster para compartilhar estado entre regiões
