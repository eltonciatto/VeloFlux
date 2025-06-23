// 🚀 Performance Monitor - Monitoramento em Tempo Real
// Métricas de performance do dashboard para produção

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  Activity, 
  Zap, 
  Clock, 
  MemoryStick,
  Cpu,
  Network,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

interface PerformanceMetrics {
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  networkLatency: number;
  frameRate: number;
  bundleSize: number;
  cacheHitRate: number;
  errorRate: number;
}

interface PerformanceThresholds {
  loadTime: { good: number; poor: number };
  renderTime: { good: number; poor: number };
  memoryUsage: { good: number; poor: number };
  networkLatency: { good: number; poor: number };
  frameRate: { good: number; poor: number };
  errorRate: { good: number; poor: number };
}

const defaultThresholds: PerformanceThresholds = {
  loadTime: { good: 2000, poor: 5000 }, // ms
  renderTime: { good: 16, poor: 33 }, // ms (60fps = 16ms, 30fps = 33ms)
  memoryUsage: { good: 50, poor: 100 }, // MB
  networkLatency: { good: 100, poor: 500 }, // ms
  frameRate: { good: 55, poor: 30 }, // fps
  errorRate: { good: 0.1, poor: 1.0 } // %
};

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    loadTime: 0,
    renderTime: 0,
    memoryUsage: 0,
    networkLatency: 0,
    frameRate: 0,
    bundleSize: 0,
    cacheHitRate: 0,
    errorRate: 0
  });

  const [score, setScore] = useState(100);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const frameId = useRef<number>();
  const lastFrameTime = useRef<number>();
  const frameCount = useRef(0);
  const startTime = useRef<number>();

  // Performance Observer for monitoring
  const observerRef = useRef<PerformanceObserver | null>(null);

  const startMonitoring = useCallback(() => {
    setIsMonitoring(true);
    startTime.current = performance.now();

    // Monitor navigation timing
    if ('performance' in window && 'getEntriesByType' in performance) {
      const navEntries = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
      if (navEntries.length > 0) {
        const nav = navEntries[0];
        setMetrics(prev => ({
          ...prev,
          loadTime: nav.loadEventEnd - nav.fetchStart
        }));
      }
    }

    // Monitor memory usage
    if ('memory' in performance) {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / (1024 * 1024) // Convert to MB
        }));
      }
    }

    // Monitor frame rate
    measureFrameRate();

    // Monitor render performance
    measureRenderPerformance();

    // Monitor resource loading
    monitorResourceLoading();

    // Set up periodic updates
    const interval = setInterval(updateMetrics, 1000);

    return () => {
      clearInterval(interval);
      if (frameId.current) {
        cancelAnimationFrame(frameId.current);
      }
    };
  }, []);

  useEffect(() => {
    startMonitoring();
    return () => stopMonitoring();
  }, [startMonitoring]);

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (frameId.current) {
      cancelAnimationFrame(frameId.current);
    }
    if (observerRef.current) {
      observerRef.current.disconnect();
    }
  };

  const measureFrameRate = () => {
    const measureFrame = (currentTime: number) => {
      if (lastFrameTime.current) {
        const delta = currentTime - lastFrameTime.current;
        frameCount.current++;
        
        if (frameCount.current >= 60) { // Calculate FPS every 60 frames
          const fps = 1000 / (delta / frameCount.current);
          setMetrics(prev => ({ ...prev, frameRate: fps }));
          frameCount.current = 0;
        }
      }
      lastFrameTime.current = currentTime;
      frameId.current = requestAnimationFrame(measureFrame);
    };
    
    frameId.current = requestAnimationFrame(measureFrame);
  };

  const measureRenderPerformance = () => {
    if ('PerformanceObserver' in window) {
      try {
        observerRef.current = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const renderEntries = entries.filter(entry => 
            entry.entryType === 'measure' || entry.entryType === 'paint'
          );
          
          if (renderEntries.length > 0) {
            const avgRenderTime = renderEntries.reduce((sum, entry) => 
              sum + entry.duration, 0) / renderEntries.length;
            setMetrics(prev => ({ ...prev, renderTime: avgRenderTime }));
          }
        });

        observerRef.current.observe({ entryTypes: ['measure', 'paint'] });
      } catch (error) {
        console.warn('PerformanceObserver not supported or failed:', error);
      }
    }
  };

  const monitorResourceLoading = () => {
    if ('PerformanceObserver' in window) {
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const networkEntries = entries.filter(entry => 
            entry.entryType === 'resource'
          ) as PerformanceResourceTiming[];
          
          if (networkEntries.length > 0) {
            const avgLatency = networkEntries.reduce((sum, entry) => 
              sum + entry.responseStart - entry.requestStart, 0) / networkEntries.length;
            setMetrics(prev => ({ ...prev, networkLatency: avgLatency }));
          }
        });

        resourceObserver.observe({ entryTypes: ['resource'] });
      } catch (error) {
        console.warn('Resource monitoring failed:', error);
      }
    }
  };

  const updateMetrics = () => {
    // Update memory usage
    if ('memory' in performance) {
      const memory = (performance as ExtendedPerformance).memory;
      if (memory) {
        setMetrics(prev => ({
          ...prev,
          memoryUsage: memory.usedJSHeapSize / (1024 * 1024)
        }));
      }
    }

    // Calculate cache hit rate (simplified)
    if ('performance' in window) {
      const resourceEntries = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const cacheHits = resourceEntries.filter(entry => entry.transferSize === 0).length;
      const cacheHitRate = resourceEntries.length > 0 ? (cacheHits / resourceEntries.length) * 100 : 0;
      setMetrics(prev => ({ ...prev, cacheHitRate }));
    }

    // Simulate error rate calculation
    const errorCount = parseInt(localStorage.getItem('dashboard_error_count') || '0');
    const totalRequests = parseInt(localStorage.getItem('dashboard_request_count') || '1');
    const errorRate = (errorCount / totalRequests) * 100;
    setMetrics(prev => ({ ...prev, errorRate }));
  };

  // Calculate performance score
  useEffect(() => {
    const calculateScore = () => {
      let totalScore = 0;
      let metrics_count = 0;

      // Score each metric (0-100)
      Object.entries(metrics).forEach(([key, value]) => {
        if (key in defaultThresholds) {
          const threshold = defaultThresholds[key as keyof PerformanceThresholds];
          let metricScore = 100;

          if (key === 'errorRate') {
            // Lower is better for error rate
            if (value <= threshold.good) metricScore = 100;
            else if (value <= threshold.poor) metricScore = 70;
            else metricScore = 30;
          } else {
            // Higher/Lower is better depending on metric
            const isLowerBetter = ['loadTime', 'renderTime', 'memoryUsage', 'networkLatency'].includes(key);
            
            if (isLowerBetter) {
              if (value <= threshold.good) metricScore = 100;
              else if (value <= threshold.poor) metricScore = 70;
              else metricScore = 30;
            } else {
              if (value >= threshold.good) metricScore = 100;
              else if (value >= threshold.poor) metricScore = 70;
              else metricScore = 30;
            }
          }

          totalScore += metricScore;
          metrics_count++;
        }
      });

      const finalScore = metrics_count > 0 ? Math.round(totalScore / metrics_count) : 100;
      setScore(finalScore);
    };

    calculateScore();
  }, [metrics]);

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 70) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 90) return { label: 'Excellent', variant: 'default', className: 'bg-green-100 text-green-800' };
    if (score >= 70) return { label: 'Good', variant: 'secondary', className: 'bg-yellow-100 text-yellow-800' };
    return { label: 'Needs Improvement', variant: 'destructive', className: 'bg-red-100 text-red-800' };
  };

  const getMetricStatus = (key: string, value: number) => {
    if (!(key in defaultThresholds)) return 'good';
    
    const threshold = defaultThresholds[key as keyof PerformanceThresholds];
    const isLowerBetter = ['loadTime', 'renderTime', 'memoryUsage', 'networkLatency', 'errorRate'].includes(key);
    
    if (isLowerBetter) {
      if (value <= threshold.good) return 'good';
      if (value <= threshold.poor) return 'warning';
      return 'poor';
    } else {
      if (value >= threshold.good) return 'good';
      if (value >= threshold.poor) return 'warning';
      return 'poor';
    }
  };

  const formatMetricValue = (key: string, value: number) => {
    switch (key) {
      case 'loadTime':
      case 'renderTime':
      case 'networkLatency':
        return `${value.toFixed(1)}ms`;
      case 'memoryUsage':
        return `${value.toFixed(1)}MB`;
      case 'frameRate':
        return `${value.toFixed(1)}fps`;
      case 'cacheHitRate':
      case 'errorRate':
        return `${value.toFixed(1)}%`;
      case 'bundleSize':
        return `${(value / 1024).toFixed(1)}KB`;
      default:
        return value.toFixed(2);
    }
  };

  const MetricCard = ({ 
    title, 
    value, 
    icon: Icon, 
    metricKey 
  }: { 
    title: string; 
    value: number; 
    icon: React.ElementType; 
    metricKey: string;
  }) => {
    const status = getMetricStatus(metricKey, value);
    const statusColors = {
      good: 'text-green-500 border-green-200',
      warning: 'text-yellow-500 border-yellow-200',
      poor: 'text-red-500 border-red-200'
    };

    return (
      <motion.div
        whileHover={{ scale: 1.02 }}
        className={`p-4 rounded-lg border-2 ${statusColors[status]} bg-slate-900/50`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4" />
            <span className="text-sm font-medium">{title}</span>
          </div>
          {status === 'good' && <CheckCircle className="h-4 w-4 text-green-500" />}
          {status === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500" />}
          {status === 'poor' && <AlertTriangle className="h-4 w-4 text-red-500" />}
        </div>
        <div className="mt-2">
          <span className="text-lg font-bold">{formatMetricValue(metricKey, value)}</span>
        </div>
      </motion.div>
    );
  };

  const scoreBadge = getScoreBadge(score);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Performance Monitor
              {isMonitoring && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="h-2 w-2 bg-green-500 rounded-full"
                />
              )}
            </CardTitle>
            <Badge className={scoreBadge.className}>
              Score: {score}/100 - {scoreBadge.label}
            </Badge>
          </div>
          <CardDescription>
            Real-time performance monitoring for dashboard optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Overall Score */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Performance Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(score)}`}>{score}/100</span>
            </div>
            <Progress value={score} className="h-3" />
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              title="Load Time"
              value={metrics.loadTime}
              icon={Clock}
              metricKey="loadTime"
            />
            <MetricCard
              title="Render Time"
              value={metrics.renderTime}
              icon={Zap}
              metricKey="renderTime"
            />
            <MetricCard
              title="Memory Usage"
              value={metrics.memoryUsage}
              icon={MemoryStick}
              metricKey="memoryUsage"
            />
            <MetricCard
              title="Network Latency"
              value={metrics.networkLatency}
              icon={Network}
              metricKey="networkLatency"
            />
            <MetricCard
              title="Frame Rate"
              value={metrics.frameRate}
              icon={TrendingUp}
              metricKey="frameRate"
            />
            <MetricCard
              title="Cache Hit Rate"
              value={metrics.cacheHitRate}
              icon={TrendingUp}
              metricKey="cacheHitRate"
            />
            <MetricCard
              title="Error Rate"
              value={metrics.errorRate}
              icon={AlertTriangle}
              metricKey="errorRate"
            />
          </div>

          {/* Controls */}
          <div className="mt-6 flex items-center gap-3">
            <Button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              variant={isMonitoring ? "destructive" : "default"}
              size="sm"
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              size="sm"
            >
              Reset Metrics
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default PerformanceMonitor;
