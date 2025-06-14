package auth

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/coreos/go-oidc/v3/oidc"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/go-redis/redis/v8"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"golang.org/x/oauth2"
)

// OIDCProvider represents a configured OpenID Connect provider
type OIDCProvider struct {
	Provider     *oidc.Provider
	OAuth2Config oauth2.Config
	Verifier     *oidc.IDTokenVerifier
}

// OIDCConfig holds OIDC provider configuration for a tenant
type OIDCConfig struct {
	Enabled       bool   `json:"enabled"`
	ProviderName  string `json:"provider_name"` // "keycloak", "auth0", "okta", "azure", "google", etc.
	ProviderURL   string `json:"provider_url"`  // Issuer URL
	ClientID      string `json:"client_id"`
	ClientSecret  string `json:"client_secret"`
	RedirectURI   string `json:"redirect_uri"`
	Scopes        string `json:"scopes"`          // Space-separated list
	GroupsClaim   string `json:"groups_claim"`    // Where to find groups/roles in the token
	TenantIDClaim string `json:"tenant_id_claim"` // Where to find tenant ID in the token
}

// OIDCState represents state for OIDC flow
type OIDCState struct {
	StateID     string    `json:"state_id"`
	TenantID    string    `json:"tenant_id"`
	OriginalURL string    `json:"original_url"`
	CreatedAt   time.Time `json:"created_at"`
}

// OIDCManager handles OIDC operations
type OIDCManager struct {
	config        *Config
	logger        *zap.Logger
	tenantManager *tenant.Manager
	client        *redis.Client
	providers     map[string]*OIDCProvider
	providerMu    sync.RWMutex
}

// NewOIDCManager creates a new OIDC manager
func NewOIDCManager(config *Config, tenantManager *tenant.Manager, client *redis.Client, logger *zap.Logger) *OIDCManager {
	return &OIDCManager{
		config:        config,
		logger:        logger.Named("oidc"),
		tenantManager: tenantManager,
		client:        client,
		providers:     make(map[string]*OIDCProvider),
	}
}

// GetOIDCConfig gets OIDC configuration for a tenant
func (m *OIDCManager) GetOIDCConfig(ctx context.Context, tenantID string) (*OIDCConfig, error) {
	data, err := m.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:oidc_config", tenantID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("OIDC configuration not found for tenant: %s", tenantID)
		}
		return nil, err
	}

	var config OIDCConfig
	if err := json.Unmarshal(data, &config); err != nil {
		return nil, err
	}
	// Ensure sensitive fields are not returned to clients
	if strings.HasPrefix(config.ClientSecret, "*****") {
		// Obter o segredo real do armazenamento
		actualSecret, err := m.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:oidc_secret", tenantID)).Result()
		if err == nil && actualSecret != "" {
			config.ClientSecret = actualSecret
		} else {
			// Just clear it if we can't retrieve
			config.ClientSecret = ""
		}
	}

	return &config, nil
}

// SetOIDCConfig sets OIDC configuration for a tenant
func (m *OIDCManager) SetOIDCConfig(ctx context.Context, tenantID string, config *OIDCConfig) error {
	// Store client secret separately with more restrictive access
	if config.ClientSecret != "" && !strings.HasPrefix(config.ClientSecret, "*****") {
		err := m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:oidc_secret", tenantID), config.ClientSecret, 0).Err()
		if err != nil {
			return err
		}

		// Replace actual secret with placeholder in the main config
		displaySecret := "*****"
		if len(config.ClientSecret) > 5 {
			displaySecret = displaySecret + config.ClientSecret[len(config.ClientSecret)-4:]
		}
		config.ClientSecret = displaySecret
	}

	data, err := json.Marshal(config)
	if err != nil {
		return err
	}

	return m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:oidc_config", tenantID), data, 0).Err()
}

