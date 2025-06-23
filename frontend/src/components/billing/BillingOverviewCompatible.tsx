// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';
import { useParams } from 'react-router-dom';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CreditCard, 
  Download,
  Eye,
  FileText,
  DollarSign,
  Users,
  Activity,
  Clock
} from 'lucide-react';

// Funções de formatação compatíveis com o sistema existente
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'BRL' ? 'BRL' : 'USD',
  }).format(amount / 100); // Converter de centavos
};

const formatUsage = (value: number, unit: string = '') => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${unit}`;
  }
  return `${value}${unit}`;
};

interface UsageCardProps {
  title: string;
  current: number;
  limit: number;
  unit: string;
  trend?: number;
  formatter?: (value: number) => string;
}

function UsageCard({ title, current, limit, unit, trend, formatter = (v) => v.toString() }: UsageCardProps) {
  const percentage = (current / limit) * 100;
  const isNearLimit = percentage >= 80;
  const isOverLimit = percentage >= 100;

  return (
    <Card className={`${isOverLimit ? 'border-red-500' : isNearLimit ? 'border-yellow-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend !== undefined && (
          <Badge variant={trend >= 0 ? 'destructive' : 'secondary'} className="text-xs">
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {formatter(current)} <span className="text-sm font-normal text-muted-foreground">/ {formatter(limit)} {unit}</span>
        </div>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`w-full mt-2 ${isOverLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : ''}`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {percentage.toFixed(1)}% usado
          {isOverLimit && <span className="text-red-500 font-medium ml-1">(Limite excedido)</span>}
        </p>
      </CardContent>
    </Card>
  );
}

interface CostSummaryCardProps {
  title: string;
  amount: number;
  currency: string;
  description?: string;
  trend?: number;
  variant?: 'default' | 'primary' | 'warning' | 'destructive';
}

