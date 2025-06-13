package orchestration

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"sync"
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
	"github.com/go-redis/redis/v8"
	"go.uber.org/zap"
	appsv1 "k8s.io/api/apps/v1"
	v1 "k8s.io/api/core/v1"
	netv1 "k8s.io/api/networking/v1"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
)

// OrchestrationMode represents the orchestration mode for a tenant
type OrchestrationMode string

const (
	// SharedMode means the tenant shares the VeloFlux instance with others
	SharedMode OrchestrationMode = "shared"
	
	// DedicatedMode means the tenant has a dedicated VeloFlux instance
	DedicatedMode OrchestrationMode = "dedicated"
)

// OrchestrationConfig holds configuration for Kubernetes integration
type OrchestrationConfig struct {
	Enabled          bool   `yaml:"enabled"`
	KubeConfigPath   string `yaml:"kube_config_path"`
	InCluster        bool   `yaml:"in_cluster"`
	Namespace        string `yaml:"namespace"`
	HelmReleaseName  string `yaml:"helm_release_name"`
	ChartPath        string `yaml:"chart_path"`
	ChartVersion     string `yaml:"chart_version"`
	ValuesPath       string `yaml:"values_path"`
	ServiceAccountName string `yaml:"service_account_name"`
}

// TenantOrchestratorConfig holds orchestration configuration for a tenant
type TenantOrchestratorConfig struct {
	TenantID             string            `json:"tenant_id"`
	Mode                 OrchestrationMode `json:"mode"`
	DedicatedNamespace   string            `json:"dedicated_namespace,omitempty"`
	ResourceLimits       ResourceLimits    `json:"resource_limits"`
	AutoscalingEnabled   bool              `json:"autoscaling_enabled"`
	MinReplicas          int               `json:"min_replicas"`
	MaxReplicas          int               `json:"max_replicas"`
	TargetCPUUtilization int               `json:"target_cpu_utilization"`
	CustomDomains        []string          `json:"custom_domains"`
}

// ResourceLimits defines resource limits for a tenant
type ResourceLimits struct {
	CPURequest    string `json:"cpu_request"`
	CPULimit      string `json:"cpu_limit"`
	MemoryRequest string `json:"memory_request"`
	MemoryLimit   string `json:"memory_limit"`
}

// DeploymentStatus represents the status of a tenant's deployment
type DeploymentStatus struct {
	TenantID       string    `json:"tenant_id"`
	Mode           OrchestrationMode `json:"mode"`
	Status         string    `json:"status"` // "deploying", "ready", "error", "scaling", "updating"
	Namespace      string    `json:"namespace"`
	Version        string    `json:"version"`
	Replicas       int       `json:"replicas"`
	ReadyReplicas  int       `json:"ready_replicas"`
	Message        string    `json:"message,omitempty"`
	LastUpdated    time.Time `json:"last_updated"`
}

// Orchestrator handles Kubernetes orchestration
type Orchestrator struct {
	config        *OrchestrationConfig
	client        *redis.Client
	logger        *zap.Logger
	tenantManager *tenant.Manager
	kubeClient    *kubernetes.Clientset
	tenantConfigs map[string]*TenantOrchestratorConfig
	configMu      sync.RWMutex
}

// NewOrchestrator creates a new orchestrator
func NewOrchestrator(config *OrchestrationConfig, client *redis.Client, tenantManager *tenant.Manager, logger *zap.Logger) (*Orchestrator, error) {
	orchestrator := &Orchestrator{
		config:        config,
		client:        client,
		logger:        logger.Named("orchestration"),
		tenantManager: tenantManager,
		tenantConfigs: make(map[string]*TenantOrchestratorConfig),
	}
	
	// Initialize Kubernetes client if enabled
	if config.Enabled {
		var err error
		var kubeConfig *rest.Config
		
		if config.InCluster {
			// Use in-cluster config
			kubeConfig, err = rest.InClusterConfig()
		} else {
			// Use kubeconfig file
			kubeConfig, err = clientcmd.BuildConfigFromFlags("", config.KubeConfigPath)
		}
		
		if err != nil {
			return nil, fmt.Errorf("failed to create Kubernetes config: %w", err)
		}
		
		kubeClient, err := kubernetes.NewForConfig(kubeConfig)
		if err != nil {
			return nil, fmt.Errorf("failed to create Kubernetes client: %w", err)
		}
		
		orchestrator.kubeClient = kubeClient
		
		// Start background tasks
		go orchestrator.watchDeployments()
	}
	
	return orchestrator, nil
}

