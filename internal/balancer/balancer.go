// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.com or contact contact@veloflux.com

package balancer

import (
	"crypto/md5"
	"fmt"
	"math/rand"
	"net"
	"sync"
	"sync/atomic"
	"time"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/geo"
	"net/http"
)

type Algorithm string

const (
	RoundRobin         Algorithm = "round_robin"
	LeastConn          Algorithm = "least_conn"
	IPHash             Algorithm = "ip_hash"
	WeightedRoundRobin Algorithm = "weighted_round_robin"
	GeoProximity       Algorithm = "geo_proximity"
)

type Backend struct {
	Address     string
	Weight      int
	Healthy     atomic.Bool
	Connections atomic.Int64
	LastUsed    atomic.Int64
	Config      config.Backend
	Region      string // Region for geo-routing
}

type Pool struct {
	Name           string
	Algorithm      Algorithm
	Backends       []*Backend
	mu             sync.RWMutex
	counter        atomic.Uint64
	StickySessions bool
}

type Balancer struct {
	pools      map[string]*Pool
	mu         sync.RWMutex
	geoManager *geo.Manager
	stickyMu   sync.RWMutex
	stickyMap  map[string]string // sessionID -> backend address
}

func New() *Balancer {
	return &Balancer{
		pools:     make(map[string]*Pool),
		stickyMap: make(map[string]string),
	}
}

// SetGeoManager sets the geo routing manager
func (b *Balancer) SetGeoManager(gm *geo.Manager) {
	b.geoManager = gm
}

func (b *Balancer) AddPool(poolConfig config.Pool) {
	b.mu.Lock()
	defer b.mu.Unlock()

	backends := make([]*Backend, len(poolConfig.Backends))
	for i, backendConfig := range poolConfig.Backends {
		backend := &Backend{
			Address: backendConfig.Address,
			Weight:  backendConfig.Weight,
			Config:  backendConfig,
		}
		backend.Healthy.Store(true)
		backends[i] = backend
	}

	pool := &Pool{
		Name:           poolConfig.Name,
		Algorithm:      Algorithm(poolConfig.Algorithm),
		Backends:       backends,
		StickySessions: poolConfig.StickySessions,
	}

	b.pools[poolConfig.Name] = pool
}

func (b *Balancer) GetBackend(poolName string, clientIP net.IP, sessionID string, r *http.Request) (*Backend, error) {
	b.mu.RLock()
	defer b.mu.RUnlock()

	pool, exists := b.pools[poolName]
	if !exists {
		return nil, fmt.Errorf("pool not found: %s", poolName)
	}

	pool.mu.RLock()
	defer pool.mu.RUnlock()

	// Check if there are any backends
	if len(pool.Backends) == 0 {
		return nil, fmt.Errorf("no backends available in pool: %s", poolName)
	}

	// Get only healthy backends
	var healthyBackends []*Backend
	for _, backend := range pool.Backends {
		if backend.Healthy.Load() {
			healthyBackends = append(healthyBackends, backend)
		}
	}

	// If no healthy backends, return error
	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends in pool: %s", poolName)
	}

	// Handle sticky sessions if enabled
	if pool.StickySessions && sessionID != "" {
		backend := b.getStickyBackend(pool, sessionID, healthyBackends)
		if backend != nil {
			return backend, nil
		}
	}

	// Select backend based on algorithm
	var backend *Backend

	switch pool.Algorithm {
	case RoundRobin:
		backend = b.getRoundRobinBackend(pool, healthyBackends)
	case LeastConn:
		backend = b.getLeastConnBackend(healthyBackends)
	case IPHash:
		backend = b.getIPHashBackend(clientIP, healthyBackends)
	case WeightedRoundRobin:
		backend = b.getWeightedRoundRobinBackend(pool, healthyBackends)
	case GeoProximity:
		backend = b.getGeoProximityBackend(r, healthyBackends)
	default:
		// Default to round robin
		backend = b.getRoundRobinBackend(pool, healthyBackends)
	}

	// Record sticky mapping if needed
	if pool.StickySessions && sessionID != "" {
		b.setStickyBackend(sessionID, backend.Address)
	}

	// Increment connections count
	backend.Connections.Add(1)
	backend.LastUsed.Store(time.Now().UnixNano())

	return backend, nil
}

func (p *Pool) selectBackend(clientIP net.IP, sessionID string) (*Backend, error) {
	p.mu.RLock()
	defer p.mu.RUnlock()

	healthyBackends := make([]*Backend, 0, len(p.Backends))
	for _, backend := range p.Backends {
		if backend.Healthy.Load() {
			healthyBackends = append(healthyBackends, backend)
		}
	}

	if len(healthyBackends) == 0 {
		return nil, fmt.Errorf("no healthy backends available in pool %s", p.Name)
	}

	switch p.Algorithm {
	case RoundRobin:
		return p.roundRobin(healthyBackends), nil
	case LeastConn:
		return p.leastConnections(healthyBackends), nil
	case IPHash:
		return p.ipHash(healthyBackends, clientIP), nil
	case WeightedRoundRobin:
		return p.weightedRoundRobin(healthyBackends), nil
	default:
		return p.roundRobin(healthyBackends), nil
	}
}

