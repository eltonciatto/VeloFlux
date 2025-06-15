#!/bin/bash

# fix-routing-final.sh
# Script para corrigir definitivamente o roteamento do VeloFlux
# Este script corrige cada subdomínio para apontar para o serviço correto

set -e

VPS_IP="107.172.207.63"
SSH_KEY="/root/.ssh/vps_veloflux"

echo "🚀 Iniciando correção final de roteamento do VeloFlux..."

# Função para executar comandos na VPS
run_remote() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$VPS_IP" "$@"
}

# Verificar se conseguimos conectar
echo "📡 Testando conexão SSH..."
if ! run_remote "echo 'Conexão SSH OK'" > /dev/null 2>&1; then
    echo "❌ Erro: Não foi possível conectar na VPS via SSH"
    echo "💡 Execute: ssh-keygen -f ~/.ssh/known_hosts -R $VPS_IP"
    echo "💡 Configure a chave ED25519 na VPS"
    exit 1
fi

echo "✅ Conexão SSH estabelecida"

# Backup das configurações atuais
echo "📂 Criando backup das configurações..."
run_remote "cd /root/nginx-proxy && cp nginx-ssl.conf nginx-ssl.conf.backup-$(date +%Y%m%d%H%M%S)"
run_remote "cd /root/VeloFlux/config && cp config.yaml config.yaml.backup-$(date +%Y%m%d%H%M%S)"

# Lista de containers
echo "🐳 Verificando containers em execução..."
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml ps"

# Criar configuração corrigida do Nginx
echo "📝 Criando configuração corrigida do Nginx..."

