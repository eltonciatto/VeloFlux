# 🎨 Componentes React para Consumo da API de IA

Este documento complementa o guia principal fornecendo exemplos específicos de componentes React para integração com a API de IA do VeloFlux.

## 📦 Instalação de Dependências

```bash
npm install axios recharts react-query @emotion/react @emotion/styled
```

## 🔧 Configuração Base

### Hook personalizado para API de IA

```typescript
// hooks/useAIAPI.ts
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8080';

interface AIClient {
  get: (endpoint: string, params?: any) => Promise<any>;
  post: (endpoint: string, data?: any) => Promise<any>;
  put: (endpoint: string, data?: any) => Promise<any>;
  delete: (endpoint: string) => Promise<any>;
}

export const createAIClient = (token?: string): AIClient => {
  const axiosInstance = axios.create({
    baseURL: `${API_BASE}/api/ai`,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });

  return {
    get: (endpoint, params) => axiosInstance.get(endpoint, { params }).then(res => res.data),
    post: (endpoint, data) => axiosInstance.post(endpoint, data).then(res => res.data),
    put: (endpoint, data) => axiosInstance.put(endpoint, data).then(res => res.data),
    delete: (endpoint) => axiosInstance.delete(endpoint).then(res => res.data),
  };
};

export const useAIAPI = (token?: string) => {
  return createAIClient(token);
};

// Hooks específicos para diferentes endpoints
export const useAIStatus = (token?: string) => {
  const client = useAIAPI(token);
  
  return useQuery(
    'ai-status',
    () => client.get('/status'),
    {
      refetchInterval: 5000, // Atualiza a cada 5 segundos
      staleTime: 3000,
    }
  );
};

export const useAIMetrics = (token?: string) => {
  const client = useAIAPI(token);
  
  return useQuery(
    'ai-metrics',
    () => client.get('/metrics'),
    {
      refetchInterval: 10000, // Atualiza a cada 10 segundos
      staleTime: 5000,
    }
  );
};

export const useAIConfig = (token?: string) => {
  const client = useAIAPI(token);
  const queryClient = useQueryClient();
  
  const query = useQuery('ai-config', () => client.get('/config'));
  
  const mutation = useMutation(
    (newConfig: any) => client.put('/config', newConfig),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('ai-config');
        queryClient.invalidateQueries('ai-status');
      },
    }
  );
  
  return {
    ...query,
    updateConfig: mutation.mutate,
    isUpdating: mutation.isLoading,
  };
};
```

## 🏠 Componentes Dashboard

### Status Card

```tsx
// components/AIStatusCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Brain, Zap } from 'lucide-react';
import { useAIStatus } from '../hooks/useAIAPI';

interface AIStatusCardProps {
  token?: string;
}

export const AIStatusCard: React.FC<AIStatusCardProps> = ({ token }) => {
  const { data: status, isLoading, error } = useAIStatus(token);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-red-500">Erro ao carregar status da IA</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Status da IA</CardTitle>
        <Brain className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">Status:</span>
            <Badge 
              variant={status?.enabled ? "success" : "secondary"}
              className="ml-2"
            >
              {status?.enabled ? "Ativo" : "Inativo"}
            </Badge>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Algoritmo:</span>
            <span className="text-sm font-medium">{status?.current_algorithm}</span>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm">Saúde:</span>
            <div className="flex items-center">
              <Activity className="h-3 w-3 text-green-500 mr-1" />
              <span className="text-sm">{status?.health}</span>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground">
            Atualizado: {new Date(status?.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
```

### Métricas de Performance

```tsx
// components/AIMetricsCard.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, Target, Clock } from 'lucide-react';
import { useAIMetrics } from '../hooks/useAIAPI';

interface AIMetricsCardProps {
  token?: string;
}

export const AIMetricsCard: React.FC<AIMetricsCardProps> = ({ token }) => {
  const { data: metrics, isLoading, error } = useAIMetrics(token);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) return <div>Erro ao carregar métricas</div>;

  const prediction = metrics?.prediction_data;
  const models = metrics?.model_performance || {};

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Métricas de Performance
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Predição Atual */}
        {prediction && (
          <div className="space-y-2">
            <h4 className="font-medium flex items-center">
              <Target className="h-4 w-4 mr-2" />
              Predição Atual
            </h4>
            <div className="bg-blue-50 p-3 rounded-lg space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Algoritmo:</span>
                <span className="text-sm font-medium">{prediction.recommended_algorithm}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Confiança:</span>
                <span className="text-sm font-medium">
                  {(prediction.confidence * 100).toFixed(1)}%
                </span>
              </div>
              <Progress value={prediction.confidence * 100} className="h-2" />
              <div className="flex justify-between">
                <span className="text-sm">Carga Prevista:</span>
                <span className="text-sm font-medium">{prediction.predicted_load.toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Performance dos Modelos */}
        <div className="space-y-2">
          <h4 className="font-medium">Modelos Ativos</h4>
          {Object.entries(models).map(([name, model]: [string, any]) => (
            <div key={name} className="border rounded-lg p-3 space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium text-sm">{name}</span>
                <Badge variant="outline">{model.version}</Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-xs">Precisão:</span>
                <span className="text-xs">{(model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <Progress value={model.accuracy * 100} className="h-1" />
              <div className="text-xs text-muted-foreground flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                Treino: {new Date(model.last_trained).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
```

