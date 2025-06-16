#!/bin/bash

# Color definitions
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}===== VeloFlux Domain & SSL Setup =====${NC}"
echo "This script configures VeloFlux to properly handle subdomains and SSL."

# Stop all containers first
echo -e "${YELLOW}Stopping all containers...${NC}"
docker compose down

# Create the proper directory structure
echo -e "${YELLOW}Creating directories for tenant-specific content...${NC}"
mkdir -p /workspaces/VeloFlux/test/tenant1
mkdir -p /workspaces/VeloFlux/test/tenant2
mkdir -p /workspaces/VeloFlux/test/api
mkdir -p /workspaces/VeloFlux/test/admin
mkdir -p /workspaces/VeloFlux/test/public

# Copy HTML files to their correct locations
echo -e "${YELLOW}Setting up tenant-specific content...${NC}"
cp /workspaces/VeloFlux/test/domains/tenant1.public.html /workspaces/VeloFlux/test/tenant1/index.html
cp /workspaces/VeloFlux/test/domains/tenant2.public.html /workspaces/VeloFlux/test/tenant2/index.html
cp /workspaces/VeloFlux/test/domains/api.public.html /workspaces/VeloFlux/test/api/index.html
cp /workspaces/VeloFlux/test/domains/admin.public.html /workspaces/VeloFlux/test/admin/index.html
cp /workspaces/VeloFlux/test/domains/public.html /workspaces/VeloFlux/test/public/index.html

# Create API health endpoint file
echo -e "${YELLOW}Creating API health endpoint...${NC}"
echo '{"status":"ok","service":"api"}' > /workspaces/VeloFlux/test/api/health

# Update docker-compose.yml to mount volumes correctly
echo -e "${YELLOW}Updating docker-compose.yml with correct volume mounts...${NC}"

cat > /workspaces/VeloFlux/docker-compose.yml << 'EOF'
version: '3.8'

services:
  veloflux-lb:
    build: .
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # metrics
      - "9000:9000"  # admin API
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=info
      - VF_ADMIN_USER=admin
      - VF_ADMIN_PASS=senha-super
    volumes:
      - ./config:/etc/veloflux
      - ./certs:/etc/ssl/certs/veloflux
    depends_on:
      - backend-1
      - backend-2
    restart: unless-stopped

  backend-1:
    image: nginx:alpine
    ports:
      - "8001:80"
    volumes:
      - ./test/backend1.html:/usr/share/nginx/html/default.html:ro
      - ./test/tenant1/:/usr/share/nginx/html/tenant1/:ro
      - ./test/api/:/usr/share/nginx/html/api/:ro
      - ./test/admin/:/usr/share/nginx/html/admin/:ro
      - ./test/public/:/usr/share/nginx/html/public/:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro
      # For direct access without path_prefix
      - ./test/tenant1/index.html:/usr/share/nginx/html/index.html:ro
    
  backend-2:
    image: nginx:alpine
    ports:
      - "8002:80"
    volumes:
      - ./test/backend2.html:/usr/share/nginx/html/default.html:ro
      - ./test/tenant2/:/usr/share/nginx/html/tenant2/:ro
      - ./test/api/:/usr/share/nginx/html/api/:ro
      - ./test/admin/:/usr/share/nginx/html/admin/:ro
      - ./test/public/:/usr/share/nginx/html/public/:ro
      - ./test/health.html:/usr/share/nginx/html/health:ro
      # For direct access without path_prefix
      - ./test/tenant2/index.html:/usr/share/nginx/html/index.html:ro

  # Redis for cluster state storage and coordination
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
    command: redis-server --appendonly yes
    volumes:
      - redis-data:/data
    restart: unless-stopped

  # Prometheus metrics exporter for system monitoring
  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    restart: unless-stopped
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc|var/lib/docker)($$|/)'

volumes:
  redis-data:
EOF

# Update config.yaml to use the right paths and backends
echo -e "${YELLOW}Updating config.yaml with proper routes and pools...${NC}"

