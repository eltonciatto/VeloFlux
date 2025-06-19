import { useState, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { useToast } from '@/hooks/use-toast';

export interface BillingExportOptions {
  format: 'pdf' | 'csv' | 'excel' | 'json';
  date_range: {
    start_date: string;
    end_date: string;
  };
  include_details: boolean;
  include_usage: boolean;
  include_transactions: boolean;
  include_invoices: boolean;
  group_by?: 'day' | 'week' | 'month';
  tenant_filter?: string[];
  service_filter?: string[];
}

export interface BillingReport {
  id: string;
  name: string;
  description: string;
  format: string;
  schedule: 'manual' | 'daily' | 'weekly' | 'monthly';
  recipients: string[];
  created_at: string;
  last_generated: string;
  status: 'active' | 'paused' | 'error';
  file_url?: string;
  options: BillingExportOptions;
}

export interface BillingTransaction {
  id: string;
  tenant_id: string;
  tenant_name: string;
  transaction_type: 'charge' | 'refund' | 'credit' | 'adjustment';
  amount: number;
  currency: string;
  description: string;
  service_type: string;
  usage_details: {
    bandwidth_gb: number;
    compute_hours: number;
    storage_gb: number;
    api_calls: number;
  };
  timestamp: string;
  invoice_id?: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
}

export interface BillingWebhookConfig {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  enabled: boolean;
  retry_config: {
    max_retries: number;
    retry_delay: number;
    exponential_backoff: boolean;
  };
  headers: Record<string, string>;
  created_at: string;
  last_triggered?: string;
  status: 'active' | 'inactive' | 'error';
}

export interface ExportProgress {
  id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress_percentage: number;
  estimated_completion?: string;
  file_url?: string;
  error_message?: string;
}

export function useBillingExport(tenantId: string, token: string) {
  const [reports, setReports] = useState<BillingReport[]>([]);
  const [transactions, setTransactions] = useState<BillingTransaction[]>([]);
  const [webhooks, setWebhooks] = useState<BillingWebhookConfig[]>([]);
  const [exportProgress, setExportProgress] = useState<Record<string, ExportProgress>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Generate billing export
  const generateExport = useCallback(async (options: BillingExportOptions): Promise<ExportProgress> => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/export`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(options)
      });

      toast({
        title: 'Exportação Iniciada',
        description: 'Seu relatório está sendo gerado. Você será notificado quando estiver pronto.',
        variant: 'default'
      });

      setExportProgress(prev => ({
        ...prev,
        [response.id]: response
      }));

      return response;
    } catch (error) {
      console.error('Error generating export:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao gerar exportação de billing',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  // Get export status
  const getExportStatus = useCallback(async (exportId: string): Promise<ExportProgress> => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/export/${exportId}/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setExportProgress(prev => ({
        ...prev,
        [exportId]: response
      }));

      return response;
    } catch (error) {
      console.error('Error getting export status:', error);
      throw error;
    }
  }, [tenantId, token]);

  // Download export file
  const downloadExport = useCallback(async (exportId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing/export/${exportId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${exportId}.${response.headers.get('content-type')?.split('/')[1] || 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download Concluído',
        description: 'Arquivo de exportação baixado com sucesso',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error downloading export:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao baixar arquivo de exportação',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Fetch billing reports
  const fetchReports = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/reports`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setReports(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar relatórios de billing',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Create scheduled report
  const createScheduledReport = useCallback(async (reportData: Omit<BillingReport, 'id' | 'created_at' | 'last_generated' | 'status'>) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/reports`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      toast({
        title: 'Sucesso',
        description: 'Relatório agendado criado com sucesso',
        variant: 'default'
      });

      await fetchReports(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error creating scheduled report:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar relatório agendado',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchReports]);

  // Update scheduled report
  const updateScheduledReport = useCallback(async (reportId: string, reportData: Partial<BillingReport>) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/reports/${reportId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(reportData)
      });

      toast({
        title: 'Sucesso',
        description: 'Relatório atualizado com sucesso',
        variant: 'default'
      });

      await fetchReports(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error updating scheduled report:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar relatório',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchReports]);

  // Delete scheduled report
  const deleteScheduledReport = useCallback(async (reportId: string) => {
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/billing/reports/${reportId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Relatório removido com sucesso',
        variant: 'default'
      });

      await fetchReports(); // Refresh the list
    } catch (error) {
      console.error('Error deleting scheduled report:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover relatório',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchReports]);

  // Fetch billing transactions
  const fetchTransactions = useCallback(async (filters?: {
    start_date?: string;
    end_date?: string;
    transaction_type?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) => {
    try {
      const queryParams = new URLSearchParams();
      if (filters?.start_date) queryParams.append('start_date', filters.start_date);
      if (filters?.end_date) queryParams.append('end_date', filters.end_date);
      if (filters?.transaction_type) queryParams.append('transaction_type', filters.transaction_type);
      if (filters?.status) queryParams.append('status', filters.status);
      if (filters?.limit) queryParams.append('limit', filters.limit.toString());
      if (filters?.offset) queryParams.append('offset', filters.offset.toString());

      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/transactions?${queryParams}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setTransactions(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar transações de billing',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Fetch webhook configurations
  const fetchWebhooks = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/billing/webhooks`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setWebhooks(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching webhooks:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar webhooks',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, toast]);

  // Create webhook
  const createWebhook = useCallback(async (webhookData: Omit<BillingWebhookConfig, 'id' | 'created_at' | 'last_triggered' | 'status'>) => {
    try {
      const response = await safeApiFetch(`/api/billing/webhooks`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(webhookData)
      });

      toast({
        title: 'Sucesso',
        description: 'Webhook criado com sucesso',
        variant: 'default'
      });

      await fetchWebhooks(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error creating webhook:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao criar webhook',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, toast, fetchWebhooks]);

  // Update webhook
  const updateWebhook = useCallback(async (webhookId: string, webhookData: Partial<BillingWebhookConfig>) => {
    try {
      const response = await safeApiFetch(`/api/billing/webhooks/${webhookId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(webhookData)
      });

      toast({
        title: 'Sucesso',
        description: 'Webhook atualizado com sucesso',
        variant: 'default'
      });

      await fetchWebhooks(); // Refresh the list
      return response;
    } catch (error) {
      console.error('Error updating webhook:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar webhook',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, toast, fetchWebhooks]);

  // Delete webhook
  const deleteWebhook = useCallback(async (webhookId: string) => {
    try {
      await safeApiFetch(`/api/billing/webhooks/${webhookId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Webhook removido com sucesso',
        variant: 'default'
      });

      await fetchWebhooks(); // Refresh the list
    } catch (error) {
      console.error('Error deleting webhook:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover webhook',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, toast, fetchWebhooks]);

  // Test webhook
  const testWebhook = useCallback(async (webhookId: string) => {
    try {
      const response = await safeApiFetch(`/api/billing/webhooks/${webhookId}/test`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Teste de Webhook',
        description: response.success ? 'Webhook testado com sucesso' : `Erro: ${response.message}`,
        variant: response.success ? 'default' : 'destructive'
      });

      return response;
    } catch (error) {
      console.error('Error testing webhook:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao testar webhook',
        variant: 'destructive'
      });
      throw error;
    }
  }, [token, toast]);

  // Export transaction summary
  const exportTransactionSummary = useCallback(async (options: BillingExportOptions) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/billing/export/summary`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(options)
      });

      if (options.format === 'json') {
        // For JSON, return data directly
        return response;
      } else {
        // For other formats, download file
        const blob = new Blob([response], { 
          type: options.format === 'pdf' ? 'application/pdf' : 
                options.format === 'csv' ? 'text/csv' : 
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `billing-summary-${new Date().toISOString().split('T')[0]}.${options.format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);

        toast({
          title: 'Exportação Concluída',
          description: 'Resumo de transações exportado com sucesso',
          variant: 'default'
        });
      }
    } catch (error) {
      console.error('Error exporting transaction summary:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao exportar resumo de transações',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  // Refresh all data
  const refreshAll = useCallback(async () => {
    try {
      await Promise.all([
        fetchReports(),
        fetchTransactions({ limit: 50 }),
        fetchWebhooks()
      ]);
    } catch (error) {
      console.error('Error refreshing billing data:', error);
    }
  }, [fetchReports, fetchTransactions, fetchWebhooks]);

  return {
    // Data
    reports,
    transactions,
    webhooks,
    exportProgress,
    
    // States
    loading,
    
    // Export Functions
    generateExport,
    getExportStatus,
    downloadExport,
    exportTransactionSummary,
    
    // Report Functions
    fetchReports,
    createScheduledReport,
    updateScheduledReport,
    deleteScheduledReport,
    
    // Transaction Functions
    fetchTransactions,
    
    // Webhook Functions
    fetchWebhooks,
    createWebhook,
    updateWebhook,
    deleteWebhook,
    testWebhook,
    
    // Utility Functions
    refreshAll
  };
}
