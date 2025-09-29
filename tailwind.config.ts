import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        // R/HOOD Brand Colors
        brand: {
          black: "#1D1D1B",
          green: "#C2CC06",
          white: "#FFFFFF",
        },
        // System colors
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#C2CC06", // R/HOOD Green
          foreground: "#1D1D1B", // R/HOOD Black
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "#C2CC06", // R/HOOD Green
          foreground: "#1D1D1B", // R/HOOD Black
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      backgroundImage: {
        "gradient-primary": "var(--gradient-primary)",
        "gradient-accent": "var(--gradient-accent)",
        "gradient-dark": "var(--gradient-dark)",
        "gradient-image-overlay": "var(--gradient-image-overlay)",
      },
      boxShadow: {
        "glow-primary": "var(--glow-primary)",
        "glow-accent": "var(--glow-accent)",
      },
      fontFamily: {
        // TS Block Bold for impactful headings (always uppercase)
        "ts-block": ["var(--font-ts-block)", "Arial Black", "Arial", "sans-serif"],
        // Helvetica Neue system
        "helvetica-light": ["Helvetica Neue Light", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        "helvetica-regular": ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        "helvetica-bold": ["Helvetica Neue Bold", "Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        // Legacy aliases
        display: ["var(--font-ts-block)", "Arial", "Helvetica", "sans-serif"],
        body: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
        brand: ["var(--font-ts-block)", "Arial Black", "Arial", "sans-serif"],
        headline: ["var(--font-ts-block)", "Arial Black", "Arial", "sans-serif"],
        sans: ["Helvetica Neue", "Helvetica", "Arial", "sans-serif"],
      },
      fontSize: {
        // TS Block sizes (for impactful headings)
        "ts-xs": ["0.75rem", { lineHeight: "0.9rem", letterSpacing: "0" }],
        "ts-sm": ["0.875rem", { lineHeight: "1.05rem", letterSpacing: "0" }],
        "ts-base": ["1rem", { lineHeight: "1.2rem", letterSpacing: "0" }],
        "ts-lg": ["1.125rem", { lineHeight: "1.35rem", letterSpacing: "0" }],
        "ts-xl": ["1.25rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        "ts-2xl": ["1.5rem", { lineHeight: "1.8rem", letterSpacing: "0" }],
        "ts-3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "0" }],
        "ts-4xl": ["2.25rem", { lineHeight: "2.7rem", letterSpacing: "0" }],
        "ts-5xl": ["3rem", { lineHeight: "3.6rem", letterSpacing: "0" }],
        // Helvetica Neue sizes (120% leading)
        "helvetica-xs": ["0.75rem", { lineHeight: "0.9rem", letterSpacing: "0" }],
        "helvetica-sm": ["0.875rem", { lineHeight: "1.05rem", letterSpacing: "0" }],
        "helvetica-base": ["1rem", { lineHeight: "1.2rem", letterSpacing: "0" }],
        "helvetica-lg": ["1.125rem", { lineHeight: "1.35rem", letterSpacing: "0" }],
        "helvetica-xl": ["1.25rem", { lineHeight: "1.5rem", letterSpacing: "0" }],
        "helvetica-2xl": ["1.5rem", { lineHeight: "1.8rem", letterSpacing: "0" }],
        "helvetica-3xl": ["1.875rem", { lineHeight: "2.25rem", letterSpacing: "0" }],
        "helvetica-4xl": ["2.25rem", { lineHeight: "2.7rem", letterSpacing: "0" }],
        "helvetica-5xl": ["3rem", { lineHeight: "3.6rem", letterSpacing: "0" }],
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
