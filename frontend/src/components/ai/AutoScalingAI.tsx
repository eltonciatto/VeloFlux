import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
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
  AreaChart,
  Area,
  BarChart,
  Bar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  Server,
  Activity,
  Brain,
  Target,
  Settings,
  Play,
  Pause,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  Clock,
  DollarSign,
  AlertTriangle,
  CheckCircle,
  ArrowUp,
  ArrowDown,
  Gauge
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ScalingEvent {
  id: string;
  timestamp: string;
  type: 'scale_up' | 'scale_down';
  trigger: 'cpu' | 'memory' | 'traffic' | 'latency' | 'predictive';
  fromInstances: number;
  toInstances: number;
  confidence: number;
  savings?: number;
  cost?: number;
  efficiency: number;
  duration: number;
  status: 'pending' | 'executing' | 'completed' | 'failed';
}

interface ScalingPolicy {
  id: string;
  name: string;
  enabled: boolean;
  metric: string;
  threshold: number;
  scalingType: 'reactive' | 'predictive' | 'hybrid';
  minInstances: number;
  maxInstances: number;
  cooldownPeriod: number;
  aggressiveness: number;
  aiOptimized: boolean;
}

interface Recommendation {
  id: string;
  type: 'immediate' | 'scheduled' | 'policy';
  action: 'scale_up' | 'scale_down' | 'optimize';
  confidence: number;
  impact: {
    performance: number;
    cost: number;
    efficiency: number;
  };
  timeframe: string;
  description: string;
  reasoning: string[];
}

