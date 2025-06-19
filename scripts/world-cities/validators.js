/**
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
                    results.issues.push(`Cidade ${index}: Campo obrigatório ausente: ${field}`);
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
                results.issues.push(`Cidade ${index}: Coordenadas inválidas: lat=${city.lat}, lng=${city.lng}`);
            } else if (city.lat < -90 || city.lat > 90 || city.lng < -180 || city.lng > 180) {
                results.errors++;
                results.issues.push(`Cidade ${index}: Coordenadas fora dos limites válidos`);
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
                results.issues.push(`Cidade ${index}: Slug duplicado: ${city.slug}`);
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
        console.log(`📊 Validação concluída:`);
        console.log(`   Total: ${results.total} cidades`);
        console.log(`   ❌ Erros: ${results.errors}`);
        console.log(`   ⚠️  Avisos: ${results.warnings}`);
        
        if (results.issues.length > 0 && results.issues.length <= 10) {
            console.log('\n📋 Problemas encontrados:');
            results.issues.slice(0, 10).forEach(issue => {
                console.log(`   - ${issue}`);
            });
        }
    }
}

module.exports = Validators;