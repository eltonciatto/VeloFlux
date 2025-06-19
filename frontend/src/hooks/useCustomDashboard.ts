import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './use-auth';
import { useToast } from './use-toast';

// Types
interface DashboardLayout {
  id: string;
  name: string;
  description?: string;
  is_public: boolean;
  widgets: WidgetConfig[];
  layout: GridLayout[];
  created_at: string;
  updated_at: string;
  user_id: string;
}

interface WidgetConfig {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap';
  title: string;
  data_source: string;
  query: string;
  refresh_interval: number;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
}

interface GridLayout {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
  maxW?: number;
  maxH?: number;
}

interface CustomDashboardHook {
  dashboards: DashboardLayout[];
  currentDashboard: DashboardLayout | null;
  isLoading: boolean;
  isEditing: boolean;
  error: string | null;
  
  // Dashboard management
  createDashboard: (dashboard: Partial<DashboardLayout>) => Promise<DashboardLayout>;
  updateDashboard: (id: string, updates: Partial<DashboardLayout>) => Promise<DashboardLayout>;
  deleteDashboard: (id: string) => Promise<void>;
  duplicateDashboard: (id: string) => Promise<DashboardLayout>;
  setCurrentDashboard: (id: string) => void;
  
  // Widget management
  addWidget: (dashboardId: string, widget: WidgetConfig) => Promise<void>;
  updateWidget: (dashboardId: string, widget: WidgetConfig) => Promise<void>;
  removeWidget: (dashboardId: string, widgetId: string) => Promise<void>;
  
  // Layout management
  saveLayout: (dashboardId: string, layout: GridLayout[]) => Promise<void>;
  toggleEditMode: () => void;
  
  // Import/Export
  exportDashboard: (id: string) => Promise<any>;
  importDashboard: (data: any) => Promise<DashboardLayout>;
  
  // Sharing
  shareDashboard: (id: string, users: string[]) => Promise<void>;
  getDashboardPermissions: (id: string) => Promise<any>;
}

const STORAGE_KEY = 'veloflux_dashboards';

