# 📋 VeloFlux SaaS - Scripts de Instalação Criados

Este documento resume todos os scripts de instalação rápida criados para facilitar a implantação do VeloFlux SaaS.

## 🎯 Scripts Principais

### 1. `scripts/master-install.sh` - Script Mestre
**O script mais completo com wizard interativo**

**Características:**
- ✅ Wizard interativo inteligente
- ✅ Auto-detecção de sistema operacional
- ✅ Suporte a todos os métodos de instalação
- ✅ Configuração personalizada
- ✅ Modo dry-run para preview
- ✅ Validação de requisitos automática

**Uso:**
```bash
# Wizard interativo
./scripts/master-install.sh

# Instalação direta
./scripts/master-install.sh production -d meudominio.com -e admin@meudominio.com
./scripts/master-install.sh docker
./scripts/master-install.sh development
./scripts/master-install.sh cloud

# Preview sem instalar
./scripts/master-install.sh --dry-run docker

# Ajuda
./scripts/master-install.sh --help
```

### 2. `scripts/docker-quick-install.sh` - Docker Super Rápido
**Instalação Docker otimizada e completa**

**Características:**
- ✅ Stack completa (Load Balancer + Redis + PostgreSQL + Monitoring)
- ✅ Pronto em ~5 minutos
- ✅ Inclui Prometheus + Grafana
- ✅ SSL de desenvolvimento
- ✅ Verificações de saúde automáticas
- ✅ Docker Compose otimizado

**Uso:**
```bash
./scripts/docker-quick-install.sh
```

**Serviços incluídos:**
- VeloFlux Load Balancer (localhost:80, localhost:9000)
- Redis (localhost:6379)
- PostgreSQL (localhost:5432)
- Prometheus (localhost:9090)
- Grafana (localhost:3000)
- Backend test servers (localhost:8001, localhost:8002)

### 3. `scripts/dev-quick-install.sh` - Desenvolvimento
**Ambiente de desenvolvimento completo**

**Características:**
- ✅ Hot reload com Vite
- ✅ Configuração VS Code automática
- ✅ TypeScript + ESLint + Prettier
- ✅ Git hooks para qualidade de código
- ✅ Docker para backend services
- ✅ Scripts de desenvolvimento

**Uso:**
```bash
./scripts/dev-quick-install.sh
```

**Scripts criados:**
- `./scripts/dev/start-all.sh` - Inicia ambiente completo
- `./scripts/dev/frontend.sh` - Apenas frontend
- `./scripts/dev/backend.sh` - Apenas backend Docker
- `./scripts/dev/stop-all.sh` - Para todos os serviços

### 4. `scripts/super-quick-install.sh` - Instalação Completa
**Script de instalação super completo com todas as opções**

**Características:**
- ✅ Suporte a produção, desenvolvimento, Docker, cloud
- ✅ SSL automático com Let's Encrypt
- ✅ Monitoramento completo
- ✅ Backups automáticos
- ✅ Hardening de segurança
- ✅ Serviços systemd

**Uso:**
```bash
# Produção automática
./scripts/super-quick-install.sh --auto-production

# Docker automático
./scripts/super-quick-install.sh --auto-docker

# Desenvolvimento automático
./scripts/super-quick-install.sh --auto-dev
```

### 5. `scripts/one-line-install.sh` - Uma Linha
**Instalação em uma única linha para produção**

**Características:**
- ✅ Clone automático do repositório
- ✅ Perfeito para produção rápida
- ✅ Pode ser usado via curl

**Uso:**
```bash
# Uso direto
./scripts/one-line-install.sh

# Via curl (produção)
curl -fsSL https://raw.githubusercontent.com/eltonciatto/VeloFlux/main/scripts/one-line-install.sh | bash
```

## 🧪 Scripts de Suporte

### `scripts/test-install-scripts.sh` - Teste dos Scripts
**Valida todos os scripts de instalação**

**Uso:**
```bash
# Testes rápidos
./scripts/test-install-scripts.sh --quick

# Testes completos
./scripts/test-install-scripts.sh --full

# Ajuda
./scripts/test-install-scripts.sh --help
```

### `scripts/demo-install.sh` - Demonstração
**Demo interativo de todos os métodos de instalação**

**Uso:**
```bash
# Demo completo
./scripts/demo-install.sh

# Demo interativo
./scripts/demo-install.sh --interactive

# Comandos rápidos
./scripts/demo-install.sh --quick
```

## 📊 Matriz de Instalação

