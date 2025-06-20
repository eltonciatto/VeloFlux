// Environment configuration
export const CONFIG = {
  // Determine if we're in development mode
  // In Docker production build, we want production mode even on localhost
  isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
  
  // API endpoints - STANDARD PORT ALLOCATION (NEVER CHANGE)
  // Development: Always use /api prefix for consistency
  // Production: Nginx proxy routes (/api, /admin/api)
  API_BASE: import.meta.env.VITE_API_URL || '',
  ADMIN_BASE: import.meta.env.VITE_ADMIN_URL || '/admin/api',
  
  // Demo mode - only enabled when explicitly set
  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true',
  
  // Demo credentials (only used in demo mode)
  DEMO_CREDENTIALS: {
    username: 'admin',
    password: 'senha-super'
  },
  
  // Production API configuration
  PRODUCTION: {
    // In production, these should be set via environment variables
    API_URL: import.meta.env.VITE_PROD_API_URL || '/api',
    ADMIN_URL: import.meta.env.VITE_PROD_ADMIN_URL || '/admin/api',
    
    // Production authentication endpoint
    AUTH_ENDPOINT: '/api/auth/login',
    
    // Real backend endpoints for production
    ENDPOINTS: {
      LOGIN: '/api/auth/login',
      REGISTER: '/api/auth/register',
      REFRESH: '/api/auth/refresh',
      PROFILE: '/api/profile',
      LOGOUT: '/api/auth/logout',
      
      // System Metrics & Monitoring
      METRICS: '/api/metrics',
      HEALTH: '/api/health',
      STATUS: '/api/status',
      PROMETHEUS: '/api/metrics/prometheus',
      
      // Real-time data
      REAL_TIME_METRICS: '/api/metrics/realtime',
      WEBSOCKET: import.meta.env.VITE_WS_URL || (import.meta.env.DEV ? 'ws://localhost:8080/api/ws' : '/api/ws'),
      
      // System Information
      SYSTEM_INFO: '/api/system/info',
      PERFORMANCE: '/api/system/performance',
      LOGS: '/api/system/logs',
      ALERTS: '/api/system/alerts',
      
      // Load Balancer specific
      BACKENDS: '/api/backends',
      POOLS: '/api/pools',
      CLUSTER: '/api/cluster',
      CONFIG: '/api/config',
      RELOAD: '/api/reload'
    }
  },
  
  // Production Dashboard Configuration
  DASHBOARD: {
    // Refresh intervals (in milliseconds)
    REFRESH_INTERVALS: {
      METRICS: 5000,      // 5 seconds for real-time metrics
      HEALTH: 10000,      // 10 seconds for health checks
      BACKENDS: 15000,    // 15 seconds for backend status
      LOGS: 30000,        // 30 seconds for log updates
      ALERTS: 60000       // 1 minute for alerts
    },
    
    // Chart configurations
    CHARTS: {
      MAX_DATA_POINTS: 100,
      TIME_WINDOWS: ['5m', '15m', '1h', '6h', '24h', '7d'],
      DEFAULT_TIME_WINDOW: '1h'
    },
    
    // Alert thresholds
    THRESHOLDS: {
      CPU_WARNING: 70,
      CPU_CRITICAL: 90,
      MEMORY_WARNING: 80,
      MEMORY_CRITICAL: 95,
      DISK_WARNING: 85,
      DISK_CRITICAL: 95,
      ERROR_RATE_WARNING: 2,
      ERROR_RATE_CRITICAL: 5,
      RESPONSE_TIME_WARNING: 1000,  // 1 second
      RESPONSE_TIME_CRITICAL: 3000  // 3 seconds
    },
    
    // Feature flags
    FEATURES: {
      REAL_TIME_UPDATES: true,
      AI_INSIGHTS: true,
      PREDICTIVE_ANALYTICS: true,
      ADVANCED_CHARTS: true,
      EXPORT_DATA: true,
      CUSTOM_ALERTS: true
    }
  }
};

// Export utility functions
export const isProduction = () => !CONFIG.isDevelopment;
export const isDemoMode = () => CONFIG.DEMO_MODE;
export const getApiBase = () => CONFIG.API_BASE;
export const getAdminBase = () => CONFIG.ADMIN_BASE;

// Production-specific utilities
export const getEndpoint = (endpoint: keyof typeof CONFIG.PRODUCTION.ENDPOINTS) => {
  return CONFIG.PRODUCTION.ENDPOINTS[endpoint];
};

export const getRefreshInterval = (type: keyof typeof CONFIG.DASHBOARD.REFRESH_INTERVALS) => {
  return CONFIG.DASHBOARD.REFRESH_INTERVALS[type];
};

export const getThreshold = (metric: keyof typeof CONFIG.DASHBOARD.THRESHOLDS) => {
  return CONFIG.DASHBOARD.THRESHOLDS[metric];
};

export const isFeatureEnabled = (feature: keyof typeof CONFIG.DASHBOARD.FEATURES) => {
  return CONFIG.DASHBOARD.FEATURES[feature];
};
