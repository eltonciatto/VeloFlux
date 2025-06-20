#!/bin/bash

# VeloFlux API Testing Script
# Test all Tenant and Billing APIs with JWT authentication

set -e  # Exit on any error

# Configuration
API_BASE="http://localhost:9090"
TEST_EMAIL="test@veloflux.io"
TEST_PASSWORD="testpassword123"
TEST_TENANT_NAME="Test Tenant"
ADMIN_EMAIL="admin@veloflux.io"
ADMIN_PASSWORD="adminpassword123"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth_header=$4
    local expected_status=$5
    local description=$6
    
    log_info "Testing: $description"
    log_info "  Method: $method"
    log_info "  Endpoint: $endpoint"
    
    if [ -n "$data" ]; then
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -H "$auth_header" \
                -d "$data" \
                "$API_BASE$endpoint")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "Content-Type: application/json" \
                -d "$data" \
                "$API_BASE$endpoint")
        fi
    else
        if [ -n "$auth_header" ]; then
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                -H "$auth_header" \
                "$API_BASE$endpoint")
        else
            response=$(curl -s -w "HTTPSTATUS:%{http_code}" -X "$method" \
                "$API_BASE$endpoint")
        fi
    fi
    
    # Extract body and status
    body=$(echo "$response" | sed -E 's/HTTPSTATUS\:[0-9]{3}$//')
    status=$(echo "$response" | tr -d '\n' | sed -E 's/.*HTTPSTATUS:([0-9]{3})$/\1/')
    
    echo "  Response Status: $status"
    echo "  Response Body: $body"
    
    if [ "$status" = "$expected_status" ]; then
        log_success "✓ Test passed (Expected: $expected_status, Got: $status)"
        echo "$body"
        return 0
    else
        log_error "✗ Test failed (Expected: $expected_status, Got: $status)"
        echo "$body"
        return 1
    fi
}

# Global variables for storing tokens and IDs
JWT_TOKEN=""
TENANT_ID=""
ADMIN_JWT_TOKEN=""
SUBSCRIPTION_ID=""

echo "=============================================="
echo "🚀 VeloFlux API Testing Suite"
echo "=============================================="

# Test 1: Health Check
log_info "\n📋 Test 1: Health Check"
test_endpoint "GET" "/api/health" "" "" "200" "Health check endpoint"

# Test 2: Root endpoint
log_info "\n📋 Test 2: Root Endpoint"
test_endpoint "GET" "/" "" "" "200" "Root API endpoint"

# Test 3: Register new tenant
log_info "\n📋 Test 3: Register New Tenant"
register_data='{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'",
    "first_name": "Test",
    "last_name": "User",
    "tenant_name": "'$TEST_TENANT_NAME'",
    "plan": "basic"
}'

register_response=$(test_endpoint "POST" "/auth/register" "$register_data" "" "201" "Register new tenant")
if [ $? -eq 0 ]; then
    JWT_TOKEN=$(echo "$register_response" | jq -r '.token // empty')
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        log_success "JWT Token extracted: ${JWT_TOKEN:0:50}..."
        # Extract tenant ID from token (basic decode)
        # Note: This is a simple extraction, in production you'd properly decode the JWT
        TENANT_ID="test-tenant-id"  # We'll set this manually for testing
    else
        log_warning "Could not extract JWT token from response"
    fi
fi

# Test 4: Login with registered user
log_info "\n📋 Test 4: Login with Registered User"
login_data='{
    "email": "'$TEST_EMAIL'",
    "password": "'$TEST_PASSWORD'"
}'

login_response=$(test_endpoint "POST" "/api/auth/login" "$login_data" "" "200" "Login with registered user")
if [ $? -eq 0 ]; then
    JWT_TOKEN=$(echo "$login_response" | jq -r '.token // empty')
    if [ -n "$JWT_TOKEN" ] && [ "$JWT_TOKEN" != "null" ]; then
        log_success "Login successful, JWT Token: ${JWT_TOKEN:0:50}..."
    fi
fi

# Test 5: Refresh JWT Token
if [ -n "$JWT_TOKEN" ]; then
    log_info "\n📋 Test 5: Refresh JWT Token"
    test_endpoint "POST" "/auth/refresh" "" "Authorization: Bearer $JWT_TOKEN" "200" "Refresh JWT token"
fi

# Test 6: List Tenants (authenticated)
if [ -n "$JWT_TOKEN" ]; then
    log_info "\n📋 Test 6: List Tenants (Authenticated)"
    test_endpoint "GET" "/tenants" "" "Authorization: Bearer $JWT_TOKEN" "200" "List tenants with authentication"
fi

# Test 7: Create Admin User
log_info "\n📋 Test 7: Register Admin User"
admin_register_data='{
    "email": "'$ADMIN_EMAIL'",
    "password": "'$ADMIN_PASSWORD'",
    "first_name": "Admin",
    "last_name": "User",
    "tenant_name": "Admin Tenant",
    "plan": "enterprise"
}'

