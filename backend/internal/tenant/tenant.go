package tenant

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
)

// Role represents a user role within a tenant
type Role string

const (
	RoleOwner  Role = "owner"
	RoleAdmin  Role = "admin"
	RoleMember Role = "member"
	RoleViewer Role = "viewer"
)

// PlanType represents different subscription tiers
type PlanType string

const (
	PlanFree     PlanType = "free"
	PlanBasic    PlanType = "basic"
	PlanPro      PlanType = "pro"
	PlanBusiness PlanType = "business"
	PlanCustom   PlanType = "custom"
)

// LimitConfig defines rate limits and other quotas for a tenant
type LimitConfig struct {
	MaxRequestsPerSecond int    `json:"max_requests_per_second"`
	MaxBurstSize         int    `json:"max_burst_size"`
	MaxBandwidthMBPerDay int    `json:"max_bandwidth_mb_per_day"`
	MaxRoutes            int    `json:"max_routes"`
	MaxBackends          int    `json:"max_backends"`
	WAFLevel             string `json:"waf_level"` // "basic", "standard", "strict"
}

// Tenant represents a customer organization
type Tenant struct {
	ID           string      `json:"id"`
	Name         string      `json:"name"`
	Plan         PlanType    `json:"plan"`
	Active       bool        `json:"active"`
	CreatedAt    time.Time   `json:"created_at"`
	Limits       LimitConfig `json:"limits"`
	ContactEmail string      `json:"contact_email"`
	CustomDomain string      `json:"custom_domain,omitempty"`
	Document     string      `json:"document,omitempty"`     // For Brazilian CPF/CNPJ
	BirthDate    string      `json:"birth_date,omitempty"`   // Format: YYYY-MM-DD
	Email        string      `json:"email,omitempty"`        // Additional email for billing/notifications
	PhoneNumber  string      `json:"phone_number,omitempty"` // Customer phone number for billing
}

// UserInfo represents a user associated with a tenant
type UserInfo struct {
	UserID    string `json:"user_id"`
	Email     string `json:"email"`
	TenantID  string `json:"tenant_id"`
	Role      Role   `json:"role"`
	FirstName string `json:"first_name,omitempty"`
	LastName  string `json:"last_name,omitempty"`
}

// Manager handles tenant operations
type Manager struct {
	client     *redis.Client
	logger     *zap.Logger
	tenants    map[string]*Tenant
	tenantsMu  sync.RWMutex
	usersCache map[string]UserInfo
	usersMu    sync.RWMutex
}

// NewManager creates a new tenant manager
func NewManager(redisClient *redis.Client, logger *zap.Logger) *Manager {
	return &Manager{
		client:     redisClient,
		logger:     logger,
		tenants:    make(map[string]*Tenant),
		usersCache: make(map[string]UserInfo),
	}
}

// Service interface for tenant operations
type Service interface {
	GetTenant(ctx context.Context, id string) (*Tenant, error)
	ListTenants(ctx context.Context) ([]*Tenant, error)
	CreateTenant(ctx context.Context, tenant *Tenant) error
	UpdateTenant(ctx context.Context, tenant *Tenant) error
	DeleteTenant(ctx context.Context, id string) error
	GetUserByID(ctx context.Context, userID string) (*UserInfo, error)
	GetUserByEmail(ctx context.Context, email string) (*UserInfo, error)
	GetTenantUsers(ctx context.Context, tenantID string) ([]UserInfo, error)
	AddUser(ctx context.Context, user *UserInfo) error
	UpdateUser(ctx context.Context, user *UserInfo) error
	RemoveUser(ctx context.Context, userID, tenantID string) error
}

// Ensure Manager implements Service interface
var _ Service = (*Manager)(nil)

// GetTenant retrieves a tenant by ID
func (m *Manager) GetTenant(ctx context.Context, id string) (*Tenant, error) {
	// Check cache first
	m.tenantsMu.RLock()
	if tenant, found := m.tenants[id]; found {
		m.tenantsMu.RUnlock()
		return tenant, nil
	}
	m.tenantsMu.RUnlock()

	// Get from Redis
	data, err := m.client.Get(ctx, fmt.Sprintf("vf:tenant:%s", id)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("tenant not found: %s", id)
		}
		return nil, err
	}

	var tenant Tenant
	if err := json.Unmarshal(data, &tenant); err != nil {
		return nil, err
	}

	// Update cache
	m.tenantsMu.Lock()
	m.tenants[id] = &tenant
	m.tenantsMu.Unlock()

	return &tenant, nil
}