run_remote 'cat > /root/nginx-proxy/nginx-ssl-fixed.conf << '\''EOF'\''
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;
    
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;
    
    # Logging
    log_format main '\''$remote_addr - $remote_user [$time_local] "$request" '\''
                   '\''$status $body_bytes_sent "$http_referer" '\''
                   '\''"$http_user_agent" "$http_x_forwarded_for"'\'';
    
    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Frontend (Landing Page) - veloflux.io
    server {
        listen 443 ssl http2;
        server_name veloflux.io www.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/veloflux.io/privkey.pem;
        
        # Security headers
        add_header X-Content-Type-Options nosniff;
        add_header X-Frame-Options DENY;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
        
        location / {
            # Reconfigurado para apontar para o frontend e não o backend demo
            proxy_pass http://172.20.0.4:3000;  # Frontend container (porta 3000)
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # Endpoints API no frontend principal
        location /api/ {
            proxy_pass http://172.20.0.6:9000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "OK\n";
            add_header Content-Type text/plain;
        }
    }
    
    # API - api.veloflux.io
    server {
        listen 443 ssl http2;
        server_name api.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/api.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/api.veloflux.io/privkey.pem;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
        
        location / {
            # Apontar para a API do VeloFlux na porta 9000
            proxy_pass http://172.20.0.6:9000;  # VeloFlux Admin API
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # CORS settings for API
        add_header Access-Control-Allow-Origin '*' always;
        add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE' always;
        add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
        
        # Handle OPTIONS method for CORS preflight
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin '*';
            add_header Access-Control-Allow-Methods 'GET, POST, OPTIONS, PUT, DELETE';
            add_header Access-Control-Allow-Headers 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
        
        # Health check
        location /health {
            access_log off;
            return 200 "API OK\n";
            add_header Content-Type text/plain;
        }
    }
    
    # Admin Panel - admin.veloflux.io  
    server {
        listen 443 ssl http2;
        server_name admin.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/admin.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/admin.veloflux.io/privkey.pem;
        
        # Rate limiting
        limit_req zone=general burst=50 nodelay;
        
        location / {
            # Interface principal do admin - usar frontend na porta 3000
            # Mas com um marcador de query para indicar que é o painel admin
            proxy_pass http://172.20.0.4:3000/?admin=true;  # Frontend container (admin interface)
            proxy_set_header Host admin.veloflux.io;  # Forçar Host header para admin
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
        
        # API routes para admin
        location /api/ {
            proxy_pass http://172.20.0.6:9000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
        # Autenticação para admin
        location /auth/ {
            proxy_pass http://172.20.0.6:9000/auth/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Load Balancer Interface - lb.veloflux.io
    server {
        listen 443 ssl http2;
        server_name lb.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/lb.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/lb.veloflux.io/privkey.pem;
        
        location / {
            # Porta principal do load balancer (80)
            proxy_pass http://172.20.0.6:80;   # VeloFlux Load Balancer main port
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # Health check endpoint
        location /health {
            # Porta de métricas para health
            proxy_pass http://172.20.0.6:8080/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Metrics - metrics.veloflux.io
    server {
        listen 443 ssl http2;
        server_name metrics.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/metrics.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/metrics.veloflux.io/privkey.pem;
        
        location / {
            # Métricas na porta 8080
            proxy_pass http://172.20.0.6:8080;  # Prometheus metrics
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Grafana - grafana.veloflux.io
    server {
        listen 443 ssl http2;
        server_name grafana.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/grafana.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/grafana.veloflux.io/privkey.pem;
        
        location / {
            # Grafana na porta 3000 do container 172.20.0.5
            proxy_pass http://172.20.0.5:3000;  # Grafana container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # WebSocket support for Grafana live
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    
    # Prometheus - prometheus.veloflux.io
    server {
        listen 443 ssl http2;
        server_name prometheus.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/prometheus.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/prometheus.veloflux.io/privkey.pem;
        
        location / {
            # Prometheus na porta 9090 do container 172.20.0.3
            proxy_pass http://172.20.0.3:9090;  # Prometheus container
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Redirect HTTP to HTTPS for all domains
    server {
        listen 80;
        server_name veloflux.io www.veloflux.io api.veloflux.io admin.veloflux.io lb.veloflux.io metrics.veloflux.io grafana.veloflux.io prometheus.veloflux.io;
        
        # ACME challenge location
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
            try_files $uri =404;
        }
        
        location / {
            return 301 https://$host$request_uri;
        }
    }
}
EOF'

echo "✅ Configuração do Nginx atualizada"

# Atualizar a configuração do VeloFlux para garantir domínios corretos
echo "📝 Atualizando configuração do VeloFlux (config.yaml)..."
run_remote 'cat > /root/VeloFlux/config/config_fixed.yaml << '\''EOF'\''
# VeloFlux LB Configuration - Versão de Produção

# Listening Configuration
listen:
  port: 80
  tlsPort: 443
  metricsPort: 8080
  adminPort: 9000
  adminBasePath: "/admin"
  healthPort: 8080
  healthPath: "/health"

# Admin API Settings
admin:
  enabled: true
  corsOrigins:
    - "https://veloflux.io"
    - "https://admin.veloflux.io"
    - "http://localhost:3000"
  cookieDomain: "veloflux.io"
  loginPath: "/auth/login"
  logoutPath: "/auth/logout"

# Operational Configuration  
pools:
  - name: main
    healthCheck:
      path: "/"  # Ajustado para verificar a raiz
      interval: 10s
      timeout: 2s
      unhealthyThreshold: 3
      healthyThreshold: 2
    loadBalancing:
      algorithm: roundrobin
      sticky: false
    backends:
      - name: backend-1
        url: "http://172.20.0.7:80"
        weight: 1
        maxConcurrent: 100
      - name: backend-2
        url: "http://172.20.0.8:80"  
        weight: 1
        maxConcurrent: 100

# Redis Configuration for Cluster Mode
redis:
  enabled: true
  address: "172.20.0.2:6379"
  password: ""
  db: 0

# SSL Configuration
tls:
  enabled: false  # Desabilitado pois o Nginx está tratando o SSL
  certFile: "/etc/ssl/certs/veloflux/server.crt"
  keyFile: "/etc/ssl/certs/veloflux/server.key"
  autoRedirect: true

# Logging
logging:
  level: "info"
  format: "json"

# Security
security:
  maxRequestBodySize: 10MB
  rateLimit:
    enabled: true
    requests: 100
    duration: 1m
    blockDuration: 5m

# Metrics
metrics:
  prometheus:
    enabled: true
    path: "/metrics"

# Tracing
tracing:
  enabled: false
  serviceName: "veloflux-lb"
  samplingRate: 0.1
EOF'

echo "✅ Configuração do VeloFlux atualizada"

# Aplicar as configurações atualizadas
echo "🔄 Aplicando configurações..."

# Aplicar configuração do Nginx
run_remote "cd /root/nginx-proxy && cp nginx-ssl-fixed.conf nginx-ssl.conf"

# Atualizar configuração do VeloFlux
run_remote "cd /root/VeloFlux && cp config/config_fixed.yaml config/config.yaml"

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if run_remote "cd /root/nginx-proxy && docker-compose exec nginx nginx -t"; then
    echo "✅ Configuração do Nginx válida"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    run_remote "cd /root/nginx-proxy && docker-compose exec nginx nginx -s reload"
    echo "✅ Nginx recarregado"
else
    echo "❌ Erro na configuração do Nginx. Revertendo..."
    run_remote "cd /root/nginx-proxy && cp nginx-ssl.conf.backup-* nginx-ssl.conf"
    run_remote "cd /root/nginx-proxy && docker-compose exec nginx nginx -s reload"
    exit 1
fi

# Reiniciar VeloFlux
echo "🔄 Reiniciando VeloFlux..."
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml restart veloflux-lb"

# Verificar status e testar endpoints
echo "🧪 Verificando endpoints..."

# Testar cada URL
test_url() {
    local url=$1
    local desc=$2
    echo -n "📡 Testando $desc ($url): "
    
    local status=$(run_remote "curl -s -o /dev/null -w '%{http_code}' --max-time 10 '$url'" 2>/dev/null || echo "000")
    
    if [[ "$status" =~ ^[23] ]]; then
        echo "✅ OK ($status)"
    else
        echo "❌ ERRO ($status)"
    fi
}

test_url "https://veloflux.io" "Landing Page"
test_url "https://api.veloflux.io" "API"
test_url "https://admin.veloflux.io" "Admin Panel"
test_url "https://lb.veloflux.io" "Load Balancer"
test_url "https://metrics.veloflux.io" "Métricas"
test_url "https://grafana.veloflux.io" "Grafana"
test_url "https://prometheus.veloflux.io" "Prometheus"

echo ""
echo "🔍 Verificando conteúdo da landing page..."
run_remote "curl -s https://veloflux.io | grep -A 3 -B 3 'VeloFlux'"

echo ""
echo "🎉 Correções finais de roteamento aplicadas!"
echo ""
echo "📋 URLs Atualizadas:"
echo "🌐 Landing Page:      https://veloflux.io"
echo "🔧 Admin Panel:       https://admin.veloflux.io"
echo "📡 API:               https://api.veloflux.io"
echo "⚖️  Load Balancer:     https://lb.veloflux.io"
echo "📊 Métricas:          https://metrics.veloflux.io"
echo "📈 Grafana:           https://grafana.veloflux.io"
echo "🔍 Prometheus:        https://prometheus.veloflux.io"
echo ""
echo "💡 Se ainda houver problemas:"
echo "1. Verifique os logs: docker logs veloflux-lb"
echo "2. Verifique os logs do Nginx: docker logs nginx-proxy"
echo "3. Execute o script de verificação: ./scripts/verify-vps-status.sh"
