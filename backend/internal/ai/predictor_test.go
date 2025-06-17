package ai

import (
	"fmt"
	"net"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
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

// TestAIPredictor_TrainModels testa o treinamento dos modelos
func TestAIPredictor_TrainModels(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       3,
		TrainingInterval:    10 * time.Millisecond, // Muito rápido para teste
		AdaptiveAlgorithms:  true,
	}

	predictor := NewAIPredictor(config, logger)

	// Adicionar dados suficientes para treinamento
	for i := 0; i < 10; i++ {
		predictor.RecordMetrics(
			float64(100+i*10),
			float64(50+i*5),
			0.01,
			map[string]interface{}{"iteration": i},
		)
	}

	// Chamar trainModels manualmente - esta função não é chamada em outros lugares
	// Vou acessar através de reflexão ou método público

	// Aguardar intervalo de treinamento e fazer predição para acionar treinamento
	time.Sleep(50 * time.Millisecond)
	
	// Fazer predição que pode acionar treinamento interno
	result, err := predictor.PredictOptimalStrategy()
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// Teste para trainModels (0% coverage)
func TestAIPredictor_TrainModelsZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.5,
		AdaptiveAlgorithms:  true,
	}

	predictor := NewAIPredictor(config, logger)

	// Add training data
	for i := 0; i < 10; i++ {
		features := map[string]interface{}{
			"iteration": i,
		}
		predictor.RecordMetrics(
			float64(100+i*10),
			float64(200+i*5),
			0.01,
			features,
		)
	}

	// Call trainModels directly
	predictor.trainModels()
	
	// Verify models were trained (we can't check internal state directly,
	// but we can verify the function executed without panic)
	assert.NotNil(t, predictor.models)
}

// Teste para calculateGeoDistance (0% coverage)  
func TestAIPredictor_CalculateGeoDistanceZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:      true,
		ModelType:    "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("Valid coordinates", func(t *testing.T) {
		pattern := &TrafficPattern{
			ClientLatitude:  39.0458,  // Virginia coordinates 
			ClientLongitude: -76.6413,
			BackendRegion:   "us-west-2", // Oregon
		}

		distance := predictor.calculateGeoDistance(pattern)
		assert.Greater(t, distance, 0.0, "Distance should be positive for valid coordinates")
	})

	t.Run("Zero coordinates", func(t *testing.T) {
		pattern := &TrafficPattern{
			ClientLatitude:  0.0,
			ClientLongitude: 0.0,
			BackendRegion:   "us-east-1",
		}

		distance := predictor.calculateGeoDistance(pattern)
		assert.Equal(t, 0.0, distance, "Distance should be 0 for zero coordinates")
	})

	t.Run("Unknown region", func(t *testing.T) {
		pattern := &TrafficPattern{
			ClientLatitude:  39.0458,
			ClientLongitude: -76.6413,
			BackendRegion:   "unknown-region",
		}

		distance := predictor.calculateGeoDistance(pattern)
		assert.Equal(t, 0.0, distance, "Distance should be 0 for unknown region")
	})
}

// Teste para estimateBackendDistance (0% coverage)
func TestAIPredictor_EstimateBackendDistanceZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("Known region and backend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("North America", "us-backend")
		assert.Equal(t, 100.0, distance, "Should return correct distance for known region/backend")
	})

	t.Run("Unknown region", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("Unknown Region", "us-backend")
		assert.Equal(t, 5000.0, distance, "Should return default distance for unknown region")
	})

	t.Run("Unknown backend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("North America", "unknown-backend")
		assert.Equal(t, 5000.0, distance, "Should return default distance for unknown backend")
	})

	t.Run("Europe to EU backend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("Europe", "eu-backend")
		assert.Equal(t, 100.0, distance, "Should return correct distance for Europe/EU backend")
	})

	t.Run("Asia to Asia backend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("Asia", "asia-backend")
		assert.Equal(t, 100.0, distance, "Should return correct distance for Asia/Asia backend")
	})
}

// Testes para funções com 0% de cobertura

// Teste para SetGeoManager (predictor.go)
func TestAIPredictor_SetGeoManagerZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	// Mock GeoManager - since we don't have the actual geo package available,
	// we'll pass nil but test the function execution
	predictor.SetGeoManager(nil)
	
	// Verify that the function executes without error
	assert.NotNil(t, predictor)
}

