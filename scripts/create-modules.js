#!/usr/bin/env node

/**
 * Script para criar todos os módulos necessários do World Cities Generator
 * Este script cria a estrutura completa de forma modular
 */

const fs = require('fs').promises;
const path = require('path');

class ModuleGenerator {
    constructor() {
        this.baseDir = path.join(__dirname, 'world-cities');
        this.modules = [
            'config',
            'data-sources', 
            'csv-parser',
            'data-normalizer',
            'geo-enricher',
            'json-generator',
            'validators',
            'utils'
        ];
    }

    async createAllModules() {
        console.log('🏗️  Criando estrutura modular do World Cities Generator...\n');
        
        // Criar diretório base
        await fs.mkdir(this.baseDir, { recursive: true });
        
        // Criar cada módulo
        for (const moduleName of this.modules) {
            await this.createModule(moduleName);
        }
        
        console.log('\n✅ Todos os módulos foram criados com sucesso!');
        console.log('\n📋 Próximos passos:');
        console.log('1. Configure as fontes de dados em world-cities/config.js');
        console.log('2. Execute: node scripts/world-cities-orchestrator.js');
        console.log('3. (Opcional) Instale dependências: npm install csv-parse slugify emoji-flags tz-lookup');
    }

    async createModule(moduleName) {
        const filePath = path.join(this.baseDir, `${moduleName}.js`);
        
        try {
            await fs.access(filePath);
            console.log(`⚠️  Módulo já existe: ${moduleName}`);
            return;
        } catch {
            // Arquivo não existe, criar
        }
        
        const content = this.getModuleContent(moduleName);
        await fs.writeFile(filePath, content);
        console.log(`✅ Módulo criado: ${moduleName}`);
    }

    getModuleContent(moduleName) {
        switch (moduleName) {
            case 'config':
                return this.getConfigContent();
            case 'data-sources':
                return this.getDataSourcesContent();
            case 'csv-parser':
                return this.getCsvParserContent();
            case 'data-normalizer':
                return this.getDataNormalizerContent();
            case 'geo-enricher':
                return this.getGeoEnricherContent();
            case 'json-generator':
                return this.getJsonGeneratorContent();
            case 'validators':
                return this.getValidatorsContent();
            case 'utils':
                return this.getUtilsContent();
            default:
                return this.getDefaultModuleContent(moduleName);
        }
    }

    getConfigContent() {
        return `/**
 * Configurações centralizadas do World Cities Generator
 */

module.exports = {
    // Versão do gerador
    version: '1.0.0',
    
    // Modo debug
    debug: process.env.NODE_ENV === 'development',
    
    // Caminhos de arquivos
    paths: {
        data: './scripts/data',
        downloads: './scripts/data/downloads',
        output: './scripts/output',
        reports: './scripts/output/reports',
        temp: './scripts/temp',
        finalDestination: './frontend/src/data/world-cities.json'
    },
    
    // Configuração de fontes de dados
    dataSources: {
        geoNames: {
            enabled: true,
            urls: {
                cities15000: 'http://download.geonames.org/export/dump/cities15000.zip',
                cities5000: 'http://download.geonames.org/export/dump/cities5000.zip',
                countryInfo: 'http://download.geonames.org/export/dump/countryInfo.txt'
            },
            cache: true,
            timeout: 30000
        },
        simpleMaps: {
            enabled: true,
            url: 'https://simplemaps.com/data/world-cities',
            cache: true,
            timeout: 30000
        }
    },
    
    // Configuração de parsing
    parsing: {
        encoding: 'utf8',
        delimiter: '\\t', // TSV para GeoNames
        skipEmptyLines: true,
        skipLinesWithError: true
    },
    
    // Configuração de normalização
    normalization: {
        minPopulation: 5000,
        maxCitiesPerCountry: 100,
        slugOptions: {
            lower: true,
            strict: true,
            remove: /[*+~.()'"!:@]/g
        }
    },
    
    // Configuração de enriquecimento
    enrichment: {
        addFlags: true,
        addTimezones: true,
        addTypes: true,
        includeConnectivity: false,
        includeDatacenters: true
    },
    
    // Configuração de output
    output: {
        format: 'json',
        indent: 2,
        sortBy: 'country',
        filters: {
            minPopulation: 5000,
            validCoordinates: true,
            validTimezone: true
        },
        variants: {
            production: true,
            development: true,
            minimal: false
        }
    },
    
    // Configuração de validação
    validation: {
        schema: true,
        coordinates: true,
        duplicates: true,
        timezone: true,
        requiredFields: ['slug', 'label', 'country', 'flag', 'lat', 'lng', 'timezone', 'type']
    },
    
    // Configuração de limpeza
    cleanup: {
        tempFiles: true,
        downloads: false // Manter para cache
    }
};`;
    }

