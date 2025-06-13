package billing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"sort"
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/go-redis/redis/v8"
	"github.com/stripe/stripe-go/v72"
	"github.com/stripe/stripe-go/v72/checkout/session"
	"github.com/stripe/stripe-go/v72/customer"
	"github.com/stripe/stripe-go/v72/webhook"
	"go.uber.org/zap"
)

// BillingProvider represents the billing system type
type BillingProvider string

const (
	// StripeProvider is the Stripe payment provider
	StripeProvider BillingProvider = "stripe"
	// GerencianetProvider is the Gerencianet payment provider (Brazilian payment processor)
	GerencianetProvider BillingProvider = "gerencianet"
)

// BillingConfig holds the billing configuration
type BillingConfig struct {
	Provider            BillingProvider `yaml:"provider"`
	Enabled             bool            `yaml:"enabled"`
	StripeAPIKey        string          `yaml:"stripe_api_key"`
	StripeWebhookKey    string          `yaml:"stripe_webhook_key"`
	GerencianetClientID string          `yaml:"gerencianet_client_id"`
	GerencianetSecret   string          `yaml:"gerencianet_secret"`
	WebhookEndpoint     string          `yaml:"webhook_endpoint"`
	SuccessURL          string          `yaml:"success_url"`
	CancelURL           string          `yaml:"cancel_url"`
	PlanConfigs         []PlanConfig    `yaml:"plan_configs"`
}

// PlanConfig maps internal plans to external billing system IDs
type PlanConfig struct {
	PlanType          tenant.PlanType `yaml:"plan_type"`
	StripePriceID     string          `yaml:"stripe_price_id"`
	GerencianetPlanID string          `yaml:"gerencianet_plan_id"`
	DisplayName       string          `yaml:"display_name"`
	Description       string          `yaml:"description"`
	Features          []string        `yaml:"features"`
	PriceMonthly      int64           `yaml:"price_monthly"` // In cents
	PriceYearly       int64           `yaml:"price_yearly"`  // In cents
	TrialDays         int64           `yaml:"trial_days"`
}

// SubscriptionStatus represents the status of a subscription
type SubscriptionStatus string

const (
	// SubscriptionActive means the subscription is active and paid
	SubscriptionActive SubscriptionStatus = "active"
	// SubscriptionTrialing means the subscription is in trial period
	SubscriptionTrialing SubscriptionStatus = "trialing"
	// SubscriptionPastDue means payment has failed
	SubscriptionPastDue SubscriptionStatus = "past_due"
	// SubscriptionCanceled means the subscription is canceled
	SubscriptionCanceled SubscriptionStatus = "canceled"
	// SubscriptionIncomplete means the subscription is not fully set up
	SubscriptionIncomplete SubscriptionStatus = "incomplete"
)

// TenantBillingInfo stores billing information for a tenant
type TenantBillingInfo struct {
	TenantID           string             `json:"tenant_id"`
	CustomerID         string             `json:"customer_id"`     // External billing system customer ID
	SubscriptionID     string             `json:"subscription_id"` // External billing system subscription ID
	Plan               tenant.PlanType    `json:"plan"`
	Status             SubscriptionStatus `json:"status"`
	CurrentPeriodStart time.Time          `json:"current_period_start"`
	CurrentPeriodEnd   time.Time          `json:"current_period_end"`
	CancelAtPeriodEnd  bool               `json:"cancel_at_period_end"`
	TrialEnd           time.Time          `json:"trial_end,omitempty"`
	CreatedAt          time.Time          `json:"created_at"`
	UpdatedAt          time.Time          `json:"updated_at"`
}

// UsageRecord tracks the usage of a tenant's resources for metered billing
type UsageRecord struct {
	TenantID    string    `json:"tenant_id"`
	ResourceKey string    `json:"resource_key"` // e.g., "requests", "bandwidth"
	Quantity    int64     `json:"quantity"`
	Timestamp   time.Time `json:"timestamp"`
}

// BillingManager handles billing operations
type BillingManager struct {
	config            *BillingConfig
	client            *redis.Client
	logger            *zap.Logger
	tenantManager     *tenant.Manager
	gerencianetClient *GerencianetClient
	// Stripe client is not needed as a field since we use the global stripe.API
}

