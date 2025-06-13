package auth

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// KeycloakOIDCProvider is a specialized OIDC provider for Keycloak
type KeycloakOIDCProvider struct {
	baseProvider *OIDCProvider
	realm        string
}

// NewKeycloakProvider creates a new Keycloak OIDC provider
func NewKeycloakProvider(ctx context.Context, oidcConfig *OIDCConfig, logger *zap.Logger) (*KeycloakOIDCProvider, error) {
	// Extract realm from provider URL if not specified
	realm := "master" // Default realm
	
	// Create base provider
	baseProvider, err := newOIDCProvider(ctx, oidcConfig)
	if err != nil {
		return nil, err
	}
	
	return &KeycloakOIDCProvider{
		baseProvider: baseProvider,
		realm:        realm,
	}, nil
}

// ConfigureOAuthFlow configures the OAuth flow for Keycloak
func (p *KeycloakOIDCProvider) ConfigureOAuthFlow(oidcConfig *OIDCConfig, redirectURI string) {
	// Add Keycloak-specific scopes
	scopes := []string{"openid", "email", "profile"}
	
	// Add roles scope for access to user roles
	scopes = append(scopes, "roles")
	
	// Configure OAuth
	p.baseProvider.OAuth2Config = oauth2.Config{
		ClientID:     oidcConfig.ClientID,
		ClientSecret: oidcConfig.ClientSecret,
		RedirectURL:  redirectURI,
		Endpoint:     p.baseProvider.Provider.Endpoint(),
		Scopes:       scopes,
	}
}

// ExtractTenantInfo extracts tenant information from Keycloak token
func (p *KeycloakOIDCProvider) ExtractTenantInfo(ctx context.Context, token *oauth2.Token, tenantIDClaim string) (string, []string, error) {
	// Extract ID token
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return "", nil, fmt.Errorf("no id_token field in oauth2 token")
	}

	// Verify ID token
	idToken, err := p.baseProvider.Verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", nil, err
	}

	// Extract claims
	var claims struct {
		Email         string   `json:"email"`
		ResourceAccess map[string]struct {
			Roles []string `json:"roles"`
		} `json:"resource_access"`
		RealmAccess struct {
			Roles []string `json:"roles"`
		} `json:"realm_access"`
		TenantID string `json:"tenant_id"`
	}

	if err := idToken.Claims(&claims); err != nil {
		return "", nil, err
	}

	// Extract tenant ID from custom claim if specified
	tenantID := ""
	if tenantIDClaim != "" {
		var rawClaims map[string]interface{}
		if err := idToken.Claims(&rawClaims); err != nil {
			return "", nil, err
		}

		if val, ok := rawClaims[tenantIDClaim]; ok {
			if strVal, ok := val.(string); ok {
				tenantID = strVal
			}
		}
	}

	// Extract roles
	var roles []string
	
	// Add realm roles
	roles = append(roles, claims.RealmAccess.Roles...)
	
	// Add client roles for the current client
	if clientRoles, ok := claims.ResourceAccess[p.baseProvider.OAuth2Config.ClientID]; ok {
		roles = append(roles, clientRoles.Roles...)
	}

	return tenantID, roles, nil
}

// Auth0OIDCProvider is a specialized OIDC provider for Auth0
type Auth0OIDCProvider struct {
	baseProvider *OIDCProvider
	domain       string
}

// NewAuth0Provider creates a new Auth0 OIDC provider
func NewAuth0Provider(ctx context.Context, oidcConfig *OIDCConfig, logger *zap.Logger) (*Auth0OIDCProvider, error) {
	// Extract domain from provider URL
	domain := oidcConfig.ProviderURL
	
	// Create base provider
	baseProvider, err := newOIDCProvider(ctx, oidcConfig)
	if err != nil {
		return nil, err
	}
	
	return &Auth0OIDCProvider{
		baseProvider: baseProvider,
		domain:       domain,
	}, nil
}

