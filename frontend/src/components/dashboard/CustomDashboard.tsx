import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useCustomDashboard } from '@/hooks/useCustomDashboard';
import { useTranslation } from 'react-i18next';
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Settings,
  Grid,
  Layout,
  Download,
  Upload,
  Eye,
  EyeOff,
  Copy,
  Share,
  Calendar,
  Filter,
  MoreVertical,
  GripVertical,
  Globe
} from 'lucide-react';
import MetricWidget from './MetricWidget';

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
  config: {
    unit?: string;
    threshold?: number;
    color?: string;
    chartType?: 'line' | 'bar' | 'area';
    showLegend?: boolean;
    [key: string]: unknown;
  };
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

const CustomDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const {
    dashboards,
    currentDashboard,
    isLoading,
    isEditing,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setCurrentDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    duplicateDashboard,
    exportDashboard,
    importDashboard,
    toggleEditMode,
    saveLayout
  } = useCustomDashboard();

  const [selectedDashboard, setSelectedDashboard] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newDashboard, setNewDashboard] = useState({
    name: '',
    description: '',
    is_public: false
  });

  // Widget creation state
  const [showWidgetForm, setShowWidgetForm] = useState(false);
  const [newWidget, setNewWidget] = useState<Partial<WidgetConfig>>({
    type: 'metric',
    title: '',
    data_source: 'metrics',
    query: '',
    refresh_interval: 30,
    size: 'medium'
  });

  useEffect(() => {
    if (dashboards.length > 0 && !selectedDashboard) {
      setSelectedDashboard(dashboards[0].id);
      setCurrentDashboard(dashboards[0].id);
    }
  }, [dashboards, selectedDashboard, setCurrentDashboard]);

  // Dashboard management
  const handleCreateDashboard = async () => {
    try {
      const dashboard = await createDashboard(newDashboard);
      setNewDashboard({ name: '', description: '', is_public: false });
      setShowCreateForm(false);
      setSelectedDashboard(dashboard.id);
      toast({
        title: t('dashboard.success'),
        description: t('dashboard.created_successfully'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.creation_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleDeleteDashboard = async (dashboardId: string) => {
    if (dashboards.length <= 1) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.cannot_delete_last'),
        variant: 'destructive'
      });
      return;
    }

    try {
      await deleteDashboard(dashboardId);
      if (selectedDashboard === dashboardId) {
        const remaining = dashboards.filter(d => d.id !== dashboardId);
        if (remaining.length > 0) {
          setSelectedDashboard(remaining[0].id);
          setCurrentDashboard(remaining[0].id);
        }
      }
      toast({
        title: t('dashboard.success'),
        description: t('dashboard.deleted_successfully'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.deletion_failed'),
        variant: 'destructive'
      });
    }
  };

  // Widget management
  const handleAddWidget = async () => {
    if (!currentDashboard || !newWidget.title || !newWidget.query) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.widget_fields_required'),
        variant: 'destructive'
      });
      return;
    }

    try {
      const widget: WidgetConfig = {
        id: `widget_${Date.now()}`,
        type: newWidget.type || 'metric',
        title: newWidget.title,
        data_source: newWidget.data_source || 'metrics',
        query: newWidget.query,
        refresh_interval: newWidget.refresh_interval || 30,
        size: newWidget.size || 'medium',
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: {}
      };

      await addWidget(currentDashboard.id, widget);
      setNewWidget({
        type: 'metric',
        title: '',
        data_source: 'metrics',
        query: '',
        refresh_interval: 30,
        size: 'medium'
      });
      setShowWidgetForm(false);
      
      toast({
        title: t('dashboard.success'),
        description: t('dashboard.widget_added'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.widget_add_failed'),
        variant: 'destructive'
      });
    }
  };

  const handleExportDashboard = async () => {
    if (!currentDashboard) return;
    
    try {
      const exportData = await exportDashboard(currentDashboard.id);
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dashboard_${currentDashboard.name}_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: t('dashboard.success'),
        description: t('dashboard.exported_successfully'),
        variant: 'default'
      });
    } catch (error) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.export_failed'),
        variant: 'destructive'
      });
    }
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
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {t('dashboard.custom_dashboard')}
          </h2>
          <p className="text-muted-foreground">
            {t('dashboard.custom_dashboard_description')}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {currentDashboard && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleEditMode()}
              >
                {isEditing ? <Save className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
                {isEditing ? t('common.save') : t('common.edit')}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportDashboard}
              >
                <Download className="h-4 w-4" />
                {t('common.export')}
              </Button>
            </>
          )}
          
          <Button
            onClick={() => setShowCreateForm(true)}
            size="sm"
          >
            <Plus className="h-4 w-4" />
            {t('dashboard.create_dashboard')}
          </Button>
        </div>
      </div>

      {/* Dashboard Selector */}
      {dashboards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.select_dashboard')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dashboards.map((dashboard) => (
                <Badge
                  key={dashboard.id}
                  variant={selectedDashboard === dashboard.id ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10 p-2"
                  onClick={() => {
                    setSelectedDashboard(dashboard.id);
                    setCurrentDashboard(dashboard.id);
                  }}
                >
                  <Layout className="h-3 w-3 mr-1" />
                  {dashboard.name}
                  {dashboard.is_public && <Globe className="h-3 w-3 ml-1" />}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard Content */}
      {currentDashboard ? (
        <div className="space-y-6">
          {/* Dashboard Header */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Grid className="h-5 w-5" />
                    {currentDashboard.name}
                    {currentDashboard.is_public && (
                      <Badge variant="secondary">
                        <Globe className="h-3 w-3 mr-1" />
                        {t('common.public')}
                      </Badge>
                    )}
                  </CardTitle>
                  {currentDashboard.description && (
                    <CardDescription>{currentDashboard.description}</CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  {isEditing && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowWidgetForm(true)}
                    >
                      <Plus className="h-4 w-4" />
                      {t('dashboard.add_widget')}
                    </Button>
                  )}
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => duplicateDashboard(currentDashboard.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDashboard(currentDashboard.id)}
                    disabled={dashboards.length <= 1}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Widgets Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentDashboard.widgets.map((widget) => (
              <motion.div
                key={widget.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`
                  ${widget.size === 'small' ? 'col-span-1' : ''}
                  ${widget.size === 'medium' ? 'col-span-2' : ''}
                  ${widget.size === 'large' ? 'col-span-3' : ''}
                `}
              >
                <MetricWidget
                  widget={widget}
                  isEditing={isEditing}
                  onUpdate={(updatedWidget) => updateWidget(currentDashboard.id, updatedWidget)}
                  onRemove={() => removeWidget(currentDashboard.id, widget.id)}
                />
              </motion.div>
            ))}
          </div>

          {currentDashboard.widgets.length === 0 && (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Grid className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {t('dashboard.no_widgets')}
                </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {t('dashboard.no_widgets_description')}
                </p>
                <Button onClick={() => setShowWidgetForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  {t('dashboard.add_first_widget')}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Layout className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {t('dashboard.no_dashboards')}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {t('dashboard.no_dashboards_description')}
            </p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('dashboard.create_first_dashboard')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Dashboard Modal */}
      <AnimatePresence>
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowCreateForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-lg p-6 w-full max-w-md mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">
                {t('dashboard.create_dashboard')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="dashboard-name">{t('common.name')}</Label>
                  <Input
                    id="dashboard-name"
                    value={newDashboard.name}
                    onChange={(e) => setNewDashboard(prev => ({
                      ...prev,
                      name: e.target.value
                    }))}
                    placeholder={t('dashboard.dashboard_name_placeholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="dashboard-description">{t('common.description')}</Label>
                  <Input
                    id="dashboard-description"
                    value={newDashboard.description}
                    onChange={(e) => setNewDashboard(prev => ({
                      ...prev,
                      description: e.target.value
                    }))}
                    placeholder={t('dashboard.dashboard_description_placeholder')}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="dashboard-public"
                    checked={newDashboard.is_public}
                    onCheckedChange={(checked) => setNewDashboard(prev => ({
                      ...prev,
                      is_public: checked
                    }))}
                  />
                  <Label htmlFor="dashboard-public">{t('dashboard.public_dashboard')}</Label>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowCreateForm(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleCreateDashboard}
                  disabled={!newDashboard.name}
                >
                  {t('common.create')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Widget Modal */}
      <AnimatePresence>
        {showWidgetForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setShowWidgetForm(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-background rounded-lg p-6 w-full max-w-lg mx-4"
            >
              <h3 className="text-lg font-semibold mb-4">
                {t('dashboard.add_widget')}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="widget-title">{t('common.title')}</Label>
                  <Input
                    id="widget-title"
                    value={newWidget.title}
                    onChange={(e) => setNewWidget(prev => ({
                      ...prev,
                      title: e.target.value
                    }))}
                    placeholder={t('dashboard.widget_title_placeholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="widget-type">{t('dashboard.widget_type')}</Label>
                  <Select
                    value={newWidget.type}
                    onValueChange={(value) => setNewWidget(prev => ({
                      ...prev,
                      type: value as 'metric' | 'chart' | 'table' | 'gauge' | 'heatmap'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="metric">{t('dashboard.metric')}</SelectItem>
                      <SelectItem value="chart">{t('dashboard.chart')}</SelectItem>
                      <SelectItem value="table">{t('dashboard.table')}</SelectItem>
                      <SelectItem value="gauge">{t('dashboard.gauge')}</SelectItem>
                      <SelectItem value="heatmap">{t('dashboard.heatmap')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label htmlFor="widget-query">{t('dashboard.query')}</Label>
                  <Input
                    id="widget-query"
                    value={newWidget.query}
                    onChange={(e) => setNewWidget(prev => ({
                      ...prev,
                      query: e.target.value
                    }))}
                    placeholder={t('dashboard.query_placeholder')}
                  />
                </div>
                
                <div>
                  <Label htmlFor="widget-size">{t('dashboard.size')}</Label>
                  <Select
                    value={newWidget.size}
                    onValueChange={(value) => setNewWidget(prev => ({
                      ...prev,
                      size: value as 'small' | 'medium' | 'large'
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">{t('dashboard.small')}</SelectItem>
                      <SelectItem value="medium">{t('dashboard.medium')}</SelectItem>
                      <SelectItem value="large">{t('dashboard.large')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowWidgetForm(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button
                  onClick={handleAddWidget}
                  disabled={!newWidget.title || !newWidget.query}
                >
                  {t('dashboard.add_widget')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CustomDashboard;
