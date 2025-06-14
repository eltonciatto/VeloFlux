package monitoring

import (
	"context"
	"fmt"
	"sync"
	"time"

	"github.com/prometheus/client_golang/prometheus"
	"go.uber.org/zap"
)

type AlertManager struct {
	logger   *zap.Logger
	config   *AlertConfig
	channels map[string]AlertChannel
	rules    []*AlertRule
	mu       sync.RWMutex
}

type AlertConfig struct {
	Enabled       bool                          `yaml:"enabled"`
	CheckInterval time.Duration                 `yaml:"check_interval"`
	Channels      map[string]AlertChannelConfig `yaml:"channels"`
	Rules         []*AlertRuleConfig            `yaml:"rules"`
}

type AlertChannelConfig struct {
	Type   string                 `yaml:"type"` // slack, email, webhook, pagerduty
	Config map[string]interface{} `yaml:"config"`
}

type AlertRuleConfig struct {
	Name        string            `yaml:"name"`
	Description string            `yaml:"description"`
	Query       string            `yaml:"query"`
	Threshold   float64           `yaml:"threshold"`
	Operator    string            `yaml:"operator"` // >, <, >=, <=, ==, !=
	Duration    time.Duration     `yaml:"duration"`
	Severity    string            `yaml:"severity"` // critical, warning, info
	Labels      map[string]string `yaml:"labels"`
	Channels    []string          `yaml:"channels"`
}

type Alert struct {
	ID          string            `json:"id"`
	Name        string            `json:"name"`
	Description string            `json:"description"`
	Severity    string            `json:"severity"`
	Labels      map[string]string `json:"labels"`
	StartsAt    time.Time         `json:"starts_at"`
	EndsAt      *time.Time        `json:"ends_at,omitempty"`
	Value       float64           `json:"value"`
	Threshold   float64           `json:"threshold"`
	Status      string            `json:"status"` // firing, resolved
}

type AlertRule struct {
	config    *AlertRuleConfig
	lastFired *time.Time
	active    bool
}

type AlertChannel interface {
	Send(ctx context.Context, alert *Alert) error
	Name() string
}

// Prometheus metrics for monitoring
var (
	alertsTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "veloflux_alerts_total",
			Help: "Total number of alerts fired",
		},
		[]string{"rule", "severity"},
	)

	alertsActive = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Name: "veloflux_alerts_active",
			Help: "Number of active alerts",
		},
		[]string{"rule", "severity"},
	)

	monitoringErrors = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Name: "veloflux_monitoring_errors_total",
			Help: "Total number of monitoring errors",
		},
		[]string{"type"},
	)
)

func init() {
	prometheus.MustRegister(alertsTotal)
	prometheus.MustRegister(alertsActive)
	prometheus.MustRegister(monitoringErrors)
}

func NewAlertManager(config *AlertConfig, logger *zap.Logger) *AlertManager {
	am := &AlertManager{
		logger:   logger.Named("alerts"),
		config:   config,
		channels: make(map[string]AlertChannel),
		rules:    make([]*AlertRule, 0),
	}

	// Initialize alert channels
	for name, channelConfig := range config.Channels {
		channel, err := createAlertChannel(name, channelConfig)
		if err != nil {
			logger.Error("Failed to create alert channel",
				zap.String("channel", name),
				zap.Error(err))
			continue
		}
		am.channels[name] = channel
	}

	// Initialize alert rules
	for _, ruleConfig := range config.Rules {
		rule := &AlertRule{
			config: ruleConfig,
			active: false,
		}
		am.rules = append(am.rules, rule)
	}

	return am
}

func (am *AlertManager) Start() error {
	if !am.config.Enabled {
		am.logger.Info("Alert manager is disabled")
		return nil
	}

	ticker := time.NewTicker(am.config.CheckInterval)

	go func() {
		for range ticker.C {
			am.checkRules()
		}
	}()

	am.logger.Info("Alert manager started",
		zap.Duration("check_interval", am.config.CheckInterval),
		zap.Int("rules_count", len(am.rules)),
		zap.Int("channels_count", len(am.channels)))

	return nil
}

