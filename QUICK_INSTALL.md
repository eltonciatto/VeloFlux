# 🚀 VeloFlux SaaS - Quick Installation Guide

## One-Command Installation

Get VeloFlux SaaS running in minutes with our automated installation scripts!

### 🎯 Interactive Installation Menu
```bash
./scripts/install.sh
```
*Choose your installation method with a beautiful interactive menu*

### 🛠️ Quick Install Options

#### For Development
```bash
./scripts/dev-install.sh
```
*Perfect for local development with hot reload*

#### For Quick Testing  
```bash
./scripts/docker-install.sh
```
*Full stack with Docker in 10 minutes*

#### For Production
```bash
./scripts/quick-install.sh
```
*Complete production setup with SSL and monitoring*

#### For Coolify Platform
```bash
./scripts/coolify-deploy.sh
```
*Automated Coolify deployment preparation*

## 📋 System Requirements

### Minimum Requirements
- **RAM**: 2GB available
- **Storage**: 5GB free space
- **Network**: Internet connection
- **OS**: Linux, macOS, or Windows (WSL)

### Required Tools
- `curl` (for downloads)
- `git` (version control)
- `openssl` (SSL certificates)

### For Docker Installation
- **Docker** 20.10+
- **Docker Compose** 2.0+

### For Development
- **Node.js** 18+
- **npm** 8+

## 🎯 Choose Your Installation Method

| Method | Time | Best For | Production Ready |
|--------|------|----------|------------------|
| **Development** | ~5 min | Local development, debugging | ❌ |
| **Docker Simple** | ~10 min | Testing, demos, POCs | ⚠️ |
| **Production** | ~20 min | Production deployment | ✅ |
| **Coolify** | ~10 min | Coolify platform | ✅ |

## 🚀 After Installation

### Access Your VeloFlux Instance
- **Load Balancer**: http://localhost
- **Metrics Dashboard**: http://localhost:8080
- **Admin API**: http://localhost:9000

### Next Steps
1. 📝 Configure backends in `config/config.yaml`
2. 🔐 Setup production SSL certificates
3. 📊 Configure monitoring and alerts
4. 🌐 Point your domain to the server

## 📚 Full Documentation

For complete documentation, see:
- **Installation Guide**: [scripts/README.md](scripts/README.md)
- **Configuration**: [docs/configuration.md](docs/configuration.md)
- **Deployment**: [docs/deployment.md](docs/deployment.md)

## 🆘 Need Help?

- 🐛 **Issues**: [GitHub Issues](https://github.com/eltonciatto/VeloFlux/issues)
- 💬 **Discord**: [Join our community](https://discord.gg/veloflux)
- 📧 **Email**: support@veloflux.io

---

**Happy Load Balancing! 🎉**
