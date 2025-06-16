#!/bin/bash

# Script para diagnosticar e corrigir problemas de métricas do Prometheus no VeloFlux
# Este script irá:
# 1. Diagnosticar o problema atual com as métricas do Prometheus
# 2. Propor uma solução para implementar as métricas
# 3. Criar um patch com a solução proposta

# Configuração
LOG_FILE="/tmp/veloflux_metrics_fix_$(date +%Y%m%d_%H%M%S).log"
METRICS_ENDPOINT="http://localhost:9080/metrics"
PATCH_FILE="/workspaces/VeloFlux/prometheus_metrics.patch"
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

log "INFO" "Iniciando diagnóstico de métricas do Prometheus no VeloFlux"
log "INFO" "Log será salvo em: ${LOG_FILE}"

# Verificar se o endpoint de métricas está acessível
log "INFO" "Verificando acesso ao endpoint de métricas..."
if curl -s --head --max-time 5 "${METRICS_ENDPOINT}" | head -n 1 | grep -q "200"; then
    log "OK" "Endpoint de métricas está acessível"
else
    log "ERROR" "Endpoint de métricas não está acessível. Verifique se o VeloFlux está em execução."
    exit 1
fi

# Verificar quais métricas estão disponíveis
log "INFO" "Verificando métricas disponíveis..."
METRICS_OUTPUT=$(curl -s --max-time 5 "${METRICS_ENDPOINT}")
METRICS_COUNT=$(echo "${METRICS_OUTPUT}" | wc -l)

log "INFO" "Encontradas ${METRICS_COUNT} linhas de métricas"

# Verificar métricas específicas do VeloFlux
log "INFO" "Verificando métricas específicas do VeloFlux..."
VELOFLUX_METRICS=("veloflux_requests_total" "veloflux_request_duration_seconds" "veloflux_active_connections" "veloflux_backend_health")
MISSING_METRICS=()

for metric in "${VELOFLUX_METRICS[@]}"; do
    if echo "${METRICS_OUTPUT}" | grep -q "${metric}"; then
        log "OK" "Métrica ${metric} encontrada"
    else
        log "WARN" "Métrica ${metric} NÃO encontrada"
        MISSING_METRICS+=("${metric}")
    fi
done

# Verificar métricas padrão do Go
log "INFO" "Verificando métricas padrão do Go..."
GO_METRICS=("go_goroutines" "process_cpu_seconds_total" "go_memstats_alloc_bytes")
MISSING_GO_METRICS=()

for metric in "${GO_METRICS[@]}"; do
    if echo "${METRICS_OUTPUT}" | grep -q "${metric}"; then
        log "OK" "Métrica ${metric} encontrada"
    else
        log "WARN" "Métrica ${metric} NÃO encontrada"
        MISSING_GO_METRICS+=("${metric}")
    fi
done

# Diagnóstico do problema
log "INFO" "Analisando o problema..."
if [ ${#MISSING_METRICS[@]} -eq 0 ]; then
    log "OK" "Todas as métricas específicas do VeloFlux estão registradas corretamente"
    log "INFO" "Nenhuma ação necessária"
    exit 0
else
    log "WARN" "Foram encontradas ${#MISSING_METRICS[@]} métricas específicas do VeloFlux faltando"
    log "INFO" "O problema parece ser que as métricas do Prometheus estão registradas mas não estão sendo atualizadas durante o processamento de requisições"
fi

# Gerar uma solução em formato de patch
log "INFO" "Gerando solução para o problema..."

cat <<EOT > "${PATCH_FILE}"
# Diagnóstico do problema de métricas do VeloFlux

## Problema Identificado
O código do VeloFlux define corretamente as métricas do Prometheus no pacote "internal/metrics", 
mas essas métricas não estão sendo atualizadas durante o processamento das requisições no router.

## Solução Proposta
Modificar o arquivo "internal/router/router.go" para adicionar instrumentação das métricas do Prometheus.

### Modificações necessárias

1. Importar o pacote de métricas no router.go:
```go
import (
    // ... outras importações existentes ...
    "github.com/eltonciatto/veloflux/internal/metrics"
)
```

2. Modificar o método createProxyHandler para atualizar métricas:
```go
func (r *Router) createProxyHandler(poolName string) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, req *http.Request) {
        start := time.Now()
        clientIP := r.getClientIP(req)
        sessionID := r.getSessionID(req)

        // Criar um response writer personalizado para capturar o status code
        wrappedWriter := &responseWriter{
            ResponseWriter: w,
            statusCode:     http.StatusOK, // Default
        }

        // ... código existente para selecionar backend ...

        if err != nil {
            r.logger.Error("Failed to get backend", 
                zap.Error(err),
                zap.String("algorithm", algorithm))
            http.Error(wrappedWriter, "Service unavailable", http.StatusServiceUnavailable)
            return
        }

        // Incrementar contador de conexões ativas
        r.balancer.IncrementConnections(poolName, backend.Address)
        defer r.balancer.DecrementConnections(poolName, backend.Address)

        // Atualizar métrica de conexões ativas
        metrics.ActiveConnections.WithLabelValues(backend.Address).Inc()
        defer metrics.ActiveConnections.WithLabelValues(backend.Address).Dec()

        // Atualizar métrica de saúde do backend
        metrics.BackendHealth.WithLabelValues(poolName, backend.Address).Set(1.0)

        // ... resto do código existente ...

        proxy.ServeHTTP(wrappedWriter, req)

        // Atualizar métricas de requisições e duração
        duration := time.Since(start)
        statusCode := strconv.Itoa(wrappedWriter.statusCode)
        
        metrics.RequestsTotal.WithLabelValues(
            req.Method, 
            statusCode, 
            poolName,
        ).Inc()

        metrics.RequestDuration.WithLabelValues(
            req.Method,
            poolName,
        ).Observe(duration.Seconds())
    })
}
```

3. Adicionar função para atualizar métricas de saúde no health.go:
```go
func (c *Checker) UpdateBackendHealthMetric(poolName, backendAddress string, isHealthy bool) {
    healthValue := 0.0
    if isHealthy {
        healthValue = 1.0
    }
    metrics.BackendHealth.WithLabelValues(poolName, backendAddress).Set(healthValue)
}
```

4. Chamar essa função no método check do health.go.

## Implementação
Para implementar essas mudanças, você pode aplicar o patch manualmente nos arquivos indicados,
ou executar os comandos a seguir para modificar os arquivos diretamente.
EOT

log "OK" "Análise e solução geradas com sucesso em: ${PATCH_FILE}"
log "INFO" "==== RESUMO ===="
log "INFO" "Problema: As métricas do Prometheus estão definidas mas não estão sendo atualizadas no código"
log "INFO" "Solução: Modificar o router.go para instrumentar as métricas durante o processamento das requisições"
log "INFO" "Próximos passos:"
log "INFO" "1. Revisar o patch gerado em: ${PATCH_FILE}"
log "INFO" "2. Implementar as modificações sugeridas"
log "INFO" "3. Reiniciar o VeloFlux e verificar se as métricas estão sendo reportadas corretamente"

chmod +x "${PATCH_FILE}"
