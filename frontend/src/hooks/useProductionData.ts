import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSystemMetrics, useSystemHealth, usePerformanceMetrics, useSystemLogs, useSystemAlerts, useRealTimeMetrics } from './use-api';
import { getRefreshInterval, isFeatureEnabled } from '@/config/environment';

export interface ProductionMetrics {
  system: {
    cpu_usage: number;
    memory_usage: number;
    disk_usage: number;
    network_in: number;
    network_out: number;
    load_avg: number[];
    uptime: number;
  };
  requests: {
    total: number;
    rate_per_minute: number;
    error_rate: number;
    avg_response_time: number;
    p95_response_time: number;
    active_connections: number;
  };
  backends: {
    total: number;
    healthy: number;
    unhealthy: number;
    pools: Array<{
      name: string;
      backends: number;
      healthy: number;
      load: number;
    }>;
  };
  security: {
    blocked_requests: number;
    suspicious_ips: string[];
    failed_auth_attempts: number;
    rate_limit_hits: number;
  };
  ai: {
    enabled: boolean;
    predictions_count: number;
    accuracy: number;
    models_active: number;
    last_training: string;
  };
}

export interface ProductionLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

export interface ProductionAlert {
  id: string;
  title: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
  resolved: boolean;
  source: string;
}

export interface ProductionPerformance {
  response_times: Array<{
    timestamp: string;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  }>;
  requests_timeline: Array<{
    timestamp: string;
    requests: number;
    errors: number;
    successful: number;
  }>;
  latency_distribution: Array<{
    percentile: string;
    value: number;
  }>;
  throughput: Array<{
    timestamp: string;
    rps: number;
    bytes_per_second: number;
  }>;
}

