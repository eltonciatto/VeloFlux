#!/bin/bash
# Script para corrigir problemas de health check no VeloFlux (distroless e nginx)
# Author: GitHub Copilot
# Date: $(date +%Y-%m-%d)

echo "===================================="
echo "Iniciando script de correção de health checks"
echo "===================================="

# Diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd $BASE_DIR

echo -e "\n[1] Parando containers"
docker-compose down

echo -e "\n[2] Corrigindo health check do VeloFlux-LB (imagem distroless)"
# Modificando docker-compose.yml para usar healthcheck nativo do distroless
cp docker-compose.yml docker-compose.yml.bak
cat > docker-compose.yml << EOF
# VeloFlux Docker Compose
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
    healthcheck:
      test: ["CMD", "/bin/veloflux"]
      interval: 30s
      timeout: 5s
      retries: 3
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
      test: ["CMD", "wget", "-q", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
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
      test: ["CMD", "wget", "-q", "http://localhost/health"]
      interval: 30s
      timeout: 5s
      retries: 3
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

echo -e "\n[3] Verificando health files para os backends"
# Verifique se os arquivos health existem e crie-os caso necessário
for tenant in tenant1 tenant2 admin api public; do
  if [ ! -f "test/$tenant/health" ]; then
    echo "Criando arquivo health para $tenant"
    mkdir -p "test/$tenant"
    cat > "test/$tenant/health" << EOF
{
  "status": "healthy",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%S+00:00")"
}
EOF
  else
    echo "Arquivo health para $tenant já existe"
  fi
done

echo -e "\n[4] Reiniciando serviços"
docker-compose up -d

# Esperar serviços iniciarem
echo "Aguardando serviços iniciarem..."
sleep 15

echo -e "\n[5] Verificando status dos containers"
docker ps

echo -e "\n[6] Verificando health status"
for container in veloflux-lb veloflux-tenant1 veloflux-tenant2 veloflux-redis; do
  echo "$container:"
  docker inspect --format='{{json .State.Health.Status}}' $container
done

echo -e "\n[7] Testando healthchecks manualmente"
echo "VeloFlux Metrics:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8880/metrics
echo " (HTTP 200 = OK)"

echo "Tenant1 Health:"
curl -s http://localhost/health
echo ""

echo "Tenant2 Health:"
curl -s -H "Host: tenant2.public.dev.veloflux.io" http://localhost/health
echo ""

echo -e "\n[8] Verificando acesso aos domínios"
echo "Domínio principal:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/
echo " (HTTP 200 = OK)"

echo "Tenant1 (com Host header):"
curl -s -o /dev/null -w "%{http_code}" -H "Host: tenant1.public.dev.veloflux.io" http://localhost/
echo " (HTTP 200 = OK)"

echo "Tenant2 (com Host header):"
curl -s -o /dev/null -w "%{http_code}" -H "Host: tenant2.public.dev.veloflux.io" http://localhost/
echo " (HTTP 200 = OK)"

echo "API:"
curl -s -o /dev/null -w "%{http_code}" -H "Host: api.public.dev.veloflux.io" http://localhost/api/
echo " (HTTP 200 = OK)"

echo "Admin:"
curl -s -o /dev/null -w "%{http_code}" -H "Host: admin.public.dev.veloflux.io" http://localhost/admin/
echo " (HTTP 200 = OK)"

echo -e "\n[9] Verificando logs do VeloFlux"
docker logs veloflux-lb | tail -n 20

echo -e "\n===================================="
echo "Script de correção completo!"
echo "===================================="