// GetTenantConfig gets orchestration configuration for a tenant
func (o *Orchestrator) GetTenantConfig(ctx context.Context, tenantID string) (*TenantOrchestratorConfig, error) {
	// Check cache first
	o.configMu.RLock()
	config, exists := o.tenantConfigs[tenantID]
	o.configMu.RUnlock()
	
	if exists {
		return config, nil
	}
	
	// Get from Redis
	data, err := o.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:orchestration", tenantID)).Bytes()
	if err != nil {
		if err == redis.Nil {
			// Return default config
			return &TenantOrchestratorConfig{
				TenantID:           tenantID,
				Mode:               SharedMode,
				ResourceLimits:     ResourceLimits{
					CPURequest:    "100m",
					CPULimit:      "200m",
					MemoryRequest: "128Mi",
					MemoryLimit:   "256Mi",
				},
				AutoscalingEnabled: false,
				MinReplicas:        1,
				MaxReplicas:        3,
			}, nil
		}
		return nil, err
	}
		var configData TenantOrchestratorConfig
	if err := json.Unmarshal(data, &configData); err != nil {
		return nil, err
	}
	
	// Update cache
	o.configMu.Lock()
	o.tenantConfigs[tenantID] = &configData
	o.configMu.Unlock()
	
	return &configData, nil
}

// SetTenantConfig sets orchestration configuration for a tenant
func (o *Orchestrator) SetTenantConfig(ctx context.Context, config *TenantOrchestratorConfig) error {
	if config.TenantID == "" {
		return errors.New("tenant ID is required")
	}
	
	// Get current config
	currentConfig, err := o.GetTenantConfig(ctx, config.TenantID)
	if err != nil && !strings.Contains(err.Error(), "tenant orchestration not found") {
		return err
	}
	
	// Check if mode is changing
	modeChanged := currentConfig != nil && currentConfig.Mode != config.Mode
	
	// Save to Redis
	data, err := json.Marshal(config)
	if err != nil {
		return err
	}
	
	if err := o.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:orchestration", config.TenantID), data, 0).Err(); err != nil {
		return err
	}
	
	// Update cache
	o.configMu.Lock()
	o.tenantConfigs[config.TenantID] = config
	o.configMu.Unlock()
	
	// If mode changed, handle deployment changes
	if modeChanged {
		if config.Mode == DedicatedMode {
			// Scale down shared instance's handling of this tenant (if needed)
			
			// Create dedicated instance
			err := o.createDedicatedInstance(ctx, config.TenantID)
			if err != nil {
				o.logger.Error("Failed to create dedicated instance", 
					zap.String("tenant_id", config.TenantID), 
					zap.Error(err))
				return err
			}
		} else {
			// Remove dedicated instance
			err := o.removeDedicatedInstance(ctx, config.TenantID)
			if err != nil {
				o.logger.Error("Failed to remove dedicated instance", 
					zap.String("tenant_id", config.TenantID), 
					zap.Error(err))
				return err
			}
		}
	} else if config.Mode == DedicatedMode {
		// Update dedicated instance
		err := o.updateDedicatedInstance(ctx, config.TenantID)
		if err != nil {
			o.logger.Error("Failed to update dedicated instance", 
				zap.String("tenant_id", config.TenantID), 
				zap.Error(err))
			return err
		}
	}
	
	return nil
}

