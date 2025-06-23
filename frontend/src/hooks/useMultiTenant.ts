import { useState, useEffect, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';

// Types
interface TenantMetrics {
  requests: Array<{
    hour: number;
    count: number;
  }>;
  errors: Array<{
    hour: number;
    count: number;
  }>;
  latency: Array<{
    hour: number;
    avg: number;
    p95: number;
  }>;
}

interface TenantLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  message: string;
  source: 'api' | 'web' | 'worker';
}

interface TenantLogsResponse {
  logs: TenantLog[];
  total: number;
  page: number;
  per_page: number;
}

interface LogFilters {
  level?: string;
  source?: string;
  startTime?: string;
  endTime?: string;
  search?: string;
}

interface ScalingResources {
  cpu?: number;
  memory?: number;
  storage?: number;
  replicas?: number;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'maintenance';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
  last_activity: string;
  users_count: number;
  monthly_requests: number;
  storage_used: number;
  storage_limit: number;
  cpu_usage: number;
  memory_usage: number;
  monthly_cost: number;
  region: string;
  health_score: number;
  alerts_count: number;
  uptime: number;
  metrics: {
    requests_24h: number;
    errors_24h: number;
    latency_avg: number;
    bandwidth_used: number;
  };
}

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_requests_24h: number;
  total_revenue: number;
  average_health: number;
  critical_alerts: number;
  resource_utilization: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
}

interface TenantFilters {
  status?: string;
  plan?: string;
  region?: string;
  health_threshold?: number;
}

interface BulkActionData {
  action: 'activate' | 'suspend' | 'maintenance' | 'delete' | 'upgrade' | 'downgrade';
  parameters?: Record<string, string | number | boolean>;
}

interface UseMultiTenantHook {
  tenants: Tenant[];
  stats: TenantStats | null;
  isLoading: boolean;
  error: string | null;
  selectedTenants: string[];
  filters: TenantFilters;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  
  // Actions
  refreshData: () => Promise<void>;
  setFilters: (filters: TenantFilters) => void;
  setSortBy: (field: string) => void;
  setSortOrder: (order: 'asc' | 'desc') => void;
  selectTenant: (tenantId: string) => void;
  selectAllTenants: () => void;
  deselectAllTenants: () => void;
  bulkUpdateTenants: (tenantIds: string[], data: BulkActionData) => Promise<void>;
  exportTenantsData: () => Promise<void>;
  getTenantMetrics: (tenantId: string, timeRange?: string) => Promise<TenantMetrics>;
  getTenantLogs: (tenantId: string, filters?: LogFilters) => Promise<TenantLogsResponse>;
  createTenant: (tenantData: Partial<Tenant>) => Promise<Tenant>;
  updateTenant: (tenantId: string, updates: Partial<Tenant>) => Promise<Tenant>;
  deleteTenant: (tenantId: string) => Promise<void>;
  suspendTenant: (tenantId: string, reason?: string) => Promise<void>;
  activateTenant: (tenantId: string) => Promise<void>;
  scaleTenantResources: (tenantId: string, resources: ScalingResources) => Promise<void>;
}

// Mock data generator
const generateMockTenant = (id: string): Tenant => {
  const statuses = ['active', 'inactive', 'suspended', 'maintenance'] as const;
  const plans = ['free', 'basic', 'pro', 'enterprise'] as const;
  const regions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
  
  const status = statuses[Math.floor(Math.random() * statuses.length)];
  const plan = plans[Math.floor(Math.random() * plans.length)];
  const region = regions[Math.floor(Math.random() * regions.length)];
  
  return {
    id,
    name: `Tenant ${id.slice(0, 8)}`,
    domain: `tenant-${id.slice(0, 8)}.veloflux.io`,
    status,
    plan,
    created_at: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString(),
    last_activity: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    users_count: Math.floor(Math.random() * 10000) + 10,
    monthly_requests: Math.floor(Math.random() * 1000000) + 1000,
    storage_used: Math.floor(Math.random() * 100) * 1024 * 1024 * 1024, // GB
    storage_limit: (Math.floor(Math.random() * 500) + 100) * 1024 * 1024 * 1024, // GB
    cpu_usage: Math.floor(Math.random() * 100),
    memory_usage: Math.floor(Math.random() * 100),
    monthly_cost: Math.floor(Math.random() * 5000) + 100,
    region,
    health_score: Math.floor(Math.random() * 100),
    alerts_count: Math.floor(Math.random() * 10),
    uptime: 95 + Math.random() * 5,
    metrics: {
      requests_24h: Math.floor(Math.random() * 50000) + 1000,
      errors_24h: Math.floor(Math.random() * 100),
      latency_avg: Math.floor(Math.random() * 500) + 50,
      bandwidth_used: Math.floor(Math.random() * 1000) + 100
    }
  };
};