// GetProvider returns a configured OIDC provider for the tenant
func (m *OIDCManager) GetProvider(ctx context.Context, tenantID string) (*OIDCProvider, error) {
	// Check if provider is already initialized
	m.providerMu.RLock()
	provider, exists := m.providers[tenantID]
	m.providerMu.RUnlock()

	if exists {
		return provider, nil
	}

	// Get OIDC configuration for tenant
	config, err := m.GetOIDCConfig(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	if !config.Enabled {
		return nil, errors.New("OIDC is not enabled for this tenant")
	}

	// Get client secret
	clientSecret := config.ClientSecret
	if strings.HasPrefix(clientSecret, "*****") {
		secret, err := m.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:oidc_secret", tenantID)).Result()
		if err != nil {
			return nil, errors.New("failed to retrieve client secret")
		}
		clientSecret = secret
		config.ClientSecret = secret // Update the config with the actual secret
	}
	// Create OIDC provider
	oidcProvider, err := oidc.NewProvider(ctx, config.ProviderURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize OIDC provider: %w", err)
	}

	// Configure OAuth2
	scopes := strings.Split(config.Scopes, " ")
	if len(scopes) == 0 || (len(scopes) == 1 && scopes[0] == "") {
		scopes = []string{oidc.ScopeOpenID, "profile", "email"}
	}

	oauth2Config := oauth2.Config{
		ClientID:     config.ClientID,
		ClientSecret: clientSecret,
		RedirectURL:  config.RedirectURI,
		Endpoint:     oidcProvider.Endpoint(),
		Scopes:       scopes,
	}

	// Create verifier
	verifier := oidcProvider.Verifier(&oidc.Config{
		ClientID: config.ClientID,
	})

	// Create provider
	provider = &OIDCProvider{
		Provider:     oidcProvider,
		OAuth2Config: oauth2Config,
		Verifier:     verifier,
	}

	// Store provider
	m.providerMu.Lock()
	m.providers[tenantID] = provider
	m.providerMu.Unlock()

	return provider, nil
}

// CreateAuthURL creates an authorization URL for OIDC flow
func (m *OIDCManager) CreateAuthURL(ctx context.Context, tenantID string, originalURL string) (string, error) {
	provider, err := m.GetProvider(ctx, tenantID)
	if err != nil {
		return "", err
	}

	// Generate state
	stateID := uuid.New().String()
	state := OIDCState{
		StateID:     stateID,
		TenantID:    tenantID,
		OriginalURL: originalURL,
		CreatedAt:   time.Now(),
	}

	// Store state in Redis
	stateData, err := json.Marshal(state)
	if err != nil {
		return "", err
	}

	err = m.client.Set(ctx, fmt.Sprintf("vf:oidc_state:%s", stateID), stateData, 10*time.Minute).Err()
	if err != nil {
		return "", err
	}

	// Generate authorization URL
	authURL := provider.OAuth2Config.AuthCodeURL(stateID, oauth2.AccessTypeOffline)
	return authURL, nil
}

// GetStateByID retrieves OIDC state by ID
func (m *OIDCManager) GetStateByID(ctx context.Context, stateID string) (*OIDCState, error) {
	data, err := m.client.Get(ctx, fmt.Sprintf("vf:oidc_state:%s", stateID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("state not found: %s", stateID)
		}
		return nil, err
	}

	var state OIDCState
	if err := json.Unmarshal(data, &state); err != nil {
		return nil, err
	}

	return &state, nil
}

// HandleCallback handles OIDC callback
func (m *OIDCManager) HandleCallback(ctx context.Context, stateID string, code string) (*tenant.UserInfo, string, error) {
	// Get state
	state, err := m.GetStateByID(ctx, stateID)
	if err != nil {
		return nil, "", err
	}

	// Get provider
	provider, err := m.GetProvider(ctx, state.TenantID)
	if err != nil {
		return nil, "", err
	}

	// Exchange code for token
	oauth2Token, err := provider.OAuth2Config.Exchange(ctx, code)
	if err != nil {
		return nil, "", fmt.Errorf("failed to exchange token: %w", err)
	}

	// Extract ID token
	rawIDToken, ok := oauth2Token.Extra("id_token").(string)
	if !ok {
		return nil, "", errors.New("no ID token in token response")
	}

	// Verify ID token
	idToken, err := provider.Verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return nil, "", fmt.Errorf("failed to verify ID token: %w", err)
	}

	// Get claims
	var claims map[string]interface{}
	if err := idToken.Claims(&claims); err != nil {
		return nil, "", fmt.Errorf("failed to parse claims: %w", err)
	}

	// Get OIDC configuration to find claim mappings
	oidcConfig, err := m.GetOIDCConfig(ctx, state.TenantID)
	if err != nil {
		return nil, "", err
	}

	// Extract user info from claims
	userInfo := &tenant.UserInfo{
		TenantID: state.TenantID,
		Role:     tenant.RoleMember,
	}

	// Map standard claims
	email, _ := claims["email"].(string)
	userInfo.Email = email

	// Try to determine user ID
	sub, _ := claims["sub"].(string)
	if sub != "" {
		userInfo.UserID = sub
	} else {
		// Generate a user ID if not found
		userInfo.UserID = uuid.New().String()
	}

	// Optional name fields
	if name, ok := claims["name"].(string); ok {
		parts := strings.Split(name, " ")
		if len(parts) > 0 {
			userInfo.FirstName = parts[0]
		}
		if len(parts) > 1 {
			userInfo.LastName = strings.Join(parts[1:], " ")
		}
	} else {
		if givenName, ok := claims["given_name"].(string); ok {
			userInfo.FirstName = givenName
		}
		if familyName, ok := claims["family_name"].(string); ok {
			userInfo.LastName = familyName
		}
	}

	// Check for role/group membership
	if oidcConfig.GroupsClaim != "" {
		if groups, ok := claims[oidcConfig.GroupsClaim].([]interface{}); ok {
			for _, group := range groups {
				if groupStr, ok := group.(string); ok {
					if groupStr == "admin" || groupStr == "owner" {
						userInfo.Role = tenant.RoleOwner
						break
					} else if groupStr == "viewer" {
						userInfo.Role = tenant.RoleViewer
					}
				}
			}
		}
	}

	// Ensure user exists in the tenant
	existingUser, err := m.tenantManager.GetUserByEmail(ctx, userInfo.Email)
	if err == nil && existingUser != nil && existingUser.TenantID == state.TenantID {
		// User already exists, keep their existing role
		userInfo.Role = existingUser.Role
		userInfo.UserID = existingUser.UserID
	} else {
		// Add the new user to the tenant
		err = m.tenantManager.AddUser(ctx, userInfo)
		if err != nil {
			return nil, "", fmt.Errorf("failed to add user to tenant: %w", err)
		}
	}

	// Delete the state now that we've processed it
	m.client.Del(ctx, fmt.Sprintf("vf:oidc_state:%s", stateID))

	return userInfo, state.OriginalURL, nil
}

