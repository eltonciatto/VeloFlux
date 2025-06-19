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
  HashIcon,
  InfoIcon,
  XCircleIcon,
  MicIcon,
  VideoIcon,
  GamepadIcon,
  ShieldIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface DiscordConfig {
  botToken: string;
  clientId: string;
  guildId: string;
  webhookUrl: string;
  defaultChannel: string;
  alertChannel: string;
  incidentChannel: string;
  enableAlerts: boolean;
  enableNotifications: boolean;
  enableEmbeds: boolean;
  enableSlashCommands: boolean;
  alertThresholds: {
    errorRate: number;
    responseTime: number;
    cpuUsage: number;
    memoryUsage: number;
  };
}

interface DiscordChannel {
  id: string;
  name: string;
  category: string;
  type: 'text' | 'voice' | 'announcement';
  memberCount: number;
  lastActivity: string;
}

interface DiscordMessage {
  id: string;
  channel: string;
  user: string;
  content: string;
  timestamp: string;
  type: 'alert' | 'notification' | 'embed' | 'manual';
  status: 'sent' | 'delivered' | 'failed';
  hasEmbed: boolean;
}

interface AlertRule {
  id: string;
  name: string;
  condition: string;
  threshold: number;
  channel: string;
  enabled: boolean;
  severity: 'low' | 'medium' | 'high' | 'critical';
  useEmbed: boolean;
  mentionRole?: string;
}

const mockChannels: DiscordChannel[] = [
  {
    id: '123456789',
    name: 'veloflux-alerts',
    category: 'Monitoring',
    type: 'text',
    memberCount: 25,
    lastActivity: '2 min atrás'
  },
  {
    id: '234567890',
    name: 'incident-response',
    category: 'Operations',
    type: 'text',
    memberCount: 12,
    lastActivity: '1 hora atrás'
  },
  {
    id: '345678901',
    name: 'general',
    category: 'General',
    type: 'text',
    memberCount: 45,
    lastActivity: '5 min atrás'
  },
  {
    id: '456789012',
    name: 'announcements',
    category: 'General',
    type: 'announcement',
    memberCount: 45,
    lastActivity: '1 dia atrás'
  }
];

const mockMessages: DiscordMessage[] = [
  {
    id: '1',
    channel: 'veloflux-alerts',
    user: 'VeloFlux Bot',
    content: '🔴 **ALERT**: High response time detected\n\n**Service:** backend-api\n**Current:** 95ms (threshold: 80ms)\n**Duration:** 5 minutes\n\n@DevOps please investigate',
    timestamp: '12:30',
    type: 'embed',
    status: 'delivered',
    hasEmbed: true
  },
  {
    id: '2',
    channel: 'veloflux-alerts',
    user: 'VeloFlux Bot',
    content: '🟢 **RESOLVED**: Response time back to normal (42ms)',
    timestamp: '12:35',
    type: 'notification',
    status: 'delivered',
    hasEmbed: false
  },
  {
    id: '3',
    channel: 'general',
    user: 'VeloFlux Bot',
    content: '📊 **Daily Report**\n✅ 125k requests processed\n✅ 99.88% uptime\n⚠️ 3 minor alerts resolved',
    timestamp: '09:00',
    type: 'embed',
    status: 'delivered',
    hasEmbed: true
  }
];

const mockAlertRules: AlertRule[] = [
  {
    id: '1',
    name: 'Critical Error Rate',
    condition: 'error_rate > threshold',
    threshold: 1.0,
    channel: 'incident-response',
    enabled: true,
    severity: 'critical',
    useEmbed: true,
    mentionRole: '@everyone'
  },
  {
    id: '2',
    name: 'High Response Time',
    condition: 'response_time > threshold',
    threshold: 100,
    channel: 'veloflux-alerts',
    enabled: true,
    severity: 'high',
    useEmbed: true,
    mentionRole: '@DevOps'
  },
  {
    id: '3',
    name: 'System Resource Alert',
    condition: 'cpu_usage > threshold',
    threshold: 85,
    channel: 'veloflux-alerts',
    enabled: true,
    severity: 'medium',
    useEmbed: false
  }
];

