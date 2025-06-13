import React, { useState, useEffect } from 'react';
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
import { Plus, Trash2, Edit, RefreshCw, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useTenant } from '@/hooks/use-tenant';
import { apiFetch } from '@/lib/api';
import Header from '@/components/Header';

// Types for users
interface User {
  user_id: string;
  email: string;
  tenant_id: string;
  role: string;
  first_name?: string;
  last_name?: string;
}

export const UserManager = () => {
  const { toast } = useToast();
  const { selectedTenantId } = useTenant();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    role: 'member',
    first_name: '',
    last_name: '',
  });
  const [editingUser, setEditingUser] = useState<User | null>(null);

  // Fetch users when tenant changes
  useEffect(() => {
    if (selectedTenantId) {
      fetchUsers();
    }
  }, [selectedTenantId]);

  const fetchUsers = async () => {
    if (!selectedTenantId) return;

    try {
      setLoading(true);
      const data = await apiFetch(`/api/tenants/${selectedTenantId}/users`);
      setUsers(data || []);
    } catch (err) {
      console.error('Failed to fetch users', err);
      toast({
        title: 'Error',
        description: 'Failed to load users',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value,
      });
    } else {
      setNewUser({
        ...newUser,
        [name]: value,
      });
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    if (editingUser) {
      setEditingUser({
        ...editingUser,
        [name]: value,
      });
    } else {
      setNewUser({
        ...newUser,
        [name]: value,
      });
    }
  };

  const addUser = async () => {
    if (!selectedTenantId) return;
    
    try {
      await apiFetch(`/api/tenants/${selectedTenantId}/users`, {
        method: 'POST',
        body: JSON.stringify(newUser),
      });
      
      toast({
        title: 'Success',
        description: 'User added successfully',
      });
      
      fetchUsers();
      setNewUser({
        email: '',
        role: 'member',
        first_name: '',
        last_name: '',
      });
    } catch (err) {
      console.error('Failed to add user', err);
      toast({
        title: 'Error',
        description: 'Failed to add user',
        variant: 'destructive',
      });
    }
  };

  const updateUser = async () => {
    if (!editingUser || !selectedTenantId) return;
    
    try {
      await apiFetch(`/api/tenants/${selectedTenantId}/users/${editingUser.user_id}`, {
        method: 'PUT',
        body: JSON.stringify({
          role: editingUser.role,
          first_name: editingUser.first_name,
          last_name: editingUser.last_name,
        }),
      });
      
      toast({
        title: 'Success',
        description: 'User updated successfully',
      });
      
      fetchUsers();
      setEditingUser(null);
    } catch (err) {
      console.error('Failed to update user', err);
      toast({
        title: 'Error',
        description: 'Failed to update user',
        variant: 'destructive',
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!selectedTenantId) return;
    
    if (!confirm('Are you sure you want to remove this user from the tenant?')) {
      return;
    }
    
    try {
      await apiFetch(`/api/tenants/${selectedTenantId}/users/${userId}`, {
        method: 'DELETE',
      });
      
      toast({
        title: 'Success',
        description: 'User removed successfully',
      });
      
      fetchUsers();
    } catch (err) {
      console.error('Failed to remove user', err);
      toast({
        title: 'Error',
        description: 'Failed to remove user',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
          <p className="text-blue-200">Manage users for your tenant</p>
        </div>

        {/* Add/Edit User Form */}
        <Card className="p-6 mb-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <h2 className="text-xl font-bold text-white mb-4">
            {editingUser ? 'Edit User' : 'Add New User'}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={editingUser?.email || newUser.email}
                onChange={handleInputChange}
                disabled={!!editingUser}
                placeholder="user@example.com"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="role" className="text-white">Role</Label>
              <Select
                value={editingUser?.role || newUser.role}
                onValueChange={(value) => handleSelectChange('role', value)}
              >
                <SelectTrigger id="role" className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700 text-white">
                  <SelectItem value="owner">Owner</SelectItem>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="first_name" className="text-white">First Name</Label>
              <Input
                id="first_name"
                name="first_name"
                value={editingUser?.first_name || newUser.first_name}
                onChange={handleInputChange}
                placeholder="John"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div>
              <Label htmlFor="last_name" className="text-white">Last Name</Label>
              <Input
                id="last_name"
                name="last_name"
                value={editingUser?.last_name || newUser.last_name}
                onChange={handleInputChange}
                placeholder="Doe"
                className="bg-white/10 border-white/20 text-white"
              />
            </div>
            <div className="flex items-end">
              {editingUser ? (
                <div className="flex gap-2 w-full">
                  <Button 
                    onClick={updateUser} 
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Save Changes
                  </Button>
                  <Button 
                    onClick={() => setEditingUser(null)} 
                    variant="outline" 
                    className="flex-1 bg-transparent border-white/20 hover:bg-white/10"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={addUser} 
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={!selectedTenantId}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add User
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* User List */}
        <Card className="p-6 bg-white/5 border-white/10 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-white">Users</h2>
            <Button 
              onClick={fetchUsers} 
              variant="outline" 
              size="sm" 
              className="border-white/20 hover:bg-white/10"
              disabled={loading || !selectedTenantId}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>

          {!selectedTenantId ? (
            <p className="text-white/70 text-center py-8">
              Please select a tenant to manage users
            </p>
          ) : users.length === 0 ? (
            <p className="text-white/70 text-center py-8">
              {loading ? 'Loading users...' : 'No users found. Add your first user above.'}
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-white">
                <thead className="border-b border-white/20">
                  <tr>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Name</th>
                    <th className="text-left py-3 px-4">Role</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.user_id} className="border-b border-white/10 hover:bg-white/5">
                      <td className="py-3 px-4">{user.email}</td>
                      <td className="py-3 px-4">
                        {user.first_name} {user.last_name}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={
                          user.role === 'owner' ? 'bg-purple-500/20 text-purple-300' :
                          user.role === 'member' ? 'bg-blue-500/20 text-blue-300' :
                          'bg-gray-500/20 text-gray-300'
                        }>
                          {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUser(user)}
                            className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/30"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteUser(user.user_id)}
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

export default UserManager;
