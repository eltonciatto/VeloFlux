#!/bin/bash

# Script de Teste de Portas de Produção - VeloFlux SaaS
# Configuração automática baseada no IP público atual do Codespace

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Detectar IP público e nome do Codespace
PUBLIC_IP=$(curl -s ifconfig.me)
CODESPACE_NAME=$(echo $CODESPACE_NAME)

log "IP Público detectado: $PUBLIC_IP"
log "Codespace: $CODESPACE_NAME"

# URLs base do Codespace
CODESPACE_BASE="${CODESPACE_NAME}.github.dev"

# Configurar domínios de teste
DOMAINS=(
    "public-80-${CODESPACE_BASE}"
    "admin-9090-${CODESPACE_BASE}"  
    "api-8080-${CODESPACE_BASE}"
    "tenant1-80-${CODESPACE_BASE}"
    "tenant2-80-${CODESPACE_BASE}"
)

PORTS_MAPPING=(
    "80:80"      # Landing page pública
    "443:443"    # HTTPS
    "8080:8080"  # Métricas
    "9090:9090"  # API Admin
    "8880:8080"  # Métricas externa
    "9900:9000"  # Admin API externa
)

log "Iniciando teste de configuração de portas de produção..."

# 1. Verificar conflitos de portas
log "Verificando conflitos de portas..."
for port_map in "${PORTS_MAPPING[@]}"; do
    external_port=$(echo $port_map | cut -d':' -f1)
    log "Verificando porta $external_port..."
    
    if lsof -i :$external_port >/dev/null 2>&1; then
        warning "Porta $external_port está em uso!"
        lsof -i :$external_port
    else
        success "Porta $external_port disponível"
    fi
done

# 2. Backup da configuração atual
log "Fazendo backup da configuração atual..."
cp /workspaces/VeloFlux/config/config.yaml /workspaces/VeloFlux/config/config.yaml.backup.$(date +%Y%m%d_%H%M%S)

# 3. Atualizar configuração com novos domínios
log "Atualizando configuração para Codespace..."

cat > /workspaces/VeloFlux/config/config-production.yaml << EOF
# VeloFlux LB - Configuração de Produção para Codespace
# IP Público: $PUBLIC_IP
# Codespace: $CODESPACE_NAME

global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  # TLS Configuration - Desabilitado para testes Codespace
  tls:
    auto_cert: false
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

  # WAF
  waf:
    enabled: true
    level: "standard"
    log_violations: true

# API Server  
api:
  bind_address: "0.0.0.0:9090"
  auth_enabled: true
  username: "admin"
  password: "veloflux-admin-password"

# Backend Pools
pools:
  - name: "tenant1-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-tenant1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "tenant2-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-tenant2:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "api-pool"
    algorithm: "least_conn"
    sticky_sessions: false
    backends:
      - address: "backend-tenant1:80"
        weight: 100
        health_check:
          path: "/api/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "admin-pool"
    algorithm: "least_conn"
    sticky_sessions: true
    backends:
      - address: "backend-tenant1:80"
        weight: 100
        health_check:
          path: "/admin/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "public-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-tenant1:80"
        weight: 100
        health_check:
          path: "/public/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

# Routing Rules - Configuração para Codespace
routes:
  # Rota padrão para landing page
  - host: "localhost"
    pool: "public-pool"
    path_prefix: "/public"
    
  # Rotas para diferentes caminhos
  - host: "*"
    pool: "public-pool"
    path_prefix: "/public"
    
  - host: "*"
    pool: "tenant1-pool"
    path_prefix: "/tenant1"

  - host: "*"
    pool: "tenant2-pool"
    path_prefix: "/tenant2"

  - host: "*"
    pool: "api-pool"
    path_prefix: "/api"

  - host: "*"
    pool: "admin-pool"
    path_prefix: "/admin"
EOF

# 4. Criar docker-compose de produção
log "Criando docker-compose de produção..."

cat > /workspaces/VeloFlux/docker-compose.production.yml << EOF
# VeloFlux Docker Compose - Produção Codespace
# IP: $PUBLIC_IP | Codespace: $CODESPACE_NAME

