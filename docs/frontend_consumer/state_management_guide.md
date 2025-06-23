# State Management Integration - Billing API

## Visão Geral

Este guia demonstra como integrar a API de Billing com diferentes bibliotecas de gerenciamento de estado no frontend, incluindo Redux, Zustand, Jotai e outras soluções populares.

## 🔄 Redux Toolkit Integration

### Store Configuration

```typescript
// store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import { billingApi } from './api/billingApi';
import billingSlice from './slices/billingSlice';
import uiSlice from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    billing: billingSlice,
    ui: uiSlice,
    [billingApi.reducerPath]: billingApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(billingApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

### RTK Query API Definition

```typescript
// store/api/billingApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { 
  Subscription, 
  Invoice, 
  Plan, 
  TenantBillingInfo,
  UsageData,
  Transaction,
  UsageAlert,
  Notification
} from '../../types/billing';

const baseQuery = fetchBaseQuery({
  baseUrl: '/api/billing/',
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth.token;
    const tenantId = (getState() as RootState).auth.tenantId;
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    if (tenantId) {
      headers.set('x-tenant-id', tenantId);
    }
    
    return headers;
  },
});

export const billingApi = createApi({
  reducerPath: 'billingApi',
  baseQuery,
  tagTypes: [
    'Subscription', 
    'Invoice', 
    'Plan', 
    'Usage', 
    'Transaction', 
    'Alert', 
    'Notification'
  ],
  endpoints: (builder) => ({
    // Subscriptions
    getSubscriptions: builder.query<Subscription[], void>({
      query: () => 'subscriptions',
      providesTags: ['Subscription'],
    }),
    
    getSubscription: builder.query<Subscription, string>({
      query: (id) => `subscriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subscription', id }],
    }),
    
    createSubscription: builder.mutation<Subscription, Partial<Subscription>>({
      query: (body) => ({
        url: 'subscriptions',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Subscription'],
    }),
    
    updateSubscription: builder.mutation<Subscription, { id: string; body: Partial<Subscription> }>({
      query: ({ id, body }) => ({
        url: `subscriptions/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subscription', id }],
    }),
    
    cancelSubscription: builder.mutation<void, string>({
      query: (id) => ({
        url: `subscriptions/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Subscription'],
    }),

    // Invoices
    getInvoices: builder.query<Invoice[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `invoices?page=${page}&limit=${limit}`,
      providesTags: ['Invoice'],
    }),
    
    getInvoice: builder.query<Invoice, string>({
      query: (id) => `invoices/${id}`,
      providesTags: (result, error, id) => [{ type: 'Invoice', id }],
    }),
    
    downloadInvoice: builder.query<Blob, string>({
      query: (id) => ({
        url: `invoices/${id}/download`,
        responseHandler: (response) => response.blob(),
      }),
    }),

    // Plans
    getPlans: builder.query<Plan[], void>({
      query: () => 'plans',
      providesTags: ['Plan'],
    }),

    // Tenant-specific
    getTenantBilling: builder.query<TenantBillingInfo, string>({
      query: (tenantId) => `tenant/${tenantId}/billing`,
      providesTags: ['Usage', 'Subscription'],
    }),
    
    createCheckout: builder.mutation<{ checkout_url: string }, { tenantId: string; planId: string }>({
      query: ({ tenantId, planId }) => ({
        url: `tenant/${tenantId}/checkout`,
        method: 'POST',
        body: { plan_id: planId },
      }),
    }),
    
    getUsage: builder.query<UsageData, { tenantId: string; period?: string }>({
      query: ({ tenantId, period = 'current' }) => 
        `tenant/${tenantId}/usage?period=${period}`,
      providesTags: ['Usage'],
    }),

    // Transactions
    getTransactions: builder.query<Transaction[], { page?: number; limit?: number }>({
      query: ({ page = 1, limit = 10 }) => `transactions?page=${page}&limit=${limit}`,
      providesTags: ['Transaction'],
    }),

    // Usage Alerts
    getUsageAlerts: builder.query<UsageAlert[], void>({
      query: () => 'usage-alerts',
      providesTags: ['Alert'],
    }),
    
    createUsageAlert: builder.mutation<UsageAlert, Partial<UsageAlert>>({
      query: (body) => ({
        url: 'usage-alerts',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Alert'],
    }),
    
    updateUsageAlert: builder.mutation<UsageAlert, { id: string; body: Partial<UsageAlert> }>({
      query: ({ id, body }) => ({
        url: `usage-alerts/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Alert'],
    }),

    // Notifications
    getNotifications: builder.query<Notification[], void>({
      query: () => 'notifications',
      providesTags: ['Notification'],
    }),
    
    markNotificationRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'POST',
      }),
      invalidatesTags: ['Notification'],
    }),
  }),
});