// ListTenants returns all active tenants
func (m *Manager) ListTenants(ctx context.Context) ([]*Tenant, error) {
	// Get tenant IDs from Redis
	keys, err := m.client.Keys(ctx, "vf:tenant:*").Result()
	if err != nil {
		return nil, err
	}

	var tenants []*Tenant

	// Get each tenant
	for _, key := range keys {
		id := key[len("vf:tenant:"):]
		tenant, err := m.GetTenant(ctx, id)
		if err != nil {
			m.logger.Error("Failed to get tenant", zap.String("id", id), zap.Error(err))
			continue
		}

		tenants = append(tenants, tenant)
	}

	return tenants, nil
}

// CreateTenant creates a new tenant
func (m *Manager) CreateTenant(ctx context.Context, tenant *Tenant) error {
	if tenant.ID == "" {
		return errors.New("tenant ID is required")
	}

	// Check if tenant ID already exists
	exists, err := m.client.Exists(ctx, fmt.Sprintf("vf:tenant:%s", tenant.ID)).Result()
	if err != nil {
		return err
	}
	if exists > 0 {
		return fmt.Errorf("tenant ID already exists: %s", tenant.ID)
	}

	// Set defaults
	if tenant.CreatedAt.IsZero() {
		tenant.CreatedAt = time.Now()
	}
	if tenant.Plan == "" {
		tenant.Plan = PlanFree
	}
	if tenant.Active == false {
		tenant.Active = true
	}

	// Default limits based on plan
	tenant.Limits = m.GetDefaultLimits(tenant.Plan)

	// Save to Redis
	data, err := json.Marshal(tenant)
	if err != nil {
		return err
	}

	if err := m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s", tenant.ID), data, 0).Err(); err != nil {
		return err
	}

	// Update cache
	m.tenantsMu.Lock()
	m.tenants[tenant.ID] = tenant
	m.tenantsMu.Unlock()

	return nil
}

// UpdateTenant updates an existing tenant
func (m *Manager) UpdateTenant(ctx context.Context, tenant *Tenant) error {
	// Check if tenant exists
	exists, err := m.client.Exists(ctx, fmt.Sprintf("vf:tenant:%s", tenant.ID)).Result()
	if err != nil {
		return err
	}
	if exists == 0 {
		return fmt.Errorf("tenant not found: %s", tenant.ID)
	}

	// Save to Redis
	data, err := json.Marshal(tenant)
	if err != nil {
		return err
	}

	if err := m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s", tenant.ID), data, 0).Err(); err != nil {
		return err
	}

	// Update cache
	m.tenantsMu.Lock()
	m.tenants[tenant.ID] = tenant
	m.tenantsMu.Unlock()

	return nil
}

// DeleteTenant deletes a tenant
func (m *Manager) DeleteTenant(ctx context.Context, id string) error {
	// Delete from Redis (we'll keep tenant data for a while, just mark as inactive)
	tenant, err := m.GetTenant(ctx, id)
	if err != nil {
		return err
	}

	tenant.Active = false
	return m.UpdateTenant(ctx, tenant)
}

// GetUserByID retrieves a user by ID
func (m *Manager) GetUserByID(ctx context.Context, userID string) (*UserInfo, error) {
	// Check cache first
	m.usersMu.RLock()
	if user, found := m.usersCache[userID]; found {
		m.usersMu.RUnlock()
		return &user, nil
	}
	m.usersMu.RUnlock()

	// Get from Redis
	data, err := m.client.Get(ctx, fmt.Sprintf("vf:user:%s", userID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("user not found: %s", userID)
		}
		return nil, err
	}

	var user UserInfo
	if err := json.Unmarshal(data, &user); err != nil {
		return nil, err
	}

	// Update cache
	m.usersMu.Lock()
	m.usersCache[userID] = user
	m.usersMu.Unlock()

	return &user, nil
}

// GetUserByEmail retrieves a user by email
func (m *Manager) GetUserByEmail(ctx context.Context, email string) (*UserInfo, error) {
	// Check the user cache first
	m.usersMu.RLock()
	for _, userInfo := range m.usersCache {
		if userInfo.Email == email {
			m.usersMu.RUnlock()
			return &userInfo, nil
		}
	}
	m.usersMu.RUnlock()

	// Not in cache, check Redis
	pattern := "vf:user:*"
	keys, err := m.client.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, err
	}

	for _, key := range keys {
		data, err := m.client.Get(ctx, key).Result()
		if err != nil {
			continue
		}

		var userInfo UserInfo
		if err := json.Unmarshal([]byte(data), &userInfo); err != nil {
			continue
		}

		if userInfo.Email == email {
			// Update cache
			m.usersMu.Lock()
			m.usersCache[userInfo.UserID] = userInfo
			m.usersMu.Unlock()
			return &userInfo, nil
		}
	}

	return nil, fmt.Errorf("user with email %s not found", email)
}

