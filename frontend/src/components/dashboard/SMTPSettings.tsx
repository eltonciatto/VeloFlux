import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';

const SMTPSettings = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [config, setConfig] = useState({
    enabled: false,
    host: '',
    port: 587,
    username: '',
    password: '',
    from_email: '',
    from_name: 'VeloFlux',
    use_tls: true,
    app_domain: 'veloflux.io'
  });
  
  const fetchConfig = useCallback(async () => {
    try {
      setLoading(true);
      const response = await safeApiFetch(`/api/v1/tenant/${tenantId}/smtp-settings`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setConfig({
          enabled: data.enabled || false,
          host: data.host || '',
          port: data.port || 587,
          username: data.username || '',
          password: data.password ? '********' : '',
          from_email: data.from_email || '',
          from_name: data.from_name || 'VeloFlux',
          use_tls: data.use_tls !== undefined ? data.use_tls : true,
          app_domain: data.app_domain || 'veloflux.io'
        });
      }
    } catch (error) {
      console.error('Error fetching SMTP config:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar as configurações de SMTP',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  useEffect(() => {
    if (token) {
      fetchConfig();
    }
  }, [token, fetchConfig]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'number') {
      setConfig({
        ...config,
        [name]: parseInt(value, 10)
      });
    } else {
      setConfig({
        ...config,
        [name]: value
      });
    }
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setConfig({
      ...config,
      [name]: checked
    });
  };

  const saveConfig = async () => {
    try {
      setLoading(true);
      
      // Don't send password if it's masked
      const configToSend = {
        ...config,
        password: config.password === '********' ? undefined : config.password
      };
      
      const response = await safeApiFetch(`/api/v1/tenant/${tenantId}/smtp-settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(configToSend)
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Configurações de SMTP salvas com sucesso',
          variant: 'default'
        });
        fetchConfig();
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao salvar configurações');
      }
    } catch (error) {
      console.error('Error saving SMTP config:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao salvar configurações de SMTP',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const testSMTP = async () => {
    if (!testEmail) {
      toast({
        title: 'Atenção',
        description: 'Informe um email para teste',
        variant: 'default'
      });
      return;
    }
    
    try {
      setIsTesting(true);
      
      const response = await safeApiFetch(`/api/v1/tenant/${tenantId}/smtp-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          email: testEmail,
          config: {
            ...config,
            password: config.password === '********' ? undefined : config.password
          }
        })
      });

      if (response.ok) {
        toast({
          title: 'Sucesso',
          description: 'Email de teste enviado com sucesso',
          variant: 'default'
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao enviar email de teste');
      }
    } catch (error) {
      console.error('Error testing SMTP:', error);
      toast({
        title: 'Erro',
        description: error instanceof Error ? error.message : 'Erro ao testar configurações de SMTP',
        variant: 'destructive'
      });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Configurações de Email (SMTP)</CardTitle>
        <CardDescription>
          Configure o servidor SMTP para envio de emails de verificação, redefinição de senha e notificações.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="smtp-enabled"
              name="enabled"
              checked={config.enabled}
              onCheckedChange={(checked) => handleSwitchChange('enabled', checked)}
              disabled={loading}
            />
            <Label htmlFor="smtp-enabled">Habilitar envio de emails</Label>
          </div>
          
          <Separator />
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Servidor SMTP</Label>
                <Input
                  id="host"
                  name="host"
                  placeholder="smtp.example.com"
                  value={config.host}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="port">Porta</Label>
                <Input
                  id="port"
                  name="port"
                  type="number"
                  placeholder="587"
                  value={config.port}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  name="username"
                  placeholder="seu-usuario@example.com"
                  value={config.username}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="********"
                  value={config.password}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
            </div>
              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_email">Email Remetente</Label>
                <Input
                  id="from_email"
                  name="from_email"
                  placeholder="noreply@example.com"
                  value={config.from_email}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="from_name">Nome Remetente</Label>
                <Input
                  id="from_name"
                  name="from_name"
                  placeholder="VeloFlux"
                  value={config.from_name}
                  onChange={handleInputChange}
                  disabled={loading || !config.enabled}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="app_domain">Domínio da Aplicação</Label>
              <Input
                id="app_domain"
                name="app_domain"
                placeholder="veloflux.io"
                value={config.app_domain}
                onChange={handleInputChange}
                disabled={loading || !config.enabled}
              />
              <p className="text-sm text-gray-500">
                Domínio usado nos links dos emails (ex: redefinição de senha, verificação)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="use_tls"
                name="use_tls"
                checked={config.use_tls}
                onCheckedChange={(checked) => handleSwitchChange('use_tls', checked)}
                disabled={loading || !config.enabled}
              />
              <Label htmlFor="use_tls">Utilizar TLS</Label>
            </div>
          </div>
          
          <Separator />
          
          <div className="flex justify-between items-end">
            <div className="space-y-2">
              <Label htmlFor="test_email">Email para teste</Label>
              <div className="flex space-x-2">
                <Input
                  id="test_email"
                  placeholder="seu-email@example.com"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  disabled={loading || !config.enabled || isTesting}
                />
                <Button 
                  onClick={testSMTP} 
                  disabled={loading || !config.enabled || !testEmail || isTesting}
                  className="w-24"
                >
                  {isTesting ? 'Enviando...' : 'Testar'}
                </Button>
              </div>
            </div>
            <Button
              onClick={saveConfig}
              disabled={loading || !config.enabled}
              className="w-32"
            >
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>

          {config.enabled && (
            <Alert>
              <AlertTitle>Dica</AlertTitle>
              <AlertDescription>
                Configure o servidor SMTP para habilitar funcionalidades como verificação de email, redefinição de senha e notificações. Recomenda-se utilizar um serviço confiável como Amazon SES, SendGrid, Mailgun ou similar.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SMTPSettings;
