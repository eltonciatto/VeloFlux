#!/bin/bash

# VeloFlux - Script de Teste Simplificado para Porta 8001
# Este script configura e inicia o VeloFlux em modo de teste usando porta 8001

set -e

# Diretórios e variáveis
TEST_DIR="/tmp/veloflux-test"
SRC_DIR="/workspaces/VeloFlux"
API_PORT=8082
METRICS_PORT=9080
ADMIN_PORT=9090

# Logs simplificados
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Etapa 1: Limpar ambiente anterior
log "Limpando ambiente anterior..."
if [ -d "$TEST_DIR" ]; then
    cd "$TEST_DIR" 2>/dev/null
    if [ -f "docker-compose.test.yml" ]; then
        docker compose -f docker-compose.test.yml down 2>/dev/null || true
    fi
    cd / || exit
fi

# Remover containers antigos se necessário
docker ps | grep -q "veloflux-test" && {
    docker ps | grep "veloflux-test" | awk '{print $1}' | xargs docker stop 2>/dev/null || true
    docker ps -a | grep "veloflux-test" | awk '{print $1}' | xargs docker rm -f 2>/dev/null || true
}

# Remover diretório anterior
rm -rf "$TEST_DIR" 2>/dev/null || sudo rm -rf "$TEST_DIR" 2>/dev/null

# Etapa 2: Criar estrutura de teste
log "Criando diretório de teste..."
mkdir -p "$TEST_DIR"
mkdir -p "$TEST_DIR/config"
mkdir -p "$TEST_DIR/test"
mkdir -p "$TEST_DIR/cmd/velofluxlb"

# Etapa 3: Criar configuração
log "Criando configuração do VeloFlux..."
cat > "$TEST_DIR/config/config.yaml" << EOL
# VeloFlux Test Configuration
global:
  bind_address: "0.0.0.0:80"  # Use padrão dentro do container
  metrics_address: "0.0.0.0:8080"
  admin_api_address: "0.0.0.0:9000"
  
  health_check:
    interval: "5s"
    timeout: "2s"
    retries: 2

  rate_limit:
    enabled: true
    requests_per_second: 100
    burst_size: 200

  # Desativando recursos que requerem configuração adicional
  waf:
    enabled: false
    
  geoip:
    enabled: false

# Configuração de rota de teste
routes:
  - name: "test-route"
    host: "*"
    path_prefix: "/"
    backend_protocol: "http"
    backend_timeout: "30s"
    load_balancing:
      method: "round_robin"
    backends:
      - name: "backend-1"
        address: "backend-1:80"
        weight: 1
        health_check:
          path: "/health"
          interval: "5s"
          healthy_threshold: 2
          unhealthy_threshold: 3
          
      - name: "backend-2"
        address: "backend-2:80"
        weight: 1
        health_check:
          path: "/health"
          interval: "5s"
          healthy_threshold: 2
          unhealthy_threshold: 3

# Autenticação simples para teste
auth:
  enabled: true
  jwt_secret: "test-secret-key-for-development-only"
  jwt_issuer: "veloflux-test"
  token_validity: "24h"

# Configuração Redis
cluster:
  enabled: true
  redis_address: "redis:6379"
  redis_password: ""
  redis_db: 0
EOL

# Etapa 4: Criar páginas de teste
log "Criando páginas de teste..."
cat > "$TEST_DIR/test/backend1.html" << EOL
<!DOCTYPE html>
<html>
<head><title>Backend 1</title></head>
<body>
    <h1>VeloFlux Test - Backend 1</h1>
    <p>This is Backend 1 responding to your request.</p>
    <p>Time: <span id="time"></span></p>
    <script>document.getElementById('time').textContent = new Date().toLocaleString();</script>
</body>
</html>
EOL

cat > "$TEST_DIR/test/backend2.html" << EOL
<!DOCTYPE html>
<html>
<head><title>Backend 2</title></head>
<body>
    <h1>VeloFlux Test - Backend 2</h1>
    <p>This is Backend 2 responding to your request.</p>
    <p>Time: <span id="time"></span></p>
    <script>document.getElementById('time').textContent = new Date().toLocaleString();</script>
</body>
</html>
EOL

cat > "$TEST_DIR/test/health.html" << EOL
OK
EOL

# Etapa 5: Criar Docker Compose para teste
log "Criando Docker Compose para teste..."
cat > "$TEST_DIR/docker-compose.test.yml" << EOL
version: '3.8'

services:
  veloflux-lb:
    image: veloflux:test
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "${API_PORT}:80"
      - "${METRICS_PORT}:8080"
      - "${ADMIN_PORT}:9000"
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=debug
    volumes:
      - ./config:/etc/veloflux
    depends_on:
      - backend-1
      - backend-2
      - redis
    restart: unless-stopped

  backend-1:
    image: nginx:alpine
    volumes:
      - ./test/backend1.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro
    
  backend-2:
    image: nginx:alpine
    volumes:
      - ./test/backend2.html:/usr/share/nginx/html/index.html:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes

