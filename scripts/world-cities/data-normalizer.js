/**
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
        
        console.log(`✅ Normalização concluída: ${filteredCities.length} cidades`);
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
        const cleanName = cityName.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
        return `${country.toLowerCase()}-${this.slugify(cleanName)}`;
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
        return `${cityName}, ${countryName}`;
    }

    /**
     * Remover cidades duplicadas
     */
    removeDuplicates(cities) {
        const seen = new Set();
        return cities.filter(city => {
            const key = `${city.slug}`;
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

module.exports = DataNormalizer;