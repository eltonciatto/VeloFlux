# VeloFlux - Port Allocation & Service Guide

## 🚀 Port Standard (NUNCA ALTERAR)

| Port | Service | Description | Access URL |
# Execute commands in container
docker-compose exec backend curl localhost:8080/api/health
docker-compose exec frontend curl localhost/api/health----|---------|-------------|------------|
| **80** | nginx (Load Balancer) | **ENTRADA PRINCIPAL** | **http://localhost** |
| **443** | nginx (Load Balancer) | Main HTTPS entry point | https://localhost |
| **3000** | Frontend | Web application (direct dev) | http://localhost:3000 |
| **3001** | Grafana | Monitoring dashboard | http://localhost:3001 |
| **6379** | Redis | Cache/sessions (**INTERNO APENAS**) | N/A |
| **8080** | Backend | Health/Metrics endpoint | http://localhost:8080/health |
| **9000** | Backend | Admin API (direct dev) | http://localhost:9000 |
| **9090** | Backend | Main API (direct dev) | http://localhost:9090 |
| **9091** | Prometheus | Metrics collection | http://localhost:9091 |
| **9092** | AlertManager | Alert notifications | http://localhost:9092 |

## 🎯 ROTAS PRINCIPAIS (Para usuários finais)

| Rota | Destino | Descrição |
|------|---------|-----------|
| `http://localhost/` | Frontend | **Aplicação principal** |
| `http://localhost/admin` | Frontend Admin | **Interface administrativa** |
| `http://localhost/api/` | Backend:9090 | **API principal** |
| `http://localhost/admin/api/` | Backend:9000 | **API administrativa** |

## 🔄 Service Communication Flow

```
User → nginx:80 → {
    /        → frontend:80
    /api/    → backend:9090  
    /admin/  → backend:9000
}

Backend:9090 → Redis:6379 (sessions/cache)
Prometheus:9090 → Backend:8080 (metrics)
Grafana:3000 → Prometheus:9090 (data source)
AlertManager:9093 → External (notifications)
```

## 🛠️ Development Workflow

### Quick Start
```bash
# Start all services
docker-compose up -d

# View service status
docker-compose ps

# Check logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Testing Endpoints
```bash
# Main application (via nginx)
curl http://localhost

# Backend health check
curl http://localhost:8080/api/health

# Backend API directly
curl http://localhost:9090/api/health

# Frontend health check
curl http://localhost:3000/health
```

### Access Monitoring
- **Grafana**: http://localhost:3001 (admin/veloflux123)
- **Prometheus**: http://localhost:9091
- **AlertManager**: http://localhost:9092

## 📝 Development Rules

1. **NEVER change port mappings** without updating this documentation
2. **Always use nginx (port 80)** for main application access
3. **Direct service ports** are for development/debugging only
4. **Redis is internal only** - never expose externally
5. **Use environment variables** for configuration, not hardcoded values

## 🔧 Service Configuration

### Backend Environment Variables
```yaml
REDIS_URL: redis://redis:6379
ENV: production
PORT: 9090              # Main API
ADMIN_PORT: 9000        # Admin API  
METRICS_PORT: 8080      # Health/Metrics
VF_ADMIN_USER: admin
VF_ADMIN_PASS: veloflux123
VFX_LOG_LEVEL: info
```

### Frontend Environment Variables
```yaml
VITE_API_URL: /api          # Uses nginx proxy in production
VITE_ADMIN_URL: /admin/api  # Uses nginx proxy in production
VITE_DEMO_MODE: false
```

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Check what's using a port
sudo lsof -i :8080

# Kill process using port
sudo kill -9 $(sudo lsof -t -i:8080)

# Or use different port mapping temporarily
# docker-compose up -d --build
```

### Service Health Checks
```bash
# Check all service health
docker-compose ps

# Individual service logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs redis

# Execute commands in container
docker-compose exec backend curl localhost:8080/api/health
docker-compose exec frontend curl localhost/health
```

### Reset Everything
```bash
# Stop and remove all containers + volumes
docker-compose down -v

# Clean up images
docker system prune -a

# Start fresh
docker-compose up -d --build
```

## 📊 Monitoring Setup

### Prometheus Targets
- Backend metrics: backend:8080/metrics
- Node exporter: node-exporter:9100
- AlertManager: alertmanager:9093

### Grafana Dashboards
- Load Balancer Performance
- Backend API Metrics  
- Redis Cache Statistics
- System Resources

### Alert Rules
- High response time (>2s)
- High error rate (>5%)
- Redis connection failures
- Disk space < 10%

## 🔐 Security Notes

1. **Change default passwords** in production
2. **Use HTTPS** for external access (port 443)
3. **Internal services** (Redis) not exposed externally
4. **Admin API** (9000) should be restricted in production
5. **Monitoring** endpoints should be protected

## 📚 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Token refresh
- `POST /api/auth/logout` - User logout

### Main API Endpoints
- `GET /api/health` - Service health check
- `GET /api/profile` - User profile
- `GET /api/tenants` - Tenant management

### Admin API Endpoints  
- `GET /admin/health` - Admin health check
- `GET /admin/metrics` - Detailed metrics
- `POST /admin/tenants` - Tenant administration

---

**Remember: This port allocation is STANDARD and should never be changed without team approval!**
