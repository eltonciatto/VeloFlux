package api

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/eltonciatto/veloflux/internal/orchestration"
	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// OrchestrationAPI handles orchestration-related API endpoints
type OrchestrationAPI struct {
	logger        *zap.Logger
	orchestrator  *orchestration.Orchestrator
	tenantManager *tenant.Manager
}

// NewOrchestrationAPI creates a new orchestration API handler
func NewOrchestrationAPI(orchestrator *orchestration.Orchestrator, tenantManager *tenant.Manager, logger *zap.Logger) *OrchestrationAPI {
	return &OrchestrationAPI{
		logger:        logger,
		orchestrator:  orchestrator,
		tenantManager: tenantManager,
	}
}

// SetupRoutes sets up the routes for the orchestration API
func (api *OrchestrationAPI) SetupRoutes(router *mux.Router) {
	// Tenant-specific orchestration endpoints
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration", api.handleGetConfig).Methods("GET")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration", api.handleSetConfig).Methods("PUT")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/status", api.handleGetStatus).Methods("GET")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/detailed_status", api.handleGetDetailedStatus).Methods("GET")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/deploy", api.handleDeploy).Methods("POST")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/drain", api.handleDrain).Methods("POST")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/scale", api.handleScale).Methods("POST")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/autoscale", api.handleSetAutoscaling).Methods("PUT")
	router.HandleFunc("/api/tenants/{tenant_id}/orchestration/resources", api.handleUpdateResources).Methods("PUT")
}

// handleGetConfig gets orchestration configuration for a tenant
func (api *OrchestrationAPI) handleGetConfig(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get orchestration configuration
	config, err := api.orchestrator.GetTenantConfig(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get orchestration config", zap.Error(err))
		http.Error(w, "Failed to get orchestration configuration", http.StatusInternalServerError)
		return
	}

	// Return configuration
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(config)
}

// handleSetConfig sets orchestration configuration for a tenant
func (api *OrchestrationAPI) handleSetConfig(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse request body
	var config orchestration.TenantOrchestratorConfig
	err := json.NewDecoder(r.Body).Decode(&config)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Set tenant ID (ignore what was in the request body)
	config.TenantID = tenantID

	// Validate resource limits
	if config.ResourceLimits.CPURequest == "" {
		config.ResourceLimits.CPURequest = "100m"
	}
	if config.ResourceLimits.CPULimit == "" {
		config.ResourceLimits.CPULimit = "200m"
	}
	if config.ResourceLimits.MemoryRequest == "" {
		config.ResourceLimits.MemoryRequest = "128Mi"
	}
	if config.ResourceLimits.MemoryLimit == "" {
		config.ResourceLimits.MemoryLimit = "256Mi"
	}

	// Set default values for autoscaling
	if config.AutoscalingEnabled {
		if config.MinReplicas <= 0 {
			config.MinReplicas = 1
		}
		if config.MaxReplicas <= config.MinReplicas {
			config.MaxReplicas = config.MinReplicas * 2
		}
		if config.TargetCPUUtilization <= 0 {
			config.TargetCPUUtilization = 70
		}
	}

	// Update orchestration configuration
	err = api.orchestrator.SetTenantConfig(r.Context(), &config)
	if err != nil {
		api.logger.Error("Failed to set orchestration config", zap.Error(err))
		http.Error(w, "Failed to update orchestration configuration", http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusOK)
}

// handleGetStatus gets deployment status for a tenant
func (api *OrchestrationAPI) handleGetStatus(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get deployment status
	status, err := api.orchestrator.GetDeploymentStatus(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get deployment status", zap.Error(err))
		http.Error(w, "Failed to get deployment status", http.StatusInternalServerError)
		return
	}

	// Return status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

// handleGetDetailedStatus gets detailed deployment status for a tenant
func (api *OrchestrationAPI) handleGetDetailedStatus(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get detailed deployment status
	status, err := api.orchestrator.GetDetailedDeploymentStatus(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get detailed deployment status", zap.Error(err))
		http.Error(w, "Failed to get detailed deployment status", http.StatusInternalServerError)
		return
	}

	// Return status
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(status)
}

// handleDeploy initiates deployment for a tenant
func (api *OrchestrationAPI) handleDeploy(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Get orchestration configuration
	config, err := api.orchestrator.GetTenantConfig(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get orchestration config", zap.Error(err))
		http.Error(w, "Failed to get orchestration configuration", http.StatusInternalServerError)
		return
	}

	// If in dedicated mode, create or update the dedicated instance
	if config.Mode == orchestration.DedicatedMode {
		if config.DedicatedNamespace == "" {
			// Create new dedicated instance
			err = api.orchestrator.CreateDedicatedInstance(r.Context(), tenantID)
		} else {
			// Update existing dedicated instance
			err = api.orchestrator.UpdateDedicatedInstance(r.Context(), tenantID)
		}

		if err != nil {
			api.logger.Error("Failed to deploy tenant", zap.Error(err))
			http.Error(w, "Failed to deploy tenant", http.StatusInternalServerError)
			return
		}
	} else {
		// For shared mode, just update the status
		status := &orchestration.DeploymentStatus{
			TenantID:  tenantID,
			Mode:      orchestration.SharedMode,
			Status:    "ready",
			Namespace: api.orchestrator.GetConfig().Namespace,
			Version:   "shared",
		}

		err = api.orchestrator.UpdateDeploymentStatus(r.Context(), status)
		if err != nil {
			api.logger.Error("Failed to update deployment status", zap.Error(err))
			http.Error(w, "Failed to update deployment status", http.StatusInternalServerError)
			return
		}
	}

	// Return success
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "deploying",
		"message": "Deployment initiated",
	})
}