// Observação: GetDeploymentStatus está implementado no arquivo kubernetes.go
// para evitar duplicação de código.
					TenantID:      tenantID,
					Mode:          SharedMode,
					Status:        "ready",
					Namespace:     o.config.Namespace,
					Version:       "shared",
					LastUpdated:   time.Now(),
				}, nil
			}
			
			return &DeploymentStatus{
				TenantID:     tenantID,
				Mode:         config.Mode,
				Status:       "unknown",
				LastUpdated:  time.Now(),
			}, nil
		}
		return nil, err
	}
	
	var status DeploymentStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, err
	}
	
	return &status, nil
}

// updateDeploymentStatus updates deployment status for a tenant
func (o *Orchestrator) updateDeploymentStatus(ctx context.Context, status *DeploymentStatus) error {
	status.LastUpdated = time.Now()
	
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}
	
	return o.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:deployment_status", status.TenantID), data, 0).Err()
}

// CreateTenantNamespace creates a dedicated namespace for a tenant
func (o *Orchestrator) createTenantNamespace(tenantID string) error {
	if !o.config.Enabled {
		return errors.New("kubernetes orchestration is not enabled")
	}
	
	// Generate namespace name
	namespace := fmt.Sprintf("veloflux-%s", tenantID)
	
	// Check if namespace already exists
	_, err := o.kubeClient.CoreV1().Namespaces().Get(context.Background(), namespace, metav1.GetOptions{})
	if err == nil {
		// Namespace already exists
		return nil
	}
	
	// Create namespace
	ns := &v1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
			Labels: map[string]string{
				"veloflux/tenant": tenantID,
				"veloflux/managed": "true",
			},
		},
	}
	
	_, err = o.kubeClient.CoreV1().Namespaces().Create(context.Background(), ns, metav1.CreateOptions{})
	if err != nil {
		return fmt.Errorf("failed to create namespace: %w", err)
	}
	
	o.logger.Info("Created namespace for tenant", 
		zap.String("tenant_id", tenantID), 
		zap.String("namespace", namespace))
	
	return nil
}

