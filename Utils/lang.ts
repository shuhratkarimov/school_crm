import i18next from "i18next";
import Backend from "i18next-fs-backend";
import middleware from "i18next-http-middleware";

i18next
  .use(Backend)
  .use(middleware.LanguageDetector)
  .init({
    fallbackLng: "uz", 
    preload: ["en", "ru", "uz"],
    backend: { loadPath: "./locales/{{lng}}.json" },
  });

  export default i18next