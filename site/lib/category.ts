import { allNews, stateNews, type NewsItem } from "./data";

export function newsByCategory(category: string, limit = 4): NewsItem[] {
  // "क्षेत्रीय" (Regional) has no dedicated article list of its own —
  // it's a stand-in for all the state-wise coverage put together.
  if (category === "क्षेत्रीय") {
    return Object.values(stateNews).flat().slice(0, limit);
  }
  return allNews.filter((item) => item.category === category).slice(0, limit);
}
