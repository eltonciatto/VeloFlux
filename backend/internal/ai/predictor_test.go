package ai

import (
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestAIPredictor_NewAndBasicFunctionality(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		TrainingInterval:    1 * time.Minute,
		PredictionWindow:    30 * time.Second,
		HistoryRetention:    1 * time.Hour,
		MinDataPoints:       10,
		ConfidenceThreshold: 0.7,
		AdaptiveAlgorithms:  true,
		ApplicationAware:    true,
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("Initialization", func(t *testing.T) {
		assert.NotNil(t, predictor)
		assert.True(t, predictor.learningEnabled)
		assert.NotNil(t, predictor.models)
		assert.Len(t, predictor.models, 2) // neural_network mode has 2 models
	})

	t.Run("RecordMetrics", func(t *testing.T) {
		features := map[string]interface{}{
			"pool_size":    3,
			"backend_type": "api",
		}

		predictor.RecordMetrics(100.0, 250.0, 0.02, features)

		assert.Len(t, predictor.trafficHistory, 1)
		assert.Equal(t, 100.0, predictor.trafficHistory[0].RequestRate)
		assert.Equal(t, 250.0, predictor.trafficHistory[0].ResponseTime)
		assert.Equal(t, 0.02, predictor.trafficHistory[0].ErrorRate)
	})

	t.Run("InsufficientDataPrediction", func(t *testing.T) {
		// Clear history
		predictor.trafficHistory = []TrafficPattern{}

		_, err := predictor.PredictOptimalStrategy()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "insufficient data points")
	})
}

func TestAIPredictor_PredictionWithSufficientData(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:             true,
		ModelType:           "linear_regression",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.5,
		AdaptiveAlgorithms:  true,
		ApplicationAware:    false,
	}

	predictor := NewAIPredictor(config, logger)

	// Add sufficient training data
	for i := 0; i < 10; i++ {
		features := map[string]interface{}{
			"iteration": i,
		}
		predictor.RecordMetrics(
			float64(100+i*10), // increasing request rate
			float64(200+i*5),  // increasing response time
			0.01,              // constant error rate
			features,
		)
	}

	t.Run("SuccessfulPrediction", func(t *testing.T) {
		prediction, err := predictor.PredictOptimalStrategy()

		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.NotEmpty(t, prediction.Algorithm)
		assert.GreaterOrEqual(t, prediction.Confidence, 0.0)
		assert.LessOrEqual(t, prediction.Confidence, 1.0)
		assert.Greater(t, prediction.PredictedLoad, 0.0)
	})
}

func TestAIPredictor_ApplicationContext(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:          true,
		ApplicationAware: true,
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("StaticContent", func(t *testing.T) {
		context := predictor.AnalyzeApplicationContext(
			"GET",
			"text/css",
			"Mozilla/5.0",
			1024,
		)

		assert.NotNil(t, context)
		assert.Equal(t, true, context["is_static"])
		assert.Equal(t, false, context["is_api"])
		assert.Equal(t, false, context["is_heavy"])
	})

	t.Run("APIRequest", func(t *testing.T) {
		context := predictor.AnalyzeApplicationContext(
			"api",
			"application/json",
			"curl/7.68.0",
			2048,
		)

		assert.NotNil(t, context)
		assert.Equal(t, false, context["is_static"])
		assert.Equal(t, true, context["is_api"])
		assert.Equal(t, false, context["is_heavy"])
	})

	t.Run("HeavyRequest", func(t *testing.T) {
		context := predictor.AnalyzeApplicationContext(
			"POST",
			"multipart/form-data",
			"Mozilla/5.0",
			2*1024*1024, // 2MB
		)

		assert.NotNil(t, context)
		assert.Equal(t, false, context["is_static"])
		assert.Equal(t, false, context["is_api"])
		assert.Equal(t, true, context["is_heavy"])
	})
}

