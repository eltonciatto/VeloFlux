import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, useAnimation, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Activity, Zap, Shield, TrendingUp, BarChart3, Globe, Server, Database, Cpu, Network, Users } from 'lucide-react';
import { usePerformanceMode } from '@/hooks/usePerformance';
import { useTranslation } from 'react-i18next';

interface MetricData {
  label: string;
  value: number;
  unit: string;
  color: string;
  icon: React.ComponentType<{ className?: string }>;
  trend?: 'up' | 'down' | 'stable';
}

interface NetworkNode {
  id: string;
  x: number;
  y: number;
  type: 'server' | 'client' | 'balancer';
  status: 'active' | 'busy' | 'idle';
}

interface DataPacket {
  id: string;
  from: NetworkNode;
  to: NetworkNode;
  progress: number;
  type: 'request' | 'response' | 'health';
}

const LiveDemoSection = React.memo(() => {
  const { t } = useTranslation();
  const isLowPerformance = usePerformanceMode();
  const intervalRefs = useRef<NodeJS.Timeout[]>([]);
  
  // Memoized initial data for better performance
  const initialMetrics = useMemo(() => [
    { 
      label: t('liveDemo.metrics.requestsPerSec'), 
      value: 12500, 
      unit: t('liveDemo.units.rps'), 
      color: 'from-blue-500 to-cyan-500', 
      icon: Activity,
      trend: 'up' as const
    },
    { 
      label: t('liveDemo.metrics.aiAccuracy'), 
      value: 97.8, 
      unit: t('liveDemo.units.percentage'), 
      color: 'from-green-500 to-emerald-500', 
      icon: Zap,
      trend: 'stable' as const
    },
    { 
      label: t('liveDemo.metrics.responseTime'), 
      value: 8.2, 
      unit: t('liveDemo.units.milliseconds'), 
      color: 'from-purple-500 to-pink-500', 
      icon: TrendingUp,
      trend: 'down' as const
    },
    { 
      label: t('liveDemo.metrics.uptimeSLA'), 
      value: 99.99, 
      unit: t('liveDemo.units.percentage'), 
      color: 'from-orange-500 to-red-500', 
      icon: Shield,
      trend: 'stable' as const
    },
  ], [t]);

  // Network visualization state
  const [networkNodes] = useState<NetworkNode[]>([
    { id: 'balancer', x: 50, y: 50, type: 'balancer', status: 'active' },
    { id: 'server1', x: 20, y: 20, type: 'server', status: 'active' },
    { id: 'server2', x: 20, y: 80, type: 'server', status: 'busy' },
    { id: 'server3', x: 80, y: 20, type: 'server', status: 'idle' },
    { id: 'server4', x: 80, y: 80, type: 'server', status: 'active' },
    { id: 'client1', x: 10, y: 50, type: 'client', status: 'active' },
    { id: 'client2', x: 90, y: 50, type: 'client', status: 'active' },
  ]);

  const [dataPackets, setDataPackets] = useState<DataPacket[]>([]);

  const [metrics, setMetrics] = useState<MetricData[]>(initialMetrics);
  const [aiDecisions, setAiDecisions] = useState<string[]>([]);

  const { ref, inView } = useInView({
    threshold: 0.3,
    triggerOnce: false,
  });

  const controls = useAnimation();

  // Memoized AI decisions for better performance
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
      let trend: 'up' | 'down' | 'stable' = 'stable';
      const label = metric.label.toLowerCase();
      
      if (label.includes('request') || label.includes('req')) {
        const change = (Math.random() - 0.5) * 2000;
        newValue = Math.max(10000, metric.value + change);
        trend = change > 100 ? 'up' : change < -100 ? 'down' : 'stable';
      } else if (label.includes('accuracy') || label.includes('acur')) {
        const change = (Math.random() - 0.5) * 2;
        newValue = Math.max(95, Math.min(99.9, metric.value + change));
        trend = change > 0.1 ? 'up' : change < -0.1 ? 'down' : 'stable';
      } else if (label.includes('response') || label.includes('tempo')) {
        const change = (Math.random() - 0.5) * 4;
        newValue = Math.max(5, Math.min(15, metric.value + change));
        trend = change < -0.5 ? 'up' : change > 0.5 ? 'down' : 'stable'; // Lower is better for response time
      } else {
        const change = (Math.random() - 0.5) * 0.02;
        newValue = Math.max(99.9, Math.min(99.99, metric.value + change));
        trend = change > 0.001 ? 'up' : change < -0.001 ? 'down' : 'stable';
      }
      
      return { ...metric, value: newValue, trend };
    }));
  }, []);

  const createDataPacket = useCallback(() => {
    const fromNode = networkNodes[Math.floor(Math.random() * networkNodes.length)];
    const toNode = networkNodes[Math.floor(Math.random() * networkNodes.length)];
    
    if (fromNode.id === toNode.id) return;

    const packet: DataPacket = {
      id: `packet-${Date.now()}-${Math.random()}`,
      from: fromNode,
      to: toNode,
      progress: 0,
      type: Math.random() > 0.7 ? 'health' : Math.random() > 0.5 ? 'response' : 'request'
    };

    setDataPackets(prev => [...prev.slice(-20), packet]);
  }, [networkNodes]);

  const updateDataPackets = useCallback(() => {
    setDataPackets(prev => 
      prev.map(packet => ({
        ...packet,
        progress: Math.min(100, packet.progress + 5)
      })).filter(packet => packet.progress < 100)
    );
  }, []);

  const updateAiDecisions = useCallback(() => {
    setAiDecisions(prev => {
      const newDecision = aiDecisionsList[Math.floor(Math.random() * aiDecisionsList.length)];
      const maxDecisions = isLowPerformance ? 3 : 5;
      return [newDecision, ...prev.slice(0, maxDecisions - 1)];
    });
  }, [aiDecisionsList, isLowPerformance]);

  useEffect(() => {
    if (inView) {
      controls.start('visible');
      
      // Staggered intervals for better performance
      const metricsInterval = setInterval(updateMetrics, isLowPerformance ? 3000 : 2000);
      const aiInterval = setInterval(updateAiDecisions, isLowPerformance ? 4000 : 2500);
      const packetCreationInterval = setInterval(createDataPacket, isLowPerformance ? 2000 : 800);
      const packetUpdateInterval = setInterval(updateDataPackets, isLowPerformance ? 200 : 100);
      
      intervalRefs.current = [metricsInterval, aiInterval, packetCreationInterval, packetUpdateInterval];
    } else {
      intervalRefs.current.forEach(clearInterval);
      intervalRefs.current = [];
      controls.start('hidden');
    }

    return () => {
      intervalRefs.current.forEach(clearInterval);
    };
  }, [inView, controls, updateMetrics, updateAiDecisions, createDataPacket, updateDataPackets, isLowPerformance]);

  // Optimized animation variants
  const containerVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.15
      }
    }
  }), []);

  const itemVariants = useMemo(() => ({
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
  }), []);

  return (
    <section ref={ref} className="relative py-24 bg-black overflow-hidden">
      {/* Simplified background for better performance */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/20 via-purple-900/20 to-cyan-900/20"></div>
        
        {/* Conditional complex animations for performance */}
        {!isLowPerformance && (
          <motion.div 
            className="absolute inset-0"
            animate={{
              background: [
                'radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.08) 0%, transparent 50%)',
                'radial-gradient(circle at 80% 80%, rgba(168, 85, 247, 0.08) 0%, transparent 50%)',
                'radial-gradient(circle at 40% 60%, rgba(34, 197, 94, 0.08) 0%, transparent 50%)',
              ]
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              repeatType: 'reverse'
            }}
          />
        )}
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
            animate={!isLowPerformance ? {
              boxShadow: [
                '0 0 20px rgba(6, 182, 212, 0.3)',
                '0 0 40px rgba(6, 182, 212, 0.5)',
                '0 0 20px rgba(6, 182, 212, 0.3)',
              ]
            } : {}}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <Activity className="w-6 h-6 text-cyan-400 mr-3" />
            <span className="text-cyan-300 font-semibold">{t('liveDemo.subtitle').toUpperCase()}</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="bg-gradient-to-r from-white via-cyan-200 to-blue-200 bg-clip-text text-transparent">
              {t('liveDemo.title')}
            </span>
          </h2>
          
          <p className="text-lg text-gray-300 max-w-3xl mx-auto leading-relaxed">
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
                    whileHover={!isLowPerformance ? { scale: 1.03 } : {}}
                    animate={!isLowPerformance ? {
                      borderColor: [
                        'rgba(255, 255, 255, 0.1)',
                        'rgba(6, 182, 212, 0.3)',
                        'rgba(255, 255, 255, 0.1)',
                      ]
                    } : {}}
                    transition={{ duration: 5, delay: index * 1, repeat: Infinity }}
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.color} opacity-10`}></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <Icon className="w-5 h-5 text-cyan-400" />
                        <motion.span
                          className="text-xs text-gray-400"
                          animate={!isLowPerformance ? { opacity: [0.5, 1, 0.5] } : {}}
                          transition={{ duration: 4, repeat: Infinity }}
                        >
                          LIVE
                        </motion.span>
                      </div>
                      <motion.div
                        className="text-2xl font-bold text-white mb-1"
                        key={`${metric.label}-${Math.floor(metric.value)}`}
                        initial={!isLowPerformance ? { scale: 1.1, color: '#06b6d4' } : {}}
                        animate={!isLowPerformance ? { scale: 1, color: '#ffffff' } : {}}
                        transition={{ duration: 0.6 }}
                      >
                        {typeof metric.value === 'number' 
                          ? metric.value.toFixed(metric.unit.includes('%') ? 1 : 0)
                          : metric.value
                        }
                        <span className="text-sm text-gray-400 ml-1">{metric.unit}</span>
                      </motion.div>
                      <div className="text-sm text-gray-400 flex items-center justify-between">
                        <span>{metric.label}</span>
                        {metric.trend && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            metric.trend === 'up' ? 'bg-green-500/20 text-green-400' :
                            metric.trend === 'down' ? 'bg-red-500/20 text-red-400' :
                            'bg-gray-500/20 text-gray-400'
                          }`}>
                            {metric.trend === 'up' ? '↗' : metric.trend === 'down' ? '↘' : '→'}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* Network Visualization */}
          <motion.div variants={itemVariants} className="space-y-6">
            <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
              <Network className="w-6 h-6 text-purple-400 mr-3" />
              {t('liveDemo.networkVisualization.title')}
            </h3>
            
            <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 min-h-[400px] relative overflow-hidden">
              {/* Network Grid Background */}
              <div className="absolute inset-0 opacity-20">
                <svg width="100%" height="100%" className="text-cyan-500/30">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                </svg>
              </div>

              {/* Network Nodes */}
              <div className="relative h-80">
                {networkNodes.map((node) => (
                  <motion.div
                    key={node.id}
                    className={`absolute w-12 h-12 rounded-full border-2 flex items-center justify-center ${
                      node.type === 'balancer' 
                        ? 'bg-gradient-to-r from-cyan-500 to-blue-500 border-cyan-300' 
                        : node.type === 'server'
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 border-green-300'
                        : 'bg-gradient-to-r from-purple-500 to-pink-500 border-purple-300'
                    }`}
                    style={{
                      left: `${node.x}%`,
                      top: `${node.y}%`,
                      transform: 'translate(-50%, -50%)'
                    }}
                    animate={!isLowPerformance ? {
                      scale: node.status === 'active' ? [1, 1.1, 1] : [1, 0.9, 1],
                      boxShadow: [
                        '0 0 10px rgba(6, 182, 212, 0.3)',
                        '0 0 20px rgba(6, 182, 212, 0.6)',
                        '0 0 10px rgba(6, 182, 212, 0.3)',
                      ]
                    } : {}}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    {node.type === 'balancer' && <Globe className="w-6 h-6 text-white" />}
                    {node.type === 'server' && <Server className="w-6 h-6 text-white" />}
                    {node.type === 'client' && <Users className="w-6 h-6 text-white" />}
                    
                    {/* Status indicator */}
                    <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                      node.status === 'active' ? 'bg-green-400' :
                      node.status === 'busy' ? 'bg-yellow-400' : 'bg-gray-400'
                    }`} />
                  </motion.div>
                ))}

                {/* Data Packets */}
                <AnimatePresence>
                  {dataPackets.map((packet) => (
                    <motion.div
                      key={packet.id}
                      className={`absolute w-2 h-2 rounded-full ${
                        packet.type === 'request' ? 'bg-cyan-400' :
                        packet.type === 'response' ? 'bg-green-400' : 'bg-yellow-400'
                      }`}
                      initial={{
                        left: `${packet.from.x}%`,
                        top: `${packet.from.y}%`,
                        opacity: 0
                      }}
                      animate={{
                        left: `${packet.to.x}%`,
                        top: `${packet.to.y}%`,
                        opacity: 1
                      }}
                      exit={{ opacity: 0, scale: 0 }}
                      transition={{ duration: 2, ease: "easeInOut" }}
                      style={{ transform: 'translate(-50%, -50%)' }}
                    />
                  ))}
                </AnimatePresence>

                {/* Connection Lines */}
                <svg className="absolute inset-0 pointer-events-none">
                  {networkNodes.filter(n => n.type === 'balancer').map(balancer => 
                    networkNodes.filter(n => n.type === 'server').map(server => (
                      <motion.line
                        key={`${balancer.id}-${server.id}`}
                        x1={`${balancer.x}%`}
                        y1={`${balancer.y}%`}
                        x2={`${server.x}%`}
                        y2={`${server.y}%`}
                        stroke="rgba(6, 182, 212, 0.3)"
                        strokeWidth="1"
                        animate={!isLowPerformance ? {
                          strokeOpacity: [0.3, 0.7, 0.3]
                        } : {}}
                        transition={{ duration: 3, repeat: Infinity, delay: Math.random() }}
                      />
                    ))
                  )}
                </svg>
              </div>

              {/* Network Stats */}
              <div className="mt-4 grid grid-cols-3 gap-4 text-center">
                <div className="text-center">
                  <div className="text-cyan-400 text-lg font-bold">{networkNodes.filter(n => n.status === 'active').length}</div>
                  <div className="text-xs text-gray-400">Active Nodes</div>
                </div>
                <div className="text-center">
                  <div className="text-green-400 text-lg font-bold">{dataPackets.length}</div>
                  <div className="text-xs text-gray-400">Live Connections</div>
                </div>
                <div className="text-center">
                  <div className="text-purple-400 text-lg font-bold">0ms</div>
                  <div className="text-xs text-gray-400">Avg Latency</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* AI Decision Log - Full Width */}
        <motion.div variants={itemVariants} className="mt-12">
          <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
            <Zap className="w-6 h-6 text-yellow-400 mr-3" />
            {t('liveDemo.aiDecisions.title')}
          </h3>
          
          <div className="bg-black/50 backdrop-blur-sm border border-white/10 rounded-xl p-6 min-h-[300px]">
            <div className="font-mono text-sm space-y-3">
              <AnimatePresence mode="popLayout">
                {aiDecisions.map((decision, index) => (
                  <motion.div
                    key={`${decision}-${index}`}
                    className="flex items-start space-x-3 text-green-400 border-l-2 border-green-500/30 pl-4"
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: 'auto' }}
                    exit={{ opacity: 0, x: -20, height: 0 }}
                    transition={{ duration: 0.5 }}
                    layout
                  >
                    <span className="text-gray-500 text-xs mt-1 flex-shrink-0">
                      {new Date().toLocaleTimeString()}
                    </span>
                    <motion.span 
                      className="flex-1"
                      animate={!isLowPerformance ? {
                        color: ['#22c55e', '#10b981', '#22c55e']
                      } : {}}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {decision}
                    </motion.span>
                    <div className="w-2 h-2 bg-green-400 rounded-full flex-shrink-0 mt-2" />
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {aiDecisions.length === 0 && (
                <motion.div 
                  className="text-gray-500 text-center py-8"
                  animate={!isLowPerformance ? { opacity: [0.5, 1, 0.5] } : {}}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {t('liveDemo.aiDecisions.waiting')}
                </motion.div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Bottom Call to Action */}
        <motion.div 
          variants={itemVariants}
          className="text-center mt-16"
        >
          <motion.button
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-semibold rounded-lg shadow-lg"
            whileHover={!isLowPerformance ? { scale: 1.05 } : {}}
            whileTap={!isLowPerformance ? { scale: 0.95 } : {}}
            animate={!isLowPerformance ? {
              boxShadow: [
                '0 4px 20px rgba(6, 182, 212, 0.3)',
                '0 8px 40px rgba(6, 182, 212, 0.5)',
                '0 4px 20px rgba(6, 182, 212, 0.3)',
              ]
            } : {}}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            {t('liveDemo.cta')}
          </motion.button>
        </motion.div>
      </motion.div>
    </section>
  );
});

LiveDemoSection.displayName = 'LiveDemoSection';

export default LiveDemoSection;