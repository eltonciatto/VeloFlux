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
  WifiOff,
  MonitorSpeaker,
  Eye,
  BarChart,
  Calendar,
  MapPin,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  Flame,
  Star,
  ArrowUp,
  ArrowDown,
  TrendingDown,
  Home,
  Menu,
  Search
} from 'lucide-react';

interface Alert {
  id: string;
  type: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  timestamp: string;
}

const EnhancedDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [systemHealth, setSystemHealth] = useState<'healthy' | 'warning' | 'critical'>('healthy');
  const [activeAlerts, setActiveAlerts] = useState<Alert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAdvancedStats, setShowAdvancedStats] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const rotateX = useTransform(mouseY, [-300, 300], [2, -2]);
  const rotateY = useTransform(mouseX, [-300, 300], [-2, 2]);

  // Enhanced real-time stats
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
    cacheHitRate: 87.5
  });

  // Performance trends
  const [performanceTrends, setPerformanceTrends] = useState({
    cpuTrend: 'stable',
    memoryTrend: 'increasing',
    responseTrend: 'decreasing',
    throughputTrend: 'increasing'
  });

  // Quick actions state
  const [quickActions, setQuickActions] = useState<QuickAction[]>([
    { id: 'restart', label: 'Restart Services', icon: RefreshCw, status: 'ready' },
    { id: 'backup', label: 'Create Backup', icon: Download, status: 'ready' },
    { id: 'scale', label: 'Auto Scale', icon: TrendingUp, status: 'active' },
    { id: 'alerts', label: 'Check Alerts', icon: Bell, status: 'attention' }
  ]);

  // Production data hook with error handling
  const { 
    metrics, 
    alerts,
    loading: dataLoading,
    error: dataError 
  } = useProductionData();

  // Real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Mouse tracking for advanced parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        mouseX.set((e.clientX - centerX) * 0.3);
        mouseY.set((e.clientY - centerY) * 0.3);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Enhanced real-time data simulation
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    
    const interval = setInterval(() => {
      setRealtimeStats(prev => ({
        ...prev,
        activeConnections: Math.floor(Math.random() * 200) + 750,
        requestsPerSecond: Math.floor(Math.random() * 1000) + 2000,
        cpuUsage: Math.max(10, Math.min(90, prev.cpuUsage + (Math.random() - 0.5) * 5)),
        memoryUsage: Math.max(20, Math.min(85, prev.memoryUsage + (Math.random() - 0.5) * 3)),
        networkThroughput: Math.floor(Math.random() * 100) + 300,
        responseTime: Math.max(45, Math.min(150, prev.responseTime + (Math.random() - 0.5) * 10)),
        errorRate: Math.max(0, Math.min(5, prev.errorRate + (Math.random() - 0.5) * 0.5)),
        totalRequests: prev.totalRequests + Math.floor(Math.random() * 50) + 10,
        dataTransferred: prev.dataTransferred + Math.random() * 2,
        cacheHitRate: Math.max(70, Math.min(95, prev.cacheHitRate + (Math.random() - 0.5) * 2))
      }));
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, []);

  // Health monitoring
  useEffect(() => {
    if (realtimeStats.cpuUsage > 80 || realtimeStats.errorRate > 2) {
      setSystemHealth('critical');
    } else if (realtimeStats.cpuUsage > 60 || realtimeStats.errorRate > 1) {
      setSystemHealth('warning');
    } else {
      setSystemHealth('healthy');
    }
  }, [realtimeStats]);

  // Enhanced tab configuration
  const tabsData = [
    {
      id: 'overview',
      label: 'Visão Geral',
      icon: Home,
      gradient: 'from-blue-500 via-purple-500 to-indigo-600',
      description: 'Painel principal do sistema',
      badge: systemHealth === 'healthy' ? 'Saudável' : systemHealth === 'warning' ? 'Atenção' : 'Crítico'
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Activity,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-600',
      description: 'Métricas de performance em tempo real',
      badge: `${realtimeStats.responseTime}ms`
    },
    {
      id: 'monitoring',
      label: 'Monitoramento',
      icon: Eye,
      gradient: 'from-orange-500 via-red-500 to-pink-600',
      description: 'Monitoramento avançado',
      badge: `${realtimeStats.activeBackends} backends`
    },
    {
      id: 'analytics',
      label: 'Analytics',
      icon: BarChart,
      gradient: 'from-violet-500 via-fuchsia-500 to-pink-600',
      description: 'Análises e insights',
      badge: 'AI Powered'
    },
    {
      id: 'management',
      label: 'Gerenciamento',
      icon: Settings,
      gradient: 'from-indigo-500 via-blue-500 to-purple-600',
      description: 'Configurações do sistema',
      badge: 'Config'
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
        {trend === 'increasing' && <ArrowUp className="w-3 h-3 text-green-400" />}
        {trend === 'decreasing' && <ArrowDown className="w-3 h-3 text-red-400" />}
        {trend === 'stable' && <div className="w-3 h-0.5 bg-blue-400" />}
        <span className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {value}%
        </span>
      </div>
    );
  };
interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: number;
  color?: string;
  description?: string;
  onClick?: () => void;
}

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
  }: StatCardProps) => (
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
interface QuickAction {
  id: string;
  icon: React.ElementType;
  label: string;
  status: 'ready' | 'active' | 'attention';
}

  // Quick action button component
  const QuickActionButton = ({ action }: { action: QuickAction }) => {
    const statusColors = {
      ready: 'border-gray-600 text-gray-300',
      active: 'border-green-500 text-green-400 bg-green-500/10',
      attention: 'border-yellow-500 text-yellow-400 bg-yellow-500/10'
    };

    return (
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`p-3 rounded-lg border ${statusColors[action.status]} backdrop-blur-sm transition-all duration-200 hover:bg-white/5`}
      >
        <action.icon className="w-5 h-5 mx-auto mb-1" />
        <span className="text-xs font-medium block">{action.label}</span>
      </motion.button>
    );
  };

  return (
    <div 
      ref={containerRef}
      className={`min-h-screen bg-gradient-to-br from-gray-900 via-slate-900 to-black text-white relative overflow-hidden ${isFullscreen ? 'fixed inset-0 z-50' : ''}`}
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
                    {currentTime.toLocaleString('pt-BR', { 
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
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
                  onClick={() => setIsFullscreen(!isFullscreen)}
                  className="border-gray-600 hover:bg-gray-700"
                >
                  {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                </Button>
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
              trend="up"
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
              trend="down"
              trendValue={8}
              color="purple"
              description="Tempo médio de resposta"
            />
            <EnhancedStatCard
              title="Taxa de Erro"
              value={realtimeStats.errorRate.toFixed(1)}
              unit="%"
              icon={AlertTriangle}
              trend="down"
              trendValue={15}
              color="red"
              description="Taxa de erro nas requisições"
            />
            <EnhancedStatCard
              title="Cache Hit"
              value={realtimeStats.cacheHitRate.toFixed(1)}
              unit="%"
              icon={Zap}
              trend="up"
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
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
                    <TabsContent value="overview" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <BackendOverview />
                        <ClusterStatus />
                      </div>
                      <AIInsights />
                    </TabsContent>

                    <TabsContent value="performance" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <HealthMonitor />
                        <MetricsView />
                      </div>
                    </TabsContent>

                    <TabsContent value="monitoring" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                          <AIMetricsDashboard />
                        </div>
                        <div className="space-y-6">
                          <ModelPerformance />
                          <PredictiveAnalytics />
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <MultiTenantOverview />
                        <ModernBillingPanel />
                      </div>
                      <AIHub />
                    </TabsContent>

                    <TabsContent value="management" className="space-y-6">
                      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        <BackendManager />
                        <ConfigManager />
                        <SecuritySettings />
                        <WAFConfig />
                        <RateLimitConfig />
                        <OrchestrationSettings />
                      </div>
                    </TabsContent>
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
              Carregando Dashboard...
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default EnhancedDashboard;
