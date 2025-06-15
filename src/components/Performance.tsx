
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Zap, TrendingUp, Server, Clock, Brain, Target } from 'lucide-react';

export const Performance = () => {
  const throughputData = [
    { time: '0s', rps: 0, ai_rps: 0 },
    { time: '10s', rps: 25000, ai_rps: 28000 },
    { time: '20s', rps: 45000, ai_rps: 52000 },
    { time: '30s', rps: 50000, ai_rps: 58000 },
    { time: '40s', rps: 50000, ai_rps: 58500 },
    { time: '50s', rps: 50000, ai_rps: 59000 },
    { time: '60s', rps: 50000, ai_rps: 59500 },
  ];

  const latencyData = [
    { percentile: 'P50', latency: 1.2, ai_latency: 0.8 },
    { percentile: 'P90', latency: 2.8, ai_latency: 2.1 },
    { percentile: 'P95', latency: 4.1, ai_latency: 3.2 },
    { percentile: 'P99', latency: 8.5, ai_latency: 6.8 },
    { percentile: 'P99.9', latency: 15.2, ai_latency: 11.5 },
  ];

  const aiMetrics = [
    { metric: 'Routing Accuracy', value: 96.5, color: '#8b5cf6' },
    { metric: 'Prediction Score', value: 94.2, color: '#3b82f6' },
    { metric: 'Anomaly Detection', value: 98.8, color: '#10b981' },
    { metric: 'Optimization Rate', value: 92.1, color: '#f59e0b' },
  ];

  const resourceData = [
    { metric: 'CPU', usage: 45, color: '#3b82f6' },
    { metric: 'Memory', usage: 32, color: '#10b981' },
    { metric: 'Network', usage: 78, color: '#f59e0b' },
  ];

  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Brain className="w-4 h-4 mr-2" />
            AI-Enhanced Performance
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Performance Benchmarks
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            Real-world performance metrics comparing traditional load balancing vs AI-enhanced routing
          </p>
        </div>

        {/* AI Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          {aiMetrics.map((metric, index) => (
            <Card key={index} className="bg-slate-800/90 border-purple-400/60 backdrop-blur-sm p-6 text-center hover:bg-slate-800 transition-all duration-300 shadow-lg">
              <Target className="w-8 h-8 text-purple-400 mx-auto mb-3" />
              <div className="text-3xl font-bold text-white mb-1">{metric.value}%</div>
              <div className="text-sm text-purple-200 font-medium">{metric.metric}</div>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card className="bg-slate-800/80 border-white/20 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Throughput Performance</h3>
              <div className="flex gap-2">
                <Badge className="bg-blue-600/30 text-blue-100 border-blue-400/50 font-semibold">Traditional: 50k RPS</Badge>
                <Badge className="bg-purple-600/30 text-purple-100 border-purple-400/50 font-semibold">AI-Enhanced: 59.5k RPS</Badge>
              </div>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={throughputData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="time" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Line 
                    type="monotone" 
                    dataKey="rps" 
                    stroke="#3b82f6" 
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">50k</div>
                <div className="text-sm text-green-200 font-medium">Requests/sec</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-400">100k</div>
                <div className="text-sm text-blue-200 font-medium">Connections</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-400">2 vCPU</div>
                <div className="text-sm text-purple-200 font-medium">Resource Usage</div>
              </div>
            </div>
          </Card>

          <Card className="bg-slate-800/80 border-white/20 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-white">Response Latency</h3>
              <Badge className="bg-blue-600/30 text-blue-100 border-blue-400/50 font-semibold">P99 under 10ms</Badge>
            </div>
            
            <div className="h-64 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="percentile" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" />
                  <Bar dataKey="latency" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-green-400">1.2ms</div>
                <div className="text-sm text-green-200 font-medium">Median (P50)</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-400">4.1ms</div>
                <div className="text-sm text-yellow-200 font-medium">P95 Latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-400">8.5ms</div>
                <div className="text-sm text-red-200 font-medium">P99 Latency</div>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-800/80 border-yellow-400/40 backdrop-blur-sm p-6 text-center hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">99.99%</div>
            <div className="text-sm text-yellow-200 font-medium">Uptime SLA</div>
            <div className="text-xs text-green-300 mt-1 font-medium">Under 53 min/year downtime</div>
          </Card>

          <Card className="bg-slate-800/80 border-green-400/40 backdrop-blur-sm p-6 text-center hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <TrendingUp className="w-8 h-8 text-green-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">5.2M</div>
            <div className="text-sm text-green-200 font-medium">Requests/Hour</div>
            <div className="text-xs text-green-300 mt-1 font-medium">Peak sustained load</div>
          </Card>

          <Card className="bg-slate-800/80 border-blue-400/40 backdrop-blur-sm p-6 text-center hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Server className="w-8 h-8 text-blue-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">45MB</div>
            <div className="text-sm text-blue-200 font-medium">Container Size</div>
            <div className="text-xs text-green-300 mt-1 font-medium">Optimized binary</div>
          </Card>

          <Card className="bg-slate-800/80 border-purple-400/40 backdrop-blur-sm p-6 text-center hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Clock className="w-8 h-8 text-purple-400 mx-auto mb-3" />
            <div className="text-2xl font-bold text-white mb-1">Under 1 s</div>
            <div className="text-sm text-purple-200 font-medium">Startup Time</div>
            <div className="text-xs text-green-300 mt-1 font-medium">Cold start to ready</div>
          </Card>
        </div>

        <Card className="bg-slate-800/80 border-white/20 backdrop-blur-sm p-8 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Resource Efficiency</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {resourceData.map((resource, index) => (
              <div key={index} className="text-center">
                <div className="text-lg font-semibold text-white mb-2">{resource.metric}</div>
                <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div 
                    className="absolute left-0 top-0 h-full rounded-full transition-all duration-1000"
                    style={{ 
                      width: `${resource.usage}%`, 
                      backgroundColor: resource.color 
                    }}
                  />
                </div>
                <div className="text-sm text-slate-200 font-medium">{resource.usage}% utilized</div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-slate-200 mb-4 font-medium">
              Tested on DigitalOcean Premium Intel droplet (2 vCPU, 2GB RAM)
            </p>
            <Badge className="bg-green-600/30 text-green-100 border-green-400/50 font-semibold">
              Efficient resource utilization with room for growth
            </Badge>
          </div>
        </Card>
      </div>
    </section>
  );
};
