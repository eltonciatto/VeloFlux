# Security Features

VeloFlux includes comprehensive security features throughout the stack, from the user interface to the underlying infrastructure, making it suitable for production deployments in environments with strict security requirements.

## Built-in Protections

### Network and Infrastructure
- **Rate limiting** - Configurable per tenant, path and IP address
- **TLS termination** - Automatic certificate management with Let's Encrypt
- **Web Application Firewall** - Coraza implementation of OWASP CRS with tenant-specific rule levels
- **HTTP Security Headers** - CSP, X-Frame-Options, X-XSS-Protection automatically applied

### Authentication and Authorization
- **JWT authentication** - All API endpoints protected with short-lived tokens
- **Role-Based Access Control** - Tenant-specific roles (owner, member, viewer)
- **Password security** - Bcrypt hashing with enforced complexity requirements
- **CSRF Protection** - Token-based protection for all state-changing operations
- **Cookie security** - HttpOnly and Secure flags enforced for authentication cookies
- **Login rate limiting** - Protection against brute force attacks

### Multi-tenant Security
- **Tenant isolation** - Complete logical separation of tenant configuration and data
- **Role-scoped APIs** - API endpoints restricted based on user's role within a tenant
- **Resource quotas** - Plan-based limits on requests, backends, and configuration

## Secure Defaults and Best Practices

1. **Authentication**
   - Auto-rotating refresh tokens
   - Automatic token renewal
   - Token validation with proper `aud`, `iss` and expiration checks
   - Support for external OIDC providers

2. **Data Protection**
   - Input sanitization for all user inputs
   - Output encoding to prevent XSS
   - Tenant-specific data encryption keys
   - Per-tenant logging with data masking

3. **Network Configuration**
   - Connection draining for graceful shutdowns
   - Dynamic health checks for backend verification
   - IP allowlisting capabilities
   - Support for mutual TLS (mTLS) between services

## Security Recommendations for Production

1. **Environment Hardening**
   - Run VeloFlux behind a WAF/DDoS protection service (Cloudflare, AWS Shield)
   - Restrict access to admin interfaces with IP-based rules
   - Deploy in private subnets with controlled ingress/egress
   - Use container security scanning and rootless containers

2. **Operational Security**
   - Rotate `jwt_secret` and other sensitive credentials regularly
   - Keep all WAF rule databases up to date
   - Update GeoIP databases monthly
   - Implement a patch management process for dependencies

3. **Monitoring and Response**
   - Enable security event logging
   - Set up alerts for suspicious activity
   - Conduct regular security testing
   - Establish an incident response plan

4. **Compliance**
   - Configure tenant-specific data retention policies
   - Implement audit logging for compliance reporting
   - Use tenant-specific security settings for different compliance requirements

## External Security Reviews

VeloFlux's security architecture is designed according to industry best practices. We recommend regular third-party security assessments for production deployments in regulated environments.

For detailed implementation of recent security improvements, refer to the internal documentation in `docs/security_improvements.md`.

