#!/bin/bash

# 🎨 Script de Implementação de Visualizações Avançadas - VeloFlux Dashboard
# Fase 2: Advanced Visual Components & 3D Visualizations

set -euo pipefail

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${PURPLE}🎨 VeloFlux Dashboard - Implementação de Visualizações Avançadas${NC}"
echo -e "${CYAN}================================================================${NC}"

# Diretórios
FRONTEND_DIR="/workspaces/VeloFlux/frontend"
COMPONENTS_DIR="$FRONTEND_DIR/src/components/dashboard"
VISUALIZATIONS_DIR="$COMPONENTS_DIR/visualizations"

# Criar diretório de visualizações
mkdir -p "$VISUALIZATIONS_DIR"

echo -e "${YELLOW}🌐 FASE 2: Advanced Visualizations${NC}"
echo -e "${CYAN}==================================${NC}"

# 1. 3D Network Topology Visualizer
echo -e "${BLUE}🌐 Criando 3D Network Topology Visualizer...${NC}"

cat > "$VISUALIZATIONS_DIR/NetworkTopology3D.tsx" << 'EOF'
import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Play, 
  Pause, 
  RotateCw, 
  ZoomIn, 
  ZoomOut,
  Settings,
  Activity,
  AlertCircle,
  CheckCircle
} from 'lucide-react';

interface NetworkNode {
  id: string;
  label: string;
  type: 'loadbalancer' | 'backend' | 'database' | 'cache' | 'external';
  status: 'healthy' | 'warning' | 'error' | 'unknown';
  position: { x: number; y: number; z: number };
  connections: string[];
  metrics: {
    cpu: number;
    memory: number;
    network: number;
    requests: number;
  };
}

interface NetworkConnection {
  from: string;
  to: string;
  traffic: number;
  latency: number;
  status: 'active' | 'slow' | 'error';
}

