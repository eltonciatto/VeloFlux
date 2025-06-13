package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// OIDCHandlers handles OIDC-related API endpoints
type OIDCHandlers struct {
	logger         *zap.Logger
	oidcManager    *auth.OIDCManager
	authenticator  *auth.Authenticator
	tenantManager  *tenant.Manager
}

// NewOIDCHandlers creates a new OIDC API handler
func NewOIDCHandlers(oidcManager *auth.OIDCManager, authenticator *auth.Authenticator, tenantManager *tenant.Manager, logger *zap.Logger) *OIDCHandlers {
	return &OIDCHandlers{
		logger:         logger,
		oidcManager:    oidcManager,
		authenticator:  authenticator,
		tenantManager:  tenantManager,
	}
}

// SetupRoutes sets up the routes for OIDC API
func (h *OIDCHandlers) SetupRoutes(router *mux.Router) {
	// Public endpoints
	router.HandleFunc("/auth/oidc/callback", h.handleCallback).Methods("GET")
	
	// Tenant-specific protected endpoints
	tenantRouter := router.PathPrefix("/api/tenants/{tenant_id}").Subrouter()
	tenantRouter.Use(h.authenticator.TenantMiddleware)
	tenantRouter.HandleFunc("/oidc/config", h.handleGetOIDCConfig).Methods("GET")
	tenantRouter.HandleFunc("/oidc/config", h.handleSetOIDCConfig).Methods("PUT")
	
	// Login endpoints
	router.HandleFunc("/auth/oidc/login/{tenant_id}", h.handleOIDCLogin).Methods("GET")
}

// handleOIDCLogin initiates OIDC login flow
func (h *OIDCHandlers) handleOIDCLogin(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	
	// Get the return URL from query parameter
	returnURL := r.URL.Query().Get("return_url")
	if returnURL == "" {
		returnURL = "/"
	}
	
	// Create authorization URL
	authURL, err := h.oidcManager.CreateAuthURL(r.Context(), tenantID, returnURL)
	if err != nil {
		h.logger.Error("Failed to create auth URL", zap.Error(err))
		http.Error(w, "Failed to initiate login", http.StatusInternalServerError)
		return
	}
	
	// Redirect to authorization URL
	http.Redirect(w, r, authURL, http.StatusFound)
}

// handleCallback handles OIDC callback
func (h *OIDCHandlers) handleCallback(w http.ResponseWriter, r *http.Request) {
	// Extract state and code from query parameters
	state := r.URL.Query().Get("state")
	code := r.URL.Query().Get("code")
	providerError := r.URL.Query().Get("error")
	providerErrorDescription := r.URL.Query().Get("error_description")
	
	if providerError != "" {
		h.logger.Error("Provider error", 
			zap.String("error", providerError),
			zap.String("description", providerErrorDescription))
		http.Error(w, "Authentication failed: "+providerErrorDescription, http.StatusBadRequest)
		return
	}
	
	if state == "" || code == "" {
		http.Error(w, "Invalid request: missing state or code parameter", http.StatusBadRequest)
		return
	}
	
	// Process callback
	userInfo, returnURL, err := h.oidcManager.HandleCallback(r.Context(), state, code)
	if err != nil {
		h.logger.Error("Failed to handle callback", zap.Error(err))
		
		// Show better error page
		w.WriteHeader(http.StatusUnauthorized)
		w.Header().Set("Content-Type", "text/html")
		w.Write([]byte(`
		<html>
			<head><title>Authentication Failed</title></head>
			<body style="font-family: Arial, sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0;">
				<div style="text-align: center; padding: 20px; border-radius: 5px; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
					<h2 style="color: #d32f2f;">Authentication Failed</h2>
					<p>` + err.Error() + `</p>
					<p><a href="/" style="color: #1976d2;">Return to Home</a></p>
				</div>
			</body>
		</html>
		`))
		return
	}
	
	// Generate JWT token
	token, err := h.authenticator.GenerateToken(userInfo)
	if err != nil {
		h.logger.Error("Failed to generate token", zap.Error(err))
		http.Error(w, "Failed to generate authentication token", http.StatusInternalServerError)
		return
	}
	
	// Set token as cookie
	http.SetCookie(w, &http.Cookie{
		Name:     "auth_token",
		Value:    token,
		Path:     "/",
		Expires:  time.Now().Add(24 * time.Hour),
		HttpOnly: true,
		SameSite: http.SameSiteLaxMode,
		Secure:   r.TLS != nil,
	})
	
	// Redirect to original URL
	if returnURL == "" {
		returnURL = "/"
	}
	
	http.Redirect(w, r, returnURL, http.StatusFound)
}

// handleGetOIDCConfig retrieves OIDC configuration for a tenant
func (h *OIDCHandlers) handleGetOIDCConfig(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	
	// Get OIDC configuration
	config, err := h.oidcManager.GetOIDCConfig(r.Context(), tenantID)
	if err != nil {
		// If not found, return empty config
		if err.Error() == "OIDC configuration not found for tenant: "+tenantID {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"enabled": false,
			})
			return
		}
		
		h.logger.Error("Failed to get OIDC config", zap.Error(err))
		http.Error(w, "Failed to get OIDC configuration", http.StatusInternalServerError)
		return
	}
	
	// Return configuration
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(config)
}

// handleSetOIDCConfig sets OIDC configuration for a tenant
func (h *OIDCHandlers) handleSetOIDCConfig(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]
	
	// Parse request body
	var config auth.OIDCConfig
	err := json.NewDecoder(r.Body).Decode(&config)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	
	// Set OIDC configuration
	err = h.oidcManager.SetOIDCConfig(r.Context(), tenantID, &config)
	if err != nil {
		h.logger.Error("Failed to set OIDC config", zap.Error(err))
		http.Error(w, "Failed to update OIDC configuration", http.StatusInternalServerError)
		return
	}
	
	// Return success
	w.WriteHeader(http.StatusOK)
}
