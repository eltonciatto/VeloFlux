
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Save, RefreshCw, Globe, MapPin, Wifi, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBackends, useAddBackend, useDeleteBackend } from '@/hooks/use-api';
import RegionSelect, { type Region } from './RegionSelect';
import worldCitiesData from '@/data/world-cities.json';

interface Backend {
  id: string;
  address: string;
  pool: string;
  weight: number;
  region: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  latency?: number;
}

// 🌍 Sistema de Validação de Regiões - OBRIGATÓRIO para métricas corretas
const REGION_VALIDATION = {
  // Regiões padrão com coordenadas para métricas de latência
  PREDEFINED: [
    // Americas
    { value: 'us-east-1', label: 'US East 1 (N. Virginia)', continent: 'Americas', flag: '🇺🇸', lat: 39.0458, lng: -77.5081, timezone: 'EST' },
    { value: 'us-east-2', label: 'US East 2 (Ohio)', continent: 'Americas', flag: '🇺🇸', lat: 40.4173, lng: -82.9071, timezone: 'EST' },
    { value: 'us-west-1', label: 'US West 1 (N. California)', continent: 'Americas', flag: '🇺🇸', lat: 37.4419, lng: -122.1430, timezone: 'PST' },
    { value: 'us-west-2', label: 'US West 2 (Oregon)', continent: 'Americas', flag: '🇺🇸', lat: 45.5152, lng: -122.6784, timezone: 'PST' },
    { value: 'ca-central-1', label: 'Canada Central (Toronto)', continent: 'Americas', flag: '🇨🇦', lat: 43.6532, lng: -79.3832, timezone: 'EST' },
    { value: 'sa-east-1', label: 'South America (São Paulo)', continent: 'Americas', flag: '🇧🇷', lat: -23.5505, lng: -46.6333, timezone: 'BRT' },
    
    // Europe
    { value: 'eu-west-1', label: 'EU West 1 (Ireland)', continent: 'Europe', flag: '🇮🇪', lat: 53.3498, lng: -6.2603, timezone: 'GMT' },
    { value: 'eu-west-2', label: 'EU West 2 (London)', continent: 'Europe', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, timezone: 'GMT' },
    { value: 'eu-central-1', label: 'EU Central 1 (Frankfurt)', continent: 'Europe', flag: '🇩🇪', lat: 50.1109, lng: 8.6821, timezone: 'CET' },
    
    // Asia Pacific
    { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)', continent: 'Asia Pacific', flag: '🇸🇬', lat: 1.3521, lng: 103.8198, timezone: 'SGT' },
    { value: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)', continent: 'Asia Pacific', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, timezone: 'JST' },
    
    // Região padrão OBRIGATÓRIA para backends sem região específica
    { value: 'default', label: 'Default Region (Unspecified)', continent: 'Default', flag: '�', lat: 0, lng: 0, timezone: 'UTC' }
  ],
  
  // Validação de região customizada
  validateCustomRegion: (region: string) => {
    if (!region || region.trim() === '') return false;
    if (region.length < 3 || region.length > 50) return false;
    // Regex para formato válido: letras, números, hífens
    return /^[a-zA-Z0-9-_]+$/.test(region);
  },
  
  // Normalizar nome da região
  normalizeRegion: (region: string) => {
    return region.toLowerCase().trim().replace(/\s+/g, '-');
  }
};

// 🌍 Função inteligente para buscar dados da região
const getRegionData = (regionSlug: string) => {
  // Primeiro, buscar nas regiões predefinidas
  const predefined = REGION_VALIDATION.PREDEFINED.find(r => r.value === regionSlug);
  if (predefined) {
    return {
      label: predefined.label,
      flag: predefined.flag,
      timezone: predefined.timezone,
      lat: predefined.lat,
      lng: predefined.lng,
      type: 'predefined' as const
    };
  }

  // Depois, buscar nas cidades mundiais
  const worldCities = worldCitiesData as Region[];
  const cityData = worldCities.find(city => city.slug === regionSlug);
  if (cityData) {
    return {
      label: cityData.label,
      flag: cityData.flag,
      timezone: cityData.timezone,
      lat: cityData.lat,
      lng: cityData.lng,
      type: 'city' as const,
      population: cityData.population
    };
  }

  // Se não encontrou, retornar dados customizados
  return {
    label: regionSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    flag: '🏢',
    timezone: 'UTC',
    type: 'custom' as const
  };
};

