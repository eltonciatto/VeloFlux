
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { 
  Github, 
  Star, 
  Download, 
  BookOpen, 
  MessageCircle,
  Heart,
  Zap,
  Shield,
  Globe,
  Brain,
  ExternalLink
} from 'lucide-react';

export const Footer = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  return (
    <footer className="py-20 px-4 border-t border-white/10">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <div className="mb-6">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              {t('footer.title')}
            </h2>
            <p className="text-xl text-blue-200 max-w-2xl mx-auto">
              {t('footer.description')}
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-4 mb-8">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 font-semibold shadow-lg"
              onClick={() => window.open('https://github.com/eltonciatto/VeloFlux', '_blank')}
            >
              <Github className="w-5 h-5 mr-2" />
              {t('footer.buttons.viewOnGithub')}
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-blue-400/60 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-6 py-3 font-semibold"
              onClick={() => window.open('https://github.com/eltonciatto/VeloFlux/releases', '_blank')}
            >
              <Download className="w-5 h-5 mr-2" />
              {t('footer.buttons.downloadRelease')}
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-blue-400/60 text-blue-100 hover:bg-blue-600/30 bg-slate-800/50 px-6 py-3 font-semibold"
              onClick={() => window.open('https://veloflux.io/docs', '_blank')}
            >
              <BookOpen className="w-5 h-5 mr-2" />
              {t('footer.buttons.documentation')}
            </Button>
            <Button 
              variant="outline" 
              className="border-2 border-purple-400/60 text-purple-100 hover:bg-purple-600/30 bg-slate-800/50 px-6 py-3 font-semibold"
              onClick={() => window.open('https://veloflux.io', '_blank')}
            >
              <ExternalLink className="w-5 h-5 mr-2" />
              {t('footer.buttons.officialWebsite')}
            </Button>
          </div>

          <div className="flex justify-center gap-6 mb-12">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-400" />
              <span className="text-blue-200">{t('footer.stats.stars').replace('{{count}}', '1.2k')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-green-400" />
              <span className="text-blue-200">{t('footer.stats.downloads').replace('{{count}}', '25k')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-purple-400" />
              <span className="text-blue-200">{t('footer.stats.aiPowered')}</span>
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="w-4 h-4 text-blue-400" />
              <span className="text-blue-200">{t('footer.stats.activeCommunity')}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">{t('footer.sections.aiFeatures')}</h3>
            <ul className="space-y-2 text-blue-200">
              <li className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-purple-400" />
                {t('footer.links.intelligentRouting')}
              </li>
              <li className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-yellow-400" />
                {t('footer.links.predictiveAnalytics')}
              </li>
              <li className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-400" />
                {t('footer.links.anomalyDetection')}
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">{t('footer.sections.documentation')}</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://veloflux.io/docs/quickstart" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.quickStart')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/ai-features" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.aiMlGuide')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.apiReference')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/configuration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.configuration')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">{t('footer.sections.community')}</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://github.com/eltonciatto/VeloFlux/issues" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.githubIssues')}
                </a>
              </li>
              <li>
                <a 
                  href="https://discord.gg/veloflux" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.discord')}
                </a>
              </li>
              <li>
                <a 
                  href="https://stackoverflow.com/questions/tagged/veloflux" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.stackOverflow')}
                </a>
              </li>
              <li>
                <a 
                  href="https://github.com/eltonciatto/VeloFlux/blob/main/CONTRIBUTING.md" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.contributing')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">{t('footer.sections.resources')}</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <a 
                  href="https://veloflux.io/benchmarks" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.benchmarks')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/best-practices" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.bestPractices')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/security" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.securityGuide')}
                </a>
              </li>
              <li>
                <a 
                  href="https://veloflux.io/docs/migration" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('footer.links.migrationGuide')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-lg font-semibold text-white mb-4">{t('footer.sections.company')}</h3>
            <ul className="space-y-2 text-blue-200">
              <li>
                <button 
                  onClick={() => navigate('/about')}
                  className="hover:text-white transition-colors text-left"
                >
                  {t('footer.links.about')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/pricing')}
                  className="hover:text-white transition-colors text-left"
                >
                  {t('footer.links.pricing')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/contact')}
                  className="hover:text-white transition-colors text-left"
                >
                  {t('footer.links.contact')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/terms')}
                  className="hover:text-white transition-colors text-left"
                >
                  {t('footer.links.terms')}
                </button>
              </li>
              <li>
                <button 
                  onClick={() => navigate('/privacy')}
                  className="hover:text-white transition-colors text-left"
                >
                  {t('footer.links.privacy')}
                </button>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-4">
              <div className="text-2xl font-bold bg-gradient-to-r from-white via-blue-200 to-purple-200 bg-clip-text text-transparent">
                VeloFlux LB
              </div>
              <Badge className="bg-gradient-to-r from-purple-600/40 to-blue-600/40 text-purple-100 border-purple-400/60 font-semibold px-3 py-1 inline-flex items-center rounded-full">
                {t('footer.versionBadge', { version: '0.0.6' })}
              </Badge>
            </div>
            
            <div className="flex items-center gap-4 text-blue-200">
              <span>{t('footer.madeWith')}</span>
              <Heart className="w-4 h-4 text-red-400" />
              <span>{t('footer.and')}</span>
              <Brain className="w-4 h-4 text-purple-400" />
              <span>{t('footer.forCommunity')}</span>
            </div>
            
            <div className="text-blue-200 text-sm">
              {t('footer.copyright', { year: '2025' })}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
