# 🚀 VeloFlux SaaS - Installation Scripts

Este diretório contém scripts de instalação automatizados para diferentes cenários de deployment do VeloFlux SaaS.

## 📁 Scripts Disponíveis

### 🎯 Script Principal
- **`install.sh`** - Menu interativo de instalação com todas as opções

### 🛠️ Scripts Específicos
- **`dev-install.sh`** - Configuração rápida para desenvolvimento
- **`docker-install.sh`** - Instalação simples com Docker
- **`quick-install.sh`** - Instalação completa para produção
- **`coolify-deploy.sh`** - Preparação para deploy no Coolify

### 🔧 Scripts Utilitários
- **`test-translation-visibility.sh`** - Teste de visibilidade de traduções

## 🚀 Uso Rápido

### Instalação Mais Simples
```bash
./scripts/install.sh
```

### Instalação Direta por Tipo

#### Para Desenvolvimento
```bash
./scripts/dev-install.sh
```

#### Para Teste/Demo Rápido
```bash
./scripts/docker-install.sh
```

#### Para Produção Completa
```bash
./scripts/quick-install.sh
```

#### Para Deploy no Coolify
```bash
./scripts/coolify-deploy.sh
```

## 📋 Requisitos do Sistema

### Mínimos
- **OS**: Linux, macOS, Windows (WSL)
- **RAM**: 2GB disponível
- **Disk**: 5GB livres
- **Network**: Conexão à internet

### Ferramentas Necessárias
- `curl` - Downloads
- `git` - Controle de versão
- `openssl` - Certificados SSL

### Para Docker
- **Docker** 20.10+
- **Docker Compose** 2.0+

### Para Desenvolvimento
- **Node.js** 18+
- **npm** 8+
- **Go** 1.19+ (opcional, para build local)

## 🎯 Cenários de Uso

### 🛠️ Desenvolvimento Local
**Use**: `dev-install.sh`
- Frontend com hot reload
- Backend de teste
- Configuração automática
- Ideal para: Desenvolvimento, debugging

### 🐳 Demo/Teste Rápido
**Use**: `docker-install.sh`
- Stack completo containerizado
- Configuração mínima
- Pronto em 10 minutos
- Ideal para: Demos, POCs, testes

### 🚀 Produção
**Use**: `quick-install.sh`
- Configuração completa
- SSL personalizado
- Monitoramento
- Segurança hardening
- Ideal para: Produção, staging

### ☁️ Coolify Platform
**Use**: `coolify-deploy.sh`
- Configuração otimizada para Coolify
- Docker Compose específico
- Guia de deployment completo
- Ideal para: Deploy em Coolify

## 📊 Comparação de Scripts

| Feature | dev-install | docker-install | quick-install | coolify-deploy |
|---------|-------------|----------------|---------------|----------------|
| **Tempo** | ~5 min | ~10 min | ~20 min | ~10 min |
| **SSL** | Self-signed | Self-signed | Customizável | Coolify managed |
| **Monitoramento** | Básico | Básico | Completo | Coolify integrated |
| **Escalabilidade** | Local | Single node | Multi-node | Coolify managed |
| **Produção** | ❌ | ⚠️ | ✅ | ✅ |

## 🔍 Detalhes dos Scripts

### `install.sh` - Menu Principal
Script interativo que oferece todas as opções de instalação com interface amigável.

**Features:**
- Menu visual com ASCII art
- Verificação de requisitos
- Validação de ambiente
- Documentação integrada
- Suporte a múltiplas opções

### `dev-install.sh` - Desenvolvimento
Configuração otimizada para desenvolvimento local.

**O que faz:**
- Copia arquivos de configuração
- Instala dependências Node.js
- Gera certificados de desenvolvimento
- Oferece opções de modo dev (frontend, full-stack, backend)

**Modos disponíveis:**
1. **Frontend only**: React dev server (porta 5173)
2. **Full stack**: Frontend + Load Balancer + backends
3. **Load Balancer only**: Docker com backends

