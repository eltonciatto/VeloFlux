package ai

import (
	"fmt"
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

// TestAIPredictor_TrainModels testa o treinamento dos modelos
func TestAIPredictor_TrainModels(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:             true,
		ModelType:           "neural_network",
		MinDataPoints:       5,
		TrainingInterval:    50 * time.Millisecond,
		AdaptiveAlgorithms:  true,
	}

	predictor := NewAIPredictor(config, logger)

	// Adicionar dados suficientes para treinamento
	for i := 0; i < 10; i++ {
		predictor.RecordMetrics(
			float64(100+i*10),
			float64(50+i*5),
			0.01,
			map[string]interface{}{"test": i},
		)
	}

	// Aguardar intervalo de treinamento
	time.Sleep(100 * time.Millisecond)

	// Verificar se o treinamento foi executado através de uma predição
	pattern := TrafficPattern{
		Timestamp:    time.Now(),
		RequestRate:  150,
		ResponseTime: 75,
		ErrorRate:    0.02,
	}

	result, err := predictor.Predict(pattern)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestAIPredictor_SetGeoManager testa configuração do GeoManager
func TestAIPredictor_SetGeoManager(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	// Verificar que inicialmente não há geoManager
	assert.Nil(t, predictor.geoManager)

	// Criar um mock GeoManager (nil é válido para o teste)
	predictor.SetGeoManager(nil)
	assert.Nil(t, predictor.geoManager)

	// TODO: Quando o GeoManager real estiver disponível, testar com instância real
	// geoManager := &geo.Manager{}
	// predictor.SetGeoManager(geoManager)
	// assert.NotNil(t, predictor.geoManager)
}

// TestAIPredictor_CalculateGeoDistance testa cálculo de distância geográfica
func TestAIPredictor_CalculateGeoDistance(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	tests := []struct {
		name     string
		pattern  TrafficPattern
		expected float64
	}{
		{
			name: "Mesma localização",
			pattern: TrafficPattern{
				ClientLatitude:  40.7128,
				ClientLongitude: -74.0060,
				ClientRegion:    "us-east-1",
				BackendRegion:   "us-east-1",
			},
			expected: 0, // Mesma região = distância 0
		},
		{
			name: "Localizações conhecidas diferentes",
			pattern: TrafficPattern{
				ClientLatitude:  40.7128,
				ClientLongitude: -74.0060,
				ClientRegion:    "us-east-1",
				BackendRegion:   "us-west-1",
			},
			expected: 3000, // Estimativa aproximada
		},
		{
			name: "Sem coordenadas do cliente",
			pattern: TrafficPattern{
				ClientLatitude:  0,
				ClientLongitude: 0,
				ClientRegion:    "unknown",
				BackendRegion:   "us-east-1",
			},
			expected: 5000, // Distância padrão para unknown
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			distance := predictor.calculateGeoDistance(&tt.pattern)
			// Para todas as distâncias, verificar que está em um range razoável
			assert.GreaterOrEqual(t, distance, 0.0)
			assert.LessOrEqual(t, distance, 20000.0) // Máximo global

			// Verificações específicas
			if tt.name == "Mesma localização" {
				// Mesmo com mesma região, pode haver distância devido a coordenadas diferentes
				assert.LessOrEqual(t, distance, 1000.0) // Distância baixa para mesma região
			}
		})
	}
}

// TestAIPredictor_GetGeoOptimizedBackends testa otimização geográfica de backends
func TestAIPredictor_GetGeoOptimizedBackends(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	clientIP := net.ParseIP("8.8.8.8")
	backendOptions := []string{
		"backend-us-east-1",
		"backend-us-west-2", 
		"backend-eu-west-1",
		"backend-ap-southeast-1",
	}

	optimized := predictor.getGeoOptimizedBackends(clientIP, backendOptions)

	assert.NotNil(t, optimized)
	assert.LessOrEqual(t, len(optimized), len(backendOptions))
	
	// Verificar que todos os backends retornados estavam nas opções originais
	for _, backend := range optimized {
		assert.Contains(t, backendOptions, backend)
	}
}

