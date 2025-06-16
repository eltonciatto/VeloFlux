#!/bin/bash

# VeloFlux - Solucionador de Problemas Comuns
# Este script ajuda a resolver problemas comuns de implementação do VeloFlux

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

warn() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] AVISO: $1${NC}"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERRO: $1${NC}"
    exit 1
}

# Menu de opções
show_menu() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}      SOLUCIONADOR DE PROBLEMAS VELOFLUX            ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    echo "Selecione o problema que você está enfrentando:"
    echo ""
    echo "1. Instalação do VeloFlux falha"
    echo "2. VeloFlux não inicia/não responde"
    echo "3. Problemas com Redis/banco de dados"
    echo "4. Problemas com certificados SSL"
    echo "5. Problemas com o Docker"
    echo "6. Problemas de roteamento/load balancing"
    echo "7. Problemas com o modo SaaS/multi-tenant"
    echo "8. Logs e diagnósticos"
    echo "9. Executar verificação rápida do sistema"
    echo "0. Sair"
    echo ""
    echo -n "Digite sua escolha: "
}

# Função para pausa
pause() {
    echo ""
    read -p "Pressione Enter para continuar..." dummy
}

# Solução para problemas de instalação
fix_installation() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}      SOLUÇÕES PARA PROBLEMAS DE INSTALAÇÃO         ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns de instalação e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Script de instalação falha com erro de permissão${NC}"
    echo "   Solução: Execute o script como root ou com sudo"
    echo "   Comando: sudo ./install.sh"
    echo ""
    
    echo -e "${YELLOW}2. Dependências não instaladas corretamente${NC}"
    echo "   Solução: Instale manualmente as dependências principais"
    echo "   Comando: sudo apt-get update && sudo apt-get install -y docker.io docker-compose nginx redis-server"
    echo ""
    
    echo -e "${YELLOW}3. Problemas com o diretório de instalação${NC}"
    echo "   Solução: Crie manualmente os diretórios necessários"
    echo "   Comando:"
    echo "   sudo mkdir -p /opt/veloflux /etc/veloflux /var/log/veloflux"
    echo "   sudo chown -R \$USER:\$USER /opt/veloflux /etc/veloflux /var/log/veloflux"
    echo ""
    
    echo -e "${YELLOW}4. Arquivo config.yaml não encontrado${NC}"
    echo "   Solução: Copie o arquivo de configuração de exemplo"
    echo "   Comando:"
    echo "   sudo cp /workspaces/VeloFlux/config/config.example.yaml /etc/veloflux/config.yaml"
    echo ""
    
    echo -e "${YELLOW}5. Instalação completa manual${NC}"
    echo "   Se tudo mais falhar, você pode executar estes comandos para uma instalação básica:"
    echo ""
    echo "   # Criar estrutura"
    echo "   sudo mkdir -p /opt/veloflux /etc/veloflux /var/log/veloflux"
    echo ""
    echo "   # Copiar arquivos"
    echo "   sudo cp -r /workspaces/VeloFlux/* /opt/veloflux/"
    echo "   sudo cp /opt/veloflux/config/config.example.yaml /etc/veloflux/config.yaml"
    echo ""
    echo "   # Configurar permissões"
    echo "   sudo useradd -r -s /bin/false veloflux"
    echo "   sudo chown -R veloflux:veloflux /var/log/veloflux /etc/veloflux"
    echo ""
    echo "   # Construir a aplicação"
    echo "   cd /opt/veloflux"
    echo "   sudo docker-compose build"
    echo "   sudo docker-compose up -d"
    echo ""
    
    pause
}

