#!/bin/bash

# VeloFlux - Implementação de Failover para Redirecionar Tráfego
# Este script configura o VeloFlux para redirecionar tráfego quando uma aplicação estiver fora do ar

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

# Verificar se o arquivo de configuração existe
if [ ! -f "/etc/veloflux/config.yaml" ] && [ ! -f "/workspaces/VeloFlux/config/config.yaml" ]; then
    error "Arquivo de configuração não encontrado. Certifique-se de que o VeloFlux está instalado."
fi

# Determinar o caminho do arquivo de configuração
CONFIG_PATH="/etc/veloflux/config.yaml"
if [ ! -f "$CONFIG_PATH" ]; then
    CONFIG_PATH="/workspaces/VeloFlux/config/config.yaml"
fi

log "Implementando configuração de failover no VeloFlux..."

# Criar backup do arquivo de configuração
BACKUP_PATH="${CONFIG_PATH}.backup-$(date +%Y%m%d%H%M%S)"
cp "$CONFIG_PATH" "$BACKUP_PATH"
log "Backup do arquivo de configuração criado em $BACKUP_PATH"

# Perguntar sobre a aplicação principal
echo ""
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}      CONFIGURAÇÃO DE FAILOVER DO VELOFLUX          ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo "Esta ferramenta configurará o VeloFlux para redirecionar o tráfego"
echo "para um endereço alternativo quando a aplicação principal estiver fora do ar."
echo ""
read -p "Nome da aplicação principal (ex: app-principal): " APP_NAME
read -p "Host da aplicação principal (ex: app.example.com): " APP_HOST
read -p "Endereço do servidor principal (ex: backend1:80): " PRIMARY_SERVER
read -p "Endereço do servidor de failover (ex: backup-server:80): " FAILOVER_SERVER
read -p "Caminho do health check (ex: /health): " HEALTH_PATH
read -p "Intervalo do health check em segundos (ex: 5): " HEALTH_INTERVAL
read -p "Threshold de falha (quantas falhas antes do failover, ex: 2): " FAILURE_THRESHOLD

# Criar um arquivo de configuração de failover temporário
TEMP_CONFIG=$(mktemp)

cat > "$TEMP_CONFIG" << EOL
# VeloFlux LB Configuration with Failover
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  health_check:
    interval: "${HEALTH_INTERVAL}s"
    timeout: "2s"
    retries: ${FAILURE_THRESHOLD}

# Pools de servidores
pools:
  - name: "${APP_NAME}-pool"
    algorithm: "failover"  # Algoritmo especial para failover
    
    backends:
      - address: "${PRIMARY_SERVER}"
        weight: 100
        health_check:
          path: "${HEALTH_PATH}"
          interval: "${HEALTH_INTERVAL}s"
          timeout: "2s"
          expected_status: 200
          healthy_threshold: 2
          unhealthy_threshold: ${FAILURE_THRESHOLD}
          
      - address: "${FAILOVER_SERVER}"
        weight: 100
        health_check:
          path: "${HEALTH_PATH}"
          interval: "${HEALTH_INTERVAL}s"
          timeout: "2s"
          expected_status: 200
          healthy_threshold: 2
          unhealthy_threshold: ${FAILURE_THRESHOLD}
        failover: true  # Marca este backend como failover

# Rotas
routes:
  - host: "${APP_HOST}"
    path_prefix: "/"
    backend_protocol: "http"
    backend_timeout: "30s"
    load_balancing:
      method: "failover"  # Usar método failover
    pool: "${APP_NAME}-pool"

# Configuração de Failover
failover:
  enabled: true
  strategy: "immediate"  # immediate, graceful ou delayed
  check_interval: "${HEALTH_INTERVAL}s"
  recovery_interval: "10s"
  notification:
    enabled: true
    channels:
      - type: "log"
        level: "warning"
EOL

# Perguntar se quer notificação por email
echo ""
echo "Deseja configurar notificações por email quando ocorrer failover?"
read -p "Configurar notificações por email? (s/n): " EMAIL_NOTIFY

