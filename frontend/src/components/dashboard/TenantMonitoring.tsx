import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';
import { 
  BarChart3, 
  Activity, 
  Database, 
  Clock, 
  Users, 
  DollarSign,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  RefreshCw
} from 'lucide-react';

interface TenantMetrics {
  requests: {
    total: number;
    successful: number;
    failed: number;
    rate_per_minute: number;
    response_time_avg: number;
    response_time_p95: number;
    error_rate: number;
  };
  usage: {
    bandwidth_gb: number;
    storage_gb: number;
    compute_hours: number;
    api_calls: number;
    active_users: number;
  };
  billing: {
    current_period_cost: number;
    projected_monthly_cost: number;
    usage_percentage: number;
    billing_tier: string;
  };
  health: {
    status: 'healthy' | 'warning' | 'critical';
    uptime_percentage: number;
    last_incident?: string;
    active_alerts: number;
  };
}

interface TenantLog {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  metadata?: Record<string, unknown>;
}

const TenantMonitoring = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [metrics, setMetrics] = useState<TenantMetrics | null>(null);
  const [logs, setLogs] = useState<TenantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/metrics`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setMetrics(response);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar métricas do tenant',
        variant: 'destructive'
      });
    }
  }, [tenantId, token, toast]);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/logs?limit=100`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setLogs(response || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar logs do tenant',
        variant: 'destructive'
      });
    } finally {
      setLogsLoading(false);
    }
  }, [tenantId, token, toast]);

  const startAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
    }
    const interval = setInterval(() => {
      fetchMetrics();
    }, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
  }, [refreshInterval, fetchMetrics]);

  const stopAutoRefresh = useCallback(() => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  }, [refreshInterval]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchMetrics(), fetchLogs()]);
      setLoading(false);
      startAutoRefresh();
    };

    loadData();

    return () => {
      stopAutoRefresh();
    };
  }, [fetchMetrics, fetchLogs, startAutoRefresh, stopAutoRefresh]);

  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getLogLevelColor = (level: string) => {
    switch (level) {
      case 'error':
        return 'text-red-600 bg-red-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'info':
        return 'text-blue-600 bg-blue-100';
      case 'debug':
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento do Tenant</CardTitle>
          <CardDescription>Carregando métricas e logs...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!metrics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Monitoramento do Tenant</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Não foi possível carregar as métricas do tenant.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            Monitoramento do Tenant
          </h2>
          <p className="text-muted-foreground">
            Métricas em tempo real, logs e status de saúde
          </p>
        </div>
        <Button
          onClick={() => {
            fetchMetrics();
            fetchLogs();
          }}
          variant="outline"
          size="sm"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Health Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Status de Saúde
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${getHealthStatusColor(metrics.health.status)}`}>
                {metrics.health.status === 'healthy' ? <CheckCircle className="h-4 w-4 inline mr-1" /> : 
                 metrics.health.status === 'warning' ? <AlertTriangle className="h-4 w-4 inline mr-1" /> :
                 <AlertTriangle className="h-4 w-4 inline mr-1" />}
                {metrics.health.status}
              </span>
              <div className="text-sm text-muted-foreground">
                Uptime: {metrics.health.uptime_percentage.toFixed(2)}%
              </div>
            </div>
            {metrics.health.active_alerts > 0 && (
              <span className="text-red-600 font-medium">
                {metrics.health.active_alerts} alertas ativos
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="metrics" className="space-y-4">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="usage">Uso de Recursos</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="metrics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Total de Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(metrics.requests.total)}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(metrics.requests.rate_per_minute)} req/min
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {((metrics.requests.successful / metrics.requests.total) * 100).toFixed(1)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(metrics.requests.successful)} sucessos
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Tempo de Resposta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.requests.response_time_avg}ms</div>
                <div className="text-xs text-muted-foreground">
                  P95: {metrics.requests.response_time_p95}ms
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${metrics.requests.error_rate > 5 ? 'text-red-600' : 'text-green-600'}`}>
                  {metrics.requests.error_rate.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(metrics.requests.failed)} falhas
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Bandwidth
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.usage.bandwidth_gb.toFixed(2)} GB</div>
                <Progress value={65} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">65% do limite mensal</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Compute Hours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.usage.compute_hours.toFixed(1)}h</div>
                <Progress value={45} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">45% do limite mensal</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuários Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metrics.usage.active_users}</div>
                <div className="text-xs text-muted-foreground">
                  {formatNumber(metrics.usage.api_calls)} API calls
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="billing" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Custo Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.billing.current_period_cost)}</div>
                <div className="text-xs text-muted-foreground">Período atual</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Projeção Mensal
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(metrics.billing.projected_monthly_cost)}</div>
                <div className="text-xs text-muted-foreground">Baseado no uso atual</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plano Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold capitalize">{metrics.billing.billing_tier}</div>
                <Progress value={metrics.billing.usage_percentage} className="mt-2" />
                <div className="text-xs text-muted-foreground mt-1">
                  {metrics.billing.usage_percentage.toFixed(1)}% do limite
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Logs Recentes</CardTitle>
                <Button
                  onClick={fetchLogs}
                  variant="outline"
                  size="sm"
                  disabled={logsLoading}
                >
                  {logsLoading ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Atualizar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <Alert>
                    <AlertDescription>Nenhum log encontrado.</AlertDescription>
                  </Alert>
                ) : (
                  logs.map((log) => (
                    <div key={log.id} className="border rounded-lg p-3 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${getLogLevelColor(log.level)}`}>
                          {log.level.toUpperCase()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="text-sm">{log.message}</div>
                      <div className="text-xs text-muted-foreground">Source: {log.source}</div>
                      {log.metadata && Object.keys(log.metadata).length > 0 && (
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground">Metadata</summary>
                          <pre className="mt-1 bg-gray-50 p-2 rounded text-xs overflow-x-auto">
                            {JSON.stringify(log.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TenantMonitoring;
