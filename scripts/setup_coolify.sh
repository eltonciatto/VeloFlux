# VeloFlux Coolify Configuration Helper
#
# Este script ajuda a preparar o ambiente Coolify para o deploy do VeloFlux
# Uso: bash setup_coolify.sh

#!/bin/bash
set -e

echo "🚀 Preparando ambiente Coolify para deploy do VeloFlux..."

# Verificar se o diretório .coolify existe
if [ ! -d ".coolify" ]; then
  mkdir -p .coolify
  echo "✅ Diretório .coolify criado"
else
  echo "✅ Diretório .coolify já existe"
fi

# Verificar se o Dockerfile personalizado existe
if [ ! -f ".coolify/Dockerfile" ]; then
  echo "⚠️ Dockerfile personalizado não encontrado"
  echo "🔄 Criando Dockerfile para Coolify..."
  
  cat > .coolify/Dockerfile << 'EOF'
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

# Build da interface web
RUN npm ci && npm run build

# Compilar o binário
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build \
    -ldflags='-w -s -extldflags "-static"' \
    -o veloflux-lb \
    ./cmd/velofluxlb

# Download da base de dados GeoIP
FROM alpine:latest AS geoip
RUN apk add --no-cache curl unzip
WORKDIR /geoip
RUN mkdir -p /geoip && \
    echo "This is a placeholder for the GeoIP database" > /geoip/GeoLite2-City.mmdb

# Estágio final - imagem mínima
FROM gcr.io/distroless/static

USER nonroot:nonroot
COPY --from=builder /app/veloflux-lb /bin/veloflux
COPY --from=builder /app/dist /dist
COPY --from=builder /etc/ssl/certs/ca-certificates.crt /etc/ssl/certs/
COPY --from=geoip /geoip /etc/geoip

# Criar diretórios necessários com as permissões adequadas
COPY --from=builder --chown=nonroot:nonroot /app/config /etc/veloflux

EXPOSE 80 443 8080 9000
ENTRYPOINT ["/bin/veloflux"]
EOF
  
  echo "✅ Dockerfile criado em .coolify/Dockerfile"
else
  echo "✅ Dockerfile personalizado já existe"
fi

# Criar arquivo de configuração de exemplo para Coolify
echo "🔄 Criando arquivo de configuração de exemplo para Coolify..."

cat > .coolify/config.example.yaml << 'EOF'
# VeloFlux SaaS - Configuração para Coolify
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  tls:
    auto_cert: true
    acme_email: "${ACME_EMAIL}"
    cert_dir: "/etc/ssl/certs/veloflux"

  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"

  waf:
    enabled: true
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"
    log_violations: true

  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"

auth:
  enabled: true
  jwt_secret: "${JWT_SECRET}"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  oidc_enabled: true
  oidc_issuer_url: "${OIDC_ISSUER_URL}"
  oidc_client_id: "${OIDC_CLIENT_ID}"
  oidc_redirect_uri: "${OIDC_REDIRECT_URI}"

database:
  enabled: true
  url: "${DATABASE_URL}"
  auto_migrate: true
  pool_size: 10
  max_idle_conn: 5

cluster:
  enabled: true
  redis_address: "${REDIS_ADDRESS}"
  redis_password: "${REDIS_PASSWORD}"
  redis_db: 0
  node_id: ""
  heartbeat_interval: "5s"
  leader_timeout: "15s"

api:
  bind_address: "0.0.0.0:9090"
  auth_enabled: true
  username: "${ADMIN_USERNAME}"
  password: "${ADMIN_PASSWORD}"

multi_tenant:
  enabled: true
  auto_provision: true
  default_limits:
    max_traffic_per_day: 10737418240
    max_requests_per_second: 100
    max_domains: 5
    waf_enabled: true
    waf_level: "standard"
  domain_pattern: "${TENANT_ID}.${VELOFLUX_DOMAIN}"
EOF

echo "✅ Arquivo de configuração de exemplo criado em .coolify/config.example.yaml"

echo "🔄 Gerando lista de variáveis de ambiente necessárias..."

cat > .coolify/environment.txt << 'EOF'
# Variáveis de ambiente necessárias para VeloFlux no Coolify

# Configuração Geral
VFX_CONFIG=/etc/veloflux/config.yaml
VFX_LOG_LEVEL=info

# Autenticação
JWT_SECRET=gere-uma-chave-secreta-forte
ADMIN_USERNAME=admin
ADMIN_PASSWORD=senha-segura-para-admin

# OIDC
OIDC_ISSUER_URL=https://auth.veloflux.io/realms/veloflux
OIDC_CLIENT_ID=veloflux-admin
OIDC_REDIRECT_URI=https://admin.veloflux.io/auth/callback

# Banco de Dados
DATABASE_URL=postgresql://user:password@database:5432/veloflux

# Redis
REDIS_ADDRESS=redis:6379
REDIS_PASSWORD=senha-redis

# Configuração de Email
ACME_EMAIL=seu-email@exemplo.com

# Domínio
VELOFLUX_DOMAIN=veloflux.io
EOF

echo "✅ Lista de variáveis de ambiente gerada em .coolify/environment.txt"

echo "✨ Tudo pronto! Agora você pode:"
echo "1. Configurar seu projeto no Coolify usando o Dockerfile em .coolify/Dockerfile"
echo "2. Configurar as variáveis de ambiente listadas em .coolify/environment.txt"
echo "3. Usar o arquivo de configuração de exemplo em .coolify/config.example.yaml"
