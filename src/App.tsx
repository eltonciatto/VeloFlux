import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/sonner';
import Index from '@/pages/Index';
import { Dashboard } from '@/pages/Dashboard';
import NotFound from '@/pages/NotFound';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import Admin from '@/pages/Admin';
import Profile from '@/pages/Profile';
import TenantManagement from '@/pages/TenantManagement';
import UserManager from '@/pages/UserManager';
import Docs from '@/pages/Docs';
import Pricing from '@/pages/Pricing';
import TermsOfService from '@/pages/TermsOfService';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import Contact from '@/pages/Contact';
import About from '@/pages/About';
import { AuthProvider } from '@/hooks/auth-provider';
import EnvironmentIndicator from '@/components/EnvironmentIndicator';
import { TenantProvider } from '@/hooks/tenant-provider';
import { RequireAuth } from '@/components/RequireAuth';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TenantProvider>
          <Router>
            <EnvironmentIndicator />
            <Toaster position="top-right" />
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/about" element={<About />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <RequireAuth>
                  <Dashboard />
                </RequireAuth>
              }
            />
            <Route
              path="/admin"
              element={
                <RequireAuth>
                  <Admin />
                </RequireAuth>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireAuth>
                  <Profile />
                </RequireAuth>
              }
            />
            <Route
              path="/tenants"
              element={
                <RequireAuth>
                  <TenantManagement />
                </RequireAuth>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        </TenantProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
