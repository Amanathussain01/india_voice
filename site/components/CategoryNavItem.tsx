"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { useEffect, useState } from "react";
import { categoryLabels } from "@/lib/i18n";
import { articleTranslations } from "@/lib/i18n-articles";
import { newsByCategory } from "@/lib/category";

export default function CategoryNavItem({ category }: { category: string }) {
  const { lang } = useLanguage();
  const label = lang === "en" ? categoryLabels[category] ?? category : category;
  const [items, setItems] = useState(() => newsByCategory(category, 4));

  useEffect(() => {
    let active = true;
    fetch(`/api/news?category=${encodeURIComponent(category)}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (active && Array.isArray(data?.posts)) setItems(data.posts.slice(0, 4));
      })
      .catch(() => { /* keep the local fallback */ });
    return () => { active = false; };
  }, [category]);

  return (
    <li className="group/nav relative">
      <Link href={`/category/${encodeURIComponent(category)}`} className="transition hover:text-brick dark:hover:text-marigold">
        {label}
      </Link>

      <div
        className="pointer-events-none absolute left-1/2 top-full z-50 mt-3 w-80 -translate-x-1/2 origin-top scale-95 rounded-md border border-line bg-white p-3 opacity-0 shadow-xl transition duration-150 ease-out group-hover/nav:pointer-events-auto group-hover/nav:scale-100 group-hover/nav:opacity-100 group-focus-within/nav:pointer-events-auto group-focus-within/nav:scale-100 group-focus-within/nav:opacity-100 dark:border-white/10 dark:bg-navyDeep"
      >
        {items.length > 0 ? (
          <ul className="divide-y divide-line dark:divide-white/10">
            {items.map((item) => {
              const translated = lang === "en" ? articleTranslations[item.id] : undefined;
              const title = translated?.title ?? item.title;
              return (
                <li key={item.id}>
                  <Link href={item.href} className="flex gap-3 py-2.5 first:pt-0 last:pb-0">
                    <span className="relative h-12 w-16 flex-none overflow-hidden rounded-sm bg-paperDim dark:bg-white/10">
                      <Image src={item.image} alt="" fill sizes="64px" className="object-cover" />
                    </span>
                    <span className="line-clamp-2 text-[13px] leading-snug text-ink dark:text-white/90">
                      {title}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="py-3 text-center text-xs text-ink/50 dark:text-white/40">
            {lang === "en" ? "More stories coming soon" : "जल्द और खबरें आएंगी"}
          </p>
        )}
      </div>
    </li>
  );
}
