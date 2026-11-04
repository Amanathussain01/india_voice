import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        paper: "#EEF0EA",
        paperDim: "#E3E5DB",
        ink: "#1B1F2A",
        navy: "#16305C",
        navyDeep: "#0E2044",
        marigold: "#E8A324",
        marigoldDeep: "#C6841A",
        brick: "#8C3230",
        line: "#D3D0C3",
      },
      fontFamily: {
        serif: ["var(--font-headline)", "Georgia", "serif"],
        sans: ["var(--font-body)", "system-ui", "sans-serif"],
      },
      maxWidth: {
        wrap: "1280px",
      },
      keyframes: {
        marquee: {
          "0%": { transform: "translateX(0%)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeSlide: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        marquee: "marquee 28s linear infinite",
        fadeSlide: "fadeSlide 0.4s ease",
      },
    },
  },
  plugins: [],
};
export default config;