// NewBillingManager creates a new billing manager
func NewBillingManager(config *BillingConfig, redisClient *redis.Client, tenantManager *tenant.Manager, logger *zap.Logger) *BillingManager {
	// Initialize billing provider
	if config.Enabled {
		if config.Provider == StripeProvider && config.StripeAPIKey != "" {
			stripe.Key = config.StripeAPIKey
		}

		// Initialize Gerencianet client if credentials are provided
		var gerencianetClient *GerencianetClient
		if config.Provider == GerencianetProvider && config.GerencianetClientID != "" && config.GerencianetSecret != "" {
			gerencianetClient = NewGerencianetClient(config.GerencianetClientID, config.GerencianetSecret, true) // true for sandbox mode
		}

		return &BillingManager{
			config:            config,
			client:            redisClient,
			logger:            logger,
			tenantManager:     tenantManager,
			gerencianetClient: gerencianetClient,
		}
	}

	return &BillingManager{
		config:        config,
		client:        redisClient,
		logger:        logger,
		tenantManager: tenantManager,
	}
}

// GetBillingInfo retrieves billing information for a tenant
func (m *BillingManager) GetBillingInfo(ctx context.Context, tenantID string) (*TenantBillingInfo, error) {
	data, err := m.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:billing", tenantID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			return nil, fmt.Errorf("billing info not found for tenant: %s", tenantID)
		}
		return nil, err
	}

	var billingInfo TenantBillingInfo
	if err := json.Unmarshal(data, &billingInfo); err != nil {
		return nil, err
	}

	return &billingInfo, nil
}

// SaveBillingInfo saves billing information for a tenant
func (m *BillingManager) SaveBillingInfo(ctx context.Context, billingInfo *TenantBillingInfo) error {
	billingInfo.UpdatedAt = time.Now()
	data, err := json.Marshal(billingInfo)
	if err != nil {
		return err
	}

	return m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:billing", billingInfo.TenantID), data, 0).Err()
}

// CreateCheckoutSession creates a checkout session for a tenant in Stripe
func (m *BillingManager) CreateCheckoutSession(ctx context.Context, tenantID string, planType tenant.PlanType, isYearly bool) (string, error) {
	if !m.config.Enabled {
		return "", errors.New("billing is not enabled")
	}

	if m.config.Provider != StripeProvider {
		return "", errors.New("only Stripe is supported for checkout sessions")
	}

	// Get tenant
	tenant, err := m.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return "", err
	}

	// Find plan config
	var planConfig *PlanConfig
	for _, pc := range m.config.PlanConfigs {
		if pc.PlanType == planType {
			planConfig = &pc
			break
		}
	}
	if planConfig == nil {
		return "", fmt.Errorf("plan not found: %s", planType)
	}

	// Get or create customer
	billingInfo, err := m.GetBillingInfo(ctx, tenantID)
	var customerID string
	if err == nil && billingInfo.CustomerID != "" {
		customerID = billingInfo.CustomerID
	} else {
		// Create new customer
		customerParams := &stripe.CustomerParams{
			Name:  stripe.String(tenant.Name),
			Email: stripe.String(tenant.ContactEmail),
		}
		// Add metadata
		customerParams.AddMetadata("tenant_id", tenantID)
		c, err := customer.New(customerParams)
		if err != nil {
			return "", err
		}
		customerID = c.ID

		// Initialize billing info
		billingInfo = &TenantBillingInfo{
			TenantID:   tenantID,
			CustomerID: customerID,
			Plan:       planType,
			Status:     SubscriptionIncomplete,
			CreatedAt:  time.Now(),
		}

		// Save billing info
		if err := m.SaveBillingInfo(ctx, billingInfo); err != nil {
			m.logger.Error("Failed to save billing info", zap.Error(err))
		}
	}

	// Determine which price to use
	priceID := planConfig.StripePriceID
	if priceID == "" {
		return "", errors.New("no price ID configured for plan")
	}

	// Create checkout session
	params := &stripe.CheckoutSessionParams{
		SuccessURL: stripe.String(m.config.SuccessURL),
		CancelURL:  stripe.String(m.config.CancelURL),
		Mode:       stripe.String(string(stripe.CheckoutSessionModeSubscription)),
		LineItems: []*stripe.CheckoutSessionLineItemParams{
			{
				Price:    stripe.String(priceID),
				Quantity: stripe.Int64(1),
			},
		},
		Customer: stripe.String(customerID),
		SubscriptionData: &stripe.CheckoutSessionSubscriptionDataParams{
			TrialPeriodDays: stripe.Int64(planConfig.TrialDays),
			Params: stripe.Params{
				Metadata: map[string]string{
					"tenant_id": tenantID,
					"plan":      string(planType),
				},
			},
		},
		Params: stripe.Params{
			Metadata: map[string]string{
				"tenant_id": tenantID,
				"plan":      string(planType),
			},
		},
	}

	s, err := session.New(params)
	if err != nil {
		return "", err
	}

	return s.URL, nil
}

