import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Settings,
  Brain,
  Zap,
  Clock,
  Target,
  Sliders,
  Save,
  RotateCcw,
  Info,
} from 'lucide-react';
import { useAIConfig, useUpdateAIConfig } from '@/hooks/useAIMetrics';
import { toast } from 'sonner';

interface AIConfigurationProps {
  className?: string;
}

export default function AIConfiguration({ className = '' }: AIConfigurationProps) {
  const { data: config, isLoading } = useAIConfig();
  const updateConfigMutation = useUpdateAIConfig();

  // Local state for form controls
  const [localConfig, setLocalConfig] = React.useState({
    ai_enabled: true,
    confidence_threshold: 0.75,
    learning_rate: 0.001,
    training_interval: 3600,
    algorithm_preference: 'neural_network',
    auto_scaling: true,
    prediction_window: 60,
    max_retries: 3,
    model_version: 'latest',
    batch_size: 32,
    memory_limit: 4096,
  });

  // Update local state when config loads
  React.useEffect(() => {
    if (config) {
      setLocalConfig({
        ai_enabled: config.enabled ?? true,
        confidence_threshold: config.confidence_threshold ?? 0.75,
        learning_rate: config.learning_rate ?? 0.001,
        training_interval: typeof config.training_interval === 'string' ? 
          parseInt(config.training_interval, 10) : config.training_interval ?? 3600,
        algorithm_preference: config.algorithm_preference ?? 'neural_network',
        auto_scaling: config.auto_scaling ?? true,
        prediction_window: typeof config.prediction_window === 'string' ? 
          parseInt(config.prediction_window, 10) : config.prediction_window ?? 60,
        max_retries: config.max_retries ?? 3,
        model_version: config.model_version ?? 'latest',
        batch_size: config.batch_size ?? 32,
        memory_limit: config.memory_limit ?? 4096,
      });
    }
  }, [config]);

  const handleSaveConfig = async () => {
    try {
      await updateConfigMutation.mutateAsync(localConfig);
      toast.success('AI configuration updated successfully');
    } catch (error) {
      toast.error('Failed to update AI configuration');
    }
  };

  const handleResetConfig = () => {
    if (config) {
      setLocalConfig({
        ai_enabled: config.enabled ?? true,
        confidence_threshold: config.confidence_threshold ?? 0.75,
        learning_rate: config.learning_rate ?? 0.001,
        training_interval: typeof config.training_interval === 'string' ? 
          parseInt(config.training_interval, 10) : config.training_interval ?? 3600,
        algorithm_preference: config.algorithm_preference ?? 'neural_network',
        auto_scaling: config.auto_scaling ?? true,
        prediction_window: typeof config.prediction_window === 'string' ? 
          parseInt(config.prediction_window, 10) : config.prediction_window ?? 60,
        max_retries: config.max_retries ?? 3,
        model_version: config.model_version ?? 'latest',
        batch_size: config.batch_size ?? 32,
        memory_limit: config.memory_limit ?? 4096,
      });
    }
  };

  const formatTrainingInterval = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    return `${Math.floor(seconds / 3600)}h`;
  };

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="space-y-2">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            AI Configuration
          </CardTitle>
          <CardDescription>
            Configure AI/ML parameters, thresholds, and algorithm preferences
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        {/* General Configuration */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                General AI Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* AI Enable/Disable */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Enable AI System</Label>
                  <p className="text-sm text-muted-foreground">
                    Turn on/off the entire AI load balancing system
                  </p>
                </div>
                <Switch
                  checked={localConfig.ai_enabled}
                  onCheckedChange={(checked) =>
                    setLocalConfig(prev => ({ ...prev, ai_enabled: checked }))
                  }
                />
              </div>

              {/* Auto Scaling */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Auto Scaling</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically scale infrastructure based on AI predictions
                  </p>
                </div>
                <Switch
                  checked={localConfig.auto_scaling}
                  onCheckedChange={(checked) =>
                    setLocalConfig(prev => ({ ...prev, auto_scaling: checked }))
                  }
                />
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-3">
                <Label className="text-base">Confidence Threshold</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.confidence_threshold * 100]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, confidence_threshold: value / 100 }))
                    }
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0%</span>
                    <span className="font-medium">
                      {(localConfig.confidence_threshold * 100).toFixed(0)}%
                    </span>
                    <span>100%</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Minimum confidence level required for AI recommendations
                </p>
              </div>

              {/* Prediction Window */}
              <div className="space-y-3">
                <Label className="text-base">Prediction Window</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.prediction_window]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, prediction_window: value }))
                    }
                    max={180}
                    min={15}
                    step={15}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>15 min</span>
                    <span className="font-medium">
                      {localConfig.prediction_window} minutes
                    </span>
                    <span>3 hours</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Time horizon for load predictions and scaling decisions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Configuration */}
        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                Model Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Algorithm Preference */}
              <div className="space-y-3">
                <Label className="text-base">Preferred Algorithm</Label>
                <Select
                  value={localConfig.algorithm_preference}
                  onValueChange={(value) =>
                    setLocalConfig(prev => ({ ...prev, algorithm_preference: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="neural_network">Neural Network</SelectItem>
                    <SelectItem value="reinforcement_learning">Reinforcement Learning</SelectItem>
                    <SelectItem value="ensemble">Ensemble Method</SelectItem>
                    <SelectItem value="decision_tree">Decision Tree</SelectItem>
                    <SelectItem value="svm">Support Vector Machine</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Primary algorithm for load balancing decisions
                </p>
              </div>

              {/* Model Version */}
              <div className="space-y-3">
                <Label className="text-base">Model Version</Label>
                <Select
                  value={localConfig.model_version}
                  onValueChange={(value) =>
                    setLocalConfig(prev => ({ ...prev, model_version: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="latest">Latest (v2.1.3)</SelectItem>
                    <SelectItem value="stable">Stable (v2.0.8)</SelectItem>
                    <SelectItem value="v1.9.5">Legacy (v1.9.5)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Model version to use for predictions
                </p>
              </div>

              {/* Training Interval */}
              <div className="space-y-3">
                <Label className="text-base">Training Interval</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.training_interval]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, training_interval: value }))
                    }
                    max={86400}
                    min={900}
                    step={900}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>15m</span>
                    <span className="font-medium">
                      {formatTrainingInterval(localConfig.training_interval)}
                    </span>
                    <span>24h</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  How often models should retrain with new data
                </p>
              </div>

              {/* Learning Rate */}
              <div className="space-y-3">
                <Label className="text-base">Learning Rate</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.learning_rate * 1000]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, learning_rate: value / 1000 }))
                    }
                    max={10}
                    min={0.1}
                    step={0.1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>0.0001</span>
                    <span className="font-medium">
                      {localConfig.learning_rate.toFixed(4)}
                    </span>
                    <span>0.01</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Learning rate for neural network training
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Configuration */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Performance Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Batch Size */}
              <div className="space-y-3">
                <Label className="text-base">Batch Size</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.batch_size]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, batch_size: value }))
                    }
                    max={128}
                    min={8}
                    step={8}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>8</span>
                    <span className="font-medium">{localConfig.batch_size}</span>
                    <span>128</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Number of samples processed in each training batch
                </p>
              </div>

              {/* Memory Limit */}
              <div className="space-y-3">
                <Label className="text-base">Memory Limit (MB)</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.memory_limit]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, memory_limit: value }))
                    }
                    max={16384}
                    min={1024}
                    step={512}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1 GB</span>
                    <span className="font-medium">
                      {(localConfig.memory_limit / 1024).toFixed(1)} GB
                    </span>
                    <span>16 GB</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum memory allocation for AI processing
                </p>
              </div>

              {/* Max Retries */}
              <div className="space-y-3">
                <Label className="text-base">Max Retries</Label>
                <div className="space-y-2">
                  <Slider
                    value={[localConfig.max_retries]}
                    onValueChange={([value]) =>
                      setLocalConfig(prev => ({ ...prev, max_retries: value }))
                    }
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>1</span>
                    <span className="font-medium">{localConfig.max_retries}</span>
                    <span>10</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  Maximum retry attempts for failed predictions
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Configuration */}
        <TabsContent value="advanced" className="space-y-6">
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Advanced settings should only be modified by experienced users. 
              Incorrect values may impact system performance.
            </AlertDescription>
          </Alert>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sliders className="h-5 w-5" />
                Advanced Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* JSON Configuration Editor */}
              <div className="space-y-3">
                <Label className="text-base">Raw Configuration (JSON)</Label>
                <textarea
                  className="w-full h-64 p-3 border rounded-md font-mono text-sm"
                  value={JSON.stringify(localConfig, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value);
                      setLocalConfig(parsed);
                    } catch {
                      // Invalid JSON, ignore
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  Direct JSON editing for advanced configuration
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save/Reset Actions */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 justify-end">
            <Button 
              variant="outline" 
              onClick={handleResetConfig}
              disabled={updateConfigMutation.isPending}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
            >
              <Save className="h-4 w-4 mr-2" />
              {updateConfigMutation.isPending ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
