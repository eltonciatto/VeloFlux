import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { adminFetch } from '@/lib/api';
import Header from '@/components/Header';

export const Admin = () => {
  const { toast } = useToast();
  const [address, setAddress] = useState('');
  const [weight, setWeight] = useState(100);
  const [region, setRegion] = useState('');
  const [user, setUser] = useState('');
  const [pass, setPass] = useState('');

  const addBackend = async () => {
    try {
      await adminFetch('/admin/backends', user, pass, {
        method: 'POST',
        body: JSON.stringify({ address, weight, region }),
      });
      toast({ title: 'Backend added' });
      setAddress('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const drain = async () => {
    try {
      await adminFetch('/admin/drain', user, pass, { method: 'POST' });
      toast({ title: 'Cluster draining initiated' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <Card className="p-6 space-y-4 bg-white/5 border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white">Admin Actions</h2>
          <Input value={user} onChange={e => setUser(e.target.value)} placeholder="Admin user" className="bg-white/10 border-white/20 text-white" />
          <Input type="password" value={pass} onChange={e => setPass(e.target.value)} placeholder="Admin password" className="bg-white/10 border-white/20 text-white" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Backend address" className="bg-white/10 border-white/20 text-white" />
            <Input type="number" value={weight} onChange={e => setWeight(parseInt(e.target.value) || 0)} placeholder="Weight" className="bg-white/10 border-white/20 text-white" />
            <Input value={region} onChange={e => setRegion(e.target.value)} placeholder="Region" className="bg-white/10 border-white/20 text-white" />
          </div>
          <Button onClick={addBackend} className="bg-blue-600 hover:bg-blue-700 w-full">Add Backend</Button>
          <Button onClick={drain} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10">Drain Cluster</Button>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
