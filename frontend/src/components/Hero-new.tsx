import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Zap, Shield, Globe, Activity, Box, BarChart3, BookOpen, Brain, Github, ExternalLink } from 'lucide-react';
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
          <Badge variant="secondary" className="mb-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 text-purple-200 border-purple-400/30">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Load Balancer
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            VeloFlux LB
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            Intelligent container-native global load balancer with <span className="text-purple-300 font-semibold">AI/ML capabilities</span>, 
            SSL termination, HTTP/3 support, predictive analytics, and automated optimization. 
            Built for the cloud-native era.
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => navigate('/dashboard')}
          >
            <Brain className="w-5 h-5 mr-2" />
            AI Dashboard
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg"
            onClick={() => window.open('https://github.com/eltonciatto/VeloFlux', '_blank')}
          >
            <Github className="w-5 h-5 mr-2" />
            GitHub
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg"
            onClick={() => window.open('https://veloflux.io/docs', '_blank')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            Documentação
          </Button>
          <Button 
            variant="outline" 
            className="border-blue-400/50 text-blue-100 hover:bg-blue-600/20 px-8 py-3 text-lg"
            onClick={() => navigate('/login')}
          >
            <Box className="w-5 h-5 mr-2" />
            Demo Login
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">AI-Powered</div>
            <div className="text-sm text-blue-200">Intelligent Routing</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">100k+</div>
            <div className="text-sm text-blue-200">Concurrent Connections</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{'< 50 MB'}</div>
            <div className="text-sm text-blue-200">Container Size</div>
          </Card>
          
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">99.99%</div>
            <div className="text-sm text-blue-200">Uptime SLA</div>
          </Card>
        </div>
      </div>
    </section>
  );
};