// GetTenantUsers retrieves all users for a tenant
func (m *Manager) GetTenantUsers(ctx context.Context, tenantID string) ([]UserInfo, error) {
	// Get user IDs from Redis
	userIDs, err := m.client.SMembers(ctx, fmt.Sprintf("vf:tenant:%s:users", tenantID)).Result()
	if err != nil {
		return nil, err
	}

	var users []UserInfo

	// Get each user
	for _, userID := range userIDs {
		user, err := m.GetUserByID(ctx, userID)
		if err != nil {
			m.logger.Error("Failed to get user", zap.String("id", userID), zap.Error(err))
			continue
		}

		users = append(users, *user)
	}

	return users, nil
}

// AddUser adds a user to a tenant
func (m *Manager) AddUser(ctx context.Context, user *UserInfo) error {
	if user.UserID == "" || user.TenantID == "" || user.Email == "" {
		return errors.New("user ID, tenant ID, and email are required")
	}

	// Check if tenant exists
	_, err := m.GetTenant(ctx, user.TenantID)
	if err != nil {
		return err
	}

	// Save user to Redis
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}

	if err := m.client.Set(ctx, fmt.Sprintf("vf:user:%s", user.UserID), data, 0).Err(); err != nil {
		return err
	}

	if err := m.client.SAdd(ctx, fmt.Sprintf("vf:tenant:%s:users", user.TenantID), user.UserID).Err(); err != nil {
		return err
	}

	// Update cache
	m.usersMu.Lock()
	m.usersCache[user.UserID] = *user
	m.usersMu.Unlock()

	return nil
}

// UpdateUser updates an existing user
func (m *Manager) UpdateUser(ctx context.Context, user *UserInfo) error {
	// Check if user exists
	exists, err := m.client.Exists(ctx, fmt.Sprintf("vf:user:%s", user.UserID)).Result()
	if err != nil {
		return err
	}
	if exists == 0 {
		return fmt.Errorf("user not found: %s", user.UserID)
	}

	// Save to Redis
	data, err := json.Marshal(user)
	if err != nil {
		return err
	}

	if err := m.client.Set(ctx, fmt.Sprintf("vf:user:%s", user.UserID), data, 0).Err(); err != nil {
		return err
	}

	// Update cache
	m.usersMu.Lock()
	m.usersCache[user.UserID] = *user
	m.usersMu.Unlock()

	return nil
}

// RemoveUser removes a user from a tenant
func (m *Manager) RemoveUser(ctx context.Context, userID, tenantID string) error {
	// Remove user from tenant's user set
	if err := m.client.SRem(ctx, fmt.Sprintf("vf:tenant:%s:users", tenantID), userID).Err(); err != nil {
		return err
	}

	// We'll keep the user data, just remove from tenant
	return nil
}

// GetConfigPrefix returns the Redis key prefix for tenant configuration
func (m *Manager) GetConfigPrefix(tenantID string) string {
	return fmt.Sprintf("vf:config:%s", tenantID)
}

// getDefaultLimits returns the default limits based on the plan
func (m *Manager) GetDefaultLimits(plan PlanType) LimitConfig {
	switch plan {
	case PlanFree:
		return LimitConfig{
			MaxRequestsPerSecond: 10,
			MaxBurstSize:         20,
			MaxBandwidthMBPerDay: 1000,
			MaxRoutes:            3,
			MaxBackends:          6,
			WAFLevel:             "basic",
		}
	case PlanBasic:
		return LimitConfig{
			MaxRequestsPerSecond: 100,
			MaxBurstSize:         200,
			MaxBandwidthMBPerDay: 10000,
			MaxRoutes:            10,
			MaxBackends:          30,
			WAFLevel:             "standard",
		}
	case PlanPro:
		return LimitConfig{
			MaxRequestsPerSecond: 1000,
			MaxBurstSize:         2000,
			MaxBandwidthMBPerDay: 100000,
			MaxRoutes:            50,
			MaxBackends:          200,
			WAFLevel:             "strict",
		}
	case PlanBusiness:
		return LimitConfig{
			MaxRequestsPerSecond: 5000,
			MaxBurstSize:         10000,
			MaxBandwidthMBPerDay: 500000,
			MaxRoutes:            250,
			MaxBackends:          1000,
			WAFLevel:             "strict",
		}
	default:
		return LimitConfig{
			MaxRequestsPerSecond: 100,
			MaxBurstSize:         200,
			MaxBandwidthMBPerDay: 10000,
			MaxRoutes:            10,
			MaxBackends:          30,
			WAFLevel:             "standard",
		}
	}
}

