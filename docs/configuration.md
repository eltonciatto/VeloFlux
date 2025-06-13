# Configuration Reference

VeloFlux supports configuration via a YAML file and dynamically through its API. This reference covers both static configuration and API-configurable settings.

## Global Settings

```yaml
global:
  bind_address: "0.0.0.0:80"        # HTTP listen address
  tls_bind_address: "0.0.0.0:443"   # HTTPS listen address
  metrics_address: "0.0.0.0:8080"   # Prometheus metrics
  admin_address: "0.0.0.0:9000"     # Admin API address

  tls:
    auto_cert: true                 # Obtain certificates via Let's Encrypt
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs/veloflux"
    client_auth:                    # Mutual TLS settings
      enabled: false
      ca_cert: "/etc/ssl/ca.pem"

  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3
    healthy_threshold: 2
    unhealthy_threshold: 3

  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"
    response_code: 429
    exclude_paths:
      - "/health"
      - "/metrics"

  waf:
    enabled: true
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"               # basic, standard, strict
    blocking_mode: true             # false for detection only
    logging: true                   # log details of blocked requests

  geoip:
    enabled: true
    database_path: "/etc/geoip/GeoLite2-City.mmdb"
    update_interval: "168h"         # auto-update interval
```

## Authentication and Multi-tenant

```yaml
auth:
  enabled: true
  jwt_secret: "change-me-in-production"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  refresh_token_validity: "7d"
  cookie_secure: true
  cookie_http_only: true
  
  # Optional external OIDC provider
  oidc_enabled: false
  oidc_issuer_url: "https://keycloak.example.com/auth/realms/veloflux"
  oidc_client_id: "veloflux-admin"
  oidc_redirect_uri: "https://admin.example.com/auth/callback"

# Multi-tenant configuration
tenants:
  # Default tenant configuration
  default_plan: "basic"           # Default plan for new tenants
  
  # Plan definitions
  plans:
    free:
      max_requests_per_second: 10
      max_burst_size: 20
      max_bandwidth_mb_per_day: 1000
      max_routes: 3
      max_backends: 6
      waf_level: "basic"
    
    pro:
      max_requests_per_second: 1000
      max_burst_size: 2000
      max_bandwidth_mb_per_day: 100000
      max_routes: 50
      max_backends: 200
      waf_level: "strict"
      
    enterprise:
      max_requests_per_second: 5000
      max_burst_size: 10000
      max_bandwidth_mb_per_day: 500000
      max_routes: 250
      max_backends: 1000
      waf_level: "strict"
      
  # Example tenant definitions (typically managed via API)
  tenant_configs:
    - id: "tenant1"
      name: "Example Corp"
      plan: "enterprise"
      routes:
        - host: "api.example.com"
          pool: "tenant1:pool:api-servers"
      custom_domain: "api.example.com"
```

## Clustering and Persistence

```yaml
# Redis configuration
redis:
  address: "redis:6379"
  password: ""
  db: 0
  key_prefix: "vf:"
  pool_size: 10
  
  # Optional Redis Sentinel support
  sentinel:
    enabled: false
    master_name: "veloflux-master"
    addresses:
      - "sentinel-1:26379"
      - "sentinel-2:26379"

# Clustering configuration
cluster:
  enabled: true
  node_id: ""                      # auto-generated if empty
  heartbeat_interval: "5s"
  leader_timeout: "15s"
  sync_interval: "1m"              # Configuration sync interval
```

## Pools and Routes

Pools define backend servers. Routes map hostnames to pools. In multi-tenant mode, these are typically managed via API.

```yaml
pools:
  - name: "web-servers"
    tenant_id: "tenant1"           # Tenant ownership
    algorithm: "round_robin"       # round_robin, least_conn, ip_hash
    sticky_sessions: true
    retries: 3
    timeout: "30s"
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          method: "GET"
          expected_status: 200
          expected_body: "ok"
```

```yaml
routes:
  - host: "example.com"
    tenant_id: "tenant1"           # Tenant ownership
    pool: "web-servers"
    path_prefix: "/"
    strip_path_prefix: false
    tls_required: true
    cors_enabled: true
    cors_allow_origins:
      - "https://app.example.com"
    rate_limit:
      requests_per_second: 50      # Override global setting
    waf:
      level: "strict"              # Override global setting
    headers:
      set:
        X-Frame-Options: "DENY"
      add:
        Cache-Control: "no-store"
      remove:
        - Server
```

## Metrics and Monitoring

```yaml
metrics:
  prometheus:
    enabled: true
    path: "/metrics"
    tenant_label: true             # Add tenant label to metrics
  
  logging:
    level: "info"                  # debug, info, warn, error
    format: "json"                 # json, text
    tenant_field: true             # Add tenant field to logs
```

See `config/config.example.yaml` for a full annotated example with more options and detailed descriptions.

