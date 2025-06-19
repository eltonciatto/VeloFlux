import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, Tooltip, Legend } from 'recharts';
import { TrendingUp, Zap, Users, Globe, Activity, Timer, AlertTriangle, Server, Download, RefreshCw } from 'lucide-react';
import { useSystemMetrics, useRealTimeMetrics, usePerformanceMetrics } from '@/hooks/use-api';
import { getRefreshInterval, getThreshold } from '@/config/environment';
import FuturisticCard from './FuturisticCard';

export const MetricsView = () => {
  const { t } = useTranslation();
  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();
  const { data: realTimeMetrics, isLoading: realTimeLoading } = useRealTimeMetrics();
  const { data: performance, isLoading: perfLoading } = usePerformanceMetrics();
  
  const [timeRange, setTimeRange] = useState('1h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time data or fallback demo data
  const requestsData = performance?.requests_timeline || [
    { time: '10:20', requests: 1200, errors: 12, successful: 1188 },
    { time: '10:22', requests: 1350, errors: 8, successful: 1342 },
    { time: '10:24', requests: 1180, errors: 15, successful: 1165 },
    { time: '10:26', requests: 1420, errors: 5, successful: 1415 },
    { time: '10:28', requests: 1380, errors: 9, successful: 1371 },
    { time: '10:30', requests: 1500, errors: 3, successful: 1497 },
  ];

  const poolDistribution = metrics?.backends?.pools || [
    { name: 'web-servers', value: 65, color: '#3b82f6' },
    { name: 'api-servers', value: 30, color: '#10b981' },
    { name: 'static-assets', value: 5, color: '#f59e0b' },
  ];

  const statusCodes = metrics?.http_status_codes || [
    { code: '2xx', count: 14250, color: '#10b981' },
    { code: '3xx', count: 890, color: '#f59e0b' },
    { code: '4xx', count: 125, color: '#ef4444' },
    { code: '5xx', count: 35, color: '#dc2626' },
  ];

  // Calculate real metrics or use demo values
  const currentMetrics = {
    requestsPerMin: realTimeMetrics?.requests_per_minute || 1500,
    activeConnections: realTimeMetrics?.active_connections || 97,
    errorRate: ((realTimeMetrics?.errors || 0) / (realTimeMetrics?.total_requests || 1000) * 100) || 0.2,
    avgLatency: realTimeMetrics?.avg_response_time || 1.3,
    requestsTrend: realTimeMetrics?.requests_trend || 12,
    connectionsTrend: realTimeMetrics?.connections_trend || 5,
    errorTrend: realTimeMetrics?.error_trend || -0.1,
    latencyTrend: realTimeMetrics?.latency_trend || -0.2
  };

  const exportData = () => {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: currentMetrics,
      requests: requestsData,
      pools: poolDistribution,
      statusCodes: statusCodes
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `veloflux-metrics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Controls */}
      <motion.div 
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">System Metrics</h2>
          <p className="text-slate-400">Real-time performance monitoring and analytics</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={timeRange === '5m' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('5m')}
              className="border-slate-600"
            >
              5m
            </Button>
            <Button
              variant={timeRange === '1h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('1h')}
              className="border-slate-600"
            >
              1h
            </Button>
            <Button
              variant={timeRange === '24h' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setTimeRange('24h')}
              className="border-slate-600"
            >
              24h
            </Button>
          </div>
          
          <Button
            onClick={exportData}
            variant="outline"
            size="sm"
            className="border-slate-600 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            Auto-refresh
          </Button>
        </div>
      </motion.div>

      {/* Enhanced Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, staggerChildren: 0.1 }}
      >
        <FuturisticCard
          title="Requests/Min"
          value={currentMetrics.requestsPerMin.toLocaleString()}
          icon={Zap}
          gradient="from-yellow-500 to-orange-500"
          trend={{ value: currentMetrics.requestsTrend, isPositive: currentMetrics.requestsTrend > 0 }}
          description="Current request rate"
        />

        <FuturisticCard
          title="Active Connections"
          value={currentMetrics.activeConnections.toString()}
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          trend={{ value: currentMetrics.connectionsTrend, isPositive: currentMetrics.connectionsTrend > 0 }}
          description="Concurrent connections"
        />

        <FuturisticCard
          title="Error Rate"
          value={`${currentMetrics.errorRate.toFixed(2)}%`}
          icon={AlertTriangle}
          gradient={currentMetrics.errorRate > getThreshold('ERROR_RATE_CRITICAL') ? "from-red-500 to-rose-500" : 
                   currentMetrics.errorRate > getThreshold('ERROR_RATE_WARNING') ? "from-yellow-500 to-orange-500" : 
                   "from-green-500 to-emerald-500"}
          trend={{ value: Math.abs(currentMetrics.errorTrend), isPositive: currentMetrics.errorTrend < 0 }}
          description="Request error rate"
        />

        <FuturisticCard
          title="Avg Latency"
          value={`${currentMetrics.avgLatency.toFixed(1)}ms`}
          icon={Timer}
          gradient={currentMetrics.avgLatency > getThreshold('RESPONSE_TIME_CRITICAL') ? "from-red-500 to-rose-500" :
                   currentMetrics.avgLatency > getThreshold('RESPONSE_TIME_WARNING') ? "from-yellow-500 to-orange-500" :
                   "from-blue-500 to-cyan-500"}
          trend={{ value: Math.abs(currentMetrics.latencyTrend), isPositive: currentMetrics.latencyTrend < 0 }}
          description="Response latency"
        />
      </motion.div>

      {/* Enhanced Charts Row 1 */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Request Volume & Errors</h3>
                <p className="text-slate-400">Real-time traffic monitoring</p>
              </div>
              <motion.div
                className="p-2 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                    '0 0 40px rgba(59, 130, 246, 0.5)',
                    '0 0 20px rgba(59, 130, 246, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stackId="1"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.3}
                    name="Total Requests"
                  />
                  <Area
                    type="monotone"
                    dataKey="errors"
                    stackId="2"
                    stroke="#EF4444"
                    fill="#EF4444"
                    fillOpacity={0.5}
                    name="Errors"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Backend Pool Distribution</h3>
                <p className="text-slate-400">Load distribution across pools</p>
              </div>
              <motion.div
                className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(16, 185, 129, 0.3)',
                    '0 0 40px rgba(16, 185, 129, 0.5)',
                    '0 0 20px rgba(16, 185, 129, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Server className="w-6 h-6 text-green-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poolDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {poolDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Charts Row 2 */}
      <motion.div 
        className="grid grid-cols-1 lg:grid-cols-2 gap-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">HTTP Status Codes</h3>
                <p className="text-slate-400">Response status distribution</p>
              </div>
              <motion.div
                className="p-2 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(147, 51, 234, 0.3)',
                    '0 0 40px rgba(147, 51, 234, 0.5)',
                    '0 0 20px rgba(147, 51, 234, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <Activity className="w-6 h-6 text-purple-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCodes}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="code" stroke="#9CA3AF" fontSize={12} />
                  <YAxis stroke="#9CA3AF" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="#8B5CF6" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        {performance?.latency_distribution && (
          <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
            <div className="relative p-6 border-b border-white/10">
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 to-blue-500/10" />
              <div className="relative flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">Latency Distribution</h3>
                  <p className="text-slate-400">Response time percentiles</p>
                </div>
                <motion.div
                  className="p-2 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 rounded-lg"
                  animate={{
                    boxShadow: [
                      '0 0 20px rgba(6, 182, 212, 0.3)',
                      '0 0 40px rgba(6, 182, 212, 0.5)',
                      '0 0 20px rgba(6, 182, 212, 0.3)',
                    ]
                  }}
                  transition={{ duration: 2, repeat: Infinity, delay: 1.5 }}
                >
                  <Timer className="w-6 h-6 text-cyan-400" />
                </motion.div>
              </div>
            </div>
            <div className="p-6">
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performance.latency_distribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="percentile" stroke="#9CA3AF" fontSize={12} />
                    <YAxis stroke="#9CA3AF" fontSize={12} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'rgba(15, 23, 42, 0.9)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#06B6D4"
                      strokeWidth={3}
                      dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, stroke: '#06B6D4', strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </Card>
        )}
      </motion.div>

      {/* Real-time Status Indicators */}
      <motion.div
        className="grid grid-cols-1 md:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">System Health</h3>
            <Badge className={
              currentMetrics.errorRate < getThreshold('ERROR_RATE_WARNING') ? 'bg-green-500/20 text-green-300' :
              currentMetrics.errorRate < getThreshold('ERROR_RATE_CRITICAL') ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }>
              {currentMetrics.errorRate < getThreshold('ERROR_RATE_WARNING') ? 'Healthy' :
               currentMetrics.errorRate < getThreshold('ERROR_RATE_CRITICAL') ? 'Warning' : 'Critical'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Error Rate Threshold</div>
            <div className="text-2xl font-bold text-white">{currentMetrics.errorRate.toFixed(2)}%</div>
            <div className="text-sm text-slate-400">
              Target: &lt; {getThreshold('ERROR_RATE_WARNING')}%
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Response Time</h3>
            <Badge className={
              currentMetrics.avgLatency < getThreshold('RESPONSE_TIME_WARNING') ? 'bg-green-500/20 text-green-300' :
              currentMetrics.avgLatency < getThreshold('RESPONSE_TIME_CRITICAL') ? 'bg-yellow-500/20 text-yellow-300' :
              'bg-red-500/20 text-red-300'
            }>
              {currentMetrics.avgLatency < getThreshold('RESPONSE_TIME_WARNING') ? 'Optimal' :
               currentMetrics.avgLatency < getThreshold('RESPONSE_TIME_CRITICAL') ? 'Slow' : 'Critical'}
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Average Latency</div>
            <div className="text-2xl font-bold text-white">{currentMetrics.avgLatency.toFixed(1)}ms</div>
            <div className="text-sm text-slate-400">
              Target: &lt; {getThreshold('RESPONSE_TIME_WARNING')}ms
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Traffic Load</h3>
            <Badge className="bg-blue-500/20 text-blue-300">
              Active
            </Badge>
          </div>
          <div className="space-y-2">
            <div className="text-sm text-slate-400">Requests per Minute</div>
            <div className="text-2xl font-bold text-white">{currentMetrics.requestsPerMin.toLocaleString()}</div>
            <div className="text-sm text-slate-400">
              {currentMetrics.activeConnections} active connections
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
