
package balancer

import (
	"crypto/md5"
	"fmt"
	"math/rand"
	"net"
	"sort"
	"sync"
	"sync/atomic"
	"time"

	"github.com/skypilot/lb/internal/config"
)

type Algorithm string

const (
	RoundRobin      Algorithm = "round_robin"
	LeastConn       Algorithm = "least_conn"
	IPHash          Algorithm = "ip_hash"
	WeightedRoundRobin Algorithm = "weighted_round_robin"
	GeoProximity    Algorithm = "geo_proximity"
)

type Backend struct {
	Address     string
	Weight      int
	Healthy     atomic.Bool
	Connections atomic.Int64
	LastUsed    atomic.Int64
	Config      config.Backend
}

type Pool struct {
	Name      string
	Algorithm Algorithm
	Backends  []*Backend
	mu        sync.RWMutex
	counter   atomic.Uint64
}

type Balancer struct {
	pools map[string]*Pool
	mu    sync.RWMutex
}

func New() *Balancer {
	return &Balancer{
		pools: make(map[string]*Pool),
	}
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
		Name:      poolConfig.Name,
		Algorithm: Algorithm(poolConfig.Algorithm),
		Backends:  backends,
	}

	b.pools[poolConfig.Name] = pool
}

func (b *Balancer) GetBackend(poolName string, clientIP net.IP, sessionID string) (*Backend, error) {
	b.mu.RLock()
	pool, exists := b.pools[poolName]
	b.mu.RUnlock()

	if !exists {
		return nil, fmt.Errorf("pool %s not found", poolName)
	}

	return pool.selectBackend(clientIP, sessionID)
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
