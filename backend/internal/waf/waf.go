package waf

import (
	"net/http"

	coraza "github.com/corazawaf/coraza/v3"
)

// WAF wraps a Coraza engine.
type WAF struct {
	engine coraza.WAF
}

// New creates a WAF instance using directives loaded from the given file.
func New(rulesFile string) (*WAF, error) {
	if rulesFile == "" {
		return nil, nil
	}
	engine, err := coraza.NewWAF(
		coraza.NewWAFConfig().WithDirectivesFromFile(rulesFile),
	)
	if err != nil {
		return nil, err
	}
	return &WAF{engine: engine}, nil
}

// Middleware evaluates HTTP requests using the WAF before calling next.
func (w *WAF) Middleware(next http.Handler) http.Handler {
	if w == nil || w.engine == nil {
		return next
	}
	return http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
		tx := w.engine.NewTransaction()
		defer func() {
			tx.ProcessLogging()
			tx.Close()
		}()

		tx.ProcessConnection(r.RemoteAddr, 0, r.Host, 0)
		tx.ProcessURI(r.URL.String(), r.Method, r.Proto)
		for k, v := range r.Header {
			for _, vv := range v {
				tx.AddRequestHeader(k, vv)
			}
		}
		if it := tx.ProcessRequestHeaders(); it != nil {
			http.Error(rw, http.StatusText(it.Status), it.Status)
			return
		}
		next.ServeHTTP(rw, r)
	})
}
