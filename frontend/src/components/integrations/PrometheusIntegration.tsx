import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { 
  BarChartIcon, 
  PlayIcon, 
  Square as StopIcon, 
  RefreshCwIcon, 
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  CopyIcon,
  PlusIcon,
  TrashIcon,
  EditIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface PrometheusConfig {
  endpoint: string;
  scrapeInterval: string;
  retentionTime: string;
  maxSamples: number;
  timeout: string;
  basicAuth?: {
    username: string;
    password: string;
  };
}

interface MetricTarget {
  id: string;
  name: string;
  job: string;
  instance: string;
  path: string;
  interval: string;
  isEnabled: boolean;
  lastScrape: string;
  status: 'up' | 'down' | 'unknown';
}

interface AlertRule {
  id: string;
  name: string;
  query: string;
  duration: string;
  severity: 'critical' | 'warning' | 'info';
  isEnabled: boolean;
  description: string;
}

const mockMetricsData = [
  { time: '00:00', requests: 1250, latency: 45, errors: 2 },
  { time: '00:05', requests: 1340, latency: 38, errors: 1 },
  { time: '00:10', requests: 1180, latency: 52, errors: 4 },
  { time: '00:15', requests: 1450, latency: 41, errors: 0 },
  { time: '00:20', requests: 1620, latency: 47, errors: 3 },
  { time: '00:25', requests: 1380, latency: 35, errors: 1 },
  { time: '00:30', requests: 1720, latency: 44, errors: 2 }
];

const mockTargets: MetricTarget[] = [
  {
    id: '1',
    name: 'VeloFlux Load Balancer',
    job: 'veloflux-lb',
    instance: 'localhost:8080',
    path: '/metrics',
    interval: '15s',
    isEnabled: true,
    lastScrape: '2024-06-19T12:05:30Z',
    status: 'up'
  },
  {
    id: '2',
    name: 'Backend Server 1',
    job: 'backend',
    instance: 'backend-1:8081',
    path: '/metrics',
    interval: '30s',
    isEnabled: true,
    lastScrape: '2024-06-19T12:05:15Z',
    status: 'up'
  },
  {
    id: '3',
    name: 'Backend Server 2',
    job: 'backend',
    instance: 'backend-2:8081',
    path: '/metrics',
    interval: '30s',
    isEnabled: false,
    lastScrape: '2024-06-19T11:58:22Z',
    status: 'down'
  }
];

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'High Error Rate',
    query: 'rate(http_requests_total{status=~"5.."}[5m]) > 0.1',
    duration: '5m',
    severity: 'critical',
    isEnabled: true,
    description: 'Disparar quando a taxa de erro 5xx for superior a 10%'
  },
  {
    id: '2',
    name: 'High Latency',
    query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 0.5',
    duration: '2m',
    severity: 'warning',
    isEnabled: true,
    description: 'Disparar quando o p95 de latência for superior a 500ms'
  },
  {
    id: '3',
    name: 'Service Down',
    query: 'up == 0',
    duration: '1m',
    severity: 'critical',
    isEnabled: true,
    description: 'Disparar quando um serviço estiver fora do ar'
  }
];

