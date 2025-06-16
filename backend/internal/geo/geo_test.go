package geo


import (
	"fmt"
	"math"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/oschwald/geoip2-golang"
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




// --- MOCK FOR GEOIP2 READER ---
type mockGeoIP2Reader struct {
	cityFunc func(ip net.IP) (*geoip2.City, error)
}

func (m *mockGeoIP2Reader) City(ip net.IP) (*geoip2.City, error) {
	return m.cityFunc(ip)
}
// --- END MOCK ---

func TestGetClientLocation_AllBranches(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("GeoIP disabled", func(t *testing.T) {
		manager := &Manager{
			enabled:    false,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		_, err := manager.GetClientLocation(req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "GeoIP not enabled")
	})

	t.Run("Invalid IP", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
			reader: &mockGeoIP2Reader{
				cityFunc: func(ip net.IP) (*geoip2.City, error) {
					return &geoip2.City{}, nil // Won't be called due to invalid IP
				},
			},
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "invalid:port"
		_, err := manager.GetClientLocation(req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "invalid IP address")
	})

	t.Run("Cache hit", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
			reader: &mockGeoIP2Reader{
				cityFunc: func(ip net.IP) (*geoip2.City, error) {
					return &geoip2.City{}, nil // Won't be called due to cache hit
				},
			},
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		manager.locations["1.2.3.4"] = Location{Latitude: 1, Longitude: 2, Region: "NA"}
		
		loc, err := manager.GetClientLocation(req)
		assert.NoError(t, err)
		assert.Equal(t, 1.0, loc.Latitude)
		assert.Equal(t, 2.0, loc.Longitude)
		assert.Equal(t, "NA", loc.Region)
	})

	t.Run("GeoIP lookup success", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "5.6.7.8:1234"
		
		manager.reader = &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return &geoip2.City{
					Location: func() (l struct {
						TimeZone       string `maxminddb:"time_zone"`
						Latitude       float64 `maxminddb:"latitude"`
						Longitude      float64 `maxminddb:"longitude"`
						MetroCode      uint    `maxminddb:"metro_code"`
						AccuracyRadius uint16  `maxminddb:"accuracy_radius"`
					}) {
						l.Latitude = 10.0
						l.Longitude = 20.0
						return
					}(),
					Continent: func() (c struct {
						Names     map[string]string `maxminddb:"names"`
						Code      string            `maxminddb:"code"`
						GeoNameID uint              `maxminddb:"geoname_id"`
					}) {
						c.Code = "EU"
						return
					}(),
				}, nil
			},
		}
		
		loc, err := manager.GetClientLocation(req)
		assert.NoError(t, err)
		assert.Equal(t, 10.0, loc.Latitude)
		assert.Equal(t, 20.0, loc.Longitude)
		assert.Equal(t, "EU", loc.Region)
	})

	t.Run("GeoIP lookup error", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "9.10.11.12:1234"
		
		manager.reader = &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return nil, fmt.Errorf("geoip lookup failed")
			},
		}
		
		_, err := manager.GetClientLocation(req)
		assert.Error(t, err)
		assert.Contains(t, err.Error(), "geoip lookup failed")
	})
}

func TestFindClosestBackend_AllBranches(t *testing.T) {
	manager := setupTestGeoManager(t, true)

	// 1. GeoIP not enabled
	manager.enabled = false
	req := httptest.NewRequest("GET", "/", nil)
	_, err := manager.FindClosestBackend(req, []string{"a"})
	assert.Error(t, err)
	manager.enabled = true

	// 2. GetClientLocation error
	manager.reader = nil
	_, err = manager.FindClosestBackend(req, []string{"a"})
	assert.Error(t, err)

	// 3. No backends
	manager.reader = &mockGeoIP2Reader{
		cityFunc: func(ip net.IP) (*geoip2.City, error) {
			return &geoip2.City{
				Location: geoip2.City{}.Location,
				Continent: geoip2.City{}.Continent,
			}, nil
		},
	}
	city, _ := manager.reader.(*mockGeoIP2Reader).cityFunc(nil)
	city.Location.Latitude = 1
	city.Location.Longitude = 2
	city.Continent.Code = "NA"
	_, err = manager.FindClosestBackend(req, []string{})
	assert.Error(t, err)

	// 4. Single backend
	backend, err := manager.FindClosestBackend(req, []string{"a"})
	assert.NoError(t, err)
	assert.Equal(t, "a", backend)

	// 5. Multiple backends, only one with location
	manager.backendLoc["a"] = Location{Latitude: 1, Longitude: 2, Region: "NA"}
	manager.backendLoc["b"] = Location{Latitude: 100, Longitude: 100, Region: "EU"}
	backend, err = manager.FindClosestBackend(req, []string{"a", "b"})
	assert.NoError(t, err)
	assert.Equal(t, "a", backend)

	// 6. No backend locations, fallback to first
	manager.backendLoc = map[string]Location{}
	backend, err = manager.FindClosestBackend(req, []string{"x", "y"})
	assert.NoError(t, err)
	assert.Equal(t, "x", backend)
}

