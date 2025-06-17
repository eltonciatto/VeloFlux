#!/bin/bash

# Script para corrigir duplicidade de /api/ no frontend
# Remove /api/ dos paths quando usados com apiFetch ou safeApiFetch

echo "🔧 Corrigindo duplicidade de /api/ no frontend..."

# Lista de arquivos a corrigir
files=(
    "/workspaces/VeloFlux/frontend/src/hooks/useUserManagement.ts"
    "/workspaces/VeloFlux/frontend/src/hooks/useOIDCConfig.ts"
    "/workspaces/VeloFlux/frontend/src/hooks/useTenantMetrics.ts"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/UserManagement.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/TenantMonitoring.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/OIDCSettings.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/BillingPanel.tsx"
    "/workspaces/VeloFlux/frontend/src/components/dashboard/RateLimitConfig.tsx"
)

# Para cada arquivo, substituir /api/ por / no início dos paths
for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo "Corrigindo: $file"
        # Substituir '/api/tenants' por '/tenants'
        sed -i 's|/api/tenants|/tenants|g' "$file"
        # Substituir '/api/rate-limit' por '/rate-limit'
        sed -i 's|/api/rate-limit|/rate-limit|g' "$file"
        echo "✓ $file corrigido"
    else
        echo "⚠️  Arquivo não encontrado: $file"
    fi
done

echo "✅ Correção concluída!"
