import React from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText, Calendar, Mail, AlertCircle } from 'lucide-react';

const TermsOfService = () => {
  const { t } = useTranslation();

  const sections = [
    {
      id: 'acceptance',
      title: t('terms.sections.acceptance.title'),
      content: t('terms.sections.acceptance.content'),
    },
    {
      id: 'services',
      title: t('terms.sections.services.title'),
      content: t('terms.sections.services.content'),
    },
    {
      id: 'accounts',
      title: t('terms.sections.accounts.title'),
      content: t('terms.sections.accounts.content'),
    },
    {
      id: 'payment',
      title: t('terms.sections.payment.title'),
      content: t('terms.sections.payment.content'),
    },
    {
      id: 'usage',
      title: t('terms.sections.usage.title'),
      content: t('terms.sections.usage.content'),
    },
    {
      id: 'privacy',
      title: t('terms.sections.privacy.title'),
      content: t('terms.sections.privacy.content'),
    },
    {
      id: 'intellectual',
      title: t('terms.sections.intellectual.title'),
      content: t('terms.sections.intellectual.content'),
    },
    {
      id: 'liability',
      title: t('terms.sections.liability.title'),
      content: t('terms.sections.liability.content'),
    },
    {
      id: 'termination',
      title: t('terms.sections.termination.title'),
      content: t('terms.sections.termination.content'),
    },
    {
      id: 'changes',
      title: t('terms.sections.changes.title'),
      content: t('terms.sections.changes.content'),
    },
    {
      id: 'governing',
      title: t('terms.sections.governing.title'),
      content: t('terms.sections.governing.content'),
    },
    {
      id: 'contact',
      title: t('terms.sections.contact.title'),
      content: t('terms.sections.contact.content'),
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-100 border-purple-400/50 font-semibold">
            <ScrollText className="w-4 h-4 mr-2" />
            {t('terms.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            {t('terms.title')}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-8">
            {t('terms.subtitle')}
          </p>
          
          {/* Last Updated */}
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <Calendar className="w-4 h-4" />
            <span>{t('terms.lastUpdated')}: June 15, 2025</span>
          </div>
        </div>

        {/* Important Notice */}
        <Card className="max-w-4xl mx-auto mb-12 bg-amber-900/20 border-amber-600/50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-amber-200 mb-2">
                  {t('terms.notice.title')}
                </h3>
                <p className="text-amber-100">
                  {t('terms.notice.content')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table of Contents */}
        <Card className="max-w-4xl mx-auto mb-12 bg-slate-800/90 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">{t('terms.toc.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {sections.map((section, index) => (
                <a
                  key={section.id}
                  href={`#${section.id}`}
                  className="text-blue-400 hover:text-blue-300 transition-colors duration-200 p-2 rounded hover:bg-slate-700/50"
                >
                  {index + 1}. {section.title}
                </a>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Terms Sections */}
        <div className="max-w-4xl mx-auto space-y-8">
          {sections.map((section, index) => (
            <Card key={section.id} id={section.id} className="bg-slate-800/90 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white text-xl">
                  {index + 1}. {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-slate-300 whitespace-pre-line leading-relaxed">
                  {section.content}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Section */}
        <Card className="max-w-4xl mx-auto mt-12 bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-400/60">
          <CardContent className="pt-8 pb-8 text-center">
            <Mail className="w-12 h-12 text-purple-300 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-4">
              {t('terms.contact.title')}
            </h2>
            <p className="text-slate-300 mb-6">
              {t('terms.contact.description')}
            </p>
            <div className="space-y-2 text-slate-300">
              <p>
                <strong>{t('terms.contact.email')}:</strong> legal@veloflux.io
              </p>
              <p>
                <strong>{t('terms.contact.address')}:</strong> {t('terms.contact.addressValue')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Acknowledgment */}
        <Card className="max-w-4xl mx-auto mt-8 bg-slate-800/90 border-slate-700">
          <CardContent className="pt-6 text-center">
            <p className="text-slate-400">
              {t('terms.acknowledgment')}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TermsOfService;
