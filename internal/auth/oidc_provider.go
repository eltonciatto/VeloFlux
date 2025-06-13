package auth

import (
	"context"
	"fmt"
	"strings"

	"github.com/coreos/go-oidc/v3/oidc"
	"golang.org/x/oauth2"
)

// newOIDCProvider creates a new generic OIDC provider
func newOIDCProvider(ctx context.Context, oidcConfig *OIDCConfig) (*OIDCProvider, error) {
	provider, err := oidc.NewProvider(ctx, oidcConfig.ProviderURL)
	if err != nil {
		return nil, fmt.Errorf("failed to initialize OIDC provider: %w", err)
	}

	// Configure OAuth2
	scopes := []string{"openid", "email", "profile"}
	if oidcConfig.Scopes != "" {
		// Add custom scopes
		customScopes := strings.Split(oidcConfig.Scopes, " ")
		for _, scope := range customScopes {
			if scope != "" && !containsString(scopes, scope) {
				scopes = append(scopes, scope)
			}
		}
	}

	// Create OAuth2 config
	oauth2Config := oauth2.Config{
		ClientID:     oidcConfig.ClientID,
		ClientSecret: oidcConfig.ClientSecret,
		RedirectURL:  oidcConfig.RedirectURI,
		Endpoint:     provider.Endpoint(),
		Scopes:       scopes,
	}

	// Create verifier
	idTokenVerifier := provider.Verifier(&oidc.Config{
		ClientID: oidcConfig.ClientID,
	})

	return &OIDCProvider{
		Provider:     provider,
		OAuth2Config: oauth2Config,
		Verifier:     idTokenVerifier,
	}, nil
}

// containsString checks if a string slice contains a string
func containsString(slice []string, s string) bool {
	for _, item := range slice {
		if item == s {
			return true
		}
	}
	return false
}
