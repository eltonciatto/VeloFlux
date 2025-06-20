# 🔌 VeloFlux WebSocket API Documentation

Este documento descreve como usar a API WebSocket do VeloFlux para receber atualizações em tempo real sobre o estado do sistema, backends e métricas.

## 📋 Endpoints WebSocket Disponíveis

### 1. `/api/ws/backends` - Atualizações de Backend
Conecta ao feed de atualizações de status dos backends em tempo real.

**Exemplo de Conexão:**
```javascript
const ws = new WebSocket('ws://localhost:8080/api/ws/backends');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Backend Update:', data);
};
```

**Formato da Mensagem:**
```json
{
    "type": "backend_status",
    "backends": [
        {
            "address": "192.168.1.100:8080",
            "pool": "web-servers",
            "weight": 100,
            "status": "healthy",
            "healthy": true,
            "connections": 42,
            "last_used": "2025-06-20T15:30:45Z",
            "region": "us-east-1",
            "health_check": {
                "path": "/health",
                "interval": "30s",
                "timeout": "5s",
                "expected_status": 200
            }
        }
    ],
    "timestamp": "2025-06-20T15:30:45Z",
    "forced": false
}
```

### 2. `/api/ws/metrics` - Métricas do Sistema
Conecta ao feed de métricas em tempo real do sistema.

**Exemplo de Conexão:**
```javascript
const ws = new WebSocket('ws://localhost:8080/api/ws/metrics');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Metrics Update:', data);
};
```

**Formato da Mensagem:**
```json
{
    "type": "metrics",
    "data": {
        "requests_total": 15420,
        "requests_per_second": 45.2,
        "avg_response_time": 125,
        "error_rate": 0.02,
        "active_connections": 342,
        "healthy_backends": 8,
        "total_backends": 10,
        "websocket_clients": 3,
        "pools_count": 3,
        "availability": 80.0,
        "avg_last_used": "2025-06-20T15:30:40Z",
        "pool_metrics": {
            "web-servers": {
                "total_backends": 4,
                "healthy_backends": 3,
                "active_connections": 200,
                "health_percentage": 75.0
            },
            "api-servers": {
                "total_backends": 6,
                "healthy_backends": 5,
                "active_connections": 142,
                "health_percentage": 83.33
            }
        },
        "load_distribution": {
            "web-servers": 58.5,
            "api-servers": 41.5
        },
        "cluster_enabled": true,
        "is_leader": true,
        "adaptive_enabled": true,
        "current_strategy": "ai_optimized"
    },
    "timestamp": "2025-06-20T15:30:45Z"
}
```

### 3. `/api/ws/status` - Status do Sistema
Conecta ao feed de status geral do sistema.

**Exemplo de Conexão:**
```javascript
const ws = new WebSocket('ws://localhost:8080/api/ws/status');

ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('Status Update:', data);
};
```

**Formato da Mensagem:**
```json
{
    "type": "system_status",
    "data": {
        "status": "healthy",
        "uptime": "2025-06-20T15:30:45Z",
        "version": "1.1.0",
        "websocket_clients": 3,
        "total_backends": 10,
        "healthy_backends": 8,
        "backend_health_percentage": 80.0,
        "pools_count": 3,
        "cluster_enabled": true,
        "node_id": "node-001",
        "is_leader": true,
        "adaptive_balancer_enabled": true,
        "current_strategy": "ai_optimized"
    },
    "timestamp": "2025-06-20T15:30:45Z"
}
```

## 🎛️ Controle das Atualizações WebSocket

### Pausar/Retomar Atualizações
**Endpoint:** `POST /api/ws/control`

```bash
# Pausar todas as atualizações
curl -X POST http://localhost:8080/api/ws/control \
  -H "Content-Type: application/json" \
  -d '{"action": "pause", "type": "all"}'

# Pausar apenas atualizações de backends
curl -X POST http://localhost:8080/api/ws/control \
  -H "Content-Type: application/json" \
  -d '{"action": "pause", "type": "backends"}'

# Retomar atualizações de métricas
curl -X POST http://localhost:8080/api/ws/control \
  -H "Content-Type: application/json" \
  -d '{"action": "resume", "type": "metrics"}'
```

**Tipos Suportados:**
- `backends` - Atualizações de backend
- `metrics` - Atualizações de métricas
- `status` - Atualizações de status
- `all` - Todas as atualizações

### Forçar Atualização Imediata
**Endpoint:** `POST /api/ws/force-update`