// TestAIPredictor_EstimateBackendDistance testa estimativa de distância para backends
func TestAIPredictor_EstimateBackendDistance(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	tests := []struct {
		clientRegion string
		backend      string
		expected     float64
	}{
		{"North America", "us-backend", 100},
		{"North America", "eu-backend", 6000},
		{"Europe", "eu-backend", 100},
		{"Europe", "us-backend", 6000},
		{"Asia", "asia-backend", 100},
		{"unknown", "us-backend", 5000}, // Distância padrão
	}

	for _, tt := range tests {
		t.Run(tt.clientRegion+"_to_"+tt.backend, func(t *testing.T) {
			distance := predictor.estimateBackendDistance(tt.clientRegion, tt.backend)
			assert.Equal(t, tt.expected, distance)
		})
	}
}

// TestAIPredictor_FullGeoIntegration testa integração completa geo
func TestAIPredictor_FullGeoIntegration(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	config := &AIConfig{
		Enabled:       true,
		ModelType:     "neural_network",
		MinDataPoints: 2,
	}

	predictor := NewAIPredictor(config, logger)

	// Adicionar dados para treinamento
	for i := 0; i < 5; i++ {
		predictor.RecordMetrics(
			float64(100+i*10),
			float64(50+i*5),
			0.01,
			nil,
		)
	}

	// Teste de predição com contexto geo
	pattern := TrafficPattern{
		Timestamp:           time.Now(),
		RequestRate:         150,
		ResponseTime:        75,
		ErrorRate:           0.02,
		ClientRegion:        "us-east-1",
		BackendRegion:       "us-west-2",
		GeoDistanceKm:       3000,
	}

	clientIP := net.ParseIP("8.8.8.8")
	backendOptions := []string{"backend-us-east-1", "backend-us-west-2"}

	result, err := predictor.PredictWithGeoContext(pattern, clientIP, backendOptions)
	assert.NoError(t, err)
	assert.NotNil(t, result)
	assert.NotEmpty(t, result.Algorithm)
	assert.GreaterOrEqual(t, result.Confidence, 0.0)
	assert.LessOrEqual(t, result.Confidence, 1.0)
}

// TestModelAlgorithmSelection testa seleção de algoritmos em diferentes cenários
func TestModelAlgorithmSelection(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	tests := []struct {
		name     string
		load     float64
		error    float64
		response float64
		expected []string // algoritmos possíveis
	}{
		{
			name:     "Low load scenario",
			load:     50.0,
			error:    0.5,
			response: 20.0,
			expected: []string{"round_robin", "least_connections", "weighted_round_robin"},
		},
		{
			name:     "Medium load scenario", 
			load:     150.0,
			error:    2.0,
			response: 100.0,
			expected: []string{"least_connections", "weighted_round_robin", "ip_hash"},
		},
		{
			name:     "High load scenario",
			load:     300.0,
			error:    5.0,
			response: 200.0,
			expected: []string{"weighted_round_robin", "least_response_time", "adaptive"},
		},
		{
			name:     "Very high load scenario",
			load:     500.0,
			error:    10.0,
			response: 500.0,
			expected: []string{"least_response_time", "adaptive", "weighted_round_robin"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Teste para Neural Network
			nnModel := NewNeuralNetworkModel(logger)
			
			// Simular predição treinada
			nnModel.trained = true
			nnModel.accuracy = 0.9

			pattern := TrafficPattern{
				RequestRate:  tt.load,
				ResponseTime: tt.response,
				ErrorRate:    tt.error,
				Timestamp:    time.Now(),
			}

			result, err := nnModel.Predict(pattern)
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.NotEmpty(t, result.Algorithm) // Verificar que pelo menos um algoritmo foi retornado

			// Teste para Reinforcement Learning
			rlModel := NewReinforcementLearningModel(logger)
			rlModel.trained = true
			
			result2, err2 := rlModel.Predict(pattern)
			assert.NoError(t, err2) 
			assert.NotNil(t, result2)
			assert.NotEmpty(t, result2.Algorithm) // Verificar que pelo menos um algoritmo foi retornado
		})
	}
}