// OIDCMiddleware creates middleware that redirects to OIDC login if needed
func (m *OIDCManager) OIDCMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get the tenant ID from the request (e.g., subdomain, path parameter, etc.)
		tenantID := extractTenantID(r)
		if tenantID == "" {
			next.ServeHTTP(w, r)
			return
		}

		// Check if OIDC is enabled for this tenant
		oidcConfig, err := m.GetOIDCConfig(r.Context(), tenantID)
		if err != nil || !oidcConfig.Enabled {
			next.ServeHTTP(w, r)
			return
		}

		// Check if user is already authenticated
		token := extractBearerToken(r)
		if token != "" {
			// Validate token
			claims := &Claims{}
			_, err := jwt.ParseWithClaims(
				token,
				claims,
				func(token *jwt.Token) (interface{}, error) {
					return []byte(m.config.JWTSecret), nil
				},
			)

			if err == nil && claims.TenantID == tenantID {
				// Token is valid, proceed
				next.ServeHTTP(w, r)
				return
			}
		}

		// User not authenticated, redirect to OIDC login
		authURL, err := m.CreateAuthURL(r.Context(), tenantID, r.URL.String())
		if err != nil {
			http.Error(w, "Authentication error", http.StatusInternalServerError)
			return
		}

		http.Redirect(w, r, authURL, http.StatusFound)
	})
}

// Helper function to extract tenant ID from request
func extractTenantID(r *http.Request) string {
	// Try to get from path parameters
	if tenantID := r.PathValue("tenant_id"); tenantID != "" {
		return tenantID
	}

	// Try to get from subdomain
	host := r.Host
	parts := strings.Split(host, ".")
	if len(parts) > 2 {
		return parts[0]
	}

	return ""
}

// Helper function to extract bearer token
func extractBearerToken(r *http.Request) string {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return ""
	}

	parts := strings.Split(authHeader, " ")
	if len(parts) != 2 || parts[0] != "Bearer" {
		return ""
	}

	return parts[1]
}