// createDedicatedInstance creates a dedicated VeloFlux instance for a tenant
func (o *Orchestrator) createDedicatedInstance(ctx context.Context, tenantID string) error {
	if !o.config.Enabled {
		return errors.New("kubernetes orchestration is not enabled")
	}
	
	// Get orchestration config for tenant
	config, err := o.GetTenantConfig(ctx, tenantID)
	if err != nil {
		return err
	}
	
	// Get tenant details
	tenant, err := o.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return err
	}
	
	// Create namespace if it doesn't exist
	namespace := config.DedicatedNamespace
	if namespace == "" {
		namespace = fmt.Sprintf("veloflux-%s", tenantID)
		config.DedicatedNamespace = namespace
		
		// Update config with namespace
		if err := o.SetTenantConfig(ctx, config); err != nil {
			return err
		}
	}
	
	// Create namespace
	if err := o.createTenantNamespace(tenantID); err != nil {
		return err
	}
	
	// Update deployment status
	status := &DeploymentStatus{
		TenantID:   tenantID,
		Mode:       DedicatedMode,
		Status:     "deploying",
		Namespace:  namespace,
		Message:    "Creating dedicated instance",
		LastUpdated: time.Now(),
	}
	
	if err := o.updateDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
	}
	
	// Create ConfigMap for tenant configuration
	configMap := &v1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-config-%s", tenantID),
			Namespace: namespace,
			Labels: map[string]string{
				"veloflux/tenant": tenantID,
				"veloflux/managed": "true",
			},
		},
		Data: map[string]string{
			"config.yaml": fmt.Sprintf(`tenant_id: %s
tenant_mode: dedicated
redis:
  address: %s
  password: %s
  db: 0
`, tenantID, o.getRedisAddress(ctx), o.getRedisPassword(ctx)),
		},
	}
	
	_, err = o.kubeClient.CoreV1().ConfigMaps(namespace).Create(context.Background(), configMap, metav1.CreateOptions{})
	if err != nil {
		o.logger.Error("Failed to create ConfigMap", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
		return fmt.Errorf("failed to create ConfigMap: %w", err)
	}
	
	// Create Deployment
	deployment := o.createDeploymentObject(tenantID, namespace, config)
	_, err = o.kubeClient.AppsV1().Deployments(namespace).Create(context.Background(), deployment, metav1.CreateOptions{})
	if err != nil {
		o.logger.Error("Failed to create Deployment", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
		return fmt.Errorf("failed to create Deployment: %w", err)
	}
	
	// Create Service
	service := o.createServiceObject(tenantID, namespace)
	_, err = o.kubeClient.CoreV1().Services(namespace).Create(context.Background(), service, metav1.CreateOptions{})
	if err != nil {
		o.logger.Error("Failed to create Service", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
		return fmt.Errorf("failed to create Service: %w", err)
	}
	
	// Create Ingress if custom domains are configured
	if len(config.CustomDomains) > 0 {
		ingress := o.createIngressObject(tenantID, namespace, config.CustomDomains)
		_, err = o.kubeClient.NetworkingV1().Ingresses(namespace).Create(context.Background(), ingress, metav1.CreateOptions{})
		if err != nil {
			o.logger.Error("Failed to create Ingress", 
				zap.String("tenant_id", tenantID), 
				zap.Error(err))
			return fmt.Errorf("failed to create Ingress: %w", err)
		}
	}
	
	o.logger.Info("Created dedicated instance for tenant", 
		zap.String("tenant_id", tenantID), 
		zap.String("namespace", namespace))
	
	return nil
}

// updateDedicatedInstance updates a dedicated VeloFlux instance for a tenant
func (o *Orchestrator) updateDedicatedInstance(ctx context.Context, tenantID string) error {
	if !o.config.Enabled {
		return errors.New("kubernetes orchestration is not enabled")
	}
	
	// Get orchestration config for tenant
	config, err := o.GetTenantConfig(ctx, tenantID)
	if err != nil {
		return err
	}
	
	if config.Mode != DedicatedMode {
		return errors.New("tenant is not in dedicated mode")
	}
	
	namespace := config.DedicatedNamespace
	if namespace == "" {
		return errors.New("dedicated namespace not configured for tenant")
	}
	
	// Update deployment status
	status := &DeploymentStatus{
		TenantID:   tenantID,
		Mode:       DedicatedMode,
		Status:     "updating",
		Namespace:  namespace,
		Message:    "Updating dedicated instance",
		LastUpdated: time.Now(),
	}
	
	if err := o.updateDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
	}
	
	// Update Deployment
	deployment := o.createDeploymentObject(tenantID, namespace, config)
	_, err = o.kubeClient.AppsV1().Deployments(namespace).Update(context.Background(), deployment, metav1.UpdateOptions{})
	if err != nil {
		o.logger.Error("Failed to update Deployment", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
		return fmt.Errorf("failed to update Deployment: %w", err)
	}
	
	// Update Ingress if custom domains are configured
	if len(config.CustomDomains) > 0 {
		// Check if Ingress exists
		_, err := o.kubeClient.NetworkingV1().Ingresses(namespace).Get(context.Background(), fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
		if err != nil {
			// Create Ingress
			ingress := o.createIngressObject(tenantID, namespace, config.CustomDomains)
			_, err = o.kubeClient.NetworkingV1().Ingresses(namespace).Create(context.Background(), ingress, metav1.CreateOptions{})
			if err != nil {
				o.logger.Error("Failed to create Ingress", 
					zap.String("tenant_id", tenantID), 
					zap.Error(err))
				return fmt.Errorf("failed to create Ingress: %w", err)
			}
		} else {
			// Update Ingress
			ingress := o.createIngressObject(tenantID, namespace, config.CustomDomains)
			_, err = o.kubeClient.NetworkingV1().Ingresses(namespace).Update(context.Background(), ingress, metav1.UpdateOptions{})
			if err != nil {
				o.logger.Error("Failed to update Ingress", 
					zap.String("tenant_id", tenantID), 
					zap.Error(err))
				return fmt.Errorf("failed to update Ingress: %w", err)
			}
		}
	}
	
	o.logger.Info("Updated dedicated instance for tenant", 
		zap.String("tenant_id", tenantID), 
		zap.String("namespace", namespace))
	
	return nil
}

// removeDedicatedInstance removes a dedicated VeloFlux instance for a tenant
func (o *Orchestrator) removeDedicatedInstance(ctx context.Context, tenantID string) error {
	if !o.config.Enabled {
		return errors.New("kubernetes orchestration is not enabled")
	}
	
	// Get orchestration config for tenant
	config, err := o.GetTenantConfig(ctx, tenantID)
	if err != nil {
		return err
	}
	
	namespace := config.DedicatedNamespace
	if namespace == "" {
		// Nothing to remove
		return nil
	}
	
	// Update status
	status := &DeploymentStatus{
		TenantID:   tenantID,
		Mode:       SharedMode,
		Status:     "removing",
		Namespace:  o.config.Namespace,
		Message:    "Removing dedicated instance",
		LastUpdated: time.Now(),
	}
	
	if err := o.updateDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
	}
	
	// Delete namespace (will delete all resources in it)
	err = o.kubeClient.CoreV1().Namespaces().Delete(context.Background(), namespace, metav1.DeleteOptions{})
	if err != nil {
		o.logger.Error("Failed to delete namespace", 
			zap.String("tenant_id", tenantID), 
			zap.String("namespace", namespace),
			zap.Error(err))
		return fmt.Errorf("failed to delete namespace: %w", err)
	}
	
	// Update config to remove namespace
	config.DedicatedNamespace = ""
	config.Mode = SharedMode
	
	if err := o.SetTenantConfig(ctx, config); err != nil {
		return err
	}
	
	// Update status
	status = &DeploymentStatus{
		TenantID:   tenantID,
		Mode:       SharedMode,
		Status:     "ready",
		Namespace:  o.config.Namespace,
		Version:    "shared",
		LastUpdated: time.Now(),
	}
	
	if err := o.updateDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status", 
			zap.String("tenant_id", tenantID), 
			zap.Error(err))
	}
	
	o.logger.Info("Removed dedicated instance for tenant", 
		zap.String("tenant_id", tenantID), 
		zap.String("namespace", namespace))
	
	return nil
}

