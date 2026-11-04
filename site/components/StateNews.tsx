"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { stateList, stateNews, genericStateNews } from "@/lib/data";
import NewsCard from "./NewsCard";
import SectionHeading from "./SectionHeading";
import { useLanguage } from "./LanguageProvider";
import { ui, stateLabels } from "@/lib/i18n";

const stateImage = (state: string) =>
  `https://picsum.photos/seed/state-${encodeURIComponent(state)}/400/500`;

export default function StateNews() {
  const { lang } = useLanguage();
  const t = ui[lang];
  const [active, setActive] = useState(stateList[0]);
  const railRef = useRef<HTMLDivElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const items = stateNews[active] ?? genericStateNews(active);
  const activeLabel = lang === "en" ? stateLabels[active] ?? active : active;

  const scrollRail = (dir: 1 | -1) => {
    railRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  const selectState = (state: string) => {
    setActive(state);
    // bring the results into view — most useful on mobile where the
    // slider and the grid don't both fit on screen at once
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  };

  return (
    <section className="border-y border-line bg-white dark:border-white/10 dark:bg-ink">
      <div className="mx-auto max-w-wrap px-4 py-10 sm:px-6">
        <SectionHeading title="राज्यवार खबरें" />

        {/* sliding state cards — click one to load its news below */}
        <div className="relative mb-9">
          <div
            ref={railRef}
            role="tablist"
            aria-label="राज्य चुनें"
            className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1"
          >
            {stateList.map((state) => {
              const isActive = state === active;
              return (
                <button
                  key={state}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => selectState(state)}
                  className={`group relative h-40 w-28 flex-none snap-start overflow-hidden rounded-lg border-2 transition sm:h-44 sm:w-32 ${
                    isActive
                      ? "border-marigold"
                      : "border-transparent hover:border-navy/30 dark:hover:border-marigold/40"
                  }`}
                >
                  <Image
                    src={stateImage(state)}
                    alt=""
                    fill
                    sizes="130px"
                    className="object-cover transition duration-300 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-navyDeep/90 via-navyDeep/10 to-transparent" />
                  {isActive && (
                    <span className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-marigold text-navyDeep">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                  )}
                  <span className="absolute inset-x-0 bottom-0 p-2 text-left text-[13px] font-semibold leading-tight text-white">
                    {lang === "en" ? stateLabels[state] ?? state : state}
                  </span>
                </button>
              );
            })}
          </div>

          {/* arrow controls — desktop only, the rail itself is swipeable on touch */}
          <button
            aria-label="पीछे स्क्रॉल करें"
            onClick={() => scrollRail(-1)}
            className="absolute -left-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:border-navy/40 dark:border-white/15 dark:bg-ink dark:text-white lg:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M15 6l-6 6 6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            aria-label="आगे स्क्रॉल करें"
            onClick={() => scrollRail(1)}
            className="absolute -right-3 top-1/2 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-white text-ink shadow-sm hover:border-navy/40 dark:border-white/15 dark:bg-ink dark:text-white lg:flex"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* news for the selected state */}
        <div ref={resultsRef} className="scroll-mt-24">
          <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-brick dark:text-marigold">
            {t.stateNewsOf(activeLabel)}
          </h3>
          <div className="grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {items.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
