package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"github.com/gorilla/mux"
	"github.com/golang-jwt/jwt/v5"
	"github.com/eltonciatto/veloflux/internal/auth"
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

// writeErrorResponse writes an error response
func (a *API) writeErrorResponse(w http.ResponseWriter, statusCode int, err error, message string) {
	response := ErrorResponse{
		Error:   err.Error(),
		Message: message,
		Code:    statusCode,
	}
	a.writeJSONResponse(w, statusCode, response)
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

// extractUserFromToken extracts user information from JWT token
func (a *API) extractUserFromToken(r *http.Request) (*auth.Claims, error) {
	authHeader := r.Header.Get("Authorization")
	if authHeader == "" {
		return nil, fmt.Errorf("authorization header missing")
	}

	// Extract token from "Bearer <token>"
	parts := strings.SplitN(authHeader, " ", 2)
	if len(parts) != 2 || parts[0] != "Bearer" {
		return nil, fmt.Errorf("invalid authorization header format")
	}

	tokenString := parts[1]
	
	// Parse and validate token
	token, err := jwt.ParseWithClaims(tokenString, &auth.Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(a.authenticator.GetJWTSecret()), nil
	})

	if err != nil {
		return nil, fmt.Errorf("invalid token: %v", err)
	}

	if claims, ok := token.Claims.(*auth.Claims); ok && token.Valid {
		return claims, nil
	}

	return nil, fmt.Errorf("invalid token claims")
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