const generateMockData = (): { tenants: Tenant[]; stats: TenantStats } => {
  const tenants: Tenant[] = [];
  
  // Generate 50 mock tenants
  for (let i = 0; i < 50; i++) {
    tenants.push(generateMockTenant(`tenant_${i.toString().padStart(3, '0')}`));
  }
  
  const stats: TenantStats = {
    total_tenants: tenants.length,
    active_tenants: tenants.filter(t => t.status === 'active').length,
    total_users: tenants.reduce((sum, t) => sum + t.users_count, 0),
    total_requests_24h: tenants.reduce((sum, t) => sum + t.metrics.requests_24h, 0),
    total_revenue: tenants.reduce((sum, t) => sum + t.monthly_cost, 0),
    average_health: Math.round(tenants.reduce((sum, t) => sum + t.health_score, 0) / tenants.length),
    critical_alerts: tenants.reduce((sum, t) => sum + (t.health_score < 70 ? t.alerts_count : 0), 0),
    resource_utilization: {
      cpu: Math.round(tenants.reduce((sum, t) => sum + t.cpu_usage, 0) / tenants.length),
      memory: Math.round(tenants.reduce((sum, t) => sum + t.memory_usage, 0) / tenants.length),
      storage: Math.round(tenants.reduce((sum, t) => sum + (t.storage_used / t.storage_limit * 100), 0) / tenants.length),
      bandwidth: Math.round(tenants.reduce((sum, t) => sum + (t.metrics.bandwidth_used / 1000 * 100), 0) / tenants.length)
    }
  };
  
  return { tenants, stats };
};

