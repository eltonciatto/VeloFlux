import React, { useState, useEffect } from 'react';
import { useAuth } from './use-auth';
import { TenantContext } from './tenant-context';
import { getStoredTenantId, setStoredTenantId } from './tenant-utils';

export const TenantProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);

  // Initialize tenant from localStorage or user's tenant
  useEffect(() => {
    const storedTenantId = getStoredTenantId();
    
    if (storedTenantId) {
      setSelectedTenantId(storedTenantId);
    } else if (user?.tenant_id) {
      setSelectedTenantId(user.tenant_id);
      setStoredTenantId(user.tenant_id);
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
    setStoredTenantId(id);
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
