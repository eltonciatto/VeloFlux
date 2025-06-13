import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import TenantSelector from '@/components/TenantSelector';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  return (
    <header className="bg-slate-800 text-blue-200 p-4 flex justify-between items-center border-b border-white/10">
      <div className="flex items-center gap-4">
        <div className="font-bold text-white">VeloFlux LB</div>
        {user && <TenantSelector />}
      </div>
      <div className="flex items-center gap-4">
        <nav className="hidden md:flex mr-6">
          <ul className="flex items-center gap-6">
            <li>
              <Link to="/dashboard" className="text-blue-200 hover:text-white transition-colors">
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/admin" className="text-blue-200 hover:text-white transition-colors">
                Admin
              </Link>
            </li>
            {user?.role === 'owner' && (
              <li>
                <Link to="/tenants" className="text-blue-200 hover:text-white transition-colors">
                  Tenants
                </Link>
              </li>
            )}
          </ul>
        </nav>
        {user && (
          <Link to="/profile" className="text-sm hover:underline">
            {user.first_name} {user.last_name}
          </Link>
        )}
        <Button size="sm" variant="outline" className="border-white/20" onClick={logout}>
          Logout
        </Button>
      </div>
    </header>
  );
};

export default Header;
