import { useState, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { useToast } from '@/hooks/use-toast';

export interface OIDCConfig {
  enabled: boolean;
  provider_name: string;
  provider_url: string;
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scopes: string;
  groups_claim: string;
  tenant_id_claim: string;
  auto_provision_users?: boolean;
  default_role?: 'admin' | 'user' | 'viewer';
  require_groups?: string[];
}

export interface OIDCTestResult {
  success: boolean;
  message: string;
  details?: {
    provider_accessible: boolean;
    configuration_valid: boolean;
    client_credentials_valid: boolean;
    test_login_url?: string;
  };
}

export function useOIDCConfig(tenantId: string, token: string) {
  const [config, setConfig] = useState<OIDCConfig>({
    enabled: false,
    provider_name: '',
    provider_url: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    scopes: 'openid profile email',
    groups_claim: 'groups',
    tenant_id_claim: 'tenant_id',
    auto_provision_users: true,
    default_role: 'user',
    require_groups: []
  });
  
  const [loading, setLoading] = useState(false);
  const [testLoading, setTestLoading] = useState(false);
  const { toast } = useToast();

  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/config`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConfig(response);
      return response;
    } catch (error) {
      console.error('Error fetching OIDC config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar configuração OIDC',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  const saveConfig = useCallback(async (configData: Partial<OIDCConfig>) => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(configData)
      });

      toast({
        title: 'Sucesso',
        description: 'Configuração OIDC salva com sucesso',
        variant: 'default'
      });

      // Update local state
      setConfig(prev => ({ ...prev, ...configData }));
      return response;
    } catch (error) {
      console.error('Error saving OIDC config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao salvar configuração OIDC',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  const testConnection = useCallback(async (): Promise<OIDCTestResult> => {
    setTestLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (response.success) {
        toast({
          title: 'Sucesso',
          description: 'Conexão OIDC testada com sucesso',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Falha no Teste',
          description: response.message || 'Falha ao testar conexão OIDC',
          variant: 'destructive'
        });
      }

      return response;
    } catch (error) {
      console.error('Error testing OIDC connection:', error);
      const result: OIDCTestResult = {
        success: false,
        message: 'Erro ao testar conexão OIDC'
      };
      
      toast({
        title: 'Erro',
        description: result.message,
        variant: 'destructive'
      });
      
      return result;
    } finally {
      setTestLoading(false);
    }
  }, [tenantId, token, toast]);

  const generateLoginURL = useCallback((returnUrl?: string) => {
    const baseUrl = window.location.origin;
    const loginUrl = `${baseUrl}/auth/oidc/login/${tenantId}`;
    
    if (returnUrl) {
      return `${loginUrl}?return_url=${encodeURIComponent(returnUrl)}`;
    }
    
    return loginUrl;
  }, [tenantId]);

  const revokeConfig = useCallback(async () => {
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/oidc/config`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Configuração OIDC removida com sucesso',
        variant: 'default'
      });

      // Reset local state
      setConfig({
        enabled: false,
        provider_name: '',
        provider_url: '',
        client_id: '',
        client_secret: '',
        redirect_uri: '',
        scopes: 'openid profile email',
        groups_claim: 'groups',
        tenant_id_claim: 'tenant_id',
        auto_provision_users: true,
        default_role: 'user',
        require_groups: []
      });
    } catch (error) {
      console.error('Error revoking OIDC config:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover configuração OIDC',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const getProviderMetadata = useCallback(async (providerUrl: string) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/metadata`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ provider_url: providerUrl })
      });

      return response;
    } catch (error) {
      console.error('Error fetching provider metadata:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao buscar metadados do provedor',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const refreshTokens = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/refresh`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Tokens renovados com sucesso',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error refreshing tokens:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao renovar tokens',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const updateConfig = useCallback((updates: Partial<OIDCConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  return {
    config,
    loading,
    testLoading,
    fetchConfig,
    saveConfig,
    testConnection,
    generateLoginURL,
    revokeConfig,
    getProviderMetadata,
    refreshTokens,
    updateConfig
  };
}
