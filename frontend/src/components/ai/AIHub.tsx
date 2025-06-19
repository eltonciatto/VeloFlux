import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain,
  TrendingUp,
  AlertTriangle,
  Zap,
  BarChart3,
  Activity,
  Target,
  Settings,
  Lightbulb,
  Clock,
  CheckCircle,
  RefreshCw,
  Play,
  Pause,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

// Importação dos componentes AI
import PredictiveAnalytics from './PredictiveAnalytics';
import AnomalyDetection from './AnomalyDetection';
import AutoScalingAI from './AutoScalingAI';
import ResourceOptimization from './ResourceOptimization';

interface AIModule {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  status: 'active' | 'inactive' | 'warning' | 'error';
  metrics: {
    accuracy?: number;
    performance?: number;
    efficiency?: number;
    savings?: number;
  };
  lastUpdate: string;
  alerts: number;
  enabled: boolean;
}

interface AIInsight {
  id: string;
  type: 'prediction' | 'anomaly' | 'optimization' | 'scaling';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  confidence: number;
  timestamp: string;
  action?: string;
  module: string;
}

const AIHub: React.FC = () => {
  const { t } = useTranslation();
  const [activeModule, setActiveModule] = useState('overview');
  const [aiEnabled, setAiEnabled] = useState(true);

  // Mock data para módulos AI
  const [aiModules] = useState<AIModule[]>([
    {
      id: 'predictive',
      name: 'Análise Preditiva',
      description: 'Previsões baseadas em machine learning para métricas de sistema',
      icon: <TrendingUp className="w-5 h-5" />,
      status: 'active',
      metrics: {
        accuracy: 94,
        performance: 88,
        efficiency: 92
      },
      lastUpdate: new Date(Date.now() - 300000).toISOString(),
      alerts: 2,
      enabled: true
    },
    {
      id: 'anomaly',
      name: 'Detecção de Anomalias',
      description: 'Identificação automática de comportamentos anômalos',
      icon: <AlertTriangle className="w-5 h-5" />,
      status: 'warning',
      metrics: {
        accuracy: 96,
        performance: 91,
        efficiency: 89
      },
      lastUpdate: new Date(Date.now() - 180000).toISOString(),
      alerts: 5,
      enabled: true
    },
    {
      id: 'autoscaling',
      name: 'Auto-Scaling Inteligente',
      description: 'Escalabilidade automática com IA preditiva',
      icon: <Zap className="w-5 h-5" />,
      status: 'active',
      metrics: {
        accuracy: 91,
        efficiency: 95,
        savings: 1200
      },
      lastUpdate: new Date(Date.now() - 120000).toISOString(),
      alerts: 1,
      enabled: true
    },
    {
      id: 'optimization',
      name: 'Otimização de Recursos',
      description: 'Análise e otimização inteligente de recursos',
      icon: <BarChart3 className="w-5 h-5" />,
      status: 'active',
      metrics: {
        efficiency: 87,
        savings: 2800,
        performance: 93
      },
      lastUpdate: new Date(Date.now() - 240000).toISOString(),
      alerts: 3,
      enabled: true
    }
  ]);

  // Mock data para insights
  const [recentInsights] = useState<AIInsight[]>([
    {
      id: 'insight-001',
      type: 'prediction',
      severity: 'high',
      title: 'Pico de CPU previsto em 2 horas',
      description: 'Modelo prevê aumento de 60% na utilização de CPU às 14:30 baseado em padrões históricos',
      confidence: 0.89,
      timestamp: new Date(Date.now() - 600000).toISOString(),
      action: 'Preparar scaling automático',
      module: 'Análise Preditiva'
    },
    {
      id: 'insight-002',
      type: 'anomaly',
      severity: 'critical',
      title: 'Anomalia detectada no banco de dados',
      description: 'Tempo de resposta 340% acima do normal detectado em DB-PROD-01',
      confidence: 0.96,
      timestamp: new Date(Date.now() - 900000).toISOString(),
      action: 'Investigar imediatamente',
      module: 'Detecção de Anomalias'
    },
    {
      id: 'insight-003',
      type: 'optimization',
      severity: 'medium',
      title: 'Oportunidade de economia identificada',
      description: 'Instâncias subutilizadas podem gerar economia de $1.200/mês',
      confidence: 0.92,
      timestamp: new Date(Date.now() - 1200000).toISOString(),
      action: 'Aplicar otimização',
      module: 'Otimização de Recursos'
    },
    {
      id: 'insight-004',
      type: 'scaling',
      severity: 'low',
      title: 'Auto-scaling executado com sucesso',
      description: 'Sistema escalou de 6 para 8 instâncias preventivamente',
      confidence: 0.94,
      timestamp: new Date(Date.now() - 1800000).toISOString(),
      module: 'Auto-Scaling'
    }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-yellow-600 bg-yellow-50';
      case 'error': return 'text-red-600 bg-red-50';
      case 'inactive': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'prediction': return <TrendingUp className="w-4 h-4" />;
      case 'anomaly': return <AlertTriangle className="w-4 h-4" />;
      case 'optimization': return <BarChart3 className="w-4 h-4" />;
      case 'scaling': return <Zap className="w-4 h-4" />;
      default: return <Brain className="w-4 h-4" />;
    }
  };

  const totalAlerts = aiModules.reduce((sum, module) => sum + module.alerts, 0);
  const activeModules = aiModules.filter(module => module.enabled).length;
  const averageAccuracy = aiModules.reduce((sum, module) => sum + (module.metrics.accuracy || 0), 0) / aiModules.length;

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'predictive':
        return <PredictiveAnalytics />;
      case 'anomaly':
        return <AnomalyDetection />;
      case 'autoscaling':
        return <AutoScalingAI />;
      case 'optimization':
        return <ResourceOptimization />;
      default:
        return null;
    }
  };

  if (activeModule !== 'overview') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setActiveModule('overview')}
          >
            ← Voltar ao Hub AI
          </Button>
        </div>
        {renderModuleContent()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-600" />
            Hub de Inteligência Artificial
          </h2>
          <p className="text-gray-600 mt-1">
            Centro de controle para todos os módulos de IA e machine learning
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Configurações
          </Button>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Atualizar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Módulos Ativos</p>
                <p className="text-2xl font-bold">{activeModules}</p>
                <p className="text-xs text-gray-600">de {aiModules.length} total</p>
              </div>
              <Activity className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Precisão Média</p>
                <p className="text-2xl font-bold">{averageAccuracy.toFixed(0)}%</p>
                <p className="text-xs text-green-600">↑ 2.3% esta semana</p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                <p className="text-2xl font-bold">{totalAlerts}</p>
                <p className="text-xs text-red-600">3 alta prioridade</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Insights Gerados</p>
                <p className="text-2xl font-bold">{recentInsights.length}</p>
                <p className="text-xs text-gray-600">últimas 24h</p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {aiModules.map(module => (
          <Card key={module.id} className="cursor-pointer hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    {module.icon}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{module.name}</CardTitle>
                    <CardDescription>{module.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getStatusColor(module.status)}>
                    {module.status}
                  </Badge>
                  {module.alerts > 0 && (
                    <Badge variant="destructive">{module.alerts}</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {module.metrics.accuracy && (
                  <div>
                    <p className="text-sm text-gray-600">Precisão</p>
                    <p className="text-lg font-bold">{module.metrics.accuracy}%</p>
                  </div>
                )}
                {module.metrics.performance && (
                  <div>
                    <p className="text-sm text-gray-600">Performance</p>
                    <p className="text-lg font-bold">{module.metrics.performance}%</p>
                  </div>
                )}
                {module.metrics.efficiency && (
                  <div>
                    <p className="text-sm text-gray-600">Eficiência</p>
                    <p className="text-lg font-bold">{module.metrics.efficiency}%</p>
                  </div>
                )}
                {module.metrics.savings && (
                  <div>
                    <p className="text-sm text-gray-600">Economia</p>
                    <p className="text-lg font-bold text-green-600">${module.metrics.savings}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <p className="text-xs text-gray-600">
                  Atualizado {new Date(module.lastUpdate).toLocaleTimeString()}
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setActiveModule(module.id)}
                >
                  Abrir Módulo
                  <ChevronRight className="w-3 h-3 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="w-5 h-5" />
            Insights Recentes
          </CardTitle>
          <CardDescription>
            Descobertas e recomendações mais recentes dos módulos de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentInsights.map(insight => (
              <div key={insight.id} className="flex items-start gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-purple-100 rounded-lg">
                  {getInsightIcon(insight.type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">{insight.description}</p>
                      <p className="text-xs text-gray-500 mt-2">
                        {insight.module} • {new Date(insight.timestamp).toLocaleString()} • 
                        Confiança: {(insight.confidence * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(insight.severity)}>
                        {insight.severity}
                      </Badge>
                      {insight.action && (
                        <Button size="sm" variant="outline">
                          {insight.action}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
          <CardDescription>
            Controles rápidos para gerenciar os módulos de IA
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button variant="outline" className="h-20 flex-col">
              <Play className="w-6 h-6 mb-2" />
              Treinar Modelos
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <RefreshCw className="w-6 h-6 mb-2" />
              Sincronizar Dados
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <Settings className="w-6 h-6 mb-2" />
              Configurar IA
            </Button>
            <Button variant="outline" className="h-20 flex-col">
              <BarChart3 className="w-6 h-6 mb-2" />
              Relatórios IA
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIHub;
