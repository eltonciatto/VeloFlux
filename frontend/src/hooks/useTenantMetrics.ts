import { useState, useCallback, useEffect, useRef } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { useToast } from '@/hooks/use-toast';

export interface TenantMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate_per_minute: number;
    response_time_avg: number;
    response_time_p95: number;
    error_rate: number;
  };
  usage: {
    bandwidth_gb: number;
    storage_gb: number;
    compute_hours: number;
    api_calls: number;
    active_users: number;
  };
  billing: {
    current_period_cost: number;
    projected_monthly_cost: number;
    usage_percentage: number;
    billing_tier: string;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    uptime_percentage: number;
    last_incident?: string;
    active_alerts: number;
  };
}

export interface TenantLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface MetricsFilters {
  time_range?: '1h' | '6h' | '24h' | '7d' | '30d';
  log_level?: 'info' | 'warning' | 'error' | 'debug' | 'all';
  limit?: number;
  offset?: number;
}

export interface AlertConfig {
  name: string;
  description?: string;
  condition: string;
  threshold: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  enabled: boolean;
  notification_channels?: string[];
}

export function useTenantMetrics(tenantId: string, token: string) {
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [logs, setLogs] = useState<TenantLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [logsLoading, setLogsLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshIntervalRef = useRef<number | null>(null);
  const { toast } = useToast();

  const fetchMetrics = useCallback(async (filters?: MetricsFilters) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.time_range) queryParams.append('time_range', filters.time_range);

      const response = await safeApiFetch(`/tenants/${tenantId}/metrics?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setMetrics(response);
      return response;
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar métricas do tenant',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  const fetchLogs = useCallback(async (filters?: MetricsFilters) => {
    setLogsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (filters?.log_level && filters.log_level !== 'all') queryParams.append('level', filters.log_level);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());
      if (filters?.time_range) queryParams.append('time_range', filters.time_range);

      const response = await safeApiFetch(`/tenants/${tenantId}/logs?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLogs(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar logs do tenant',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLogsLoading(false);
    }
  }, [tenantId, token, toast]);

  const fetchRealTimeMetrics = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/tenants/${tenantId}/metrics/realtime`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response;
    } catch (error) {
      console.error('Error fetching real-time metrics:', error);
      throw error;
    }
  }, [tenantId, token]);

  const getMetricsHistory = useCallback(async (metric: string, timeRange: string = '24h') => {
    try {
      const response = await safeApiFetch(`/tenants/${tenantId}/metrics/history`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          metric,
          time_range: timeRange
        })
      });

      return response;
    } catch (error) {
      console.error('Error fetching metrics history:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar histórico de métricas',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const exportMetrics = useCallback(async (format: 'csv' | 'json' = 'csv', filters?: MetricsFilters) => {
    try {
      const queryParams = new URLSearchParams();
      queryParams.append('format', format);
      if (filters?.time_range) queryParams.append('time_range', filters.time_range);

      const response = await safeApiFetch(`/tenants/${tenantId}/metrics/export?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      // Create download link
      const blob = new Blob([format === 'json' ? JSON.stringify(response, null, 2) : response], {
        type: format === 'json' ? 'application/json' : 'text/csv'
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tenant-${tenantId}-metrics.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Métricas exportadas com sucesso',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error exporting metrics:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar métricas',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const getAlerts = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/tenants/${tenantId}/alerts`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      return response;
    } catch (error) {
      console.error('Error fetching alerts:', error);
      throw error;
    }
  }, [tenantId, token]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const response = await safeApiFetch(`/tenants/${tenantId}/alerts/${alertId}/acknowledge`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Alerta reconhecido',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao reconhecer alerta',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const createCustomAlert = useCallback(async (alertConfig: AlertConfig) => {
    try {
      const response = await safeApiFetch(`/tenants/${tenantId}/alerts`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(alertConfig)
      });

      toast({
        title: 'Sucesso',
        description: 'Alerta personalizado criado',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error creating custom alert:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar alerta personalizado',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const startAutoRefresh = useCallback((intervalMs: number = 30000) => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current as unknown as NodeJS.Timeout);
    }

    refreshIntervalRef.current = setInterval(() => {
      fetchMetrics();
    }, intervalMs) as unknown as number;

    setAutoRefresh(true);
  }, [fetchMetrics]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current as unknown as NodeJS.Timeout);
      refreshIntervalRef.current = null;
    }
    setAutoRefresh(false);
  }, []);

  const refreshAll = useCallback(async (filters?: MetricsFilters) => {
    try {
      await Promise.all([
        fetchMetrics(filters),
        fetchLogs(filters)
      ]);
    } catch (error) {
      console.error('Error refreshing all data:', error);
    }
  }, [fetchMetrics, fetchLogs]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current as unknown as NodeJS.Timeout);
      }
    };
  }, []);

  return {
    metrics,
    logs,
    loading,
    logsLoading,
    autoRefresh,
    fetchMetrics,
    fetchLogs,
    fetchRealTimeMetrics,
    getMetricsHistory,
    exportMetrics,
    getAlerts,
    acknowledgeAlert,
    createCustomAlert,
    startAutoRefresh,
    stopAutoRefresh,
    refreshAll
  };
}
