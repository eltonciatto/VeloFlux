#!/bin/bash

# Script para corrigir roteamento do Nginx no VeloFlux VPS
# Este script corrige os roteamentos para que:
# - https://veloflux.io mostre a landing page oficial (frontend)
# - https://api.veloflux.io/ mostre a API do VeloFlux
# - https://admin.veloflux.io/ mostre o painel administrativo
# - https://lb.veloflux.io/ mostre a interface do load balancer

set -e

VPS_IP="107.172.207.63"
SSH_KEY="/root/.ssh/vps_veloflux"

echo "🔧 Corrigindo roteamento do Nginx no VeloFlux VPS..."

# Função para executar comandos na VPS
run_remote() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no root@"$VPS_IP" "$@"
}

# Verificar se conseguimos conectar
echo "📡 Testando conexão SSH..."
if ! run_remote "echo 'Conexão SSH OK'"; then
    echo "❌ Erro: Não foi possível conectar na VPS via SSH"
    echo "💡 Execute primeiro: ssh-keygen -f ~/.ssh/known_hosts -R $VPS_IP"
    echo "💡 E teste: ssh -i $SSH_KEY root@$VPS_IP"
    exit 1
fi

echo "✅ Conexão SSH estabelecida"

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
            proxy_pass http://172.20.0.4:3000;  # Frontend container
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
            proxy_pass http://172.20.0.6:9000;  # VeloFlux Admin API
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 30s;
            proxy_send_timeout 30s;
            proxy_read_timeout 30s;
        }
        
        # CORS for API
        location ~* ^/api/ {
            if ($request_method = '\''OPTIONS'\'') {
                add_header '\''Access-Control-Allow-Origin'\'' '\''*'\'';
                add_header '\''Access-Control-Allow-Methods'\'' '\''GET, POST, OPTIONS, PUT, DELETE'\'';
                add_header '\''Access-Control-Allow-Headers'\'' '\''DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization'\'';
                add_header '\''Access-Control-Max-Age'\'' 1728000;
                add_header '\''Content-Type'\'' '\''text/plain; charset=utf-8'\'';
                add_header '\''Content-Length'\'' 0;
                return 204;
            }
            
            proxy_pass http://172.20.0.6:9000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            add_header '\''Access-Control-Allow-Origin'\'' '\''*'\'' always;
            add_header '\''Access-Control-Allow-Methods'\'' '\''GET, POST, OPTIONS, PUT, DELETE'\'' always;
            add_header '\''Access-Control-Allow-Headers'\'' '\''DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization'\'' always;
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
            proxy_pass http://172.20.0.4:3000;  # Frontend container (admin interface)
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
        
        # API routes para admin
        location /api/ {
            proxy_pass http://172.20.0.6:9000/;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
        
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
            proxy_pass http://172.20.0.6:8080/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Metrics - metrics.veloflux.io (já funcionando)
    server {
        listen 443 ssl http2;
        server_name metrics.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/metrics.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/metrics.veloflux.io/privkey.pem;
        
        location / {
            proxy_pass http://172.20.0.6:8080;  # Prometheus metrics
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    
    # Grafana - grafana.veloflux.io (já funcionando)
    server {
        listen 443 ssl http2;
        server_name grafana.veloflux.io;
        
        ssl_certificate /etc/letsencrypt/live/grafana.veloflux.io/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/grafana.veloflux.io/privkey.pem;
        
        location / {
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

echo "✅ Configuração do Nginx criada"

# Verificar se os containers estão rodando
echo "🐳 Verificando containers em execução..."
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml ps"

# Aplicar a nova configuração
echo "🔄 Aplicando nova configuração do Nginx..."
run_remote "cd /root/nginx-proxy && cp nginx-ssl-fixed.conf nginx-ssl.conf"

# Testar configuração do Nginx
echo "🧪 Testando configuração do Nginx..."
if run_remote "cd /root/nginx-proxy && docker-compose exec nginx nginx -t"; then
    echo "✅ Configuração do Nginx válida"
    
    # Recarregar configuração
    echo "🔄 Recarregando Nginx..."
    run_remote "cd /root/nginx-proxy && docker-compose exec nginx nginx -s reload"
    echo "✅ Nginx recarregado com sucesso"
else
    echo "❌ Erro na configuração do Nginx"
    echo "📝 Verificando logs..."
    run_remote "cd /root/nginx-proxy && docker-compose logs nginx"
    exit 1
fi

# Verificar se o frontend está buildado e funcionando
echo "🎨 Verificando se o frontend está funcionando..."
run_remote "cd /root/VeloFlux && docker-compose -f docker-compose.prod.fixed.yml logs frontend | tail -10"

# Testar os endpoints corrigidos
echo "🧪 Testando endpoints corrigidos..."

echo "📡 Testando https://veloflux.io (Landing Page)..."
if run_remote "curl -s -o /dev/null -w '%{http_code}' https://veloflux.io"; then
    echo "✅ Landing page acessível"
else
    echo "⚠️  Landing page pode não estar respondendo corretamente"
fi

echo "📡 Testando https://api.veloflux.io..."
if run_remote "curl -s -o /dev/null -w '%{http_code}' https://api.veloflux.io"; then
    echo "✅ API acessível"
else
    echo "⚠️  API pode não estar respondendo corretamente"
fi

echo "📡 Testando https://admin.veloflux.io..."
if run_remote "curl -s -o /dev/null -w '%{http_code}' https://admin.veloflux.io"; then
    echo "✅ Admin panel acessível"
else
    echo "⚠️  Admin panel pode não estar respondendo corretamente"
fi

echo "📡 Testando https://lb.veloflux.io..."
if run_remote "curl -s -o /dev/null -w '%{http_code}' https://lb.veloflux.io"; then
    echo "✅ Load balancer interface acessível"
else
    echo "⚠️  Load balancer interface pode não estar respondendo corretamente"
fi

echo ""
echo "🎉 Roteamento do Nginx corrigido!"
echo ""
echo "📋 URLs Atualizadas:"
echo "🌐 Landing Page:     https://veloflux.io"
echo "🔧 Admin Panel:      https://admin.veloflux.io"
echo "📡 API:              https://api.veloflux.io"
echo "⚖️  Load Balancer:    https://lb.veloflux.io"
echo "📊 Métricas:         https://metrics.veloflux.io"
echo "📈 Grafana:          https://grafana.veloflux.io"
echo "🔍 Prometheus:       https://prometheus.veloflux.io"
echo ""
echo "💡 Próximos passos:"
echo "1. Teste todos os endpoints no navegador"
echo "2. Verifique se a landing page oficial está sendo exibida"
echo "3. Confirme que as APIs estão respondendo corretamente"
echo "4. Monitore os logs em caso de problemas"
