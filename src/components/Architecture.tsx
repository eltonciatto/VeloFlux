
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  Globe, 
  Shield, 
  Database,
  Monitor,
  Layers,
  Network,
  Box
} from 'lucide-react';

export const Architecture = () => {
  const { t } = useTranslation();
  
  return (
    <section className="py-20 px-4 bg-black/20">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('architecture.title')}
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            {t('architecture.description')}
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-3 mb-12 bg-white/5 border-white/10">
            <TabsTrigger value="overview" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              {t('architecture.tabs.overview')}
            </TabsTrigger>
            <TabsTrigger value="components" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              {t('architecture.tabs.components')}
            </TabsTrigger>
            <TabsTrigger value="deployment" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              {t('architecture.tabs.deployment')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div>
                  <h3 className="text-2xl font-bold text-white mb-4">{t('architecture.globalLoadBalancing.title')}</h3>
                  <p className="text-blue-200 mb-6">
                    {t('architecture.globalLoadBalancing.description')}
                  </p>
                  
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Globe className="w-6 h-6 text-blue-400" />
                      <span className="text-white">{t('architecture.globalLoadBalancing.features.multiRegion')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Shield className="w-6 h-6 text-green-400" />
                      <span className="text-white">{t('architecture.globalLoadBalancing.features.autoFailover')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Network className="w-6 h-6 text-purple-400" />
                      <span className="text-white">{t('architecture.globalLoadBalancing.features.protocolAware')}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 rounded-lg p-6">
                  <div className="text-center mb-6">
                    <div className="text-blue-300 text-sm mb-2">{t('architecture.clientRequestFlow.title')}</div>
                    <div className="h-px bg-gradient-to-r from-transparent via-blue-400 to-transparent"></div>
                  </div>
                  
                  <div className="space-y-4 text-sm">
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                      <span className="text-blue-200">1. {t('architecture.clientRequestFlow.steps.dnsResolution')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-blue-200">2. {t('architecture.clientRequestFlow.steps.tlsTermination')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                      <span className="text-blue-200">3. {t('architecture.clientRequestFlow.steps.healthCheck')}</span>
                    </div>
                    <div className="flex items-center gap-3 p-2 bg-white/5 rounded">
                      <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                      <span className="text-blue-200">4. {t('architecture.clientRequestFlow.steps.backendProxy')}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="components" className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Layers className="w-8 h-8 text-blue-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Router Module</h3>
                <p className="text-blue-200 text-sm mb-3">
                  TLS termination, SNI routing, HTTP/3 support, sticky sessions
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-blue-100/10 text-blue-300 text-xs">SNI</Badge>
                  <Badge className="bg-blue-100/10 text-blue-300 text-xs">HTTP/3</Badge>
                  <Badge className="bg-blue-100/10 text-blue-300 text-xs">Sticky</Badge>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Server className="w-8 h-8 text-green-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Balancer Engine</h3>
                <p className="text-blue-200 text-sm mb-3">
                  Multiple algorithms: round-robin, least-conn, IP-hash, geo-proximity
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-green-100/10 text-green-300 text-xs">Round Robin</Badge>
                  <Badge className="bg-green-100/10 text-green-300 text-xs">Least Conn</Badge>
                  <Badge className="bg-green-100/10 text-green-300 text-xs">Geo-Prox</Badge>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Monitor className="w-8 h-8 text-yellow-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Health Monitor</h3>
                <p className="text-blue-200 text-sm mb-3">
                  Active/passive health checks, auto-quarantine, exponential backoff
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-yellow-100/10 text-yellow-300 text-xs">Active</Badge>
                  <Badge className="bg-yellow-100/10 text-yellow-300 text-xs">Passive</Badge>
                  <Badge className="bg-yellow-100/10 text-yellow-300 text-xs">Auto-heal</Badge>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Database className="w-8 h-8 text-purple-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">State Store</h3>
                <p className="text-blue-200 text-sm mb-3">
                  In-memory Raft consensus or Redis Sentinel for distributed state
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-purple-100/10 text-purple-300 text-xs">Raft</Badge>
                  <Badge className="bg-purple-100/10 text-purple-300 text-xs">Redis</Badge>
                  <Badge className="bg-purple-100/10 text-purple-300 text-xs">Consensus</Badge>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Shield className="w-8 h-8 text-red-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Security Layer</h3>
                <p className="text-blue-200 text-sm mb-3">
                  Rate limiting, WAF hooks, mTLS upstream, IP filtering
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-red-100/10 text-red-300 text-xs">Rate Limit</Badge>
                  <Badge className="bg-red-100/10 text-red-300 text-xs">WAF</Badge>
                  <Badge className="bg-red-100/10 text-red-300 text-xs">mTLS</Badge>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <Box className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Metrics & Logs</h3>
                <p className="text-blue-200 text-sm mb-3">
                  Prometheus metrics, structured JSON logs, real-time diagnostics
                </p>
                <div className="flex flex-wrap gap-1">
                  <Badge className="bg-indigo-100/10 text-indigo-300 text-xs">Prometheus</Badge>
                  <Badge className="bg-indigo-100/10 text-indigo-300 text-xs">JSON Logs</Badge>
                  <Badge className="bg-indigo-100/10 text-indigo-300 text-xs">SSE</Badge>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="deployment" className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <h3 className="text-xl font-bold text-white mb-4">Container Deployment</h3>
                <p className="text-blue-200 mb-4">
                  Single multi-stage Dockerfile with minimal attack surface
                </p>
                
                <div className="bg-black/30 rounded-lg p-4 font-mono text-sm overflow-x-auto">
                  <div className="text-green-400"># Build stage</div>
                  <div className="text-blue-200">FROM golang:1.22-alpine AS builder</div>
                  <div className="text-blue-200">COPY . /src</div>
                  <div className="text-blue-200">RUN go build -o veloflux-lb ./cmd/velofluxlb</div>
                  <div className="text-green-400 mt-2"># Runtime stage</div>
                  <div className="text-blue-200">FROM scratch</div>
                  <div className="text-blue-200">COPY --from=builder /src/veloflux-lb /</div>
                  <div className="text-blue-200">ENTRYPOINT ["/veloflux-lb"]</div>
                </div>
              </Card>

              <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
                <h3 className="text-xl font-bold text-white mb-4">Multi-Region Setup</h3>
                <p className="text-blue-200 mb-4">
                  Deploy across multiple cloud providers for maximum availability
                </p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <span className="text-white font-medium">US-East (AWS)</span>
                    <Badge className="bg-green-100/10 text-green-300">Primary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <span className="text-white font-medium">EU-West (DigitalOcean)</span>
                    <Badge className="bg-blue-100/10 text-blue-300">Secondary</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded">
                    <span className="text-white font-medium">APAC (Vultr)</span>
                    <Badge className="bg-purple-100/10 text-purple-300">Edge</Badge>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
};
