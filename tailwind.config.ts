import type { Config } from "tailwindcss";

/**
 * CommandIQ design system — a financial command center.
 *
 * Dark-first: near-black graphite surfaces, soft white ink, cool neutral
 * grays, and a single restrained blue "intelligence" accent. Green/red are
 * reserved strictly for financial status. Every value is driven by CSS
 * variables (see globals.css) so the light theme stays in perfect sync.
 */
const config: Config = {
  darkMode: ["class", '[data-theme="dark"]'],
  content: [
    "./src/app/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Surfaces & text
        canvas: "rgb(var(--canvas) / <alpha-value>)",
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-2": "rgb(var(--surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--surface-3) / <alpha-value>)",
        overlay: "rgb(var(--overlay) / <alpha-value>)",
        border: "rgb(var(--border) / <alpha-value>)",
        "border-strong": "rgb(var(--border-strong) / <alpha-value>)",
        ink: "rgb(var(--ink) / <alpha-value>)",
        "ink-muted": "rgb(var(--ink-muted) / <alpha-value>)",
        "ink-subtle": "rgb(var(--ink-subtle) / <alpha-value>)",
        // Intelligence accent (blue)
        accent: {
          50: "rgb(var(--accent-50) / <alpha-value>)",
          100: "rgb(var(--accent-100) / <alpha-value>)",
          200: "rgb(var(--accent-200) / <alpha-value>)",
          300: "rgb(var(--accent-300) / <alpha-value>)",
          400: "rgb(var(--accent-400) / <alpha-value>)",
          500: "rgb(var(--accent-500) / <alpha-value>)",
          600: "rgb(var(--accent-600) / <alpha-value>)",
          700: "rgb(var(--accent-700) / <alpha-value>)",
          800: "rgb(var(--accent-800) / <alpha-value>)",
          900: "rgb(var(--accent-900) / <alpha-value>)",
        },
        // Financial status
        positive: {
          soft: "rgb(var(--positive-soft) / <alpha-value>)",
          DEFAULT: "rgb(var(--positive) / <alpha-value>)",
          strong: "rgb(var(--positive-strong) / <alpha-value>)",
        },
        negative: {
          soft: "rgb(var(--negative-soft) / <alpha-value>)",
          DEFAULT: "rgb(var(--negative) / <alpha-value>)",
          strong: "rgb(var(--negative-strong) / <alpha-value>)",
        },
        // Severity ramp
        critical: "rgb(var(--critical) / <alpha-value>)",
        high: "rgb(var(--high) / <alpha-value>)",
        watch: "rgb(var(--watch) / <alpha-value>)",
        info: "rgb(var(--info) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      borderRadius: {
        lg: "0.625rem",
        xl: "0.875rem",
        "2xl": "1.125rem",
      },
      boxShadow: {
        card: "0 1px 2px rgb(var(--shadow) / 0.4), 0 1px 3px rgb(var(--shadow) / 0.2)",
        pop: "0 12px 40px -8px rgb(var(--shadow) / 0.55)",
        glow: "0 0 0 1px rgb(var(--accent-500) / 0.35), 0 0 28px -4px rgb(var(--accent-500) / 0.45)",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "1rem" }],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "0.55" },
          "50%": { opacity: "1" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
