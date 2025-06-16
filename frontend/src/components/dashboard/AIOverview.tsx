import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import {
  Brain,
  Activity,
  TrendingUp,
  Target,
  Zap,
  AlertTriangle,
} from 'lucide-react';
import { useAIMetrics, useAIStatus, useAIPerformanceMetrics } from '@/hooks/useAIMetrics';

interface AIOverviewProps {
  className?: string;
}

export default function AIOverview({ className = '' }: AIOverviewProps) {
  const { data: metrics, isLoading } = useAIMetrics();
  const aiStatus = useAIStatus();
  const performanceMetrics = useAIPerformanceMetrics();

  // Quick performance trend data (last 6 hours)
  const quickTrendData = React.useMemo(() => {
    if (!metrics?.recent_requests) return [];
    
    const hourlyData: { [key: number]: { total: number; success: number; avgTime: number } } = {};
    const now = new Date();
    
    // Initialize last 6 hours
    for (let i = 5; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000).getHours();
      hourlyData[hour] = { total: 0, success: 0, avgTime: 0 };
    }
    
    // Process recent requests
    metrics.recent_requests.forEach(request => {
      const hour = new Date(request.timestamp).getHours();
      if (hourlyData[hour]) {
        hourlyData[hour].total++;
        if (request.success) hourlyData[hour].success++;
        hourlyData[hour].avgTime += request.response_time;
      }
    });
    
    return Object.entries(hourlyData).map(([hour, data]) => ({
      time: `${hour}:00`,
      accuracy: data.total > 0 ? (data.success / data.total) * 100 : 0,
      avgResponseTime: data.total > 0 ? data.avgTime / data.total : 0,
    }));
  }, [metrics]);

  const getStatusColor = () => {
    if (!aiStatus.ai_enabled) return 'bg-gray-500 text-white';
    if (performanceMetrics.averageAccuracy > 0.9) return 'bg-green-500 text-white';
    if (performanceMetrics.averageAccuracy > 0.7) return 'bg-yellow-500 text-white';
    return 'bg-red-500 text-white';
  };

  const getHealthStatus = () => {
    if (!aiStatus.ai_enabled) return 'Disabled';
    if (performanceMetrics.averageAccuracy > 0.9) return 'Excellent';
    if (performanceMetrics.averageAccuracy > 0.7) return 'Good';
    return 'Needs Attention';
  };

  if (isLoading || aiStatus.isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
            <div className="h-48 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!aiStatus.ai_enabled) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI System Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Brain className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-medium mb-2">AI System Disabled</h3>
            <p className="text-muted-foreground mb-4">
              Enable AI to access intelligent load balancing and predictions.
            </p>
            <Badge variant="outline">
              Status: Disabled
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI System Overview
        </CardTitle>
        <CardDescription>
          Real-time AI performance and system health
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-blue-500" />
              <span className="text-sm text-muted-foreground">Status</span>
            </div>
            <Badge className={getStatusColor()}>
              {getHealthStatus()}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-green-500" />
              <span className="text-sm text-muted-foreground">Accuracy</span>
            </div>
            <p className="text-2xl font-bold">
              {(performanceMetrics.averageAccuracy * 100).toFixed(1)}%
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-500" />
              <span className="text-sm text-muted-foreground">Active Models</span>
            </div>
            <p className="text-2xl font-bold">
              {aiStatus.models_active || 0}
            </p>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              <span className="text-sm text-muted-foreground">Algorithm</span>
            </div>
            <Badge variant="outline" className="text-xs">
              {performanceMetrics.currentAlgorithm}
            </Badge>
          </div>
        </div>

        {/* Performance Progress Bars */}
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Prediction Accuracy</span>
              <span className="font-medium">
                {(performanceMetrics.averageAccuracy * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={performanceMetrics.averageAccuracy * 100} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Confidence Level</span>
              <span className="font-medium">
                {(performanceMetrics.averageConfidence * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={performanceMetrics.averageConfidence * 100} />
          </div>
          
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Success Rate</span>
              <span className="font-medium">
                {(performanceMetrics.successRate * 100).toFixed(1)}%
              </span>
            </div>
            <Progress value={performanceMetrics.successRate * 100} />
          </div>
        </div>

        {/* Quick Performance Trend */}
        <div>
          <h4 className="text-sm font-medium mb-3">Performance Trend (6 hours)</h4>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={quickTrendData}>
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}${name === 'accuracy' ? '%' : 'ms'}`,
                    name === 'accuracy' ? 'Accuracy' : 'Avg Response Time'
                  ]}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Alerts */}
        {performanceMetrics.averageAccuracy < 0.8 && (
          <div className="flex items-start gap-3 p-3 border border-orange-200 bg-orange-50 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-orange-800">
                Performance Alert
              </p>
              <p className="text-sm text-orange-700">
                AI accuracy has dropped below 80%. Consider reviewing model configuration.
              </p>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex gap-2 pt-2">
          <Badge variant="outline" className="text-xs">
            {performanceMetrics.totalRequests} requests today
          </Badge>
          <Badge variant="outline" className="text-xs">
            Last update: {metrics?.last_update ? 
              new Date(metrics.last_update).toLocaleTimeString() : 'Unknown'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
