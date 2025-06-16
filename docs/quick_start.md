# 🚀 VeloFlux SaaS - Instalação Super Rápida

[![License](https://img.shields.io/badge/license-VPSL--1.0-blue.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-1.1.0-green.svg)](package.json)
[![Docker](https://img.shields.io/badge/docker-ready-blue.svg)](docker-compose.yml)

> **VeloFlux** é uma plataforma SaaS de Load Balancer com IA que pode ser instalada em **menos de 5 minutos**. 

## ⚡ Instalação Express

### 🐳 Docker (Recomendado)
```bash
curl -fsSL https://get.docker.com | sh
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/docker-quick-install.sh
```
**✅ Pronto em ~5 minutos** | **Acesse:** http://localhost

### 🚀 Produção
```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/master-install.sh production -d meudominio.com -e admin@meudominio.com
```
**✅ SSL automático** | **✅ Monitoramento** | **✅ Backups**

### 🛠️ Desenvolvimento
```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/dev-quick-install.sh
```
**✅ Hot reload** | **✅ VS Code** | **Acesse:** http://localhost:5173

### 🧙‍♂️ Wizard Interativo
```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/master-install.sh
```
**✅ Assistente inteligente** | **✅ Auto-detecção** | **✅ Personalizado**

## 🌐 Acesso Rápido

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://localhost | Interface principal |
| **Admin** | http://localhost:9000 | Painel administrativo |
| **Metrics** | http://localhost:8080 | Prometheus metrics |
| **Grafana** | http://localhost:3000 | Dashboards |

## 🔐 Credenciais

Após a instalação, as credenciais são exibidas no terminal:
- **Admin User:** `admin`
- **Password:** *[gerada automaticamente]*

## 🎯 Recursos Principais

- ⚡ **Load Balancer com IA** - Roteamento inteligente
- 🔒 **SSL Automático** - Let's Encrypt integrado
- 📊 **Monitoramento** - Prometheus + Grafana
- 🐳 **Docker Ready** - Deploy em 1 comando
- ☁️ **Multi-Cloud** - AWS, GCP, Azure, K8s
- 🛡️ **WAF Integrado** - Web Application Firewall
- 📈 **Auto-scaling** - Escala automaticamente
- 💾 **Backup Automático** - Proteção de dados

## 🆘 Ajuda Rápida

### Problemas?
```bash
# Ver logs
docker-compose logs -f

# Reiniciar
docker-compose restart

# Verificar saúde
curl http://localhost:8080/health
```

### Suporte
- 📖 [Documentação Completa](docs/QUICK_INSTALL.md)
- 🐛 [Issues](https://github.com/eltonciatto/VeloFlux/issues)
- 💬 [Discord](https://discord.gg/veloflux)

---

**Criado com ❤️ pela equipe VeloFlux**