export const BackendManager = () => {
  const { toast } = useToast();
  const { data: backends = [], refetch } = useBackends();
  const addBackendMutation = useAddBackend();
  const deleteBackendMutation = useDeleteBackend();

  const [newBackend, setNewBackend] = useState({
    address: '',
    pool: 'web-servers',
    weight: 100,
    region: null as Region | null // Usar tipo Region do componente
  });

  const [customRegionInput, setCustomRegionInput] = useState('');
  const [showCustomRegion, setShowCustomRegion] = useState(false);
  const [regionValidationError, setRegionValidationError] = useState('');

  const addBackend = async () => {
    if (!newBackend.address) {
      toast({
        title: 'Erro',
        description: 'Endereço do backend é obrigatório',
        variant: 'destructive',
      });
      return;
    }

    if (!newBackend.region) {
      toast({
        title: 'Erro',
        description: 'Região do servidor é obrigatória para métricas corretas',
        variant: 'destructive',
      });
      return;
    }

    try {
      await addBackendMutation.mutateAsync({
        pool: newBackend.pool,
        backend: {
          address: newBackend.address,
          weight: newBackend.weight,
          region: newBackend.region.slug, // Usar slug da região selecionada
        },
      });
      setNewBackend({
        address: '',
        pool: 'web-servers',
        weight: 100,
        region: null,
      });
      toast({ title: 'Backend Adicionado', description: 'Backend configurado com sucesso' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Erro', description: message, variant: 'destructive' });
    }
  };

  const removeBackend = async (b: Backend) => {
    try {
      await deleteBackendMutation.mutateAsync({
        pool: b.pool,
        address: b.address,
      });
      toast({ title: 'Backend Removed' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      toast({ title: 'Error', description: message, variant: 'destructive' });
    }
  };

  const saveConfiguration = () => {
    toast({
      title: 'Configuration Saved',
      description: 'Backend configuration has been updated',
    });
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100/10 text-green-300 border-green-400/30',
      unhealthy: 'bg-red-100/10 text-red-300 border-red-400/30',
      unknown: 'bg-yellow-100/10 text-yellow-300 border-yellow-400/30'
    };
    return variants[status as keyof typeof variants] || variants.unknown;
  };

  return (
    <div className="space-y-6">
      {/* Add New Backend */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add New Backend
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label htmlFor="address" className="text-blue-200">Address</Label>
              <Input
                id="address"
                value={newBackend.address}
                onChange={(e) => setNewBackend({ ...newBackend, address: e.target.value })}
                placeholder="backend-3:80"
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="pool" className="text-blue-200">Pool</Label>
              <Select value={newBackend.pool} onValueChange={(value) => setNewBackend({ ...newBackend, pool: value })}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web-servers">Web Servers</SelectItem>
                  <SelectItem value="api-servers">API Servers</SelectItem>
                  <SelectItem value="static-assets">Static Assets</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="weight" className="text-blue-200">Weight</Label>
              <Input
                id="weight"
                type="number"
                value={newBackend.weight}
                onChange={(e) => setNewBackend({ ...newBackend, weight: parseInt(e.target.value) || 100 })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <Label htmlFor="region" className="text-blue-200 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Região do Servidor *
                <Badge variant="outline" className="text-xs border-red-400/30 text-red-300">
                  Obrigatório
                </Badge>
              </Label>
              <RegionSelect
                value={newBackend.region}
                onChange={(region) => setNewBackend({ ...newBackend, region })}
                placeholder="Selecionar região..."
                className="mt-1"
              />
              <p className="text-xs text-slate-400 mt-1">
                Região afeta métricas de latência e roteamento inteligente
              </p>
            </div>
          </div>
          <Button onClick={addBackend} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Backend
          </Button>
        </div>
      </Card>

      {/* Backend List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Configured Backends</h3>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10" onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" onClick={saveConfiguration} className="bg-green-600 hover:bg-green-700">
              <Save className="w-4 h-4 mr-2" />
              Save Configuration
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {backends.map((backend) => {
              // Buscar dados da região de forma inteligente
              const regionData = getRegionData(backend.region);
              
              return (
                <div key={backend.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10 hover:bg-white/10 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{regionData.flag}</span>
                      <Globe className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-semibold text-white flex items-center gap-2">
                        {backend.address}
                        {backend.latency && (
                          <Badge variant="outline" className="text-xs border-green-400/30 text-green-300">
                            {backend.latency}ms
                          </Badge>
                        )}
                      </div>
                      <div className="text-sm text-blue-200 flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Wifi className="h-3 w-3" />
                          Pool: {backend.pool}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {regionData.label}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {regionData.timezone}
                        </span>
                        {regionData.type === 'city' && regionData.population && (
                          <Badge variant="outline" className="text-xs border-yellow-400/30 text-yellow-300">
                            {(regionData.population / 1000000).toFixed(1)}M hab
                          </Badge>
                        )}
                        {regionData.type === 'custom' && (
                          <Badge variant="outline" className="text-xs border-orange-400/30 text-orange-300">
                            Custom
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <div className="text-sm text-blue-200">Weight</div>
                      <div className="font-semibold text-white">{backend.weight}</div>
                    </div>

                    <Badge className={getStatusBadge(backend.status)}>
                      {backend.status}
                    </Badge>

                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="border-red-400/30 text-red-300 hover:bg-red-600/20"
                      onClick={() => removeBackend(backend)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
            
            {backends.length === 0 && (
              <div className="text-center py-8 text-slate-400">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-30" />
                <h3 className="text-lg font-medium text-slate-300 mb-2">Nenhum Backend Configurado</h3>
                <p className="text-sm">Adicione o primeiro backend para começar o balanceamento de carga</p>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BackendManager;
