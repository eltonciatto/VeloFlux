// Test utilities for AI components
import { AIMetrics, PredictionData, ModelPerformance, AIConfig } from '@/lib/aiApi';

export const mockAIMetrics: AIMetrics = {
  enabled: true,
  current_algorithm: 'neural_network',
  prediction_data: {
    recommended_algorithm: 'reinforcement_learning',
    confidence: 0.87,
    predicted_load: 1250,
    prediction_time: new Date().toISOString(),
    scaling_recommendation: 'scale_up',
    expected_load_factor: 1.4,
    predictions: Array.from({ length: 6 }, (_, i) => ({
      time: new Date(Date.now() + i * 3600000).toISOString(),
      predicted_load: 800 + Math.random() * 400,
      confidence: 0.8 + Math.random() * 0.15,
    })),
  },
  model_performance: {
    neural_network: {
      type: 'neural_network',
      accuracy: 0.92,
      last_trained: new Date(Date.now() - 86400000).toISOString(),
      version: '2.1.3',
      training_status: 'ready',
    },
    reinforcement_learning: {
      type: 'reinforcement_learning',
      accuracy: 0.89,
      last_trained: new Date(Date.now() - 172800000).toISOString(),
      version: '1.8.5',
      training_status: 'training',
    },
  },
  recent_requests: Array.from({ length: 50 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 60000).toISOString(),
    response_time: 50 + Math.random() * 200,
    algorithm_used: Math.random() > 0.5 ? 'neural_network' : 'reinforcement_learning',
    backend_selected: `backend-${Math.floor(Math.random() * 3) + 1}`,
    success: Math.random() > 0.1,
  })),
  algorithm_stats: {
    neural_network: {
      usage_count: 1250,
      avg_response_time: 125,
      success_rate: 0.96,
      last_used: new Date().toISOString(),
    },
    reinforcement_learning: {
      usage_count: 980,
      avg_response_time: 140,
      success_rate: 0.94,
      last_used: new Date(Date.now() - 300000).toISOString(),
    },
  },
  last_update: new Date().toISOString(),
};

export const mockAIConfig: AIConfig = {
  enabled: true,
  model_type: 'neural_network',
  confidence_threshold: 0.75,
  training_interval: '3600',
  prediction_window: '60',
  adaptive_algorithms: true,
  learning_rate: 0.001,
  exploration_rate: 0.1,
  algorithm_preference: 'neural_network',
  auto_scaling: true,
  max_retries: 3,
  model_version: 'latest',
  batch_size: 32,
  memory_limit: 4096,
};

export const mockModelStatus = {
  neural_network: {
    type: 'neural_network',
    accuracy: 0.92,
    last_trained: new Date(Date.now() - 86400000).toISOString(),
    version: '2.1.3',
    training_status: 'ready',
    training_progress: 100,
  },
  reinforcement_learning: {
    type: 'reinforcement_learning',
    accuracy: 0.89,
    last_trained: new Date(Date.now() - 172800000).toISOString(),
    version: '1.8.5',
    training_status: 'training',
    training_progress: 75,
  },
  ensemble: {
    type: 'ensemble',
    accuracy: 0.94,
    last_trained: new Date(Date.now() - 43200000).toISOString(),
    version: '1.2.1',
    training_status: 'ready',
    training_progress: 100,
  },
};

export const mockAIHistory = {
  accuracy_history: Array.from({ length: 20 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 300000).toISOString(),
    accuracy: 0.85 + Math.random() * 0.1,
  })),
  confidence_history: Array.from({ length: 15 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 600000).toISOString(),
    confidence: 0.8 + Math.random() * 0.15,
  })),
  algorithm_usage: Array.from({ length: 10 }, (_, i) => ({
    timestamp: new Date(Date.now() - i * 900000).toISOString(),
    algorithm: Math.random() > 0.5 ? 'neural_network' : 'reinforcement_learning',
    count: Math.floor(Math.random() * 100) + 50,
  })),
};

export const mockAIPredictions = {
  scaling_recommendation: 'scale_up',
  recommended_algorithm: 'neural_network',
  confidence: 0.87,
  expected_load_factor: 1.4,
  predictions: Array.from({ length: 24 }, (_, i) => ({
    time: new Date(Date.now() + i * 3600000).toISOString(),
    predicted_load: 800 + Math.random() * 400 + Math.sin(i / 24 * Math.PI * 2) * 200,
    confidence: 0.8 + Math.random() * 0.15,
  })),
};

// Mock data for testing components without backend
export const mockData = {
  aiMetrics: mockAIMetrics,
  aiConfig: mockAIConfig,
  modelStatus: mockModelStatus,
  aiHistory: mockAIHistory,
  aiPredictions: mockAIPredictions,
};

export default mockData;
