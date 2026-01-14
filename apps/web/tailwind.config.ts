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
        // AC-Trading 메인 컬러 (동물의 숲 테마)
        primary: {
          DEFAULT: "#7ECEC5",
          light: "#BAE8E7",
          dark: "#5BBFB3",
        },
        acnh: "#7ECEC5",
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
