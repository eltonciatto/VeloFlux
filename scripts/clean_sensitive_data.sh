#!/bin/bash

echo "========================================"
echo "VeloFlux Documentation Security Cleanup"
echo "========================================"
echo ""

ROOT_DIR="/workspaces/VeloFlux"
DOCS_DIR="$ROOT_DIR/docs"

# Files to check for sensitive data
# We'll search for these patterns and replace with placeholder values
find "$DOCS_DIR" -type f -name "*.md" | while read file; do
  echo "🔍 Checking $file for sensitive data"
  
  # Replace passwords with placeholders
  sed -i 's/password=\([^[:space:]]*\)/password=<YOUR_SECURE_PASSWORD>/g' "$file"
  sed -i 's/ADMIN_PASSWORD=\([^[:space:]]*\)/ADMIN_PASSWORD=<YOUR_ADMIN_PASSWORD>/g' "$file"
  sed -i 's/REDIS_PASSWORD=\([^[:space:]]*\)/REDIS_PASSWORD=<YOUR_REDIS_PASSWORD>/g' "$file"
  sed -i 's/KEYCLOAK_ADMIN_PASSWORD=\([^[:space:]]*\)/KEYCLOAK_ADMIN_PASSWORD=<YOUR_KEYCLOAK_PASSWORD>/g' "$file"
  
  # Replace secrets and tokens
  sed -i 's/JWT_SECRET=\([^[:space:]]*\)/JWT_SECRET=<YOUR_JWT_SECRET>/g' "$file"
  sed -i 's/api_key: *"\${[^}]*}"/api_key: "${YOUR_API_KEY}"/g' "$file"
  sed -i 's/apiKey: *"[^"]*"/apiKey: "<YOUR_API_KEY>"/g' "$file"
  
  # Replace IP addresses with generic placeholders
  sed -i 's/\([0-9]\{1,3\}\.\)\{3\}[0-9]\{1,3\}/<YOUR_IP_ADDRESS>/g' "$file"
done

echo ""
echo "✅ Security cleanup complete!"
echo "✅ Replaced sensitive data with placeholders in documentation files"
echo ""
