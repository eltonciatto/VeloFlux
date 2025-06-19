// 🚀 Dashboard Principal - VeloFlux Production Ready
// Agregação de todos os recursos com navegação moderna

import React, { useState, Suspense, lazy, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AdvancedErrorBoundary } from '@/components/ui/advanced-error-boundary';
import { 
  LayoutDashboard, 
  Brain, 
  Activity, 
  TrendingUp, 
  Server, 
  Shield, 
  CreditCard, 
  Zap,
  Settings,
  Monitor,
  Database,
  Users,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  Wifi,
  WifiOff,
  RefreshCw
} from 'lucide-react';

// 🚀 Lazy loading para performance
const BackendOverview = lazy(() => import('./BackendOverview'));
const AIInsights = lazy(() => import('./AIInsights'));
const AIMetricsDashboard = lazy(() => import('./AIMetricsDashboard'));
const PredictiveAnalytics = lazy(() => import('./PredictiveAnalytics'));
const ModelPerformance = lazy(() => import('./ModelPerformance'));
const HealthMonitor = lazy(() => import('./HealthMonitor'));
const MetricsView = lazy(() => import('./MetricsView'));
const ClusterStatus = lazy(() => import('./ClusterStatus'));
const BackendManager = lazy(() => import('./BackendManager'));
const SecuritySettings = lazy(() => import('./SecuritySettings'));
const BillingPanel = lazy(() => import('./BillingPanel'));
const RateLimitConfig = lazy(() => import('./RateLimitConfig'));
const AIConfiguration = lazy(() => import('./AIConfiguration'));
const ConfigManager = lazy(() => import('./ConfigManager'));
const PerformanceMonitor = lazy(() => import('./PerformanceMonitor'));

// 🚀 Novos componentes avançados
const BillingExportManager = lazy(() => import('./BillingExportManager'));
const SecurityMonitoringPanel = lazy(() => import('./SecurityMonitoringPanel'));
const NetworkTopology3D = lazy(() => import('./visualizations/NetworkTopology3D'));
const InteractiveAnalytics = lazy(() => import('./visualizations/InteractiveAnalytics'));
const RealTimePerformance = lazy(() => import('./visualizations/RealTimePerformance'));
const CommandPalette = lazy(() => import('./CommandPalette'));

// 🚀 Hooks avançados
import { useRealtimeWebSocket } from '@/hooks/useRealtimeWebSocket';
import { useAdvancedMetrics } from '@/hooks/useAdvancedMetrics';

// Loading component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="flex items-center gap-3">
      <RefreshCw className="h-6 w-6 animate-spin text-blue-500" />
      <span className="text-lg text-slate-400">Loading component...</span>
    </div>
  </div>
);

