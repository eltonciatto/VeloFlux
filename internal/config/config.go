// 🚫 Not for Commercial Use Without License
// 📜 Licensed under VeloFlux Public Source License (VPSL) v1.0 — See LICENSE for details.
// 💼 For commercial licensing, visit https://veloflux.com or contact contact@veloflux.com

package config

import (
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Global        GlobalConfig        `yaml:"global"`
	Pools         []Pool              `yaml:"pools"`
	Routes        []Route             `yaml:"routes"`
	Cluster       ClusterConfig       `yaml:"cluster"`
	Auth          AuthConfig          `yaml:"auth"`
	Redis         RedisConfig         `yaml:"redis"`
	Tenant        TenantConfig        `yaml:"tenant"`
	Billing       BillingConfig       `yaml:"billing"`
	Orchestration OrchestrationConfig `yaml:"orchestration"`
	Tenants       []Tenant            `yaml:"tenants"` // Tenant-specific configurations
	API           APIConfig           `yaml:"api"`     // API server configuration
}

// APIConfig holds configuration for the API server
type APIConfig struct {
	BindAddress string `yaml:"bind_address"`
	AuthEnabled bool   `yaml:"auth_enabled"`
	Username    string `yaml:"username"`
	Password    string `yaml:"password"`
}

type GlobalConfig struct {
	BindAddress    string          `yaml:"bind_address"`
	TLSBindAddress string          `yaml:"tls_bind_address"`
	MetricsAddress string          `yaml:"metrics_address"`
	TLS            TLSConfig       `yaml:"tls"`
	HealthCheck    HealthConfig    `yaml:"health_check"`
	RateLimit      RateLimitConfig `yaml:"rate_limit"`
	WAF            WAFConfig       `yaml:"waf"`
	GeoIP          GeoIPConfig     `yaml:"geoip"`
}

type TLSConfig struct {
	AutoCert  bool   `yaml:"auto_cert"`
	ACMEEmail string `yaml:"acme_email"`
	CertDir   string `yaml:"cert_dir"`
}

type HealthConfig struct {
	Interval time.Duration `yaml:"interval"`
	Timeout  time.Duration `yaml:"timeout"`
	Retries  int           `yaml:"retries"`
}

type RateLimitConfig struct {
	RequestsPerSecond int           `yaml:"requests_per_second"`
	BurstSize         int           `yaml:"burst_size"`
	CleanupInterval   time.Duration `yaml:"cleanup_interval"`
	RedisAddress      string        `yaml:"redis_address"`
}

type WAFConfig struct {
	Enabled       bool   `yaml:"enabled"`
	RulesetPath   string `yaml:"ruleset_path"`
	Level         string `yaml:"level"` // "basic", "standard", "strict"
	LogViolations bool   `yaml:"log_violations"`
}

type GeoIPConfig struct {
	Enabled      bool   `yaml:"enabled"`
	DatabasePath string `yaml:"database_path"`
}

type ClusterConfig struct {
	Enabled           bool          `yaml:"enabled"`
	RedisAddress      string        `yaml:"redis_address"`
	RedisPassword     string        `yaml:"redis_password"`
	RedisDB           int           `yaml:"redis_db"`
	NodeID            string        `yaml:"node_id"`
	HeartbeatInterval time.Duration `yaml:"heartbeat_interval"`
	LeaderTimeout     time.Duration `yaml:"leader_timeout"`
}

type Pool struct {
	Name           string    `yaml:"name"`
	Algorithm      string    `yaml:"algorithm"`
	StickySessions bool      `yaml:"sticky_sessions"`
	Backends       []Backend `yaml:"backends"`
}

type Backend struct {
	Address     string      `yaml:"address"`
	Weight      int         `yaml:"weight"`
	HealthCheck HealthCheck `yaml:"health_check"`
}

type HealthCheck struct {
	Path           string        `yaml:"path"`
	Interval       time.Duration `yaml:"interval"`
	Timeout        time.Duration `yaml:"timeout"`
	ExpectedStatus int           `yaml:"expected_status"`
}

