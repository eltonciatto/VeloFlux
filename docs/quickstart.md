# Quick Start Guide

This guide provides a minimal setup to run VeloFlux.

```bash
# Build the load balancer
go build -o veloflux ./cmd/velofluxlb

# Run with the example configuration
./veloflux -config config/config.example.yaml
```

Open <http://localhost> in your browser to verify the installation.
