package tenant

import (
	"testing"
	"time"

	"github.com/go-redis/redis/v8"
	"github.com/stretchr/testify/assert"
	"go.uber.org/zap"
)

func TestNewManager(t *testing.T) {
	client := redis.NewClient(&redis.Options{
		Addr: "localhost:6379",
	})
	logger := zap.NewNop()

	manager := NewManager(client, logger)
	assert.NotNil(t, manager)
	assert.Equal(t, client, manager.client)
	assert.Equal(t, logger, manager.logger)
	assert.NotNil(t, manager.tenants)
	assert.NotNil(t, manager.usersCache)
}

func TestGetDefaultLimits(t *testing.T) {
	manager := NewManager(nil, zap.NewNop())

	tests := []struct {
		plan     PlanType
		expected LimitConfig
	}{
		{
			plan: PlanFree,
			expected: LimitConfig{
				MaxRequestsPerSecond: 10,
				MaxBurstSize:         20,
				MaxBandwidthMBPerDay: 1000,
				MaxRoutes:            3,
				MaxBackends:          6,
				WAFLevel:             "basic",
			},
		},
		{
			plan: PlanBasic,
			expected: LimitConfig{
				MaxRequestsPerSecond: 100,
				MaxBurstSize:         200,
				MaxBandwidthMBPerDay: 10000,
				MaxRoutes:            10,
				MaxBackends:          30,
				WAFLevel:             "standard",
			},
		},
		{
			plan: PlanPro,
			expected: LimitConfig{
				MaxRequestsPerSecond: 1000,
				MaxBurstSize:         2000,
				MaxBandwidthMBPerDay: 100000,
				MaxRoutes:            50,
				MaxBackends:          200,
				WAFLevel:             "strict",
			},
		},
		{
			plan: PlanBusiness,
			expected: LimitConfig{
				MaxRequestsPerSecond: 5000,
				MaxBurstSize:         10000,
				MaxBandwidthMBPerDay: 500000,
				MaxRoutes:            250,
				MaxBackends:          1000,
				WAFLevel:             "strict",
			},
		},
		{
			plan: PlanCustom,
			expected: LimitConfig{
				MaxRequestsPerSecond: 100,
				MaxBurstSize:         200,
				MaxBandwidthMBPerDay: 10000,
				MaxRoutes:            10,
				MaxBackends:          30,
				WAFLevel:             "standard",
			},
		},
	}

	for _, tt := range tests {
		t.Run(string(tt.plan), func(t *testing.T) {
			limits := manager.GetDefaultLimits(tt.plan)
			assert.Equal(t, tt.expected, limits)
		})
	}
}

func TestTenantRoles(t *testing.T) {
	tests := []struct {
		role  Role
		valid bool
	}{
		{RoleOwner, true},
		{RoleAdmin, true},
		{RoleMember, true},
		{RoleViewer, true},
		{Role("invalid"), false},
	}

	for _, tt := range tests {
		t.Run(string(tt.role), func(t *testing.T) {
			// Test role string values
			switch tt.role {
			case RoleOwner:
				assert.Equal(t, "owner", string(tt.role))
			case RoleAdmin:
				assert.Equal(t, "admin", string(tt.role))
			case RoleMember:
				assert.Equal(t, "member", string(tt.role))
			case RoleViewer:
				assert.Equal(t, "viewer", string(tt.role))
			}
		})
	}
}

func TestPlanTypes(t *testing.T) {
	plans := []PlanType{PlanFree, PlanBasic, PlanPro, PlanBusiness, PlanCustom}
	expectedStrings := []string{"free", "basic", "pro", "business", "custom"}

	for i, plan := range plans {
		assert.Equal(t, expectedStrings[i], string(plan))
	}
}

func TestGetConfigPrefix(t *testing.T) {
	manager := NewManager(nil, zap.NewNop())
	tenantID := "tenant-123"

	prefix := manager.GetConfigPrefix(tenantID)
	expected := "vf:config:tenant-123"
	assert.Equal(t, expected, prefix)
}

