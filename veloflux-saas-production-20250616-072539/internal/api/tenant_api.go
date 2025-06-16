package api

import (
	"encoding/json"
	"fmt"
	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/eltonciatto/veloflux/internal/balancer"
	"github.com/eltonciatto/veloflux/internal/clustering"
	"github.com/eltonciatto/veloflux/internal/config"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
	"net/http"
	"strings"
	"time"
)

// TenantAPI handles tenant management endpoints
type TenantAPI struct {
	config        *config.Config
	logger        *zap.Logger
	tenantManager *tenant.Manager
	auth          *auth.Authenticator
	router        *mux.Router
	balancer      *balancer.Balancer
	cluster       *clustering.Cluster
}

// NewTenantAPI creates a new tenant API
func NewTenantAPI(cfg *config.Config, balancer *balancer.Balancer, tenantManager *tenant.Manager, auth *auth.Authenticator, cluster *clustering.Cluster, logger *zap.Logger) *TenantAPI {
	api := &TenantAPI{
		config:        cfg,
		logger:        logger,
		tenantManager: tenantManager,
		auth:          auth,
		balancer:      balancer,
		cluster:       cluster,
		router:        mux.NewRouter(),
	}

	// Setup routes
	api.setupRoutes()

	return api
}

// setupRoutes configures the API routes
func (api *TenantAPI) setupRoutes() {
	// Public endpoints (no authentication required)
	api.router.HandleFunc("/api/health", api.handleHealth).Methods("GET")

	// Register authentication endpoints
	authRouter := api.router.PathPrefix("/auth").Subrouter()
	authRouter.HandleFunc("/login", api.handleLogin).Methods("POST")
	authRouter.HandleFunc("/register", api.handleRegister).Methods("POST")
	authRouter.HandleFunc("/refresh", api.handleRefreshToken).Methods("POST")

	// Authenticated API routes
	apiRouter := api.router.PathPrefix("/api").Subrouter()
	apiRouter.Use(api.auth.AuthMiddleware)

	// User profile endpoints
	apiRouter.HandleFunc("/profile", api.handleGetProfile).Methods("GET")
	apiRouter.HandleFunc("/profile", api.handleUpdateProfile).Methods("PUT")

	// Tenant management (admin only)
	tenantsRouter := apiRouter.PathPrefix("/tenants").Subrouter()
	tenantsRouter.Use(api.auth.RoleMiddleware(tenant.RoleOwner))
	tenantsRouter.HandleFunc("", api.handleListTenants).Methods("GET")
	tenantsRouter.HandleFunc("", api.handleCreateTenant).Methods("POST")
	tenantsRouter.HandleFunc("/{tenant_id}", api.handleGetTenant).Methods("GET")
	tenantsRouter.HandleFunc("/{tenant_id}", api.handleUpdateTenant).Methods("PUT")
	tenantsRouter.HandleFunc("/{tenant_id}", api.handleDeleteTenant).Methods("DELETE")

	// Tenant-specific API routes (tenant members can access)
	tenantRouter := apiRouter.PathPrefix("/tenants/{tenant_id}").Subrouter()
	tenantRouter.Use(api.auth.TenantMiddleware)

	// Users management
	tenantRouter.HandleFunc("/users", api.handleListTenantUsers).Methods("GET")
	tenantRouter.HandleFunc("/users", api.handleAddTenantUser).Methods("POST")
	tenantRouter.HandleFunc("/users/{user_id}", api.handleUpdateTenantUser).Methods("PUT")
	tenantRouter.HandleFunc("/users/{user_id}", api.handleDeleteTenantUser).Methods("DELETE")

	// Routes management
	tenantRouter.HandleFunc("/routes", api.handleListTenantRoutes).Methods("GET")
	tenantRouter.HandleFunc("/routes", api.handleCreateTenantRoute).Methods("POST")
	tenantRouter.HandleFunc("/routes/{route_id}", api.handleUpdateTenantRoute).Methods("PUT")
	tenantRouter.HandleFunc("/routes/{route_id}", api.handleDeleteTenantRoute).Methods("DELETE")

	// Backends management
	tenantRouter.HandleFunc("/pools", api.handleListTenantPools).Methods("GET")
	tenantRouter.HandleFunc("/pools", api.handleCreateTenantPool).Methods("POST")
	tenantRouter.HandleFunc("/pools/{pool_name}", api.handleGetTenantPool).Methods("GET")
	tenantRouter.HandleFunc("/pools/{pool_name}", api.handleUpdateTenantPool).Methods("PUT")
	tenantRouter.HandleFunc("/pools/{pool_name}", api.handleDeleteTenantPool).Methods("DELETE")
	tenantRouter.HandleFunc("/pools/{pool_name}/backends", api.handleAddTenantBackend).Methods("POST")
	tenantRouter.HandleFunc("/pools/{pool_name}/backends/{backend_address}", api.handleDeleteTenantBackend).Methods("DELETE")

	// Metrics and monitoring
	tenantRouter.HandleFunc("/metrics", api.handleTenantMetrics).Methods("GET")
	tenantRouter.HandleFunc("/usage", api.handleTenantUsage).Methods("GET")
	tenantRouter.HandleFunc("/logs", api.handleTenantLogs).Methods("GET")

	// WAF management
	tenantRouter.HandleFunc("/waf/config", api.handleGetTenantWAFConfig).Methods("GET")
	tenantRouter.HandleFunc("/waf/config", api.handleUpdateTenantWAFConfig).Methods("PUT")

	// Rate limiting configuration
	tenantRouter.HandleFunc("/rate-limit", api.handleGetTenantRateLimit).Methods("GET")
	tenantRouter.HandleFunc("/rate-limit", api.handleUpdateTenantRateLimit).Methods("PUT")
}

