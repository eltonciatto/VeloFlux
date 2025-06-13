package orchestration

import (
	"context"
	"encoding/json"
	"fmt"
	"path/filepath"
	"strings"
	"time"

	"github.com/eltonciatto/veloflux/internal/tenant"
	"go.uber.org/zap"
	appsv1 "k8s.io/api/apps/v1"
	autoscalingv2 "k8s.io/api/autoscaling/v2"
	corev1 "k8s.io/api/core/v1"
	networkingv1 "k8s.io/api/networking/v1"
	"k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/api/resource"
	metav1 "k8s.io/apimachinery/pkg/apis/meta/v1"
	"k8s.io/apimachinery/pkg/util/intstr"
	"k8s.io/client-go/kubernetes"
	"k8s.io/client-go/rest"
	"k8s.io/client-go/tools/clientcmd"
	"k8s.io/helm/pkg/helm"
	"k8s.io/helm/pkg/helm/portforwarder"
	"k8s.io/helm/pkg/kube"
)

// HelmChartConfig holds configuration for the Helm chart
type HelmChartConfig struct {
	Name       string                 `json:"name"`
	Version    string                 `json:"version"`
	Repository string                 `json:"repository"`
	Values     map[string]interface{} `json:"values"`
}

// DeployTenantInstance deploys a dedicated instance for a tenant
func (o *Orchestrator) DeployTenantInstance(ctx context.Context, tenantID string, config *TenantOrchestratorConfig) (*DeploymentStatus, error) {
	// Check if tenant exists
	tenant, err := o.tenantManager.GetTenant(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("tenant not found: %w", err)
	}

	// Check if tenant already has a deployment
	existingStatus, err := o.GetDeploymentStatus(ctx, tenantID)
	if err == nil && existingStatus.Status != "error" {
		// Update existing deployment
		return o.UpdateTenantInstance(ctx, tenantID, config)
	}

	// Create namespace for tenant if dedicated
	namespace := o.config.Namespace // default namespace
	if config.Mode == DedicatedMode {
		// Use dedicated namespace based on tenant ID
		if config.DedicatedNamespace == "" {
			config.DedicatedNamespace = fmt.Sprintf("veloflux-%s", strings.ToLower(tenantID))
		}
		namespace = config.DedicatedNamespace

		// Create namespace if it doesn't exist
		if err := o.createNamespaceIfNotExists(namespace); err != nil {
			return nil, fmt.Errorf("failed to create namespace: %w", err)
		}
	}

	// Store tenant config
	o.configMu.Lock()
	o.tenantConfigs[tenantID] = config
	o.configMu.Unlock()

	// Create deployment status
	status := &DeploymentStatus{
		TenantID:    tenantID,
		Mode:        config.Mode,
		Status:      "deploying",
		Namespace:   namespace,
		Version:     "v1",
		LastUpdated: time.Now(),
	}

	// Save deployment status
	if err := o.saveDeploymentStatus(ctx, status); err != nil {
		return nil, fmt.Errorf("failed to save deployment status: %w", err)
	}

	// Deploy resources asynchronously
	go func() {
		var deployErr error
		if config.Mode == DedicatedMode {
			if o.config.HelmReleaseName != "" {
				// Use Helm for deployment
				deployErr = o.deployWithHelm(ctx, tenantID, namespace, config)
			} else {
				// Use direct Kubernetes API
				deployErr = o.deployWithKubernetes(ctx, tenantID, namespace, config)
			}
		}

		// Update status
		status, _ := o.GetDeploymentStatus(ctx, tenantID)
		if deployErr != nil {
			status.Status = "error"
			status.Message = deployErr.Error()
		} else {
			status.Status = "ready"
		}
		status.LastUpdated = time.Now()

		o.saveDeploymentStatus(ctx, status)
	}()

	return status, nil
}

// createNamespaceIfNotExists creates a namespace if it doesn't exist
func (o *Orchestrator) createNamespaceIfNotExists(namespace string) error {
	_, err := o.kubeClient.CoreV1().Namespaces().Get(context.Background(), namespace, metav1.GetOptions{})
	if err == nil {
		// Namespace exists
		return nil
	}

	if !errors.IsNotFound(err) {
		return err
	}

	// Create the namespace
	ns := &corev1.Namespace{
		ObjectMeta: metav1.ObjectMeta{
			Name: namespace,
			Labels: map[string]string{
				"managed-by": "veloflux",
			},
		},
	}

	_, err = o.kubeClient.CoreV1().Namespaces().Create(context.Background(), ns, metav1.CreateOptions{})
	return err
}

