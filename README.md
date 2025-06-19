# 🚀 VeloFlux - Container-Na### 📖 **Documentação Completa**
> **Toda documentação do projeto está centralizada em [`/docs`](./docs/INDEX.md)**

### 🎯 **Documentação Principal**
- **[📋 Índice Central](./docs/INDEX.md)** - **COMECE AQUI**
- **[⚡ Quick Install](./docs/QUICK_INSTALL.md)** - Instalação rápida
- **[👨‍💻 Quickstart Desenvolvedores](./docs/quickstart_desenvolvedor.md)** - Para devs

### 🏆 **Relatórios das Fases**
- **[FASE 1](./docs/phases/RELATORIO_FINAL_FASE1_SUCESSO_TOTAL.md)** - Base Implementation ✅
- **[FASE 2](./docs/phases/RELATORIO_FINAL_FASE2_SUCESSO_TOTAL.md)** - Advanced Features ✅  
- **[FASE 3](./docs/phases/RELATORIO_FINAL_FASE3_SUCESSO_TOTAL.md)** - Premium Features ✅

### 🔧 **Documentação Técnica**
- **[🔧 Correções](./docs/fixes/)** - Todas as correções aplicadas
- **[⚙️ Configuração](./docs/organization/)** - Setup e configuração
- **[🛡️ Segurança](./docs/organization/SECURITY_FIXES_APPLIED.md)** - SegurançaBalancer

