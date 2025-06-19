import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  AreaChart,
  Area,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import {
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Brain,
  Activity,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  Shield,
  RefreshCw,
  Settings,
  Download,
  Bell,
  Target
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Anomaly {
  id: string;
  timestamp: string;
  type: 'traffic' | 'latency' | 'error_rate' | 'resource' | 'security';
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  value: number;
  baseline: number;
  deviation: number;
  description: string;
  resolved: boolean;
  source: string;
  metadata?: {
    [key: string]: any;
  };
}

interface DetectionModel {
  id: string;
  name: string;
  type: 'statistical' | 'ml' | 'threshold' | 'hybrid';
  metrics: string[];
  sensitivity: number;
  accuracy: number;
  falsePositiveRate: number;
  detectionRate: number;
  isActive: boolean;
  lastUpdated: string;
}

const AnomalyDetection: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('realtime');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [timeRange, setTimeRange] = useState('24h');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock data - em produção viria de APIs em tempo real
  const [anomalies, setAnomalies] = useState<Anomaly[]>([
    {
      id: 'anom-001',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'traffic',
      severity: 'high',
      confidence: 0.92,
      value: 1250,
      baseline: 800,
      deviation: 56.25,
      description: 'Pico anômalo de tráfego detectado - 56% acima do baseline',
      resolved: false,
      source: 'Load Balancer',
      metadata: { endpoint: '/api/users', region: 'us-east-1' }
    },
    {
      id: 'anom-002',
      timestamp: new Date(Date.now() - 600000).toISOString(),
      type: 'latency',
      severity: 'critical',
      confidence: 0.97,
      value: 2500,
      baseline: 120,
      deviation: 1983.33,
      description: 'Latência extremamente alta detectada - possível gargalo',
      resolved: false,
      source: 'API Gateway',
      metadata: { service: 'user-service', instance: 'prod-api-3' }
    },
    {
      id: 'anom-003',
      timestamp: new Date(Date.now() - 900000).toISOString(),
      type: 'error_rate',
      severity: 'medium',
      confidence: 0.85,
      value: 8.5,
      baseline: 2.1,
      deviation: 304.76,
      description: 'Taxa de erro elevada - múltiplos 500 errors',
      resolved: true,
      source: 'Backend Service',
      metadata: { error_code: '500', affected_users: 45 }
    },
    {
      id: 'anom-004',
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      type: 'security',
      severity: 'critical',
      confidence: 0.94,
      value: 15,
      baseline: 1,
      deviation: 1400,
      description: 'Padrão de ataque detectado - possível SQL injection',
      resolved: false,
      source: 'WAF',
      metadata: { attack_type: 'sql_injection', source_ip: '192.168.1.100' }
    },
    {
      id: 'anom-005',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'resource',
      severity: 'high',
      confidence: 0.89,
      value: 95,
      baseline: 65,
      deviation: 46.15,
      description: 'Uso de CPU anormalmente alto - possível processo descontrolado',
      resolved: true,
      source: 'Container Monitor',
      metadata: { container: 'api-worker-2', cpu_usage: '95%' }
    }
  ]);

  const [detectionModels] = useState<DetectionModel[]>([
    {
      id: 'statistical-model',
      name: 'Modelo Estatístico',
      type: 'statistical',
      metrics: ['traffic', 'latency', 'error_rate'],
      sensitivity: 0.8,
      accuracy: 0.91,
      falsePositiveRate: 0.08,
      detectionRate: 0.94,
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'ml-ensemble',
      name: 'ML Ensemble',
      type: 'ml',
      metrics: ['traffic', 'latency', 'resource', 'error_rate'],
      sensitivity: 0.9,
      accuracy: 0.96,
      falsePositiveRate: 0.04,
      detectionRate: 0.98,
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'threshold-model',
      name: 'Threshold Based',
      type: 'threshold',
      metrics: ['resource', 'error_rate'],
      sensitivity: 0.7,
      accuracy: 0.85,
      falsePositiveRate: 0.12,
      detectionRate: 0.88,
      isActive: true,
      lastUpdated: new Date().toISOString()
    },
    {
      id: 'security-hybrid',
      name: 'Security Hybrid',
      type: 'hybrid',
      metrics: ['security', 'traffic'],
      sensitivity: 0.95,
      accuracy: 0.93,
      falsePositiveRate: 0.06,
      detectionRate: 0.97,
      isActive: true,
      lastUpdated: new Date().toISOString()
    }
  ]);

  // Dados para gráficos em tempo real
  const [realtimeData, setRealtimeData] = useState(() => {
    return Array.from({ length: 50 }, (_, i) => {
      const timestamp = new Date(Date.now() - (49 - i) * 30000);
      const isAnomaly = Math.random() < 0.1;
      return {
        timestamp: timestamp.toISOString(),
        value: isAnomaly ? Math.random() * 100 + 100 : Math.random() * 50 + 25,
        baseline: 40 + Math.sin(i / 10) * 10,
        isAnomaly,
        confidence: isAnomaly ? 0.8 + Math.random() * 0.2 : 0.1 + Math.random() * 0.3
      };
    });
  });

  // Simulação de dados em tempo real
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      setRealtimeData(prev => {
        const newData = [...prev.slice(1)];
        const timestamp = new Date();
        const isAnomaly = Math.random() < 0.08;
        
        newData.push({
          timestamp: timestamp.toISOString(),
          value: isAnomaly ? Math.random() * 100 + 100 : Math.random() * 50 + 25,
          baseline: 40 + Math.sin(newData.length / 10) * 10,
          isAnomaly,
          confidence: isAnomaly ? 0.8 + Math.random() * 0.2 : 0.1 + Math.random() * 0.3
        });

        // Adicionar nova anomalia se detectada
        if (isAnomaly && Math.random() < 0.5) {
          const newAnomaly: Anomaly = {
            id: `anom-${Date.now()}`,
            timestamp: timestamp.toISOString(),
            type: ['traffic', 'latency', 'error_rate', 'resource'][Math.floor(Math.random() * 4)] as any,
            severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
            confidence: 0.8 + Math.random() * 0.2,
            value: Math.random() * 100 + 100,
            baseline: 40,
            deviation: 50 + Math.random() * 50,
            description: 'Anomalia detectada em tempo real',
            resolved: false,
            source: 'Real-time Monitor'
          };

          setAnomalies(prev => [newAnomaly, ...prev.slice(0, 19)]);
        }

        return newData;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'traffic': return <TrendingUp className="w-4 h-4" />;
      case 'latency': return <Clock className="w-4 h-4" />;
      case 'error_rate': return <AlertTriangle className="w-4 h-4" />;
      case 'resource': return <Activity className="w-4 h-4" />;
      case 'security': return <Shield className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const filteredAnomalies = anomalies.filter(anomaly => 
    selectedSeverity === 'all' || anomaly.severity === selectedSeverity
  );

  const anomalyStats = {
    total: anomalies.length,
    unresolved: anomalies.filter(a => !a.resolved).length,
    critical: anomalies.filter(a => a.severity === 'critical').length,
    avgConfidence: anomalies.reduce((sum, a) => sum + a.confidence, 0) / anomalies.length
  };

  const handleResolveAnomaly = (id: string) => {
    setAnomalies(prev => prev.map(a => 
      a.id === id ? { ...a, resolved: true } : a
    ));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Eye className="w-6 h-6 text-orange-600" />
            Detecção de Anomalias
          </h2>
          <p className="text-gray-600 mt-1">
            Detecção em tempo real com IA e machine learning
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {autoRefresh ? 'Monitorando' : 'Pausado'}
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Detectadas</p>
                <p className="text-2xl font-bold">{anomalyStats.total}</p>
              </div>
              <Brain className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Não Resolvidas</p>
                <p className="text-2xl font-bold text-orange-600">{anomalyStats.unresolved}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Críticas</p>
                <p className="text-2xl font-bold text-red-600">{anomalyStats.critical}</p>
              </div>
              <Shield className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Confiança Média</p>
                <p className="text-2xl font-bold text-green-600">
                  {(anomalyStats.avgConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime">Tempo Real</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalias</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="analysis">Análise</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Monitoramento em Tempo Real</span>
                <Badge variant={autoRefresh ? "default" : "secondary"}>
                  {autoRefresh ? 'Ativo' : 'Pausado'}
                </Badge>
              </CardTitle>                <CardDescription>
                  Detecção de anomalias em tempo real com confiança &gt; 80%
                </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={realtimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip 
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value: any, name) => [
                      typeof value === 'number' ? value.toFixed(2) : value, 
                      name === 'value' ? 'Valor' : name === 'baseline' ? 'Baseline' : 'Confiança'
                    ]}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="baseline" 
                    stroke="#10b981" 
                    strokeWidth={1}
                    strokeDasharray="5 5"
                    name="Baseline"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Valor Atual"
                    dot={(props: any) => {
                      if (props.payload?.isAnomaly) {
                        return <circle cx={props.cx} cy={props.cy} r={4} fill="#ef4444" />;
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-4 flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-blue-500"></div>
                  <span>Valor Atual</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-0.5 bg-green-500 border-dashed border"></div>
                  <span>Baseline</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Anomalia Detectada</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {['all', 'critical', 'high', 'medium', 'low'].map(severity => (
              <Button
                key={severity}
                variant={selectedSeverity === severity ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedSeverity(severity)}
                className="whitespace-nowrap"
              >
                {severity === 'all' ? 'Todas' : severity}
                {severity !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {anomalies.filter(a => a.severity === severity).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>

          {/* Anomalies List */}
          <div className="space-y-4">
            {filteredAnomalies.map(anomaly => (
              <Card key={anomaly.id} className={`${!anomaly.resolved ? 'border-l-4 border-l-orange-500' : ''}`}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getTypeIcon(anomaly.type)}
                      <div>
                        <CardTitle className="text-lg">{anomaly.description}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <span>{new Date(anomaly.timestamp).toLocaleString()}</span>
                          <span>•</span>
                          <span>{anomaly.source}</span>
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(anomaly.severity) as any}>
                        {anomaly.severity}
                      </Badge>
                      {anomaly.resolved ? (
                        <Badge variant="default">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Resolvida
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          <AlertTriangle className="w-3 h-3 mr-1" />
                          Ativa
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Valor Detectado</p>
                      <p className="text-lg font-bold text-red-600">{anomaly.value.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Baseline</p>
                      <p className="text-lg font-medium">{anomaly.baseline.toFixed(2)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Desvio</p>
                      <p className="text-lg font-bold text-orange-600">+{anomaly.deviation.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confiança</p>
                      <div className="flex items-center gap-2">
                        <Progress value={anomaly.confidence * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{(anomaly.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  {anomaly.metadata && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium mb-2">Metadados:</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(anomaly.metadata).map(([key, value]) => (
                          <div key={key}>
                            <span className="text-gray-600">{key}:</span>
                            <span className="ml-2 font-medium">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {!anomaly.resolved && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleResolveAnomaly(anomaly.id)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Marcar como Resolvida
                      </Button>
                      <Button size="sm" variant="outline">
                        <Bell className="w-4 h-4 mr-2" />
                        Criar Alerta
                      </Button>
                      <Button size="sm" variant="outline">
                        <Target className="w-4 h-4 mr-2" />
                        Investigar
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {detectionModels.map(model => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    <Badge variant={model.isActive ? "default" : "secondary"}>
                      {model.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <CardDescription>Tipo: {model.type}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Precisão</p>
                      <div className="flex items-center gap-2">
                        <Progress value={model.accuracy * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{(model.accuracy * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Taxa de Detecção</p>
                      <div className="flex items-center gap-2">
                        <Progress value={model.detectionRate * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{(model.detectionRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Sensibilidade</p>
                      <div className="flex items-center gap-2">
                        <Progress value={model.sensitivity * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{(model.sensitivity * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Falsos Positivos</p>
                      <div className="flex items-center gap-2">
                        <Progress value={model.falsePositiveRate * 100} className="h-2 flex-1" />
                        <span className="text-sm font-medium">{(model.falsePositiveRate * 100).toFixed(1)}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-gray-600 mb-2">Métricas Monitoradas:</p>
                    <div className="flex flex-wrap gap-1">
                      {model.metrics.map(metric => (
                        <Badge key={metric} variant="outline" className="text-xs">
                          {metric.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="text-sm text-gray-600">
                    <p>Última atualização: {new Date(model.lastUpdated).toLocaleString()}</p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Configurar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retreinar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Tipo</CardTitle>
                <CardDescription>Anomalias detectadas por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: 'Tráfego', value: anomalies.filter(a => a.type === 'traffic').length },
                        { name: 'Latência', value: anomalies.filter(a => a.type === 'latency').length },
                        { name: 'Erros', value: anomalies.filter(a => a.type === 'error_rate').length },
                        { name: 'Recursos', value: anomalies.filter(a => a.type === 'resource').length },
                        { name: 'Segurança', value: anomalies.filter(a => a.type === 'security').length }
                      ]}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {anomalies.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tendências de Detecção</CardTitle>
                <CardDescription>Performance dos modelos ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart 
                    data={Array.from({ length: 7 }, (_, i) => ({
                      day: `Dia ${i + 1}`,
                      detections: Math.floor(Math.random() * 20) + 5,
                      accuracy: 0.85 + Math.random() * 0.1
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area 
                      type="monotone" 
                      dataKey="detections" 
                      stackId="1"
                      stroke="#8b5cf6" 
                      fill="#8b5cf6" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnomalyDetection;
