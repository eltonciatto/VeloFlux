# Quick Reference & Checklist - Billing API Integration

## 🚀 Quick Start Checklist

### 📋 Pre-Implementation Checklist
- [ ] **API Access**: Confirm access to billing API endpoints
- [ ] **Authentication**: Obtain API tokens and tenant ID
- [ ] **Environment Setup**: Configure base URLs for dev/staging/prod
- [ ] **Dependencies**: Install required packages (see framework-specific sections)
- [ ] **TypeScript**: Setup TypeScript types from `billing_api_types.ts`

### 🔧 Basic Integration Steps
1. [ ] **Setup HTTP Client** with authentication headers
2. [ ] **Implement Basic CRUD** for subscriptions
3. [ ] **Add Error Handling** with user-friendly messages  
4. [ ] **Setup Loading States** for better UX
5. [ ] **Test API Integration** with unit/integration tests
6. [ ] **Add WebSocket Connection** for real-time updates
7. [ ] **Implement Caching Strategy** for performance
8. [ ] **Setup Monitoring** and analytics

### 🎯 Production Readiness Checklist
- [ ] **Security**: Token refresh, HTTPS, input validation
- [ ] **Performance**: Caching, lazy loading, virtual scrolling
- [ ] **Accessibility**: ARIA labels, keyboard navigation
- [ ] **Mobile**: Responsive design, touch-friendly
- [ ] **Testing**: Unit, integration, E2E tests
- [ ] **Error Handling**: Retry logic, fallbacks
- [ ] **Monitoring**: Analytics, performance metrics
- [ ] **Documentation**: API docs, component docs

## 📚 Quick API Reference

### 🔐 Authentication
```typescript
const headers = {
  'Authorization': `Bearer ${token}`,
  'X-Tenant-ID': tenantId,
  'Content-Type': 'application/json'
};
```

### 📊 Core Endpoints

#### Subscriptions
```typescript
// Get all subscriptions
GET /billing/subscriptions

// Get specific subscription  
GET /billing/subscriptions/{id}

// Create subscription
POST /billing/subscriptions
{ "plan_id": "plan_123", "billing_cycle": "monthly" }

// Update subscription
PUT /billing/subscriptions/{id}
{ "plan_id": "new_plan_456" }

// Cancel subscription
DELETE /billing/subscriptions/{id}
```

#### Invoices
```typescript
// Get invoices with pagination
GET /billing/invoices?page=1&limit=10

// Get specific invoice
GET /billing/invoices/{id}

// Download invoice PDF
GET /billing/invoices/{id}/download
```

#### Usage & Billing
```typescript
// Get tenant billing info
GET /billing/tenant/{tenant_id}/billing

// Get usage data
GET /billing/tenant/{tenant_id}/usage?period=current

// Create checkout session
POST /billing/tenant/{tenant_id}/checkout
{ "plan_id": "plan_123" }
```

#### Plans
```typescript
// Get available plans
GET /billing/plans
```

#### Transactions
```typescript
// Get transactions
GET /billing/transactions?page=1&limit=10
```

#### Usage Alerts
```typescript
// Get usage alerts
GET /billing/usage-alerts

// Create usage alert
POST /billing/usage-alerts
{ "metric": "api_calls", "threshold": 8000 }

// Update usage alert
PUT /billing/usage-alerts/{id}
{ "threshold": 9000 }
```

#### Notifications
```typescript
// Get notifications
GET /billing/notifications

// Mark notification as read
POST /billing/notifications/{id}/read
```

## 🧩 Code Snippets

### React Hook Example
```tsx
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useBilling() {
  const queryClient = useQueryClient();

  const subscriptions = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => billingService.getSubscriptions(),
  });

  const createSubscription = useMutation({
    mutationFn: billingService.createSubscription,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] });
    },
  });

  return { subscriptions, createSubscription };
}
```

### Vue Composable Example
```typescript
import { ref, computed } from 'vue';
import { useBillingStore } from '@/stores/billing';

export function useBilling() {
  const store = useBillingStore();
  const loading = ref(false);

  const activeSubscription = computed(() => 
    store.subscriptions.find(s => s.status === 'active')
  );

  const createSubscription = async (data) => {
    loading.value = true;
    try {
      await store.createSubscription(data);
    } finally {
      loading.value = false;
    }
  };

  return {
    subscriptions: store.subscriptions,
    activeSubscription,
    createSubscription,
    loading: readonly(loading),
  };
}
```

### Angular Service Example
```typescript
@Injectable()
export class BillingService {
  constructor(private http: HttpClient) {}

  getSubscriptions(): Observable<Subscription[]> {
    return this.http.get<Subscription[]>('/billing/subscriptions')
      .pipe(
        retry(2),
        catchError(this.handleError)
      );
  }

  createSubscription(data: CreateSubscriptionData): Observable<Subscription> {
    return this.http.post<Subscription>('/billing/subscriptions', data)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    console.error('Billing API Error:', error);
    return throwError(() => new Error('Billing operation failed'));
  }
}
```

## 🎨 UI Components Quick Reference

### Loading States
```tsx
// Simple loading spinner
{loading && <div className="animate-spin">⏳</div>}

// Skeleton loader
<div className="animate-pulse bg-gray-200 h-4 rounded" />

// Loading overlay
{loading && (
  <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
    <div className="animate-spin text-2xl">⏳</div>
  </div>
)}
```

### Error Display
```tsx
// Error message
{error && (
  <div className="bg-red-50 border border-red-200 p-4 rounded">
    <p className="text-red-800">{error}</p>
  </div>
)}

// Error with retry
{error && (
  <div className="text-center p-4">
    <p className="text-red-600 mb-2">{error}</p>
    <button onClick={retry} className="btn-primary">
      Try Again
    </button>
  </div>
)}
```