// Tab configuration
const TAB_CONFIG = [
  {
    id: 'overview',
    label: 'Visão Geral',
    icon: LayoutDashboard,
    component: BackendOverview,
    badge: null,
    color: 'blue'
  },
  {
    id: 'ai-insights',
    label: 'Insights de IA',
    icon: Brain,
    component: AIInsights,
    badge: 'NEW',
    color: 'purple'
  },
  {
    id: 'ai-metrics',
    label: 'Métricas de IA',
    icon: BarChart3,
    component: AIMetricsDashboard,
    badge: null,
    color: 'indigo'
  },
  {
    id: 'predictions',
    label: 'Predições',
    icon: TrendingUp,
    component: PredictiveAnalytics,
    badge: null,
    color: 'green'
  },
  {
    id: 'models',
    label: 'Modelos',
    icon: Database,
    component: ModelPerformance,
    badge: null,
    color: 'blue'
  },
  {
    id: 'health',
    label: 'Monitor de Saúde',
    icon: Activity,
    component: HealthMonitor,
    badge: null,
    color: 'red'
  },
  {
    id: 'metrics',
    label: 'Métricas',
    icon: BarChart3,
    component: MetricsView,
    badge: null,
    color: 'cyan'
  },
  {
    id: 'cluster',
    label: 'Cluster',
    icon: Monitor,
    component: ClusterStatus,
    badge: null,
    color: 'orange'
  },
  {
    id: 'backends',
    label: 'Backends',
    icon: Server,
    component: BackendManager,
    badge: null,
    color: 'blue'
  },
  {
    id: 'security',
    label: 'Segurança',
    icon: Shield,
    component: SecuritySettings,
    badge: null,
    color: 'red'
  },
  {
    id: 'billing',
    label: 'Billing',
    icon: CreditCard,
    component: BillingPanel,
    badge: null,
    color: 'green'
  },
  {
    id: 'rate-limit',
    label: 'Limitação de Taxa',
    icon: Zap,
    component: RateLimitConfig,
    badge: null,
    color: 'yellow'
  },
  {
    id: 'ai-config',
    label: 'Configuração de IA',
    icon: Brain,
    component: AIConfiguration,
    badge: null,
    color: 'purple'
  },
  {
    id: 'config',
    label: 'Configuração',
    icon: Settings,
    component: ConfigManager,
    badge: null,
    color: 'gray'
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: Activity,
    component: PerformanceMonitor,
    badge: 'PRO',
    color: 'emerald'
  },
  // 🚀 Novos recursos avançados
  {
    id: 'billing-export',
    label: 'Export Billing',
    icon: CreditCard,
    component: BillingExportManager,
    badge: 'NEW',
    color: 'green'
  },
  {
    id: 'security-monitoring',
    label: 'Monitoramento Segurança',
    icon: Shield,
    component: SecurityMonitoringPanel,
    badge: 'PRO',
    color: 'red'
  },
  {
    id: 'network-topology',
    label: 'Topologia 3D',
    icon: Wifi,
    component: NetworkTopology3D,
    badge: 'NEW',
    color: 'blue'
  },
  {
    id: 'interactive-analytics',
    label: 'Analytics Interativo',
    icon: BarChart3,
    component: InteractiveAnalytics,
    badge: 'PRO',
    color: 'indigo'
  },
  {
    id: 'realtime-performance',
    label: 'Performance Real-time',
    icon: Monitor,
    component: RealTimePerformance,
    badge: 'LIVE',
    color: 'orange'
  }
];

interface DashboardStats {
  totalBackends: number;
  healthyBackends: number;
  totalRequests: number;
  errorRate: number;
  avgResponseTime: number;
  aiModelsActive: number;
}

