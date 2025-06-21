package auth

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"strings"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/golang-jwt/jwt/v5"
	"go.uber.org/zap"
	"golang.org/x/crypto/bcrypt"
)

// Context key types to avoid collisions
type contextKey string

const (
	claimsContextKey   contextKey = "claims"
	tenantIDContextKey contextKey = "tenant_id"
)

// Config for authentication
type Config struct {
	JWTSecret           string        `yaml:"jwt_secret"`
	JWTIssuer           string        `yaml:"jwt_issuer"`
	JWTAudience         string        `yaml:"jwt_audience"`
	TokenValidity       time.Duration `yaml:"token_validity"`
	OIDCEnabled         bool          `yaml:"oidc_enabled"`
	OIDCIssuerURL       string        `yaml:"oidc_issuer_url"`
	OIDCClientID        string        `yaml:"oidc_client_id"`
	OIDCRedirectURI     string        `yaml:"oidc_redirect_uri"`
	MaxLoginAttempts    int           `yaml:"max_login_attempts"`
	LoginLockoutMinutes int           `yaml:"login_lockout_minutes"`
	// SMTP Email Provider Configuration
	SMTPEnabled bool           `yaml:"smtp_enabled"`
	SMTPConfig  AuthSMTPConfig `yaml:"smtp"`
}

// AuthSMTPConfig holds the configuration for the SMTP email provider
type AuthSMTPConfig struct {
	Host     string `yaml:"host"`
	Port     int    `yaml:"port"`
	User     string `yaml:"user"`
	Password string `yaml:"password"`
	Sender   string `yaml:"sender"`
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
	emailProvider *EmailProvider
}

// New creates a new authenticator
func New(config *Config, tenantManager *tenant.Manager, logger *zap.Logger) *Authenticator {
	// Set defaults
	if config.TokenValidity == 0 {
		config.TokenValidity = 24 * time.Hour
	}

	auth := &Authenticator{
		config:        config,
		logger:        logger,
		tenantManager: tenantManager,
	}

	// Initialize email provider if SMTP is enabled
	if config.SMTPEnabled {
		// Convert AuthSMTPConfig to SMTPConfig
		smtpConfig := authSMTPConfigToSMTPConfig(config.SMTPConfig)
		auth.emailProvider = NewEmailProvider(smtpConfig, logger)
	}

	return auth
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
		ctx := context.WithValue(r.Context(), claimsContextKey, claims)
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
		ctx := context.WithValue(r.Context(), tenantIDContextKey, pathTenantID)
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
	config        *Config
	logger        *zap.Logger
	tenantSvc     tenant.Service
	oidcClient    *OIDCClient
	loginAttempts map[string]*LoginAttempt
	attemptsMutex sync.RWMutex
}

// LoginAttempt tracks failed login attempts for throttling
type LoginAttempt struct {
	Count       int
	LastAttempt time.Time
	LockedUntil time.Time
}

// NewManager creates a new authentication manager
func NewManager(config *Config, logger *zap.Logger, tenantSvc tenant.Service) *Manager {
	if logger == nil {
		// Create a default logger if none provided
		logger, _ = zap.NewProduction()
	}

	// Set default values
	if config.TokenValidity == 0 {
		config.TokenValidity = 24 * time.Hour
	}
	if config.JWTIssuer == "" {
		config.JWTIssuer = "veloflux"
	}
	if config.JWTAudience == "" {
		config.JWTAudience = "veloflux-api"
	}
	if config.MaxLoginAttempts == 0 {
		config.MaxLoginAttempts = 5
	}
	if config.LoginLockoutMinutes == 0 {
		config.LoginLockoutMinutes = 15
	}

	manager := &Manager{
		config:        config,
		logger:        logger,
		tenantSvc:     tenantSvc,
		loginAttempts: make(map[string]*LoginAttempt),
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

// GenerateToken generates a JWT token from claims
func (m *Manager) GenerateToken(claims *Claims) (string, error) {
	if claims.RegisteredClaims.ExpiresAt == nil {
		claims.RegisteredClaims.ExpiresAt = jwt.NewNumericDate(time.Now().Add(m.config.TokenValidity))
	}
	if claims.RegisteredClaims.IssuedAt == nil {
		claims.RegisteredClaims.IssuedAt = jwt.NewNumericDate(time.Now())
	}
	if claims.RegisteredClaims.NotBefore == nil {
		claims.RegisteredClaims.NotBefore = jwt.NewNumericDate(time.Now())
	}
	if claims.RegisteredClaims.Issuer == "" {
		claims.RegisteredClaims.Issuer = m.config.JWTIssuer
	}
	if len(claims.RegisteredClaims.Audience) == 0 {
		claims.RegisteredClaims.Audience = []string{m.config.JWTAudience}
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(m.config.JWTSecret))

	return tokenString, err
}

// GenerateTokenForUser generates a JWT token for a user
func (m *Manager) GenerateTokenForUser(user *tenant.UserInfo) (string, error) {
	expirationTime := time.Now().Add(m.config.TokenValidity)

	claims := &Claims{
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    m.config.JWTIssuer,
			Subject:   user.UserID,
			Audience:  []string{m.config.JWTAudience},
		},
		UserID:    user.UserID,
		Email:     user.Email,
		TenantID:  user.TenantID,
		Role:      user.Role,
		FirstName: user.FirstName,
		LastName:  user.LastName,
	}

	return m.GenerateToken(claims)
}

// ValidateToken validates a JWT token and returns the claims
func (m *Manager) ValidateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(
		tokenString,
		claims,
		func(token *jwt.Token) (interface{}, error) {
			// Validate the signing method
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return []byte(m.config.JWTSecret), nil
		},
		jwt.WithAudience(m.config.JWTAudience),
		jwt.WithIssuer(m.config.JWTIssuer),
	)

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}

