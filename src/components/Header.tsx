import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <header className="bg-slate-800 text-blue-200 p-4 flex justify-between items-center border-b border-white/10">
      <div className="font-bold text-white">VeloFlux LB</div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="text-sm">
            {user.first_name} {user.last_name}
          </span>
        )}
        <Button size="sm" variant="outline" className="border-white/20" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
