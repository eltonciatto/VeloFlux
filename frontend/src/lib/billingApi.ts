// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

export interface UsageMetrics {
  requestCount: number;
  dataTransferMB: number;
  aiPredictions: number;
  geoQueries: number;
  storageMB: number;
  bandwidthMB: number;
  computeMinutes: number;
  edgeLocations: number;
  timestamp: string;
  period: 'hourly' | 'daily' | 'monthly';
}

export interface PricingTier {
  id: string;
  name: string;
  description: string;
  limits: {
    requests: number;
    dataTransferGB: number;
    aiPredictions: number;
    geoQueries: number;
    storageGB: number;
    bandwidthGB: number;
    computeHours: number;
    edgeLocations: number;
  };
  pricing: {
    basePrice: number; // Monthly base price
    overageRates: {
      requests: number; // per 1000 requests
      dataTransferGB: number; // per GB
      aiPredictions: number; // per 1000 predictions
      geoQueries: number; // per 1000 queries
      storageGB: number; // per GB/month
      bandwidthGB: number; // per GB
      computeHours: number; // per hour
      edgeLocations: number; // per location/month
    };
  };
}

export interface BillingPeriod {
  id: string;
  startDate: string;
  endDate: string;
  status: 'current' | 'previous' | 'upcoming';
  usage: UsageMetrics;
  costs: BillingCosts;
  invoice?: Invoice;
}

export interface BillingCosts {
  basePrice: number;
  overageCosts: {
    requests: number;
    dataTransfer: number;
    aiPredictions: number;
    geoQueries: number;
    storage: number;
    bandwidth: number;
    compute: number;
    edgeLocations: number;
  };
  totalOverage: number;
  totalCost: number;
  currency: string;
}

export interface Invoice {
  id: string;
  number?: string;
  amount_due: number; // Backend uses amount_due
  currency: string;
  status: 'paid' | 'pending' | 'failed' | 'draft' | 'sent' | 'overdue' | 'cancelled';
  period_start: string; // Backend format
  period_end: string;
  created_at: string; // Backend format
  paid_at?: string;
  // New system extensions
  billingPeriod?: BillingPeriod;
  lineItems?: InvoiceLineItem[];
  subtotal?: number;
  tax?: number;
  discount?: number;
  total?: number;
  paymentMethod?: string;
  dueDate?: string;
  date?: string;
  paidAt?: string;
}

export interface InvoiceLineItem {
  id: string;
  description: string;
  category: 'base' | 'overage' | 'addon';
  quantity: number;
  unitPrice: number;
  total: number;
  period: string;
}

export interface BillingAccount {
  id: string;
  tenantId: string; // Changed from organizationId to match backend
  currentTier: PricingTier;
  billingEmail: string;
  paymentMethod: PaymentMethod;
  billingAddress: BillingAddress;
  currentPeriod: BillingPeriod;
  invoices: Invoice[];
  credits: number;
  currency: string;
  taxRate: number;
  autoPayEnabled: boolean;
  notifications: BillingNotification[];
  // Backend subscription data compatibility
  subscription?: {
    tenant_id: string;
    customer_id: string;
    subscription_id: string;
    plan: string;
    status: 'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete';
    current_period_start: string;
    current_period_end: string;
    cancel_at_period_end: boolean;
    trial_end?: string;
    created_at: string;
    updated_at: string;
  };
}

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'bank_transfer' | 'paypal' | 'crypto';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault: boolean;
  isValid: boolean;
}

export interface BillingAddress {
  id: string;
  company?: string;
  address1: string;
  address2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  taxId?: string;
}

export interface BillingNotification {
  id: string;
  type: 'usage_alert' | 'payment_due' | 'payment_failed' | 'limit_exceeded' | 'tier_upgrade';
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'error';
  timestamp: string;
  read: boolean;
  actionRequired: boolean;
}

export interface UsageAlert {
  id: string;
  metric: keyof UsageMetrics;
  threshold: number; // Percentage of limit (0-100)
  currentUsage: number;
  limit: number;
  triggered: boolean;
  timestamp: string;
}

class BillingApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get current billing account information (using existing subscriptions endpoint)
   */
  async getBillingAccount(): Promise<BillingAccount> {
    const subscriptionsData = await this.apiCall('/api/billing/subscriptions');
    const subscription = subscriptionsData.items?.[0];
    
    // Map to BillingAccount format
    return {
      id: subscription?.tenant_id || 'default',
      tenantId: subscription?.tenant_id || 'default',
      currentTier: {
        id: subscription?.plan || 'free',
        name: subscription?.plan || 'Free',
        description: 'Current plan',
        limits: {
          requests: 10000,
          dataTransferGB: 100,
          aiPredictions: 1000,
          geoQueries: 5000,
          storageGB: 10,
          bandwidthGB: 100,
          computeHours: 24,
          edgeLocations: 1,
        },
        pricing: {
          basePrice: subscription?.plan === 'pro' ? 29.99 : subscription?.plan === 'enterprise' ? 99.99 : 0,
          overageRates: {
            requests: 0.001,
            dataTransferGB: 0.10,
            aiPredictions: 0.01,
            geoQueries: 0.005,
            storageGB: 0.25,
            bandwidthGB: 0.10,
            computeHours: 0.50,
            edgeLocations: 5.00,
          },
        },
      },
      billingEmail: '',
      paymentMethod: { 
        id: 'default', 
        type: 'credit_card',
        isDefault: true,
        isValid: true,
        expiryMonth: 1,
        expiryYear: 2030,
        last4: '0000'
      } as PaymentMethod,
      billingAddress: { 
        id: 'default',
        address1: '',
        city: '',
        state: '',
        postalCode: '',
        country: ''
      } as BillingAddress,
      currentPeriod: { 
        id: 'current',
        startDate: new Date().toISOString(),
        endDate: new Date().toISOString(),
        status: 'current',
        usage: {
          requestCount: 0,
          dataTransferMB: 0,
          aiPredictions: 0,
          geoQueries: 0,
          storageMB: 0,
          bandwidthMB: 0,
          computeMinutes: 0,
          edgeLocations: 1,
          timestamp: new Date().toISOString(),
          period: 'monthly',
        },
        costs: {
          basePrice: 0,
          overageCosts: {
            requests: 0,
            dataTransfer: 0,
            aiPredictions: 0,
            geoQueries: 0,
            storage: 0,
            bandwidth: 0,
            compute: 0,
            edgeLocations: 0,
          },
          totalOverage: 0,
          totalCost: 0,
          currency: 'USD',
        }
      } as BillingPeriod,
      invoices: [],
      credits: 0,
      currency: 'USD',
      taxRate: 0,
      autoPayEnabled: false,
      notifications: [],
      subscription,
    };
  }

  /**
   * Get current usage metrics
   */
  async getCurrentUsage(): Promise<UsageMetrics> {
    // This would need to be implemented based on available tenant usage endpoints
    return {
      requestCount: 0,
      dataTransferMB: 0,
      aiPredictions: 0,
      geoQueries: 0,
      storageMB: 0,
      bandwidthMB: 0,
      computeMinutes: 0,
      edgeLocations: 1,
      timestamp: new Date().toISOString(),
      period: 'daily',
    };
  }

  /**
   * Get historical usage metrics
   */
  async getUsageHistory(period: string = '30d'): Promise<UsageMetrics[]> {
    // Mock data for now - would integrate with existing usage endpoints
    return [];
  }

  /**
   * Get available pricing tiers
   */
  async getPricingTiers(): Promise<PricingTier[]> {
    // Return standard VeloFlux tiers
    return [
      {
        id: 'free',
        name: 'Free',
        description: 'Perfect for getting started',
        limits: {
          requests: 10000,
          dataTransferGB: 1,
          aiPredictions: 100,
          geoQueries: 1000,
          storageGB: 1,
          bandwidthGB: 10,
          computeHours: 10,
          edgeLocations: 1,
        },
        pricing: {
          basePrice: 0,
          overageRates: {
            requests: 0.001,
            dataTransferGB: 0.10,
            aiPredictions: 0.01,
            geoQueries: 0.005,
            storageGB: 0.25,
            bandwidthGB: 0.10,
            computeHours: 0.50,
            edgeLocations: 5.00,
          },
        },
      },
      {
        id: 'pro',
        name: 'Pro',
        description: 'For growing businesses',
        limits: {
          requests: 1000000,
          dataTransferGB: 100,
          aiPredictions: 10000,
          geoQueries: 50000,
          storageGB: 100,
          bandwidthGB: 1000,
          computeHours: 100,
          edgeLocations: 5,
        },
        pricing: {
          basePrice: 29.99,
          overageRates: {
            requests: 0.0005,
            dataTransferGB: 0.08,
            aiPredictions: 0.008,
            geoQueries: 0.003,
            storageGB: 0.20,
            bandwidthGB: 0.08,
            computeHours: 0.40,
            edgeLocations: 4.00,
          },
        },
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'For large-scale applications',
        limits: {
          requests: 10000000,
          dataTransferGB: 1000,
          aiPredictions: 100000,
          geoQueries: 500000,
          storageGB: 1000,
          bandwidthGB: 10000,
          computeHours: 1000,
          edgeLocations: 50,
        },
        pricing: {
          basePrice: 99.99,
          overageRates: {
            requests: 0.0003,
            dataTransferGB: 0.05,
            aiPredictions: 0.005,
            geoQueries: 0.002,
            storageGB: 0.15,
            bandwidthGB: 0.05,
            computeHours: 0.30,
            edgeLocations: 3.00,
          },
        },
      },
    ];
  }

  /**
   * Update pricing tier (using existing subscription update)
   */
  async updateTier(tierId: string): Promise<{ success: boolean; message: string }> {
    const subscriptionsData = await this.apiCall('/api/billing/subscriptions');
    const subscription = subscriptionsData.items?.[0];
    
    if (subscription) {
      await this.apiCall(`/api/billing/subscriptions/${subscription.subscription_id}`, {
        method: 'PUT',
        body: JSON.stringify({ plan: tierId }),
      });
    } else {
      await this.apiCall('/api/billing/subscriptions', {
        method: 'POST',
        body: JSON.stringify({ plan: tierId, billing_cycle: 'monthly' }),
      });
    }
    
    return { success: true, message: 'Plan updated successfully' };
  }

  /**
   * Get billing periods
   */
  async getBillingPeriods(limit: number = 12): Promise<BillingPeriod[]> {
    // Mock data - would need to be implemented based on subscription periods
    return [];
  }

  /**
   * Get invoices (using existing endpoint)
   */
  async getInvoices(limit: number = 20): Promise<Invoice[]> {
    const invoicesData = await this.apiCall(`/api/billing/invoices?limit=${limit}`);
    return invoicesData.items || [];
  }

  /**
   * Get specific invoice
   */
  async getInvoice(invoiceId: string): Promise<Invoice> {
    const invoicesData = await this.apiCall('/api/billing/invoices');
    const invoice = invoicesData.items?.find((inv: any) => inv.id === invoiceId);
    if (!invoice) {
      throw new Error('Invoice not found');
    }
    return invoice;
  }

  /**
   * Download invoice PDF
   */
  async downloadInvoice(invoiceId: string): Promise<Blob> {
    // This would need to be implemented in the backend
    throw new Error('PDF download not yet implemented');
  }

  /**
   * Update payment method (placeholder)
   */
  async updatePaymentMethod(paymentMethod: Partial<PaymentMethod>): Promise<{ success: boolean; message: string }> {
    // This would need backend implementation
    return { success: true, message: 'Payment method updated (placeholder)' };
  }

  /**
   * Update billing address (placeholder)
   */
  async updateBillingAddress(address: BillingAddress): Promise<{ success: boolean; message: string }> {
    // This would need backend implementation
    return { success: true, message: 'Billing address updated (placeholder)' };
  }

  /**
   * Get usage alerts (placeholder)
   */
  async getUsageAlerts(): Promise<UsageAlert[]> {
    // Mock data - would need backend implementation
    return [];
  }

  /**
   * Create or update usage alert (placeholder)
   */
  async updateUsageAlert(alert: Partial<UsageAlert>): Promise<{ success: boolean; message: string }> {
    // This would need backend implementation
    return { success: true, message: 'Alert updated (placeholder)' };
  }

  /**
   * Get billing notifications (placeholder)
   */
  async getBillingNotifications(): Promise<BillingNotification[]> {
    // Mock data - would need backend implementation
    return [];
  }

  /**
   * Mark notification as read (placeholder)
   */
  async markNotificationRead(notificationId: string): Promise<{ success: boolean }> {
    // This would need backend implementation
    return { success: true };
  }

  /**
   * Get estimated costs for current usage (placeholder)
   */
  async getEstimatedCosts(): Promise<BillingCosts> {
    // Mock data - would need backend implementation
    return {
      basePrice: 0,
      overageCosts: {
        requests: 0,
        dataTransfer: 0,
        aiPredictions: 0,
        geoQueries: 0,
        storage: 0,
        bandwidth: 0,
        compute: 0,
        edgeLocations: 0,
      },
      totalOverage: 0,
      totalCost: 0,
      currency: 'USD',
    };
  }

  /**
   * Generate usage report (placeholder)
   */
  async generateUsageReport(period: string): Promise<{ success: boolean; reportUrl: string }> {
    // This would need backend implementation
    return { success: true, reportUrl: '#' };
  }

  /**
   * Get cost projections (placeholder)
   */
  async getCostProjections(): Promise<any> {
    // Mock data - would need backend implementation
    return {};
  }

  /**
   * Apply credits (placeholder)
   */
  async applyCredits(amount: number, reason: string): Promise<{ success: boolean; message: string }> {
    // This would need backend implementation
    return { success: true, message: 'Credits applied (placeholder)' };
  }
}

