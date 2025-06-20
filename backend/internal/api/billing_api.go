package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/eltonciatto/veloflux/internal/billing"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// BillingAPI handles billing-related endpoints
type BillingAPI struct {
	logger         *zap.Logger
	billingManager *billing.BillingManager
	tenantManager  *tenant.Manager
	router         *mux.Router
}

// NewBillingAPI creates a new billing API handler
func NewBillingAPI(billingManager *billing.BillingManager, tenantManager *tenant.Manager, logger *zap.Logger) *BillingAPI {
	api := &BillingAPI{
		logger:         logger,
		billingManager: billingManager,
		tenantManager:  tenantManager,
		router:         mux.NewRouter(),
	}

	// Setup routes
	api.setupRoutes()

	return api
}

// Handler returns the HTTP handler for the billing API.
func (api *BillingAPI) Handler() http.Handler {
	return api.router
}

// setupRoutes configures the billing API routes
func (api *BillingAPI) setupRoutes() {
	// Core billing routes
	api.router.HandleFunc("/subscriptions", api.handleGetSubscriptions).Methods("GET")
	api.router.HandleFunc("/subscriptions", api.handleCreateSubscription).Methods("POST")
	api.router.HandleFunc("/subscriptions/{id}", api.handleGetSubscription).Methods("GET")
	api.router.HandleFunc("/subscriptions/{id}", api.handleUpdateSubscription).Methods("PUT")
	api.router.HandleFunc("/subscriptions/{id}", api.handleDeleteSubscription).Methods("DELETE")

	api.router.HandleFunc("/invoices", api.handleGetInvoices).Methods("GET")
	api.router.HandleFunc("/invoices/{id}", api.handleGetInvoice).Methods("GET")
	api.router.HandleFunc("/invoices/{id}/download", api.handleDownloadInvoice).Methods("GET")

	// Webhook routes
	api.router.HandleFunc("/webhooks", api.handleWebhook).Methods("POST")
	api.router.HandleFunc("/webhooks", api.handleGetWebhooks).Methods("GET")
	api.router.HandleFunc("/webhooks", api.handleCreateWebhookConfig).Methods("POST")
	api.router.HandleFunc("/webhooks/{id}", api.handleUpdateWebhookConfig).Methods("PUT")
	api.router.HandleFunc("/webhooks/{id}", api.handleDeleteWebhookConfig).Methods("DELETE")

	// Enhanced billing features
	api.router.HandleFunc("/export", api.handleExportBilling).Methods("GET")
	api.router.HandleFunc("/transactions", api.handleGetTransactions).Methods("GET")
	api.router.HandleFunc("/usage-alerts", api.handleGetUsageAlerts).Methods("GET")
	api.router.HandleFunc("/usage-alerts", api.handleCreateUsageAlert).Methods("POST")
	api.router.HandleFunc("/usage-alerts/{id}", api.handleUpdateUsageAlert).Methods("PUT")
	api.router.HandleFunc("/notifications", api.handleGetNotifications).Methods("GET")
	api.router.HandleFunc("/notifications/{id}/read", api.handleMarkNotificationRead).Methods("POST")
}

// handleWebhook handles webhooks from payment providers
func (api *BillingAPI) handleWebhook(w http.ResponseWriter, r *http.Request) {
	body := make([]byte, r.ContentLength)
	_, err := r.Body.Read(body)
	if err != nil {
		http.Error(w, "Failed to read request body", http.StatusBadRequest)
		return
	}

	// Get signature from header
	signature := r.Header.Get("Stripe-Signature")

	// Process webhook
	err = api.billingManager.HandleWebhook(r.Context(), body, signature)
	if err != nil {
		api.logger.Error("Failed to process webhook", zap.Error(err))
		http.Error(w, "Failed to process webhook", http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusOK)
}

// handleGetBilling retrieves billing information for a tenant
func (api *BillingAPI) handleGetBilling(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get billing info
	billingInfo, err := api.billingManager.GetBillingInfo(r.Context(), tenantID)
	if err != nil {
		// If billing info not found, return empty response
		if err.Error() == "billing info not found for tenant: "+tenantID {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"tenant_id": tenantID,
				"status":    "no_subscription",
			})
			return
		}

		api.logger.Error("Failed to get billing info", zap.Error(err))
		http.Error(w, "Failed to get billing info", http.StatusInternalServerError)
		return
	}

	// Return billing info
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(billingInfo)
}

