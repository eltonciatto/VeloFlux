package billing

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
	"golang.org/x/oauth2/clientcredentials"
)

const (
	gerencianetSandboxURL = "https://sandbox.api.gerencianet.com.br/v1"
	gerencianetProdURL    = "https://api.gerencianet.com.br/v1"
)

// GerencianetClient is a client for the Gerencianet API
type GerencianetClient struct {
	clientID     string
	clientSecret string
	sandbox      bool
	httpClient   *http.Client
	accessToken  string
	tokenExpiry  time.Time
}

// GerencianetPlan represents a plan in the Gerencianet API
type GerencianetPlan struct {
	ID           int    `json:"plan_id"`
	Name         string `json:"name"`
	Interval     int    `json:"interval"`
	IntervalType string `json:"interval_type"` // days, weeks, months, years
	Amount       int    `json:"amount"`        // in cents
	Currency     string `json:"currency"`
	Description  string `json:"description"`
}

// GerencianetSubscription represents a subscription in the Gerencianet API
type GerencianetSubscription struct {
	ID             int       `json:"subscription_id"`
	Status         string    `json:"status"`
	PlanID         int       `json:"plan_id"`
	CustomerID     int       `json:"customer_id"`
	ChargeID       int       `json:"charge_id"`
	CreationDate   time.Time `json:"creation_date"`
	ExpirationDate time.Time `json:"expiration_date"`
}

// GerencianetCustomer represents a customer in the Gerencianet API
type GerencianetCustomer struct {
	ID        int    `json:"customer_id"`
	Name      string `json:"name"`
	Email     string `json:"email"`
	Document  string `json:"cpf"`
	BirthDate string `json:"birth"`
	Phone     string `json:"phone_number"`
}

// NewGerencianetClient creates a new Gerencianet client
func NewGerencianetClient(clientID string, clientSecret string, sandbox bool) *GerencianetClient {
	return &GerencianetClient{
		clientID:     clientID,
		clientSecret: clientSecret,
		sandbox:      sandbox,
		httpClient:   &http.Client{Timeout: 10 * time.Second},
	}
}

// getBaseURL returns the base URL for the Gerencianet API
func (c *GerencianetClient) getBaseURL() string {
	if c.sandbox {
		return gerencianetSandboxURL
	}
	return gerencianetProdURL
}

// authenticate authenticates with the Gerencianet API
func (c *GerencianetClient) authenticate() error {
	if c.accessToken != "" && time.Now().Before(c.tokenExpiry) {
		return nil // Token still valid
	}

	// OAuth2 configuration
	config := &clientcredentials.Config{
		ClientID:     c.clientID,
		ClientSecret: c.clientSecret,
		TokenURL:     fmt.Sprintf("%s/authorize", c.getBaseURL()),
	}

	// Get token
	token, err := config.Token(context.Background())
	if err != nil {
		return fmt.Errorf("failed to authenticate with Gerencianet: %w", err)
	}

	c.accessToken = token.AccessToken
	c.tokenExpiry = token.Expiry

	return nil
}

// makeRequest makes a request to the Gerencianet API
func (c *GerencianetClient) makeRequest(method, endpoint string, body interface{}) ([]byte, error) {
	// Authenticate
	if err := c.authenticate(); err != nil {
		return nil, err
	}

	// Convert body to JSON
	var bodyJSON []byte
	var err error
	if body != nil {
		bodyJSON, err = json.Marshal(body)
		if err != nil {
			return nil, fmt.Errorf("failed to marshal body: %w", err)
		}
	}

	// Create request
	req, err := http.NewRequest(method, fmt.Sprintf("%s/%s", c.getBaseURL(), endpoint), strings.NewReader(string(bodyJSON)))
	if err != nil {
		return nil, fmt.Errorf("failed to create request: %w", err)
	}

	// Set headers
	req.Header.Set("Authorization", fmt.Sprintf("Bearer %s", c.accessToken))
	req.Header.Set("Content-Type", "application/json")

	// Make request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("failed to make request: %w", err)
	}
	defer resp.Body.Close()

	// Read response
	responseBody := make([]byte, resp.ContentLength)
	_, err = resp.Body.Read(responseBody)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	// Check for error
	if resp.StatusCode >= 400 {
		var errorResponse map[string]interface{}
		if err := json.Unmarshal(responseBody, &errorResponse); err == nil {
			return nil, fmt.Errorf("Gerencianet API error (status %d): %v", resp.StatusCode, errorResponse)
		}
		return nil, fmt.Errorf("Gerencianet API error (status %d)", resp.StatusCode)
	}

	return responseBody, nil
}

