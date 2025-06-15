import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  ScrollText, 
  Calendar, 
  Mail, 
  AlertCircle,
  Home,
  Sparkles,
  FileText,
  Shield,
  CreditCard,
  Users,
  Globe,
  Gavel,
  Scale,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';

const TermsOfService = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'acceptance', icon: CheckCircle, title: 'Acceptance of Terms', color: 'from-blue-500 to-cyan-500' },
    { id: 'services', icon: Globe, title: 'Our Services', color: 'from-green-500 to-emerald-500' },
    { id: 'accounts', icon: Users, title: 'User Accounts', color: 'from-purple-500 to-pink-500' },
    { id: 'payment', icon: CreditCard, title: 'Payment Terms', color: 'from-yellow-500 to-orange-500' },
    { id: 'usage', icon: Shield, title: 'Acceptable Use', color: 'from-red-500 to-pink-500' },
    { id: 'privacy', icon: FileText, title: 'Privacy Policy', color: 'from-indigo-500 to-purple-500' },
    { id: 'intellectual', icon: Scale, title: 'Intellectual Property', color: 'from-teal-500 to-cyan-500' },
    { id: 'liability', icon: Gavel, title: 'Limitation of Liability', color: 'from-amber-500 to-yellow-500' },
    { id: 'termination', icon: AlertTriangle, title: 'Termination', color: 'from-rose-500 to-pink-500' }
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
                Terms of Service
              </h1>
            </div>
            <Badge className="bg-blue-600/30 text-blue-200 border-blue-400/40">
              Last Updated: June 2025
            </Badge>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <ScrollText className="w-4 h-4 mr-2" />
            Legal Agreement
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Terms of Service
          </h1>
          
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Please read these terms carefully before using VeloFlux services. 
            By using our services, you agree to be bound by these terms.
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
          {/* Acceptance of Terms */}
          <Card id="acceptance" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <CheckCircle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Acceptance of Terms</h2>
                <p className="text-blue-300">Agreement to use our services</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-blue-200 leading-relaxed mb-4">
                By accessing or using VeloFlux services, you agree to be bound by these Terms of Service 
                and all applicable laws and regulations. If you do not agree with any of these terms, 
                you are prohibited from using or accessing our services.
              </p>
              <p className="text-blue-200 leading-relaxed">
                These terms constitute a legally binding agreement between you and VeloFlux. We may update 
                these terms from time to time, and your continued use of our services constitutes acceptance 
                of any changes.
              </p>
            </div>
          </Card>

          {/* Our Services */}
          <Card id="services" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mr-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Our Services</h2>
                <p className="text-blue-300">What VeloFlux provides</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="p-4 bg-blue-600/10 border border-blue-400/20 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Load Balancing Services</h4>
                  <p className="text-blue-200 text-sm">
                    Intelligent traffic distribution and load balancing with AI-powered optimization.
                  </p>
                </div>
                
                <div className="p-4 bg-green-600/10 border border-green-400/20 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Dashboard & Management</h4>
                  <p className="text-green-200 text-sm">
                    Web-based control panel for managing your load balancer configuration and monitoring.
                  </p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="p-4 bg-purple-600/10 border border-purple-400/20 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">API Access</h4>
                  <p className="text-purple-200 text-sm">
                    RESTful API for programmatic control and integration with your existing infrastructure.
                  </p>
                </div>
                
                <div className="p-4 bg-yellow-600/10 border border-yellow-400/20 rounded-xl">
                  <h4 className="text-white font-semibold mb-2">Support & Documentation</h4>
                  <p className="text-yellow-200 text-sm">
                    Comprehensive documentation, tutorials, and customer support services.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* User Accounts */}
          <Card id="accounts" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">User Accounts</h2>
                <p className="text-blue-300">Account responsibilities and security</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <p className="text-blue-200 leading-relaxed mb-6">
                To access certain features of our services, you must create an account. You are responsible 
                for maintaining the confidentiality of your account credentials and for all activities that 
                occur under your account.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <CheckCircle className="w-4 h-4 mr-2 text-green-400" />
                    Your Responsibilities
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Provide accurate information</li>
                    <li>• Keep credentials secure</li>
                    <li>• Notify us of unauthorized access</li>
                    <li>• Use services lawfully</li>
                  </ul>
                </div>
                
                <div className="p-4 bg-slate-700/30 border border-slate-500/30 rounded-xl">
                  <h4 className="text-white font-semibold mb-2 flex items-center">
                    <Shield className="w-4 h-4 mr-2 text-blue-400" />
                    Account Security
                  </h4>
                  <ul className="text-blue-200 text-sm space-y-1">
                    <li>• Strong password required</li>
                    <li>• Two-factor authentication available</li>
                    <li>• Regular security monitoring</li>
                    <li>• Immediate breach notification</li>
                  </ul>
                </div>
              </div>
            </div>
          </Card>

          {/* Payment Terms */}
          <Card id="payment" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl flex items-center justify-center mr-4">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Payment Terms</h2>
                <p className="text-blue-300">Billing and payment policies</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Billing Cycle</h3>
                <p className="text-blue-200 text-sm">
                  Monthly or annual billing cycles available. Charges are processed in advance.
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Auto-Renewal</h3>
                <p className="text-green-200 text-sm">
                  Services automatically renew unless cancelled before the next billing period.
                </p>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-400/30 rounded-2xl">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Late Payments</h3>
                <p className="text-purple-200 text-sm">
                  Services may be suspended for non-payment. Late fees may apply.
                </p>
              </div>
            </div>
          </Card>

          {/* Acceptable Use */}
          <Card id="usage" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-pink-500 rounded-xl flex items-center justify-center mr-4">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Acceptable Use Policy</h2>
                <p className="text-blue-300">What's allowed and what's not</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-bold text-green-400 mb-4 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2" />
                  Permitted Uses
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-400/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Legitimate Business Use</strong>
                      <p className="text-green-200 text-sm">Load balancing for legitimate web applications and services</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-400/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Development & Testing</strong>
                      <p className="text-green-200 text-sm">Testing and development environments for applications</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-green-600/10 border border-green-400/20 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Educational Purposes</strong>
                      <p className="text-green-200 text-sm">Learning and educational use in academic settings</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-red-400 mb-4 flex items-center">
                  <AlertTriangle className="w-5 h-5 mr-2" />
                  Prohibited Uses
                </h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-red-600/10 border border-red-400/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Illegal Activities</strong>
                      <p className="text-red-200 text-sm">Any illegal or fraudulent activities are strictly prohibited</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-red-600/10 border border-red-400/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Abuse & Spam</strong>
                      <p className="text-red-200 text-sm">Sending spam, phishing, or abusive content</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-red-600/10 border border-red-400/20 rounded-xl">
                    <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-white">Resource Abuse</strong>
                      <p className="text-red-200 text-sm">Excessive resource usage that impacts other users</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Limitation of Liability */}
          <Card id="liability" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-xl flex items-center justify-center mr-4">
                <Gavel className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Limitation of Liability</h2>
                <p className="text-blue-300">Legal disclaimers and limitations</p>
              </div>
            </div>
            
            <div className="prose prose-invert max-w-none">
              <div className="p-6 bg-gradient-to-br from-yellow-600/20 to-orange-600/20 border border-yellow-400/30 rounded-2xl mb-6">
                <div className="flex items-center mb-4">
                  <AlertTriangle className="w-6 h-6 text-yellow-400 mr-2" />
                  <h3 className="text-white font-semibold">Important Legal Notice</h3>
                </div>
                <p className="text-yellow-200 text-sm">
                  VeloFlux provides services "as is" without warranties of any kind. We limit our liability 
                  to the maximum extent permitted by law.
                </p>
              </div>
              
              <p className="text-blue-200 leading-relaxed mb-4">
                In no event shall VeloFlux be liable for any indirect, incidental, special, consequential, 
                or punitive damages, including without limitation loss of profits, data, use, goodwill, 
                or other intangible losses.
              </p>
              
              <p className="text-blue-200 leading-relaxed">
                Our total liability to you for any damages arising from or related to this agreement 
                shall not exceed the amounts paid by you to VeloFlux during the twelve (12) months 
                preceding the claim.
              </p>
            </div>
          </Card>

          {/* Contact */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center mr-4">
                <Mail className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-white">Questions?</h2>
                <p className="text-blue-300">Contact us about these terms</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <p className="text-blue-200 leading-relaxed mb-6">
                  If you have any questions about these Terms of Service, please contact our legal team. 
                  We're here to help clarify any aspects of our agreement.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Legal Department</p>
                      <p className="text-blue-200">legal@veloflux.io</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-5 h-5 text-blue-400" />
                    <div>
                      <p className="text-white font-medium">Terms Questions</p>
                      <p className="text-blue-200">terms@veloflux.io</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="p-6 bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-400/30 rounded-2xl">
                <div className="flex items-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-400 mr-2" />
                  <h3 className="text-white font-semibold">Last Updated</h3>
                </div>
                <p className="text-blue-200 text-sm mb-4">
                  These Terms of Service were last updated on June 15, 2025, and are effective immediately.
                </p>
                <p className="text-blue-300 text-xs">
                  We may update these terms from time to time. Continued use of our services constitutes 
                  acceptance of any changes.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
