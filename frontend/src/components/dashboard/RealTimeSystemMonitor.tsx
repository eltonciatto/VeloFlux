import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Cpu,
  HardDrive,
  Wifi,
  Database,
  Server,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Zap,
  Thermometer,
  Gauge,
  Network,
  Shield,
  Eye,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Users,
  Globe
} from 'lucide-react';

interface SystemMetric {
  id: string;
  name: string;
  value: number;
  unit: string;
  status: 'healthy' | 'warning' | 'critical';
  threshold: { warning: number; critical: number };
  icon: any;
  color: string;
  description: string;
}

interface ServiceStatus {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error' | 'starting';
  uptime: string;
  version: string;
  port: number;
  cpu: number;
  memory: number;
  connections: number;
}

const RealTimeSystemMonitor: React.FC = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedView, setSelectedView] = useState<'overview' | 'detailed'>('overview');

  // System metrics state
  const [systemMetrics, setSystemMetrics] = useState<SystemMetric[]>([
    {
      id: 'cpu',
      name: 'CPU Usage',
      value: 45,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 70, critical: 90 },
      icon: Cpu,
      color: 'blue',
      description: 'Uso do processador'
    },
    {
      id: 'memory',
      name: 'Memory Usage',
      value: 68,
      unit: '%',
      status: 'warning',
      threshold: { warning: 75, critical: 90 },
      icon: HardDrive,
      color: 'green',
      description: 'Uso da memória RAM'
    },
    {
      id: 'disk',
      name: 'Disk Usage',
      value: 34,
      unit: '%',
      status: 'healthy',
      threshold: { warning: 80, critical: 95 },
      icon: Database,
      color: 'purple',
      description: 'Uso do disco'
    },
    {
      id: 'network',
      name: 'Network I/O',
      value: 234,
      unit: 'MB/s',
      status: 'healthy',
      threshold: { warning: 500, critical: 800 },
      icon: Wifi,
      color: 'cyan',
      description: 'Tráfego de rede'
    },
    {
      id: 'temperature',
      name: 'Temperature',
      value: 42,
      unit: '°C',
      status: 'healthy',
      threshold: { warning: 65, critical: 80 },
      icon: Thermometer,
      color: 'orange',
      description: 'Temperatura do sistema'
    },
    {
      id: 'load',
      name: 'System Load',
      value: 1.2,
      unit: '',
      status: 'healthy',
      threshold: { warning: 2.0, critical: 4.0 },
      icon: Gauge,
      color: 'yellow',
      description: 'Carga do sistema'
    }
  ]);

  // Services status state
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      id: 'api',
      name: 'VeloFlux API',
      status: 'running',
      uptime: '2d 14h 23m',
      version: '2.1.0',
      port: 8080,
      cpu: 12.5,
      memory: 245,
      connections: 847
    },
    {
      id: 'websocket',
      name: 'WebSocket Server',
      status: 'running',
      uptime: '2d 14h 23m',
      version: '1.8.2',
      port: 9090,
      cpu: 8.3,
      memory: 156,
      connections: 234
    },
    {
      id: 'database',
      name: 'PostgreSQL',
      status: 'running',
      uptime: '7d 2h 45m',
      version: '14.9',
      port: 5432,
      cpu: 15.2,
      memory: 512,
      connections: 78
    },
    {
      id: 'redis',
      name: 'Redis Cache',
      status: 'running',
      uptime: '7d 2h 45m',
      version: '7.0.12',
      port: 6379,
      cpu: 3.1,
      memory: 89,
      connections: 156
    },
    {
      id: 'nginx',
      name: 'Nginx Proxy',
      status: 'running',
      uptime: '7d 2h 45m',
      version: '1.24.0',
      port: 80,
      cpu: 2.8,
      memory: 45,
      connections: 1205
    },
    {
      id: 'monitoring',
      name: 'Monitoring Agent',
      status: 'running',
      uptime: '2d 14h 23m',
      version: '3.2.1',
      port: 9100,
      cpu: 1.2,
      memory: 67,
      connections: 12
    }
  ]);

  // Real-time updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Update system metrics
      setSystemMetrics(prev => prev.map(metric => {
        const variation = (Math.random() - 0.5) * 10;
        const newValue = Math.max(0, Math.min(100, metric.value + variation));
        
        let status: 'healthy' | 'warning' | 'critical' = 'healthy';
        if (newValue >= metric.threshold.critical) status = 'critical';
        else if (newValue >= metric.threshold.warning) status = 'warning';

        return {
          ...metric,
          value: newValue,
          status
        };
      }));

      // Update services
      setServices(prev => prev.map(service => ({
        ...service,
        cpu: Math.max(0, Math.min(50, service.cpu + (Math.random() - 0.5) * 3)),
        memory: Math.max(10, Math.min(1000, service.memory + (Math.random() - 0.5) * 20)),
        connections: Math.max(0, service.connections + Math.floor((Math.random() - 0.5) * 10))
      })));

      setLastUpdate(new Date());
    }, 3000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Get status color
  const getStatusColor = (status: string) => {
    const colors = {
      healthy: 'text-green-400 bg-green-400/10 border-green-400/30',
      warning: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
      critical: 'text-red-400 bg-red-400/10 border-red-400/30',
      running: 'text-green-400 bg-green-400/10 border-green-400/30',
      stopped: 'text-red-400 bg-red-400/10 border-red-400/30',
      error: 'text-red-400 bg-red-400/10 border-red-400/30',
      starting: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
    };
    return colors[status as keyof typeof colors] || colors.healthy;
  };

  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'running':
        return <CheckCircle className="w-4 h-4" />;
      case 'warning':
      case 'starting':
        return <Clock className="w-4 h-4" />;
      case 'critical':
      case 'error':
      case 'stopped':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  // System metric card
  const MetricCard = ({ metric }: { metric: SystemMetric }) => {
    const Icon = metric.icon;
    const progressColor = metric.status === 'critical' ? 'bg-red-500' : 
                         metric.status === 'warning' ? 'bg-yellow-500' : 'bg-green-500';

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        className="group"
      >
        <Card className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl hover:border-gray-600/70 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className={`p-2 rounded-lg bg-${metric.color}-500/20 border border-${metric.color}-400/30`}>
              <Icon className={`w-5 h-5 text-${metric.color}-400`} />
            </div>
            <Badge className={getStatusColor(metric.status)}>
              {getStatusIcon(metric.status)}
              <span className="ml-1 text-xs">{metric.status}</span>
            </Badge>
          </div>

          <div className="space-y-2">
            <div className="flex items-baseline gap-1">
              <motion.span 
                className="text-xl font-bold text-white"
                key={metric.value}
                initial={{ scale: 1.1 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                {metric.value.toFixed(metric.id === 'load' ? 1 : 0)}
              </motion.span>
              <span className="text-sm text-gray-400">{metric.unit}</span>
            </div>
            
            <h4 className="text-sm font-medium text-gray-300">{metric.name}</h4>
            <p className="text-xs text-gray-500">{metric.description}</p>

            {/* Progress bar */}
            <div className="space-y-1">
              <Progress 
                value={metric.unit === '%' ? metric.value : (metric.value / metric.threshold.critical) * 100} 
                className="h-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Aviso: {metric.threshold.warning}{metric.unit}</span>
                <span>Crítico: {metric.threshold.critical}{metric.unit}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  // Service status card
  const ServiceCard = ({ service }: { service: ServiceStatus }) => {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="p-4 bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl hover:border-gray-600/70 transition-all duration-300">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20 border border-blue-400/30">
                <Server className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h4 className="text-sm font-medium text-white">{service.name}</h4>
                <p className="text-xs text-gray-400">v{service.version} • Port {service.port}</p>
              </div>
            </div>
            <Badge className={getStatusColor(service.status)}>
              {getStatusIcon(service.status)}
              <span className="ml-1 text-xs capitalize">{service.status}</span>
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Uptime:</span>
                <span className="text-white font-medium">{service.uptime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">CPU:</span>
                <span className="text-white font-medium">{service.cpu.toFixed(1)}%</span>
              </div>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <span className="text-gray-400">Memory:</span>
                <span className="text-white font-medium">{service.memory} MB</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Connections:</span>
                <span className="text-white font-medium">{service.connections}</span>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Monitoramento do Sistema</h2>
          <p className="text-gray-400">
            Última atualização: {lastUpdate.toLocaleTimeString('pt-BR')}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Button
              variant={selectedView === 'overview' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('overview')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Visão Geral
            </Button>
            <Button
              variant={selectedView === 'detailed' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('detailed')}
            >
              <Activity className="w-4 h-4 mr-2" />
              Detalhado
            </Button>
          </div>
          
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto' : 'Manual'}
          </Button>
        </div>
      </div>

      {/* Alert summary */}
      {systemMetrics.some(m => m.status !== 'healthy') && (
        <Alert className="border-yellow-400/50 bg-yellow-400/10">
          <AlertTriangle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-300">
            <strong>Atenção:</strong> {systemMetrics.filter(m => m.status === 'warning').length} alertas de aviso e{' '}
            {systemMetrics.filter(m => m.status === 'critical').length} alertas críticos detectados.
          </AlertDescription>
        </Alert>
      )}

      {/* System metrics grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white">Métricas do Sistema</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemMetrics.map((metric) => (
            <MetricCard key={metric.id} metric={metric} />
          ))}
        </div>
      </div>

      {/* Services status */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-white">Status dos Serviços</h3>
          <Badge variant="outline" className="text-green-400 border-green-400/50">
            {services.filter(s => s.status === 'running').length}/{services.length} ativos
          </Badge>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>
      </div>

      {/* Detailed view */}
      {selectedView === 'detailed' && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-white">Informações Detalhadas</h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System overview */}
            <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl">
              <h4 className="text-lg font-semibold text-white mb-4">Resumo do Sistema</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">OS:</p>
                    <p className="text-white font-medium">Ubuntu 22.04 LTS</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Kernel:</p>
                    <p className="text-white font-medium">5.15.0-78-generic</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Uptime:</p>
                    <p className="text-white font-medium">7 days, 2 hours</p>
                  </div>
                  <div>
                    <p className="text-gray-400">Load Average:</p>
                    <p className="text-white font-medium">1.2, 1.5, 1.8</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Network info */}
            <Card className="p-6 bg-gradient-to-br from-gray-900/80 to-gray-800/40 border-gray-700/50 backdrop-blur-xl">
              <h4 className="text-lg font-semibold text-white mb-4">Informações de Rede</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-400">Interface:</p>
                    <p className="text-white font-medium">eth0</p>
                  </div>
                  <div>
                    <p className="text-gray-400">IP Address:</p>
                    <p className="text-white font-medium">10.0.1.100</p>
                  </div>
                  <div>
                    <p className="text-gray-400">RX:</p>
                    <p className="text-white font-medium">1.2 TB</p>
                  </div>
                  <div>
                    <p className="text-gray-400">TX:</p>
                    <p className="text-white font-medium">850 GB</p>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default RealTimeSystemMonitor;
