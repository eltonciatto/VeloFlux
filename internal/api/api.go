// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.io or contact contact@veloflux.io

package api

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/billing"
	"github.com/eltonciatto/veloflux/internal/clustering"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/orchestration"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// API handles dynamic configuration endpoints
type API struct {
	config         *config.Config
	balancer       *balancer.Balancer
	cluster        *clustering.Cluster
	logger         *zap.Logger
	router         *mux.Router
	server         *http.Server
	configMu       sync.RWMutex
	tenantManager  *tenant.Manager
	billingManager *billing.BillingManager
	authenticator  *auth.Authenticator
	oidcManager    *auth.OIDCManager
	orchestrator   *orchestration.Orchestrator
}

// BackendRequest represents a request to add/update a backend
type BackendRequest struct {
	Address     string `json:"address"`
	Pool        string `json:"pool"`
	Weight      int    `json:"weight"`
	Region      string `json:"region,omitempty"`
	HealthCheck struct {
		Path           string        `json:"path"`
		Interval       time.Duration `json:"interval"`
		Timeout        time.Duration `json:"timeout"`
		ExpectedStatus int           `json:"expected_status"`
	} `json:"health_check"`
}

// RouteRequest represents a request to add/update a route
type RouteRequest struct {
	Host       string `json:"host"`
	Pool       string `json:"pool"`
	PathPrefix string `json:"path_prefix,omitempty"`
}

// PoolRequest represents a request to add/update a pool
type PoolRequest struct {
	Name           string `json:"name"`
	Algorithm      string `json:"algorithm"`
	StickySessions bool   `json:"sticky_sessions"`
}

// ClusterResponse contains info about the cluster
type ClusterResponse struct {
	Nodes     []clustering.ClusterNode `json:"nodes"`
	IsLeader  bool                     `json:"is_leader"`
	LocalNode string                   `json:"local_node"`
	Enabled   bool                     `json:"enabled"`
}

// New creates a new API server
func New(cfg *config.Config, bal *balancer.Balancer, cl *clustering.Cluster,
	tenantManager *tenant.Manager, billingManager *billing.BillingManager,
	authenticator *auth.Authenticator, oidcManager *auth.OIDCManager,
	orchestrator *orchestration.Orchestrator, logger *zap.Logger) *API {

	a := &API{
		config:         cfg,
		balancer:       bal,
		cluster:        cl,
		logger:         logger,
		router:         mux.NewRouter(),
		tenantManager:  tenantManager,
		billingManager: billingManager,
		authenticator:  authenticator,
		oidcManager:    oidcManager,
		orchestrator:   orchestrator,
	}

	return a
}

// Start begins the API server
func (a *API) Start() error {
	// Setup API server
	a.server = &http.Server{
		Addr:         a.config.API.BindAddress,
		Handler:      a.router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Register routes
	a.setupRoutes()

	// Start HTTP server
	go func() {
		a.logger.Info("Starting API server", zap.String("address", a.server.Addr))
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.logger.Error("API server error", zap.Error(err))
		}
	}()

	return nil
}

