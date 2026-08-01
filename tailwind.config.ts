import type { Config } from "tailwindcss";

/**
 * Design language: European public-interest research infrastructure.
 *
 * Deliberately NOT the official EU palette or emblem. The prototype uses a
 * deep navy/ink base, a muted cyan for interactive affordances, a warm white
 * page ground, and sparing gold accents reserved for provenance and trust
 * signals.
 */
const config: Config = {
  content: ["./src/**/*.{ts,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#f2f5f9",
          100: "#e2e9f1",
          200: "#c5d2e3",
          300: "#9bb0cb",
          400: "#6b87ac",
          500: "#4a6791",
          600: "#385076",
          700: "#2c3f5f",
          800: "#1e2c44",
          900: "#141e30",
          950: "#0b1220",
        },
        cyan: {
          50: "#eefaff",
          100: "#d9f3fc",
          200: "#b6e8f9",
          300: "#7fd8f3",
          400: "#3fbfe6",
          500: "#1aa3cf",
          600: "#0f83af",
          700: "#10688d",
          800: "#145674",
          900: "#164862",
          950: "#0b2e42",
        },
        gold: {
          50: "#fdf9ed",
          100: "#f8efcd",
          200: "#f1dd9c",
          300: "#e8c563",
          400: "#e1ae3a",
          500: "#d0921f",
          600: "#b47119",
          700: "#8f5217",
          800: "#77421a",
          900: "#65381b",
        },
        parchment: {
          50: "#fdfcf9",
          100: "#faf8f2",
          200: "#f3efe4",
          300: "#e8e2d2",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11, 18, 32, 0.04), 0 8px 24px -12px rgba(11, 18, 32, 0.18)",
        lift: "0 2px 4px rgba(11, 18, 32, 0.06), 0 16px 40px -16px rgba(11, 18, 32, 0.28)",
      },
      borderRadius: {
        sm: "0.25rem",
        DEFAULT: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 180ms ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
