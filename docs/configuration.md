# Configuration Reference

VeloFlux is configured via a YAML file. Below is a summary of the main sections and fields.

## Global settings

```yaml
global:
  bind_address: "0.0.0.0:80"       # HTTP listen address
  tls_bind_address: "0.0.0.0:443"  # HTTPS listen address
  metrics_address: "0.0.0.0:8080"  # Prometheus metrics

  tls:
    auto_cert: true               # Obtain certificates via Let's Encrypt
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs/veloflux"

  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"

  waf:
    enabled: true
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"

  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"
```

## Authentication

```yaml
auth:
  enabled: true
  jwt_secret: "change-me"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
```

## Clustering

```yaml
cluster:
  enabled: true
  redis_address: "redis:6379"
  redis_password: ""
  node_id: ""               # auto-generated if empty
  heartbeat_interval: "5s"
  leader_timeout: "15s"
```

## Pools and routes

Pools define backend servers. Routes map hostnames to pools.

```yaml
pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
```

```yaml
routes:
  - host: "example.com"
    pool: "web-servers"
```

See `config/config.example.yaml` for a full annotated example.