export const useCustomDashboard = (): CustomDashboardHook => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [dashboards, setDashboards] = useState<DashboardLayout[]>([]);
  const [currentDashboard, setCurrentDashboardState] = useState<DashboardLayout | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize dashboards from localStorage
  useEffect(() => {
    const loadDashboards = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsedDashboards = JSON.parse(stored);
          setDashboards(parsedDashboards);
          
          // Set first dashboard as current if none selected
          if (parsedDashboards.length > 0 && !currentDashboard) {
            setCurrentDashboardState(parsedDashboards[0]);
          }
        } else {
          // Create default dashboard if none exists
          const defaultDashboard: DashboardLayout = {
            id: `dashboard_${Date.now()}`,
            name: 'Main Dashboard',
            description: 'Default dashboard with system metrics',
            is_public: false,
            widgets: [
              {
                id: `widget_${Date.now()}_1`,
                type: 'metric',
                title: 'Active Connections',
                data_source: 'metrics',
                query: 'sum(rate(http_requests_total[5m]))',
                refresh_interval: 30,
                size: 'medium',
                position: { x: 0, y: 0, w: 6, h: 4 },
                config: { unit: '' }
              },
              {
                id: `widget_${Date.now()}_2`,
                type: 'chart',
                title: 'Response Time Trend',
                data_source: 'metrics',
                query: 'histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))',
                refresh_interval: 60,
                size: 'large',
                position: { x: 6, y: 0, w: 12, h: 6 },
                config: { unit: 'ms' }
              },
              {
                id: `widget_${Date.now()}_3`,
                type: 'gauge',
                title: 'CPU Usage',
                data_source: 'metrics',
                query: '100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)',
                refresh_interval: 15,
                size: 'small',
                position: { x: 0, y: 4, w: 4, h: 4 },
                config: { unit: '%' }
              }
            ],
            layout: [],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            user_id: user?.user_id || 'anonymous'
          };
          
          setDashboards([defaultDashboard]);
          setCurrentDashboardState(defaultDashboard);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([defaultDashboard]));
        }
      } catch (err) {
        console.error('Error loading dashboards:', err);
        setError('Failed to load dashboards');
      }
    };

    loadDashboards();
  }, [user]);

  // Save dashboards to localStorage whenever they change
  const saveDashboards = useCallback((updatedDashboards: DashboardLayout[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedDashboards));
      setDashboards(updatedDashboards);
    } catch (err) {
      console.error('Error saving dashboards:', err);
      setError('Failed to save dashboards');
    }
  }, []);

  // Dashboard management functions
  const createDashboard = useCallback(async (dashboardData: Partial<DashboardLayout>): Promise<DashboardLayout> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const newDashboard: DashboardLayout = {
        id: `dashboard_${Date.now()}`,
        name: dashboardData.name || 'New Dashboard',
        description: dashboardData.description || '',
        is_public: dashboardData.is_public || false,
        widgets: [],
        layout: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user?.user_id || 'anonymous'
      };
      
      const updatedDashboards = [...dashboards, newDashboard];
      saveDashboards(updatedDashboards);
      
      return newDashboard;
    } catch (err) {
      setError('Failed to create dashboard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, user, saveDashboards]);

  const updateDashboard = useCallback(async (id: string, updates: Partial<DashboardLayout>): Promise<DashboardLayout> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDashboards = dashboards.map(dashboard => 
        dashboard.id === id 
          ? { 
              ...dashboard, 
              ...updates, 
              updated_at: new Date().toISOString() 
            }
          : dashboard
      );
      
      saveDashboards(updatedDashboards);
      
      const updatedDashboard = updatedDashboards.find(d => d.id === id);
      if (updatedDashboard && currentDashboard?.id === id) {
        setCurrentDashboardState(updatedDashboard);
      }
      
      return updatedDashboard!;
    } catch (err) {
      setError('Failed to update dashboard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, currentDashboard, saveDashboards]);

  const deleteDashboard = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDashboards = dashboards.filter(dashboard => dashboard.id !== id);
      saveDashboards(updatedDashboards);
      
      if (currentDashboard?.id === id) {
        setCurrentDashboardState(updatedDashboards[0] || null);
      }
    } catch (err) {
      setError('Failed to delete dashboard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, currentDashboard, saveDashboards]);

  const duplicateDashboard = useCallback(async (id: string): Promise<DashboardLayout> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const originalDashboard = dashboards.find(d => d.id === id);
      if (!originalDashboard) {
        throw new Error('Dashboard not found');
      }
      
      const duplicatedDashboard: DashboardLayout = {
        ...originalDashboard,
        id: `dashboard_${Date.now()}`,
        name: `${originalDashboard.name} (Copy)`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        widgets: originalDashboard.widgets.map(widget => ({
          ...widget,
          id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      
      const updatedDashboards = [...dashboards, duplicatedDashboard];
      saveDashboards(updatedDashboards);
      
      return duplicatedDashboard;
    } catch (err) {
      setError('Failed to duplicate dashboard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, saveDashboards]);

  const setCurrentDashboard = useCallback((id: string) => {
    const dashboard = dashboards.find(d => d.id === id);
    if (dashboard) {
      setCurrentDashboardState(dashboard);
    }
  }, [dashboards]);

  // Widget management functions
  const addWidget = useCallback(async (dashboardId: string, widget: WidgetConfig): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDashboards = dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? { 
              ...dashboard, 
              widgets: [...dashboard.widgets, widget],
              updated_at: new Date().toISOString()
            }
          : dashboard
      );
      
      saveDashboards(updatedDashboards);
      
      if (currentDashboard?.id === dashboardId) {
        const updatedDashboard = updatedDashboards.find(d => d.id === dashboardId);
        if (updatedDashboard) {
          setCurrentDashboardState(updatedDashboard);
        }
      }
    } catch (err) {
      setError('Failed to add widget');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, currentDashboard, saveDashboards]);

  const updateWidget = useCallback(async (dashboardId: string, widget: WidgetConfig): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDashboards = dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? { 
              ...dashboard, 
              widgets: dashboard.widgets.map(w => w.id === widget.id ? widget : w),
              updated_at: new Date().toISOString()
            }
          : dashboard
      );
      
      saveDashboards(updatedDashboards);
      
      if (currentDashboard?.id === dashboardId) {
        const updatedDashboard = updatedDashboards.find(d => d.id === dashboardId);
        if (updatedDashboard) {
          setCurrentDashboardState(updatedDashboard);
        }
      }
    } catch (err) {
      setError('Failed to update widget');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, currentDashboard, saveDashboards]);

  const removeWidget = useCallback(async (dashboardId: string, widgetId: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedDashboards = dashboards.map(dashboard => 
        dashboard.id === dashboardId 
          ? { 
              ...dashboard, 
              widgets: dashboard.widgets.filter(w => w.id !== widgetId),
              updated_at: new Date().toISOString()
            }
          : dashboard
      );
      
      saveDashboards(updatedDashboards);
      
      if (currentDashboard?.id === dashboardId) {
        const updatedDashboard = updatedDashboards.find(d => d.id === dashboardId);
        if (updatedDashboard) {
          setCurrentDashboardState(updatedDashboard);
        }
      }
    } catch (err) {
      setError('Failed to remove widget');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, currentDashboard, saveDashboards]);

  // Layout management
  const saveLayout = useCallback(async (dashboardId: string, layout: GridLayout[]): Promise<void> => {
    try {
      await updateDashboard(dashboardId, { layout });
    } catch (err) {
      setError('Failed to save layout');
      throw err;
    }
  }, [updateDashboard]);

  const toggleEditMode = useCallback(() => {
    setIsEditing(prev => !prev);
  }, []);

  // Import/Export functions
  const exportDashboard = useCallback(async (id: string): Promise<any> => {
    const dashboard = dashboards.find(d => d.id === id);
    if (!dashboard) {
      throw new Error('Dashboard not found');
    }
    
    return {
      version: '1.0',
      dashboard: {
        ...dashboard,
        exported_at: new Date().toISOString(),
        exported_by: user?.email || 'anonymous'
      }
    };
  }, [dashboards, user]);

  const importDashboard = useCallback(async (data: any): Promise<DashboardLayout> => {
    setIsLoading(true);
    setError(null);
    
    try {
      if (!data.dashboard) {
        throw new Error('Invalid dashboard format');
      }
      
      const importedDashboard: DashboardLayout = {
        ...data.dashboard,
        id: `dashboard_${Date.now()}`,
        name: `${data.dashboard.name} (Imported)`,
        user_id: user?.user_id || 'anonymous',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        widgets: data.dashboard.widgets.map((widget: any) => ({
          ...widget,
          id: `widget_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }))
      };
      
      const updatedDashboards = [...dashboards, importedDashboard];
      saveDashboards(updatedDashboards);
      
      return importedDashboard;
    } catch (err) {
      setError('Failed to import dashboard');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [dashboards, user, saveDashboards]);

  // Sharing functions (placeholder for future implementation)
  const shareDashboard = useCallback(async (id: string, users: string[]): Promise<void> => {
    // TODO: Implement actual sharing functionality
    console.log(`Sharing dashboard ${id} with users:`, users);
  }, []);

  const getDashboardPermissions = useCallback(async (id: string): Promise<any> => {
    // TODO: Implement actual permissions functionality
    return {
      owner: user?.user_id,
      viewers: [],
      editors: []
    };
  }, [user]);

  return {
    dashboards,
    currentDashboard,
    isLoading,
    isEditing,
    error,
    
    // Dashboard management
    createDashboard,
    updateDashboard,
    deleteDashboard,
    duplicateDashboard,
    setCurrentDashboard,
    
    // Widget management
    addWidget,
    updateWidget,
    removeWidget,
    
    // Layout management
    saveLayout,
    toggleEditMode,
    
    // Import/Export
    exportDashboard,
    importDashboard,
    
    // Sharing
    shareDashboard,
    getDashboardPermissions
  };
};
