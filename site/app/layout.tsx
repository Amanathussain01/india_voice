import type { Metadata } from "next";
import { Noto_Serif_Devanagari, Hind } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageProvider";
import "./globals.css";

const headline = Noto_Serif_Devanagari({
  subsets: ["devanagari", "latin"],
  weight: ["500", "600", "700"],
  variable: "--font-headline",
  display: "swap",
});

const body = Hind({
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "India Voice — अपनी सोच, अपनी आवाज़",
  description:
    "देश, दुनिया, राज्यवार और राजनीति की ताज़ा खबरें — India Voice पर सबसे पहले।",
};

// Runs before hydration so the correct theme is applied on first paint —
// avoids a light-mode flash for users who saved "dark".
const themeInitScript = `(function () {
  try {
    var stored = localStorage.getItem("iv-theme");
    var theme = stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    if (theme === "dark") document.documentElement.classList.add("dark");
  } catch (e) {}
})();`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="hi"
      suppressHydrationWarning
      className={`${headline.variable} ${body.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <LanguageProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
