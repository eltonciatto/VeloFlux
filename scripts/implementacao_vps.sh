#!/bin/bash
# VeloFlux - Script de Implementação em VPS
# Uso: ./implementacao_vps.sh [IP_DO_SERVIDOR]

set -e

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Verificar se o IP do servidor foi fornecido
if [ -z "$1" ]; then
    echo -e "${YELLOW}Uso: $0 <IP_DO_SERVIDOR>${NC}"
    echo "Exemplo: $0 192.168.1.100"
    exit 1
fi

SERVER_IP=$1
SSH_USER="root"  # Altere para o usuário SSH apropriado se necessário

log "Iniciando implementação do VeloFlux no servidor $SERVER_IP"

# Criar diretório temporário
TEMP_DIR=$(mktemp -d)
log "Diretório temporário criado: $TEMP_DIR"

# Preparar arquivos para envio
log "Preparando arquivos para envio..."
mkdir -p "$TEMP_DIR/veloflux-deploy"
mkdir -p "$TEMP_DIR/veloflux-deploy/config"
mkdir -p "$TEMP_DIR/veloflux-deploy/scripts"
mkdir -p "$TEMP_DIR/veloflux-deploy/test"

# Copiar arquivos de configuração
cp /workspaces/VeloFlux/config/config.example.yaml "$TEMP_DIR/veloflux-deploy/config/config.yaml"
cp /workspaces/VeloFlux/docker-compose.yml "$TEMP_DIR/veloflux-deploy/"
cp /workspaces/VeloFlux/Dockerfile.production "$TEMP_DIR/veloflux-deploy/Dockerfile"

# Criar páginas de teste
cat > "$TEMP_DIR/veloflux-deploy/test/backend1.html" <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>Backend 1</title>
</head>
<body>
    <h1>Backend 1</h1>
    <p>Este é o servidor backend 1.</p>
</body>
</html>
EOL

cat > "$TEMP_DIR/veloflux-deploy/test/backend2.html" <<EOL
<!DOCTYPE html>
<html>
<head>
    <title>Backend 2</title>
</head>
<body>
    <h1>Backend 2</h1>
    <p>Este é o servidor backend 2.</p>
</body>
</html>
EOL

cat > "$TEMP_DIR/veloflux-deploy/test/health.html" <<EOL
OK
EOL

# Criar script de instalação
cat > "$TEMP_DIR/veloflux-deploy/install.sh" <<'EOL'
#!/bin/bash

# VeloFlux - Script de Instalação para VPS
set -e

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Verificar se é root
if [[ $EUID -ne 0 ]]; then
    error "Este script deve ser executado como root (sudo)."
fi

log "Iniciando instalação do VeloFlux..."

# Atualizar sistema
log "Atualizando sistema..."
apt-get update
apt-get upgrade -y

# Instalar dependências
log "Instalando dependências..."
apt-get install -y curl wget git nginx ufw htop unzip software-properties-common \
    apt-transport-https ca-certificates gnupg lsb-release redis-server

# Instalar Docker se não estiver instalado
if ! command -v docker &> /dev/null; then
    log "Instalando Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

# Instalar Docker Compose se não estiver instalado
if ! command -v docker-compose &> /dev/null; then
    log "Instalando Docker Compose..."
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

# Criar estrutura de diretórios
log "Criando estrutura de diretórios..."
mkdir -p /opt/veloflux
mkdir -p /etc/veloflux
mkdir -p /var/log/veloflux
mkdir -p /etc/ssl/certs/veloflux

# Criar usuário de serviço
log "Criando usuário de serviço..."
useradd -r -s /bin/false veloflux || true

# Copiar arquivos
log "Copiando arquivos..."
cp -r * /opt/veloflux/
cp config/config.yaml /etc/veloflux/

# Ajustar permissões
log "Ajustando permissões..."
chown -R veloflux:veloflux /var/log/veloflux /etc/ssl/certs/veloflux /etc/veloflux

# Configurar serviço systemd
log "Configurando serviço systemd..."
cat > /etc/systemd/system/veloflux.service <<EOF
[Unit]
Description=VeloFlux Load Balancer Service
After=network.target redis-server.service docker.service
Requires=docker.service

[Service]
User=veloflux
Group=veloflux
WorkingDirectory=/opt/veloflux
ExecStart=/usr/bin/docker-compose up
ExecStop=/usr/bin/docker-compose down
Restart=always
TimeoutStartSec=0
TimeoutStopSec=30

[Install]
WantedBy=multi-user.target
EOF

# Configurar Nginx
log "Configurando Nginx..."
cat > /etc/nginx/sites-available/veloflux <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

