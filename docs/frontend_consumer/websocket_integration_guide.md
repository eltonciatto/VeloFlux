# WebSocket Integration - Frontend Guide

## Visão Geral

Este guia documenta como integrar WebSockets no frontend para receber atualizações em tempo real de billing, notificações e eventos do sistema VeloFlux.

## 🔌 Configuração WebSocket

### URL de Conexão
```javascript
const WEBSOCKET_URL = 'wss://api.veloflux.io/ws';
// Para desenvolvimento local
const DEV_WEBSOCKET_URL = 'ws://localhost:9090/ws';
```

### Cliente WebSocket Base
```javascript
class VeloFluxWebSocket {
  constructor(url, token, tenantId) {
    this.url = url;
    this.token = token;
    this.tenantId = tenantId;
    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 1000;
    this.heartbeatInterval = 30000;
    this.listeners = new Map();
  }

  connect() {
    try {
      const wsUrl = `${this.url}?token=${this.token}&tenant_id=${this.tenantId}`;
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = this.onOpen.bind(this);
      this.ws.onmessage = this.onMessage.bind(this);
      this.ws.onclose = this.onClose.bind(this);
      this.ws.onerror = this.onError.bind(this);
      
      this.startHeartbeat();
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.reconnect();
    }
  }

  onOpen() {
    console.log('WebSocket connected');
    this.reconnectAttempts = 0;
    
    // Subscrever a eventos de billing
    this.subscribe('billing_events');
    this.subscribe('notifications');
    this.subscribe('usage_alerts');
  }

  onMessage(event) {
    try {
      const data = JSON.parse(event.data);
      this.handleMessage(data);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  onClose() {
    console.log('WebSocket connection closed');
    this.stopHeartbeat();
    this.reconnect();
  }

  onError(error) {
    console.error('WebSocket error:', error);
  }

  subscribe(channel) {
    const message = {
      type: 'subscribe',
      channel: channel,
      tenant_id: this.tenantId
    };
    this.send(message);
  }

  send(data) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    }
  }

  handleMessage(data) {
    const { type, channel, payload } = data;
    
    // Emitir evento para listeners
    const listeners = this.listeners.get(channel) || [];
    listeners.forEach(callback => {
      try {
        callback(payload, type);
      } catch (error) {
        console.error('Error in WebSocket listener:', error);
      }
    });
  }

  on(channel, callback) {
    if (!this.listeners.has(channel)) {
      this.listeners.set(channel, []);
    }
    this.listeners.get(channel).push(callback);
  }

  off(channel, callback) {
    const listeners = this.listeners.get(channel);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.send({ type: 'ping' });
      }
    }, this.heartbeatInterval);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }

  reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      setTimeout(() => {
        console.log(`Attempting to reconnect... (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
        this.connect();
      }, this.reconnectInterval * this.reconnectAttempts);
    }
  }

  disconnect() {
    this.stopHeartbeat();
    if (this.ws) {
      this.ws.close();
    }
  }
}
```

## 📺 Eventos Disponíveis

### Billing Events
```javascript
// Eventos de assinatura
{
  "type": "subscription_updated",
  "channel": "billing_events",
  "payload": {
    "subscription_id": "sub_123",
    "tenant_id": "tenant_456",
    "status": "active",
    "plan": "pro",
    "updated_at": "2024-12-06T10:00:00Z"
  }
}

// Eventos de fatura
{
  "type": "invoice_created",
  "channel": "billing_events",
  "payload": {
    "invoice_id": "inv_789",
    "tenant_id": "tenant_456",
    "amount": 99.99,
    "currency": "USD",
    "due_date": "2024-12-31T23:59:59Z"
  }
}

