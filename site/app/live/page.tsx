"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/components/LanguageProvider";
import { DUMMY_VIDEO_SRC, DUMMY_VIDEO_POSTER } from "@/lib/video";

export default function LivePage() {
  const { lang } = useLanguage();

  const heading = lang === "en" ? "India Voice — Live" : "इंडिया वॉइस — लाइव";
  const note =
    lang === "en"
      ? "Prototype: this plays a placeholder clip on a loop. Point DUMMY_VIDEO_SRC in lib/video.ts at a real stream (HLS, RTMP-via-player, or an internal video platform) when you're ready to go live for real — this page and the on-air badge will keep working as-is."
      : "प्रोटोटाइप: फ़िलहाल यहां एक डेमो क्लिप लूप में चल रही है। असली लाइव स्ट्रीम शुरू करने के लिए lib/video.ts में DUMMY_VIDEO_SRC को अपने वास्तविक स्ट्रीम URL से बदल दें — बाकी पेज और 'ऑन एयर' बैज वैसे ही काम करते रहेंगे।";

  return (
    <main className="min-h-screen bg-paper transition-colors dark:bg-ink">
      <Header />
      <section className="mx-auto max-w-wrap px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="mb-4 flex items-center gap-2">
            <span className="flex items-center gap-1.5 rounded-full bg-brick px-2.5 py-1 text-xs font-bold text-white">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
              </span>
              LIVE
            </span>
            <h1 className="font-serif text-xl font-semibold text-navyDeep dark:text-white sm:text-2xl">
              {heading}
            </h1>
          </div>

          <div className="overflow-hidden rounded-lg border border-line bg-black shadow-lg dark:border-white/10">
            <video
              className="aspect-video w-full"
              src={DUMMY_VIDEO_SRC}
              poster={DUMMY_VIDEO_POSTER}
              controls
              autoPlay
              muted
              loop
              playsInline
            />
          </div>

          <p className="mt-4 rounded-md border border-dashed border-line bg-white/60 p-4 text-sm leading-relaxed text-ink/70 dark:border-white/15 dark:bg-white/5 dark:text-white/60">
            {note}
          </p>
        </div>
      </section>
      <Footer />
    </main>
  );
}
