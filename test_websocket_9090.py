#!/usr/bin/env python3
import asyncio
import websockets
import json

async def test_websocket(url):
    try:
        print(f"Testando: {url}")
        async with websockets.connect(url) as websocket:
            print(f"✅ {url} - CONECTADO")
            
            # Aguarda uma mensagem por 5 segundos
            try:
                message = await asyncio.wait_for(websocket.recv(), timeout=5.0)
                print(f"📨 {url} - Dados recebidos: {str(message)[:100]}...")
            except asyncio.TimeoutError:
                print(f"⏰ {url} - Timeout (sem dados recebidos)")
            
            print(f"🔌 {url} - DESCONECTADO\n")
            
    except Exception as e:
        print(f"❌ {url} - ERRO: {e}\n")

async def main():
    print("Testando WebSocket endpoints na porta 9090...\n")
    
    endpoints = [
        "ws://localhost:9090/api/ws/backends",
        "ws://localhost:9090/api/ws/metrics", 
        "ws://localhost:9090/api/ws/status"
    ]
    
    for endpoint in endpoints:
        await test_websocket(endpoint)

if __name__ == "__main__":
    asyncio.run(main())
