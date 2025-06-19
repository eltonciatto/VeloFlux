/**
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
        
        console.log(`✅ JSON gerado: ${formattedCities.length} cidades`);
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

module.exports = JsonGenerator;