services:
  veloflux-lb:
    build: .
    container_name: veloflux-lb-prod
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP principal - Landing Page
      - "443:443"    # HTTPS (futuro)
      - "8880:8080"  # Métricas (porta externa diferente para evitar conflitos)
      - "9090:9090"  # Admin API
    environment:
      - VFX_CONFIG=/etc/veloflux/config-production.yaml
      - VFX_LOG_LEVEL=info
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=veloflux123
    volumes:
      - ./config:/etc/veloflux
      - ./certs:/etc/ssl/certs/veloflux
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost/public/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    depends_on:
      - backend-tenant1
      - backend-tenant2
      - redis
    networks:
      - veloflux-net
      
  backend-tenant1:
    image: nginx:alpine
    container_name: veloflux-tenant1-prod
    restart: unless-stopped
    volumes:
      - ./test/tenant1/index.html:/usr/share/nginx/html/index.html:ro
      - ./test/tenant1/health:/usr/share/nginx/html/health:ro
      - ./test/admin:/usr/share/nginx/html/admin:ro
      - ./test/api:/usr/share/nginx/html/api:ro
      - ./test/public:/usr/share/nginx/html/public:ro
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - veloflux-net
  
  backend-tenant2:
    image: nginx:alpine
    container_name: veloflux-tenant2-prod
    restart: unless-stopped
    volumes:
      - ./test/tenant2/index.html:/usr/share/nginx/html/index.html:ro
      - ./test/tenant2/health:/usr/share/nginx/html/health:ro
      - ./test/admin:/usr/share/nginx/html/admin:ro
      - ./test/api:/usr/share/nginx/html/api:ro
      - ./test/public:/usr/share/nginx/html/public:ro
    healthcheck:
      test: ["CMD", "wget", "-q", "-O-", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
    networks:
      - veloflux-net

  redis:
    image: redis:alpine
    container_name: veloflux-redis-prod
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - veloflux-net

volumes:
  redis-data:

networks:
  veloflux-net:
    driver: bridge
EOF

# 5. Função para testar conectividade
test_connectivity() {
    local url=$1
    local description=$2
    
    log "Testando: $description ($url)"
    
    if curl -s -f -m 10 "$url" >/dev/null; then
        success "✓ $description funcionando"
        return 0
    else
        error "✗ $description com problema"
        return 1
    fi
}

# 6. Preparar ambiente de testes
log "Preparando ambiente de testes..."

# Parar containers existentes se houver
docker-compose -f docker-compose.yml down 2>/dev/null || true
docker-compose -f docker-compose.production.yml down 2>/dev/null || true

# Limpar containers órfãos
docker container prune -f >/dev/null 2>&1 || true

success "Script de configuração de portas de produção concluído!"

log "Próximos passos:"
echo "1. Execute: docker-compose -f docker-compose.production.yml up -d"
echo "2. Aguarde os containers iniciarem (~30s)"
echo "3. Execute: ./scripts/production-ports-test.sh test"
echo ""
echo "URLs para teste no Codespace:"
echo "- Landing Page: https://${CODESPACE_BASE}/public/"
echo "- Admin Panel: https://${CODESPACE_BASE}:9090/admin/"  
echo "- API: https://${CODESPACE_BASE}:8880/api/"
echo "- Tenant1: https://${CODESPACE_BASE}/tenant1/"
echo "- Tenant2: https://${CODESPACE_BASE}/tenant2/"

# Se argumento for "test", executar testes
if [ "$1" = "test" ]; then
    log "Executando testes de conectividade..."
    sleep 2
    
    BASE_URL="https://${CODESPACE_BASE}"
    
    test_connectivity "${BASE_URL}/public/" "Landing Page Pública"
    test_connectivity "${BASE_URL}:9090/admin/" "Painel Administrativo"
    test_connectivity "${BASE_URL}:8880/api/" "API de Métricas"
    test_connectivity "${BASE_URL}/tenant1/" "Tenant 1"
    test_connectivity "${BASE_URL}/tenant2/" "Tenant 2"
    
    log "Teste de conectividade concluído!"
fi
