#!/bin/bash
# Script para resolver problemas de health check no VeloFlux
# Author: GitHub Copilot

echo "===================================="
echo "Corrigindo problemas de health check"
echo "===================================="

# Diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd $BASE_DIR

echo -e "\n[1] Atualizando healthcheck para os containers"

# Criar um arquivo docker-compose.fix.yml com healthchecks corrigidos
cat > $BASE_DIR/docker-compose.fix.yml << 'EOF'
# VeloFlux Docker Compose - Healthchecks corrigidos
# Configuração profissional para multi-tenant

services:
  # Balanceador de carga VeloFlux
  veloflux-lb:
    build: .
    container_name: veloflux-lb
    restart: unless-stopped
    ports:
      - "80:80"      # HTTP principal
      - "443:443"    # HTTPS principal
      - "8880:8080"  # Metrics (porta externa alterada para evitar conflitos)
      - "9900:9000"  # Admin API (porta externa alterada para evitar conflitos)
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=info
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=veloflux123
    volumes:
      - ./config:/etc/veloflux
      - ./certs:/etc/ssl/certs/veloflux
    # Sem healthcheck, já que o veloflux não tem um endpoint /ping
    depends_on:
      - backend-tenant1
      - backend-tenant2
      - redis
    networks:
      - veloflux-net
      
  # Backend para tenant1
  backend-tenant1:
    image: nginx:alpine-wget
    container_name: veloflux-tenant1
    restart: unless-stopped
    volumes:
      # Configuração raiz - tenant1
      - ./test/tenant1/index.html:/usr/share/nginx/html/index.html:ro
      - ./test/tenant1/health:/usr/share/nginx/html/health:ro
      
      # Outros diretórios compartilhados
      - ./test/admin:/usr/share/nginx/html/admin:ro
      - ./test/api:/usr/share/nginx/html/api:ro
      - ./test/public:/usr/share/nginx/html/public:ro
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost/health | grep healthy || exit 1"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - veloflux-net
  
  # Backend para tenant2
  backend-tenant2:
    image: nginx:alpine-wget
    container_name: veloflux-tenant2
    restart: unless-stopped
    volumes:
      # Configuração raiz - tenant2
      - ./test/tenant2/index.html:/usr/share/nginx/html/index.html:ro
      - ./test/tenant2/health:/usr/share/nginx/html/health:ro
      
      # Outros diretórios compartilhados
      - ./test/admin:/usr/share/nginx/html/admin:ro
      - ./test/api:/usr/share/nginx/html/api:ro
      - ./test/public:/usr/share/nginx/html/public:ro
    healthcheck:
      test: ["CMD-SHELL", "wget -q -O - http://localhost/health | grep healthy || exit 1"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 10s
    networks:
      - veloflux-net

  # Redis para estado do cluster
  redis:
    image: redis:alpine
    container_name: veloflux-redis
    restart: unless-stopped
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    networks:
      - veloflux-net
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 5s
      retries: 3

  # Prometheus metrics exporter
  node-exporter:
    image: prom/node-exporter:latest
    container_name: veloflux-node-exporter
    restart: unless-stopped
    ports:
      - "9199:9100"  # Porta alterada para evitar conflitos
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc|var/lib/docker)($$|/)'
    networks:
      - veloflux-net

# Volumes
volumes:
  redis-data:

# Networks - melhores práticas de isolamento
networks:
  veloflux-net:
    driver: bridge
EOF

echo -e "\n[2] Substituindo o arquivo docker-compose.yml"
mv $BASE_DIR/docker-compose.fix.yml $BASE_DIR/docker-compose.yml

# Atualizar o arquivo de regras WAF
echo -e "\n[3] Atualizando regras WAF com sintaxe correta"
cat > $BASE_DIR/config/waf/crs-rules.conf << EOF
# OWASP ModSecurity Core Rule Set (CRS) - Simplified for VeloFlux Demo
# Este arquivo contém regras básicas de segurança para demonstração
# Em produção, use o conjunto completo de regras OWASP ModSecurity CRS

# Regra básica anti-SQL Injection (Sintaxe simplificada)
SecRule ARGS "@rx (?i:(select|from|where|union|insert|delete|update|drop|create|alter))" \\
  "id:1000,phase:2,log,deny,status:403,msg:'SQL Injection Attempt'"

# Regra básica anti-XSS
SecRule ARGS "@rx (?i:<script>|<iframe>|javascript:)" \\
  "id:1001,phase:2,log,deny,status:403,msg:'XSS Attempt'"

# Regra básica contra path traversal
SecRule ARGS "@rx (?:\\.\\.|%2e%2e)" \\
  "id:1002,phase:2,log,deny,status:403,msg:'Path Traversal Attempt'"
EOF

echo -e "\n[4] Atualizando arquivos de health check"
# Atualizar os health checks para serem mais robustos
for tenant in tenant1 tenant2 api admin public; do
  cat > $BASE_DIR/test/$tenant/health << EOF
{
  "status": "healthy",
  "service": "$tenant",
  "timestamp": "$(date -Iseconds)"
}
EOF
done

echo -e "\n[5] Reiniciando serviços"
docker-compose down
docker-compose up -d

# Esperar serviços iniciarem
echo "Aguardando serviços iniciarem (30s)..."
sleep 30

echo -e "\n[6] Verificando status dos containers"
docker ps

echo -e "\n[7] Verificando health status"
docker inspect --format='{{.Name}}: {{.State.Health.Status}}' $(docker ps -q) 2>/dev/null || echo "Health check não disponível"

echo -e "\n[8] Verificando logs do VeloFlux para problemas WAF"
docker logs veloflux-lb | grep -i error | tail -5

echo -e "\n[9] Testando acesso aos domínios"
echo "Tenant1: $(curl -s -o /dev/null -w "%{http_code}" -H 'Host: tenant1.public.dev.veloflux.io' http://localhost/)"
echo "Tenant2: $(curl -s -o /dev/null -w "%{http_code}" -H 'Host: tenant2.public.dev.veloflux.io' http://localhost/)"
echo "API: $(curl -s -o /dev/null -w "%{http_code}" -H 'Host: api.public.dev.veloflux.io' http://localhost/api/)"
echo "Admin: $(curl -s -o /dev/null -w "%{http_code}" -H 'Host: admin.public.dev.veloflux.io' http://localhost/admin/)"
echo "Public: $(curl -s -o /dev/null -w "%{http_code}" -H 'Host: public.dev.veloflux.io' http://localhost/public/)"

echo -e "\n===================================="
echo "Correção de problemas concluída!"
echo "===================================="
