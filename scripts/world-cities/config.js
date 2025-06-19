/**
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
        delimiter: '\t', // TSV para GeoNames
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
};