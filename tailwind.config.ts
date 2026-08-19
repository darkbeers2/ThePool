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
        pool: {
          navy: "#0f172a",
          slate: "#1e293b",
          accent: "#38bdf8",
        },
      },
    },
  },
  plugins: [],
};

export default config;