// CreatePlan creates a plan in the Gerencianet API
func (c *GerencianetClient) CreatePlan(name, description string, amount int, intervalType string, interval int) (int, error) {
	// Validate interval type
	validIntervalTypes := map[string]bool{"days": true, "weeks": true, "months": true, "years": true}
	if !validIntervalTypes[intervalType] {
		return 0, fmt.Errorf("invalid interval type: %s", intervalType)
	}

	// Create plan
	requestBody := map[string]interface{}{
		"name":          name,
		"interval":      interval,
		"interval_type": intervalType,
		"amount":        amount,
		"currency":      "BRL", // Brazilian Real (default for Gerencianet)
		"description":   description,
	}

	response, err := c.makeRequest("POST", "plans", requestBody)
	if err != nil {
		return 0, err
	}

	// Parse response
	var result struct {
		PlanID int `json:"plan_id"`
	}
	if err := json.Unmarshal(response, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	return result.PlanID, nil
}

// CreateCustomer creates a customer in the Gerencianet API
func (c *GerencianetClient) CreateCustomer(name, email, document, birthDate, phoneNumber string) (int, error) {
	// Create customer
	requestBody := map[string]string{
		"name":         name,
		"email":        email,
		"cpf":          document,    // Brazilian CPF
		"birth":        birthDate,   // Format: YYYY-MM-DD
		"phone_number": phoneNumber, // Format: +5500000000000
	}

	response, err := c.makeRequest("POST", "customers", requestBody)
	if err != nil {
		return 0, err
	}

	// Parse response
	var result struct {
		CustomerID int `json:"customer_id"`
	}
	if err := json.Unmarshal(response, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	return result.CustomerID, nil
}

// CreateSubscription creates a subscription in the Gerencianet API
func (c *GerencianetClient) CreateSubscription(planID, customerID int, paymentMethod string) (int, error) {
	// Create subscription
	requestBody := map[string]interface{}{
		"plan_id":     planID,
		"customer_id": customerID,
		"payment": map[string]string{
			"method": paymentMethod, // "credit_card", "billet", "pix"
		},
	}

	response, err := c.makeRequest("POST", "subscriptions", requestBody)
	if err != nil {
		return 0, err
	}

	// Parse response
	var result struct {
		SubscriptionID int `json:"subscription_id"`
	}
	if err := json.Unmarshal(response, &result); err != nil {
		return 0, fmt.Errorf("failed to parse response: %w", err)
	}

	return result.SubscriptionID, nil
}

// CancelSubscription cancels a subscription in the Gerencianet API
func (c *GerencianetClient) CancelSubscription(subscriptionID int) error {
	_, err := c.makeRequest("PUT", fmt.Sprintf("subscriptions/%d/cancel", subscriptionID), nil)
	return err
}

// GetSubscription gets a subscription from the Gerencianet API
func (c *GerencianetClient) GetSubscription(subscriptionID int) (*GerencianetSubscription, error) {
	response, err := c.makeRequest("GET", fmt.Sprintf("subscriptions/%d", subscriptionID), nil)
	if err != nil {
		return nil, err
	}

	// Parse response
	var subscription GerencianetSubscription
	if err := json.Unmarshal(response, &subscription); err != nil {
		return nil, fmt.Errorf("failed to parse response: %w", err)
	}

	return &subscription, nil
}

// createGerencianetCheckout creates a checkout URL for Gerencianet
func (m *BillingManager) createGerencianetCheckout(ctx context.Context, tenant *tenant.Tenant, planConfig PlanConfig, isYearly bool) (string, error) {
	if m.gerencianetClient == nil {
		return "", errors.New("Gerencianet client not initialized")
	}

	// Determine price based on billing period
	amount := planConfig.PriceMonthly
	interval := 1
	intervalType := "months"

	if isYearly {
		amount = planConfig.PriceYearly
		interval = 1
		intervalType = "years"
	}

	// Create/get customer
	customerID := 0
	customerKey := fmt.Sprintf("vf:tenant:%s:gerencianet_customer_id", tenant.ID)
	customerIDStr, err := m.client.Get(ctx, customerKey).Result()
	if err == nil && customerIDStr != "" {
		customerID, _ = strconv.Atoi(customerIDStr)
	}

	if customerID == 0 {
		// Create new customer
		customerID, err = m.gerencianetClient.CreateCustomer(
			tenant.Name,
			tenant.ContactEmail,
			"",
			"",
			"",
		)
		if err != nil {
			return "", fmt.Errorf("failed to create customer: %w", err)
		}

		// Save customer ID
		m.client.Set(ctx, customerKey, customerID, 0)
	}

	// Create plan if not exists
	planID := 0
	if planConfig.GerencianetPlanID != "" {
		planID, _ = strconv.Atoi(planConfig.GerencianetPlanID)
	}

	if planID == 0 {
		// Create plan
		planName := fmt.Sprintf("%s - %s", planConfig.DisplayName, tenant.ID)
		planDesc := planConfig.Description

		planID, err = m.gerencianetClient.CreatePlan(planName, planDesc, int(amount), intervalType, interval)
		if err != nil {
			return "", fmt.Errorf("failed to create plan: %w", err)
		}
	}

	// Create subscription
	subscriptionID, err := m.gerencianetClient.CreateSubscription(planID, customerID, "credit_card")
	if err != nil {
		return "", fmt.Errorf("failed to create subscription: %w", err)
	}

	// Save subscription ID
	m.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:gerencianet_subscription_id", tenant.ID), subscriptionID, 0)

	// Return checkout URL (a bit simplified - in real implementation this would be the actual URL from the API)
	return fmt.Sprintf("https://sandbox.gerencianet.com.br/checkout/%d", subscriptionID), nil
}

// handleGerencianetWebhook processes a webhook from Gerencianet
func (m *BillingManager) handleGerencianetWebhook(ctx context.Context, body []byte) error {
	// Parse webhook
	var webhook struct {
		Event          string `json:"event"`
		SubscriptionID int    `json:"subscription_id"`
		Status         string `json:"status"`
	}
	if err := json.Unmarshal(body, &webhook); err != nil {
		return fmt.Errorf("failed to parse webhook: %w", err)
	}

	// Find tenant by subscription ID
	tenantID, err := m.client.Get(ctx, fmt.Sprintf("vf:gerencianet_subscription:%d:tenant_id", webhook.SubscriptionID)).Result()
	if err != nil {
		return fmt.Errorf("failed to find tenant for subscription: %w", err)
	}

	// Update billing info
	billingInfo, err := m.GetBillingInfo(ctx, tenantID)
	if err != nil {
		// If billing info doesn't exist, create it
		if err.Error() == "billing info not found for tenant: "+tenantID {
			billingInfo = &TenantBillingInfo{
				TenantID:       tenantID,
				SubscriptionID: fmt.Sprintf("%d", webhook.SubscriptionID),
				CreatedAt:      time.Now(),
			}
		} else {
			return err
		}
	}

	// Update status based on the webhook event
	switch webhook.Event {
	case "subscription.created":
		billingInfo.Status = SubscriptionActive
	case "subscription.updated":
		// Update status
		switch webhook.Status {
		case "active":
			billingInfo.Status = SubscriptionActive
		case "canceled":
			billingInfo.Status = SubscriptionCanceled
		case "expired":
			billingInfo.Status = SubscriptionPastDue
		}
	}

	// Save updated billing info
	billingInfo.UpdatedAt = time.Now()
	return m.SaveBillingInfo(ctx, billingInfo)
}
