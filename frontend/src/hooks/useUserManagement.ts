import { useState, useCallback } from 'react';
import { safeApiFetch } from '@/lib/csrfToken';
import { useToast } from '@/hooks/use-toast';

export interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  last_login?: string;
  permissions: string[];
}

export interface NewUser {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  send_invite?: boolean;
}

export interface UpdateUser {
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
}

export function useUserManagement(tenantId: string, token: string) {
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response || []);
      return response || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar usuários do tenant',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  const addUser = useCallback(async (userData: NewUser) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário adicionado com sucesso',
        variant: 'default'
      });

      // Refresh users list
      await fetchUsers();
      return response;
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar usuário',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchUsers]);

  const updateUser = useCallback(async (userId: string, userData: UpdateUser) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users/${userId}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(userData)
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
        variant: 'default'
      });

      // Refresh users list
      await fetchUsers();
      return response;
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar usuário',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      await safeApiFetch(`/api/tenants/${tenantId}/users/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário removido com sucesso',
        variant: 'default'
      });

      // Refresh users list
      await fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover usuário',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast, fetchUsers]);

  const inviteUser = useCallback(async (email: string, role: 'admin' | 'user' | 'viewer' = 'user') => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users/invite`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ email, role })
      });

      toast({
        title: 'Sucesso',
        description: 'Convite enviado com sucesso',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error sending invite:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao enviar convite',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  const getUserPermissions = useCallback(async (userId: string) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users/${userId}/permissions`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response;
    } catch (error) {
      console.error('Error fetching user permissions:', error);
      throw error;
    }
  }, [tenantId, token]);

  const updateUserPermissions = useCallback(async (userId: string, permissions: string[]) => {
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users/${userId}/permissions`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ permissions })
      });

      toast({
        title: 'Sucesso',
        description: 'Permissões atualizadas com sucesso',
        variant: 'default'
      });

      return response;
    } catch (error) {
      console.error('Error updating user permissions:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar permissões',
        variant: 'destructive'
      });
      throw error;
    }
  }, [tenantId, token, toast]);

  return {
    users,
    loading,
    fetchUsers,
    addUser,
    updateUser,
    deleteUser,
    inviteUser,
    getUserPermissions,
    updateUserPermissions
  };
}
