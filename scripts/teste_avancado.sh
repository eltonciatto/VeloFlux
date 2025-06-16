#!/bin/bash

# VeloFlux - Script de Teste Aprimorado
# Este script configura e soluciona problemas no ambiente de teste do VeloFlux

set -e

# Funções de log simplificadas
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

info() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1"
}

warn() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: $1"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1"
    if [ "$2" != "continue" ]; then
        exit 1
    fi
}

# Verifica se o Docker está instalado
check_docker() {
    log "Verificando Docker e Docker Compose..."
    if ! command -v docker &> /dev/null; then
        error "Docker não encontrado. Instale o Docker primeiro."
    fi
    
    if ! docker info &> /dev/null; then
        error "O serviço Docker não está em execução ou você não tem permissões."
    fi
    
    # Verificar o Docker Compose
    if command -v docker-compose &> /dev/null; then
        DOCKER_COMPOSE="docker-compose"
        info "Usando docker-compose standalone"
    elif docker compose version &> /dev/null; then
        DOCKER_COMPOSE="docker compose"
        info "Usando docker compose plugin"
    else
        error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
    fi
}

# Limpa o ambiente de teste anterior, se existir
cleanup_test_env() {
    log "Limpando ambiente de teste anterior..."
    TEST_DIR="/tmp/veloflux-test"
    
    if [ -d "$TEST_DIR" ]; then
        info "Diretório de teste encontrado, parando containers..."
        cd "$TEST_DIR" || return
        if [ -f "docker-compose.test.yml" ]; then
            $DOCKER_COMPOSE -f docker-compose.test.yml down 2>/dev/null || true
        fi
        info "Removendo diretório de teste antigo..."
        cd / || return
        rm -rf "$TEST_DIR"
    fi
    
    # Verificar se há containers de teste ainda em execução
    if docker ps | grep -q "veloflux-test"; then
        warn "Containers de teste ainda em execução, forçando remoção..."
        docker ps | grep "veloflux-test" | awk '{print $1}' | xargs docker stop 2>/dev/null || true
        docker ps -a | grep "veloflux-test" | awk '{print $1}' | xargs docker rm -f 2>/dev/null || true
    fi
}

# Verifica portas em uso
check_ports() {
    log "Verificando portas em uso..."
    
    PORTS_IN_USE=$(netstat -tulpn 2>/dev/null | grep LISTEN || ss -tulpn | grep LISTEN)
    
    HTTP_PORT=8001
    API_PORT=8082
    METRICS_PORT=9080
    ADMIN_PORT=9090
    
    # Verificar se as portas alternativas estão disponíveis
    for port in $HTTP_PORT $API_PORT $METRICS_PORT $ADMIN_PORT; do
        if echo "$PORTS_IN_USE" | grep -q ":$port\\b"; then
            warn "A porta $port já está em uso!"
        else
            info "A porta $port está disponível"
        fi
    done
    
    echo "HTTP_PORT=$HTTP_PORT API_PORT=$API_PORT METRICS_PORT=$METRICS_PORT ADMIN_PORT=$ADMIN_PORT"
}

