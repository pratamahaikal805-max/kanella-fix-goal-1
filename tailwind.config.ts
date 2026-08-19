import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        espresso: {
          950: "#1C120C",
          900: "#2B1B12",
          800: "#3B2618",
          700: "#4E3220",
        },
        crema: {
          100: "#F6EFE4",
          200: "#EFE4D2",
          300: "#E2D2B8",
        },
        amber: {
          500: "#C97C2E",
          600: "#B4681F",
        },
        stamp: {
          500: "#B23A2E",
        },
      },
      fontFamily: {
        display: ["var(--font-display)"],
        mono: ["var(--font-mono)"],
        body: ["var(--font-body)"],
      },
      backgroundImage: {
        perforate:
          "radial-gradient(circle, rgba(0,0,0,0.18) 1.5px, transparent 1.5px)",
      },
      backgroundSize: {
        perforate: "10px 10px",
      },
    },
  },
  plugins: [],
};
export default config;
