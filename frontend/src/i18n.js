import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

const resources = {
  en: {
    translation: {
      "nav.dashboard": "Dashboard",
      "nav.students": "Students",
      "common.welcome": "Welcome back"
    }
  },
  hi: {
    translation: {
      "nav.dashboard": "डैशबोर्ड",
      "nav.students": "छात्र",
      "common.welcome": "वापसी पर स्वागत है"
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: "en",
    interpolation: { escapeValue: false }
  });

export default i18n;