| Script | Tempo | Complexidade | Melhor Para | Recursos |
|--------|-------|--------------|-------------|-----------|
| docker-quick-install.sh | ~5 min | Baixa | Teste/Demo | Stack completa |
| dev-quick-install.sh | ~8 min | Baixa | Desenvolvimento | Hot reload |
| super-quick-install.sh | ~15 min | Média | Produção | SSL/Monitoring |
| master-install.sh | Variável | Baixa | Todos | Wizard inteligente |
| one-line-install.sh | ~3 min | Muito Baixa | Quick start | Automático |

## 🎯 Comandos de Uma Linha

### Para Copiar e Colar:

**Docker (Recomendado para teste):**
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/docker-quick-install.sh
```

**Desenvolvimento:**
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/dev-quick-install.sh
```

**Produção:**
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh production -d SEUDOMINIO.com -e admin@SEUDOMINIO.com
```

**Wizard Interativo:**
```bash
git clone https://github.com/eltonciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh
```

## 💡 Recomendações

### 🔰 Para Iniciantes
→ Use `./scripts/docker-quick-install.sh`  
→ Rápido, seguro e funciona imediatamente

### 👨‍💻 Para Desenvolvedores
→ Use `./scripts/dev-quick-install.sh`  
→ Ambiente completo com hot reload e VS Code

### 🚀 Para Produção
→ Use `./scripts/master-install.sh production`  
→ Com wizard interativo para configuração segura

### ☁️ Para Cloud/DevOps
→ Use `./scripts/master-install.sh cloud`  
→ Gera manifests para Kubernetes e plataformas cloud

### ⚡ Para Testes Rápidos
→ Use a instalação em uma linha  
→ Para quando você quer testar imediatamente

## 🔧 Recursos dos Scripts

### Funcionalidades Comuns:
- ✅ Auto-detecção de sistema operacional
- ✅ Instalação automática de dependências
- ✅ Verificação de requisitos do sistema
- ✅ Verificações de saúde pós-instalação
- ✅ Logs detalhados de instalação
- ✅ Geração automática de credenciais
- ✅ Configuração de SSL development
- ✅ Tratamento de erros robusto

### Funcionalidades Específicas:

**Docker Quick Install:**
- Auto-instalação do Docker se necessário
- Configuração otimizada do Docker Compose
- Stack completa com monitoramento
- Verificação de portas em uso
- Health checks para todos os serviços

**Development Quick Install:**
- Configuração VS Code automática
- Git hooks para qualidade de código
- Scripts de desenvolvimento personalizados
- Suporte a múltiplos package managers (npm, yarn, bun)
- Hot reload configurado

**Production Install:**
- SSL automático com Let's Encrypt
- Configuração de serviços systemd
- Hardening de segurança
- Backups automáticos configurados
- Log rotation configurado

## 📁 Arquivos de Configuração Criados

### Configurações Docker:
- `docker-compose.prod.yml` - Stack de produção completa
- `docker-compose.dev.yml` - Serviços para desenvolvimento
- `.env.docker` - Variáveis de ambiente Docker

### Configurações de Desenvolvimento:
- `.vscode/settings.json` - Configurações VS Code
- `.vscode/launch.json` - Debug configurations
- `.vscode/tasks.json` - Tasks do VS Code
- `.vscode/extensions.json` - Extensões recomendadas
- `scripts/dev/*.sh` - Scripts de desenvolvimento

### Configurações de Monitoramento:
- `monitoring/prometheus.yml` - Configuração Prometheus
- `monitoring/grafana/` - Dashboards e datasources
- Scripts de backup automático

### Configurações de Produção:
- Arquivos de serviço systemd
- Configuração de logrotate
- Scripts de backup
- Certificados SSL

## 🆘 Troubleshooting

### Problemas Comuns:

1. **Porta em uso**: Scripts verificam automaticamente e orientam solução
2. **Docker não encontrado**: Auto-instalação em sistemas suportados
3. **Permissões negadas**: Scripts corrigem permissões automaticamente
4. **Node.js versão antiga**: Orientação para atualização
5. **Falha na verificação de saúde**: Logs detalhados para diagnóstico

### Logs de Instalação:
Todos os scripts geram logs em `/tmp/veloflux-install.log`

### Comandos de Diagnóstico:
```bash
# Ver logs de instalação
tail -f /tmp/veloflux-install.log

# Verificar serviços Docker
docker-compose ps

# Verificar saúde dos serviços
curl http://localhost:8080/health

# Testar scripts sem instalar
./scripts/master-install.sh --dry-run docker
```

## 📚 Documentação Adicional

- **[QUICK_INSTALL.md](docs/QUICK_INSTALL.md)** - Guia completo de instalação
- **[QUICK_START.md](QUICK_START.md)** - Guia de início rápido
- **README.md** - Documentação principal do projeto

---

**🚀 VeloFlux SaaS** - Scripts de instalação criados para facilitar a vida do usuário!  
© 2024 VeloFlux Team | Licensed under VPSL-1.0