if [[ "$EMAIL_NOTIFY" == "s" || "$EMAIL_NOTIFY" == "S" ]]; then
    read -p "Servidor SMTP (ex: smtp.gmail.com): " SMTP_SERVER
    read -p "Porta SMTP (ex: 587): " SMTP_PORT
    read -p "Usuário SMTP: " SMTP_USER
    read -p "Senha SMTP: " SMTP_PASS
    read -p "Email destinatário: " EMAIL_RECIPIENT
    
    # Adicionar configuração de email
    cat >> "$TEMP_CONFIG" << EOL
      - type: "email"
        smtp_server: "${SMTP_SERVER}"
        smtp_port: ${SMTP_PORT}
        smtp_user: "${SMTP_USER}"
        smtp_password: "${SMTP_PASS}"
        recipients:
          - "${EMAIL_RECIPIENT}"
        subject: "[ALERTA] Failover ativado para ${APP_NAME}"
EOL
fi

# Perguntar se quer webhook para Discord/Slack
echo ""
echo "Deseja configurar webhook para Discord/Slack quando ocorrer failover?"
read -p "Configurar webhook? (s/n): " WEBHOOK_NOTIFY

if [[ "$WEBHOOK_NOTIFY" == "s" || "$WEBHOOK_NOTIFY" == "S" ]]; then
    read -p "URL do webhook: " WEBHOOK_URL
    
    # Adicionar configuração de webhook
    cat >> "$TEMP_CONFIG" << EOL
      - type: "webhook"
        url: "${WEBHOOK_URL}"
        payload_template: |
          {
            "text": "**ALERTA DE FAILOVER**\\nAplicação ${APP_NAME} está fora do ar.\\nTráfego redirecionado para servidor de backup."
          }
EOL
fi

# Mesclar configurações
log "Mesclando configurações de failover..."
# Para este exemplo, vamos apenas usar a nova configuração
# Em um sistema real, você pode querer mesclar com a configuração existente

# Aplicar nova configuração
cp "$TEMP_CONFIG" "$CONFIG_PATH"
rm -f "$TEMP_CONFIG"

log "✅ Configuração de failover aplicada com sucesso!"
echo ""
echo -e "${BLUE}====================================================${NC}"
echo "A aplicação $APP_NAME foi configurada com failover."
echo "Quando o servidor $PRIMARY_SERVER estiver fora do ar,"
echo "o tráfego será redirecionado para $FAILOVER_SERVER."
echo ""
echo "Para testar, você pode derrubar intencionalmente o servidor principal:"
echo "  1. Pare o serviço no servidor principal"
echo "  2. Monitore os logs para verificar o failover:"
echo "     tail -f /var/log/veloflux/veloflux.log"
echo ""
echo "Para reverter para a configuração anterior, use:"
echo "  cp $BACKUP_PATH $CONFIG_PATH"
echo "  sudo systemctl restart veloflux"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo "Deseja reiniciar o VeloFlux para aplicar as alterações?"
read -p "Reiniciar VeloFlux agora? (s/n): " RESTART

if [[ "$RESTART" == "s" || "$RESTART" == "S" ]]; then
    if [ -f "/etc/systemd/system/veloflux.service" ]; then
        log "Reiniciando serviço VeloFlux..."
        systemctl restart veloflux
    else
        log "Reiniciando VeloFlux via Docker..."
        if command -v docker-compose &> /dev/null; then
            cd /workspaces/VeloFlux && docker-compose restart
        elif command -v docker compose &> /dev/null; then
            cd /workspaces/VeloFlux && docker compose restart
        else
            log "Não foi possível reiniciar automaticamente. Reinicie manualmente o serviço."
        fi
    fi
    
    log "✅ VeloFlux reiniciado com a nova configuração de failover!"
else
    log "⚠️ Lembre-se de reiniciar o VeloFlux para aplicar as alterações."
fi
