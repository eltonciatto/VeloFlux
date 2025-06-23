import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  ChevronDownIcon, 
  ChevronRightIcon, 
  BuildingIcon, 
  UsersIcon, 
  SettingsIcon,
  PlusIcon,
  SearchIcon,
  TreePineIcon,
  NetworkIcon
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TenantNode {
  id: string;
  name: string;
  type: 'organization' | 'division' | 'team' | 'project';
  plan: string;
  users: number;
  children?: TenantNode[];
  parent?: string;
  metadata: {
    created: string;
    lastActivity: string;
    status: 'active' | 'suspended' | 'trial';
    resources: {
      storage: number;
      bandwidth: number;
      apis: number;
    };
  };
}

const mockHierarchy: TenantNode = {
  id: 'org-1',
  name: 'Enterprise Corporation',
  type: 'organization',
  plan: 'Enterprise',
  users: 2500,
  metadata: {
    created: '2023-01-15',
    lastActivity: '2024-06-19',
    status: 'active',
    resources: { storage: 1000, bandwidth: 5000, apis: 10000 }
  },
  children: [
    {
      id: 'div-1',
      name: 'Engineering Division',
      type: 'division',
      plan: 'Premium',
      users: 850,
      parent: 'org-1',
      metadata: {
        created: '2023-02-01',
        lastActivity: '2024-06-19',
        status: 'active',
        resources: { storage: 400, bandwidth: 2000, apis: 4000 }
      },
      children: [
        {
          id: 'team-1',
          name: 'Backend Team',
          type: 'team',
          plan: 'Standard',
          users: 25,
          parent: 'div-1',
          metadata: {
            created: '2023-03-10',
            lastActivity: '2024-06-19',
            status: 'active',
            resources: { storage: 100, bandwidth: 500, apis: 1200 }
          }
        },
        {
          id: 'team-2',
          name: 'Frontend Team',
          type: 'team',
          plan: 'Standard',
          users: 18,
          parent: 'div-1',
          metadata: {
            created: '2023-03-10',
            lastActivity: '2024-06-18',
            status: 'active',
            resources: { storage: 80, bandwidth: 400, apis: 800 }
          }
        }
      ]
    },
    {
      id: 'div-2',
      name: 'Sales Division',
      type: 'division',
      plan: 'Standard',
      users: 320,
      parent: 'org-1',
      metadata: {
        created: '2023-02-15',
        lastActivity: '2024-06-19',
        status: 'active',
        resources: { storage: 150, bandwidth: 800, apis: 1500 }
      },
      children: [
        {
          id: 'team-3',
          name: 'Enterprise Sales',
          type: 'team',
          plan: 'Standard',
          users: 12,
          parent: 'div-2',
          metadata: {
            created: '2023-04-01',
            lastActivity: '2024-06-19',
            status: 'active',
            resources: { storage: 50, bandwidth: 300, apis: 600 }
          }
        }
      ]
    },
    {
      id: 'div-3',
      name: 'Marketing Division',
      type: 'division',
      plan: 'Trial',
      users: 45,
      parent: 'org-1',
      metadata: {
        created: '2024-05-01',
        lastActivity: '2024-06-18',
        status: 'trial',
        resources: { storage: 25, bandwidth: 200, apis: 300 }
      }
    }
  ]
};

