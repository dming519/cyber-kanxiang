import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          bg: "#0a0a14",
          mid: "#150a24",
          deep: "#0a0a1f",
        },
        neon: {
          purple: "#a855f7",
          cyan: "#22d3ee",
          rose: "#f472b6",
        },
        cinnabar: "#dc2626",
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
              "0 0 18px #a855f7, 0 0 36px rgba(168,85,247,0.55), inset 0 0 18px rgba(168,85,247,0.18)",
          },
          "50%": {
            boxShadow:
              "0 0 26px #22d3ee, 0 0 52px rgba(34,211,238,0.55), inset 0 0 24px rgba(34,211,238,0.22)",
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
