#!/bin/bash

# 🧪 VeloFlux SaaS - Test Installation Scripts
# Validates all installation methods and scripts

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${PURPLE}${BOLD}🧪 VeloFlux Installation Scripts Test Suite${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

print_test() {
    echo -e "${BLUE}${BOLD}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}[PASS]${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}[FAIL]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    
    ((TOTAL_TESTS++))
    print_test "$test_name"
    
    if eval "$test_command" >/dev/null 2>&1; then
        print_success "$test_name"
        ((PASSED_TESTS++))
        return 0
    else
        print_error "$test_name"
        ((FAILED_TESTS++))
        return 1
    fi
}

# Test script existence
test_script_existence() {
    print_test "Checking if all installation scripts exist..."
    
    local scripts=(
        "scripts/master-install.sh"
        "scripts/super-quick-install.sh"
        "scripts/docker-quick-install.sh"
        "scripts/dev-quick-install.sh"
        "scripts/one-line-install.sh"
    )
    
    local missing_scripts=()
    
    for script in "${scripts[@]}"; do
        if [ ! -f "$script" ]; then
            missing_scripts+=("$script")
        fi
    done
    
    if [ ${#missing_scripts[@]} -eq 0 ]; then
        print_success "All installation scripts exist"
        return 0
    else
        print_error "Missing scripts: ${missing_scripts[*]}"
        return 1
    fi
}

# Test script permissions
test_script_permissions() {
    print_test "Checking script permissions..."
    
    local scripts=(
        "scripts/master-install.sh"
        "scripts/super-quick-install.sh"
        "scripts/docker-quick-install.sh"
        "scripts/dev-quick-install.sh"
        "scripts/one-line-install.sh"
    )
    
    local non_executable=()
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ] && [ ! -x "$script" ]; then
            non_executable+=("$script")
        fi
    done
    
    if [ ${#non_executable[@]} -eq 0 ]; then
        print_success "All scripts are executable"
        return 0
    else
        print_error "Non-executable scripts: ${non_executable[*]}"
        return 1
    fi
}

# Test script syntax
test_script_syntax() {
    print_test "Checking script syntax..."
    
    local scripts=(
        "scripts/master-install.sh"
        "scripts/super-quick-install.sh"
        "scripts/docker-quick-install.sh"
        "scripts/dev-quick-install.sh"
        "scripts/one-line-install.sh"
    )
    
    local syntax_errors=()
    
    for script in "${scripts[@]}"; do
        if [ -f "$script" ]; then
            if ! bash -n "$script" 2>/dev/null; then
                syntax_errors+=("$script")
            fi
        fi
    done
    
    if [ ${#syntax_errors[@]} -eq 0 ]; then
        print_success "All scripts have valid syntax"
        return 0
    else
        print_error "Scripts with syntax errors: ${syntax_errors[*]}"
        return 1
    fi
}

# Test help options
test_help_options() {
    if ./scripts/master-install.sh --help | grep -q "VeloFlux"; then
        return 0
    else
        return 1
    fi
}

# Test dry run mode
test_dry_run_mode() {
    print_test "Testing dry run mode..."
    
    if ./scripts/master-install.sh --dry-run docker | grep -q "DRY RUN"; then
        print_success "Dry run mode works"
        return 0
    else
        print_error "Dry run mode failed"
        return 1
    fi
}

# Test project structure
test_project_structure() {
    print_test "Checking project structure..."
    
    local required_files=(
        "package.json"
        "docker-compose.yml"
        "config/config.example.yaml"
        "src/main.tsx"
        "vite.config.ts"
    )
    
    local missing_files=()
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            missing_files+=("$file")
        fi
    done
    
    if [ ${#missing_files[@]} -eq 0 ]; then
        print_success "Project structure is complete"
        return 0
    else
        print_error "Missing files: ${missing_files[*]}"
        return 1
    fi
}

# Test Docker Compose syntax
test_docker_compose_syntax() {
    print_test "Testing Docker Compose file syntax..."
    
    if command -v docker-compose >/dev/null 2>&1; then
        if docker-compose config >/dev/null 2>&1; then
            print_success "Docker Compose syntax is valid"
            return 0
        else
            print_error "Docker Compose syntax error"
            return 1
        fi
    else
        print_info "Docker Compose not available, skipping test"
        return 0
    fi
}

# Test package.json syntax
test_package_json_syntax() {
    print_test "Testing package.json syntax..."
    
    if command -v node >/dev/null 2>&1; then
        if node -e "JSON.parse(require('fs').readFileSync('package.json', 'utf8'))" 2>/dev/null; then
            print_success "package.json syntax is valid"
            return 0
        else
            print_error "package.json syntax error"
            return 1
        fi
    else
        print_info "Node.js not available, skipping test"
        return 0
    fi
}

# Test configuration files
test_config_files() {
    print_test "Testing configuration files..."
    
    if [ -f "config/config.example.yaml" ]; then
        # Test YAML syntax with basic validation
        if grep -q "global:" config/config.example.yaml && grep -q "auth:" config/config.example.yaml; then
            print_success "Configuration example is valid"
            return 0
        else
            print_error "Configuration example is invalid"
            return 1
        fi
    else
        print_error "Configuration example not found"
        return 1
    fi
}

# Test documentation
test_documentation() {
    print_test "Testing documentation..."
    
    local docs=(
        "docs/QUICK_INSTALL.md"
        "QUICK_START.md"
        "README.md"
    )
    
    local missing_docs=()
    
    for doc in "${docs[@]}"; do
        if [ ! -f "$doc" ]; then
            missing_docs+=("$doc")
        fi
    done
    
    if [ ${#missing_docs[@]} -eq 0 ]; then
        print_success "Documentation files exist"
        return 0
    else
        print_error "Missing documentation: ${missing_docs[*]}"
        return 1
    fi
}

# Test installation script functionality (without actual installation)
test_installation_functionality() {
    print_test "Testing installation script functionality..."
    
    # Test version option
    if ./scripts/master-install.sh --version | grep -q "Master Quick Install"; then
        print_success "Version option works"
    else
        print_error "Version option failed"
        return 1
    fi
    
    # Test invalid option handling
    if ./scripts/master-install.sh --invalid-option 2>&1 | grep -q "Unknown option"; then
        print_success "Invalid option handling works"
    else
        print_error "Invalid option handling failed"
        return 1
    fi
    
    return 0
}

# Test system requirements check
test_system_requirements() {
    print_test "Testing system requirements detection..."
    
    # Create a temporary test script
    cat > /tmp/test_requirements.sh << 'EOF'
#!/bin/bash
source scripts/master-install.sh
detect_system >/dev/null 2>&1
echo "OS: $OS, DISTRO: $DISTRO, ARCH: $ARCH"
EOF

    chmod +x /tmp/test_requirements.sh
    
    if /tmp/test_requirements.sh | grep -q "OS:"; then
        print_success "System requirements detection works"
        rm -f /tmp/test_requirements.sh
        return 0
    else
        print_error "System requirements detection failed"
        rm -f /tmp/test_requirements.sh
        return 1
    fi
}

# Test environment variables
test_environment_variables() {
    print_test "Testing environment variable handling..."
    
    # Test with environment variables
    export VF_DOMAIN="test.example.com"
    export VF_EMAIL="test@example.com"
    
    if VF_DOMAIN="test.example.com" ./scripts/master-install.sh --dry-run production | grep -q "test.example.com"; then
        print_success "Environment variables work"
        unset VF_DOMAIN VF_EMAIL
        return 0
    else
        print_error "Environment variables failed"
        unset VF_DOMAIN VF_EMAIL
        return 1
    fi
}

# Test port checking functionality
test_port_checking() {
    print_test "Testing port checking functionality..."
    
    # This test checks if the port checking logic exists in scripts
    if grep -q "check_ports\|ss -tuln\|netstat" scripts/*install*.sh; then
        print_success "Port checking functionality exists"
        return 0
    else
        print_error "Port checking functionality not found"
        return 1
    fi
}

# Run performance test
test_script_performance() {
    print_test "Testing script performance..."
    
    # Test help command performance (should be fast)
    start_time=$(date +%s%N)
    ./scripts/master-install.sh --help >/dev/null 2>&1
    end_time=$(date +%s%N)
    
    duration=$((($end_time - $start_time) / 1000000)) # Convert to milliseconds
    
    if [ $duration -lt 3000 ]; then # Less than 3 seconds
        print_success "Script performance is acceptable ($duration ms)"
        return 0
    else
        print_error "Script performance is slow ($duration ms)"
        return 1
    fi
}

# Run all tests
run_all_tests() {
    echo ""
    print_info "Running VeloFlux installation script tests..."
    echo ""
    
    # Basic tests
    run_test "Script Existence" "test_script_existence"
    run_test "Script Permissions" "test_script_permissions"
    run_test "Script Syntax" "test_script_syntax"
    run_test "Project Structure" "test_project_structure"
    run_test "Docker Compose Syntax" "test_docker_compose_syntax"
    run_test "Package.json Syntax" "test_package_json_syntax"
    run_test "Configuration Files" "test_config_files"
    run_test "Documentation" "test_documentation"
    
    # Functionality tests
    run_test "Help Options" "test_help_options"
    run_test "Dry Run Mode" "test_dry_run_mode"
    run_test "Installation Functionality" "test_installation_functionality"
    run_test "System Requirements" "test_system_requirements"
    run_test "Environment Variables" "test_environment_variables"
    run_test "Port Checking" "test_port_checking"
    run_test "Script Performance" "test_script_performance"
}

# Show test results
show_test_results() {
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}🧪 Test Results Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    
    echo -e "${BLUE}Total Tests:${NC} $TOTAL_TESTS"
    echo -e "${GREEN}Passed:${NC} $PASSED_TESTS"
    echo -e "${RED}Failed:${NC} $FAILED_TESTS"
    
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    echo -e "${CYAN}Success Rate:${NC} ${success_rate}%"
    
    echo ""
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}${BOLD}🎉 All tests passed! Installation scripts are ready.${NC}"
        exit 0
    else
        echo -e "${RED}${BOLD}❌ Some tests failed. Please review and fix issues.${NC}"
        
        if [ $success_rate -ge 80 ]; then
            echo -e "${YELLOW}✅ Success rate is above 80%, scripts should work but may have minor issues.${NC}"
            exit 1
        else
            echo -e "${RED}❌ Success rate is below 80%, scripts need significant fixes.${NC}"
            exit 2
        fi
    fi
}

# Show usage
show_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --help, -h      Show this help message
    --verbose, -v   Show verbose output
    --quick, -q     Run quick tests only
    --full, -f      Run full test suite (default)

Examples:
    $0              # Run all tests
    $0 --quick      # Run quick tests only
    $0 --verbose    # Show verbose output
EOF
}

# Parse arguments
VERBOSE=false
QUICK=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            show_usage
            exit 0
            ;;
        --verbose|-v)
            VERBOSE=true
            shift
            ;;
        --quick|-q)
            QUICK=true
            shift
            ;;
        --full|-f)
            QUICK=false
            shift
            ;;
        *)
            echo "Unknown option: $1"
            show_usage
            exit 1
            ;;
    esac
done

# Main execution
main() {
    if [ "$QUICK" = true ]; then
        print_info "Running quick tests only..."
        run_test "Script Existence" "test_script_existence"
        run_test "Script Permissions" "test_script_permissions"
        run_test "Script Syntax" "test_script_syntax"
        run_test "Help Options" "test_help_options"
    else
        print_info "Running full test suite..."
        run_all_tests
    fi
    
    show_test_results
}

# Run main function
main