ln -sf /etc/nginx/sites-available/veloflux /etc/nginx/sites-enabled/default

# Verificar configuração do Nginx
nginx -t

# Reiniciar serviços
log "Reiniciando serviços..."
systemctl daemon-reload
systemctl restart nginx
systemctl enable veloflux
systemctl start veloflux

# Configurar firewall
log "Configurando firewall..."
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 22/tcp

# Verificação final
log "Verificando instalação..."
sleep 5
if curl -s http://localhost/health | grep -q "OK"; then
    log "✅ VeloFlux instalado com sucesso!"
else
    log "⚠️ VeloFlux instalado, mas o health check falhou. Verifique os logs."
fi

# Imprimir URLs de acesso
echo ""
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}      VELOFLUX INSTALADO COM SUCESSO                ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo "Acesse:"
echo " - VeloFlux: http://$(hostname -I | awk '{print $1}')"
echo " - Health Check: http://$(hostname -I | awk '{print $1}')/health"
echo ""
echo "Para verificar o status:"
echo " - systemctl status veloflux"
echo ""
echo "Para visualizar logs:"
echo " - journalctl -u veloflux -f"
echo ""
EOL

# Tornar o script de instalação executável
chmod +x "$TEMP_DIR/veloflux-deploy/install.sh"

# Criar script de status
cat > "$TEMP_DIR/veloflux-deploy/check-status.sh" <<'EOL'
#!/bin/bash

# VeloFlux - Script de verificação de status
set -e

# Cores para saída
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}     VERIFICAÇÃO DE STATUS DO VELOFLUX               ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Verificar serviços
echo -e "${YELLOW}Verificando serviços...${NC}"

echo -n "Serviço Docker: "
if systemctl is-active --quiet docker; then
    echo -e "${GREEN}ATIVO${NC}"
else
    echo -e "${RED}INATIVO${NC}"
fi

echo -n "Serviço VeloFlux: "
if systemctl is-active --quiet veloflux; then
    echo -e "${GREEN}ATIVO${NC}"
else
    echo -e "${RED}INATIVO${NC}"
fi

echo -n "Serviço Nginx: "
if systemctl is-active --quiet nginx; then
    echo -e "${GREEN}ATIVO${NC}"
else
    echo -e "${RED}INATIVO${NC}"
fi

echo -n "Serviço Redis: "
if systemctl is-active --quiet redis-server; then
    echo -e "${GREEN}ATIVO${NC}"
else
    echo -e "${RED}INATIVO${NC}"
fi

echo ""

# Verificar portas
echo -e "${YELLOW}Verificando portas...${NC}"

echo -n "HTTP (porta 80): "
if ss -tuln | grep -q ":80 "; then
    echo -e "${GREEN}ABERTA${NC}"
else
    echo -e "${RED}FECHADA${NC}"
fi

echo -n "VeloFlux Container (porta 8080): "
if ss -tuln | grep -q ":8080 "; then
    echo -e "${GREEN}ABERTA${NC}"
else
    echo -e "${RED}FECHADA${NC}"
fi

echo ""

# Verificar conectividade
echo -e "${YELLOW}Verificando conectividade...${NC}"

echo -n "Health Check: "
if curl -s http://localhost/health | grep -q "OK"; then
    echo -e "${GREEN}OK${NC}"
else
    echo -e "${RED}FALHA${NC}"
fi

echo ""
echo -e "${BLUE}====================================================${NC}"
echo -e "${GREEN}Verificação concluída!${NC}"
EOL

# Tornar o script de status executável
chmod +x "$TEMP_DIR/veloflux-deploy/check-status.sh"

# Compactar os arquivos
log "Compactando arquivos..."
cd "$TEMP_DIR"
tar czf veloflux-deploy.tar.gz veloflux-deploy

# Enviar para o servidor
log "Enviando arquivos para o servidor $SERVER_IP..."
scp "$TEMP_DIR/veloflux-deploy.tar.gz" "$SSH_USER@$SERVER_IP:/tmp/"

# Executar a instalação remotamente
log "Executando a instalação no servidor..."
ssh "$SSH_USER@$SERVER_IP" "cd /tmp && tar xzf veloflux-deploy.tar.gz && cd veloflux-deploy && ./install.sh"

# Limpar arquivos temporários
log "Limpando arquivos temporários..."
rm -rf "$TEMP_DIR"

log "✅ Implementação concluída! VeloFlux deve estar rodando em http://$SERVER_IP/"
log "Para verificar o status, acesse o servidor e execute: /opt/veloflux/check-status.sh"
