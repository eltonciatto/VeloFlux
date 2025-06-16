import React, { useState } from 'react';
import Header from '@/components/Header';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

export const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [first, setFirst] = useState(user?.first_name || '');
  const [last, setLast] = useState(user?.last_name || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(first, last);
      toast({ title: 'Profile updated' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <div className="max-w-md mx-auto p-6">
        <Card className="p-6 space-y-4 bg-white/5 border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white">Your Profile</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={first}
              onChange={(e) => setFirst(e.target.value)}
              placeholder="First Name"
              className="bg-white/10 border-white/20 text-white"
            />
            <Input
              value={last}
              onChange={(e) => setLast(e.target.value)}
              placeholder="Last Name"
              className="bg-white/10 border-white/20 text-white"
            />
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              Save Changes
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
