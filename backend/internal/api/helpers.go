package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"go.uber.org/zap"
)

// Helper functions for API handlers

// writeJSONResponse writes a JSON response with the given status code
func (a *API) writeJSONResponse(w http.ResponseWriter, statusCode int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(statusCode)

	if data != nil {
		json.NewEncoder(w).Encode(data)
	}
}

// writeSuccessResponse writes a success response
func (a *API) writeSuccessResponse(w http.ResponseWriter, message string, data interface{}) {
	response := SuccessResponse{
		Success: true,
		Message: message,
		Data:    data,
	}
	a.writeJSONResponse(w, http.StatusOK, response)
}

// parseJSONRequest parses JSON request body into the given interface
func (a *API) parseJSONRequest(r *http.Request, v interface{}) error {
	decoder := json.NewDecoder(r.Body)
	decoder.DisallowUnknownFields()
	return decoder.Decode(v)
}

// extractPathVariable extracts a path variable from the request
func (a *API) extractPathVariable(r *http.Request, name string) string {
	vars := mux.Vars(r)
	return vars[name]
}

// extractQueryParam extracts a query parameter with default value
func (a *API) extractQueryParam(r *http.Request, name, defaultValue string) string {
	value := r.URL.Query().Get(name)
	if value == "" {
		return defaultValue
	}
	return value
}

// extractIntQueryParam extracts an integer query parameter with default value
func (a *API) extractIntQueryParam(r *http.Request, name string, defaultValue int) int {
	value := r.URL.Query().Get(name)
	if value == "" {
		return defaultValue
	}

	intValue, err := strconv.Atoi(value)
	if err != nil {
		return defaultValue
	}

	return intValue
}

// Helper method that uses the currently unused helpers
func (a *API) processRequest(w http.ResponseWriter, r *http.Request, data interface{}) {
	// Use extractPathVariable for common path parameters
	if id := a.extractPathVariable(r, "id"); id != "" {
		a.logger.Debug("Processing request with ID", zap.String("id", id))
	}

	if tenantID := a.extractPathVariable(r, "tenant_id"); tenantID != "" {
		a.logger.Debug("Processing request for tenant", zap.String("tenant_id", tenantID))
	}

	// Use extractIntQueryParam for pagination
	page := a.extractIntQueryParam(r, "page", 1)
	limit := a.extractIntQueryParam(r, "limit", 10)

	a.logger.Debug("Request pagination",
		zap.Int("page", page),
		zap.Int("limit", limit))

	// Process request with pagination info if needed
	result := map[string]interface{}{
		"data": data,
		"pagination": map[string]int{
			"page":  page,
			"limit": limit,
		},
	}

	// Use writeSuccessResponse
	a.writeSuccessResponse(w, "Request processed successfully", result)
}
