#!/bin/bash

# VeloFlux - Script de Diagnóstico de Implementação
# Este script ajuda a identificar problemas comuns na implementação do VeloFlux

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
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

check_directory() {
    local dir=$1
    local description=$2
    
    echo -n "Verificando diretório $dir ($description): "
    if [ -d "$dir" ]; then
        echo -e "${GREEN}OK${NC}"
        ls -la "$dir" | head -n 5
    else
        echo -e "${RED}NÃO ENCONTRADO${NC}"
        error "O diretório $dir não existe"
        echo ""
        echo "Para criar o diretório, execute:"
        echo "  sudo mkdir -p $dir"
        if [ -n "$3" ]; then
            echo "  sudo chown $3:$3 $dir"
        fi
    fi
    echo ""
}

check_file() {
    local file=$1
    local description=$2
    
    echo -n "Verificando arquivo $file ($description): "
    if [ -f "$file" ]; then
        echo -e "${GREEN}OK${NC}"
    else
        echo -e "${RED}NÃO ENCONTRADO${NC}"
        error "O arquivo $file não existe"
        echo ""
        if [ -n "$3" ]; then
            echo "Este arquivo deve ser copiado de:"
            echo "  $3"
        fi
    fi
    echo ""
}

check_port() {
    local port=$1
    local description=$2
    
    echo -n "Verificando porta $port ($description): "
    if command -v ss &> /dev/null; then
        if ss -tuln | grep -q ":$port "; then
            echo -e "${GREEN}ATIVA${NC}"
            ss -tuln | grep ":$port "
        else
            echo -e "${RED}INATIVA${NC}"
            error "A porta $port não está em uso"
        fi
    elif command -v netstat &> /dev/null; then
        if netstat -tuln | grep -q ":$port "; then
            echo -e "${GREEN}ATIVA${NC}"
            netstat -tuln | grep ":$port "
        else
            echo -e "${RED}INATIVA${NC}"
            error "A porta $port não está em uso"
        fi
    else
        echo -e "${YELLOW}NÃO VERIFICADO${NC}"
        warn "Comando ss ou netstat não encontrado"
    fi
    echo ""
}

check_service() {
    local service=$1
    local description=$2
    
    echo -n "Verificando serviço $service ($description): "
    if command -v systemctl &> /dev/null; then
        if systemctl is-active --quiet "$service"; then
            echo -e "${GREEN}ATIVO${NC}"
            systemctl status "$service" | head -n 3
        else
            echo -e "${RED}INATIVO${NC}"
            error "O serviço $service não está ativo"
            echo ""
            echo "Para verificar o status completo:"
            echo "  sudo systemctl status $service"
            echo ""
            echo "Para iniciar o serviço:"
            echo "  sudo systemctl start $service"
            echo ""
            echo "Para verificar logs:"
            echo "  sudo journalctl -u $service --no-pager -n 50"
        fi
    else
        echo -e "${YELLOW}NÃO VERIFICADO${NC}"
        warn "systemctl não encontrado"
    fi
    echo ""
}

check_docker() {
    echo -n "Verificando Docker: "
    if command -v docker &> /dev/null; then
        echo -e "${GREEN}INSTALADO${NC}"
        docker --version
        
        echo -n "Verificando Docker Compose: "
        if command -v docker-compose &> /dev/null; then
            echo -e "${GREEN}INSTALADO${NC}"
            docker-compose --version
        elif command -v docker compose &> /dev/null; then
            echo -e "${GREEN}INSTALADO (plugin)${NC}"
            docker compose version
        else
            echo -e "${RED}NÃO ENCONTRADO${NC}"
            error "Docker Compose não está instalado"
        fi
        
        echo -e "\nContainers em execução:"
        docker ps
    else
        echo -e "${RED}NÃO INSTALADO${NC}"
        error "Docker não está instalado"
        echo ""
        echo "Para instalar o Docker:"
        echo "  curl -fsSL https://get.docker.com | sh"
    fi
    echo ""
}

