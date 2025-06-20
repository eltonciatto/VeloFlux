import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { getEndpoint, getRefreshInterval } from '@/config/environment';

export function useBackends() {
  return useQuery({
    queryKey: ['backends'],
    queryFn: () => apiFetch(getEndpoint('BACKENDS')),
    refetchInterval: getRefreshInterval('BACKENDS'),
  });
}

export function useClusterInfo() {
  return useQuery({
    queryKey: ['cluster'],
    queryFn: () => apiFetch(getEndpoint('CLUSTER')),
    refetchInterval: getRefreshInterval('HEALTH'),
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => apiFetch(getEndpoint('CONFIG')),
  });
}

// Production System Metrics
export function useSystemMetrics() {
  return useQuery({
    queryKey: ['system-metrics'],
    queryFn: () => apiFetch(getEndpoint('METRICS')),
    refetchInterval: getRefreshInterval('METRICS'),
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: ['system-health'],
    queryFn: () => apiFetch(getEndpoint('HEALTH')),
    refetchInterval: getRefreshInterval('HEALTH'),
  });
}

export function useSystemStatus() {
  return useQuery({
    queryKey: ['system-status'],
    queryFn: () => apiFetch(getEndpoint('STATUS')),
    refetchInterval: getRefreshInterval('HEALTH'),
  });
}

export function useSystemLogs(filters?: { level?: string; limit?: number }) {
  return useQuery({
    queryKey: ['system-logs', filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters?.level) params.append('level', filters.level);
      if (filters?.limit) params.append('limit', filters.limit.toString());
      return apiFetch(`${getEndpoint('LOGS')}?${params}`);
    },
    refetchInterval: getRefreshInterval('LOGS'),
  });
}

export function useSystemAlerts() {
  return useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => apiFetch(getEndpoint('ALERTS')),
    refetchInterval: getRefreshInterval('ALERTS'),
  });
}

export function usePerformanceMetrics() {
  return useQuery({
    queryKey: ['performance-metrics'],
    queryFn: () => apiFetch(getEndpoint('PERFORMANCE')),
    refetchInterval: getRefreshInterval('METRICS'),
  });
}

export function useRealTimeMetrics() {
  return useQuery({
    queryKey: ['realtime-metrics'],
    queryFn: () => apiFetch(getEndpoint('REAL_TIME_METRICS')),
    refetchInterval: getRefreshInterval('METRICS'),
  });
}

export function useReloadConfig() {
  return useMutation({
    mutationFn: () => apiFetch(getEndpoint('RELOAD'), { method: 'POST' }),
  });
}

export interface BackendInput {
  address: string;
  weight: number;
  region: string;
}

export function useAddBackend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pool: string; backend: BackendInput }) =>
      apiFetch(`${getEndpoint('POOLS')}/${data.pool}/backends`, {
        method: 'POST',
        body: JSON.stringify(data.backend),
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backends'] }),
  });
}

export function useDeleteBackend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { pool: string; address: string }) =>
      apiFetch(`${getEndpoint('BACKENDS')}/${data.pool}/${encodeURIComponent(data.address)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backends'] }),
  });
}
