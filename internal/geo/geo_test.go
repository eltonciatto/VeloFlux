package geo

import (
	"fmt"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"go.uber.org/zap"
)

func setupTestGeoManager(t *testing.T, enabled bool) *Manager {
	logger, err := zap.NewDevelopment()
	require.NoError(t, err)

	cfg := &config.Config{
		Global: config.GlobalConfig{
			GeoIP: config.GeoIPConfig{
				Enabled:      enabled,
				DatabasePath: "", // No actual database for tests
			},
		},
	}

	manager := &Manager{
		config:     cfg,
		logger:     logger,
		enabled:    enabled,
		locations:  make(map[string]Location),
		backendLoc: make(map[string]Location),
	}

	return manager
}

func TestNew(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("DisabledGeoIP", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      false,
					DatabasePath: "",
				},
			},
		}

		manager, err := New(cfg, logger)
		assert.NoError(t, err)
		assert.False(t, manager.enabled)
		assert.Nil(t, manager.reader)
	})

	t.Run("InvalidDatabasePath", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      true,
					DatabasePath: "/nonexistent/path/to/database.mmdb",
				},
			},
		}

		manager, err := New(cfg, logger)
		assert.Error(t, err)
		assert.False(t, manager.enabled)
		assert.Nil(t, manager.reader)
	})
}

func TestClose(t *testing.T) {
	manager := setupTestGeoManager(t, false)
	assert.NoError(t, manager.Close())
}

func TestAddBackendLocation(t *testing.T) {
	manager := setupTestGeoManager(t, true)

	// Add a backend
	manager.AddBackendLocation("192.168.1.1:8080", "NA", 37.7749, -122.4194)

	// Verify it was added
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	loc, exists := manager.backendLoc["192.168.1.1:8080"]
	assert.True(t, exists)
	assert.Equal(t, 37.7749, loc.Latitude)
	assert.Equal(t, -122.4194, loc.Longitude)
	assert.Equal(t, "NA", loc.Region)
}

func TestRemoveBackendLocation(t *testing.T) {
	manager := setupTestGeoManager(t, true)

	// Add a backend
	manager.AddBackendLocation("192.168.1.1:8080", "NA", 37.7749, -122.4194)

	// Remove it
	manager.RemoveBackendLocation("192.168.1.1:8080")

	// Verify it was removed
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	_, exists := manager.backendLoc["192.168.1.1:8080"]
	assert.False(t, exists)
}

func TestGetClientLocation(t *testing.T) {
	manager := setupTestGeoManager(t, false)

	// Test with GeoIP disabled
	req := httptest.NewRequest("GET", "/", nil)
	_, err := manager.GetClientLocation(req)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "GeoIP not enabled")
}

func TestFindClosestBackend(t *testing.T) {
	manager := setupTestGeoManager(t, true)

	// Add some backend locations
	manager.AddBackendLocation("backend1:8080", "NA", 37.7749, -122.4194) // San Francisco
	manager.AddBackendLocation("backend2:8080", "EU", 51.5074, -0.1278)   // London
	manager.AddBackendLocation("backend3:8080", "AS", 35.6762, 139.6503)  // Tokyo

	// Skip actual tests that depend on real GeoIP database
	t.Skip("Skipping test that requires a real GeoIP database")

	t.Run("DisabledGeoIP", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Disable GeoIP
		manager.enabled = false

		// Try to find closest backend
		_, err := manager.FindClosestBackend(req, []string{"backend1:8080", "backend2:8080", "backend3:8080"})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "GeoIP not enabled")
	})

	t.Run("SingleBackend", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Enable GeoIP
		manager.enabled = true

		// Try to find closest backend with only one option
		backend, err := manager.FindClosestBackend(req, []string{"backend1:8080"})
		assert.NoError(t, err)
		assert.Equal(t, "backend1:8080", backend)
	})

	t.Run("MultipleBackends", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Enable GeoIP
		manager.enabled = true

		// Try to find closest backend with multiple options
		backend, err := manager.FindClosestBackend(req, []string{"backend1:8080", "backend2:8080", "backend3:8080"})
		assert.NoError(t, err)
		assert.Equal(t, "backend1:8080", backend) // San Francisco is closest to Los Angeles
	})

	t.Run("NoBackends", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"
		manager.enabled = true

		_, err := manager.FindClosestBackend(req, []string{})
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "no backends available")
	})

	t.Run("FallbackToFirst", func(t *testing.T) {
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"
		manager.enabled = true

		// No location info for these backends
		backend, err := manager.FindClosestBackend(req, []string{"unknown1:8080", "unknown2:8080"})
		assert.NoError(t, err)
		assert.Equal(t, "unknown1:8080", backend) // Falls back to first
	})
}