func TestGetRegionBackends_AllBranches(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("GeoIP disabled", func(t *testing.T) {
		manager := &Manager{
			enabled:    false,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		backends, err := manager.GetRegionBackends(req, []string{"a", "b"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"a", "b"}, backends)
	})

	t.Run("GetClientLocation error", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			reader:     nil, // No reader causes error
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		backends, err := manager.GetRegionBackends(req, []string{"a", "b"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"a", "b"}, backends)
	})

	t.Run("Unknown region", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "1.2.3.4:5678"
		
		manager.reader = &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return &geoip2.City{
					Location: func() (l struct {
						TimeZone       string `maxminddb:"time_zone"`
						Latitude       float64 `maxminddb:"latitude"`
						Longitude      float64 `maxminddb:"longitude"`
						MetroCode      uint    `maxminddb:"metro_code"`
						AccuracyRadius uint16  `maxminddb:"accuracy_radius"`
					}) {
						l.Latitude = 1
						l.Longitude = 2
						return
					}(),
					Continent: func() (c struct {
						Names     map[string]string `maxminddb:"names"`
						Code      string            `maxminddb:"code"`
						GeoNameID uint              `maxminddb:"geoname_id"`
					}) {
						c.Code = "" // Empty region
						return
					}(),
				}, nil
			},
		}
		
		backends, err := manager.GetRegionBackends(req, []string{"a", "b"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"a", "b"}, backends)
	})

	t.Run("Region match", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "5.6.7.8:1234"
		
		// Set up mock to return "NA" region
		manager.reader = &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return &geoip2.City{
					Location: func() (l struct {
						TimeZone       string `maxminddb:"time_zone"`
						Latitude       float64 `maxminddb:"latitude"`
						Longitude      float64 `maxminddb:"longitude"`
						MetroCode      uint    `maxminddb:"metro_code"`
						AccuracyRadius uint16  `maxminddb:"accuracy_radius"`
					}) {
						l.Latitude = 1
						l.Longitude = 2
						return
					}(),
					Continent: func() (c struct {
						Names     map[string]string `maxminddb:"names"`
						Code      string            `maxminddb:"code"`
						GeoNameID uint              `maxminddb:"geoname_id"`
					}) {
						c.Code = "NA"
						return
					}(),
				}, nil
			},
		}
		
		// Set up backends with different regions
		manager.backendLoc["a"] = Location{Latitude: 1, Longitude: 2, Region: "NA"}
		manager.backendLoc["b"] = Location{Latitude: 100, Longitude: 100, Region: "EU"}
		
		backends, err := manager.GetRegionBackends(req, []string{"a", "b"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"a"}, backends) // Only "a" should match NA region
	})

	t.Run("No region match fallback", func(t *testing.T) {
		manager := &Manager{
			enabled:    true,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "9.10.11.12:1234"
		
		// Set up mock to return "AS" region
		manager.reader = &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return &geoip2.City{
					Location: func() (l struct {
						TimeZone       string `maxminddb:"time_zone"`
						Latitude       float64 `maxminddb:"latitude"`
						Longitude      float64 `maxminddb:"longitude"`
						MetroCode      uint    `maxminddb:"metro_code"`
						AccuracyRadius uint16  `maxminddb:"accuracy_radius"`
					}) {
						l.Latitude = 1
						l.Longitude = 2
						return
					}(),
					Continent: func() (c struct {
						Names     map[string]string `maxminddb:"names"`
						Code      string            `maxminddb:"code"`
						GeoNameID uint              `maxminddb:"geoname_id"`
					}) {
						c.Code = "AS"
						return
					}(),
				}, nil
			},
		}
		
		// Set up backends with different regions (none match AS)
		manager.backendLoc["a"] = Location{Region: "NA"}
		manager.backendLoc["b"] = Location{Region: "EU"}
		
		backends, err := manager.GetRegionBackends(req, []string{"a", "b"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"a", "b"}, backends) // Fallback to all
	})
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

	t.Run("BackendsWithoutLocation", func(t *testing.T) {
		manager := setupTestGeoManager(t, true)
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Enable GeoIP
		manager.enabled = true

		// Test with backends that don't have location info
		backends, err := manager.GetRegionBackends(req, []string{"unknown-backend1:8080", "unknown-backend2:8080"})
		assert.NoError(t, err)
		assert.Equal(t, []string{"unknown-backend1:8080", "unknown-backend2:8080"}, backends)
	})

	t.Run("MixedBackends", func(t *testing.T) {
		// Create test request
		req := httptest.NewRequest("GET", "/", nil)
		req.RemoteAddr = "127.0.0.1:12345"

		// Enable GeoIP
		manager.enabled = true

		// Test with a mix of backends with and without location info
		backends, err := manager.GetRegionBackends(req, []string{"backend1:8080", "unknown-backend:8080", "backend3:8080"})
		assert.NoError(t, err)
		// Should include the known backends from the same region, plus fall back to all if no region match
		assert.Contains(t, backends, "backend1:8080")
		assert.Contains(t, backends, "unknown-backend:8080")
		assert.Contains(t, backends, "backend3:8080")
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
			expected: 4130,     // approximate distance in km
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
		name         string
		setupRequest func() *http.Request
		expectedIP   string
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

func TestManagerClose(t *testing.T) {
	logger, _ := zap.NewDevelopment()
	
	t.Run("Close with nil reader", func(t *testing.T) {
		manager := &Manager{
			enabled:    false,
			reader:     nil,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		err := manager.Close()
		assert.NoError(t, err)
	})
	
	t.Run("Close with mock reader", func(t *testing.T) {
		mockReader := &mockGeoIP2Reader{
			cityFunc: func(ip net.IP) (*geoip2.City, error) {
				return &geoip2.City{}, nil
			},
		}
		
		manager := &Manager{
			enabled:    true,
			reader:     mockReader,
			locations:  make(map[string]Location),
			backendLoc: make(map[string]Location),
			logger:     logger,
		}
		
		// Since mockReader doesn't implement Close(), this tests the type assertion
		err := manager.Close()
		assert.NoError(t, err)
	})
}

func TestNew(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("GeoIP disabled by flag", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      false,
					DatabasePath: "/path/to/db",
				},
			},
		}

		manager, err := New(cfg, logger)
		assert.NoError(t, err)
		assert.NotNil(t, manager)
		assert.False(t, manager.enabled)
		assert.Nil(t, manager.reader)
	})

	t.Run("GeoIP disabled by empty database path", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      true,
					DatabasePath: "",
				},
			},
		}

		manager, err := New(cfg, logger)
		assert.NoError(t, err)
		assert.NotNil(t, manager)
		assert.False(t, manager.enabled)
		assert.Nil(t, manager.reader)
	})

	t.Run("GeoIP enabled with invalid database path", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      true,
					DatabasePath: "/nonexistent/path/to/geoip.db",
				},
			},
		}

		manager, err := New(cfg, logger)
		assert.Error(t, err)
		assert.NotNil(t, manager)
		assert.False(t, manager.enabled)
		assert.Nil(t, manager.reader)
	})

	t.Run("GeoIP enabled with mock database", func(t *testing.T) {
		cfg := &config.Config{
			Global: config.GlobalConfig{
				GeoIP: config.GeoIPConfig{
					Enabled:      true,
					DatabasePath: "/path/to/valid/db", // Will be mocked
				},
			},
		}

		// We can't test the actual database loading without a real file,
		// but we've verified the error path above
		_, err := New(cfg, logger)
		assert.Error(t, err) // Expected since the file doesn't exist
	})
}

