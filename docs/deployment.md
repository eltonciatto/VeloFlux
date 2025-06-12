# Deployment Guide

### Docker Compose

The simplest way to try VeloFlux is with Docker Compose:

```bash
docker-compose up -d
```

This starts the load balancer and a couple of demo backends.

### Kubernetes

For production clusters, use the provided Helm chart:

```bash
helm install veloflux charts/veloflux
```

Customize values via `-f values.yaml` or set parameters on the command line.
