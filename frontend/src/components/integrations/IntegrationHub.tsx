import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
  PlugIcon, 
  SettingsIcon, 
  CheckCircleIcon, 
  XCircleIcon, 
  AlertTriangleIcon,
  ExternalLinkIcon,
  PlayIcon,
  PauseIcon,
  RefreshCwIcon,
  PlusIcon,
  MonitorIcon,
  BellIcon,
  BarChartIcon,
  MessageSquareIcon,
  WebhookIcon,
  CloudIcon,
  ActivityIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PrometheusIntegration } from './PrometheusIntegration';
import { DataDogIntegration } from './DataDogIntegration';
import { SlackIntegration } from './SlackIntegration';
import { TeamsIntegration } from './TeamsIntegration';
import { DiscordIntegration } from './DiscordIntegration';

interface Integration {
  id: string;
  name: string;
  description: string;
  category: 'monitoring' | 'notifications' | 'analytics' | 'storage' | 'security';
  status: 'connected' | 'disconnected' | 'error' | 'configuring';
  isEnabled: boolean;
  icon: React.ReactNode;
  config?: {
    [key: string]: any;
  };
  metrics?: {
    eventsToday: number;
    lastSync: string;
    responseTime: number;
  };
  features: string[];
  setupCompleted: boolean;
}

const mockIntegrations: Integration[] = [
  {
    id: 'prometheus',
    name: 'Prometheus',
    description: 'Coleta e monitoramento de métricas em tempo real',
    category: 'monitoring',
    status: 'connected',
    isEnabled: true,
    icon: <BarChartIcon className="w-6 h-6" />,
    config: {
      endpoint: 'http://prometheus:9090',
      scrapeInterval: '15s',
      retentionTime: '30d'
    },
    metrics: {
      eventsToday: 125000,
      lastSync: '2024-06-19T12:00:00Z',
      responseTime: 45
    },
    features: ['Métricas customizadas', 'Alertas', 'Dashboards', 'PromQL'],
    setupCompleted: true
  },
  {
    id: 'datadog',
    name: 'DataDog',
    description: 'Monitoramento de infraestrutura e APM',
    category: 'monitoring',
    status: 'connected',
    isEnabled: true,
    icon: <MonitorIcon className="w-6 h-6" />,
    config: {
      apiKey: '***********ab123',
      site: 'datadoghq.com',
      service: 'veloflux-lb'
    },
    metrics: {
      eventsToday: 89000,
      lastSync: '2024-06-19T12:05:00Z',
      responseTime: 120
    },
    features: ['APM', 'Logs', 'Infraestrutura', 'Alertas'],
    setupCompleted: true
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Notificações e alertas via Slack',
    category: 'notifications',
    status: 'connected',
    isEnabled: true,
    icon: <MessageSquareIcon className="w-6 h-6" />,
    config: {
      webhookUrl: 'https://hooks.slack.com/services/***',
      channel: '#veloflux-alerts',
      username: 'VeloFlux Bot'
    },
    metrics: {
      eventsToday: 45,
      lastSync: '2024-06-19T11:58:00Z',
      responseTime: 200
    },
    features: ['Alertas críticos', 'Relatórios', 'Comandos', 'Interações'],
    setupCompleted: true
  },
  {
    id: 'teams',
    name: 'Microsoft Teams',
    description: 'Notificações via Microsoft Teams',
    category: 'notifications',
    status: 'disconnected',
    isEnabled: false,
    icon: <MessageSquareIcon className="w-6 h-6" />,
    features: ['Alertas', 'Relatórios', 'Cards adaptativos'],
    setupCompleted: false
  },
  {
    id: 'discord',
    name: 'Discord',
    description: 'Notificações via Discord webhooks',
    category: 'notifications',
    status: 'configuring',
    isEnabled: false,
    icon: <MessageSquareIcon className="w-6 h-6" />,
    features: ['Webhooks', 'Embeds', 'Alertas'],
    setupCompleted: false
  },
  {
    id: 'webhook',
    name: 'Custom Webhooks',
    description: 'Webhooks customizados para integrações',
    category: 'notifications',
    status: 'connected',
    isEnabled: true,
    icon: <WebhookIcon className="w-6 h-6" />,
    config: {
      endpoints: ['https://api.example.com/webhook'],
      retryAttempts: 3,
      timeout: 30
    },
    metrics: {
      eventsToday: 230,
      lastSync: '2024-06-19T12:02:00Z',
      responseTime: 150
    },
    features: ['HTTP POST', 'Retry logic', 'Templates', 'Autenticação'],
    setupCompleted: true
  }
];

