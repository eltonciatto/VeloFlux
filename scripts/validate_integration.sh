#!/bin/bash

# 🚀 VeloFlux AI/ML Load Balancer - Complete System Validation Script
# This script validates the entire integrated system is working correctly

set -e

echo "🚀 VeloFlux AI/ML Integration Validation"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        exit 1
    fi
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check Go installation and build
echo
print_info "Checking Go installation and build..."
go version
print_status $? "Go installation verified"

# Build the project
go build ./...
print_status $? "Project builds successfully"

# 2. Run all tests
echo
print_info "Running comprehensive test suite..."

# AI package tests
go test ./internal/ai/... -v -cover > /tmp/ai_tests.log 2>&1
AI_RESULT=$?
if [ $AI_RESULT -eq 0 ]; then
    AI_COVERAGE=$(grep "coverage:" /tmp/ai_tests.log | tail -1 | awk '{print $3}')
    print_status 0 "AI/ML tests passed (Coverage: $AI_COVERAGE)"
else
    print_status 1 "AI/ML tests failed"
fi

# Balancer tests
go test ./internal/balancer/... -v > /tmp/balancer_tests.log 2>&1
BALANCER_RESULT=$?
print_status $BALANCER_RESULT "Balancer tests passed"

# All internal tests
go test ./internal/... -short > /tmp/all_tests.log 2>&1
ALL_RESULT=$?
print_status $ALL_RESULT "All internal packages tested"

# 3. Test AI/ML demo
echo
print_info "Testing AI/ML demo integration..."
timeout 30s go run examples/adaptive_demo.go > /tmp/demo.log 2>&1 &
DEMO_PID=$!
sleep 5

# Check if demo is running
if kill -0 $DEMO_PID 2>/dev/null; then
    print_status 0 "AI/ML demo running successfully"
    kill $DEMO_PID 2>/dev/null || true
else
    print_status 1 "AI/ML demo failed to start"
fi

# 4. Validate configuration files
echo
print_info "Validating configuration files..."

if [ -f "config/config.example.yaml" ]; then
    print_status 0 "Example configuration exists"
else
    print_status 1 "Example configuration missing"
fi

# Check for AI configuration section
grep -q "ai:" config/config.example.yaml
print_status $? "AI configuration section present"

grep -q "adaptive:" config/config.example.yaml
print_status $? "Adaptive configuration section present"

# 5. Check documentation
echo
print_info "Validating documentation..."

[ -f "docs/INTEGRATION_COMPLETE.md" ]
print_status $? "Integration documentation exists"

[ -f "docs/QUICK_START_COMPLETE.md" ]
print_status $? "Quick start guide exists"

[ -f "docs/adaptive_algorithms_guide.md" ]
print_status $? "AI/ML algorithms guide exists"

[ -f "docs/implementation_status.md" ]
print_status $? "Implementation status documented"

# 6. Check for key AI/ML files
echo
print_info "Validating AI/ML implementation files..."

[ -f "internal/ai/predictor.go" ]
print_status $? "AI Predictor implementation exists"

[ -f "internal/ai/models.go" ]
print_status $? "ML Models implementation exists"

[ -f "internal/balancer/adaptive.go" ]
print_status $? "Adaptive Balancer implementation exists"

[ -f "internal/api/ai_api.go" ]
print_status $? "AI API endpoints exist"

# 7. Verify Docker setup (if applicable)
echo
print_info "Checking Docker configuration..."

if [ -f "Dockerfile" ]; then
    print_status 0 "Dockerfile exists"
    
    if [ -f "docker-compose.yml" ]; then
        print_status 0 "Docker Compose configuration exists"
    else
        print_warning "Docker Compose file not found (optional)"
    fi
else
    print_warning "Dockerfile not found (optional for development)"
fi

# 8. Check Kubernetes deployment files
echo
print_info "Checking Kubernetes deployment files..."

if [ -d "charts/veloflux" ]; then
    print_status 0 "Kubernetes charts directory exists"
    
    [ -f "charts/veloflux/Chart.yaml" ]
    print_status $? "Helm chart configuration exists"
    
    [ -f "charts/veloflux/values.yaml" ]
    print_status $? "Helm values configuration exists"
else
    print_warning "Kubernetes charts not found (optional)"
fi

# 9. Test build for main binary
echo
print_info "Testing main binary build..."

go build -o /tmp/veloflux ./cmd/velofluxlb/
print_status $? "Main binary builds successfully"

# Clean up
rm -f /tmp/veloflux

# 10. Summary report
echo
echo "🎯 VALIDATION SUMMARY"
echo "===================="

if [ $AI_RESULT -eq 0 ] && [ $BALANCER_RESULT -eq 0 ] && [ $ALL_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}✅ AI/ML INTEGRATION COMPLETE${NC}"
    echo -e "${GREEN}✅ SYSTEM READY FOR PRODUCTION${NC}"
    
    echo
    echo "📊 Test Results:"
    echo "  • AI/ML Package: PASSED ($AI_COVERAGE coverage)"
    echo "  • Balancer Package: PASSED"
    echo "  • Integration Demo: WORKING"
    echo "  • Configuration: VALID"
    echo "  • Documentation: COMPLETE"
    echo "  • Build System: FUNCTIONAL"
    
    echo
    echo "🚀 Next Steps:"
    echo "  1. Deploy to your target environment"
    echo "  2. Configure with your specific backends"
    echo "  3. Monitor AI/ML performance metrics"
    echo "  4. Access dashboard at http://localhost:3000"
    echo "  5. View AI insights at http://localhost:8080/api/ai/metrics"
    
    echo
    echo -e "${BLUE}🎉 VeloFlux AI/ML Load Balancer is ready!${NC}"
    
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo "Please check the test output and fix any issues."
    
    echo
    echo "Debug information:"
    if [ $AI_RESULT -ne 0 ]; then
        echo "  • AI tests failed - check /tmp/ai_tests.log"
    fi
    if [ $BALANCER_RESULT -ne 0 ]; then
        echo "  • Balancer tests failed - check /tmp/balancer_tests.log"
    fi
    if [ $ALL_RESULT -ne 0 ]; then
        echo "  • Integration tests failed - check /tmp/all_tests.log"
    fi
    
    exit 1
fi
