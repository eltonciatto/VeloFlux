package drain

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/go-redis/redis/v8"
)

// Manager coordinates draining of a node.
type Manager struct {
	redis  *redis.Client
	nodeID string
}

func New(client *redis.Client, nodeID string) *Manager {
	if client == nil || nodeID == "" {
		return nil
	}
	return &Manager{redis: client, nodeID: nodeID}
}

func (m *Manager) keyActive() string { return fmt.Sprintf("vf:active:%s", m.nodeID) }
func (m *Manager) keyDrain() string  { return fmt.Sprintf("vf:drain:%s", m.nodeID) }

// Track increments active connection count for the duration of the request.
func (m *Manager) Track(next http.Handler) http.Handler {
	if m == nil {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		ctx := r.Context()
		m.redis.Incr(ctx, m.keyActive())
		defer m.redis.Decr(ctx, m.keyActive())
		next.ServeHTTP(w, r)
	})
}

// RefuseIfDraining returns 503 when the node is draining.
func (m *Manager) RefuseIfDraining(next http.Handler) http.Handler {
	if m == nil {
		return next
	}
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		exists, _ := m.redis.Exists(r.Context(), m.keyDrain()).Result()
		if exists == 1 {
			w.WriteHeader(http.StatusServiceUnavailable)
			return
		}
		next.ServeHTTP(w, r)
	})
}

// SetDrain marks the node for draining for the given duration.
func (m *Manager) SetDrain(ctx context.Context, ttl time.Duration) error {
	if m == nil {
		return nil
	}
	return m.redis.Set(ctx, m.keyDrain(), 1, ttl).Err()
}

// Active returns the active connection count.
func (m *Manager) Active(ctx context.Context) (int, error) {
	if m == nil {
		return 0, nil
	}
	n, err := m.redis.Get(ctx, m.keyActive()).Int()
	if err == redis.Nil {
		return 0, nil
	}
	return n, err
}
