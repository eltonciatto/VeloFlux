const WebSocket = require('ws');

console.log('Testando WebSocket endpoints...\n');

const endpoints = [
    'ws://localhost:8080/api/ws/backends',
    'ws://localhost:8080/api/ws/metrics',
    'ws://localhost:8080/api/ws/status'
];

endpoints.forEach((endpoint, index) => {
    setTimeout(() => {
        console.log(`Testando: ${endpoint}`);
        const ws = new WebSocket(endpoint);
        
        ws.on('open', () => {
            console.log(`✅ ${endpoint} - CONECTADO`);
            setTimeout(() => ws.close(), 2000);
        });
        
        ws.on('message', (data) => {
            console.log(`📨 ${endpoint} - Dados recebidos:`, data.toString().substring(0, 100) + '...');
        });
        
        ws.on('error', (error) => {
            console.log(`❌ ${endpoint} - ERRO:`, error.message);
        });
        
        ws.on('close', () => {
            console.log(`🔌 ${endpoint} - DESCONECTADO\n`);
        });
    }, index * 1000);
});
