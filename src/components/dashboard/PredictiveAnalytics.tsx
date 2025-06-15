import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  ComposedChart,
  Bar,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Zap,
  AlertTriangle,
  Target,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
} from 'lucide-react';
import { useAIPredictions, useAIMetrics } from '@/hooks/useAIMetrics';

interface PredictiveAnalyticsProps {
  className?: string;
}

export default function PredictiveAnalytics({ className = '' }: PredictiveAnalyticsProps) {
  const { data: predictions, isLoading } = useAIPredictions();
  const { data: metrics } = useAIMetrics();

  // Generate future load predictions (simulated for next 24 hours)
  const loadPredictions = React.useMemo(() => {
    if (!metrics) return [];
    
    const baseLoad = metrics.recent_requests?.length || 100;
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 24; i++) {
      const hour = new Date(now.getTime() + i * 60 * 60 * 1000);
      const hourOfDay = hour.getHours();
      
      // Simulate realistic load patterns (higher during business hours)
      let multiplier = 1;
      if (hourOfDay >= 9 && hourOfDay <= 17) {
        multiplier = 1.5 + Math.sin((hourOfDay - 9) / 8 * Math.PI) * 0.5;
      } else if (hourOfDay >= 18 && hourOfDay <= 22) {
        multiplier = 1.2;
      } else {
        multiplier = 0.6;
      }
      
      // Add some randomness
      const randomFactor = 0.8 + Math.random() * 0.4;
      const predictedLoad = Math.round(baseLoad * multiplier * randomFactor);
      const confidence = 85 + Math.random() * 10; // 85-95% confidence
      
      data.push({
        time: hour.getHours() + ':00',
        load: predictedLoad,
        confidence: confidence,
        timestamp: hour.toISOString(),
      });
    }
    
    return data;
  }, [metrics]);

  // Traffic forecasting data
  const trafficForecast = React.useMemo(() => {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 7; i++) {
      const day = new Date(now.getTime() + i * 24 * 60 * 60 * 1000);
      const dayName = day.toLocaleDateString('en-US', { weekday: 'short' });
      
      // Simulate weekly patterns
      let baseTraffic = 1000;
      const dayOfWeek = day.getDay();
      
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Weekend
        baseTraffic *= 0.7;
      } else if (dayOfWeek >= 1 && dayOfWeek <= 5) { // Weekdays
        baseTraffic *= 1.2;
      }
      
      const variance = 0.8 + Math.random() * 0.4;
      const predicted = Math.round(baseTraffic * variance);
      const actual = i === 0 ? predicted + Math.round((Math.random() - 0.5) * 200) : null;
      
      data.push({
        day: dayName,
        predicted,
        actual,
        date: day.toISOString(),
      });
    }
    
    return data;
  }, []);

  // Anomaly detection alerts
  const anomalies = React.useMemo(() => {
    const alerts = [];
    
    if (predictions?.scaling_recommendation === 'scale_up') {
      alerts.push({
        type: 'warning',
        title: 'High Load Predicted',
        message: 'Load is expected to increase by 40% in the next 2 hours',
        time: '2 hours',
        severity: 'medium',
      });
    }
    
    if (predictions?.confidence && predictions.confidence < 0.7) {
      alerts.push({
        type: 'error',
        title: 'Low Prediction Confidence',
        message: 'Model confidence has dropped below 70%. Consider retraining.',
        time: 'now',
        severity: 'high',
      });
    }
    
    // Simulate additional anomalies
    if (Math.random() > 0.7) {
      alerts.push({
        type: 'info',
        title: 'Traffic Pattern Change',
        message: 'Unusual traffic pattern detected in region us-east-1',
        time: '15 minutes',
        severity: 'low',
      });
    }
    
    return alerts;
  }, [predictions]);

  const getRecommendationIcon = (recommendation: string) => {
    switch (recommendation) {
      case 'scale_up': return <ArrowUp className="h-4 w-4" />;
      case 'scale_down': return <ArrowDown className="h-4 w-4" />;
      default: return <Minus className="h-4 w-4" />;
    }
  };

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'scale_up': return 'bg-orange-500 text-white';
      case 'scale_down': return 'bg-blue-500 text-white';
      default: return 'bg-green-500 text-white';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-orange-500 bg-orange-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-8 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Prediction Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Next Peak Load
                </p>
                <p className="text-2xl font-bold">
                  {Math.max(...loadPredictions.map(d => d.load)).toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">
                  Expected at{' '}
                  {loadPredictions.find(d => d.load === Math.max(...loadPredictions.map(p => p.load)))?.time}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Scaling Recommendation
                </p>
                <Badge className={getRecommendationColor(predictions?.scaling_recommendation || 'maintain')}>
                  {getRecommendationIcon(predictions?.scaling_recommendation || 'maintain')}
                  {predictions?.scaling_recommendation || 'maintain'}
                </Badge>
                <p className="text-xs text-muted-foreground mt-1">
                  Confidence: {((predictions?.confidence || 0.85) * 100).toFixed(0)}%
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Active Alerts
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {anomalies.length}
                </p>
                <p className="text-xs text-muted-foreground">
                  {anomalies.filter(a => a.severity === 'high').length} high priority
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Future Load Predictions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              24-Hour Load Forecast
            </CardTitle>
            <CardDescription>
              Predicted traffic load with confidence intervals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={loadPredictions}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" domain={[70, 100]} />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      name === 'load' ? value.toLocaleString() : `${value.toFixed(1)}%`,
                      name === 'load' ? 'Predicted Load' : 'Confidence'
                    ]}
                  />
                  <Area
                    yAxisId="left"
                    type="monotone"
                    dataKey="load"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.3}
                    strokeWidth={2}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="confidence"
                    stroke="#10b981"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Traffic Forecasting */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              7-Day Traffic Forecast
            </CardTitle>
            <CardDescription>
              Weekly traffic predictions vs actual data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trafficForecast}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number, name: string) => [
                      value?.toLocaleString() || 'N/A',
                      name === 'predicted' ? 'Predicted' : 'Actual'
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="predicted"
                    stroke="#8b5cf6"
                    strokeWidth={2}
                    strokeDasharray="8 4"
                    dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Anomaly Detection Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Anomaly Detection & Alerts
          </CardTitle>
          <CardDescription>
            Real-time anomaly detection and system recommendations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {anomalies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No anomalies detected. System operating normally.</p>
              </div>
            ) : (
              anomalies.map((anomaly, index) => (
                <Alert 
                  key={index} 
                  className={`${getSeverityColor(anomaly.severity)} border-l-4`}
                >
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">{anomaly.title}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {anomaly.message}
                        </p>
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        <p>{anomaly.time}</p>
                        <Badge variant="outline" className="mt-1">
                          {anomaly.severity}
                        </Badge>
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Scaling Recommendations */}
      {predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Intelligent Scaling Recommendations
            </CardTitle>
            <CardDescription>
              AI-powered infrastructure scaling suggestions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium mb-3">Current Recommendation</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className={getRecommendationColor(predictions.scaling_recommendation)}>
                      {getRecommendationIcon(predictions.scaling_recommendation)}
                      {predictions.scaling_recommendation}
                    </Badge>
                    <span className="text-sm text-muted-foreground">
                      Algorithm: {predictions.recommended_algorithm}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on current traffic patterns and predicted load increase of{' '}
                    <span className="font-medium">
                      {((predictions.expected_load_factor - 1) * 100).toFixed(0)}%
                    </span>{' '}
                    in the next hour.
                  </p>
                  <div className="flex gap-2 pt-2">
                    <Button size="sm" className="flex-1">
                      Apply Recommendation
                    </Button>
                    <Button size="sm" variant="outline">
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-3">Prediction Details</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Confidence Level:</span>
                    <span className="font-medium">
                      {(predictions.confidence * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Expected Load Factor:</span>
                    <span className="font-medium">
                      {predictions.expected_load_factor.toFixed(2)}x
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Prediction Horizon:</span>
                    <span className="font-medium">60 minutes</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Model Version:</span>
                    <span className="font-medium">v2.1.3</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
