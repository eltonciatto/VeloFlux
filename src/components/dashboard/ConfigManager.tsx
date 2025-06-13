
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Save, RefreshCw, Settings, Shield, Globe } from 'lucide-react';
import { useConfig } from '@/hooks/use-api';

export const ConfigManager = () => {
  const { data } = useConfig();
  const [config, setConfig] = useState(data as any || {
    global: {
      bind_address: '0.0.0.0:80',
      tls_bind_address: '0.0.0.0:443',
      metrics_address: '0.0.0.0:8080'
    },
    pools: [
      {
        name: 'web-servers',
        algorithm: 'round_robin',
        sticky_sessions: true,
        backends: [
          { address: 'backend-1:80', weight: 100 },
          { address: 'backend-2:80', weight: 100 }
        ]
      }
    ]
  });

  useEffect(() => {
    if (data) setConfig(data as any);
  }, [data]);

  const [yamlConfig, setYamlConfig] = useState(`global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"
          
      - address: "backend-2:80"
        weight: 100
        health_check:
          path: "/health"
          interval: "15s"`);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Configuration Management</h2>
        <div className="flex gap-3">
          <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
            <RefreshCw className="w-4 h-4 mr-2" />
            Reload Config
          </Button>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="bg-white/10 border-white/20">
          <TabsTrigger value="visual" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Visual Editor
          </TabsTrigger>
          <TabsTrigger value="yaml" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            YAML Editor
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="w-4 h-4" />
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent value="visual">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Global Settings */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Global Settings</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="bind-address" className="text-white">Bind Address</Label>
                  <Input 
                    id="bind-address"
                    value={config.global.bind_address}
                    onChange={(e) => setConfig({
                      ...config,
                      global: { ...config.global, bind_address: e.target.value }
                    })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="tls-address" className="text-white">TLS Bind Address</Label>
                  <Input 
                    id="tls-address"
                    value={config.global.tls_bind_address}
                    onChange={(e) => setConfig({
                      ...config,
                      global: { ...config.global, tls_bind_address: e.target.value }
                    })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="metrics-address" className="text-white">Metrics Address</Label>
                  <Input 
                    id="metrics-address"
                    value={config.global.metrics_address}
                    onChange={(e) => setConfig({
                      ...config,
                      global: { ...config.global, metrics_address: e.target.value }
                    })}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </Card>

            {/* Pool Configuration */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Backend Pools</h3>
              </div>
              <div className="p-6">
                {config.pools.map((pool, poolIndex) => (
                  <div key={poolIndex} className="space-y-4 p-4 bg-white/5 rounded-lg">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-white">{pool.name}</h4>
                      <Badge className="bg-blue-100/10 text-blue-300">
                        {pool.algorithm}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {pool.backends.map((backend, backendIndex) => (
                        <div key={backendIndex} className="flex items-center justify-between p-2 bg-white/5 rounded">
                          <span className="text-white">{backend.address}</span>
                          <span className="text-blue-200">Weight: {backend.weight}</span>
                        </div>
                      ))}
                    </div>
                    <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                      Edit Pool
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="yaml">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <div className="p-6 border-b border-white/10">
              <h3 className="text-xl font-bold text-white">YAML Configuration</h3>
            </div>
            <div className="p-6">
              <Textarea 
                value={yamlConfig}
                onChange={(e) => setYamlConfig(e.target.value)}
                className="min-h-[400px] bg-black/20 border-white/20 text-white font-mono text-sm"
                placeholder="Enter YAML configuration..."
              />
              <div className="flex justify-between items-center mt-4">
                <Badge className="bg-green-100/10 text-green-300">
                  Valid YAML
                </Badge>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Validate
                  </Button>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Apply
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">TLS Configuration</h3>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-white">Auto Certificate</span>
                  <Badge className="bg-green-100/10 text-green-300">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">ACME Email</span>
                  <span className="text-blue-200">admin@example.com</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white">Certificate Directory</span>
                  <span className="text-blue-200">/etc/ssl/certs/veloflux</span>
                </div>
              </div>
            </Card>

            <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
              <div className="p-6 border-b border-white/10">
                <h3 className="text-xl font-bold text-white">Rate Limiting</h3>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <Label htmlFor="rps" className="text-white">Requests per Second</Label>
                  <Input 
                    id="rps"
                    defaultValue="100"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="burst" className="text-white">Burst Size</Label>
                  <Input 
                    id="burst"
                    defaultValue="200"
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
