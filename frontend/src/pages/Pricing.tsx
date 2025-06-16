import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check, Star, Zap, Shield, Globe, Crown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Pricing = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [currency, setCurrency] = useState<'USD' | 'BRL'>('USD');
  const [isAnnual, setIsAnnual] = useState(false);

  // Auto-detect currency based on language
  useEffect(() => {
    const defaultCurrency = i18n.language === 'pt-BR' ? 'BRL' : 'USD';
    setCurrency(defaultCurrency);
  }, [i18n.language]);

  // Format price based on currency and billing period
  const formatPrice = (priceUSD: number, priceBRL: number) => {
    if (priceUSD === 0) return '0';
    
    const basePrice = currency === 'USD' ? priceUSD : priceBRL;
    const finalPrice = isAnnual ? Math.floor(basePrice * 0.8) : basePrice; // 20% discount for annual
    
    return finalPrice.toString();
  };

  const plans = [
    {
      name: t('pricing.plans.free.name'),
      description: t('pricing.plans.free.description'),
      priceUSD: 0,
      priceBRL: 0,
      icon: Globe,
      popular: false,
      features: t('pricing.plans.free.features', { returnObjects: true }) as string[],
      cta: t('pricing.plans.free.cta')
    },
    {
      name: t('pricing.plans.pro.name'),
      description: t('pricing.plans.pro.description'),
      priceUSD: 29,
      priceBRL: 149,
      icon: Zap,
      popular: true,
      features: t('pricing.plans.pro.features', { returnObjects: true }) as string[],
      cta: t('pricing.plans.pro.cta')
    },
    {
      name: t('pricing.plans.enterprise.name'),
      description: t('pricing.plans.enterprise.description'),
      priceUSD: 0, // Will show "Contact us"
      priceBRL: 0,
      icon: Crown,
      popular: false,
      features: t('pricing.plans.enterprise.features', { returnObjects: true }) as string[],
      cta: t('pricing.plans.enterprise.cta'),
      isContactSales: true
    }
  ];

  const faq = [
    {
      question: t('pricing.faq.questions.trial.question'),
      answer: t('pricing.faq.questions.trial.answer'),
    },
    {
      question: t('pricing.faq.questions.billing.question'),
      answer: t('pricing.faq.questions.billing.answer'),
    },
    {
      question: t('pricing.faq.questions.scaling.question'),
      answer: t('pricing.faq.questions.scaling.answer'),
    },
    {
      question: t('pricing.faq.questions.support.question'),
      answer: t('pricing.faq.questions.support.answer'),
    },
    {
      question: t('pricing.faq.questions.cancel.question'),
      answer: t('pricing.faq.questions.cancel.answer'),
    },
  ];

  const handleSelectPlan = (planName: string) => {
    if (planName === 'Free') {
      navigate('/register');
    } else if (planName === 'Enterprise') {
      navigate('/contact');
    } else {
      navigate('/register', { state: { plan: planName } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-gradient-to-r from-purple-600/30 to-blue-600/30 text-purple-100 border-purple-400/50 font-semibold">
            {t('pricing.badge')}
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-white via-blue-100 to-purple-200 bg-clip-text text-transparent mb-6">
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-slate-300 max-w-3xl mx-auto">
            {t('pricing.subtitle')}
          </p>
        </div>

        {/* Currency Toggle */}
        <div className="flex justify-center mb-12">
          <div className="bg-slate-800/50 rounded-lg p-1 border border-slate-700">
            <Button variant="outline" className="mr-2 bg-blue-600 text-white border-blue-500">
              USD ($)
            </Button>
            <Button variant="outline" className="bg-slate-700 text-slate-300 border-slate-600">
              BRL (R$)
            </Button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => {
            const IconComponent = plan.icon;
            return (
              <Card 
                key={index} 
                className={`relative ${
                  plan.popular 
                    ? 'bg-gradient-to-b from-purple-900/50 to-blue-900/50 border-purple-400/60 shadow-2xl scale-105' 
                    : 'bg-slate-800/90 border-slate-700'
                } transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-4 py-1">
                      <Star className="w-4 h-4 mr-1" />
                      {t('pricing.mostPopular')}
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                    plan.popular ? 'bg-purple-600/30' : 'bg-slate-700/50'
                  }`}>
                    <IconComponent className={`w-8 h-8 ${
                      plan.popular ? 'text-purple-300' : 'text-slate-300'
                    }`} />
                  </div>
                  <CardTitle className="text-2xl font-bold text-white">{plan.name}</CardTitle>
                  <CardDescription className="text-slate-400">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    {plan.isContactSales ? (
                      <div className="text-2xl font-bold text-white">
                        {currency === 'USD' ? 
                          t('pricing.plans.enterprise.price.usd') : 
                          t('pricing.plans.enterprise.price.brl')
                        }
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <span className="text-3xl font-bold text-white">
                          {currency === 'USD' ? '$' : 'R$'}
                        </span>
                        <span className="text-5xl font-bold text-white">
                          {formatPrice(plan.priceUSD, plan.priceBRL)}
                        </span>
                        {plan.priceUSD > 0 && (
                          <span className="text-slate-400 ml-2">
                            /{isAnnual ? 'year' : 'month'}
                          </span>
                        )}
                      </div>
                    )}
                    {isAnnual && plan.priceUSD > 0 && !plan.isContactSales && (
                      <div className="text-sm text-green-400 mt-1">
                        {t('pricing.billing.save')} vs monthly
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent>
                  <Button 
                    className={`w-full mb-6 ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                        : 'bg-slate-700 hover:bg-slate-600'
                    } text-white font-semibold`}
                    onClick={() => handleSelectPlan(plan.name)}
                  >
                    {plan.cta}
                  </Button>

                  <ul className="space-y-3">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center">
                        <Check className="w-5 h-5 text-green-400 mr-3 flex-shrink-0" />
                        <span className="text-slate-300">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ */}
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-center text-white mb-12">
            {t('pricing.faq.title')}
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            {faq.map((item, index) => (
              <Card key={index} className="bg-slate-800/90 border-slate-700">
                <CardContent className="pt-6">
                  <h3 className="text-lg font-semibold text-white mb-2">{item.question}</h3>
                  <p className="text-slate-400">{item.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Enterprise CTA */}
        <div className="text-center">
          <Card className="bg-gradient-to-r from-purple-900/50 to-blue-900/50 border-purple-400/60 max-w-4xl mx-auto">
            <CardContent className="pt-8 pb-8">
              <h2 className="text-3xl font-bold text-white mb-4">
                {t('pricing.enterprise.title')}
              </h2>
              <p className="text-slate-300 mb-6 text-lg">
                {t('pricing.enterprise.description')}
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold"
                onClick={() => navigate('/contact')}
              >
                {t('pricing.enterprise.cta')}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
