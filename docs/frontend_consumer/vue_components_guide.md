# Vue.js Components - Billing API

## Visão Geral

Este guia demonstra como criar componentes Vue.js para consumir a API de Billing do VeloFlux, utilizando Composition API, Pinia para gerenciamento de estado e TypeScript.

## Configuração Inicial

### Dependências

```json
{
  "dependencies": {
    "vue": "^3.3.0",
    "pinia": "^2.1.0",
    "axios": "^1.4.0",
    "@vueuse/core": "^10.0.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0"
  }
}
```

### Configuração do Pinia

```ts
// main.ts
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'

const app = createApp(App)
app.use(createPinia())
app.mount('#app')
```

## Stores (Pinia)

### 1. Store Principal de Billing

```ts
// stores/billing.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  TenantBillingInfo, 
  Subscription, 
  Invoice,
  Plan,
  UsageData,
  Notification 
} from '@/types/billing'
import { billingService } from '@/services/billingService'

export const useBillingStore = defineStore('billing', () => {
  // State
  const billingInfo = ref<TenantBillingInfo | null>(null)
  const subscriptions = ref<Subscription[]>([])
  const invoices = ref<Invoice[]>([])
  const plans = ref<Plan[]>([])
  const usage = ref<UsageData | null>(null)
  const notifications = ref<Notification[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const currentSubscription = computed(() => billingInfo.value?.subscription)
  const currentPlan = computed(() => billingInfo.value?.plan)
  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )
  const unreadCount = computed(() => unreadNotifications.value.length)
  
  const usagePercentage = computed(() => {
    if (!usage.value) return 0
    return (usage.value.total_usage / usage.value.plan_limit) * 100
  })

  const isNearLimit = computed(() => usagePercentage.value > 80)

  // Actions
  async function fetchBillingInfo(tenantId: string) {
    loading.value = true
    error.value = null
    
    try {
      billingInfo.value = await billingService.getTenantBilling(tenantId)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar informações de billing'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function fetchSubscriptions() {
    try {
      subscriptions.value = await billingService.getSubscriptions()
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar assinaturas'
      throw err
    }
  }

  async function fetchInvoices(filters?: any) {
    try {
      invoices.value = await billingService.getInvoices(filters)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar faturas'
      throw err
    }
  }

  async function fetchPlans() {
    try {
      const response = await billingService.getPlans()
      plans.value = response.plans
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar planos'
      throw err
    }
  }

  async function fetchUsage(tenantId: string, filters?: any) {
    try {
      usage.value = await billingService.getTenantUsage(tenantId, filters)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar dados de uso'
      throw err
    }
  }

  async function fetchNotifications(filters?: any) {
    try {
      notifications.value = await billingService.getNotifications(filters)
    } catch (err: any) {
      error.value = err.message || 'Erro ao carregar notificações'
      throw err
    }
  }

  async function createCheckoutSession(tenantId: string, data: any) {
    loading.value = true
    
    try {
      const response = await billingService.createCheckoutSession(tenantId, data)
      return response.checkout_url
    } catch (err: any) {
      error.value = err.message || 'Erro ao criar sessão de checkout'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateSubscription(id: string, data: any) {
    loading.value = true
    
    try {
      const updatedSubscription = await billingService.updateSubscription(id, data)
      
      // Atualizar subscription na lista
      const index = subscriptions.value.findIndex(s => s.id === id)
      if (index !== -1) {
        subscriptions.value[index] = updatedSubscription
      }
      
      // Atualizar billing info se necessário
      if (billingInfo.value?.subscription?.id === id) {
        billingInfo.value.subscription = updatedSubscription
      }
      
      return updatedSubscription
    } catch (err: any) {
      error.value = err.message || 'Erro ao atualizar assinatura'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function cancelSubscription(id: string) {
    loading.value = true
    
    try {
      await billingService.cancelSubscription(id)
      
      // Remover da lista
      subscriptions.value = subscriptions.value.filter(s => s.id !== id)
      
      // Atualizar billing info se necessário
      if (billingInfo.value?.subscription?.id === id) {
        billingInfo.value.subscription = undefined
      }
    } catch (err: any) {
      error.value = err.message || 'Erro ao cancelar assinatura'
      throw err
    } finally {
      loading.value = false
    }
  }

  async function markNotificationAsRead(id: string) {
    try {
      await billingService.markNotificationAsRead(id)
      
      // Atualizar localmente
      const notification = notifications.value.find(n => n.id === id)
      if (notification) {
        notification.read = true
      }
    } catch (err: any) {
      error.value = err.message || 'Erro ao marcar notificação como lida'
      throw err
    }
  }

  async function markAllNotificationsAsRead() {
    try {
      const unread = unreadNotifications.value
      await Promise.all(
        unread.map(n => billingService.markNotificationAsRead(n.id))
      )
      
      // Atualizar localmente
      unread.forEach(n => n.read = true)
    } catch (err: any) {
      error.value = err.message || 'Erro ao marcar notificações como lidas'
      throw err
    }
  }

  function clearError() {
    error.value = null
  }

  function reset() {
    billingInfo.value = null
    subscriptions.value = []
    invoices.value = []
    plans.value = []
    usage.value = null
    notifications.value = []
    loading.value = false
    error.value = null
  }

  return {
    // State
    billingInfo,
    subscriptions,
    invoices,
    plans,
    usage,
    notifications,
    loading,
    error,
    
    // Getters
    currentSubscription,
    currentPlan,
    unreadNotifications,
    unreadCount,
    usagePercentage,
    isNearLimit,
    
    // Actions
    fetchBillingInfo,
    fetchSubscriptions,
    fetchInvoices,
    fetchPlans,
    fetchUsage,
    fetchNotifications,
    createCheckoutSession,
    updateSubscription,
    cancelSubscription,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    clearError,
    reset
  }
})
```