cat > /workspaces/VeloFlux/config/config.yaml << 'EOF'
# VeloFlux LB Configuration Example
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  # TLS Configuration
  tls:
    auto_cert: true
    acme_email: "admin@veloflux.io"
    cert_dir: "/etc/ssl/certs/veloflux"
    domains:
      - "public.dev.veloflux.io"
      - "tenant1.public.dev.veloflux.io"
      - "tenant2.public.dev.veloflux.io"
      - "api.public.dev.veloflux.io"
      - "admin.public.dev.veloflux.io"
      - "*.public.dev.veloflux.io"

  # Health Check Defaults
  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

  # Rate Limiting
  rate_limit:
    requests_per_second: 100
    burst_size: 200
    cleanup_interval: "5m"

  # Web Application Firewall
  waf:
    enabled: false
    ruleset_path: "/etc/veloflux/waf/crs-rules.conf"
    level: "standard"
    log_violations: true

  # GeoIP Configuration
  geoip:
    enabled: false
    database_path: "/etc/geoip/GeoLite2-City.mmdb"

# Authentication Configuration
auth:
  enabled: true
  jwt_secret: "your-super-secret-key-change-in-production"
  jwt_issuer: "veloflux-lb"
  jwt_audience: "veloflux-admin"
  token_validity: "24h"
  # OIDC Configuration (Keycloak / Auth0)
  oidc_enabled: false
  oidc_issuer_url: "https://auth.example.com/realms/veloflux"
  oidc_client_id: "veloflux-admin"
  oidc_redirect_uri: "https://admin.veloflux.example.com/auth/callback"
  # SMTP Email Provider Configuration
  smtp_enabled: false
  smtp:
    host: "smtp.example.com"
    port: 587
    username: "veloflux@example.com"
    password: "your-smtp-password"
    from_email: "veloflux@example.com"
    from_name: "VeloFlux"
    use_tls: true
    app_domain: "${APP_DOMAIN:-veloflux.io}" # Domain para links em emails, usa env ou valor padrão

# Clustering Configuration
cluster:
  enabled: true
  redis_address: "redis:6379"
  redis_password: ""
  redis_db: 0
  node_id: ""  # Auto-generated if empty
  heartbeat_interval: "5s"
  leader_timeout: "15s"

# API Server Configuration
api:
  bind_address: "0.0.0.0:9090"
  auth_enabled: true
  username: "admin"
  password: "veloflux-admin-password"

# Tenant-specific configurations
tenants:
  - id: "tenant1"
    name: "Demo Company A"
    enabled: true
    routes:
      - host: "company-a.example.com"
        pool: "tenant1-pool"
        path_prefix: "/"
    rate_limit:
      requests_per_second: 50
      burst_size: 100
      cleanup_interval: "5m"
    waf:
      enabled: false
      level: "standard"

  - id: "tenant2"
    name: "Demo Company B"
    enabled: true
    routes:
      - host: "company-b.example.com"
        pool: "tenant2-pool"
        path_prefix: "/"
    rate_limit:
      requests_per_second: 200
      burst_size: 400
      cleanup_interval: "5m"
    waf:
      enabled: false
      level: "strict"

# Backend Pools
pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200
          
      - address: "backend-2:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "tenant1-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "tenant2-pool"
    algorithm: "round_robin"
    sticky_sessions: true
    
    backends:
      - address: "backend-2:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

  - name: "api-servers"
    algorithm: "least_conn"
    sticky_sessions: false
    
    backends:
      - address: "backend-1:80"
        weight: 150
        health_check:
          path: "/api/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200
          
      - address: "backend-2:80"
        weight: 100
        health_check:
          path: "/api/health"
          interval: "15s"
          timeout: "3s"
          expected_status: 200

