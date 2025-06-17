#!/bin/bash

# Limpeza Rápida do VPS para VeloFlux
# IP: 190.93.119.61

echo "🧹 Executando limpeza completa do VPS..."

# Comandos de limpeza que serão executados no servidor
cat << 'EOF' > /tmp/cleanup_commands.sh
#!/bin/bash

echo "🧹 Iniciando limpeza completa do servidor..."

# Parar todos os serviços VeloFlux
echo "🛑 Parando serviços..."
systemctl stop veloflux veloflux-lb veloflux-monitor nginx 2>/dev/null || true
systemctl disable veloflux veloflux-lb veloflux-monitor 2>/dev/null || true

# Remover containers Docker
echo "🐳 Removendo containers Docker..."
docker stop $(docker ps -aq) 2>/dev/null || true
docker rm $(docker ps -aq) 2>/dev/null || true
docker rmi $(docker images -q) 2>/dev/null || true
docker system prune -af 2>/dev/null || true

# Remover volumes Docker
docker volume rm $(docker volume ls -q) 2>/dev/null || true

# Limpar arquivos VeloFlux
echo "📁 Removendo arquivos..."
rm -rf /opt/veloflux
rm -rf /etc/veloflux
rm -rf /var/log/veloflux
rm -rf /var/lib/veloflux
rm -rf /var/backups/veloflux
rm -rf /tmp/veloflux*

# Remover serviços systemd
rm -f /etc/systemd/system/veloflux*.service
systemctl daemon-reload

# Remover configurações nginx VeloFlux
rm -f /etc/nginx/sites-available/veloflux*
rm -f /etc/nginx/sites-enabled/veloflux*

# Restaurar nginx padrão
systemctl restart nginx 2>/dev/null || true

# Limpar crontabs relacionados ao VeloFlux
crontab -l 2>/dev/null | grep -v veloflux | crontab - 2>/dev/null || true

# Remover usuários VeloFlux
userdel -r veloflux 2>/dev/null || true

# Limpar pacotes não utilizados
apt autoremove -y 2>/dev/null || true
apt autoclean 2>/dev/null || true

echo "✅ Limpeza completa finalizada!"
echo "📊 Espaço em disco após limpeza:"
df -h /
echo
echo "🔍 Processos Docker restantes:"
docker ps -a 2>/dev/null || echo "Nenhum container Docker encontrado"
echo
echo "🌐 Status do nginx:"
systemctl status nginx --no-pager -l 2>/dev/null || echo "Nginx não está rodando"

EOF

echo "📤 Enviando script de limpeza para o servidor..."
scp /tmp/cleanup_commands.sh root@190.93.119.61:/tmp/

echo "🚀 Executando limpeza no servidor..."
ssh root@190.93.119.61 "chmod +x /tmp/cleanup_commands.sh && /tmp/cleanup_commands.sh"

echo "🎉 Limpeza completa realizada!"
echo "🔄 Servidor está limpo e pronto para nova instalação."
