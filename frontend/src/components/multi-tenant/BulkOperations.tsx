import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  PlayIcon, 
  PauseIcon, 
  Square as StopIcon, 
  TrashIcon, 
  SettingsIcon, 
  DownloadIcon,
  UploadIcon,
  CheckIcon,
  XIcon,
  AlertTriangleIcon,
  InfoIcon,
  RefreshCwIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface BulkTenant {
  id: string;
  name: string;
  status: 'active' | 'suspended' | 'trial';
  plan: string;
  users: number;
  revenue: number;
  lastActivity: string;
}

interface BulkOperation {
  id: string;
  type: 'suspend' | 'activate' | 'delete' | 'plan_change' | 'config_update' | 'export';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  tenantCount: number;
  createdAt: string;
  completedAt?: string;
  errors?: string[];
}

const mockTenants: BulkTenant[] = [
  {
    id: '1',
    name: 'Enterprise Corp',
    status: 'active',
    plan: 'Enterprise',
    users: 1250,
    revenue: 15000,
    lastActivity: '2024-06-19'
  },
  {
    id: '2',
    name: 'StartupXYZ',
    status: 'active',
    plan: 'Premium',
    users: 85,
    revenue: 850,
    lastActivity: '2024-06-18'
  },
  {
    id: '3',
    name: 'TechFlow Inc',
    status: 'trial',
    plan: 'Trial',
    users: 320,
    revenue: 0,
    lastActivity: '2024-06-17'
  },
  {
    id: '4',
    name: 'DevCorp Ltd',
    status: 'suspended',
    plan: 'Standard',
    users: 45,
    revenue: 450,
    lastActivity: '2024-06-10'
  },
  {
    id: '5',
    name: 'InnovateTech',
    status: 'active',
    plan: 'Premium',
    users: 180,
    revenue: 1800,
    lastActivity: '2024-06-19'
  }
];

const mockOperations: BulkOperation[] = [
  {
    id: 'op-1',
    type: 'suspend',
    status: 'completed',
    progress: 100,
    tenantCount: 3,
    createdAt: '2024-06-19T10:30:00Z',
    completedAt: '2024-06-19T10:32:00Z'
  },
  {
    id: 'op-2',
    type: 'export',
    status: 'running',
    progress: 75,
    tenantCount: 5,
    createdAt: '2024-06-19T11:00:00Z'
  },
  {
    id: 'op-3',
    type: 'plan_change',
    status: 'failed',
    progress: 60,
    tenantCount: 2,
    createdAt: '2024-06-19T09:15:00Z',
    errors: ['Falha na validação do plano Premium', 'Limite de usuários excedido']
  }
];

interface OperationParams {
  [key: string]: unknown;
}

