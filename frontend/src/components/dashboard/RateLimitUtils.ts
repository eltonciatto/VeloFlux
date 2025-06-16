// Utility functions and interfaces for RateLimitConfig component
export interface RateLimitConfig {
  enabled: boolean;
  requestsPerSecond: number;
  burstSize: number;
  ipBasedLimiting: boolean;
  responseCode: number;
  excludePaths: string[];
  excludeIps: string[];
}

export interface RateLimitConfigProps {
  tenantId?: string;
}
