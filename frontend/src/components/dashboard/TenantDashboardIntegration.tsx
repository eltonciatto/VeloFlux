// Integration example for the new components
// This file shows how to use UserManagement, OIDCSettings, and TenantMonitoring in a main dashboard

import React from 'react';
import { Routes, Route, Link, useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import UserManagement from '@/components/dashboard/UserManagement';
import OIDCSettings from '@/components/dashboard/OIDCSettings';
import TenantMonitoring from '@/components/dashboard/TenantMonitoring';
import { useAuth } from '@/hooks/use-auth';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useOIDCConfig } from '@/hooks/useOIDCConfig';
import { useTenantMetrics } from '@/hooks/useTenantMetrics';
import { Users, Shield, BarChart3, Settings } from 'lucide-react';

// Example of integrated tenant management page
const TenantDashboard = () => {
  const { tenantId } = useParams();

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Tenant Management</h1>
        <p className="text-muted-foreground">
          Gerencie usuários, configurações e monitoramento para o tenant {tenantId}
        </p>
      </div>

      <Tabs defaultValue="monitoring" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="monitoring" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Monitoramento
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="oidc" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            OIDC/SSO
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configurações
          </TabsTrigger>
        </TabsList>

        <TabsContent value="monitoring">
          <TenantMonitoring />
        </TabsContent>

        <TabsContent value="users">
          <UserManagement />
        </TabsContent>

        <TabsContent value="oidc">
          <OIDCSettings />
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>Configurações Gerais</CardTitle>
              <CardDescription>
                Configurações adicionais do tenant
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Outras configurações podem ser adicionadas aqui...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Example of quick access cards for the main dashboard
const TenantQuickActions = () => {
  const { tenantId } = useParams();

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Gerenciar Usuários
          </CardTitle>
          <CardDescription>
            Adicione, edite e gerencie usuários do tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={`/tenant/${tenantId}/users`}>
            <Button className="w-full">Acessar</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Configurar SSO
          </CardTitle>
          <CardDescription>
            Configure autenticação OIDC/SSO
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={`/tenant/${tenantId}/oidc`}>
            <Button className="w-full">Configurar</Button>
          </Link>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Ver Métricas
          </CardTitle>
          <CardDescription>
            Monitore performance e uso do tenant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Link to={`/tenant/${tenantId}/monitoring`}>
            <Button className="w-full">Monitorar</Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
};

// Example of how to use the hooks in a custom component
const TenantOverview = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  
  // Using the new hooks
  const { users, loading: usersLoading } = useUserManagement(tenantId, token);
  const { config: oidcConfig } = useOIDCConfig(tenantId, token);
  const { metrics } = useTenantMetrics(tenantId, token);

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Visão Geral do Tenant</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Usuários</CardTitle>
          </CardHeader>
          <CardContent>
            {usersLoading ? (
              <p>Carregando...</p>
            ) : (
              <div className="text-2xl font-bold">{users.length}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>SSO Status</CardTitle>
          </CardHeader>
          <CardContent>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              oidcConfig.enabled 
                ? 'bg-green-100 text-green-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {oidcConfig.enabled ? 'Habilitado' : 'Desabilitado'}
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Health Status</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics ? (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                metrics.health.status === 'healthy' 
                  ? 'bg-green-100 text-green-800'
                  : metrics.health.status === 'warning'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {metrics.health.status}
              </span>
            ) : (
              <p>Carregando...</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export { TenantDashboard, TenantQuickActions, TenantOverview };