// createDeploymentObject creates a Kubernetes Deployment object
func (o *Orchestrator) createDeploymentObject(tenantID string, namespace string, config *TenantOrchestratorConfig) *appsv1.Deployment {
	// Set replicas
	replicas := int32(1)
	if config.MinReplicas > 0 {
		replicas = int32(config.MinReplicas)
	}
	
	// Create deployment
	return &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Namespace: namespace,
			Labels: map[string]string{
				"app": "veloflux",
				"tenant": tenantID,
				"veloflux/managed": "true",
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: &replicas,
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app": "veloflux",
					"tenant": tenantID,
				},
			},
			Template: v1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app": "veloflux",
						"tenant": tenantID,
					},
				},
				Spec: v1.PodSpec{
					Containers: []v1.Container{
						{
							Name: "veloflux",
							Image: "veloflux/veloflux:latest",
							Ports: []v1.ContainerPort{
								{
									Name: "http",
									ContainerPort: 80,
								},
								{
									Name: "https",
									ContainerPort: 443,
								},
								{
									Name: "admin",
									ContainerPort: 9000,
								},
								{
									Name: "metrics",
									ContainerPort: 8080,
								},
							},
							Resources: v1.ResourceRequirements{
								Requests: v1.ResourceList{
									v1.ResourceCPU:    resource.MustParse(config.ResourceLimits.CPURequest),
									v1.ResourceMemory: resource.MustParse(config.ResourceLimits.MemoryRequest),
								},
								Limits: v1.ResourceList{
									v1.ResourceCPU:    resource.MustParse(config.ResourceLimits.CPULimit),
									v1.ResourceMemory: resource.MustParse(config.ResourceLimits.MemoryLimit),
								},
							},
							Env: []v1.EnvVar{
								{
									Name: "REDIS_ADDRESS",
									Value: o.getRedisAddress(context.Background()),
								},
								{
									Name: "REDIS_PASSWORD",
									ValueFrom: &v1.EnvVarSource{
										SecretKeyRef: &v1.SecretKeySelector{
											LocalObjectReference: v1.LocalObjectReference{Name: "veloflux-redis"},
											Key: "redis-password",
										},
									},
								},
								{
									Name: "TENANT_ID",
									Value: tenantID,
								},
								{
									Name: "TENANT_MODE",
									Value: "dedicated",
								},
							},
							VolumeMounts: []v1.VolumeMount{
								{
									Name: "config",
									MountPath: "/etc/veloflux",
								},
							},
							LivenessProbe: &v1.Probe{
								ProbeHandler: v1.ProbeHandler{
									HTTPGet: &v1.HTTPGetAction{
										Path: "/health",
										Port: intstr.FromInt(9000),
									},
								},
								InitialDelaySeconds: 30,
								PeriodSeconds: 10,
							},
							ReadinessProbe: &v1.Probe{
								ProbeHandler: v1.ProbeHandler{
									HTTPGet: &v1.HTTPGetAction{
										Path: "/ready",
										Port: intstr.FromInt(9000),
									},
								},
								InitialDelaySeconds: 5,
								PeriodSeconds: 5,
							},
						},
					},
					Volumes: []v1.Volume{
						{
							Name: "config",
							VolumeSource: v1.VolumeSource{
								ConfigMap: &v1.ConfigMapVolumeSource{
									LocalObjectReference: v1.LocalObjectReference{
										Name: fmt.Sprintf("veloflux-config-%s", tenantID),
									},
								},
							},
						},
					},
				},
			},
		},
	}
}

