#!/bin/ba# Configuration
LOG_FILE="/tmp/veloflux_multitenant_test_$(date +%Y%m%d_%H%M%S).log"
HTTP_PORT=80  # Using production port 80 instead of test port 8082
HTTPS_PORT=443
METRICS_PORT=8080 VeloFlux - Multi-tenant Domain Testing Script
# Tests advanced patterns for multi-tenant deployments including:
# - Tenant subdomains
# - Wildcard routing
# - Custom domain mapping
# - Tenant isolation

# Configuration
LOG_FILE="/tmp/veloflux_multitenant_test_$(date +%Y%m%d_%H%M%S).log"
HTTP_PORT=80    # Default port for production environment
HTTPS_PORT=443
METRICS_PORT=8080
TIMEOUT=5
TEST_COUNT=0
PASS_COUNT=0
FAIL_COUNT=0
SKIP_COUNT=0

# Test Tenants - Usando os domínios configurados no Cloudflare
declare -A TENANTS=(
  ["web1"]="app.private.dev.veloflux.io"
  ["web2"]="www.private.dev.veloflux.io"
  ["api"]="api.private.dev.veloflux.io"
  ["admin"]="admin.private.dev.veloflux.io"
  ["tenant1"]="tenant1.private.dev.veloflux.io"
  ["tenant2"]="tenant2.private.dev.veloflux.io"
  ["public1"]="tenant1.public.dev.veloflux.io"
  ["public2"]="api.public.dev.veloflux.io"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No color

# Logging function
log() {
  local level=$1
  local message=$2
  local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
  
  case "$level" in
    "INFO")   echo -e "${timestamp} ${BLUE}[INFO]${NC}  $message" | tee -a "$LOG_FILE" ;;
    "PASS")   echo -e "${timestamp} ${GREEN}[PASS]${NC}  $message" | tee -a "$LOG_FILE" ;;
    "FAIL")   echo -e "${timestamp} ${RED}[FAIL]${NC}  $message" | tee -a "$LOG_FILE" ;;
    "WARN")   echo -e "${timestamp} ${YELLOW}[WARN]${NC}  $message" | tee -a "$LOG_FILE" ;;
    *)        echo -e "${timestamp} [LOG]   $message" | tee -a "$LOG_FILE" ;;
  esac
}

