#!/bin/bash

# Script para reconfigurar acesso SSH e aplicar correções
echo "🔑 Reconfigurando acesso SSH ao VeloFlux VPS..."

VPS_IP="107.172.207.63"

# Limpar known_hosts
echo "🧹 Limpando known_hosts..."
ssh-keygen -f ~/.ssh/known_hosts -R $VPS_IP 2>/dev/null || true

# Verificar se existe chave SSH
if [ ! -f ~/.ssh/vps_veloflux ]; then
    echo "🔑 Chave SSH não encontrada. Criando nova chave..."
    ssh-keygen -t ed25519 -f ~/.ssh/vps_veloflux -C "veloflux-vps-$(date +%Y%m%d)" -N ""
    echo "✅ Nova chave SSH criada"
fi

# Configurar permissões
chmod 600 ~/.ssh/vps_veloflux
chmod 644 ~/.ssh/vps_veloflux.pub

echo "🔑 Chave SSH pública:"
echo "====================================="
cat ~/.ssh/vps_veloflux.pub
echo "====================================="
echo ""

echo "📋 INSTRUÇÕES PARA CONFIGURAR ACESSO:"
echo ""
echo "1. Acesse sua VPS via painel de controle ou console"
echo "2. Execute os comandos abaixo como root:"
echo ""
echo "   # Criar diretório .ssh se não existir"
echo "   mkdir -p ~/.ssh"
echo "   chmod 700 ~/.ssh"
echo ""
echo "   # Adicionar chave pública"
echo "   echo '$(cat ~/.ssh/vps_veloflux.pub)' >> ~/.ssh/authorized_keys"
echo "   chmod 600 ~/.ssh/authorized_keys"
echo ""
echo "   # Garantir que SSH está funcionando"
echo "   systemctl enable ssh"
echo "   systemctl start ssh"
echo "   systemctl status ssh"
echo ""

echo "3. Teste a conexão:"
echo "   ssh -i ~/.ssh/vps_veloflux root@$VPS_IP"
echo ""

echo "💡 COMANDOS ALTERNATIVOS (se SSH não funcionar):"
echo ""
echo "Se você tem acesso direto ao servidor, execute diretamente na VPS:"
echo ""

# Salvar comandos em arquivo para executar diretamente na VPS
cat > direct-vps-commands.sh << 'EOF'
#!/bin/bash

# Comandos para executar diretamente na VPS
echo "🔧 Aplicando correções do VeloFlux diretamente na VPS..."

cd /root/nginx-proxy

# Backup da configuração atual
cp nginx-ssl.conf nginx-ssl.conf.backup

# Criar nova configuração corrigida
cat > nginx-ssl.conf << 'NGINX_EOF'
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
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                   '$status $body_bytes_sent "$http_referer" '
                   '"$http_user_agent" "$http_x_forwarded_for"';
    
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
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*';
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE';
                add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization';
                add_header 'Access-Control-Max-Age' 1728000;
                add_header 'Content-Type' 'text/plain; charset=utf-8';
                add_header 'Content-Length' 0;
                return 204;
            }
            
            proxy_pass http://172.20.0.6:9000;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            add_header 'Access-Control-Allow-Origin' '*' always;
            add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS, PUT, DELETE' always;
            add_header 'Access-Control-Allow-Headers' 'DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization' always;
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
NGINX_EOF

echo "✅ Configuração do Nginx atualizada"

# Testar configuração
echo "🧪 Testando configuração..."
if docker-compose exec nginx nginx -t; then
    echo "✅ Configuração válida"
    
    # Recarregar Nginx
    echo "🔄 Recarregando Nginx..."
    docker-compose exec nginx nginx -s reload
    echo "✅ Nginx recarregado"
    
    # Verificar containers
    echo "🐳 Status dos containers:"
    cd /root/VeloFlux
    docker-compose -f docker-compose.prod.fixed.yml ps
    
    echo ""
    echo "🎉 Correções aplicadas com sucesso!"
    echo ""
    echo "🌐 Teste os endpoints:"
    echo "   • https://veloflux.io (Landing Page)"
    echo "   • https://admin.veloflux.io (Admin Panel)"
    echo "   • https://api.veloflux.io (API)"
    echo "   • https://lb.veloflux.io (Load Balancer)"
    
else
    echo "❌ Erro na configuração. Revertendo..."
    cp nginx-ssl.conf.backup nginx-ssl.conf
    docker-compose exec nginx nginx -s reload
fi
EOF

chmod +x direct-vps-commands.sh

echo ""
echo "📁 ARQUIVO CRIADO: direct-vps-commands.sh"
echo "=========================================="
echo ""
echo "Se você tem acesso direto ao servidor, copie este arquivo para a VPS e execute:"
echo ""
echo "   scp direct-vps-commands.sh root@$VPS_IP:/root/"
echo "   ssh root@$VPS_IP"
echo "   chmod +x /root/direct-vps-commands.sh"
echo "   /root/direct-vps-commands.sh"
echo ""

echo "🔄 TENTANDO RECONECTAR..."
echo "========================"

# Tentar algumas variações de conexão
echo "🔑 Tentativa 1: Usando nova chave SSH..."
if ssh -i ~/.ssh/vps_veloflux -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS_IP 'echo "Conexão SSH OK"' 2>/dev/null; then
    echo "✅ Conectado! Executando correções..."
    ./scripts/fix-nginx-routing.sh
else
    echo "⚠️  Tentativa 1 falhou"
fi

echo ""
echo "🔑 Tentativa 2: Usando chave padrão..."
if ssh -o StrictHostKeyChecking=no -o ConnectTimeout=10 root@$VPS_IP 'echo "Conexão SSH OK"' 2>/dev/null; then
    echo "✅ Conectado! Executando correções..."
    # Aplicar correções via SSH padrão
    ssh root@$VPS_IP 'bash -s' < direct-vps-commands.sh
else
    echo "⚠️  Tentativa 2 falhou"
fi

echo ""
echo "📋 PRÓXIMOS PASSOS:"
echo "==================="
echo ""
echo "Se nenhuma tentativa funcionou:"
echo "1. Acesse sua VPS via painel de controle"
echo "2. Configure a chave SSH manualmente (instruções acima)"
echo "3. Execute o arquivo direct-vps-commands.sh diretamente na VPS"
echo ""
echo "Arquivos criados:"
echo "   • fix-nginx-routing.sh (correção via SSH)"
echo "   • direct-vps-commands.sh (execução direta)"
echo "   • verify-vps-status.sh (verificação completa)"
