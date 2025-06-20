#!/usr/bin/env node

/**
 * 🧪 Teste WebSocket para VeloFlux
 * 
 * Este script testa os endpoints WebSocket implementados
 * e demonstra como usá-los em uma aplicação real.
 */

const WebSocket = require('ws');
const http = require('http');

// Configuração
const VELOFLUX_HOST = process.env.VELOFLUX_HOST || 'localhost';
const VELOFLUX_PORT = process.env.VELOFLUX_PORT || '8080';
const BASE_URL = `http://${VELOFLUX_HOST}:${VELOFLUX_PORT}`;
const WS_BASE_URL = `ws://${VELOFLUX_HOST}:${VELOFLUX_PORT}`;

console.log('🔌 Iniciando teste WebSocket do VeloFlux...');
console.log(`📡 Host: ${VELOFLUX_HOST}:${VELOFLUX_PORT}`);
console.log('');

// Função para fazer requests HTTP
function makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: VELOFLUX_HOST,
            port: VELOFLUX_PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (error) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

// Função para testar conexão WebSocket
function testWebSocket(endpoint, name, duration = 5000) {
    return new Promise((resolve, reject) => {
        console.log(`🔍 Testando WebSocket ${name}...`);
        
        const ws = new WebSocket(`${WS_BASE_URL}/api/ws/${endpoint}`);
        let messagesReceived = 0;
        let connected = false;

        const timeout = setTimeout(() => {
            if (connected) {
                console.log(`✅ ${name}: Conectado e recebeu ${messagesReceived} mensagens`);
                ws.close();
                resolve({ success: true, messages: messagesReceived });
            } else {
                console.log(`❌ ${name}: Falha na conexão`);
                ws.close();
                resolve({ success: false, messages: 0 });
            }
        }, duration);

        ws.on('open', () => {
            console.log(`   📡 ${name}: Conectado`);
            connected = true;
        });

        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data);
                messagesReceived++;
                console.log(`   📨 ${name}: Recebida mensagem do tipo "${message.type}"`);
                
                // Log detalhado da primeira mensagem
                if (messagesReceived === 1) {
                    console.log(`   📋 ${name}: Dados:`, JSON.stringify(message, null, 2).substring(0, 200) + '...');
                }
            } catch (error) {
                console.log(`   ⚠️  ${name}: Erro ao parsear mensagem:`, error.message);
            }
        });

        ws.on('error', (error) => {
            console.log(`   ❌ ${name}: Erro WebSocket:`, error.message);
            clearTimeout(timeout);
            resolve({ success: false, messages: messagesReceived, error: error.message });
        });

        ws.on('close', () => {
            console.log(`   🔒 ${name}: Conexão fechada`);
        });
    });
}

// Função para testar controles WebSocket
async function testWebSocketControls() {
    console.log('🎛️  Testando controles WebSocket...');
    
    try {
        // Testar pause
        console.log('   ⏸️  Pausando atualizações de backends...');
        const pauseResult = await makeRequest('POST', '/api/ws/control', {
            action: 'pause',
            type: 'backends'
        });
        
        if (pauseResult.status === 200) {
            console.log('   ✅ Pause: OK');
        } else {
            console.log('   ❌ Pause: Falhou');
        }

        // Esperar um pouco
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Testar resume
        console.log('   ▶️  Retomando atualizações de backends...');
        const resumeResult = await makeRequest('POST', '/api/ws/control', {
            action: 'resume',
            type: 'backends'
        });
        
        if (resumeResult.status === 200) {
            console.log('   ✅ Resume: OK');
        } else {
            console.log('   ❌ Resume: Falhou');
        }

        // Testar force update
        console.log('   🔄 Forçando atualização...');
        const forceResult = await makeRequest('POST', '/api/ws/force-update', {
            type: 'all'
        });
        
        if (forceResult.status === 200) {
            console.log('   ✅ Force Update: OK');
        } else {
            console.log('   ❌ Force Update: Falhou');
        }

        return true;
    } catch (error) {
        console.log('   ❌ Erro nos controles:', error.message);
        return false;
    }
}

// Função principal
async function main() {
    const results = {
        total: 0,
        passed: 0,
        failed: 0
    };

    // Testar se o servidor está rodando
    console.log('🏥 Verificando se o servidor está rodando...');
    try {
        const healthCheck = await makeRequest('GET', '/health');
        if (healthCheck.status === 200) {
            console.log('✅ Servidor VeloFlux está rodando');
        } else {
            console.log('❌ Servidor não responde adequadamente');
            console.log('   Status:', healthCheck.status);
            return;
        }
    } catch (error) {
        console.log('❌ Não foi possível conectar ao servidor VeloFlux');
        console.log('   Erro:', error.message);
        console.log('');
        console.log('💡 Certifique-se de que o VeloFlux está rodando em', BASE_URL);
        return;
    }

    console.log('');

    // Testar WebSockets
    const wsTests = [
        { endpoint: 'backends', name: 'Backends' },
        { endpoint: 'metrics', name: 'Metrics' },
        { endpoint: 'status', name: 'Status' }
    ];

    for (const test of wsTests) {
        results.total++;
        const result = await testWebSocket(test.endpoint, test.name, 5000);
        if (result.success) {
            results.passed++;
        } else {
            results.failed++;
        }
        console.log('');
    }

    // Testar controles
    results.total++;
    const controlsOk = await testWebSocketControls();
    if (controlsOk) {
        results.passed++;
    } else {
        results.failed++;
    }

    // Resultados finais
    console.log('');
    console.log('📊 Resultados dos testes:');
    console.log(`✅ Passou: ${results.passed}/${results.total}`);
    console.log(`❌ Falhou: ${results.failed}/${results.total}`);
    console.log('');

    if (results.failed === 0) {
        console.log('🎉 Todos os testes WebSocket passaram!');
        console.log('');
        console.log('💡 Próximos passos:');
        console.log('   1. Integre os WebSockets ao seu frontend');
        console.log('   2. Configure reconexão automática');
        console.log('   3. Implemente tratamento de erros');
        console.log('   4. Monitore o número de clientes conectados');
        console.log('');
        console.log('📚 Documentação: docs/websocket_api.md');
        process.exit(0);
    } else {
        console.log('⚠️  Alguns testes falharam. Verifique a configuração do VeloFlux.');
        console.log('');
        console.log('🔧 Possíveis soluções:');
        console.log('   1. Verifique se o VeloFlux está rodando');
        console.log('   2. Confirme que a porta', VELOFLUX_PORT, 'está acessível');
        console.log('   3. Verifique os logs do servidor para erros');
        console.log('   4. Teste conectividade básica com curl ou browser');
        process.exit(1);
    }
}

// Executar se chamado diretamente
if (require.main === module) {
    main().catch(error => {
        console.error('❌ Erro fatal:', error);
        process.exit(1);
    });
}

module.exports = { testWebSocket, testWebSocketControls, makeRequest };
