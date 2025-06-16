package middleware

import (
	"net/http"
	"os"
)

// AdminAuth provides simple Basic Auth protection for admin endpoints.
func AdminAuth(next http.Handler) http.Handler {
	user := os.Getenv("VF_ADMIN_USER")
	pass := os.Getenv("VF_ADMIN_PASS")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		u, p, ok := r.BasicAuth()
		if !ok || u != user || p != pass {
			w.Header().Set("WWW-Authenticate", `Basic realm="VeloFlux"`)
			w.WriteHeader(http.StatusUnauthorized)
			return
		}
		next.ServeHTTP(w, r)
	})
}
