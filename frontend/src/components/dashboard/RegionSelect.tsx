import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Command, CommandInput, CommandItem, CommandList, CommandEmpty } from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Globe, 
  Search, 
  MapPin, 
  Plus, 
  Clock, 
  Wifi, 
  Server,
  Check,
  ChevronDown
} from 'lucide-react';
import citiesData from '@/data/world-cities.json';

interface CityData {
  slug: string;
  label: string;
  country: string;
  flag: string;
  lat: number;
  lng: number;
  timezone: string;
  type: string;
  population: number;
}

// 🌍 Import dataset de cidades (pode ser carregado de API também)
import worldCitiesData from '@/data/world-cities.json';

// 🌍 Base de regiões populares para início rápido
const POPULAR_REGIONS: Region[] = [
  // Americas
  { slug: 'us-east-1', label: 'US East 1 (N. Virginia)', country: 'US', flag: '🇺🇸', lat: 39.0458, lng: -77.5081, timezone: 'EST', type: 'aws' },
  { slug: 'us-east-2', label: 'US East 2 (Ohio)', country: 'US', flag: '🇺🇸', lat: 40.4173, lng: -82.9071, timezone: 'EST', type: 'aws' },
  { slug: 'us-west-1', label: 'US West 1 (N. California)', country: 'US', flag: '🇺🇸', lat: 37.4419, lng: -122.1430, timezone: 'PST', type: 'aws' },
  { slug: 'us-west-2', label: 'US West 2 (Oregon)', country: 'US', flag: '🇺🇸', lat: 45.5152, lng: -122.6784, timezone: 'PST', type: 'aws' },
  { slug: 'ca-central-1', label: 'Canada Central (Toronto)', country: 'CA', flag: '🇨🇦', lat: 43.6532, lng: -79.3832, timezone: 'EST', type: 'aws' },
  
  // Europe
  { slug: 'eu-west-1', label: 'EU West 1 (Ireland)', country: 'IE', flag: '🇮🇪', lat: 53.3498, lng: -6.2603, timezone: 'GMT', type: 'aws' },
  { slug: 'eu-west-2', label: 'EU West 2 (London)', country: 'GB', flag: '🇬🇧', lat: 51.5074, lng: -0.1278, timezone: 'GMT', type: 'aws' },
  { slug: 'eu-central-1', label: 'EU Central 1 (Frankfurt)', country: 'DE', flag: '🇩🇪', lat: 50.1109, lng: 8.6821, timezone: 'CET', type: 'aws' },
  
  // Asia Pacific
  { slug: 'ap-southeast-1', label: 'Asia Pacific (Singapore)', country: 'SG', flag: '🇸🇬', lat: 1.3521, lng: 103.8198, timezone: 'SGT', type: 'aws' },
  { slug: 'ap-northeast-1', label: 'Asia Pacific (Tokyo)', country: 'JP', flag: '🇯🇵', lat: 35.6762, lng: 139.6503, timezone: 'JST', type: 'aws' },
  { slug: 'ap-south-1', label: 'Asia Pacific (Mumbai)', country: 'IN', flag: '🇮🇳', lat: 19.0760, lng: 72.8777, timezone: 'IST', type: 'aws' },
  
  // Grandes cidades mundiais
  { slug: 'br-saopaulo', label: 'São Paulo, Brasil', country: 'BR', flag: '🇧🇷', lat: -23.5505, lng: -46.6333, timezone: 'BRT', type: 'city' },
  { slug: 'mx-mexico-city', label: 'Mexico City, Mexico', country: 'MX', flag: '🇲🇽', lat: 19.4326, lng: -99.1332, timezone: 'CST', type: 'city' },
  { slug: 'ar-buenos-aires', label: 'Buenos Aires, Argentina', country: 'AR', flag: '🇦🇷', lat: -34.6037, lng: -58.3816, timezone: 'ART', type: 'city' },
  { slug: 'cn-beijing', label: 'Beijing, China', country: 'CN', flag: '🇨🇳', lat: 39.9042, lng: 116.4074, timezone: 'CST', type: 'city' },
  { slug: 'ru-moscow', label: 'Moscow, Russia', country: 'RU', flag: '🇷🇺', lat: 55.7558, lng: 37.6173, timezone: 'MSK', type: 'city' },
  { slug: 'au-sydney', label: 'Sydney, Australia', country: 'AU', flag: '🇦🇺', lat: -33.8688, lng: 151.2093, timezone: 'AEDT', type: 'city' },
];

