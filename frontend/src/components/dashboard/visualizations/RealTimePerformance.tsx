import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Gauge,
  Zap,
  TrendingUp
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  requests: number;
  responseTime: number;
}

export function RealTimePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isLive, setIsLive] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gerar métricas em tempo real
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newMetric: PerformanceMetric = {
        timestamp: Date.now(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100,
        disk: Math.random() * 100,
        requests: Math.floor(Math.random() * 1000) + 100,
        responseTime: Math.random() * 500 + 50
      };

      setMetrics(prev => [...prev.slice(-59), newMetric]); // Keep last 60 points
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Desenhar gráficos em tempo real
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      // Draw grid
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = padding + (chartHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 12; i++) {
        const x = padding + (chartWidth / 12) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Draw metrics
      const metricsToShow = ['cpu', 'memory', 'network', 'disk'] as const;
      const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];

      metricsToShow.forEach((metric, index) => {
        ctx.strokeStyle = colors[index];
        ctx.lineWidth = 2;
        ctx.beginPath();

        metrics.forEach((point, i) => {
          const x = padding + (chartWidth / (metrics.length - 1)) * i;
          const y = padding + chartHeight - (chartHeight * (point[metric] / 100));

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw current value
        if (metrics.length > 0) {
          const lastMetric = metrics[metrics.length - 1];
          const lastX = padding + chartWidth;
          const lastY = padding + chartHeight - (chartHeight * (lastMetric[metric] / 100));

          ctx.fillStyle = colors[index];
          ctx.beginPath();
          ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw legend
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px sans-serif';
      metricsToShow.forEach((metric, index) => {
        const x = padding + index * 80;
        const y = height - 10;
        
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y - 8, 12, 8);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(metric.toUpperCase(), x + 16, y);
      });
    };

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }, [metrics]);

  const getCurrentMetrics = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const currentMetrics = getCurrentMetrics();

  const getPerformanceStatus = (value: number) => {
    if (value < 50) return { status: 'good', color: 'text-green-400' };
    if (value < 80) return { status: 'warning', color: 'text-yellow-400' };
    return { status: 'critical', color: 'text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Live Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {currentMetrics && [
          { label: 'CPU', value: currentMetrics.cpu, icon: <Cpu className="h-4 w-4" />, unit: '%' },
          { label: 'Memory', value: currentMetrics.memory, icon: <HardDrive className="h-4 w-4" />, unit: '%' },
          { label: 'Network', value: currentMetrics.network, icon: <Wifi className="h-4 w-4" />, unit: '%' },
          { label: 'Disk', value: currentMetrics.disk, icon: <HardDrive className="h-4 w-4" />, unit: '%' },
          { label: 'Requests', value: currentMetrics.requests, icon: <Activity className="h-4 w-4" />, unit: '/min' },
          { label: 'Response', value: currentMetrics.responseTime, icon: <Zap className="h-4 w-4" />, unit: 'ms' }
        ].map((metric, index) => {
          const status = getPerformanceStatus(metric.value);
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-slate-400">{metric.icon}</div>
                    <Badge className={`${isLive ? 'bg-green-600' : 'bg-gray-600'} text-xs`}>
                      {isLive ? 'LIVE' : 'PAUSED'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{metric.label}</p>
                    <p className={`text-lg font-bold ${status.color}`}>
                      {metric.value.toFixed(1)}{metric.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Chart */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Real-time Performance Monitor
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1 rounded text-xs ${
                  isLive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full h-64 bg-slate-800/30 rounded border border-slate-700"
          />
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">System Health</span>
                <Badge className="bg-green-600">Excellent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">Peak Usage</span>
                <span className="text-white">14:30 - 16:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">Optimization Score</span>
                <span className="text-green-400">94/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMetrics && [
                { name: 'CPU Cores', used: 6, total: 8, color: 'bg-red-500' },
                { name: 'Memory', used: currentMetrics.memory, total: 100, color: 'bg-green-500' },
                { name: 'Storage', used: 65, total: 100, color: 'bg-blue-500' },
                { name: 'Network', used: currentMetrics.network, total: 100, color: 'bg-yellow-500' }
              ].map((resource) => (
                <div key={resource.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{resource.name}</span>
                    <span className="text-white">{resource.used.toFixed(0)}/{resource.total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className={`${resource.color} h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(resource.used / resource.total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default RealTimePerformance;
