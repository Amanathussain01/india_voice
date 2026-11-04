"use client";

import { useRef } from "react";
import NewsCard from "./NewsCard";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";
import type { NewsItem } from "@/lib/data";

export default function CategoryRail({
  title,
  items,
}: {
  title: string;
  items: NewsItem[];
}) {
  const { lang } = useLanguage();
  const railRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 300, behavior: "smooth" });
  };

  return (
    <section className="mx-auto max-w-wrap px-4 py-8 sm:px-6">
      <SectionHeading title={title} />
      <div className="relative">
        <div
          ref={railRef}
          className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-1"
        >
          {items.map((item) => (
            <div key={item.id} className="w-36 flex-none snap-start sm:w-40 lg:w-44">
              <NewsCard item={item} />
            </div>
          ))}
        </div>

        {/* arrow controls — desktop only, the rail itself is swipeable on touch */}
        <button
          aria-label={lang === "en" ? "Scroll back" : "पीछे स्क्रॉल करें"}
          onClick={() => scroll(-1)}
          className="absolute -left-3 top-1/3 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:border-navy/40 dark:border-white/15 dark:bg-ink dark:text-white lg:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
        <button
          aria-label={lang === "en" ? "Scroll forward" : "आगे स्क्रॉल करें"}
          onClick={() => scroll(1)}
          className="absolute -right-3 top-1/3 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:border-navy/40 dark:border-white/15 dark:bg-ink dark:text-white lg:flex"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
            <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
    </section>
  );
}
