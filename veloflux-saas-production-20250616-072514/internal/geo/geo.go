package geo

import (
	"fmt"
	"math"
	"net"
	"net/http"
	"strings"
	"sync"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/oschwald/geoip2-golang"
	"go.uber.org/zap"
)

// Location represents geographic coordinates
type Location struct {
	Latitude  float64
	Longitude float64
	Region    string
}

// Backend represents a backend server with location info
type Backend struct {
	Address  string
	Location Location
}


// GeoIPCityReader is an interface for GeoIP city lookups (for testability)
type GeoIPCityReader interface {
	City(ip net.IP) (*geoip2.City, error)
}

// Manager handles GeoIP lookups and distance calculations
type Manager struct {
	config     *config.Config
	reader     GeoIPCityReader
	logger     *zap.Logger
	enabled    bool
	locations  map[string]Location // cache IP -> Location
	backendLoc map[string]Location // cache backend address -> Location
	mu         sync.RWMutex
}

// New creates a new GeoIP manager
func New(cfg *config.Config, logger *zap.Logger) (*Manager, error) {
	m := &Manager{
		config:     cfg,
		logger:     logger,
		locations:  make(map[string]Location),
		backendLoc: make(map[string]Location),
	}

	if !cfg.Global.GeoIP.Enabled || cfg.Global.GeoIP.DatabasePath == "" {
		m.enabled = false
		logger.Info("GeoIP routing disabled")
		return m, nil
	}

	// Open the GeoIP database
	reader, err := geoip2.Open(cfg.Global.GeoIP.DatabasePath)
	if err != nil {
		logger.Error("Failed to open GeoIP database", zap.Error(err))
		m.enabled = false
		return m, err
	}

	m.reader = reader // geoip2.Reader implements GeoIPCityReader
	m.enabled = true
	logger.Info("GeoIP routing enabled", zap.String("database", cfg.Global.GeoIP.DatabasePath))

	return m, nil
}

// Close shuts down the GeoIP manager
func (m *Manager) Close() error {
	if m.reader != nil {
		if closer, ok := m.reader.(interface{ Close() error }); ok {
			return closer.Close()
		}
	}
	return nil
}

// AddBackendLocation adds a backend with its location info
func (m *Manager) AddBackendLocation(address, region string, lat, lon float64) {
	m.mu.Lock()
	defer m.mu.Unlock()

	m.backendLoc[address] = Location{
		Latitude:  lat,
		Longitude: lon,
		Region:    region,
	}
}

// RemoveBackendLocation removes a backend's location info
func (m *Manager) RemoveBackendLocation(address string) {
	m.mu.Lock()
	defer m.mu.Unlock()

	delete(m.backendLoc, address)
}

// GetClientLocation gets the geographic location of a client
func (m *Manager) GetClientLocation(r *http.Request) (Location, error) {
	if !m.enabled || m.reader == nil {
		return Location{}, fmt.Errorf("GeoIP not enabled")
	}

	// Get the client IP address
	ip := getClientIP(r)
	ipAddr := net.ParseIP(ip)
	if ipAddr == nil {
		return Location{}, fmt.Errorf("invalid IP address: %s", ip)
	}

	// Check the cache first
	m.mu.RLock()
	if loc, found := m.locations[ip]; found {
		m.mu.RUnlock()
		return loc, nil
	}
	m.mu.RUnlock()

	// Lookup the IP in the GeoIP database
	record, err := m.reader.City(ipAddr)
	if err != nil {
		return Location{}, err
	}

	loc := Location{
		Latitude:  record.Location.Latitude,
		Longitude: record.Location.Longitude,
		Region:    record.Continent.Code,
	}

	// Cache the result
	m.mu.Lock()
	m.locations[ip] = loc
	m.mu.Unlock()

	return loc, nil
}