    getDataSourcesContent() {
        return `/**
 * Gerenciamento de fontes de dados externas
 */

const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const http = require('http');

class DataSources {
    constructor(config = {}) {
        this.config = config;
        this.cache = new Map();
    }

    /**
     * Adquirir todos os dados necessários
     */
    async acquire() {
        console.log('📥 Adquirindo dados de fontes externas...');
        
        const data = {};
        
        // GeoNames
        if (this.config.geoNames?.enabled) {
            data.geoNames = await this.downloadGeoNames();
        }
        
        // SimpleMaps
        if (this.config.simpleMaps?.enabled) {
            data.simpleMaps = await this.downloadSimpleMaps();
        }
        
        return data;
    }

    /**
     * Download de dados do GeoNames
     */
    async downloadGeoNames() {
        console.log('🌍 Baixando dados do GeoNames...');
        
        // Por enquanto, retornar dados mock para desenvolvimento
        return this.getMockGeoNamesData();
    }

    /**
     * Download de dados do SimpleMaps
     */
    async downloadSimpleMaps() {
        console.log('🗺️  Baixando dados do SimpleMaps...');
        
        // Por enquanto, retornar dados mock para desenvolvimento
        return this.getMockSimpleMapsData();
    }

    /**
     * Dados mock do GeoNames para desenvolvimento
     */
    getMockGeoNamesData() {
        return [
            ['3439525', 'New York City', 'New York City', '', 'US', '', '40.7128', '-74.0060', '', '', '8398748'],
            ['3435910', 'Los Angeles', 'Los Angeles', '', 'US', '', '34.0522', '-118.2437', '', '', '3971883'],
            ['3448439', 'São Paulo', 'Sao Paulo', '', 'BR', '', '-23.5505', '-46.6333', '', '', '12325232']
        ];
    }

    /**
     * Dados mock do SimpleMaps para desenvolvimento
     */
    getMockSimpleMapsData() {
        return [
            { city: 'New York', country: 'United States', iso2: 'US', lat: 40.7128, lng: -74.0060, population: 8398748 },
            { city: 'Los Angeles', country: 'United States', iso2: 'US', lat: 34.0522, lng: -118.2437, population: 3971883 },
            { city: 'São Paulo', country: 'Brazil', iso2: 'BR', lat: -23.5505, lng: -46.6333, population: 12325232 }
        ];
    }
}

module.exports = DataSources;`;
    }

