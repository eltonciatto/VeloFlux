import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Database, 
  Cookie, 
  Mail, 
  Eye,
  Clock,
  Globe,
  FileText,
  UserCheck
} from 'lucide-react';

const PrivacyPolicy = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const sections = [
    { id: 'overview', icon: FileText, key: 'overview' },
    { id: 'information-collection', icon: Database, key: 'informationCollection' },
    { id: 'information-use', icon: Eye, key: 'informationUse' },
    { id: 'information-sharing', icon: Globe, key: 'informationSharing' },
    { id: 'data-security', icon: Shield, key: 'dataSecurity' },
    { id: 'cookies', icon: Cookie, key: 'cookies' },
    { id: 'user-rights', icon: UserCheck, key: 'userRights' },
    { id: 'data-retention', icon: Clock, key: 'dataRetention' },
    { id: 'contact', icon: Mail, key: 'contact' }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <div className="bg-slate-900/50 backdrop-blur-md border-b border-white/10 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-blue-200 hover:text-white hover:bg-blue-600/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('navigation.backToHome')}
            </Button>
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold text-lg">{t('pages.privacy.title')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents */}
          <div className="lg:col-span-1">
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 sticky top-32">
              <h3 className="text-white font-semibold mb-4 flex items-center">
                <FileText className="w-5 h-5 mr-2 text-blue-400" />
                {t('pages.privacy.tableOfContents')}
              </h3>
              <nav className="space-y-2">
                {sections.map((section) => {
                  const IconComponent = section.icon;
                  return (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className="w-full text-left text-sm text-blue-200 hover:text-white hover:bg-blue-600/20 p-2 rounded-lg transition-all duration-200 flex items-center"
                    >
                      <IconComponent className="w-4 h-4 mr-2" />
                      {t(`pages.privacy.sections.${section.key}.title`)}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8">
              {/* Header */}
              <div className="text-center mb-12">
                <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
                  <Shield className="w-10 h-10 mr-4 text-blue-400" />
                  {t('pages.privacy.title')}
                </h1>
                <p className="text-blue-200 text-lg max-w-3xl mx-auto">
                  {t('pages.privacy.description')}
                </p>
                <div className="mt-4 text-sm text-slate-400">
                  {t('pages.privacy.lastUpdated')}: {new Date().toLocaleDateString()}
                </div>
              </div>

              {/* Overview */}
              <section id="overview" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <FileText className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.overview.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.overview.content.intro')}</p>
                  <p>{t('pages.privacy.sections.overview.content.commitment')}</p>
                  <div className="bg-blue-900/30 p-4 rounded-lg">
                    <p className="font-semibold text-blue-200">{t('pages.privacy.sections.overview.content.keyPoints.title')}</p>
                    <ul className="mt-2 space-y-1">
                      <li>• {t('pages.privacy.sections.overview.content.keyPoints.transparency')}</li>
                      <li>• {t('pages.privacy.sections.overview.content.keyPoints.minimization')}</li>
                      <li>• {t('pages.privacy.sections.overview.content.keyPoints.security')}</li>
                      <li>• {t('pages.privacy.sections.overview.content.keyPoints.rights')}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Information Collection */}
              <section id="information-collection" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Database className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.informationCollection.title')}
                </h2>
                <div className="text-blue-100 space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-200 mb-3">
                      {t('pages.privacy.sections.informationCollection.personalInfo.title')}
                    </h3>
                    <ul className="space-y-2">
                      <li>• {t('pages.privacy.sections.informationCollection.personalInfo.email')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.personalInfo.name')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.personalInfo.organization')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.personalInfo.billing')}</li>
                    </ul>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-200 mb-3">
                      {t('pages.privacy.sections.informationCollection.technicalInfo.title')}
                    </h3>
                    <ul className="space-y-2">
                      <li>• {t('pages.privacy.sections.informationCollection.technicalInfo.ip')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.technicalInfo.logs')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.technicalInfo.usage')}</li>
                      <li>• {t('pages.privacy.sections.informationCollection.technicalInfo.performance')}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Information Use */}
              <section id="information-use" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Eye className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.informationUse.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.informationUse.intro')}</p>
                  <ul className="space-y-2">
                    <li>• {t('pages.privacy.sections.informationUse.purposes.service')}</li>
                    <li>• {t('pages.privacy.sections.informationUse.purposes.support')}</li>
                    <li>• {t('pages.privacy.sections.informationUse.purposes.billing')}</li>
                    <li>• {t('pages.privacy.sections.informationUse.purposes.improvement')}</li>
                    <li>• {t('pages.privacy.sections.informationUse.purposes.security')}</li>
                    <li>• {t('pages.privacy.sections.informationUse.purposes.communication')}</li>
                  </ul>
                </div>
              </section>

              {/* Information Sharing */}
              <section id="information-sharing" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Globe className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.informationSharing.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.informationSharing.policy')}</p>
                  <div className="bg-red-900/20 p-4 rounded-lg border border-red-500/30">
                    <h3 className="font-semibold text-red-200 mb-2">{t('pages.privacy.sections.informationSharing.exceptions.title')}</h3>
                    <ul className="space-y-1">
                      <li>• {t('pages.privacy.sections.informationSharing.exceptions.legal')}</li>
                      <li>• {t('pages.privacy.sections.informationSharing.exceptions.consent')}</li>
                      <li>• {t('pages.privacy.sections.informationSharing.exceptions.processors')}</li>
                      <li>• {t('pages.privacy.sections.informationSharing.exceptions.business')}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Data Security */}
              <section id="data-security" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Shield className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.dataSecurity.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.dataSecurity.commitment')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-green-900/20 p-4 rounded-lg border border-green-500/30">
                      <h3 className="font-semibold text-green-200 mb-2">
                        {t('pages.privacy.sections.dataSecurity.technical.title')}
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• {t('pages.privacy.sections.dataSecurity.technical.encryption')}</li>
                        <li>• {t('pages.privacy.sections.dataSecurity.technical.access')}</li>
                        <li>• {t('pages.privacy.sections.dataSecurity.technical.monitoring')}</li>
                      </ul>
                    </div>
                    <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                      <h3 className="font-semibold text-blue-200 mb-2">
                        {t('pages.privacy.sections.dataSecurity.organizational.title')}
                      </h3>
                      <ul className="text-sm space-y-1">
                        <li>• {t('pages.privacy.sections.dataSecurity.organizational.training')}</li>
                        <li>• {t('pages.privacy.sections.dataSecurity.organizational.policies')}</li>
                        <li>• {t('pages.privacy.sections.dataSecurity.organizational.audits')}</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              {/* Cookies */}
              <section id="cookies" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Cookie className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.cookies.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.cookies.description')}</p>
                  <div className="space-y-4">
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-200 mb-2">{t('pages.privacy.sections.cookies.essential.title')}</h3>
                      <p className="text-sm">{t('pages.privacy.sections.cookies.essential.description')}</p>
                    </div>
                    <div className="bg-slate-700/30 p-4 rounded-lg">
                      <h3 className="font-semibold text-blue-200 mb-2">{t('pages.privacy.sections.cookies.analytics.title')}</h3>
                      <p className="text-sm">{t('pages.privacy.sections.cookies.analytics.description')}</p>
                    </div>
                  </div>
                </div>
              </section>

              {/* User Rights */}
              <section id="user-rights" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <UserCheck className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.userRights.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.userRights.intro')}</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                      { key: 'access', icon: '👁️' },
                      { key: 'rectification', icon: '✏️' },
                      { key: 'erasure', icon: '🗑️' },
                      { key: 'portability', icon: '📦' },
                      { key: 'restriction', icon: '⏸️' },
                      { key: 'objection', icon: '🚫' }
                    ].map((right) => (
                      <div key={right.key} className="bg-slate-700/30 p-4 rounded-lg">
                        <h3 className="font-semibold text-blue-200 mb-2 flex items-center">
                          <span className="mr-2">{right.icon}</span>
                          {t(`pages.privacy.sections.userRights.rights.${right.key}.title`)}
                        </h3>
                        <p className="text-sm">{t(`pages.privacy.sections.userRights.rights.${right.key}.description`)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              {/* Data Retention */}
              <section id="data-retention" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.dataRetention.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.dataRetention.policy')}</p>
                  <div className="bg-yellow-900/20 p-4 rounded-lg border border-yellow-500/30">
                    <h3 className="font-semibold text-yellow-200 mb-2">{t('pages.privacy.sections.dataRetention.periods.title')}</h3>
                    <ul className="space-y-1">
                      <li>• {t('pages.privacy.sections.dataRetention.periods.account')}</li>
                      <li>• {t('pages.privacy.sections.dataRetention.periods.logs')}</li>
                      <li>• {t('pages.privacy.sections.dataRetention.periods.billing')}</li>
                      <li>• {t('pages.privacy.sections.dataRetention.periods.support')}</li>
                    </ul>
                  </div>
                </div>
              </section>

              {/* Contact */}
              <section id="contact" className="mb-12">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                  <Mail className="w-6 h-6 mr-3 text-blue-400" />
                  {t('pages.privacy.sections.contact.title')}
                </h2>
                <div className="text-blue-100 space-y-4">
                  <p>{t('pages.privacy.sections.contact.intro')}</p>
                  <div className="bg-slate-700/30 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-200 mb-4">{t('pages.privacy.sections.contact.methods.title')}</h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <Mail className="w-5 h-5 mr-3 text-blue-400" />
                        <div>
                          <span className="font-medium">Email: </span>
                          <a href="mailto:privacy@veloflux.com" className="text-blue-400 hover:text-blue-300">
                            privacy@veloflux.com
                          </a>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <Globe className="w-5 h-5 mr-3 text-blue-400" />
                        <div>
                          <span className="font-medium">{t('pages.privacy.sections.contact.methods.website')}: </span>
                          <a href="https://veloflux.com/contact" className="text-blue-400 hover:text-blue-300">
                            veloflux.com/contact
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>

              {/* Footer */}
              <div className="text-center pt-8 border-t border-slate-700">
                <p className="text-slate-400 text-sm">
                  {t('pages.privacy.footer.updates')}
                </p>
                <div className="mt-4">
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('navigation.backToHome')}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
