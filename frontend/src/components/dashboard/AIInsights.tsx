// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings,
  Wifi,
  WifiOff,
  AlertCircle,
  TrendingDown,
  Globe
} from 'lucide-react';
import { 
  useAIMetrics, 
  useAIPredictions, 
  useModelStatus, 
  useAIPerformanceMetrics,
  useAIStatus,
  useRetrainModel
} from '@/hooks/useAIMetrics';
import { useRealtimeAI } from '@/hooks/useRealtimeWebSocket';
import { formatConfidence, formatAccuracy, getConfidenceColor, getAccuracyColor, AIMetrics } from '@/lib/aiApi';
import AIGeoInsights from './AIGeoInsights';

interface AIAlertData {
  severity: string;
  message: string;
}

interface AIInsightsProps {
  className?: string;
}

export function AIInsights({ className }: AIInsightsProps) {
  const { t } = useTranslation();
  const { data: metrics, isLoading: metricsLoading } = useAIMetrics();
  const { data: predictions, isLoading: predictionsLoading } = useAIPredictions();
  const { data: models, isLoading: modelsLoading } = useModelStatus();
  const performanceMetrics = useAIPerformanceMetrics();
  const aiStatus = useAIStatus();
  const retrainMutation = useRetrainModel();

  // 🚀 REAL-TIME WebSocket Integration
  const { 
    isConnected: wsConnected, 
    lastMessage, 
    connectionStatus,
    error: wsError 
  } = useRealtimeAI();

  // 🚀 Real-time state management
  const [realtimeMetrics, setRealtimeMetrics] = useState(metrics);
  const [realtimeAlerts, setRealtimeAlerts] = useState<Array<{
    id: string;
    type: 'info' | 'warning' | 'error';
    message: string;
    timestamp: number;
  }>>([]);

  // 🚀 Process real-time updates
  useEffect(() => {
    if (lastMessage) {
      switch (lastMessage.type) {
        case 'ai_metrics_update': {
          setRealtimeMetrics(lastMessage.data as AIMetrics);
          break;
        }
        case 'ai_alert': {
          const alertData = lastMessage.data as AIAlertData;
          setRealtimeAlerts(prev => [
            {
              id: `alert_${lastMessage.timestamp}`,
              type: (alertData.severity === 'error' || alertData.severity === 'warning' || alertData.severity === 'info') 
                ? alertData.severity as 'error' | 'warning' | 'info'
                : 'info',
              message: alertData.message,
              timestamp: lastMessage.timestamp
            },
            ...prev.slice(0, 4) // Keep only 5 most recent alerts
          ]);
          break;
        }
        case 'model_status_change': {
          // Handle model status changes
          break;
        }
      }
    }
  }, [lastMessage]);

  const isLoading = metricsLoading || predictionsLoading || modelsLoading;
  const currentMetrics = realtimeMetrics || metrics;

  const handleRetrain = () => {
    retrainMutation.mutate(undefined); // undefined for default model
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              {t('aiComponents.insights.title')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-32">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getStatusIcon = () => {
    switch (aiStatus.overall) {
      case 'healthy':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      default:
        return <Activity className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = () => {
    switch (aiStatus.overall) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'error': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 🚀 Real-time Connection Status */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg border border-slate-700"
      >
        <div className="flex items-center gap-3">
          {wsConnected ? (
            <>
              <Wifi className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">Real-time updates active</span>
            </>
          ) : (
            <>
              <WifiOff className="h-4 w-4 text-yellow-400" />
              <span className="text-sm text-yellow-400">Connecting to real-time data...</span>
            </>
          )}
        </div>
        <Badge 
          variant={wsConnected ? "default" : "secondary"}
          className={wsConnected ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}
        >
          {connectionStatus}
        </Badge>
      </motion.div>

      {/* 🚀 Real-time Alerts */}
      <AnimatePresence>
        {realtimeAlerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {realtimeAlerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <Alert className={`border-l-4 ${
                  alert.type === 'error' ? 'border-red-500 bg-red-50/10' :
                  alert.type === 'warning' ? 'border-yellow-500 bg-yellow-50/10' :
                  'border-blue-500 bg-blue-50/10'
                }`}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>{alert.message}</span>
                    <span className="text-xs text-slate-400">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </AlertDescription>
                </Alert>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Status Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI System Status
              <motion.div
                animate={{ rotate: wsConnected ? 360 : 0 }}
                transition={{ duration: 2, repeat: wsConnected ? Infinity : 0 }}
              >
                {getStatusIcon()}
              </motion.div>
            </CardTitle>
            <CardDescription>
              Real-time artificial intelligence load balancing insights
              {wsConnected && <span className="text-green-400 ml-2">● Live</span>}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="text-sm text-muted-foreground">AI Status</p>
                <Badge className={getStatusColor()}>
                  {aiStatus.ai_enabled ? 'Enabled' : 'Disabled'}
                </Badge>
              </motion.div>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="text-sm text-muted-foreground">Active Models</p>
                <motion.p 
                  className="text-2xl font-bold"
                  key={aiStatus.models_active}
                  initial={{ scale: 1.2, color: "#22c55e" }}
                  animate={{ scale: 1, color: "#ffffff" }}
                  transition={{ duration: 0.3 }}
                >
                  {aiStatus.models_active}
                </motion.p>
              </motion.div>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="text-sm text-muted-foreground">Current Algorithm</p>
                <Badge variant="outline">{performanceMetrics.currentAlgorithm}</Badge>
              </motion.div>
              <motion.div 
                className="space-y-2"
                whileHover={{ scale: 1.05 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <p className="text-sm text-muted-foreground">Avg Accuracy</p>
                <motion.p 
                  className={`text-2xl font-bold ${getAccuracyColor(performanceMetrics.averageAccuracy)}`}
                  key={performanceMetrics.averageAccuracy}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {formatAccuracy(performanceMetrics.averageAccuracy)}
                </motion.p>
              </motion.div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Current AI Predictions */}
      {predictions && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Current AI Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Recommended Algorithm</p>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">{predictions.recommended_algorithm}</Badge>
                  <span className={`text-sm ${getConfidenceColor(predictions.confidence)}`}>
                    {formatConfidence(predictions.confidence)} confidence
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Predicted Load</p>
                <p className="text-xl font-semibold">
                  {predictions.predictions && predictions.predictions.length > 0 
                    ? predictions.predictions[0].predicted_load.toFixed(1) 
                    : 'N/A'} req/s
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Scaling Recommendation</p>
                <Badge variant={predictions.scaling_recommendation === 'scale_up' ? 'destructive' : 'default'}>
                  {predictions.scaling_recommendation.replace('_', ' ').toUpperCase()}
                </Badge>
              </div>
            </div>
            
            {/* Display prediction timeline */}
            {predictions.predictions && predictions.predictions.length > 0 && (
              <div className="mt-4 space-y-2">
                <p className="text-sm text-muted-foreground">Prediction Timeline</p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {predictions.predictions.slice(0, 4).map((pred, index) => (
                    <div key={index} className="flex justify-between p-2 bg-muted rounded">
                      <span>{pred.time}</span>
                      <span>{pred.predicted_load.toFixed(0)} req/s</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Model Performance */}
      {models && Object.keys(models).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('aiComponents.insights.modelPerformance')}
              <Button 
                size="sm" 
                variant="outline" 
                onClick={handleRetrain}
                disabled={retrainMutation.isPending}
                className="ml-auto"
              >
                {retrainMutation.isPending ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Retraining...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retrain
                  </>
                )}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(models).map(([modelName, modelData]) => {
                const model = modelData as { 
                  accuracy?: number; 
                  status?: string; 
                  last_trained?: string;
                  training_status?: string;
                  type?: string;
                  version?: string;
                };
                return (
                  <div key={modelName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{modelName.replace('_', ' ').toUpperCase()}</span>
                        <Badge variant={model.training_status === 'ready' ? 'default' : 'secondary'}>
                          {model.training_status || model.status || 'unknown'}
                        </Badge>
                      </div>
                      <span className={`text-sm ${getAccuracyColor(model.accuracy)}`}>
                        {formatAccuracy(model.accuracy)}
                      </span>
                    </div>
                    <Progress value={(model.accuracy || 0) * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Type: {model.type || 'N/A'}</span>
                      <span>Version: {model.version || 'N/A'}</span>
                      <span>Last trained: {model.last_trained ? new Date(model.last_trained).toLocaleTimeString() : 'N/A'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            {t('aiComponents.insights.performanceMetrics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Success Rate</p>
              <p className="text-3xl font-bold text-green-600">
                {(performanceMetrics.successRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Total Requests</p>
              <p className="text-3xl font-bold">{performanceMetrics.totalRequests}</p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Avg Confidence</p>
              <p className={`text-3xl font-bold ${getConfidenceColor(performanceMetrics.averageConfidence)}`}>
                {formatConfidence(performanceMetrics.averageConfidence)}
              </p>
            </div>
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">Model Count</p>
              <p className="text-3xl font-bold">{performanceMetrics.modelCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {!aiStatus.ai_enabled && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            AI load balancing is currently disabled. Enable it in the configuration to start benefiting from intelligent routing.
          </AlertDescription>
        </Alert>
      )}

      {aiStatus.ai_enabled && aiStatus.current_confidence < 0.5 && (
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            AI confidence is low ({formatConfidence(aiStatus.current_confidence)}). The system is using fallback algorithms. Consider retraining the models.
          </AlertDescription>
        </Alert>
      )}

      {aiStatus.models_active === 0 && aiStatus.ai_enabled && (
        <Alert className="border-red-200">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            No AI models are currently active. AI features will not work until models are loaded and trained.
          </AlertDescription>
        </Alert>
      )}

      {/* AI Insights with Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Analytics Dashboard
          </CardTitle>
          <CardDescription>
            Comprehensive AI performance and geographic intelligence
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="geographic">Geographic</TabsTrigger>
              <TabsTrigger value="models">Models</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              {/* System Alerts */}
              {aiStatus.ai_enabled && aiStatus.current_confidence < 0.5 && (
                <Alert className="border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription>
                    AI confidence is low ({formatConfidence(aiStatus.current_confidence)}). The system is using fallback algorithms. Consider retraining the models.
                  </AlertDescription>
                </Alert>
              )}

              {aiStatus.models_active === 0 && aiStatus.ai_enabled && (
                <Alert className="border-red-200">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    No AI models are currently active. AI features will not work until models are loaded and trained.
                  </AlertDescription>
                </Alert>
              )}

              {/* Additional overview content */}
              <div className="text-center text-slate-400 py-8">
                Additional overview metrics will be displayed here
              </div>
            </TabsContent>

            <TabsContent value="geographic" className="space-y-4">
              <AIGeoInsights />
            </TabsContent>

            <TabsContent value="models" className="space-y-4">
              <div className="text-center text-slate-400 py-8">
                Model performance and training status will be displayed here
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default AIInsights;
