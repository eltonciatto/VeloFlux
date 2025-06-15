import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Cloud, Zap, Shield, Globe, Activity, Box, BarChart3, BookOpen, Brain, Github, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { LanguageSwitcher } from './LanguageSwitcher';

export const Hero = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      
      {/* Language Switcher */}
      <div className="absolute top-6 right-6 z-20">
        <LanguageSwitcher />
      </div>
      
      <div className="max-w-7xl mx-auto text-center relative z-10">
        <div className="mb-8">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-4 py-2 inline-flex items-center rounded-full">
            <Brain className="w-4 h-4 mr-2" />
            {t('hero.badge')}
          </Badge>
          
          <h1 className="text-6xl md:text-8xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            {t('hero.title')}
          </h1>
          
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-4xl mx-auto leading-relaxed">
            {t('hero.description', { 
              highlight: `${t('hero.descriptionHighlight')}` 
            }).split(t('hero.descriptionHighlight')).map((part, index, array) => (
              <React.Fragment key={index}>
                {part}
                {index < array.length - 1 && (
                  <span className="text-purple-300 font-semibold">
                    {t('hero.descriptionHighlight')}
                  </span>
                )}
              </React.Fragment>
            ))}
          </p>
        </div>

        <div className="flex flex-wrap justify-center gap-4 mb-12">
          <Button 
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            onClick={() => navigate('/dashboard')}
          >
            <Brain className="w-5 h-5 mr-2" />
            {t('hero.buttons.aiDashboard')}
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            onClick={() => window.open('https://github.com/eltonciatto/VeloFlux', '_blank')}
          >
            <Github className="w-5 h-5 mr-2" />
            {t('hero.buttons.github')}
          </Button>
          <Button 
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 text-lg font-semibold shadow-lg"
            onClick={() => window.open('https://veloflux.io/docs', '_blank')}
          >
            <BookOpen className="w-5 h-5 mr-2" />
            {t('hero.buttons.documentation')}
          </Button>
          <Button 
            variant="outline" 
            className="border-2 border-blue-400/70 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-8 py-3 text-lg font-semibold"
            onClick={() => navigate('/login')}
          >
            <Box className="w-5 h-5 mr-2" />
            {t('hero.buttons.demoLogin')}
          </Button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          <Card className="bg-slate-800/80 border-purple-400/40 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Brain className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{t('hero.stats.aiPowered')}</div>
            <div className="text-sm text-purple-200 font-medium">{t('hero.stats.intelligentRouting')}</div>
          </Card>
          
          <Card className="bg-slate-800/80 border-green-400/40 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Activity className="w-8 h-8 text-green-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">100k+</div>
            <div className="text-sm text-green-200 font-medium">{t('hero.stats.concurrentConnections')}</div>
          </Card>
          
          <Card className="bg-slate-800/80 border-yellow-400/40 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Zap className="w-8 h-8 text-yellow-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{'< 50 MB'}</div>
            <div className="text-sm text-yellow-200 font-medium">{t('hero.stats.containerSize')}</div>
          </Card>
          
          <Card className="bg-slate-800/80 border-blue-400/40 backdrop-blur-sm p-6 hover:bg-slate-800/90 transition-all duration-300 shadow-lg">
            <Shield className="w-8 h-8 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">99.99%</div>
            <div className="text-sm text-blue-200 font-medium">{t('hero.stats.uptimeSLA')}</div>
          </Card>
        </div>
      </div>
    </section>
  );
};
