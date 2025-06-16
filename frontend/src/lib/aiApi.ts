// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

import { apiFetch } from './api';

export interface AIMetrics {
  enabled: boolean;
  current_algorithm: string;
  prediction_data?: PredictionData;
  model_performance: Record<string, ModelPerformance>;
  recent_requests: RequestMetric[];
  algorithm_stats: Record<string, AlgorithmStats>;
  last_update: string;
}

export interface PredictionData {
  recommended_algorithm: string;
  confidence: number;
  predicted_load?: number; // Optional for backward compatibility
  prediction_time?: string; // Optional for backward compatibility
  optimal_backends?: string[]; // Optional for backward compatibility
  scaling_recommendation: string;
  expected_load_factor: number;
  predictions: Array<{
    time: string;
    predicted_load: number;
    confidence: number;
  }>;
}

export interface ModelPerformance {
  type: string;
  accuracy: number;
  last_trained: string;
  version: string;
  training_status: string;
}

export interface RequestMetric {
  timestamp: string;
  response_time: number;
  algorithm_used: string;
  backend_selected: string;
  success: boolean;
}

export interface AlgorithmStats {
  usage_count: number;
  avg_response_time: number;
  success_rate: number;
  last_used: string;
}

export interface AIConfig {
  enabled: boolean;
  ai_enabled?: boolean;
  model_type: string;
  confidence_threshold: number;
  training_interval: string | number;
  prediction_window: string | number;
  adaptive_algorithms: boolean;
  learning_rate: number;
  exploration_rate: number;
  algorithm_preference?: string;
  auto_scaling?: boolean;
  max_retries?: number;
  model_version?: string;
  batch_size?: number;
  memory_limit?: number;
}

export interface ModelStatus {
  [modelName: string]: ModelPerformance;
}

class AIApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Get comprehensive AI metrics
   */
  async getAIMetrics(): Promise<AIMetrics> {
    const response = await apiFetch('/api/ai/metrics');
    return response;
  }

  /**
   * Get current AI predictions
   */
  async getAIPredictions(): Promise<{
    scaling_recommendation: string;
    recommended_algorithm: string;
    confidence: number;
    expected_load_factor: number;
    predictions: Array<{
      time: string;
      predicted_load: number;
      confidence: number;
    }>;
  }> {
    const response = await apiFetch('/api/ai/predictions');
    return response;
  }

  /**
   * Get ML model status and performance
   */
  async getModelStatus(): Promise<ModelStatus> {
    const response = await apiFetch('/api/ai/models');
    return response;
  }

  /**
   * Get AI configuration
   */
  async getAIConfig(): Promise<AIConfig> {
    const response = await apiFetch('/api/ai/config');
    return response;
  }

  /**
   * Update AI configuration
   */
  async updateAIConfig(config: Partial<any>): Promise<{ success: boolean; message: string }> {
    const response = await apiFetch('/api/ai/config', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });
    return response;
  }

  /**
   * Get AI system health
   */
  async getAIHealth(): Promise<{ status: string; models: string[]; last_prediction: string }> {
    const response = await apiFetch('/api/ai/health');
    return response;
  }

  /**
   * Trigger model retraining
   */
  async triggerModelRetraining(modelType?: string): Promise<{ success: boolean; message: string }> {
    const body = modelType ? { model_type: modelType } : {};
    const response = await apiFetch('/api/ai/retrain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    return response;
  }

  /**
   * Get historical AI performance data
   */
  async getHistoricalData(timeRange: string = '1h'): Promise<{
    accuracy_history: Array<{ timestamp: string; accuracy: number }>;
    confidence_history: Array<{ timestamp: string; confidence: number }>;
    algorithm_usage: Array<{ timestamp: string; algorithm: string; count: number }>;
  }> {
    const response = await apiFetch(`/api/ai/history?range=${timeRange}`);
    return response;
  }
}

// Create and export a singleton instance
export const aiApiClient = new AIApiClient();

// Utility functions for data processing
export const formatConfidence = (confidence: number): string => {
  return `${(confidence * 100).toFixed(1)}%`;
};

export const formatAccuracy = (accuracy: number): string => {
  return `${(accuracy * 100).toFixed(1)}%`;
};

export const getConfidenceColor = (confidence: number): string => {
  if (confidence >= 0.8) return 'text-green-600';
  if (confidence >= 0.6) return 'text-yellow-600';
  return 'text-red-600';
};

export const getAccuracyColor = (accuracy: number): string => {
  if (accuracy >= 0.9) return 'text-green-600';
  if (accuracy >= 0.7) return 'text-yellow-600';
  return 'text-red-600';
};

export const formatDuration = (duration: string): string => {
  // Convert Go duration format to human readable
  const match = duration.match(/(\d+)([a-z]+)/);
  if (!match) return duration;
  
  const value = match[1];
  const unit = match[2];
  
  switch (unit) {
    case 's': return `${value} seconds`;
    case 'm': return `${value} minutes`;
    case 'h': return `${value} hours`;
    default: return duration;
  }
};

export default aiApiClient;
