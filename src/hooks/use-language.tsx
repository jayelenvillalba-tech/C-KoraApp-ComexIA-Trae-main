import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

type Language = "es" | "en" | "pt" | "zh";

export function LanguageProvider({ children }: { children: ReactNode }) {
  // Provider is no longer needed since react-i18next handles state globally
  return <>{children}</>;
}

export function useLanguage() {
  const { t, i18n } = useTranslation();
  
  return {
    language: i18n.language as Language,
    setLanguage: (lang: Language) => {
      i18n.changeLanguage(lang);
      // Optional: Save to localStorage or user profile later
    },
    t
  };
}
