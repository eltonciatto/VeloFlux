package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

var (
	RequestsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "veloflux_requests_total",
			Help: "Total number of requests",
		},
		[]string{"method", "status_code", "pool"},
	)

	RequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Name: "veloflux_request_duration_seconds",
			Help: "Request duration in seconds",
		},
		[]string{"method", "pool"},
	)

	ActiveConnections = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "veloflux_active_connections",
			Help: "Number of active connections",
		},
		[]string{"backend"},
	)

	BackendHealth = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "veloflux_backend_health",
			Help: "Backend health status (1 = healthy, 0 = unhealthy)",
		},
		[]string{"pool", "backend"},
	)
)

func init() {
	prometheus.MustRegister(RequestsTotal)
	prometheus.MustRegister(RequestDuration)
	prometheus.MustRegister(ActiveConnections)
	prometheus.MustRegister(BackendHealth)
}

func Handler() http.Handler {
	return promhttp.Handler()
}