// GetPlansWithPricing returns all available plans with pricing information
func (m *BillingManager) GetPlansWithPricing(ctx context.Context) ([]PlanConfig, error) {
	return m.config.PlanConfigs, nil
}

// HandleWebhook processes webhooks from payment providers
func (m *BillingManager) HandleWebhook(ctx context.Context, payload []byte, signature string) error {
	if !m.config.Enabled {
		return errors.New("billing is not enabled")
	}

	if m.config.Provider == StripeProvider {
		event, err := webhook.ConstructEvent(payload, signature, m.config.StripeWebhookKey)
		if err != nil {
			return err
		}

		switch event.Type {
		case "customer.subscription.created", "customer.subscription.updated":
			var sub stripe.Subscription
			err = json.Unmarshal(event.Data.Raw, &sub)
			if err != nil {
				return err
			}

			tenantID := sub.Metadata["tenant_id"]
			if tenantID == "" {
				return errors.New("tenant_id not found in subscription metadata")
			}

			// Update tenant billing information
			billingInfo, err := m.GetBillingInfo(ctx, tenantID)
			if err != nil {
				// Create new billing info if it doesn't exist
				billingInfo = &TenantBillingInfo{
					TenantID:       tenantID,
					CustomerID:     sub.Customer.ID,
					SubscriptionID: sub.ID,
					CreatedAt:      time.Now(),
				}
			}

			// Update subscription details
			billingInfo.SubscriptionID = sub.ID
			billingInfo.Status = SubscriptionStatus(sub.Status)
			billingInfo.CurrentPeriodStart = time.Unix(sub.CurrentPeriodStart, 0)
			billingInfo.CurrentPeriodEnd = time.Unix(sub.CurrentPeriodEnd, 0)
			billingInfo.CancelAtPeriodEnd = sub.CancelAtPeriodEnd
			if sub.TrialEnd > 0 {
				billingInfo.TrialEnd = time.Unix(sub.TrialEnd, 0)
			}

			// Update plan in billing info
			if sub.Metadata["plan"] != "" {
				billingInfo.Plan = tenant.PlanType(sub.Metadata["plan"])

				// Also update tenant plan
				t, err := m.tenantManager.GetTenant(ctx, tenantID)
				if err == nil {
					t.Plan = tenant.PlanType(sub.Metadata["plan"])
					if err := m.tenantManager.UpdateTenant(ctx, t); err != nil {
						m.logger.Error("Failed to update tenant plan", zap.Error(err))
					}
				}
			}

			// Save updated billing info
			if err := m.SaveBillingInfo(ctx, billingInfo); err != nil {
				m.logger.Error("Failed to save billing info", zap.Error(err))
				return err
			}

		case "customer.subscription.deleted":
			var sub stripe.Subscription
			err = json.Unmarshal(event.Data.Raw, &sub)
			if err != nil {
				return err
			}

			tenantID := sub.Metadata["tenant_id"]
			if tenantID == "" {
				return errors.New("tenant_id not found in subscription metadata")
			}

			// Update tenant billing information
			billingInfo, err := m.GetBillingInfo(ctx, tenantID)
			if err == nil {
				billingInfo.Status = SubscriptionCanceled
				billingInfo.CancelAtPeriodEnd = true

				// Save updated billing info
				if err := m.SaveBillingInfo(ctx, billingInfo); err != nil {
					m.logger.Error("Failed to save billing info", zap.Error(err))
					return err
				}

				// Downgrade tenant to free plan after subscription ends
				t, err := m.tenantManager.GetTenant(ctx, tenantID)
				if err == nil {
					t.Plan = tenant.PlanFree
					if err := m.tenantManager.UpdateTenant(ctx, t); err != nil {
						m.logger.Error("Failed to downgrade tenant plan", zap.Error(err))
					}
				}
			}
		}
	} else if m.config.Provider == GerencianetProvider {
		// TODO: Implement Gerencianet webhook handling
		return errors.New("Gerencianet webhook handling not implemented yet")
	}

	return nil
}

