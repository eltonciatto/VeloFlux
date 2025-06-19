import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import {
  Bell,
  BellOff,
  AlertTriangle,
  CheckCircle,
  Info,
  Zap,
  Clock,
  Filter,
  MoreVertical,
  X,
  Eye,
  EyeOff,
  Archive,
  Settings,
  Trash2,
  AlertCircle,
  Activity,
  Users,
  Server,
  Globe,
  Shield,
  DollarSign,
  BarChart3
} from 'lucide-react';

// Types
interface Notification {
  id: string;
  type: 'alert' | 'info' | 'warning' | 'error' | 'success';
  category: 'system' | 'security' | 'billing' | 'performance' | 'user' | 'integration';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  archived: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  metadata?: Record<string, any>;
  actions?: NotificationAction[];
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: () => void;
}

const NotificationCenter: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
    setFilter,
    currentFilter,
    subscribeToUpdates,
    unsubscribeFromUpdates
  } = useNotifications();

  const [activeTab, setActiveTab] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    // Subscribe to real-time notification updates
    subscribeToUpdates();
    
    return () => {
      unsubscribeFromUpdates();
    };
  }, [subscribeToUpdates, unsubscribeFromUpdates]);

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'system':
        return <Server className="h-4 w-4" />;
      case 'security':
        return <Shield className="h-4 w-4" />;
      case 'billing':
        return <DollarSign className="h-4 w-4" />;
      case 'performance':
        return <BarChart3 className="h-4 w-4" />;
      case 'user':
        return <Users className="h-4 w-4" />;
      case 'integration':
        return <Globe className="h-4 w-4" />;
      default:
        switch (type) {
          case 'error':
            return <AlertCircle className="h-4 w-4 text-red-500" />;
          case 'warning':
            return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
          case 'success':
            return <CheckCircle className="h-4 w-4 text-green-500" />;
          case 'info':
            return <Info className="h-4 w-4 text-blue-500" />;
          default:
            return <Bell className="h-4 w-4" />;
        }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'bg-red-500 text-white';
      case 'high':
        return 'bg-orange-500 text-white';
      case 'medium':
        return 'bg-yellow-500 text-black';
      case 'low':
        return 'bg-gray-500 text-white';
      default:
        return 'bg-gray-500 text-white';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'error':
        return 'border-red-500';
      case 'warning':
        return 'border-yellow-500';
      case 'success':
        return 'border-green-500';
      case 'info':
        return 'border-blue-500';
      default:
        return 'border-gray-300';
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    switch (activeTab) {
      case 'unread':
        return !notification.read;
      case 'alerts':
        return notification.type === 'error' || notification.type === 'warning';
      case 'archived':
        return notification.archived;
      case 'all':
      default:
        return !notification.archived;
    }
  });

  const handleMarkAsRead = async (id: string) => {
    try {
      await markAsRead(id);
    } catch (error) {
      toast({
        title: t('notifications.error'),
        description: t('notifications.mark_read_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast({
        title: t('notifications.success'),
        description: t('notifications.all_marked_read'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('notifications.error'),
        description: t('notifications.mark_all_read_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleArchive = async (id: string) => {
    try {
      await archiveNotification(id);
      toast({
        title: t('notifications.success'),
        description: t('notifications.archived'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('notifications.error'),
        description: t('notifications.archive_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteNotification(id);
      toast({
        title: t('notifications.success'),
        description: t('notifications.deleted'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('notifications.error'),
        description: t('notifications.delete_failed'),
        variant: 'destructive'
      });
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('time.just_now');
    if (diffMins < 60) return t('time.minutes_ago', { count: diffMins });
    if (diffHours < 24) return t('time.hours_ago', { count: diffHours });
    if (diffDays < 7) return t('time.days_ago', { count: diffDays });
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell className="h-8 w-8" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight">
              {t('notifications.notification_center')}
            </h2>
            <p className="text-muted-foreground">
              {t('notifications.center_description')}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="h-4 w-4" />
            {t('common.filter')}
          </Button>
          
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
            >
              <Eye className="h-4 w-4" />
              {t('notifications.mark_all_read')}
            </Button>
          )}
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearAll()}
          >
            <Trash2 className="h-4 w-4" />
            {t('notifications.clear_all')}
          </Button>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notifications.total')}
                </p>
                <p className="text-2xl font-bold">{notifications.length}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notifications.unread')}
                </p>
                <p className="text-2xl font-bold text-blue-600">{unreadCount}</p>
              </div>
              <BellOff className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notifications.alerts')}
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {notifications.filter(n => n.type === 'error' || n.type === 'warning').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t('notifications.archived')}
                </p>
                <p className="text-2xl font-bold text-gray-600">
                  {notifications.filter(n => n.archived).length}
                </p>
              </div>
              <Archive className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">
                {t('notifications.all')}
                <Badge variant="secondary" className="ml-2">
                  {notifications.filter(n => !n.archived).length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="unread">
                {t('notifications.unread')}
                {unreadCount > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {unreadCount}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="alerts">
                {t('notifications.alerts')}
                <Badge variant="destructive" className="ml-2">
                  {notifications.filter(n => n.type === 'error' || n.type === 'warning').length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="archived">
                {t('notifications.archived')}
                <Badge variant="outline" className="ml-2">
                  {notifications.filter(n => n.archived).length}
                </Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        
        <CardContent className="p-0">
          <ScrollArea className="h-[600px]">
            <AnimatePresence>
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <BellOff className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">
                    {t('notifications.no_notifications')}
                  </h3>
                  <p className="text-muted-foreground text-center">
                    {t('notifications.no_notifications_description')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredNotifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -100 }}
                      transition={{ delay: index * 0.05 }}
                      className={`
                        relative border-l-4 ${getTypeColor(notification.type)} 
                        hover:bg-muted/50 transition-colors
                        ${!notification.read ? 'bg-muted/30' : ''}
                      `}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-1">
                              {getNotificationIcon(notification.type, notification.category)}
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`font-medium truncate ${!notification.read ? 'font-semibold' : ''}`}>
                                  {notification.title}
                                </h4>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs ${getPriorityColor(notification.priority)}`}
                                >
                                  {notification.priority}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {notification.category}
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground mb-2">
                                {notification.message}
                              </p>
                              
                              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatTimestamp(notification.timestamp)}
                                </div>
                                {!notification.read && (
                                  <Badge variant="outline" className="text-xs">
                                    {t('notifications.new')}
                                  </Badge>
                                )}
                              </div>

                              {/* Notification Actions */}
                              {notification.actions && notification.actions.length > 0 && (
                                <div className="flex items-center gap-2 mt-3">
                                  {notification.actions.map((action) => (
                                    <Button
                                      key={action.id}
                                      variant={action.type === 'primary' ? 'default' : 
                                              action.type === 'danger' ? 'destructive' : 'outline'}
                                      size="sm"
                                      onClick={action.handler}
                                    >
                                      {action.label}
                                    </Button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Action buttons */}
                          <div className="flex items-center gap-1">
                            {!notification.read && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleMarkAsRead(notification.id)}
                              >
                                <Eye className="h-3 w-3" />
                              </Button>
                            )}
                            
                            {!notification.archived && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleArchive(notification.id)}
                              >
                                <Archive className="h-3 w-3" />
                              </Button>
                            )}
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      
                      {index < filteredNotifications.length - 1 && (
                        <Separator />
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotificationCenter;
