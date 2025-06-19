#!/usr/bin/env node

/**
 * 🌍 GERADOR MODULAR DE CIDADES MUNDIAIS PARA VELOFLUX
 * 
 * Script completo que gera world-cities.json no formato exato do VeloFlux
 * Dividido em módulos para facilitar manutenção e atualizações
 * 
 * Dados gerados:
 * - slug: formato "country-city" normalizado
 * - label: "City, Country" legível
 * - country: código ISO 3166-1 alpha-2
 * - flag: emoji da bandeira do país
 * - lat/lng: coordenadas geográficas precisas
 * - timezone: fuso horário baseado em coordenadas
 * - type: sempre "city" para cidades
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import slugify from 'slugify';
import emojiFlags from 'emoji-flags';
import tzLookup from 'tz-lookup';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// 🌍 Configurações do gerador
const CONFIG = {
  OUTPUT_FILE: path.join(__dirname, '../frontend/src/data/world-cities.json'),
  MIN_POPULATION: 50000, // Mínimo de população para incluir
  MAX_CITIES_PER_COUNTRY: 100, // Máximo por país para controlar tamanho
  INCLUDE_DATACENTERS: true,
  INCLUDE_SMALL_COUNTRIES: true // Incluir capitais mesmo de países pequenos
};

// 🎯 Mapeamento manual de timezone para casos especiais
const TIMEZONE_OVERRIDES = {
  'US': {
    'EST': ['New York', 'Boston', 'Washington', 'Philadelphia', 'Atlanta', 'Miami', 'Jacksonville', 'Charlotte', 'Detroit', 'Columbus', 'Indianapolis', 'Nashville', 'Louisville', 'Baltimore', 'Virginia Beach', 'Raleigh', 'Tampa', 'Cleveland'],
    'CST': ['Chicago', 'Houston', 'San Antonio', 'Dallas', 'Austin', 'Fort Worth', 'Oklahoma City', 'Kansas City', 'New Orleans', 'Milwaukee', 'Tulsa', 'Arlington', 'Wichita', 'Minneapolis', 'Omaha'],
    'MST': ['Phoenix', 'Denver', 'El Paso', 'Tucson', 'Mesa', 'Colorado Springs', 'Albuquerque', 'Aurora'],
    'PST': ['Los Angeles', 'San Francisco', 'San Diego', 'San Jose', 'Seattle', 'Portland', 'Las Vegas', 'Sacramento', 'Long Beach', 'Oakland', 'Fresno', 'Bakersfield', 'Anaheim', 'Santa Ana'],
    'HST': ['Honolulu']
  },
  'CA': {
    'EST': ['Toronto', 'Montreal', 'Ottawa', 'Quebec City', 'Hamilton', 'London', 'Mississauga', 'Brampton', 'Markham', 'Vaughan', 'Gatineau', 'Longueuil', 'Laval'],
    'CST': ['Winnipeg'],
    'MST': ['Calgary', 'Edmonton'],
    'PST': ['Vancouver', 'Surrey', 'Burnaby'],
    'AST': ['Halifax']
  },
  'BR': {
    'BRT': ['São Paulo', 'Rio de Janeiro', 'Brasília', 'Salvador', 'Fortaleza', 'Belo Horizonte', 'Curitiba', 'Recife', 'Porto Alegre', 'Goiânia', 'Belém', 'Guarulhos', 'Campinas', 'São Luís', 'São Gonçalo', 'Maceió', 'Duque de Caxias', 'Natal'],
    'AMT': ['Manaus', 'Campo Grande']
  }
};

// 🏢 Datacenters conhecidos (AWS, GCP, Azure, Cloudflare)
const DATACENTERS = [
  // AWS Regions
  { slug: 'aws-us-east-1', label: 'AWS US East 1 (N. Virginia)', country: 'US', lat: 39.0458, lng: -77.5081, timezone: 'America/New_York', type: 'datacenter' },
  { slug: 'aws-us-east-2', label: 'AWS US East 2 (Ohio)', country: 'US', lat: 40.4173, lng: -82.9071, timezone: 'America/New_York', type: 'datacenter' },
  { slug: 'aws-us-west-1', label: 'AWS US West 1 (N. California)', country: 'US', lat: 37.4419, lng: -122.1430, timezone: 'America/Los_Angeles', type: 'datacenter' },
  { slug: 'aws-us-west-2', label: 'AWS US West 2 (Oregon)', country: 'US', lat: 45.5152, lng: -122.6784, timezone: 'America/Los_Angeles', type: 'datacenter' },
  { slug: 'aws-eu-west-1', label: 'AWS EU West 1 (Ireland)', country: 'IE', lat: 53.3498, lng: -6.2603, timezone: 'Europe/Dublin', type: 'datacenter' },
  { slug: 'aws-eu-west-2', label: 'AWS EU West 2 (London)', country: 'GB', lat: 51.5074, lng: -0.1278, timezone: 'Europe/London', type: 'datacenter' },
  { slug: 'aws-eu-central-1', label: 'AWS EU Central 1 (Frankfurt)', country: 'DE', lat: 50.1109, lng: 8.6821, timezone: 'Europe/Berlin', type: 'datacenter' },
  { slug: 'aws-ap-northeast-1', label: 'AWS AP Northeast 1 (Tokyo)', country: 'JP', lat: 35.6762, lng: 139.6503, timezone: 'Asia/Tokyo', type: 'datacenter' },
  { slug: 'aws-ap-southeast-1', label: 'AWS AP Southeast 1 (Singapore)', country: 'SG', lat: 1.3521, lng: 103.8198, timezone: 'Asia/Singapore', type: 'datacenter' },
  { slug: 'aws-ap-southeast-2', label: 'AWS AP Southeast 2 (Sydney)', country: 'AU', lat: -33.8688, lng: 151.2093, timezone: 'Australia/Sydney', type: 'datacenter' },
  { slug: 'aws-sa-east-1', label: 'AWS SA East 1 (São Paulo)', country: 'BR', lat: -23.5505, lng: -46.6333, timezone: 'America/Sao_Paulo', type: 'datacenter' },
  
  // Google Cloud Platform
  { slug: 'gcp-us-central1', label: 'GCP US Central 1 (Iowa)', country: 'US', lat: 41.2619, lng: -95.8608, timezone: 'America/Chicago', type: 'datacenter' },
  { slug: 'gcp-us-east1', label: 'GCP US East 1 (S. Carolina)', country: 'US', lat: 33.1960, lng: -79.9310, timezone: 'America/New_York', type: 'datacenter' },
  { slug: 'gcp-europe-west1', label: 'GCP Europe West 1 (Belgium)', country: 'BE', lat: 50.8503, lng: 4.3517, timezone: 'Europe/Brussels', type: 'datacenter' },
  { slug: 'gcp-asia-east1', label: 'GCP Asia East 1 (Taiwan)', country: 'TW', lat: 25.0330, lng: 121.5654, timezone: 'Asia/Taipei', type: 'datacenter' },
  
  // Microsoft Azure
  { slug: 'azure-east-us', label: 'Azure East US (Virginia)', country: 'US', lat: 37.3719, lng: -79.8164, timezone: 'America/New_York', type: 'datacenter' },
  { slug: 'azure-west-us', label: 'Azure West US (California)', country: 'US', lat: 37.7838, lng: -122.2471, timezone: 'America/Los_Angeles', type: 'datacenter' },
  { slug: 'azure-north-europe', label: 'Azure North Europe (Ireland)', country: 'IE', lat: 53.3498, lng: -6.2603, timezone: 'Europe/Dublin', type: 'datacenter' }
];

export default CONFIG;