// deployWithHelm deploys a tenant instance using Helm
func (o *Orchestrator) deployWithHelm(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Initialize Helm client
	helmClient, err := o.getHelmClient()
	if err != nil {
		return fmt.Errorf("failed to initialize Helm client: %w", err)
	}

	// Prepare values
	values := map[string]interface{}{
		"tenantId": tenantID,
		"resources": map[string]interface{}{
			"requests": map[string]string{
				"cpu":    config.ResourceLimits.CPURequest,
				"memory": config.ResourceLimits.MemoryRequest,
			},
			"limits": map[string]string{
				"cpu":    config.ResourceLimits.CPULimit,
				"memory": config.ResourceLimits.MemoryLimit,
			},
		},
		"autoscaling": map[string]interface{}{
			"enabled":                  config.AutoscalingEnabled,
			"minReplicas":             config.MinReplicas,
			"maxReplicas":             config.MaxReplicas,
			"targetCPUUtilizationPercentage": config.TargetCPUUtilization,
		},
		"ingress": map[string]interface{}{
			"enabled": true,
			"hosts":   config.CustomDomains,
		},
	}

	// Get the chart path
	chartPath := o.config.ChartPath
	if !filepath.IsAbs(chartPath) {
		// Use relative path from working directory
		chartPath = filepath.Join(".", chartPath)
	}

	// Create release name
	releaseName := fmt.Sprintf("%s-%s", o.config.HelmReleaseName, tenantID)

	// Install or upgrade chart
	_, err = helmClient.InstallRelease(
		chartPath,
		namespace,
		helm.ValueOverrides([]byte(toYAML(values))),
		helm.ReleaseName(releaseName),
	)

	return err
}

// getHelmClient initializes a Helm client
func (o *Orchestrator) getHelmClient() (*helm.Client, error) {
	// Get Kubernetes config
	config, err := o.getKubeConfig()
	if err != nil {
		return nil, err
	}

	// Create Kubernetes clientset
	clientset, err := kubernetes.NewForConfig(config)
	if err != nil {
		return nil, err
	}

	// Setup port forwarding for Tiller
	tillerNamespace := "kube-system"
	tillerPod, err := getFirstRunningPod(clientset, tillerNamespace, "app=helm,name=tiller")
	if err != nil {
		return nil, err
	}

	// Setup port forwarding
	fw, err := portforwarder.New(tillerNamespace, clientset, config)
	if err != nil {
		return nil, err
	}

	// Forward port to Tiller
	ports := []string{fmt.Sprintf(":%d", 44134)}
	err = fw.ForwardPorts(tillerPod, ports)
	if err != nil {
		return nil, err
	}

	// Create Helm client
	opts := []helm.Option{
		helm.Host(fmt.Sprintf("localhost:%d", fw.Local)),
	}

	return helm.NewClient(opts...), nil
}

// getFirstRunningPod returns the first running pod that matches the selector
func getFirstRunningPod(client *kubernetes.Clientset, namespace, selector string) (*corev1.Pod, error) {
	pods, err := client.CoreV1().Pods(namespace).List(context.Background(), metav1.ListOptions{
		LabelSelector: selector,
	})
	if err != nil {
		return nil, err
	}

	for _, pod := range pods.Items {
		if pod.Status.Phase == corev1.PodRunning {
			return &pod, nil
		}
	}

	return nil, fmt.Errorf("no running pods found for selector: %s", selector)
}

// deployWithKubernetes deploys a tenant instance using Kubernetes APIs directly
func (o *Orchestrator) deployWithKubernetes(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Create ConfigMap
	if err := o.createConfigMap(ctx, tenantID, namespace, config); err != nil {
		return fmt.Errorf("failed to create ConfigMap: %w", err)
	}

	// Create Deployment
	if err := o.createDeployment(ctx, tenantID, namespace, config); err != nil {
		return fmt.Errorf("failed to create Deployment: %w", err)
	}

	// Create Service
	if err := o.createService(ctx, tenantID, namespace, config); err != nil {
		return fmt.Errorf("failed to create Service: %w", err)
	}

	// Create Ingress if custom domains are specified
	if len(config.CustomDomains) > 0 {
		if err := o.createIngress(ctx, tenantID, namespace, config); err != nil {
			return fmt.Errorf("failed to create Ingress: %w", err)
		}
	}

	// Create HPA if autoscaling is enabled
	if config.AutoscalingEnabled {
		if err := o.createHPA(ctx, tenantID, namespace, config); err != nil {
			return fmt.Errorf("failed to create HorizontalPodAutoscaler: %w", err)
		}
	}

	return nil
}

// createConfigMap creates a ConfigMap for the tenant
func (o *Orchestrator) createConfigMap(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Prepare ConfigMap data
	configData := map[string]string{
		"config.yaml": fmt.Sprintf(`
tenant_id: %s
mode: %s
`, tenantID, string(config.Mode)),
	}

	// Create ConfigMap
	cm := &corev1.ConfigMap{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s-config", tenantID),
			Labels: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
		},
		Data: configData,
	}

	// Apply ConfigMap
	_, err := o.kubeClient.CoreV1().ConfigMaps(namespace).Create(ctx, cm, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			// Update if already exists
			_, err = o.kubeClient.CoreV1().ConfigMaps(namespace).Update(ctx, cm, metav1.UpdateOptions{})
		}
	}
	return err
}

