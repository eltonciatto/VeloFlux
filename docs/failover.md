# 🔄 VeloFlux Failover e Redirecionamento de Tráfego

Este documento explica como configurar o VeloFlux para redirecionar o tráfego para um servidor alternativo quando uma aplicação principal estiver fora do ar devido a falhas ou manutenção.

## 📋 Visão Geral

O VeloFlux suporta redirecionamento automático (failover) quando detecta que uma aplicação está indisponível. Isso é implementado de duas formas:

1. **Failover baseado em Health Check**: Redireciona automaticamente para servidores de backup quando os health checks falham
2. **Failover manual**: Permite ativar o modo de failover via API administrativa

## 🛠️ Configuração Rápida

### Usando o Script Automatizado

A maneira mais fácil de configurar o failover é usando nosso script automatizado:

```bash
sudo ./scripts/configurar_failover.sh
```

Este script irá:
- Guiar você através do processo de configuração
- Configurar servidores principais e de backup
- Configurar health checks e thresholds
- Configurar notificações (opcional)
- Aplicar a configuração

## ⚙️ Configuração Manual

Para configurar manualmente o failover, adicione a seguinte configuração ao seu `config.yaml`:

```yaml
pools:
  - name: "app-principal-pool"
    algorithm: "failover"  # Usar algoritmo de failover
    
    backends:
      - address: "servidor-principal:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "5s"
          timeout: "2s"
          expected_status: 200
          unhealthy_threshold: 2
          
      - address: "servidor-backup:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "5s"
          timeout: "2s"
          expected_status: 200
        failover: true  # Marca este backend como failover

routes:
  - host: "sua-aplicacao.com"
    path_prefix: "/"
    load_balancing:
      method: "failover"
    pool: "app-principal-pool"

# Configuração de Failover
failover:
  enabled: true
  strategy: "immediate"  # immediate, graceful ou delayed
  check_interval: "5s"
  recovery_interval: "10s"
  notification:
    enabled: true
    channels:
      - type: "log"
        level: "warning"
      - type: "email"
        smtp_server: "smtp.example.com"
        smtp_port: 587
        smtp_user: "user@example.com"
        smtp_password: "password"
        recipients:
          - "admin@example.com"
```

## 🔍 Como Funciona

1. **Detecção de Falha**: O VeloFlux monitora continuamente a saúde do servidor principal
2. **Ativação de Failover**: Quando um número `unhealthy_threshold` de health checks falham, o failover é ativado
3. **Redirecionamento**: O tráfego é redirecionado automaticamente para o servidor de backup
4. **Notificações**: Alertas são enviados pelos canais configurados (logs, email, webhook)
5. **Recuperação**: Quando o servidor principal volta a ficar saudável, o tráfego é gradualmente redirecionado de volta

## 📱 Tipos de Estratégias

O VeloFlux suporta três estratégias de failover:

1. **immediate**: Transfere 100% do tráfego para o servidor de backup imediatamente
2. **graceful**: Transfere o tráfego gradualmente (útil para evitar sobrecarga do servidor de backup)
3. **delayed**: Aguarda um período específico antes de ativar o failover (útil para falhas intermitentes)

## 🔔 Configuração de Notificações

O VeloFlux pode notificar quando ocorre um failover através de:

- **Logs**: Registra eventos de failover nos logs do sistema
- **Email**: Envia notificações por email
- **Webhook**: Envia notificações para Slack, Discord ou outras ferramentas
- **Metrics**: Expõe métricas para Prometheus

## 🧪 Testando o Failover

Para testar a funcionalidade de failover:

1. **Teste Simulado**:
   ```bash
   curl -X POST "http://localhost:9000/api/v1/failover/test?pool=app-principal-pool"
   ```

2. **Teste Real**: Derrube intencionalmente o servidor principal
   ```bash
   # Por exemplo, parando o contêiner Docker do servidor principal
   docker stop servidor-principal-container
   ```

3. **Verificando Logs**:
   ```bash
   tail -f /var/log/veloflux/veloflux.log | grep "failover"
   ```

## 🎛️ API de Controle de Failover

O VeloFlux fornece uma API para controlar o failover manualmente:

- **Ativar Failover**:
  ```bash
  curl -X POST "http://localhost:9000/api/v1/failover/activate?pool=app-principal-pool"
  ```

- **Desativar Failover**:
  ```bash
  curl -X POST "http://localhost:9000/api/v1/failover/deactivate?pool=app-principal-pool"
  ```

- **Verificar Status**:
  ```bash
  curl "http://localhost:9000/api/v1/failover/status?pool=app-principal-pool"
  ```

## 📊 Monitoramento

Para monitorar eventos de failover, o VeloFlux expõe as seguintes métricas no endpoint `/metrics`:

- `veloflux_failover_active{pool="app-pool"}`: 1 quando failover está ativo, 0 quando inativo
- `veloflux_failover_events_total{pool="app-pool"}`: Contador de eventos de failover
- `veloflux_failover_last_activation`: Timestamp da última ativação de failover
- `veloflux_failover_duration_seconds`: Duração do último evento de failover

## 🌍 Casos de Uso Avançados

### Failover para Múltiplas Aplicações

Você pode configurar failover para várias aplicações independentes:

```yaml
pools:
  - name: "app1-pool"
    algorithm: "failover"
    # Configuração para app1
    
  - name: "app2-pool"
    algorithm: "failover"
    # Configuração para app2

routes:
  - host: "app1.example.com"
    pool: "app1-pool"
    
  - host: "app2.example.com"
    pool: "app2-pool"
```

### Failover em Cascata

Você pode configurar múltiplos níveis de failover:

```yaml
backends:
  - address: "primary-server:80"
    failover_level: 0  # Servidor principal
    
  - address: "secondary-server:80"
    failover_level: 1  # Primeiro backup
    
  - address: "tertiary-server:80"
    failover_level: 2  # Segundo backup
```

### Failover entre Regiões

Para alta disponibilidade em múltiplas regiões:

```yaml
pools:
  - name: "global-pool"
    algorithm: "failover"
    
    backends:
      - address: "us-east-server:80"
        region: "us-east"
        
      - address: "us-west-server:80"
        region: "us-west"
        failover: true
        
      - address: "eu-west-server:80"
        region: "eu-west"
        failover: true
```

## 📝 Conclusão

O sistema de failover do VeloFlux proporciona alta disponibilidade para suas aplicações, garantindo que o tráfego seja redirecionado automaticamente quando ocorrerem falhas. Use o script `configurar_failover.sh` para uma configuração rápida, ou configure manualmente para casos de uso mais complexos.