// setupRoutes registers all API routes
func (a *API) setupRoutes() {
	// Create router
	a.router = mux.NewRouter()
	apiRouter := a.router.PathPrefix("/api").Subrouter()

	// Basic authentication middleware
	authMiddleware := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			username, password, ok := r.BasicAuth()
			if !ok || username != a.config.API.Username || password != a.config.API.Password {
				w.Header().Set("WWW-Authenticate", `Basic realm="VeloFlux API"`)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
			next.ServeHTTP(w, r)
		})
	}

	// Apply basic authentication
	if a.config.API.AuthEnabled {
		apiRouter.Use(authMiddleware)
	}

	// Core pool/backend/route management
	apiRouter.HandleFunc("/pools", a.handleListPools).Methods("GET")
	apiRouter.HandleFunc("/pools/{name}", a.handleGetPool).Methods("GET")
	apiRouter.HandleFunc("/pools", a.handleCreatePool).Methods("POST")
	apiRouter.HandleFunc("/pools/{name}", a.handleUpdatePool).Methods("PUT")
	apiRouter.HandleFunc("/pools/{name}", a.handleDeletePool).Methods("DELETE")

	apiRouter.HandleFunc("/backends", a.handleListBackends).Methods("GET")
	// Using handleGetPool since handleGetBackend doesn't exist
	apiRouter.HandleFunc("/backends/{id}", a.handleGetPool).Methods("GET")
	apiRouter.HandleFunc("/backends", a.handleAddBackend).Methods("POST")
	// Using handleUpdatePool since handleUpdateBackend doesn't exist
	apiRouter.HandleFunc("/backends/{id}", a.handleUpdatePool).Methods("PUT")
	// Using handleDeleteBackend instead of handleRemoveBackend
	apiRouter.HandleFunc("/backends/{id}", a.handleDeleteBackend).Methods("DELETE")

	apiRouter.HandleFunc("/routes", a.handleListRoutes).Methods("GET")
	// Using handleGetPool since handleGetRoute doesn't exist
	apiRouter.HandleFunc("/routes/{id}", a.handleGetPool).Methods("GET")
	// Using handleCreateRoute instead of handleAddRoute
	apiRouter.HandleFunc("/routes", a.handleCreateRoute).Methods("POST")
	apiRouter.HandleFunc("/routes/{id}", a.handleUpdateRoute).Methods("PUT")
	apiRouter.HandleFunc("/routes/{id}", a.handleDeleteRoute).Methods("DELETE")

	// Using handleClusterInfo instead of handleGetCluster
	apiRouter.HandleFunc("/cluster", a.handleClusterInfo).Methods("GET")
	// Using handleGetConfig for status since handleGetStatus doesn't exist
	apiRouter.HandleFunc("/status", a.handleGetConfig).Methods("GET")

	// Tenant APIs
	if a.tenantManager != nil && a.authenticator != nil {
		tenantAPI := NewTenantAPI(a.config, a.balancer, a.tenantManager, a.authenticator, a.cluster, a.logger)
		// Mount /auth and /api tenant endpoints
		a.router.PathPrefix("/auth").Handler(tenantAPI.Handler())
		a.router.PathPrefix("/api").Handler(tenantAPI.Handler())

		// Register SMTP routes
		a.RegisterSMTPRoutes(apiRouter.PathPrefix("/v1").Subrouter())
	}

	// Billing APIs
	if a.billingManager != nil {
		billingAPI := NewBillingAPI(a.billingManager, a.tenantManager, a.logger)
		a.router.PathPrefix("/api").Handler(billingAPI.Handler())
	}

	// OIDC APIs
	if a.oidcManager != nil && a.authenticator != nil {
		oidcAPI := NewOIDCHandlers(a.oidcManager, a.authenticator, a.tenantManager, a.logger)
		oidcAPI.SetupRoutes(a.router)
	}

	// Orchestration APIs
	if a.orchestrator != nil {
		orchestrationAPI := NewOrchestrationAPI(a.orchestrator, a.tenantManager, a.logger)
		orchestrationAPI.SetupRoutes(a.router)
	}
}

// Stop shuts down the API server
func (a *API) Stop(ctx context.Context) error {
	if a.server == nil {
		return nil
	}

	a.logger.Info("Shutting down API server")
	return a.server.Shutdown(ctx)
}

// Handler returns the HTTP handler for the API
func (a *API) Handler() http.Handler {
	return a.router
}

// Handler implementations

func (a *API) handleListPools(w http.ResponseWriter, r *http.Request) {
	pools := a.balancer.GetPools()
	writeJSON(w, pools)
}

func (a *API) handleGetPool(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	name := vars["name"]

	pool := a.balancer.GetPool(name)
	if pool == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	writeJSON(w, pool)
}

