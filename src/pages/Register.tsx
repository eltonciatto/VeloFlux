import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { User, Mail, Lock, Building, ArrowRight, Brain, Sparkles, Check } from 'lucide-react';

export const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    company: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validatePassword = (password: string) => {
    const requirements = [
      { test: password.length >= 8, text: 'At least 8 characters' },
      { test: /[a-z]/.test(password), text: 'Lowercase letter' },
      { test: /[A-Z]/.test(password), text: 'Uppercase letter' },
      { test: /\d/.test(password), text: 'Number' },
      { test: /[@$!%*?&]/.test(password), text: 'Special character' },
    ];
    return requirements;
  };

  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.email || !formData.password || !formData.firstName || 
        !formData.lastName || !formData.company) {
      toast({
        title: 'Registration failed',
        description: 'All fields are required',
        variant: 'destructive',
      });
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: 'Registration failed',
        description: 'Passwords do not match',
        variant: 'destructive',
      });
      return;
    }

    if (!isPasswordValid) {
      toast({
        title: 'Registration failed',
        description: 'Password does not meet requirements',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      // Register user
      const response = await apiFetch('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          company: formData.company,
        }),
      });

      toast({
        title: 'Registration successful',
        description: 'Your account has been created',
      });

      // Store token and redirect to dashboard
      localStorage.setItem('vf_token', response.token);
      localStorage.setItem('vf_user', JSON.stringify({
        user_id: response.user_id,
        tenant_id: response.tenant_id,
        email: formData.email,
        first_name: formData.firstName,
        last_name: formData.lastName,
        role: 'owner',
      }));

      // Redirect to dashboard
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Registration failed';
      toast({ title: 'Registration failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden py-12">
      {/* Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-32 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-20 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-20 left-40 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-50"></div>
      <div className="absolute top-60 right-20 w-1 h-1 bg-green-400 rounded-full animate-pulse opacity-40"></div>
      
      <div className="relative z-10 w-full max-w-lg mx-auto p-6">
        <div className="text-center mb-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Sparkles className="w-4 h-4 mr-2" />
            Start Your Journey
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
            Join VeloFlux
          </h1>
          
          <p className="text-blue-200 text-lg">
            Create your account and experience the future of load balancing
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 space-y-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white font-medium">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                  <Input 
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-white font-medium">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                  <Input 
                    id="lastName"
                    name="lastName" 
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
            
            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="company" className="text-white font-medium">Company Name</Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input 
                  id="company"
                  name="company" 
                  value={formData.company}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
            </div>
            
            {/* Password */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white font-medium">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input 
                  id="password"
                  name="password"
                  type="password" 
                  value={formData.password}
                  onChange={handleChange}
                  className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
              
              {/* Password Requirements */}
              {formData.password && (
                <div className="mt-3 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className={`flex items-center text-xs ${req.test ? 'text-green-400' : 'text-blue-300'}`}>
                      <Check className={`w-3 h-3 mr-2 ${req.test ? 'text-green-400' : 'text-gray-400'}`} />
                      {req.text}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-white font-medium">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleChange} 
                  className="bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300"
                  disabled={isLoading}
                />
              </div>
              {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Creating Account...
                </div>
              ) : (
                <div className="flex items-center">
                  Create Account
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-blue-200">
              Already have an account?{" "}
              <a 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Sign in here
              </a>
            </p>
          </div>
        </Card>

        {/* Benefits Preview */}
        <div className="mt-8 text-center">
          <p className="text-blue-200 text-sm mb-4">Join thousands of developers who trust VeloFlux</p>
          <div className="flex justify-center space-x-8 text-xs text-blue-300">
            <div className="flex items-center">
              <Brain className="w-4 h-4 mr-1 text-purple-400" />
              AI-Powered
            </div>
            <div className="flex items-center">
              <Sparkles className="w-4 h-4 mr-1 text-yellow-400" />
              Enterprise Ready
            </div>
            <div className="flex items-center">
              <Check className="w-4 h-4 mr-1 text-green-400" />
              Free Trial
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;