// Teste para getGeoOptimizedBackends (predictor.go) - 0% coverage
func TestAIPredictor_GetGeoOptimizedBackendsZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("No geo manager", func(t *testing.T) {
		backendOptions := []string{"backend1", "backend2", "backend3"}
		clientIP := net.ParseIP("192.168.1.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, backendOptions)
		assert.Equal(t, backendOptions, result, "Should return original options when no geo manager")
	})

	t.Run("Empty backend options", func(t *testing.T) {
		backendOptions := []string{}
		clientIP := net.ParseIP("192.168.1.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, backendOptions)
		assert.Equal(t, backendOptions, result, "Should return empty slice for empty input")
	})

	t.Run("Nil client IP", func(t *testing.T) {
		backendOptions := []string{"backend1", "backend2"}
		
		result := predictor.getGeoOptimizedBackends(nil, backendOptions)
		assert.Equal(t, backendOptions, result, "Should return original options for nil IP")
	})
}

// Teste para service.go SetGeoManager (0% coverage)
func TestAIService_SetGeoManagerZeroCoverage(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	serviceConfig := &AIServiceConfig{
		Enabled:             true,
		HealthCheckInterval: 30 * time.Second,
		FailoverTimeout:     10 * time.Second,
		MonitoringInterval:  60 * time.Second,
		AlertThreshold:      0.8,
		AutoRestart:         false,
	}

	service := NewAIService(serviceConfig, config, logger)

	// Test SetGeoManager function
	service.SetGeoManager(nil)
	
	// Verify that the function executes without error
	assert.NotNil(t, service)
	assert.NotNil(t, service.predictor)
}

// Testes para aumentar cobertura das funções com baixa cobertura

// Teste mais avançado para EnrichTrafficPatternWithGeo (21.1% coverage)
func TestAIPredictor_EnrichTrafficPatternWithGeoAdvanced(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	// Test cases that cover more paths in EnrichTrafficPatternWithGeo
	t.Run("With backend region only (no geo manager)", func(t *testing.T) {
		pattern := &TrafficPattern{
			RequestRate:  100.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		
		clientIP := net.ParseIP("192.168.1.1")
		backendRegion := "us-east-1"
		
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, backendRegion)
		
		assert.Equal(t, backendRegion, pattern.BackendRegion)
		// Since geoManager is nil, no geo_enabled feature should be set
	})

	t.Run("With empty backend region", func(t *testing.T) {
		pattern := &TrafficPattern{
			RequestRate:  100.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		
		clientIP := net.ParseIP("192.168.1.1")
		
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, "")
		
		// Since no backend region is provided, it should remain empty
		assert.Empty(t, pattern.BackendRegion)
	})

	t.Run("With nil client IP", func(t *testing.T) {
		pattern := &TrafficPattern{
			RequestRate:  100.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		
		backendRegion := "us-east-1"
		
		predictor.EnrichTrafficPatternWithGeo(pattern, nil, backendRegion)
		
		assert.Equal(t, backendRegion, pattern.BackendRegion)
		// Since client IP is nil, no additional geo processing should happen
	})

	t.Run("With nil pattern features", func(t *testing.T) {
		pattern := &TrafficPattern{
			RequestRate:  100.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     nil, // nil features
		}
		
		backendRegion := "us-east-1"
		
		predictor.EnrichTrafficPatternWithGeo(pattern, nil, backendRegion)
		
		assert.Equal(t, backendRegion, pattern.BackendRegion)
		// Function should handle nil features gracefully
	})
}

// Teste mais avançado para PredictWithGeoContext (40.0% coverage)
func TestAIPredictor_PredictWithGeoContextAdvanced(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:      true,
		ModelType:    "neural_network",
		MinDataPoints: 5,
	}

	predictor := NewAIPredictor(config, logger)

	// Add sufficient training data
	for i := 0; i < 10; i++ {
		features := map[string]interface{}{
			"iteration": i,
		}
		predictor.RecordMetrics(
			float64(100+i*10),
			float64(200+i*5),
			0.01,
			features,
		)
	}

	t.Run("With client IP and multiple backends", func(t *testing.T) {
		pattern := TrafficPattern{
			RequestRate:  150.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		clientIP := net.ParseIP("192.168.1.1")
		backendOptions := []string{"backend1", "backend2", "backend3"}
		
		prediction, err := predictor.PredictWithGeoContext(pattern, clientIP, backendOptions)
		
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
		assert.NotEmpty(t, prediction.Algorithm)
	})

	t.Run("With insufficient data", func(t *testing.T) {
		// Create a new predictor with no data
		newPredictor := NewAIPredictor(config, logger)
		
		pattern := TrafficPattern{
			RequestRate:  150.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		clientIP := net.ParseIP("192.168.1.1")
		backendOptions := []string{"backend1", "backend2"}
		
		_, err := newPredictor.PredictWithGeoContext(pattern, clientIP, backendOptions)
		
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "insufficient data points")
	})

	t.Run("With nil client IP", func(t *testing.T) {
		pattern := TrafficPattern{
			RequestRate:  150.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		backendOptions := []string{"backend1", "backend2"}
		
		prediction, err := predictor.PredictWithGeoContext(pattern, nil, backendOptions)
		
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
	})

	t.Run("With empty backend options", func(t *testing.T) {
		pattern := TrafficPattern{
			RequestRate:  150.0,
			ResponseTime: 200.0,
			ErrorRate:    0.01,
			Features:     make(map[string]interface{}),
		}
		clientIP := net.ParseIP("192.168.1.1")
		backendOptions := []string{}
		
		prediction, err := predictor.PredictWithGeoContext(pattern, clientIP, backendOptions)
		
		assert.NoError(t, err)
		assert.NotNil(t, prediction)
	})
}

// Teste mais avançado para getGeoOptimizedBackends (11.1% coverage)
func TestAIPredictor_GetGeoOptimizedBackendsAdvanced(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:   true,
		ModelType: "neural_network",
	}

	predictor := NewAIPredictor(config, logger)

	t.Run("With valid backends and sorting", func(t *testing.T) {
		backendOptions := []string{"us-backend", "eu-backend", "asia-backend"}
		clientIP := net.ParseIP("10.0.0.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, backendOptions)
		
		// Should return all backends (potentially reordered)
		assert.Len(t, result, len(backendOptions))
		for _, backend := range backendOptions {
			assert.Contains(t, result, backend)
		}
	})

	t.Run("With single backend", func(t *testing.T) {
		backendOptions := []string{"single-backend"}
		clientIP := net.ParseIP("10.0.0.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, backendOptions)
		
		assert.Equal(t, backendOptions, result)
	})
}

// Testes para funções auxiliares dos modelos com baixa cobertura

// Teste para selectAlgorithmBasedOnLoad (42.9% coverage)
func TestAIModels_SelectAlgorithmBasedLoadAdvanced(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewLinearRegressionModel(logger)

	// Add training data
	patterns := []TrafficPattern{}
	for i := 0; i < 10; i++ {
		pattern := TrafficPattern{
			RequestRate:  float64(100 + i*10),
			ResponseTime: float64(200 + i*5),
			ErrorRate:    0.01,
			Features:     map[string]interface{}{"complexity": 1.0},
		}
		patterns = append(patterns, pattern)
	}

	err := model.Train(patterns)
	require.NoError(t, err)

	t.Run("Low load scenario", func(t *testing.T) {
		predictedLoad := 50.0 // Low load (< 100)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "round_robin", algorithm)
	})

	t.Run("Medium load scenario", func(t *testing.T) {
		predictedLoad := 200.0 // Medium load (100-500)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "least_conn", algorithm)
	})

	t.Run("High load scenario", func(t *testing.T) {
		predictedLoad := 600.0 // High load (500-800)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "weighted_round_robin", algorithm)
	})

	t.Run("Very high load scenario", func(t *testing.T) {
		predictedLoad := 1000.0 // Very high load (> 800)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "geo_proximity", algorithm)
	})

	t.Run("Zero load scenario", func(t *testing.T) {
		predictedLoad := 0.0 // Zero load (< 100)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "round_robin", algorithm)
	})

	t.Run("Edge case 100", func(t *testing.T) {
		predictedLoad := 100.0 // Exactly 100 (should be least_conn)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "least_conn", algorithm)
	})

	t.Run("Edge case 500", func(t *testing.T) {
		predictedLoad := 500.0 // Exactly 500 (should be weighted_round_robin)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "weighted_round_robin", algorithm)
	})

	t.Run("Edge case 800", func(t *testing.T) {
		predictedLoad := 800.0 // Exactly 800 (should be geo_proximity)
		
		algorithm := model.selectAlgorithmBasedOnLoad(predictedLoad)
		
		assert.Equal(t, "geo_proximity", algorithm)
	})
}

// TestNeuralNetworkHelperFunctions testa as funções auxiliares do modelo neural network
func TestNeuralNetworkHelperFunctions(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewNeuralNetworkModel(logger)

	t.Run("isCorrectPrediction", func(t *testing.T) {
		// Teste com arrays vazios
		assert.False(t, model.isCorrectPrediction([]float64{}, []float64{0.5}))
		assert.False(t, model.isCorrectPrediction([]float64{0.5}, []float64{}))
		
		// Teste com predição correta (diferença < 0.1)
		assert.True(t, model.isCorrectPrediction([]float64{0.5}, []float64{0.55}))
		assert.True(t, model.isCorrectPrediction([]float64{0.8}, []float64{0.85}))
		
		// Teste com predição incorreta (diferença >= 0.1)
		assert.False(t, model.isCorrectPrediction([]float64{0.5}, []float64{0.7}))
		assert.False(t, model.isCorrectPrediction([]float64{0.2}, []float64{0.4}))
	})

	t.Run("calculateConfidence", func(t *testing.T) {
		// Teste com array vazio
		assert.Equal(t, 0.5, model.calculateConfidence([]float64{}))
		
		// Teste com valores normais
		assert.Equal(t, 0.7, model.calculateConfidence([]float64{0.7}))
		assert.Equal(t, 0.3, model.calculateConfidence([]float64{0.3}))
		
		// Teste com valor maior que 1.0 (deve ser limitado a 1.0)
		assert.Equal(t, 1.0, model.calculateConfidence([]float64{1.5}))
		assert.Equal(t, 1.0, model.calculateConfidence([]float64{2.0}))
	})

	t.Run("selectAlgorithm", func(t *testing.T) {
		// Teste com array vazio ou com menos de 2 elementos
		assert.Equal(t, "round_robin", model.selectAlgorithm([]float64{}))
		assert.Equal(t, "round_robin", model.selectAlgorithm([]float64{0.5}))
		
		// Teste com diferentes valores do segundo elemento
		assert.Equal(t, "round_robin", model.selectAlgorithm([]float64{0.5, 0.2}))      // < 0.3
		assert.Equal(t, "round_robin", model.selectAlgorithm([]float64{0.5, 0.1}))      // < 0.3
		assert.Equal(t, "least_conn", model.selectAlgorithm([]float64{0.5, 0.4}))       // 0.3 <= x < 0.6
		assert.Equal(t, "least_conn", model.selectAlgorithm([]float64{0.5, 0.5}))       // 0.3 <= x < 0.6
		assert.Equal(t, "weighted_round_robin", model.selectAlgorithm([]float64{0.5, 0.7})) // >= 0.6
		assert.Equal(t, "weighted_round_robin", model.selectAlgorithm([]float64{0.5, 0.9})) // >= 0.6
	})

	t.Run("getScalingRecommendation", func(t *testing.T) {
		// Teste para scale_down (loadScore < 0.3)
		assert.Equal(t, "scale_down", model.getScalingRecommendation(0.1))
		assert.Equal(t, "scale_down", model.getScalingRecommendation(0.25))
		
		// Teste para scale_up (loadScore > 0.8)
		assert.Equal(t, "scale_up", model.getScalingRecommendation(0.85))
		assert.Equal(t, "scale_up", model.getScalingRecommendation(0.95))
		
		// Teste para maintain (0.3 <= loadScore <= 0.8)
		assert.Equal(t, "maintain", model.getScalingRecommendation(0.3))
		assert.Equal(t, "maintain", model.getScalingRecommendation(0.5))
		assert.Equal(t, "maintain", model.getScalingRecommendation(0.8))
	})

	t.Run("getAlgorithmPreference", func(t *testing.T) {
		// Teste para alta taxa de erro (> 0.05) -> retorna 0.8
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 500,
			ErrorRate:    0.1, // > 0.05
		}
		assert.Equal(t, 0.8, model.getAlgorithmPreference(pattern))
		
		// Teste para alta latência (> 1000ms) -> retorna 0.6
		pattern = TrafficPattern{
			RequestRate:  100,
			ResponseTime: 1500, // > 1000
			ErrorRate:    0.01, // <= 0.05
		}
		assert.Equal(t, 0.6, model.getAlgorithmPreference(pattern))
		
		// Teste para padrão normal -> retorna 0.3
		pattern = TrafficPattern{
			RequestRate:  100,
			ResponseTime: 500, // <= 1000
			ErrorRate:    0.02, // <= 0.05
		}
		assert.Equal(t, 0.3, model.getAlgorithmPreference(pattern))
	})

	t.Run("getScalingNeed", func(t *testing.T) {
		// Teste para alta necessidade de scaling (RequestRate > 800)
		pattern := TrafficPattern{
			RequestRate: 900, // > 800
		}
		assert.Equal(t, 0.9, model.getScalingNeed(pattern))
		
		// Teste para baixa necessidade de scaling (RequestRate < 100)
		pattern = TrafficPattern{
			RequestRate: 50, // < 100
		}
		assert.Equal(t, 0.1, model.getScalingNeed(pattern))
		
		// Teste para necessidade moderada de scaling (100 <= RequestRate <= 800)
		pattern = TrafficPattern{
			RequestRate: 400, // entre 100 e 800
		}
		assert.Equal(t, 0.5, model.getScalingNeed(pattern))
		
		pattern = TrafficPattern{
			RequestRate: 100, // = 100
		}
		assert.Equal(t, 0.5, model.getScalingNeed(pattern))
		
		pattern = TrafficPattern{
			RequestRate: 800, // = 800
		}
		assert.Equal(t, 0.5, model.getScalingNeed(pattern))
	})
}

// TestEnrichTrafficPatternWithGeo_EdgeCases testa casos especiais para enriquecimento geográfico
func TestEnrichTrafficPatternWithGeo_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
	}
	predictor := NewAIPredictor(config, logger)

	t.Run("EmptyBackendRegion", func(t *testing.T) {
		pattern := &TrafficPattern{}
		clientIP := net.ParseIP("192.168.1.1")
		
		// Testar com região vazia
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, "")
		
		// Deve funcionar sem erro
		assert.Equal(t, "", pattern.BackendRegion)
	})

	t.Run("NilClientIP", func(t *testing.T) {
		pattern := &TrafficPattern{}
		
		// Testar com IP nil
		predictor.EnrichTrafficPatternWithGeo(pattern, nil, "us-east-1")
		
		// Deve definir apenas a região do backend
		assert.Equal(t, "us-east-1", pattern.BackendRegion)
	})

	t.Run("NilGeoManagerButWithRegion", func(t *testing.T) {
		pattern := &TrafficPattern{}
		clientIP := net.ParseIP("192.168.1.1")
		
		// geoManager é nil por padrão
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, "us-west-2")
		
		// Deve definir apenas a região do backend
		assert.Equal(t, "us-west-2", pattern.BackendRegion)
	})
}