// FindClosestBackend finds the geographically closest backend
func (m *Manager) FindClosestBackend(r *http.Request, backends []string) (string, error) {
	if !m.enabled {
		return "", fmt.Errorf("GeoIP not enabled")
	}

	// Get client location
	clientLoc, err := m.GetClientLocation(r)
	if err != nil {
		return "", err
	}

	// No backends to choose from
	if len(backends) == 0 {
		return "", fmt.Errorf("no backends available")
	}

	// Only one backend, no need to calculate distances
	if len(backends) == 1 {
		return backends[0], nil
	}

	// Find closest backend
	var (
		closestBackend string
		minDistance    float64 = math.MaxFloat64
	)

	m.mu.RLock()
	defer m.mu.RUnlock()

	// Calculate distance to each backend
	for _, backend := range backends {
		backendLoc, ok := m.backendLoc[backend]
		if !ok {
			// No location info for this backend, skip it
			continue
		}

		distance := haversineDistance(
			clientLoc.Latitude, clientLoc.Longitude,
			backendLoc.Latitude, backendLoc.Longitude,
		)

		if distance < minDistance {
			minDistance = distance
			closestBackend = backend
		}
	}

	// If we found a backend, return it
	if closestBackend != "" {
		return closestBackend, nil
	}

	// Fall back to the first backend if no locations are known
	return backends[0], nil
}

// GetRegionBackends returns backends in the client's region
func (m *Manager) GetRegionBackends(r *http.Request, backends []string) ([]string, error) {
	if !m.enabled {
		return backends, nil
	}

	// Get client location
	clientLoc, err := m.GetClientLocation(r)
	if err != nil {
		return backends, nil
	}

	// If client region is unknown, return all backends
	if clientLoc.Region == "" {
		return backends, nil
	}

	// Find backends in the same region
	var regionBackends []string

	m.mu.RLock()
	defer m.mu.RUnlock()

	for _, backend := range backends {
		backendLoc, ok := m.backendLoc[backend]
		if !ok {
			continue
		}

		if backendLoc.Region == clientLoc.Region {
			regionBackends = append(regionBackends, backend)
		}
	}

	// Return region-specific backends if we found any
	if len(regionBackends) > 0 {
		return regionBackends, nil
	}

	// Fall back to all backends if none match the region
	return backends, nil
}

// haversineDistance calculates the distance between two geographic points
func haversineDistance(lat1, lon1, lat2, lon2 float64) float64 {
	// Earth radius in kilometers
	const R = 6371.0

	// Convert degrees to radians
	lat1Rad := toRadians(lat1)
	lon1Rad := toRadians(lon1)
	lat2Rad := toRadians(lat2)
	lon2Rad := toRadians(lon2)

	// Haversine formula
	dLat := lat2Rad - lat1Rad
	dLon := lon2Rad - lon1Rad
	a := math.Sin(dLat/2)*math.Sin(dLat/2) +
		math.Cos(lat1Rad)*math.Cos(lat2Rad)*math.Sin(dLon/2)*math.Sin(dLon/2)
	c := 2 * math.Atan2(math.Sqrt(a), math.Sqrt(1-a))
	distance := R * c

	return distance
}

func toRadians(deg float64) float64 {
	return deg * math.Pi / 180
}

// getClientIP gets the client's IP address from the request
func getClientIP(r *http.Request) string {
	// Check for X-Forwarded-For header
	xForwardedFor := r.Header.Get("X-Forwarded-For")
	if xForwardedFor != "" {
		// X-Forwarded-For can contain multiple IPs, use the first one
		ips := splitString(xForwardedFor, ',')
		if len(ips) > 0 {
			return trimString(ips[0])
		}
	}

	// Check for X-Real-IP header
	xRealIP := r.Header.Get("X-Real-IP")
	if xRealIP != "" {
		return xRealIP
	}

	// Fall back to RemoteAddr
	ip, _, _ := net.SplitHostPort(r.RemoteAddr)
	return ip
}

// splitString splits a string by a separator and trims spaces
func splitString(s string, sep rune) []string {
	// Handle empty string specially
	if s == "" {
		return []string{""}
	}
	
	var result []string
	var builder strings.Builder
	for _, r := range s {
		if r == sep {
			result = append(result, trimString(builder.String()))
			builder.Reset()
		} else {
			builder.WriteRune(r)
		}
	}
	if builder.Len() > 0 {
		result = append(result, trimString(builder.String()))
	}
	return result
}

// trimString removes leading and trailing spaces
func trimString(s string) string {
	return strings.TrimSpace(s)
}
