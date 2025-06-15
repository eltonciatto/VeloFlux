// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Brain, 
  TrendingUp, 
  Zap, 
  Target, 
  Activity, 
  AlertTriangle, 
  CheckCircle,
  RefreshCw,
  Settings
} from 'lucide-react';
import { 
  useAIMetrics, 
  useAIPredictions, 
  useModelStatus, 
  useAIPerformanceMetrics,
  useAIStatus,
  useRetrainModel
} from '@/hooks/useAIMetrics';
import { formatConfidence, formatAccuracy, getConfidenceColor, getAccuracyColor } from '@/lib/aiApi';

interface AIInsightsProps {
  className?: string;
}

export function AIInsights({ className }: AIInsightsProps) {
  const { data: metrics, isLoading: metricsLoading } = useAIMetrics();
  const { data: predictions, isLoading: predictionsLoading } = useAIPredictions();
  const { data: models, isLoading: modelsLoading } = useModelStatus();
  const performanceMetrics = useAIPerformanceMetrics();
  const aiStatus = useAIStatus();
  const retrainMutation = useRetrainModel();

  const isLoading = metricsLoading || predictionsLoading || modelsLoading;

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
              AI Insights
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
      {/* AI Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI System Status
            {getStatusIcon()}
          </CardTitle>
          <CardDescription>
            Real-time artificial intelligence load balancing insights
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">AI Status</p>
              <Badge className={getStatusColor()}>
                {aiStatus.ai_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Active Models</p>
              <p className="text-2xl font-bold">{aiStatus.models_active}</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Current Algorithm</p>
              <Badge variant="outline">{performanceMetrics.currentAlgorithm}</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">Avg Accuracy</p>
              <p className={`text-2xl font-bold ${getAccuracyColor(performanceMetrics.averageAccuracy)}`}>
                {formatAccuracy(performanceMetrics.averageAccuracy)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

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
              Model Performance
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
                const model = modelData as any;
                return (
                  <div key={modelName} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{modelName.replace('_', ' ').toUpperCase()}</span>
                        <Badge variant={model.training_status === 'ready' ? 'default' : 'secondary'}>
                          {model.training_status}
                        </Badge>
                      </div>
                      <span className={`text-sm ${getAccuracyColor(model.accuracy)}`}>
                        {formatAccuracy(model.accuracy)}
                      </span>
                    </div>
                    <Progress value={model.accuracy * 100} className="h-2" />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>Type: {model.type}</span>
                      <span>Version: {model.version}</span>
                      <span>Last trained: {new Date(model.last_trained).toLocaleTimeString()}</span>
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
            Performance Metrics
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
    </div>
  );
}

export default AIInsights;