// createDeployment creates a Deployment for the tenant
func (o *Orchestrator) createDeployment(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Prepare resource requirements
	resourceRequests := corev1.ResourceList{}
	resourceLimits := corev1.ResourceList{}

	if config.ResourceLimits.CPURequest != "" {
		resourceRequests[corev1.ResourceCPU] = resource.MustParse(config.ResourceLimits.CPURequest)
	}
	if config.ResourceLimits.MemoryRequest != "" {
		resourceRequests[corev1.ResourceMemory] = resource.MustParse(config.ResourceLimits.MemoryRequest)
	}
	if config.ResourceLimits.CPULimit != "" {
		resourceLimits[corev1.ResourceCPU] = resource.MustParse(config.ResourceLimits.CPULimit)
	}
	if config.ResourceLimits.MemoryLimit != "" {
		resourceLimits[corev1.ResourceMemory] = resource.MustParse(config.ResourceLimits.MemoryLimit)
	}

	// Create Deployment
	deployment := &appsv1.Deployment{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Labels: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
		},
		Spec: appsv1.DeploymentSpec{
			Replicas: pointer(int32(config.MinReplicas)),
			Selector: &metav1.LabelSelector{
				MatchLabels: map[string]string{
					"app":       "veloflux",
					"tenant_id": tenantID,
				},
			},
			Template: corev1.PodTemplateSpec{
				ObjectMeta: metav1.ObjectMeta{
					Labels: map[string]string{
						"app":       "veloflux",
						"tenant_id": tenantID,
					},
				},
				Spec: corev1.PodSpec{
					Containers: []corev1.Container{
						{
							Name:  "veloflux",
							Image: "veloflux:latest", // Use actual image reference
							Ports: []corev1.ContainerPort{
								{
									Name:          "http",
									ContainerPort: 80,
								},
							},
							Resources: corev1.ResourceRequirements{
								Requests: resourceRequests,
								Limits:   resourceLimits,
							},
							VolumeMounts: []corev1.VolumeMount{
								{
									Name:      "config",
									MountPath: "/app/config",
								},
							},
							Env: []corev1.EnvVar{
								{
									Name:  "TENANT_ID",
									Value: tenantID,
								},
								{
									Name:  "CONFIG_PATH",
									Value: "/app/config/config.yaml",
								},
							},
							LivenessProbe: &corev1.Probe{
								ProbeHandler: corev1.ProbeHandler{
									HTTPGet: &corev1.HTTPGetAction{
										Path: "/health",
										Port: intstr.FromInt(80),
									},
								},
								InitialDelaySeconds: 10,
								PeriodSeconds:       15,
							},
							ReadinessProbe: &corev1.Probe{
								ProbeHandler: corev1.ProbeHandler{
									HTTPGet: &corev1.HTTPGetAction{
										Path: "/ready",
										Port: intstr.FromInt(80),
									},
								},
								InitialDelaySeconds: 5,
								PeriodSeconds:       10,
							},
						},
					},
					Volumes: []corev1.Volume{
						{
							Name: "config",
							VolumeSource: corev1.VolumeSource{
								ConfigMap: &corev1.ConfigMapVolumeSource{
									LocalObjectReference: corev1.LocalObjectReference{
										Name: fmt.Sprintf("veloflux-%s-config", tenantID),
									},
								},
							},
						},
					},
				},
			},
		},
	}

	// Apply Deployment
	_, err := o.kubeClient.AppsV1().Deployments(namespace).Create(ctx, deployment, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			// Update if already exists
			_, err = o.kubeClient.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
		}
	}
	return err
}

// createService creates a Service for the tenant
func (o *Orchestrator) createService(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Create Service
	service := &corev1.Service{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Labels: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
		},
		Spec: corev1.ServiceSpec{
			Selector: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
			Ports: []corev1.ServicePort{
				{
					Name:       "http",
					Port:       80,
					TargetPort: intstr.FromString("http"),
				},
			},
		},
	}

	// Apply Service
	_, err := o.kubeClient.CoreV1().Services(namespace).Create(ctx, service, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			// Update if already exists
			_, err = o.kubeClient.CoreV1().Services(namespace).Update(ctx, service, metav1.UpdateOptions{})
		}
	}
	return err
}

