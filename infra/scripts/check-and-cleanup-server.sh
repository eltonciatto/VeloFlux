#!/bin/bash

# Script para verificar o estado do servidor e fazer limpeza completa
# VeloFlux SaaS - Limpeza Total do Ambiente

set -e

VPS_IP="190.93.119.61"
VPS_USER="root"
VPS_PASS="LMbbL1u8ii"

echo "=============================================="
echo "🔍 VERIFICANDO ESTADO ATUAL DO SERVIDOR VPS"
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
echo "🖥️  Informações do Sistema:"
echo "----------------------------------------"
run_remote "uname -a"
run_remote "cat /etc/os-release | head -3"
run_remote "df -h /"
run_remote "free -h"

echo ""
echo "🐳 Verificando Docker e Containers:"
echo "----------------------------------------"
run_remote "docker --version 2>/dev/null || echo 'Docker não instalado'"
run_remote "docker ps -a 2>/dev/null || echo 'Nenhum container encontrado'"

echo ""
echo "🔧 Verificando Serviços Systemd VeloFlux:"
echo "----------------------------------------"
run_remote "systemctl list-units --all | grep -i veloflux || echo 'Nenhum serviço VeloFlux encontrado'"

echo ""
echo "🌐 Verificando Nginx:"
echo "----------------------------------------"
run_remote "systemctl status nginx --no-pager -l || echo 'Nginx não está rodando'"
run_remote "ls -la /etc/nginx/sites-available/ | grep -i veloflux || echo 'Nenhuma configuração VeloFlux no Nginx'"

echo ""
echo "📁 Verificando Diretórios VeloFlux:"
echo "----------------------------------------"
run_remote "ls -la /opt/ | grep -i veloflux || echo 'Nenhum diretório VeloFlux em /opt/'"
run_remote "ls -la /etc/systemd/system/ | grep -i veloflux || echo 'Nenhum serviço VeloFlux no systemd'"

echo ""
echo "🔒 Verificando Certificados SSL:"
echo "----------------------------------------"
run_remote "ls -la /etc/letsencrypt/live/ 2>/dev/null | grep -i veloflux || echo 'Nenhum certificado VeloFlux encontrado'"

echo ""
echo "📊 Verificando Processos em Execução:"
echo "----------------------------------------"
run_remote "ps aux | grep -i veloflux | grep -v grep || echo 'Nenhum processo VeloFlux em execução'"

echo ""
echo "=============================================="
echo "🧹 INICIANDO LIMPEZA COMPLETA DO SERVIDOR"
echo "=============================================="

echo ""
echo "🛑 Parando todos os serviços VeloFlux..."
run_remote "
    # Parar serviços systemd do VeloFlux
    systemctl stop veloflux 2>/dev/null || true
    systemctl stop veloflux.service 2>/dev/null || true
    systemctl disable veloflux 2>/dev/null || true
    systemctl disable veloflux.service 2>/dev/null || true
    
    # Parar todos os containers Docker
    docker stop \$(docker ps -q) 2>/dev/null || true
    docker rm \$(docker ps -aq) 2>/dev/null || true
    
    # Remover todas as imagens Docker (opcional, libera espaço)
    docker rmi \$(docker images -q) 2>/dev/null || true
    
    # Remover volumes Docker
    docker volume prune -f 2>/dev/null || true
    
    # Remover networks Docker
    docker network prune -f 2>/dev/null || true
    
    echo '✅ Serviços parados'
"

echo ""
echo "🗑️  Removendo arquivos e diretórios VeloFlux..."
run_remote "
    # Remover diretórios do VeloFlux
    rm -rf /opt/veloflux* 2>/dev/null || true
    rm -rf /root/veloflux* 2>/dev/null || true
    rm -rf /tmp/veloflux* 2>/dev/null || true
    rm -rf /tmp/install-veloflux* 2>/dev/null || true
    
    # Remover arquivos de configuração
    rm -f /etc/systemd/system/veloflux* 2>/dev/null || true
    rm -f /etc/nginx/sites-available/veloflux* 2>/dev/null || true
    rm -f /etc/nginx/sites-enabled/veloflux* 2>/dev/null || true
    
    # Remover credenciais e logs
    rm -f /root/veloflux-credentials.txt 2>/dev/null || true
    rm -f /var/log/veloflux* 2>/dev/null || true
    
    echo '✅ Arquivos removidos'
"

echo ""
echo "🔧 Recarregando configurações do sistema..."
run_remote "
    # Recarregar systemd
    systemctl daemon-reload
    
    # Recarregar Nginx
    systemctl reload nginx 2>/dev/null || systemctl restart nginx 2>/dev/null || true
    
    echo '✅ Configurações recarregadas'
"

echo ""
echo "🔒 Removendo certificados SSL VeloFlux..."
run_remote "
    # Remover certificados Let's Encrypt do VeloFlux
    rm -rf /etc/letsencrypt/live/*veloflux* 2>/dev/null || true
    rm -rf /etc/letsencrypt/archive/*veloflux* 2>/dev/null || true
    rm -rf /etc/letsencrypt/renewal/*veloflux* 2>/dev/null || true
    
    echo '✅ Certificados removidos'
"

echo ""
echo "🧹 Limpeza adicional do sistema..."
run_remote "
    # Limpar logs antigos
    journalctl --vacuum-time=1d 2>/dev/null || true
    
    # Limpar cache APT
    apt-get clean 2>/dev/null || true
    
    # Remover pacotes órfãos
    apt-get autoremove -y 2>/dev/null || true
    
    echo '✅ Limpeza adicional concluída'
"

echo ""
echo "=============================================="
echo "🔍 VERIFICAÇÃO FINAL - ESTADO APÓS LIMPEZA"
echo "=============================================="

echo ""
echo "🐳 Containers Docker restantes:"
run_remote "docker ps -a 2>/dev/null || echo 'Nenhum container encontrado'"

echo ""
echo "🔧 Serviços Systemd VeloFlux restantes:"
run_remote "systemctl list-units --all | grep -i veloflux || echo 'Nenhum serviço VeloFlux encontrado'"

echo ""
echo "📁 Diretórios VeloFlux restantes:"
run_remote "find /opt /root /tmp -name '*veloflux*' 2>/dev/null || echo 'Nenhum diretório VeloFlux encontrado'"

echo ""
echo "🌐 Status do Nginx:"
run_remote "systemctl status nginx --no-pager -l | head -5"

echo ""
echo "💾 Espaço em disco disponível:"
run_remote "df -h /"

echo ""
echo "=============================================="
echo "✅ LIMPEZA COMPLETA FINALIZADA"
echo "=============================================="
echo "🎯 O servidor está limpo e pronto para nova instalação"
echo "🔄 Todos os serviços, arquivos e configurações do VeloFlux foram removidos"
echo "🌐 Nginx está funcionando com configuração padrão"
echo "💽 Docker está limpo (containers, imagens e volumes removidos)"
echo "=============================================="
