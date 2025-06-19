/**
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
        
        console.log(`✅ Enriquecimento concluído: ${enrichedCities.length} cidades`);
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

module.exports = GeoEnricher;