// RecordUsage records resource usage for a tenant
func (m *BillingManager) RecordUsage(ctx context.Context, tenantID string, resourceKey string, quantity int64) error {
	now := time.Now()

	// Store usage record
	record := UsageRecord{
		TenantID:    tenantID,
		ResourceKey: resourceKey,
		Quantity:    quantity,
		Timestamp:   now,
	}

	data, err := json.Marshal(record)
	if err != nil {
		return err
	}

	// Store in Redis with a key that includes the date for easier aggregation
	key := fmt.Sprintf("vf:tenant:%s:usage:%s:%s",
		tenantID,
		resourceKey,
		now.Format("2006-01-02"))

	// Append to a list for this resource on this day
	err = m.client.RPush(ctx, key, data).Err()
	if err != nil {
		return err
	}

	// Set expiration to keep data for 90 days
	err = m.client.Expire(ctx, key, 90*24*time.Hour).Err()
	if err != nil {
		m.logger.Warn("Failed to set expiration for usage record", zap.Error(err))
	}

	// Also increment today's counter
	counterKey := fmt.Sprintf("vf:tenant:%s:usage_total:%s:%s",
		tenantID,
		resourceKey,
		now.Format("2006-01-02"))

	err = m.client.IncrBy(ctx, counterKey, quantity).Err()
	if err != nil {
		m.logger.Warn("Failed to increment usage counter", zap.Error(err))
	}

	// Set expiration for counter
	err = m.client.Expire(ctx, counterKey, 90*24*time.Hour).Err()
	if err != nil {
		m.logger.Warn("Failed to set expiration for usage counter", zap.Error(err))
	}

	return nil
}

// GetUsageSummary retrieves usage summary for a tenant
func (m *BillingManager) GetUsageSummary(ctx context.Context, tenantID string, resourceKey string, startDate time.Time, endDate time.Time) (map[string]int64, error) {
	// Format dates for keys
	current := startDate
	result := make(map[string]int64)

	// Collect data for each day in the date range
	for current.Before(endDate) || current.Equal(endDate) {
		dateStr := current.Format("2006-01-02")
		counterKey := fmt.Sprintf("vf:tenant:%s:usage_total:%s:%s", tenantID, resourceKey, dateStr)

		val, err := m.client.Get(ctx, counterKey).Int64()
		if err != nil && err != redis.Nil {
			return nil, err
		}

		if err != redis.Nil {
			result[dateStr] = val
		} else {
			result[dateStr] = 0
		}

		current = current.AddDate(0, 0, 1)
	}

	return result, nil
}

// GetUsage retrieves usage records for a tenant within a time range
func (m *BillingManager) GetUsage(ctx context.Context, tenantID string, startDate, endDate time.Time) ([]UsageRecord, error) {
	// Validate time range
	if endDate.Before(startDate) {
		return nil, fmt.Errorf("end date must be after start date")
	}

	// Build Redis key pattern for usage records
	pattern := fmt.Sprintf("vf:usage:%s:*", tenantID)

	// Get all keys matching the pattern
	keys, err := m.client.Keys(ctx, pattern).Result()
	if err != nil {
		return nil, fmt.Errorf("failed to query usage records: %w", err)
	}

	var records []UsageRecord

	// Process each usage record
	for _, key := range keys {
		data, err := m.client.Get(ctx, key).Result()
		if err != nil {
			m.logger.Warn("Error retrieving usage record", zap.String("key", key), zap.Error(err))
			continue
		}

		var record UsageRecord
		if err := json.Unmarshal([]byte(data), &record); err != nil {
			m.logger.Warn("Error unmarshaling usage record", zap.String("key", key), zap.Error(err))
			continue
		}

		// Filter by date range
		if (record.Timestamp.Equal(startDate) || record.Timestamp.After(startDate)) &&
			(record.Timestamp.Equal(endDate) || record.Timestamp.Before(endDate)) {
			records = append(records, record)
		}
	}

	// Sort records by timestamp
	sort.Slice(records, func(i, j int) bool {
		return records[i].Timestamp.Before(records[j].Timestamp)
	})

	return records, nil
}

