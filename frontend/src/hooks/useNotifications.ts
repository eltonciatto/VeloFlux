import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Types
interface ExtendedWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

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
  metadata?: Record<string, unknown>;
  actions?: NotificationAction[];
}

interface NotificationAction {
  id: string;
  label: string;
  type: 'primary' | 'secondary' | 'danger';
  handler: () => void;
}

interface NotificationFilter {
  type?: string[];
  category?: string[];
  priority?: string[];
  read?: boolean;
  archived?: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
}

interface NotificationSettings {
  enabled: boolean;
  sound: boolean;
  desktop: boolean;
  email: boolean;
  categories: Record<string, boolean>;
  priorities: Record<string, boolean>;
  quiet_hours: {
    enabled: boolean;
    start: string;
    end: string;
  };
}

interface UseNotificationsHook {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  settings: NotificationSettings;
  currentFilter: NotificationFilter;
  
  // Notification management
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  archiveNotification: (id: string) => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  
  // Filtering
  setFilter: (filter: NotificationFilter) => void;
  clearFilter: () => void;
  getFilteredNotifications: () => Notification[];
  
  // Settings
  updateSettings: (settings: Partial<NotificationSettings>) => Promise<void>;
  
  // Real-time updates
  subscribeToUpdates: () => void;
  unsubscribeFromUpdates: () => void;
  
  // Permission management
  requestPermission: () => Promise<boolean>;
  checkPermission: () => boolean;
}

const STORAGE_KEY = 'veloflux_notifications';
const SETTINGS_KEY = 'veloflux_notification_settings';

const defaultSettings: NotificationSettings = {
  enabled: true,
  sound: true,
  desktop: true,
  email: false,
  categories: {
    system: true,
    security: true,
    billing: true,
    performance: true,
    user: true,
    integration: true
  },
  priorities: {
    low: true,
    medium: true,
    high: true,
    critical: true
  },
  quiet_hours: {
    enabled: false,
    start: '22:00',
    end: '08:00'
  }
};

