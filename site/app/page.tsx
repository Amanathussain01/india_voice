import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import StateNews from "@/components/StateNews";
import CategoryRail from "@/components/CategoryRail";
import ElectionStrip from "@/components/ElectionStrip";
import Footer from "@/components/Footer";
import {
  heroLead,
  heroSecondary,
  businessNews,
  techNews,
  sportsNews,
  autoNews,
  entertainmentNews,
  electionUpdates,
  allNews,
  type NewsItem,
} from "@/lib/data";
import { getPublishedPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

function groupByCategory(posts: NewsItem[], category: string, fallback: NewsItem[]) {
  const dynamicItems = posts.filter((item) => item.category === category).slice(0, 6);
  return dynamicItems.length ? dynamicItems : fallback;
}

export default async function Home() {
  const published = await getPublishedPosts();
  const liveNews: NewsItem[] = published.length ? published : allNews.slice(0, 8);
  const lead = liveNews[0] ?? heroLead;
  const secondary = liveNews.slice(1, 5).length ? liveNews.slice(1, 5) : heroSecondary;

  return (
    <main className="min-h-screen bg-paper transition-colors dark:bg-ink">
      <Header />
      <HeroSection lead={lead} secondary={secondary} />
      <StateNews />
      <ElectionStrip items={electionUpdates} />
      <CategoryRail title="बिज़नेस समाचार" items={groupByCategory(published, "बिज़नेस", businessNews)} />
      <CategoryRail title="तकनीक समाचार" items={groupByCategory(published, "तकनीक", techNews)} />
      <CategoryRail title="खेल समाचार" items={groupByCategory(published, "खेल", sportsNews)} />
      <CategoryRail title="ऑटो समाचार" items={groupByCategory(published, "ऑटो", autoNews)} />
      <CategoryRail title="मनोरंजन" items={groupByCategory(published, "मनोरंजन", entertainmentNews)} />
      <Footer />
    </main>
  );
}