```bash
# Forçar atualização de todos os tipos
curl -X POST http://localhost:8080/api/ws/force-update \
  -H "Content-Type: application/json" \
  -d '{"type": "all"}'

# Forçar apenas atualização de backends
curl -X POST http://localhost:8080/api/ws/force-update \
  -H "Content-Type: application/json" \
  -d '{"type": "backends"}'
```

## 🔄 Intervalos de Atualização

| Tipo | Intervalo Padrão | Descrição |
|------|------------------|-----------|
| Backends | 5 segundos | Status e saúde dos backends |
| Métricas | 10 segundos | Métricas de performance |
| Status | 15 segundos | Status geral do sistema |

## 📱 Exemplo de Cliente JavaScript Completo

```javascript
class VeloFluxWebSocketClient {
    constructor(baseUrl = 'ws://localhost:8080') {
        this.baseUrl = baseUrl;
        this.connections = {};
        this.reconnectDelay = 1000;
        this.maxReconnectDelay = 30000;
    }

    connect(type, onMessage, onError, onOpen) {
        const url = `${this.baseUrl}/api/ws/${type}`;
        const ws = new WebSocket(url);
        
        ws.onopen = (event) => {
            console.log(`Connected to ${type} WebSocket`);
            this.reconnectDelay = 1000; // Reset delay on successful connection
            if (onOpen) onOpen(event);
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (onMessage) onMessage(data);
            } catch (error) {
                console.error(`Error parsing ${type} message:`, error);
            }
        };
        
        ws.onclose = (event) => {
            console.log(`${type} WebSocket closed`);
            this.scheduleReconnect(type, onMessage, onError, onOpen);
        };
        
        ws.onerror = (error) => {
            console.error(`${type} WebSocket error:`, error);
            if (onError) onError(error);
        };
        
        this.connections[type] = ws;
        return ws;
    }

    scheduleReconnect(type, onMessage, onError, onOpen) {
        setTimeout(() => {
            console.log(`Attempting to reconnect to ${type}...`);
            this.connect(type, onMessage, onError, onOpen);
            this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
        }, this.reconnectDelay);
    }

    disconnect(type) {
        if (this.connections[type]) {
            this.connections[type].close();
            delete this.connections[type];
        }
    }

    disconnectAll() {
        Object.keys(this.connections).forEach(type => {
            this.disconnect(type);
        });
    }

    async pauseUpdates(type = 'all') {
        return fetch('/api/ws/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'pause', type })
        });
    }

    async resumeUpdates(type = 'all') {
        return fetch('/api/ws/control', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'resume', type })
        });
    }

    async forceUpdate(type = 'all') {
        return fetch('/api/ws/force-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type })
        });
    }
}

// Uso do cliente
const client = new VeloFluxWebSocketClient();

// Conectar aos diferentes feeds
client.connect('backends', (data) => {
    console.log('Backend update:', data);
    updateBackendUI(data.backends);
});

client.connect('metrics', (data) => {
    console.log('Metrics update:', data);
    updateMetricsUI(data.data);
});

client.connect('status', (data) => {
    console.log('Status update:', data);
    updateStatusUI(data.data);
});

// Pausar atualizações durante manutenção
// await client.pauseUpdates('all');

// Forçar atualização imediata
// await client.forceUpdate('backends');
```

## 🛡️ Considerações de Segurança

1. **Autenticação**: Atualmente os endpoints WebSocket não requerem autenticação para simplificar a conexão inicial. Em produção, considere implementar autenticação baseada em token.

2. **Rate Limiting**: Implemente rate limiting para evitar abuse dos endpoints de controle.

3. **CORS**: Configure adequadamente as políticas CORS para WebSockets em produção.

4. **SSL/TLS**: Use `wss://` em produção para conexões seguras.

## 🔧 Troubleshooting

### Conexão WebSocket Falha
- Verifique se o servidor VeloFlux está rodando
- Confirme que a porta está acessível
- Verifique logs do servidor para erros

### Não Recebe Atualizações
- Confirme que as atualizações não estão pausadas
- Verifique se há backends/dados para serem enviados
- Use `/api/ws/force-update` para testar

### Reconexão Automática
- Implemente lógica de reconexão com backoff exponencial
- Monitore eventos `onclose` e `onerror`
- Considere usar bibliotraries como Socket.IO para reconexão automática

## 📈 Monitoramento

Use as métricas WebSocket para monitorar:
- Número de clientes conectados
- Frequência de atualizações
- Performance dos backends
- Distribuição de carga entre pools
- Status geral do sistema

## 🔄 Integração com Frontend

Este sistema WebSocket é ideal para:
- Dashboards em tempo real
- Monitoramento de saúde dos backends
- Alertas automáticos de problemas
- Visualizações de métricas dinâmicas
- Interface de administração responsiva
