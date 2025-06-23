import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Lock,
  Eye,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  MapPin,
  Flag,
  Ban,
  Users,
  Clock
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
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

interface SecurityEvent {
  id: string;
  type: 'attack' | 'blocked' | 'suspicious' | 'allowed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  timestamp: string;
  country: string;
  city?: string;
  flag?: string;
  coordinates?: { lat: number; lng: number };
  blocked: boolean;
  riskScore?: number;
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  topThreats: Array<{ type: string; count: number; severity: string }>;
  geoThreats: Array<{ country: string; city?: string; flag?: string; count: number; riskLevel: number }>;
  attackVectors: Array<{ vector: string; count: number; trend: 'up' | 'down' | 'stable' }>;
  blockedIPs: Array<{ ip: string; country: string; city?: string; flag?: string; attempts: number; lastSeen: string }>;
}

export function SecurityMonitoringPanel() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    blockedRequests: 0,
    suspiciousActivity: 0,
    threatLevel: 'low',
    topThreats: [],
    geoThreats: [],
    attackVectors: [],
    blockedIPs: []
  });
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedContinent, setSelectedContinent] = useState<string>('all');

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
      'ZA': 'Africa', 'NG': 'Africa', 'EG': 'Africa', 'KE': 'Africa',
      'RU': 'Europe', 'IR': 'Asia Pacific', 'KP': 'Asia Pacific', 'VN': 'Asia Pacific'
    };
    return continentMap[country] || 'Other';
  };

  // Função para obter dados de localização baseados no país
  const getLocationData = useCallback((countryCode: string) => {
    const city = worldCities.find(c => c.country === countryCode);
    if (city) {
      return {
        city: city.label,
        flag: city.flag,
        coordinates: { lat: city.lat, lng: city.lng }
      };
    }
    return {
      city: 'Unknown',
      flag: '🏳️',
      coordinates: { lat: 0, lng: 0 }
    };
  }, [worldCities]);

  // Simular dados de segurança em tempo real baseados em localizações reais
  useEffect(() => {
    if (!isLive) return;

    // Países com maior atividade de ameaças (baseado em dados reais)
    const threatCountries = ['CN', 'RU', 'IR', 'KP', 'VN', 'PK', 'IN', 'TH', 'BR', 'RO'];
    
    const generateMockEvents = () => {
      const events: SecurityEvent[] = [];
      
      for (let i = 0; i < 15; i++) {
        const country = i < 8 ? threatCountries[Math.floor(Math.random() * threatCountries.length)] : 'US';
        const locationData = getLocationData(country);
        
        const event: SecurityEvent = {
          id: `${Date.now()}-${i}`,
          type: Math.random() > 0.6 ? 'blocked' : Math.random() > 0.7 ? 'attack' : 'suspicious',
          severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
          source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: ['/api/admin', '/api/users', '/api/billing', '/api/login', '/wp-admin', '/api/auth'][Math.floor(Math.random() * 6)],
          description: [
            'SQL injection attempt',
            'XSS attack blocked', 
            'Brute force login attempt',
            'DDoS attack detected',
            'Malicious bot activity',
            'Credential stuffing attempt',
            'Directory traversal blocked',
            'File upload exploit'
          ][Math.floor(Math.random() * 8)],
          timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString(),
          country,
          city: locationData.city,
          flag: locationData.flag,
          coordinates: locationData.coordinates,
          blocked: Math.random() > 0.25,
          riskScore: Math.floor(Math.random() * 100) + 1
        };
        
        events.push(event);
      }
      
      return events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    };

    const mockEvents = generateMockEvents();

    // Gerar métricas baseadas nas localizações
    const geoThreats = threatCountries.slice(0, 8).map(country => {
      const locationData = getLocationData(country);
      return {
        country,
        city: locationData.city,
        flag: locationData.flag,
        count: Math.floor(Math.random() * 150) + 50,
        riskLevel: Math.floor(Math.random() * 40) + 60
      };
    });

    const blockedIPs = threatCountries.slice(0, 10).map((country, index) => {
      const locationData = getLocationData(country);
      return {
        ip: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        country,
        city: locationData.city,
        flag: locationData.flag,
        attempts: Math.floor(Math.random() * 1000) + 100,
        lastSeen: new Date(Date.now() - Math.random() * 86400000).toISOString()
      };
    });

    const mockMetrics: SecurityMetrics = {
      totalRequests: 25420 + Math.floor(Math.random() * 1000),
      blockedRequests: 156 + Math.floor(Math.random() * 50),
      suspiciousActivity: 89 + Math.floor(Math.random() * 20),
      threatLevel: ['medium', 'high', 'medium', 'high'][Math.floor(Math.random() * 4)] as 'low' | 'medium' | 'high' | 'critical',
      topThreats: [
        { type: 'SQL Injection', count: 67, severity: 'high' },
        { type: 'XSS Attack', count: 54, severity: 'medium' },
        { type: 'Brute Force', count: 43, severity: 'high' },
        { type: 'DDoS Attack', count: 38, severity: 'critical' },
        { type: 'Bot Activity', count: 29, severity: 'medium' }
      ],
      geoThreats,
      attackVectors: [
        { vector: 'Web Application', count: 234, trend: 'up' },
        { vector: 'Network Scan', count: 156, trend: 'down' },
        { vector: 'API Abuse', count: 89, trend: 'stable' },
        { vector: 'SSH Brute Force', count: 67, trend: 'up' }
      ],
      blockedIPs
    };

    setSecurityEvents(mockEvents);
    setMetrics(mockMetrics);

    // Atualização em tempo real
    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        const country = threatCountries[Math.floor(Math.random() * threatCountries.length)];
        const locationData = getLocationData(country);
        
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? 'blocked' : 'suspicious',
          severity: ['medium', 'high', 'critical'][Math.floor(Math.random() * 3)] as 'medium' | 'high' | 'critical',
          source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: ['/api/admin', '/wp-admin', '/api/users', '/login'][Math.floor(Math.random() * 4)],
          description: [
            'SQL injection blocked',
            'Malicious bot detected', 
            'Rate limit exceeded',
            'Suspicious payload detected'
          ][Math.floor(Math.random() * 4)],
          timestamp: new Date().toISOString(),
          country,
          city: locationData.city,
          flag: locationData.flag,
          coordinates: locationData.coordinates,
          blocked: Math.random() > 0.3,
          riskScore: Math.floor(Math.random() * 100) + 1
        };

        setSecurityEvents(prev => [newEvent, ...prev.slice(0, 14)]);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isLive, worldCities, getLocationData]);

  // Filtrar eventos por continente
  const filteredEvents = useMemo(() => {
    if (selectedContinent === 'all') return securityEvents;
    return securityEvents.filter(event => {
      const continent = getContinent(event.country);
      return continent === selectedContinent;
    });
  }, [securityEvents, selectedContinent]);

  // Dados para gráficos
  const continentThreatData = useMemo(() => {
    const continents = ['Americas', 'Europe', 'Asia Pacific', 'Africa', 'Other'];
    return continents.map(continent => {
      const continentEvents = securityEvents.filter(event => getContinent(event.country) === continent);
      const blocked = continentEvents.filter(e => e.blocked).length;
      const suspicious = continentEvents.filter(e => !e.blocked && e.type === 'suspicious').length;
      
      return {
        name: continent,
        blocked,
        suspicious,
        total: continentEvents.length
      };
    });
  }, [securityEvents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      default: return 'text-green-400 border-green-400';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-400" />;
      case 'down': return <TrendingUp className="h-4 w-4 text-green-400 rotate-180" />;
      default: return <TrendingUp className="h-4 w-4 text-gray-400 rotate-90" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">🛡️ Monitoramento de Segurança</h2>
          <p className="text-slate-400">
            Análise global baseada em {worldCities.length} localizações • {filteredEvents.length} eventos recentes
          </p>
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

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLive(!isLive)}
            className={`border-slate-700 ${isLive ? 'text-green-400' : 'text-white'}`}
          >
            {isLive ? 'LIVE' : 'PAUSADO'}
          </Button>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Requisições Totais</p>
                <p className="text-2xl font-bold text-white">{metrics.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Bloqueadas</p>
                <p className="text-2xl font-bold text-red-400">{metrics.blockedRequests}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Atividade Suspeita</p>
                <p className="text-2xl font-bold text-yellow-400">{metrics.suspiciousActivity}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Nível de Ameaça</p>
                <Badge className={`${getThreatLevelColor(metrics.threatLevel)} bg-transparent`}>
                  {metrics.threatLevel.toUpperCase()}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Events */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            Eventos de Segurança em Tempo Real
            <Badge className={`ml-auto ${isLive ? 'bg-green-600' : 'bg-gray-600'}`}>
              {isLive ? 'AO VIVO' : 'PAUSADO'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Monitoramento em tempo real de eventos e ameaças de segurança globais
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredEvents.slice(0, 10).map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{event.description}</span>
                    {event.blocked ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <span>{event.source} → {event.target}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <span>{event.flag}</span>
                      <span>{event.city}, {event.country}</span>
                    </span>
                    <span>•</span>
                    <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                    {event.riskScore && (
                      <>
                        <span>•</span>
                        <span className="text-red-400">Risk: {event.riskScore}/100</span>
                      </>
                    )}
                  </div>
                </div>
                <Badge variant="outline" className={`${getSeverityColor(event.severity)} text-white border-0`}>
                  {event.severity}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Geographic Threats */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Ameaças Geográficas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {metrics.geoThreats.map((geo) => (
                <div key={geo.country} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{geo.flag}</span>
                    <div>
                      <span className="text-sm font-medium text-white">{geo.city}</span>
                      <div className="text-xs text-slate-400">
                        {geo.country} • Risk Level: {geo.riskLevel}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
                        style={{ width: `${(geo.count / Math.max(...metrics.geoThreats.map(g => g.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium">{geo.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Threat Analysis by Continent */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Análise por Continente</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={continentThreatData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                <YAxis stroke="#9ca3af" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #374151',
                    borderRadius: '8px',
                    color: '#ffffff'
                  }}
                />
                <Bar dataKey="blocked" fill="#ef4444" name="Bloqueadas" />
                <Bar dataKey="suspicious" fill="#f59e0b" name="Suspeitas" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Threats */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Principais Ameaças</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topThreats.map((threat, index) => (
                <div key={threat.type} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge className={`${getSeverityColor(threat.severity)} text-white border-0`}>
                      #{index + 1}
                    </Badge>
                    <span className="text-sm text-slate-300">{threat.type}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(threat.count / Math.max(...metrics.topThreats.map(t => t.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white font-medium">{threat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Attack Vectors */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Vetores de Ataque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.attackVectors.map((vector) => (
                <div key={vector.vector} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {getTrendIcon(vector.trend)}
                    <span className="text-sm text-slate-300">{vector.vector}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      className={`border-${vector.trend === 'up' ? 'red' : vector.trend === 'down' ? 'green' : 'gray'}-400 text-${vector.trend === 'up' ? 'red' : vector.trend === 'down' ? 'green' : 'gray'}-400`}
                    >
                      {vector.trend}
                    </Badge>
                    <span className="text-sm text-white font-medium">{vector.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Blocked IPs */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Ban className="h-5 w-5" />
            IPs Bloqueados Recentemente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {metrics.blockedIPs.slice(0, 6).map((blockedIP) => (
              <div key={blockedIP.ip} className="p-3 bg-slate-800/50 rounded-lg border border-red-900/30">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-sm text-red-400">{blockedIP.ip}</span>
                  <Badge variant="outline" className="border-red-400 text-red-400">
                    {blockedIP.attempts} tentativas
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span>{blockedIP.flag}</span>
                  <span>{blockedIP.city}, {blockedIP.country}</span>
                  <span>•</span>
                  <Clock className="h-3 w-3" />
                  <span>{new Date(blockedIP.lastSeen).toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default SecurityMonitoringPanel;