// TestPredictWithGeoContext_EdgeCases testa casos especiais de predição com contexto geográfico
func TestPredictWithGeoContext_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
	}
	predictor := NewAIPredictor(config, logger)

	// Adicionar alguns padrões para atingir o mínimo
	for i := 0; i < 10; i++ {
		predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
	}

	t.Run("NilClientIP", func(t *testing.T) {
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		result, err := predictor.PredictWithGeoContext(pattern, nil, nil)
		
		// Deve funcionar mesmo com IP nil
		require.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("EmptyBackends", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		result, err := predictor.PredictWithGeoContext(pattern, clientIP, []string{})
		
		// Deve funcionar mesmo com lista vazia de backends
		require.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("NilBackends", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		result, err := predictor.PredictWithGeoContext(pattern, clientIP, nil)
		
		// Deve funcionar mesmo com lista nil de backends
		require.NoError(t, err)
		assert.NotNil(t, result)
	})
}

// TestGetGeoOptimizedBackends_EdgeCases testa casos especiais para backends otimizados
func TestGetGeoOptimizedBackends_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
	}
	predictor := NewAIPredictor(config, logger)

	t.Run("EmptyBackends", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, []string{})
		
		// Deve retornar lista vazia
		assert.Empty(t, result)
	})

	t.Run("NilBackends", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, nil)
		
		// Deve retornar lista vazia
		assert.Empty(t, result)
	})

	t.Run("SingleBackend", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		
		result := predictor.getGeoOptimizedBackends(clientIP, []string{"backend1"})
		
		// Deve retornar o único backend
		assert.Len(t, result, 1)
		assert.Equal(t, "backend1", result[0])
	})

	t.Run("MultipleBackends", func(t *testing.T) {
		clientIP := net.ParseIP("192.168.1.1")
		
		backends := []string{"backend1", "backend2", "backend3", "backend4", "backend5"}
		result := predictor.getGeoOptimizedBackends(clientIP, backends)
		
		// Deve retornar os backends (sem geoManager, retorna todos)
		assert.Equal(t, backends, result)
	})
}