# Solução para problemas de inicialização
fix_startup() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}   SOLUÇÕES PARA PROBLEMAS DE INICIALIZAÇÃO         ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns de inicialização e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Serviço não inicia (systemd)${NC}"
    echo "   Solução: Verifique os logs do serviço"
    echo "   Comando: sudo journalctl -u veloflux -n 50"
    echo ""
    echo "   Reinicie o serviço:"
    echo "   Comando: sudo systemctl restart veloflux"
    echo ""
    
    echo -e "${YELLOW}2. Portas já em uso${NC}"
    echo "   Solução: Identifique e pare o processo que está usando a porta"
    echo "   Comando para verificar:"
    echo "   sudo ss -tunlp | grep -E ':80|:443|:8080|:9000'"
    echo ""
    echo "   Para parar um serviço nginx que pode estar usando a porta 80:"
    echo "   sudo systemctl stop nginx"
    echo ""
    
    echo -e "${YELLOW}3. Problemas com arquivo de configuração${NC}"
    echo "   Solução: Verifique se o arquivo de configuração está correto"
    echo "   Comando: sudo cat /etc/veloflux/config.yaml"
    echo ""
    echo "   Restaure a configuração padrão:"
    echo "   sudo cp /opt/veloflux/config/config.example.yaml /etc/veloflux/config.yaml"
    echo ""
    
    echo -e "${YELLOW}4. VeloFlux inicia mas não responde${NC}"
    echo "   Solução: Verifique se as portas estão abertas no firewall"
    echo "   Comando: sudo ufw status"
    echo ""
    echo "   Permitir tráfego HTTP/HTTPS:"
    echo "   sudo ufw allow 80/tcp"
    echo "   sudo ufw allow 443/tcp"
    echo ""
    
    echo -e "${YELLOW}5. Reinicialização completa${NC}"
    echo "   Se você quiser uma reinicialização completa de todos os serviços:"
    echo ""
    echo "   sudo systemctl stop veloflux nginx redis-server"
    echo "   sudo systemctl start redis-server"
    echo "   sudo systemctl start veloflux"
    echo "   sudo systemctl start nginx"
    echo ""
    
    pause
}

# Solução para problemas com Redis
fix_redis() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}   SOLUÇÕES PARA PROBLEMAS COM REDIS/BANCO DE DADOS  ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns com Redis e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Redis não inicia${NC}"
    echo "   Solução: Verifique os logs do Redis"
    echo "   Comando: sudo journalctl -u redis-server -n 50"
    echo ""
    echo "   Reinicie o serviço Redis:"
    echo "   Comando: sudo systemctl restart redis-server"
    echo ""
    
    echo -e "${YELLOW}2. Problema de conexão com o Redis${NC}"
    echo "   Solução: Verifique se o Redis está escutando"
    echo "   Comando: sudo ss -tunlp | grep 6379"
    echo ""
    echo "   Teste a conexão com o Redis:"
    echo "   redis-cli ping"
    echo ""
    
    echo -e "${YELLOW}3. Problemas de permissão do Redis${NC}"
    echo "   Solução: Verifique as permissões do diretório de dados"
    echo "   Comando: sudo ls -la /var/lib/redis"
    echo ""
    echo "   Corrija as permissões:"
    echo "   sudo chown -R redis:redis /var/lib/redis"
    echo ""
    
    echo -e "${YELLOW}4. Redis está cheio/sem memória${NC}"
    echo "   Solução: Limpe alguns dados ou aumente a memória disponível"
    echo "   Comando para verificar estatísticas:"
    echo "   redis-cli info memory"
    echo ""
    echo "   Para limpar todos os dados (CUIDADO!):"
    echo "   redis-cli flushall"
    echo ""
    
    echo -e "${YELLOW}5. Reinicialização com dados limpos${NC}"
    echo "   Se você precisa de um recomeço limpo (APAGA TODOS OS DADOS!):"
    echo ""
    echo "   sudo systemctl stop redis-server"
    echo "   sudo rm /var/lib/redis/dump.rdb"
    echo "   sudo systemctl start redis-server"
    echo ""
    
    pause
}

# Solução para problemas com SSL
fix_ssl() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}      SOLUÇÕES PARA PROBLEMAS COM SSL               ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns com SSL e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Certificados não são gerados automaticamente${NC}"
    echo "   Solução: Verifique se o domínio aponta corretamente para o servidor"
    echo "   Comando: dig +short seudominio.com"
    echo ""
    echo "   Certifique-se que a porta 80 está aberta para desafios ACME:"
    echo "   sudo ufw allow 80/tcp"
    echo ""
    
    echo -e "${YELLOW}2. Erro de permissão ao acessar certificados${NC}"
    echo "   Solução: Verifique e corrija as permissões do diretório de certificados"
    echo "   Comando:"
    echo "   sudo mkdir -p /etc/ssl/certs/veloflux"
    echo "   sudo chown -R veloflux:veloflux /etc/ssl/certs/veloflux"
    echo ""
    
    echo -e "${YELLOW}3. Certificados expirados${NC}"
    echo "   Solução: Force a renovação dos certificados"
    echo "   Comando (se estiver usando Certbot):"
    echo "   sudo certbot renew --force-renewal"
    echo ""
    
    echo -e "${YELLOW}4. Usando certificados auto-assinados para desenvolvimento${NC}"
    echo "   Solução: Gere certificados auto-assinados para teste"
    echo "   Comando:"
    echo "   sudo mkdir -p /etc/ssl/certs/veloflux"
    echo "   sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \\"
    echo "     -keyout /etc/ssl/certs/veloflux/privkey.pem \\"
    echo "     -out /etc/ssl/certs/veloflux/fullchain.pem \\"
    echo "     -subj '/CN=localhost'"
    echo "   sudo chown -R veloflux:veloflux /etc/ssl/certs/veloflux"
    echo ""
    
    pause
}

