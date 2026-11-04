"use client";

import { useLanguage } from "./LanguageProvider";
import { ui } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, toggle } = useLanguage();
  const t = ui[lang];

  return (
    <button
      onClick={toggle}
      aria-label={t.langAria}
      className="flex h-9 flex-none items-center justify-center gap-1 rounded-full border border-line px-3 text-xs font-bold text-ink/70 transition hover:border-navy/40 hover:text-navy dark:border-white/15 dark:text-white/70 dark:hover:border-marigold/50 dark:hover:text-marigold"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
        <path d="M3 12h18M12 3c2.5 2.5 3.8 5.7 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.7-3.8-9S9.5 5.5 12 3Z" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      {t.langButton}
    </button>
  );
}
