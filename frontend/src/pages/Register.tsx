import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';
import { getEndpoint } from '@/config/environment';
import { User, Mail, Lock, Building, ArrowRight, Brain, Sparkles, Check, AlertCircle, Wifi, WifiOff, X } from 'lucide-react';

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
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showPasswordRequirements, setShowPasswordRequirements] = useState(false);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    
    // Clear field-specific error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Monitor network status
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

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
  const getErrorMessage = (error: unknown): string => {
    if (!isOnline) {
      return 'No internet connection. Please check your network and try again.';
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'Unable to connect to server. Please check your connection and try again.';
      }
      
      if (message.includes('user already exists') || message.includes('email already')) {
        return 'An account with this email already exists. Try logging in instead.';
      }
      
      if (message.includes('invalid email')) {
        return 'Please enter a valid email address.';
      }
      
      if (message.includes('password')) {
        return 'Password does not meet security requirements.';
      }
      
      if (message.includes('tenant_name') || message.includes('company')) {
        return 'Company name is required and must be unique.';
      }
      
      return error.message;
    }
    
    return 'Registration failed. Please check your information and try again.';
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    if (!formData.company) {
      newErrors.company = 'Company name is required';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (!isPasswordValid) {
      newErrors.password = 'Password does not meet security requirements';
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  const passwordRequirements = validatePassword(formData.password);
  const isPasswordValid = passwordRequirements.every(req => req.test);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isOnline) {
      toast({
        title: 'Connection error',
        description: 'Please check your internet connection and try again.',
        variant: 'destructive',
      });
      return;
    }
    
    if (!validateForm()) {
      toast({
        title: 'Registration failed',
        description: 'Please check the form for errors and try again.',
        variant: 'destructive',
      });
      return;    }
    
    setIsLoading(true);    try {
      // Register user
      const response = await apiFetch(getEndpoint('REGISTER'), {
        method: 'POST',
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName,
          last_name: formData.lastName,
          tenant_name: formData.company,
          plan: 'free', // Default plan
        }),
      });
      
      toast({
        title: 'Registration successful!',
        description: 'Welcome to VeloFlux! Your account has been created.',
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
      const message = getErrorMessage(err);
      
      // Set specific field errors if applicable
      if (message.includes('email already exists')) {
        setErrors({ email: 'This email is already registered' });
      }
      
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
        </div>        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 space-y-6">
          {/* Connection Status */}
          {!isOnline && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Please check your internet connection.
              </AlertDescription>
            </Alert>
          )}
          
          {/* General Errors */}
          {Object.keys(errors).length > 0 && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please correct the errors below and try again.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Success indicator when online */}
          {isOnline && Object.keys(errors).length === 0 && !isLoading && (
            <div className="flex items-center text-green-200 text-sm">
              <Wifi className="h-4 w-4 mr-2" />
              Connected to VeloFlux
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name Fields */}            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-white font-medium">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                  <Input 
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                      errors.firstName ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.firstName && (
                  <p className="text-red-300 text-sm ml-1 flex items-center">
                    <X className="w-3 h-3 mr-1" />
                    {errors.firstName}
                  </p>
                )}
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
                    className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                      errors.lastName ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                    }`}
                    disabled={isLoading}
                    required
                  />
                </div>
                {errors.lastName && (
                  <p className="text-red-300 text-sm ml-1 flex items-center">
                    <X className="w-3 h-3 mr-1" />
                    {errors.lastName}
                  </p>
                )}
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
                  className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    errors.company ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>              {errors.company && (
                <p className="text-red-300 text-sm ml-1 flex items-center">
                  <X className="w-3 h-3 mr-1" />
                  {errors.company}
                </p>
              )}
            </div>
            
            {/* Email */}            <div className="space-y-2">
              <Label htmlFor="email" className="text-white font-medium">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-4 h-4" />
                <Input 
                  id="email"
                  name="email"
                  type="email" 
                  value={formData.email}
                  onChange={handleChange}
                  className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    errors.email ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.email && (
                <p className="text-red-300 text-sm ml-1 flex items-center">
                  <X className="w-3 h-3 mr-1" />
                  {errors.email}
                </p>
              )}
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
                  onChange={(e) => {
                    handleChange(e);
                    setShowPasswordRequirements(e.target.value.length > 0);
                  }}
                  onFocus={() => setShowPasswordRequirements(true)}
                  onBlur={() => setShowPasswordRequirements(false)}
                  className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    errors.password ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.password && (
                <p className="text-red-300 text-sm ml-1 flex items-center">
                  <X className="w-3 h-3 mr-1" />
                  {errors.password}
                </p>
              )}              
              {/* Password Requirements */}
              {(showPasswordRequirements || formData.password.length > 0) && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-3 space-y-2">
                  <p className="text-blue-200 text-sm font-medium">Password Requirements:</p>
                  {passwordRequirements.map((req, index) => (
                    <div key={index} className="flex items-center text-sm">
                      {req.test ? (
                        <Check className="w-3 h-3 text-green-400 mr-2" />
                      ) : (
                        <X className="w-3 h-3 text-red-400 mr-2" />
                      )}
                      <span className={req.test ? 'text-green-200' : 'text-red-200'}>
                        {req.text}
                      </span>
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
                  className={`bg-white/10 border-white/20 text-white pl-10 h-11 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    errors.confirmPassword ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-red-300 text-sm ml-1 flex items-center">
                  <X className="w-3 h-3 mr-1" />
                  {errors.confirmPassword}
                </p>
              )}
              {formData.confirmPassword && formData.password !== formData.confirmPassword && !errors.confirmPassword && (
                <p className="text-red-300 text-sm ml-1 flex items-center">
                  <X className="w-3 h-3 mr-1" />
                  Passwords do not match
                </p>
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
