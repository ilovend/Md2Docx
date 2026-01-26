import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zh from './locales/zh.json';

// 从 localStorage 读取保存的语言设置
const savedLanguage = typeof window !== 'undefined' 
  ? localStorage.getItem('language') 
  : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      zh: { translation: zh },
    },
    lng: savedLanguage || 'zh', // 默认中文
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
