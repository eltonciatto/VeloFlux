#!/bin/bash

# VeloFlux - Script de Teste Melhorado
# Este script configura e inicia o VeloFlux em modo de teste, com resolução de problemas comuns

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Limpa containers e diretórios de teste anteriores
cleanup() {
    log "Limpando ambiente de teste anterior..."
    
    # Primeiro para os containers se estiverem rodando
    if docker ps -q --filter "name=veloflux-test" | grep -q .; then
        log "Parando containers existentes..."
        docker stop $(docker ps -q --filter "name=veloflux-test") 2>/dev/null || true
        docker rm $(docker ps -aq --filter "name=veloflux-test") 2>/dev/null || true
    fi
    
    # Remover diretório temporário se existir
    TEST_DIR="/tmp/veloflux-test"
    if [ -d "$TEST_DIR" ]; then
        log "Removendo diretório de teste antigo..."
        rm -rf $TEST_DIR || {
            warn "Não foi possível remover o diretório anterior. Tentando com sudo..."
            sudo rm -rf $TEST_DIR || warn "Falha ao remover diretório antigo. Continuando..."
        }
    fi
    
    # Cria novo diretório
    log "Criando novo diretório de teste..."
    mkdir -p $TEST_DIR || {
        warn "Não foi possível criar o diretório. Tentando com sudo..."
        sudo mkdir -p $TEST_DIR || error "Falha ao criar diretório de teste. Abortando."
        sudo chown -R $(whoami) $TEST_DIR || warn "Não foi possível alterar o proprietário do diretório."
    }
    
    # Cria estrutura de diretórios
    mkdir -p $TEST_DIR/config || error "Falha ao criar diretório de configuração"
    mkdir -p $TEST_DIR/test || error "Falha ao criar diretório de teste"
}

# Verifica se o Docker está instalado
check_docker() {
    log "Verificando requisitos Docker..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker não encontrado. Instale o Docker primeiro."
    fi
    
    if ! docker info &> /dev/null; then
        error "O serviço Docker não está em execução ou você não tem permissões."
    fi
    
    # Verifica Docker Compose
    if command -v docker-compose &> /dev/null; then
        log "Docker Compose (standalone) encontrado."
        DOCKER_COMPOSE="docker-compose"
    elif docker compose version &> /dev/null; then
        log "Docker Compose (plugin) encontrado."
        DOCKER_COMPOSE="docker compose"
    else
        error "Docker Compose não encontrado. Instale o Docker Compose primeiro."
    fi
}

# Verifica portas em uso
check_ports() {
    log "Verificando portas em uso..."
    
    PORTS_IN_USE=$(netstat -tulpn 2>/dev/null | grep LISTEN || ss -tulpn | grep LISTEN)
    CONFLICTS=0
    
    if echo "$PORTS_IN_USE" | grep -q ":8001"; then
        warn "Porta 8001 já está em uso. O VeloFlux usará esta porta internamente."
        CONFLICTS=1
    fi
    
    if echo "$PORTS_IN_USE" | grep -q ":8081"; then
        warn "Porta 8081 já está em uso. Esta porta será mapeada para o VeloFlux no host."
        CONFLICTS=1
    fi
    
    if echo "$PORTS_IN_USE" | grep -q ":9080"; then
        warn "Porta 9080 já está em uso (métricas)."
        CONFLICTS=1
    fi
    
    if echo "$PORTS_IN_USE" | grep -q ":9090"; then
        warn "Porta 9090 já está em uso (API de administração)."
        CONFLICTS=1
    fi
    
    if [ $CONFLICTS -eq 1 ]; then
        read -p "Conflitos de porta detectados. Deseja continuar mesmo assim? (s/n): " CONTINUE
        if [ "$CONTINUE" != "s" ]; then
            error "Abortando teste devido a conflitos de porta."
        fi
    else
        log "Nenhum conflito de porta detectado."
    fi
}

