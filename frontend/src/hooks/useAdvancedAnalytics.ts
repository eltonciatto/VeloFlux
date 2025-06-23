import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';
import { useWebSocket } from '@/lib/websocket';

// Types
interface AnalyticsMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change_percent: number;
  timestamp: string;
  tags: Record<string, string>;
}

interface TimeSeriesData {
  timestamp: string;
  value: number;
  label?: string;
}

interface AnalyticsFilter {
  time_range: '1h' | '6h' | '24h' | '7d' | '30d' | '90d';
  metrics: string[];
  tags: Record<string, string>;
  aggregation: 'avg' | 'sum' | 'min' | 'max' | 'count';
  group_by?: string[];
}

interface AlertRule {
  id: string;
  name: string;
  metric: string;
  operator: 'gt' | 'lt' | 'eq' | 'ne';
  threshold: number;
  duration: string;
  enabled: boolean;
  notifications: string[];
}

interface AnalyticsInsight {
  id: string;
  type: 'anomaly' | 'trend' | 'forecast' | 'correlation';
  title: string;
  description: string;
  confidence: number;
  impact: 'low' | 'medium' | 'high';
  suggested_actions: string[];
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface AnomalyPoint {
  index: number;
  timestamp: string;
  value: number;
  deviation: number;
  isAnomaly: boolean;
}

interface ReportParameters {
  title?: string;
  period?: string;
  includeCharts?: boolean;
  format?: 'summary' | 'detailed';
  sections?: string[];
}

interface ComparisonData {
  current: TimeSeriesData[];
  previous: TimeSeriesData[];
  period_type: 'hour' | 'day' | 'week' | 'month';
}

interface AdvancedAnalyticsHook {
  // Data
  metrics: AnalyticsMetric[];
  timeSeries: Record<string, TimeSeriesData[]>;
  insights: AnalyticsInsight[];
  alerts: AlertRule[];
  forecasts: TimeSeriesData[];
  anomalies: AnomalyPoint[];
  
  // State
  isLoading: boolean;
  error: string | null;
  filters: AnalyticsFilter;
  timeRange: string;
  
  // Actions
  setTimeRange: (timeRange: string) => void;
  refreshData: () => Promise<void>;
  getKPIs: () => Record<string, number>;
  generateInsights: () => Promise<void>;
  
  // Data fetching
  fetchMetrics: (metricNames?: string[]) => Promise<void>;
  fetchTimeSeries: (metricName: string, timeRange?: string) => Promise<TimeSeriesData[]>;
  fetchInsights: () => Promise<void>;
  
  // Filtering and aggregation
  setFilters: (filters: Partial<AnalyticsFilter>) => void;
  getFilteredMetrics: () => AnalyticsMetric[];
  aggregateMetrics: (metrics: AnalyticsMetric[], aggregation: string) => number;
  
  // Comparison and analysis
  compareTimePeriods: (metricName: string, currentPeriod: string, previousPeriod: string) => Promise<ComparisonData>;
  detectAnomalies: (data: TimeSeriesData[], sensitivity: number) => Promise<AnomalyPoint[]>;
  calculateCorrelation: (metric1: string, metric2: string) => Promise<number>;
  
  // Forecasting
  generateForecast: (metricName: string, periods: number) => Promise<TimeSeriesData[]>;
  
  // Alert management
  createAlert: (alert: Omit<AlertRule, 'id'>) => Promise<AlertRule>;
  updateAlert: (id: string, updates: Partial<AlertRule>) => Promise<AlertRule>;
  deleteAlert: (id: string) => Promise<void>;
  testAlert: (alert: AlertRule) => Promise<boolean>;
  
  // Export and reporting
  exportData: (format: 'csv' | 'json' | 'pdf') => Promise<Blob>;
  generateReport: (template: string, parameters: ReportParameters) => Promise<string>;
  
