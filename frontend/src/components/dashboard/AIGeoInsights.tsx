import React from 'react';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Globe,
  MapPin,
  Zap,
  TrendingUp,
  Users,
  Activity,
} from 'lucide-react';
import { useAIGeoMetrics } from '@/hooks/useAIMetrics';

interface AIGeoInsightsProps {
  className?: string;
}

const AIGeoInsights: React.FC<AIGeoInsightsProps> = ({ className = '' }) => {
  const { data: geoMetrics, isLoading, error } = useAIGeoMetrics();

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !geoMetrics) {
    return (
      <Card className={`bg-slate-800/50 border-slate-700 ${className}`}>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <Globe className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">Geographic insights unavailable</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getAffinityColor = (score: number) => {
    if (score >= 0.8) return 'text-green-400';
    if (score >= 0.6) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getAffinityBadgeVariant = (score: number): "default" | "secondary" | "destructive" | "outline" => {
    if (score >= 0.8) return 'default';
    if (score >= 0.6) return 'secondary';
    return 'destructive';
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Globe className="h-5 w-5 text-blue-400" />
          AI Geographic Intelligence
        </h3>
        <p className="text-slate-400">Performance insights based on geographic optimization</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Geo Predictions</p>
                  <p className="text-2xl font-bold text-white">
                    {formatNumber(geoMetrics.geo_predictions)}
                  </p>
                </div>
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <MapPin className="h-5 w-5 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Geo Affinity</p>
                  <p className={`text-2xl font-bold ${getAffinityColor(geoMetrics.average_geo_affinity)}`}>
                    {(geoMetrics.average_geo_affinity * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-2 bg-green-500/20 rounded-lg">
                  <Activity className="h-5 w-5 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Cross-Region</p>
                  <p className="text-2xl font-bold text-yellow-400">
                    {formatNumber(geoMetrics.cross_region_requests)}
                  </p>
                </div>
                <div className="p-2 bg-yellow-500/20 rounded-lg">
                  <Users className="h-5 w-5 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Optimizations</p>
                  <p className="text-2xl font-bold text-green-400">
                    {formatNumber(geoMetrics.geo_optimizations)}
                  </p>
                </div>
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Zap className="h-5 w-5 text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Regional Performance */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Regional Performance
          </CardTitle>
          <CardDescription>AI prediction performance by geographic region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {geoMetrics.regions?.map((region, index) => (
              <motion.div
                key={region.region}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-white font-medium">{region.region}</span>
                    <Badge variant={getAffinityBadgeVariant(region.optimization_score)}>
                      {(region.optimization_score * 100).toFixed(0)}% efficient
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-slate-400">Predictions:</span>
                      <span className="ml-2 text-white">{formatNumber(region.predictions)}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Avg Latency:</span>
                      <span className="ml-2 text-white">{region.avg_latency}ms</span>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Progress 
                      value={region.optimization_score * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Geographic Optimization Insights */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Optimization Insights</CardTitle>
          <CardDescription>AI recommendations for geographic optimization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <div className="p-1 bg-blue-500/20 rounded">
                <Globe className="h-4 w-4 text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-200">Geographic Affinity</p>
                <p className="text-sm text-blue-300">
                  Average geo-affinity of {(geoMetrics.average_geo_affinity * 100).toFixed(1)}% 
                  {geoMetrics.average_geo_affinity >= 0.8 ? ' - Excellent' : 
                   geoMetrics.average_geo_affinity >= 0.6 ? ' - Good' : ' - Needs improvement'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <div className="p-1 bg-yellow-500/20 rounded">
                <MapPin className="h-4 w-4 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-200">Cross-Region Traffic</p>
                <p className="text-sm text-yellow-300">
                  {formatNumber(geoMetrics.cross_region_requests)} cross-region requests detected
                  {geoMetrics.cross_region_requests > 1000 ? ' - Consider regional scaling' : ' - Normal levels'}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
              <div className="p-1 bg-green-500/20 rounded">
                <Zap className="h-4 w-4 text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-200">Optimizations Applied</p>
                <p className="text-sm text-green-300">
                  {formatNumber(geoMetrics.geo_optimizations)} geographic optimizations applied successfully
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AIGeoInsights;
