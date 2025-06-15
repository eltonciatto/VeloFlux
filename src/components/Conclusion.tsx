import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Sparkles, TrendingUp, Shield, Zap, ArrowRight, Quote } from 'lucide-react';

export const Conclusion = () => {
  const { t } = useTranslation();

  const benefits = [
    {
      icon: TrendingUp,
      titleKey: 'conclusion.benefits.aiOptimization.title',
      descriptionKey: 'conclusion.benefits.aiOptimization.description',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Shield,
      titleKey: 'conclusion.benefits.predictiveScaling.title',
      descriptionKey: 'conclusion.benefits.predictiveScaling.description',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Zap,
      titleKey: 'conclusion.benefits.smartRouting.title',
      descriptionKey: 'conclusion.benefits.smartRouting.description',
      color: 'from-purple-500 to-pink-500'
    }
  ];

  return (
    <section className="relative py-24 bg-gradient-to-b from-slate-900 via-blue-900 to-indigo-900 overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center px-4 py-2 rounded-full bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 mb-6">
            <Sparkles className="w-5 h-5 text-blue-400 mr-2" />
            <span className="text-blue-300 font-medium">{t('conclusion.badge')}</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('conclusion.title', {
              highlight: `<span class="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">${t('conclusion.titleHighlight')}</span>`
            }).split('{{highlight}}')[0]}
            <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              {t('conclusion.titleHighlight')}
            </span>
            {t('conclusion.title', {
              highlight: t('conclusion.titleHighlight')
            }).split('{{highlight}}')[1]}
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            {t('conclusion.description')}
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {benefits.map((benefit, index) => {
            const Icon = benefit.icon;
            return (
              <div
                key={index}
                className="group relative p-8 rounded-2xl bg-white/5 backdrop-blur-sm border border-white/10 hover:border-white/20 transition-all duration-300"
              >
                <div className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${benefit.color} mb-6`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                
                <h3 className="text-2xl font-bold text-white mb-3">
                  {t(benefit.titleKey)}
                </h3>
                
                <p className="text-gray-300 leading-relaxed">
                  {t(benefit.descriptionKey)}
                </p>
              </div>
            );
          })}
        </div>

        {/* Testimonial */}
        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 mb-16">
          <div className="flex items-start space-x-4">
            <Quote className="w-8 h-8 text-blue-400 flex-shrink-0 mt-1" />
            <div>
              <blockquote className="text-xl text-gray-200 italic mb-6 leading-relaxed">
                "{t('conclusion.testimonial.quote')}"
              </blockquote>
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-bold text-lg">
                    {t('conclusion.testimonial.author').charAt(0)}
                  </span>
                </div>
                <div>
                  <div className="text-white font-semibold">
                    {t('conclusion.testimonial.author')}
                  </div>
                  <div className="text-gray-400 text-sm">
                    {t('conclusion.testimonial.title')}, {t('conclusion.testimonial.company')}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <h3 className="text-3xl font-bold text-white mb-4">
            {t('conclusion.cta.title')}
          </h3>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            {t('conclusion.cta.description')}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              to="/register"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('conclusion.cta.buttons.getStarted')}
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            
            <Link
              to="/pricing"
              className="inline-flex items-center px-8 py-4 border-2 border-blue-500 text-blue-400 font-semibold rounded-xl hover:bg-blue-500/10 transition-all duration-200"
            >
              {t('conclusion.cta.buttons.viewPricing')}
            </Link>
            
            <Link
              to="/contact"
              className="inline-flex items-center px-8 py-4 text-gray-300 font-semibold hover:text-white transition-colors duration-200"
            >
              {t('conclusion.cta.buttons.talkToExpert')}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};