func TestGetRegionBackends(t *testing.T) {
	manager := setupTestGeoManager(t, true)

	// Add some backend locations
	manager.AddBackendLocation("backend1:8080", "NA", 37.7749, -122.4194) // San Francisco
	manager.AddBackendLocation("backend2:8080", "EU", 51.5074, -0.1278)   // London
	manager.AddBackendLocation("backend3:8080", "NA", 40.7128, -74.0060)  // New York
	
	// Skip actual tests that depend on real GeoIP database
	t.Skip("Skipping test that requires a real GeoIP database")

	t.Run("DisabledGeoIP", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Disable GeoIP
		manager.enabled = false

		// Should return all backends when disabled
		backends, err := manager.GetRegionBackends(req, []string{"backend1:8080", "backend2:8080", "backend3:8080"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"backend1:8080", "backend2:8080", "backend3:8080"}, backends)
	})

	t.Run("SameRegion", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Enable GeoIP
		manager.enabled = true

		// Should return NA backends for client in NA
		backends, err := manager.GetRegionBackends(req, []string{"backend1:8080", "backend2:8080", "backend3:8080"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"backend1:8080", "backend3:8080"}, backends)
	})
}

func TestHaversineDistance(t *testing.T) {
	// Test cases with known distances
	testCases := []struct {
		name     string
		lat1     float64
		lon1     float64
		lat2     float64
		lon2     float64
		expected float64
	}{
		{
			name:     "SamePoint",
			lat1:     37.7749,
			lon1:     -122.4194,
			lat2:     37.7749,
			lon2:     -122.4194,
			expected: 0,
		},
		{
			name:     "SF_To_NY",
			lat1:     37.7749,
			lon1:     -122.4194, // San Francisco
			lat2:     40.7128,
			lon2:     -74.0060, // New York
			expected: 4130, // approximate distance in km
			// Allow for some variation in the calculation
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			distance := haversineDistance(tc.lat1, tc.lon1, tc.lat2, tc.lon2)
			
			if tc.expected == 0 {
				assert.Equal(t, tc.expected, distance)
			} else {
				// Allow for small variations in the calculation (±5%)
				tolerance := tc.expected * 0.05
				assert.True(t, math.Abs(distance-tc.expected) < tolerance,
					"Expected distance around %.2f km, got %.2f km", tc.expected, distance)
			}
		})
	}
}

func TestToRadians(t *testing.T) {
	testCases := []struct {
		degrees  float64
		expected float64
	}{
		{0, 0},
		{90, math.Pi / 2},
		{180, math.Pi},
		{360, 2 * math.Pi},
	}

	for _, tc := range testCases {
		t.Run(fmt.Sprintf("%.1f_degrees", tc.degrees), func(t *testing.T) {
			radians := toRadians(tc.degrees)
			assert.InDelta(t, tc.expected, radians, 0.0001)
		})
	}
}

func TestGetClientIP(t *testing.T) {
	testCases := []struct {
		name           string
		setupRequest   func() *http.Request
		expectedIP     string
	}{
		{
			name: "XForwardedFor",
			setupRequest: func() *http.Request {
				req := httptest.NewRequest("GET", "/", nil)
				req.Header.Set("X-Forwarded-For", "192.168.1.1, 10.0.0.1, 172.16.0.1")
				return req
			},
			expectedIP: "192.168.1.1",
		},
		{
			name: "XRealIP",
			setupRequest: func() *http.Request {
				req := httptest.NewRequest("GET", "/", nil)
				req.Header.Set("X-Real-IP", "192.168.1.2")
				return req
			},
			expectedIP: "192.168.1.2",
		},
		{
			name: "RemoteAddr",
			setupRequest: func() *http.Request {
				req := httptest.NewRequest("GET", "/", nil)
				req.RemoteAddr = "192.168.1.3:12345"
				return req
			},
			expectedIP: "192.168.1.3",
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			req := tc.setupRequest()
			ip := getClientIP(req)
			assert.Equal(t, tc.expectedIP, ip)
		})
	}
}

func TestSplitString(t *testing.T) {
	testCases := []struct {
		input    string
		sep      rune
		expected []string
	}{
		{"a,b,c", ',', []string{"a", "b", "c"}},
		{"a, b, c", ',', []string{"a", "b", "c"}},
		{"", ',', []string{""}},
		{" a ", ',', []string{"a"}},
	}

	for i, tc := range testCases {
		t.Run(fmt.Sprintf("Case_%d", i), func(t *testing.T) {
			result := splitString(tc.input, tc.sep)
			assert.Equal(t, tc.expected, result)
		})
	}
}

func TestTrimString(t *testing.T) {
	testCases := []struct {
		input    string
		expected string
	}{
		{"  hello  ", "hello"},
		{"hello", "hello"},
		{"", ""},
		{" ", ""},
	}

	for i, tc := range testCases {
		t.Run(fmt.Sprintf("Case_%d", i), func(t *testing.T) {
			result := trimString(tc.input)
			assert.Equal(t, tc.expected, result)
		})
	}
}
