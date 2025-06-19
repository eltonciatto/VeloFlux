import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
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
  CreditCard
} from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';

export const Dashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { selectedTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState('overview');

  const tabsData = [
    {
      id: 'overview',
      label: t('dashboard.tabs.overview'),
      icon: Server,
      gradient: 'from-blue-500 to-cyan-500',
      component: BackendOverview
    },
    {
      id: 'ai-insights',
      label: t('dashboard.tabs.aiInsights'),
      icon: Brain,
      gradient: 'from-purple-500 to-pink-500',
      component: AIInsights
    },
    {
      id: 'ai-metrics',
      label: t('dashboard.tabs.aiMetrics'),
      icon: BarChart3,
      gradient: 'from-cyan-500 to-blue-500',
      component: AIMetricsDashboard
    },
    {
      id: 'predictions',
      label: t('dashboard.tabs.predictions'),
      icon: TrendingUp,
      gradient: 'from-green-500 to-emerald-500',
      component: PredictiveAnalytics
    },
    {
      id: 'model-performance',
      label: t('dashboard.tabs.models'),
      icon: Target,
      gradient: 'from-orange-500 to-yellow-500',
      component: ModelPerformance
    },
    {
      id: 'health',
      label: t('dashboard.tabs.health'),
      icon: Activity,
      gradient: 'from-red-500 to-pink-500',
      component: HealthMonitor
    },
    {
      id: 'metrics',
      label: t('dashboard.tabs.metrics'),
      icon: BarChart3,
      gradient: 'from-indigo-500 to-purple-500',
      component: MetricsView
    },
    {
      id: 'cluster',
      label: t('dashboard.tabs.cluster'),
      icon: Crown,
      gradient: 'from-yellow-500 to-orange-500',
      component: ClusterStatus
    },
    {
      id: 'backends',
      label: t('dashboard.tabs.backends'),
      icon: Users,
      gradient: 'from-teal-500 to-cyan-500',
      component: BackendManager
    },
    {
      id: 'security',
      label: t('dashboard.tabs.security'),
      icon: Shield,
      gradient: 'from-red-500 to-rose-500',
      component: (props: any) => <WAFConfig tenantId={selectedTenantId} {...props} />
    },
    {
      id: 'billing',
      label: t('dashboard.tabs.billing'),
      icon: CreditCard,
      gradient: 'from-emerald-500 to-green-500',
      component: ModernBillingPanel
    },
    {
      id: 'ratelimit',
      label: t('dashboard.tabs.rateLimit'),
      icon: Gauge,
      gradient: 'from-violet-500 to-purple-500',
      component: (props: any) => <RateLimitConfig tenantId={selectedTenantId} {...props} />
    },
    {
      id: 'ai-config',
      label: t('dashboard.tabs.aiConfig'),
      icon: Sliders,
      gradient: 'from-pink-500 to-rose-500',
      component: AIConfiguration
    },
    {
      id: 'config',
      label: t('dashboard.tabs.configuration'),
      icon: Settings,
      gradient: 'from-gray-500 to-slate-500',
      component: ConfigManager
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Dynamic Gradient Background */}
      <motion.div 
        className="absolute inset-0 z-0"
        animate={{
          background: [
            'radial-gradient(circle at 20% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(147, 51, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
            'radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%), radial-gradient(circle at 20% 80%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 60% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), linear-gradient(135deg, #1e293b 0%, #0f172a 25%, #1e293b 50%, #0f172a 75%, #1e293b 100%)',
            'radial-gradient(circle at 40% 20%, rgba(6, 182, 212, 0.1) 0%, transparent 50%), radial-gradient(circle at 60% 80%, rgba(59, 130, 246, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(147, 51, 234, 0.1) 0%, transparent 50%), linear-gradient(135deg, #0f172a 0%, #1e293b 25%, #0f172a 50%, #1e293b 75%, #0f172a 100%)',
          ]
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          repeatType: 'reverse'
        }}
      />

      {/* Animated Particles */}
      <div className="absolute inset-0 z-0">
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-cyan-400/30 rounded-full"
            animate={{
              x: [Math.random() * window.innerWidth, Math.random() * window.innerWidth],
              y: [Math.random() * window.innerHeight, Math.random() * window.innerHeight],
              opacity: [0, 0.6, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 12 + Math.random() * 8,
              repeat: Infinity,
              delay: Math.random() * 10,
              ease: "linear"
            }}
            style={{
              left: Math.random() * 100 + '%',
              top: Math.random() * 100 + '%'
            }}
          />
        ))}
      </div>

      {/* Header */}
      <Header />
      
      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <motion.div 
          className="mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="inline-flex items-center px-6 py-3 rounded-full bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 mb-6"
            animate={{
              boxShadow: [
                '0 0 20px rgba(6, 182, 212, 0.3)',
                '0 0 40px rgba(6, 182, 212, 0.5)',
                '0 0 20px rgba(6, 182, 212, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Brain className="w-5 h-5 text-cyan-400 mr-3" />
            <span className="text-cyan-300 font-semibold">{t('dashboard.badge')}</span>
            <motion.div
              className="ml-3 flex space-x-1"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <div className="w-2 h-2 bg-green-400 rounded-full"></div>
              <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
              <div className="w-2 h-2 bg-red-400 rounded-full"></div>
            </motion.div>
          </motion.div>

          <motion.h1 
            className="text-5xl md:text-6xl font-bold mb-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="bg-gradient-to-r from-white via-cyan-200 to-white bg-clip-text text-transparent">
              {t('dashboard.title')}
            </span>
          </motion.h1>
          
          <motion.p 
            className="text-xl text-blue-200/80 max-w-2xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t('dashboard.subtitle')}
          </motion.p>
        </motion.div>

        {/* Enhanced Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8">
          {/* Futuristic Tab Navigation */}
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 rounded-2xl backdrop-blur-xl border border-white/10"
              animate={{
                boxShadow: [
                  '0 0 30px rgba(6, 182, 212, 0.1)',
                  '0 0 60px rgba(6, 182, 212, 0.2)',
                  '0 0 30px rgba(6, 182, 212, 0.1)',
                ]
              }}
              transition={{ duration: 3, repeat: Infinity }}
            />
            
            <TabsList className="relative bg-transparent border-transparent p-2 h-auto grid-cols-none flex flex-wrap gap-2">
              {tabsData.map((tab, index) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <TabsTrigger
                    key={tab.id}
                    value={tab.id}
                    className={`
                      group relative overflow-hidden rounded-xl px-4 py-3 transition-all duration-300
                      ${isActive 
                        ? `bg-gradient-to-r ${tab.gradient} text-white shadow-lg shadow-cyan-500/25` 
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                      }
                    `}
                  >
                    {/* Animated background for active tab */}
                    {isActive && (
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        animate={{ x: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      />
                    )}
                    
                    <div className="relative flex items-center gap-2 z-10">
                      <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                      <span className="font-medium whitespace-nowrap">{tab.label}</span>
                    </div>
                    
                    {/* Glow effect on hover */}
                    <motion.div
                      className={`absolute inset-0 bg-gradient-to-r ${tab.gradient} opacity-0 group-hover:opacity-20 transition-opacity duration-300`}
                      style={{ filter: 'blur(8px)' }}
                    />
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Content with Animations */}
          <AnimatePresence mode="wait">
            {tabsData.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="m-0">
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -20, scale: 0.95 }}
                  transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
                >
                  <tab.component />
                </motion.div>
              </TabsContent>
            ))}
          </AnimatePresence>
        </Tabs>
      </div>
    </div>
  );
};
