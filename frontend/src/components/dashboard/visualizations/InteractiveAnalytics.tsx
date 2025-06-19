import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Zap,
  Users,
  Globe
} from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  trend?: number;
  color?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export function InteractiveAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<string>('requests');

  // Mock data baseado no timeframe
  const generateData = (timeframe: string, metric: string): ChartData[] => {
    const dataPoints = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    
    return Array.from({ length: dataPoints }, (_, i) => ({
      label: timeframe === '1h' ? `${i}m` : timeframe === '24h' ? `${i}h` : `Day ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      trend: (Math.random() - 0.5) * 20,
      color: `hsl(${200 + i * 10}, 70%, 50%)`
    }));
  };

  const chartData = useMemo(() => generateData(selectedTimeframe, selectedMetric), [selectedTimeframe, selectedMetric]);

  const metricCards: MetricCard[] = [
    {
      title: 'Requests/min',
      value: '1,247',
      change: 12.5,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-blue-400'
    },
    {
      title: 'Active Users',
      value: '8,932',
      change: -2.3,
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-400'
    },
    {
      title: 'Error Rate',
      value: '0.12%',
      change: -45.6,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-red-400'
    },
    {
      title: 'Global Reach',
      value: '42',
      change: 8.7,
      icon: <Globe className="h-5 w-5" />,
      color: 'text-purple-400'
    }
  ];

  const pieData = [
    { label: 'API Requests', value: 45, color: '#3B82F6' },
    { label: 'Web Traffic', value: 30, color: '#10B981' },
    { label: 'Mobile App', value: 15, color: '#F59E0B' },
    { label: 'Other', value: 10, color: '#8B5CF6' }
  ];

  // Simplified chart rendering (em produção usaria Chart.js ou D3.js)
  const renderBarChart = () => {
    const maxValue = Math.max(...chartData.map(d => d.value));
    
    return (
      <div className="flex items-end gap-2 h-64 p-4">
        {chartData.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center flex-1"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className="bg-blue-500 w-full rounded-t-sm cursor-pointer hover:bg-blue-400 transition-colors"
              style={{ 
                height: `${(item.value / maxValue) * 200}px`,
                minHeight: '4px'
              }}
              whileHover={{ scale: 1.05 }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-slate-400 mt-2 rotate-45 origin-left">{item.label}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {pieData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r="80"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  pathLength="100"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-slate-400">Coverage</div>
            </div>
          </div>
        </div>
        <div className="ml-8 space-y-2">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className="text-sm text-slate-400">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {metric.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs ${metric.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Time Series Analysis
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white rounded px-3 py-1 text-sm"
                >
                  <option value="requests">Requests</option>
                  <option value="errors">Errors</option>
                  <option value="latency">Latency</option>
                  <option value="bandwidth">Bandwidth</option>
                </select>
                <div className="flex border border-slate-600 rounded">
                  {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 text-xs ${
                        selectedTimeframe === timeframe
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart()}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PieChart className="h-5 w-5" />
              Traffic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart()}
          </CardContent>
        </Card>
      </div>

      {/* Correlation Matrix */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Metric Correlations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {['Requests', 'Latency', 'Errors', 'CPU'].map((metricA, i) => 
              ['Requests', 'Latency', 'Errors', 'CPU'].map((metricB, j) => {
                const correlation = i === j ? 1 : Math.random() * 2 - 1;
                const intensity = Math.abs(correlation);
                const color = correlation > 0 ? 'bg-green-500' : correlation < 0 ? 'bg-red-500' : 'bg-gray-500';
                
                return (
                  <motion.div
                    key={`${i}-${j}`}
                    className={`h-12 w-12 rounded ${color} flex items-center justify-center text-white text-xs font-bold cursor-pointer`}
                    style={{ opacity: intensity }}
                    whileHover={{ scale: 1.1 }}
                    title={`${metricA} vs ${metricB}: ${correlation.toFixed(2)}`}
                  >
                    {correlation.toFixed(1)}
                  </motion.div>
                );
              })
            )}
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <span>Green = Positive correlation, Red = Negative correlation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InteractiveAnalytics;
