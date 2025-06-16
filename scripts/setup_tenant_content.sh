#!/bin/bash

# Script para implementar conteúdo personalizado por tenant nos backends

LOG_FILE="/tmp/veloflux_tenant_content_setup_$(date +%Y%m%d_%H%M%S).log"
BACKEND_1_PORT=8001
BACKEND_2_PORT=8002

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No color

# Função de log
log() {
    local level="$1"
    local message="$2"
    local timestamp=$(date "+%Y-%m-%d %H:%M:%S")
    
    case "$level" in
        "INFO")  prefix="${BLUE}[INFO]${NC}   " ;;
        "ERROR") prefix="${RED}[ERROR]${NC}  " ;;
        "WARN")  prefix="${YELLOW}[WARN]${NC}   " ;;
        "OK")    prefix="${GREEN}[OK]${NC}     " ;;
        *)       prefix="[LOG]    " ;;
    esac
    
    echo -e "${timestamp} ${prefix} ${message}" | tee -a "$LOG_FILE"
}

# Verificar se os backends estão acessíveis
check_backends() {
    log "INFO" "Verificando acesso aos backends..."
    
    if curl -s -o /dev/null http://localhost:$BACKEND_1_PORT/; then
        log "OK" "Backend 1 (porta $BACKEND_1_PORT) está acessível"
    else
        log "ERROR" "Backend 1 (porta $BACKEND_1_PORT) não está respondendo"
        return 1
    fi
    
    if curl -s -o /dev/null http://localhost:$BACKEND_2_PORT/; then
        log "OK" "Backend 2 (porta $BACKEND_2_PORT) está acessível"
    else
        log "ERROR" "Backend 2 (porta $BACKEND_2_PORT) não está respondendo"
        return 1
    fi
    
    return 0
}

# Criar diretórios para conteúdo personalizado
setup_directories() {
    log "INFO" "Criando diretórios para conteúdo personalizado..."
    
    mkdir -p /tmp/veloflux_custom_content/{tenant1,tenant2,api,admin,default}
    
    if [ $? -eq 0 ]; then
        log "OK" "Diretórios criados com sucesso em /tmp/veloflux_custom_content"
    else
        log "ERROR" "Falha ao criar diretórios"
        return 1
    fi
    
    return 0
}

