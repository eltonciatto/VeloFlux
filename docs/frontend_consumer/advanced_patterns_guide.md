# Advanced Patterns & Best Practices - Billing API

## Visão Geral

Este guia documenta padrões avançados, otimizações de performance e melhores práticas para construir aplicações robustas que consomem a API de Billing do VeloFlux.

## 🏗️ Arquitetura Avançada

### Clean Architecture Pattern

```typescript
// domain/entities/Subscription.ts
export interface Subscription {
  id: string;
  planId: string;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  
  // Domain methods
  isActive(): boolean;
  canUpgrade(): boolean;
  canDowngrade(): boolean;
  getRemainingDays(): number;
}

export class SubscriptionEntity implements Subscription {
  constructor(
    public id: string,
    public planId: string,
    public status: SubscriptionStatus,
    public currentPeriodStart: Date,
    public currentPeriodEnd: Date,
    public cancelAtPeriodEnd: boolean = false
  ) {}

  isActive(): boolean {
    return this.status === SubscriptionStatus.ACTIVE;
  }

  canUpgrade(): boolean {
    return this.isActive() && !this.cancelAtPeriodEnd;
  }

  canDowngrade(): boolean {
    return this.isActive() && !this.cancelAtPeriodEnd;
  }

  getRemainingDays(): number {
    const now = new Date();
    const diffTime = this.currentPeriodEnd.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

### Repository Pattern

```typescript
// domain/repositories/BillingRepository.ts
export interface BillingRepository {
  getSubscriptions(): Promise<Subscription[]>;
  getSubscription(id: string): Promise<Subscription>;
  createSubscription(data: CreateSubscriptionData): Promise<Subscription>;
  updateSubscription(id: string, data: UpdateSubscriptionData): Promise<Subscription>;
  cancelSubscription(id: string): Promise<void>;
}

// infrastructure/repositories/ApiBillingRepository.ts
export class ApiBillingRepository implements BillingRepository {
  constructor(
    private apiClient: ApiClient,
    private mapper: BillingMapper
  ) {}

  async getSubscriptions(): Promise<Subscription[]> {
    const response = await this.apiClient.get('/subscriptions');
    return response.data.map(this.mapper.toDomain);
  }

  async getSubscription(id: string): Promise<Subscription> {
    const response = await this.apiClient.get(`/subscriptions/${id}`);
    return this.mapper.toDomain(response.data);
  }

  async createSubscription(data: CreateSubscriptionData): Promise<Subscription> {
    const payload = this.mapper.toCreatePayload(data);
    const response = await this.apiClient.post('/subscriptions', payload);
    return this.mapper.toDomain(response.data);
  }

  async updateSubscription(id: string, data: UpdateSubscriptionData): Promise<Subscription> {
    const payload = this.mapper.toUpdatePayload(data);
    const response = await this.apiClient.put(`/subscriptions/${id}`, payload);
    return this.mapper.toDomain(response.data);
  }

  async cancelSubscription(id: string): Promise<void> {
    await this.apiClient.delete(`/subscriptions/${id}`);
  }
}
```

### Use Cases / Interactors

```typescript
// application/usecases/UpgradeSubscriptionUseCase.ts
export class UpgradeSubscriptionUseCase {
  constructor(
    private billingRepository: BillingRepository,
    private planRepository: PlanRepository,
    private paymentService: PaymentService,
    private eventBus: EventBus
  ) {}

