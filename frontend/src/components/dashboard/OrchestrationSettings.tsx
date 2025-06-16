import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { safeApiFetch } from '@/lib/api'; // Update with your actual API utility
import { ReloadIcon, RocketIcon, TrashIcon, SettingsIcon, GearIcon, ClockIcon, CrossCircledIcon, CheckCircledIcon } from '@radix-ui/react-icons';

const OrchestrationSettings = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    tenant_id: tenantId,
    mode: 'shared',
    dedicated_namespace: '',
    resource_limits: {
      cpu_request: '100m',
      cpu_limit: '500m',
      memory_request: '128Mi',
      memory_limit: '512Mi'
    },
    autoscaling_enabled: false,
    min_replicas: 1,
    max_replicas: 10,
    target_cpu_utilization: 75,
    custom_domains: []
  });
  const [status, setStatus] = useState({
    tenant_id: tenantId,
    mode: 'shared',
    status: 'not_deployed',
    namespace: '',
    version: '',
    replicas: 0,
    ready_replicas: 0,
    message: 'No deployment found for this tenant',
    last_updated: new Date().toISOString()
  });
  const [detailedStatus, setDetailedStatus] = useState({
    events: [],
    metrics: {
      cpu_utilization: 0,
      memory_utilization: 0,
      request_rate: 0,
      error_rate: 0,
      response_time: 0
    },
    pods: []
  });
  const [scalingReplicas, setScalingReplicas] = useState(1);
  const [newDomain, setNewDomain] = useState('');
  const [activeTab, setActiveTab] = useState('config');
  const [isScaleDialogOpen, setIsScaleDialogOpen] = useState(false);
  const [showDetailedStatus, setShowDetailedStatus] = useState(false);

  // Status badge colors
  const statusColors = {
    'ready': 'bg-green-600',
    'deploying': 'bg-blue-600',
    'updating': 'bg-yellow-600',
    'scaling': 'bg-orange-600',
    'removing': 'bg-red-600',
    'draining': 'bg-purple-600',
    'error': 'bg-red-600',
    'not_deployed': 'bg-gray-600'
  };
  // Fetch config
  const fetchConfig = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/orchestration`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setConfig(response);
    } catch (error) {
      console.error('Error fetching orchestration config:', error);
      toast({
        title: 'Error',
        description: 'Failed to load orchestration configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);
  // Fetch status
  const fetchStatus = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/orchestration/status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStatus(response);
    } catch (error) {
      console.error('Error fetching deployment status:', error);
    }
  }, [tenantId, token]);
  // Fetch detailed status
  const fetchDetailedStatus = useCallback(async () => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/orchestration/detailed_status`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setDetailedStatus(response);
    } catch (error) {
      console.error('Error fetching detailed status:', error);
    }
  }, [tenantId, token]);

  // Save config
  const saveConfig = async () => {
    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config)
      });

      toast({
        title: 'Success',
        description: 'Orchestration configuration saved successfully',
        variant: 'default'
      });

      // Refresh config
      fetchConfig();
      fetchStatus();
    } catch (error) {
      console.error('Error saving orchestration config:', error);
      toast({
        title: 'Error',
        description: 'Failed to save orchestration configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Deploy tenant instance
  const deployInstance = async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/orchestration/deploy`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Success',
        description: 'Deployment initiated successfully',
        variant: 'default'
      });

      setStatus(response);
      setActiveTab('status');
    } catch (error) {
      console.error('Error deploying tenant instance:', error);
      toast({
        title: 'Error',
        description: 'Failed to deploy tenant instance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update autoscaling configuration
  const updateAutoscaling = async () => {
    setLoading(true);
    try {
      const autoscalingConfig = {
        enabled: config.autoscaling_enabled,
        min_replicas: config.min_replicas,
        max_replicas: config.max_replicas,
        target_cpu_utilization: config.target_cpu_utilization
      };
      
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration/autoscale`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(autoscalingConfig)
      });

      toast({
        title: 'Success',
        description: 'Autoscaling configuration updated successfully',
        variant: 'default'
      });

      fetchStatus();
    } catch (error) {
      console.error('Error updating autoscaling configuration:', error);
      toast({
        title: 'Error',
        description: 'Failed to update autoscaling configuration',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Update resource limits
  const updateResources = async () => {
    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration/resources`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(config.resource_limits)
      });

      toast({
        title: 'Success',
        description: 'Resource limits updated successfully',
        variant: 'default'
      });

      fetchStatus();
    } catch (error) {
      console.error('Error updating resource limits:', error);
      toast({
        title: 'Error',
        description: 'Failed to update resource limits',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Scale instance to specific replica count
  const scaleInstance = async () => {
    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration/scale`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          replicas: scalingReplicas
        })
      });

      toast({
        title: 'Success',
        description: `Scaling to ${scalingReplicas} replicas`,
        variant: 'default'
      });

      setIsScaleDialogOpen(false);
      fetchStatus();
    } catch (error) {
      console.error('Error scaling instance:', error);
      toast({
        title: 'Error',
        description: 'Failed to scale instance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Drain instance
  const drainInstance = async () => {
    if (!window.confirm('Are you sure you want to drain this instance? This will restart all pods.')) {
      return;
    }

    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration/drain`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Success',
        description: 'Drain initiated successfully',
        variant: 'default'
      });

      fetchStatus();
    } catch (error) {
      console.error('Error draining instance:', error);
      toast({
        title: 'Error',
        description: 'Failed to drain instance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Remove tenant instance
  const removeInstance = async () => {
    if (!window.confirm('Are you sure you want to remove this instance? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/orchestration/remove`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Success',
        description: 'Removal initiated successfully',
        variant: 'default'
      });

      // Refresh status
      fetchStatus();
      setActiveTab('status');
    } catch (error) {
      console.error('Error removing tenant instance:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove tenant instance',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  // Add custom domain
  const addCustomDomain = () => {
    if (!newDomain) return;
    if (config.custom_domains.includes(newDomain)) {
      toast({
        title: 'Error',
        description: 'This domain is already added',
        variant: 'destructive'
      });
      return;
    }

    setConfig({
      ...config,
      custom_domains: [...config.custom_domains, newDomain]
    });
    setNewDomain('');
  };

  // Remove custom domain
  const removeCustomDomain = (domain) => {
    setConfig({
      ...config,
      custom_domains: config.custom_domains.filter(d => d !== domain)
    });
  };

  // Handle input change
  const handleInputChange = (field, value) => {
    // Handle nested fields
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      setConfig({
        ...config,
        [parent]: {
          ...config[parent],
          [child]: value
        }
      });
    } else {
      setConfig({
        ...config,
        [field]: value
      });
    }
  };
  // Load initial data and setup polling
  useEffect(() => {
    fetchConfig();
    fetchStatus();

    // Poll for status updates when deploying/updating/scaling/removing/draining
    const statusInterval = setInterval(() => {
      if (['deploying', 'updating', 'scaling', 'removing', 'draining'].includes(status.status)) {
        fetchStatus();
      }
      if (showDetailedStatus && status.mode === 'dedicated') {
        fetchDetailedStatus();
      }
    }, 5000);

    return () => clearInterval(statusInterval);
  }, [tenantId, token, showDetailedStatus, status.status, status.mode, fetchConfig, fetchStatus, fetchDetailedStatus]);
  // When switching to detailed status, fetch it immediately
  useEffect(() => {
    if (showDetailedStatus && status.mode === 'dedicated') {
      fetchDetailedStatus();
    }
  }, [showDetailedStatus, status.mode, fetchDetailedStatus]);

  // Initialize scaling replicas based on current count
  useEffect(() => {
    if (status.replicas) {
      setScalingReplicas(status.replicas);
    }
  }, [status.replicas]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Kubernetes Orchestration</h2>
        <Badge className={statusColors[status.status] || 'bg-gray-600'}>
          {status.status === 'not_deployed' ? 'Not Deployed' : status.status.charAt(0).toUpperCase() + status.status.slice(1)}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="config">Configuration</TabsTrigger>
          <TabsTrigger value="status">Deployment Status</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <Card>
            <CardHeader>
              <CardTitle>Orchestration Configuration</CardTitle>
              <CardDescription>
                Configure the orchestration settings for this tenant
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="mode">Orchestration Mode</Label>
                <Select
                  value={config.mode}
                  onValueChange={(value) => handleInputChange('mode', value)}
                  disabled={loading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="shared">Shared Infrastructure</SelectItem>
                    <SelectItem value="dedicated">Dedicated Instance</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-gray-500">
                  Shared mode uses the common infrastructure, while dedicated mode provisions a separate instance.
                </p>
              </div>

              {config.mode === 'dedicated' && (
                <>
                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="namespace">Dedicated Namespace (Optional)</Label>
                    <Input
                      id="namespace"
                      placeholder="tenant-namespace"
                      value={config.dedicated_namespace}
                      onChange={(e) => handleInputChange('dedicated_namespace', e.target.value)}
                      disabled={loading}
                    />
                    <p className="text-sm text-gray-500">
                      Custom Kubernetes namespace for your dedicated instance. If left blank, a default name will be used.
                    </p>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Resource Limits</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="cpu_request">CPU Request</Label>
                        <Input
                          id="cpu_request"
                          placeholder="100m"
                          value={config.resource_limits.cpu_request}
                          onChange={(e) => handleInputChange('resource_limits.cpu_request', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="cpu_limit">CPU Limit</Label>
                        <Input
                          id="cpu_limit"
                          placeholder="500m"
                          value={config.resource_limits.cpu_limit}
                          onChange={(e) => handleInputChange('resource_limits.cpu_limit', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="memory_request">Memory Request</Label>
                        <Input
                          id="memory_request"
                          placeholder="128Mi"
                          value={config.resource_limits.memory_request}
                          onChange={(e) => handleInputChange('resource_limits.memory_request', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="memory_limit">Memory Limit</Label>
                        <Input
                          id="memory_limit"
                          placeholder="512Mi"
                          value={config.resource_limits.memory_limit}
                          onChange={(e) => handleInputChange('resource_limits.memory_limit', e.target.value)}
                          disabled={loading}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end">
                      <Button 
                        onClick={updateResources} 
                        disabled={loading || status.status === 'not_deployed'}
                        variant="outline"
                      >
                        <SettingsIcon className="mr-2 h-4 w-4" />
                        Update Resources
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="autoscaling">Autoscaling</Label>
                      <Switch
                        id="autoscaling"
                        checked={config.autoscaling_enabled}
                        onCheckedChange={(checked) => handleInputChange('autoscaling_enabled', checked)}
                        disabled={loading}
                      />
                    </div>

                    {config.autoscaling_enabled && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="min_replicas">Min Replicas: {config.min_replicas}</Label>
                          </div>
                          <Slider
                            id="min_replicas"
                            min={1}
                            max={5}
                            step={1}
                            value={[config.min_replicas]}
                            onValueChange={([value]) => handleInputChange('min_replicas', value)}
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="max_replicas">Max Replicas: {config.max_replicas}</Label>
                          </div>
                          <Slider
                            id="max_replicas"
                            min={1}
                            max={20}
                            step={1}
                            value={[config.max_replicas]}
                            onValueChange={([value]) => handleInputChange('max_replicas', value)}
                            disabled={loading}
                          />
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label htmlFor="target_cpu">Target CPU Utilization: {config.target_cpu_utilization}%</Label>
                          </div>
                          <Slider
                            id="target_cpu"
                            min={10}
                            max={90}
                            step={5}
                            value={[config.target_cpu_utilization]}
                            onValueChange={([value]) => handleInputChange('target_cpu_utilization', value)}
                            disabled={loading}
                          />
                        </div>
                        
                        <div className="flex justify-end">
                          <Button 
                            onClick={updateAutoscaling} 
                            disabled={loading || status.status === 'not_deployed'}
                            variant="outline"
                          >
                            <GearIcon className="mr-2 h-4 w-4" />
                            Update Autoscaling
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Custom Domains</h3>
                    
                    <div className="flex space-x-2">
                      <Input
                        placeholder="example.com"
                        value={newDomain}
                        onChange={(e) => setNewDomain(e.target.value)}
                        disabled={loading}
                      />
                      <Button onClick={addCustomDomain} disabled={loading || !newDomain}>
                        Add
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {config.custom_domains.length === 0 ? (
                        <p className="text-sm text-gray-500">No custom domains configured</p>
                      ) : (
                        <div className="space-y-2">
                          {config.custom_domains.map((domain) => (
                            <div key={domain} className="flex items-center justify-between border p-2 rounded">
                              <span>{domain}</span>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeCustomDomain(domain)}
                                disabled={loading}
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button onClick={saveConfig} disabled={loading}>
                  {loading ? (
                    <>
                      <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                      Saving
                    </>
                  ) : (
                    <>
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Save Configuration
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Deployment Status</CardTitle>
                  <CardDescription>
                    Current status of the tenant's deployment
                  </CardDescription>
                </div>
                {status.mode === 'dedicated' && status.status !== 'not_deployed' && (
                  <Button 
                    variant="outline" 
                    onClick={() => setShowDetailedStatus(!showDetailedStatus)}
                  >
                    {showDetailedStatus ? 'Hide Details' : 'Show Details'}
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-md border p-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="font-medium">Status:</span>
                    <Badge className={statusColors[status.status] || 'bg-gray-600'}>
                      {status.status === 'not_deployed' ? 'Not Deployed' : status.status.charAt(0).toUpperCase() + status.status.slice(1)}
                    </Badge>
                  </div>
                  
                  {status.mode && (
                    <div className="flex justify-between">
                      <span className="font-medium">Mode:</span>
                      <span>{status.mode}</span>
                    </div>
                  )}
                  
                  {status.namespace && (
                    <div className="flex justify-between">
                      <span className="font-medium">Namespace:</span>
                      <span>{status.namespace}</span>
                    </div>
                  )}
                  
                  {status.version && (
                    <div className="flex justify-between">
                      <span className="font-medium">Version:</span>
                      <span>{status.version}</span>
                    </div>
                  )}
                  
                  {status.replicas !== undefined && (
                    <div className="flex justify-between">
                      <span className="font-medium">Replicas:</span>
                      <span>{status.ready_replicas || 0} / {status.replicas}</span>
                    </div>
                  )}
                  
                  {status.last_updated && (
                    <div className="flex justify-between">
                      <span className="font-medium">Last Updated:</span>
                      <span>{new Date(status.last_updated).toLocaleString()}</span>
                    </div>
                  )}
                  
                  {status.message && (
                    <div className="pt-2">
                      <span className="font-medium">Message:</span>
                      <p className="text-sm mt-1 text-gray-700">{status.message}</p>
                    </div>
                  )}
                </div>
              </div>

              {showDetailedStatus && detailedStatus && status.mode === 'dedicated' && (
                <>
                  {/* Metrics */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">Resource Metrics</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      <div className="p-4 border rounded-md">
                        <div className="text-sm text-gray-500">CPU Utilization</div>
                        <div className="text-2xl font-semibold">{detailedStatus.metrics.cpu_utilization}%</div>
                      </div>
                      <div className="p-4 border rounded-md">
                        <div className="text-sm text-gray-500">Memory Utilization</div>
                        <div className="text-2xl font-semibold">{detailedStatus.metrics.memory_utilization}%</div>
                      </div>
                      {detailedStatus.metrics.request_rate && (
                        <div className="p-4 border rounded-md">
                          <div className="text-sm text-gray-500">Request Rate</div>
                          <div className="text-2xl font-semibold">{detailedStatus.metrics.request_rate}/s</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pods */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="pods">
                      <AccordionTrigger>
                        Pod Statuses ({detailedStatus.pods?.length || 0})
                      </AccordionTrigger>
                      <AccordionContent>
                        {detailedStatus.pods?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Name</TableHead>
                                  <TableHead>Status</TableHead>
                                  <TableHead>Ready Containers</TableHead>
                                  <TableHead>Node</TableHead>
                                  <TableHead>Age</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detailedStatus.pods.map((pod) => (
                                  <TableRow key={pod.name}>
                                    <TableCell className="font-medium">{pod.name}</TableCell>
                                    <TableCell>
                                      <Badge 
                                        className={
                                          pod.status === 'Running' ? 'bg-green-600' : 
                                          pod.status === 'Pending' ? 'bg-yellow-600' : 'bg-red-600'
                                        }
                                      >
                                        {pod.status}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      {pod.containers?.filter(c => c.ready).length || 0} / {pod.containers?.length || 0}
                                    </TableCell>
                                    <TableCell>{pod.node_name || 'N/A'}</TableCell>
                                    <TableCell>
                                      {Math.floor((Date.now() - new Date(pod.creation_time).getTime()) / (1000 * 60))} min
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-2">No pods found</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>

                  {/* Events */}
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="events">
                      <AccordionTrigger>
                        Recent Events ({detailedStatus.events?.length || 0})
                      </AccordionTrigger>
                      <AccordionContent>
                        {detailedStatus.events?.length > 0 ? (
                          <div className="overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Type</TableHead>
                                  <TableHead>Reason</TableHead>
                                  <TableHead>Message</TableHead>
                                  <TableHead>Count</TableHead>
                                  <TableHead>Last Seen</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {detailedStatus.events.map((event, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      {event.type === 'Normal' ? 
                                        <CheckCircledIcon className="h-4 w-4 text-green-600" /> : 
                                        <CrossCircledIcon className="h-4 w-4 text-red-600" />}
                                    </TableCell>
                                    <TableCell className="font-medium">{event.reason}</TableCell>
                                    <TableCell>{event.message}</TableCell>
                                    <TableCell>{event.count}</TableCell>
                                    <TableCell>
                                      {new Date(event.last_seen).toLocaleString()}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500 py-2">No events found</p>
                        )}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </>
              )}

              {status.status === 'error' && (
                <Alert variant="destructive">
                  <AlertTitle>Deployment Error</AlertTitle>
                  <AlertDescription>
                    There was an error with your deployment. Please check the message above or contact support.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex flex-wrap justify-end space-x-2 gap-y-2 pt-4">
                {status.status === 'not_deployed' ? (
                  <Button onClick={deployInstance} disabled={loading || config.mode === 'shared'}>
                    <RocketIcon className="mr-2 h-4 w-4" />
                    Deploy Instance
                  </Button>
                ) : (
                  <>
                    {/* Scale Button */}
                    {status.mode === 'dedicated' && (
                      <Dialog open={isScaleDialogOpen} onOpenChange={setIsScaleDialogOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline"
                            disabled={loading || ['deploying', 'updating', 'scaling', 'removing'].includes(status.status)}
                          >
                            <GearIcon className="mr-2 h-4 w-4" />
                            Scale
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Scale Instance</DialogTitle>
                            <DialogDescription>
                              Adjust the number of replicas for this instance.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="py-4">
                            <div className="space-y-4">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="replicas">Replicas: {scalingReplicas}</Label>
                              </div>
                              <Slider
                                id="replicas"
                                min={1}
                                max={20}
                                step={1}
                                value={[scalingReplicas]}
                                onValueChange={([value]) => setScalingReplicas(value)}
                              />
                            </div>
                          </div>
                          <DialogFooter>
                            <Button variant="outline" onClick={() => setIsScaleDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button onClick={scaleInstance} disabled={loading}>
                              Scale
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Drain Button */}
                    {status.mode === 'dedicated' && (
                      <Button 
                        variant="secondary"
                        onClick={drainInstance}
                        disabled={loading || ['deploying', 'updating', 'scaling', 'removing', 'draining'].includes(status.status)}
                      >
                        <ClockIcon className="mr-2 h-4 w-4" />
                        Drain
                      </Button>
                    )}
                    
                    <Button 
                      onClick={saveConfig} 
                      disabled={loading || ['deploying', 'updating', 'scaling', 'removing'].includes(status.status)}
                    >
                      <SettingsIcon className="mr-2 h-4 w-4" />
                      Update Configuration
                    </Button>
                    
                    <Button 
                      variant="destructive" 
                      onClick={removeInstance} 
                      disabled={loading || ['deploying', 'updating', 'scaling', 'removing'].includes(status.status)}
                    >
                      <TrashIcon className="mr-2 h-4 w-4" />
                      Remove Instance
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrchestrationSettings;
