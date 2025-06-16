package ratelimit

import (
	"net"
	"testing"
	"time"

	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/stretchr/testify/assert"
)

func TestNew(t *testing.T) {
	t.Run("DefaultConfig", func(t *testing.T) {
		cfg := config.RateLimitConfig{}
		limiter := New(cfg)

		assert.NotNil(t, limiter)
		assert.Equal(t, 100, limiter.rps)               // default value
		assert.Equal(t, 200, limiter.burst)             // default value
		assert.Equal(t, 5*time.Minute, limiter.cleanup) // default value
		assert.Nil(t, limiter.redis)
	})

	t.Run("CustomConfig", func(t *testing.T) {
		cfg := config.RateLimitConfig{
			RequestsPerSecond: 50,
			BurstSize:         100,
			CleanupInterval:   10 * time.Minute,
		}
		limiter := New(cfg)

		assert.NotNil(t, limiter)
		assert.Equal(t, 50, limiter.rps)
		assert.Equal(t, 100, limiter.burst)
		assert.Equal(t, 10*time.Minute, limiter.cleanup)
		assert.Nil(t, limiter.redis)
	})

	// Skip Redis test since it would require an actual Redis server
	t.Run("WithRedis", func(t *testing.T) {
		cfg := config.RateLimitConfig{
			RedisAddress: "", // Intentionally empty to skip actual connection
		}
		limiter := New(cfg)
		assert.NotNil(t, limiter)
	})
}

func TestAllow(t *testing.T) {
	t.Run("DisabledLimiter", func(t *testing.T) {
		cfg := config.RateLimitConfig{
			RequestsPerSecond: 0, // Disabled
		}
		limiter := New(cfg)

		ip := net.ParseIP("192.168.1.1")
		assert.True(t, limiter.Allow(ip))
	})

	t.Run("BasicRateLimiting", func(t *testing.T) {
		cfg := config.RateLimitConfig{
			RequestsPerSecond: 2,
			BurstSize:         2,
		}
		limiter := New(cfg)

		ip := net.ParseIP("192.168.1.2")

		// Should allow the first 2 requests (burst size)
		assert.True(t, limiter.Allow(ip))
		assert.True(t, limiter.Allow(ip))

		// Should reject the third rapid request
		assert.False(t, limiter.Allow(ip))

		// Wait for token refill
		time.Sleep(501 * time.Millisecond)

		// Should allow another request after waiting
		assert.True(t, limiter.Allow(ip))
	})

	t.Run("DifferentIPs", func(t *testing.T) {
		cfg := config.RateLimitConfig{
			RequestsPerSecond: 1,
			BurstSize:         1,
		}
		limiter := New(cfg)

		ip1 := net.ParseIP("192.168.1.3")
		ip2 := net.ParseIP("192.168.1.4")

		// Both IPs should be allowed initially
		assert.True(t, limiter.Allow(ip1))
		assert.True(t, limiter.Allow(ip2))

		// Both should be rate limited now
		assert.False(t, limiter.Allow(ip1))
		assert.False(t, limiter.Allow(ip2))
	})
}

// Note: The cleanupRoutine is not easily testable since it runs in a goroutine indefinitely.
// In a real-world scenario, you might want to make the cleanup mechanism more testable
// by exposing a method to trigger cleanup or by making it more injectable.