# Criar arquivos de configuração para teste
create_config() {
    log "Criando arquivos de configuração de teste..."
    
    # Configuração principal do VeloFlux
    cat > "$TEST_DIR/config/config.yaml" <<EOL
# VeloFlux Test Configuration
global:
  bind_address: "0.0.0.0:8001"  # Usando porta 8001 para evitar conflitos
  metrics_address: "0.0.0.0:8080"
  admin_api_address: "0.0.0.0:9000"
  
  health_check:
    interval: "5s"  # Intervalo reduzido para testes
    timeout: "2s"
    retries: 2

  rate_limit:
    enabled: true
    requests_per_second: 100
    burst_size: 200

  # Desativando recursos que exigem configuração adicional
  waf:
    enabled: false
    
  geoip:
    enabled: false

# Configuração de rotas
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

# Configuração de autenticação simples para teste
auth:
  enabled: true
  jwt_secret: "test-secret-key-for-development-only"
  jwt_issuer: "veloflux-test"
  token_validity: "24h"
  
# Configuração do Redis para o ambiente de container
cluster:
  enabled: true
  redis_address: "redis:6379"
  redis_password: ""
  redis_db: 0
EOL

    # Arquivos de teste para backend
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

    cat > "$TEST_DIR/test/health.html" <<EOL
OK
EOL

    # Arquivo Docker Compose para teste
    cat > "$TEST_DIR/docker-compose.test.yml" <<EOL
services:
  veloflux-lb:
    image: veloflux:test
    build:
      context: .
      dockerfile: Dockerfile.test
    ports:
      - "8081:8001"  # Mapeando 8081 do host para 8001 do container para evitar conflitos
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

    # Dockerfile para teste
    cat > "$TEST_DIR/Dockerfile.test" <<EOL
FROM golang:1.23-alpine AS builder

RUN apk add --no-cache git ca-certificates gcc musl-dev curl netcat-openbsd

WORKDIR /app
COPY . .

# Buildando a versão mais simples possível
RUN go build -o veloflux-lb ./cmd/velofluxlb

FROM alpine:3.18

RUN apk add --no-cache ca-certificates curl netcat-openbsd

WORKDIR /app
COPY --from=builder /app/veloflux-lb /usr/local/bin/

EXPOSE 8001 8080 9000

ENTRYPOINT ["/usr/local/bin/veloflux-lb"]
CMD ["--config", "/etc/veloflux/config.yaml"]
EOL
    
    log "Arquivos de configuração criados com sucesso."
}

# Copia arquivos do projeto para o diretório de teste
copy_project_files() {
    log "Copiando arquivos do projeto..."
    
    # Diretório de origem
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
    
    log "Arquivos do projeto copiados com sucesso."
}

# Constrói e inicia o ambiente de teste
build_and_run() {
    log "Construindo e iniciando o ambiente de teste..."
    cd "$TEST_DIR"
    
    # Constrói a imagem do VeloFlux
    log "Construindo a imagem Docker do VeloFlux..."
    $DOCKER_COMPOSE -f docker-compose.test.yml build
    
    # Inicia os containers
    log "Iniciando os containers de teste..."
    $DOCKER_COMPOSE -f docker-compose.test.yml up -d
    
    # Espera alguns segundos para a inicialização
    log "Aguardando inicialização dos serviços (10s)..."
    sleep 10
}

