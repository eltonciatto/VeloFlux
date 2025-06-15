import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Database, 
  Cookie, 
  Mail, 
  Eye,
  Clock,
  Globe,
  FileText,
  UserCheck,
  Home,
  Sparkles,
  Lock,
  Server,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const PrivacyPolicy = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'overview', icon: FileText, title: 'Overview', color: 'from-blue-500 to-cyan-500' },
    { id: 'information-collection', icon: Database, title: 'Information Collection', color: 'from-green-500 to-emerald-500' },
    { id: 'information-use', icon: Eye, title: 'How We Use Information', color: 'from-purple-500 to-pink-500' },
    { id: 'information-sharing', icon: Globe, title: 'Information Sharing', color: 'from-yellow-500 to-orange-500' },
    { id: 'data-security', icon: Shield, title: 'Data Security', color: 'from-red-500 to-pink-500' },
    { id: 'cookies', icon: Cookie, title: 'Cookies & Tracking', color: 'from-indigo-500 to-purple-500' },
    { id: 'user-rights', icon: UserCheck, title: 'Your Rights', color: 'from-teal-500 to-cyan-500' },
    { id: 'data-retention', icon: Clock, title: 'Data Retention', color: 'from-amber-500 to-yellow-500' },
    { id: 'contact', icon: Mail, title: 'Contact Us', color: 'from-rose-500 to-pink-500' }
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
      <div className="relative z-10 border-b border-white/10 bg-white/5 backdrop-blur-xl sticky top-0">
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
                Privacy Policy
              </h1>
            </div>
            <Badge className="bg-green-600/30 text-green-200 border-green-400/40">
              Last Updated: June 2025
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Shield className="w-4 h-4 mr-2" />
            Your Privacy Matters
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Privacy Policy
          </h1>
          
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            We're committed to protecting your privacy and being transparent about how we collect, 
            use, and protect your personal information.
          </p>
        </div>

        {/* Quick Navigation */}
        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl mb-12">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
            <FileText className="w-6 h-6 mr-3 text-blue-400" />
            Quick Navigation
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {sections.map((section) => {
              const IconComponent = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => scrollToSection(section.id)}
                  className={`flex items-center p-3 bg-gradient-to-r ${section.color} bg-opacity-20 border border-white/20 rounded-xl hover:scale-105 transition-transform duration-200 text-left`}
                >
                  <div className={`w-8 h-8 bg-gradient-to-r ${section.color} rounded-lg flex items-center justify-center mr-3`}>
                    <IconComponent className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white text-sm font-medium">{section.title}</span>
                </button>
              );
            })}
          </div>
        </Card>

        {/* Content Sections */}
        <div className="space-y-8">
          {/* Overview */}
          <Card id="overview" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Overview</h2>
                <p className="text-blue-300">Our commitment to your privacy</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-blue-200 leading-relaxed mb-4">
                At VeloFlux, we respect your privacy and are committed to protecting your personal data. 
                This privacy policy explains how we collect, use, and safeguard your information when you 
                use our load balancing services and website.
              </p>
              <p className="text-blue-200 leading-relaxed">
                This policy applies to all VeloFlux services, including our load balancer, dashboard, 
                API, and any related services. By using our services, you agree to the collection and 
                use of information in accordance with this policy.
              </p>
            </div>
          </Card>

          {/* Information Collection */}
          <Card id="information-collection" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <Database className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Information We Collect</h2>
                <p className="text-blue-300">What data we gather and why</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-green-400" />
                    Personal Information
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Name and email address</li>
                    <li>• Account credentials</li>
                    <li>• Billing information</li>
                    <li>• Contact preferences</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Server className="w-4 h-4 mr-2 text-blue-400" />
                    Technical Information
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• IP addresses and server logs</li>
                    <li>• Load balancer configuration</li>
                    <li>• Performance metrics</li>
                    <li>• Error logs and diagnostics</li>
                  </ul>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Globe className="w-4 h-4 mr-2 text-purple-400" />
                    Usage Information
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Service usage patterns</li>
                    <li>• Feature interactions</li>
                    <li>• Dashboard activities</li>
                    <li>• API call patterns</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Cookie className="w-4 h-4 mr-2 text-yellow-400" />
                    Cookies & Tracking
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Session cookies</li>
                    <li>• Preference cookies</li>
                    <li>• Analytics cookies</li>
                    <li>• Security tokens</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Information Use */}
          <Card id="information-use" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">How We Use Your Information</h2>
                <p className="text-blue-300">The purposes for data processing</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-blue-600/10 border border-blue-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Service Delivery</strong>
                    <p className="text-blue-200 text-sm">Provide and maintain our load balancing services</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Performance Optimization</strong>
                    <p className="text-green-200 text-sm">Analyze and improve service performance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-purple-600/10 border border-purple-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Security & Fraud Prevention</strong>
                    <p className="text-purple-200 text-sm">Protect against unauthorized access and abuse</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-yellow-600/10 border border-yellow-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Customer Support</strong>
                    <p className="text-yellow-200 text-sm">Provide technical support and assistance</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-cyan-600/10 border border-cyan-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-cyan-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Communication</strong>
                    <p className="text-cyan-200 text-sm">Send service updates and important notifications</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-3 p-3 bg-rose-600/10 border border-rose-400/20 rounded-xl">
                  <CheckCircle className="w-5 h-5 text-rose-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <strong className="text-white">Legal Compliance</strong>
                    <p className="text-rose-200 text-sm">Meet legal and regulatory requirements</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Data Security */}
          <Card id="data-security" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Data Security</h2>
                <p className="text-blue-300">How we protect your information</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Encryption</h3>
                <p className="text-blue-200 text-sm">
                  All data is encrypted in transit using TLS 1.3 and at rest using AES-256 encryption.
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <Server className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Infrastructure</h3>
                <p className="text-green-200 text-sm">
                  Our infrastructure is hosted on SOC 2 Type II certified cloud providers with 24/7 monitoring.
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <UserCheck className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Access Control</h3>
                <p className="text-purple-200 text-sm">
                  Strict access controls and multi-factor authentication protect against unauthorized access.
                </p>
              </div>
            </div>
          </Card>

          {/* Your Rights */}
          <Card id="user-rights" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Your Rights</h2>
                <p className="text-blue-300">What you can do with your data</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-blue-200 leading-relaxed mb-6">
                You have several rights regarding your personal data. You can exercise these rights by 
                contacting us through the information provided in the Contact section.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Access & Portability</h4>
                  <p className="text-blue-200 text-sm">Request a copy of your personal data in a portable format.</p>
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Correction</h4>
                  <p className="text-blue-200 text-sm">Update or correct inaccurate personal information.</p>
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Deletion</h4>
                  <p className="text-blue-200 text-sm">Request deletion of your personal data (subject to legal obligations).</p>
                </div>
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Objection</h4>
                  <p className="text-blue-200 text-sm">Object to certain types of data processing.</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Contact */}
          <Card id="contact" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Contact Us</h2>
                <p className="text-blue-300">Questions about this policy?</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-blue-200 leading-relaxed mb-6">
                  If you have any questions about this Privacy Policy or our data practices, 
                  please don't hesitate to contact us. We're here to help and ensure your privacy concerns are addressed.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Privacy Officer</p>
                      <p className="text-blue-200">privacy@veloflux.io</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Globe className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Data Protection</p>
                      <p className="text-blue-200">dpo@veloflux.io</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-2xl">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
                  <h3 className="text-white font-semibold">Important Note</h3>
                </div>
                <p className="text-blue-200 text-sm mb-4">
                  This privacy policy may be updated from time to time. We will notify you of any 
                  material changes via email or through our service.
                </p>
                <p className="text-blue-300 text-xs">
                  Last updated: June 15, 2025<br />
                  Effective date: June 15, 2025
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
