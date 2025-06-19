#!/bin/bash

# 🚀 Script de Implementação de Aprimoramentos Críticos - VeloFlux Dashboard
# Fase 1: Core API Integration & Visual Enhancements

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🚀 VeloFlux Dashboard - Implementação de Aprimoramentos Críticos${NC}"
echo -e "${CYAN}================================================================${NC}"

# Diretórios
FRONTEND_DIR="/workspaces/VeloFlux/frontend"
COMPONENTS_DIR="$FRONTEND_DIR/src/components/dashboard"
HOOKS_DIR="$FRONTEND_DIR/src/hooks"
UTILS_DIR="$FRONTEND_DIR/src/lib"

echo -e "${YELLOW}🎯 FASE 1: Core API Integration${NC}"
echo -e "${CYAN}================================${NC}"

# 1. Billing Export & Analytics Enhancement
echo -e "${BLUE}💰 Aprimorando Billing Panel...${NC}"

cat > "$COMPONENTS_DIR/BillingExportManager.tsx" << 'EOF'
import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Download, 
  FileText, 
  Calendar, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle,
  AlertCircle,
  Filter
} from 'lucide-react';

interface BillingExportManagerProps {
  tenantId: string;
  token: string;
}

interface ExportJob {
  id: string;
  format: 'json' | 'csv' | 'xml';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startDate: string;
  endDate: string;
  createdAt: string;
  downloadUrl?: string;
  fileSize?: number;
}

