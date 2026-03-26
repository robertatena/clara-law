import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        claraBlue: "#6BB6C9",
        claraGold: "#C9A24D",
        claraBg: "#FAFAF8"
      }
    }
  },
  plugins: []
};
export default config;
