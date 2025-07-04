# VeloFlux - Correções de Roteamento Necessárias

## Problema Atual
O roteamento do Nginx está direcionando todos os subdomínios para os serviços incorretos:
- `https://veloflux.io` está mostrando a página demo do backend, não a landing page oficial
- `https://api.veloflux.io/` e `https://admin.veloflux.io/` retornam 404
- `https://lb.veloflux.io/` retorna "Not found"

## Correções Implementadas

### 1. Frontend (Landing Page) - https://veloflux.io
**Problema:** Mostrando página demo do backend
**Solução:** Rotear para o container do frontend (porta 3000)
```nginx
location / {
    proxy_pass http://<YOUR_IP_ADDRESS>:3000;  # Frontend container
}
```

### 2. API - https://api.veloflux.io
**Problema:** Retorna 404
**Solução:** Rotear para a API do VeloFlux (porta 9000)
```nginx
location / {
    proxy_pass http://<YOUR_IP_ADDRESS>:9000;  # VeloFlux Admin API
}
```

### 3. Admin Panel - https://admin.veloflux.io
**Problema:** Retorna 404
**Solução:** Rotear para o frontend com endpoints de API
```nginx
location / {
    proxy_pass http://<YOUR_IP_ADDRESS>:3000;  # Frontend para UI
}
location /api/ {
    proxy_pass http://<YOUR_IP_ADDRESS>:9000/;  # API para funcionalidades
}
```

### 4. Load Balancer - https://lb.veloflux.io
**Problema:** Retorna "Not found"
**Solução:** Rotear para a porta principal do load balancer
```nginx
location / {
    proxy_pass http://<YOUR_IP_ADDRESS>:80;   # VeloFlux Load Balancer main port
}
```

## Arquitetura dos Containers

Com base no docker-compose.prod.fixed.yml:
- **<YOUR_IP_ADDRESS>**: Redis
- **<YOUR_IP_ADDRESS>**: Prometheus  
- **<YOUR_IP_ADDRESS>**: Frontend (Vite/React)
- **<YOUR_IP_ADDRESS>**: Grafana
- **<YOUR_IP_ADDRESS>**: VeloFlux Load Balancer
- **<YOUR_IP_ADDRESS>**: Backend Demo 1
- **<YOUR_IP_ADDRESS>**: Backend Demo 2

## Recursos Adicionados

### Rate Limiting
- API: 10 req/s com burst de 20
- Geral: 30 req/s com burst de 50

### Security Headers
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block
- Strict-Transport-Security

### CORS para API
- Suporte completo a CORS para chamadas de frontend
- Headers apropriados para desenvolvimento e produção

### WebSocket Support
- Suporte para WebSockets no frontend e Grafana
- Headers apropriados para upgrade de conexão

## Arquivo Criado
O script `fix-nginx-routing.sh` foi criado com todas as correções necessárias. Quando o SSH estiver disponível, execute:

```bash
./scripts/fix-nginx-routing.sh
```

## Próximos Passos (quando SSH disponível)
1. Executar script de correção de roteamento
2. Verificar se todos os containers estão executando
3. Testar todos os endpoints
4. Validar landing page oficial
5. Confirmar funcionalidade da API e admin
