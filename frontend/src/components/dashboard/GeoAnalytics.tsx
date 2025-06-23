import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Clock, 
  Zap,
  Users,
  BarChart3,
  PieChart,
  Target,
  Wifi,
  Server,
  AlertTriangle,
  CheckCircle,
  Filter,
  Download
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart as RechartsPieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import worldCitiesData from '@/data/world-cities.json';

interface Region {
  slug: string;
  label: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  timezone: string;
  type: 'aws' | 'city' | 'custom' | 'capital';
  population?: number;
  continent?: string;
}

interface GeoMetric {
  region: string;
  city: string;
  country: string;
  flag: string;
  requests: number;
  users: number;
  latency: number;
  bandwidth: number;
  errorRate: number;
  lastUpdate: string;
  coordinates: { lat: number; lng: number };
  timezone: string;
}

interface EdgeLocation {
  id: string;
  city: string;
  country: string;
  flag: string;
  status: 'active' | 'maintenance' | 'offline';
  capacity: number;
  utilization: number;
  uptime: number;
  coordinates: { lat: number; lng: number };
}

const GeoAnalytics: React.FC = () => {
  const { t } = useTranslation();
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'traffic' | 'performance' | 'edge' | 'threats'>('traffic');

  // Processar dados das cidades mundiais
  const worldCities = useMemo(() => {
    return (worldCitiesData as Region[]).map(city => ({
      ...city,
      continent: city.continent || getContinent(city.country)
    }));
  }, []);

  // Obter continente baseado no país (função helper)
  const getContinent = (country: string): string => {
    const continentMap: Record<string, string> = {
      'US': 'Americas', 'CA': 'Americas', 'BR': 'Americas', 'AR': 'Americas', 'MX': 'Americas',
      'GB': 'Europe', 'DE': 'Europe', 'FR': 'Europe', 'IT': 'Europe', 'ES': 'Europe', 'NL': 'Europe',
      'CN': 'Asia Pacific', 'JP': 'Asia Pacific', 'IN': 'Asia Pacific', 'SG': 'Asia Pacific', 'AU': 'Asia Pacific',
      'ZA': 'Africa', 'NG': 'Africa', 'EG': 'Africa', 'KE': 'Africa'
    };
    return continentMap[country] || 'Other';
  };

  // Mock data - em produção viria da API com base nas cidades reais
  const [geoMetrics, setGeoMetrics] = useState<GeoMetric[]>([]);
  const [edgeLocations, setEdgeLocations] = useState<EdgeLocation[]>([]);

  useEffect(() => {
    // Gerar métricas fake baseadas nas cidades reais
    const mockMetrics: GeoMetric[] = worldCities.slice(0, 50).map(city => ({
      region: city.slug,
      city: city.label,
      country: city.country,
      flag: city.flag,
      requests: Math.floor(Math.random() * 10000) + 1000,
      users: Math.floor(Math.random() * 1000) + 100,
      latency: Math.floor(Math.random() * 200) + 50,
      bandwidth: Math.floor(Math.random() * 1000) + 100,
      errorRate: Math.random() * 5,
      lastUpdate: new Date().toISOString(),
      coordinates: { lat: city.lat, lng: city.lng },
      timezone: city.timezone
    }));

    const mockEdgeLocations: EdgeLocation[] = worldCities
      .filter(city => city.type === 'capital' || city.population && city.population > 5000000)
      .slice(0, 25)
      .map(city => ({
        id: `edge-${city.slug}`,
        city: city.label,
        country: city.country,
        flag: city.flag,
        status: Math.random() > 0.1 ? 'active' : Math.random() > 0.5 ? 'maintenance' : 'offline',
        capacity: Math.floor(Math.random() * 1000) + 100,
        utilization: Math.random() * 90 + 10,
        uptime: Math.random() * 10 + 95,
        coordinates: { lat: city.lat, lng: city.lng }
      }));

    setGeoMetrics(mockMetrics);
    setEdgeLocations(mockEdgeLocations);
  }, [worldCities, timeRange]);

  // Filtrar dados por continente
  const filteredMetrics = useMemo(() => {
    if (selectedContinent === 'all') return geoMetrics;
    return geoMetrics.filter(metric => {
      const city = worldCities.find(c => c.slug === metric.region);
      return city && getContinent(city.country) === selectedContinent;
    });
  }, [geoMetrics, selectedContinent, worldCities]);

  // Estatísticas agregadas
  const stats = useMemo(() => {
    const totalRequests = filteredMetrics.reduce((sum, m) => sum + m.requests, 0);
    const totalUsers = filteredMetrics.reduce((sum, m) => sum + m.users, 0);
    const avgLatency = filteredMetrics.reduce((sum, m) => sum + m.latency, 0) / filteredMetrics.length || 0;
    const avgErrorRate = filteredMetrics.reduce((sum, m) => sum + m.errorRate, 0) / filteredMetrics.length || 0;

    return { totalRequests, totalUsers, avgLatency, avgErrorRate };
  }, [filteredMetrics]);

  // Dados para gráficos
  const continentData = useMemo(() => {
    const continents = ['Americas', 'Europe', 'Asia Pacific', 'Africa', 'Other'];
    return continents.map(continent => {
      const continentMetrics = geoMetrics.filter(metric => {
        const city = worldCities.find(c => c.slug === metric.region);
        return city && getContinent(city.country) === continent;
      });
      const requests = continentMetrics.reduce((sum, m) => sum + m.requests, 0);
      const users = continentMetrics.reduce((sum, m) => sum + m.users, 0);
      return { name: continent, requests, users, locations: continentMetrics.length };
    });
  }, [geoMetrics, worldCities]);

  const topCitiesData = useMemo(() => {
    return filteredMetrics
      .sort((a, b) => b.requests - a.requests)
      .slice(0, 10)
      .map(metric => ({
        name: `${metric.flag} ${metric.city}`,
        requests: metric.requests,
        users: metric.users,
        latency: metric.latency
      }));
  }, [filteredMetrics]);

  const edgeStatusData = useMemo(() => {
    const statusCount = edgeLocations.reduce((acc, edge) => {
      acc[edge.status] = (acc[edge.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(statusCount).map(([status, count]) => ({
      name: status,
      value: count,
      color: status === 'active' ? '#10b981' : status === 'maintenance' ? '#f59e0b' : '#ef4444'
    }));
  }, [edgeLocations]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'maintenance': return 'bg-yellow-500';
      case 'offline': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'maintenance': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'offline': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🌍 Análise Geográfica</h2>
          <p className="text-slate-400">Monitoramento global baseado em {worldCities.length} localizações</p>
        </div>
        
        <div className="flex gap-3">
          <Select value={selectedContinent} onValueChange={setSelectedContinent}>
            <SelectTrigger className="w-40 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="all">Todos os Continentes</SelectItem>
              <SelectItem value="Americas">🌎 Americas</SelectItem>
              <SelectItem value="Europe">🌍 Europa</SelectItem>
              <SelectItem value="Asia Pacific">🌏 Ásia-Pacífico</SelectItem>
              <SelectItem value="Africa">🌍 África</SelectItem>
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as typeof timeRange)}>
            <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-800 border-slate-700">
              <SelectItem value="1h">1h</SelectItem>
              <SelectItem value="24h">24h</SelectItem>
              <SelectItem value="7d">7d</SelectItem>
              <SelectItem value="30d">30d</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="border-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Solicitações Totais</p>
                <p className="text-2xl font-bold text-white">{stats.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Usuários Únicos</p>
                <p className="text-2xl font-bold text-white">{stats.totalUsers.toLocaleString()}</p>
              </div>
              <Users className="h-8 w-8 text-green-400" />
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
                <p className="text-sm text-slate-400">Taxa de Erro</p>
                <p className="text-2xl font-bold text-white">{stats.avgErrorRate.toFixed(2)}%</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as typeof viewMode)}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="traffic" className="data-[state=active]:bg-slate-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Tráfego
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="edge" className="data-[state=active]:bg-slate-700">
            <Server className="h-4 w-4 mr-2" />
            Edge Locations
          </TabsTrigger>
          <TabsTrigger value="threats" className="data-[state=active]:bg-slate-700">
            <Target className="h-4 w-4 mr-2" />
            Ameaças
          </TabsTrigger>
        </TabsList>

        <TabsContent value="traffic" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic by Continent */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Tráfego por Continente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={continentData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="requests" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Cities */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Top Cidades por Tráfego</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {topCitiesData.map((city, index) => (
                    <motion.div
                      key={city.name}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div>
                        <span className="text-white font-medium">{city.name}</span>
                        <div className="text-sm text-slate-400">
                          {city.requests.toLocaleString()} requisições • {city.latency}ms
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-400 text-blue-400">
                        #{index + 1}
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Latency Distribution */}
            <Card className="bg-slate-900/50 border-slate-700 lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-white">Distribuição de Latência por Região</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={topCitiesData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Métricas de Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">Latência Média</span>
                      <span className="text-sm text-white">{Math.round(stats.avgLatency)}ms</span>
                    </div>
                    <Progress value={(200 - stats.avgLatency) / 2} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">Taxa de Sucesso</span>
                      <span className="text-sm text-white">{(100 - stats.avgErrorRate).toFixed(1)}%</span>
                    </div>
                    <Progress value={100 - stats.avgErrorRate} className="h-2" />
                  </div>
                  
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">Cobertura Global</span>
                      <span className="text-sm text-white">{filteredMetrics.length} regiões</span>
                    </div>
                    <Progress value={(filteredMetrics.length / worldCities.length) * 100} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="edge" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Edge Status Overview */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Status dos Edge Locations</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsPieChart>
                    <RechartsPieChart data={edgeStatusData}>
                      {edgeStatusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </RechartsPieChart>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Edge Locations List */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Edge Locations ({edgeLocations.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {edgeLocations.slice(0, 10).map((edge) => (
                    <div key={edge.id} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(edge.status)}`} />
                        <div>
                          <span className="text-white font-medium">
                            {edge.flag} {edge.city}
                          </span>
                          <div className="text-sm text-slate-400">
                            {edge.utilization.toFixed(1)}% utilização • {edge.uptime.toFixed(1)}% uptime
                          </div>
                        </div>
                      </div>
                      {getStatusIcon(edge.status)}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="threats" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Análise de Ameaças Geográficas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Globe className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-400">Análise de ameaças geográficas em desenvolvimento...</p>
                <p className="text-sm text-slate-500 mt-2">
                  Integração com sistema de detecção baseado em {worldCities.length} localizações globais
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GeoAnalytics;
