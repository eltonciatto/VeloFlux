# 🚀 VeloFlux - Ferramentas de Implementação e Diagnóstico

Este diretório contém scripts para facilitar a implementação, diagnóstico e solução de problemas do VeloFlux em ambiente de produção.

## 🔧 Scripts Disponíveis

### 1. `diagnostico.sh`

Este script executa uma verificação completa do ambiente, identificando problemas comuns na implementação do VeloFlux.

**Uso:**
```bash
sudo ./scripts/diagnostico.sh
```

**Funcionalidades:**
- Verifica diretórios e arquivos de configuração
- Verifica serviços em execução (veloflux, nginx, redis, etc.)
- Verifica portas abertas
- Testa conectividade
- Analisa logs
- Fornece recomendações para solução de problemas

### 2. `teste_simplificado.sh`

Este script configura e inicia o VeloFlux em um ambiente de teste isolado usando Docker.

**Uso:**
```bash
./scripts/teste_simplificado.sh
```

**Funcionalidades:**
- Cria uma configuração de teste em `/tmp/veloflux-test`
- Configura backend de teste usando containers Nginx
- Constrói e inicia os containers
- Testa a conectividade do balanceador
- Fornece URLs para testar o funcionamento

### 3. `solucao_problemas.sh`

Este script é um guia interativo para solução de problemas comuns do VeloFlux.

**Uso:**
```bash
sudo ./scripts/solucao_problemas.sh
```

**Funcionalidades:**
- Menu interativo com categorias de problemas
- Soluções detalhadas para problemas de instalação
- Soluções para problemas de inicialização e configuração
- Dicas para problemas com Redis, SSL, Docker e roteamento
- Assistência para modo SaaS/multi-tenant
- Guia para análise de logs e diagnósticos

### 4. `implementacao_vps.sh`

Este script automatiza a implementação do VeloFlux em um servidor VPS remoto.

**Uso:**
```bash
./scripts/implementacao_vps.sh <IP_DO_SERVIDOR>
```

**Exemplo:**
```bash
./scripts/implementacao_vps.sh 192.168.1.100
```

**Funcionalidades:**
- Prepara pacote com configurações básicas
- Envia para o servidor via SSH
- Instala dependências (Docker, Nginx, Redis)
- Configura o VeloFlux como serviço systemd
- Configura proxy reverso com Nginx
- Abre portas necessárias no firewall
- Verifica a instalação

## 🔍 Como Diagnosticar Problemas

Se você está tendo problemas com a implementação do VeloFlux, siga este fluxo:

1. **Execute o diagnóstico**:
   ```bash
   sudo ./scripts/diagnostico.sh
   ```

2. **Baseado nos resultados do diagnóstico, abra o solucionador de problemas**:
   ```bash
   sudo ./scripts/solucao_problemas.sh
   ```

3. **Se necessário, teste em um ambiente isolado**:
   ```bash
   ./scripts/teste_simplificado.sh
   ```

4. **Para nova implantação em um servidor limpo**:
   ```bash
   ./scripts/implementacao_vps.sh <IP_DO_SERVIDOR>
   ```

## 📋 Verificação de Requisitos

Antes de implementar o VeloFlux em produção, certifique-se de que:

- Servidor possui pelo menos 2GB de RAM
- Servidor possui pelo menos 10GB de espaço livre em disco
- Portas 80, 443 estão liberadas no firewall
- Servidor possui acesso à internet
- Você tem permissões de root/sudo no servidor

## 🛟 Suporte

Se você ainda encontrar problemas após utilizar estas ferramentas, entre em contato com o suporte em support@veloflux.io ou abra uma issue no [GitHub](https://github.com/eltonciatto/VeloFlux).

---

🚀 **Boa implementação!**
