import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  BarChart3,
  TrendingUp,
  Activity,
  Brain,
  Download,
  RefreshCw,
  Settings,
  Grid,
  PieChart,
  LineChart,
  Target,
  Zap,
  Eye,
  Users,
  Server,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowUp,
  ArrowDown,
  Filter,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAdvancedAnalytics } from '@/hooks/useAdvancedAnalytics';
import { ResponsiveContainer, LineChart as RechartsLineChart, Line, BarChart as RechartsBarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, AreaChart, Area } from 'recharts';
import CustomDashboard from './CustomDashboard';
import MetricWidget from './MetricWidget';

const AdvancedAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const {
    metrics,
    insights,
    forecasts,
    anomalies,
    isLoading,
    error,
    timeRange,
    setTimeRange,
    refreshData,
    exportData,
    getKPIs,
    generateInsights,
    detectAnomalies
  } = useAdvancedAnalytics();

  const [activeTab, setActiveTab] = useState('overview');
  const [selectedMetric, setSelectedMetric] = useState('cpu_usage');
  const [refreshInterval, setRefreshInterval] = useState(30);

  // Auto-refresh effect
  useEffect(() => {
    if (refreshInterval > 0) {
      const interval = setInterval(() => {
        refreshData();
      }, refreshInterval * 1000);

      return () => clearInterval(interval);
    }
  }, [refreshInterval, refreshData]);

  // KPIs calculation
  const kpis = getKPIs();

  // Chart colors
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    try {
      await exportData(format);
      toast({
        title: t('analytics.export_success'),
        description: t('analytics.export_success_desc', { format: format.toUpperCase() }),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('analytics.export_error'),
        description: t('analytics.export_error_desc'),
        variant: 'destructive'
      });
    }
  };

  const renderKPICard = (kpi: any, index: number) => (
    <motion.div
      key={kpi.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="relative"
    >
      <Card className="relative overflow-hidden border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5" />
        <CardContent className="p-6 relative z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`p-3 rounded-lg bg-gradient-to-br ${kpi.gradient || 'from-blue-500/20 to-cyan-500/20'}`}>
                <kpi.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{kpi.label}</p>
                <p className="text-2xl font-bold text-white">{kpi.value}</p>
              </div>
            </div>
            <div className="text-right">
              <div className={`flex items-center space-x-1 ${
                kpi.trend === 'up' ? 'text-green-400' : 
                kpi.trend === 'down' ? 'text-red-400' : 'text-yellow-400'
              }`}>
                {kpi.trend === 'up' ? <ArrowUp className="h-4 w-4" /> : 
                 kpi.trend === 'down' ? <ArrowDown className="h-4 w-4" /> : 
                 <Activity className="h-4 w-4" />}
                <span className="text-sm font-medium">{kpi.change}</span>
              </div>
              <p className="text-xs text-muted-foreground">{t('analytics.vs_previous')}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderMetricChart = () => {
    if (!metrics[selectedMetric]) return null;

    const data = metrics[selectedMetric];
    
    return (
      <Card className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white">{t(`analytics.metrics.${selectedMetric}`)}</CardTitle>
            <Select value={selectedMetric} onValueChange={setSelectedMetric}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cpu_usage">{t('analytics.metrics.cpu_usage')}</SelectItem>
                <SelectItem value="memory_usage">{t('analytics.metrics.memory_usage')}</SelectItem>
                <SelectItem value="disk_usage">{t('analytics.metrics.disk_usage')}</SelectItem>
                <SelectItem value="network_io">{t('analytics.metrics.network_io')}</SelectItem>
                <SelectItem value="request_rate">{t('analytics.metrics.request_rate')}</SelectItem>
                <SelectItem value="error_rate">{t('analytics.metrics.error_rate')}</SelectItem>
                <SelectItem value="response_time">{t('analytics.metrics.response_time')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1F2937', 
                    border: '1px solid #374151', 
                    borderRadius: '8px',
                    color: '#F9FAFB'
                  }} 
                />
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke="#3B82F6"
                  fill="url(#gradient)"
                  strokeWidth={2}
                />
                <defs>
                  <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderInsightsCard = (insight: any, index: number) => (
    <motion.div
      key={insight.id}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
        <CardContent className="p-6">
          <div className="flex items-start space-x-4">
            <div className={`p-2 rounded-lg ${
              insight.type === 'optimization' ? 'bg-green-500/20' :
              insight.type === 'warning' ? 'bg-yellow-500/20' :
              insight.type === 'critical' ? 'bg-red-500/20' :
              'bg-blue-500/20'
            }`}>
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-white">{insight.title}</h4>
                <Badge variant={
                  insight.priority === 'high' ? 'destructive' :
                  insight.priority === 'medium' ? 'default' : 'secondary'
                }>
                  {insight.priority}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-3">{insight.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {t('analytics.confidence')}: {insight.confidence}%
                </span>
                <Button variant="outline" size="sm">
                  {t('analytics.view_details')}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">
            {t('analytics.advanced_analytics')}
          </h2>
          <p className="text-muted-foreground">
            {t('analytics.advanced_analytics_description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">{t('analytics.time_range.1h')}</SelectItem>
              <SelectItem value="6h">{t('analytics.time_range.6h')}</SelectItem>
              <SelectItem value="1d">{t('analytics.time_range.1d')}</SelectItem>
              <SelectItem value="7d">{t('analytics.time_range.7d')}</SelectItem>
              <SelectItem value="30d">{t('analytics.time_range.30d')}</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={() => refreshData()}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('analytics.tabs.overview')}
          </TabsTrigger>
          <TabsTrigger value="metrics" className="flex items-center gap-2">
            <LineChart className="h-4 w-4" />
            {t('analytics.tabs.metrics')}
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            {t('analytics.tabs.insights')}
          </TabsTrigger>
          <TabsTrigger value="custom" className="flex items-center gap-2">
            <Grid className="h-4 w-4" />
            {t('analytics.tabs.custom_dashboards')}
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* KPIs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, index) => renderKPICard(kpi, index))}
          </div>

          {/* Main Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderMetricChart()}
            
            {/* System Health Summary */}
            <Card className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">{t('analytics.system_health')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { label: t('analytics.cpu_status'), status: 'healthy', value: '23%' },
                    { label: t('analytics.memory_status'), status: 'warning', value: '78%' },
                    { label: t('analytics.disk_status'), status: 'healthy', value: '45%' },
                    { label: t('analytics.network_status'), status: 'healthy', value: '12%' }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{item.label}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-white">{item.value}</span>
                        {item.status === 'healthy' ? (
                          <CheckCircle className="h-4 w-4 text-green-400" />
                        ) : item.status === 'warning' ? (
                          <AlertTriangle className="h-4 w-4 text-yellow-400" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-400" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {renderMetricChart()}
            
            {/* Forecast Chart */}
            <Card className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
              <CardHeader>
                <CardTitle className="text-white">{t('analytics.forecast')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsLineChart data={forecasts}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="timestamp" stroke="#9CA3AF" />
                      <YAxis stroke="#9CA3AF" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151', 
                          borderRadius: '8px',
                          color: '#F9FAFB'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="actual" 
                        stroke="#3B82F6" 
                        strokeWidth={2} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="predicted" 
                        stroke="#10B981" 
                        strokeWidth={2} 
                        strokeDasharray="5 5"
                      />
                    </RechartsLineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{t('analytics.ai_insights')}</h3>
              {insights.map((insight, index) => renderInsightsCard(insight, index))}
            </div>
            
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white">{t('analytics.anomaly_detection')}</h3>
              {anomalies.length > 0 ? (
                anomalies.map((anomaly, index) => (
                  <Card key={anomaly.id} className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-white">{anomaly.metric}</p>
                          <p className="text-sm text-muted-foreground">{anomaly.description}</p>
                        </div>
                        <Badge variant="destructive">{anomaly.severity}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <Card className="border-white/10 bg-gradient-to-br from-slate-900/50 to-slate-800/30 backdrop-blur-xl">
                  <CardContent className="p-6 text-center">
                    <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                    <p className="text-white">{t('analytics.no_anomalies')}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Custom Dashboards Tab */}
        <TabsContent value="custom">
          <CustomDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedAnalytics;
