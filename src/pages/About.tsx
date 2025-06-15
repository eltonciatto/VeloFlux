import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Target, 
  Brain, 
  Globe,
  Award,
  Zap,
  Heart,
  Coffee,
  Github,
  Linkedin,
  Twitter,
  Home,
  Sparkles,
  Code,
  Rocket,
  Shield,
  Server,
  Star,
  CheckCircle
} from 'lucide-react';

const About = () => {
  const navigate = useNavigate();

  const values = [
    {
      icon: Zap,
      title: "Performance",
      description: "Lightning-fast load balancing with intelligent algorithms",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: Shield,
      title: "Security",
      description: "Enterprise-grade security with built-in WAF and DDoS protection",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Brain,
      title: "Intelligence",
      description: "AI-powered traffic optimization and predictive scaling",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Worldwide distribution with edge computing capabilities",
      color: "from-blue-500 to-cyan-500"
    }
  ];

  const author = {
    name: "Elton Ciatto",
    role: "Creator & Lead Developer",
    description: "Full-stack developer and infrastructure architect passionate about building high-performance systems that scale globally",
    avatar: "👨‍💻",
    specialties: ["Load Balancing", "Distributed Systems", "React/TypeScript", "Go Backend", "Cloud Architecture"],
    social: { github: "#", linkedin: "#", twitter: "#" }
  };

  const achievements = [
    { icon: Server, text: "High-Performance Load Balancer" },
    { icon: Brain, text: "AI-Powered Traffic Optimization" },
    { icon: Shield, text: "Enterprise Security Features" },
    { icon: Globe, text: "Multi-Cloud Support" },
    { icon: Code, text: "Open Source Community" },
    { icon: Rocket, text: "Production Ready" }
  ];

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
                About VeloFlux
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            About Our Mission
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Building the Future of
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Load Balancing
            </span>
          </h1>
          
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            VeloFlux is more than just a load balancer - it's an intelligent traffic orchestration platform
            that adapts and learns from your infrastructure to deliver optimal performance.
          </p>
        </div>

        {/* Values Section */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
                  <div className={`w-12 h-12 bg-gradient-to-r ${value.color} rounded-xl flex items-center justify-center mb-4`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">{value.title}</h3>
                  <p className="text-blue-200 text-sm">{value.description}</p>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Author Section */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl mb-16">
          <div className="flex items-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl flex items-center justify-center text-2xl mr-6">
              {author.avatar}
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                Meet the Creator
              </h2>
              <p className="text-blue-300">The mind behind VeloFlux</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-2xl font-bold text-white mb-2">{author.name}</h3>
              <p className="text-purple-300 font-semibold mb-4">{author.role}</p>
              <p className="text-blue-200 mb-6 leading-relaxed">{author.description}</p>
              
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-3">Specialties:</h4>
                <div className="flex flex-wrap gap-2">
                  {author.specialties.map((specialty, index) => (
                    <Badge key={index} className="bg-blue-600/30 text-blue-200 border-blue-400/40">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex space-x-4">
                <Button variant="outline" size="sm" className="border-blue-400/50 text-blue-200 hover:bg-blue-600/30">
                  <Github className="w-4 h-4 mr-2" />
                  GitHub
                </Button>
                <Button variant="outline" size="sm" className="border-blue-400/50 text-blue-200 hover:bg-blue-600/30">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </Button>
                <Button variant="outline" size="sm" className="border-blue-400/50 text-blue-200 hover:bg-blue-600/30">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
              </div>
            </div>

            <div>
              <h4 className="text-xl font-bold text-white mb-4">Project Achievements</h4>
              <div className="space-y-3">
                {achievements.map((achievement, index) => {
                  const IconComponent = achievement.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                      <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                        <IconComponent className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-white">{achievement.text}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>

        {/* Project Story */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl mb-16">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent mb-4">
              The VeloFlux Story
            </h2>
            <p className="text-blue-300">How it all began</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Problem</h3>
              <p className="text-blue-200 text-sm">
                Traditional load balancers lack intelligence and adaptability in modern cloud environments.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Vision</h3>
              <p className="text-blue-200 text-sm">
                Create an AI-powered load balancer that learns and adapts to optimize traffic automatically.
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Rocket className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">The Solution</h3>
              <p className="text-blue-200 text-sm">
                VeloFlux LB - intelligent, secure, and scalable load balancing for the modern web.
              </p>
            </div>
          </div>
        </Card>

        {/* Call to Action */}
        <div className="text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Experience VeloFlux?</h2>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            Join thousands of developers who trust VeloFlux for their load balancing needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 font-semibold shadow-lg"
              onClick={() => navigate('/dashboard')}
            >
              <Rocket className="w-5 h-5 mr-2" />
              Get Started
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-blue-400/70 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-8 py-3 font-semibold"
              onClick={() => navigate('/docs')}
            >
              <Users className="w-5 h-5 mr-2" />
              Learn More
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