export const useMultiTenant = (): UseMultiTenantHook => {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<TenantStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);
  const [filters, setFiltersState] = useState<TenantFilters>({});
  const [sortBy, setSortByState] = useState<string>('name');
  const [sortOrder, setSortOrderState] = useState<'asc' | 'desc'>('asc');

  // Load initial data
  const loadData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // In a real implementation, this would fetch from API
      // const response = await safeApiFetch('/api/admin/tenants');
      // const statsResponse = await safeApiFetch('/api/admin/tenants/stats');
      
      // For now, use mock data
      const mockData = generateMockData();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setTenants(mockData.tenants);
      setStats(mockData.stats);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load tenant data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actions
  const refreshData = useCallback(async () => {
    await loadData();
  }, [loadData]);

  const setFilters = useCallback((newFilters: TenantFilters) => {
    setFiltersState(newFilters);
  }, []);

  const setSortBy = useCallback((field: string) => {
    setSortByState(field);
  }, []);

  const setSortOrder = useCallback((order: 'asc' | 'desc') => {
    setSortOrderState(order);
  }, []);

  const selectTenant = useCallback((tenantId: string) => {
    setSelectedTenants(prev => {
      if (prev.includes(tenantId)) {
        return prev.filter(id => id !== tenantId);
      } else {
        return [...prev, tenantId];
      }
    });
  }, []);

  const selectAllTenants = useCallback(() => {
    setSelectedTenants(tenants.map(t => t.id));
  }, [tenants]);

  const deselectAllTenants = useCallback(() => {
    setSelectedTenants([]);
  }, []);

  const bulkUpdateTenants = useCallback(async (tenantIds: string[], data: BulkActionData) => {
    try {
      // In a real implementation, this would call the API
      // await safeApiFetch('/api/admin/tenants/bulk', {
      //   method: 'POST',
      //   body: JSON.stringify({ tenant_ids: tenantIds, ...data })
      // });
      
      // For now, simulate the action
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Update local state
      setTenants(prev => prev.map(tenant => {
        if (tenantIds.includes(tenant.id)) {
          const updates: Partial<Tenant> = {};
          
          switch (data.action) {
            case 'activate':
              updates.status = 'active';
              break;
            case 'suspend':
              updates.status = 'suspended';
              break;
            case 'maintenance':
              updates.status = 'maintenance';
              break;
            default:
              break;
          }
          
          return { ...tenant, ...updates };
        }
        return tenant;
      }));
      
      // Clear selection
      setSelectedTenants([]);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Bulk operation failed');
    }
  }, []);

  const exportTenantsData = useCallback(async () => {
    try {
      // In a real implementation, this would call the API
      // const response = await safeApiFetch('/api/admin/tenants/export');
      // const blob = await response.blob();
      
      // For now, create a CSV export
      const csvData = [
        ['ID', 'Name', 'Domain', 'Status', 'Plan', 'Users', 'Requests (24h)', 'Health Score', 'Revenue'].join(','),
        ...tenants.map(tenant => [
          tenant.id,
          tenant.name,
          tenant.domain,
          tenant.status,
          tenant.plan,
          tenant.users_count,
          tenant.metrics.requests_24h,
          tenant.health_score,
          tenant.monthly_cost
        ].join(','))
      ].join('\n');
      
      const blob = new Blob([csvData], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `tenants_export_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Export failed');
    }
  }, [tenants]);

  const getTenantMetrics = useCallback(async (tenantId: string, timeRange: string = '24h') => {
    try {
      // In a real implementation, this would call the API
      // const response = await safeApiFetch(`/api/admin/tenants/${tenantId}/metrics?range=${timeRange}`);
      // return response;
      
      // Mock metrics data
      return {
        requests: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 1000) + 100
        })),
        errors: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          count: Math.floor(Math.random() * 50)
        })),
        latency: Array.from({ length: 24 }, (_, i) => ({
          hour: i,
          avg: Math.floor(Math.random() * 200) + 50,
          p95: Math.floor(Math.random() * 500) + 100
        }))
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch tenant metrics');
    }
  }, []);

  const getTenantLogs = useCallback(async (tenantId: string, filters: LogFilters = {}): Promise<TenantLogsResponse> => {
    try {
      // In a real implementation, this would call the API
      // const queryParams = new URLSearchParams(filters).toString();
      // const response = await safeApiFetch(`/api/admin/tenants/${tenantId}/logs?${queryParams}`);
      // return response;
      
      // Mock logs data
      const levels: Array<'info' | 'warn' | 'error'> = ['info', 'warn', 'error'];
      const sources: Array<'api' | 'web' | 'worker'> = ['api', 'web', 'worker'];
      
      return {
        logs: Array.from({ length: 50 }, (_, i) => ({
          id: `log_${i}`,
          timestamp: new Date(Date.now() - i * 60000).toISOString(),
          level: levels[Math.floor(Math.random() * 3)],
          message: `Sample log message ${i}`,
          source: sources[Math.floor(Math.random() * 3)]
        })),
        total: 1250,
        page: 1,
        per_page: 50
      };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to fetch tenant logs');
    }
  }, []);

  const createTenant = useCallback(async (tenantData: Partial<Tenant>): Promise<Tenant> => {
    try {
      // In a real implementation, this would call the API
      // const response = await safeApiFetch('/api/admin/tenants', {
      //   method: 'POST',
      //   body: JSON.stringify(tenantData)
      // });
      // return response;
      
      const newTenant = generateMockTenant(`tenant_${Date.now()}`);
      Object.assign(newTenant, tenantData);
      
      setTenants(prev => [...prev, newTenant]);
      return newTenant;
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to create tenant');
    }
  }, []);

  const updateTenant = useCallback(async (tenantId: string, updates: Partial<Tenant>): Promise<Tenant> => {
    try {
      // In a real implementation, this would call the API
      // const response = await safeApiFetch(`/api/admin/tenants/${tenantId}`, {
      //   method: 'PUT',
      //   body: JSON.stringify(updates)
      // });
      // return response;
      
      setTenants(prev => prev.map(tenant => 
        tenant.id === tenantId ? { ...tenant, ...updates } : tenant
      ));
      
      const updatedTenant = tenants.find(t => t.id === tenantId);
      if (!updatedTenant) throw new Error('Tenant not found');
      
      return { ...updatedTenant, ...updates };
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to update tenant');
    }
  }, [tenants]);

  const deleteTenant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      // In a real implementation, this would call the API
      // await safeApiFetch(`/api/admin/tenants/${tenantId}`, {
      //   method: 'DELETE'
      // });
      
      setTenants(prev => prev.filter(tenant => tenant.id !== tenantId));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to delete tenant');
    }
  }, []);

  const suspendTenant = useCallback(async (tenantId: string, reason?: string): Promise<void> => {
    try {
      // In a real implementation, this would call the API
      // await safeApiFetch(`/api/admin/tenants/${tenantId}/suspend`, {
      //   method: 'POST',
      //   body: JSON.stringify({ reason })
      // });
      
      await updateTenant(tenantId, { status: 'suspended' });
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to suspend tenant');
    }
  }, [updateTenant]);

  const activateTenant = useCallback(async (tenantId: string): Promise<void> => {
    try {
      // In a real implementation, this would call the API
      // await safeApiFetch(`/api/admin/tenants/${tenantId}/activate`, {
      //   method: 'POST'
      // });
      
      await updateTenant(tenantId, { status: 'active' });
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to activate tenant');
    }
  }, [updateTenant]);

  const scaleTenantResources = useCallback(async (tenantId: string, resources: ScalingResources): Promise<void> => {
    try {
      // In a real implementation, this would call the API
      // await safeApiFetch(`/api/admin/tenants/${tenantId}/scale`, {
      //   method: 'POST',
      //   body: JSON.stringify(resources)
      // });
      
      // Mock scaling operation
      await new Promise(resolve => setTimeout(resolve, 2000));
    } catch (err: unknown) {
      throw new Error(err instanceof Error ? err.message : 'Failed to scale tenant resources');
    }
  }, []);

  return {
    tenants,
    stats,
    isLoading,
    error,
    selectedTenants,
    filters,
    sortBy,
    sortOrder,
    refreshData,
    setFilters,
    setSortBy,
    setSortOrder,
    selectTenant,
    selectAllTenants,
    deselectAllTenants,
    bulkUpdateTenants,
    exportTenantsData,
    getTenantMetrics,
    getTenantLogs,
    createTenant,
    updateTenant,
    deleteTenant,
    suspendTenant,
    activateTenant,
    scaleTenantResources
  };
};
