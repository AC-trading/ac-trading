import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // 당근마켓 스타일 오렌지 컬러
        primary: {
          DEFAULT: "#FF9F1C",
          light: "#FFB84D",
          dark: "#E88A00",
        },
        carrot: "#FF9F1C",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ["Pretendard", "Arial", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
