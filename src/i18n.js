import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import uz from "./locales/uz.json";
import en from "./locales/en.json";

const resources = {
  uz: { translation: uz },
  en: { translation: en },
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "uz",
    fallbackLng: "uz",
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;