function CostSummaryCard({ title, amount, currency, description, trend, variant = 'default' }: CostSummaryCardProps) {
  const cardClass = {
    default: '',
    primary: 'border-blue-500 bg-blue-50',
    warning: 'border-yellow-500 bg-yellow-50',
    destructive: 'border-red-500 bg-red-50',
  }[variant];

  return (
    <Card className={cardClass}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {trend !== undefined && (
          <Badge variant={trend >= 0 ? 'destructive' : 'secondary'} className="text-xs">
            {trend >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold flex items-center">
          <DollarSign className="h-5 w-5 mr-1" />
          {formatCurrency(amount, currency)}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

interface InvoiceCardProps {
  invoice: {
    id: string;
    amount_due: number;
    currency: string;
    status: string;
    created_at: string;
    period_start: string;
    period_end: string;
  };
}

function InvoiceCard({ invoice }: InvoiceCardProps) {
  const { toast } = useToast();
  const isDue = invoice.status === 'open';
  const isPaid = invoice.status === 'paid';

  const statusColors = {
    open: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  const downloadInvoice = async () => {
    try {
      toast({
        title: 'Download iniciado',
        description: 'A fatura será baixada em breve.',
      });
      // TODO: Implementar download de PDF quando disponível na API
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível baixar a fatura.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className={`${isDue ? 'border-yellow-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Fatura #{invoice.id.slice(-8)}</CardTitle>
          <CardDescription className="text-xs">
            {new Date(invoice.period_start).toLocaleDateString('pt-BR')} - {new Date(invoice.period_end).toLocaleDateString('pt-BR')}
          </CardDescription>
        </div>
        <Badge className={statusColors[invoice.status as keyof typeof statusColors] || statusColors.draft}>
          {invoice.status === 'paid' ? 'Paga' : invoice.status === 'open' ? 'Pendente' : invoice.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">
          {formatCurrency(invoice.amount_due, invoice.currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Criada em: {new Date(invoice.created_at).toLocaleDateString('pt-BR')}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadInvoice}
          className="w-full"
        >
          <Download className="h-3 w-3 mr-1" />
          Baixar PDF
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function BillingOverviewCompatible() {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [subscriptions, setSubscriptions] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [usageData, setUsageData] = useState(null);
  const [billingInfo, setBillingInfo] = useState(null);

  const loadBillingData = useCallback(async () => {
    if (!tenantId || !token) return;
    
    setLoading(true);
    try {
      // Carregar dados de billing usando as APIs existentes
      const [subscriptionsData, invoicesData, usageDataResponse] = await Promise.all([
        safeApiFetch('/api/billing/subscriptions', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ items: [] })),
        safeApiFetch('/api/billing/invoices', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ items: [] })),
        safeApiFetch(`/tenants/${tenantId}/billing/usage`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => null),
      ]);

      setSubscriptions(subscriptionsData.items || []);
      setInvoices(invoicesData.items || []);
      setUsageData(usageDataResponse);
      
      // Se temos uma assinatura, usar dados dela
      if (subscriptionsData.items && subscriptionsData.items.length > 0) {
        setBillingInfo(subscriptionsData.items[0]);
      }
    } catch (error) {
      console.error('Error loading billing data:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados de faturamento.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  useEffect(() => {
    loadBillingData();
  }, [loadBillingData]);

  const generateReport = async () => {
    try {
      toast({
        title: 'Relatório gerado',
        description: 'O relatório de uso está sendo preparado.',
      });
      // TODO: Implementar geração de relatório quando disponível na API
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
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

  // Dados mock baseados no que seria real do sistema
  const currentSubscription = subscriptions[0];
  const mockAccount = {
    currency: 'USD',
    credits: 0,
    currentTier: {
      name: currentSubscription?.plan || 'Free',
      price: currentSubscription?.plan === 'pro' ? 2999 : currentSubscription?.plan === 'enterprise' ? 9999 : 0,
      description: 'Plano atual baseado na sua assinatura',
      limits: {
        requests: currentSubscription?.plan === 'pro' ? 100000 : currentSubscription?.plan === 'enterprise' ? 1000000 : 10000,
        dataTransferGB: currentSubscription?.plan === 'pro' ? 500 : currentSubscription?.plan === 'enterprise' ? 2000 : 50,
        aiPredictions: currentSubscription?.plan === 'pro' ? 10000 : currentSubscription?.plan === 'enterprise' ? 100000 : 1000,
        storageGB: currentSubscription?.plan === 'pro' ? 100 : currentSubscription?.plan === 'enterprise' ? 500 : 10,
      }
    }
  };

  const mockUsage = {
    requestCount: usageData?.usage?.requests?.total || 0,
    dataTransferMB: (usageData?.usage?.bandwidth?.total || 0) / 1024,
    aiPredictions: usageData?.ai_predictions || 0,
    storageMB: usageData?.storage || 0,
  };

  const mockEstimate = {
    currentCost: Math.floor(mockUsage.requestCount * 0.001 + mockUsage.dataTransferMB * 0.1),
    estimatedCost: Math.floor((mockUsage.requestCount * 0.001 + mockUsage.dataTransferMB * 0.1) * 1.3),
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CostSummaryCard
          title="Custo Atual"
          amount={mockEstimate.currentCost * 100} // Converter para centavos
          currency={mockAccount.currency}
          description="Este período"
          variant="primary"
        />
        <CostSummaryCard
          title="Custo Estimado"
          amount={mockEstimate.estimatedCost * 100}
          currency={mockAccount.currency}
          description="Fim do período"
          variant={mockEstimate.estimatedCost > mockEstimate.currentCost * 1.2 ? 'warning' : 'default'}
        />
        <CostSummaryCard
          title="Créditos"
          amount={mockAccount.credits}
          currency={mockAccount.currency}
          description="Disponível"
          variant="default"
        />
        <CostSummaryCard
          title="Próxima Fatura"
          amount={mockAccount.currentTier.price}
          currency={mockAccount.currency}
          description="Estimativa mensal"
          variant="default"
        />
      </div>

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UsageCard
          title="Requisições"
          current={mockUsage.requestCount}
          limit={mockAccount.currentTier.limits.requests}
          unit="req"
          formatter={(v) => v.toLocaleString()}
        />
        <UsageCard
          title="Transferência de Dados"
          current={mockUsage.dataTransferMB / 1024}
          limit={mockAccount.currentTier.limits.dataTransferGB}
          unit="GB"
          formatter={(v) => v.toFixed(2)}
        />
        <UsageCard
          title="Predições AI"
          current={mockUsage.aiPredictions}
          limit={mockAccount.currentTier.limits.aiPredictions}
          unit="pred"
          formatter={(v) => v.toLocaleString()}
        />
        <UsageCard
          title="Armazenamento"
          current={mockUsage.storageMB / 1024}
          limit={mockAccount.currentTier.limits.storageGB}
          unit="GB"
          formatter={(v) => v.toFixed(2)}
        />
      </div>

      {/* Recent Invoices */}
      {invoices.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Faturas Recentes</h3>
            <Badge variant="secondary">{invoices.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {invoices.slice(0, 3).map((invoice) => (
              <InvoiceCard key={invoice.id} invoice={invoice} />
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Ações Rápidas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button 
              variant="outline" 
              onClick={generateReport}
              className="flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              Relatório Mensal
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center justify-center"
            >
              <Eye className="h-4 w-4 mr-2" />
              Ver Dashboard
            </Button>
            <Button 
              variant="outline" 
              onClick={() => window.location.href = '/dashboard'}
              className="flex items-center justify-center"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Alterar Plano
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Subscription Information */}
      {currentSubscription && (
        <Card>
          <CardHeader>
            <CardTitle>Assinatura Atual</CardTitle>
            <CardDescription>
              {mockAccount.currentTier.name} - {formatCurrency(mockAccount.currentTier.price, mockAccount.currency)}/mês
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Status:</span>
                <Badge variant={currentSubscription.status === 'active' ? 'default' : 'secondary'}>
                  {currentSubscription.status === 'active' ? 'Ativa' : currentSubscription.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span>Período atual:</span>
                <span>
                  {new Date(currentSubscription.current_period_start).toLocaleDateString('pt-BR')} - {' '}
                  {new Date(currentSubscription.current_period_end).toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Requisições:</span>
                <span>{mockAccount.currentTier.limits.requests.toLocaleString()}/mês</span>
              </div>
              <div className="flex justify-between">
                <span>Transferência:</span>
                <span>{mockAccount.currentTier.limits.dataTransferGB}GB/mês</span>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button variant="outline" className="w-full" onClick={() => window.location.href = '/dashboard'}>
              Gerenciar Assinatura
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