// ConfigureOAuthFlow configures the OAuth flow for Auth0
func (p *Auth0OIDCProvider) ConfigureOAuthFlow(oidcConfig *OIDCConfig, redirectURI string) {
	// Add Auth0-specific scopes
	scopes := []string{"openid", "email", "profile"}
	
	// Configure OAuth
	p.baseProvider.OAuth2Config = oauth2.Config{
		ClientID:     oidcConfig.ClientID,
		ClientSecret: oidcConfig.ClientSecret,
		RedirectURL:  redirectURI,
		Endpoint:     p.baseProvider.Provider.Endpoint(),
		Scopes:       scopes,
	}
}

// ExtractTenantInfo extracts tenant information from Auth0 token
func (p *Auth0OIDCProvider) ExtractTenantInfo(ctx context.Context, token *oauth2.Token, tenantIDClaim string) (string, []string, error) {
	// Extract ID token
	rawIDToken, ok := token.Extra("id_token").(string)
	if !ok {
		return "", nil, fmt.Errorf("no id_token field in oauth2 token")
	}

	// Verify ID token
	idToken, err := p.baseProvider.Verifier.Verify(ctx, rawIDToken)
	if err != nil {
		return "", nil, err
	}

	// Extract claims
	var claims struct {
		Email    string   `json:"email"`
		Roles    []string `json:"roles"`
		Groups   []string `json:"groups"`
		TenantID string   `json:"tenant_id"`
		// Auth0-specific claims
		Permissions []string `json:"permissions"`
	}

	if err := idToken.Claims(&claims); err != nil {
		return "", nil, err
	}

	// Extract tenant ID from custom claim if specified
	tenantID := claims.TenantID
	if tenantID == "" && tenantIDClaim != "" {
		var rawClaims map[string]interface{}
		if err := idToken.Claims(&rawClaims); err != nil {
			return "", nil, err
		}

		if val, ok := rawClaims[tenantIDClaim]; ok {
			if strVal, ok := val.(string); ok {
				tenantID = strVal
			}
		}
	}

	// Combine roles, groups, and permissions
	var roles []string
	roles = append(roles, claims.Roles...)
	roles = append(roles, claims.Groups...)
	roles = append(roles, claims.Permissions...)

	// If we have access token, get additional info from userinfo endpoint
	if token.AccessToken != "" {
		userInfo, err := p.getUserInfo(ctx, token.AccessToken)
		if err == nil && userInfo != nil {
			if userInfo["roles"] != nil {
				if rolesList, ok := userInfo["roles"].([]interface{}); ok {
					for _, role := range rolesList {
						if roleStr, ok := role.(string); ok {
							roles = append(roles, roleStr)
						}
					}
				}
			}
		}
	}

	return tenantID, roles, nil
}

// getUserInfo retrieves user info from Auth0 userinfo endpoint
func (p *Auth0OIDCProvider) getUserInfo(ctx context.Context, accessToken string) (map[string]interface{}, error) {
	// Create request to userinfo endpoint
	req, err := http.NewRequest("GET", p.baseProvider.Provider.UserInfoEndpoint(), nil)
	if err != nil {
		return nil, err
	}

	// Add authorization header
	req.Header.Add("Authorization", "Bearer "+accessToken)

	// Make request
	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	// Parse response
	var userInfo map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return userInfo, nil
}

// createOIDCProviderByType creates an OIDC provider based on type
func (m *OIDCManager) createOIDCProviderByType(ctx context.Context, oidcConfig *OIDCConfig) (*OIDCProvider, error) {
	switch oidcConfig.ProviderName {
	case "keycloak":
		provider, err := NewKeycloakProvider(ctx, oidcConfig, m.logger)
		if err != nil {
			return nil, err
		}
		return provider.baseProvider, nil
	case "auth0":
		provider, err := NewAuth0Provider(ctx, oidcConfig, m.logger)
		if err != nil {
			return nil, err
		}
		return provider.baseProvider, nil
	default:
		// Generic OIDC provider
		return newOIDCProvider(ctx, oidcConfig)
	}
}