func TestAIPredictor_ModelPerformance(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	performance := predictor.GetModelPerformance()

	assert.NotNil(t, performance)
	assert.Greater(t, len(performance), 0)

	for name, info := range performance {
		assert.NotEmpty(t, name)
		assert.NotEmpty(t, info.Type)
		assert.NotEmpty(t, info.Version)
		assert.GreaterOrEqual(t, info.Accuracy, 0.0)
		assert.LessOrEqual(t, info.Accuracy, 1.0)
	}
}

func TestAIPredictor_HistoryCleanup(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:          true,
		HistoryRetention: 100 * time.Millisecond, // Very short retention for testing
		MinDataPoints:    2,
	}

	predictor := NewAIPredictor(config, logger)

	// Add some old data
	oldTime := time.Now().Add(-200 * time.Millisecond)
	predictor.trafficHistory = append(predictor.trafficHistory, TrafficPattern{
		Timestamp:    oldTime,
		RequestRate:  100,
		ResponseTime: 200,
		ErrorRate:    0.01,
	})

	// Add current data
	predictor.RecordMetrics(150, 250, 0.02, nil)

	// Wait for cleanup interval
	time.Sleep(150 * time.Millisecond)

	// Add more data to trigger cleanup
	predictor.RecordMetrics(200, 300, 0.03, nil)

	// Check that old data was cleaned up
	assert.LessOrEqual(t, len(predictor.trafficHistory), 2)
	for _, pattern := range predictor.trafficHistory {
		assert.True(t, pattern.Timestamp.After(oldTime.Add(50*time.Millisecond)))
	}
}

func TestNeuralNetworkModel(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewNeuralNetworkModel(logger)

	t.Run("Initialization", func(t *testing.T) {
		assert.NotNil(t, model)
		assert.False(t, model.trained)
		assert.Equal(t, []int{4, 8, 4, 3}, model.layers)
		assert.NotNil(t, model.weights)
		assert.NotNil(t, model.biases)
	})

	t.Run("InsufficientTrainingData", func(t *testing.T) {
		patterns := []TrafficPattern{
			{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01, Timestamp: time.Now()},
		}

		err := model.Train(patterns)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "insufficient training data")
	})

	t.Run("SuccessfulTraining", func(t *testing.T) {
		patterns := make([]TrafficPattern, 15)
		for i := range patterns {
			patterns[i] = TrafficPattern{
				RequestRate:  float64(100 + i*10),
				ResponseTime: float64(200 + i*5),
				ErrorRate:    0.01,
				Timestamp:    time.Now().Add(time.Duration(i) * time.Second),
			}
		}

		err := model.Train(patterns)
		assert.NoError(t, err)
		assert.True(t, model.trained)
		assert.Greater(t, model.accuracy, 0.0)
	})

	t.Run("PredictionAfterTraining", func(t *testing.T) {
		current := TrafficPattern{
			RequestRate:  150,
			ResponseTime: 225,
			ErrorRate:    0.015,
			Timestamp:    time.Now(),
		}

		prediction, err := model.Predict(current)
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.Greater(t, prediction.PredictedLoad, 0.0)
		assert.NotEmpty(t, prediction.Algorithm)
		assert.GreaterOrEqual(t, prediction.Confidence, 0.0)
		assert.LessOrEqual(t, prediction.Confidence, 1.0)
	})

	t.Run("PredictionWithoutTraining", func(t *testing.T) {
		untrainedModel := NewNeuralNetworkModel(logger)
		current := TrafficPattern{
			RequestRate:  150,
			ResponseTime: 225,
			ErrorRate:    0.015,
			Timestamp:    time.Now(),
		}

		// Agora não deve dar erro, mas sim retornar predição básica
		prediction, err := untrainedModel.Predict(current)
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.Equal(t, "round_robin", prediction.Algorithm)
		assert.Equal(t, 0.5, prediction.Confidence)
	})

	t.Run("ModelInfo", func(t *testing.T) {
		info := model.GetModelInfo()
		assert.Equal(t, "neural_network", info.Type)
		assert.Equal(t, "1.0", info.Version)
		assert.GreaterOrEqual(t, info.Accuracy, 0.0)
		assert.LessOrEqual(t, info.Accuracy, 1.0)
	})
}

