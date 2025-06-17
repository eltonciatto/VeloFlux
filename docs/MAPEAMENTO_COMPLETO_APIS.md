# 📊 Mapeamento Completo das APIs VeloFlux

## Resumo Executivo

Esta análise mapeia **TODAS** as APIs implementadas no backend Go e sua integração com o frontend React/TypeScript, incluindo:

- ✅ APIs de IA (já validadas anteriormente)
- 🔍 APIs de Autenticação e Login
- 🔍 APIs de Billing e Cobrança
- 🔍 APIs de Gerenciamento de Tenants
- 🔍 APIs de Pools e Backends
- 🔍 APIs de Rotas
- 🔍 APIs de OIDC
- 🔍 APIs de Orquestração
- 🔍 APIs de Métricas e Monitoramento

## 🎯 APIs Implementadas no Backend

### 1. APIs de Autenticação
#### Endpoints de Login/Auth:
- Nenhum endpoint encontrado

### 2. APIs de Billing/Cobrança
#### Endpoints de Billing:
- Nenhum endpoint encontrado

### 3. APIs de Gerenciamento de Tenants
#### Endpoints de Tenants:
- Nenhum endpoint encontrado

### 4. APIs de OIDC/SSO
#### Endpoints de OIDC:
- Nenhum endpoint encontrado

### 5. APIs de Orquestração Kubernetes
#### Endpoints de Orquestração:
- Nenhum endpoint encontrado

### 6. APIs Core (Pools, Backends, Routes)
#### Endpoints Core:
- Nenhum endpoint encontrado

## 🎯 Consumo de APIs no Frontend
### 1. APIs de Autenticação (Frontend)
#### Hooks e Clientes de Auth:
frontend/src/components/TranslationTest.tsx:    'nav.home'
frontend/src/components/TranslationTest.tsx:    'navigation.profile'
frontend/src/components/TranslationTest.tsx:    'pages.admin.title'
frontend/src/components/Conclusion.tsx:              to="/register"
frontend/src/components/RequireAuth.tsx:    return <Navigate to="/login" state={{ from: location }} replace />;
frontend/src/components/dashboard/OIDCSettings.tsx:      // Generate test login URL if enabled
frontend/src/components/dashboard/OIDCSettings.tsx:        const testURL = /auth/oidc/login/${tenantId}?return_url=${encodeURIComponent('/dashboard')};
frontend/src/components/dashboard/OIDCSettings.tsx:        providerURL = 'https://login.microsoftonline.com/{tenant-id}/v2.0';
frontend/src/components/Header.tsx:                  onClick={() => navigate('/login')}
frontend/src/components/Header.tsx:                  {t('navigation.login')}