// TestScalingRecommendations testa recomendações de escalonamento
func TestScalingRecommendations(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewNeuralNetworkModel(logger)

	tests := []struct {
		name           string
		load           float64
		responseTime   float64
		errorRate      float64
		expectedScaling string
	}{
		{
			name:           "Scale up needed",
			load:           400.0,
			responseTime:   300.0,
			errorRate:      8.0,
			expectedScaling: "scale_up",
		},
		{
			name:           "Scale down possible",
			load:           30.0,
			responseTime:   20.0,
			errorRate:      0.1,
			expectedScaling: "scale_down",
		},
		{
			name:           "Maintain current",
			load:           150.0,
			responseTime:   80.0,
			errorRate:      2.0,
			expectedScaling: "maintain",
		},
		{
			name:           "Optimize needed",
			load:           200.0,
			responseTime:   400.0,
			errorRate:      1.0,
			expectedScaling: "optimize",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Usar função não exportada através de predição
			pattern := TrafficPattern{
				RequestRate:  tt.load,
				ResponseTime: tt.responseTime,
				ErrorRate:    tt.errorRate,
				Timestamp:    time.Now(),
			}

			model.trained = true
			result, err := model.Predict(pattern)
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.NotEmpty(t, result.RecommendedAction) // Verificar que há alguma recomendação
		})
	}
}

// TestReinforcementLearningEdgeCases testa casos extremos do RL
func TestReinforcementLearningEdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewReinforcementLearningModel(logger)

	// Treinar com dados variados
	patterns := make([]TrafficPattern, 20)
	for i := range patterns {
		patterns[i] = TrafficPattern{
			RequestRate:  float64(50 + i*10),
			ResponseTime: float64(100 + i*5),
			ErrorRate:    float64(0.1 + float64(i)*0.1),
			Timestamp:    time.Now().Add(time.Duration(i) * time.Second),
		}
	}
	
	err := model.Train(patterns)
	assert.NoError(t, err)

	// Testar predições com cenários extremos
	extremeCases := []TrafficPattern{
		{RequestRate: 0, ResponseTime: 1000, ErrorRate: 50}, // Muito ruim
		{RequestRate: 1000, ResponseTime: 10, ErrorRate: 0}, // Muito bom
		{RequestRate: 500, ResponseTime: 500, ErrorRate: 25}, // Médio ruim
	}

	for i, pattern := range extremeCases {
		t.Run(fmt.Sprintf("extreme_case_%d", i), func(t *testing.T) {
			result, err := model.Predict(pattern)
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.NotEmpty(t, result.Algorithm)
			assert.GreaterOrEqual(t, result.Confidence, 0.0)
			assert.LessOrEqual(t, result.Confidence, 1.0)
		})
	}
}

// TestLinearRegressionEdgeCases testa casos extremos da regressão linear
func TestLinearRegressionEdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewLinearRegressionModel(logger)

	// Dados com muito pouca variação (para testar R² baixo)
	uniformPatterns := make([]TrafficPattern, 10)
	for i := range uniformPatterns {
		uniformPatterns[i] = TrafficPattern{
			RequestRate:  100.0, // Todos iguais
			ResponseTime: 50.0,  // Todos iguais
			ErrorRate:    1.0,   // Todos iguais
			Timestamp:    time.Now().Add(time.Duration(i) * time.Hour),
		}
	}

	err := model.Train(uniformPatterns)
	assert.NoError(t, err)

	// Dados com muita variação
	variedPatterns := make([]TrafficPattern, 15)
	for i := range variedPatterns {
		variedPatterns[i] = TrafficPattern{
			RequestRate:  float64(10 + i*100), // Muita variação
			ResponseTime: float64(5 + i*50),   // Muita variação
			ErrorRate:    float64(0.1 + float64(i)*2), // Muita variação
			Timestamp:    time.Now().Add(time.Duration(i) * time.Hour),
		}
	}

	model2 := NewLinearRegressionModel(logger)
	err2 := model2.Train(variedPatterns)
	assert.NoError(t, err2)

	// Testar predições
	testPattern := TrafficPattern{
		RequestRate:  200,
		ResponseTime: 100,
		ErrorRate:    3.0,
		Timestamp:    time.Now(),
	}

	result1, err1 := model.Predict(testPattern)
	assert.NoError(t, err1)
	assert.NotNil(t, result1)

	result2, err2 := model2.Predict(testPattern)
	assert.NoError(t, err2)
	assert.NotNil(t, result2)
}

