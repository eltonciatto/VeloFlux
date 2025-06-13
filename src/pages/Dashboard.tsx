
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BackendOverview } from '@/components/dashboard/BackendOverview';
import { HealthMonitor } from '@/components/dashboard/HealthMonitor';
import { MetricsView } from '@/components/dashboard/MetricsView';
import { ConfigManager } from '@/components/dashboard/ConfigManager';
import { BackendManager } from '@/components/dashboard/BackendManager';
import { ClusterStatus } from '@/components/dashboard/ClusterStatus';
import WAFConfig from '@/components/dashboard/WAFConfig';
import RateLimitConfig from '@/components/dashboard/RateLimitConfig';
import { Activity, Server, BarChart3, Settings, Users, Crown, Shield, Gauge } from 'lucide-react';
import Header from '@/components/Header';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';

export const Dashboard = () => {
  const { user } = useAuth();
  const { selectedTenantId } = useTenant();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <Header />
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">VeloFlux LB Dashboard</h1>
          <p className="text-blue-200">Monitor and manage your load balancer instances</p>
        </div>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 border-white/20 overflow-x-auto scrollbar-hide flex">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Health Monitor
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="cluster" className="flex items-center gap-2">
              <Crown className="w-4 h-4" />
              Cluster
            </TabsTrigger>
            <TabsTrigger value="backends" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Backends
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="ratelimit" className="flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              Rate Limiting
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Configuration
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <BackendOverview />
          </TabsContent>

          <TabsContent value="health">
            <HealthMonitor />
          </TabsContent>

          <TabsContent value="metrics">
            <MetricsView />
          </TabsContent>

          <TabsContent value="cluster">
            <ClusterStatus />
          </TabsContent>

          <TabsContent value="backends">
            <BackendManager />
          </TabsContent>
          
          <TabsContent value="security">
            <WAFConfig tenantId={selectedTenantId} />
          </TabsContent>
          
          <TabsContent value="ratelimit">
            <RateLimitConfig tenantId={selectedTenantId} />
          </TabsContent>

          <TabsContent value="config">
            <ConfigManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};
