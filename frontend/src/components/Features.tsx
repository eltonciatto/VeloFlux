import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Zap, 
  Globe, 
  Activity, 
  Lock, 
  BarChart3,
  Cpu,
  Network,
  Timer,
  GitBranch,
  Brain,
  TrendingUp,
  AlertTriangle,
  Target
} from 'lucide-react';

export const Features = () => {
  const { t } = useTranslation();

  const aiFeatures = [
    {
      icon: Brain,
      title: t('features.ai.aiPoweredRouting.title'),
      description: t('features.ai.aiPoweredRouting.description'),
      badges: t('features.ai.aiPoweredRouting.badges', { returnObjects: true }) as string[]
    },
    {
      icon: TrendingUp,
      title: t('features.ai.predictiveAnalytics.title'),
      description: t('features.ai.predictiveAnalytics.description'),
      badges: t('features.ai.predictiveAnalytics.badges', { returnObjects: true }) as string[]
    },
    {
      icon: AlertTriangle,
      title: t('features.ai.anomalyDetection.title'),
      description: t('features.ai.anomalyDetection.description'),
      badges: t('features.ai.anomalyDetection.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Target,
      title: t('features.ai.performanceOptimization.title'),
      description: t('features.ai.performanceOptimization.description'),
      badges: t('features.ai.performanceOptimization.badges', { returnObjects: true }) as string[]
    }
  ];

  const coreFeatures = [
    {
      icon: Shield,
      title: t('features.core.sslTermination.title'),
      description: t('features.core.sslTermination.description'),
      badges: t('features.core.sslTermination.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Activity,
      title: t('features.core.healthMonitoring.title'),
      description: t('features.core.healthMonitoring.description'),
      badges: t('features.core.healthMonitoring.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Globe,
      title: t('features.core.geoAwareRouting.title'),
      description: t('features.core.geoAwareRouting.description'),
      badges: t('features.core.geoAwareRouting.badges', { returnObjects: true }) as string[]
    },
    {
      icon: BarChart3,
      title: t('features.core.loadBalancing.title'),
      description: t('features.core.loadBalancing.description'),
      badges: t('features.core.loadBalancing.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Network,
      title: t('features.core.protocolSupport.title'),
      description: t('features.core.protocolSupport.description'),
      badges: t('features.core.protocolSupport.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Lock,
      title: t('features.core.securityFeatures.title'),
      description: t('features.core.securityFeatures.description'),
      badges: t('features.core.securityFeatures.badges', { returnObjects: true }) as string[]
    },
    {
      icon: Cpu,
      title: t('features.core.highPerformance.title'),
      description: t('features.core.highPerformance.description'),
      badges: t('features.core.highPerformance.badges', { returnObjects: true }) as string[]
    },
    {
      icon: GitBranch,
      title: t('features.core.cloudNative.title'),
      description: t('features.core.cloudNative.description'),
      badges: t('features.core.cloudNative.badges', { returnObjects: true }) as string[]
    }
  ];

  return (
    <section className="py-20 px-4 relative">
      <div className="max-w-7xl mx-auto">
        {/* AI/ML Features Section */}
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Brain className="w-4 h-4 mr-2" />
            {t('features.ai.badge')}
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('features.ai.title')}
          </h2>
          <p className="text-xl text-purple-200 max-w-3xl mx-auto mb-12">
            {t('features.ai.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {aiFeatures.map((feature, index) => (
            <Card key={index} className="bg-slate-800/90 border-purple-400/60 backdrop-blur-sm p-6 hover:bg-slate-800 hover:border-purple-400/80 transition-all duration-300 group shadow-xl">
              <div className="mb-4">
                <feature.icon className="w-12 h-12 text-purple-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {feature.badges.map((badge, badgeIndex) => (
                  <Badge 
                    key={badgeIndex} 
                    className="bg-purple-600/40 text-purple-100 border-purple-400/70 text-xs font-semibold px-2 py-1 inline-flex items-center rounded-full"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>

        {/* Core Features Section */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('features.core.title')}
          </h2>
          <p className="text-xl text-blue-200 max-w-3xl mx-auto">
            {t('features.core.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {coreFeatures.map((feature, index) => (
            <Card key={index} className="bg-slate-800/90 border-blue-400/60 backdrop-blur-sm p-6 hover:bg-slate-800 hover:border-blue-400/80 transition-all duration-300 group shadow-xl">
              <div className="mb-4">
                <feature.icon className="w-12 h-12 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                <p className="text-slate-200 text-sm leading-relaxed">{feature.description}</p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {feature.badges.map((badge, badgeIndex) => (
                  <Badge 
                    key={badgeIndex} 
                    className="bg-blue-600/40 text-blue-100 border-blue-400/70 text-xs font-semibold px-2 py-1 inline-flex items-center rounded-full"
                  >
                    {badge}
                  </Badge>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