## Composables

### 1. Composable de Billing

```ts
// composables/useBilling.ts
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'

export function useBilling(tenantId: string) {
  const store = useBillingStore()
  const refreshInterval = ref<NodeJS.Timeout | null>(null)
  
  const {
    billingInfo,
    loading,
    error,
    currentSubscription,
    currentPlan,
    usagePercentage,
    isNearLimit
  } = storeToRefs(store)

  const refresh = async () => {
    if (tenantId) {
      await store.fetchBillingInfo(tenantId)
    }
  }

  const startAutoRefresh = (intervalMs = 300000) => { // 5 minutos
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
    }
    
    refreshInterval.value = setInterval(refresh, intervalMs)
  }

  const stopAutoRefresh = () => {
    if (refreshInterval.value) {
      clearInterval(refreshInterval.value)
      refreshInterval.value = null
    }
  }

  onMounted(() => {
    refresh()
    startAutoRefresh()
  })

  onUnmounted(() => {
    stopAutoRefresh()
  })

  return {
    billingInfo,
    loading,
    error,
    currentSubscription,
    currentPlan,
    usagePercentage,
    isNearLimit,
    refresh,
    startAutoRefresh,
    stopAutoRefresh,
    clearError: store.clearError
  }
}
```

### 2. Composable de Uso

```ts
// composables/useUsage.ts
import { ref, computed, watch } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'

export function useUsage(tenantId: string, resourceType = ref('requests')) {
  const store = useBillingStore()
  const { usage, loading, error } = storeToRefs(store)
  
  const filters = computed(() => ({
    resource: resourceType.value
  }))

  const usageData = computed(() => {
    if (!usage.value) return null
    
    return {
      ...usage.value,
      percentage: (usage.value.total_usage / usage.value.plan_limit) * 100,
      remaining: usage.value.plan_limit - usage.value.total_usage
    }
  })

  const fetchUsage = async () => {
    if (tenantId) {
      await store.fetchUsage(tenantId, filters.value)
    }
  }

  const exportUsage = async (format: string) => {
    try {
      const blob = await billingService.exportTenantBilling(tenantId, {
        format: format as any,
        start_date: filters.value.start_date,
        end_date: filters.value.end_date
      })

      // Criar download
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `usage_${tenantId}.${format}`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Erro ao exportar dados:', err)
    }
  }

  // Recarregar quando o tipo de recurso mudar
  watch(resourceType, fetchUsage, { immediate: true })

  return {
    usage: usageData,
    loading,
    error,
    fetchUsage,
    exportUsage
  }
}
```

