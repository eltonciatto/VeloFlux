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
import { Button } from '@/components/ui/button';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Clock,
  RefreshCw,
} from 'lucide-react';
import { useAIMetrics, useAIHistory, useAIPerformanceMetrics } from '@/hooks/useAIMetrics';

interface AIMetricsDashboardProps {
  className?: string;
}

export default function AIMetricsDashboard({ className = '' }: AIMetricsDashboardProps) {
  const { data: metrics, isLoading } = useAIMetrics();
  const { data: history } = useAIHistory();
  const performanceMetrics = useAIPerformanceMetrics();

  // Transform history data for charts
  const accuracyTrendData = React.useMemo(() => {
    if (!history || !history.accuracy_history) return [];
    return history.accuracy_history
      .filter(entry => entry.accuracy !== null)
      .slice(-20)
      .map((entry, index) => ({
        time: new Date(entry.timestamp).getHours() + ':' + 
              String(new Date(entry.timestamp).getMinutes()).padStart(2, '0'),
        accuracy: (entry.accuracy || 0) * 100,
        confidence: (entry.accuracy || 0) * 100, // Use accuracy as confidence for now
        index,
      }));
  }, [history]);

  const trafficPatternData = React.useMemo(() => {
    if (!metrics?.recent_requests) return [];
    
    // Group requests by hour for the last 24 hours
    const hourlyData: { [key: string]: number } = {};
    const now = new Date();
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = hour.getHours() + ':00';
      hourlyData[key] = 0;
    }
    
    metrics.recent_requests.forEach(request => {
      const hour = new Date(request.timestamp).getHours() + ':00';
      if (hourlyData[hour] !== undefined) {
        hourlyData[hour]++;
      }
    });
    
    return Object.entries(hourlyData).map(([time, requests]) => ({
      time,
      requests,
    }));
  }, [metrics]);

  const confidenceTrendData = React.useMemo(() => {
    if (!history || !history.confidence_history) return [];
    return history.confidence_history
      .slice(-15)
      .map((entry, index) => ({
        time: new Date(entry.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        confidence: (entry.confidence || 0) * 100,
        prediction_accuracy: (entry.confidence || 0) * 100, // Use confidence as accuracy for now
        index,
      }));
  }, [history]);

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getAccuracyTrend = () => {
    if (accuracyTrendData.length < 2) return 'stable';
    const recent = accuracyTrendData.slice(-3);
    const avgRecent = recent.reduce((sum, d) => sum + d.accuracy, 0) / recent.length;
    const previous = accuracyTrendData.slice(-6, -3);
    if (previous.length === 0) return 'stable';
    const avgPrevious = previous.reduce((sum, d) => sum + d.accuracy, 0) / previous.length;
    
    if (avgRecent > avgPrevious + 2) return 'up';
    if (avgRecent < avgPrevious - 2) return 'down';
    return 'stable';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down': return <TrendingDown className="h-4 w-4 text-red-500" />;
      default: return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const accuracyTrend = getAccuracyTrend();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Prediction Accuracy
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">
                    {(performanceMetrics.averageAccuracy * 100).toFixed(1)}%
                  </p>
                  {getTrendIcon(accuracyTrend)}
                </div>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
            <Progress 
              value={performanceMetrics.averageAccuracy * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Average Confidence
                </p>
                <p className="text-2xl font-bold">
                  {(performanceMetrics.averageConfidence * 100).toFixed(1)}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
            <Progress 
              value={performanceMetrics.averageConfidence * 100} 
              className="mt-2" 
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Requests Today
                </p>
                <p className="text-2xl font-bold">
                  {performanceMetrics.totalRequests.toLocaleString()}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Success Rate: {(performanceMetrics.successRate * 100).toFixed(1)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Algorithm
                </p>
                <Badge variant="outline" className="mt-1">
                  {performanceMetrics.currentAlgorithm}
                </Badge>
              </div>
              <RefreshCw className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accuracy Trend Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Prediction Accuracy Trend
            </CardTitle>
            <CardDescription>
              Real-time accuracy and confidence levels
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={accuracyTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      `${value.toFixed(1)}%`,
                      name === 'accuracy' ? 'Accuracy' : 'Confidence'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="accuracy"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Pattern Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Traffic Pattern Analysis
            </CardTitle>
            <CardDescription>
              Request volume over the last 24 hours
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficPatternData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`${value}`, 'Requests']}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Confidence Level Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Confidence Level Trends
          </CardTitle>
          <CardDescription>
            Model confidence and prediction accuracy correlation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={confidenceTrendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `${value.toFixed(1)}%`,
                    name === 'confidence' ? 'Confidence' : 'Accuracy'
                  ]}
                />
                <Bar 
                  dataKey="confidence" 
                  fill="#3b82f6" 
                  opacity={0.8}
                  radius={[2, 2, 0, 0]}
                />
                <Bar 
                  dataKey="prediction_accuracy" 
                  fill="#10b981" 
                  opacity={0.8}
                  radius={[2, 2, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
