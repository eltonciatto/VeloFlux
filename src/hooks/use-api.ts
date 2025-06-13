import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export function useBackends() {
  return useQuery({
    queryKey: ['backends'],
    queryFn: () => apiFetch('/api/backends'),
  });
}

export function useClusterInfo() {
  return useQuery({
    queryKey: ['cluster'],
    queryFn: () => apiFetch('/api/cluster'),
  });
}

export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => apiFetch('/api/config'),
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
      apiFetch(`/api/pools/${data.pool}/backends`, {
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
      apiFetch(`/api/backends/${data.pool}/${encodeURIComponent(data.address)}`, {
        method: 'DELETE',
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['backends'] }),
  });
}
