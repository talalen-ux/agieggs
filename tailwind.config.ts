import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        canvas: "#FAFAFA",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#0A0A0A",
          soft: "#1F1F1F",
          mute: "#6B6B6B",
          faint: "#A0A0A0",
        },
        hair: "#E7E7E7",
        hair2: "#F0F0F0",
        lime: {
          DEFAULT: "#CDFF4A",
          deep: "#B9EC2F",
          glow: "#E6FF8E",
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
        display: [
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
        tightest: "-0.04em",
      },
      animation: {
        breathe: "breathe 6s ease-in-out infinite",
        float: "float 7s ease-in-out infinite",
        pulse_soft: "pulse_soft 3s ease-in-out infinite",
        egg_turn: "egg_turn 24s linear infinite",
        enter_up: "enter_up 700ms cubic-bezier(0.2, 0.8, 0.2, 1) both",
      },
      keyframes: {
        breathe: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.015)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pulse_soft: {
          "0%, 100%": { opacity: "0.6" },
          "50%": { opacity: "1" },
        },
        egg_turn: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        enter_up: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
