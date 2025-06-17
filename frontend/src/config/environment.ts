// Environment configuration
export const CONFIG = {
  // Determine if we're in development mode
  isDevelopment: import.meta.env.DEV || import.meta.env.MODE === 'development',
  
  // API endpoints - STANDARD PORT ALLOCATION (NEVER CHANGE)
  // Development: Backend direct ports (9090/9000)
  // Production: Nginx proxy routes (/api, /admin/api)
  API_BASE: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:9090' : '/api'),
  ADMIN_BASE: import.meta.env.VITE_ADMIN_URL || (import.meta.env.DEV ? 'http://localhost:9000' : '/admin/api'),
  
  // Demo mode - only enabled in development or when explicitly set
  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true' || import.meta.env.DEV,
  
  // Demo credentials (only used in demo mode)
  DEMO_CREDENTIALS: {
    username: 'admin',
    password: 'senha-super'
  },
  
  // Production API configuration
  PRODUCTION: {
    // In production, these should be set via environment variables
    API_URL: import.meta.env.VITE_PROD_API_URL || '/api',
    ADMIN_URL: import.meta.env.VITE_PROD_ADMIN_URL || '/admin',
    
    // Production authentication endpoint
    AUTH_ENDPOINT: '/auth/login',
    
    // Real backend endpoints for production
    ENDPOINTS: {
      LOGIN: '/auth/login',
      REFRESH: '/auth/refresh',
      PROFILE: '/api/profile',
      LOGOUT: '/auth/logout'
    }
  }
};

// Export utility functions
export const isProduction = () => !CONFIG.isDevelopment;
export const isDemoMode = () => CONFIG.DEMO_MODE;
export const getApiBase = () => isProduction() ? CONFIG.PRODUCTION.API_URL : CONFIG.API_BASE;
export const getAdminBase = () => isProduction() ? CONFIG.PRODUCTION.ADMIN_URL : CONFIG.ADMIN_BASE;
