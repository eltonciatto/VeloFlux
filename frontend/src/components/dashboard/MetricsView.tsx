
import React from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Zap, Users, Globe, Activity, Timer, AlertTriangle } from 'lucide-react';
import FuturisticCard from './FuturisticCard';

export const MetricsView = () => {
  const { t } = useTranslation();
  
  const requestsData = [
    { time: '10:20', requests: 1200, errors: 12 },
    { time: '10:22', requests: 1350, errors: 8 },
    { time: '10:24', requests: 1180, errors: 15 },
    { time: '10:26', requests: 1420, errors: 5 },
    { time: '10:28', requests: 1380, errors: 9 },
    { time: '10:30', requests: 1500, errors: 3 },
  ];

  const poolDistribution = [
    { name: 'web-servers', value: 65, color: '#3b82f6' },
    { name: 'api-servers', value: 30, color: '#10b981' },
    { name: 'static-assets', value: 5, color: '#f59e0b' },
  ];

  const statusCodes = [
    { code: '2xx', count: 14250, color: '#10b981' },
    { code: '3xx', count: 890, color: '#f59e0b' },
    { code: '4xx', count: 125, color: '#ef4444' },
    { code: '5xx', count: 35, color: '#dc2626' },
  ];

  return (
    <div className="space-y-8">
      {/* Enhanced Key Metrics */}
      <motion.div 
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, staggerChildren: 0.1 }}
      >
        <FuturisticCard
          title="Requests/Min"
          value="1,500"
          icon={Zap}
          gradient="from-yellow-500 to-orange-500"
          trend={{ value: 12, isPositive: true }}
          description="Current request rate"
        />

        <FuturisticCard
          title="Active Connections"
          value="97"
          icon={Users}
          gradient="from-purple-500 to-pink-500"
          trend={{ value: 5, isPositive: true }}
          description="Concurrent connections"
        />

        <FuturisticCard
          title="Error Rate"
          value="0.2%"
          icon={AlertTriangle}
          gradient="from-red-500 to-rose-500"
          trend={{ value: 0.1, isPositive: false }}
          description="Request error rate"
        />

        <FuturisticCard
          title="Avg Latency"
          value="1.3ms"
          icon={Timer}
          gradient="from-blue-500 to-cyan-500"
          trend={{ value: 0.2, isPositive: false }}
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
                <Activity className="w-5 h-5 text-blue-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="time" 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="url(#requestsGradient)" 
                    strokeWidth={3}
                    name="Requests"
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#3b82f6', strokeWidth: 2, fill: '#fff' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="url(#errorsGradient)" 
                    strokeWidth={3}
                    name="Errors"
                    dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2, fill: '#fff' }}
                  />
                  <defs>
                    <linearGradient id="requestsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#06b6d4" />
                    </linearGradient>
                    <linearGradient id="errorsGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ef4444" />
                      <stop offset="100%" stopColor="#f59e0b" />
                    </linearGradient>
                  </defs>
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-pink-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Traffic Distribution by Pool</h3>
                <p className="text-slate-400">Load balancing distribution</p>
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
                transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
              >
                <Globe className="w-5 h-5 text-purple-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64 flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={poolDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                    labelLine={false}
                  >
                    {poolDistribution.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.color}
                        stroke="#1e293b"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 mt-4">
              {poolDistribution.map((entry, index) => (
                <div key={index} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-sm text-slate-300">{entry.name}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Enhanced Status Codes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.4 }}
      >
        <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border border-white/10 backdrop-blur-xl overflow-hidden">
          <div className="relative p-6 border-b border-white/10">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10" />
            <div className="relative flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white mb-1">HTTP Status Code Distribution</h3>
                <p className="text-slate-400">Response status breakdown</p>
              </div>
              <motion.div
                className="p-2 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg"
                animate={{
                  boxShadow: [
                    '0 0 20px rgba(34, 197, 94, 0.3)',
                    '0 0 40px rgba(34, 197, 94, 0.5)',
                    '0 0 20px rgba(34, 197, 94, 0.3)',
                  ]
                }}
                transition={{ duration: 2, repeat: Infinity, delay: 1 }}
              >
                <TrendingUp className="w-5 h-5 text-green-400" />
              </motion.div>
            </div>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusCodes} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                  <XAxis 
                    dataKey="code" 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Bar 
                    dataKey="count" 
                    radius={[4, 4, 0, 0]}
                    fill="url(#statusGradient)"
                  />
                  <defs>
                    <linearGradient id="statusGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#10b981" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            {/* Enhanced Status Code Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {statusCodes.map((status, index) => (
                <motion.div
                  key={index}
                  className="text-center p-4 bg-gradient-to-br from-slate-800/50 to-slate-700/50 rounded-lg border border-white/10"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div 
                    className="w-6 h-6 rounded-full mx-auto mb-2 shadow-lg"
                    style={{ 
                      backgroundColor: status.color,
                      boxShadow: `0 0 20px ${status.color}40`
                    }}
                  />
                  <div className="text-2xl font-bold text-white mb-1">{status.count.toLocaleString()}</div>
                  <div className="text-sm text-slate-400">{status.code} responses</div>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