export function useProductionData() {
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Core data hooks
  const { data: systemMetrics, isLoading: metricsLoading, error: metricsError } = useSystemMetrics();
  const { data: healthData, isLoading: healthLoading, error: healthError } = useSystemHealth();
  const { data: performanceData, isLoading: perfLoading, error: perfError } = usePerformanceMetrics();
  const { data: systemLogs, isLoading: logsLoading, error: logsError } = useSystemLogs({ limit: 100 });
  const { data: systemAlerts, isLoading: alertsLoading, error: alertsError } = useSystemAlerts();
  const { data: realTimeData, isLoading: realTimeLoading, error: realTimeError } = useRealTimeMetrics();

  // Consolidate loading states
  const loading = metricsLoading || healthLoading || perfLoading || logsLoading || alertsLoading || realTimeLoading;

  // Consolidate errors
  useEffect(() => {
    const errors = [metricsError, healthError, perfError, logsError, alertsError, realTimeError].filter(Boolean);
    if (errors.length > 0) {
      setError(`Multiple data source errors: ${errors.length} failed`);
    } else {
      setError(null);
    }
  }, [metricsError, healthError, perfError, logsError, alertsError, realTimeError]);

  // Update timestamp when data changes
  useEffect(() => {
    if (systemMetrics || healthData || performanceData) {
      setLastUpdate(new Date());
    }
  }, [systemMetrics, healthData, performanceData]);

  // Transform and consolidate metrics
  const metrics: ProductionMetrics | null = useMemo(() => systemMetrics ? {
    system: {
      cpu_usage: systemMetrics.cpu?.usage || 0,
      memory_usage: systemMetrics.memory?.usage_percentage || 0,
      disk_usage: systemMetrics.disk?.usage_percentage || 0,
      network_in: systemMetrics.network?.bytes_recv || 0,
      network_out: systemMetrics.network?.bytes_sent || 0,
      load_avg: systemMetrics.cpu?.load_avg || [0, 0, 0],
      uptime: systemMetrics.uptime || 0,
    },
    requests: {
      total: realTimeData?.total_requests || systemMetrics.requests?.total || 0,
      rate_per_minute: realTimeData?.requests_per_minute || systemMetrics.requests?.rate_per_minute || 0,
      error_rate: realTimeData?.error_rate || systemMetrics.requests?.error_rate || 0,
      avg_response_time: realTimeData?.avg_response_time || systemMetrics.requests?.avg_response_time || 0,
      p95_response_time: systemMetrics.requests?.p95_response_time || 0,
      active_connections: realTimeData?.active_connections || systemMetrics.requests?.active_connections || 0,
    },
    backends: {
      total: systemMetrics.backends?.total || 0,
      healthy: systemMetrics.backends?.healthy || 0,
      unhealthy: systemMetrics.backends?.unhealthy || 0,
      pools: systemMetrics.backends?.pools || [],
    },
    security: {
      blocked_requests: systemMetrics.security?.blocked_requests || 0,
      suspicious_ips: systemMetrics.security?.suspicious_ips || [],
      failed_auth_attempts: systemMetrics.security?.failed_auth_attempts || 0,
      rate_limit_hits: systemMetrics.security?.rate_limit_hits || 0,
    },
    ai: {
      enabled: isFeatureEnabled('AI_INSIGHTS'),
      predictions_count: systemMetrics.ai?.predictions_count || 0,
      accuracy: systemMetrics.ai?.accuracy || 0,
      models_active: systemMetrics.ai?.models_active || 0,
      last_training: systemMetrics.ai?.last_training || new Date().toISOString(),
    },
  } : null, [systemMetrics, realTimeData]);

  // Transform logs
  const logs: ProductionLog[] = useMemo(() => systemLogs?.map((log: Record<string, unknown>) => ({
    id: (log.id as string) || Math.random().toString(36),
    timestamp: (log.timestamp as string) || new Date().toISOString(),
    level: (log.level as string) || 'info',
    message: (log.message as string) || '',
    source: (log.source as string) || 'system',
    metadata: log.metadata as Record<string, unknown>,
  })) || [], [systemLogs]);

  // Transform alerts
  const alerts: ProductionAlert[] = useMemo(() => systemAlerts?.map((alert: Record<string, unknown>) => ({
    id: (alert.id as string) || Math.random().toString(36),
    title: (alert.title as string) || 'System Alert',
    message: (alert.message as string) || '',
    severity: (alert.severity as 'low' | 'medium' | 'high' | 'critical') || 'medium',
    timestamp: (alert.timestamp as string) || new Date().toISOString(),
    resolved: (alert.resolved as boolean) || false,
    source: (alert.source as string) || 'system',
  })) || [], [systemAlerts]);

  // Transform performance data
  const performance: ProductionPerformance | null = useMemo(() => performanceData ? {
    response_times: performanceData.response_times || [],
    requests_timeline: performanceData.requests_timeline || [],
    latency_distribution: performanceData.latency_distribution || [],
    throughput: performanceData.throughput || [],
  } : null, [performanceData]);

  // Refresh all data
  const refreshAll = useCallback(() => {
    setLastUpdate(new Date());
    setError(null);
    // The individual hooks will refetch automatically
  }, []);

  // Export data function
  const exportData = useCallback(() => {
    const exportObj = {
      timestamp: new Date().toISOString(),
      metrics,
      logs: logs.slice(0, 50), // Last 50 logs
      alerts: alerts.filter(a => !a.resolved), // Only active alerts
      performance,
      system_info: {
        version: '1.0.0',
        environment: process.env.NODE_ENV,
        features: {
          ai_insights: isFeatureEnabled('AI_INSIGHTS'),
          real_time_updates: isFeatureEnabled('REAL_TIME_UPDATES'),
          predictive_analytics: isFeatureEnabled('PREDICTIVE_ANALYTICS'),
        }
      }
    };

    const blob = new Blob([JSON.stringify(exportObj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veloflux-production-data-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [metrics, logs, alerts, performance]);

  return {
    // Data
    metrics,
    logs,
    alerts,
    performance,
    
    // States
    loading,
    error,
    lastUpdate,
    
    // Actions
    refreshAll,
    exportData,
    
    // Raw data (for advanced use)
    raw: {
      systemMetrics,
      healthData,
      performanceData,
      systemLogs,
      systemAlerts,
      realTimeData,
    }
  };
}
