import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, AreaChart, Area, Tooltip } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, RefreshCw, Server, Cpu, HardDrive, Network, Clock } from 'lucide-react';
import { useSystemHealth, useSystemMetrics, usePerformanceMetrics, useSystemAlerts } from '@/hooks/use-api';
import { getThreshold } from '@/config/environment';
import FuturisticCard from './FuturisticCard';

interface HealthData {
  timestamp: string;
  backend: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  statusCode: number;
}

export const HealthMonitor = () => {
  const { data: healthData, isLoading: healthLoading } = useSystemHealth();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: performance, isLoading: perfLoading } = usePerformanceMetrics();
  const { data: alerts, isLoading: alertsLoading } = useSystemAlerts();

  const [isMonitoring, setIsMonitoring] = useState(true);

  // Calculate health summary from real data or fallback to demo
  const healthSummary = healthData ? {
    totalChecks: healthData.total_checks || 150,
    successfulChecks: healthData.successful_checks || 147,
    failedChecks: healthData.failed_checks || 3,
    uptime: healthData.uptime_percentage || 98.0
  } : {
    totalChecks: 150,
    successfulChecks: 147,
    failedChecks: 3,
    uptime: 98.0
  };

  // System status based on thresholds
  const getSystemStatus = () => {
    if (!metrics) return 'unknown';
    
    const cpuUsage = metrics.cpu?.usage || 0;
    const memoryUsage = metrics.memory?.usage_percentage || 0;
    const errorRate = metrics.errors?.rate || 0;
    
    const cpuCritical = getThreshold('CPU_CRITICAL');
    const memoryCritical = getThreshold('MEMORY_CRITICAL');
    const errorCritical = getThreshold('ERROR_RATE_CRITICAL');
    
    if (cpuUsage > cpuCritical || memoryUsage > memoryCritical || errorRate > errorCritical) {
      return 'critical';
    }
    
    const cpuWarning = getThreshold('CPU_WARNING');
    const memoryWarning = getThreshold('MEMORY_WARNING');
    const errorWarning = getThreshold('ERROR_RATE_WARNING');
    
    if (cpuUsage > cpuWarning || memoryUsage > memoryWarning || errorRate > errorWarning) {
      return 'warning';
    }
    
    return 'healthy';
  };

  const systemStatus = getSystemStatus();

  // Format uptime
  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* System Status Overview */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, staggerChildren: 0.1 }}
      >
        <FuturisticCard
          title="System Status"
          value={systemStatus.charAt(0).toUpperCase() + systemStatus.slice(1)}
          icon={systemStatus === 'healthy' ? CheckCircle : AlertTriangle}
          gradient={systemStatus === 'healthy' ? "from-green-500 to-emerald-500" : 
                   systemStatus === 'warning' ? "from-yellow-500 to-orange-500" : 
                   "from-red-500 to-rose-500"}
          trend={{ value: healthSummary.uptime, isPositive: healthSummary.uptime > 95 }}
        />

        <FuturisticCard
          title="Total Health Checks"
          value={healthSummary.totalChecks.toLocaleString()}
          icon={Activity}
          gradient="from-blue-500 to-cyan-500"
          description="Last 24h"
        />

        <FuturisticCard
          title="Success Rate"
          value={`${((healthSummary.successfulChecks / healthSummary.totalChecks) * 100).toFixed(1)}%`}
          icon={CheckCircle}
          gradient="from-green-500 to-emerald-500"
          trend={{ value: (healthSummary.successfulChecks / healthSummary.totalChecks) * 100, isPositive: true }}
        />

        <FuturisticCard
          title="System Uptime"
          value={`${healthSummary.uptime}%`}
          icon={Server}
          gradient="from-purple-500 to-pink-500"
          description={metrics?.uptime ? formatUptime(metrics.uptime) : "98d 14h 32m"}
          trend={{ value: healthSummary.uptime, isPositive: healthSummary.uptime > 99 }}
        />
      </motion.div>

      {/* Current System Metrics */}
      {metrics && (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-3 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-400" />
                  <h3 className="text-lg font-semibold text-white">CPU Usage</h3>
                </div>
                <Badge className={
                  (metrics.cpu?.usage || 0) > getThreshold('CPU_CRITICAL') ? 'bg-red-500/20 text-red-300' :
                  (metrics.cpu?.usage || 0) > getThreshold('CPU_WARNING') ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-green-500/20 text-green-300'
                }>
                  {(metrics.cpu?.usage || 0).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={metrics.cpu?.usage || 0} 
                className="h-3 mb-2" 
              />
              <div className="text-sm text-slate-400">
                Load: {metrics.cpu?.load_avg?.[0]?.toFixed(2) || '0.00'}
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-green-400" />
                  <h3 className="text-lg font-semibold text-white">Memory Usage</h3>
                </div>
                <Badge className={
                  (metrics.memory?.usage_percentage || 0) > getThreshold('MEMORY_CRITICAL') ? 'bg-red-500/20 text-red-300' :
                  (metrics.memory?.usage_percentage || 0) > getThreshold('MEMORY_WARNING') ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-green-500/20 text-green-300'
                }>
                  {(metrics.memory?.usage_percentage || 0).toFixed(1)}%
                </Badge>
              </div>
              <Progress 
                value={metrics.memory?.usage_percentage || 0} 
                className="h-3 mb-2" 
              />
              <div className="text-sm text-slate-400">
                {((metrics.memory?.used || 0) / (1024**3)).toFixed(1)}GB / {((metrics.memory?.total || 0) / (1024**3)).toFixed(1)}GB
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10 backdrop-blur-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Network className="w-5 h-5 text-purple-400" />
                  <h3 className="text-lg font-semibold text-white">Network I/O</h3>
                </div>
                <Badge className="bg-purple-500/20 text-purple-300">
                  {((metrics.network?.bytes_sent || 0) / (1024**2)).toFixed(1)} MB/s
                </Badge>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Sent:</span>
                  <span className="text-white">{((metrics.network?.bytes_sent || 0) / (1024**2)).toFixed(1)} MB/s</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Received:</span>
                  <span className="text-white">{((metrics.network?.bytes_recv || 0) / (1024**2)).toFixed(1)} MB/s</span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Response Time Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10 backdrop-blur-sm">
          <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Response Time Trends</h3>
            <div className="flex items-center gap-4">
              <Badge className={isMonitoring ? 'bg-green-100/10 text-green-300' : 'bg-red-100/10 text-red-300'}>
                {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
              </Badge>
              <Button 
                size="sm" 
                variant="outline" 
                className="border-white/20 text-white hover:bg-white/10"
                onClick={() => setIsMonitoring(!isMonitoring)}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                {isMonitoring ? 'Pause' : 'Resume'}
              </Button>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performance?.response_times || [
                  { timestamp: '10:25', responseTime: 1.2, avgResponseTime: 1.1 },
                  { timestamp: '10:26', responseTime: 1.1, avgResponseTime: 1.2 },
                  { timestamp: '10:27', responseTime: 1.3, avgResponseTime: 1.15 },
                  { timestamp: '10:28', responseTime: 1.0, avgResponseTime: 1.1 },
                  { timestamp: '10:29', responseTime: 1.4, avgResponseTime: 1.2 },
                  { timestamp: '10:30', responseTime: 1.2, avgResponseTime: 1.18 },
                ]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="timestamp" 
                    stroke="#9CA3AF"
                    fontSize={12}
                  />
                  <YAxis 
                    stroke="#9CA3AF"
                    fontSize={12}
                    label={{ value: 'Response Time (s)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF' } }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="responseTime"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.2}
                    name="Response Time"
                  />
                  <Line
                    type="monotone"
                    dataKey="avgResponseTime"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={false}
                    name="Average"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Active Alerts */}
      {alerts && alerts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <Card className="bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-500/30">
            <div className="p-6 border-b border-red-500/30">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-xl font-bold text-white">Active Alerts</h3>
                <Badge className="bg-red-500/20 text-red-300">
                  {alerts.length}
                </Badge>
              </div>
            </div>
            <div className="p-6 space-y-4">
              {alerts.slice(0, 5).map((alert: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-4 bg-red-500/10 rounded-lg border border-red-500/20">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <div>
                      <div className="text-white font-medium">{alert.title || `Alert ${index + 1}`}</div>
                      <div className="text-red-200 text-sm">{alert.message || 'System alert triggered'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={
                      alert.severity === 'critical' ? 'bg-red-500/20 text-red-300' :
                      alert.severity === 'warning' ? 'bg-yellow-500/20 text-yellow-300' :
                      'bg-blue-500/20 text-blue-300'
                    }>
                      {alert.severity || 'warning'}
                    </Badge>
                    <Clock className="w-4 h-4 text-slate-400" />
                    <span className="text-sm text-slate-400">
                      {alert.timestamp ? new Date(alert.timestamp).toLocaleTimeString() : 'Now'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      )}
    </div>
  );
};

export default HealthMonitor;
