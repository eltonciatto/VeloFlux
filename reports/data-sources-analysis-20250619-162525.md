# 📊 ANÁLISE DE FONTES DE DADOS - Dashboard VeloFlux
## Data: 2025-06-19 16:25:25

## 🎭 Análise de Dados Mockados

### ⚠️ Arquivos com Dados Mockados Detectados:
- `/workspaces/VeloFlux/frontend/src/components/mobile/MobileDashboard.tsx`
  - Linhas com mock:
    - `45:const mockMobileData: MobileChart[] = [`
    - `53:const mockMetrics: MobileMetric[] = [`
    - `155:            {mockMetrics.map((metric, index) => (`

- `/workspaces/VeloFlux/frontend/src/components/mobile/SwipeableCards.tsx`
  - Linhas com mock:
    - `26:const mockCards: SwipeableCard[] = [`
    - `95:    } else if (dragOffset < -threshold && currentIndex < mockCards.length - 1) {`
    - `124:    } else if (dragOffset < -threshold && currentIndex < mockCards.length - 1) {`

- `/workspaces/VeloFlux/frontend/src/components/dashboard/MetricWidget.tsx`
  - Linhas com mock:
    - `114:      // Generate mock data based on widget type`
    - `115:      let mockData;`
    - `123:          mockData = {`

- `/workspaces/VeloFlux/frontend/src/components/ai/AIHub.tsx`
  - Linhas com mock:
    - `66:  // Mock data para módulos AI`
    - `130:  // Mock data para insights`

- `/workspaces/VeloFlux/frontend/src/components/ai/PredictiveAnalytics.tsx`
  - Linhas com mock:
    - `86:  // Mock data - em produção viria de APIs`

- `/workspaces/VeloFlux/frontend/src/components/ai/AutoScalingAI.tsx`
  - Linhas com mock:
    - `101:  // Mock data - em produção viria de APIs`

- `/workspaces/VeloFlux/frontend/src/components/ai/ResourceOptimization.tsx`
  - Linhas com mock:
    - `98:  // Mock data - em produção viria de APIs`

- `/workspaces/VeloFlux/frontend/src/components/ai/AnomalyDetection.tsx`
  - Linhas com mock:
    - `81:  // Mock data - em produção viria de APIs em tempo real`

- `/workspaces/VeloFlux/frontend/src/components/multi-tenant/TenantComparison.tsx`
  - Linhas com mock:
    - `31:const mockTenants: TenantMetrics[] = [`
    - `90:    mockTenants.find(tenant => tenant.id === id)!`
    - `108:    const allValues = mockTenants.map(t => t[metric.key] as number);`

- `/workspaces/VeloFlux/frontend/src/components/multi-tenant/BulkOperations.tsx`
  - Linhas com mock:
    - `49:const mockTenants: BulkTenant[] = [`
    - `97:const mockOperations: BulkOperation[] = [`
    - `132:  const [operations, setOperations] = useState<BulkOperation[]>(mockOperations);`

- `/workspaces/VeloFlux/frontend/src/components/multi-tenant/TenantHierarchy.tsx`
  - Linhas com mock:
    - `41:const mockHierarchy: TenantNode = {`
    - `252:  const allNodes = getAllNodes(mockHierarchy);`
    - `304:                  {renderTreeNode(mockHierarchy)}`

- `/workspaces/VeloFlux/frontend/src/components/integrations/TeamsIntegration.tsx`
  - Linhas com mock:
    - `87:const mockTeams = [`
    - `93:const mockChannels: TeamsChannel[] = [`
    - `123:const mockMessages: TeamsMessage[] = [`

- `/workspaces/VeloFlux/frontend/src/components/integrations/DataDogIntegration.tsx`
  - Linhas com mock:
    - `61:const mockPerformanceData = [`
    - `71:const mockServiceMetrics: ServiceMetric[] = [`
    - `98:const mockInfrastructure: InfrastructureMetric[] = [`

- `/workspaces/VeloFlux/frontend/src/components/integrations/DiscordIntegration.tsx`
  - Linhas com mock:
    - `85:const mockChannels: DiscordChannel[] = [`
    - `120:const mockMessages: DiscordMessage[] = [`
    - `153:const mockAlertRules: AlertRule[] = [`

- `/workspaces/VeloFlux/frontend/src/components/integrations/PrometheusIntegration.tsx`
  - Linhas com mock:
    - `63:const mockMetricsData = [`
    - `73:const mockTargets: MetricTarget[] = [`
    - `109:const mockAlertRules: AlertRule[] = [`

- `/workspaces/VeloFlux/frontend/src/components/integrations/SlackIntegration.tsx`
  - Linhas com mock:
    - `78:const mockChannels: SlackChannel[] = [`
    - `105:const mockMessages: SlackMessage[] = [`
    - `135:const mockAlertRules: AlertRule[] = [`

- `/workspaces/VeloFlux/frontend/src/components/integrations/IntegrationHub.tsx`
  - Linhas com mock:
    - `56:const mockIntegrations: Integration[] = [`
    - `167:  const [integrations, setIntegrations] = useState<Integration[]>(mockIntegrations);`

