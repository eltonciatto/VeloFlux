package config

import (
	"os"
	"time"

	"gopkg.in/yaml.v3"
)

type Config struct {
	Global  GlobalConfig  `yaml:"global"`
	Pools   []Pool        `yaml:"pools"`
	Routes  []Route       `yaml:"routes"`
	Cluster ClusterConfig `yaml:"cluster"` // Added cluster config
}

type GlobalConfig struct {
	BindAddress    string          `yaml:"bind_address"`
	TLSBindAddress string          `yaml:"tls_bind_address"`
	MetricsAddress string          `yaml:"metrics_address"`
	TLS            TLSConfig       `yaml:"tls"`
	HealthCheck    HealthConfig    `yaml:"health_check"`
	RateLimit      RateLimitConfig `yaml:"rate_limit"`
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

	// Set cluster defaults
	if cfg.Cluster.HeartbeatInterval == 0 {
		cfg.Cluster.HeartbeatInterval = 5 * time.Second
	}
	if cfg.Cluster.LeaderTimeout == 0 {
		cfg.Cluster.LeaderTimeout = 15 * time.Second
	}

	return &cfg, nil
}