check_config() {
    local config_file=$1
    
    echo "Verificando arquivo de configuração $config_file:"
    if [ -f "$config_file" ]; then
        echo -e "${GREEN}ARQUIVO ENCONTRADO${NC}"
        
        if grep -q "bind_address" "$config_file"; then
            bind_address=$(grep "bind_address" "$config_file" | head -n 1 | cut -d ':' -f 2- | tr -d ' "')
            echo -e "Endereço de bind: ${GREEN}$bind_address${NC}"
        else
            echo -e "${RED}Endereço de bind não encontrado${NC}"
        fi
        
        if grep -q "tls:" -A 5 "$config_file"; then
            echo -e "${BLUE}Configuração TLS:${NC}"
            grep -A 5 "tls:" "$config_file"
        else
            echo -e "${YELLOW}Configuração TLS não encontrada${NC}"
        fi
        
        if grep -q "jwt_secret" "$config_file"; then
            jwt_default=$(grep "jwt_secret" "$config_file" | grep -q "your-super-secret" || echo "no")
            if [ "$jwt_default" == "no" ]; then
                echo -e "JWT Secret: ${GREEN}Personalizado${NC}"
            else
                echo -e "JWT Secret: ${RED}Valor padrão (inseguro)${NC}"
                warn "O JWT Secret ainda usa o valor padrão!"
            fi
        fi
    else
        echo -e "${RED}ARQUIVO NÃO ENCONTRADO${NC}"
        error "O arquivo de configuração $config_file não existe"
    fi
    echo ""
}

check_nginx() {
    echo "Verificando configuração do Nginx:"
    if command -v nginx &> /dev/null; then
        echo -e "${GREEN}Nginx instalado${NC}"
        nginx -v
        
        if nginx -t &> /dev/null; then
            echo -e "${GREEN}Configuração válida${NC}"
        else
            echo -e "${RED}Erro na configuração${NC}"
            nginx -t
        fi
        
        if [ -f "/etc/nginx/sites-enabled/veloflux" ]; then
            echo -e "${GREEN}Site do VeloFlux configurado${NC}"
        elif [ -f "/etc/nginx/conf.d/veloflux.conf" ]; then
            echo -e "${GREEN}Site do VeloFlux configurado${NC}"
        else
            echo -e "${YELLOW}Site do VeloFlux não encontrado em locais padrão${NC}"
        fi
    else
        echo -e "${RED}Nginx não instalado${NC}"
    fi
    echo ""
}

check_certificates() {
    local cert_dir="/etc/ssl/certs/veloflux"
    
    echo "Verificando certificados SSL:"
    if [ -d "$cert_dir" ]; then
        echo -e "${GREEN}Diretório de certificados encontrado${NC}"
        ls -la "$cert_dir"
        
        cert_files=$(find "$cert_dir" -name "*.crt" 2>/dev/null | wc -l)
        key_files=$(find "$cert_dir" -name "*.key" 2>/dev/null | wc -l)
        
        if [ "$cert_files" -gt 0 ] && [ "$key_files" -gt 0 ]; then
            echo -e "${GREEN}Certificados e chaves encontrados${NC}"
            find "$cert_dir" -name "*.crt" | head -n 3
        else
            echo -e "${YELLOW}Certificados ou chaves não encontrados${NC}"
        fi
    else
        echo -e "${RED}Diretório de certificados não encontrado${NC}"
    fi
    echo ""
}

check_connectivity() {
    echo "Verificando conectividade interna:"
    
    echo -n "Teste de health check local: "
    if curl -s -o /dev/null -w "%{http_code}" http://localhost/health 2>/dev/null | grep -q "200"; then
        echo -e "${GREEN}OK (200)${NC}"
    else
        echo -e "${RED}FALHA$(curl -s -o /dev/null -w " (%{http_code})" http://localhost/health 2>/dev/null || echo " (erro de conexão)")${NC}"
        warn "O health check na porta 80 falhou"
        
        echo -n "Tentando na porta 8080: "
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health 2>/dev/null | grep -q "200"; then
            echo -e "${GREEN}OK (200)${NC}"
        else
            echo -e "${RED}FALHA$(curl -s -o /dev/null -w " (%{http_code})" http://localhost:8080/health 2>/dev/null || echo " (erro de conexão)")${NC}"
        fi
    fi
    
    echo -n "Redis acessível: "
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping 2>/dev/null | grep -q "PONG"; then
            echo -e "${GREEN}SIM${NC}"
        else
            echo -e "${RED}NÃO${NC}"
            warn "Redis não está respondendo"
        fi
    else
        echo -e "${YELLOW}NÃO VERIFICADO${NC}"
        warn "redis-cli não encontrado"
    fi
    
    echo ""
}

