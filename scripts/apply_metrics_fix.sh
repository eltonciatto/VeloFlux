#!/bin/bash

# Script para aplicar as correções de métricas do Prometheus no VeloFlux
# Este script modifica os arquivos necessários para implementar a instrumentação
# de métricas do Prometheus no VeloFlux

# Configurações
LOG_FILE="/tmp/veloflux_metrics_apply_fix_$(date +%Y%m%d_%H%M%S).log"
BACKUP_DIR="/tmp/veloflux_backup_$(date +%Y%m%d_%H%M%S)"
VERBOSE=true

# Função para logs
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="\033[0;34m[INFO]\033[0m   " ;;
        "ERROR") prefix="\033[0;31m[ERRO]\033[0m   " ;;
        "WARN")  prefix="\033[0;33m[AVISO]\033[0m  " ;;
        "OK")    prefix="\033[0;32m[OK]\033[0m     " ;;
        "DEBUG") prefix="\033[0;36m[DEBUG]\033[0m  " ;;
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

# Função para fazer backup de um arquivo
backup_file() {
    local file="$1"
    mkdir -p "$BACKUP_DIR"
    
    if [ -f "$file" ]; then
        cp "$file" "${BACKUP_DIR}/$(basename "$file").bak"
        log "INFO" "Backup de $file criado em ${BACKUP_DIR}/$(basename "$file").bak"
    else
        log "WARN" "Arquivo $file não encontrado, não foi possível criar backup"
    fi
}

log "INFO" "Iniciando aplicação das correções de métricas do Prometheus"
log "INFO" "Logs serão salvos em: ${LOG_FILE}"

# Verificar se os arquivos necessários existem
ROUTER_FILE="/workspaces/VeloFlux/internal/router/router.go"
HEALTH_FILE="/workspaces/VeloFlux/internal/health/checker.go"
METRICS_FILE="/workspaces/VeloFlux/internal/metrics/metrics.go"
METRICS_MIDDLEWARE_FILE="/workspaces/VeloFlux/internal/metrics/middleware.go"

for file in "$ROUTER_FILE" "$HEALTH_FILE" "$METRICS_FILE"; do
    if [ ! -f "$file" ]; then
        log "ERROR" "Arquivo $file não encontrado"
        exit 1
    fi
done

# Fazer backup dos arquivos que serão modificados
log "INFO" "Criando backups dos arquivos que serão modificados..."
backup_file "$ROUTER_FILE"
backup_file "$HEALTH_FILE"

# Verificar se o arquivo middleware.go já existe
if [ ! -f "$METRICS_MIDDLEWARE_FILE" ]; then
    log "WARN" "Arquivo $METRICS_MIDDLEWARE_FILE não encontrado"
    log "INFO" "Um novo arquivo será criado"
else
    backup_file "$METRICS_MIDDLEWARE_FILE"
fi

log "INFO" "Aplicando correções..."

# 1. Modificar o arquivo router.go para usar o middleware de métricas
log "INFO" "Modificando o router.go para usar o middleware de métricas..."