// Handler returns the HTTP handler for the API
func (api *TenantAPI) Handler() http.Handler {
	return api.router
}

// Handler implementations

func (api *TenantAPI) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, map[string]string{
		"status":  "ok",
		"version": "1.1.0",
	})
}

func (api *TenantAPI) handleLogin(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// In a real implementation, you would validate credentials against a database
	// For this example, we'll just simulate a successful login

	// In a real system, fetch the user from a database
	userInfo := &tenant.UserInfo{
		UserID:    "user123",
		Email:     req.Email,
		TenantID:  "tenant1",
		Role:      tenant.RoleOwner,
		FirstName: "John",
		LastName:  "Doe",
	}

	// Generate a token
	token, err := api.auth.GenerateToken(userInfo)
	if err != nil {
		api.logger.Error("Failed to generate token", zap.Error(err))
		writeError(w, "Authentication failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{
		"token":      token,
		"expires_in": api.config.Auth.TokenValidity.String(),
		"user_id":    userInfo.UserID,
		"tenant_id":  userInfo.TenantID,
	})
}

func (api *TenantAPI) handleRegister(w http.ResponseWriter, r *http.Request) {
	var req struct {
		Email     string `json:"email"`
		Password  string `json:"password"`
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
		Company   string `json:"company"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// In a real implementation, you would:
	// 1. Validate the email isn't already registered
	// 2. Hash the password
	// 3. Create the tenant
	// 4. Create the user
	// 5. Generate and return a token

	// For this example, we'll just simulate a successful registration
	tenantID := fmt.Sprintf("tenant-%s", time.Now().Format("20060102150405"))
	userID := fmt.Sprintf("user-%s", time.Now().Format("20060102150405"))

	// Create tenant
	t := &tenant.Tenant{
		ID:           tenantID,
		Name:         req.Company,
		Active:       true,
		CreatedAt:    time.Now(),
		Plan:         tenant.PlanFree,
		ContactEmail: req.Email,
	}

	ctx := r.Context()
	if err := api.tenantManager.CreateTenant(ctx, t); err != nil {
		api.logger.Error("Failed to create tenant", zap.Error(err))
		writeError(w, "Registration failed", http.StatusInternalServerError)
		return
	}

	// Create user
	userInfo := &tenant.UserInfo{
		UserID:    userID,
		Email:     req.Email,
		TenantID:  tenantID,
		Role:      tenant.RoleOwner,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	if err := api.tenantManager.AddUser(ctx, userInfo); err != nil {
		api.logger.Error("Failed to create user", zap.Error(err))
		writeError(w, "Registration failed", http.StatusInternalServerError)
		return
	}

	// Generate a token
	token, err := api.auth.GenerateToken(userInfo)
	if err != nil {
		api.logger.Error("Failed to generate token", zap.Error(err))
		writeError(w, "Registration failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"token":      token,
		"expires_in": api.config.Auth.TokenValidity.String(),
		"user_id":    userID,
		"tenant_id":  tenantID,
		"tenant":     t,
	})
}

func (api *TenantAPI) handleRefreshToken(w http.ResponseWriter, r *http.Request) {
	// Extract token from Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" || !strings.HasPrefix(authHeader, "Bearer ") {
		writeError(w, "Valid authorization token required", http.StatusUnauthorized)
		return
	}

	token := strings.TrimPrefix(authHeader, "Bearer ")

	// Verify the token
	claims, err := api.auth.VerifyToken(token)
	if err != nil {
		api.logger.Error("Invalid token", zap.Error(err))
		writeError(w, "Invalid or expired token", http.StatusUnauthorized)
		return
	}

	// Create a new token
	userInfo := &tenant.UserInfo{
		UserID:    claims.UserID,
		Email:     claims.Email,
		TenantID:  claims.TenantID,
		Role:      claims.Role,
		FirstName: claims.FirstName,
		LastName:  claims.LastName,
	}

	newToken, err := api.auth.GenerateToken(userInfo)
	if err != nil {
		api.logger.Error("Failed to generate token", zap.Error(err))
		writeError(w, "Token refresh failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]string{
		"token":      newToken,
		"expires_in": api.config.Auth.TokenValidity.String(),
	})
}

func (api *TenantAPI) handleGetProfile(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		writeError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	writeJSON(w, user)
}

func (api *TenantAPI) handleUpdateProfile(w http.ResponseWriter, r *http.Request) {
	user, err := auth.GetUserFromContext(r.Context())
	if err != nil {
		writeError(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	var req struct {
		FirstName string `json:"first_name"`
		LastName  string `json:"last_name"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Update user info
	user.FirstName = req.FirstName
	user.LastName = req.LastName

	ctx := r.Context()
	if err := api.tenantManager.UpdateUser(ctx, user); err != nil {
		api.logger.Error("Failed to update user", zap.Error(err))
		writeError(w, "Update failed", http.StatusInternalServerError)
		return
	}

	writeJSON(w, user)
}

func (api *TenantAPI) handleListTenants(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenants, err := api.tenantManager.ListTenants(ctx)
	if err != nil {
		api.logger.Error("Failed to list tenants", zap.Error(err))
		writeError(w, "Failed to retrieve tenants", http.StatusInternalServerError)
		return
	}

	writeJSON(w, tenants)
}

func (api *TenantAPI) handleCreateTenant(w http.ResponseWriter, r *http.Request) {
	var req struct {
		ID           string          `json:"id"`
		Name         string          `json:"name"`
		Plan         tenant.PlanType `json:"plan"`
		ContactEmail string          `json:"contact_email"`
		CustomDomain string          `json:"custom_domain,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Create tenant
	t := &tenant.Tenant{
		ID:           req.ID,
		Name:         req.Name,
		Plan:         req.Plan,
		Active:       true,
		CreatedAt:    time.Now(),
		ContactEmail: req.ContactEmail,
		CustomDomain: req.CustomDomain,
	}

	ctx := r.Context()
	if err := api.tenantManager.CreateTenant(ctx, t); err != nil {
		api.logger.Error("Failed to create tenant", zap.Error(err))
		writeError(w, "Failed to create tenant", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, t)
}

func (api *TenantAPI) handleGetTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		api.logger.Error("Failed to get tenant", zap.Error(err))
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	writeJSON(w, t)
}

func (api *TenantAPI) handleUpdateTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var req struct {
		Name         string             `json:"name"`
		Plan         tenant.PlanType    `json:"plan"`
		Active       bool               `json:"active"`
		ContactEmail string             `json:"contact_email"`
		CustomDomain string             `json:"custom_domain,omitempty"`
		Limits       tenant.LimitConfig `json:"limits,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		api.logger.Error("Failed to get tenant", zap.Error(err))
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Update fields
	t.Name = req.Name
	t.Plan = req.Plan
	t.Active = req.Active
	t.ContactEmail = req.ContactEmail
	if req.CustomDomain != "" {
		t.CustomDomain = req.CustomDomain
	}
	if req.Limits.MaxRequestsPerSecond > 0 {
		t.Limits = req.Limits
	}

	if err := api.tenantManager.UpdateTenant(ctx, t); err != nil {
		api.logger.Error("Failed to update tenant", zap.Error(err))
		writeError(w, "Failed to update tenant", http.StatusInternalServerError)
		return
	}

	writeJSON(w, t)
}

func (api *TenantAPI) handleDeleteTenant(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	ctx := r.Context()
	if err := api.tenantManager.DeleteTenant(ctx, tenantID); err != nil {
		api.logger.Error("Failed to delete tenant", zap.Error(err))
		writeError(w, "Failed to delete tenant", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *TenantAPI) handleListTenantUsers(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	ctx := r.Context()
	users, err := api.tenantManager.GetTenantUsers(ctx, tenantID)
	if err != nil {
		api.logger.Error("Failed to list users", zap.Error(err))
		writeError(w, "Failed to retrieve users", http.StatusInternalServerError)
		return
	}

	writeJSON(w, users)
}

func (api *TenantAPI) handleAddTenantUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var req struct {
		Email     string      `json:"email"`
		Role      tenant.Role `json:"role"`
		FirstName string      `json:"first_name,omitempty"`
		LastName  string      `json:"last_name,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Generate a new user ID
	userID := fmt.Sprintf("user-%s", time.Now().Format("20060102150405"))

	// Create user
	user := &tenant.UserInfo{
		UserID:    userID,
		Email:     req.Email,
		TenantID:  tenantID,
		Role:      req.Role,
		FirstName: req.FirstName,
		LastName:  req.LastName,
	}

	ctx := r.Context()
	if err := api.tenantManager.AddUser(ctx, user); err != nil {
		api.logger.Error("Failed to add user", zap.Error(err))
		writeError(w, "Failed to add user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, user)
}

func (api *TenantAPI) handleUpdateTenantUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	userID := vars["user_id"]

	var req struct {
		Role      tenant.Role `json:"role"`
		FirstName string      `json:"first_name,omitempty"`
		LastName  string      `json:"last_name,omitempty"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	ctx := r.Context()
	user, err := api.tenantManager.GetUserByID(ctx, userID)
	if err != nil {
		api.logger.Error("Failed to get user", zap.Error(err))
		writeError(w, "User not found", http.StatusNotFound)
		return
	}

	// Ensure user belongs to this tenant
	if user.TenantID != tenantID {
		writeError(w, "User not found in this tenant", http.StatusNotFound)
		return
	}

	// Update fields
	user.Role = req.Role
	if req.FirstName != "" {
		user.FirstName = req.FirstName
	}
	if req.LastName != "" {
		user.LastName = req.LastName
	}

	if err := api.tenantManager.UpdateUser(ctx, user); err != nil {
		api.logger.Error("Failed to update user", zap.Error(err))
		writeError(w, "Failed to update user", http.StatusInternalServerError)
		return
	}

	writeJSON(w, user)
}

func (api *TenantAPI) handleDeleteTenantUser(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	userID := vars["user_id"]

	ctx := r.Context()
	if err := api.tenantManager.RemoveUser(ctx, userID, tenantID); err != nil {
		api.logger.Error("Failed to remove user", zap.Error(err))
		writeError(w, "Failed to remove user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Route management endpoints

func (api *TenantAPI) handleListTenantRoutes(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get tenant configuration from Redis using tenant prefix (future implementation)
	_ = r.Context()
	_ = fmt.Sprintf("%s:routes", api.tenantManager.GetConfigPrefix(tenantID))

	var routes []config.Route
	// In a real implementation, you would fetch tenant-specific routes from Redis

	// For now, we'll return empty routes
	writeJSON(w, routes)
}

func (api *TenantAPI) handleCreateTenantRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var route config.Route
	if err := json.NewDecoder(r.Body).Decode(&route); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Validate the route belongs to a pool owned by this tenant
	poolPrefix := fmt.Sprintf("%s:pool:", tenantID)
	if !strings.HasPrefix(route.Pool, poolPrefix) {
		route.Pool = poolPrefix + route.Pool
	}

	// Store in Redis with tenant prefix
	// In a real implementation, you would add the route to Redis

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		routeKey := fmt.Sprintf("%s:route:%s", tenantID, route.Host)
		data, _ := json.Marshal(route)
		api.cluster.PublishState(clustering.StateRoute, routeKey, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, route)
}

func (api *TenantAPI) handleUpdateTenantRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	routeID := vars["route_id"]

	var route config.Route
	if err := json.NewDecoder(r.Body).Decode(&route); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Validate route exists for this tenant
	// In a real implementation, you would check if the route exists

	// Update in Redis with tenant prefix
	// In a real implementation, you would update the route in Redis

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		routeKey := fmt.Sprintf("%s:route:%s", tenantID, routeID)
		data, _ := json.Marshal(route)
		api.cluster.PublishState(clustering.StateRoute, routeKey, data)
	}

	writeJSON(w, route)
}

func (api *TenantAPI) handleDeleteTenantRoute(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	routeID := vars["route_id"]

	// Delete from Redis with tenant prefix
	// In a real implementation, you would delete the route from Redis

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		routeKey := fmt.Sprintf("%s:route:%s", tenantID, routeID)
		api.cluster.PublishState(clustering.StateRoute, routeKey, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

// Pools and backends management

func (api *TenantAPI) handleListTenantPools(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	_ = tenantID

	// Get tenant pools from balancer
	// In a real implementation, you would fetch pools with tenant prefix

	// For now, we'll return empty pools
	writeJSON(w, []config.Pool{})
}

func (api *TenantAPI) handleCreateTenantPool(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var poolReq struct {
		Name           string `json:"name"`
		Algorithm      string `json:"algorithm"`
		StickySessions bool   `json:"sticky_sessions"`
	}

	if err := json.NewDecoder(r.Body).Decode(&poolReq); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Add tenant prefix to pool name
	poolName := fmt.Sprintf("%s:pool:%s", tenantID, poolReq.Name)

	// Create pool configuration
	pool := config.Pool{
		Name:           poolName,
		Algorithm:      poolReq.Algorithm,
		StickySessions: poolReq.StickySessions,
		Backends:       []config.Backend{},
	}

	// Add to balancer
	api.balancer.AddPool(pool)

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		data, _ := json.Marshal(pool)
		api.cluster.PublishState(clustering.StatePool, poolName, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, pool)
}

func (api *TenantAPI) handleGetTenantPool(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	poolName := vars["pool_name"]

	// Add tenant prefix to pool name
	fullPoolName := fmt.Sprintf("%s:pool:%s", tenantID, poolName)

	// Get pool from balancer
	pool := api.balancer.GetPool(fullPoolName)
	if pool == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	writeJSON(w, pool)
}

func (api *TenantAPI) handleUpdateTenantPool(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	poolName := vars["pool_name"]

	var poolReq struct {
		Algorithm      string `json:"algorithm"`
		StickySessions bool   `json:"sticky_sessions"`
	}

	if err := json.NewDecoder(r.Body).Decode(&poolReq); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Add tenant prefix to pool name
	fullPoolName := fmt.Sprintf("%s:pool:%s", tenantID, poolName)

	// Check if pool exists
	existingPool := api.balancer.GetPool(fullPoolName)
	if existingPool == nil {
		writeError(w, "Pool not found", http.StatusNotFound)
		return
	}

	// Update pool configuration
	pool := config.Pool{
		Name:           fullPoolName,
		Algorithm:      poolReq.Algorithm,
		StickySessions: poolReq.StickySessions,
		Backends:       existingPool.Backends,
	}

	// Update in balancer
	api.balancer.UpdatePool(pool)

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		data, _ := json.Marshal(pool)
		api.cluster.PublishState(clustering.StatePool, fullPoolName, data)
	}

	writeJSON(w, pool)
}

func (api *TenantAPI) handleDeleteTenantPool(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	poolName := vars["pool_name"]

	// Add tenant prefix to pool name
	fullPoolName := fmt.Sprintf("%s:pool:%s", tenantID, poolName)

	// Remove from balancer
	api.balancer.RemovePool(fullPoolName)

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		api.cluster.PublishState(clustering.StatePool, fullPoolName, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

func (api *TenantAPI) handleAddTenantBackend(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	poolName := vars["pool_name"]

	var backend config.Backend
	if err := json.NewDecoder(r.Body).Decode(&backend); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Add tenant prefix to pool name
	fullPoolName := fmt.Sprintf("%s:pool:%s", tenantID, poolName)

	// Add to balancer
	api.balancer.AddBackend(fullPoolName, backend)

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		key := fmt.Sprintf("%s/%s", fullPoolName, backend.Address)
		data, _ := json.Marshal(backend)
		api.cluster.PublishState(clustering.StateBackend, key, data)
	}

	w.WriteHeader(http.StatusCreated)
	writeJSON(w, backend)
}

func (api *TenantAPI) handleDeleteTenantBackend(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	poolName := vars["pool_name"]
	address := vars["backend_address"]

	// Add tenant prefix to pool name
	fullPoolName := fmt.Sprintf("%s:pool:%s", tenantID, poolName)

	// Remove from balancer
	if err := api.balancer.RemoveBackend(fullPoolName, address); err != nil {
		writeError(w, err.Error(), http.StatusNotFound)
		return
	}

	// If cluster is enabled, publish state change
	if api.cluster != nil && api.cluster.IsLeader() {
		key := fmt.Sprintf("%s/%s", fullPoolName, address)
		api.cluster.PublishState(clustering.StateBackend, key, nil)
	}

	w.WriteHeader(http.StatusNoContent)
}

// WAF and Rate Limit configuration

func (api *TenantAPI) handleGetTenantWAFConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get tenant
	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Return WAF configuration
	wafConfig := map[string]interface{}{
		"enabled": true,
		"level":   t.Limits.WAFLevel,
	}

	writeJSON(w, wafConfig)
}

func (api *TenantAPI) handleUpdateTenantWAFConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var wafReq struct {
		Enabled bool   `json:"enabled"`
		Level   string `json:"level"`
	}

	if err := json.NewDecoder(r.Body).Decode(&wafReq); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Get tenant
	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Update WAF level
	t.Limits.WAFLevel = wafReq.Level

	// Update tenant
	if err := api.tenantManager.UpdateTenant(ctx, t); err != nil {
		writeError(w, "Failed to update WAF configuration", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"enabled": wafReq.Enabled,
		"level":   wafReq.Level,
	})
}

func (api *TenantAPI) handleGetTenantRateLimit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get tenant
	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Return rate limit configuration
	rateLimitConfig := map[string]interface{}{
		"requests_per_second": t.Limits.MaxRequestsPerSecond,
		"burst_size":          t.Limits.MaxBurstSize,
	}

	writeJSON(w, rateLimitConfig)
}

func (api *TenantAPI) handleUpdateTenantRateLimit(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	var rateLimitReq struct {
		RequestsPerSecond int `json:"requests_per_second"`
		BurstSize         int `json:"burst_size"`
	}

	if err := json.NewDecoder(r.Body).Decode(&rateLimitReq); err != nil {
		writeError(w, "Invalid request format", http.StatusBadRequest)
		return
	}

	// Get tenant
	ctx := r.Context()
	t, err := api.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		writeError(w, "Tenant not found", http.StatusNotFound)
		return
	}

	// Check if the rate limit exceeds the plan limits
	planLimit := api.tenantManager.GetDefaultLimits(t.Plan).MaxRequestsPerSecond
	if rateLimitReq.RequestsPerSecond > planLimit {
		writeError(w, fmt.Sprintf("Rate limit exceeds plan limit of %d requests per second", planLimit), http.StatusBadRequest)
		return
	}

	// Update rate limit configuration
	t.Limits.MaxRequestsPerSecond = rateLimitReq.RequestsPerSecond
	t.Limits.MaxBurstSize = rateLimitReq.BurstSize

	// Update tenant
	if err := api.tenantManager.UpdateTenant(ctx, t); err != nil {
		writeError(w, "Failed to update rate limit configuration", http.StatusInternalServerError)
		return
	}

	writeJSON(w, map[string]interface{}{
		"requests_per_second": rateLimitReq.RequestsPerSecond,
		"burst_size":          rateLimitReq.BurstSize,
	})
}

// Metrics and monitoring

func (api *TenantAPI) handleTenantMetrics(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// In a real implementation, you would fetch metrics with tenant labels
	metrics := map[string]interface{}{
		"total_requests":           1000,
		"error_rate":               0.01,
		"average_response_time_ms": 120,
		"requests_per_second":      10,
		"bandwidth_mb":             150,
		"tenant_id":                tenantID,
	}

	writeJSON(w, metrics)
}

func (api *TenantAPI) handleTenantUsage(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get period from query parameters
	period := r.URL.Query().Get("period")
	if period == "" {
		period = "day"
	}

	// In a real implementation, you would fetch usage data from a database
	usage := map[string]interface{}{
		"period":                   period,
		"tenant_id":                tenantID,
		"total_requests":           45000,
		"total_bandwidth_mb":       1500,
		"average_response_time_ms": 120,
		"error_rate":               0.01,
	}

	writeJSON(w, usage)
}

func (api *TenantAPI) handleTenantLogs(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get query parameters
	limit := 100
	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if n, err := fmt.Sscanf(limitStr, "%d", &limit); err != nil || n != 1 {
			limit = 100
		}
	}

	// In a real implementation, you would fetch logs with tenant filters
	logs := []map[string]interface{}{
		{
			"timestamp":        time.Now().Add(-5 * time.Minute).Format(time.RFC3339),
			"level":            "info",
			"message":          "Request processed successfully",
			"tenant_id":        tenantID,
			"route":            "api.example.com",
			"method":           "GET",
			"path":             "/users",
			"status_code":      200,
			"response_time_ms": 120,
		},
		{
			"timestamp":        time.Now().Add(-10 * time.Minute).Format(time.RFC3339),
			"level":            "error",
			"message":          "Backend connection failed",
			"tenant_id":        tenantID,
			"route":            "api.example.com",
			"method":           "POST",
			"path":             "/orders",
			"status_code":      502,
			"response_time_ms": 5000,
		},
	}

	writeJSON(w, map[string]interface{}{
		"logs":  logs,
		"total": len(logs),
		"limit": limit,
	})
}

// Utility functions
