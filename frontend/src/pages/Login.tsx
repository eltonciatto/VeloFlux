import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, ArrowRight, Brain, Zap, Shield, AlertCircle, Wifi, WifiOff } from 'lucide-react';

export const Login = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const from = (
    (location.state as { from?: { pathname: string } } | null)?.from?.pathname ||
    '/dashboard'
  );

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

  const getErrorMessage = (error: unknown): string => {
    if (!isOnline) {
      return 'No internet connection. Please check your network and try again.';
    }
    
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      
      if (message.includes('network') || message.includes('fetch')) {
        return 'Unable to connect to server. Please check your connection and try again.';
      }
      
      if (message.includes('unauthorized') || message.includes('invalid credentials')) {
        return 'Invalid email or password. Please check your credentials and try again.';
      }
      
      if (message.includes('too many')) {
        return 'Too many login attempts. Please wait 15 minutes before trying again.';
      }
      
      if (message.includes('demo credentials')) {
        return 'Demo credentials are not allowed. Please use your real account credentials.';
      }
      
      return error.message;
    }
    
    return 'An unexpected error occurred. Please try again.';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!user || !pass) {
      setError('Email and password are required');
      toast({ title: 'Login failed', description: 'Email and password are required', variant: 'destructive' });
      return;
    }
    
    if (!isOnline) {
      setError('No internet connection');
      toast({ title: 'Connection error', description: 'Please check your internet connection', variant: 'destructive' });
      return;
    }
    
    setIsLoading(true);
    try {
      await login(user, pass);
      toast({ title: 'Welcome back!', description: 'Successfully signed in to your account' });
      navigate(from, { replace: true });
    } catch (err: unknown) {
      const message = getErrorMessage(err);
      setError(message);
      toast({ title: 'Login failed', description: message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Modern Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.15),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(139,92,246,0.15),transparent_50%)]"></div>
      
      {/* Floating Elements */}
      <div className="absolute top-20 left-20 w-2 h-2 bg-blue-400 rounded-full animate-pulse opacity-60"></div>
      <div className="absolute top-40 right-32 w-1 h-1 bg-purple-400 rounded-full animate-ping opacity-40"></div>
      <div className="absolute bottom-40 left-40 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse opacity-50"></div>
      
      <div className="relative z-10 w-full max-w-md mx-auto p-6">
        <div className="text-center mb-8">
          <Badge className="mb-6 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Brain className="w-4 h-4 mr-2" />
            AI-Powered Dashboard
          </Badge>
          
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-4">
            Welcome Back
          </h1>
          
          <p className="text-blue-200 text-lg">
            Sign in to your VeloFlux dashboard
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 space-y-6">
          {/* Connection Status */}
          {!isOnline && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
              <WifiOff className="h-4 w-4" />
              <AlertDescription>
                You're offline. Please check your internet connection.
              </AlertDescription>
            </Alert>
          )}
          
          {/* Error Display */}
          {error && (
            <Alert className="bg-red-500/10 border-red-500/20 text-red-200">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Success indicator when online */}
          {isOnline && !error && !isLoading && (
            <div className="flex items-center text-green-200 text-sm">
              <Wifi className="h-4 w-4 mr-2" />
              Connected to VeloFlux
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                <Input 
                  value={user} 
                  onChange={(e) => {
                    setUser(e.target.value);
                    setError(null); // Clear error when user types
                  }} 
                  placeholder="Enter your email"
                  type="email"
                  className={`bg-white/10 border-white/20 text-white pl-12 h-12 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    error && !user ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
              {error && !user && (
                <p className="text-red-300 text-sm ml-1">Email is required</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-blue-300 w-5 h-5" />
                <Input 
                  type="password" 
                  value={pass} 
                  onChange={(e) => {
                    setPass(e.target.value);
                    setError(null); // Clear error when user types
                  }} 
                  placeholder="Enter your password"
                  className={`bg-white/10 border-white/20 text-white pl-12 h-12 rounded-xl focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 transition-all duration-300 ${
                    error && !pass ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''
                  }`}
                  disabled={isLoading}
                  required
                />
              </div>
              {error && !pass && (
                <p className="text-red-300 text-sm ml-1">Password is required</p>
              )}
            </div>

            <Button 
              type="submit" 
              className={`w-full h-12 font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group ${
                !isOnline 
                  ? 'bg-gray-600 hover:bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'
              } text-white`}
              disabled={isLoading || !isOnline}
            >
              {!isOnline ? (
                <div className="flex items-center">
                  <WifiOff className="w-5 h-5 mr-2" />
                  No Connection
                </div>
              ) : isLoading ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center">
                  Sign In
                  <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              )}
            </Button>
          </form>

          <div className="text-center pt-4 border-t border-white/10">
            <p className="text-blue-200">
              Don't have an account?{" "}
              <a 
                href="/register" 
                className="text-blue-400 hover:text-blue-300 font-semibold hover:underline transition-colors duration-200"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/register');
                }}
              >
                Create one now
              </a>
            </p>
          </div>
        </Card>

        {/* Features Preview */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <Brain className="w-6 h-6 text-purple-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">AI Analytics</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <Zap className="w-6 h-6 text-yellow-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">Lightning Fast</p>
          </div>
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-4">
            <Shield className="w-6 h-6 text-green-400 mx-auto mb-2" />
            <p className="text-xs text-blue-200 font-medium">Secure</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
