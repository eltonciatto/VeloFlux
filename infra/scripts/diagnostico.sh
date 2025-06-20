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
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/api/health 2>/dev/null | grep -q "200"; then
            echo -e "${GREEN}OK (200)${NC}"
        else
            echo -e "${RED}FALHA$(curl -s -o /dev/null -w " (%{http_code})" http://localhost:8080/api/health 2>/dev/null || echo " (erro de conexão)")${NC}"
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

# Verifica o ambiente de teste
check_test_env() {
    log "Verificando ambiente de teste VeloFlux..."
    
    TEST_DIR="/tmp/veloflux-test"
    
    if [ ! -d "$TEST_DIR" ]; then
        warn "Diretório de teste não encontrado em $TEST_DIR"
        return 1
    fi
    
    info "Diretório de teste encontrado em $TEST_DIR"
    
    # Verifica se os containers de teste estão rodando
    if docker ps | grep "veloflux-test" &> /dev/null; then
        info "Containers de teste estão rodando"
        
        # Verifica portas em uso
        log "Verificando portas em uso..."
        
        PORTS_IN_USE=$(netstat -tulpn 2>/dev/null | grep LISTEN || ss -tulpn | grep LISTEN)
        
        echo "$PORTS_IN_USE" | grep -q ":8080" && warn "Porta 8080 já está em uso no host"
        echo "$PORTS_IN_USE" | grep -q ":8081" && warn "Porta 8081 já está em uso no host"
        echo "$PORTS_IN_USE" | grep -q ":9080" && warn "Porta 9080 já está em uso no host"
        echo "$PORTS_IN_USE" | grep -q ":9090" && warn "Porta 9090 já está em uso no host"
        
        # Verifica conectividade entre serviços
        log "Verificando conectividade entre serviços..."
        
        # Instala curl no container se não estiver presente
        docker exec veloflux-test-veloflux-lb-1 which curl &>/dev/null || {
            log "Instalando curl no container veloflux-lb..."
            docker exec veloflux-test-veloflux-lb-1 apk add --no-cache curl &>/dev/null
        }
        
        # Instala netcat para verificação de conectividade
        docker exec veloflux-test-veloflux-lb-1 which nc &>/dev/null || {
            log "Instalando netcat no container veloflux-lb..."
            docker exec veloflux-test-veloflux-lb-1 apk add --no-cache netcat-openbsd &>/dev/null
        }
        
        if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-1 &>/dev/null; then
            info "VeloFlux pode acessar backend-1"
        else
            error "VeloFlux não consegue acessar backend-1"
        fi
        
        if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-2 &>/dev/null; then
            info "VeloFlux pode acessar backend-2"
        else
            error "VeloFlux não consegue acessar backend-2"
        fi
        
        if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-1/health &>/dev/null; then
            info "Health check do backend-1 está funcionando"
        else
            error "Health check do backend-1 não está funcionando"
        fi
        
        if docker exec veloflux-test-veloflux-lb-1 curl -s http://backend-2/health &>/dev/null; then
            info "Health check do backend-2 está funcionando"
        else
            error "Health check do backend-2 não está funcionando"
        fi
        
        # Verifica Redis
        if docker exec veloflux-test-veloflux-lb-1 nc -zv redis 6379 &>/dev/null; then
            info "VeloFlux pode conectar-se ao Redis"
        else
            error "VeloFlux não consegue conectar-se ao Redis"
            
            # Verifica configuração Redis no config.yaml
            if grep -q "redis_address: \"redis:6379\"" "$TEST_DIR/config/config.yaml"; then
                info "Configuração do Redis parece correta no config.yaml (redis:6379)"
            else
                warn "Configuração Redis pode estar incorreta no config.yaml"
                log "Conteúdo atual da configuração Redis:"
                grep -A 5 "cluster:" "$TEST_DIR/config/config.yaml" || echo "Configuração cluster não encontrada"
            fi
        fi
        
        # Verifica portas dentro do container
        log "Verificando portas em uso dentro do container VeloFlux..."
        docker exec veloflux-test-veloflux-lb-1 netstat -tulpn 2>/dev/null || 
        docker exec veloflux-test-veloflux-lb-1 ss -tulpn
        
    else
        warn "Nenhum container de teste encontrado"
    fi
    
    # Verifica configuração do teste
    log "Verificando arquivos de configuração de teste..."
    if [ -f "$TEST_DIR/docker-compose.test.yml" ]; then
        info "Arquivo docker-compose.test.yml encontrado"
        log "Configuração de portas no docker-compose.test.yml:"
        grep -A 4 "ports:" "$TEST_DIR/docker-compose.test.yml"
    else
        error "Arquivo docker-compose.test.yml não encontrado"
    fi
    
    if [ -f "$TEST_DIR/config/config.yaml" ]; then
        info "Arquivo config.yaml encontrado"
    else
        error "Arquivo config.yaml não encontrado"
    fi
    
    return 0
}