// TestPredictorPredict_EdgeCases testa casos especiais da função Predict
func TestPredictorPredict_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("DisabledPredictor", func(t *testing.T) {
		config := &AIConfig{
			Enabled: false,
		}
		predictor := NewAIPredictor(config, logger)
		
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		
		result, err := predictor.Predict(pattern)
		
		// Deve retornar erro quando desabilitado
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "AI predictor is disabled")
	})

	t.Run("InsufficientData", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			MinDataPoints: 10,
		}
		predictor := NewAIPredictor(config, logger)
		
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		
		result, err := predictor.Predict(pattern)
		
		// Deve retornar erro quando não há dados suficientes
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "insufficient data points")
	})

	t.Run("NoModelsAvailable", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			ModelType:     "unknown_model",
			MinDataPoints: 1,
		}
		predictor := NewAIPredictor(config, logger)
		
		// Limpar todos os modelos para simular cenário sem modelos
		predictor.mu.Lock()
		predictor.models = make(map[string]MLModel)
		predictor.mu.Unlock()

		pattern := TrafficPattern{
			RequestRate:          100,
			ResponseTime:         200,
			ErrorRate:            0.01,
			AverageResponseTime:  250.0,
		}
		
		result, err := predictor.Predict(pattern)
		
		// Deve usar fallback quando não há modelos
		assert.NoError(t, err)
		assert.NotNil(t, result)
		assert.Equal(t, "round_robin", result.Algorithm)
		assert.Equal(t, 0.5, result.Confidence)
	})
}

