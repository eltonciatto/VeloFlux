#!/bin/bash

# Script para instalação remota completa do VeloFlux SaaS
# Com todas as correções aplicadas (ENV vars, Docker, SSL, etc.)

set -e

VPS_IP="190.93.119.61"
VPS_USER="root"
VPS_PASS="LMbbL1u8ii"

echo "=============================================="
echo "🚀 INSTALAÇÃO COMPLETA VELOFLUX SAAS"
echo "=============================================="
echo "IP: $VPS_IP"
echo "Usuário: $VPS_USER"
echo "=============================================="

# Função para executar comandos remotos
run_remote() {
    sshpass -p "$VPS_PASS" ssh -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "$VPS_USER@$VPS_IP" "$1"
}

echo ""
echo "📡 Testando conexão SSH..."
if run_remote "echo 'Conexão SSH estabelecida com sucesso'" 2>/dev/null; then
    echo "✅ Conexão SSH funcionando"
else
    echo "❌ Erro de conexão SSH"
    exit 1
fi

echo ""
echo "📦 Copiando script de instalação corrigido para o VPS..."
sshpass -p "$VPS_PASS" scp -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null \
    /workspaces/VeloFlux/scripts/install-veloflux-io.sh "$VPS_USER@$VPS_IP:/tmp/install-veloflux-io.sh"

echo "✅ Script copiado com sucesso"

echo ""
echo "🔧 Preparando script no servidor remoto..."
run_remote "chmod +x /tmp/install-veloflux-io.sh"

echo ""
echo "=============================================="
echo "🚀 INICIANDO INSTALAÇÃO NO SERVIDOR VPS"
echo "=============================================="
echo "📝 Executando script de instalação..."
echo "⏳ Este processo pode levar 5-10 minutos..."
echo "=============================================="

# Executar a instalação no servidor remoto em background e capturar output
echo ""
echo "🔄 Iniciando instalação..."

# Usar screen para executar em background e poder monitorar
run_remote "screen -dmS veloflux-install bash /tmp/install-veloflux-io.sh"

echo "✅ Instalação iniciada em background"
echo ""
echo "📊 Monitorando progresso da instalação..."

# Monitorar o progresso
for i in {1..30}; do
    echo "[$i/30] Verificando progresso..."
    
    # Verificar se o screen ainda está rodando
    if run_remote "screen -list | grep veloflux-install" >/dev/null 2>&1; then
        echo "⏳ Instalação ainda em andamento..."
        sleep 20
    else
        echo "✅ Instalação finalizada!"
        break
    fi
    
    if [ $i -eq 30 ]; then
        echo "⚠️  Instalação está demorando mais que o esperado (10 minutos)"
        echo "📋 Verificando logs..."
    fi
done

echo ""
echo "=============================================="
echo "🔍 VERIFICANDO RESULTADO DA INSTALAÇÃO"
echo "=============================================="

echo ""
echo "📋 Coletando logs da instalação..."
run_remote "cat /tmp/veloflux-install.log 2>/dev/null | tail -20 || echo 'Log não encontrado'"

echo ""
echo "🐳 Verificando containers Docker:"
run_remote "docker ps -a"

echo ""
echo "🔧 Verificando serviços systemd:"
run_remote "systemctl status veloflux --no-pager -l || echo 'Serviço não encontrado'"

echo ""
echo "🌐 Verificando Nginx:"
run_remote "systemctl status nginx --no-pager -l | head -10"

echo ""
echo "📁 Verificando estrutura de arquivos:"
run_remote "ls -la /opt/veloflux/ 2>/dev/null || echo 'Diretório /opt/veloflux não encontrado'"

echo ""
echo "🔒 Verificando certificados SSL:"
run_remote "ls -la /etc/letsencrypt/live/ 2>/dev/null | grep veloflux || echo 'Certificados não encontrados'"

echo ""
echo "📊 Verificando portas abertas:"
run_remote "netstat -tlnp | grep -E ':80|:443|:8080|:9000|:3001|:9090' || echo 'Nenhuma porta VeloFlux detectada'"

echo ""
echo "=============================================="
echo "🎯 TESTANDO ENDPOINTS"
echo "=============================================="

echo ""
echo "🌐 Testando endpoint principal:"
run_remote "curl -s -I http://localhost:80 | head -3 || echo 'Endpoint principal não responde'"

echo ""
echo "🔧 Testando API do VeloFlux:"
run_remote "curl -s -I http://localhost:8080/api/health 2>/dev/null | head -3 || echo 'API não responde'"

echo ""
echo "📊 Testando Grafana:"
run_remote "curl -s -I http://localhost:3001 | head -3 || echo 'Grafana não responde'"

echo ""
echo "📈 Testando Prometheus:"
run_remote "curl -s -I http://localhost:9090 | head -3 || echo 'Prometheus não responde'"

echo ""
echo "=============================================="
echo "📋 RECUPERANDO CREDENCIAIS FINAIS"
echo "=============================================="

echo ""
echo "🔑 Credenciais do sistema:"
run_remote "cat /root/veloflux-credentials.txt 2>/dev/null || echo 'Arquivo de credenciais não encontrado'"

echo ""
echo "=============================================="
echo "✅ VERIFICAÇÃO COMPLETA FINALIZADA"
echo "=============================================="

# Verificar se a instalação foi bem-sucedida
if run_remote "docker ps | grep veloflux" >/dev/null 2>&1; then
    echo "🎉 INSTALAÇÃO BEM-SUCEDIDA!"
    echo ""
    echo "🌐 Domínios configurados:"
    echo "   • Principal: https://veloflux.io"
    echo "   • Admin: https://admin.veloflux.io"
    echo "   • API: https://api.veloflux.io"
    echo "   • Métricas: https://metrics.veloflux.io"
    echo "   • Grafana: https://grafana.veloflux.io"
    echo "   • Prometheus: https://prometheus.veloflux.io"
    echo ""
    echo "🔑 Para acessar as credenciais completas:"
    echo "   ssh root@$VPS_IP 'cat /root/veloflux-credentials.txt'"
else
    echo "⚠️  INSTALAÇÃO PODE TER FALHADO"
    echo ""
    echo "🔍 Para diagnosticar problemas:"
    echo "   ssh root@$VPS_IP"
    echo "   docker logs veloflux-lb"
    echo "   journalctl -u veloflux -f"
fi

echo ""
echo "=============================================="