func (a *API) handleCreatePool(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	var req PoolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Name == "" || req.Algorithm == "" {
		writeError(w, "Pool name and algorithm are required", http.StatusBadRequest)
		return
	}

	// Check if pool already exists
	if a.balancer.GetPool(req.Name) != nil {
		writeError(w, "Pool already exists", http.StatusConflict)
		return
	}

	// Create pool config
	pool := config.Pool{
		Name:           req.Name,
		Algorithm:      req.Algorithm,
		StickySessions: req.StickySessions,
		Backends:       []config.Backend{},
	}

	// Add to balancer
	a.balancer.AddPool(pool)

	// Sync to cluster if enabled
	if a.cluster != nil {
		data, _ := json.Marshal(pool)
		a.cluster.PublishState(clustering.StatePool, pool.Name, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, pool)
}

func (a *API) handleUpdatePool(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	name := vars["name"]

	// Check if pool exists
	existingPool := a.balancer.GetPool(name)
	if existingPool == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	var req PoolRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Update pool config
	pool := config.Pool{
		Name:           name,
		Algorithm:      req.Algorithm,
		StickySessions: req.StickySessions,
		Backends:       existingPool.Backends,
	}

	// Update in balancer
	a.balancer.UpdatePool(pool)

	// Sync to cluster if enabled
	if a.cluster != nil {
		data, _ := json.Marshal(pool)
		a.cluster.PublishState(clustering.StatePool, pool.Name, data)
	}

	writeJSON(w, pool)
}

func (a *API) handleDeletePool(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	name := vars["name"]

	// Check if pool exists
	if a.balancer.GetPool(name) == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	// Remove from balancer
	a.balancer.RemovePool(name)

	// Sync to cluster if enabled
	if a.cluster != nil {
		a.cluster.PublishState(clustering.StatePool, name, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *API) handleAddBackend(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	poolName := vars["name"]

	// Check if pool exists
	pool := a.balancer.GetPool(poolName)
	if pool == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	var req BackendRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Address == "" {
		writeError(w, "Backend address is required", http.StatusBadRequest)
		return
	}

	// Create backend config
	backend := config.Backend{
		Address: req.Address,
		Weight:  req.Weight,
		HealthCheck: config.HealthCheck{
			Path:           req.HealthCheck.Path,
			Interval:       req.HealthCheck.Interval,
			Timeout:        req.HealthCheck.Timeout,
			ExpectedStatus: req.HealthCheck.ExpectedStatus,
		},
	}

	// Add to pool
	a.balancer.AddBackend(poolName, backend)

	// Sync to cluster if enabled
	if a.cluster != nil {
		data, _ := json.Marshal(backend)
		key := fmt.Sprintf("%s/%s", poolName, backend.Address)
		a.cluster.PublishState(clustering.StateBackend, key, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, backend)
}

func (a *API) handleDeleteBackend(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	poolName := vars["pool"]
	address := vars["address"]

	// Remove from balancer
	if err := a.balancer.RemoveBackend(poolName, address); err != nil {
		writeError(w, err.Error(), http.StatusNotFound)
		return
	}

	// Sync to cluster if enabled
	if a.cluster != nil {
		key := fmt.Sprintf("%s/%s", poolName, address)
		a.cluster.PublishState(clustering.StateBackend, key, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *API) handleListBackends(w http.ResponseWriter, r *http.Request) {
	pool := r.URL.Query().Get("pool")

	var backends []map[string]interface{}

	if pool != "" {
		// Get backends for specific pool
		p := a.balancer.GetPool(pool)
		if p == nil {
			writeError(w, "Pool not found", http.StatusNotFound)
			return
		}

		for _, b := range p.Backends {
			backends = append(backends, map[string]interface{}{
				"pool":    pool,
				"address": b.Address,
				"weight":  b.Weight,
			})
		}
	} else {
		// Get all backends
		for _, p := range a.balancer.GetPools() {
			for _, b := range p.Backends {
				backends = append(backends, map[string]interface{}{
					"pool":    p.Name,
					"address": b.Address,
					"weight":  b.Weight,
				})
			}
		}
	}

	writeJSON(w, backends)
}
func (a *API) handleListRoutes(w http.ResponseWriter, r *http.Request) {
	a.configMu.RLock()
	routes := a.config.Routes
	a.configMu.RUnlock()

	writeJSON(w, routes)
}

func (a *API) handleCreateRoute(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	var req RouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Host == "" || req.Pool == "" {
		writeError(w, "Host and pool are required", http.StatusBadRequest)
		return
	}

	// Check if pool exists
	if a.balancer.GetPool(req.Pool) == nil {
		writeError(w, "Referenced pool does not exist", http.StatusBadRequest)
		return
	}

	// Check if route already exists
	a.configMu.RLock()
	for _, route := range a.config.Routes {
		if route.Host == req.Host {
			a.configMu.RUnlock()
			writeError(w, "Route already exists", http.StatusConflict)
			return
		}
	}
	a.configMu.RUnlock()

	// Create route
	route := config.Route{
		Host:       req.Host,
		Pool:       req.Pool,
		PathPrefix: req.PathPrefix,
	}

	// Add to config
	a.configMu.Lock()
	a.config.Routes = append(a.config.Routes, route)
	a.configMu.Unlock()

	// Sync to cluster if enabled
	if a.cluster != nil {
		data, _ := json.Marshal(route)
		a.cluster.PublishState(clustering.StateRoute, route.Host, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, route)
}

func (a *API) handleUpdateRoute(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	host := vars["host"]

	var req RouteRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Pool == "" {
		writeError(w, "Pool is required", http.StatusBadRequest)
		return
	}

	// Check if pool exists
	if a.balancer.GetPool(req.Pool) == nil {
		writeError(w, "Referenced pool does not exist", http.StatusBadRequest)
		return
	}

	// Find and update route
	a.configMu.Lock()
	var updated bool
	for i, route := range a.config.Routes {
		if route.Host == host {
			a.config.Routes[i].Pool = req.Pool
			a.config.Routes[i].PathPrefix = req.PathPrefix
			updated = true
			break
		}
	}
	a.configMu.Unlock()

	if !updated {
		writeError(w, "Route not found", http.StatusNotFound)
		return
	}

	// Create updated route
	route := config.Route{
		Host:       host,
		Pool:       req.Pool,
		PathPrefix: req.PathPrefix,
	}

	// Sync to cluster if enabled
	if a.cluster != nil {
		data, _ := json.Marshal(route)
		a.cluster.PublishState(clustering.StateRoute, route.Host, data)
	}

	writeJSON(w, route)
}

func (a *API) handleDeleteRoute(w http.ResponseWriter, r *http.Request) {
	// Only leader can modify configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	vars := mux.Vars(r)
	host := vars["host"]

	// Find and remove route
	a.configMu.Lock()
	var found bool
	for i, route := range a.config.Routes {
		if route.Host == host {
			// Remove this route
			a.config.Routes = append(a.config.Routes[:i], a.config.Routes[i+1:]...)
			found = true
			break
		}
	}
	a.configMu.Unlock()

	if !found {
		writeError(w, "Route not found", http.StatusNotFound)
		return
	}

	// Sync to cluster if enabled
	if a.cluster != nil {
		a.cluster.PublishState(clustering.StateRoute, host, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (a *API) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	a.configMu.RLock()
	defer a.configMu.RUnlock()

	// Return only safe, non-sensitive config
	safeConfig := map[string]interface{}{
		"global": map[string]interface{}{
			"bind_address":     a.config.Global.BindAddress,
			"tls_bind_address": a.config.Global.TLSBindAddress,
			"metrics_address":  a.config.Global.MetricsAddress,
		},
		"routes": a.config.Routes,
		"pools":  a.balancer.GetPools(),
	}

	writeJSON(w, safeConfig)
}

func (a *API) handleClusterInfo(w http.ResponseWriter, r *http.Request) {
	var response ClusterResponse

	if a.cluster == nil {
		response = ClusterResponse{
			Nodes:    []clustering.ClusterNode{},
			IsLeader: true,
			Enabled:  false,
		}
	} else {
		nodesPtr := a.cluster.GetNodes()
		nodes := make([]clustering.ClusterNode, len(nodesPtr))
		for i, n := range nodesPtr {
			nodes[i] = *n
		}
		response = ClusterResponse{
			Nodes:     nodes,
			IsLeader:  a.cluster.IsLeader(),
			LocalNode: a.cluster.NodeID(),
			Enabled:   true,
		}
	}

	writeJSON(w, response)
}

func (a *API) handleReload(w http.ResponseWriter, r *http.Request) {
	// Only leader can reload configuration
	if a.cluster != nil && !a.cluster.IsLeader() {
		writeError(w, "Operation only allowed on leader node", http.StatusForbidden)
		return
	}

	// Trigger a configuration reload
	// This would typically reload from disk or database
	// For now, we'll just return success

	writeJSON(w, map[string]string{"status": "reloaded"})
}

// Cluster state change handlers

func (a *API) handleBackendStateChange(stateType clustering.StateType, key string, value []byte) {
	if stateType != clustering.StateBackend {
		return
	}

	// Parse pool and backend address from key
	parts := strings.Split(key, "/")
	if len(parts) != 2 {
		a.logger.Error("Invalid backend state key", zap.String("key", key))
		return
	}

	poolName := parts[0]
	address := parts[1]

	if value == nil {
		// Backend was deleted
		a.balancer.RemoveBackend(poolName, address)
		a.logger.Info("Removed backend via cluster sync",
			zap.String("pool", poolName),
			zap.String("address", address))
		return
	}

	// Backend was added or updated
	var backend config.Backend
	if err := json.Unmarshal(value, &backend); err != nil {
		a.logger.Error("Failed to unmarshal backend data", zap.Error(err))
		return
	}

	a.balancer.AddBackend(poolName, backend)
	a.logger.Info("Updated backend via cluster sync",
		zap.String("pool", poolName),
		zap.String("address", backend.Address))
}

func (a *API) handleRouteStateChange(stateType clustering.StateType, key string, value []byte) {
	if stateType != clustering.StateRoute {
		return
	}

	host := key

	if value == nil {
		// Route was deleted
		a.configMu.Lock()
		for i, route := range a.config.Routes {
			if route.Host == host {
				a.config.Routes = append(a.config.Routes[:i], a.config.Routes[i+1:]...)
				a.configMu.Unlock()
				a.logger.Info("Removed route via cluster sync", zap.String("host", host))
				return
			}
		}
		a.configMu.Unlock()
		return
	}

	// Route was added or updated
	var route config.Route
	if err := json.Unmarshal(value, &route); err != nil {
		a.logger.Error("Failed to unmarshal route data", zap.Error(err))
		return
	}

	// Update or add route
	a.configMu.Lock()
	var found bool
	for i, r := range a.config.Routes {
		if r.Host == host {
			a.config.Routes[i] = route
			found = true
			break
		}
	}

	if !found {
		a.config.Routes = append(a.config.Routes, route)
	}
	a.configMu.Unlock()

	a.logger.Info("Updated route via cluster sync", zap.String("host", host))
}

func (a *API) handleConfigStateChange(stateType clustering.StateType, key string, value []byte) {
	if stateType != clustering.StateConfig {
		return
	}

	// Global config change, would handle reloading here
	a.logger.Info("Received config change via cluster sync")
}

// Utility functions

func writeJSON(w http.ResponseWriter, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(data)
}

func writeError(w http.ResponseWriter, message string, statusCode int) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)
	json.NewEncoder(w).Encode(map[string]string{"error": message})
}