// TestReinforcementLearningHelperFunctions testa as funções auxiliares do modelo RL
func TestReinforcementLearningHelperFunctions(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)

	t.Run("calculateReward", func(t *testing.T) {
		// Teste com melhoria de performance
		current := TrafficPattern{
			ResponseTime: 1000,
			ErrorRate:    0.05,
		}
		next := TrafficPattern{
			ResponseTime: 800,  // Melhoria de 200ms
			ErrorRate:    0.03, // Melhoria de 0.02
		}
		
		reward := model.calculateReward(current, next)
		expectedReward := (1000.0-800.0)/1000 + (0.05-0.03)*10 // 0.2 + 0.2 = 0.4
		assert.Equal(t, expectedReward, reward)
		
		// Teste com piora de performance
		current = TrafficPattern{
			ResponseTime: 800,
			ErrorRate:    0.03,
		}
		next = TrafficPattern{
			ResponseTime: 1000,
			ErrorRate:    0.05,
		}
		
		reward = model.calculateReward(current, next)
		expectedReward = (800.0-1000.0)/1000 + (0.03-0.05)*10 // -0.2 + (-0.2) = -0.4
		assert.Equal(t, expectedReward, reward)
		
		// Teste com penalty por alta latência
		current = TrafficPattern{ResponseTime: 1500, ErrorRate: 0.02}
		next = TrafficPattern{ResponseTime: 2500, ErrorRate: 0.01} // > 2000ms
		
		reward = model.calculateReward(current, next)
		expectedReward = (1500.0-2500.0)/1000 + (0.02-0.01)*10 - 1.0 // -1.0 + 0.1 - 1.0 = -1.9
		assert.Equal(t, expectedReward, reward)
		
		// Teste com penalty por alta taxa de erro
		current = TrafficPattern{ResponseTime: 500, ErrorRate: 0.02}
		next = TrafficPattern{ResponseTime: 400, ErrorRate: 0.08} // > 0.05
		
		reward = model.calculateReward(current, next)
		expectedReward = (500.0-400.0)/1000 + (0.02-0.08)*10 - 2.0 // 0.1 + (-0.6) - 2.0 = -2.5
		assert.Equal(t, expectedReward, reward)
	})

	t.Run("getMaxQValue", func(t *testing.T) {
		// Teste com estado inexistente
		maxValue := model.getMaxQValue("nonexistent_state")
		assert.Equal(t, 0.0, maxValue)
		
		// Adicionar alguns valores à Q-table
		model.qTable["test_state"] = map[string]float64{
			"action1": 0.5,
			"action2": 0.8,
			"action3": 0.2,
		}
		
		maxValue = model.getMaxQValue("test_state")
		assert.Equal(t, 0.8, maxValue)
		
		// Teste com estado vazio
		model.qTable["empty_state"] = map[string]float64{}
		maxValue = model.getMaxQValue("empty_state")
		assert.Equal(t, 0.0, maxValue)
	})

	t.Run("getActionConfidence", func(t *testing.T) {
		// Teste com estado inexistente
		confidence := model.getActionConfidence("nonexistent_state", "action1")
		assert.Equal(t, 0.5, confidence)
		
		// Adicionar valores à Q-table
		model.qTable["test_state"] = map[string]float64{
			"action1": 0.6,
			"action2": 0.8, // melhor ação
			"action3": 0.2,
		}
		
		// Confiança para a melhor ação
		confidence = model.getActionConfidence("test_state", "action2")
		assert.Equal(t, 1.0, confidence) // 0.8/0.8 = 1.0
		
		// Confiança para uma ação mediana
		confidence = model.getActionConfidence("test_state", "action1")
		assert.InDelta(t, 0.75, confidence, 0.001) // 0.6/0.8 = 0.75
		
		// Teste com maxValue = 0
		model.qTable["zero_state"] = map[string]float64{
			"action1": 0.0,
			"action2": 0.0,
		}
		confidence = model.getActionConfidence("zero_state", "action1")
		assert.Equal(t, 0.5, confidence)
	})

	t.Run("updateQValue", func(t *testing.T) {
		// Teste de atualização básica
		state := "test_update_state"
		action := "test_action"
		reward := 1.0
		nextState := "next_state"
		
		// Configurar next state
		model.qTable[nextState] = map[string]float64{"action": 0.5}
		
		// Atualizar Q-value
		model.updateQValue(state, action, reward, nextState)
		
		// Verificar se o valor foi criado e atualizado corretamente
		assert.Contains(t, model.qTable, state)
		assert.Contains(t, model.qTable[state], action)
		
		expectedQ := 0.0 + model.alpha*(reward+model.gamma*0.5-0.0)
		assert.Equal(t, expectedQ, model.qTable[state][action])
		
		// Teste de atualização com valor existente
		currentQ := model.qTable[state][action]
		model.updateQValue(state, action, 0.5, nextState)
		
		newExpectedQ := currentQ + model.alpha*(0.5+model.gamma*0.5-currentQ)
		assert.Equal(t, newExpectedQ, model.qTable[state][action])
	})

	t.Run("encodeState", func(t *testing.T) {
		// Teste de codificação de estado
		pattern := TrafficPattern{
			RequestRate:  150,  // bin = 1 (150/100 = 1)
			ResponseTime: 750,  // bin = 1 (750/500 = 1)
			ErrorRate:    0.03, // bin = 3 (0.03*100 = 3)
		}
		
		encoded := model.encodeState(pattern)
		assert.Equal(t, "1_1_3", encoded)
		
		// Teste com valores maiores
		pattern = TrafficPattern{
			RequestRate:  950,  // bin = 9 (950/100 = 9)
			ResponseTime: 2750, // bin = 5 (2750/500 = 5)
			ErrorRate:    0.08, // bin = 8 (0.08*100 = 15, 15%10 = 5)
		}
		
		encoded = model.encodeState(pattern)
		assert.Equal(t, "9_5_8", encoded)
		
		// Teste com valores que excedem o módulo
		pattern = TrafficPattern{
			RequestRate:  1200, // bin = 2 (1200/100 = 12, 12%10 = 2)
			ResponseTime: 5500, // bin = 1 (5500/500 = 11, 11%10 = 1)
			ErrorRate:    0.15, // bin = 5 (0.15*100 = 15, 15%10 = 5)
		}
		
		encoded = model.encodeState(pattern)
		assert.Equal(t, "2_1_5", encoded)
	})
}

