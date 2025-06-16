#!/bin/bash

# VeloFlux Diagnostic Tool
# Este script realiza verificação completa da configuração de domínios e métricas

LOG_FILE="/tmp/veloflux_diagnostic_$(date +%Y%m%d_%H%M%S).log"

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No color

# Função de log
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}     " ;;
        "ERROR") prefix="${RED}[ERROR]${NC}    " ;;
        "WARN")  prefix="${YELLOW}[WARN]${NC}     " ;;
        "OK")    prefix="${GREEN}[OK]${NC}       " ;;
        "TEST")  prefix="${PURPLE}[TEST]${NC}     " ;;
        "DEBUG") prefix="${CYAN}[DEBUG]${NC}    " ;;
        *)       prefix="[LOG]      " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

log "INFO" "VeloFlux Diagnostic Tool"
log "INFO" "======================="
log "INFO" "Log salvo em: $LOG_FILE"

# 1. Verificar status do serviço
log "INFO" "Verificando status do serviço VeloFlux..."
PORTS=("80" "8082" "8080" "443")
PRIMARY_PORT=""

for port in "${PORTS[@]}"; do
    if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$port" 2>/dev/null; then
        if [ -z "$PRIMARY_PORT" ]; then
            PRIMARY_PORT="$port"
        fi
        log "OK" "Porta $port está aberta"
    else
        log "WARN" "Porta $port não está acessível"
    fi
done

if [ -z "$PRIMARY_PORT" ]; then
    log "ERROR" "Nenhuma porta principal detectada. O serviço VeloFlux está rodando?"
    PRIMARY_PORT="80" # Assume porta padrão para continuar diagnóstico
fi

log "INFO" "Usando porta principal: $PRIMARY_PORT"

# 2. Verificar configuração de domínios no config.yaml
log "INFO" "Analisando arquivo de configuração..."
if [ -f "/workspaces/VeloFlux/config/config.yaml" ]; then
    CONFIG_DOMAINS=$(grep -E "^\s*- host:" /workspaces/VeloFlux/config/config.yaml | sed -E 's/^\s*- host: "?([^"]*)"?/\1/g')
    WILDCARD_DOMAINS=$(echo "$CONFIG_DOMAINS" | grep -E "^\*\.")
    
    log "INFO" "Encontrados $(echo "$CONFIG_DOMAINS" | wc -l) domínios configurados"
    log "INFO" "Domínios wildcard encontrados:"
    if [ -n "$WILDCARD_DOMAINS" ]; then
        echo "$WILDCARD_DOMAINS" | while read -r domain; do
            log "OK" "  $domain"
        done
    else
        log "WARN" "  Nenhum domínio wildcard encontrado"
    fi
else
    log "ERROR" "Arquivo de configuração não encontrado"
fi

# 3. Testar domínios
log "INFO" "Testando resolução de domínios..."

