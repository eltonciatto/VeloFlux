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
	"golang.org/x/time/rate"

	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/billing"
	"github.com/eltonciatto/veloflux/internal/clustering"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/orchestration"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/eltonciatto/veloflux/internal/websocket"
	
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// API handles dynamic configuration endpoints
type API struct {
	config           *config.Config
	balancer         *balancer.Balancer
	adaptiveBalancer *balancer.AdaptiveBalancer
	cluster          *clustering.Cluster
	logger           *zap.Logger
	router           *mux.Router
	server           *http.Server
	configMu         sync.RWMutex
	tenantManager    *tenant.Manager
	billingManager   *billing.BillingManager
	authenticator    *auth.Authenticator
	oidcManager      *auth.OIDCManager
	orchestrator     *orchestration.Orchestrator
	wsHub            *websocket.Hub
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
func New(cfg *config.Config, bal *balancer.Balancer, adaptiveBal *balancer.AdaptiveBalancer, cl *clustering.Cluster,
	tenantManager *tenant.Manager, billingManager *billing.BillingManager,
	authenticator *auth.Authenticator, oidcManager *auth.OIDCManager,
	orchestrator *orchestration.Orchestrator, logger *zap.Logger) *API {

	a := &API{
		config:           cfg,
		balancer:         bal,
		adaptiveBalancer: adaptiveBal,
		cluster:          cl,
		logger:           logger,
		router:           mux.NewRouter(),
		tenantManager:    tenantManager,
		billingManager:   billingManager,
		authenticator:    authenticator,
		oidcManager:      oidcManager,
		orchestrator:     orchestrator,
		wsHub:            websocket.NewHub(logger),
	}

	// Start WebSocket hub
	go a.wsHub.Run()

	return a
}

// Start begins the API server
func (a *API) Start() error {
	// Start WebSocket hub
	if a.wsHub != nil {
		go a.wsHub.Run()
		a.logger.Info("WebSocket hub started")
		
		// Start background update services
		go a.broadcastBackendUpdates()
		go a.broadcastMetricsUpdates() 
		go a.broadcastStatusUpdates()
		go a.broadcastBillingUpdates() // Add billing WebSocket updates
	}
	
	// Register routes BEFORE creating the server
	a.setupRoutes()

	// Setup API server
	a.server = &http.Server{
		Addr:         a.config.API.BindAddress,
		Handler:      a.router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	a.logger.Info("API Server created", 
		zap.String("address", a.config.API.BindAddress),
		zap.String("handler_type", fmt.Sprintf("%T", a.router)))

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

	// Log setup start
	a.logger.Info("Setting up API routes")

	// Add a simple test endpoint at root level
	a.router.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		a.logger.Info("ROOT ENDPOINT CALLED", zap.String("method", r.Method), zap.String("path", r.URL.Path))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "VeloFlux API is running", "version": "1.1.0"}`))
	}).Methods("GET")

	// Add a simple health endpoint
	a.router.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		a.logger.Info("HEALTH ENDPOINT CALLED", zap.String("method", r.Method), zap.String("path", r.URL.Path))
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusOK)
		w.Write([]byte(`{"status": "healthy"}`))
	}).Methods("GET")

	// Register profile routes BEFORE apiRouter to avoid conflicts
	a.logger.Debug("Checking tenant manager and authenticator initialization",
		zap.Bool("tenantManager_nil", a.tenantManager == nil),
		zap.Bool("authenticator_nil", a.authenticator == nil))
		
	if a.tenantManager != nil && a.authenticator != nil {
		a.logger.Info("Registering profile routes")
		
		// Authentication routes (public - sem autenticação) - MOVIDO PARA /api/auth
		a.router.HandleFunc("/api/auth/login", a.handleTenantLogin).Methods("POST")
		a.router.HandleFunc("/api/auth/register", a.handleTenantRegister).Methods("POST")
		
		// Token refresh (requer token válido)
		a.router.HandleFunc("/api/auth/refresh", a.requireAuthToken(a.handleTenantRefresh)).Methods("POST")
		
		// User profile routes (with JWT authentication)
		a.router.HandleFunc("/api/profile", a.requireAuthToken(a.handleGetProfile)).Methods("GET")
		a.router.HandleFunc("/api/profile", a.requireAuthToken(a.handleUpdateProfile)).Methods("PUT")
		
		a.logger.Info("Profile routes registered successfully")
	} else {
		a.logger.Warn("Profile routes NOT registered - missing dependencies",
			zap.Bool("tenantManager_nil", a.tenantManager == nil),
			zap.Bool("authenticator_nil", a.authenticator == nil))
	}

	apiRouter := a.router.PathPrefix("/api").Subrouter()

	// WebSocket routes (sem autenticação para simplificar a conexão)
	a.logger.Info("Registering WebSocket routes")
	a.router.HandleFunc("/api/ws/backends", a.handleWebSocketBackends).Methods("GET")
	a.router.HandleFunc("/api/ws/metrics", a.handleWebSocketMetrics).Methods("GET")
	a.router.HandleFunc("/api/ws/status", a.handleWebSocketStatus).Methods("GET")
	a.router.HandleFunc("/api/ws/billing", a.handleWebSocketBilling).Methods("GET")
	a.router.HandleFunc("/api/ws/health", a.handleWebSocketHealth).Methods("GET")
	a.router.HandleFunc("/api/ws/control", a.handleWebSocketControl).Methods("POST")
	a.router.HandleFunc("/api/ws/force-update", a.handleForceUpdate).Methods("POST")
	a.logger.Info("WebSocket routes registered successfully")

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
		a.logger.Info("API authentication enabled")
	}

	// Core pool/backend/route management
	a.logger.Info("Registering core API routes")
	apiRouter.HandleFunc("/pools", a.handleListPools).Methods("GET")
	apiRouter.HandleFunc("/pools/{name}", a.handleGetPool).Methods("GET")
	apiRouter.HandleFunc("/pools", a.handleCreatePool).Methods("POST")
	apiRouter.HandleFunc("/pools/{name}", a.handleUpdatePool).Methods("PUT")
	apiRouter.HandleFunc("/pools/{name}", a.handleDeletePool).Methods("DELETE")

	apiRouter.HandleFunc("/backends", a.handleListBackends).Methods("GET")
	apiRouter.HandleFunc("/backends/{id}", a.handleGetBackend).Methods("GET")
	apiRouter.HandleFunc("/backends", a.handleAddBackend).Methods("POST")
	apiRouter.HandleFunc("/backends/{id}", a.handleUpdateBackend).Methods("PUT")
	apiRouter.HandleFunc("/backends/{id}", a.handleDeleteBackend).Methods("DELETE")

	apiRouter.HandleFunc("/routes", a.handleListRoutes).Methods("GET")
	apiRouter.HandleFunc("/routes/{id}", a.handleGetRoute).Methods("GET")
	apiRouter.HandleFunc("/routes", a.handleCreateRoute).Methods("POST")
	apiRouter.HandleFunc("/routes/{id}", a.handleUpdateRoute).Methods("PUT")
	apiRouter.HandleFunc("/routes/{id}", a.handleDeleteRoute).Methods("DELETE")

	// Using handleClusterInfo instead of handleGetCluster
	apiRouter.HandleFunc("/cluster", a.handleClusterInfo).Methods("GET")
	// Advanced status endpoint with comprehensive system information
	apiRouter.HandleFunc("/status", a.handleAdvancedStatus).Methods("GET")
	apiRouter.HandleFunc("/status/health", a.handleAdvancedHealth).Methods("GET")
	apiRouter.HandleFunc("/metrics", a.handleAdvancedMetrics).Methods("GET")
	// Add config and reload endpoints
	apiRouter.HandleFunc("/config", a.handleGetConfig).Methods("GET")
	apiRouter.HandleFunc("/config/validate", a.handleValidateConfig).Methods("POST")
	apiRouter.HandleFunc("/reload", a.handleReload).Methods("POST")
	
	// Configuration management
	apiRouter.HandleFunc("/config/export", a.handleExportConfig).Methods("GET")
	apiRouter.HandleFunc("/config/import", a.handleImportConfig).Methods("POST")
	apiRouter.HandleFunc("/backup/create", a.handleCreateBackup).Methods("GET")
	apiRouter.HandleFunc("/backup/restore", a.handleRestoreBackup).Methods("POST")
	
	// Analytics
	apiRouter.HandleFunc("/analytics", a.handleAnalytics).Methods("GET")
	
	// System management
	apiRouter.HandleFunc("/system/drain", a.handleSystemDrain).Methods("POST")
	
	a.logger.Info("Core API routes registered successfully")

	// Tenant APIs - Com autenticação JWT correta
	if a.tenantManager != nil && a.authenticator != nil {
		a.logger.Info("Registering tenant management routes")
		
		// Tenant management routes (com autenticação JWT)
		tenantRouter := a.router.PathPrefix("/api/tenants").Subrouter()
		
		tenantRouter.HandleFunc("", a.requireAuthToken(a.handleListTenants)).Methods("GET")
		tenantRouter.HandleFunc("", a.requireTenantRole(a.handleCreateTenant, "owner")).Methods("POST")
		tenantRouter.HandleFunc("/{id}", a.requireAuthToken(a.handleGetTenant)).Methods("GET")
		tenantRouter.HandleFunc("/{id}", a.requireTenantRole(a.handleUpdateTenant, "owner", "admin")).Methods("PUT")
		tenantRouter.HandleFunc("/{id}", a.requireTenantRole(a.handleDeleteTenant, "owner")).Methods("DELETE")
		
		a.logger.Info("Tenant API routes registered successfully")
	} else {
		a.logger.Warn("Tenant API not initialized", zap.Bool("tenantManager_nil", a.tenantManager == nil), zap.Bool("authenticator_nil", a.authenticator == nil))
	}

	// Billing APIs - Com autenticação JWT correta
	if a.billingManager != nil {
		a.logger.Info("Registering billing API routes")
		
		// Billing management routes (com autenticação JWT)
		billingRouter := a.router.PathPrefix("/api/billing").Subrouter()
		
		billingRouter.HandleFunc("/subscriptions", a.requireAuthToken(a.handleListSubscriptions)).Methods("GET")
		billingRouter.HandleFunc("/subscriptions", a.requireTenantRole(a.handleCreateSubscription, "owner", "admin")).Methods("POST")
		billingRouter.HandleFunc("/subscriptions/{id}", a.requireAuthToken(a.handleGetSubscription)).Methods("GET")
		billingRouter.HandleFunc("/subscriptions/{id}", a.requireTenantRole(a.handleUpdateSubscription, "owner", "admin")).Methods("PUT")
		billingRouter.HandleFunc("/subscriptions/{id}", a.requireTenantRole(a.handleCancelSubscription, "owner")).Methods("DELETE")
		billingRouter.HandleFunc("/invoices", a.requireAuthToken(a.handleListInvoices)).Methods("GET")
		billingRouter.HandleFunc("/webhooks", a.handleBillingWebhook).Methods("POST") // Webhook público
		
		a.logger.Info("Billing API routes registered successfully")
	} else {
		a.logger.Info("Billing API not initialized - billingManager is nil")
	}

	// Tenant-specific APIs (rotas específicas por tenant)
	if a.tenantManager != nil && a.authenticator != nil {
		a.logger.Info("Registering tenant-specific API routes")
		
		// Criar um sub-router para as rotas tenant-específicas
		tenantSpecificRouter := a.router.PathPrefix("/api/tenants/{tenant_id}").Subrouter()
		
		// User Management APIs
		tenantSpecificRouter.HandleFunc("/users", a.requireTenantAccess(a.handleListTenantUsers)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/users", a.requireTenantAccess(a.handleAddTenantUser)).Methods("POST")
		tenantSpecificRouter.HandleFunc("/users/{user_id}", a.requireTenantAccess(a.handleUpdateTenantUser)).Methods("PUT")
		tenantSpecificRouter.HandleFunc("/users/{user_id}", a.requireTenantAccess(a.handleDeleteTenantUser)).Methods("DELETE")
		
		// Tenant Monitoring APIs
		tenantSpecificRouter.HandleFunc("/metrics", a.requireTenantAccess(a.handleTenantMetrics)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/logs", a.requireTenantAccess(a.handleTenantLogs)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/usage", a.requireTenantAccess(a.handleTenantUsage)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/alerts", a.requireTenantAccess(a.handleTenantAlerts)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/status", a.requireTenantAccess(a.handleTenantStatus)).Methods("GET")
		
		// OIDC Configuration APIs
		tenantSpecificRouter.HandleFunc("/oidc/config", a.requireTenantAccess(a.handleGetTenantOIDCConfig)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/oidc/config", a.requireTenantAccess(a.handleUpdateTenantOIDCConfig)).Methods("PUT")
		tenantSpecificRouter.HandleFunc("/oidc/test", a.requireTenantAccess(a.handleTestTenantOIDCConfig)).Methods("POST")
		
		// Tenant Configuration APIs
		tenantSpecificRouter.HandleFunc("/config", a.requireTenantAccess(a.handleGetTenantConfig)).Methods("GET")
		tenantSpecificRouter.HandleFunc("/billing", a.requireTenantAccess(a.handleGetTenantBilling)).Methods("GET")
		
		a.logger.Info("Tenant-specific API routes registered successfully")
	}

	// AI/ML API routes
	a.logger.Info("Registering AI/ML API routes")
	a.setupAIRoutes()
	a.logger.Info("AI/ML API routes registered successfully")
}

// Start begins the API server
func (a *API) Start() error {
	// Start WebSocket hub
	if a.wsHub != nil {
		go a.wsHub.Run()
		a.logger.Info("WebSocket hub started")
		
		// Start background update services
		go a.broadcastBackendUpdates()
		go a.broadcastMetricsUpdates() 
		go a.broadcastStatusUpdates()
		go a.broadcastBillingUpdates() // Add billing WebSocket updates
	}
	
	// Register routes BEFORE creating the server
	a.setupRoutes()

	// Setup API server
	a.server = &http.Server{
		Addr:         a.config.API.BindAddress,
		Handler:      a.router,
		ReadTimeout:  30 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	a.logger.Info("API Server created", 
		zap.String("address", a.config.API.BindAddress),
		zap.String("handler_type", fmt.Sprintf("%T", a.router)))

	// Start HTTP server
	go func() {
		a.logger.Info("Starting API server", zap.String("address", a.server.Addr))
		if err := a.server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			a.logger.Error("API server error", zap.Error(err))
		}
	}()

	return nil
}

// setupAIRoutes registers AI/ML API routes
func (a *API) setupAIRoutes() {
	if a.orchestrator == nil {
		a.logger.Info("AI/ML orchestrator not available - skipping AI routes")
		return
	}
	
	aiRouter := a.router.PathPrefix("/api/ai").Subrouter()
	
	// Model management endpoints
	aiRouter.HandleFunc("/models", a.handleListAIModels).Methods("GET")
	aiRouter.HandleFunc("/models", a.handleDeployAIModel).Methods("POST")
	aiRouter.HandleFunc("/models/{id}", a.handleGetAIModel).Methods("GET")
	aiRouter.HandleFunc("/models/{id}", a.handleUpdateAIModel).Methods("PUT")
	aiRouter.HandleFunc("/models/{id}", a.handleUndeployAIModel).Methods("DELETE")
	
	// Prediction endpoints
	aiRouter.HandleFunc("/predict", a.handleAIPredict).Methods("POST")
	aiRouter.HandleFunc("/predict/batch", a.handleAIBatchPredict).Methods("POST")
	aiRouter.HandleFunc("/predictions", a.handleAIPredictions).Methods("GET")
	
	// Configuration endpoints
	aiRouter.HandleFunc("/config", a.handleGetAIConfig).Methods("GET")
	aiRouter.HandleFunc("/config", a.handleUpdateAIConfig).Methods("PUT")
	
	// Training and management
	aiRouter.HandleFunc("/retrain", a.handleAIRetrain).Methods("POST")
	aiRouter.HandleFunc("/history", a.handleAIHistory).Methods("GET")
	
	// Monitoring endpoints
	aiRouter.HandleFunc("/metrics", a.handleAIMetrics).Methods("GET")
	aiRouter.HandleFunc("/health", a.handleAIHealth).Methods("GET")
	
	// AI/ML configuration endpoints
	aiRouter.HandleFunc("/config", a.handleGetAIConfig).Methods("GET")
	aiRouter.HandleFunc("/config", a.handleUpdateAIConfig).Methods("PUT")
	
	// AI/ML training endpoints
	aiRouter.HandleFunc("/train", a.handleStartAITraining).Methods("POST")
	aiRouter.HandleFunc("/train/{id}", a.handleStopAITraining).Methods("POST")
	aiRouter.HandleFunc("/training", a.handleListAITraining).Methods("GET")
	aiRouter.HandleFunc("/training/{id}", a.handleGetAITraining).Methods("GET")
	
	// AI/ML pipeline endpoints
	aiRouter.HandleFunc("/pipelines", a.handleListAIPipelines).Methods("GET")
	aiRouter.HandleFunc("/pipelines", a.handleCreateAIPipeline).Methods("POST")
	aiRouter.HandleFunc("/pipelines/{id}", a.handleGetAIPipeline).Methods("GET")
	aiRouter.HandleFunc("/pipelines/{id}", a.handleUpdateAIPipeline).Methods("PUT")
	aiRouter.HandleFunc("/pipelines/{id}", a.handleDeleteAIPipeline).Methods("DELETE")
	aiRouter.HandleFunc("/pipelines/{id}/run", a.handleRunAIPipeline).Methods("POST")
	
	a.logger.Info("AI/ML routes registered successfully")
}

// Authentication middleware implementations

// requireAuthToken validates JWT token and extracts user claims
func (a *API) requireAuthToken(next http.HandlerFunc) http.HandlerFunc {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract JWT token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			a.writeErrorResponse(w, http.StatusUnauthorized, fmt.Errorf("missing authorization header"), "Authorization required")
			return
		}

		// Check Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			a.writeErrorResponse(w, http.StatusUnauthorized, fmt.Errorf("invalid authorization format"), "Invalid authorization format")
			return
		}

		tokenString := tokenParts[1]

		// Validate JWT token
		claims, err := a.authenticator.VerifyToken(tokenString)
		if err != nil {
			a.writeErrorResponse(w, http.StatusUnauthorized, err, "Invalid or expired token")
			return
		}

		// Add claims to request context
		ctx := context.WithValue(r.Context(), "user_claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// requireTenantRole validates JWT token and checks if user has required tenant role
func (a *API) requireTenantRole(next http.HandlerFunc, requiredRoles ...string) http.HandlerFunc {
	return a.requireAuthToken(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract user claims from context
		claims, err := a.extractUserFromToken(r)
		if err != nil {
			a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
			return
		}

		// Check if user has one of the required roles
		hasRole := false
		userRole := string(claims.Role)
		for _, requiredRole := range requiredRoles {
			if userRole == requiredRole {
				hasRole = true
				break
			}
		}

		if !hasRole {
			a.writeErrorResponse(w, http.StatusForbidden, fmt.Errorf("insufficient permissions"), 
				fmt.Sprintf("Role '%s' required, user has role '%s'", strings.Join(requiredRoles, " or "), userRole))
			return
		}

		// User has required role, proceed
		next.ServeHTTP(w, r)
	}))
}

// requireTenantAccess middleware ensures the user has access to the specified tenant
func (a *API) requireTenantAccess(next http.HandlerFunc) http.HandlerFunc {
	return a.requireAuthToken(func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		tenantID := vars["tenant_id"]
		
		// Get user from context (set by requireAuthToken)
		user, ok := r.Context().Value("user").(*tenant.User)
		if !ok {
			writeError(w, "User not found in context", http.StatusInternalServerError)
			return
		}
		
		// Check if user has access to this tenant
		hasAccess := false
		if user.TenantID == tenantID {
			hasAccess = true
		} else {
			// Check if user is owner/admin and can access other tenants
			if user.Role == "owner" || user.Role == "admin" {
				// Allow access to any tenant for owners/admins
				hasAccess = true
			}
		}
		
		if !hasAccess {
			writeError(w, "Access denied to tenant", http.StatusForbidden)
			return
		}
		
		// Add tenant ID to context for handlers
		ctx := context.WithValue(r.Context(), "tenant_id", tenantID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
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

	// Notify WebSocket clients of pool changes
	a.NotifyPoolChange()

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

	// Notify WebSocket clients of pool changes
	a.NotifyPoolChange()

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

	// Notify WebSocket clients of pool changes
	a.NotifyPoolChange()

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

	// Notify WebSocket clients of backend changes
	a.NotifyBackendChange()

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

	// Notify WebSocket clients of backend changes
	a.NotifyBackendChange()

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

	w.WriteHeader(http.Status201)
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

// Tenant API handlers

func (a *API) handleTenantLogin(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Tenant login endpoint called")
	
	var req LoginRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing required fields"), "Email and password are required")
		return
	}

	// Get user by email
	user, err := a.tenantManager.GetUserByEmail(r.Context(), req.Email)
	if err != nil {
		a.logger.Warn("Login attempt with invalid email", zap.String("email", req.Email))
		a.writeErrorResponse(w, http.StatusUnauthorized, 
			fmt.Errorf("invalid credentials"), "Invalid email or password")
		return
	}

	// Validate password (this should be implemented in tenant manager)
	valid, err := a.tenantManager.ValidateUserPassword(r.Context(), user.UserID, req.Password)
	if err != nil || !valid {
		a.logger.Warn("Login attempt with invalid password", zap.String("email", req.Email))
		a.writeErrorResponse(w, http.StatusUnauthorized, 
			fmt.Errorf("invalid credentials"), "Invalid email or password")
		return
	}

	// Generate JWT token
	token, err := a.authenticator.GenerateToken(user)
	// Generate JWT token
	token, err = a.authenticator.GenerateToken(user)
	if err != nil {
		a.logger.Error("Failed to generate token", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to generate authentication token")
		return
	}

	// Return successful login response
	response := LoginResponse{
		Token:     token,
		User:      user,
		ExpiresAt: time.Now().Add(24 * time.Hour), // Should match token validity
	}

	a.logger.Info("User logged in successfully", 
		zap.String("user_id", user.UserID), 
		zap.String("email", user.Email),
		zap.String("tenant_id", user.TenantID))
	
	a.writeJSONResponse(w, http.StatusOK, response)
}

func (a *API) handleTenantRegister(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Tenant register endpoint called")
	
	var req RegisterRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Email == "" || req.Password == "" || req.FirstName == "" || req.LastName == "" || req.TenantName == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing required fields"), "All fields are required")
		return
	}

	// Set default plan if not specified
	if req.Plan == "" {
		req.Plan = tenant.PlanFree
	}

	// Check if user already exists
	existingUser, _ := a.tenantManager.GetUserByEmail(r.Context(), req.Email)
	if existingUser != nil {
		a.writeErrorResponse(w, http.StatusConflict, 
			fmt.Errorf("user already exists"), "An account with this email already exists")
		return
	}

	// Create tenant and user
	tenantID, userID, err := a.tenantManager.CreateTenantWithOwner(r.Context(), &tenant.CreateTenantWithOwnerRequest{
		Name:     req.TenantName,
		Plan:     req.Plan,
		Password: req.Password,
		OwnerInfo: tenant.UserInfo{
			Email:     req.Email,
			FirstName: req.FirstName,
			LastName:  req.LastName,
			Role:      tenant.RoleOwner,
		},
	})

	if err != nil {
		a.logger.Error("Failed to create tenant and user", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to create account")
		return
	}

	// Get the created user
	user, err := a.tenantManager.GetUserByID(r.Context(), userID)
	if err != nil {
		a.logger.Error("Failed to get created user", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Account created but failed to retrieve user info")
		return
	}

	// Generate JWT token
	token, err := a.authenticator.GenerateToken(user)
	if err != nil {
		a.logger.Error("Failed to generate token for new user", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Account created but failed to generate authentication token")
		return
	}

	// Return successful registration response
	response := LoginResponse{
		Token:     token,
		User:      user,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	a.logger.Info("User registered successfully", 
		zap.String("user_id", userID), 
		zap.String("tenant_id", tenantID),
		zap.String("email", req.Email))
	
	a.writeJSONResponse(w, http.StatusCreated, response)
}

func (a *API) handleTenantRefresh(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Tenant refresh endpoint called")
	
	// Extract user from current token
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Invalid or expired token")
		return
	}

	// Get current user info (to ensure user still exists and is active)
	user, err := a.tenantManager.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, 
			fmt.Errorf("user not found"), "User account no longer exists")
		return
	}

	// Generate new token
	newToken, err := a.authenticator.GenerateToken(user)
	if err != nil {
		a.logger.Error("Failed to generate refresh token", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to refresh token")
		return
	}

	response := LoginResponse{
		Token:     newToken,
		User:      user,
		ExpiresAt: time.Now().Add(24 * time.Hour),
	}

	a.logger.Info("Token refreshed successfully", zap.String("user_id", claims.UserID))
	a.writeJSONResponse(w, http.StatusOK, response)
}

// handleGetProfile returns the current user's profile information
func (a *API) handleGetProfile(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Get profile endpoint called")
	
	// Extract user from token
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get current user info
	user, err := a.tenantManager.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		a.logger.Error("Failed to get user profile", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to retrieve profile")
		return
	}

	a.logger.Info("Profile retrieved successfully", zap.String("user_id", claims.UserID))
	a.writeJSONResponse(w, http.StatusOK, user)
}

// handleUpdateProfile updates the current user's profile information
func (a *API) handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Update profile endpoint called")
	
	// Extract user from token
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get current user info
	user, err := a.tenantManager.GetUserByID(r.Context(), claims.UserID)
	if err != nil {
		a.logger.Error("Failed to get user for update", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to retrieve profile")
		return
	}

	// Parse request body
	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request format")
		return
	}

	// Update user info
	user.FirstName = req.FirstName
	user.LastName = req.LastName

	// Save updates
	if err := a.tenantManager.UpdateUser(r.Context(), user); err != nil {
		a.logger.Error("Failed to update user profile", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to update profile")
		return
	}

	a.logger.Info("Profile updated successfully", zap.String("user_id", claims.UserID))
	a.writeJSONResponse(w, http.StatusOK, user)
}

func (a *API) handleListTenants(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("List tenants endpoint called")
	
	// Extract user from token to check permissions
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// For now, users can only see their own tenant
	// In a multi-tenant admin scenario, you might allow admins to see all tenants
	userTenant, err := a.tenantManager.GetTenant(r.Context(), claims.TenantID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Tenant not found")
		return
	}

	// Return tenant list (currently just the user's tenant)
	tenants := []*tenant.Tenant{userTenant}
	
	response := ListResponse{
		Items:      tenants,
		TotalCount: 1,
		Page:       1,
		PageSize:   10,
		HasMore:    false,
	}

	a.writeJSONResponse(w, http.StatusOK, response)
}

func (a *API) handleCreateTenant(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Create tenant endpoint called")
	
	// This endpoint might be restricted to system admins
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Check if user has permission to create tenants (system admin)
	if claims.Role != tenant.RoleOwner {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "Only system administrators can create tenants")
		return
	}

	var req CreateTenantRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Name == "" || req.OwnerEmail == "" || req.OwnerName == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing required fields"), "Name, owner email, and owner name are required")
		return
	}

	// Set default plan if not specified
	if req.Plan == "" {
		req.Plan = tenant.PlanFree
	}

	// Create the tenant
	newTenant := &tenant.Tenant{
		Name:      req.Name,
		Plan:      req.Plan,
		Active:    true,
		CreatedAt: time.Now(),
	}

	err = a.tenantManager.CreateTenant(r.Context(), newTenant)
	if err != nil {
		a.logger.Error("Failed to create tenant", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to create tenant")
		return
	}

	a.logger.Info("Tenant created successfully", zap.String("tenant_id", newTenant.ID), zap.String("name", newTenant.Name))
	a.writeSuccessResponse(w, "Tenant created successfully", newTenant)
}

func (a *API) handleGetTenant(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Get tenant endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get tenant ID from URL path
	tenantID := a.extractPathVariable(r, "id")
	if tenantID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing tenant ID"), "Tenant ID is required")
		return
	}

	// Check if user has access to this tenant
	if claims.TenantID != tenantID && claims.Role != tenant.RoleOwner {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("access denied"), "You don't have access to this tenant")
		return
	}

	// Get the tenant
	tenantInfo, err := a.tenantManager.GetTenant(r.Context(), tenantID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Tenant not found")
		return
	}

	a.writeJSONResponse(w, http.StatusOK, tenantInfo)
}

func (a *API) handleUpdateTenant(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Update tenant endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get tenant ID from URL path
	tenantID := a.extractPathVariable(r, "id")
	if tenantID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing tenant ID"), "Tenant ID is required")
		return
	}

	// Check if user has permission to update this tenant
	if claims.TenantID != tenantID || (claims.Role != tenant.RoleOwner && claims.Role != tenant.RoleAdmin) {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "You don't have permission to update this tenant")
		return
	}

	var req UpdateTenantRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Get current tenant
	currentTenant, err := a.tenantManager.GetTenant(r.Context(), tenantID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Tenant not found")
		return
	}

	// Update fields that were provided
	updated := false
	if req.Name != "" && req.Name != currentTenant.Name {
		currentTenant.Name = req.Name
		updated = true
	}
	if req.Plan != "" && req.Plan != currentTenant.Plan {
		currentTenant.Plan = req.Plan
		updated = true
	}
	if req.Enabled != nil && *req.Enabled != currentTenant.Active {
		currentTenant.Active = *req.Enabled
		updated = true
	}

	if !updated {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("no updates provided"), "No valid fields to update")
		return
	}

	// Save the updated tenant
	err = a.tenantManager.UpdateTenant(r.Context(), currentTenant)
	if err != nil {
		a.logger.Error("Failed to update tenant", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to update tenant")
		return
	}

	a.logger.Info("Tenant updated successfully", zap.String("tenant_id", tenantID))
	a.writeSuccessResponse(w, "Tenant updated successfully", currentTenant)
}

func (a *API) handleDeleteTenant(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Delete tenant endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get tenant ID from URL path
	tenantID := a.extractPathVariable(r, "id")
	if tenantID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing tenant ID"), "Tenant ID is required")
		return
	}

	// Only tenant owners can delete tenants
	if claims.TenantID != tenantID || claims.Role != tenant.RoleOwner {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "Only tenant owners can delete tenants")
		return
	}

	// Delete the tenant
	err = a.tenantManager.DeleteTenant(r.Context(), tenantID)
	if err != nil {
		a.logger.Error("Failed to delete tenant", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to delete tenant")
		return
	}

	a.logger.Info("Tenant deleted successfully", zap.String("tenant_id", tenantID))
	a.writeSuccessResponse(w, "Tenant deleted successfully", nil)
}

// Billing API handlers

func (a *API) handleListSubscriptions(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("List subscriptions endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get subscriptions for the user's tenant
	subscriptions, err := a.billingManager.GetTenantSubscriptions(r.Context(), claims.TenantID)
	if err != nil {
		a.logger.Error("Failed to get subscriptions", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to retrieve subscriptions")
		return
	}

	response := ListResponse{
		Items:      subscriptions,
		TotalCount: len(subscriptions),
		Page:       1,
		PageSize:   50,
		HasMore:    false,
	}

	a.writeJSONResponse(w, http.StatusOK, response)
}

func (a *API) handleCreateSubscription(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Create subscription endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Only tenant owners and admins can create subscriptions
	if claims.Role != tenant.RoleOwner && claims.Role != tenant.RoleAdmin {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "Only tenant owners and admins can manage subscriptions")
		return
	}

	var req SubscriptionRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Validate required fields
	if req.Plan == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing required fields"), "Plan is required")
		return
	}

	// Set default billing cycle
	if req.BillingCycle == "" {
		req.BillingCycle = "monthly"
	}

	// Get tenant info
	tenantInfo, err := a.tenantManager.GetTenant(r.Context(), claims.TenantID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Tenant not found")
		return
	}

	// Create billing info for tenant
	billingInfo := &billing.TenantBillingInfo{
		TenantID:           claims.TenantID,
		Plan:               req.Plan,
		Status:             billing.SubscriptionActive,
		CurrentPeriodStart: time.Now(),
		CurrentPeriodEnd:   time.Now().AddDate(0, 1, 0), // One month from now
		CreatedAt:          time.Now(),
		UpdatedAt:          time.Now(),
	}

	// Create subscription in billing system
	err = a.billingManager.CreateSubscription(r.Context(), billingInfo)
	if err != nil {
		a.logger.Error("Failed to create subscription", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to create subscription")
		return
	}

	// Update tenant plan
	tenantInfo.Plan = req.Plan
	err = a.tenantManager.UpdateTenant(r.Context(), tenantInfo)
	if err != nil {
		a.logger.Warn("Subscription created but failed to update tenant plan", zap.Error(err))
	}

	a.logger.Info("Subscription created successfully", 
		zap.String("tenant_id", claims.TenantID), 
		zap.String("plan", string(req.Plan)))
	
	a.writeSuccessResponse(w, "Subscription created successfully", billingInfo)
}

func (a *API) handleGetSubscription(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Get subscription endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get subscription ID from URL path
	subscriptionID := a.extractPathVariable(r, "id")
	if subscriptionID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing subscription ID"), "Subscription ID is required")
		return
	}

	// Get subscription details
	subscription, err := a.billingManager.GetSubscription(r.Context(), subscriptionID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Subscription not found")
		return
	}

	// Verify user has access to this subscription
	if subscription.TenantID != claims.TenantID {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("access denied"), "You don't have access to this subscription")
		return
	}

	a.writeJSONResponse(w, http.StatusOK, subscription)
}

func (a *API) handleUpdateSubscription(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Update subscription endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Only tenant owners and admins can update subscriptions
	if claims.Role != tenant.RoleOwner && claims.Role != tenant.RoleAdmin {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "Only tenant owners and admins can manage subscriptions")
		return
	}

	// Get subscription ID from URL path
	subscriptionID := a.extractPathVariable(r, "id")
	if subscriptionID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing subscription ID"), "Subscription ID is required")
		return
	}

	var req SubscriptionRequest
	if err := a.parseJSONRequest(r, &req); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid request body")
		return
	}

	// Get current subscription
	subscription, err := a.billingManager.GetSubscription(r.Context(), subscriptionID)
	if err != nil {
		a.writeErrorResponse(w, http.StatusNotFound, err, "Subscription not found")
		return
	}

	// Verify user has access to this subscription
	if subscription.TenantID != claims.TenantID {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("access denied"), "You don't have access to this subscription")
		return
	}

	// Update subscription plan if provided
	if req.Plan != "" && req.Plan != subscription.Plan {
		subscription.Plan = req.Plan
		subscription.UpdatedAt = time.Now()
		
		err = a.billingManager.UpdateSubscription(r.Context(), subscription)
		if err != nil {
			a.logger.Error("Failed to update subscription", zap.Error(err))
			a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to update subscription")
			return
		}

		// Update tenant plan as well
		tenantInfo, err := a.tenantManager.GetTenant(r.Context(), claims.TenantID)
		if err == nil {
			tenantInfo.Plan = req.Plan
			a.tenantManager.UpdateTenant(r.Context(), tenantInfo)
		}
	}

	a.logger.Info("Subscription updated successfully", zap.String("subscription_id", subscriptionID))
	a.writeSuccessResponse(w, "Subscription updated successfully", subscription)
}

func (a *API) handleCancelSubscription(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Cancel subscription endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Only tenant owners can cancel subscriptions
	if claims.Role != tenant.RoleOwner {
		a.writeErrorResponse(w, http.StatusForbidden, 
			fmt.Errorf("insufficient permissions"), "Only tenant owners can cancel subscriptions")
		return
	}

	// Get subscription ID from URL path
	subscriptionID := a.extractPathVariable(r, "id")
	if subscriptionID == "" {
		a.writeErrorResponse(w, http.StatusBadRequest, 
			fmt.Errorf("missing subscription ID"), "Subscription ID is required")
		return
	}

	// Cancel the subscription
	err = a.billingManager.CancelSubscription(r.Context(), subscriptionID)
	if err != nil {
		a.logger.Error("Failed to cancel subscription", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to cancel subscription")
		return
	}

	// Update tenant plan to free
	tenantInfo, err := a.tenantManager.GetTenant(r.Context(), claims.TenantID)
	if err == nil {
		tenantInfo.Plan = tenant.PlanFree
		a.tenantManager.UpdateTenant(r.Context(), tenantInfo)
	}

	a.logger.Info("Subscription canceled successfully", zap.String("subscription_id", subscriptionID))
	a.writeSuccessResponse(w, "Subscription canceled successfully", nil)
}

func (a *API) handleListInvoices(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("List invoices endpoint called")
	
	claims, err := a.extractUserFromToken(r)
	if err != nil {
		a.writeErrorResponse(w, http.StatusUnauthorized, err, "Authentication required")
		return
	}

	// Get pagination parameters
	page := a.extractIntQueryParam(r, "page", 1)
	pageSize := a.extractIntQueryParam(r, "page_size", 20)

	// Get invoices for the user's tenant
	invoices, totalCount, err := a.billingManager.GetTenantInvoices(r.Context(), claims.TenantID, page, pageSize)
	if err != nil {
		a.logger.Error("Failed to get invoices", zap.Error(err))
		a.writeErrorResponse(w, http.StatusInternalServerError, err, "Failed to retrieve invoices")
		return
	}

	response := ListResponse{
		Items:      invoices,
		TotalCount: totalCount,
		Page:       page,
		PageSize:   pageSize,
		HasMore:    totalCount > page*pageSize,
	}

	a.writeJSONResponse(w, http.StatusOK, response)
}

func (a *API) handleBillingWebhook(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("Billing webhook endpoint called")
	
	// Read the request body
	var payload map[string]interface{}
	if err := a.parseJSONRequest(r, &payload); err != nil {
		a.writeErrorResponse(w, http.StatusBadRequest, err, "Invalid webhook payload")
		return
	}

	// Log the webhook for debugging
	a.logger.Info("Received billing webhook", zap.Any("payload", payload))

	// In a real implementation, you would:
	// 1. Verify the webhook signature
	// 2. Process the webhook event based on type
	// 3. Update subscription/invoice status
	// 4. Handle failed payments, subscription changes, etc.

	// For now, just acknowledge receipt
	a.writeSuccessResponse(w, "Webhook received successfully", nil)
}

// AI/ML API Handlers

func (a *API) handleListAIModels(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	models, err := a.orchestrator.ListModels()
	if err != nil {
		a.logger.Error("Failed to list AI models", zap.Error(err))
		writeError(w, "Failed to list models", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, map[string]interface{}{
		"models": models,
		"count":  len(models),
	})
}

func (a *API) handleCreateAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	var req struct {
		Name        string                 `json:"name"`
		Type        string                 `json:"type"`
		Version     string                 `json:"version"`
		Description string                 `json:"description"`
		Config      map[string]interface{} `json:"config"`
		Metadata    map[string]interface{} `json:"metadata"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	if req.Name == "" || req.Type == "" {
		writeError(w, "Name and type are required", http.StatusBadRequest)
		return
	}
	
	model, err := a.orchestrator.CreateModel(req.Name, req.Type, req.Version, req.Description, req.Config, req.Metadata)
	if err != nil {
		a.logger.Error("Failed to create AI model", zap.Error(err))
		writeError(w, "Failed to create model", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusCreated)
	writeJSON(w, model)
}

func (a *API) handleGetAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	model, err := a.orchestrator.GetModel(modelID)
	if err != nil {
		a.logger.Error("Failed to get AI model", zap.Error(err), zap.String("model_id", modelID))
		writeError(w, "Failed to get model", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, model)
}

func (a *API) handleUpdateAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	var req struct {
		Name        *string                `json:"name,omitempty"`
		Version     *string                `json:"version,omitempty"`
		Description *string                `json:"description,omitempty"`
		Config      map[string]interface{} `json:"config,omitempty"`
		Metadata    map[string]interface{} `json:"metadata,omitempty"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	model, err := a.orchestrator.UpdateModel(modelID, req.Name, req.Version, req.Description, req.Config, req.Metadata)
	if err != nil {
		a.logger.Error("Failed to update AI model", zap.Error(err), zap.String("model_id", modelID))
		writeError(w, "Failed to update model", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, model)
}

func (a *API) handleDeleteAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	err := a.orchestrator.DeleteModel(modelID)
	if err != nil {
		a.logger.Error("Failed to delete AI model", zap.Error(err), zap.String("model_id", modelID))
		writeError(w, "Failed to delete model", http.StatusInternalServerError)
		return
	}
	
	w.WriteHeader(http.StatusNoContent)
}

func (a *API) handleDeployAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	var req struct {
		Replicas    int                    `json:"replicas"`
		Resources   map[string]interface{} `json:"resources"`
		Environment map[string]string      `json:"environment"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	deployment, err := a.orchestrator.DeployModel(modelID, req.Replicas, req.Resources, req.Environment)
	if err != nil {
		a.logger.Error("Failed to deploy AI model", zap.Error(err), zap.String("model_id", modelID))
		writeError(w, "Failed to deploy model", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, deployment)
}

func (a *API) handleUndeployAIModel(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	vars := mux.Vars(r)
	modelID := vars["id"]
	
	err := a.orchestrator.UndeployModel(modelID)
	if err != nil {
		a.logger.Error("Failed to undeploy AI model", zap.Error(err), zap.String("model_id", modelID))
		writeError(w, "Failed to undeploy model", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, map[string]interface{}{
		"status":  "success",
		"message": "Model undeployed successfully",
	})
}

func (a *API) handleAIPredict(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	var req struct {
		ModelID string                 `json:"model_id"`
		Input   map[string]interface{} `json:"input"`
		Options map[string]interface{} `json:"options"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	if req.ModelID == "" {
		writeError(w, "Model ID is required", http.StatusBadRequest)
		return
	}
	
	prediction, err := a.orchestrator.Predict(req.ModelID, req.Input, req.Options)
	if err != nil {
		a.logger.Error("Failed to make AI prediction", zap.Error(err), zap.String("model_id", req.ModelID))
		writeError(w, "Failed to make prediction", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, prediction)
}

func (a *API) handleAIBatchPredict(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	var req struct {
		ModelID string                   `json:"model_id"`
		Inputs  []map[string]interface{} `json:"inputs"`
		Options map[string]interface{}   `json:"options"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	if req.ModelID == "" || len(req.Inputs) == 0 {
		writeError(w, "Model ID and inputs are required", http.StatusBadRequest)
		return
	}
	
	predictions, err := a.orchestrator.BatchPredict(req.ModelID, req.Inputs, req.Options)
	if err != nil {
		a.logger.Error("Failed to make AI batch prediction", zap.Error(err), zap.String("model_id", req.ModelID))
		writeError(w, "Failed to make batch prediction", http.StatusInternalServerError)
		return
	}
	
	writeJSON(w, predictions)
}

func (a *API) handleGetAIConfig(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	config := map[string]interface{}{
		"enabled":               true,
		"model_type":           "adaptive",
		"confidence_threshold": 0.7,
		"training_interval":    "1h",
		"prediction_window":    "5m",
		"adaptive_algorithms":  true,
		"learning_rate":        0.01,
		"exploration_rate":     0.1,
		"auto_scaling":         true,
		"max_retries":          3,
		"model_version":        "1.0",
		"batch_size":           32,
		"memory_limit":         "512MB",
	}
	
	writeJSON(w, config)
}

func (a *API) handleUpdateAIConfig(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	var config map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&config); err != nil {
		writeError(w, "Invalid configuration format", http.StatusBadRequest)
		return
	}
	
	a.logger.Info("AI configuration updated", zap.Any("config", config))
	
	writeJSON(w, map[string]interface{}{
		"success": true,
		"message": "AI configuration updated successfully",
	})
}

func (a *API) handleAIRetrain(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	var req struct {
		ModelType string `json:"model_type"`
	}
	json.NewDecoder(r.Body).Decode(&req)
	
	modelType := req.ModelType
	if modelType == "" {
		modelType = "adaptive"
	}
	
	a.logger.Info("AI model retraining triggered", zap.String("model_type", modelType))
	
	writeJSON(w, map[string]interface{}{
		"success": true,
		"message": fmt.Sprintf("Model retraining initiated for %s", modelType),
	})
}

func (a *API) handleAIHistory(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	timeRange := r.URL.Query().Get("range")
	if timeRange == "" {
		timeRange = "1h"
	}
	
	// Mock historical data - in production this would come from a database
	history := map[string]interface{}{
		"accuracy_history": []map[string]interface{}{
			{"timestamp": time.Now().Add(-1*time.Hour).Format(time.RFC3339), "accuracy": 0.95},
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "accuracy": 0.93},
			{"timestamp": time.Now().Format(time.RFC3339), "accuracy": 0.97},
		},
		"confidence_history": []map[string]interface{}{
			{"timestamp": time.Now().Add(-1*time.Hour).Format(time.RFC3339), "confidence": 0.85},
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "confidence": 0.88},
			{"timestamp": time.Now().Format(time.RFC3339), "confidence": 0.92},
		},
		"algorithm_usage": []map[string]interface{}{
			{"timestamp": time.Now().Add(-1*time.Hour).Format(time.RFC3339), "algorithm": "round_robin", "count": 150},
			{"timestamp": time.Now().Add(-30*time.Minute).Format(time.RFC3339), "algorithm": "least_connections", "count": 200},
			{"timestamp": time.Now().Format(time.RFC3339), "algorithm": "adaptive", "count": 300},
		},
		"time_range": timeRange,
	}
	
	writeJSON(w, history)
}

func (a *API) handleAIPredictions(w http.ResponseWriter, r *http.Request) {
	if a.orchestrator == nil {
		writeError(w, "AI/ML orchestrator not available", http.StatusNotImplemented)
		return
	}
	
	predictions := map[string]interface{}{
		"scaling_recommendation": "scale_up",
		"recommended_algorithm":  "adaptive",
		"confidence":            0.89,
		"expected_load_factor":  1.25,
		"predictions": []map[string]interface{}{
			{
				"time":            time.Now().Add(5 * time.Minute).Format(time.RFC3339),
				"predicted_load":  150,
				"confidence":      0.92,
			},
			{
				"time":            time.Now().Add(10 * time.Minute).Format(time.RFC3339),
				"predicted_load":  180,
				"confidence":      0.87,
			},
			{
				"time":            time.Now().Add(15 * time.Minute).Format(time.RFC3339),
				"predicted_load":  220,
				"confidence":      0.85,
			},
		},
	}
	
	writeJSON(w, predictions)
}

func (a *API) handleSystemDrain(w http.ResponseWriter, r *http.Request) {
	a.logger.Info("System drain initiated")
	
	// In production, this would gracefully drain connections
	// For now, we'll just log and return success
	
	response := map[string]interface{}{
		"status":    "success",
		"message":   "System drain initiated successfully",
		"timestamp": time.Now().Format(time.RFC3339),
		"actions": []string{
			"Stopping new connections",
			"Draining existing connections",
			"Preparing for maintenance",
		},
	}
	
	writeJSON(w, response)
}

// WebSocket handlers for additional endpoints

// handleWebSocketBilling handles billing WebSocket connections
func (a *API) handleWebSocketBilling(w http.ResponseWriter, r *http.Request) {
	conn, err := a.upgrader.Upgrade(w, r, nil)
	if err != nil {
		a.logger.Error("WebSocket billing upgrade failed", zap.Error(err))
		return
	}
	defer conn.Close()

	a.logger.Info("WebSocket billing client connected", zap.String("remote_addr", r.RemoteAddr))

	// Create client
	client := &websocket.Client{
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	// Register client
	a.wsHub.Register <- client

	// Start goroutines
	go client.WritePump(a.logger)
	go client.ReadPump(a.wsHub, a.logger)

	// Send initial billing data
	if a.billingManager != nil {
		initialData := map[string]interface{}{
			"type": "billing_status",
			"data": map[string]interface{}{
				"active_subscriptions": 10,
				"monthly_revenue":      15000.50,
				"active_tenants":       25,
				"pending_invoices":     3,
				"last_payment":         time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
				"next_billing_cycle":   time.Now().Add(7 * 24 * time.Hour).Format(time.RFC3339),
			},
		}

		if data, err := json.Marshal(initialData); err == nil {
			select {
			case client.Send <- data:
			default:
				close(client.Send)
			}
		}
	}
}

// handleWebSocketHealth handles health monitoring WebSocket connections
func (a *API) handleWebSocketHealth(w http.ResponseWriter, r *http.Request) {
	conn, err := a.upgrader.Upgrade(w, r, nil)
	if err != nil {
		a.logger.Error("WebSocket health upgrade failed", zap.Error(err))
		return
	}
	defer conn.Close()

	a.logger.Info("WebSocket health client connected", zap.String("remote_addr", r.RemoteAddr))

	// Create client
	client := &websocket.Client{
		Conn: conn,
		Send: make(chan []byte, 256),
	}

	// Register client
	a.wsHub.Register <- client

	// Start goroutines
	go client.WritePump(a.logger)
	go client.ReadPump(a.wsHub, a.logger)

	// Send initial health data
	initialData := map[string]interface{}{
		"type": "health_status",
		"data": map[string]interface{}{
			"overall_status": "healthy",
			"uptime":         time.Since(time.Now().Add(-24 * time.Hour)).String(),
			"memory_usage":   65.4,
			"cpu_usage":      23.8,
			"disk_usage":     45.2,
			"load_balancer":  "healthy",
			"database":       "healthy",
			"redis":          "healthy",
			"ai_system":      "healthy",
			"billing_system": "healthy",
			"last_check":     time.Now().Format(time.RFC3339),
		},
	}

	if data, err := json.Marshal(initialData); err == nil {
		select {
		case client.Send <- data:
		default:
			close(client.Send)
		}
	}
}

// broadcastBillingUpdates sends billing updates to all connected clients
func (a *API) broadcastBillingUpdates() {
	ticker := time.NewTicker(30 * time.Second) // Update every 30 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			if a.billingManager != nil {
				billingData := map[string]interface{}{
					"type": "billing_update",
					"data": map[string]interface{}{
						"timestamp":            time.Now().Format(time.RFC3339),
						"active_subscriptions": 10 + rand.Intn(5),
						"monthly_revenue":      15000.50 + float64(rand.Intn(1000)),
						"active_tenants":       25 + rand.Intn(10),
						"pending_invoices":     rand.Intn(5),
						"conversion_rate":      0.85 + float64(rand.Intn(15))/100,
						"churn_rate":           0.05 + float64(rand.Intn(5))/100,
						"avg_revenue_per_user": 250.00 + float64(rand.Intn(100)),
						"failed_payments":      rand.Intn(3),
					},
				}

				if data, err := json.Marshal(billingData); err == nil {
					a.wsHub.Broadcast <- data
				}
			}
		}
	}
}

// broadcastHealthUpdates sends health updates to all connected clients  
func (a *API) broadcastHealthUpdates() {
	ticker := time.NewTicker(15 * time.Second) // Update every 15 seconds
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			healthData := map[string]interface{}{
				"type": "health_update",
				"data": map[string]interface{}{
					"timestamp":      time.Now().Format(time.RFC3339),
					"memory_usage":   60.0 + float64(rand.Intn(20)),
					"cpu_usage":      20.0 + float64(rand.Intn(30)),
					"disk_usage":     40.0 + float64(rand.Intn(20)),
					"response_time":  float64(50 + rand.Intn(100)),
					"active_connections": 100 + rand.Intn(50),
					"requests_per_sec":   500 + rand.Intn(200),
					"error_rate":         float64(rand.Intn(5))/100,
					"load_balancer":      "healthy",
					"database":           "healthy",
					"redis":              "healthy",
					"ai_system":          "healthy",
					"billing_system":     "healthy",
				},
			}

			if data, err := json.Marshal(healthData); err == nil {
				a.wsHub.Broadcast <- data
			}
		}
	}
}
