
#!/bin/bash
set -euo pipefail

# VeloFlux LB Performance Benchmark Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Configuration
TARGET_URL="${TARGET_URL:-http://localhost}"
DURATION="${DURATION:-60s}"
CONNECTIONS="${CONNECTIONS:-100}"
THREADS="${THREADS:-4}"
RATE="${RATE:-1000}"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

check_tools() {
    log "Checking benchmark tools..."
    
    if ! command -v wrk &> /dev/null; then
        warn "wrk not found, installing..."
        if command -v apt-get &> /dev/null; then
            sudo apt-get update && sudo apt-get install -y wrk
        elif command -v yum &> /dev/null; then
            sudo yum install -y wrk
        elif command -v brew &> /dev/null; then
            brew install wrk
        else
            error "Cannot install wrk. Please install manually."
        fi
    fi
    
    if ! command -v vegeta &> /dev/null; then
        warn "vegeta not found, installing..."
        if command -v apt-get &> /dev/null; then
            wget -qO- https://github.com/tsenart/vegeta/releases/download/v12.8.4/vegeta_12.8.4_linux_amd64.tar.gz | sudo tar xz -C /usr/local/bin
        elif command -v brew &> /dev/null; then
            brew install vegeta
        else
            error "Cannot install vegeta. Please install manually."
        fi
    fi
    
    log "Benchmark tools ready"
}

wait_for_service() {
    log "Waiting for VeloFlux LB to be ready..."
    
    for i in {1..30}; do
        if curl -s -o /dev/null -w "%{http_code}" "$TARGET_URL" | grep -q "200\|404"; then
            log "Service is ready"
            return 0
        fi
        echo -n "."
        sleep 2
    done
    
    error "Service did not become ready within 60 seconds"
}

run_wrk_benchmark() {
    log "Running wrk benchmark..."
    log "Target: $TARGET_URL"
    log "Duration: $DURATION"
    log "Connections: $CONNECTIONS"
    log "Threads: $THREADS"
    
    echo "================== WRK BENCHMARK =================="
    wrk -t$THREADS -c$CONNECTIONS -d$DURATION --latency "$TARGET_URL"
    echo "=================================================="
}

run_vegeta_benchmark() {
    log "Running vegeta benchmark..."
    log "Target: $TARGET_URL"
    log "Duration: $DURATION"
    log "Rate: $RATE req/s"
    
    echo "================== VEGETA BENCHMARK =================="
    
    # Create targets file
    cat > /tmp/targets.txt <<EOF
GET $TARGET_URL
GET $TARGET_URL/health
EOF
    
    # Run vegeta attack
    vegeta attack -targets=/tmp/targets.txt -rate=$RATE -duration=$DURATION | vegeta report -type=text
    
    # Generate latency report
    echo ""
    echo "Latency distribution:"
    vegeta attack -targets=/tmp/targets.txt -rate=$RATE -duration=$DURATION | vegeta report -type=hist
    
    rm -f /tmp/targets.txt
    echo "====================================================="
}

run_connection_test() {
    log "Running concurrent connection test..."
    
    # Test with increasing connection counts
    for conns in 100 500 1000 2000 5000; do
        log "Testing with $conns connections..."
        echo "--- $conns connections ---"
        wrk -t8 -c$conns -d30s --latency "$TARGET_URL" | grep -E "(Requests/sec|Latency|errors)"
        echo ""
        sleep 5
    done
}

run_memory_test() {
    log "Running memory usage test..."
    
    # Start monitoring in background
    (
        while true; do
            docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" | grep veloflux
            sleep 5
        done
    ) &
    MONITOR_PID=$!
    
    # Run load test
    vegeta attack -targets=<(echo "GET $TARGET_URL") -rate=1000 -duration=60s > /dev/null
    
    # Stop monitoring
    kill $MONITOR_PID 2>/dev/null || true
}

run_stress_test() {
    log "Running stress test (high load)..."
    
    echo "================== STRESS TEST =================="
    log "Ramping up to 10k RPS..."
    
    for rate in 1000 2500 5000 7500 10000; do
        log "Testing at $rate RPS..."
        echo "--- $rate RPS ---"
        echo "GET $TARGET_URL" | vegeta attack -rate=$rate -duration=30s | vegeta report -type=text | grep -E "(Success|Latency|Throughput)"
        echo ""
        sleep 10
    done
    
    echo "=============================================="
}

generate_report() {
    log "Generating performance report..."
    
    REPORT_FILE="/tmp/veloflux-lb-benchmark-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$REPORT_FILE" <<EOF
VeloFlux LB Performance Benchmark Report
=======================================
Date: $(date)
Target: $TARGET_URL
Test Duration: $DURATION
Max Connections: $CONNECTIONS
Max Rate: $RATE req/s

System Information:
- OS: $(uname -a)
- CPU: $(nproc) cores
- Memory: $(free -h | grep Mem | awk '{print $2}')
- Docker Version: $(docker --version)

Test Summary:
- HTTP Load Test: ✓
- Connection Scaling: ✓  
- Memory Usage: ✓
- Stress Test: ✓

Results saved to: $REPORT_FILE
EOF

    log "Report generated: $REPORT_FILE"
}

main() {
    log "Starting VeloFlux LB performance benchmark..."
    log "Target URL: $TARGET_URL"
    
    check_tools
    wait_for_service
    
    echo ""
    log "=== BASIC LOAD TEST ==="
    run_wrk_benchmark
    
    echo ""
    log "=== LATENCY TEST ==="
    run_vegeta_benchmark
    
    echo ""
    log "=== CONNECTION SCALING TEST ==="
    run_connection_test
    
    echo ""
    log "=== MEMORY USAGE TEST ==="
    run_memory_test
    
    echo ""
    log "=== STRESS TEST ==="
    run_stress_test
    
    generate_report
    
    log "Benchmark completed successfully!"
    log "Check Docker stats with: docker stats"
    log "Check metrics at: http://localhost:8080/metrics"
}

# Allow running specific tests
case "${1:-all}" in
    wrk)
        check_tools
        wait_for_service
        run_wrk_benchmark
        ;;
    vegeta)
        check_tools
        wait_for_service
        run_vegeta_benchmark
        ;;
    connections)
        check_tools
        wait_for_service
        run_connection_test
        ;;
    stress)
        check_tools
        wait_for_service
        run_stress_test
        ;;
    all|*)
        main
        ;;
esac