### `docker-install.sh` - Docker Simples
Instalação rápida com Docker para testes e demos.

**O que faz:**
- Verifica Docker
- Cria configurações mínimas
- Gera certificados auto-assinados
- Builda e inicia todos os serviços
- Executa health checks

**Serviços incluídos:**
- VeloFlux Load Balancer
- Redis (estado/cache)
- 2 backends de exemplo (Nginx)

### `quick-install.sh` - Produção Completa
Instalação completa para ambiente de produção.

**O que faz:**
- Instala dependências do sistema (Docker, Node.js)
- Configuração de ambiente interativa
- Setup SSL customizável (existente/auto-gerado/skip)
- Build de produção
- Configuração de monitoramento
- Health checks completos

**Opções SSL:**
1. **Certificados existentes**: Use seus próprios certificados
2. **Auto-gerados**: Certificados self-signed para teste
3. **Skip**: Configurar SSL depois

### `coolify-deploy.sh` - Coolify Platform
Preparação específica para deployment no Coolify.

**O que faz:**
- Cria configuração Docker Compose para Coolify
- Gera Dockerfile otimizado para frontend
- Configura Nginx para produção
- Cria template de variáveis de ambiente
- Gera guia completo de deployment

**Arquivos criados:**
- `.coolify/docker-compose.yml`
- `Dockerfile.frontend`
- `.coolify/nginx.conf`
- `COOLIFY_DEPLOYMENT.md`

## 🛠️ Personalização

### Variáveis de Ambiente
Todos os scripts respeitam estas variáveis:

```bash
# Configuração de domínio
export DOMAIN="veloflux.io"
export API_SUBDOMAIN="api"
export ADMIN_SUBDOMAIN="admin"

# Credenciais
export ADMIN_USER="admin"
export ADMIN_PASS="your-secure-password"

# URLs de API (para Coolify)
export API_URL="https://api.veloflux.io"
export ADMIN_URL="https://admin.veloflux.io"
```

### Customização de Scripts
Para customizar um script:

1. Copie o script original:
   ```bash
   cp scripts/docker-install.sh scripts/my-custom-install.sh
   ```

2. Edite conforme necessário

3. Torne executável:
   ```bash
   chmod +x scripts/my-custom-install.sh
   ```

## 🔧 Troubleshooting

### Problemas Comuns

**Script não executa:**
```bash
chmod +x scripts/install.sh
```

**Docker não encontrado:**
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com | sh

# macOS
brew install docker
```

**Node.js não encontrado:**
```bash
# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS
brew install node
```

**Porta já em uso:**
```bash
# Verificar o que está usando a porta 80
sudo lsof -i :80

# Parar serviços conflitantes
sudo systemctl stop apache2  # ou nginx
```

**Certificados SSL inválidos:**
```bash
# Regenerar certificados
rm certs/*
./scripts/docker-install.sh
```

### Logs e Debug

**Ver logs dos serviços:**
```bash
docker-compose logs -f
```

**Ver logs específicos:**
```bash
docker-compose logs veloflux-lb
docker-compose logs redis
```

**Debug de conectividade:**
```bash
# Testar health check
curl http://localhost:8080/health

# Testar backends
curl http://localhost:8001
curl http://localhost:8002

# Testar Redis
docker-compose exec redis redis-cli ping
```

## 📚 Documentação Adicional

- **README.md** - Visão geral do projeto
- **docs/quickstart.md** - Guia de início rápido
- **docs/configuration.md** - Configuração detalhada
- **docs/deployment.md** - Opções de deployment
- **COOLIFY_DEPLOYMENT.md** - Guia específico do Coolify (criado pelo script)

## 🆘 Suporte

- 🐛 **Issues**: https://github.com/eltonciatto/VeloFlux/issues
- 💬 **Discord**: https://discord.gg/veloflux
- 📚 **Docs**: https://github.com/eltonciatto/VeloFlux/docs
- 📧 **Email**: support@veloflux.io

---

**🚀 Happy Load Balancing!**