    getCsvParserContent() {
        return `/**
 * Parser de arquivos CSV/TSV
 */

class CsvParser {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Parse de dados de múltiplas fontes
     */
    async parse(rawData) {
        console.log('📊 Fazendo parse dos dados...');
        
        const cities = [];
        
        // Parse GeoNames
        if (rawData.geoNames) {
            const geoNamesCities = await this.parseGeoNames(rawData.geoNames);
            cities.push(...geoNamesCities);
        }
        
        // Parse SimpleMaps
        if (rawData.simpleMaps) {
            const simpleMaps = await this.parseSimpleMaps(rawData.simpleMaps);
            cities.push(...simpleMaps);
        }
        
        console.log(\`📊 Total de cidades parseadas: \${cities.length}\`);
        return cities;
    }

    /**
     * Parse de dados do GeoNames (formato TSV)
     */
    async parseGeoNames(data) {
        console.log('🌍 Parseando dados do GeoNames...');
        
        const cities = [];
        
        for (const row of data) {
            if (Array.isArray(row) && row.length >= 11) {
                cities.push({
                    source: 'geonames',
                    id: row[0],
                    name: row[1],
                    asciiName: row[2],
                    country: row[4],
                    lat: parseFloat(row[6]),
                    lng: parseFloat(row[7]),
                    population: parseInt(row[10]) || 0
                });
            }
        }
        
        console.log(\`✅ GeoNames: \${cities.length} cidades parseadas\`);
        return cities;
    }

    /**
     * Parse de dados do SimpleMaps (formato CSV)
     */
    async parseSimpleMaps(data) {
        console.log('🗺️  Parseando dados do SimpleMaps...');
        
        const cities = [];
        
        for (const row of data) {
            if (row.city && row.country) {
                cities.push({
                    source: 'simplemaps',
                    name: row.city,
                    country: row.iso2,
                    lat: parseFloat(row.lat),
                    lng: parseFloat(row.lng),
                    population: parseInt(row.population) || 0
                });
            }
        }
        
        console.log(\`✅ SimpleMaps: \${cities.length} cidades parseadas\`);
        return cities;
    }
}

module.exports = CsvParser;`;
    }

    getDataNormalizerContent() {
        return `/**
 * Normalização e limpeza de dados
 */

class DataNormalizer {
    constructor(config = {}) {
        this.config = config;
        this.slugify = this.createSlugifyFunction();
    }

    /**
     * Normalizar todos os dados
     */
    async normalize(cities) {
        console.log('🔧 Normalizando dados...');
        
        // Filtrar cidades válidas
        const validCities = cities.filter(city => this.isValidCity(city));
        
        // Normalizar cada cidade
        const normalizedCities = validCities.map(city => this.normalizeCity(city));
        
        // Remover duplicatas
        const uniqueCities = this.removeDuplicates(normalizedCities);
        
        // Aplicar filtros de população
        const filteredCities = this.applyFilters(uniqueCities);
        
        console.log(\`✅ Normalização concluída: \${filteredCities.length} cidades\`);
        return filteredCities;
    }

    /**
     * Verificar se cidade é válida
     */
    isValidCity(city) {
        return city.name && 
               city.country && 
               typeof city.lat === 'number' && 
               typeof city.lng === 'number' &&
               city.lat >= -90 && city.lat <= 90 &&
               city.lng >= -180 && city.lng <= 180;
    }

    /**
     * Normalizar uma cidade individual
     */
    normalizeCity(city) {
        const slug = this.generateSlug(city.name, city.country);
        
        return {
            slug,
            label: this.formatLabel(city.name, city.country),
            country: city.country.toUpperCase(),
            lat: Math.round(city.lat * 10000) / 10000, // 4 casas decimais
            lng: Math.round(city.lng * 10000) / 10000,
            population: city.population || 0,
            source: city.source || 'unknown'
        };
    }

    /**
     * Gerar slug único
     */
    generateSlug(cityName, country) {
        const cleanName = cityName.replace(/[^a-zA-Z0-9\\s-]/g, '').trim();
        return \`\${country.toLowerCase()}-\${this.slugify(cleanName)}\`;
    }

    /**
     * Formatar label da cidade
     */
    formatLabel(cityName, country) {
        // Mapear códigos de país para nomes
        const countryNames = {
            'US': 'USA',
            'BR': 'Brazil',
            'CA': 'Canada',
            'MX': 'Mexico',
            'GB': 'United Kingdom',
            'FR': 'France',
            'DE': 'Germany',
            'IT': 'Italy',
            'ES': 'Spain',
            'JP': 'Japan',
            'CN': 'China',
            'IN': 'India',
            'AU': 'Australia'
        };
        
        const countryName = countryNames[country] || country;
        return \`\${cityName}, \${countryName}\`;
    }

    /**
     * Remover cidades duplicadas
     */
    removeDuplicates(cities) {
        const seen = new Set();
        return cities.filter(city => {
            const key = \`\${city.slug}\`;
            if (seen.has(key)) {
                return false;
            }
            seen.add(key);
            return true;
        });
    }

    /**
     * Aplicar filtros de qualidade
     */
    applyFilters(cities) {
        return cities.filter(city => {
            // Filtro de população mínima
            if (this.config.minPopulation && city.population < this.config.minPopulation) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Criar função de slugify
     */
    createSlugifyFunction() {
        try {
            const slugify = require('slugify');
            return (text) => slugify(text, this.config.slugOptions || { lower: true, strict: true });
        } catch {
            // Fallback se slugify não estiver instalado
            return (text) => text.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/^-|-$/g, '');
        }
    }
}

module.exports = DataNormalizer;`;
    }