type Route struct {
	Host       string `yaml:"host"`
	Pool       string `yaml:"pool"`
	PathPrefix string `yaml:"path_prefix"`
}

// RedisConfig holds Redis configuration
type RedisConfig struct {
	Address  string `yaml:"address"`
	Password string `yaml:"password"`
	DB       int    `yaml:"db"`
}

// TenantConfig holds tenant-specific configuration
type TenantConfig struct {
	MultiTenant bool `yaml:"multi_tenant"`
}

// BillingConfig holds billing configuration
type BillingConfig struct {
	Provider            string `yaml:"provider"` // "stripe" or "gerencianet" 
	Enabled             bool   `yaml:"enabled"`
	StripeAPIKey        string `yaml:"stripe_api_key"`
	StripeWebhookKey    string `yaml:"stripe_webhook_key"`
	GerencianetClientID string `yaml:"gerencianet_client_id"`
	GerencianetSecret   string `yaml:"gerencianet_secret"`
	WebhookEndpoint     string `yaml:"webhook_endpoint"`
	SuccessURL          string `yaml:"success_url"`
	CancelURL           string `yaml:"cancel_url"`
}

// OrchestrationConfig holds orchestration configuration
type OrchestrationConfig struct {
	Enabled    bool   `yaml:"enabled"`
	KubeConfig string `yaml:"kubeconfig"`
}

type AuthConfig struct {
	Enabled         bool          `yaml:"enabled"`
	JWTSecret       string        `yaml:"jwt_secret"`
	JWTIssuer       string        `yaml:"jwt_issuer"`
	JWTAudience     string        `yaml:"jwt_audience"`
	TokenValidity   time.Duration `yaml:"token_validity"`
	OIDCEnabled     bool          `yaml:"oidc_enabled"`
	OIDCIssuerURL   string        `yaml:"oidc_issuer_url"`
	OIDCClientID    string        `yaml:"oidc_client_id"`
	OIDCRedirectURI string        `yaml:"oidc_redirect_uri"`
	OIDC            OIDCConfig    `yaml:"oidc"`
}

// OIDCConfig holds OIDC-specific configuration
type OIDCConfig struct {
	Enabled     bool   `yaml:"enabled"`
	IssuerURL   string `yaml:"issuer_url"`
	ClientID    string `yaml:"client_id"`
	RedirectURI string `yaml:"redirect_uri"`
}

type Tenant struct {
	ID          string   `yaml:"id"`
	Name        string   `yaml:"name"`
	Description string   `yaml:"description"`
	Enabled     bool     `yaml:"enabled"`
	Policies     []string `yaml:"policies"`
}

func Load(path string) (*Config, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}

	var cfg Config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		return nil, err
	}

	// Set defaults
	if cfg.Global.BindAddress == "" {
		cfg.Global.BindAddress = "0.0.0.0:80"
	}
	if cfg.Global.TLSBindAddress == "" {
		cfg.Global.TLSBindAddress = "0.0.0.0:443"
	}
	if cfg.Global.MetricsAddress == "" {
		cfg.Global.MetricsAddress = "0.0.0.0:8080"
	}
	if cfg.Global.HealthCheck.Interval == 0 {
		cfg.Global.HealthCheck.Interval = 30 * time.Second
	}
	if cfg.Global.HealthCheck.Timeout == 0 {
		cfg.Global.HealthCheck.Timeout = 5 * time.Second
	}
	if cfg.Global.HealthCheck.Retries == 0 {
		cfg.Global.HealthCheck.Retries = 3
	}

	if cfg.Global.WAF.RulesetPath == "" {
		cfg.Global.WAF.Enabled = false
	}

	// Set cluster defaults
	if cfg.Cluster.HeartbeatInterval == 0 {
		cfg.Cluster.HeartbeatInterval = 5 * time.Second
	}
	if cfg.Cluster.LeaderTimeout == 0 {
		cfg.Cluster.LeaderTimeout = 15 * time.Second
	}

	return &cfg, nil
}
