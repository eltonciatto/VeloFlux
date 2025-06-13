# Security Hardening

VeloFlux ships with sensible defaults but production deployments should follow these recommendations.

## Built‑in protections
- **Rate limiting** using a token bucket per client IP
- **TLS termination** with automatic certificate renewal
- **Web Application Firewall** via Coraza and the OWASP CRS
- **JWT authentication** for the admin API

## Additional best practices
1. Run VeloFlux behind a dedicated firewall and restrict access to the admin API.
2. Rotate your `jwt_secret` periodically and store it securely.
3. Keep the GeoIP and WAF rule databases up to date.
4. Configure resource limits for the container to mitigate denial‑of‑service attacks.

## Operating system hardening
- Disable unused services and close all non‑essential ports.
- Apply the latest security patches to the host OS.

Refer to your container platform's documentation for further hardening steps.