# Solução para problemas com Docker
fix_docker() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}      SOLUÇÕES PARA PROBLEMAS COM DOCKER            ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns com Docker e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Docker não está instalado${NC}"
    echo "   Solução: Instale o Docker"
    echo "   Comando:"
    echo "   curl -fsSL https://get.docker.com | sh"
    echo "   sudo systemctl enable docker"
    echo "   sudo systemctl start docker"
    echo ""
    
    echo -e "${YELLOW}2. Docker Compose não está instalado${NC}"
    echo "   Solução: Instale o Docker Compose"
    echo "   Comando para Docker Compose v2:"
    echo "   sudo apt-get update"
    echo "   sudo apt-get install -y docker-compose-plugin"
    echo ""
    echo "   Comando para Docker Compose v1 (alternativa):"
    echo "   sudo curl -L \"https://github.com/docker/compose/releases/download/v2.18.1/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    echo "   sudo chmod +x /usr/local/bin/docker-compose"
    echo ""
    
    echo -e "${YELLOW}3. Problema de permissão ao rodar Docker${NC}"
    echo "   Solução: Adicione seu usuário ao grupo docker"
    echo "   Comando:"
    echo "   sudo usermod -aG docker \$USER"
    echo "   # Faça logout e login novamente para aplicar as alterações"
    echo ""
    
    echo -e "${YELLOW}4. Erros em Docker Compose${NC}"
    echo "   Solução: Verifique se o arquivo docker-compose.yml está correto"
    echo "   Comando:"
    echo "   cd /opt/veloflux"
    echo "   docker-compose config"
    echo ""
    echo "   Para reconstruir os containers:"
    echo "   docker-compose down"
    echo "   docker-compose build"
    echo "   docker-compose up -d"
    echo ""
    
    echo -e "${YELLOW}5. Limpar recursos Docker não utilizados${NC}"
    echo "   Solução: Remova containers parados, redes não utilizadas e imagens"
    echo "   Comando:"
    echo "   docker system prune -a"
    echo ""
    
    pause
}

# Solução para problemas de roteamento
fix_routing() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}     SOLUÇÕES PARA PROBLEMAS DE ROTEAMENTO          ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns de roteamento/load balancing e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Backends não são alcançáveis${NC}"
    echo "   Solução: Verifique se os backends estão rodando e acessíveis"
    echo "   Comando:"
    echo "   curl http://backend-1/health"
    echo "   curl http://backend-2/health"
    echo ""
    
    echo -e "${YELLOW}2. Configuração de rota incorreta${NC}"
    echo "   Solução: Verifique a configuração de rotas no config.yaml"
    echo "   Comando:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 20 routes:"
    echo ""
    echo "   Exemplo de configuração correta de rotas:"
    echo "   routes:"
    echo "     - name: \"default-route\""
    echo "       host: \"*\""
    echo "       path_prefix: \"/\""
    echo "       backends:"
    echo "         - name: \"backend-1\""
    echo "           address: \"backend-1:80\""
    echo "         - name: \"backend-2\""
    echo "           address: \"backend-2:80\""
    echo ""
    
    echo -e "${YELLOW}3. Health checks falham${NC}"
    echo "   Solução: Verifique a configuração dos health checks"
    echo "   Comando para testar manualmente:"
    echo "   curl http://backend-1/health"
    echo ""
    echo "   Ajuste os health checks no config.yaml:"
    echo "   health_check:"
    echo "     path: \"/health\""
    echo "     interval: \"5s\""
    echo "     timeout: \"2s\""
    echo "     healthy_threshold: 2"
    echo "     unhealthy_threshold: 3"
    echo ""
    
    echo -e "${YELLOW}4. Problema com balanceamento de carga${NC}"
    echo "   Solução: Verifique o método de balanceamento configurado"
    echo "   Comando:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 5 load_balancing"
    echo ""
    echo "   Exemplo de configuração de balanceamento:"
    echo "   load_balancing:"
    echo "     method: \"round_robin\"  # ou \"least_conn\" ou \"ip_hash\""
    echo ""
    
    echo -e "${YELLOW}5. Testar roteamento manualmente${NC}"
    echo "   Solução: Envie várias requisições para ver o balanceamento"
    echo "   Comando:"
    echo "   for i in {1..10}; do curl -s http://localhost | grep -o 'Backend [0-9]'; done"
    echo ""
    
    pause
}

