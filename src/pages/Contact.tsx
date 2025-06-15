import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Mail, 
  MessageCircle, 
  Phone,
  MapPin,
  Clock,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Bug,
  Lightbulb
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const Contact = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    category: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsSubmitting(false);
    setIsSubmitted(true);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const contactMethods = [
    {
      icon: Mail,
      title: t('pages.contact.methods.email.title'),
      description: t('pages.contact.methods.email.description'),
      value: 'support@veloflux.com',
      link: 'mailto:support@veloflux.com'
    },
    {
      icon: MessageCircle,
      title: t('pages.contact.methods.chat.title'),
      description: t('pages.contact.methods.chat.description'),
      value: t('pages.contact.methods.chat.availability'),
      link: '#'
    },
    {
      icon: Phone,
      title: t('pages.contact.methods.phone.title'),
      description: t('pages.contact.methods.phone.description'),
      value: '+1 (555) 123-4567',
      link: 'tel:+15551234567'
    }
  ];

  const categories = [
    { value: 'technical', icon: Bug, label: t('pages.contact.form.categories.technical') },
    { value: 'billing', icon: AlertCircle, label: t('pages.contact.form.categories.billing') },
    { value: 'general', icon: HelpCircle, label: t('pages.contact.form.categories.general') },
    { value: 'feature', icon: Lightbulb, label: t('pages.contact.form.categories.feature') }
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
              <MessageCircle className="w-6 h-6 text-blue-400" />
              <span className="text-white font-semibold text-lg">{t('pages.contact.title')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-white mb-4 flex items-center justify-center">
            <MessageCircle className="w-10 h-10 mr-4 text-blue-400" />
            {t('pages.contact.title')}
          </h1>
          <p className="text-blue-200 text-lg max-w-3xl mx-auto">
            {t('pages.contact.description')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Contact Methods */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">{t('pages.contact.methods.title')}</h2>
            
            {contactMethods.map((method, index) => {
              const IconComponent = method.icon;
              return (
                <div key={index} className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 hover:bg-slate-800/70 transition-all duration-200">
                  <div className="flex items-start space-x-4">
                    <div className="bg-blue-600 p-3 rounded-lg">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-2">{method.title}</h3>
                      <p className="text-blue-200 text-sm mb-3">{method.description}</p>
                      <a 
                        href={method.link}
                        className="text-blue-400 hover:text-blue-300 font-medium text-sm"
                      >
                        {method.value}
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Office Info */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">{t('pages.contact.office.title')}</h3>
                  <p className="text-blue-200 text-sm">{t('pages.contact.office.address')}</p>
                </div>
              </div>
            </div>

            {/* Business Hours */}
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="bg-blue-600 p-3 rounded-lg">
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <h3 className="text-white font-semibold mb-2">{t('pages.contact.hours.title')}</h3>
                  <div className="text-blue-200 text-sm space-y-1">
                    <p>{t('pages.contact.hours.weekdays')}</p>
                    <p>{t('pages.contact.hours.weekends')}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8">
              <h2 className="text-2xl font-bold text-white mb-6">{t('pages.contact.form.title')}</h2>
              
              {!isSubmitted ? (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="name" className="text-blue-200 font-medium">
                        {t('pages.contact.form.name')} *
                      </Label>
                      <Input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => handleInputChange('name', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                        placeholder={t('pages.contact.form.placeholders.name')}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="email" className="text-blue-200 font-medium">
                        {t('pages.contact.form.email')} *
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                        placeholder={t('pages.contact.form.placeholders.email')}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="category" className="text-blue-200 font-medium">
                        {t('pages.contact.form.category')} *
                      </Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="mt-2 bg-slate-700/50 border-slate-600 text-white">
                          <SelectValue placeholder={t('pages.contact.form.placeholders.category')} />
                        </SelectTrigger>
                        <SelectContent className="bg-slate-800 border-slate-700">
                          {categories.map((cat) => {
                            const IconComponent = cat.icon;
                            return (
                              <SelectItem key={cat.value} value={cat.value} className="text-white hover:bg-slate-700">
                                <div className="flex items-center">
                                  <IconComponent className="w-4 h-4 mr-2" />
                                  {cat.label}
                                </div>
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="subject" className="text-blue-200 font-medium">
                        {t('pages.contact.form.subject')} *
                      </Label>
                      <Input
                        id="subject"
                        type="text"
                        value={formData.subject}
                        onChange={(e) => handleInputChange('subject', e.target.value)}
                        className="mt-2 bg-slate-700/50 border-slate-600 text-white"
                        placeholder={t('pages.contact.form.placeholders.subject')}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="message" className="text-blue-200 font-medium">
                      {t('pages.contact.form.message')} *
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      className="mt-2 bg-slate-700/50 border-slate-600 text-white min-h-[120px]"
                      placeholder={t('pages.contact.form.placeholders.message')}
                      required
                    />
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-lg border border-blue-500/30">
                    <p className="text-blue-200 text-sm">
                      {t('pages.contact.form.responseTime')}
                    </p>
                  </div>

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        {t('pages.contact.form.sending')}
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <Send className="w-4 h-4 mr-2" />
                        {t('pages.contact.form.send')}
                      </div>
                    )}
                  </Button>
                </form>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-6" />
                  <h3 className="text-2xl font-bold text-white mb-4">
                    {t('pages.contact.form.success.title')}
                  </h3>
                  <p className="text-blue-200 mb-6">
                    {t('pages.contact.form.success.message')}
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    className="mr-4"
                  >
                    {t('pages.contact.form.success.sendAnother')}
                  </Button>
                  <Button
                    onClick={() => navigate('/')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {t('navigation.backToHome')}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 text-center">
              {t('pages.contact.faq.title')}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  question: t('pages.contact.faq.questions.response.question'),
                  answer: t('pages.contact.faq.questions.response.answer')
                },
                {
                  question: t('pages.contact.faq.questions.support.question'),
                  answer: t('pages.contact.faq.questions.support.answer')
                },
                {
                  question: t('pages.contact.faq.questions.emergency.question'),
                  answer: t('pages.contact.faq.questions.emergency.answer')
                },
                {
                  question: t('pages.contact.faq.questions.documentation.question'),
                  answer: t('pages.contact.faq.questions.documentation.answer')
                }
              ].map((faq, index) => (
                <div key={index} className="bg-slate-700/30 p-4 rounded-lg">
                  <h3 className="text-blue-200 font-semibold mb-2">{faq.question}</h3>
                  <p className="text-blue-100 text-sm">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
