import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  Zap,
  Clock,
  Users,
  Server,
  Database,
  Network,
  Shield,
  AlertTriangle,
  CheckCircle,
  Cpu,
  HardDrive,
  Wifi,
  Globe,
  Eye,
  Target,
  BarChart3,
  PieChart as PieChartIcon,
  Gauge,
  Flame,
  Star
} from 'lucide-react';

interface MetricData {
  timestamp: string;
  value: number;
  label?: string;
}

interface AdvancedMetric {
  id: string;
  title: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  trendValue: number;
  target?: number;
  category: 'performance' | 'security' | 'network' | 'system';
  severity: 'low' | 'medium' | 'high' | 'critical';
  data: MetricData[];
}

const AdvancedMetricsPanel: React.FC = () => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isRealtime, setIsRealtime] = useState(true);

  // Sample advanced metrics data
  const [metrics, setMetrics] = useState<AdvancedMetric[]>([
    {
      id: 'response_time',
      title: 'Tempo de Resposta Médio',
      value: 89,
      unit: 'ms',
      trend: 'down',
      trendValue: -12,
      target: 100,
      category: 'performance',
      severity: 'low',
      data: generateTimeSeriesData(24, 50, 150)
    },
    {
      id: 'throughput',
      title: 'Taxa de Transferência',
      value: 2847,
      unit: 'req/s',
      trend: 'up',
      trendValue: 18,
      target: 3000,
      category: 'performance',
      severity: 'medium',
      data: generateTimeSeriesData(24, 2000, 4000)
    },
    {
      id: 'cpu_usage',
      title: 'Uso de CPU',
      value: 67,
      unit: '%',
      trend: 'stable',
      trendValue: 2,
      target: 80,
      category: 'system',
      severity: 'medium',
      data: generateTimeSeriesData(24, 40, 90)
    },
    {
      id: 'memory_usage',
      title: 'Uso de Memória',
      value: 73,
      unit: '%',
      trend: 'up',
      trendValue: 8,
      target: 85,
      category: 'system',
      severity: 'medium',
      data: generateTimeSeriesData(24, 50, 90)
    },
    {
      id: 'error_rate',
      title: 'Taxa de Erro',
      value: 0.23,
      unit: '%',
      trend: 'down',
      trendValue: -45,
      target: 1,
      category: 'performance',
      severity: 'low',
      data: generateTimeSeriesData(24, 0, 2)
    },
    {
      id: 'cache_hit_rate',
      title: 'Taxa de Acerto do Cache',
      value: 87.5,
      unit: '%',
      trend: 'up',
      trendValue: 5,
      target: 90,
      category: 'performance',
      severity: 'low',
      data: generateTimeSeriesData(24, 70, 95)
    },
    {
      id: 'active_connections',
      title: 'Conexões Ativas',
      value: 847,
      unit: '',
      trend: 'up',
      trendValue: 12,
      target: 1000,
      category: 'network',
      severity: 'medium',
      data: generateTimeSeriesData(24, 500, 1200)
    },
    {
      id: 'security_threats',
      title: 'Ameaças Bloqueadas',
      value: 156,
      unit: '/h',
      trend: 'up',
      trendValue: 23,
      category: 'security',
      severity: 'high',
      data: generateTimeSeriesData(24, 100, 300)
    }
  ]);

  // Generate time series data
  function generateTimeSeriesData(points: number, min: number, max: number): MetricData[] {
    const now = new Date();
    return Array.from({ length: points }, (_, i) => {
      const timestamp = new Date(now.getTime() - (points - i) * 60 * 60 * 1000);
      return {
        timestamp: timestamp.toISOString(),
        value: Math.floor(Math.random() * (max - min) + min),
        label: timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      };
    });
  }

  // Real-time data updates
  useEffect(() => {
    if (!isRealtime) return;

    const interval = setInterval(() => {
      setMetrics(prev => prev.map(metric => ({
        ...metric,
        value: Math.max(0, metric.value + (Math.random() - 0.5) * (metric.value * 0.1)),
        data: [
          ...metric.data.slice(1),
          {
            timestamp: new Date().toISOString(),
            value: Math.max(0, metric.value + (Math.random() - 0.5) * (metric.value * 0.2)),
            label: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ]
      })));
    }, 5000);

    return () => clearInterval(interval);
  }, [isRealtime]);

  // Filter metrics by category
  const filteredMetrics = selectedCategory === 'all' 
    ? metrics 
    : metrics.filter(m => m.category === selectedCategory);

  // Get category color
  const getCategoryColor = (category: string) => {
    const colors = {
      performance: 'blue',
      system: 'green',
      network: 'purple',
      security: 'red'
    };
    return colors[category as keyof typeof colors] || 'gray';
  };

  // Get severity color
  const getSeverityColor = (severity: string) => {
    const colors = {
      low: 'text-green-400',
      medium: 'text-yellow-400',
      high: 'text-orange-400',
      critical: 'text-red-400'
    };
    return colors[severity as keyof typeof colors] || 'text-gray-400';
  };

  // Metric card component
  const MetricCard = ({ metric }: { metric: AdvancedMetric }) => {
    const progress = metric.target ? (metric.value / metric.target) * 100 : 0;
    const isNearTarget = progress > 80;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02, y: -2 }}
        className="group"
      >
        <Card className="p-4 h-full bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl hover:border-gray-600/70 transition-all duration-300">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge 
                variant="outline" 
                className={`border-${getCategoryColor(metric.category)}-400/50 text-${getCategoryColor(metric.category)}-400 bg-${getCategoryColor(metric.category)}-500/10`}
              >
                {metric.category}
              </Badge>
              <div className={`w-2 h-2 rounded-full ${getSeverityColor(metric.severity).replace('text-', 'bg-')}`} />
            </div>
            <div className="flex items-center gap-1">
              {metric.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
              {metric.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-400" />}
              {metric.trend === 'stable' && <div className="w-4 h-0.5 bg-blue-400" />}
              <span className={`text-xs font-medium ${
                metric.trend === 'up' ? 'text-green-400' : 
                metric.trend === 'down' ? 'text-red-400' : 'text-blue-400'
              }`}>
                {metric.trendValue > 0 ? '+' : ''}{metric.trendValue}%
              </span>
            </div>
          </div>

          {/* Value */}
          <div className="mb-4">
            <div className="flex items-baseline gap-1 mb-1">
              <motion.span 
                className="text-2xl font-bold text-white"
                key={metric.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {typeof metric.value === 'number' ? metric.value.toFixed(metric.unit === '%' ? 1 : 0) : metric.value}
              </motion.span>
              <span className="text-sm text-gray-400">{metric.unit}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-300 mb-2">{metric.title}</h4>
            
            {/* Progress bar */}
            {metric.target && (
              <div className="space-y-1">
                <Progress 
                  value={progress} 
                  className={`h-2 ${isNearTarget ? 'bg-yellow-500/20' : 'bg-gray-700'}`}
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Atual: {metric.value.toFixed(1)}{metric.unit}</span>
                  <span>Meta: {metric.target}{metric.unit}</span>
                </div>
              </div>
            )}
          </div>

          {/* Mini chart */}
          <div className="h-16 opacity-70 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metric.data.slice(-12)}>
                <defs>
                  <linearGradient id={`gradient-${metric.id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={`var(--color-${getCategoryColor(metric.category)}-400)`} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={`var(--color-${getCategoryColor(metric.category)}-400)`} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={`var(--color-${getCategoryColor(metric.category)}-400)`}
                  strokeWidth={2}
                  fill={`url(#gradient-${metric.id})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Chart tabs
  const chartTabs = [
    { id: 'overview', label: 'Visão Geral', icon: Eye },
    { id: 'performance', label: 'Performance', icon: Zap },
    { id: 'resources', label: 'Recursos', icon: Server },
    { id: 'network', label: 'Rede', icon: Network },
    { id: 'security', label: 'Segurança', icon: Shield }
  ];

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Métricas Avançadas</h2>
          <p className="text-gray-400">Monitoramento em tempo real do sistema</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
            <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1h">1 Hora</SelectItem>
              <SelectItem value="6h">6 Horas</SelectItem>
              <SelectItem value="24h">24 Horas</SelectItem>
              <SelectItem value="7d">7 Dias</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 bg-gray-800 border-gray-700">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="performance">Performance</SelectItem>
              <SelectItem value="system">Sistema</SelectItem>
              <SelectItem value="network">Rede</SelectItem>
              <SelectItem value="security">Segurança</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant={isRealtime ? "default" : "outline"}
            size="sm"
            onClick={() => setIsRealtime(!isRealtime)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Activity className="w-4 h-4 mr-2" />
            {isRealtime ? 'Tempo Real' : 'Pausado'}
          </Button>
        </div>
      </div>

      {/* Metrics grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
      >
        <AnimatePresence>
          {filteredMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Detailed charts */}
      <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl">
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 bg-gray-800/50">
            {chartTabs.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Combined performance chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Performance Overview</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics[0].data}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis 
                        dataKey="label" 
                        stroke="#6B7280"
                        fontSize={12}
                      />
                      <YAxis stroke="#6B7280" fontSize={12} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#1F2937', 
                          border: '1px solid #374151',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3B82F6" 
                        strokeWidth={2}
                        name="Tempo de Resposta (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* System resources pie chart */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-white">Recursos do Sistema</h3>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'CPU', value: metrics[2].value, fill: '#3B82F6' },
                          { name: 'Memória', value: metrics[3].value, fill: '#10B981' },
                          { name: 'Disponível', value: 100 - metrics[2].value - metrics[3].value, fill: '#6B7280' }
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {[
                          { name: 'CPU', value: metrics[2].value, fill: '#3B82F6' },
                          { name: 'Memória', value: metrics[3].value, fill: '#10B981' },
                          { name: 'Disponível', value: 100 - metrics[2].value - metrics[3].value, fill: '#6B7280' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Other tab contents would go here */}
        </Tabs>
      </Card>
    </div>
  );
};

export default AdvancedMetricsPanel;