# Solução para problemas com modo SaaS
fix_saas() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}   SOLUÇÕES PARA PROBLEMAS COM MODO SAAS            ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Problemas comuns com modo SaaS/multi-tenant e suas soluções:"
    echo ""
    
    echo -e "${YELLOW}1. Problemas com isolamento de tenant${NC}"
    echo "   Solução: Verifique se a configuração multi-tenant está ativada"
    echo "   Comando para verificar:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 10 multiTenant"
    echo ""
    echo "   Exemplo de configuração correta:"
    echo "   multiTenant:"
    echo "     enabled: true"
    echo "     tenantHeader: \"X-Tenant-ID\""
    echo "     storagePrefix: \"vf:tenant:\""
    echo ""
    
    echo -e "${YELLOW}2. Problemas com autenticação OIDC${NC}"
    echo "   Solução: Verifique a configuração OIDC"
    echo "   Comando:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 15 oidc"
    echo ""
    echo "   Exemplo de configuração OIDC:"
    echo "   auth:"
    echo "     oidc_enabled: true"
    echo "     oidc_issuer_url: \"https://your-oidc-provider.com\""
    echo "     oidc_client_id: \"your-client-id\""
    echo "     oidc_redirect_uri: \"https://your-app/auth/callback\""
    echo ""
    
    echo -e "${YELLOW}3. Problemas com billing / quotas${NC}"
    echo "   Solução: Verifique a configuração de billing"
    echo "   Comando:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 10 billing"
    echo ""
    echo "   Exemplo de configuração de billing:"
    echo "   billing:"
    echo "     enabled: true"
    echo "     provider: \"stripe\""
    echo "     apiKey: \"your-api-key\""
    echo ""
    
    echo -e "${YELLOW}4. Problemas de orquestração Kubernetes${NC}"
    echo "   Solução: Verifique a configuração de orquestração"
    echo "   Comando:"
    echo "   cat /etc/veloflux/config.yaml | grep -A 15 orchestration"
    echo ""
    echo "   Exemplo de configuração de orquestração:"
    echo "   orchestration:"
    echo "     enabled: true"
    echo "     inCluster: true"
    echo "     namespace: \"veloflux-tenants\""
    echo "     helmReleaseName: \"veloflux\""
    echo ""
    
    echo -e "${YELLOW}5. Testar um tenant específico${NC}"
    echo "   Solução: Envie uma requisição com o header de tenant"
    echo "   Comando:"
    echo "   curl -H \"X-Tenant-ID: tenant1\" http://localhost"
    echo ""
    
    pause
}

