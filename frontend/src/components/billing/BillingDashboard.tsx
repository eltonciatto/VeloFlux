// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  CreditCard, 
  FileText, 
  Bell, 
  Settings, 
  TrendingUp,
  AlertTriangle,
  DollarSign,
  Calendar
} from 'lucide-react';

// Import existing ModernBillingPanel as the main component
import ModernBillingPanel from './ModernBillingPanel';

// Import enhanced billing components
import BillingOverview from './BillingOverview';
import UsageAlertsAndNotifications from './UsageAlertsAndNotifications';
import InvoiceManagement from './InvoiceManagement';
import PaymentMethodsAndBilling from './PaymentMethodsAndBilling';
import PricingTiersManagement from './PricingTiersManagement';

// Import hooks
import { useBillingAccount } from '@/hooks/useBilling';

export default function BillingDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [showEnhancedView, setShowEnhancedView] = useState(false);
  
  const { 
    data: account, 
    isLoading,
    error 
  } = useBillingAccount();

  // If enhanced view is disabled, show the existing ModernBillingPanel
  if (!showEnhancedView) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Billing Dashboard</h1>
            <p className="text-gray-600">Gerencie seus planos e pagamentos</p>
          </div>
          <Button 
            onClick={() => setShowEnhancedView(true)}
            variant="outline"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Enhanced View
          </Button>
        </div>
        <ModernBillingPanel />
      </div>
    );
  }

  // Enhanced view with new components
  const getTabBadgeCount = (tab: string) => {
    switch (tab) {
      case 'alerts':
        return 0; // Would be populated from real data
      case 'notifications':
        return 0; // Would be populated from real data
      default:
        return 0;
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Faturamento</h1>
            <p className="text-muted-foreground">Gerencie seus gastos e uso de recursos</p>
          </div>
        </div>
        
        {/* Loading State */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Faturamento</h1>
          <p className="text-muted-foreground">
            Gerencie seus gastos, uso de recursos e configurações de cobrança
          </p>
        </div>
        
        {/* Quick Stats */}
        {account && estimate && (
          <div className="flex items-center space-x-4">
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-600" />
                <div>
                  <div className="text-sm font-medium">Custo Este Mês</div>
                  <div className="text-lg font-bold">
                    {estimate.currentCost.toLocaleString('pt-BR', { 
                      style: 'currency', 
                      currency: account.currency 
                    })}
                  </div>
                </div>
              </div>
            </Card>
            
            <Card className="p-3">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-blue-600" />
                <div>
                  <div className="text-sm font-medium">Próxima Cobrança</div>
                  <div className="text-sm">
                    {new Date(account.nextBillingDate).toLocaleDateString('pt-BR')}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Alert Banners */}
      {activeAlerts.length > 0 && (
        <Card className="border-red-500 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-medium text-red-900">
                  {activeAlerts.length} Alerta{activeAlerts.length > 1 ? 's' : ''} Ativo{activeAlerts.length > 1 ? 's' : ''}
                </h3>
                <p className="text-sm text-red-800 mt-1">
                  Você tem alertas de uso que requerem atenção. 
                  {activeAlerts.some(alert => alert.currentUsage / alert.limit >= 0.9) && 
                    ' Alguns recursos estão próximos do limite.'
                  }
                </p>
              </div>
              <Button 
                size="sm" 
                variant="outline"
                onClick={() => setActiveTab('alerts')}
                className="border-red-500 text-red-700 hover:bg-red-100"
              >
                Ver Alertas
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>Visão Geral</span>
          </TabsTrigger>
          
          <TabsTrigger value="alerts" className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <span>Alertas</span>
            {getTabBadgeCount('alerts') > 0 && (
              <Badge variant="destructive" className="text-xs">
                {getTabBadgeCount('alerts')}
              </Badge>
            )}
          </TabsTrigger>
          
          <TabsTrigger value="invoices" className="flex items-center space-x-2">
            <FileText className="h-4 w-4" />
            <span>Faturas</span>
          </TabsTrigger>
          
          <TabsTrigger value="payment" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Pagamento</span>
          </TabsTrigger>
          
          <TabsTrigger value="tiers" className="flex items-center space-x-2">
            <Settings className="h-4 w-4" />
            <span>Planos</span>
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents */}
        <TabsContent value="overview" className="space-y-6">
          <BillingOverview />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <UsageAlertsAndNotifications />
        </TabsContent>

        <TabsContent value="invoices" className="space-y-6">
          <InvoiceManagement />
        </TabsContent>

        <TabsContent value="payment" className="space-y-6">
          <PaymentMethodsAndBilling />
        </TabsContent>

        <TabsContent value="tiers" className="space-y-6">
          <PricingTiersManagement />
        </TabsContent>
      </Tabs>

      {/* Footer Information */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid gap-4 md:grid-cols-3 text-sm text-muted-foreground">
            <div>
              <h4 className="font-medium text-foreground mb-1">Suporte de Faturamento</h4>
              <p>Precisa de ajuda? Entre em contato conosco em billing@veloflux.io</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Ciclo de Cobrança</h4>
              <p>As faturas são geradas mensalmente e o pagamento é processado automaticamente.</p>
            </div>
            <div>
              <h4 className="font-medium text-foreground mb-1">Política de Reembolso</h4>
              <p>Oferecemos reembolso total em até 30 dias para novos clientes.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
