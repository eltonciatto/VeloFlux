# Deployment Guide

This document outlines common deployment scenarios for VeloFlux in both single-tenant and multi-tenant SaaS contexts.

## Docker Compose

For local development or single-tenant deployments, the provided `docker-compose.yml` starts VeloFlux, Redis and auxiliary services.

```bash
docker-compose up -d
```

## Kubernetes / Helm

A production-ready Helm chart is available under the `charts/` directory. Example usage:

```bash
# For single-tenant installation
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secure-password \
  --set ingress.enabled=true

# For multi-tenant SaaS deployment
helm install veloflux ./charts/veloflux \
  --set redis.auth.password=secure-password \
  --set ingress.enabled=true \
  --set multiTenant.enabled=true \
  --set oidc.provider=auth0 \
  --set oidc.domain=yourdomain.auth0.com
```

Adjust the `values.yaml` file or command line flags to set:
- Number of replicas for high availability
- Redis connection information and topology
- TLS configuration and auto-renewal options
- Multi-tenant isolation settings
- Resource limits and autoscaling parameters

## Multi‑region Deployments

When running VeloFlux in multiple regions for global availability, enable clustering and point all instances to the same Redis/Sentinel or Redis Cluster deployment. Requests will be routed to the closest healthy backend using GeoIP-based routing.

```yaml
cluster:
  enabled: true
  redis_address: "redis-sentinel:26379"
  redis_cluster_mode: true
  geo_routing: true
```

For multi-tenant SaaS scenarios, you can configure region-specific tenant routing:

```yaml
tenants:
  region_routing:
    enabled: true
    default_region: "us-east"
    tenant_region_mapping: 
      tenant-1: "eu-west"
      tenant-2: "ap-southeast"
```

## Production SaaS Deployment

For production SaaS deployments, follow these additional steps:

1. **Database Planning**: Configure a highly-available Redis Cluster with appropriate memory and persistence settings
2. **User Authentication**: Set up OIDC integration with your identity provider
3. **Tenant Isolation**: Review the tenant isolation settings in `multitenant.md`
4. **Monitoring**: Configure Prometheus and Grafana for per-tenant metrics
5. **Backup Strategy**: Implement Redis snapshot or AOF backup procedures
6. **CDN Integration**: See `cdn_integration.md` for CDN configuration

## Rolling Updates

For zero-downtime updates, use the drain feature before upgrading:

```bash
# For admin-wide drain
curl -X POST http://<admin-endpoint>/admin/drain -H "Authorization: Bearer <token>"

# For tenant-specific drain (multi-tenant mode)
curl -X POST http://<admin-endpoint>/api/tenants/<tenant-id>/drain -H "Authorization: Bearer <token>"
```

Then use your orchestration platform to perform a rolling update with appropriate health checks:

```bash
# Using kubectl
kubectl rollout restart deployment/veloflux

# Using Helm
helm upgrade veloflux ./charts/veloflux --reuse-values
```