// 🌍 Base mundial de cidades com dados reais
const WORLD_CITIES: Region[] = worldCitiesData as Region[];

export type Region = {
  slug: string;
  label: string;
  country?: string;
  flag?: string;
  lat?: number;
  lng?: number;
  timezone?: string;
  type?: 'aws' | 'city' | 'custom' | 'capital';
  population?: number;
};

interface RegionSelectProps {
  value?: Region;
  onChange: (region: Region) => void;
  placeholder?: string;
  className?: string;
}

export const RegionSelect: React.FC<RegionSelectProps> = ({ 
  value, 
  onChange, 
  placeholder = "Selecionar região...",
  className = ""
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [customSlug, setCustomSlug] = useState('');
  const [customLabel, setCustomLabel] = useState('');
  const [showCustomForm, setShowCustomForm] = useState(false);

  // 🔍 Busca inteligente em regiões
  const filteredRegions = useMemo(() => {
    if (!query || query.length < 2) {
      return {
        popular: POPULAR_REGIONS.slice(0, 8),
        cities: WORLD_CITIES
          .filter(city => city.population && city.population > 1000000) // Apenas cidades com mais de 1M
          .sort((a, b) => (b.population || 0) - (a.population || 0)) // Ordenar por população
          .slice(0, 15),
        total: 23
      };
    }

    const q = query.toLowerCase();
    const popularMatches = POPULAR_REGIONS.filter(region => 
      region.label.toLowerCase().includes(q) ||
      region.slug.toLowerCase().includes(q) ||
      (region.country && region.country.toLowerCase().includes(q))
    );

    const cityMatches = WORLD_CITIES.filter(city =>
      !POPULAR_REGIONS.some(p => p.slug === city.slug) && // Remove duplicatas
      (city.label.toLowerCase().includes(q) ||
       city.slug.toLowerCase().includes(q) ||
       (city.country && city.country.toLowerCase().includes(q)))
    ).sort((a, b) => 
      (b.population || 0) - (a.population || 0) // Cidades maiores primeiro
    ).slice(0, 20); // Limite para performance

    return {
      popular: popularMatches,
      cities: cityMatches,
      total: popularMatches.length + cityMatches.length
    };
  }, [query]);

  const handleSelectRegion = (region: Region) => {
    onChange(region);
    setOpen(false);
    setQuery('');
  };

  const handleCustomRegion = () => {
    if (!customSlug.trim() || !customLabel.trim()) return;

    const customRegion: Region = {
      slug: customSlug.toLowerCase().trim().replace(/\s+/g, '-'),
      label: customLabel.trim(),
      type: 'custom'
    };

    onChange(customRegion);
    setOpen(false);
    setCustomSlug('');
    setCustomLabel('');
    setShowCustomForm(false);
  };

  const getRegionDisplay = (region: Region) => {
    return (
      <div className="flex items-center gap-2">
        {region.flag && <span className="text-sm">{region.flag}</span>}
        <span>{region.label}</span>
        {region.type === 'custom' && (
          <Badge variant="outline" className="text-xs">
            Custom
          </Badge>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          className={`w-full justify-between bg-white/5 border-white/10 text-white hover:bg-white/10 ${className}`}
        >
          {value ? getRegionDisplay(value) : (
            <span className="text-slate-400">{placeholder}</span>
          )}
          <ChevronDown className="h-4 w-4 opacity-50" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="w-full max-w-lg p-0 bg-slate-900 border-slate-700">
        <div className="flex flex-col h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Globe className="h-5 w-5 text-blue-400" />
              Selecionar Região do Servidor
              <Badge variant="outline" className="ml-auto text-xs border-blue-400 text-blue-400">
                {POPULAR_REGIONS.length + WORLD_CITIES.length}+ regiões
              </Badge>
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              Escolha uma localização para otimizar latência e métricas
            </p>
          </div>

          {/* Search */}
          <div className="p-4">
            <Command shouldFilter={false}>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <CommandInput
                  placeholder="Buscar por cidade, país ou região..."
                  className="pl-10 bg-slate-800 border-slate-600 text-white"
                  value={query}
                  onValueChange={setQuery}
                />
              </div>
            </Command>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-auto px-4 pb-4">
            <CommandList className="max-h-none">
              {!showCustomForm && (
                <>
                  {/* Popular Regions */}
                  {filteredRegions.popular.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Server className="h-4 w-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-300">
                          Regiões Populares
                        </span>
                      </div>
                      {filteredRegions.popular.map((region) => (
                        <CommandItem
                          key={region.slug}
                          onSelect={() => handleSelectRegion(region)}
                          className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-800 text-white"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{region.flag}</span>
                            <div>
                              <div className="font-medium">{region.label}</div>
                              <div className="text-xs text-slate-400">
                                {region.timezone} • {region.type === 'aws' ? 'Cloud Region' : 'Major City'}
                              </div>
                            </div>
                          </div>
                          {region.type === 'aws' && (
                            <Badge variant="outline" className="text-xs border-blue-400 text-blue-400">
                              AWS
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </div>
                  )}

                  {/* World Cities */}
                  {filteredRegions.cities.length > 0 && (
                    <div className="mb-4">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="h-4 w-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-300">
                          Cidades Mundiais
                        </span>
                      </div>
                      {filteredRegions.cities.map((city) => (
                        <CommandItem
                          key={city.slug}
                          onSelect={() => handleSelectRegion(city)}
                          className="flex items-center justify-between p-3 rounded-lg cursor-pointer hover:bg-slate-800 text-white"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-lg">{city.flag}</span>
                            <div>
                              <div className="font-medium">{city.label}</div>
                              <div className="text-xs text-slate-400">
                                {city.timezone} • 
                                {city.population && ` ${(city.population / 1000000).toFixed(1)}M hab • `}
                                Lat: {city.lat?.toFixed(2)}, Lng: {city.lng?.toFixed(2)}
                              </div>
                            </div>
                          </div>
                          {city.population && city.population > 10000000 && (
                            <Badge variant="outline" className="text-xs border-yellow-400 text-yellow-400">
                              Megacity
                            </Badge>
                          )}
                        </CommandItem>
                      ))}
                    </div>
                  )}

                  {filteredRegions.total === 0 && query.length >= 2 && (
                    <CommandEmpty className="text-center py-8 text-slate-400">
                      <MapPin className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma região encontrada</p>
                      <p className="text-xs mt-1">Tente usar a opção personalizada abaixo</p>
                    </CommandEmpty>
                  )}

                  {/* Custom Region Option */}
                  <Separator className="my-4 bg-slate-700" />
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Plus className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-slate-300">
                        Região Personalizada
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      Para datacenters específicos, edge locations ou infraestrutura customizada
                    </p>
                    <Button
                      onClick={() => setShowCustomForm(true)}
                      className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Criar Região Personalizada
                    </Button>
                  </div>
                </>
              )}

              {/* Custom Form */}
              {showCustomForm && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Plus className="h-5 w-5 text-orange-400" />
                    <span className="font-medium text-white">Nova Região Personalizada</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-slate-300">Slug da Região *</Label>
                      <Input
                        placeholder="ex: my-datacenter-1, edge-site-ny"
                        value={customSlug}
                        onChange={(e) => setCustomSlug(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                      />
                      <p className="text-xs text-slate-400 mt-1">
                        Apenas letras, números e hífens. Será normalizado automaticamente.
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm text-slate-300">Nome Descritivo *</Label>
                      <Input
                        placeholder="ex: My Datacenter 1, Edge Site New York"
                        value={customLabel}
                        onChange={(e) => setCustomLabel(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white mt-1"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={handleCustomRegion}
                        disabled={!customSlug.trim() || !customLabel.trim()}
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        size="sm"
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Criar Região
                      </Button>
                      <Button
                        onClick={() => setShowCustomForm(false)}
                        variant="outline"
                        className="border-slate-600 text-slate-300"
                        size="sm"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CommandList>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default RegionSelect;