export const billingApiClient = new BillingApiClient();

/**
 * Utility functions for billing calculations and formatting
 */
export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
};

export const formatUsage = (value: number, type: keyof UsageMetrics): string => {
  switch (type) {
    case 'requestCount':
      return value >= 1000000 ? `${(value / 1000000).toFixed(1)}M` : 
             value >= 1000 ? `${(value / 1000).toFixed(1)}K` : 
             value.toString();
    case 'dataTransferMB':
    case 'storageMB':
    case 'bandwidthMB':
      return value >= 1024 ? `${(value / 1024).toFixed(1)} GB` : `${value.toFixed(1)} MB`;
    case 'computeMinutes':
      return value >= 60 ? `${(value / 60).toFixed(1)} hours` : `${value} minutes`;
    case 'aiPredictions':
    case 'geoQueries':
      return value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toString();
    case 'edgeLocations':
      return value.toString();
    default:
      return value.toString();
  }
};

export const calculateOverage = (usage: number, limit: number, rate: number): number => {
  return Math.max(0, usage - limit) * rate;
};

export const recommendTier = (usage: UsageMetrics, tiers: PricingTier[]): PricingTier | null => {
  for (const tier of tiers.sort((a, b) => a.pricing.basePrice - b.pricing.basePrice)) {
    if (
      usage.requestCount <= tier.limits.requests &&
      usage.dataTransferMB <= tier.limits.dataTransferGB * 1024 &&
      usage.aiPredictions <= tier.limits.aiPredictions &&
      usage.geoQueries <= tier.limits.geoQueries &&
      usage.storageMB <= tier.limits.storageGB * 1024 &&
      usage.bandwidthMB <= tier.limits.bandwidthGB * 1024 &&
      usage.computeMinutes <= tier.limits.computeHours * 60 &&
      usage.edgeLocations <= tier.limits.edgeLocations
    ) {
      return tier;
    }
  }
  return tiers[tiers.length - 1]; // Return highest tier if usage exceeds all limits
};
