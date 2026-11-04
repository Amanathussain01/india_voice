import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { searchNews } from "@/lib/search";
import { getPublishedPosts } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const query = (searchParams.q ?? "").trim();
  const published = await getPublishedPosts();
  const backendResults = query
    ? published.filter((item) =>
        `${item.title} ${item.excerpt} ${item.category} ${(item.tags || []).join(" ")}`
          .toLowerCase()
          .includes(query.toLowerCase()),
      )
    : [];
  const localResults = query ? searchNews(query) : [];
  const results = [...backendResults, ...localResults.filter((item) => !backendResults.some((p) => p.id === item.id))];

  return (
    <main className="min-h-screen bg-paper transition-colors dark:bg-ink">
      <Header />
      <section className="mx-auto max-w-wrap px-4 py-10 sm:px-6">
        <h1 className="font-serif text-2xl font-semibold text-navyDeep dark:text-white sm:text-3xl">
          {query ? `"${query}" के लिए नतीजे` : "खबर खोजें"}
        </h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-white/50">
          {query
            ? `${results.length} खबरें मिलीं`
            : "ऊपर सर्च बॉक्स में कोई भी कीवर्ड लिखें — जैसे किसी राज्य, नेता या विषय का नाम।"}
        </p>

        {query && results.length === 0 && (
          <p className="mt-8 rounded-md border border-dashed border-line p-6 text-center text-ink/60 dark:border-white/15 dark:text-white/50">
            "{query}" से जुड़ी कोई खबर नहीं मिली। कोई और कीवर्ड आज़माएं।
          </p>
        )}

        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {results.map((item) => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </section>
      <Footer />
    </main>
  );
}
