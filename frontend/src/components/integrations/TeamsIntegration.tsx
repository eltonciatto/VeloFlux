import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircleIcon, 
  BellIcon, 
  RefreshCwIcon, 
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  SendIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  InfoIcon,
  XCircleIcon,
  PhoneIcon,
  VideoIcon,
  CalendarIcon,
  FileIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TeamsConfig {
  tenantId: string;
  clientId: string;
  clientSecret: string;
  webhookUrl: string;
  defaultTeam: string;
  alertChannel: string;
  incidentChannel: string;
  enableAlerts: boolean;
  enableNotifications: boolean;
  enableAdaptiveCards: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface TeamsChannel {
  id: string;
  name: string;
  team: string;
  purpose: string;
  memberCount: number;
  isPrivate: boolean;
  lastActivity: string;
}

interface TeamsMessage {
  id: string;
  channel: string;
  team: string;
  user: string;
  text: string;
  timestamp: string;
  type: 'alert' | 'notification' | 'adaptive-card' | 'manual';
  status: 'sent' | 'delivered' | 'failed';
  hasActions: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  channel: string;
  team: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  useAdaptiveCard: boolean;
}

const mockTeams = [
  { id: 'team1', name: 'VeloFlux DevOps' },
  { id: 'team2', name: 'VeloFlux Engineering' },
  { id: 'team3', name: 'VeloFlux Operations' }
];

const mockChannels: TeamsChannel[] = [
  {
    id: 'CH123456',
    name: 'VeloFlux Alerts',
    team: 'VeloFlux DevOps',
    purpose: 'Alertas do sistema VeloFlux',
    memberCount: 15,
    isPrivate: false,
    lastActivity: '2 min atrás'
  },
  {
    id: 'CH234567',
    name: 'Incident Response',
    team: 'VeloFlux Operations',
    purpose: 'Resposta a incidentes críticos',
    memberCount: 8,
    isPrivate: true,
    lastActivity: '1 hora atrás'
  },
  {
    id: 'CH345678',
    name: 'General',
    team: 'VeloFlux Engineering',
    purpose: 'Canal geral da equipe',
    memberCount: 32,
    isPrivate: false,
    lastActivity: '5 min atrás'
  }
];

const mockMessages: TeamsMessage[] = [
  {
    id: '1',
    channel: 'VeloFlux Alerts',
    team: 'VeloFlux DevOps',
    user: 'VeloFlux Bot',
    text: '🟡 **Response Time Alert**\n\nService: backend-api\nCurrent: 85ms (threshold: 80ms)\nDuration: 5 minutes\n\n[View Dashboard] [Acknowledge]',
    timestamp: '12:30',
    type: 'adaptive-card',
    status: 'delivered',
    hasActions: true
  },
  {
    id: '2',
    channel: 'VeloFlux Alerts',
    team: 'VeloFlux DevOps',
    user: 'VeloFlux Bot',
    text: '🟢 **Issue Resolved**\n\nService: backend-api\nResponse time: 42ms (normal)\nResolved by: Auto-scaling',
    timestamp: '12:35',
    type: 'notification',
    status: 'delivered',
    hasActions: false
  },
  {
    id: '3',
    channel: 'General',
    team: 'VeloFlux Engineering',
    user: 'VeloFlux Bot',
    text: '📊 **Daily Report**\n\n✅ 125k requests processed\n✅ 99.88% uptime\n⚠️ 3 minor alerts\n\n[View Full Report]',
    timestamp: '09:00',
    type: 'adaptive-card',
    status: 'delivered',
    hasActions: true
  }
];

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'High Error Rate',
    condition: 'error_rate > threshold',
    threshold: 0.5,
    channel: 'VeloFlux Alerts',
    team: 'VeloFlux DevOps',
    enabled: true,
    severity: 'high',
    useAdaptiveCard: true
  },
  {
    id: '2',
    name: 'Slow Response Time',
    condition: 'response_time > threshold',
    threshold: 100,
    channel: 'VeloFlux Alerts',
    team: 'VeloFlux DevOps',
    enabled: true,
    severity: 'medium',
    useAdaptiveCard: true
  },
  {
    id: '3',
    name: 'Critical System Alert',
    condition: 'cpu_usage > threshold',
    threshold: 90,
    channel: 'Incident Response',
    team: 'VeloFlux Operations',
    enabled: true,
    severity: 'critical',
    useAdaptiveCard: true
  }
];