### 2. APIs de Billing (Frontend)
#### Hooks e Clientes de Billing:
frontend/src/components/TranslationTest.tsx:    'pricing.plans.free.name'
frontend/src/components/TranslationTest.tsx:    'pricing.plans.pro.name'
frontend/src/components/TranslationTest.tsx:    'pricing.plans.enterprise.name'
frontend/src/components/TranslationTest.tsx:    'pricing.plans.enterprise.price.usd'
frontend/src/components/TranslationTest.tsx:    'terms.sections.usage.title'
frontend/src/components/Performance.tsx:    { metric: t('performance.resourceEfficiency.cpu')
frontend/src/components/Performance.tsx:    { metric: t('performance.resourceEfficiency.memory')
frontend/src/components/Performance.tsx:    { metric: t('performance.resourceEfficiency.network')
frontend/src/components/Performance.tsx:                      width: ${resource.usage}%
frontend/src/components/Performance.tsx:                  {t('performance.resourceEfficiency.utilized'
frontend/src/components/dashboard/BillingPanel.tsx:  const [plans
frontend/src/components/dashboard/BillingPanel.tsx:  const [usageData
- (/api/tenants/${tenantId}/billing
- (/api/tenants/${tenantId}/billing/plans
frontend/src/components/dashboard/BillingPanel.tsx:      console.error('Error fetching plans:'
- (/api/tenants/${tenantId}/billing/usage
frontend/src/components/dashboard/BillingPanel.tsx:      console.error('Error fetching usage data:'
- (/api/tenants/${tenantId}/billing/checkout
frontend/src/components/dashboard/BillingPanel.tsx:      // Redirect to Stripe checkout
frontend/src/components/dashboard/BillingPanel.tsx:      if (response.checkout_url) {
frontend/src/components/dashboard/BillingPanel.tsx:        window.location.href = response.checkout_url;
frontend/src/components/dashboard/BillingPanel.tsx:          description: 'Failed to create checkout session'
frontend/src/components/dashboard/BillingPanel.tsx:      console.error('Error creating checkout session:'
frontend/src/components/dashboard/BillingPanel.tsx:        description: 'Failed to create checkout session'
frontend/src/components/dashboard/BillingPanel.tsx:    if (!usageData) {
frontend/src/components/dashboard/BillingPanel.tsx:    const percentUsed = Math.min(100
frontend/src/components/dashboard/BillingPanel.tsx:              <span>{usageData.total_usage.toLocaleString()} used</span>
frontend/src/components/dashboard/BillingPanel.tsx:              <span>{usageData.plan_limit.toLocaleString()} included</span>
frontend/src/components/dashboard/BillingPanel.tsx:            {Object.entries(usageData.usage).slice(-8).map(([date
frontend/src/components/dashboard/BillingPanel.tsx:    if (plans.length === 0) {
frontend/src/components/dashboard/BillingPanel.tsx:          {plans.map((plan) => (
frontend/src/components/dashboard/BillingPanel.tsx:          <p>All plans include a 14-day free trial. Cancel anytime.</p>
frontend/src/components/dashboard/BillingPanel.tsx:          <TabsTrigger value="usage">Usage</TabsTrigger>
frontend/src/components/dashboard/BillingPanel.tsx:          <TabsTrigger value="plans">Plans</TabsTrigger>
frontend/src/components/dashboard/BillingPanel.tsx:        <TabsContent value="usage">
frontend/src/components/dashboard/BillingPanel.tsx:              <CardDescription>Monitor your usage and quotas</CardDescription>
frontend/src/components/dashboard/BillingPanel.tsx:        <TabsContent value="plans">
frontend/src/config/dataConfig.ts:    { severity: 'warning'
frontend/src/lib/aiApi.ts:  usage_count: number;
frontend/src/lib/aiApi.ts:    algorithm_usage: Array<{ timestamp: string; algorithm: string; count: number }>;
frontend/src/lib/mockAIData.ts:      usage_count: 1250
frontend/src/lib/mockAIData.ts:      usage_count: 980
frontend/src/lib/mockAIData.ts:  algorithm_usage: Array.from({ length: 10 }
frontend/src/pages/Pricing.tsx:  const plans = [
frontend/src/pages/Pricing.tsx:      name: t('pricing.plans.free.name')
frontend/src/pages/Pricing.tsx:      description: t('pricing.plans.free.description')
frontend/src/pages/Pricing.tsx:      features: t('pricing.plans.free.features'
frontend/src/pages/Pricing.tsx:      cta: t('pricing.plans.free.cta')
frontend/src/pages/Pricing.tsx:      name: t('pricing.plans.pro.name')
frontend/src/pages/Pricing.tsx:      description: t('pricing.plans.pro.description')
frontend/src/pages/Pricing.tsx:      features: t('pricing.plans.pro.features'
frontend/src/pages/Pricing.tsx:      cta: t('pricing.plans.pro.cta')
frontend/src/pages/Pricing.tsx:      name: t('pricing.plans.enterprise.name')
frontend/src/pages/Pricing.tsx:      description: t('pricing.plans.enterprise.description')
frontend/src/pages/Pricing.tsx:      features: t('pricing.plans.enterprise.features'
frontend/src/pages/Pricing.tsx:      cta: t('pricing.plans.enterprise.cta')
frontend/src/pages/Pricing.tsx:          {plans.map((plan
frontend/src/pages/Pricing.tsx:                          t('pricing.plans.enterprise.price.usd') : 
frontend/src/pages/Pricing.tsx:                          t('pricing.plans.enterprise.price.brl')
frontend/src/pages/TermsOfService.tsx:    { id: 'usage'
frontend/src/pages/TermsOfService.tsx:          <Card id="usage" className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-8 rounded-2xl">
frontend/src/pages/TermsOfService.tsx:                      <p className="text-red-200 text-sm">Excessive resource usage that impacts other users</p>
frontend/src/pages/PrivacyPolicy.tsx:                    <li>• Service usage patterns</li>

### 3. APIs de Tenants (Frontend)
#### Hooks e Clientes de Tenants:
- ('/api/tenants');
- (/api/tenants/${tenantId}/orchestration
- (/api/tenants/${tenantId}/orchestration/status
- (/api/tenants/${tenantId}/orchestration/detailed_status
- (/api/tenants/${tenantId}/orchestration
- (/api/tenants/${tenantId}/orchestration/deploy
- (/api/tenants/${tenantId}/orchestration/autoscale
- (/api/tenants/${tenantId}/orchestration/resources
- (/api/tenants/${tenantId}/orchestration/scale
- (/api/tenants/${tenantId}/orchestration/drain

### 4. APIs de Orquestração (Frontend)
#### Hooks e Clientes de Orquestração:
frontend/src/components/Features-new.tsx:                <feature.icon className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
frontend/src/components/Features-new.tsx:                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
frontend/src/components/TranslationTest.tsx:    'architecture.tabs.overview'
frontend/src/components/Conclusion.tsx:              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
frontend/src/components/Features.tsx:                <feature.icon className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
frontend/src/components/Features.tsx:                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
frontend/src/components/ImmersiveHero.tsx:              scale: [0
frontend/src/components/ImmersiveHero.tsx:            whileHover={{ scale: 1.05 }}
frontend/src/components/ImmersiveHero.tsx:            whileTap={{ scale: 0.95 }}
frontend/src/components/ImmersiveHero.tsx:            whileHover={{ scale: 1.05 }}
frontend/src/components/ImmersiveHero.tsx:            whileTap={{ scale: 0.95 }}
frontend/src/components/ImmersiveHero.tsx:              initial={{ scale: 0 }}
frontend/src/components/ImmersiveHero.tsx:              animate={{ scale: 1 }}
frontend/src/components/CustomCursor.tsx:          scale: isPointer ? 1.5 : 1
frontend/src/components/CustomCursor.tsx:          scale: isPointer ? 0.8 : 1
frontend/src/components/dashboard/AIInsights.tsx:                <Badge variant={predictions.scaling_recommendation === 'scale_up' ? 'destructive' : 'default'}>
frontend/src/components/dashboard/OrchestrationSettings.tsx:    status: 'not_deployed'
frontend/src/components/dashboard/OrchestrationSettings.tsx:    message: 'No deployment found for this tenant'
frontend/src/components/dashboard/OrchestrationSettings.tsx:    'deploying': 'bg-blue-600'
frontend/src/components/dashboard/OrchestrationSettings.tsx:    'not_deployed': 'bg-gray-600'
- (/api/tenants/${tenantId}/orchestration
- (/api/tenants/${tenantId}/orchestration/status
frontend/src/components/dashboard/OrchestrationSettings.tsx:      console.error('Error fetching deployment status:'
- (/api/tenants/${tenantId}/orchestration/detailed_status
- (/api/tenants/${tenantId}/orchestration
frontend/src/components/dashboard/OrchestrationSettings.tsx:  const deployInstance = async () => {
- (/api/tenants/${tenantId}/orchestration/deploy
frontend/src/components/dashboard/OrchestrationSettings.tsx:      console.error('Error deploying tenant instance:'
frontend/src/components/dashboard/OrchestrationSettings.tsx:        description: 'Failed to deploy tenant instance'
- (/api/tenants/${tenantId}/orchestration/autoscale
- (/api/tenants/${tenantId}/orchestration/resources
frontend/src/components/dashboard/OrchestrationSettings.tsx:  const scaleInstance = async () => {
- (/api/tenants/${tenantId}/orchestration/scale
frontend/src/components/dashboard/OrchestrationSettings.tsx:        description: 'Failed to scale instance'
- (/api/tenants/${tenantId}/orchestration/drain
- (/api/tenants/${tenantId}/orchestration/remove
frontend/src/components/dashboard/OrchestrationSettings.tsx:    // Poll for status updates when deploying/updating/scaling/removing/draining
frontend/src/components/dashboard/OrchestrationSettings.tsx:      if (['deploying'
frontend/src/components/dashboard/OrchestrationSettings.tsx:          {status.status === 'not_deployed' ? 'Not Deployed' : status.status.charAt(0).toUpperCase() + status.status.slice(1)}
frontend/src/components/dashboard/OrchestrationSettings.tsx:                        disabled={loading || status.status === 'not_deployed'}
frontend/src/components/dashboard/OrchestrationSettings.tsx:                            disabled={loading || status.status === 'not_deployed'}
frontend/src/components/dashboard/OrchestrationSettings.tsx:                    Current status of the tenant's deployment
frontend/src/components/dashboard/OrchestrationSettings.tsx:                {status.mode === 'dedicated' && status.status !== 'not_deployed' && (
frontend/src/components/dashboard/OrchestrationSettings.tsx:                      {status.status === 'not_deployed' ? 'Not Deployed' : status.status.charAt(0).toUpperCase() + status.status.slice(1)}
frontend/src/components/dashboard/OrchestrationSettings.tsx:                    There was an error with your deployment. Please check the message above or contact support.
frontend/src/components/dashboard/OrchestrationSettings.tsx:                {status.status === 'not_deployed' ? (
frontend/src/components/dashboard/OrchestrationSettings.tsx:                  <Button onClick={deployInstance} disabled={loading || config.mode === 'shared'}>
frontend/src/components/dashboard/OrchestrationSettings.tsx:                            disabled={loading || ['deploying'
frontend/src/components/dashboard/OrchestrationSettings.tsx:                            <Button onClick={scaleInstance} disabled={loading}>
frontend/src/components/dashboard/OrchestrationSettings.tsx:                        disabled={loading || ['deploying'
frontend/src/components/dashboard/OrchestrationSettings.tsx:                      disabled={loading || ['deploying'
frontend/src/components/dashboard/OrchestrationSettings.tsx:                      disabled={loading || ['deploying'
frontend/src/components/dashboard/FuturisticCard.tsx:      whileHover={{ scale: 1.02
frontend/src/components/dashboard/FuturisticCard.tsx:              scale: [1
frontend/src/components/dashboard/FuturisticCard.tsx:              scale: [1
frontend/src/components/dashboard/FuturisticCard.tsx:              scale: [1
frontend/src/components/dashboard/FuturisticCard.tsx:                        scale: [1
frontend/src/components/dashboard/FuturisticCard.tsx:              whileHover={{ scale: 1.1 }}
frontend/src/components/dashboard/FuturisticCard.tsx:                  scale: [1
frontend/src/components/dashboard/MetricsView.tsx:                  initial={{ opacity: 0
frontend/src/components/dashboard/MetricsView.tsx:                  animate={{ opacity: 1
frontend/src/components/dashboard/MetricsView.tsx:                  whileHover={{ scale: 1.05 }}
frontend/src/components/dashboard/BackendOverview.tsx:                    whileHover={{ scale: 1.01 }}
frontend/src/components/dashboard/BackendOverview.tsx:                            scale: backend.status === 'healthy' ? [1
frontend/src/components/dashboard/BackendOverview.tsx:                                scale: [1
frontend/src/components/dashboard/BackendOverview.tsx:                              scale: [1
frontend/src/components/dashboard/BackendOverview.tsx:                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
frontend/src/components/dashboard/PredictiveAnalytics.tsx:    if (predictions?.scaling_recommendation === 'scale_up') {
frontend/src/components/dashboard/PredictiveAnalytics.tsx:      case 'scale_up': return <ArrowUp className="h-4 w-4" />;
frontend/src/components/dashboard/PredictiveAnalytics.tsx:      case 'scale_down': return <ArrowDown className="h-4 w-4" />;
frontend/src/components/dashboard/PredictiveAnalytics.tsx:      case 'scale_up': return 'bg-orange-500 text-white';
frontend/src/components/dashboard/PredictiveAnalytics.tsx:      case 'scale_down': return 'bg-blue-500 text-white';
frontend/src/components/dashboard/AIConfiguration.tsx:                    Automatically scale infrastructure based on AI predictions
frontend/src/components/Architecture.tsx:            <TabsTrigger value="deployment" className="text-blue-200 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
frontend/src/components/Architecture.tsx:              {t('architecture.tabs.deployment')}
frontend/src/components/Architecture.tsx:          <TabsContent value="deployment" className="space-y-8">
frontend/src/components/ScrollProgress.tsx:  const scaleX = useSpring(scrollYProgress
frontend/src/components/ScrollProgress.tsx:        style={{ scaleX }}
frontend/src/components/ScrollProgress.tsx:                ? 'bg-cyan-400 border-cyan-400/50 scale-125' 
frontend/src/components/ScrollProgress.tsx:            whileHover={{ scale: activeSection === index ? 1.25 : 1.5 }}
frontend/src/components/ScrollProgress.tsx:            whileTap={{ scale: 0.9 }}
frontend/src/components/LiveDemoSection.tsx:                    whileHover={!isLowPerformance ? { scale: 1.03 } : {}}
frontend/src/components/LiveDemoSection.tsx:                        initial={!isLowPerformance ? { scale: 1.1
frontend/src/components/LiveDemoSection.tsx:                        animate={!isLowPerformance ? { scale: 1
frontend/src/components/LiveDemoSection.tsx:                      scale: node.status === 'active' ? [1
frontend/src/components/LiveDemoSection.tsx:                      exit={{ opacity: 0
frontend/src/components/LiveDemoSection.tsx:            whileHover={!isLowPerformance ? { scale: 1.05 } : {}}
frontend/src/components/LiveDemoSection.tsx:            whileTap={!isLowPerformance ? { scale: 0.95 } : {}}
frontend/src/components/LiveDemoSection.backup.tsx:                  scale: [1
frontend/src/components/LiveDemoSection.backup.tsx:                    whileHover={!isLowPerformance ? { scale: 1.05 } : {}}
frontend/src/components/LiveDemoSection.backup.tsx:                        initial={!isLowPerformance ? { scale: 1.1
frontend/src/components/LiveDemoSection.backup.tsx:                        animate={!isLowPerformance ? { scale: 1
frontend/src/components/LiveDemoSection.backup.tsx:                    scale: [1
frontend/src/components/LiveDemoSection.backup.tsx:            whileHover={{ scale: 1.05 }}
frontend/src/components/LiveDemoSection.backup.tsx:            whileTap={{ scale: 0.95 }}
frontend/src/components/AIShowcase.tsx:                className={${colors.bg} ${colors.border} backdrop-blur-sm p-8 hover:scale-105 hover:border-opacity-100 transition-all duration-300 group shadow-xl}
frontend/src/components/AIShowcase.tsx:                  <capability.icon className={w-12 h-12 ${colors.icon} group-hover:scale-110 transition-transform duration-300} />
frontend/src/lib/mockAIData.ts:    scaling_recommendation: 'scale_up'
frontend/src/lib/mockAIData.ts:  scaling_recommendation: 'scale_up'
frontend/src/pages/Pricing.tsx:                    ? 'bg-gradient-to-b from-purple-900/50 to-blue-900/50 border-purple-400/60 shadow-2xl scale-105' 
frontend/src/pages/Pricing.tsx:                } transition-all duration-300 hover:scale-105 hover:shadow-2xl}
frontend/src/pages/TermsOfService.tsx:                  className={flex items-center p-3 bg-gradient-to-r ${section.color} bg-opacity-20 border border-white/20 rounded-xl hover:scale-105 transition-transform duration-200 text-left}
frontend/src/pages/PrivacyPolicy.tsx:                  className={flex items-center p-3 bg-gradient-to-r ${section.color} bg-opacity-20 border border-white/20 rounded-xl hover:scale-105 transition-transform duration-200 text-left}
frontend/src/pages/Docs.tsx:            Everything you need to know about deploying
frontend/src/pages/Docs.tsx:                  <div className="text-center p-6 bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
frontend/src/pages/Docs.tsx:                  <div className="text-center p-6 bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
frontend/src/pages/Docs.tsx:                  <div className="text-center p-6 bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-400/30 rounded-2xl hover:scale-105 transition-transform duration-300">
frontend/src/pages/Dashboard.tsx:              scale: [0
frontend/src/pages/Dashboard.tsx:                      <Icon className={w-4 h-4 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}} />
frontend/src/pages/Dashboard.tsx:                  initial={{ opacity: 0
frontend/src/pages/Dashboard.tsx:                  animate={{ opacity: 1
frontend/src/pages/Dashboard.tsx:                  exit={{ opacity: 0
frontend/src/pages/About.tsx:    description: "Full-stack developer and infrastructure architect passionate about building high-performance systems that scale globally"
frontend/src/pages/About.tsx:                <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
frontend/src/pages/Contact.tsx:              <Card key={index} className="bg-white/5 border-white/10 backdrop-blur-xl shadow-2xl p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
frontend/src/pages/Index.tsx:        initial={{ opacity: 0
frontend/src/pages/Index.tsx:        whileInView={{ opacity: 1

### 5. APIs Core (Frontend)
#### Hooks e Clientes Core:
- ('/api/ai/config');
- ('/api/ai/config'
- ('/api/backends')
- ('/api/cluster')
- ('/api/config')
- (/api/pools/${data.pool}/backends
- (/api/backends/${data.pool}/${encodeURIComponent(data.address)}

## 🔍 Análise de Gaps e Inconsistências
### Possíveis Gaps Identificados:
#### 1. Endpoints Backend sem consumo Frontend:
- Verificação necessária para:
  -  - Gerenciamento de usuários
  -  - Gerenciamento de backends
  -  - Configuração WAF
  -  - Rate limiting
  -  - Métricas por tenant
  -  - Logs por tenant

#### 2. Endpoints Frontend sem implementação Backend:
- Análise em andamento...

## 📋 Estrutura de Arquivos de API
### Backend (Go):
```
backend/internal/api/ai_api.go
backend/internal/api/ai_api_test.go
backend/internal/api/api.go
backend/internal/api/billing_api.go
backend/internal/api/helpers.go
backend/internal/api/oidc_api.go
backend/internal/api/orchestration_api.go
backend/internal/api/smtp_api.go
backend/internal/api/tenant_api.go
backend/internal/api/types.go
```

### Frontend (TypeScript):
```
frontend/src/hooks/use-api.ts
frontend/src/lib/api.ts
```

## 📊 Estatísticas
- **Arquivos de API Backend**: 10
- **Arquivos de API/Hooks Frontend**: 2
- **Total de Endpoints Backend (aprox.)**: 101
- **Total de Chamadas Frontend (aprox.)**: 87

## 🎯 Próximas Ações Recomendadas
1. **Validação Manual Detalhada**: Verificar cada endpoint identificado
2. **Testes de Integração**: Criar testes automatizados para validar todos os endpoints
3. **Documentação**: Atualizar documentação de API com todos os endpoints
4. **Implementação de Gaps**: Implementar endpoints faltantes no frontend
5. **Padronização**: Garantir consistência de estruturas JSON entre backend e frontend

---
*Relatório gerado automaticamente em Tue Jun 17 10:37:15 UTC 2025*
## 🏗️ Análise Detalhada de Estruturas JSON
### Backend Structs (Go):
```go
backend/internal/api/ai_api.go-// AIMetrics representa métricas da IA para o frontend
backend/internal/api/ai_api.go:type AIMetrics struct {
backend/internal/api/ai_api.go-	Enabled           bool                        `json:"enabled"`
backend/internal/api/ai_api.go-	CurrentAlgorithm  string                      `json:"current_algorithm"`
backend/internal/api/ai_api.go-	PredictionData    *PredictionResponse         `json:"prediction_data"`
backend/internal/api/ai_api.go-	ModelPerformance  map[string]ModelPerformance `json:"model_performance"`
backend/internal/api/ai_api.go-	RecentRequests    []RequestMetric             `json:"recent_requests"`
--
backend/internal/api/ai_api.go-// PredictionResponse dados de predição atual
backend/internal/api/ai_api.go:type PredictionResponse struct {
backend/internal/api/ai_api.go-	RecommendedAlgo   string    `json:"recommended_algorithm"`
backend/internal/api/ai_api.go-	Confidence        float64   `json:"confidence"`
backend/internal/api/ai_api.go-	PredictedLoad     float64   `json:"predicted_load"`
backend/internal/api/ai_api.go-	PredictionTime    time.Time `json:"prediction_time"`
backend/internal/api/ai_api.go-	OptimalBackends   []string  `json:"optimal_backends"`
--
backend/internal/api/ai_api.go-// ModelPerformance métricas de performance dos modelos
backend/internal/api/ai_api.go:type ModelPerformance struct {
backend/internal/api/ai_api.go-	Type           string    `json:"type"`
backend/internal/api/ai_api.go-	Accuracy       float64   `json:"accuracy"`
backend/internal/api/ai_api.go-	LastTrained    time.Time `json:"last_trained"`
backend/internal/api/ai_api.go-	Version        string    `json:"version"`
backend/internal/api/ai_api.go-	TrainingStatus string    `json:"training_status"`
--
backend/internal/api/ai_api.go-// RequestMetric métricas de requisições individuais
backend/internal/api/ai_api.go:type RequestMetric struct {
backend/internal/api/ai_api.go-	Timestamp    time.Time `json:"timestamp"`
backend/internal/api/ai_api.go-	Method       string    `json:"method"`
backend/internal/api/ai_api.go-	Path         string    `json:"path"`
backend/internal/api/ai_api.go-	ResponseTime float64   `json:"response_time"`
backend/internal/api/ai_api.go-	StatusCode   int       `json:"status_code"`
--
backend/internal/api/ai_api.go-// AlgorithmStats estatísticas por algoritmo
backend/internal/api/ai_api.go:type AlgorithmStats struct {
backend/internal/api/ai_api.go-	RequestCount     int64   `json:"request_count"`
backend/internal/api/ai_api.go-	AvgResponseTime  float64 `json:"avg_response_time"`
backend/internal/api/ai_api.go-	ErrorRate        float64 `json:"error_rate"`
backend/internal/api/ai_api.go-	SuccessRate      float64 `json:"success_rate"`
backend/internal/api/ai_api.go-	LastUsed         time.Time `json:"last_used"`
--
backend/internal/api/ai_api.go-// AIConfigUpdate configuração atualizável da IA
backend/internal/api/ai_api.go:type AIConfigUpdate struct {
backend/internal/api/ai_api.go-	Enabled             bool    `json:"enabled"`
backend/internal/api/ai_api.go-	ModelType           string  `json:"model_type"`
backend/internal/api/ai_api.go-	ConfidenceThreshold float64 `json:"confidence_threshold"`
backend/internal/api/ai_api.go-	ApplicationAware    bool    `json:"application_aware"`
backend/internal/api/ai_api.go-	PredictiveScaling   bool    `json:"predictive_scaling"`
--
backend/internal/api/api.go-// API handles dynamic configuration endpoints
backend/internal/api/api.go:type API struct {
```
### Frontend Interfaces (TypeScript):
```typescript
frontend/src/lib/api.ts-export function sanitizeInput<T>(data: T): T {
frontend/src/lib/api.ts:  if (typeof data === 'string') {
frontend/src/lib/api.ts-    // Basic sanitization of HTML tags
frontend/src/lib/api.ts-    return data
frontend/src/lib/api.ts-      .replace(/</g, '&lt;')
frontend/src/lib/api.ts-      .replace(/>/g, '&gt;')
frontend/src/lib/api.ts-      .replace(/"/g, '&quot;')
--
frontend/src/lib/api.ts-  
frontend/src/lib/api.ts:  if (typeof data !== 'object' || data === null) {
frontend/src/lib/api.ts-    return data;
frontend/src/lib/api.ts-  }
frontend/src/lib/api.ts-  
frontend/src/lib/api.ts-  if (Array.isArray(data)) {
frontend/src/lib/api.ts-    return data.map(item => sanitizeInput(item)) as unknown as T;
--
frontend/src/lib/api.ts-  let body = options.body;
frontend/src/lib/api.ts:  if (body && typeof body === 'string' && headers['Content-Type'] === 'application/json') {
frontend/src/lib/api.ts-    try {
frontend/src/lib/api.ts-      const parsed = JSON.parse(body);
frontend/src/lib/api.ts-      const sanitized = sanitizeInput(parsed);
frontend/src/lib/api.ts-      body = JSON.stringify(sanitized);
frontend/src/lib/api.ts-    } catch (e) {
--
frontend/src/hooks/use-api.ts-
frontend/src/hooks/use-api.ts:export interface BackendInput {
frontend/src/hooks/use-api.ts-  address: string;
frontend/src/hooks/use-api.ts-  weight: number;
frontend/src/hooks/use-api.ts-  region: string;
frontend/src/hooks/use-api.ts-}
```
