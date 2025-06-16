🚫 **Not for Commercial Use Without License**  
📜 Licensed under **VeloFlux Public Source License (VPSL) v1.0** — See [`LICENSE`](./LICENSE) for details.  
💼 For commercial licensing, visit **https://veloflux.io** or contact **contact@veloflux.io**.

# VeloFlux Load Balancer

[![CI/CD Pipeline](https://github.com/eltonciatto/VeloFlux/workflows/VeloFlux%20CI/CD%20Pipeline/badge.svg)](https://github.com/eltonciatto/VeloFlux/actions)
[![Security Scan](https://github.com/eltonciatto/VeloFlux/workflows/Security%20Scan/badge.svg)](https://github.com/eltonciatto/VeloFlux/security)
[![Go Report Card](https://goreportcard.com/badge/github.com/eltonciatto/VeloFlux)](https://goreportcard.com/report/github.com/eltonciatto/VeloFlux)
[![License: VPSL](https://img.shields.io/badge/License-VPSL-blue.svg)](./LICENSE)

## Overview

VeloFlux is a production-ready, enterprise-grade load balancer designed for high-performance applications requiring maximum uptime and scalability. Built with Go and featuring a modern React frontend, VeloFlux provides advanced features including multi-tenancy, Kubernetes orchestration, OIDC authentication, and comprehensive monitoring.

## ✨ Key Features

### Core Load Balancing
- **Multiple Algorithms**: Round Robin, Least Connections, IP Hash, Weighted Round Robin, Geo Proximity
- **Health Checking**: Automated backend health monitoring with configurable intervals
- **Sticky Sessions**: Support for session persistence across requests
- **Hot Reloading**: Zero-downtime configuration updates
- **SSL/TLS Termination**: Automatic certificate management with Let's Encrypt

### Enterprise Features
- **Multi-Tenant Architecture**: Complete tenant isolation with role-based access control
- **Kubernetes Integration**: Native orchestration with auto-scaling and namespace isolation
- **OIDC Authentication**: External provider support (Keycloak, Auth0, etc.)
- **Billing & Quotas**: Built-in usage tracking and payment provider integration
- **Advanced Security**: WAF, rate limiting, DDoS protection, input sanitization

### Observability
- **Prometheus Metrics**: Comprehensive monitoring with custom dashboards
- **Structured Logging**: JSON logging with tenant context
- **Real-time Alerts**: Configurable alerting via Slack, email, webhooks
- **Performance Analytics**: Request tracing and latency analysis

## 🚀 Quick Start

### Prerequisites
- Go 1.21+
- Node.js 18+
- Redis 7+
- Docker (optional)
- Kubernetes cluster (for orchestration features)

### Installation

#### Using Docker (Recommended)
```bash
# Clone the repository
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Start with Docker Compose
docker-compose up -d

# Access the dashboard
open http://localhost:8080
```

#### Manual Installation
```bash
# Install backend dependencies
go mod download

# Install frontend dependencies
npm install

# Build frontend
npm run build

# Run the application
go run cmd/velofluxlb/main.go --config config/config.yaml
```

### Basic Configuration

Create a `config.yaml` file:

```yaml
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  
  # Redis configuration
  redis:
    address: "localhost:6379"
    password: ""
    db: 0

  # TLS with automatic certificates
  tls:
    auto_cert: true
    acme_email: "admin@yourdomain.com"

# Backend pools
pools:
  - name: "web-servers"
    algorithm: "round_robin"
    health_check:
      interval: "30s"
      timeout: "5s"
      path: "/health"
    
    backends:
      - address: "192.168.1.100:8080"
        weight: 100
      - address: "192.168.1.101:8080"
        weight: 100

# Routing rules
routes:
  - host: "example.com"
    pool: "web-servers"
    redirect_https: true
```

## 📊 Multi-Tenant Features

### Tenant Management
VeloFlux supports complete multi-tenancy with:
- Isolated configurations per tenant
- Role-based access control (owner, admin, member, viewer)
- Separate billing and usage tracking
- Independent monitoring and alerting

### Example: Creating a Tenant
```bash
curl -X POST "https://api.veloflux.io/tenants" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "plan": "enterprise",
    "domain": "mycompany.com"
  }'
```

## 🔧 Advanced Configuration

### Kubernetes Orchestration
Deploy dedicated instances per tenant:

```yaml
orchestration:
  enabled: true
  in_cluster: true
  
  # Default resource limits
  resource_limits:
    cpu_request: "100m"
    cpu_limit: "500m"
    memory_request: "128Mi"
    memory_limit: "512Mi"
  
  # Auto-scaling configuration
  autoscaling:
    enabled: true
    min_replicas: 1
    max_replicas: 10
    target_cpu_utilization: 70
```

### OIDC Authentication
Integrate with external identity providers:

```yaml
oidc:
  enabled: true
  providers:
    - name: "keycloak"
      issuer_url: "https://auth.example.com/realms/main"
      client_id: "veloflux"
      client_secret: "${OIDC_CLIENT_SECRET}"
      scopes: ["openid", "profile", "email", "groups"]
      
      # Custom claim mappings
      claim_mappings:
        tenant_id: "resource_access.veloflux.tenant_id"
        roles: "resource_access.veloflux.roles"
```

### Security Features
```yaml
security:
  # Rate limiting
  rate_limit:
    enabled: true
    requests_per_second: 100
    burst_size: 200
    
  # Web Application Firewall
  waf:
    enabled: true
    mode: "blocking"  # or "monitoring"
    
  # Input validation
  input_validation:
    max_request_size: "10MB"
    block_suspicious_patterns: true
```

## 📈 Monitoring & Observability

### Prometheus Metrics
VeloFlux exposes comprehensive metrics:
- Request counts and latencies
- Backend health status
- Active connections
- Error rates by tenant
- Resource utilization

### Grafana Dashboards
Pre-built dashboards available for:
- Load balancer overview
- Tenant-specific metrics
- Kubernetes resource usage
- Security events

### Alerting Configuration
```yaml
alerting:
  enabled: true
  check_interval: "30s"
  
  channels:
    slack:
      type: "slack"
      webhook_url: "${SLACK_WEBHOOK_URL}"
    
    email:
      type: "email"
      smtp_host: "smtp.example.com"
      smtp_port: 587
      username: "${EMAIL_USERNAME}"
      password: "${EMAIL_PASSWORD}"
  
  rules:
    - name: "high_error_rate"
      query: "error_rate"
      operator: ">"
      threshold: 5.0
      duration: "5m"
      severity: "critical"
      channels: ["slack", "email"]
```

## 🔒 Security

VeloFlux implements multiple layers of security:

- **Authentication**: JWT tokens with automatic refresh
- **Authorization**: Role-based access control per tenant
- **Network Security**: TLS 1.3, HSTS, security headers
- **Input Validation**: Request sanitization and size limits
- **Rate Limiting**: Configurable per endpoint and IP
- **WAF Protection**: OWASP Core Rule Set implementation
- **Audit Logging**: Complete audit trail for compliance

## 🧪 Testing

### Running Tests
```bash
# Backend tests
go test -v -race ./...

# Frontend tests
npm test

# Integration tests
go test -tags=integration ./test/integration/...

# Load testing
k6 run scripts/load-test.js
```

### Test Coverage
- Backend: >85% code coverage
- Frontend: >80% code coverage
- Integration tests for all major workflows
- Performance benchmarks for load balancing algorithms

## 📚 API Reference

### Authentication
```bash
# Login
curl -X POST "https://api.veloflux.io/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password"}'

# Get profile
curl -X GET "https://api.veloflux.io/api/profile" \
  -H "Authorization: Bearer $TOKEN"
```

### Tenant Management
```bash
# List tenants
curl -X GET "https://api.veloflux.io/api/tenants" \
  -H "Authorization: Bearer $TOKEN"

# Update tenant
curl -X PUT "https://api.veloflux.io/api/tenants/tenant-id" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'
```

### Monitoring
```bash
# Get metrics
curl -X GET "https://api.veloflux.io/metrics"

# Get tenant usage
curl -X GET "https://api.veloflux.io/api/tenants/tenant-id/usage" \
  -H "Authorization: Bearer $TOKEN"
```

## 🚀 Deployment

### Production Deployment
```bash
# Using Helm
helm repo add veloflux https://charts.veloflux.io
helm install veloflux veloflux/veloflux \
  --set global.domain=yourdomain.com \
  --set redis.auth.enabled=true

# Using Kubernetes manifests
kubectl apply -f k8s/production/
```

### Environment Variables
```bash
# Required
REDIS_URL=redis://localhost:6379
JWT_SECRET=your-secret-key

# Optional
OIDC_CLIENT_SECRET=your-oidc-secret
SLACK_WEBHOOK_URL=your-slack-webhook
```

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
# Fork and clone the repository
git clone https://github.com/yourusername/VeloFlux.git

# Install dependencies
make install

# Run in development mode
make dev

# Run tests
make test
```

## 📄 License

VeloFlux is released under the MIT License. See [LICENSE](LICENSE) file for details.

## 🔗 Links

- [Documentation](https://docs.veloflux.io)
- [API Reference](https://api.veloflux.io/docs)
- [Community Discord](https://discord.gg/veloflux)
- [GitHub Issues](https://github.com/eltonciatto/VeloFlux/issues)

## 🙏 Acknowledgments

- Built with [Go](https://golang.org/) and [React](https://reactjs.org/)
- Inspired by industry-leading load balancers
- Community feedback and contributions

---

**VeloFlux** - High-Performance Load Balancing for Modern Applications
