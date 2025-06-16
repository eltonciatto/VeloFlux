package config

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestLoadConfig(t *testing.T) {
	// Create a temporary config file
	configContent := `
global:
  bind_address: ":8080"
  metrics_address: ":9090"
  health_check:
    interval: 30s
    timeout: 10s

pools:
  - name: "web-pool"
    algorithm: "round_robin"
    backends:
      - address: "192.168.1.10:8080"
        weight: 100
      - address: "192.168.1.11:8080"
        weight: 100

routes:
  - host: "example.com"
    pool: "web-pool"
    path_prefix: "/"

redis:
  address: "localhost:6379"
  password: ""
  db: 0

cluster:
  enabled: false
  node_id: "node1"

auth:
  enabled: false

tenant:
  multi_tenant: false

billing:
  enabled: false

orchestration:
  enabled: false

api:
  bind_address: ":8081"
  auth_enabled: false
`

	tmpfile, err := os.CreateTemp("", "config_test_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(configContent))
	require.NoError(t, err)
	tmpfile.Close()

	// Test loading the config
	config, err := Load(tmpfile.Name())
	require.NoError(t, err)
	assert.NotNil(t, config)

	// Verify global config
	assert.Equal(t, ":8080", config.Global.BindAddress)
	assert.Equal(t, ":9090", config.Global.MetricsAddress)
	assert.Equal(t, 30*time.Second, config.Global.HealthCheck.Interval)
	assert.Equal(t, 10*time.Second, config.Global.HealthCheck.Timeout)

	// Verify pools
	require.Len(t, config.Pools, 1)
	pool := config.Pools[0]
	assert.Equal(t, "web-pool", pool.Name)
	assert.Equal(t, "round_robin", pool.Algorithm)
	require.Len(t, pool.Backends, 2)
	assert.Equal(t, "192.168.1.10:8080", pool.Backends[0].Address)
	assert.Equal(t, 100, pool.Backends[0].Weight)

	// Verify routes
	require.Len(t, config.Routes, 1)
	route := config.Routes[0]
	assert.Equal(t, "example.com", route.Host)
	assert.Equal(t, "web-pool", route.Pool)
	assert.Equal(t, "/", route.PathPrefix)

	// Verify Redis config
	assert.Equal(t, "localhost:6379", config.Redis.Address)
	assert.Equal(t, "", config.Redis.Password)
	assert.Equal(t, 0, config.Redis.DB)

	// Verify other configs
	assert.False(t, config.Cluster.Enabled)
	assert.Equal(t, "node1", config.Cluster.NodeID)
	assert.False(t, config.Auth.Enabled)
	assert.False(t, config.Tenant.MultiTenant)
	assert.False(t, config.Billing.Enabled)
	assert.False(t, config.Orchestration.Enabled)
	assert.Equal(t, ":8081", config.API.BindAddress)
	assert.False(t, config.API.AuthEnabled)
}

func TestLoadConfigFileNotFound(t *testing.T) {
	_, err := Load("nonexistent_file.yaml")
	assert.Error(t, err)
}

func TestLoadConfigInvalidYAML(t *testing.T) {
	invalidContent := `
global:
  bind_address: ":8080"
  invalid_yaml: [unclosed array
`

	tmpfile, err := os.CreateTemp("", "config_invalid_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(invalidContent))
	require.NoError(t, err)
	tmpfile.Close()

	_, err = Load(tmpfile.Name())
	assert.Error(t, err)
}

func TestConfigDefaults(t *testing.T) {
	// Test with minimal config
	minimalConfig := `
global:
  bind_address: ":8080"
`

	tmpfile, err := os.CreateTemp("", "config_minimal_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(minimalConfig))
	require.NoError(t, err)
	tmpfile.Close()

	config, err := Load(tmpfile.Name())
	require.NoError(t, err)

	// Verify defaults are applied
	assert.Equal(t, ":8080", config.Global.BindAddress)
	assert.Empty(t, config.Pools)
	assert.Empty(t, config.Routes)
}

func TestTLSConfig(t *testing.T) {
	configContent := `
global:
  bind_address: ":8080"
  tls_bind_address: ":8443"
  tls:
    auto_cert: true
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs"
`

	tmpfile, err := os.CreateTemp("", "config_tls_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(configContent))
	require.NoError(t, err)
	tmpfile.Close()

	config, err := Load(tmpfile.Name())
	require.NoError(t, err)

	assert.Equal(t, ":8443", config.Global.TLSBindAddress)
	assert.True(t, config.Global.TLS.AutoCert)
	assert.Equal(t, "admin@example.com", config.Global.TLS.ACMEEmail)
	assert.Equal(t, "/etc/ssl/certs", config.Global.TLS.CertDir)
}

func TestRateLimitConfig(t *testing.T) {
	configContent := `
global:
  bind_address: ":8080"
  rate_limit:
    requests_per_second: 100
    burst_size: 50
    cleanup_interval: 60s
`

	tmpfile, err := os.CreateTemp("", "config_ratelimit_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(configContent))
	require.NoError(t, err)
	tmpfile.Close()

	config, err := Load(tmpfile.Name())
	require.NoError(t, err)

	assert.Equal(t, 100, config.Global.RateLimit.RequestsPerSecond)
	assert.Equal(t, 50, config.Global.RateLimit.BurstSize)
	assert.Equal(t, 60*time.Second, config.Global.RateLimit.CleanupInterval)
}

func TestWAFConfig(t *testing.T) {
	configContent := `
global:
  bind_address: ":8080"
  waf:
    enabled: true
    level: "blocking"
    ruleset_path: "/etc/waf/rules.conf"
`

	tmpfile, err := os.CreateTemp("", "config_waf_*.yaml")
	require.NoError(t, err)
	defer os.Remove(tmpfile.Name())

	_, err = tmpfile.Write([]byte(configContent))
	require.NoError(t, err)
	tmpfile.Close()

	config, err := Load(tmpfile.Name())
	require.NoError(t, err)

	assert.True(t, config.Global.WAF.Enabled)
	assert.Equal(t, "blocking", config.Global.WAF.Level)
	assert.Equal(t, "/etc/waf/rules.conf", config.Global.WAF.RulesetPath)
}