// handleCreateCheckout creates a checkout session for a tenant
func (api *BillingAPI) handleCreateCheckout(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse request body
	var req struct {
		PlanType string `json:"plan_type"`
		IsYearly bool   `json:"is_yearly"`
	}
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Create checkout session
	checkoutURL, err := api.billingManager.CreateCheckoutSession(
		r.Context(),
		tenantID,
		tenant.PlanType(req.PlanType),
		req.IsYearly,
	)
	if err != nil {
		api.logger.Error("Failed to create checkout session", zap.Error(err))
		http.Error(w, "Failed to create checkout session", http.StatusInternalServerError)
		return
	}

	// Return checkout URL
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"checkout_url": checkoutURL,
	})
}

// handleGetUsage retrieves usage information for a tenant
func (api *BillingAPI) handleGetUsage(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse query parameters for date range
	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")
	resourceType := r.URL.Query().Get("resource")

	// Default to current month if no dates provided
	now := time.Now()
	startDate := time.Date(now.Year(), now.Month(), 1, 0, 0, 0, 0, time.UTC)
	endDate := time.Date(now.Year(), now.Month()+1, 0, 23, 59, 59, 999999999, time.UTC)

	// Parse provided dates if available
	if startDateStr != "" {
		parsedStartDate, err := time.Parse("2006-01-02", startDateStr)
		if err == nil {
			startDate = parsedStartDate
		}
	}
	if endDateStr != "" {
		parsedEndDate, err := time.Parse("2006-01-02", endDateStr)
		if err == nil {
			endDate = parsedEndDate.Add(24*time.Hour - 1*time.Nanosecond)
		}
	}

	// Default resource type to "requests" if not provided
	if resourceType == "" {
		resourceType = "requests"
	}

	// Get usage data
	usageData, err := api.billingManager.GetUsageSummary(r.Context(), tenantID, resourceType, startDate, endDate)
	if err != nil {
		api.logger.Error("Failed to get usage data", zap.Error(err))
		http.Error(w, "Failed to get usage data", http.StatusInternalServerError)
		return
	}

	// Get tenant to determine plan limits
	tenantData, err := api.tenantManager.GetTenant(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get tenant", zap.Error(err))
		http.Error(w, "Failed to get tenant", http.StatusInternalServerError)
		return
	}

	// Calculate total usage
	var totalUsage int64
	for _, usage := range usageData {
		totalUsage += usage
	}

	// Get plan limit for this resource
	planLimit := api.billingManager.GetLimitForPlan(tenantData.Plan, resourceType)

	// Return usage data
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"tenant_id":   tenantID,
		"resource":    resourceType,
		"start_date":  startDate.Format("2006-01-02"),
		"end_date":    endDate.Format("2006-01-02"),
		"total_usage": totalUsage,
		"plan_limit":  planLimit,
		"usage":       usageData,
	})
}

