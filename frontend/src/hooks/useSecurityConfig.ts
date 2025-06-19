import { useState, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { useToast } from '@/hooks/use-toast';

export interface WAFConfig {
  enabled: boolean;
  mode: 'monitor' | 'block';
  rules: {
    sql_injection: boolean;
    xss_protection: boolean;
    csrf_protection: boolean;
    rate_limiting: boolean;
    geo_blocking: boolean;
    custom_rules: WAFRule[];
  };
  whitelist_ips: string[];
  blacklist_ips: string[];
  custom_headers: Record<string, string>;
}

export interface WAFRule {
  id: string;
  name: string;
  pattern: string;
  action: 'allow' | 'block' | 'monitor';
  enabled: boolean;
  priority: number;
}

export interface RateLimitConfig {
  enabled: boolean;
  global_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_limit: number;
  };
  per_ip_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_limit: number;
  };
  per_user_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
    burst_limit: number;
  };
  whitelist_ips: string[];
  blacklist_ips: string[];
  custom_limits: Array<{
    path: string;
    method: string;
    limit: number;
    window: string;
  }>;
}

export interface IPRule {
  id: string;
  ip_address: string;
  type: 'whitelist' | 'blacklist';
  description: string;
  expires_at?: string;
  created_at: string;
  enabled: boolean;
}

export interface SecurityEvent {
  id: string;
  timestamp: string;
  type: 'blocked_request' | 'rate_limit_hit' | 'waf_trigger' | 'auth_failure' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source_ip: string;
  user_agent?: string;
  path?: string;
  details: Record<string, unknown>;
  action_taken: string;
}

export interface SecurityMetrics {
  blocked_requests_24h: number;
  waf_triggers_24h: number;
  rate_limit_hits_24h: number;
  failed_auth_attempts_24h: number;
  top_blocked_ips: Array<{
    ip: string;
    count: number;
    last_seen: string;
  }>;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  security_score: number;
}

export function useSecurityConfig(tenantId: string, token: string) {
  const [wafConfig, setWafConfig] = useState<WAFConfig | null>(null);
  const [rateLimitConfig, setRateLimitConfig] = useState<RateLimitConfig | null>(null);
  const [ipRules, setIpRules] = useState<IPRule[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [securityMetrics, setSecurityMetrics] = useState<SecurityMetrics | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Fetch WAF configuration
  const fetchWAFConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/waf/config`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWafConfig(response);
      return response;
    } catch (error) {
      console.error('Error fetching WAF config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configuração WAF',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Save WAF configuration
  const saveWAFConfig = useCallback(async (configData: Partial<WAFConfig>) => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/waf/config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      toast({
        title: 'Sucesso',
        description: 'Configuração WAF salva com sucesso',
        variant: 'default'
      });

      setWafConfig(prev => ({ ...prev, ...configData } as WAFConfig));
      return response;
    } catch (error) {
      console.error('Error saving WAF config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração WAF',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Fetch rate limit configuration
  const fetchRateLimitConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/rate-limit`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setRateLimitConfig(response);
      return response;
    } catch (error) {
      console.error('Error fetching rate limit config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configuração de rate limit',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Save rate limit configuration
  const saveRateLimitConfig = useCallback(async (configData: Partial<RateLimitConfig>) => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/rate-limit`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      toast({
        title: 'Sucesso',
        description: 'Configuração de rate limit salva com sucesso',
        variant: 'default'
      });

      setRateLimitConfig(prev => ({ ...prev, ...configData } as RateLimitConfig));
      return response;
    } catch (error) {
      console.error('Error saving rate limit config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração de rate limit',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Fetch IP rules
  const fetchIPRules = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/security/ip-rules`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIpRules(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching IP rules:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar regras de IP',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Add IP rule
  const addIPRule = useCallback(async (ruleData: Omit<IPRule, 'id' | 'created_at'>) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/security/ip-rules`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
      });

      toast({
        title: 'Sucesso',
        description: 'Regra de IP adicionada com sucesso',
        variant: 'default'
      });

      await fetchIPRules(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error adding IP rule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar regra de IP',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchIPRules]);

  // Update IP rule
  const updateIPRule = useCallback(async (ruleId: string, ruleData: Partial<IPRule>) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/security/ip-rules/${ruleId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(ruleData)
      });

      toast({
        title: 'Sucesso',
        description: 'Regra de IP atualizada com sucesso',
        variant: 'default'
      });

      await fetchIPRules(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error updating IP rule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar regra de IP',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchIPRules]);

  // Delete IP rule
  const deleteIPRule = useCallback(async (ruleId: string) => {
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/security/ip-rules/${ruleId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Regra de IP removida com sucesso',
        variant: 'default'
      });

      await fetchIPRules(); // Refresh the list
    } catch (error) {
      console.error('Error deleting IP rule:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover regra de IP',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchIPRules]);

  // Fetch security events
  const fetchSecurityEvents = useCallback(async (filters?: { 
    type?: string; 
    severity?: string; 
    limit?: number; 
    offset?: number 
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.type) queryParams.append('type', filters.type);
      if (filters?.severity) queryParams.append('severity', filters.severity);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const response = await safeApiFetch(`/api/tenants/${tenantId}/security/events?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSecurityEvents(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching security events:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar eventos de segurança',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Fetch security metrics
  const fetchSecurityMetrics = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/security/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSecurityMetrics(response);
      return response;
    } catch (error) {
      console.error('Error fetching security metrics:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar métricas de segurança',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Test WAF configuration
  const testWAFConfig = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/waf/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Teste WAF',
        description: response.success ? 'Configuração WAF funcionando corretamente' : `Erro: ${response.message}`,
        variant: response.success ? 'default' : 'destructive'
      });

      return response;
    } catch (error) {
      console.error('Error testing WAF config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao testar configuração WAF',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Refresh all security data
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        fetchWAFConfig(),
        fetchRateLimitConfig(),
        fetchIPRules(),
        fetchSecurityEvents({ limit: 50 }),
        fetchSecurityMetrics()
      ]);
    } catch (error) {
      console.error('Error refreshing security data:', error);
    }
  }, [fetchWAFConfig, fetchRateLimitConfig, fetchIPRules, fetchSecurityEvents, fetchSecurityMetrics]);

  return {
    // Data
    wafConfig,
    rateLimitConfig,
    ipRules,
    securityEvents,
    securityMetrics,
    
    // States
    loading,
    
    // WAF Functions
    fetchWAFConfig,
    saveWAFConfig,
    testWAFConfig,
    
    // Rate Limit Functions
    fetchRateLimitConfig,
    saveRateLimitConfig,
    
    // IP Rules Functions
    fetchIPRules,
    addIPRule,
    updateIPRule,
    deleteIPRule,
    
    // Security Events Functions
    fetchSecurityEvents,
    fetchSecurityMetrics,
    
    // Utility Functions
    refreshAll
  };
}
