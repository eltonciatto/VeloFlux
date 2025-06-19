import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  PieChart,
  Pie,
  Cell,
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
  Cpu,
  HardDrive,
  Database,
  Zap,
  TrendingDown,
  TrendingUp,
  Target,
  Settings,
  Brain,
  DollarSign,
  Clock,
  Activity,
  BarChart3,
  Layers,
  AlertCircle,
  CheckCircle,
  Lightbulb,
  RefreshCw,
  Download,
  Upload,
  Server,
  Gauge
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface ResourceMetric {
  id: string;
  name: string;
  type: 'cpu' | 'memory' | 'storage' | 'network' | 'database';
  current: number;
  optimal: number;
  allocated: number;
  efficiency: number;
  cost: number;
  trend: 'up' | 'down' | 'stable';
  recommendation: string;
  status: 'optimal' | 'overprovisioned' | 'underprovisioned' | 'critical';
}

interface OptimizationOpportunity {
  id: string;
  type: 'rightsizing' | 'scheduling' | 'consolidation' | 'termination' | 'upgrade';
  resource: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  impact: {
    cost: number;
    performance: number;
    efficiency: number;
  };
  effort: 'low' | 'medium' | 'high';
  timeframe: string;
  description: string;
  currentState: string;
  proposedState: string;
  confidence: number;
  monthlyImpact: number;
}

interface CostBreakdown {
  category: string;
  current: number;
  optimized: number;
  savings: number;
  percentage: number;
}