admin_register_response=$(test_endpoint "POST" "/auth/register" "$admin_register_data" "" "201" "Register admin user")
if [ $? -eq 0 ]; then
    ADMIN_JWT_TOKEN=$(echo "$admin_register_response" | jq -r '.token // empty')
    if [ -n "$ADMIN_JWT_TOKEN" ] && [ "$ADMIN_JWT_TOKEN" != "null" ]; then
        log_success "Admin JWT Token extracted: ${ADMIN_JWT_TOKEN:0:50}..."
    fi
fi

# Test 8: Create Tenant (Admin operation)
if [ -n "$ADMIN_JWT_TOKEN" ]; then
    log_info "\n📋 Test 8: Create Tenant (Admin Operation)"
    create_tenant_data='{
        "name": "New Test Tenant",
        "plan": "pro",
        "owner_email": "owner@newtest.com",
        "owner_name": "New Owner"
    }'
    
    test_endpoint "POST" "/tenants" "$create_tenant_data" "Authorization: Bearer $ADMIN_JWT_TOKEN" "201" "Create new tenant (admin)"
fi

# Test 9: Billing - List Subscriptions
if [ -n "$JWT_TOKEN" ]; then
    log_info "\n📋 Test 9: List Subscriptions"
    test_endpoint "GET" "/billing/subscriptions" "" "Authorization: Bearer $JWT_TOKEN" "200" "List subscriptions"
fi

# Test 10: Billing - Create Subscription
if [ -n "$JWT_TOKEN" ]; then
    log_info "\n📋 Test 10: Create Subscription"
    create_subscription_data='{
        "plan": "pro",
        "billing_cycle": "monthly"
    }'
    
    subscription_response=$(test_endpoint "POST" "/billing/subscriptions" "$create_subscription_data" "Authorization: Bearer $JWT_TOKEN" "201" "Create new subscription")
    if [ $? -eq 0 ]; then
        SUBSCRIPTION_ID=$(echo "$subscription_response" | jq -r '.id // empty')
        if [ -n "$SUBSCRIPTION_ID" ] && [ "$SUBSCRIPTION_ID" != "null" ]; then
            log_success "Subscription ID extracted: $SUBSCRIPTION_ID"
        fi
    fi
fi

# Test 11: Billing - Get Subscription
if [ -n "$JWT_TOKEN" ] && [ -n "$SUBSCRIPTION_ID" ]; then
    log_info "\n📋 Test 11: Get Subscription"
    test_endpoint "GET" "/billing/subscriptions/$SUBSCRIPTION_ID" "" "Authorization: Bearer $JWT_TOKEN" "200" "Get subscription details"
fi

# Test 12: Billing - Update Subscription
if [ -n "$JWT_TOKEN" ] && [ -n "$SUBSCRIPTION_ID" ]; then
    log_info "\n📋 Test 12: Update Subscription"
    update_subscription_data='{
        "plan": "enterprise"
    }'
    
    test_endpoint "PUT" "/billing/subscriptions/$SUBSCRIPTION_ID" "$update_subscription_data" "Authorization: Bearer $JWT_TOKEN" "200" "Update subscription"
fi

# Test 13: Billing - List Invoices
if [ -n "$JWT_TOKEN" ]; then
    log_info "\n📋 Test 13: List Invoices"
    test_endpoint "GET" "/billing/invoices" "" "Authorization: Bearer $JWT_TOKEN" "200" "List invoices"
fi

# Test 14: Billing - Webhook (Public endpoint)
log_info "\n📋 Test 14: Billing Webhook"
webhook_data='{
    "event": "payment.succeeded",
    "subscription_id": "sub_test_123",
    "amount": 2999,
    "currency": "usd"
}'

test_endpoint "POST" "/billing/webhook" "$webhook_data" "" "200" "Process billing webhook"

# Test 15: Authentication Tests - Invalid token
log_info "\n📋 Test 15: Invalid Authentication Test"
test_endpoint "GET" "/tenants" "" "Authorization: Bearer invalid_token" "401" "Access with invalid token (should fail)"

# Test 16: Authorization Tests - Insufficient permissions
log_info "\n📋 Test 16: Authorization Test"
if [ -n "$JWT_TOKEN" ]; then
    # Try to create tenant with regular user token (should fail)
    create_tenant_data='{
        "name": "Unauthorized Tenant",
        "plan": "basic",
        "owner_email": "unauthorized@test.com",
        "owner_name": "Unauthorized User"
    }'
    
    test_endpoint "POST" "/tenants" "$create_tenant_data" "Authorization: Bearer $JWT_TOKEN" "403" "Create tenant with insufficient permissions (should fail)"
fi

# Test 17: Redis Integration Test
log_info "\n📋 Test 17: Redis Integration Verification"
if [ -n "$JWT_TOKEN" ]; then
    # Make a request that should interact with Redis (tenant operations)
    test_endpoint "GET" "/tenants?page=1&page_size=5" "" "Authorization: Bearer $JWT_TOKEN" "200" "Test pagination (Redis cache interaction)"
fi

echo ""
echo "=============================================="
echo "🎯 API Testing Completed"
echo "=============================================="
echo "📊 Check the results above for any failures"
echo "🔍 Verify Redis integration by checking Redis logs"
echo "📋 All major API endpoints have been tested"
echo "=============================================="
