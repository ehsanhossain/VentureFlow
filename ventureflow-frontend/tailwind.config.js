import plugin from "tailwindcss/plugin";
import scrollbarPlugin from "tailwind-scrollbar";
import lineClampPlugin from "@tailwindcss/line-clamp";

/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "sans-serif"],
      },
      letterSpacing: {
        vfHeading: "-0.02em",
      },
    },
  },
  plugins: [
    scrollbarPlugin({ nocompatible: true }),
    lineClampPlugin,
    plugin(function ({ addComponents, theme }) {
      addComponents({
        ".custom-scrollbar": {
          scrollbarWidth: "thin",
          "&::-webkit-scrollbar": {
            width: "8px",
            height: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: theme("colors.gray.200", "#E5E7EB"),
            borderRadius: "10px",
          },
          "&::-webkit-scrollbar-thumb": {
            background: theme("colors.gray.500", "#888"),
            borderRadius: "10px",
            border: "2px solid transparent",
            backgroundClip: "content-box",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: theme("colors.gray.700", "#555"),
          },
        },
      });
    }),
  ],
};