  // Real-time updates
  subscribeToMetric: (metricName: string, callback: (data: AnalyticsMetric) => void) => () => void;
  startRealTimeUpdates: () => void;
  stopRealTimeUpdates: () => void;
}

export const useAdvancedAnalytics = (): AdvancedAnalyticsHook => {
  const { user } = useAuth();
  const { toast } = useToast();
  const { subscribe, connect, disconnect } = useWebSocket();
  
  const [metrics, setMetrics] = useState<AnalyticsMetric[]>([]);
  const [timeSeries, setTimeSeries] = useState<Record<string, TimeSeriesData[]>>({});
  const [insights, setInsights] = useState<AnalyticsInsight[]>([]);
  const [alerts, setAlerts] = useState<AlertRule[]>([]);
  const [forecasts, setForecasts] = useState<TimeSeriesData[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyPoint[]>([]);
  const [timeRange, setTimeRange] = useState<string>('24h');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<AnalyticsFilter>({
    time_range: '24h',
    metrics: [],
    tags: {},
    aggregation: 'avg'
  });

  // Mock data generators
  const generateMockMetrics = useCallback((): AnalyticsMetric[] => {
    const metricNames = [
      'response_time',
      'request_count',
      'error_rate',
      'cpu_usage',
      'memory_usage',
      'disk_usage',
      'network_io',
      'active_users',
      'throughput',
      'cache_hit_rate'
    ];

    return metricNames.map(name => {
      const value = Math.random() * 100;
      const previousValue = value + (Math.random() - 0.5) * 20;
      const changePercent = ((value - previousValue) / previousValue) * 100;
      
      return {
        id: `metric_${name}_${Date.now()}`,
        name,
        value: parseFloat(value.toFixed(2)),
        unit: name.includes('rate') || name.includes('usage') ? '%' : 
              name.includes('time') ? 'ms' : 
              name.includes('count') || name.includes('users') ? '' : 'MB',
        trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
        change_percent: parseFloat(Math.abs(changePercent).toFixed(2)),
        timestamp: new Date().toISOString(),
        tags: {
          environment: Math.random() > 0.5 ? 'production' : 'staging',
          service: `service_${Math.floor(Math.random() * 5) + 1}`,
          region: Math.random() > 0.5 ? 'us-east-1' : 'eu-west-1'
        }
      };
    });
  }, []);

  const generateMockTimeSeries = useCallback((metricName: string, timeRange: string): TimeSeriesData[] => {
    const now = new Date();
    const points = timeRange === '1h' ? 60 : 
                  timeRange === '6h' ? 72 : 
                  timeRange === '24h' ? 96 : 
                  timeRange === '7d' ? 168 : 720;
    
    const intervalMs = timeRange === '1h' ? 60000 : 
                      timeRange === '6h' ? 300000 : 
                      timeRange === '24h' ? 900000 : 
                      timeRange === '7d' ? 3600000 : 3600000;

    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now.getTime() - (points - 1 - i) * intervalMs);
      const baseValue = 50;
      const trend = Math.sin(i * 0.1) * 20;
      const noise = (Math.random() - 0.5) * 10;
      
      return {
        timestamp: timestamp.toISOString(),
        value: Math.max(0, baseValue + trend + noise),
        label: timestamp.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    });
  }, []);

  const generateMockInsights = useCallback((): AnalyticsInsight[] => {
    const insightTypes = ['anomaly', 'trend', 'forecast', 'correlation'] as const;
    const impacts = ['low', 'medium', 'high'] as const;
    
    return Array.from({ length: 5 }, (_, i) => ({
      id: `insight_${Date.now()}_${i}`,
      type: insightTypes[Math.floor(Math.random() * insightTypes.length)],
      title: `Insight ${i + 1}: Performance Pattern Detected`,
      description: `Analysis shows ${impacts[Math.floor(Math.random() * impacts.length)]} impact trend in system metrics over the last hour.`,
      confidence: parseFloat((Math.random() * 0.4 + 0.6).toFixed(2)), // 60-100%
      impact: impacts[Math.floor(Math.random() * impacts.length)],
      suggested_actions: [
        'Monitor related metrics closely',
        'Review system configuration',
        'Consider scaling resources'
      ],
      metadata: {
        affected_metrics: ['response_time', 'cpu_usage'],
        correlation_score: Math.random(),
        statistical_significance: Math.random() > 0.5
      },
      created_at: new Date().toISOString()
    }));
  }, []);