func TestReinforcementLearningModel(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)

	t.Run("Initialization", func(t *testing.T) {
		assert.NotNil(t, model)
		assert.False(t, model.trained)
		assert.Equal(t, 0.1, model.epsilon)
		assert.Equal(t, 0.1, model.alpha)
		assert.Equal(t, 0.9, model.gamma)
		assert.NotNil(t, model.qTable)
	})

	t.Run("Training", func(t *testing.T) {
		patterns := make([]TrafficPattern, 10)
		for i := range patterns {
			patterns[i] = TrafficPattern{
				RequestRate:  float64(100 + i*5),
				ResponseTime: float64(200 - i*2),               // Improving response time
				ErrorRate:    float64(0.05 - float64(i)*0.005), // Improving error rate
				Timestamp:    time.Now().Add(time.Duration(i) * time.Second),
			}
		}

		err := model.Train(patterns)
		assert.NoError(t, err)
		assert.True(t, model.trained)
		assert.Greater(t, len(model.qTable), 0)
	})

	t.Run("Prediction", func(t *testing.T) {
		current := TrafficPattern{
			RequestRate:  150,
			ResponseTime: 180,
			ErrorRate:    0.02,
			Timestamp:    time.Now(),
		}

		prediction, err := model.Predict(current)
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.NotEmpty(t, prediction.Algorithm)
		assert.GreaterOrEqual(t, prediction.Confidence, 0.0)
		assert.LessOrEqual(t, prediction.Confidence, 1.0)
	})

	t.Run("ModelInfo", func(t *testing.T) {
		info := model.GetModelInfo()
		assert.Equal(t, "reinforcement_learning", info.Type)
		assert.Equal(t, "1.0", info.Version)
		assert.Equal(t, 0.85, info.Accuracy)
	})
}

func TestLinearRegressionModel(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewLinearRegressionModel(logger)

	t.Run("Initialization", func(t *testing.T) {
		assert.NotNil(t, model)
		assert.False(t, model.trained)
		assert.Len(t, model.coefficients, 4)
	})

	t.Run("InsufficientData", func(t *testing.T) {
		patterns := []TrafficPattern{
			{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01, Timestamp: time.Now()},
		}

		err := model.Train(patterns)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "insufficient training data")
	})

	t.Run("SuccessfulTraining", func(t *testing.T) {
		patterns := make([]TrafficPattern, 10)
		for i := range patterns {
			patterns[i] = TrafficPattern{
				RequestRate:  float64(100 + i*10),
				ResponseTime: float64(200 + i*5),
				ErrorRate:    0.01,
				Timestamp:    time.Now().Add(time.Duration(i) * time.Hour), // Vary by hour
			}
		}

		err := model.Train(patterns)
		assert.NoError(t, err)
		assert.True(t, model.trained)
		assert.GreaterOrEqual(t, model.accuracy, 0.0)
		assert.LessOrEqual(t, model.accuracy, 1.0)
	})

	t.Run("Prediction", func(t *testing.T) {
		current := TrafficPattern{
			RequestRate:  150,
			ResponseTime: 225,
			ErrorRate:    0.015,
			Timestamp:    time.Now(),
		}

		prediction, err := model.Predict(current)
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.Greater(t, prediction.PredictedLoad, 0.0)
		assert.NotEmpty(t, prediction.Algorithm)
		assert.GreaterOrEqual(t, prediction.Confidence, 0.0)
		assert.LessOrEqual(t, prediction.Confidence, 1.0)
	})

	t.Run("ModelInfo", func(t *testing.T) {
		info := model.GetModelInfo()
		assert.Equal(t, "linear_regression", info.Type)
		assert.Equal(t, "1.0", info.Version)
		assert.GreaterOrEqual(t, info.Accuracy, 0.0)
		assert.LessOrEqual(t, info.Accuracy, 1.0)
	})
}

