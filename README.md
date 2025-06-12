
# VeloFlux LB - Container-Native Global Load Balancer

A production-grade, container-native load balancer built in Go with SSL termination, HTTP/3 support, automatic health checks, and geo-aware routing.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- Go 1.22+ (for development)

### Run with Docker Compose

1. **Clone and start the stack:**
```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
docker-compose up -d
# Admin API: http://localhost:9000 (set VF_ADMIN_USER and VF_ADMIN_PASS)
# Trigger draining before updates:
# curl -X POST http://localhost:9090/admin/drain
```
### Multi-Region Example
Deploy VeloFlux in multiple regions while sharing a Redis cluster:
```bash
redis-sentinel /etc/sentinel.conf --sentinel monitor veloflux 127.0.0.1 26379 2
```


2. **Test the load balancer:**
```bash
# Test basic functionality
curl http://localhost

# Check health status
curl http://localhost:8080/metrics

# View logs
docker-compose logs -f veloflux
```

### Build from Source

```bash
# Build the binary
go build -o veloflux ./cmd/velofluxlb

# Run with custom config
VFX_CONFIG=./config/config.example.yaml ./veloflux
```

## 🏗️ Architecture

VeloFlux LB is designed as a single-binary, stateless load balancer with the following components:

- **Router**: HTTP/HTTPS request routing with TLS termination
- **Balancer**: Multiple load balancing algorithms (round-robin, least-conn, IP-hash, weighted)
- **Health Checker**: Active and passive health monitoring
- **Rate Limiter**: Token bucket rate limiting per IP
- **Metrics**: Prometheus metrics export
- **Logger**: Structured JSON logging

## 📋 Features

### Core Features
- ✅ **SSL/TLS Termination** - Automatic ACME certificates with Let's Encrypt
- ✅ **HTTP/2 & HTTP/3** - Modern protocol support
- ✅ **WebSocket Pass-through** - Full WebSocket support
- ✅ **Health Monitoring** - Active HTTP/TCP health checks with passive failure detection
- ✅ **Load Balancing** - Round-robin, least-connections, IP-hash, weighted algorithms
- ✅ **Sticky Sessions** - Cookie-based session persistence
- ✅ **Rate Limiting** - Per-IP token bucket rate limiting
- ✅ **Metrics** - Prometheus metrics endpoint
- ✅ **Graceful Shutdown** - Zero-downtime rolling updates

### Performance
- **100k+ concurrent connections** on 2 vCPU
- **50k+ RPS** sustained throughput
- **Under 50 MB container size** with optimized Go binary
- **Sub-millisecond latency** for healthy backends

## 🔧 Configuration

### Basic Configuration

Create `config.yaml`:

```yaml
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  tls:
    auto_cert: true
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs/veloflux"

  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"

routes:
  - host: "example.com"
    pool: "web-servers"
```

### Environment Variables

- `VFX_CONFIG` - Path to configuration file (default: `/etc/veloflux/config.yaml`)
- `VFX_LOG_LEVEL` - Log level: debug, info, warn, error
- `VF_ADMIN_USER` - Username for the admin dashboard
- `VF_ADMIN_PASS` - Password for the admin dashboard

## 🚀 Deployment

### Docker

```bash
# Build image
docker build -t veloflux .

# Run container
docker run -d \
  --name veloflux \
  -p 80:80 -p 443:443 -p 8080:8080 \
  -e VFX_CONFIG=/etc/veloflux/config.yaml \
  -v $(pwd)/config:/etc/veloflux \
  veloflux
```

### Zero-Downtime Deployment

```bash
# Use provided deployment script
./scripts/deploy.sh

# Or with Docker Swarm
DEPLOYMENT_MODE=swarm ./scripts/deploy.sh

# Or with Nomad
DEPLOYMENT_MODE=nomad ./scripts/deploy.sh
```

## 📊 Monitoring & Observability

### Metrics

Access Prometheus metrics at `http://localhost:8080/metrics`:

- `veloflux_requests_total` - Total requests by method, status, pool
- `veloflux_request_duration_seconds` - Request latency histogram
- `veloflux_active_connections` - Active connections per backend
### Prometheus Scrape Configuration
Add the following job to your Prometheus configuration to collect VeloFlux metrics:
```yaml
- job_name: veloflux
  static_configs:
  - targets: ["localhost:8080"]
```

- `veloflux_backend_health` - Backend health status

### Health Checks

- **Active checks**: HTTP GET requests to configurable endpoints
- **Passive checks**: Monitor 5xx responses and timeouts
- **Configurable intervals**: Per-backend check intervals and timeouts
- **Exponential backoff**: Automatic retry with backoff on failures

### Logging

Structured JSON logs with configurable levels:

```json
{
  "level": "info",
  "ts": "2024-01-15T10:30:45.123Z",
  "msg": "Request processed",
  "method": "GET",
  "url": "/api/users",
  "client_ip": "192.168.1.100",
  "status_code": 200,
  "duration": "45.2ms",
  "request_id": "req-12345"
}
```

## 🧪 Performance Testing

Run comprehensive benchmarks:

```bash
# Full benchmark suite
./scripts/benchmark.sh

# Specific tests
./scripts/benchmark.sh wrk        # HTTP load test
./scripts/benchmark.sh vegeta     # Latency analysis
./scripts/benchmark.sh stress     # High-load stress test
```

## 🔒 Security

### Built-in Security Features
- **Rate limiting** - Token bucket per IP/CIDR
- **TLS termination** - Automatic certificate management
- **Header injection** - X-Forwarded-For, X-Real-IP
- **Request validation** - Basic request sanitization

### Security Hardening
See `docs/security.md` for:
- OS-level security (sysctl, iptables)
- Container security best practices
- Network security configuration

## 🛠️ Development

### Building

```bash
# Install dependencies
go mod download

# Build binary
go build -o veloflux ./cmd/velofluxlb

# Run tests
go test ./...

# Run with race detection
go run -race ./cmd/velofluxlb
```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📚 Documentation

- [Quick Start Guide](docs/quickstart.md)
- [Configuration Reference](docs/configuration.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Hardening](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Multitenant Roadmap](docs/multitenant.md)

## 🤝 Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Design discussions and questions
- **Contributing**: See CONTRIBUTING.md for guidelines

## 📄 License

MIT License - see LICENSE file for details.

## 🙏 Acknowledgments

Built with:
- **Go** - System programming language
- **Prometheus** - Metrics and monitoring
- **Let's Encrypt** - Automatic SSL certificates
- **Docker** - Containerization

---

**VeloFlux LB** - Built for the cloud-native era 🚀
