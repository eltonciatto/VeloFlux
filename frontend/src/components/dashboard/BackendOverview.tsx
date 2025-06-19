import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Server, Activity, Clock, Users, AlertTriangle, CheckCircle, TrendingUp, Zap, Network, Database, Globe, Wifi, WifiOff } from 'lucide-react';
import { useBackends, useClusterInfo, useSystemMetrics } from '@/hooks/use-api';
import { getThreshold } from '@/config/environment';
import { AdvancedErrorBoundary } from '@/components/ui/advanced-error-boundary';
import { useRealtimeBackends } from '@/hooks/useRealtimeWebSocket';
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
  region?: string;
  load?: number;
  uptime?: number;
}

export const BackendOverview = () => {
  const { t } = useTranslation();
  const { data: backends = [], isLoading: backendsLoading } = useBackends();
  const { data: cluster, isLoading: clusterLoading } = useClusterInfo();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  
  // 🚀 Real-time WebSocket integration
  const { 
    isConnected: wsConnected, 
    lastMessage, 
    connectionStatus,
    error: wsError 
  } = useRealtimeBackends();

  // 🚀 Real-time state management
  const [realtimeBackends, setRealtimeBackends] = useState(backends);
  
  const [selectedPool, setSelectedPool] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('status');

  const totalBackends = backends.length;
  const healthyBackends = backends.filter(b => b.status === 'healthy').length;
  const totalConnections = backends.reduce((sum, b) => sum + (b.connections || 0), 0);
  const avgResponseTime = backends.filter(b => b.status === 'healthy')
    .reduce((sum, b, _, arr) => sum + ((b.responseTime || 0) / arr.length), 0);

  const healthPercentage = totalBackends > 0 ? (healthyBackends / totalBackends) * 100 : 0;

  // Get unique pools
  const pools: string[] = ['all', ...Array.from(new Set(backends.map(b => b.pool).filter(Boolean) as string[]))];

  // Filter backends by pool
  const filteredBackends = selectedPool === 'all' 
    ? backends 
    : backends.filter(b => b.pool === selectedPool);

  // Sort backends
  const sortedBackends = [...filteredBackends].sort((a, b) => {
    switch (sortBy) {
      case 'status':
        return (a.status || '').localeCompare(b.status || '');
      case 'load':
        return (b.load || 0) - (a.load || 0);
      case 'responseTime':
        return (a.responseTime || 0) - (b.responseTime || 0);
      case 'connections':
        return (b.connections || 0) - (a.connections || 0);
      default:
        return 0;
    }
  });

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

  const getLoadStatus = (load: number) => {
    if (load > 90) return 'critical';
    if (load > 70) return 'warning';
    return 'normal';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    return `${days}d ${hours}h`;
  };

  // 🚀 Process real-time WebSocket updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'backend_status_update':
          setRealtimeBackends(lastMessage.data);
          break;
        case 'backend_metrics_update':
          // Update individual backend metrics
          if (lastMessage.data.backend_id) {
            setRealtimeBackends(prev => 
              prev.map(backend => 
                backend.address === lastMessage.data.backend_id 
                  ? { ...backend, ...lastMessage.data.metrics }
                  : backend
              )
            );
          }
          break;
        case 'pool_status_change':
          // Handle pool-level changes
          break;
      }
    }
  }, [lastMessage]);

  // Use real-time data if available, fallback to API data
  const currentBackends = realtimeBackends.length > 0 ? realtimeBackends : backends;
  
  return (
    <AdvancedErrorBoundary
      onError={(error, errorInfo) => {
        console.error('BackendOverview Error:', error, errorInfo);
      }}
    >
      <div className="space-y-8">
        {/* 🚀 Real-time Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
        >
          <div className="flex items-center gap-3">
            {wsConnected ? (
              <>
                <Wifi className="h-4 w-4 text-green-400" />
                <span className="text-sm text-green-400">Real-time backend monitoring active</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400">Connecting to real-time data...</span>
              </>
            )}
          </div>
          <Badge 
            variant={wsConnected ? "default" : "secondary"}
            className={wsConnected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
          >
            {connectionStatus}
          </Badge>
        </motion.div>

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
          trend={{ value: totalBackends > 0 ? 12 : 0, isPositive: true }}
          description="Total active backends"
        />

        <FuturisticCard
          title="Healthy Backends"
          value={healthyBackends}
          icon={Activity}
          gradient={healthPercentage > 90 ? "from-green-500 to-emerald-500" : 
                   healthPercentage > 70 ? "from-yellow-500 to-orange-500" : 
                   "from-red-500 to-rose-500"}
          trend={{ value: healthPercentage, isPositive: healthPercentage > 90 }}
          description={`${healthPercentage.toFixed(1)}% operational`}
        >
          <div className="mt-3">
            <div className="flex justify-between text-xs text-slate-400 mb-1">
              <span>Health Status</span>
              <span>{healthPercentage.toFixed(1)}%</span>
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`absolute inset-y-0 left-0 rounded-full ${
                  healthPercentage > 90 ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                  healthPercentage > 70 ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                  'bg-gradient-to-r from-red-500 to-rose-500'
                }`}
                initial={{ width: 0 }}
                animate={{ width: `${healthPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>
        </FuturisticCard>

        <FuturisticCard
          title="Active Connections"
          value={totalConnections.toLocaleString()}
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          trend={{ value: totalConnections > 0 ? 8 : 0, isPositive: true }}
          description="Current connections"
        />

        <FuturisticCard
          title="Avg Response Time"
          value={`${avgResponseTime.toFixed(1)}ms`}
          icon={Zap}
          gradient={avgResponseTime < getThreshold('RESPONSE_TIME_WARNING') ? "from-green-500 to-emerald-500" :
                   avgResponseTime < getThreshold('RESPONSE_TIME_CRITICAL') ? "from-yellow-500 to-orange-500" :
                   "from-red-500 to-rose-500"}
          trend={{ value: Math.abs(avgResponseTime - 100), isPositive: avgResponseTime < 200 }}
          description="Response latency"
        />
      </motion.div>

      {/* Cluster Information */}
      {cluster && (
        <motion.div
          className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                <h3 className="text-xl font-bold text-white">Cluster Status</h3>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-slate-400">Cluster ID</div>
                  <div className="text-white font-mono">{cluster.id || 'cluster-001'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Node Count</div>
                  <div className="text-white">{cluster.node_count || backends.length}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Load Balancer</div>
                  <div className="text-white">{cluster.algorithm || 'Round Robin'}</div>
                </div>
                <div>
                  <div className="text-sm text-slate-400">Health Checks</div>
                  <Badge className="bg-green-500/20 text-green-300">
                    {cluster.health_check_enabled ? 'Enabled' : 'Disabled'}
                  </Badge>
                </div>
              </div>
              <div>
                <div className="text-sm text-slate-400 mb-2">Regional Distribution</div>
                <div className="space-y-2">
                  {(cluster.regions || ['us-east-1', 'us-west-2', 'eu-west-1']).map((region: string, index: number) => {
                    const regionBackends = backends.filter(b => b.region === region || index === 0);
                    const percentage = (regionBackends.length / totalBackends) * 100;
                    return (
                      <div key={region} className="flex items-center justify-between">
                        <span className="text-sm text-white">{region}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400 w-10">{percentage.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl">
            <div className="p-6 border-b border-white/10">
              <div className="flex items-center gap-2">
                <Database className="w-5 h-5 text-purple-400" />
                <h3 className="text-xl font-bold text-white">Pool Statistics</h3>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                {pools.filter(p => p !== 'all').map((pool: string, index: number) => {
                  const poolBackends = backends.filter(b => b.pool === pool);
                  const poolHealthy = poolBackends.filter(b => b.status === 'healthy').length;
                  const poolHealth = poolBackends.length > 0 ? (poolHealthy / poolBackends.length) * 100 : 0;
                  
                  return (
                    <div key={pool} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full ${
                            poolHealth > 90 ? 'bg-green-400' :
                            poolHealth > 70 ? 'bg-yellow-400' : 'bg-red-400'
                          }`} />
                          <span className="text-white font-medium">{pool}</span>
                        </div>
                        <Badge className={
                          poolHealth > 90 ? 'bg-green-500/20 text-green-300' :
                          poolHealth > 70 ? 'bg-yellow-500/20 text-yellow-300' :
                          'bg-red-500/20 text-red-300'
                        }>
                          {poolHealth.toFixed(0)}%
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">Backends</div>
                          <div className="text-white">{poolBackends.length}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Healthy</div>
                          <div className="text-white">{poolHealthy}</div>
                        </div>
                        <div>
                          <div className="text-slate-400">Load</div>
                          <div className="text-white">
                            {poolBackends.reduce((sum, b) => sum + (b.load || 0), 0).toFixed(0)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Backend Controls */}
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Backend Management</h3>
          <p className="text-slate-400">Monitor and manage individual backend servers</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPool} onValueChange={setSelectedPool}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
              <SelectValue placeholder="Select pool" />
            </SelectTrigger>
            <SelectContent>
              {pools.map((pool: string) => (
                <SelectItem key={pool} value={pool}>
                  {pool === 'all' ? 'All Pools' : pool}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-40 bg-slate-800/50 border-slate-600">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="status">Status</SelectItem>
              <SelectItem value="load">Load</SelectItem>
              <SelectItem value="responseTime">Response Time</SelectItem>
              <SelectItem value="connections">Connections</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Backend List */}
      <motion.div 
        className="grid gap-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {sortedBackends.map((backend, index) => {
          const loadStatus = getLoadStatus(backend.load || 0);
          
          return (
            <motion.div
              key={`${backend.pool}-${backend.address}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl hover:border-cyan-500/30 transition-all duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(backend.status || 'unknown')}
                        <div>
                          <div className="text-white font-semibold">{backend.address}</div>
                          <div className="text-sm text-slate-400">Pool: {backend.pool}</div>
                        </div>
                      </div>
                      
                      <Badge className={getStatusBadge(backend.status || 'unknown')}>
                        {backend.status || 'unknown'}
                      </Badge>
                      
                      {backend.region && (
                        <Badge className="bg-blue-500/20 text-blue-300">
                          {backend.region}
                        </Badge>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-slate-400">Weight</div>
                        <div className="text-white font-medium">{backend.weight}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-slate-400">Connections</div>
                        <div className="text-white font-medium">{backend.connections || 0}</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-slate-400">Response Time</div>
                        <div className={`font-medium ${
                          (backend.responseTime || 0) < getThreshold('RESPONSE_TIME_WARNING') ? 'text-green-400' :
                          (backend.responseTime || 0) < getThreshold('RESPONSE_TIME_CRITICAL') ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {backend.responseTime?.toFixed(1) || '0.0'}ms
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-slate-400">Load</div>
                        <div className={`font-medium ${
                          loadStatus === 'normal' ? 'text-green-400' :
                          loadStatus === 'warning' ? 'text-yellow-400' : 'text-red-400'
                        }`}>
                          {(backend.load || 0).toFixed(0)}%
                        </div>
                      </div>
                      
                      {backend.uptime && (
                        <div className="text-center">
                          <div className="text-slate-400">Uptime</div>
                          <div className="text-white font-medium">{formatUptime(backend.uptime)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {backend.load !== undefined && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-slate-400 mb-1">
                        <span>Current Load</span>
                        <span>{(backend.load || 0).toFixed(1)}%</span>
                      </div>
                      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div
                          className={`absolute inset-y-0 left-0 rounded-full ${
                            loadStatus === 'normal' ? 'bg-gradient-to-r from-green-500 to-emerald-500' :
                            loadStatus === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-orange-500' :
                            'bg-gradient-to-r from-red-500 to-rose-500'
                          }`}
                          initial={{ width: 0 }}
                          animate={{ width: `${backend.load || 0}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </motion.div>

      {sortedBackends.length === 0 && (
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl">
          <div className="p-12 text-center">
            <Server className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Backends Found</h3>
            <p className="text-slate-400">
              {selectedPool === 'all' 
                ? 'No backends are currently registered.' 
                : `No backends found in pool "${selectedPool}".`}
            </p>
          </div>
        </Card>
      )}
    </div>
    </AdvancedErrorBoundary>
  );
};

export default BackendOverview;
