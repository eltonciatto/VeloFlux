package admin

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/clustering"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/go-redis/redis/v8"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// Server exposes a minimal admin API for dynamic backend management.
type Server struct {
	balancer *balancer.Balancer
	cluster  *clustering.Cluster
	redis    *redis.Client
	logger   *zap.Logger
	router   *mux.Router
	server   *http.Server
	ctx      context.Context
}

// New creates a new admin server using the cluster Redis configuration.
func New(cfg *config.Config, bal *balancer.Balancer, cl *clustering.Cluster, logger *zap.Logger) *Server {
	client := redis.NewClient(&redis.Options{
		Addr:     cfg.Cluster.RedisAddress,
		Password: cfg.Cluster.RedisPassword,
		DB:       cfg.Cluster.RedisDB,
	})

	a := &Server{
		balancer: bal,
		cluster:  cl,
		redis:    client,
		logger:   logger,
		router:   mux.NewRouter(),
		ctx:      context.Background(),
	}

	a.registerRoutes()
	return a
}

func (a *Server) registerRoutes() {
	a.router.HandleFunc("/admin/backends", a.handleAddBackend).Methods("POST")
	a.router.HandleFunc("/admin/backends/{id}", a.handleDeleteBackend).Methods("DELETE")
}

// Start begins listening on the configured port.
func (a *Server) Start() error {
	if a.server != nil {
		return fmt.Errorf("admin server already running")
	}
	a.server = &http.Server{
		Addr:    ":9000",
		Handler: a.router,
	}
	a.logger.Info("Starting admin API", zap.String("address", a.server.Addr))
	go func() {
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.logger.Error("Admin API error", zap.Error(err))
		}
	}()
	return nil
}

// Stop shuts down the admin server.
func (a *Server) Stop(ctx context.Context) error {
	if a.server == nil {
		return nil
	}
	a.logger.Info("Shutting down admin API")
	return a.server.Shutdown(ctx)
}

// handleAddBackend registers a backend and notifies the cluster.
func (a *Server) handleAddBackend(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Address string `json:"address"`
		Weight  int    `json:"weight"`
		Region  string `json:"region"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request", http.StatusBadRequest)
		return
	}
	id := uuid.NewString()

	data, _ := json.Marshal(req)
	if err := a.redis.HSet(a.ctx, "veloflux:admin:backends", id, data).Err(); err != nil {
		a.logger.Error("redis", zap.Error(err))
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}

	backend := config.Backend{Address: req.Address, Weight: req.Weight}
	a.balancer.AddBackend("web-servers", backend)

	if a.cluster != nil {
		payload, _ := json.Marshal(backend)
		key := fmt.Sprintf("%s/%s", "web-servers", backend.Address)
		a.cluster.PublishState(clustering.StateBackend, key, payload)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"id": id})
}

// handleDeleteBackend removes a backend by ID.
func (a *Server) handleDeleteBackend(w http.ResponseWriter, r *http.Request) {
	id := mux.Vars(r)["id"]
	val, err := a.redis.HGet(a.ctx, "veloflux:admin:backends", id).Result()
	if err == redis.Nil {
		http.NotFound(w, r)
		return
	} else if err != nil {
		a.logger.Error("redis", zap.Error(err))
		http.Error(w, "redis error", http.StatusInternalServerError)
		return
	}

	var data struct {
		Address string `json:"address"`
	}
	json.Unmarshal([]byte(val), &data)

	if err := a.balancer.RemoveBackend("web-servers", data.Address); err != nil {
		a.logger.Warn("remove backend", zap.Error(err))
	}

	a.redis.HDel(a.ctx, "veloflux:admin:backends", id)

	if a.cluster != nil {
		key := fmt.Sprintf("%s/%s", "web-servers", data.Address)
		a.cluster.PublishState(clustering.StateBackend, key, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}
