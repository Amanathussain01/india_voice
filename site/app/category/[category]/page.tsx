import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsCard from "@/components/NewsCard";
import { getPublishedPosts } from "@/lib/api";
import { categoryLabels } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: { params: { category: string } }) {
  const category = decodeURIComponent(params.category);
  const posts = await getPublishedPosts({ category });
  const title = categoryLabels[category] ?? category;

  return (
    <main className="min-h-screen bg-paper dark:bg-ink">
      <Header />
      <section className="mx-auto max-w-wrap px-4 py-10 sm:px-6">
        <div className="border-b border-line pb-4 dark:border-white/10">
          <p className="text-xs font-semibold uppercase tracking-wide text-brick dark:text-marigold">India Voice</p>
          <h1 className="mt-2 font-serif text-3xl font-bold text-navyDeep dark:text-white sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm text-ink/60 dark:text-white/50">{posts.length} प्रकाशित खबरें</p>
        </div>

        {posts.length ? (
          <div className="mt-8 grid grid-cols-2 gap-x-5 gap-y-9 sm:grid-cols-3 lg:grid-cols-4">
            {posts.map((item) => <NewsCard key={item.id} item={item} />)}
          </div>
        ) : (
          <p className="mt-8 rounded-md border border-dashed border-line p-8 text-center text-ink/60 dark:border-white/15 dark:text-white/50">
            इस कैटेगरी में अभी कोई प्रकाशित खबर नहीं है।
          </p>
        )}
      </section>
      <Footer />
    </main>
  );
}
