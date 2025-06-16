#!/bin/bash

# VeloFlux - Script de Teste Simplificado
# Este script configura e inicia o VeloFlux em modo de teste

set -e

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Verifica se o Docker está instalado
check_docker() {
    log "Verificando se o Docker está instalado..."
    if ! command -v docker &> /dev/null; then
        error "Docker não encontrado. Instale o Docker primeiro."
    fi
    
    if ! docker info &> /dev/null; then
        error "O serviço Docker não está em execução ou você não tem permissões."
    fi
}

# Verifica se o Docker Compose está instalado
check_docker_compose() {
    log "Verificando se o Docker Compose está instalado..."
    if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
        error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
    fi
}

# Cria diretório temporário de teste
create_test_dir() {
    log "Criando diretório temporário para teste..."
    TEST_DIR="/tmp/veloflux-test"
    mkdir -p "$TEST_DIR"
    mkdir -p "$TEST_DIR/config"
    mkdir -p "$TEST_DIR/certs"
    mkdir -p "$TEST_DIR/test"
}

# Cria arquivos de teste
create_test_files() {
    log "Criando arquivos de teste..."
    
    # Cria um arquivo de configuração simplificado
    cat > "$TEST_DIR/config/config.yaml" <<EOL
# VeloFlux Test Configuration
global:
  bind_address: "0.0.0.0:80"
  metrics_address: "0.0.0.0:8080"
  admin_api_address: "0.0.0.0:9000"
  
  health_check:
    interval: "10s"
    timeout: "2s"
    retries: 2

  rate_limit:
    enabled: true
    requests_per_second: 100
    burst_size: 200

  # Disabling features that require additional setup for testing
  waf:
    enabled: false
    
  geoip:
    enabled: false

# Test route configuration
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
          interval: "10s"
          healthy_threshold: 2
          unhealthy_threshold: 3
          
      - name: "backend-2"
        address: "backend-2:80"
        weight: 1
        health_check:
          path: "/health"
          interval: "10s"
          healthy_threshold: 2
          unhealthy_threshold: 3

# Simple auth for testing
auth:
  enabled: true
  jwt_secret: "test-secret-key-for-development-only"
  jwt_issuer: "veloflux-test"
  token_validity: "24h"
EOL

    # Cria página de teste para backend 1
    mkdir -p "$TEST_DIR/test"
    cat > "$TEST_DIR/test/backend1.html" <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Test - Backend 1</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0f8ff;
            color: #333;
            margin: 0;
            padding: 0;
            text-align: center;
        }
        .container {
            margin: 100px auto;
            max-width: 600px;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #0066cc;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>VeloFlux Test - Backend 1</h1>
        <p>This is Backend 1 responding to your request.</p>
        <p>Time: <span id="time"></span></p>
        <p>Server: Backend 1</p>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOL

    # Cria página de teste para backend 2
    cat > "$TEST_DIR/test/backend2.html" <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Test - Backend 2</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            background-color: #f0fff0;
            color: #333;
            margin: 0;
            padding: 0;
            text-align: center;
        }
        .container {
            margin: 100px auto;
            max-width: 600px;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 0 20px rgba(0,0,0,0.1);
        }
        h1 {
            color: #009900;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>VeloFlux Test - Backend 2</h1>
        <p>This is Backend 2 responding to your request.</p>
        <p>Time: <span id="time"></span></p>
        <p>Server: Backend 2</p>
    </div>
    <script>
        document.getElementById('time').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
EOL

    # Cria página de health check
    cat > "$TEST_DIR/test/health.html" <<EOL
OK
EOL

    # Cria Docker Compose para teste
    cat > "$TEST_DIR/docker-compose.test.yml" <<EOL
version: '3.8'

services:
  veloflux-lb:
    image: veloflux:test
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "8080:80"
      - "9080:8080"  # metrics
      - "9090:9000"  # admin API
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

    # Cria um Dockerfile para teste
    cat > "$TEST_DIR/Dockerfile.test" <<EOL
FROM golang:1.21-alpine AS builder

RUN apk add --no-cache git ca-certificates gcc musl-dev

WORKDIR /app
COPY . .

# Se estivéssemos copiando do repositório original, faríamos:
# RUN git clone https://github.com/eltonciatto/VeloFlux .

# Buildamos a versão mais simples possível
RUN go build -o veloflux-lb ./cmd/velofluxlb

FROM alpine:3.18

RUN apk --no-cache add ca-certificates

WORKDIR /app
COPY --from=builder /app/veloflux-lb /usr/local/bin/

EXPOSE 80 8080 9000

ENTRYPOINT ["/usr/local/bin/veloflux-lb"]
CMD ["--config", "/etc/veloflux/config.yaml"]
EOL

}

