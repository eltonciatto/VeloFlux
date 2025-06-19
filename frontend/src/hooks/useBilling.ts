// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  billingApiClient,
  BillingAccount,
  UsageMetrics,
  PricingTier,
  BillingPeriod,
  Invoice,
  UsageAlert,
  BillingNotification,
  BillingCosts,
  PaymentMethod,
  BillingAddress
} from '@/lib/billingApi';

// Query keys for React Query caching
export const BILLING_QUERY_KEYS = {
  account: 'billing-account',
  usage: 'billing-usage',
  tiers: 'billing-tiers',
  periods: 'billing-periods',
  invoices: 'billing-invoices',
  alerts: 'billing-alerts',
  notifications: 'billing-notifications',
  estimate: 'billing-estimate',
  projections: 'billing-projections',
} as const;

/**
 * Hook to fetch billing account information
 */
export function useBillingAccount() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.account],
    queryFn: () => billingApiClient.getBillingAccount(),
    staleTime: 30000, // 30 seconds
    gcTime: 300000, // 5 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch billing account',
    },
  });
}

/**
 * Hook to fetch current usage metrics
 */
export function useCurrentUsage(refreshInterval: number = 60000) {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.usage, 'current'],
    queryFn: () => billingApiClient.getCurrentUsage(),
    refetchInterval: refreshInterval,
    staleTime: 30000,
    gcTime: 300000,
    retry: 3,
    meta: {
      errorMessage: 'Failed to fetch current usage',
    },
  });
}

/**
 * Hook to fetch usage history
 */
export function useUsageHistory(period: string = '30d') {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.usage, 'history', period],
    queryFn: () => billingApiClient.getUsageHistory(period),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch usage history',
    },
  });
}

/**
 * Hook to fetch pricing tiers
 */
export function usePricingTiers() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.tiers],
    queryFn: () => billingApiClient.getPricingTiers(),
    staleTime: 1800000, // 30 minutes
    gcTime: 3600000, // 1 hour
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch pricing tiers',
    },
  });
}

/**
 * Hook to fetch billing periods
 */
export function useBillingPeriods(limit: number = 12) {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.periods, limit],
    queryFn: () => billingApiClient.getBillingPeriods(limit),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch billing periods',
    },
  });
}

/**
 * Hook to fetch invoices
 */
export function useInvoices(limit: number = 20) {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.invoices, limit],
    queryFn: () => billingApiClient.getInvoices(limit),
    staleTime: 300000, // 5 minutes
    gcTime: 600000, // 10 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch invoices',
    },
  });
}

/**
 * Hook to fetch specific invoice
 */
export function useInvoice(invoiceId: string) {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.invoices, invoiceId],
    queryFn: () => billingApiClient.getInvoice(invoiceId),
    enabled: !!invoiceId,
    staleTime: 300000,
    gcTime: 600000,
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch invoice',
    },
  });
}

/**
 * Hook to fetch usage alerts
 */
export function useUsageAlerts() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.alerts],
    queryFn: () => billingApiClient.getUsageAlerts(),
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch usage alerts',
    },
  });
}

/**
 * Hook to fetch billing notifications
 */
export function useBillingNotifications() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.notifications],
    queryFn: () => billingApiClient.getBillingNotifications(),
    refetchInterval: 60000, // 1 minute
    staleTime: 30000,
    gcTime: 300000,
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch billing notifications',
    },
  });
}

/**
 * Hook to fetch estimated costs
 */
export function useEstimatedCosts() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.estimate],
    queryFn: () => billingApiClient.getEstimatedCosts(),
    refetchInterval: 300000, // 5 minutes
    staleTime: 60000, // 1 minute
    gcTime: 600000, // 10 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch estimated costs',
    },
  });
}

/**
 * Hook to fetch cost projections
 */
export function useCostProjections() {
  return useQuery({
    queryKey: [BILLING_QUERY_KEYS.projections],
    queryFn: () => billingApiClient.getCostProjections(),
    staleTime: 600000, // 10 minutes
    gcTime: 1800000, // 30 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch cost projections',
    },
  });
}

/**
 * Mutation hook to update pricing tier
 */
export function useUpdateTier() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (tierId: string) => billingApiClient.updateTier(tierId),
    onSuccess: () => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.account] });
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.estimate] });
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.projections] });
      
      toast.success('Pricing tier updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update pricing tier:', error);
      toast.error('Failed to update pricing tier');
    },
  });
}

/**
 * Mutation hook to update payment method
 */
export function useUpdatePaymentMethod() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (paymentMethod: Partial<PaymentMethod>) => billingApiClient.updatePaymentMethod(paymentMethod),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.account] });
      toast.success('Payment method updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update payment method:', error);
      toast.error('Failed to update payment method');
    },
  });
}