export const DiscordIntegration: React.FC = () => {
  const { t } = useTranslation();
  const [config, setConfig] = useState<DiscordConfig>({
    botToken: 'MTI***********',
    clientId: '123456789012345678',
    guildId: '987654321098765432',
    webhookUrl: 'https://discord.com/api/webhooks/***',
    defaultChannel: 'general',
    alertChannel: 'veloflux-alerts',
    incidentChannel: 'incident-response',
    enableAlerts: true,
    enableNotifications: true,
    enableEmbeds: true,
    enableSlashCommands: true,
    alertThresholds: {
      errorRate: 0.5,
      responseTime: 100,
      cpuUsage: 80,
      memoryUsage: 85
    }
  });
  
  const [isConnected, setIsConnected] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [testMessage, setTestMessage] = useState('Teste de integração VeloFlux com Discord 🚀');
  const [selectedChannel, setSelectedChannel] = useState('veloflux-alerts');
  const [useEmbed, setUseEmbed] = useState(true);

  const testConnection = async () => {
    setIsTesting(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsTesting(false);
    setIsConnected(true);
  };

  const sendTestMessage = async () => {
    console.log(`Enviando mensagem para #${selectedChannel}:`, testMessage);
    // Aqui seria a integração real com Discord API
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

  const getChannelTypeIcon = (type: string) => {
    switch (type) {
      case 'text': return <HashIcon className="w-4 h-4" />;
      case 'voice': return <MicIcon className="w-4 h-4" />;
      case 'announcement': return <InfoIcon className="w-4 h-4" />;
      default: return <HashIcon className="w-4 h-4" />;
    }
  };

  const getMessageTypeIcon = (type: string) => {
    switch (type) {
      case 'alert': return <AlertTriangleIcon className="w-4 h-4 text-red-500" />;
      case 'notification': return <InfoIcon className="w-4 h-4 text-blue-500" />;
      case 'embed': return <MessageCircleIcon className="w-4 h-4 text-purple-500" />;
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
            <div className="p-2 bg-indigo-100 rounded-lg">
              <GamepadIcon className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Integração Discord</h2>
              <p className="text-gray-600 mt-1">
                Alertas e notificações automáticas no Discord
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
            Abrir Discord
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
                    <p className="text-2xl font-bold">1,342</p>
                    <p className="text-xs text-green-600">+15% vs ontem</p>
                  </div>
                  <SendIcon className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Embeds Ricos</p>
                    <p className="text-2xl font-bold">456</p>
                    <p className="text-xs text-purple-600">34% do total</p>
                  </div>
                  <MessageCircleIcon className="w-8 h-8 text-purple-500" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Taxa de Entrega</p>
                    <p className="text-2xl font-bold">99.7%</p>
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
                    <p className="text-2xl font-bold">4</p>
                    <p className="text-xs text-blue-600">127 membros total</p>
                  </div>
                  <HashIcon className="w-8 h-8 text-indigo-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Atividade Recente</CardTitle>
              <CardDescription>Últimas mensagens enviadas para o Discord</CardDescription>
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
                        {message.hasEmbed && (
                          <Badge variant="outline" className="text-xs">Rich Embed</Badge>
                        )}
                      </div>
                      <div className="bg-gray-50 p-3 rounded border-l-4 border-l-indigo-500">
                        <p className="text-sm text-gray-700 whitespace-pre-line">{message.content}</p>
                      </div>
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
              <CardDescription>Envie uma mensagem de teste para um canal do Discord</CardDescription>
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
                      {mockChannels.filter(c => c.type === 'text' || c.type === 'announcement').map((channel) => (
                        <SelectItem key={channel.id} value={channel.name}>
                          #{channel.name} ({channel.category})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex items-center gap-2">
                  <Switch
                    id="useEmbed"
                    checked={useEmbed}
                    onCheckedChange={setUseEmbed}
                  />
                  <Label htmlFor="useEmbed">Usar Rich Embed</Label>
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
              <CardTitle>Canais do Discord</CardTitle>
              <CardDescription>Canais configurados no servidor Discord</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockChannels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded">
                        {getChannelTypeIcon(channel.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold">#{channel.name}</h4>
                          <Badge variant="outline" className="text-xs">
                            {channel.type}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{channel.category}</p>
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
                  <div key={message.id} className="border rounded-lg p-4">
                    <div className="flex items-start gap-4">
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
                            {message.hasEmbed && (
                              <Badge className="bg-purple-100 text-purple-800 text-xs">
                                Rich Embed
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">{message.timestamp}</span>
                            {getStatusIcon(message.status)}
                          </div>
                        </div>
                        <div className="bg-gray-50 p-3 rounded border-l-4 border-l-indigo-500">
                          <p className="text-sm text-gray-700 whitespace-pre-line">{message.content}</p>
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
              <CardDescription>Configure quando e como enviar alertas para o Discord</CardDescription>
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
                        <p className="font-medium">#{rule.channel}</p>
                        {rule.mentionRole && (
                          <p className="text-xs text-gray-500">{rule.mentionRole}</p>
                        )}
                      </div>
                      
                      <div className="text-center">
                        <Badge className={getSeverityColor(rule.severity)}>
                          {rule.severity}
                        </Badge>
                        {rule.useEmbed && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-xs">
                              Rich Embed
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
              <CardTitle>Configuração do Discord</CardTitle>
              <CardDescription>Configure as credenciais e parâmetros do Discord</CardDescription>
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
                    placeholder="MTI3NjU4NjMyMzQ5MDM4NjAzMw.G_..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="clientId">Client ID</Label>
                  <Input
                    id="clientId"
                    value={config.clientId}
                    onChange={(e) => setConfig(prev => ({ ...prev, clientId: e.target.value }))}
                    placeholder="123456789012345678"
                  />
                </div>
                
                <div>
                  <Label htmlFor="guildId">Guild (Server) ID</Label>
                  <Input
                    id="guildId"
                    value={config.guildId}
                    onChange={(e) => setConfig(prev => ({ ...prev, guildId: e.target.value }))}
                    placeholder="987654321098765432"
                  />
                </div>
                
                <div>
                  <Label htmlFor="webhookUrl">Webhook URL</Label>
                  <Input
                    id="webhookUrl"
                    value={config.webhookUrl}
                    onChange={(e) => setConfig(prev => ({ ...prev, webhookUrl: e.target.value }))}
                    placeholder="https://discord.com/api/webhooks/..."
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
                        {mockChannels.filter(c => c.type === 'text').map((channel) => (
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
                        {mockChannels.filter(c => c.type === 'text').map((channel) => (
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
                        {mockChannels.filter(c => c.type === 'text').map((channel) => (
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    <Label htmlFor="enableEmbeds">Rich Embeds</Label>
                    <Switch
                      id="enableEmbeds"
                      checked={config.enableEmbeds}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableEmbeds: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="enableSlashCommands">Slash Commands</Label>
                    <Switch
                      id="enableSlashCommands"
                      checked={config.enableSlashCommands}
                      onCheckedChange={(checked) => setConfig(prev => ({ ...prev, enableSlashCommands: checked }))}
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

export default DiscordIntegration;
