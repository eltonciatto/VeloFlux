import React, { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Info, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { WAFConfigProps, WAFConfigType } from './WAFUtils';

export const WAFConfig: React.FC<WAFConfigProps> = ({ tenantId }) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<WAFConfigType>({
    enabled: true,
    level: 'standard',
    customRules: [],
    blockingMode: true,
    logging: true
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchWAFConfig = useCallback(async () => {
    try {
      setLoading(true);
      let endpoint = '/api/waf/config';
      
      if (tenantId) {
        endpoint = `/api/tenants/${tenantId}/waf/config`;
      }
      
      const data = await apiFetch(endpoint);
      setConfig(data);
    } catch (error) {
      console.error('Failed to fetch WAF config', error);
      toast({
        title: 'Error',
        description: 'Failed to load WAF configuration',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, toast]);
  
  useEffect(() => {
    fetchWAFConfig();
  }, [fetchWAFConfig]);

  const updateConfig = async () => {
    try {
      setSaving(true);
      let endpoint = '/api/waf/config';
      
      if (tenantId) {
        endpoint = `/api/tenants/${tenantId}/waf/config`;
      }
      
      await apiFetch(endpoint, {
        method: 'PUT',
        body: JSON.stringify(config),
      });
      
      toast({
        title: 'Success',
        description: 'WAF configuration updated',
      });
    } catch (error) {
      console.error('Failed to update WAF config', error);
      toast({
        title: 'Error',
        description: 'Failed to update WAF configuration',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleToggleChange = (field: string) => (checked: boolean) => {
    setConfig(prev => ({
      ...prev,
      [field]: checked
    }));
  };

  const handleSelectChange = (field: string) => (value: string) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const levelDescriptions = {
    'basic': 'Protects against critical vulnerabilities only (SQL injection, XSS)',
    'standard': 'Balanced protection against common attack vectors with minimal false positives',
    'strict': 'Maximum security with all rules enabled (may cause false positives)'
  };

  if (loading) {
    return (
      <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="flex justify-center items-center h-40">
          <p className="text-blue-200">Loading WAF configuration...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <ShieldCheck className="h-6 w-6 mr-3 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Web Application Firewall</h2>
        </div>
        <div className="flex items-center space-x-2">
          <Label htmlFor="waf-enabled" className="text-white">WAF Status</Label>
          <Switch 
            id="waf-enabled"
            checked={config.enabled}
            onCheckedChange={handleToggleChange('enabled')}
          />
          <span className={config.enabled ? 'text-green-400' : 'text-red-400'}>
            {config.enabled ? 'Enabled' : 'Disabled'}
          </span>
        </div>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="protection-level" className="text-white mb-2 block">Protection Level</Label>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            value={config.level}
            onValueChange={handleSelectChange('level')}
            disabled={!config.enabled}
          >
            <SelectTrigger id="protection-level" className="bg-white/10 border-white/20 text-white">
              <SelectValue placeholder="Select level" />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700 text-white">
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="standard">Standard</SelectItem>
              <SelectItem value="strict">Strict</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="md:col-span-2 flex items-center">
            <Info className="h-4 w-4 text-blue-400 mr-2 flex-shrink-0" />
            <p className="text-sm text-blue-200">
              {levelDescriptions[config.level as keyof typeof levelDescriptions] || 'Select a protection level'}
            </p>
          </div>
        </div>
      </div>
      
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center space-x-2">
          <Switch 
            id="blocking-mode"
            checked={config.blockingMode}
            onCheckedChange={handleToggleChange('blockingMode')}
            disabled={!config.enabled}
          />
          <div>
            <Label htmlFor="blocking-mode" className="text-white">Blocking Mode</Label>
            <p className="text-sm text-blue-200">When enabled, malicious requests will be blocked. Otherwise, only detection occurs.</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch 
            id="waf-logging"
            checked={config.logging}
            onCheckedChange={handleToggleChange('logging')}
            disabled={!config.enabled}
          />
          <div>
            <Label htmlFor="waf-logging" className="text-white">Detailed Logging</Label>
            <p className="text-sm text-blue-200">Log detailed information about detected attacks</p>
          </div>
        </div>
      </div>
      
      <div className="bg-amber-900/20 border border-amber-500/30 p-4 rounded-md mb-6">
        <div className="flex items-start">
          <AlertCircle className="h-5 w-5 text-amber-400 mr-2 mt-0.5" />
          <div>
            <h3 className="text-amber-400 font-medium">Protection Notice</h3>
            <p className="text-amber-200/80 text-sm">
              The WAF provides a layer of security against common web attacks. However, it's recommended to implement additional security measures for comprehensive protection.
            </p>
          </div>
        </div>
      </div>
      
      <div className="flex justify-end">
        <Button 
          onClick={updateConfig}
          disabled={saving || !config.enabled}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {saving ? 'Saving...' : 'Save Configuration'}
        </Button>
      </div>
    </Card>
  );
};

export default WAFConfig;