networks:
  default:
    driver: bridge
EOL

# Etapa 6: Criar Dockerfile para teste
log "Criando Dockerfile para teste..."
cat > "$TEST_DIR/Dockerfile.test" << EOL
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates gcc musl-dev curl netcat-openbsd

WORKDIR /app
COPY . .

RUN go build -o veloflux-lb ./cmd/velofluxlb

FROM alpine:3.18

RUN apk --no-cache add ca-certificates curl netcat-openbsd

WORKDIR /app
COPY --from=builder /app/veloflux-lb /usr/local/bin/

EXPOSE 80 8080 9000

ENTRYPOINT ["/usr/local/bin/veloflux-lb"]
CMD ["--config", "/etc/veloflux/config.yaml"]
EOL

# Etapa 7: Copiar código fonte
log "Copiando código fonte..."
if [ -d "$SRC_DIR/cmd/velofluxlb" ]; then
    cp -r "$SRC_DIR/cmd/velofluxlb"/* "$TEST_DIR/cmd/velofluxlb/" || {
        log "Erro ao copiar cmd/velofluxlb, tentando com sudo..."
        sudo cp -r "$SRC_DIR/cmd/velofluxlb"/* "$TEST_DIR/cmd/velofluxlb/"
    }
else
    log "ERRO: Diretório cmd/velofluxlb não encontrado"
    exit 1
fi

if [ -d "$SRC_DIR/internal" ]; then
    cp -r "$SRC_DIR/internal" "$TEST_DIR/" || {
        log "Erro ao copiar internal, tentando com sudo..."
        sudo cp -r "$SRC_DIR/internal" "$TEST_DIR/"
    }
else
    log "ERRO: Diretório internal não encontrado"
    exit 1
fi

if [ -f "$SRC_DIR/go.mod" ]; then
    cp "$SRC_DIR/go.mod" "$TEST_DIR/" || sudo cp "$SRC_DIR/go.mod" "$TEST_DIR/"
else
    log "ERRO: Arquivo go.mod não encontrado"
    exit 1
fi

if [ -f "$SRC_DIR/go.sum" ]; then
    cp "$SRC_DIR/go.sum" "$TEST_DIR/" || sudo cp "$SRC_DIR/go.sum" "$TEST_DIR/"
fi

# Corrigir permissões
chmod -R 755 "$TEST_DIR" || sudo chmod -R 755 "$TEST_DIR"

# Etapa 8: Construir e iniciar containers
log "Construindo e iniciando containers..."
cd "$TEST_DIR"
docker compose -f docker-compose.test.yml build
docker compose -f docker-compose.test.yml up -d

# Etapa 9: Aguardar e testar
log "Aguardando inicialização dos serviços (10s)..."
sleep 10

# Etapa 10: Testar conectividade
log "Verificando serviços..."

# Instalar curl no container
log "Instalando ferramentas no container VeloFlux..."
docker exec veloflux-test-veloflux-lb-1 apk add --no-cache curl netcat-openbsd >/dev/null 2>&1 || true

# Verificar conectividade interna
log "Testando conectividade interna..."
if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-1 >/dev/null; then
    log "✓ Conectividade com backend-1 OK"
else
    log "✗ Não foi possível conectar ao backend-1"
fi

if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-2 >/dev/null; then
    log "✓ Conectividade com backend-2 OK"
else
    log "✗ Não foi possível conectar ao backend-2"
fi

if docker exec veloflux-test-veloflux-lb-1 nc -z redis 6379; then
    log "✓ Conectividade com Redis OK"
else
    log "✗ Não foi possível conectar ao Redis"
fi

# Verificar health checks
log "Verificando health checks..."
if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-1/health | grep -q "OK"; then
    log "✓ Health check do backend-1 OK"
else
    log "✗ Health check do backend-1 falhou"
fi

if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-2/health | grep -q "OK"; then
    log "✓ Health check do backend-2 OK"
else
    log "✗ Health check do backend-2 falhou"
fi

# Verificar VeloFlux
log "Verificando VeloFlux..."
if curl -s "http://localhost:${API_PORT}" >/dev/null; then
    log "✓ VeloFlux está respondendo na porta ${API_PORT}"
    curl -v "http://localhost:${API_PORT}"
else
    log "✗ VeloFlux não está respondendo na porta ${API_PORT}"
    
    # Verificar logs do container
    log "Últimas linhas de log do container VeloFlux:"
    docker logs veloflux-test-veloflux-lb-1 --tail 20
    
    # Verificar portas do container
    log "Portas em uso dentro do container:"
    docker exec veloflux-test-veloflux-lb-1 netstat -tulpn 2>/dev/null || docker exec veloflux-test-veloflux-lb-1 ss -tulpn
fi

log "Teste concluído. Acesse o VeloFlux em http://localhost:${API_PORT}"
