#!/bin/bash

# 🧪 VeloFlux SaaS - Scripts Test Runner
# Validates all installation scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🧪 VeloFlux SaaS - Scripts Test Runner${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Test results
TESTS_PASSED=0
TESTS_FAILED=0
TOTAL_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    print_test "$test_name"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    if eval "$test_command"; then
        print_pass "$test_name"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        print_fail "$test_name"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Test 1: Check if we're in the right directory
test_directory() {
    [ -f "package.json" ] && [ -f "docker-compose.yml" ] && [ -d "scripts" ]
}

# Test 2: Check script files exist
test_script_files() {
    local scripts=(
        "install.sh"
        "dev-install.sh"
        "docker-install.sh"
        "quick-install.sh"
        "coolify-deploy.sh"
        "test-translation-visibility.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ ! -f "scripts/$script" ]; then
            return 1
        fi
    done
    
    return 0
}

# Test 3: Check script permissions
test_script_permissions() {
    local scripts=(
        "install.sh"
        "dev-install.sh"
        "docker-install.sh"
        "quick-install.sh"
        "coolify-deploy.sh"
    )
    
    for script in "${scripts[@]}"; do
        if [ ! -x "scripts/$script" ]; then
            return 1
        fi
    done
    
    return 0
}

# Test 4: Check script syntax
test_script_syntax() {
    local scripts=(
        "install.sh"
        "dev-install.sh"
        "docker-install.sh"
        "quick-install.sh"
        "coolify-deploy.sh"
    )
    
    for script in "${scripts[@]}"; do
        if ! bash -n "scripts/$script"; then
            return 1
        fi
    done
    
    return 0
}

# Test 5: Check required system commands
test_system_commands() {
    local commands=("curl" "git" "openssl")
    
    for cmd in "${commands[@]}"; do
        if ! command -v "$cmd" >/dev/null 2>&1; then
            return 1
        fi
    done
    
    return 0
}

# Test 6: Check Docker availability
test_docker_available() {
    command -v docker >/dev/null 2>&1
}

# Test 7: Check Node.js availability
test_nodejs_available() {
    command -v node >/dev/null 2>&1 && command -v npm >/dev/null 2>&1
}

# Test 8: Check configuration files
test_config_files() {
    [ -f ".env.example" ] && [ -f "config/config.example.yaml" ]
}

# Test 9: Check documentation
test_documentation() {
    [ -f "scripts/README.md" ] && [ -f "README.md" ]
}

# Test 10: Validate package.json
test_package_json() {
    if command -v node >/dev/null 2>&1; then
        node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" >/dev/null 2>&1
    else
        # Fallback: basic syntax check
        python3 -c "import json; json.load(open('package.json'))" >/dev/null 2>&1 || \
        python -c "import json; json.load(open('package.json'))" >/dev/null 2>&1
    fi
}

# Test 11: Validate docker-compose.yml
test_docker_compose() {
    if command -v docker-compose >/dev/null 2>&1; then
        docker-compose config >/dev/null 2>&1
    elif command -v docker >/dev/null 2>&1 && docker compose version >/dev/null 2>&1; then
        docker compose config >/dev/null 2>&1
    else
        # Basic YAML syntax check
        if command -v python3 >/dev/null 2>&1; then
            python3 -c "import yaml; yaml.safe_load(open('docker-compose.yml'))" >/dev/null 2>&1
        else
            return 0  # Skip if no validation tools available
        fi
    fi
}

# Test 12: Check script help output
test_script_help() {
    # Test if main install script can show help without errors
    timeout 5 bash -c 'echo "6" | ./scripts/install.sh' >/dev/null 2>&1
}

# Main test runner
main() {
    print_info "Starting VeloFlux SaaS scripts validation..."
    echo ""
    
    # Run all tests
    run_test "Directory structure validation" test_directory
    run_test "Script files existence" test_script_files
    run_test "Script permissions" test_script_permissions
    run_test "Script syntax validation" test_script_syntax
    run_test "Required system commands" test_system_commands
    run_test "Docker availability" test_docker_available
    run_test "Node.js availability" test_nodejs_available
    run_test "Configuration files" test_config_files
    run_test "Documentation files" test_documentation
    run_test "Package.json validation" test_package_json
    run_test "Docker Compose validation" test_docker_compose
    run_test "Script help functionality" test_script_help
    
    # Summary
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}📊 Test Results Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${GREEN}✅ Tests Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}❌ Tests Failed: $TESTS_FAILED${NC}"
    echo -e "${BLUE}📊 Total Tests: $TOTAL_TESTS${NC}"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Scripts are ready for use.${NC}"
        echo ""
        echo -e "${BLUE}📋 Available Installation Options:${NC}"
        echo -e "  🎯 Interactive Menu:    ./scripts/install.sh"
        echo -e "  🛠️ Development:         ./scripts/dev-install.sh"
        echo -e "  🐳 Docker Simple:       ./scripts/docker-install.sh"
        echo -e "  🚀 Production:          ./scripts/quick-install.sh"
        echo -e "  ☁️ Coolify Deploy:      ./scripts/coolify-deploy.sh"
        echo ""
        echo -e "${GREEN}Ready to install VeloFlux SaaS! 🚀${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}⚠️ Some tests failed. Please check the issues above.${NC}"
        echo ""
        echo -e "${YELLOW}🔧 Common Fixes:${NC}"
        echo -e "  📁 Run from project root directory"
        echo -e "  🔒 Fix permissions: chmod +x scripts/*.sh"
        echo -e "  📦 Install missing dependencies"
        echo -e "  🐳 Install Docker if needed"
        echo -e "  📦 Install Node.js if needed"
        echo ""
        exit 1
    fi
}

# Run main function
main "$@"
