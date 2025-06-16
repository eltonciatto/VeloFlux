
import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Server, Crown, Users, Wifi, WifiOff, Clock } from 'lucide-react';
import { useClusterInfo } from '@/hooks/use-api';

interface ClusterNode {
  id: string;
  address: string;
  role: 'leader' | 'follower';
  status: 'healthy' | 'unhealthy' | 'unreachable';
  lastSeen: string;
  term: number;
  version: string;
}

export const ClusterStatus = () => {
  const { data } = useClusterInfo();
  const nodes = data?.nodes || [];

  const healthyNodes = nodes.filter(n => n.status === 'healthy').length;
  const totalNodes = nodes.length;
  const clusterHealth = (healthyNodes / totalNodes) * 100;
  const currentLeader = nodes.find(n => n.role === 'leader');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Wifi className="w-4 h-4 text-green-400" />;
      case 'unhealthy':
        return <WifiOff className="w-4 h-4 text-yellow-400" />;
      case 'unreachable':
        return <WifiOff className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      healthy: 'bg-green-100/10 text-green-300 border-green-400/30',
      unhealthy: 'bg-yellow-100/10 text-yellow-300 border-yellow-400/30',
      unreachable: 'bg-red-100/10 text-red-300 border-red-400/30'
    };
    return variants[status as keyof typeof variants] || 'bg-gray-100/10 text-gray-300 border-gray-400/30';
  };

  const getRoleIcon = (role: string) => {
    return role === 'leader' ? <Crown className="w-4 h-4 text-yellow-400" /> : <Users className="w-4 h-4 text-blue-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Cluster Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Total Nodes</p>
              <p className="text-2xl font-bold text-white">{totalNodes}</p>
            </div>
            <Server className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Healthy Nodes</p>
              <p className="text-2xl font-bold text-white">{healthyNodes}</p>
            </div>
            <Wifi className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Current Leader</p>
              <p className="text-lg font-bold text-white">{currentLeader?.address.split(':')[0] || 'None'}</p>
            </div>
            <Crown className="w-8 h-8 text-yellow-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Cluster Health</p>
              <p className="text-2xl font-bold text-white">{clusterHealth.toFixed(0)}%</p>
            </div>
            <div className="w-8 h-8 flex items-center justify-center">
              <Progress value={clusterHealth} className="w-6" />
            </div>
          </div>
        </Card>
      </div>

      {/* Raft Status */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Raft Consensus Status</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-sm text-blue-200">Current Term</div>
              <div className="text-2xl font-bold text-white">{currentLeader?.term || 0}</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-200">Consensus State</div>
              <div className="text-lg font-bold text-green-300">
                {healthyNodes > totalNodes / 2 ? 'Quorum Active' : 'Quorum Lost'}
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-blue-200">Last Election</div>
              <div className="text-lg font-bold text-white">2 minutes ago</div>
            </div>
          </div>
        </div>
      </Card>

      {/* Node List */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Cluster Nodes</h3>
          <Button size="sm" variant="outline" className="border-white/20 text-white hover:bg-white/10">
            Trigger Election
          </Button>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {nodes.map((node) => (
              <div key={node.id} className="flex items-center justify-between p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex items-center gap-4">
                  {getStatusIcon(node.status)}
                  <div>
                    <div className="font-semibold text-white flex items-center gap-2">
                      {node.address}
                      {getRoleIcon(node.role)}
                    </div>
                    <div className="text-sm text-blue-200">Version: {node.version} • Term: {node.term}</div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-sm text-blue-200">Role</div>
                    <div className="font-semibold text-white capitalize">{node.role}</div>
                  </div>

                  <div className="text-center">
                    <div className="text-sm text-blue-200">Last Seen</div>
                    <div className="font-semibold text-white">
                      {new Date(node.lastSeen).toLocaleTimeString()}
                    </div>
                  </div>

                  <Badge className={getStatusBadge(node.status)}>
                    {node.status}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