// Eventos de pagamento
{
  "type": "payment_succeeded",
  "channel": "billing_events",
  "payload": {
    "payment_id": "pay_101",
    "invoice_id": "inv_789",
    "amount": 99.99,
    "currency": "USD",
    "processed_at": "2024-12-06T10:00:00Z"
  }
}
```

### Usage Alerts
```javascript
{
  "type": "usage_threshold_reached",
  "channel": "usage_alerts",
  "payload": {
    "tenant_id": "tenant_456",
    "metric": "api_calls",
    "current_usage": 8500,
    "threshold": 8000,
    "limit": 10000,
    "percentage": 85,
    "period": "monthly"
  }
}
```

### Notifications
```javascript
{
  "type": "notification",
  "channel": "notifications",
  "payload": {
    "id": "notif_123",
    "title": "Payment Failed",
    "message": "Your payment of $99.99 could not be processed.",
    "type": "payment_failed",
    "priority": "high",
    "created_at": "2024-12-06T10:00:00Z",
    "action_url": "/billing/payment-methods"
  }
}
```

## ⚛️ Hook React para WebSocket

```tsx
// hooks/useWebSocket.ts
import { useEffect, useRef, useState, useCallback } from 'react';
import { VeloFluxWebSocket } from '../services/websocket';

interface UseWebSocketOptions {
  url: string;
  token: string;
  tenantId: string;
  autoConnect?: boolean;
}

interface WebSocketState {
  connected: boolean;
  connecting: boolean;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const { url, token, tenantId, autoConnect = true } = options;
  const wsRef = useRef<VeloFluxWebSocket | null>(null);
  const [state, setState] = useState<WebSocketState>({
    connected: false,
    connecting: false,
    error: null
  });

  const connect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
    }

    setState(prev => ({ ...prev, connecting: true, error: null }));
    
    wsRef.current = new VeloFluxWebSocket(url, token, tenantId);
    
    // Listeners para mudanças de estado
    wsRef.current.on('connection', (data, type) => {
      if (type === 'connected') {
        setState({ connected: true, connecting: false, error: null });
      } else if (type === 'disconnected') {
        setState({ connected: false, connecting: false, error: null });
      } else if (type === 'error') {
        setState({ connected: false, connecting: false, error: data.message });
      }
    });

    wsRef.current.connect();
  }, [url, token, tenantId]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.disconnect();
      wsRef.current = null;
    }
    setState({ connected: false, connecting: false, error: null });
  }, []);

  const subscribe = useCallback((channel: string, callback: Function) => {
    if (wsRef.current) {
      wsRef.current.on(channel, callback);
    }
  }, []);

  const unsubscribe = useCallback((channel: string, callback: Function) => {
    if (wsRef.current) {
      wsRef.current.off(channel, callback);
    }
  }, []);

  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [connect, disconnect, autoConnect]);

  return {
    ...state,
    connect,
    disconnect,
    subscribe,
    unsubscribe,
    ws: wsRef.current
  };
}
```

## 🎯 Hook Específico para Billing

```tsx
// hooks/useBillingWebSocket.ts
import { useEffect, useState, useCallback } from 'react';
import { useWebSocket } from './useWebSocket';

interface BillingEvent {
  type: string;
  payload: any;
  timestamp: string;
}

interface UsageAlert {
  metric: string;
  current_usage: number;
  threshold: number;
  limit: number;
  percentage: number;
}

export function useBillingWebSocket(token: string, tenantId: string) {
  const { connected, subscribe, unsubscribe } = useWebSocket({
    url: 'wss://api.veloflux.io/ws',
    token,
    tenantId
  });

  const [billingEvents, setBillingEvents] = useState<BillingEvent[]>([]);
  const [usageAlerts, setUsageAlerts] = useState<UsageAlert[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);

  const handleBillingEvent = useCallback((payload: any, type: string) => {
    const event: BillingEvent = {
      type,
      payload,
      timestamp: new Date().toISOString()
    };
    
    setBillingEvents(prev => [event, ...prev].slice(0, 100)); // Manter apenas os últimos 100 eventos
  }, []);

  const handleUsageAlert = useCallback((payload: any) => {
    setUsageAlerts(prev => {
      const exists = prev.find(alert => alert.metric === payload.metric);
      if (exists) {
        return prev.map(alert => 
          alert.metric === payload.metric ? payload : alert
        );
      }
      return [...prev, payload];
    });
  }, []);

  const handleNotification = useCallback((payload: any) => {
    setNotifications(prev => [payload, ...prev].slice(0, 50)); // Manter apenas as últimas 50 notificações
  }, []);

  useEffect(() => {
    if (connected) {
      subscribe('billing_events', handleBillingEvent);
      subscribe('usage_alerts', handleUsageAlert);
      subscribe('notifications', handleNotification);

      return () => {
        unsubscribe('billing_events', handleBillingEvent);
        unsubscribe('usage_alerts', handleUsageAlert);
        unsubscribe('notifications', handleNotification);
      };
    }
  }, [connected, subscribe, unsubscribe, handleBillingEvent, handleUsageAlert, handleNotification]);

  return {
    connected,
    billingEvents,
    usageAlerts,
    notifications,
    clearEvents: () => setBillingEvents([]),
    clearAlerts: () => setUsageAlerts([]),
    clearNotifications: () => setNotifications([])
  };
}
```

## 🔔 Componente de Notificações em Tempo Real

```tsx
// components/billing/RealtimeNotifications.tsx
import React from 'react';
import { useBillingWebSocket } from '../../hooks/useBillingWebSocket';
import { useAuth } from '../../hooks/useAuth';