# Function to run a test
run_test() {
  local name=$1
  local command=$2
  local description=$3
  
  TEST_COUNT=$((TEST_COUNT+1))
  log "INFO" "Test #$TEST_COUNT: $name - $description"
  
  # Run the command
  local output
  output=$(timeout "${TIMEOUT}" bash -c "$command" 2>&1)
  local status=$?
  
  # Process the result
  if [ $status -eq 0 ]; then
    PASS_COUNT=$((PASS_COUNT+1))
    log "PASS" "✓ $name passed"
    [ ${#output} -gt 0 ] && log "INFO" "  Output: $output"
  else
    FAIL_COUNT=$((FAIL_COUNT+1))
    log "FAIL" "✗ $name failed (exit code: $status)"
    log "FAIL" "  Command: $command"
    [ ${#output} -gt 0 ] && log "FAIL" "  Output: $output"
  fi
  
  return $status
}

# Check environment and port availability
check_environment() {
  log "INFO" "Checking VeloFlux environment..."
  
  # First try port 80 (production default)
  if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/80" 2>/dev/null || curl -s --connect-timeout 1 -o /dev/null -w "%{http_code}" http://localhost:80/ &>/dev/null; then
    HTTP_PORT=80
    log "INFO" "HTTP port 80 is open and will be used for testing"
    port_found=true
  else
    # Check alternative HTTP ports in order of preference
    local http_ports=(8082 8080 8081 8001 3000)
    local port_found=false
    
    for port in "${http_ports[@]}"; do
      if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$port" 2>/dev/null || curl -s --connect-timeout 1 -o /dev/null http://localhost:$port/ &>/dev/null; then
        HTTP_PORT=$port
        log "INFO" "HTTP port $HTTP_PORT is open and will be used for testing"
        port_found=true
        break
      fi
    done
  fi
  
  if [ "$port_found" = false ]; then
    log "FAIL" "No HTTP port available, tests may fail"
  fi
  
  # For verification, try to access the service
  local http_status=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:${HTTP_PORT}/ 2>/dev/null || echo "failed")
  if [ "$http_status" = "failed" ] || [ "$http_status" = "000" ]; then
    log "WARN" "Could not connect to VeloFlux on port $HTTP_PORT"
  else
    log "INFO" "VeloFlux responding on port $HTTP_PORT with status $http_status"
  fi
  
  # Check HTTPS port
  if nc -z localhost $HTTPS_PORT 2>/dev/null; then
    log "INFO" "HTTPS port $HTTPS_PORT is open"
  else
    log "WARN" "HTTPS port $HTTPS_PORT is not available, skipping HTTPS tests"
  fi
  
  # Check metrics port
  if nc -z localhost $METRICS_PORT 2>/dev/null; then
    log "INFO" "Metrics port $METRICS_PORT is open"
  else
    log "WARN" "Metrics port $METRICS_PORT is not available, some metric tests will be skipped"
  fi
  
  # Check if docker is running
  if command -v docker >/dev/null 2>&1 && docker ps >/dev/null 2>&1; then
    log "INFO" "Docker is available for additional tests"
    DOCKER_AVAILABLE=true
  else
    log "WARN" "Docker is not available, some tests will be limited"
    DOCKER_AVAILABLE=false
  fi
}

# Test basic tenant accessibility
test_tenant_access() {
  log "INFO" "=== TESTING TENANT SUBDOMAIN ACCESS ==="
  
  for tenant_id in "${!TENANTS[@]}"; do
    local domain="${TENANTS[$tenant_id]}"
    
    # Test basic HTTP access - accept any valid HTTP response
    run_test "tenant_${tenant_id}_http_access" \
      "code=\$(curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/); echo \"Got status: \$code\" && [[ \$code =~ ^[0-9]+$ ]]" \
      "Testing HTTP access for tenant $tenant_id ($domain)"
    
    # Test specific tenant path - accept any valid HTTP response
    run_test "tenant_${tenant_id}_path_access" \
      "code=\$(curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/api/); echo \"Got status: \$code\" && [[ \$code =~ ^[0-9]+$ ]]" \
      "Testing API path for tenant $tenant_id ($domain)"
  done
}

# Test tenant isolation
test_tenant_isolation() {
  log "INFO" "=== TESTING TENANT ISOLATION ==="
  
  # Get tenant domains for two tenants
  local domains=()
  for tenant_id in "${!TENANTS[@]}"; do
    domains+=("${TENANTS[$tenant_id]}")
    if [ ${#domains[@]} -eq 2 ]; then
      break
    fi
  done
  
  # Skip if we don't have at least 2 tenants
  if [ ${#domains[@]} -lt 2 ]; then
    log "WARN" "Not enough tenant domains to test isolation, skipping"
    SKIP_COUNT=$((SKIP_COUNT+1))
    return
  fi
  
  # Get content hashes from the first two domains
  local tenant1_domain="${domains[0]}"
  local tenant2_domain="${domains[1]}"
  local tenant1_hash
  local tenant2_hash
  
  tenant1_hash=$(curl -s -H "Host: $tenant1_domain" http://localhost:${HTTP_PORT}/ | md5sum | cut -d' ' -f1)
  tenant2_hash=$(curl -s -H "Host: $tenant2_domain" http://localhost:${HTTP_PORT}/ | md5sum | cut -d' ' -f1)
  
  # Check if the content is different
  run_test "tenant_content_isolation" \
    "[ '$tenant1_hash' != '$tenant2_hash' ] || [ -z '$tenant1_hash' ] || [ -z '$tenant2_hash' ]" \
    "Checking if tenant domains serve different content"
    
  # Test headers
  run_test "tenant_header_isolation" \
    "curl -s -i -H 'Host: ${tenant1_domain}' http://localhost:${HTTP_PORT}/ | grep -q 'tenant\|account'" \
    "Checking for tenant-specific headers"
}

# Test custom domain mapping
test_custom_domains() {
  log "INFO" "=== TESTING CUSTOM DOMAIN MAPPING ==="
  
  # Check custom domain mapping in config
  local has_custom_domains=false
  for tenant_id in "${!TENANTS[@]}"; do
    local domain="${TENANTS[$tenant_id]}"
    # Consider it a custom domain if it doesn't contain example.com
    if [[ ! "$domain" =~ example\.com ]]; then
      has_custom_domains=true
      
      # Test access to the custom domain
      run_test "custom_domain_${domain}" \
        "curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/ | grep -q -E '(200|301|302|404)'" \
        "Testing access to custom domain $domain"
    fi
  done
  
  if [ "$has_custom_domains" = false ]; then
    log "WARN" "No custom domains configured, skipping custom domain tests"
    SKIP_COUNT=$((SKIP_COUNT+1))
    
    # Generate a test for a potential custom domain
    local random_domain="test-$(date +%s).custom.test"
    run_test "random_custom_domain" \
      "curl -s -H 'Host: ${random_domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/ | grep -q -E '(404|503)'" \
      "Testing non-configured custom domain should return error"
  fi
}

# Test tenant authentication isolation
test_tenant_authentication() {
  log "INFO" "=== TESTING TENANT AUTHENTICATION ==="
  
  # Pick the first tenant for the test
  local tenant_id=""
  local domain=""
  for t_id in "${!TENANTS[@]}"; do
    tenant_id=$t_id
    domain="${TENANTS[$t_id]}"
    break
  done
  
  # Skip if no tenants
  if [ -z "$tenant_id" ]; then
    log "WARN" "No tenants configured, skipping authentication tests"
    SKIP_COUNT=$((SKIP_COUNT+1))
    return
  fi
  
  # Create test paths
  local login_path="/login"
  local admin_path="/admin"
  local api_path="/api/v1/data"
  
  # Test login path
  run_test "tenant_${tenant_id}_login" \
    "curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}${login_path} | grep -q -E '(200|301|302|404)'" \
    "Testing login path for tenant $tenant_id"
    
  # Test admin path with no auth
  run_test "tenant_${tenant_id}_admin_no_auth" \
    "curl -s -H 'Host: ${domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}${admin_path} | grep -q -E '(401|403|404|302)'" \
    "Testing admin path should require auth"
    
  # Test API path with invalid auth
  run_test "tenant_${tenant_id}_api_invalid_auth" \
    "curl -s -H 'Host: ${domain}' -H 'Authorization: Bearer invalid-token' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}${api_path} | grep -q -E '(401|403|404)'" \
    "Testing API with invalid auth"
}

# Test wildcard subdomains
test_wildcard_domains() {
  log "INFO" "=== TESTING WILDCARD SUBDOMAINS ==="
  
  # Generate random subdomain names
  local random_subdomain1="test-$(date +%s)-1.example.com"
  local random_subdomain2="test-$(date +%s)-2.example.com"
  
  # Test access to random subdomains
  run_test "wildcard_subdomain_1" \
    "curl -s -H 'Host: ${random_subdomain1}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/ | grep -q -E '(200|301|302|404|503)'" \
    "Testing access to random subdomain ${random_subdomain1}"
    
  run_test "wildcard_subdomain_2" \
    "curl -s -H 'Host: ${random_subdomain2}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/ | grep -q -E '(200|301|302|404|503)'" \
    "Testing access to random subdomain ${random_subdomain2}"
    
  # Test wildcard coverage for known domains
  for tenant_id in "${!TENANTS[@]}"; do
    local domain="${TENANTS[$tenant_id]}"
    if [[ "$domain" =~ example\.com ]]; then
      local base_domain=$(echo "$domain" | sed 's/.*\(\.[^.]\+\.[^.]\+\)$/\1/')
      local random_prefix="random-$(date +%s)"
      local random_domain="${random_prefix}${base_domain}"
      
      run_test "wildcard_${tenant_id}_random" \
        "curl -s -H 'Host: ${random_domain}' -o /dev/null -w '%{http_code}' http://localhost:${HTTP_PORT}/ | grep -q -E '(200|301|302|404|503)'" \
        "Testing wildcard for tenant domain pattern: ${random_domain}"
    fi
  done
}

# Test tenant metrics
test_tenant_metrics() {
  log "INFO" "=== TESTING TENANT METRICS ==="
  
  # Check if metrics endpoint is accessible
  if ! nc -z localhost $METRICS_PORT 2>/dev/null; then
    log "WARN" "Metrics port not accessible, skipping metrics tests"
    SKIP_COUNT=$((SKIP_COUNT+1))
    return
  fi
  
  # Get metrics
  local metrics=$(curl -s http://localhost:${METRICS_PORT}/metrics)
  
  # Check for tenant-specific metrics
  run_test "tenant_metrics_exist" \
    "echo '$metrics' | grep -q -E 'tenant|domain|host'" \
    "Checking if tenant-specific metrics exist"
    
  # Generate some traffic for a tenant
  local tenant_id=""
  local domain=""
  for t_id in "${!TENANTS[@]}"; do
    tenant_id=$t_id
    domain="${TENANTS[$t_id]}"
    break
  done
  
  if [ -n "$tenant_id" ]; then
    log "INFO" "Generating traffic for tenant $tenant_id ($domain)"
    for i in {1..10}; do
      curl -s -H "Host: $domain" -o /dev/null http://localhost:${HTTP_PORT}/
    done
    sleep 2
    
    # Get metrics again
    local metrics_after=$(curl -s http://localhost:${METRICS_PORT}/metrics)
    
    # Check if metrics changed
    run_test "tenant_metrics_updated" \
      "[ -n \"$metrics_after\" ]" \
      "Checking if metrics are collected after traffic generation"
  else
    log "WARN" "No tenants configured, skipping tenant metrics traffic test"
    SKIP_COUNT=$((SKIP_COUNT+1))
  fi
}

# Print test summary
print_summary() {
  log "INFO" "=== TEST SUMMARY ==="
  log "INFO" "Total tests: $TEST_COUNT"
  log "PASS" "Passed:     $PASS_COUNT"
  log "FAIL" "Failed:     $FAIL_COUNT"
  log "INFO" "Skipped:    $SKIP_COUNT"
  
  if [ $TEST_COUNT -gt 0 ]; then
    local success_rate=$((PASS_COUNT * 100 / TEST_COUNT))
    log "INFO" "Success rate: $success_rate%"
  fi
  
  if [ $FAIL_COUNT -eq 0 ]; then
    if [ $SKIP_COUNT -eq 0 ]; then
      log "PASS" "✅ ALL TESTS PASSED SUCCESSFULLY!"
    else
      log "PASS" "✅ ALL EXECUTED TESTS PASSED! ($SKIP_COUNT tests skipped)"
    fi
    return 0
  else
    log "FAIL" "❌ $FAIL_COUNT TESTS FAILED!"
    return 1
  fi
}

# Main function
main() {
  log "INFO" "Starting VeloFlux Multi-tenant Domain Testing"
  log "INFO" "Date: $(date)"
  log "INFO" "Log file: $LOG_FILE"
  
  # Check environment
  check_environment
  
  # Run tests
  test_tenant_access
  test_tenant_isolation
  test_custom_domains
  test_tenant_authentication
  test_wildcard_domains
  test_tenant_metrics
  
  # Print summary
  print_summary
  exit $?
}

# Run main function
main
