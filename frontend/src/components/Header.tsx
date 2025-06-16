
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { useTranslation } from 'react-i18next';
import { TenantSelector } from '@/components/TenantSelector';
import { 
  LogOut, 
  User, 
  Settings, 
  BarChart3, 
  Shield,
  BookOpen,
  Home
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Header = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { t } = useTranslation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-8">
            <div 
              className="flex items-center space-x-2 cursor-pointer"
              onClick={() => navigate('/')}
            >
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">VF</span>
              </div>
              <span className="text-white font-bold text-xl">VeloFlux LB</span>
            </div>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center space-x-6">
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                onClick={() => navigate('/')}
              >
                <Home className="w-4 h-4 mr-2" />
                Home
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                onClick={() => navigate('/about')}
              >
                About
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                onClick={() => navigate('/pricing')}
              >
                Pricing
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                onClick={() => navigate('/docs')}
              >
                <BookOpen className="w-4 h-4 mr-2" />
                Docs
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                onClick={() => navigate('/contact')}
              >
                Contact
              </Button>
              {user && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-200 hover:text-white hover:bg-blue-600/20"
                  onClick={() => navigate('/dashboard')}
                >
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              )}
            </nav>
          </div>

          <div className="flex items-center space-x-4">
            {user && <TenantSelector />}
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span className="text-white">{user.email}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 bg-slate-900 border-slate-800">
                  <DropdownMenuItem 
                    onClick={() => navigate('/profile')}
                    className="cursor-pointer"
                  >
                    <User className="w-4 h-4 mr-2" />
                    {t('navigation.profile')}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => navigate('/dashboard')}
                    className="cursor-pointer"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {t('navigation.dashboard')}
                  </DropdownMenuItem>
                  {user.role === 'admin' && (
                    <DropdownMenuItem 
                      onClick={() => navigate('/admin')}
                      className="cursor-pointer"
                    >
                      <Shield className="w-4 h-4 mr-2" />
                      {t('pages.admin.title')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator className="bg-slate-800" />
                  <DropdownMenuItem 
                    onClick={handleLogout}
                    className="cursor-pointer text-red-400 hover:text-red-300"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('navigation.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/login')}
                  className="text-blue-200 hover:text-white"
                >
                  {t('navigation.login')}
                </Button>
                <Button 
                  size="sm" 
                  onClick={() => navigate('/register')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  {t('pages.register.title')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
