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
  MessageSquareIcon, 
  BellIcon, 
  RefreshCwIcon, 
  SettingsIcon,
  CheckCircleIcon,
  AlertTriangleIcon,
  ExternalLinkIcon,
  SendIcon,
  HashIcon,
  UsersIcon,
  ClockIcon,
  TrendingUpIcon,
  AlertCircleIcon,
  InfoIcon,
  XCircleIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SlackConfig {
  botToken: string;
  signingSecret: string;
  appToken: string;
  defaultChannel: string;
  alertChannel: string;
  incidentChannel: string;
  enableAlerts: boolean;
  enableNotifications: boolean;
  enableCommands: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface SlackChannel {
  id: string;
  name: string;
  purpose: string;
  memberCount: number;
  isPrivate: boolean;
  lastActivity: string;
}

interface SlackMessage {
  id: string;
  channel: string;
  user: string;
  text: string;
  timestamp: string;
  type: 'alert' | 'notification' | 'command' | 'manual';
  status: 'sent' | 'delivered' | 'failed';
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  channel: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const mockChannels: SlackChannel[] = [
  {
    id: 'C123456',
    name: 'veloflux-alerts',
    purpose: 'Alertas do sistema VeloFlux',
    memberCount: 15,
    isPrivate: false,
    lastActivity: '2 min atrás'
  },
  {
    id: 'C234567',
    name: 'veloflux-incidents',
    purpose: 'Incidentes e problemas críticos',
    memberCount: 8,
    isPrivate: true,
    lastActivity: '1 hora atrás'
  },
  {
    id: 'C345678',
    name: 'veloflux-general',
    purpose: 'Canal geral do VeloFlux',
    memberCount: 32,
    isPrivate: false,
    lastActivity: '5 min atrás'
  }
];

const mockMessages: SlackMessage[] = [
  {
    id: '1',
    channel: 'veloflux-alerts',
    user: 'VeloFlux Bot',
    text: '🟡 **Warning**: Response time elevated to 85ms (threshold: 80ms)\nService: backend-api\nDuration: 5 minutes',
    timestamp: '12:30',
    type: 'alert',
    status: 'delivered'
  },
  {
    id: '2',
    channel: 'veloflux-alerts',
    user: 'VeloFlux Bot',
    text: '🟢 **Resolved**: Response time back to normal (42ms)\nService: backend-api',
    timestamp: '12:35',
    type: 'alert',
    status: 'delivered'
  },
  {
    id: '3',
    channel: 'veloflux-general',
    user: 'VeloFlux Bot',
    text: '📊 Daily report: 125k requests processed, 99.88% uptime',
    timestamp: '09:00',
    type: 'notification',
    status: 'delivered'
  }
];

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'High Error Rate',
    condition: 'error_rate > threshold',
    threshold: 0.5,
    channel: 'veloflux-alerts',
    enabled: true,
    severity: 'high'
  },
  {
    id: '2',
    name: 'Slow Response Time',
    condition: 'response_time > threshold',
    threshold: 100,
    channel: 'veloflux-alerts',
    enabled: true,
    severity: 'medium'
  },
  {
    id: '3',
    name: 'High CPU Usage',
    condition: 'cpu_usage > threshold',
    threshold: 80,
    channel: 'veloflux-incidents',
    enabled: true,
    severity: 'critical'
  }
];