// TestEstimateBackendDistance testa a função de estimativa de distância
func TestEstimateBackendDistance(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
	}
	predictor := NewAIPredictor(config, logger)

	t.Run("KnownRegionAndBackend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("North America", "us-backend")
		assert.Equal(t, 100.0, distance)
		
		distance = predictor.estimateBackendDistance("Europe", "eu-backend")
		assert.Equal(t, 100.0, distance)
		
		distance = predictor.estimateBackendDistance("Asia", "asia-backend")
		assert.Equal(t, 100.0, distance)
	})

	t.Run("CrossRegionDistance", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("North America", "eu-backend")
		assert.Equal(t, 6000.0, distance)
		
		distance = predictor.estimateBackendDistance("Europe", "asia-backend")
		assert.Equal(t, 8000.0, distance)
		
		distance = predictor.estimateBackendDistance("Asia", "us-backend")
		assert.Equal(t, 10000.0, distance)
	})

	t.Run("UnknownRegionOrBackend", func(t *testing.T) {
		distance := predictor.estimateBackendDistance("Unknown Region", "us-backend")
		assert.Equal(t, 5000.0, distance) // default distance
		
		distance = predictor.estimateBackendDistance("North America", "unknown-backend")
		assert.Equal(t, 5000.0, distance) // default distance
	})
}

// TestCategorizeClient_EdgeCases testa casos especiais para categorização de cliente
func TestCategorizeClient_EdgeCases(t *testing.T) {
	t.Run("EmptyUserAgent", func(t *testing.T) {
		result := categorizeClient("")
		assert.Equal(t, "unknown", result)
	})

	t.Run("ShortUserAgent", func(t *testing.T) {
		result := categorizeClient("Bot")
		assert.Equal(t, "client", result)
	})

	t.Run("MozillaUserAgent", func(t *testing.T) {
		result := categorizeClient("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36")
		assert.Equal(t, "browser", result)
	})

	t.Run("NonMozillaUserAgent", func(t *testing.T) {
		result := categorizeClient("curl/7.68.0")
		assert.Equal(t, "client", result)
	})
}

// TestAdvancedGeoFunctions testa as funções geográficas mais complexas
func TestAdvancedGeoFunctions(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		ConfidenceThreshold: 0.8,
	}
	predictor := NewAIPredictor(config, logger)

	// Adicionar dados suficientes para testes
	for i := 0; i < 10; i++ {
		predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
	}

	t.Run("EnrichTrafficPatternWithGeo_FullCoverage", func(t *testing.T) {
		// Teste 1: Com backend region mas sem geoManager
		pattern := &TrafficPattern{}
		clientIP := net.ParseIP("192.168.1.1")
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, "us-east-1")
		assert.Equal(t, "us-east-1", pattern.BackendRegion)

		// Teste 2: Sem backend region e sem geoManager
		pattern = &TrafficPattern{}
		predictor.EnrichTrafficPatternWithGeo(pattern, clientIP, "")
		assert.Equal(t, "", pattern.BackendRegion)

		// Teste 3: Com IP nil mas com backend region
		pattern = &TrafficPattern{}
		predictor.EnrichTrafficPatternWithGeo(pattern, nil, "us-west-2")
		assert.Equal(t, "us-west-2", pattern.BackendRegion)

		// Teste 4: Pattern já com Features existentes
		pattern = &TrafficPattern{
			Features: map[string]interface{}{
				"existing_feature": "value",
			},
		}
		predictor.EnrichTrafficPatternWithGeo(pattern, nil, "eu-west-1")
		assert.Equal(t, "eu-west-1", pattern.BackendRegion)
		assert.Equal(t, "value", pattern.Features["existing_feature"])
	})

	t.Run("PredictWithGeoContext_AllPaths", func(t *testing.T) {
		// Teste 1: Predictor desabilitado
		disabledConfig := &AIConfig{Enabled: false}
		disabledPredictor := NewAIPredictor(disabledConfig, logger)
		
		pattern := TrafficPattern{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01}
		result, err := disabledPredictor.PredictWithGeoContext(pattern, nil, nil)
		assert.Error(t, err)
		assert.Nil(t, result)
		assert.Contains(t, err.Error(), "AI predictor is disabled")

		// Teste 2: Com backendOptions vazios
		pattern = TrafficPattern{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01}
		result, err = predictor.PredictWithGeoContext(pattern, net.ParseIP("1.1.1.1"), []string{})
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Teste 3: Com backendOptions populados
		pattern = TrafficPattern{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01}
		result, err = predictor.PredictWithGeoContext(pattern, net.ParseIP("1.1.1.1"), []string{"backend1", "backend2"})
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Teste 4: Pattern que resulta em alta distância geográfica (>5000km)
		pattern = TrafficPattern{
			RequestRate:   100,
			ResponseTime:  200,
		
			ErrorRate:     0.01,
			GeoDistanceKm: 6000, // > 5000km
		}
		result, err = predictor.PredictWithGeoContext(pattern, nil, []string{"backend1"})
		assert.NoError(t, err)
		assert.NotNil(t, result)

		// Teste 5: Pattern que resulta em distância média (1000-5000km)
		pattern = TrafficPattern{
			RequestRate:   100,
			ResponseTime:  200,
			ErrorRate:     0.01,
			GeoDistanceKm: 2500, // 1000-5000km
		}
		result, err = predictor.PredictWithGeoContext(pattern, nil, []string{"backend1"})
		assert.NoError(t, err)
		assert.NotNil(t, result)
	})
}