### Status Badges
```tsx
const getStatusColor = (status: string) => {
  const colors = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800', 
    canceled: 'bg-red-100 text-red-800',
    past_due: 'bg-yellow-100 text-yellow-800',
  };
  return colors[status] || colors.inactive;
};

<span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(status)}`}>
  {status}
</span>
```

### Progress Bars
```tsx
// Usage progress
const percentage = (current / limit) * 100;

<div className="w-full bg-gray-200 rounded-full h-2">
  <div 
    className={`h-2 rounded-full transition-all ${
      percentage > 90 ? 'bg-red-500' : 
      percentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
    }`}
    style={{ width: `${Math.min(percentage, 100)}%` }}
  />
</div>
```

## 🔌 WebSocket Quick Setup

### Connection
```typescript
const ws = new WebSocket('wss://api.veloflux.io/ws?token=' + token);

ws.onopen = () => {
  ws.send(JSON.stringify({ 
    type: 'subscribe', 
    channel: 'billing_events' 
  }));
};

ws.onmessage = (event) => {
  const data = JSON.parse(event.data);
  handleBillingEvent(data);
};
```

### Event Handling
```typescript
const handleBillingEvent = (data) => {
  switch (data.type) {
    case 'subscription_updated':
      updateSubscriptionInState(data.payload);
      break;
    case 'payment_succeeded':
      showSuccessNotification('Payment processed!');
      break;
    case 'usage_threshold_reached':
      showUsageAlert(data.payload);
      break;
  }
};
```

## 🧪 Testing Quick Reference

### Mock Data
```typescript
const mockSubscription = {
  id: 'sub_123',
  plan_name: 'Pro',
  status: 'active',
  amount: 99.99,
  current_period_end: '2024-12-31T23:59:59Z'
};

const mockInvoice = {
  id: 'inv_123',
  number: 'INV-001',
  status: 'paid',
  amount: 99.99,
  created_at: '2024-01-01T00:00:00Z'
};
```

### API Mocking
```typescript
// MSW handler
rest.get('/billing/subscriptions', (req, res, ctx) => {
  return res(ctx.json([mockSubscription]));
});

// Fetch mock
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve([mockSubscription]),
  })
);
```

### Component Testing
```tsx
test('displays subscription info', async () => {
  render(<BillingDashboard />);
  
  await waitFor(() => {
    expect(screen.getByText('Pro')).toBeInTheDocument();
    expect(screen.getByText('$99.99')).toBeInTheDocument();
  });
});
```

## 🚨 Common Issues & Solutions

### Issue: Token Expiration
**Solution**: Implement automatic token refresh
```typescript
if (response.status === 401) {
  const newToken = await refreshToken();
  return retryRequest(newToken);
}
```

### Issue: Rate Limiting
**Solution**: Exponential backoff retry
```typescript
const retryDelay = Math.pow(2, attempt) * 1000;
await new Promise(resolve => setTimeout(resolve, retryDelay));
```

### Issue: Stale Data
**Solution**: Cache invalidation strategy
```typescript
// Invalidate on mutation
onSuccess: () => {
  queryClient.invalidateQueries(['subscriptions']);
}

// Time-based invalidation
staleTime: 5 * 60 * 1000, // 5 minutes
```

### Issue: Memory Leaks
**Solution**: Cleanup subscriptions
```typescript
useEffect(() => {
  const subscription = subscribe(handler);
  return () => subscription.unsubscribe();
}, []);
```

## 📦 Package Dependencies

### React
```bash
npm install @tanstack/react-query axios
npm install --save-dev @testing-library/react msw
```

### Vue
```bash
npm install pinia axios
npm install --save-dev @vue/test-utils vitest
```

### Angular
```bash
npm install @angular/material rxjs
npm install --save-dev jasmine @angular/testing
```

### Universal
```bash
npm install date-fns numeral
npm install --save-dev typescript @types/node
```

## 🎯 Performance Tips

1. **Lazy Load**: Components, routes, data
2. **Virtualize**: Large lists (100+ items)
3. **Cache**: API responses, computed values
4. **Debounce**: Search, filter inputs
5. **Optimize**: Bundle size, tree shaking
6. **Monitor**: Core Web Vitals, API metrics

## 🔒 Security Checklist

- [ ] **HTTPS Only**: All API calls over HTTPS
- [ ] **Token Security**: Store securely, auto-refresh
- [ ] **Input Validation**: Client and server-side
- [ ] **CORS**: Proper CORS configuration
- [ ] **Rate Limiting**: Implement client-side limits
- [ ] **Error Handling**: Don't expose sensitive data

## 📱 Mobile Best Practices

- [ ] **Touch Targets**: Minimum 44px touch areas
- [ ] **Loading**: Fast loading, skeleton screens
- [ ] **Offline**: Graceful offline handling
- [ ] **Performance**: Optimize for slower networks
- [ ] **Gestures**: Swipe, pull-to-refresh
- [ ] **Accessibility**: Screen reader support

---

**Quick Links:**
- [Full Documentation](README.md)
- [TypeScript Types](billing_api_types.ts)
- [React Guide](react_components_guide.md)
- [Vue Guide](vue_components_guide.md)
- [Angular Guide](angular_components_guide.md)
- [WebSocket Guide](websocket_integration_guide.md)
- [Testing Guide](testing_guide.md)

**Last Updated:** December 2024  
**API Version:** v1.0