const ResourceOptimization: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [optimizationEnabled, setOptimizationEnabled] = useState(true);
  const [autoApply, setAutoApply] = useState(false);

  // Mock data - em produção viria de APIs
  const [resourceMetrics] = useState<ResourceMetric[]>([
    {
      id: 'cpu-pool-1',
      name: 'CPU Pool Principal',
      type: 'cpu',
      current: 45,
      optimal: 70,
      allocated: 100,
      efficiency: 45,
      cost: 1200,
      trend: 'stable',
      recommendation: 'Reduzir alocação em 30%',
      status: 'overprovisioned'
    },
    {
      id: 'memory-cluster-1',
      name: 'Memory Cluster Web',
      type: 'memory',
      current: 88,
      optimal: 80,
      allocated: 100,
      efficiency: 88,
      cost: 800,
      trend: 'up',
      recommendation: 'Aumentar alocação em 15%',
      status: 'underprovisioned'
    },
    {
      id: 'storage-main',
      name: 'Storage Principal',
      type: 'storage',
      current: 62,
      optimal: 75,
      allocated: 100,
      efficiency: 62,
      cost: 600,
      trend: 'down',
      recommendation: 'Consolidar volumes não utilizados',
      status: 'overprovisioned'
    },
    {
      id: 'db-cluster-1',
      name: 'Database Cluster',
      type: 'database',
      current: 75,
      optimal: 75,
      allocated: 100,
      efficiency: 95,
      cost: 2400,
      trend: 'stable',
      recommendation: 'Configuração ótima',
      status: 'optimal'
    },
    {
      id: 'network-bandwidth',
      name: 'Network Bandwidth',
      type: 'network',
      current: 30,
      optimal: 60,
      allocated: 100,
      efficiency: 30,
      cost: 400,
      trend: 'down',
      recommendation: 'Reduzir bandwidth em 50%',
      status: 'overprovisioned'
    }
  ]);

  const [optimizationOpportunities] = useState<OptimizationOpportunity[]>([
    {
      id: 'opp-001',
      type: 'rightsizing',
      resource: 'EC2 Instances - Web Tier',
      severity: 'high',
      impact: {
        cost: 35,
        performance: 5,
        efficiency: 40
      },
      effort: 'low',
      timeframe: 'Imediato',
      description: 'Reduzir tamanho de instâncias EC2 subutilizadas',
      currentState: '20x m5.large (40% CPU médio)',
      proposedState: '15x m5.medium + 3x m5.large',
      confidence: 0.92,
      monthlyImpact: 1200
    },
    {
      id: 'opp-002',
      type: 'scheduling',
      resource: 'Development Environments',
      severity: 'medium',
      impact: {
        cost: 60,
        performance: 0,
        efficiency: 80
      },
      effort: 'medium',
      timeframe: '1-2 semanas',
      description: 'Implementar agendamento automático para ambientes de dev',
      currentState: '24/7 execution',
      proposedState: 'Business hours only (8h/day)',
      confidence: 0.95,
      monthlyImpact: 2800
    },
    {
      id: 'opp-003',
      type: 'consolidation',
      resource: 'Database Storage',
      severity: 'medium',
      impact: {
        cost: 25,
        performance: 10,
        efficiency: 30
      },
      effort: 'high',
      timeframe: '2-4 semanas',
      description: 'Consolidar múltiplos volumes de storage',
      currentState: '15 volumes separados',
      proposedState: '5 volumes consolidados',
      confidence: 0.87,
      monthlyImpact: 800
    },
    {
      id: 'opp-004',
      type: 'termination',
      resource: 'Unused Load Balancers',
      severity: 'low',
      impact: {
        cost: 100,
        performance: 0,
        efficiency: 100
      },
      effort: 'low',
      timeframe: 'Imediato',
      description: 'Remover load balancers não utilizados',
      currentState: '8 ALBs ativos',
      proposedState: '3 ALBs necessários',
      confidence: 0.99,
      monthlyImpact: 200
    },
    {
      id: 'opp-005',
      type: 'upgrade',
      resource: 'Database Instances',
      severity: 'medium',
      impact: {
        cost: -10,
        performance: 25,
        efficiency: 20
      },
      effort: 'medium',
      timeframe: '1 semana',
      description: 'Migrar para instâncias de nova geração',
      currentState: 'db.r5.xlarge (old gen)',
      proposedState: 'db.r6g.large (ARM)',
      confidence: 0.89,
      monthlyImpact: -150
    }
  ]);

  const [costBreakdown] = useState<CostBreakdown[]>([
    {
      category: 'Compute (EC2)',
      current: 4500,
      optimized: 3200,
      savings: 1300,
      percentage: 29
    },
    {
      category: 'Storage (EBS/S3)',
      current: 1200,
      optimized: 900,
      savings: 300,
      percentage: 25
    },
    {
      category: 'Database (RDS)',
      current: 2800,
      optimized: 2600,
      savings: 200,
      percentage: 7
    },
    {
      category: 'Network',
      current: 800,
      optimized: 500,
      savings: 300,
      percentage: 38
    },
    {
      category: 'Load Balancers',
      current: 300,
      optimized: 120,
      savings: 180,
      percentage: 60
    }
  ]);

  // Dados para gráficos
  const [utilizationData] = useState(() => {
    return Array.from({ length: 24 }, (_, i) => {
      const hour = new Date(Date.now() - (23 - i) * 3600000);
      return {
        time: hour.toISOString(),
        cpu: Math.random() * 30 + 40 + Math.sin(i / 6) * 15,
        memory: Math.random() * 25 + 50 + Math.sin(i / 5) * 20,
        storage: Math.random() * 20 + 60 + Math.sin(i / 8) * 10,
        network: Math.random() * 40 + 20 + Math.sin(i / 4) * 20,
        cost: (Math.random() * 50 + 300) + Math.sin(i / 6) * 100
      };
    });
  });

  const pieData = costBreakdown.map(item => ({
    name: item.category,
    value: item.current,
    optimized: item.optimized,
    savings: item.savings
  }));

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'optimal': return 'text-green-600 bg-green-50';
      case 'overprovisioned': return 'text-orange-600 bg-orange-50';
      case 'underprovisioned': return 'text-red-600 bg-red-50';
      case 'critical': return 'text-red-800 bg-red-100';
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

  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'cpu': return <Cpu className="w-5 h-5" />;
      case 'memory': return <Activity className="w-5 h-5" />;
      case 'storage': return <HardDrive className="w-5 h-5" />;
      case 'database': return <Database className="w-5 h-5" />;
      case 'network': return <Zap className="w-5 h-5" />;
      default: return <Server className="w-5 h-5" />;
    }
  };

  const getOpportunityIcon = (type: string) => {
    switch (type) {
      case 'rightsizing': return <Target className="w-4 h-4" />;
      case 'scheduling': return <Clock className="w-4 h-4" />;
      case 'consolidation': return <Layers className="w-4 h-4" />;
      case 'termination': return <TrendingDown className="w-4 h-4" />;
      case 'upgrade': return <TrendingUp className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const totalSavings = costBreakdown.reduce((sum, item) => sum + item.savings, 0);
  const totalCurrent = costBreakdown.reduce((sum, item) => sum + item.current, 0);
  const savingsPercentage = (totalSavings / totalCurrent) * 100;

  const averageEfficiency = resourceMetrics.reduce((sum, metric) => sum + metric.efficiency, 0) / resourceMetrics.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-600" />
            Otimização de Recursos
          </h2>
          <p className="text-gray-600 mt-1">
            Análise inteligente e recomendações para otimização de recursos
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch 
              checked={optimizationEnabled}
              onCheckedChange={setOptimizationEnabled}
            />
            <span className="text-sm">Otimização Ativa</span>
          </div>
          <div className="flex items-center gap-2">
            <Switch 
              checked={autoApply}
              onCheckedChange={setAutoApply}
            />
            <span className="text-sm">Auto-Aplicar</span>
          </div>
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Analisar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Economia Potencial</p>
                <p className="text-2xl font-bold text-green-600">${totalSavings}</p>
                <p className="text-xs text-green-600">-{savingsPercentage.toFixed(1)}% do custo</p>
              </div>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eficiência Média</p>
                <p className="text-2xl font-bold">{averageEfficiency.toFixed(0)}%</p>
                <Progress value={averageEfficiency} className="h-1 mt-1" />
              </div>
              <Gauge className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Oportunidades</p>
                <p className="text-2xl font-bold">{optimizationOpportunities.length}</p>
                <p className="text-xs text-gray-600">
                  {optimizationOpportunities.filter(op => op.severity === 'high' || op.severity === 'critical').length} alta prioridade
                </p>
              </div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Recursos Monitorados</p>
                <p className="text-2xl font-bold">{resourceMetrics.length}</p>
                <p className="text-xs text-gray-600">
                  {resourceMetrics.filter(r => r.status === 'optimal').length} otimizados
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="opportunities">Oportunidades</TabsTrigger>
          <TabsTrigger value="resources">Recursos</TabsTrigger>
          <TabsTrigger value="cost-analysis">Análise de Custo</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Utilização de Recursos - 24h</CardTitle>
                <CardDescription>Monitoramento em tempo real da utilização</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={utilizationData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                    />
                    <YAxis />
                    <Tooltip 
                      labelFormatter={(value) => new Date(value).toLocaleString()}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="cpu" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="CPU %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="memory" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Memória %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="storage" 
                      stroke="#f59e0b" 
                      strokeWidth={2}
                      name="Storage %"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="network" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Network %"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Custos</CardTitle>
                <CardDescription>Atual vs Otimizado</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value}`}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo de Otimizações Disponíveis</CardTitle>
              <CardDescription>
                Top oportunidades de economia e melhoria de performance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {optimizationOpportunities.slice(0, 3).map(opportunity => (
                  <div key={opportunity.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getOpportunityIcon(opportunity.type)}
                      <div>
                        <p className="font-medium">{opportunity.description}</p>
                        <p className="text-sm text-gray-600">
                          Economia: ${opportunity.monthlyImpact}/mês • 
                          Esforço: {opportunity.effort} • 
                          Confiança: {(opportunity.confidence * 100).toFixed(0)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(opportunity.severity)}>
                        {opportunity.severity}
                      </Badge>
                      <Button size="sm">Aplicar</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="opportunities" className="space-y-6">
          <div className="space-y-4">
            {optimizationOpportunities.map(opportunity => (
              <Card key={opportunity.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getOpportunityIcon(opportunity.type)}
                      <div>
                        <CardTitle className="text-lg">{opportunity.description}</CardTitle>
                        <CardDescription>
                          {opportunity.resource} • {opportunity.timeframe}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getSeverityColor(opportunity.severity)}>
                        {opportunity.severity}
                      </Badge>
                      <Badge variant="outline">
                        {(opportunity.confidence * 100).toFixed(0)}% confiança
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado Atual</p>
                      <p className="text-sm">{opportunity.currentState}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-600">Estado Proposto</p>
                      <p className="text-sm">{opportunity.proposedState}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Custo</p>
                      <p className={`text-lg font-bold ${opportunity.impact.cost > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {opportunity.impact.cost > 0 ? '+' : ''}{opportunity.impact.cost}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Performance</p>
                      <p className={`text-lg font-bold ${opportunity.impact.performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {opportunity.impact.performance > 0 ? '+' : ''}{opportunity.impact.performance}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Eficiência</p>
                      <p className={`text-lg font-bold ${opportunity.impact.efficiency > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {opportunity.impact.efficiency > 0 ? '+' : ''}{opportunity.impact.efficiency}%
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-sm text-gray-600">Impacto Mensal</p>
                      <p className={`text-lg font-bold ${opportunity.monthlyImpact > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ${Math.abs(opportunity.monthlyImpact)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      Aplicar Otimização
                    </Button>
                    <Button size="sm" variant="outline">
                      Agendar
                    </Button>
                    <Button size="sm" variant="outline">
                      Simular
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

        <TabsContent value="resources" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {resourceMetrics.map(metric => (
              <Card key={metric.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getResourceIcon(metric.type)}
                      <div>
                        <CardTitle className="text-lg">{metric.name}</CardTitle>
                        <CardDescription>
                          Custo atual: ${metric.cost}/mês
                        </CardDescription>
                      </div>
                    </div>
                    <Badge className={getStatusColor(metric.status)}>
                      {metric.status}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilização Atual</span>
                        <span>{metric.current}%</span>
                      </div>
                      <Progress value={metric.current} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Utilização Ótima</span>
                        <span>{metric.optimal}%</span>
                      </div>
                      <Progress value={metric.optimal} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Eficiência</span>
                        <span>{metric.efficiency}%</span>
                      </div>
                      <Progress value={metric.efficiency} className="h-2" />
                    </div>
                  </div>

                  <Alert>
                    <Lightbulb className="w-4 h-4" />
                    <AlertDescription>
                      {metric.recommendation}
                    </AlertDescription>
                  </Alert>

                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1">
                      Otimizar
                    </Button>
                    <Button size="sm" variant="outline">
                      Detalhes
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Análise Detalhada de Custos</CardTitle>
              <CardDescription>
                Comparação entre custos atuais e otimizados por categoria
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={costBreakdown} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: any, name: any) => [`$${value}`, name === 'current' ? 'Atual' : 'Otimizado']}
                  />
                  <Bar dataKey="current" fill="#ef4444" name="current" />
                  <Bar dataKey="optimized" fill="#10b981" name="optimized" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Economias</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {costBreakdown.map(item => (
                  <div key={item.category} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <p className="font-medium">{item.category}</p>
                      <p className="text-sm text-gray-600">
                        ${item.current} → ${item.optimized}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-green-600">${item.savings}</p>
                      <p className="text-sm text-green-600">-{item.percentage}%</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Projeção de Economias</CardTitle>
                <CardDescription>Economia acumulada ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={Array.from({ length: 12 }, (_, i) => ({
                    month: `Mês ${i + 1}`,
                    savings: totalSavings * (i + 1),
                    cumulative: totalSavings * (i + 1) * (i + 1) / 2
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value: any) => [`$${value}`, 'Economia']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="cumulative" 
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
      </Tabs>
    </div>
  );
};

export default ResourceOptimization;