func TestTenantValidation(t *testing.T) {
	tenant := &Tenant{
		ID:           "test-tenant",
		Name:         "Test Tenant",
		Plan:         PlanBasic,
		Active:       true,
		CreatedAt:    time.Now(),
		ContactEmail: "test@example.com",
		Limits: LimitConfig{
			MaxRequestsPerSecond: 50,
			MaxBurstSize:         200,
			MaxBandwidthMBPerDay: 10000,
			MaxRoutes:            5,
			MaxBackends:          10,
			WAFLevel:             "standard",
		},
	}

	// Validate required fields
	assert.NotEmpty(t, tenant.ID)
	assert.NotEmpty(t, tenant.Name)
	assert.NotEmpty(t, tenant.ContactEmail)
	assert.True(t, tenant.Active)

	// Validate plan
	validPlans := []PlanType{PlanFree, PlanBasic, PlanPro, PlanBusiness, PlanCustom}
	assert.Contains(t, validPlans, tenant.Plan)

	// Validate limits are positive
	assert.Greater(t, tenant.Limits.MaxRequestsPerSecond, 0)
	assert.Greater(t, tenant.Limits.MaxBurstSize, 0)
	assert.Greater(t, tenant.Limits.MaxBandwidthMBPerDay, 0)
	assert.Greater(t, tenant.Limits.MaxRoutes, 0)
	assert.Greater(t, tenant.Limits.MaxBackends, 0)
	assert.NotEmpty(t, tenant.Limits.WAFLevel)
}

func TestUserInfoValidation(t *testing.T) {
	user := &UserInfo{
		UserID:    "user-123",
		Email:     "user@example.com",
		TenantID:  "tenant-123",
		Role:      RoleAdmin,
		FirstName: "John",
		LastName:  "Doe",
	}

	// Validate required fields
	assert.NotEmpty(t, user.UserID)
	assert.NotEmpty(t, user.Email)
	assert.NotEmpty(t, user.TenantID)

	// Validate role
	validRoles := []Role{RoleOwner, RoleAdmin, RoleMember, RoleViewer}
	assert.Contains(t, validRoles, user.Role)

	// Validate email format (basic check)
	assert.Contains(t, user.Email, "@")
}

func TestLimitConfigDefaults(t *testing.T) {
	manager := NewManager(nil, zap.NewNop())

	// Test each plan has sensible defaults
	for _, plan := range []PlanType{PlanFree, PlanBasic, PlanPro, PlanBusiness, PlanCustom} {
		limits := manager.GetDefaultLimits(plan)

		assert.Greater(t, limits.MaxRequestsPerSecond, 0, "Plan %s should have positive rate limit", plan)
		assert.Greater(t, limits.MaxBurstSize, 0, "Plan %s should have positive burst size", plan)
		assert.Greater(t, limits.MaxBandwidthMBPerDay, 0, "Plan %s should have positive bandwidth limit", plan)
		assert.Greater(t, limits.MaxRoutes, 0, "Plan %s should have positive route limit", plan)
		assert.Greater(t, limits.MaxBackends, 0, "Plan %s should have positive backend limit", plan)
		assert.NotEmpty(t, limits.WAFLevel, "Plan %s should have WAF level set", plan)

		// Verify WAF level is valid
		validWAFLevels := []string{"basic", "standard", "strict"}
		assert.Contains(t, validWAFLevels, limits.WAFLevel, "Plan %s should have valid WAF level", plan)
	}
}

func TestTenantCreationWithLimits(t *testing.T) {
	manager := NewManager(nil, zap.NewNop())

	tenant := &Tenant{
		ID:           "test-123",
		Name:         "Test Organization",
		Plan:         PlanPro,
		Active:       true,
		CreatedAt:    time.Now(),
		ContactEmail: "admin@test.com",
		Limits:       manager.GetDefaultLimits(PlanPro),
	}

	// Verify tenant has correct limits for Pro plan
	assert.Equal(t, 1000, tenant.Limits.MaxRequestsPerSecond)
	assert.Equal(t, 2000, tenant.Limits.MaxBurstSize)
	assert.Equal(t, 100000, tenant.Limits.MaxBandwidthMBPerDay)
	assert.Equal(t, 50, tenant.Limits.MaxRoutes)
	assert.Equal(t, 200, tenant.Limits.MaxBackends)
	assert.Equal(t, "strict", tenant.Limits.WAFLevel)
}
