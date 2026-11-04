"use client";

import Link from "next/link";
import { categories, stateList } from "@/lib/data";
import { useLanguage } from "./LanguageProvider";
import { ui, categoryLabels, stateLabels } from "@/lib/i18n";

const socials = [
  { label: "Facebook", href: "#", path: "M14 9h3V6h-3c-1.7 0-3 1.3-3 3v2H9v3h2v6h3v-6h2.5l.5-3H14V9.5c0-.3.2-.5.5-.5Z" },
  { label: "Twitter", href: "#", path: "M21 5.9c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.6-2.2-.7.4-1.6.8-2.4.9A3.7 3.7 0 0 0 12 8.5c0 .3 0 .6.1.8a10.4 10.4 0 0 1-7.6-3.9c-.3.6-.5 1.2-.5 1.9 0 1.3.7 2.5 1.7 3.1-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.4 3 3.7-.3.1-.7.1-1 .1-.3 0-.5 0-.7-.1.5 1.5 1.9 2.6 3.6 2.7A7.4 7.4 0 0 1 3 18.4a10.4 10.4 0 0 0 5.7 1.7c6.8 0 10.6-5.7 10.6-10.6v-.5c.7-.5 1.3-1.2 1.7-2Z" },
  { label: "YouTube", href: "#", path: "M21.6 8.2a2.8 2.8 0 0 0-2-2C17.9 5.7 12 5.7 12 5.7s-5.9 0-7.6.5a2.8 2.8 0 0 0-2 2C2 9.9 2 12 2 12s0 2.1.4 3.8a2.8 2.8 0 0 0 2 2c1.7.5 7.6.5 7.6.5s5.9 0 7.6-.5a2.8 2.8 0 0 0 2-2c.4-1.7.4-3.8.4-3.8s0-2.1-.4-3.8ZM10 14.6V9.4L14.7 12 10 14.6Z" },
  { label: "Instagram", href: "#", path: "M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Zm0 5.8a2.3 2.3 0 1 1 0-4.6 2.3 2.3 0 0 1 0 4.6ZM16.9 5H7.1A2.1 2.1 0 0 0 5 7.1v9.8A2.1 2.1 0 0 0 7.1 19h9.8a2.1 2.1 0 0 0 2.1-2.1V7.1A2.1 2.1 0 0 0 16.9 5Zm1 11.9c0 .5-.4 1-1 1H7.1c-.5 0-1-.4-1-1V7.1c0-.5.4-1 1-1h9.8c.5 0 1 .4 1 1v9.8ZM16.7 6.9a.9.9 0 1 0 0 1.8.9.9 0 0 0 0-1.8Z" },
];

export default function Footer() {
  const { lang } = useLanguage();
  const t = ui[lang];
  return (
    <footer className="bg-navyDeep text-white/70">
      <div className="mx-auto max-w-wrap px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-4">
          {/* brand + about */}
          <div className="col-span-2 sm:col-span-1">
            <span className="font-serif text-2xl font-bold text-white">
              India Voice
            </span>
            <p className="mt-2 max-w-xs text-sm">{t.tagline}</p>
            <div className="mt-4 flex gap-2">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/70 transition hover:border-marigold hover:text-marigold"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                    <path d={s.path} />
                  </svg>
                </a>
              ))}
            </div>
          </div>

          {/* categories */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t.categoriesHeading}
            </h3>
            <ul className="space-y-2 text-sm">
              {categories.slice(0, 7).map((c) => (
                <li key={c}>
                  <Link href="#" className="hover:text-marigold">
                    {lang === "en" ? categoryLabels[c] ?? c : c}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* state quick links */}
          <div>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t.statesHeading}
            </h3>
            <ul className="space-y-2 text-sm">
              {stateList.slice(0, 7).map((st) => (
                <li key={st}>
                  <Link href="#" className="hover:text-marigold">
                    {lang === "en" ? stateLabels[st] ?? st : st}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* newsletter */}
          <div className="col-span-2 sm:col-span-1">
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/50">
              {t.newsletterTitle}
            </h3>
            <p className="text-sm">{t.newsletterBody}</p>
            <form
              onSubmit={(e) => e.preventDefault()}
              className="mt-3 flex overflow-hidden rounded-full border border-white/20 bg-white/5"
            >
              <input
                type="email"
                required
                placeholder={t.emailPlaceholder}
                className="w-full bg-transparent px-4 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <button
                type="submit"
                className="flex-none bg-marigold px-4 text-sm font-semibold text-navyDeep transition hover:bg-marigoldDeep"
              >
                {t.subscribe}
              </button>
            </form>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/10 pt-6 text-xs sm:flex-row sm:items-center sm:justify-between">
          <p>{t.rights}</p>
          <div className="flex flex-wrap gap-4">
            <Link href="#" className="hover:text-marigold">{t.aboutUs}</Link>
            <Link href="#" className="hover:text-marigold">{t.contact}</Link>
            <Link href="#" className="hover:text-marigold">{t.privacy}</Link>
            <Link href="#" className="hover:text-marigold">{t.advisory}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
