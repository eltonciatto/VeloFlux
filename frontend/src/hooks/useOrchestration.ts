import { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

// Types para orquestração
export interface OrchestrationConfig {
  tenant_id: string;
  mode: 'shared' | 'dedicated' | 'hybrid';
  dedicated_namespace?: string;
  resource_limits: {
    cpu: string;
    memory: string;
    storage: string;
    replicas: number;
  };
  auto_scaling: {
    enabled: boolean;
    min_replicas: number;
    max_replicas: number;
    target_cpu: number;
    target_memory: number;
  };
  load_balancing: {
    strategy: 'round_robin' | 'least_connections' | 'ip_hash' | 'weighted';
    health_check_interval: number;
    session_affinity: boolean;
  };
  networking: {
    domains: string[];
    ssl_enabled: boolean;
    cdn_enabled: boolean;
    custom_headers: Record<string, string>;
  };
  monitoring: {
    enabled: boolean;
    alerts_enabled: boolean;
    metrics_retention: number;
    log_level: 'debug' | 'info' | 'warn' | 'error';
  };
}

export interface OrchestrationStatus {
  status: 'running' | 'stopped' | 'pending' | 'error' | 'degraded';
  health: 'healthy' | 'unhealthy' | 'unknown';
  replicas: {
    desired: number;
    current: number;
    ready: number;
  };
  last_updated: string;
  uptime: number;
  error_count: number;
  performance: {
    cpu_usage: number;
    memory_usage: number;
    requests_per_second: number;
    response_time: number;
  };
}

export interface OrchestrationDetailedStatus {
  pods: Array<{
    name: string;
    status: string;
    ready: boolean;
    restarts: number;
    age: string;
    node: string;
    cpu_usage: number;
    memory_usage: number;
  }>;
  services: Array<{
    name: string;
    type: string;
    cluster_ip: string;
    external_ip?: string;
    ports: string[];
  }>;
  ingress: Array<{
    name: string;
    hosts: string[];
    paths: string[];
    tls: boolean;
  }>;
  events: Array<{
    type: 'Normal' | 'Warning' | 'Error';
    reason: string;
    message: string;
    timestamp: string;
  }>;
  metrics: {
    node_count: number;
    namespace_count: number;
    volume_usage: number;
    network_io: {
      in: number;
      out: number;
    };
  };
}

export interface ScalingOperation {
  replicas: number;
  reason?: string;
}

export interface DomainOperation {
  domain: string;
  action: 'add' | 'remove';
}

export const useOrchestration = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<OrchestrationConfig | null>(null);
  const [status, setStatus] = useState<OrchestrationStatus | null>(null);
  const [detailedStatus, setDetailedStatus] = useState<OrchestrationDetailedStatus | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  // Buscar configuração de orquestração
  const fetchConfig = useCallback(async () => {
    if (!tenantId || !token) return;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      } else {
        throw new Error('Falha ao carregar configuração de orquestração');
      }
    } catch (error) {
      console.error('Erro ao buscar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar a configuração de orquestração",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Buscar status da orquestração
  const fetchStatus = useCallback(async () => {
    if (!tenantId || !token) return;
    
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setLastRefresh(new Date());
      }
    } catch (error) {
      console.error('Erro ao buscar status:', error);
    }
  }, [tenantId, token]);

  // Buscar status detalhado
  const fetchDetailedStatus = useCallback(async () => {
    if (!tenantId || !token) return;
    
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/detailed_status`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDetailedStatus(data);
      }
    } catch (error) {
      console.error('Erro ao buscar status detalhado:', error);
    }
  }, [tenantId, token]);

  // Salvar configuração
  const saveConfig = useCallback(async (newConfig: Partial<OrchestrationConfig>) => {
    if (!tenantId || !token || !config) return false;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ...config, ...newConfig }),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        toast({
          title: "Sucesso",
          description: "Configuração de orquestração salva com sucesso",
        });
        return true;
      } else {
        throw new Error('Falha ao salvar configuração');
      }
    } catch (error) {
      console.error('Erro ao salvar configuração:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar a configuração",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, config, toast]);

  // Fazer scaling das réplicas
  const scaleReplicas = useCallback(async (operation: ScalingOperation) => {
    if (!tenantId || !token) return false;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/scale`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation),
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: `Scaling aplicado: ${operation.replicas} réplicas`,
        });
        // Refresh status após scaling
        await fetchStatus();
        return true;
      } else {
        throw new Error('Falha ao aplicar scaling');
      }
    } catch (error) {
      console.error('Erro no scaling:', error);
      toast({
        title: "Erro",
        description: "Não foi possível aplicar o scaling",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast, fetchStatus]);

  // Gerenciar domínios
  const manageDomain = useCallback(async (operation: DomainOperation) => {
    if (!tenantId || !token || !config) return false;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/domains`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(operation),
      });

      if (response.ok) {
        const updatedConfig = await response.json();
        setConfig(updatedConfig);
        toast({
          title: "Sucesso",
          description: `Domínio ${operation.action === 'add' ? 'adicionado' : 'removido'} com sucesso`,
        });
        return true;
      } else {
        throw new Error('Falha ao gerenciar domínio');
      }
    } catch (error) {
      console.error('Erro ao gerenciar domínio:', error);
      toast({
        title: "Erro",
        description: "Não foi possível gerenciar o domínio",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, config, toast]);

  // Restart da orquestração
  const restartOrchestration = useCallback(async () => {
    if (!tenantId || !token) return false;
    
    setLoading(true);
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/restart`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Orquestração reiniciada com sucesso",
        });
        // Refresh status após restart
        setTimeout(() => fetchStatus(), 2000);
        return true;
      } else {
        throw new Error('Falha ao reiniciar orquestração');
      }
    } catch (error) {
      console.error('Erro ao reiniciar:', error);
      toast({
        title: "Erro",
        description: "Não foi possível reiniciar a orquestração",
        variant: "destructive",
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast, fetchStatus]);

  // Metrics em tempo real
  const fetchMetrics = useCallback(async (timeRange: '1h' | '6h' | '24h' | '7d' = '1h') => {
    if (!tenantId || !token) return null;
    
    try {
      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/metrics?range=${timeRange}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        return await response.json();
      }
      return null;
    } catch (error) {
      console.error('Erro ao buscar métricas:', error);
      return null;
    }
  }, [tenantId, token]);

  // Auto-refresh para status
  useEffect(() => {
    if (tenantId && token) {
      fetchConfig();
      fetchStatus();
      
      // Auto-refresh status a cada 30 segundos
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [tenantId, token, fetchConfig, fetchStatus]);

  // Utility functions
  const getStatusColor = (status?: string) => {
    const colors = {
      running: 'bg-green-500',
      stopped: 'bg-red-500',
      pending: 'bg-yellow-500',
      error: 'bg-red-600',
      degraded: 'bg-orange-500',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-500';
  };

  const getHealthColor = (health?: string) => {
    const colors = {
      healthy: 'text-green-600',
      unhealthy: 'text-red-600',
      unknown: 'text-gray-600',
    };
    return colors[health as keyof typeof colors] || 'text-gray-600';
  };

  const formatUptime = (seconds?: number) => {
    if (!seconds) return 'N/A';
    
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  return {
    // State
    loading,
    config,
    status,
    detailedStatus,
    lastRefresh,
    
    // Actions
    fetchConfig,
    fetchStatus,
    fetchDetailedStatus,
    saveConfig,
    scaleReplicas,
    manageDomain,
    restartOrchestration,
    fetchMetrics,
    
    // Utilities
    getStatusColor,
    getHealthColor,
    formatUptime,
    
    // Computed values
    isHealthy: status?.health === 'healthy',
    isRunning: status?.status === 'running',
    canScale: config?.auto_scaling?.enabled,
    replicasCount: status?.replicas?.current || 0,
  };
};

export default useOrchestration;