export const {
  useGetSubscriptionsQuery,
  useGetSubscriptionQuery,
  useCreateSubscriptionMutation,
  useUpdateSubscriptionMutation,
  useCancelSubscriptionMutation,
  useGetInvoicesQuery,
  useGetInvoiceQuery,
  useLazyDownloadInvoiceQuery,
  useGetPlansQuery,
  useGetTenantBillingQuery,
  useCreateCheckoutMutation,
  useGetUsageQuery,
  useGetTransactionsQuery,
  useGetUsageAlertsQuery,
  useCreateUsageAlertMutation,
  useUpdateUsageAlertMutation,
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} = billingApi;
```

### Billing Slice

```typescript
// store/slices/billingSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { Subscription, Invoice, Plan } from '../../types/billing';

interface BillingState {
  selectedPlan: Plan | null;
  currentSubscription: Subscription | null;
  recentInvoices: Invoice[];
  loading: {
    subscription: boolean;
    checkout: boolean;
    invoices: boolean;
  };
  error: string | null;
  filters: {
    invoiceStatus: string;
    dateRange: { start: string; end: string } | null;
  };
}

const initialState: BillingState = {
  selectedPlan: null,
  currentSubscription: null,
  recentInvoices: [],
  loading: {
    subscription: false,
    checkout: false,
    invoices: false,
  },
  error: null,
  filters: {
    invoiceStatus: 'all',
    dateRange: null,
  },
};

