
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Zap, Shield, Globe, Activity, Box, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Hero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="mb-8">
          <Badge variant="secondary" className="mb-4 bg-blue-100/10 text-blue-200 border-blue-400/30">
            <Zap className="w-4 h-4 mr-2" />
            Production-Grade Load Balancer
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-indigo-200 bg-clip-text text-transparent mb-6">
            SkyPilot LB
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            Container-native global load balancer with SSL termination, HTTP/3 support, 
            automatic health checks, and geo-aware routing. Built for the cloud-native era.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => navigate('/dashboard')}
          >
            <BarChart3 className="w-5 h-5 mr-2" />
            Open Dashboard
          </Button>
          <Button variant="outline" className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-8 py-3 text-lg">
            <Globe className="w-5 h-5 mr-2" />
            View Documentation
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">100k</div>
            <div className="text-sm text-blue-200">Concurrent Connections</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">Under 50MB</div>
            <div className="text-sm text-blue-200">Container Size</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">99.99%</div>
            <div className="text-sm text-blue-200">Uptime SLA</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Cloud className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">3+</div>
            <div className="text-sm text-blue-200">Cloud Providers</div>
          </Card>
        </div>
      </div>
    </section>
  );
};
