// 🚀 Hook WebSocket Avançado para Updates Real-time
// Implementação robusta para produção

import { useEffect, useRef, useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

interface WebSocketConfig {
  url: string;
  protocols?: string[];
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

interface WebSocketMessage {
  type: string;
  data: unknown;
  timestamp: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  send: (message: unknown) => void;
  lastMessage: WebSocketMessage | null;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export function useWebSocket({
  url,
  protocols = [],
  reconnectInterval = 3000,
  maxReconnectAttempts = 5,
  debug = false
}: WebSocketConfig): UseWebSocketReturn {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  
  const ws = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutId = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const log = useCallback((message: string, data?: unknown) => {
    if (debug) {
      console.log(`[WebSocket] ${message}`, data);
    }
  }, [debug]);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    setIsConnecting(true);
    setConnectionStatus('connecting');
    log('Connecting to', url);

    try {
      ws.current = new WebSocket(url, protocols);

      ws.current.onopen = () => {
        log('Connected successfully');
        setIsConnected(true);
        setIsConnecting(false);
        setError(null);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
      };

      ws.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          setLastMessage(message);
          log('Message received', message);

          // Invalidate React Query cache for real-time updates
          if (message.type) {
            queryClient.invalidateQueries({ queryKey: [message.type] });
          }
        } catch (error) {
          log('Error parsing message', error);
        }
      };

      ws.current.onclose = (event) => {
        log('Connection closed', { code: event.code, reason: event.reason });
        setIsConnected(false);
        setIsConnecting(false);
        setConnectionStatus('disconnected');

        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          log(`Reconnection attempt ${reconnectAttempts.current}/${maxReconnectAttempts}`);
          
          reconnectTimeoutId.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        } else if (reconnectAttempts.current >= maxReconnectAttempts) {
          setError('Max reconnection attempts reached');
          setConnectionStatus('error');
        }
      };

      ws.current.onerror = (error) => {
        log('WebSocket error', error);
        setError('WebSocket connection error');
        setConnectionStatus('error');
      };

    } catch (error) {
      log('Error creating WebSocket', error);
      setError('Failed to create WebSocket connection');
      setConnectionStatus('error');
      setIsConnecting(false);
    }
  }, [url, protocols, reconnectInterval, maxReconnectAttempts, log, queryClient]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutId.current) {
      clearTimeout(reconnectTimeoutId.current);
    }
    
    if (ws.current) {
      ws.current.close(1000, 'Manual disconnect');
      ws.current = null;
    }
    
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionStatus('disconnected');
    log('Disconnected manually');
  }, [log]);

  const send = useCallback((message: unknown) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const jsonMessage = JSON.stringify(message);
        ws.current.send(jsonMessage);
        log('Message sent', message);
      } catch (error) {
        log('Error sending message', error);
        setError('Failed to send message');
      }
    } else {
      log('Cannot send message: WebSocket not connected');
      setError('WebSocket not connected');
    }
  }, [log]);

  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    send,
    lastMessage,
    connectionStatus
  };
}

// Hook específico para métricas em tempo real
export function useRealtimeMetrics() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/metrics',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}

// Hook específico para status de IA
export function useRealtimeAI() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/ai',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}

// Hook específico para status de backends
export function useRealtimeBackends() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/backends',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}

// Hook específico para saúde do sistema
export function useRealtimeHealth() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/health',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}

// Hook específico para billing
export function useRealtimeBilling() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/billing',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}

// Hook principal para o dashboard
export function useRealtimeWebSocket(url: string) {
  const wsConfig = {
    url,
    debug: process.env.NODE_ENV === 'development',
    reconnectInterval: 3000,
    maxReconnectAttempts: 5
  };

  return useWebSocket(wsConfig);
}

// Hook específico para segurança
export function useRealtimeSecurity() {
  const wsConfig = {
    url: 'ws://localhost:9090/api/ws/security',
    debug: process.env.NODE_ENV === 'development'
  };

  return useWebSocket(wsConfig);
}