export const SlackIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<SlackConfig>({
    botToken: 'xoxb-***********',
    signingSecret: '***********',
    appToken: 'xapp-***********',
    defaultChannel: 'veloflux-general',
    alertChannel: 'veloflux-alerts',
    incidentChannel: 'veloflux-incidents',
    enableAlerts: true,
    enableNotifications: true,
    enableCommands: true,
    alertThresholds: {
      errorRate: 0.5,
      responseTime: 100,
      cpuUsage: 80,
      memoryUsage: 85
    }
  });
  
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Teste de integração VeloFlux 🚀');
  const [selectedChannel, setSelectedChannel] = useState('veloflux-general');

  const testConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    setIsConnected(true);
  };

  const sendTestMessage = async () => {
    console.log(`Enviando mensagem para #${selectedChannel}:`, testMessage);
    // Aqui seria a integração real com Slack API
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
      case 'command': return <MessageSquareIcon className="w-4 h-4 text-purple-500" />;
      case 'manual': return <SendIcon className="w-4 h-4 text-green-500" />;
      default: return <MessageSquareIcon className="w-4 h-4 text-gray-500" />;
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
            <div className="p-2 bg-purple-100 rounded-lg">
              <MessageSquareIcon className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integração Slack</h2>
              <p className="text-gray-600 mt-1">
                Alertas e notificações automáticas no Slack
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
            Abrir Slack
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="channels">Canais</TabsTrigger>
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
                    <p className="text-2xl font-bold">1,247</p>
                    <p className="text-xs text-green-600">+12% vs ontem</p>
                  </div>
                  <SendIcon className="w-8 h-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Alertas Ativos</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-yellow-600">2 críticos</p>
                  </div>
                  <BellIcon className="w-8 h-8 text-yellow-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                    <p className="text-2xl font-bold">99.8%</p>
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
                    <p className="text-sm font-medium text-gray-600">Canais Ativos</p>
                    <p className="text-2xl font-bold">3</p>
                    <p className="text-xs text-blue-600">55 membros total</p>
                  </div>
                  <HashIcon className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas mensagens enviadas</CardDescription>
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
                        <span className="font-medium">#{message.channel}</span>
                        <span className="text-sm text-gray-500">por {message.user}</span>
                        <span className="text-sm text-gray-500">{message.timestamp}</span>
                        {getStatusIcon(message.status)}
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
              <CardDescription>Envie uma mensagem de teste para um canal</CardDescription>
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
                          #{channel.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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

        {/* Channels Tab */}
        <TabsContent value="channels" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Canais Configurados</CardTitle>
              <CardDescription>Canais do Slack integrados ao VeloFlux</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded">
                        <HashIcon className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">#{channel.name}</h4>
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
                    
                    <Button variant="outline" size="sm">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
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
                  <div key={message.id} className="flex items-start gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0">
                      {getMessageTypeIcon(message.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">#{message.channel}</span>
                          <Badge variant="outline" className="text-xs">
                            {message.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-500">{message.timestamp}</span>
                          {getStatusIcon(message.status)}
                        </div>
                      </div>
                      <p className="text-sm text-gray-700 whitespace-pre-line">{message.text}</p>
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
              <CardDescription>Configure quando e como enviar alertas</CardDescription>
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
                    
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Limite</p>
                        <p className="font-bold">{rule.threshold}{rule.name.includes('Rate') ? '%' : rule.name.includes('Time') ? 'ms' : '%'}</p>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Canal</p>
                        <p className="font-medium">#{rule.channel}</p>
                      </div>
                      
                      <Badge className={getSeverityColor(rule.severity)}>
                        {rule.severity}
                      </Badge>
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
              <CardTitle>Configuração do Slack</CardTitle>
              <CardDescription>Configure as credenciais e parâmetros do Slack</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="botToken">Bot Token</Label>
                  <Input
                    id="botToken"
                    type="password"
                    value={config.botToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, botToken: e.target.value }))}
                    placeholder="xoxb-your-bot-token"
                  />
                </div>
                
                <div>
                  <Label htmlFor="signingSecret">Signing Secret</Label>
                  <Input
                    id="signingSecret"
                    type="password"
                    value={config.signingSecret}
                    onChange={(e) => setConfig(prev => ({ ...prev, signingSecret: e.target.value }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="appToken">App Token</Label>
                  <Input
                    id="appToken"
                    type="password"
                    value={config.appToken}
                    onChange={(e) => setConfig(prev => ({ ...prev, appToken: e.target.value }))}
                    placeholder="xapp-your-app-token"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold mb-4">Canais Padrão</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="defaultChannel">Canal Geral</Label>
                    <Select value={config.defaultChannel} onValueChange={(value) => setConfig(prev => ({ ...prev, defaultChannel: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {mockChannels.map((channel) => (
                          <SelectItem key={channel.id} value={channel.name}>
                            #{channel.name}
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
                            #{channel.name}
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
                            #{channel.name}
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
                    <Label htmlFor="enableCommands">Comandos Slash</Label>
                    <Switch
                      id="enableCommands"
                      checked={config.enableCommands}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableCommands: checked }))}
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

export default SlackIntegration;
