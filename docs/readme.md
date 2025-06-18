
# � VeloFlux - High-Performance Load Balancer

VeloFlux is a modern, high-performance load balancer written in Go, designed for production environments with enterprise-grade features.

## ✨ Features

- **Smart Load Balancing** - Round-robin, weighted, and health-check based routing
- **Real-time Health Checks** - Automatic backend health monitoring
- **High Performance** - Built with Go for maximum throughput
- **Easy Configuration** - Simple YAML-based configuration
- **Production Ready** - Systemd integration, logging, and monitoring
- **Security** - Built-in rate limiting and security headers

## 🚀 Quick Installation

### Prerequisites
- Ubuntu 18.04+ or Debian 9+
- Minimum 1GB RAM
- 5GB disk space
- Root access

### One-Command Installation

```bash
# Download and run installer
curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/install.sh | sudo bash
```

### Manual Installation

```bash
# Clone repository
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Make installer executable and run
chmod +x install.sh
sudo ./install.sh
```

## 🌐 Access Points

After installation, VeloFlux will be available at:

- **Main Application**: `http://your-server-ip/`
- **Admin Panel**: `http://your-server-ip/admin`
- **Health Check**: `http://your-server-ip/health`

## 🔧 Configuration

Configuration file is located at `/etc/veloflux/config.yaml`:

```yaml
# VeloFlux Configuration
server:
  bind_address: "<YOUR_IP_ADDRESS>:8080"
  admin_address: "<YOUR_IP_ADDRESS>:9000"
  
logging:
  level: "info"
  file: "/var/log/veloflux/veloflux.log"

backends:
  - name: "backend1"
    url: "http://<YOUR_IP_ADDRESS>:3001"
    weight: 100
    health_check:
      path: "/health"
      interval: "30s"

load_balancing:
  algorithm: "round_robin"
  
security:
  rate_limit:
    requests_per_minute: 100
    burst: 10
```

## 🛠️ Management Commands

```bash
# Service management
sudo systemctl start veloflux
sudo systemctl stop veloflux
sudo systemctl restart veloflux
sudo systemctl status veloflux

# View logs
sudo journalctl -fu veloflux
sudo tail -f /var/log/veloflux/veloflux.log

# Configuration test
sudo /opt/veloflux/bin/veloflux-lb -config /etc/veloflux/config.yaml -test
```

## 🧹 Cleanup

To completely remove VeloFlux:

```bash
# Download and run cleanup script
curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/cleanup.sh | sudo bash

# Or manually
sudo ./cleanup.sh
```

## 📊 Monitoring

VeloFlux provides built-in monitoring endpoints:

- **Health**: `/health` - Service health status
- **Metrics**: `/admin/metrics` - Performance metrics
- **Status**: `/admin/status` - Backend status

## 🔒 Security

VeloFlux includes security features:

- Rate limiting
- Security headers
- Request filtering
- Access logging

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Issues**: [GitHub Issues](https://github.com/eltonciatto/VeloFlux/issues)
- **Documentation**: [Wiki](https://github.com/eltonciatto/VeloFlux/wiki)

---

**Made with ❤️ for high-performance load balancing**

A production-grade, container-native SaaS load balancer built in Go with AI intelligence, SSL termination, HTTP/3 support, automatic health checks, and geo-aware routing.

## ⚡ Super Quick Install (1 Command)

### � Docker (Recommended - Ready in ~5 minutes)
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/docker-quick-install.sh
```
**Access:** http://localhost | **Admin:** http://localhost:9000 | **Grafana:** http://localhost:3000

### 🛠️ Development Environment
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/dev-quick-install.sh
```
**Access:** http://localhost:5173 | **Hot reload enabled**

### 🚀 Production (with SSL)
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh production -d yourdomain.com -e admin@yourdomain.com
```
**SSL auto-generated** | **Monitoring included** | **Backups enabled**

### 🧙‍♂️ Interactive Wizard
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh
```
**Smart assistant** | **Auto-detection** | **Custom configuration**

---

## 📚 Detailed Installation Guide

For complete installation options and troubleshooting, see: **[📖 Quick Install Guide](docs/QUICK_INSTALL.md)**

## �🚀 Traditional Quick Start

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
redis-sentinel /etc/sentinel.conf --sentinel monitor veloflux <YOUR_IP_ADDRESS> 26379 2
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

3. **Access the AI Dashboard:**
```bash
# Start the frontend development server
npm install
npm run dev

# Open browser to http://localhost:3000
# Navigate to the "AI Insights" tab to view intelligent load balancing metrics
# Explore predictive analytics, model performance, and AI configuration options
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

### 🤖 AI/ML Intelligence Features
- ✅ **Intelligent Load Balancing** - ML-powered backend selection based on real-time performance
- ✅ **Predictive Auto-scaling** - AI-driven capacity planning and scaling recommendations
- ✅ **Anomaly Detection** - Real-time detection of traffic patterns and system anomalies
- ✅ **Performance Optimization** - ML-based configuration tuning and optimization suggestions
- ✅ **Smart Health Prediction** - Predictive health monitoring with early failure detection
- ✅ **Traffic Pattern Analysis** - AI-powered insights into user behavior and traffic trends
- ✅ **Real-time AI Dashboard** - Interactive web interface for AI insights and configuration
- ✅ **Model Performance Monitoring** - Track and visualize ML model accuracy and performance

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
  bind_address: "<YOUR_IP_ADDRESS>:80"
  tls_bind_address: "<YOUR_IP_ADDRESS>:443"
  metrics_address: "<YOUR_IP_ADDRESS>:8080"
  
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

### 🤖 AI/ML Dashboard

Access the intelligent load balancer dashboard at `http://localhost:3000` (development) or your configured frontend URL:

**Dashboard Features:**
- **AI Overview** - Real-time summary of AI-driven optimizations and insights
- **Predictive Analytics** - Traffic forecasting, capacity planning, and scaling recommendations
- **Model Performance** - ML model accuracy metrics, training status, and performance trends
- **AI Configuration** - Configure ML models, enable/disable AI features, and tune parameters
- **Intelligent Insights** - Anomaly detection alerts, optimization suggestions, and pattern analysis
- **Real-time Metrics** - Live visualization of AI-enhanced load balancing decisions

**Key AI Capabilities:**
- **Smart Backend Selection** - ML algorithms automatically route traffic to optimal backends
- **Predictive Scaling** - AI predicts traffic spikes and recommends scaling actions
- **Anomaly Detection** - Real-time detection of unusual traffic patterns or system behavior
- **Performance Optimization** - AI continuously tunes configuration for optimal performance
- **Health Prediction** - Predictive models identify potential backend failures before they occur

### Metrics

Access Prometheus metrics at `http://localhost:8080/metrics`:

**Core Metrics:**
- `veloflux_requests_total` - Total requests by method, status, pool
- `veloflux_request_duration_seconds` - Request latency histogram
- `veloflux_active_connections` - Active connections per backend
- `veloflux_backend_health` - Backend health status

**AI/ML Metrics:**
- `veloflux_ai_model_accuracy` - ML model prediction accuracy
- `veloflux_ai_predictions_total` - Total AI predictions made
- `veloflux_ai_anomalies_detected` - Anomalies detected by AI models
- `veloflux_ai_optimization_score` - AI-driven optimization effectiveness
- `veloflux_ai_backend_score` - AI-calculated backend performance scores
### Prometheus Scrape Configuration
Add the following job to your Prometheus configuration to collect VeloFlux metrics:
```yaml
- job_name: veloflux
  static_configs:
  - targets: ["localhost:8080"]
```

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
  "client_ip": "<YOUR_IP_ADDRESS>",
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
# Install Go dependencies
go mod download
# Install frontend dependencies for linting
npm install

# Build binary
go build -o veloflux ./cmd/velofluxlb

# Run tests
go test ./...

# Run with race detection
go run -race ./cmd/velofluxlb
```

### 🎨 Frontend Development

The VeloFlux dashboard is built with React, TypeScript, and Tailwind CSS:

```bash
# Install frontend dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm install        # ensure dependencies for linting
npm run lint
```

**Frontend Architecture:**
- **React 18** with TypeScript for type safety
- **Tailwind CSS** for modern, responsive styling
- **Recharts** for data visualization and metrics charts
- **React Query** for efficient API state management
- **Real-time updates** via WebSocket connections to backend AI services

**AI/ML Frontend Components:**
- `AIOverview` - Main AI dashboard with key metrics and insights
- `AIMetricsDashboard` - Comprehensive AI metrics visualization
- `ModelPerformance` - ML model accuracy and performance tracking
- `PredictiveAnalytics` - Traffic prediction and capacity planning charts
- `AIConfiguration` - AI feature settings and model configuration
- `AIInsights` - Anomaly detection and optimization recommendations

### Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit a pull request

## 📚 Documentation

**Core Documentation:**
- [Quick Start Guide](docs/quickstart.md)
- [Configuration Reference](docs/configuration.md)
- [API Documentation](docs/api.md)
- [Deployment Guide](docs/deployment.md)
- [Security Hardening](docs/security.md)
- [Troubleshooting](docs/troubleshooting.md)
- [Multitenant Roadmap](docs/multitenant.md)

**AI/ML Documentation:**
- [AI/ML Features Guide](docs/ai_ml_features.md)
- [AI Frontend Implementation](docs/ai_frontend_final_summary.md)
- [AI Frontend Testing Guide](docs/ai_frontend_testing_guide.md)
- [Frontend AI Implementation Status](docs/frontend_ai_implementation_complete.md)

## 🤝 Community

- **GitHub Issues**: Bug reports and feature requests
- **Discussions**: Design discussions and questions
- **Contributing**: See CONTRIBUTING.md for guidelines

## 📄 License

VeloFlux Custom License - see LICENSE file for details.

This project uses a custom license that allows free non-commercial use but restricts competitive commercial use, especially subscription services. The VeloFlux name, logo, source code, and design are protected by copyright.

## 🙏 Acknowledgments

Built with:
- **Go** - System programming language
- **Prometheus** - Metrics and monitoring
- **Let's Encrypt** - Automatic SSL certificates
- **Docker** - Containerization

---

**VeloFlux LB** - Built for the cloud-native era 🚀