// ValidateUserPassword validates a user's password
func (m *Manager) ValidateUserPassword(ctx context.Context, userID, password string) (bool, error) {
	// Get stored password hash from Redis
	hashKey := fmt.Sprintf("vf:user:pwd:%s", userID)
	storedHash, err := m.client.Get(ctx, hashKey).Result()
	if err != nil {
		if err == redis.Nil {
			return false, fmt.Errorf("password not found for user: %s", userID)
		}
		return false, err
	}

	// Validate password using bcrypt (assuming passwords are hashed with bcrypt)
	// This is a simplified implementation - in production you'd import golang.org/x/crypto/bcrypt
	// For now, we'll do a simple comparison (NOT secure - only for demo)
	// TODO: Implement proper bcrypt password hashing
	return storedHash == password, nil
}

// CreateTenantWithOwnerRequest represents a request to create a tenant with an owner
type CreateTenantWithOwnerRequest struct {
	Name      string   `json:"name"`
	Plan      PlanType `json:"plan"`
	OwnerInfo UserInfo `json:"owner_info"`
	Password  string   `json:"password"`
}

// CreateTenantWithOwner creates a new tenant along with its owner user
func (m *Manager) CreateTenantWithOwner(ctx context.Context, req *CreateTenantWithOwnerRequest) (string, string, error) {
	// Generate unique IDs
	tenantID := fmt.Sprintf("tenant_%d", time.Now().UnixNano())
	userID := fmt.Sprintf("user_%d", time.Now().UnixNano())

	// Create tenant
	tenant := &Tenant{
		ID:        tenantID,
		Name:      req.Name,
		Plan:      req.Plan,
		Active:    true,
		CreatedAt: time.Now(),
	}

	err := m.CreateTenant(ctx, tenant)
	if err != nil {
		return "", "", fmt.Errorf("failed to create tenant: %v", err)
	}

	// Create owner user
	user := &UserInfo{
		UserID:    userID,
		Email:     req.OwnerInfo.Email,
		TenantID:  tenantID,
		Role:      RoleOwner,
		FirstName: req.OwnerInfo.FirstName,
		LastName:  req.OwnerInfo.LastName,
	}

	err = m.AddUser(ctx, user)
	if err != nil {
		// Rollback tenant creation
		m.DeleteTenant(ctx, tenantID)
		return "", "", fmt.Errorf("failed to create owner user: %v", err)
	}

	// Store password hash (simplified - should use bcrypt)
	// TODO: Implement proper password hashing
	passwordKey := fmt.Sprintf("vf:user:pwd:%s", userID)
	err = m.client.Set(ctx, passwordKey, req.Password, 0).Err()
	if err != nil {
		// Rollback
		m.RemoveUser(ctx, userID, tenantID)
		m.DeleteTenant(ctx, tenantID)
		return "", "", fmt.Errorf("failed to store password: %v", err)
	}

	// Add email to user mapping
	emailKey := fmt.Sprintf("vf:user:email:%s", req.OwnerInfo.Email)
	err = m.client.Set(ctx, emailKey, userID, 0).Err()
	if err != nil {
		m.logger.Warn("Failed to create email mapping", zap.Error(err))
	}

	m.logger.Info("Tenant and owner created successfully",
		zap.String("tenant_id", tenantID),
		zap.String("user_id", userID),
		zap.String("email", req.OwnerInfo.Email))

	return tenantID, userID, nil
}

// GetUserByEmailWithPasswordValidation gets user by email and validates password
func (m *Manager) GetUserByEmailWithPasswordValidation(ctx context.Context, email, password string) (*UserInfo, error) {
	user, err := m.GetUserByEmail(ctx, email)
	if err != nil {
		return nil, err
	}

	valid, err := m.ValidateUserPassword(ctx, user.UserID, password)
	if err != nil {
		return nil, err
	}

	if !valid {
		return nil, fmt.Errorf("invalid password")
	}

	return user, nil
}
