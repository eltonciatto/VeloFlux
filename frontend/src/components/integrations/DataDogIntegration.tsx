import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { 
  MonitorIcon, 
  PlayIcon, 
  RefreshCwIcon, 
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  EyeIcon,
  ServerIcon,
  ActivityIcon,
  ClockIcon,
  ZapIcon,
  DatabaseIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DataDogConfig {
  apiKey: string;
  appKey: string;
  site: string;
  service: string;
  env: string;
  version: string;
  logLevel: string;
  enableRUM: boolean;
  enableAPM: boolean;
  enableLogs: boolean;
  enableInfrastructure: boolean;
}

interface ServiceMetric {
  name: string;
  status: 'healthy' | 'warning' | 'critical';
  requests: number;
  latency: number;
  errorRate: number;
  apdex: number;
}

interface InfrastructureMetric {
  host: string;
  cpu: number;
  memory: number;
  disk: number;
  network: number;
  status: 'up' | 'down';
}

const mockPerformanceData = [
  { time: '12:00', requests: 1250, latency: 45, errors: 2, cpu: 65, memory: 78 },
  { time: '12:05', requests: 1340, latency: 38, errors: 1, cpu: 72, memory: 82 },
  { time: '12:10', requests: 1180, latency: 52, errors: 4, cpu: 58, memory: 75 },
  { time: '12:15', requests: 1450, latency: 41, errors: 0, cpu: 68, memory: 80 },
  { time: '12:20', requests: 1620, latency: 47, errors: 3, cpu: 75, memory: 85 },
  { time: '12:25', requests: 1380, latency: 35, errors: 1, cpu: 63, memory: 77 },
  { time: '12:30', requests: 1720, latency: 44, errors: 2, cpu: 70, memory: 83 }
];

const mockServiceMetrics: ServiceMetric[] = [
  {
    name: 'veloflux-lb',
    status: 'healthy',
    requests: 125000,
    latency: 42,
    errorRate: 0.12,
    apdex: 0.95
  },
  {
    name: 'backend-api',
    status: 'warning',
    requests: 89000,
    latency: 85,
    errorRate: 0.34,
    apdex: 0.87
  },
  {
    name: 'auth-service',
    status: 'healthy',
    requests: 45000,
    latency: 28,
    errorRate: 0.05,
    apdex: 0.98
  }
];

const mockInfrastructure: InfrastructureMetric[] = [
  {
    host: 'lb-primary',
    cpu: 68,
    memory: 75,
    disk: 45,
    network: 120,
    status: 'up'
  },
  {
    host: 'backend-1',
    cpu: 82,
    memory: 90,
    disk: 67,
    network: 95,
    status: 'up'
  },
  {
    host: 'backend-2',
    cpu: 45,
    memory: 65,
    disk: 32,
    network: 78,
    status: 'up'
  }
];

const errorTypeData = [
  { name: '4xx Client Errors', value: 65, color: '#f59e0b' },
  { name: '5xx Server Errors', value: 25, color: '#ef4444' },
  { name: 'Timeout Errors', value: 10, color: '#8b5cf6' }
];

export const DataDogIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DataDogConfig>({
    apiKey: '***********ab123',
    appKey: '***********cd456',
    site: 'datadoghq.com',
    service: 'veloflux-lb',
    env: 'production',
    version: '1.0.0',
    logLevel: 'info',
    enableRUM: true,
    enableAPM: true,
    enableLogs: true,
    enableInfrastructure: true
  });
  
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);

  const testConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    setIsConnected(true);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': case 'up': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'critical': case 'down': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getApdexColor = (apdex: number) => {
    if (apdex >= 0.9) return 'text-green-600';
    if (apdex >= 0.7) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <MonitorIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integração DataDog</h2>
              <p className="text-gray-600 mt-1">
                Monitoramento completo de infraestrutura e APM
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
            Abrir DataDog
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="apm">APM</TabsTrigger>
          <TabsTrigger value="infrastructure">Infraestrutura</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="rum">RUM</TabsTrigger>
          <TabsTrigger value="config">Configuração</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Requisições/min</p>
                    <p className="text-2xl font-bold">1,720</p>
                    <p className="text-xs text-green-600">+8.5% vs 1h atrás</p>
                  </div>
                  <ActivityIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Latência Média</p>
                    <p className="text-2xl font-bold">44ms</p>
                    <p className="text-xs text-green-600">-3ms vs 1h atrás</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Erro</p>
                    <p className="text-2xl font-bold">0.12%</p>
                    <p className="text-xs text-green-600">-0.03% vs 1h atrás</p>
                  </div>
                  <AlertTriangleIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Apdex Score</p>
                    <p className="text-2xl font-bold text-green-600">0.95</p>
                    <p className="text-xs text-green-600">Excelente</p>
                  </div>
                  <ZapIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance da Aplicação</CardTitle>
                <CardDescription>Requisições e latência nos últimos 30 minutos</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis yAxisId="requests" orientation="left" />
                    <YAxis yAxisId="latency" orientation="right" />
                    <Tooltip />
                    <Line yAxisId="requests" type="monotone" dataKey="requests" stroke="#3b82f6" name="Requisições" />
                    <Line yAxisId="latency" type="monotone" dataKey="latency" stroke="#10b981" name="Latência (ms)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilização de Recursos</CardTitle>
                <CardDescription>CPU e memória dos hosts</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={mockPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="time" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="cpu" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.7} name="CPU %" />
                    <Area type="monotone" dataKey="memory" stackId="2" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.7} name="Memória %" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Error Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Erros</CardTitle>
              <CardDescription>Tipos de erros nas últimas 24 horas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorTypeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={120}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {errorTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {errorTypeData.map((entry, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                    <span className="text-sm">{entry.name}: {entry.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* APM Tab */}
        <TabsContent value="apm" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Services APM</CardTitle>
              <CardDescription>Performance dos serviços monitorados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockServiceMetrics.map((service, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded">
                        <ServerIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{service.name}</h4>
                        <Badge className={getStatusColor(service.status)}>
                          {service.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Requisições</p>
                        <p className="font-bold">{service.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Latência</p>
                        <p className="font-bold">{service.latency}ms</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Taxa de Erro</p>
                        <p className="font-bold">{service.errorRate}%</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Apdex</p>
                        <p className={`font-bold ${getApdexColor(service.apdex)}`}>
                          {service.apdex}
                        </p>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Hosts Monitorados</CardTitle>
              <CardDescription>Status e métricas dos hosts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockInfrastructure.map((host, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded">
                        <ServerIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-semibold">{host.host}</h4>
                        <Badge className={getStatusColor(host.status)}>
                          {host.status}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-8">
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">CPU</p>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${host.cpu > 80 ? 'bg-red-500' : host.cpu > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${host.cpu}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium mt-1">{host.cpu}%</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Memória</p>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${host.memory > 85 ? 'bg-red-500' : host.memory > 70 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${host.memory}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium mt-1">{host.memory}%</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Disco</p>
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${host.disk > 80 ? 'bg-red-500' : host.disk > 60 ? 'bg-yellow-500' : 'bg-green-500'}`}
                            style={{ width: `${host.disk}%` }}
                          />
                        </div>
                        <p className="text-xs font-medium mt-1">{host.disk}%</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600 mb-1">Rede</p>
                        <p className="font-bold">{host.network} MB/s</p>
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <EyeIcon className="w-4 h-4 mr-2" />
                      Detalhes
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Logs Tab */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Logs Recentes</CardTitle>
              <CardDescription>Últimos logs coletados</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 font-mono text-sm bg-gray-900 text-green-400 p-4 rounded-lg max-h-96 overflow-y-auto">
                <div className="flex gap-4">
                  <span className="text-gray-500">2024-06-19 12:30:45</span>
                  <span className="text-blue-400">[INFO]</span>
                  <span>Request processed successfully - GET /api/health - 200 - 15ms</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500">2024-06-19 12:30:44</span>
                  <span className="text-yellow-400">[WARN]</span>
                  <span>Backend response time elevated - backend-2:8081 - 150ms</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500">2024-06-19 12:30:43</span>
                  <span className="text-blue-400">[INFO]</span>
                  <span>Load balancer routing decision - selected backend-1 based on least connections</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500">2024-06-19 12:30:42</span>
                  <span className="text-red-400">[ERROR]</span>
                  <span>Backend health check failed - backend-3:8081 - Connection refused</span>
                </div>
                <div className="flex gap-4">
                  <span className="text-gray-500">2024-06-19 12:30:41</span>
                  <span className="text-blue-400">[INFO]</span>
                  <span>SSL certificate renewal completed - *.veloflux.io - Valid until 2025-06-19</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RUM Tab */}
        <TabsContent value="rum" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Page Views</p>
                    <p className="text-2xl font-bold">45,230</p>
                    <p className="text-xs text-green-600">+12% vs ontem</p>
                  </div>
                  <EyeIcon className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Load Time</p>
                    <p className="text-2xl font-bold">1.2s</p>
                    <p className="text-xs text-yellow-600">+0.1s vs ontem</p>
                  </div>
                  <ClockIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">JS Errors</p>
                    <p className="text-2xl font-bold">12</p>
                    <p className="text-xs text-red-600">+3 vs ontem</p>
                  </div>
                  <AlertTriangleIcon className="w-8 h-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Performance do Browser</CardTitle>
              <CardDescription>Métricas de experiência do usuário</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-4 border rounded">
                    <p className="text-sm text-gray-600">First Contentful Paint</p>
                    <p className="text-xl font-bold">0.8s</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full w-3/4" />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded">
                    <p className="text-sm text-gray-600">Largest Contentful Paint</p>
                    <p className="text-xl font-bold">1.2s</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-yellow-500 h-2 rounded-full w-2/3" />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded">
                    <p className="text-sm text-gray-600">Cumulative Layout Shift</p>
                    <p className="text-xl font-bold">0.05</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full w-full" />
                    </div>
                  </div>
                  
                  <div className="p-4 border rounded">
                    <p className="text-sm text-gray-600">First Input Delay</p>
                    <p className="text-xl font-bold">45ms</p>
                    <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                      <div className="bg-green-500 h-2 rounded-full w-5/6" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do DataDog</CardTitle>
              <CardDescription>Configure as credenciais e parâmetros do DataDog</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    type="password"
                    value={config.apiKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="appKey">Application Key</Label>
                  <Input
                    id="appKey"
                    type="password"
                    value={config.appKey}
                    onChange={(e) => setConfig(prev => ({ ...prev, appKey: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="site">Site DataDog</Label>
                  <Select value={config.site} onValueChange={(value) => setConfig(prev => ({ ...prev, site: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="datadoghq.com">datadoghq.com (US)</SelectItem>
                      <SelectItem value="datadoghq.eu">datadoghq.eu (EU)</SelectItem>
                      <SelectItem value="ddog-gov.com">ddog-gov.com (US Gov)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="service">Nome do Serviço</Label>
                  <Input
                    id="service"
                    value={config.service}
                    onChange={(e) => setConfig(prev => ({ ...prev, service: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="env">Ambiente</Label>
                  <Select value={config.env} onValueChange={(value) => setConfig(prev => ({ ...prev, env: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="production">Production</SelectItem>
                      <SelectItem value="staging">Staging</SelectItem>
                      <SelectItem value="development">Development</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="version">Versão</Label>
                  <Input
                    id="version"
                    value={config.version}
                    onChange={(e) => setConfig(prev => ({ ...prev, version: e.target.value }))}
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Recursos Habilitados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAPM">Application Performance Monitoring (APM)</Label>
                    <Switch
                      id="enableAPM"
                      checked={config.enableAPM}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAPM: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableRUM">Real User Monitoring (RUM)</Label>
                    <Switch
                      id="enableRUM"
                      checked={config.enableRUM}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableRUM: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableLogs">Log Management</Label>
                    <Switch
                      id="enableLogs"
                      checked={config.enableLogs}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableLogs: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableInfrastructure">Infrastructure Monitoring</Label>
                    <Switch
                      id="enableInfrastructure"
                      checked={config.enableInfrastructure}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableInfrastructure: checked }))}
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

export default DataDogIntegration;