// handleExportBilling exports billing data for external systems
func (api *BillingAPI) handleExportBilling(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse export options from query parameters
	format := r.URL.Query().Get("format")
	if format == "" {
		format = string(billing.JSONFormat)
	}

	startDateStr := r.URL.Query().Get("start_date")
	endDateStr := r.URL.Query().Get("end_date")
	includeRawStr := r.URL.Query().Get("include_raw")

	// Parse dates
	startDate := time.Now().AddDate(0, -1, 0) // Default to one month ago
	endDate := time.Now()                     // Default to now

	// If year/month parameters are provided (backward compatibility)
	yearStr := r.URL.Query().Get("year")
	monthStr := r.URL.Query().Get("month")
	if yearStr != "" && monthStr != "" {
		year, _ := strconv.Atoi(yearStr)
		month, _ := strconv.Atoi(monthStr)
		if year > 0 && month > 0 && month <= 12 {
			startDate = time.Date(year, time.Month(month), 1, 0, 0, 0, 0, time.UTC)
			endDate = startDate.AddDate(0, 1, 0).Add(-time.Second)
		}
	} else {
		// Parse specific date range if provided
		if startDateStr != "" {
			parsedStartDate, err := time.Parse("2006-01-02", startDateStr)
			if err == nil {
				startDate = parsedStartDate
			}
		}

		if endDateStr != "" {
			parsedEndDate, err := time.Parse("2006-01-02", endDateStr)
			if err == nil {
				endDate = parsedEndDate
			}
		}
	}

	// Parse include raw option
	includeRaw := false
	if includeRawStr == "true" {
		includeRaw = true
	}

	// Create export options
	options := billing.ExportOptions{
		Format:     billing.ExportFormat(format),
		StartDate:  startDate,
		EndDate:    endDate,
		IncludeRaw: includeRaw,
	}

	// Export billing data
	data, contentType, err := api.billingManager.ExportBillingData(r.Context(), tenantID, options)
	if err != nil {
		api.logger.Error("Failed to export billing data", zap.Error(err))
		http.Error(w, "Failed to export billing data", http.StatusInternalServerError)
		return
	}

	// Set filename based on tenant ID and format
	filename := fmt.Sprintf("veloflux_billing_%s_%s_to_%s.%s",
		tenantID,
		startDate.Format("20060102"),
		endDate.Format("20060102"),
		strings.ToLower(string(options.Format)))

	// Set headers
	w.Header().Set("Content-Type", contentType)
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=%s", filename))
	w.Header().Set("Content-Length", strconv.Itoa(len(data)))

	// Write response
	w.Write(data)
}

// handleGetPlans retrieves available plans with pricing
func (api *BillingAPI) handleGetPlans(w http.ResponseWriter, r *http.Request) {
	// Get plans with pricing
	plans, err := api.billingManager.GetPlansWithPricing(r.Context())
	if err != nil {
		api.logger.Error("Failed to get plans", zap.Error(err))
		http.Error(w, "Failed to get plans", http.StatusInternalServerError)
		return
	}

	// Return plans
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(plans)
}