    getGeoEnricherContent() {
        return `/**
 * Enriquecimento com dados geográficos
 */

class GeoEnricher {
    constructor(config = {}) {
        this.config = config;
        this.flagMap = this.createFlagMap();
        this.timezoneMap = this.createTimezoneMap();
    }

    /**
     * Enriquecer dados de todas as cidades
     */
    async enrich(cities) {
        console.log('🌍 Enriquecendo dados geográficos...');
        
        const enrichedCities = cities.map(city => this.enrichCity(city));
        
        console.log(\`✅ Enriquecimento concluído: \${enrichedCities.length} cidades\`);
        return enrichedCities;
    }

    /**
     * Enriquecer uma cidade individual
     */
    enrichCity(city) {
        const enriched = { ...city };
        
        // Adicionar bandeira
        if (this.config.addFlags) {
            enriched.flag = this.getFlag(city.country);
        }
        
        // Adicionar timezone
        if (this.config.addTimezones) {
            enriched.timezone = this.getTimezone(city.lat, city.lng, city.country);
        }
        
        // Adicionar tipo
        if (this.config.addTypes) {
            enriched.type = this.getType(city);
        }
        
        // Remover campos internos
        delete enriched.source;
        delete enriched.population;
        
        return enriched;
    }

    /**
     * Obter emoji da bandeira do país
     */
    getFlag(countryCode) {
        return this.flagMap[countryCode] || '🏳️';
    }

    /**
     * Obter timezone baseado em coordenadas e país
     */
    getTimezone(lat, lng, country) {
        // Mapeamento básico de timezones por país/região
        const timezones = this.timezoneMap[country];
        
        if (!timezones) {
            return 'UTC';
        }
        
        if (typeof timezones === 'string') {
            return timezones;
        }
        
        // Para países com múltiplos timezones, usar lógica básica baseada em longitude
        if (Array.isArray(timezones)) {
            return timezones[0]; // Usar primeiro timezone como padrão
        }
        
        return 'UTC';
    }

    /**
     * Determinar tipo de localização
     */
    getType(city) {
        // Por enquanto, todas são cidades normais
        // Futuramente pode incluir lógica para datacenters, edge locations, etc.
        return 'city';
    }

    /**
     * Criar mapeamento de bandeiras
     */
    createFlagMap() {
        return {
            'US': '🇺🇸', 'CA': '🇨🇦', 'MX': '🇲🇽', 'BR': '🇧🇷', 'AR': '🇦🇷',
            'GB': '🇬🇧', 'FR': '🇫🇷', 'DE': '🇩🇪', 'IT': '🇮🇹', 'ES': '🇪🇸',
            'RU': '🇷🇺', 'CN': '🇨🇳', 'JP': '🇯🇵', 'KR': '🇰🇷', 'IN': '🇮🇳',
            'AU': '🇦🇺', 'NZ': '🇳🇿', 'ZA': '🇿🇦', 'EG': '🇪🇬', 'NG': '🇳🇬'
        };
    }

    /**
     * Criar mapeamento de timezones
     */
    createTimezoneMap() {
        return {
            'US': ['EST', 'CST', 'MST', 'PST'],
            'CA': ['EST', 'CST', 'MST', 'PST'],
            'MX': 'CST',
            'BR': 'BRT',
            'AR': 'ART',
            'GB': 'GMT',
            'FR': 'CET',
            'DE': 'CET',
            'IT': 'CET',
            'ES': 'CET',
            'RU': 'MSK',
            'CN': 'CST',
            'JP': 'JST',
            'KR': 'KST',
            'IN': 'IST',
            'AU': 'AEDT',
            'NZ': 'NZDT'
        };
    }
}

module.exports = GeoEnricher;`;
    }