// createIngress creates an Ingress for the tenant
func (o *Orchestrator) createIngress(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Prepare PathType
	pathType := networkingv1.PathTypePrefix

	// Prepare IngressRule for each domain
	var rules []networkingv1.IngressRule
	for _, domain := range config.CustomDomains {
		rules = append(rules, networkingv1.IngressRule{
			Host: domain,
			IngressRuleValue: networkingv1.IngressRuleValue{
				HTTP: &networkingv1.HTTPIngressRuleValue{
					Paths: []networkingv1.HTTPIngressPath{
						{
							Path:     "/",
							PathType: &pathType,
							Backend: networkingv1.IngressBackend{
								Service: &networkingv1.IngressServiceBackend{
									Name: fmt.Sprintf("veloflux-%s", tenantID),
									Port: networkingv1.ServiceBackendPort{
										Number: 80,
									},
								},
							},
						},
					},
				},
			},
		})
	}

	// Create Ingress
	ingress := &networkingv1.Ingress{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Labels: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
			Annotations: map[string]string{
				"kubernetes.io/ingress.class": "nginx",
			},
		},
		Spec: networkingv1.IngressSpec{
			Rules: rules,
		},
	}

	// Apply Ingress
	_, err := o.kubeClient.NetworkingV1().Ingresses(namespace).Create(ctx, ingress, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			// Update if already exists
			_, err = o.kubeClient.NetworkingV1().Ingresses(namespace).Update(ctx, ingress, metav1.UpdateOptions{})
		}
	}
	return err
}

// createHPA creates a HorizontalPodAutoscaler for the tenant
func (o *Orchestrator) createHPA(ctx context.Context, tenantID, namespace string, config *TenantOrchestratorConfig) error {
	// Create HPA
	hpa := &autoscalingv2.HorizontalPodAutoscaler{
		ObjectMeta: metav1.ObjectMeta{
			Name: fmt.Sprintf("veloflux-%s", tenantID),
			Labels: map[string]string{
				"app":       "veloflux",
				"tenant_id": tenantID,
			},
		},
		Spec: autoscalingv2.HorizontalPodAutoscalerSpec{
			ScaleTargetRef: autoscalingv2.CrossVersionObjectReference{
				APIVersion: "apps/v1",
				Kind:       "Deployment",
				Name:       fmt.Sprintf("veloflux-%s", tenantID),
			},
			MinReplicas: pointer(int32(config.MinReplicas)),
			MaxReplicas: int32(config.MaxReplicas),
			Metrics: []autoscalingv2.MetricSpec{
				{
					Type: autoscalingv2.ResourceMetricSourceType,
					Resource: &autoscalingv2.ResourceMetricSource{
						Name: corev1.ResourceCPU,
						Target: autoscalingv2.MetricTarget{
							Type:               autoscalingv2.UtilizationMetricType,
							AverageUtilization: pointer(int32(config.TargetCPUUtilization)),
						},
					},
				},
			},
		},
	}

	// Apply HPA
	_, err := o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Create(ctx, hpa, metav1.CreateOptions{})
	if err != nil {
		if errors.IsAlreadyExists(err) {
			// Update if already exists
			_, err = o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Update(ctx, hpa, metav1.UpdateOptions{})
		}
	}
	return err
}

// UpdateTenantInstance updates a tenant instance
func (o *Orchestrator) UpdateTenantInstance(ctx context.Context, tenantID string, config *TenantOrchestratorConfig) (*DeploymentStatus, error) {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("deployment not found: %w", err)
	}

	// Update status
	status.Status = "updating"
	status.LastUpdated = time.Now()

	// Save updated status
	if err := o.saveDeploymentStatus(ctx, status); err != nil {
		return nil, fmt.Errorf("failed to save deployment status: %w", err)
	}

	// Update configuration
	o.configMu.Lock()
	o.tenantConfigs[tenantID] = config
	o.configMu.Unlock()

	// Update deployment asynchronously
	go func() {
		var updateErr error
		if config.Mode == DedicatedMode {
			namespace := status.Namespace
			if o.config.HelmReleaseName != "" {
				updateErr = o.deployWithHelm(ctx, tenantID, namespace, config)
			} else {
				updateErr = o.deployWithKubernetes(ctx, tenantID, namespace, config)
			}
		}

		// Update status
		updatedStatus, _ := o.GetDeploymentStatus(ctx, tenantID)
		if updateErr != nil {
			updatedStatus.Status = "error"
			updatedStatus.Message = updateErr.Error()
		} else {
			updatedStatus.Status = "ready"
			updatedStatus.Message = ""
		}
		updatedStatus.LastUpdated = time.Now()

		o.saveDeploymentStatus(ctx, updatedStatus)
	}()

	return status, nil
}