export function NetworkTopology3D() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [viewMode, setViewMode] = useState<'topology' | 'traffic' | 'health'>('topology');
  
  // Mock data - em produção viria da API
  const nodes: NetworkNode[] = [
    {
      id: 'lb-1',
      label: 'Load Balancer',
      type: 'loadbalancer',
      status: 'healthy',
      position: { x: 0, y: 0, z: 0 },
      connections: ['backend-1', 'backend-2', 'backend-3'],
      metrics: { cpu: 45, memory: 62, network: 78, requests: 1250 }
    },
    {
      id: 'backend-1',
      label: 'Backend Server 1',
      type: 'backend',
      status: 'healthy',
      position: { x: -2, y: 1, z: -1 },
      connections: ['db-1', 'cache-1'],
      metrics: { cpu: 72, memory: 58, network: 85, requests: 420 }
    },
    {
      id: 'backend-2',
      label: 'Backend Server 2',
      type: 'backend',
      status: 'warning',
      position: { x: 0, y: 1, z: -1 },
      connections: ['db-1', 'cache-1'],
      metrics: { cpu: 89, memory: 91, network: 67, requests: 380 }
    },
    {
      id: 'backend-3',
      label: 'Backend Server 3',
      type: 'backend',
      status: 'healthy',
      position: { x: 2, y: 1, z: -1 },
      connections: ['db-2', 'cache-1'],
      metrics: { cpu: 34, memory: 45, network: 72, requests: 450 }
    },
    {
      id: 'db-1',
      label: 'Database Primary',
      type: 'database',
      status: 'healthy',
      position: { x: -1, y: 2, z: -2 },
      connections: ['db-2'],
      metrics: { cpu: 56, memory: 78, network: 45, requests: 800 }
    },
    {
      id: 'db-2',
      label: 'Database Replica',
      type: 'database',
      status: 'healthy',
      position: { x: 1, y: 2, z: -2 },
      connections: [],
      metrics: { cpu: 23, memory: 67, network: 34, requests: 200 }
    },
    {
      id: 'cache-1',
      label: 'Redis Cache',
      type: 'cache',
      status: 'healthy',
      position: { x: 0, y: 2, z: -1.5 },
      connections: [],
      metrics: { cpu: 12, memory: 45, network: 89, requests: 1500 }
    }
  ];

  const connections: NetworkConnection[] = [
    { from: 'lb-1', to: 'backend-1', traffic: 85, latency: 12, status: 'active' },
    { from: 'lb-1', to: 'backend-2', traffic: 72, latency: 23, status: 'slow' },
    { from: 'lb-1', to: 'backend-3', traffic: 91, latency: 8, status: 'active' },
    { from: 'backend-1', to: 'db-1', traffic: 45, latency: 15, status: 'active' },
    { from: 'backend-2', to: 'db-1', traffic: 38, latency: 18, status: 'active' },
    { from: 'backend-3', to: 'db-2', traffic: 52, latency: 11, status: 'active' },
    { from: 'backend-1', to: 'cache-1', traffic: 78, latency: 3, status: 'active' },
    { from: 'backend-2', to: 'cache-1', traffic: 65, latency: 4, status: 'active' },
    { from: 'backend-3', to: 'cache-1', traffic: 82, latency: 2, status: 'active' },
    { from: 'db-1', to: 'db-2', traffic: 25, latency: 35, status: 'active' }
  ];

  // Simulação de canvas 3D (em produção usaria Three.js ou WebGL)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      connections.forEach(connection => {
        const fromNode = nodes.find(n => n.id === connection.from);
        const toNode = nodes.find(n => n.id === connection.to);
        
        if (fromNode && toNode) {
          const fromX = (fromNode.position.x + 3) * (canvas.width / 6);
          const fromY = (fromNode.position.y + 1) * (canvas.height / 4);
          const toX = (toNode.position.x + 3) * (canvas.width / 6);
          const toY = (toNode.position.y + 1) * (canvas.height / 4);

          // Connection line
          ctx.beginPath();
          ctx.moveTo(fromX, fromY);
          ctx.lineTo(toX, toY);
          
          // Color based on status
          switch (connection.status) {
            case 'active':
              ctx.strokeStyle = '#10B981';
              break;
            case 'slow':
              ctx.strokeStyle = '#F59E0B';
              break;
            case 'error':
              ctx.strokeStyle = '#EF4444';
              break;
          }
          
          ctx.lineWidth = Math.max(1, connection.traffic / 20);
          ctx.stroke();

          // Traffic animation (simplified)
          if (isPlaying) {
            const progress = (Date.now() / 1000) % 2;
            const animX = fromX + (toX - fromX) * (progress / 2);
            const animY = fromY + (toY - fromY) * (progress / 2);
            
            ctx.fillStyle = '#60A5FA';
            ctx.beginPath();
            ctx.arc(animX, animY, 3, 0, 2 * Math.PI);
            ctx.fill();
          }
        }
      });

      // Draw nodes
      nodes.forEach(node => {
        const x = (node.position.x + 3) * (canvas.width / 6);
        const y = (node.position.y + 1) * (canvas.height / 4);
        const radius = 20 + (node.metrics.requests / 100);

        // Node circle
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        
        // Color based on status
        switch (node.status) {
          case 'healthy':
            ctx.fillStyle = '#10B981';
            break;
          case 'warning':
            ctx.fillStyle = '#F59E0B';
            break;
          case 'error':
            ctx.fillStyle = '#EF4444';
            break;
          default:
            ctx.fillStyle = '#6B7280';
        }
        
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Node label
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + radius + 15);

        // Metrics overlay
        if (viewMode === 'health') {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(x - 30, y - 40, 60, 20);
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '10px sans-serif';
          ctx.fillText(`CPU: ${node.metrics.cpu}%`, x, y - 25);
        }
      });
    };

    const animate = () => {
      draw();
      if (isPlaying) {
        requestAnimationFrame(animate);
      }
    };

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    animate();

    // Handle click events
    const handleClick = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const clickX = event.clientX - rect.left;
      const clickY = event.clientY - rect.top;

      // Find clicked node
      const clickedNode = nodes.find(node => {
        const x = (node.position.x + 3) * (canvas.width / 6);
        const y = (node.position.y + 1) * (canvas.height / 4);
        const radius = 20 + (node.metrics.requests / 100);
        
        const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
        return distance <= radius;
      });

      if (clickedNode) {
        setSelectedNode(clickedNode);
      }
    };

    canvas.addEventListener('click', handleClick);

    return () => {
      canvas.removeEventListener('click', handleClick);
    };
  }, [isPlaying, viewMode, nodes, connections]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-400" />;
      case 'error': return <AlertCircle className="h-4 w-4 text-red-400" />;
      default: return <Activity className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <span>3D Network Topology</span>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              </Button>
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as any)}
                className="bg-slate-800 border-slate-600 text-white rounded px-3 py-1 text-sm"
              >
                <option value="topology">Topology</option>
                <option value="traffic">Traffic</option>
                <option value="health">Health</option>
              </select>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <canvas
              ref={canvasRef}
              className="w-full h-96 bg-slate-800/30 rounded-lg border border-slate-700 cursor-pointer"
            />
            {isPlaying && (
              <div className="absolute top-4 right-4">
                <Badge className="bg-green-600">Live</Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Node Details */}
      {selectedNode && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-white">
                {getStatusIcon(selectedNode.status)}
                {selectedNode.label}
                <Badge variant="outline">{selectedNode.type}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-sm text-slate-400">CPU Usage</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.cpu}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{selectedNode.metrics.cpu}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Memory</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.memory}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{selectedNode.metrics.memory}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Network</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-700 rounded-full h-2">
                      <div 
                        className="bg-purple-500 h-2 rounded-full transition-all"
                        style={{ width: `${selectedNode.metrics.network}%` }}
                      />
                    </div>
                    <span className="text-sm text-white">{selectedNode.metrics.network}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-slate-400">Requests/min</p>
                  <p className="text-lg font-bold text-white">{selectedNode.metrics.requests}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Legend */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full" />
                <span className="text-slate-300">Healthy</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                <span className="text-slate-300">Warning</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full" />
                <span className="text-slate-300">Error</span>
              </div>
            </div>
            <span className="text-slate-400">Click nodes for details • Line thickness = traffic volume</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default NetworkTopology3D;
EOF

echo -e "${GREEN}✅ NetworkTopology3D criado${NC}"

# 2. Interactive Analytics Dashboard
echo -e "${BLUE}📊 Criando Interactive Analytics Dashboard...${NC}"

cat > "$VISUALIZATIONS_DIR/InteractiveAnalytics.tsx" << 'EOF'
import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  TrendingDown, 
  BarChart3, 
  PieChart, 
  Activity,
  Zap,
  Users,
  Globe
} from 'lucide-react';

interface ChartData {
  label: string;
  value: number;
  trend?: number;
  color?: string;
}

interface MetricCard {
  title: string;
  value: string | number;
  change: number;
  icon: React.ReactNode;
  color: string;
}

export function InteractiveAnalytics() {
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [selectedMetric, setSelectedMetric] = useState<string>('requests');

  // Mock data baseado no timeframe
  const generateData = (timeframe: string, metric: string): ChartData[] => {
    const dataPoints = timeframe === '1h' ? 60 : timeframe === '24h' ? 24 : timeframe === '7d' ? 7 : 30;
    
    return Array.from({ length: dataPoints }, (_, i) => ({
      label: timeframe === '1h' ? `${i}m` : timeframe === '24h' ? `${i}h` : `Day ${i + 1}`,
      value: Math.floor(Math.random() * 1000) + 100,
      trend: (Math.random() - 0.5) * 20,
      color: `hsl(${200 + i * 10}, 70%, 50%)`
    }));
  };

  const chartData = useMemo(() => generateData(selectedTimeframe, selectedMetric), [selectedTimeframe, selectedMetric]);

  const metricCards: MetricCard[] = [
    {
      title: 'Requests/min',
      value: '1,247',
      change: 12.5,
      icon: <Activity className="h-5 w-5" />,
      color: 'text-blue-400'
    },
    {
      title: 'Active Users',
      value: '8,932',
      change: -2.3,
      icon: <Users className="h-5 w-5" />,
      color: 'text-green-400'
    },
    {
      title: 'Error Rate',
      value: '0.12%',
      change: -45.6,
      icon: <Zap className="h-5 w-5" />,
      color: 'text-red-400'
    },
    {
      title: 'Global Reach',
      value: '42',
      change: 8.7,
      icon: <Globe className="h-5 w-5" />,
      color: 'text-purple-400'
    }
  ];

  const pieData = [
    { label: 'API Requests', value: 45, color: '#3B82F6' },
    { label: 'Web Traffic', value: 30, color: '#10B981' },
    { label: 'Mobile App', value: 15, color: '#F59E0B' },
    { label: 'Other', value: 10, color: '#8B5CF6' }
  ];

  // Simplified chart rendering (em produção usaria Chart.js ou D3.js)
  const renderBarChart = () => {
    const maxValue = Math.max(...chartData.map(d => d.value));
    
    return (
      <div className="flex items-end gap-2 h-64 p-4">
        {chartData.map((item, index) => (
          <motion.div
            key={index}
            className="flex flex-col items-center flex-1"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            transition={{ delay: index * 0.1 }}
          >
            <motion.div
              className="bg-blue-500 w-full rounded-t-sm cursor-pointer hover:bg-blue-400 transition-colors"
              style={{ 
                height: `${(item.value / maxValue) * 200}px`,
                minHeight: '4px'
              }}
              whileHover={{ scale: 1.05 }}
              title={`${item.label}: ${item.value}`}
            />
            <span className="text-xs text-slate-400 mt-2 rotate-45 origin-left">{item.label}</span>
          </motion.div>
        ))}
      </div>
    );
  };

  const renderPieChart = () => {
    const total = pieData.reduce((sum, item) => sum + item.value, 0);
    let cumulativePercentage = 0;

    return (
      <div className="flex items-center justify-center h-64">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {pieData.map((item, index) => {
              const percentage = (item.value / total) * 100;
              const strokeDasharray = `${percentage} ${100 - percentage}`;
              const strokeDashoffset = -cumulativePercentage;
              
              cumulativePercentage += percentage;

              return (
                <circle
                  key={index}
                  cx="96"
                  cy="96"
                  r="80"
                  fill="transparent"
                  stroke={item.color}
                  strokeWidth="20"
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  className="cursor-pointer hover:opacity-80 transition-opacity"
                  pathLength="100"
                />
              );
            })}
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold text-white">100%</div>
              <div className="text-sm text-slate-400">Coverage</div>
            </div>
          </div>
        </div>
        <div className="ml-8 space-y-2">
          {pieData.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-sm text-slate-300">{item.label}</span>
              <span className="text-sm text-slate-400">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metricCards.map((metric, index) => (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="bg-slate-900/50 border-slate-700 hover:bg-slate-800/50 transition-colors cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">{metric.title}</p>
                    <p className="text-2xl font-bold text-white">{metric.value}</p>
                    <div className="flex items-center gap-1 mt-1">
                      {metric.change > 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-400" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-400" />
                      )}
                      <span className={`text-xs ${metric.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  <div className={metric.color}>
                    {metric.icon}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Main Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Time Series Chart */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center justify-between text-white">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Time Series Analysis
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedMetric}
                  onChange={(e) => setSelectedMetric(e.target.value)}
                  className="bg-slate-800 border-slate-600 text-white rounded px-3 py-1 text-sm"
                >
                  <option value="requests">Requests</option>
                  <option value="errors">Errors</option>
                  <option value="latency">Latency</option>
                  <option value="bandwidth">Bandwidth</option>
                </select>
                <div className="flex border border-slate-600 rounded">
                  {(['1h', '24h', '7d', '30d'] as const).map((timeframe) => (
                    <button
                      key={timeframe}
                      onClick={() => setSelectedTimeframe(timeframe)}
                      className={`px-3 py-1 text-xs ${
                        selectedTimeframe === timeframe
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {timeframe}
                    </button>
                  ))}
                </div>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderBarChart()}
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <PieChart className="h-5 w-5" />
              Traffic Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {renderPieChart()}
          </CardContent>
        </Card>
      </div>

      {/* Correlation Matrix */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Metric Correlations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {['Requests', 'Latency', 'Errors', 'CPU'].map((metricA, i) => 
              ['Requests', 'Latency', 'Errors', 'CPU'].map((metricB, j) => {
                const correlation = i === j ? 1 : Math.random() * 2 - 1;
                const intensity = Math.abs(correlation);
                const color = correlation > 0 ? 'bg-green-500' : correlation < 0 ? 'bg-red-500' : 'bg-gray-500';
                
                return (
                  <motion.div
                    key={`${i}-${j}`}
                    className={`h-12 w-12 rounded ${color} flex items-center justify-center text-white text-xs font-bold cursor-pointer`}
                    style={{ opacity: intensity }}
                    whileHover={{ scale: 1.1 }}
                    title={`${metricA} vs ${metricB}: ${correlation.toFixed(2)}`}
                  >
                    {correlation.toFixed(1)}
                  </motion.div>
                );
              })
            )}
          </div>
          <div className="mt-4 text-sm text-slate-400">
            <span>Green = Positive correlation, Red = Negative correlation</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default InteractiveAnalytics;
EOF

echo -e "${GREEN}✅ InteractiveAnalytics criado${NC}"

# 3. Real-time Performance Visualizer
echo -e "${BLUE}⚡ Criando Real-time Performance Visualizer...${NC}"

cat > "$VISUALIZATIONS_DIR/RealTimePerformance.tsx" << 'EOF'
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Gauge,
  Zap,
  TrendingUp
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: number;
  cpu: number;
  memory: number;
  network: number;
  disk: number;
  requests: number;
  responseTime: number;
}

export function RealTimePerformance() {
  const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
  const [isLive, setIsLive] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Gerar métricas em tempo real
  useEffect(() => {
    if (!isLive) return;

    const interval = setInterval(() => {
      const newMetric: PerformanceMetric = {
        timestamp: Date.now(),
        cpu: Math.random() * 100,
        memory: Math.random() * 100,
        network: Math.random() * 100,
        disk: Math.random() * 100,
        requests: Math.floor(Math.random() * 1000) + 100,
        responseTime: Math.random() * 500 + 50
      };

      setMetrics(prev => [...prev.slice(-59), newMetric]); // Keep last 60 points
    }, 1000);

    return () => clearInterval(interval);
  }, [isLive]);

  // Desenhar gráficos em tempo real
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || metrics.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      // Clear canvas
      ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const width = canvas.width;
      const height = canvas.height;
      const padding = 40;
      const chartWidth = width - padding * 2;
      const chartHeight = height - padding * 2;

      // Draw grid
      ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
      ctx.lineWidth = 1;
      
      // Horizontal grid lines
      for (let i = 0; i <= 10; i++) {
        const y = padding + (chartHeight / 10) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(width - padding, y);
        ctx.stroke();
      }

      // Vertical grid lines
      for (let i = 0; i <= 12; i++) {
        const x = padding + (chartWidth / 12) * i;
        ctx.beginPath();
        ctx.moveTo(x, padding);
        ctx.lineTo(x, height - padding);
        ctx.stroke();
      }

      // Draw metrics
      const metricsToShow = ['cpu', 'memory', 'network', 'disk'] as const;
      const colors = ['#EF4444', '#10B981', '#3B82F6', '#F59E0B'];

      metricsToShow.forEach((metric, index) => {
        ctx.strokeStyle = colors[index];
        ctx.lineWidth = 2;
        ctx.beginPath();

        metrics.forEach((point, i) => {
          const x = padding + (chartWidth / (metrics.length - 1)) * i;
          const y = padding + chartHeight - (chartHeight * (point[metric] / 100));

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        });

        ctx.stroke();

        // Draw current value
        if (metrics.length > 0) {
          const lastMetric = metrics[metrics.length - 1];
          const lastX = padding + chartWidth;
          const lastY = padding + chartHeight - (chartHeight * (lastMetric[metric] / 100));

          ctx.fillStyle = colors[index];
          ctx.beginPath();
          ctx.arc(lastX, lastY, 4, 0, 2 * Math.PI);
          ctx.fill();
        }
      });

      // Draw legend
      ctx.fillStyle = '#FFFFFF';
      ctx.font = '12px sans-serif';
      metricsToShow.forEach((metric, index) => {
        const x = padding + index * 80;
        const y = height - 10;
        
        ctx.fillStyle = colors[index];
        ctx.fillRect(x, y - 8, 12, 8);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(metric.toUpperCase(), x + 16, y);
      });
    };

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    draw();
  }, [metrics]);

  const getCurrentMetrics = () => {
    if (metrics.length === 0) return null;
    return metrics[metrics.length - 1];
  };

  const currentMetrics = getCurrentMetrics();

  const getPerformanceStatus = (value: number) => {
    if (value < 50) return { status: 'good', color: 'text-green-400' };
    if (value < 80) return { status: 'warning', color: 'text-yellow-400' };
    return { status: 'critical', color: 'text-red-400' };
  };

  return (
    <div className="space-y-6">
      {/* Live Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {currentMetrics && [
          { label: 'CPU', value: currentMetrics.cpu, icon: <Cpu className="h-4 w-4" />, unit: '%' },
          { label: 'Memory', value: currentMetrics.memory, icon: <HardDrive className="h-4 w-4" />, unit: '%' },
          { label: 'Network', value: currentMetrics.network, icon: <Wifi className="h-4 w-4" />, unit: '%' },
          { label: 'Disk', value: currentMetrics.disk, icon: <HardDrive className="h-4 w-4" />, unit: '%' },
          { label: 'Requests', value: currentMetrics.requests, icon: <Activity className="h-4 w-4" />, unit: '/min' },
          { label: 'Response', value: currentMetrics.responseTime, icon: <Zap className="h-4 w-4" />, unit: 'ms' }
        ].map((metric, index) => {
          const status = getPerformanceStatus(metric.value);
          return (
            <motion.div
              key={metric.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-slate-900/50 border-slate-700">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-slate-400">{metric.icon}</div>
                    <Badge className={`${isLive ? 'bg-green-600' : 'bg-gray-600'} text-xs`}>
                      {isLive ? 'LIVE' : 'PAUSED'}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-xs text-slate-400">{metric.label}</p>
                    <p className={`text-lg font-bold ${status.color}`}>
                      {metric.value.toFixed(1)}{metric.unit}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Real-time Chart */}
      <Card className="bg-slate-900/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <Gauge className="h-5 w-5" />
              Real-time Performance Monitor
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLive(!isLive)}
                className={`px-3 py-1 rounded text-xs ${
                  isLive ? 'bg-green-600 text-white' : 'bg-gray-600 text-white'
                }`}
              >
                {isLive ? 'LIVE' : 'PAUSED'}
              </button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <canvas
            ref={canvasRef}
            className="w-full h-64 bg-slate-800/30 rounded border border-slate-700"
          />
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <TrendingUp className="h-5 w-5" />
              Performance Insights
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">System Health</span>
                <Badge className="bg-green-600">Excellent</Badge>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">Peak Usage</span>
                <span className="text-white">14:30 - 16:00</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-slate-800/30 rounded">
                <span className="text-slate-300">Optimization Score</span>
                <span className="text-green-400">94/100</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-900/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Resource Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentMetrics && [
                { name: 'CPU Cores', used: 6, total: 8, color: 'bg-red-500' },
                { name: 'Memory', used: currentMetrics.memory, total: 100, color: 'bg-green-500' },
                { name: 'Storage', used: 65, total: 100, color: 'bg-blue-500' },
                { name: 'Network', used: currentMetrics.network, total: 100, color: 'bg-yellow-500' }
              ].map((resource) => (
                <div key={resource.name} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-300">{resource.name}</span>
                    <span className="text-white">{resource.used.toFixed(0)}/{resource.total}</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <motion.div
                      className={`${resource.color} h-2 rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(resource.used / resource.total) * 100}%` }}
                      transition={{ duration: 0.5 }}
                    />
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

export default RealTimePerformance;
EOF

echo -e "${GREEN}✅ RealTimePerformance criado${NC}"

echo -e "${PURPLE}🎨 Implementação de Visualizações Avançadas Concluída!${NC}"
echo -e "${CYAN}======================================================${NC}"

echo -e "${GREEN}✅ Componentes de visualização criados:${NC}"
echo -e "   • NetworkTopology3D.tsx - Visualização 3D da topologia de rede"
echo -e "   • InteractiveAnalytics.tsx - Dashboard interativo de analytics"
echo -e "   • RealTimePerformance.tsx - Monitor de performance em tempo real"

echo -e "${BLUE}🔧 Próximos passos para integração:${NC}"
echo -e "   1. Importar no ProductionDashboard.tsx"
echo -e "   2. Configurar rotas para visualizações específicas"
echo -e "   3. Implementar WebGL/Three.js para melhor performance 3D"
echo -e "   4. Integrar com APIs reais do backend"

echo -e "${YELLOW}📚 Para usar as visualizações:${NC}"
echo -e "   import { NetworkTopology3D } from './visualizations/NetworkTopology3D';"
echo -e "   import { InteractiveAnalytics } from './visualizations/InteractiveAnalytics';"
echo -e "   import { RealTimePerformance } from './visualizations/RealTimePerformance';"

echo -e "${PURPLE}🚀 VeloFlux Dashboard - Visualizações de Classe Mundial! 🚀${NC}"
