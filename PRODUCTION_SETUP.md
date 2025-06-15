# 🚀 Configuração Produção vs Demo - VeloFlux

## 📋 Visão Geral

O VeloFlux foi configurado para funcionar tanto em **modo demo** (desenvolvimento) quanto em **modo produção** com dados reais.

## 🔧 Configuração Atual (Demo Mode)

### ✅ **Modo Demo Ativo**
- **Autenticação**: Simulada com credenciais demo
- **Dados**: Métricas e insights simulados
- **Backend**: Não requer VeloFlux Load Balancer real
- **Indicador**: "MODO DEMO" visível no canto superior direito

### 🔑 **Credenciais Demo**
- **Usuário**: `admin` ou `demo`
- **Senha**: `senha-super`

## 🏭 Configuração para Produção

### 1. **Variáveis de Ambiente**

Crie um arquivo `.env` baseado no `.env.example`:

```bash
# Copiar exemplo
cp .env.example .env

# Editar para produção
VITE_MODE=production
VITE_DEMO_MODE=false
VITE_PROD_API_URL=https://api.seudominio.com
VITE_PROD_ADMIN_URL=https://admin.seudominio.com
```

### 2. **Backend VeloFlux Real**

Para produção, você precisa:

```bash
# 1. Configurar VeloFlux Load Balancer
./veloflux-lb --config config/production.yaml

# 2. Configurar endpoints de API
# - /auth/login
# - /auth/refresh  
# - /api/profile
# - /api/metrics/realtime
# - /api/backends/status
# - /api/ai/insights
```

### 3. **Build para Produção**

```bash
# Build otimizado
npm run build

# Deploy (exemplo com Nginx)
cp -r dist/* /var/www/veloflux/
```

### 4. **Configuração Nginx (Exemplo)**

```nginx
server {
    listen 80;
    server_name admin.seudominio.com;
    
    root /var/www/veloflux;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy para VeloFlux backend
    location /api/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /auth/ {
        proxy_pass http://localhost:9000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 🔄 Diferenças Demo vs Produção

| Aspecto | Demo Mode | Produção |
|---------|-----------|----------|
| **Autenticação** | Simulada | JWT real via API |
| **Dados** | Simulados | API real do VeloFlux |
| **Métricas** | Estáticas | Tempo real |
| **Backends** | Mock | Status real |
| **IA/ML** | Simulado | Modelos reais |
| **Alertas** | Fictícios | Sistema real |

## 🛡️ Segurança em Produção

### ✅ **Implementado Automaticamente**
- Bloqueio de credenciais demo em produção
- Autenticação real obrigatória
- Rate limiting
- CSRF protection
- Sanitização de inputs

### ⚡ **Configurações Recomendadas**
```bash
# Variáveis de segurança
VITE_CSRF_ENABLED=true
VITE_RATE_LIMIT_ENABLED=true
VITE_JWT_SECRET=seu-jwt-secret-super-seguro
```

## 📊 Integração com Monitoramento

Para produção, configure:

```bash
# Prometheus para métricas
VITE_PROMETHEUS_URL=https://prometheus.seudominio.com

# Grafana para dashboards
VITE_GRAFANA_URL=https://grafana.seudominio.com

# Elasticsearch para logs
VITE_ELASTICSEARCH_URL=https://elasticsearch.seudominio.com
```

## 🔍 Como Verificar o Modo

### Via Interface
- **Demo**: Indicador "MODO DEMO" visível
- **Produção**: Sem indicador ou "PRODUÇÃO"

### Via Console do Browser
```javascript
// Verificar configuração atual
console.log(window.location.origin);
console.log('Demo Mode:', import.meta.env.VITE_DEMO_MODE);
```

### Via Login
- **Demo**: Aceita `admin/senha-super`
- **Produção**: Rejeita credenciais demo

## 🚀 Deploy Automático

### Docker Production
```dockerfile
FROM nginx:alpine
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
```

### Docker Compose Production
```yaml
version: '3.8'
services:
  veloflux-frontend:
    build: .
    ports:
      - "80:80"
    environment:
      - VITE_MODE=production
      - VITE_DEMO_MODE=false
```

## ✅ **Status Atual**
- ✅ Sistema configurado para demo
- ✅ Pronto para migração para produção
- ✅ Segurança implementada
- ✅ Documentação completa

**Para ativar produção**: Configure as variáveis de ambiente e conecte ao backend VeloFlux real!