## Componentes Vue

### 1. Dashboard Principal

```vue
<!-- components/BillingDashboard.vue -->
<template>
  <div class="billing-dashboard space-y-6 p-6">
    <div class="flex justify-between items-center">
      <h1 class="text-3xl font-bold text-gray-900">
        Billing Dashboard
      </h1>
      <button
        @click="refresh"
        :disabled="loading"
        class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Carregando...' : 'Atualizar' }}
      </button>
    </div>

    <!-- Error Alert -->
    <div v-if="error" class="bg-red-50 border border-red-200 rounded-md p-4">
      <div class="flex justify-between items-center">
        <p class="text-red-700">{{ error }}</p>
        <button @click="clearError" class="text-red-600 hover:text-red-800">
          ×
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading && !billingInfo" class="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>

    <!-- Dashboard Content -->
    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Subscription Card -->
      <div class="lg:col-span-2">
        <SubscriptionCard 
          :billing-info="billingInfo"
          :tenant-id="tenantId"
        />
      </div>

      <!-- Notifications -->
      <div>
        <NotificationCenter :tenant-id="tenantId" />
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Usage Chart -->
      <div>
        <UsageChart :tenant-id="tenantId" />
      </div>

      <!-- Recent Invoices -->
      <div>
        <InvoicesList :tenant-id="tenantId" :limit="5" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useBilling } from '@/composables/useBilling'
import SubscriptionCard from './SubscriptionCard.vue'
import UsageChart from './UsageChart.vue'
import InvoicesList from './InvoicesList.vue'
import NotificationCenter from './NotificationCenter.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'

interface Props {
  tenantId: string
}

const props = defineProps<Props>()

const {
  billingInfo,
  loading,
  error,
  refresh,
  clearError
} = useBilling(props.tenantId)
</script>
```

### 2. Card de Assinatura

```vue
<!-- components/SubscriptionCard.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-start mb-4">
      <h2 class="text-xl font-semibold text-gray-900">
        Assinatura Atual
      </h2>
      <span :class="statusClass">
        {{ statusText }}
      </span>
    </div>

    <!-- Active Subscription -->
    <div v-if="subscription" class="space-y-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-gray-600">Plano</p>
          <p class="text-lg font-medium">
            {{ plan?.name || subscription.plan_type }}
          </p>
        </div>
        <div>
          <p class="text-sm text-gray-600">Ciclo de Cobrança</p>
          <p class="text-lg font-medium">
            {{ subscription.billing_cycle === 'monthly' ? 'Mensal' : 'Anual' }}
          </p>
        </div>
      </div>

      <div v-if="billingInfo?.next_billing_date">
        <p class="text-sm text-gray-600">Próxima Cobrança</p>
        <p class="text-lg font-medium">
          {{ formatDate(billingInfo.next_billing_date) }}
        </p>
      </div>

      <div class="flex space-x-3">
        <button
          @click="showUpgrade = true"
          :disabled="loading"
          class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {{ loading ? 'Carregando...' : 'Alterar Plano' }}
        </button>
        <button class="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50">
          Gerenciar Pagamento
        </button>
      </div>
    </div>

    <!-- No Subscription -->
    <div v-else class="text-center py-8">
      <p class="text-gray-600 mb-4">
        Você não possui uma assinatura ativa
      </p>
      <button
        @click="showUpgrade = true"
        :disabled="loading"
        class="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
      >
        {{ loading ? 'Carregando...' : 'Escolher Plano' }}
      </button>
    </div>

    <!-- Plan Selector Modal -->
    <PlanSelector
      v-if="showUpgrade"
      :current-plan="subscription?.plan_type"
      @select-plan="handleUpgrade"
      @close="showUpgrade = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'
import type { TenantBillingInfo, PlanType } from '@/types/billing'
import PlanSelector from './PlanSelector.vue'
import { formatDate } from '@/utils/formatters'

interface Props {
  billingInfo: TenantBillingInfo | null
  tenantId: string
}

const props = defineProps<Props>()

const store = useBillingStore()
const { loading } = storeToRefs(store)
const showUpgrade = ref(false)

const subscription = computed(() => props.billingInfo?.subscription)
const plan = computed(() => props.billingInfo?.plan)

const statusClass = computed(() => {
  const status = props.billingInfo?.status
  const baseClass = 'px-3 py-1 rounded-full text-sm font-medium '
  
  switch (status) {
    case 'active':
      return baseClass + 'text-green-600 bg-green-100'
    case 'inactive':
      return baseClass + 'text-red-600 bg-red-100'
    case 'trialing':
      return baseClass + 'text-blue-600 bg-blue-100'
    default:
      return baseClass + 'text-gray-600 bg-gray-100'
  }
})

const statusText = computed(() => {
  const status = props.billingInfo?.status
  switch (status) {
    case 'active': return 'Ativo'
    case 'inactive': return 'Inativo'
    case 'trialing': return 'Em Teste'
    default: return 'Desconhecido'
  }
})

const handleUpgrade = async (planType: PlanType, isYearly: boolean) => {
  try {
    const checkoutUrl = await store.createCheckoutSession(props.tenantId, {
      plan_type: planType,
      is_yearly: isYearly
    })
    
    window.location.href = checkoutUrl
  } catch (error) {
    console.error('Erro ao iniciar upgrade:', error)
  }
}
</script>
```

