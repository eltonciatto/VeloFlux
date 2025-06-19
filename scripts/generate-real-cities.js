#!/usr/bin/env node

/**
 * Gerador avançado com dados reais
 * Este script baixa dados de fontes públicas e gera um arquivo world-cities.json expandido
 */

console.log('🌍 Iniciando World Cities Generator com Dados Reais...\n');

async function generateWithRealData() {
    try {
        // Importar módulos
        const RealDataSources = require('./world-cities/real-data-sources');
        const DataNormalizer = require('./world-cities/data-normalizer');
        const GeoEnricher = require('./world-cities/geo-enricher');
        const JsonGenerator = require('./world-cities/json-generator');
        const config = require('./world-cities/config');
        
        // 1. Download de dados reais
        console.log('📥 1. Baixando dados reais...');
        const realDataSources = new RealDataSources();
        const rawData = await realDataSources.downloadRealData();
        console.log('✅ Download concluído\n');
        
        // 2. Processar dados de países para mapeamento
        console.log('🏁 2. Processando dados de países...');
        const countryMap = createCountryMap(rawData.countries);
        console.log(`✅ ${Object.keys(countryMap).length} países mapeados\n`);
        
        // 3. Consolidar todas as cidades de diferentes fontes
        console.log('🏙️ 3. Consolidando cidades de múltiplas fontes...');
        let allCities = [];
        
        if (rawData.worldCities) {
            allCities.push(...rawData.worldCities.map(city => ({
                ...city,
                source: 'worldcities'
            })));
        }
        
        if (rawData.geoNames) {
            allCities.push(...rawData.geoNames.map(city => ({
                ...city,
                source: 'geonames',
                lat: city.lat || 0,
                lng: city.lng || 0
            })));
        }
        
        console.log(`📊 Total de cidades brutas: ${allCities.length}\n`);
        
        // 4. Normalização avançada
        console.log('🔧 4. Normalizando e limpando dados...');
        const normalizer = new DataNormalizer({
            ...config.normalization,
            countryMap // Passar mapeamento de países
        });
        
        const normalizedCities = await normalizeWithCountryMap(allCities, countryMap);
        console.log(`✅ Cidades normalizadas: ${normalizedCities.length}\n`);
        
        // 5. Enriquecimento com dados avançados
        console.log('🌍 5. Enriquecendo com dados geográficos...');
        const enricher = new GeoEnricher({
            ...config.enrichment,
            countryMap // Passar mapeamento para bandeiras corretas
        });
        
        const enrichedCities = await enrichWithCountryData(normalizedCities, countryMap);
        console.log(`✅ Cidades enriquecidas: ${enrichedCities.length}\n`);
        
        // 6. Geração com filtros avançados
        console.log('📝 6. Gerando JSON com filtros avançados...');
        const generator = new JsonGenerator(config.output);
        
        // Aplicar filtros de qualidade
        const qualityCities = enrichedCities.filter(city => 
            city.lat && city.lng && 
            city.lat !== 0 && city.lng !== 0 &&
            city.population >= 100000 // Mínimo de 100k habitantes
        );
        
        // Ordenar por população (maiores primeiro)
        qualityCities.sort((a, b) => (b.population || 0) - (a.population || 0));
        
        // Limitar cidades por país (máximo 10 por país)
        const citiesByCountry = {};
        const finalCities = [];
        
        for (const city of qualityCities) {
            const country = city.country;
            if (!citiesByCountry[country]) {
                citiesByCountry[country] = 0;
            }
            
            if (citiesByCountry[country] < 10) {
                finalCities.push(city);
                citiesByCountry[country]++;
            }
        }
        
        const formattedCities = await generator.generate(finalCities);
        console.log(`✅ JSON final: ${formattedCities.length} cidades\n`);
        
        // 7. Salvar arquivos
        console.log('💾 7. Salvando arquivos...');
        await saveFiles(formattedCities, citiesByCountry);
        
        console.log('\n🎉 Geração com dados reais concluída!');
        
        // Estatísticas finais
        printStatistics(formattedCities, citiesByCountry);
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        if (process.argv.includes('--debug')) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}

/**
 * Criar mapeamento de países
 */
function createCountryMap(countries) {
    const map = {};
    
    if (countries && Array.isArray(countries)) {
        for (const country of countries) {
            if (country.cca2) {
                map[country.cca2] = {
                    code: country.cca2,
                    name: country.name?.common || country.cca2,
                    flag: country.flag || '🏳️'
                };
            }
        }
    }
    
    // Adicionar países padrão se não existirem
    const defaults = {
        'US': { code: 'US', name: 'United States', flag: '🇺🇸' },
        'BR': { code: 'BR', name: 'Brazil', flag: '🇧🇷' },
        'CA': { code: 'CA', name: 'Canada', flag: '🇨🇦' },
        'GB': { code: 'GB', name: 'United Kingdom', flag: '🇬🇧' },
        'FR': { code: 'FR', name: 'France', flag: '🇫🇷' },
        'DE': { code: 'DE', name: 'Germany', flag: '🇩🇪' },
        'JP': { code: 'JP', name: 'Japan', flag: '🇯🇵' },
        'CN': { code: 'CN', name: 'China', flag: '🇨🇳' },
        'IN': { code: 'IN', name: 'India', flag: '🇮🇳' },
        'AU': { code: 'AU', name: 'Australia', flag: '🇦🇺' }
    };
    
    for (const [code, data] of Object.entries(defaults)) {
        if (!map[code]) {
            map[code] = data;
        }
    }
    
    return map;
}

/**
 * Normalizar com mapeamento de países
 */
async function normalizeWithCountryMap(cities, countryMap) {
    const slugify = require('slugify');
    const normalized = [];
    const seen = new Set();
    
    for (const city of cities) {
        if (!city.name || !city.country) continue;
        
        // Normalizar código do país
        let countryCode = city.country.toUpperCase();
        if (countryCode.length > 2) {
            // Tentar mapear nome do país para código
            const countryEntry = Object.values(countryMap).find(
                c => c.name.toLowerCase() === city.country.toLowerCase()
            );
            if (countryEntry) {
                countryCode = countryEntry.code;
            } else {
                continue; // Pular se não conseguir mapear
            }
        }
        
        // Verificar se país existe no mapeamento
        if (!countryMap[countryCode]) continue;
        
        // Gerar slug único
        const slug = `${countryCode.toLowerCase()}-${slugify(city.name, { lower: true, strict: true })}`;
        
        // Evitar duplicatas
        if (seen.has(slug)) continue;
        seen.add(slug);
        
        normalized.push({
            slug,
            name: city.name,
            country: countryCode,
            lat: city.lat || 0,
            lng: city.lng || 0,
            population: city.population || 0,
            capital: city.capital || false,
            source: city.source || 'unknown'
        });
    }
    
    return normalized;
}

/**
 * Enriquecer com dados de países
 */
async function enrichWithCountryData(cities, countryMap) {
    const enriched = [];
    
    for (const city of cities) {
        const countryData = countryMap[city.country];
        if (!countryData) continue;
        
        enriched.push({
            slug: city.slug,
            label: `${city.name}, ${countryData.name}`,
            country: city.country,
            flag: countryData.flag,
            lat: Math.round(city.lat * 10000) / 10000,
            lng: Math.round(city.lng * 10000) / 10000,
            timezone: getTimezoneForCountry(city.country),
            type: city.capital ? 'capital' : 'city',
            population: city.population
        });
    }
    
    return enriched;
}

/**
 * Obter timezone para país
 */
function getTimezoneForCountry(countryCode) {
    const timezones = {
        'US': 'EST', 'CA': 'EST', 'MX': 'CST',
        'BR': 'BRT', 'AR': 'ART', 'CL': 'CLT',
        'GB': 'GMT', 'FR': 'CET', 'DE': 'CET', 'IT': 'CET', 'ES': 'CET',
        'RU': 'MSK', 'CN': 'CST', 'JP': 'JST', 'KR': 'KST', 'IN': 'IST',
        'AU': 'AEDT', 'NZ': 'NZDT'
    };
    
    return timezones[countryCode] || 'UTC';
}

/**
 * Salvar arquivos
 */
async function saveFiles(cities, countriesStats) {
    const fs = require('fs').promises;
    const path = require('path');
    
    // Criar diretório output
    const outputDir = path.join(__dirname, 'output');
    await fs.mkdir(outputDir, { recursive: true });
    
    // Salvar JSON principal
    const mainPath = path.join(outputDir, 'world-cities-real.json');
    await fs.writeFile(mainPath, JSON.stringify(cities, null, 2));
    console.log(`✅ Arquivo principal: ${mainPath}`);
    
    // Salvar estatísticas
    const stats = {
        timestamp: new Date().toISOString(),
        totalCities: cities.length,
        totalCountries: Object.keys(countriesStats).length,
        citiesPerCountry: countriesStats,
        sources: ['worldcities', 'geonames', 'restcountries'],
        largestCities: cities.slice(0, 10).map(c => ({
            name: c.label,
            country: c.country,
            population: c.population
        }))
    };
    
    const statsPath = path.join(outputDir, 'real-generation-stats.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`📊 Estatísticas: ${statsPath}`);
    
    // Copiar para frontend se solicitado
    if (process.argv.includes('--deploy')) {
        const frontendPath = './frontend/src/data/world-cities.json';
        await fs.writeFile(frontendPath, JSON.stringify(cities, null, 2));
        console.log(`🚀 Deployed to: ${frontendPath}`);
    }
}

/**
 * Imprimir estatísticas
 */
function printStatistics(cities, countriesStats) {
    console.log('\n📊 ESTATÍSTICAS FINAIS:');
    console.log('='.repeat(40));
    console.log(`🏙️  Total de cidades: ${cities.length}`);
    console.log(`🏁 Total de países: ${Object.keys(countriesStats).length}`);
    console.log(`📍 Coordenadas válidas: ${cities.filter(c => c.lat && c.lng).length}`);
    console.log(`🏛️  Capitais: ${cities.filter(c => c.type === 'capital').length}`);
    
    console.log('\n🔝 Top 5 países por número de cidades:');
    const topCountries = Object.entries(countriesStats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5);
        
    topCountries.forEach(([country, count], index) => {
        console.log(`   ${index + 1}. ${country}: ${count} cidades`);
    });
    
    console.log('\n💡 Para fazer deploy: node scripts/generate-real-cities.js --deploy');
    console.log('='.repeat(40));
}

// Executar
generateWithRealData();