// IsLoginAllowed checks if a user is allowed to attempt login (not throttled)
func (m *Manager) IsLoginAllowed(userID string) bool {
	m.attemptsMutex.RLock()
	attempt, exists := m.loginAttempts[userID]
	m.attemptsMutex.RUnlock()

	if !exists {
		return true
	}

	// Check if user is currently locked out
	if attempt.Count >= m.config.MaxLoginAttempts {
		// Check if the lockout period has expired (only if LockedUntil is set)
		if !attempt.LockedUntil.IsZero() && time.Now().After(attempt.LockedUntil) {
			// Reset attempts if lockout has expired
			m.ResetLoginAttempts(userID)
			return true
		}
		return false
	}

	return true
}

// RecordFailedLogin records a failed login attempt and applies throttling if necessary
func (m *Manager) RecordFailedLogin(userID string) {
	m.attemptsMutex.Lock()
	defer m.attemptsMutex.Unlock()

	now := time.Now()
	attempt, exists := m.loginAttempts[userID]

	if !exists {
		attempt = &LoginAttempt{
			Count:       0,
			LastAttempt: now,
		}
		m.loginAttempts[userID] = attempt
	}

	attempt.Count++
	attempt.LastAttempt = now

	// If max attempts reached, set lockout time
	if attempt.Count >= m.config.MaxLoginAttempts {
		lockoutDuration := time.Duration(m.config.LoginLockoutMinutes) * time.Minute
		attempt.LockedUntil = now.Add(lockoutDuration)

		m.logger.Warn("User locked out due to failed login attempts",
			zap.String("user_id", userID),
			zap.Int("attempts", attempt.Count),
			zap.Time("locked_until", attempt.LockedUntil))
	}
}

// ResetLoginAttempts resets the failed login attempt counter for a user
func (m *Manager) ResetLoginAttempts(userID string) {
	m.attemptsMutex.Lock()
	defer m.attemptsMutex.Unlock()

	delete(m.loginAttempts, userID)
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

// HashPassword creates a bcrypt hash of the password
func HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	return string(bytes), err
}

// CheckPasswordHash compares a password with its hash
func CheckPasswordHash(password, hash string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hash), []byte(password))
	return err == nil
}

// IsValidRole checks if a role is valid
func IsValidRole(role string) bool {
	switch tenant.Role(role) {
	case tenant.RoleOwner, tenant.RoleAdmin, tenant.RoleMember, tenant.RoleViewer:
		return true
	default:
		return false
	}
}