interface NotificationProps {
  notification: any;
  onDismiss: (id: string) => void;
}

const NotificationItem: React.FC<NotificationProps> = ({ notification, onDismiss }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'normal': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-3 border-l-4 border-blue-500">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className={`w-2 h-2 rounded-full ${getPriorityColor(notification.priority)}`} />
            <h4 className="font-semibold text-gray-800">{notification.title}</h4>
          </div>
          <p className="text-gray-600 text-sm mb-2">{notification.message}</p>
          <span className="text-xs text-gray-400">
            {new Date(notification.created_at).toLocaleString()}
          </span>
        </div>
        <button
          onClick={() => onDismiss(notification.id)}
          className="text-gray-400 hover:text-gray-600 ml-2"
        >
          ✕
        </button>
      </div>
      {notification.action_url && (
        <div className="mt-3">
          <a
            href={notification.action_url}
            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            Ver detalhes →
          </a>
        </div>
      )}
    </div>
  );
};

export const RealtimeNotifications: React.FC = () => {
  const { token, tenantId } = useAuth();
  const { connected, notifications } = useBillingWebSocket(token, tenantId);

  const [dismissed, setDismissed] = React.useState<Set<string>>(new Set());

  const handleDismiss = (id: string) => {
    setDismissed(prev => new Set([...prev, id]));
  };

  const visibleNotifications = notifications.filter(
    notification => !dismissed.has(notification.id)
  );

  if (!connected) {
    return (
      <div className="text-center p-4 text-gray-500">
        <div className="animate-pulse">Conectando ao servidor de notificações...</div>
      </div>
    );
  }

  if (visibleNotifications.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500">
        <div className="text-4xl mb-4">🔔</div>
        <p>Nenhuma notificação nova</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Notificações em Tempo Real
        </h3>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-sm text-gray-600">Conectado</span>
        </div>
      </div>
      
      <div className="space-y-3 max-h-96 overflow-y-auto">
        {visibleNotifications.map(notification => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onDismiss={handleDismiss}
          />
        ))}
      </div>
    </div>
  );
};
```

## 📊 Monitoramento de Uso em Tempo Real

```tsx
// components/billing/RealtimeUsageMonitor.tsx
import React from 'react';
import { useBillingWebSocket } from '../../hooks/useBillingWebSocket';
import { useAuth } from '../../hooks/useAuth';