# Teste de domínios wildcard privados
log "INFO" "Testando wildcards privados (*.private.dev.veloflux.io)..."
for subdomain in "test" "random" "app" "api" "admin" "tenant1" "tenant2"; do
    domain="${subdomain}.private.dev.veloflux.io"
    status=$(curl -s -H "Host: $domain" -o /dev/null -w "%{http_code}" http://localhost:${PRIMARY_PORT}/)
    if [[ $status =~ ^[23].. ]]; then
        log "OK" "  $domain: Status $status"
    elif [[ $status == "404" ]]; then
        log "OK" "  $domain: Status $status (Not Found - domínio resolvido mas caminho não encontrado)"
    else
        log "ERROR" "  $domain: Status $status (Falhou)"
    fi
done

# Teste de domínios wildcard públicos
log "INFO" "Testando wildcards públicos (*.public.dev.veloflux.io)..."
for subdomain in "test" "random" "app" "api" "tenant1" "tenant2"; do
    domain="${subdomain}.public.dev.veloflux.io"
    status=$(curl -s -H "Host: $domain" -o /dev/null -w "%{http_code}" http://localhost:${PRIMARY_PORT}/)
    if [[ $status =~ ^[23].. ]]; then
        log "OK" "  $domain: Status $status"
    elif [[ $status == "404" ]]; then
        log "OK" "  $domain: Status $status (Not Found - domínio resolvido mas caminho não encontrado)"
    else
        log "ERROR" "  $domain: Status $status (Falhou)"
    fi
done

# 4. Verificar métricas do Prometheus
log "INFO" "Verificando métricas do Prometheus..."
METRICS_PORT="8080"

if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$METRICS_PORT" 2>/dev/null; then
    METRICS=$(curl -s http://localhost:$METRICS_PORT/metrics)
    
    # Verificar métricas do Go
    if echo "$METRICS" | grep -q "go_"; then
        log "OK" "Métricas padrão do Go estão presentes"
    else
        log "ERROR" "Métricas padrão do Go não encontradas"
    fi
    
    # Verificar métricas do VeloFlux
    VELOFLUX_METRICS=("veloflux_requests_total" "veloflux_request_duration_seconds" "veloflux_active_connections")
    log "INFO" "Verificando métricas específicas do VeloFlux:"
    
    for metric in "${VELOFLUX_METRICS[@]}"; do
        if echo "$METRICS" | grep -q "$metric"; then
            log "OK" "  $metric: Presente"
        else
            log "WARN" "  $metric: Não encontrada"
        fi
    done
    
    # Verificar métricas por domínio/tenant
    log "INFO" "Verificando métricas por domínio/tenant..."
    if echo "$METRICS" | grep -q -E '(domain|host|tenant)="'; then
        log "OK" "Métricas por domínio/tenant estão presentes"
        echo "$METRICS" | grep -E '(domain|host|tenant)=' | head -n 5 | while read -r line; do
            log "DEBUG" "  $line"
        done
    else
        log "WARN" "Métricas por domínio/tenant não encontradas"
    fi
else
    log "ERROR" "Endpoint de métricas não acessível na porta $METRICS_PORT"
fi

# 5. Gerar tráfego para testar métricas
log "INFO" "Gerando tráfego para testar atualização de métricas..."
for domain in "tenant1.private.dev.veloflux.io" "tenant2.private.dev.veloflux.io" "api.private.dev.veloflux.io"; do
    for i in {1..10}; do
        curl -s -H "Host: $domain" -o /dev/null http://localhost:${PRIMARY_PORT}/
    done
    log "INFO" "  Gerado tráfego para $domain (10 requisições)"
done

# Esperar um momento para as métricas serem atualizadas
sleep 2

# Verificar novamente as métricas
if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$METRICS_PORT" 2>/dev/null; then
    METRICS_AFTER=$(curl -s http://localhost:$METRICS_PORT/metrics)
    log "INFO" "Verificando atualização de métricas após tráfego..."
    
    # Procurar por contadores de requisições
    REQUEST_COUNTERS=$(echo "$METRICS_AFTER" | grep -E 'veloflux_requests_total{.*}' || echo "")
    if [ -n "$REQUEST_COUNTERS" ]; then
        log "OK" "Contadores de requisições atualizados"
        echo "$REQUEST_COUNTERS" | head -n 5 | while read -r line; do
            log "DEBUG" "  $line"
        done
    else
        log "WARN" "Contadores de requisições não encontrados ou não atualizados"
    fi
fi

# 6. Verificar status da integração multi-tenant
log "INFO" "Verificando suporte a multi-tenancy..."
TENANT_SUPPORT=false

# Verificar configuração de tenants
if grep -q "tenants:" "/workspaces/VeloFlux/config/config.yaml"; then
    log "OK" "Configuração de tenants encontrada no config.yaml"
    TENANT_SUPPORT=true
    
    # Contar número de tenants
    NUM_TENANTS=$(grep -E "^\s+- id:" "/workspaces/VeloFlux/config/config.yaml" | wc -l)
    log "INFO" "  Número de tenants configurados: $NUM_TENANTS"
else
    log "WARN" "Configuração de tenants não encontrada no config.yaml"
fi

# 7. Resumo e recomendações
log "INFO" "==============================================="
log "INFO" "RESUMO DO DIAGNÓSTICO"
log "INFO" "==============================================="

if [ -n "$PRIMARY_PORT" ]; then
    log "OK" "✅ VeloFlux está rodando na porta $PRIMARY_PORT"
else
    log "ERROR" "❌ VeloFlux não parece estar rodando"
fi

log "INFO" "Domínios wildcards: $(if [ -n "$WILDCARD_DOMAINS" ]; then echo "✅ Configurados"; else echo "❌ Não configurados"; fi)"
log "INFO" "Suporte multi-tenant: $(if [ "$TENANT_SUPPORT" = true ]; then echo "✅ Configurado"; else echo "❌ Não configurado"; fi)"
log "INFO" "Métricas Prometheus: $(if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$METRICS_PORT" 2>/dev/null; then echo "✅ Acessíveis"; else echo "❌ Não acessíveis"; fi)"

log "INFO" "==============================================="
log "INFO" "RECOMENDAÇÕES"
log "INFO" "==============================================="

if [ -z "$PRIMARY_PORT" ]; then
    log "INFO" "1. Reiniciar o serviço VeloFlux"
fi

if [ -z "$WILDCARD_DOMAINS" ]; then
    log "INFO" "2. Adicionar domínios wildcard ao config.yaml"
fi

if [ "$TENANT_SUPPORT" = false ]; then
    log "INFO" "3. Configurar suporte a multi-tenant"
fi

if ! timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$METRICS_PORT" 2>/dev/null; then
    log "INFO" "4. Verificar configuração do endpoint de métricas"
fi

log "INFO" "5. Executar os testes de domínio novamente após as correções"
log "INFO" "   /workspaces/VeloFlux/scripts/run_domain_tests.sh"

log "INFO" "6. Para testar as métricas detalhadamente, execute:"
log "INFO" "   /workspaces/VeloFlux/scripts/test_prometheus_metrics_detailed.sh"

log "INFO" "Diagnóstico concluído!"
