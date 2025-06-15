package drain

import (
	"context"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/alicebob/miniredis/v2"
	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func setupTestRedis(t *testing.T) (*redis.Client, *miniredis.Miniredis, func()) {
	mr, err := miniredis.Run()
	require.NoError(t, err)

	client := redis.NewClient(&redis.Options{
		Addr: mr.Addr(),
	})

	return client, mr, func() {
		client.Close()
		mr.Close()
	}
}

func TestNew(t *testing.T) {
	client, _, cleanup := setupTestRedis(t)
	defer cleanup()

	t.Run("ValidParameters", func(t *testing.T) {
		manager := New(client, "test-node")
		assert.NotNil(t, manager)
		assert.Equal(t, client, manager.redis)
		assert.Equal(t, "test-node", manager.nodeID)
	})

	t.Run("NilClient", func(t *testing.T) {
		manager := New(nil, "test-node")
		assert.Nil(t, manager)
	})

	t.Run("EmptyNodeID", func(t *testing.T) {
		manager := New(client, "")
		assert.Nil(t, manager)
	})
}

func TestTrack(t *testing.T) {
	client, _, cleanup := setupTestRedis(t)
	defer cleanup()

	manager := New(client, "test-node")
	require.NotNil(t, manager)

	// Track if the handler was called
	handlerCalled := false

	// Create a handler that will be wrapped by Track
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	// Create the middleware
	middleware := manager.Track(handler)

	// Create a test request
	req := httptest.NewRequest(http.MethodGet, "/test", nil)
	recorder := httptest.NewRecorder()

	// Execute the middleware
	middleware.ServeHTTP(recorder, req)

	// Verify the handler was called
	assert.True(t, handlerCalled)

	// Check the response
	assert.Equal(t, http.StatusOK, recorder.Code)
	
	// Test nil manager
	var nilManager *Manager
	assert.NotPanics(t, func() {
		nilHandler := nilManager.Track(handler)
		nilHandler.ServeHTTP(recorder, req)
	})
}

func TestRefuseIfDraining(t *testing.T) {
	client, mr, cleanup := setupTestRedis(t)
	defer cleanup()

	manager := New(client, "test-node")
	require.NotNil(t, manager)

	// Create a handler that should be bypassed when draining
	handlerCalled := false
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		handlerCalled = true
		w.WriteHeader(http.StatusOK)
	})

	// Create the middleware
	middleware := manager.RefuseIfDraining(handler)

	// Test 1: Not draining
	req := httptest.NewRequest("GET", "/test", nil)
	recorder := httptest.NewRecorder()

	handlerCalled = false
	middleware.ServeHTTP(recorder, req)
	assert.True(t, handlerCalled)
	assert.Equal(t, http.StatusOK, recorder.Code)

	// Test 2: Draining
	err := mr.Set(manager.keyDrain(), "1")
	assert.NoError(t, err)

	req = httptest.NewRequest("GET", "/test", nil)
	recorder = httptest.NewRecorder()

	handlerCalled = false
	middleware.ServeHTTP(recorder, req)
	assert.False(t, handlerCalled) // Handler should not be called when draining
	assert.Equal(t, http.StatusServiceUnavailable, recorder.Code)

	// Test nil manager
	var nilManager *Manager
	assert.NotPanics(t, func() {
		nilHandler := nilManager.RefuseIfDraining(handler)
		nilHandler.ServeHTTP(recorder, req)
	})
}

func TestSetDrain(t *testing.T) {
	client, mr, cleanup := setupTestRedis(t)
	defer cleanup()

	manager := New(client, "test-node")
	require.NotNil(t, manager)

	ctx := context.Background()
	ttl := 5 * time.Second

	// Set drain
	err := manager.SetDrain(ctx, ttl)
	assert.NoError(t, err)

	// Verify drain key exists
	exists := mr.Exists(manager.keyDrain())
	assert.True(t, exists)

	// Verify TTL is set
	ttlDuration := mr.TTL(manager.keyDrain())
	assert.True(t, ttlDuration <= 5*time.Second && ttlDuration > 0)

	// Test nil manager
	var nilManager *Manager
	assert.NoError(t, nilManager.SetDrain(ctx, ttl))
}

func TestActive(t *testing.T) {
	client, mr, cleanup := setupTestRedis(t)
	defer cleanup()

	manager := New(client, "test-node")
	require.NotNil(t, manager)

	ctx := context.Background()

	// Test with no active connections
	active, err := manager.Active(ctx)
	assert.NoError(t, err)
	assert.Equal(t, 0, active)

	// Set active count
	err = mr.Set(manager.keyActive(), "42")
	assert.NoError(t, err)

	// Test with active connections
	active, err = manager.Active(ctx)
	assert.NoError(t, err)
	assert.Equal(t, 42, active)

	// Test nil manager
	var nilManager *Manager
	active, err = nilManager.Active(ctx)
	assert.NoError(t, err)
	assert.Equal(t, 0, active)
}

func TestKeyFunctions(t *testing.T) {
	client, _, cleanup := setupTestRedis(t)
	defer cleanup()

	manager := New(client, "test-node")
	require.NotNil(t, manager)

	assert.Equal(t, "vf:active:test-node", manager.keyActive())
	assert.Equal(t, "vf:drain:test-node", manager.keyDrain())
}
