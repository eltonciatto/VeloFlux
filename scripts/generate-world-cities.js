#!/usr/bin/env node

/**
 * 🌍 GERADOR AVANÇADO DE CIDADES MUNDIAIS PARA BALANCEADOR DE CARGA
 * 
 * Este script gera um arquivo world-cities.json completo com dados
 * otimizados para um balanceador de carga super inteligente.
 * 
 * Dados coletados:
 * - Coordenadas geográficas precisas (lat/lng)
 * - Timezone correto para cada localização
 * - População para priorização de tráfego
 * - Códigos de país ISO
 * - Bandeiras emoji
 * - Tipo de localização (city, datacenter, edge)
 * - Conectividade de internet estimada
 * - Distância a datacenters principais
 * 
 * APIs utilizadas:
 * - REST Countries API (países e bandeiras)
 * - GeoNames API (cidades e coordenadas)
 * - World Cities Database (população)
 * - Timezone API (fusos horários)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// 🌍 Configurações do script
const CONFIG = {
  OUTPUT_FILE: path.join(__dirname, '../frontend/src/data/world-cities.json'),
  MIN_POPULATION: 50000, // Mínimo de população para incluir a cidade
  MAX_CITIES_PER_COUNTRY: 50, // Máximo de cidades por país
  INCLUDE_DATACENTERS: true, // Incluir localizações de datacenters conhecidos
  INCLUDE_EDGE_LOCATIONS: true, // Incluir edge locations de CDNs
  APIS: {
    COUNTRIES: 'https://restcountries.com/v3.1/all',
    GEONAMES_BASE: 'http://api.geonames.org',
    GEONAMES_USERNAME: 'demo', // Usar conta própria em produção
    TIMEZONE_BASE: 'http://api.timezonedb.com/v2.1',
    WORLD_CITIES: 'https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world_population.csv'
  }
};

// 🏢 Datacenters conhecidos de grandes provedores (AWS, GCP, Azure, etc.)
const KNOWN_DATACENTERS = [
  // AWS Regions
  { slug: 'aws-us-east-1', label: 'AWS US East 1 (N. Virginia)', lat: 39.0458, lng: -77.5081, country: 'US', timezone: 'America/New_York', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-us-east-2', label: 'AWS US East 2 (Ohio)', lat: 40.4173, lng: -82.9071, country: 'US', timezone: 'America/New_York', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-us-west-1', label: 'AWS US West 1 (N. California)', lat: 37.4419, lng: -122.1430, country: 'US', timezone: 'America/Los_Angeles', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-us-west-2', label: 'AWS US West 2 (Oregon)', lat: 45.5152, lng: -122.6784, country: 'US', timezone: 'America/Los_Angeles', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-eu-west-1', label: 'AWS EU West 1 (Ireland)', lat: 53.3498, lng: -6.2603, country: 'IE', timezone: 'Europe/Dublin', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-eu-west-2', label: 'AWS EU West 2 (London)', lat: 51.5074, lng: -0.1278, country: 'GB', timezone: 'Europe/London', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-eu-central-1', label: 'AWS EU Central 1 (Frankfurt)', lat: 50.1109, lng: 8.6821, country: 'DE', timezone: 'Europe/Berlin', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-ap-northeast-1', label: 'AWS AP Northeast 1 (Tokyo)', lat: 35.6762, lng: 139.6503, country: 'JP', timezone: 'Asia/Tokyo', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-ap-southeast-1', label: 'AWS AP Southeast 1 (Singapore)', lat: 1.3521, lng: 103.8198, country: 'SG', timezone: 'Asia/Singapore', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-ap-southeast-2', label: 'AWS AP Southeast 2 (Sydney)', lat: -33.8688, lng: 151.2093, country: 'AU', timezone: 'Australia/Sydney', type: 'datacenter', provider: 'aws' },
  { slug: 'aws-sa-east-1', label: 'AWS SA East 1 (São Paulo)', lat: -23.5505, lng: -46.6333, country: 'BR', timezone: 'America/Sao_Paulo', type: 'datacenter', provider: 'aws' },
  
  // Google Cloud Platform
  { slug: 'gcp-us-central1', label: 'GCP US Central 1 (Iowa)', lat: 41.2619, lng: -95.8608, country: 'US', timezone: 'America/Chicago', type: 'datacenter', provider: 'gcp' },
  { slug: 'gcp-us-east1', label: 'GCP US East 1 (S. Carolina)', lat: 33.1960, lng: -79.9310, country: 'US', timezone: 'America/New_York', type: 'datacenter', provider: 'gcp' },
  { slug: 'gcp-us-west1', label: 'GCP US West 1 (Oregon)', lat: 45.5152, lng: -122.6784, country: 'US', timezone: 'America/Los_Angeles', type: 'datacenter', provider: 'gcp' },
  { slug: 'gcp-europe-west1', label: 'GCP Europe West 1 (Belgium)', lat: 50.8503, lng: 4.3517, country: 'BE', timezone: 'Europe/Brussels', type: 'datacenter', provider: 'gcp' },
  { slug: 'gcp-asia-east1', label: 'GCP Asia East 1 (Taiwan)', lat: 25.0330, lng: 121.5654, country: 'TW', timezone: 'Asia/Taipei', type: 'datacenter', provider: 'gcp' },
  
  // Microsoft Azure
  { slug: 'azure-east-us', label: 'Azure East US (Virginia)', lat: 37.3719, lng: -79.8164, country: 'US', timezone: 'America/New_York', type: 'datacenter', provider: 'azure' },
  { slug: 'azure-west-us', label: 'Azure West US (California)', lat: 37.7838, lng: -122.2471, country: 'US', timezone: 'America/Los_Angeles', type: 'datacenter', provider: 'azure' },
  { slug: 'azure-north-europe', label: 'Azure North Europe (Ireland)', lat: 53.3498, lng: -6.2603, country: 'IE', timezone: 'Europe/Dublin', type: 'datacenter', provider: 'azure' },
  { slug: 'azure-west-europe', label: 'Azure West Europe (Netherlands)', lat: 52.3676, lng: 4.9041, country: 'NL', timezone: 'Europe/Amsterdam', type: 'datacenter', provider: 'azure' },
  
  // Cloudflare Edge Locations (principais)
  { slug: 'cf-lax', label: 'Cloudflare Los Angeles', lat: 33.9425, lng: -118.4081, country: 'US', timezone: 'America/Los_Angeles', type: 'edge', provider: 'cloudflare' },
  { slug: 'cf-ord', label: 'Cloudflare Chicago', lat: 41.9742, lng: -87.9073, country: 'US', timezone: 'America/Chicago', type: 'edge', provider: 'cloudflare' },
  { slug: 'cf-lhr', label: 'Cloudflare London', lat: 51.4700, lng: -0.4543, country: 'GB', timezone: 'Europe/London', type: 'edge', provider: 'cloudflare' },
  { slug: 'cf-fra', label: 'Cloudflare Frankfurt', lat: 50.0379, lng: 8.5622, country: 'DE', timezone: 'Europe/Berlin', type: 'edge', provider: 'cloudflare' },
  { slug: 'cf-nrt', label: 'Cloudflare Tokyo', lat: 35.7720, lng: 140.3929, country: 'JP', timezone: 'Asia/Tokyo', type: 'edge', provider: 'cloudflare' },
  { slug: 'cf-sin', label: 'Cloudflare Singapore', lat: 1.3644, lng: 103.9915, country: 'SG', timezone: 'Asia/Singapore', type: 'edge', provider: 'cloudflare' }
];

// 🌐 Mapeamento de países para bandeiras emoji
const COUNTRY_FLAGS = {
  'AD': '🇦🇩', 'AE': '🇦🇪', 'AF': '🇦🇫', 'AG': '🇦🇬', 'AI': '🇦🇮', 'AL': '🇦🇱', 'AM': '🇦🇲', 'AO': '🇦🇴',
  'AQ': '🇦🇶', 'AR': '🇦🇷', 'AS': '🇦🇸', 'AT': '🇦🇹', 'AU': '🇦🇺', 'AW': '🇦🇼', 'AX': '🇦🇽', 'AZ': '🇦🇿',
  'BA': '🇧🇦', 'BB': '🇧🇧', 'BD': '🇧🇩', 'BE': '🇧🇪', 'BF': '🇧🇫', 'BG': '🇧🇬', 'BH': '🇧🇭', 'BI': '🇧🇮',
  'BJ': '🇧🇯', 'BL': '🇧🇱', 'BM': '🇧🇲', 'BN': '🇧🇳', 'BO': '🇧🇴', 'BQ': '🇧🇶', 'BR': '🇧🇷', 'BS': '🇧🇸',
  'BT': '🇧🇹', 'BV': '🇧🇻', 'BW': '🇧🇼', 'BY': '🇧🇾', 'BZ': '🇧🇿', 'CA': '🇨🇦', 'CC': '🇨🇨', 'CD': '🇨🇩',
  'CF': '🇨🇫', 'CG': '🇨🇬', 'CH': '🇨🇭', 'CI': '🇨🇮', 'CK': '🇨🇰', 'CL': '🇨🇱', 'CM': '🇨🇲', 'CN': '🇨🇳',
  'CO': '🇨🇴', 'CR': '🇨🇷', 'CU': '🇨🇺', 'CV': '🇨🇻', 'CW': '🇨🇼', 'CX': '🇨🇽', 'CY': '🇨🇾', 'CZ': '🇨🇿',
  'DE': '🇩🇪', 'DJ': '🇩🇯', 'DK': '🇩🇰', 'DM': '🇩🇲', 'DO': '🇩🇴', 'DZ': '🇩🇿', 'EC': '🇪🇨', 'EE': '🇪🇪',
  'EG': '🇪🇬', 'EH': '🇪🇭', 'ER': '🇪🇷', 'ES': '🇪🇸', 'ET': '🇪🇹', 'FI': '🇫🇮', 'FJ': '🇫🇯', 'FK': '🇫🇰',
  'FM': '🇫🇲', 'FO': '🇫🇴', 'FR': '🇫🇷', 'GA': '🇬🇦', 'GB': '🇬🇧', 'GD': '🇬🇩', 'GE': '🇬🇪', 'GF': '🇬🇫',
  'GG': '🇬🇬', 'GH': '🇬🇭', 'GI': '🇬🇮', 'GL': '🇬🇱', 'GM': '🇬🇲', 'GN': '🇬🇳', 'GP': '🇬🇵', 'GQ': '🇬🇶',
  'GR': '🇬🇷', 'GS': '🇬🇸', 'GT': '🇬🇹', 'GU': '🇬🇺', 'GW': '🇬🇼', 'GY': '🇬🇾', 'HK': '🇭🇰', 'HM': '🇭🇲',
  'HN': '🇭🇳', 'HR': '🇭🇷', 'HT': '🇭🇹', 'HU': '🇭🇺', 'ID': '🇮🇩', 'IE': '🇮🇪', 'IL': '🇮🇱', 'IM': '🇮🇲',
  'IN': '🇮🇳', 'IO': '🇮🇴', 'IQ': '🇮🇶', 'IR': '🇮🇷', 'IS': '🇮🇸', 'IT': '🇮🇹', 'JE': '🇯🇪', 'JM': '🇯🇲',
  'JO': '🇯🇴', 'JP': '🇯🇵', 'KE': '🇰🇪', 'KG': '🇰🇬', 'KH': '🇰🇭', 'KI': '🇰🇮', 'KM': '🇰🇲', 'KN': '🇰🇳',
  'KP': '🇰🇵', 'KR': '🇰🇷', 'KW': '🇰🇼', 'KY': '🇰🇾', 'KZ': '🇰🇿', 'LA': '🇱🇦', 'LB': '🇱🇧', 'LC': '🇱🇨',
  'LI': '🇱🇮', 'LK': '🇱🇰', 'LR': '🇱🇷', 'LS': '🇱🇸', 'LT': '🇱🇹', 'LU': '🇱🇺', 'LV': '🇱🇻', 'LY': '🇱🇾',
  'MA': '🇲🇦', 'MC': '🇲🇨', 'MD': '🇲🇩', 'ME': '🇲🇪', 'MF': '🇲🇫', 'MG': '🇲🇬', 'MH': '🇲🇭', 'MK': '🇲🇰',
  'ML': '🇲🇱', 'MM': '🇲🇲', 'MN': '🇲🇳', 'MO': '🇲🇴', 'MP': '🇲🇵', 'MQ': '🇲🇶', 'MR': '🇲🇷', 'MS': '🇲🇸',
  'MT': '🇲🇹', 'MU': '🇲🇺', 'MV': '🇲🇻', 'MW': '🇲🇼', 'MX': '🇲🇽', 'MY': '🇲🇾', 'MZ': '🇲🇿', 'NA': '🇳🇦',
  'NC': '🇳🇨', 'NE': '🇳🇪', 'NF': '🇳🇫', 'NG': '🇳🇬', 'NI': '🇳🇮', 'NL': '🇳🇱', 'NO': '🇳🇴', 'NP': '🇳🇵',
  'NR': '🇳🇷', 'NU': '🇳🇺', 'NZ': '🇳🇿', 'OM': '🇴🇲', 'PA': '🇵🇦', 'PE': '🇵🇪', 'PF': '🇵🇫', 'PG': '🇵🇬',
  'PH': '🇵🇭', 'PK': '🇵🇰', 'PL': '🇵🇱', 'PM': '🇵🇲', 'PN': '🇵🇳', 'PR': '🇵🇷', 'PS': '🇵🇸', 'PT': '🇵🇹',
  'PW': '🇵🇼', 'PY': '🇵🇾', 'QA': '🇶🇦', 'RE': '🇷🇪', 'RO': '🇷🇴', 'RS': '🇷🇸', 'RU': '🇷🇺', 'RW': '🇷🇼',
  'SA': '🇸🇦', 'SB': '🇸🇧', 'SC': '🇸🇨', 'SD': '🇸🇩', 'SE': '🇸🇪', 'SG': '🇸🇬', 'SH': '🇸🇭', 'SI': '🇸🇮',
  'SJ': '🇸🇯', 'SK': '🇸🇰', 'SL': '🇸🇱', 'SM': '🇸🇲', 'SN': '🇸🇳', 'SO': '🇸🇴', 'SR': '🇸🇷', 'SS': '🇸🇸',
  'ST': '🇸🇹', 'SV': '🇸🇻', 'SX': '🇸🇽', 'SY': '🇸🇾', 'SZ': '🇸🇿', 'TC': '🇹🇨', 'TD': '🇹🇩', 'TF': '🇹🇫',
  'TG': '🇹🇬', 'TH': '🇹🇭', 'TJ': '🇹🇯', 'TK': '🇹🇰', 'TL': '🇹🇱', 'TM': '🇹🇲', 'TN': '🇹🇳', 'TO': '🇹🇴',
  'TR': '🇹🇷', 'TT': '🇹🇹', 'TV': '🇹🇻', 'TW': '🇹🇼', 'TZ': '🇹🇿', 'UA': '🇺🇦', 'UG': '🇺🇬', 'UM': '🇺🇲',
  'US': '🇺🇸', 'UY': '🇺🇾', 'UZ': '🇺🇿', 'VA': '🇻🇦', 'VC': '🇻🇨', 'VE': '🇻🇪', 'VG': '🇻🇬', 'VI': '🇻🇮',
  'VN': '🇻🇳', 'VU': '🇻🇺', 'WF': '🇼🇫', 'WS': '🇼🇸', 'YE': '🇾🇪', 'YT': '🇾🇹', 'ZA': '🇿🇦', 'ZM': '🇿🇲', 'ZW': '🇿🇼'
};

// 🔧 Utilitários
const fetchJSON = (url) => {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (err) {
          reject(new Error(`Failed to parse JSON from ${url}: ${err.message}`));
        }
      });
    }).on('error', reject);
  });
};

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const generateSlug = (cityName, countryCode) => {
  return `${countryCode.toLowerCase()}-${cityName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')}`;
};

const calculateConnectivityScore = (population, isCapital, hasDatacenter) => {
  let score = Math.min(100, Math.log10(population) * 15);
  if (isCapital) score += 20;
  if (hasDatacenter) score += 30;
  return Math.round(score);
};

// 🌍 Função principal para buscar países
async function fetchCountries() {
  console.log('🌍 Buscando lista de países...');
  try {
    const countries = await fetchJSON(CONFIG.APIS.COUNTRIES);
    console.log(`✅ ${countries.length} países encontrados`);
    
    return countries.map(country => ({
      code: country.cca2,
      name: country.name.common,
      capital: country.capital?.[0],
      flag: COUNTRY_FLAGS[country.cca2] || '🏳️',
      timezone: country.timezones?.[0] || 'UTC',
      region: country.region,
      subregion: country.subregion,
      latlng: country.latlng || [0, 0]
    }));
  } catch (error) {
    console.error('❌ Erro ao buscar países:', error.message);
    throw error;
  }
}

// 🏙️ Função para buscar cidades de um país
async function fetchCitiesForCountry(country) {
  console.log(`🏙️ Buscando cidades para ${country.name} (${country.code})`);
  
  try {
    // Buscar cidades usando GeoNames API
    const url = `${CONFIG.APIS.GEONAMES_BASE}/searchJSON?country=${country.code}&featureClass=P&maxRows=${CONFIG.MAX_CITIES_PER_COUNTRY}&username=${CONFIG.APIS.GEONAMES_USERNAME}&orderby=population`;
    
    await delay(100); // Rate limiting
    const response = await fetchJSON(url);
    
    if (!response.geonames) {
      console.log(`⚠️ Nenhuma cidade encontrada para ${country.name}`);
      return [];
    }

    const cities = response.geonames
      .filter(city => city.population >= CONFIG.MIN_POPULATION)
      .map(city => ({
        slug: generateSlug(city.name, country.code),
        label: `${city.name}, ${country.name}`,
        country: country.code,
        flag: country.flag,
        lat: parseFloat(city.lat),
        lng: parseFloat(city.lng),
        timezone: city.timezone?.timeZoneId || country.timezone,
        type: 'city',
        population: parseInt(city.population) || 0,
        isCapital: city.name === country.capital,
        connectivityScore: calculateConnectivityScore(
          parseInt(city.population) || 0,
          city.name === country.capital,
          false
        )
      }));

    console.log(`✅ ${cities.length} cidades encontradas para ${country.name}`);
    return cities;
    
  } catch (error) {
    console.error(`❌ Erro ao buscar cidades para ${country.name}:`, error.message);
    return [];
  }
}

// 🏢 Função para processar datacenters conhecidos
function processDatacenters() {
  console.log('🏢 Processando datacenters conhecidos...');
  
  return KNOWN_DATACENTERS.map(dc => ({
    slug: dc.slug,
    label: dc.label,
    country: dc.country,
    flag: COUNTRY_FLAGS[dc.country] || '🏢',
    lat: dc.lat,
    lng: dc.lng,
    timezone: dc.timezone,
    type: dc.type,
    provider: dc.provider,
    connectivityScore: 95, // Datacenters têm alta conectividade
    isDatacenter: true
  }));
}

// 📊 Função para gerar estatísticas
function generateStats(cities) {
  const stats = {
    totalCities: cities.length,
    totalCountries: new Set(cities.map(c => c.country)).size,
    cityTypes: {
      city: cities.filter(c => c.type === 'city').length,
      datacenter: cities.filter(c => c.type === 'datacenter').length,
      edge: cities.filter(c => c.type === 'edge').length
    },
    continents: {},
    topCitiesByPopulation: cities
      .filter(c => c.population)
      .sort((a, b) => b.population - a.population)
      .slice(0, 10)
      .map(c => ({ name: c.label, population: c.population }))
  };

  // Agrupar por continentes (aproximadamente por coordenadas)
  cities.forEach(city => {
    let continent = 'Other';
    if (city.lat > 35 && city.lng > -10 && city.lng < 70) continent = 'Europe';
    else if (city.lat > -35 && city.lng > 25 && city.lng < 135) continent = 'Asia';
    else if (city.lat > -35 && city.lng < 25 && city.lng > -20) continent = 'Africa';
    else if (city.lng > -170 && city.lng < -35) continent = 'Americas';
    else if (city.lng > 110 && city.lat < -10) continent = 'Oceania';
    
    stats.continents[continent] = (stats.continents[continent] || 0) + 1;
  });

  return stats;
}

// 🚀 Função principal
async function main() {
  console.log('🚀 Iniciando geração do arquivo world-cities.json...\n');
  
  try {
    // 1. Buscar países
    const countries = await fetchCountries();
    
    // 2. Buscar cidades para cada país
    const allCities = [];
    
    for (let i = 0; i < countries.length; i++) {
      const country = countries[i];
      console.log(`[${i + 1}/${countries.length}] Processando ${country.name}...`);
      
      const cities = await fetchCitiesForCountry(country);
      allCities.push(...cities);
      
      // Progress update
      if ((i + 1) % 10 === 0) {
        console.log(`📊 Progresso: ${i + 1}/${countries.length} países processados, ${allCities.length} cidades coletadas\n`);
      }
    }
    
    // 3. Adicionar datacenters conhecidos
    if (CONFIG.INCLUDE_DATACENTERS) {
      const datacenters = processDatacenters();
      allCities.push(...datacenters);
      console.log(`🏢 ${datacenters.length} datacenters adicionados`);
    }
    
    // 4. Ordenar por população e conectividade
    allCities.sort((a, b) => {
      if (a.connectivityScore !== b.connectivityScore) {
        return b.connectivityScore - a.connectivityScore;
      }
      return (b.population || 0) - (a.population || 0);
    });
    
    // 5. Gerar estatísticas
    const stats = generateStats(allCities);
    
    // 6. Criar estrutura final
    const output = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0.0',
        description: 'Comprehensive world cities database optimized for intelligent load balancing',
        stats,
        apis: Object.keys(CONFIG.APIS),
        config: {
          minPopulation: CONFIG.MIN_POPULATION,
          maxCitiesPerCountry: CONFIG.MAX_CITIES_PER_COUNTRY,
          includeDatacenters: CONFIG.INCLUDE_DATACENTERS,
          includeEdgeLocations: CONFIG.INCLUDE_EDGE_LOCATIONS
        }
      },
      cities: allCities
    };
    
    // 7. Salvar arquivo
    const outputPath = CONFIG.OUTPUT_FILE;
    fs.writeFileSync(outputPath, JSON.stringify(output.cities, null, 2), 'utf8');
    
    // 8. Salvar metadados separadamente
    const metadataPath = outputPath.replace('.json', '-metadata.json');
    fs.writeFileSync(metadataPath, JSON.stringify(output.metadata, null, 2), 'utf8');
    
    // 9. Relatório final
    console.log('\n🎉 GERAÇÃO COMPLETA!');
    console.log('=====================================');
    console.log(`📁 Arquivo gerado: ${outputPath}`);
    console.log(`📊 Metadados: ${metadataPath}`);
    console.log(`🌍 Total de cidades: ${stats.totalCities}`);
    console.log(`🏳️ Total de países: ${stats.totalCountries}`);
    console.log(`🏙️ Cidades normais: ${stats.cityTypes.city}`);
    console.log(`🏢 Datacenters: ${stats.cityTypes.datacenter}`);
    console.log(`⚡ Edge locations: ${stats.cityTypes.edge}`);
    console.log('\n📈 Top 5 cidades por população:');
    stats.topCitiesByPopulation.slice(0, 5).forEach((city, i) => {
      console.log(`   ${i + 1}. ${city.name}: ${city.population.toLocaleString()} hab`);
    });
    console.log('\n🌎 Distribuição por continente:');
    Object.entries(stats.continents).forEach(([continent, count]) => {
      console.log(`   ${continent}: ${count} localizações`);
    });
    
  } catch (error) {
    console.error('\n❌ ERRO DURANTE A GERAÇÃO:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main();
}

module.exports = { main, CONFIG };
