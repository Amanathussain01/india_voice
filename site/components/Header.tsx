"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { categories, ticker } from "@/lib/data";
import { tickerEn, articleTranslations } from "@/lib/i18n-articles";
import { ui, categoryLabels } from "@/lib/i18n";
import { searchNews } from "@/lib/search";
import { useLanguage } from "./LanguageProvider";
import ThemeToggle from "./ThemeToggle";
import LanguageToggle from "./LanguageToggle";
import MarketTicker from "./MarketTicker";
import CategoryNavItem from "./CategoryNavItem";

function useNow() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(id);
  }, []);

  return now;
}

export default function Header() {
  const router = useRouter();
  const { lang } = useLanguage();
  const t = ui[lang];

  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [contributor, setContributor] = useState<{ name: string } | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const now = useNow();

  useEffect(() => {
    try {
      const saved = localStorage.getItem("iv_public_user");
      if (saved) setContributor(JSON.parse(saved));
    } catch {
      localStorage.removeItem("iv_public_user");
    }
    const syncAuth = () => {
      try {
        const saved = localStorage.getItem("iv_public_user");
        setContributor(saved ? JSON.parse(saved) : null);
      } catch { setContributor(null); }
    };
    window.addEventListener("iv-auth-changed", syncAuth);
    return () => window.removeEventListener("iv-auth-changed", syncAuth);
  }, []);

  async function publicLogout() {
    setProfileOpen(false);
    const token = localStorage.getItem("iv_public_token");
    try {
      if (token) await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:5013"}/api/auth/logout`, { method: "POST", headers: { Authorization: `Bearer ${token}` } });
    } catch { /* clear local login even when the API is unavailable */ }
    localStorage.removeItem("iv_public_token");
    localStorage.removeItem("iv_public_user");
    setContributor(null);
    window.dispatchEvent(new Event("iv-auth-changed"));
  }

  const dateLabel = now
    ? now.toLocaleDateString(t.locale, {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "";
  const timeLabel = now
    ? now.toLocaleTimeString(t.locale, { hour: "2-digit", minute: "2-digit" })
    : "";

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      searchInputRef.current?.focus();
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
    setSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-paper dark:bg-ink">
      {/* masthead */}
      <div className="mx-auto flex max-w-wrap items-start justify-between gap-3 px-4 py-3 sm:px-6">
        <div className="flex items-start gap-3">
          <button
            className="-ml-1 flex h-9 w-9 flex-none items-center justify-center rounded-sm text-navy dark:text-white/80 md:hidden"
            aria-label={t.menu}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {open ? (
                <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              )}
            </svg>
          </button>

          <div>
            <Link href="/" className="font-serif text-2xl font-bold tracking-tight text-navyDeep dark:text-white sm:text-3xl">
              India Voice
            </Link>
            {/* date + live time, directly under the logo */}
            <p className="mt-0.5 text-xs text-ink/60 dark:text-white/50" suppressHydrationWarning>
              {dateLabel}
              {timeLabel ? <span className="ml-2 font-medium text-navy dark:text-marigold">{timeLabel}</span> : null}
            </p>
          </div>
        </div>

        {/* right side: market/weather ticker, language toggle, search, login, theme */}
        <div className="flex flex-none items-center gap-2 sm:gap-3">
          <Link href="/user-grievances" className="hidden rounded-full border border-line px-3 py-2 text-xs font-semibold text-ink/70 hover:bg-paper dark:border-white/15 dark:text-white/70 lg:inline-flex">User Grievances</Link>
          <MarketTicker />
          <LanguageToggle />

          {/* search — desktop: expands inline, shows a live dropdown as you type, submits to /search?q= for the full results page */}
          <form role="search" onSubmit={runSearch} className="relative hidden items-center sm:flex">
            <div
              className={`flex items-center overflow-hidden rounded-full border border-line bg-white transition-all duration-200 dark:border-white/15 dark:bg-white/5 ${
                searchOpen ? "w-56 px-3" : "w-9 justify-center"
              }`}
            >
              <button
                type={searchOpen ? "submit" : "button"}
                aria-label={t.search}
                onClick={() => {
                  if (!searchOpen) {
                    setSearchOpen(true);
                    // input isn't mounted yet on this click — focus next tick
                    setTimeout(() => searchInputRef.current?.focus(), 0);
                  }
                }}
                className="flex h-9 w-9 flex-none items-center justify-center text-ink/60 dark:text-white/60"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
                  <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
              {searchOpen && (
                <input
                  ref={searchInputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onBlur={() => {
                    // small delay so a click on a dropdown item registers
                    // before we close/collapse the search box
                    setTimeout(() => {
                      if (!query) setSearchOpen(false);
                    }, 150);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setQuery("");
                      setSearchOpen(false);
                    }
                  }}
                  type="search"
                  placeholder={t.searchPlaceholder}
                  className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-ink/40 focus:outline-none dark:text-white dark:placeholder:text-white/40"
                />
              )}
            </div>

            {/* live keyword matches — updates as you type */}
            {searchOpen && query.trim().length > 0 && (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 overflow-hidden rounded-md border border-line bg-white shadow-xl dark:border-white/10 dark:bg-navyDeep">
                <SearchSuggestions query={query} lang={lang} onNavigate={() => setSearchOpen(false)} />
              </div>
            )}
          </form>

          {/* search icon only, for small screens — goes straight to the search page */}
          <Link
            href="/search"
            aria-label={t.search}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-ink/70 dark:border-white/15 dark:text-white/70 sm:hidden"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.8" />
              <path d="M21 21l-4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </Link>

          {contributor ? (
            <div className="relative">
              <button type="button" onClick={() => setProfileOpen(v => !v)} className="flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white dark:bg-marigold dark:text-navyDeep sm:px-4 sm:text-sm"><span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white/20">{contributor.name[0]?.toUpperCase()}</span><span className="hidden sm:inline">{contributor.name}</span><span>⌄</span></button>
              {profileOpen && <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-lg border border-line bg-white p-1 text-sm shadow-xl dark:border-white/10 dark:bg-navyDeep"><Link onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 hover:bg-paper dark:hover:bg-white/10" href="/post-news">Post News</Link><a onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 hover:bg-paper dark:hover:bg-white/10" href="/post-grievance">Post Grievance</a><Link onClick={() => setProfileOpen(false)} className="block rounded-md px-3 py-2 hover:bg-paper dark:hover:bg-white/10" href="/feedback-status">Feedback Status</Link><button onClick={publicLogout} className="block w-full rounded-md px-3 py-2 text-left text-red-600 hover:bg-red-50 dark:hover:bg-white/10">Logout</button></div>}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-1.5 rounded-full bg-navy px-3 py-2 text-xs font-semibold text-white transition hover:bg-navyDeep dark:bg-marigold dark:text-navyDeep dark:hover:bg-marigoldDeep sm:px-4 sm:text-sm"><svg width="15" height="15" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="3.5" stroke="currentColor" strokeWidth="1.8" /><path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>{t.login}</Link>
          )}

          <ThemeToggle />
        </div>
      </div>

      {/* breaking news ticker */}
      <div className="border-y border-navyDeep/10 bg-navyDeep text-white">
        <div className="mx-auto flex max-w-wrap items-center px-4 sm:px-6">
          <span className="mr-3 flex-none bg-marigold px-2 py-1.5 text-xs font-bold text-navyDeep">
            {t.newsFlash}
          </span>
          <div className="relative flex-1 overflow-hidden py-2">
            <div className="flex w-max animate-marquee gap-16 whitespace-nowrap text-sm hover:[animation-play-state:paused]">
              {(lang === "en" ? [...tickerEn, ...tickerEn] : [...ticker, ...ticker]).map((tk, i) => (
                <span key={i} className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-marigold" />
                  {tk}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* category nav — desktop */}
      <nav className="hidden border-b border-line bg-white dark:border-white/10 dark:bg-ink md:block">
        <div className="mx-auto max-w-wrap px-6">
          <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-1 py-2.5 text-sm font-medium text-ink/80 dark:text-white/70">
            <li>
              <Link href="/" className="transition hover:text-brick dark:hover:text-marigold">
                {lang === "en" ? "Home" : "होम"}
              </Link>
            </li>
            {categories.map((c) => (
              <CategoryNavItem key={c} category={c} />
            ))}
          </ul>
        </div>
      </nav>

      {/* category nav — mobile drawer */}
      {open && (
        <nav className="border-b border-line bg-white dark:border-white/10 dark:bg-ink md:hidden">
          <ul className="flex flex-col divide-y divide-line px-4 text-[15px] font-medium text-ink/80 dark:divide-white/10 dark:text-white/70">
            <li>
              <Link href="/" onClick={() => setOpen(false)} className="block py-3">
                {lang === "en" ? "Home" : "होम"}
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c}>
                <Link href="#" onClick={() => setOpen(false)} className="block py-3">
                  {lang === "en" ? categoryLabels[c] ?? c : c}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}

function SearchSuggestions({
  query,
  lang,
  onNavigate,
}: {
  query: string;
  lang: "hi" | "en";
  onNavigate: () => void;
}) {
  const t = ui[lang];
  const matches = searchNews(query, 5);

  if (matches.length === 0) {
    return (
      <p className="p-4 text-sm text-ink/60 dark:text-white/50">
        {lang === "en" ? `No results for "${query}"` : `"${query}" से जुड़ी कोई खबर नहीं मिली`}
      </p>
    );
  }

  return (
    <div>
      <ul className="max-h-80 divide-y divide-line overflow-y-auto dark:divide-white/10">
        {matches.map((item) => {
          const translated = articleTranslations[item.id];
          const title = lang === "en" ? translated?.title ?? item.title : item.title;
          return (
            <li key={item.id}>
              <Link
                href={`/search?q=${encodeURIComponent(query)}`}
                onClick={onNavigate}
                className="flex gap-3 p-3 transition hover:bg-paper dark:hover:bg-white/5"
              >
                <span className="relative h-12 w-14 flex-none overflow-hidden rounded-sm bg-paperDim dark:bg-white/10">
                  <Image src={item.image} alt="" fill sizes="56px" className="object-cover" />
                </span>
                <span className="line-clamp-2 text-sm leading-snug text-ink dark:text-white/90">
                  {title}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
      <Link
        href={`/search?q=${encodeURIComponent(query)}`}
        onClick={onNavigate}
        className="block bg-paper px-3 py-2 text-center text-xs font-semibold text-brick hover:underline dark:bg-white/5 dark:text-marigold"
      >
        {lang === "en" ? `See all results for "${query}"` : `"${query}" के सभी नतीजे देखें`}
      </Link>
    </div>
  );
}
