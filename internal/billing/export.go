package billing

import (
	"context"
	"encoding/csv"
	"encoding/json"
	"fmt"
	"os"
	"sort"
	"strconv"
	"time"
)

// ExportFormat represents the format for billing data export
type ExportFormat string

const (
	// CSVFormat for exporting as CSV
	CSVFormat ExportFormat = "csv"
	// JSONFormat for exporting as JSON
	JSONFormat ExportFormat = "json"
)

// ExportOptions defines options for exporting billing data
type ExportOptions struct {
	Format     ExportFormat `json:"format"`
	StartDate  time.Time    `json:"start_date"`
	EndDate    time.Time    `json:"end_date"`
	IncludeRaw bool         `json:"include_raw"`
}

// BillingExportData represents the aggregate data for billing export
type BillingExportData struct {
	TenantID       string                     `json:"tenant_id"`
	TenantName     string                     `json:"tenant_name"`
	Plan           string                     `json:"plan"`
	BillingPeriod  string                     `json:"billing_period"`
	CurrentCharges float64                    `json:"current_charges"`
	ResourceUsage  map[string]*ResourceUsage  `json:"resource_usage"`
	RawUsageData   []UsageRecord              `json:"raw_usage_data,omitempty"`
}

// ResourceUsage represents aggregated usage for a specific resource
type ResourceUsage struct {
	ResourceKey     string  `json:"resource_key"`
	Total           int64   `json:"total"`
	Included        int64   `json:"included"`
	Overage         int64   `json:"overage"`
	OverageCharge   float64 `json:"overage_charge"`
	UnitPrice       float64 `json:"unit_price"`
	LastUpdated     string  `json:"last_updated"`
}

// ExportBillingData exports billing data for a tenant in the specified format
func (m *BillingManager) ExportBillingData(ctx context.Context, tenantID string, options ExportOptions) ([]byte, string, error) {
	// Get tenant billing info
	billingInfo, err := m.GetBillingInfo(ctx, tenantID)
	if err != nil {
		return nil, "", err
	}

	// Get tenant details
	tenantDetails, err := m.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return nil, "", err
	}

	// Get usage records
	usageRecords, err := m.GetUsageRecords(ctx, tenantID, options.StartDate, options.EndDate)
	if err != nil {
		return nil, "", err
	}

	// Get plan details
	var planConfig *PlanConfig
	for _, plan := range m.config.PlanConfigs {
		if plan.PlanType == billingInfo.Plan {
			planConfig = &plan
			break
		}
	}
	if planConfig == nil {
		return nil, "", fmt.Errorf("plan config not found for plan: %s", billingInfo.Plan)
	}

	// Aggregate data
	exportData := BillingExportData{
		TenantID:      tenantID,
		TenantName:    tenantDetails.Name,
		Plan:          string(billingInfo.Plan),
		BillingPeriod: fmt.Sprintf("%s to %s", 
			billingInfo.CurrentPeriodStart.Format("2006-01-02"), 
			billingInfo.CurrentPeriodEnd.Format("2006-01-02")),
		ResourceUsage: make(map[string]*ResourceUsage),
	}

	// Process usage records
	resourceKeys := make(map[string]bool)
	for _, record := range usageRecords {
		resourceKeys[record.ResourceKey] = true
		
		if _, ok := exportData.ResourceUsage[record.ResourceKey]; !ok {
			exportData.ResourceUsage[record.ResourceKey] = &ResourceUsage{
				ResourceKey: record.ResourceKey,
				Total:       0,
				Included:    0,
				Overage:     0,
				UnitPrice:   0.00, // Will be set based on plan
			}
		}
		
		exportData.ResourceUsage[record.ResourceKey].Total += record.Quantity
		exportData.ResourceUsage[record.ResourceKey].LastUpdated = record.Timestamp.Format(time.RFC3339)
	}
	
	// Add raw usage data if requested
	if options.IncludeRaw {
		exportData.RawUsageData = usageRecords
	}
	
	// Calculate charges (fictional logic for demonstration)
	// In a real system, this would use actual pricing data from Stripe/Gerencianet
	var totalCharges float64
	if planConfig != nil {
		// Set overage charges based on plan
		for key, usage := range exportData.ResourceUsage {
			switch key {
			case "requests":
				usage.Included = 1000000 // Example: 1M requests included in plan
				usage.UnitPrice = 0.0001 // $0.0001 per additional request
			case "bandwidth":
				usage.Included = 1000 // Example: 1TB bandwidth included
				usage.UnitPrice = 0.05 // $0.05 per additional GB
			case "storage":
				usage.Included = 100 // Example: 100GB storage included
				usage.UnitPrice = 0.02 // $0.02 per additional GB
			}
			
			if usage.Total > usage.Included {
				usage.Overage = usage.Total - usage.Included
				usage.OverageCharge = float64(usage.Overage) * usage.UnitPrice
				totalCharges += usage.OverageCharge
			}
		}
	}
	
	// Set current charges
	exportData.CurrentCharges = totalCharges
	
	// Export data based on format
	var contentType string
	var data []byte
	
	switch options.Format {
	case JSONFormat:
		data, err = json.MarshalIndent(exportData, "", "  ")
		contentType = "application/json"
	case CSVFormat:
		data, err = exportToCSV(exportData)
		contentType = "text/csv"
	default:
		return nil, "", fmt.Errorf("unsupported export format: %s", options.Format)
	}
	
	if err != nil {
		return nil, "", err
	}
	
	return data, contentType, nil
}

