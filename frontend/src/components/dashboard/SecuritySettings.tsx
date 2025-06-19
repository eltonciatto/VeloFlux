import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useSecurityConfig, WAFConfig, RateLimitConfig, IPRule } from '@/hooks/useSecurityConfig';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Ban, 
  Eye, 
  Clock, 
  Globe, 
  Lock, 
  Zap,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  TestTube,
  TrendingUp,
  Activity
} from 'lucide-react';

const SecuritySettings = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('waf');
  const [isAddIPRuleOpen, setIsAddIPRuleOpen] = useState(false);
  const [newIPRule, setNewIPRule] = useState({
    ip_address: '',
    type: 'blacklist' as 'whitelist' | 'blacklist',
    description: '',
    expires_at: '',
    enabled: true
  });

  const {
    wafConfig,
    rateLimitConfig,
    ipRules,
    securityEvents,
    securityMetrics,
    loading,
    fetchWAFConfig,
    saveWAFConfig,
    testWAFConfig,
    fetchRateLimitConfig,
    saveRateLimitConfig,
    fetchIPRules,
    addIPRule,
    updateIPRule,
    deleteIPRule,
    fetchSecurityEvents,
    fetchSecurityMetrics,
    refreshAll
  } = useSecurityConfig(tenantId!, token!);

  // Initialize data
  useEffect(() => {
    if (tenantId && token) {
      refreshAll();
    }
  }, [tenantId, token, refreshAll]);

  // Handle WAF config changes
  const handleWAFConfigChange = (field: string, value: any) => {
    if (!wafConfig) return;
    
    const updatedConfig = { ...wafConfig };
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      if (parent === 'rules') {
        updatedConfig.rules = {
          ...updatedConfig.rules,
          [child]: value
        };
      } else {
        (updatedConfig as any)[parent] = {
          ...(updatedConfig as any)[parent],
          [child]: value
        };
      }
    } else {
      (updatedConfig as any)[field] = value;
    }
    
    saveWAFConfig(updatedConfig);
  };

  // Handle Rate Limit config changes
  const handleRateLimitConfigChange = (field: string, value: any) => {
    if (!rateLimitConfig) return;
    
    const updatedConfig = { ...rateLimitConfig };
    if (field.includes('.')) {
      const parts = field.split('.');
      let current: any = updatedConfig;
      for (let i = 0; i < parts.length - 1; i++) {
        current = current[parts[i]];
      }
      current[parts[parts.length - 1]] = value;
    } else {
      (updatedConfig as any)[field] = value;
    }
    
    saveRateLimitConfig(updatedConfig);
  };

  // Handle add IP rule
  const handleAddIPRule = async () => {
    try {
      await addIPRule(newIPRule);
      setNewIPRule({
        ip_address: '',
        type: 'blacklist',
        description: '',
        expires_at: '',
        enabled: true
      });
      setIsAddIPRuleOpen(false);
    } catch (error) {
      console.error('Error adding IP rule:', error);
    }
  };

  // Get threat level color
  const getThreatLevelColor = (level: string) => {
    switch (level) {
      case 'low': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // Get event severity icon
  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'medium': return <Eye className="w-4 h-4 text-yellow-400" />;
      case 'high': return <AlertTriangle className="w-4 h-4 text-orange-400" />;
      case 'critical': return <Ban className="w-4 h-4 text-red-400" />;
      default: return <Activity className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Security Settings</h1>
          <p className="text-slate-400">
            Configure security policies, WAF rules, and monitor threats for your tenant
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            onClick={refreshAll}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-slate-600 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          
          <Button
            onClick={testWAFConfig}
            variant="outline"
            size="sm"
            className="border-blue-600 hover:bg-blue-700"
          >
            <TestTube className="w-4 h-4 mr-2" />
            Test WAF
          </Button>
        </div>
      </div>

      {/* Security Overview Cards */}
      {securityMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-gradient-to-br from-red-900/50 to-red-800/50 border-red-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Ban className="w-5 h-5 text-red-400" />
                  Blocked Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-2">
                  {securityMetrics.blocked_requests_24h.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400">Last 24 hours</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-orange-900/50 to-orange-800/50 border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Shield className="w-5 h-5 text-orange-400" />
                  WAF Triggers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-2">
                  {securityMetrics.waf_triggers_24h.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400">Security events</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-yellow-900/50 to-yellow-800/50 border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <Clock className="w-5 h-5 text-yellow-400" />
                  Rate Limits Hit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-2">
                  {securityMetrics.rate_limit_hits_24h.toLocaleString()}
                </div>
                <div className="text-sm text-slate-400">Throttled requests</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 border-white/10">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-white">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                  Security Score
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white mb-2">
                  {securityMetrics.security_score}/100
                </div>
                <Badge className={getThreatLevelColor(securityMetrics.threat_level)}>
                  {securityMetrics.threat_level.toUpperCase()}
                </Badge>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}

      {/* Main Security Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 bg-slate-800/50 border-slate-700">
          <TabsTrigger value="waf" className="data-[state=active]:bg-slate-700">
            <Shield className="w-4 h-4 mr-2" />
            WAF
          </TabsTrigger>
          <TabsTrigger value="rate-limit" className="data-[state=active]:bg-slate-700">
            <Zap className="w-4 h-4 mr-2" />
            Rate Limiting
          </TabsTrigger>
          <TabsTrigger value="ip-rules" className="data-[state=active]:bg-slate-700">
            <Globe className="w-4 h-4 mr-2" />
            IP Rules
          </TabsTrigger>
          <TabsTrigger value="events" className="data-[state=active]:bg-slate-700">
            <Activity className="w-4 h-4 mr-2" />
            Events
          </TabsTrigger>
          <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
            <Eye className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
        </TabsList>

        {/* WAF Configuration Tab */}
        <TabsContent value="waf" className="space-y-6">
          {wafConfig && (
            <div className="grid gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Web Application Firewall</CardTitle>
                  <CardDescription>
                    Configure WAF rules to protect against common web attacks
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="waf-enabled"
                      checked={wafConfig.enabled}
                      onCheckedChange={(checked) => handleWAFConfigChange('enabled', checked)}
                    />
                    <Label htmlFor="waf-enabled" className="text-white">Enable WAF Protection</Label>
                  </div>

                  {wafConfig.enabled && (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-white">WAF Mode</Label>
                          <Select 
                            value={wafConfig.mode} 
                            onValueChange={(value) => handleWAFConfigChange('mode', value)}
                          >
                            <SelectTrigger className="bg-slate-800 border-slate-600">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="monitor">Monitor Only</SelectItem>
                              <SelectItem value="block">Block Threats</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <h4 className="text-lg font-semibold text-white">Protection Rules</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-center space-x-2">
                            <Switch
                              id="sql-injection"
                              checked={wafConfig.rules.sql_injection}
                              onCheckedChange={(checked) => handleWAFConfigChange('rules.sql_injection', checked)}
                            />
                            <Label htmlFor="sql-injection" className="text-white">SQL Injection Protection</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="xss-protection"
                              checked={wafConfig.rules.xss_protection}
                              onCheckedChange={(checked) => handleWAFConfigChange('rules.xss_protection', checked)}
                            />
                            <Label htmlFor="xss-protection" className="text-white">XSS Protection</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="csrf-protection"
                              checked={wafConfig.rules.csrf_protection}
                              onCheckedChange={(checked) => handleWAFConfigChange('rules.csrf_protection', checked)}
                            />
                            <Label htmlFor="csrf-protection" className="text-white">CSRF Protection</Label>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="geo-blocking"
                              checked={wafConfig.rules.geo_blocking}
                              onCheckedChange={(checked) => handleWAFConfigChange('rules.geo_blocking', checked)}
                            />
                            <Label htmlFor="geo-blocking" className="text-white">Geographic Blocking</Label>
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Rate Limiting Tab */}
        <TabsContent value="rate-limit" className="space-y-6">
          {rateLimitConfig && (
            <div className="grid gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Rate Limiting Configuration</CardTitle>
                  <CardDescription>
                    Control request rates to prevent abuse and ensure fair usage
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="rate-limit-enabled"
                      checked={rateLimitConfig.enabled}
                      onCheckedChange={(checked) => handleRateLimitConfigChange('enabled', checked)}
                    />
                    <Label htmlFor="rate-limit-enabled" className="text-white">Enable Rate Limiting</Label>
                  </div>

                  {rateLimitConfig.enabled && (
                    <div className="space-y-6">
                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Global Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">Requests per Minute</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.global_limit.requests_per_minute}
                              onChange={(e) => handleRateLimitConfigChange('global_limit.requests_per_minute', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Requests per Hour</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.global_limit.requests_per_hour}
                              onChange={(e) => handleRateLimitConfigChange('global_limit.requests_per_hour', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Burst Limit</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.global_limit.burst_limit}
                              onChange={(e) => handleRateLimitConfigChange('global_limit.burst_limit', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="text-lg font-semibold text-white mb-4">Per-IP Limits</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <Label className="text-white">Requests per Minute</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.per_ip_limit.requests_per_minute}
                              onChange={(e) => handleRateLimitConfigChange('per_ip_limit.requests_per_minute', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Requests per Hour</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.per_ip_limit.requests_per_hour}
                              onChange={(e) => handleRateLimitConfigChange('per_ip_limit.requests_per_hour', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                          <div>
                            <Label className="text-white">Burst Limit</Label>
                            <Input
                              type="number"
                              value={rateLimitConfig.per_ip_limit.burst_limit}
                              onChange={(e) => handleRateLimitConfigChange('per_ip_limit.burst_limit', parseInt(e.target.value))}
                              className="bg-slate-800 border-slate-600"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* IP Rules Tab */}
        <TabsContent value="ip-rules" className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-white">IP Access Rules</h3>
            <Dialog open={isAddIPRuleOpen} onOpenChange={setIsAddIPRuleOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add IP Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-slate-900 border-slate-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add IP Rule</DialogTitle>
                  <DialogDescription>
                    Add a new IP address rule to whitelist or blacklist access
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-white">IP Address</Label>
                    <Input
                      value={newIPRule.ip_address}
                      onChange={(e) => setNewIPRule(prev => ({ ...prev, ip_address: e.target.value }))}
                      placeholder="192.168.1.1 or 192.168.1.0/24"
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                  <div>
                    <Label className="text-white">Type</Label>
                    <Select 
                      value={newIPRule.type} 
                      onValueChange={(value: 'whitelist' | 'blacklist') => setNewIPRule(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger className="bg-slate-800 border-slate-600">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="whitelist">Whitelist (Allow)</SelectItem>
                        <SelectItem value="blacklist">Blacklist (Block)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-white">Description</Label>
                    <Input
                      value={newIPRule.description}
                      onChange={(e) => setNewIPRule(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Rule description..."
                      className="bg-slate-800 border-slate-600"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddIPRule} className="bg-blue-600 hover:bg-blue-700">
                    Add Rule
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="bg-slate-900/50 border-slate-700">
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-700">
                    <TableHead className="text-slate-300">IP Address</TableHead>
                    <TableHead className="text-slate-300">Type</TableHead>
                    <TableHead className="text-slate-300">Description</TableHead>
                    <TableHead className="text-slate-300">Status</TableHead>
                    <TableHead className="text-slate-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipRules.map((rule) => (
                    <TableRow key={rule.id} className="border-slate-700">
                      <TableCell className="text-white font-mono">{rule.ip_address}</TableCell>
                      <TableCell>
                        <Badge className={rule.type === 'whitelist' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                          {rule.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-300">{rule.description}</TableCell>
                      <TableCell>
                        <Badge className={rule.enabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}>
                          {rule.enabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => updateIPRule(rule.id, { enabled: !rule.enabled })}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteIPRule(rule.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Events Tab */}
        <TabsContent value="events" className="space-y-6">
          <Card className="bg-slate-900/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Recent Security Events</CardTitle>
              <CardDescription>
                Monitor security events and threats in real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.map((event) => (
                  <div key={event.id} className="flex items-start gap-4 p-4 bg-slate-800/50 rounded-lg">
                    <div className="mt-1">
                      {getSeverityIcon(event.severity)}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold text-white capitalize">
                          {event.type.replace('_', ' ')}
                        </span>
                        <Badge className={getThreatLevelColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        <span className="text-sm text-slate-400">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <div className="text-slate-300 mb-2">
                        IP: <span className="font-mono">{event.source_ip}</span>
                      </div>
                      <div className="text-sm text-slate-400">
                        Action: {event.action_taken}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {securityMetrics && (
            <div className="grid gap-6">
              <Card className="bg-slate-900/50 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Top Blocked IPs</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {securityMetrics.top_blocked_ips.map((ip, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded">
                        <span className="font-mono text-white">{ip.ip}</span>
                        <div className="text-right">
                          <div className="text-sm font-semibold text-red-400">{ip.count} blocks</div>
                          <div className="text-xs text-slate-400">
                            Last seen: {new Date(ip.last_seen).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecuritySettings;