export const TeamsIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<TeamsConfig>({
    tenantId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientId: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
    clientSecret: '***********',
    webhookUrl: 'https://outlook.office.com/webhook/***',
    defaultTeam: 'VeloFlux DevOps',
    alertChannel: 'VeloFlux Alerts',
    incidentChannel: 'Incident Response',
    enableAlerts: true,
    enableNotifications: true,
    enableAdaptiveCards: true,
    alertThresholds: {
      errorRate: 0.5,
      responseTime: 100,
      cpuUsage: 80,
      memoryUsage: 85
    }
  });
  
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Teste de integração VeloFlux com Microsoft Teams 🚀');
  const [selectedChannel, setSelectedChannel] = useState('VeloFlux Alerts');
  const [useAdaptiveCard, setUseAdaptiveCard] = useState(true);

  const testConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    setIsConnected(true);
  };

  const sendTestMessage = async () => {
    console.log(`Enviando mensagem para ${selectedChannel}:`, testMessage);
    // Aqui seria a integração real com Microsoft Graph API
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangleIcon className="w-4 h-4 text-yellow-500" />;
      case 'notification': return <InfoIcon className="w-4 h-4 text-blue-500" />;
      case 'adaptive-card': return <FileIcon className="w-4 h-4 text-purple-500" />;
      case 'manual': return <SendIcon className="w-4 h-4 text-green-500" />;
      default: return <MessageCircleIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered': return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
      case 'sent': return <ClockIcon className="w-4 h-4 text-yellow-500" />;
      case 'failed': return <XCircleIcon className="w-4 h-4 text-red-500" />;
      default: return <ClockIcon className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MessageCircleIcon className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integração Microsoft Teams</h2>
              <p className="text-gray-600 mt-1">
                Alertas e notificações automáticas no Teams
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
            Abrir Teams
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="messages">Mensagens</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
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
                    <p className="text-sm font-medium text-gray-600">Mensagens Enviadas</p>
                    <p className="text-2xl font-bold">892</p>
                    <p className="text-xs text-green-600">+8% vs ontem</p>
                  </div>
                  <SendIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Adaptive Cards</p>
                    <p className="text-2xl font-bold">234</p>
                    <p className="text-xs text-blue-600">26% do total</p>
                  </div>
                  <FileIcon className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                    <p className="text-2xl font-bold">99.9%</p>
                    <p className="text-xs text-green-600">Excelente</p>
                  </div>
                  <CheckCircleIcon className="w-8 h-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Teams Ativos</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-blue-600">12 canais total</p>
                  </div>
                  <UsersIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas mensagens enviadas para o Teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div key={message.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getMessageTypeIcon(message.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{message.channel}</span>
                        <span className="text-sm text-gray-500">em {message.team}</span>
                        <span className="text-sm text-gray-500">{message.timestamp}</span>
                        {getStatusIcon(message.status)}
                        {message.hasActions && (
                          <Badge variant="outline" className="text-xs">Com ações</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{message.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Test Message */}
          <Card>
            <CardHeader>
              <CardTitle>Testar Mensagem</CardTitle>
              <CardDescription>Envie uma mensagem de teste para um canal do Teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="testChannel">Canal</Label>
                  <Select value={selectedChannel} onValueChange={setSelectedChannel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {mockChannels.map((channel) => (
                        <SelectItem key={channel.id} value={channel.name}>
                          {channel.name} ({channel.team})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="useAdaptiveCard"
                    checked={useAdaptiveCard}
                    onCheckedChange={setUseAdaptiveCard}
                  />
                  <Label htmlFor="useAdaptiveCard">Usar Adaptive Card</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="testMessage">Mensagem</Label>
                <Textarea
                  id="testMessage"
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  placeholder="Digite sua mensagem de teste..."
                  rows={3}
                />
              </div>
              
              <Button onClick={sendTestMessage}>
                <SendIcon className="w-4 h-4 mr-2" />
                Enviar Teste
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Teams e Canais</CardTitle>
              <CardDescription>Teams e canais integrados ao VeloFlux</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {mockTeams.map((team) => (
                  <div key={team.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded">
                          <UsersIcon className="w-5 h-5 text-blue-600" />
                        </div>
                        <h4 className="font-semibold text-lg">{team.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          Reunião
                        </Button>
                        <Button variant="outline" size="sm">
                          <VideoIcon className="w-4 h-4 mr-2" />
                          Chamada
                        </Button>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {mockChannels.filter(channel => channel.team === team.name).map((channel) => (
                        <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                          <div className="flex items-center gap-3">
                            <div className="p-1 bg-white rounded">
                              <MessageCircleIcon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{channel.name}</span>
                                {channel.isPrivate && (
                                  <Badge variant="outline" className="text-xs">Privado</Badge>
                                )}
                              </div>
                              <p className="text-sm text-gray-600">{channel.purpose}</p>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <UsersIcon className="w-4 h-4" />
                              {channel.memberCount}
                            </div>
                            <div className="flex items-center gap-1">
                              <ClockIcon className="w-4 h-4" />
                              {channel.lastActivity}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Mensagens</CardTitle>
              <CardDescription>Todas as mensagens enviadas pelo VeloFlux</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockMessages.map((message) => (
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        {getMessageTypeIcon(message.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{message.channel}</span>
                            <span className="text-sm text-gray-500">em {message.team}</span>
                            <Badge variant="outline" className="text-xs">
                              {message.type}
                            </Badge>
                            {message.hasActions && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Interativo
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{message.timestamp}</span>
                            {getStatusIcon(message.status)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-l-blue-500">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{message.text}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Regras de Alerta</CardTitle>
              <CardDescription>Configure quando e como enviar alertas para o Teams</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockAlertRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <div>
                        <h4 className="font-semibold">{rule.name}</h4>
                        <p className="text-sm text-gray-600">{rule.condition}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Limite</p>
                        <p className="font-bold">{rule.threshold}{rule.name.includes('Rate') ? '%' : rule.name.includes('Time') ? 'ms' : '%'}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Canal</p>
                        <p className="font-medium">{rule.channel}</p>
                        <p className="text-xs text-gray-500">{rule.team}</p>
                      </div>
                      
                      <div className="text-center">
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        {rule.useAdaptiveCard && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Adaptive Card
                            </Badge>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Editar
                    </Button>
                  </div>
                ))}
              </div>
              
              <Separator />
              
              <Button>
                <BellIcon className="w-4 h-4 mr-2" />
                Adicionar Regra
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configuration Tab */}
        <TabsContent value="config" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do Microsoft Teams</CardTitle>
              <CardDescription>Configure as credenciais e parâmetros do Teams</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tenantId">Tenant ID</Label>
                  <Input
                    id="tenantId"
                    value={config.tenantId}
                    onChange={(e) => setConfig(prev => ({ ...prev, tenantId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientSecret">Client Secret</Label>
                  <Input
                    id="clientSecret"
                    type="password"
                    value={config.clientSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientSecret: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://outlook.office.com/webhook/..."
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Teams e Canais Padrão</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultTeam">Team Padrão</Label>
                    <Select value={config.defaultTeam} onValueChange={(value) => setConfig(prev => ({ ...prev, defaultTeam: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockTeams.map((team) => (
                          <SelectItem key={team.id} value={team.name}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="alertChannel">Canal de Alertas</Label>
                    <Select value={config.alertChannel} onValueChange={(value) => setConfig(prev => ({ ...prev, alertChannel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.name}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="incidentChannel">Canal de Incidentes</Label>
                    <Select value={config.incidentChannel} onValueChange={(value) => setConfig(prev => ({ ...prev, incidentChannel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.name}>
                            {channel.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Recursos Habilitados</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAlerts">Alertas Automáticos</Label>
                    <Switch
                      id="enableAlerts"
                      checked={config.enableAlerts}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAlerts: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableNotifications">Notificações</Label>
                    <Switch
                      id="enableNotifications"
                      checked={config.enableNotifications}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableNotifications: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableAdaptiveCards">Adaptive Cards</Label>
                    <Switch
                      id="enableAdaptiveCards"
                      checked={config.enableAdaptiveCards}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableAdaptiveCards: checked }))}
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Limites de Alerta</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="errorRate">Taxa de Erro (%)</Label>
                    <Input
                      id="errorRate"
                      type="number"
                      step="0.1"
                      value={config.alertThresholds.errorRate}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        alertThresholds: { 
                          ...prev.alertThresholds, 
                          errorRate: parseFloat(e.target.value) 
                        } 
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="responseTime">Tempo de Resposta (ms)</Label>
                    <Input
                      id="responseTime"
                      type="number"
                      value={config.alertThresholds.responseTime}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        alertThresholds: { 
                          ...prev.alertThresholds, 
                          responseTime: parseInt(e.target.value) 
                        } 
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="cpuUsage">Uso de CPU (%)</Label>
                    <Input
                      id="cpuUsage"
                      type="number"
                      value={config.alertThresholds.cpuUsage}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        alertThresholds: { 
                          ...prev.alertThresholds, 
                          cpuUsage: parseInt(e.target.value) 
                        } 
                      }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="memoryUsage">Uso de Memória (%)</Label>
                    <Input
                      id="memoryUsage"
                      type="number"
                      value={config.alertThresholds.memoryUsage}
                      onChange={(e) => setConfig(prev => ({ 
                        ...prev, 
                        alertThresholds: { 
                          ...prev.alertThresholds, 
                          memoryUsage: parseInt(e.target.value) 
                        } 
                      }))}
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
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
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

export default TeamsIntegration;
