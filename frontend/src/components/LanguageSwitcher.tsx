import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';

const languages = [
  { code: 'zh', label: '中文', flag: '🇨🇳' },
  { code: 'en', label: 'English', flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language;

  const handleChange = (langCode: string) => {
    i18n.changeLanguage(langCode);
    localStorage.setItem('language', langCode);
  };

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-gray-400" />
      <div className="flex gap-1">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              currentLang === lang.code || (currentLang.startsWith(lang.code))
                ? 'bg-blue-500/20 text-blue-400'
                : 'text-gray-400 hover:text-white hover:bg-[#1f2333]'
            }`}
            title={lang.label}
          >
            {lang.flag} {lang.label}
          </button>
        ))}
      </div>
    </div>
  );
}
