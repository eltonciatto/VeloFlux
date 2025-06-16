// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package metrics

import (
	"net/http"
	"strconv"
	"time"
)

// MetricsMiddleware é um middleware HTTP para instrumentar métricas Prometheus
// em requisições para o VeloFlux. Ele registra o número total de requisições,
// duração e outros dados relevantes.
func MetricsMiddleware(next http.Handler, poolName string) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		
		// Wrapper para capturar o status code
		wrapper := NewResponseWriterWrapper(w)
		
		// Processar a requisição
		next.ServeHTTP(wrapper, r)
		
		// Registrar métricas após o processamento da requisição
		duration := time.Since(start)
		statusCode := strconv.Itoa(wrapper.StatusCode())
		
		// Incrementar contador de requisições
		RequestsTotal.WithLabelValues(
			r.Method, 
			statusCode, 
			poolName,
		).Inc()
		
		// Observar duração da requisição
		RequestDuration.WithLabelValues(
			r.Method,
			poolName,
		).Observe(duration.Seconds())
	})
}

// ResponseWriterWrapper é um wrapper para http.ResponseWriter que captura o status code
type ResponseWriterWrapper struct {
	http.ResponseWriter
	statusCode int
	written    bool
}

// NewResponseWriterWrapper cria um novo wrapper para http.ResponseWriter
func NewResponseWriterWrapper(w http.ResponseWriter) *ResponseWriterWrapper {
	return &ResponseWriterWrapper{
		ResponseWriter: w,
		statusCode:     http.StatusOK, // Default is 200 OK
	}
}

// WriteHeader intercepta o método WriteHeader e armazena o status code
func (w *ResponseWriterWrapper) WriteHeader(statusCode int) {
	w.statusCode = statusCode
	w.written = true
	w.ResponseWriter.WriteHeader(statusCode)
}

// Write intercepta o método Write para garantir que o status code seja definido
func (w *ResponseWriterWrapper) Write(b []byte) (int, error) {
	if !w.written {
		w.WriteHeader(http.StatusOK) // Define o status code default se não foi definido
	}
	return w.ResponseWriter.Write(b)
}

// StatusCode retorna o status code capturado
func (w *ResponseWriterWrapper) StatusCode() int {
	return w.statusCode
}

// UpdateBackendHealth atualiza a métrica de saúde do backend
func UpdateBackendHealth(poolName, backendAddress string, isHealthy bool) {
	healthValue := 0.0
	if isHealthy {
		healthValue = 1.0
	}
	BackendHealth.WithLabelValues(poolName, backendAddress).Set(healthValue)
}

// UpdateActiveConnections incrementa ou decrementa o contador de conexões ativas
func UpdateActiveConnections(backendAddress string, increment bool) {
	if increment {
		ActiveConnections.WithLabelValues(backendAddress).Inc()
	} else {
		ActiveConnections.WithLabelValues(backendAddress).Dec()
	}
}
