import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslation from './locales/en/translation.json';
import ptBRTranslation from './locales/pt-BR/translation.json';

const resources = {
  en: {
    translation: enTranslation,
  },
  'pt-BR': {
    translation: ptBRTranslation,
  },
  pt: {
    translation: ptBRTranslation,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    debug: import.meta.env.DEV,
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => {
        // Force pt-BR for Portuguese speakers
        if (lng.startsWith('pt')) {
          console.log('Portuguese detected, forcing pt-BR:', lng);
          return 'pt-BR';
        }
        return lng;
      },
    },

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,
    },
  });

// Additional logic to ensure Brazilian users get pt-BR
const detectedLanguage = navigator.language || navigator.languages?.[0];
console.log('Browser language detection:', { 
  detectedLanguage, 
  navigatorLanguage: navigator.language,
  navigatorLanguages: navigator.languages,
  stored: localStorage.getItem('i18nextLng'),
  currentI18nLanguage: i18n.language
});

if (detectedLanguage?.startsWith('pt') && !localStorage.getItem('i18nextLng')) {
  console.log('Detected Portuguese browser, setting pt-BR as default');
  i18n.changeLanguage('pt-BR');
}

export default i18n;
