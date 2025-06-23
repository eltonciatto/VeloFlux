import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Activity, Zap, Shield, Globe, TrendingUp, Cpu, Network, BarChart3 } from 'lucide-react';
import { usePerformanceMode } from '@/hooks/usePerformance';
import { useTranslation } from 'react-i18next';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: 'lb' | 'backend';
  connections?: number;
  load?: number;
}

const LiveDemoSection = React.memo(() => {
  const { t } = useTranslation();
  const isLowPerformance = usePerformanceMode();
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  
  // Memoized initial data
  const initialMetrics = useMemo(() => [
    { label: t('liveDemo.metrics.requestsPerSec'), value: 12500, unit: t('liveDemo.units.rps'), color: 'from-blue-500 to-cyan-500', icon: Activity },
    { label: t('liveDemo.metrics.aiAccuracy'), value: 97.8, unit: t('liveDemo.units.percentage'), color: 'from-green-500 to-emerald-500', icon: Zap },
    { label: t('liveDemo.metrics.responseTime'), value: 8.2, unit: t('liveDemo.units.milliseconds'), color: 'from-purple-500 to-pink-500', icon: TrendingUp },
    { label: t('liveDemo.metrics.uptimeSLA'), value: 99.99, unit: t('liveDemo.units.percentage'), color: 'from-orange-500 to-red-500', icon: Shield },
  ], [t]);

  const initialNetworkData = useMemo(() => [
    { id: 'load-balancer', x: 50, y: 20, type: 'lb' as const, connections: 0 },
    { id: 'backend-1', x: 20, y: 60, type: 'backend' as const, load: 30 },
    { id: 'backend-2', x: 50, y: 70, type: 'backend' as const, load: 45 },
    { id: 'backend-3', x: 80, y: 60, type: 'backend' as const, load: 25 },
  ], []);

  const [metrics, setMetrics] = useState<MetricData[]>(initialMetrics);
  const [networkData, setNetworkData] = useState<NetworkNode[]>(initialNetworkData);
  const [aiDecisions, setAiDecisions] = useState<string[]>([]);

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });

  const controls = useAnimation();

  // Memoized AI decisions array
  const aiDecisionsList = useMemo(() => [
    t('liveDemo.aiDecisions.decisions.routingTraffic'),
    t('liveDemo.aiDecisions.decisions.predictingSpike'),
    t('liveDemo.aiDecisions.decisions.detectedAnomaly'),
    t('liveDemo.aiDecisions.decisions.optimizingSSL'),
    t('liveDemo.aiDecisions.decisions.autoScaling'),
    t('liveDemo.aiDecisions.decisions.learningPatterns')
  ], [t]);

  // Optimized update functions
  const updateMetrics = useCallback(() => {
    setMetrics(prev => prev.map(metric => {
      let newValue: number;
      const label = metric.label;
      
      if (label.includes('Requests') || label.includes('req')) {
        newValue = Math.floor(12000 + Math.random() * 1000);
      } else if (label.includes('Accuracy') || label.includes('acur')) {
        newValue = 96 + Math.random() * 4;
      } else if (label.includes('Response') || label.includes('tempo')) {
        newValue = 7 + Math.random() * 3;
      } else {
        newValue = 99.95 + Math.random() * 0.04;
      }
      
      return { ...metric, value: newValue };
    }));
  }, []);

  const updateAiDecisions = useCallback(() => {
    setAiDecisions(prev => {
      const newDecision = aiDecisionsList[Math.floor(Math.random() * aiDecisionsList.length)];
      const maxDecisions = isLowPerformance ? 3 : 4;
      return [newDecision, ...prev.slice(0, maxDecisions - 1)];
    });
  }, [aiDecisionsList, isLowPerformance]);

  const updateNetworkData = useCallback(() => {
    setNetworkData(prev => prev.map(node => 
      node.type === 'backend' ? {
        ...node,
        load: Math.floor(20 + Math.random() * 60)
      } : node
    ));
  }, []);

  const startLiveDemo = useCallback(() => {
    // Clear any existing intervals
    intervalRefs.current.forEach(clearInterval);
    intervalRefs.current = [];
    
    const updateInterval = isLowPerformance ? 4000 : 2500;
    
    // Stagger the intervals to reduce simultaneous updates
    const metricsInterval = setInterval(updateMetrics, updateInterval);
    const decisionsInterval = setInterval(updateAiDecisions, updateInterval * 1.6);
    const networkInterval = setInterval(updateNetworkData, updateInterval * 1.2);
    
    intervalRefs.current = [metricsInterval, decisionsInterval, networkInterval];

    return () => {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
    };
  }, [isLowPerformance, updateMetrics, updateAiDecisions, updateNetworkData]);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
      const cleanup = startLiveDemo();
      return cleanup;
    } else {
      controls.start('hidden');
    }
  }, [inView, controls, startLiveDemo]);

  // Optimized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 100 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        staggerChildren: 0.2
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0 }
  }), []);

  // Reduced grid size for better performance
  const gridSize = isLowPerformance ? 100 : 200;
  const gridItems = useMemo(() => 
    Array.from({ length: gridSize }, (_, i) => i), 
    [gridSize]
  );

  return (
    <section ref={ref} className="relative py-24 bg-black overflow-hidden">
      {/* Optimized Animated Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
        
        {/* Simplified background animation for better performance */}
        {!isLowPerformance && (
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.1) 0%, transparent 50%)',
              ]
            }}
            transition={{
              duration: 12,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        )}
        
        {/* Optimized matrix-like grid */}
        <div className="absolute inset-0 opacity-10">
          <div className={`grid ${isLowPerformance ? 'grid-cols-10 grid-rows-10' : 'grid-cols-20 grid-rows-10'} h-full w-full`}>
            {gridItems.map((i) => (
              <motion.div
                key={i}
                className="border border-cyan-500/20"
                animate={!isLowPerformance ? {
                  opacity: [0.1, 0.3, 0.1],
                  scale: [1, 1.05, 1]
                } : {}}
                transition={{
                  duration: 2 + Math.random() * 3,
                  repeat: Infinity,
                  delay: Math.random() * 5
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <motion.div
        className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
        variants={containerVariants}
        initial="hidden"
        animate={controls}
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
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
            <Activity className="w-6 h-6 text-cyan-400 mr-3" />
            <span className="text-cyan-300 font-semibold">{t('liveDemo.subtitle').toUpperCase()}</span>
          </motion.div>
          
          <h2 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              {t('liveDemo.title')}
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('liveDemo.description')}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Live Metrics Dashboard */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <BarChart3 className="w-6 h-6 text-cyan-400 mr-3" />
              Live Performance Metrics
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {metrics.map((metric, index) => {
                const Icon = metric.icon;
                return (
                  <motion.div
                    key={metric.label}
                    className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6 relative overflow-hidden"
                    whileHover={!isLowPerformance ? { scale: 1.05 } : {}}
                    animate={!isLowPerformance ? {
                      borderColor: [
                        'rgba(255, 255, 255, 0.1)',
                        'rgba(6, 182, 212, 0.3)',
                        'rgba(255, 255, 255, 0.1)',
                      ]
                    } : {}}
                    transition={{ duration: 4, delay: index * 0.8, repeat: Infinity }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-5 h-5 text-cyan-400" />
                        <motion.span
                          className="text-xs text-gray-400"
                          animate={!isLowPerformance ? { opacity: [0.5, 1, 0.5] } : {}}
                          transition={{ duration: 3, repeat: Infinity }}
                        >
                          LIVE
                        </motion.span>
                      </div>
                      <motion.div
                        className="text-2xl font-bold text-white mb-1"
                        key={`${metric.label}-${Math.floor(metric.value)}`}
                        initial={!isLowPerformance ? { scale: 1.1, color: '#06b6d4' } : {}}
                        animate={!isLowPerformance ? { scale: 1, color: '#ffffff' } : {}}
                        transition={{ duration: 0.5 }}
                      >
                        {typeof metric.value === 'number' 
                          ? metric.value.toFixed(metric.unit.includes('%') ? 1 : 0)
                          : metric.value
                        }
                        <span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
                      </motion.div>
                      <div className="text-sm text-gray-400">{metric.label}</div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* AI Decision Log */}
            <div className="bg-black/50 backdrop-blur-sm border border-green-500/30 rounded-xl p-6">
              <h4 className="text-lg font-semibold text-green-400 mb-4 flex items-center">
                <Cpu className="w-5 h-5 mr-2" />
                AI Decision Engine
              </h4>
              <div className="space-y-2 max-h-48 overflow-hidden">
                {aiDecisions.map((decision, index) => (
                  <motion.div
                    key={index}
                    className="text-sm text-green-300 font-mono"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1 - (index * 0.2), x: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <span className="text-green-500">[{new Date().toLocaleTimeString()}]</span> {decision}
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Network Visualization */}
          <motion.div variants={itemVariants} className="relative">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Network className="w-6 h-6 text-purple-400 mr-3" />
              Live Network Topology
            </h3>
            
            <div className="bg-black/50 backdrop-blur-sm border border-purple-500/30 rounded-xl p-8 h-96 relative overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Connection lines */}
                {networkData.slice(1).map((backend, index) => (
                  <motion.line
                    key={backend.id}
                    x1="50" y1="20"
                    x2={backend.x} y2={backend.y}
                    stroke="url(#connectionGradient)"
                    strokeWidth="0.5"
                    opacity="0.6"
                    animate={{
                      opacity: [0.3, 0.8, 0.3],
                      strokeWidth: [0.3, 0.8, 0.3]
                    }}
                    transition={{
                      duration: 2,
                      delay: index * 0.3,
                      repeat: Infinity
                    }}
                  />
                ))}

                {/* Gradient definitions */}
                <defs>
                  <linearGradient id="connectionGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#8b5cf6" />
                  </linearGradient>
                </defs>

                {/* Load Balancer */}
                <motion.g
                  animate={{
                    scale: [1, 1.1, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <circle
                    cx="50" cy="20"
                    r="4"
                    fill="url(#connectionGradient)"
                    opacity="0.8"
                  />
                  <circle
                    cx="50" cy="20"
                    r="6"
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="0.3"
                    opacity="0.4"
                  />
                </motion.g>

                {/* Backend Servers */}
                {networkData.slice(1).map((backend) => (
                  <motion.g key={backend.id}>
                    <motion.circle
                      cx={backend.x} cy={backend.y}
                      r="3"
                      fill={backend.load > 50 ? '#ef4444' : backend.load > 30 ? '#f59e0b' : '#10b981'}
                      animate={{
                        r: [3, 3.5, 3],
                        opacity: [0.7, 1, 0.7]
                      }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <text
                      x={backend.x} y={backend.y + 8}
                      textAnchor="middle"
                      className="text-xs fill-gray-400"
                    >
                      {backend.load}%
                    </text>
                  </motion.g>
                ))}

                {/* Data flow particles */}
                {Array.from({ length: 6 }).map((_, i) => (
                  <motion.circle
                    key={i}
                    r="0.5"
                    fill="#06b6d4"
                    animate={{
                      cx: [50, 20 + (i % 3) * 30],
                      cy: [20, 60],
                      opacity: [0, 1, 0],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </svg>

              {/* Legend */}
              <div className="absolute bottom-4 left-4 text-xs text-gray-400">
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                    Low Load
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></div>
                    Medium Load
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-1"></div>
                    High Load
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Call to Action */}
        <motion.div
          variants={itemVariants}
          className="text-center mt-16"
        >
          <motion.button
            className="group relative px-8 py-4 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              boxShadow: [
                '0 0 20px rgba(6, 182, 212, 0.3)',
                '0 0 40px rgba(6, 182, 212, 0.5)',
                '0 0 20px rgba(6, 182, 212, 0.3)',
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <span className="relative z-10">Experience This Live →</span>
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600"
              initial={{ x: '-100%' }}
              whileHover={{ x: '0%' }}
              transition={{ duration: 0.3 }}
            />
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
});

LiveDemoSection.displayName = 'LiveDemoSection';

export default LiveDemoSection;
