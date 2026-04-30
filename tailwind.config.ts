import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#272425",
        blush: "#FFF4F0",
        coral: "#F26D5B",
        berry: "#9F4562",
        mint: "#DFF4EA",
        spruce: "#1E6856",
        honey: "#F7C65B",
        cloud: "#F8F7F4"
      },
      boxShadow: {
        soft: "0 18px 50px rgba(66, 45, 39, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
