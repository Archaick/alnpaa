import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";

// src/i18n.js
i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: "en",
    fallbackLng: "en",
    supportedLngs: ["en", "ar"],
    backend: {
      loadPath: "/locales/{{lng}}/{{ns}}.json",
    },
    ns: ["auth/AdminLogin"],
    defaultNS: "auth/AdminLogin",
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

