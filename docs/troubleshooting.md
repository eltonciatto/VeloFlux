# Troubleshooting

This guide covers common issues and their solutions in single-tenant and multi-tenant VeloFlux deployments.

## Common Issues

### Service Does Not Start
- Check that the configuration file is valid YAML. Run `yamllint config.yaml` to validate.
- Ensure the listening ports (80, 443, 9000, 8080) are not already in use.
- Verify Redis connection parameters in the configuration.
- Check for sufficient permissions to bind to privileged ports.

```bash
# Check if ports are in use
netstat -tuln | grep -E '80|443|9000|8080'

# Verify Redis connection
redis-cli -h localhost -p 6379 ping
```

### Authentication or Authorization Issues
- Ensure JWT secret is consistent across all instances in the cluster.
- Verify OIDC configuration parameters if using external authentication.
- Check tenant permissions and roles in multi-tenant setups:

```bash
# Verify JWT secret environment variable
echo $VFX_JWT_SECRET

# Test authentication endpoint
curl -v -X POST http://localhost:9000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com", "password":"yourpassword"}'
```

### Cannot Obtain TLS Certificates
- Verify that ports 80 and 443 are accessible from the internet for ACME challenges.
- Confirm the `acme_email` and domain names are correctly configured.
- Check DNS records point to your VeloFlux instance.
- For multi-tenant setups, ensure tenant domains are properly delegated:

```bash
# Test domain resolution
dig +short yourdomain.com

# Check Let's Encrypt connection
curl -v https://acme-v02.api.letsencrypt.org/directory
```

### High Latency or Connection Timeouts
- Inspect backend health status:
  - Single-tenant: `curl http://<admin>/api/pools`
  - Multi-tenant: `curl http://<admin>/api/tenants/<tenant-id>/pools`
- Review resource usage on VeloFlux instances and backend servers.
- Check Redis performance and connection pool settings.
- Verify network latency between VeloFlux and backends:

```bash
# Check backend health
curl -H "Authorization: Bearer <token>" http://localhost:9000/api/health/backends

# Test backend connectivity directly
curl -v --connect-timeout 5 http://backend-server.example.com
```

### Tenant Isolation Issues
- Verify tenant routing is configured correctly.
- Check that tenant pools do not have overlapping backends.
- Ensure Redis keys are properly namespaced for each tenant.

```bash
# List Redis keys for a specific tenant
redis-cli -h localhost -p 6379 keys "tenant:<tenant-id>:*"
```

### Rate Limiting Not Working
- Check Redis connectivity and configuration for rate limit storage.
- Verify rate limit settings for the tenant or route:

```bash
# Check tenant rate limit configuration
curl -H "Authorization: Bearer <token>" \
  http://localhost:9000/api/tenants/<tenant-id>/rate-limit
```

## Monitoring and Logging

### Debug Logging
Enable debug logging for detailed troubleshooting:

```bash
# Set environment variable before starting
export VFX_LOG_LEVEL=debug
docker-compose up -d

# Or update a running container
docker-compose exec veloflux sh -c 'export VFX_LOG_LEVEL=debug && kill -USR1 1'
```

### Checking Logs
Logs are output in structured JSON format for easy parsing:

```bash
# View all logs
docker-compose logs -f veloflux

# Filter tenant-specific logs (multi-tenant mode)
docker-compose logs -f veloflux | grep 'tenant_id":"tenant1"'

# Filter by error level
docker-compose logs -f veloflux | grep '"level":"error"'
```

### Metrics
Check performance metrics for insights into system health:

```bash
# Global metrics
curl http://localhost:8080/metrics

# Tenant-specific metrics (multi-tenant mode)
curl http://localhost:8080/metrics/tenants/<tenant-id>
```

## Disaster Recovery

### Redis Failover
If Redis becomes unavailable, VeloFlux will attempt to reconnect:

```bash
# Check Redis Sentinel status
redis-cli -h sentinel -p 26379 sentinel master veloflux

# Force a Redis master failover (testing)
redis-cli -h sentinel -p 26379 sentinel failover veloflux
```

### Configuration Backup and Restore
Always back up your configuration regularly:

```bash
# Export configuration
curl -H "Authorization: Bearer <token>" \
  http://localhost:9000/api/config/export > veloflux-backup.json

# Import configuration
curl -X POST -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  --data-binary @veloflux-backup.json \
  http://localhost:9000/api/config/import
```

## Getting Help
If you encounter issues not covered here:
- Check the [GitHub repository](https://github.com/eltonciatto/VeloFlux) for recent issues.
- Run in debug mode and provide log output when reporting issues.
- For SaaS deployments, consider enabling the built-in diagnostics dashboard.
- Open a GitHub issue with relevant log excerpts, configuration snippets, and your environment details.

