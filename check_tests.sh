#!/bin/bash

cd /workspaces/VeloFlux

echo "Running tests with race detector..."

# Run the health package test with race detection
go test -v -race ./internal/health > health_race_test.txt 2>&1
HEALTH_RESULT=$?

if [ $HEALTH_RESULT -eq 0 ]; then
    echo "✅ Health package tests passed with no race conditions"
else
    echo "❌ Health package tests failed or had race conditions"
    cat health_race_test.txt
fi

# Run the complete test suite with race detection
go test -race ./internal/... > all_race_test.txt 2>&1
ALL_RESULT=$?

if [ $ALL_RESULT -eq 0 ]; then
    echo "✅ All package tests passed with no race conditions"
else
    echo "❌ Some package tests failed or had race conditions"
    grep -A 5 -B 5 "DATA RACE" all_race_test.txt
fi

# Show test coverage
echo -e "\n=== Test Coverage Summary ==="
go test -cover ./internal/auth ./internal/balancer ./internal/config ./internal/health ./internal/metrics ./internal/middleware ./internal/tenant

# Clean up
rm health_race_test.txt all_race_test.txt
