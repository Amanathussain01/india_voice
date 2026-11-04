import NewsCard from "./NewsCard";
import VideoTeaser from "./VideoTeaser";
import type { NewsItem } from "@/lib/data";

export default function HeroSection({
  lead,
  secondary,
}: {
  lead: NewsItem;
  secondary: NewsItem[];
}) {
  return (
    <section className="mx-auto max-w-wrap px-4 pt-6 sm:px-6">
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.4fr_1fr]">
        <NewsCard item={lead} variant="lead" priority />
        <div className="lg:border-l lg:border-line lg:pl-8">
          <VideoTeaser />
          <div className="divide-y divide-line">
            {secondary.map((item) => (
              <NewsCard key={item.id} item={item} variant="compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
