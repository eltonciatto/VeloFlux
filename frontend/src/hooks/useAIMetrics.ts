// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  aiApiClient, 
  AIMetrics, 
  PredictionData, 
  ModelStatus, 
  AIConfig 
} from '@/lib/aiApi';

// Query keys for React Query caching
export const AI_QUERY_KEYS = {
  metrics: 'ai-metrics',
  predictions: 'ai-predictions',
  models: 'ai-models',
  config: 'ai-config',
  health: 'ai-health',
  history: 'ai-history',
} as const;

/**
 * Hook to fetch real-time AI metrics
 */
export function useAIMetrics(refreshInterval: number = 5000) {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.metrics],
    queryFn: () => aiApiClient.getAIMetrics(),
    refetchInterval: refreshInterval,
    staleTime: 1000, // Consider data stale after 1 second
    gcTime: 30000, // Keep in cache for 30 seconds
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    meta: {
      errorMessage: 'Failed to fetch AI metrics',
    },
  });
}

/**
 * Hook to fetch current AI predictions
 */
export function useAIPredictions(refreshInterval: number = 2000) {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.predictions],
    queryFn: () => aiApiClient.getAIPredictions(),
    refetchInterval: refreshInterval,
    staleTime: 500,
    gcTime: 10000,
    retry: 3,
    meta: {
      errorMessage: 'Failed to fetch AI predictions',
    },
  });
}

/**
 * Hook to fetch ML model status and performance
 */
export function useModelStatus(refreshInterval: number = 10000) {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.models],
    queryFn: () => aiApiClient.getModelStatus(),
    refetchInterval: refreshInterval,
    staleTime: 5000,
    gcTime: 60000,
    retry: 3,
    meta: {
      errorMessage: 'Failed to fetch model status',
    },
  });
}

/**
 * Hook to fetch AI configuration
 */
export function useAIConfig() {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.config],
    queryFn: () => aiApiClient.getAIConfig(),
    staleTime: 30000, // Config doesn't change often
    gcTime: 300000, // Keep in cache for 5 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch AI configuration',
    },
  });
}

/**
 * Hook to fetch AI system health
 */
export function useAIHealth() {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.health],
    queryFn: () => aiApiClient.getAIHealth(),
    refetchInterval: 15000,
    staleTime: 10000,
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch AI health status',
    },
  });
}

/**
 * Hook to fetch historical AI data
 */
export function useAIHistory(timeRange: string = '1h') {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.history, timeRange],
    queryFn: () => aiApiClient.getHistoricalData(timeRange),
    staleTime: 60000, // 1 minute
    gcTime: 300000, // 5 minutes
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch AI historical data',
    },
  });
}

/**
 * Mutation hook to update AI configuration
 */
export function useUpdateAIConfig() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (config: Partial<AIConfig>) => aiApiClient.updateAIConfig(config),
    onSuccess: () => {
      // Invalidate config to refetch updated values
      queryClient.invalidateQueries({ queryKey: [AI_QUERY_KEYS.config] });
      queryClient.invalidateQueries({ queryKey: [AI_QUERY_KEYS.metrics] });
      
      toast.success('AI configuration updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update AI configuration:', error);
      toast.error('Failed to update AI configuration');
    },
  });
}

/**
 * Mutation hook to trigger model retraining
 */
export function useRetrainModel() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (modelType?: string) => aiApiClient.triggerModelRetraining(modelType),
    onSuccess: (data) => {
      // Invalidate model status to show updated training status
      queryClient.invalidateQueries({ queryKey: [AI_QUERY_KEYS.models] });
      queryClient.invalidateQueries({ queryKey: [AI_QUERY_KEYS.metrics] });
      
      toast.success(data.message || 'Model retraining started successfully');
    },
    onError: (error) => {
      console.error('Failed to trigger model retraining:', error);
      toast.error('Failed to start model retraining');
    },
  });
}

/**
 * Custom hook to calculate AI performance metrics
 */
export function useAIPerformanceMetrics() {
  const { data: metrics } = useAIMetrics();
  const { data: models } = useModelStatus();
  
  const calculateAverageAccuracy = () => {
    if (!models) return 0;
    const modelValues = Object.values(models);
    if (modelValues.length === 0) return 0;
    const sum = modelValues.reduce((acc, model) => acc + (model.accuracy || 0), 0);
    return sum / modelValues.length;
  };
  
  return {
    averageAccuracy: calculateAverageAccuracy(),
    
    averageConfidence: metrics?.prediction_data?.confidence || 0,
    
    totalRequests: metrics?.recent_requests?.length || 0,
    
    successRate: metrics?.recent_requests ? 
      metrics.recent_requests.filter(req => req.success).length / metrics.recent_requests.length
      : 0,
    
    currentAlgorithm: metrics?.current_algorithm || 'unknown',
    
    modelCount: models ? Object.keys(models).length : 0,
    
    isAIEnabled: metrics?.enabled || false,
  };
}

/**
 * Hook to fetch AI geographic metrics
 */
export function useAIGeoMetrics(refreshInterval: number = 10000) {
  return useQuery({
    queryKey: [AI_QUERY_KEYS.metrics, 'geo'],
    queryFn: () => aiApiClient.getAIGeoMetrics(),
    refetchInterval: refreshInterval,
    staleTime: 5000,
    gcTime: 60000,
    retry: 2,
    meta: {
      errorMessage: 'Failed to fetch AI geographic metrics',
    },
  });
}

/**
 * Custom hook for real-time AI status
 */
export function useAIStatus() {
  const { data: health, isLoading: healthLoading } = useAIHealth();
  const { data: metrics, isLoading: metricsLoading } = useAIMetrics();
  const { data: models, isLoading: modelsLoading } = useModelStatus();
  
  const isLoading = healthLoading || metricsLoading || modelsLoading;
  
  const status = {
    overall: 'unknown' as 'healthy' | 'warning' | 'error' | 'unknown',
    ai_enabled: metrics?.enabled || false,
    models_active: models ? Object.keys(models).length : 0,
    last_prediction: health?.last_prediction || 'never',
    current_confidence: metrics?.prediction_data?.confidence || 0,
  };
  
  // Determine overall status
  if (!isLoading) {
    if (!status.ai_enabled) {
      status.overall = 'warning';
    } else if (status.current_confidence < 0.5) {
      status.overall = 'warning';
    } else if (status.models_active === 0) {
      status.overall = 'error';
    } else {
      status.overall = 'healthy';
    }
  }
  
  return {
    ...status,
    isLoading,
  };
}

/**
 * Hook to manage AI configuration state
 */
export function useAIConfigManager() {
  const { data: config, isLoading } = useAIConfig();
  const updateConfigMutation = useUpdateAIConfig();
  
  const updateConfig = (newConfig: Partial<AIConfig>) => {
    updateConfigMutation.mutate(newConfig);
  };
  
  const toggleAI = () => {
    if (config) {
      updateConfig({ enabled: !config.enabled });
    }
  };
  
  const setConfidenceThreshold = (threshold: number) => {
    updateConfig({ confidence_threshold: threshold });
  };
  
  const setModelType = (modelType: string) => {
    updateConfig({ model_type: modelType });
  };
  
  return {
    config,
    isLoading,
    isUpdating: updateConfigMutation.isPending,
    updateConfig,
    toggleAI,
    setConfidenceThreshold,
    setModelType,
    error: updateConfigMutation.error,
  };
}
