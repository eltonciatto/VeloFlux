# 🚀 VeloFlux SaaS Production - Instalação Robusta Completa

## 📦 Pacote de Produção Gerado

✅ **Pacote Principal**: `veloflux-saas-production-final.tar.gz`  
✅ **Tamanho**: ~190KB (compactado)  
✅ **Conteúdo**: Sistema completo para produção  

## 🎯 Instalação Rápida (Método Recomendado)

### Upload e Instalação Automática

```bash
# 1. Envie o pacote para seu servidor VPS
scp veloflux-saas-production-final.tar.gz root@146.190.152.103:/tmp/

# 2. Conecte-se ao servidor
ssh root@146.190.152.103

# 3. Extraia e instale
cd /tmp
tar xzf veloflux-saas-production-final.tar.gz
cd veloflux-saas-production
./install.sh
```

## 🛠️ Instalação Customizada

### Com Configuração de Domínios

```bash
# No servidor, antes de executar ./install.sh
export MAIN_DOMAIN="seudominino.com"
export ADMIN_DOMAIN="admin.seudominio.com"
export API_DOMAIN="api.seudominio.com"
export EMAIL="admin@seudominio.com"
export ENABLE_SSL="true"
export ENABLE_MONITORING="true"

# Execute a instalação
./install.sh
```

### Instalação Manual Passo a Passo

```bash
cd /tmp/veloflux-saas-production

# 1. Instalação principal (infraestrutura e serviços)
./scripts/install-veloflux-saas-production.sh

# 2. Deploy de produção (SSL, firewall, monitoramento)
./scripts/deploy-production.sh

# 3. Verificação de saúde
./scripts/healthcheck.sh
```

## 🔍 Verificação e Status

### Script de Status Automatizado

```bash
# No servidor, após instalação
cd /tmp/veloflux-saas-production
./check-status.sh
```

### Verificação Manual

```bash
# Status dos serviços
systemctl status veloflux veloflux-lb nginx docker

# Containers Docker
docker ps

# Portas em uso
ss -tlnp | grep -E ":(80|443|3000|9090)"

# Endpoints funcionando
curl http://localhost/
curl http://localhost/health
curl http://localhost:3000/    # Grafana
curl http://localhost:9090/    # Prometheus
```

## 🌐 Pontos de Acesso

Substitua `YOUR_SERVER_IP` pelo IP do seu servidor (146.190.152.103):

- **🏠 Aplicação Principal**: http://YOUR_SERVER_IP/
- **⚡ Health Check**: http://YOUR_SERVER_IP/health
- **📊 Grafana**: http://YOUR_SERVER_IP:3000 (admin/admin)
- **📈 Prometheus**: http://YOUR_SERVER_IP:9090
- **🔧 Admin Panel**: http://YOUR_SERVER_IP/admin
- **🔗 API**: http://YOUR_SERVER_IP/api

## 🔐 Recursos de Segurança Incluídos

✅ **Firewall (UFW)** - Proteção de rede  
✅ **SSL/TLS** - Certificados automáticos  
✅ **WAF** - Web Application Firewall  
✅ **Rate Limiting** - Proteção contra DDoS  
✅ **Security Headers** - Hardening HTTP  
✅ **User Separation** - Isolamento de processos  

## 📊 Monitoramento e Observabilidade

✅ **Grafana Dashboards** - Visualização de métricas  
✅ **Prometheus Metrics** - Coleta de dados  
✅ **AlertManager** - Sistema de alertas  
✅ **Health Checks** - Monitoramento de saúde  
✅ **Log Aggregation** - Centralização de logs  
✅ **System Monitoring** - CPU, RAM, Disk  

## 💾 Backup e Recuperação

```bash
# Backup manual
/opt/veloflux/scripts/backup.sh

# Backup automático (já configurado via cron)
# Localização: /var/backups/veloflux/

# Restaurar backup
/opt/veloflux/scripts/restore.sh /var/backups/veloflux/backup-YYYYMMDD.tar.gz
```

## 🏗️ Arquitetura de Produção

### Componentes Instalados

1. **Load Balancer** (VeloFlux LB)
2. **Application Servers** (múltiplas instâncias)
3. **Redis Cache** (alta performance)
4. **PostgreSQL** (banco de dados)
5. **Nginx** (proxy reverso + SSL)
6. **Grafana + Prometheus** (monitoramento)
7. **AlertManager** (alertas)

### Estrutura de Diretórios

```
/opt/veloflux/          # Aplicação principal
/etc/veloflux/          # Configurações
/var/log/veloflux/      # Logs
/var/lib/veloflux/      # Dados
/var/backups/veloflux/  # Backups
```

## 🔧 Personalização Pós-Instalação

### 1. Configuração de DNS

Aponte seus domínios para o IP do servidor:

```
A     seudominio.com        → 146.190.152.103
A     admin.seudominio.com  → 146.190.152.103
A     api.seudominio.com    → 146.190.152.103
```

### 2. SSL Automático

Os certificados SSL serão gerados automaticamente via Let's Encrypt quando o DNS estiver configurado.

### 3. Grafana Dashboards

Acesse http://YOUR_SERVER_IP:3000 e configure:
- Username: `admin`
- Password: `admin` (altere no primeiro login)

### 4. Alertas e Notificações

Configure webhooks e emails em `/etc/veloflux/alertmanager.yml`

## 🚨 Troubleshooting

### Logs Importantes

```bash
# Logs da aplicação
tail -f /var/log/veloflux/veloflux.log

# Logs de instalação
tail -f /tmp/veloflux-install.log

# Logs do Nginx
tail -f /var/log/nginx/error.log

# Logs do sistema
journalctl -fu veloflux
```

### Problemas Comuns

1. **Porta 80/443 em uso**: O script resolve automaticamente
2. **SSL não funciona**: Aguarde configuração do DNS
3. **Grafana não carrega**: Verifique `docker ps` e `systemctl status grafana`
4. **App não responde**: Verifique `systemctl status veloflux`

## 📞 Suporte e Manutenção

### Scripts de Manutenção

```bash
# Verificação de saúde
/opt/veloflux/scripts/healthcheck.sh

# Monitoramento contínuo
/opt/veloflux/scripts/monitor.sh

# Backup manual
/opt/veloflux/scripts/backup.sh
```

### Atualizações

```bash
# Atualizar aplicação
cd /opt/veloflux
git pull origin main
systemctl restart veloflux
```

## 🎉 Próximos Passos

1. ✅ **Upload e instalação** do pacote
2. ✅ **Verificação** com `check-status.sh`
3. 🔄 **Configuração de DNS** para seus domínios
4. 🔄 **Personalização do Grafana** e alertas
5. 🔄 **Teste de backup** e recuperação
6. 🔄 **Configuração de CI/CD** para atualizações

---

## 📋 Comandos de Referência Rápida

```bash
# Status completo do sistema
./check-status.sh

# Reiniciar serviços
systemctl restart veloflux nginx

# Ver logs em tempo real
tail -f /var/log/veloflux/veloflux.log

# Backup imediato
/opt/veloflux/scripts/backup.sh

# Verificar conectividade
curl -I http://localhost/health
```

---

🚀 **VeloFlux SaaS está pronto para produção!**  
📧 Suporte: admin@veloflux.io  
📚 Documentação: /tmp/veloflux-saas-production/DEPLOY.md
