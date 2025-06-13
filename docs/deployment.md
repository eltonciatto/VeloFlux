# Deployment Guide

This document outlines common deployment scenarios for VeloFlux.

## Docker Compose

For local testing or small setups, the provided `docker-compose.yml` starts VeloFlux, Redis and auxiliary services.

```bash
docker-compose up -d
```

## Kubernetes / Helm

A Helm chart is available under the `charts/` directory. Example usage:

```bash
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secret \
  --set ingress.enabled=true
```

Adjust the values file or command line flags to set the number of replicas, Redis connection information and TLS configuration.

## Multi‑region deployments

When running VeloFlux in multiple regions, enable clustering and point all instances to the same Redis/Sentinel cluster. Requests will be routed to the closest healthy backend when GeoIP is enabled.

```
cluster:
  enabled: true
  redis_address: "redis-sentinel:26379"
```

## Rolling updates

Send a drain signal before upgrading to ensure existing connections finish gracefully:

```bash
curl -X POST http://<admin>/admin/drain
```

Then update containers using your orchestration platform.