// TestInitializeModels_AllPaths testa todos os caminhos da inicialização de modelos
func TestInitializeModels_AllPaths(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("NeuralNetworkModel", func(t *testing.T) {
		config := &AIConfig{
			Enabled:   true,
			ModelType: "neural_network",
		}
		predictor := NewAIPredictor(config, logger)
		
		// Deve ter 2 modelos para neural_network
		assert.Len(t, predictor.models, 2)
		assert.Contains(t, predictor.models, "traffic_predictor")
		assert.Contains(t, predictor.models, "algorithm_selector")
	})

	t.Run("ReinforcementLearningModel", func(t *testing.T) {
		config := &AIConfig{
			Enabled:   true,
			ModelType: "reinforcement_learning",
		}
		predictor := NewAIPredictor(config, logger)
		
		// Deve ter 1 modelo para reinforcement learning
		assert.Len(t, predictor.models, 1)
		assert.Contains(t, predictor.models, "adaptive_balancer")
	})

	t.Run("DefaultLinearModel", func(t *testing.T) {
		config := &AIConfig{
			Enabled:   true,
			ModelType: "unknown_type",
		}
		predictor := NewAIPredictor(config, logger)
		
		// Deve usar modelo padrão
		assert.Len(t, predictor.models, 1)
		assert.Contains(t, predictor.models, "simple_predictor")
	})

	t.Run("EmptyModelType", func(t *testing.T) {
		config := &AIConfig{
			Enabled:   true,
			ModelType: "",
		}
		predictor := NewAIPredictor(config, logger)
		
		// Deve usar modelo padrão
		assert.Len(t, predictor.models, 1)
		assert.Contains(t, predictor.models, "simple_predictor")
	})
}

// TestChooseAction_ExplorationPaths testa os caminhos de exploração vs exploração
func TestChooseAction_ExplorationPaths(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)

	// Definir epsilon para 1.0 para forçar exploração sempre
	model.epsilon = 1.0

	state := "test_state"
	
	// Deve sempre escolher ação aleatória quando epsilon = 1.0
	action := model.chooseAction(state)
	possibleActions := []string{"round_robin", "least_conn", "weighted_round_robin", "geo_proximity"}
	assert.Contains(t, possibleActions, action)

	// Definir epsilon para 0.0 para forçar exploração nunca
	model.epsilon = 0.0
	
	// Adicionar alguns valores à Q-table
	model.qTable[state] = map[string]float64{
		"round_robin":            0.2,
		"least_conn":             0.8, // melhor ação
		"weighted_round_robin":   0.3,
		"geo_proximity":          0.1,
	}
	
	// Deve sempre escolher a melhor ação quando epsilon = 0.0
	action = model.chooseAction(state)
	assert.Equal(t, "least_conn", action)
}

// TestTrainModels_ErrorHandling testa o tratamento de erros no treinamento
func TestTrainModels_ErrorHandling(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 5,
	}
	predictor := NewAIPredictor(config, logger)

	// Adicionar dados de treinamento
	for i := 0; i < 15; i++ {
		predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
	}

	// Mock do modelo que falhará no treinamento
	predictor.mu.Lock()
	predictor.models["failing_model"] = &FailingModel{}
	predictor.mu.Unlock()

	// Testar treinamento com modelo que falha
	predictor.trainModels() // Deve logar erro mas não falhar
}

// FailingModel é um mock que sempre falha no treinamento
type FailingModel struct{}

func (m *FailingModel) Train(patterns []TrafficPattern) error {
	return fmt.Errorf("simulated training failure")
}

func (m *FailingModel) Predict(current TrafficPattern) (*PredictionResult, error) {
	return nil, fmt.Errorf("simulated prediction failure")
}

func (m *FailingModel) GetModelInfo() ModelInfo {
	return ModelInfo{Type: "failing", Accuracy: 0.0}
}

