// tailwind.config.ts

import type { Config } from "tailwindcss";

const config: Config = {
  // This 'content' array is the most important part.
  // It tells Tailwind to scan all these files for class names.
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // You can add custom theme settings here
    },
  },
  plugins: [],
};
export default config;