# Configura o ambiente de teste
setup_test_env() {
    log "Configurando ambiente de teste..."
    
    # Obter portas disponíveis
    PORTS=$(check_ports)
    eval "$PORTS"
    
    # Criar diretório de teste
    TEST_DIR="/tmp/veloflux-test"
    mkdir -p "$TEST_DIR"
    mkdir -p "$TEST_DIR/config"
    mkdir -p "$TEST_DIR/test"
    
    # Criar configuração do VeloFlux
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

# Simple auth for testing
auth:
  enabled: true
  jwt_secret: "test-secret-key-for-development-only"
  jwt_issuer: "veloflux-test"
  token_validity: "24h"

# Redis configuration
cluster:
  enabled: true
  redis_address: "redis:6379"
  redis_password: ""
  redis_db: 0
EOL
    
    # Criar páginas de teste para os backends
    log "Criando páginas de teste para backends..."
    cat > "$TEST_DIR/test/backend1.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Test - Backend 1</title>
    <style>
        body { font-family: Arial; background-color: #f0f8ff; text-align: center; }
        .container { margin: 100px auto; max-width: 600px; padding: 20px; background-color: #fff; border-radius: 10px; }
        h1 { color: #0066cc; }
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

    cat > "$TEST_DIR/test/backend2.html" << EOL
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Test - Backend 2</title>
    <style>
        body { font-family: Arial; background-color: #f0fff0; text-align: center; }
        .container { margin: 100px auto; max-width: 600px; padding: 20px; background-color: #fff; border-radius: 10px; }
        h1 { color: #009900; }
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

    cat > "$TEST_DIR/test/health.html" << EOL
OK
EOL
    
    # Criar Docker Compose para teste
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
    
    # Criar Dockerfile para teste
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
    
    # Copiar código fonte
    log "Copiando código fonte..."
    SRC_DIR="/workspaces/VeloFlux"
    
    mkdir -p "$TEST_DIR/cmd/velofluxlb"
    mkdir -p "$TEST_DIR/internal"
    
    if [ -d "$SRC_DIR/cmd/velofluxlb" ]; then
        cp -r "$SRC_DIR/cmd/velofluxlb"/* "$TEST_DIR/cmd/velofluxlb/"
    else
        error "Diretório cmd/velofluxlb não encontrado"
    fi
    
    if [ -d "$SRC_DIR/internal" ]; then
        cp -r "$SRC_DIR/internal" "$TEST_DIR/"
    else
        error "Diretório internal não encontrado"
    fi
    
    if [ -f "$SRC_DIR/go.mod" ]; then
        cp "$SRC_DIR/go.mod" "$TEST_DIR/"
    else
        error "Arquivo go.mod não encontrado"
    fi
    
    if [ -f "$SRC_DIR/go.sum" ]; then
        cp "$SRC_DIR/go.sum" "$TEST_DIR/"
    fi
}

# Constrói e inicia os containers
build_and_start() {
    log "Construindo e iniciando containers..."
    cd "$TEST_DIR" || exit 1
    
    # Construir a imagem
    $DOCKER_COMPOSE -f docker-compose.test.yml build
    
    # Iniciar os containers
    $DOCKER_COMPOSE -f docker-compose.test.yml up -d
    
    # Aguardar inicialização
    log "Aguardando inicialização dos serviços (10s)..."
    sleep 10
}

# Verifica saúde dos serviços
check_health() {
    log "Verificando saúde dos serviços..."
    cd "$TEST_DIR" || exit 1
    
    # Verifique portas em uso
    PORTS=$(check_ports)
    eval "$PORTS"
    
    # Verificar se os containers estão rodando
    if ! $DOCKER_COMPOSE -f docker-compose.test.yml ps | grep -q "veloflux-lb" || 
       ! docker ps | grep -q "veloflux-test-veloflux-lb"; then
        error "Container VeloFlux não está rodando" "continue"
        $DOCKER_COMPOSE -f docker-compose.test.yml logs veloflux-lb
        return 1
    fi
    
    # Instalar ferramentas no container se necessário
    docker exec -it veloflux-test-veloflux-lb-1 which curl >/dev/null 2>&1 || {
        log "Instalando curl no container..."
        docker exec -it veloflux-test-veloflux-lb-1 apk add --no-cache curl >/dev/null 2>&1
    }
    
    docker exec -it veloflux-test-veloflux-lb-1 which nc >/dev/null 2>&1 || {
        log "Instalando netcat no container..."
        docker exec -it veloflux-test-veloflux-lb-1 apk add --no-cache netcat-openbsd >/dev/null 2>&1
    }
    
    # Verificar conectividade interna
    log "Verificando conectividade interna..."
    
    if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-1 >/dev/null; then
        info "Conectividade com backend-1 OK"
    else
        error "Não foi possível conectar ao backend-1" "continue"
    fi
    
    if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-2 >/dev/null; then
        info "Conectividade com backend-2 OK"
    else
        error "Não foi possível conectar ao backend-2" "continue"
    fi
    
    if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-1/health | grep -q "OK"; then
        info "Health check do backend-1 OK"
    else
        error "Health check do backend-1 falhou" "continue"
    fi
    
    if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-2/health | grep -q "OK"; then
        info "Health check do backend-2 OK"
    else
        error "Health check do backend-2 falhou" "continue"
    fi
    
    # Verificar conectividade com Redis
    if docker exec -it veloflux-test-veloflux-lb-1 nc -zv redis 6379; then
        info "Conectividade com Redis OK"
    else
        error "Não foi possível conectar ao Redis" "continue"
    fi
    
    # Verificar portas expostas
    log "Verificando portas expostas..."
    
    if curl -s "http://localhost:${API_PORT}" >/dev/null; then
        info "VeloFlux está respondendo na porta ${API_PORT}"
        curl -v "http://localhost:${API_PORT}"
    else
        error "VeloFlux não está respondendo na porta ${API_PORT}" "continue"
    fi
    
    # Verificar métricas
    if curl -s "http://localhost:${METRICS_PORT}/metrics" | grep -q "veloflux"; then
        info "Endpoint de métricas está funcionando"
    else
        warn "Endpoint de métricas pode não estar configurado corretamente"
    fi
    
    # Verificar API de administração
    if curl -s "http://localhost:${ADMIN_PORT}/api/health" >/dev/null; then
        info "API de administração está funcionando"
    else
        warn "API de administração pode não estar funcionando corretamente"
    fi
    
    # Verificar logs do container
    log "Últimas linhas de log do container VeloFlux:"
    docker logs veloflux-test-veloflux-lb-1 --tail 20
    
    # Verificar portas internas do container
    log "Portas em uso dentro do container:"
    docker exec veloflux-test-veloflux-lb-1 netstat -tulpn || docker exec veloflux-test-veloflux-lb-1 ss -tulpn
}

# Função principal
main() {
    echo "================================================="
    echo "    VELOFLUX - AMBIENTE DE TESTE APRIMORADO      "
    echo "================================================="
    
    check_docker
    cleanup_test_env
    setup_test_env
    build_and_start
    check_health
    
    echo ""
    echo "================================================="
    echo "    TESTE DO VELOFLUX CONCLUÍDO                  " 
    echo "================================================="
    echo ""
    echo "Para acessar o VeloFlux: http://localhost:${API_PORT}"
    echo "Para acessar as métricas: http://localhost:${METRICS_PORT}/metrics"
    echo "Para acessar a API de admin: http://localhost:${ADMIN_PORT}/api/health"
    echo ""
    echo "Para ver os logs: docker logs veloflux-test-veloflux-lb-1"
    echo "Para parar os containers: cd /tmp/veloflux-test && $DOCKER_COMPOSE -f docker-compose.test.yml down"
}

# Executar o script
main "$@"