# Verificar se a importação do pacote metrics já existe
if ! grep -q "\"github.com/eltonciatto/veloflux/internal/metrics\"" "$ROUTER_FILE"; then
    # Adicionar a importação se ela não existir
    TMP_FILE=$(mktemp)
    awk '
    /^import \(/ {
        print $0
        while(getline line && line != ")") {
            print line
        }
        print "\t\"github.com/eltonciatto/veloflux/internal/metrics\""
        print ")"
        next
    }
    { print }
    ' "$ROUTER_FILE" > "$TMP_FILE"
    
    mv "$TMP_FILE" "$ROUTER_FILE"
    log "OK" "Adicionada importação do pacote metrics ao router.go"
fi

# Modificar o método createProxyHandler para usar o middleware de métricas
# Primeiro vamos verificar se já não foi modificado
if ! grep -q "metrics.UpdateActiveConnections" "$ROUTER_FILE"; then
    TMP_FILE=$(mktemp)
    
    # Usar sed para substituir o código
    sed '/func (r \*Router) createProxyHandler(poolName string) http.Handler {/,/return http.HandlerFunc(func(w http.ResponseWriter, req \*http.Request) {/c\
func (r *Router) createProxyHandler(poolName string) http.Handler {\
    handler := http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {\
        start := time.Now()\
        clientIP := r.getClientIP(req)\
        sessionID := r.getSessionID(req)\
' "$ROUTER_FILE" > "$TMP_FILE"
    
    # Modificar a parte onde incrementa/decrementa as conexões
    sed -i '/r.balancer.IncrementConnections(poolName, backend.Address)/,/r.balancer.DecrementConnections(poolName, backend.Address)/c\
        // Incrementar contador de conexões\
        r.balancer.IncrementConnections(poolName, backend.Address)\
        defer r.balancer.DecrementConnections(poolName, backend.Address)\
        \
        // Atualizar métricas de conexões ativas\
        metrics.UpdateActiveConnections(backend.Address, true)\
        defer metrics.UpdateActiveConnections(backend.Address, false)\
        \
        // Atualizar métrica de saúde do backend\
        metrics.UpdateBackendHealth(poolName, backend.Address, true)\
' "$TMP_FILE"
    
    mv "$TMP_FILE" "$ROUTER_FILE"
    log "OK" "Modificado o método createProxyHandler para usar as métricas"
fi

# 2. Aplicar o middleware de métricas ao router
if ! grep -q "metrics.MetricsMiddleware" "$ROUTER_FILE"; then
    TMP_FILE=$(mktemp)
    
    # Adicionar o wrapper do middleware antes do proxy.ServeHTTP
    sed -i '/proxy.ServeHTTP(w, req)/c\
        // Wrapper para capturar métricas\
        metricsHandler := metrics.MetricsMiddleware(proxy, poolName)\
        metricsHandler.ServeHTTP(w, req)\
' "$ROUTER_FILE"
    
    log "OK" "Adicionado middleware de métricas ao router"
fi

# 3. Modificar o arquivo health.go para atualizar as métricas de saúde
log "INFO" "Modificando health.go para atualizar métricas de saúde de backends..."

# Verificar se a importação do pacote metrics já existe
if ! grep -q "\"github.com/eltonciatto/veloflux/internal/metrics\"" "$HEALTH_FILE"; then
    # Adicionar a importação se ela não existir
    TMP_FILE=$(mktemp)
    awk '
    /^import \(/ {
        print $0
        while(getline line && line != ")") {
            print line
        }
        print "\t\"github.com/eltonciatto/veloflux/internal/metrics\""
        print ")"
        next
    }
    { print }
    ' "$HEALTH_FILE" > "$TMP_FILE"
    
    mv "$TMP_FILE" "$HEALTH_FILE"
    log "OK" "Adicionada importação do pacote metrics ao health.go"
fi

# Adicionar atualização de métricas no método check
if ! grep -q "metrics.UpdateBackendHealth" "$HEALTH_FILE"; then
    TMP_FILE=$(mktemp)
    
    # Usar sed para adicionar a atualização de métricas após a verificação de saúde
    sed -i '/backend.Healthy = isHealthy/a\
\t\t// Atualizar métrica de saúde do backend\
\t\tmetrics.UpdateBackendHealth(pool.Name, backend.Address, isHealthy)\
' "$HEALTH_FILE"
    
    log "OK" "Adicionada atualização de métricas de saúde ao health.go"
fi

log "OK" "Correções aplicadas com sucesso!"
log "INFO" "Backups foram criados em: ${BACKUP_DIR}"
log "INFO" "Para testar as alterações, reinicie o VeloFlux e execute o script: scripts/test_prometheus_metrics_detailed.sh"

# Reiniciar o VeloFlux para aplicar as alterações
log "INFO" "Recompilando e reiniciando o VeloFlux para aplicar as alterações..."

# Recompilar
log "INFO" "Recompilando o VeloFlux..."
go build -o velofluxlb ./cmd/velofluxlb
if [ $? -ne 0 ]; then
    log "ERROR" "Falha ao recompilar o VeloFlux"
    exit 1
else
    log "OK" "VeloFlux recompilado com sucesso"
fi

# Reiniciar via Docker Compose
log "INFO" "Reiniciando o serviço VeloFlux..."
docker-compose down veloflux-lb
docker-compose up -d veloflux-lb

# Aguardar reinicialização
sleep 5

# Verificar status
log "INFO" "Verificando status do serviço..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:80/; then
    log "OK" "VeloFlux reiniciado com sucesso na porta 80"
else
    log "WARN" "VeloFlux pode não estar funcionando corretamente na porta 80"
fi

# Verificar métricas
log "INFO" "Verificando endpoint de métricas..."
if curl -s http://localhost:8080/metrics | grep -q "veloflux_"; then
    log "OK" "As métricas do VeloFlux estão disponíveis"
else
    log "WARN" "As métricas personalizadas do VeloFlux podem não estar sendo expostas"
fi

# Testando conexão com os domínios wildcard
log "INFO" "Testando conexão com domínios wildcard..."
for domain in "test.private.dev.veloflux.io" "test.public.dev.veloflux.io"; do
    status=$(curl -s -H "Host: $domain" -o /dev/null -w "%{http_code}" http://localhost:80/)
    log "INFO" "Domínio $domain: status $status"
done

log "INFO" "Aplicação das correções concluída."
