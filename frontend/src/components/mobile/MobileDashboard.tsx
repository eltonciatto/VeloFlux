import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  SmartphoneIcon,
  ActivityIcon,
  AlertTriangleIcon,
  TrendingUpIcon,
  UsersIcon,
  ServerIcon,
  WifiIcon,
  BatteryIcon,
  SignalIcon,
  RefreshCwIcon,
  MenuIcon,
  ChevronDownIcon
} from 'lucide-react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTranslation } from 'react-i18next';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { PullToRefresh } from './PullToRefresh';
import { SwipeableCards } from './SwipeableCards';
import { OfflineIndicator } from './OfflineIndicator';

interface MobileMetric {
  name: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  color: string;
}

interface MobileChart {
  time: string;
  requests: number;
  latency: number;
  errors: number;
  cpu: number;
}

const mockMobileData: MobileChart[] = [
  { time: '12:00', requests: 1250, latency: 45, errors: 2, cpu: 65 },
  { time: '12:15', requests: 1340, latency: 38, errors: 1, cpu: 72 },
  { time: '12:30', requests: 1180, latency: 52, errors: 4, cpu: 58 },
  { time: '12:45', requests: 1450, latency: 41, errors: 0, cpu: 68 },
  { time: '13:00', requests: 1620, latency: 47, errors: 3, cpu: 75 }
];

const mockMetrics: MobileMetric[] = [
  {
    name: 'Requests/min',
    value: '1,620',
    change: '+8.5%',
    trend: 'up',
    icon: <ActivityIcon className="w-5 h-5" />,
    color: 'text-blue-600'
  },
  {
    name: 'Avg Latency',
    value: '47ms',
    change: '-3ms',
    trend: 'up',
    icon: <TrendingUpIcon className="w-5 h-5" />,
    color: 'text-green-600'
  },
  {
    name: 'Active Users',
    value: '2,340',
    change: '+12%',
    trend: 'up',
    icon: <UsersIcon className="w-5 h-5" />,
    color: 'text-purple-600'
  },
  {
    name: 'Error Rate',
    value: '0.12%',
    change: '-0.03%',
    trend: 'up',
    icon: <AlertTriangleIcon className="w-5 h-5" />,
    color: 'text-yellow-600'
  }
];

export const MobileDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { isMobile, isTablet } = useMobileDetection();
  const { isOnline, syncStatus, lastSync } = useOfflineSync();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsRefreshing(false);
  };

  const getTrendIcon = (trend: string) => {
    return trend === 'up' ? '↗️' : trend === 'down' ? '↘️' : '→';
  };

  const getTrendColor = (trend: string) => {
    return trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Offline Indicator */}
      <OfflineIndicator />
      
      {/* Mobile Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="p-2">
                <MenuIcon className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-bold text-gray-900">VeloFlux</h1>
                <p className="text-xs text-gray-600">Mobile Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Connection Status */}
              <div className="flex items-center gap-1">
                <WifiIcon className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
                <SignalIcon className="w-4 h-4 text-gray-400" />
                <BatteryIcon className="w-4 h-4 text-gray-400" />
              </div>
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2"
              >
                <RefreshCwIcon className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Pull to Refresh Wrapper */}
      <PullToRefresh onRefresh={handleRefresh} isRefreshing={isRefreshing}>
        <div className="px-4 py-4 space-y-4">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-3">
            {mockMetrics.map((metric, index) => (
              <Card key={index} className="shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className={metric.color}>
                      {metric.icon}
                    </div>
                    <span className={`text-xs font-medium ${getTrendColor(metric.trend)}`}>
                      {getTrendIcon(metric.trend)} {metric.change}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">{metric.name}</p>
                    <p className="text-lg font-bold text-gray-900">{metric.value}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Swipeable Cards Section */}
          <SwipeableCards />

          {/* Mobile Optimized Tabs */}
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="w-full grid grid-cols-3">
              <TabsTrigger value="overview" className="text-xs">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="performance" className="text-xs">
                Performance
              </TabsTrigger>
              <TabsTrigger value="alerts" className="text-xs">
                Alertas
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ActivityIcon className="w-4 h-4" />
                    Atividade Recente
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={mockMobileData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="requests" 
                        stroke="#3b82f6" 
                        strokeWidth={2}
                        dot={false}
                        name="Requisições"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* System Status */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <ServerIcon className="w-4 h-4" />
                    Status do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Load Balancer</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Online</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Backend API</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Database</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs">High Load</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Cache</span>
                    <Badge className="bg-green-100 text-green-800 text-xs">Optimal</Badge>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Performance Tab */}
            <TabsContent value="performance" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">CPU & Memória</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <AreaChart data={mockMobileData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="cpu" 
                        stroke="#8b5cf6" 
                        fill="#8b5cf6" 
                        fillOpacity={0.3}
                        name="CPU %"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Latência</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={mockMobileData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="time" 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#fff', 
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="latency" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={false}
                        name="Latência (ms)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Alerts Tab */}
            <TabsContent value="alerts" className="space-y-4 mt-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangleIcon className="w-4 h-4" />
                    Alertas Ativos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                    <AlertTriangleIcon className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-yellow-800">High Response Time</p>
                      <p className="text-xs text-yellow-700">Backend API latência acima de 80ms</p>
                      <p className="text-xs text-yellow-600 mt-1">5 min atrás</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                    <AlertTriangleIcon className="w-4 h-4 text-red-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-red-800">Database Connection</p>
                      <p className="text-xs text-red-700">Intermittent connection issues</p>
                      <p className="text-xs text-red-600 mt-1">12 min atrás</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                    <AlertTriangleIcon className="w-4 h-4 text-blue-600 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-blue-800">Info</p>
                      <p className="text-xs text-blue-700">Maintenance window scheduled</p>
                      <p className="text-xs text-blue-600 mt-1">1 hora atrás</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Sync Status */}
          {lastSync && (
            <Card className="bg-gray-50">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-600">Última sincronização</span>
                  <span className="text-xs text-gray-500">
                    {new Date(lastSync).toLocaleTimeString()}
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    syncStatus === 'synced' ? 'bg-green-500' : 
                    syncStatus === 'syncing' ? 'bg-yellow-500' : 'bg-red-500'
                  }`} />
                  <span className="text-xs capitalize text-gray-600">{syncStatus}</span>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </PullToRefresh>
    </div>
  );
};

export default MobileDashboard;