### Gráfico de Comparação de Algoritmos

```tsx
// components/AlgorithmComparisonChart.tsx
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useQuery } from 'react-query';
import { useAIAPI } from '../hooks/useAIAPI';

interface AlgorithmComparisonChartProps {
  token?: string;
}

export const AlgorithmComparisonChart: React.FC<AlgorithmComparisonChartProps> = ({ token }) => {
  const client = useAIAPI(token);
  
  const { data: comparison, isLoading } = useQuery(
    'algorithm-comparison',
    () => client.get('/algorithm-comparison'),
    { refetchInterval: 30000 }
  );

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Algoritmos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gray-100 animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const chartData = Object.entries(comparison || {}).map(([name, stats]: [string, any]) => ({
    name: name.replace('_', ' ').toUpperCase(),
    'Tempo Médio (ms)': stats.avg_response_time,
    'Taxa de Sucesso (%)': stats.success_rate * 100,
    'Requisições': stats.request_count,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparação de Algoritmos</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="Tempo Médio (ms)" fill="#8884d8" />
            <Bar dataKey="Taxa de Sucesso (%)" fill="#82ca9d" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
```

## ⚙️ Configuração da IA

### Formulário de Configuração

```tsx
// components/AIConfigForm.tsx
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Settings, Save, RefreshCw } from 'lucide-react';
import { useAIConfig } from '../hooks/useAIAPI';
import { toast } from 'react-hot-toast';

interface AIConfigFormProps {
  token?: string;
}

export const AIConfigForm: React.FC<AIConfigFormProps> = ({ token }) => {
  const { data: config, updateConfig, isUpdating, isLoading } = useAIConfig(token);
  const [formData, setFormData] = useState(config || {});

  React.useEffect(() => {
    if (config) {
      setFormData(config);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await updateConfig(formData);
      toast.success('Configuração atualizada com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar configuração');
    }
  };

  const handleReset = () => {
    setFormData(config || {});
    toast.info('Configuração resetada');
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 bg-gray-200 rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Settings className="h-5 w-5 mr-2" />
          Configuração da IA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Habilitar IA */}
          <div className="flex items-center justify-between">
            <Label htmlFor="enabled">Habilitar IA</Label>
            <Switch
              id="enabled"
              checked={formData.enabled || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, enabled: checked }))
              }
            />
          </div>

          {/* Tipo de Modelo */}
          <div className="space-y-2">
            <Label>Tipo de Modelo</Label>
            <Select
              value={formData.model_type || 'neural_network'}
              onValueChange={(value) => 
                setFormData(prev => ({ ...prev, model_type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo de modelo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="neural_network">Rede Neural</SelectItem>
                <SelectItem value="decision_tree">Árvore de Decisão</SelectItem>
                <SelectItem value="random_forest">Random Forest</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Limite de Confiança */}
          <div className="space-y-2">
            <Label>
              Limite de Confiança: {(formData.confidence_threshold * 100 || 80).toFixed(0)}%
            </Label>
            <Slider
              value={[formData.confidence_threshold * 100 || 80]}
              onValueChange={([value]) => 
                setFormData(prev => ({ ...prev, confidence_threshold: value / 100 }))
              }
              min={50}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Taxa de Aprendizado */}
          <div className="space-y-2">
            <Label>
              Taxa de Aprendizado: {(formData.learning_rate || 0.001).toFixed(4)}
            </Label>
            <Slider
              value={[formData.learning_rate * 10000 || 10]}
              onValueChange={([value]) => 
                setFormData(prev => ({ ...prev, learning_rate: value / 10000 }))
              }
              min={1}
              max={100}
              step={1}
              className="w-full"
            />
          </div>

          {/* Consciente da Aplicação */}
          <div className="flex items-center justify-between">
            <Label htmlFor="application_aware">Consciente da Aplicação</Label>
            <Switch
              id="application_aware"
              checked={formData.application_aware || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, application_aware: checked }))
              }
            />
          </div>

          {/* Escalonamento Preditivo */}
          <div className="flex items-center justify-between">
            <Label htmlFor="predictive_scaling">Escalonamento Preditivo</Label>
            <Switch
              id="predictive_scaling"
              checked={formData.predictive_scaling || false}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, predictive_scaling: checked }))
              }
            />
          </div>

          {/* Botões */}
          <div className="flex space-x-2">
            <Button type="submit" disabled={isUpdating} className="flex-1">
              {isUpdating ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
            <Button type="button" variant="outline" onClick={handleReset}>
              Resetar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};
```

## 📊 Dashboard Principal

### Componente Principal