// SendPasswordResetEmail sends a password reset email
func (a *Authenticator) SendPasswordResetEmail(ctx context.Context, email string) error {
	// Check if SMTP is enabled
	if !a.config.SMTPEnabled || a.emailProvider == nil {
		return fmt.Errorf("email provider is not configured")
	}

	// Find the user by email
	user, err := a.tenantManager.GetUserByEmail(ctx, email)
	if err != nil {
		// Don't expose whether the email exists or not for security reasons
		a.logger.Info("Password reset requested for non-existent email", zap.String("email", email))
		return nil
	}

	// Generate a reset token (this could be a JWT or a random string)
	// Here we'll use a JWT with a short expiration
	token, err := a.generateResetToken(user)
	if err != nil {
		return err
	}

	// Store the token in Redis with expiration
	// This would typically be done by the tenant manager
	// For now we'll just send the email

	// Calculate token expiration time (e.g., 1 hour from now)
	expiresAt := time.Now().Add(1 * time.Hour)

	// Send the email
	return a.emailProvider.SendPasswordReset(email, token, expiresAt)
}

// SendVerificationEmail sends an email verification link to a new user
func (a *Authenticator) SendVerificationEmail(ctx context.Context, userID string) error {
	// Check if SMTP is enabled
	if !a.config.SMTPEnabled || a.emailProvider == nil {
		return fmt.Errorf("email provider is not configured")
	}

	// Get the user info
	user, err := a.tenantManager.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	// Generate a verification token
	token, err := a.generateVerificationToken(user)
	if err != nil {
		return err
	}

	// Send the verification email
	return a.emailProvider.SendVerificationEmail(user.Email, token)
}

// SendWelcomeEmail sends a welcome email to a new user
func (a *Authenticator) SendWelcomeEmail(ctx context.Context, userID, tenantID string) error {
	// Check if SMTP is enabled
	if !a.config.SMTPEnabled || a.emailProvider == nil {
		return fmt.Errorf("email provider is not configured")
	}

	// Get the user info
	user, err := a.tenantManager.GetUserByID(ctx, userID)
	if err != nil {
		return err
	}

	// Get the tenant info
	tenant, err := a.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return err
	}

	// Send the welcome email
	return a.emailProvider.SendWelcomeEmail(user.Email, user.FirstName, tenant.Name)
}

// generateResetToken creates a JWT token for password reset
func (a *Authenticator) generateResetToken(user *tenant.UserInfo) (string, error) {
	expirationTime := time.Now().Add(1 * time.Hour)

	// Create claims for the reset token
	claims := &jwt.RegisteredClaims{
		Subject:   user.UserID,
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    a.config.JWTIssuer,
		ID:        fmt.Sprintf("reset-%s", user.UserID),
	}

	// Create a new token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token
	tokenString, err := token.SignedString([]byte(a.config.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// generateVerificationToken creates a JWT token for email verification
func (a *Authenticator) generateVerificationToken(user *tenant.UserInfo) (string, error) {
	expirationTime := time.Now().Add(48 * time.Hour)

	// Create claims for the verification token
	claims := &jwt.RegisteredClaims{
		Subject:   user.UserID,
		ExpiresAt: jwt.NewNumericDate(expirationTime),
		IssuedAt:  jwt.NewNumericDate(time.Now()),
		NotBefore: jwt.NewNumericDate(time.Now()),
		Issuer:    a.config.JWTIssuer,
		ID:        fmt.Sprintf("verify-%s", user.UserID),
	}

	// Create a new token
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)

	// Sign the token
	tokenString, err := token.SignedString([]byte(a.config.JWTSecret))
	if err != nil {
		return "", err
	}

	return tokenString, nil
}

// UpdateEmailProvider updates the email provider at runtime
func (a *Authenticator) UpdateEmailProvider(provider *EmailProvider) {
	a.emailProvider = provider
}

// GetClaimsFromRequest extracts JWT claims from HTTP request
func (a *Authenticator) GetClaimsFromRequest(r *http.Request) (*Claims, error) {
	// Get the Authorization header
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("authorization header missing")
	}

	// Check if it's a Bearer token
	if !strings.HasPrefix(authHeader, "Bearer ") {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	tokenString := strings.TrimPrefix(authHeader, "Bearer ")
	return a.VerifyToken(tokenString)
}

// GetJWTSecret returns the JWT secret for token validation
func (a *Authenticator) GetJWTSecret() string {
	return a.config.JWTSecret
}

// authSMTPConfigToSMTPConfig converts AuthSMTPConfig to SMTPConfig
func authSMTPConfigToSMTPConfig(config AuthSMTPConfig) SMTPConfig {
	return SMTPConfig{
		Host:         config.Host,
		Port:         config.Port,
		Username:     config.User,
		Password:     config.Password,
		FromEmail:    config.Sender,
		FromName:     "VeloFlux",
		UseTLS:       true,
		AppDomain:    "veloflux.io",
		TemplatesDir: "",
	}
}
