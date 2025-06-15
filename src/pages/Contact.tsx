import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Mail, 
  MessageCircle, 
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb,
  Home,
  Sparkles,
  Heart,
  Globe,
  Users,
  Headphones
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Contact = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: "Email Support",
      description: "Get help from our expert team",
      value: "support@veloflux.io",
      response: "Usually responds within 4-6 hours",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: MessageCircle,
      title: "Live Chat",
      description: "Chat with our support team",
      value: "Available 24/7",
      response: "Instant response during business hours",
      color: "from-green-500 to-emerald-500"
    },
    {
      icon: Phone,
      title: "Phone Support",
      description: "Speak directly with our experts",
      value: "+1 (555) 123-4567",
      response: "Available Mon-Fri 9AM-6PM EST",
      color: "from-purple-500 to-pink-500"
    }
  ];

  const categories = [
    { icon: HelpCircle, label: "General Support", value: "general" },
    { icon: Bug, label: "Bug Report", value: "bug" },
    { icon: Lightbulb, label: "Feature Request", value: "feature" },
    { icon: Users, label: "Partnership", value: "partnership" },
    { icon: Globe, label: "Sales Inquiry", value: "sales" }
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
                Contact Us
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Hero Section */}
        <div className="text-center mb-16 pt-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Heart className="w-4 h-4 mr-2" />
            We're Here to Help
          </Badge>
          
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            Get in Touch
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              With Our Team
            </span>
          </h1>
          
          <p className="text-xl text-blue-200 mb-8 max-w-3xl mx-auto leading-relaxed">
            Have questions about VeloFlux? Need support? Want to share feedback? 
            We'd love to hear from you and help you succeed.
          </p>
        </div>

        {/* Contact Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {contactMethods.map((method, index) => {
            const IconComponent = method.icon;
            return (
              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
                <div className={`w-12 h-12 bg-gradient-to-r ${method.color} rounded-xl flex items-center justify-center mb-4`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{method.title}</h3>
                <p className="text-blue-200 text-sm mb-3">{method.description}</p>
                <p className="text-white font-mono text-sm mb-2">{method.value}</p>
                <p className="text-blue-300 text-xs">{method.response}</p>
              </Card>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
            <div className="flex items-center mb-6">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mr-4">
                <Send className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Send us a Message</h2>
                <p className="text-blue-300">We'll get back to you as soon as possible</p>
              </div>
            </div>

            {isSubmitted ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Message Sent!</h3>
                <p className="text-blue-200 mb-6">Thank you for contacting us. We'll respond within 24 hours.</p>
                <Button 
                  variant="outline" 
                  onClick={() => setIsSubmitted(false)}
                  className="border-blue-400/50 text-blue-200 hover:bg-blue-600/30"
                >
                  Send Another Message
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name" className="text-white font-medium mb-2 block">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="email" className="text-white font-medium mb-2 block">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-blue-400/20"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="category" className="text-white font-medium mb-2 block">Category</Label>
                  <Select onValueChange={(value) => handleInputChange('category', value)}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-600">
                      {categories.map((category) => {
                        const IconComponent = category.icon;
                        return (
                          <SelectItem key={category.value} value={category.value} className="text-white hover:bg-slate-700">
                            <div className="flex items-center">
                              <IconComponent className="w-4 h-4 mr-2" />
                              {category.label}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="subject" className="text-white font-medium mb-2 block">Subject</Label>
                  <Input
                    id="subject"
                    value={formData.subject}
                    onChange={(e) => handleInputChange('subject', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-blue-400/20"
                    placeholder="Brief description of your inquiry"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="message" className="text-white font-medium mb-2 block">Message</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => handleInputChange('message', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder-blue-300 focus:border-blue-400 focus:ring-blue-400/20 min-h-[120px]"
                    placeholder="Please provide details about your inquiry..."
                    required
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white py-3 font-semibold"
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Send className="w-4 h-4 mr-2" />
                      Send Message
                    </div>
                  )}
                </Button>
              </form>
            )}
          </Card>

          {/* Additional Information */}
          <div className="space-y-6">
            {/* FAQ Section */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center mr-3">
                  <HelpCircle className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Quick Help</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <h4 className="text-white font-medium mb-1">Getting Started</h4>
                  <p className="text-blue-200 text-sm">Check our documentation for setup guides and tutorials.</p>
                </div>
                <div className="p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <h4 className="text-white font-medium mb-1">Technical Issues</h4>
                  <p className="text-blue-200 text-sm">Include error messages and system details in your message.</p>
                </div>
                <div className="p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <h4 className="text-white font-medium mb-1">Feature Requests</h4>
                  <p className="text-blue-200 text-sm">Tell us about features you'd like to see in VeloFlux.</p>
                </div>
              </div>
            </Card>

            {/* Office Information */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                  <MapPin className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Our Office</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">VeloFlux Headquarters</p>
                    <p className="text-blue-200 text-sm">123 Tech Street, Suite 456<br />San Francisco, CA 94105</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-blue-400 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-white font-medium">Business Hours</p>
                    <p className="text-blue-200 text-sm">Monday - Friday: 9:00 AM - 6:00 PM PST<br />Saturday - Sunday: Closed</p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Support Stats */}
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl">
              <div className="flex items-center mb-4">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center mr-3">
                  <Headphones className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white">Support Stats</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-green-400 mb-1">&lt;4h</div>
                  <div className="text-blue-200 text-xs">Avg Response Time</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-purple-400 mb-1">98%</div>
                  <div className="text-blue-200 text-xs">Satisfaction Rate</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-blue-400 mb-1">24/7</div>
                  <div className="text-blue-200 text-xs">Live Chat</div>
                </div>
                <div className="text-center p-3 bg-slate-700/30 border border-slate-500/30 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-400 mb-1">50+</div>
                  <div className="text-blue-200 text-xs">Languages</div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
