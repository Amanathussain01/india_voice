"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "./LanguageProvider";

// Placeholder values — wire this up to a real API (e.g. a metals-price
// endpoint, a crypto ticker, and an AQI/weather provider) inside a
// useEffect + setInterval poll, and swap the `value*` strings below for
// live data. Kept static here so the redesign has no external network
// dependency out of the box.
type Metric = {
  id: string;
  labelHi: string;
  labelEn: string;
  valueHi: string;
  valueEn: string;
  icon: React.ReactNode;
};

const metrics: Metric[] = [
  {
    id: "gold",
    labelHi: "सोना (24K)",
    labelEn: "Gold (24K)",
    valueHi: "₹72,450 / 10ग्राम",
    valueEn: "₹72,450 / 10g",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.8" />
        <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "silver",
    labelHi: "चांदी",
    labelEn: "Silver",
    valueHi: "₹89,200 / kg",
    valueEn: "₹89,200 / kg",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <rect x="4" y="4" width="16" height="16" rx="3" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    id: "btc",
    labelHi: "बिटकॉइन",
    labelEn: "Bitcoin",
    valueHi: "$62,340",
    valueEn: "$62,340",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path
          d="M7 4v16M11 4v16M6 8h8.5a3 3 0 0 1 0 6H6M6 14h9a3 3 0 0 1 0 6H6"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
        />
      </svg>
    ),
  },
  {
    id: "aqi",
    labelHi: "AQI · दिल्ली",
    labelEn: "AQI · Delhi",
    valueHi: "168 · मध्यम",
    valueEn: "168 · Moderate",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <path d="M4 12h11a3 3 0 1 0-3-3M4 17h14a3 3 0 1 1-3 3M4 7h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "weather",
    labelHi: "मौसम · दिल्ली",
    labelEn: "Weather · Delhi",
    valueHi: "31° · धूप",
    valueEn: "31° · Sunny",
    icon: (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.7" />
        <path d="M12 3v2M12 19v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M3 12h2M19 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default function MarketTicker() {
  const { lang } = useLanguage();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % metrics.length), 2600);
    return () => clearInterval(id);
  }, []);

  const m = metrics[index];

  return (
    <div className="hidden h-9 w-[188px] flex-none items-center gap-2 overflow-hidden rounded-full border border-line bg-white px-3 dark:border-white/15 dark:bg-white/5 sm:flex">
      <span className="flex-none text-marigoldDeep dark:text-marigold">{m.icon}</span>
      <span key={m.id} className="flex min-w-0 flex-col leading-tight animate-fadeSlide">
        <span className="truncate text-[10px] font-medium uppercase tracking-wide text-ink/45 dark:text-white/45">
          {lang === "en" ? m.labelEn : m.labelHi}
        </span>
        <span className="truncate text-[13px] font-semibold text-navy dark:text-marigold">
          {lang === "en" ? m.valueEn : m.valueHi}
        </span>
      </span>
    </div>
  );
}
