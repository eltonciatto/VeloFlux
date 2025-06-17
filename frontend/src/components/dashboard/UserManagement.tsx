import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { safeApiFetch } from '@/lib/csrfToken';
import { Trash2, Edit, Plus, Shield, User, Crown } from 'lucide-react';

interface TenantUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  status: 'active' | 'inactive' | 'pending';
  created_at: string;
  last_login?: string;
  permissions: string[];
}

interface NewUser {
  email: string;
  name: string;
  role: 'admin' | 'user' | 'viewer';
  send_invite?: boolean;
}

const UserManagement = () => {
  const { tenantId } = useParams();
  const { token } = useAuth();
  const { toast } = useToast();
  
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [newUser, setNewUser] = useState<NewUser>({
    email: '',
    name: '',
    role: 'user',
    send_invite: true
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await safeApiFetch(`/api/tenants/${tenantId}/users`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setUsers(response || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao carregar usuários do tenant',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, token, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const addUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast({
        title: 'Erro',
        description: 'Email e nome são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    try {
      await safeApiFetch(`/api/tenants/${tenantId}/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário adicionado com sucesso',
        variant: 'default'
      });

      setIsAddUserOpen(false);
      setNewUser({ email: '', name: '', role: 'user', send_invite: true });
      fetchUsers();
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao adicionar usuário',
        variant: 'destructive'
      });
    }
  };

  const updateUser = async () => {
    if (!selectedUser) return;

    try {
      await safeApiFetch(`/api/tenants/${tenantId}/users/${selectedUser.id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: selectedUser.name,
          role: selectedUser.role,
          status: selectedUser.status
        })
      });

      toast({
        title: 'Sucesso',
        description: 'Usuário atualizado com sucesso',
        variant: 'default'
      });

      setIsEditUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao atualizar usuário',
        variant: 'destructive'
      });
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja remover este usuário?')) return;

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

      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao remover usuário',
        variant: 'destructive'
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin':
        return <Crown className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'viewer':
        return <Shield className="h-4 w-4" />;
      default:
        return <User className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gerenciamento de Usuários</CardTitle>
          <CardDescription>Carregando usuários...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Gerenciamento de Usuários
              </CardTitle>
              <CardDescription>
                Gerencie usuários, permissões e acessos do tenant
              </CardDescription>
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Usuário
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Adicione um novo usuário ao tenant
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUser.email}
                      onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                      placeholder="usuario@exemplo.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newUser.name}
                      onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Função</Label>
                    <Select value={newUser.role} onValueChange={(value) => setNewUser({...newUser, role: value as 'admin' | 'user' | 'viewer'})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="viewer">Viewer - Apenas visualização</SelectItem>
                        <SelectItem value="user">User - Acesso completo</SelectItem>
                        <SelectItem value="admin">Admin - Acesso administrativo</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={addUser}>Adicionar</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {users.length === 0 ? (
            <Alert>
              <AlertDescription>
                Nenhum usuário encontrado para este tenant.
              </AlertDescription>
            </Alert>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Função</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.role === 'admin' ? 'bg-red-100 text-red-800 border border-red-200' :
                        user.role === 'user' ? 'bg-blue-100 text-blue-800 border border-blue-200' :
                        'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {getRoleIcon(user.role)}
                        {user.role}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        user.status === 'active' ? 'bg-green-100 text-green-800 border border-green-200' :
                        user.status === 'inactive' ? 'bg-gray-100 text-gray-800 border border-gray-200' :
                        'bg-yellow-100 text-yellow-800 border border-yellow-200'
                      }`}>
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.last_login 
                        ? new Date(user.last_login).toLocaleDateString('pt-BR')
                        : 'Nunca'
                      }
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditUserOpen(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit User Dialog */}
      <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
            <DialogDescription>
              Atualize as informações do usuário
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div>
                <Label htmlFor="edit-name">Nome</Label>
                <Input
                  id="edit-name"
                  value={selectedUser.name}
                  onChange={(e) => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="edit-role">Função</Label>
                <Select 
                  value={selectedUser.role} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, role: value as 'admin' | 'user' | 'viewer'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="viewer">Viewer - Apenas visualização</SelectItem>
                    <SelectItem value="user">User - Acesso completo</SelectItem>
                    <SelectItem value="admin">Admin - Acesso administrativo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-status">Status</Label>
                <Select 
                  value={selectedUser.status} 
                  onValueChange={(value) => setSelectedUser({...selectedUser, status: value as 'active' | 'inactive' | 'pending'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Ativo</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={updateUser}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;
