import Image from "next/image";
import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { getPublishedPost } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const post = await getPublishedPost(params.slug);
  if (!post) notFound();

  return (
    <main className="min-h-screen bg-paper dark:bg-ink">
      <Header />
      <article className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="text-xs font-semibold uppercase tracking-wide text-brick dark:text-marigold">
          {post.category}
        </div>
        <h1 className="mt-3 font-serif text-3xl font-bold leading-tight text-navyDeep dark:text-white sm:text-5xl">
          {post.title}
        </h1>
        <p className="mt-4 text-lg leading-relaxed text-ink/70 dark:text-white/65">
          {post.excerpt}
        </p>
        {post.areaName ? <p className="mt-3 text-sm font-semibold text-ink/60 dark:text-white/60">Location: {post.areaName}</p> : null}
        <div className="mt-4 text-sm text-ink/50 dark:text-white/45">
          {post.date} {post.authorName ? `• ${post.authorName}` : ""}
        </div>

        <div className="relative mt-8 aspect-[16/9] overflow-hidden rounded-lg bg-paperDim dark:bg-white/10">
          <Image src={post.image} alt={post.title} fill priority className="object-cover" sizes="(max-width: 896px) 100vw, 896px" />
        </div>

        <div
          className="prose prose-lg mt-8 max-w-none leading-relaxed dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        {post.tags?.length ? (
          <div className="mt-8 flex flex-wrap gap-2 border-t border-line pt-5 dark:border-white/10">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-paperDim px-3 py-1 text-xs text-ink/70 dark:bg-white/10 dark:text-white/70">
                #{tag}
              </span>
            ))}
          </div>
        ) : null}
      </article>
      <Footer />
    </main>
  );
}
