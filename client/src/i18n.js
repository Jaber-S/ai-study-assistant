import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import es from './messages/es.json';
import ca from './messages/ca.json';
import en from './messages/en.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: es },
      ca: { translation: ca },
      en: { translation: en },
    },
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;