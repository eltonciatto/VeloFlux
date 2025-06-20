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
  Wifi,
  Home,
  Eye,
  BarChart
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
    }
  ]);

  const { isLoading: dataLoading } = useProductionData();

  // Mouse tracking for 3D effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set((e.clientX - centerX) / 10);
        mouseY.set((e.clientY - centerY) / 10);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Simulated data loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  // Real-time stats simulation
  useEffect(() => {
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        ...prev,
        activeConnections: prev.activeConnections + Math.floor(Math.random() * 20) - 10,
        requestsPerSecond: prev.requestsPerSecond + Math.floor(Math.random() * 100) - 50,
        cpuUsage: Math.max(0, Math.min(100, prev.cpuUsage + Math.floor(Math.random() * 6) - 3)),
        memoryUsage: Math.max(0, Math.min(100, prev.memoryUsage + Math.floor(Math.random() * 4) - 2)),
        responseTime: Math.max(10, prev.responseTime + Math.floor(Math.random() * 10) - 5),
        networkThroughput: prev.networkThroughput + Math.floor(Math.random() * 50) - 25
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // System health monitoring
  useEffect(() => {
    const healthScore = (
      (100 - realtimeStats.cpuUsage) * 0.3 +
      (100 - realtimeStats.memoryUsage) * 0.3 +
      (realtimeStats.uptime) * 0.4
    );

    if (healthScore > 85) setSystemHealth('healthy');
    else if (healthScore > 70) setSystemHealth('warning');
    else setSystemHealth('critical');
  }, [realtimeStats]);

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
      <div className="flex items-center space-x-2">
        <div className={`w-2 h-2 rounded-full ${colors[status as keyof typeof colors]} animate-pulse`} />
        <span className="text-xs text-gray-400 capitalize">{status}</span>
      </div>
    );
  };

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
                    <Zap className="w-8 h-8 text-white" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  </div>
                </motion.div>
                
                <div>
                  <motion.h1 
                    className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text text-transparent"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    VeloFlux Dashboard
                  </motion.h1>
                  <motion.div 
                    className="flex items-center space-x-4 mt-2"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.4 }}
                  >
                    <StatusIndicator status={systemHealth} />
                    <span className="text-sm text-gray-400">
                      {realtimeStats.activeConnections.toLocaleString()} conexões ativas
                    </span>
                    <span className="text-sm text-gray-400">
                      {realtimeStats.requestsPerSecond.toLocaleString()} req/s
                    </span>
                  </motion.div>
                </div>
              </div>

              {/* Quick Stats Cards */}
              <motion.div 
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                {[
                  { label: 'CPU', value: `${realtimeStats.cpuUsage}%`, color: 'text-blue-400', trend: performanceTrends.cpuTrend },
                  { label: 'Memória', value: `${realtimeStats.memoryUsage}%`, color: 'text-green-400', trend: performanceTrends.memoryTrend },
                  { label: 'Latência', value: `${realtimeStats.responseTime}ms`, color: 'text-yellow-400', trend: performanceTrends.responseTrend },
                  { label: 'Uptime', value: `${realtimeStats.uptime}%`, color: 'text-purple-400', trend: performanceTrends.uptimeTrend }
                ].map((stat, index) => (
                  <Card key={index} className="bg-white/10 backdrop-blur-md border-white/20 p-4">
                    <div className="text-center">
                      <div className={`text-lg font-bold ${stat.color}`}>{stat.value}</div>
                      <div className="text-xs text-gray-400 mt-1">{stat.label}</div>
                      <div className="flex items-center justify-center mt-2">
                        {stat.trend.direction === 'increasing' && <TrendingUp className="w-3 h-3 text-green-400" />}
                        {stat.trend.direction === 'decreasing' && <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />}
                        {stat.trend.direction === 'stable' && <div className="w-3 h-0.5 bg-gray-400" />}
                        <span className="text-xs text-gray-400 ml-1">
                          {stat.trend.change !== 0 && (stat.trend.change > 0 ? '+' : '')}{stat.trend.change}%
                        </span>
                      </div>
                    </div>
                  </Card>
                ))}
              </motion.div>
            </div>

            {/* Quick Actions */}
            <motion.div 
              className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
            >
              {quickActions.map((action, index) => (
                <motion.div
                  key={action.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Button
                    variant="ghost"
                    className={`w-full h-auto p-4 text-left flex flex-col items-start space-y-2 border border-white/10 hover:border-white/20 transition-all duration-300 ${
                      action.status === 'active' ? 'bg-blue-500/20 border-blue-500/40' :
                      action.status === 'attention' ? 'bg-yellow-500/20 border-yellow-500/40' :
                      'bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="flex items-center space-x-3 w-full">
                      <action.icon className={`w-5 h-5 ${
                        action.status === 'active' ? 'text-blue-400' :
                        action.status === 'attention' ? 'text-yellow-400' :
                        'text-gray-400'
                      }`} />
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">{action.label}</div>
                        <div className="text-xs text-gray-400">{action.description}</div>
                      </div>
                      {action.status === 'active' && (
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                      )}
                      {action.status === 'attention' && (
                        <AlertTriangle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <div className="text-xs text-gray-500 w-full">
                      Last: {action.lastRun}
                    </div>
                  </Button>
                </motion.div>
              ))}
            </motion.div>
          </motion.div>

          {/* Enhanced Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
          >
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-white/10 backdrop-blur-md border border-white/20 p-1 rounded-2xl">
                {tabsData.map((tab) => (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`relative flex flex-col items-center space-y-1 p-4 rounded-xl transition-all duration-300 data-[state=active]:bg-white/20 data-[state=active]:text-white ${
                      activeTab === tab.id ? 'text-white' : 'text-gray-400 hover:text-gray-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <tab.icon className="w-5 h-5" />
                      <span className="font-medium text-sm hidden sm:block">{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <Badge 
                        variant="secondary" 
                        className={`text-xs bg-gradient-to-r ${tab.gradient} text-white border-0 px-2 py-0.5`}
                      >
                        {tab.badge}
                      </Badge>
                    )}
                    <span className="text-xs text-gray-400 hidden lg:block text-center">
                      {tab.description}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Content */}
              <AnimatePresence mode="wait">
                {tabsData.map((tab) => (
                  <TabsContent key={tab.id} value={tab.id} className="space-y-6">
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {tab.component}
                    </motion.div>
                  </TabsContent>
                ))}
              </AnimatePresence>
            </Tabs>
          </motion.div>
        </div>

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
    </DashboardErrorBoundary>
  );
};

export default Dashboard;
