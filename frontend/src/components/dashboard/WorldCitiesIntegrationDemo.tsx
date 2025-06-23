import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Globe, 
  Server, 
  MapPin, 
  TrendingUp, 
  Activity, 
  Shield,
  Zap,
  Target,
  Database,
  Network,
  Users,
  Clock,
  Flag,
  BarChart3,
  PieChart,
  Download
} from 'lucide-react';
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

const WorldCitiesIntegrationDemo: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'security' | 'performance'>('overview');

  // Processar dados das cidades mundiais
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

  // Estatísticas gerais
  const stats = useMemo(() => {
    const continents = new Set(worldCities.map(city => city.continent));
    const countries = new Set(worldCities.map(city => city.country));
    const capitals = worldCities.filter(city => city.type === 'capital');
    const majorCities = worldCities.filter(city => city.population && city.population > 5000000);

    return {
      totalCities: worldCities.length,
      totalContinents: continents.size,
      totalCountries: countries.size,
      totalCapitals: capitals.length,
      totalMajorCities: majorCities.length
    };
  }, [worldCities]);

  // Análise por continente
  const continentAnalysis = useMemo(() => {
    const continents = ['Americas', 'Europe', 'Asia Pacific', 'Africa', 'Other'];
    return continents.map(continent => {
      const continentCities = worldCities.filter(city => city.continent === continent);
      const countries = new Set(continentCities.map(city => city.country));
      const capitals = continentCities.filter(city => city.type === 'capital');
      const totalPopulation = continentCities
        .filter(city => city.population)
        .reduce((sum, city) => sum + (city.population || 0), 0);

      return {
        name: continent,
        cities: continentCities.length,
        countries: countries.size,
        capitals: capitals.length,
        population: totalPopulation,
        // Métricas simuladas para demonstração
        traffic: Math.floor(Math.random() * 100000) + 50000,
        latency: Math.floor(Math.random() * 100) + 50,
        threats: Math.floor(Math.random() * 500) + 100
      };
    });
  }, [worldCities]);

  // Top cidades por população
  const topCitiesByPopulation = useMemo(() => {
    return worldCities
      .filter(city => city.population)
      .sort((a, b) => (b.population || 0) - (a.population || 0))
      .slice(0, 15)
      .map(city => ({
        ...city,
        // Métricas simuladas baseadas na população
        traffic: Math.floor((city.population || 0) / 10000) + Math.floor(Math.random() * 5000),
        latency: Math.floor(Math.random() * 150) + 20,
        uptime: 95 + Math.random() * 5
      }));
  }, [worldCities]);

  // Análise de distribuição geográfica
  const geographicDistribution = useMemo(() => {
    const zones = {
      'Northern Hemisphere': worldCities.filter(city => city.lat > 0).length,
      'Southern Hemisphere': worldCities.filter(city => city.lat <= 0).length,
      'Eastern Hemisphere': worldCities.filter(city => city.lng > 0).length,
      'Western Hemisphere': worldCities.filter(city => city.lng <= 0).length
    };

    return Object.entries(zones).map(([name, count]) => ({
      name,
      value: count,
      percentage: ((count / worldCities.length) * 100).toFixed(1)
    }));
  }, [worldCities]);

  // Análise de timezone
  const timezoneAnalysis = useMemo(() => {
    const timezones = worldCities.reduce((acc, city) => {
      const tz = city.timezone || 'UTC';
      acc[tz] = (acc[tz] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(timezones)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([timezone, count]) => ({
        timezone,
        count,
        percentage: ((count / worldCities.length) * 100).toFixed(1)
      }));
  }, [worldCities]);

  const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🌍 World Cities Integration Demo</h2>
          <p className="text-slate-400">
            Demonstração completa das funcionalidades baseadas em {stats.totalCities} cidades globais
          </p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" size="sm" className="border-slate-700 text-white">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
            <Globe className="h-4 w-4 mr-2" />
            Ver Mapa Global
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total de Cidades</p>
                <p className="text-2xl font-bold text-white">{stats.totalCities}</p>
              </div>
              <MapPin className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Países</p>
                <p className="text-2xl font-bold text-white">{stats.totalCountries}</p>
              </div>
              <Flag className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Continentes</p>
                <p className="text-2xl font-bold text-white">{stats.totalContinents}</p>
              </div>
              <Globe className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Capitais</p>
                <p className="text-2xl font-bold text-white">{stats.totalCapitals}</p>
              </div>
              <Target className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Mega Cidades</p>
                <p className="text-2xl font-bold text-white">{stats.totalMajorCities}</p>
              </div>
              <Users className="h-8 w-8 text-cyan-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)}>
        <TabsList className="grid w-full grid-cols-4 bg-slate-800 border-slate-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-slate-700">
            <TrendingUp className="h-4 w-4 mr-2" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-slate-700">
            <Shield className="h-4 w-4 mr-2" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="performance" className="data-[state=active]:bg-slate-700">
            <Zap className="h-4 w-4 mr-2" />
            Performance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Continent Analysis */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Análise por Continente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={continentAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="cities" fill="#3b82f6" name="Cidades" />
                    <Bar dataKey="countries" fill="#10b981" name="Países" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Geographic Distribution */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Distribuição Geográfica</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <RechartsPieChart
                      data={geographicDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                    >
                      {geographicDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
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
          </div>

          {/* Top Cities by Population */}
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Top Cidades por População</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topCitiesByPopulation.slice(0, 9).map((city, index) => (
                  <motion.div
                    key={city.slug}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{city.flag}</span>
                        <div>
                          <h4 className="font-medium text-white">{city.label}</h4>
                          <p className="text-xs text-slate-400">{city.country}</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="border-blue-400 text-blue-400">
                        #{index + 1}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">População:</span>
                        <span className="text-white">{city.population?.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Coordenadas:</span>
                        <span className="text-white">{city.lat.toFixed(2)}, {city.lng.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Timezone:</span>
                        <span className="text-white">{city.timezone}</span>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traffic by Continent */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Tráfego Simulado por Continente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={continentAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Line type="monotone" dataKey="traffic" stroke="#3b82f6" strokeWidth={2} name="Tráfego" />
                    <Line type="monotone" dataKey="latency" stroke="#f59e0b" strokeWidth={2} name="Latência" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Timezone Distribution */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Top Timezones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-80 overflow-y-auto">
                  {timezoneAnalysis.map((tz, index) => (
                    <div key={tz.timezone} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline" className="border-purple-400 text-purple-400">
                          #{index + 1}
                        </Badge>
                        <div>
                          <span className="text-white font-medium">{tz.timezone}</span>
                          <div className="text-xs text-slate-400">{tz.percentage}% das cidades</div>
                        </div>
                      </div>
                      <span className="text-white font-medium">{tz.count} cidades</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Security Threats by Continent */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Ameaças Simuladas por Continente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={continentAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="threats" fill="#ef4444" name="Ameaças" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Security Coverage */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Cobertura de Segurança</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center py-8">
                    <Shield className="h-16 w-16 text-green-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-white mb-2">Cobertura Global Ativa</h3>
                    <p className="text-slate-400">
                      Sistema de segurança integrado com {stats.totalCities} pontos de monitoramento
                    </p>
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-xl font-bold text-green-400">{stats.totalCountries}</div>
                        <div className="text-sm text-slate-400">Países Monitorados</div>
                      </div>
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-xl font-bold text-blue-400">{stats.totalCapitals}</div>
                        <div className="text-sm text-slate-400">Capitais Protegidas</div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance by Continent */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Performance por Continente</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={continentAnalysis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1e293b', 
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#ffffff'
                      }}
                    />
                    <Bar dataKey="latency" fill="#f59e0b" name="Latência (ms)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Global Coverage */}
            <Card className="bg-slate-900/50 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Cobertura Global</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Network className="h-16 w-16 text-cyan-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">Rede Global Otimizada</h3>
                  <p className="text-slate-400 mb-6">
                    Balanceamento inteligente baseado em proximidade geográfica
                  </p>
                  <div className="grid grid-cols-1 gap-3">
                    {continentAnalysis.map((continent) => (
                      <div key={continent.name} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                        <span className="text-white">{continent.name}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-slate-400">{continent.cities} nodes</span>
                          <Badge variant="outline" className="border-cyan-400 text-cyan-400">
                            {continent.latency}ms
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WorldCitiesIntegrationDemo;
