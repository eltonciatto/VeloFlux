import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';

const OIDCSettings = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    enabled: false,
    provider_name: '',
    provider_url: '',
    client_id: '',
    client_secret: '',
    redirect_uri: '',
    scopes: 'openid profile email',
    groups_claim: 'groups',
    tenant_id_claim: 'tenant_id'
  });
  
  const [isEditingSecret, setIsEditingSecret] = useState(false);
  const [testLoginURL, setTestLoginURL] = useState('');
  
  const fetchOIDCConfig = async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/oidc/config`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConfig(response);
      
      // Generate test login URL if enabled
      if (response.enabled) {
        const testURL = `/auth/oidc/login/${tenantId}?return_url=${encodeURIComponent('/dashboard')}`;
        setTestLoginURL(testURL);
      }
    } catch (error) {
      console.error('Error fetching OIDC config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load OIDC configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const saveOIDCConfig = async () => {
    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/oidc/config`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });
      
      toast({
        title: 'Success',
        description: 'OIDC configuration saved successfully',
        variant: 'default'
      });
      
      // Refresh config
      fetchOIDCConfig();
      
      // Reset edit state
      setIsEditingSecret(false);
    } catch (error) {
      console.error('Error saving OIDC config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save OIDC configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInputChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  const handleProviderTemplateChange = (provider) => {
    let providerURL = '';
    let groupsClaim = 'groups';
    
    switch (provider) {
      case 'keycloak':
        providerURL = 'https://keycloak.example.com/realms/your-realm';
        groupsClaim = 'roles';
        break;
      case 'auth0':
        providerURL = 'https://your-tenant.auth0.com';
        groupsClaim = 'https://yourapp.com/roles';
        break;
      case 'okta':
        providerURL = 'https://your-org.okta.com';
        groupsClaim = 'groups';
        break;
      case 'azure':
        providerURL = 'https://login.microsoftonline.com/{tenant-id}/v2.0';
        groupsClaim = 'groups';
        break;
      case 'google':
        providerURL = 'https://accounts.google.com';
        groupsClaim = '';
        break;
      default:
        break;
    }
    
    setConfig(prev => ({
      ...prev,
      provider_name: provider,
      provider_url: providerURL,
      groups_claim: groupsClaim
    }));
  };
  
  useEffect(() => {
    if (tenantId && token) {
      fetchOIDCConfig();
    }
  }, [tenantId, token]);
  
  // Generate a suggested redirect URI
  useEffect(() => {
    const origin = window.location.origin;
    const redirectURI = `${origin}/auth/oidc/callback`;
    
    setConfig(prev => ({
      ...prev,
      redirect_uri: prev.redirect_uri || redirectURI
    }));
  }, []);
  
  return (
    <div className="container py-6">
      <h1 className="text-2xl font-bold mb-6">External Authentication (OIDC)</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>OpenID Connect Integration</CardTitle>
          <CardDescription>
            Connect your identity provider to enable single sign-on for your users
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-4">Loading OIDC configuration...</div>
          ) : (
            <>
              <div className="mb-6 flex items-center space-x-2">
                <Switch
                  id="oidc-enabled"
                  checked={config.enabled}
                  onCheckedChange={(checked) => handleInputChange('enabled', checked)}
                />
                <Label htmlFor="oidc-enabled">Enable OIDC Authentication</Label>
              </div>
              
              {!config.enabled ? (
                <Alert>
                  <AlertTitle>OIDC is currently disabled</AlertTitle>
                  <AlertDescription>
                    Enable OIDC to connect your identity provider and use single sign-on.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="provider-name">Identity Provider</Label>
                      <select
                        id="provider-name"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        value={config.provider_name}
                        onChange={(e) => handleProviderTemplateChange(e.target.value)}
                      >
                        <option value="">Select a provider</option>
                        <option value="keycloak">Keycloak</option>
                        <option value="auth0">Auth0</option>
                        <option value="okta">Okta</option>
                        <option value="azure">Azure AD</option>
                        <option value="google">Google</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                    
                    <div>
                      <Label htmlFor="provider-url">Provider URL (Issuer)</Label>
                      <Input
                        id="provider-url"
                        value={config.provider_url}
                        onChange={(e) => handleInputChange('provider_url', e.target.value)}
                        placeholder="https://youridp.example.com"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="client-id">Client ID</Label>
                      <Input
                        id="client-id"
                        value={config.client_id}
                        onChange={(e) => handleInputChange('client_id', e.target.value)}
                        placeholder="Your client ID"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="client-secret">Client Secret</Label>
                      <div className="relative">
                        <Input
                          id="client-secret"
                          type={isEditingSecret ? "text" : "password"}
                          value={isEditingSecret ? config.client_secret : "••••••••••••••••"}
                          onChange={(e) => handleInputChange('client_secret', e.target.value)}
                          placeholder={isEditingSecret ? "Your client secret" : ""}
                          disabled={!isEditingSecret}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full"
                          onClick={() => setIsEditingSecret(!isEditingSecret)}
                        >
                          {isEditingSecret ? "Hide" : "Edit"}
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <Label htmlFor="redirect-uri">Redirect URI</Label>
                    <Input
                      id="redirect-uri"
                      value={config.redirect_uri}
                      onChange={(e) => handleInputChange('redirect_uri', e.target.value)}
                      placeholder="https://yourdomain.com/auth/oidc/callback"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Configure this URI in your identity provider's allowed callback URLs.
                    </p>
                  </div>
                  
                  <div>
                    <Label htmlFor="scopes">Scopes</Label>
                    <Input
                      id="scopes"
                      value={config.scopes}
                      onChange={(e) => handleInputChange('scopes', e.target.value)}
                      placeholder="openid profile email"
                    />
                    <p className="text-sm text-gray-500 mt-1">
                      Space-separated list of scopes to request from the identity provider.
                    </p>
                  </div>
                  
                  <Separator />
                  
                  <h3 className="text-lg font-medium">Advanced Settings</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="groups-claim">Groups/Roles Claim</Label>
                      <Input
                        id="groups-claim"
                        value={config.groups_claim}
                        onChange={(e) => handleInputChange('groups_claim', e.target.value)}
                        placeholder="groups"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        The claim in the token that contains user groups or roles.
                      </p>
                    </div>
                    
                    <div>
                      <Label htmlFor="tenant-id-claim">Tenant ID Claim (Optional)</Label>
                      <Input
                        id="tenant-id-claim"
                        value={config.tenant_id_claim}
                        onChange={(e) => handleInputChange('tenant_id_claim', e.target.value)}
                        placeholder="tenant_id"
                      />
                      <p className="text-sm text-gray-500 mt-1">
                        The claim in the token that contains the tenant ID.
                      </p>
                    </div>
                  </div>
                  
                  {testLoginURL && (
                    <div className="mt-6 p-4 bg-gray-50 rounded-md">
                      <h4 className="font-medium mb-2">Test your configuration</h4>
                      <p className="text-sm mb-3">
                        After saving, you can test your OIDC configuration by clicking the button below:
                      </p>
                      <Button
                        as="a"
                        href={testLoginURL}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Test OIDC Login
                      </Button>
                    </div>
                  )}
                </div>
              )}
              
              <div className="mt-6 flex justify-end">
                <Button onClick={saveOIDCConfig} disabled={loading}>
                  {loading ? 'Saving...' : 'Save Configuration'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OIDCSettings;
