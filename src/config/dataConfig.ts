// Data configuration for demo vs production modes
import { isDemoMode, isProduction } from './environment';

// Demo data for development/testing
export const DEMO_DATA = {
  metrics: {
    requestsPerSecond: 1247,
    responseTime: 23,
    uptime: 99.98,
    aiAccuracy: 94.2,
    activeConnections: 1834,
    throughput: 156.7
  },
  
  backends: [
    { id: 'backend-1', status: 'healthy', load: 67, responseTime: 18 },
    { id: 'backend-2', status: 'healthy', load: 43, responseTime: 25 },
    { id: 'backend-3', status: 'warning', load: 89, responseTime: 45 }
  ],
  
  aiInsights: [
    'Predicted 23% traffic spike in next 5 minutes',
    'Backend-3 showing elevated response times',
    'ML model accuracy improved by 2.1% this hour',
    'Auto-scaling recommendation: add 1 instance'
  ],
  
  alerts: [
    { severity: 'warning', message: 'High memory usage on Backend-3', timestamp: new Date() },
    { severity: 'info', message: 'AI model retrained successfully', timestamp: new Date() }
  ]
};

// Production data configuration
export const PRODUCTION_CONFIG = {
  // Real API endpoints for fetching live data
  endpoints: {
    metrics: '/api/metrics/realtime',
    backends: '/api/backends/status',
    aiInsights: '/api/ai/insights',
    alerts: '/api/alerts/active',
    analytics: '/api/analytics/dashboard',
    predictions: '/api/ai/predictions'
  },
  
  // Real-time update intervals (in milliseconds)
  updateIntervals: {
    metrics: 5000,      // 5 seconds
    backends: 10000,    // 10 seconds
    aiInsights: 30000,  // 30 seconds
    alerts: 15000       // 15 seconds
  },
  
  // Production data sources
  dataSources: {
    prometheus: import.meta.env.VITE_PROMETHEUS_URL,
    grafana: import.meta.env.VITE_GRAFANA_URL,
    elasticsearch: import.meta.env.VITE_ELASTICSEARCH_URL
  }
};

// Utility functions to get appropriate data
export const getMetricsData = () => {
  if (isDemoMode()) {
    return Promise.resolve(DEMO_DATA.metrics);
  }
  
  // In production, fetch from real API
  return fetch(PRODUCTION_CONFIG.endpoints.metrics)
    .then(res => res.json())
    .catch(err => {
      console.error('Failed to fetch real metrics:', err);
      // Fallback to empty data or error state
      return null;
    });
};

export const getBackendsData = () => {
  if (isDemoMode()) {
    return Promise.resolve(DEMO_DATA.backends);
  }
  
  return fetch(PRODUCTION_CONFIG.endpoints.backends)
    .then(res => res.json())
    .catch(err => {
      console.error('Failed to fetch backend status:', err);
      return [];
    });
};

export const getAIInsights = () => {
  if (isDemoMode()) {
    return Promise.resolve(DEMO_DATA.aiInsights);
  }
  
  return fetch(PRODUCTION_CONFIG.endpoints.aiInsights)
    .then(res => res.json())
    .catch(err => {
      console.error('Failed to fetch AI insights:', err);
      return [];
    });
};

export const getAlerts = () => {
  if (isDemoMode()) {
    return Promise.resolve(DEMO_DATA.alerts);
  }
  
  return fetch(PRODUCTION_CONFIG.endpoints.alerts)
    .then(res => res.json())
    .catch(err => {
      console.error('Failed to fetch alerts:', err);
      return [];
    });
};

// Configuration for data refresh intervals
export const getUpdateInterval = (dataType: keyof typeof PRODUCTION_CONFIG.updateIntervals) => {
  if (isDemoMode()) {
    // In demo mode, update less frequently to simulate real behavior
    return PRODUCTION_CONFIG.updateIntervals[dataType] * 2;
  }
  
  return PRODUCTION_CONFIG.updateIntervals[dataType];
};

// Environment indicator for UI
export const getEnvironmentInfo = () => {
  return {
    mode: isDemoMode() ? 'demo' : 'production',
    isProduction: isProduction(),
    isDemo: isDemoMode(),
    // Add version info if available
    version: import.meta.env.VITE_APP_VERSION || '1.1.0',
    buildDate: import.meta.env.VITE_BUILD_DATE || new Date().toISOString()
  };
};
