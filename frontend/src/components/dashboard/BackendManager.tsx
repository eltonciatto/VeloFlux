
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBackends, useAddBackend, useDeleteBackend } from '@/hooks/use-api';

interface Backend {
  id: string;
  address: string;
  pool: string;
  weight: number;
  region: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
}

export const BackendManager = () => {
  const { toast } = useToast();
  const { data: backends = [], refetch } = useBackends();
  const addBackendMutation = useAddBackend();
  const deleteBackendMutation = useDeleteBackend();

  const [newBackend, setNewBackend] = useState({
    address: '',
    pool: 'web-servers',
    weight: 100,
    region: 'us-east-1'
  });

  const addBackend = async () => {
    if (!newBackend.address) {
      toast({
        title: 'Error',
        description: 'Backend address is required',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addBackendMutation.mutateAsync({
        pool: newBackend.pool,
        backend: {
          address: newBackend.address,
          weight: newBackend.weight,
          region: newBackend.region,
        },
      });
      setNewBackend({
        address: '',
        pool: 'web-servers',
        weight: 100,
        region: 'us-east-1',
      });
      toast({ title: 'Backend Added' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const removeBackend = async (b: Backend) => {
    try {
      await deleteBackendMutation.mutateAsync({
        pool: b.pool,
        address: b.address,
      });
      toast({ title: 'Backend Removed' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const saveConfiguration = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Backend configuration has been updated',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100/10 text-green-300 border-green-400/30',
      unhealthy: 'bg-red-100/10 text-red-300 border-red-400/30',
      unknown: 'bg-yellow-100/10 text-yellow-300 border-yellow-400/30'
    };
    return variants[status as keyof typeof variants] || variants.unknown;
  };

  return (
    <div className="space-y-6">
      {/* Add New Backend */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Backend
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="address" className="text-blue-200">Address</Label>
              <Input
                id="address"
                value={newBackend.address}
                onChange={(e) => setNewBackend({ ...newBackend, address: e.target.value })}
                placeholder="backend-3:80"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="pool" className="text-blue-200">Pool</Label>
              <Select value={newBackend.pool} onValueChange={(value) => setNewBackend({ ...newBackend, pool: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-servers">Web Servers</SelectItem>
                  <SelectItem value="api-servers">API Servers</SelectItem>
                  <SelectItem value="static-assets">Static Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight" className="text-blue-200">Weight</Label>
              <Input
                id="weight"
                type="number"
                value={newBackend.weight}
                onChange={(e) => setNewBackend({ ...newBackend, weight: parseInt(e.target.value) || 100 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="region" className="text-blue-200">Region</Label>
              <Select value={newBackend.region} onValueChange={(value) => setNewBackend({ ...newBackend, region: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">US East 1</SelectItem>
                  <SelectItem value="us-west-1">US West 1</SelectItem>
                  <SelectItem value="eu-west-1">EU West 1</SelectItem>
                  <SelectItem value="ap-southeast-1">AP Southeast 1</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={addBackend} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Backend
          </Button>
        </div>
      </Card>

      {/* Backend List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Configured Backends</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={saveConfiguration} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {backends.map((backend) => (
              <div key={backend.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="font-semibold text-white">{backend.address}</div>
                    <div className="text-sm text-blue-200">Pool: {backend.pool} • Region: {backend.region}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-blue-200">Weight</div>
                    <div className="font-semibold text-white">{backend.weight}</div>
                  </div>

                  <Badge className={getStatusBadge(backend.status)}>
                    {backend.status}
                  </Badge>

                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="border-red-400/30 text-red-300 hover:bg-red-600/20"
                    onClick={() => removeBackend(backend)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BackendManager;