// handleDrain initiates a drain for a tenant's instance
func (api *OrchestrationAPI) handleDrain(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Drain the instance
	err := api.orchestrator.DrainTenantInstance(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to drain tenant instance", zap.Error(err))
		http.Error(w, fmt.Sprintf("Failed to drain tenant instance: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "draining",
		"message": "Drain initiated for tenant instance",
	})
}

// ScaleRequest holds parameters for scaling a tenant instance
type ScaleRequest struct {
	Replicas int `json:"replicas"`
}

// handleScale scales a tenant instance to a specified number of replicas
func (api *OrchestrationAPI) handleScale(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse request body
	var req ScaleRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate replicas
	if req.Replicas < 1 {
		http.Error(w, "Replicas must be at least 1", http.StatusBadRequest)
		return
	}

	// Scale the instance
	err = api.orchestrator.ScaleTenantInstance(r.Context(), tenantID, req.Replicas)
	if err != nil {
		api.logger.Error("Failed to scale tenant instance", zap.Error(err))
		http.Error(w, fmt.Sprintf("Failed to scale tenant instance: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusAccepted)
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "scaling",
		"message": fmt.Sprintf("Scaling to %d replicas", req.Replicas),
	})
}

// AutoscalingRequest holds parameters for configuring autoscaling
type AutoscalingRequest struct {
	Enabled              bool `json:"enabled"`
	MinReplicas          int  `json:"min_replicas"`
	MaxReplicas          int  `json:"max_replicas"`
	TargetCPUUtilization int  `json:"target_cpu_utilization"`
}

// handleSetAutoscaling configures autoscaling for a tenant instance
func (api *OrchestrationAPI) handleSetAutoscaling(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse request body
	var req AutoscalingRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate autoscaling params
	if req.Enabled {
		if req.MinReplicas < 1 {
			http.Error(w, "MinReplicas must be at least 1", http.StatusBadRequest)
			return
		}
		if req.MaxReplicas < req.MinReplicas {
			http.Error(w, "MaxReplicas must be greater than or equal to MinReplicas", http.StatusBadRequest)
			return
		}
		if req.TargetCPUUtilization < 10 || req.TargetCPUUtilization > 100 {
			http.Error(w, "TargetCPUUtilization must be between 10 and 100", http.StatusBadRequest)
			return
		}
	}

	// Get current config
	config, err := api.orchestrator.GetTenantConfig(r.Context(), tenantID)
	if err != nil {
		api.logger.Error("Failed to get tenant config", zap.Error(err))
		http.Error(w, "Failed to get tenant configuration", http.StatusInternalServerError)
		return
	}

	// Update config
	config.AutoscalingEnabled = req.Enabled
	if req.Enabled {
		config.MinReplicas = req.MinReplicas
		config.MaxReplicas = req.MaxReplicas
		config.TargetCPUUtilization = req.TargetCPUUtilization
	}

	// Update autoscaling config
	err = api.orchestrator.UpdateAutoscalingConfig(r.Context(), tenantID, config)
	if err != nil {
		api.logger.Error("Failed to update autoscaling", zap.Error(err))
		http.Error(w, fmt.Sprintf("Failed to update autoscaling: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	// Save updated config
	err = api.orchestrator.SetTenantConfig(r.Context(), config)
	if err != nil {
		api.logger.Error("Failed to save tenant config", zap.Error(err))
		// Continue with response as the autoscaling was updated
	}

	// Return success
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status": "updated",
		"autoscaling": map[string]interface{}{
			"enabled":                config.AutoscalingEnabled,
			"min_replicas":           config.MinReplicas,
			"max_replicas":           config.MaxReplicas,
			"target_cpu_utilization": config.TargetCPUUtilization,
		},
	})
}

// ResourceRequest holds parameters for updating resource limits
type ResourceRequest struct {
	CPURequest    string `json:"cpu_request"`
	CPULimit      string `json:"cpu_limit"`
	MemoryRequest string `json:"memory_request"`
	MemoryLimit   string `json:"memory_limit"`
}

// handleUpdateResources updates resource limits for a tenant instance
func (api *OrchestrationAPI) handleUpdateResources(w http.ResponseWriter, r *http.Request) {
	// Extract tenant ID from path
	vars := mux.Vars(r)
	tenantID := vars["tenant_id"]

	// Parse request body
	var req ResourceRequest
	err := json.NewDecoder(r.Body).Decode(&req)
	if err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate resource limits
	if req.CPURequest == "" || req.CPULimit == "" || req.MemoryRequest == "" || req.MemoryLimit == "" {
		http.Error(w, "All resource limits must be specified", http.StatusBadRequest)
		return
	}

	// Create resource limits object
	limits := orchestration.ResourceLimits{
		CPURequest:    req.CPURequest,
		CPULimit:      req.CPULimit,
		MemoryRequest: req.MemoryRequest,
		MemoryLimit:   req.MemoryLimit,
	}

	// Update resource limits
	err = api.orchestrator.UpdateResourceLimits(r.Context(), tenantID, limits)
	if err != nil {
		api.logger.Error("Failed to update resource limits", zap.Error(err))
		http.Error(w, fmt.Sprintf("Failed to update resource limits: %s", err.Error()), http.StatusInternalServerError)
		return
	}

	// Return success
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":          "updated",
		"resource_limits": limits,
	})
}