- `/workspaces/VeloFlux/frontend/src/lib/mockAIData.ts`
  - Linhas com mock:
    - `4:export const mockAIMetrics: AIMetrics = {`
    - `60:export const mockAIConfig: AIConfig = {`
    - `77:export const mockModelStatus = {`

- `/workspaces/VeloFlux/frontend/src/hooks/__tests__/tenant-provider.test.tsx`
  - Linhas com mock:
    - `5:// Mock do localStorage`
    - `6:const mockLocalStorage = {`
    - `11:Object.defineProperty(window, 'localStorage', { value: mockLocalStorage });`

- `/workspaces/VeloFlux/frontend/src/hooks/__tests__/auth-provider.test.tsx`
  - Linhas com mock:
    - `6:// Mock do TokenService`
    - `7:jest.mock('@/lib/tokenService', () => ({`
    - `19:// Mock do safeApiFetch`

- `/workspaces/VeloFlux/frontend/src/hooks/useMultiTenant.ts`
  - Linhas com mock:
    - `90:// Mock data generator`
    - `91:const generateMockTenant = (id: string): Tenant => {`
    - `128:const generateMockData = (): { tenants: Tenant[]; stats: TenantStats } => {`

- `/workspaces/VeloFlux/frontend/src/hooks/useNotifications.ts`
  - Linhas com mock:
    - `137:        // Generate some initial mock notifications`
    - `138:        const mockNotifications = generateMockNotifications();`
    - `139:        setNotifications(mockNotifications);`

- `/workspaces/VeloFlux/frontend/src/hooks/useOfflineSync.ts`
  - Linhas com mock:
    - `171:    // Mock API call - replace with actual implementation`

- `/workspaces/VeloFlux/frontend/src/hooks/useAdvancedAnalytics.ts`
  - Linhas com mock:
    - `135:  // Mock data generators`
    - `136:  const generateMockMetrics = useCallback((): AnalyticsMetric[] => {`
    - `174:  const generateMockTimeSeries = useCallback((metricName: string, timeRange: string): TimeSeriesData[] => {`


## 🔗 Análise de Hooks de API

### ✅ Hooks de API Identificados:
- `/workspaces/VeloFlux/frontend/src/hooks/useOrchestration.ts`
  - Endpoints:
    - `5:import { apiFetch } from '@/lib/api';`
    - `131:      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration`, {`
    - `162:      const response = await apiFetch(`/api/tenants/${tenantId}/orchestration/status`, {`

- `/workspaces/VeloFlux/frontend/src/hooks/use-api.ts`
  - Endpoints:
    - `2:import { apiFetch } from '@/lib/api';`
    - `8:    queryFn: () => apiFetch('/api/backends'),`
    - `16:    queryFn: () => apiFetch('/api/cluster'),`

- `/workspaces/VeloFlux/frontend/src/hooks/useAIMetrics.ts`
  - Endpoints:
    - `31:    queryFn: () => aiApiClient.getAIMetrics(),`
    - `49:    queryFn: () => aiApiClient.getAIPredictions(),`
    - `66:    queryFn: () => aiApiClient.getModelStatus(),`


## ⚙️ Configuração de Ambiente

### ✅ Arquivo de Configuração: `/workspaces/VeloFlux/frontend/src/config/environment.ts`
#### Configuração de Modo Demo:
- `14:  DEMO_MODE: import.meta.env.VITE_DEMO_MODE === 'true',`
- `16:  // Demo credentials (only used in demo mode)`
- `109:export const isDemoMode = () => CONFIG.DEMO_MODE;`
#### Endpoints de Produção:
- `7:  // API endpoints - STANDARD PORT ALLOCATION (NEVER CHANGE)`
- `10:  API_BASE: import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:9090' : ''),`
- `23:  PRODUCTION: {`
- `25:    API_URL: import.meta.env.VITE_PROD_API_URL || '/api',`
- `31:    // Real backend endpoints for production`
- `110:export const getApiBase = () => isProduction() ? CONFIG.PRODUCTION.API_URL : CONFIG.API_BASE;`
- `111:export const getAdminBase = () => isProduction() ? CONFIG.PRODUCTION.ADMIN_URL : CONFIG.ADMIN_BASE;`
- `114:export const getEndpoint = (endpoint: keyof typeof CONFIG.PRODUCTION.ENDPOINTS) => {`
- `116:  const path = CONFIG.PRODUCTION.ENDPOINTS[endpoint];`

## 🧩 Análise de Componentes Principais

### 📄 `BackendOverview.tsx`
#### ✅ Usando Hooks de API Reais:
- `10:import { useBackends, useClusterInfo, useSystemMetrics } from '@/hooks/use-api';`
- `30:  const { data: backends = [], isLoading: backendsLoading } = useBackends();`
- `32:  const { data: metrics, isLoading: metricsLoading } = useSystemMetrics();`
