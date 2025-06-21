package api

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
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
