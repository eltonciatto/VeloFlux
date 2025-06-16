package balancer

import (
	"net"
	"net/http"
	"testing"

	"github.com/eltonciatto/veloflux/internal/config"
)

func TestStickySession(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:           "test",
		Algorithm:      "round_robin",
		StickySessions: true,
		Backends: []config.Backend{
			{Address: "1.1.1.1:80"},
			{Address: "2.2.2.2:80"},
		},
	}
	b.AddPool(poolCfg)

	ip := net.IPv4(127, 0, 0, 1)
	sess := "abc123"
	// First request selects a backend and records sticky mapping
	first, err := b.GetBackend("test", ip, sess, &http.Request{})
	if err != nil {
		t.Fatalf("GetBackend returned error: %v", err)
	}

	// Second request should return the same backend
	second, err := b.GetBackend("test", ip, sess, &http.Request{})
	if err != nil {
		t.Fatalf("GetBackend returned error: %v", err)
	}
	if first.Address != second.Address {
		t.Errorf("sticky backend mismatch: %s != %s", first.Address, second.Address)
	}
}

func TestRoundRobinAlgorithm(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-rr",
		Algorithm: "round_robin",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 100},
			{Address: "3.3.3.3:80", Weight: 100},
		},
	}
	b.AddPool(poolCfg)

	ip := net.IPv4(127, 0, 0, 1)
	req := &http.Request{}

	backends := make(map[string]int)

	// Test 10 requests to see distribution
	for i := 0; i < 10; i++ {
		backend, err := b.GetBackend("test-rr", ip, "", req)
		if err != nil {
			t.Fatalf("GetBackend returned error: %v", err)
		}
		backends[backend.Address]++
	}

	// Each backend should be used at least once
	for addr := range backends {
		if backends[addr] == 0 {
			t.Errorf("Backend %s was never selected", addr)
		}
	}
}

func TestLeastConnectionsAlgorithm(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-lc",
		Algorithm: "least_conn",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 100},
		},
	}
	b.AddPool(poolCfg)

	// Simulate different connection counts
	b.IncrementConnections("test-lc", "1.1.1.1:80")
	b.IncrementConnections("test-lc", "1.1.1.1:80")

	ip := net.IPv4(127, 0, 0, 1)
	req := &http.Request{}

	backend, err := b.GetBackend("test-lc", ip, "", req)
	if err != nil {
		t.Fatalf("GetBackend returned error: %v", err)
	}

	// Should select the backend with fewer connections (2.2.2.2:80)
	if backend.Address != "2.2.2.2:80" {
		t.Errorf("Expected backend 2.2.2.2:80, got %s", backend.Address)
	}
}

func TestHealthyBackendsOnly(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-health",
		Algorithm: "round_robin",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 100},
			{Address: "3.3.3.3:80", Weight: 100},
		},
	}
	b.AddPool(poolCfg)

	// Mark one backend as unhealthy
	b.UpdateBackendHealth("test-health", "2.2.2.2:80", false)

	ip := net.IPv4(127, 0, 0, 1)
	req := &http.Request{}

	backends := make(map[string]int)

	// Test multiple requests
	for i := 0; i < 10; i++ {
		backend, err := b.GetBackend("test-health", ip, "", req)
		if err != nil {
			t.Fatalf("GetBackend returned error: %v", err)
		}
		backends[backend.Address]++
	}

	// Unhealthy backend should never be selected
	if backends["2.2.2.2:80"] > 0 {
		t.Errorf("Unhealthy backend was selected %d times", backends["2.2.2.2:80"])
	}

	// Other backends should be used
	if backends["1.1.1.1:80"] == 0 || backends["3.3.3.3:80"] == 0 {
		t.Error("Healthy backends were not properly distributed")
	}
}

func TestNoHealthyBackends(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-no-healthy",
		Algorithm: "round_robin",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 100},
		},
	}
	b.AddPool(poolCfg)

	// Mark all backends as unhealthy
	b.UpdateBackendHealth("test-no-healthy", "1.1.1.1:80", false)
	b.UpdateBackendHealth("test-no-healthy", "2.2.2.2:80", false)

	ip := net.IPv4(127, 0, 0, 1)
	req := &http.Request{}

	_, err := b.GetBackend("test-no-healthy", ip, "", req)
	if err == nil {
		t.Error("Expected error when no healthy backends available")
	}
}

func TestIPHashAlgorithm(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-iphash",
		Algorithm: "ip_hash",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 100},
		},
	}
	b.AddPool(poolCfg)

	req := &http.Request{}

	// Same IP should always get same backend
	ip1 := net.IPv4(192, 168, 1, 1)
	backend1, err := b.GetBackend("test-iphash", ip1, "", req)
	if err != nil {
		t.Fatalf("GetBackend returned error: %v", err)
	}

	backend2, err := b.GetBackend("test-iphash", ip1, "", req)
	if err != nil {
		t.Fatalf("GetBackend returned error: %v", err)
	}

	if backend1.Address != backend2.Address {
		t.Errorf("IP hash should return same backend for same IP: %s != %s",
			backend1.Address, backend2.Address)
	}
}

func TestWeightedRoundRobin(t *testing.T) {
	b := New()
	poolCfg := config.Pool{
		Name:      "test-weighted",
		Algorithm: "weighted_round_robin",
		Backends: []config.Backend{
			{Address: "1.1.1.1:80", Weight: 100},
			{Address: "2.2.2.2:80", Weight: 200}, // Double weight
		},
	}
	b.AddPool(poolCfg)

	ip := net.IPv4(127, 0, 0, 1)
	req := &http.Request{}

	backends := make(map[string]int)

	// Test many requests to see weight distribution
	for i := 0; i < 300; i++ {
		backend, err := b.GetBackend("test-weighted", ip, "", req)
		if err != nil {
			t.Fatalf("GetBackend returned error: %v", err)
		}
		backends[backend.Address]++
	}

	// Backend with weight 200 should get roughly twice as many requests
	ratio := float64(backends["2.2.2.2:80"]) / float64(backends["1.1.1.1:80"])
	if ratio < 1.5 || ratio > 2.5 {
		t.Errorf("Weight distribution incorrect: ratio %.2f, expected ~2.0", ratio)
	}
}
