
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Check, Play, Download, Terminal, FileText } from 'lucide-react';

export const QuickStart = () => {
  const { t } = useTranslation();
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, commandId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(commandId);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  const dockerCommand = `docker run -d \\
  --name veloflux-lb \\
  -p 80:80 -p 443:443 \\
  -e VFX_CONFIG=/etc/veloflux/config.yaml \\
  -v $(pwd)/config:/etc/veloflux \\
  ghcr.io/veloflux/lb:latest`;

  const composeFile = `version: '3.8'
services:
  veloflux-lb:
    image: ghcr.io/veloflux/lb:latest
    ports:
      - "80:80"
      - "443:443"
      - "8080:8080"  # metrics
    environment:
      - VFX_CONFIG=/etc/veloflux/config.yaml
      - VFX_LOG_LEVEL=info
    volumes:
      - ./config:/etc/veloflux
      - ./certs:/etc/ssl/certs
    restart: unless-stopped

  backend-1:
    image: nginx:alpine
    ports:
      - "8001:80"
    
  backend-2:
    image: nginx:alpine
    ports:
      - "8002:80"`;

  const configExample = `# VeloFlux LB Configuration
global:
  bind_address: "0.0.0.0:80"
  tls_bind_address: "0.0.0.0:443"
  metrics_address: "0.0.0.0:8080"
  
  # TLS Configuration
  tls:
    auto_cert: true
    acme_email: "admin@example.com"
    cert_dir: "/etc/ssl/certs"

  # Health Check Defaults
  health_check:
    interval: "30s"
    timeout: "5s"
    retries: 3

# Backend Pools
pools:
  - name: "web-servers"
    algorithm: "round_robin"
    sticky_sessions: true
    
    backends:
      - address: "backend-1:80"
        weight: 100
        health_check:
          path: "/health"
          
      - address: "backend-2:80"
        weight: 100
        health_check:
          path: "/health"

# Routing Rules
routes:
  - host: "example.com"
    pool: "web-servers"
    
  - host: "api.example.com"
    pool: "api-servers"
    path_prefix: "/api"`;

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('quickStart.title')}
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            {t('quickStart.description')}
          </p>
        </div>

        <Tabs defaultValue="docker" className="w-full">
          <TabsList className="grid w-full max-w-lg mx-auto grid-cols-3 mb-12 bg-white/5 border-white/10">
            <TabsTrigger value="docker" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Terminal className="w-4 h-4 mr-2" />
              {t('quickStart.tabs.docker')}
            </TabsTrigger>
            <TabsTrigger value="compose" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <Play className="w-4 h-4 mr-2" />
              {t('quickStart.tabs.compose')}
            </TabsTrigger>
            <TabsTrigger value="config" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
              <FileText className="w-4 h-4 mr-2" />
              {t('quickStart.tabs.config')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="docker" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">{t('quickStart.singleContainer.title')}</h3>
                <Badge className="bg-green-100/10 text-green-300">{t('quickStart.singleContainer.badge')}</Badge>
              </div>
              
              <p className="text-blue-200 mb-6">
                {t('quickStart.singleContainer.description')}
              </p>

              <div className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 relative">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="absolute top-2 right-2 text-blue-300 hover:text-white"
                    onClick={() => copyToClipboard(dockerCommand, 'docker')}
                  >
                    {copiedCommand === 'docker' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <pre className="text-sm text-blue-100 overflow-x-auto pr-12">
                    <code>{dockerCommand}</code>
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-blue-400 font-semibold mb-2">{t('quickStart.singleContainer.features.port')}</div>
                    <div className="text-sm text-blue-200">{t('quickStart.singleContainer.features.portDesc')}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-green-400 font-semibold mb-2">{t('quickStart.singleContainer.features.configVolume')}</div>
                    <div className="text-sm text-blue-200">{t('quickStart.singleContainer.features.configDesc')}</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-purple-400 font-semibold mb-2">{t('quickStart.singleContainer.features.autoStart')}</div>
                    <div className="text-sm text-blue-200">{t('quickStart.singleContainer.features.autoStartDesc')}</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="compose" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Docker Compose Stack</h3>
                <Badge className="bg-blue-100/10 text-blue-300">Full Stack</Badge>
              </div>
              
              <p className="text-blue-200 mb-6">
                Complete setup with load balancer and sample backend services for testing.
              </p>

              <div className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 relative">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="absolute top-2 right-2 text-blue-300 hover:text-white"
                    onClick={() => copyToClipboard(composeFile, 'compose')}
                  >
                    {copiedCommand === 'compose' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <pre className="text-sm text-blue-100 overflow-x-auto pr-12">
                    <code>{composeFile}</code>
                  </pre>
                </div>

                <div className="flex gap-4">
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Download className="w-4 h-4 mr-2" />
                    Download docker-compose.yml
                  </Button>
                  <Button variant="outline" className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20">
                    <Play className="w-4 h-4 mr-2" />
                    docker-compose up -d
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-white">Configuration Example</h3>
                <Badge className="bg-yellow-100/10 text-yellow-300">YAML</Badge>
              </div>
              
              <p className="text-blue-200 mb-6">
                Complete configuration example with TLS, health checks, and routing rules.
              </p>

              <div className="space-y-4">
                <div className="bg-black/50 rounded-lg p-4 relative">
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="absolute top-2 right-2 text-blue-300 hover:text-white"
                    onClick={() => copyToClipboard(configExample, 'config')}
                  >
                    {copiedCommand === 'config' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                  <pre className="text-sm text-blue-100 overflow-x-auto pr-12">
                    <code>{configExample}</code>
                  </pre>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-green-400 font-semibold mb-2">✓ Auto HTTPS</div>
                    <div className="text-sm text-blue-200">Let's Encrypt certificates</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-blue-400 font-semibold mb-2">✓ Health Monitoring</div>
                    <div className="text-sm text-blue-200">Automatic backend checks</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-purple-400 font-semibold mb-2">✓ Load Balancing</div>
                    <div className="text-sm text-blue-200">Round robin with weights</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg">
                    <div className="text-yellow-400 font-semibold mb-2">✓ Sticky Sessions</div>
                    <div className="text-sm text-blue-200">Cookie-based persistence</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="mt-12 text-center">
          <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-3 text-lg">
            <Download className="w-5 h-5 mr-2" />
            {t('quickStart.downloadExamples')}
          </Button>
        </div>
      </div>
    </section>
  );
};
