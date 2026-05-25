import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "#201913",
          mid: "#2e261f",
          deep: "#16100c",
        },
        neon: {
          purple: "#cc905c",
          cyan: "#edeade",
          rose: "#d97706",
        },
        brand: {
          primary: "#cc905c",
          hover: "#c27b3d",
          light: "rgba(204, 144, 92, 0.12)",
          dark: "#ae6f37",
        },
        surface: {
          panel: "#2e261f",
          field: "#3d3229",
          elevated: "rgba(237, 234, 222, 0.05)",
        },
        cinnabar: "#cc905c",
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', "ui-serif", "serif"],
        sans: ['"Noto Sans SC"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      animation: {
        "neon-pulse": "neonPulse 2.4s ease-in-out infinite",
        "spin-taiji": "spinTaiji 6s linear infinite",
        "rune-float": "runeFloat 6s ease-in-out infinite",
        "scan-line": "scanLine 2.6s linear infinite",
      },
      keyframes: {
        neonPulse: {
          "0%,100%": {
            boxShadow:
              "0 0 18px rgba(204,144,92,0.28), 0 0 36px rgba(204,144,92,0.16), inset 0 0 18px rgba(204,144,92,0.08)",
          },
          "50%": {
            boxShadow:
              "0 0 22px rgba(237,234,222,0.18), 0 0 46px rgba(204,144,92,0.2), inset 0 0 24px rgba(237,234,222,0.06)",
          },
        },
        spinTaiji: {
          to: { transform: "rotate(360deg)" },
        },
        runeFloat: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        scanLine: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
