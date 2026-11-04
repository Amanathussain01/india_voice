import { allNews, type NewsItem } from "./data";
import { articleTranslations } from "./i18n-articles";
import { categoryLabels, stateLabels } from "./i18n";

// Builds one lowercase blob per article containing the Hindi original,
// its English translation (if we have one), and both language variants
// of its category/state label — so a query in either language matches.
function haystack(item: NewsItem): string {
  const translated = articleTranslations[item.id];
  return [
    item.title,
    item.excerpt,
    item.category,
    categoryLabels[item.category],
    stateLabels[item.category],
    translated?.title,
    translated?.excerpt,
  ]
    .filter(Boolean)
    .join(" \u2022 ")
    .toLowerCase();
}

export function searchNews(query: string, limit?: number): NewsItem[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  const matches = allNews.filter((item) => haystack(item).includes(needle));
  return typeof limit === "number" ? matches.slice(0, limit) : matches;
}
