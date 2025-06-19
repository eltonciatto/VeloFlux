import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { useProductionData } from '@/hooks/useProductionData';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, 
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  Tooltip, Legend, ScatterChart, Scatter
} from 'recharts';
import {
  Server, Activity, Database, Users, Shield, TrendingUp, TrendingDown,
  AlertTriangle, CheckCircle, Clock, Cpu, HardDrive, Network,
  DollarSign, Brain, Zap, Eye, RefreshCw, Download, Settings,
  Globe, Lock, Gauge, BarChart3, PieChart as PieChartIcon
} from 'lucide-react';

interface ProductionDashboardProps {
  className?: string;
}

export default function ProductionDashboard({ className = '' }: ProductionDashboardProps) {
  const { 
    metrics, 
    logs, 
    performance, 
    loading, 
    error, 
    lastUpdate, 
    refreshAll 
  } = useProductionData();

  const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Real-time status indicators
  const getSystemHealth = () => {
    if (!metrics) return 'unknown';
    
    const errorRate = metrics.system.error_rate;
    const cpuUsage = metrics.system.cpu_usage;
    const memoryUsage = metrics.system.memory_usage;
    
    if (errorRate > 5 || cpuUsage > 90 || memoryUsage > 90) return 'critical';
    if (errorRate > 2 || cpuUsage > 70 || memoryUsage > 80) return 'warning';
    return 'healthy';
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${minutes}m`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const systemHealth = getSystemHealth();

  if (error && !metrics) {
    return (
      <Alert className=\"border-red-500 bg-red-50\">
        <AlertTriangle className=\"h-4 w-4\" />
        <AlertDescription>
          Failed to load production data: {error}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header with controls */}
      <div className=\"flex items-center justify-between\">
        <div>
          <h1 className=\"text-3xl font-bold text-white mb-2\">Production Dashboard</h1>
          <p className=\"text-slate-400\">
            Real-time monitoring and analytics for VeloFlux production environment
          </p>
        </div>
        
        <div className=\"flex items-center gap-4\">
          {lastUpdate && (
            <div className=\"text-sm text-slate-400\">
              Last updated: {lastUpdate.toLocaleTimeString()}
            </div>
          )}
          
          <Button
            onClick={refreshAll}
            variant=\"outline\"
            size=\"sm\"
            disabled={loading}
            className=\"border-slate-600 hover:bg-slate-700\"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? \"default\" : \"outline\"}
            size=\"sm\"
          >
            <Activity className=\"w-4 h-4 mr-2\" />
            Auto-refresh
          </Button>
        </div>
      </div>

      {/* System Status Overview */}
      <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className=\"bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10\">
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"flex items-center gap-2 text-white\">
                <div className={`p-2 rounded-lg ${
                  systemHealth === 'healthy' ? 'bg-green-500/20 text-green-400' :
                  systemHealth === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  systemHealth === 'critical' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                }`}>
                  {systemHealth === 'healthy' ? <CheckCircle className=\"w-5 h-5\" /> :
                   systemHealth === 'warning' ? <AlertTriangle className=\"w-5 h-5\" /> :
                   <AlertTriangle className=\"w-5 h-5\" />}
                </div>
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-white mb-2 capitalize\">
                {systemHealth}
              </div>
              <div className=\"text-sm text-slate-400\">
                Uptime: {metrics ? formatUptime(metrics.system.uptime) : '-'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className=\"bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/20\">
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"flex items-center gap-2 text-white\">
                <div className=\"p-2 rounded-lg bg-blue-500/20 text-blue-400\">
                  <Activity className=\"w-5 h-5\" />
                </div>
                Requests/sec
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-white mb-2\">
                {metrics?.system.requests_per_second.toLocaleString() || '-'}
              </div>
              <div className=\"text-sm text-slate-400\">
                Error rate: {metrics?.system.error_rate.toFixed(2)}%
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className=\"bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-500/20\">
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"flex items-center gap-2 text-white\">
                <div className=\"p-2 rounded-lg bg-purple-500/20 text-purple-400\">
                  <Users className=\"w-5 h-5\" />
                </div>
                Active Tenants
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-white mb-2\">
                {metrics?.tenants.total_active.toLocaleString() || '-'}
              </div>
              <div className=\"text-sm text-slate-400\">
                Total requests: {metrics?.tenants.total_requests.toLocaleString() || '-'}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className=\"bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/20\">
            <CardHeader className=\"pb-2\">
              <CardTitle className=\"flex items-center gap-2 text-white\">
                <div className=\"p-2 rounded-lg bg-green-500/20 text-green-400\">
                  <DollarSign className=\"w-5 h-5\" />
                </div>
                Revenue
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className=\"text-2xl font-bold text-white mb-2\">
                ${metrics?.tenants.billing_revenue.toLocaleString(undefined, { 
                  minimumFractionDigits: 2, 
                  maximumFractionDigits: 2 
                }) || '-'}
              </div>
              <div className=\"text-sm text-slate-400\">
                Bandwidth: {formatBytes((metrics?.tenants.total_bandwidth || 0) * 1024 * 1024 * 1024)}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue=\"overview\" className=\"space-y-6\">
        <TabsList className=\"grid w-full grid-cols-6 bg-slate-800/50 border-slate-700\">
          <TabsTrigger value=\"overview\" className=\"data-[state=active]:bg-slate-700\">
            <BarChart3 className=\"w-4 h-4 mr-2\" />
            Overview
          </TabsTrigger>
          <TabsTrigger value=\"performance\" className=\"data-[state=active]:bg-slate-700\">
            <Gauge className=\"w-4 h-4 mr-2\" />
            Performance
          </TabsTrigger>
          <TabsTrigger value=\"backends\" className=\"data-[state=active]:bg-slate-700\">
            <Server className=\"w-4 h-4 mr-2\" />
            Backends
          </TabsTrigger>
          <TabsTrigger value=\"ai-insights\" className=\"data-[state=active]:bg-slate-700\">
            <Brain className=\"w-4 h-4 mr-2\" />
            AI Insights
          </TabsTrigger>
          <TabsTrigger value=\"security\" className=\"data-[state=active]:bg-slate-700\">
            <Shield className=\"w-4 h-4 mr-2\" />
            Security
          </TabsTrigger>
          <TabsTrigger value=\"logs\" className=\"data-[state=active]:bg-slate-700\">
            <Eye className=\"w-4 h-4 mr-2\" />
            Logs
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value=\"overview\" className=\"space-y-6\">
          <div className=\"grid grid-cols-1 lg:grid-cols-2 gap-6\">
            {/* System Resources */}
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white flex items-center gap-2\">
                  <Cpu className=\"w-5 h-5\" />
                  System Resources
                </CardTitle>
              </CardHeader>
              <CardContent className=\"space-y-4\">
                <div>
                  <div className=\"flex justify-between text-sm mb-2\">
                    <span className=\"text-slate-300\">CPU Usage</span>
                    <span className=\"text-white\">{metrics?.system.cpu_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics?.system.cpu_usage || 0} 
                    className=\"h-2\"
                  />
                </div>
                
                <div>
                  <div className=\"flex justify-between text-sm mb-2\">
                    <span className=\"text-slate-300\">Memory Usage</span>
                    <span className=\"text-white\">{metrics?.system.memory_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics?.system.memory_usage || 0} 
                    className=\"h-2\"
                  />
                </div>
                
                <div>
                  <div className=\"flex justify-between text-sm mb-2\">
                    <span className=\"text-slate-300\">Disk Usage</span>
                    <span className=\"text-white\">{metrics?.system.disk_usage.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={metrics?.system.disk_usage || 0} 
                    className=\"h-2\"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Network Stats */}
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white flex items-center gap-2\">
                  <Network className=\"w-5 h-5\" />
                  Network Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"grid grid-cols-2 gap-4\">
                  <div className=\"text-center\">
                    <div className=\"text-2xl font-bold text-green-400\">
                      {formatBytes((metrics?.system.network_in || 0) * 1024 * 1024)}/s
                    </div>
                    <div className=\"text-sm text-slate-400\">Inbound</div>
                  </div>
                  <div className=\"text-center\">
                    <div className=\"text-2xl font-bold text-blue-400\">
                      {formatBytes((metrics?.system.network_out || 0) * 1024 * 1024)}/s
                    </div>
                    <div className=\"text-sm text-slate-400\">Outbound</div>
                  </div>
                </div>
                
                <div className=\"mt-4 text-center\">
                  <div className=\"text-lg font-semibold text-white\">
                    {metrics?.system.active_connections.toLocaleString() || '-'}
                  </div>
                  <div className=\"text-sm text-slate-400\">Active Connections</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Chart */}
          {performance && (
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white\">Performance Trends (24h)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"h-64\">
                  <ResponsiveContainer width=\"100%\" height=\"100%\">
                    <LineChart data={performance.historical}>
                      <CartesianGrid strokeDasharray=\"3 3\" stroke=\"#374151\" />
                      <XAxis 
                        dataKey=\"timestamp\" 
                        stroke=\"#9CA3AF\"
                        tickFormatter={(time) => new Date(time).getHours() + ':00'}
                      />
                      <YAxis stroke=\"#9CA3AF\" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                        labelStyle={{ color: '#F3F4F6' }}
                      />
                      <Legend />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"requests_per_second\" 
                        stroke=\"#3B82F6\" 
                        strokeWidth={2}
                        name=\"Requests/sec\"
                      />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"response_time_avg\" 
                        stroke=\"#10B981\" 
                        strokeWidth={2}
                        name=\"Avg Response Time (ms)\"
                      />
                      <Line 
                        type=\"monotone\" 
                        dataKey=\"error_rate\" 
                        stroke=\"#EF4444\" 
                        strokeWidth={2}
                        name=\"Error Rate (%)\"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value=\"performance\" className=\"space-y-6\">
          <div className=\"grid grid-cols-1 lg:grid-cols-3 gap-6\">
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white\">Current Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-3xl font-bold text-blue-400 mb-2\">
                  {performance?.realtime.current_load.toFixed(1)}%
                </div>
                <Progress value={performance?.realtime.current_load || 0} className=\"mb-2\" />
                <div className=\"text-sm text-slate-400\">
                  Peak today: {performance?.realtime.peak_load_today.toFixed(1)}%
                </div>
              </CardContent>
            </Card>

            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white\">Response Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-3xl font-bold text-green-400 mb-2\">
                  {performance?.realtime.avg_response_time.toFixed(1)}ms
                </div>
                <div className=\"space-y-1 text-sm text-slate-400\">
                  <div>P95: {metrics?.system.response_time_p95.toFixed(1)}ms</div>
                  <div>P99: {metrics?.system.response_time_p99.toFixed(1)}ms</div>
                </div>
              </CardContent>
            </Card>

            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white\">Backend Health</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-3xl font-bold text-purple-400 mb-2\">
                  {performance?.realtime.healthy_backends}/{performance?.realtime.active_backends}
                </div>
                <div className=\"text-sm text-slate-400\">
                  Healthy backends online
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Backends Tab */}
        <TabsContent value=\"backends\" className=\"space-y-6\">
          <div className=\"grid gap-4\">
            {metrics?.backends.map((backend, index) => (
              <motion.div
                key={backend.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className=\"bg-slate-900/50 border-slate-700\">
                  <CardHeader>
                    <div className=\"flex items-center justify-between\">
                      <CardTitle className=\"text-white flex items-center gap-2\">
                        <Server className=\"w-5 h-5\" />
                        {backend.id}
                      </CardTitle>
                      <Badge 
                        variant={backend.status === 'healthy' ? 'default' : 
                                backend.status === 'warning' ? 'secondary' : 'destructive'}
                        className={
                          backend.status === 'healthy' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                          backend.status === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        }
                      >
                        {backend.status}
                      </Badge>
                    </div>
                    <CardDescription className=\"text-slate-400\">
                      {backend.address}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className=\"grid grid-cols-2 md:grid-cols-4 gap-4\">
                      <div>
                        <div className=\"text-sm text-slate-400\">Response Time</div>
                        <div className=\"text-lg font-semibold text-white\">
                          {backend.response_time.toFixed(1)}ms
                        </div>
                      </div>
                      <div>
                        <div className=\"text-sm text-slate-400\">Requests</div>
                        <div className=\"text-lg font-semibold text-white\">
                          {backend.requests_count.toLocaleString()}
                        </div>
                      </div>
                      <div>
                        <div className=\"text-sm text-slate-400\">CPU Usage</div>
                        <div className=\"text-lg font-semibold text-white\">
                          {backend.cpu_usage.toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <div className=\"text-sm text-slate-400\">Memory</div>
                        <div className=\"text-lg font-semibold text-white\">
                          {backend.memory_usage.toFixed(1)}%
                        </div>
                      </div>
                    </div>
                    
                    {backend.error_count > 0 && (
                      <div className=\"mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg\">
                        <div className=\"text-sm text-red-400\">
                          {backend.error_count} errors in the last hour
                        </div>
                      </div>
                    )}
                    
                    <div className=\"mt-4 text-xs text-slate-500\">
                      Last check: {new Date(backend.last_check).toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value=\"ai-insights\" className=\"space-y-6\">
          {metrics?.ai.enabled ? (
            <div className=\"grid gap-6\">
              <div className=\"grid grid-cols-1 md:grid-cols-3 gap-6\">
                <Card className=\"bg-gradient-to-br from-purple-900/50 to-purple-800/50 border-purple-500/20\">
                  <CardHeader>
                    <CardTitle className=\"text-white flex items-center gap-2\">
                      <Brain className=\"w-5 h-5\" />
                      Model Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-3xl font-bold text-purple-400 mb-2\">
                      {metrics.ai.model_accuracy.toFixed(1)}%
                    </div>
                    <div className=\"text-sm text-slate-400\">
                      Confidence: {metrics.ai.confidence_level.toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>

                <Card className=\"bg-gradient-to-br from-blue-900/50 to-blue-800/50 border-blue-500/20\">
                  <CardHeader>
                    <CardTitle className=\"text-white flex items-center gap-2\">
                      <Zap className=\"w-5 h-5\" />
                      Predictions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-3xl font-bold text-blue-400 mb-2\">
                      {metrics.ai.predictions_count.toLocaleString()}
                    </div>
                    <div className=\"text-sm text-slate-400\">
                      Anomalies: {metrics.ai.anomalies_detected}
                    </div>
                  </CardContent>
                </Card>

                <Card className=\"bg-gradient-to-br from-green-900/50 to-green-800/50 border-green-500/20\">
                  <CardHeader>
                    <CardTitle className=\"text-white flex items-center gap-2\">
                      <TrendingUp className=\"w-5 h-5\" />
                      Optimization Score
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className=\"text-3xl font-bold text-green-400 mb-2\">
                      {metrics.ai.optimization_score.toFixed(1)}%
                    </div>
                    <div className=\"text-sm text-slate-400\">
                      Algorithm: {metrics.ai.current_algorithm.replace(/_/g, ' ')}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card className=\"bg-slate-900/50 border-slate-700\">
                <CardHeader>
                  <CardTitle className=\"text-white\">AI Status</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className=\"flex items-center gap-4\">
                    <div className=\"flex items-center gap-2\">
                      <div className=\"w-3 h-3 bg-green-400 rounded-full animate-pulse\"></div>
                      <span className=\"text-slate-300\">AI Engine Active</span>
                    </div>
                    <div className=\"text-sm text-slate-400\">
                      Last prediction: {new Date(metrics.ai.last_prediction).toLocaleString()}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardContent className=\"text-center py-12\">
                <Brain className=\"w-12 h-12 text-slate-500 mx-auto mb-4\" />
                <h3 className=\"text-lg font-semibold text-white mb-2\">AI Not Enabled</h3>
                <p className=\"text-slate-400\">
                  Enable AI features to see intelligent insights and predictions.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value=\"security\" className=\"space-y-6\">
          <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6\">
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white text-sm\">Blocked Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-2xl font-bold text-red-400\">
                  {metrics?.security.blocked_requests.toLocaleString() || '-'}
                </div>
              </CardContent>
            </Card>

            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white text-sm\">WAF Triggers</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-2xl font-bold text-yellow-400\">
                  {metrics?.security.waf_triggers.toLocaleString() || '-'}
                </div>
              </CardContent>
            </Card>

            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white text-sm\">Rate Limits</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"text-2xl font-bold text-blue-400\">
                  {metrics?.security.rate_limit_hits.toLocaleString() || '-'}
                </div>
              </CardContent>
            </Card>

            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white text-sm\">Threat Level</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge 
                  className={`text-lg py-1 px-3 ${
                    metrics?.security.threat_level === 'low' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                    metrics?.security.threat_level === 'medium' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                    metrics?.security.threat_level === 'high' ? 'bg-orange-500/20 text-orange-400 border-orange-500/30' :
                    'bg-red-500/20 text-red-400 border-red-500/30'
                  }`}
                >
                  {metrics?.security.threat_level || 'Unknown'}
                </Badge>
              </CardContent>
            </Card>
          </div>

          {/* Suspicious IPs */}
          {metrics?.security.suspicious_ips && metrics.security.suspicious_ips.length > 0 && (
            <Card className=\"bg-slate-900/50 border-slate-700\">
              <CardHeader>
                <CardTitle className=\"text-white\">Suspicious IP Addresses</CardTitle>
              </CardHeader>
              <CardContent>
                <div className=\"grid grid-cols-1 md:grid-cols-3 gap-2\">
                  {metrics.security.suspicious_ips.map((ip, index) => (
                    <div key={index} className=\"flex items-center gap-2 p-2 bg-red-500/10 border border-red-500/20 rounded\">
                      <Lock className=\"w-4 h-4 text-red-400\" />
                      <span className=\"text-red-400 font-mono\">{ip}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value=\"logs\" className=\"space-y-6\">
          <Card className=\"bg-slate-900/50 border-slate-700\">
            <CardHeader>
              <CardTitle className=\"text-white\">System Logs</CardTitle>
              <CardDescription>
                Recent system events and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              {logs && logs.entries.length > 0 ? (
                <div className=\"space-y-2 max-h-96 overflow-y-auto\">
                  {logs.entries.map((entry, index) => (
                    <div key={index} className=\"p-3 bg-slate-800/50 rounded border border-slate-700\">
                      <div className=\"flex items-center justify-between mb-1\">
                        <div className=\"flex items-center gap-2\">
                          <Badge 
                            className={`text-xs ${
                              entry.level === 'error' ? 'bg-red-500/20 text-red-400 border-red-500/30' :
                              entry.level === 'warn' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                              entry.level === 'info' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                              'bg-gray-500/20 text-gray-400 border-gray-500/30'
                            }`}
                          >
                            {entry.level.toUpperCase()}
                          </Badge>
                          <span className=\"text-sm text-slate-400\">{entry.component}</span>
                        </div>
                        <span className=\"text-xs text-slate-500\">
                          {new Date(entry.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className=\"text-white text-sm\">{entry.message}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className=\"text-center py-8 text-slate-400\">
                  No logs available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Active Alerts */}
      {metrics?.alerts && metrics.alerts.filter(alert => !alert.resolved).length > 0 && (
        <Card className=\"bg-slate-900/50 border-yellow-500/30\">
          <CardHeader>
            <CardTitle className=\"text-white flex items-center gap-2\">
              <AlertTriangle className=\"w-5 h-5 text-yellow-400\" />
              Active Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className=\"space-y-2\">
              {metrics.alerts.filter(alert => !alert.resolved).map((alert) => (
                <Alert key={alert.id} className={`border-${
                  alert.severity === 'critical' ? 'red' :
                  alert.severity === 'error' ? 'red' :
                  alert.severity === 'warning' ? 'yellow' :
                  'blue'
                }-500/30 bg-${
                  alert.severity === 'critical' ? 'red' :
                  alert.severity === 'error' ? 'red' :
                  alert.severity === 'warning' ? 'yellow' :
                  'blue'
                }-500/10`}>
                  <AlertTriangle className=\"h-4 w-4\" />
                  <AlertDescription className=\"flex items-center justify-between\">
                    <div>
                      <span className=\"font-medium\">{alert.component}:</span> {alert.message}
                    </div>
                    <span className=\"text-xs text-slate-400\">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
