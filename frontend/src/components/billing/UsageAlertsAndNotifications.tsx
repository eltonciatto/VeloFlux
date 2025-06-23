// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  Bell, 
  BellRing, 
  Edit, 
  Plus, 
  Trash2,
  Zap,
  TrendingUp,
  Shield
} from 'lucide-react';
import { formatCurrency, formatUsage, UsageAlert, BillingNotification } from '@/lib/billingApi';
import { useUsageAlerts, useUpdateUsageAlert, useBillingNotifications, useMarkNotificationRead } from '@/hooks/useBilling';

interface AlertFormProps {
  alert?: UsageAlert;
  onSubmit: (alert: UsageAlert) => void;
  onCancel: () => void;
}

function AlertForm({ alert, onSubmit, onCancel }: AlertFormProps) {
  const [formData, setFormData] = useState({
    type: alert?.type || 'requests',
    limit: alert?.limit || 1000,
    threshold: alert?.threshold || 80,
    enabled: alert?.enabled ?? true,
    email: alert?.email ?? true,
    sms: alert?.sms ?? false,
    webhook: alert?.webhook ?? false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const usageAlert: UsageAlert = {
      id: alert?.id || crypto.randomUUID(),
      metric: formData.type as keyof import('@/lib/billingApi').UsageMetrics,
      type: formData.type,
      threshold: formData.threshold,
      currentUsage: 0,
      limit: formData.limit,
      triggered: false,
      enabled: formData.enabled,
      email: formData.email,
      sms: formData.sms,
      webhook: formData.webhook,
      timestamp: new Date().toISOString(),
    };
    onSubmit(usageAlert);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="type">Tipo de Uso</Label>
        <Select value={formData.type} onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione o tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="requests">Requisições</SelectItem>
            <SelectItem value="dataTransfer">Transferência de Dados</SelectItem>
            <SelectItem value="aiPredictions">Predições AI</SelectItem>
            <SelectItem value="storage">Armazenamento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="limit">Limite</Label>
        <Input
          id="limit"
          type="number"
          value={formData.limit}
          onChange={(e) => setFormData(prev => ({ ...prev, limit: parseInt(e.target.value) }))}
          placeholder="Ex: 1000"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="threshold">Porcentagem de Alerta (%)</Label>
        <Input
          id="threshold"
          type="number"
          min="1"
          max="100"
          value={formData.threshold}
          onChange={(e) => setFormData(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
          placeholder="Ex: 80"
        />
        <p className="text-xs text-muted-foreground">
          Alerta será ativado quando o uso atingir {formData.threshold}% do limite
        </p>
      </div>

      <div className="space-y-4">
        <Label>Métodos de Notificação</Label>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bell className="h-4 w-4" />
            <Label htmlFor="email">Email</Label>
          </div>
          <Switch
            id="email"
            checked={formData.email}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, email: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <BellRing className="h-4 w-4" />
            <Label htmlFor="sms">SMS</Label>
          </div>
          <Switch
            id="sms"
            checked={formData.sms}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, sms: checked }))}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Zap className="h-4 w-4" />
            <Label htmlFor="webhook">Webhook</Label>
          </div>
          <Switch
            id="webhook"
            checked={formData.webhook}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, webhook: checked }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="enabled">Alerta Ativo</Label>
        <Switch
          id="enabled"
          checked={formData.enabled}
          onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enabled: checked }))}
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {alert ? 'Atualizar' : 'Criar'} Alerta
        </Button>
      </DialogFooter>
    </form>
  );
}

interface AlertCardProps {
  alert: UsageAlert;
  onEdit: (alert: UsageAlert) => void;
  onDelete: (alertId: string) => void;
}

