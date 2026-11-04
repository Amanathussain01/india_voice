"use client";

import Image from "next/image";
import Link from "next/link";
import type { NewsItem } from "@/lib/data";
import { useLanguage } from "./LanguageProvider";
import { categoryLabels } from "@/lib/i18n";
import { articleTranslations } from "@/lib/i18n-articles";

type Variant = "lead" | "default" | "compact";

function useLocalizedItem(item: NewsItem) {
  const { lang } = useLanguage();
  const translated = lang === "en" ? articleTranslations[item.id] : undefined;
  return {
    title: translated?.title ?? item.title,
    excerpt: translated?.excerpt ?? item.excerpt,
    category: lang === "en" ? categoryLabels[item.category] ?? item.category : item.category,
  };
}

function CategoryTag({ label }: { label: string }) {
  return (
    <span className="inline-flex w-fit items-center bg-brick px-2 py-0.5 text-[10px] font-semibold tracking-wide text-white">
      {label}
    </span>
  );
}

export default function NewsCard({
  item,
  variant = "default",
  priority = false,
}: {
  item: NewsItem;
  variant?: Variant;
  priority?: boolean;
}) {
  const { title, excerpt, category } = useLocalizedItem(item);

  if (variant === "compact") {
    return (
      <Link href={item.href} className="flex gap-3 py-2.5 outline-none">
        <span className="relative h-14 w-20 flex-none overflow-hidden rounded-sm bg-paperDim dark:bg-white/10">
          <Image src={item.image} alt="" fill sizes="80px" className="object-cover" />
        </span>
        <span className="min-w-0">
          <span className="block text-[13px] font-medium leading-snug text-ink line-clamp-3 dark:text-white/90">
            {title}
          </span>
        </span>
      </Link>
    );
  }

  if (variant === "lead") {
    return (
      <Link href={item.href} className="block outline-none">
        <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-md bg-paperDim dark:bg-white/10 sm:aspect-[16/9]">
          <Image
            src={item.image}
            alt=""
            fill
            priority={priority}
            sizes="(min-width: 1024px) 640px, 100vw"
            className="object-cover"
          />
          <span className="absolute left-3 top-3">
            <CategoryTag label={category} />
          </span>
        </span>
        <h1 className="mt-4 font-serif text-2xl font-semibold leading-tight text-navyDeep dark:text-white sm:text-3xl">
          {title}
        </h1>
        <p className="mt-2 text-[15px] leading-relaxed text-ink/70 dark:text-white/70">
          {excerpt}
        </p>
        <span className="mt-2 block text-xs text-ink/50 dark:text-white/40">{item.date}</span>
      </Link>
    );
  }

  return (
    <Link href={item.href} className="flex flex-col outline-none">
      <span className="relative block aspect-[3/2] w-full overflow-hidden rounded-sm bg-paperDim dark:bg-white/10">
        <Image
          src={item.image}
          alt=""
          fill
          sizes="(min-width: 1024px) 220px, (min-width: 640px) 35vw, 65vw"
          className="object-cover"
        />
        <span className="absolute left-2 top-2">
          <CategoryTag label={category} />
        </span>
      </span>
      <span className="mt-2.5 line-clamp-2 text-[13px] font-medium leading-snug text-ink dark:text-white/90">
        {title}
      </span>
      <span className="mt-auto pt-1.5 text-[11px] text-ink/45 dark:text-white/40">{item.date}</span>
    </Link>
  );
}
