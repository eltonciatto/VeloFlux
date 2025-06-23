import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Server, 
  MapPin, 
  Wifi, 
  Activity, 
  Clock, 
  Zap,
  Plus,
  Trash2,
  Settings,
  PlayCircle,
  PauseCircle,
  RotateCw,
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  Monitor,
  Database,
  Network,
  Globe,
  Filter,
  Search,
  Download,
  Upload
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import worldCitiesData from '@/data/world-cities.json';
import RegionSelect, { type Region } from './RegionSelect';

interface EdgeNode {
  id: string;
  name: string;
  city: string;
  country: string;
  flag: string;
  region: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  type: 'compute' | 'cache' | 'cdn' | 'database' | 'api-gateway';
  
  // Localização
  coordinates: { lat: number; lng: number };
  timezone: string;
  
  // Recursos
  cpu: { used: number; total: number; cores: number };
  memory: { used: number; total: number };
  storage: { used: number; total: number };
  network: { in: number; out: number; latency: number };
  
  // Métricas
  requests: number;
  users: number;
  uptime: number;
  lastSeen: string;
  version: string;
  
  // Configuração
  autoScale: boolean;
  maxInstances: number;
  minInstances: number;
  currentInstances: number;
}

interface EdgeDeployment {
  id: string;
  name: string;
  type: 'application' | 'service' | 'function' | 'container';
  status: 'running' | 'stopped' | 'deploying' | 'error';
  nodes: string[];
  replicas: number;
  image: string;
  ports: number[];
  environmentVars: Record<string, string>;
  healthCheck: {
    enabled: boolean;
    path: string;
    interval: number;
  };
}

interface ProximityRule {
  id: string;
  name: string;
  source: 'country' | 'continent' | 'city' | 'custom';
  target: string;
  targetNodes: string[];
  priority: number;
  enabled: boolean;
  latencyThreshold: number;
}