const billingSlice = createSlice({
  name: 'billing',
  initialState,
  reducers: {
    setSelectedPlan: (state, action: PayloadAction<Plan>) => {
      state.selectedPlan = action.payload;
    },
    
    setCurrentSubscription: (state, action: PayloadAction<Subscription>) => {
      state.currentSubscription = action.payload;
    },
    
    setRecentInvoices: (state, action: PayloadAction<Invoice[]>) => {
      state.recentInvoices = action.payload;
    },
    
    setLoading: (state, action: PayloadAction<{ key: keyof BillingState['loading']; value: boolean }>) => {
      state.loading[action.payload.key] = action.payload.value;
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    
    setInvoiceFilter: (state, action: PayloadAction<string>) => {
      state.filters.invoiceStatus = action.payload;
    },
    
    setDateRangeFilter: (state, action: PayloadAction<{ start: string; end: string } | null>) => {
      state.filters.dateRange = action.payload;
    },
    
    clearFilters: (state) => {
      state.filters = initialState.filters;
    },
    
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const {
  setSelectedPlan,
  setCurrentSubscription,
  setRecentInvoices,
  setLoading,
  setError,
  setInvoiceFilter,
  setDateRangeFilter,
  clearFilters,
  clearError,
} = billingSlice.actions;

export default billingSlice.reducer;
```

### Redux Component Usage

```tsx
// components/billing/BillingDashboardRedux.tsx
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../../store/store';
import { 
  useGetTenantBillingQuery,
  useGetSubscriptionsQuery,
  useGetInvoicesQuery 
} from '../../store/api/billingApi';
import { setCurrentSubscription, setRecentInvoices } from '../../store/slices/billingSlice';

export const BillingDashboardRedux: React.FC = () => {
  const dispatch = useDispatch();
  const { selectedPlan, currentSubscription, filters } = useSelector(
    (state: RootState) => state.billing
  );
  const { tenantId } = useSelector((state: RootState) => state.auth);

  const { 
    data: tenantBilling, 
    isLoading: isBillingLoading,
    error: billingError 
  } = useGetTenantBillingQuery(tenantId);

  const { 
    data: subscriptions, 
    isLoading: isSubscriptionsLoading 
  } = useGetSubscriptionsQuery();

  const { 
    data: invoices, 
    isLoading: isInvoicesLoading 
  } = useGetInvoicesQuery({ 
    page: 1, 
    limit: 5 
  });

  useEffect(() => {
    if (subscriptions && subscriptions.length > 0) {
      const activeSubscription = subscriptions.find(s => s.status === 'active');
      if (activeSubscription) {
        dispatch(setCurrentSubscription(activeSubscription));
      }
    }
  }, [subscriptions, dispatch]);

  useEffect(() => {
    if (invoices) {
      dispatch(setRecentInvoices(invoices));
    }
  }, [invoices, dispatch]);

  if (isBillingLoading || isSubscriptionsLoading || isInvoicesLoading) {
    return <div className="animate-pulse">Carregando dashboard...</div>;
  }

  if (billingError) {
    return <div className="text-red-600">Erro ao carregar dados de billing</div>;
  }

  return (
    <div className="space-y-6">
      {/* Subscription Overview */}
      {currentSubscription && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Assinatura Atual</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plano</p>
              <p className="font-semibold">{currentSubscription.plan_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                currentSubscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {currentSubscription.status}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Usage Overview */}
      {tenantBilling && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Uso Atual</h2>
          <div className="space-y-4">
            {Object.entries(tenantBilling.usage || {}).map(([metric, usage]) => (
              <div key={metric} className="flex justify-between items-center">
                <span className="capitalize">{metric.replace('_', ' ')}</span>
                <span className="font-semibold">
                  {usage.current} / {usage.limit}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Invoices */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Faturas Recentes</h2>
        {invoices && invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-semibold">#{invoice.number}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${invoice.amount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    invoice.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma fatura encontrada</p>
        )}
      </div>
    </div>
  );
};
```

## 🧘 Zustand Integration

### Store Setup

```typescript
// stores/billingStore.ts
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import type { 
  Subscription, 
  Invoice, 
  Plan, 
  UsageData, 
  Transaction,
  UsageAlert,
  Notification 
} from '../types/billing';
import { billingService } from '../services/billingService';

interface BillingState {
  // Data
  subscriptions: Subscription[];
  currentSubscription: Subscription | null;
  invoices: Invoice[];
  plans: Plan[];
  usage: UsageData | null;
  transactions: Transaction[];
  usageAlerts: UsageAlert[];
  notifications: Notification[];
  
  // UI State
  loading: {
    subscriptions: boolean;
    invoices: boolean;
    plans: boolean;
    usage: boolean;
    transactions: boolean;
    alerts: boolean;
    notifications: boolean;
  };
  
  error: string | null;
  
  // Filters
  filters: {
    invoices: {
      status: string;
      dateRange: { start: string; end: string } | null;
    };
    transactions: {
      type: string;
      dateRange: { start: string; end: string } | null;
    };
  };
}

interface BillingActions {
  // Subscriptions
  fetchSubscriptions: () => Promise<void>;
  createSubscription: (data: Partial<Subscription>) => Promise<void>;
  updateSubscription: (id: string, data: Partial<Subscription>) => Promise<void>;
  cancelSubscription: (id: string) => Promise<void>;
  
  // Invoices
  fetchInvoices: (params?: { page?: number; limit?: number }) => Promise<void>;
  downloadInvoice: (id: string) => Promise<void>;
  
  // Plans
  fetchPlans: () => Promise<void>;
  
  // Usage
  fetchUsage: (tenantId: string, period?: string) => Promise<void>;
  
  // Transactions
  fetchTransactions: (params?: { page?: number; limit?: number }) => Promise<void>;
  
  // Alerts
  fetchUsageAlerts: () => Promise<void>;
  createUsageAlert: (data: Partial<UsageAlert>) => Promise<void>;
  updateUsageAlert: (id: string, data: Partial<UsageAlert>) => Promise<void>;
  
  // Notifications
  fetchNotifications: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  
  // UI Actions
  setLoading: (key: keyof BillingState['loading'], value: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Filter Actions
  setInvoiceFilter: (filter: Partial<BillingState['filters']['invoices']>) => void;
  setTransactionFilter: (filter: Partial<BillingState['filters']['transactions']>) => void;
  clearFilters: () => void;
  
  // Real-time updates
  updateSubscriptionStatus: (id: string, status: string) => void;
  addNotification: (notification: Notification) => void;
  addUsageAlert: (alert: UsageAlert) => void;
}

type BillingStore = BillingState & BillingActions;

export const useBillingStore = create<BillingStore>()(
  devtools(
    persist(
      immer((set, get) => ({
        // Initial State
        subscriptions: [],
        currentSubscription: null,
        invoices: [],
        plans: [],
        usage: null,
        transactions: [],
        usageAlerts: [],
        notifications: [],
        
        loading: {
          subscriptions: false,
          invoices: false,
          plans: false,
          usage: false,
          transactions: false,
          alerts: false,
          notifications: false,
        },
        
        error: null,
        
        filters: {
          invoices: {
            status: 'all',
            dateRange: null,
          },
          transactions: {
            type: 'all',
            dateRange: null,
          },
        },

        // Actions
        fetchSubscriptions: async () => {
          set((state) => {
            state.loading.subscriptions = true;
            state.error = null;
          });
          
          try {
            const subscriptions = await billingService.getSubscriptions();
            set((state) => {
              state.subscriptions = subscriptions;
              state.currentSubscription = subscriptions.find(s => s.status === 'active') || null;
              state.loading.subscriptions = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.subscriptions = false;
            });
          }
        },

        createSubscription: async (data) => {
          set((state) => {
            state.loading.subscriptions = true;
            state.error = null;
          });
          
          try {
            const subscription = await billingService.createSubscription(data);
            set((state) => {
              state.subscriptions.push(subscription);
              state.loading.subscriptions = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.subscriptions = false;
            });
          }
        },

        updateSubscription: async (id, data) => {
          try {
            const updated = await billingService.updateSubscription(id, data);
            set((state) => {
              const index = state.subscriptions.findIndex(s => s.id === id);
              if (index !== -1) {
                state.subscriptions[index] = updated;
              }
              if (state.currentSubscription?.id === id) {
                state.currentSubscription = updated;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        cancelSubscription: async (id) => {
          try {
            await billingService.cancelSubscription(id);
            set((state) => {
              state.subscriptions = state.subscriptions.filter(s => s.id !== id);
              if (state.currentSubscription?.id === id) {
                state.currentSubscription = null;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        fetchInvoices: async (params = {}) => {
          set((state) => {
            state.loading.invoices = true;
            state.error = null;
          });
          
          try {
            const invoices = await billingService.getInvoices(params);
            set((state) => {
              state.invoices = invoices;
              state.loading.invoices = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.invoices = false;
            });
          }
        },

        downloadInvoice: async (id) => {
          try {
            await billingService.downloadInvoice(id);
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        fetchPlans: async () => {
          set((state) => {
            state.loading.plans = true;
            state.error = null;
          });
          
          try {
            const plans = await billingService.getPlans();
            set((state) => {
              state.plans = plans;
              state.loading.plans = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.plans = false;
            });
          }
        },

        fetchUsage: async (tenantId, period = 'current') => {
          set((state) => {
            state.loading.usage = true;
            state.error = null;
          });
          
          try {
            const usage = await billingService.getUsage(tenantId, period);
            set((state) => {
              state.usage = usage;
              state.loading.usage = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.usage = false;
            });
          }
        },

        fetchTransactions: async (params = {}) => {
          set((state) => {
            state.loading.transactions = true;
            state.error = null;
          });
          
          try {
            const transactions = await billingService.getTransactions(params);
            set((state) => {
              state.transactions = transactions;
              state.loading.transactions = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.transactions = false;
            });
          }
        },

        fetchUsageAlerts: async () => {
          set((state) => {
            state.loading.alerts = true;
            state.error = null;
          });
          
          try {
            const alerts = await billingService.getUsageAlerts();
            set((state) => {
              state.usageAlerts = alerts;
              state.loading.alerts = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.alerts = false;
            });
          }
        },

        createUsageAlert: async (data) => {
          try {
            const alert = await billingService.createUsageAlert(data);
            set((state) => {
              state.usageAlerts.push(alert);
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        updateUsageAlert: async (id, data) => {
          try {
            const updated = await billingService.updateUsageAlert(id, data);
            set((state) => {
              const index = state.usageAlerts.findIndex(a => a.id === id);
              if (index !== -1) {
                state.usageAlerts[index] = updated;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        fetchNotifications: async () => {
          set((state) => {
            state.loading.notifications = true;
            state.error = null;
          });
          
          try {
            const notifications = await billingService.getNotifications();
            set((state) => {
              state.notifications = notifications;
              state.loading.notifications = false;
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
              state.loading.notifications = false;
            });
          }
        },

        markNotificationRead: async (id) => {
          try {
            await billingService.markNotificationRead(id);
            set((state) => {
              const notification = state.notifications.find(n => n.id === id);
              if (notification) {
                notification.read = true;
              }
            });
          } catch (error) {
            set((state) => {
              state.error = (error as Error).message;
            });
          }
        },

        // UI Actions
        setLoading: (key, value) => {
          set((state) => {
            state.loading[key] = value;
          });
        },

        setError: (error) => {
          set((state) => {
            state.error = error;
          });
        },

        clearError: () => {
          set((state) => {
            state.error = null;
          });
        },

        // Filter Actions
        setInvoiceFilter: (filter) => {
          set((state) => {
            Object.assign(state.filters.invoices, filter);
          });
        },

        setTransactionFilter: (filter) => {
          set((state) => {
            Object.assign(state.filters.transactions, filter);
          });
        },

        clearFilters: () => {
          set((state) => {
            state.filters = {
              invoices: { status: 'all', dateRange: null },
              transactions: { type: 'all', dateRange: null },
            };
          });
        },

        // Real-time updates
        updateSubscriptionStatus: (id, status) => {
          set((state) => {
            const subscription = state.subscriptions.find(s => s.id === id);
            if (subscription) {
              subscription.status = status;
            }
            if (state.currentSubscription?.id === id) {
              state.currentSubscription.status = status;
            }
          });
        },

        addNotification: (notification) => {
          set((state) => {
            state.notifications.unshift(notification);
          });
        },

        addUsageAlert: (alert) => {
          set((state) => {
            const existingIndex = state.usageAlerts.findIndex(a => a.metric === alert.metric);
            if (existingIndex !== -1) {
              state.usageAlerts[existingIndex] = alert;
            } else {
              state.usageAlerts.push(alert);
            }
          });
        },
      })),
      {
        name: 'billing-store',
        partialize: (state) => ({
          // Persistir apenas dados importantes
          currentSubscription: state.currentSubscription,
          plans: state.plans,
        }),
      }
    ),
    {
      name: 'billing-store',
    }
  )
);

// Selectors
export const useBillingSelectors = () => {
  const store = useBillingStore();
  
  return {
    // Computed values
    activeSubscription: store.subscriptions.find(s => s.status === 'active'),
    unpaidInvoices: store.invoices.filter(i => i.status !== 'paid'),
    criticalAlerts: store.usageAlerts.filter(a => a.percentage >= 90),
    unreadNotifications: store.notifications.filter(n => !n.read),
    
    // Filtered data
    filteredInvoices: store.invoices.filter(invoice => {
      const { status, dateRange } = store.filters.invoices;
      
      if (status !== 'all' && invoice.status !== status) return false;
      
      if (dateRange) {
        const invoiceDate = new Date(invoice.created_at);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        if (invoiceDate < startDate || invoiceDate > endDate) return false;
      }
      
      return true;
    }),
    
    filteredTransactions: store.transactions.filter(transaction => {
      const { type, dateRange } = store.filters.transactions;
      
      if (type !== 'all' && transaction.type !== type) return false;
      
      if (dateRange) {
        const transactionDate = new Date(transaction.created_at);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        
        if (transactionDate < startDate || transactionDate > endDate) return false;
      }
      
      return true;
    }),
  };
};
```

### Zustand Component Usage

```tsx
// components/billing/BillingDashboardZustand.tsx
import React, { useEffect } from 'react';
import { useBillingStore, useBillingSelectors } from '../../stores/billingStore';

export const BillingDashboardZustand: React.FC = () => {
  const {
    fetchSubscriptions,
    fetchInvoices,
    fetchUsage,
    fetchNotifications,
    loading,
    error,
    clearError,
  } = useBillingStore();

  const {
    activeSubscription,
    unpaidInvoices,
    criticalAlerts,
    unreadNotifications,
  } = useBillingSelectors();

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSubscriptions(),
        fetchInvoices({ limit: 5 }),
        fetchNotifications(),
      ]);
    };

    loadData();
  }, [fetchSubscriptions, fetchInvoices, fetchNotifications]);

  useEffect(() => {
    if (error) {
      // Toast notification
      console.error('Billing error:', error);
      // Auto-clear error after 5 seconds
      const timer = setTimeout(() => clearError(), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  if (loading.subscriptions || loading.invoices) {
    return <div className="animate-pulse">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Assinatura</h3>
          <p className="text-2xl font-bold text-gray-900">
            {activeSubscription ? activeSubscription.plan_name : 'Nenhuma'}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Faturas Pendentes</h3>
          <p className="text-2xl font-bold text-orange-600">
            {unpaidInvoices.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Alertas Críticos</h3>
          <p className="text-2xl font-bold text-red-600">
            {criticalAlerts.length}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4">
          <h3 className="text-sm font-medium text-gray-500">Notificações</h3>
          <p className="text-2xl font-bold text-blue-600">
            {unreadNotifications.length}
          </p>
        </div>
      </div>

      {/* Subscription Status */}
      {activeSubscription && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Assinatura Atual</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Plano</p>
              <p className="font-semibold">{activeSubscription.plan_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className={`px-2 py-1 rounded-full text-xs ${
                activeSubscription.status === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {activeSubscription.status}
              </span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Próxima Cobrança</p>
              <p className="font-semibold">
                {new Date(activeSubscription.current_period_end).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor</p>
              <p className="font-semibold">${activeSubscription.amount}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
```

## 🧩 Jotai Integration

### Atoms Definition

```typescript
// atoms/billingAtoms.ts
import { atom } from 'jotai';
import { atomWithStorage, loadable } from 'jotai/utils';
import type { Subscription, Invoice, Plan, UsageData } from '../types/billing';
import { billingService } from '../services/billingService';

// Base atoms
export const subscriptionsAtom = atom<Subscription[]>([]);
export const invoicesAtom = atom<Invoice[]>([]);
export const plansAtom = atom<Plan[]>([]);
export const usageAtom = atom<UsageData | null>(null);

// Persistent atoms
export const currentSubscriptionAtom = atomWithStorage<Subscription | null>(
  'currentSubscription',
  null
);

export const selectedPlanAtom = atomWithStorage<Plan | null>(
  'selectedPlan',
  null
);

// Loading states
export const loadingAtom = atom({
  subscriptions: false,
  invoices: false,
  plans: false,
  usage: false,
});

export const errorAtom = atom<string | null>(null);

// Async atoms for data fetching
export const fetchSubscriptionsAtom = atom(
  null,
  async (get, set) => {
    set(loadingAtom, prev => ({ ...prev, subscriptions: true }));
    set(errorAtom, null);
    
    try {
      const subscriptions = await billingService.getSubscriptions();
      set(subscriptionsAtom, subscriptions);
      
      const activeSubscription = subscriptions.find(s => s.status === 'active');
      if (activeSubscription) {
        set(currentSubscriptionAtom, activeSubscription);
      }
    } catch (error) {
      set(errorAtom, (error as Error).message);
    } finally {
      set(loadingAtom, prev => ({ ...prev, subscriptions: false }));
    }
  }
);

export const fetchInvoicesAtom = atom(
  null,
  async (get, set, params: { page?: number; limit?: number } = {}) => {
    set(loadingAtom, prev => ({ ...prev, invoices: true }));
    set(errorAtom, null);
    
    try {
      const invoices = await billingService.getInvoices(params);
      set(invoicesAtom, invoices);
    } catch (error) {
      set(errorAtom, (error as Error).message);
    } finally {
      set(loadingAtom, prev => ({ ...prev, invoices: false }));
    }
  }
);

export const fetchPlansAtom = atom(
  null,
  async (get, set) => {
    set(loadingAtom, prev => ({ ...prev, plans: true }));
    set(errorAtom, null);
    
    try {
      const plans = await billingService.getPlans();
      set(plansAtom, plans);
    } catch (error) {
      set(errorAtom, (error as Error).message);
    } finally {
      set(loadingAtom, prev => ({ ...prev, plans: false }));
    }
  }
);

// Derived atoms
export const activeSubscriptionAtom = atom(
  (get) => {
    const subscriptions = get(subscriptionsAtom);
    return subscriptions.find(s => s.status === 'active') || null;
  }
);

export const unpaidInvoicesAtom = atom(
  (get) => {
    const invoices = get(invoicesAtom);
    return invoices.filter(i => i.status !== 'paid');
  }
);

export const totalUnpaidAmountAtom = atom(
  (get) => {
    const unpaidInvoices = get(unpaidInvoicesAtom);
    return unpaidInvoices.reduce((total, invoice) => total + invoice.amount, 0);
  }
);

// Filter atoms
export const invoiceFiltersAtom = atom({
  status: 'all',
  dateRange: null as { start: string; end: string } | null,
});

export const filteredInvoicesAtom = atom(
  (get) => {
    const invoices = get(invoicesAtom);
    const filters = get(invoiceFiltersAtom);
    
    return invoices.filter(invoice => {
      if (filters.status !== 'all' && invoice.status !== filters.status) {
        return false;
      }
      
      if (filters.dateRange) {
        const invoiceDate = new Date(invoice.created_at);
        const startDate = new Date(filters.dateRange.start);
        const endDate = new Date(filters.dateRange.end);
        
        if (invoiceDate < startDate || invoiceDate > endDate) {
          return false;
        }
      }
      
      return true;
    });
  }
);

// Loadable atoms for async operations
export const subscriptionsLoadableAtom = loadable(
  atom(async () => {
    return await billingService.getSubscriptions();
  })
);

export const plansLoadableAtom = loadable(
  atom(async () => {
    return await billingService.getPlans();
  })
);
```

### Jotai Component Usage

```tsx
// components/billing/BillingDashboardJotai.tsx
import React, { useEffect } from 'react';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import {
  subscriptionsAtom,
  invoicesAtom,
  plansAtom,
  currentSubscriptionAtom,
  loadingAtom,
  errorAtom,
  fetchSubscriptionsAtom,
  fetchInvoicesAtom,
  fetchPlansAtom,
  unpaidInvoicesAtom,
  totalUnpaidAmountAtom,
  filteredInvoicesAtom,
  invoiceFiltersAtom,
} from '../../atoms/billingAtoms';

export const BillingDashboardJotai: React.FC = () => {
  const subscriptions = useAtomValue(subscriptionsAtom);
  const invoices = useAtomValue(filteredInvoicesAtom);
  const plans = useAtomValue(plansAtom);
  const currentSubscription = useAtomValue(currentSubscriptionAtom);
  const unpaidInvoices = useAtomValue(unpaidInvoicesAtom);
  const totalUnpaidAmount = useAtomValue(totalUnpaidAmountAtom);
  const loading = useAtomValue(loadingAtom);
  const [error, setError] = useAtom(errorAtom);
  const [invoiceFilters, setInvoiceFilters] = useAtom(invoiceFiltersAtom);
  
  const fetchSubscriptions = useSetAtom(fetchSubscriptionsAtom);
  const fetchInvoices = useSetAtom(fetchInvoicesAtom);
  const fetchPlans = useSetAtom(fetchPlansAtom);

  useEffect(() => {
    const loadData = async () => {
      await Promise.all([
        fetchSubscriptions(),
        fetchInvoices({ limit: 10 }),
        fetchPlans(),
      ]);
    };

    loadData();
  }, [fetchSubscriptions, fetchInvoices, fetchPlans]);

  const handleFilterChange = (key: string, value: any) => {
    setInvoiceFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearError = () => setError(null);

  if (loading.subscriptions || loading.invoices || loading.plans) {
    return <div className="animate-pulse">Carregando dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex justify-between items-center">
            <p className="text-red-800">{error}</p>
            <button onClick={clearError} className="text-red-600 hover:text-red-800">
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Assinatura Ativa</h3>
          <p className="text-2xl font-bold text-gray-900">
            {currentSubscription ? currentSubscription.plan_name : 'Nenhuma'}
          </p>
          {currentSubscription && (
            <p className="text-sm text-gray-600">
              Status: {currentSubscription.status}
            </p>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Faturas Pendentes</h3>
          <p className="text-2xl font-bold text-orange-600">
            {unpaidInvoices.length}
          </p>
          <p className="text-sm text-gray-600">
            Total: ${totalUnpaidAmount.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-sm font-medium text-gray-500">Planos Disponíveis</h3>
          <p className="text-2xl font-bold text-blue-600">
            {plans.length}
          </p>
        </div>
      </div>

      {/* Invoice Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Filtros de Faturas</h3>
        <div className="flex gap-4">
          <select
            value={invoiceFilters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="rounded border-gray-300"
          >
            <option value="all">Todos os Status</option>
            <option value="paid">Pago</option>
            <option value="open">Aberto</option>
            <option value="overdue">Vencido</option>
          </select>
          
          <button
            onClick={() => setInvoiceFilters({ status: 'all', dateRange: null })}
            className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          >
            Limpar Filtros
          </button>
        </div>
      </div>

      {/* Invoices List */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">
          Faturas ({invoices.length})
        </h3>
        
        {invoices.length > 0 ? (
          <div className="space-y-3">
            {invoices.map(invoice => (
              <div key={invoice.id} className="flex justify-between items-center p-3 border rounded">
                <div>
                  <p className="font-semibold">#{invoice.number}</p>
                  <p className="text-sm text-gray-600">
                    {new Date(invoice.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">${invoice.amount}</p>
                  <span className={`px-2 py-1 rounded-full text-xs ${
                    invoice.status === 'paid' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {invoice.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">Nenhuma fatura encontrada</p>
        )}
      </div>
    </div>
  );
};
```

## 📝 Summary

Este guia documenta as principais integrações de gerenciamento de estado para a API de Billing:

### ✅ Redux Toolkit
- **RTK Query** para cache automático e sincronização
- **Slices** para gerenciamento de estado local
- **Middleware** personalizado para WebSocket

### ✅ Zustand
- **Store imutável** com Immer
- **Persistência** com localStorage
- **DevTools** para debugging
- **Selectors** computados para dados derivados

### ✅ Jotai
- **Atoms** granulares e composáveis
- **Loadable atoms** para operações assíncronas
- **Storage atoms** para persistência
- **Derived atoms** para valores computados

### 🎯 Escolha da Biblioteca
- **Redux Toolkit**: Projetos grandes, múltiplos desenvolvedores, padrões estabelecidos
- **Zustand**: Projetos médios, flexibilidade, menos boilerplate
- **Jotai**: Projetos que precisam de granularidade e composabilidade

Todas as implementações incluem:
- 🔄 Sincronização com API
- 💾 Persistência de dados importantes
- ⚡ Otimizações de performance
- 🐛 Debugging tools
- 🧪 Estratégias de teste

---

**Última atualização:** Dezembro 2024  
**Compatibilidade:** React 18+, TypeScript 4.5+
