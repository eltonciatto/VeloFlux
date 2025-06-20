import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import AdvancedMetricsPanel from '@/components/dashboard/AdvancedMetricsPanel';
import RealTimeSystemMonitor from '@/components/dashboard/RealTimeSystemMonitor';
import { useProductionData } from '@/hooks/useProductionData';
import { getThreshold } from '@/config/environment';
import MultiTenantOverview from '@/components/multi-tenant/MultiTenantOverview';
import AIHub from '@/components/ai/AIHub';
import { DashboardErrorBoundary } from '@/components/ui/DashboardErrorBoundary';
import StarField from '@/components/StarField';
import FloatingParticles from '@/components/FloatingParticles';
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
  Building,
  Network,
  Globe,
  ChevronDown,
  Cpu,
  HardDrive,
  Wifi
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeAlerts, setActiveAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [5, -5]);
  const rotateY = useTransform(mouseX, [-300, 300], [-5, 5]);

  // Enhanced real-time stats with more detailed metrics
  const [realtimeStats, setRealtimeStats] = useState({
    activeConnections: 847,
    requestsPerSecond: 2847,
    cpuUsage: 23,
    memoryUsage: 67,
    networkThroughput: 342,
    activeBackends: 12,
    responseTime: 89,
    errorRate: 0.2,
    uptime: 99.97,
    totalRequests: 2847291,
    dataTransferred: 847.3,
    cacheHitRate: 87.5,
    concurrentUsers: 1205,
    avgSessionDuration: 24.7,
    peakConnections: 1580,
    systemLoad: 1.2
  });

  // Performance trends with more granular data
  const [performanceTrends, setPerformanceTrends] = useState({
    cpuTrend: { direction: 'stable', change: 2 },
    memoryTrend: { direction: 'increasing', change: 8 },
    responseTrend: { direction: 'decreasing', change: -12 },
    throughputTrend: { direction: 'increasing', change: 18 },
    errorTrend: { direction: 'decreasing', change: -45 },
    uptimeTrend: { direction: 'stable', change: 0 }
  });

  // Enhanced quick actions with status and progress
  const [quickActions, setQuickActions] = useState([
    { 
      id: 'health_check', 
      label: 'Health Check', 
      icon: Activity, 
      status: 'ready',
      description: 'Verificar saúde dos serviços',
      lastRun: '2 min ago'
    },
    { 
      id: 'backup', 
      label: 'Backup', 
      icon: Download, 
      status: 'ready',
      description: 'Criar backup do sistema',
      lastRun: '1 hour ago'
    },
    { 
      id: 'scale', 
      label: 'Auto Scale', 
      icon: TrendingUp, 
      status: 'active',
      description: 'Escalamento automático ativo',
      lastRun: 'Running'
    },
    { 
      id: 'alerts', 
      label: 'Alerts', 
      icon: Bell, 
      status: 'attention',
      description: 'Verificar alertas ativos',
      lastRun: 'Just now'
    },
    {
      id: 'security_scan',
      label: 'Security Scan',
      icon: Shield,
      status: 'ready',
      description: 'Executar varredura de segurança',
      lastRun: '30 min ago'
    },
    {
      id: 'performance_test',
      label: 'Performance Test',
      icon: Gauge,
      status: 'ready',
      description: 'Teste de performance',
      lastRun: '2 hours ago'
    }
  ]);

  // Production data hook with error handling
  const { 
    metrics, 
    alerts,
    loading: dataLoading,
    error: dataError 
  } = useProductionData();

  // Mouse tracking for parallax effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set(e.clientX - centerX);
        mouseY.set(e.clientY - centerY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Animate stats on load
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1200);
    
    // Simulate real-time data updates
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        activeConnections: Math.floor(Math.random() * 1000) + 500,
        requestsPerSecond: Math.floor(Math.random() * 5000) + 2000,
        cpuUsage: Math.floor(Math.random() * 30) + 20,
        memoryUsage: Math.floor(Math.random() * 40) + 30,
        networkThroughput: Math.floor(Math.random() * 500) + 200,
        activeBackends: Math.floor(Math.random() * 5) + 8
      }));
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
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

  // Safe component wrapper
  const SafeComponent = ({ children }: { children: React.ReactNode }) => {
    try {
      return <>{children}</>;
    } catch (error) {
      console.error('Component error:', error);
      return (
        <div className="p-4 text-center text-gray-500">
          <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
          <p>Erro ao carregar componente</p>
        </div>
      );
    }
  };

  const tabsData = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: Home,
      gradient: 'from-blue-500 via-purple-500 to-indigo-600',
      description: 'Painel principal e visão panorâmica',
      badge: systemHealth === 'healthy' ? 'Saudável' : systemHealth === 'warning' ? 'Atenção' : 'Crítico',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <BackendOverview />
            <ClusterStatus />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AdvancedMetricsPanel />
            </div>
            <div>
              <AIInsights />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Activity,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      description: 'Métricas de performance em tempo real',
      badge: `${realtimeStats.responseTime}ms`,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <HealthMonitor />
            <MetricsView />
          </div>
          <RealTimeSystemMonitor />
        </div>
      )
    },
    {
      id: 'monitoring',
      label: 'Monitoramento',
      icon: Eye,
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      description: 'Monitoramento avançado do sistema',
      badge: `${realtimeStats.activeBackends} backends`,
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <AIMetricsDashboard />
            </div>
            <div className="space-y-6">
              <ModelPerformance />
              <PredictiveAnalytics />
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart,
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-600',
      description: 'Análises avançadas e insights de IA',
      badge: 'AI Powered',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MultiTenantOverview />
            <ModernBillingPanel />
          </div>
          <AIHub />
        </div>
      )
    },
    {
      id: 'management',
      label: 'Gerenciamento',
      icon: Settings,
      gradient: 'from-indigo-500 via-blue-500 to-purple-600',
      description: 'Configurações e administração',
      badge: 'Admin',
      component: (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <BackendManager />
            <ConfigManager />
            <SecuritySettings />
            <WAFConfig />
            <RateLimitConfig />
            <OrchestrationSettings />
          </div>
        </div>
      )
    }
  ];

  // Status indicator component
  const StatusIndicator = ({ status }: { status: string }) => {
    const colors = {
      healthy: 'bg-green-400',
      warning: 'bg-yellow-400',
      critical: 'bg-red-400'
    };
    
    return (
      <motion.div
        className={`w-3 h-3 rounded-full ${colors[status as keyof typeof colors]}`}
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
    );
  };

  // Trend indicator component
  const TrendIndicator = ({ trend, value }: { trend: string; value: number }) => {
    const isPositive = trend === 'increasing' || trend === 'stable';
    return (
      <div className="flex items-center gap-1">
        {trend === 'increasing' && <TrendingUp className="w-3 h-3 text-green-400" />}
        {trend === 'decreasing' && <TrendingDown className="w-3 h-3 text-red-400" />}
        {trend === 'stable' && <div className="w-3 h-0.5 bg-blue-400" />}
        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {value > 0 ? '+' : ''}{value}%
        </span>
      </div>
    );
  };

  // Enhanced stat card component
  const EnhancedStatCard = ({ 
    title, 
    value, 
    unit, 
    icon: Icon, 
    trend, 
    trendValue, 
    color = 'blue',
    description,
    onClick 
  }: any) => (
    <motion.div
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="relative overflow-hidden cursor-pointer"
    >
      <Card className="p-4 h-full bg-gradient-to-br from-gray-900/50 to-gray-800/30 border-gray-700/50 backdrop-blur-xl hover:border-gray-600/70 transition-all duration-300">
        <div className="flex items-center justify-between mb-3">
          <div className={`p-2 rounded-lg bg-${color}-500/20 border border-${color}-400/30`}>
            <Icon className={`w-5 h-5 text-${color}-400`} />
          </div>
          <TrendIndicator trend={trend} value={trendValue} />
        </div>
        
        <div className="space-y-1">
          <div className="flex items-baseline gap-1">
            <motion.span 
              className="text-2xl font-bold text-white"
              key={value}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              {typeof value === 'number' ? value.toLocaleString() : value}
            </motion.span>
            {unit && <span className="text-sm text-gray-400">{unit}</span>}
          </div>
          
          <p className="text-sm font-medium text-gray-300">{title}</p>
          
          {description && (
            <p className="text-xs text-gray-500 line-clamp-2">{description}</p>
          )}
        </div>

        {/* Decorative gradient */}
        <div className={`absolute inset-0 bg-gradient-to-r from-${color}-500/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300`} />
      </Card>
    </motion.div>
  );

  // Quick action button component
  const QuickActionButton = ({ action }: { action: any }) => {
    const statusColors = {
      ready: 'border-gray-600 text-gray-300',
      active: 'border-green-500 text-green-400 bg-green-500/10',
      attention: 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-3 rounded-lg border ${statusColors[action.status]} backdrop-blur-sm transition-all duration-200 hover:bg-white/5 flex flex-col items-center text-center`}
      >
        <action.icon className="w-5 h-5 mx-auto mb-1" />
        <span className="text-xs font-medium block">{action.label}</span>
        <span className="text-xs text-gray-500 mt-1">{action.description}</span>
      </motion.button>
    );
  };

  return (
    <div 
      ref={containerRef}
      className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden"
    >
      {/* Enhanced background effects */}
      <div className="absolute inset-0 opacity-30">
        <StarField />
      </div>
      <div className="absolute inset-0 opacity-20">
        <FloatingParticles />
      </div>

      {/* Header with enhanced design */}
      <motion.header 
        className="sticky top-0 z-40 backdrop-blur-xl bg-gray-900/80 border-b border-gray-700/50"
        style={{ rotateX, rotateY }}
      >
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <motion.div 
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1">
                    <StatusIndicator status={systemHealth} />
                  </div>
                </div>
                <div>
                  <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                    VeloFlux Enterprise
                  </h1>
                  <p className="text-sm text-gray-400">
                    Dashboard Aprimorado • Sistema de Load Balancing Enterprise
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center gap-4">
              {/* System status overview */}
              <motion.div 
                className="flex items-center gap-6 px-4 py-2 rounded-lg bg-gray-800/50 border border-gray-700/50"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  <span className="text-sm font-medium">{realtimeStats.cpuUsage}%</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">{realtimeStats.memoryUsage}%</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-2">
                  <Wifi className="w-4 h-4 text-purple-400" />
                  <span className="text-sm font-medium">{realtimeStats.networkThroughput} MB/s</span>
                </div>
              </motion.div>

              {/* Action buttons */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-gray-600 hover:bg-gray-700"
                >
                  <Bell className="w-4 h-4" />
                  {activeAlerts.length > 0 && (
                    <Badge className="ml-1 bg-red-500 text-white text-xs">
                      {activeAlerts.length}
                    </Badge>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main content */}
      <main className="p-6 space-y-6">
        {/* Quick stats overview */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 mb-6">
            <EnhancedStatCard
              title="Conexões Ativas"
              value={realtimeStats.activeConnections}
              icon={Users}
              trend="increasing"
              trendValue={12}
              color="blue"
              description="Conexões simultâneas ativas"
            />
            <EnhancedStatCard
              title="Req/Segundo"
              value={realtimeStats.requestsPerSecond}
              icon={Activity}
              trend="stable"
              trendValue={3}
              color="green"
              description="Requisições processadas por segundo"
            />
            <EnhancedStatCard
              title="Tempo Resposta"
              value={realtimeStats.responseTime}
              unit="ms"
              icon={Clock}
              trend="decreasing"
              trendValue={-8}
              color="purple"
              description="Tempo médio de resposta"
            />
            <EnhancedStatCard
              title="Taxa de Erro"
              value={realtimeStats.errorRate.toFixed(1)}
              unit="%"
              icon={AlertTriangle}
              trend="decreasing"
              trendValue={-15}
              color="red"
              description="Taxa de erro nas requisições"
            />
            <EnhancedStatCard
              title="Cache Hit"
              value={realtimeStats.cacheHitRate.toFixed(1)}
              unit="%"
              icon={Zap}
              trend="increasing"
              trendValue={5}
              color="yellow"
              description="Taxa de acerto do cache"
            />
            <EnhancedStatCard
              title="Uptime"
              value={realtimeStats.uptime.toFixed(2)}
              unit="%"
              icon={CheckCircle}
              trend="stable"
              trendValue={0}
              color="emerald"
              description="Tempo de atividade do sistema"
            />
          </div>
        </motion.section>

        {/* Quick actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="p-4 bg-gradient-to-r from-gray-900/50 to-gray-800/30 border-gray-700/50 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white">Ações Rápidas</h3>
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {quickActions.map((action) => (
                <QuickActionButton key={action.id} action={action} />
              ))}
            </div>
          </Card>
        </motion.section>

        {/* Enhanced tabs */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm">
              {tabsData.map((tab) => (
                <TabsTrigger 
                  key={tab.id}
                  value={tab.id}
                  className="relative data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600/20 data-[state=active]:to-purple-600/20 data-[state=active]:text-white"
                >
                  <div className="flex items-center gap-2">
                    <tab.icon className="w-4 h-4" />
                    <span className="font-medium">{tab.label}</span>
                    {tab.badge && (
                      <Badge variant="secondary" className="text-xs bg-gray-700 text-gray-300">
                        {tab.badge}
                      </Badge>
                    )}
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Tab content with enhanced error handling */}
            <div className="min-h-[600px]">
              <DashboardErrorBoundary>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    {tabsData.map((tab) => (
                      <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                        {tab.component}
                      </TabsContent>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </DashboardErrorBoundary>
            </div>
          </Tabs>
        </motion.section>
      </main>

      {/* Loading overlay */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-gray-900/90 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full"
            />
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="ml-4 text-lg font-medium text-blue-400"
            >
              Carregando Dashboard Aprimorado...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
      component: <AIConfiguration />
    },
    {
      id: 'ai-hub',
      label: 'Hub IA Premium',
      icon: Zap,
      gradient: 'from-purple-500 via-indigo-500 to-blue-600',
      description: 'Centro neural de IA Premium',
      component: <AIHub />
    },
    {
      id: 'billing',
      label: t('dashboard.tabs.billing'),
      icon: CreditCard,
      gradient: 'from-green-500 via-emerald-500 to-teal-600',
      description: 'Sistema de cobrança moderno',
      component: <ModernBillingPanel />
    },
    {
      id: 'security',
      label: t('dashboard.tabs.security'),
      icon: Lock,
      gradient: 'from-red-500 via-pink-500 to-rose-600',
      description: 'Segurança avançada',
      component: <SecuritySettings />
    },
    {
      id: 'export',
      label: t('dashboard.tabs.export'),
      icon: Download,
      gradient: 'from-gray-500 via-slate-500 to-zinc-600',
      description: 'Exportação e relatórios',
      component: <BillingExport />
    },
    {
      id: 'orchestration',
      label: t('dashboard.tabs.orchestration'),
      icon: GitMerge,
      gradient: 'from-blue-500 via-indigo-500 to-purple-600',
      description: 'Orquestração inteligente',
      component: <OrchestrationSettings />
    },
    {
      id: 'config',
      label: t('dashboard.tabs.config'),
      icon: Settings,
      gradient: 'from-gray-500 via-slate-500 to-stone-600',
      description: 'Configurações do sistema',
      component: <ConfigManager />
    }
  ];

  if (isLoading || dataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center relative overflow-hidden">
        <StarField />
        <div className="text-center z-20">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <div className="h-16 w-16 rounded-full border-4 border-blue-500/30 border-t-blue-400 mx-auto"></div>
          </motion.div>
          <motion.p 
            className="mt-6 text-white/90 text-lg font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Carregando VeloFlux Dashboard...
          </motion.p>
          <motion.div
            className="mt-4 flex justify-center space-x-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-2 rounded-full bg-blue-400"
                animate={{ scale: [1, 1.5, 1] }}
                transition={{ 
                  duration: 1.5, 
                  repeat: Infinity, 
                  delay: i * 0.2 
                }}
              />
            ))}
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <DashboardErrorBoundary>
      <div 
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 relative overflow-hidden"
        style={{ cursor: 'none' }}
      >
        {/* Background Effects */}
        <StarField />
        <FloatingParticles />
        
        {/* Animated Background Gradients */}
        <div className="absolute inset-0 opacity-30">
          <motion.div 
            className="absolute top-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, 100, 0],
              y: [0, 50, 0],
              scale: [1, 1.2, 1]
            }}
            transition={{ duration: 20, repeat: Infinity }}
          />
          <motion.div 
            className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
            animate={{ 
              x: [0, -100, 0],
              y: [0, -50, 0],
              scale: [1, 1.3, 1]
            }}
            transition={{ duration: 25, repeat: Infinity }}
          />
        </div>

        <div className="container mx-auto px-4 py-6 relative z-20">
          {/* Enhanced Header */}
          <motion.div 
            className="mb-8"
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="relative"
                  style={{ rotateX, rotateY }}
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl">
                    <Activity className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl blur-xl opacity-50 animate-pulse"></div>
                </motion.div>
                <div>
                  <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                    VeloFlux Dashboard
                  </h1>
                  <p className="text-blue-200/80 mt-1 text-lg">
                    Centro de Comando Neural Avançado
                  </p>
                </div>
              </div>
              
              {/* Real-time Stats Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Network, label: 'Conexões', value: realtimeStats.activeConnections, color: 'from-blue-500 to-cyan-500' },
                  { icon: Zap, label: 'RPS', value: `${realtimeStats.requestsPerSecond}`, color: 'from-yellow-500 to-orange-500' },
                  { icon: Cpu, label: 'CPU', value: `${realtimeStats.cpuUsage}%`, color: 'from-green-500 to-emerald-500' },
                  { icon: Globe, label: 'Backends', value: realtimeStats.activeBackends, color: 'from-purple-500 to-pink-500' },
                ].map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center`}>
                        <stat.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">{stat.label}</p>
                        <p className="text-white font-bold text-lg">{stat.value}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
              
              {/* System Status & Actions */}
              <div className="flex items-center gap-4">
                <motion.div
                  className="flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                >
                  <Badge 
                    variant={systemHealth === 'healthy' ? 'default' : systemHealth === 'warning' ? 'secondary' : 'destructive'}
                    className="px-4 py-2 text-sm font-medium bg-white/10 backdrop-blur-md border border-white/20"
                  >
                    {systemHealth === 'healthy' && <CheckCircle className="w-4 h-4 mr-2 text-green-400" />}
                    {systemHealth === 'warning' && <AlertTriangle className="w-4 h-4 mr-2 text-yellow-400" />}
                    {systemHealth === 'critical' && <AlertTriangle className="w-4 h-4 mr-2 text-red-400" />}
                    <span className="text-white">{t(`dashboard.health.${systemHealth}`)}</span>
                  </Badge>
                </motion.div>
                
                {activeAlerts.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center"
                  >
                    <Badge className="px-4 py-2 bg-red-500/20 border border-red-500/30 text-red-200">
                      <Bell className="w-4 h-4 mr-2" />
                      {activeAlerts.length} alertas
                    </Badge>
                  </motion.div>
                )}
                
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                  <Button variant="outline" size="sm" className="bg-white/10 backdrop-blur-md border-white/20 text-white hover:bg-white/20">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Atualizar
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Enhanced Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="relative mb-8">
              <motion.div
                className="overflow-x-auto scrollbar-hide"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <TabsList className="grid w-full h-auto p-2 bg-black/20 backdrop-blur-xl border border-white/10 rounded-2xl min-w-max">
                  {tabsData.map((tab, index) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    
                    return (
                      <motion.div
                        key={tab.id}
                        layout
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                      >
                        <TabsTrigger
                          value={tab.id}
                          className={`
                            relative group min-w-0 px-6 py-4 text-sm font-medium transition-all duration-500 rounded-xl overflow-hidden
                            ${isActive 
                              ? 'bg-white/20 backdrop-blur-md text-white shadow-2xl border border-white/30 scale-105' 
                              : 'bg-transparent text-white/60 hover:bg-white/10 hover:text-white/90 border border-transparent hover:border-white/20'
                            }
                          `}
                        >
                          {/* Background gradient for active tab */}
                          {isActive && (
                            <motion.div
                              className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-20 rounded-xl`}
                              layoutId="activeTab"
                              transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                            />
                          )}
                          
                          <div className="relative flex items-center gap-3 z-10">
                            <motion.div
                              animate={{ 
                                scale: isActive ? 1.1 : 1,
                                rotate: isActive ? 5 : 0
                              }}
                              transition={{ duration: 0.3 }}
                            >
                              <Icon className={`w-5 h-5 transition-all duration-300 ${
                                isActive ? 'text-white drop-shadow-lg' : 'text-white/70 group-hover:text-white/90'
                              }`} />
                            </motion.div>
                            
                            <div className="flex flex-col items-start">
                              <span className={`font-semibold whitespace-nowrap transition-all duration-300 ${
                                isActive ? 'text-white' : 'text-white/70 group-hover:text-white/90'
                              }`}>
                                {tab.label}
                              </span>
                              
                              {tab.description && (
                                <span className={`text-xs opacity-0 group-hover:opacity-100 transition-all duration-300 ${
                                  isActive ? 'text-white/80' : 'text-white/50'
                                }`}>
                                  {tab.description}
                                </span>
                              )}
                            </div>
                            
                            {/* Enhanced alert indicators with animations */}
                            {tab.id === 'health' && activeAlerts.length > 0 && (
                              <motion.div 
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"
                                animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                transition={{ duration: 2, repeat: Infinity }}
                              />
                            )}
                            {tab.id === 'metrics' && systemHealth === 'critical' && (
                              <motion.div 
                                className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full"
                                animate={{ scale: [1, 1.5, 1] }}
                                transition={{ duration: 1, repeat: Infinity }}
                              />
                            )}
                            {(tab.id === 'ai-insights' || tab.id === 'ai-hub') && (
                              <motion.div 
                                className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                animate={{ 
                                  rotate: 360,
                                  scale: [1, 1.2, 1]
                                }}
                                transition={{ 
                                  rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                                  scale: { duration: 2, repeat: Infinity }
                                }}
                              />
                            )}
                          </div>
                          
                          {/* Hover effect glow */}
                          <motion.div
                            className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-0 group-hover:opacity-10 rounded-xl transition-opacity duration-300`}
                          />
                        </TabsTrigger>
                      </motion.div>
                    );
                  })}
                </TabsList>
              </motion.div>
            </div>

            {/* Enhanced Tab Content with 3D Effects */}
            <AnimatePresence mode="wait">
              {tabsData.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-0">
                  <motion.div
                    initial={{ opacity: 0, y: 50, rotateX: 10 }}
                    animate={{ opacity: 1, y: 0, rotateX: 0 }}
                    exit={{ opacity: 0, y: -50, rotateX: -10 }}
                    transition={{ 
                      duration: 0.5,
                      type: "spring",
                      bounce: 0.1
                    }}
                    className="relative"
                  >
                    {/* Content Background with Glassmorphism */}
                    <div className="bg-black/20 backdrop-blur-xl rounded-2xl border border-white/10 p-6 shadow-2xl">
                      {/* Tab Header with Gradient */}
                      <motion.div 
                        className="mb-6 pb-4 border-b border-white/10"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${tab.gradient} flex items-center justify-center shadow-lg`}>
                            <tab.icon className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <h2 className="text-2xl font-bold text-white">{tab.label}</h2>
                            {tab.description && (
                              <p className="text-white/60 mt-1">{tab.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                      
                      {/* Tab Content */}
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                      >
                        {tab.component}
                      </motion.div>
                    </div>
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        </div>
      </div>
    </DashboardErrorBoundary>
  );
};

export default Dashboard;
