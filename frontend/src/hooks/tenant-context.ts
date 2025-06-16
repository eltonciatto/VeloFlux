import React from 'react';

interface TenantContextProps {
  selectedTenantId: string | null;
  setSelectedTenantId: (id: string | null) => void;
}

export const TenantContext = React.createContext<TenantContextProps | undefined>(undefined);