# Copia arquivos necessários
copy_files() {
    log "Copiando arquivos necessários..."
    
    # Diretório de origem (o repositório VeloFlux)
    SRC_DIR="/workspaces/VeloFlux"
    
    # Copia o código Go necessário
    mkdir -p "$TEST_DIR/cmd/velofluxlb"
    
    if [ -d "$SRC_DIR/cmd/velofluxlb" ]; then
        cp -r "$SRC_DIR/cmd/velofluxlb"/* "$TEST_DIR/cmd/velofluxlb/"
    else
        error "Diretório cmd/velofluxlb não encontrado no repositório"
    fi
    
    # Copia pacotes internos
    if [ -d "$SRC_DIR/internal" ]; then
        cp -r "$SRC_DIR/internal" "$TEST_DIR/"
    else
        error "Diretório internal não encontrado no repositório"
    fi
    
    # Copia go.mod e go.sum
    if [ -f "$SRC_DIR/go.mod" ]; then
        cp "$SRC_DIR/go.mod" "$TEST_DIR/"
    else
        error "Arquivo go.mod não encontrado no repositório"
    fi
    
    if [ -f "$SRC_DIR/go.sum" ]; then
        cp "$SRC_DIR/go.sum" "$TEST_DIR/"
    fi
}

# Constrói e inicia o container de teste
start_test() {
    log "Iniciando o teste do VeloFlux..."
    cd "$TEST_DIR"
    
    # Checamos se devemos usar docker-compose ou docker compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
    else
        DOCKER_COMPOSE="docker compose"
    fi
    
    # Construímos a imagem
    log "Construindo a imagem Docker..."
    $DOCKER_COMPOSE -f docker-compose.test.yml build
    
    # Iniciamos os containers
    log "Iniciando os containers..."
    $DOCKER_COMPOSE -f docker-compose.test.yml up -d
    
    # Aguardamos um pouco para inicialização
    log "Aguardando inicialização dos serviços..."
    sleep 5
    
    # Testamos se está respondendo
    log "Testando conectividade..."
    if curl -s http://localhost:8080 > /dev/null; then
        log "✅ VeloFlux está respondendo na porta 8080!"
        echo ""
        echo -e "${GREEN}====================================================${NC}"
        echo -e "${GREEN}    TESTE BEM-SUCEDIDO - VELOFLUX ESTÁ RODANDO     ${NC}"
        echo -e "${GREEN}====================================================${NC}"
        echo ""
        echo "Você pode acessar:"
        echo " - VeloFlux (balanceador): http://localhost:8080"
        echo " - Métricas: http://localhost:9080"
        echo " - API de administração: http://localhost:9090"
        echo ""
        echo "Para ver os logs:"
        echo " - $DOCKER_COMPOSE -f $TEST_DIR/docker-compose.test.yml logs -f veloflux-lb"
        echo ""
        echo "Para parar o teste:"
        echo " - $DOCKER_COMPOSE -f $TEST_DIR/docker-compose.test.yml down"
    else
        error "❌ VeloFlux não está respondendo! Verifique os logs do container para mais informações."
        echo ""
        echo "Para ver os logs:"
        echo " - $DOCKER_COMPOSE -f $TEST_DIR/docker-compose.test.yml logs veloflux-lb"
    fi
}

# Função principal
main() {
    log "Iniciando configuração de teste do VeloFlux..."
    
    check_docker
    check_docker_compose
    create_test_dir
    create_test_files
    copy_files
    start_test
}

# Executamos o script
main