func BenchmarkNeuralNetworkPrediction(b *testing.B) {
	logger, _ := zap.NewDevelopment()
	model := NewNeuralNetworkModel(logger)

	// Train with minimal data
	patterns := make([]TrafficPattern, 15)
	for i := range patterns {
		patterns[i] = TrafficPattern{
			RequestRate:  float64(100 + i),
			ResponseTime: float64(200 + i),
			ErrorRate:    0.01,
			Timestamp:    time.Now(),
		}
	}
	model.Train(patterns)

	current := TrafficPattern{
		RequestRate:  150,
		ResponseTime: 225,
		ErrorRate:    0.015,
		Timestamp:    time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		model.Predict(current)
	}
}

func BenchmarkReinforcementLearningPrediction(b *testing.B) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)

	// Train with minimal data
	patterns := make([]TrafficPattern, 10)
	for i := range patterns {
		patterns[i] = TrafficPattern{
			RequestRate:  float64(100 + i),
			ResponseTime: float64(200 - i),
			ErrorRate:    0.01,
			Timestamp:    time.Now(),
		}
	}
	model.Train(patterns)

	current := TrafficPattern{
		RequestRate:  150,
		ResponseTime: 180,
		ErrorRate:    0.02,
		Timestamp:    time.Now(),
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		model.Predict(current)
	}
}

func TestAIPredictor_DisabledMode(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled: false,
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("DisabledLearning", func(t *testing.T) {
		assert.False(t, predictor.learningEnabled)

		// Recording metrics should not store anything
		predictor.RecordMetrics(100, 200, 0.01, nil)
		assert.Len(t, predictor.trafficHistory, 0)
	})

	t.Run("DisabledPrediction", func(t *testing.T) {
		_, err := predictor.PredictOptimalStrategy()
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "AI predictor is disabled")
	})
}

func TestComplexityCalculation(t *testing.T) {
	testCases := []struct {
		name        string
		requestType string
		contentType string
		size        int64
		expected    float64
	}{
		{
			name:        "Simple GET",
			requestType: "web",
			contentType: "text/html",
			size:        1024,
			expected:    1.3, // base + non-static
		},
		{
			name:        "API Request",
			requestType: "api",
			contentType: "application/json",
			size:        2048,
			expected:    1.8, // base + api + non-static
		},
		{
			name:        "Heavy Upload",
			requestType: "web",
			contentType: "multipart/form-data",
			size:        2 * 1024 * 1024, // 2MB
			expected:    2.3,             // base + heavy + non-static
		},
		{
			name:        "Static Content",
			requestType: "web",
			contentType: "image/png",
			size:        512,
			expected:    1.0, // base only (static content)
		},
		{
			name:        "Complex API",
			requestType: "api",
			contentType: "application/json",
			size:        5 * 1024 * 1024, // 5MB
			expected:    2.8,             // base + api + heavy + non-static
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := calculateComplexity(tc.requestType, tc.contentType, tc.size)
			assert.InDelta(t, tc.expected, result, 0.1)
		})
	}
}

// TestAIPredictor_GeoEnhanced testa funcionalidades geográficas
func TestAIPredictor_GeoEnhanced(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 3,
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("GeographicEnrichment", func(t *testing.T) {
		pattern := TrafficPattern{
			Timestamp:           time.Now(),
			RequestRate:         100.0,
			ResponseTime:        50.0,
			ErrorRate:           2.0,
			AverageResponseTime: 48.0,
		}

		clientIP := net.ParseIP("192.168.1.1")
		backendRegion := "us-east-1"

		// Enriquecer sem GeoManager
		predictor.EnrichTrafficPatternWithGeo(&pattern, clientIP, backendRegion)

		assert.Equal(t, backendRegion, pattern.BackendRegion)
		assert.Empty(t, pattern.ClientRegion) // Sem GeoManager
	})

	t.Run("GeoAffinityScore", func(t *testing.T) {
		tests := []struct {
			distance float64
			minScore float64
			maxScore float64
		}{
			{0, 1.0, 1.0},
			{500, 0.9, 1.0},
			{1500, 0.5, 0.9},
			{6000, 0.1, 0.5},
		}

		for _, test := range tests {
			pattern := TrafficPattern{GeoDistanceKm: test.distance}
			score := predictor.calculateGeoAffinityScore(pattern)
			assert.GreaterOrEqual(t, score, test.minScore)
			assert.LessOrEqual(t, score, test.maxScore)
		}
	})

	t.Run("RegionRecommendation", func(t *testing.T) {
		tests := []struct {
			distance     float64
			clientRegion string
			expected     string
		}{
			{0, "us-east-1", "current_region_optimal"},
			{800, "us-east-1", "current_setup_acceptable"},
			{2500, "us-east-1", "regional_optimization_available"},
			{6000, "eu-west-1", "consider_region_eu-west-1"},
		}

		for _, test := range tests {
			pattern := TrafficPattern{
				GeoDistanceKm: test.distance,
				ClientRegion:  test.clientRegion,
			}
			recommendation := predictor.getRegionRecommendation(pattern)
			assert.Equal(t, test.expected, recommendation)
		}
	})
}