const AutoScalingAI: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [autoScalingEnabled, setAutoScalingEnabled] = useState(true);
  const [predictiveMode, setPredictiveMode] = useState(true);

  // Estados para simular dados em tempo real
  const [currentInstances, setCurrentInstances] = useState(8);
  const [targetInstances, setTargetInstances] = useState(8);
  const [isScaling, setIsScaling] = useState(false);

  // Mock data - em produção viria de APIs
  const [scalingEvents] = useState<ScalingEvent[]>([
    {
      id: 'scale-001',
      timestamp: new Date(Date.now() - 300000).toISOString(),
      type: 'scale_up',
      trigger: 'predictive',
      fromInstances: 6,
      toInstances: 8,
      confidence: 0.92,
      cost: 45,
      efficiency: 87,
      duration: 120,
      status: 'completed'
    },
    {
      id: 'scale-002',
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      type: 'scale_down',
      trigger: 'cpu',
      fromInstances: 10,
      toInstances: 8,
      confidence: 0.88,
      savings: 120,
      efficiency: 92,
      duration: 180,
      status: 'completed'
    },
    {
      id: 'scale-003',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      type: 'scale_up',
      trigger: 'traffic',
      fromInstances: 8,
      toInstances: 10,
      confidence: 0.95,
      cost: 75,
      efficiency: 85,
      duration: 90,
      status: 'completed'
    }
  ]);

  const [scalingPolicies, setScalingPolicies] = useState<ScalingPolicy[]>([
    {
      id: 'cpu-policy',
      name: 'CPU Auto-Scaling',
      enabled: true,
      metric: 'cpu_utilization',
      threshold: 70,
      scalingType: 'hybrid',
      minInstances: 2,
      maxInstances: 20,
      cooldownPeriod: 300,
      aggressiveness: 0.7,
      aiOptimized: true
    },
    {
      id: 'memory-policy',
      name: 'Memory Auto-Scaling',
      enabled: true,
      metric: 'memory_utilization',
      threshold: 80,
      scalingType: 'reactive',
      minInstances: 2,
      maxInstances: 15,
      cooldownPeriod: 240,
      aggressiveness: 0.6,
      aiOptimized: false
    },
    {
      id: 'traffic-policy',
      name: 'Traffic Predictive Scaling',
      enabled: true,
      metric: 'requests_per_second',
      threshold: 1000,
      scalingType: 'predictive',
      minInstances: 3,
      maxInstances: 25,
      cooldownPeriod: 180,
      aggressiveness: 0.8,
      aiOptimized: true
    }
  ]);

  const [recommendations] = useState<Recommendation[]>([
    {
      id: 'rec-001',
      type: 'immediate',
      action: 'scale_up',
      confidence: 0.89,
      impact: {
        performance: 25,
        cost: -15,
        efficiency: 20
      },
      timeframe: 'Próximos 30 minutos',
      description: 'Aumentar para 10 instâncias para antecipar pico de tráfego',
      reasoning: [
        'Modelo prevê aumento de 40% no tráfego em 30 min',
        'Histórico mostra padrão similar às 14:30',
        'CPU atual está em 72%, próximo do threshold'
      ]
    },
    {
      id: 'rec-002',
      type: 'scheduled',
      action: 'optimize',
      confidence: 0.94,
      impact: {
        performance: 10,
        cost: 35,
        efficiency: 45
      },
      timeframe: 'Durante a madrugada (02:00-05:00)',
      description: 'Otimizar políticas de scaling para melhor eficiência',
      reasoning: [
        'Análise mostra over-provisioning durante períodos de baixo tráfego',
        'Possível economia de 35% nos custos',
        'Zero impacto na performance do usuário'
      ]
    },
    {
      id: 'rec-003',
      type: 'policy',
      action: 'optimize',
      confidence: 0.87,
      impact: {
        performance: 15,
        cost: 20,
        efficiency: 30
      },
      timeframe: 'Implementação contínua',
      description: 'Ajustar threshold de CPU de 70% para 75%',
      reasoning: [
        'Análise de 30 dias mostra scaling prematuro',
        'Aplicação mantém performance boa até 75% CPU',
        'Redução de 20% em eventos de scaling desnecessários'
      ]
    }
  ]);

  // Dados para gráficos
  const [metricsData] = useState(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(Date.now() - (23 - i) * 3600000);
      return {
        time: hour.toISOString(),
        instances: Math.floor(Math.random() * 8) + 4 + Math.sin(i / 4) * 3,
        cpu: Math.random() * 40 + 40 + Math.sin(i / 6) * 20,
        memory: Math.random() * 30 + 50 + Math.sin(i / 5) * 15,
        traffic: Math.random() * 500 + 300 + Math.sin(i / 4) * 200,
        cost: (Math.floor(Math.random() * 8) + 4 + Math.sin(i / 4) * 3) * 0.08
      };
    });
  });

  // Simulação de scaling em tempo real
  useEffect(() => {
    if (!isScaling) return;

    const interval = setInterval(() => {
      if (currentInstances !== targetInstances) {
        const direction = targetInstances > currentInstances ? 1 : -1;
        setCurrentInstances(prev => prev + direction);
      } else {
        setIsScaling(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isScaling, currentInstances, targetInstances]);

  const handleScaleUp = () => {
    if (currentInstances < 20) {
      setTargetInstances(currentInstances + 2);
      setIsScaling(true);
    }
  };

  const handleScaleDown = () => {
    if (currentInstances > 2) {
      setTargetInstances(currentInstances - 2);
      setIsScaling(true);
    }
  };

  const togglePolicy = (id: string) => {
    setScalingPolicies(prev => prev.map(policy => 
      policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-600';
      case 'executing': return 'text-blue-600';
      case 'pending': return 'text-yellow-600';
      case 'failed': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scale_up': return <ChevronUp className="w-4 h-4 text-green-600" />;
      case 'scale_down': return <ChevronDown className="w-4 h-4 text-blue-600" />;
      case 'optimize': return <Settings className="w-4 h-4 text-purple-600" />;
      default: return <Target className="w-4 h-4 text-gray-600" />;
    }
  };

  const currentMetrics = {
    cpu: 68,
    memory: 72,
    traffic: 850,
    efficiency: 87,
    hourlyCost: currentInstances * 0.08
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Zap className="w-6 h-6 text-blue-600" />
            Auto-Scaling Inteligente
          </h2>
          <p className="text-gray-600 mt-1">
            Escalabilidade automática com IA e machine learning
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoScalingEnabled}
              onCheckedChange={setAutoScalingEnabled}
            />
            <span className="text-sm">Auto-Scaling</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={predictiveMode}
              onCheckedChange={setPredictiveMode}
            />
            <span className="text-sm">Modo Preditivo</span>
          </div>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Current Status */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Instâncias Ativas</p>
                <p className="text-2xl font-bold">{currentInstances}</p>
                {isScaling && (
                  <p className="text-xs text-blue-600">→ {targetInstances}</p>
                )}
              </div>
              <Server className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">CPU Média</p>
                <p className="text-2xl font-bold">{currentMetrics.cpu}%</p>
                <Progress value={currentMetrics.cpu} className="h-1 mt-1" />
              </div>
              <Gauge className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Memória Média</p>
                <p className="text-2xl font-bold">{currentMetrics.memory}%</p>
                <Progress value={currentMetrics.memory} className="h-1 mt-1" />
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Req/s</p>
                <p className="text-2xl font-bold">{currentMetrics.traffic}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Custo/Hora</p>
                <p className="text-2xl font-bold">${currentMetrics.hourlyCost.toFixed(2)}</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Manual Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Controles Manuais
          </CardTitle>
          <CardDescription>
            Ações manuais de scaling (só funciona se auto-scaling estiver desabilitado)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button 
              onClick={handleScaleDown}
              disabled={autoScalingEnabled || isScaling || currentInstances <= 2}
              variant="outline"
            >
              <ChevronDown className="w-4 h-4 mr-2" />
              Scale Down
            </Button>
            
            <div className="flex-1 text-center">
              <p className="text-sm text-gray-600">Instâncias Atuais</p>
              <p className="text-3xl font-bold">{currentInstances}</p>
              {isScaling && (
                <p className="text-sm text-blue-600 flex items-center justify-center gap-1">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Escalando para {targetInstances}...
                </p>
              )}
            </div>
            
            <Button 
              onClick={handleScaleUp}
              disabled={autoScalingEnabled || isScaling || currentInstances >= 20}
              variant="outline"
            >
              <ChevronUp className="w-4 h-4 mr-2" />
              Scale Up
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="recommendations">Recomendações</TabsTrigger>
          <TabsTrigger value="policies">Políticas</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Métricas e Instâncias - 24h</CardTitle>
                <CardDescription>Correlação entre métricas e scaling</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="instances" 
                      stroke="#3b82f6" 
                      strokeWidth={3}
                      name="Instâncias"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="CPU %"
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Memória %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Custo vs Performance</CardTitle>
                <CardDescription>Análise de eficiência de custo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={metricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                      formatter={(value: number) => [`$${value.toFixed(2)}`, 'Custo/Hora']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cost" 
                      stackId="1"
                      stroke="#10b981" 
                      fill="#10b981" 
                      fillOpacity={0.6}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <div className="space-y-4">
            {recommendations.map(rec => (
              <Card key={rec.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getActionIcon(rec.action)}
                      <div>
                        <CardTitle className="text-lg">{rec.description}</CardTitle>
                        <CardDescription>{rec.timeframe}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={rec.type === 'immediate' ? 'destructive' : rec.type === 'scheduled' ? 'default' : 'secondary'}>
                        {rec.type}
                      </Badge>
                      <Badge variant="outline">
                        {(rec.confidence * 100).toFixed(0)}% confiança
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Performance</p>
                      <p className={`text-lg font-bold ${rec.impact.performance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rec.impact.performance > 0 ? '+' : ''}{rec.impact.performance}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Custo</p>
                      <p className={`text-lg font-bold ${rec.impact.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rec.impact.cost > 0 ? '+' : ''}{rec.impact.cost}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Eficiência</p>
                      <p className={`text-lg font-bold ${rec.impact.efficiency > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {rec.impact.efficiency > 0 ? '+' : ''}{rec.impact.efficiency}%
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Raciocínio da IA:</p>
                    <ul className="space-y-1">
                      {rec.reasoning.map((reason, index) => (
                        <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                          <span className="w-1 h-1 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                          {reason}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      {rec.type === 'immediate' ? 'Aplicar Agora' : 'Agendar'}
                    </Button>
                    <Button size="sm" variant="outline">
                      Adiar
                    </Button>
                    <Button size="sm" variant="outline">
                      Ignorar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="policies" className="space-y-6">
          <div className="space-y-4">
            {scalingPolicies.map(policy => (
              <Card key={policy.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{policy.name}</CardTitle>
                      <CardDescription>
                        Métrica: {policy.metric} | Threshold: {policy.threshold}% | Tipo: {policy.scalingType}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      {policy.aiOptimized && (
                        <Badge variant="default">
                          <Brain className="w-3 h-3 mr-1" />
                          IA Otimizada
                        </Badge>
                      )}
                      <Switch
                        checked={policy.enabled}
                        onCheckedChange={() => togglePolicy(policy.id)}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Min Instâncias</p>
                      <p className="text-lg font-bold">{policy.minInstances}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Max Instâncias</p>
                      <p className="text-lg font-bold">{policy.maxInstances}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Cooldown</p>
                      <p className="text-lg font-bold">{policy.cooldownPeriod}s</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Agressividade</p>
                      <div className="flex items-center gap-2">
                        <Progress value={policy.aggressiveness * 100} className="h-2 flex-1" />
                        <span className="text-sm">{(policy.aggressiveness * 100).toFixed(0)}%</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">
                      <Settings className="w-3 h-3 mr-1" />
                      Editar
                    </Button>
                    <Button size="sm" variant="outline">
                      <Target className="w-3 h-3 mr-1" />
                      Testar
                    </Button>
                    {policy.aiOptimized && (
                      <Button size="sm" variant="outline">
                        <Brain className="w-3 h-3 mr-1" />
                        Re-otimizar
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="space-y-4">
            {scalingEvents.map(event => (
              <Card key={event.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      {event.type === 'scale_up' ? (
                        <ArrowUp className="w-8 h-8 text-green-600" />
                      ) : (
                        <ArrowDown className="w-8 h-8 text-blue-600" />
                      )}
                      
                      <div>
                        <p className="font-medium">
                          {event.type === 'scale_up' ? 'Scale Up' : 'Scale Down'}: {event.fromInstances} → {event.toInstances} instâncias
                        </p>
                        <p className="text-sm text-gray-600">
                          {new Date(event.timestamp).toLocaleString()} • 
                          Trigger: {event.trigger} • 
                          Duração: {event.duration}s
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Eficiência</p>
                        <p className="font-medium">{event.efficiency}%</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="text-sm text-gray-600">
                          {event.savings ? 'Economia' : 'Custo'}
                        </p>
                        <p className={`font-medium ${event.savings ? 'text-green-600' : 'text-red-600'}`}>
                          ${event.savings || event.cost}
                        </p>
                      </div>
                      
                      <Badge 
                        variant={
                          event.status === 'completed' ? 'default' : 
                          event.status === 'failed' ? 'destructive' : 'secondary'
                        }
                      >
                        {event.status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AutoScalingAI;