[![License: VPSL-1.0](https://img.shields.io/badge/License-VPSL--1.0-blue.svg)](LICENSE)
[![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go)](https://golang.org/)
[![React](https://img.shields.io/badge/React-18+-61DAFB?logo=react)](https://reactjs.org/)
[![Status](https://img.shields.io/badge/Status-100%25%20Funcional-green.svg)](docs/RELATORIO-FINAL-APIS-COMPLETO.md)

> **Container-Native Global Load Balancer com Inteligência Artificial e Multi-Tenancy**

## ⚡ Quick Start (5 minutos)

```bash
# 1. Clone o repositório
git clone [repo-url]
cd VeloFlux

# 2. Execute o setup automático
./scripts/setup/install.sh

# 3. Verifique o status
./scripts/utils/check-status.sh

# 4. Acesse o frontend
open http://localhost:3000
```

## 📚 Documentação

### 📖 **Documentação Completa**
> **Toda documentação do projeto está organizada em [`/documentation`](./documentation/README.md)**

### 🎯 **Documentação Principal**
- **[📋 Índice Central](./documentation/README.md)** - **COMECE AQUI**
- **[📖 Docs Técnicos](./docs/INDEX.md)** - Documentação detalhada
- **[⚡ Quick Install](./docs/QUICK_INSTALL.md)** - Instalação rápida

### � **Relatórios das Fases**
- **[FASE 1](./documentation/phases/RELATORIO_FINAL_FASE1_SUCESSO_TOTAL.md)** - Base Implementation ✅
- **[FASE 2](./documentation/phases/RELATORIO_FINAL_FASE2_SUCESSO_TOTAL.md)** - Advanced Features ✅  
- **[FASE 3](./documentation/phases/RELATORIO_FINAL_FASE3_SUCESSO_TOTAL.md)** - Premium Features ✅

### 🔧 **Documentação Técnica**
- **[🔧 Correções](./documentation/fixes/)** - Todas as correções aplicadas
- **[⚙️ Configuração](./documentation/technical/)** - Setup e configuração
- **[�️ Segurança](./documentation/technical/SECURITY_FIXES_APPLIED.md)** - Segurança

## 🚀 Características Principais

### ⚡ Load Balancing Inteligente
- **Algoritmos Adaptativos** com IA/ML
- **Predição de Carga** em tempo real
- **Auto-scaling** baseado em métricas

### 🏢 Multi-Tenancy Completo
- **Isolamento completo** entre tenants
- **OIDC/SSO** por tenant
- **Métricas e logs** separados

### 🔒 Segurança Enterprise
- **JWT Authentication** com refresh tokens
- **RBAC** granular por tenant
- **Rate limiting** e proteção DDoS

### 📊 Observabilidade
- **Prometheus** metrics
- **Real-time monitoring**
- **Alertas inteligentes**

## 🛠️ Stack Tecnológica

### Backend
- **Go 1.21+** - Performance e concorrência
- **Redis** - Cache e sessões
- **PostgreSQL** - Dados persistentes
- **Prometheus** - Métricas

### Frontend
- **React 18+** - Interface moderna
- **TypeScript** - Type safety
- **Tailwind CSS** - Design system
- **Vite** - Build tool

### DevOps
- **Docker** - Containerização
- **Docker Compose** - Desenvolvimento
- **Coolify** - Deploy simplificado

## 📊 Status do Projeto

| Componente | Status | Cobertura |
|------------|--------|-----------|
| 🔄 Load Balancer | ✅ 100% | APIs completas |
| 🤖 IA/ML System | ✅ 100% | Algoritmos adaptativos |
| 🏢 Multi-tenancy | ✅ 100% | Isolamento completo |
| 🔒 Autenticação | ✅ 100% | JWT + OIDC |
| 🎨 Frontend | ✅ 100% | React + hooks |
| 📊 Monitoring | ✅ 100% | Prometheus + logs |

## 🧪 Scripts de Desenvolvimento

### 📁 Estrutura de Scripts (em `/scripts/`)

```
scripts/
├── setup/
│   └── install.sh          # 🚀 Instalação completa
├── testing/
│   ├── test-apis-complete.sh     # 🧪 Testes APIs
│   ├── test-ai-functionality.sh  # 🤖 Testes IA
│   └── validacao-final-ai.sh     # ✅ Validação final
├── utils/
│   ├── check-status.sh     # 📊 Status do sistema
│   ├── final-report.sh     # 📋 Relatório final
│   └── quick-cleanup.sh    # 🧹 Limpeza
└── archive/               # 📦 Scripts antigos
```

### ⚡ Comandos Úteis

```bash
# Verificar status geral
./scripts/utils/check-status.sh

# Executar testes completos
./scripts/testing/test-apis-complete.sh

# Testar funcionalidades IA
./scripts/testing/test-ai-functionality.sh

# Limpeza rápida
./scripts/utils/quick-cleanup.sh

# Relatório final
./scripts/utils/final-report.sh
```

## 🔍 Resolução de Problemas

### 📖 Documentação
- **[Troubleshooting](./docs/troubleshooting_pt-BR.md)** - Problemas comuns
- **[Security Issues](./docs/security_improvements.md)** - Questões de segurança

### 🆘 Problemas Comuns

| Problema | Solução |
|----------|---------|
| Frontend não carrega | `cd frontend && npm install && npm run dev` |
| Backend não responde | `docker-compose up -d && ./scripts/utils/check-status.sh` |
| Erro de autenticação | Verificar tokens em [AUTH docs](./docs/AUTH-SISTEMA-COMPLETO.md) |
| IA não funciona | Executar `./scripts/testing/test-ai-functionality.sh` |

## 📄 Licença

Este projeto está licenciado sob a **VeloFlux Public Source License (VPSL) v1.0** - veja o arquivo [LICENSE](LICENSE) para detalhes.

### 🚫 Uso Comercial
- ❌ **Não permitido** sem licença comercial
- ✅ **Desenvolvimento e teste** livre
- 💼 **Licença comercial:** [contact@veloflux.io](mailto:contact@veloflux.io)

## 🤝 Contribuindo

1. **Leia a documentação** em [`/docs`](./docs/INDEX.md)
2. **Fork** o projeto
3. **Crie uma branch** (`git checkout -b feature/AmazingFeature`)
4. **Commit** suas mudanças (`git commit -m 'Add some AmazingFeature'`)
5. **Execute o Linter** (`cd frontend && npm install && npm run lint`)
6. **Push** para a branch (`git push origin feature/AmazingFeature`)
7. **Abra um Pull Request**

---

<div align="center">

**[📖 Documentação Completa](./docs/INDEX.md)** | **[🚀 Quick Start](./docs/QUICK_INSTALL.md)** | **[🔒 Licença](LICENSE)**

---

Made with ❤️ by VeloFlux Team

</div>
