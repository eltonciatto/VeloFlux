# Configuration Reference

The configuration file uses YAML format. Below is a minimal example. Refer to
`config/config.example.yaml` for all available options.

```yaml
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"

pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    backends:
      - address: "backend-1:80"
        weight: 100
```

### Important Sections

- `global` – addresses, TLS, rate limiting and GeoIP settings
- `pools` – backend pools with balancing algorithm and health checks
- `routes` – host/path routing rules