# Testa o serviço para garantir que está funcionando
test_service() {
    log "Testando o serviço VeloFlux..."
    
    # Verifica se os containers estão rodando
    if ! docker ps | grep -q "veloflux-test-veloflux-lb"; then
        error "Container do VeloFlux não está rodando!"
    fi
    
    # Verifica logs para erros
    log "Verificando logs do container para erros..."
    if docker logs veloflux-test-veloflux-lb-1 2>&1 | grep -i "error\|fatal\|panic" > /dev/null; then
        warn "Erros encontrados nos logs:"
        docker logs veloflux-test-veloflux-lb-1 2>&1 | grep -i "error\|fatal\|panic"
    else
        log "Nenhum erro encontrado nos logs."
    fi
    
    # Teste de conectividade HTTP
    log "Testando conectividade HTTP..."
    
    STATUS_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "falhou")
    
    if [[ "$STATUS_CODE" =~ ^(200|301|302|307|308)$ ]]; then
        log "✅ VeloFlux está respondendo na porta 8081 (HTTP $STATUS_CODE)"
        echo -e "${GREEN}====================================================${NC}"
        echo -e "${GREEN}    TESTE BEM-SUCEDIDO - VELOFLUX ESTÁ RODANDO     ${NC}"
        echo -e "${GREEN}====================================================${NC}"
        echo ""
        echo "Você pode acessar:"
        echo " - VeloFlux (balanceador): http://localhost:8081"
        echo " - Métricas: http://localhost:9080"
        echo " - API de administração: http://localhost:9090"
        echo ""
        echo "Para ver os logs:"
        echo " - $DOCKER_COMPOSE -f $TEST_DIR/docker-compose.test.yml logs -f veloflux-lb"
        echo ""
        echo "Para parar o teste:"
        echo " - $DOCKER_COMPOSE -f $TEST_DIR/docker-compose.test.yml down"
    else
        warn "❌ VeloFlux não está respondendo corretamente na porta 8081 (Status: $STATUS_CODE)"
        
        # Executar diagnósticos adicionais
        log "Executando diagnósticos adicionais..."
        
        # Verifica se o container VeloFlux tem ferramentas de diagnóstico
        docker exec -it veloflux-test-veloflux-lb-1 which curl &>/dev/null || {
            log "Instalando curl no container para diagnósticos..."
            docker exec -it veloflux-test-veloflux-lb-1 apk add --no-cache curl &>/dev/null
        }
        
        # Testar conectividade interna
        log "Testando conectividade interna entre containers..."
        
        if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-1 | grep -q "Backend 1"; then
            log "✅ Conectividade com backend-1 OK"
        else
            warn "❌ Não foi possível conectar ao backend-1 internamente"
        fi
        
        if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-2 | grep -q "Backend 2"; then
            log "✅ Conectividade com backend-2 OK"
        else
            warn "❌ Não foi possível conectar ao backend-2 internamente"
        fi
        
        if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-1/health | grep -q "OK"; then
            log "✅ Health check do backend-1 OK"
        else
            warn "❌ Health check do backend-1 falhou"
        fi
        
        if docker exec -it veloflux-test-veloflux-lb-1 curl -s http://backend-2/health | grep -q "OK"; then
            log "✅ Health check do backend-2 OK"
        else
            warn "❌ Health check do backend-2 falhou"
        fi
        
        # Verificar Redis
        log "Verificando conectividade com Redis..."
        docker exec -it veloflux-test-veloflux-lb-1 which nc &>/dev/null || {
            log "Instalando netcat no container para diagnósticos..."
            docker exec -it veloflux-test-veloflux-lb-1 apk add --no-cache netcat-openbsd &>/dev/null
        }
        
        if docker exec -it veloflux-test-veloflux-lb-1 nc -zv redis 6379; then
            log "✅ Conectividade com Redis OK"
        else
            warn "❌ Não foi possível conectar ao Redis"
        fi
        
        # Mostra logs do container para ajudar no diagnóstico
        log "Últimos logs do container VeloFlux:"
        docker logs --tail 30 veloflux-test-veloflux-lb-1
        
        error "Falha nos testes. Verifique os logs para mais informações."
    fi
}

# Função principal
main() {
    log "Iniciando configuração de teste do VeloFlux..."
    
    # Verifica requisitos
    check_docker
    
    # Limpa ambiente anterior
    cleanup
    
    # Verifica portas
    check_ports
    
    # Cria arquivos de configuração
    create_config
    
    # Copia arquivos do projeto
    copy_project_files
    
    # Constrói e inicia
    build_and_run
    
    # Testa o serviço
    test_service
}

# Executa o script
main
