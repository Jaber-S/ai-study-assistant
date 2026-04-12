import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = (lng) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="flex gap-2">
      <button
        onClick={() => changeLanguage('es')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          i18n.language === 'es'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'
        }`}
      >
        ES
      </button>
      <button
        onClick={() => changeLanguage('ca')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          i18n.language === 'ca'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'
        }`}
      >
        CA
      </button>
      <button
        onClick={() => changeLanguage('en')}
        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
          i18n.language === 'en'
            ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
            : 'bg-gray-800/50 text-gray-400 hover:bg-gray-800/70'
        }`}
      >
        EN
      </button>
    </div>
  );
}