# VeloFlux SaaS Production Deployment Guide

## Prerequisites
- Ubuntu 20.04+ or CentOS 7+
- Root access to the server
- Internet connectivity
- At least 4GB RAM and 20GB disk space

## Quick Installation

1. Upload this entire directory to your server:
   ```bash
   scp -r veloflux-saas-production/ root@YOUR_SERVER_IP:/tmp/
   ```

2. SSH into your server:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```

3. Navigate to the uploaded directory:
   ```bash
   cd /tmp/veloflux-saas-production
   ```

4. Run the production installation:
   ```bash
   ./install.sh
   ```

## Configuration

Before running the installation, you can customize the following environment variables:

```bash
export MAIN_DOMAIN="your-domain.com"
export ADMIN_DOMAIN="admin.your-domain.com"
export API_DOMAIN="api.your-domain.com"
export EMAIL="admin@your-domain.com"
export ENABLE_SSL="true"
export ENABLE_MONITORING="true"
```

## Post-Installation

1. Configure DNS records to point to your server IP
2. Access Grafana at http://YOUR_SERVER_IP:3000 (admin/admin)
3. Access your application at http://YOUR_SERVER_IP/
4. Check system status: `systemctl status veloflux`

## Monitoring & Maintenance

- **Logs**: `/var/log/veloflux/`
- **Backup**: Run `/opt/veloflux/scripts/backup.sh`
- **Health Check**: `/opt/veloflux/scripts/healthcheck.sh`
- **Monitoring**: `/opt/veloflux/scripts/monitor.sh`

## Support

For issues, check the installation logs in `/tmp/veloflux-install.log`
