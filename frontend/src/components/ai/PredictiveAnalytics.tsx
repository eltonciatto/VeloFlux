import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  Zap,
  Brain,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Download,
  Settings,
  Play,
  Pause,
  RotateCcw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PredictionModel {
  id: string;
  name: string;
  type: 'traffic' | 'latency' | 'errors' | 'resource' | 'anomaly';
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'idle' | 'error';
  confidence: number;
  predictions: {
    timestamp: string;
    value: number;
    confidence: number;
    actual?: number;
  }[];
}

interface Recommendation {
  id: string;
  type: 'scaling' | 'optimization' | 'maintenance' | 'security';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: number;
  effort: number;
  confidence: number;
  actions: string[];
  estimatedSavings?: {
    cost: number;
    performance: number;
  };
}

const PredictiveAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedModel, setSelectedModel] = useState<string>('traffic');
  const [isTraining, setIsTraining] = useState(false);
  const [timeRange, setTimeRange] = useState('24h');

  // Mock data - em produção viria de APIs
  const [models] = useState<PredictionModel[]>([
    {
      id: 'traffic',
      name: 'Predição de Tráfego',
      type: 'traffic',
      accuracy: 94.2,
      lastTrained: '2024-06-19T10:30:00Z',
      status: 'active',
      confidence: 0.89,
      predictions: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        value: Math.random() * 1000 + 500 + Math.sin(i / 4) * 200,
        confidence: 0.8 + Math.random() * 0.2,
        actual: i < 12 ? Math.random() * 1000 + 500 + Math.sin(i / 4) * 200 : undefined
      }))
    },
    {
      id: 'latency',
      name: 'Predição de Latência',
      type: 'latency',
      accuracy: 91.7,
      lastTrained: '2024-06-19T09:15:00Z',
      status: 'active',
      confidence: 0.85,
      predictions: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        value: Math.random() * 50 + 20 + Math.sin(i / 6) * 10,
        confidence: 0.75 + Math.random() * 0.25,
        actual: i < 12 ? Math.random() * 50 + 20 + Math.sin(i / 6) * 10 : undefined
      }))
    },
    {
      id: 'errors',
      name: 'Predição de Erros',
      type: 'errors',
      accuracy: 88.5,
      lastTrained: '2024-06-19T08:45:00Z',
      status: 'active',
      confidence: 0.82,
      predictions: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        value: Math.random() * 10 + 1 + Math.sin(i / 8) * 2,
        confidence: 0.7 + Math.random() * 0.3,
        actual: i < 12 ? Math.random() * 10 + 1 + Math.sin(i / 8) * 2 : undefined
      }))
    },
    {
      id: 'resource',
      name: 'Predição de Recursos',
      type: 'resource',
      accuracy: 92.1,
      lastTrained: '2024-06-19T07:20:00Z',
      status: 'training',
      confidence: 0.87,
      predictions: Array.from({ length: 24 }, (_, i) => ({
        timestamp: new Date(Date.now() + i * 3600000).toISOString(),
        value: Math.random() * 80 + 20 + Math.sin(i / 5) * 15,
        confidence: 0.8 + Math.random() * 0.2,
        actual: i < 12 ? Math.random() * 80 + 20 + Math.sin(i / 5) * 15 : undefined
      }))
    },
    {
      id: 'anomaly',
      name: 'Detecção de Anomalias',
      type: 'anomaly',
      accuracy: 96.3,
      lastTrained: '2024-06-19T11:00:00Z',
      status: 'active',
      confidence: 0.93,
      predictions: Array.from({ length: 24 }, (_, i) => {
        const isAnomaly = Math.random() < 0.1;
        return {
          timestamp: new Date(Date.now() + i * 3600000).toISOString(),
          value: isAnomaly ? 1 : 0,
          confidence: 0.85 + Math.random() * 0.15,
          actual: i < 12 ? (Math.random() < 0.08 ? 1 : 0) : undefined
        };
      })
    }
  ]);

  const [recommendations] = useState<Recommendation[]>([
    {
      id: 'scale-up',
      type: 'scaling',
      priority: 'high',
      title: 'Aumento de Escala Recomendado',
      description: 'O modelo prevê um aumento de 35% no tráfego nas próximas 4 horas. Recomenda-se adicionar 2 instâncias.',
      impact: 85,
      effort: 20,
      confidence: 89,
      actions: [
        'Adicionar 2 instâncias do tipo c5.large',
        'Configurar auto-scaling para 150% do baseline',
        'Monitorar métricas de CPU e memória'
      ],
      estimatedSavings: {
        cost: -150,
        performance: 40
      }
    },
    {
      id: 'cache-optimization',
      type: 'optimization',
      priority: 'medium',
      title: 'Otimização de Cache',
      description: 'Análise de padrões indica que 68% das requisições podem ser cacheadas, melhorando a performance em 25%.',
      impact: 70,
      effort: 35,
      confidence: 92,
      actions: [
        'Implementar cache Redis para queries frequentes',
        'Configurar TTL baseado em padrões de acesso',
        'Implementar cache warming automático'
      ],
      estimatedSavings: {
        cost: 200,
        performance: 25
      }
    },
    {
      id: 'maintenance-window',
      type: 'maintenance',
      priority: 'low',
      title: 'Janela de Manutenção Otimizada',
      description: 'O menor impacto para manutenção será entre 02:00 e 04:00 da manhã, com redução de 78% no tráfego.',
      impact: 95,
      effort: 10,
      confidence: 96,
      actions: [
        'Agendar manutenção para 02:30-03:30',
        'Notificar usuários 24h antes',
        'Preparar rollback automático'
      ]
    },
    {
      id: 'security-alert',
      type: 'security',
      priority: 'critical',
      title: 'Padrão de Ataques Detectado',
      description: 'Modelo de anomalias detectou padrão suspeito de requisições. Possível ataque DDoS em preparação.',
      impact: 100,
      effort: 5,
      confidence: 87,
      actions: [
        'Ativar proteção DDoS avançada',
        'Implementar rate limiting agressivo',
        'Alertar equipe de segurança'
      ]
    }
  ]);

  const currentModel = models.find(m => m.id === selectedModel);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'training': return <RefreshCw className="w-4 h-4 text-yellow-500 animate-spin" />;
      case 'idle': return <Pause className="w-4 h-4 text-gray-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'scaling': return <TrendingUp className="w-4 h-4" />;
      case 'optimization': return <Zap className="w-4 h-4" />;
      case 'maintenance': return <Settings className="w-4 h-4" />;
      case 'security': return <AlertTriangle className="w-4 h-4" />;
      default: return <Target className="w-4 h-4" />;
    }
  };

  const handleTrainModel = () => {
    setIsTraining(true);
    setTimeout(() => setIsTraining(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Análise Preditiva com IA
          </h2>
          <p className="text-gray-600 mt-1">
            Previsões e recomendações baseadas em machine learning
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            size="sm" 
            onClick={handleTrainModel}
            disabled={isTraining}
          >
            {isTraining ? (
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Play className="w-4 h-4 mr-2" />
            )}
            {isTraining ? 'Treinando...' : 'Treinar Modelos'}
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predições</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="models">Modelos</TabsTrigger>
          <TabsTrigger value="accuracy">Precisão</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {/* Model Selector */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {models.map(model => (
              <Button
                key={model.id}
                variant={selectedModel === model.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedModel(model.id)}
                className="whitespace-nowrap"
              >
                {getStatusIcon(model.status)}
                <span className="ml-2">{model.name}</span>
                <Badge variant="secondary" className="ml-2">
                  {model.accuracy.toFixed(1)}%
                </Badge>
              </Button>
            ))}
          </div>

          {/* Current Model Predictions */}
          {currentModel && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{currentModel.name}</span>
                      <Badge variant={currentModel.status === 'active' ? 'default' : 'secondary'}>
                        Confiança: {(currentModel.confidence * 100).toFixed(1)}%
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      Previsão para as próximas 24 horas
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={currentModel.predictions}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis 
                          dataKey="timestamp" 
                          tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                        />
                        <YAxis />
                        <Tooltip 
                          labelFormatter={(value) => new Date(value).toLocaleString()}
                          formatter={(value: any) => [value.toFixed(2), 'Valor']}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke="#8b5cf6" 
                          strokeWidth={2}
                          name="Predição"
                        />
                        {currentModel.predictions.some(p => p.actual !== undefined) && (
                          <Line 
                            type="monotone" 
                            dataKey="actual" 
                            stroke="#10b981" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            name="Real"
                          />
                        )}
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Estatísticas do Modelo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Precisão</span>
                        <span>{currentModel.accuracy.toFixed(1)}%</span>
                      </div>
                      <Progress value={currentModel.accuracy} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Confiança</span>
                        <span>{(currentModel.confidence * 100).toFixed(1)}%</span>
                      </div>
                      <Progress value={currentModel.confidence * 100} className="h-2" />
                    </div>

                    <div className="pt-2 border-t">
                      <p className="text-sm text-gray-600">Último treinamento:</p>
                      <p className="text-sm font-medium">
                        {new Date(currentModel.lastTrained).toLocaleString()}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusIcon(currentModel.status)}
                      <span className="text-sm capitalize">{currentModel.status}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Próximas Ações</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <Alert>
                        <TrendingUp className="w-4 h-4" />
                        <AlertDescription>
                          Pico previsto em 2h: +35% de tráfego
                        </AlertDescription>
                      </Alert>
                      
                      <Alert>
                        <Target className="w-4 h-4" />
                        <AlertDescription>
                          Recomenda-se aumentar 2 instâncias
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map(rec => (
              <Card key={rec.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(rec.type)}
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                    </div>
                    <Badge variant={getPriorityColor(rec.priority) as any}>
                      {rec.priority}
                    </Badge>
                  </div>
                  <CardDescription>{rec.description}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-sm text-gray-600">Impacto</p>
                      <div className="flex items-center gap-1">
                        <Progress value={rec.impact} className="h-1 flex-1" />
                        <span className="text-sm font-medium">{rec.impact}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Esforço</p>
                      <div className="flex items-center gap-1">
                        <Progress value={rec.effort} className="h-1 flex-1" />
                        <span className="text-sm font-medium">{rec.effort}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Confiança</p>
                      <div className="flex items-center gap-1">
                        <Progress value={rec.confidence} className="h-1 flex-1" />
                        <span className="text-sm font-medium">{rec.confidence}%</span>
                      </div>
                    </div>
                  </div>

                  {rec.estimatedSavings && (
                    <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Economia de Custo</p>
                        <p className={`font-medium ${rec.estimatedSavings.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {rec.estimatedSavings.cost > 0 ? '+' : ''}${rec.estimatedSavings.cost}
                        </p>
                      </div>
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Melhoria Performance</p>
                        <p className="font-medium text-green-600">
                          +{rec.estimatedSavings.performance}%
                        </p>
                      </div>
                    </div>
                  )}

                  <div>
                    <p className="text-sm font-medium mb-2">Ações Recomendadas:</p>
                    <ul className="space-y-1">
                      {rec.actions.map((action, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          {action}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      Implementar
                    </Button>
                    <Button size="sm" variant="outline">
                      Adiar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {models.map(model => (
              <Card key={model.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{model.name}</CardTitle>
                    {getStatusIcon(model.status)}
                  </div>
                  <CardDescription>Tipo: {model.type}</CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Precisão</span>
                      <span>{model.accuracy.toFixed(1)}%</span>
                    </div>
                    <Progress value={model.accuracy} className="h-2" />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Confiança</span>
                      <span>{(model.confidence * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={model.confidence * 100} className="h-2" />
                  </div>

                  <div className="text-sm">
                    <p className="text-gray-600">Último treinamento:</p>
                    <p className="font-medium">
                      {new Date(model.lastTrained).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      <Play className="w-3 h-3 mr-1" />
                      Treinar
                    </Button>
                    <Button size="sm" variant="outline" className="flex-1">
                      <Settings className="w-3 h-3 mr-1" />
                      Config
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="accuracy" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Precisão dos Modelos</CardTitle>
                <CardDescription>Comparação de performance</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={models}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="accuracy" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Confiança</CardTitle>
                <CardDescription>Níveis de confiança por modelo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={models}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, confidence }) => `${name}: ${(confidence * 100).toFixed(1)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="confidence"
                    >
                      {models.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={`hsl(${index * 72}, 70%, 60%)`} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PredictiveAnalytics;
