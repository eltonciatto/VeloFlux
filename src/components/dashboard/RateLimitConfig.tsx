import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Gauge, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { RateLimitConfigProps, RateLimitConfig as RateLimitConfigType } from './RateLimitUtils';

export const RateLimitConfig: React.FC<RateLimitConfigProps> = ({ tenantId }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<RateLimitConfigType>({
    enabled: true,
    requestsPerSecond: 100,
    burstSize: 200,
    ipBasedLimiting: true,
    responseCode: 429,
    excludePaths: [],
    excludeIps: []
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);  const [newExcludePath, setNewExcludePath] = useState('');
  const [newExcludeIp, setNewExcludeIp] = useState('');

  const fetchRateLimitConfig = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '/api/rate-limit';
      if (tenantId) {
        endpoint = `/api/tenants/${tenantId}/rate-limit`;
      }
      
      const data = await apiFetch(endpoint);
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch rate limit config', error);
      toast({
        title: 'Error',
        description: 'Failed to load rate limit configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);
  const updateConfig = useCallback(async () => {
    try {
      setSaving(true);
      let endpoint = '/api/rate-limit';
      
      if (tenantId) {
        endpoint = `/api/tenants/${tenantId}/rate-limit`;
      }
      
      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      
      toast({
        title: 'Success',
        description: 'Rate limit configuration updated',
      });
    } catch (error) {
      console.error('Failed to update rate limit config', error);
      toast({
        title: 'Error',
        description: 'Failed to update rate limit configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [tenantId, config, toast]);

  const handleToggleChange = useCallback((field: string) => (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: checked
    }));
  }, []);

  const handleInputChange = useCallback((field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10);
    if (!isNaN(value) && value > 0) {
      setConfig(prev => ({
        ...prev,
        [field]: value
      }));
    }
  }, []);

  const handleSliderChange = useCallback((field: string) => (value: number[]) => {
    setConfig(prev => ({
      ...prev,
      [field]: value[0]
    }));
  }, []);
  const addExcludePath = useCallback(() => {
    if (newExcludePath && !config.excludePaths.includes(newExcludePath)) {
      setConfig(prev => ({
        ...prev,
        excludePaths: [...prev.excludePaths, newExcludePath]
      }));
      setNewExcludePath('');
    }
  }, [newExcludePath, config.excludePaths]);

  const removeExcludePath = useCallback((path: string) => {
    setConfig(prev => ({
      ...prev,
      excludePaths: prev.excludePaths.filter(p => p !== path)
    }));
  }, []);

  const addExcludeIp = useCallback(() => {
    if (newExcludeIp && !config.excludeIps.includes(newExcludeIp)) {
      setConfig(prev => ({
        ...prev,
        excludeIps: [...prev.excludeIps, newExcludeIp]
      }));
      setNewExcludeIp('');
    }
  }, [newExcludeIp, config.excludeIps]);

  const removeExcludeIp = useCallback((ip: string) => {
    setConfig(prev => ({
      ...prev,
      excludeIps: prev.excludeIps.filter(i => i !== ip)
    }));
  }, []);

  useEffect(() => {
    fetchRateLimitConfig();
  }, [fetchRateLimitConfig]);

  if (loading) {
    return (
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="flex justify-center items-center h-40">
          <p className="text-blue-200">Loading rate limit configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Gauge className="h-6 w-6 mr-3 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Rate Limiting</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="rate-limit-enabled" className="text-white">Status</Label>
          <Switch 
            id="rate-limit-enabled"
            checked={config.enabled}
            onCheckedChange={handleToggleChange('enabled')}
          />
          <span className={config.enabled ? 'text-green-400' : 'text-red-400'}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>

      <div className="mb-6 space-y-4">
        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="requests-per-second" className="text-white">Requests Per Second</Label>
            <span className="text-blue-200 text-sm">{config.requestsPerSecond} req/s</span>
          </div>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-10">
              <Slider
                id="requests-per-second"
                min={10}
                max={1000}
                step={10}
                value={[config.requestsPerSecond]}
                onValueChange={handleSliderChange('requestsPerSecond')}
                disabled={!config.enabled}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={config.requestsPerSecond}
                onChange={handleInputChange('requestsPerSecond')}
                className="bg-white/10 border-white/20 text-white"
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <Label htmlFor="burst-size" className="text-white">Burst Size</Label>
            <span className="text-blue-200 text-sm">Allows {config.burstSize} req/burst</span>
          </div>
          <div className="grid grid-cols-12 gap-4 items-center">
            <div className="col-span-10">
              <Slider
                id="burst-size"
                min={50}
                max={2000}
                step={50}
                value={[config.burstSize]}
                onValueChange={handleSliderChange('burstSize')}
                disabled={!config.enabled}
              />
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                value={config.burstSize}
                onChange={handleInputChange('burstSize')}
                className="bg-white/10 border-white/20 text-white"
                disabled={!config.enabled}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Switch 
            id="ip-based-limiting"
            checked={config.ipBasedLimiting}
            onCheckedChange={handleToggleChange('ipBasedLimiting')}
            disabled={!config.enabled}
          />
          <div>
            <Label htmlFor="ip-based-limiting" className="text-white">IP-Based Rate Limiting</Label>
            <p className="text-sm text-blue-200">Apply limits per client IP address instead of globally</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Label htmlFor="response-code" className="text-white">HTTP Response Code</Label>
          <Input
            id="response-code"
            type="number"
            value={config.responseCode}
            onChange={handleInputChange('responseCode')}
            className="bg-white/10 border-white/20 text-white w-24"
            disabled={!config.enabled}
          />
          <p className="text-sm text-blue-200">Status code sent when rate limit is exceeded</p>
        </div>
      </div>

      {config.enabled && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Label className="text-white mb-2 block">Exclude Paths</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="/api/health"
                value={newExcludePath}
                onChange={(e) => setNewExcludePath(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Button onClick={addExcludePath} className="bg-blue-600 hover:bg-blue-700">Add</Button>
            </div>
            <div className="bg-white/5 rounded-md p-2 max-h-32 overflow-y-auto">
              {config.excludePaths.length === 0 ? (
                <p className="text-blue-200/60 text-sm">No excluded paths</p>
              ) : (
                <ul className="space-y-1">
                  {config.excludePaths.map((path, index) => (
                    <li key={index} className="flex justify-between items-center text-blue-200 text-sm p-1 rounded hover:bg-white/5">
                      {path}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExcludePath(path)}
                        className="h-6 w-6 p-0 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          
          <div>
            <Label className="text-white mb-2 block">Exclude IPs</Label>
            <div className="flex space-x-2 mb-2">
              <Input
                placeholder="192.168.1.1"
                value={newExcludeIp}
                onChange={(e) => setNewExcludeIp(e.target.value)}
                className="bg-white/10 border-white/20 text-white"
              />
              <Button onClick={addExcludeIp} className="bg-blue-600 hover:bg-blue-700">Add</Button>
            </div>
            <div className="bg-white/5 rounded-md p-2 max-h-32 overflow-y-auto">
              {config.excludeIps.length === 0 ? (
                <p className="text-blue-200/60 text-sm">No excluded IPs</p>
              ) : (
                <ul className="space-y-1">
                  {config.excludeIps.map((ip, index) => (
                    <li key={index} className="flex justify-between items-center text-blue-200 text-sm p-1 rounded hover:bg-white/5">
                      {ip}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeExcludeIp(ip)}
                        className="h-6 w-6 p-0 rounded-full text-red-400 hover:text-red-300 hover:bg-red-900/30"
                      >
                        &times;
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-md mb-6">
        <div className="flex items-start">
          <AlertTriangle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">Rate Limit Warning</h3>
            <p className="text-amber-200/80 text-sm">
              Setting rate limits too low may affect legitimate users. Monitor your traffic patterns to find the right balance between security and user experience.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={updateConfig}
          disabled={saving}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </Card>
  );
};

export default RateLimitConfig;
