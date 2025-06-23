# React Components - Billing API

## Visão Geral

Este guia demonstra como criar componentes React para consumir a API de Billing do VeloFlux, incluindo hooks personalizados, componentes de UI e gerenciamento de estado.

## Estrutura de Diretórios Recomendada

```
src/
├── components/
│   ├── billing/
│   │   ├── BillingDashboard.tsx
│   │   ├── SubscriptionCard.tsx
│   │   ├── UsageChart.tsx
│   │   ├── InvoicesList.tsx
│   │   ├── PlanSelector.tsx
│   │   ├── NotificationCenter.tsx
│   │   └── index.ts
│   └── common/
│       ├── LoadingSpinner.tsx
│       ├── ErrorBoundary.tsx
│       └── Modal.tsx
├── hooks/
│   ├── useBilling.ts
│   ├── useSubscription.ts
│   ├── useUsage.ts
│   ├── useInvoices.ts
│   └── useNotifications.ts
├── services/
│   ├── billingService.ts
│   └── types.ts
├── utils/
│   ├── formatters.ts
│   └── constants.ts
└── context/
    └── BillingContext.tsx
```

## Hooks Personalizados

### 1. Hook Principal de Billing

```tsx
// hooks/useBilling.ts
import { useState, useEffect, useCallback } from 'react';
import { BillingAPIClient, TenantBillingInfo, BillingAPIError } from '../services/types';
import { billingService } from '../services/billingService';

interface UseBillingState {
  billingInfo: TenantBillingInfo | null;
  loading: boolean;
  error: string | null;
}

interface UseBillingActions {
  refreshBilling: () => Promise<void>;
  clearError: () => void;
}

export function useBilling(tenantId: string): UseBillingState & UseBillingActions {
  const [state, setState] = useState<UseBillingState>({
    billingInfo: null,
    loading: true,
    error: null
  });

  const fetchBillingInfo = useCallback(async () => {
    if (!tenantId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const billingInfo = await billingService.getTenantBilling(tenantId);
      setState(prev => ({ ...prev, billingInfo, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao carregar informações de billing';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [tenantId]);

  const refreshBilling = useCallback(async () => {
    await fetchBillingInfo();
  }, [fetchBillingInfo]);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  useEffect(() => {
    fetchBillingInfo();
  }, [fetchBillingInfo]);

  return {
    ...state,
    refreshBilling,
    clearError
  };
}
```

### 2. Hook de Assinatura

```tsx
// hooks/useSubscription.ts
import { useState, useCallback } from 'react';
import { 
  Subscription, 
  CreateSubscriptionRequest, 
  UpdateSubscriptionRequest,
  CreateCheckoutRequest,
  BillingAPIError 
} from '../services/types';
import { billingService } from '../services/billingService';

interface UseSubscriptionActions {
  createSubscription: (data: CreateSubscriptionRequest) => Promise<void>;
  updateSubscription: (id: string, data: UpdateSubscriptionRequest) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
  createCheckout: (tenantId: string, data: CreateCheckoutRequest) => Promise<string>;
}

interface UseSubscriptionState {
  loading: boolean;
  error: string | null;
}

export function useSubscription(): UseSubscriptionState & UseSubscriptionActions {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSubscription = useCallback(async (data: CreateSubscriptionRequest) => {
    setLoading(true);
    setError(null);

    try {
      await billingService.createSubscription(data);
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao criar assinatura';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSubscription = useCallback(async (id: string, data: UpdateSubscriptionRequest) => {
    setLoading(true);
    setError(null);

    try {
      await billingService.updateSubscription(id, data);
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao atualizar assinatura';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelSubscription = useCallback(async (id: string) => {
    setLoading(true);
    setError(null);

    try {
      await billingService.cancelSubscription(id);
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao cancelar assinatura';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const createCheckout = useCallback(async (tenantId: string, data: CreateCheckoutRequest): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const response = await billingService.createCheckoutSession(tenantId, data);
      return response.checkout_url;
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao criar checkout';
      setError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    createSubscription,
    updateSubscription,
    cancelSubscription,
    createCheckout
  };
}
```

### 3. Hook de Uso

