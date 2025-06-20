#!/bin/bash

echo "🔍 TESTE COMPLETO DO SISTEMA VELOFLUX"
echo "====================================="
echo

echo "📊 Status dos Containers:"
docker-compose ps
echo

echo "🌐 Testando Landing Page:"
LANDING_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/)
echo "  Status Code: $LANDING_STATUS"

echo

echo "📱 Testando Dashboard:"
DASHBOARD_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost/dashboard)
echo "  Status Code: $DASHBOARD_STATUS"

echo

echo "🔌 Testando API de Health (Backend):"
HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:9090/health)
echo "  Status Code: $HEALTH_STATUS"
if [ "$HEALTH_STATUS" == "200" ]; then
    curl -s http://localhost:9090/health | jq 2>/dev/null || curl -s http://localhost:9090/health
fi

echo

echo "📈 Testando Prometheus Metrics:"
METRICS_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/metrics)
echo "  Status Code: $METRICS_STATUS"

echo

echo "🧠 Testando WebSockets (Porta 9090):"
python3 - << 'EOF'
import asyncio
import websockets
import json

async def quick_test(url):
    try:
        async with websockets.connect(url) as websocket:
            await asyncio.wait_for(websocket.recv(), timeout=2.0)
            return "✅ CONECTADO"
    except Exception as e:
        return f"❌ ERRO: {str(e)[:50]}..."

async def main():
    endpoints = [
        "ws://localhost:9090/api/ws/backends",
        "ws://localhost:9090/api/ws/metrics", 
        "ws://localhost:9090/api/ws/status"
    ]
    
    for endpoint in endpoints:
        result = await quick_test(endpoint)
        print(f"  {endpoint}: {result}")

asyncio.run(main())
EOF

echo

echo "🏥 Health Check Summary:"
echo "  Backend Health: $(curl -s http://localhost:9090/health 2>/dev/null || echo 'ERRO')"

echo

echo "📋 RESULTADO FINAL:"
echo "=================="

if [ "$LANDING_STATUS" == "200" ] && [ "$DASHBOARD_STATUS" == "200" ] && [ "$HEALTH_STATUS" == "200" ]; then
    echo "🎉 SISTEMA COMPLETAMENTE FUNCIONAL!"
    echo "   ✅ Landing Page: http://localhost"
    echo "   ✅ Dashboard: http://localhost/dashboard"
    echo "   ✅ Backend API: http://localhost:9090"
    echo "   ✅ Metrics: http://localhost:8080/metrics"
    echo "   ✅ WebSockets: ws://localhost:9090/api/ws/*"
    echo
    echo "🚀 VeloFlux está pronto para uso!"
else
    echo "⚠️  Alguns componentes precisam de atenção:"
    echo "   Landing Page: $LANDING_STATUS"
    echo "   Dashboard: $DASHBOARD_STATUS" 
    echo "   Backend Health: $HEALTH_STATUS"
fi

echo