```tsx
// components/AIDashboard.tsx
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Brain, BarChart3, Settings, History } from 'lucide-react';
import { AIStatusCard } from './AIStatusCard';
import { AIMetricsCard } from './AIMetricsCard';
import { AlgorithmComparisonChart } from './AlgorithmComparisonChart';
import { AIConfigForm } from './AIConfigForm';
import { AIHistoryChart } from './AIHistoryChart';

interface AIDashboardProps {
  token?: string;
}

export const AIDashboard: React.FC<AIDashboardProps> = ({ token }) => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold flex items-center">
          <Brain className="h-8 w-8 mr-3" />
          Dashboard de IA
        </h1>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            Visão Geral
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            Análises
          </TabsTrigger>
          <TabsTrigger value="config" className="flex items-center">
            <Settings className="h-4 w-4 mr-2" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="models" className="flex items-center">
            <Brain className="h-4 w-4 mr-2" />
            Modelos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AIStatusCard token={token} />
            <AIMetricsCard token={token} />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <AlgorithmComparisonChart token={token} />
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <AIHistoryChart token={token} />
        </TabsContent>

        <TabsContent value="config" className="space-y-6">
          <div className="max-w-2xl">
            <AIConfigForm token={token} />
          </div>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <div className="text-center text-muted-foreground">
            Gestão de modelos em desenvolvimento...
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
```

## 🔔 Sistema de Notificações

### Hook para Notificações de IA

```tsx
// hooks/useAINotifications.ts
import { useEffect, useRef } from 'react';
import { useQuery } from 'react-query';
import { toast } from 'react-hot-toast';
import { useAIAPI } from './useAIAPI';

interface NotificationThresholds {
  accuracy: number;
  confidence: number;
  errorRate: number;
}

export const useAINotifications = (
  token?: string,
  thresholds: NotificationThresholds = {
    accuracy: 0.85,
    confidence: 0.8,
    errorRate: 0.05
  }
) => {
  const client = useAIAPI(token);
  const lastMetrics = useRef<any>(null);

  const { data: metrics } = useQuery(
    'ai-metrics-notifications',
    () => client.get('/metrics'),
    {
      refetchInterval: 30000, // Verifica a cada 30 segundos
      enabled: !!token,
    }
  );

  useEffect(() => {
    if (!metrics || !lastMetrics.current) {
      lastMetrics.current = metrics;
      return;
    }

    // Verificar queda de precisão
    Object.entries(metrics.model_performance || {}).forEach(([name, model]: [string, any]) => {
      const lastModel = lastMetrics.current?.model_performance?.[name];
      
      if (model.accuracy < thresholds.accuracy && 
          (!lastModel || lastModel.accuracy >= thresholds.accuracy)) {
        toast.error(
          `Precisão baixa detectada no modelo ${name}: ${(model.accuracy * 100).toFixed(1)}%`,
          { duration: 8000 }
        );
      }
    });

    // Verificar confiança baixa
    if (metrics.prediction_data?.confidence < thresholds.confidence &&
        lastMetrics.current?.prediction_data?.confidence >= thresholds.confidence) {
      toast.warning(
        `Confiança baixa na predição: ${(metrics.prediction_data.confidence * 100).toFixed(1)}%`,
        { duration: 6000 }
      );
    }

    // Verificar alta taxa de erro
    Object.entries(metrics.algorithm_stats || {}).forEach(([algorithm, stats]: [string, any]) => {
      const lastStats = lastMetrics.current?.algorithm_stats?.[algorithm];
      
      if (stats.error_rate > thresholds.errorRate &&
          (!lastStats || lastStats.error_rate <= thresholds.errorRate)) {
        toast.error(
          `Taxa de erro alta no algoritmo ${algorithm}: ${(stats.error_rate * 100).toFixed(1)}%`,
          { duration: 8000 }
        );
      }
    });

    lastMetrics.current = metrics;
  }, [metrics, thresholds]);

  return {
    setThresholds: (newThresholds: Partial<NotificationThresholds>) => {
      Object.assign(thresholds, newThresholds);
    }
  };
};
```

## 🚀 App Principal

```tsx
// App.tsx
import React from 'react';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AIDashboard } from './components/AIDashboard';
import { useAINotifications } from './hooks/useAINotifications';

const queryClient = new QueryClient();

const AppContent: React.FC = () => {
  const token = localStorage.getItem('jwt_token');
  
  // Ativar sistema de notificações
  useAINotifications(token);

  return (
    <div className="min-h-screen bg-gray-50">
      <AIDashboard token={token} />
      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
        }}
      />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
};

export default App;
```

## 📚 Exemplo de Uso Completo

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
echo "REACT_APP_API_BASE=http://localhost:8080" > .env.local

# Executar aplicação
npm start
```

Estes componentes React fornecem uma interface completa e moderna para consumir a API de IA do VeloFlux, incluindo:

- ✅ **Status em tempo real** com atualizações automáticas
- ✅ **Gráficos interativos** para visualização de dados
- ✅ **Formulários dinâmicos** para configuração
- ✅ **Sistema de notificações** inteligente
- ✅ **Tratamento de erros** robusto
- ✅ **Design responsivo** e moderno

### Próximos Passos:
1. Adicionar testes unitários para os componentes
2. Implementar componentes para gestão de modelos
3. Criar visualizações avançadas com D3.js
4. Adicionar suporte a WebSocket para atualizações em tempo real
