// Utility functions and interfaces for Orchestration Settings
export interface ResourceLimits {
  cpu_request: string;
  cpu_limit: string;
  memory_request: string;
  memory_limit: string;
}

export interface OrchestrationConfig {
  tenant_id?: string;
  mode: string;
  dedicated_namespace: string;
  resource_limits: ResourceLimits;
  autoscaling_enabled: boolean;
  min_replicas: number;
  max_replicas: number;
  target_cpu_utilization: number;
  custom_domains: string[];
}

export interface OrchestrationStatus {
  tenant_id?: string;
  mode: string;
  status: string;
  namespace: string;
  version: string;
  replicas: number;
  ready_replicas: number;
  message: string;
  last_updated: string;
}

export interface EventItem {
  type: string;
  reason: string;
  message: string;
  timestamp: string;
  count?: number;
  source?: {
    component: string;
    host?: string;
  };
}

export interface DetailedStatus {
  events: EventItem[];
  metrics: {
    cpu_utilization: number;
    memory_utilization: number;
    request_rate: number;
    error_rate: number;
  };
}
