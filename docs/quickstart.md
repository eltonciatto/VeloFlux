# Quick Start

This guide helps you quickly get started with VeloFlux in both single-tenant and multi-tenant SaaS scenarios.

## Prerequisites
- Docker and Docker Compose installed
- Optional: Go 1.22+ if you want to build from source
- Optional: Redis CLI for advanced operations

## Running as a Single-Tenant Load Balancer

```bash
# Clone the repository
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Start services with default configuration
docker-compose up -d
```

Access the admin API on `http://localhost:9000`. The default credentials are controlled by the environment variables `VF_ADMIN_USER` and `VF_ADMIN_PASS` (default: admin/admin).

### Configure Your First Backend Pool

```bash
# Create a pool with two backend servers
curl -X POST http://localhost:9000/api/pools \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-servers",
    "algorithm": "round_robin",
    "backends": [
      {"address": "backend1.example.com:80", "weight": 1},
      {"address": "backend2.example.com:80", "weight": 1}
    ]
  }'

# Create a route that uses this pool
curl -X POST http://localhost:9000/api/routes \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "host": "yourdomain.com",
    "pool": "web-servers",
    "path_prefix": "/"
  }'
```

## Running as a Multi-Tenant SaaS Platform

For multi-tenant operation, use the multi-tenant configuration:

```bash
# Start with multi-tenant mode enabled
docker-compose -f docker-compose.yml -f docker-compose.multitenant.yml up -d
```

### Set Up Your First Tenant

```bash
# Create a tenant
curl -X POST http://localhost:9000/api/tenants \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "tenant1",
    "name": "First Tenant",
    "plan": "standard",
    "domains": ["tenant1.example.com"]
  }'

# Create a pool for this tenant
curl -X POST http://localhost:9000/api/tenants/tenant1/pools \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "web-servers",
    "algorithm": "round_robin",
    "backends": [
      {"address": "tenant1-backend1.example.com:80", "weight": 1}
    ]
  }'
```

## Multiple Region Deployments

VeloFlux can be deployed across multiple regions while sharing a Redis cluster for state synchronization:

```bash
# Start Redis Sentinel for high availability
redis-sentinel /etc/sentinel.conf --sentinel monitor veloflux 127.0.0.1 26379 2

# Configure VeloFlux instances in each region to use the same Redis cluster
export VFX_REDIS_ADDRESS=redis-sentinel:26379
export VFX_CLUSTER_ENABLED=true
export VFX_GEO_ROUTING=true

# Start VeloFlux in region 1
docker-compose -f docker-compose.region1.yml up -d

# Start VeloFlux in region 2
docker-compose -f docker-compose.region2.yml up -d
```

## Testing and Monitoring

```bash
# Basic request
curl -H "Host: yourdomain.com" http://localhost:80

# Check global metrics
curl http://localhost:8080/metrics

# Check tenant-specific metrics (multi-tenant mode)
curl http://localhost:8080/metrics/tenants/tenant1

# Follow logs
docker-compose logs -f veloflux

# Tenant-specific logs (multi-tenant mode)
docker-compose logs -f veloflux | grep 'tenant1'
```

## Building from Source

```bash
# Build the binary
go build -o veloflux ./cmd/velofluxlb

# Run with a single-tenant configuration
VFX_CONFIG=./config/config.example.yaml ./veloflux

# Run with a multi-tenant configuration
VFX_CONFIG=./config/multitenant.yaml ./veloflux
```

## Web UI Dashboard

For a complete management experience, access the Web UI at `http://localhost:9000` after starting the services. The dashboard provides:

- Tenant management interface
- Backend pool and route configuration
- Real-time metrics and health monitoring
- WAF and rate limit configuration
- User and permission management

## Deployment Options

VeloFlux offers various deployment options to fit your needs:

- [Docker Compose](deployment.md#docker-compose) - for local development and simple setups
- [Kubernetes/Helm](deployment.md#kubernetes--helm) - for scalable, production deployments
- [Coolify](coolify_deployment.md) - for simplified deployment on self-hosted infrastructure

