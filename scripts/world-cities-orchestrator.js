#!/usr/bin/env node

/**
 * VeloFlux World Cities Generator - Orquestrador Principal
 * Sistema modular para geração do world-cities.json
 */

const path = require('path');
const fs = require('fs').promises;

class WorldCitiesOrchestrator {
    constructor() {
        this.startTime = Date.now();
        this.modules = {};
        this.stats = {
            totalProcessed: 0,
            totalGenerated: 0,
            errors: 0,
            warnings: 0
        };
    }

    /**
     * Carregar todos os módulos dinamicamente
     */
    async loadModules() {
        console.log('📦 Carregando módulos...');
        
        try {
            // Carregar configurações primeiro
            this.config = require('./world-cities/config');
            
            // Verificar se módulos existem antes de carregar
            const moduleFiles = [
                'data-sources',
                'csv-parser', 
                'data-normalizer',
                'geo-enricher',
                'json-generator',
                'validators',
                'utils'
            ];

            for (const moduleFile of moduleFiles) {
                const modulePath = `./world-cities/${moduleFile}`;
                try {
                    await fs.access(path.join(__dirname, `world-cities/${moduleFile}.js`));
                    this.modules[moduleFile] = require(modulePath);
                    console.log(`✅ Módulo carregado: ${moduleFile}`);
                } catch (error) {
                    console.log(`⚠️  Módulo não encontrado: ${moduleFile} - será criado`);
                    this.modules[moduleFile] = null;
                }
            }
            
        } catch (error) {
            console.error('❌ Erro ao carregar módulos:', error.message);
            throw error;
        }
    }

    /**
     * Executar pipeline completo
     */
    async run(options = {}) {
        try {
            console.log('🚀 Iniciando World Cities Generator...\n');
            
            // Carregar módulos
            await this.loadModules();
            
            // Verificar quais módulos estão disponíveis
            const availableModules = Object.entries(this.modules)
                .filter(([name, module]) => module !== null)
                .map(([name]) => name);
                
            console.log(`📋 Módulos disponíveis: ${availableModules.join(', ')}`);
            
            if (availableModules.length === 0) {
                console.log('⚠️  Nenhum módulo encontrado. Criando estrutura básica...');
                await this.createBasicStructure();
                return;
            }
            
            // Executar pipeline baseado nos módulos disponíveis
            await this.executePipeline(options);
            
            this.printSummary();
            
        } catch (error) {
            console.error('❌ Erro na execução:', error.message);
            if (options.debug) {
                console.error(error.stack);
            }
            process.exit(1);
        }
    }

    /**
     * Executar pipeline de processamento
     */
    async executePipeline(options) {
        console.log('\n🔄 Executando pipeline de processamento...\n');
        
        // Fase 1: Aquisição de dados
        let rawData = null;
        if (this.modules['data-sources']) {
            console.log('📥 Fase 1: Aquisição de dados...');
            const DataSources = this.modules['data-sources'];
            const dataSources = new DataSources(this.config?.dataSources);
            rawData = await dataSources.acquire();
            console.log('✅ Dados adquiridos\n');
        }
        
        // Fase 2: Parsing de dados
        let parsedData = rawData;
        if (this.modules['csv-parser'] && rawData) {
            console.log('📊 Fase 2: Parsing de dados...');
            const CsvParser = this.modules['csv-parser'];
            const parser = new CsvParser(this.config?.parsing);
            parsedData = await parser.parse(rawData);
            console.log('✅ Dados parseados\n');
        }
        
        // Fase 3: Normalização
        let normalizedData = parsedData;
        if (this.modules['data-normalizer'] && parsedData) {
            console.log('🔧 Fase 3: Normalização...');
            const DataNormalizer = this.modules['data-normalizer'];
            const normalizer = new DataNormalizer(this.config?.normalization);
            normalizedData = await normalizer.normalize(parsedData);
            this.stats.totalProcessed = normalizedData?.length || 0;
            console.log('✅ Dados normalizados\n');
        }
        
        // Fase 4: Enriquecimento
        let enrichedData = normalizedData;
        if (this.modules['geo-enricher'] && normalizedData) {
            console.log('🌍 Fase 4: Enriquecimento geográfico...');
            const GeoEnricher = this.modules['geo-enricher'];
            const enricher = new GeoEnricher(this.config?.enrichment);
            enrichedData = await enricher.enrich(normalizedData);
            console.log('✅ Dados enriquecidos\n');
        }
        
        // Fase 5: Geração do JSON
        let finalData = enrichedData;
        if (this.modules['json-generator'] && enrichedData) {
            console.log('📝 Fase 5: Geração do JSON...');
            const JsonGenerator = this.modules['json-generator'];
            const generator = new JsonGenerator(this.config?.output);
            finalData = await generator.generate(enrichedData);
            this.stats.totalGenerated = finalData?.length || 0;
            console.log('✅ JSON gerado\n');
        }
        
        // Fase 6: Validação
        if (this.modules['validators'] && finalData) {
            console.log('🔍 Fase 6: Validação...');
            const Validators = this.modules['validators'];
            const validator = new Validators(this.config?.validation);
            const results = await validator.validate(finalData);
            this.stats.warnings = results.warnings || 0;
            this.stats.errors = results.errors || 0;
            console.log('✅ Validação concluída\n');
        }
        
        // Salvar resultado final
        if (finalData) {
            await this.saveOutput(finalData, options);
        }
    }

