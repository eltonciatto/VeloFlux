/**
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
        
        console.log(`📊 Total de cidades parseadas: ${cities.length}`);
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
        
        console.log(`✅ GeoNames: ${cities.length} cidades parseadas`);
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
        
        console.log(`✅ SimpleMaps: ${cities.length} cidades parseadas`);
        return cities;
    }
}

module.exports = CsvParser;