import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { 
  Book, 
  Users, 
  Code, 
  Server, 
  Shield, 
  Gauge, 
  Settings, 
  Globe, 
  Download,
  Terminal,
  Play,
  AlertCircle,
  CheckCircle,
  ArrowRight,
  FileText,
  Database,
  Cloud,
  Zap,
  Wifi,
  Brain,
  Sparkles,
  Home,
  Search,
  Bookmark
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Docs = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-50"></div>
      
      {/* Navigation Header */}
      <div className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-white/20"></div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Documentation
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search docs..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                />
              </div>
              <Button
                variant="ghost"
                className="text-blue-200 hover:text-white hover:bg-white/10"
              >
                <Bookmark className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-12 pt-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Brain className="w-4 h-4 mr-2" />
            Complete Documentation
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            VeloFlux Docs
          </h1>
          
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Everything you need to know about deploying, configuring, and scaling with VeloFlux Load Balancer
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Badge className="bg-green-600/20 text-green-300 border-green-400/40 px-4 py-2">
              <Book className="w-4 h-4 mr-2" />
              Complete Guide
            </Badge>
            <Badge className="bg-blue-600/20 text-blue-300 border-blue-400/40 px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              All Skill Levels
            </Badge>
            <Badge className="bg-purple-600/20 text-purple-300 border-purple-400/40 px-4 py-2">
              <Code className="w-4 h-4 mr-2" />
              API Reference
            </Badge>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-6 py-3 font-semibold shadow-lg"
              onClick={() => navigate('/dashboard')}
            >
              <Zap className="w-5 h-5 mr-2" />
              Try Dashboard
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-blue-400/70 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-6 py-3 font-semibold"
            >
              <Download className="w-5 h-5 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <Tabs defaultValue="intro" className="space-y-8">
          {/* Modern Tab Navigation */}
          <div className="flex justify-center">
            <TabsList className="bg-white/10 border border-white/20 backdrop-blur-xl rounded-2xl p-2 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
              <TabsTrigger 
                value="intro" 
                className="text-xs font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Globe className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Introduction</span>
              </TabsTrigger>
              <TabsTrigger 
                value="beginner" 
                className="text-xs font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Users className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Beginner</span>
              </TabsTrigger>
              <TabsTrigger 
                value="installation" 
                className="text-xs font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Download className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Install</span>
              </TabsTrigger>
              <TabsTrigger 
                value="dashboard" 
                className="text-xs font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Gauge className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">Dashboard</span>
              </TabsTrigger>
              <TabsTrigger 
                value="api" 
                className="text-xs font-medium rounded-xl data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-blue-600 data-[state=active]:text-white transition-all duration-300"
              >
                <Code className="w-4 h-4 md:mr-1" />
                <span className="hidden md:inline">API</span>
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Introduction Tab */}
          <TabsContent value="intro" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Globe className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                    What is VeloFlux LB?
                  </h2>
                  <p className="text-blue-300">Intelligent load balancing made simple</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                      <Users className="w-5 h-5 mr-2" />
                      For Everyone
                    </h3>
                    <p className="text-blue-100 mb-4 leading-relaxed">
                      VeloFlux LB is like a smart traffic director for your website. When many people visit your site, 
                      it intelligently distributes them across multiple servers for optimal performance.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-400/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Load Distribution</strong>
                          <p className="text-green-200 text-sm">Spreads traffic across multiple servers</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-blue-600/10 border border-blue-400/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">High Availability</strong>
                          <p className="text-blue-200 text-sm">Keeps your site running even if servers fail</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-purple-600/10 border border-purple-400/20 rounded-xl">
                        <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Automatic HTTPS</strong>
                          <p className="text-purple-200 text-sm">Free SSL certificates with auto-renewal</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold text-blue-300 mb-4 flex items-center">
                      <Code className="w-5 h-5 mr-2" />
                      For Developers
                    </h3>
                    <p className="text-blue-100 mb-4 leading-relaxed">
                      Container-native load balancer written in Go with HTTP/3 support, 
                      automatic SSL termination, health checks, and geo-aware routing.
                    </p>
                    
                    <div className="space-y-4">
                      <div className="flex items-start gap-3 p-3 bg-slate-600/20 border border-slate-400/20 rounded-xl">
                        <Server className="w-5 h-5 text-slate-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Smart Algorithms</strong>
                          <p className="text-slate-200 text-sm">Round-robin, least-connections, IP-hash, weighted</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-amber-600/10 border border-amber-400/20 rounded-xl">
                        <Shield className="w-5 h-5 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Built-in Security</strong>
                          <p className="text-amber-200 text-sm">WAF, Rate Limiting, DDoS protection</p>
                        </div>
                      </div>
                      
                      <div className="flex items-start gap-3 p-3 bg-cyan-600/10 border border-cyan-400/20 rounded-xl">
                        <Gauge className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <strong className="text-white">Full Observability</strong>
                          <p className="text-cyan-200 text-sm">Prometheus metrics, structured logs, real-time monitoring</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Architecture Overview */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <h3 className="text-2xl font-bold text-white mb-6 flex items-center">
                <Brain className="w-6 h-6 mr-3 text-purple-400" />
                System Architecture
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="group">
                  <div className="text-center p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform duration-300">
                      <Globe className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Frontend Dashboard</h4>
                    <p className="text-blue-200 text-sm">React-based management interface with real-time monitoring</p>
                  </div>
                </div>
                
                <div className="group">
                  <div className="text-center p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform duration-300">
                      <Server className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Load Balancer Core</h4>
                    <p className="text-green-200 text-sm">High-performance Go engine with advanced routing</p>
                  </div>
                </div>
                
                <div className="group">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
                    <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-violet-500 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:rotate-6 transition-transform duration-300">
                      <Database className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-lg font-semibold text-white mb-2">Redis Cluster</h4>
                    <p className="text-purple-200 text-sm">Distributed state management and session storage</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Start CTA */}
              <div className="mt-8 text-center">
                <div className="inline-flex flex-col md:flex-row gap-4">
                  <Button 
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 font-semibold shadow-lg group"
                    onClick={() => navigate('/dashboard')}
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Try Live Dashboard
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                  </Button>
                  <Button 
                    variant="outline"
                    className="border-2 border-blue-400/70 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-8 py-3 font-semibold"
                  >
                    <Terminal className="w-5 h-5 mr-2" />
                    Quick Install
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Beginner Guide Tab */}
          <TabsContent value="beginner" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl flex items-center justify-center mr-4">
                  <Users className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-green-200 bg-clip-text text-transparent">
                    Beginner's Guide
                  </h2>
                  <p className="text-green-300">Your first steps with VeloFlux</p>
                </div>
              </div>

              <Accordion type="single" collapsible className="space-y-4">
                <AccordionItem value="what-is-lb" className="border border-white/10 rounded-xl bg-white/5 px-6">
                  <AccordionTrigger className="text-white hover:text-green-300 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-green-600 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">1</span>
                      </div>
                      What is a Load Balancer and why do I need it?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4 pb-4">
                    <p className="leading-relaxed">
                      A Load Balancer is like a smart doorman for your website. When many people 
                      try to access your site simultaneously, it distributes these visits among 
                      several servers so none gets overwhelmed.
                    </p>
                    
                    <div className="bg-green-600/10 border border-green-400/20 rounded-xl p-4">
                      <h4 className="text-white font-semibold mb-3 flex items-center">
                        <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                        Main Benefits:
                      </h4>
                      <ul className="space-y-2 ml-4">
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Better Performance:</strong> Faster response times for all users</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong>High Availability:</strong> No single point of failure</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Easy Scaling:</strong> Add more servers as you grow</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <ArrowRight className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                          <span><strong>Built-in Security:</strong> Protection against common threats</span>
                        </li>
                      </ul>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="when-use" className="border border-white/10 rounded-xl bg-white/5 px-6">
                  <AccordionTrigger className="text-white hover:text-blue-300 py-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-lg flex items-center justify-center mr-3">
                        <span className="text-white font-bold text-sm">2</span>
                      </div>
                      When should I use a Load Balancer?
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-blue-200 space-y-4 pb-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <h5 className="text-white font-semibold">Perfect for:</h5>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            High-traffic websites
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            E-commerce platforms
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            API services
                          </li>
                          <li className="flex items-center gap-2">
                            <CheckCircle className="w-4 h-4 text-green-400" />
                            Mission-critical applications
                          </li>
                        </ul>
                      </div>
                      <div className="space-y-3">
                        <h5 className="text-white font-semibold">Warning signs:</h5>
                        <ul className="space-y-2">
                          <li className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Slow response times
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Server overload errors
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Frequent downtime
                          </li>
                          <li className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-yellow-400" />
                            Traffic spikes crashes
                          </li>
                        </ul>
                      </div>
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-8 text-center">
                <Button 
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-3 font-semibold shadow-lg group"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Quick Setup
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* Installation Tab */}
          <TabsContent value="installation" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl flex items-center justify-center mr-4">
                  <Download className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-orange-200 bg-clip-text text-transparent">
                    Installation Guide
                  </h2>
                  <p className="text-orange-300">Get VeloFlux running in minutes</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-orange-600/10 border border-orange-400/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Docker Installation (Recommended)</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Pull the latest image</div>
                    <div className="text-white">docker pull veloflux/veloflux-lb:latest</div>
                    <br />
                    <div className="text-green-400"># Run with docker-compose</div>
                    <div className="text-white">docker-compose up -d</div>
                  </div>
                </div>

                <div className="bg-blue-600/10 border border-blue-400/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Binary Installation</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Download for Linux</div>
                    <div className="text-white">wget https://github.com/veloflux/releases/latest/veloflux-linux</div>
                    <br />
                    <div className="text-green-400"># Make executable and run</div>
                    <div className="text-white">chmod +x veloflux-linux && ./veloflux-linux</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                  <Gauge className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-cyan-200 bg-clip-text text-transparent">
                    Dashboard Guide
                  </h2>
                  <p className="text-cyan-300">Master the VeloFlux interface</p>
                </div>
              </div>

              <div className="text-center">
                <Button 
                  className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white px-8 py-3 font-semibold shadow-lg group"
                  onClick={() => navigate('/dashboard')}
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Open Live Dashboard
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </Button>
              </div>
            </Card>
          </TabsContent>

          {/* API Tab */}
          <TabsContent value="api" className="space-y-8">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-violet-600 to-purple-600 rounded-xl flex items-center justify-center mr-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-violet-200 bg-clip-text text-transparent">
                    API Reference
                  </h2>
                  <p className="text-violet-300">Complete API documentation</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-violet-600/10 border border-violet-400/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Authentication</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Get auth token</div>
                    <div className="text-white">curl -X POST /api/v1/auth/login \</div>
                    <div className="text-white ml-4">-d '&#123;"username":"admin","password":"secret"&#125;'</div>
                  </div>
                </div>

                <div className="bg-purple-600/10 border border-purple-400/20 rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Backend Management</h3>
                  <div className="bg-slate-900/50 rounded-lg p-4 font-mono text-sm">
                    <div className="text-green-400"># Add backend server</div>
                    <div className="text-white">curl -X POST /api/v1/backends \</div>
                    <div className="text-white ml-4">-H "Authorization: Bearer $TOKEN" \</div>
                    <div className="text-white ml-4">-d '&#123;"address":"server1:80","weight":100&#125;'</div>
                  </div>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Docs;