    getJsonGeneratorContent() {
        return `/**
 * Geração do arquivo JSON final
 */

class JsonGenerator {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Gerar JSON final
     */
    async generate(cities) {
        console.log('📝 Gerando JSON final...');
        
        // Aplicar filtros finais
        const filteredCities = this.applyFinalFilters(cities);
        
        // Ordenar cidades
        const sortedCities = this.sortCities(filteredCities);
        
        // Formatar para o formato final
        const formattedCities = this.formatCities(sortedCities);
        
        console.log(\`✅ JSON gerado: \${formattedCities.length} cidades\`);
        return formattedCities;
    }

    /**
     * Aplicar filtros finais
     */
    applyFinalFilters(cities) {
        return cities.filter(city => {
            // Verificar campos obrigatórios
            const requiredFields = ['slug', 'label', 'country', 'lat', 'lng'];
            for (const field of requiredFields) {
                if (!city[field]) {
                    return false;
                }
            }
            
            // Verificar coordenadas válidas
            if (city.lat < -90 || city.lat > 90 || city.lng < -180 || city.lng > 180) {
                return false;
            }
            
            return true;
        });
    }

    /**
     * Ordenar cidades
     */
    sortCities(cities) {
        return cities.sort((a, b) => {
            // Ordenar por país, depois por nome
            if (a.country !== b.country) {
                return a.country.localeCompare(b.country);
            }
            return a.label.localeCompare(b.label);
        });
    }

    /**
     * Formatar para o formato final do VeloFlux
     */
    formatCities(cities) {
        return cities.map(city => ({
            slug: city.slug,
            label: city.label,
            country: city.country,
            flag: city.flag || '🏳️',
            lat: city.lat,
            lng: city.lng,
            timezone: city.timezone || 'UTC',
            type: city.type || 'city'
        }));
    }
}

module.exports = JsonGenerator;`;
    }

