// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CreditCard, 
  BarChart3, 
  FileText, 
  Bell, 
  Settings,
  TrendingUp,
  Activity
} from 'lucide-react';

// Importar componentes existentes e novos
import ModernBillingPanel from './ModernBillingPanel';
import BillingOverviewCompatible from './BillingOverviewCompatible';
import InvoiceManagement from './InvoiceManagement';
import PaymentMethodsAndBilling from './PaymentMethodsAndBilling';
import UsageAlertsAndNotifications from './UsageAlertsAndNotifications';
import PricingTiersManagement from './PricingTiersManagement';

interface EnhancedBillingDashboardProps {
  tenantId?: string;
}

export default function EnhancedBillingDashboard({ tenantId }: EnhancedBillingDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing & Faturamento</h1>
          <p className="text-muted-foreground">
            Gerencie seus planos, faturas, pagamentos e uso de recursos
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="flex items-center">
            <Activity className="h-3 w-3 mr-1" />
            Sistema Ativo
          </Badge>
        </div>
      </div>

      {/* Navigation Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="invoices" className="flex items-center">
            <FileText className="h-4 w-4 mr-2" />
            Faturas
          </TabsTrigger>
          <TabsTrigger value="payment" className="flex items-center">
            <CreditCard className="h-4 w-4 mr-2" />
            Pagamento
          </TabsTrigger>
          <TabsTrigger value="alerts" className="flex items-center">
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
          <TabsTrigger value="plans" className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            Planos
          </TabsTrigger>
          <TabsTrigger value="legacy" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Sistema
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab - Novo sistema avançado */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2" />
                  Dashboard de Billing Avançado
                </CardTitle>
                <CardDescription>
                  Visão geral completa de uso, custos e projeções
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BillingOverviewCompatible />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Invoices Tab */}
        <TabsContent value="invoices" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Gerenciamento de Faturas
              </CardTitle>
              <CardDescription>
                Visualize, baixe e gerencie suas faturas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <InvoiceManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Tab */}
        <TabsContent value="payment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <CreditCard className="h-5 w-5 mr-2" />
                Métodos de Pagamento
              </CardTitle>
              <CardDescription>
                Configure métodos de pagamento e endereço de cobrança
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentMethodsAndBilling />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Alertas e Notificações
              </CardTitle>
              <CardDescription>
                Configure alertas de uso e gerencie notificações
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UsageAlertsAndNotifications />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plans Tab */}
        <TabsContent value="plans" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Gerenciamento de Planos
              </CardTitle>
              <CardDescription>
                Compare, selecione e gerencie seus planos de assinatura
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PricingTiersManagement />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Legacy System Tab */}
        <TabsContent value="legacy" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Sistema de Billing Existente
              </CardTitle>
              <CardDescription>
                Interface original do sistema VeloFlux (compatibilidade)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ModernBillingPanel />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer Info */}
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">🚀 Sistema de Billing Híbrido VeloFlux</p>
              <p className="text-xs text-muted-foreground">
                Integração completa entre sistema existente e funcionalidades avançadas
              </p>
            </div>
            <div className="flex items-center space-x-2 text-xs text-muted-foreground">
              <Badge variant="outline">v2.0 Enhanced</Badge>
              <Badge variant="outline">Produção</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