# Diagnostico de ambiente de teste
diagnose_test_environment() {
    log "Iniciando diagnóstico do ambiente de teste do VeloFlux..."
    
    # Check if test environment exists
    if [ ! -d "/tmp/veloflux-test" ]; then
        error "Diretório de teste não encontrado. Execute o script de teste primeiro."
        return 1
    fi
    
    # Check container status
    log "Verificando status dos containers..."
    
    containers=("veloflux-test-redis-1" "veloflux-test-backend-1-1" "veloflux-test-backend-2-1" "veloflux-test-veloflux-lb-1")
    
    for container in "${containers[@]}"; do
        if docker ps -q -f name=${container} | grep -q .; then
            echo -e "  ✅ ${GREEN}${container} está rodando${NC}"
        else
            echo -e "  ❌ ${RED}${container} não está rodando${NC}"
        fi
    done
    
    # Check Redis configuration
    log "Verificando configuração do Redis..."
    
    config_file="/tmp/veloflux-test/config/config.yaml"
    
    if grep -q "redis_address: \"redis:6379\"" "$config_file"; then
        echo -e "  ✅ ${GREEN}Endereço do Redis está configurado corretamente${NC}"
    else
        echo -e "  ❌ ${RED}Endereço do Redis não está configurado corretamente${NC}"
        
        log "Atualizando configuração do Redis..."
        # Ensure the cluster section exists and redis_address is set correctly
        if grep -q "cluster:" "$config_file"; then
            sed -i 's/redis_address: .*/redis_address: "redis:6379"/' "$config_file"
        else
            echo -e "\n# Redis configuration for container environment\ncluster:\n  enabled: true\n  redis_address: \"redis:6379\"\n  redis_password: \"\"\n  redis_db: 0" >> "$config_file"
        fi
        
        echo -e "  ✅ ${GREEN}Configuração do Redis atualizada${NC}"
    fi
    
    # Install curl in the container if not already installed
    if ! docker exec veloflux-test-veloflux-lb-1 which curl > /dev/null 2>&1; then
        log "Instalando curl no container..."
        docker exec veloflux-test-veloflux-lb-1 apk add --no-cache curl > /dev/null
    fi
    
    # Check network connectivity between containers
    log "Verificando conectividade entre containers..."
    
    if docker exec veloflux-test-veloflux-lb-1 curl -s backend-1 > /dev/null; then
        echo -e "  ✅ ${GREEN}Conexão com backend-1 bem-sucedida${NC}"
    else
        echo -e "  ❌ ${RED}Não foi possível conectar ao backend-1${NC}"
    fi
    
    if docker exec veloflux-test-veloflux-lb-1 curl -s backend-2 > /dev/null; then
        echo -e "  ✅ ${GREEN}Conexão com backend-2 bem-sucedida${NC}"
    else
        echo -e "  ❌ ${RED}Não foi possível conectar ao backend-2${NC}"
    fi
    
    if docker exec veloflux-test-veloflux-lb-1 ping -c 1 redis > /dev/null 2>&1; then
        echo -e "  ✅ ${GREEN}Conexão com Redis bem-sucedida${NC}"
    else
        echo -e "  ❌ ${RED}Não foi possível conectar ao Redis${NC}"
    fi
    
    # Check health endpoints
    log "Verificando endpoints de health check..."
    
    if docker exec veloflux-test-veloflux-lb-1 curl -s backend-1/health | grep -q "OK"; then
        echo -e "  ✅ ${GREEN}Health check do backend-1 bem-sucedido${NC}"
    else
        echo -e "  ❌ ${RED}Health check do backend-1 falhou${NC}"
    fi
    
    if docker exec veloflux-test-veloflux-lb-1 curl -s backend-2/health | grep -q "OK"; then
        echo -e "  ✅ ${GREEN}Health check do backend-2 bem-sucedido${NC}"
    else
        echo -e "  ❌ ${RED}Health check do backend-2 falhou${NC}"
    fi
    
    # Check port bindings
    log "Verificando mapeamentos de portas..."
    
    # Check if there are port bindings in the container
    if docker exec veloflux-test-veloflux-lb-1 netstat -tulpn 2>/dev/null | grep -q ":80"; then
        echo -e "  ✅ ${GREEN}Porta 80 está sendo usada dentro do container${NC}"
        
        # Show which process is using it
        process=$(docker exec veloflux-test-veloflux-lb-1 netstat -tulpn 2>/dev/null | grep ":80")
        echo -e "  ${BLUE}Processo usando a porta 80:${NC} $process"
    else
        echo -e "  ❓ ${YELLOW}Porta 80 não está sendo usada dentro do container${NC}"
    fi
    
    # Check external port bindings
    if docker port veloflux-test-veloflux-lb-1 | grep -q "80/tcp -> 0.0.0.0:8081"; then
        echo -e "  ✅ ${GREEN}Porta 80 do container está corretamente mapeada para 8081 no host${NC}"
    else
        echo -e "  ❌ ${RED}Porta 80 do container não está mapeada corretamente para o host${NC}"
        
        # Show current port mappings
        echo -e "  ${BLUE}Mapeamentos de portas atuais:${NC}"
        docker port veloflux-test-veloflux-lb-1
    fi
    
    # Check log files for issues
    log "Analisando logs do VeloFlux..."
    
    # Get recent logs
    logs=$(docker logs veloflux-test-veloflux-lb-1 --tail 20)
    
    # Check for common errors
    if echo "$logs" | grep -q "connection refused"; then
        echo -e "  ❌ ${RED}Erro de conexão detectado nos logs${NC}"
        echo -e "  ${BLUE}Detalhes:${NC} $(echo "$logs" | grep "connection refused" | head -1)"
    fi
    
    if echo "$logs" | grep -q "address already in use"; then
        echo -e "  ❌ ${RED}Erro de porta em uso detectado nos logs${NC}"
        echo -e "  ${BLUE}Detalhes:${NC} $(echo "$logs" | grep "address already in use" | head -1)"
        
        # Try to fix port conflict by modifying the configuration
        log "Tentando corrigir conflito de porta..."
        if grep -q "bind_address:" "$config_file"; then
            # Change the bind address to a different port like 8000
            sed -i 's/bind_address: "0.0.0.0:80"/bind_address: "0.0.0.0:8000"/' "$config_file"
            echo -e "  ✅ ${GREEN}Porta alterada para 8000 na configuração${NC}"
            
            # Restart the container
            log "Reiniciando o container com a nova configuração..."
            docker restart veloflux-test-veloflux-lb-1
            sleep 5
        fi
    fi
    
    # Test service after potential fixes
    sleep 2
    log "Testando o serviço VeloFlux..."
    
    # Test local port 8081
    status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "failed")
    if [[ "$status_code" =~ ^(200|301|302|307|308)$ ]]; then
        echo -e "  ✅ ${GREEN}VeloFlux está respondendo na porta 8081 (HTTP $status_code)${NC}"
        
        # Show response
        echo -e "  ${BLUE}Primeiras linhas da resposta:${NC}"
        curl -s http://localhost:8081 | head -5
        echo -e "  ..."
    else
        echo -e "  ❌ ${RED}VeloFlux não está respondendo na porta 8081 (Status: $status_code)${NC}"
        
        # Try alternative port if we changed it
        if grep -q "bind_address: \"0.0.0.0:8000\"" "$config_file"; then
            echo -e "  ${YELLOW}Tentando porta alternativa 8000...${NC}"
            status_code=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081 || echo "failed")
            if [[ "$status_code" =~ ^(200|301|302|307|308)$ ]]; then
                echo -e "  ✅ ${GREEN}VeloFlux está respondendo na porta 8081 -> 8000 (HTTP $status_code)${NC}"
            else
                echo -e "  ❌ ${RED}VeloFlux não está respondendo na porta 8081 -> 8000 (Status: $status_code)${NC}"
            fi
        fi
    fi
    
    log "Diagnóstico do ambiente de teste concluído!"
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

# Verifica o parâmetro de chamada
if [ "$1" == "--test-env" ]; then
    check_test_env
fi

# Diagnóstico de ambiente de teste
diagnose_test_environment

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
