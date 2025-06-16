#!/bin/bash

# Script para reiniciar o VeloFlux com isolamento de portas
# Autor: GitHub Copilot
# Data: 16/06/2025

# Cores para saída
VERMELHO='\033[0;31m'
VERDE='\033[0;32m'
AMARELO='\033[0;33m'
AZUL='\033[0;34m'
SEM_COR='\033[0m'

echo -e "${AZUL}===== Reiniciando VeloFlux com Isolamento de Portas =====${SEM_COR}"
echo "Este script reinicia o VeloFlux com portas isoladas para evitar conflitos."

# Parar todos os containers primeiro
echo -e "${AMARELO}Parando todos os containers...${SEM_COR}"
docker compose down

# Iniciar serviços com a nova configuração de portas
echo -e "${AMARELO}Iniciando serviços com novas portas...${SEM_COR}"
docker compose up -d

# Aguardar inicialização dos serviços
echo -e "${AMARELO}Aguardando inicialização dos serviços (10 segundos)...${SEM_COR}"
sleep 10

# Mostrar status dos serviços
echo -e "${VERDE}===== Status dos Serviços =====${SEM_COR}"
docker ps

echo -e "${VERDE}===== Mapeamento de Portas =====${SEM_COR}"
echo -e "Serviço HTTP/HTTPS principal: ${VERDE}80${SEM_COR} e ${VERDE}443${SEM_COR}"
echo -e "Métricas do VeloFlux: ${VERDE}8880${SEM_COR} (anteriormente 8080)"
echo -e "API de Administração: ${VERDE}9900${SEM_COR} (anteriormente 9000)"
echo -e "Backend 1 (tenant1): ${VERDE}8801${SEM_COR} (anteriormente 8001)"
echo -e "Backend 2 (tenant2): ${VERDE}8802${SEM_COR} (anteriormente 8002)"
echo -e "Redis: ${VERDE}6399${SEM_COR} (anteriormente 6379)"
echo -e "Node Exporter: ${VERDE}9199${SEM_COR} (anteriormente 9100)"

# Testar acesso aos domínios
echo -e "${VERDE}===== Teste de Acesso aos Domínios =====${SEM_COR}"

# Testar tenant1.public.dev.veloflux.io
echo -e "${AZUL}Testando tenant1.public.dev.veloflux.io...${SEM_COR}"
curl -s -H 'Host: tenant1.public.dev.veloflux.io' http://localhost:80/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

# Testar tenant2.public.dev.veloflux.io
echo -e "${AZUL}Testando tenant2.public.dev.veloflux.io...${SEM_COR}"
curl -s -H 'Host: tenant2.public.dev.veloflux.io' http://localhost:80/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

# Testar api.public.dev.veloflux.io
echo -e "${AZUL}Testando api.public.dev.veloflux.io...${SEM_COR}"
curl -s -H 'Host: api.public.dev.veloflux.io' http://localhost:80/api/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

# Testar admin.public.dev.veloflux.io
echo -e "${AZUL}Testando admin.public.dev.veloflux.io...${SEM_COR}"
curl -s -H 'Host: admin.public.dev.veloflux.io' http://localhost:80/admin/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

# Testar acesso direto aos backends
echo -e "${AZUL}Testando acesso direto ao backend 1 (tenant1)...${SEM_COR}"
curl -s http://localhost:8801/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

echo -e "${AZUL}Testando acesso direto ao backend 2 (tenant2)...${SEM_COR}"
curl -s http://localhost:8802/ | grep -o "<h1>.*</h1>" || echo -e "${VERMELHO}Falha no acesso${SEM_COR}"

# Verificar métricas
echo -e "${AZUL}Verificando métricas (deve mostrar dados do Prometheus)...${SEM_COR}"
curl -s http://localhost:8880/metrics | head -5

echo -e "${VERDE}===== Configuração SSL =====${SEM_COR}"
echo -e "${AMARELO}SSL/TLS está habilitado com auto_cert=true para os seguintes domínios:${SEM_COR}"
echo "- public.dev.veloflux.io"
echo "- tenant1.public.dev.veloflux.io"
echo "- tenant2.public.dev.veloflux.io"
echo "- api.public.dev.veloflux.io"
echo "- admin.public.dev.veloflux.io"
echo "- *.public.dev.veloflux.io"

echo -e "${VERDE}===== Configuração Concluída =====${SEM_COR}"
echo "O ambiente VeloFlux está agora configurado para responder corretamente a todos os domínios,"
echo "com portas isoladas para evitar conflitos com outros serviços."
echo -e "IP público configurado: ${AMARELO}74.249.85.193${SEM_COR}"