export const PrometheusIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<PrometheusConfig>({
    endpoint: 'http://prometheus:9090',
    scrapeInterval: '15s',
    retentionTime: '30d',
    maxSamples: 50000000,
    timeout: '10s'
  });
  
  const [targets, setTargets] = useState<MetricTarget[]>(mockTargets);
  const [alertRules, setAlertRules] = useState<AlertRule[]>(mockAlertRules);
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    // Simular teste de conexão
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    setIsConnected(true);
  };

  const toggleTarget = (id: string) => {
    setTargets(prev => prev.map(target => 
      target.id === id ? { ...target, isEnabled: !target.isEnabled } : target
    ));
  };

  const toggleAlertRule = (id: string) => {
    setAlertRules(prev => prev.map(rule => 
      rule.id === id ? { ...rule, isEnabled: !rule.isEnabled } : rule
    ));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': return 'bg-green-100 text-green-800';
      case 'down': return 'bg-red-100 text-red-800';
      case 'unknown': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'info': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <BarChartIcon className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integração Prometheus</h2>
              <p className="text-gray-600 mt-1">
                Configure e monitore métricas com Prometheus
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge className={isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
            {isConnected ? (
              <>
                <CheckCircleIcon className="w-4 h-4 mr-1" />
                Conectado
              </>
            ) : (
              <>
                <AlertTriangleIcon className="w-4 h-4 mr-1" />
                Desconectado
              </>
            )}
          </Badge>
          <Button variant="outline" size="sm">
            <ExternalLinkIcon className="w-4 h-4 mr-2" />
            Abrir Prometheus
          </Button>
        </div>
      </div>

      <Tabs defaultValue="metrics" className="space-y-6">
        <TabsList>
          <TabsTrigger value="metrics">Métricas</TabsTrigger>
          <TabsTrigger value="targets">Targets</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        {/* Metrics Tab */}
        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requisições/min</p>
                    <p className="text-2xl font-bold">1,450</p>
                    <p className="text-xs text-green-600">+12% vs último período</p>
                  </div>
                  <BarChartIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Latência P95</p>
                    <p className="text-2xl font-bold">42ms</p>
                    <p className="text-xs text-green-600">-5% vs último período</p>
                  </div>
                  <BarChartIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Erro</p>
                    <p className="text-2xl font-bold">0.12%</p>
                    <p className="text-xs text-green-600">-0.05% vs último período</p>
                  </div>
                  <AlertTriangleIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Requisições por Tempo</CardTitle>
                <CardDescription>Volume de requisições nos últimos 30 minutos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockMetricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="requests" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Latência e Erros</CardTitle>
                <CardDescription>Latência média e contagem de erros</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockMetricsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="latency" orientation="left" />
                    <YAxis yAxisId="errors" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="latency" type="monotone" dataKey="latency" stroke="#10b981" name="Latência (ms)" />
                    <Line yAxisId="errors" type="monotone" dataKey="errors" stroke="#ef4444" name="Erros" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Custom Queries */}
          <Card>
            <CardHeader>
              <CardTitle>Consultas Customizadas</CardTitle>
              <CardDescription>Execute consultas PromQL personalizadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input 
                  placeholder="Digite sua consulta PromQL aqui..." 
                  className="flex-1"
                  defaultValue="rate(http_requests_total[5m])"
                />
                <Button>
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Executar
                </Button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
                <Button variant="outline" size="sm">
                  <CopyIcon className="w-4 h-4 mr-1" />
                  rate(http_requests_total[5m])
                </Button>
                <Button variant="outline" size="sm">
                  <CopyIcon className="w-4 h-4 mr-1" />
                  histogram_quantile(0.95, ...)
                </Button>
                <Button variant="outline" size="sm">
                  <CopyIcon className="w-4 h-4 mr-1" />
                  up
                </Button>
                <Button variant="outline" size="sm">
                  <CopyIcon className="w-4 h-4 mr-1" />
                  cpu_usage_percent
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Targets Tab */}
        <TabsContent value="targets" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Targets de Monitoramento</h3>
              <p className="text-sm text-gray-600">
                {targets.filter(t => t.isEnabled).length} de {targets.length} targets ativos
              </p>
            </div>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Adicionar Target
            </Button>
          </div>

          <div className="space-y-4">
            {targets.map(target => (
              <Card key={target.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={target.isEnabled}
                        onCheckedChange={() => toggleTarget(target.id)}
                      />
                      <div>
                        <h4 className="font-semibold">{target.name}</h4>
                        <p className="text-sm text-gray-600">
                          {target.job} • {target.instance}{target.path}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p>Intervalo: {target.interval}</p>
                        <p className="text-gray-600">
                          Último scrape: {new Date(target.lastScrape).toLocaleTimeString()}
                        </p>
                      </div>
                      
                      <Badge className={getStatusColor(target.status)}>
                        {target.status}
                      </Badge>
                      
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <EditIcon className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <TrashIcon className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Regras de Alerta</h3>
              <p className="text-sm text-gray-600">
                {alertRules.filter(r => r.isEnabled).length} de {alertRules.length} regras ativas
              </p>
            </div>
            <Button>
              <PlusIcon className="w-4 h-4 mr-2" />
              Nova Regra
            </Button>
          </div>

          <div className="space-y-4">
            {alertRules.map(rule => (
              <Card key={rule.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Switch
                        checked={rule.isEnabled}
                        onCheckedChange={() => toggleAlertRule(rule.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{rule.name}</h4>
                          <Badge className={getSeverityColor(rule.severity)}>
                            {rule.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{rule.description}</p>
                        <div className="bg-gray-50 p-2 rounded text-sm font-mono">
                          {rule.query}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                          Duração: {rule.duration}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <EditIcon className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Prometheus</CardTitle>
              <CardDescription>Configure a conexão e parâmetros do Prometheus</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="endpoint">Endpoint do Prometheus</Label>
                  <Input
                    id="endpoint"
                    value={config.endpoint}
                    onChange={(e) => setConfig(prev => ({ ...prev, endpoint: e.target.value }))}
                    placeholder="http://prometheus:9090"
                  />
                </div>
                
                <div>
                  <Label htmlFor="scrapeInterval">Intervalo de Scrape</Label>
                  <Select value={config.scrapeInterval} onValueChange={(value) => setConfig(prev => ({ ...prev, scrapeInterval: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5s">5 segundos</SelectItem>
                      <SelectItem value="15s">15 segundos</SelectItem>
                      <SelectItem value="30s">30 segundos</SelectItem>
                      <SelectItem value="1m">1 minuto</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="retentionTime">Tempo de Retenção</Label>
                  <Select value={config.retentionTime} onValueChange={(value) => setConfig(prev => ({ ...prev, retentionTime: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7d">7 dias</SelectItem>
                      <SelectItem value="15d">15 dias</SelectItem>
                      <SelectItem value="30d">30 dias</SelectItem>
                      <SelectItem value="90d">90 dias</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="timeout">Timeout</Label>
                  <Input
                    id="timeout"
                    value={config.timeout}
                    onChange={(e) => setConfig(prev => ({ ...prev, timeout: e.target.value }))}
                    placeholder="10s"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Autenticação (Opcional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="username">Usuário</Label>
                    <Input
                      id="username"
                      value={config.basicAuth?.username || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        basicAuth: { ...prev.basicAuth, username: e.target.value } 
                      }))}
                      placeholder="Username"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={config.basicAuth?.password || ''}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        basicAuth: { ...prev.basicAuth, password: e.target.value } 
                      }))}
                      placeholder="Password"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="flex gap-4">
                <Button onClick={testConnection} disabled={isTesting}>
                  {isTesting ? (
                    <>
                      <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                      Testando...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="w-4 h-4 mr-2" />
                      Testar Conexão
                    </>
                  )}
                </Button>
                
                <Button variant="outline">
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  Salvar Configuração
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PrometheusIntegration;