export const RealtimeUsageMonitor: React.FC = () => {
  const { token, tenantId } = useAuth();
  const { connected, usageAlerts } = useBillingWebSocket(token, tenantId);

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return 'text-red-600 bg-red-100';
    if (percentage >= 70) return 'text-orange-600 bg-orange-100';
    if (percentage >= 50) return 'text-yellow-600 bg-yellow-100';
    return 'text-green-600 bg-green-100';
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Monitoramento de Uso
        </h3>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Tempo Real' : 'Desconectado'}
          </span>
        </div>
      </div>

      {usageAlerts.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📊</div>
          <p>Nenhum alerta de uso ativo</p>
        </div>
      ) : (
        <div className="space-y-4">
          {usageAlerts.map((alert, index) => (
            <div key={`${alert.metric}-${index}`} className="border rounded-lg p-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-gray-800 capitalize">
                  {alert.metric.replace('_', ' ')}
                </h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getUsageColor(alert.percentage)}`}>
                  {alert.percentage.toFixed(1)}%
                </span>
              </div>
              
              <div className="mb-2">
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>{alert.current_usage.toLocaleString()} / {alert.limit.toLocaleString()}</span>
                  <span>Limite: {alert.threshold.toLocaleString()}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      alert.percentage >= 90 ? 'bg-red-500' :
                      alert.percentage >= 70 ? 'bg-orange-500' :
                      alert.percentage >= 50 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                  />
                </div>
              </div>

              {alert.percentage >= 80 && (
                <div className="mt-3 p-2 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Você está próximo do limite. Considere fazer upgrade do seu plano.
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

## 🎨 Estilos CSS para Indicadores de Status

```css
/* styles/websocket-indicators.css */

/* Indicador de conexão pulsante */
@keyframes pulse-green {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.1);
  }
}

.connection-indicator {
  animation: pulse-green 2s infinite;
}

/* Notificação slide-in */
@keyframes slideInRight {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.notification-enter {
  animation: slideInRight 0.3s ease-out;
}

/* Progress bar animado */
@keyframes progressFill {
  from {
    width: 0%;
  }
  to {
    width: var(--progress-width);
  }
}

.usage-progress {
  animation: progressFill 0.8s ease-out;
}

/* Status badges */
.status-badge {
  transition: all 0.2s ease;
}

.status-badge:hover {
  transform: scale(1.05);
}

/* Pulse para alertas críticos */
@keyframes pulseRed {
  0%, 100% {
    background-color: #ef4444;
  }
  50% {
    background-color: #dc2626;
  }
}

.critical-alert {
  animation: pulseRed 1s infinite;
}
```

## 🧪 Testes para WebSocket

```typescript
// __tests__/websocket.test.ts
import { VeloFluxWebSocket } from '../services/websocket';

// Mock WebSocket
global.WebSocket = class MockWebSocket {
  constructor(url: string) {
    this.url = url;
    this.readyState = WebSocket.CONNECTING;
    setTimeout(() => {
      this.readyState = WebSocket.OPEN;
      this.onopen?.();
    }, 100);
  }
  
  send(data: string) {
    // Mock send
  }
  
  close() {
    this.readyState = WebSocket.CLOSED;
    this.onclose?.();
  }
} as any;

describe('VeloFluxWebSocket', () => {
  let ws: VeloFluxWebSocket;
  
  beforeEach(() => {
    ws = new VeloFluxWebSocket('ws://test', 'token123', 'tenant456');
  });
  
  afterEach(() => {
    ws.disconnect();
  });

  test('should connect successfully', async () => {
    const connectPromise = new Promise(resolve => {
      ws.on('connection', (data, type) => {
        if (type === 'connected') resolve(true);
      });
    });
    
    ws.connect();
    await expect(connectPromise).resolves.toBe(true);
  });

  test('should handle billing events', () => {
    const mockEvent = {
      type: 'subscription_updated',
      channel: 'billing_events',
      payload: { subscription_id: 'sub_123' }
    };
    
    const eventHandler = jest.fn();
    ws.on('billing_events', eventHandler);
    
    ws.handleMessage(mockEvent);
    
    expect(eventHandler).toHaveBeenCalledWith(
      mockEvent.payload,
      mockEvent.type
    );
  });
});
```

## 📱 Integração com Service Workers

```javascript
// service-worker.js para notificações push
self.addEventListener('message', event => {
  if (event.data.type === 'BILLING_NOTIFICATION') {
    const { title, body, data } = event.data.payload;
    
    self.registration.showNotification(title, {
      body,
      icon: '/icons/billing-icon.png',
      badge: '/icons/badge.png',
      data,
      actions: [
        {
          action: 'view',
          title: 'Ver Detalhes'
        },
        {
          action: 'dismiss',
          title: 'Dispensar'
        }
      ]
    });
  }
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  
  if (event.action === 'view') {
    clients.openWindow(event.notification.data.action_url);
  }
});
```

---

**Última atualização:** Dezembro 2024  
**Compatibilidade:** WebSocket API nativa, React 18+, Vue 3+, Angular 15+