check_logs() {
    local log_dir="/var/log/veloflux"
    
    echo "Verificando logs do VeloFlux:"
    if [ -d "$log_dir" ]; then
        echo -e "${GREEN}Diretório de logs encontrado${NC}"
        ls -la "$log_dir"
        
        for log_file in "$log_dir"/*.log; do
            if [ -f "$log_file" ]; then
                echo ""
                echo "Últimas 5 linhas de $(basename "$log_file"):"
                tail -n 5 "$log_file"
            fi
        done
    else
        echo -e "${RED}Diretório de logs não encontrado${NC}"
        
        echo "Verificando logs via journalctl:"
        if command -v journalctl &> /dev/null; then
            echo "Logs do serviço veloflux:"
            journalctl -u veloflux --no-pager -n 10
        else
            echo -e "${YELLOW}journalctl não encontrado${NC}"
        fi
    fi
    echo ""
}

# Cabeçalho do diagnóstico
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}    DIAGNÓSTICO DE IMPLEMENTAÇÃO DO VELOFLUX        ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""

# Verificações do sistema
log "Informações do sistema:"
echo "Sistema operacional: $(uname -s)"
echo "Versão do kernel: $(uname -r)"
if [ -f /etc/os-release ]; then
    . /etc/os-release
    echo "Distribuição: $NAME $VERSION_ID"
fi
echo "Hostname: $(hostname)"
echo "Arquitetura: $(uname -m)"
echo ""

# Verificação de requisitos básicos
log "Verificando requisitos básicos..."
echo "RAM total: $(free -h | awk '/^Mem:/ {print $2}')"
echo "Espaço em disco (raiz): $(df -h / | awk 'NR==2 {print $4}')"
echo ""

# Verificação de diretórios
log "Verificando diretórios..."
check_directory "/opt/veloflux" "diretório de instalação"
check_directory "/etc/veloflux" "diretório de configuração"
check_directory "/var/log/veloflux" "diretório de logs" "veloflux"
check_directory "/etc/ssl/certs/veloflux" "diretório de certificados" "veloflux"

# Verificação de arquivos
log "Verificando arquivos de configuração..."
check_file "/etc/veloflux/config.yaml" "arquivo de configuração principal" "/workspaces/VeloFlux/config/config.yaml"
check_file "/etc/systemd/system/veloflux.service" "arquivo de serviço systemd"

# Verificação de serviços
log "Verificando serviços..."
check_service "veloflux" "serviço principal"
check_service "nginx" "proxy reverso"
check_service "docker" "container runtime"
check_service "redis-server" "sistema de cache" 

# Verificação do Docker
log "Verificando Docker..."
check_docker

# Verificação de configuração
log "Verificando configuração..."
check_config "/etc/veloflux/config.yaml"

# Verificação do Nginx
log "Verificando Nginx..."
check_nginx

# Verificação de certificados
log "Verificando certificados SSL..."
check_certificates

# Verificação de portas
log "Verificando portas..."
check_port 80 "HTTP"
check_port 443 "HTTPS"
check_port 8080 "métricas"
check_port 9000 "API de administração"
check_port 6379 "Redis"

# Verificação de conectividade
log "Verificando conectividade..."
check_connectivity

# Verificação de logs
log "Verificando logs..."
check_logs

# Resumo
echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}              RESUMO DO DIAGNÓSTICO                  ${NC}"
echo -e "${BLUE}====================================================${NC}"
echo ""
echo "Este diagnóstico pode ajudar a identificar problemas na implementação."
echo "Por favor, verifique os itens marcados em vermelho ou amarelo acima."
echo ""
echo "RECOMENDAÇÕES:"
echo ""
echo "1. Se for sua primeira instalação, execute o script de instalação completo:"
echo "   sudo bash install.sh"
echo ""
echo "2. Para ambientes Docker, verifique se o arquivo docker-compose.yml está correto:"
echo "   docker-compose -f docker-compose.yml config"
echo ""
echo "3. Para problemas de certificados SSL:"
echo "   sudo /opt/veloflux/scripts/renew-certificates.sh"
echo ""
echo "4. Para reiniciar todos os serviços:"
echo "   sudo systemctl restart veloflux nginx redis-server"
echo ""
echo "5. Para verificar logs completos:"
echo "   sudo journalctl -fu veloflux"
echo ""

# Finalização
echo -e "${GREEN}Diagnóstico concluído!${NC}"