// ExportBillingDataToFile exports billing data to a file
func (m *BillingManager) ExportBillingDataToFile(ctx context.Context, tenantID, filePath string, options ExportOptions) error {
	data, _, err := m.ExportBillingData(ctx, tenantID, options)
	if err != nil {
		return err
	}
	
	return os.WriteFile(filePath, data, 0644)
}

// exportToCSV converts billing export data to CSV format
func exportToCSV(data BillingExportData) ([]byte, error) {
	records := [][]string{
		{"Tenant ID", "Tenant Name", "Plan", "Billing Period", "Current Charges"},
		{data.TenantID, data.TenantName, data.Plan, data.BillingPeriod, fmt.Sprintf("%.2f", data.CurrentCharges)},
		{}, // Empty line
		{"Resource", "Total Usage", "Included in Plan", "Overage", "Unit Price", "Overage Charges", "Last Updated"},
	}
	
	// Sort resource keys for consistent output
	var keys []string
	for k := range data.ResourceUsage {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	
	for _, key := range keys {
		usage := data.ResourceUsage[key]
		records = append(records, []string{
			usage.ResourceKey,
			strconv.FormatInt(usage.Total, 10),
			strconv.FormatInt(usage.Included, 10),
			strconv.FormatInt(usage.Overage, 10),
			fmt.Sprintf("%.5f", usage.UnitPrice),
			fmt.Sprintf("%.2f", usage.OverageCharge),
			usage.LastUpdated,
		})
	}
	
	// Add raw data if included
	if len(data.RawUsageData) > 0 {
		records = append(records, []string{})
		records = append(records, []string{"Raw Usage Data"})
		records = append(records, []string{"Tenant ID", "Resource", "Quantity", "Timestamp"})
		
		for _, record := range data.RawUsageData {
			records = append(records, []string{
				record.TenantID,
				record.ResourceKey,
				strconv.FormatInt(record.Quantity, 10),
				record.Timestamp.Format(time.RFC3339),
			})
		}
	}
	
	// Write CSV
	var csvContent []byte
	buf := &csvContent
	w := csv.NewWriter(buf)
	err := w.WriteAll(records)
	if err != nil {
		return nil, err
	}
	
	return *buf, nil
}
