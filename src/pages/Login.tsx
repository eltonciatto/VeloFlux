import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export const Login = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !pass) {
      toast({ title: 'Login failed', description: 'Username and password required', variant: 'destructive' });
      return;
    }
    const token = btoa(`${user}:${pass}`);
    login(token);
    navigate(from, { replace: true });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 p-6">
      <Card className="p-6 space-y-4 w-full max-w-sm bg-white/5 border-white/10 backdrop-blur-sm">
        <h1 className="text-2xl font-bold text-white text-center">VeloFlux Login</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input value={user} onChange={(e) => setUser(e.target.value)} placeholder="Username" className="bg-white/10 border-white/20 text-white" />
          <Input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Password" className="bg-white/10 border-white/20 text-white" />
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">Login</Button>
        </form>
      </Card>
    </div>
  );
};

export default Login;
