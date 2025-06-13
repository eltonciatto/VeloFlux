import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { apiFetch } from '@/lib/api';

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

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

    // Password strength validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(formData.password)) {
      toast({
        title: 'Registration failed',
        description: 'Password must be at least 8 characters and include uppercase, lowercase, number and special character',
        variant: 'destructive',
      });
      return;
    }

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
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <Card className="p-6 space-y-4 w-full max-w-md bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">Create Your VeloFlux Account</h1>
          <p className="text-blue-200 mt-2">Get started with your load balancer dashboard</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName" className="text-white">First Name</Label>
              <Input 
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white" 
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="lastName" className="text-white">Last Name</Label>
              <Input 
                id="lastName"
                name="lastName" 
                value={formData.lastName}
                onChange={handleChange}
                className="bg-white/10 border-white/20 text-white" 
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="company" className="text-white">Company Name</Label>
            <Input 
              id="company"
              name="company" 
              value={formData.company}
              onChange={handleChange}
              className="bg-white/10 border-white/20 text-white" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-white">Email</Label>
            <Input 
              id="email"
              name="email"
              type="email" 
              value={formData.email}
              onChange={handleChange}
              className="bg-white/10 border-white/20 text-white" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password" className="text-white">Password</Label>
            <Input 
              id="password"
              name="password"
              type="password" 
              value={formData.password}
              onChange={handleChange}
              className="bg-white/10 border-white/20 text-white" 
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-white">Confirm Password</Label>
            <Input 
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange} 
              className="bg-white/10 border-white/20 text-white" 
            />
          </div>
          
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Create Account
          </Button>
          
          <div className="text-center mt-4">
            <p className="text-blue-200">
              Already have an account?{" "}
              <a 
                href="/login" 
                className="text-blue-400 hover:text-blue-300 hover:underline"
                onClick={(e) => {
                  e.preventDefault();
                  navigate('/login');
                }}
              >
                Log in
              </a>
            </p>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default Register;