const EdgeManager: React.FC = () => {
  const { t } = useTranslation();
  const { toast } = useToast();
  
  const [activeTab, setActiveTab] = useState<'nodes' | 'deployments' | 'routing' | 'monitoring'>('nodes');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedNodes, setSelectedNodes] = useState<string[]>([]);
  
  // Dados das cidades mundiais processados
  const worldCities = useMemo(() => {
    return (worldCitiesData as Region[]).map(city => ({
      ...city,
      continent: getContinent(city.country)
    }));
  }, []);

  const getContinent = (country: string): string => {
    const continentMap: Record<string, string> = {
      'US': 'Americas', 'CA': 'Americas', 'BR': 'Americas', 'AR': 'Americas', 'MX': 'Americas',
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe', 'NL': 'Europe',
      'CN': 'Asia Pacific', 'JP': 'Asia Pacific', 'IN': 'Asia Pacific', 'SG': 'Asia Pacific', 'AU': 'Asia Pacific',
      'ZA': 'Africa', 'NG': 'Africa', 'EG': 'Africa', 'KE': 'Africa'
    };
    return continentMap[country] || 'Other';
  };

  // Estados dos edge nodes
  const [edgeNodes, setEdgeNodes] = useState<EdgeNode[]>([]);
  const [deployments, setDeployments] = useState<EdgeDeployment[]>([]);
  const [proximityRules, setProximityRules] = useState<ProximityRule[]>([]);

  // Novo edge node
  const [newNode, setNewNode] = useState({
    name: '',
    region: null as Region | null,
    type: 'compute' as EdgeNode['type'],
    autoScale: true,
    maxInstances: 10,
    minInstances: 1
  });

  // Gerar dados mock baseados nas cidades reais
  useEffect(() => {
    const majorCities = worldCities.filter(city => 
      city.type === 'capital' || 
      (city.population && city.population > 3000000)
    ).slice(0, 30);

    const mockNodes: EdgeNode[] = majorCities.map((city, index) => ({
      id: `edge-${city.slug}`,
      name: `Edge-${city.label.replace(/\s+/g, '')}`,
      city: city.label,
      country: city.country,
      flag: city.flag,
      region: city.slug,
      status: ['online', 'online', 'online', 'maintenance', 'offline'][Math.floor(Math.random() * 5)] as EdgeNode['status'],
      type: ['compute', 'cache', 'cdn', 'database', 'api-gateway'][Math.floor(Math.random() * 5)] as EdgeNode['type'],
      
      coordinates: { lat: city.lat, lng: city.lng },
      timezone: city.timezone,
      
      cpu: {
        used: Math.floor(Math.random() * 80) + 10,
        total: 100,
        cores: [4, 8, 16, 32][Math.floor(Math.random() * 4)]
      },
      memory: {
        used: Math.floor(Math.random() * 70) + 10,
        total: 100
      },
      storage: {
        used: Math.floor(Math.random() * 60) + 10,
        total: 100
      },
      network: {
        in: Math.floor(Math.random() * 1000) + 100,
        out: Math.floor(Math.random() * 1000) + 100,
        latency: Math.floor(Math.random() * 50) + 10
      },
      
      requests: Math.floor(Math.random() * 10000) + 1000,
      users: Math.floor(Math.random() * 1000) + 100,
      uptime: Math.random() * 10 + 95,
      lastSeen: new Date(Date.now() - Math.random() * 300000).toISOString(),
      version: `v${Math.floor(Math.random() * 3) + 1}.${Math.floor(Math.random() * 10)}.${Math.floor(Math.random() * 10)}`,
      
      autoScale: Math.random() > 0.3,
      maxInstances: Math.floor(Math.random() * 10) + 5,
      minInstances: Math.floor(Math.random() * 3) + 1,
      currentInstances: Math.floor(Math.random() * 5) + 2
    }));

    setEdgeNodes(mockNodes);

    // Mock deployments
    const mockDeployments: EdgeDeployment[] = [
      {
        id: 'deploy-web-app',
        name: 'Web Application',
        type: 'application',
        status: 'running',
        nodes: mockNodes.filter(n => n.type === 'compute').slice(0, 5).map(n => n.id),
        replicas: 3,
        image: 'nginx:latest',
        ports: [80, 443],
        environmentVars: { NODE_ENV: 'production' },
        healthCheck: { enabled: true, path: '/health', interval: 30 }
      },
      {
        id: 'deploy-api-gateway',
        name: 'API Gateway',
        type: 'service',
        status: 'running',
        nodes: mockNodes.filter(n => n.type === 'api-gateway').slice(0, 3).map(n => n.id),
        replicas: 2,
        image: 'traefik:latest',
        ports: [8080],
        environmentVars: { LOG_LEVEL: 'INFO' },
        healthCheck: { enabled: true, path: '/ping', interval: 10 }
      }
    ];

    setDeployments(mockDeployments);

    // Mock proximity rules
    const mockRules: ProximityRule[] = [
      {
        id: 'rule-americas',
        name: 'Americas Traffic',
        source: 'continent',
        target: 'Americas',
        targetNodes: mockNodes.filter(n => getContinent(n.country) === 'Americas').map(n => n.id),
        priority: 1,
        enabled: true,
        latencyThreshold: 100
      },
      {
        id: 'rule-europe',
        name: 'Europe Traffic',
        source: 'continent',
        target: 'Europe',
        targetNodes: mockNodes.filter(n => getContinent(n.country) === 'Europe').map(n => n.id),
        priority: 1,
        enabled: true,
        latencyThreshold: 80
      }
    ];

    setProximityRules(mockRules);
  }, [worldCities]);

  // Filtrar nodes
  const filteredNodes = useMemo(() => {
    return edgeNodes.filter(node => {
      const matchesSearch = node.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           node.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           node.country.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || node.status === statusFilter;
      const matchesType = typeFilter === 'all' || node.type === typeFilter;
      
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [edgeNodes, searchQuery, statusFilter, typeFilter]);

  const getStatusColor = (status: EdgeNode['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'offline': return 'bg-red-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'error': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: EdgeNode['status']) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'offline': return <XCircle className="h-4 w-4 text-red-400" />;
      case 'maintenance': return <Settings className="h-4 w-4 text-yellow-400" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  const getTypeIcon = (type: EdgeNode['type']) => {
    switch (type) {
      case 'compute': return <Server className="h-4 w-4" />;
      case 'cache': return <Database className="h-4 w-4" />;
      case 'cdn': return <Network className="h-4 w-4" />;
      case 'database': return <Database className="h-4 w-4" />;
      case 'api-gateway': return <Globe className="h-4 w-4" />;
      default: return <Server className="h-4 w-4" />;
    }
  };

  const addNewNode = async () => {
    if (!newNode.name || !newNode.region) {
      toast({
        title: 'Erro',
        description: 'Nome e região são obrigatórios',
        variant: 'destructive'
      });
      return;
    }

    const node: EdgeNode = {
      id: `edge-${Date.now()}`,
      name: newNode.name,
      city: newNode.region.label,
      country: newNode.region.country,
      flag: newNode.region.flag,
      region: newNode.region.slug,
      status: 'offline',
      type: newNode.type,
      
      coordinates: { lat: newNode.region.lat, lng: newNode.region.lng },
      timezone: newNode.region.timezone,
      
      cpu: { used: 0, total: 100, cores: 8 },
      memory: { used: 0, total: 100 },
      storage: { used: 0, total: 100 },
      network: { in: 0, out: 0, latency: 0 },
      
      requests: 0,
      users: 0,
      uptime: 0,
      lastSeen: new Date().toISOString(),
      version: 'v1.0.0',
      
      autoScale: newNode.autoScale,
      maxInstances: newNode.maxInstances,
      minInstances: newNode.minInstances,
      currentInstances: newNode.minInstances
    };

    setEdgeNodes(prev => [...prev, node]);
    setNewNode({
      name: '',
      region: null,
      type: 'compute',
      autoScale: true,
      maxInstances: 10,
      minInstances: 1
    });

    toast({
      title: 'Edge Node Criado',
      description: `Node ${node.name} criado em ${node.city}`
    });
  };

  const toggleNodeStatus = (nodeId: string) => {
    setEdgeNodes(prev => prev.map(node => {
      if (node.id === nodeId) {
        const newStatus = node.status === 'online' ? 'offline' : 'online';
        return { ...node, status: newStatus };
      }
      return node;
    }));
  };

  const deleteNode = (nodeId: string) => {
    setEdgeNodes(prev => prev.filter(node => node.id !== nodeId));
    toast({
      title: 'Node Removido',
      description: 'Edge node removido com sucesso'
    });
  };

  // Estatísticas agregadas
  const stats = useMemo(() => {
    const totalNodes = edgeNodes.length;
    const onlineNodes = edgeNodes.filter(n => n.status === 'online').length;
    const totalRequests = edgeNodes.reduce((sum, n) => sum + n.requests, 0);
    const avgLatency = edgeNodes.reduce((sum, n) => sum + n.network.latency, 0) / totalNodes || 0;
    const totalUsers = edgeNodes.reduce((sum, n) => sum + n.users, 0);
    
    return { totalNodes, onlineNodes, totalRequests, avgLatency, totalUsers };
  }, [edgeNodes]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">⚡ Edge Computing Manager</h2>
          <p className="text-slate-400">
            Gerencie {edgeNodes.length} edge nodes em {worldCities.length} localizações globais
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="border-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar Config
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Novo Edge Node
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Nodes</p>
                <p className="text-2xl font-bold text-white">{stats.totalNodes}</p>
              </div>
              <Server className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Online</p>
                <p className="text-2xl font-bold text-green-400">{stats.onlineNodes}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Requisições</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Latência Média</p>
                <p className="text-2xl font-bold text-white">{Math.round(stats.avgLatency)}ms</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Usuários</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Globe className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value)}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="nodes" className="data-[state=active]:bg-slate-700">
            <Server className="h-4 w-4 mr-2" />
            Edge Nodes
          </TabsTrigger>
          <TabsTrigger value="deployments" className="data-[state=active]:bg-slate-700">
            <Upload className="h-4 w-4 mr-2" />
            Deployments
          </TabsTrigger>
          <TabsTrigger value="routing" className="data-[state=active]:bg-slate-700">
            <Network className="h-4 w-4 mr-2" />
            Roteamento
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="data-[state=active]:bg-slate-700">
            <Monitor className="h-4 w-4 mr-2" />
            Monitoramento
          </TabsTrigger>
        </TabsList>

        <TabsContent value="nodes" className="space-y-6">
          {/* Filters and Search */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por nome, cidade ou país..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-800 border-slate-700 text-white"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos Status</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="offline">Offline</SelectItem>
                <SelectItem value="maintenance">Manutenção</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-800 border-slate-700">
                <SelectItem value="all">Todos Tipos</SelectItem>
                <SelectItem value="compute">Compute</SelectItem>
                <SelectItem value="cache">Cache</SelectItem>
                <SelectItem value="cdn">CDN</SelectItem>
                <SelectItem value="database">Database</SelectItem>
                <SelectItem value="api-gateway">API Gateway</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Add New Node */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Adicionar Novo Edge Node</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="node-name" className="text-white">Nome do Node</Label>
                  <Input
                    id="node-name"
                    value={newNode.name}
                    onChange={(e) => setNewNode(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ex: Edge-NYC-01"
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>

                <div>
                  <Label htmlFor="node-region" className="text-white">Região</Label>
                  <RegionSelect
                    value={newNode.region}
                    onChange={(region) => setNewNode(prev => ({ ...prev, region }))}
                    placeholder="Selecione uma região..."
                  />
                </div>

                <div>
                  <Label htmlFor="node-type" className="text-white">Tipo</Label>
                  <Select value={newNode.type} onValueChange={(value: string) => setNewNode(prev => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      <SelectItem value="compute">Compute</SelectItem>
                      <SelectItem value="cache">Cache</SelectItem>
                      <SelectItem value="cdn">CDN</SelectItem>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api-gateway">API Gateway</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button onClick={addNewNode} className="w-full bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Criar Node
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Edge Nodes List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredNodes.map((node) => (
                <motion.div
                  key={node.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-slate-900/50 border border-slate-700 rounded-lg p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(node.status)}`} />
                      <div>
                        <h3 className="font-semibold text-white">{node.name}</h3>
                        <p className="text-sm text-slate-400">
                          {node.flag} {node.city}, {node.country}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(node.type)}
                      {getStatusIcon(node.status)}
                    </div>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">CPU</span>
                        <span className="text-white">{node.cpu.used}%</span>
                      </div>
                      <Progress value={node.cpu.used} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-400">Memória</span>
                        <span className="text-white">{node.memory.used}%</span>
                      </div>
                      <Progress value={node.memory.used} className="h-2" />
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-400">Requisições</span>
                        <p className="text-white font-medium">{node.requests.toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Latência</span>
                        <p className="text-white font-medium">{node.network.latency}ms</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleNodeStatus(node.id)}
                      className="flex-1 border-slate-700 text-white"
                    >
                      {node.status === 'online' ? (
                        <PauseCircle className="h-4 w-4 mr-2" />
                      ) : (
                        <PlayCircle className="h-4 w-4 mr-2" />
                      )}
                      {node.status === 'online' ? 'Parar' : 'Iniciar'}
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-slate-700 text-white"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteNode(node.id)}
                      className="border-red-700 text-red-400 hover:bg-red-900/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </TabsContent>

        <TabsContent value="deployments" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Deployments Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {deployments.map((deployment) => (
                  <div key={deployment.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className={`w-3 h-3 rounded-full ${
                        deployment.status === 'running' ? 'bg-green-500' : 
                        deployment.status === 'deploying' ? 'bg-yellow-500' : 'bg-red-500'
                      }`} />
                      <div>
                        <h4 className="font-medium text-white">{deployment.name}</h4>
                        <p className="text-sm text-slate-400">
                          {deployment.nodes.length} nodes • {deployment.replicas} réplicas
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-blue-400 text-blue-400">
                        {deployment.type}
                      </Badge>
                      <Button size="sm" variant="outline" className="border-slate-700 text-white">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routing" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Regras de Proximidade</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {proximityRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Switch checked={rule.enabled} />
                      <div>
                        <h4 className="font-medium text-white">{rule.name}</h4>
                        <p className="text-sm text-slate-400">
                          {rule.source}: {rule.target} → {rule.targetNodes.length} nodes
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-green-400 text-green-400">
                        &lt; {rule.latencyThreshold}ms
                      </Badge>
                      <Button size="sm" variant="outline" className="border-slate-700 text-white">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Monitoramento Global</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <TrendingUp className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Dashboards de monitoramento em desenvolvimento...</p>
                <p className="text-sm text-slate-500 mt-2">
                  Integrando métricas de {edgeNodes.length} edge nodes globais
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EdgeManager;
