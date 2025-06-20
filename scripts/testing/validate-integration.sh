#!/bin/bash

# VeloFlux Integration Validation Script
# Tests all major components and APIs

echo "🚀 VeloFlux Integration Validation Started"
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to check HTTP response
check_http() {
    local url=$1
    local expected_code=${2:-200}
    local auth=${3:-""}
    local description=$4
    
    echo -n "Testing $description... "
    
    if [ -n "$auth" ]; then
        response=$(curl -s -o /dev/null -w "%{http_code}" -u "$auth" "$url")
    else
        response=$(curl -s -o /dev/null -w "%{http_code}" "$url")
    fi
    
    if [ "$response" -eq "$expected_code" ]; then
        echo -e "${GREEN}✓ PASS${NC} ($response)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (expected $expected_code, got $response)"
        return 1
    fi
}

# Function to check JSON response
check_json() {
    local url=$1
    local auth=${2:-""}
    local description=$3
    
    echo -n "Testing $description... "
    
    if [ -n "$auth" ]; then
        response=$(curl -s -u "$auth" "$url")
    else
        response=$(curl -s "$url")
    fi
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC} (valid JSON)"
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (invalid JSON: $response)"
        return 1
    fi
}

# Test counters
PASS_COUNT=0
FAIL_COUNT=0

# Function to increment counters
pass_test() {
    ((PASS_COUNT++))
}

fail_test() {
    ((FAIL_COUNT++))
}

echo -e "\n${BLUE}1. Container Health Tests${NC}"
echo "------------------------"

# Check container status
echo "Checking container status..."
if docker-compose ps | grep -E "(Up|healthy)" >/dev/null 2>&1; then
    pass_test
else
    fail_test
fi

echo -e "\n${BLUE}2. Frontend Tests${NC}"
echo "----------------"

# Frontend via direct port
check_http "http://localhost:3000" 200 "" "Frontend direct access" && pass_test || fail_test

# Frontend via loadbalancer
check_http "http://localhost" 200 "" "Frontend via loadbalancer" && pass_test || fail_test

# Frontend health endpoint
check_http "http://localhost:3000/health" 200 "" "Frontend health endpoint" && pass_test || fail_test

echo -e "\n${BLUE}3. Backend API Tests${NC}"
echo "------------------"

# Backend direct health
check_http "http://localhost:9090/api/health" 200 "" "Backend health endpoint" && pass_test || fail_test

# Backend metrics
check_http "http://localhost:8080/metrics" 200 "" "Backend metrics endpoint" && pass_test || fail_test

# Backend API with auth
check_json "http://localhost:9090/api/pools" "admin:veloflux-admin-password" "Backend pools API" && pass_test || fail_test

echo -e "\n${BLUE}4. AI/ML API Tests${NC}"
echo "----------------"

# AI health endpoint
check_json "http://localhost:9090/api/ai/health" "" "AI health endpoint" && pass_test || fail_test

# AI metrics endpoint
check_json "http://localhost:9090/api/ai/metrics" "" "AI metrics endpoint" && pass_test || fail_test

# AI status endpoint
check_json "http://localhost:9090/api/ai/status" "" "AI status endpoint" && pass_test || fail_test

echo -e "\n${BLUE}5. Loadbalancer Tests${NC}"
echo "-------------------"

# Loadbalancer health
check_http "http://localhost/health" 200 "" "Loadbalancer health endpoint" && pass_test || fail_test

# API routing through loadbalancer
check_http "http://localhost/api/health" 200 "" "API routing via loadbalancer" && pass_test || fail_test

echo -e "\n${BLUE}6. Monitoring Stack Tests${NC}"
echo "------------------------"

# Grafana (302 redirect is normal)
check_http "http://localhost:3001" 302 "" "Grafana dashboard" && pass_test || fail_test

# Prometheus (302 redirect is normal)
check_http "http://localhost:9091" 302 "" "Prometheus metrics server" && pass_test || fail_test

echo -e "\n${BLUE}7. Database/Cache Tests${NC}"
echo "---------------------"

# Redis health
echo -n "Testing Redis connectivity... "
if docker exec veloflux-redis redis-cli ping | grep -q PONG; then
    echo -e "${GREEN}✓ PASS${NC}"
    pass_test
else
    echo -e "${RED}✗ FAIL${NC}"
    fail_test
fi

echo -e "\n${BLUE}8. Network Integration Tests${NC}"
echo "---------------------------"

# Test frontend can reach backend through internal network
echo -n "Testing internal network connectivity... "
if docker exec veloflux-frontend nc -z backend 9090 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} (frontend can reach backend)"
    pass_test
else
    echo -e "${RED}✗ FAIL${NC} (frontend cannot reach backend)"
    fail_test
fi

# Test loadbalancer can reach frontend
echo -n "Testing loadbalancer to frontend connectivity... "
if docker exec veloflux-lb nc -z frontend 80 2>/dev/null; then
    echo -e "${GREEN}✓ PASS${NC} (loadbalancer can reach frontend)"
    pass_test
else
    echo -e "${RED}✗ FAIL${NC} (loadbalancer cannot reach frontend)"
    fail_test
fi

echo -e "\n${BLUE}9. Frontend React Integration Tests${NC}"
echo "------------------------------------"

# Test if React app is properly built and served
echo -n "Testing React app assets... "
if curl -s "http://localhost:3000" | grep -q "assets/index"; then
    echo -e "${GREEN}✓ PASS${NC} (React app properly built)"
    pass_test
else
    echo -e "${RED}✗ FAIL${NC} (React app not properly built)"
    fail_test
fi

# Test SPA routing
echo -n "Testing SPA routing... "
if curl -s "http://localhost:3000/dashboard" | grep -q "<!DOCTYPE html>"; then
    echo -e "${GREEN}✓ PASS${NC} (SPA routing works)"
    pass_test
else
    echo -e "${RED}✗ FAIL${NC} (SPA routing broken)"
    fail_test
fi

echo -e "\n${YELLOW}=========================================${NC}"
echo -e "${YELLOW}Final Results${NC}"
echo -e "${YELLOW}=========================================${NC}"

TOTAL_TESTS=$((PASS_COUNT + FAIL_COUNT))

echo -e "Total tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASS_COUNT${NC}"
echo -e "${RED}Failed: $FAIL_COUNT${NC}"

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! VeloFlux is fully operational.${NC}"
    echo -e "${GREEN}✅ Frontend and Backend are properly integrated${NC}"
    echo -e "${GREEN}✅ All APIs are responding correctly${NC}"
    echo -e "${GREEN}✅ Load balancing is working${NC}"
    echo -e "${GREEN}✅ Monitoring stack is operational${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed, but core functionality may still work.${NC}"
    echo -e "${YELLOW}Check the failed tests above for issues.${NC}"
    exit 1
fi