// createServiceObject creates a Kubernetes Service object
func (o *Orchestrator) createServiceObject(tenantID string, namespace string) *v1.Service {
	return &v1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Namespace: namespace,
			Labels: map[string]string{
				"app": "veloflux",
				"tenant": tenantID,
				"veloflux/managed": "true",
			},
		},
		Spec: v1.ServiceSpec{
			Selector: map[string]string{
				"app": "veloflux",
				"tenant": tenantID,
			},
			Ports: []v1.ServicePort{
				{
					Name: "http",
					Port: 80,
					TargetPort: intstr.FromInt(80),
					Protocol: v1.ProtocolTCP,
				},
				{
					Name: "https",
					Port: 443,
					TargetPort: intstr.FromInt(443),
					Protocol: v1.ProtocolTCP,
				},
				{
					Name: "admin",
					Port: 9000,
					TargetPort: intstr.FromInt(9000),
					Protocol: v1.ProtocolTCP,
				},
				{
					Name: "metrics",
					Port: 8080,
					TargetPort: intstr.FromInt(8080),
					Protocol: v1.ProtocolTCP,
				},
			},
			Type: v1.ServiceTypeClusterIP,
		},
	}
}

// createIngressObject creates a Kubernetes Ingress object
func (o *Orchestrator) createIngressObject(tenantID string, namespace string, domains []string) *netv1.Ingress {
	ingress := &netv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Namespace: namespace,
			Labels: map[string]string{
				"app": "veloflux",
				"tenant": tenantID,
				"veloflux/managed": "true",
			},
			Annotations: map[string]string{
				"kubernetes.io/ingress.class": "nginx",
				"cert-manager.io/cluster-issuer": "letsencrypt-prod",
			},
		},
		Spec: netv1.IngressSpec{
			TLS: []netv1.IngressTLS{
				{
					Hosts:      domains,
					SecretName: fmt.Sprintf("veloflux-%s-tls", tenantID),
				},
			},
			Rules: []netv1.IngressRule{},
		},
	}
	
	// Add rules for each domain
	for _, domain := range domains {
		rule := netv1.IngressRule{
			Host: domain,
			IngressRuleValue: netv1.IngressRuleValue{
				HTTP: &netv1.HTTPIngressRuleValue{
					Paths: []netv1.HTTPIngressPath{
						{
							Path:     "/",
							PathType: func() *netv1.PathType { p := netv1.PathTypePrefix; return &p }(),
							Backend: netv1.IngressBackend{
								Service: &netv1.IngressServiceBackend{
									Name: fmt.Sprintf("veloflux-%s", tenantID),
									Port: netv1.ServiceBackendPort{
										Number: 80,
									},
								},
							},
						},
					},
				},
			},
		}
		ingress.Spec.Rules = append(ingress.Spec.Rules, rule)
	}
	
	return ingress
}