// RemoveTenantInstance removes a tenant instance
func (o *Orchestrator) RemoveTenantInstance(ctx context.Context, tenantID string) error {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}

	// Update status
	status.Status = "removing"
	status.LastUpdated = time.Now()

	// Save updated status
	if err := o.saveDeploymentStatus(ctx, status); err != nil {
		return fmt.Errorf("failed to save deployment status: %w", err)
	}

	// Remove configuration
	o.configMu.Lock()
	delete(o.tenantConfigs, tenantID)
	o.configMu.Unlock()

	// Remove deployment asynchronously
	go func() {
		var removeErr error
		if status.Mode == DedicatedMode {
			namespace := status.Namespace
			if o.config.HelmReleaseName != "" {
				// Remove Helm release
				helmClient, err := o.getHelmClient()
				if err == nil {
					releaseName := fmt.Sprintf("%s-%s", o.config.HelmReleaseName, tenantID)
					_, removeErr = helmClient.DeleteRelease(releaseName, helm.DeletePurge(true))
				} else {
					removeErr = err
				}
			} else {
				// Remove Kubernetes resources
				removeErr = o.removeKubernetesResources(ctx, tenantID, namespace)
			}
		}

		// Update status
		if removeErr != nil {
			status.Status = "error"
			status.Message = removeErr.Error()
		} else {
			status.Status = "removed"
			status.Message = ""
		}
		status.LastUpdated = time.Now()

		o.saveDeploymentStatus(ctx, status)
	}()

	return nil
}