### 3. Gráfico de Uso

```vue
<!-- components/UsageChart.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900">
        Uso de Recursos
      </h2>
      <div class="flex space-x-2">
        <select
          v-model="selectedResource"
          class="border border-gray-300 rounded-md px-3 py-1 text-sm"
        >
          <option value="requests">Requisições</option>
          <option value="bandwidth_gb">Bandwidth (GB)</option>
          <option value="storage_gb">Armazenamento (GB)</option>
          <option value="compute_hours">Horas de Compute</option>
        </select>
        <button
          @click="exportUsage('csv')"
          class="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Exportar
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-64">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-600">
      Erro ao carregar dados de uso
    </div>

    <!-- Usage Data -->
    <div v-else-if="usage" class="space-y-4">
      <div class="flex justify-between items-center">
        <span class="text-sm text-gray-600">
          {{ usage.total_usage.toLocaleString() }} / {{ usage.plan_limit.toLocaleString() }}
        </span>
        <span :class="percentageClass">
          {{ usage.percentage.toFixed(1) }}%
        </span>
      </div>

      <div class="w-full bg-gray-200 rounded-full h-3">
        <div
          :class="progressBarClass"
          :style="{ width: `${Math.min(usage.percentage, 100)}%` }"
          class="h-3 rounded-full transition-all duration-300"
        />
      </div>

      <!-- Usage Alert -->
      <div v-if="usage.percentage > 80" class="p-3 bg-red-50 border border-red-200 rounded-md">
        <p class="text-sm text-red-700">
          <strong>Atenção:</strong> Você está próximo do limite do seu plano.
          Considere fazer upgrade para evitar interrupções.
        </p>
      </div>

      <!-- Usage History Chart -->
      <div class="mt-6">
        <h3 class="text-lg font-medium text-gray-900 mb-3">
          Histórico de Uso (últimos 30 dias)
        </h3>
        <UsageHistoryChart :usage-data="usage.usage" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useUsage } from '@/composables/useUsage'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import UsageHistoryChart from './UsageHistoryChart.vue'

interface Props {
  tenantId: string
}

const props = defineProps<Props>()

const selectedResource = ref('requests')

const {
  usage,
  loading,
  error,
  exportUsage
} = useUsage(props.tenantId, selectedResource)

const percentageClass = computed(() => {
  if (!usage.value) return 'text-gray-600'
  
  const percentage = usage.value.percentage
  return percentage > 80 ? 'text-red-600' : 
         percentage > 60 ? 'text-yellow-600' : 'text-green-600'
})

const progressBarClass = computed(() => {
  if (!usage.value) return 'bg-gray-500'
  
  const percentage = usage.value.percentage
  return percentage > 80 ? 'bg-red-500' : 
         percentage > 60 ? 'bg-yellow-500' : 'bg-green-500'
})
</script>
```

