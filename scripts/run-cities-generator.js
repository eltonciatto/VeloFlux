#!/usr/bin/env node

/**
 * Script de execução simplificado do World Cities Generator
 */

console.log('🚀 Iniciando World Cities Generator Simplificado...\n');

async function run() {
    try {
        // Importar e executar o teste completo
        const testCompleteGeneration = require('./test-complete-generation');
        await testCompleteGeneration();
        
        // Salvar resultado na pasta output
        console.log('\n💾 Salvando arquivo final...');
        
        const fs = require('fs').promises;
        const path = require('path');
        
        // Ler dados atuais
        const currentData = require('../frontend/src/data/world-cities.json');
        
        // Criar diretório output se não existir
        const outputDir = path.join(__dirname, 'output');
        await fs.mkdir(outputDir, { recursive: true });
        
        // Salvar cópia na pasta output
        const outputPath = path.join(outputDir, 'world-cities.json');
        await fs.writeFile(outputPath, JSON.stringify(currentData, null, 2));
        
        console.log(`✅ Arquivo salvo em: ${outputPath}`);
        console.log(`📊 Total de cidades: ${currentData.length}`);
        
        // Gerar relatório
        const report = {
            timestamp: new Date().toISOString(),
            totalCities: currentData.length,
            countries: [...new Set(currentData.map(city => city.country))].length,
            cities: currentData,
            summary: {
                lastGenerated: new Date().toISOString(),
                version: '1.0.0',
                source: 'VeloFlux World Cities Generator'
            }
        };
        
        const reportPath = path.join(outputDir, 'generation-report.json');
        await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
        
        console.log(`📋 Relatório salvo em: ${reportPath}`);
        
        console.log('\n🎉 Geração concluída com sucesso!');
        
    } catch (error) {
        console.error('❌ Erro:', error.message);
        process.exit(1);
    }
}

run();
