
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Zap, Users, Globe } from 'lucide-react';

export const MetricsView = () => {
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
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Requests/Min</p>
              <p className="text-2xl font-bold text-white">1,500</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">+12%</span>
              </div>
            </div>
            <Zap className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Active Connections</p>
              <p className="text-2xl font-bold text-white">97</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400" />
                <span className="text-xs text-green-400">+5%</span>
              </div>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Error Rate</p>
              <p className="text-2xl font-bold text-white">0.2%</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-red-400 rotate-180" />
                <span className="text-xs text-green-400">-0.1%</span>
              </div>
            </div>
            <Globe className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Avg Latency</p>
              <p className="text-2xl font-bold text-white">1.3ms</p>
              <div className="flex items-center gap-1 mt-1">
                <TrendingUp className="w-3 h-3 text-green-400 rotate-180" />
                <span className="text-xs text-green-400">-0.2ms</span>
              </div>
            </div>
            <Zap className="w-8 h-8 text-blue-400" />
          </div>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Request Volume & Errors</h3>
          </div>
          <div className="p-6">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={requestsData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Line 
                    type="monotone" 
                    dataKey="requests" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Requests"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="errors" 
                    stroke="#ef4444" 
                    strokeWidth={2}
                    name="Errors"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-xl font-bold text-white">Traffic Distribution by Pool</h3>
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
                  >
                    {poolDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </Card>
      </div>

      {/* Status Codes */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">HTTP Status Code Distribution</h3>
        </div>
        <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusCodes}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="code" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-4 mt-6">
            {statusCodes.map((status, index) => (
              <div key={index} className="text-center">
                <div 
                  className="w-4 h-4 rounded mx-auto mb-2"
                  style={{ backgroundColor: status.color }}
                />
                <div className="text-lg font-bold text-white">{status.count}</div>
                <div className="text-sm text-blue-200">{status.code} responses</div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
