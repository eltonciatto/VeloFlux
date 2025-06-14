package auth

import (
	"context"
	"errors"
	"fmt"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"net/http"
	"strings"
	"time"
)

// Config for authentication
type Config struct {
	JWTSecret       string        `yaml:"jwt_secret"`
	JWTIssuer       string        `yaml:"jwt_issuer"`
	JWTAudience     string        `yaml:"jwt_audience"`
	TokenValidity   time.Duration `yaml:"token_validity"`
	OIDCEnabled     bool          `yaml:"oidc_enabled"`
	OIDCIssuerURL   string        `yaml:"oidc_issuer_url"`
	OIDCClientID    string        `yaml:"oidc_client_id"`
	OIDCRedirectURI string        `yaml:"oidc_redirect_uri"`
}

// Claims represents the JWT claims
type Claims struct {
	jwt.RegisteredClaims
	UserID    string      `json:"user_id"`
	Email     string      `json:"email"`
	TenantID  string      `json:"tenant_id"`
	Role      tenant.Role `json:"role"`
	FirstName string      `json:"first_name,omitempty"`
	LastName  string      `json:"last_name,omitempty"`
}

// Authenticator handles authentication
type Authenticator struct {
	config        *Config
	logger        *zap.Logger
	tenantManager *tenant.Manager
}

// New creates a new authenticator
func New(config *Config, tenantManager *tenant.Manager, logger *zap.Logger) *Authenticator {
	// Set defaults
	if config.TokenValidity == 0 {
		config.TokenValidity = 24 * time.Hour
	}

	return &Authenticator{
		config:        config,
		logger:        logger,
		tenantManager: tenantManager,
	}
}

// GenerateToken generates a JWT token for a user
func (a *Authenticator) GenerateToken(user *tenant.UserInfo) (string, error) {
	expirationTime := time.Now().Add(a.config.TokenValidity)

	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    a.config.JWTIssuer,
			Subject:   user.UserID,
			Audience:  []string{a.config.JWTAudience},
		},
		UserID:    user.UserID,
		Email:     user.Email,
		TenantID:  user.TenantID,
		Role:      user.Role,
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(a.config.JWTSecret))

	return tokenString, err
}

