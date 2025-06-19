// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  CreditCard, 
  Download,
  Eye,
  FileText,
  DollarSign
} from 'lucide-react';

// Usar as funções de formatação simples
const formatCurrency = (amount: number, currency: string = 'USD') => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency === 'BRL' ? 'BRL' : 'USD',
  }).format(amount);
};

const formatUsage = (value: number, unit: string = '') => {
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M${unit}`;
  } else if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K${unit}`;
  }
  return `${value}${unit}`;
};

import { useBillingDashboard, useDownloadInvoice, useGenerateUsageReport } from '@/hooks/useBilling';

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

interface AlertCardProps {
  alert: {
    id: string;
    type: string;
    limit: number;
    currentUsage: number;
    triggered: boolean;
    message: string;
  };
}

function AlertCard({ alert }: AlertCardProps) {
  const percentage = (alert.currentUsage / alert.limit) * 100;
  const isCritical = percentage >= 90;

  return (
    <Card className={`${isCritical ? 'border-red-500' : 'border-yellow-500'}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center">
          <AlertTriangle className={`h-4 w-4 mr-2 ${isCritical ? 'text-red-500' : 'text-yellow-500'}`} />
          <CardTitle className="text-sm font-medium capitalize">{alert.type} Alert</CardTitle>
        </div>
        <Badge variant={isCritical ? 'destructive' : 'secondary'}>
          {percentage.toFixed(1)}%
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{alert.message}</p>
        <Progress 
          value={Math.min(percentage, 100)} 
          className={`w-full mt-2 ${isCritical ? 'bg-red-100' : 'bg-yellow-100'}`}
        />
        <p className="text-xs text-muted-foreground mt-1">
          {formatUsage(alert.currentUsage, alert.type)} / {formatUsage(alert.limit, alert.type)}
        </p>
      </CardContent>
    </Card>
  );
}

interface InvoiceCardProps {
  invoice: {
    id: string;
    number: string;
    dueDate: string;
    amount: number;
    currency: string;
    status: string;
    period: {
      start: string;
      end: string;
    };
  };
}

function InvoiceCard({ invoice }: InvoiceCardProps) {
  const downloadInvoice = useDownloadInvoice();
  const isDue = new Date(invoice.dueDate) <= new Date();
  const isPaid = invoice.status === 'paid';

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-800',
    paid: 'bg-green-100 text-green-800',
    overdue: 'bg-red-100 text-red-800',
    draft: 'bg-gray-100 text-gray-800',
  };

  return (
    <Card className={`${isDue && !isPaid ? 'border-red-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-sm font-medium">Fatura #{invoice.number}</CardTitle>
          <CardDescription className="text-xs">
            {new Date(invoice.period.start).toLocaleDateString()} - {new Date(invoice.period.end).toLocaleDateString()}
          </CardDescription>
        </div>
        <Badge className={statusColors[invoice.status as keyof typeof statusColors]}>
          {invoice.status}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="text-xl font-bold">
          {formatCurrency(invoice.amount, invoice.currency)}
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          Vencimento: {new Date(invoice.dueDate).toLocaleDateString()}
          {isDue && !isPaid && <span className="text-red-500 font-medium ml-1">(Vencida)</span>}
        </p>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="outline" 
          size="sm"
          onClick={() => downloadInvoice.mutate(invoice.id)}
          disabled={downloadInvoice.isPending}
          className="w-full"
        >
          <Download className="h-3 w-3 mr-1" />
          {downloadInvoice.isPending ? 'Baixando...' : 'Baixar PDF'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default function BillingOverview() {
  const { 
    account, 
    usage, 
    estimate, 
    projections, 
    activeAlerts, 
    isLoading 
  } = useBillingDashboard();
  
  const generateReport = useGenerateUsageReport();

  if (isLoading) {
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

  if (!account || !usage || !estimate) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-muted-foreground">
            Não foi possível carregar os dados de faturamento.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CostSummaryCard
          title="Custo Atual"
          amount={estimate.currentCost}
          currency={account.currency}
          description="Este período"
          variant="primary"
        />
        <CostSummaryCard
          title="Custo Estimado"
          amount={estimate.estimatedCost}
          currency={account.currency}
          description="Fim do período"
          variant={estimate.estimatedCost > estimate.currentCost * 1.2 ? 'warning' : 'default'}
        />
        <CostSummaryCard
          title="Créditos"
          amount={account.credits}
          currency={account.currency}
          description="Disponível"
          variant="default"
        />
        {projections && (
          <CostSummaryCard
            title="Projeção Mensal"
            amount={projections.monthlyProjection}
            currency={account.currency}
            description="Baseado no uso atual"
            variant={projections.monthlyProjection > account.currentTier.price * 1.5 ? 'destructive' : 'default'}
          />
        )}
      </div>

      {/* Usage Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <UsageCard
          title="Requisições"
          current={usage.requestCount}
          limit={account.currentTier.limits.requests}
          unit="req"
          formatter={(v) => v.toLocaleString()}
        />
        <UsageCard
          title="Transferência de Dados"
          current={usage.dataTransferMB / 1024}
          limit={account.currentTier.limits.dataTransferGB}
          unit="GB"
          formatter={(v) => v.toFixed(2)}
        />
        <UsageCard
          title="Predições AI"
          current={usage.aiPredictions}
          limit={account.currentTier.limits.aiPredictions}
          unit="pred"
          formatter={(v) => v.toLocaleString()}
        />
        <UsageCard
          title="Armazenamento"
          current={usage.storageMB / 1024}
          limit={account.currentTier.limits.storageGB}
          unit="GB"
          formatter={(v) => v.toFixed(2)}
        />
      </div>

      {/* Alerts Section */}
      {activeAlerts.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Alertas Ativos</h3>
            <Badge variant="destructive">{activeAlerts.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activeAlerts.map((alert) => (
              <AlertCard key={alert.id} alert={alert} />
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
              onClick={() => generateReport.mutate('30d')}
              disabled={generateReport.isPending}
              className="flex items-center justify-center"
            >
              <FileText className="h-4 w-4 mr-2" />
              {generateReport.isPending ? 'Gerando...' : 'Relatório Mensal'}
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="flex items-center justify-center"
            >
              <a href="/billing/invoices">
                <Eye className="h-4 w-4 mr-2" />
                Ver Faturas
              </a>
            </Button>
            <Button 
              variant="outline" 
              asChild
              className="flex items-center justify-center"
            >
              <a href="/billing/payment">
                <CreditCard className="h-4 w-4 mr-2" />
                Métodos de Pagamento
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tier Information */}
      <Card>
        <CardHeader>
          <CardTitle>Plano Atual</CardTitle>
          <CardDescription>
            {account.currentTier.name} - {formatCurrency(account.currentTier.price, account.currency)}/mês
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            {account.currentTier.description}
          </p>
          <div className="grid gap-2 text-sm">
            <div className="flex justify-between">
              <span>Requisições:</span>
              <span>{account.currentTier.limits.requests.toLocaleString()}/mês</span>
            </div>
            <div className="flex justify-between">
              <span>Transferência:</span>
              <span>{account.currentTier.limits.dataTransferGB}GB/mês</span>
            </div>
            <div className="flex justify-between">
              <span>Predições AI:</span>
              <span>{account.currentTier.limits.aiPredictions.toLocaleString()}/mês</span>
            </div>
            <div className="flex justify-between">
              <span>Armazenamento:</span>
              <span>{account.currentTier.limits.storageGB}GB</span>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" asChild className="w-full">
            <a href="/billing/tiers">
              Gerenciar Plano
            </a>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
