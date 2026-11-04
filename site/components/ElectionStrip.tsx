import Image from "next/image";
import Link from "next/link";
import type { NewsItem } from "@/lib/data";

export default function ElectionStrip({ items }: { items: NewsItem[] }) {
  return (
    <section className="bg-navyDeep py-10 text-white">
      <div className="mx-auto max-w-wrap px-4 sm:px-6">
        <div className="mb-6 flex items-baseline justify-between border-t border-white/15 pt-4">
          <h2 className="font-serif text-xl font-semibold sm:text-2xl">
            चुनावी हलचल
          </h2>
          <Link href="#" className="text-xs font-semibold text-marigold hover:underline">
            और भी खबरें
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group/card block border-l-2 border-marigold pl-4"
            >
              <span className="relative block aspect-[16/10] w-full overflow-hidden rounded-sm bg-white/10">
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="(min-width: 640px) 33vw, 100vw"
                  className="object-cover transition duration-300 group-hover/card:scale-105"
                />
              </span>
              <span className="mt-3 block text-[15px] font-medium leading-snug text-white/95 line-clamp-3 group-hover/card:text-marigold">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
