#!/bin/bash

# 🔐 VeloFlux - Configuração de SSH para VPS
# Gera chave ED25519 e configura acesso seguro ao VPS

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

# VPS Details
VPS_IP="190.93.119.61"
VPS_USER="root"
VPS_PASSWORD="LMbbL1u8ii"

echo -e "${PURPLE}${BOLD}🔐 VeloFlux - Configuração SSH para VPS${NC}"
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

print_step() {
    echo -e "${BLUE}${BOLD}[PASSO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}${BOLD}✅ [SUCESSO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}${BOLD}⚠️  [AVISO]${NC} $1"
}

print_error() {
    echo -e "${RED}${BOLD}❌ [ERRO]${NC} $1"
}

# Solicitar IP e senha do VPS
if [ -z "$VPS_IP" ]; then
    read -p "Digite o IP do VPS: " VPS_IP
fi

if [ -z "$VPS_PASSWORD" ]; then
    echo "Digite a senha do VPS (não será exibida):"
    read -s VPS_PASSWORD
    echo
fi

# Verificar se as variáveis estão configuradas
if [ -z "$VPS_IP" ] || [ -z "$VPS_PASSWORD" ]; then
    print_error "IP e senha do VPS são obrigatórios!"
    exit 1
fi

# Verificar se ssh-keygen está disponível
if ! command -v ssh-keygen &> /dev/null; then
    print_error "ssh-keygen não encontrado. Instalando openssh-client..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y openssh-client
    elif command -v yum &> /dev/null; then
        sudo yum install -y openssh-clients
    elif command -v pacman &> /dev/null; then
        sudo pacman -S openssh
    else
        print_error "Gerenciador de pacotes não suportado. Instale o openssh-client manualmente."
        exit 1
    fi
fi

# Verificar se sshpass está disponível
if ! command -v sshpass &> /dev/null; then
    print_step "Instalando sshpass para automação..."
    if command -v apt-get &> /dev/null; then
        sudo apt-get update && sudo apt-get install -y sshpass
    elif command -v yum &> /dev/null; then
        sudo yum install -y sshpass
    elif command -v pacman &> /dev/null; then
        sudo pacman -S sshpass
    else
        print_warning "sshpass não disponível. Você precisará inserir a senha manualmente."
    fi
fi

# Criar diretório SSH se não existir
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Nome da chave
KEY_NAME="veloflux_vps_ed25519"
KEY_PATH="$HOME/.ssh/$KEY_NAME"

print_step "Gerando nova chave SSH ED25519..."

# Verificar se a chave já existe
if [ -f "$KEY_PATH" ]; then
    read -p "$(echo -e "${YELLOW}Chave $KEY_NAME já existe. Sobrescrever? (y/N): ${NC}")" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Operação cancelada pelo usuário."
        exit 0
    fi
fi

# Gerar chave ED25519
ssh-keygen -t ed25519 -C "veloflux-vps-access-$(date +%Y%m%d)" -f "$KEY_PATH" -N ""

if [ $? -eq 0 ]; then
    print_success "Chave SSH ED25519 gerada com sucesso!"
    echo -e "   📁 Chave privada: ${CYAN}$KEY_PATH${NC}"
    echo -e "   📁 Chave pública: ${CYAN}$KEY_PATH.pub${NC}"
else
    print_error "Falha ao gerar a chave SSH."
    exit 1
fi

print_step "Configurando acesso ao VPS..."

# Ler a chave pública
PUBLIC_KEY=$(cat "$KEY_PATH.pub")

# Configurar SSH config
SSH_CONFIG="$HOME/.ssh/config"

# Adicionar configuração ao SSH config
if ! grep -q "Host veloflux-vps" "$SSH_CONFIG" 2>/dev/null; then
    print_step "Adicionando configuração SSH..."
    cat >> "$SSH_CONFIG" << EOF

# VeloFlux VPS Configuration
Host veloflux-vps
    HostName $VPS_IP
    User $VPS_USER
    IdentityFile $KEY_PATH
    IdentitiesOnly yes
    StrictHostKeyChecking no
    UserKnownHostsFile /dev/null
    LogLevel ERROR

EOF
    chmod 600 "$SSH_CONFIG"
    print_success "Configuração SSH adicionada."
fi

# Função para copiar chave para o servidor
copy_key_to_server() {
    print_step "Copiando chave pública para o servidor VPS..."
    
    if command -v sshpass &> /dev/null; then
        # Usando sshpass para automação
        sshpass -p "$VPS_PASSWORD" ssh-copy-id -i "$KEY_PATH.pub" -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" 2>/dev/null
    else
        # Método manual
        echo -e "${YELLOW}Método manual necessário. Execute o comando abaixo:${NC}"
        echo -e "${CYAN}ssh-copy-id -i $KEY_PATH.pub $VPS_USER@$VPS_IP${NC}"
        echo -e "${YELLOW}Senha: $VPS_PASSWORD${NC}"
        echo ""
        read -p "Pressione Enter após executar o comando acima..."
    fi
}

# Copiar chave para o servidor
if copy_key_to_server; then
    print_success "Chave pública copiada para o servidor!"
else
    print_warning "Configuração manual necessária. Veja as instruções abaixo."
fi

print_step "Testando conexão SSH..."

# Testar conexão
if ssh -o ConnectTimeout=10 -o BatchMode=yes veloflux-vps "echo 'Conexão SSH funcionando!'" 2>/dev/null; then
    print_success "Conexão SSH estabelecida com sucesso!"
    echo ""
    echo -e "${GREEN}${BOLD}🎉 Configuração completa!${NC}"
    echo ""
    echo -e "${CYAN}Para conectar ao VPS, use:${NC}"
    echo -e "${YELLOW}ssh veloflux-vps${NC}"
    echo ""
    echo -e "${CYAN}Ou diretamente:${NC}"
    echo -e "${YELLOW}ssh -i $KEY_PATH $VPS_USER@$VPS_IP${NC}"
else
    print_warning "Teste de conexão falhou. Configuração manual necessária:"
    echo ""
    echo -e "${CYAN}1. Copie a chave pública manualmente:${NC}"
    echo -e "${YELLOW}cat $KEY_PATH.pub${NC}"
    echo ""
    echo -e "${CYAN}2. Conecte ao servidor com senha:${NC}"
    echo -e "${YELLOW}ssh $VPS_USER@$VPS_IP${NC}"
    echo -e "${CYAN}   Senha: ${YELLOW}$VPS_PASSWORD${NC}"
    echo ""
    echo -e "${CYAN}3. No servidor, execute:${NC}"
    echo -e "${YELLOW}mkdir -p ~/.ssh && chmod 700 ~/.ssh${NC}"
    echo -e "${YELLOW}echo 'COLE_AQUI_A_CHAVE_PUBLICA' >> ~/.ssh/authorized_keys${NC}"
    echo -e "${YELLOW}chmod 600 ~/.ssh/authorized_keys${NC}"
fi

# Mostrar informações de segurança
echo ""
echo -e "${PURPLE}${BOLD}🔒 Dicas de Segurança:${NC}"
echo -e "   • Mantenha sua chave privada segura"
echo -e "   • Considere desabilitar autenticação por senha no servidor"
echo -e "   • Use sempre conexões SSH em redes confiáveis"
echo -e "   • Faça backup das suas chaves SSH"

# Mostrar fingerprint da chave
echo ""
echo -e "${CYAN}${BOLD}🔑 Fingerprint da Chave:${NC}"
ssh-keygen -lf "$KEY_PATH.pub"

echo ""
echo -e "${GREEN}${BOLD}Script concluído!${NC}"