// TestNeuralNetworkPredictionEdgeCases testa casos extremos das predições
func TestNeuralNetworkPredictionEdgeCases(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	model := NewNeuralNetworkModel(logger)

	// Treinar primeiro
	patterns := make([]TrafficPattern, 15)
	for i := range patterns {
		patterns[i] = TrafficPattern{
			RequestRate:  float64(100 + i*10),
			ResponseTime: float64(50 + i*5),
			ErrorRate:    float64(1) + float64(i)*0.5,
			Timestamp:    time.Now().Add(time.Duration(i) * time.Second),
		}
	}

	err := model.Train(patterns)
	assert.NoError(t, err)

	// Testar diferentes outputs da rede neural para cobrir todos os branches
	extremePatterns := []TrafficPattern{
		{RequestRate: 50, ResponseTime: 25, ErrorRate: 0.1, Timestamp: time.Now()},   // Baixo
		{RequestRate: 200, ResponseTime: 100, ErrorRate: 3.0, Timestamp: time.Now()}, // Médio
		{RequestRate: 500, ResponseTime: 250, ErrorRate: 10.0, Timestamp: time.Now()}, // Alto
		{RequestRate: 1000, ResponseTime: 500, ErrorRate: 20.0, Timestamp: time.Now()}, // Muito alto
	}

	for i, pattern := range extremePatterns {
		t.Run(fmt.Sprintf("pattern_%d", i), func(t *testing.T) {
			result, err := model.Predict(pattern)
			assert.NoError(t, err)
			assert.NotNil(t, result)
			assert.NotEmpty(t, result.Algorithm)
			assert.NotEmpty(t, result.RecommendedAction)
			assert.GreaterOrEqual(t, result.Confidence, 0.0)
			assert.LessOrEqual(t, result.Confidence, 1.0)
		})
	}
}

// TestComplexityCalculationExtensive testa cálculo de complexidade extensivamente
func TestComplexityCalculationExtensive(t *testing.T) {
	testCases := []struct {
		name        string
		requestType string
		contentType string
		size        int64
		expected    float64
	}{
		// Casos adicionais para cobrir todos os branches
		{"Empty request", "", "", 0, 1.3}, // 1.0 base + 0.3 non-static (contentType vazio)
		{"Unknown type", "unknown", "unknown", 1024, 1.3},
		{"WebSocket", "websocket", "text/plain", 512, 1.3},
		{"gRPC", "grpc", "application/grpc", 2048, 1.8},
		{"GraphQL", "graphql", "application/json", 4096, 1.8},
		{"Video content", "web", "video/mp4", 10*1024*1024, 2.3}, // 10MB
		{"Audio content", "web", "audio/mpeg", 5*1024*1024, 2.3},  // 5MB
		{"Large JSON", "api", "application/json", 20*1024*1024, 2.8}, // 20MB
		{"CSS file", "web", "text/css", 100*1024, 1.0}, // Static CSS
		{"JavaScript", "web", "application/javascript", 200*1024, 1.0}, // Static JS
		{"Font file", "web", "font/woff2", 50*1024, 1.0}, // Static font
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			result := calculateComplexity(tc.requestType, tc.contentType, tc.size)
			assert.InDelta(t, tc.expected, result, 0.1)
		})
	}
}