### 4. Lista de Faturas

```vue
<!-- components/InvoicesList.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div v-if="showHeader" class="flex justify-between items-center mb-4">
      <h2 class="text-xl font-semibold text-gray-900">
        Faturas Recentes
      </h2>
      <router-link 
        to="/billing/invoices" 
        class="text-blue-600 hover:text-blue-800 text-sm"
      >
        Ver todas
      </router-link>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center items-center h-32">
      <LoadingSpinner />
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="text-center text-red-600 py-4">
      Erro ao carregar faturas
    </div>

    <!-- Empty State -->
    <div v-else-if="invoices.length === 0" class="text-center text-gray-600 py-8">
      Nenhuma fatura encontrada
    </div>

    <!-- Invoices List -->
    <div v-else class="space-y-3">
      <div
        v-for="invoice in invoices"
        :key="invoice.id"
        class="flex justify-between items-center p-3 border border-gray-200 rounded-md hover:bg-gray-50 cursor-pointer"
        @click="handleInvoiceClick(invoice)"
      >
        <div class="flex-1">
          <div class="flex justify-between items-start mb-1">
            <span class="font-medium text-gray-900">
              #{{ invoice.invoice_number }}
            </span>
            <InvoiceStatusBadge :status="invoice.status" />
          </div>
          <div class="text-sm text-gray-600">
            {{ formatDate(invoice.created_at) }}
          </div>
        </div>

        <div class="text-right">
          <div class="font-medium text-gray-900">
            {{ formatPrice(invoice.amount_due, invoice.currency) }}
          </div>
          <button
            v-if="invoice.status === 'paid'"
            @click.stop="downloadInvoice(invoice.id)"
            class="text-sm text-blue-600 hover:text-blue-800"
          >
            Baixar PDF
          </button>
        </div>
      </div>
    </div>

    <!-- Invoice Details Modal -->
    <InvoiceDetailsModal
      v-if="selectedInvoice"
      :invoice="selectedInvoice"
      @close="selectedInvoice = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'
import type { Invoice } from '@/types/billing'
import InvoiceStatusBadge from './InvoiceStatusBadge.vue'
import InvoiceDetailsModal from './InvoiceDetailsModal.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate, formatPrice } from '@/utils/formatters'
import { billingService } from '@/services/billingService'

interface Props {
  tenantId?: string
  limit?: number
  showHeader?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  showHeader: true
})

const store = useBillingStore()
const { invoices, loading, error } = storeToRefs(store)
const selectedInvoice = ref<Invoice | null>(null)

const handleInvoiceClick = (invoice: Invoice) => {
  selectedInvoice.value = invoice
}

const downloadInvoice = async (invoiceId: string) => {
  try {
    const blob = await billingService.downloadInvoice(invoiceId)
    
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice_${invoiceId}.pdf`
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  } catch (error) {
    console.error('Erro ao baixar fatura:', error)
  }
}

