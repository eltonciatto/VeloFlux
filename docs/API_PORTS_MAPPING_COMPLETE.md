# 🗺️ VeloFlux - Mapa Completo de APIs e Portas

## 🚀 Resumo Executivo

Este documento fornece uma visão consolidada de todas as APIs, portas e endpoints do sistema VeloFlux.

---

## 📊 Tabela de Portas Master

| Porta | Serviço | Protocolo | Descrição | URL de Acesso |
|-------|---------|-----------|-----------|---------------|
| **80** | Load Balancer | HTTP | Proxy principal | `http://localhost` |
| **443** | Load Balancer | HTTPS | Proxy seguro | `https://localhost` |
| **3000** | Frontend | HTTP | Interface web | `http://localhost:3000` |
| **8080** | Backend | HTTP | **Prometheus Metrics** | `http://localhost:8080` |
| **9000** | Backend | HTTP | Admin API | `http://localhost:9000` |
| **9090** | Backend | HTTP/**WebSocket** | **API Principal + WebSockets** | `http://localhost:9090` |
| **9091** | Prometheus | HTTP | Monitoring | `http://localhost:9091` |
| **9092** | AlertManager | HTTP | Alertas | `http://localhost:9092` |
| **6379** | Redis | TCP | Cache (interno) | `redis://localhost:6379` |

---

## 🔌 WebSocket Endpoints Completos

### **Base URL WebSocket**
```
Desenvolvimento: ws://localhost:9090/api/ws/
Produção:       wss://seu-dominio.com/api/ws/
```

### **Endpoints Disponíveis**

| Endpoint | URL Completa | Status | Função |
|----------|--------------|--------|---------|
| **backends** | `ws://localhost:9090/api/ws/backends` | ✅ **ATIVO** | Status dos servidores backend |
| **metrics** | `ws://localhost:9090/api/ws/metrics` | ✅ **ATIVO** | Métricas em tempo real |
| **status** | `ws://localhost:9090/api/ws/status` | ✅ **ATIVO** | Status geral do sistema |
| **ai** | `ws://localhost:9090/api/ws/ai` | ✅ **ATIVO** | Dados de IA/ML |
| **security** | `ws://localhost:9090/api/ws/security` | ✅ **ATIVO** | Eventos de segurança |
| **billing** | `ws://localhost:9090/api/ws/billing` | ✅ **ATIVO** | Informações de cobrança |
| **health** | `ws://localhost:9090/api/ws/health` | ✅ **ATIVO** | Monitoramento de saúde |

---

## 🌐 REST API Endpoints

### **Backend API (Porta 9090)**

#### **Autenticação**
```
POST   /api/auth/login          - Login de usuário
POST   /api/auth/register       - Registro de usuário
POST   /api/auth/refresh        - Refresh do token
GET    /api/auth/logout         - Logout
```

#### **Sistema**
```
GET    /health                  - Health check do sistema
GET    /api/status              - Status detalhado
GET    /api/version             - Versão da aplicação
```

#### **Métricas**
```
GET    /api/metrics             - Métricas da aplicação
GET    /api/metrics/realtime    - Métricas em tempo real
GET    /api/system/info         - Informações do sistema
```

#### **Backends**
```
GET    /api/backends            - Lista de backends
GET    /api/backends/{id}       - Backend específico
POST   /api/backends            - Criar backend
PUT    /api/backends/{id}       - Atualizar backend
DELETE /api/backends/{id}       - Remover backend
```

#### **IA/ML**
```
GET    /api/ai/status           - Status da IA
GET    /api/ai/predictions      - Predições ativas
POST   /api/ai/train            - Treinar modelo
GET    /api/ai/models           - Lista de modelos
```

#### **Billing**
```
GET    /api/billing/usage       - Uso atual
GET    /api/billing/plans       - Planos disponíveis
POST   /api/billing/upgrade     - Upgrade de plano
GET    /api/billing/history     - Histórico de cobrança
```

#### **Tenants (Multi-tenancy)**
```
GET    /api/tenants             - Lista de tenants
POST   /api/tenants             - Criar tenant
GET    /api/tenants/{id}        - Tenant específico
PUT    /api/tenants/{id}        - Atualizar tenant
DELETE /api/tenants/{id}        - Remover tenant
```

#### **Admin**
```
GET    /api/admin/stats         - Estatísticas administrativas
GET    /api/admin/users         - Gerenciar usuários
POST   /api/admin/users         - Criar usuário
GET    /api/admin/logs          - Logs do sistema
```

### **Admin API (Porta 9000)**
```
GET    /admin/health            - Health check admin
GET    /admin/metrics           - Métricas administrativas
POST   /admin/reload            - Recarregar configuração
GET    /admin/config            - Configuração atual
PUT    /admin/config            - Atualizar configuração
```

### **Metrics API (Porta 8080)**
```
GET    /metrics                 - Métricas Prometheus
GET    /health                  - Health check (se disponível)
```

---

## 🔧 Configurações Frontend

### **Environment Configuration**
```typescript
// /frontend/src/config/environment.ts
export const CONFIG = {
  // APIs REST
  API_BASE: '/api',
  ADMIN_BASE: '/admin/api',
  
  // WebSockets
  PRODUCTION: {
    ENDPOINTS: {
      // WebSocket principal
      WEBSOCKET: 'ws://localhost:9090/api/ws',
      
      // APIs REST
      LOGIN: '/api/auth/login',
      METRICS: '/api/metrics',
      HEALTH: '/api/health',
      STATUS: '/api/status',
    }
  }
};
```

### **React Hooks para WebSocket**
```typescript
// /frontend/src/hooks/useRealtimeWebSocket.ts

// Hook para métricas
export function useRealtimeMetrics() {
  return useWebSocket({
    url: 'ws://localhost:9090/api/ws/metrics',
    debug: process.env.NODE_ENV === 'development'
  });
}

// Hook para backends
export function useRealtimeBackends() {
  return useWebSocket({
    url: 'ws://localhost:9090/api/ws/backends',
    debug: process.env.NODE_ENV === 'development'
  });
}

// Hook para IA
export function useRealtimeAI() {
  return useWebSocket({
    url: 'ws://localhost:9090/api/ws/ai',
    debug: process.env.NODE_ENV === 'development'
  });
}
```

---

## 🐳 Docker Network Configuration

### **Container Network**
```yaml
# docker-compose.yml
networks:
  veloflux-network:
    driver: bridge

services:
  backend:
    ports:
      - "8080:8080"  # Prometheus metrics
      - "9000:9000"  # Admin API
      - "9090:9090"  # Main API + WebSockets
    networks:
      - veloflux-network

  frontend:
    ports:
      - "3000:80"    # Web interface
    networks:
      - veloflux-network

  loadbalancer:
    ports:
      - "80:80"      # HTTP
      - "443:443"    # HTTPS
    networks:
      - veloflux-network
```

### **Internal Communication**
```
loadbalancer → frontend:80
loadbalancer → backend:9090 (API + WebSocket)
backend → redis:6379
backend → prometheus:9090
```

---

## 🧪 Scripts de Teste

### **1. Teste Completo de Conectividade**
```bash
#!/bin/bash
# /scripts/test_all_endpoints.sh

echo "🧪 Testando todas as APIs do VeloFlux"

# Testar APIs REST
echo "📡 REST APIs:"
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:9090/health
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:8080/metrics
curl -s -o /dev/null -w "Status: %{http_code}\n" http://localhost:9000/admin/health

# Testar WebSockets
echo "🔌 WebSockets:"
python3 << EOF
import asyncio
import websockets

async def test_ws(url):
    try:
        async with websockets.connect(url) as ws:
            await asyncio.wait_for(ws.recv(), timeout=2)
            return "✅"
    except:
        return "❌"

async def main():
    endpoints = [
        "ws://localhost:9090/api/ws/backends",
        "ws://localhost:9090/api/ws/metrics",
        "ws://localhost:9090/api/ws/status"
    ]
    
    for url in endpoints:
        result = await test_ws(url)
        print(f"{url}: {result}")

asyncio.run(main())
EOF
```

### **2. Monitoramento Contínuo**
```bash
#!/bin/bash
# /scripts/monitor_websockets.sh

while true; do
  echo "$(date): Testando WebSockets..."
  
  python3 -c "
import asyncio
import websockets

async def monitor():
    try:
        async with websockets.connect('ws://localhost:9090/api/ws/status') as ws:
            msg = await asyncio.wait_for(ws.recv(), timeout=5)
            print('✅ WebSocket ativo')
    except Exception as e:
        print(f'❌ WebSocket falhou: {e}')

asyncio.run(monitor())
"
  
  sleep 30
done
```

---

## 🔍 Troubleshooting por Porta

### **Porta 9090 (API + WebSocket) - MAIS IMPORTANTE**
```bash
# Verificar se está rodando
netstat -tlnp | grep 9090
curl http://localhost:9090/health

# Logs detalhados
docker-compose logs backend | grep "9090"
docker-compose logs backend | grep "WebSocket"

# Teste WebSocket específico
python3 -c "
import asyncio
import websockets
asyncio.run(websockets.connect('ws://localhost:9090/api/ws/status').recv())
"
```

### **Porta 8080 (Metrics)**
```bash
# Verificar métricas Prometheus
curl http://localhost:8080/metrics | head -10

# Verificar se prometheus está coletando
curl http://localhost:9091/targets
```

### **Porta 80 (Load Balancer)**
```bash
# Testar proxy
curl -I http://localhost/
curl -I http://localhost/dashboard

# Logs do nginx
docker-compose logs loadbalancer | tail -20
```

---

## 📋 Checklist de Verificação

### **✅ Sistema Healthy**
- [ ] Todos containers rodando: `docker-compose ps`
- [ ] Backend API respondendo: `curl http://localhost:9090/health`
- [ ] WebSockets conectando: Teste com Python/JavaScript
- [ ] Frontend carregando: `curl http://localhost/`
- [ ] Dashboard acessível: `curl http://localhost/dashboard`
- [ ] Métricas disponíveis: `curl http://localhost:8080/metrics`

### **✅ WebSockets Específicos**
- [ ] `ws://localhost:9090/api/ws/backends` ✅
- [ ] `ws://localhost:9090/api/ws/metrics` ✅
- [ ] `ws://localhost:9090/api/ws/status` ✅
- [ ] `ws://localhost:9090/api/ws/ai` ✅
- [ ] `ws://localhost:9090/api/ws/security` ✅
- [ ] `ws://localhost:9090/api/ws/billing` ✅
- [ ] `ws://localhost:9090/api/ws/health` ✅

---

## 🚨 Alertas e Monitoramento

### **Configuração AlertManager (Porta 9092)**
```yaml
# alertmanager.yml
route:
  receiver: 'web.hook'
  
receivers:
- name: 'web.hook'
  webhook_configs:
  - url: 'http://backend:9090/api/alerts/webhook'
```

### **Métricas Importantes**
```
# WebSocket connections
websocket_connections_total
websocket_connection_duration_seconds
websocket_messages_sent_total
websocket_messages_received_total

# API performance
http_requests_total
http_request_duration_seconds
http_response_size_bytes
```

---

**📝 Última atualização:** 20 de Junho de 2025  
**🏷️ Versão:** 1.1.0  
**🔧 Status:** Totalmente operacional  
**📞 Suporte:** Consulte logs e scripts de teste neste documento
