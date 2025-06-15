#!/bin/bash

# 🎯 VeloFlux SaaS - Demo de Instalação
# Demonstra todos os métodos de instalação disponíveis

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${PURPLE}${BOLD}🎯 VeloFlux SaaS - Demo de Métodos de Instalação${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_demo() {
    echo -e "${BLUE}${BOLD}[DEMO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}[SUCCESS]${NC} $1"
}

print_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

# Show available scripts
show_available_scripts() {
    echo -e "${YELLOW}${BOLD}📋 Scripts de Instalação Disponíveis:${NC}"
    echo ""
    
    echo -e "${GREEN}1. scripts/master-install.sh${NC}"
    echo -e "   ${CYAN}•${NC} Wizard interativo inteligente"
    echo -e "   ${CYAN}•${NC} Suporte a todos os métodos de instalação"
    echo -e "   ${CYAN}•${NC} Auto-detecção de sistema"
    echo -e "   ${CYAN}•${NC} Configuração personalizada"
    echo ""
    
    echo -e "${GREEN}2. scripts/docker-quick-install.sh${NC}"
    echo -e "   ${CYAN}•${NC} Instalação Docker super rápida"
    echo -e "   ${CYAN}•${NC} Stack completa (LB + Redis + PostgreSQL + Monitoring)"
    echo -e "   ${CYAN}•${NC} Pronto em ~5 minutos"
    echo -e "   ${CYAN}•${NC} Inclui Prometheus + Grafana"
    echo ""
    
    echo -e "${GREEN}3. scripts/dev-quick-install.sh${NC}"
    echo -e "   ${CYAN}•${NC} Ambiente de desenvolvimento"
    echo -e "   ${CYAN}•${NC} Hot reload com Vite"
    echo -e "   ${CYAN}•${NC} Configuração VS Code"
    echo -e "   ${CYAN}•${NC} TypeScript + ESLint + Prettier"
    echo ""
    
    echo -e "${GREEN}4. scripts/super-quick-install.sh${NC}"
    echo -e "   ${CYAN}•${NC} Instalação super completa"
    echo -e "   ${CYAN}•${NC} Suporte a produção, desenvolvimento, Docker, cloud"
    echo -e "   ${CYAN}•${NC} Configurações avançadas"
    echo -e "   ${CYAN}•${NC} SSL, monitoring, backups"
    echo ""
    
    echo -e "${GREEN}5. scripts/one-line-install.sh${NC}"
    echo -e "   ${CYAN}•${NC} Instalação em uma linha"
    echo -e "   ${CYAN}•${NC} Clone automático do repositório"
    echo -e "   ${CYAN}•${NC} Perfeito para produção rápida"
    echo ""
}

# Demo master install
demo_master_install() {
    print_demo "Demonstrando Master Install (Wizard Interativo)"
    echo ""
    
    echo -e "${CYAN}Comando:${NC} ./scripts/master-install.sh --help"
    echo ""
    ./scripts/master-install.sh --help | head -20
    echo ""
    
    echo -e "${CYAN}Exemplo de dry run:${NC}"
    echo -e "${CYAN}Comando:${NC} ./scripts/master-install.sh --dry-run docker"
    echo ""
    ./scripts/master-install.sh --dry-run docker
    echo ""
    
    print_success "Master Install demonstrado"
}

# Demo Docker install
demo_docker_install() {
    print_demo "Demonstrando Docker Quick Install"
    echo ""
    
    echo -e "${CYAN}Este script faria:${NC}"
    echo -e "  ${GREEN}✓${NC} Verificar e instalar Docker se necessário"
    echo -e "  ${GREEN}✓${NC} Criar configuração Docker Compose otimizada"
    echo -e "  ${GREEN}✓${NC} Configurar Redis, PostgreSQL, Prometheus, Grafana"
    echo -e "  ${GREEN}✓${NC} Gerar certificados SSL de desenvolvimento"
    echo -e "  ${GREEN}✓${NC} Iniciar todos os serviços"
    echo -e "  ${GREEN}✓${NC} Executar verificações de saúde"
    echo ""
    
    echo -e "${CYAN}Comando para executar:${NC}"
    echo -e "${YELLOW}./scripts/docker-quick-install.sh${NC}"
    echo ""
    
    echo -e "${CYAN}URLs após instalação:${NC}"
    echo -e "  Frontend: http://localhost"
    echo -e "  Admin: http://localhost:9000"
    echo -e "  Grafana: http://localhost:3000"
    echo -e "  Prometheus: http://localhost:9090"
    echo ""
    
    print_success "Docker Install demonstrado"
}

# Demo development install
demo_dev_install() {
    print_demo "Demonstrando Development Quick Install"
    echo ""
    
    echo -e "${CYAN}Este script faria:${NC}"
    echo -e "  ${GREEN}✓${NC} Verificar e instalar Node.js se necessário"
    echo -e "  ${GREEN}✓${NC} Instalar dependências do projeto"
    echo -e "  ${GREEN}✓${NC} Configurar ambiente de desenvolvimento"
    echo -e "  ${GREEN}✓${NC} Criar configuração VS Code"
    echo -e "  ${GREEN}✓${NC} Configurar Git hooks"
    echo -e "  ${GREEN}✓${NC} Preparar Docker para backend services"
    echo ""
    
    echo -e "${CYAN}Comando para executar:${NC}"
    echo -e "${YELLOW}./scripts/dev-quick-install.sh${NC}"
    echo ""
    
    echo -e "${CYAN}Scripts de desenvolvimento criados:${NC}"
    echo -e "  ./scripts/dev/start-all.sh - Inicia ambiente completo"
    echo -e "  ./scripts/dev/frontend.sh - Apenas frontend"
    echo -e "  ./scripts/dev/backend.sh - Apenas backend"
    echo -e "  ./scripts/dev/stop-all.sh - Para tudo"
    echo ""
    
    print_success "Development Install demonstrado"
}

# Demo production install
demo_production_install() {
    print_demo "Demonstrando Production Install"
    echo ""
    
    echo -e "${CYAN}Este script faria (para produção):${NC}"
    echo -e "  ${GREEN}✓${NC} Configurar SSL automático com Let's Encrypt"
    echo -e "  ${GREEN}✓${NC} Configurar serviços systemd"
    echo -e "  ${GREEN}✓${NC} Hardening de segurança"
    echo -e "  ${GREEN}✓${NC} Configurar backups automáticos"
    echo -e "  ${GREEN}✓${NC} Configurar log rotation"
    echo -e "  ${GREEN}✓${NC} Configurar monitoramento completo"
    echo ""
    
    echo -e "${CYAN}Comando para executar:${NC}"
    echo -e "${YELLOW}./scripts/super-quick-install.sh --auto-production${NC}"
    echo ""
    
    echo -e "${CYAN}Ou com configuração personalizada:${NC}"
    echo -e "${YELLOW}./scripts/master-install.sh production -d meudominio.com -e admin@meudominio.com${NC}"
    echo ""
    
    print_success "Production Install demonstrado"
}

# Demo one-line install
demo_one_line_install() {
    print_demo "Demonstrando One-Line Install"
    echo ""
    
    echo -e "${CYAN}Instalação em uma única linha:${NC}"
    echo ""
    
    echo -e "${YELLOW}Para produção:${NC}"
    echo -e "${GREEN}curl -fsSL https://raw.githubusercontent.com/eciatto/VeloFlux/main/scripts/one-line-install.sh | bash${NC}"
    echo ""
    
    echo -e "${YELLOW}Para teste local (Docker):${NC}"
    echo -e "${GREEN}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/docker-quick-install.sh${NC}"
    echo ""
    
    echo -e "${YELLOW}Para desenvolvimento:${NC}"
    echo -e "${GREEN}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/dev-quick-install.sh${NC}"
    echo ""
    
    print_success "One-Line Install demonstrado"
}

# Show installation matrix
show_installation_matrix() {
    echo -e "${YELLOW}${BOLD}📊 Matriz de Instalação${NC}"
    echo ""
    
    echo -e "${CYAN}┌─────────────────┬─────────────┬─────────────┬─────────────┬─────────────┐${NC}"
    echo -e "${CYAN}│${NC} ${BOLD}Método${NC}           ${CYAN}│${NC} ${BOLD}Tempo${NC}       ${CYAN}│${NC} ${BOLD}Complexidade${NC} ${CYAN}│${NC} ${BOLD}Use Case${NC}     ${CYAN}│${NC} ${BOLD}Recursos${NC}     ${CYAN}│${NC}"
    echo -e "${CYAN}├─────────────────┼─────────────┼─────────────┼─────────────┼─────────────┤${NC}"
    echo -e "${CYAN}│${NC} Docker Quick     ${CYAN}│${NC} ~5 min      ${CYAN}│${NC} Baixa       ${CYAN}│${NC} Teste/Demo  ${CYAN}│${NC} Completo    ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC} Development     ${CYAN}│${NC} ~8 min      ${CYAN}│${NC} Baixa       ${CYAN}│${NC} Dev Local   ${CYAN}│${NC} Hot Reload  ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC} Production      ${CYAN}│${NC} ~15 min     ${CYAN}│${NC} Média       ${CYAN}│${NC} Produção    ${CYAN}│${NC} SSL/Monitor ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC} Cloud Deploy    ${CYAN}│${NC} ~10 min     ${CYAN}│${NC} Alta        ${CYAN}│${NC} K8s/Cloud   ${CYAN}│${NC} Manifests   ${CYAN}│${NC}"
    echo -e "${CYAN}│${NC} One-Line        ${CYAN}│${NC} ~3 min      ${CYAN}│${NC} Muito Baixa ${CYAN}│${NC} Quick Start ${CYAN}│${NC} Automático  ${CYAN}│${NC}"
    echo -e "${CYAN}└─────────────────┴─────────────┴─────────────┴─────────────┴─────────────┘${NC}"
    echo ""
}

# Show recommendations
show_recommendations() {
    echo -e "${YELLOW}${BOLD}💡 Recomendações de Uso${NC}"
    echo ""
    
    echo -e "${GREEN}🔰 Iniciantes:${NC}"
    echo -e "  ${CYAN}→${NC} Use ${YELLOW}./scripts/docker-quick-install.sh${NC}"
    echo -e "  ${CYAN}→${NC} Rápido, seguro e funciona imediatamente"
    echo ""
    
    echo -e "${GREEN}👨‍💻 Desenvolvedores:${NC}"
    echo -e "  ${CYAN}→${NC} Use ${YELLOW}./scripts/dev-quick-install.sh${NC}"
    echo -e "  ${CYAN}→${NC} Ambiente completo com hot reload e VS Code"
    echo ""
    
    echo -e "${GREEN}🚀 Produção:${NC}"
    echo -e "  ${CYAN}→${NC} Use ${YELLOW}./scripts/master-install.sh production${NC}"
    echo -e "  ${CYAN}→${NC} Com wizard interativo para configuração segura"
    echo ""
    
    echo -e "${GREEN}☁️ Cloud/DevOps:${NC}"
    echo -e "  ${CYAN}→${NC} Use ${YELLOW}./scripts/master-install.sh cloud${NC}"
    echo -e "  ${CYAN}→${NC} Gera manifests para Kubernetes e plataformas cloud"
    echo ""
    
    echo -e "${GREEN}⚡ Super Rápido:${NC}"
    echo -e "  ${CYAN}→${NC} Use a instalação em uma linha"
    echo -e "  ${CYAN}→${NC} Para quando você quer testar imediatamente"
    echo ""
}

# Interactive demo
interactive_demo() {
    echo -e "${YELLOW}${BOLD}🎮 Demo Interativo${NC}"
    echo ""
    
    echo "Escolha qual demo você quer ver:"
    echo ""
    echo "1. 🧙‍♂️ Master Install (Wizard)"
    echo "2. 🐳 Docker Quick Install"
    echo "3. 🛠️ Development Install"
    echo "4. 🚀 Production Install"
    echo "5. ⚡ One-Line Install"
    echo "6. 📊 Ver Matriz de Instalação"
    echo "7. 💡 Ver Recomendações"
    echo "8. ❌ Sair"
    echo ""
    
    read -p "Digite sua escolha (1-8): " choice
    
    case $choice in
        1)
            demo_master_install
            ;;
        2)
            demo_docker_install
            ;;
        3)
            demo_dev_install
            ;;
        4)
            demo_production_install
            ;;
        5)
            demo_one_line_install
            ;;
        6)
            show_installation_matrix
            ;;
        7)
            show_recommendations
            ;;
        8)
            print_info "Saindo do demo..."
            exit 0
            ;;
        *)
            echo "Escolha inválida. Tente novamente."
            interactive_demo
            ;;
    esac
    
    echo ""
    echo -e "${CYAN}Pressione Enter para voltar ao menu ou Ctrl+C para sair...${NC}"
    read
    interactive_demo
}