export const BulkOperations: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenants, setSelectedTenants] = useState<Set<string>>(new Set());
  const [operationType, setOperationType] = useState<string>('');
  const [operationParams, setOperationParams] = useState<OperationParams>({});
  const [isExecuting, setIsExecuting] = useState(false);
  const [operations, setOperations] = useState<BulkOperation[]>(mockOperations);

  const handleTenantSelection = (tenantId: string, checked: boolean) => {
    const newSelected = new Set(selectedTenants);
    if (checked) {
      newSelected.add(tenantId);
    } else {
      newSelected.delete(tenantId);
    }
    setSelectedTenants(newSelected);
  };

  const selectAll = () => {
    setSelectedTenants(new Set(mockTenants.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedTenants(new Set());
  };

  const getOperationIcon = (type: string) => {
    switch (type) {
      case 'suspend': return <PauseIcon className="w-4 h-4" />;
      case 'activate': return <PlayIcon className="w-4 h-4" />;
      case 'delete': return <TrashIcon className="w-4 h-4" />;
      case 'plan_change': return <SettingsIcon className="w-4 h-4" />;
      case 'config_update': return <SettingsIcon className="w-4 h-4" />;
      case 'export': return <DownloadIcon className="w-4 h-4" />;
      default: return <InfoIcon className="w-4 h-4" />;
    }
  };

  const getOperationLabel = (type: string) => {
    switch (type) {
      case 'suspend': return 'Suspender';
      case 'activate': return 'Ativar';
      case 'delete': return 'Excluir';
      case 'plan_change': return 'Alterar Plano';
      case 'config_update': return 'Atualizar Configuração';
      case 'export': return 'Exportar Dados';
      default: return type;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'running': return 'bg-blue-100 text-blue-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const executeOperation = async () => {
    if (!operationType || selectedTenants.size === 0) return;

    setIsExecuting(true);
    
    const newOperation: BulkOperation = {
      id: `op-${Date.now()}`,
      type: operationType as 'update' | 'delete' | 'create' | 'migrate',
      status: 'running',
      progress: 0,
      tenantCount: selectedTenants.size,
      createdAt: new Date().toISOString()
    };

    setOperations(prev => [newOperation, ...prev]);

    // Simular progresso da operação
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 300));
      setOperations(prev => prev.map(op => 
        op.id === newOperation.id ? { ...op, progress: i } : op
      ));
    }

    // Finalizar operação
    setOperations(prev => prev.map(op => 
      op.id === newOperation.id 
        ? { ...op, status: 'completed', completedAt: new Date().toISOString() }
        : op
    ));

    setIsExecuting(false);
    setSelectedTenants(new Set());
    setOperationType('');
    setOperationParams({});
  };

  const renderOperationForm = () => {
    switch (operationType) {
      case 'plan_change':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-plan">Novo Plano</Label>
              <Select 
                value={operationParams.newPlan || ''} 
                onValueChange={(value) => setOperationParams(prev => ({ ...prev, newPlan: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o novo plano" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trial">Trial</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="effective-date">Data de Vigência</Label>
              <Input 
                type="date" 
                value={operationParams.effectiveDate || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, effectiveDate: e.target.value }))}
              />
            </div>
          </div>
        );
      
      case 'config_update':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="config-key">Chave de Configuração</Label>
              <Input 
                placeholder="Ex: max_users, api_rate_limit"
                value={operationParams.configKey || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, configKey: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="config-value">Novo Valor</Label>
              <Input 
                placeholder="Novo valor da configuração"
                value={operationParams.configValue || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, configValue: e.target.value }))}
              />
            </div>
          </div>
        );
      
      case 'suspend':
      case 'delete':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="reason">Motivo</Label>
              <Textarea 
                placeholder="Descreva o motivo para esta operação..."
                value={operationParams.reason || ''}
                onChange={(e) => setOperationParams(prev => ({ ...prev, reason: e.target.value }))}
              />
            </div>
            {operationType === 'delete' && (
              <div className="p-4 bg-red-50 border border-red-200 rounded">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangleIcon className="w-5 h-5" />
                  <span className="font-semibold">Atenção</span>
                </div>
                <p className="text-red-700 text-sm mt-1">
                  Esta operação é irreversível. Todos os dados dos tenants selecionados serão permanentemente removidos.
                </p>
              </div>
            )}
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Operações em Lote</h2>
        <p className="text-gray-600 mt-1">Execute operações em múltiplos tenants simultaneamente</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Selection */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Selecionar Tenants</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={selectAll}>
                    Selecionar Todos
                  </Button>
                  <Button variant="outline" size="sm" onClick={deselectAll}>
                    Desmarcar Todos
                  </Button>
                </div>
              </div>
              <CardDescription>
                {selectedTenants.size} de {mockTenants.length} tenants selecionados
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {mockTenants.map(tenant => (
                  <div 
                    key={tenant.id}
                    className="flex items-center space-x-3 p-3 border rounded hover:bg-gray-50"
                  >
                    <Checkbox
                      checked={selectedTenants.has(tenant.id)}
                      onCheckedChange={(checked) => handleTenantSelection(tenant.id, checked as boolean)}
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tenant.name}</span>
                        <Badge variant="outline">{tenant.plan}</Badge>
                        <Badge className={
                          tenant.status === 'active' ? 'bg-green-100 text-green-800' :
                          tenant.status === 'suspended' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }>
                          {tenant.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        {tenant.users} usuários • ${tenant.revenue.toLocaleString()} receita
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Operation History */}
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Operações</CardTitle>
              <CardDescription>Operações em lote executadas recentemente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {operations.map(operation => (
                  <div key={operation.id} className="border rounded p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {getOperationIcon(operation.type)}
                        <span className="font-medium">{getOperationLabel(operation.type)}</span>
                        <Badge className={getStatusColor(operation.status)}>
                          {operation.status}
                        </Badge>
                      </div>
                      <span className="text-sm text-gray-500">
                        {operation.tenantCount} tenants
                      </span>
                    </div>
                    
                    {operation.status === 'running' && (
                      <div className="mb-2">
                        <Progress value={operation.progress} className="h-2" />
                        <div className="text-sm text-gray-600 mt-1">
                          {operation.progress}% concluído
                        </div>
                      </div>
                    )}
                    
                    {operation.errors && operation.errors.length > 0 && (
                      <div className="mt-2">
                        <div className="text-sm text-red-600 font-medium mb-1">Erros:</div>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {operation.errors.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    <div className="text-xs text-gray-500 mt-2">
                      Iniciado: {new Date(operation.createdAt).toLocaleString()}
                      {operation.completedAt && (
                        <> • Concluído: {new Date(operation.completedAt).toLocaleString()}</>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Operation Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Nova Operação</CardTitle>
              <CardDescription>Configure e execute operações em lote</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="operation-type">Tipo de Operação</Label>
                <Select value={operationType} onValueChange={setOperationType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma operação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="activate">Ativar Tenants</SelectItem>
                    <SelectItem value="suspend">Suspender Tenants</SelectItem>
                    <SelectItem value="plan_change">Alterar Plano</SelectItem>
                    <SelectItem value="config_update">Atualizar Configuração</SelectItem>
                    <SelectItem value="export">Exportar Dados</SelectItem>
                    <SelectItem value="delete">Excluir Tenants</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {operationType && (
                <>
                  <Separator />
                  {renderOperationForm()}
                  <Separator />
                  
                  <div className="p-3 bg-gray-50 rounded">
                    <div className="text-sm text-gray-600">
                      <strong>Resumo:</strong> {getOperationLabel(operationType)} será executado em{' '}
                      <strong>{selectedTenants.size}</strong> tenant(s) selecionado(s).
                    </div>
                  </div>

                  <Button 
                    onClick={executeOperation}
                    disabled={selectedTenants.size === 0 || isExecuting}
                    className="w-full"
                  >
                    {isExecuting ? (
                      <>
                        <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
                        Executando...
                      </>
                    ) : (
                      <>
                        <PlayIcon className="w-4 h-4 mr-2" />
                        Executar Operação
                      </>
                    )}
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" size="sm">
                <DownloadIcon className="w-4 h-4 mr-2" />
                Exportar Tenants Selecionados
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <UploadIcon className="w-4 h-4 mr-2" />
                Importar Configurações
              </Button>
              <Button variant="outline" className="w-full justify-start" size="sm">
                <RefreshCwIcon className="w-4 h-4 mr-2" />
                Sincronizar Dados
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default BulkOperations;