func TestClose(t *testing.T) {
	logger, _ := zap.NewDevelopment()

	t.Run("Close with nil reader", func(t *testing.T) {
		manager := &Manager{
			reader: nil,
			logger: logger,
		}

		err := manager.Close()
		assert.NoError(t, err)
	})

	t.Run("Close with mock reader that has Close method", func(t *testing.T) {
		mockReader := &mockGeoIPReader{
			closeFunc: func() error {
				return nil
			},
		}

		manager := &Manager{
			reader: mockReader,
			logger: logger,
		}

		err := manager.Close()
		assert.NoError(t, err)
		assert.True(t, mockReader.closeCalled)
	})

	t.Run("Close with mock reader that returns error", func(t *testing.T) {
		expectedErr := fmt.Errorf("close error")
		mockReader := &mockGeoIPReader{
			closeFunc: func() error {
				return expectedErr
			},
		}

		manager := &Manager{
			reader: mockReader,
			logger: logger,
		}

		err := manager.Close()
		assert.Error(t, err)
		assert.Equal(t, expectedErr, err)
		assert.True(t, mockReader.closeCalled)
	})

	t.Run("Close with reader that doesn't implement Close", func(t *testing.T) {
		// Use the basic mockGeoIPReader without Close method
		mockReader := &basicMockGeoIPReader{}

		manager := &Manager{
			reader: mockReader,
			logger: logger,
		}

		err := manager.Close()
		assert.NoError(t, err)
	})
}

// Additional mock types for Close testing
type basicMockGeoIPReader struct{}

func (m *basicMockGeoIPReader) City(ip net.IP) (*geoip2.City, error) {
	return &geoip2.City{}, nil
}

type mockGeoIPReader struct {
	basicMockGeoIPReader
	closeFunc   func() error
	closeCalled bool
}

func (m *mockGeoIPReader) Close() error {
	m.closeCalled = true
	if m.closeFunc != nil {
		return m.closeFunc()
	}
	return nil
}
