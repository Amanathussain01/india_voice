"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { Lang } from "@/lib/i18n";

const LanguageContext = createContext<{
  lang: Lang;
  toggle: () => void;
}>({
  lang: "hi",
  toggle: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("hi");

  useEffect(() => {
    const stored = window.localStorage.getItem("iv-lang") as Lang | null;
    if (stored === "hi" || stored === "en") setLang(stored);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("iv-lang", lang);
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider
      value={{ lang, toggle: () => setLang((l) => (l === "hi" ? "en" : "hi")) }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
