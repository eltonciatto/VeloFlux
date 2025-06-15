
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Server, Activity, Clock, Users, AlertTriangle, CheckCircle } from 'lucide-react';
import { useBackends } from '@/hooks/use-api';
import AIOverview from './AIOverview';

interface Backend {
  address: string;
  pool: string;
  weight: number;
  status?: 'healthy' | 'unhealthy' | 'unknown';
  connections?: number;
  responseTime?: number;
  lastCheck?: string;
}

export const BackendOverview = () => {
  const { data: backends = [] } = useBackends();

  const totalBackends = backends.length;
  const healthyBackends = backends.filter(b => b.status === 'healthy').length;
  const totalConnections = backends.reduce((sum, b) => sum + (b.connections || 0), 0);
  const avgResponseTime = backends.filter(b => b.status === 'healthy')
    .reduce((sum, b, _, arr) => sum + ((b.responseTime || 0) / arr.length), 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'unhealthy':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100/10 text-green-300 border-green-400/30',
      unhealthy: 'bg-red-100/10 text-red-300 border-red-400/30',
      unknown: 'bg-yellow-100/10 text-yellow-300 border-yellow-400/30'
    };
    return variants[status as keyof typeof variants] || variants.unknown;
  };

  return (
    <div className="space-y-6">
      {/* AI Overview Section */}
      <AIOverview />
      
      {/* Original Backend Overview */}
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Total Backends</p>
              <p className="text-2xl font-bold text-white">{totalBackends}</p>
            </div>
            <Server className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Healthy Backends</p>
              <p className="text-2xl font-bold text-white">{healthyBackends}</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Total Connections</p>
              <p className="text-2xl font-bold text-white">{totalConnections}</p>
            </div>
            <Users className="w-8 h-8 text-purple-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Avg Response Time</p>
              <p className="text-2xl font-bold text-white">{avgResponseTime.toFixed(1)}ms</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>
      </div>

      {/* Backend List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Backend Status</h3>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {backends.map((backend, idx) => (
              <div key={backend.address || idx} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  {getStatusIcon(backend.status || 'unknown')}
                  <div>
                    <div className="font-semibold text-white">{backend.address}</div>
                    <div className="text-sm text-blue-200">Pool: {backend.pool}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-blue-200">Connections</div>
                    <div className="font-semibold text-white">{backend.connections ?? 0}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-blue-200">Response Time</div>
                    <div className="font-semibold text-white">{backend.responseTime ?? 0}ms</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-blue-200">Weight</div>
                    <div className="font-semibold text-white">{backend.weight}</div>
                  </div>

                  <Badge className={getStatusBadge(backend.status || 'unknown')}>
                    {backend.status || 'unknown'}
                  </Badge>

                  <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
                    Manage
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
