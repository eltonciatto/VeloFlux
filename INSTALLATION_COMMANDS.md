# VeloFlux SaaS Production - Installation Commands

## Method 1: Direct Upload and Install

```bash
# Upload the package to your server
scp [0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557.tar.gz root@YOUR_SERVER_IP:/tmp/

# SSH into your server
ssh root@YOUR_SERVER_IP

# Extract and install
cd /tmp
tar xzf [0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557.tar.gz
cd [0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557
./install.sh
```

## Method 2: Download and Install on Server

```bash
# SSH into your server
ssh root@YOUR_SERVER_IP

# Download (if you have a download link)
# wget https://your-domain.com/[0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557.tar.gz
# Or upload manually and then:

cd /tmp
tar xzf [0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557.tar.gz
cd [0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557

# Optional: Customize configuration
export MAIN_DOMAIN="your-domain.com"
export EMAIL="admin@your-domain.com"

# Run installation
./install.sh
```

## Method 3: Step by Step Installation

```bash
cd /tmp/[0;32m[2025-06-16 07:25:57] Criando pacote de deployment VeloFlux SaaS Production...[0m
[0;32m[2025-06-16 07:25:57] ✅ Pacote criado: veloflux-saas-production-20250616-072557.tar.gz[0m
veloflux-saas-production-20250616-072557

# Run individual components
./scripts/install-veloflux-saas-production.sh    # Main installation
./scripts/deploy-production.sh                    # Production deployment
./scripts/healthcheck.sh                         # Health verification
```

## Verification Commands

```bash
# Check services
systemctl status veloflux
systemctl status nginx
docker ps

# Check endpoints
curl http://localhost/
curl http://localhost/health
curl http://localhost:3000/   # Grafana
curl http://localhost:9090/   # Prometheus

# Check logs
tail -f /var/log/veloflux/veloflux.log
tail -f /tmp/veloflux-install.log
```

## Access Points

- **Main Application**: http://YOUR_SERVER_IP/
- **Admin Panel**: http://YOUR_SERVER_IP/admin
- **API**: http://YOUR_SERVER_IP/api
- **Grafana**: http://YOUR_SERVER_IP:3000 (admin/admin)
- **Prometheus**: http://YOUR_SERVER_IP:9090
- **Health Check**: http://YOUR_SERVER_IP/health

## Post-Installation

1. Configure DNS records to point your domains to the server IP
2. SSL certificates will be automatically generated once DNS is configured
3. Access Grafana and customize your dashboards
4. Set up monitoring alerts
5. Configure backup schedules

## Troubleshooting

- **Logs**: `tail -f /var/log/veloflux/*`
- **Service Status**: `systemctl status veloflux`
- **Docker Status**: `docker ps`
- **Network**: `ss -tlnp | grep -E ":(80|443|3000|9090)"`

