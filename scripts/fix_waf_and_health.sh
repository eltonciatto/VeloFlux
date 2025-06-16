#!/bin/bash
# Script para corrigir configurações WAF e healthcheck no VeloFlux
# Author: GitHub Copilot
# Date: $(date +%Y-%m-%d)

echo "===================================="
echo "Iniciando script de correção do VeloFlux"
echo "===================================="

# Diretório base
BASE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd $BASE_DIR

echo -e "\n[1] Parando containers"
docker-compose down

echo -e "\n[2] Verificando regras WAF"
cat $BASE_DIR/config/waf/crs-rules.conf
echo ""

echo -e "\n[3] Instalando wget em containers nginx:alpine"
# Criar Dockerfile temporário para Nginx com wget instalado
cat > $BASE_DIR/Dockerfile.nginx << EOF
FROM nginx:alpine
RUN apk add --no-cache wget
EOF

# Construir imagem personalizada
echo "Construindo nginx:alpine-wget..."
docker build -t nginx:alpine-wget -f Dockerfile.nginx .

# Atualizar docker-compose.yml para usar a imagem modificada
sed -i 's/image: nginx:alpine/image: nginx:alpine-wget/g' $BASE_DIR/docker-compose.yml

echo -e "\n[4] Reiniciando serviços"
docker-compose up -d

# Esperar serviços iniciarem
echo "Aguardando serviços iniciarem..."
sleep 10

echo -e "\n[5] Verificando status dos containers"
docker ps

echo -e "\n[6] Verificando logs do VeloFlux (WAF)"
docker logs veloflux-lb | grep -i "waf\|error" | tail -n 5

echo -e "\n[7] Testando healthchecks"
echo "VeloFlux LB:"
docker inspect --format='{{json .State.Health.Status}}' veloflux-lb
echo "Tenant1:"
docker inspect --format='{{json .State.Health.Status}}' veloflux-tenant1
echo "Tenant2:"
docker inspect --format='{{json .State.Health.Status}}' veloflux-tenant2
echo "Redis:"
docker inspect --format='{{json .State.Health.Status}}' veloflux-redis

echo -e "\n[8] Verificando acesso aos domínios"
echo "Domínio principal:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/
echo " (HTTP 200 = OK)"

echo "API:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/api/
echo " (HTTP 200 = OK)"

echo "Admin:"
curl -s -o /dev/null -w "%{http_code}" http://localhost/admin/
echo " (HTTP 200 = OK)"

echo -e "\n[9] Verificando metrics endpoint"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8880/metrics
echo " (HTTP 200 = OK)"

echo -e "\n===================================="
echo "Script de correção completo!"
echo "===================================="
