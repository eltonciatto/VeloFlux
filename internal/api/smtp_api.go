package api

import (
	"encoding/json"
	"net/http"
	"time"

	"github.com/eltonciatto/veloflux/internal/auth"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// SMTPSettingsRequest handles the SMTP settings update request
type SMTPSettingsRequest struct {
	Enabled   bool   `json:"enabled"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
	Username  string `json:"username"`
	Password  string `json:"password,omitempty"`
	FromEmail string `json:"from_email"`
	FromName  string `json:"from_name"`
	UseTLS    bool   `json:"use_tls"`
	AppDomain string `json:"app_domain"`
}

// SMTPSettingsResponse handles the SMTP settings response
type SMTPSettingsResponse struct {
	Enabled   bool   `json:"enabled"`
	Host      string `json:"host"`
	Port      int    `json:"port"`
	Username  string `json:"username"`
	Password  string `json:"password,omitempty"`
	FromEmail string `json:"from_email"`
	FromName  string `json:"from_name"`
	UseTLS    bool   `json:"use_tls"`
	AppDomain string `json:"app_domain"`
}

// SMTPTestRequest handles the SMTP test request
type SMTPTestRequest struct {
	Email  string              `json:"email"`
	Config SMTPSettingsRequest `json:"config"`
}

// RegisterSMTPRoutes adds SMTP-related routes to the router
func (a *API) RegisterSMTPRoutes(r *mux.Router) {
	r.HandleFunc("/tenant/{tenant_id}/smtp-settings", a.handleGetSMTPSettings).Methods("GET")
	r.HandleFunc("/tenant/{tenant_id}/smtp-settings", a.handleUpdateSMTPSettings).Methods("PUT")
	r.HandleFunc("/tenant/{tenant_id}/smtp-test", a.handleTestSMTP).Methods("POST")
}

// handleGetSMTPSettings returns the current SMTP settings
func (a *API) handleGetSMTPSettings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Check authorization
	claims, err := a.authenticator.GetClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if claims.TenantID != tenantID && claims.Role != "admin" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	// In a real implementation, these settings would be fetched from the tenant's configuration
	// For now, we'll return the global SMTP settings if any
	var response SMTPSettingsResponse
	if a.config.Auth.SMTPEnabled {		response = SMTPSettingsResponse{
			Enabled:   a.config.Auth.SMTPEnabled,
			Host:      a.config.Auth.SMTPConfig.Host,
			Port:      a.config.Auth.SMTPConfig.Port,
			Username:  a.config.Auth.SMTPConfig.Username,
			// Don't return actual password, just indicate if one exists
			Password:  "********",
			FromEmail: a.config.Auth.SMTPConfig.FromEmail,
			FromName:  a.config.Auth.SMTPConfig.FromName,
			UseTLS:    a.config.Auth.SMTPConfig.UseTLS,
			AppDomain: a.config.Auth.SMTPConfig.AppDomain,
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		a.logger.Error("Failed to encode SMTP settings response", zap.Error(err))
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
}

// handleUpdateSMTPSettings updates the SMTP settings
func (a *API) handleUpdateSMTPSettings(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Check authorization
	claims, err := a.authenticator.GetClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if claims.TenantID != tenantID && claims.Role != "admin" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req SMTPSettingsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		a.logger.Error("Failed to decode SMTP settings request", zap.Error(err))
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	// Validate settings
	if req.Enabled {
		if req.Host == "" || req.Port == 0 || req.Username == "" || req.FromEmail == "" {
			a.logger.Warn("Invalid SMTP settings provided")
			http.Error(w, "SMTP settings are incomplete", http.StatusBadRequest)
			return
		}
	}

	// In a real implementation, this would update the tenant's configuration in Redis
	// For now, we'll update the global SMTP settings
	a.config.Auth.SMTPEnabled = req.Enabled
	a.config.Auth.SMTPConfig.Host = req.Host
	a.config.Auth.SMTPConfig.Port = req.Port
	a.config.Auth.SMTPConfig.Username = req.Username	if req.Password != "" && req.Password != "********" {
		a.config.Auth.SMTPConfig.Password = req.Password
	}
	a.config.Auth.SMTPConfig.FromEmail = req.FromEmail
	a.config.Auth.SMTPConfig.FromName = req.FromName
	a.config.Auth.SMTPConfig.UseTLS = req.UseTLS
	a.config.Auth.SMTPConfig.AppDomain = req.AppDomain

	// If SMTP is enabled, reinitialize the email provider
	if a.config.Auth.SMTPEnabled {
		a.authenticator.UpdateEmailProvider(auth.NewEmailProvider(a.config.Auth.SMTPConfig, a.logger))
	}

	// Return success
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "SMTP settings updated successfully",
	})
}

// handleTestSMTP tests the SMTP settings by sending a test email
func (a *API) handleTestSMTP(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Check authorization
	claims, err := a.authenticator.GetClaimsFromRequest(r)
	if err != nil {
		http.Error(w, "Unauthorized", http.StatusUnauthorized)
		return
	}

	if claims.TenantID != tenantID && claims.Role != "admin" {
		http.Error(w, "Forbidden", http.StatusForbidden)
		return
	}

	var req SMTPTestRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		a.logger.Error("Failed to decode SMTP test request", zap.Error(err))
		http.Error(w, "Invalid request", http.StatusBadRequest)
		return
	}

	if req.Email == "" {
		a.logger.Warn("No email provided for SMTP test")
		http.Error(w, "Email is required", http.StatusBadRequest)
		return
	}

	// Create temporary email provider with test settings
	testConfig := auth.SMTPConfig{
		Host:      req.Config.Host,
		Port:      req.Config.Port,
		Username:  req.Config.Username,
		Password:  req.Config.Password,
		FromEmail: req.Config.FromEmail,
		FromName:  req.Config.FromName,
		UseTLS:    req.Config.UseTLS,
		AppDomain: req.Config.AppDomain,
	}

	// If password not provided in test config, use existing password
	if testConfig.Password == "" || testConfig.Password == "********" {
		testConfig.Password = a.config.Auth.SMTPConfig.Password
	}

	emailProvider := auth.NewEmailProvider(testConfig, a.logger)

	// Send a test email
	err = emailProvider.SendTestEmail(req.Email)
	if err != nil {
		a.logger.Error("Failed to send test email", zap.Error(err), zap.String("email", req.Email))
		http.Error(w, "Failed to send test email: "+err.Error(), http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusOK)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "success",
		"message": "Test email sent successfully",
	})
}