```tsx
// hooks/useUsage.ts
import { useState, useEffect, useCallback } from 'react';
import { UsageData, UsageFilters, BillingAPIError } from '../services/types';
import { billingService } from '../services/billingService';

interface UseUsageState {
  usage: UsageData | null;
  loading: boolean;
  error: string | null;
}

interface UseUsageActions {
  refreshUsage: () => Promise<void>;
  exportUsage: (format: string) => Promise<void>;
}

export function useUsage(tenantId: string, filters?: UsageFilters): UseUsageState & UseUsageActions {
  const [state, setState] = useState<UseUsageState>({
    usage: null,
    loading: true,
    error: null
  });

  const fetchUsage = useCallback(async () => {
    if (!tenantId) return;

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const usage = await billingService.getTenantUsage(tenantId, filters);
      setState(prev => ({ ...prev, usage, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao carregar dados de uso';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [tenantId, filters]);

  const refreshUsage = useCallback(async () => {
    await fetchUsage();
  }, [fetchUsage]);

  const exportUsage = useCallback(async (format: string) => {
    try {
      const blob = await billingService.exportTenantBilling(tenantId, {
        format: format as any,
        start_date: filters?.start_date,
        end_date: filters?.end_date
      });

      // Criar download
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `usage_${tenantId}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
    }
  }, [tenantId, filters]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return {
    ...state,
    refreshUsage,
    exportUsage
  };
}
```

### 4. Hook de Faturas

```tsx
// hooks/useInvoices.ts
import { useState, useEffect, useCallback } from 'react';
import { Invoice, InvoiceFilters, BillingAPIError } from '../services/types';
import { billingService } from '../services/billingService';

interface UseInvoicesState {
  invoices: Invoice[];
  loading: boolean;
  error: string | null;
}

interface UseInvoicesActions {
  refreshInvoices: () => Promise<void>;
  downloadInvoice: (id: string) => Promise<void>;
}

export function useInvoices(filters?: InvoiceFilters): UseInvoicesState & UseInvoicesActions {
  const [state, setState] = useState<UseInvoicesState>({
    invoices: [],
    loading: true,
    error: null
  });

  const fetchInvoices = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const invoices = await billingService.getInvoices(filters);
      setState(prev => ({ ...prev, invoices, loading: false }));
    } catch (error) {
      const errorMessage = error instanceof BillingAPIError 
        ? error.message 
        : 'Erro ao carregar faturas';
      setState(prev => ({ ...prev, error: errorMessage, loading: false }));
    }
  }, [filters]);

  const refreshInvoices = useCallback(async () => {
    await fetchInvoices();
  }, [fetchInvoices]);

  const downloadInvoice = useCallback(async (id: string) => {
    try {
      const blob = await billingService.downloadInvoice(id);
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erro ao baixar fatura:', error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  return {
    ...state,
    refreshInvoices,
    downloadInvoice
  };
}
```

## Componentes React

### 1. Dashboard Principal

```tsx
// components/billing/BillingDashboard.tsx
import React from 'react';
import { useBilling } from '../../hooks/useBilling';
import { SubscriptionCard } from './SubscriptionCard';
import { UsageChart } from './UsageChart';
import { InvoicesList } from './InvoicesList';
import { NotificationCenter } from './NotificationCenter';
import { LoadingSpinner } from '../common/LoadingSpinner';
import { ErrorAlert } from '../common/ErrorAlert';

interface BillingDashboardProps {
  tenantId: string;
}

export const BillingDashboard: React.FC<BillingDashboardProps> = ({ tenantId }) => {
  const { billingInfo, loading, error, refreshBilling, clearError } = useBilling(tenantId);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorAlert 
        message={error} 
        onRetry={refreshBilling}
        onDismiss={clearError}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">
          Billing Dashboard
        </h1>
        <button
          onClick={refreshBilling}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Atualizar
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Subscription Info */}
        <div className="lg:col-span-2">
          <SubscriptionCard 
            billingInfo={billingInfo}
            tenantId={tenantId}
          />
        </div>

        {/* Notifications */}
        <div>
          <NotificationCenter tenantId={tenantId} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Usage Chart */}
        <div>
          <UsageChart tenantId={tenantId} />
        </div>

        {/* Recent Invoices */}
        <div>
          <InvoicesList tenantId={tenantId} limit={5} />
        </div>
      </div>
    </div>
  );
};
```

### 2. Card de Assinatura

```tsx
// components/billing/SubscriptionCard.tsx
import React, { useState } from 'react';
import { TenantBillingInfo, PlanType } from '../../services/types';
import { useSubscription } from '../../hooks/useSubscription';
import { PlanSelector } from './PlanSelector';
import { formatPrice, formatDate } from '../../utils/formatters';