  async execute(subscriptionId: string, newPlanId: string): Promise<void> {
    // 1. Validate current subscription
    const subscription = await this.billingRepository.getSubscription(subscriptionId);
    if (!subscription.canUpgrade()) {
      throw new Error('Subscription cannot be upgraded');
    }

    // 2. Validate target plan
    const newPlan = await this.planRepository.getPlan(newPlanId);
    const currentPlan = await this.planRepository.getPlan(subscription.planId);
    
    if (newPlan.price <= currentPlan.price) {
      throw new Error('New plan must have higher price than current plan');
    }

    // 3. Calculate prorated amount
    const proratedAmount = this.calculateProratedAmount(subscription, newPlan, currentPlan);

    // 4. Process payment if needed
    if (proratedAmount > 0) {
      await this.paymentService.charge(subscription.customerId, proratedAmount);
    }

    // 5. Update subscription
    const updatedSubscription = await this.billingRepository.updateSubscription(
      subscriptionId,
      { planId: newPlanId }
    );

    // 6. Emit domain event
    await this.eventBus.publish(new SubscriptionUpgradedEvent(
      subscriptionId,
      currentPlan.id,
      newPlan.id,
      proratedAmount
    ));
  }

  private calculateProratedAmount(
    subscription: Subscription,
    newPlan: Plan,
    currentPlan: Plan
  ): number {
    const remainingDays = subscription.getRemainingDays();
    const totalDays = this.getTotalDaysInPeriod(subscription);
    const proratedRatio = remainingDays / totalDays;
    
    return (newPlan.price - currentPlan.price) * proratedRatio;
  }

  private getTotalDaysInPeriod(subscription: Subscription): number {
    const diffTime = subscription.currentPeriodEnd.getTime() - subscription.currentPeriodStart.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
}
```

## 🚀 Performance Optimizations

### Smart Caching Strategy

```typescript
// services/CacheService.ts
export class CacheService {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private observers = new Map<string, Set<(data: any) => void>>();

  set(key: string, data: any, ttl: number = 300000): void { // 5 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Notify observers
    const keyObservers = this.observers.get(key);
    if (keyObservers) {
      keyObservers.forEach(callback => callback(data));
    }
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  invalidate(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
        
        // Notify observers of invalidation
        const keyObservers = this.observers.get(key);
        if (keyObservers) {
          keyObservers.forEach(callback => callback(null));
        }
      }
    }
  }

  subscribe(key: string, callback: (data: any) => void): () => void {
    if (!this.observers.has(key)) {
      this.observers.set(key, new Set());
    }
    
    this.observers.get(key)!.add(callback);

    // Return unsubscribe function
    return () => {
      const keyObservers = this.observers.get(key);
      if (keyObservers) {
        keyObservers.delete(callback);
        if (keyObservers.size === 0) {
          this.observers.delete(key);
        }
      }
    };
  }
}

// Enhanced BillingService with caching
export class CachedBillingService {
  constructor(
    private apiClient: ApiClient,
    private cacheService: CacheService
  ) {}

