"use client";

import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { ui, sectionTitleTranslations } from "@/lib/i18n";

export default function SectionHeading({
  title,
  href = "#",
}: {
  title: string;
  href?: string;
}) {
  const { lang } = useLanguage();
  const t = ui[lang];
  const displayTitle =
    lang === "en" ? sectionTitleTranslations[title] ?? title : title;

  return (
    <div className="mb-5 flex items-baseline justify-between border-t border-navyDeep/20 pt-4 dark:border-white/20">
      <h2 className="font-serif text-xl font-semibold text-navyDeep dark:text-white sm:text-2xl">
        {displayTitle}
      </h2>
      <Link
        href={href}
        className="text-xs font-semibold text-brick hover:underline dark:text-marigold"
      >
        {t.readMore}
      </Link>
    </div>
  );
}
