# Deploy do VeloFlux SaaS com Coolify

Este documento contém instruções detalhadas para implantar o VeloFlux em modo SaaS (Software as a Service) utilizando a plataforma Coolify.

## O que é o VeloFlux SaaS?

O VeloFlux em modo SaaS permite que você forneça balanceamento de carga e proteção WAF como serviço para múltiplos clientes (tenants), cada um com suas próprias configurações, limites e domínios personalizados.

## Pré-requisitos

- Servidor com Coolify instalado e configurado
- Acesso ao repositório Git do VeloFlux
- Domínio para o painel administrativo (ex: admin.veloflux.io)
- Domínio para serviço de autenticação (ex: auth.veloflux.io)
- Opcional: Domínios para tenants (ex: cliente1.veloflux.io, cliente2.veloflux.io)

## Arquitetura SaaS no Coolify

![Arquitetura VeloFlux SaaS](https://i.imgur.com/diagramplaceholder.png)

A implementação do VeloFlux SaaS no Coolify consiste em:

1. **Serviço VeloFlux**: O balanceador de carga principal
2. **Banco de dados**: Para armazenar informações dos tenants
3. **Redis**: Para estado e coordenação do cluster
4. **Serviço de Autenticação**: OIDC provider (Keycloak, Auth0, etc.)
5. **Painel de Administração**: Interface para gestão de tenants

## Configuração Passo a Passo

### 1. Configuração de Autenticação

Para a autenticação, você pode escolher entre duas abordagens:

#### Opção A: Autenticação baseada em Redis (Recomendada)

Esta é a abordagem nativa do VeloFlux, mais simples e sem dependências externas:

1. Configure apenas o Redis:
   ```
   Name: veloflux-redis
   Image: redis:7-alpine
   ```
   
2. Configure o VeloFlux para usar autenticação nativa:
   ```yaml
   auth:
     enabled: true
     jwt_secret: "${JWT_SECRET}"
     jwt_issuer: "veloflux-lb"
     jwt_audience: "veloflux-admin"
     token_validity: "24h"
     oidc_enabled: false  # Desativar OIDC
     redis_url: "${REDIS_ADDRESS}"
     redis_password: "${REDIS_PASSWORD}"
   ```

3. Defina variáveis de ambiente para credenciais de administrador:
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<YOUR_ADMIN_PASSWORD>
   JWT_SECRET=<YOUR_JWT_SECRET>
   ```

#### Opção B: Autenticação com Keycloak (Para integrações corporativas)

Para casos que exigem federação de identidade ou integração com sistemas externos:

1. No Coolify, crie um novo serviço para Keycloak:
   ```
   Name: veloflux-auth
   Image: quay.io/keycloak/keycloak:latest
   Command: start-dev
   ```

2. Configure as variáveis de ambiente do Keycloak:
   ```
   KEYCLOAK_ADMIN=admin
   KEYCLOAK_ADMIN_PASSWORD=<YOUR_KEYCLOAK_PASSWORD>
   KC_PROXY=edge
   ```

3. Configure um domínio personalizado:
   ```
   auth.veloflux.io
   ```

4. Após o deploy, acesse o Keycloak e crie:
   - Um novo realm chamado "veloflux"
   - Um novo cliente chamado "veloflux-admin"
   - Configure o redirect URI para "https://admin.veloflux.io/auth/callback"

### 2. Configurar Redis

O VeloFlux utiliza Redis como seu banco de dados principal para armazenamento de estado, configurações, autenticação e dados de tenant, eliminando a necessidade de um banco de dados relacional como PostgreSQL.

1. No Coolify, adicione um recurso Redis:
   - Nome: veloflux-redis
   - Versão: 7 ou superior
   - Habilite persistência (AOF)

2. Anote o endereço e a senha gerada automaticamente

### 3. Configurar Redis

1. No Coolify, adicione um recurso Redis:
   - Nome: veloflux-redis
   - Versão: 7 ou superior

2. Anote o endereço e a senha gerada

### 4. Deploy do VeloFlux SaaS

1. No painel do Coolify, crie um novo serviço:
   - Tipo: Docker
   - Selecione o repositório VeloFlux
   - Build Command: (deixe em branco, usará o Dockerfile padrão)
   - Port: 80,443,9090

2. Configure os volumes:
   - Crie um volume do tipo "File" para config.yaml
   - Caminho de destino: /etc/veloflux/config.yaml
   - Conteúdo: Utilize o modelo de configuração SaaS abaixo

3. Configure as variáveis de ambiente:
   ```
   VFX_CONFIG=/etc/veloflux/config.yaml
   VFX_LOG_LEVEL=info
   JWT_SECRET=<YOUR_JWT_SECRET>
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<YOUR_ADMIN_PASSWORD>
   OIDC_ISSUER_URL=https://auth.veloflux.io/realms/veloflux
   OIDC_CLIENT_ID=veloflux-admin
   OIDC_REDIRECT_URI=https://admin.veloflux.io/auth/callback
   REDIS_ADDRESS=veloflux-redis:6379
   REDIS_PASSWORD=<YOUR_REDIS_PASSWORD>
   ```

4. Configure domínios personalizados:
   - admin.veloflux.io (painel admin)
   - lb.veloflux.io (balanceador de carga)

### 5. Configuração do VeloFlux para ambiente SaaS

Utilize este modelo de configuração como base para o arquivo config.yaml:

```yaml
# VeloFlux LB Configuration - SaaS Mode
global:
  bind_address: "<YOUR_IP_ADDRESS>:80"
  tls_bind_address: "<YOUR_IP_ADDRESS>:443"
  metrics_address: "<YOUR_IP_ADDRESS>:8080"
  
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
  bind_address: "<YOUR_IP_ADDRESS>:9090"
  auth_enabled: true
  username: "${ADMIN_USERNAME}"  # Use variável de ambiente do Coolify
  password: "${ADMIN_PASSWORD}"  # Use variável de ambiente do Coolify

# Billing Integration (Optional)
billing:
  enabled: true
  provider: "gerencianet"  # ou "stripe"
  api_key: "${YOUR_API_KEY}"
  webhook_secret: "${BILLING_WEBHOOK_SECRET}"
  public_key: "${BILLING_PUBLIC_KEY}"
  webhook_endpoint: "/api/v1/billing/webhook"

# Multi-tenant Configuration
multi_tenant:
  enabled: true
  auto_provision: true
  default_limits:
    max_traffic_per_day: 10737418240  # 10GB em bytes
    max_requests_per_second: 100
    max_domains: 5
    waf_enabled: true
    waf_level: "standard"
  domain_pattern: "${TENANT_ID}.veloflux.io"

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

## Gerenciamento de Tenants

### Provisionar novos tenants

1. Acesse o painel administrativo: https://admin.veloflux.io
2. Vá para a seção "Tenants"
3. Clique em "Add Tenant"
4. Preencha as informações:
   - Tenant ID: identificador único
   - Nome da empresa
   - Detalhes de contato
   - Limites de tráfego e taxa
   - Configurações de WAF

### Configuração de domínios personalizados

Para cada tenant, você pode configurar:

1. Domínios fornecidos pelo VeloFlux (tenant-id.veloflux.io)
2. Domínios personalizados do cliente (example.com):
   - No painel administrativo, adicione o domínio ao tenant
   - Instrua o cliente a criar um registro CNAME apontando para lb.veloflux.io

## Monitoramento e Observabilidade

### Integração com ferramentas de monitoramento

O VeloFlux SaaS no Coolify pode ser integrado com:

1. **Prometheus e Grafana**:
   - Endpoint de métricas: http://lb.veloflux.io:8080/metrics
   - Dashboards pré-configurados disponíveis em /dashboards

2. **Logs centralizados**:
   - Configure o Coolify para enviar logs para um serviço centralizado
   - Recomenda-se usar Loki ou Elasticsearch

## Backup e Recuperação

### Estratégia de backup

Para ambientes SaaS, implemente:

1. Backup diário automático do banco de dados
   - No Coolify, configure backups em "Resources" > seu banco de dados
   
2. Backup da configuração do VeloFlux
   - Configure um job para exportar configurações periodicamente

### Procedimento de recuperação

Em caso de falha:

1. Restaure o banco de dados a partir do último backup
2. Reimplante o VeloFlux com a mesma configuração
3. Verifique a integridade dos dados dos tenants

## Escalabilidade e Alta Disponibilidade

### Escalar horizontalmente

Para escalabilidade horizontal:

1. No Coolify, aumente o número de réplicas do serviço VeloFlux
2. Certifique-se de que a configuração do cluster está habilitada
3. Configure o Redis em modo cluster para melhor desempenho

### Multi-região

Para deployments multi-região:

1. Configure instâncias do Coolify em diferentes regiões
2. Configure sincronização de dados entre regiões
3. Use DNS com geolocalização para roteamento

## Solução de Problemas Específicos para SaaS

### Problemas comuns e soluções

1. **Tenant não recebe tráfego**:
   - Verifique a configuração do pool de backends
   - Confirme que os backends estão respondendo aos health checks
   - Verifique se o domínio está corretamente configurado

2. **Autenticação OIDC falha**:
   - Verifique as configurações do cliente OIDC
   - Confirme que as URLs de redirecionamento estão corretas
   - Verifique os logs do serviço de autenticação

3. **Problemas de desempenho**:
   - Monitore o uso de CPU e memória no Coolify
   - Ajuste limites de taxa para tenants com alto tráfego
   - Considere adicionar mais réplicas para distribuir a carga

## Solução de Problemas com Coolify

### Erro de Compilação - Versão do Go

Um dos problemas mais comuns ao realizar o deploy do VeloFlux no Coolify é relacionado à versão do Go. O erro abaixo indica incompatibilidade da versão:

```
go: golang.org/x/crypto@v0.36.0 requires go >= 1.23.0 (running go 1.23rc1)
```

**Solução:**

1. Crie um arquivo `.coolify/Dockerfile` personalizado no seu repositório:

```dockerfile
# Multi-stage build para VeloFlux LB
FROM golang:1.23 AS builder

# Instalar dependências
RUN apt-get update && apt-get install -y git ca-certificates tzdata nodejs npm

# Configurar diretório de trabalho
WORKDIR /app

# Copiar arquivos de módulo Go
COPY go.mod go.sum ./

# Download de dependências
RUN go mod download

# Copiar código-fonte
COPY . .

# Compilar o binário
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o veloflux-lb \
    ./cmd/velofluxlb

# Estágio final - imagem mínima
FROM gcr.io/distroless/static

USER nonroot:nonroot
COPY --from=builder /app/veloflux-lb /bin/veloflux
COPY --from=builder /app/dist /dist
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
EXPOSE 80 443 8080 9000
ENTRYPOINT ["/bin/veloflux"]
```

2. No painel do Coolify, ajuste as configurações de build:
   - Docker Build Method: Dockerfile
   - Dockerfile Path: `.coolify/Dockerfile`

### Erro de Configuração do Ambiente

Se você encontrar erros relacionados à configuração:

```
Error: Configuration file not found at /etc/veloflux/config.yaml
```

**Solução:**

1. Verifique se você configurou corretamente o volume para o arquivo de configuração:
   - No Coolify, acesse o serviço → Resources → Volumes
   - Verifique se o caminho do arquivo está correto: `/etc/veloflux/config.yaml`
   - Confirme que o conteúdo do arquivo está correto

2. Alternativa: Use variáveis de ambiente em vez do arquivo de configuração, definindo:
   ```
   VFX_CONFIG_JSON='{...configuração em formato JSON...}'
   ```

### Erro de Acesso ao Redis

Se o VeloFlux não conseguir se conectar ao Redis:

```
Error: failed to connect to redis: dial tcp: lookup redis on X.X.X.X:53: no such host
```

**Solução:**

1. Verifique a configuração de rede do Coolify:
   - Certifique-se de que o serviço VeloFlux está na mesma rede do Redis
   - Use o nome do serviço Redis como hostname, por exemplo: `redis-service`

2. Se estiver usando Redis externo, verifique se o endereço e a porta estão corretos
   
3. Para testar a conexão, adicione um comando temporário ao seu deployment:
   ```
   Command Override: /bin/sh -c "ping -c 3 redis-service && /bin/veloflux"
   ```

### Erro de Permissão em Volumes

Se houver problemas com permissões de arquivos:

```
Error: permission denied: /etc/veloflux/config.yaml
```

**Solução:**

1. Modifique seu Dockerfile para garantir permissões corretas:
```dockerfile
# Dentro do Dockerfile
RUN mkdir -p /etc/veloflux && chmod 777 /etc/veloflux
```

2. Ou use o comando de pre-deploy no Coolify:
```
mkdir -p /etc/veloflux && chmod 777 /etc/veloflux
```

### Erro de "go mod tidy"

Se você encontrar o erro:

```
go: updates to go.mod needed; to update it:
	go mod tidy
```

**Solução:**

1. Modifique o Dockerfile para incluir o comando `go mod tidy` antes da compilação:
   ```dockerfile
   # Copiar código-fonte
   COPY . .
   
   # Executar go mod tidy para garantir consistência das dependências
   RUN go mod tidy
   
   # Build da interface web
   RUN npm ci && npm run build
   ```

2. Esta etapa garante que as dependências do Go estejam consistentes antes de compilar o projeto

3. Se o problema persistir, você também pode adicionar um comando pré-build no Coolify:
   ```
   go mod tidy && go mod verify
   ```

4. Alternativamente, execute o script de configuração atualizado:
   ```bash
   bash scripts/setup_coolify.sh
   ```
   que já inclui essa correção no Dockerfile gerado

### Otimizando o Build no Coolify

Para acelerar o processo de build no Coolify:

1. Configure caching para dependências Go:
   - Em "Advanced Settings" do serviço, adicione:
   ```
   Build Cache: /go/pkg
   ```

2. Reduza o tamanho da imagem final usando multi-stage build (como mostrado no Dockerfile acima)

3. Para reconstruir completamente sem cache:
   - Acesse "Settings" do serviço
   - Selecione "Rebuild without cache"

## Considerações de Segurança para SaaS

### Isolamento de tenants

O VeloFlux SaaS implementa:

1. Isolamento de tráfego entre tenants
2. Limites de recursos por tenant
3. Configurações de WAF específicas por tenant
4. Auditoria de eventos por tenant

### Conformidade e proteção de dados

Para ambientes SaaS, considere:

1. Implantar o VeloFlux em regiões que atendam aos requisitos de residência de dados
2. Configurar políticas de retenção de logs
3. Implementar auditoria de acesso ao painel administrativo

## Arquivos de Suporte para Deploy no Coolify

Para facilitar o deploy do VeloFlux SaaS no Coolify, foram adicionados arquivos de suporte ao repositório:

### 1. Dockerfile Otimizado para Coolify

Um Dockerfile específico para o Coolify foi criado em `.coolify/Dockerfile`. Este Dockerfile:

- Utiliza a versão correta do Go (1.23)
- Implementa um build multi-stage para reduzir o tamanho da imagem
- Configura permissões adequadas para os arquivos de configuração
- Inclui todos os componentes necessários (GeoIP, certificados SSL, etc.)

### 2. Script de Configuração

O script `scripts/setup_coolify.sh` automatiza a preparação do ambiente para deploy no Coolify:

```bash
# Execute este script para preparar o ambiente
bash scripts/setup_coolify.sh
```

O script:
- Cria a estrutura de diretórios necessária
- Gera o Dockerfile otimizado se não existir
- Cria um arquivo de exemplo de configuração
- Gera uma lista de variáveis de ambiente necessárias

### 3. Verificação de Compatibilidade

Um workflow do GitHub Actions foi configurado em `.github/workflows/coolify-build.yml` para testar a compatibilidade com o Coolify automaticamente a cada commit.

### Como usar estes arquivos

1. Clone o repositório
2. Execute o script de configuração:
   ```bash
   bash scripts/setup_coolify.sh
   ```
3. No Coolify, configure seu serviço para usar `.coolify/Dockerfile` para o build
4. Configure as variáveis de ambiente listadas em `.coolify/environment.txt`
5. Configure o volume para o arquivo de configuração usando o modelo em `.coolify/config.example.yaml`

Esses arquivos garantem que o VeloFlux SaaS seja construído e executado corretamente no ambiente Coolify, minimizando erros comuns de deploy

## Scripts Auxiliares para Troubleshooting

Para ajudar na resolução de problemas durante o deploy, alguns scripts auxiliares foram criados:

### Script de Pré-build

O script `.coolify/pre-build.sh` pode ser configurado no Coolify para executar antes do build:

```bash
#!/bin/bash
# Script de pré-build para Coolify

set -e

echo "🔧 Executando pré-build para VeloFlux no Coolify..."

# Verificar e corrigir dependências Go
echo "📦 Verificando dependências Go..."
go mod tidy
go mod verify

echo "✅ Pré-build concluído com sucesso!"
```

Para usar este script no Coolify:
1. Vá para as configurações do seu serviço
2. Em "Build & Deploy" → "Pre Build Command", adicione:
   ```
   bash .coolify/pre-build.sh
   ```

### Script de Verificação de Deploy

O script `scripts/verify_coolify_deploy.sh` pode ser executado localmente antes de enviar as alterações para verificar se o projeto está pronto para deploy:

```bash
# Execute este script para verificar se o projeto está pronto para deploy
bash scripts/verify_coolify_deploy.sh
```

Este script verifica:
- Se as dependências Go estão consistentes
- Se o frontend constrói corretamente
- Se o backend compila sem erros
- Se os diretórios necessários existem

### Fluxo de Trabalho Recomendado

Para minimizar problemas de deploy:

1. Execute o script de verificação localmente:
   ```bash
   bash scripts/verify_coolify_deploy.sh
   ```

2. Execute o script de configuração do Coolify:
   ```bash
   bash scripts/setup_coolify.sh
   ```

3. Faça commit e push das alterações

4. Configure o Coolify para usar:
   - Dockerfile: `.coolify/Dockerfile`
   - Pre-Build Command: `bash .coolify/pre-build.sh`

Este fluxo de trabalho elimina a maioria dos problemas comuns de deploy.
