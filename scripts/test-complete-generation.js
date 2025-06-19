#!/usr/bin/env node

/**
 * Teste completo do World Cities Generator
 * Valida se o sistema gera o formato correto
 */

async function testCompleteGeneration() {
    console.log('🚀 Iniciando teste completo do World Cities Generator...\n');

    try {
        // Carregar módulos
        const config = require('./world-cities/config');
        const DataSources = require('./world-cities/data-sources');
        const CsvParser = require('./world-cities/csv-parser');
        const DataNormalizer = require('./world-cities/data-normalizer');
        const GeoEnricher = require('./world-cities/geo-enricher');
        const JsonGenerator = require('./world-cities/json-generator');
        const Validators = require('./world-cities/validators');
        
        console.log('✅ Todos os módulos carregados com sucesso\n');

        // Pipeline completo
        console.log('🔄 Executando pipeline completo...\n');

        // 1. Aquisição de dados
        console.log('📥 1. Adquirindo dados...');
        const dataSources = new DataSources(config.dataSources);
        const rawData = await dataSources.acquire();
        console.log(`   📊 Fontes de dados: ${Object.keys(rawData).join(', ')}\n`);

        // 2. Parse
        console.log('📊 2. Fazendo parse dos dados...');
        const parser = new CsvParser(config.parsing);
        const parsedData = await parser.parse(rawData);
        console.log(`   📋 Cidades parseadas: ${parsedData.length}\n`);

        // 3. Normalização
        console.log('🔧 3. Normalizando dados...');
        const normalizer = new DataNormalizer(config.normalization);
        const normalizedData = await normalizer.normalize(parsedData);
        console.log(`   🏙️  Cidades normalizadas: ${normalizedData.length}\n`);

        // 4. Enriquecimento
        console.log('🌍 4. Enriquecendo dados geográficos...');
        const enricher = new GeoEnricher(config.enrichment);
        const enrichedData = await enricher.enrich(normalizedData);
        console.log(`   ✨ Cidades enriquecidas: ${enrichedData.length}\n`);

        // 5. Geração JSON
        console.log('📝 5. Gerando JSON final...');
        const generator = new JsonGenerator(config.output);
        const finalData = await generator.generate(enrichedData);
        console.log(`   📄 Cidades no JSON final: ${finalData.length}\n`);

        // 6. Validação
        console.log('🔍 6. Validando resultado...');
        const validator = new Validators(config.validation);
        const validationResults = await validator.validate(finalData);
        console.log(`   ✅ Validação concluída\n`);

        // 7. Comparação com formato esperado
        console.log('⚖️  7. Comparando com formato esperado...');
        await compareWithExpectedFormat(finalData);

        console.log('\n🎉 Teste completo concluído com sucesso!\n');
        
        // Mostrar exemplo de cidade gerada
        console.log('📋 Exemplo de cidade gerada:');
        console.log(JSON.stringify(finalData[0], null, 2));

    } catch (error) {
        console.error('\n❌ Erro durante o teste:', error.message);
        if (process.argv.includes('--debug')) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

/**
 * Comparar com o formato esperado do VeloFlux
 */
async function compareWithExpectedFormat(generatedData) {
    const fs = require('fs').promises;
    
    try {
        // Ler arquivo atual do VeloFlux
        const currentFile = await fs.readFile('./frontend/src/data/world-cities.json', 'utf8');
        const currentData = JSON.parse(currentFile);
        
        console.log(`   📊 Arquivo atual: ${currentData.length} cidades`);
        console.log(`   🆕 Dados gerados: ${generatedData.length} cidades`);
        
        // Verificar se o formato está correto
        const expectedFields = ['slug', 'label', 'country', 'flag', 'lat', 'lng', 'timezone', 'type'];
        
        let formatValid = true;
        for (const city of generatedData.slice(0, 5)) { // Verificar primeiras 5
            for (const field of expectedFields) {
                if (!(field in city)) {
                    console.log(`   ❌ Campo ausente: ${field} na cidade ${city.slug || 'unknown'}`);
                    formatValid = false;
                }
            }
        }
        
        if (formatValid) {
            console.log('   ✅ Formato dos dados está correto');
        }
        
        // Verificar se há duplicação com dados existentes
        const existingSlugs = new Set(currentData.map(city => city.slug));
        const newCities = generatedData.filter(city => !existingSlugs.has(city.slug));
        
        console.log(`   🆕 Cidades novas que seriam adicionadas: ${newCities.length}`);
        
    } catch (error) {
        console.log(`   ⚠️  Não foi possível comparar com arquivo existente: ${error.message}`);
    }
}

// Executar teste
if (require.main === module) {
    testCompleteGeneration();
}

module.exports = testCompleteGeneration;