// TestAIPredictor_ConcurrentOperations testa operações concorrentes
func TestAIPredictor_ConcurrentOperations(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	// Adicionar dados iniciais
	for i := 0; i < 5; i++ {
		pattern := TrafficPattern{
			Timestamp:           time.Now().Add(time.Duration(i) * time.Minute),
			RequestRate:         float64(100 + i*10),
			ResponseTime:        float64(50 + i*2),
			ErrorRate:           2.0,
			AverageResponseTime: float64(48 + i*2),
		}
		predictor.RecordMetrics(pattern.RequestRate, pattern.ResponseTime, pattern.ErrorRate, nil)
	}

	// Teste de concorrência
	done := make(chan bool, 20)
	errors := make(chan error, 20)

	// Predições concorrentes
	for i := 0; i < 10; i++ {
		go func(id int) {
			defer func() { done <- true }()

			pattern := TrafficPattern{
				Timestamp:           time.Now(),
				RequestRate:         float64(90 + id*5),
				ResponseTime:        float64(45 + id),
				ErrorRate:           2.0,
				AverageResponseTime: float64(43 + id),
			}

			_, err := predictor.Predict(pattern)
			if err != nil {
				errors <- err
			}
		}(i)
	}

	// Adições de dados concorrentes
	for i := 0; i < 10; i++ {
		go func(id int) {
			defer func() { done <- true }()

			pattern := TrafficPattern{
				Timestamp:           time.Now(),
				RequestRate:         float64(110 + id*3),
				ResponseTime:        float64(55 + id),
				ErrorRate:           2.5,
				AverageResponseTime: float64(53 + id),
			}

			predictor.RecordMetrics(pattern.RequestRate, pattern.ResponseTime, pattern.ErrorRate, nil)
		}(i)
	}

	// Aguardar conclusão
	for i := 0; i < 20; i++ {
		select {
		case <-done:
			// OK
		case err := <-errors:
			t.Errorf("Concurrent operation failed: %v", err)
		case <-time.After(5 * time.Second):
			t.Fatal("Timeout waiting for concurrent operations")
		}
	}

	assert.NotEmpty(t, predictor.trafficHistory)
}

// TestAIPredictor_LastPredictionTime testa timestamp da última predição
func TestAIPredictor_LastPredictionTime(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	// Timestamp inicial deve ser zero
	initialTime := predictor.GetLastPredictionTime()
	assert.True(t, initialTime.IsZero())

	// Adicionar dados e fazer predição
	for i := 0; i < 3; i++ {
		pattern := TrafficPattern{
			Timestamp:           time.Now(),
			RequestRate:         float64(100 + i*10),
			ResponseTime:        50.0,
			ErrorRate:           2.0,
			AverageResponseTime: 48.0,
		}
		predictor.RecordMetrics(pattern.RequestRate, pattern.ResponseTime, pattern.ErrorRate, nil)
	}

	testPattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         150.0,
		ResponseTime:        60.0,
		ErrorRate:           3.0,
		AverageResponseTime: 58.0,
	}

	beforePrediction := time.Now()
	_, err := predictor.Predict(testPattern)
	afterPrediction := time.Now()

	assert.NoError(t, err)

	lastTime := predictor.GetLastPredictionTime()
	assert.False(t, lastTime.Before(beforePrediction))
	assert.False(t, lastTime.After(afterPrediction))
}