  async getSubscriptions(): Promise<Subscription[]> {
    const cacheKey = 'subscriptions';
    const cached = this.cacheService.get<Subscription[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const subscriptions = await this.apiClient.get('/subscriptions');
    this.cacheService.set(cacheKey, subscriptions, 60000); // 1 minute cache
    
    return subscriptions;
  }

  async getUsage(tenantId: string, period: string = 'current'): Promise<UsageData> {
    const cacheKey = `usage:${tenantId}:${period}`;
    const cached = this.cacheService.get<UsageData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    const usage = await this.apiClient.get(`/tenant/${tenantId}/usage?period=${period}`);
    this.cacheService.set(cacheKey, usage, 30000); // 30 seconds cache for usage
    
    return usage;
  }

  invalidateSubscriptionCache(): void {
    this.cacheService.invalidate('^subscriptions');
  }

  invalidateUsageCache(tenantId?: string): void {
    const pattern = tenantId ? `^usage:${tenantId}` : '^usage:';
    this.cacheService.invalidate(pattern);
  }
}
```

### Virtual Scrolling for Large Lists

```tsx
// components/billing/VirtualizedInvoiceList.tsx
import React, { useMemo, useState, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';

interface VirtualizedInvoiceListProps {
  invoices: Invoice[];
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  onInvoiceClick: (invoice: Invoice) => void;
}

const InvoiceItem: React.FC<{
  index: number;
  style: React.CSSProperties;
  data: { invoices: Invoice[]; onInvoiceClick: (invoice: Invoice) => void };
}> = ({ index, style, data }) => {
  const { invoices, onInvoiceClick } = data;
  const invoice = invoices[index];

  if (!invoice) {
    return (
      <div style={style} className="flex items-center justify-center">
        <div className="animate-pulse bg-gray-200 rounded h-16 w-full" />
      </div>
    );
  }

  return (
    <div style={style} className="px-4 py-2">
      <div
        className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onInvoiceClick(invoice)}
      >
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-semibold">#{invoice.number}</h3>
            <p className="text-sm text-gray-600">
              {new Date(invoice.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-bold">${invoice.amount}</p>
            <span className={`px-2 py-1 rounded-full text-xs ${
              invoice.status === 'paid' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-yellow-100 text-yellow-800'
            }`}>
              {invoice.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const VirtualizedInvoiceList: React.FC<VirtualizedInvoiceListProps> = ({
  invoices,
  hasMore,
  onLoadMore,
  onInvoiceClick,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const itemData = useMemo(() => ({
    invoices,
    onInvoiceClick,
  }), [invoices, onInvoiceClick]);

  const loadMoreItems = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      await onLoadMore();
    } finally {
      setIsLoading(false);
    }
  }, [onLoadMore, isLoading]);

  const itemCount = hasMore ? invoices.length + 1 : invoices.length;
  const isItemLoaded = (index: number) => !!invoices[index];

  return (
    <div className="h-96 w-full">
      <InfiniteLoader
        isItemLoaded={isItemLoaded}
        itemCount={itemCount}
        loadMoreItems={loadMoreItems}
      >
        {({ onItemsRendered, ref }) => (
          <List
            ref={ref}
            height={384}
            itemCount={itemCount}
            itemSize={80}
            itemData={itemData}
            onItemsRendered={onItemsRendered}
          >
            {InvoiceItem}
          </List>
        )}
      </InfiniteLoader>
    </div>
  );
};
```

### Optimistic Updates

```typescript
// hooks/useOptimisticBilling.ts
export function useOptimisticBilling() {
  const [optimisticState, setOptimisticState] = useState<{
    subscriptions: Subscription[];
    pendingOperations: Map<string, 'create' | 'update' | 'delete'>;
  }>({
    subscriptions: [],
    pendingOperations: new Map(),
  });

  const updateSubscriptionOptimistic = useCallback(
    async (id: string, updates: Partial<Subscription>) => {
      // Optimistic update
      setOptimisticState(prev => ({
        ...prev,
        subscriptions: prev.subscriptions.map(sub =>
          sub.id === id ? { ...sub, ...updates } : sub
        ),
        pendingOperations: new Map(prev.pendingOperations).set(id, 'update'),
      }));

      try {
        // Actual API call
        const updated = await billingService.updateSubscription(id, updates);
        
        // Replace optimistic with real data
        setOptimisticState(prev => ({
          ...prev,
          subscriptions: prev.subscriptions.map(sub =>
            sub.id === id ? updated : sub
          ),
          pendingOperations: new Map(prev.pendingOperations).delete(id) || new Map(),
        }));

        return updated;
      } catch (error) {
        // Revert optimistic update
        setOptimisticState(prev => ({
          ...prev,
          subscriptions: prev.subscriptions, // Revert to original state
          pendingOperations: new Map(prev.pendingOperations).delete(id) || new Map(),
        }));
        
        throw error;
      }
    },
    []
  );

  const createSubscriptionOptimistic = useCallback(
    async (data: CreateSubscriptionData) => {
      const tempId = `temp-${Date.now()}`;
      const tempSubscription: Subscription = {
        id: tempId,
        ...data,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Optimistic create
      setOptimisticState(prev => ({
        ...prev,
        subscriptions: [...prev.subscriptions, tempSubscription],
        pendingOperations: new Map(prev.pendingOperations).set(tempId, 'create'),
      }));

      try {
        const created = await billingService.createSubscription(data);
        
        // Replace temp with real data
        setOptimisticState(prev => ({
          ...prev,
          subscriptions: prev.subscriptions.map(sub =>
            sub.id === tempId ? created : sub
          ),
          pendingOperations: new Map(prev.pendingOperations).delete(tempId) || new Map(),
        }));

        return created;
      } catch (error) {
        // Remove temp subscription
        setOptimisticState(prev => ({
          ...prev,
          subscriptions: prev.subscriptions.filter(sub => sub.id !== tempId),
          pendingOperations: new Map(prev.pendingOperations).delete(tempId) || new Map(),
        }));
        
        throw error;
      }
    },
    []
  );

  return {
    optimisticState,
    updateSubscriptionOptimistic,
    createSubscriptionOptimistic,
  };
}
```

## 🔐 Security Best Practices

### Token Management

```typescript
// services/TokenService.ts
export class TokenService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  private refreshPromise: Promise<string> | null = null;

  setTokens(accessToken: string, refreshToken: string, expiresIn: number): void {
    const expiryTime = Date.now() + (expiresIn * 1000);
    
    localStorage.setItem(TokenService.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(TokenService.REFRESH_TOKEN_KEY, refreshToken);
    localStorage.setItem(TokenService.TOKEN_EXPIRY_KEY, expiryTime.toString());
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem(TokenService.ACCESS_TOKEN_KEY);
    const expiry = localStorage.getItem(TokenService.TOKEN_EXPIRY_KEY);
    
    if (!token || !expiry) return null;
    
    // Check if token is expired (with 1 minute buffer)
    const isExpired = Date.now() >= (parseInt(expiry) - 60000);
    
    return isExpired ? null : token;
  }

  async getValidAccessToken(): Promise<string | null> {
    const currentToken = this.getAccessToken();
    
    if (currentToken) {
      return currentToken;
    }

    // Token is expired, try to refresh
    return this.refreshToken();
  }

  private async refreshToken(): Promise<string | null> {
    // Prevent multiple concurrent refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    const refreshToken = localStorage.getItem(TokenService.REFRESH_TOKEN_KEY);
    if (!refreshToken) {
      this.clearTokens();
      return null;
    }

    this.refreshPromise = this.performTokenRefresh(refreshToken);
    
    try {
      const newAccessToken = await this.refreshPromise;
      return newAccessToken;
    } finally {
      this.refreshPromise = null;
    }
  }

  private async performTokenRefresh(refreshToken: string): Promise<string | null> {
    try {
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      this.setTokens(data.access_token, data.refresh_token, data.expires_in);
      
      return data.access_token;
    } catch (error) {
      console.error('Token refresh error:', error);
      this.clearTokens();
      
      // Redirect to login
      window.location.href = '/login';
      
      return null;
    }
  }

  clearTokens(): void {
    localStorage.removeItem(TokenService.ACCESS_TOKEN_KEY);
    localStorage.removeItem(TokenService.REFRESH_TOKEN_KEY);
    localStorage.removeItem(TokenService.TOKEN_EXPIRY_KEY);
  }

  isAuthenticated(): boolean {
    return this.getAccessToken() !== null;
  }
}
```

### Request Interceptor with Auto-Retry

```typescript
// services/ApiClient.ts
export class ApiClient {
  private tokenService = new TokenService();
  private retryCount = new Map<string, number>();

  constructor(private baseURL: string) {}

  async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = `${options.method || 'GET'}-${endpoint}`;
    
    // Get valid token
    const token = await this.tokenService.getValidAccessToken();
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (response.status === 401) {
        // Token might be invalid, try refresh once
        const retries = this.retryCount.get(requestId) || 0;
        
        if (retries < 1) {
          this.retryCount.set(requestId, retries + 1);
          
          // Clear current token and retry
          this.tokenService.clearTokens();
          return this.request(endpoint, options);
        }
      }

      if (response.status === 429) {
        // Rate limited, implement exponential backoff
        const retries = this.retryCount.get(requestId) || 0;
        
        if (retries < 3) {
          this.retryCount.set(requestId, retries + 1);
          
          const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, delay));
          
          return this.request(endpoint, options);
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new ApiError(
          response.status,
          errorData.message || response.statusText,
          errorData
        );
      }

      // Clear retry count on success
      this.retryCount.delete(requestId);
      
      return response.json();
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      // Network error, implement retry logic
      const retries = this.retryCount.get(requestId) || 0;
      
      if (retries < 2) {
        this.retryCount.set(requestId, retries + 1);
        
        const delay = 1000 * (retries + 1);
        await new Promise(resolve => setTimeout(resolve, delay));
        
        return this.request(endpoint, options);
      }
      
      throw new ApiError(0, 'Network error', { originalError: error });
    }
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## 📊 Monitoring & Analytics

### Performance Monitoring

```typescript
// services/PerformanceMonitor.ts
export class PerformanceMonitor {
  private metrics = new Map<string, {
    count: number;
    totalTime: number;
    errors: number;
    lastError?: string;
  }>();

  trackApiCall<T>(
    operation: string,
    apiCall: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return apiCall()
      .then(result => {
        this.recordSuccess(operation, performance.now() - startTime);
        return result;
      })
      .catch(error => {
        this.recordError(operation, performance.now() - startTime, error.message);
        throw error;
      });
  }

  private recordSuccess(operation: string, duration: number): void {
    const metric = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    };

    this.metrics.set(operation, {
      ...metric,
      count: metric.count + 1,
      totalTime: metric.totalTime + duration,
    });
  }

  private recordError(operation: string, duration: number, errorMessage: string): void {
    const metric = this.metrics.get(operation) || {
      count: 0,
      totalTime: 0,
      errors: 0,
    };

    this.metrics.set(operation, {
      ...metric,
      count: metric.count + 1,
      totalTime: metric.totalTime + duration,
      errors: metric.errors + 1,
      lastError: errorMessage,
    });
  }

  getMetrics(): Record<string, {
    count: number;
    averageTime: number;
    errorRate: number;
    lastError?: string;
  }> {
    const result: Record<string, any> = {};
    
    for (const [operation, metric] of this.metrics.entries()) {
      result[operation] = {
        count: metric.count,
        averageTime: metric.count > 0 ? metric.totalTime / metric.count : 0,
        errorRate: metric.count > 0 ? metric.errors / metric.count : 0,
        lastError: metric.lastError,
      };
    }
    
    return result;
  }

  exportMetrics(): void {
    const metrics = this.getMetrics();
    
    // Send to analytics service
    if (window.gtag) {
      Object.entries(metrics).forEach(([operation, data]) => {
        window.gtag('event', 'api_performance', {
          event_category: 'API',
          event_label: operation,
          value: Math.round(data.averageTime),
          custom_map: {
            error_rate: data.errorRate,
            call_count: data.count,
          },
        });
      });
    }
    
    console.table(metrics);
  }
}
```

### Usage Analytics

```typescript
// services/AnalyticsService.ts
export class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private batchSize = 10;
  private flushInterval = 30000; // 30 seconds

  constructor(private apiClient: ApiClient) {
    // Auto-flush events periodically
    setInterval(() => this.flush(), this.flushInterval);
    
    // Flush on page unload
    window.addEventListener('beforeunload', () => this.flush());
  }

  track(eventName: string, properties: Record<string, any> = {}): void {
    const event: AnalyticsEvent = {
      name: eventName,
      properties: {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        user_agent: navigator.userAgent,
        ...properties,
      },
    };

    this.events.push(event);

    if (this.events.length >= this.batchSize) {
      this.flush();
    }
  }

  // Billing-specific tracking methods
  trackSubscriptionEvent(action: string, subscriptionId: string, planId?: string): void {
    this.track('billing_subscription', {
      action,
      subscription_id: subscriptionId,
      plan_id: planId,
    });
  }

  trackPaymentEvent(action: string, amount: number, currency: string = 'USD'): void {
    this.track('billing_payment', {
      action,
      amount,
      currency,
    });
  }

  trackUsageEvent(metric: string, value: number, threshold?: number): void {
    this.track('billing_usage', {
      metric,
      value,
      threshold,
      percentage: threshold ? (value / threshold) * 100 : undefined,
    });
  }

  trackApiUsage(endpoint: string, method: string, responseTime: number, status: number): void {
    this.track('api_usage', {
      endpoint,
      method,
      response_time: responseTime,
      status,
      success: status >= 200 && status < 300,
    });
  }

  private async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    try {
      await this.apiClient.post('/analytics/events', {
        events: eventsToSend,
      });
    } catch (error) {
      console.error('Failed to send analytics events:', error);
      // Put events back if sending failed
      this.events.unshift(...eventsToSend);
    }
  }
}

interface AnalyticsEvent {
  name: string;
  properties: Record<string, any>;
}
```

## 🧪 Testing Strategies

### Advanced Component Testing

```typescript
// __tests__/utils/testUtils.tsx
import React, { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BillingProvider } from '../contexts/BillingContext';

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  initialBillingState?: Partial<BillingState>;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    }),
    initialBillingState = {},
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BillingProvider initialState={initialBillingState}>
          {children}
        </BillingProvider>
      </QueryClientProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...renderOptions });
}

// Mock factories
export const createMockSubscription = (overrides: Partial<Subscription> = {}): Subscription => ({
  id: 'sub_123',
  plan_name: 'Pro',
  status: 'active',
  amount: 99.99,
  currency: 'USD',
  current_period_start: '2024-01-01T00:00:00Z',
  current_period_end: '2024-02-01T00:00:00Z',
  cancel_at_period_end: false,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
  ...overrides,
});

export const createMockInvoice = (overrides: Partial<Invoice> = {}): Invoice => ({
  id: 'inv_123',
  number: 'INV-001',
  status: 'paid',
  amount: 99.99,
  currency: 'USD',
  created_at: '2024-01-01T00:00:00Z',
  due_date: '2024-01-31T23:59:59Z',
  ...overrides,
});
```

### Integration Testing

```typescript
// __tests__/integration/billingFlow.test.tsx
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { renderWithProviders, createMockSubscription, createMockPlan } from '../utils/testUtils';
import { BillingDashboard } from '../../components/billing/BillingDashboard';

const server = setupServer(
  rest.get('/api/billing/subscriptions', (req, res, ctx) => {
    return res(ctx.json([createMockSubscription()]));
  }),
  
  rest.get('/api/billing/plans', (req, res, ctx) => {
    return res(ctx.json([
      createMockPlan({ id: 'plan_1', name: 'Starter', price: 49.99 }),
      createMockPlan({ id: 'plan_2', name: 'Pro', price: 99.99 }),
    ]));
  }),
  
  rest.post('/api/billing/subscriptions/:id/upgrade', (req, res, ctx) => {
    return res(ctx.json(createMockSubscription({ 
      plan_name: 'Pro',
      amount: 99.99 
    })));
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('Billing Flow Integration', () => {
  test('user can upgrade subscription successfully', async () => {
    const user = userEvent.setup();
    
    renderWithProviders(<BillingDashboard />);

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    // Click upgrade button
    const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
    await user.click(upgradeButton);

    // Select new plan
    const planSelector = screen.getByRole('dialog');
    const proOption = within(planSelector).getByText('Pro');
    await user.click(proOption);

    // Confirm upgrade
    const confirmButton = within(planSelector).getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify upgrade success
    await waitFor(() => {
      expect(screen.getByText('Pro')).toBeInTheDocument();
      expect(screen.getByText('$99.99')).toBeInTheDocument();
    });
  });

  test('handles upgrade failure gracefully', async () => {
    const user = userEvent.setup();
    
    // Mock API failure
    server.use(
      rest.post('/api/billing/subscriptions/:id/upgrade', (req, res, ctx) => {
        return res(ctx.status(400), ctx.json({ message: 'Payment failed' }));
      })
    );

    renderWithProviders(<BillingDashboard />);

    await waitFor(() => {
      expect(screen.getByText('Starter')).toBeInTheDocument();
    });

    const upgradeButton = screen.getByRole('button', { name: /upgrade/i });
    await user.click(upgradeButton);

    const planSelector = screen.getByRole('dialog');
    const proOption = within(planSelector).getByText('Pro');
    await user.click(proOption);

    const confirmButton = within(planSelector).getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    // Verify error handling
    await waitFor(() => {
      expect(screen.getByText('Payment failed')).toBeInTheDocument();
    });
    
    // Verify original plan is still shown
    expect(screen.getByText('Starter')).toBeInTheDocument();
  });
});
```

## 📱 Mobile Optimization

### Responsive Design Patterns

```tsx
// hooks/useResponsive.ts
export function useResponsive() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    isMobile: windowSize.width < 768,
    isTablet: windowSize.width >= 768 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
    width: windowSize.width,
    height: windowSize.height,
  };
}

// components/billing/ResponsiveBillingDashboard.tsx
export const ResponsiveBillingDashboard: React.FC = () => {
  const { isMobile, isTablet } = useResponsive();

  if (isMobile) {
    return <MobileBillingDashboard />;
  }

  if (isTablet) {
    return <TabletBillingDashboard />;
  }

  return <DesktopBillingDashboard />;
};

const MobileBillingDashboard: React.FC = () => {
  return (
    <div className="px-4 py-6 space-y-6">
      {/* Mobile-optimized layout */}
      <div className="space-y-4">
        <SubscriptionCardMobile />
        <QuickActionsMobile />
        <UsageSummaryMobile />
        <RecentInvoicesMobile />
      </div>
    </div>
  );
};
```

### Touch-Friendly Components

```tsx
// components/billing/TouchFriendlyInvoiceCard.tsx
export const TouchFriendlyInvoiceCard: React.FC<{ invoice: Invoice }> = ({ invoice }) => {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      className={`
        bg-white rounded-lg shadow-md p-6 mb-4 cursor-pointer select-none
        transition-all duration-150 ease-in-out
        ${isPressed ? 'scale-95 shadow-lg' : 'scale-100'}
        min-h-[80px] flex items-center justify-between
        active:scale-95 hover:shadow-lg
      `}
      onTouchStart={() => setIsPressed(true)}
      onTouchEnd={() => setIsPressed(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
    >
      <div className="flex-1">
        <h3 className="font-semibold text-lg">{invoice.number}</h3>
        <p className="text-gray-600 text-sm">
          {new Date(invoice.created_at).toLocaleDateString()}
        </p>
      </div>
      
      <div className="text-right">
        <p className="font-bold text-xl">${invoice.amount}</p>
        <span
          className={`
            px-3 py-1 rounded-full text-sm font-medium
            ${invoice.status === 'paid' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
            }
          `}
        >
          {invoice.status}
        </span>
      </div>
    </div>
  );
};
```

---

**Última atualização:** Dezembro 2024  
**Aplicabilidade:** Aplicações enterprise, alta performance, mobile-first  
**Compatibilidade:** React 18+, Vue 3+, Angular 15+, TypeScript 4.5+
