
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from 'recharts';
import { Activity, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';

interface HealthData {
  timestamp: string;
  backend: string;
  status: 'healthy' | 'unhealthy';
  responseTime: number;
  statusCode: number;
}

export const HealthMonitor = () => {
  const [healthData, setHealthData] = useState<HealthData[]>([
    { timestamp: '10:25', backend: 'backend-1', status: 'healthy', responseTime: 1.2, statusCode: 200 },
    { timestamp: '10:26', backend: 'backend-1', status: 'healthy', responseTime: 1.1, statusCode: 200 },
    { timestamp: '10:27', backend: 'backend-1', status: 'healthy', responseTime: 1.3, statusCode: 200 },
    { timestamp: '10:28', backend: 'backend-1', status: 'healthy', responseTime: 1.0, statusCode: 200 },
    { timestamp: '10:29', backend: 'backend-1', status: 'healthy', responseTime: 1.4, statusCode: 200 },
    { timestamp: '10:30', backend: 'backend-1', status: 'healthy', responseTime: 1.2, statusCode: 200 },
  ]);

  const [isMonitoring, setIsMonitoring] = useState(true);

  const healthSummary = {
    totalChecks: 150,
    successfulChecks: 147,
    failedChecks: 3,
    uptime: 98.0
  };

  return (
    <div className="space-y-6">
      {/* Health Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Total Checks</p>
              <p className="text-2xl font-bold text-white">{healthSummary.totalChecks}</p>
            </div>
            <Activity className="w-8 h-8 text-blue-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Successful</p>
              <p className="text-2xl font-bold text-white">{healthSummary.successfulChecks}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Failed</p>
              <p className="text-2xl font-bold text-white">{healthSummary.failedChecks}</p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-400" />
          </div>
        </Card>

        <Card className="bg-white/5 border-white/10 backdrop-blur-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-200">Uptime</p>
              <p className="text-2xl font-bold text-white">{healthSummary.uptime}%</p>
            </div>
            <Activity className="w-8 h-8 text-green-400" />
          </div>
        </Card>
      </div>

      {/* Response Time Chart */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h3 className="text-xl font-bold text-white">Response Time Trends</h3>
          <div className="flex items-center gap-4">
            <Badge className={isMonitoring ? 'bg-green-100/10 text-green-300' : 'bg-red-100/10 text-red-300'}>
              {isMonitoring ? 'Monitoring Active' : 'Monitoring Paused'}
            </Badge>
            <Button 
              size="sm" 
              variant="outline" 
              className="border-white/20 text-white hover:bg-white/10"
              onClick={() => setIsMonitoring(!isMonitoring)}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {isMonitoring ? 'Pause' : 'Resume'}
            </Button>
          </div>
        </div>
        <div className="p-6">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={healthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="timestamp" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Line 
                  type="monotone" 
                  dataKey="responseTime" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>

      {/* Health Check Log */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <div className="p-6 border-b border-white/10">
          <h3 className="text-xl font-bold text-white">Recent Health Checks</h3>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {healthData.slice(-5).reverse().map((check, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  {check.status === 'healthy' ? 
                    <CheckCircle className="w-4 h-4 text-green-400" /> :
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                  }
                  <span className="text-white font-medium">{check.backend}</span>
                  <Badge className={check.status === 'healthy' ? 
                    'bg-green-100/10 text-green-300' : 
                    'bg-red-100/10 text-red-300'
                  }>
                    {check.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-blue-200">
                  <span>Status: {check.statusCode}</span>
                  <span>Response: {check.responseTime}ms</span>
                  <span>Time: {check.timestamp}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
};
