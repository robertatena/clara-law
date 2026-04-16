import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        raleway: ["Raleway", "sans-serif"],
        montserrat: ["Montserrat", "sans-serif"],
      },
      colors: {
        clara: {
          gold:   "#D4AF37",
          sky:    "#A8D8F0",
          ink:    "#1a2340",
          muted:  "#6b7280",
          bg:     "#F8F7F4",
          border: "#E8E4DA",
        },
      },
    },
  },
  plugins: [],
};

export default config;
