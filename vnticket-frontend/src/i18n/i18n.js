import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import vi from './vi.json';
import en from './en.json';

i18n.use(initReactI18next).init({
  resources: {
    vi: { translation: vi },
    en: { translation: en },
  },
  lng: localStorage.getItem('language') || 'vi', // Đọc ngôn ngữ từ localStorage
  fallbackLng: 'vi',
  interpolation: {
    escapeValue: false, // React đã tự escape XSS
  },
});

export default i18n;