// handleGetWebhooks retrieves webhook configurations
func (api *BillingAPI) handleGetWebhooks(w http.ResponseWriter, r *http.Request) {
	// Mock webhook data - in production, get from database
	webhooks := []map[string]interface{}{
		{
			"id":            "wh_001",
			"name":          "Stripe Payment Webhook",
			"url":           "https://api.example.com/webhooks/stripe",
			"events":        []string{"invoice.created", "payment.completed", "subscription.updated"},
			"enabled":       true,
			"status":        "active",
			"created_at":    "2024-01-01T00:00:00Z",
			"last_triggered": "2024-01-15T10:30:00Z",
			"retry_config": map[string]interface{}{
				"max_retries":        3,
				"retry_delay":       1000,
				"exponential_backoff": true,
			},
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(webhooks)
}

// handleCreateWebhookConfig creates a new webhook configuration
func (api *BillingAPI) handleCreateWebhookConfig(w http.ResponseWriter, r *http.Request) {
	var webhook map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&webhook); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Add ID and timestamps
	webhook["id"] = fmt.Sprintf("wh_%d", time.Now().Unix())
	webhook["created_at"] = time.Now().Format(time.RFC3339)
	webhook["status"] = "active"

	api.logger.Info("Created webhook configuration", zap.Any("webhook", webhook))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(webhook)
}

// handleUpdateWebhookConfig updates a webhook configuration
func (api *BillingAPI) handleUpdateWebhookConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["id"]

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updates["id"] = webhookID
	updates["updated_at"] = time.Now().Format(time.RFC3339)

	api.logger.Info("Updated webhook configuration", zap.String("webhook_id", webhookID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updates)
}

// handleDeleteWebhookConfig deletes a webhook configuration
func (api *BillingAPI) handleDeleteWebhookConfig(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	webhookID := vars["id"]

	api.logger.Info("Deleted webhook configuration", zap.String("webhook_id", webhookID))

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// handleGetTransactions retrieves billing transactions
func (api *BillingAPI) handleGetTransactions(w http.ResponseWriter, r *http.Request) {
	transactions := []map[string]interface{}{
		{
			"id":               "txn_001",
			"tenant_id":        "tenant_001",
			"tenant_name":      "Example Corp",
			"transaction_type": "charge",
			"amount":           150.50,
			"currency":         "USD",
			"description":      "Monthly usage charge",
			"service_type":     "load_balancer",
			"usage_details": map[string]interface{}{
				"bandwidth_gb":  245.7,
				"compute_hours": 720,
				"storage_gb":    50.2,
				"api_calls":     15000,
			},
			"timestamp":  time.Now().Add(-24 * time.Hour).Format(time.RFC3339),
			"invoice_id": "inv_001",
			"status":     "completed",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(transactions)
}

// handleGetUsageAlerts retrieves usage alerts
func (api *BillingAPI) handleGetUsageAlerts(w http.ResponseWriter, r *http.Request) {
	alerts := []map[string]interface{}{
		{
			"id":           "alert_001",
			"name":         "High Bandwidth Usage",
			"metric":       "bandwidth_gb",
			"limit":        1000,
			"current_usage": 850.5,
			"threshold":    80,
			"triggered":    true,
			"created_at":   time.Now().Add(-7 * 24 * time.Hour).Format(time.RFC3339),
			"last_checked": time.Now().Add(-1 * time.Hour).Format(time.RFC3339),
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(alerts)
}

// handleCreateUsageAlert creates a new usage alert
func (api *BillingAPI) handleCreateUsageAlert(w http.ResponseWriter, r *http.Request) {
	var alert map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&alert); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	alert["id"] = fmt.Sprintf("alert_%d", time.Now().Unix())
	alert["created_at"] = time.Now().Format(time.RFC3339)
	alert["triggered"] = false

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(alert)
}

// handleUpdateUsageAlert updates a usage alert
func (api *BillingAPI) handleUpdateUsageAlert(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	alertID := vars["id"]

	var updates map[string]interface{}
	if err := json.NewDecoder(r.Body).Decode(&updates); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updates["id"] = alertID
	updates["updated_at"] = time.Now().Format(time.RFC3339)

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updates)
}

// handleGetNotifications retrieves billing notifications
func (api *BillingAPI) handleGetNotifications(w http.ResponseWriter, r *http.Request) {
	notifications := []map[string]interface{}{
		{
			"id":        "notif_001",
			"type":      "payment_success",
			"title":     "Payment Processed Successfully",
			"message":   "Your payment of $150.50 has been processed successfully.",
			"read":      false,
			"timestamp": time.Now().Add(-2 * time.Hour).Format(time.RFC3339),
			"priority":  "normal",
		},
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(notifications)
}

// handleMarkNotificationRead marks a notification as read
func (api *BillingAPI) handleMarkNotificationRead(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	notificationID := vars["id"]

	api.logger.Info("Marked notification as read", zap.String("notification_id", notificationID))

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// handleDownloadInvoice downloads invoice PDF
func (api *BillingAPI) handleDownloadInvoice(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	invoiceID := vars["id"]

	// In production, generate and return actual PDF
	w.Header().Set("Content-Type", "application/pdf")
	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=invoice_%s.pdf", invoiceID))
	
	// Mock PDF content
	w.Write([]byte("Mock PDF content for invoice " + invoiceID))
}
