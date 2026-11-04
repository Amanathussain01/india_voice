# India Voice — redesign (Next.js)

A restructured version of the India Voice homepage: card-based layout, an
interactive state-news picker, and hover/focus preview cards on headlines —
built to be mobile-first and responsive throughout.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000. This uses `next/image` with `picsum.photos`
placeholder images (see `lib/data.ts`) — swap in real article images/URLs
whenever you wire up a CMS or API.

## What changed from the original

- **Layout**: broadsheet grid → a lead story + secondary-headline rail up
  top, then stacked card sections (state news, election watch, business,
  tech, sports, auto, entertainment), each with its own heading and "और भी
  खबरें" link — instead of one long dense page of mixed columns.
- **State-wise news** (kept, redesigned): the state grid is now a horizontally
  scrollable pill selector (`components/StateNews.tsx`). Tap/click a state
  and the card grid below updates to that state's headlines — no page
  reload, and it collapses to a swipeable strip on small screens instead of
  a dense grid of state icons.
- **Hover preview cards**: every `NewsCard` (`components/NewsCard.tsx`) opens
  a small preview panel on hover *or keyboard focus*, showing the full
  headline, an excerpt, and a "पूरी खबर पढ़ें" prompt. It's desktop-only
  (`hidden md:block`) since hover doesn't exist on touch — on mobile the
  card itself simply doesn't truncate as aggressively.
- **Mobile nav**: the category bar becomes a slide-down list behind a
  hamburger button below `md`, and the breaking-news ticker keeps
  auto-scrolling at any width.
- **Typography**: Noto Serif Devanagari for headlines, Hind for body/UI —
  both load the Devanagari script properly (the source screenshot relied on
  a generic system sans, so long Hindi headlines wrapped awkwardly).

## File map

```
app/
  layout.tsx        fonts + metadata
  page.tsx           assembles the sections
  globals.css
components/
  Header.tsx          masthead, ticker, nav (desktop + mobile drawer)
  HeroSection.tsx      lead story + secondary headlines
  StateNews.tsx        the redesigned राज्यवार खबरें picker
  ElectionStrip.tsx    dark "चुनावी हलचल" block
  CategoryRail.tsx     reusable section (business/tech/sports/auto/etc.)
  NewsCard.tsx         card + hover/focus preview panel
  SectionHeading.tsx
  Footer.tsx
lib/data.ts             all mock content — replace with real API/CMS calls
```

## Next steps if you want to take this further

- Point `lib/data.ts` at a real API/CMS instead of mock arrays.
- Add per-category and per-article routes (`app/[category]/[slug]/page.tsx`).
- Add a search box and a proper 404/loading state.
