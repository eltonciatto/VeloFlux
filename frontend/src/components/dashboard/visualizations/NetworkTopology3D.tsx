import React, { useEffect, useRef, useState, useMemo } from 'react';
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
  const nodes: NetworkNode[] = useMemo(() => [
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
  ], []);

  const connections: NetworkConnection[] = useMemo(() => [
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
  ], []);

  // Simulação de canvas 3D (em produção usaria Three.js ou WebGL)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      try {
        // Clear canvas
        ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw connections
        connections.forEach(connection => {
          try {
            const fromNode = nodes.find(n => n.id === connection.from);
            const toNode = nodes.find(n => n.id === connection.to);
            
            if (fromNode && toNode) {
              const fromX = (fromNode.position.x + 3) * (canvas.width / 6);
              const fromY = (fromNode.position.y + 1) * (canvas.height / 4);
              const toX = (toNode.position.x + 3) * (canvas.width / 6);
              const toY = (toNode.position.y + 1) * (canvas.height / 4);

              // Verificar se as coordenadas são válidas
              if (!isFinite(fromX) || !isFinite(fromY) || !isFinite(toX) || !isFinite(toY)) {
                return;
              }

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
                
                if (isFinite(animX) && isFinite(animY)) {
                  ctx.fillStyle = '#60A5FA';
                  ctx.beginPath();
                  ctx.arc(animX, animY, 3, 0, 2 * Math.PI);
                  ctx.fill();
                }
              }
            }
          } catch (connError) {
            console.warn('Error drawing connection:', connError);
          }        });

        // Draw nodes
        nodes.forEach(node => {
          try {
            const x = (node.position.x + 3) * (canvas.width / 6);
            const y = (node.position.y + 1) * (canvas.height / 4);
            // Garantir que o radius seja sempre um número válido
            const requests = node.metrics?.requests || 0;
            const radius = Math.max(10, 20 + Math.max(0, requests / 100));

            // Verificar se as coordenadas são válidas
            if (!isFinite(x) || !isFinite(y) || !isFinite(radius)) {
              console.warn('Invalid coordinates for node:', node.id, { x, y, radius });
              return;
            }

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
          } catch (nodeError) {
            console.warn('Error drawing node:', nodeError);
          }
        });
      } catch (drawError) {
        console.error('Error in canvas draw function:', drawError);
      }
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
      try {
        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        // Find clicked node
        const clickedNode = nodes.find(node => {
          const x = (node.position.x + 3) * (canvas.width / 6);
          const y = (node.position.y + 1) * (canvas.height / 4);
          const requests = node.metrics?.requests || 0;
          const radius = Math.max(10, 20 + Math.max(0, requests / 100));
          
          if (!isFinite(x) || !isFinite(y) || !isFinite(radius)) {
            return false;
          }
          
          const distance = Math.sqrt((clickX - x) ** 2 + (clickY - y) ** 2);
          return distance <= radius;
        });

        if (clickedNode) {
          setSelectedNode(clickedNode);
        }
      } catch (clickError) {
        console.warn('Error handling canvas click:', clickError);
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
                onChange={(e) => setViewMode(e.target.value as 'topology' | 'traffic' | 'health')}
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
