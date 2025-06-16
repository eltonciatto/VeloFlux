package auth

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestJWTTokenGeneration(t *testing.T) {
	config := &Config{
		JWTSecret: "test-secret-key-for-testing",
	}

	manager := NewManager(config, nil, nil)
	claims := &Claims{
		UserID:   "user123",
		TenantID: "tenant456",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		}}

	token, err := manager.GenerateToken(claims)
	require.NoError(t, err)
	assert.NotEmpty(t, token)

	// Verify token can be parsed
	parsedClaims, err := manager.ValidateToken(token)
	require.NoError(t, err)
	assert.Equal(t, claims.UserID, parsedClaims.UserID)
	assert.Equal(t, claims.TenantID, parsedClaims.TenantID)
	assert.Equal(t, claims.Role, parsedClaims.Role)
}

func TestTokenExpiration(t *testing.T) {
	config := &Config{
		JWTSecret: "test-secret-key-for-testing",
	}

	manager := NewManager(config, nil, nil)

	// Create expired token
	claims := &Claims{
		UserID:   "user123",
		TenantID: "tenant456",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(-time.Hour)), // Expired
			IssuedAt:  jwt.NewNumericDate(time.Now().Add(-2 * time.Hour)),
		},
	}

	token, err := manager.GenerateToken(claims)
	require.NoError(t, err)

	// Validation should fail for expired token
	_, err = manager.ValidateToken(token)
	assert.Error(t, err)
	assert.Contains(t, err.Error(), "token is expired")
}

func TestInvalidToken(t *testing.T) {
	config := &Config{
		JWTSecret: "test-secret-key-for-testing",
	}

	manager := NewManager(config, nil, nil)

	// Test invalid token format
	_, err := manager.ValidateToken("invalid.token.format")
	assert.Error(t, err)

	// Test token with wrong secret
	otherManager := NewManager(&Config{JWTSecret: "different-secret"}, nil, nil)
	claims := &Claims{
		UserID:   "user123",
		TenantID: "tenant456",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
		},
	}

	token, err := otherManager.GenerateToken(claims)
	require.NoError(t, err)

	// Should fail validation with different secret
	_, err = manager.ValidateToken(token)
	assert.Error(t, err)
}

func TestPasswordHashing(t *testing.T) {
	password := "test-password-123"

	// Hash password
	hashedPassword, err := HashPassword(password)
	require.NoError(t, err)
	assert.NotEqual(t, password, hashedPassword)
	assert.NotEmpty(t, hashedPassword)

	// Verify correct password
	valid := CheckPasswordHash(password, hashedPassword)
	assert.True(t, valid)

	// Verify incorrect password
	invalid := CheckPasswordHash("wrong-password", hashedPassword)
	assert.False(t, invalid)
}

func TestRoleValidation(t *testing.T) {
	testCases := []struct {
		role  string
		valid bool
	}{
		{"owner", true},
		{"admin", true},
		{"member", true},
		{"viewer", true},
		{"invalid", false},
		{"", false},
	}

	for _, tc := range testCases {
		t.Run(tc.role, func(t *testing.T) {
			valid := IsValidRole(tc.role)
			assert.Equal(t, tc.valid, valid)
		})
	}
}

func TestLoginAttemptThrottling(t *testing.T) {
	config := &Config{
		JWTSecret:           "test-secret",
		MaxLoginAttempts:    3,
		LoginLockoutMinutes: 15,
	}

	manager := NewManager(config, nil, nil)
	userID := "test-user"

	// First few attempts should be allowed
	for i := 0; i < 3; i++ {
		allowed := manager.IsLoginAllowed(userID)
		assert.True(t, allowed)
		manager.RecordFailedLogin(userID)
	}

	// After max attempts, should be locked out
	allowed := manager.IsLoginAllowed(userID)
	assert.False(t, allowed)

	// Reset and should be allowed again
	manager.ResetLoginAttempts(userID)
	allowed = manager.IsLoginAllowed(userID)
	assert.True(t, allowed)
}

func TestTenantIsolation(t *testing.T) {
	config := &Config{
		JWTSecret: "test-secret-key-for-testing",
	}

	manager := NewManager(config, nil, nil)

	// Create tokens for different tenants
	claims1 := &Claims{
		UserID:   "user123",
		TenantID: "tenant-a",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}

	claims2 := &Claims{
		UserID:   "user456",
		TenantID: "tenant-b",
		Role:     "admin",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Hour)),
		},
	}

	token1, err := manager.GenerateToken(claims1)
	require.NoError(t, err)

	token2, err := manager.GenerateToken(claims2)
	require.NoError(t, err)

	// Validate both tokens
	parsed1, err := manager.ValidateToken(token1)
	require.NoError(t, err)
	assert.Equal(t, "tenant-a", parsed1.TenantID)

	parsed2, err := manager.ValidateToken(token2)
	require.NoError(t, err)
	assert.Equal(t, "tenant-b", parsed2.TenantID)

	// Ensure tenant isolation
	assert.NotEqual(t, parsed1.TenantID, parsed2.TenantID)
}