onMounted(() => {
  const filters = props.tenantId ? { tenant_id: props.tenantId, limit: props.limit } : { limit: props.limit }
  store.fetchInvoices(filters)
})
</script>
```

### 5. Seletor de Planos

```vue
<!-- components/PlanSelector.vue -->
<template>
  <ModalOverlay @close="$emit('close')">
    <div class="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
      <div class="p-6 border-b border-gray-200">
        <div class="flex justify-between items-center">
          <h2 class="text-2xl font-bold text-gray-900">Escolher Plano</h2>
          <button @click="$emit('close')" class="text-gray-400 hover:text-gray-600">
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div class="p-6 space-y-6">
        <!-- Billing Cycle Toggle -->
        <div class="flex justify-center">
          <div class="bg-gray-100 rounded-lg p-1 flex">
            <button
              @click="isYearly = false"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium',
                !isYearly ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              ]"
            >
              Mensal
            </button>
            <button
              @click="isYearly = true"
              :class="[
                'px-4 py-2 rounded-md text-sm font-medium',
                isYearly ? 'bg-white text-gray-900 shadow' : 'text-gray-600'
              ]"
            >
              Anual
              <span class="ml-1 text-green-600 text-xs">-20%</span>
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex justify-center py-8">
          <LoadingSpinner />
        </div>

        <!-- Plans Grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            v-for="plan in plans"
            :key="plan.id"
            :class="[
              'border rounded-lg p-6 cursor-pointer transition-all',
              isCurrentPlan(plan.type)
                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
            ]"
            @click="selectPlan(plan)"
          >
            <div class="text-center">
              <h3 class="text-lg font-semibold text-gray-900 mb-2">
                {{ plan.name }}
              </h3>
              <div class="text-3xl font-bold text-gray-900 mb-1">
                {{ getPlanPrice(plan) }}
              </div>
              <p class="text-sm text-gray-600 mb-4">
                por {{ isYearly ? 'ano' : 'mês' }}
              </p>
            </div>

            <ul class="space-y-2 mb-6">
              <li
                v-for="feature in plan.features"
                :key="feature"
                class="flex items-center text-sm"
              >
                <svg class="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                </svg>
                {{ feature }}
              </li>
            </ul>

            <button
              :disabled="isCurrentPlan(plan.type)"
              :class="[
                'w-full py-2 px-4 rounded-md font-medium transition-colors',
                isCurrentPlan(plan.type)
                  ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              ]"
            >
              {{ isCurrentPlan(plan.type) ? 'Plano Atual' : 'Escolher Plano' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </ModalOverlay>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'
import type { Plan, PlanType } from '@/types/billing'
import ModalOverlay from '@/components/common/ModalOverlay.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatPrice } from '@/utils/formatters'

interface Props {
  currentPlan?: PlanType
}

const props = defineProps<Props>()

const emit = defineEmits<{
  selectPlan: [planType: PlanType, isYearly: boolean]
  close: []
}>()

const store = useBillingStore()
const { plans, loading } = storeToRefs(store)
const isYearly = ref(false)

const getPlanPrice = (plan: Plan) => {
  const pricing = isYearly.value ? plan.pricing.yearly : plan.pricing.monthly
  return formatPrice(pricing.amount, pricing.currency)
}

const isCurrentPlan = (planType: PlanType) => {
  return props.currentPlan === planType
}

const selectPlan = (plan: Plan) => {
  if (!isCurrentPlan(plan.type)) {
    emit('selectPlan', plan.type, isYearly.value)
  }
}

onMounted(() => {
  store.fetchPlans()
})
</script>
```

### 6. Centro de Notificações

```vue
<!-- components/NotificationCenter.vue -->
<template>
  <div class="bg-white rounded-lg shadow-md p-6">
    <div class="flex justify-between items-center mb-4">
      <div class="flex items-center">
        <h2 class="text-xl font-semibold text-gray-900">
          Notificações
        </h2>
        <span
          v-if="unreadCount > 0"
          class="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full"
        >
          {{ unreadCount }}
        </span>
      </div>
      
      <button
        v-if="unreadCount > 0"
        @click="markAllAsRead"
        class="text-sm text-blue-600 hover:text-blue-800"
      >
        Marcar todas como lidas
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex justify-center py-8">
      <LoadingSpinner />
    </div>

    <!-- Empty State -->
    <div v-else-if="notifications.length === 0" class="text-center text-gray-600 py-8">
      Nenhuma notificação
    </div>

    <!-- Notifications List -->
    <div v-else class="space-y-3">
      <div
        v-for="notification in displayedNotifications"
        :key="notification.id"
        :class="[
          'p-3 border rounded-md cursor-pointer transition-colors',
          notification.read
            ? 'border-gray-200 bg-gray-50'
            : 'border-blue-200 bg-blue-50 hover:bg-blue-100'
        ]"
        @click="handleNotificationClick(notification)"
      >
        <div class="flex items-start space-x-3">
          <span class="text-lg">
            {{ getTypeIcon(notification.type) }}
          </span>
          
          <div class="flex-1 min-w-0">
            <div class="flex justify-between items-start mb-1">
              <h3 :class="[
                'text-sm font-medium truncate',
                notification.read ? 'text-gray-700' : 'text-gray-900'
              ]">
                {{ notification.title }}
              </h3>
              <NotificationPriorityBadge :priority="notification.priority" />
            </div>
            
            <p :class="[
              'text-sm mb-2',
              notification.read ? 'text-gray-600' : 'text-gray-700'
            ]">
              {{ notification.message }}
            </p>
            
            <p class="text-xs text-gray-500">
              {{ formatDate(notification.timestamp) }}
            </p>
          </div>
        </div>
      </div>
      
      <button
        v-if="!showAll && notifications.length > maxItems"
        @click="showAll = true"
        class="w-full py-2 text-sm text-blue-600 hover:text-blue-800"
      >
        Ver todas as notificações ({{ notifications.length - maxItems }} restantes)
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useBillingStore } from '@/stores/billing'
import { storeToRefs } from 'pinia'
import type { Notification } from '@/types/billing'
import NotificationPriorityBadge from './NotificationPriorityBadge.vue'
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { formatDate } from '@/utils/formatters'

