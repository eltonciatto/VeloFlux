import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { ArrowUpIcon, ArrowDownIcon, TrendingUpIcon, UsersIcon, DollarSignIcon, ActivityIcon } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface TenantMetrics {
  id: string;
  name: string;
  plan: string;
  users: number;
  revenue: number;
  growth: number;
  healthScore: number;
  uptime: number;
  requests: number;
  responseTime: number;
  satisfaction: number;
}

interface ComparisonMetric {
  label: string;
  key: keyof TenantMetrics;
  format: (value: string | number) => string;
  trend?: boolean;
}

const mockTenants: TenantMetrics[] = [
  {
    id: '1',
    name: 'Enterprise Corp',
    plan: 'Enterprise',
    users: 1250,
    revenue: 15000,
    growth: 12.5,
    healthScore: 98,
    uptime: 99.9,
    requests: 2500000,
    responseTime: 45,
    satisfaction: 4.8
  },
  {
    id: '2',
    name: 'StartupXYZ',
    plan: 'Premium',
    users: 85,
    revenue: 850,
    growth: 25.3,
    healthScore: 95,
    uptime: 99.5,
    requests: 150000,
    responseTime: 38,
    satisfaction: 4.6
  },
  {
    id: '3',
    name: 'TechFlow Inc',
    plan: 'Premium',
    users: 320,
    revenue: 3200,
    growth: -2.1,
    healthScore: 92,
    uptime: 99.2,
    requests: 580000,
    responseTime: 52,
    satisfaction: 4.3
  }
];

const comparisonMetrics: ComparisonMetric[] = [
  { label: 'Usuários', key: 'users', format: (v) => v.toLocaleString() },
  { label: 'Receita', key: 'revenue', format: (v) => `$${v.toLocaleString()}` },
  { label: 'Crescimento', key: 'growth', format: (v) => `${v > 0 ? '+' : ''}${v}%`, trend: true },
  { label: 'Saúde', key: 'healthScore', format: (v) => `${v}%` },
  { label: 'Uptime', key: 'uptime', format: (v) => `${v}%` },
  { label: 'Requisições', key: 'requests', format: (v) => `${(v / 1000000).toFixed(1)}M` },
  { label: 'Tempo Resp.', key: 'responseTime', format: (v) => `${v}ms` },
  { label: 'Satisfação', key: 'satisfaction', format: (v) => `${v}/5.0` }
];