    /**
     * Criar estrutura básica quando módulos não existem
     */
    async createBasicStructure() {
        console.log('🏗️  Criando estrutura básica de módulos...\n');
        
        // Verificar se config existe
        try {
            await fs.access(path.join(__dirname, 'world-cities/config.js'));
            console.log('✅ Arquivo de configuração já existe');
        } catch {
            console.log('⚠️  Arquivo de configuração não encontrado');
            console.log('📝 Execute: node scripts/create-modules.js para criar os módulos necessários');
        }
        
        // Listar próximos passos
        console.log('\n📋 Próximos passos:');
        console.log('1. Execute: node scripts/create-modules.js');
        console.log('2. Configure as fontes de dados em world-cities/config.js');
        console.log('3. Execute novamente: node scripts/generate-world-cities.js');
    }

    /**
     * Salvar output final
     */
    async saveOutput(data, options) {
        console.log('💾 Salvando arquivos de saída...');
        
        const outputDir = path.join(__dirname, 'output');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Salvar versão completa
        const outputPath = path.join(outputDir, 'world-cities.json');
        await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
        console.log(`✅ Arquivo salvo: ${outputPath}`);
        
        // Copiar para destino final se especificado
        if (this.config?.paths?.finalDestination) {
            const finalPath = this.config.paths.finalDestination;
            await fs.copyFile(outputPath, finalPath);
            console.log(`✅ Arquivo copiado para: ${finalPath}`);
        }
        
        // Salvar estatísticas
        await this.saveStatistics();
    }

    /**
     * Salvar estatísticas da execução
     */
    async saveStatistics() {
        const stats = {
            timestamp: new Date().toISOString(),
            duration: `${((Date.now() - this.startTime) / 1000).toFixed(2)}s`,
            ...this.stats,
            availableModules: Object.keys(this.modules).filter(name => this.modules[name] !== null)
        };
        
        const statsPath = path.join(__dirname, 'output/generation-stats.json');
        await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
        console.log(`📊 Estatísticas salvas: ${statsPath}`);
    }

    /**
     * Imprimir resumo da execução
     */
    printSummary() {
        const duration = ((Date.now() - this.startTime) / 1000).toFixed(2);
        
        console.log('\n' + '='.repeat(50));
        console.log('🎉 EXECUÇÃO CONCLUÍDA');
        console.log('='.repeat(50));
        console.log(`⏱️  Tempo total: ${duration}s`);
        console.log(`📊 Cidades processadas: ${this.stats.totalProcessed.toLocaleString()}`);
        console.log(`📝 Cidades geradas: ${this.stats.totalGenerated.toLocaleString()}`);
        console.log(`⚠️  Avisos: ${this.stats.warnings}`);
        console.log(`❌ Erros: ${this.stats.errors}`);
        console.log('='.repeat(50) + '\n');
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    const args = process.argv.slice(2);
    const options = {
        debug: args.includes('--debug'),
        dev: args.includes('--dev'),
        force: args.includes('--force')
    };
    
    const orchestrator = new WorldCitiesOrchestrator();
    orchestrator.run(options);
}

module.exports = WorldCitiesOrchestrator;