# Solução para logs e diagnóstico
fix_logs() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}        LOGS E DIAGNÓSTICOS                         ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Opções de logs e diagnósticos:"
    echo ""
    
    echo -e "${YELLOW}1. Ver logs do serviço VeloFlux${NC}"
    echo "   Comando:"
    echo "   sudo journalctl -fu veloflux"
    echo ""
    
    echo -e "${YELLOW}2. Ver logs do Nginx${NC}"
    echo "   Comando:"
    echo "   sudo tail -f /var/log/nginx/error.log"
    echo "   sudo tail -f /var/log/nginx/access.log"
    echo ""
    
    echo -e "${YELLOW}3. Ver logs do Redis${NC}"
    echo "   Comando:"
    echo "   sudo journalctl -fu redis-server"
    echo ""
    
    echo -e "${YELLOW}4. Ver logs do Docker${NC}"
    echo "   Comando:"
    echo "   sudo docker logs veloflux-lb"
    echo ""
    echo "   Para logs contínuos:"
    echo "   sudo docker logs -f veloflux-lb"
    echo ""
    
    echo -e "${YELLOW}5. Verificar status dos serviços${NC}"
    echo "   Comando:"
    echo "   sudo systemctl status veloflux nginx redis-server docker"
    echo ""
    
    echo -e "${YELLOW}6. Verificar portas em uso${NC}"
    echo "   Comando:"
    echo "   sudo ss -tunlp | grep -E ':(80|443|6379|8080|9000)'"
    echo ""
    
    echo -e "${YELLOW}7. Verificar uso de recursos${NC}"
    echo "   Comando:"
    echo "   top -c"
    echo "   htop  # Se instalado"
    echo "   free -h"
    echo "   df -h"
    echo ""
    
    pause
}

# Executa uma verificação rápida do sistema
quick_check() {
    clear
    echo -e "${BLUE}====================================================${NC}"
    echo -e "${BLUE}        VERIFICAÇÃO RÁPIDA DO SISTEMA               ${NC}"
    echo -e "${BLUE}====================================================${NC}"
    echo ""
    
    echo "Executando verificação rápida do sistema..."
    echo ""
    
    # Verificar serviços
    echo -e "${YELLOW}Verificando serviços...${NC}"
    
    echo -n "Serviço Docker: "
    if systemctl is-active --quiet docker; then
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
    
    echo ""
    
    # Verificar portas
    echo -e "${YELLOW}Verificando portas...${NC}"
    
    for port in 80 443 8080 9000 6379; do
        echo -n "Porta $port: "
        if ss -tuln | grep -q ":$port "; then
            echo -e "${GREEN}ABERTA${NC}"
        else
            echo -e "${RED}FECHADA${NC}"
        fi
    done
    
    echo ""
    
    # Verificar diretórios
    echo -e "${YELLOW}Verificando diretórios...${NC}"
    
    for dir in "/opt/veloflux" "/etc/veloflux" "/var/log/veloflux"; do
        echo -n "Diretório $dir: "
        if [ -d "$dir" ]; then
            echo -e "${GREEN}EXISTE${NC}"
        else
            echo -e "${RED}NÃO EXISTE${NC}"
        fi
    done
    
    echo ""
    
    # Verificar conectividade
    echo -e "${YELLOW}Verificando conectividade...${NC}"
    
    echo -n "HTTP (porta 80): "
    if curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost/ | grep -qE '^[23]'; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHA${NC}"
    fi
    
    echo -n "Métricas (porta 8080): "
    if curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost:8080/ | grep -qE '^[23]'; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHA${NC}"
    fi
    
    echo -n "Admin API (porta 9000): "
    if curl -s --max-time 2 -o /dev/null -w "%{http_code}" http://localhost:9000/ | grep -qE '^[23]'; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHA${NC}"
    fi
    
    echo ""
    
    # Verificar conexão com Redis
    echo -e "${YELLOW}Verificando conexão com Redis...${NC}"
    
    echo -n "Conectividade com Redis: "
    if command -v redis-cli &> /dev/null && redis-cli ping &> /dev/null; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}FALHA${NC}"
    fi
    
    echo ""
    
    echo -e "${YELLOW}Resultado da verificação rápida:${NC}"
    echo "Se algum item acima estiver marcado como INATIVO, FECHADO, NÃO EXISTE ou FALHA,"
    echo "volte ao menu principal e escolha a opção correspondente ao problema para solucioná-lo."
    echo ""
    
    pause
}

# Main loop
main() {
    while true; do
        show_menu
        read -r choice
        
        case $choice in
            1) fix_installation ;;
            2) fix_startup ;;
            3) fix_redis ;;
            4) fix_ssl ;;
            5) fix_docker ;;
            6) fix_routing ;;
            7) fix_saas ;;
            8) fix_logs ;;
            9) quick_check ;;
            0) 
                echo -e "${GREEN}Saindo do solucionador de problemas. Boa sorte com o VeloFlux!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Opção inválida. Tente novamente.${NC}"
                pause
                ;;
        esac
    done
}

# Executamos o script
main
