# Troubleshooting

## Common Issues

### Service does not start
- Check that the configuration file is valid YAML.
- Ensure the listening ports are not already in use.

### Cannot obtain TLS certificates
- Verify that ports 80 and 443 are accessible from the internet.
- Confirm the `acme_email` and domain names are correct.

### High latency or timeouts
- Inspect backend health status with `curl http://<admin>/api/pools`.
- Review resource usage on the host and backends.

## Logs
Logs are output in JSON format. Use `docker-compose logs -f veloflux` or your orchestrator's log viewer to inspect events.

## Getting help
If you run into issues not covered here, open a GitHub issue with the relevant log excerpts and configuration snippets.