// VerifyToken validates a JWT token
func (a *Authenticator) VerifyToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(a.config.JWTSecret), nil
		},
		jwt.WithAudience(a.config.JWTAudience),
		jwt.WithIssuer(a.config.JWTIssuer),
	)

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// AuthMiddleware is a middleware function that checks for JWT token
func (a *Authenticator) AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Extract token from Authorization header
		authHeader := r.Header.Get("Authorization")
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Check if the Authorization header has the right format
		if !strings.HasPrefix(authHeader, "Bearer ") {
			http.Error(w, "Invalid authorization format", http.StatusUnauthorized)
			return
		}

		// Extract the token
		token := strings.TrimPrefix(authHeader, "Bearer ")

		// Verify the token
		claims, err := a.VerifyToken(token)
		if err != nil {
			a.logger.Error("Invalid token", zap.Error(err))
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Store claims in request context
		ctx := context.WithValue(r.Context(), "claims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// TenantMiddleware ensures that a user can only access their tenant's resources
func (a *Authenticator) TenantMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		// Get claims from context
		claims, ok := r.Context().Value("claims").(*Claims)
		if !ok {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		// Extract tenant ID from path or query parameters
		// For example, if the path is /api/tenants/123/routes
		pathParts := strings.Split(r.URL.Path, "/")
		var pathTenantID string

		for i, part := range pathParts {
			if part == "tenants" && i+1 < len(pathParts) {
				pathTenantID = pathParts[i+1]
				break
			}
		}

		// If no tenant ID in path, check query parameters
		if pathTenantID == "" {
			pathTenantID = r.URL.Query().Get("tenant_id")
		}

		// If no tenant ID found, use the one from claims
		if pathTenantID == "" {
			pathTenantID = claims.TenantID
		}

		// Ensure the user has access to this tenant
		if pathTenantID != claims.TenantID && claims.Role != tenant.RoleOwner {
			a.logger.Warn("Tenant access denied",
				zap.String("user", claims.UserID),
				zap.String("requested_tenant", pathTenantID),
				zap.String("user_tenant", claims.TenantID),
				zap.String("role", string(claims.Role)))
			http.Error(w, "You don't have access to this tenant", http.StatusForbidden)
			return
		}

		// Store tenant ID in context
		ctx := context.WithValue(r.Context(), "tenant_id", pathTenantID)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RoleMiddleware ensures that a user has the required role
func (a *Authenticator) RoleMiddleware(requiredRoles ...tenant.Role) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Get claims from context
			claims, ok := r.Context().Value("claims").(*Claims)
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check if the user's role is in the list of required roles
			hasRole := false
			for _, role := range requiredRoles {
				if claims.Role == role {
					hasRole = true
					break
				}
			}

			if !hasRole {
				a.logger.Warn("Role access denied",
					zap.String("user", claims.UserID),
					zap.String("role", string(claims.Role)),
					zap.Any("required_roles", requiredRoles))
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserFromContext extracts the user info from the context
func GetUserFromContext(ctx context.Context) (*tenant.UserInfo, error) {
	claims, ok := ctx.Value("claims").(*Claims)
	if !ok {
		return nil, errors.New("no claims in context")
	}

	return &tenant.UserInfo{
		UserID:    claims.UserID,
		Email:     claims.Email,
		TenantID:  claims.TenantID,
		Role:      claims.Role,
		FirstName: claims.FirstName,
		LastName:  claims.LastName,
	}, nil
}

// GetTenantIDFromContext extracts the tenant ID from the context
func GetTenantIDFromContext(ctx context.Context) (string, error) {
	tenantID, ok := ctx.Value("tenant_id").(string)
	if !ok || tenantID == "" {
		return "", errors.New("no tenant ID in context")
	}
	return tenantID, nil
}

// Manager handles authentication operations
type Manager struct {
	config     *Config
	logger     *zap.Logger
	tenantSvc  tenant.Service
	oidcClient *OIDCClient
}

// NewManager creates a new authentication manager
func NewManager(config *Config, logger *zap.Logger, tenantSvc tenant.Service) *Manager {
	if logger == nil {
		// Create a default logger if none provided
		logger, _ = zap.NewProduction()
	}

	manager := &Manager{
		config:    config,
		logger:    logger,
		tenantSvc: tenantSvc,
	}

	// Initialize OIDC if enabled
	if config.OIDCEnabled {
		oidcClient, err := NewOIDCClient(config.OIDCIssuerURL, config.OIDCClientID, config.OIDCRedirectURI)
		if err != nil {
			logger.Error("Failed to initialize OIDC client", zap.Error(err))
		} else {
			manager.oidcClient = oidcClient
		}
	}

	return manager
}

// OIDCClient handles OIDC authentication operations
type OIDCClient struct {
	issuerURL   string
	clientID    string
	redirectURI string
	// In a real implementation, this would include more fields like:
	// provider    *oidc.Provider
	// oauth2Config *oauth2.Config
}

// NewOIDCClient creates a new OIDC client
func NewOIDCClient(issuerURL, clientID, redirectURI string) (*OIDCClient, error) {
	if issuerURL == "" || clientID == "" || redirectURI == "" {
		return nil, errors.New("OIDC configuration incomplete: issuerURL, clientID, and redirectURI are required")
	}

	// In a real implementation, you would:
	// 1. Create an OIDC provider using the issuer URL
	// 2. Set up OAuth2 configuration
	// 3. Validate the OIDC provider's configuration

	return &OIDCClient{
		issuerURL:   issuerURL,
		clientID:    clientID,
		redirectURI: redirectURI,
	}, nil
}

// GetAuthURL returns the OIDC authentication URL
func (c *OIDCClient) GetAuthURL(state string) string {
	// In a real implementation, this would generate a proper OAuth2 auth URL
	return fmt.Sprintf("%s/auth?client_id=%s&redirect_uri=%s&state=%s",
		c.issuerURL, c.clientID, c.redirectURI, state)
}

// ExchangeCode exchanges an authorization code for tokens
func (c *OIDCClient) ExchangeCode(ctx context.Context, code string) (string, error) {
	// In a real implementation, this would:
	// 1. Exchange the code for tokens using OAuth2
	// 2. Verify the ID token
	// 3. Extract user information
	// For now, return a placeholder
	return "", errors.New("OIDC token exchange not implemented")
}
