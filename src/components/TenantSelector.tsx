import React, { useState, useEffect } from 'react';
import { Check, ChevronDown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { apiFetch } from '@/lib/api';

interface Tenant {
  id: string;
  name: string;
}

interface TenantSelectorProps {
  onTenantChange?: (tenantId: string) => void;
}

export const TenantSelector: React.FC<TenantSelectorProps> = ({ onTenantChange }) => {
  const { user } = useAuth();
  const { selectedTenantId, setSelectedTenantId } = useTenant();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const response = await apiFetch('/api/tenants');
      setTenants(response || []);
      
      if (user?.tenant_id && response?.length > 0) {
        const userTenant = response.find((t: Tenant) => t.id === user.tenant_id);
        if (userTenant) {
          setCurrentTenant(userTenant);
        } else if (response.length > 0) {
          setCurrentTenant(response[0]);
        }
      } else if (response?.length > 0) {
        setCurrentTenant(response[0]);
      }
    } catch (error) {
      console.error('Failed to fetch tenants', error);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchTenants();
  }, [user, selectedTenantId]);  const handleTenantSelect = (tenant: Tenant) => {
    setCurrentTenant(tenant);
    // Update tenant context
    setSelectedTenantId(tenant.id);
    
    if (onTenantChange) {
      onTenantChange(tenant.id);
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className="w-[200px] justify-start opacity-70">
        <Building2 className="mr-2 h-4 w-4" />
        Loading tenants...
      </Button>
    );
  }

  if (!currentTenant) {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="w-[200px] justify-start">
          <Building2 className="mr-2 h-4 w-4" />
          {currentTenant.name}
          <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[200px] bg-slate-900 border-slate-800">
        {tenants.map((tenant) => (
          <DropdownMenuItem
            key={tenant.id}
            onClick={() => handleTenantSelect(tenant)}
            className="cursor-pointer flex items-center justify-between"
          >
            <span>{tenant.name}</span>
            {currentTenant.id === tenant.id && <Check className="h-4 w-4 ml-2" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default TenantSelector;
