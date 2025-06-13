# Quick Start

This guide helps you run VeloFlux locally using Docker Compose.

## Prerequisites
- Docker and Docker Compose installed
- Optional: Go 1.22+ if you want to build from source

## Running the stack

```bash
# Clone the repository
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux

# Start services
docker-compose up -d
```

Access the admin API on `http://localhost:9000`. The default credentials are controlled by the environment variables `VF_ADMIN_USER` and `VF_ADMIN_PASS`.

To gracefully drain connections before updating the load balancer execute:

```bash
curl -X POST http://localhost:9090/admin/drain
```

## Multi‑Region Example
VeloFlux can be deployed in multiple regions while sharing a Redis cluster. Start Redis Sentinel and point each instance to the same cluster.

```bash
redis-sentinel /etc/sentinel.conf --sentinel monitor veloflux 127.0.0.1 26379 2
```

## Testing the load balancer

```bash
# Basic request
curl http://localhost

# Check metrics
curl http://localhost:8080/metrics

# Follow logs
docker-compose logs -f veloflux
```

## Building from source

```bash
# Build the binary
go build -o veloflux ./cmd/velofluxlb

# Run with a custom configuration
VFX_CONFIG=./config/config.example.yaml ./veloflux
```