func (am *AlertManager) checkRules() {
	ctx := context.Background()

	for _, rule := range am.rules {
		value, err := am.evaluateRule(rule)
		if err != nil {
			am.logger.Error("Failed to evaluate rule",
				zap.String("rule", rule.config.Name),
				zap.Error(err))
			monitoringErrors.WithLabelValues("rule_evaluation").Inc()
			continue
		}

		shouldFire := am.evaluateThreshold(value, rule.config.Threshold, rule.config.Operator)

		if shouldFire && !rule.active {
			// Rule started firing
			alert := am.createAlert(rule, value)
			am.fireAlert(ctx, alert, rule)
			rule.active = true
			rule.lastFired = &alert.StartsAt

			alertsTotal.WithLabelValues(rule.config.Name, rule.config.Severity).Inc()
			alertsActive.WithLabelValues(rule.config.Name, rule.config.Severity).Inc()

		} else if !shouldFire && rule.active {
			// Rule resolved
			alert := am.createResolvedAlert(rule, value)
			am.resolveAlert(ctx, alert, rule)
			rule.active = false

			alertsActive.WithLabelValues(rule.config.Name, rule.config.Severity).Dec()
		}
	}
}

func (am *AlertManager) fireAlert(ctx context.Context, alert *Alert, rule *AlertRule) {
	am.logger.Warn("Alert fired",
		zap.String("rule", rule.config.Name),
		zap.String("severity", rule.config.Severity),
		zap.Float64("value", alert.Value),
		zap.Float64("threshold", alert.Threshold))

	// Send to configured channels
	for _, channelName := range rule.config.Channels {
		channel, exists := am.channels[channelName]
		if !exists {
			am.logger.Error("Alert channel not found", zap.String("channel", channelName))
			continue
		}

		if err := channel.Send(ctx, alert); err != nil {
			am.logger.Error("Failed to send alert",
				zap.String("channel", channelName),
				zap.String("rule", rule.config.Name),
				zap.Error(err))
			monitoringErrors.WithLabelValues("alert_send").Inc()
		}
	}
}

func (am *AlertManager) resolveAlert(ctx context.Context, alert *Alert, rule *AlertRule) {
	am.logger.Info("Alert resolved",
		zap.String("rule", rule.config.Name),
		zap.Float64("value", alert.Value))

	// Send resolution notification to channels
	for _, channelName := range rule.config.Channels {
		channel, exists := am.channels[channelName]
		if !exists {
			continue
		}

		if err := channel.Send(ctx, alert); err != nil {
			am.logger.Error("Failed to send alert resolution",
				zap.String("channel", channelName),
				zap.String("rule", rule.config.Name),
				zap.Error(err))
		}
	}
}

func (am *AlertManager) evaluateRule(rule *AlertRule) (float64, error) {
	// This would integrate with Prometheus or other metric sources
	// For now, we'll implement basic metric evaluation

	switch rule.config.Query {
	case "backend_health":
		return am.getBackendHealthMetric(), nil
	case "error_rate":
		return am.getErrorRateMetric(), nil
	case "response_time":
		return am.getResponseTimeMetric(), nil
	case "memory_usage":
		return am.getMemoryUsageMetric(), nil
	case "cpu_usage":
		return am.getCPUUsageMetric(), nil
	case "active_connections":
		return am.getActiveConnectionsMetric(), nil
	default:
		return 0, fmt.Errorf("unknown query: %s", rule.config.Query)
	}
}

func (am *AlertManager) evaluateThreshold(value, threshold float64, operator string) bool {
	switch operator {
	case ">":
		return value > threshold
	case "<":
		return value < threshold
	case ">=":
		return value >= threshold
	case "<=":
		return value <= threshold
	case "==":
		return value == threshold
	case "!=":
		return value != threshold
	default:
		return false
	}
}

func (am *AlertManager) createAlert(rule *AlertRule, value float64) *Alert {
	return &Alert{
		ID:          fmt.Sprintf("%s-%d", rule.config.Name, time.Now().Unix()),
		Name:        rule.config.Name,
		Description: rule.config.Description,
		Severity:    rule.config.Severity,
		Labels:      rule.config.Labels,
		StartsAt:    time.Now(),
		Value:       value,
		Threshold:   rule.config.Threshold,
		Status:      "firing",
	}
}

func (am *AlertManager) createResolvedAlert(rule *AlertRule, value float64) *Alert {
	now := time.Now()
	return &Alert{
		ID:          fmt.Sprintf("%s-%d", rule.config.Name, now.Unix()),
		Name:        rule.config.Name,
		Description: rule.config.Description,
		Severity:    rule.config.Severity,
		Labels:      rule.config.Labels,
		StartsAt:    *rule.lastFired,
		EndsAt:      &now,
		Value:       value,
		Threshold:   rule.config.Threshold,
		Status:      "resolved",
	}
}

// Metric collection functions (simplified implementations)
func (am *AlertManager) getBackendHealthMetric() float64 {
	// Return percentage of healthy backends
	return 95.0 // Placeholder
}

func (am *AlertManager) getErrorRateMetric() float64 {
	// Return error rate percentage
	return 2.5 // Placeholder
}

