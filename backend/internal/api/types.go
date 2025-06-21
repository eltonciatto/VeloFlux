package api

import (
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
)

// Request/Response structures for API endpoints

// LoginRequest represents a tenant login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=6"`
	TenantID string `json:"tenant_id,omitempty"`
}

// LoginResponse represents a successful login response
type LoginResponse struct {
	Token     string           `json:"token"`
	User      *tenant.UserInfo `json:"user"`
	ExpiresAt time.Time        `json:"expires_at"`
}

// RegisterRequest represents a tenant registration request
type RegisterRequest struct {
	Email      string          `json:"email" validate:"required,email"`
	Password   string          `json:"password" validate:"required,min=6"`
	FirstName  string          `json:"first_name" validate:"required"`
	LastName   string          `json:"last_name" validate:"required"`
	TenantName string          `json:"tenant_name" validate:"required"`
	Plan       tenant.PlanType `json:"plan,omitempty"`
}

// CreateTenantRequest represents a request to create a new tenant
type CreateTenantRequest struct {
	Name       string          `json:"name" validate:"required"`
	Plan       tenant.PlanType `json:"plan" validate:"required"`
	OwnerEmail string          `json:"owner_email" validate:"required,email"`
	OwnerName  string          `json:"owner_name" validate:"required"`
}

// UpdateTenantRequest represents a request to update tenant information
type UpdateTenantRequest struct {
	Name    string          `json:"name,omitempty"`
	Plan    tenant.PlanType `json:"plan,omitempty"`
	Enabled *bool           `json:"enabled,omitempty"`
}

// SubscriptionRequest represents a request to create/update a subscription
type SubscriptionRequest struct {
	Plan         tenant.PlanType `json:"plan" validate:"required"`
	BillingCycle string          `json:"billing_cycle,omitempty"` // monthly, yearly
}

// ErrorResponse represents an API error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Message string `json:"message,omitempty"`
	Code    int    `json:"code"`
}

// SuccessResponse represents a generic success response
type SuccessResponse struct {
	Success bool        `json:"success"`
	Message string      `json:"message,omitempty"`
	Data    interface{} `json:"data,omitempty"`
}

// RefreshTokenRequest represents a token refresh request
type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// ListResponse represents a paginated list response
type ListResponse struct {
	Items      interface{} `json:"items"`
	TotalCount int         `json:"total_count"`
	Page       int         `json:"page"`
	PageSize   int         `json:"page_size"`
	HasMore    bool        `json:"has_more"`
}
