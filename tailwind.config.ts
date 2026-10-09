import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FFFFFF",
        surface: {
          DEFAULT: "#FFFFFF",
          soft: "#FAFAFA",
        },
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#1F1F1F",
          mute: "#525252",
          faint: "#737373",
        },
        hair: {
          DEFAULT: "#E5E5E5",
          soft: "#F0F0F0",
        },
        lime: {
          DEFAULT: "#CDFF4A",
          deep: "#B9EC2F",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "SF Pro Display",
          "system-ui",
          "sans-serif",
        ],
        mono: [
          "SF Mono",
          "JetBrains Mono",
          "ui-monospace",
          "Menlo",
          "monospace",
        ],
      },
      letterSpacing: {
        tightest: "-0.03em",
      },
    },
  },
  plugins: [],
};

export default config;