func (am *AlertManager) getResponseTimeMetric() float64 {
	// Return average response time in milliseconds
	return 150.0 // Placeholder
}

func (am *AlertManager) getMemoryUsageMetric() float64 {
	// Return memory usage percentage
	return 75.0 // Placeholder
}

func (am *AlertManager) getCPUUsageMetric() float64 {
	// Return CPU usage percentage
	return 60.0 // Placeholder
}

func (am *AlertManager) getActiveConnectionsMetric() float64 {
	// Return number of active connections
	return 1250.0 // Placeholder
}

func createAlertChannel(name string, config AlertChannelConfig) (AlertChannel, error) {
	switch config.Type {
	case "slack":
		return NewSlackChannel(name, config.Config)
	case "email":
		return NewEmailChannel(name, config.Config)
	case "webhook":
		return NewWebhookChannel(name, config.Config)
	case "pagerduty":
		return NewPagerDutyChannel(name, config.Config)
	default:
		return nil, fmt.Errorf("unknown alert channel type: %s", config.Type)
	}
}

// SlackChannel implements AlertChannel for Slack notifications
type SlackChannel struct {
	name       string
	webhookURL string
}

// NewSlackChannel creates a new Slack alert channel
func NewSlackChannel(name string, config map[string]interface{}) (*SlackChannel, error) {
	webhookURL, ok := config["webhook_url"].(string)
	if !ok || webhookURL == "" {
		return nil, fmt.Errorf("slack channel configuration missing webhook_url")
	}

	return &SlackChannel{
		name:       name,
		webhookURL: webhookURL,
	}, nil
}

// Send implements AlertChannel
func (c *SlackChannel) Send(ctx context.Context, alert *Alert) error {
	// In a real implementation, this would send a message to Slack
	// For now, just log it
	// TODO: Implement actual Slack API integration
	return nil
}

// Name implements AlertChannel
func (c *SlackChannel) Name() string {
	return c.name
}

// EmailChannel implements AlertChannel for email notifications
type EmailChannel struct {
	name string
	to   []string
}

// NewEmailChannel creates a new Email alert channel
func NewEmailChannel(name string, config map[string]interface{}) (*EmailChannel, error) {
	recipients, ok := config["to"].([]interface{})
	if !ok || len(recipients) == 0 {
		return nil, fmt.Errorf("email channel configuration missing recipients")
	}

	to := make([]string, 0, len(recipients))
	for _, r := range recipients {
		if s, ok := r.(string); ok {
			to = append(to, s)
		}
	}

	return &EmailChannel{
		name: name,
		to:   to,
	}, nil
}

// Send implements AlertChannel
func (c *EmailChannel) Send(ctx context.Context, alert *Alert) error {
	// In a real implementation, this would send an email
	// TODO: Implement actual email sending
	return nil
}

// Name implements AlertChannel
func (c *EmailChannel) Name() string {
	return c.name
}

// WebhookChannel implements AlertChannel for webhook notifications
type WebhookChannel struct {
	name string
	url  string
}

// NewWebhookChannel creates a new Webhook alert channel
func NewWebhookChannel(name string, config map[string]interface{}) (*WebhookChannel, error) {
	url, ok := config["url"].(string)
	if !ok || url == "" {
		return nil, fmt.Errorf("webhook channel configuration missing url")
	}

	return &WebhookChannel{
		name: name,
		url:  url,
	}, nil
}

// Send implements AlertChannel
func (c *WebhookChannel) Send(ctx context.Context, alert *Alert) error {
	// In a real implementation, this would send a POST request to the webhook URL
	// TODO: Implement actual webhook calling
	return nil
}

// Name implements AlertChannel
func (c *WebhookChannel) Name() string {
	return c.name
}

// PagerDutyChannel implements AlertChannel for PagerDuty notifications
type PagerDutyChannel struct {
	name           string
	integrationKey string
}

// NewPagerDutyChannel creates a new PagerDuty alert channel
func NewPagerDutyChannel(name string, config map[string]interface{}) (*PagerDutyChannel, error) {
	key, ok := config["integration_key"].(string)
	if !ok || key == "" {
		return nil, fmt.Errorf("pagerduty channel configuration missing integration_key")
	}

	return &PagerDutyChannel{
		name:           name,
		integrationKey: key,
	}, nil
}

// Send implements AlertChannel
func (c *PagerDutyChannel) Send(ctx context.Context, alert *Alert) error {
	// In a real implementation, this would trigger a PagerDuty incident
	// TODO: Implement actual PagerDuty integration
	return nil
}

// Name implements AlertChannel
func (c *PagerDutyChannel) Name() string {
	return c.name
}
