import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackendOverview } from '@/components/dashboard/BackendOverview';
import { HealthMonitor } from '@/components/dashboard/HealthMonitor';
import { MetricsView } from '@/components/dashboard/MetricsView';
import { ConfigManager } from '@/components/dashboard/ConfigManager';
import { BackendManager } from '@/components/dashboard/BackendManager';
import { ClusterStatus } from '@/components/dashboard/ClusterStatus';
import WAFConfig from '@/components/dashboard/WAFConfig';
import RateLimitConfig from '@/components/dashboard/RateLimitConfig';
import AIInsights from '@/components/dashboard/AIInsights';
import AIMetricsDashboard from '@/components/dashboard/AIMetricsDashboard';
import ModelPerformance from '@/components/dashboard/ModelPerformance';
import PredictiveAnalytics from '@/components/dashboard/PredictiveAnalytics';
import AIConfiguration from '@/components/dashboard/AIConfiguration';
import ModernBillingPanel from '@/components/billing/ModernBillingPanel';
import SecuritySettings from '@/components/dashboard/SecuritySettings';
import BillingExport from '@/components/billing/BillingExport';
import OrchestrationSettings from '@/components/dashboard/OrchestrationSettings';
import { useProductionData } from '@/hooks/useProductionData';
import { getThreshold } from '@/config/environment';
import MultiTenantOverview from '@/components/multi-tenant/MultiTenantOverview';
import AIHub from '@/components/ai/AIHub';
import { 
  Activity, 
  Server, 
  BarChart3, 
  Settings, 
  Users, 
  Crown, 
  Shield, 
  Gauge,
  Brain,
  Target,
  TrendingUp,
  Sliders,
  Sparkles,
  Zap,
  CreditCard,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Download,
  Bell,
  Lock,
  FileText,
  Layers,
  GitBranch,
  GitMerge,
  UserCheck,
  Building
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Production data hook
  const { 
    metrics, 
    alerts,
    loading: dataLoading 
  } = useProductionData();

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (alerts && alerts.length > 0) {
      setSystemHealth('warning');
      setActiveAlerts(alerts);
    } else {
      setSystemHealth('healthy');
      setActiveAlerts([]);
    }
  }, [alerts]);

  const tabsData = [
    {
      id: 'overview',
      label: t('dashboard.tabs.overview'),
      icon: Activity,
      gradient: 'from-blue-500 to-purple-600',
      component: <BackendOverview />
    },
    {
      id: 'health',
      label: t('dashboard.tabs.health'),
      icon: Gauge,
      gradient: 'from-green-500 to-teal-600',
      component: <HealthMonitor />
    },
    {
      id: 'metrics',
      label: t('dashboard.tabs.metrics'),
      icon: BarChart3,
      gradient: 'from-orange-500 to-red-600',
      component: <MetricsView />
    },
    {
      id: 'backends',
      label: t('dashboard.tabs.backends'),
      icon: Server,
      gradient: 'from-indigo-500 to-blue-600',
      component: <BackendManager />
    },
    {
      id: 'cluster',
      label: t('dashboard.tabs.cluster'),
      icon: Layers,
      gradient: 'from-purple-500 to-pink-600',
      component: <ClusterStatus />
    },
    {
      id: 'multi-tenant',
      label: t('dashboard.tabs.multiTenant'),
      icon: Building,
      gradient: 'from-cyan-500 to-blue-600',
      component: <MultiTenantOverview />
    },
    {
      id: 'waf',
      label: t('dashboard.tabs.waf'),
      icon: Shield,
      gradient: 'from-red-500 to-orange-600',
      component: <WAFConfig />
    },
    {
      id: 'rateLimit',
      label: t('dashboard.tabs.rateLimit'),
      icon: Clock,
      gradient: 'from-yellow-500 to-orange-600',
      component: <RateLimitConfig />
    },
    {
      id: 'ai-insights',
      label: t('dashboard.tabs.aiInsights'),
      icon: Brain,
      gradient: 'from-violet-500 to-purple-600',
      component: <AIInsights />
    },
    {
      id: 'ai-metrics',
      label: t('dashboard.tabs.aiMetrics'),
      icon: Target,
      gradient: 'from-pink-500 to-rose-600',
      component: <AIMetricsDashboard />
    },
    {
      id: 'model-performance',
      label: t('dashboard.tabs.modelPerformance'),
      icon: TrendingUp,
      gradient: 'from-emerald-500 to-green-600',
      component: <ModelPerformance />
    },
    {
      id: 'predictive',
      label: t('dashboard.tabs.predictive'),
      icon: Sparkles,
      gradient: 'from-amber-500 to-yellow-600',
      component: <PredictiveAnalytics />
    },
    {
      id: 'ai-config',
      label: t('dashboard.tabs.aiConfig'),
      icon: Sliders,
      gradient: 'from-teal-500 to-cyan-600',
      component: <AIConfiguration />
    },
    {
      id: 'ai-hub',
      label: 'Hub IA Premium',
      icon: Zap,
      gradient: 'from-purple-500 to-indigo-600',
      component: <AIHub />
    },
    {
      id: 'billing',
      label: t('dashboard.tabs.billing'),
      icon: CreditCard,
      gradient: 'from-green-500 to-emerald-600',
      component: <ModernBillingPanel />
    },
    {
      id: 'security',
      label: t('dashboard.tabs.security'),
      icon: Lock,
      gradient: 'from-red-500 to-pink-600',
      component: <SecuritySettings />
    },
    {
      id: 'export',
      label: t('dashboard.tabs.export'),
      icon: Download,
      gradient: 'from-gray-500 to-slate-600',
      component: <BillingExport />
    },
    {
      id: 'orchestration',
      label: t('dashboard.tabs.orchestration'),
      icon: GitMerge,
      gradient: 'from-blue-500 to-indigo-600',
      component: <OrchestrationSettings />
    },
    {
      id: 'config',
      label: t('dashboard.tabs.config'),
      icon: Settings,
      gradient: 'from-gray-500 to-gray-600',
      component: <ConfigManager />
    }
  ];

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
          <p className="mt-4 text-gray-600">Carregando dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t('dashboard.title')}
              </h1>
              <p className="text-gray-600 mt-1">
                {t('dashboard.subtitle')}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <Badge 
                variant={systemHealth === 'healthy' ? 'default' : systemHealth === 'warning' ? 'secondary' : 'destructive'}
                className="px-3 py-1"
              >
                {systemHealth === 'healthy' && <CheckCircle className="w-4 h-4 mr-1" />}
                {systemHealth === 'warning' && <AlertTriangle className="w-4 h-4 mr-1" />}
                {systemHealth === 'critical' && <AlertTriangle className="w-4 h-4 mr-1" />}
                {t(`dashboard.health.${systemHealth}`)}
              </Badge>
              
              {activeAlerts.length > 0 && (
                <Badge variant="destructive" className="px-3 py-1">
                  <Bell className="w-4 h-4 mr-1" />
                  {activeAlerts.length} alertas
                </Badge>
              )}
              
              <Button variant="outline" size="sm">
                <RefreshCw className="w-4 h-4 mr-2" />
                Atualizar
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="relative mb-6">
            <TabsList className="grid w-full h-auto p-1 bg-white/50 backdrop-blur-sm border border-white/20 rounded-xl overflow-x-auto">
              {tabsData.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      relative group min-w-0 px-4 py-3 text-sm font-medium transition-all duration-300 rounded-lg
                      ${isActive 
                        ? 'bg-white shadow-lg text-gray-900 border border-gray-200' 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                      }
                    `}
                  >
                    <div className="relative flex items-center gap-2 z-10">
                      <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <span className="font-medium whitespace-nowrap">{tab.label}</span>
                      
                      {/* Alert indicators */}
                      {tab.id === 'health' && activeAlerts.length > 0 && (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      )}
                      {tab.id === 'metrics' && systemHealth === 'critical' && (
                        <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                      )}
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content with Animations */}
          <AnimatePresence mode="wait">
            {tabsData.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="mt-0">
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  {tab.component}
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