/**
 * Mutation hook to update billing address
 */
export function useUpdateBillingAddress() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (address: BillingAddress) => billingApiClient.updateBillingAddress(address),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.account] });
      toast.success('Billing address updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update billing address:', error);
      toast.error('Failed to update billing address');
    },
  });
}

/**
 * Mutation hook to update usage alert
 */
export function useUpdateUsageAlert() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (alert: Partial<UsageAlert>) => billingApiClient.updateUsageAlert(alert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.alerts] });
      toast.success('Usage alert updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update usage alert:', error);
      toast.error('Failed to update usage alert');
    },
  });
}

/**
 * Mutation hook to mark notification as read
 */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (notificationId: string) => billingApiClient.markNotificationRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.notifications] });
    },
    onError: (error) => {
      console.error('Failed to mark notification as read:', error);
    },
  });
}

/**
 * Mutation hook to download invoice
 */
export function useDownloadInvoice() {
  return useMutation({
    mutationFn: async (invoiceId: string) => {
      const blob = await billingApiClient.downloadInvoice(invoiceId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${invoiceId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      return { success: true };
    },
    onSuccess: () => {
      toast.success('Invoice downloaded successfully');
    },
    onError: (error) => {
      console.error('Failed to download invoice:', error);
      toast.error('Failed to download invoice');
    },
  });
}

/**
 * Mutation hook to generate usage report
 */
export function useGenerateUsageReport() {
  return useMutation({
    mutationFn: (period: string) => billingApiClient.generateUsageReport(period),
    onSuccess: (data) => {
      toast.success('Usage report generated successfully');
      // Optionally open the report URL
      window.open(data.reportUrl, '_blank');
    },
    onError: (error) => {
      console.error('Failed to generate usage report:', error);
      toast.error('Failed to generate usage report');
    },
  });
}

/**
 * Mutation hook to apply credits
 */
export function useApplyCredits() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ amount, reason }: { amount: number; reason: string }) => 
      billingApiClient.applyCredits(amount, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.account] });
      queryClient.invalidateQueries({ queryKey: [BILLING_QUERY_KEYS.estimate] });
      toast.success('Credits applied successfully');
    },
    onError: (error) => {
      console.error('Failed to apply credits:', error);
      toast.error('Failed to apply credits');
    },
  });
}

/**
 * Custom hook for billing dashboard data
 */
export function useBillingDashboard() {
  const { data: account, isLoading: accountLoading } = useBillingAccount();
  const { data: usage, isLoading: usageLoading } = useCurrentUsage();
  const { data: estimate, isLoading: estimateLoading } = useEstimatedCosts();
  const { data: projections, isLoading: projectionsLoading } = useCostProjections();
  const { data: alerts } = useUsageAlerts();
  const { data: notifications } = useBillingNotifications();

  const isLoading = accountLoading || usageLoading || estimateLoading || projectionsLoading;

  return {
    account,
    usage,
    estimate,
    projections,
    alerts,
    notifications,
    isLoading,
    // Computed values
    activeAlerts: alerts?.filter(alert => alert.triggered) || [],
    unreadNotifications: notifications?.filter(notification => !notification.read) || [],
    criticalAlerts: alerts?.filter(alert => alert.triggered && alert.currentUsage / alert.limit >= 0.9) || [],
  };
}

/**
 * Custom hook for usage analytics
 */
export function useUsageAnalytics(period: string = '30d') {
  const { data: history } = useUsageHistory(period);
  const { data: current } = useCurrentUsage();
  const { data: account } = useBillingAccount();

  const analytics = React.useMemo(() => {
    if (!history || !current || !account) return null;

    // Calculate trends
    const trends = {
      requests: history.length > 1 ? 
        ((current.requestCount - history[history.length - 2].requestCount) / history[history.length - 2].requestCount) * 100 : 0,
      dataTransfer: history.length > 1 ? 
        ((current.dataTransferMB - history[history.length - 2].dataTransferMB) / history[history.length - 2].dataTransferMB) * 100 : 0,
      aiPredictions: history.length > 1 ? 
        ((current.aiPredictions - history[history.length - 2].aiPredictions) / history[history.length - 2].aiPredictions) * 100 : 0,
    };

    // Calculate usage percentages
    const usagePercentages = {
      requests: (current.requestCount / account.currentTier.limits.requests) * 100,
      dataTransfer: (current.dataTransferMB / 1024 / account.currentTier.limits.dataTransferGB) * 100,
      aiPredictions: (current.aiPredictions / account.currentTier.limits.aiPredictions) * 100,
      storage: (current.storageMB / 1024 / account.currentTier.limits.storageGB) * 100,
    };

    return {
      trends,
      usagePercentages,
      totalUsage: current,
      historicalData: history,
    };
  }, [history, current, account]);

  return analytics;
}
