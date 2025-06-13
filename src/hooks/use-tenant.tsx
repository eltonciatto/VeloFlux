import React, { createContext, useState, useContext, useEffect } from 'react';
import { useAuth } from './use-auth';

interface TenantContextProps {
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;
}

const TenantContext = createContext<TenantContextProps | undefined>(undefined);

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Initialize tenant from localStorage or user's tenant
  useEffect(() => {
    const storedTenantId = localStorage.getItem('vf_selected_tenant');
    
    if (storedTenantId) {
      setSelectedTenantId(storedTenantId);
    } else if (user?.tenant_id) {
      setSelectedTenantId(user.tenant_id);
      localStorage.setItem('vf_selected_tenant', user.tenant_id);
    }
  }, [user]);

  // Listen for tenant changes from other components
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'vf_selected_tenant') {
        setSelectedTenantId(e.newValue);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleSetSelectedTenantId = (id: string | null) => {
    setSelectedTenantId(id);
    
    if (id) {
      localStorage.setItem('vf_selected_tenant', id);
    } else {
      localStorage.removeItem('vf_selected_tenant');
    }
  };

  return (
    <TenantContext.Provider 
      value={{ 
        selectedTenantId, 
        setSelectedTenantId: handleSetSelectedTenantId 
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = () => {
  const context = useContext(TenantContext);
  
  if (context === undefined) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  
  return context;
};

export default useTenant;
