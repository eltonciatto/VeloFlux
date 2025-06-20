# 🔌 VeloFlux WebSocket API - Documentação Completa

## 📋 Índice
- [Visão Geral](#visão-geral)
- [Portas e Endpoints](#portas-e-endpoints)
- [Configuração de Desenvolvimento](#configuração-de-desenvolvimento)
- [Configuração de Produção](#configuração-de-produção)
- [WebSocket Endpoints](#websocket-endpoints)
- [Exemplos de Uso](#exemplos-de-uso)
- [Testes e Validação](#testes-e-validação)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

O VeloFlux utiliza WebSockets para comunicação em tempo real entre frontend e backend, permitindo:
- Monitoramento de métricas em tempo real
- Status de backends e health checks
- Dados de IA e machine learning
- Informações de billing e segurança
- Atualizações automáticas do dashboard

---

## 🔧 Portas e Endpoints

### **Arquitetura de Portas**

| Serviço | Porta | Descrição | URL |
|---------|-------|-----------|-----|
| **Frontend (Nginx)** | `3000` | Interface web | `http://localhost:3000` |
| **Load Balancer** | `80/443` | Proxy reverso | `http://localhost` |
| **Backend API** | `9090` | **API + WebSockets** | `http://localhost:9090` |
| **Backend Metrics** | `8080` | Prometheus metrics | `http://localhost:8080` |
| **Admin API** | `9000` | Admin interface | `http://localhost:9000` |
| **Prometheus** | `9091` | Monitoring | `http://localhost:9091` |
| **AlertManager** | `9092` | Alertas | `http://localhost:9092` |

### **⚠️ IMPORTANTE: Porta Correta para WebSockets**
```
✅ CORRETO: ws://localhost:9090/api/ws/*
❌ INCORRETO: ws://localhost:8080/api/ws/*
```

A porta **9090** é onde o backend API server está rodando e onde os WebSockets estão configurados.

---

## 🛠 Configuração de Desenvolvimento

### **Frontend Configuration (`environment.ts`)**
```typescript
export const CONFIG = {
  // WebSocket configuração para desenvolvimento
  PRODUCTION: {
    ENDPOINTS: {
      WEBSOCKET: 'ws://localhost:9090/api/ws',
      // Outros endpoints...
    }
  }
};
```

### **React Hooks (`useRealtimeWebSocket.ts`)**
```typescript
// Hooks específicos com URLs corretas
export function useRealtimeMetrics() {
  return useWebSocket({
    url: 'ws://localhost:9090/api/ws/metrics',
    debug: process.env.NODE_ENV === 'development'
  });
}

export function useRealtimeBackends() {
  return useWebSocket({
    url: 'ws://localhost:9090/api/ws/backends',
    debug: process.env.NODE_ENV === 'development'
  });
}
```

---

## 🚀 Configuração de Produção

### **Nginx Proxy (Load Balancer)**
```nginx
# WebSocket proxy para produção
location /api/ws/ {
    proxy_pass http://backend:9090;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

### **URL de Produção**
```
Desenvolvimento: ws://localhost:9090/api/ws/*
Produção:       wss://seu-dominio.com/api/ws/*
```

---

## 📡 WebSocket Endpoints

### **1. 📊 Métricas em Tempo Real**
```
URL: ws://localhost:9090/api/ws/metrics
Descrição: Dados de performance e estatísticas
Frequência: Cada 5 segundos
```

**Exemplo de Mensagem:**
```json
{
  "type": "metrics_update",
  "data": {
    "cpu_usage": 45.2,
    "memory_usage": 68.7,
    "requests_per_second": 125,
    "response_time_avg": 250
  },
  "timestamp": "2025-06-20T08:00:00Z"
}
```

### **2. 🏥 Status de Backends**
```
URL: ws://localhost:9090/api/ws/backends
Descrição: Health status dos servidores backend
Frequência: Cada 10 segundos
```

**Exemplo de Mensagem:**
```json
{
  "type": "backend_status",
  "data": {
    "backends": [
      {
        "id": "backend-1",
        "status": "healthy",
        "response_time": 120,
        "last_check": "2025-06-20T08:00:00Z"
      }
    ]
  },
  "timestamp": "2025-06-20T08:00:00Z"
}
```

### **3. 🔄 Status Geral do Sistema**
```
URL: ws://localhost:9090/api/ws/status
Descrição: Status global da aplicação
Frequência: Cada 15 segundos
```

### **4. 🧠 Dados de IA/ML**
```
URL: ws://localhost:9090/api/ws/ai
Descrição: Predições e análises de IA
Frequência: Sob demanda
```

### **5. 🔒 Eventos de Segurança**
```
URL: ws://localhost:9090/api/ws/security
Descrição: Alertas e logs de segurança
Frequência: Em tempo real
```

### **6. 💰 Informações de Billing**
```
URL: ws://localhost:9090/api/ws/billing
Descrição: Dados de cobrança e uso
Frequência: Cada hora
```

### **7. 🏥 Health Monitoring**
```
URL: ws://localhost:9090/api/ws/health
Descrição: Monitoramento de saúde geral
Frequência: Cada 30 segundos
```

---

## 💻 Exemplos de Uso

### **1. Conexão Básica com JavaScript**
```javascript
const ws = new WebSocket('ws://localhost:9090/api/ws/metrics');

ws.onopen = () => {
  console.log('Conectado ao WebSocket');
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Dados recebidos:', data);
};

ws.onclose = () => {
  console.log('Conexão fechada');
};
```

### **2. Hook React Personalizado**
```typescript
import { useRealtimeMetrics } from '@/hooks/useRealtimeWebSocket';

function MetricsComponent() {
  const { isConnected, lastMessage, error } = useRealtimeMetrics();

  if (!isConnected) {
    return <div>Conectando...</div>;
  }

  return (
    <div>
      <h3>Métricas em Tempo Real</h3>
      {lastMessage && (
        <pre>{JSON.stringify(lastMessage.data, null, 2)}</pre>
      )}
    </div>
  );
}
```

### **3. Teste com Python**
```python
import asyncio
import websockets
import json

async def test_websocket():
    uri = "ws://localhost:9090/api/ws/metrics"
    async with websockets.connect(uri) as websocket:
        while True:
            message = await websocket.recv()
            data = json.loads(message)
            print(f"Recebido: {data}")

asyncio.run(test_websocket())
```

### **4. Teste com curl/websocat**
```bash
# Instalar websocat primeiro
# Ubuntu/Debian: apt install websocat
# macOS: brew install websocat

websocat ws://localhost:9090/api/ws/status
```

---

## 🧪 Testes e Validação

### **Script de Teste Completo**
```bash
#!/bin/bash
echo "🧪 Testando WebSockets do VeloFlux"

endpoints=(
  "ws://localhost:9090/api/ws/backends"
  "ws://localhost:9090/api/ws/metrics"
  "ws://localhost:9090/api/ws/status"
  "ws://localhost:9090/api/ws/ai"
  "ws://localhost:9090/api/ws/security"
  "ws://localhost:9090/api/ws/billing"
  "ws://localhost:9090/api/ws/health"
)

for endpoint in "${endpoints[@]}"; do
  echo "Testando: $endpoint"
  timeout 5s python3 -c "
import asyncio
import websockets

async def test():
    try:
        async with websockets.connect('$endpoint') as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=3)
            print('✅ SUCESSO')
    except Exception as e:
        print(f'❌ ERRO: {e}')

asyncio.run(test())
"
done
```

### **Validação de Status**
```bash
# Verificar se todos os containers estão rodando
docker-compose ps

# Testar health do backend
curl http://localhost:9090/health

# Verificar logs do backend
docker-compose logs backend --tail=10
```

---

## 🔧 Troubleshooting

### **Problemas Comuns**

#### **1. Erro: "Connection refused"**
```
❌ Sintoma: WebSocket não conecta
✅ Solução: Verificar se backend está rodando na porta 9090
```
```bash
curl http://localhost:9090/health
docker-compose ps backend
```

#### **2. Erro: "HTTP 200" em vez de WebSocket**
```
❌ Sintoma: Endpoint retorna HTTP em vez de upgrade para WebSocket
✅ Solução: Verificar headers de upgrade
```
```bash
curl -i -N -H "Connection: Upgrade" \
     -H "Upgrade: websocket" \
     -H "Sec-WebSocket-Key: test" \
     -H "Sec-WebSocket-Version: 13" \
     http://localhost:9090/api/ws/status
```

#### **3. Porta Incorreta**
```
❌ Erro comum: Usar porta 8080 (metrics) em vez de 9090 (API)
✅ Correção: Sempre usar ws://localhost:9090/api/ws/*
```

#### **4. CORS Issues em Produção**
```
❌ Sintoma: WebSocket falha em produção
✅ Solução: Configurar CORS no backend
```

### **Logs de Debug**
```bash
# Backend logs
docker-compose logs backend -f

# Frontend logs (caso esteja em dev mode)
docker-compose logs frontend -f

# Nginx logs
docker-compose logs loadbalancer -f
```

### **Verificação de Conectividade**
```bash
# Testar conectividade de rede
nc -zv localhost 9090

# Verificar se processo está escutando
netstat -tlnp | grep 9090

# Testar via telnet
telnet localhost 9090
```

---

## 📚 Referências

### **Documentação Relacionada**
- [Backend API Documentation](./API_DOCUMENTATION_COMPLETE.md)
- [Frontend Integration Guide](./frontend_integration_guide.md)
- [Docker Compose Configuration](../docker-compose.yml)

### **Especificações Técnicas**
- **Protocol**: WebSocket (RFC 6455)
- **Transport**: TCP
- **Format**: JSON
- **Encoding**: UTF-8
- **Compression**: Opcional (permessage-deflate)

### **Links Úteis**
- [WebSocket MDN Documentation](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
- [Go WebSocket Library](https://github.com/gorilla/websocket)
- [React WebSocket Hooks](https://github.com/robtaussig/react-use-websocket)

---

## 📞 Suporte

Para problemas com WebSockets:

1. **Verificar este documento** para configurações corretas
2. **Executar script de teste** para validar conectividade
3. **Consultar logs** do backend e load balancer
4. **Verificar firewall** e configurações de rede

---

**📝 Última atualização:** 20 de Junho de 2025  
**📋 Versão:** 1.1.0  
**👨‍💻 Mantido por:** Equipe VeloFlux
