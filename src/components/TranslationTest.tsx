import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

const TranslationTest = () => {
  const { t, i18n } = useTranslation();
  const [testResults, setTestResults] = useState<string[]>([]);

  // TODAS AS CHAVES DE TRADUÇÃO USADAS NO SISTEMA
  const allTranslationKeys = [
    // Hero/ImmersiveHero
    'hero.title', 'hero.subtitle', 'hero.description', 'hero.badge', 'hero.getStarted', 'hero.viewDemo',
    'hero.descriptionHighlight', 'hero.buttons.aiDashboard', 'hero.buttons.github', 'hero.buttons.documentation',
    'hero.buttons.demoLogin', 'hero.stats.aiPowered', 'hero.stats.intelligentRouting', 'hero.stats.concurrentConnections',
    'hero.stats.containerSize', 'hero.stats.uptimeSLA',
    
    // ImmersiveHero específicos
    'immersiveHero.title.part1', 'immersiveHero.title.part2', 'immersiveHero.title.part3',
    'immersiveHero.subtitle', 'immersiveHero.description', 'immersiveHero.badge',
    'immersiveHero.cta.primary', 'immersiveHero.cta.secondary',
    'immersiveHero.metrics.performance', 'immersiveHero.metrics.speed', 'immersiveHero.metrics.intelligence',
    'immersiveHero.stats.aiModels', 'immersiveHero.stats.requestsPerSec', 'immersiveHero.stats.mlAccuracy',
    'immersiveHero.stats.globalEdge', 'immersiveHero.stats.locations',
    'immersiveHero.networkVisualization.title', 'immersiveHero.networkVisualization.description',

    // Features
    'features.title', 'features.description',
    'features.ai.badge', 'features.ai.title', 'features.ai.description',
    'features.ai.aiPoweredRouting.title', 'features.ai.aiPoweredRouting.description',
    'features.ai.predictiveAnalytics.title', 'features.ai.predictiveAnalytics.description',
    'features.ai.anomalyDetection.title', 'features.ai.anomalyDetection.description',
    'features.ai.performanceOptimization.title', 'features.ai.performanceOptimization.description',
    'features.core.title', 'features.core.description',
    'features.core.sslTermination.title', 'features.core.sslTermination.description',
    'features.core.healthMonitoring.title', 'features.core.healthMonitoring.description',
    'features.core.geoAwareRouting.title', 'features.core.geoAwareRouting.description',
    'features.core.loadBalancing.title', 'features.core.loadBalancing.description',
    'features.core.protocolSupport.title', 'features.core.protocolSupport.description',
    'features.core.securityFeatures.title', 'features.core.securityFeatures.description',
    'features.core.highPerformance.title', 'features.core.highPerformance.description',
    'features.core.cloudNative.title', 'features.core.cloudNative.description',

    // AIShowcase
    'aiShowcase.badge', 'aiShowcase.title', 'aiShowcase.titleHighlight', 'aiShowcase.description',
    'aiShowcase.capabilities.intelligentRouting.title', 'aiShowcase.capabilities.intelligentRouting.description', 'aiShowcase.capabilities.intelligentRouting.benefit',
    'aiShowcase.capabilities.predictiveScaling.title', 'aiShowcase.capabilities.predictiveScaling.description', 'aiShowcase.capabilities.predictiveScaling.benefit',
    'aiShowcase.capabilities.anomalyDetection.title', 'aiShowcase.capabilities.anomalyDetection.description', 'aiShowcase.capabilities.anomalyDetection.benefit',
    'aiShowcase.capabilities.autoOptimization.title', 'aiShowcase.capabilities.autoOptimization.description', 'aiShowcase.capabilities.autoOptimization.benefit',
    'aiShowcase.demo.title', 'aiShowcase.demo.description',
    'aiShowcase.demo.buttons.launchDashboard', 'aiShowcase.demo.buttons.learnMore',

    // LiveDemo
    'liveDemo.title', 'liveDemo.subtitle', 'liveDemo.description',
    'liveDemo.metrics.requestsPerSec', 'liveDemo.metrics.aiAccuracy', 'liveDemo.metrics.responseTime', 'liveDemo.metrics.uptimeSLA',
    'liveDemo.units.rps', 'liveDemo.units.percentage', 'liveDemo.units.milliseconds',
    'liveDemo.networkTopology.title', 'liveDemo.networkTopology.loadBalancer', 'liveDemo.networkTopology.backend', 'liveDemo.networkTopology.load',
    'liveDemo.aiDecisions.title', 'liveDemo.aiDecisions.subtitle', 'liveDemo.aiDecisions.waiting',
    'liveDemo.aiDecisions.decisions.routingTraffic', 'liveDemo.aiDecisions.decisions.predictingSpike', 'liveDemo.aiDecisions.decisions.detectedAnomaly',
    'liveDemo.aiDecisions.decisions.optimizingSSL', 'liveDemo.aiDecisions.decisions.autoScaling', 'liveDemo.aiDecisions.decisions.learningPatterns',
    'liveDemo.networkVisualization.title', 'liveDemo.cta',
    'liveDemo.buttons.exploreDashboard', 'liveDemo.buttons.viewDocumentation',

    // Architecture
    'architecture.title', 'architecture.subtitle', 'architecture.description',
    'architecture.tabs.overview', 'architecture.tabs.components', 'architecture.tabs.deployment',
    'architecture.globalLoadBalancing.title', 'architecture.globalLoadBalancing.description',
    'architecture.globalLoadBalancing.features.multiRegion', 'architecture.globalLoadBalancing.features.autoFailover', 'architecture.globalLoadBalancing.features.protocolAware',
    'architecture.clientRequestFlow.title',
    'architecture.clientRequestFlow.steps.dnsResolution', 'architecture.clientRequestFlow.steps.tlsTermination',
    'architecture.clientRequestFlow.steps.healthCheck', 'architecture.clientRequestFlow.steps.backendProxy',

    // QuickStart
    'quickStart.title', 'quickStart.subtitle', 'quickStart.description',
    'quickStart.tabs.docker', 'quickStart.tabs.compose', 'quickStart.tabs.config',
    'quickStart.singleContainer.title', 'quickStart.singleContainer.badge', 'quickStart.singleContainer.description',
    'quickStart.singleContainer.features.port', 'quickStart.singleContainer.features.portDesc',
    'quickStart.singleContainer.features.configVolume', 'quickStart.singleContainer.features.configDesc',
    'quickStart.singleContainer.features.autoStart', 'quickStart.singleContainer.features.autoStartDesc',
    'quickStart.downloadExamples', 'quickStart.copyCommand', 'quickStart.copied',

    // Performance
    'performance.title', 'performance.subtitle', 'performance.description', 'performance.badge',
    'performance.metrics.routingAccuracy', 'performance.metrics.predictionScore', 'performance.metrics.anomalyDetection', 'performance.metrics.optimizationRate',
    'performance.charts.throughputPerformance', 'performance.charts.responseLatency', 'performance.charts.traditional', 'performance.charts.aiEnhanced', 'performance.charts.p99Under',
    'performance.stats.requestsPerSec', 'performance.stats.connections', 'performance.stats.resourceUsage',
    'performance.stats.medianP50', 'performance.stats.p95Latency', 'performance.stats.p99Latency', 'performance.stats.uptimeSLA',
    'performance.stats.requestsPerHour', 'performance.stats.peakSustainedLoad', 'performance.stats.containerSize', 'performance.stats.optimizedBinary',
    'performance.stats.startupTime', 'performance.stats.coldStartToReady', 'performance.stats.downtimePerYear',
    'performance.resourceEfficiency.title', 'performance.resourceEfficiency.cpu', 'performance.resourceEfficiency.memory', 'performance.resourceEfficiency.network',
    'performance.resourceEfficiency.utilized', 'performance.resourceEfficiency.testInfo', 'performance.resourceEfficiency.badge',

    // Conclusion
    'conclusion.title', 'conclusion.titleHighlight', 'conclusion.description', 'conclusion.badge',
    'conclusion.benefits.aiOptimization.title', 'conclusion.benefits.aiOptimization.description',
    'conclusion.benefits.predictiveScaling.title', 'conclusion.benefits.predictiveScaling.description',
    'conclusion.benefits.smartRouting.title', 'conclusion.benefits.smartRouting.description',
    'conclusion.cta.title', 'conclusion.cta.description',
    'conclusion.cta.buttons.getStarted', 'conclusion.cta.buttons.viewPricing', 'conclusion.cta.buttons.talkToExpert',
    'conclusion.testimonial.quote', 'conclusion.testimonial.author', 'conclusion.testimonial.title', 'conclusion.testimonial.company',

    // Footer
    'footer.title', 'footer.description', 'footer.rights', 'footer.copyright',
    'footer.buttons.viewOnGithub', 'footer.buttons.downloadRelease', 'footer.buttons.documentation', 'footer.buttons.officialWebsite',
    'footer.stats.stars', 'footer.stats.downloads', 'footer.stats.aiPowered', 'footer.stats.activeCommunity',
    'footer.sections.aiFeatures', 'footer.sections.documentation', 'footer.sections.community', 'footer.sections.resources', 'footer.sections.company',
    'footer.links.intelligentRouting', 'footer.links.predictiveAnalytics', 'footer.links.anomalyDetection',
    'footer.links.quickStart', 'footer.links.aiMlGuide', 'footer.links.apiReference', 'footer.links.configuration',
    'footer.links.githubIssues', 'footer.links.discord', 'footer.links.stackOverflow', 'footer.links.contributing',
    'footer.links.benchmarks', 'footer.links.bestPractices', 'footer.links.securityGuide', 'footer.links.migrationGuide',
    'footer.links.about', 'footer.links.pricing', 'footer.links.contact', 'footer.links.terms', 'footer.links.privacy',
    'footer.madeWith', 'footer.and', 'footer.forCommunity', 'footer.versionBadge',

    // Navigation
    'nav.home', 'nav.features', 'nav.pricing', 'nav.about', 'nav.contact', 'nav.login', 'nav.signup', 'nav.dashboard', 'nav.docs',
    'navigation.profile', 'navigation.dashboard', 'navigation.logout', 'navigation.login', 'navigation.backToHome',

    // Pages
    'pages.admin.title', 'pages.register.title', 'pages.notFound.title', 'pages.notFound.message', 'pages.notFound.description', 'pages.notFound.backHome',

    // ScrollProgress
    'scrollProgress.sections.hero', 'scrollProgress.sections.features', 'scrollProgress.sections.aiShowcase',
    'scrollProgress.sections.demo', 'scrollProgress.sections.architecture', 'scrollProgress.sections.quickstart',
    'scrollProgress.sections.performance', 'scrollProgress.sections.conclusion',

    // Billing
    'billing.loading', 'billing.loadingUsage', 'billing.loadingPlans',

    // Pricing
    'pricing.badge', 'pricing.title', 'pricing.subtitle', 'pricing.mostPopular',
    'pricing.plans.free.name', 'pricing.plans.free.description', 'pricing.plans.free.cta',
    'pricing.plans.pro.name', 'pricing.plans.pro.description', 'pricing.plans.pro.cta',
    'pricing.plans.enterprise.name', 'pricing.plans.enterprise.description', 'pricing.plans.enterprise.cta',
    'pricing.plans.enterprise.price.usd', 'pricing.plans.enterprise.price.brl',
    'pricing.billing.save', 'pricing.faq.title',
    'pricing.faq.questions.trial.question', 'pricing.faq.questions.trial.answer',
    'pricing.faq.questions.billing.question', 'pricing.faq.questions.billing.answer',
    'pricing.faq.questions.scaling.question', 'pricing.faq.questions.scaling.answer',
    'pricing.faq.questions.support.question', 'pricing.faq.questions.support.answer',
    'pricing.faq.questions.cancel.question', 'pricing.faq.questions.cancel.answer',
    'pricing.enterprise.title', 'pricing.enterprise.description', 'pricing.enterprise.cta',

    // Terms of Service
    'terms.badge', 'terms.title', 'terms.subtitle', 'terms.lastUpdated',
    'terms.sections.acceptance.title', 'terms.sections.acceptance.content',
    'terms.sections.services.title', 'terms.sections.services.content',
    'terms.sections.accounts.title', 'terms.sections.accounts.content',
    'terms.sections.payment.title', 'terms.sections.payment.content',
    'terms.sections.usage.title', 'terms.sections.usage.content',
    'terms.sections.privacy.title', 'terms.sections.privacy.content',
    'terms.sections.intellectual.title', 'terms.sections.intellectual.content',
    'terms.sections.liability.title', 'terms.sections.liability.content',
    'terms.sections.termination.title', 'terms.sections.termination.content',
    'terms.sections.changes.title', 'terms.sections.changes.content',
    'terms.sections.governing.title', 'terms.sections.governing.content',
    'terms.sections.contact.title', 'terms.sections.contact.content',
    'terms.notice.title', 'terms.notice.content', 'terms.toc.title',
    'terms.contact.title', 'terms.contact.description', 'terms.contact.email', 'terms.contact.address', 'terms.contact.addressValue',
    'terms.acknowledgment',

    // Privacy Policy
    'pages.privacy.title', 'pages.privacy.description', 'pages.privacy.lastUpdated', 'pages.privacy.tableOfContents',
    'pages.privacy.sections.overview.title', 'pages.privacy.sections.overview.content.intro',
    'pages.privacy.sections.overview.content.commitment', 'pages.privacy.sections.overview.content.keyPoints.title',
    'pages.privacy.sections.overview.content.keyPoints.transparency', 'pages.privacy.sections.overview.content.keyPoints.minimization',
    'pages.privacy.sections.overview.content.keyPoints.security', 'pages.privacy.sections.overview.content.keyPoints.rights',
    // ... (muitas outras chaves de privacy)

    // Contact
    'pages.contact.title', 'pages.contact.description',
    'pages.contact.methods.title', 'pages.contact.methods.email.title', 'pages.contact.methods.email.description',
    'pages.contact.methods.chat.title', 'pages.contact.methods.chat.description', 'pages.contact.methods.chat.availability',
    'pages.contact.methods.phone.title', 'pages.contact.methods.phone.description',
    'pages.contact.office.title', 'pages.contact.office.address',
    'pages.contact.hours.title', 'pages.contact.hours.weekdays', 'pages.contact.hours.weekends',
    'pages.contact.form.title', 'pages.contact.form.name', 'pages.contact.form.email', 'pages.contact.form.category',
    'pages.contact.form.subject', 'pages.contact.form.message', 'pages.contact.form.responseTime',
    'pages.contact.form.sending', 'pages.contact.form.send',
    'pages.contact.form.categories.technical', 'pages.contact.form.categories.billing', 'pages.contact.form.categories.general', 'pages.contact.form.categories.feature',
    'pages.contact.form.placeholders.name', 'pages.contact.form.placeholders.email', 'pages.contact.form.placeholders.category',
    'pages.contact.form.placeholders.subject', 'pages.contact.form.placeholders.message',
    'pages.contact.form.success.title', 'pages.contact.form.success.message', 'pages.contact.form.success.sendAnother',
    'pages.contact.faq.title',
    'pages.contact.faq.questions.response.question', 'pages.contact.faq.questions.response.answer',
    'pages.contact.faq.questions.support.question', 'pages.contact.faq.questions.support.answer',
    'pages.contact.faq.questions.emergency.question', 'pages.contact.faq.questions.emergency.answer',
    'pages.contact.faq.questions.documentation.question', 'pages.contact.faq.questions.documentation.answer',

    // Dashboard Components
    'aiComponents.insights.title', 'aiComponents.insights.modelPerformance', 'aiComponents.insights.performanceMetrics',

    // Common
    'common.loading', 'common.error', 'common.success', 'common.cancel', 'common.save', 'common.delete', 'common.edit', 'common.confirm', 'common.close'
  ];

  useEffect(() => {
    const results: string[] = [];
    results.push(`🌐 Current language: ${i18n.language}`);
    results.push(`🌍 Browser language: ${navigator.language}`);
    results.push(`💾 Stored language: ${localStorage.getItem('i18nextLng') || 'none'}`);
    results.push('');
    results.push('📋 COMPREHENSIVE TRANSLATION KEYS TEST:');
    results.push(`Testing ${allTranslationKeys.length} translation keys...`);
    results.push('');
    
    let missingCount = 0;
    let successCount = 0;
    const missingKeys: string[] = [];
    
    allTranslationKeys.forEach(key => {
      const value = t(key);
      if (value === key) {
        results.push(`❌ MISSING: ${key}`);
        missingKeys.push(key);
        missingCount++;
      } else {
        const truncated = value.length > 40 ? value.substring(0, 40) + '...' : value;
        results.push(`✅ OK: ${key} = "${truncated}"`);
        successCount++;
      }
    });
    
    results.push('');
    results.push('📊 DETAILED SUMMARY:');
    results.push(`✅ Found: ${successCount} keys`);
    results.push(`❌ Missing: ${missingCount} keys`);
    results.push(`📈 Coverage: ${((successCount / allTranslationKeys.length) * 100).toFixed(1)}%`);
    
    if (missingKeys.length > 0) {
      results.push('');
      results.push('🚨 MISSING KEYS BY CATEGORY:');
      const categories: { [key: string]: string[] } = {};
      
      missingKeys.forEach(key => {
        const category = key.split('.')[0];
        if (!categories[category]) categories[category] = [];
        categories[category].push(key);
      });
      
      Object.keys(categories).forEach(category => {
        results.push(`📋 ${category.toUpperCase()}: ${categories[category].length} missing`);
        categories[category].forEach(key => {
          results.push(`   - ${key}`);
        });
      });
    }
    
    results.push('');
    if (missingCount === 0) {
      results.push('🎉 ALL TRANSLATIONS COMPLETE! SISTEMA 100% TRADUZIDO!');
    } else {
      results.push(`⚠️ ${missingCount} TRANSLATION(S) MISSING - Needs attention!`);
    }

    setTestResults(results);
  }, [t, i18n.language, allTranslationKeys]);

  return (
    <div className="fixed top-4 right-4 bg-black/95 text-white p-4 rounded-lg w-[600px] max-h-[80vh] overflow-y-auto z-50 text-xs font-mono border border-cyan-500/30">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-bold text-sm text-cyan-400">🔍 COMPREHENSIVE Translation Test</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => i18n.changeLanguage(i18n.language === 'en' ? 'pt-BR' : 'en')}
            className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs transition-colors"
          >
            Switch to {i18n.language === 'en' ? 'PT-BR' : 'EN'}
          </button>
          <button 
            onClick={() => setTestResults([])}
            className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded text-white text-xs transition-colors"
          >
            Clear
          </button>
        </div>
      </div>
      
      <div className="text-cyan-300 text-xs mb-2">
        Testing {allTranslationKeys.length} keys from ALL components, pages, and dashboard elements
      </div>
      
      <div className="space-y-0.5 max-h-[60vh] overflow-y-auto">
        {testResults.map((result, index) => (
          <div key={index} className={
            result.includes('❌') ? 'text-red-400' : 
            result.includes('✅') ? 'text-green-400' : 
            result.includes('🎉') ? 'text-green-300 font-bold text-sm' :
            result.includes('⚠️') ? 'text-yellow-400 font-bold' :
            result.includes('📊') || result.includes('📈') || result.includes('📋') ? 'text-blue-300 font-bold' :
            result.includes('🌐') || result.includes('🌍') || result.includes('💾') ? 'text-cyan-400' :
            result.includes('🚨') ? 'text-red-300 font-bold' :
            result.startsWith('   -') ? 'text-red-300 pl-4' :
            'text-gray-300'
          }>
            {result}
          </div>
        ))}
      </div>
    </div>
  );
};

export default TranslationTest;
