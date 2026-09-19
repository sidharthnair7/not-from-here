import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Lang, DICT, TranslationKey, SPECIES_COMMON } from './dict';

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: TranslationKey) => string;
  getSpeciesCommon: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

const STORAGE_KEY = 'nfh_lang';

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'fr') return saved;
      if (navigator.language && navigator.language.toLowerCase().startsWith('fr')) {
        return 'fr';
      }
    } catch {
      // ignore
    }
    return 'en';
  });

  const setLang = useCallback((nextLang: Lang) => {
    setLangState(nextLang);
    try {
      localStorage.setItem(STORAGE_KEY, nextLang);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (key: TranslationKey): string => {
      const dict = DICT[lang] || DICT.en;
      return dict[key] || DICT.en[key] || key;
    },
    [lang]
  );

  const getSpeciesCommon = useCallback(
    (key: string, fallback?: string): string => {
      const entry = SPECIES_COMMON[key];
      if (entry && entry[lang]) return entry[lang];
      return fallback || '';
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, getSpeciesCommon }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = (): LanguageContextType => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useTranslation must be used within LanguageProvider');
  return ctx;
};
