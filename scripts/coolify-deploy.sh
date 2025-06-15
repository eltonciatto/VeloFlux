#!/bin/bash

# 🚀 VeloFlux SaaS - Coolify Production Deploy Script
# Automated deployment to Coolify platform

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

SCRIPT_VERSION="1.0.0"

echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${PURPLE}🚀 VeloFlux SaaS - Coolify Production Deploy v$SCRIPT_VERSION${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_status() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Function to validate Coolify environment
validate_coolify() {
    print_step "Validating Coolify environment..."
    
    # Check for required environment variables
    if [ -z "$COOLIFY_API_URL" ]; then
        print_error "COOLIFY_API_URL environment variable not set"
        echo "Please set: export COOLIFY_API_URL=https://your-coolify-instance.com"
        exit 1
    fi
    
    if [ -z "$COOLIFY_API_TOKEN" ]; then
        print_error "COOLIFY_API_TOKEN environment variable not set"
        echo "Please set: export COOLIFY_API_TOKEN=your-api-token"
        exit 1
    fi
    
    print_success "Coolify environment variables configured"
}

# Function to setup production environment
setup_production_env() {
    print_step "Setting up production environment..."
    
    # Create production .env file
    cat > .env.production << EOF
# VeloFlux Production Configuration
VITE_MODE=production
VITE_DEMO_MODE=false

# API Configuration
VITE_PROD_API_URL=${API_URL:-https://api.yourdomain.com}
VITE_PROD_ADMIN_URL=${ADMIN_URL:-https://admin.yourdomain.com}

# Load Balancer Configuration
VF_ADMIN_USER=${ADMIN_USER:-admin}
VF_ADMIN_PASS=${ADMIN_PASS:-$(openssl rand -base64 32)}
VFX_LOG_LEVEL=${LOG_LEVEL:-info}

# Database (Redis)
REDIS_URL=${REDIS_URL:-redis://redis:6379}

# SSL Configuration
SSL_CERT_PATH=/etc/ssl/certs/veloflux/server.crt
SSL_KEY_PATH=/etc/ssl/certs/veloflux/server.key

# Monitoring
METRICS_ENABLED=true
HEALTH_CHECK_INTERVAL=30s

# Security
CORS_ALLOWED_ORIGINS=${CORS_ORIGINS:-https://yourdomain.com}
RATE_LIMIT_ENABLED=true
WAF_ENABLED=true
EOF

    print_success "Production environment file created"
}

# Function to create Coolify deployment configuration
create_coolify_config() {
    print_step "Creating Coolify deployment configuration..."
    
    mkdir -p .coolify
    
    # Create docker-compose for Coolify
    cat > .coolify/docker-compose.yml << EOF
version: '3.8'

services:
  veloflux-lb:
    build: 
      context: .
      dockerfile: Dockerfile
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=\${LOG_LEVEL:-info}
      - VF_ADMIN_USER=\${ADMIN_USER:-admin}
      - VF_ADMIN_PASS=\${ADMIN_PASS}
      - REDIS_URL=\${REDIS_URL}
    volumes:
      - ./config:/etc/veloflux:ro
      - ./certs:/etc/ssl/certs/veloflux:ro
    depends_on:
      - redis
    restart: unless-stopped
    labels:
      - "coolify.managed=true"
      - "coolify.version=1"
      - "coolify.type=application"
      - "coolify.name=veloflux-lb"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 60s

  veloflux-frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
      args:
        - VITE_MODE=production
        - VITE_PROD_API_URL=\${API_URL}
        - VITE_PROD_ADMIN_URL=\${ADMIN_URL}
    environment:
      - NODE_ENV=production
    restart: unless-stopped
    labels:
      - "coolify.managed=true"
      - "coolify.version=1"
      - "coolify.type=application"
      - "coolify.name=veloflux-frontend"

  redis:
    image: redis:alpine
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    volumes:
      - redis-data:/data
    restart: unless-stopped
    labels:
      - "coolify.managed=true"
      - "coolify.version=1"
      - "coolify.type=database"
      - "coolify.name=veloflux-redis"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  redis-data:
    driver: local
    labels:
      - "coolify.managed=true"

networks:
  default:
    name: veloflux-network
    labels:
      - "coolify.managed=true"
EOF

    # Create frontend Dockerfile
    cat > Dockerfile.frontend << EOF
# Multi-stage build for frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
ARG VITE_MODE=production
ARG VITE_PROD_API_URL
ARG VITE_PROD_ADMIN_URL
ENV VITE_MODE=\$VITE_MODE
ENV VITE_PROD_API_URL=\$VITE_PROD_API_URL
ENV VITE_PROD_ADMIN_URL=\$VITE_PROD_ADMIN_URL

RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY .coolify/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
EOF

    # Create nginx configuration
    cat > .coolify/nginx.conf << EOF
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Handle client routing
    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # API proxy (if needed)
    location /api/ {
        proxy_pass http://veloflux-lb:9000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    # Static assets caching
    location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

    # Create Coolify environment template
    cat > .coolify/environment.template << EOF
# Required Environment Variables for Coolify Deployment

# Domain Configuration
API_URL=https://api.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Admin Credentials
ADMIN_USER=admin
ADMIN_PASS=your-secure-password-here

# Database
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGINS=https://yourdomain.com

# SSL (handled by Coolify)
SSL_ENABLED=true
EOF

    print_success "Coolify configuration files created"
}

# Function to validate deployment
validate_deployment() {
    print_step "Validating deployment configuration..."
    
    # Check if required files exist
    local required_files=(
        "Dockerfile"
        "Dockerfile.frontend"
        "docker-compose.yml"
        ".coolify/docker-compose.yml"
        "config/config.yaml"
    )
    
    for file in "${required_files[@]}"; do
        if [ ! -f "$file" ]; then
            print_error "Required file missing: $file"
            exit 1
        fi
    done
    
    # Validate docker-compose syntax
    if ! docker-compose -f .coolify/docker-compose.yml config >/dev/null 2>&1; then
        print_error "Invalid docker-compose configuration"
        exit 1
    fi
    
    print_success "Deployment configuration validated"
}

# Function to create deployment guide
create_deployment_guide() {
    print_step "Creating deployment guide..."
    
    cat > COOLIFY_DEPLOYMENT.md << EOF
# 🚀 VeloFlux SaaS - Coolify Deployment Guide

## Prerequisites

1. **Coolify Instance**: You need a running Coolify instance
2. **Domain**: A domain pointing to your Coolify server
3. **SSL Certificate**: Coolify will handle SSL automatically

## Deployment Steps

### 1. Connect Repository to Coolify

1. In Coolify dashboard, go to **Applications**
2. Click **+ New Application**
3. Select **Git Repository**
4. Connect your VeloFlux repository

### 2. Configure Environment Variables

Copy these environment variables to your Coolify application:

\`\`\`bash
# Domain Configuration
API_URL=https://api.yourdomain.com
ADMIN_URL=https://admin.yourdomain.com
FRONTEND_URL=https://yourdomain.com

# Admin Credentials
ADMIN_USER=admin
ADMIN_PASS=your-secure-password

# Database
REDIS_URL=redis://redis:6379

# Logging
LOG_LEVEL=info

# Security
CORS_ORIGINS=https://yourdomain.com
\`\`\`

### 3. Configure Domains

Set up these domains in Coolify:

- **Frontend**: \`yourdomain.com\` → \`veloflux-frontend\` service
- **API**: \`api.yourdomain.com\` → \`veloflux-lb:9000\`
- **Load Balancer**: \`lb.yourdomain.com\` → \`veloflux-lb:80\`

### 4. Deploy

1. Set **Docker Compose File** to \`.coolify/docker-compose.yml\`
2. Set **Build Context** to \`.\`
3. Click **Deploy**

### 5. Post-Deployment Setup

1. **Configure Backends**: Edit \`config/config.yaml\` to add your backend servers
2. **SSL Verification**: Ensure SSL certificates are working
3. **Health Check**: Verify all services are healthy
4. **Monitoring**: Set up monitoring and alerts

## Service URLs

After deployment, your services will be available at:

- **Frontend**: https://yourdomain.com
- **API**: https://api.yourdomain.com
- **Load Balancer**: https://lb.yourdomain.com
- **Metrics**: https://api.yourdomain.com/metrics
- **Health**: https://api.yourdomain.com/health

## Monitoring

### Health Checks

All services include health checks:

- **Frontend**: HTTP check on port 80
- **Load Balancer**: HTTP check on /health endpoint
- **Redis**: Redis ping command

### Logs

View logs in Coolify dashboard or via CLI:

\`\`\`bash
# View all logs
coolify logs veloflux

# View specific service logs
coolify logs veloflux-lb
coolify logs veloflux-frontend
coolify logs veloflux-redis
\`\`\`

### Metrics

Access metrics at: https://api.yourdomain.com/metrics

## Scaling

### Horizontal Scaling

Scale services via Coolify dashboard:

1. Go to your application
2. Select service
3. Adjust **Replicas** count

### Vertical Scaling

Adjust resource limits in \`.coolify/docker-compose.yml\`:

\`\`\`yaml
deploy:
  resources:
    limits:
      cpus: '1.0'
      memory: 1G
    reservations:
      memory: 512M
\`\`\`

## Backup & Recovery

### Database Backup

Redis data is persisted in volume \`redis-data\`. Coolify handles backup automatically.

### Configuration Backup

Backup these files:
- \`config/config.yaml\`
- \`.env.production\`
- SSL certificates (if custom)

## Troubleshooting

### Common Issues

1. **Service Not Starting**: Check environment variables and logs
2. **SSL Issues**: Verify domain DNS and Coolify SSL settings
3. **Backend Connection**: Check \`config/config.yaml\` backend URLs
4. **High Memory Usage**: Adjust Redis max memory settings

### Debug Commands

\`\`\`bash
# Check service status
docker ps

# View service logs
docker logs veloflux-lb

# Test backend connections
curl -f http://localhost:8080/health

# Check Redis connection
redis-cli ping
\`\`\`

## Support

- 📚 **Documentation**: https://github.com/eciatto/VeloFlux/docs
- 🐛 **Issues**: https://github.com/eciatto/VeloFlux/issues
- 💬 **Discord**: https://discord.gg/veloflux

## Security Checklist

- [ ] Strong admin password set
- [ ] SSL certificates configured
- [ ] CORS origins restricted
- [ ] Rate limiting enabled
- [ ] WAF enabled
- [ ] Regular security updates
- [ ] Backup strategy in place
- [ ] Monitoring and alerts configured

---

**Happy Load Balancing with Coolify! 🚀**
EOF

    print_success "Deployment guide created: COOLIFY_DEPLOYMENT.md"
}

# Function to show completion summary
show_completion_summary() {
    echo ""
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}🎉 VeloFlux SaaS - Coolify Deployment Ready!${NC}"
    echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    echo -e "${BLUE}📁 Files Created:${NC}"
    echo -e "  🐳 .coolify/docker-compose.yml  - Coolify deployment configuration"
    echo -e "  🌐 Dockerfile.frontend          - Frontend container build"
    echo -e "  ⚙️  .coolify/nginx.conf          - Frontend web server config"
    echo -e "  🌍 .env.production              - Production environment variables"
    echo -e "  📖 COOLIFY_DEPLOYMENT.md       - Complete deployment guide"
    echo ""
    echo -e "${BLUE}🚀 Next Steps:${NC}"
    echo -e "  1. 📖 Read COOLIFY_DEPLOYMENT.md for complete setup instructions"
    echo -e "  2. 🔗 Connect your repository to Coolify"
    echo -e "  3. 🌍 Configure environment variables in Coolify"
    echo -e "  4. 🌐 Set up domain mappings"
    echo -e "  5. 🚀 Deploy!"
    echo ""
    echo -e "${BLUE}📚 Important Files to Review:${NC}"
    echo -e "  📝 config/config.yaml           - Configure your backend servers"
    echo -e "  🔐 .env.production              - Set your production variables"
    echo -e "  📋 .coolify/environment.template - Environment variables reference"
    echo ""
    echo -e "${YELLOW}⚠️  Security Reminders:${NC}"
    echo -e "  🔒 Change default admin password"
    echo -e "  🌐 Configure proper CORS origins"
    echo -e "  🛡️  Enable rate limiting and WAF"
    echo -e "  📊 Set up monitoring and alerts"
    echo ""
    echo -e "${GREEN}Ready for production deployment! 🎉${NC}"
}

# Main function
main() {
    print_status "Preparing VeloFlux SaaS for Coolify deployment..."
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "docker-compose.yml" ]; then
        print_error "Please run this script from the VeloFlux project root directory"
        exit 1
    fi
    
    # Setup environment
    setup_production_env
    
    # Create Coolify configuration
    create_coolify_config
    
    # Validate deployment
    validate_deployment
    
    # Create deployment guide
    create_deployment_guide
    
    # Show completion summary
    show_completion_summary
    
    print_success "Coolify deployment preparation completed!"
}

# Run main function
main "$@"
