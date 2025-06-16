# VeloFlux Port, Domain, and Multi-tenant Testing Documentation

This repository contains a suite of testing scripts designed to validate the various aspects of VeloFlux's port, domain, and multi-tenant functionality.

## Available Testing Scripts

### 1. Enhanced Domain Test (`enhanced_domain_test.sh`)
The most comprehensive general-purpose testing script that covers:
- Single domain testing
- Subdomain functionality
- Multiple domain (virtual hosting) support
- Load balancing verification
- Error handling
- Domain-specific metrics

**Usage:**
```bash
./scripts/enhanced_domain_test.sh
```

**Options:**
- `--brief`: Enable brief mode (less verbose output)
- `--requests N`: Set number of requests for load testing (default: 50)
- `--concurrent N`: Set number of concurrent requests (default: 10) 
- `--timeout N`: Set request timeout in seconds (default: 5)

### 2. Comprehensive Port/Domain Test (`port_domain_test_comprehensive.sh`)
Focuses specifically on port connectivity and domain routing:
- Port availability testing
- Single domain connectivity
- Multiple subdomain testing
- Load balancing between backends
- HTTP header validation

**Usage:**
```bash
./scripts/port_domain_test_comprehensive.sh
```

### 3. Multi-domain Test (`test_multidomains.sh`)
Specialized for testing VirtualHost functionality:
- Domain separation testing
- Content differentiation
- Wildcard domain support
- Header customization

**Usage:**
```bash
./scripts/test_multidomains.sh
```

### 4. Multi-tenant Domain Test (`test_multitenant_domains.sh`)
Specifically designed for testing multi-tenant deployments:
- Tenant subdomain accessibility
- Tenant isolation
- Custom domain mapping
- Tenant-specific authentication
- Wildcard subdomain support
- Tenant metrics

**Usage:**
```bash
./scripts/test_multitenant_domains.sh
```

## Test Environment Setup

These scripts are designed to work in both development and production environments, but are primarily intended for testing in development.

### Prerequisites

1. A running instance of VeloFlux
2. Network access to the relevant ports:
   - HTTP (80 or 8082 for testing)
   - HTTPS (443)
   - Metrics (8080)
   - Admin API (9000)
3. Basic tools: bash, curl, nc (netcat)

### Environment Detection

The scripts will automatically detect the environment and available ports. For more accurate results, ensure:
- At least one backend server is running
- VeloFlux is properly configured with the domains you want to test
- Prometheus is running if testing metrics

## Interpreting Test Results

All scripts provide detailed information about:
- Number of tests executed
- Number of tests passed and failed
- Specific details about any failures
- Success rate percentage

### Common Issues and Solutions

**Port Connectivity:**
- If port tests fail, check if VeloFlux is running on the expected ports
- Verify that the necessary ports are exposed if running in Docker

**Domain Routing:**
- If domain tests fail, check domain configuration in config.yaml
- Ensure Host headers are being properly processed
- Check for wildcard domain support if you're testing subdomains

**Metrics:**
- If metrics tests fail, verify Prometheus is running
- Check that VeloFlux is exposing metrics on the expected port

## Extending the Tests

The test scripts are designed to be easily extended for specific testing needs:
1. Add new test functions
2. Update the domain lists as needed
3. Modify timeouts and request counts for load testing

## Best Practices

1. Run all tests after major configuration changes
2. Use the enhanced domain test for general validation
3. Use the multi-tenant test when testing tenant isolation features
4. Review logs for detailed error information
   - Logs are stored in /tmp/veloflux_*.log

## Conclusion

Regular domain and port testing helps ensure your VeloFlux installation is functioning correctly. Incorporate these tests into your CI/CD pipeline or run them manually after configuration changes to validate system behavior.