// removeKubernetesResources removes all Kubernetes resources for a tenant
func (o *Orchestrator) removeKubernetesResources(ctx context.Context, tenantID, namespace string) error {
	// Delete HPA
	err := o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Delete(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	// Delete Ingress
	err = o.kubeClient.NetworkingV1().Ingresses(namespace).Delete(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	// Delete Service
	err = o.kubeClient.CoreV1().Services(namespace).Delete(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	// Delete Deployment
	err = o.kubeClient.AppsV1().Deployments(namespace).Delete(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	// Delete ConfigMap
	err = o.kubeClient.CoreV1().ConfigMaps(namespace).Delete(ctx,
		fmt.Sprintf("veloflux-%s-config", tenantID), metav1.DeleteOptions{})
	if err != nil && !errors.IsNotFound(err) {
		return err
	}

	return nil
}

// GetDeploymentStatus retrieves the deployment status for a tenant
func (o *Orchestrator) GetDeploymentStatus(ctx context.Context, tenantID string) (*DeploymentStatus, error) {
	data, err := o.client.Get(ctx, fmt.Sprintf("vf:tenant:%s:deployment", tenantID)).Bytes()
	if err != nil {
		return nil, err
	}

	var status DeploymentStatus
	if err := json.Unmarshal(data, &status); err != nil {
		return nil, err
	}

	// If status is "ready", get actual status from Kubernetes
	if status.Status == "ready" && status.Mode == DedicatedMode {
		namespace := status.Namespace
		deployment, err := o.kubeClient.AppsV1().Deployments(namespace).Get(ctx,
			fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
		if err == nil {
			status.Replicas = int(deployment.Status.Replicas)
			status.ReadyReplicas = int(deployment.Status.ReadyReplicas)
		}
	}

	return &status, nil
}

// saveDeploymentStatus saves deployment status for a tenant
func (o *Orchestrator) saveDeploymentStatus(ctx context.Context, status *DeploymentStatus) error {
	data, err := json.Marshal(status)
	if err != nil {
		return err
	}

	return o.client.Set(ctx, fmt.Sprintf("vf:tenant:%s:deployment", status.TenantID), data, 0).Err()
}

// getKubeConfig returns the Kubernetes config
func (o *Orchestrator) getKubeConfig() (*rest.Config, error) {
	if o.config.InCluster {
		// Use in-cluster config
		return rest.InClusterConfig()
	}
	
	// Use kubeconfig file
	return clientcmd.BuildConfigFromFlags("", o.config.KubeConfigPath)
}

// Helper function to convert map to YAML
func toYAML(v map[string]interface{}) string {
	// Simple implementation, should use a proper YAML library in production
	var sb strings.Builder
	for k, v := range v {
		sb.WriteString(fmt.Sprintf("%s: %v\n", k, v))
	}
	return sb.String()
}

// Helper function to create pointer to int32
func pointer(i int32) *int32 {
	return &i
}

// GetDetailedDeploymentStatus retrieves detailed deployment status with metrics and events
func (o *Orchestrator) GetDetailedDeploymentStatus(ctx context.Context, tenantID string) (*DetailedDeploymentStatus, error) {
	// Get basic deployment status
	basic, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return nil, fmt.Errorf("failed to get basic deployment status: %w", err)
	}
	
	// Create detailed status with basic information
	detailed := &DetailedDeploymentStatus{
		DeploymentStatus: *basic,
		Events:           []DeploymentEvent{},
		Metrics:          DeploymentMetrics{},
		Pods:             []PodStatus{},
	}
	
	// If not in dedicated mode, return basic status
	if basic.Mode != DedicatedMode || basic.Namespace == "" {
		return detailed, nil
	}
	
	// Get deployment events
	events, err := o.getDeploymentEvents(ctx, tenantID, basic.Namespace)
	if err != nil {
		o.logger.Error("Failed to get deployment events", 
			zap.String("tenant_id", tenantID),
			zap.Error(err))
	} else {
		detailed.Events = events
	}
	
	// Get pod metrics and statuses
	pods, err := o.getPodStatuses(ctx, tenantID, basic.Namespace)
	if err != nil {
		o.logger.Error("Failed to get pod statuses", 
			zap.String("tenant_id", tenantID),
			zap.Error(err))
	} else {
		detailed.Pods = pods
	}
	
	// Get resource metrics
	metrics, err := o.getDeploymentMetrics(ctx, tenantID, basic.Namespace)
	if err != nil {
		o.logger.Error("Failed to get deployment metrics", 
			zap.String("tenant_id", tenantID),
			zap.Error(err))
	} else {
		detailed.Metrics = metrics
	}
	
	return detailed, nil
}

// getDeploymentEvents retrieves recent events for a tenant's deployment
func (o *Orchestrator) getDeploymentEvents(ctx context.Context, tenantID, namespace string) ([]DeploymentEvent, error) {
	// Get events for this deployment
	fieldSelector := fmt.Sprintf("involvedObject.name=%s,involvedObject.namespace=%s", 
		fmt.Sprintf("veloflux-%s", tenantID), namespace)
	
	events, err := o.kubeClient.CoreV1().Events(namespace).List(ctx, metav1.ListOptions{
		FieldSelector: fieldSelector,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list events: %w", err)
	}
	
	var deploymentEvents []DeploymentEvent
	for _, event := range events.Items {
		deploymentEvents = append(deploymentEvents, DeploymentEvent{
			Type:      event.Type,
			Reason:    event.Reason,
			Message:   event.Message,
			Count:     event.Count,
			FirstSeen: event.FirstTimestamp.Time,
			LastSeen:  event.LastTimestamp.Time,
		})
	}
	
	return deploymentEvents, nil
}

// getPodStatuses retrieves statuses for pods in a tenant's deployment
func (o *Orchestrator) getPodStatuses(ctx context.Context, tenantID, namespace string) ([]PodStatus, error) {
	// List pods for this deployment
	labelSelector := fmt.Sprintf("app=veloflux,tenant_id=%s", tenantID)
	
	pods, err := o.kubeClient.CoreV1().Pods(namespace).List(ctx, metav1.ListOptions{
		LabelSelector: labelSelector,
	})
	if err != nil {
		return nil, fmt.Errorf("failed to list pods: %w", err)
	}
	
	var podStatuses []PodStatus
	for _, pod := range pods.Items {
		var containerStatuses []ContainerStatus
		for _, cs := range pod.Status.ContainerStatuses {
			containerStatuses = append(containerStatuses, ContainerStatus{
				Name:         cs.Name,
				Ready:        cs.Ready,
				RestartCount: cs.RestartCount,
				Started:      cs.Started != nil && *cs.Started,
			})
		}
		
		podStatuses = append(podStatuses, PodStatus{
			Name:            pod.Name,
			Status:          string(pod.Status.Phase),
			CreationTime:    pod.CreationTimestamp.Time,
			Containers:      containerStatuses,
			NodeName:        pod.Spec.NodeName,
			IP:              pod.Status.PodIP,
			RestartPolicty:  string(pod.Spec.RestartPolicy),
		})
	}
	
	return podStatuses, nil
}

// getDeploymentMetrics retrieves resource metrics for a tenant's deployment
func (o *Orchestrator) getDeploymentMetrics(ctx context.Context, tenantID, namespace string) (DeploymentMetrics, error) {
	metrics := DeploymentMetrics{}
	
	// This would typically use the Metrics API or Prometheus
	// For now, we'll use a placeholder implementation
	
	// Get HPA if it exists to check utilization metrics
	hpa, err := o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Get(
		ctx, fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
	
	if err == nil {
		// Extract metrics from HPA status
		for _, metric := range hpa.Status.CurrentMetrics {
			if metric.Type == autoscalingv2.ResourceMetricSourceType && 
			   metric.Resource != nil && 
			   metric.Resource.Name == corev1.ResourceCPU && 
			   metric.Resource.Current.AverageUtilization != nil {
				metrics.CPUUtilization = *metric.Resource.Current.AverageUtilization
			}
			
			if metric.Type == autoscalingv2.ResourceMetricSourceType && 
			   metric.Resource != nil && 
			   metric.Resource.Name == corev1.ResourceMemory && 
			   metric.Resource.Current.AverageUtilization != nil {
				metrics.MemoryUtilization = *metric.Resource.Current.AverageUtilization
			}
		}
	}
	
	return metrics, nil
}

// DetailedDeploymentStatus holds detailed information about a tenant's deployment
type DetailedDeploymentStatus struct {
	DeploymentStatus
	Events  []DeploymentEvent `json:"events,omitempty"`
	Metrics DeploymentMetrics  `json:"metrics,omitempty"`
	Pods    []PodStatus        `json:"pods,omitempty"`
}

// DeploymentEvent represents a Kubernetes event related to a deployment
type DeploymentEvent struct {
	Type      string    `json:"type"`
	Reason    string    `json:"reason"`
	Message   string    `json:"message"`
	Count     int32     `json:"count"`
	FirstSeen time.Time `json:"first_seen"`
	LastSeen  time.Time `json:"last_seen"`
}

// DeploymentMetrics holds metrics for a deployment
type DeploymentMetrics struct {
	CPUUtilization    int32 `json:"cpu_utilization"`
	MemoryUtilization int32 `json:"memory_utilization"`
	RequestRate       int32 `json:"request_rate,omitempty"`
	ErrorRate         int32 `json:"error_rate,omitempty"`
	ResponseTime      int32 `json:"response_time,omitempty"`
}

// PodStatus represents status of a pod in the deployment
type PodStatus struct {
	Name           string            `json:"name"`
	Status         string            `json:"status"`
	CreationTime   time.Time         `json:"creation_time"`
	Containers     []ContainerStatus `json:"containers"`
	NodeName       string            `json:"node_name,omitempty"`
	IP             string            `json:"ip,omitempty"`
	RestartPolicty string            `json:"restart_policy"`
}

// ContainerStatus represents status of a container in a pod
type ContainerStatus struct {
	Name         string `json:"name"`
	Ready        bool   `json:"ready"`
	RestartCount int32  `json:"restart_count"`
	Started      bool   `json:"started"`
}

// ScaleTenantInstance scales a tenant instance to a specific number of replicas
func (o *Orchestrator) ScaleTenantInstance(ctx context.Context, tenantID string, replicas int) error {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}
	
	// Only scale dedicated instances
	if status.Mode != DedicatedMode {
		return errors.New("can only scale dedicated instances")
	}
	
	namespace := status.Namespace
	
	// Update deployment with new replica count
	deployment, err := o.kubeClient.AppsV1().Deployments(namespace).Get(ctx, 
		fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}
	
	// Update replicas
	replicasInt32 := int32(replicas)
	deployment.Spec.Replicas = &replicasInt32
	
	_, err = o.kubeClient.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to scale deployment: %w", err)
	}
	
	// Update status
	status.Status = "scaling"
	status.LastUpdated = time.Now()
	status.Message = fmt.Sprintf("Scaling to %d replicas", replicas)
	
	if err := o.saveDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status",
			zap.String("tenant_id", tenantID),
			zap.Error(err))
	}
	
	o.logger.Info("Scaled tenant instance",
		zap.String("tenant_id", tenantID),
		zap.Int("replicas", replicas))
	
	return nil
}

// UpdateAutoscalingConfig updates the HPA configuration for a tenant instance
func (o *Orchestrator) UpdateAutoscalingConfig(ctx context.Context, tenantID string, config *TenantOrchestratorConfig) error {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}
	
	// Only update dedicated instances
	if status.Mode != DedicatedMode {
		return errors.New("can only update autoscaling for dedicated instances")
	}
	
	namespace := status.Namespace
	
	// Check if HPA exists
	hpaName := fmt.Sprintf("veloflux-%s", tenantID)
	_, err = o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Get(ctx, hpaName, metav1.GetOptions{})
	
	if err != nil {
		if errors.IsNotFound(err) && config.AutoscalingEnabled {
			// Create new HPA
			return o.createHPA(ctx, tenantID, namespace, config)
		}
		return fmt.Errorf("failed to check HPA: %w", err)
	}
	
	// HPA exists
	if !config.AutoscalingEnabled {
		// Delete HPA
		err = o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Delete(ctx, hpaName, metav1.DeleteOptions{})
		if err != nil {
			return fmt.Errorf("failed to delete HPA: %w", err)
		}
	} else {
		// Update HPA
		hpa := &autoscalingv2.HorizontalPodAutoscaler{
			ObjectMeta: metav1.ObjectMeta{
				Name: hpaName,
				Labels: map[string]string{
					"app":       "veloflux",
					"tenant_id": tenantID,
				},
			},
			Spec: autoscalingv2.HorizontalPodAutoscalerSpec{
				ScaleTargetRef: autoscalingv2.CrossVersionObjectReference{
					APIVersion: "apps/v1",
					Kind:       "Deployment",
					Name:       fmt.Sprintf("veloflux-%s", tenantID),
				},
				MinReplicas: pointer(int32(config.MinReplicas)),
				MaxReplicas: int32(config.MaxReplicas),
				Metrics: []autoscalingv2.MetricSpec{
					{
						Type: autoscalingv2.ResourceMetricSourceType,
						Resource: &autoscalingv2.ResourceMetricSource{
							Name: corev1.ResourceCPU,
							Target: autoscalingv2.MetricTarget{
								Type:               autoscalingv2.UtilizationMetricType,
								AverageUtilization: pointer(int32(config.TargetCPUUtilization)),
							},
						},
					},
				},
			},
		}
		
		_, err = o.kubeClient.AutoscalingV2().HorizontalPodAutoscalers(namespace).Update(ctx, hpa, metav1.UpdateOptions{})
		if err != nil {
			return fmt.Errorf("failed to update HPA: %w", err)
		}
	}
	
	o.logger.Info("Updated autoscaling config for tenant",
		zap.String("tenant_id", tenantID),
		zap.Bool("enabled", config.AutoscalingEnabled),
		zap.Int("minReplicas", config.MinReplicas),
		zap.Int("maxReplicas", config.MaxReplicas))
	
	return nil
}

// DrainTenantInstance drains a tenant instance for maintenance or migration
func (o *Orchestrator) DrainTenantInstance(ctx context.Context, tenantID string) error {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}
	
	// Only drain dedicated instances
	if status.Mode != DedicatedMode {
		return errors.New("can only drain dedicated instances")
	}
	
	namespace := status.Namespace
	
	// Update status
	status.Status = "draining"
	status.LastUpdated = time.Now()
	status.Message = "Instance is being drained"
	
	if err := o.saveDeploymentStatus(ctx, status); err != nil {
		o.logger.Error("Failed to update deployment status",
			zap.String("tenant_id", tenantID),
			zap.Error(err))
	}
	
	// Add a drain annotation to the pods
	deployment, err := o.kubeClient.AppsV1().Deployments(namespace).Get(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}
	
	// Add drain annotation
	if deployment.Spec.Template.Annotations == nil {
		deployment.Spec.Template.Annotations = make(map[string]string)
	}
	
	// Add drain timestamp to force pod recreation
	deployment.Spec.Template.Annotations["veloflux.io/drain-timestamp"] = time.Now().Format(time.RFC3339)
	
	_, err = o.kubeClient.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update deployment for drain: %w", err)
	}
	
	o.logger.Info("Initiated drain for tenant instance",
		zap.String("tenant_id", tenantID),
		zap.String("namespace", namespace))
	
	return nil
}