func (p *Pool) roundRobin(backends []*Backend) *Backend {
	index := p.counter.Add(1) % uint64(len(backends))
	backend := backends[index]
	backend.LastUsed.Store(time.Now().Unix())
	return backend
}

func (p *Pool) leastConnections(backends []*Backend) *Backend {
	var selected *Backend
	minConns := int64(^uint64(0) >> 1) // max int64

	for _, backend := range backends {
		conns := backend.Connections.Load()
		if conns < minConns {
			minConns = conns
			selected = backend
		}
	}

	selected.LastUsed.Store(time.Now().Unix())
	return selected
}

func (p *Pool) ipHash(backends []*Backend, clientIP net.IP) *Backend {
	hash := md5.Sum(clientIP)
	index := uint64(hash[0]) % uint64(len(backends))
	backend := backends[index]
	backend.LastUsed.Store(time.Now().Unix())
	return backend
}

func (p *Pool) weightedRoundRobin(backends []*Backend) *Backend {
	totalWeight := 0
	for _, backend := range backends {
		if backend.Weight > 0 {
			totalWeight += backend.Weight
		} else {
			totalWeight += 1
		}
	}

	if totalWeight == 0 {
		return p.roundRobin(backends)
	}

	r := rand.Intn(totalWeight)
	for _, backend := range backends {
		weight := backend.Weight
		if weight <= 0 {
			weight = 1
		}
		r -= weight
		if r < 0 {
			backend.LastUsed.Store(time.Now().Unix())
			return backend
		}
	}

	return backends[0]
}

func (b *Balancer) UpdateBackendHealth(poolName, backendAddress string, healthy bool) {
	b.mu.RLock()
	pool, exists := b.pools[poolName]
	b.mu.RUnlock()

	if !exists {
		return
	}

	pool.mu.Lock()
	defer pool.mu.Unlock()

	for _, backend := range pool.Backends {
		if backend.Address == backendAddress {
			backend.Healthy.Store(healthy)
			break
		}
	}
}

func (b *Balancer) IncrementConnections(poolName, backendAddress string) {
	b.mu.RLock()
	pool, exists := b.pools[poolName]
	b.mu.RUnlock()

	if !exists {
		return
	}

	pool.mu.RLock()
	defer pool.mu.RUnlock()

	for _, backend := range pool.Backends {
		if backend.Address == backendAddress {
			backend.Connections.Add(1)
			break
		}
	}
}

func (b *Balancer) DecrementConnections(poolName, backendAddress string) {
	b.mu.RLock()
	pool, exists := b.pools[poolName]
	b.mu.RUnlock()

	if !exists {
		return
	}

	pool.mu.RLock()
	defer pool.mu.RUnlock()

	for _, backend := range pool.Backends {
		if backend.Address == backendAddress {
			backend.Connections.Add(-1)
			break
		}
	}
}

func (b *Balancer) getStickyBackend(pool *Pool, sessionID string, healthyBackends []*Backend) *Backend {
	b.stickyMu.RLock()
	addr, ok := b.stickyMap[sessionID]
	b.stickyMu.RUnlock()
	if !ok {
		return nil
	}

	for _, backend := range healthyBackends {
		if backend.Address == addr {
			return backend
		}
	}

	b.stickyMu.Lock()
	delete(b.stickyMap, sessionID)
	b.stickyMu.Unlock()
	return nil
}

func (b *Balancer) setStickyBackend(sessionID, address string) {
	b.stickyMu.Lock()
	b.stickyMap[sessionID] = address
	b.stickyMu.Unlock()
}

func (b *Balancer) getRoundRobinBackend(pool *Pool, healthyBackends []*Backend) *Backend {
	index := pool.counter.Add(1) % uint64(len(healthyBackends))
	backend := healthyBackends[index]
	backend.LastUsed.Store(time.Now().UnixNano())
	return backend
}

func (b *Balancer) getLeastConnBackend(healthyBackends []*Backend) *Backend {
	var selected *Backend
	minConns := int64(^uint64(0) >> 1) // max int64

	for _, backend := range healthyBackends {
		conns := backend.Connections.Load()
		if conns < minConns {
			minConns = conns
			selected = backend
		}
	}

	selected.LastUsed.Store(time.Now().UnixNano())
	return selected
}

func (b *Balancer) getIPHashBackend(clientIP net.IP, healthyBackends []*Backend) *Backend {
	hash := md5.Sum(clientIP)
	index := uint64(hash[0]) % uint64(len(healthyBackends))
	backend := healthyBackends[index]
	backend.LastUsed.Store(time.Now().UnixNano())
	return backend
}

