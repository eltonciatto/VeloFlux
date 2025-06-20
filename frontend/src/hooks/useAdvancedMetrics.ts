import { useState, useEffect, useCallback } from 'react';
import { useRealtimeWebSocket } from './useRealtimeWebSocket';

export interface MetricPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AdvancedMetrics {
  realtime: {
    requests_per_second: number;
    active_connections: number;
    error_rate: number;
    avg_response_time: number;
  };
  trends: {
    requests: MetricPoint[];
    errors: MetricPoint[];
    response_times: MetricPoint[];
    bandwidth: MetricPoint[];
  };
  predictions: {
    next_hour_requests: number;
    peak_time_estimate: string;
    capacity_utilization: number;
    anomaly_score: number;
  };
  correlations: Array<{
    metric_a: string;
    metric_b: string;
    correlation: number;
    significance: number;
  }>;
}

export function useAdvancedMetrics(tenantId?: string) {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket para dados em tempo real
  const { lastMessage, isConnected } = useRealtimeWebSocket('/api/ws/metrics');

  // Buscar métricas históricas
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = tenantId ? `/api/tenants/${tenantId}` : '/api';
      
      // Fetch múltiplas métricas em paralelo
      const [realtimeRes, trendsRes, predictionsRes, correlationsRes] = await Promise.all([
        fetch(`${baseUrl}/metrics/realtime`),
        fetch(`${baseUrl}/metrics/trends?period=24h`),
        fetch(`${baseUrl}/metrics/predictions`),
        fetch(`${baseUrl}/metrics/correlations`)
      ]);

      const [realtime, trends, predictions, correlations] = await Promise.all([
        realtimeRes.ok ? realtimeRes.json() : generateMockRealtime(),
        trendsRes.ok ? trendsRes.json() : generateMockTrends(),
        predictionsRes.ok ? predictionsRes.json() : generateMockPredictions(),
        correlationsRes.ok ? correlationsRes.json() : generateMockCorrelations()
      ]);

      setMetrics({
        realtime,
        trends,
        predictions,
        correlations
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      // Fallback para dados mock
      setMetrics(generateMockMetrics());
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Atualizar métricas real-time via WebSocket
  useEffect(() => {
    if (lastMessage && metrics) {
      try {
        const realtimeUpdate = typeof lastMessage === 'string' ? JSON.parse(lastMessage) : lastMessage.data;
        setMetrics(prev => prev ? {
          ...prev,
          realtime: {
            ...prev.realtime,
            ...realtimeUpdate
          }
        } : null);
      } catch (error) {
        console.error('Error parsing realtime data:', error);
      }
    }
  }, [lastMessage, metrics]);

  // Carregar métricas inicial
  useEffect(() => {
    fetchMetrics();
    
    // Atualizar métricas periodicamente
    const interval = setInterval(fetchMetrics, 30000); // 30s
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Funções de análise
  const analyzeAnomalies = useCallback((data: MetricPoint[]) => {
    if (!data || data.length < 10) return [];
    
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2)) / values.length);
    
    return data.filter(point => Math.abs(point.value - mean) > 2 * stdDev);
  }, []);

  const calculateTrend = useCallback((data: MetricPoint[]) => {
    if (!data || data.length < 2) return 0;
    
    const recentData = data.slice(-10);
    const oldData = data.slice(-20, -10);
    
    const recentAvg = recentData.reduce((a, b) => a + b.value, 0) / recentData.length;
    const oldAvg = oldData.reduce((a, b) => a + b.value, 0) / oldData.length;
    
    return ((recentAvg - oldAvg) / oldAvg) * 100;
  }, []);

  return {
    metrics,
    loading,
    error,
    isRealtime: isConnected,
    refresh: fetchMetrics,
    analyzeAnomalies,
    calculateTrend
  };
}

// Mock data generators
function generateMockRealtime() {
  return {
    requests_per_second: Math.floor(Math.random() * 100) + 50,
    active_connections: Math.floor(Math.random() * 500) + 100,
    error_rate: Math.random() * 5,
    avg_response_time: Math.floor(Math.random() * 200) + 50
  };
}

function generateMockTrends() {
  const now = Date.now();
  const hours = 24;
  
  return {
    requests: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 1000) + 500
    })),
    errors: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 50)
    })),
    response_times: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 500) + 100
    })),
    bandwidth: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 100) + 20
    }))
  };
}

function generateMockPredictions() {
  return {
    next_hour_requests: Math.floor(Math.random() * 5000) + 2000,
    peak_time_estimate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    capacity_utilization: Math.random() * 100,
    anomaly_score: Math.random() * 10
  };
}

function generateMockCorrelations() {
  return [
    { metric_a: 'requests', metric_b: 'response_time', correlation: 0.85, significance: 0.95 },
    { metric_a: 'errors', metric_b: 'response_time', correlation: 0.72, significance: 0.88 },
    { metric_a: 'bandwidth', metric_b: 'requests', correlation: 0.91, significance: 0.97 }
  ];
}

function generateMockMetrics(): AdvancedMetrics {
  return {
    realtime: generateMockRealtime(),
    trends: generateMockTrends(),
    predictions: generateMockPredictions(),
    correlations: generateMockCorrelations()
  };
}
