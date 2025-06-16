import React, { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { apiFetch } from '@/lib/api';
import Header from '@/components/Header';
import { Tenant, NewTenant } from './tenant-utils';

export const TenantManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(false);
  const [newTenant, setNewTenant] = useState<NewTenant>({
    id: '',
    name: '',
    plan: 'free',
    contact_email: '',
    custom_domain: '',
  });  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  
  const fetchTenants = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiFetch('/api/tenants');
      setTenants(data || []);
    } catch (err) {
      console.error('Failed to fetch tenants', err);
      toast({
        title: 'Error',
        description: 'Failed to load tenants',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Fetch tenants on component mount
  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingTenant) {
      setEditingTenant({
        ...editingTenant,
        [name]: value,
      });
    } else {
      setNewTenant({
        ...newTenant,
        [name]: value,
      });
    }
  }, [editingTenant, newTenant]);
  const handleSelectChange = useCallback((name: string, value: string) => {
    if (editingTenant) {
      setEditingTenant({
        ...editingTenant,
        [name]: value,
      });
    } else {
      setNewTenant({
        ...newTenant,
        [name]: value,
      });
    }
  }, [editingTenant, newTenant]);  const addTenant = useCallback(async () => {
    try {
      await apiFetch('/api/tenants', {
        method: 'POST',
        body: JSON.stringify(newTenant),
      });
      toast({
        title: 'Success',
        description: 'Tenant added successfully',
      });
      fetchTenants();
      setNewTenant({
        id: '',
        name: '',
        plan: 'free',
        contact_email: '',
        custom_domain: '',
      });
    } catch (err) {
      console.error('Failed to add tenant', err);
      toast({
        title: 'Error',
        description: 'Failed to add tenant',
        variant: 'destructive',
      });
    }
  }, [newTenant, toast, fetchTenants]);  const updateTenant = useCallback(async () => {
    if (!editingTenant) return;
    
    try {
      await apiFetch(`/api/tenants/${editingTenant.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingTenant),
      });
      toast({
        title: 'Success',
        description: 'Tenant updated successfully',
      });
      fetchTenants();
      setEditingTenant(null);
    } catch (err) {
      console.error('Failed to update tenant', err);
      toast({
        title: 'Error',
        description: 'Failed to update tenant',
        variant: 'destructive',
      });
    }
  }, [editingTenant, toast, fetchTenants]);  const deleteTenant = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this tenant? This action cannot be undone.')) {
      return;
    }
    
    try {
      await apiFetch(`/api/tenants/${id}`, {
        method: 'DELETE',
      });
      toast({
        title: 'Success',
        description: 'Tenant deleted successfully',
      });
      fetchTenants();
    } catch (err) {
      console.error('Failed to delete tenant', err);
      toast({
        title: 'Error',
        description: 'Failed to delete tenant',
        variant: 'destructive',
      });
    }
  }, [toast, fetchTenants]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Tenant Management</h1>
          <p className="text-blue-200">Create and manage VeloFlux tenant accounts</p>
        </div>

        {/* Add/Edit Tenant Form */}
        <Card className="p-6 mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingTenant ? 'Edit Tenant' : 'Add New Tenant'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="id" className="text-white">Tenant ID</Label>
              <Input
                id="id"
                name="id"
                value={editingTenant?.id || newTenant.id}
                onChange={handleInputChange}
                disabled={!!editingTenant}
                placeholder="unique-tenant-id"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="name" className="text-white">Tenant Name</Label>
              <Input
                id="name"
                name="name"
                value={editingTenant?.name || newTenant.name}
                onChange={handleInputChange}
                placeholder="Company Name"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="plan" className="text-white">Plan</Label>
              <Select
                value={editingTenant?.plan || newTenant.plan}
                onValueChange={(value) => handleSelectChange('plan', value)}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="pro">Pro</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contact_email" className="text-white">Contact Email</Label>
              <Input
                id="contact_email"
                name="contact_email"
                value={editingTenant?.contact_email || newTenant.contact_email}
                onChange={handleInputChange}
                placeholder="admin@example.com"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="custom_domain" className="text-white">Custom Domain (Optional)</Label>
              <Input
                id="custom_domain"
                name="custom_domain"
                value={editingTenant?.custom_domain || newTenant.custom_domain}
                onChange={handleInputChange}
                placeholder="app.example.com"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              {editingTenant ? (
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={updateTenant} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditingTenant(null)} 
                    variant="outline" 
                    className="flex-1 bg-transparent border-white/20 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={addTenant} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Tenant
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tenant List */}
        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Tenants</h2>
            <Button 
              onClick={fetchTenants} 
              variant="outline" 
              size="sm" 
              className="border-white/20 hover:bg-white/10"
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          
          {tenants.length === 0 ? (
            <p className="text-white/70 text-center py-8">
              {loading ? 'Loading tenants...' : 'No tenants found. Create your first tenant above.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="border-b border-white/20">
                  <tr>
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Plan</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Contact</th>
                    <th className="text-left py-3 px-4">Created</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4">{tenant.id}</td>
                      <td className="py-3 px-4">{tenant.name}</td>
                      <td className="py-3 px-4">
                        <Badge className={
                          tenant.plan === 'enterprise' ? 'bg-purple-500/20 text-purple-300' :
                          tenant.plan === 'pro' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }>
                          {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={tenant.active ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}>
                          {tenant.active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">{tenant.contact_email}</td>
                      <td className="py-3 px-4">
                        {new Date(tenant.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingTenant(tenant)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteTenant(tenant.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default TenantManagement;
