
#!/bin/bash
set -euo pipefail

# SkyPilot LB Zero-Downtime Deployment Script

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Configuration
IMAGE_NAME="skypilot-lb"
IMAGE_TAG="${IMAGE_TAG:-latest}"
CONFIG_PATH="${CONFIG_PATH:-$PROJECT_DIR/config/config.yaml}"
DEPLOYMENT_MODE="${DEPLOYMENT_MODE:-docker}" # docker, swarm, or nomad

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

check_prerequisites() {
    log "Checking prerequisites..."
    
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
    fi
    
    if [ ! -f "$CONFIG_PATH" ]; then
        error "Configuration file not found: $CONFIG_PATH"
    fi
    
    log "Prerequisites check passed"
}

build_image() {
    log "Building SkyPilot LB image..."
    
    cd "$PROJECT_DIR"
    docker build -t "$IMAGE_NAME:$IMAGE_TAG" .
    
    log "Image built successfully: $IMAGE_NAME:$IMAGE_TAG"
}

deploy_docker() {
    log "Deploying with Docker..."
    
    CONTAINER_NAME="skypilot-lb"
    NEW_CONTAINER_NAME="skypilot-lb-new"
    
    # Build new image
    build_image
    
    # Check if container is running
    if docker ps --format "table {{.Names}}" | grep -q "^$CONTAINER_NAME$"; then
        log "Existing container found, performing rolling update..."
        
        # Start new container
        docker run -d \
            --name "$NEW_CONTAINER_NAME" \
            -p 8080:80 \
            -p 8443:443 \
            -p 8090:8080 \
            -e SKY_CONFIG=/etc/skypilot/config.yaml \
            -v "$(dirname "$CONFIG_PATH"):/etc/skypilot" \
            "$IMAGE_NAME:$IMAGE_TAG"
        
        # Wait for new container to be healthy
        log "Waiting for new container to be healthy..."
        for i in {1..30}; do
            if docker exec "$NEW_CONTAINER_NAME" /usr/local/bin/skypilot-lb --health-check 2>/dev/null; then
                log "New container is healthy"
                break
            fi
            if [ $i -eq 30 ]; then
                error "New container failed to become healthy"
            fi
            sleep 2
        done
        
        # Switch ports
        log "Switching traffic to new container..."
        docker stop "$CONTAINER_NAME"
        docker rm "$CONTAINER_NAME"
        docker rename "$NEW_CONTAINER_NAME" "$CONTAINER_NAME"
        
        # Update port mappings
        docker stop "$CONTAINER_NAME"
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p 80:80 \
            -p 443:443 \
            -p 8080:8080 \
            -e SKY_CONFIG=/etc/skypilot/config.yaml \
            -v "$(dirname "$CONFIG_PATH"):/etc/skypilot" \
            "$IMAGE_NAME:$IMAGE_TAG"
            
    else
        log "No existing container found, starting fresh deployment..."
        docker run -d \
            --name "$CONTAINER_NAME" \
            -p 80:80 \
            -p 443:443 \
            -p 8080:8080 \
            -e SKY_CONFIG=/etc/skypilot/config.yaml \
            -v "$(dirname "$CONFIG_PATH"):/etc/skypilot" \
            "$IMAGE_NAME:$IMAGE_TAG"
    fi
    
    log "Docker deployment completed successfully"
}

deploy_swarm() {
    log "Deploying with Docker Swarm..."
    
    if ! docker info | grep -q "Swarm: active"; then
        error "Docker Swarm is not active"
    fi
    
    build_image
    
    # Deploy using docker stack
    docker stack deploy -c "$PROJECT_DIR/docker-compose.yml" skypilot-stack
    
    log "Docker Swarm deployment completed successfully"
}

deploy_nomad() {
    log "Deploying with HashiCorp Nomad..."
    
    if ! command -v nomad &> /dev/null; then
        error "Nomad is not installed"
    fi
    
    build_image
    
    # Create Nomad job file
    cat > /tmp/skypilot-lb.nomad <<EOF
job "skypilot-lb" {
  datacenters = ["dc1"]
  type = "service"

  group "lb" {
    count = 2

    network {
      port "http" {
        static = 80
      }
      port "https" {
        static = 443
      }
      port "metrics" {
        static = 8080
      }
    }

    service {
      name = "skypilot-lb"
      port = "http"
      
      check {
        type     = "http"
        path     = "/health"
        interval = "30s"
        timeout  = "5s"
      }
    }

    task "lb" {
      driver = "docker"

      config {
        image = "$IMAGE_NAME:$IMAGE_TAG"
        ports = ["http", "https", "metrics"]
        volumes = [
          "$(dirname "$CONFIG_PATH"):/etc/skypilot"
        ]
      }

      env {
        SKY_CONFIG = "/etc/skypilot/config.yaml"
      }

      resources {
        cpu    = 500
        memory = 512
      }
    }
  }
}
EOF

    nomad job run /tmp/skypilot-lb.nomad
    rm /tmp/skypilot-lb.nomad
    
    log "Nomad deployment completed successfully"
}

main() {
    log "Starting SkyPilot LB deployment..."
    log "Deployment mode: $DEPLOYMENT_MODE"
    log "Image: $IMAGE_NAME:$IMAGE_TAG"
    log "Config: $CONFIG_PATH"
    
    check_prerequisites
    
    case "$DEPLOYMENT_MODE" in
        docker)
            deploy_docker
            ;;
        swarm)
            deploy_swarm
            ;;
        nomad)
            deploy_nomad
            ;;
        *)
            error "Unknown deployment mode: $DEPLOYMENT_MODE"
            ;;
    esac
    
    log "Deployment completed successfully!"
    log "Access your load balancer at http://localhost (HTTP) or https://localhost (HTTPS)"
    log "Metrics available at http://localhost:8080/metrics"
}

main "$@"