# Criar conteúdo HTML personalizado para cada tenant
create_tenant_content() {
    log "INFO" "Criando conteúdo HTML personalizado para cada tenant..."
    
    # Conteúdo padrão
    cat > /tmp/veloflux_custom_content/default/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>VeloFlux Default Domain</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #333; }
        .server-info { margin-top: 20px; padding: 10px; background: #eee; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">VeloFlux Default Domain</h1>
        <p>This is the default content served when no specific tenant is matched.</p>
        <div class="server-info" id="server-info">
            Loading server information...
        </div>
    </div>
    
    <script>
        // Get server information
        function getServerInfo() {
            const serverInfo = document.getElementById('server-info');
            const hostname = window.location.hostname;
            const path = window.location.pathname;
            
            // Display information
            serverInfo.innerHTML = \`
                <h3>Request Information</h3>
                <p><strong>Host:</strong> \${hostname}</p>
                <p><strong>Path:</strong> \${path}</p>
                <p><strong>Server:</strong> Default Backend</p>
                <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            \`;
        }
        
        // Call when page loads
        window.onload = getServerInfo;
    </script>
</body>
</html>
EOF
    
    # Tenant 1
    cat > /tmp/veloflux_custom_content/tenant1/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Tenant 1 Portal</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #e8f5e9; }
        .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #2e7d32; }
        .server-info { margin-top: 20px; padding: 10px; background: #c8e6c9; border-radius: 5px; }
        .tenant-badge { display: inline-block; padding: 5px 10px; background: #2e7d32; color: white; border-radius: 20px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="tenant-badge">TENANT 1</div>
        <h1 class="header">Welcome to Tenant 1 Portal</h1>
        <p>This is a custom page for Tenant 1.</p>
        <div class="server-info" id="server-info">
            Loading server information...
        </div>
    </div>
    
    <script>
        // Get server information
        function getServerInfo() {
            const serverInfo = document.getElementById('server-info');
            const hostname = window.location.hostname;
            const path = window.location.pathname;
            
            // Display information
            serverInfo.innerHTML = \`
                <h3>Request Information</h3>
                <p><strong>Host:</strong> \${hostname}</p>
                <p><strong>Path:</strong> \${path}</p>
                <p><strong>Tenant:</strong> Tenant 1</p>
                <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            \`;
        }
        
        // Call when page loads
        window.onload = getServerInfo;
    </script>
</body>
</html>
EOF
    
    # Tenant 2
    cat > /tmp/veloflux_custom_content/tenant2/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Tenant 2 Portal</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #e3f2fd; }
        .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #1565c0; }
        .server-info { margin-top: 20px; padding: 10px; background: #bbdefb; border-radius: 5px; }
        .tenant-badge { display: inline-block; padding: 5px 10px; background: #1565c0; color: white; border-radius: 20px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="tenant-badge">TENANT 2</div>
        <h1 class="header">Welcome to Tenant 2 Portal</h1>
        <p>This is a custom page for Tenant 2.</p>
        <div class="server-info" id="server-info">
            Loading server information...
        </div>
    </div>
    
    <script>
        // Get server information
        function getServerInfo() {
            const serverInfo = document.getElementById('server-info');
            const hostname = window.location.hostname;
            const path = window.location.pathname;
            
            // Display information
            serverInfo.innerHTML = \`
                <h3>Request Information</h3>
                <p><strong>Host:</strong> \${hostname}</p>
                <p><strong>Path:</strong> \${path}</p>
                <p><strong>Tenant:</strong> Tenant 2</p>
                <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            \`;
        }
        
        // Call when page loads
        window.onload = getServerInfo;
    </script>
</body>
</html>
EOF
    
    # API
    cat > /tmp/veloflux_custom_content/api/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>API Gateway</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #fff8e1; }
        .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #ff8f00; }
        .server-info { margin-top: 20px; padding: 10px; background: #ffecb3; border-radius: 5px; }
        .api-badge { display: inline-block; padding: 5px 10px; background: #ff8f00; color: white; border-radius: 20px; margin-bottom: 20px; }
        pre { text-align: left; background: #f5f5f5; padding: 15px; border-radius: 5px; overflow: auto; }
    </style>
</head>
<body>
    <div class="container">
        <div class="api-badge">API GATEWAY</div>
        <h1 class="header">VeloFlux API Gateway</h1>
        <p>This is the API documentation page.</p>
        
        <pre>
{
    "api_version": "v1",
    "endpoints": [
        {
            "path": "/api/v1/users",
            "methods": ["GET", "POST"],
            "description": "User management"
        },
        {
            "path": "/api/v1/metrics",
            "methods": ["GET"],
            "description": "System metrics"
        }
    ]
}
        </pre>
        
        <div class="server-info" id="server-info">
            Loading server information...
        </div>
    </div>
    
    <script>
        // Get server information
        function getServerInfo() {
            const serverInfo = document.getElementById('server-info');
            const hostname = window.location.hostname;
            const path = window.location.pathname;
            
            // Display information
            serverInfo.innerHTML = \`
                <h3>Request Information</h3>
                <p><strong>Host:</strong> \${hostname}</p>
                <p><strong>Path:</strong> \${path}</p>
                <p><strong>Service:</strong> API Gateway</p>
                <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            \`;
        }
        
        // Call when page loads
        window.onload = getServerInfo;
    </script>
</body>
</html>
EOF
    
    # Admin
    cat > /tmp/veloflux_custom_content/admin/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Admin Portal</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f3e5f5; }
        .container { background: #fff; padding: 30px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1); }
        .header { color: #6a1b9a; }
        .server-info { margin-top: 20px; padding: 10px; background: #e1bee7; border-radius: 5px; }
        .admin-badge { display: inline-block; padding: 5px 10px; background: #6a1b9a; color: white; border-radius: 20px; margin-bottom: 20px; }
        .dashboard { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 20px 0; }
        .metric { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="admin-badge">ADMIN PORTAL</div>
        <h1 class="header">VeloFlux Administration</h1>
        <p>This is the admin dashboard.</p>
        
        <div class="dashboard">
            <div class="metric">
                <h3>Active Users</h3>
                <p>1,234</p>
            </div>
            <div class="metric">
                <h3>Server Load</h3>
                <p>42%</p>
            </div>
            <div class="metric">
                <h3>Total Tenants</h3>
                <p>5</p>
            </div>
            <div class="metric">
                <h3>Error Rate</h3>
                <p>0.1%</p>
            </div>
        </div>
        
        <div class="server-info" id="server-info">
            Loading server information...
        </div>
    </div>
    
    <script>
        // Get server information
        function getServerInfo() {
            const serverInfo = document.getElementById('server-info');
            const hostname = window.location.hostname;
            const path = window.location.pathname;
            
            // Display information
            serverInfo.innerHTML = \`
                <h3>Request Information</h3>
                <p><strong>Host:</strong> \${hostname}</p>
                <p><strong>Path:</strong> \${path}</p>
                <p><strong>Service:</strong> Admin Portal</p>
                <p><strong>Time:</strong> \${new Date().toISOString()}</p>
            \`;
        }
        
        // Call when page loads
        window.onload = getServerInfo;
    </script>
</body>
</html>
EOF
    
    log "OK" "Conteúdo HTML personalizado criado com sucesso"
    return 0
}

# Modificar backends para servir conteúdo personalizado
setup_backends() {
    log "INFO" "Instalando conteúdo personalizado nos backends via Docker..."
    
    # Verificar se os containers estão rodando
    local backend1_id=$(docker ps --filter "publish=$BACKEND_1_PORT" --format "{{.ID}}" | head -n1)
    local backend2_id=$(docker ps --filter "publish=$BACKEND_2_PORT" --format "{{.ID}}" | head -n1)
    
    if [ -z "$backend1_id" ] || [ -z "$backend2_id" ]; then
        log "ERROR" "Não foi possível encontrar os containers dos backends"
        return 1
    fi
    
    # Copiar arquivos para o container do Backend 1
    log "INFO" "Copiando conteúdo para o Backend 1..."
    docker cp /tmp/veloflux_custom_content/tenant1/index.html ${backend1_id}:/usr/share/nginx/html/tenant1.html
    docker cp /tmp/veloflux_custom_content/api/index.html ${backend1_id}:/usr/share/nginx/html/api.html
    docker cp /tmp/veloflux_custom_content/default/index.html ${backend1_id}:/usr/share/nginx/html/default.html
    
    # Criar arquivo de configuração para o Backend 1
    cat > /tmp/backend1-nginx-default.conf << EOF
server {
    listen 80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    
    # Default host rule
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Special paths for VHost routing
    location = /tenant1 {
        return 302 /tenant1.html;
    }
    
    location = /api {
        return 302 /api.html;
    }
    
    # Health check endpoint
    location = /health {
        add_header Content-Type text/html;
        return 200 "OK - Backend 1";
    }
    
    # Add custom header for identification
    add_header X-Backend "Backend-1";
    add_header X-Tenant-Supported "tenant1,api";
}
EOF
    
    # Copiar configuração para o Backend 1
    docker cp /tmp/backend1-nginx-default.conf ${backend1_id}:/etc/nginx/conf.d/default.conf
    docker exec ${backend1_id} nginx -s reload
    
    # Copiar arquivos para o container do Backend 2
    log "INFO" "Copiando conteúdo para o Backend 2..."
    docker cp /tmp/veloflux_custom_content/tenant2/index.html ${backend2_id}:/usr/share/nginx/html/tenant2.html
    docker cp /tmp/veloflux_custom_content/admin/index.html ${backend2_id}:/usr/share/nginx/html/admin.html
    docker cp /tmp/veloflux_custom_content/default/index.html ${backend2_id}:/usr/share/nginx/html/default.html
    
    # Criar arquivo de configuração para o Backend 2
    cat > /tmp/backend2-nginx-default.conf << EOF
server {
    listen 80 default_server;
    server_name _;
    root /usr/share/nginx/html;
    
    # Default host rule
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    # Special paths for VHost routing
    location = /tenant2 {
        return 302 /tenant2.html;
    }
    
    location = /admin {
        return 302 /admin.html;
    }
    
    # Health check endpoint
    location = /health {
        add_header Content-Type text/html;
        return 200 "OK - Backend 2";
    }
    
    # Add custom header for identification
    add_header X-Backend "Backend-2";
    add_header X-Tenant-Supported "tenant2,admin";
}
EOF
    
    # Copiar configuração para o Backend 2
    docker cp /tmp/backend2-nginx-default.conf ${backend2_id}:/etc/nginx/conf.d/default.conf
    docker exec ${backend2_id} nginx -s reload
    
    log "OK" "Backends configurados com conteúdo personalizado"
    return 0
}

# Verificar configuração
verify_setup() {
    log "INFO" "Verificando configuração dos backends..."
    
    # Verificar Backend 1
    local backend1_response=$(curl -s http://localhost:$BACKEND_1_PORT/health)
    if [[ "$backend1_response" == *"Backend 1"* ]]; then
        log "OK" "Backend 1 configurado corretamente"
    else
        log "WARN" "Backend 1 pode não estar configurado corretamente: $backend1_response"
    fi
    
    # Verificar Backend 2
    local backend2_response=$(curl -s http://localhost:$BACKEND_2_PORT/health)
    if [[ "$backend2_response" == *"Backend 2"* ]]; then
        log "OK" "Backend 2 configurado corretamente"
    else
        log "WARN" "Backend 2 pode não estar configurado corretamente: $backend2_response"
    fi
    
    # Testar acesso pelo VeloFlux
    log "INFO" "Testando acesso pelo VeloFlux..."
    
    # Adicionar mais testes aqui se necessário
    
    return 0
}

# Função principal
main() {
    log "INFO" "Iniciando configuração de conteúdo personalizado por tenant..."
    
    # Verificar backends
    if ! check_backends; then
        log "ERROR" "Não foi possível acessar os backends. Encerrando."
        return 1
    fi
    
    # Configurar diretórios
    if ! setup_directories; then
        log "ERROR" "Falha na configuração de diretórios. Encerrando."
        return 1
    fi
    
    # Criar conteúdo
    if ! create_tenant_content; then
        log "ERROR" "Falha na criação de conteúdo. Encerrando."
        return 1
    fi
    
    # Configurar backends
    if ! setup_backends; then
        log "ERROR" "Falha na configuração dos backends. Encerrando."
        return 1
    fi
    
    # Verificar configuração
    verify_setup
    
    log "OK" "Configuração de conteúdo personalizado por tenant concluída!"
    log "INFO" "Para testar, acesse os seguintes URLs:"
    log "INFO" "  - http://localhost:80/ (com Host: tenant1.private.dev.veloflux.io)"
    log "INFO" "  - http://localhost:80/ (com Host: tenant2.private.dev.veloflux.io)"
    log "INFO" "  - http://localhost:80/ (com Host: api.private.dev.veloflux.io)"
    log "INFO" "  - http://localhost:80/ (com Host: admin.private.dev.veloflux.io)"
    
    return 0
}

# Executar função principal
main
