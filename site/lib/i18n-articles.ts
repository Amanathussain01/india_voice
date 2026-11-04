// English renderings of the mock Hindi article content in lib/data.ts,
// keyed by NewsItem.id. NewsCard falls back to the Hindi original for
// any id that isn't listed here — so this can be filled in gradually
// (e.g. as real bilingual content arrives from a CMS) without breaking
// anything.

export const articleTranslations: Record<string, { title: string; excerpt: string }> = {
  "hero-1": {
    title:
      "Delhi CM Rekha Gupta cracks down on child safety: Mojpur preschool sealed, school buses next in line",
    excerpt:
      "The Chief Minister made clear that no lapse on child safety will be tolerated. The education department has been told to strictly audit school bus fitness and driver verification.",
  },
  "hero-2": {
    title: "PM Modi and Uzbekistan President Mirziyoyev plant a tree at the presidential palace in Tashkent",
    excerpt: "The two leaders opened bilateral talks with a tree-planting gesture of friendship.",
  },
  "hero-3": {
    title: "47.7 lakh voters missing from Delhi's SIR draft rolls — here's how to check your name",
    excerpt: "The Election Commission released the list under the Special Intensive Revision; check your status on the online portal.",
  },
  "hero-4": {
    title: "Akhilesh Yadav slams BJP over delayed panchayat polls, calls out an IAS officer",
    excerpt: "The SP chief alleged the government is deliberately stalling local body elections.",
  },
  "hero-5": {
    title: "'India's identity is unity in diversity,' Mohan Bhagwat tells NRIs in New York",
    excerpt: "The RSS chief spoke at length on cultural heritage at a diaspora event.",
  },
  "up-1": {
    title: "RLD chief Jayant Chaudhary's renewed activity stirs UP politics; meets CM Yogi and Deputy CM Brajesh Pathak",
    excerpt: "During his Lucknow visit, Chaudhary discussed party expansion and alliance matters.",
  },
  "up-2": {
    title: "BJP general secretary Harish Dwivedi given a grand welcome in Lucknow: 'We'll form the government again in 2027'",
    excerpt: "Party workers welcomed him with drums; an organisational meeting followed.",
  },
  "up-3": {
    title: "Akhilesh Yadav slams BJP over delayed panchayat polls, calls out an IAS officer",
    excerpt: "The SP chief also questioned the Election Commission's role.",
  },
  "up-4": {
    title: "Mandakini river crosses danger mark by a record 7.5 metres",
    excerpt: "Authorities have issued an alert for low-lying areas and deployed relief teams.",
  },
  "dl-1": {
    title: "Delhi CM Rekha Gupta cracks down on child safety: Mojpur preschool sealed",
    excerpt: "Strict orders issued on school bus fitness checks and driver verification.",
  },
  "dl-2": {
    title: "PM Modi's 25 years: Delhi govt to run 'Seva Sankalp Abhiyan' from Sep 17 to Oct 17",
    excerpt: "A month-long series of welfare-scheme camps will be held across the city.",
  },
  "dl-3": {
    title: "AAP protests bicycle-scheme scam allegations, gheraos the Secretariat",
    excerpt: "Party leaders staged a sit-in demanding an investigation.",
  },
  "pb-1": {
    title: "Punjab farmers vow an indefinite sit-in until their demands are met",
    excerpt: "Farmer unions gave the state government an ultimatum until September 14.",
  },
  "pb-2": {
    title: "Punjab employees' strike: BJP and AAP trade blame over the state government",
    excerpt: "The opposition targeted the government over delayed salary payments.",
  },
  "gj-1": {
    title: "BJP set for a 7th straight term in Gujarat: CM Bhupendra Patel, 20-member cabinet to be sworn in Dec 12",
    excerpt: "Preparations for the oath ceremony are in full swing in Gandhinagar.",
  },
  "gj-2": {
    title: "Gujarat Assembly Election 2022: Voting today on 93 seats in phase two — full list here",
    excerpt: "Polling began at 8 am under tight security.",
  },
  "br-1": {
    title: "Bihar Election 2025: Key Mahagathbandhan leaders meet at RJD office in Patna to discuss strategy",
    excerpt: "Allies held extended talks over seat-sharing.",
  },
  "mh-1": {
    title: "BJP trailing on 6 of 6 assembly seats across 5 states; Dimple retains her Mainpuri lead",
    excerpt: "By-election trends have set off discussions within the party.",
  },
  "biz-1": {
    title: "Sensex, Nifty open higher — these are the stocks and companies to watch today",
    excerpt: "Buying in banking and IT stocks lifted the market.",
  },
  "biz-2": {
    title: "Adani Group to set up a 2,000-bed hospital in Kolkata's New Town",
    excerpt: "The project is planned with an investment running into thousands of crores.",
  },
  "biz-3": {
    title: "India-US trade deal in its final stage; both sides to gain competitively, says Piyush Goyal",
    excerpt: "The commerce minister called progress in the talks positive.",
  },
  "biz-4": {
    title: "Mahindra & Mahindra's June sales jump 37%, 1.06 lakh vehicles sold",
    excerpt: "Strong SUV demand pushed sales to a new high.",
  },
  "tech-1": {
    title: "New SIM card rules kick in today — one ID will no longer get you unlimited SIMs",
    excerpt: "TRAI's new guidelines aim to curb fraudulent SIM issuance.",
  },
  "tech-2": {
    title: "Motorola Razr 70 series: from Ultra to Plus, everything you need to know",
    excerpt: "Motorola's fresh foldable line-up comes with an attractive price too.",
  },
  "tech-3": {
    title: "Best budget smartphones 2026: Redmi vs Realme vs Samsung — who wins?",
    excerpt: "A detailed comparison on camera, battery and performance.",
  },
  "tech-4": {
    title: "Best smartphones under ₹7,000–₹10,000 in 2026",
    excerpt: "Battery life and display quality are the standout factors in this range.",
  },
  "sp-1": {
    title: "South Africa pacer Sipamla ruled out of the T20 series, Simmons to lead the side",
    excerpt: "Sipamla is out for the entire series due to injury.",
  },
  "sp-2": {
    title: "IND vs SL 2nd Test: India tighten grip on day three, Sri Lanka face follow-on threat",
    excerpt: "A strong bowling performance extended India's lead.",
  },
  "sp-3": {
    title: "India declare at 503/9; Sri Lanka lose 2 wickets for just 8 runs on day three",
    excerpt: "India's batters built a mountain of runs to tilt the match their way.",
  },
  "auto-1": {
    title: "Best budget electric cars 2026: Tata Tiago EV, MG Comet EV and Tigor EV compared",
    excerpt: "Full comparison of range, charging time and price.",
  },
  "auto-2": {
    title: "Mahindra & Mahindra's June sales jump 37%, 1.06 lakh vehicles sold",
    excerpt: "Strong SUV segment demand drove the growth.",
  },
  "auto-3": {
    title: "Bike mangled after colliding with truck, area thrown into chaos",
    excerpt: "The rider died at the scene.",
  },
  "ent-1": {
    title: "Taapsee Pannu's Gandhari faces questions — writer Kalyan Bandi makes a big claim",
    excerpt: "Controversy deepens over the film's storyline.",
  },
  "ent-2": {
    title: "'1942: A Love Story' gets a rousing response — makers thank audiences",
    excerpt: "Viewers have warmly welcomed the classic film's re-release.",
  },
  "ent-3": {
    title: "Bollywood vs Hollywood: Indian cinema's biggest challenge isn't budget...",
    excerpt: "Industry insiders point to the real reason.",
  },
  "el-1": {
    title: "Gujarat CM oath ceremony: Bhupendra Patel sworn in for a second consecutive term, PM Modi among dignitaries present",
    excerpt: "The cabinet was also sworn in at a grand ceremony in Gandhinagar.",
  },
  "el-2": {
    title: "BJP's Kedar Gupta wins Kurni in a close contest, Congress narrowly loses out",
    excerpt: "The by-election result has stirred local politics.",
  },
  "el-3": {
    title: "BJP trailing on 6 of 6 assembly seats across 5 states; Dimple retains her Mainpuri lead",
    excerpt: "All parties kept a close eye on the by-election trends.",
  },
};

export const tickerEn: string[] = [
  "Delhi CM Rekha Gupta cracks down on child safety: Mojpur preschool sealed",
  "47.7 lakh voters missing from Delhi's SIR draft rolls — here's how to check",
  "BJP set for a 7th term in Gujarat: CM Bhupendra Patel, 20-member cabinet to take oath today",
  "PM Modi's 25 years: Delhi govt to run 'Seva Sankalp Abhiyan' from Sep 17 to Oct 17",
];