interface SubscriptionCardProps {
  billingInfo: TenantBillingInfo | null;
  tenantId: string;
}

export const SubscriptionCard: React.FC<SubscriptionCardProps> = ({ 
  billingInfo, 
  tenantId 
}) => {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const { createCheckout, loading } = useSubscription();

  const handleUpgrade = async (planType: PlanType, isYearly: boolean) => {
    try {
      const checkoutUrl = await createCheckout(tenantId, {
        plan_type: planType,
        is_yearly: isYearly
      });
      
      window.location.href = checkoutUrl;
    } catch (error) {
      console.error('Erro ao iniciar upgrade:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'inactive': return 'text-red-600 bg-red-100';
      case 'trialing': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Assinatura Atual
        </h2>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(billingInfo?.status || 'inactive')}`}>
          {billingInfo?.status === 'active' ? 'Ativo' : 
           billingInfo?.status === 'inactive' ? 'Inativo' : 
           billingInfo?.status === 'trialing' ? 'Em Teste' : 'Desconhecido'}
        </span>
      </div>

      {billingInfo?.subscription ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plano</p>
              <p className="text-lg font-medium">
                {billingInfo.plan?.name || billingInfo.subscription.plan_type}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Ciclo de Cobrança</p>
              <p className="text-lg font-medium">
                {billingInfo.subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual'}
              </p>
            </div>
          </div>

          {billingInfo.next_billing_date && (
            <div>
              <p className="text-sm text-gray-600">Próxima Cobrança</p>
              <p className="text-lg font-medium">
                {formatDate(billingInfo.next_billing_date)}
              </p>
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={() => setShowUpgrade(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Carregando...' : 'Alterar Plano'}
            </button>
            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
              Gerenciar Pagamento
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            Você não possui uma assinatura ativa
          </p>
          <button
            onClick={() => setShowUpgrade(true)}
            disabled={loading}
            className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Carregando...' : 'Escolher Plano'}
          </button>
        </div>
      )}

      {showUpgrade && (
        <PlanSelector
          currentPlan={billingInfo?.subscription?.plan_type}
          onSelectPlan={handleUpgrade}
          onClose={() => setShowUpgrade(false)}
        />
      )}
    </div>
  );
};
```

### 3. Gráfico de Uso

```tsx
// components/billing/UsageChart.tsx
import React, { useState } from 'react';
import { useUsage } from '../../hooks/useUsage';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface UsageChartProps {
  tenantId: string;
}

export const UsageChart: React.FC<UsageChartProps> = ({ tenantId }) => {
  const [selectedResource, setSelectedResource] = useState('requests');
  const { usage, loading, error, exportUsage } = useUsage(tenantId, {
    resource: selectedResource
  });

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-64">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="text-center text-red-600">
          Erro ao carregar dados de uso
        </div>
      </div>
    );
  }

  const usagePercentage = usage ? (usage.total_usage / usage.plan_limit) * 100 : 0;

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-900">
          Uso de Recursos
        </h2>
        <div className="flex space-x-2">
          <select
            value={selectedResource}
            onChange={(e) => setSelectedResource(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-1 text-sm"
          >
            <option value="requests">Requisições</option>
            <option value="bandwidth_gb">Bandwidth (GB)</option>
            <option value="storage_gb">Armazenamento (GB)</option>
            <option value="compute_hours">Horas de Compute</option>
          </select>
          <button
            onClick={() => exportUsage('csv')}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Exportar
          </button>
        </div>
      </div>

      {usage && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">
              {usage.total_usage.toLocaleString()} / {usage.plan_limit.toLocaleString()}
            </span>
            <span className={`text-sm font-medium ${
              usagePercentage > 80 ? 'text-red-600' : 
              usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
            }`}>
              {usagePercentage.toFixed(1)}%
            </span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full ${
                usagePercentage > 80 ? 'bg-red-500' : 
                usagePercentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
              }`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>

          {usagePercentage > 80 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">
                <strong>Atenção:</strong> Você está próximo do limite do seu plano.
                Considere fazer upgrade para evitar interrupções.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
```

### 4. Lista de Faturas

```tsx
// components/billing/InvoicesList.tsx
import React from 'react';
import { useInvoices } from '../../hooks/useInvoices';
import { formatPrice, formatDate } from '../../utils/formatters';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface InvoicesListProps {
  tenantId?: string;
  limit?: number;
  showHeader?: boolean;
}

export const InvoicesList: React.FC<InvoicesListProps> = ({ 
  tenantId, 
  limit,
  showHeader = true 
}) => {
  const { invoices, loading, error, downloadInvoice } = useInvoices(
    tenantId ? { tenant_id: tenantId, limit } : { limit }
  );

  const getStatusBadge = (status: string) => {
    const statusColors = {
      paid: 'bg-green-100 text-green-800',
      open: 'bg-yellow-100 text-yellow-800',
      void: 'bg-gray-100 text-gray-800',
      draft: 'bg-blue-100 text-blue-800'
    };

    const statusLabels = {
      paid: 'Pago',
      open: 'Aberto',
      void: 'Cancelado',
      draft: 'Rascunho'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusColors[status] || statusColors.draft}`}>
        {statusLabels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-center items-center h-32">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {showHeader && (
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Faturas Recentes
          </h2>
          <a 
            href="/billing/invoices" 
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            Ver todas
          </a>
        </div>
      )}

      {error && (
        <div className="text-center text-red-600 py-4">
          Erro ao carregar faturas
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          Nenhuma fatura encontrada
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((invoice) => (
            <div
              key={invoice.id}
              className="flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <div className="flex-1">
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900">
                    #{invoice.invoice_number}
                  </span>
                  {getStatusBadge(invoice.status)}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(invoice.created_at)}
                </div>
              </div>

              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {formatPrice(invoice.amount_due, invoice.currency)}
                </div>
                {invoice.status === 'paid' && (
                  <button
                    onClick={() => downloadInvoice(invoice.id)}
                    className="text-sm text-blue-600 hover:text-blue-800"
                  >
                    Baixar PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
```

### 5. Seletor de Planos

```tsx
// components/billing/PlanSelector.tsx
import React, { useState, useEffect } from 'react';
import { Plan, PlanType } from '../../services/types';
import { billingService } from '../../services/billingService';
import { formatPrice } from '../../utils/formatters';
import { Modal } from '../common/Modal';

interface PlanSelectorProps {
  currentPlan?: PlanType;
  onSelectPlan: (planType: PlanType, isYearly: boolean) => void;
  onClose: () => void;
}

export const PlanSelector: React.FC<PlanSelectorProps> = ({
  currentPlan,
  onSelectPlan,
  onClose
}) => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isYearly, setIsYearly] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPlans = async () => {
      try {
        const response = await billingService.getPlans();
        setPlans(response.plans);
      } catch (error) {
        console.error('Erro ao carregar planos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPlans();
  }, []);

  const getPlanPrice = (plan: Plan) => {
    const pricing = isYearly ? plan.pricing.yearly : plan.pricing.monthly;
    return formatPrice(pricing.amount, pricing.currency);
  };

  const isCurrentPlan = (planType: PlanType) => {
    return currentPlan === planType;
  };

  return (
    <Modal onClose={onClose} title="Escolher Plano">
      <div className="space-y-6">
        {/* Toggle Anual/Mensal */}
        <div className="flex justify-center">
          <div className="bg-gray-100 rounded-lg p-1 flex">
            <button
              onClick={() => setIsYearly(false)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                !isYearly ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              Mensal
            </button>
            <button
              onClick={() => setIsYearly(true)}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                isYearly ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              }`}
            >
              Anual
              <span className="ml-1 text-green-600 text-xs">-20%</span>
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`border rounded-lg p-6 ${
                  isCurrentPlan(plan.type)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {plan.name}
                  </h3>
                  <div className="text-3xl font-bold text-gray-900 mb-1">
                    {getPlanPrice(plan)}
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    por {isYearly ? 'ano' : 'mês'}
                  </p>
                </div>

                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => onSelectPlan(plan.type, isYearly)}
                  disabled={isCurrentPlan(plan.type)}
                  className={`w-full py-2 px-4 rounded-md font-medium ${
                    isCurrentPlan(plan.type)
                      ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {isCurrentPlan(plan.type) ? 'Plano Atual' : 'Escolher Plano'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
};
```

### 6. Centro de Notificações

```tsx
// components/billing/NotificationCenter.tsx
import React, { useState } from 'react';
import { useNotifications } from '../../hooks/useNotifications';
import { formatDate } from '../../utils/formatters';

interface NotificationCenterProps {
  tenantId: string;
  maxItems?: number;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  tenantId, 
  maxItems = 5 
}) => {
  const [showAll, setShowAll] = useState(false);
  const { 
    notifications, 
    unreadCount, 
    loading, 
    markAsRead, 
    markAllAsRead 
  } = useNotifications({
    tenant_id: tenantId,
    limit: showAll ? undefined : maxItems
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'payment_success':
        return '✅';
      case 'payment_failed':
        return '❌';
      case 'usage_alert':
        return '⚠️';
      case 'invoice_created':
        return '📄';
      default:
        return '📢';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center">
          <h2 className="text-xl font-semibold text-gray-900">
            Notificações
          </h2>
          {unreadCount > 0 && (
            <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        
        {unreadCount > 0 && (
          <button
            onClick={markAllAsRead}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            Marcar todas como lidas
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : notifications.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          Nenhuma notificação
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`p-3 border rounded-md cursor-pointer transition-colors ${
                notification.read
                  ? 'border-gray-200 bg-gray-50'
                  : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
              }`}
              onClick={() => !notification.read && markAsRead(notification.id)}
            >
              <div className="flex items-start space-x-3">
                <span className="text-lg">
                  {getTypeIcon(notification.type)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className={`text-sm font-medium truncate ${
                      notification.read ? 'text-gray-700' : 'text-gray-900'
                    }`}>
                      {notification.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ml-2 ${getPriorityColor(notification.priority)}`}>
                      {notification.priority}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-2 ${
                    notification.read ? 'text-gray-600' : 'text-gray-700'
                  }`}>
                    {notification.message}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    {formatDate(notification.timestamp)}
                  </p>
                </div>
              </div>
            </div>
          ))}
          
          {!showAll && notifications.length === maxItems && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas as notificações
            </button>
          )}
        </div>
      )}
    </div>
  );
};
```

## Componentes Comuns

### 1. Modal

```tsx
// components/common/Modal.tsx
import React, { useEffect } from 'react';

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ 
  children, 
  onClose, 
  title,
  size = 'md' 
}) => {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl'
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={onClose}
        />

        <div className={`inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle w-full ${sizeClasses[size]}`}>
          {title && (
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
```

### 2. Loading Spinner

```tsx
// components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  color = 'blue-600' 
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`animate-spin rounded-full border-b-2 border-${color} ${sizeClasses[size]}`} />
  );
};
```

### 3. Error Alert

```tsx
// components/common/ErrorAlert.tsx
import React from 'react';

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorAlert: React.FC<ErrorAlertProps> = ({ 
  message, 
  onRetry, 
  onDismiss 
}) => {
  return (
    <div className="bg-red-50 border border-red-200 rounded-md p-4">
      <div className="flex">
        <div className="flex-shrink-0">
          <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <p className="text-sm text-red-700">{message}</p>
        </div>
        <div className="ml-3 flex space-x-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-sm text-red-600 hover:text-red-800 font-medium"
            >
              Tentar novamente
            </button>
          )}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-red-600 hover:text-red-800"
            >
              ×
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

## Exemplo de Uso Completo

```tsx
// App.tsx
import React from 'react';
import { BillingProvider } from './context/BillingContext';
import { BillingDashboard } from './components/billing/BillingDashboard';

function App() {
  const tenantId = 'tenant_123'; // Obter do contexto de autenticação

  return (
    <BillingProvider>
      <div className="min-h-screen bg-gray-100">
        <BillingDashboard tenantId={tenantId} />
      </div>
    </BillingProvider>
  );
}

export default App;
```

Esta implementação fornece uma base sólida e reutilizável para integrar a API de Billing no frontend React, com componentes modulares e hooks customizados para facilitar o desenvolvimento e manutenção.