interface Props {
  tenantId: string
  maxItems?: number
}

const props = withDefaults(defineProps<Props>(), {
  maxItems: 5
})

const store = useBillingStore()
const { notifications, unreadCount, loading } = storeToRefs(store)
const showAll = ref(false)

const displayedNotifications = computed(() => {
  return showAll.value ? notifications.value : notifications.value.slice(0, props.maxItems)
})

const getTypeIcon = (type: string) => {
  const icons = {
    payment_success: '✅',
    payment_failed: '❌',
    usage_alert: '⚠️',
    invoice_created: '📄',
    subscription_updated: '🔄'
  }
  return icons[type] || '📢'
}

const handleNotificationClick = (notification: Notification) => {
  if (!notification.read) {
    store.markNotificationAsRead(notification.id)
  }
}

const markAllAsRead = () => {
  store.markAllNotificationsAsRead()
}

onMounted(() => {
  store.fetchNotifications({ tenant_id: props.tenantId })
})
</script>
```

## Componentes Auxiliares

### 1. Modal Overlay

```vue
<!-- components/common/ModalOverlay.vue -->
<template>
  <teleport to="body">
    <div class="fixed inset-0 z-50 overflow-y-auto">
      <div class="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div 
          class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          @click="$emit('close')"
        />

        <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle">
          <slot />
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const emit = defineEmits<{
  close: []
}>()

const handleEscape = (e: KeyboardEvent) => {
  if (e.key === 'Escape') {
    emit('close')
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleEscape)
  document.body.style.overflow = 'hidden'
})

onUnmounted(() => {
  document.removeEventListener('keydown', handleEscape)
  document.body.style.overflow = ''
})
</script>
```

### 2. Loading Spinner

```vue
<!-- components/common/LoadingSpinner.vue -->
<template>
  <div :class="spinnerClass" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface Props {
  size?: 'sm' | 'md' | 'lg'
  color?: string
}

const props = withDefaults(defineProps<Props>(), {
  size: 'md',
  color: 'blue-600'
})

const spinnerClass = computed(() => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  }

  return `animate-spin rounded-full border-b-2 border-${props.color} ${sizeClasses[props.size]}`
})
</script>
```

## Utilitários

### 1. Formatadores

```ts
// utils/formatters.ts
export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency
  }).format(amount / 100)
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleString('pt-BR')
}

export function formatUsage(usage: number, unit: string): string {
  if (usage < 1000) {
    return `${usage} ${unit}`
  }
  
  if (usage < 1000000) {
    return `${(usage / 1000).toFixed(1)}K ${unit}`
  }
  
  return `${(usage / 1000000).toFixed(1)}M ${unit}`
}
```

## Exemplo de Uso no App Principal

```vue
<!-- App.vue -->
<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBillingStore } from '@/stores/billing'

const billingStore = useBillingStore()

onMounted(() => {
  // Configurar token de autenticação
  const token = localStorage.getItem('auth_token')
  if (token) {
    billingService.setAuthToken(token)
  }
})
</script>
```

Esta implementação Vue.js fornece uma arquitetura robusta e reativa para consumir toda a API de Billing, com gerenciamento de estado centralizado via Pinia e componentes modulares reutilizáveis.