func (b *Balancer) getWeightedRoundRobinBackend(pool *Pool, healthyBackends []*Backend) *Backend {
	totalWeight := 0
	for _, backend := range healthyBackends {
		if backend.Weight > 0 {
			totalWeight += backend.Weight
		} else {
			totalWeight += 1
		}
	}

	if totalWeight == 0 {
		return b.getRoundRobinBackend(pool, healthyBackends)
	}

	r := rand.Intn(totalWeight)
	for _, backend := range healthyBackends {
		weight := backend.Weight
		if weight <= 0 {
			weight = 1
		}
		r -= weight
		if r < 0 {
			backend.LastUsed.Store(time.Now().UnixNano())
			return backend
		}
	}

	return healthyBackends[0]
}

func (b *Balancer) getGeoProximityBackend(r *http.Request, healthyBackends []*Backend) *Backend {
	// If geo manager isn't available, fall back to round robin
	if b.geoManager == nil || r == nil {
		return healthyBackends[rand.Intn(len(healthyBackends))]
	}

	// Get backend addresses
	var addresses []string
	addrToBackend := make(map[string]*Backend)

	for _, backend := range healthyBackends {
		addresses = append(addresses, backend.Address)
		addrToBackend[backend.Address] = backend
	}

	// Try to find closest backend
	closestAddr, err := b.geoManager.FindClosestBackend(r, addresses)
	if err != nil || closestAddr == "" {
		// Fall back to random selection on error
		return healthyBackends[rand.Intn(len(healthyBackends))]
	}

	// Return the closest backend
	if backend, ok := addrToBackend[closestAddr]; ok {
		return backend
	}

	// Fall back to random if something went wrong
	return healthyBackends[rand.Intn(len(healthyBackends))]
}

// GetPools returns all pools
func (b *Balancer) GetPools() []config.Pool {
	b.mu.RLock()
	defer b.mu.RUnlock()

	pools := make([]config.Pool, 0, len(b.pools))
	for _, pool := range b.pools {
		var backends []config.Backend
		for _, backend := range pool.Backends {
			backends = append(backends, backend.Config)
		}

		pools = append(pools, config.Pool{
			Name:           pool.Name,
			Algorithm:      string(pool.Algorithm),
			StickySessions: pool.StickySessions,
			Backends:       backends,
		})
	}

	return pools
}

// GetPool returns a specific pool by name
func (b *Balancer) GetPool(name string) *config.Pool {
	b.mu.RLock()
	defer b.mu.RUnlock()

	pool, exists := b.pools[name]
	if !exists {
		return nil
	}

	var backends []config.Backend
	for _, backend := range pool.Backends {
		backends = append(backends, backend.Config)
	}

	return &config.Pool{
		Name:           pool.Name,
		Algorithm:      string(pool.Algorithm),
		StickySessions: pool.StickySessions,
		Backends:       backends,
	}
}

// UpdatePool updates a pool's configuration
func (b *Balancer) UpdatePool(cfg config.Pool) {
	b.mu.Lock()
	defer b.mu.Unlock()

	pool, exists := b.pools[cfg.Name]
	if !exists {
		return
	}

	// Update properties that can change
	pool.Algorithm = Algorithm(cfg.Algorithm)
	pool.StickySessions = cfg.StickySessions
}

// RemovePool removes a pool
func (b *Balancer) RemovePool(name string) {
	b.mu.Lock()
	defer b.mu.Unlock()

	delete(b.pools, name)
}

// AddBackend adds a backend to a pool
func (b *Balancer) AddBackend(poolName string, cfg config.Backend) {
	b.mu.Lock()
	defer b.mu.Unlock()

	pool, exists := b.pools[poolName]
	if !exists {
		return
	}

	// Check if backend already exists
	for _, backend := range pool.Backends {
		if backend.Address == cfg.Address {
			// Update existing backend
			backend.Weight = cfg.Weight
			backend.Config = cfg
			return
		}
	}

	// Add new backend
	backend := &Backend{
		Address: cfg.Address,
		Weight:  cfg.Weight,
		Config:  cfg,
	}

	// Set as healthy by default
	backend.Healthy.Store(true)

	pool.Backends = append(pool.Backends, backend)
}

// RemoveBackend removes a backend from a pool
func (b *Balancer) RemoveBackend(poolName, address string) error {
	b.mu.Lock()
	defer b.mu.Unlock()

	pool, exists := b.pools[poolName]
	if !exists {
		return fmt.Errorf("pool not found: %s", poolName)
	}

	// Find and remove backend
	for i, backend := range pool.Backends {
		if backend.Address == address {
			// Remove this backend
			pool.Backends = append(pool.Backends[:i], pool.Backends[i+1:]...)
			return nil
		}
	}

	return fmt.Errorf("backend not found: %s", address)
}