// watchDeployments watches Kubernetes deployments and updates status
func (o *Orchestrator) watchDeployments() {
	if !o.config.Enabled {
		return
	}
	
	o.logger.Info("Starting deployment watcher")
	
	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()
	
	for {
		<-ticker.C
		
		// List all tenants
		ctx := context.Background()
		tenants, err := o.tenantManager.ListTenants(ctx)
		if err != nil {
			o.logger.Error("Failed to list tenants", zap.Error(err))
			continue
		}
		
		for _, tenant := range tenants {
			// Skip inactive tenants
			if !tenant.Active {
				continue
			}
			
			// Get orchestration config
			config, err := o.GetTenantConfig(ctx, tenant.ID)
			if err != nil {
				o.logger.Error("Failed to get orchestration config", 
					zap.String("tenant_id", tenant.ID), 
					zap.Error(err))
				continue
			}
			
			// Skip shared tenants
			if config.Mode != DedicatedMode || config.DedicatedNamespace == "" {
				continue
			}
			
			// Get deployment
			deployment, err := o.kubeClient.AppsV1().Deployments(config.DedicatedNamespace).Get(ctx, fmt.Sprintf("veloflux-%s", tenant.ID), metav1.GetOptions{})
			if err != nil {
				o.logger.Error("Failed to get deployment", 
					zap.String("tenant_id", tenant.ID), 
					zap.String("namespace", config.DedicatedNamespace),
					zap.Error(err))
					
				// Update status to error
				status := &DeploymentStatus{
					TenantID:      tenant.ID,
					Mode:          DedicatedMode,
					Status:        "error",
					Namespace:     config.DedicatedNamespace,
					Message:       fmt.Sprintf("Failed to get deployment: %v", err),
					LastUpdated:   time.Now(),
				}
				
				if err := o.updateDeploymentStatus(ctx, status); err != nil {
					o.logger.Error("Failed to update deployment status", 
						zap.String("tenant_id", tenant.ID), 
						zap.Error(err))
				}
				
				continue
			}
			
			// Get replica counts
			replicas := int(*deployment.Spec.Replicas)
			readyReplicas := int(deployment.Status.ReadyReplicas)
			
			// Determine status
			status := "deploying"
			if deployment.Status.ReadyReplicas > 0 && deployment.Status.ReadyReplicas == deployment.Status.Replicas {
				status = "ready"
			} else if deployment.Status.ReadyReplicas < deployment.Status.Replicas {
				status = "scaling"
			}
			
			// Update status
			deploymentStatus := &DeploymentStatus{
				TenantID:      tenant.ID,
				Mode:          DedicatedMode,
				Status:        status,
				Namespace:     config.DedicatedNamespace,
				Version:       "dedicated",
				Replicas:      replicas,
				ReadyReplicas: readyReplicas,
				LastUpdated:   time.Now(),
			}
			
			if err := o.updateDeploymentStatus(ctx, deploymentStatus); err != nil {
				o.logger.Error("Failed to update deployment status", 
					zap.String("tenant_id", tenant.ID), 
					zap.Error(err))
			}
		}
	}
}

// Helper functions

// getRedisAddress gets the Redis address from the configuration
func (o *Orchestrator) getRedisAddress(ctx context.Context) string {
	// This would typically be retrieved from configuration or environment
	return "redis-master.redis.svc.cluster.local:6379"
}

// getRedisPassword gets the Redis password
func (o *Orchestrator) getRedisPassword(ctx context.Context) string {
	// This would typically be retrieved from a secret or environment
	return "" // Placeholder - in real implementation, get from Kubernetes secret
}
