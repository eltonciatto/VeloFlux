import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
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
  Twitter
} from 'lucide-react';

const About = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const team = [
    {
      name: "Alex Chen",
      role: "CEO & Founder",
      description: "Former Google engineer with 10+ years in distributed systems",
      avatar: "👨‍💻",
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Sarah Johnson",
      role: "CTO",
      description: "AI/ML expert with PhD in Computer Science from MIT",
      avatar: "👩‍🔬",
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Miguel Rodriguez",
      role: "Head of Engineering",
      description: "Infrastructure architect specializing in load balancing",
      avatar: "👨‍🔧",
      social: { github: "#", linkedin: "#", twitter: "#" }
    },
    {
      name: "Emily Park",
      role: "Head of AI Research",
      description: "Published researcher in predictive analytics and ML optimization",
      avatar: "👩‍💼",
      social: { github: "#", linkedin: "#", twitter: "#" }
    }
  ];

  const values = [
    {
      icon: Brain,
      title: "Innovation First",
      description: "We believe AI and machine learning are the future of infrastructure"
    },
    {
      icon: Users,
      title: "Community Driven",
      description: "Open source at heart, building with and for the developer community"
    },
    {
      icon: Zap,
      title: "Performance Obsessed",
      description: "Every millisecond matters - we optimize for speed and reliability"
    },
    {
      icon: Heart,
      title: "Developer Experience",
      description: "Beautiful, intuitive tools that developers love to use"
    },
    {
      icon: Globe,
      title: "Global Scale",
      description: "Built for the modern, distributed, multi-cloud world"
    },
    {
      icon: Award,
      title: "Enterprise Ready",
      description: "Production-grade security, compliance, and support"
    }
  ];

  const milestones = [
    { year: "2023", title: "VeloFlux Founded", description: "Started with a vision to revolutionize load balancing with AI" },
    { year: "2024", title: "Open Source Launch", description: "Released VeloFlux LB as open source to the community" },
    { year: "2024", title: "AI Features Beta", description: "Introduced predictive analytics and intelligent routing" },
    { year: "2025", title: "Enterprise Platform", description: "Launched SaaS platform with advanced AI/ML capabilities" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-blue-200 hover:text-white hover:bg-blue-600/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('navigation.backToHome')}
            </Button>
            <div className="flex items-center space-x-2">
              <Users className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold text-lg">About VeloFlux</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <Brain className="w-10 h-10 mr-4 text-blue-400" />
            About VeloFlux
          </h1>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto mb-8">
            We're on a mission to revolutionize infrastructure with AI-powered load balancing. 
            Built by developers, for developers, with the enterprise in mind.
          </p>
        </div>

        {/* Mission & Vision */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8">
            <div className="flex items-center mb-6">
              <Target className="w-8 h-8 text-blue-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Our Mission</h2>
            </div>
            <p className="text-blue-100 leading-relaxed">
              To democratize intelligent infrastructure by making AI-powered load balancing 
              accessible to every developer and organization. We believe that advanced traffic 
              management shouldn't require a team of PhD researchers - it should just work, 
              beautifully and intelligently.
            </p>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8">
            <div className="flex items-center mb-6">
              <Globe className="w-8 h-8 text-purple-400 mr-3" />
              <h2 className="text-2xl font-bold text-white">Our Vision</h2>
            </div>
            <p className="text-blue-100 leading-relaxed">
              A world where every application automatically optimizes itself, predicts traffic 
              patterns, and adapts to changing conditions without human intervention. Where 
              downtime is a thing of the past and performance optimization happens in real-time, 
              powered by machine learning.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((value, index) => {
              const IconComponent = value.icon;
              return (
                <div key={index} className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/50 transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="bg-blue-600 p-3 rounded-lg mr-4">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-white">{value.title}</h3>
                  </div>
                  <p className="text-blue-200 text-sm">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Team */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Meet Our Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {team.map((member, index) => (
              <div key={index} className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 text-center hover:bg-slate-800/50 transition-all duration-200">
                <div className="text-6xl mb-4">{member.avatar}</div>
                <h3 className="text-lg font-semibold text-white mb-2">{member.name}</h3>
                <p className="text-blue-400 font-medium mb-3">{member.role}</p>
                <p className="text-blue-200 text-sm mb-4">{member.description}</p>
                <div className="flex justify-center space-x-3">
                  <a href={member.social.github} className="text-slate-400 hover:text-white transition-colors">
                    <Github className="w-4 h-4" />
                  </a>
                  <a href={member.social.linkedin} className="text-slate-400 hover:text-white transition-colors">
                    <Linkedin className="w-4 h-4" />
                  </a>
                  <a href={member.social.twitter} className="text-slate-400 hover:text-white transition-colors">
                    <Twitter className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Timeline */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Our Journey</h2>
          <div className="space-y-6">
            {milestones.map((milestone, index) => (
              <div key={index} className="flex items-start">
                <div className="bg-blue-600 rounded-full p-2 mr-6 mt-1">
                  <div className="w-3 h-3 bg-white rounded-full"></div>
                </div>
                <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-6 flex-1">
                  <div className="flex items-center mb-2">
                    <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-medium mr-4">
                      {milestone.year}
                    </span>
                    <h3 className="text-lg font-semibold text-white">{milestone.title}</h3>
                  </div>
                  <p className="text-blue-200">{milestone.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8 mb-16">
          <h2 className="text-2xl font-bold text-white text-center mb-8">By the Numbers</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400 mb-2">50K+</div>
              <div className="text-blue-200 text-sm">Active Deployments</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-400 mb-2">99.99%</div>
              <div className="text-blue-200 text-sm">Uptime SLA</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-400 mb-2">2.5M+</div>
              <div className="text-blue-200 text-sm">Requests/Second</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400 mb-2">150+</div>
              <div className="text-blue-200 text-sm">Countries</div>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Want to Join Our Mission?</h2>
          <p className="text-blue-200 mb-8 max-w-2xl mx-auto">
            We're always looking for talented individuals who share our passion for building 
            the future of intelligent infrastructure.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              onClick={() => navigate('/pricing')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Get Started
            </Button>
            <Button
              onClick={() => navigate('/contact')}
              variant="outline"
              className="border-blue-400 text-blue-200 hover:bg-blue-600/20"
            >
              <Coffee className="w-4 h-4 mr-2" />
              Chat with Us
            </Button>
            <Button
              onClick={() => window.open('https://github.com/eltonciatto/VeloFlux', '_blank')}
              variant="outline"
              className="border-green-400 text-green-200 hover:bg-green-600/20"
            >
              <Github className="w-4 h-4 mr-2" />
              Contribute
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;