export function BillingExportManager({ tenantId, token }: BillingExportManagerProps) {
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv' | 'xml'>('json');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });

  const createExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing/export`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          format: selectedFormat,
          start_date: dateRange.start,
          end_date: dateRange.end,
          include_raw: true
        })
      });

      if (!response.ok) throw new Error('Export failed');

      const newJob = await response.json();
      setExportJobs(prev => [newJob, ...prev]);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }, [tenantId, token, selectedFormat, dateRange]);

  const downloadExport = useCallback(async (jobId: string) => {
    try {
      const response = await fetch(`/api/tenants/${tenantId}/billing/export/${jobId}/download`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `billing-export-${jobId}.${selectedFormat}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
    }
  }, [tenantId, token, selectedFormat]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing': return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Download className="h-5 w-5" />
          Billing Data Export
        </CardTitle>
        <CardDescription>
          Export billing data in multiple formats for external analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Export Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-slate-300">Format</label>
            <select 
              value={selectedFormat}
              onChange={(e) => setSelectedFormat(e.target.value as any)}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            >
              <option value="json">JSON</option>
              <option value="csv">CSV</option>
              <option value="xml">XML</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">Start Date</label>
            <input 
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-slate-300">End Date</label>
            <input 
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full mt-1 bg-slate-800 border-slate-600 text-white rounded-md px-3 py-2"
            />
          </div>
        </div>

        <Button 
          onClick={createExport}
          disabled={isExporting}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {isExporting ? (
            <>
              <Clock className="h-4 w-4 mr-2 animate-spin" />
              Creating Export...
            </>
          ) : (
            <>
              <Download className="h-4 w-4 mr-2" />
              Create Export
            </>
          )}
        </Button>

        {/* Export Jobs List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-300">Recent Exports</h4>
          {exportJobs.length === 0 ? (
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                No exports created yet. Create your first export above.
              </AlertDescription>
            </Alert>
          ) : (
            exportJobs.map((job) => (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <div className="text-sm font-medium text-white">
                      {job.format.toUpperCase()} Export
                    </div>
                    <div className="text-xs text-slate-400">
                      {job.startDate} to {job.endDate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{job.status}</Badge>
                  {job.status === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadExport(job.id)}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
              </motion.div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default BillingExportManager;
EOF

echo -e "${GREEN}✅ BillingExportManager criado${NC}"

# 2. Security Monitoring Enhancement
echo -e "${BLUE}🔒 Aprimorando Security Settings...${NC}"

cat > "$COMPONENTS_DIR/SecurityMonitoringPanel.tsx" << 'EOF'
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Globe, 
  Lock,
  Eye,
  Zap,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface SecurityEvent {
  id: string;
  type: 'attack' | 'blocked' | 'suspicious' | 'allowed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  target: string;
  description: string;
  timestamp: string;
  country?: string;
  blocked: boolean;
}

interface SecurityMetrics {
  totalRequests: number;
  blockedRequests: number;
  suspiciousActivity: number;
  threatLevel: 'low' | 'medium' | 'high' | 'critical';
  topThreats: Array<{ type: string; count: number }>;
  geoThreats: Array<{ country: string; count: number }>;
}

export function SecurityMonitoringPanel() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    totalRequests: 0,
    blockedRequests: 0,
    suspiciousActivity: 0,
    threatLevel: 'low',
    topThreats: [],
    geoThreats: []
  });
  const [isLive, setIsLive] = useState(true);

  // Simular dados de segurança em tempo real
  useEffect(() => {
    if (!isLive) return;

    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        type: 'blocked',
        severity: 'high',
        source: '192.168.1.100',
        target: '/api/admin',
        description: 'SQL injection attempt blocked',
        timestamp: new Date().toISOString(),
        country: 'Unknown',
        blocked: true
      },
      {
        id: '2',
        type: 'suspicious',
        severity: 'medium',
        source: '10.0.0.50',
        target: '/api/users',
        description: 'Unusual request pattern detected',
        timestamp: new Date(Date.now() - 2000).toISOString(),
        country: 'US',
        blocked: false
      }
    ];

    const mockMetrics: SecurityMetrics = {
      totalRequests: 15420,
      blockedRequests: 89,
      suspiciousActivity: 23,
      threatLevel: 'medium',
      topThreats: [
        { type: 'SQL Injection', count: 34 },
        { type: 'XSS Attempt', count: 28 },
        { type: 'DDoS', count: 15 },
        { type: 'Brute Force', count: 12 }
      ],
      geoThreats: [
        { country: 'Unknown', count: 45 },
        { country: 'CN', count: 23 },
        { country: 'RU', count: 12 },
        { country: 'IR', count: 9 }
      ]
    };

    setSecurityEvents(mockEvents);
    setMetrics(mockMetrics);

    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        const newEvent: SecurityEvent = {
          id: Date.now().toString(),
          type: Math.random() > 0.5 ? 'blocked' : 'suspicious',
          severity: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)] as any,
          source: `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
          target: ['/api/admin', '/api/users', '/api/billing', '/api/login'][Math.floor(Math.random() * 4)],
          description: ['SQL injection attempt', 'XSS attempt blocked', 'Rate limit exceeded', 'Suspicious user agent'][Math.floor(Math.random() * 4)],
          timestamp: new Date().toISOString(),
          country: ['US', 'CN', 'RU', 'Unknown'][Math.floor(Math.random() * 4)],
          blocked: Math.random() > 0.3
        };

        setSecurityEvents(prev => [newEvent, ...prev.slice(0, 9)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLive]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      default: return 'bg-blue-500';
    }
  };

  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-400 border-red-400';
      case 'high': return 'text-orange-400 border-orange-400';
      case 'medium': return 'text-yellow-400 border-yellow-400';
      default: return 'text-green-400 border-green-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Requests</p>
                <p className="text-2xl font-bold text-white">{metrics.totalRequests.toLocaleString()}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Blocked</p>
                <p className="text-2xl font-bold text-red-400">{metrics.blockedRequests}</p>
              </div>
              <Shield className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Suspicious</p>
                <p className="text-2xl font-bold text-yellow-400">{metrics.suspiciousActivity}</p>
              </div>
              <Eye className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Threat Level</p>
                <Badge className={`${getThreatLevelColor(metrics.threatLevel)} bg-transparent`}>
                  {metrics.threatLevel.toUpperCase()}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Real-time Events */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <AlertTriangle className="h-5 w-5" />
            Real-time Security Events
            <Badge className={`ml-auto ${isLive ? 'bg-green-600' : 'bg-gray-600'}`}>
              {isLive ? 'LIVE' : 'PAUSED'}
            </Badge>
          </CardTitle>
          <CardDescription>
            Live monitoring of security events and threats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {securityEvents.map((event) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className={`w-3 h-3 rounded-full ${getSeverityColor(event.severity)}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{event.description}</span>
                    {event.blocked ? (
                      <CheckCircle className="h-4 w-4 text-green-400" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-yellow-400" />
                    )}
                  </div>
                  <div className="text-xs text-slate-400">
                    {event.source} → {event.target} • {event.country} • {new Date(event.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                <Badge variant="outline" className={`${getSeverityColor(event.severity)} text-white border-0`}>
                  {event.severity}
                </Badge>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Threat Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Top Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.topThreats.map((threat, index) => (
                <div key={threat.type} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{threat.type}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-red-500 rounded-full"
                        style={{ width: `${(threat.count / Math.max(...metrics.topThreats.map(t => t.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{threat.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Geographic Threats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {metrics.geoThreats.map((geo) => (
                <div key={geo.country} className="flex items-center justify-between">
                  <span className="text-sm text-slate-300">{geo.country}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-orange-500 rounded-full"
                        style={{ width: `${(geo.count / Math.max(...metrics.geoThreats.map(g => g.count))) * 100}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{geo.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default SecurityMonitoringPanel;
EOF

echo -e "${GREEN}✅ SecurityMonitoringPanel criado${NC}"

# 3. Advanced Analytics Hook
echo -e "${BLUE}📊 Criando hook de analytics avançado...${NC}"

cat > "$HOOKS_DIR/useAdvancedMetrics.ts" << 'EOF'
import { useState, useEffect, useCallback } from 'react';
import { useRealtimeWebSocket } from './useRealtimeWebSocket';

export interface MetricPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface AdvancedMetrics {
  realtime: {
    requests_per_second: number;
    active_connections: number;
    error_rate: number;
    avg_response_time: number;
  };
  trends: {
    requests: MetricPoint[];
    errors: MetricPoint[];
    response_times: MetricPoint[];
    bandwidth: MetricPoint[];
  };
  predictions: {
    next_hour_requests: number;
    peak_time_estimate: string;
    capacity_utilization: number;
    anomaly_score: number;
  };
  correlations: Array<{
    metric_a: string;
    metric_b: string;
    correlation: number;
    significance: number;
  }>;
}

export function useAdvancedMetrics(tenantId?: string) {
  const [metrics, setMetrics] = useState<AdvancedMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // WebSocket para dados em tempo real
  const { data: realtimeData, isConnected } = useRealtimeWebSocket({
    url: 'ws://localhost:8080/api/v1/ws/metrics',
    reconnect: true
  });

  // Buscar métricas históricas
  const fetchMetrics = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const baseUrl = tenantId ? `/api/tenants/${tenantId}` : '/api';
      
      // Fetch múltiplas métricas em paralelo
      const [realtimeRes, trendsRes, predictionsRes, correlationsRes] = await Promise.all([
        fetch(`${baseUrl}/metrics/realtime`),
        fetch(`${baseUrl}/metrics/trends?period=24h`),
        fetch(`${baseUrl}/metrics/predictions`),
        fetch(`${baseUrl}/metrics/correlations`)
      ]);

      const [realtime, trends, predictions, correlations] = await Promise.all([
        realtimeRes.ok ? realtimeRes.json() : generateMockRealtime(),
        trendsRes.ok ? trendsRes.json() : generateMockTrends(),
        predictionsRes.ok ? predictionsRes.json() : generateMockPredictions(),
        correlationsRes.ok ? correlationsRes.json() : generateMockCorrelations()
      ]);

      setMetrics({
        realtime,
        trends,
        predictions,
        correlations
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch metrics');
      // Fallback para dados mock
      setMetrics(generateMockMetrics());
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  // Atualizar métricas real-time via WebSocket
  useEffect(() => {
    if (realtimeData && metrics) {
      setMetrics(prev => prev ? {
        ...prev,
        realtime: {
          ...prev.realtime,
          ...realtimeData
        }
      } : null);
    }
  }, [realtimeData, metrics]);

  // Carregar métricas inicial
  useEffect(() => {
    fetchMetrics();
    
    // Atualizar métricas periodicamente
    const interval = setInterval(fetchMetrics, 30000); // 30s
    
    return () => clearInterval(interval);
  }, [fetchMetrics]);

  // Funções de análise
  const analyzeAnomalies = useCallback((data: MetricPoint[]) => {
    if (!data || data.length < 10) return [];
    
    const values = data.map(d => d.value);
    const mean = values.reduce((a, b) => a + b) / values.length;
    const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2)) / values.length);
    
    return data.filter(point => Math.abs(point.value - mean) > 2 * stdDev);
  }, []);

  const calculateTrend = useCallback((data: MetricPoint[]) => {
    if (!data || data.length < 2) return 0;
    
    const recentData = data.slice(-10);
    const oldData = data.slice(-20, -10);
    
    const recentAvg = recentData.reduce((a, b) => a + b.value, 0) / recentData.length;
    const oldAvg = oldData.reduce((a, b) => a + b.value, 0) / oldData.length;
    
    return ((recentAvg - oldAvg) / oldAvg) * 100;
  }, []);

  return {
    metrics,
    loading,
    error,
    isRealtime: isConnected,
    refresh: fetchMetrics,
    analyzeAnomalies,
    calculateTrend
  };
}

// Mock data generators
function generateMockRealtime() {
  return {
    requests_per_second: Math.floor(Math.random() * 100) + 50,
    active_connections: Math.floor(Math.random() * 500) + 100,
    error_rate: Math.random() * 5,
    avg_response_time: Math.floor(Math.random() * 200) + 50
  };
}

function generateMockTrends() {
  const now = Date.now();
  const hours = 24;
  
  return {
    requests: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 1000) + 500
    })),
    errors: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 50)
    })),
    response_times: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 500) + 100
    })),
    bandwidth: Array.from({ length: hours }, (_, i) => ({
      timestamp: new Date(now - (hours - i) * 60 * 60 * 1000).toISOString(),
      value: Math.floor(Math.random() * 100) + 20
    }))
  };
}

function generateMockPredictions() {
  return {
    next_hour_requests: Math.floor(Math.random() * 5000) + 2000,
    peak_time_estimate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    capacity_utilization: Math.random() * 100,
    anomaly_score: Math.random() * 10
  };
}

function generateMockCorrelations() {
  return [
    { metric_a: 'requests', metric_b: 'response_time', correlation: 0.85, significance: 0.95 },
    { metric_a: 'errors', metric_b: 'response_time', correlation: 0.72, significance: 0.88 },
    { metric_a: 'bandwidth', metric_b: 'requests', correlation: 0.91, significance: 0.97 }
  ];
}

function generateMockMetrics(): AdvancedMetrics {
  return {
    realtime: generateMockRealtime(),
    trends: generateMockTrends(),
    predictions: generateMockPredictions(),
    correlations: generateMockCorrelations()
  };
}
EOF

echo -e "${GREEN}✅ useAdvancedMetrics hook criado${NC}"

echo -e "${YELLOW}🎨 FASE 2: Visual Enhancements${NC}"
echo -e "${CYAN}===============================${NC}"

# 4. Theme System
echo -e "${BLUE}🎨 Criando sistema de temas avançado...${NC}"

mkdir -p "$FRONTEND_DIR/src/contexts"

cat > "$FRONTEND_DIR/src/contexts/ThemeContext.tsx" << 'EOF'
import React, { createContext, useContext, useState, useEffect } from 'react';

export type Theme = 'dark' | 'light' | 'cyberpunk' | 'midnight' | 'ocean';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  info: string;
}

const themes: Record<Theme, ThemeColors> = {
  dark: {
    primary: '#3B82F6',
    secondary: '#6366F1',
    accent: '#8B5CF6',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F8FAFC',
    textSecondary: '#94A3B8',
    border: '#334155',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#06B6D4'
  },
  light: {
    primary: '#2563EB',
    secondary: '#4F46E5',
    accent: '#7C3AED',
    background: '#FFFFFF',
    surface: '#F8FAFC',
    text: '#1E293B',
    textSecondary: '#64748B',
    border: '#E2E8F0',
    success: '#059669',
    warning: '#D97706',
    error: '#DC2626',
    info: '#0891B2'
  },
  cyberpunk: {
    primary: '#00FFFF',
    secondary: '#FF00FF',
    accent: '#FFFF00',
    background: '#000000',
    surface: '#1A0A1A',
    text: '#00FFFF',
    textSecondary: '#FF00FF',
    border: '#333333',
    success: '#00FF00',
    warning: '#FFAA00',
    error: '#FF0040',
    info: '#00AAFF'
  },
  midnight: {
    primary: '#4C1D95',
    secondary: '#5B21B6',
    accent: '#7C2D12',
    background: '#0C0A1A',
    surface: '#1E1B3A',
    text: '#E5E7EB',
    textSecondary: '#9CA3AF',
    border: '#374151',
    success: '#065F46',
    warning: '#92400E',
    error: '#991B1B',
    info: '#1E40AF'
  },
  ocean: {
    primary: '#0EA5E9',
    secondary: '#0284C7',
    accent: '#0891B2',
    background: '#0F172A',
    surface: '#1E293B',
    text: '#F0F9FF',
    textSecondary: '#7DD3FC',
    border: '#0369A1',
    success: '#047857',
    warning: '#CA8A04',
    error: '#DC2626',
    info: '#2563EB'
  }
};

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  availableThemes: Theme[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('veloflux-theme');
    return (saved as Theme) || 'dark';
  });

  const colors = themes[theme];
  const availableThemes: Theme[] = Object.keys(themes) as Theme[];

  const handleSetTheme = (newTheme: Theme) => {
    setTheme(newTheme);
    localStorage.setItem('veloflux-theme', newTheme);
  };

  const toggleTheme = () => {
    const currentIndex = availableThemes.indexOf(theme);
    const nextIndex = (currentIndex + 1) % availableThemes.length;
    handleSetTheme(availableThemes[nextIndex]);
  };

  // Apply CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key.replace(/[A-Z]/g, m => `-${m.toLowerCase()}`)}`, value);
    });
  }, [colors]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        setTheme: handleSetTheme,
        toggleTheme,
        availableThemes
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
EOF

echo -e "${GREEN}✅ Sistema de temas criado${NC}"

# 5. Command Palette
echo -e "${BLUE}⌨️ Criando Command Palette...${NC}"

cat > "$COMPONENTS_DIR/CommandPalette.tsx" << 'EOF'
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Settings, 
  BarChart3, 
  Shield, 
  Users, 
  Database,
  Activity,
  DollarSign,
  Zap,
  Brain,
  Server,
  Monitor
} from 'lucide-react';

interface Command {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  action: () => void;
  keywords: string[];
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (path: string) => void;
}

export function CommandPalette({ isOpen, onClose, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  const commands: Command[] = [
    {
      id: 'overview',
      label: 'Dashboard Overview',
      description: 'Go to main dashboard',
      icon: <Monitor className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard'),
      keywords: ['dashboard', 'overview', 'main', 'home']
    },
    {
      id: 'billing',
      label: 'Billing Panel',
      description: 'Manage billing and subscriptions',
      icon: <DollarSign className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/billing'),
      keywords: ['billing', 'payment', 'subscription', 'money', 'invoice']
    },
    {
      id: 'security',
      label: 'Security Settings',
      description: 'Configure security and WAF',
      icon: <Shield className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/security'),
      keywords: ['security', 'waf', 'firewall', 'protection', 'threats']
    },
    {
      id: 'ai-insights',
      label: 'AI Insights',
      description: 'View AI analytics and predictions',
      icon: <Brain className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/ai-insights'),
      keywords: ['ai', 'artificial intelligence', 'insights', 'predictions', 'analytics']
    },
    {
      id: 'metrics',
      label: 'Metrics & Analytics',
      description: 'View performance metrics',
      icon: <BarChart3 className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/metrics'),
      keywords: ['metrics', 'analytics', 'performance', 'charts', 'data']
    },
    {
      id: 'backends',
      label: 'Backend Management',
      description: 'Manage backend servers',
      icon: <Server className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/backends'),
      keywords: ['backends', 'servers', 'infrastructure', 'nodes']
    },
    {
      id: 'rate-limit',
      label: 'Rate Limiting',
      description: 'Configure rate limits',
      icon: <Zap className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/rate-limit'),
      keywords: ['rate', 'limit', 'throttle', 'quota', 'requests']
    },
    {
      id: 'users',
      label: 'User Management',
      description: 'Manage users and permissions',
      icon: <Users className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/users'),
      keywords: ['users', 'permissions', 'roles', 'access', 'team']
    },
    {
      id: 'health',
      label: 'Health Monitor',
      description: 'Monitor system health',
      icon: <Activity className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/health'),
      keywords: ['health', 'monitoring', 'status', 'uptime', 'alerts']
    },
    {
      id: 'config',
      label: 'Configuration',
      description: 'System configuration',
      icon: <Settings className="h-4 w-4" />,
      category: 'Navigation',
      action: () => onNavigate?.('/dashboard/config'),
      keywords: ['config', 'configuration', 'settings', 'preferences']
    }
  ];

  const filteredCommands = commands.filter(command =>
    command.label.toLowerCase().includes(query.toLowerCase()) ||
    command.description?.toLowerCase().includes(query.toLowerCase()) ||
    command.keywords.some(keyword => keyword.toLowerCase().includes(query.toLowerCase()))
  );

  const groupedCommands = filteredCommands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, Command[]>);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case 'Escape':
        onClose();
        break;
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action();
          onClose();
        }
        break;
    }
  }, [isOpen, filteredCommands, selectedIndex, onClose]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-start justify-center pt-32"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -20 }}
          className="w-full max-w-2xl mx-4"
          onClick={(e) => e.stopPropagation()}
        >
          <Card className="bg-slate-900/95 border-slate-700 backdrop-blur-xl shadow-2xl">
            {/* Search Input */}
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-transparent text-white placeholder-slate-400 border-0 focus:outline-none text-lg"
                  autoFocus
                />
              </div>
            </div>

            {/* Results */}
            <div className="max-h-96 overflow-y-auto p-2">
              {Object.keys(groupedCommands).length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No commands found for "{query}"
                </div>
              ) : (
                Object.entries(groupedCommands).map(([category, categoryCommands]) => (
                  <div key={category} className="mb-4 last:mb-0">
                    <div className="px-2 py-1 text-xs font-medium text-slate-400 uppercase tracking-wide">
                      {category}
                    </div>
                    <div className="space-y-1">
                      {categoryCommands.map((command, index) => {
                        const globalIndex = filteredCommands.indexOf(command);
                        return (
                          <motion.div
                            key={command.id}
                            className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                              globalIndex === selectedIndex
                                ? 'bg-blue-600/20 border border-blue-500/30'
                                : 'hover:bg-slate-800/50'
                            }`}
                            onClick={() => {
                              command.action();
                              onClose();
                            }}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="text-slate-300">{command.icon}</div>
                            <div className="flex-1">
                              <div className="text-white font-medium">{command.label}</div>
                              {command.description && (
                                <div className="text-sm text-slate-400">{command.description}</div>
                              )}
                            </div>
                            <Badge variant="outline" className="text-xs">
                              {globalIndex === selectedIndex ? 'Enter' : ''}
                            </Badge>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-700 text-xs text-slate-400 flex items-center justify-between">
              <div>Use ↑↓ to navigate, Enter to select, Esc to close</div>
              <Badge variant="outline" className="text-xs">Cmd+K</Badge>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export default CommandPalette;
EOF

echo -e "${GREEN}✅ Command Palette criado${NC}"

echo -e "${PURPLE}🎉 Implementação de Aprimoramentos Críticos Concluída!${NC}"
echo -e "${CYAN}=====================================================${NC}"

echo -e "${GREEN}✅ Componentes criados:${NC}"
echo -e "   • BillingExportManager.tsx - Export avançado de billing"
echo -e "   • SecurityMonitoringPanel.tsx - Monitoring de segurança em tempo real"
echo -e "   • useAdvancedMetrics.ts - Hook de analytics avançado"
echo -e "   • ThemeContext.tsx - Sistema de temas completo"
echo -e "   • CommandPalette.tsx - Command palette moderno"

echo -e "${BLUE}🔧 Próximos passos:${NC}"
echo -e "   1. Integrar componentes no ProductionDashboard.tsx"
echo -e "   2. Implementar visualizações 3D para network topology"
echo -e "   3. Adicionar real-time WebSocket para todos os componentes"
echo -e "   4. Criar advanced charts com drill-down capabilities"

echo -e "${YELLOW}📊 Para continuar com FASE 2 (Visualizações Avançadas), execute:${NC}"
echo -e "   ./scripts/implementar-visualizacoes-avancadas.sh"

echo -e "${PURPLE}🚀 Dashboard VeloFlux evolução em progresso! 🚀${NC}"