export const TenantComparison: React.FC = () => {
  const { t } = useTranslation();
  const [selectedTenants, setSelectedTenants] = useState<string[]>(['1', '2']);
  const [comparisonMode, setComparisonMode] = useState<'side-by-side' | 'overlay'>('side-by-side');

  const selectedTenantData = selectedTenants.map(id => 
    mockTenants.find(tenant => tenant.id === id)!
  ).filter(Boolean);

  const chartData = comparisonMetrics.map(metric => ({
    metric: metric.label,
    ...selectedTenantData.reduce((acc, tenant) => ({
      ...acc,
      [tenant.name]: tenant[metric.key]
    }), {})
  }));

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUpIcon className="w-4 h-4 text-green-500" />;
    if (value < 0) return <ArrowDownIcon className="w-4 h-4 text-red-500" />;
    return <div className="w-4 h-4" />;
  };

  const getMetricColor = (tenant: TenantMetrics, metric: ComparisonMetric) => {
    const allValues = mockTenants.map(t => t[metric.key] as number);
    const value = tenant[metric.key] as number;
    const max = Math.max(...allValues);
    const min = Math.min(...allValues);
    
    if (value === max) return 'text-green-600 bg-green-50';
    if (value === min) return 'text-red-600 bg-red-50';
    return 'text-gray-600 bg-gray-50';
  };

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Comparação de Tenants</h2>
          <p className="text-gray-600 mt-1">Compare métricas e performance entre diferentes tenants</p>
        </div>
        
        <div className="flex gap-4">
          <Select value={comparisonMode} onValueChange={(value: string) => setComparisonMode(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="side-by-side">Lado a Lado</SelectItem>
              <SelectItem value="overlay">Sobreposição</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tenant Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Tenants para Comparação</CardTitle>
          <CardDescription>Escolha até 4 tenants para comparar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {mockTenants.map(tenant => {
              const isSelected = selectedTenants.includes(tenant.id);
              return (
                <div
                  key={tenant.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => {
                    if (isSelected) {
                      setSelectedTenants(prev => prev.filter(id => id !== tenant.id));
                    } else if (selectedTenants.length < 4) {
                      setSelectedTenants(prev => [...prev, tenant.id]);
                    }
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold">{tenant.name}</h3>
                    <Badge variant={isSelected ? 'default' : 'secondary'}>
                      {tenant.plan}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <UsersIcon className="w-4 h-4" />
                      {tenant.users}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSignIcon className="w-4 h-4" />
                      ${tenant.revenue.toLocaleString()}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedTenantData.length >= 2 && (
        <>
          {/* Metrics Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Métricas</CardTitle>
              <CardDescription>Comparação detalhada de métricas chave</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-semibold">Métrica</th>
                      {selectedTenantData.map(tenant => (
                        <th key={tenant.id} className="text-center py-3 px-4 font-semibold">
                          {tenant.name}
                          <Badge variant="outline" className="ml-2">{tenant.plan}</Badge>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonMetrics.map(metric => (
                      <tr key={metric.key} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4 font-medium">{metric.label}</td>
                        {selectedTenantData.map(tenant => {
                          const value = tenant[metric.key] as number;
                          return (
                            <td key={tenant.id} className="py-3 px-4 text-center">
                              <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${getMetricColor(tenant, metric)}`}>
                                {metric.format(value)}
                                {metric.trend && getTrendIcon(value)}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Comparison */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Performance</CardTitle>
                <CardDescription>Métricas de performance por tenant</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData.slice(0, 4)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="metric" />
                    <YAxis />
                    <Tooltip />
                    {selectedTenantData.map((tenant, index) => (
                      <Bar 
                        key={tenant.id}
                        dataKey={tenant.name}
                        fill={`hsl(${index * 60 + 220}, 70%, 50%)`}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Growth Trends */}
            <Card>
              <CardHeader>
                <CardTitle>Tendências de Crescimento</CardTitle>
                <CardDescription>Comparação de crescimento ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={[
                    { month: 'Jan', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: Math.random() * 20 + 10 }), {}) },
                    { month: 'Feb', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: Math.random() * 20 + 15 }), {}) },
                    { month: 'Mar', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: Math.random() * 20 + 12 }), {}) },
                    { month: 'Abr', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: Math.random() * 20 + 18 }), {}) },
                    { month: 'Mai', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: Math.random() * 20 + 22 }), {}) },
                    { month: 'Jun', ...selectedTenantData.reduce((acc, t, i) => ({ ...acc, [t.name]: t.growth + 10 }), {}) }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    {selectedTenantData.map((tenant, index) => (
                      <Line 
                        key={tenant.id}
                        type="monotone" 
                        dataKey={tenant.name}
                        stroke={`hsl(${index * 60 + 220}, 70%, 50%)`}
                        strokeWidth={2}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Summary Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUpIcon className="w-5 h-5" />
                Insights da Comparação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="p-4 bg-green-50 rounded-lg">
                  <h4 className="font-semibold text-green-800 mb-2">Melhor Performance</h4>
                  <p className="text-green-700 text-sm">
                    {selectedTenantData.reduce((best, current) => 
                      current.healthScore > best.healthScore ? current : best
                    ).name} lidera em saúde geral do sistema
                  </p>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">Maior Crescimento</h4>
                  <p className="text-blue-700 text-sm">
                    {selectedTenantData.reduce((best, current) => 
                      current.growth > best.growth ? current : best
                    ).name} tem o crescimento mais acelerado
                  </p>
                </div>
                
                <div className="p-4 bg-orange-50 rounded-lg">
                  <h4 className="font-semibold text-orange-800 mb-2">Maior Receita</h4>
                  <p className="text-orange-700 text-sm">
                    {selectedTenantData.reduce((best, current) => 
                      current.revenue > best.revenue ? current : best
                    ).name} gera a maior receita mensal
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default TenantComparison;