export const TenantHierarchy: React.FC = () => {
  const { t } = useTranslation();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['org-1', 'div-1']));
  const [selectedNode, setSelectedNode] = useState<TenantNode | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');

  const toggleNode = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(nodeId)) {
        next.delete(nodeId);
      } else {
        next.add(nodeId);
      }
      return next;
    });
  }, []);

  const getTypeIcon = (type: TenantNode['type']) => {
    switch (type) {
      case 'organization': return <BuildingIcon className="w-4 h-4" />;
      case 'division': return <NetworkIcon className="w-4 h-4" />;
      case 'team': return <UsersIcon className="w-4 h-4" />;
      case 'project': return <TreePineIcon className="w-4 h-4" />;
      default: return <BuildingIcon className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-red-100 text-red-800';
      case 'trial': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderTreeNode = (node: TenantNode, level: number = 0) => {
    const isExpanded = expandedNodes.has(node.id);
    const hasChildren = node.children && node.children.length > 0;
    const matchesSearch = searchQuery === '' || 
      node.name.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return null;

    return (
      <div key={node.id} className="select-none">
        <div 
          className={`flex items-center gap-2 p-2 hover:bg-gray-50 cursor-pointer rounded ${
            selectedNode?.id === node.id ? 'bg-blue-50 border border-blue-200' : ''
          }`}
          style={{ paddingLeft: `${level * 24 + 8}px` }}
          onClick={() => setSelectedNode(node)}
        >
          {hasChildren ? (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleNode(node.id);
              }}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-6" />
          )}
          
          <div className="flex items-center gap-2 flex-1">
            {getTypeIcon(node.type)}
            <span className="font-medium">{node.name}</span>
            <Badge variant="outline" className="text-xs">
              {node.plan}
            </Badge>
            <Badge className={`text-xs ${getStatusColor(node.metadata.status)}`}>
              {node.metadata.status}
            </Badge>
            <span className="text-sm text-gray-500 ml-auto">
              {node.users} usuários
            </span>
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {node.children!.map(child => renderTreeNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const getAllNodes = (node: TenantNode): TenantNode[] => {
    const nodes = [node];
    if (node.children) {
      node.children.forEach(child => {
        nodes.push(...getAllNodes(child));
      });
    }
    return nodes;
  };

  const allNodes = getAllNodes(mockHierarchy);
  const filteredNodes = allNodes.filter(node => 
    node.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hierarquia de Tenants</h2>
          <p className="text-gray-600 mt-1">Visualize e gerencie a estrutura organizacional</p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <PlusIcon className="w-4 h-4 mr-2" />
            Adicionar Tenant
          </Button>
          <Select value={viewMode} onValueChange={(value: string) => setViewMode(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tree">Árvore</SelectItem>
              <SelectItem value="list">Lista</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tree/List View */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Estrutura Organizacional</CardTitle>
                <div className="relative">
                  <SearchIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Buscar tenants..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {viewMode === 'tree' ? (
                <div className="space-y-1">
                  {renderTreeNode(mockHierarchy)}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredNodes.map(node => (
                    <div 
                      key={node.id}
                      className={`flex items-center justify-between p-3 border rounded cursor-pointer hover:bg-gray-50 ${
                        selectedNode?.id === node.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => setSelectedNode(node)}
                    >
                      <div className="flex items-center gap-3">
                        {getTypeIcon(node.type)}
                        <div>
                          <div className="font-medium">{node.name}</div>
                          <div className="text-sm text-gray-500">
                            {node.type} • {node.users} usuários
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{node.plan}</Badge>
                        <Badge className={getStatusColor(node.metadata.status)}>
                          {node.metadata.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Details Panel */}
        <div className="space-y-4">
          {selectedNode ? (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    {getTypeIcon(selectedNode.type)}
                    {selectedNode.name}
                  </CardTitle>
                  <CardDescription>
                    {selectedNode.type} • Plano {selectedNode.plan}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Informações Gerais</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Status:</span>
                        <Badge className={getStatusColor(selectedNode.metadata.status)}>
                          {selectedNode.metadata.status}
                        </Badge>
                      </div>
                      <div className="flex justify-between">
                        <span>Usuários:</span>
                        <span>{selectedNode.users}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Criado:</span>
                        <span>{new Date(selectedNode.metadata.created).toLocaleDateString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Última atividade:</span>
                        <span>{new Date(selectedNode.metadata.lastActivity).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="font-semibold mb-2">Recursos Utilizados</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Armazenamento</span>
                          <span>{selectedNode.metadata.resources.storage} GB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ width: `${(selectedNode.metadata.resources.storage / 1000) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Largura de Banda</span>
                          <span>{selectedNode.metadata.resources.bandwidth} MB</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ width: `${(selectedNode.metadata.resources.bandwidth / 5000) * 100}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Chamadas de API</span>
                          <span>{selectedNode.metadata.resources.apis.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-purple-600 h-2 rounded-full" 
                            style={{ width: `${(selectedNode.metadata.resources.apis / 10000) * 100}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1">
                      <SettingsIcon className="w-4 h-4 mr-2" />
                      Configurar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Child Tenants */}
              {selectedNode.children && selectedNode.children.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Sub-tenants</CardTitle>
                    <CardDescription>
                      {selectedNode.children.length} itens filhos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {selectedNode.children.map(child => (
                        <div 
                          key={child.id}
                          className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                          onClick={() => setSelectedNode(child)}
                        >
                          <div className="flex items-center gap-2">
                            {getTypeIcon(child.type)}
                            <span className="text-sm font-medium">{child.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {child.users}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center text-gray-500">
                  <TreePineIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um tenant para ver os detalhes</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default TenantHierarchy;
