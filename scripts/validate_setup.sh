#!/bin/bash
# Script para validar a configuração completa do VeloFlux
# Author: GitHub Copilot
# Date: $(date +%Y-%m-%d)

echo "===================================="
echo "Iniciando validação do VeloFlux"
echo "===================================="

# Cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Função para validar um endpoint
validate_endpoint() {
  local url=$1
  local host_header=$2
  local expected_code=$3
  local description=$4
  
  # Adiciona cabeçalho Host se fornecido
  if [ -z "$host_header" ]; then
    response_code=$(curl -s -o /dev/null -w "%{http_code}" "$url")
  else
    response_code=$(curl -s -H "Host: $host_header" -o /dev/null -w "%{http_code}" "$url")
  fi
  
  if [ "$response_code" -eq "$expected_code" ]; then
    echo -e "${GREEN}✓${NC} $description: $response_code (esperado $expected_code)"
    return 0
  else
    echo -e "${RED}✗${NC} $description: $response_code (esperado $expected_code)"
    return 1
  fi
}

# Função para testar o conteúdo de um endpoint
validate_content() {
  local url=$1
  local host_header=$2
  local expected_content=$3
  local description=$4
  
  # Adiciona cabeçalho Host se fornecido
  if [ -z "$host_header" ]; then
    content=$(curl -s "$url")
  else
    content=$(curl -s -H "Host: $host_header" "$url")
  fi
  
  if echo "$content" | grep -q "$expected_content"; then
    echo -e "${GREEN}✓${NC} $description: Conteúdo correto"
    return 0
  else
    echo -e "${RED}✗${NC} $description: Conteúdo incorreto"
    echo -e "${YELLOW}Esperado:${NC} $expected_content"
    echo -e "${YELLOW}Recebido:${NC} ${content:0:100}..."
    return 1
  fi
}

echo -e "\n[1] Verificando status dos containers"
containers=("veloflux-lb" "veloflux-tenant1" "veloflux-tenant2" "veloflux-redis" "veloflux-node-exporter")
all_running=true

for container in "${containers[@]}"; do
  status=$(docker inspect --format='{{.State.Status}}' "$container" 2>/dev/null)
  health_status=$(docker inspect --format='{{if .State.Health}}{{.State.Health.Status}}{{else}}N/A{{end}}' "$container" 2>/dev/null)
  
  if [ "$status" = "running" ]; then
    if [ "$health_status" = "healthy" ] || [ "$health_status" = "N/A" ]; then
      echo -e "${GREEN}✓${NC} $container: $status ($health_status)"
    else
      echo -e "${YELLOW}!${NC} $container: $status ($health_status)"
      all_running=false
    fi
  else
    echo -e "${RED}✗${NC} $container: $status"
    all_running=false
  fi
done

if [ "$all_running" = true ]; then
  echo -e "\n${GREEN}Todos os containers estão rodando corretamente.${NC}"
else
  echo -e "\n${YELLOW}Alguns containers podem precisar de atenção.${NC}"
fi

echo -e "\n[2] Validando endpoints principais"
validate_endpoint "http://localhost:8880/metrics" "" 200 "Metrics endpoint"
validate_endpoint "http://localhost/api/" "api.public.dev.veloflux.io" 200 "API endpoint"
validate_endpoint "http://localhost/admin/" "admin.public.dev.veloflux.io" 200 "Admin endpoint"
validate_endpoint "http://localhost/" "tenant1.public.dev.veloflux.io" 200 "Tenant1 endpoint"
validate_endpoint "http://localhost/" "tenant2.public.dev.veloflux.io" 200 "Tenant2 endpoint"
validate_endpoint "http://localhost/public/" "public.dev.veloflux.io" 200 "Public endpoint"

echo -e "\n[3] Validando conteúdo dos endpoints"
validate_content "http://localhost/" "tenant1.public.dev.veloflux.io" "tenant1" "Conteúdo do Tenant1"
validate_content "http://localhost/" "tenant2.public.dev.veloflux.io" "tenant2" "Conteúdo do Tenant2"
validate_content "http://localhost/api/" "api.public.dev.veloflux.io" "api" "Conteúdo da API"
validate_content "http://localhost/admin/" "admin.public.dev.veloflux.io" "admin" "Conteúdo do Admin"
validate_content "http://localhost/public/" "public.dev.veloflux.io" "public" "Conteúdo do Public"

echo -e "\n[4] Testando health checks"
validate_endpoint "http://localhost/health" "tenant1.public.dev.veloflux.io" 200 "Health check do Tenant1"
validate_endpoint "http://localhost/health" "tenant2.public.dev.veloflux.io" 200 "Health check do Tenant2"
validate_endpoint "http://localhost/api/health" "api.public.dev.veloflux.io" 200 "Health check da API"
validate_endpoint "http://localhost/admin/health" "admin.public.dev.veloflux.io" 200 "Health check do Admin"
validate_endpoint "http://localhost/public/health" "public.dev.veloflux.io" 200 "Health check do Public"

echo -e "\n[5] Verificando logs de erros do VeloFlux"
if docker logs veloflux-lb | grep -i error | grep -v "error_log" | grep -q .; then
  echo -e "${YELLOW}Erros encontrados nos logs:${NC}"
  docker logs veloflux-lb | grep -i error | grep -v "error_log" | head -5
else
  echo -e "${GREEN}Nenhum erro encontrado nos logs.${NC}"
fi

echo -e "\n===================================="
echo -e "${GREEN}Validação completa!${NC}"
echo "===================================="