    getValidatorsContent() {
        return `/**
 * Validação de qualidade dos dados
 */

class Validators {
    constructor(config = {}) {
        this.config = config;
    }

    /**
     * Validar dados finais
     */
    async validate(cities) {
        console.log('🔍 Validando qualidade dos dados...');
        
        const results = {
            total: cities.length,
            errors: 0,
            warnings: 0,
            issues: []
        };
        
        // Validar schema
        const schemaResults = this.validateSchema(cities);
        results.errors += schemaResults.errors;
        results.warnings += schemaResults.warnings;
        results.issues.push(...schemaResults.issues);
        
        // Validar coordenadas
        const coordinateResults = this.validateCoordinates(cities);
        results.errors += coordinateResults.errors;
        results.warnings += coordinateResults.warnings;
        results.issues.push(...coordinateResults.issues);
        
        // Validar duplicatas
        const duplicateResults = this.validateDuplicates(cities);
        results.errors += duplicateResults.errors;
        results.warnings += duplicateResults.warnings;
        results.issues.push(...duplicateResults.issues);
        
        this.logValidationResults(results);
        return results;
    }

    /**
     * Validar schema/estrutura
     */
    validateSchema(cities) {
        const results = { errors: 0, warnings: 0, issues: [] };
        const requiredFields = this.config.requiredFields || ['slug', 'label', 'country', 'lat', 'lng'];
        
        cities.forEach((city, index) => {
            for (const field of requiredFields) {
                if (!city[field]) {
                    results.errors++;
                    results.issues.push(\`Cidade \${index}: Campo obrigatório ausente: \${field}\`);
                }
            }
        });
        
        return results;
    }

    /**
     * Validar coordenadas geográficas
     */
    validateCoordinates(cities) {
        const results = { errors: 0, warnings: 0, issues: [] };
        
        cities.forEach((city, index) => {
            if (typeof city.lat !== 'number' || typeof city.lng !== 'number') {
                results.errors++;
                results.issues.push(\`Cidade \${index}: Coordenadas inválidas: lat=\${city.lat}, lng=\${city.lng}\`);
            } else if (city.lat < -90 || city.lat > 90 || city.lng < -180 || city.lng > 180) {
                results.errors++;
                results.issues.push(\`Cidade \${index}: Coordenadas fora dos limites válidos\`);
            }
        });
        
        return results;
    }

    /**
     * Validar duplicatas
     */
    validateDuplicates(cities) {
        const results = { errors: 0, warnings: 0, issues: [] };
        const seen = new Set();
        
        cities.forEach((city, index) => {
            if (seen.has(city.slug)) {
                results.warnings++;
                results.issues.push(\`Cidade \${index}: Slug duplicado: \${city.slug}\`);
            } else {
                seen.add(city.slug);
            }
        });
        
        return results;
    }

    /**
     * Log dos resultados da validação
     */
    logValidationResults(results) {
        console.log(\`📊 Validação concluída:\`);
        console.log(\`   Total: \${results.total} cidades\`);
        console.log(\`   ❌ Erros: \${results.errors}\`);
        console.log(\`   ⚠️  Avisos: \${results.warnings}\`);
        
        if (results.issues.length > 0 && results.issues.length <= 10) {
            console.log('\\n📋 Problemas encontrados:');
            results.issues.slice(0, 10).forEach(issue => {
                console.log(\`   - \${issue}\`);
            });
        }
    }
}

module.exports = Validators;`;
    }

    getUtilsContent() {
        return `/**
 * Utilitários comuns
 */

class Logger {
    constructor(name = 'Logger') {
        this.name = name;
        this.level = 'info';
    }

    static setLevel(level) {
        Logger.globalLevel = level;
    }

    info(message, ...args) {
        console.log(\`ℹ️  [\${this.name}] \${message}\`, ...args);
    }

    success(message, ...args) {
        console.log(\`✅ [\${this.name}] \${message}\`, ...args);
    }

    warn(message, ...args) {
        console.log(\`⚠️  [\${this.name}] \${message}\`, ...args);
    }

    error(message, ...args) {
        console.error(\`❌ [\${this.name}] \${message}\`, ...args);
    }

    debug(message, ...args) {
        if (this.level === 'debug' || Logger.globalLevel === 'debug') {
            console.log(\`🐛 [\${this.name}] \${message}\`, ...args);
        }
    }
}

class FileUtils {
    static async ensureDirectory(dirPath) {
        const fs = require('fs').promises;
        await fs.mkdir(dirPath, { recursive: true });
    }

    static async fileExists(filePath) {
        const fs = require('fs').promises;
        try {
            await fs.access(filePath);
            return true;
        } catch {
            return false;
        }
    }
}

class StringUtils {
    static cleanString(str) {
        return str.replace(/[^a-zA-Z0-9\\s-]/g, '').trim();
    }

    static capitalizeWords(str) {
        return str.replace(/\\b\\w/g, l => l.toUpperCase());
    }
}

module.exports = {
    Logger,
    FileUtils,
    StringUtils
};`;
    }

    getDefaultModuleContent(moduleName) {
        return `/**
 * Módulo: ${moduleName}
 * TODO: Implementar funcionalidades específicas
 */

class ${this.capitalize(moduleName.replace('-', ''))} {
    constructor(config = {}) {
        this.config = config;
    }

    async process(data) {
        console.log(\`🔧 Processando com módulo: ${moduleName}\`);
        
        // TODO: Implementar lógica específica
        
        return data;
    }
}

module.exports = ${this.capitalize(moduleName.replace('-', ''))};`;
    }

    capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const generator = new ModuleGenerator();
    generator.createAllModules();
}

module.exports = ModuleGenerator;
