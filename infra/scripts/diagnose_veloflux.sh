#!/bin/bash

echo "=== DIAGNÓSTICO COMPLETO VELOFLUX ==="
echo "Data: $(date)"
echo

echo "1. 🐳 CONTAINERS STATUS:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -E "(NAME|veloflux)"
echo

echo "2. 🌐 NETWORK CONNECTIVITY:"
echo "Backend tenant1 direto:"
docker exec veloflux-tenant1-prod curl -s -o /dev/null -w "  Status: %{http_code}" http://localhost/ && echo
docker exec veloflux-tenant1-prod curl -s -o /dev/null -w "  Admin: %{http_code}" http://localhost/admin/ && echo
docker exec veloflux-tenant1-prod curl -s -o /dev/null -w "  Public: %{http_code}" http://localhost/public/ && echo
echo

echo "3. 📋 VELOFLUX LOGS (últimas 10 linhas):"
docker logs veloflux-lb-prod --tail 10
echo

echo "4. 🔧 CONFIGURAÇÃO CARREGADA:"
docker exec veloflux-lb-prod cat /etc/veloflux/config-minimal.yaml | head -20
echo

echo "5. 🧪 TESTES DE CONECTIVIDADE INTERNA:"
echo "VeloFlux para backend:"
docker exec veloflux-lb-prod curl -s -o /dev/null -w "  Backend: %{http_code}" http://backend-tenant1/ 2>/dev/null && echo
echo

echo "6. 🔍 VERIFICANDO RESOLUÇÃO DNS:"
docker exec veloflux-lb-prod nslookup backend-tenant1 2>/dev/null | grep Address || echo "DNS lookup failed"
echo

echo "=== FIM DO DIAGNÓSTICO ==="
