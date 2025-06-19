import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Gauge,
  Table,
  Flame,
  Zap,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Edit,
  Trash2,
  RefreshCw,
  MoreVertical,
  Maximize2,
  Settings
} from 'lucide-react';
import {
  LineChart as RechartsLineChart,
  BarChart as RechartsBarChart,
  PieChart as RechartsPieChart,
  AreaChart as RechartsAreaChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
  Bar,
  Area,
  Cell,
  Pie
} from 'recharts';

// Types
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

interface MetricWidgetProps {
  widget: WidgetConfig;
  isEditing: boolean;
  onUpdate: (widget: WidgetConfig) => void;
  onRemove: () => void;
}

interface MetricData {
  value: number;
  previous_value?: number;
  unit?: string;
  trend?: 'up' | 'down' | 'stable';
  change_percent?: number;
  status?: 'success' | 'warning' | 'error' | 'info';
  timestamp: string;
}

interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

const MetricWidget: React.FC<MetricWidgetProps> = ({
  widget,
  isEditing,
  onUpdate,
  onRemove
}) => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [data, setData] = useState<MetricData | ChartData | any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Simulate data fetching
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Generate mock data based on widget type
      let mockData;
      
      switch (widget.type) {
        case 'metric':
          const value = Math.floor(Math.random() * 1000) + 100;
          const previousValue = Math.floor(Math.random() * 1000) + 100;
          const changePercent = ((value - previousValue) / previousValue) * 100;
          
          mockData = {
            value,
            previous_value: previousValue,
            unit: widget.config.unit || '',
            trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
            change_percent: Math.abs(changePercent),
            status: changePercent > 10 ? 'success' : changePercent < -10 ? 'error' : 'info',
            timestamp: new Date().toISOString()
          };
          break;
          
        case 'chart':
          const points = 12;
          const labels = Array.from({ length: points }, (_, i) => {
            const date = new Date();
            date.setHours(date.getHours() - (points - 1 - i));
            return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
          });
          
          mockData = {
            labels,
            datasets: [
              {
                label: widget.title,
                data: Array.from({ length: points }, () => Math.floor(Math.random() * 100) + 20),
                color: COLORS[0]
              }
            ]
          };
          break;
          
        case 'gauge':
          mockData = {
            value: Math.floor(Math.random() * 100),
            max: 100,
            min: 0,
            unit: widget.config.unit || '%',
            thresholds: {
              warning: 70,
              critical: 90
            }
          };
          break;
          
        case 'table':
          mockData = {
            headers: ['Metric', 'Value', 'Status', 'Last Update'],
            rows: Array.from({ length: 5 }, (_, i) => [
              `Metric ${i + 1}`,
              `${Math.floor(Math.random() * 1000)}`,
              Math.random() > 0.5 ? 'Active' : 'Inactive',
              new Date().toLocaleTimeString('pt-BR')
            ])
          };
          break;
          
        default:
          mockData = { value: 0 };
      }
      
      setData(mockData);
      setLastRefresh(new Date());
    } catch (err) {
      setError(t('dashboard.fetch_error'));
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.widget_fetch_failed'),
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [widget, t, toast]);

  useEffect(() => {
    fetchData();
    
    // Set up auto-refresh
    const interval = setInterval(fetchData, widget.refresh_interval * 1000);
    return () => clearInterval(interval);
  }, [fetchData, widget.refresh_interval]);

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'success':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'error':
        return 'text-red-500';
      default:
        return 'text-blue-500';
    }
  };

  const renderWidgetIcon = () => {
    switch (widget.type) {
      case 'metric':
        return <Activity className="h-4 w-4" />;
      case 'chart':
        return <LineChart className="h-4 w-4" />;
      case 'gauge':
        return <Gauge className="h-4 w-4" />;
      case 'table':
        return <Table className="h-4 w-4" />;
      case 'heatmap':
        return <Flame className="h-4 w-4" />;
      default:
        return <BarChart3 className="h-4 w-4" />;
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-32 text-center">
          <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchData}
            className="mt-2"
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            {t('common.retry')}
          </Button>
        </div>
      );
    }

    switch (widget.type) {
      case 'metric':
        const metricData = data as MetricData;
        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">
                {metricData?.value?.toLocaleString('pt-BR')}
                {metricData?.unit && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {metricData.unit}
                  </span>
                )}
              </div>
              {metricData?.trend && getTrendIcon(metricData.trend)}
            </div>
            
            {metricData?.change_percent !== undefined && (
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className={getStatusColor(metricData.status)}
                >
                  {metricData.change_percent.toFixed(1)}%
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {t('dashboard.vs_previous')}
                </span>
              </div>
            )}
          </div>
        );

      case 'chart':
        const chartData = data as ChartData;
        const chartPoints = chartData?.labels?.map((label, index) => ({
          name: label,
          value: chartData.datasets[0]?.data[index] || 0
        })) || [];
        
        return (
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartPoints}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  fontSize={10}
                  tick={{ fontSize: 10 }}
                />
                <YAxis fontSize={10} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke={COLORS[0]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        );

      case 'gauge':
        const gaugeData = data as any;
        const percentage = ((gaugeData?.value || 0) / (gaugeData?.max || 100)) * 100;
        const getGaugeColor = () => {
          if (percentage >= (gaugeData?.thresholds?.critical || 90)) return 'text-red-500';
          if (percentage >= (gaugeData?.thresholds?.warning || 70)) return 'text-yellow-500';
          return 'text-green-500';
        };
        
        return (
          <div className="space-y-4">
            <div className="text-center">
              <div className={`text-3xl font-bold ${getGaugeColor()}`}>
                {gaugeData?.value || 0}
                {gaugeData?.unit && (
                  <span className="text-sm text-muted-foreground ml-1">
                    {gaugeData.unit}
                  </span>
                )}
              </div>
            </div>
            <Progress value={percentage} className="h-2" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{gaugeData?.min || 0}</span>
              <span>{gaugeData?.max || 100}</span>
            </div>
          </div>
        );

      case 'table':
        const tableData = data as any;
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-4 gap-2 text-xs font-medium text-muted-foreground border-b pb-2">
              {tableData?.headers?.map((header: string, index: number) => (
                <div key={index} className="truncate">{header}</div>
              ))}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {tableData?.rows?.map((row: string[], rowIndex: number) => (
                <div key={rowIndex} className="grid grid-cols-4 gap-2 text-xs">
                  {row.map((cell, cellIndex) => (
                    <div key={cellIndex} className="truncate">{cell}</div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return (
          <div className="flex items-center justify-center h-32 text-center">
            <div>
              <p className="text-sm text-muted-foreground">
                {t('dashboard.widget_type_not_supported')}
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <motion.div
      layout
      className={`
        relative group
        ${isEditing ? 'ring-2 ring-primary/20 ring-dashed' : ''}
      `}
    >
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {renderWidgetIcon()}
              <CardTitle className="text-sm font-medium truncate">
                {widget.title}
              </CardTitle>
            </div>
            
            <div className="flex items-center gap-1">
              {/* Refresh indicator */}
              <div className="text-xs text-muted-foreground">
                {Math.floor((Date.now() - lastRefresh.getTime()) / 1000)}s
              </div>
              
              {/* Edit controls */}
              {isEditing && (
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      // TODO: Open widget edit modal
                      toast({
                        title: t('dashboard.info'),
                        description: t('dashboard.edit_widget_coming_soon'),
                        variant: 'default'
                      });
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRemove}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              )}
              
              {/* Refresh button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchData}
                disabled={isLoading}
              >
                <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
          
          {widget.data_source && (
            <CardDescription className="text-xs">
              {t('dashboard.source')}: {widget.data_source}
            </CardDescription>
          )}
        </CardHeader>
        
        <CardContent className="pt-0">
          {renderContent()}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default MetricWidget;