export const useNotifications = (): UseNotificationsHook => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<NotificationSettings>(defaultSettings);
  const [currentFilter, setCurrentFilter] = useState<NotificationFilter>({});
  
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate mock notifications for demo
  const generateMockNotifications = useCallback((): Notification[] => {
    const types = ['alert', 'info', 'warning', 'error', 'success'] as const;
    const categories = ['system', 'security', 'billing', 'performance', 'user', 'integration'] as const;
    const priorities = ['low', 'medium', 'high', 'critical'] as const;
    
    const mockData = [
      {
        type: 'error' as const,
        category: 'system' as const,
        priority: 'critical' as const,
        title: 'System Alert',
        message: 'High CPU usage detected on server cluster'
      },
      {
        type: 'warning' as const,
        category: 'security' as const,
        priority: 'high' as const,
        title: 'Security Warning',
        message: 'Multiple failed login attempts detected'
      },
      {
        type: 'info' as const,
        category: 'billing' as const,
        priority: 'medium' as const,
        title: 'Billing Update',
        message: 'Monthly invoice has been generated'
      },
      {
        type: 'success' as const,
        category: 'performance' as const,
        priority: 'low' as const,
        title: 'Performance Improved',
        message: 'System optimization completed successfully'
      },
      {
        type: 'alert' as const,
        category: 'integration' as const,
        priority: 'medium' as const,
        title: 'Integration Alert',
        message: 'API rate limit approaching threshold'
      }
    ];

    return Array.from({ length: 20 }, (_, i) => {
      const template = mockData[i % mockData.length];
      const now = new Date();
      const timestamp = new Date(now.getTime() - (i * 3600000)).toISOString(); // Spread over hours
      
      return {
        id: `notification_${Date.now()}_${i}`,
        type: template.type,
        category: template.category,
        title: `${template.title} #${i + 1}`,
        message: template.message,
        timestamp,
        read: Math.random() > 0.4, // 60% chance of being read
        archived: Math.random() > 0.8, // 20% chance of being archived
        priority: template.priority,
        metadata: {
          source: 'system',
          severity: template.priority,
          auto_generated: true
        }
      };
    });
  }, []);

  // Load data from localStorage
  useEffect(() => {
    try {
      // Load notifications
      const storedNotifications = localStorage.getItem(STORAGE_KEY);
      if (storedNotifications) {
        setNotifications(JSON.parse(storedNotifications));
      } else {
        // Generate some initial mock notifications
        const mockNotifications = generateMockNotifications();
        setNotifications(mockNotifications);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mockNotifications));
      }
      
      // Load settings
      const storedSettings = localStorage.getItem(SETTINGS_KEY);
      if (storedSettings) {
        setSettings({ ...defaultSettings, ...JSON.parse(storedSettings) });
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
      setError('Failed to load notifications');
    }
  }, [generateMockNotifications]);

  // Save notifications to localStorage
  const saveNotifications = useCallback((updatedNotifications: Notification[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotifications));
      setNotifications(updatedNotifications);
    } catch (err) {
      console.error('Error saving notifications:', err);
      setError('Failed to save notifications');
    }
  }, []);

  // Save settings to localStorage
  const saveSettings = useCallback((updatedSettings: NotificationSettings) => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(updatedSettings));
      setSettings(updatedSettings);
    } catch (err) {
      console.error('Error saving settings:', err);
      setError('Failed to save settings');
    }
  }, []);

  // Computed values
  const unreadCount = notifications.filter(n => !n.read && !n.archived).length;

  // Notification management functions
  const addNotification = useCallback((notificationData: Omit<Notification, 'id' | 'timestamp' | 'read' | 'archived'>) => {
    const newNotification: Notification = {
      ...notificationData,
      id: `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      read: false,
      archived: false
    };

    const updatedNotifications = [newNotification, ...notifications];
    saveNotifications(updatedNotifications);

    // Show browser notification if enabled and permission granted
    if (settings.desktop && checkPermission()) {
      showBrowserNotification(newNotification);
    }

    // Show toast notification
    if (settings.enabled) {
      const variant = notificationData.type === 'error' ? 'destructive' : 'default';
      toast({
        title: newNotification.title,
        description: newNotification.message,
        variant
      });
    }

    // Play sound if enabled
    if (settings.sound) {
      playNotificationSound(notificationData.priority);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notifications, settings, saveNotifications, toast]);

  const markAsRead = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, read: true } : n
      );
      saveNotifications(updatedNotifications);
    } catch (err) {
      setError('Failed to mark notification as read');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications, saveNotifications]);

  const markAllAsRead = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNotifications = notifications.map(n => ({ ...n, read: true }));
      saveNotifications(updatedNotifications);
    } catch (err) {
      setError('Failed to mark all notifications as read');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications, saveNotifications]);

  const archiveNotification = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNotifications = notifications.map(n =>
        n.id === id ? { ...n, archived: true, read: true } : n
      );
      saveNotifications(updatedNotifications);
    } catch (err) {
      setError('Failed to archive notification');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications, saveNotifications]);

  const deleteNotification = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedNotifications = notifications.filter(n => n.id !== id);
      saveNotifications(updatedNotifications);
    } catch (err) {
      setError('Failed to delete notification');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [notifications, saveNotifications]);

  const clearAll = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      saveNotifications([]);
    } catch (err) {
      setError('Failed to clear notifications');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [saveNotifications]);

  // Filtering functions
  const setFilter = useCallback((filter: NotificationFilter) => {
    setCurrentFilter(filter);
  }, []);

  const clearFilter = useCallback(() => {
    setCurrentFilter({});
  }, []);

  const getFilteredNotifications = useCallback((): Notification[] => {
    let filtered = notifications;

    // Filter by type
    if (currentFilter.type && currentFilter.type.length > 0) {
      filtered = filtered.filter(n => currentFilter.type!.includes(n.type));
    }

    // Filter by category
    if (currentFilter.category && currentFilter.category.length > 0) {
      filtered = filtered.filter(n => currentFilter.category!.includes(n.category));
    }

    // Filter by priority
    if (currentFilter.priority && currentFilter.priority.length > 0) {
      filtered = filtered.filter(n => currentFilter.priority!.includes(n.priority));
    }

    // Filter by read status
    if (currentFilter.read !== undefined) {
      filtered = filtered.filter(n => n.read === currentFilter.read);
    }

    // Filter by archived status
    if (currentFilter.archived !== undefined) {
      filtered = filtered.filter(n => n.archived === currentFilter.archived);
    }

    // Filter by date range
    if (currentFilter.dateRange) {
      const start = new Date(currentFilter.dateRange.start);
      const end = new Date(currentFilter.dateRange.end);
      filtered = filtered.filter(n => {
        const date = new Date(n.timestamp);
        return date >= start && date <= end;
      });
    }

    return filtered;
  }, [notifications, currentFilter]);

  // Settings management
  const updateSettings = useCallback(async (newSettings: Partial<NotificationSettings>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedSettings = { ...settings, ...newSettings };
      saveSettings(updatedSettings);
    } catch (err) {
      setError('Failed to update settings');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [settings, saveSettings]);

  // Browser notification helpers
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const checkPermission = useCallback((): boolean => {
    return 'Notification' in window && Notification.permission === 'granted';
  }, []);

  const showBrowserNotification = useCallback((notification: Notification) => {
    if (!checkPermission()) return;

    new Notification(notification.title, {
      body: notification.message,
      icon: '/favicon.ico',
      tag: notification.id
    });
  }, [checkPermission]);

  const playNotificationSound = useCallback((priority: string) => {
    // Simple beep sound based on priority
    const context = new (window.AudioContext || (window as ExtendedWindow).webkitAudioContext)();
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(context.destination);

    // Different frequencies for different priorities
    const frequency = priority === 'critical' ? 800 :
                     priority === 'high' ? 600 :
                     priority === 'medium' ? 400 : 300;

    oscillator.frequency.setValueAtTime(frequency, context.currentTime);
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.1, context.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);

    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }, []);

  // Real-time updates
  const subscribeToUpdates = useCallback(() => {
    // Mock WebSocket connection for demo
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Simulate receiving notifications every 30 seconds
    intervalRef.current = setInterval(() => {
      if (Math.random() > 0.7) { // 30% chance of new notification
        const types = ['alert', 'info', 'warning', 'error', 'success'] as const;
        const categories = ['system', 'security', 'billing', 'performance', 'user', 'integration'] as const;
        const priorities = ['low', 'medium', 'high', 'critical'] as const;

        addNotification({
          type: types[Math.floor(Math.random() * types.length)],
          category: categories[Math.floor(Math.random() * categories.length)],
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          title: `Real-time Alert ${Date.now()}`,
          message: 'This is a real-time notification from the system.'
        });
      }
    }, 30000);
  }, [addNotification]);

  const unsubscribeFromUpdates = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      unsubscribeFromUpdates();
    };
  }, [unsubscribeFromUpdates]);

  return {
    // State
    notifications,
    unreadCount,
    isLoading,
    error,
    settings,
    currentFilter,
    
    // Notification management
    addNotification,
    markAsRead,
    markAllAsRead,
    archiveNotification,
    deleteNotification,
    clearAll,
    
    // Filtering
    setFilter,
    clearFilter,
    getFilteredNotifications,
    
    // Settings
    updateSettings,
    
    // Real-time updates
    subscribeToUpdates,
    unsubscribeFromUpdates,
    
    // Permission management
    requestPermission,
    checkPermission
  };
};
