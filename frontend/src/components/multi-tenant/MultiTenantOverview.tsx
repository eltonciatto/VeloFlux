import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useMultiTenant } from '@/hooks/useMultiTenant';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  RefreshCw,
  MoreVertical,
  Eye,
  Settings,
  Archive,
  BarChart3,
  PieChart,
  Globe,
  Shield,
  DollarSign,
  Zap,
  Database,
  Clock,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Types
interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive' | 'suspended' | 'maintenance';
  plan: 'free' | 'basic' | 'pro' | 'enterprise';
  created_at: string;
  last_activity: string;
  users_count: number;
  monthly_requests: number;
  storage_used: number;
  storage_limit: number;
  cpu_usage: number;
  memory_usage: number;
  monthly_cost: number;
  region: string;
  health_score: number;
  alerts_count: number;
  uptime: number;
  metrics: {
    requests_24h: number;
    errors_24h: number;
    latency_avg: number;
    bandwidth_used: number;
  };
}

interface TenantStats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_requests_24h: number;
  total_revenue: number;
  average_health: number;
  critical_alerts: number;
  resource_utilization: {
    cpu: number;
    memory: number;
    storage: number;
    bandwidth: number;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

const MultiTenantOverview: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const {
    tenants,
    stats,
    isLoading,
    error,
    selectedTenants,
    filters,
    sortBy,
    sortOrder,
    refreshData,
    setFilters,
    setSortBy,
    setSortOrder,
    selectTenant,
    selectAllTenants,
    deselectAllTenants,
    bulkUpdateTenants,
    exportTenantsData,
    getTenantMetrics,
    getTenantLogs
  } = useMultiTenant();

  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');
  const [showBulkActions, setShowBulkActions] = useState(false);

  // Filter and search tenants
  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.domain.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = !filters.status || tenant.status === filters.status;
    const matchesPlan = !filters.plan || tenant.plan === filters.plan;
    const matchesRegion = !filters.region || tenant.region === filters.region;
    
    return matchesSearch && matchesStatus && matchesPlan && matchesRegion;
  });

  // Sort tenants
  const sortedTenants = [...filteredTenants].sort((a, b) => {
    let aValue: any = a[sortBy as keyof Tenant];
    let bValue: any = b[sortBy as keyof Tenant];
    
    if (typeof aValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'inactive': return 'bg-gray-500';
      case 'suspended': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'inactive': return 'secondary';
      case 'suspended': return 'destructive';
      case 'maintenance': return 'outline';
      default: return 'secondary';
    }
  };

  const getPlanColor = (plan: string) => {
    switch (plan) {
      case 'free': return 'text-gray-600';
      case 'basic': return 'text-blue-600';
      case 'pro': return 'text-purple-600';
      case 'enterprise': return 'text-gold-600';
      default: return 'text-gray-600';
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleBulkAction = async (action: string) => {
    if (selectedTenants.length === 0) {
      toast({
        title: t('multi_tenant.error'),
        description: t('multi_tenant.no_tenants_selected'),
        variant: 'destructive'
      });
      return;
    }

    try {
      await bulkUpdateTenants(selectedTenants, { action });
      toast({
        title: t('multi_tenant.success'),
        description: t('multi_tenant.bulk_action_completed', { action, count: selectedTenants.length }),
        variant: 'default'
      });
      setShowBulkActions(false);
    } catch (error) {
      toast({
        title: t('multi_tenant.error'),
        description: t('multi_tenant.bulk_action_failed'),
        variant: 'destructive'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="border-red-200">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-semibold mb-2 text-red-700">
            {t('multi_tenant.error_loading')}
          </h3>
          <p className="text-red-600 text-center mb-4">{error}</p>
          <Button onClick={() => refreshData()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-8 w-8" />
            {t('multi_tenant.overview')}
          </h2>
          <p className="text-muted-foreground">
            {t('multi_tenant.overview_description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refreshData()}
          >
            <RefreshCw className="h-4 w-4" />
            {t('common.refresh')}
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportTenantsData()}
          >
            <BarChart3 className="h-4 w-4" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('multi_tenant.total_tenants')}
                </p>
                <p className="text-3xl font-bold">{stats?.total_tenants || 0}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  {stats?.active_tenants || 0} {t('multi_tenant.active')}
                </p>
              </div>
              <Building2 className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('multi_tenant.total_users')}
                </p>
                <p className="text-3xl font-bold">{stats?.total_users?.toLocaleString() || 0}</p>
                <p className="text-sm text-blue-600 flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {t('multi_tenant.across_tenants')}
                </p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('multi_tenant.requests_24h')}
                </p>
                <p className="text-3xl font-bold">{stats?.total_requests_24h?.toLocaleString() || 0}</p>
                <p className="text-sm text-purple-600 flex items-center">
                  <Activity className="h-4 w-4 mr-1" />
                  {t('multi_tenant.last_24h')}
                </p>
              </div>
              <Activity className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('multi_tenant.monthly_revenue')}
                </p>
                <p className="text-3xl font-bold">{formatCurrency(stats?.total_revenue || 0)}</p>
                <p className="text-sm text-green-600 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1" />
                  +12.5% {t('multi_tenant.vs_last_month')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">{t('multi_tenant.overview')}</TabsTrigger>
          <TabsTrigger value="tenants">{t('multi_tenant.tenants')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('multi_tenant.analytics')}</TabsTrigger>
          <TabsTrigger value="resources">{t('multi_tenant.resources')}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  {t('multi_tenant.system_health')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{t('multi_tenant.average_health')}</span>
                    <span className={`text-lg font-bold ${getHealthColor(stats?.average_health || 0)}`}>
                      {stats?.average_health || 0}%
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('multi_tenant.critical_alerts')}</span>
                      <span className="text-red-600 font-medium">{stats?.critical_alerts || 0}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{t('multi_tenant.healthy_tenants')}</span>
                      <span className="text-green-600 font-medium">
                        {tenants.filter(t => t.health_score >= 90).length}
                      </span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span>{t('multi_tenant.needs_attention')}</span>
                      <span className="text-yellow-600 font-medium">
                        {tenants.filter(t => t.health_score < 70).length}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Server className="h-5 w-5" />
                  {t('multi_tenant.resource_utilization')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats?.resource_utilization && Object.entries(stats.resource_utilization).map(([resource, usage]) => (
                    <div key={resource} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="capitalize">{t(`multi_tenant.${resource}`)}</span>
                        <span className="font-medium">{usage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            usage > 80 ? 'bg-red-500' : usage > 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${usage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {t('multi_tenant.recent_activity')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.slice(0, 5).map((tenant) => (
                  <div key={tenant.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(tenant.status)}`} />
                      <div>
                        <p className="font-medium">{tenant.name}</p>
                        <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {tenant.metrics.requests_24h.toLocaleString()} {t('multi_tenant.requests')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(tenant.last_activity).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tenants" className="space-y-6">
          {/* Filters and Search */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder={t('multi_tenant.search_tenants')}
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Select
                    value={filters.status || ''}
                    onValueChange={(value) => setFilters({ ...filters, status: value || undefined })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t('multi_tenant.all_status')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('multi_tenant.all_status')}</SelectItem>
                      <SelectItem value="active">{t('multi_tenant.active')}</SelectItem>
                      <SelectItem value="inactive">{t('multi_tenant.inactive')}</SelectItem>
                      <SelectItem value="suspended">{t('multi_tenant.suspended')}</SelectItem>
                      <SelectItem value="maintenance">{t('multi_tenant.maintenance')}</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select
                    value={filters.plan || ''}
                    onValueChange={(value) => setFilters({ ...filters, plan: value || undefined })}
                  >
                    <SelectTrigger className="w-[140px]">
                      <SelectValue placeholder={t('multi_tenant.all_plans')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">{t('multi_tenant.all_plans')}</SelectItem>
                      <SelectItem value="free">{t('multi_tenant.free')}</SelectItem>
                      <SelectItem value="basic">{t('multi_tenant.basic')}</SelectItem>
                      <SelectItem value="pro">{t('multi_tenant.pro')}</SelectItem>
                      <SelectItem value="enterprise">{t('multi_tenant.enterprise')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {selectedTenants.length > 0 && (
                <div className="mt-4 flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <span className="text-sm font-medium">
                    {selectedTenants.length} {t('multi_tenant.tenants_selected')}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBulkActions(!showBulkActions)}
                    >
                      {t('multi_tenant.bulk_actions')}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={deselectAllTenants}
                    >
                      {t('common.clear')}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bulk Actions */}
          <AnimatePresence>
            {showBulkActions && selectedTenants.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Card className="border-blue-200">
                  <CardContent className="p-4">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('activate')}
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        {t('multi_tenant.activate')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('suspend')}
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        {t('multi_tenant.suspend')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('maintenance')}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        {t('multi_tenant.maintenance')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('archive')}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {t('multi_tenant.archive')}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tenants Table */}
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="p-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedTenants.length === sortedTenants.length}
                          onChange={(e) => e.target.checked ? selectAllTenants() : deselectAllTenants()}
                          className="rounded"
                        />
                      </th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.tenant')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.status')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.plan')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.users')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.requests')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.health')}</th>
                      <th className="p-4 text-left font-medium">{t('multi_tenant.revenue')}</th>
                      <th className="p-4 text-left font-medium">{t('common.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTenants.map((tenant) => (
                      <tr key={tenant.id} className="border-b hover:bg-gray-50">
                        <td className="p-4">
                          <input
                            type="checkbox"
                            checked={selectedTenants.includes(tenant.id)}
                            onChange={() => selectTenant(tenant.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium">{tenant.name}</p>
                            <p className="text-sm text-muted-foreground">{tenant.domain}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <Badge variant={getStatusBadgeVariant(tenant.status)}>
                            {t(`multi_tenant.${tenant.status}`)}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${getPlanColor(tenant.plan)}`}>
                            {t(`multi_tenant.${tenant.plan}`)}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono">{tenant.users_count.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono">{tenant.metrics.requests_24h.toLocaleString()}</span>
                        </td>
                        <td className="p-4">
                          <span className={`font-medium ${getHealthColor(tenant.health_score)}`}>
                            {tenant.health_score}%
                          </span>
                        </td>
                        <td className="p-4">
                          <span className="font-mono">{formatCurrency(tenant.monthly_cost)}</span>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <Settings className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="ghost">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('multi_tenant.tenant_growth')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', tenants: 45, active: 42 },
                    { month: 'Feb', tenants: 52, active: 48 },
                    { month: 'Mar', tenants: 61, active: 57 },
                    { month: 'Apr', tenants: 68, active: 64 },
                    { month: 'May', tenants: 75, active: 71 },
                    { month: 'Jun', tenants: 82, active: 78 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="tenants" stroke="#8884d8" name={t('multi_tenant.total_tenants')} />
                    <Line type="monotone" dataKey="active" stroke="#82ca9d" name={t('multi_tenant.active_tenants')} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('multi_tenant.plan_distribution')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Free', value: 35, fill: '#8884d8' },
                        { name: 'Basic', value: 25, fill: '#82ca9d' },
                        { name: 'Pro', value: 30, fill: '#ffc658' },
                        { name: 'Enterprise', value: 10, fill: '#ff7300' }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label
                    >
                      {[].map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>{t('multi_tenant.revenue_analytics')}</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={[
                  { month: 'Jan', revenue: 12500, costs: 8500 },
                  { month: 'Feb', revenue: 14200, costs: 9200 },
                  { month: 'Mar', revenue: 16800, costs: 10100 },
                  { month: 'Apr', revenue: 18500, costs: 11300 },
                  { month: 'May', revenue: 21200, costs: 12800 },
                  { month: 'Jun', revenue: 24000, costs: 14200 }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area type="monotone" dataKey="revenue" stackId="1" stroke="#82ca9d" fill="#82ca9d" name={t('multi_tenant.revenue')} />
                  <Area type="monotone" dataKey="costs" stackId="2" stroke="#8884d8" fill="#8884d8" name={t('multi_tenant.costs')} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources" className="space-y-6">
          {/* Resource Usage */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('multi_tenant.cpu_usage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tenants.slice(0, 10).map(t => ({ 
                    name: t.name.slice(0, 10), 
                    usage: t.cpu_usage 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="usage" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('multi_tenant.memory_usage')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={tenants.slice(0, 10).map(t => ({ 
                    name: t.name.slice(0, 10), 
                    usage: t.memory_usage 
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value: number) => `${value}%`} />
                    <Bar dataKey="usage" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Storage Usage */}
          <Card>
            <CardHeader>
              <CardTitle>{t('multi_tenant.storage_usage')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tenants.slice(0, 8).map((tenant) => (
                  <div key={tenant.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">{tenant.name}</span>
                      <span>
                        {formatBytes(tenant.storage_used)} / {formatBytes(tenant.storage_limit)}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full ${
                          (tenant.storage_used / tenant.storage_limit) > 0.8 
                            ? 'bg-red-500' 
                            : (tenant.storage_used / tenant.storage_limit) > 0.6 
                            ? 'bg-yellow-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${(tenant.storage_used / tenant.storage_limit) * 100}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MultiTenantOverview;
