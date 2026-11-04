"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "./LanguageProvider";
import { DUMMY_VIDEO_POSTER } from "@/lib/video";

export default function VideoTeaser() {
  const { lang } = useLanguage();
  const caption = lang === "en" ? "India Voice Live" : "इंडिया वॉइस लाइव";
  const sub =
    lang === "en" ? "Tap to watch the live stream" : "लाइव स्ट्रीम देखने के लिए टैप करें";

  return (
    <Link
      href="/live"
      className="group/video mb-5 block overflow-hidden rounded-md border border-line dark:border-white/10"
    >
      <span className="relative block aspect-video w-full bg-navyDeep">
        <Image
          src={DUMMY_VIDEO_POSTER}
          alt=""
          fill
          sizes="(min-width: 1024px) 420px, 100vw"
          className="object-cover opacity-90 transition duration-300 group-hover/video:scale-105 group-hover/video:opacity-100"
        />
        <span className="absolute inset-0 bg-gradient-to-t from-navyDeep/85 via-navyDeep/10 to-transparent" />

        <span className="absolute left-3 top-3 flex items-center gap-1.5 rounded-full bg-brick px-2 py-1 text-[11px] font-bold text-white">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-white" />
          </span>
          LIVE
        </span>

        <span className="absolute inset-0 flex items-center justify-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 text-navyDeep shadow-lg transition duration-300 group-hover/video:scale-110">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8 5v14l11-7L8 5Z" />
            </svg>
          </span>
        </span>

        <span className="absolute inset-x-0 bottom-0 p-3">
          <span className="block text-sm font-semibold text-white">{caption}</span>
          <span className="block text-xs text-white/70">{sub}</span>
        </span>
      </span>
    </Link>
  );
}