export const IntegrationHub: React.FC = () => {
  const { t } = useTranslation();
  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null);

  const toggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(integration => 
      integration.id === id 
        ? { ...integration, isEnabled: !integration.isEnabled }
        : integration
    ));
  };

  const getStatusIcon = (status: Integration['status']) => {
    switch (status) {
      case 'connected':
        return <CheckCircleIcon className="w-5 h-5 text-green-500" />;
      case 'disconnected':
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
      case 'error':
        return <AlertTriangleIcon className="w-5 h-5 text-red-500" />;
      case 'configuring':
        return <RefreshCwIcon className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <XCircleIcon className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: Integration['status']) => {
    switch (status) {
      case 'connected': return 'bg-green-100 text-green-800';
      case 'disconnected': return 'bg-gray-100 text-gray-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'configuring': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryIcon = (category: Integration['category']) => {
    switch (category) {
      case 'monitoring': return <BarChartIcon className="w-4 h-4" />;
      case 'notifications': return <BellIcon className="w-4 h-4" />;
      case 'analytics': return <ActivityIcon className="w-4 h-4" />;
      case 'storage': return <CloudIcon className="w-4 h-4" />;
      case 'security': return <AlertTriangleIcon className="w-4 h-4" />;
      default: return <PlugIcon className="w-4 h-4" />;
    }
  };

  const filteredIntegrations = integrations.filter(integration => {
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         integration.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = [
    { id: 'all', label: 'Todas', count: integrations.length },
    { id: 'monitoring', label: 'Monitoramento', count: integrations.filter(i => i.category === 'monitoring').length },
    { id: 'notifications', label: 'Notificações', count: integrations.filter(i => i.category === 'notifications').length },
    { id: 'analytics', label: 'Analytics', count: integrations.filter(i => i.category === 'analytics').length },
    { id: 'storage', label: 'Armazenamento', count: integrations.filter(i => i.category === 'storage').length },
    { id: 'security', label: 'Segurança', count: integrations.filter(i => i.category === 'security').length }
  ];

  const connectedCount = integrations.filter(i => i.status === 'connected').length;
  const enabledCount = integrations.filter(i => i.isEnabled).length;

  const renderIntegrationView = () => {
    switch (selectedIntegration) {
      case 'prometheus':
        return <PrometheusIntegration />;
      case 'datadog':
        return <DataDogIntegration />;
      case 'slack':
        return <SlackIntegration />;
      case 'teams':
        return <TeamsIntegration />;
      case 'discord':
        return <DiscordIntegration />;
      default:
        return null;
    }
  };

  if (selectedIntegration) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => setSelectedIntegration(null)}
          >
            ← Voltar ao Hub
          </Button>
          <div className="h-6 w-px bg-gray-300" />
          <h2 className="text-xl font-semibold">
            {integrations.find(i => i.id === selectedIntegration)?.name}
          </h2>
        </div>
        {renderIntegrationView()}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hub de Integrações</h2>
          <p className="text-gray-600 mt-1">
            Gerencie todas as integrações externas do VeloFlux
          </p>
        </div>
        
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" />
          Nova Integração
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total</p>
                <p className="text-2xl font-bold">{integrations.length}</p>
              </div>
              <PlugIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Conectadas</p>
                <p className="text-2xl font-bold text-green-600">{connectedCount}</p>
              </div>
              <CheckCircleIcon className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ativas</p>
                <p className="text-2xl font-bold text-blue-600">{enabledCount}</p>
              </div>
              <PlayIcon className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Eventos Hoje</p>
                <p className="text-2xl font-bold">
                  {integrations.reduce((sum, i) => sum + (i.metrics?.eventsToday || 0), 0).toLocaleString()}
                </p>
              </div>
              <ActivityIcon className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <div className="flex justify-between items-center">
          <TabsList>
            {categories.map(category => (
              <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                {category.id !== 'all' && getCategoryIcon(category.id as Integration['category'])}
                {category.label}
                <Badge variant="secondary" className="ml-1">
                  {category.count}
                </Badge>
              </TabsTrigger>
            ))}
          </TabsList>
          
          <div className="flex items-center gap-4">
            <Input
              placeholder="Buscar integrações..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64"
            />
          </div>
        </div>

        <TabsContent value={selectedCategory} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIntegrations.map(integration => (
              <Card key={integration.id} className="relative">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {integration.icon}
                      </div>
                      <div>
                        <CardTitle className="text-lg">{integration.name}</CardTitle>
                        <CardDescription className="text-sm">
                          {integration.description}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {getStatusIcon(integration.status)}
                      <Switch
                        checked={integration.isEnabled}
                        onCheckedChange={() => toggleIntegration(integration.id)}
                        disabled={!integration.setupCompleted}
                      />
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Badge className={getStatusColor(integration.status)}>
                      {integration.status}
                    </Badge>
                    <Badge variant="outline">
                      {integration.category}
                    </Badge>
                    {!integration.setupCompleted && (
                      <Badge variant="destructive">
                        Setup Pendente
                      </Badge>
                    )}
                  </div>

                  {integration.metrics && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Eventos hoje:</span>
                          <span className="font-medium">
                            {integration.metrics.eventsToday.toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Última sincronização:</span>
                          <span className="font-medium">
                            {new Date(integration.metrics.lastSync).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Tempo de resposta:</span>
                          <span className="font-medium">
                            {integration.metrics.responseTime}ms
                          </span>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Recursos:</p>
                    <div className="flex flex-wrap gap-1">
                      {integration.features.map(feature => (
                        <Badge key={feature} variant="outline" className="text-xs">
                          {feature}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="flex-1"
                      onClick={() => setSelectedIntegration(integration.id)}
                    >
                      <SettingsIcon className="w-4 h-4 mr-1" />
                      Configurar
                    </Button>
                    {integration.status === 'connected' && (
                      <Button size="sm" variant="outline">
                        <ExternalLinkIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredIntegrations.length === 0 && (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <PlugIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-lg font-medium mb-2">Nenhuma integração encontrada</p>
                  <p>Tente ajustar os filtros ou adicionar uma nova integração</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default IntegrationHub;
