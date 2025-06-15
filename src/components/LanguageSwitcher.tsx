import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

export const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const currentLang = i18n.language;
    const newLang = currentLang === 'en' ? 'pt-BR' : 'en';
    i18n.changeLanguage(newLang);
  };

  const getCurrentLanguageLabel = () => {
    return i18n.language === 'en' ? 'EN' : 'PT';
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleLanguage}
      className="border-white/20 text-white hover:bg-white/10 bg-transparent"
    >
      <Globe className="w-4 h-4 mr-2" />
      {getCurrentLanguageLabel()}
    </Button>
  );
};