export function ProductionDashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  
  // 🚀 Hooks avançados
  const { connectionStatus, lastMessage } = useRealtimeWebSocket(process.env.REACT_APP_WS_URL || 'ws://localhost:8080/ws');
  const { metrics, loading: metricsLoading, error: metricsError } = useAdvancedMetrics();
  
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalBackends: 0,
    healthyBackends: 0,
    totalRequests: 0,
    errorRate: 0,
    avgResponseTime: 0,
    aiModelsActive: 0
  });

  // 🚀 Simular stats (em produção viria da API)
  useEffect(() => {
    // Simular carregamento de estatísticas
    const loadStats = async () => {
      // Simulação de dados - em produção seria uma API call
      setDashboardStats({
        totalBackends: 12,
        healthyBackends: 11,
        totalRequests: 1547892,
        errorRate: 0.12,
        avgResponseTime: 89,
        aiModelsActive: 3
      });
    };

    loadStats();
  }, []);

  // 🚀 Command Palette com Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getHealthStatus = () => {
    const healthPercentage = (dashboardStats.healthyBackends / dashboardStats.totalBackends) * 100;
    if (healthPercentage >= 95) return { status: 'excellent', color: 'green', label: 'Excelente' };
    if (healthPercentage >= 85) return { status: 'good', color: 'blue', label: 'Bom' };
    if (healthPercentage >= 70) return { status: 'warning', color: 'yellow', label: 'Atenção' };
    return { status: 'critical', color: 'red', label: 'Crítico' };
  };

  const healthStatus = getHealthStatus();

  const currentTab = TAB_CONFIG.find(tab => tab.id === activeTab);
  const CurrentComponent = currentTab?.component;

  return (
    <AdvancedErrorBoundary
      onError={(error, errorInfo) => {
        console.error('ProductionDashboard Error:', error, errorInfo);
      }}
    >
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        {/* Header */}
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="border-b border-slate-700 bg-slate-900/50 backdrop-blur-sm"
        >
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="h-10 w-10 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center"
                >
                  <LayoutDashboard className="h-6 w-6 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-2xl font-bold text-white">VeloFlux Dashboard</h1>
                  <p className="text-sm text-slate-400">Production Ready - Todos os Recursos Ativos</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Badge 
                    className={`bg-${healthStatus.color}-100 text-${healthStatus.color}-800 border-${healthStatus.color}-200`}
                  >
                    {healthStatus.label}
                  </Badge>
                  <span className="text-sm text-slate-400">
                    {dashboardStats.healthyBackends}/{dashboardStats.totalBackends} backends
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-green-400" />
                  <span className="text-sm text-slate-300">{dashboardStats.avgResponseTime}ms</span>
                </div>

                <div className="flex items-center gap-2">
                  <Brain className="h-4 w-4 text-purple-400" />
                  <span className="text-sm text-slate-300">{dashboardStats.aiModelsActive} IA ativos</span>
                </div>

                <Button variant="outline" size="sm" className="border-slate-600">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Atualizar
                </Button>
              </div>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="container mx-auto px-6 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tabs Navigation */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <TabsList className="grid grid-cols-5 lg:grid-cols-8 xl:grid-cols-15 gap-2 h-auto bg-slate-800/50 p-2">
                {TAB_CONFIG.map((tab, index) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className="flex flex-col items-center gap-1 p-3 data-[state=active]:bg-slate-700 data-[state=active]:text-white text-slate-400 hover:text-white transition-all"
                  >
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="relative"
                    >
                      <tab.icon className="h-5 w-5" />
                      {tab.badge && (
                        <Badge 
                          className="absolute -top-2 -right-2 text-xs px-1 py-0 h-auto bg-gradient-to-r from-blue-500 to-purple-600"
                        >
                          {tab.badge}
                        </Badge>
                      )}
                    </motion.div>
                    <span className="text-xs font-medium text-center leading-tight">
                      {tab.label}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </motion.div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
              {TAB_CONFIG.map((tab) => (
                <TabsContent
                  key={tab.id}
                  value={tab.id}
                  className="space-y-6 mt-6"
                >
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Suspense fallback={<LoadingSpinner />}>
                      <AdvancedErrorBoundary
                        fallback={
                          <Card>
                            <CardHeader>
                              <CardTitle className="flex items-center gap-2 text-red-500">
                                <AlertTriangle className="h-5 w-5" />
                                Erro no Componente {tab.label}
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Alert>
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription>
                                  Houve um erro ao carregar o componente {tab.label}. 
                                  Tente atualizar a página ou contate o suporte.
                                </AlertDescription>
                              </Alert>
                            </CardContent>
                          </Card>
                        }
                      >
                        {tab.component && <tab.component />}
                      </AdvancedErrorBoundary>
                    </Suspense>
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        </div>
        
        {/* 🚀 Command Palette */}
        {showCommandPalette && (
          <Suspense fallback={null}>
            <CommandPalette 
              isOpen={showCommandPalette}
              onClose={() => setShowCommandPalette(false)}
              onNavigate={(tabId) => {
                setActiveTab(tabId);
                setShowCommandPalette(false);
              }}
              tabs={TAB_CONFIG}
            />
          </Suspense>
        )}
        
        {/* 🚀 Indicador de Conexão WebSocket */}
        <div className="fixed bottom-4 right-4 z-50">
          <Badge 
            variant={connectionStatus === 'connected' ? 'default' : 'destructive'}
            className="flex items-center gap-2"
          >
            {connectionStatus === 'connected' ? (
              <>
                <Wifi className="h-3 w-3" />
                Conectado
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                Desconectado
              </>
            )}
          </Badge>
        </div>
      </div>
    </AdvancedErrorBoundary>
  );
}

export default ProductionDashboard;