# Routing Rules
routes:
  # Original routes
  - host: "example.com"
    pool: "web-servers"
    
  - host: "www.example.com"
    pool: "web-servers"
    
  - host: "api.example.com"
    pool: "api-servers"
    path_prefix: "/api"

  # Private development domain routes (localhost)
  - host: "app.private.dev.veloflux.io"
    pool: "web-servers"
    
  - host: "www.private.dev.veloflux.io"
    pool: "web-servers"

  - host: "api.private.dev.veloflux.io"
    pool: "api-servers"
    path_prefix: "/api"

  - host: "admin.private.dev.veloflux.io"
    pool: "api-servers"
    path_prefix: "/admin"

  - host: "tenant1.private.dev.veloflux.io"
    pool: "tenant1-pool"

  - host: "tenant2.private.dev.veloflux.io"
    pool: "tenant2-pool"

  # Public development domain routes (public IP)
  - host: "public.dev.veloflux.io"
    pool: "web-servers"
    path_prefix: "/public"
    
  - host: "tenant1.public.dev.veloflux.io"
    pool: "tenant1-pool"

  - host: "tenant2.public.dev.veloflux.io"
    pool: "tenant2-pool"

  - host: "api.public.dev.veloflux.io"
    pool: "api-servers"
    path_prefix: "/api"

  - host: "admin.public.dev.veloflux.io"
    pool: "api-servers"
    path_prefix: "/admin"

  # Wildcard support
  - host: "*.private.dev.veloflux.io"
    pool: "web-servers"

  - host: "*.public.dev.veloflux.io"
    pool: "web-servers"
EOF

# Start the services
echo -e "${YELLOW}Starting VeloFlux services...${NC}"
docker compose up -d

# Wait for services to start
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Test the setup
echo -e "${GREEN}=== Testing Domain Configuration ===${NC}"

# Test tenant1.public.dev.veloflux.io
echo -e "${BLUE}Testing tenant1.public.dev.veloflux.io...${NC}"
echo "Curl response:"
curl -s -H 'Host: tenant1.public.dev.veloflux.io' http://localhost:80/ | grep -o "<h1>.*</h1>"

# Test tenant2.public.dev.veloflux.io
echo -e "${BLUE}Testing tenant2.public.dev.veloflux.io...${NC}"
echo "Curl response:"
curl -s -H 'Host: tenant2.public.dev.veloflux.io' http://localhost:80/ | grep -o "<h1>.*</h1>"

# Test api.public.dev.veloflux.io
echo -e "${BLUE}Testing api.public.dev.veloflux.io...${NC}"
echo "Curl response:"
curl -s -H 'Host: api.public.dev.veloflux.io' http://localhost:80/api/ | grep -o "<h1>.*</h1>"

# Test api health endpoint
echo -e "${BLUE}Testing api health endpoint...${NC}"
echo "Curl response:"
curl -s -H 'Host: api.public.dev.veloflux.io' http://localhost:80/api/health

# Test admin.public.dev.veloflux.io
echo -e "${BLUE}Testing admin.public.dev.veloflux.io...${NC}"
echo "Curl response:"
curl -s -H 'Host: admin.public.dev.veloflux.io' http://localhost:80/admin/ | grep -o "<h1>.*</h1>"

# Test public.dev.veloflux.io
echo -e "${BLUE}Testing public.dev.veloflux.io...${NC}"
echo "Curl response:"
curl -s -H 'Host: public.dev.veloflux.io' http://localhost:80/public/ | grep -o "<h1>.*</h1>"

# Check VeloFlux logs
echo -e "${GREEN}=== VeloFlux Logs ===${NC}"
docker logs veloflux-veloflux-lb-1 --tail 20

echo -e "${GREEN}=== SSL Configuration ===${NC}"
echo -e "${YELLOW}SSL/TLS is enabled with auto_cert=true for the following domains:${NC}"
echo "- public.dev.veloflux.io"
echo "- tenant1.public.dev.veloflux.io"
echo "- tenant2.public.dev.veloflux.io"
echo "- api.public.dev.veloflux.io"
echo "- admin.public.dev.veloflux.io"
echo "- *.public.dev.veloflux.io"

echo -e "${GREEN}=== Setup Complete ===${NC}"
echo "The VeloFlux environment is now configured to respond correctly to all domains."
echo "For VeloFlux to issue SSL certificates automatically, make sure port 443 is open"
echo "and all domains are pointed to the public IP: 74.249.85.193"
