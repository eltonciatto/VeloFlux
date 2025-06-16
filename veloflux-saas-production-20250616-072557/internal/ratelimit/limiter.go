package ratelimit

import (
	"net"
	"sync"
	"time"

	"context"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/go-redis/redis/v8"
	"golang.org/x/time/rate"
)

type Limiter struct {
	limiters map[string]*rate.Limiter
	mu       sync.RWMutex
	rps      int
	burst    int
	cleanup  time.Duration
	redis    *redis.Client
}

func New(config config.RateLimitConfig) *Limiter {
	l := &Limiter{
		limiters: make(map[string]*rate.Limiter),
		rps:      config.RequestsPerSecond,
		burst:    config.BurstSize,
		cleanup:  config.CleanupInterval,
	}

	if config.RedisAddress != "" {
		l.redis = redis.NewClient(&redis.Options{Addr: config.RedisAddress})
	}

	if l.rps <= 0 {
		l.rps = 100 // default
	}
	if l.burst <= 0 {
		l.burst = 200 // default
	}
	if l.cleanup <= 0 {
		l.cleanup = 5 * time.Minute // default
	}

	// Start cleanup goroutine
	go l.cleanupRoutine()

	return l
}

func (l *Limiter) Allow(ip net.IP) bool {
	if l.rps <= 0 {
		return true // rate limiting disabled
	}

	if l.redis != nil {
		key := "veloflux:rl:" + ip.String()
		count, err := l.redis.Incr(context.Background(), key).Result()
		if err != nil {
			return true
		}
		if count == 1 {
			l.redis.Expire(context.Background(), key, time.Second)
		}
		return int(count) <= l.rps
	}

	key := ip.String()

	l.mu.RLock()
	limiter, exists := l.limiters[key]
	l.mu.RUnlock()

	if !exists {
		l.mu.Lock()
		// Double check
		if limiter, exists = l.limiters[key]; !exists {
			limiter = rate.NewLimiter(rate.Limit(l.rps), l.burst)
			l.limiters[key] = limiter
		}
		l.mu.Unlock()
	}

	return limiter.Allow()
}

func (l *Limiter) cleanupRoutine() {
	if l.redis != nil {
		return
	}

	ticker := time.NewTicker(l.cleanup)
	defer ticker.Stop()

	for {
		<-ticker.C
		l.mu.Lock()
		for key, limiter := range l.limiters {
			// Remove limiters that haven't been used recently
			if limiter.TokensAt(time.Now()) >= float64(l.burst) {
				delete(l.limiters, key)
			}
		}
		l.mu.Unlock()
	}
}