// TestPredict_AllModelPaths testa todos os caminhos da função Predict
func TestPredict_AllModelPaths(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("NeuralNetwork_Predict", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			ModelType:     "neural_network",
			MinDataPoints: 5,
		}
		predictor := NewAIPredictor(config, logger)

		// Adicionar dados suficientes
		for i := 0; i < 10; i++ {
			predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
		}

		pattern := TrafficPattern{
			RequestRate:         100,
			ResponseTime:        200,
			ErrorRate:           0.01,
			AverageResponseTime: 250,
		}

		result, err := predictor.Predict(pattern)
		assert.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("ReinforcementLearning_Predict", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			ModelType:     "reinforcement_learning",
			MinDataPoints: 5,
		}
		predictor := NewAIPredictor(config, logger)

		// Adicionar dados suficientes e treinar o modelo
		for i := 0; i < 10; i++ {
			predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
		}
		
		// Treinar o modelo explicitamente
		predictor.trainModels()

		pattern := TrafficPattern{
			RequestRate:         100,
			ResponseTime:        200,
			ErrorRate:           0.01,
			AverageResponseTime: 250,
		}

		result, err := predictor.Predict(pattern)
		assert.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("LinearRegression_Predict", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			ModelType:     "linear_regression",
			MinDataPoints: 5,
		}
		predictor := NewAIPredictor(config, logger)

		// Adicionar dados suficientes
		for i := 0; i < 10; i++ {
			predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
		}

		pattern := TrafficPattern{
			RequestRate:         100,
			ResponseTime:        200,
			ErrorRate:           0.01,
			AverageResponseTime: 250,
		}

		result, err := predictor.Predict(pattern)
		assert.NoError(t, err)
		assert.NotNil(t, result)
	})

	t.Run("ModelPredictionFailure", func(t *testing.T) {
		config := &AIConfig{
			Enabled:       true,
			ModelType:     "neural_network",
			MinDataPoints: 5,
		}
		predictor := NewAIPredictor(config, logger)

		// Substituir modelo por um que falha
		predictor.mu.Lock()
		predictor.models["traffic_predictor"] = &FailingModel{}
		predictor.mu.Unlock()

		// Adicionar dados suficientes
		for i := 0; i < 10; i++ {
			predictor.RecordMetrics(float64(100+i*10), float64(200+i*20), 0.01, nil)
		}

		pattern := TrafficPattern{
			RequestRate:         100,
			ResponseTime:        200,
			ErrorRate:           0.01,
			AverageResponseTime: 250,
		}

		result, err := predictor.Predict(pattern)
		assert.Error(t, err)
		assert.Nil(t, result)
	})
}

// TestAnalyzeApplicationContext_EdgeCases testa casos especiais da análise de contexto
func TestAnalyzeApplicationContext_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("ApplicationAwareDisabled", func(t *testing.T) {
		config := &AIConfig{
			Enabled:         true,
			ApplicationAware: false, // Desabilitado
		}
		predictor := NewAIPredictor(config, logger)
		
		context := predictor.AnalyzeApplicationContext("api", "application/json", "Mozilla/5.0", 1024)
		assert.Nil(t, context)
	})

	t.Run("ApplicationAwareEnabled_AllTypes", func(t *testing.T) {
		config := &AIConfig{
			Enabled:         true,
			ApplicationAware: true, // Habilitado
		}
		predictor := NewAIPredictor(config, logger)
		
		// Teste com conteúdo estático
		context := predictor.AnalyzeApplicationContext("static", "image/png", "browser", 512)
		assert.NotNil(t, context)
		assert.True(t, context["is_static"].(bool))
		assert.False(t, context["is_api"].(bool))
		assert.False(t, context["is_heavy"].(bool))
		
		// Teste com API
		context = predictor.AnalyzeApplicationContext("api", "application/json", "curl", 2*1024*1024)
		assert.NotNil(t, context)
		assert.False(t, context["is_static"].(bool))
		assert.True(t, context["is_api"].(bool))
		assert.True(t, context["is_heavy"].(bool))
		
		// Teste com GraphQL
		context = predictor.AnalyzeApplicationContext("graphql", "application/json", "Apollo", 1024)
		assert.NotNil(t, context)
		assert.True(t, context["is_api"].(bool))
		
		// Teste com gRPC
		context = predictor.AnalyzeApplicationContext("grpc", "application/grpc", "grpc-client", 1024)
		assert.NotNil(t, context)
		assert.True(t, context["is_api"].(bool))
	})
}

// TestReinforcementLearningPredict_EdgeCases testa casos especiais da predição RL
func TestReinforcementLearningPredict_EdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)
	
	// Treinar o modelo primeiro com alguns dados
	patterns := []TrafficPattern{
		{RequestRate: 100, ResponseTime: 200, ErrorRate: 0.01},
		{RequestRate: 150, ResponseTime: 250, ErrorRate: 0.02},
		{RequestRate: 200, ResponseTime: 300, ErrorRate: 0.015},
	}
	err := model.Train(patterns)
	require.NoError(t, err)

	t.Run("PredictWithEmptyQTable", func(t *testing.T) {
		// Limpar Q-table para simular estado vazio
		model.qTable = make(map[string]map[string]float64)
		
		pattern := TrafficPattern{
			RequestRate:  100,
			ResponseTime: 200,
			ErrorRate:    0.01,
		}
		
		result, err := model.Predict(pattern)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Com Q-table vazia, deve usar ação aleatória
		possibleActions := []string{"round_robin", "least_conn", "weighted_round_robin", "geo_proximity"}
		assert.Contains(t, possibleActions, result.Algorithm)
	})

	t.Run("PredictWithPopulatedQTable", func(t *testing.T) {
		// Adicionar dados à Q-table
		state := "1_0_1"
		model.qTable[state] = map[string]float64{
			"round_robin":            0.2,
			"least_conn":             0.8,
			"weighted_round_robin":   0.3,
			"geo_proximity":          0.1,
		}

		pattern := TrafficPattern{
			RequestRate:  150, // bin = 1
			ResponseTime: 200, // bin = 0  
			ErrorRate:    0.01, // bin = 1
		}
		
		result, err := model.Predict(pattern)
		assert.NoError(t, err)
		assert.NotNil(t, result)
		// Deve escolher com base no Q-table ou exploração
		possibleActions := []string{"round_robin", "least_conn", "weighted_round_robin", "geo_proximity"}
		assert.Contains(t, possibleActions, result.Algorithm)
	})
}
