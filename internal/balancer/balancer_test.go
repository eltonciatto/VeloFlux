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