// UpdateResourceLimits updates resource limits for a tenant instance
func (o *Orchestrator) UpdateResourceLimits(ctx context.Context, tenantID string, limits ResourceLimits) error {
	// Get current deployment status
	status, err := o.GetDeploymentStatus(ctx, tenantID)
	if err != nil {
		return fmt.Errorf("deployment not found: %w", err)
	}
	
	// Only update dedicated instances
	if status.Mode != DedicatedMode {
		return errors.New("can only update resource limits for dedicated instances")
	}
	
	namespace := status.Namespace
	
	// Get the current deployment
	deployment, err := o.kubeClient.AppsV1().Deployments(namespace).Get(ctx,
		fmt.Sprintf("veloflux-%s", tenantID), metav1.GetOptions{})
	if err != nil {
		return fmt.Errorf("failed to get deployment: %w", err)
	}
	
	// Update resource requirements
	for i := range deployment.Spec.Template.Spec.Containers {
		if deployment.Spec.Template.Spec.Containers[i].Name == "veloflux" {
			// Update requests
			if limits.CPURequest != "" {
				deployment.Spec.Template.Spec.Containers[i].Resources.Requests[corev1.ResourceCPU] = resource.MustParse(limits.CPURequest)
			}
			if limits.MemoryRequest != "" {
				deployment.Spec.Template.Spec.Containers[i].Resources.Requests[corev1.ResourceMemory] = resource.MustParse(limits.MemoryRequest)
			}
			
			// Update limits
			if limits.CPULimit != "" {
				deployment.Spec.Template.Spec.Containers[i].Resources.Limits[corev1.ResourceCPU] = resource.MustParse(limits.CPULimit)
			}
			if limits.MemoryLimit != "" {
				deployment.Spec.Template.Spec.Containers[i].Resources.Limits[corev1.ResourceMemory] = resource.MustParse(limits.MemoryLimit)
			}
			
			break
		}
	}
	
	// Update deployment
	_, err = o.kubeClient.AppsV1().Deployments(namespace).Update(ctx, deployment, metav1.UpdateOptions{})
	if err != nil {
		return fmt.Errorf("failed to update deployment resource limits: %w", err)
	}
	
	// Update tenant config
	config, err := o.GetTenantConfig(ctx, tenantID)
	if err == nil {
		config.ResourceLimits = limits
		o.SetTenantConfig(ctx, config)
	}
	
	o.logger.Info("Updated resource limits for tenant instance",
		zap.String("tenant_id", tenantID),
		zap.String("cpu_request", limits.CPURequest),
		zap.String("memory_request", limits.MemoryRequest),
		zap.String("cpu_limit", limits.CPULimit),
		zap.String("memory_limit", limits.MemoryLimit))
	
	return nil
}