function AlertCard({ alert, onEdit, onDelete }: AlertCardProps) {
  const percentage = (alert.currentUsage / alert.limit) * 100;
  const thresholdReached = percentage >= alert.threshold;
  
  const typeLabels = {
    requests: 'Requisições',
    dataTransfer: 'Transferência',
    aiPredictions: 'Predições AI',
    storage: 'Armazenamento',
  };

  const getStatusColor = () => {
    if (!alert.enabled) return 'bg-gray-100 text-gray-800';
    if (alert.triggered) return 'bg-red-100 text-red-800';
    if (thresholdReached) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };

  const getStatusText = () => {
    if (!alert.enabled) return 'Desativado';
    if (alert.triggered) return 'Ativado';
    if (thresholdReached) return 'Próximo';
    return 'Normal';
  };

  return (
    <Card className={`${alert.triggered ? 'border-red-500' : thresholdReached ? 'border-yellow-500' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center space-x-2">
          <AlertTriangle className={`h-4 w-4 ${alert.triggered ? 'text-red-500' : thresholdReached ? 'text-yellow-500' : 'text-green-500'}`} />
          <CardTitle className="text-sm font-medium">
            {typeLabels[alert.type as keyof typeof typeLabels]}
          </CardTitle>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={getStatusColor()}>
            {getStatusText()}
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => onEdit(alert)}>
            <Edit className="h-3 w-3" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(alert.id)}>
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Uso atual:</span>
            <span className="font-medium">
              {formatUsage(alert.currentUsage, alert.metric)} ({percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Limite:</span>
            <span>{formatUsage(alert.limit, alert.metric)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Alerta em:</span>
            <span>{alert.threshold}% do limite</span>
          </div>
          
          {alert.message && (
            <p className="text-xs text-muted-foreground mt-2 p-2 bg-gray-50 rounded">
              {alert.message}
            </p>
          )}

          <div className="flex space-x-1 mt-2">
            {alert.email && (
              <Badge variant="outline" className="text-xs">
                <Bell className="h-2 w-2 mr-1" />
                Email
              </Badge>
            )}
            {alert.sms && (
              <Badge variant="outline" className="text-xs">
                <BellRing className="h-2 w-2 mr-1" />
                SMS
              </Badge>
            )}
            {alert.webhook && (
              <Badge variant="outline" className="text-xs">
                <Zap className="h-2 w-2 mr-1" />
                Webhook
              </Badge>
            )}
          </div>

          {alert.lastTriggered && (
            <p className="text-xs text-muted-foreground">
              Último acionamento: {new Date(alert.lastTriggered).toLocaleString()}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    read: boolean;
    priority: string;
  };
  onMarkAsRead: (id: string) => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800',
  };

  const typeIcons = {
    usage_alert: AlertTriangle,
    billing: Shield,
    system: Bell,
  };

  const Icon = typeIcons[notification.type as keyof typeof typeIcons] || Bell;

  return (
    <Card className={`${!notification.read ? 'border-blue-500 bg-blue-50' : ''}`}>
      <CardHeader className="flex flex-row items-start space-y-0 pb-2">
        <div className="flex items-start space-x-3 flex-1">
          <Icon className="h-4 w-4 mt-0.5" />
          <div className="flex-1">
            <CardTitle className="text-sm font-medium">{notification.title}</CardTitle>
            <CardDescription className="text-xs">
              {new Date(notification.timestamp).toLocaleString()}
            </CardDescription>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Badge className={priorityColors[notification.priority as keyof typeof priorityColors]}>
            {notification.priority}
          </Badge>
          {!notification.read && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(notification.id)}
              className="text-xs"
            >
              Marcar como lida
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm">{notification.message}</p>
      </CardContent>
    </Card>
  );
}

export default function UsageAlertsAndNotifications() {
  const { data: alerts, refetch: refetchAlerts } = useUsageAlerts();
  const { data: notifications } = useBillingNotifications();
  const updateAlert = useUpdateUsageAlert();
  const markAsRead = useMarkNotificationRead();
  
  const [editingAlert, setEditingAlert] = useState<UsageAlert | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const handleCreateAlert = async (alertData: UsageAlert) => {
    try {
      await updateAlert.mutateAsync(alertData);
      setShowCreateForm(false);
      refetchAlerts();
    } catch (error) {
      console.error('Failed to create alert:', error);
    }
  };

  const handleUpdateAlert = async (alertData: UsageAlert) => {
    try {
      await updateAlert.mutateAsync({ ...alertData, id: editingAlert.id });
      setEditingAlert(null);
      refetchAlerts();
    } catch (error) {
      console.error('Failed to update alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    // Implementation would depend on having a delete endpoint
    console.log('Delete alert:', alertId);
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const unreadNotifications = notifications?.filter(n => !n.read) || [];
  const activeAlerts = alerts?.filter(a => a.enabled && a.triggered) || [];

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Alertas Ativos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeAlerts.length}</div>
            <p className="text-xs text-muted-foreground">
              {alerts?.length || 0} total configurados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notificações</CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadNotifications.length}</div>
            <p className="text-xs text-muted-foreground">
              não lidas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tendência</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+12%</div>
            <p className="text-xs text-muted-foreground">
              alertas este mês
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Alertas de Uso</h3>
          <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Novo Alerta
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Criar Novo Alerta</DialogTitle>
                <DialogDescription>
                  Configure um alerta para monitorar o uso de recursos.
                </DialogDescription>
              </DialogHeader>
              <AlertForm
                onSubmit={handleCreateAlert}
                onCancel={() => setShowCreateForm(false)}
              />
            </DialogContent>
          </Dialog>
        </div>

        {alerts && alerts.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {alerts.map((alert) => (
              <AlertCard
                key={alert.id}
                alert={alert}
                onEdit={setEditingAlert}
                onDelete={handleDeleteAlert}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum alerta configurado
                </h3>
                <p className="text-gray-500 mb-4">
                  Configure alertas para monitorar o uso de recursos e evitar surpresas.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Alerta
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Notifications Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Notificações Recentes</h3>
        
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.slice(0, 10).map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={{
                  ...notification,
                  priority: notification.priority || notification.severity || 'info'
                }}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhuma notificação
                </h3>
                <p className="text-gray-500">
                  Você está em dia! Nenhuma notificação recente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Alert Dialog */}
      <Dialog open={!!editingAlert} onOpenChange={() => setEditingAlert(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Alerta</DialogTitle>
            <DialogDescription>
              Modifique as configurações do alerta.
            </DialogDescription>
          </DialogHeader>
          {editingAlert && (
            <AlertForm
              alert={editingAlert}
              onSubmit={handleUpdateAlert}
              onCancel={() => setEditingAlert(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