# Show quick commands
show_quick_commands() {
    echo -e "${YELLOW}${BOLD}⚡ Comandos Rápidos para Copiar e Colar${NC}"
    echo ""
    
    echo -e "${GREEN}Docker (Recomendado para teste):${NC}"
    echo -e "${YELLOW}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/docker-quick-install.sh${NC}"
    echo ""
    
    echo -e "${GREEN}Desenvolvimento:${NC}"
    echo -e "${YELLOW}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/dev-quick-install.sh${NC}"
    echo ""
    
    echo -e "${GREEN}Produção (substitua o domínio):${NC}"
    echo -e "${YELLOW}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh production -d SEUDOMINIO.com -e admin@SEUDOMINIO.com${NC}"
    echo ""
    
    echo -e "${GREEN}Wizard Interativo:${NC}"
    echo -e "${YELLOW}git clone https://github.com/eciatto/VeloFlux.git && cd VeloFlux && ./scripts/master-install.sh${NC}"
    echo ""
    
    echo -e "${GREEN}One-Line (produção):${NC}"
    echo -e "${YELLOW}curl -fsSL https://raw.githubusercontent.com/eciatto/VeloFlux/main/scripts/one-line-install.sh | bash${NC}"
    echo ""
}

# Main function
main() {
    if [[ "$1" == "--help" ]] || [[ "$1" == "-h" ]]; then
        echo "Usage: $0 [--interactive|--quick|--help]"
        echo ""
        echo "Options:"
        echo "  --interactive, -i    Run interactive demo"
        echo "  --quick, -q         Show quick commands only"
        echo "  --help, -h          Show this help"
        echo ""
        exit 0
    fi
    
    if [[ "$1" == "--quick" ]] || [[ "$1" == "-q" ]]; then
        show_quick_commands
        exit 0
    fi
    
    if [[ "$1" == "--interactive" ]] || [[ "$1" == "-i" ]]; then
        interactive_demo
        exit 0
    fi
    
    # Default: show everything
    show_available_scripts
    echo ""
    show_installation_matrix
    echo ""
    show_recommendations
    echo ""
    show_quick_commands
    
    echo ""
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${GREEN}${BOLD}🎉 VeloFlux SaaS - Pronto para instalação super rápida! 🚀${NC}"
    echo ""
    echo -e "${CYAN}Para demo interativo, execute: ${YELLOW}$0 --interactive${NC}"
    echo ""
}

# Run main function
main "$@"
