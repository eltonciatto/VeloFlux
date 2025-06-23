# 🚀 VeloFlux SaaS - Guia de Instalação Rápida

**VeloFlux** é uma plataforma SaaS de Load Balancer com IA que pode ser instalada em minutos. Este guia fornece métodos de instalação super rápidos para diferentes cenários.

## 📋 Índice

- [Instalação em Uma Linha](#instalação-em-uma-linha)
- [Métodos de Instalação](#métodos-de-instalação)
- [Requisitos do Sistema](#requisitos-do-sistema)
- [Guia de Instalação Interativa](#guia-de-instalação-interativa)
- [Instalação Específica por Ambiente](#instalação-específica-por-ambiente)
- [Solução de Problemas](#solução-de-problemas)
- [Pós-Instalação](#pós-instalação)

## 🎯 Instalação em Uma Linha

### Para Produção (Requer domínio)
```bash
curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/scripts/one-line-install.sh | bash
```

### Para Teste/Docker (Recomendado para iniciantes)
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/docker-quick-install.sh
```

### Para Desenvolvimento
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/dev-quick-install.sh
```

## 🛠️ Métodos de Instalação

### 1. 🧙‍♂️ Instalação Interativa (Recomendado)

O método mais fácil com assistente inteligente:

```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/master-install.sh
```

**Recursos:**
- ✅ Wizard interativo inteligente
- ✅ Detecção automática do sistema
- ✅ Instalação de dependências automática
- ✅ Configuração personalizada
- ✅ Verificações de saúde automáticas

### 2. 🐳 Docker Quick Install (Mais Rápido)

Para setup imediato com Docker:

```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/docker-quick-install.sh
```

**Recursos:**
- ✅ Instalação em ~5 minutos
- ✅ Stack completa (Load Balancer + Redis + Monitoring)
- ✅ Pronto para uso imediato
- ✅ Inclui Prometheus + Grafana
- ✅ Auto-configuração de SSL development

**Acesso após instalação:**
- Frontend: http://localhost
- Admin Panel: http://localhost:9000
- Grafana: http://localhost:3000
- Prometheus: http://localhost:9090

### 3. 🚀 Instalação de Produção

Para servidores de produção com domínio:

```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/super-quick-install.sh --auto-production
```

**Ou com configuração personalizada:**
```bash
./scripts/master-install.sh production -d meudominio.com -e admin@meudominio.com
```

**Recursos:**
- ✅ SSL automático com Let's Encrypt
- ✅ Monitoramento completo
- ✅ Backups automáticos
- ✅ Hardening de segurança
- ✅ Serviços systemd
- ✅ Log rotation

### 4. 🛠️ Ambiente de Desenvolvimento

Para desenvolvedores locais:

```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/dev-quick-install.sh
```

**Recursos:**
- ✅ Hot reload automático
- ✅ Configuração VS Code
- ✅ TypeScript + ESLint
- ✅ Git hooks para qualidade
- ✅ Docker para backend services
- ✅ Scripts de desenvolvimento

**URLs de desenvolvimento:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:9000
- Documentação: http://localhost:9000/docs

### 5. ☁️ Deploy em Cloud/Kubernetes

Para plataformas cloud:

```bash
git clone https://github.com/eltonciatto/VeloFlux.git
cd VeloFlux
./scripts/master-install.sh cloud
```

**Plataformas suportadas:**
- ✅ Kubernetes genérico
- ✅ AWS EKS
- ✅ Google GKE
- ✅ Azure AKS
- ✅ DigitalOcean
- ✅ Coolify

## 💻 Requisitos do Sistema

### Mínimos
- **CPU:** 1 core
- **RAM:** 2GB
- **Disco:** 5GB livres
- **SO:** Linux (Ubuntu 20.04+), macOS 10.15+

### Recomendados
- **CPU:** 2+ cores
- **RAM:** 4GB+
- **Disco:** 20GB+ livres
- **SO:** Ubuntu 22.04 LTS

### Dependências Automáticas
Os scripts instalam automaticamente:
- ✅ Docker & Docker Compose
- ✅ Node.js 18+
- ✅ Go 1.21+ (se necessário)
- ✅ curl, git, openssl
- ✅ Ferramentas de sistema necessárias

## 🎮 Comandos Rápidos

### Instalação Completa Automática
```bash
# Docker (recomendado para teste)
curl -fsSL https://get.veloflux.io/docker | bash

# Produção (requer domínio)
curl -fsSL https://get.veloflux.io/production | bash

# Desenvolvimento
curl -fsSL https://get.veloflux.io/dev | bash
```

### Instalação com Opções
```bash
# Produção com domínio personalizado
VF_DOMAIN=meuapp.com VF_EMAIL=admin@meuapp.com ./scripts/super-quick-install.sh --auto-production

# Docker sem monitoramento
./scripts/docker-quick-install.sh --no-monitoring

# Desenvolvimento com VS Code
./scripts/dev-quick-install.sh --with-vscode

# Verificação antes da instalação
./scripts/master-install.sh --dry-run production
```

## 🔧 Comandos de Gerenciamento

### Docker
```bash
# Ver logs
docker-compose -f docker-compose.prod.yml logs -f

# Reiniciar serviços
docker-compose -f docker-compose.prod.yml restart

# Parar tudo
docker-compose -f docker-compose.prod.yml down

# Status dos serviços
docker-compose -f docker-compose.prod.yml ps
```

### Produção (Systemd)
```bash
# Status do serviço
sudo systemctl status veloflux

# Ver logs
sudo journalctl -u veloflux -f

# Reiniciar
sudo systemctl restart veloflux

# Parar
sudo systemctl stop veloflux
```

### Desenvolvimento
```bash
# Iniciar ambiente completo
./scripts/dev/start-all.sh

# Apenas frontend
./scripts/dev/frontend.sh

# Apenas backend
./scripts/dev/backend.sh

# Parar tudo
./scripts/dev/stop-all.sh
```

## 🔐 Informações de Acesso

### Credenciais Padrão
Após a instalação, as credenciais são geradas automaticamente e exibidas no terminal.

**Usuário Admin:**
- Username: `admin`
- Password: `[gerada automaticamente]`

**Grafana:**
- Username: `admin`
- Password: `[gerada automaticamente]`

### URLs de Acesso

| Serviço | URL | Descrição |
|---------|-----|-----------|
| Frontend | http://localhost | Interface principal |
| Admin Panel | http://localhost:9000 | Painel administrativo |
| API Docs | http://localhost:9000/docs | Documentação da API |
| Metrics | http://localhost:8080/metrics | Métricas Prometheus |
| Grafana | http://localhost:3000 | Dashboards de monitoramento |
| Backend 1 | http://localhost:8001 | Servidor de teste 1 |
| Backend 2 | http://localhost:8002 | Servidor de teste 2 |

## 🚨 Solução de Problemas

### Problemas Comuns

#### 1. Porta em uso
```bash
# Verificar portas em uso
sudo ss -tuln | grep ':80\|:443\|:8080\|:9000'

# Parar serviços conflitantes
sudo systemctl stop apache2 nginx

# Ou usar portas alternativas
export VF_HTTP_PORT=8080
export VF_HTTPS_PORT=8443
```

#### 2. Docker não encontrado
```bash
# Instalar Docker manualmente
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# Logout e login novamente
```

#### 3. Permissões negadas
```bash
# Corrigir permissões
sudo chown -R $USER:$USER .
chmod +x scripts/*.sh
```

#### 4. Node.js versão antiga
```bash
# Instalar Node.js LTS
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 5. Falha na verificação de saúde
```bash
# Verificar logs
docker-compose logs veloflux-lb

# Verificar serviços
docker-compose ps

# Reiniciar serviços
docker-compose restart
```

### Logs e Diagnóstico

#### Ver logs de instalação
```bash
tail -f /tmp/veloflux-install.log
```

#### Verificar status dos serviços
```bash
# Docker
docker-compose ps

# Systemd
sudo systemctl status veloflux

# Processos
ps aux | grep veloflux
```

#### Testar conectividade
```bash
# Teste básico
curl -I http://localhost

# Teste de saúde
curl http://localhost:8080/health

# Teste do admin
curl http://localhost:9000/api/health
```

### Reinstalação Limpa

#### Docker
```bash
# Parar e remover tudo
docker-compose down -v
docker system prune -f

# Reinstalar
./scripts/docker-quick-install.sh
```

#### Produção
```bash
# Backup (opcional)
./scripts/backup.sh

# Remover serviço
sudo systemctl stop veloflux
sudo systemctl disable veloflux
sudo rm /etc/systemd/system/veloflux.service

# Limpar dados
sudo rm -rf /opt/veloflux

# Reinstalar
./scripts/super-quick-install.sh --auto-production
```

## ⚡ Instalação Express

### Opção 1: Uma única linha (Produção)
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/scripts/one-line-install.sh)
```

### Opção 2: Docker Express
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/scripts/docker-express.sh)
```

### Opção 3: Desenvolvimento Express
```bash
bash <(curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/scripts/dev-express.sh)
```

## 🎯 Próximos Passos

### Após Instalação Docker
1. Acesse http://localhost
2. Faça login com as credenciais exibidas
3. Configure seus servidores backend no painel admin
4. Teste o balanceamento de carga
5. Configure monitoramento no Grafana

### Após Instalação de Produção
1. Configure DNS para apontar para seu servidor
2. Verifique os certificados SSL
3. Configure backups automáticos
4. Revise as configurações de segurança
5. Configure alertas de monitoramento

### Após Instalação de Desenvolvimento
1. Abra o projeto no VS Code
2. Instale as extensões recomendadas
3. Execute `./scripts/dev/start-all.sh`
4. Comece a desenvolver em `src/`
5. Teste mudanças em tempo real

## 📚 Documentação Adicional

- 📖 [Guia Completo](./docs/quickstart.md)
- 🔧 [Configuração Avançada](./docs/configuration.md)
- 🚀 [Deploy em Produção](./docs/deployment.md)
- 🐳 [Docker Guide](./docs/docker.md)
- ☁️ [Cloud Deployment](./docs/cloud-deployment.md)
- 🔒 [Segurança](./docs/security.md)
- 📊 [Monitoramento](./docs/monitoring.md)
- 🔧 [Troubleshooting](./docs/troubleshooting.md)

## 🆘 Suporte

### Canais de Suporte
- 🐛 **Issues:** [GitHub Issues](https://github.com/eltonciatto/VeloFlux/issues)
- 💬 **Discord:** [Comunidade VeloFlux](https://discord.gg/veloflux)
- 📧 **Email:** support@veloflux.io
- 📖 **Wiki:** [GitHub Wiki](https://github.com/eltonciatto/VeloFlux/wiki)

### Antes de Pedir Ajuda
1. Verifique os logs: `/tmp/veloflux-install.log`
2. Execute teste de saúde: `curl http://localhost:8080/health`
3. Verifique a documentação de troubleshooting
4. Procure issues similares no GitHub

---

**🚀 VeloFlux SaaS** - Load Balancer com IA para o futuro  
© 2024 VeloFlux Team | Licensed under VPSL-1.0
