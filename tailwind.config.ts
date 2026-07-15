import type { Config } from "tailwindcss";

/** Consume an RGB-channel CSS variable while preserving opacity utilities. */
const token = (name: string) => `rgb(var(${name}) / <alpha-value>)`;

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      screens: {
        mobile: "320px",
        tablet: "768px",
        desktop: "1024px",
      },
      colors: {
        // Semantic tokens (wired to CSS variables in globals.css)
        bg: token("--bg"),
        surface: token("--surface"),
        "surface-2": token("--surface-2"),
        "surface-3": token("--surface-3"),
        border: token("--border"),
        "border-strong": token("--border-strong"),
        fg: token("--fg"),
        muted: token("--muted"),
        faint: token("--faint"),
        accent: {
          DEFAULT: token("--accent"),
          hover: token("--accent-hover"),
          fg: token("--accent-fg"),
          text: token("--accent-text"),
        },
        // shadcn-compatible aliases — resolve to the same teal token system so
        // primitives copied from the shadcn registry inherit our theme.
        primary: {
          DEFAULT: token("--accent"),
          foreground: token("--accent-fg"),
        },
        ring: token("--accent"),
        input: token("--border"),
        popover: {
          DEFAULT: token("--surface"),
          foreground: token("--fg"),
        },
        destructive: {
          DEFAULT: token("--danger"),
          foreground: token("--fg"),
        },
        success: token("--success"),
        danger: token("--danger"),
        warning: token("--warning"),
        info: token("--info"),

        // Legacy alias: existing brand-* usages now resolve to the teal accent.
        brand: {
          50: "#f0fdfa",
          100: "#ccfbf1",
          200: "#99f6e4",
          300: "#5eead4",
          400: "#2dd4bf",
          500: "#14b8a6",
          600: "#0d9488",
          700: "#0f766e",
          800: "#115e59",
          900: "#134e4a",
        },
      },
      borderColor: {
        // Bare `border` (no color) uses the token instead of gray-200.
        DEFAULT: token("--border"),
      },
      boxShadow: {
        card: "0 1px 2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.3)",
        "card-hover": "0 6px 16px -4px rgba(0, 0, 0, 0.55)",
      },
      borderRadius: {
        xl: "0.875rem",
        "2xl": "1.25rem",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fadeIn 0.25s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
        shimmer: "shimmer 1.6s infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
