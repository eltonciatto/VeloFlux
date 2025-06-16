# VeloFlux Domain and Port Testing Guide

This document provides guidance for comprehensive domain and port testing in VeloFlux environments.

## Available Testing Scripts

VeloFlux includes several scripts for thorough port and domain testing:

1. **Enhanced Domain Test** (`enhanced_domain_test.sh`)
   - Latest and most comprehensive domain testing script
   - Tests both single domains and multi-domain configurations
   - Validates domain-specific routing, load balancing, and metrics

2. **Comprehensive Port/Domain Test** (`port_domain_test_comprehensive.sh`)
   - Tests basic port connectivity
   - Validates domain configuration
   - Checks load balancing and HTTP headers

3. **Multi-Domain Test** (`test_multidomains.sh`)
   - Focuses on virtual host functionality
   - Tests domain separation and content differences
   - Checks wildcard domain support

## Testing Capabilities

### Domain Validation

- **Single Domain Testing**: Validates that a single domain is properly configured
- **Subdomain Testing**: Ensures subdomains are correctly routed
- **Wildcard Domain Support**: Tests if wildcard domains are functioning properly
- **Domain Separation**: Validates that different domains serve different content
- **Path-Based Routing**: Tests routing based on URL paths

### HTTP Features

- **Protocol Support**: Tests both HTTP and HTTPS endpoints
- **HTTP Headers**: Validates proper headers are returned
- **Error Handling**: Tests 404, 400, and other error scenarios
- **Redirection**: Validates HTTP to HTTPS redirects and other redirection rules

### Load Balancing

- **Backend Distribution**: Verifies requests are distributed across backends
- **Session Persistence**: Tests sticky session functionality
- **Concurrent Requests**: Validates handling of simultaneous requests

### Metrics and Monitoring

- **Domain-Specific Metrics**: Checks if metrics are collected per domain
- **Performance Tracking**: Validates latency and response time metrics
- **Error Rate Monitoring**: Tests error collection and reporting

## How to Use the Scripts

### Basic Usage

```bash
# Run enhanced domain testing
./scripts/enhanced_domain_test.sh

# Run comprehensive port and domain testing
./scripts/port_domain_test_comprehensive.sh

# Test multi-domain configurations
./scripts/test_multidomains.sh
```

### Advanced Options

The enhanced domain test script supports several options:

```bash
# Run in brief mode (less verbose output)
./scripts/enhanced_domain_test.sh --brief

# Change the number of requests for load testing
./scripts/enhanced_domain_test.sh --requests 100

# Modify the concurrent request count
./scripts/enhanced_domain_test.sh --concurrent 20

# Change the request timeout
./scripts/enhanced_domain_test.sh --timeout 10
```

## Interpreting Test Results

Each script provides detailed output with pass/fail information for each test. At the end, a summary shows:

- Total number of tests executed
- Number of tests passed/failed/skipped
- Success rate as a percentage
- Duration of the test run

The scripts also record detailed logs in `/tmp/` that you can examine for debugging.

## Common Issues and Solutions

### VeloFlux Not Responding

If the tests report that VeloFlux is not responding:

1. Check if VeloFlux is running: `docker-compose ps`
2. Ensure ports are correctly configured in `config.yaml`
3. Check logs for errors: `docker-compose logs veloflux`

### Domain Not Found Errors

If domains are not resolving correctly:

1. Verify the domains are defined in `config.yaml`
2. Check the routing configuration in the VeloFlux configuration
3. Ensure your test environment is correctly setting the `Host` header

### Load Balancing Issues

If load balancing tests fail:

1. Verify multiple backends are defined in the configuration
2. Check if health checks are passing for the backends
3. Review the load balancing algorithm configuration

## Extending the Tests

The test scripts are designed to be easily extended. To add new tests:

1. Create new test functions in the script
2. Add your new test function to the main function
3. Follow the existing patterns for logging and result tracking

## Conclusion

Regular domain and port testing ensures your VeloFlux installation is functioning properly. Using these scripts as part of your CI/CD pipeline or regular maintenance routine will help catch configuration issues early and maintain high availability of your services.
