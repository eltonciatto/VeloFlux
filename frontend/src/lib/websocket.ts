// WebSocket Manager para atualizações em tempo real
// Author: VeloFlux Team

export interface WebSocketEvent {
  type: string;
  data: unknown;
  timestamp: string;
}

export interface WebSocketSubscription {
  channel: string;
  callback: (data: unknown) => void;
  id: string;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private subscriptions: Map<string, WebSocketSubscription[]> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 1000;
  private isManuallyDisconnected = false;

  constructor(private url: string) {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);
        
        this.ws.onopen = () => {
          console.log('WebSocket conectado');
          this.reconnectAttempts = 0;
          this.isManuallyDisconnected = false;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const wsEvent: WebSocketEvent = JSON.parse(event.data);
            this.handleMessage(wsEvent);
          } catch (error) {
            console.error('Erro ao parsear mensagem WebSocket:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('WebSocket desconectado:', event.code);
          this.ws = null;
          
          if (!this.isManuallyDisconnected && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('Erro WebSocket:', error);
          reject(error);
        };

      } catch (error) {
        reject(error);
      }
    });
  }

  disconnect(): void {
    this.isManuallyDisconnected = true;
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.subscriptions.clear();
  }

  subscribe(channel: string, callback: (data: unknown) => void): () => void {
    const subscription: WebSocketSubscription = {
      channel,
      callback,
      id: Math.random().toString(36).substr(2, 9)
    };

    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
    }
    
    this.subscriptions.get(channel)!.push(subscription);

    // Enviar mensagem de subscription se conectado
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.send({
        type: 'subscribe',
        channel,
        timestamp: new Date().toISOString()
      });
    }

    // Retornar função de unsubscribe
    return () => {
      const subs = this.subscriptions.get(channel);
      if (subs) {
        const index = subs.findIndex(s => s.id === subscription.id);
        if (index !== -1) {
          subs.splice(index, 1);
          
          // Se não há mais subscriptions, remover o canal
          if (subs.length === 0) {
            this.subscriptions.delete(channel);
            
            // Enviar mensagem de unsubscribe se conectado
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
              this.send({
                type: 'unsubscribe',
                channel,
                timestamp: new Date().toISOString()
              });
            }
          }
        }
      }
    };
  }

  private handleMessage(event: WebSocketEvent): void {
    const subscriptions = this.subscriptions.get(event.type);
    if (subscriptions) {
      subscriptions.forEach(sub => {
        try {
          sub.callback(event.data);
        } catch (error) {
          console.error(`Erro ao executar callback para ${event.type}:`, error);
        }
      });
    }
  }

  private send(data: unknown): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('WebSocket não conectado, mensagem não enviada:', data);
    }
  }

  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`Tentando reconectar WebSocket em ${delay}ms (tentativa ${this.reconnectAttempts})`);
    
    setTimeout(() => {
      if (!this.isManuallyDisconnected) {
        this.connect().catch(error => {
          console.error('Falha na reconexão WebSocket:', error);
        });
      }
    }, delay);
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }
}

// Singleton instance
let wsManager: WebSocketManager | null = null;

export function getWebSocketManager(): WebSocketManager {
  if (!wsManager) {
    const wsUrl = import.meta.env.VITE_WS_URL || 
                 (import.meta.env.DEV ? 'ws://localhost:8081/ws' : `ws://${window.location.host}/ws`);
    wsManager = new WebSocketManager(wsUrl);
  }
  return wsManager;
}

// Hook para usar WebSocket em React
export function useWebSocket() {
  const wsManager = getWebSocketManager();

  const connect = async () => {
    if (!wsManager.isConnected) {
      await wsManager.connect();
    }
  };

  const disconnect = () => {
    wsManager.disconnect();
  };

  const subscribe = (channel: string, callback: (data: unknown) => void) => {
    return wsManager.subscribe(channel, callback);
  };

  return {
    connect,
    disconnect,
    subscribe,
    isConnected: wsManager.isConnected,
    readyState: wsManager.readyState
  };
}

export default WebSocketManager;
