
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Server, Activity, Clock, Users, AlertTriangle, CheckCircle, TrendingUp, Zap } from 'lucide-react';
import { useBackends } from '@/hooks/use-api';
import AIOverview from './AIOverview';
import FuturisticCard from './FuturisticCard';

interface Backend {
  address: string;
  pool: string;
  weight: number;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  connections?: number;
  responseTime?: number;
  lastCheck?: string;
}

export const BackendOverview = () => {
  const { t } = useTranslation();
  const { data: backends = [] } = useBackends();

  const totalBackends = backends.length;
  const healthyBackends = backends.filter(b => b.status === 'healthy').length;
  const totalConnections = backends.reduce((sum, b) => sum + (b.connections || 0), 0);
  const avgResponseTime = backends.filter(b => b.status === 'healthy')
    .reduce((sum, b, _, arr) => sum + ((b.responseTime || 0) / arr.length), 0);

  const healthPercentage = totalBackends > 0 ? (healthyBackends / totalBackends) * 100 : 0;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100/10 text-green-300 border-green-400/30',
      unhealthy: 'bg-red-100/10 text-red-300 border-red-400/30',
      unknown: 'bg-yellow-100/10 text-yellow-300 border-yellow-400/30'
    };
    return variants[status as keyof typeof variants] || variants.unknown;
  };

  return (
    <div className="space-y-8">
      {/* AI Overview Section */}
      <AIOverview />
      
      {/* Enhanced Summary Cards */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, staggerChildren: 0.1 }}
      >
        <FuturisticCard
          title={t('dashboard.tabs.backends')}
          value={totalBackends}
          icon={Server}
          gradient="from-blue-500 to-cyan-500"
          trend={{ value: 12, isPositive: true }}
          description="Total active backends"
        />

        <FuturisticCard
          title="Healthy Backends"
          value={healthyBackends}
          icon={Activity}
          gradient="from-green-500 to-emerald-500"
          trend={{ value: 5, isPositive: true }}
          description={`${healthPercentage.toFixed(1)}% operational`}
        >
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Health Status</span>
              <span>{healthPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </FuturisticCard>

        <FuturisticCard
          title="Active Connections"
          value={totalConnections}
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          trend={{ value: 8, isPositive: true }}
          description="Real-time connections"
        />

        <FuturisticCard
          title="Avg Response Time"
          value={`${avgResponseTime.toFixed(1)}ms`}
          icon={Zap}
          gradient="from-yellow-500 to-orange-500"
          trend={{ value: 2, isPositive: false }}
          description="Network latency"
        />
      </motion.div>

      {/* Enhanced Backend List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          {/* Header with gradient */}
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-white mb-1">Backend Status</h3>
                <p className="text-slate-400">Real-time backend monitoring</p>
              </div>
              <motion.div
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.2)',
                    '0 0 40px rgba(34, 197, 94, 0.4)',
                    '0 0 20px rgba(34, 197, 94, 0.2)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <Activity className="w-4 h-4 text-green-400" />
                <span className="text-green-300 font-semibold">Live</span>
              </motion.div>
            </div>
          </div>
          
          <div className="p-6">
            <div className="space-y-4">
              {backends.length === 0 ? (
                <motion.div
                  className="text-center py-12"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Server className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                  <h3 className="text-lg font-medium text-slate-300 mb-2">No Backends Found</h3>
                  <p className="text-slate-500">Add backends to monitor their status</p>
                </motion.div>
              ) : (
                backends.map((backend, idx) => (
                  <motion.div
                    key={backend.address || idx}
                    className="group relative overflow-hidden"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ scale: 1.01 }}
                  >
                    {/* Hover glow effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/5 to-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg" />
                    
                    <div className="relative flex items-center justify-between p-6 bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-lg border border-white/10 group-hover:border-cyan-500/30 transition-colors duration-300">
                      <div className="flex items-center gap-4">
                        <motion.div
                          className="relative"
                          animate={{
                            scale: backend.status === 'healthy' ? [1, 1.1, 1] : 1,
                          }}
                          transition={{
                            duration: 2,
                            repeat: backend.status === 'healthy' ? Infinity : 0,
                          }}
                        >
                          {getStatusIcon(backend.status || 'unknown')}
                          
                          {/* Status pulse ring */}
                          {backend.status === 'healthy' && (
                            <motion.div
                              className="absolute inset-0 border-2 border-green-400/50 rounded-full"
                              animate={{
                                scale: [1, 1.5, 1],
                                opacity: [0.5, 0, 0.5],
                              }}
                              transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeOut"
                              }}
                            />
                          )}
                        </motion.div>
                        
                        <div>
                          <div className="font-semibold text-white mb-1">{backend.address}</div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-slate-400">Pool:</span>
                            <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30">
                              {backend.pool}
                            </Badge>
                            <span className="text-sm text-slate-400">Weight:</span>
                            <span className="text-sm text-cyan-300 font-medium">{backend.weight}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-8">
                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Connections</div>
                          <motion.div
                            className="font-bold text-lg text-purple-300"
                            animate={{
                              scale: [1, 1.05, 1],
                            }}
                            transition={{
                              duration: 1.5,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                          >
                            {backend.connections ?? 0}
                          </motion.div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Response Time</div>
                          <div className={`font-bold text-lg ${
                            (backend.responseTime ?? 0) < 100 ? 'text-green-300' :
                            (backend.responseTime ?? 0) < 300 ? 'text-yellow-300' : 'text-red-300'
                          }`}>
                            {backend.responseTime ?? 0}ms
                          </div>
                        </div>

                        <div className="text-center">
                          <div className="text-xs text-slate-400 mb-1">Status</div>
                          <Badge className={getStatusBadge(backend.status || 'unknown')}>
                            {(backend.status || 'unknown').charAt(0).toUpperCase() + (backend.status || 'unknown').slice(1)}
                          </Badge>
                        </div>

                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button 
                            size="sm" 
                            className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white border-0 shadow-lg hover:shadow-cyan-500/25"
                          >
                            Manage
                          </Button>
                        </motion.div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