  // Data fetching functions
  const fetchMetrics = useCallback(async (metricNames?: string[]): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const mockMetrics = generateMockMetrics();
      const filteredMetrics = metricNames 
        ? mockMetrics.filter(m => metricNames.includes(m.name))
        : mockMetrics;
      
      setMetrics(filteredMetrics);
    } catch (err) {
      setError('Failed to fetch metrics');
      toast({
        title: 'Error',
        description: 'Failed to fetch analytics metrics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateMockMetrics, toast]);

  const fetchTimeSeries = useCallback(async (metricName: string, timeRange = '24h'): Promise<TimeSeriesData[]> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const data = generateMockTimeSeries(metricName, timeRange);
      setTimeSeries(prev => ({ ...prev, [metricName]: data }));
      
      return data;
    } catch (err) {
      setError('Failed to fetch time series data');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [generateMockTimeSeries]);

  const fetchInsights = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockInsights = generateMockInsights();
      setInsights(mockInsights);
    } catch (err) {
      setError('Failed to fetch insights');
      toast({
        title: 'Error',
        description: 'Failed to fetch AI insights',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [generateMockInsights, toast]);

  // Filtering and aggregation
  const setFilters = useCallback((newFilters: Partial<AnalyticsFilter>) => {
    setFiltersState(prev => ({ ...prev, ...newFilters }));
  }, []);

  const getFilteredMetrics = useCallback((): AnalyticsMetric[] => {
    let filtered = metrics;
    
    // Filter by metric names
    if (filters.metrics.length > 0) {
      filtered = filtered.filter(m => filters.metrics.includes(m.name));
    }
    
    // Filter by tags
    if (Object.keys(filters.tags).length > 0) {
      filtered = filtered.filter(m => 
        Object.entries(filters.tags).every(([key, value]) => 
          m.tags[key] === value
        )
      );
    }
    
    return filtered;
  }, [metrics, filters]);

  const aggregateMetrics = useCallback((metrics: AnalyticsMetric[], aggregation: string): number => {
    if (metrics.length === 0) return 0;
    
    const values = metrics.map(m => m.value);
    
    switch (aggregation) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return values[0] || 0;
    }
  }, []);

  // Analysis functions
  const compareTimePeriods = useCallback(async (
    metricName: string, 
    currentPeriod: string, 
    previousPeriod: string
  ): Promise<ComparisonData> => {
    const current = await fetchTimeSeries(metricName, currentPeriod);
    const previous = generateMockTimeSeries(metricName, previousPeriod);
    
    return {
      current,
      previous,
      period_type: 'hour'
    };
  }, [fetchTimeSeries, generateMockTimeSeries]);

  const detectAnomalies = useCallback(async (data: TimeSeriesData[], sensitivity: number): Promise<AnomalyPoint[]> => {
    // Simple anomaly detection using statistical methods
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    const threshold = stdDev * (2 - sensitivity); // sensitivity affects threshold
    
    return data
      .map((point, index): AnomalyPoint => ({
        index,
        timestamp: point.timestamp,
        value: point.value,
        deviation: Math.abs(point.value - mean),
        isAnomaly: Math.abs(point.value - mean) > threshold
      }))
      .filter(point => point.isAnomaly);
  }, []);

  const calculateCorrelation = useCallback(async (metric1: string, metric2: string): Promise<number> => {
    // Mock correlation calculation
    await new Promise(resolve => setTimeout(resolve, 300));
    return Math.random() * 2 - 1; // Return value between -1 and 1
  }, []);

  const generateForecast = useCallback(async (metricName: string, periods: number): Promise<TimeSeriesData[]> => {
    // Simple linear trend forecast
    const historical = timeSeries[metricName] || generateMockTimeSeries(metricName, '24h');
    const lastValue = historical[historical.length - 1]?.value || 50;
    const trend = historical.length > 1 
      ? (historical[historical.length - 1].value - historical[0].value) / historical.length
      : 0;
    
    return Array.from({ length: periods }, (_, i) => {
      const futureTime = new Date(Date.now() + (i + 1) * 3600000); // 1 hour intervals
      const forecastValue = lastValue + trend * (i + 1) + (Math.random() - 0.5) * 5;
      
      return {
        timestamp: futureTime.toISOString(),
        value: Math.max(0, forecastValue),
        label: futureTime.toLocaleTimeString('pt-BR', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })
      };
    });
  }, [timeSeries, generateMockTimeSeries]);

  // Alert management
  const createAlert = useCallback(async (alert: Omit<AlertRule, 'id'>): Promise<AlertRule> => {
    const newAlert: AlertRule = {
      ...alert,
      id: `alert_${Date.now()}`
    };
    
    setAlerts(prev => [...prev, newAlert]);
    return newAlert;
  }, []);

  const updateAlert = useCallback(async (id: string, updates: Partial<AlertRule>): Promise<AlertRule> => {
    const updatedAlert = alerts.find(a => a.id === id);
    if (!updatedAlert) throw new Error('Alert not found');
    
    const newAlert = { ...updatedAlert, ...updates };
    setAlerts(prev => prev.map(a => a.id === id ? newAlert : a));
    return newAlert;
  }, [alerts]);

  const deleteAlert = useCallback(async (id: string): Promise<void> => {
    setAlerts(prev => prev.filter(a => a.id !== id));
  }, []);

  const testAlert = useCallback(async (alert: AlertRule): Promise<boolean> => {
    // Mock alert testing
    await new Promise(resolve => setTimeout(resolve, 200));
    return Math.random() > 0.3; // 70% success rate
  }, []);

  // Export and reporting
  const exportData = useCallback(async (format: 'csv' | 'json' | 'pdf'): Promise<Blob> => {
    const data = {
      metrics: getFilteredMetrics(),
      timeSeries,
      insights,
      exported_at: new Date().toISOString(),
      filters
    };
    
    let content: string;
    let mimeType: string;
    
    switch (format) {
      case 'json':
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
        break;
      case 'csv': {
        // Simple CSV export for metrics
        const csvRows = [
          'Name,Value,Unit,Trend,Change %,Timestamp',
          ...data.metrics.map(m => 
            `${m.name},${m.value},${m.unit},${m.trend},${m.change_percent},${m.timestamp}`
          )
        ];
        content = csvRows.join('\n');
        mimeType = 'text/csv';
        break;
      }
      default:
        content = JSON.stringify(data, null, 2);
        mimeType = 'application/json';
    }
    
    return new Blob([content], { type: mimeType });
  }, [getFilteredMetrics, timeSeries, insights, filters]);

  const generateReport = useCallback(async (template: string, parameters: ReportParameters): Promise<string> => {
    // Mock report generation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return `
# Analytics Report - ${new Date().toLocaleDateString('pt-BR')}

## Summary
- Total Metrics: ${metrics.length}
- Active Alerts: ${alerts.filter(a => a.enabled).length}
- Insights Generated: ${insights.length}

## Key Metrics
${metrics.slice(0, 5).map(m => 
  `- **${m.name}**: ${m.value}${m.unit} (${m.trend === 'up' ? '↑' : m.trend === 'down' ? '↓' : '→'} ${m.change_percent}%)`
).join('\n')}

## Recent Insights
${insights.slice(0, 3).map(i => 
  `### ${i.title}\n${i.description}\n*Confidence: ${(i.confidence * 100).toFixed(1)}%*`
).join('\n\n')}

---
*Report generated by VeloFlux Advanced Analytics*
    `.trim();
  }, [metrics, alerts, insights]);

  // Real-time updates using WebSocket
  const subscribeToMetric = useCallback((metricName: string, callback: (data: AnalyticsMetric) => void) => {
    // Subscribe to WebSocket channel for this metric
    const unsubscribe = subscribe(`metrics.${metricName}`, (data: Record<string, unknown>) => {
      // Type guard to ensure data is a valid AnalyticsMetric
      if (data && 
          typeof data.id === 'string' &&
          typeof data.name === 'string' &&
          typeof data.value === 'number' &&
          typeof data.unit === 'string' &&
          typeof data.trend === 'string' &&
          typeof data.change_percent === 'number' &&
          typeof data.timestamp === 'string' &&
          typeof data.tags === 'object' &&
          data.name === metricName) {
        callback(data as unknown as AnalyticsMetric);
      }
    });
    
    return unsubscribe;
  }, [subscribe]);

  const startRealTimeUpdates = useCallback(async () => {
    try {
      await connect();
      console.log('Real-time updates started via WebSocket');
    } catch (error) {
      console.error('Failed to start real-time updates:', error);
      toast({
        title: "Connection Error",
        description: "Failed to establish real-time connection",
        variant: "destructive"
      });
    }
  }, [connect, toast]);

  const stopRealTimeUpdates = useCallback(() => {
    try {
      disconnect();
      console.log('Real-time updates stopped');
    } catch (error) {
      console.error('Failed to stop real-time updates:', error);
    }
  }, [disconnect]);

  // Initialize data on mount
  useEffect(() => {
    fetchMetrics();
    fetchInsights();
  }, [fetchMetrics, fetchInsights]);

  // Additional functions
  const refreshData = useCallback(async () => {
    await Promise.all([
      fetchMetrics(),
      fetchInsights()
    ]);
  }, [fetchMetrics, fetchInsights]);

  const getKPIs = useCallback((): Record<string, number> => {
    const kpis: Record<string, number> = {};
    
    metrics.forEach(metric => {
      kpis[metric.name] = metric.value;
    });
    
    return kpis;
  }, [metrics]);

  const generateInsightsData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      
      // Mock insights generation
      const mockInsights: AnalyticsInsight[] = [
        {
          id: '1',
          type: 'anomaly',
          title: 'High CPU Usage Detected',
          description: 'CPU usage has been consistently above 80% for the last 30 minutes',
          confidence: 0.95,
          impact: 'high',
          suggested_actions: ['Scale up instances', 'Optimize CPU-intensive processes'],
          metadata: {
            metric: 'cpu_usage',
            value: 85.4,
            threshold: 80
          },
          created_at: new Date().toISOString()
        }
      ];
      
      setInsights(mockInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Memoized values
  const filteredMetrics = useMemo(() => getFilteredMetrics(), [getFilteredMetrics]);

  return {
    // Data
    metrics: filteredMetrics,
    timeSeries,
    insights,
    alerts,
    forecasts,
    anomalies,
    
    // State
    isLoading,
    error,
    filters,
    timeRange,
    
    // Actions
    setTimeRange,
    refreshData,
    getKPIs,
    generateInsights: generateInsightsData,
    
    // Data fetching
    fetchMetrics,
    fetchTimeSeries,
    fetchInsights,
    
    // Filtering and aggregation
    setFilters,
    getFilteredMetrics,
    aggregateMetrics,
    
    // Comparison and analysis
    compareTimePeriods,
    detectAnomalies,
    calculateCorrelation,
    
    // Forecasting
    generateForecast,
    
    // Alert management
    createAlert,
    updateAlert,
    deleteAlert,
    testAlert,
    
    // Export and reporting
    exportData,
    generateReport,
    
    // Real-time updates
    subscribeToMetric,
    startRealTimeUpdates,
    stopRealTimeUpdates
  };
};
