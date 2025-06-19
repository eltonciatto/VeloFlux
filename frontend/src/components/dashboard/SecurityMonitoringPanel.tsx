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