/*
// ExportBillingData exports billing data for external billing systems - Legacy version
// This method is now implemented in export.go with an improved signature
func (m *BillingManager) ExportBillingData(ctx context.Context, tenantID string, month time.Time) (map[string]interface{}, error) {
	// Get tenant
	tenant, err := m.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return nil, err
	}

	// Get billing info
	billingInfo, err := m.GetBillingInfo(ctx, tenantID)
	if err != nil {
		// Default to empty billing info if not found
		billingInfo = &TenantBillingInfo{
			TenantID:  tenantID,
			Plan:      tenant.Plan,
			Status:    SubscriptionActive,
			CreatedAt: tenant.CreatedAt,
		}
	}

	startOfMonth := time.Date(month.Year(), month.Month(), 1, 0, 0, 0, 0, time.UTC)
	endOfMonth := startOfMonth.AddDate(0, 1, -1)

	// Get usage data for common resources
	requestsUsage, err := m.GetUsageSummary(ctx, tenantID, "requests", startOfMonth, endOfMonth)
	if err != nil {
		m.logger.Error("Failed to get requests usage", zap.Error(err))
		requestsUsage = make(map[string]int64)
	}

	bandwidthUsage, err := m.GetUsageSummary(ctx, tenantID, "bandwidth", startOfMonth, endOfMonth)
	if err != nil {
		m.logger.Error("Failed to get bandwidth usage", zap.Error(err))
		bandwidthUsage = make(map[string]int64)
	}

	// Calculate totals
	var totalRequests int64
	var totalBandwidth int64

	for _, v := range requestsUsage {
		totalRequests += v
	}

	for _, v := range bandwidthUsage {
		totalBandwidth += v
	}

	// Construct export data
	result := map[string]interface{}{
		"tenant_id":     tenantID,
		"tenant_name":   tenant.Name,
		"plan":          tenant.Plan,
		"contact_email": tenant.ContactEmail,
		"billing_period": map[string]string{
			"start": startOfMonth.Format("2006-01-02"),
			"end":   endOfMonth.Format("2006-01-02"),
		},
		"subscription_status": billingInfo.Status,
		"customer_id":         billingInfo.CustomerID,
		"subscription_id":     billingInfo.SubscriptionID,
		"usage": map[string]interface{}{
			"requests": map[string]interface{}{
				"total":    totalRequests,
				"daily":    requestsUsage,
				"included": getLimitForPlan(tenant.Plan, "requests"),
				"overage":  getOverage(tenant.Plan, "requests", totalRequests),
			},
			"bandwidth": map[string]interface{}{
				"total":    totalBandwidth,
				"daily":    bandwidthUsage,
				"included": getLimitForPlan(tenant.Plan, "bandwidth"),
				"overage":  getOverage(tenant.Plan, "bandwidth", totalBandwidth),
			},
		},
	}

	return result, nil
}
*/

// Helper functions for billing calculations

// getLimitForPlan returns the included resource limit for a plan
func getLimitForPlan(plan tenant.PlanType, resource string) int64 {
	switch plan {
	case tenant.PlanFree:
		if resource == "requests" {
			return 100000 // 100k requests
		} else if resource == "bandwidth" {
			return 10 * 1024 // 10 GB
		}
	case tenant.PlanBasic:
		if resource == "requests" {
			return 1000000 // 1M requests
		} else if resource == "bandwidth" {
			return 100 * 1024 // 100 GB
		}
	case tenant.PlanPro:
		if resource == "requests" {
			return 10000000 // 10M requests
		} else if resource == "bandwidth" {
			return 1000 * 1024 // 1 TB
		}
	case tenant.PlanBusiness:
		if resource == "requests" {
			return 100000000 // 100M requests
		} else if resource == "bandwidth" {
			return 10000 * 1024 // 10 TB
		}
	}
	return 0
}

// getOverage calculates resource usage overage
func getOverage(plan tenant.PlanType, resource string, usage int64) int64 {
	limit := getLimitForPlan(plan, resource)
	if usage <= limit {
		return 0
	}
	return usage - limit
}
