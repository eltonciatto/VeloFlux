# 🚀 VeloFlux Load Balancer

[![License](https://img.shields.io/badge/license-VPSL-blue.svg)](LICENSE)
[![Go Version](https://img.shields.io/badge/go-1.23+-00ADD8.svg)](https://golang.org)
[![Node Version](https://img.shields.io/badge/node-20+-339933.svg)](https://nodejs.org)
[![Docker](https://img.shields.io/badge/docker-ready-2496ED.svg)](https://docker.com)

VeloFlux é uma solução completa de load balancing com inteligência artificial, interface web moderna e monitoramento avançado.

## 📁 Estrutura do Projeto

```
VeloFlux/
├── 🎨 frontend/                 # Frontend React/TypeScript
│   ├── src/                     # Código fonte React
│   ├── public/                  # Arquivos públicos
│   ├── dist/                    # Build de produção
│   ├── package.json             # Dependências Node.js
│   ├── Dockerfile               # Container do frontend
│   └── nginx.conf               # Config nginx frontend
│
├── ⚙️ backend/                  # Backend Go
│   ├── cmd/                     # Aplicações principais
│   ├── internal/                # Código interno
│   ├── go.mod                   # Dependências Go
│   ├── go.sum                   # Checksums das dependências
│   └── Dockerfile               # Container do backend
│
├── 🏗️ infra/                    # Infraestrutura e configurações
│   ├── config/                  # Configurações YAML
│   ├── nginx/                   # Configurações Nginx LB
│   ├── certs/                   # Certificados SSL
│   ├── scripts/                 # Scripts de automação
│   └── test/                    # Arquivos de teste
│
├── 📚 docs/                     # Documentação
├── 🔍 examples/                 # Exemplos de uso
├── docker-compose.yml           # Orquestração completa
└── README.md                    # Este arquivo
```

## 🌟 Características

### 🎯 Backend (Go)
- ⚡ **Alta Performance**: Load balancer em Go com baixa latência
- 🤖 **IA Integrada**: Algoritmos adaptativos de balanceamento
- 📊 **Métricas**: Prometheus metrics integrado
- 🛡️ **Segurança**: WAF integrado e rate limiting
- 🌍 **Multi-tenant**: Suporte completo a múltiplos tenants
- 🔧 **APIs**: RESTful APIs para gerenciamento

### 🎨 Frontend (React/TypeScript)
- ⚛️ **Moderno**: React 18 + TypeScript + Vite
- 📱 **Responsivo**: Interface adaptável a todos os dispositivos
- 🎨 **Design System**: Tailwind CSS + Shadcn/ui
- 🌐 **i18n**: Suporte completo a internacionalização
- 📊 **Dashboards**: Visualizações em tempo real
- 🔐 **Autenticação**: Sistema completo de auth

### 🏗️ Infraestrutura
- 🐳 **Containerizado**: Docker + Docker Compose
- 🔄 **Load Balancer**: Nginx como entry point
- 📈 **Monitoramento**: Prometheus + Grafana + AlertManager
- 💾 **Cache**: Redis para clustering e sessões
- 🔒 **Segurança**: SSL/TLS ready

## 🚀 Quick Start

### Pré-requisitos
- Docker & Docker Compose
- Node.js 20+ (para desenvolvimento frontend)
- Go 1.23+ (para desenvolvimento backend)

### 1. Clone e Setup
```bash
git clone https://github.com/eltonciatto/veloflux.git
cd veloflux
```

### 2. Build e Start (Produção)
```bash
# Build e start de todos os serviços
docker-compose up --build -d

# Verificar status
docker-compose ps
```

### 3. Acessar Serviços
- **🌐 Frontend**: http://localhost (porta 80)
- **📊 Backend API**: http://localhost/api
- **📈 Métricas**: http://localhost/metrics
- **📊 Grafana**: http://localhost:3001 (admin/veloflux123)
- **🔍 Prometheus**: http://localhost:9091

## 🛠️ Desenvolvimento

### Frontend Development
```bash
cd frontend
npm install
npm run dev
# Frontend dev server: http://localhost:5173
```

### Backend Development
```bash
cd backend
go mod download
go run cmd/velofluxlb/main.go
# Backend dev server: http://localhost:8080
```

### Build Individual
```bash
# Frontend build
cd frontend && npm run build

# Backend build
cd backend && go build -o veloflux cmd/velofluxlb/main.go
```

## ⚙️ Configuração

### Backend Config
Localizado em `infra/config/backend-config.yaml`:
```yaml
global:
  bind_address: "0.0.0.0:80"
  metrics_address: "0.0.0.0:8080"

api:
  bind_address: "0.0.0.0:9090"
  auth_enabled: false

pools:
  - name: "api-pool"
    algorithm: "round_robin"
    backends:
      - address: "localhost:9090"
        weight: 100
```

### Load Balancer Config
Nginx principal em `infra/nginx/conf.d/default.conf` roteia:
- `/` → Frontend React
- `/api/*` → Backend Go APIs
- `/metrics` → Backend Metrics

## 📊 Monitoramento

### Métricas Disponíveis
- Request rate, latency, errors
- Backend health status
- Resource utilization
- Custom business metrics

### Dashboards Grafana
- Overview geral do sistema
- Performance de APIs
- Status de backends
- Alertas configuráveis

## 🔒 Segurança

### Recursos de Segurança
- WAF (Web Application Firewall)
- Rate limiting configurável
- Headers de segurança
- SSL/TLS ready
- Authentication & Authorization

## 🚀 Deploy em Produção

### Docker Compose (Recomendado)
```bash
# Produção com SSL
cp .env.example .env
# Editar variáveis de ambiente
docker-compose -f docker-compose.yml up -d
```

### Kubernetes
Manifests disponíveis em `charts/` para deploy K8s.

### Configurações de Produção
- Configurar certificados SSL
- Ajustar limites de recursos
- Configurar backup do Redis
- Setup de logging centralizado

## 🧪 Testes

```bash
# Backend tests
cd backend && go test ./...

# Frontend tests
cd frontend && npm test

# Integration tests
./infra/scripts/test-integration.sh
```

## 📈 Performance

### Benchmarks
- **Throughput**: 50k+ req/s
- **Latency**: <2ms P99
- **Memory**: <100MB base
- **CPU**: Low overhead

### Otimizações
- Connection pooling
- Keep-alive connections
- Gzip compression
- Static asset caching

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -am 'Add nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a VeloFlux Public Source License (VPSL) v1.0.
Veja o arquivo [LICENSE](LICENSE) para detalhes.

Para uso comercial, entre em contato: contact@veloflux.io

## 🆘 Suporte

- 📧 Email: support@veloflux.io
- 💬 Discord: [VeloFlux Community](https://discord.gg/veloflux)
- 📖 Docs: [docs.veloflux.io](https://docs.veloflux.io)
- 🐛 Issues: [GitHub Issues](https://github.com/eltonciatto/veloflux/issues)

---

**VeloFlux** - High-Performance Load Balancer with AI 🚀
